"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/settings.ts
var settings_exports = {};
__export(settings_exports, {
  cleanupSettingsIpcHandlers: () => cleanupSettingsIpcHandlers,
  defaultSettings: () => defaultSettings,
  getSettingsManager: () => getSettingsManager,
  settingsManager: () => settingsManager,
  setupSettingsIpcHandlers: () => setupSettingsIpcHandlers
});
module.exports = __toCommonJS(settings_exports);
var import_electron = require("electron");
var Store = null;
var storeImportError = null;
async function initializeStore() {
  if (Store)
    return Store;
  try {
    const storeModule = await import("electron-store");
    const StoreClass = storeModule.default || storeModule;
    if (typeof StoreClass !== "function") {
      throw new Error(`electron-store export is not a constructor. Got: ${typeof StoreClass}`);
    }
    Store = StoreClass;
    console.log("[Settings] electron-store initialized successfully");
    return Store;
  } catch (error) {
    storeImportError = error;
    console.error("[Settings] Failed to initialize electron-store:", error);
    throw error;
  }
}
var defaultSettings = {
  general: {
    theme: "dark",
    fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
    fontSize: 14,
    sidebarVisible: true,
    chatVisible: true,
    windowRestore: "last"
  },
  editor: {
    tabSize: 2,
    wordWrap: "on",
    minimap: true,
    lineNumbers: "on",
    formatOnSave: true,
    autoSave: "off",
    autoSaveDelay: 1e3,
    showWhitespace: false,
    smoothScrolling: true,
    cursorBlinking: "blink"
  },
  ai: {
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-4-5",
    temperature: 0.7,
    maxContextTokens: 128e3,
    autoRunMode: "always",
    showTokenCosts: true,
    showThinking: true,
    autoAcceptEdits: false,
    contextCompressionThreshold: 0.9,
    contextRecentMessagesToKeep: 6,
    maxTurns: 50
  },
  chat: {
    autoSave: true,
    autoSaveIntervalMs: 3e3,
    maxSavedChatsPerWorkspace: 50
  },
  shortcuts: {
    openChat: "CmdOrCtrl+Shift+L",
    toggleSidebar: "CmdOrCtrl+B",
    toggleChat: "CmdOrCtrl+Shift+C",
    sendMessage: "CmdOrCtrl+Enter",
    abortAgent: "Escape",
    acceptAllEdits: "CmdOrCtrl+Shift+A",
    rejectAllEdits: "CmdOrCtrl+Shift+R",
    openSettings: "CmdOrCtrl+,",
    newFile: "CmdOrCtrl+N",
    openFolder: "CmdOrCtrl+O",
    saveFile: "CmdOrCtrl+S",
    formatDocument: "Shift+Alt+F",
    searchFiles: "CmdOrCtrl+Shift+F"
  },
  files: {
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      ".next/**",
      ".cache/**",
      "**/*.log",
      "**/Thumbs.db",
      "**/.DS_Store"
    ],
    defaultFolder: null,
    defaultWorkspace: null,
    // @deprecated
    recentFolders: [],
    recentWorkspaces: [],
    maxRecentFolders: 10,
    maxRecentWorkspaces: 10,
    followSymlinks: false
  },
  workspaces: {
    savedWorkspaces: [],
    maxRecentWorkspaces: 10
  },
  indexing: {
    autoIndex: true,
    autoSync: true,
    syncIntervalMinutes: 5,
    useSemanticChunking: true,
    maxFilesToIndex: 500,
    maxFileSizeMB: 1,
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/package-lock.json",
      "**/yarn.lock"
    ]
  },
  privacy: {
    telemetryEnabled: false,
    crashReportsEnabled: false,
    analyticsEnabled: false
  },
  apiKeys: {},
  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1],
    dataRetentionMonths: 12,
    showInStatusBar: true
  },
  notifications: {
    enabled: true,
    soundEnabled: true,
    playOnUserInput: true,
    playOnResponseComplete: true
  },
  remoteAccess: {
    enabled: false,
    ngrokAuthToken: "",
    apiKey: null,
    port: 3e3,
    allowedOrigins: [],
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1e3,
    // 15 minutes
    sharedWorkspaces: [],
    activeWorkspaceId: null
  }
};
var SettingsManager = class {
  store = null;
  listeners = /* @__PURE__ */ new Set();
  initialized = false;
  async initialize() {
    if (this.initialized)
      return;
    try {
      const StoreClass = await initializeStore();
      this.store = new StoreClass({
        projectName: "omni-code",
        defaults: defaultSettings,
        clearInvalidConfig: true
      });
      this.initialized = true;
      console.log("[Settings] SettingsManager initialized successfully");
    } catch (error) {
      console.error("[Settings] Failed to initialize SettingsManager:", error);
      throw error;
    }
  }
  ensureInitialized() {
    if (!this.store || !this.initialized) {
      throw new Error("SettingsManager not initialized. Call initialize() first.");
    }
    return this.store;
  }
  // Get a specific setting by path (e.g., 'general.theme')
  get(path) {
    return this.ensureInitialized().get(path);
  }
  // Get all settings
  getAll() {
    return this.ensureInitialized().store;
  }
  // Set a specific setting by path
  set(path, value) {
    this.ensureInitialized().set(path, value);
    this.notifyListeners(path, value);
  }
  // Reset a setting to default (or all if no path provided)
  reset(path) {
    const store = this.ensureInitialized();
    if (path) {
      const defaultValue = this.getDefaultValue(path);
      this.set(path, defaultValue);
    } else {
      store.clear();
      Object.entries(defaultSettings).forEach(([key, value]) => {
        store.set(key, value);
      });
      this.notifyListeners("*", store.store);
    }
  }
  // Get default value for a path
  getDefaultValue(path) {
    const parts = path.split(".");
    let value = defaultSettings;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  }
  // Subscribe to changes
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  // Notify all listeners
  notifyListeners(key, value) {
    this.listeners.forEach((listener) => listener(key, value));
  }
  // Add a recent folder
  addRecentFolder(folderPath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentFolders");
    const maxRecent = store.get("files.maxRecentFolders");
    const filtered = recent.filter((w) => w !== folderPath);
    filtered.unshift(folderPath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentFolders", limited);
    console.log("[Settings] Added recent folder:", folderPath);
  }
  // Get recent folders
  getRecentFolders() {
    return this.ensureInitialized().get("files.recentFolders");
  }
  // Add a recent workspace (workspace file)
  addRecentWorkspace(workspacePath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentWorkspaces");
    const maxRecent = store.get("workspaces.maxRecentWorkspaces");
    const filtered = recent.filter((w) => w !== workspacePath);
    filtered.unshift(workspacePath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentWorkspaces", limited);
    console.log("[Settings] Added recent workspace:", workspacePath);
  }
  // Get recent workspaces
  getRecentWorkspaces() {
    return this.ensureInitialized().get("files.recentWorkspaces");
  }
  // Add a saved workspace (persisted workspace list)
  addSavedWorkspace(workspacePath) {
    const store = this.ensureInitialized();
    const saved = store.get("workspaces.savedWorkspaces");
    if (!saved.includes(workspacePath)) {
      saved.push(workspacePath);
      store.set("workspaces.savedWorkspaces", saved);
    }
  }
  // Remove a saved workspace
  removeSavedWorkspace(workspacePath) {
    const store = this.ensureInitialized();
    const saved = store.get("workspaces.savedWorkspaces");
    const filtered = saved.filter((w) => w !== workspacePath);
    store.set("workspaces.savedWorkspaces", filtered);
  }
  // Get all saved workspaces
  getSavedWorkspaces() {
    return this.ensureInitialized().get("workspaces.savedWorkspaces");
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
  resolveSetting(key, workspaceSettings, projectSettings) {
    const globalValue = this.get(key);
    if (projectSettings && this.getNestedValue(projectSettings, key) !== void 0) {
      return this.getNestedValue(projectSettings, key);
    }
    if (workspaceSettings && this.getNestedValue(workspaceSettings, key) !== void 0) {
      return this.getNestedValue(workspaceSettings, key);
    }
    return globalValue;
  }
  /**
   * Get a nested value from an object using dot notation
   */
  getNestedValue(obj, path) {
    const parts = path.split(".");
    let value = obj;
    for (const part of parts) {
      if (value === null || value === void 0)
        return void 0;
      value = value[part];
    }
    return value;
  }
};
var settingsManagerInstance = null;
var initializationPromise = null;
async function getSettingsManager() {
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
var syncManagerProxy = {
  get: (path) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.get(path);
  },
  getAll: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getAll();
  },
  set: (path, value) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.set(path, value);
  },
  reset: (path) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.reset(path);
  },
  addRecentFolder: (folderPath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentFolder(folderPath);
  },
  getRecentFolders: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentFolders();
  },
  addRecentWorkspace: (workspacePath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentWorkspace(workspacePath);
  },
  getRecentWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentWorkspaces();
  },
  addSavedWorkspace: (workspacePath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addSavedWorkspace(workspacePath);
  },
  removeSavedWorkspace: (workspacePath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.removeSavedWorkspace(workspacePath);
  },
  getSavedWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getSavedWorkspaces();
  },
  resolveSetting: (key, workspaceSettings, projectSettings) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.resolveSetting(key, workspaceSettings, projectSettings);
  },
  onChange: (callback) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.onChange(callback);
  }
};
var settingsManager = syncManagerProxy;
function setupSettingsIpcHandlers() {
  console.log("[Settings] Setting up IPC handlers...");
  getSettingsManager().then(() => {
    console.log("[Settings] SettingsManager initialized via IPC setup");
  }).catch((error) => {
    console.error("[Settings] Failed to initialize settings manager:", error);
  });
  import_electron.ipcMain.handle("settings:get", async (_, path) => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.get(path), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:getAll", async () => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.getAll(), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:set", async (_, path, value) => {
    try {
      const manager = await getSettingsManager();
      manager.set(path, value);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:reset", async (_, path) => {
    try {
      const manager = await getSettingsManager();
      manager.reset(path);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:addRecentFolder", async (_, folderPath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentFolder(folderPath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent folder:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:getRecentFolders", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentFolders();
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting recent folders:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:addRecentWorkspace", async (_, workspacePath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:getRecentWorkspaces", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentWorkspaces();
      console.log("[Settings] Getting recent workspaces:", value);
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting recent workspaces:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:addSavedWorkspace", async (_, workspacePath) => {
    try {
      const manager = await getSettingsManager();
      manager.addSavedWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding saved workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:removeSavedWorkspace", async (_, workspacePath) => {
    try {
      const manager = await getSettingsManager();
      manager.removeSavedWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error removing saved workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:getSavedWorkspaces", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getSavedWorkspaces();
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting saved workspaces:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron.ipcMain.handle("settings:resolve", async (_, key, workspaceSettings, projectSettings) => {
    try {
      const manager = await getSettingsManager();
      const value = manager.resolveSetting(key, workspaceSettings, projectSettings);
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error resolving setting:", error);
      return { value: null, error: error.message };
    }
  });
  console.log("[Settings] IPC handlers setup complete");
}
function cleanupSettingsIpcHandlers() {
  import_electron.ipcMain.removeHandler("settings:get");
  import_electron.ipcMain.removeHandler("settings:getAll");
  import_electron.ipcMain.removeHandler("settings:set");
  import_electron.ipcMain.removeHandler("settings:reset");
  import_electron.ipcMain.removeHandler("settings:addRecentFolder");
  import_electron.ipcMain.removeHandler("settings:getRecentFolders");
  import_electron.ipcMain.removeHandler("settings:addRecentWorkspace");
  import_electron.ipcMain.removeHandler("settings:getRecentWorkspaces");
  import_electron.ipcMain.removeHandler("settings:addSavedWorkspace");
  import_electron.ipcMain.removeHandler("settings:removeSavedWorkspace");
  import_electron.ipcMain.removeHandler("settings:getSavedWorkspaces");
  import_electron.ipcMain.removeHandler("settings:resolve");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanupSettingsIpcHandlers,
  defaultSettings,
  getSettingsManager,
  settingsManager,
  setupSettingsIpcHandlers
});
//# sourceMappingURL=settings.cjs.map