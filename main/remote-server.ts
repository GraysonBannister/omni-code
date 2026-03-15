// Remote Access Server - Express HTTP server with ngrok tunnel
// Provides REST API for mobile app access to omni-code

import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as ngrok from '@ngrok/ngrok';
import { settingsManager } from './settings.js';
import { agentBridge } from './agent-bridge.js';
import { validateApiKey, getCorsOptions, ensureApiKey, getApiKey } from './remote-auth.js';
import {
  initializeEventEmitter,
  cleanupEventEmitter,
  registerConnection,
  registerSyncConnection,
  broadcastSyncEvent,
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
import type { SharedWorkspace, SharedFolder } from './shared-workspace-manager.js';
import { getChatStorage, setSyncNotifier } from './chat-storage.js';
import { BrowserWindow } from 'electron';
import QRCode from 'qrcode';

// Server state
let app: express.Express | null = null;
let server: ReturnType<typeof app.listen> | null = null;
let ngrokListener: ngrok.Listener | null = null;
let isRunning = false;
let publicUrl: string | null = null;
let port: number = 3000;

// Terminal output tracking for SSE
const terminalOutputs = new Map<string, { callbacks: Set<(data: string) => void>; buffer: string[] }>();

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

    // Wire chat-storage changes to SSE sync broadcasts
    setSyncNotifier((event) => broadcastSyncEvent(event));

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
  // Get server config
  app.get('/api/config', async (_req, res) => {
    try {
      // Get from agent bridge refs via IPC handler pattern
      const models = agentBridge.getActiveConversations();

      res.json({
        models,
        workingDirectory: getWorkingDirectory(),
        version: process.env.npm_package_version || 'unknown',
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get available AI models
  app.get('/api/models', async (_req, res) => {
    try {
      const models = agentBridge.getAvailableModels();

      res.json({
        models,
        count: models.length,
      });
    } catch (error) {
      console.error('[RemoteServer] Error fetching models:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
}

/**
 * Workspace routes
 */
function setupWorkspaceRoutes(app: express.Express): void {
  const workspaceManager = getSharedWorkspaceManager();

  // List all shared workspaces
  app.get('/api/workspaces', async (_req, res) => {
    try {
      const workspaces = workspaceManager.getSharedWorkspaces();
      const activeWorkspace = workspaceManager.getActiveWorkspace();

      res.json({
        workspaces: workspaces.map(ws => ({
          sharedId: ws.sharedId,
          workspaceId: ws.workspaceId,
          name: ws.name,
          folderCount: ws.folderCount,
          isActive: ws.isActive,
          isSingleFolder: ws.isSingleFolder,
          addedAt: ws.addedAt,
        })),
        activeWorkspaceId: activeWorkspace?.sharedId || null,
        count: workspaces.length,
      });
    } catch (error) {
      console.error('[RemoteServer] Error fetching workspaces:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get specific workspace details
  app.get('/api/workspaces/:sharedId', async (req, res) => {
    try {
      const { sharedId } = req.params;
      const workspace = workspaceManager.getWorkspaceById(sharedId);

      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }

      res.json({
        sharedId: workspace.sharedId,
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        folderCount: workspace.folderCount,
        folders: workspace.folders.map(f => ({
          id: f.id,
          path: f.path,
          name: f.name,
        })),
        isActive: workspace.isActive,
        isSingleFolder: workspace.isSingleFolder,
        addedAt: workspace.addedAt,
      });
    } catch (error) {
      console.error('[RemoteServer] Error fetching workspace:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get folders for a specific workspace
  app.get('/api/workspaces/:sharedId/folders', async (req, res) => {
    try {
      const { sharedId } = req.params;
      const folders = workspaceManager.getWorkspaceFolders(sharedId);

      if (folders.length === 0) {
        res.status(404).json({ error: 'Workspace not found or has no folders' });
        return;
      }

      res.json({
        sharedId,
        folders: folders.map(f => ({
          id: f.id,
          path: f.path,
          name: f.name,
        })),
        count: folders.length,
      });
    } catch (error) {
      console.error('[RemoteServer] Error fetching workspace folders:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Switch active workspace
  app.post('/api/workspaces/switch', async (req, res) => {
    try {
      const { sharedId } = req.body;

      if (!sharedId) {
        res.status(400).json({ error: 'Missing sharedId' });
        return;
      }

      const success = workspaceManager.setActiveWorkspace(sharedId);

      if (success) {
        const workspace = workspaceManager.getActiveWorkspace();
        res.json({
          success: true,
          activeWorkspace: workspace ? {
            sharedId: workspace.sharedId,
            name: workspace.name,
            workingDirectory: workspace.folders[0]?.path || null,
          } : null,
        });
      } else {
        res.status(400).json({ error: 'Failed to switch workspace - workspace not found' });
      }
    } catch (error) {
      console.error('[RemoteServer] Error switching workspace:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get current active workspace
  app.get('/api/workspaces/active', async (_req, res) => {
    try {
      const workspace = workspaceManager.getActiveWorkspace();

      if (!workspace) {
        res.json({
          activeWorkspace: null,
          workingDirectory: null,
        });
        return;
      }

      res.json({
        activeWorkspace: {
          sharedId: workspace.sharedId,
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          folderCount: workspace.folderCount,
          folders: workspace.folders.map(f => ({
            id: f.id,
            path: f.path,
            name: f.name,
          })),
          isSingleFolder: workspace.isSingleFolder,
        },
        workingDirectory: workspace.folders[0]?.path || null,
      });
    } catch (error) {
      console.error('[RemoteServer] Error fetching active workspace:', error);
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
      agentBridge.sendMessage(conversationId, message, workingDirectory).catch((error) => {
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
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get conversation summaries (from all shared workspaces)
  app.get('/api/agent/conversations', async (_req, res) => {
    try {
      const chatStorage = getChatStorage();
      
      // Get all shared workspaces
      const workspaceManager = getSharedWorkspaceManager();
      const activeWorkspace = workspaceManager.getActiveWorkspace();
      const allWorkspaces = workspaceManager.getSharedWorkspaces();
      const activeWorkspaceId = activeWorkspace?.sharedId || null;
      
      console.log('[DEBUG Server] Loading conversations from all', allWorkspaces.length, 'shared workspaces');
      
      // Load conversations from ALL shared workspaces
      const allConversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number; workspaceId: string | null }> = [];
      
      for (const workspace of allWorkspaces) {
        let workspaceConversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }> = [];
        
        console.log('[DEBUG Server] Processing workspace:', workspace.name, 'sharedId:', workspace.sharedId, 'folders:', workspace.folders.length);
        
        if (workspace.folders.length === 0) {
          console.log('[DEBUG Server] Workspace', workspace.name, 'has no folders, skipping');
          continue;
        }
        
        // First, try to load from workspace-specific storage
        const workspaceContext = {
          type: 'workspace' as const,
          workspace: {
            id: workspace.sharedId,
            name: workspace.name,
            folders: workspace.folders.map(f => ({ id: f.id, path: f.path })),
          },
        };
        const storageResult = await chatStorage.listConversations(workspaceContext);
        
        if (storageResult.conversations.length > 0) {
          workspaceConversations = storageResult.conversations;
          console.log('[DEBUG Server] Loaded', workspaceConversations.length, 'conversations from workspace storage for', workspace.name);
        } else {
          // Fall back to project storage
          const projectPath = workspace.folders[0].path;
          console.log('[DEBUG Server] Trying project storage for', workspace.name, 'at', projectPath);
          const projectResult = await chatStorage.listConversationsForProject(projectPath);
          if (projectResult.conversations.length > 0) {
            workspaceConversations = projectResult.conversations;
            console.log('[DEBUG Server] Loaded', workspaceConversations.length, 'conversations from project storage for', workspace.name);
          } else {
            console.log('[DEBUG Server] No conversations found for', workspace.name, 'in workspace or project storage');
          }
        }
        
        // Add workspaceId to each conversation and add to combined list
        for (const conv of workspaceConversations) {
          allConversations.push({
            ...conv,
            workspaceId: workspace.sharedId,
          });
        }
      }
      
      console.log('[DEBUG Server] Total conversations from all workspaces:', allConversations.length);
      
      // Get active conversations from agent bridge (for current workspace only)
      const activeConversationIds = agentBridge.getActiveConversations();
      
      // Create a map for quick lookup
      const savedMap = new Map(allConversations.map(c => [c.id, c]));
      
      // Add any active conversations not in saved list (in-memory only, for active workspace)
      for (const activeId of activeConversationIds) {
        if (!savedMap.has(activeId)) {
          allConversations.push({
            id: activeId,
            title: 'Active Conversation',
            updatedAt: Date.now(),
            messageCount: 0,
            workspaceId: activeWorkspaceId,
          });
        }
      }
      
      // Sort by updatedAt descending
      allConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      
      console.log('[DEBUG Server] Returning', allConversations.length, 'total conversations from all workspaces');
      
      res.json({ 
        conversations: allConversations,
        total: allConversations.length 
      });
    } catch (error) {
      console.error('[RemoteServer] Error in /api/agent/conversations:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Load a specific conversation by ID
  app.get('/api/agent/conversation/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const workspacePath = getWorkingDirectory();
      const chatStorage = getChatStorage();
      
      // Load all conversations and find the one we need
      const { conversations, error } = await chatStorage.loadConversationsForProject(workspacePath);
      
      if (error) {
        return res.status(500).json({ error });
      }
      
      const conversation = conversations.find(c => c.id === id);
      
      if (!conversation) {
        // Check if it's an active conversation in memory
        if (agentBridge.hasConversation(id)) {
          return res.json({
            id,
            title: 'Active Conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('[RemoteServer] Error in /api/agent/conversation/:id:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // SSE endpoint for conversation sync — receives lifecycle events (created/updated/deleted)
  app.get('/api/sync/events', (validateApiKey as RequestHandler), (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    registerSyncConnection(res);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'sync_connected', timestamp: Date.now() })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    res.on('close', () => {
      clearInterval(keepAlive);
    });
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

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
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

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);

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

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
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
      const dirPath = (req.query.path as string) || getWorkingDirectory();
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);

      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

      const files = entries.map((entry) => ({
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

      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
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

      const terminalCwd = cwd || getWorkingDirectory();
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

/**
 * Generate QR code for mobile connection
 * Returns a data URL containing the QR code image
 */
export async function generateConnectionQR(): Promise<{
  success: boolean;
  dataUrl?: string;
  error?: string;
}> {
  try {
    if (!isRunning || !publicUrl) {
      return {
        success: false,
        error: 'Server is not running. Start the remote server first.',
      };
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'No API key configured.',
      };
    }

    const serverName = (settingsManager.get('remoteAccess.serverName') as string) ||
      require('os').hostname() ||
      'Omni Code Server';

    const connectionData = {
      v: 1, // Version for future compatibility
      url: publicUrl,
      key: apiKey,
      name: serverName,
    };

    const jsonData = JSON.stringify(connectionData);

    const dataUrl = await QRCode.toDataURL(jsonData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      success: true,
      dataUrl,
    };
  } catch (error) {
    console.error('[RemoteServer] Failed to generate QR code:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
