import { ipcMain, BrowserWindow, IpcMainInvokeEvent, dialog, shell, clipboard, app } from 'electron';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as https from 'node:https';
import * as http from 'node:http';
import { execFile } from 'node:child_process';
import { setWorkingDirectory, getWorkingDirectory, setPermissionMode, getProviderRegistry, reinitializeProviders, refreshSystemPrompt, rulesManager, skillsManager, reloadAddons } from './core-integration.js';
import {
  createPlanFile,
  readPlanFile,
  updatePlanStep,
  markPlanApproved,
  openPlanFile,
  watchPlanFile,
  stopWatchingPlanFile,
  stopAllPlanWatchers,
  type PlanFileData,
} from './plan-file-manager.js';
import { getSharedWorkspaceManager } from './shared-workspace-manager.js';
import { getChatStorage } from './chat-storage.js';
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
import { GitManager } from '../src/git/git-manager.js';

// Reference to the most recently focused window (used by agent browser tools)
let mainWindowRef: BrowserWindow | null = null;

// Per-window working directory map (webContents ID -> cwd)
const windowCwdMap = new Map<number, string>();
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
  sendMessage: (conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>, images?: Array<{ mediaType: string; data: string }>) => Promise<void>;
  abort: (conversationId: string) => void;
  switchModel: (conversationId: string, model: string, provider: string) => Promise<boolean>;
  setMode: (conversationId: string, mode: string) => Promise<{ success: boolean; mode: string }>;
  clearConversation: (conversationId: string) => void;
  getTokenCount: (conversationId: string) => Promise<number>;
  restoreHistory: (conversationId: string, messages: unknown[]) => boolean;
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

// Pending screenshot requests for browser tabs
const pendingScreenshotRequests = new Map<string, { resolve: (value: { dataUrl?: string; error?: string }) => void; reject: (error: Error) => void }>();

export function setAgentRef(agent: typeof agentRef): void {
  agentRef = agent;
}

export function setToolsRef(tools: typeof toolsRef): void {
  toolsRef = tools;
}

export function setConfigRef(config: typeof configRef): void {
  configRef = config;
}

// Export functions to access config for remote server API
// These now use the provider registry to get real-time availability status
export function getConfigModels(): Array<{ id: string; name: string; provider: string; available: boolean }> {
  const registry = getProviderRegistry();
  if (!registry) return [];

  // Get all models from all providers
  const allModels = registry.getAllModels();

  // Map to the expected format with real availability status
  return allModels.map(model => {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;

    return {
      id: model.id,
      name: model.name || model.id,
      provider: model.provider,
      available: isProviderAvailable,
    };
  });
}

export function getConfigProviders(): Array<{ name: string; available: boolean; models: string[] }> {
  const registry = getProviderRegistry();
  if (!registry) return [];

  // Get all providers and their models
  const allModels = registry.getAllModels();
  const providers = new Map<string, { name: string; available: boolean; models: string[] }>();

  for (const model of allModels) {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;

    if (!providers.has(model.provider)) {
      providers.set(model.provider, {
        name: model.provider,
        available: isProviderAvailable,
        models: [],
      });
    }

    providers.get(model.provider)!.models.push(model.id);
  }

  return Array.from(providers.values());
}

export function setupIpcHandlers(): void {
  console.log('[IPC] setupIpcHandlers() called');
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

  ipcMain.handle('agent:send-message', async (_: IpcMainInvokeEvent, conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>, images?: Array<{ mediaType: string; data: string }>) => {
    if (!agentRef) throw new Error('Agent not initialized');
    await agentRef.sendMessage(conversationId, message, workingDirectory, fileReferences, images);
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

  ipcMain.handle('agent:restore-history', async (_: IpcMainInvokeEvent, conversationId: string, messages: unknown[]) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return agentRef.restoreHistory(conversationId, messages);
  });

  ipcMain.handle('agent:set-permission-mode', (_: IpcMainInvokeEvent, autoRunMode: string) => {
    setPermissionMode(autoRunMode);
  });

  ipcMain.handle('agent:set-change-review-enabled', (_: IpcMainInvokeEvent, enabled: boolean) => {
    if (!agentRef) throw new Error('Agent not initialized');
    agentRef.setChangeReviewEnabled(enabled);
  });

  ipcMain.handle('changes:respond', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string, toolCallId: string, decision: 'accept' | 'reject') => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.respondToChangeReview(conversationId, messageId, toolCallId, decision);
  });

  ipcMain.handle('changes:accept-all', async (_: IpcMainInvokeEvent, conversationId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.acceptAllChanges(conversationId);
  });

  ipcMain.handle('changes:reject-all', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.rejectAllChanges(conversationId, messageId);
  });

  // Tools metadata handler
  ipcMain.handle('tools:get-metadata', async (_: IpcMainInvokeEvent, toolName: string) => {
    if (!toolsRef) return null;
    const tools = toolsRef.list();
    return tools.find(t => t.name === toolName) || null;
  });

  // Chat storage handlers
  ipcMain.handle('chat:save', async (_: IpcMainInvokeEvent, workspacePath: string, conversation: Conversation) => {
    return chatStorageRef.saveConversation(workspacePath, conversation);
  });

  ipcMain.handle('chat:load', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    return chatStorageRef.loadConversations(workspacePath);
  });

  ipcMain.handle('chat:delete', async (_: IpcMainInvokeEvent, workspacePath: string, conversationId: string) => {
    const result = await chatStorageRef.deleteConversation(workspacePath, conversationId);
    // Also clear file history for this conversation
    try {
      const fileHistoryManager = getFileHistoryManager(workspacePath);
      await fileHistoryManager.clearConversation(conversationId);
    } catch (error) {
      console.error('[IPC] Failed to clear file history for conversation:', error);
    }
    return result;
  });

  ipcMain.handle('chat:list', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    return chatStorageRef.listConversations(workspacePath);
  });

  // Helper function to get MIME type from file extension
  const getMimeType = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

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

  ipcMain.handle('file:readBinary', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Resolve relative paths using the current working directory
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      const buffer = await fs.readFile(resolvedPath);
      const base64 = buffer.toString('base64');
      const mimeType = getMimeType(resolvedPath);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { dataUrl, size: buffer.length };
    } catch (error) {
      return { dataUrl: '', size: 0, error: (error as Error).message };
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
    console.log('[file:list] Listing directory:', dirPath);
    try {
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
      console.log('[file:list] Resolved path:', resolvedPath);
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      
      const files = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(resolvedPath, entry.name),
      }));
      
      console.log(`[file:list] Found ${files.length} entries in ${resolvedPath}`);
      return { files };
    } catch (error) {
      console.error('[file:list] Error:', (error as Error).message, 'for path:', dirPath);
      return { files: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('project:scan', async (_: IpcMainInvokeEvent, dirs: string[]) => {
    const found: string[] = [];
    for (const dir of dirs) {
      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const projectPath = path.join(dir, entry.name);
        const hasOmnicode = await fs.access(path.join(projectPath, '.omnicode'))
          .then(() => true).catch(() => false);
        if (hasOmnicode) found.push(projectPath);
      }
    }
    return { projects: [...new Set(found)] };
  });

  ipcMain.handle('file:mkdir', async (_: IpcMainInvokeEvent, dirPath: string) => {
    console.log('[file:mkdir] Creating directory:', dirPath);
    try {
      const resolvedPath = path.isAbsolute(dirPath) ? dirPath : path.join(getWorkingDirectory(), dirPath);
      await fs.mkdir(resolvedPath, { recursive: true });
      console.log('[file:mkdir] Created successfully:', resolvedPath);
      return { success: true };
    } catch (error) {
      console.error('[file:mkdir] Error:', (error as Error).message, 'for path:', dirPath);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:rename', async (_: IpcMainInvokeEvent, oldPath: string, newPath: string) => {
    console.log('[file:rename] Renaming:', oldPath, '->', newPath);
    try {
      const resolvedOld = path.isAbsolute(oldPath) ? oldPath : path.join(getWorkingDirectory(), oldPath);
      const resolvedNew = path.isAbsolute(newPath) ? newPath : path.join(getWorkingDirectory(), newPath);
      await fs.rename(resolvedOld, resolvedNew);
      console.log('[file:rename] Renamed successfully');
      return { success: true };
    } catch (error) {
      console.error('[file:rename] Error:', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:delete', async (_: IpcMainInvokeEvent, filePath: string) => {
    console.log('[file:delete] Deleting:', filePath);
    try {
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      await fs.rm(resolvedPath, { recursive: true, force: true });
      console.log('[file:delete] Deleted successfully:', resolvedPath);
      return { success: true };
    } catch (error) {
      console.error('[file:delete] Error:', (error as Error).message, 'for path:', filePath);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:revealInFinder', async (_: IpcMainInvokeEvent, filePath: string) => {
    console.log('[file:revealInFinder] Revealing:', filePath);
    try {
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      shell.showItemInFolder(resolvedPath);
      console.log('[file:revealInFinder] Revealed successfully');
      return { success: true };
    } catch (error) {
      console.error('[file:revealInFinder] Error:', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:copyPath', async (_: IpcMainInvokeEvent, filePath: string, type: 'full' | 'relative', workspacePath: string) => {
    console.log('[file:copyPath] Copying path:', filePath, 'type:', type);
    try {
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkingDirectory(), filePath);
      const pathToCopy = type === 'relative'
        ? path.relative(workspacePath || getWorkingDirectory(), resolvedPath)
        : resolvedPath;
      clipboard.writeText(pathToCopy);
      console.log('[file:copyPath] Copied to clipboard:', pathToCopy);
      return { success: true };
    } catch (error) {
      console.error('[file:copyPath] Error:', (error as Error).message);
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
      const changes = await fileHistoryManager.getMessageChangesWithStats(conversationId, messageId);
      return { changes };
    } catch (error) {
      return { changes: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('file:hasChanges', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const hasChanges = await fileHistoryManager.hasChanges(conversationId, messageId);
      return { hasChanges };
    } catch (error) {
      return { hasChanges: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:getAllChanges', async (_: IpcMainInvokeEvent, conversationId: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const changes = await fileHistoryManager.getAllConversationChanges(conversationId);
      return { changes };
    } catch (error) {
      return { changes: [], error: (error as Error).message };
    }
  });

  // Get diff for a specific file change
  ipcMain.handle('file:getDiff', async (_: IpcMainInvokeEvent, conversationId: string, messageId: string, filePath: string) => {
    try {
      const fileHistoryManager = getFileHistoryManager(getWorkingDirectory());
      const changes = await fileHistoryManager.getMessageChanges(conversationId, messageId);
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

  // Custom model test connection handler
  ipcMain.handle('custom-models:test-connection', async (_: IpcMainInvokeEvent, { baseUrl, apiKey }: { baseUrl: string; apiKey?: string }) => {
    try {
      // Normalize the base URL
      const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const modelsUrl = `${normalizedUrl}/v1/models`;
      
      console.log(`[IPC] Testing custom endpoint connection: ${modelsUrl}`);
      
      // Use fetch to test the connection (Node 18+ has native fetch)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
        // Short timeout for the connection test
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[IPC] Custom endpoint test failed: ${response.status} ${errorText}`);
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      const data = await response.json() as { data?: Array<{ id: string }> };
      const models = data.data?.map(m => m.id) || [];
      
      console.log(`[IPC] Custom endpoint test successful, found ${models.length} models`);
      
      return { 
        success: true, 
        models,
      };
    } catch (error) {
      console.error('[IPC] Custom endpoint test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return { 
        success: false, 
        error: errorMessage,
      };
    }
  });

  // Working directory handler
  ipcMain.handle('config:set-cwd', async (event: IpcMainInvokeEvent, cwd: string) => {
    windowCwdMap.set(event.sender.id, cwd);
    await setWorkingDirectory(cwd);
    
    // Add the opened folder as a shared workspace so it appears in the Flutter app
    const sharedManager = getSharedWorkspaceManager();
    try {
      // First try to add as a single folder workspace
      await sharedManager.addFolder(cwd);
      console.log('[IPC] Added folder to shared workspaces:', cwd);
    } catch (err) {
      // Folder might already be added, that's ok
      console.log('[IPC] Folder may already be shared:', cwd);
    }
    
    // Re-sync shared workspaces so any newly-opened folder is immediately available
    // on the remote API without requiring an app restart.
    sharedManager.syncAllWorkspaces().catch((err) => {
      console.error('[IPC] Failed to sync shared workspaces after cwd change:', err);
    });
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

  ipcMain.handle('dialog:create-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return { canceled: true, path: null, error: 'No window available' };

    // Show a single dialog — the user can create a new folder using the OS "New Folder" button
    // (macOS: Cmd+Shift+N in the dialog), then select it.
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Create or Select a Project Folder',
      buttonLabel: 'Select Folder',
      message: 'Create a new folder or select an existing one',
    });

    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
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
      await requestNotificationSound(window, type);
    }
  });

  // Dialogs handler for selecting sound files
  ipcMain.handle('dialogs:select-sound-file', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'aiff'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], error: null };
    }
    return { filePath: null, error: null };
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
  ipcMain.handle('browser:open', async (event: IpcMainInvokeEvent, url: string, title?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: 'Main window not available' };
    }
    // Send event to renderer to open browser tab
    win.webContents.send('browser:open', { url, title });
    return { success: true, url };
  });

  ipcMain.handle('browser:navigate', async (event: IpcMainInvokeEvent, tabId: string, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: 'Main window not available' };
    }
    win.webContents.send('browser:navigate', { tabId, url });
    return { success: true, tabId, url };
  });

  ipcMain.handle('browser:close', async (event: IpcMainInvokeEvent, tabId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: 'Main window not available' };
    }
    win.webContents.send('browser:close', { tabId });
    return { success: true, tabId };
  });

  // Screenshot handlers - Clear any existing pending requests and use module-level map
  pendingScreenshotRequests.clear();

  ipcMain.handle('browser:request-screenshot', async (event: IpcMainInvokeEvent, tabId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: 'Main window not available' };
    }
    // Send request to renderer to capture screenshot
    win.webContents.send('browser:request-screenshot', { tabId });
    // Return a promise that resolves when the screenshot response comes back
    return new Promise<{ success: boolean; dataUrl?: string; error?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        pendingScreenshotRequests.delete(tabId);
        resolve({ success: false, error: 'Screenshot request timed out' });
      }, 30000); // 30 second timeout

      pendingScreenshotRequests.set(tabId, {
        resolve: (result) => {
          clearTimeout(timeout);
          pendingScreenshotRequests.delete(tabId);
          resolve({ success: !result.error, ...result });
        },
        reject: (error) => {
          clearTimeout(timeout);
          pendingScreenshotRequests.delete(tabId);
          resolve({ success: false, error: error.message });
        }
      });
    });
  });

  ipcMain.handle('browser:screenshot-response', async (_: IpcMainInvokeEvent, { tabId, dataUrl, error }: { tabId: string; dataUrl?: string; error?: string }) => {
    const pending = pendingScreenshotRequests.get(tabId);
    if (pending) {
      pending.resolve({ dataUrl, error });
    }
    return { success: true };
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

  ipcMain.handle('remote:generate-qr', async () => {
    try {
      const { getRemoteServerStatus } = await import('./remote-server.js');
      const { default: QRCode } = await import('qrcode');
      const status = getRemoteServerStatus();

      if (!status.running || !status.url || !status.apiKey) {
        return { success: false, error: 'Remote server is not running or not configured' };
      }

      // Generate QR code data with connection info
      const qrData = {
        url: status.url,
        key: status.apiKey,
        name: 'Omni Code Desktop',
      };

      // Convert to JSON and generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      return {
        success: true,
        qrCodeDataUrl,
        url: status.url,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // --- Git IPC Handlers ---
  console.log('[IPC:git] Registering git handlers...');
  const gitManagerCache = new Map<string, GitManager>();
  function getGitManager(cwd: string): GitManager {
    let mgr = gitManagerCache.get(cwd);
    if (!mgr) {
      mgr = new GitManager(cwd);
      gitManagerCache.set(cwd, mgr);
    }
    return mgr;
  }

  ipcMain.handle('git:is-repo', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      const isRepo = await git.isRepo();
      return { isRepo };
    } catch (error) {
      return { isRepo: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:status', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      const status = await git.statusStructured();
      return { status };
    } catch (error) {
      return { status: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:stage', async (_: IpcMainInvokeEvent, cwd: string, files: string[]) => {
    try {
      const git = getGitManager(cwd);
      await git.add(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:stage-all', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      await git.addAll();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:unstage', async (_: IpcMainInvokeEvent, cwd: string, files: string[]) => {
    try {
      const git = getGitManager(cwd);
      await git.unstage(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:commit', async (_: IpcMainInvokeEvent, cwd: string, message: string) => {
    try {
      const git = getGitManager(cwd);
      const hash = await git.commit(message);
      return { success: true, hash };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:push', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      await git.push();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:pull', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      await git.pull();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:fetch', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      await git.fetch();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:diff-file', async (_: IpcMainInvokeEvent, cwd: string, filePath: string, staged?: boolean) => {
    try {
      const git = getGitManager(cwd);
      const diff = await git.diffFile(filePath, staged ?? false);
      return { diff };
    } catch (error) {
      return { diff: '', error: (error as Error).message };
    }
  });

  ipcMain.handle('git:discard', async (_: IpcMainInvokeEvent, cwd: string, files: string[]) => {
    try {
      const git = getGitManager(cwd);
      await git.discardFile(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:branch-list', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      const branches = await git.listBranches();
      const current = await git.currentBranch();
      return { branches, current };
    } catch (error) {
      return { branches: [], current: '', error: (error as Error).message };
    }
  });

  ipcMain.handle('git:checkout', async (_: IpcMainInvokeEvent, cwd: string, branch: string) => {
    try {
      const git = getGitManager(cwd);
      await git.switchBranch(branch);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:create-branch', async (_: IpcMainInvokeEvent, cwd: string, name: string) => {
    try {
      const git = getGitManager(cwd);
      await git.createBranch(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('git:log', async (_: IpcMainInvokeEvent, cwd: string, maxCount?: number) => {
    try {
      const git = getGitManager(cwd);
      const commits = await git.logStructured(maxCount ?? 20);
      return { commits };
    } catch (error) {
      return { commits: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('git:init', async (_: IpcMainInvokeEvent, cwd: string) => {
    try {
      const git = getGitManager(cwd);
      await git.init();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[IPC:git] All git handlers registered');

  // ── Plan file handlers ────────────────────────────────────────────────────
  console.log('[IPC] Registering plan file handlers...');

  ipcMain.handle('plan:create-file', async (_: IpcMainInvokeEvent, workspaceRoot: string, plan: Parameters<typeof createPlanFile>[1], conversationId: string) => {
    try {
      const filePath = await createPlanFile(workspaceRoot, plan, conversationId);

      watchPlanFile(filePath, conversationId, (convId: string, data: PlanFileData) => {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('plan:file-changed', { conversationId: convId, plan: data });
        });
      });

      return { success: true, filePath };
    } catch (error) {
      console.error('[IPC] plan:create-file error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan:update-step', async (_: IpcMainInvokeEvent, filePath: string, stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed') => {
    try {
      await updatePlanStep(filePath, stepId, status);
      return { success: true };
    } catch (error) {
      console.error('[IPC] plan:update-step error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan:mark-approved', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      await markPlanApproved(filePath);
      return { success: true };
    } catch (error) {
      console.error('[IPC] plan:mark-approved error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan:open-file', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      await openPlanFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('[IPC] plan:open-file error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan:read-file', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      const data = await readPlanFile(filePath);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] plan:read-file error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan:stop-watching', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      stopWatchingPlanFile(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[IPC] Plan file handlers registered');
}

/**
 * Request a screenshot from a browser tab
 * This function is called by tools to capture screenshots of web pages
 * @param tabId - The identifier for the browser tab (usually the URL)
 * @returns The screenshot as a data URL or an error
 */
export async function requestScreenshot(tabId: string): Promise<{ dataUrl?: string; error?: string }> {
  if (!mainWindowRef) {
    return { error: 'Main window not available' };
  }

  // Send request to renderer to capture screenshot
  mainWindowRef.webContents.send('browser:request-screenshot', { tabId });

  // Return a promise that resolves when the screenshot response comes back
  return new Promise<{ dataUrl?: string; error?: string }>((resolve) => {
    const timeout = setTimeout(() => {
      pendingScreenshotRequests.delete(tabId);
      resolve({ error: 'Screenshot request timed out' });
    }, 30000); // 30 second timeout

    pendingScreenshotRequests.set(tabId, {
      resolve: (result) => {
        clearTimeout(timeout);
        pendingScreenshotRequests.delete(tabId);
        resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        pendingScreenshotRequests.delete(tabId);
        resolve({ error: error.message });
      }
    });
  });
}

// Set main window reference for browser events
export function setMainWindowForBrowser(window: BrowserWindow): void {
  mainWindowRef = window;
}

// ─── Rules IPC Handlers ──────────────────────────────────────────────────────

export function setupRulesAndSkillsIpcHandlers(): void {
  ipcMain.handle('rules:list', async () => {
    try {
      return { rules: rulesManager.getAllRules(), error: null };
    } catch (error) {
      return { rules: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('rules:save', async (_: IpcMainInvokeEvent, id: string, fullContent: string) => {
    try {
      await rulesManager.saveRuleFile(id, fullContent);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rules:delete', async (_: IpcMainInvokeEvent, id: string) => {
    try {
      await rulesManager.deleteRule(id);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rules:toggle', async (_: IpcMainInvokeEvent, id: string, enabled: boolean) => {
    try {
      await rulesManager.toggleRule(id, enabled);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ─── Skills IPC Handlers ────────────────────────────────────────────────────

  ipcMain.handle('skills:list', async () => {
    try {
      return { skills: skillsManager.getAllSkills(), error: null };
    } catch (error) {
      return { skills: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('skills:get', async (_: IpcMainInvokeEvent, id: string) => {
    try {
      const skill = skillsManager.getSkill(id);
      return { skill: skill || null, error: skill ? null : 'Skill not found' };
    } catch (error) {
      return { skill: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('skills:save', async (_: IpcMainInvokeEvent, id: string, content: string) => {
    try {
      await skillsManager.saveSkill(id, content);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('skills:delete', async (_: IpcMainInvokeEvent, id: string) => {
    try {
      await skillsManager.deleteSkill(id);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── Add-ons handlers ─────────────────────────────────────────────────────

  const getAddonsDir = () => path.join(app.getPath('userData'), 'addons');

  /** Download a URL following up to 5 redirects, writing to destPath. */
  const downloadFile = (url: string, destPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let redirects = 0;
      const doGet = (targetUrl: string) => {
        const mod = targetUrl.startsWith('https:') ? https : http;
        mod.get(targetUrl, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
            if (++redirects > 5) { reject(new Error('Too many redirects')); return; }
            doGet(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            return;
          }
          const fileStream = fsSync.createWriteStream(destPath);
          res.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
          fileStream.on('error', reject);
        }).on('error', reject);
      };
      doGet(url);
    });
  };

  ipcMain.handle('addons:list', async () => {
    try {
      const addonsDir = getAddonsDir();
      await fs.mkdir(addonsDir, { recursive: true });
      const entries = await fs.readdir(addonsDir, { withFileTypes: true });
      const manifests: unknown[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const manifestPath = path.join(addonsDir, entry.name, 'manifest.json');
        try {
          const raw = await fs.readFile(manifestPath, 'utf-8');
          manifests.push(JSON.parse(raw));
        } catch {
          // skip corrupted or incomplete entries
        }
      }
      return { manifests, error: null };
    } catch (error) {
      return { manifests: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('addons:install', async (_: IpcMainInvokeEvent, manifest: {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    download: string;
    entrypoint: string;
    tags?: string[];
    platforms?: string[];
    minOmniCodeVersion?: string;
    repo?: string;
  }) => {
    try {
      if (!manifest?.id || !manifest?.download) {
        return { success: false, error: 'Invalid manifest: missing id or download URL' };
      }
      const addonsDir = getAddonsDir();
      const addonDir = path.join(addonsDir, manifest.id);
      const zipPath = path.join(os.tmpdir(), `omni-addon-${manifest.id}-${Date.now()}.zip`);

      // Download zip
      await downloadFile(manifest.download, zipPath);

      // Extract zip
      await fs.mkdir(addonDir, { recursive: true });
      await new Promise<void>((resolve, reject) => {
        execFile('unzip', ['-o', '-q', zipPath, '-d', addonDir], (err) => {
          if (err) reject(err); else resolve();
        });
      });

      // Clean up zip file
      await fs.unlink(zipPath).catch(() => {});

      // Flatten single-directory archives (GitHub zips wrap content in a subdirectory)
      const contents = await fs.readdir(addonDir, { withFileTypes: true });
      const subdirs = contents.filter(e => e.isDirectory());
      if (contents.length === 1 && subdirs.length === 1) {
        const innerDir = path.join(addonDir, subdirs[0].name);
        const innerContents = await fs.readdir(innerDir);
        for (const item of innerContents) {
          await fs.rename(path.join(innerDir, item), path.join(addonDir, item));
        }
        await fs.rmdir(innerDir);
      }

      // Persist manifest alongside the add-on code
      await fs.writeFile(
        path.join(addonDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );

      // Reload all add-ons so the agent picks up the new tools immediately
      await reloadAddons();

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('addons:uninstall', async (_: IpcMainInvokeEvent, id: string) => {
    try {
      if (!id || typeof id !== 'string' || id.includes('..') || path.isAbsolute(id)) {
        return { success: false, error: 'Invalid add-on ID' };
      }
      const addonDir = path.join(getAddonsDir(), id);
      await fs.rm(addonDir, { recursive: true, force: true });

      // Reload all add-ons so the uninstalled tool is removed from the agent
      await reloadAddons();

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

// ── Auto-updater IPC ──────────────────────────────────────────────────────────

export function setupUpdaterIpcHandlers(): void {
  if (!app.isPackaged) return; // Only active in production builds

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { autoUpdater } = require('electron-updater');

  autoUpdater.on('update-available', (info: { version: string }) => {
    const win = BrowserWindow.getAllWindows()[0];
    win?.webContents.send('app:update-available', info);
  });

  autoUpdater.on('update-downloaded', (info: { version: string }) => {
    const win = BrowserWindow.getAllWindows()[0];
    win?.webContents.send('app:update-downloaded', info);
  });

  autoUpdater.on('error', (err: Error) => {
    console.error('[Updater] Error:', err);
  });

  ipcMain.handle('app:check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle('app:install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Window management
  ipcMain.handle('window:new', async () => {
    const { createWindow } = await import('./app-window.js');
    await createWindow();
    return { success: true };
  });
}

export function cleanupIpcHandlers(): void {
  // Clean up all terminal sessions
  destroyAllTerminals();

  // Clean up all file watchers
  fileWatchers.forEach(controller => controller.abort());
  fileWatchers.clear();

  // Clean up pending screenshot requests
  pendingScreenshotRequests.clear();
  
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
  ipcMain.removeHandler('agent:set-change-review-enabled');
  ipcMain.removeHandler('changes:respond');
  ipcMain.removeHandler('tools:get-metadata');
  ipcMain.removeHandler('chat:save');
  ipcMain.removeHandler('chat:load');
  ipcMain.removeHandler('chat:delete');
  ipcMain.removeHandler('chat:list');
  ipcMain.removeHandler('file:read');
  ipcMain.removeHandler('file:readBinary');
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
  ipcMain.removeHandler('dialogs:select-sound-file');
  ipcMain.removeHandler('terminal:create');
  ipcMain.removeHandler('terminal:write');
  ipcMain.removeHandler('terminal:resize');
  ipcMain.removeHandler('terminal:destroy');
  ipcMain.removeHandler('browser:open');
  ipcMain.removeHandler('browser:navigate');
  ipcMain.removeHandler('browser:close');
  ipcMain.removeHandler('browser:request-screenshot');
  ipcMain.removeHandler('browser:screenshot-response');

  ipcMain.removeHandler('project:scan');

  // Plan file cleanup
  stopAllPlanWatchers();
  ipcMain.removeHandler('plan:create-file');
  ipcMain.removeHandler('plan:update-step');
  ipcMain.removeHandler('plan:mark-approved');
  ipcMain.removeHandler('plan:open-file');
  ipcMain.removeHandler('plan:read-file');
  ipcMain.removeHandler('plan:stop-watching');

  // Git cleanup
  ipcMain.removeHandler('git:is-repo');
  ipcMain.removeHandler('git:status');
  ipcMain.removeHandler('git:stage');
  ipcMain.removeHandler('git:stage-all');
  ipcMain.removeHandler('git:unstage');
  ipcMain.removeHandler('git:commit');
  ipcMain.removeHandler('git:push');
  ipcMain.removeHandler('git:pull');
  ipcMain.removeHandler('git:fetch');
  ipcMain.removeHandler('git:diff-file');
  ipcMain.removeHandler('git:discard');
  ipcMain.removeHandler('git:branch-list');
  ipcMain.removeHandler('git:checkout');
  ipcMain.removeHandler('git:create-branch');
  ipcMain.removeHandler('git:log');
  ipcMain.removeHandler('git:init');

  // Remote access cleanup
  ipcMain.removeHandler('remote:start');
  ipcMain.removeHandler('remote:stop');
  ipcMain.removeHandler('remote:status');
  ipcMain.removeHandler('remote:regenerate-api-key');
  ipcMain.removeHandler('remote:generate-qr');

  // Rules/Skills cleanup
  ipcMain.removeHandler('rules:list');
  ipcMain.removeHandler('rules:save');
  ipcMain.removeHandler('rules:delete');
  ipcMain.removeHandler('rules:toggle');
  ipcMain.removeHandler('skills:list');
  ipcMain.removeHandler('skills:get');
  ipcMain.removeHandler('skills:save');
  ipcMain.removeHandler('skills:delete');

  // Add-ons cleanup
  ipcMain.removeHandler('addons:list');
  ipcMain.removeHandler('addons:install');
  ipcMain.removeHandler('addons:uninstall');

  // Updater cleanup
  ipcMain.removeHandler('app:check-for-updates');
  ipcMain.removeHandler('app:install-update');
}
