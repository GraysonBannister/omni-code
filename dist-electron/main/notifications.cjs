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
    import_electron2.shell.beep();
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
var import_os, import_electron2;
var init_system_sounds = __esm({
  "main/system-sounds.ts"() {
    "use strict";
    import_os = require("os");
    import_electron2 = require("electron");
  }
});

// main/notifications.ts
var notifications_exports = {};
__export(notifications_exports, {
  cleanupWindowFocusTracking: () => cleanupWindowFocusTracking,
  initializeWindowFocusTracking: () => initializeWindowFocusTracking,
  isWindowFocused: () => isWindowFocused,
  requestNotificationSound: () => requestNotificationSound
});
module.exports = __toCommonJS(notifications_exports);
var import_electron3 = require("electron");

// main/settings.ts
var import_electron = require("electron");
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
var settingsManagerInstance = null;
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

// main/notifications.ts
init_system_sounds();
var windowFocusState = /* @__PURE__ */ new Map();
function initializeWindowFocusTracking(window) {
  const windowId = window.id;
  windowFocusState.set(windowId, window.isFocused());
  window.on("focus", () => {
    windowFocusState.set(windowId, true);
  });
  window.on("blur", () => {
    windowFocusState.set(windowId, false);
  });
  window.on("closed", () => {
    windowFocusState.delete(windowId);
  });
}
function isWindowFocused(windowId) {
  return windowFocusState.get(windowId) ?? false;
}
async function playSound(soundSetting) {
  try {
    if (soundSetting === "none") {
      return;
    }
    if (isSystemSound(soundSetting) || !soundSetting) {
      const played = await playSystemSound(soundSetting || "default");
      if (!played) {
        import_electron3.shell.beep();
      }
      return;
    }
    try {
      const soundPlay = await import("sound-play");
      await soundPlay.play(soundSetting);
      return;
    } catch (playError) {
      console.error("[Notifications] Failed to play custom sound, falling back to system beep:", playError);
      import_electron3.shell.beep();
      return;
    }
  } catch (error) {
    console.error("[Notifications] Failed to play sound:", error);
    try {
      import_electron3.shell.beep();
    } catch {
    }
  }
}
async function requestNotificationSound(window, type) {
  try {
    if (!settingsManager.get("notifications.enabled")) {
      return;
    }
    if (!settingsManager.get("notifications.soundEnabled")) {
      return;
    }
    if (type === "user_input" && !settingsManager.get("notifications.playOnUserInput")) {
      return;
    }
    if (type === "response_complete" && !settingsManager.get("notifications.playOnResponseComplete")) {
      return;
    }
    if (!window.isFocused()) {
      const soundSetting = settingsManager.get("notifications.sound");
      await playSound(soundSetting);
    }
  } catch (error) {
    console.error("[Notifications] Error requesting notification sound:", error);
  }
}
function cleanupWindowFocusTracking(windowId) {
  windowFocusState.delete(windowId);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanupWindowFocusTracking,
  initializeWindowFocusTracking,
  isWindowFocused,
  requestNotificationSound
});
//# sourceMappingURL=notifications.cjs.map