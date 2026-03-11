import { create } from 'zustand';

// Settings Schema (mirrors main/settings.ts)
export interface SettingsSchema {
  general: {
    theme: 'dark' | 'light' | 'system';
    fontFamily: string;
    fontSize: number;
    sidebarVisible: boolean;
    chatVisible: boolean;
    windowRestore: 'last' | 'default';
  };

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

  ai: {
    defaultProvider: string;
    defaultModel: string;
    temperature: number;
    maxContextTokens: number;
    autoRunMode: 'ask' | 'always' | 'never';
    showTokenCosts: boolean;
    showThinking: boolean;
    autoAcceptEdits: boolean;
    contextCompressionThreshold: number; // 0.5 - 0.95
    contextRecentMessagesToKeep: number; // 3 - 20
    maxTurns: number; // max agent turns per task (10 - 200)
  };

  chat: {
    autoSave: boolean;
    autoSaveIntervalMs: number;
    maxSavedChatsPerWorkspace: number;
  };

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

  files: {
    excludePatterns: string[];
    defaultWorkspace: string | null;
    recentWorkspaces: string[];
    maxRecentWorkspaces: number;
    followSymlinks: boolean;
  };

  indexing: {
    autoIndex: boolean;
    autoSync: boolean;
    syncIntervalMinutes: number;
    useSemanticChunking: boolean;
    maxFilesToIndex: number;
    maxFileSizeMB: number;
    excludePatterns: string[];
  };

  privacy: {
    telemetryEnabled: boolean;
    crashReportsEnabled: boolean;
    analyticsEnabled: boolean;
  };

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

  usage: {
    monthlyLimit: number | null;
    alertThresholds: number[];
    dataRetentionMonths: number;
    showInStatusBar: boolean;
  };
}

// Settings State
interface SettingsState {
  settings: SettingsSchema | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  getSetting: <T>(path: string) => T | undefined;
  setSetting: <T>(path: string, value: T) => Promise<void>;
  resetSetting: (path?: string) => Promise<void>;
  addRecentWorkspace: (workspacePath: string) => Promise<void>;
  getRecentWorkspaces: () => Promise<string[]>;
}

// Default settings (mirrors main/settings.ts defaults)
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
    defaultWorkspace: null,
    recentWorkspaces: [],
    maxRecentWorkspaces: 10,
    followSymlinks: false,
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

  apiKeys: {
    anthropic: '',
    openai: '',
    google: '',
    groq: '',
    together: '',
    xai: '',
    moonshot: '',
    ollama: '',
    lmstudio: '',
  },

  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1.0],
    dataRetentionMonths: 12,
    showInStatusBar: true,
  },
};

// Helper to get nested value from object
function getNestedValue<T>(obj: any, path: string): T | undefined {
  const parts = path.split('.');
  let value = obj;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value as T;
}

// Create Zustand store
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    if (!window.electronAPI) {
      set({ error: 'electronAPI not available', settings: defaultSettings });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await window.electronAPI.settings.getAll();

      if (result.error) {
        console.error('Failed to load settings:', result.error);
        set({ error: result.error, settings: defaultSettings, isLoading: false });
      } else {
        set({ settings: result.value, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ error: (error as Error).message, settings: defaultSettings, isLoading: false });
    }
  },

  getSetting: <T>(path: string): T | undefined => {
    const { settings } = get();
    if (!settings) return undefined;
    return getNestedValue<T>(settings, path);
  },

  setSetting: async <T>(path: string, value: T): Promise<void> => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    // Optimistic update
    const { settings } = get();
    if (settings) {
      const newSettings = { ...settings };
      const parts = path.split('.');
      let target: any = newSettings;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      set({ settings: newSettings });
    }

    try {
      const result = await window.electronAPI.settings.set(path, value);

      if (result.error) {
        console.error('Failed to set setting:', result.error);
        // Revert by reloading
        await get().loadSettings();
      }
    } catch (error) {
      console.error('Failed to set setting:', error);
      // Revert by reloading
      await get().loadSettings();
    }
  },

  resetSetting: async (path?: string): Promise<void> => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    try {
      const result = await window.electronAPI.settings.reset(path);

      if (result.error) {
        console.error('Failed to reset setting:', result.error);
      } else {
        // Reload settings after reset
        await get().loadSettings();
      }
    } catch (error) {
      console.error('Failed to reset setting:', error);
    }
  },

  addRecentWorkspace: async (workspacePath: string): Promise<void> => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    try {
      const result = await window.electronAPI.settings.addRecentWorkspace(workspacePath);

      if (result.error) {
        console.error('Failed to add recent workspace:', result.error);
      } else {
        // Reload settings to get updated recent workspaces
        await get().loadSettings();
      }
    } catch (error) {
      console.error('Failed to add recent workspace:', error);
    }
  },

  getRecentWorkspaces: async (): Promise<string[]> => {
    if (!window.electronAPI) {
      return [];
    }

    try {
      const result = await window.electronAPI.settings.getRecentWorkspaces();

      if (result.error) {
        console.error('Failed to get recent workspaces:', result.error);
        return [];
      }

      return result.value || [];
    } catch (error) {
      console.error('Failed to get recent workspaces:', error);
      return [];
    }
  },
}));
