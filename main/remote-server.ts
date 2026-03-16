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
} from './terminal-manager.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getWorkingDirectory } from './core-integration.js';
import { getSharedWorkspaceManager } from './shared-workspace-manager.js';
import { getChatStorage } from './chat-storage.js';
import { BrowserWindow } from 'electron';

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
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
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
      const { conversationId, model, provider } = req.body;

      if (!conversationId) {
        res.status(400).json({ error: 'Missing conversationId' });
        return;
      }

      const success = agentBridge.createConversation(conversationId, model, provider);

      if (success) {
        remoteConversationMeta.set(conversationId, {
          workspacePath: resolveWorkingDirectory(req),
          model,
          provider,
          createdAt: Date.now(),
        });
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
      const success = createTerminal(id, terminalCwd, cols || 80, rows || 24, mainWindow);

      // Setup output tracking for this terminal
      terminalOutputs.set(id, { callbacks: new Set(), buffer: [] });

      res.json({ success, id });
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
  app.get('/api/terminal/stream/:id', async (req, res) => {
    const { id } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', terminalId: id })}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    // Note: Full terminal output streaming would require modifications to terminal-manager
    // to support registering output callbacks. For now, this establishes the SSE connection.

    // Cleanup on close
    res.on('close', () => {
      clearInterval(keepAlive);
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
