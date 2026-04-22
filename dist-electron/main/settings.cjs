"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// main/system-sounds.ts
var system_sounds_exports = {};
__export(system_sounds_exports, {
  getOperatingSystem: () => getOperatingSystem,
  getSoundLabel: () => getSoundLabel,
  getSoundSelectOptions: () => getSoundSelectOptions,
  getSystemSounds: () => getSystemSounds,
  isSystemSound: () => isSystemSound,
  playSystemSound: () => playSystemSound
});
function getOperatingSystem() {
  const p = (0, import_os.platform)();
  if (p === "darwin")
    return "macos";
  if (p === "win32")
    return "windows";
  if (p === "linux")
    return "linux";
  return "unknown";
}
function getSystemSounds() {
  const os = getOperatingSystem();
  switch (os) {
    case "macos":
      return MACOS_SOUNDS;
    case "windows":
      return WINDOWS_SOUNDS;
    case "linux":
      return LINUX_SOUNDS;
    default:
      return [
        { id: "default", label: "System Beep (Default)", isSystemSound: true },
        { id: "none", label: "No Sound", isSystemSound: true }
      ];
  }
}
function isSystemSound(soundId) {
  if (soundId === "default" || soundId === "none")
    return true;
  if (soundId.startsWith("macos://") || soundId.startsWith("windows://") || soundId.startsWith("linux://"))
    return true;
  return false;
}
async function playSystemSound(soundId) {
  const os = getOperatingSystem();
  if (soundId === "default") {
    import_electron.shell.beep();
    return true;
  }
  if (soundId === "none") {
    return true;
  }
  try {
    if (os === "macos" && soundId.startsWith("macos://")) {
      const soundName = soundId.replace("macos://", "");
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      const soundPath = `/System/Library/Sounds/${soundName}.aiff`;
      await execAsync(`afplay "${soundPath}"`);
      return true;
    }
    if (os === "windows" && soundId.startsWith("windows://")) {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      const soundName = soundId.replace("windows://", "");
      const psCommand = `[System.Media.SystemSounds]::${soundName}.Play(); Start-Sleep -m 500`;
      await execAsync(`powershell.exe -Command "${psCommand}"`);
      return true;
    }
    if (os === "linux" && soundId.startsWith("linux://")) {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      const soundName = soundId.replace("linux://", "");
      try {
        await execAsync(`canberra-gtk-play -i ${soundName}`);
        return true;
      } catch {
        try {
          const searchPaths = [
            `/usr/share/sounds/freedesktop/stereo/${soundName}.oga`,
            `/usr/share/sounds/gnome/default/alerts/${soundName}.ogg`,
            `/usr/share/sounds/deepin/stereo/${soundName}.wav`,
            `/usr/share/sounds/ubuntu/stereo/${soundName}.ogg`
          ];
          for (const path of searchPaths) {
            try {
              await execAsync(`paplay "${path}"`);
              return true;
            } catch {
              continue;
            }
          }
        } catch {
        }
      }
    }
    return false;
  } catch (error) {
    console.error("[SystemSounds] Failed to play system sound:", error);
    return false;
  }
}
function getSoundLabel(soundId) {
  if (soundId === "default")
    return "System Beep (Default)";
  if (soundId === "none")
    return "No Sound";
  if (!isSystemSound(soundId))
    return "Custom Sound File";
  const sounds = getSystemSounds();
  const sound = sounds.find((s) => s.id === soundId);
  return sound?.label || soundId;
}
function getSoundSelectOptions() {
  const sounds = getSystemSounds();
  const options = sounds.map((sound) => ({
    value: sound.id,
    label: sound.label
  }));
  options.push({ value: "custom", label: "Custom Sound File..." });
  return options;
}
var import_os, import_electron, MACOS_SOUNDS, WINDOWS_SOUNDS, LINUX_SOUNDS;
var init_system_sounds = __esm({
  "main/system-sounds.ts"() {
    "use strict";
    import_os = require("os");
    import_electron = require("electron");
    MACOS_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "macos://Basso", label: "Basso", path: "/System/Library/Sounds/Basso.aiff", isSystemSound: true },
      { id: "macos://Blow", label: "Blow", path: "/System/Library/Sounds/Blow.aiff", isSystemSound: true },
      { id: "macos://Bottle", label: "Bottle", path: "/System/Library/Sounds/Bottle.aiff", isSystemSound: true },
      { id: "macos://Frog", label: "Frog", path: "/System/Library/Sounds/Frog.aiff", isSystemSound: true },
      { id: "macos://Funk", label: "Funk", path: "/System/Library/Sounds/Funk.aiff", isSystemSound: true },
      { id: "macos://Glass", label: "Glass", path: "/System/Library/Sounds/Glass.aiff", isSystemSound: true },
      { id: "macos://Hero", label: "Hero", path: "/System/Library/Sounds/Hero.aiff", isSystemSound: true },
      { id: "macos://Morse", label: "Morse", path: "/System/Library/Sounds/Morse.aiff", isSystemSound: true },
      { id: "macos://Ping", label: "Ping", path: "/System/Library/Sounds/Ping.aiff", isSystemSound: true },
      { id: "macos://Pop", label: "Pop", path: "/System/Library/Sounds/Pop.aiff", isSystemSound: true },
      { id: "macos://Purr", label: "Purr", path: "/System/Library/Sounds/Purr.aiff", isSystemSound: true },
      { id: "macos://Sosumi", label: "Sosumi", path: "/System/Library/Sounds/Sosumi.aiff", isSystemSound: true },
      { id: "macos://Submarine", label: "Submarine", path: "/System/Library/Sounds/Submarine.aiff", isSystemSound: true },
      { id: "macos://Tink", label: "Tink", path: "/System/Library/Sounds/Tink.aiff", isSystemSound: true }
    ];
    WINDOWS_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "windows://asterisk", label: "Asterisk", isSystemSound: true },
      { id: "windows://exclamation", label: "Exclamation", isSystemSound: true },
      { id: "windows://hand", label: "Critical Stop", isSystemSound: true },
      { id: "windows://question", label: "Question", isSystemSound: true },
      { id: "windows://default", label: "Default Beep", isSystemSound: true }
    ];
    LINUX_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "linux://message", label: "Message", isSystemSound: true },
      { id: "linux://dialog-info", label: "Dialog Info", isSystemSound: true },
      { id: "linux://dialog-warning", label: "Dialog Warning", isSystemSound: true },
      { id: "linux://dialog-error", label: "Dialog Error", isSystemSound: true },
      { id: "linux://complete", label: "Complete", isSystemSound: true },
      { id: "linux://attention", label: "Attention", isSystemSound: true }
    ];
  }
});

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
var import_electron2 = require("electron");
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
    activeModels: [],
    // empty = all models available in chat panel
    temperature: 0.7,
    maxContextTokens: 128e3,
    autoRunMode: "always",
    showTokenCosts: true,
    showThinking: true,
    autoAcceptEdits: false,
    contextCompressionThreshold: 0.9,
    contextRecentMessagesToKeep: 6,
    maxTurns: null
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
    defaultWorkspace: null,
    recentFolders: [],
    maxRecentFolders: 10,
    recentWorkspaces: [],
    maxRecentWorkspaces: 10,
    followSymlinks: false
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
  customModels: [],
  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1],
    dataRetentionMonths: 12,
    showInStatusBar: true
  },
  notifications: {
    enabled: true,
    soundEnabled: true,
    sound: "default",
    playOnUserInput: true,
    playOnResponseComplete: true,
    showTrayBadge: true
  },
  remoteAccess: {
    enabled: false,
    tunnelProvider: "ngrok",
    ngrokAuthToken: "",
    cloudflaredToken: "",
    apiKey: null,
    port: 3e3,
    allowedOrigins: [],
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1e3,
    // 15 minutes
    proxyEnabled: true,
    proxyAllowedPorts: []
  },
  remoteClient: {
    url: "",
    apiKey: "",
    autoConnect: false
  },
  adb: {
    enabled: true,
    path: "adb"
  },
  changeReview: {
    enabled: true,
    mode: "all"
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
  // Add a recent folder (plain directory, not a workspace file)
  addRecentFolder(folderPath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentFolders");
    const maxRecent = store.get("files.maxRecentFolders");
    const filtered = recent.filter((f) => f !== folderPath);
    filtered.unshift(folderPath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentFolders", limited);
    console.log("[Settings] Added recent folder:", folderPath);
  }
  // Add a recent workspace
  addRecentWorkspace(workspacePath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentWorkspaces");
    const maxRecent = store.get("files.maxRecentWorkspaces");
    const filtered = recent.filter((w) => w !== workspacePath);
    filtered.unshift(workspacePath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentWorkspaces", limited);
    console.log("[Settings] Added recent workspace:", workspacePath);
  }
  // Get recent workspaces (with migration to filter out non-workspace files)
  getRecentWorkspaces() {
    const store = this.ensureInitialized();
    const workspaces = store.get("files.recentWorkspaces");
    const validWorkspaces = workspaces.filter((w) => w.endsWith(".omnicode-workspace"));
    if (validWorkspaces.length !== workspaces.length) {
      store.set("files.recentWorkspaces", validWorkspaces);
      console.log("[Settings] Cleaned up recent workspaces, removed:", workspaces.length - validWorkspaces.length, "invalid entries");
    }
    return validWorkspaces;
  }
  // Get recent folders (with migration to filter out any workspace files that were incorrectly stored)
  getRecentFolders() {
    const store = this.ensureInitialized();
    const folders = store.get("files.recentFolders");
    const validFolders = folders.filter((f) => !f.endsWith(".omnicode-workspace"));
    if (validFolders.length !== folders.length) {
      store.set("files.recentFolders", validFolders);
      console.log("[Settings] Cleaned up recent folders, removed:", folders.length - validFolders.length, "invalid entries");
    }
    return validFolders;
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
  import_electron2.ipcMain.handle("settings:get", async (_, path) => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.get(path), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:getAll", async () => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.getAll(), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:set", async (_, path, value) => {
    try {
      const manager = await getSettingsManager();
      manager.set(path, value);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:reset", async (_, path) => {
    try {
      const manager = await getSettingsManager();
      manager.reset(path);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:addRecentFolder", async (_, folderPath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentFolder(folderPath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent folder:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:getRecentFolders", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentFolders();
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting recent folders:", error);
      return { value: [], error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:addRecentWorkspace", async (_, workspacePath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:getRecentWorkspaces", async () => {
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
  import_electron2.ipcMain.handle("settings:getSystemSounds", async () => {
    try {
      const { getSoundSelectOptions: getSoundSelectOptions2, getOperatingSystem: getOperatingSystem2 } = await Promise.resolve().then(() => (init_system_sounds(), system_sounds_exports));
      const sounds = getSoundSelectOptions2();
      const os = getOperatingSystem2();
      return { value: { sounds, os }, error: null };
    } catch (error) {
      console.error("[Settings] Error getting system sounds:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron2.ipcMain.handle("settings:playTestSound", async (_, soundId) => {
    try {
      const { playSystemSound: playSystemSound2, isSystemSound: isSystemSound2 } = await Promise.resolve().then(() => (init_system_sounds(), system_sounds_exports));
      const { shell: shell2 } = await import("electron");
      if (isSystemSound2(soundId)) {
        const played = await playSystemSound2(soundId);
        if (!played) {
          shell2.beep();
        }
      } else {
        try {
          const soundPlay = await import("sound-play");
          await soundPlay.play(soundId);
        } catch {
          shell2.beep();
        }
      }
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error playing test sound:", error);
      return { success: false, error: error.message };
    }
  });
  console.log("[Settings] IPC handlers setup complete");
}
function cleanupSettingsIpcHandlers() {
  import_electron2.ipcMain.removeHandler("settings:get");
  import_electron2.ipcMain.removeHandler("settings:getAll");
  import_electron2.ipcMain.removeHandler("settings:set");
  import_electron2.ipcMain.removeHandler("settings:reset");
  import_electron2.ipcMain.removeHandler("settings:addRecentFolder");
  import_electron2.ipcMain.removeHandler("settings:getRecentFolders");
  import_electron2.ipcMain.removeHandler("settings:addRecentWorkspace");
  import_electron2.ipcMain.removeHandler("settings:getRecentWorkspaces");
  import_electron2.ipcMain.removeHandler("settings:getSystemSounds");
  import_electron2.ipcMain.removeHandler("settings:playTestSound");
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