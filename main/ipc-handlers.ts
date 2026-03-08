import { ipcMain, BrowserWindow, IpcMainInvokeEvent, dialog } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { setWorkingDirectory, getWorkingDirectory } from './core-integration.js';

// This file sets up IPC handlers that will be connected to the Agent and Tools
// The actual implementations will be provided by the agent-bridge

// Store references to be set by agent-bridge
let agentRef: {
  sendMessage: (message: string) => Promise<void>;
  abort: () => void;
  switchModel: (model: string, provider: string) => Promise<boolean>;
  clearConversation: () => void;
  onEvent: (callback: (event: unknown) => void) => () => void;
} | null = null;

let toolsRef: {
  execute: (toolName: string, input: Record<string, unknown>) => Promise<unknown>;
  list: () => Array<{ name: string; description: string; category: string }>;
} | null = null;

let configRef: {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  getModels: () => Array<{ id: string; name: string; provider: string; available: boolean }>;
  getProviders: () => Array<{ name: string; available: boolean; models: string[] }>;
} | null = null;

// File watchers
const fileWatchers = new Map<string, AbortController>();

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
  // Agent handlers
  ipcMain.handle('agent:send-message', async (_: IpcMainInvokeEvent, message: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    await agentRef.sendMessage(message);
  });

  ipcMain.handle('agent:abort', async () => {
    if (!agentRef) throw new Error('Agent not initialized');
    agentRef.abort();
  });

  ipcMain.handle('agent:switch-model', async (_: IpcMainInvokeEvent, model: string, provider: string) => {
    if (!agentRef) throw new Error('Agent not initialized');
    return await agentRef.switchModel(model, provider);
  });

  ipcMain.handle('agent:clear-conversation', async () => {
    if (!agentRef) throw new Error('Agent not initialized');
    agentRef.clearConversation();
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
      await fs.writeFile(resolvedPath, content, 'utf-8');
      return { success: true };
    } catch (error) {
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

  ipcMain.handle('app:get-version', async () => {
    const { app } = require('electron');
    return app.getVersion();
  });

  ipcMain.handle('app:get-platform', async () => {
    return process.platform;
  });
}

export function cleanupIpcHandlers(): void {
  // Clean up all file watchers
  fileWatchers.forEach(controller => controller.abort());
  fileWatchers.clear();
  
  // Remove all IPC handlers
  ipcMain.removeHandler('agent:send-message');
  ipcMain.removeHandler('agent:abort');
  ipcMain.removeHandler('agent:switch-model');
  ipcMain.removeHandler('agent:clear-conversation');
  ipcMain.removeHandler('file:read');
  ipcMain.removeHandler('file:write');
  ipcMain.removeHandler('file:edit');
  ipcMain.removeHandler('file:list');
  ipcMain.removeHandler('file:watch');
  ipcMain.removeHandler('file:unwatch');
  ipcMain.removeHandler('tool:execute');
  ipcMain.removeHandler('tool:list');
  ipcMain.removeHandler('config:get');
  ipcMain.removeHandler('config:set');
  ipcMain.removeHandler('config:get-models');
  ipcMain.removeHandler('config:get-providers');
  ipcMain.removeHandler('dialog:open-folder');
  ipcMain.removeHandler('app:get-version');
  ipcMain.removeHandler('app:get-platform');
}
