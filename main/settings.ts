// Settings Manager for omni-code Electron app
// Handles persistent storage of user preferences using electron-store

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type StoreType from 'electron-store';

// Dynamic import for electron-store to handle CJS/ESM compatibility
let Store: typeof StoreType | null = null;
let storeImportError: Error | null = null;

async function initializeStore(): Promise<typeof StoreType> {
  if (Store) return Store;
  
  try {
    // Use dynamic import for proper ESM compatibility
    const storeModule = await import('electron-store');
    
    // Handle various export patterns
    const StoreClass = (storeModule as any).default || storeModule;
    
    if (typeof StoreClass !== 'function') {
      throw new Error(`electron-store export is not a constructor. Got: ${typeof StoreClass}`);
    }
    
    Store = StoreClass;
    console.log('[Settings] electron-store initialized successfully');
    return Store;
  } catch (error) {
    storeImportError = error as Error;
    console.error('[Settings] Failed to initialize electron-store:', error);
    throw error;
  }
}

// Settings Schema Definition
export interface SettingsSchema {
  // General / Appearance
  general: {
    theme: 'dark' | 'light' | 'system';
    fontFamily: string;
    fontSize: number;
    sidebarVisible: boolean;
    chatVisible: boolean;
    windowRestore: 'last' | 'default';
  };

  // Editor
  editor: {
    tabSize: 2 | 4;
    wordWrap: 'on' | 'off' | 'wordWrapColumn';
    minimap: boolean;
    lineNumbers: 'on' | 'off' | 'relative';
    formatOnSave: boolean;
    autoSave: 'off' | 'afterDelay' | 'onFocusChange';
    autoSaveDelay: number;
    showWhitespace: boolean;
    smoothScrolling: boolean;
    cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  };

  // AI / Agent
  ai: {
    defaultProvider: string;
    defaultModel: string;
    temperature: number;
    maxContextTokens: number;
    autoRunMode: 'ask' | 'always' | 'never';
    showTokenCosts: boolean;
    showThinking: boolean;
    autoAcceptEdits: boolean;
    contextCompressionThreshold: number;
    contextRecentMessagesToKeep: number;
    maxTurns: number;
  };

  // Chat Persistence
  chat: {
    autoSave: boolean;
    autoSaveIntervalMs: number;
    maxSavedChatsPerWorkspace: number;
  };

  // Keyboard Shortcuts
  shortcuts: {
    openChat: string;
    toggleSidebar: string;
    toggleChat: string;
    sendMessage: string;
    abortAgent: string;
    acceptAllEdits: string;
    rejectAllEdits: string;
    openSettings: string;
    newFile: string;
    openFolder: string;
    saveFile: string;
    formatDocument: string;
    searchFiles: string;
  };

  // Files
  files: {
    excludePatterns: string[];
    defaultFolder: string | null;
    /** @deprecated Use recentFolders instead */
    defaultWorkspace: string | null;
    recentFolders: string[];
    recentWorkspaces: string[];
    maxRecentFolders: number;
    maxRecentWorkspaces: number;
    followSymlinks: boolean;
  };

  // Workspace Management
  workspaces: {
    /** List of saved workspace file paths */
    savedWorkspaces: string[];
    /** Maximum number of recent workspaces to track */
    maxRecentWorkspaces: number;
  };

  // Indexing / Search
  indexing: {
    autoIndex: boolean;
    autoSync: boolean;
    syncIntervalMinutes: number;
    useSemanticChunking: boolean;
    maxFilesToIndex: number;
    maxFileSizeMB: number;
    excludePatterns: string[];
  };

  // Privacy / Security
  privacy: {
    telemetryEnabled: boolean;
    crashReportsEnabled: boolean;
    analyticsEnabled: boolean;
  };

  // API Keys for LLM providers
  apiKeys: {
    anthropic?: string;
    openai?: string;
    google?: string;
    groq?: string;
    together?: string;
    xai?: string;
    moonshot?: string;
    ollama?: string;
    lmstudio?: string;
  };

  // Usage tracking settings
  usage: {
    monthlyLimit: number | null;
    alertThresholds: number[];
    dataRetentionMonths: number;
    showInStatusBar: boolean;
  };

  // Notifications
  notifications: {
    enabled: boolean;
    soundEnabled: boolean;
    playOnUserInput: boolean;
    playOnResponseComplete: boolean;
  };

  // Remote Access
  remoteAccess: {
    enabled: boolean;
    ngrokAuthToken: string;
    apiKey: string | null;
    port: number;
    allowedOrigins: string[];
    rateLimitRequests: number;
    rateLimitWindowMs: number;
    /** Workspaces shared for remote access */
    sharedWorkspaces: Array<{
      sharedId: string;
      workspaceId: string;
      filePath: string;
      name: string;
      folderCount: number;
      folders: Array<{ id: string; path: string; name: string }>;
      isActive: boolean;
      addedAt: number;
      isSingleFolder: boolean;
    }>;
    /** Currently active shared workspace ID */
    activeWorkspaceId: string | null;
  };
}

// Default Settings
export const defaultSettings: SettingsSchema = {
  general: {
    theme: 'dark',
    fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
    fontSize: 14,
    sidebarVisible: true,
    chatVisible: true,
    windowRestore: 'last',
  },

  editor: {
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on',
    formatOnSave: true,
    autoSave: 'off',
    autoSaveDelay: 1000,
    showWhitespace: false,
    smoothScrolling: true,
    cursorBlinking: 'blink',
  },

  ai: {
    defaultProvider: 'anthropic',
    defaultModel: 'claude-sonnet-4-5',
    temperature: 0.7,
    maxContextTokens: 128000,
    autoRunMode: 'always',
    showTokenCosts: true,
    showThinking: true,
    autoAcceptEdits: false,
    contextCompressionThreshold: 0.9,
    contextRecentMessagesToKeep: 6,
    maxTurns: 50,
  },

  chat: {
    autoSave: true,
    autoSaveIntervalMs: 3000,
    maxSavedChatsPerWorkspace: 50,
  },

  shortcuts: {
    openChat: 'CmdOrCtrl+Shift+L',
    toggleSidebar: 'CmdOrCtrl+B',
    toggleChat: 'CmdOrCtrl+Shift+C',
    sendMessage: 'CmdOrCtrl+Enter',
    abortAgent: 'Escape',
    acceptAllEdits: 'CmdOrCtrl+Shift+A',
    rejectAllEdits: 'CmdOrCtrl+Shift+R',
    openSettings: 'CmdOrCtrl+,',
    newFile: 'CmdOrCtrl+N',
    openFolder: 'CmdOrCtrl+O',
    saveFile: 'CmdOrCtrl+S',
    formatDocument: 'Shift+Alt+F',
    searchFiles: 'CmdOrCtrl+Shift+F',
  },

  files: {
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.cache/**',
      '**/*.log',
      '**/Thumbs.db',
      '**/.DS_Store',
    ],
    defaultFolder: null,
    defaultWorkspace: null, // @deprecated
    recentFolders: [],
    recentWorkspaces: [],
    maxRecentFolders: 10,
    maxRecentWorkspaces: 10,
    followSymlinks: false,
  },

  workspaces: {
    savedWorkspaces: [],
    maxRecentWorkspaces: 10,
  },

  indexing: {
    autoIndex: true,
    autoSync: true,
    syncIntervalMinutes: 5,
    useSemanticChunking: true,
    maxFilesToIndex: 500,
    maxFileSizeMB: 1,
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/package-lock.json',
      '**/yarn.lock',
    ],
  },

  privacy: {
    telemetryEnabled: false,
    crashReportsEnabled: false,
    analyticsEnabled: false,
  },

  apiKeys: {},

  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1.0],
    dataRetentionMonths: 12,
    showInStatusBar: true,
  },

  notifications: {
    enabled: true,
    soundEnabled: true,
    playOnUserInput: true,
    playOnResponseComplete: true,
  },

  remoteAccess: {
    enabled: false,
    ngrokAuthToken: '',
    apiKey: null,
    port: 3000,
    allowedOrigins: [],
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1000,  // 15 minutes
    sharedWorkspaces: [],
    activeWorkspaceId: null,
  },
};

// Settings Manager Class
class SettingsManager {
  private store: StoreType<SettingsSchema> | null = null;
  private listeners: Set<(key: string, value: any) => void> = new Set();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const StoreClass = await initializeStore();
      
      this.store = new StoreClass<SettingsSchema>({
        projectName: 'omni-code',
        defaults: defaultSettings,
        clearInvalidConfig: true,
      });
      
      this.initialized = true;
      console.log('[Settings] SettingsManager initialized successfully');
    } catch (error) {
      console.error('[Settings] Failed to initialize SettingsManager:', error);
      throw error;
    }
  }

  private ensureInitialized(): StoreType<SettingsSchema> {
    if (!this.store || !this.initialized) {
      throw new Error('SettingsManager not initialized. Call initialize() first.');
    }
    return this.store;
  }

  // Get a specific setting by path (e.g., 'general.theme')
  get<T>(path: string): T {
    return this.ensureInitialized().get(path) as T;
  }

  // Get all settings
  getAll(): SettingsSchema {
    return this.ensureInitialized().store;
  }

  // Set a specific setting by path
  set<T>(path: string, value: T): void {
    this.ensureInitialized().set(path, value);
    this.notifyListeners(path, value);
  }

  // Reset a setting to default (or all if no path provided)
  reset(path?: string): void {
    const store = this.ensureInitialized();
    if (path) {
      const defaultValue = this.getDefaultValue(path);
      this.set(path, defaultValue);
    } else {
      store.clear();
      Object.entries(defaultSettings).forEach(([key, value]) => {
        store.set(key, value);
      });
      this.notifyListeners('*', store.store);
    }
  }

  // Get default value for a path
  private getDefaultValue(path: string): any {
    const parts = path.split('.');
    let value: any = defaultSettings;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  }

  // Subscribe to changes
  onChange(callback: (key: string, value: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners(key: string, value: any): void {
    this.listeners.forEach((listener) => listener(key, value));
  }

  // Add a recent folder
  addRecentFolder(folderPath: string): void {
    const store = this.ensureInitialized();
    const recent = store.get('files.recentFolders');
    const maxRecent = store.get('files.maxRecentFolders');

    // Remove if already exists
    const filtered = recent.filter((w) => w !== folderPath);
    // Add to beginning
    filtered.unshift(folderPath);
    // Limit to max
    const limited = filtered.slice(0, maxRecent);

    store.set('files.recentFolders', limited);
    console.log('[Settings] Added recent folder:', folderPath);
  }

  // Get recent folders
  getRecentFolders(): string[] {
    return this.ensureInitialized().get('files.recentFolders');
  }

  // Add a recent workspace (workspace file)
  addRecentWorkspace(workspacePath: string): void {
    const store = this.ensureInitialized();
    const recent = store.get('files.recentWorkspaces');
    const maxRecent = store.get('workspaces.maxRecentWorkspaces');

    // Remove if already exists
    const filtered = recent.filter((w) => w !== workspacePath);
    // Add to beginning
    filtered.unshift(workspacePath);
    // Limit to max
    const limited = filtered.slice(0, maxRecent);

    store.set('files.recentWorkspaces', limited);
    console.log('[Settings] Added recent workspace:', workspacePath);
  }

  // Get recent workspaces
  getRecentWorkspaces(): string[] {
    return this.ensureInitialized().get('files.recentWorkspaces');
  }

  // Add a saved workspace (persisted workspace list)
  addSavedWorkspace(workspacePath: string): void {
    const store = this.ensureInitialized();
    const saved = store.get('workspaces.savedWorkspaces');

    // Avoid duplicates
    if (!saved.includes(workspacePath)) {
      saved.push(workspacePath);
      store.set('workspaces.savedWorkspaces', saved);
    }
  }

  // Remove a saved workspace
  removeSavedWorkspace(workspacePath: string): void {
    const store = this.ensureInitialized();
    const saved = store.get('workspaces.savedWorkspaces');
    const filtered = saved.filter((w) => w !== workspacePath);
    store.set('workspaces.savedWorkspaces', filtered);
  }

  // Get all saved workspaces
  getSavedWorkspaces(): string[] {
    return this.ensureInitialized().get('workspaces.savedWorkspaces');
  }

  /**
   * Resolve a setting value using hierarchical lookup:
   * Global → Workspace → Project (if applicable)
   * 
   * @param key - Setting key path (e.g., 'ai.model')
   * @param workspaceSettings - Optional workspace-level settings
   * @param projectSettings - Optional project-level settings
   * @returns The resolved setting value
   */
  resolveSetting<T>(
    key: string,
    workspaceSettings?: Record<string, any>,
    projectSettings?: Record<string, any>
  ): T {
    const globalValue = this.get(key);

    // Check project-level override
    if (projectSettings && this.getNestedValue(projectSettings, key) !== undefined) {
      return this.getNestedValue(projectSettings, key);
    }

    // Check workspace-level override
    if (workspaceSettings && this.getNestedValue(workspaceSettings, key) !== undefined) {
      return this.getNestedValue(workspaceSettings, key);
    }

    // Fall back to global setting
    return globalValue;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    return value;
  }
}

// Lazy singleton instance - created on first access
let settingsManagerInstance: SettingsManager | null = null;
let initializationPromise: Promise<SettingsManager> | null = null;

export async function getSettingsManager(): Promise<SettingsManager> {
  if (settingsManagerInstance) {
    return settingsManagerInstance;
  }
  
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const manager = new SettingsManager();
      await manager.initialize();
      settingsManagerInstance = manager;
      return manager;
    })();
  }
  
  return initializationPromise;
}

// Synchronous wrapper for backward compatibility - throws if not initialized
const syncManagerProxy = {
  get: (path: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.get(path);
  },
  getAll: () => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.getAll();
  },
  set: (path: string, value: any) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.set(path, value);
  },
  reset: (path?: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.reset(path);
  },
  addRecentFolder: (folderPath: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.addRecentFolder(folderPath);
  },
  getRecentFolders: () => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.getRecentFolders();
  },
  addRecentWorkspace: (workspacePath: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.addRecentWorkspace(workspacePath);
  },
  getRecentWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.getRecentWorkspaces();
  },
  addSavedWorkspace: (workspacePath: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.addSavedWorkspace(workspacePath);
  },
  removeSavedWorkspace: (workspacePath: string) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.removeSavedWorkspace(workspacePath);
  },
  getSavedWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.getSavedWorkspaces();
  },
  resolveSetting: (key: string, workspaceSettings?: Record<string, any>, projectSettings?: Record<string, any>) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.resolveSetting(key, workspaceSettings, projectSettings);
  },
  onChange: (callback: (key: string, value: any) => void) => {
    if (!settingsManagerInstance) {
      throw new Error('SettingsManager not initialized');
    }
    return settingsManagerInstance.onChange(callback);
  },
};

// Export for backward compatibility (will throw if not initialized)
export const settingsManager = syncManagerProxy;

// Setup IPC handlers for settings
export function setupSettingsIpcHandlers(): void {
  console.log('[Settings] Setting up IPC handlers...');
  
  // Initialize the manager when setting up handlers
  getSettingsManager().then(() => {
    console.log('[Settings] SettingsManager initialized via IPC setup');
  }).catch(error => {
    console.error('[Settings] Failed to initialize settings manager:', error);
  });

  // Get a specific setting
  ipcMain.handle('settings:get', async (_: IpcMainInvokeEvent, path: string) => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.get(path), error: null };
    } catch (error) {
      return { value: null, error: (error as Error).message };
    }
  });

  // Get all settings
  ipcMain.handle('settings:getAll', async () => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.getAll(), error: null };
    } catch (error) {
      return { value: null, error: (error as Error).message };
    }
  });

  // Set a specific setting
  ipcMain.handle('settings:set', async (_: IpcMainInvokeEvent, path: string, value: any) => {
    try {
      const manager = await getSettingsManager();
      manager.set(path, value);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reset settings
  ipcMain.handle('settings:reset', async (_: IpcMainInvokeEvent, path?: string) => {
    try {
      const manager = await getSettingsManager();
      manager.reset(path);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Add recent folder
  ipcMain.handle('settings:addRecentFolder', async (_: IpcMainInvokeEvent, folderPath: string) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentFolder(folderPath);
      return { success: true, error: null };
    } catch (error) {
      console.error('[Settings] Error adding recent folder:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get recent folders
  ipcMain.handle('settings:getRecentFolders', async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentFolders();
      return { value, error: null };
    } catch (error) {
      console.error('[Settings] Error getting recent folders:', error);
      return { value: null, error: (error as Error).message };
    }
  });

  // Add recent workspace (workspace file)
  ipcMain.handle('settings:addRecentWorkspace', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error('[Settings] Error adding recent workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get recent workspaces
  ipcMain.handle('settings:getRecentWorkspaces', async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentWorkspaces();
      console.log('[Settings] Getting recent workspaces:', value);
      return { value, error: null };
    } catch (error) {
      console.error('[Settings] Error getting recent workspaces:', error);
      return { value: null, error: (error as Error).message };
    }
  });

  // Add saved workspace
  ipcMain.handle('settings:addSavedWorkspace', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    try {
      const manager = await getSettingsManager();
      manager.addSavedWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error('[Settings] Error adding saved workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Remove saved workspace
  ipcMain.handle('settings:removeSavedWorkspace', async (_: IpcMainInvokeEvent, workspacePath: string) => {
    try {
      const manager = await getSettingsManager();
      manager.removeSavedWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error('[Settings] Error removing saved workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get saved workspaces
  ipcMain.handle('settings:getSavedWorkspaces', async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getSavedWorkspaces();
      return { value, error: null };
    } catch (error) {
      console.error('[Settings] Error getting saved workspaces:', error);
      return { value: null, error: (error as Error).message };
    }
  });

  // Resolve a setting with hierarchical lookup
  ipcMain.handle('settings:resolve', async (_: IpcMainInvokeEvent, key: string, workspaceSettings?: Record<string, any>, projectSettings?: Record<string, any>) => {
    try {
      const manager = await getSettingsManager();
      const value = manager.resolveSetting(key, workspaceSettings, projectSettings);
      return { value, error: null };
    } catch (error) {
      console.error('[Settings] Error resolving setting:', error);
      return { value: null, error: (error as Error).message };
    }
  });

  console.log('[Settings] IPC handlers setup complete');
}

// Cleanup IPC handlers (for hot reload support)
export function cleanupSettingsIpcHandlers(): void {
  ipcMain.removeHandler('settings:get');
  ipcMain.removeHandler('settings:getAll');
  ipcMain.removeHandler('settings:set');
  ipcMain.removeHandler('settings:reset');
  ipcMain.removeHandler('settings:addRecentFolder');
  ipcMain.removeHandler('settings:getRecentFolders');
  ipcMain.removeHandler('settings:addRecentWorkspace');
  ipcMain.removeHandler('settings:getRecentWorkspaces');
  ipcMain.removeHandler('settings:addSavedWorkspace');
  ipcMain.removeHandler('settings:removeSavedWorkspace');
  ipcMain.removeHandler('settings:getSavedWorkspaces');
  ipcMain.removeHandler('settings:resolve');
}
