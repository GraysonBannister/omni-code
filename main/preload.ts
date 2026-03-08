import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API type for TypeScript
type AgentEvent =
  | { type: 'stream_delta'; delta: { type: 'text'; text?: string } }
  | { type: 'turn_complete'; message: unknown }
  | { type: 'tool_call_start'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolName: string; toolId: string; result: unknown }
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'error'; error: { message: string } }
  | { type: 'orchestration_task_start'; taskId: string; capability: string; description: string }
  | { type: 'orchestration_task_end'; taskId: string; success: boolean; durationMs: number }
  | { type: 'orchestration_complete'; summary: string };

// Agent API
type AgentAPI = {
  sendMessage: (message: string) => Promise<void>;
  abort: () => Promise<void>;
  switchModel: (model: string, provider: string) => Promise<boolean>;
  onEvent: (callback: (event: AgentEvent) => void) => () => void;
  clearConversation: () => Promise<void>;
};

// File API
type FileAPI = {
  read: (filePath: string) => Promise<{ content: string; error?: string }>;
  write: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  edit: (filePath: string, oldString: string, newString: string) => Promise<{ success: boolean; error?: string }>;
  list: (dirPath: string) => Promise<{ files: Array<{ name: string; isDirectory: boolean; path: string }>; error?: string }>;
  watch: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  unwatch: (dirPath: string) => Promise<void>;
  onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => () => void;
};

// Tool API
type ToolAPI = {
  execute: (toolName: string, input: Record<string, unknown>) => Promise<{ result: unknown; error?: string }>;
  list: () => Promise<Array<{ name: string; description: string; category: string }>>;
};

// Config API
type ConfigAPI = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  getModels: () => Promise<Array<{ id: string; name: string; provider: string; available: boolean }>>;
  getProviders: () => Promise<Array<{ name: string; available: boolean; models: string[] }>>;
};

// Dialog API
type DialogAPI = {
  openFolder: () => Promise<{ canceled: boolean; path: string | null }>;
};

// App API
type AppAPI = {
  platform: () => Promise<NodeJS.Platform>;
  version: () => Promise<string>;
  onBeforeQuit: (callback: () => void) => () => void;
  onMenuAction: (callback: (action: string) => void) => () => void;
  onOpenRecent: (callback: (path: string) => void) => () => void;
};

// Settings API
type SettingsAPI = {
  get: (path: string) => Promise<{ value: any; error: string | null }>;
  getAll: () => Promise<{ value: any; error: string | null }>;
  set: (path: string, value: any) => Promise<{ success: boolean; error: string | null }>;
  reset: (path?: string) => Promise<{ success: boolean; error: string | null }>;
  addRecentWorkspace: (workspacePath: string) => Promise<{ success: boolean; error: string | null }>;
  getRecentWorkspaces: () => Promise<{ value: string[]; error: string | null }>;
};

// Main Electron API
type ElectronAPI = {
  agent: AgentAPI;
  file: FileAPI;
  tool: ToolAPI;
  config: ConfigAPI;
  dialog: DialogAPI;
  app: AppAPI;
  settings: SettingsAPI;
};

// Expose APIs via contextBridge
const api: ElectronAPI = {
  agent: {
    sendMessage: (message: string) => ipcRenderer.invoke('agent:send-message', message),
    abort: () => ipcRenderer.invoke('agent:abort'),
    switchModel: (model: string, provider: string) => ipcRenderer.invoke('agent:switch-model', model, provider),
    clearConversation: () => ipcRenderer.invoke('agent:clear-conversation'),
    onEvent: (callback: (event: AgentEvent) => void) => {
      const handler = (_: IpcRendererEvent, event: AgentEvent) => callback(event);
      ipcRenderer.on('agent:event', handler);
      return () => ipcRenderer.off('agent:event', handler);
    },
  },

  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    write: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
    edit: (filePath: string, oldString: string, newString: string) =>
      ipcRenderer.invoke('file:edit', filePath, oldString, newString),
    list: (dirPath: string) => ipcRenderer.invoke('file:list', dirPath),
    watch: (dirPath: string) => ipcRenderer.invoke('file:watch', dirPath),
    unwatch: (dirPath: string) => ipcRenderer.invoke('file:unwatch', dirPath),
    onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { type: 'add' | 'change' | 'unlink'; path: string }) => callback(event);
      ipcRenderer.on('file:change', handler);
      return () => ipcRenderer.off('file:change', handler);
    },
  },

  tool: {
    execute: (toolName: string, input: Record<string, unknown>) =>
      ipcRenderer.invoke('tool:execute', toolName, input),
    list: () => ipcRenderer.invoke('tool:list'),
  },

  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    getModels: () => ipcRenderer.invoke('config:get-models'),
    getProviders: () => ipcRenderer.invoke('config:get-providers'),
    setCwd: (cwd: string) => ipcRenderer.invoke('config:set-cwd', cwd),
    getCwd: () => ipcRenderer.invoke('config:get-cwd'),
  },

  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  },

  settings: {
    get: (path: string) => ipcRenderer.invoke('settings:get', path),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (path: string, value: any) => ipcRenderer.invoke('settings:set', path, value),
    reset: (path?: string) => ipcRenderer.invoke('settings:reset', path),
    addRecentWorkspace: (workspacePath: string) => ipcRenderer.invoke('settings:addRecentWorkspace', workspacePath),
    getRecentWorkspaces: () => ipcRenderer.invoke('settings:getRecentWorkspaces'),
  },

  app: {
    platform: () => ipcRenderer.invoke('app:platform'),
    version: () => ipcRenderer.invoke('app:version'),
    onBeforeQuit: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('app:before-quit', handler);
      return () => ipcRenderer.off('app:before-quit', handler);
    },
    onMenuAction: (callback: (action: string) => void) => {
      const handler = (_: IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on('menu:action', handler);
      // Listen to specific menu channels
      const menuChannels = [
        'menu:new-file', 'menu:open-folder', 'menu:save', 'menu:open-settings',
        'menu:toggle-sidebar', 'menu:toggle-chat',
        'menu:send-message', 'menu:abort', 'menu:clear-chat'
      ];
      menuChannels.forEach(channel => {
        ipcRenderer.on(channel, (_, ...args) => handler(_, channel.replace('menu:', '')));
      });
      return () => {
        ipcRenderer.off('menu:action', handler);
        menuChannels.forEach(channel => ipcRenderer.removeAllListeners(channel));
      };
    },
    onOpenRecent: (callback: (path: string) => void) => {
      const handler = (_: IpcRendererEvent, path: string) => callback(path);
      ipcRenderer.on('menu:open-recent', handler);
      return () => ipcRenderer.off('menu:open-recent', handler);
    },
  },
};

// Expose to window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', api);

// Also expose a simpler API for direct access
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: {
      platform: NodeJS.Platform;
      versions: {
        node: string;
        electron: string;
        chrome: string;
      };
    };
  }
}

export type { ElectronAPI, AgentAPI, FileAPI, ToolAPI, ConfigAPI, DialogAPI, AppAPI, SettingsAPI, AgentEvent };
