// Remote Access Server - Express HTTP server with ngrok tunnel
// Provides REST API for mobile app access to omni-code

import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as ngrok from '@ngrok/ngrok';
import { settingsManager } from './settings.js';
import { agentBridge } from './agent-bridge.js';
import type { UnifiedMessage } from './agent-bridge.js';
import { validateApiKey, getCorsOptions, ensureApiKey, getApiKey } from './remote-auth.js';
import {
  initializeEventEmitter,
  cleanupEventEmitter,
  registerConnection,
  getConnectionStats,
} from './remote-event-emitter.js';
import {
  createTerminal,
  writeToTerminal,
  resizeTerminal,
  destroyTerminal,
  registerTerminalCallback,
  unregisterTerminalCallback,
  getTerminalBuffer,
} from './terminal-manager.js';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { getWorkingDirectory } from './core-integration.js';
import { getSharedWorkspaceManager } from './shared-workspace-manager.js';
import { getConfigModels, getConfigProviders } from './ipc-handlers.js';
import { getChatStorage } from './chat-storage.js';
import { BrowserWindow } from 'electron';
import simpleGit from 'simple-git';
import { GitManager } from '../src/git/git-manager.js';

const execAsync = promisify(exec);

/**
 * Resolve the working directory for a request.
 * Checks (in order): ?workspaceId query param, body.workspaceId, then the
 * active shared workspace, and finally falls back to the global cwd.
 */
function resolveWorkingDirectory(req: Request): string {
  const workspaceId =
    (req.query.workspaceId as string | undefined) ||
    (req.body?.workspaceId as string | undefined);

  if (workspaceId) {
    const cwd = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
    if (cwd) return cwd;
  }

  return getSharedWorkspaceManager().getActiveWorkingDirectory() ?? getWorkingDirectory();
}

// Server state
let app: express.Express | null = null;
let server: ReturnType<typeof app.listen> | null = null;
let ngrokListener: ngrok.Listener | null = null;
let isRunning = false;
let publicUrl: string | null = null;
let port: number = 3000;

// Terminal output tracking for SSE
const terminalOutputs = new Map<string, { callbacks: Set<(data: string) => void>; buffer: string[] }>();

// Registered proxy ports for reverse-proxying localhost services
const registeredProxyPorts = new Map<number, { name: string; registeredAt: number }>();

// Track metadata for remote-initiated conversations so they can be auto-saved
interface RemoteConversationMeta {
  workspacePath: string;
  model?: string;
  provider?: string;
  createdAt: number;
}
const remoteConversationMeta = new Map<string, RemoteConversationMeta>();

// Unsubscribe function for the agentBridge auto-save listener
let autoSaveUnsubscribe: (() => void) | null = null;

/**
 * Derive a conversation title from messages (first user message, truncated).
 */
function deriveConversationTitle(messages: UnifiedMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'Remote Conversation';
  const text = typeof firstUser.content === 'string'
    ? firstUser.content
    : String(firstUser.content);
  return text.length > 60 ? text.slice(0, 60).trim() + '…' : text.trim();
}

/**
 * Initialize the remote server (Express + ngrok)
 */
export async function initializeRemoteServer(): Promise<{
  success: boolean;
  url?: string;
  apiKey?: string;
  error?: string;
}> {
  if (isRunning) {
    return {
      success: true,
      url: publicUrl || undefined,
      apiKey: getApiKey() || undefined,
    };
  }

  try {
    // Get configuration from settings
    port = (settingsManager.get('remoteAccess.port') as number) || 3000;
    const ngrokAuthToken = settingsManager.get('remoteAccess.ngrokAuthToken') as string;

    // Ensure we have an API key
    const apiKey = ensureApiKey();

    // Create Express app
    app = express();

    // Apply middleware
    setupMiddleware(app);

    // Setup routes
    setupRoutes(app);

    // Register auto-save listener for remote-initiated conversations
    autoSaveUnsubscribe = agentBridge.onEvent(async (event) => {
      if (event.type !== 'turn_complete') return;

      const stopReason = (event.message as UnifiedMessage)?.metadata?.stopReason;
      if (stopReason === 'tool_use') return;

      const meta = remoteConversationMeta.get(event.conversationId);
      if (!meta) return; // not a remote conversation — skip, renderer handles it

      const snapshot = agentBridge.getConversationSnapshot(event.conversationId);
      console.log(`[RemoteServer] Auto-save snapshot: conversationId=${event.conversationId}, messages=${snapshot?.messages.length ?? 0}, roles=${snapshot?.messages.map(m => m.role).join(',') ?? 'none'}`);
      if (!snapshot || snapshot.messages.length === 0) return;

      try {
        await getChatStorage().saveConversation(meta.workspacePath, {
          id: event.conversationId,
          title: deriveConversationTitle(snapshot.messages),
          messages: snapshot.messages as unknown as import('../renderer/stores/appStore.js').Message[],
          toolCalls: [],
          createdAt: meta.createdAt,
          updatedAt: Date.now(),
          isProcessing: false,
          streamingContent: '',
          orchestrationStatus: null,
          model: snapshot.model,
          provider: snapshot.provider,
        });
        console.log(`[RemoteServer] Auto-saved conversation ${event.conversationId} to ${meta.workspacePath}`);
      } catch (err) {
        console.error(`[RemoteServer] Failed to auto-save conversation ${event.conversationId}:`, err);
      }
    });

    // Start Express server
    await new Promise<void>((resolve, reject) => {
      server = app!.listen(port, () => {
        console.log(`[RemoteServer] Express server running on port ${port}`);
        resolve();
      });

      server.on('error', (error) => {
        reject(error);
      });
    });

    // Setup ngrok tunnel
    if (ngrokAuthToken) {
      try {
        ngrokListener = await ngrok.forward({
          addr: port,
          authtoken: ngrokAuthToken,
        });

        publicUrl = ngrokListener.url() || null;
        console.log(`[RemoteServer] Ngrok tunnel established: ${publicUrl}`);
      } catch (error) {
        console.error('[RemoteServer] Failed to create ngrok tunnel:', error);
        // Continue without ngrok - local network access still works
        publicUrl = `http://localhost:${port}`;
      }
    } else {
      console.warn('[RemoteServer] No ngrok auth token configured. Only local access available.');
      publicUrl = `http://localhost:${port}`;
    }

    // Initialize event emitter for SSE
    initializeEventEmitter();

    isRunning = true;

    console.log('[RemoteServer] Remote access ready');
    console.log(`[RemoteServer] URL: ${publicUrl}`);
    console.log(`[RemoteServer] API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`);

    return {
      success: true,
      url: publicUrl || undefined,
      apiKey,
    };
  } catch (error) {
    console.error('[RemoteServer] Failed to initialize:', error);
    await cleanup();
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Stop the remote server
 */
export async function stopRemoteServer(): Promise<{ success: boolean; error?: string }> {
  if (!isRunning) {
    return { success: true };
  }

  try {
    await cleanup();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get current server status
 */
export function getRemoteServerStatus(): {
  running: boolean;
  url: string | null;
  apiKey: string | null;
  port: number;
  connections: {
    totalConversations: number;
    totalConnections: number;
    conversations: string[];
  };
} {
  return {
    running: isRunning,
    url: publicUrl,
    apiKey: getApiKey(),
    port,
    connections: getConnectionStats(),
  };
}

/**
 * Cleanup all server resources
 */
async function cleanup(): Promise<void> {
  // Remove auto-save listener
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }

  // Clear remote conversation tracking
  remoteConversationMeta.clear();

  // Cleanup event emitter
  cleanupEventEmitter();

  // Close ngrok tunnel
  if (ngrokListener) {
    try {
      await ngrokListener.close();
    } catch {
      // Ignore errors on close
    }
    ngrokListener = null;
  }

  // Close Express server
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        resolve();
      });
    });
    server = null;
  }

  app = null;
  isRunning = false;
  publicUrl = null;

  // Cleanup terminal output tracking
  terminalOutputs.clear();

  // Cleanup proxy port registry
  registeredProxyPorts.clear();

  console.log('[RemoteServer] Server stopped');
}

/**
 * Setup Express middleware
 */
function setupMiddleware(app: express.Express): void {
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));

  // Rate limiting
  const rateLimitWindowMs = (settingsManager.get('remoteAccess.rateLimitWindowMs') as number) || 15 * 60 * 1000;
  const rateLimitMax = (settingsManager.get('remoteAccess.rateLimitRequests') as number) || 100;

  const limiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
  });
  app.use(limiter);
}

/**
 * Setup all Express routes
 */
function setupRoutes(app: express.Express): void {
  // Public health check (no auth required)
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'ok',
      running: isRunning,
      url: publicUrl,
      timestamp: new Date().toISOString(),
    });
  });

  // Apply auth middleware to all /api routes except status
  app.use('/api', validateApiKey as RequestHandler);

  // Config routes
  setupConfigRoutes(app);

  // Workspace routes
  setupWorkspaceRoutes(app);

  // Chat history routes
  setupChatRoutes(app);

  // Agent routes
  setupAgentRoutes(app);

  // File routes
  setupFileRoutes(app);

  // Terminal routes
  setupTerminalRoutes(app);

  // Tool routes
  setupToolRoutes(app);

  // Git routes
  setupGitRoutes(app);

  // Proxy routes (reverse proxy to localhost ports)
  setupProxyRoutes(app);

  // ADB / device management routes
  setupAdbRoutes(app);

  // iOS device management routes (macOS host only)
  setupIosRoutes(app);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[RemoteServer] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

/**
 * Config routes
 */
function setupConfigRoutes(app: express.Express): void {
  // Get available models and providers
  app.get('/api/config', async (_req, res) => {
    try {
      const models = agentBridge.getActiveConversations();
      const sharedWM = getSharedWorkspaceManager();

      res.json({
        models,
        workingDirectory: sharedWM.getActiveWorkingDirectory() ?? getWorkingDirectory(),
        activeWorkspaceId: sharedWM.getActiveWorkspace()?.sharedId ?? null,
        version: process.env.npm_package_version || 'unknown',
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all available AI models from configured providers
  app.get('/api/models', async (_req, res) => {
    try {
      const models = getConfigModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all providers with their available models
  app.get('/api/providers', async (_req, res) => {
    try {
      const providers = getConfigProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Workspace routes — list all shared workspaces and manage the active one
 */
function setupWorkspaceRoutes(app: express.Express): void {
  // List all shared workspaces
  app.get('/api/workspaces', (_req, res) => {
    try {
      const workspaces = getSharedWorkspaceManager().getSharedWorkspaces();
      const activeId = getSharedWorkspaceManager().getActiveWorkspace()?.sharedId ?? null;
      res.json({ workspaces, activeWorkspaceId: activeId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get a single workspace by sharedId
  app.get('/api/workspaces/:workspaceId', (req, res) => {
    try {
      const workspace = getSharedWorkspaceManager().getWorkspaceById(req.params.workspaceId);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json({ workspace });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Set the active workspace
  app.post('/api/workspaces/active', (req, res) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) {
        res.status(400).json({ error: 'Missing workspaceId' });
        return;
      }
      const success = getSharedWorkspaceManager().setActiveWorkspace(workspaceId);
      if (!success) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json({ success: true, workspaceId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Chat history routes — list and load persisted conversations per workspace
 */
function setupChatRoutes(app: express.Express): void {
  // List saved conversation summaries for a workspace
  // GET /api/chat/list?workspaceId=:sharedId
  app.get('/api/chat/list', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      if (!workspaceId) {
        res.status(400).json({ error: 'Missing workspaceId' });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      const result = await getChatStorage().listConversations(workspacePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Load full conversation (with messages) by ID for a workspace
  // GET /api/chat/load/:conversationId?workspaceId=:sharedId
  app.get('/api/chat/load/:conversationId', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      if (!workspaceId) {
        res.status(400).json({ error: 'Missing workspaceId' });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      const result = await getChatStorage().loadConversations(workspacePath);
      const conversation = result.conversations?.find(
        (c) => c.id === req.params.conversationId
      ) ?? null;
      if (!conversation) {
        console.log(`[RemoteServer] loadConversation: NOT FOUND id=${req.params.conversationId}, available ids=[${result.conversations?.map(c => c.id).join(', ')}]`);
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      const msgRoles = (conversation.messages ?? []).map((m: { role: string }) => m.role).join(',');
      console.log(`[RemoteServer] loadConversation: found id=${conversation.id}, messageCount=${(conversation.messages ?? []).length}, roles=${msgRoles}`);
      res.json({ conversation });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Agent routes
 */
function setupAgentRoutes(app: express.Express): void {
  // Create conversation
  app.post('/api/agent/create-conversation', async (req, res) => {
    try {
      const { conversationId, model, provider, workingDirectory, mode } = req.body;

      if (!conversationId) {
        res.status(400).json({ error: 'Missing conversationId' });
        return;
      }

      // Resolve working directory: prefer explicit param, then workspace from request, then global cwd
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      const success = agentBridge.createConversation(conversationId, model, provider, resolvedCwd);

      if (success) {
        remoteConversationMeta.set(conversationId, {
          workspacePath: resolvedCwd,
          model,
          provider,
          createdAt: Date.now(),
        });

        // Apply mode immediately if provided
        if (mode) {
          await agentBridge.setMode(conversationId, mode);
          console.log(`[RemoteServer] Applied mode '${mode}' to conversation ${conversationId}`);
        }

        res.json({ success: true, conversationId });
      } else {
        res.status(400).json({ error: 'Failed to create conversation' });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Send message
  app.post('/api/agent/send-message', async (req, res) => {
    try {
      const { conversationId, message, workingDirectory } = req.body;

      if (!conversationId || !message) {
        res.status(400).json({ error: 'Missing conversationId or message' });
        return;
      }

      // Start the message processing (events will stream via SSE)
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      agentBridge.sendMessage(conversationId, message, resolvedCwd).catch((error) => {
        console.error(`[RemoteServer] Error sending message to ${conversationId}:`, error);
      });

      res.json({ success: true, conversationId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Abort conversation
  app.post('/api/agent/abort', async (req, res) => {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        res.status(400).json({ error: 'Missing conversationId' });
        return;
      }

      agentBridge.abort(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Close conversation
  app.post('/api/agent/close-conversation', async (req, res) => {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        res.status(400).json({ error: 'Missing conversationId' });
        return;
      }

      const success = agentBridge.closeConversation(conversationId);
      remoteConversationMeta.delete(conversationId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get active conversations
  app.get('/api/agent/conversations', async (_req, res) => {
    try {
      const conversations = agentBridge.getActiveConversations();
      res.json({ conversations });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // SSE endpoint for agent events
  app.get('/api/agent/events', async (req, res) => {
    const conversationId = req.query.conversationId as string | undefined;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Register this connection
    if (conversationId) {
      registerConnection(conversationId, res);
    }

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    // Cleanup on close
    res.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  // Respond to permission request
  app.post('/api/agent/respond-permission', async (req, res) => {
    try {
      const { toolId, decision } = req.body;

      if (!toolId || !decision) {
        res.status(400).json({ error: 'Missing toolId or decision' });
        return;
      }

      const success = agentBridge.respondPermission(toolId, decision);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Respond to user input request
  app.post('/api/agent/respond-user-input', async (req, res) => {
    try {
      const { requestId, response, cancelled } = req.body;

      if (!requestId) {
        res.status(400).json({ error: 'Missing requestId' });
        return;
      }

      const success = agentBridge.respondUserInput(requestId, response || '', cancelled || false);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Switch model for a conversation
  app.post('/api/agent/switch-model', async (req, res) => {
    try {
      const { conversationId, model, provider } = req.body;

      if (!conversationId || !model || !provider) {
        res.status(400).json({ error: 'Missing conversationId, model, or provider' });
        return;
      }

      const success = await agentBridge.switchModel(conversationId, model, provider);
      if (success) {
        console.log(`[RemoteServer] Switched model to ${model} (${provider}) for conversation ${conversationId}`);
        res.json({ success: true, conversationId, model, provider });
      } else {
        res.status(404).json({ error: 'Conversation not found or model switch failed' });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Set AI mode for a conversation
  app.post('/api/agent/set-mode', async (req, res) => {
    try {
      const { conversationId, mode } = req.body;

      if (!conversationId || !mode) {
        res.status(400).json({ error: 'Missing conversationId or mode' });
        return;
      }

      const result = await agentBridge.setMode(conversationId, mode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Truncate messages to a specific index
  app.post('/api/agent/truncate-messages', async (req, res) => {
    try {
      const { conversationId, messageIndex } = req.body;

      if (!conversationId || messageIndex === undefined) {
        res.status(400).json({ error: 'Missing conversationId or messageIndex' });
        return;
      }

      const index = parseInt(messageIndex, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ error: 'Invalid messageIndex' });
        return;
      }

      const success = agentBridge.truncateMessages(conversationId, index);

      if (success) {
        res.json({ success: true, messageIndex: index });
      } else {
        res.status(404).json({ error: 'Conversation not found or invalid message index' });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * File routes
 */
function setupFileRoutes(app: express.Express): void {
  // Read file
  app.get('/api/files/read', async (req, res) => {
    try {
      const filePath = req.query.path as string;

      if (!filePath) {
        res.status(400).json({ error: 'Missing path query parameter' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');

      res.json({ content, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Write file
  app.post('/api/files/write', async (req, res) => {
    try {
      const { path: filePath, content } = req.body;

      if (!filePath || content === undefined) {
        res.status(400).json({ error: 'Missing path or content' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

      // Write file
      await fs.writeFile(resolvedPath, content, 'utf-8');

      // Verify write
      const written = await fs.readFile(resolvedPath, 'utf-8');
      if (written !== content) {
        res.status(500).json({ error: 'Write verification failed' });
        return;
      }

      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Edit file (search and replace)
  app.post('/api/files/edit', async (req, res) => {
    try {
      const { path: filePath, oldString, newString } = req.body;

      if (!filePath || oldString === undefined || newString === undefined) {
        res.status(400).json({ error: 'Missing path, oldString, or newString' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');

      if (!content.includes(oldString)) {
        res.status(400).json({ error: 'Old string not found in file' });
        return;
      }

      const newContent = content.replace(oldString, newString);
      await fs.writeFile(resolvedPath, newContent, 'utf-8');

      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // List directory
  app.get('/api/files/list', async (req, res) => {
    try {
      const cwd = resolveWorkingDirectory(req);
      const dirPath = (req.query.path as string) || cwd;
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(cwd, dirPath);

      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

      const files = entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map((entry) => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: path.join(resolvedPath, entry.name),
        }));

      res.json({ files, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Download file as binary stream (for APKs, images, etc.)
  app.get('/api/files/download', async (req, res) => {
    try {
      const filePath = req.query.path as string;

      if (!filePath) {
        res.status(400).json({ error: 'Missing path query parameter' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);

      const stat = await fs.stat(resolvedPath);
      if (!stat.isFile()) {
        res.status(400).json({ error: 'Path is not a file' });
        return;
      }

      const fileName = path.basename(resolvedPath);
      const ext = path.extname(fileName).toLowerCase();

      const mimeTypes: Record<string, string> = {
        '.apk': 'application/vnd.android.package-archive',
        '.zip': 'application/zip',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.pdf': 'application/pdf',
      };

      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', stat.size);

      const readStream = fsSync.createReadStream(resolvedPath);
      readStream.pipe(res);
      readStream.on('error', (err) => {
        console.error('[RemoteServer] File download stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'File read error' });
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create directory
  app.post('/api/files/mkdir', async (req, res) => {
    try {
      const { path: dirPath } = req.body;

      if (!dirPath) {
        res.status(400).json({ error: 'Missing path' });
        return;
      }

      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(resolveWorkingDirectory(req), dirPath);
      await fs.mkdir(resolvedPath, { recursive: true });

      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete file or directory
  app.post('/api/files/delete', async (req, res) => {
    try {
      const { path: filePath } = req.body;

      if (!filePath) {
        res.status(400).json({ error: 'Missing path' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);
      const stat = await fs.stat(resolvedPath);

      if (stat.isDirectory()) {
        await fs.rm(resolvedPath, { recursive: true });
      } else {
        await fs.unlink(resolvedPath);
      }

      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Search files recursively by extension/pattern
  app.get('/api/files/search', async (req, res) => {
    try {
      const pattern = (req.query.pattern as string) || '*';
      const maxResults = Math.min(parseInt(req.query.maxResults as string) || 100, 500);
      const cwd = resolveWorkingDirectory(req);
      console.log(`[FileSearch] pattern=${pattern}, maxResults=${maxResults}, cwd=${cwd}`);

      const skipDirs = new Set([
        'node_modules', '.git', '.gradle', '.dart_tool', '.idea',
        '.vscode', '.cursor', '__pycache__', '.next', '.cache',
        'dist', '.build', 'Pods', 'build/intermediates', '.svn',
      ]);

      const ext = pattern.startsWith('*.') ? pattern.slice(1).toLowerCase() : null;
      const results: Array<{ name: string; path: string; relativePath: string; size: number }> = [];

      async function walk(dir: string, relativeBase: string): Promise<void> {
        if (results.length >= maxResults) return;
        let entries;
        try {
          entries = await fs.readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          if (entry.isDirectory()) {
            if (skipDirs.has(entry.name) || entry.name.startsWith('.')) continue;
            await walk(path.join(dir, entry.name), relativeBase ? `${relativeBase}/${entry.name}` : entry.name);
          } else if (entry.isFile()) {
            const matches = ext
              ? entry.name.toLowerCase().endsWith(ext)
              : true;
            if (matches) {
              const fullPath = path.join(dir, entry.name);
              const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
              let size = 0;
              try {
                const fileStat = await fs.stat(fullPath);
                size = fileStat.size;
              } catch { /* ignore */ }
              results.push({ name: entry.name, path: fullPath, relativePath, size });
            }
          }
        }
      }

      await walk(cwd, '');
      console.log(`[FileSearch] Found ${results.length} files matching ${pattern} in ${cwd}`);
      if (results.length === 0) {
        console.log(`[FileSearch] No files found — workspace root was: ${cwd}`);
      }
      res.json({ files: results, pattern, cwd });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Terminal routes
 */
function setupTerminalRoutes(app: express.Express): void {
  // Create terminal
  app.post('/api/terminal/create', async (req, res) => {
    try {
      const { id, cwd, cols, rows } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing terminal id' });
        return;
      }

      // Get main window for terminal creation
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        res.status(500).json({ error: 'No main window available' });
        return;
      }

      const terminalCwd = cwd || resolveWorkingDirectory(req);
      createTerminal(id, terminalCwd, cols || 80, rows || 24, mainWindow);

      // Setup output tracking for this terminal
      terminalOutputs.set(id, { callbacks: new Set(), buffer: [] });

      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Write to terminal
  app.post('/api/terminal/write', async (req, res) => {
    try {
      const { id, data } = req.body;

      if (!id || !data) {
        res.status(400).json({ error: 'Missing id or data' });
        return;
      }

      writeToTerminal(id, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Resize terminal
  app.post('/api/terminal/resize', async (req, res) => {
    try {
      const { id, cols, rows } = req.body;

      if (!id || cols === undefined || rows === undefined) {
        res.status(400).json({ error: 'Missing id, cols, or rows' });
        return;
      }

      resizeTerminal(id, cols, rows);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Destroy terminal
  app.post('/api/terminal/destroy', async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      destroyTerminal(id);
      terminalOutputs.delete(id);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // SSE endpoint for terminal output
  app.get('/api/terminal/stream/:id', (req, res) => {
    const { id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', terminalId: id })}\n\n`);

    // Replay any PTY output that was produced before this SSE client connected,
    // so the shell prompt and early output are never lost to a race condition.
    const buffered = getTerminalBuffer(id);
    if (buffered.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'stream_delta', delta: { text: buffered } })}\n\n`);
    }

    // Forward all future PTY output to this SSE client
    const onData = (data: string) => {
      res.write(`data: ${JSON.stringify({ type: 'stream_delta', delta: { text: data } })}\n\n`);
    };
    registerTerminalCallback(id, onData);

    // Keepalive ping
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    // Cleanup when client disconnects
    res.on('close', () => {
      clearInterval(keepAlive);
      unregisterTerminalCallback(id, onData);
    });
  });
}

/**
 * Tool routes
 */
function setupToolRoutes(app: express.Express): void {
  // List available tools
  app.get('/api/tools/list', async (_req, res) => {
    try {
      // This would need to be connected to the tools registry via IPC handlers
      // For now, return empty list
      res.json({ tools: [] });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Execute tool
  app.post('/api/tools/execute', async (req, res) => {
    try {
      const { toolName, input } = req.body;

      if (!toolName) {
        res.status(400).json({ error: 'Missing toolName' });
        return;
      }

      // This would need to be connected to the tools runner via IPC handlers
      // For now, return error
      res.status(501).json({ error: 'Tool execution not yet implemented via remote API' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Git routes - for retrieving git diff information
 */
function setupGitRoutes(app: express.Express): void {
  // Get git diff for a specific file with line-by-line change information
  app.get('/api/git/diff', async (req, res) => {
    try {
      const filePath = req.query.path as string;
      const staged = req.query.staged === 'true';

      if (!filePath) {
        res.status(400).json({ error: 'Missing path query parameter' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(resolveWorkingDirectory(req), filePath);
      const cwd = path.dirname(resolvedPath);
      const relativePath = path.basename(resolvedPath);

      // Initialize git in the file's directory
      const git = simpleGit(cwd);

      // Check if this is a git repository
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        res.json({ path: resolvedPath, changes: [], isGitRepo: false });
        return;
      }

      // Get the diff with unified=0 for line-by-line precision
      const diffArgs = staged ? ['--staged', '--unified=0', relativePath] : ['--unified=0', relativePath];
      const diffOutput = await git.diff(diffArgs);

      // Parse the diff to extract line change information
      const changes = parseGitDiff(diffOutput);

      res.json({
        path: resolvedPath,
        changes,
        isGitRepo: true,
        hasChanges: changes.length > 0,
      });
    } catch (error) {
      console.error('[RemoteServer] Git diff error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get git status for a directory - returns file statuses relative to the requested directory
  app.get('/api/git/status', async (req, res) => {
    try {
      const dirPath = req.query.path as string;

      console.log('[GitStatus] Request for path:', dirPath);

      if (!dirPath) {
        res.status(400).json({ error: 'Missing path query parameter' });
        return;
      }

      const resolvedPath = path.isAbsolute(dirPath)
        ? dirPath
        : path.join(resolveWorkingDirectory(req), dirPath);

      console.log('[GitStatus] Resolved path:', resolvedPath);

      // Use simpleGit directly to get the git root
      const git = simpleGit(resolvedPath);

      // Check if this is a git repository
      const isRepo = await git.checkIsRepo();
      console.log('[GitStatus] Is git repo:', isRepo);

      if (!isRepo) {
        res.json({
          isGitRepo: false,
          branch: null,
          files: {},
        });
        return;
      }

      // Get the actual git root so we can compute relative paths correctly
      const gitRoot = (await git.revparse(['--show-toplevel'])).trim();
      console.log('[GitStatus] Git root:', gitRoot);

      // Compute path of requested directory relative to git root
      const relativeRequestedDir = path.relative(gitRoot, resolvedPath);
      console.log('[GitStatus] Relative requested dir:', relativeRequestedDir);

      // Returns the file path relative to the requested directory, or null if not in its subtree.
      // git status always returns paths relative to the git root, so we must adjust.
      const getRelPath = (gitRelPath: string): string | null => {
        const normalized = gitRelPath.replace(/\\/g, '/');
        if (!relativeRequestedDir || relativeRequestedDir === '.') {
          // We are at the git root — return the full relative path (e.g. 'lib/main.dart')
          return normalized;
        }
        const prefix = relativeRequestedDir.replace(/\\/g, '/') + '/';
        if (normalized.startsWith(prefix)) {
          // Strip the directory prefix so the path is relative to resolvedPath
          return normalized.slice(prefix.length);
        }
        return null; // file is not within the requested directory
      };

      // Get structured git status
      const gitManager = new GitManager(gitRoot);
      const status = await gitManager.statusStructured();

      console.log('[GitStatus] Raw git status - modified:', status.modified.length, 'untracked:', status.not_added.length);

      // Build a map of relative paths to their git status
      const fileStatuses: Record<string, string> = {};

      const addStatus = (gitRelPath: string, statusValue: string, overwrite = true) => {
        const relPath = getRelPath(gitRelPath);
        if (relPath === null) return;
        if (overwrite || !(relPath in fileStatuses)) {
          fileStatuses[relPath] = statusValue;
        }
      };

      // Untracked files (new files not yet tracked by git)
      for (const file of status.not_added) {
        addStatus(file, 'untracked');
      }

      // Modified files
      for (const file of status.modified) {
        addStatus(file, 'modified');
      }

      // Staged files (don't overwrite if already marked as modified)
      for (const file of status.staged) {
        addStatus(file, 'staged', false);
      }

      // Created files (staged new files)
      for (const file of status.created) {
        addStatus(file, 'staged', false);
      }

      // Deleted files
      for (const file of status.deleted) {
        addStatus(file, 'deleted');
      }

      // Renamed files
      for (const rename of status.renamed) {
        addStatus(rename.to, 'renamed');
      }

      // Conflicted files
      for (const file of status.conflicted) {
        addStatus(file, 'conflicted');
      }

      console.log('[GitStatus] Response - files count:', Object.keys(fileStatuses).length);
      console.log('[GitStatus] First few files:', Object.entries(fileStatuses).slice(0, 5));

      res.json({
        isGitRepo: true,
        branch: status.current,
        files: fileStatuses,
      });
    } catch (error) {
      console.error('[RemoteServer] Git status error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Reverse proxy routes — forward requests to localhost services through the
 * existing ngrok tunnel so remote clients can view dev servers, etc.
 */
function setupProxyRoutes(app: express.Express): void {
  // Register a port for proxying
  app.post('/api/proxy/register', (req, res) => {
    try {
      const proxyEnabled = settingsManager.get('remoteAccess.proxyEnabled') as boolean;
      if (!proxyEnabled) {
        res.status(403).json({ error: 'Proxy is disabled in settings' });
        return;
      }

      const { port: targetPort, name } = req.body;

      if (!targetPort || typeof targetPort !== 'number') {
        res.status(400).json({ error: 'Missing or invalid port (must be a number)' });
        return;
      }

      const allowedPorts = settingsManager.get('remoteAccess.proxyAllowedPorts') as number[];
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }

      registeredProxyPorts.set(targetPort, {
        name: name || `localhost:${targetPort}`,
        registeredAt: Date.now(),
      });

      console.log(`[RemoteServer] Registered proxy port ${targetPort} as "${name || `localhost:${targetPort}`}"`);
      res.json({ success: true, port: targetPort });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Unregister a port
  app.delete('/api/proxy/:port', (req, res) => {
    try {
      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: 'Invalid port' });
        return;
      }

      const deleted = registeredProxyPorts.delete(targetPort);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // List registered proxy ports
  app.get('/api/proxy/list', (_req, res) => {
    try {
      const proxyEnabled = settingsManager.get('remoteAccess.proxyEnabled') as boolean;
      const ports = Array.from(registeredProxyPorts.entries()).map(([p, info]) => ({
        port: p,
        name: info.name,
        registeredAt: info.registeredAt,
      }));
      res.json({ enabled: proxyEnabled, ports });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reverse proxy: forward all methods to localhost:{port}/{path}
  app.all('/api/proxy/:port/*', (req, res) => {
    try {
      const proxyEnabled = settingsManager.get('remoteAccess.proxyEnabled') as boolean;
      if (!proxyEnabled) {
        res.status(403).json({ error: 'Proxy is disabled in settings' });
        return;
      }

      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: 'Invalid port' });
        return;
      }

      const allowedPorts = settingsManager.get('remoteAccess.proxyAllowedPorts') as number[];
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }

      // Extract the downstream path (everything after /api/proxy/:port/)
      const prefix = `/api/proxy/${targetPort}/`;
      const downstreamPath = '/' + req.originalUrl.slice(req.originalUrl.indexOf(prefix) + prefix.length);

      // Build proxy request headers, stripping auth/host
      const proxyHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lk = key.toLowerCase();
        if (lk === 'host' || lk === 'x-api-key' || lk === 'connection') continue;
        if (typeof value === 'string') proxyHeaders[key] = value;
      }
      proxyHeaders['host'] = `localhost:${targetPort}`;

      const proxyReq = http.request(
        {
          hostname: 'localhost',
          port: targetPort,
          path: downstreamPath,
          method: req.method,
          headers: proxyHeaders,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', (err) => {
        console.error(`[RemoteServer] Proxy error for localhost:${targetPort}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: `Cannot reach localhost:${targetPort} — ${err.message}` });
        }
      });

      // Pipe the incoming body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * ADB / device management routes — run ADB commands on the host to manage
 * connected Android devices (USB or wireless).
 */
function setupAdbRoutes(app: express.Express): void {
  const getAdbPath = (): string => {
    return (settingsManager.get('adb.path') as string) || 'adb';
  };

  const isAdbEnabled = (): boolean => {
    return (settingsManager.get('adb.enabled') as boolean) !== false;
  };

  // List connected ADB devices
  app.get('/api/adb/devices', async (_req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: 'ADB is disabled in settings' });
        return;
      }

      const adb = getAdbPath();
      const { stdout } = await execAsync(`${adb} devices -l`);
      const lines = stdout.trim().split('\n').slice(1); // skip "List of devices attached"

      const devices = lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split(/\s+/);
          const id = parts[0];
          const state = parts[1]; // device, offline, unauthorized, etc.
          const props: Record<string, string> = {};
          for (let i = 2; i < parts.length; i++) {
            const kv = parts[i].split(':');
            if (kv.length === 2) props[kv[0]] = kv[1];
          }
          return { id, state, model: props['model'] || null, product: props['product'] || null, transport: props['transport_id'] || null };
        });

      res.json({ devices });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * Try to extract the package name from an APK using aapt/aapt2/apkanalyzer.
   * Returns null if no tool is available.
   */
  async function extractApkPackageName(apkPath: string): Promise<string | null> {
    // Try aapt (standard Android SDK build-tools)
    const aaptCandidates = ['aapt', 'aapt2'];
    for (const tool of aaptCandidates) {
      try {
        const { stdout } = await execAsync(`${tool} dump badging "${apkPath}" 2>/dev/null`, { timeout: 15000 });
        const m = stdout.match(/^package:\s+name='([^']+)'/m);
        if (m) {
          console.log(`[AdbInstall] Extracted package name via ${tool}: ${m[1]}`);
          return m[1];
        }
      } catch { /* tool not available */ }
    }
    // Try apkanalyzer (comes with Android Studio cmdline-tools)
    try {
      const { stdout } = await execAsync(`apkanalyzer manifest application-id "${apkPath}" 2>/dev/null`, { timeout: 15000 });
      const pkg = stdout.trim();
      if (pkg && pkg.includes('.')) {
        console.log(`[AdbInstall] Extracted package name via apkanalyzer: ${pkg}`);
        return pkg;
      }
    } catch { /* not available */ }
    // Last resort: parse package name from adb shell pm list packages after install
    // (not attempted here — no reliable pre-install option)
    console.log('[AdbInstall] Could not extract package name — no aapt/aapt2/apkanalyzer found');
    return null;
  }

  // Install APK on device
  app.post('/api/adb/install', async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: 'ADB is disabled in settings' });
        return;
      }

      const { filePath, deviceId } = req.body;

      if (!filePath) {
        res.status(400).json({ error: 'Missing filePath' });
        return;
      }

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(resolveWorkingDirectory(req), filePath);

      try {
        await fs.access(resolvedPath);
      } catch {
        res.status(404).json({ error: `File not found: ${resolvedPath}` });
        return;
      }

      // Extract package name before installing (aapt can read the APK without a device)
      const packageName = await extractApkPackageName(resolvedPath);

      const adb = getAdbPath();
      const deviceFlag = deviceId ? `-s ${deviceId}` : '';
      const { stdout, stderr } = await execAsync(`${adb} ${deviceFlag} install -r "${resolvedPath}"`, { timeout: 120000 });

      const success = stdout.includes('Success') || stdout.includes('success');
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), packageName });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Launch an app on device
  app.post('/api/adb/launch', async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: 'ADB is disabled in settings' });
        return;
      }

      const { packageName, activityName, deviceId } = req.body;

      if (!packageName) {
        res.status(400).json({ error: 'Missing packageName' });
        return;
      }

      const adb = getAdbPath();
      const deviceFlag = deviceId ? `-s ${deviceId}` : '';
      const component = activityName ? `${packageName}/${activityName}` : packageName;

      let cmd: string;
      if (activityName) {
        cmd = `${adb} ${deviceFlag} shell am start -n ${component}`;
      } else {
        cmd = `${adb} ${deviceFlag} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
      }

      const { stdout, stderr } = await execAsync(cmd);
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Pair a device for wireless debugging
  app.post('/api/adb/wireless-pair', async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: 'ADB is disabled in settings' });
        return;
      }

      const { ip, port: pairingPort, pairingCode } = req.body;

      if (!ip || !pairingPort || !pairingCode) {
        res.status(400).json({ error: 'Missing ip, port, or pairingCode' });
        return;
      }

      const adb = getAdbPath();
      const { stdout, stderr } = await execAsync(
        `echo "${pairingCode}" | ${adb} pair ${ip}:${pairingPort}`,
        { timeout: 30000 },
      );

      const success = stdout.toLowerCase().includes('successfully paired');
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Stream logcat output via SSE
  app.get('/api/adb/logcat', (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: 'ADB is disabled in settings' });
        return;
      }

      const packageFilter = req.query.package as string | undefined;
      const deviceId = req.query.deviceId as string | undefined;

      const adb = getAdbPath();
      const args: string[] = [];
      if (deviceId) args.push('-s', deviceId);
      args.push('logcat', '-v', 'time');
      if (packageFilter) {
        args.push('--pid', '$(pidof ' + packageFilter + ')');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const logcat = spawn(adb, args);

      logcat.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter((l) => l.trim());
        for (const line of lines) {
          res.write(`data: ${JSON.stringify({ line })}\n\n`);
        }
      });

      logcat.stderr.on('data', (data: Buffer) => {
        res.write(`data: ${JSON.stringify({ error: data.toString() })}\n\n`);
      });

      logcat.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'closed', code })}\n\n`);
        res.end();
      });

      const keepAlive = setInterval(() => {
        res.write(':keepalive\n\n');
      }, 30000);

      res.on('close', () => {
        clearInterval(keepAlive);
        logcat.kill();
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * iOS device management routes — list connected iOS devices and install IPAs.
 * Requires macOS host with Xcode CLT (xcrun) or ios-deploy / ideviceinstaller.
 */
function setupIosRoutes(app: express.Express): void {
  const isIosSupported = (): boolean => process.platform === 'darwin';

  /**
   * Parse `xcrun xctrace list devices` output.
   * Physical devices appear under "== Devices ==" before the simulators section.
   */
  function parseXctraceDevices(
    output: string,
  ): Array<{ udid: string; name: string; osVersion: string; type: string }> {
    const devices: Array<{ udid: string; name: string; osVersion: string; type: string }> = [];
    const lines = output.split('\n');
    let inDevicesSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '== Devices ==') { inDevicesSection = true; continue; }
      if (trimmed.startsWith('==')) {
        if (inDevicesSection) break; // stop at Simulators / Disconnected Devices
        continue;
      }
      if (!inDevicesSection || !trimmed) continue;

      // Format: "Device Name (OS Version) (UDID)"
      const match = trimmed.match(/^(.+?)\s+\(([^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)\s*$/);
      if (match) {
        devices.push({ name: match[1].trim(), osVersion: match[2], udid: match[3], type: 'physical' });
      }
    }
    return devices;
  }

  // List connected iOS physical devices
  app.get('/api/ios/devices', async (_req, res) => {
    console.log('[IosDevices] Request received');

    if (!isIosSupported()) {
      res.status(403).json({ error: 'iOS device management requires a macOS host', devices: [] });
      return;
    }

    // Try xcrun xctrace first (ships with Xcode CLT)
    try {
      const { stdout } = await execAsync('xcrun xctrace list devices 2>&1', { timeout: 12000 });
      console.log('[IosDevices] xcrun output length:', stdout.length);
      const devices = parseXctraceDevices(stdout);
      console.log(`[IosDevices] xcrun found ${devices.length} physical devices`);
      res.json({ devices, tool: 'xcrun' });
      return;
    } catch (err) {
      console.warn('[IosDevices] xcrun failed:', (err as Error).message);
    }

    // Fall back to ios-deploy --detect
    try {
      const { stdout } = await execAsync(
        'ios-deploy --detect --timeout 5 2>&1',
        { timeout: 12000 },
      );
      console.log('[IosDevices] ios-deploy output:', stdout.slice(0, 300));
      // ios-deploy output: "[....] Found UDID:name (iOS VERSION) (UDID)"
      const devices: Array<{ udid: string; name: string; osVersion: string; type: string }> = [];
      const re = /Found\s+(.+?)\s+\((iOS [^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(stdout)) !== null) {
        devices.push({ name: m[1].trim(), osVersion: m[2], udid: m[3], type: 'physical' });
      }
      console.log(`[IosDevices] ios-deploy found ${devices.length} devices`);
      res.json({ devices, tool: 'ios-deploy' });
      return;
    } catch (err) {
      console.warn('[IosDevices] ios-deploy failed:', (err as Error).message);
    }

    // Fall back to idevice_id from libimobiledevice
    try {
      const { stdout: idList } = await execAsync('idevice_id -l', { timeout: 8000 });
      const udids = idList.trim().split('\n').filter(Boolean);
      const devices: Array<{ udid: string; name: string; osVersion: string; type: string }> = [];
      for (const udid of udids) {
        try {
          const { stdout: info } = await execAsync(
            `ideviceinfo -u ${udid} -k DeviceName 2>/dev/null; ideviceinfo -u ${udid} -k ProductVersion 2>/dev/null`,
          );
          const lines = info.trim().split('\n');
          devices.push({
            udid,
            name: lines[0]?.trim() || udid,
            osVersion: lines[1]?.trim() || 'unknown',
            type: 'physical',
          });
        } catch {
          devices.push({ udid, name: udid, osVersion: 'unknown', type: 'physical' });
        }
      }
      console.log(`[IosDevices] libimobiledevice found ${devices.length} devices`);
      res.json({ devices, tool: 'libimobiledevice' });
      return;
    } catch (err) {
      console.warn('[IosDevices] libimobiledevice failed:', (err as Error).message);
    }

    console.warn('[IosDevices] No iOS tools available');
    res.status(503).json({
      error:
        'No iOS tools found. Install Xcode Command Line Tools: xcode-select --install, ' +
        'or ios-deploy: npm install -g ios-deploy, ' +
        'or libimobiledevice: brew install libimobiledevice',
      devices: [],
    });
  });

  // Install IPA on a connected iOS device
  app.post('/api/ios/install', async (req, res) => {
    console.log('[IosInstall] Request received:', req.body);

    if (!isIosSupported()) {
      res.status(403).json({ error: 'iOS device management requires a macOS host' });
      return;
    }

    const { filePath, deviceId } = req.body as { filePath?: string; deviceId?: string };
    if (!filePath) {
      res.status(400).json({ error: 'Missing filePath' });
      return;
    }

    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(resolveWorkingDirectory(req), filePath);

    try {
      await fs.access(resolvedPath);
    } catch {
      res.status(404).json({ error: `File not found: ${resolvedPath}` });
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext !== '.ipa' && ext !== '.app') {
      res.status(400).json({ error: `Unsupported file type: ${ext}. Expected .ipa or .app` });
      return;
    }

    // Try ios-deploy
    try {
      const deviceFlag = deviceId ? `--id ${deviceId}` : '';
      console.log(`[IosInstall] Trying ios-deploy: ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`,
        { timeout: 180000 },
      );
      console.log('[IosInstall] ios-deploy success:', stdout.slice(0, 200));
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim(), tool: 'ios-deploy' });
      return;
    } catch (e) {
      console.warn('[IosInstall] ios-deploy failed:', (e as Error).message);
    }

    // Try ideviceinstaller
    try {
      const deviceFlag = deviceId ? `-u ${deviceId}` : '';
      console.log(`[IosInstall] Trying ideviceinstaller: ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`,
        { timeout: 180000 },
      );
      const success =
        stdout.toLowerCase().includes('complete') ||
        stdout.toLowerCase().includes('installcomplete');
      console.log('[IosInstall] ideviceinstaller result:', { success, stdout: stdout.slice(0, 200) });
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), tool: 'ideviceinstaller' });
      return;
    } catch (e) {
      console.warn('[IosInstall] ideviceinstaller failed:', (e as Error).message);
    }

    res.status(503).json({
      error:
        'No iOS install tools found. ' +
        'Install ios-deploy: npm install -g ios-deploy, ' +
        'or ideviceinstaller: brew install ideviceinstaller',
    });
  });
}

/**
 * Parse git diff output to extract line change information
 * Returns array of changes with line numbers and types
 */
interface LineChange {
  lineNumber: number;
  type: 'added' | 'deleted' | 'modified';
}

function parseGitDiff(diffOutput: string): LineChange[] {
  const changes: LineChange[] = [];
  const lines = diffOutput.split('\n');

  let currentNewLine = 0;
  let inHunk = false;

  for (const line of lines) {
    // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentNewLine = parseInt(hunkMatch[2], 10);
      inHunk = true;
      continue;
    }

    if (!inHunk) continue;

    // Added line (starts with + but not +++ for file header)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      changes.push({
        lineNumber: currentNewLine,
        type: 'added',
      });
      currentNewLine++;
    }
    // Deleted line (starts with - but not --- for file header)
    else if (line.startsWith('-') && !line.startsWith('---')) {
      // Deleted lines don't have a line number in the new file
      // We mark them with a special handling - they represent removed content
      // For visualization, we note the line before which content was removed
      changes.push({
        lineNumber: currentNewLine,
        type: 'deleted',
      });
    }
    // Unchanged context line
    else if (line.startsWith(' ')) {
      currentNewLine++;
    }
    // End of diff for this file
    else if (line.startsWith('diff --git')) {
      inHunk = false;
    }
  }

  return changes;
}
