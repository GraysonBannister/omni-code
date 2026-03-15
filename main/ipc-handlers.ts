import { ipcMain, BrowserWindow, IpcMainInvokeEvent, dialog } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { setWorkingDirectory, getWorkingDirectory, setPermissionMode } from './core-integration.js';
import { getChatStorage } from './chat-storage.js';
import { getWorkspaceStorage } from './workspace-storage.js';
import type { Workspace, CreateWorkspaceOptions } from '../src/types/workspace.js';
import {
  getWorkspaceIndexer,
  closeWorkspaceIndexer,
  closeAllWorkspaceIndexers,
} from '../src/memory/workspace-indexer.js';
import { getUsageStorage } from './usage-storage.js';
import { getFileHistoryManager } from './file-history.js';
import { requestNotificationSound } from './notifications.js';
import {
  createTerminal,
  writeToTerminal,
  resizeTerminal,
  destroyTerminal,
  destroyAllTerminals,
} from './terminal-manager.js';
import { setupSettingsIpcHandlers, cleanupSettingsIpcHandlers } from './settings.js';

// Reference to main window for sending browser events to renderer
let mainWindowRef: BrowserWindow | null = null;
import {
  DEFAULT_CHUNK_THRESHOLD_BYTES,
  writeLargeFile,
} from '../src/utils/large-file-writer.js';
import type { Conversation } from '../renderer/stores/appStore.js';
import {
  getProjectIndexer,
  closeProjectIndexer,
  closeAllProjectIndexers,
  type IndexingState,
} from '../src/memory/project-indexer.js';
import type { MemoryChunk } from '../src/memory/persistent-store.js';

// This file sets up IPC handlers that will be connected to the Agent and Tools
// The actual implementations will be provided by the agent-bridge

// Store references to be set by agent-bridge
// Updated to support multiple conversations per the multi-tab chat feature
let agentRef: {
  createConversation: (conversationId: string, model?: string, provider?: string) => boolean;
  closeConversation: (conversationId: string) => boolean;
  hasConversation: (conversationId: string) => boolean;
  sendMessage: (conversationId: string, message: string, workingDirectory?: string) => Promise<void>;
  abort: (conversationId: string) => void;
  switchModel: (conversationId: string, model: string, provider: string) => Promise<boolean>;
  setMode: (conversationId: string, mode: string) => Promise<{ success: boolean; mode: string }>;
  clearConversation: (conversationId: string) => void;
  getTokenCount: (conversationId: string) => Promise<number>;
  respondPermission: (toolId: string, decision: 'allow' | 'deny' | 'allowAlways') => boolean;
  respondUserInput: (requestId: string, response: string, cancelled: boolean) => boolean;
  onEvent: (callback: (event: unknown) => void) => () => void;
} | null = null;

let toolsRef: {
  execute: (toolName: string, input: Record<string, unknown>) => Promise<unknown>;
  list: () => Array<{ name: string; description: string; category: string; permissionLevel: string }>;
} | null = null;

let configRef: {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  getModels: () => Array<{ id: string; name: string; provider: string; available: boolean }>;
  getProviders: () => Array<{ name: string; available: boolean; models: string[] }>;
} | null = null;

// Chat storage reference
let chatStorageRef = getChatStorage();

// File watchers
const fileWatchers = new Map<string, AbortController>();
const FILE_WRITE_TIMEOUT_MS = 15000;

export function setAgentRef(agent: typeof agentRef): void {
  agentRef = agent;
}

export function setToolsRef(tools: typeof toolsRef): void {
  toolsRef = tools;
}

export function setConfigRef(config: typeof configRef): void {
  configRef = config;
}

export function setupIpcHandlers(): void {
  // Note: setupSettingsIpcHandlers() is called in electron.ts, not here
  // to avoid duplicate handler registration

  // Agent handlers - now conversation-scoped for multi-tab support
  ipcMain.handle('agent:create-conversation', async (_: IpcMainInvokeEvent, conversationId: string, model?: string, provider?: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return agentRef.createConversation(conversationId, model, provider);
  });

  ipcMain.handle('agent:close-conversation', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return agentRef.closeConversation(conversationId);
  });

  ipcMain.handle('agent:has-conversation', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return agentRef.hasConversation(conversationId);
  });

  ipcMain.handle('agent:send-message', async (_: IpcMainInvokeEvent, conversationId: string, message: string, workingDirectory?: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    await agentRef.sendMessage(conversationId, message, workingDirectory);
  });

  ipcMain.handle('agent:abort', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    agentRef.abort(conversationId);
  });

  ipcMain.handle('agent:switch-model', async (_: IpcMainInvokeEvent, conversationId: string, model: string, provider: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.switchModel(conversationId, model, provider);
  });

  ipcMain.handle('agent:clear-conversation', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    agentRef.clearConversation(conversationId);
  });

  ipcMain.handle('agent:get-token-count', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.getTokenCount(conversationId);
  });

  ipcMain.handle('agent:respond-permission', async (_: IpcMainInvokeEvent, toolId: string, decision: 'allow' | 'deny' | 'allowAlways') => {
    if (!agentRef) throw new Error('Agent not initialized');
    return { success: agentRef.respondPermission(toolId, decision) };
  });

  ipcMain.handle('agent:respond-user-input', async (_: IpcMainInvokeEvent, requestId: string, response: string, cancelled: boolean) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return { success: agentRef.respondUserInput(requestId, response, cancelled) };
  });

  ipcMain.handle('agent:set-mode', async (_: IpcMainInvokeEvent, conversationId: string, mode: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.setMode(conversationId, mode);
  });

  ipcMain.handle('agent:set-permission-mode', (_: IpcMainInvokeEvent, autoRunMode: string) => {
    setPermissionMode(autoRunMode);
  });

  // Tools metadata handler
  ipcMain.handle('tools:get-metadata', async (_: IpcMainInvokeEvent, toolName: string) => {
    if (!toolsRef) return null;
    const tools = toolsRef.list();
    return tools.find(t => t.name === toolName) || null;
  });

  // Chat storage handlers (project-level chats)
  ipcMain.handle('chat:save', async (_: IpcMainInvokeEvent, projectPath: string, conversation: Conversation) => {
    return chatStorageRef.saveConversationForProject(projectPath, conversation);
  });

  ipcMain.handle('chat:load', async (_: IpcMainInvokeEvent, projectPath: string) => {
    return chatStorageRef.loadConversationsForProject(projectPath);
  });

  ipcMain.handle('chat:delete', async (_: IpcMainInvokeEvent, projectPath: string, conversationId: string) => {
    const result = await chatStorageRef.deleteConversationForProject(projectPath, conversationId);
    // Also clear file history for this conversation
    try {
      const fileHistoryManager = getFileHistoryManager(projectPath);
      await fileHistoryManager.clearConversation(conversationId);
    } catch (error) {
      console.error('[IPC] Failed to clear file history for conversation:', error);
    }
    return result;
  });

  ipcMain.handle('chat:list', async (_: IpcMainInvokeEvent, projectPath: string) => {
    return chatStorageRef.listConversationsForProject(projectPath);
  });

  // File handlers
  ipcMain.handle('file:read', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Resolve relative paths using the current working directory
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return { content };
    } catch (error) {
      return { content: '', error: (error as Error).message };
    }
  });

  ipcMain.handle('file:write', async (_: IpcMainInvokeEvent, filePath: string, content: string) => {
    try {
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      // Ensure directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), FILE_WRITE_TIMEOUT_MS);
      const byteLength = Buffer.byteLength(content, 'utf-8');
      const needsChunking = byteLength > DEFAULT_CHUNK_THRESHOLD_BYTES;

      try {
        if (needsChunking) {
          const metadata = await writeLargeFile(resolvedPath, content, {
            signal: timeoutController.signal,
          });
          return { success: true, metadata };
        }

        await fs.writeFile(resolvedPath, content, {
          encoding: 'utf-8',
          signal: timeoutController.signal,
        });

        const writtenContent = await fs.readFile(resolvedPath, 'utf-8');
        if (writtenContent !== content) {
          return { success: false, error: 'Write verification failed after saving file.' };
        }

        return {
          success: true,
          metadata: {
            chunkCount: 1,
            bytesWritten: byteLength,
            verified: true,
            usedChunking: false,
          },
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          error: `Write timed out after ${FILE_WRITE_TIMEOUT_MS / 1000}s. Try saving a smaller file or chunking the content.`,
        };
      }
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:edit', async (_: IpcMainInvokeEvent, filePath: string, oldString: string, newString: string) => {
    try {
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      
      if (!content.includes(oldString)) {
        return { success: false, error: 'Old string not found in file' };
      }
      
      const newContent = content.replace(oldString, newString);
      await fs.writeFile(resolvedPath, newContent, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:list', async (_: IpcMainInvokeEvent, dirPath: string) => {
    try {
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      
      const files = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(resolvedPath, entry.name),
      }));
      
      return { files };
    } catch (error) {
      return { files: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('file:mkdir', async (_: IpcMainInvokeEvent, dirPath: string) => {
    try {
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
      await fs.mkdir(resolvedPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:watch', async (event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
      
      // Stop existing watcher if any
      const existing = fileWatchers.get(resolvedPath);
      if (existing) {
        existing.abort();
      }
      
      const abortController = new AbortController();
      fileWatchers.set(resolvedPath, abortController);
      
      // Use fs.watch if available, otherwise fallback to polling
      const { watch } = await import('node:fs');
      const watcher = watch(resolvedPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        const fullPath = path.join(resolvedPath, filename);
        
        // Send to all windows
        BrowserWindow.getAllWindows().forEach(window => {
          window.webContents.send('file:change', {
            type: eventType === 'rename' ? 'unlink' : 'change',
            path: fullPath,
          });
        });
      });
      
      // Store watcher reference
      abortController.signal.addEventListener('abort', () => {
        watcher.close();
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:unwatch', async (_: IpcMainInvokeEvent, dirPath: string) => {
    const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
    const watcher = fileWatchers.get(resolvedPath);
    if (watcher) {
      watcher.abort();
      fileWatchers.delete(resolvedPath);
    }
  });

  // Content search handler for search bar
  ipcMain.handle('file:searchContent', async (_: IpcMainInvokeEvent, projectPath: string, searchTerm: string) => {
    try {
      const results: Array<{ path: string; lineNumber: number; preview: string }> = [];
      const MAX_RESULTS = 100;
      const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit per file

      // Common patterns to ignore
      const ignorePatterns = [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'out',
        'coverage',
        '.cache',
        'vendor',
      ];

      // Binary file extensions to skip
      const binaryExtensions = new Set([
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
        '.mp3', '.mp4', '.wav', '.avi', '.mov',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.exe', '.dll', '.so', '.dylib',
        '.woff', '.woff2', '.ttf', '.eot',
      ]);

      const shouldIgnore = (filePath: string): boolean => {
        const normalizedPath = filePath.toLowerCase();
        return ignorePatterns.some(pattern =>
          normalizedPath.includes(`/${pattern}/`) ||
          normalizedPath.includes(`\\${pattern}\\`)
        );
      };

      const isBinary = (filePath: string): boolean => {
        const ext = path.extname(filePath).toLowerCase();
        return binaryExtensions.has(ext);
      };

      const searchFile = async (filePath: string): Promise<void> => {
        if (results.length >= MAX_RESULTS) return;
        if (isBinary(filePath)) return;

        try {
          const stats = await fs.stat(filePath);
          if (stats.size > MAX_FILE_SIZE) return;

          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');
          const lowerTerm = searchTerm.toLowerCase();

          lines.forEach((line, index) => {
            if (results.length >= MAX_RESULTS) return;

            if (line.toLowerCase().includes(lowerTerm)) {
              // Get preview with context (30 chars before and after match)
              const linePreview = line.trim().slice(0, 100);
              results.push({
                path: filePath,
                lineNumber: index + 1,
                preview: linePreview,
              });
            }
          });
        } catch (error) {
          // Skip files we can't read (binary, permissions, etc.)
        }
      };

      const searchDirectory = async (dirPath: string): Promise<void> => {
        if (results.length >= MAX_RESULTS) return;
        if (shouldIgnore(dirPath)) return;

        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            if (results.length >= MAX_RESULTS) return;

            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              await searchDirectory(fullPath);
            } else if (entry.isFile()) {
              await searchFile(fullPath);
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      };

      await searchDirectory(projectPath);

      return { results };
    } catch (error) {
      return { results: [], error: (error as Error).message };
    }
  });

  // File history handlers for rollback support
  ipcMain.handle('file:backup', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string, toolCallId: string, filePath: string, changeType: 'write' | 'edit' | 'delete') => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      await fileHistoryManager.captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:restore', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const result = await fileHistoryManager.rollbackToMessage(conversationId, messageId);
      return result;
    } catch (error) {
      return { success: false, restoredFiles: [], failedFiles: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('file:getChanges', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager.getMessageChangesWithStats(conversationId, messageId);
      return { changes };
    } catch (error) {
      return { changes: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('file:hasChanges', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const hasChanges = fileHistoryManager.hasChanges(conversationId, messageId);
      return { hasChanges };
    } catch (error) {
      return { hasChanges: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:getAllChanges', async (_: IpcMainInvokeEvent, conversationId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager.getAllConversationChanges(conversationId);
      return { changes };
    } catch (error) {
      return { changes: [], error: (error as Error).message };
    }
  });

  // Get diff for a specific file change
  ipcMain.handle('file:getDiff', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string, filePath: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager.getMessageChanges(conversationId, messageId);
      const change = changes.find(c => c.filePath === filePath);

      if (!change) {
        return { before: '', after: '', error: 'File change not found' };
      }

      return {
        before: change.beforeContent,
        after: change.afterContent || '',
        changeType: change.changeType,
      };
    } catch (error) {
      return { before: '', after: '', error: (error as Error).message };
    }
  });

  // Tool handlers
  ipcMain.handle('tool:execute', async (_: IpcMainInvokeEvent, toolName: string, input: Record<string, unknown>) => {
    if (!toolsRef) throw new Error('Tools not initialized');
    try {
      const result = await toolsRef.execute(toolName, input);
      return { result };
    } catch (error) {
      return { result: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('tool:list', async () => {
    if (!toolsRef) return [];
    return toolsRef.list();
  });

  // Config handlers
  ipcMain.handle('config:get', async (_: IpcMainInvokeEvent, key: string) => {
    if (!configRef) return null;
    return configRef.get(key);
  });

  ipcMain.handle('config:set', async (_: IpcMainInvokeEvent, key: string, value: unknown) => {
    if (!configRef) throw new Error('Config not initialized');
    configRef.set(key, value);
  });

  ipcMain.handle('config:get-models', async () => {
    if (!configRef) return [];
    return configRef.getModels();
  });

  ipcMain.handle('config:get-providers', async () => {
    if (!configRef) return [];
    return configRef.getProviders();
  });

  // Working directory handler
  ipcMain.handle('config:set-cwd', async (_: IpcMainInvokeEvent, cwd: string) => {
    setWorkingDirectory(cwd);
    return { success: true };
  });

  ipcMain.handle('config:get-cwd', async () => {
    return { cwd: getWorkingDirectory() };
  });

  // Dialog handlers
  ipcMain.handle('dialog:open-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return { canceled: true, path: null };

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Open Folder',
    });

    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null,
    };
  });

  ipcMain.handle('dialog:open-workspace', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return { canceled: true, path: null };

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      title: 'Open Workspace',
      buttonLabel: 'Open Workspace',
      filters: [
        { name: 'Omni Code Workspace', extensions: ['omnicode-workspace'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null,
    };
  });

  ipcMain.handle('dialog:create-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return { canceled: true, path: null, error: 'No window available' };

    // First, let user select parent directory
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Parent Directory for New Folder',
      buttonLabel: 'Select Parent',
    });

    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true, path: null };
    }

    const parentPath = result.filePaths[0];

    // Prompt for folder name using input dialog
    // Note: Electron doesn't have a built-in input dialog, so we use a custom prompt
    // For simplicity, we'll create the folder with a default name and let user rename it later
    // Or we can show a message box with input
    const { response: folderName } = await dialog.showMessageBox(window, {
      type: 'question',
      buttons: ['Create', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      title: 'Create New Folder',
      message: 'Enter a name for the new folder:',
      detail: 'The folder will be created in: ' + parentPath,
    });

    if (response === 1) {
      return { canceled: true, path: null };
    }

    // Use a simple approach - create with timestamp and let user rename via file explorer
    // or we can use a more sophisticated approach with a custom dialog
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultFolderName = `new-project-${timestamp}`;

    const newFolderPath = path.join(parentPath, defaultFolderName);

    try {
      // Check if folder already exists
      try {
        await fs.access(newFolderPath);
        return { canceled: false, path: null, error: `Folder "${defaultFolderName}" already exists` };
      } catch {
        // Folder doesn't exist, we can create it
      }

      await fs.mkdir(newFolderPath, { recursive: false });
      return { canceled: false, path: newFolderPath };
    } catch (error) {
      return { canceled: false, path: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('app:get-version', async () => {
    const { app } = require('electron');
    return app.getVersion();
  });

  ipcMain.handle('app:get-platform', async () => {
    return process.platform;
  });

  // Usage tracking handlers
  ipcMain.handle('usage:get', async (_: IpcMainInvokeEvent, month?: string, workspacePath?: string) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.getUsage(month, workspacePath);
    } catch (error) {
      return { error: (error as Error).message };
    }
  });

  ipcMain.handle('usage:getSummary', async (_: IpcMainInvokeEvent, month?: string, workspacePath?: string) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.getSummary(month, workspacePath);
    } catch (error) {
      return {
        totalCost: 0,
        totalTokens: 0,
        requestCount: 0,
        byModel: {},
        byProvider: {},
        error: (error as Error).message,
      };
    }
  });

  ipcMain.handle('usage:getAvailableMonths', async (_: IpcMainInvokeEvent, workspacePath?: string) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.getAvailableMonths(workspacePath);
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('usage:setLimit', async (_: IpcMainInvokeEvent, month: string, limit: number) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.setMonthlyLimit(month, limit);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('usage:getLimits', async () => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.getAllMonthlyLimits();
    } catch (error) {
      return {};
    }
  });

  ipcMain.handle('usage:cleanup', async (_: IpcMainInvokeEvent, monthsToKeep?: number) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.cleanupOldData(monthsToKeep);
    } catch (error) {
      return { deleted: 0, error: (error as Error).message };
    }
  });

  ipcMain.handle('usage:export', async (_: IpcMainInvokeEvent, workspacePath?: string) => {
    try {
      const usageStorage = await getUsageStorage();
      return await usageStorage.exportToCSV(workspacePath);
    } catch (error) {
      return { error: (error as Error).message };
    }
  });

  // Indexing handlers
  ipcMain.handle('indexing:start', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.startIndexing();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to start indexing:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:reindex', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.reindex();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to reindex:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:stop', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      indexer.abort();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to stop indexing:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:getState', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const state = indexer.getState();
      return { state, error: null };
    } catch (error) {
      console.error('[IPC] Failed to get indexing state:', error);
      return { state: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:query', async (_: IpcMainInvokeEvent, projectPath: string, query: string, topK?: number) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const results = await indexer.query(query, topK || 5);
      return { results, error: null };
    } catch (error) {
      console.error('[IPC] Failed to query index:', error);
      return { results: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:clear', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.clearIndex();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to clear index:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:close', async (_: IpcMainInvokeEvent, projectPath: string) => {
    try {
      await closeProjectIndexer(projectPath);
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to close indexer:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('indexing:closeAll', async () => {
    try {
      await closeAllProjectIndexers();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to close all indexers:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Window control handlers
  ipcMain.handle('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.close();
  });

  // Notification sound handler
  ipcMain.handle('notification:request-sound', async (event: IpcMainInvokeEvent, type: 'user_input' | 'response_complete') => {
    // Get the window that sent the request
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      requestNotificationSound(window, type);
    }
  });

  // Terminal handlers
  ipcMain.handle('terminal:create', (event: IpcMainInvokeEvent, id: string, cwd: string, cols: number, rows: number) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return { success: false, error: 'No window found' };
    try {
      createTerminal(id, cwd, cols, rows, window);
      return { success: true };
    } catch (error) {
      console.error('[Terminal] Failed to create terminal:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('terminal:write', (_: IpcMainInvokeEvent, id: string, data: string) => {
    writeToTerminal(id, data);
  });

  ipcMain.handle('terminal:resize', (_: IpcMainInvokeEvent, id: string, cols: number, rows: number) => {
    resizeTerminal(id, cols, rows);
  });

  ipcMain.handle('terminal:destroy', (_: IpcMainInvokeEvent, id: string) => {
    destroyTerminal(id);
  });

  // Browser IPC handlers for AI-controlled browser tabs
  ipcMain.handle('browser:open', async (_: IpcMainInvokeEvent, url: string, title?: string) => {
    if (!mainWindowRef) {
      return { success: false, error: 'Main window not available' };
    }
    // Send event to renderer to open browser tab
    mainWindowRef.webContents.send('browser:open', { url, title });
    return { success: true, url };
  });

  ipcMain.handle('browser:navigate', async (_: IpcMainInvokeEvent, tabId: string, url: string) => {
    if (!mainWindowRef) {
      return { success: false, error: 'Main window not available' };
    }
    mainWindowRef.webContents.send('browser:navigate', { tabId, url });
    return { success: true, tabId, url };
  });

  ipcMain.handle('browser:close', async (_: IpcMainInvokeEvent, tabId: string) => {
    if (!mainWindowRef) {
      return { success: false, error: 'Main window not available' };
    }
    mainWindowRef.webContents.send('browser:close', { tabId });
    return { success: true, tabId };
  });

  // Remote access handlers
  ipcMain.handle('remote:start', async () => {
    try {
      const { initializeRemoteServer } = await import('./remote-server.js');
      const result = await initializeRemoteServer();
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('remote:stop', async () => {
    try {
      const { stopRemoteServer } = await import('./remote-server.js');
      return await stopRemoteServer();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('remote:status', async () => {
    try {
      const { getRemoteServerStatus } = await import('./remote-server.js');
      return getRemoteServerStatus();
    } catch (error) {
      return { running: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('remote:regenerate-api-key', async () => {
    try {
      const { regenerateApiKey } = await import('./remote-auth.js');
      const newKey = regenerateApiKey();
      return { success: true, apiKey: newKey };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get QR code for mobile connection
  ipcMain.handle('remote:get-qr-code', async () => {
    try {
      const { generateConnectionQR } = await import('./remote-server.js');
      return await generateConnectionQR();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Shared workspace handlers for remote access
  ipcMain.handle('shared-workspaces:list', async () => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      return { success: true, workspaces: manager.getSharedWorkspaces() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('shared-workspaces:add-workspace', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      const workspace = await manager.addWorkspaceFile(filePath);
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('shared-workspaces:add-folder', async (_: IpcMainInvokeEvent, folderPath: string) => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      const workspace = await manager.addFolder(folderPath);
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('shared-workspaces:remove', async (_: IpcMainInvokeEvent, sharedId: string) => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      const success = await manager.removeWorkspace(sharedId);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('shared-workspaces:set-active', async (_: IpcMainInvokeEvent, sharedId: string) => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      const success = manager.setActiveWorkspace(sharedId);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('shared-workspaces:active', async () => {
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const manager = getSharedWorkspaceManager();
      await manager.initialize();
      const workspace = manager.getActiveWorkspace();
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Workspace handlers
  ipcMain.handle('workspace:create', async (_: IpcMainInvokeEvent, options: CreateWorkspaceOptions) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.createWorkspace(options);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to create workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:saveToFile', async (_: IpcMainInvokeEvent, workspace: Workspace, filePath: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.saveWorkspaceToFile(workspace, filePath);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to save workspace to file:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:loadFromFile', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.loadWorkspaceFromFile(filePath);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to load workspace from file:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:loadById', async (_: IpcMainInvokeEvent, workspaceId: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.loadWorkspaceById(workspaceId);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to load workspace by ID:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:update', async (_: IpcMainInvokeEvent, workspace: Workspace) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.updateWorkspace(workspace);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to update workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:list', async () => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.listWorkspaces();
      return result;
    } catch (error) {
      console.error('[IPC] Failed to list workspaces:', error);
      return { workspaces: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:delete', async (_: IpcMainInvokeEvent, workspaceId: string, deleteData?: boolean) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.deleteWorkspace(workspaceId, deleteData);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to delete workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:addFolder', async (_: IpcMainInvokeEvent, workspaceId: string, folderPath: string, folderName?: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.addFolderToWorkspace(workspaceId, folderPath, folderName);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to add folder to workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:removeFolder', async (_: IpcMainInvokeEvent, workspaceId: string, folderId: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.removeFolderFromWorkspace(workspaceId, folderId);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to remove folder from workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:rename', async (_: IpcMainInvokeEvent, workspaceId: string, newName: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.renameWorkspace(workspaceId, newName);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to rename workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:export', async (_: IpcMainInvokeEvent, workspaceId: string, targetDir: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.exportWorkspace(workspaceId, targetDir);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to export workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:import', async (_: IpcMainInvokeEvent, sourceDir: string) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.importWorkspace(sourceDir);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to import workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Workspace chat storage handlers (isolated from project chats)
  ipcMain.handle('workspace:chat:save', async (_: IpcMainInvokeEvent, workspace: Workspace, conversation: Conversation) => {
    try {
      const storage = getChatStorage();
      const result = await storage.saveConversationForWorkspace(workspace, conversation);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to save workspace conversation:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:chat:load', async (_: IpcMainInvokeEvent, workspace: Workspace) => {
    try {
      const storage = getChatStorage();
      const result = await storage.loadConversationsForWorkspace(workspace);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to load workspace conversations:', error);
      return { conversations: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:chat:delete', async (_: IpcMainInvokeEvent, workspace: Workspace, conversationId: string) => {
    try {
      const storage = getChatStorage();
      const result = await storage.deleteConversationForWorkspace(workspace, conversationId);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to delete workspace conversation:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:chat:list', async (_: IpcMainInvokeEvent, workspace: Workspace) => {
    try {
      const storage = getChatStorage();
      const result = await storage.listConversationsForWorkspace(workspace);
      return result;
    } catch (error) {
      console.error('[IPC] Failed to list workspace conversations:', error);
      return { conversations: [], error: (error as Error).message };
    }
  });

  // Workspace indexing handlers (cross-project semantic search)
  ipcMain.handle('workspace:indexing:start', async (_: IpcMainInvokeEvent, workspace: Workspace) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.startIndexing();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to start workspace indexing:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:reindex', async (_: IpcMainInvokeEvent, workspace: Workspace) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.reindex();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to reindex workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:reindexProject', async (_: IpcMainInvokeEvent, workspace: Workspace, projectId: string) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.reindexProject(projectId);
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to reindex workspace project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:stop', async (_: IpcMainInvokeEvent, workspaceId: string) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: '', folders: [], version: '1.0.0', createdAt: 0, updatedAt: 0 });
      indexer.abort();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to stop workspace indexing:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:getState', async (_: IpcMainInvokeEvent, workspaceId: string) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: '', folders: [], version: '1.0.0', createdAt: 0, updatedAt: 0 });
      const state = indexer.getState();
      return { state, error: null };
    } catch (error) {
      console.error('[IPC] Failed to get workspace indexing state:', error);
      return { state: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:query', async (_: IpcMainInvokeEvent, workspaceId: string, query: string, options?: { topK?: number; projectId?: string }) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: '', folders: [], version: '1.0.0', createdAt: 0, updatedAt: 0 });
      const results = await indexer.query(query, options);
      return { results, error: null };
    } catch (error) {
      console.error('[IPC] Failed to query workspace index:', error);
      return { results: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:clear', async (_: IpcMainInvokeEvent, workspaceId: string) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: '', folders: [], version: '1.0.0', createdAt: 0, updatedAt: 0 });
      await indexer.clearIndex();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to clear workspace index:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:close', async (_: IpcMainInvokeEvent, workspaceId: string) => {
    try {
      await closeWorkspaceIndexer(workspaceId);
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to close workspace indexer:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('workspace:indexing:closeAll', async () => {
    try {
      await closeAllWorkspaceIndexers();
      return { success: true, error: null };
    } catch (error) {
      console.error('[IPC] Failed to close all workspace indexers:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}

// Set main window reference for browser events
export function setMainWindowForBrowser(window: BrowserWindow): void {
  mainWindowRef = window;
}

export function cleanupIpcHandlers(): void {
  // Clean up all terminal sessions
  destroyAllTerminals();

  // Clean up all file watchers
  fileWatchers.forEach(controller => controller.abort());
  fileWatchers.clear();
  
  // Remove all IPC handlers
  ipcMain.removeHandler('agent:create-conversation');
  ipcMain.removeHandler('agent:close-conversation');
  ipcMain.removeHandler('agent:has-conversation');
  ipcMain.removeHandler('agent:send-message');
  ipcMain.removeHandler('agent:abort');
  ipcMain.removeHandler('agent:switch-model');
  ipcMain.removeHandler('agent:clear-conversation');
  ipcMain.removeHandler('agent:get-token-count');
  ipcMain.removeHandler('agent:respond-permission');
  ipcMain.removeHandler('agent:respond-user-input');
  ipcMain.removeHandler('agent:set-mode');
  ipcMain.removeHandler('agent:set-permission-mode');
  ipcMain.removeHandler('tools:get-metadata');
  ipcMain.removeHandler('chat:save');
  ipcMain.removeHandler('chat:load');
  ipcMain.removeHandler('chat:delete');
  ipcMain.removeHandler('chat:list');
  ipcMain.removeHandler('file:read');
  ipcMain.removeHandler('file:write');
  ipcMain.removeHandler('file:edit');
  ipcMain.removeHandler('file:list');
  ipcMain.removeHandler('file:watch');
  ipcMain.removeHandler('file:unwatch');
  ipcMain.removeHandler('file:searchContent');
  ipcMain.removeHandler('file:backup');
  ipcMain.removeHandler('file:restore');
  ipcMain.removeHandler('file:getChanges');
  ipcMain.removeHandler('file:hasChanges');
  ipcMain.removeHandler('file:getAllChanges');
  ipcMain.removeHandler('tool:execute');
  ipcMain.removeHandler('tool:list');
  ipcMain.removeHandler('config:get');
  ipcMain.removeHandler('config:set');
  ipcMain.removeHandler('config:get-models');
  ipcMain.removeHandler('config:get-providers');
  ipcMain.removeHandler('dialog:open-folder');
  ipcMain.removeHandler('dialog:create-folder');
  ipcMain.removeHandler('dialog:open-workspace');
  ipcMain.removeHandler('app:get-version');
  ipcMain.removeHandler('app:get-platform');
  ipcMain.removeHandler('usage:get');
  ipcMain.removeHandler('usage:getSummary');
  ipcMain.removeHandler('usage:getAvailableMonths');
  ipcMain.removeHandler('usage:setLimit');
  ipcMain.removeHandler('usage:getLimits');
  ipcMain.removeHandler('usage:cleanup');
  ipcMain.removeHandler('usage:export');
  ipcMain.removeHandler('indexing:start');
  ipcMain.removeHandler('indexing:reindex');
  ipcMain.removeHandler('indexing:stop');
  ipcMain.removeHandler('indexing:getState');
  ipcMain.removeHandler('indexing:query');
  ipcMain.removeHandler('indexing:clear');
  ipcMain.removeHandler('indexing:close');
  ipcMain.removeHandler('indexing:closeAll');
  ipcMain.removeHandler('window:minimize');
  ipcMain.removeHandler('window:maximize');
  ipcMain.removeHandler('window:close');
  ipcMain.removeHandler('notification:request-sound');
  ipcMain.removeHandler('terminal:create');
  ipcMain.removeHandler('terminal:write');
  ipcMain.removeHandler('terminal:resize');
  ipcMain.removeHandler('terminal:destroy');
  ipcMain.removeHandler('browser:open');
  ipcMain.removeHandler('browser:navigate');
  ipcMain.removeHandler('browser:close');
  ipcMain.removeHandler('browser:request-screenshot');

  // Remote access cleanup
  ipcMain.removeHandler('remote:start');
  ipcMain.removeHandler('remote:stop');
  ipcMain.removeHandler('remote:status');
  ipcMain.removeHandler('remote:regenerate-api-key');

  // Shared workspace cleanup
  ipcMain.removeHandler('shared-workspaces:list');
  ipcMain.removeHandler('shared-workspaces:add-workspace');
  ipcMain.removeHandler('shared-workspaces:add-folder');
  ipcMain.removeHandler('shared-workspaces:remove');
  ipcMain.removeHandler('shared-workspaces:set-active');
  ipcMain.removeHandler('shared-workspaces:active');

  // Workspace handlers cleanup
  ipcMain.removeHandler('workspace:create');
  ipcMain.removeHandler('workspace:saveToFile');
  ipcMain.removeHandler('workspace:loadFromFile');
  ipcMain.removeHandler('workspace:loadById');
  ipcMain.removeHandler('workspace:update');
  ipcMain.removeHandler('workspace:list');
  ipcMain.removeHandler('workspace:delete');
  ipcMain.removeHandler('workspace:addFolder');
  ipcMain.removeHandler('workspace:removeFolder');
  ipcMain.removeHandler('workspace:rename');
  ipcMain.removeHandler('workspace:export');
  ipcMain.removeHandler('workspace:import');
  ipcMain.removeHandler('workspace:chat:save');
  ipcMain.removeHandler('workspace:chat:load');
  ipcMain.removeHandler('workspace:chat:delete');
  ipcMain.removeHandler('workspace:chat:list');
  ipcMain.removeHandler('workspace:indexing:start');
  ipcMain.removeHandler('workspace:indexing:reindex');
  ipcMain.removeHandler('workspace:indexing:reindexProject');
  ipcMain.removeHandler('workspace:indexing:stop');
  ipcMain.removeHandler('workspace:indexing:getState');
  ipcMain.removeHandler('workspace:indexing:query');
  ipcMain.removeHandler('workspace:indexing:clear');
  ipcMain.removeHandler('workspace:indexing:close');
  ipcMain.removeHandler('workspace:indexing:closeAll');

  // Cleanup workspace indexers
  closeAllWorkspaceIndexers().catch(error => {
    console.error('[IPC] Error closing workspace indexers during cleanup:', error);
  });

  // Settings cleanup (must be last as it was set up first)
  cleanupSettingsIpcHandlers();
}
