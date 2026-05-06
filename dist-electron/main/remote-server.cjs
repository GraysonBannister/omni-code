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

// main/tunnel-providers.ts
function createTunnelProvider(settings) {
  switch (settings.tunnelProvider) {
    case "ngrok": {
      if (!settings.ngrokAuthToken) {
        console.warn("[TunnelProviders] No ngrok auth token configured \u2014 falling back to local-only");
        return new NoneProvider();
      }
      return new NgrokProvider(settings.ngrokAuthToken);
    }
    case "cloudflared":
      return new CloudflaredProvider(settings.cloudflaredToken || void 0);
    case "localtunnel":
      return new LocaltunnelProvider();
    case "none":
    default:
      return new NoneProvider();
  }
}
var ngrok, import_cloudflared, NgrokProvider, CloudflaredProvider, LocaltunnelProvider, NoneProvider;
var init_tunnel_providers = __esm({
  "main/tunnel-providers.ts"() {
    "use strict";
    ngrok = __toESM(require("@ngrok/ngrok"), 1);
    import_cloudflared = require("cloudflared");
    NgrokProvider = class {
      constructor(authToken) {
        this.authToken = authToken;
      }
      listener = null;
      async start(port2) {
        this.listener = await ngrok.forward({
          addr: port2,
          authtoken: this.authToken
        });
        const url = this.listener.url();
        if (!url)
          throw new Error("ngrok did not return a URL");
        return url;
      }
      async stop() {
        if (this.listener) {
          try {
            await this.listener.close();
          } catch {
          }
          this.listener = null;
        }
      }
    };
    CloudflaredProvider = class {
      constructor(token) {
        this.token = token;
      }
      tunnelInstance = null;
      async start(port2) {
        return new Promise((resolve11, reject) => {
          const t = this.token ? import_cloudflared.Tunnel.withToken(this.token) : import_cloudflared.Tunnel.quick(`http://localhost:${port2}`);
          this.tunnelInstance = t;
          const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for Cloudflare Tunnel URL (30s)"));
          }, 3e4);
          t.once("url", (url) => {
            clearTimeout(timeout);
            resolve11(url);
          });
          t.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
          t.once("exit", (code) => {
            clearTimeout(timeout);
            reject(new Error(`cloudflared exited unexpectedly (code ${code})`));
          });
        });
      }
      async stop() {
        if (this.tunnelInstance) {
          try {
            this.tunnelInstance.stop();
          } catch {
          }
          this.tunnelInstance = null;
        }
      }
    };
    LocaltunnelProvider = class {
      client = null;
      async start(port2) {
        const mod = await import("localtunnel");
        const lt = mod.default ?? mod;
        this.client = await lt({ port: port2 });
        return this.client.url;
      }
      async stop() {
        if (this.client) {
          try {
            this.client.close();
          } catch {
          }
          this.client = null;
        }
      }
    };
    NoneProvider = class {
      async start(port2) {
        return `http://localhost:${port2}`;
      }
      async stop() {
      }
    };
  }
});

// main/settings.ts
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
var import_electron, Store, storeImportError, defaultSettings, SettingsManager, settingsManagerInstance, initializationPromise, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron = require("electron");
    Store = null;
    storeImportError = null;
    defaultSettings = {
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
    SettingsManager = class {
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
      get(path39) {
        return this.ensureInitialized().get(path39);
      }
      // Get all settings
      getAll() {
        return this.ensureInitialized().store;
      }
      // Set a specific setting by path
      set(path39, value) {
        this.ensureInitialized().set(path39, value);
        this.notifyListeners(path39, value);
      }
      // Reset a setting to default (or all if no path provided)
      reset(path39) {
        const store = this.ensureInitialized();
        if (path39) {
          const defaultValue = this.getDefaultValue(path39);
          this.set(path39, defaultValue);
        } else {
          store.clear();
          Object.entries(defaultSettings).forEach(([key, value]) => {
            store.set(key, value);
          });
          this.notifyListeners("*", store.store);
        }
      }
      // Get default value for a path
      getDefaultValue(path39) {
        const parts = path39.split(".");
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
    settingsManagerInstance = null;
    initializationPromise = null;
    syncManagerProxy = {
      get: (path39) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path39);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path39, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path39, value);
      },
      reset: (path39) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path39);
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
    settingsManager = syncManagerProxy;
  }
});

// main/file-history.ts
function calculateLineDiff(beforeContent, afterContent) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let additions = 0;
  let deletions = 0;
  if (!beforeContent && afterContent) {
    additions = afterLines.length;
    return { additions, deletions };
  }
  if (beforeContent && !afterContent) {
    deletions = beforeLines.length;
    return { additions, deletions };
  }
  const lineDiff = afterLines.length - beforeLines.length;
  if (lineDiff > 0) {
    additions = lineDiff;
    deletions = Math.max(0, Math.floor(beforeLines.length * 0.05));
  } else if (lineDiff < 0) {
    deletions = Math.abs(lineDiff);
    additions = Math.max(0, Math.floor(afterLines.length * 0.05));
  } else {
    additions = Math.max(1, Math.floor(afterLines.length * 0.05));
    deletions = Math.max(1, Math.floor(beforeLines.length * 0.05));
  }
  return { additions, deletions };
}
function generateUnifiedDiff(beforeContent, afterContent, filePath, contextLines = 3) {
  const chunks = (0, import_diff.diffLines)(beforeContent, afterContent);
  const lines = [];
  for (const chunk of chunks) {
    const chunkLines = chunk.value.split("\n");
    if (chunkLines[chunkLines.length - 1] === "")
      chunkLines.pop();
    const type = chunk.added ? "added" : chunk.removed ? "removed" : "unchanged";
    for (const line of chunkLines) {
      lines.push({ type, content: line });
    }
  }
  let diff = `--- ${filePath}
+++ ${filePath}
`;
  let oldLine = 1;
  let newLine = 1;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "unchanged") {
      oldLine++;
      newLine++;
      i++;
      continue;
    }
    const hunkStart = Math.max(0, i - contextLines);
    const hunkOldStart = oldLine - (i - hunkStart);
    const hunkNewStart = newLine - (i - hunkStart);
    const hunkLines = [];
    for (let k = hunkStart; k < i; k++) {
      hunkLines.push(lines[k]);
    }
    let lastChangeIdx = i;
    while (i < lines.length) {
      hunkLines.push(lines[i]);
      if (lines[i].type !== "unchanged") {
        lastChangeIdx = i;
      }
      if (lines[i].type === "unchanged" && i - lastChangeIdx >= contextLines) {
        i++;
        break;
      }
      i++;
    }
    const trailingUnchanged = hunkLines.reduceRight((count, l) => {
      if (count === -1)
        return -1;
      return l.type === "unchanged" ? count + 1 : -1;
    }, 0);
    const trimCount = trailingUnchanged > contextLines ? trailingUnchanged - contextLines : 0;
    const trimmedHunk = trimCount > 0 ? hunkLines.slice(0, hunkLines.length - trimCount) : hunkLines;
    const oldCount = trimmedHunk.filter((l) => l.type !== "added").length;
    const newCount = trimmedHunk.filter((l) => l.type !== "removed").length;
    diff += `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@
`;
    for (const l of trimmedHunk) {
      if (l.type === "added")
        diff += `+${l.content}
`;
      else if (l.type === "removed")
        diff += `-${l.content}
`;
      else
        diff += ` ${l.content}
`;
    }
    for (const l of trimmedHunk) {
      if (l.type !== "added")
        oldLine++;
      if (l.type !== "removed")
        newLine++;
    }
  }
  return diff;
}
function findChangeLocation(beforeContent, afterContent, toolName, toolInput) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let startLine = 1;
  let endLine = afterLines.length;
  let lineCount = afterLines.length;
  if (toolName === "Edit" && typeof toolInput.old_string === "string") {
    const oldString = toolInput.old_string;
    const oldLines = oldString.split("\n");
    for (let i = 0; i <= beforeLines.length - oldLines.length; i++) {
      const match = oldLines.every((line, idx) => beforeLines[i + idx] === line);
      if (match) {
        startLine = i + 1;
        endLine = startLine + oldLines.length - 1;
        break;
      }
    }
    if (typeof toolInput.new_string === "string") {
      const newLines = toolInput.new_string.split("\n");
      lineCount = newLines.length;
      endLine = startLine + newLines.length - 1;
    }
  } else if (toolName === "Write") {
    startLine = 1;
    endLine = afterLines.length;
    lineCount = afterLines.length;
  }
  return { startLine, endLine, lineCount };
}
function generateSnippet(content, startLine, endLine, contextLines = 3) {
  const lines = content.split("\n");
  const snippetStart = Math.max(0, startLine - 1 - contextLines);
  const snippetEnd = Math.min(lines.length, endLine + contextLines);
  return lines.slice(snippetStart, snippetEnd).join("\n");
}
function getFileExtension(filePath) {
  const ext = (0, import_node_path.extname)(filePath).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}
function getFileName(filePath) {
  return (0, import_node_path.basename)(filePath);
}
function applyInversePatch(beforeContent, afterContent, currentContent) {
  const inversePatch = (0, import_diff.createPatch)("file", afterContent, beforeContent, "", "", { context: 4 });
  const result = (0, import_diff.applyPatch)(currentContent, inversePatch, { fuzzFactor: 2 });
  return result === false ? null : result;
}
function getFileHistoryManager(workspacePath) {
  if (!fileHistoryManager || fileHistoryManager["workspacePath"] !== workspacePath) {
    fileHistoryManager = new FileHistoryManager(workspacePath);
    fileHistoryManager.initialize().catch(console.error);
  }
  return fileHistoryManager;
}
var import_node_fs, import_node_path, import_diff, MAX_INMEMORY_SNAPSHOTS, FileHistoryManager, fileHistoryManager;
var init_file_history = __esm({
  "main/file-history.ts"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = require("path");
    import_diff = require("diff");
    MAX_INMEMORY_SNAPSHOTS = 50;
    FileHistoryManager = class {
      snapshots = /* @__PURE__ */ new Map();
      // key: `${conversationId}/${messageId}`
      workspacePath;
      backupDir;
      constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.backupDir = (0, import_node_path.join)(workspacePath, ".omnicode", "backups");
      }
      resolveFilePath(filePath) {
        return (0, import_node_path.isAbsolute)(filePath) ? filePath : (0, import_node_path.resolve)(this.workspacePath, filePath);
      }
      /**
       * Initialize the backup directory
       */
      async initialize() {
        try {
          await import_node_fs.promises.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
          console.error("[FileHistoryManager] Failed to create backup directory:", error);
        }
      }
      /**
       * Create a snapshot of a file before it's modified
       * Call this before executing file-modifying tools
       */
      async captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType) {
        const absolutePath = this.resolveFilePath(filePath);
        let beforeContent = "";
        try {
          beforeContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
        } catch (error) {
          beforeContent = "";
        }
        const key = `${conversationId}/${messageId}`;
        let snapshot = this.snapshots.get(key);
        if (!snapshot) {
          snapshot = {
            messageId,
            conversationId,
            changes: [],
            timestamp: Date.now()
          };
          this.snapshots.set(key, snapshot);
        }
        const existingChange = snapshot.changes.find((c) => c.filePath === filePath);
        if (existingChange) {
          return;
        }
        const change = {
          messageId,
          toolCallId,
          filePath,
          beforeContent,
          timestamp: Date.now(),
          changeType
        };
        snapshot.changes.push(change);
        await this.persistSnapshot(snapshot);
      }
      /**
       * Update the afterContent of a change after tool execution completes
       */
      async captureAfterChange(conversationId, messageId, toolCallId, filePath) {
        const absolutePath = this.resolveFilePath(filePath);
        let afterContent = "";
        try {
          afterContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
        } catch (error) {
          afterContent = "";
        }
        const key = `${conversationId}/${messageId}`;
        const snapshot = this.snapshots.get(key);
        if (!snapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for ${key}`);
          return;
        }
        const change = snapshot.changes.find(
          (c) => c.filePath === filePath && c.toolCallId === toolCallId
        );
        if (change) {
          change.afterContent = afterContent;
          await this.persistSnapshot(snapshot);
        }
      }
      /**
       * Get all file changes for a specific message.
       * Loads from disk if the snapshot was evicted from memory.
       */
      async getMessageChanges(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        return snapshot?.changes.filter((change) => change.afterContent !== void 0) || [];
      }
      /**
       * Check if a message has any file changes
       */
      async hasChanges(conversationId, messageId) {
        const changes = await this.getMessageChanges(conversationId, messageId);
        return changes.length > 0;
      }
      /**
       * Get all messages that have file changes in a conversation
       */
      getMessagesWithChanges(conversationId) {
        const messages = [];
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.changes.length > 0) {
            messages.push(snapshot.messageId);
          }
        }
        return messages;
      }
      /**
       * Get aggregated file changes for an entire conversation.
       * Loads evicted snapshots from disk as needed.
       */
      async getAllConversationChanges(conversationId) {
        await this.ensureConversationLoaded(conversationId);
        const fileMap = /* @__PURE__ */ new Map();
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId !== conversationId)
            continue;
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            const existing = fileMap.get(change.filePath);
            let effectiveType;
            if (change.changeType === "delete") {
              effectiveType = "deleted";
            } else if (!change.beforeContent && change.afterContent) {
              effectiveType = "added";
            } else {
              effectiveType = "modified";
            }
            const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
            if (existing) {
              if (snapshot.timestamp > existing.lastTimestamp) {
                if (existing.changeType === "deleted" && effectiveType === "added") {
                  effectiveType = "added";
                } else if (effectiveType === "deleted") {
                  effectiveType = "deleted";
                } else if (existing.changeType === "added") {
                  effectiveType = "added";
                } else {
                  effectiveType = "modified";
                }
                existing.changeType = effectiveType;
                existing.lastMessageId = snapshot.messageId;
                existing.lastTimestamp = snapshot.timestamp;
                existing.lastBeforeContent = change.beforeContent;
                existing.lastAfterContent = change.afterContent || "";
              }
              existing.changeCount++;
              existing.additions += lineDiff.additions;
              existing.deletions += lineDiff.deletions;
            } else {
              fileMap.set(change.filePath, {
                filePath: change.filePath,
                fileName: getFileName(change.filePath),
                extension: getFileExtension(change.filePath),
                changeType: effectiveType,
                lastMessageId: snapshot.messageId,
                lastTimestamp: snapshot.timestamp,
                changeCount: 1,
                additions: lineDiff.additions,
                deletions: lineDiff.deletions,
                lastBeforeContent: change.beforeContent,
                lastAfterContent: change.afterContent || ""
              });
            }
          }
        }
        return Array.from(fileMap.values()).map(({ lastBeforeContent, lastAfterContent, ...summary }) => summary).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      }
      /**
       * Get file changes for a specific message with line statistics.
       * Loads from disk if the snapshot was evicted from memory.
       */
      async getMessageChangesWithStats(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return [];
        }
        return snapshot.changes.filter((change) => change.afterContent !== void 0).map((change) => {
          const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
          let changeType;
          if (change.changeType === "delete") {
            changeType = "deleted";
          } else if (!change.beforeContent && change.afterContent) {
            changeType = "added";
          } else {
            changeType = "modified";
          }
          return {
            filePath: change.filePath,
            fileName: getFileName(change.filePath),
            extension: getFileExtension(change.filePath),
            changeType,
            lastMessageId: messageId,
            lastTimestamp: change.timestamp,
            changeCount: 1,
            additions: lineDiff.additions,
            deletions: lineDiff.deletions
          };
        });
      }
      /**
       * Rollback all changes from a specific message onwards.
       * Collects ALL snapshots from the target message onward, determines the
       * earliest beforeContent for each affected file, and restores it.
       */
      async rollbackToMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
          return { success: false, restoredFiles, failedFiles };
        }
        await this.ensureConversationLoaded(conversationId);
        const affectedSnapshots = [];
        for (const [, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
            affectedSnapshots.push(snapshot);
          }
        }
        affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[FileHistoryManager] Rolling back ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);
        const fileRestoreMap = /* @__PURE__ */ new Map();
        for (const snapshot of affectedSnapshots) {
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            if (!fileRestoreMap.has(change.filePath)) {
              fileRestoreMap.set(change.filePath, {
                beforeContent: change.beforeContent,
                lastAfterContent: change.afterContent,
                changeType: change.changeType,
                hadBeforeContent: !!change.beforeContent
              });
            } else {
              const existing = fileRestoreMap.get(change.filePath);
              existing.lastAfterContent = change.afterContent;
            }
          }
        }
        for (const [filePath, restore] of fileRestoreMap.entries()) {
          const absolutePath = this.resolveFilePath(filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            let currentContent;
            try {
              currentContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
            } catch {
              currentContent = null;
            }
            if (!restore.hadBeforeContent) {
              if (currentContent === null || currentContent === restore.lastAfterContent) {
                try {
                  await import_node_fs.promises.unlink(absolutePath);
                } catch {
                }
              } else {
                const reverted = applyInversePatch("", restore.lastAfterContent, currentContent);
                if (reverted !== null && reverted.trim() === "") {
                  try {
                    await import_node_fs.promises.unlink(absolutePath);
                  } catch {
                  }
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert created file ${filePath}. Deleting.`);
                  try {
                    await import_node_fs.promises.unlink(absolutePath);
                  } catch {
                  }
                }
              }
              restoredFiles.push(filePath);
            } else if (restore.changeType === "delete" && !restore.lastAfterContent) {
              await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
              restoredFiles.push(filePath);
            } else {
              if (currentContent === null) {
                if (restore.beforeContent) {
                  await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
                }
              } else if (currentContent === restore.lastAfterContent) {
                await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
              } else {
                const reverted = applyInversePatch(restore.beforeContent, restore.lastAfterContent, currentContent);
                if (reverted !== null) {
                  await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert ${filePath}. Restoring to pre-change state.`);
                  await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
                }
              }
              restoredFiles.push(filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to restore ${filePath}:`, error);
            failedFiles.push(filePath);
          }
        }
        this.clearSnapshotsFromMessage(conversationId, targetSnapshot.timestamp);
        return {
          success: failedFiles.length === 0,
          restoredFiles,
          failedFiles
        };
      }
      /**
       * Re-apply changes from a specific message onward (undo a previous rollback).
       * Loads all snapshots from the target message onward and writes the latest
       * afterContent for each affected file.
       */
      async reapplyMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        await this.ensureConversationLoaded(conversationId);
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId} (reapply)`);
          return { success: false, restoredFiles, failedFiles };
        }
        const affectedSnapshots = [];
        for (const [, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
            affectedSnapshots.push(snapshot);
          }
        }
        affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[FileHistoryManager] Re-applying ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);
        const fileReapplyMap = /* @__PURE__ */ new Map();
        for (const snapshot of affectedSnapshots) {
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            fileReapplyMap.set(change.filePath, {
              afterContent: change.afterContent,
              changeType: change.changeType
            });
          }
        }
        for (const [filePath, reapply] of fileReapplyMap.entries()) {
          const absolutePath = this.resolveFilePath(filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            if (reapply.changeType === "delete") {
              try {
                await import_node_fs.promises.unlink(absolutePath);
              } catch {
              }
              restoredFiles.push(filePath);
            } else {
              await import_node_fs.promises.writeFile(absolutePath, reapply.afterContent, "utf8");
              restoredFiles.push(filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to reapply ${filePath}:`, error);
            failedFiles.push(filePath);
          }
        }
        return {
          success: failedFiles.length === 0,
          restoredFiles,
          failedFiles
        };
      }
      /**
       * Clear all snapshots for a conversation (when conversation is deleted)
       */
      async clearConversation(conversationId) {
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId) {
            this.snapshots.delete(key);
          }
        }
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          await import_node_fs.promises.rmdir(conversationBackupDir, { recursive: true });
        } catch (error) {
        }
      }
      /**
       * Clear snapshots from a specific message onwards (after rollback)
       */
      clearSnapshotsFromMessage(conversationId, fromTimestamp) {
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= fromTimestamp) {
            this.snapshots.delete(key);
          }
        }
      }
      /**
       * Persist a snapshot to disk for safety, then evict old entries from memory.
       */
      async persistSnapshot(snapshot) {
        const snapshotDir = (0, import_node_path.join)(this.backupDir, snapshot.conversationId, snapshot.messageId);
        try {
          await import_node_fs.promises.mkdir(snapshotDir, { recursive: true });
          for (const change of snapshot.changes) {
            const safeFileName = change.filePath.replace(/[/\\]/g, "_");
            const backupPath = (0, import_node_path.join)(snapshotDir, `${safeFileName}.json`);
            await import_node_fs.promises.writeFile(backupPath, JSON.stringify(change, null, 2), "utf8");
          }
        } catch (error) {
          console.error("[FileHistoryManager] Failed to persist snapshot:", error);
          return;
        }
        this.evictOldSnapshots();
      }
      /**
       * Remove the oldest snapshots from memory when exceeding the cap.
       * Evicted snapshots are safe to remove because they were already persisted to disk.
       */
      evictOldSnapshots() {
        if (this.snapshots.size <= MAX_INMEMORY_SNAPSHOTS)
          return;
        const entries = Array.from(this.snapshots.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toEvict = entries.length - MAX_INMEMORY_SNAPSHOTS;
        for (let i = 0; i < toEvict; i++) {
          this.snapshots.delete(entries[i][0]);
        }
      }
      /**
       * Load a single snapshot from disk into memory if it isn't already present.
       */
      async ensureSnapshotLoaded(key) {
        const existing = this.snapshots.get(key);
        if (existing)
          return existing;
        const [conversationId, messageId] = key.split("/");
        if (!conversationId || !messageId)
          return void 0;
        const messageDir = (0, import_node_path.join)(this.backupDir, conversationId, messageId);
        try {
          const stat8 = await import_node_fs.promises.stat(messageDir);
          if (!stat8.isDirectory())
            return void 0;
          const files = await import_node_fs.promises.readdir(messageDir);
          const changes = [];
          for (const file of files) {
            if (!file.endsWith(".json"))
              continue;
            const filePath = (0, import_node_path.join)(messageDir, file);
            try {
              const content = await import_node_fs.promises.readFile(filePath, "utf8");
              changes.push(JSON.parse(content));
            } catch {
            }
          }
          if (changes.length > 0) {
            const snapshot = {
              messageId,
              conversationId,
              changes,
              timestamp: changes[0]?.timestamp || Date.now()
            };
            this.snapshots.set(key, snapshot);
            return snapshot;
          }
        } catch {
        }
        return void 0;
      }
      /**
       * Ensure all snapshots for a conversation are loaded into memory.
       * Re-reads any that were evicted since initial load.
       */
      async ensureConversationLoaded(conversationId) {
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
          for (const messageId of messageDirs) {
            const key = `${conversationId}/${messageId}`;
            if (this.snapshots.has(key))
              continue;
            await this.ensureSnapshotLoaded(key);
          }
        } catch {
        }
      }
      /**
       * Load snapshots from disk for a conversation
       */
      async loadSnapshots(conversationId) {
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
          for (const messageId of messageDirs) {
            const messageDir = (0, import_node_path.join)(conversationBackupDir, messageId);
            const stat8 = await import_node_fs.promises.stat(messageDir);
            if (!stat8.isDirectory())
              continue;
            const files = await import_node_fs.promises.readdir(messageDir);
            const changes = [];
            for (const file of files) {
              if (!file.endsWith(".json"))
                continue;
              const filePath = (0, import_node_path.join)(messageDir, file);
              try {
                const content = await import_node_fs.promises.readFile(filePath, "utf8");
                const change = JSON.parse(content);
                changes.push(change);
              } catch (error) {
                console.error(`[FileHistoryManager] Failed to load change from ${filePath}:`, error);
              }
            }
            if (changes.length > 0) {
              const snapshot = {
                messageId,
                conversationId,
                changes,
                timestamp: changes[0]?.timestamp || Date.now()
              };
              this.snapshots.set(`${conversationId}/${messageId}`, snapshot);
            }
          }
        } catch (error) {
        }
      }
      /**
       * Get detailed change preview for a specific tool call
       * Includes diff content and line location information
       */
      async getChangePreview(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot)
          return null;
        const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
        if (!change || !change.afterContent)
          return null;
        let changeType;
        if (change.changeType === "delete") {
          changeType = "deleted";
        } else if (!change.beforeContent && change.afterContent) {
          changeType = "added";
        } else {
          changeType = "modified";
        }
        const diffContent = generateUnifiedDiff(
          change.beforeContent,
          change.afterContent || "",
          change.filePath
        );
        const additions = (diffContent.match(/^\+(?!\+\+)/gm) || []).length;
        const deletions = (diffContent.match(/^-(?!--)/gm) || []).length;
        const { startLine, endLine, lineCount } = findChangeLocation(
          change.beforeContent,
          change.afterContent || "",
          change.changeType === "write" ? "Write" : "Edit",
          {}
        );
        const beforeSnippet = generateSnippet(change.beforeContent, startLine, endLine);
        const afterSnippet = generateSnippet(change.afterContent || "", startLine, endLine);
        return {
          toolCallId: change.toolCallId,
          messageId: change.messageId,
          filePath: change.filePath,
          fileName: getFileName(change.filePath),
          toolName: change.changeType === "write" ? "Write" : "Edit",
          changeType,
          startLine,
          endLine,
          lineCount,
          diffContent,
          beforeSnippet,
          afterSnippet,
          additions,
          deletions,
          timestamp: change.timestamp
        };
      }
      /**
       * Get all tool call changes for a message
       */
      async getToolCallChanges(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot)
          return [];
        const previews = [];
        for (const change of snapshot.changes.filter((c) => c.afterContent !== void 0)) {
          const preview = await this.getChangePreview(conversationId, messageId, change.toolCallId);
          if (preview)
            previews.push(preview);
        }
        return previews;
      }
      /**
       * Reconstruct file content without a specific tool call's changes
       * Used when rejecting a single tool call change while keeping others
       */
      async reconstructFileWithoutToolCall(conversationId, messageId, toolCallIdToExclude) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return { success: false, content: "", error: "Snapshot not found" };
        }
        const targetChange = snapshot.changes.find((c) => c.toolCallId === toolCallIdToExclude);
        if (!targetChange) {
          return { success: false, content: "", error: "Tool call change not found" };
        }
        let reconstructedContent = targetChange.beforeContent;
        const otherChanges = snapshot.changes.filter(
          (c) => c.filePath === targetChange.filePath && c.toolCallId !== toolCallIdToExclude && c.afterContent !== void 0
        );
        otherChanges.sort((a, b) => a.timestamp - b.timestamp);
        for (const change of otherChanges) {
          if (change.timestamp > targetChange.timestamp) {
            reconstructedContent = change.afterContent || reconstructedContent;
          }
        }
        return { success: true, content: reconstructedContent };
      }
      /**
       * Revert a specific tool call change
       */
      async revertToolCallChange(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return { success: false, error: "Snapshot not found" };
        }
        const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
        if (!change) {
          return { success: false, error: "Tool call change not found" };
        }
        const absolutePath = this.resolveFilePath(change.filePath);
        try {
          const result = await this.reconstructFileWithoutToolCall(conversationId, messageId, toolCallId);
          if (!result.success) {
            return { success: false, error: result.error };
          }
          await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
          await import_node_fs.promises.writeFile(absolutePath, result.content, "utf8");
          return { success: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to revert change: ${errorMsg}` };
        }
      }
    };
    fileHistoryManager = null;
  }
});

// main/change-review-manager.ts
function getChangeReviewManager(fileHistoryManager2) {
  if (!changeReviewManager) {
    changeReviewManager = new ChangeReviewManager(fileHistoryManager2);
  }
  return changeReviewManager;
}
var ChangeReviewManager, changeReviewManager;
var init_change_review_manager = __esm({
  "main/change-review-manager.ts"() {
    "use strict";
    ChangeReviewManager = class {
      // Key: `${conversationId}/${toolCallId}`
      pendingChanges = /* @__PURE__ */ new Map();
      fileHistoryManager;
      constructor(fileHistoryManager2) {
        this.fileHistoryManager = fileHistoryManager2;
      }
      /**
       * Stage a tool call change for review
       */
      stageToolCallChange(change) {
        const key = `${change.conversationId}/${change.toolCallId}`;
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Staged change ${change.toolCallId} for ${change.filePath}`);
      }
      /**
       * Get all pending changes for a conversation
       */
      getPendingChanges(conversationId) {
        const changes = [];
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`) && change.status === "pending") {
            changes.push(change);
          }
        }
        return changes.sort((a, b) => a.timestamp - b.timestamp);
      }
      /**
       * Get pending changes for a specific file
       */
      getPendingForFile(conversationId, filePath) {
        return this.getPendingChanges(conversationId).filter(
          (c) => c.filePath === filePath
        );
      }
      /**
       * Get a specific pending change by tool call ID
       */
      getPendingChange(conversationId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        return this.pendingChanges.get(key);
      }
      /**
       * Check if a conversation has any pending changes
       */
      hasPendingChanges(conversationId) {
        return this.getPendingChanges(conversationId).length > 0;
      }
      /**
       * Get summary of changes for a conversation
       */
      getChangeSummary(conversationId) {
        const allChanges = [];
        const byFile = /* @__PURE__ */ new Map();
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`)) {
            allChanges.push(change);
            const fileChanges = byFile.get(change.filePath) || [];
            fileChanges.push(change);
            byFile.set(change.filePath, fileChanges);
          }
        }
        return {
          conversationId,
          totalPending: allChanges.filter((c) => c.status === "pending").length,
          totalAccepted: allChanges.filter((c) => c.status === "accepted").length,
          totalRejected: allChanges.filter((c) => c.status === "rejected").length,
          byFile
        };
      }
      /**
       * Accept a specific tool call change
       * Simply marks it as accepted - the change stays in the file
       */
      async acceptToolCallChange(conversationId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        const change = this.pendingChanges.get(key);
        if (!change) {
          return { success: false, error: "Change not found" };
        }
        if (change.status !== "pending") {
          return { success: false, error: `Change already ${change.status}` };
        }
        change.status = "accepted";
        change.reviewedAt = Date.now();
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Accepted change ${toolCallId} for ${change.filePath}`);
        return { success: true };
      }
      /**
       * Reject a specific tool call change
       * Reconstructs the file without this change while keeping other changes
       */
      async rejectToolCallChange(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        const change = this.pendingChanges.get(key);
        if (!change) {
          return { success: false, error: "Change not found" };
        }
        if (change.status !== "pending") {
          return { success: false, error: `Change already ${change.status}` };
        }
        const absolutePath = this.fileHistoryManager["resolveFilePath"](change.filePath);
        const { promises: fs38 } = await import("fs");
        if (change.changeType === "added") {
          try {
            await fs38.unlink(absolutePath);
            console.log(`[ChangeReviewManager] Deleted newly created file ${change.filePath}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (error.code !== "ENOENT") {
              console.warn(`[ChangeReviewManager] Error deleting file ${change.filePath}: ${errorMsg}`);
            }
          }
        } else {
          const result = await this.fileHistoryManager.reconstructFileWithoutToolCall(
            conversationId,
            messageId,
            toolCallId
          );
          if (!result.success) {
            return { success: false, error: result.error };
          }
          const { dirname: dirname11 } = await import("path");
          try {
            await fs38.mkdir(dirname11(absolutePath), { recursive: true });
            await fs38.writeFile(absolutePath, result.content, "utf8");
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return { success: false, error: `Failed to write file: ${errorMsg}` };
          }
        }
        change.status = "rejected";
        change.reviewedAt = Date.now();
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Rejected change ${toolCallId} for ${change.filePath}`);
        return { success: true };
      }
      /**
       * Accept all pending changes for a conversation
       */
      async acceptAllChanges(conversationId) {
        const pending = this.getPendingChanges(conversationId);
        const accepted = [];
        const failed = [];
        for (const change of pending) {
          const result = await this.acceptToolCallChange(conversationId, change.toolCallId);
          if (result.success) {
            accepted.push(change.toolCallId);
          } else {
            failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
          }
        }
        return {
          success: failed.length === 0,
          accepted,
          failed
        };
      }
      /**
       * Reject all pending changes for a conversation
       */
      async rejectAllChanges(conversationId, messageId) {
        const pending = this.getPendingChanges(conversationId);
        const rejected = [];
        const failed = [];
        for (const change of pending) {
          const result = await this.rejectToolCallChange(conversationId, messageId, change.toolCallId);
          if (result.success) {
            rejected.push(change.toolCallId);
          } else {
            failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
          }
        }
        return {
          success: failed.length === 0,
          rejected,
          failed
        };
      }
      /**
       * Clear all changes for a conversation
       */
      clearConversation(conversationId) {
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`)) {
            this.pendingChanges.delete(key);
          }
        }
        console.log(`[ChangeReviewManager] Cleared all changes for conversation ${conversationId}`);
      }
      /**
       * Convert a ChangePreview to PendingToolCallChange
       */
      static fromPreview(preview, beforeContent, afterContent) {
        return {
          toolCallId: preview.toolCallId,
          messageId: preview.messageId,
          conversationId: preview.conversationId || "",
          filePath: preview.filePath,
          fileName: preview.fileName,
          toolName: preview.toolName,
          changeType: preview.changeType,
          startLine: preview.startLine,
          endLine: preview.endLine,
          lineCount: preview.lineCount,
          beforeContent,
          afterContent,
          diffContent: preview.diffContent,
          beforeSnippet: preview.beforeSnippet,
          afterSnippet: preview.afterSnippet,
          additions: preview.additions,
          deletions: preview.deletions,
          status: "pending",
          timestamp: preview.timestamp
        };
      }
    };
    changeReviewManager = null;
  }
});

// main/tray-notifications.ts
function resolveIconPaths() {
  const appRoot = import_electron2.app.getAppPath();
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return {
      png: path.join(appRoot, "logo.png"),
      icns: path.join(appRoot, "logo.icns")
    };
  }
  return {
    png: path.join(process.resourcesPath || appRoot, "logo.png"),
    icns: path.join(process.resourcesPath || appRoot, "logo.icns")
  };
}
var import_electron2, path, MAX_MENU_ITEMS, TrayNotificationManager, trayNotificationManager;
var init_tray_notifications = __esm({
  "main/tray-notifications.ts"() {
    "use strict";
    import_electron2 = require("electron");
    path = __toESM(require("path"), 1);
    init_settings();
    MAX_MENU_ITEMS = 10;
    TrayNotificationManager = class {
      tray = null;
      mainWindow = null;
      notifications = /* @__PURE__ */ new Map();
      recentChats = /* @__PURE__ */ new Map();
      activeConversationId = null;
      isWindowFocused = false;
      isChatVisible = true;
      baseIcon = null;
      navigateCallback = null;
      clearAllCallback = null;
      openProject = null;
      /**
       * Initialize the tray icon
       * Call this when the main window is created
       */
      initialize(mainWindow) {
        if (this.tray) {
          console.log("[TrayNotifications] Already initialized, destroying previous tray");
          this.tray.destroy();
        }
        this.mainWindow = mainWindow;
        this.loadBaseIcon();
        this.createTray();
        this.setupWindowTracking();
        this.setupIpcHandlers();
        console.log("[TrayNotifications] Tray manager initialized");
      }
      /**
       * Load the base app icon
       */
      loadBaseIcon() {
        try {
          const iconPaths = resolveIconPaths();
          const iconPath = process.platform === "darwin" ? iconPaths.icns : iconPaths.png;
          this.baseIcon = import_electron2.nativeImage.createFromPath(iconPath);
          if (this.baseIcon.isEmpty() && process.platform === "darwin") {
            this.baseIcon = import_electron2.nativeImage.createFromPath(iconPaths.png);
          }
          const traySize = process.platform === "darwin" ? 16 : 24;
          if (!this.baseIcon.isEmpty()) {
            this.baseIcon = this.baseIcon.resize({ width: traySize, height: traySize });
            if (process.platform === "darwin") {
              this.baseIcon.setTemplateImage(true);
            }
            console.log("[TrayNotifications] Base icon loaded successfully from:", iconPath);
          } else {
            console.warn("[TrayNotifications] Could not load icon from:", iconPath);
            this.baseIcon = import_electron2.nativeImage.createEmpty();
          }
        } catch (error) {
          console.error("[TrayNotifications] Failed to load base icon:", error);
          this.baseIcon = import_electron2.nativeImage.createEmpty();
        }
      }
      /**
       * Create the tray icon with context menu
       */
      createTray() {
        if (!this.baseIcon) {
          console.error("[TrayNotifications] Cannot create tray: base icon not loaded");
          return;
        }
        this.tray = new import_electron2.Tray(this.baseIcon);
        this.tray.setToolTip("Omni Code");
        this.tray.on("click", (_event, bounds) => {
          this.updateContextMenu();
          this.tray?.popUpContextMenu(bounds);
        });
        this.tray.on("right-click", (_event, bounds) => {
          this.updateContextMenu();
          this.tray?.popUpContextMenu(bounds);
        });
        this.updateContextMenu();
      }
      /**
       * Set up tracking for window focus and visibility state
       */
      setupWindowTracking() {
        if (!this.mainWindow)
          return;
        this.mainWindow.on("focus", () => {
          this.isWindowFocused = true;
        });
        this.mainWindow.on("blur", () => {
          this.isWindowFocused = false;
        });
        this.isWindowFocused = this.mainWindow.isFocused();
      }
      /**
       * Set up IPC handlers for renderer communication
       */
      setupIpcHandlers() {
        import_electron2.ipcMain.handle("tray:update-active", (_event, conversationId) => {
          this.activeConversationId = conversationId;
          if (conversationId) {
            this.clearNotification(conversationId);
          }
        });
        import_electron2.ipcMain.handle("tray:clear-notification", (_event, conversationId) => {
          this.clearNotification(conversationId);
        });
        import_electron2.ipcMain.handle("tray:clear-all-notifications", () => {
          this.clearAllNotifications();
        });
        import_electron2.ipcMain.handle("tray:update-recent-chats", (_event, chats) => {
          this.recentChats.clear();
          for (const chat of chats) {
            this.recentChats.set(chat.conversationId, chat);
          }
          this.updateContextMenu();
        });
        import_electron2.ipcMain.handle("tray:update-open-project", (_event, project) => {
          this.openProject = project;
          this.updateContextMenu();
        });
      }
      /**
       * Update open project info
       */
      updateOpenProject(project) {
        this.openProject = project;
        this.updateContextMenu();
      }
      /**
       * Update recent chats list from renderer
       */
      updateRecentChats(chats) {
        this.recentChats.clear();
        for (const chat of chats) {
          this.recentChats.set(chat.conversationId, chat);
        }
        this.updateContextMenu();
      }
      /**
       * Generate icon with notification badge
       * Returns base icon - badge is shown via tooltip and context menu
       */
      generateBadgeIcon(count) {
        if (!this.baseIcon) {
          return import_electron2.nativeImage.createEmpty();
        }
        return this.baseIcon;
      }
      /**
       * Update the tray icon based on notification count
       */
      updateIcon() {
        if (!this.tray || !this.baseIcon)
          return;
        const count = this.notifications.size;
        const icon = this.generateBadgeIcon(count);
        this.tray.setImage(icon);
        if (count > 0) {
          const chatText = count === 1 ? "chat" : "chats";
          this.tray.setToolTip(`${count} ${chatText} with new responses - Omni Code`);
        } else {
          this.tray.setToolTip("Omni Code");
        }
        if (process.platform === "darwin") {
          import_electron2.app.setBadgeCount(count);
        }
      }
      /**
       * Update the context menu with recent chats and pending notifications
       */
      updateContextMenu() {
        if (!this.tray)
          return;
        const menuItems = [];
        const notificationCount = this.notifications.size;
        if (notificationCount > 0) {
          menuItems.push({
            label: `\u{1F514} ${notificationCount} new response${notificationCount > 1 ? "s" : ""} waiting`,
            enabled: false
          });
          menuItems.push({
            label: "Clear All Notifications",
            click: () => {
              this.clearAllNotifications();
            }
          });
          menuItems.push({ type: "separator" });
        }
        let recentChatsList = Array.from(this.recentChats.values());
        if (this.openProject) {
          recentChatsList = recentChatsList.filter((chat) => {
            if (this.openProject.isWorkspaceMode && chat.workspaceId) {
              return chat.workspaceId === this.openProject.workspaceId;
            } else if (!this.openProject.isWorkspaceMode && chat.projectPath) {
              return chat.projectPath === this.openProject.projectPath;
            }
            return true;
          });
        }
        recentChatsList = recentChatsList.sort((a, b) => b.lastActivity - a.lastActivity).slice(0, MAX_MENU_ITEMS);
        if (recentChatsList.length > 0) {
          if (this.openProject) {
            menuItems.push({
              label: this.openProject.isWorkspaceMode ? "Open Workspace Chats" : "Open Project Chats",
              enabled: false
            });
          } else {
            menuItems.push({
              label: "Recent Chats",
              enabled: false
            });
          }
          for (const chat of recentChatsList) {
            const hasNotification = this.notifications.has(chat.conversationId);
            const notification = this.notifications.get(chat.conversationId);
            const timeAgo = this.formatTimeAgo(chat.lastActivity);
            let label;
            if (hasNotification && notification) {
              const preview = notification.messagePreview.slice(0, 30) + (notification.messagePreview.length > 30 ? "..." : "");
              label = `\u{1F534} ${chat.title} - ${preview} (${timeAgo})`;
            } else {
              label = `   ${chat.title} (${timeAgo})`;
            }
            menuItems.push({
              label,
              click: () => {
                this.navigateToChat(chat.conversationId);
              }
            });
          }
          menuItems.push({ type: "separator" });
        }
        menuItems.push({
          label: "Open Omni Code",
          click: () => {
            this.showMainWindow();
          }
        });
        menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Quit",
          role: "quit"
        });
        const contextMenu = import_electron2.Menu.buildFromTemplate(menuItems);
        this.tray.setContextMenu(contextMenu);
      }
      /**
       * Format timestamp to relative time string
       */
      formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1e3);
        if (seconds < 60)
          return "just now";
        if (seconds < 3600)
          return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400)
          return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
      }
      /**
       * Show/focus the main window and navigate to a specific chat
       */
      navigateToChat(conversationId) {
        this.showMainWindow();
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("tray:navigate-to-chat", conversationId);
        }
        this.clearNotification(conversationId);
      }
      /**
       * Show and focus the main window
       */
      showMainWindow() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
          return;
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.show();
        this.mainWindow.focus();
      }
      /**
       * Notify of a completed chat response
       * Call this when a response completes and should show in tray
       */
      notifyResponseComplete(conversationId, conversationTitle, messagePreview, isConversationActive) {
        if (!settingsManager.get("notifications.enabled")) {
          return;
        }
        if (!settingsManager.get("notifications.showTrayBadge")) {
          return;
        }
        if (isConversationActive && this.isWindowFocused && this.isChatVisible) {
          return;
        }
        const existing = this.notifications.get(conversationId);
        const notification = {
          conversationId,
          title: conversationTitle,
          messagePreview,
          timestamp: Date.now(),
          count: existing ? existing.count + 1 : 1
        };
        this.notifications.set(conversationId, notification);
        this.updateIcon();
        this.updateContextMenu();
        console.log(`[TrayNotifications] Added notification for conversation: ${conversationTitle} (${conversationId})`);
      }
      /**
       * Update chat visibility state from renderer
       */
      updateChatVisibility(isVisible) {
        this.isChatVisible = isVisible;
      }
      /**
       * Clear notification for a specific conversation
       */
      clearNotification(conversationId) {
        const hadNotification = this.notifications.has(conversationId);
        this.notifications.delete(conversationId);
        if (hadNotification) {
          this.updateIcon();
          this.updateContextMenu();
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("tray:notification-cleared", conversationId);
          }
        }
      }
      /**
       * Clear all notifications
       */
      clearAllNotifications() {
        const count = this.notifications.size;
        this.notifications.clear();
        if (count > 0) {
          this.updateIcon();
          this.updateContextMenu();
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("tray:all-notifications-cleared");
          }
          console.log("[TrayNotifications] All notifications cleared");
        }
      }
      /**
       * Get current notification count
       */
      getNotificationCount() {
        return this.notifications.size;
      }
      /**
       * Check if a conversation has pending notification
       */
      hasNotification(conversationId) {
        return this.notifications.has(conversationId);
      }
      /**
       * Clean up tray resources
       */
      destroy() {
        if (this.tray) {
          this.tray.destroy();
          this.tray = null;
        }
        this.notifications.clear();
        this.mainWindow = null;
        console.log("[TrayNotifications] Tray manager destroyed");
      }
    };
    trayNotificationManager = new TrayNotificationManager();
  }
});

// src/config/modes.ts
var modes_exports = {};
__export(modes_exports, {
  BUILTIN_MODES: () => BUILTIN_MODES
});
var BUILTIN_MODES;
var init_modes = __esm({
  "src/config/modes.ts"() {
    "use strict";
    BUILTIN_MODES = {
      architect: {
        systemPromptAppend: `You are in architect mode. Your role is to deeply analyze the codebase and produce a structured execution plan \u2014 do NOT write or modify any code or files.

When given a task:
1. Read all relevant files using available read/search tools to fully understand the codebase
2. Think through the approach, trade-offs, and risks
3. Output your plan in EXACTLY this format (valid JSON inside the XML tags):

<plan>
{
  "title": "Brief descriptive title for the task",
  "goal": "What this plan accomplishes in 1-2 sentences",
  "files": [
    { "path": "relative/path/to/file.ts", "action": "create", "reason": "Why this file needs to be created" },
    { "path": "relative/path/to/other.ts", "action": "modify", "reason": "What changes are needed and why" }
  ],
  "steps": [
    { "id": "1", "title": "Step title", "description": "Detailed description of what to do and why", "files": ["relative/path/to/file.ts"] },
    { "id": "2", "title": "Next step", "description": "What this step does", "files": ["relative/path/to/other.ts"] }
  ],
  "risks": ["Potential breaking changes or gotchas to watch out for"],
  "questions": ["Any clarifications needed before executing \u2014 leave empty if none"]
}
</plan>

After outputting the plan, stop. Do not make any file changes. Wait for the user to approve, modify, or reject the plan.

Note: when the user approves the plan, it will be saved to \`.omnicode/plan.json\` in the workspace. During execution you can read that file to review the full plan context.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      code: {
        systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code.

If a plan file exists at \`.omnicode/plan.json\`, you can read it with the Read tool to review the approved plan. As you complete each step, update that file by setting the step's \`status\` field to \`"in_progress"\` when you begin it and \`"completed"\` when you finish it. This keeps the plan progress visible to the user.`,
        temperature: 0.3
      },
      review: {
        systemPromptAppend: "You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      security: {
        systemPromptAppend: "You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      debug: {
        systemPromptAppend: "You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.",
        temperature: 0.2
      },
      ask: {
        systemPromptAppend: `You are in ASK mode. Your ONLY purpose is to answer questions and provide information.

CRITICAL RULES:
1. You are in READ-ONLY mode - you CANNOT and MUST NOT make any changes to files, code, or the system
2. If the user asks you to make a change, fix something, edit code, create files, or run commands, you MUST REFUSE
3. When refusing, tell the user: "I can't make changes in Ask mode. Please switch to Code mode (\u2318I) if you'd like me to make this change."
4. You may use Read, Glob, Grep, SearchWeb, WebFetch, and other read/search tools to find information
5. NEVER use Write, Edit, MultiFileEdit, DiffEdit, Bash, GitCommit, or any tool that modifies files or executes commands
6. If you need to show code, copy it into your response - do not create or modify files

You are an assistant that provides information ONLY. Changes require switching to Code mode.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      }
    };
  }
});

// main/agent-bridge.ts
function getFilePathsFromToolInput(toolName, input) {
  const paths = [];
  switch (toolName) {
    case "Write":
    case "Edit":
    case "DiffEdit":
      if (typeof input.file_path === "string") {
        paths.push(input.file_path);
      }
      break;
    case "MultiFileEdit":
      if (Array.isArray(input.edits)) {
        for (const edit of input.edits) {
          if (typeof edit === "object" && edit && typeof edit.file_path === "string") {
            paths.push(edit.file_path);
          }
        }
      }
      break;
  }
  return paths;
}
function getChangeType(toolName) {
  switch (toolName) {
    case "Write":
      return "write";
    case "Edit":
    case "MultiFileEdit":
    case "DiffEdit":
      return "edit";
    default:
      return "write";
  }
}
var import_electron3, FILE_MODIFYING_TOOLS, AgentBridge, agentBridge;
var init_agent_bridge = __esm({
  "main/agent-bridge.ts"() {
    "use strict";
    import_electron3 = require("electron");
    init_file_history();
    init_change_review_manager();
    init_settings();
    init_tray_notifications();
    FILE_MODIFYING_TOOLS = ["Write", "Edit", "MultiFileEdit", "DiffEdit"];
    AgentBridge = class {
      // Store conversation instances
      conversations = /* @__PURE__ */ new Map();
      pendingPermissionRequests = /* @__PURE__ */ new Map();
      pendingUserInputRequests = /* @__PURE__ */ new Map();
      // Factory function to create new agent instances
      agentFactory = null;
      // Provider registry for resolving providers when switching models
      providerRegistry = null;
      eventListeners = /* @__PURE__ */ new Set();
      // Workspace path for file history
      workspacePath = "";
      // Change review mode enabled (default: true)
      changeReviewEnabled = true;
      // Initialize the bridge with agent factory
      initialize(agentFactory) {
        this.agentFactory = agentFactory;
        this.initializeChangeReviewFromSettings().catch((err) => {
          console.error("[AgentBridge] Failed to initialize change review settings:", err);
        });
      }
      /**
       * Enable or disable change review mode
       */
      setChangeReviewEnabled(enabled) {
        this.changeReviewEnabled = enabled;
        console.log(`[AgentBridge] Change review mode ${enabled ? "enabled" : "disabled"}`);
        getSettingsManager().then((manager) => {
          manager.set("changeReview.enabled", enabled);
        }).catch((err) => console.error("[AgentBridge] Failed to save change review setting:", err));
      }
      /**
       * Check if change review mode is enabled
       */
      isChangeReviewEnabled() {
        return this.changeReviewEnabled;
      }
      /**
       * Get change review setting from settings manager
       */
      async getChangeReviewSetting() {
        try {
          const manager = await getSettingsManager();
          return {
            enabled: manager.get("changeReview.enabled") ?? true,
            mode: manager.get("changeReview.mode") ?? "all"
          };
        } catch (error) {
          console.error("[AgentBridge] Failed to get change review setting:", error);
          return { enabled: true, mode: "all" };
        }
      }
      /**
       * Set change review mode (all or dangerous only)
       */
      async setChangeReviewMode(mode) {
        try {
          const manager = await getSettingsManager();
          manager.set("changeReview.mode", mode);
          console.log(`[AgentBridge] Change review mode set to: ${mode}`);
        } catch (error) {
          console.error("[AgentBridge] Failed to set change review mode:", error);
        }
      }
      /**
       * Initialize change review settings from settings manager
       */
      async initializeChangeReviewFromSettings() {
        try {
          const manager = await getSettingsManager();
          const enabled = manager.get("changeReview.enabled");
          if (typeof enabled === "boolean") {
            this.changeReviewEnabled = enabled;
            console.log(`[AgentBridge] Loaded change review setting: ${enabled ? "enabled" : "disabled"}`);
          }
          manager.onChange((key, value) => {
            if (key === "changeReview.enabled" && typeof value === "boolean") {
              this.changeReviewEnabled = value;
              console.log(`[AgentBridge] Change review setting updated: ${value ? "enabled" : "disabled"}`);
            }
          });
        } catch (error) {
          console.error("[AgentBridge] Failed to initialize change review from settings:", error);
        }
      }
      // Set the workspace path for file history tracking
      setWorkspacePath(workspacePath) {
        this.workspacePath = workspacePath;
      }
      updateWorkspaceContext(workspacePath, systemPrompt, workspacePaths) {
        this.workspacePath = workspacePath;
        for (const state of this.conversations.values()) {
          state.agent.updateConfig({
            cwd: workspacePath,
            systemPrompt,
            workspacePaths: workspacePaths ?? [workspacePath]
          });
        }
      }
      // Targeted variant: only updates the specified conversations so that a folder
      // change in one window does not overwrite another window's agent context.
      updateWorkspaceContextForConversations(workspacePath, systemPrompt, conversationIds, workspacePaths) {
        for (const conversationId of conversationIds) {
          const state = this.conversations.get(conversationId);
          if (state) {
            state.agent.updateConfig({ cwd: workspacePath, systemPrompt, workspacePaths: workspacePaths ?? [workspacePath] });
          }
        }
      }
      // Get the working directory for a specific conversation (may differ from global path in multi-window)
      getWorkspacePathForConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        return state?.agent.config.cwd || this.workspacePath;
      }
      // Set the provider registry for model switching
      setProviderRegistry(registry) {
        this.providerRegistry = registry;
      }
      // Create a new conversation with optional model, provider, and working directory
      createConversation(conversationId, model, provider, workingDirectory) {
        console.log(`[AgentBridge] createConversation: id=${conversationId}, model=${model || "default"}, provider=${provider || "default"}, workingDirectory=${workingDirectory || "default"}`);
        if (!this.agentFactory) {
          console.error("[AgentBridge] Not initialized - no agent factory");
          return false;
        }
        if (this.conversations.has(conversationId)) {
          console.log(`[AgentBridge] Conversation ${conversationId} already exists, reusing`);
          if (workingDirectory) {
            const existing = this.conversations.get(conversationId);
            existing.agent.updateConfig({ cwd: workingDirectory });
            this.workspacePath = workingDirectory;
          }
          return true;
        }
        const agent = this.agentFactory(conversationId, model, provider, workingDirectory);
        if (workingDirectory) {
          this.workspacePath = workingDirectory;
          console.log(`[AgentBridge] Created conversation ${conversationId} with cwd: ${workingDirectory}`);
        }
        this.conversations.set(conversationId, {
          agent,
          isRunning: false,
          abortController: null,
          pendingFileChanges: /* @__PURE__ */ new Map()
        });
        console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || "default"}, provider: ${provider || "default"}, cwd: ${workingDirectory || "default"})`);
        return true;
      }
      // Restore message history into an existing conversation's agent context
      restoreHistory(conversationId, messages) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`[AgentBridge] restoreHistory: conversation ${conversationId} not found`);
          return false;
        }
        state.agent.restoreHistory(messages);
        console.log(`[AgentBridge] Restored ${messages.length} messages into conversation ${conversationId}`);
        return true;
      }
      // Close a conversation and cleanup
      closeConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found`);
          return false;
        }
        if (state.abortController) {
          state.abortController.abort();
        }
        for (const [toolId, pending] of this.pendingPermissionRequests.entries()) {
          if (pending.conversationId === conversationId) {
            pending.onDeny();
            this.pendingPermissionRequests.delete(toolId);
          }
        }
        for (const [requestId, pending] of this.pendingUserInputRequests.entries()) {
          if (pending.conversationId === conversationId) {
            pending.onCancel();
            this.pendingUserInputRequests.delete(requestId);
          }
        }
        this.conversations.delete(conversationId);
        if (this.workspacePath) {
          getFileHistoryManager(this.workspacePath).clearConversation(conversationId).catch((err) => {
            console.error(`[AgentBridge] Failed to clear file history for ${conversationId}:`, err);
          });
        }
        console.log(`[AgentBridge] Closed conversation: ${conversationId}`);
        return true;
      }
      // Check if conversation exists
      hasConversation(conversationId) {
        return this.conversations.has(conversationId);
      }
      // Get list of active conversation IDs
      getActiveConversations() {
        return Array.from(this.conversations.keys());
      }
      // Get a snapshot of a conversation's messages and model info for persistence
      getConversationSnapshot(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state)
          return null;
        return {
          messages: [...state.agent.messages],
          model: state.agent.config.model,
          provider: state.agent.config.provider.name
        };
      }
      // Get available models from the provider registry
      getAvailableModels() {
        if (!this.providerRegistry) {
          console.warn("[AgentBridge] No provider registry set, returning empty model list");
          return [];
        }
        try {
          const models = [];
          const registry = this.providerRegistry;
          let providers = [];
          if (typeof registry.getAvailable === "function") {
            providers = registry.getAvailable();
          } else if (registry.providers) {
            providers = Array.from(registry.providers.values());
          }
          for (const provider of providers) {
            if (!provider.isAvailable())
              continue;
            const providerModels = provider.listModels();
            for (const model of providerModels) {
              models.push({
                id: model.id,
                name: model.name || model.id,
                provider: provider.name,
                description: model.description,
                isAvailable: true,
                aliases: model.aliases
              });
            }
          }
          console.log(`[AgentBridge] Returning ${models.length} available models`);
          return models;
        } catch (error) {
          console.error("[AgentBridge] Error getting available models:", error);
          return [];
        }
      }
      getConversationIdForSession(sessionId) {
        for (const [conversationId, state] of this.conversations.entries()) {
          if (state.agent.id === sessionId) {
            return conversationId;
          }
        }
        return void 0;
      }
      async sendMessage(conversationId, message, workingDirectory, fileReferences, images) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`Conversation ${conversationId} not found`);
          throw new Error(`Conversation ${conversationId} not found`);
        }
        if (state.isRunning) {
          console.warn(`Conversation ${conversationId} is already processing`);
          return;
        }
        state.isRunning = true;
        state.abortController = new AbortController();
        state.currentAssistantMessageId = void 0;
        state.pendingFileChanges.clear();
        const workingDir = workingDirectory || this.workspacePath;
        if (workingDir) {
          this.workspacePath = workingDir;
          if (state.agent.config.cwd !== workingDir) {
            state.agent.updateConfig({ cwd: workingDir });
          }
        }
        let messageWithContext = message;
        if (fileReferences && fileReferences.length > 0) {
          const fileContext = fileReferences.filter((ref) => !ref.isDirectory && ref.content).map((ref) => `

--- File: ${ref.path} ---
${ref.content}`).join("");
          if (fileContext) {
            messageWithContext = `${message}${fileContext}`;
          }
        }
        const messageContent = images && images.length > 0 ? [
          { type: "text", text: messageWithContext },
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", mediaType: img.mediaType, data: img.data }
          }))
        ] : messageWithContext;
        const userMsgId = `user-${Date.now()}`;
        console.log(`[AgentBridge] Emitting user_message event: conversationId=${conversationId}, id=${userMsgId}, contentType=${typeof messageContent}, isArray=${Array.isArray(messageContent)}`);
        const displayContent = images && images.length > 0 ? [
          { type: "text", text: message },
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", mediaType: img.mediaType, data: img.data }
          }))
        ] : message;
        this.emitEvent(conversationId, {
          type: "user_message",
          message: {
            id: userMsgId,
            role: "user",
            content: displayContent,
            timestamp: Date.now(),
            fileReferences: fileReferences?.map(({ path: path39, name, isDirectory, extension }) => ({ path: path39, name, isDirectory, extension }))
          }
        });
        console.log(`[AgentBridge] user_message event emitted, listener count=${this.eventListeners.size}`);
        try {
          console.log(`[AgentBridge] Starting agent.run for conversation ${conversationId}${images?.length ? ` with ${images.length} image(s)` : ""}`);
          for await (const event of state.agent.run(messageContent)) {
            if (state.abortController.signal.aborted) {
              break;
            }
            const agentEvent = event;
            if (agentEvent.type === "error") {
              console.error("[AgentBridge] Agent error event:", agentEvent.error);
            }
            if (agentEvent.type === "turn_complete") {
              const stopReason = agentEvent.message.metadata?.stopReason;
              const assistantMessage = agentEvent.message;
              const assistantMessageId = assistantMessage.id;
              if (stopReason === "tool_use") {
                state.currentAssistantMessageId = assistantMessageId;
              } else {
                state.isRunning = false;
                state.currentAssistantMessageId = void 0;
                state.pendingFileChanges.clear();
                const content = assistantMessage.content;
                const messagePreview = typeof content === "string" ? content.slice(0, 100) : "New response";
                const firstUserMessage = state.agent.messages.find((m) => m.role === "user");
                const conversationTitle = firstUserMessage ? typeof firstUserMessage.content === "string" ? firstUserMessage.content.slice(0, 30) : "Chat" : "Chat";
                trayNotificationManager.notifyResponseComplete(
                  conversationId,
                  conversationTitle,
                  messagePreview,
                  false
                  // isConversationActive - will be determined by tray manager based on activeConversationId
                );
              }
            }
            if (agentEvent.type === "tool_call_start") {
              const { toolName, toolId, input } = agentEvent;
              if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
                try {
                  const filePaths = getFilePathsFromToolInput(toolName, input);
                  const changeType = getChangeType(toolName);
                  state.pendingFileChanges.set(toolId, filePaths);
                  const fileHistoryManager2 = getFileHistoryManager(workingDir);
                  for (const filePath of filePaths) {
                    await fileHistoryManager2.captureBeforeChange(
                      conversationId,
                      state.currentAssistantMessageId,
                      toolId,
                      filePath,
                      changeType
                    );
                  }
                } catch (error) {
                  console.error("[AgentBridge] Failed to capture before-change state:", error);
                }
              }
            }
            if (agentEvent.type === "tool_call_end") {
              const { toolName, toolId, result } = agentEvent;
              console.log(`[ChangeReview] tool_call_end: toolName=${toolName}, toolId=${toolId}, changeReviewEnabled=${this.changeReviewEnabled}, workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
              if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
                try {
                  const filePaths = state.pendingFileChanges.get(toolId) || [];
                  const fileHistoryManager2 = getFileHistoryManager(workingDir);
                  const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
                  console.log(`[ChangeReview] Processing tool_call_end for ${toolName}, filePaths=${JSON.stringify(filePaths)}, isError=${result.isError}`);
                  if (!result.isError) {
                    for (const filePath of filePaths) {
                      await fileHistoryManager2.captureAfterChange(
                        conversationId,
                        state.currentAssistantMessageId,
                        toolId,
                        filePath
                      );
                    }
                    const changes = await fileHistoryManager2.getMessageChanges(
                      conversationId,
                      state.currentAssistantMessageId
                    );
                    console.log(`[ChangeReview] getMessageChanges returned ${changes.length} change(s) for messageId=${state.currentAssistantMessageId}`);
                    if (changes.length > 0) {
                      this.emit("file_change", {
                        conversationId,
                        messageId: state.currentAssistantMessageId,
                        toolCallId: toolId,
                        fileChanges: changes.map((c) => ({
                          filePath: c.filePath,
                          changeType: c.changeType,
                          hasBeforeContent: !!c.beforeContent,
                          hasAfterContent: !!c.afterContent
                        }))
                      });
                      if (this.changeReviewEnabled) {
                        console.log(`[ChangeReview] Change review enabled, processing ${changes.length} change(s) for preview`);
                        const currentToolChanges = changes.filter((c) => c.toolCallId === toolId);
                        console.log(`[ChangeReview] Current tool (${toolId}) has ${currentToolChanges.length} change(s)`);
                        for (const change of currentToolChanges) {
                          const preview = await fileHistoryManager2.getChangePreview(
                            conversationId,
                            state.currentAssistantMessageId,
                            change.toolCallId
                          );
                          console.log(`[ChangeReview] getChangePreview for toolCallId=${change.toolCallId}: ${preview ? `found (${preview.filePath}, +${preview.additions}/-${preview.deletions})` : "null"}`);
                          if (preview) {
                            const pendingChange = {
                              toolCallId: preview.toolCallId,
                              messageId: preview.messageId,
                              conversationId,
                              filePath: preview.filePath,
                              fileName: preview.fileName,
                              toolName: preview.toolName,
                              changeType: preview.changeType,
                              startLine: preview.startLine,
                              endLine: preview.endLine,
                              lineCount: preview.lineCount,
                              beforeContent: change.beforeContent,
                              afterContent: change.afterContent || "",
                              diffContent: preview.diffContent,
                              beforeSnippet: preview.beforeSnippet,
                              afterSnippet: preview.afterSnippet,
                              additions: preview.additions,
                              deletions: preview.deletions,
                              status: "pending",
                              timestamp: preview.timestamp
                            };
                            changeReviewManager2.stageToolCallChange(pendingChange);
                            console.log(`[ChangeReview] Emitting change_preview for ${preview.filePath} (toolId=${change.toolCallId}, messageId=${state.currentAssistantMessageId})`);
                            this.emitEvent(conversationId, {
                              type: "change_preview",
                              conversationId,
                              message: { id: state.currentAssistantMessageId },
                              toolId: change.toolCallId,
                              filePath: preview.filePath,
                              fileName: preview.fileName,
                              toolName: preview.toolName,
                              changeType: preview.changeType,
                              startLine: preview.startLine,
                              endLine: preview.endLine,
                              lineCount: preview.lineCount,
                              diffContent: preview.diffContent,
                              beforeSnippet: preview.beforeSnippet,
                              afterSnippet: preview.afterSnippet,
                              additions: preview.additions,
                              deletions: preview.deletions,
                              status: "pending"
                            });
                          }
                        }
                      } else {
                        console.log(`[ChangeReview] Change review disabled, skipping preview emission`);
                      }
                    } else {
                      console.log(`[ChangeReview] No changes found, skipping preview emission`);
                    }
                  } else {
                    console.log(`[ChangeReview] Tool returned error, skipping change capture`);
                  }
                } catch (error) {
                  console.error("[AgentBridge] Failed to capture after-change state:", error);
                } finally {
                  state.pendingFileChanges.delete(toolId);
                }
              } else {
                if (!FILE_MODIFYING_TOOLS.includes(toolName)) {
                } else {
                  console.log(`[ChangeReview] Skipping change review: workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
                }
              }
            }
            if (agentEvent.type === "error") {
              const rawErr = agentEvent.error;
              const message2 = rawErr?.message || rawErr?.error?.message || (typeof rawErr === "string" ? rawErr : JSON.stringify(rawErr));
              const status = rawErr?.status;
              this.emitEvent(conversationId, {
                type: "error",
                error: { message: message2, ...status != null ? { status } : {} }
              });
              state.isRunning = false;
              state.currentAssistantMessageId = void 0;
              state.pendingFileChanges.clear();
            } else if (agentEvent.type === "tool_call_start" && state.currentAssistantMessageId) {
              this.emitEvent(conversationId, { ...agentEvent, messageId: state.currentAssistantMessageId });
            } else {
              this.emitEvent(conversationId, agentEvent);
            }
          }
        } catch (error) {
          console.error(`[AgentBridge] Agent error in conversation ${conversationId}:`, error);
          console.error("[AgentBridge] Error details:", {
            message: error.message,
            stack: error.stack,
            status: error.status,
            code: error.code,
            type: error.type,
            response: error.response
          });
          this.emitEvent(conversationId, {
            type: "error",
            error: { message: error.message }
          });
          state.isRunning = false;
          state.currentAssistantMessageId = void 0;
          state.pendingFileChanges.clear();
        }
      }
      abort(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for abort`);
          return;
        }
        if (state.abortController) {
          state.abortController.abort();
        }
        state.isRunning = false;
      }
      /**
       * Rollback all file changes from a specific message onwards
       * This restores files to their state before the specified message was processed
       */
      async rollbackToMessage(conversationId, messageId) {
        if (!this.workspacePath) {
          console.error("[AgentBridge] No workspace path set for rollback");
          return { success: false, restoredFiles: [], failedFiles: [] };
        }
        const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
        return await fileHistoryManager2.rollbackToMessage(conversationId, messageId);
      }
      requestPermission(sessionId, toolName, toolId, input, callbacks) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId) {
          callbacks.onDeny();
          return;
        }
        this.pendingPermissionRequests.set(toolId, {
          conversationId,
          ...callbacks
        });
        this.emitEvent(conversationId, {
          type: "permission_request",
          toolName,
          toolId,
          input
        });
      }
      respondPermission(toolId, decision) {
        const pending = this.pendingPermissionRequests.get(toolId);
        if (!pending) {
          return false;
        }
        this.pendingPermissionRequests.delete(toolId);
        if (decision === "deny") {
          pending.onDeny();
          this.emitEvent(pending.conversationId, { type: "permission_denied", toolId });
          return true;
        }
        if (decision === "allowAlways") {
          pending.onAllowAlways();
        } else {
          pending.onAllow();
        }
        this.emitEvent(pending.conversationId, { type: "permission_granted", toolId });
        return true;
      }
      requestUserInput(sessionId, requestId, prompt, terminalCommand, waitForInput, placeholder, callbacks) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId) {
          callbacks.onCancel();
          return;
        }
        this.pendingUserInputRequests.set(requestId, {
          conversationId,
          ...callbacks
        });
        this.emitEvent(conversationId, {
          type: "user_input_request",
          requestId,
          prompt,
          terminalCommand,
          waitForInput,
          placeholder
        });
      }
      respondUserInput(requestId, response, cancelled) {
        const pending = this.pendingUserInputRequests.get(requestId);
        if (!pending) {
          return false;
        }
        this.pendingUserInputRequests.delete(requestId);
        if (cancelled) {
          pending.onCancel();
          this.emitEvent(pending.conversationId, { type: "user_input_cancelled", requestId });
          return true;
        }
        pending.onResponse(response);
        this.emitEvent(pending.conversationId, { type: "user_input_responded", requestId, response });
        return true;
      }
      emitToolProgress(sessionId, toolName, toolId, message) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId)
          return;
        this.emitEvent(conversationId, {
          type: "tool_call_progress",
          toolName,
          toolId,
          message
        });
      }
      async switchModel(conversationId, model, providerName) {
        console.log(`[AgentBridge] switchModel called: conversation=${conversationId}, model=${model}, provider=${providerName}`);
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`[AgentBridge] Conversation ${conversationId} not found`);
          return false;
        }
        try {
          let newProvider = state.agent.config.provider;
          console.log(`[AgentBridge] Current provider: ${newProvider.name}, requested: ${providerName}`);
          if (providerName && providerName !== state.agent.config.provider.name) {
            if (this.providerRegistry) {
              console.log(`[AgentBridge] Looking up provider ${providerName} in registry`);
              const resolved = this.providerRegistry.getProvider(providerName);
              console.log(`[AgentBridge] Provider ${providerName} found:`, !!resolved);
              if (resolved) {
                console.log(`[AgentBridge] Provider ${providerName} isAvailable:`, resolved.isAvailable());
              }
              if (resolved && resolved.isAvailable()) {
                newProvider = resolved;
                console.log(`[AgentBridge] Switched provider to ${providerName} for conversation ${conversationId}`);
              } else {
                console.warn(`[AgentBridge] Provider ${providerName} not available, keeping current provider`);
                if (resolved && !resolved.isAvailable()) {
                  console.warn(`[AgentBridge] Provider ${providerName} exists but is not available (check API key)`);
                }
              }
            } else {
              console.warn(`[AgentBridge] No provider registry set, cannot switch provider`);
            }
          }
          state.agent.updateConfig({
            model,
            provider: newProvider
          });
          console.log(`[AgentBridge] Switched model to ${model} for conversation ${conversationId}`);
          return true;
        } catch (error) {
          console.error(`Failed to switch model for conversation ${conversationId}:`, error);
          return false;
        }
      }
      async setMode(conversationId, mode) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`Conversation ${conversationId} not found`);
          return { success: false, mode };
        }
        try {
          const { BUILTIN_MODES: BUILTIN_MODES2 } = await Promise.resolve().then(() => (init_modes(), modes_exports));
          const modeConfig = BUILTIN_MODES2[mode];
          if (!modeConfig) {
            console.warn(`[AgentBridge] Unknown mode: ${mode}`);
            return { success: false, mode };
          }
          const updates = {};
          if (modeConfig.temperature !== void 0) {
            updates.temperature = modeConfig.temperature;
          }
          const currentSystemPrompt = state.agent.config.systemPrompt || "";
          const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug|ask) mode\.?.*/s, "");
          updates.systemPrompt = basePrompt + "\n\n" + modeConfig.systemPromptAppend;
          state.agent.updateConfig(updates);
          if (modeConfig.disabledTools || modeConfig.allowedTools) {
            const updatedTools = state.agent.config.tools.map((tool) => {
              const shouldDisable = modeConfig.disabledTools?.includes(tool.name);
              const shouldEnable = modeConfig.allowedTools?.includes(tool.name);
              if (shouldDisable) {
                return { ...tool, enabled: false };
              }
              if (modeConfig.allowedTools && !shouldEnable) {
                return { ...tool, enabled: false };
              }
              return { ...tool, enabled: true };
            });
            state.agent.updateConfig({ tools: updatedTools });
          }
          console.log(`[AgentBridge] Set mode to ${mode} for conversation ${conversationId}`);
          return { success: true, mode };
        } catch (error) {
          console.error(`[AgentBridge] Failed to set mode for conversation ${conversationId}:`, error);
          return { success: false, mode };
        }
      }
      clearConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for clear`);
          return;
        }
        state.agent.clearMessages();
        if (this.workspacePath) {
          const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
          const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
          changeReviewManager2.clearConversation(conversationId);
        }
      }
      /**
       * Respond to a pending change review request
       */
      async respondToChangeReview(conversationId, messageId, toolCallId, decision) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, error: "No workspace path set for conversation" };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        if (decision === "accept") {
          const result = await changeReviewManager2.acceptToolCallChange(conversationId, toolCallId);
          if (result.success) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_accepted",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
          return result;
        } else {
          const result = await changeReviewManager2.rejectToolCallChange(conversationId, messageId, toolCallId);
          if (result.success) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_rejected",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
          return result;
        }
      }
      /**
       * Accept all pending changes for a conversation
       */
      async acceptAllChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, accepted: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        const result = await changeReviewManager2.acceptAllChanges(conversationId);
        if (result.accepted.length > 0) {
          for (const toolCallId of result.accepted) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_accepted",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
        }
        return result;
      }
      /**
       * Reject all pending changes for a conversation
       */
      async rejectAllChanges(conversationId, messageId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, rejected: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        const result = await changeReviewManager2.rejectAllChanges(conversationId, messageId);
        if (result.rejected.length > 0) {
          for (const toolCallId of result.rejected) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_rejected",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
        }
        return result;
      }
      /**
       * Get pending changes for a conversation
       */
      getPendingChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return [];
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.getPendingChanges(conversationId);
      }
      /**
       * Get change summary for a conversation
       */
      getChangeSummary(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { totalPending: 0, totalAccepted: 0, totalRejected: 0 };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.getChangeSummary(conversationId);
      }
      /**
       * Check if there are pending changes for a conversation
       */
      hasPendingChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return false;
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.hasPendingChanges(conversationId);
      }
      /**
       * Truncate conversation messages to a specific index
       * Keeps messages from 0 to messageIndex (inclusive)
       * @returns true if successful, false if conversation not found
       */
      truncateMessages(conversationId, messageIndex) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`[AgentBridge] Conversation ${conversationId} not found for truncate`);
          return false;
        }
        const currentMessages = state.agent.messages;
        if (messageIndex < 0 || messageIndex >= currentMessages.length) {
          console.warn(`[AgentBridge] Invalid message index ${messageIndex} for conversation with ${currentMessages.length} messages`);
          return false;
        }
        const truncatedMessages = currentMessages.slice(0, messageIndex + 1);
        state.agent.clearMessages();
        const agentWithAddMessage = state.agent;
        if (typeof agentWithAddMessage.addMessage === "function") {
          for (const msg of truncatedMessages) {
            agentWithAddMessage.addMessage(msg);
          }
        } else {
          const agentWithInternal = state.agent;
          if (agentWithInternal._messages) {
            agentWithInternal._messages.push(...truncatedMessages);
          } else {
            console.error("[AgentBridge] Cannot add messages - no addMessage method or _messages array available");
            return false;
          }
        }
        console.log(`[AgentBridge] Truncated conversation ${conversationId} to ${truncatedMessages.length} messages (removed ${currentMessages.length - truncatedMessages.length})`);
        return true;
      }
      onEvent(callback) {
        this.eventListeners.add(callback);
        return () => this.eventListeners.delete(callback);
      }
      emitEvent(conversationId, event) {
        const eventWithId = { ...event, conversationId };
        const windows = import_electron3.BrowserWindow.getAllWindows();
        if (event.type === "user_message") {
          console.log(`[AgentBridge.emitEvent] user_message: broadcasting to ${windows.length} window(s), ${this.eventListeners.size} listener(s), conversationId=${conversationId}`);
        }
        windows.forEach((window) => {
          window.webContents.send("agent:event", eventWithId);
        });
        this.eventListeners.forEach((listener) => listener(eventWithId));
      }
      // General event emitter for non-agent events (like file_change)
      emit(eventName, data) {
        const event = {
          type: "file_change",
          ...data
        };
        const eventWithId = { ...event, conversationId: data.conversationId };
        import_electron3.BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send("agent:event", eventWithId);
        });
        this.eventListeners.forEach((listener) => listener(eventWithId));
      }
      isProcessing(conversationId) {
        const state = this.conversations.get(conversationId);
        return state ? state.isRunning : false;
      }
      async getTokenCount(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for getTokenCount`);
          return 0;
        }
        const agent = state.agent;
        if (typeof agent.getTokenCount === "function") {
          return await agent.getTokenCount();
        }
        return 0;
      }
    };
    agentBridge = new AgentBridge();
  }
});

// main/remote-auth.ts
function createProxySession(port2) {
  const token = (0, import_node_crypto.randomBytes)(32).toString("hex");
  proxySessionStore.set(token, { port: port2, expiresAt: Date.now() + 60 * 60 * 1e3 });
  for (const [key, val] of proxySessionStore) {
    if (val.expiresAt < Date.now())
      proxySessionStore.delete(key);
  }
  return token;
}
function validateProxySessionToken(token) {
  const session = proxySessionStore.get(token);
  if (!session)
    return false;
  if (session.expiresAt < Date.now()) {
    proxySessionStore.delete(token);
    return false;
  }
  return true;
}
function validateApiKey(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({ error: "Missing API key. Include X-API-Key header." });
    return;
  }
  const storedKey = settingsManager.get("remoteAccess.apiKey");
  if (!storedKey) {
    res.status(500).json({ error: "Server not properly configured. API key not set." });
    return;
  }
  if (!timingSafeEqual2(apiKey, storedKey)) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }
  next();
}
function generateApiKey() {
  return (0, import_node_crypto.randomBytes)(32).toString("hex");
}
function ensureApiKey() {
  let apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    apiKey = generateApiKey();
    settingsManager.set("remoteAccess.apiKey", apiKey);
    console.log("[RemoteAuth] Generated new API key for remote access");
  }
  return apiKey;
}
function getApiKey() {
  return settingsManager.get("remoteAccess.apiKey");
}
function getCorsOptions() {
  const allowedOrigins = settingsManager.get("remoteAccess.allowedOrigins");
  const origin = allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  return {
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key", "Authorization"],
    credentials: true
  };
}
function validateRequestSignature(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!timestamp || !signature) {
    res.status(401).json({ error: "Missing X-Timestamp or X-Signature headers." });
    return;
  }
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1e3) {
    res.status(401).json({ error: "Request timestamp is expired or invalid." });
    return;
  }
  const apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    res.status(500).json({ error: "Server not properly configured." });
    return;
  }
  const signingString = `${req.method}
${req.originalUrl}
${timestamp}`;
  const expected = crypto2.createHmac("sha256", apiKey).update(signingString).digest("hex");
  console.log("[SignatureDebug] Server signing string:", JSON.stringify(signingString));
  console.log("[SignatureDebug] Server expected sig:", expected.substring(0, 16) + "...");
  console.log("[SignatureDebug] Client sent sig:", signature.substring(0, 16) + "...");
  if (!timingSafeEqual2(signature, expected)) {
    res.status(401).json({ error: "Invalid request signature.", debug: { serverString: signingString } });
    return;
  }
  next();
}
function timingSafeEqual2(a, b) {
  if (a.length !== b.length) {
    const bufA2 = Buffer.from(a);
    const bufB2 = Buffer.alloc(bufA2.length, 0);
    crypto2.timingSafeEqual(bufA2, bufB2);
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto2.timingSafeEqual(bufA, bufB);
}
var import_node_crypto, crypto2, proxySessionStore;
var init_remote_auth = __esm({
  "main/remote-auth.ts"() {
    "use strict";
    import_node_crypto = require("crypto");
    init_settings();
    crypto2 = __toESM(require("crypto"), 1);
    proxySessionStore = /* @__PURE__ */ new Map();
  }
});

// main/remote-event-emitter.ts
function initializeEventEmitter() {
  if (unsubscribe) {
    return;
  }
  unsubscribe = agentBridge.onEvent((event) => {
    broadcastEvent(event);
  });
  console.log("[RemoteEventEmitter] Initialized and subscribed to AgentBridge events");
}
function cleanupEventEmitter() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    Array.from(responseSet).forEach((res) => {
      try {
        res.end();
      } catch {
      }
    });
    responseSet.clear();
  });
  connections.clear();
  console.log("[RemoteEventEmitter] Cleaned up all connections");
}
function registerConnection(conversationId, res) {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, /* @__PURE__ */ new Set());
  }
  const responseSet = connections.get(conversationId);
  responseSet.add(res);
  console.log(`[RemoteEventEmitter] Registered connection for conversation ${conversationId}`);
  res.on("close", () => {
    unregisterConnection(conversationId, res);
  });
  res.on("error", () => {
    unregisterConnection(conversationId, res);
  });
}
function unregisterConnection(conversationId, res) {
  const responseSet = connections.get(conversationId);
  if (responseSet) {
    responseSet.delete(res);
    if (responseSet.size === 0) {
      connections.delete(conversationId);
    }
    console.log(`[RemoteEventEmitter] Unregistered connection for conversation ${conversationId}`);
  }
}
function broadcastEvent(event) {
  const { conversationId, ...eventData } = event;
  const responseSet = connections.get(conversationId);
  if (!responseSet || responseSet.size === 0) {
    console.log(`[RemoteEventEmitter] Event ${event.type} has no SSE connections for conversation ${conversationId}. Active conversations: [${Array.from(connections.keys()).join(", ")}]`);
    return;
  }
  console.log(`[RemoteEventEmitter] Broadcasting ${event.type} to ${responseSet.size} SSE connection(s) for conversation ${conversationId}`);
  const sseData = `data: ${JSON.stringify(eventData)}

`;
  Array.from(responseSet).forEach((res) => {
    try {
      const ok = res.write(sseData);
      if (!ok) {
        console.warn(`[RemoteEventEmitter] Backpressure on SSE write for ${event.type} (conversation ${conversationId}) \u2014 buffer full`);
      }
    } catch (error) {
      console.error(`[RemoteEventEmitter] Failed to send event to conversation ${conversationId}:`, error);
      responseSet.delete(res);
    }
  });
}
function getConnectionStats() {
  let totalConnections = 0;
  const conversationIds = [];
  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    conversationIds.push(conversationId);
    totalConnections += responseSet.size;
  });
  return {
    totalConversations: connections.size,
    totalConnections,
    conversations: conversationIds
  };
}
var connections, unsubscribe;
var init_remote_event_emitter = __esm({
  "main/remote-event-emitter.ts"() {
    "use strict";
    init_agent_bridge();
    connections = /* @__PURE__ */ new Map();
    unsubscribe = null;
  }
});

// main/terminal-manager.ts
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path2.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path2.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs2.existsSync(helperPath)) {
      fs2.chmodSync(helperPath, 493);
    }
  } catch {
  }
}
function getShell() {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "cmd.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}
function createTerminal(id, cwd, cols, rows, window) {
  if (sessions.has(id)) {
    destroyTerminal(id);
  }
  const shell5 = getShell();
  const resolvedCwd = path2.resolve(cwd || os.homedir());
  const safeCwd = fs2.existsSync(resolvedCwd) ? resolvedCwd : os.homedir();
  const ptyProcess = pty.spawn(shell5, [], {
    name: "xterm-256color",
    cols,
    rows,
    cwd: safeCwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor"
    }
  });
  ptyProcess.onData((data) => {
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:data", { id, data });
    }
    const session = sessions.get(id);
    if (session) {
      session.outputBuffer += data;
      if (session.outputBuffer.length > OUTPUT_BUFFER_LIMIT) {
        session.outputBuffer = session.outputBuffer.slice(session.outputBuffer.length - OUTPUT_BUFFER_LIMIT);
      }
      for (const cb of session.outputCallbacks) {
        cb(data);
      }
    }
  });
  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:exit", { id });
    }
  });
  sessions.set(id, { id, pty: ptyProcess, outputCallbacks: /* @__PURE__ */ new Set(), outputBuffer: "" });
}
function writeToTerminal(id, data) {
  const session = sessions.get(id);
  if (session) {
    session.pty.write(data);
  }
}
function resizeTerminal(id, cols, rows) {
  const session = sessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
}
function destroyTerminal(id) {
  const session = sessions.get(id);
  if (session) {
    try {
      session.pty.kill();
    } catch {
    }
    sessions.delete(id);
  }
}
function registerTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.add(cb);
}
function unregisterTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.delete(cb);
}
function getTerminalBuffer(id) {
  return sessions.get(id)?.outputBuffer ?? "";
}
var pty, os, path2, fs2, OUTPUT_BUFFER_LIMIT, sessions;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os = __toESM(require("os"), 1);
    path2 = __toESM(require("path"), 1);
    fs2 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
    OUTPUT_BUFFER_LIMIT = 64 * 1024;
    sessions = /* @__PURE__ */ new Map();
  }
});

// main/remote-ws.ts
function authenticateUpgrade(req) {
  const apiKey = req.headers["x-api-key"];
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!apiKey || !timestamp || !signature)
    return false;
  const storedKey = settingsManager.get("remoteAccess.apiKey");
  if (!storedKey)
    return false;
  if (!timingSafeEqual4(apiKey, storedKey))
    return false;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1e3)
    return false;
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathWithQuery = url.pathname + (url.search || "");
  const signingString = `GET
${pathWithQuery}
${timestamp}`;
  const expected = crypto3.createHmac("sha256", storedKey).update(signingString).digest("hex");
  return timingSafeEqual4(signature, expected);
}
function timingSafeEqual4(a, b) {
  if (a.length !== b.length) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.alloc(bufA.length, 0);
    crypto3.timingSafeEqual(bufA, bufB);
    return false;
  }
  return crypto3.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function broadcastAgentEvent(event) {
  const { conversationId, ...eventData } = event;
  const clients = agentClients.get(conversationId);
  if (!clients || clients.size === 0)
    return;
  const payload = JSON.stringify(eventData);
  Array.from(clients).forEach((client) => {
    if (client.ws.readyState === import_ws.WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}
function handleClientMessage(client, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    client.ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
    return;
  }
  if (msg.type === "subscribe") {
    if (msg.channel === "agent" && msg.conversationId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);
      client.agentSubscription = msg.conversationId;
      if (!agentClients.has(msg.conversationId)) {
        agentClients.set(msg.conversationId, /* @__PURE__ */ new Set());
      }
      agentClients.get(msg.conversationId).add(client);
      client.ws.send(JSON.stringify({ type: "subscribed", channel: "agent", conversationId: msg.conversationId }));
      console.log(`[RemoteWS] Client subscribed to agent conversation ${msg.conversationId}`);
    } else if (msg.channel === "terminal" && msg.terminalId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);
      client.terminalSubscription = msg.terminalId;
      const buffered = getTerminalBuffer(msg.terminalId);
      if (buffered.length > 0) {
        client.ws.send(JSON.stringify({ type: "stream_delta", delta: { text: buffered } }));
      }
      const cb = (data) => {
        if (client.ws.readyState === import_ws.WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: "stream_delta", delta: { text: data } }));
        }
      };
      client.terminalCallback = cb;
      registerTerminalCallback(msg.terminalId, cb);
      client.ws.send(JSON.stringify({ type: "subscribed", channel: "terminal", terminalId: msg.terminalId }));
      console.log(`[RemoteWS] Client subscribed to terminal ${msg.terminalId}`);
    }
  } else if (msg.type === "unsubscribe") {
    unsubscribeFromAgent(client);
    unsubscribeFromTerminal(client);
    client.ws.send(JSON.stringify({ type: "unsubscribed" }));
  }
}
function unsubscribeFromAgent(client) {
  if (client.agentSubscription) {
    const set = agentClients.get(client.agentSubscription);
    if (set) {
      set.delete(client);
      if (set.size === 0)
        agentClients.delete(client.agentSubscription);
    }
    client.agentSubscription = void 0;
  }
}
function unsubscribeFromTerminal(client) {
  if (client.terminalSubscription && client.terminalCallback) {
    unregisterTerminalCallback(client.terminalSubscription, client.terminalCallback);
    client.terminalSubscription = void 0;
    client.terminalCallback = void 0;
  }
}
function removeClient(client) {
  unsubscribeFromAgent(client);
  unsubscribeFromTerminal(client);
  allClients.delete(client);
}
function initializeWebSocketServer(httpServer) {
  if (wss)
    return;
  wss = new import_ws.WebSocketServer({
    noServer: true
  });
  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/api/ws") {
      socket.destroy();
      return;
    }
    if (!authenticateUpgrade(req)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      console.log("[RemoteWS] Rejected unauthenticated WebSocket upgrade");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
  wss.on("connection", (ws) => {
    const client = { ws, alive: true };
    allClients.add(client);
    console.log(`[RemoteWS] Client connected (total: ${allClients.size})`);
    ws.on("pong", () => {
      client.alive = true;
    });
    ws.on("message", (data) => {
      handleClientMessage(client, data.toString());
    });
    ws.on("close", () => {
      removeClient(client);
      console.log(`[RemoteWS] Client disconnected (total: ${allClients.size})`);
    });
    ws.on("error", () => {
      removeClient(client);
    });
  });
  pingInterval = setInterval(() => {
    Array.from(allClients).forEach((client) => {
      if (!client.alive) {
        console.log("[RemoteWS] Terminating unresponsive client");
        client.ws.terminate();
        removeClient(client);
        return;
      }
      client.alive = false;
      client.ws.ping();
    });
  }, 25e3);
  unsubscribeAgent = agentBridge.onEvent((event) => {
    broadcastAgentEvent(event);
  });
  console.log("[RemoteWS] WebSocket server initialized");
}
function cleanupWebSocketServer() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (unsubscribeAgent) {
    unsubscribeAgent();
    unsubscribeAgent = null;
  }
  Array.from(allClients).forEach((client) => {
    try {
      client.ws.close(1001, "Server shutting down");
    } catch {
    }
  });
  allClients.clear();
  agentClients.clear();
  if (wss) {
    wss.close();
    wss = null;
  }
  console.log("[RemoteWS] WebSocket server cleaned up");
}
var import_ws, crypto3, wss, unsubscribeAgent, pingInterval, agentClients, allClients;
var init_remote_ws = __esm({
  "main/remote-ws.ts"() {
    "use strict";
    import_ws = require("ws");
    crypto3 = __toESM(require("crypto"), 1);
    init_settings();
    init_agent_bridge();
    init_terminal_manager();
    wss = null;
    unsubscribeAgent = null;
    pingInterval = null;
    agentClients = /* @__PURE__ */ new Map();
    allClients = /* @__PURE__ */ new Set();
  }
});

// src/config/config-schema.ts
var import_zod, ProviderConfigSchema, PermissionModeSchema, MCPServerConfigSchema, HookEntrySchema, OmniCodeConfigSchema;
var init_config_schema = __esm({
  "src/config/config-schema.ts"() {
    "use strict";
    import_zod = require("zod");
    ProviderConfigSchema = import_zod.z.object({
      apiKey: import_zod.z.string().optional(),
      baseUrl: import_zod.z.string().url().optional(),
      organizationId: import_zod.z.string().optional(),
      defaultModel: import_zod.z.string().optional(),
      maxRetries: import_zod.z.number().min(0).max(10).default(3),
      timeout: import_zod.z.number().min(1e3).max(3e5).default(6e4)
    });
    PermissionModeSchema = import_zod.z.enum(["ask", "auto-allow", "deny-all", "plan"]);
    MCPServerConfigSchema = import_zod.z.object({
      command: import_zod.z.string().optional(),
      args: import_zod.z.array(import_zod.z.string()).default([]),
      env: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).default({}),
      transport: import_zod.z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
      url: import_zod.z.string().url().optional()
    });
    HookEntrySchema = import_zod.z.object({
      tool: import_zod.z.string(),
      command: import_zod.z.string()
    });
    OmniCodeConfigSchema = import_zod.z.object({
      defaultProvider: import_zod.z.string().default("anthropic"),
      defaultModel: import_zod.z.string().optional(),
      activeModels: import_zod.z.array(import_zod.z.string()).default([]),
      // enabled model IDs that appear in UI (empty = all models)
      providers: import_zod.z.record(import_zod.z.string(), ProviderConfigSchema).default({}),
      permissionMode: PermissionModeSchema.default("ask"),
      disabledTools: import_zod.z.array(import_zod.z.string()).default([]),
      mcpServers: import_zod.z.record(import_zod.z.string(), MCPServerConfigSchema).default({}),
      hooks: import_zod.z.object({
        preToolCall: import_zod.z.array(HookEntrySchema).default([]),
        postToolCall: import_zod.z.array(HookEntrySchema).default([])
      }).default({ preToolCall: [], postToolCall: [] }),
      systemPromptAppend: import_zod.z.string().optional(),
      sessionPersistence: import_zod.z.boolean().default(true),
      maxContextTokens: import_zod.z.number().default(1e5),
      temperature: import_zod.z.number().min(0).max(2).default(0.7),
      theme: import_zod.z.enum(["dark", "light", "auto"]).default("auto"),
      logLevel: import_zod.z.enum(["debug", "info", "warn", "error"]).default("info"),
      customEndpoints: import_zod.z.record(import_zod.z.string(), import_zod.z.object({
        baseUrl: import_zod.z.string().url(),
        apiKey: import_zod.z.string().optional(),
        models: import_zod.z.array(import_zod.z.string()).default([])
      })).default({}),
      extendedThinking: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        budgetTokens: import_zod.z.number().min(1024).max(128e3).default(1e4)
      }).default({ enabled: false, budgetTokens: 1e4 }),
      autoLintFix: import_zod.z.boolean().default(false),
      changeReview: import_zod.z.object({
        enabled: import_zod.z.boolean().default(true),
        mode: import_zod.z.enum(["all", "dangerous"]).default("all")
      }).default({ enabled: true, mode: "all" }),
      modelRouting: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        simpleModel: import_zod.z.string().optional(),
        complexModel: import_zod.z.string().optional(),
        simpleProvider: import_zod.z.string().optional(),
        complexProvider: import_zod.z.string().optional()
      }).default({ enabled: false }),
      automations: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        rules: import_zod.z.array(import_zod.z.object({
          name: import_zod.z.string(),
          trigger: import_zod.z.object({
            type: import_zod.z.literal("file_change"),
            patterns: import_zod.z.array(import_zod.z.string())
          }),
          action: import_zod.z.object({
            type: import_zod.z.enum(["run_command", "lint", "typecheck", "test", "notify"]),
            command: import_zod.z.string().optional()
          }),
          enabled: import_zod.z.boolean().default(true),
          debounceMs: import_zod.z.number().optional()
        })).default([])
      }).default({ enabled: false, rules: [] }),
      orchestration: import_zod.z.object({
        enabled: import_zod.z.boolean().default(true),
        maxConcurrentAgents: import_zod.z.number().min(1).max(10).default(3),
        maxTotalAgents: import_zod.z.number().min(2).max(12).default(8),
        costBudget: import_zod.z.number().optional(),
        analysisModel: import_zod.z.string().optional(),
        analysisProvider: import_zod.z.string().optional(),
        forceOrchestrate: import_zod.z.boolean().default(false),
        forceSingleAgent: import_zod.z.boolean().default(false),
        agentOverrides: import_zod.z.record(import_zod.z.string(), import_zod.z.object({
          temperature: import_zod.z.number().optional(),
          preferredModel: import_zod.z.string().optional(),
          maxTurns: import_zod.z.number().nullable().optional()
        })).default({})
      }).default({
        enabled: true,
        maxConcurrentAgents: 3,
        maxTotalAgents: 8,
        forceOrchestrate: false,
        forceSingleAgent: false,
        agentOverrides: {}
      })
    });
  }
});

// src/constants.ts
var DEFAULT_MAX_FILE_SIZE_BYTES;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024;
  }
});

// src/config/config-manager.ts
var fs3, path3, os2;
var init_config_manager = __esm({
  "src/config/config-manager.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"), 1);
    path3 = __toESM(require("path"), 1);
    os2 = __toESM(require("os"), 1);
    init_config_schema();
    init_constants();
  }
});

// src/utils/logger.ts
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
  }
});

// src/providers/provider-registry.ts
var init_provider_registry = __esm({
  "src/providers/provider-registry.ts"() {
    "use strict";
    init_logger();
  }
});

// src/providers/base-provider.ts
var init_base_provider = __esm({
  "src/providers/base-provider.ts"() {
    "use strict";
  }
});

// src/providers/model-registry.ts
var init_model_registry = __esm({
  "src/providers/model-registry.ts"() {
    "use strict";
  }
});

// src/providers/tool-call-normalizer.ts
var init_tool_call_normalizer = __esm({
  "src/providers/tool-call-normalizer.ts"() {
    "use strict";
  }
});

// src/providers/anthropic/anthropic-provider.ts
var import_sdk;
var init_anthropic_provider = __esm({
  "src/providers/anthropic/anthropic-provider.ts"() {
    "use strict";
    import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
    init_base_provider();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/core/message-types.ts
var init_message_types = __esm({
  "src/core/message-types.ts"() {
    "use strict";
  }
});

// src/providers/openai/openai-provider.ts
var import_openai;
var init_openai_provider = __esm({
  "src/providers/openai/openai-provider.ts"() {
    "use strict";
    import_openai = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/google/google-provider.ts
var import_generative_ai;
var init_google_provider = __esm({
  "src/providers/google/google-provider.ts"() {
    "use strict";
    import_generative_ai = require("@google/generative-ai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/mistral/mistral-provider.ts
var import_mistralai;
var init_mistral_provider = __esm({
  "src/providers/mistral/mistral-provider.ts"() {
    "use strict";
    import_mistralai = require("@mistralai/mistralai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/groq/groq-provider.ts
var import_groq_sdk;
var init_groq_provider = __esm({
  "src/providers/groq/groq-provider.ts"() {
    "use strict";
    import_groq_sdk = __toESM(require("groq-sdk"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/xai/xai-provider.ts
var import_openai2;
var init_xai_provider = __esm({
  "src/providers/xai/xai-provider.ts"() {
    "use strict";
    import_openai2 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/aws/bedrock-provider.ts
var import_client_bedrock_runtime;
var init_bedrock_provider = __esm({
  "src/providers/aws/bedrock-provider.ts"() {
    "use strict";
    import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
    init_base_provider();
    init_message_types();
    init_model_registry();
  }
});

// src/providers/moonshot/moonshot-provider.ts
var import_openai3;
var init_moonshot_provider = __esm({
  "src/providers/moonshot/moonshot-provider.ts"() {
    "use strict";
    import_openai3 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/openai-compatible/openai-compat-provider.ts
var import_openai4;
var init_openai_compat_provider = __esm({
  "src/providers/openai-compatible/openai-compat-provider.ts"() {
    "use strict";
    import_openai4 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_tool_call_normalizer();
  }
});

// src/tools/tool-registry.ts
var init_tool_registry = __esm({
  "src/tools/tool-registry.ts"() {
    "use strict";
  }
});

// src/tools/tool-types.ts
var init_tool_types = __esm({
  "src/tools/tool-types.ts"() {
    "use strict";
  }
});

// src/tools/builtin/read-file.ts
var fs4, path4;
var init_read_file = __esm({
  "src/tools/builtin/read-file.ts"() {
    "use strict";
    fs4 = __toESM(require("fs/promises"), 1);
    path4 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/utils/large-file-writer.ts
var fs5, fsp, path5, DEFAULT_CONFIG, DEFAULT_CHUNK_SIZE;
var init_large_file_writer = __esm({
  "src/utils/large-file-writer.ts"() {
    "use strict";
    fs5 = __toESM(require("fs"), 1);
    fsp = __toESM(require("fs/promises"), 1);
    path5 = __toESM(require("path"), 1);
    DEFAULT_CONFIG = {
      chunkSize: 4e4,
      encoding: "utf-8",
      verifyContents: true
    };
    DEFAULT_CHUNK_SIZE = DEFAULT_CONFIG.chunkSize;
  }
});

// src/tools/builtin/write-file.ts
var fs6, path6;
var init_write_file = __esm({
  "src/tools/builtin/write-file.ts"() {
    "use strict";
    fs6 = __toESM(require("fs/promises"), 1);
    path6 = __toESM(require("path"), 1);
    init_tool_types();
    init_large_file_writer();
  }
});

// src/tools/builtin/edit-file.ts
var fs7, path7;
var init_edit_file = __esm({
  "src/tools/builtin/edit-file.ts"() {
    "use strict";
    fs7 = __toESM(require("fs/promises"), 1);
    path7 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/glob-search.ts
var import_glob;
var init_glob_search = __esm({
  "src/tools/builtin/glob-search.ts"() {
    "use strict";
    import_glob = require("glob");
    init_tool_types();
  }
});

// src/tools/builtin/grep-search.ts
var import_node_child_process, import_node_util, execFileAsync;
var init_grep_search = __esm({
  "src/tools/builtin/grep-search.ts"() {
    "use strict";
    import_node_child_process = require("child_process");
    import_node_util = require("util");
    init_tool_types();
    execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
  }
});

// src/tools/builtin/bash-exec.ts
var import_node_child_process2, fs8, os3, path8, import_tree_kill;
var init_bash_exec = __esm({
  "src/tools/builtin/bash-exec.ts"() {
    "use strict";
    import_node_child_process2 = require("child_process");
    fs8 = __toESM(require("fs"), 1);
    os3 = __toESM(require("os"), 1);
    path8 = __toESM(require("path"), 1);
    import_tree_kill = __toESM(require("tree-kill"), 1);
    init_tool_types();
    init_logger();
  }
});

// src/memory/persistent-store.ts
var import_better_sqlite3;
var init_persistent_store = __esm({
  "src/memory/persistent-store.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
  }
});

// src/memory/embedding-config.ts
var init_embedding_config = __esm({
  "src/memory/embedding-config.ts"() {
    "use strict";
  }
});

// src/memory/semantic-memory.ts
var import_transformers, hnswlib;
var init_semantic_memory = __esm({
  "src/memory/semantic-memory.ts"() {
    "use strict";
    import_transformers = require("@xenova/transformers");
    hnswlib = __toESM(require("hnswlib-node"), 1);
    init_persistent_store();
    init_embedding_config();
    import_transformers.env.allowLocalModels = true;
    import_transformers.env.allowRemoteModels = true;
  }
});

// src/memory/smart-chunker.ts
var init_smart_chunker = __esm({
  "src/memory/smart-chunker.ts"() {
    "use strict";
  }
});

// src/memory/indexing-config.ts
var DEFAULT_INDEXING_CONFIG;
var init_indexing_config = __esm({
  "src/memory/indexing-config.ts"() {
    "use strict";
    DEFAULT_INDEXING_CONFIG = {
      autoIndex: true,
      autoSync: true,
      syncIntervalMinutes: 5,
      chunkSize: 20,
      useSemanticChunking: true,
      maxChunkSize: 2e3,
      maxFilesToIndex: 500,
      maxFileSizeBytes: 1024 * 1024,
      // 1MB
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        ".next/**",
        ".cache/**",
        "**/*.log",
        "**/Thumbs.db",
        "**/.DS_Store",
        ".omnicode/**",
        "**/*.min.js",
        "**/*.bundle.js",
        "**/package-lock.json",
        "**/yarn.lock",
        "**/pnpm-lock.yaml"
      ],
      embeddingBatchSize: 10,
      indexConcurrency: 4
    };
  }
});

// src/memory/project-indexer.ts
var import_fast_glob, DEFAULT_SYNC_INTERVAL_MS, DEFAULT_INDEXING_CONFIG2;
var init_project_indexer = __esm({
  "src/memory/project-indexer.ts"() {
    "use strict";
    import_fast_glob = __toESM(require("fast-glob"), 1);
    init_semantic_memory();
    init_smart_chunker();
    init_indexing_config();
    DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1e3;
    DEFAULT_INDEXING_CONFIG2 = {
      autoIndex: true,
      autoSync: true,
      syncIntervalMinutes: 5,
      chunkSize: 20,
      useSemanticChunking: true,
      maxChunkSize: 2e3,
      maxFilesToIndex: 500,
      maxFileSizeBytes: 1024 * 1024,
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        ".next/**",
        ".cache/**"
      ],
      embeddingBatchSize: 10,
      indexConcurrency: 4
    };
  }
});

// src/tools/builtin/index-codebase.ts
var init_index_codebase = __esm({
  "src/tools/builtin/index-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
  }
});

// src/git/git-manager.ts
var import_simple_git, GitManager;
var init_git_manager = __esm({
  "src/git/git-manager.ts"() {
    "use strict";
    import_simple_git = __toESM(require("simple-git"), 1);
    GitManager = class {
      git;
      constructor(cwd) {
        this.git = (0, import_simple_git.default)(cwd);
      }
      async isRepo() {
        try {
          await this.git.revparse(["--is-inside-work-tree"]);
          return true;
        } catch {
          return false;
        }
      }
      async status() {
        const status = await this.git.status();
        const lines = [];
        lines.push(`Branch: ${status.current}`);
        if (status.ahead)
          lines.push(`Ahead: ${status.ahead}`);
        if (status.behind)
          lines.push(`Behind: ${status.behind}`);
        if (status.staged.length)
          lines.push(`Staged: ${status.staged.join(", ")}`);
        if (status.modified.length)
          lines.push(`Modified: ${status.modified.join(", ")}`);
        if (status.not_added.length)
          lines.push(`Untracked: ${status.not_added.join(", ")}`);
        if (status.conflicted.length)
          lines.push(`Conflicted: ${status.conflicted.join(", ")}`);
        return lines.join("\n");
      }
      async statusStructured() {
        const status = await this.git.status();
        return {
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          modified: status.modified,
          not_added: status.not_added,
          conflicted: status.conflicted,
          deleted: status.deleted,
          renamed: status.renamed.map((r) => ({ from: r.from, to: r.to })),
          created: status.created
        };
      }
      async diff(staged = false) {
        if (staged) {
          return this.git.diff(["--staged"]);
        }
        return this.git.diff();
      }
      async diffFile(filePath, staged = false) {
        const args = staged ? ["--staged", "--", filePath] : ["--", filePath];
        return this.git.diff(args);
      }
      async log(maxCount = 10, oneline = false, file) {
        const options = { maxCount };
        if (file)
          options.file = file;
        const log = await this.git.log(options);
        if (oneline) {
          return log.all.map((c) => `${c.hash.substring(0, 7)} ${c.message}`).join("\n");
        }
        return log.all.map((c) => `${c.hash.substring(0, 7)} ${c.message} (${c.author_name})`).join("\n");
      }
      async logStructured(maxCount = 20) {
        const log = await this.git.log({ maxCount });
        return log.all.map((c) => ({
          hash: c.hash.substring(0, 7),
          message: c.message,
          author: c.author_name,
          date: c.date
        }));
      }
      async add(files) {
        await this.git.add(files);
      }
      async addAll() {
        await this.git.add(["-A"]);
      }
      async unstage(files) {
        await this.git.reset(["HEAD", "--", ...files]);
      }
      async discardFile(files) {
        await this.git.checkout(["--", ...files]);
      }
      async commit(message) {
        const result = await this.git.commit(message);
        return result.commit;
      }
      async currentBranch() {
        const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
        return branch.trim();
      }
      async createBranch(name) {
        await this.git.checkoutLocalBranch(name);
      }
      async push(remote = "origin", branch) {
        const currentBranch = branch || await this.currentBranch();
        await this.git.push(remote, currentBranch, ["--set-upstream"]);
      }
      async pull(remote = "origin", branch) {
        const currentBranch = branch || await this.currentBranch();
        await this.git.pull(remote, currentBranch);
      }
      async fetch(remote = "origin") {
        await this.git.fetch(remote);
      }
      async diffRange(range) {
        return this.git.diff([range]);
      }
      async listBranches() {
        const result = await this.git.branchLocal();
        return result.all;
      }
      async switchBranch(name) {
        await this.git.checkout(name);
      }
      async deleteBranch(name) {
        await this.git.deleteLocalBranch(name);
      }
      async stash(action, message, index = 0) {
        switch (action) {
          case "push": {
            const args = message ? ["push", "-m", message] : ["push"];
            return this.git.stash(args);
          }
          case "pop":
            return this.git.stash(["pop", `stash@{${index}}`]);
          case "apply":
            return this.git.stash(["apply", `stash@{${index}}`]);
          case "drop":
            return this.git.stash(["drop", `stash@{${index}}`]);
          case "list":
            return this.git.stash(["list"]);
          default:
            throw new Error(`Unknown stash action: ${action}`);
        }
      }
      async init() {
        await this.git.init();
      }
    };
  }
});

// src/tools/builtin/preview-diff.ts
var import_simple_git2;
var init_preview_diff = __esm({
  "src/tools/builtin/preview-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    import_simple_git2 = __toESM(require("simple-git"), 1);
  }
});

// src/tools/builtin/run-tests.ts
var fs9, path9, import_node_child_process3;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs9 = __toESM(require("fs/promises"), 1);
    path9 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/file-tree.ts
var fs10, path10;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/lint-fix.ts
var fs11, path11, import_node_child_process4;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
    import_node_child_process4 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/search-web.ts
var init_search_web = __esm({
  "src/tools/builtin/search-web.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/web-fetch.ts
var init_web_fetch = __esm({
  "src/tools/builtin/web-fetch.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/type-check.ts
var fs12, path12, import_node_child_process5;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
    import_node_child_process5 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/http-client.ts
var init_http_client = __esm({
  "src/tools/builtin/http-client.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/symbol-rename.ts
var fs13, path13, import_fast_glob2;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/multi-file-edit.ts
var fs14, path14;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/dependency-manager.ts
var fs15, path15, import_node_child_process6;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/scaffold.ts
var fs16, path16;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/database-query.ts
var fs17, path17, import_better_sqlite32;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
    import_better_sqlite32 = __toESM(require("better-sqlite3"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/sub-agent.ts
var import_p_queue;
var init_sub_agent = __esm({
  "src/tools/builtin/sub-agent.ts"() {
    "use strict";
    import_p_queue = __toESM(require("p-queue"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/checkpoint.ts
var import_simple_git3;
var init_checkpoint = __esm({
  "src/tools/builtin/checkpoint.ts"() {
    "use strict";
    import_simple_git3 = __toESM(require("simple-git"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/test-gen.ts
var fs18, path18;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/query-codebase.ts
var init_query_codebase = __esm({
  "src/tools/builtin/query-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
  }
});

// src/tools/builtin/repo-map.ts
var fs19, path19, import_fast_glob3;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/self-analyze.ts
var fs20, path20;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/git-commit.ts
var init_git_commit = __esm({
  "src/tools/builtin/git-commit.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-diff.ts
var init_git_diff = __esm({
  "src/tools/builtin/git-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-log.ts
var init_git_log = __esm({
  "src/tools/builtin/git-log.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-branch.ts
var init_git_branch = __esm({
  "src/tools/builtin/git-branch.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-stash.ts
var init_git_stash = __esm({
  "src/tools/builtin/git-stash.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/unified-diff-edit.ts
var fs21, path21;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    path21 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/background-agent.ts
var TASK_TTL_MS;
var init_background_agent = __esm({
  "src/tools/builtin/background-agent.ts"() {
    "use strict";
    init_tool_types();
    TASK_TTL_MS = 10 * 60 * 1e3;
  }
});

// src/tools/builtin/code-review.ts
var init_code_review = __esm({
  "src/tools/builtin/code-review.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/browser-automation.ts
var init_browser_automation = __esm({
  "src/tools/builtin/browser-automation.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/open-browser.ts
var init_open_browser = __esm({
  "src/tools/builtin/open-browser.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/browser-control.ts
var init_browser_control = __esm({
  "src/tools/builtin/browser-control.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/debugger.ts
var inspector;
var init_debugger = __esm({
  "src/tools/builtin/debugger.ts"() {
    "use strict";
    init_tool_types();
    inspector = __toESM(require("inspector"), 1);
  }
});

// src/tools/builtin/doc-gen.ts
var fs22, path22;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs22 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/notebook.ts
var fs23, vm;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    vm = __toESM(require("vm"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/platform-cli-manager.ts
var import_node_child_process7, import_tree_kill2;
var init_platform_cli_manager = __esm({
  "src/tools/builtin/platform-cli-manager.ts"() {
    "use strict";
    import_node_child_process7 = require("child_process");
    import_tree_kill2 = __toESM(require("tree-kill"), 1);
  }
});

// src/tools/builtin/supabase-cli.ts
var import_node_child_process8;
var init_supabase_cli = __esm({
  "src/tools/builtin/supabase-cli.ts"() {
    "use strict";
    import_node_child_process8 = require("child_process");
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/netlify-cli.ts
var init_netlify_cli = __esm({
  "src/tools/builtin/netlify-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/railway-cli.ts
var init_railway_cli = __esm({
  "src/tools/builtin/railway-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/ask-user.ts
var init_ask_user = __esm({
  "src/tools/builtin/ask-user.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/process-manager.ts
var import_node_child_process9, fs24, os4, path23, import_tree_kill3;
var init_process_manager = __esm({
  "src/tools/builtin/process-manager.ts"() {
    "use strict";
    import_node_child_process9 = require("child_process");
    fs24 = __toESM(require("fs"), 1);
    os4 = __toESM(require("os"), 1);
    path23 = __toESM(require("path"), 1);
    import_tree_kill3 = __toESM(require("tree-kill"), 1);
    init_tool_types();
    init_logger();
  }
});

// src/tools/builtin/create-plan.ts
var fs25, path24;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path24 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/update-plan.ts
var fs26, path25;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs26 = __toESM(require("fs/promises"), 1);
    path25 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/read-plan.ts
var fs27, path26;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path26 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/index.ts
var init_builtin = __esm({
  "src/tools/builtin/index.ts"() {
    "use strict";
    init_read_file();
    init_write_file();
    init_edit_file();
    init_glob_search();
    init_grep_search();
    init_bash_exec();
    init_index_codebase();
    init_preview_diff();
    init_run_tests();
    init_file_tree();
    init_lint_fix();
    init_search_web();
    init_web_fetch();
    init_type_check();
    init_http_client();
    init_symbol_rename();
    init_multi_file_edit();
    init_dependency_manager();
    init_scaffold();
    init_database_query();
    init_sub_agent();
    init_checkpoint();
    init_test_gen();
    init_query_codebase();
    init_repo_map();
    init_self_analyze();
    init_git_commit();
    init_git_diff();
    init_git_log();
    init_git_branch();
    init_git_stash();
    init_unified_diff_edit();
    init_background_agent();
    init_code_review();
    init_browser_automation();
    init_open_browser();
    init_browser_control();
    init_debugger();
    init_doc_gen();
    init_notebook();
    init_supabase_cli();
    init_netlify_cli();
    init_railway_cli();
    init_ask_user();
    init_process_manager();
    init_create_plan();
    init_update_plan();
    init_read_plan();
  }
});

// src/permissions/permission-manager.ts
var init_permission_manager = __esm({
  "src/permissions/permission-manager.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/tool-runner.ts
var path27;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path27 = __toESM(require("path"), 1);
  }
});

// src/core/agent.ts
var init_agent = __esm({
  "src/core/agent.ts"() {
    "use strict";
    init_message_types();
    init_constants();
  }
});

// src/core/cost-tracker.ts
var init_cost_tracker = __esm({
  "src/core/cost-tracker.ts"() {
    "use strict";
    init_model_registry();
  }
});

// src/utils/event-bus.ts
var init_event_bus = __esm({
  "src/utils/event-bus.ts"() {
    "use strict";
  }
});

// main/remote-client.ts
var http, https, import_node_crypto2, import_node_url, RemoteClient;
var init_remote_client = __esm({
  "main/remote-client.ts"() {
    "use strict";
    http = __toESM(require("http"), 1);
    https = __toESM(require("https"), 1);
    import_node_crypto2 = require("crypto");
    import_node_url = require("url");
    RemoteClient = class {
      baseUrl;
      apiKey;
      agentSseController = null;
      terminalSseControllers = /* @__PURE__ */ new Map();
      constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.apiKey = config.apiKey;
      }
      // -------------------------------------------------------------------------
      // Auth helpers
      // -------------------------------------------------------------------------
      buildAuthHeaders(method, path39) {
        const timestamp = Date.now().toString();
        const signingString = `${method.toUpperCase()}
${path39}
${timestamp}`;
        const signature = (0, import_node_crypto2.createHmac)("sha256", this.apiKey).update(signingString).digest("hex");
        return {
          "X-API-Key": this.apiKey,
          "X-Timestamp": timestamp,
          "X-Signature": signature,
          "Content-Type": "application/json"
        };
      }
      buildUrl(path39, params) {
        const url = new import_node_url.URL(path39, this.baseUrl + "/");
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
          }
        }
        return url.toString();
      }
      pathWithQuery(path39, params) {
        if (!params || Object.keys(params).length === 0)
          return path39;
        const sp = new URLSearchParams(params);
        return `${path39}?${sp.toString()}`;
      }
      // -------------------------------------------------------------------------
      // Low-level HTTP fetch
      // -------------------------------------------------------------------------
      async request(method, path39, body, queryParams) {
        const fullPath = this.pathWithQuery(path39, queryParams);
        const headers = this.buildAuthHeaders(method, fullPath);
        const url = this.buildUrl(path39, queryParams);
        const bodyStr = body !== void 0 ? JSON.stringify(body) : void 0;
        if (bodyStr) {
          headers["Content-Length"] = Buffer.byteLength(bodyStr).toString();
        }
        return new Promise((resolve11, reject) => {
          const parsed = new import_node_url.URL(url);
          const options = {
            method,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: parsed.pathname + parsed.search,
            headers
          };
          const transport = parsed.protocol === "https:" ? https : http;
          const req = transport.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              const raw = Buffer.concat(chunks).toString("utf-8");
              if (res.statusCode && res.statusCode >= 400) {
                let message = `HTTP ${res.statusCode}`;
                try {
                  const parsed2 = JSON.parse(raw);
                  message = parsed2.error || parsed2.message || message;
                } catch {
                }
                reject(new Error(message));
                return;
              }
              try {
                resolve11(JSON.parse(raw));
              } catch {
                resolve11(raw);
              }
            });
          });
          req.on("error", reject);
          if (bodyStr)
            req.write(bodyStr);
          req.end();
        });
      }
      // -------------------------------------------------------------------------
      // Connection testing
      // -------------------------------------------------------------------------
      async testConnection() {
        try {
          const statusUrl = `${this.baseUrl}/api/status`;
          await new Promise((resolve11, reject) => {
            const parsed = new import_node_url.URL(statusUrl);
            const transport = parsed.protocol === "https:" ? https : http;
            const req = transport.request(
              { method: "GET", hostname: parsed.hostname, port: parsed.port || (parsed.protocol === "https:" ? 443 : 80), path: parsed.pathname },
              (res) => {
                res.resume();
                if (res.statusCode === 200)
                  resolve11();
                else
                  reject(new Error(`Status endpoint returned ${res.statusCode}`));
              }
            );
            req.on("error", reject);
            req.setTimeout(8e3, () => {
              req.destroy();
              reject(new Error("Connection timed out"));
            });
            req.end();
          });
          const config = await this.request("GET", "/api/config");
          return {
            success: true,
            info: {
              workspacePath: config.workspacePath,
              version: config.version
            }
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // -------------------------------------------------------------------------
      // Agent operations
      // -------------------------------------------------------------------------
      async createConversation(conversationId, model, provider) {
        const result = await this.request("POST", "/api/agent/create-conversation", {
          conversationId,
          model,
          provider
        });
        return result.success ?? false;
      }
      async sendMessage(conversationId, message, workingDirectory, fileReferences, images) {
        await this.request("POST", "/api/agent/send-message", {
          conversationId,
          message,
          workingDirectory,
          fileReferences,
          images
        });
      }
      async abort(conversationId) {
        await this.request("POST", "/api/agent/abort", { conversationId });
      }
      async closeConversation(conversationId) {
        const result = await this.request("POST", "/api/agent/close-conversation", { conversationId });
        return result.success ?? false;
      }
      async hasConversation(conversationId) {
        const result = await this.request("GET", "/api/agent/conversations", void 0, {
          conversationId
        });
        return result.exists ?? false;
      }
      async switchModel(conversationId, model, provider) {
        const result = await this.request("POST", "/api/agent/switch-model", {
          conversationId,
          model,
          provider
        });
        return result.success ?? false;
      }
      async setMode(conversationId, mode) {
        return this.request("POST", "/api/agent/set-mode", {
          conversationId,
          mode
        });
      }
      async respondPermission(toolId, decision) {
        const result = await this.request("POST", "/api/agent/respond-permission", {
          toolId,
          decision
        });
        return result.success ?? false;
      }
      async respondUserInput(requestId, response, cancelled) {
        const result = await this.request("POST", "/api/agent/respond-user-input", {
          requestId,
          response,
          cancelled
        });
        return result.success ?? false;
      }
      async clearConversation(conversationId) {
        await this.request("POST", "/api/agent/close-conversation", { conversationId });
      }
      async getTokenCount(conversationId) {
        const result = await this.request("GET", "/api/agent/conversations", void 0, {
          conversationId
        });
        return result.count ?? 0;
      }
      async restoreHistory(conversationId, messages) {
        const result = await this.request("POST", "/api/agent/create-conversation", {
          conversationId,
          messages
        });
        return result.success ?? false;
      }
      async getModels() {
        const result = await this.request("GET", "/api/models");
        return result.models ?? [];
      }
      async getWorkspaces() {
        const result = await this.request("GET", "/api/workspaces");
        return result.workspaces ?? [];
      }
      // -------------------------------------------------------------------------
      // File operations
      // -------------------------------------------------------------------------
      async readFile(filePath) {
        try {
          const result = await this.request("GET", "/api/files/read", void 0, {
            path: filePath
          });
          return { content: result.content ?? "" };
        } catch (err) {
          return { content: "", error: err.message };
        }
      }
      async writeFile(filePath, content) {
        try {
          const result = await this.request("POST", "/api/files/write", {
            path: filePath,
            content
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async editFile(filePath, oldString, newString) {
        try {
          const result = await this.request("POST", "/api/files/edit", {
            path: filePath,
            oldString,
            newString
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async listFiles(dirPath) {
        try {
          const result = await this.request("GET", "/api/files/list", void 0, {
            path: dirPath
          });
          return { files: result.files ?? [] };
        } catch (err) {
          return { files: [], error: err.message };
        }
      }
      async mkdir(dirPath) {
        try {
          const result = await this.request("POST", "/api/files/mkdir", { path: dirPath });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async deleteFile(filePath) {
        try {
          const result = await this.request("POST", "/api/files/delete", { path: filePath });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async searchContent(projectPath, searchTerm) {
        try {
          const result = await this.request(
            "GET",
            "/api/files/search",
            void 0,
            { path: projectPath, query: searchTerm }
          );
          return { results: result.results ?? [] };
        } catch (err) {
          return { results: [], error: err.message };
        }
      }
      // -------------------------------------------------------------------------
      // Terminal operations
      // -------------------------------------------------------------------------
      async createTerminal(id, cwd, cols, rows) {
        try {
          const result = await this.request("POST", "/api/terminal/create", {
            id,
            cwd,
            cols,
            rows
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async writeTerminal(id, data) {
        await this.request("POST", "/api/terminal/write", { id, data });
      }
      async resizeTerminal(id, cols, rows) {
        await this.request("POST", "/api/terminal/resize", { id, cols, rows });
      }
      async destroyTerminal(id) {
        await this.request("POST", "/api/terminal/destroy", { id });
      }
      // -------------------------------------------------------------------------
      // SSE: Agent events
      // -------------------------------------------------------------------------
      subscribeAgentEvents(onEvent, conversationId) {
        if (this.agentSseController) {
          this.agentSseController.abort();
        }
        this.agentSseController = new AbortController();
        const { signal } = this.agentSseController;
        const queryParams = {};
        if (conversationId)
          queryParams.conversationId = conversationId;
        const fullPath = this.pathWithQuery("/api/agent/events", Object.keys(queryParams).length ? queryParams : void 0);
        const headers = this.buildAuthHeaders("GET", fullPath);
        headers["Accept"] = "text/event-stream";
        const url = this.buildUrl("/api/agent/events", Object.keys(queryParams).length ? queryParams : void 0);
        this.openSseStream(url, headers, signal, (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.type === "string") {
              onEvent(parsed);
            }
          } catch {
          }
        });
      }
      unsubscribeAgentEvents() {
        if (this.agentSseController) {
          this.agentSseController.abort();
          this.agentSseController = null;
        }
      }
      // -------------------------------------------------------------------------
      // SSE: Terminal stream
      // -------------------------------------------------------------------------
      subscribeTerminalStream(id, onData, onExit) {
        if (this.terminalSseControllers.has(id)) {
          this.terminalSseControllers.get(id).abort();
        }
        const controller = new AbortController();
        this.terminalSseControllers.set(id, controller);
        const { signal } = controller;
        const path39 = `/api/terminal/stream/${encodeURIComponent(id)}`;
        const headers = this.buildAuthHeaders("GET", path39);
        headers["Accept"] = "text/event-stream";
        const url = this.buildUrl(path39);
        this.openSseStream(url, headers, signal, (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "data" && typeof parsed.data === "string") {
              onData(id, parsed.data);
            } else if (parsed.type === "exit") {
              onExit(id);
              this.terminalSseControllers.delete(id);
            }
          } catch {
            if (data)
              onData(id, data);
          }
        });
      }
      unsubscribeTerminalStream(id) {
        const controller = this.terminalSseControllers.get(id);
        if (controller) {
          controller.abort();
          this.terminalSseControllers.delete(id);
        }
      }
      // -------------------------------------------------------------------------
      // Teardown
      // -------------------------------------------------------------------------
      destroy() {
        this.unsubscribeAgentEvents();
        for (const id of this.terminalSseControllers.keys()) {
          this.unsubscribeTerminalStream(id);
        }
      }
      // -------------------------------------------------------------------------
      // Internal SSE reader
      // -------------------------------------------------------------------------
      openSseStream(url, headers, signal, onLine) {
        const parsed = new import_node_url.URL(url);
        const transport = parsed.protocol === "https:" ? https : http;
        const options = {
          method: "GET",
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers
        };
        const connect = () => {
          if (signal.aborted)
            return;
          const req = transport.request(options, (res) => {
            if (signal.aborted) {
              res.destroy();
              return;
            }
            let buffer = "";
            let currentData = "";
            res.setEncoding("utf-8");
            res.on("data", (chunk) => {
              if (signal.aborted)
                return;
              buffer += chunk;
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  currentData = line.slice(6);
                } else if (line === "" && currentData) {
                  if (currentData !== ":keepalive") {
                    onLine(currentData);
                  }
                  currentData = "";
                } else if (line.startsWith(":")) {
                  currentData = "";
                }
              }
            });
            res.on("end", () => {
              if (!signal.aborted) {
                setTimeout(connect, 3e3);
              }
            });
            res.on("error", () => {
              if (!signal.aborted) {
                setTimeout(connect, 5e3);
              }
            });
          });
          req.on("error", () => {
            if (!signal.aborted) {
              setTimeout(connect, 5e3);
            }
          });
          signal.addEventListener("abort", () => req.destroy());
          req.end();
        };
        connect();
      }
    };
  }
});

// main/remote-client-mode.ts
var import_electron4, RemoteClientMode, remoteClientMode;
var init_remote_client_mode = __esm({
  "main/remote-client-mode.ts"() {
    "use strict";
    import_electron4 = require("electron");
    init_remote_client();
    RemoteClientMode = class {
      client = null;
      connected = false;
      url = null;
      serverInfo = null;
      lastError = null;
      // -------------------------------------------------------------------------
      // Connection lifecycle
      // -------------------------------------------------------------------------
      async connect(url, apiKey) {
        await this.disconnect();
        try {
          const candidate = new RemoteClient({ baseUrl: url, apiKey });
          const test = await candidate.testConnection();
          if (!test.success) {
            return { success: false, error: test.error ?? "Connection failed" };
          }
          this.client = candidate;
          this.connected = true;
          this.url = url;
          this.serverInfo = test.info ?? null;
          this.lastError = null;
          this.client.subscribeAgentEvents((event) => {
            this.broadcastToRenderers("agent:event", event);
          });
          console.log("[RemoteClientMode] Connected to remote server:", url);
          this.broadcastToRenderers("remote-client:status-changed", this.getStatus());
          return { success: true, serverInfo: test.info };
        } catch (err) {
          const message = err.message;
          this.lastError = message;
          console.error("[RemoteClientMode] Connection failed:", message);
          return { success: false, error: message };
        }
      }
      async disconnect() {
        if (this.client) {
          this.client.destroy();
          this.client = null;
        }
        const wasConnected = this.connected;
        this.connected = false;
        this.url = null;
        this.serverInfo = null;
        this.lastError = null;
        if (wasConnected) {
          console.log("[RemoteClientMode] Disconnected from remote server");
          this.broadcastToRenderers("remote-client:status-changed", this.getStatus());
        }
      }
      // -------------------------------------------------------------------------
      // Introspection
      // -------------------------------------------------------------------------
      isActive() {
        return this.connected && this.client !== null;
      }
      getClient() {
        return this.client;
      }
      getStatus() {
        return {
          connected: this.connected,
          url: this.url,
          serverInfo: this.serverInfo,
          error: this.lastError
        };
      }
      // -------------------------------------------------------------------------
      // Terminal stream bridging
      // -------------------------------------------------------------------------
      /**
       * Subscribe to a remote terminal stream and forward data to the renderer.
       * Call this after createTerminal() to start receiving output.
       */
      subscribeTerminalStream(id) {
        if (!this.client)
          return;
        this.client.subscribeTerminalStream(
          id,
          (terminalId, data) => {
            this.broadcastToRenderers("terminal:data", { id: terminalId, data });
          },
          (terminalId) => {
            this.broadcastToRenderers("terminal:exit", { id: terminalId });
          }
        );
      }
      unsubscribeTerminalStream(id) {
        this.client?.unsubscribeTerminalStream(id);
      }
      // -------------------------------------------------------------------------
      // IPC broadcast helper
      // -------------------------------------------------------------------------
      broadcastToRenderers(channel, payload) {
        const windows = import_electron4.BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send(channel, payload);
          }
        }
      }
    };
    remoteClientMode = new RemoteClientMode();
  }
});

// main/plan-file-manager.ts
var fs28, fsSync, path28, import_node_crypto3, import_electron5;
var init_plan_file_manager = __esm({
  "main/plan-file-manager.ts"() {
    "use strict";
    fs28 = __toESM(require("fs/promises"), 1);
    fsSync = __toESM(require("fs"), 1);
    path28 = __toESM(require("path"), 1);
    import_node_crypto3 = require("crypto");
    import_electron5 = require("electron");
  }
});

// src/types/workspace.ts
function createWorkspace(options) {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path39, index) => ({
      id: `folder-${index}-${now}`,
      path: path39
    })),
    settings: options.settings || {},
    createdAt: now,
    updatedAt: now
  };
}
function generateWorkspaceId() {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
var WORKSPACE_VERSION, WORKSPACE_FILE_EXTENSION;
var init_workspace = __esm({
  "src/types/workspace.ts"() {
    "use strict";
    WORKSPACE_VERSION = "1.0.0";
    WORKSPACE_FILE_EXTENSION = ".omnicode-workspace";
  }
});

// main/workspace-storage.ts
var fs29, path29, import_electron6, WORKSPACES_DIR, WORKSPACE_METADATA_FILE, WorkspaceStorage;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs29 = __toESM(require("fs/promises"), 1);
    path29 = __toESM(require("path"), 1);
    import_electron6 = require("electron");
    init_workspace();
    WORKSPACES_DIR = "workspaces";
    WORKSPACE_METADATA_FILE = "metadata.json";
    WorkspaceStorage = class {
      workspacesDir = null;
      /**
       * Get the workspaces directory in app data
       */
      async getWorkspacesDir() {
        if (this.workspacesDir)
          return this.workspacesDir;
        const userData = import_electron6.app.getPath("userData");
        this.workspacesDir = path29.join(userData, WORKSPACES_DIR);
        await fs29.mkdir(this.workspacesDir, { recursive: true });
        return this.workspacesDir;
      }
      /**
       * Get the storage path for a specific workspace's app data
       */
      async getWorkspaceStoragePath(workspaceId) {
        console.log("[WorkspaceStorage] getWorkspaceStoragePath called for workspaceId:", workspaceId);
        try {
          const workspacesDir = await this.getWorkspacesDir();
          console.log("[WorkspaceStorage] Workspaces directory resolved:", workspacesDir);
          const storagePath = path29.join(workspacesDir, workspaceId);
          console.log("[WorkspaceStorage] Creating storage directory:", storagePath);
          await fs29.mkdir(storagePath, { recursive: true });
          console.log("[WorkspaceStorage] Storage directory created/verified:", storagePath);
          return storagePath;
        } catch (error) {
          console.error("[WorkspaceStorage] getWorkspaceStoragePath FAILED:", {
            workspaceId,
            error: error.message,
            stack: error.stack
          });
          throw error;
        }
      }
      /**
       * Get the metadata file path
       */
      async getMetadataPath() {
        const workspacesDir = await this.getWorkspacesDir();
        return path29.join(workspacesDir, WORKSPACE_METADATA_FILE);
      }
      /**
       * Load all workspace metadata
       */
      async loadMetadata() {
        console.log("[WorkspaceStorage] loadMetadata called");
        try {
          const metadataPath = await this.getMetadataPath();
          console.log("[WorkspaceStorage] Loading metadata from:", metadataPath);
          const content = await fs29.readFile(metadataPath, "utf-8");
          console.log("[WorkspaceStorage] Metadata file read, size:", content.length, "bytes");
          const data = JSON.parse(content);
          const map = new Map(Object.entries(data));
          console.log("[WorkspaceStorage] Metadata parsed successfully, entries:", map.size);
          return map;
        } catch (error) {
          if (error.code === "ENOENT") {
            console.log("[WorkspaceStorage] No metadata file exists yet, returning empty map");
          } else {
            console.error("[WorkspaceStorage] Error loading metadata:", {
              error: error.message,
              code: error.code
            });
          }
          return /* @__PURE__ */ new Map();
        }
      }
      /**
       * Save workspace metadata
       */
      async saveMetadata(metadata) {
        console.log("[WorkspaceStorage] saveMetadata called with", metadata.size, "workspaces");
        try {
          const metadataPath = await this.getMetadataPath();
          console.log("[WorkspaceStorage] Metadata file path:", metadataPath);
          const data = Object.fromEntries(metadata);
          const jsonData = JSON.stringify(data, null, 2);
          console.log("[WorkspaceStorage] Writing metadata JSON, size:", jsonData.length, "bytes");
          await fs29.writeFile(metadataPath, jsonData, "utf-8");
          console.log("[WorkspaceStorage] Metadata saved successfully to:", metadataPath);
        } catch (error) {
          console.error("[WorkspaceStorage] saveMetadata FAILED:", {
            error: error.message,
            stack: error.stack,
            metadataSize: metadata.size
          });
          throw error;
        }
      }
      /**
       * Create a new workspace
       */
      async createWorkspace(options) {
        console.log("[WorkspaceStorage] createWorkspace started:", {
          name: options.name,
          folderCount: options.folders?.length || 0,
          folders: options.folders
        });
        try {
          console.log("[WorkspaceStorage] Creating workspace object...");
          const workspace = createWorkspace(options);
          console.log("[WorkspaceStorage] Workspace object created:", {
            id: workspace.id,
            name: workspace.name,
            version: workspace.version,
            folderCount: workspace.folders.length
          });
          console.log("[WorkspaceStorage] Getting workspace storage path for ID:", workspace.id);
          const storagePath = await this.getWorkspaceStoragePath(workspace.id);
          console.log("[WorkspaceStorage] Storage path created:", storagePath);
          console.log("[WorkspaceStorage] Loading existing metadata...");
          const metadata = await this.loadMetadata();
          console.log("[WorkspaceStorage] Metadata loaded, existing workspaces:", metadata.size);
          const metadataEntry = {
            id: workspace.id,
            lastOpenedAt: Date.now()
          };
          console.log("[WorkspaceStorage] Adding workspace to metadata:", metadataEntry);
          metadata.set(workspace.id, metadataEntry);
          console.log("[WorkspaceStorage] Saving metadata...");
          await this.saveMetadata(metadata);
          console.log("[WorkspaceStorage] Metadata saved successfully");
          console.log("[WorkspaceStorage] createWorkspace completed successfully:", {
            workspaceId: workspace.id,
            name: workspace.name
          });
          return { success: true, workspace };
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[WorkspaceStorage] Failed to create workspace:", {
            error: errorMessage,
            stack: errorStack,
            options: {
              name: options.name,
              folders: options.folders
            }
          });
          return { success: false, error: errorMessage };
        }
      }
      /**
       * Save a workspace to a file
       */
      async saveWorkspaceToFile(workspace, filePath) {
        try {
          let targetPath = filePath;
          if (!targetPath.endsWith(WORKSPACE_FILE_EXTENSION)) {
            targetPath = `${targetPath}${WORKSPACE_FILE_EXTENSION}`;
          }
          const updatedWorkspace = {
            ...workspace,
            updatedAt: Date.now()
          };
          const tempPath = `${targetPath}.tmp`;
          await fs29.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
          await fs29.rename(tempPath, targetPath);
          const metadata = await this.loadMetadata();
          const existing = metadata.get(workspace.id) || { id: workspace.id };
          metadata.set(workspace.id, {
            ...existing,
            filePath: targetPath
          });
          await this.saveMetadata(metadata);
          return { success: true, workspace: updatedWorkspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to save workspace to file:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load a workspace from a file
       */
      async loadWorkspaceFromFile(filePath) {
        try {
          const content = await fs29.readFile(filePath, "utf-8");
          const workspace = JSON.parse(content);
          if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
            return { success: false, error: "Invalid workspace file format" };
          }
          const baseDir = path29.dirname(filePath);
          workspace.folders = workspace.folders.map((folder) => ({
            ...folder,
            path: path29.isAbsolute(folder.path) ? folder.path : path29.resolve(baseDir, folder.path)
          }));
          const metadata = await this.loadMetadata();
          const existing = metadata.get(workspace.id) || { id: workspace.id };
          metadata.set(workspace.id, {
            ...existing,
            filePath,
            lastOpenedAt: Date.now()
          });
          await this.saveMetadata(metadata);
          await this.getWorkspaceStoragePath(workspace.id);
          return { success: true, workspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to load workspace from file:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load a workspace by ID (from app data storage)
       */
      async loadWorkspaceById(workspaceId) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          if (meta.filePath) {
            return this.loadWorkspaceFromFile(meta.filePath);
          }
          return { success: false, error: "Workspace has no saved file" };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to load workspace by ID:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Update an existing workspace
       */
      async updateWorkspace(workspace) {
        try {
          const updatedWorkspace = {
            ...workspace,
            updatedAt: Date.now()
          };
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspace.id);
          if (meta?.filePath) {
            const tempPath = `${meta.filePath}.tmp`;
            await fs29.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
            await fs29.rename(tempPath, meta.filePath);
          }
          metadata.set(workspace.id, {
            ...meta,
            id: workspace.id,
            lastOpenedAt: Date.now()
          });
          await this.saveMetadata(metadata);
          return { success: true, workspace: updatedWorkspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to update workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * List all saved workspaces
       */
      async listWorkspaces() {
        try {
          const metadata = await this.loadMetadata();
          const workspaces = [];
          for (const [id, meta] of metadata) {
            try {
              let workspace;
              if (meta.filePath) {
                const result = await this.loadWorkspaceFromFile(meta.filePath);
                if (result.success && result.workspace) {
                  workspace = result.workspace;
                }
              }
              workspaces.push({
                id,
                name: workspace?.name || "Unknown",
                folderCount: workspace?.folders?.length || 0,
                filePath: meta.filePath,
                lastOpenedAt: meta.lastOpenedAt
              });
            } catch (error) {
              console.warn(`[WorkspaceStorage] Failed to load workspace ${id}:`, error);
              workspaces.push({
                id,
                name: "Unknown",
                folderCount: 0,
                filePath: meta.filePath,
                lastOpenedAt: meta.lastOpenedAt
              });
            }
          }
          workspaces.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
          return { workspaces };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to list workspaces:", error);
          return { workspaces: [], error: error.message };
        }
      }
      /**
       * Delete a workspace
       */
      async deleteWorkspace(workspaceId, deleteData = false) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          if (meta.filePath) {
            try {
              await fs29.unlink(meta.filePath);
            } catch {
            }
          }
          if (deleteData) {
            const storagePath = await this.getWorkspaceStoragePath(workspaceId);
            try {
              await fs29.rm(storagePath, { recursive: true, force: true });
            } catch {
            }
          }
          metadata.delete(workspaceId);
          await this.saveMetadata(metadata);
          return { success: true };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to delete workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Export a workspace with its data (chats, index, etc.)
       */
      async exportWorkspace(workspaceId, targetDir) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return { success: false, error: result.error || "Failed to load workspace" };
          }
          const workspace = result.workspace;
          const exportDir = path29.join(targetDir, `${workspace.name}-workspace`);
          await fs29.mkdir(exportDir, { recursive: true });
          const exportWorkspace = {
            ...workspace,
            folders: workspace.folders.map((f) => ({
              ...f,
              path: path29.relative(exportDir, f.path)
            }))
          };
          const workspaceFilePath = path29.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
          await fs29.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), "utf-8");
          const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
          const targetStoragePath = path29.join(exportDir, "workspace-data");
          try {
            await fs29.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
          } catch {
          }
          metadata.set(workspaceId, {
            ...meta,
            isExported: true
          });
          await this.saveMetadata(metadata);
          return { success: true, filePath: workspaceFilePath };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to export workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Import a workspace from an exported directory
       */
      async importWorkspace(sourceDir) {
        try {
          const entries = await fs29.readdir(sourceDir, { withFileTypes: true });
          const workspaceFile = entries.find(
            (e) => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
          );
          if (!workspaceFile) {
            return { success: false, error: "No workspace file found in source directory" };
          }
          const workspaceFilePath = path29.join(sourceDir, workspaceFile.name);
          const result = await this.loadWorkspaceFromFile(workspaceFilePath);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const sourceDataPath = path29.join(sourceDir, "workspace-data");
          try {
            await fs29.access(sourceDataPath);
            const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
            await fs29.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
          } catch {
          }
          return { success: true, workspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to import workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Add a folder to a workspace
       */
      async addFolderToWorkspace(workspaceId, folderPath, folderName) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const exists = workspace.folders.some((f) => f.path === folderPath);
          if (exists) {
            return { success: false, error: "Folder already in workspace" };
          }
          const newFolder = {
            id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: folderPath,
            name: folderName || path29.basename(folderPath)
          };
          workspace.folders.push(newFolder);
          return this.updateWorkspace(workspace);
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to add folder to workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Remove a folder from a workspace
       */
      async removeFolderFromWorkspace(workspaceId, folderId) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          workspace.folders = workspace.folders.filter((f) => f.id !== folderId);
          return this.updateWorkspace(workspace);
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to remove folder from workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Rename a workspace
       */
      async renameWorkspace(workspaceId, newName) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          workspace.name = newName;
          const updateResult = await this.updateWorkspace(workspace);
          if (updateResult.success) {
            const metadata = await this.loadMetadata();
            const meta = metadata.get(workspaceId);
            if (meta?.filePath) {
              const oldPath = meta.filePath;
              const dir = path29.dirname(oldPath);
              const newPath = path29.join(dir, `${newName}${WORKSPACE_FILE_EXTENSION}`);
              try {
                await fs29.rename(oldPath, newPath);
                metadata.set(workspaceId, {
                  ...meta,
                  filePath: newPath
                });
                await this.saveMetadata(metadata);
              } catch {
              }
            }
          }
          return updateResult;
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to rename workspace:", error);
          return { success: false, error: error.message };
        }
      }
    };
  }
});

// main/shared-workspace-manager.ts
function getSharedWorkspaceManager() {
  if (!sharedWorkspaceManager) {
    sharedWorkspaceManager = new SharedWorkspaceManager();
  }
  return sharedWorkspaceManager;
}
var fs30, path30, SHARED_WORKSPACES_KEY, ACTIVE_WORKSPACE_KEY, SharedWorkspaceManager, sharedWorkspaceManager;
var init_shared_workspace_manager = __esm({
  "main/shared-workspace-manager.ts"() {
    "use strict";
    fs30 = __toESM(require("fs/promises"), 1);
    path30 = __toESM(require("path"), 1);
    init_settings();
    init_workspace_storage();
    SHARED_WORKSPACES_KEY = "remoteAccess.sharedWorkspaces";
    ACTIVE_WORKSPACE_KEY = "remoteAccess.activeWorkspaceId";
    SharedWorkspaceManager = class {
      workspaceStorage;
      sharedWorkspaces = [];
      activeWorkspaceId = null;
      initialized = false;
      constructor() {
        this.workspaceStorage = new WorkspaceStorage();
      }
      /**
       * Initialize the manager - load shared workspaces from settings
       */
      async initialize() {
        if (this.initialized)
          return;
        try {
          const shared = settingsManager.get(SHARED_WORKSPACES_KEY);
          const active = settingsManager.get(ACTIVE_WORKSPACE_KEY);
          if (shared && Array.isArray(shared)) {
            const validWorkspaces = [];
            for (const ws of shared) {
              try {
                await fs30.access(ws.filePath);
                if (!ws.isSingleFolder && ws.filePath.endsWith(".omnicode-workspace")) {
                  try {
                    const content = await fs30.readFile(ws.filePath, "utf-8");
                    const workspace = JSON.parse(content);
                    if (workspace.folders && workspace.folders.length > 0) {
                      const oldFolderCount = ws.folderCount;
                      ws.folders = workspace.folders.map((f) => ({
                        id: f.id,
                        path: f.path,
                        name: f.name || path30.basename(f.path)
                      }));
                      ws.folderCount = workspace.folders.length;
                      ws.name = workspace.name;
                      if (oldFolderCount !== ws.folderCount) {
                        console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}": ${oldFolderCount} -> ${ws.folderCount} folders`);
                      }
                    }
                  } catch (readError) {
                    console.error(`[SharedWorkspaceManager] Failed to refresh workspace file ${ws.filePath}:`, readError);
                  }
                } else if (ws.isSingleFolder) {
                  try {
                    const stats = await fs30.stat(ws.filePath);
                    if (!stats.isDirectory()) {
                      console.log(`[SharedWorkspaceManager] Skipping non-directory: ${ws.filePath}`);
                      continue;
                    }
                    if (ws.folders.length === 0) {
                      ws.folders = [{
                        id: `folder-${Date.now()}`,
                        path: ws.filePath,
                        name: ws.name || path30.basename(ws.filePath)
                      }];
                      ws.folderCount = 1;
                    }
                  } catch {
                    console.log(`[SharedWorkspaceManager] Skipping inaccessible folder: ${ws.filePath}`);
                    continue;
                  }
                }
                validWorkspaces.push(ws);
              } catch {
                console.log(`[SharedWorkspaceManager] Skipping missing workspace: ${ws.filePath}`);
              }
            }
            this.sharedWorkspaces = validWorkspaces;
            if (this.sharedWorkspaces.length > 0) {
              await this.saveToSettings();
            }
          }
          if (active && this.sharedWorkspaces.some((ws) => ws.sharedId === active)) {
            this.activeWorkspaceId = active;
          } else if (this.sharedWorkspaces.length > 0) {
            this.activeWorkspaceId = this.sharedWorkspaces[0].sharedId;
            this.sharedWorkspaces[0].isActive = true;
          }
          this.initialized = true;
          console.log(`[SharedWorkspaceManager] Initialized with ${this.sharedWorkspaces.length} shared workspaces`);
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to initialize:", error);
          this.sharedWorkspaces = [];
          this.activeWorkspaceId = null;
          this.initialized = true;
        }
      }
      /**
       * Get all shared workspaces
       */
      getSharedWorkspaces() {
        return [...this.sharedWorkspaces];
      }
      /**
       * Refresh a specific workspace from disk
       */
      async refreshWorkspaceFromDisk(sharedId) {
        const ws = this.sharedWorkspaces.find((w) => w.sharedId === sharedId);
        if (!ws) {
          console.log(`[SharedWorkspaceManager] Workspace not found for refresh: ${sharedId}`);
          return false;
        }
        try {
          if (!ws.isSingleFolder && ws.filePath.endsWith(".omnicode-workspace")) {
            const content = await fs30.readFile(ws.filePath, "utf-8");
            const workspace = JSON.parse(content);
            if (workspace.folders) {
              const oldFolderCount = ws.folderCount;
              ws.folders = workspace.folders.map((f) => ({
                id: f.id,
                path: f.path,
                name: f.name || path30.basename(f.path)
              }));
              ws.folderCount = workspace.folders.length;
              ws.name = workspace.name;
              await this.saveToSettings();
              console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}" from disk: ${oldFolderCount} -> ${ws.folderCount} folders`);
              return true;
            }
          } else if (ws.isSingleFolder) {
            const stats = await fs30.stat(ws.filePath);
            if (stats.isDirectory()) {
              if (ws.folders.length === 0) {
                ws.folders = [{
                  id: `folder-${Date.now()}`,
                  path: ws.filePath,
                  name: ws.name || path30.basename(ws.filePath)
                }];
                ws.folderCount = 1;
                await this.saveToSettings();
              }
              return true;
            }
          }
        } catch (error) {
          console.error(`[SharedWorkspaceManager] Failed to refresh workspace ${sharedId}:`, error);
        }
        return false;
      }
      /**
       * Get the currently active shared workspace
       */
      getActiveWorkspace() {
        if (!this.activeWorkspaceId)
          return null;
        return this.sharedWorkspaces.find((ws) => ws.sharedId === this.activeWorkspaceId) || null;
      }
      /**
       * Get the active workspace's working directory (first folder)
       */
      getActiveWorkingDirectory() {
        const active = this.getActiveWorkspace();
        if (!active || active.folders.length === 0)
          return null;
        return active.folders[0].path;
      }
      /**
       * Set the active workspace by ID
       */
      setActiveWorkspace(sharedId) {
        const workspace = this.sharedWorkspaces.find((ws) => ws.sharedId === sharedId);
        if (!workspace) {
          console.warn(`[SharedWorkspaceManager] Workspace not found: ${sharedId}`);
          return false;
        }
        for (const ws of this.sharedWorkspaces) {
          ws.isActive = ws.sharedId === sharedId;
        }
        this.activeWorkspaceId = sharedId;
        this.saveToSettings();
        console.log(`[SharedWorkspaceManager] Activated workspace: ${workspace.name}`);
        return true;
      }
      /**
       * Add a workspace file to the shared list
       */
      async addWorkspaceFile(workspaceFilePath) {
        console.log("[SharedWorkspaceManager] addWorkspaceFile called:", workspaceFilePath);
        try {
          console.log("[SharedWorkspaceManager] Checking if file exists and is accessible...");
          await fs30.access(workspaceFilePath);
          console.log("[SharedWorkspaceManager] File exists and is accessible");
          if (!workspaceFilePath.endsWith(".omnicode-workspace")) {
            console.error("[SharedWorkspaceManager] Invalid file extension:", workspaceFilePath);
            throw new Error("Not a valid workspace file");
          }
          console.log("[SharedWorkspaceManager] File extension validated (.omnicode-workspace)");
          console.log("[SharedWorkspaceManager] Checking if workspace is already shared...");
          const existing = this.sharedWorkspaces.find((ws) => ws.filePath === workspaceFilePath);
          if (existing) {
            console.log(`[SharedWorkspaceManager] Workspace already shared: ${workspaceFilePath}`);
            return existing;
          }
          console.log("[SharedWorkspaceManager] Workspace not previously shared, proceeding...");
          console.log("[SharedWorkspaceManager] Reading workspace file...");
          const content = await fs30.readFile(workspaceFilePath, "utf-8");
          console.log("[SharedWorkspaceManager] Workspace file read, size:", content.length, "bytes");
          console.log("[SharedWorkspaceManager] Parsing workspace JSON...");
          const workspace = JSON.parse(content);
          console.log("[SharedWorkspaceManager] Workspace parsed:", {
            id: workspace.id,
            name: workspace.name,
            version: workspace.version,
            folderCount: workspace.folders?.length || 0
          });
          console.log("[SharedWorkspaceManager] Creating shared workspace entry...");
          const sharedWorkspace = {
            sharedId: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: workspace.id,
            filePath: workspaceFilePath,
            name: workspace.name,
            folderCount: workspace.folders.length,
            folders: workspace.folders.map((f) => ({
              id: f.id,
              path: f.path,
              name: f.name || path30.basename(f.path)
            })),
            isActive: this.sharedWorkspaces.length === 0,
            // First one is active by default
            addedAt: Date.now(),
            isSingleFolder: false
          };
          console.log("[SharedWorkspaceManager] Shared workspace entry created:", {
            sharedId: sharedWorkspace.sharedId,
            workspaceId: sharedWorkspace.workspaceId,
            name: sharedWorkspace.name
          });
          this.sharedWorkspaces.push(sharedWorkspace);
          console.log("[SharedWorkspaceManager] Workspace added to shared list, total count:", this.sharedWorkspaces.length);
          if (this.sharedWorkspaces.length === 1) {
            this.activeWorkspaceId = sharedWorkspace.sharedId;
            console.log("[SharedWorkspaceManager] First workspace, set as active:", sharedWorkspace.sharedId);
          }
          console.log("[SharedWorkspaceManager] Saving to settings...");
          await this.saveToSettings();
          console.log("[SharedWorkspaceManager] Settings saved successfully");
          console.log(`[SharedWorkspaceManager] addWorkspaceFile completed successfully: ${sharedWorkspace.name}`);
          return sharedWorkspace;
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[SharedWorkspaceManager] addWorkspaceFile FAILED:", {
            error: errorMessage,
            stack: errorStack,
            workspaceFilePath
          });
          return null;
        }
      }
      /**
       * Add a single folder as a workspace (for folder-only mode)
       */
      async addFolder(folderPath, name) {
        try {
          const stats = await fs30.stat(folderPath);
          if (!stats.isDirectory()) {
            throw new Error("Path is not a directory");
          }
          const existing = this.sharedWorkspaces.find(
            (ws) => ws.isSingleFolder && ws.filePath === folderPath
          );
          if (existing) {
            if (name && name.trim() && name.trim() !== existing.name) {
              const newName = name.trim();
              existing.name = newName;
              existing.folders[0].name = newName;
              await this.saveToSettings();
              console.log(`[SharedWorkspaceManager] Updated folder name: ${existing.name} -> ${newName}`);
            } else {
              console.log(`[SharedWorkspaceManager] Folder already shared: ${folderPath}`);
            }
            return existing;
          }
          const folderName = name || path30.basename(folderPath);
          const sharedWorkspace = {
            sharedId: `shared-folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: `folder-${Date.now()}`,
            filePath: folderPath,
            name: folderName,
            folderCount: 1,
            folders: [{
              id: `folder-${Date.now()}`,
              path: folderPath,
              name: folderName
            }],
            isActive: this.sharedWorkspaces.length === 0,
            addedAt: Date.now(),
            isSingleFolder: true
          };
          this.sharedWorkspaces.push(sharedWorkspace);
          if (this.sharedWorkspaces.length === 1) {
            this.activeWorkspaceId = sharedWorkspace.sharedId;
          }
          await this.saveToSettings();
          console.log(`[SharedWorkspaceManager] Added folder: ${sharedWorkspace.name}`);
          return sharedWorkspace;
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to add folder:", error);
          return null;
        }
      }
      /**
       * Create a new multi-folder workspace, persist it to a file, and add it to the shared list.
       */
      async createWorkspaceFromFolders(name, folderPaths) {
        console.log("[SharedWorkspaceManager] createWorkspaceFromFolders started:", {
          name,
          folderCount: folderPaths.length,
          folderPaths
        });
        try {
          console.log("[SharedWorkspaceManager] Step 1: Creating workspace via WorkspaceStorage...");
          const createResult = await this.workspaceStorage.createWorkspace({ name, folders: folderPaths });
          if (!createResult.success || !createResult.workspace) {
            console.error("[SharedWorkspaceManager] Step 1 FAILED: WorkspaceStorage.createWorkspace failed:", {
              success: createResult.success,
              error: createResult.error,
              hasWorkspace: !!createResult.workspace
            });
            return null;
          }
          const workspace = createResult.workspace;
          console.log("[SharedWorkspaceManager] Step 1 SUCCESS: Workspace created:", {
            workspaceId: workspace.id,
            name: workspace.name,
            folderCount: workspace.folders.length
          });
          console.log("[SharedWorkspaceManager] Step 2: Getting storage path for workspace ID:", workspace.id);
          const storageDir = await this.workspaceStorage.getWorkspaceStoragePath(workspace.id);
          console.log("[SharedWorkspaceManager] Step 2 SUCCESS: App storage directory:", storageDir);
          await Promise.all(
            folderPaths.map((fp) => fs30.mkdir(path30.join(fp, ".omnicode"), { recursive: true }).catch((e) => {
              console.warn(`[SharedWorkspaceManager] Could not create .omnicode in ${fp}:`, e.message);
            }))
          );
          const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
          const filePath = path30.join(storageDir, `${safeName}.omnicode-workspace`);
          console.log("[SharedWorkspaceManager] Step 4 prepared file path:", { safeName, filePath });
          console.log("[SharedWorkspaceManager] Step 5: Saving workspace to file...");
          const saveResult = await this.workspaceStorage.saveWorkspaceToFile(workspace, filePath);
          if (!saveResult.success) {
            console.error("[SharedWorkspaceManager] Step 5 FAILED: saveWorkspaceToFile failed:", {
              error: saveResult.error,
              filePath
            });
            return null;
          }
          console.log("[SharedWorkspaceManager] Step 5 SUCCESS: Workspace file saved");
          console.log("[SharedWorkspaceManager] Step 6: Adding workspace file to shared list...");
          const sharedWorkspace = await this.addWorkspaceFile(filePath);
          if (!sharedWorkspace) {
            console.error("[SharedWorkspaceManager] Step 6 FAILED: addWorkspaceFile returned null for path:", filePath);
            return null;
          }
          console.log("[SharedWorkspaceManager] createWorkspaceFromFolders completed successfully:", {
            sharedId: sharedWorkspace.sharedId,
            workspaceId: sharedWorkspace.workspaceId,
            name: sharedWorkspace.name,
            folderCount: sharedWorkspace.folderCount
          });
          return sharedWorkspace;
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[SharedWorkspaceManager] createWorkspaceFromFolders EXCEPTION:", {
            error: errorMessage,
            stack: errorStack,
            name,
            folderPaths
          });
          return null;
        }
      }
      /**
       * Remove a workspace from the shared list
       */
      async removeWorkspace(sharedId) {
        const index = this.sharedWorkspaces.findIndex((ws) => ws.sharedId === sharedId);
        if (index === -1)
          return false;
        const removed = this.sharedWorkspaces.splice(index, 1)[0];
        if (this.activeWorkspaceId === sharedId) {
          this.activeWorkspaceId = this.sharedWorkspaces.length > 0 ? this.sharedWorkspaces[0].sharedId : null;
          if (this.activeWorkspaceId) {
            const newActive = this.sharedWorkspaces.find((ws) => ws.sharedId === this.activeWorkspaceId);
            if (newActive)
              newActive.isActive = true;
          }
        }
        await this.saveToSettings();
        console.log(`[SharedWorkspaceManager] Removed workspace: ${removed.name}`);
        return true;
      }
      /**
       * Get details for a specific shared workspace
       */
      getWorkspaceById(sharedId) {
        return this.sharedWorkspaces.find((ws) => ws.sharedId === sharedId) || null;
      }
      /**
       * Get the working directory (first folder path) for a specific shared workspace.
       * Returns null if the workspace is not found or has no folders.
       */
      getWorkingDirectory(sharedId) {
        const workspace = this.getWorkspaceById(sharedId);
        if (!workspace || workspace.folders.length === 0)
          return null;
        return workspace.folders[0].path;
      }
      /**
       * Sync all registered workspaces from WorkspaceStorage into the shared list.
       * Any workspace that already exists (matched by workspaceId) is skipped.
       * Newly added workspaces that have no filePath (legacy entries) are skipped.
       * After syncing, ensures at least one workspace is marked active.
       */
      async syncAllWorkspaces() {
        try {
          const result = await this.workspaceStorage.listWorkspaces();
          if (result.error) {
            console.warn("[SharedWorkspaceManager] syncAllWorkspaces: WorkspaceStorage error:", result.error);
          }
          const summaries = result.workspaces ?? [];
          let added = 0;
          for (const summary of summaries) {
            const alreadyShared = this.sharedWorkspaces.some(
              (sw) => sw.workspaceId === summary.id
            );
            if (alreadyShared)
              continue;
            if (!summary.filePath)
              continue;
            const newEntry = await this.addWorkspaceFile(summary.filePath);
            if (newEntry) {
              added++;
            }
          }
          if (!this.activeWorkspaceId && this.sharedWorkspaces.length > 0) {
            const first = this.sharedWorkspaces[0];
            this.activeWorkspaceId = first.sharedId;
            first.isActive = true;
            await this.saveToSettings();
          }
          console.log(`[SharedWorkspaceManager] syncAllWorkspaces complete: added ${added}, total ${this.sharedWorkspaces.length}`);
        } catch (error) {
          console.error("[SharedWorkspaceManager] syncAllWorkspaces failed:", error);
        }
      }
      /**
       * Get folders for a specific workspace
       */
      getWorkspaceFolders(sharedId) {
        const workspace = this.getWorkspaceById(sharedId);
        return workspace?.folders || [];
      }
      /**
       * Set the active folder within a workspace (for navigation)
       */
      setActiveFolder(sharedId, folderId) {
        const workspace = this.getWorkspaceById(sharedId);
        if (!workspace)
          return false;
        const folder = workspace.folders.find((f) => f.id === folderId);
        if (!folder)
          return false;
        console.log(`[SharedWorkspaceManager] Set active folder for ${workspace.name}: ${folder.name}`);
        return true;
      }
      /**
       * Save current state to settings
       */
      async saveToSettings() {
        try {
          settingsManager.set(SHARED_WORKSPACES_KEY, this.sharedWorkspaces);
          settingsManager.set(ACTIVE_WORKSPACE_KEY, this.activeWorkspaceId);
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to save settings:", error);
        }
      }
      /**
       * Clear all shared workspaces
       */
      async clearAll() {
        this.sharedWorkspaces = [];
        this.activeWorkspaceId = null;
        await this.saveToSettings();
        console.log("[SharedWorkspaceManager] Cleared all shared workspaces");
      }
    };
    sharedWorkspaceManager = null;
  }
});

// main/chat-storage.ts
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
var fs31, path31, STORAGE_VERSION, CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs31 = __toESM(require("fs/promises"), 1);
    path31 = __toESM(require("path"), 1);
    STORAGE_VERSION = "1.0.0";
    CHATS_DIR = ".omnicode/chats";
    MAX_CHATS_PER_WORKSPACE = 50;
    ChatStorage = class {
      ensureChatsDir(workspacePath) {
        const chatsDir = path31.join(workspacePath, CHATS_DIR);
        return chatsDir;
      }
      /**
       * Save a conversation to disk
       */
      async saveConversation(workspacePath, conversation) {
        try {
          if (!workspacePath) {
            return { success: false, error: "No workspace path provided" };
          }
          const chatsDir = await this.ensureChatsDir(workspacePath);
          await fs31.mkdir(chatsDir, { recursive: true });
          const pendingPreviews = conversation.pendingChangePreviews;
          const serializedPreviews = pendingPreviews instanceof Map ? Array.from(pendingPreviews.entries()) : pendingPreviews;
          const serialized = {
            version: STORAGE_VERSION,
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages,
            toolCalls: conversation.toolCalls,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.messages.length,
            model: conversation.model,
            provider: conversation.provider,
            contextTokens: conversation.contextTokens,
            maxContextTokens: conversation.maxContextTokens,
            mode: conversation.mode,
            planningApproach: conversation.planningApproach,
            pendingPlan: conversation.pendingPlan ?? void 0,
            planFilePath: conversation.planFilePath ?? void 0,
            pendingChangePreviews: serializedPreviews
          };
          const filePath = path31.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs31.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          await fs31.rename(tempPath, filePath);
          return { success: true };
        } catch (error) {
          console.error("[ChatStorage] Failed to save conversation:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load all conversations from a workspace
       */
      async loadConversations(workspacePath) {
        try {
          if (!workspacePath) {
            return { conversations: [] };
          }
          const chatsDir = path31.join(workspacePath, CHATS_DIR);
          try {
            await fs31.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs31.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path31.join(chatsDir, file.name);
              const content = await fs31.readFile(filePath, "utf-8");
              const serialized = JSON.parse(content);
              const migrated = this.migrateIfNeeded(serialized);
              const pendingChangePreviews = migrated.pendingChangePreviews ? new Map(migrated.pendingChangePreviews) : /* @__PURE__ */ new Map();
              const loadedConv = {
                id: migrated.id,
                title: migrated.title,
                messages: migrated.messages,
                toolCalls: migrated.toolCalls,
                createdAt: migrated.createdAt,
                updatedAt: migrated.updatedAt,
                model: migrated.model,
                provider: migrated.provider,
                contextTokens: migrated.contextTokens,
                maxContextTokens: migrated.maxContextTokens,
                mode: migrated.mode,
                planningApproach: migrated.planningApproach,
                pendingPlan: migrated.pendingPlan ?? null,
                planFilePath: migrated.planFilePath ?? null,
                pendingChangePreviews,
                // Reset runtime state
                isProcessing: false,
                streamingContent: "",
                orchestrationStatus: null
              };
              conversations.push(loadedConv);
            } catch (error) {
              console.error(`[ChatStorage] Failed to load conversation ${file.name}:`, error);
            }
          }
          conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          return { conversations };
        } catch (error) {
          console.error("[ChatStorage] Failed to load conversations:", error);
          return { conversations: [], error: error.message };
        }
      }
      /**
       * Delete a conversation from disk
       */
      async deleteConversation(workspacePath, conversationId) {
        try {
          if (!workspacePath) {
            return { success: false, error: "No workspace path provided" };
          }
          const chatsDir = path31.join(workspacePath, CHATS_DIR);
          const filePath = path31.join(chatsDir, `${conversationId}.json`);
          await fs31.unlink(filePath);
          return { success: true };
        } catch (error) {
          if (error.code === "ENOENT") {
            return { success: true };
          }
          console.error("[ChatStorage] Failed to delete conversation:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * List all saved conversation IDs and metadata
       */
      async listConversations(workspacePath) {
        try {
          if (!workspacePath) {
            return { conversations: [] };
          }
          const chatsDir = path31.join(workspacePath, CHATS_DIR);
          try {
            await fs31.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs31.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path31.join(chatsDir, file.name);
              const content = await fs31.readFile(filePath, "utf-8");
              const serialized = JSON.parse(content);
              conversations.push({
                id: serialized.id,
                title: serialized.title,
                updatedAt: serialized.updatedAt,
                messageCount: serialized.messageCount
              });
            } catch {
            }
          }
          conversations.sort((a, b) => b.updatedAt - a.updatedAt);
          return { conversations };
        } catch (error) {
          console.error("[ChatStorage] Failed to list conversations:", error);
          return { conversations: [], error: error.message };
        }
      }
      /**
       * Clean up old conversations if exceeding the limit
       */
      async cleanupOldConversations(workspacePath, maxChats = MAX_CHATS_PER_WORKSPACE) {
        try {
          const { conversations } = await this.listConversations(workspacePath);
          if (conversations.length <= maxChats) {
            return { deleted: 0 };
          }
          const toDelete = conversations.slice(maxChats);
          let deleted = 0;
          for (const conv of toDelete) {
            const result = await this.deleteConversation(workspacePath, conv.id);
            if (result.success) {
              deleted++;
            }
          }
          return { deleted };
        } catch (error) {
          console.error("[ChatStorage] Failed to cleanup conversations:", error);
          return { deleted: 0, error: error.message };
        }
      }
      /**
       * Handle version migration of stored conversations
       */
      migrateIfNeeded(serialized) {
        const currentVersion = serialized.version || "0.0.0";
        return serialized;
      }
    };
    chatStorage = null;
  }
});

// src/core/usage-types.ts
var init_usage_types = __esm({
  "src/core/usage-types.ts"() {
    "use strict";
  }
});

// main/usage-storage.ts
var fs32, path32;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs32 = __toESM(require("fs/promises"), 1);
    path32 = __toESM(require("path"), 1);
    init_usage_types();
  }
});

// main/system-sounds.ts
var import_electron7;
var init_system_sounds = __esm({
  "main/system-sounds.ts"() {
    "use strict";
    import_electron7 = require("electron");
  }
});

// main/notifications.ts
var import_electron8;
var init_notifications = __esm({
  "main/notifications.ts"() {
    "use strict";
    import_electron8 = require("electron");
    init_settings();
    init_system_sounds();
  }
});

// main/ipc-handlers.ts
function getConfigModels() {
  const registry = getProviderRegistry();
  if (!registry)
    return [];
  const allModels = registry.getAllModels();
  return allModels.map((model) => {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;
    return {
      id: model.id,
      name: model.name || model.id,
      provider: model.provider,
      available: isProviderAvailable,
      maxContextWindow: model.capabilities?.maxContextWindow
    };
  });
}
function getConfigProviders() {
  const registry = getProviderRegistry();
  if (!registry)
    return [];
  const allModels = registry.getAllModels();
  const providers = /* @__PURE__ */ new Map();
  for (const model of allModels) {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;
    if (!providers.has(model.provider)) {
      providers.set(model.provider, {
        name: model.provider,
        available: isProviderAvailable,
        models: []
      });
    }
    providers.get(model.provider).models.push(model.id);
  }
  return Array.from(providers.values());
}
var import_electron9, fs33, fsSync2, path33, os5, https2, http2, import_node_child_process10, chatStorageRef;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    "use strict";
    import_electron9 = require("electron");
    fs33 = __toESM(require("fs/promises"), 1);
    fsSync2 = __toESM(require("fs"), 1);
    path33 = __toESM(require("path"), 1);
    os5 = __toESM(require("os"), 1);
    https2 = __toESM(require("https"), 1);
    http2 = __toESM(require("http"), 1);
    import_node_child_process10 = require("child_process");
    init_core_integration();
    init_model_registry();
    init_remote_client_mode();
    init_plan_file_manager();
    init_shared_workspace_manager();
    init_workspace_storage();
    init_chat_storage();
    init_usage_storage();
    init_file_history();
    init_notifications();
    init_terminal_manager();
    init_git_manager();
    init_large_file_writer();
    init_project_indexer();
    chatStorageRef = getChatStorage();
  }
});

// src/config/rules-parser.ts
function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw.trim() };
  }
  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();
  const frontmatter = {};
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1)
      continue;
    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();
    if (rawValue === "true") {
      frontmatter[key] = true;
    } else if (rawValue === "false") {
      frontmatter[key] = false;
    } else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      frontmatter[key] = rawValue.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    } else {
      frontmatter[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
  return { frontmatter, body };
}
function parseRuleFrontmatter(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    frontmatter: {
      description: typeof frontmatter.description === "string" ? frontmatter.description : void 0,
      globs: Array.isArray(frontmatter.globs) ? frontmatter.globs : typeof frontmatter.globs === "string" ? frontmatter.globs : void 0,
      alwaysApply: typeof frontmatter.alwaysApply === "boolean" ? frontmatter.alwaysApply : void 0
    },
    body
  };
}
function parseSkillFrontmatter(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    name: typeof frontmatter.name === "string" ? frontmatter.name : void 0,
    description: typeof frontmatter.description === "string" ? frontmatter.description : void 0,
    body
  };
}
var FRONTMATTER_RE;
var init_rules_parser = __esm({
  "src/config/rules-parser.ts"() {
    "use strict";
    FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
  }
});

// main/rules-manager.ts
var fs34, path34, import_fast_glob4, import_minimatch, RULES_SUBDIR, STATE_FILE, RulesManager, rulesManager;
var init_rules_manager = __esm({
  "main/rules-manager.ts"() {
    "use strict";
    fs34 = __toESM(require("fs/promises"), 1);
    path34 = __toESM(require("path"), 1);
    import_fast_glob4 = require("fast-glob");
    import_minimatch = require("minimatch");
    init_rules_parser();
    RULES_SUBDIR = path34.join(".omnicode", "rules");
    STATE_FILE = path34.join(".omnicode", "rules-state.json");
    RulesManager = class {
      projectPath = "";
      rules = /* @__PURE__ */ new Map();
      async loadRules(projectPath) {
        this.projectPath = projectPath;
        const rulesDir = path34.join(projectPath, RULES_SUBDIR);
        const disabledIds = await this.loadDisabledState(projectPath);
        let files = [];
        try {
          await fs34.access(rulesDir);
          files = await (0, import_fast_glob4.glob)("**/*.mdc", { cwd: rulesDir, absolute: true });
        } catch {
          this.rules.clear();
          return;
        }
        this.rules.clear();
        for (const filePath of files) {
          const id = path34.basename(filePath, ".mdc");
          try {
            const raw = await fs34.readFile(filePath, "utf-8");
            const { frontmatter, body } = parseRuleFrontmatter(raw);
            this.rules.set(id, {
              id,
              filePath,
              frontmatter,
              content: body,
              enabled: !disabledIds.has(id)
            });
          } catch {
            continue;
          }
        }
        console.log(`[RulesManager] Loaded ${this.rules.size} rules from ${rulesDir}`);
      }
      getAllRules() {
        return Array.from(this.rules.values()).sort((a, b) => a.id.localeCompare(b.id));
      }
      getActiveRules(openFiles = []) {
        return Array.from(this.rules.values()).filter((rule) => {
          if (!rule.enabled)
            return false;
          if (rule.frontmatter.alwaysApply === true)
            return true;
          if (!rule.frontmatter.globs && rule.frontmatter.alwaysApply !== false)
            return true;
          if (rule.frontmatter.globs) {
            const globs = Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs : [rule.frontmatter.globs];
            return openFiles.some(
              (file) => globs.some((g) => (0, import_minimatch.minimatch)(path34.basename(file), g) || (0, import_minimatch.minimatch)(file, g))
            );
          }
          return false;
        });
      }
      buildRulesPrompt(openFiles = []) {
        const active = this.getActiveRules(openFiles);
        if (active.length === 0)
          return "";
        const parts = active.map((rule) => {
          const scopeNote = rule.frontmatter.globs ? ` (applies to: ${Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs.join(", ") : rule.frontmatter.globs})` : "";
          const header = rule.frontmatter.description ? `### ${rule.frontmatter.description}${scopeNote}` : `### ${rule.id}${scopeNote}`;
          return `${header}
${rule.content}`;
        });
        return `
## Project Rules

The following rules have been configured for this project. Follow them carefully.

${parts.join("\n\n")}`;
      }
      async toggleRule(id, enabled) {
        const rule = this.rules.get(id);
        if (!rule)
          return;
        rule.enabled = enabled;
        await this.saveDisabledState();
      }
      async saveRule(id, frontmatterRaw, body) {
        const rulesDir = path34.join(this.projectPath, RULES_SUBDIR);
        await fs34.mkdir(rulesDir, { recursive: true });
        const filePath = path34.join(rulesDir, `${id}.mdc`);
        const content = frontmatterRaw ? `${frontmatterRaw}
${body}` : body;
        await fs34.writeFile(filePath, content, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async saveRuleFile(id, fullContent) {
        const rulesDir = path34.join(this.projectPath, RULES_SUBDIR);
        await fs34.mkdir(rulesDir, { recursive: true });
        const filePath = path34.join(rulesDir, `${id}.mdc`);
        await fs34.writeFile(filePath, fullContent, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async deleteRule(id) {
        const rule = this.rules.get(id);
        if (!rule)
          return;
        await fs34.unlink(rule.filePath);
        this.rules.delete(id);
        await this.saveDisabledState();
      }
      getRulesDir() {
        return path34.join(this.projectPath, RULES_SUBDIR);
      }
      async loadDisabledState(projectPath) {
        try {
          const statePath = path34.join(projectPath, STATE_FILE);
          const raw = await fs34.readFile(statePath, "utf-8");
          const data = JSON.parse(raw);
          return new Set(Array.isArray(data.disabledRules) ? data.disabledRules : []);
        } catch {
          return /* @__PURE__ */ new Set();
        }
      }
      async saveDisabledState() {
        if (!this.projectPath)
          return;
        const disabled = Array.from(this.rules.values()).filter((r) => !r.enabled).map((r) => r.id);
        const statePath = path34.join(this.projectPath, STATE_FILE);
        await fs34.mkdir(path34.dirname(statePath), { recursive: true });
        await fs34.writeFile(statePath, JSON.stringify({ disabledRules: disabled }, null, 2), "utf-8");
      }
    };
    rulesManager = new RulesManager();
  }
});

// main/skills-manager.ts
var fs35, path35, SKILLS_SUBDIR, SKILL_FILENAME, SkillsManager, skillsManager;
var init_skills_manager = __esm({
  "main/skills-manager.ts"() {
    "use strict";
    fs35 = __toESM(require("fs/promises"), 1);
    path35 = __toESM(require("path"), 1);
    init_rules_parser();
    SKILLS_SUBDIR = path35.join(".omnicode", "skills");
    SKILL_FILENAME = "SKILL.md";
    SkillsManager = class {
      projectPath = "";
      skills = /* @__PURE__ */ new Map();
      async loadSkills(projectPath) {
        this.projectPath = projectPath;
        const skillsDir = path35.join(projectPath, SKILLS_SUBDIR);
        let entries = [];
        try {
          await fs35.access(skillsDir);
          entries = await fs35.readdir(skillsDir, { withFileTypes: true });
        } catch {
          this.skills.clear();
          return;
        }
        this.skills.clear();
        for (const entry of entries) {
          if (!entry.isDirectory())
            continue;
          const skillId = entry.name;
          const skillFile = path35.join(skillsDir, skillId, SKILL_FILENAME);
          try {
            await fs35.access(skillFile);
            const raw = await fs35.readFile(skillFile, "utf-8");
            const { name, description, body } = parseSkillFrontmatter(raw);
            this.skills.set(skillId, {
              id: skillId,
              dirPath: path35.join(skillsDir, skillId),
              filePath: skillFile,
              name: name || skillId,
              description: description || "",
              content: raw,
              enabled: true
            });
          } catch {
            continue;
          }
        }
        console.log(`[SkillsManager] Loaded ${this.skills.size} skills from ${skillsDir}`);
      }
      getAllSkills() {
        return Array.from(this.skills.values()).sort((a, b) => a.name.localeCompare(b.name));
      }
      getSkill(id) {
        return this.skills.get(id);
      }
      buildSkillsPrompt() {
        const all = this.getAllSkills();
        if (all.length === 0)
          return "";
        const lines = all.map((skill) => {
          const desc = skill.description ? ` \u2014 ${skill.description}` : "";
          return `- **${skill.name}** (\`${skill.filePath}\`)${desc}`;
        });
        return `
## Available Skills

The following agent skills are available. When a skill is relevant, read its SKILL.md file for detailed instructions.

${lines.join("\n")}`;
      }
      async saveSkill(id, content) {
        const skillDir = path35.join(this.projectPath, SKILLS_SUBDIR, id);
        await fs35.mkdir(skillDir, { recursive: true });
        const filePath = path35.join(skillDir, SKILL_FILENAME);
        await fs35.writeFile(filePath, content, "utf-8");
        await this.loadSkills(this.projectPath);
      }
      async deleteSkill(id) {
        const skill = this.skills.get(id);
        if (!skill)
          return;
        await fs35.rm(skill.dirPath, { recursive: true, force: true });
        this.skills.delete(id);
      }
      getSkillsDir() {
        return path35.join(this.projectPath, SKILLS_SUBDIR);
      }
    };
    skillsManager = new SkillsManager();
  }
});

// main/addon-loader.ts
var fs36, path36, import_electron10;
var init_addon_loader = __esm({
  "main/addon-loader.ts"() {
    "use strict";
    fs36 = __toESM(require("fs/promises"), 1);
    path36 = __toESM(require("path"), 1);
    import_electron10 = require("electron");
  }
});

// main/core-integration.ts
function getWorkingDirectory() {
  return currentWorkingDirectory;
}
function getProviderRegistry() {
  return providerRegistry;
}
var path37, currentWorkingDirectory, providerRegistry;
var init_core_integration = __esm({
  "main/core-integration.ts"() {
    "use strict";
    path37 = __toESM(require("path"), 1);
    init_config_manager();
    init_provider_registry();
    init_anthropic_provider();
    init_openai_provider();
    init_google_provider();
    init_mistral_provider();
    init_groq_provider();
    init_xai_provider();
    init_bedrock_provider();
    init_moonshot_provider();
    init_openai_compat_provider();
    init_tool_registry();
    init_builtin();
    init_permission_manager();
    init_tool_runner();
    init_agent();
    init_cost_tracker();
    init_event_bus();
    init_agent_bridge();
    init_ipc_handlers();
    init_usage_storage();
    init_settings();
    init_rules_manager();
    init_skills_manager();
    init_addon_loader();
    currentWorkingDirectory = process.cwd();
    providerRegistry = null;
  }
});

// main/remote-server.ts
var remote_server_exports = {};
__export(remote_server_exports, {
  destructiveLimiter: () => destructiveLimiter,
  getRemoteServerStatus: () => getRemoteServerStatus,
  initializeRemoteServer: () => initializeRemoteServer,
  stopRemoteServer: () => stopRemoteServer,
  writeLimiter: () => writeLimiter
});
module.exports = __toCommonJS(remote_server_exports);
function resolveWorkingDirectory(req) {
  const workspaceId = req.query.workspaceId || req.body?.workspaceId;
  if (workspaceId) {
    const cwd = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
    if (cwd)
      return cwd;
  }
  return getSharedWorkspaceManager().getActiveWorkingDirectory() ?? getWorkingDirectory();
}
function resolveAndSandbox(inputPath, fallbackCwd) {
  const resolved = path38.resolve(
    path38.isAbsolute(inputPath) ? inputPath : path38.join(fallbackCwd, inputPath)
  );
  const allowedBases = getSharedWorkspaceManager().getSharedWorkspaces().flatMap((ws) => ws.folders.map((f) => path38.resolve(f.path)));
  const allowed = allowedBases.some(
    (base) => resolved === base || resolved.startsWith(base + path38.sep)
  );
  if (!allowed) {
    const err = new Error("Access denied: path is outside allowed workspace directories");
    err.status = 403;
    throw err;
  }
  return resolved;
}
function assertWithinHomeDir(dirPath) {
  const resolved = path38.resolve(dirPath);
  const home = os6.homedir();
  if (!resolved.startsWith(home + path38.sep) && resolved !== home) {
    const err = new Error("Folder path must be within the user home directory");
    err.status = 403;
    throw err;
  }
}
function sendRouteError(res, error) {
  const err = error;
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}
function deriveConversationTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser)
    return "Remote Conversation";
  const text = typeof firstUser.content === "string" ? firstUser.content : String(firstUser.content);
  return text.length > 60 ? text.slice(0, 60).trim() + "\u2026" : text.trim();
}
async function initializeRemoteServer() {
  if (isRunning) {
    return {
      success: true,
      url: publicUrl || void 0,
      apiKey: getApiKey() || void 0
    };
  }
  try {
    port = settingsManager.get("remoteAccess.port") || 3e3;
    const providerType = settingsManager.get("remoteAccess.tunnelProvider") || "ngrok";
    const ngrokAuthToken = settingsManager.get("remoteAccess.ngrokAuthToken");
    const cloudflaredToken = settingsManager.get("remoteAccess.cloudflaredToken");
    const apiKey = ensureApiKey();
    app5 = (0, import_express.default)();
    setupMiddleware(app5);
    setupRoutes(app5);
    autoSaveUnsubscribe = agentBridge.onEvent(async (event) => {
      if (event.type !== "turn_complete")
        return;
      const stopReason = event.message?.metadata?.stopReason;
      if (stopReason === "tool_use")
        return;
      const meta = remoteConversationMeta.get(event.conversationId);
      if (!meta)
        return;
      const snapshot = agentBridge.getConversationSnapshot(event.conversationId);
      console.log(`[RemoteServer] Auto-save snapshot: conversationId=${event.conversationId}, messages=${snapshot?.messages.length ?? 0}, roles=${snapshot?.messages.map((m) => m.role).join(",") ?? "none"}`);
      if (!snapshot || snapshot.messages.length === 0)
        return;
      try {
        await getChatStorage().saveConversation(meta.workspacePath, {
          id: event.conversationId,
          title: deriveConversationTitle(snapshot.messages),
          messages: snapshot.messages,
          toolCalls: [],
          createdAt: meta.createdAt,
          updatedAt: Date.now(),
          isProcessing: false,
          streamingContent: "",
          orchestrationStatus: null,
          model: snapshot.model,
          provider: snapshot.provider
        });
        console.log(`[RemoteServer] Auto-saved conversation ${event.conversationId} to ${meta.workspacePath}`);
      } catch (err) {
        console.error(`[RemoteServer] Failed to auto-save conversation ${event.conversationId}:`, err);
      }
    });
    await new Promise((resolve11, reject) => {
      server = app5.listen(port, () => {
        console.log(`[RemoteServer] Express server running on port ${port}`);
        resolve11();
      });
      server.on("error", (error) => {
        reject(error);
      });
    });
    try {
      tunnelProvider = createTunnelProvider({
        tunnelProvider: providerType,
        ngrokAuthToken: ngrokAuthToken || void 0,
        cloudflaredToken: cloudflaredToken || void 0
      });
      publicUrl = await tunnelProvider.start(port);
      console.log(`[RemoteServer] Tunnel established via ${providerType}: ${publicUrl}`);
    } catch (error) {
      console.error(`[RemoteServer] Failed to create ${providerType} tunnel:`, error);
      publicUrl = `http://localhost:${port}`;
      tunnelProvider = null;
    }
    initializeEventEmitter();
    initializeWebSocketServer(server);
    isRunning = true;
    console.log("[RemoteServer] Remote access ready");
    console.log(`[RemoteServer] URL: ${publicUrl}`);
    console.log(`[RemoteServer] API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`);
    return {
      success: true,
      url: publicUrl || void 0,
      apiKey
    };
  } catch (error) {
    console.error("[RemoteServer] Failed to initialize:", error);
    await cleanup();
    return {
      success: false,
      error: error.message
    };
  }
}
async function stopRemoteServer() {
  if (!isRunning) {
    return { success: true };
  }
  try {
    await cleanup();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
function getRemoteServerStatus() {
  return {
    running: isRunning,
    url: publicUrl,
    apiKey: getApiKey(),
    port,
    connections: getConnectionStats()
  };
}
async function cleanup() {
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }
  remoteConversationMeta.clear();
  cleanupEventEmitter();
  cleanupWebSocketServer();
  if (tunnelProvider) {
    await tunnelProvider.stop();
    tunnelProvider = null;
  }
  if (server) {
    await new Promise((resolve11) => {
      server.close(() => {
        resolve11();
      });
    });
    server = null;
  }
  app5 = null;
  isRunning = false;
  publicUrl = null;
  terminalOutputs.clear();
  registeredProxyPorts.clear();
  console.log("[RemoteServer] Server stopped");
}
function setupMiddleware(app6) {
  app6.use(import_express.default.json({ limit: "10mb" }));
  app6.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
  const corsOptions = getCorsOptions();
  app6.use((0, import_cors.default)(corsOptions));
  const rateLimitWindowMs = settingsManager.get("remoteAccess.rateLimitWindowMs") || 15 * 60 * 1e3;
  const rateLimitMax = settingsManager.get("remoteAccess.rateLimitRequests") || 100;
  const limiter = (0, import_express_rate_limit.default)({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many requests, please try again later." });
    }
  });
  app6.use(limiter);
}
function setupRoutes(app6) {
  app6.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      running: isRunning,
      url: publicUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app6.get("/api/sse-test", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    let count = 0;
    const interval = setInterval(() => {
      count++;
      res.write(`data: ${JSON.stringify({ count, ts: Date.now() })}

`);
      if (count >= 30) {
        clearInterval(interval);
        res.end();
      }
    }, 1e3);
    res.on("close", () => clearInterval(interval));
  });
  app6.use("/api", validateApiKey);
  app6.use("/api", validateRequestSignature);
  setupConfigRoutes(app6);
  setupWorkspaceRoutes(app6);
  setupChatRoutes(app6);
  setupAgentRoutes(app6);
  setupFileRoutes(app6);
  setupTerminalRoutes(app6);
  setupToolRoutes(app6);
  setupGitRoutes(app6);
  setupProxyRoutes(app6);
  setupAdbRoutes(app6);
  setupIosRoutes(app6);
  app6.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app6.use((err, _req, res, _next) => {
    console.error("[RemoteServer] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
}
function setupConfigRoutes(app6) {
  app6.get("/api/config", async (_req, res) => {
    try {
      const models = agentBridge.getActiveConversations();
      const sharedWM = getSharedWorkspaceManager();
      res.json({
        models,
        workingDirectory: sharedWM.getActiveWorkingDirectory() ?? getWorkingDirectory(),
        activeWorkspaceId: sharedWM.getActiveWorkspace()?.sharedId ?? null,
        version: process.env.npm_package_version || "unknown"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/models", async (_req, res) => {
    try {
      const models = getConfigModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/providers", async (_req, res) => {
    try {
      const providers = getConfigProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupWorkspaceRoutes(app6) {
  app6.get("/api/workspaces", (_req, res) => {
    try {
      const workspaces = getSharedWorkspaceManager().getSharedWorkspaces();
      const activeId = getSharedWorkspaceManager().getActiveWorkspace()?.sharedId ?? null;
      res.json({ workspaces, activeWorkspaceId: activeId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/workspaces/:workspaceId", (req, res) => {
    try {
      const workspace = getSharedWorkspaceManager().getWorkspaceById(req.params.workspaceId);
      if (!workspace) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      res.json({ workspace });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/workspaces/active", (req, res) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const success = getSharedWorkspaceManager().setActiveWorkspace(workspaceId);
      if (!success) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      res.json({ success: true, workspaceId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/workspaces", async (req, res) => {
    console.log("[POST /api/workspaces] Request body:", JSON.stringify(req.body));
    try {
      const { name, folders } = req.body;
      if (!name || !name.trim()) {
        console.warn("[POST /api/workspaces] Missing workspace name");
        res.status(400).json({ error: "Missing workspace name" });
        return;
      }
      if (!folders || !Array.isArray(folders) || folders.length === 0) {
        console.warn("[POST /api/workspaces] No folders provided");
        res.status(400).json({ error: "At least one folder path is required" });
        return;
      }
      for (const folderPath of folders) {
        try {
          assertWithinHomeDir(folderPath.trim());
        } catch (guardErr) {
          console.warn(`[POST /api/workspaces] Path rejected: ${folderPath.trim()}`);
          sendRouteError(res, guardErr);
          return;
        }
      }
      for (const folderPath of folders) {
        console.log(`[POST /api/workspaces] Ensuring folder exists: ${folderPath.trim()}`);
        await fs37.mkdir(folderPath.trim(), { recursive: true });
        console.log(`[POST /api/workspaces] Folder ready: ${folderPath.trim()}`);
      }
      console.log(`[POST /api/workspaces] Creating workspace "${name.trim()}" with ${folders.length} folder(s)`);
      const workspace = await getSharedWorkspaceManager().createWorkspaceFromFolders(name.trim(), folders);
      if (!workspace) {
        console.error("[POST /api/workspaces] createWorkspaceFromFolders returned null");
        res.status(500).json({ error: "Failed to create workspace" });
        return;
      }
      console.log(`[POST /api/workspaces] Created workspace: sharedId=${workspace.sharedId}, name=${workspace.name}`);
      res.status(201).json({ success: true, workspace });
    } catch (error) {
      console.error("[POST /api/workspaces] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/projects", async (req, res) => {
    console.log("[POST /api/projects] Request body:", JSON.stringify(req.body));
    try {
      const { folderPath, name } = req.body;
      if (!folderPath || !folderPath.trim()) {
        console.warn("[POST /api/projects] Missing folderPath");
        res.status(400).json({ error: "Missing folderPath" });
        return;
      }
      try {
        assertWithinHomeDir(folderPath.trim());
      } catch (guardErr) {
        console.warn(`[POST /api/projects] Path rejected: ${folderPath.trim()}`);
        sendRouteError(res, guardErr);
        return;
      }
      console.log(`[POST /api/projects] Ensuring folder exists: ${folderPath.trim()}`);
      await fs37.mkdir(folderPath.trim(), { recursive: true });
      console.log(`[POST /api/projects] Folder ready: ${folderPath.trim()}`);
      const workspace = await getSharedWorkspaceManager().addFolder(folderPath.trim(), name?.trim());
      if (!workspace) {
        console.error(`[POST /api/projects] addFolder returned null for path: ${folderPath.trim()}`);
        res.status(500).json({ error: "Failed to create project" });
        return;
      }
      console.log(`[POST /api/projects] Created project: sharedId=${workspace.sharedId}, name=${workspace.name}`);
      res.status(201).json({ success: true, workspace });
    } catch (error) {
      console.error("[POST /api/projects] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.delete("/api/workspaces/:workspaceId", async (req, res) => {
    console.log(`[DELETE /api/workspaces] workspaceId=${req.params.workspaceId}`);
    try {
      const removed = await getSharedWorkspaceManager().removeWorkspace(req.params.workspaceId);
      if (!removed) {
        console.warn(`[DELETE /api/workspaces] Not found: ${req.params.workspaceId}`);
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      console.log(`[DELETE /api/workspaces] Removed: ${req.params.workspaceId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[DELETE /api/workspaces] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
function setupChatRoutes(app6) {
  app6.get("/api/chat/list", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      const result = await getChatStorage().listConversations(workspacePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/chat/load/:conversationId", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      const result = await getChatStorage().loadConversations(workspacePath);
      const conversation = result.conversations?.find(
        (c) => c.id === req.params.conversationId
      ) ?? null;
      if (!conversation) {
        console.log(`[RemoteServer] loadConversation: NOT FOUND id=${req.params.conversationId}, available ids=[${result.conversations?.map((c) => c.id).join(", ")}]`);
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const msgRoles = (conversation.messages ?? []).map((m) => m.role).join(",");
      console.log(`[RemoteServer] loadConversation: found id=${conversation.id}, messageCount=${(conversation.messages ?? []).length}, roles=${msgRoles}`);
      res.json({ conversation });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupAgentRoutes(app6) {
  app6.post("/api/agent/create-conversation", async (req, res) => {
    try {
      const { conversationId, model, provider, workingDirectory, mode } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      const success = agentBridge.createConversation(conversationId, model, provider, resolvedCwd);
      if (success) {
        remoteConversationMeta.set(conversationId, {
          workspacePath: resolvedCwd,
          model,
          provider,
          createdAt: Date.now()
        });
        if (mode) {
          await agentBridge.setMode(conversationId, mode);
          console.log(`[RemoteServer] Applied mode '${mode}' to conversation ${conversationId}`);
        }
        res.json({ success: true, conversationId });
      } else {
        res.status(400).json({ error: "Failed to create conversation" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/send-message", async (req, res) => {
    try {
      const { conversationId, message, workingDirectory, fileReferences, images } = req.body;
      if (!conversationId || !message) {
        res.status(400).json({ error: "Missing conversationId or message" });
        return;
      }
      console.log(`[RemoteServer] Send message: conversationId=${conversationId}, messageLength=${message?.length || 0}, fileReferences=${fileReferences?.length || 0}, images=${images?.length || 0}`);
      if (images && images.length > 0) {
        images.forEach((img, idx) => {
          console.log(`[RemoteServer] Image ${idx}: mediaType=${img.mediaType}, dataLength=${img.data?.length || 0}`);
        });
      }
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      agentBridge.sendMessage(conversationId, message, resolvedCwd, fileReferences, images).catch((error) => {
        console.error(`[RemoteServer] Error sending message to ${conversationId}:`, error);
      });
      res.json({ success: true, conversationId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/abort", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      agentBridge.abort(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/close-conversation", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const success = agentBridge.closeConversation(conversationId);
      remoteConversationMeta.delete(conversationId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/conversations", async (_req, res) => {
    try {
      const conversations = agentBridge.getActiveConversations();
      res.json({ conversations });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/events", async (req, res) => {
    const conversationId = req.query.conversationId;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    if (conversationId) {
      registerConnection(conversationId, res);
    }
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}

`);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
    });
  });
  app6.post("/api/agent/respond-permission", async (req, res) => {
    try {
      const { toolId, decision } = req.body;
      if (!toolId || !decision) {
        res.status(400).json({ error: "Missing toolId or decision" });
        return;
      }
      const success = agentBridge.respondPermission(toolId, decision);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/respond-user-input", async (req, res) => {
    try {
      const { requestId, response, cancelled } = req.body;
      if (!requestId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
      }
      const success = agentBridge.respondUserInput(requestId, response || "", cancelled || false);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/switch-model", async (req, res) => {
    try {
      const { conversationId, model, provider } = req.body;
      if (!conversationId || !model || !provider) {
        res.status(400).json({ error: "Missing conversationId, model, or provider" });
        return;
      }
      const success = await agentBridge.switchModel(conversationId, model, provider);
      if (success) {
        console.log(`[RemoteServer] Switched model to ${model} (${provider}) for conversation ${conversationId}`);
        res.json({ success: true, conversationId, model, provider });
      } else {
        res.status(404).json({ error: "Conversation not found or model switch failed" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-mode", async (req, res) => {
    try {
      const { conversationId, mode } = req.body;
      if (!conversationId || !mode) {
        res.status(400).json({ error: "Missing conversationId or mode" });
        return;
      }
      const result = await agentBridge.setMode(conversationId, mode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-change-review", async (req, res) => {
    try {
      const { enabled } = req.body;
      if (enabled === void 0) {
        res.status(400).json({ error: "Missing enabled parameter" });
        return;
      }
      agentBridge.setChangeReviewEnabled(enabled);
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/change-review-status", async (_req, res) => {
    try {
      const settings = await agentBridge.getChangeReviewSetting();
      res.json({
        enabled: settings.enabled,
        mode: settings.mode
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-change-review/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      if (!mode || !["all", "dangerous"].includes(mode)) {
        res.status(400).json({ error: 'Invalid mode. Must be "all" or "dangerous"' });
        return;
      }
      await agentBridge.setChangeReviewMode(mode);
      res.json({ success: true, mode });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/changes/pending", async (req, res) => {
    try {
      const conversationId = req.query.conversationId;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId query parameter" });
        return;
      }
      const pendingChanges = agentBridge.getPendingChanges(conversationId);
      const summary = agentBridge.getChangeSummary(conversationId);
      res.json({
        conversationId,
        pendingChanges,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/respond", async (req, res) => {
    try {
      const { conversationId, messageId, toolCallId, decision } = req.body;
      if (!conversationId || !messageId || !toolCallId || !decision) {
        res.status(400).json({ error: "Missing conversationId, messageId, toolCallId, or decision" });
        return;
      }
      if (decision !== "accept" && decision !== "reject") {
        res.status(400).json({ error: 'Invalid decision. Must be "accept" or "reject"' });
        return;
      }
      const result = await agentBridge.respondToChangeReview(conversationId, messageId, toolCallId, decision);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/accept-all", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const result = await agentBridge.acceptAllChanges(conversationId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/reject-all", async (req, res) => {
    try {
      const { conversationId, messageId } = req.body;
      if (!conversationId || !messageId) {
        res.status(400).json({ error: "Missing conversationId or messageId" });
        return;
      }
      const result = await agentBridge.rejectAllChanges(conversationId, messageId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/truncate-messages", async (req, res) => {
    try {
      const { conversationId, messageIndex } = req.body;
      if (!conversationId || messageIndex === void 0) {
        res.status(400).json({ error: "Missing conversationId or messageIndex" });
        return;
      }
      const index = parseInt(messageIndex, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ error: "Invalid messageIndex" });
        return;
      }
      const success = agentBridge.truncateMessages(conversationId, index);
      if (success) {
        res.json({ success: true, messageIndex: index });
      } else {
        res.status(404).json({ error: "Conversation not found or invalid message index" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupFileRoutes(app6) {
  app6.get("/api/files/read", async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const content = await fs37.readFile(resolvedPath, "utf-8");
      res.json({ content, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/write", writeLimiter, async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === void 0) {
        res.status(400).json({ error: "Missing path or content" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      await fs37.mkdir(path38.dirname(resolvedPath), { recursive: true });
      await fs37.writeFile(resolvedPath, content, "utf-8");
      const written = await fs37.readFile(resolvedPath, "utf-8");
      if (written !== content) {
        res.status(500).json({ error: "Write verification failed" });
        return;
      }
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/edit", writeLimiter, async (req, res) => {
    try {
      const { path: filePath, oldString, newString } = req.body;
      if (!filePath || oldString === void 0 || newString === void 0) {
        res.status(400).json({ error: "Missing path, oldString, or newString" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const content = await fs37.readFile(resolvedPath, "utf-8");
      if (!content.includes(oldString)) {
        res.status(400).json({ error: "Old string not found in file" });
        return;
      }
      const newContent = content.replace(oldString, newString);
      await fs37.writeFile(resolvedPath, newContent, "utf-8");
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/list", async (req, res) => {
    try {
      const cwd = resolveWorkingDirectory(req);
      const dirPath = req.query.path || cwd;
      const resolvedPath = resolveAndSandbox(dirPath, cwd);
      const entries = await fs37.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.filter((entry) => !entry.name.startsWith(".")).map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path38.join(resolvedPath, entry.name)
      }));
      res.json({ files, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/download", async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const stat8 = await fs37.stat(resolvedPath);
      if (!stat8.isFile()) {
        res.status(400).json({ error: "Path is not a file" });
        return;
      }
      const fileName = path38.basename(resolvedPath);
      const ext = path38.extname(fileName).toLowerCase();
      const mimeTypes = {
        ".apk": "application/vnd.android.package-archive",
        ".zip": "application/zip",
        ".tar": "application/x-tar",
        ".gz": "application/gzip",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".pdf": "application/pdf"
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", stat8.size);
      const readStream = fsSync3.createReadStream(resolvedPath);
      readStream.pipe(res);
      readStream.on("error", (err) => {
        console.error("[RemoteServer] File download stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "File read error" });
        }
      });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/mkdir", async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: "Missing path" });
        return;
      }
      const resolvedPath = resolveAndSandbox(dirPath, resolveWorkingDirectory(req));
      await fs37.mkdir(resolvedPath, { recursive: true });
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/delete", destructiveLimiter, async (req, res) => {
    try {
      const { path: filePath } = req.body;
      if (!filePath) {
        res.status(400).json({ error: "Missing path" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const stat8 = await fs37.stat(resolvedPath);
      if (stat8.isDirectory()) {
        await fs37.rm(resolvedPath, { recursive: true });
      } else {
        await fs37.unlink(resolvedPath);
      }
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/search", async (req, res) => {
    try {
      const pattern = req.query.pattern || "*";
      const maxResults = Math.min(parseInt(req.query.maxResults) || 100, 500);
      const cwd = resolveWorkingDirectory(req);
      console.log(`[FileSearch] pattern=${pattern}, maxResults=${maxResults}, cwd=${cwd}`);
      const skipDirs = /* @__PURE__ */ new Set([
        "node_modules",
        ".git",
        ".gradle",
        ".dart_tool",
        ".idea",
        ".vscode",
        ".cursor",
        "__pycache__",
        ".next",
        ".cache",
        "dist",
        ".build",
        "Pods",
        "build/intermediates",
        ".svn"
      ]);
      const ext = pattern.startsWith("*.") ? pattern.slice(1).toLowerCase() : null;
      const results = [];
      async function walk(dir, relativeBase) {
        if (results.length >= maxResults)
          return;
        let entries;
        try {
          entries = await fs37.readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (results.length >= maxResults)
            break;
          if (entry.isDirectory()) {
            if (skipDirs.has(entry.name) || entry.name.startsWith("."))
              continue;
            await walk(path38.join(dir, entry.name), relativeBase ? `${relativeBase}/${entry.name}` : entry.name);
          } else if (entry.isFile()) {
            const matches = ext ? entry.name.toLowerCase().endsWith(ext) : true;
            if (matches) {
              const fullPath = path38.join(dir, entry.name);
              const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
              let size = 0;
              try {
                const fileStat = await fs37.stat(fullPath);
                size = fileStat.size;
              } catch {
              }
              results.push({ name: entry.name, path: fullPath, relativePath, size });
            }
          }
        }
      }
      await walk(cwd, "");
      console.log(`[FileSearch] Found ${results.length} files matching ${pattern} in ${cwd}`);
      if (results.length === 0) {
        console.log(`[FileSearch] No files found \u2014 workspace root was: ${cwd}`);
      }
      res.json({ files: results, pattern, cwd });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupTerminalRoutes(app6) {
  app6.post("/api/terminal/create", async (req, res) => {
    try {
      const { id, cwd, cols, rows } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing terminal id" });
        return;
      }
      const mainWindow = import_electron11.BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        res.status(500).json({ error: "No main window available" });
        return;
      }
      const terminalCwd = cwd || resolveWorkingDirectory(req);
      createTerminal(id, terminalCwd, cols || 80, rows || 24, mainWindow);
      terminalOutputs.set(id, { callbacks: /* @__PURE__ */ new Set(), buffer: [] });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/write", writeLimiter, async (req, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        res.status(400).json({ error: "Missing id or data" });
        return;
      }
      writeToTerminal(id, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/resize", async (req, res) => {
    try {
      const { id, cols, rows } = req.body;
      if (!id || cols === void 0 || rows === void 0) {
        res.status(400).json({ error: "Missing id, cols, or rows" });
        return;
      }
      resizeTerminal(id, cols, rows);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/destroy", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      destroyTerminal(id);
      terminalOutputs.delete(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/terminal/stream/:id", (req, res) => {
    const { id } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "connected", terminalId: id })}

`);
    const buffered = getTerminalBuffer(id);
    if (buffered.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "stream_delta", delta: { text: buffered } })}

`);
    }
    const onData = (data) => {
      res.write(`data: ${JSON.stringify({ type: "stream_delta", delta: { text: data } })}

`);
    };
    registerTerminalCallback(id, onData);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
      unregisterTerminalCallback(id, onData);
    });
  });
}
function setupToolRoutes(app6) {
  app6.get("/api/tools/list", async (_req, res) => {
    try {
      res.json({ tools: [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/tools/execute", async (req, res) => {
    try {
      const { toolName, input } = req.body;
      if (!toolName) {
        res.status(400).json({ error: "Missing toolName" });
        return;
      }
      res.status(501).json({ error: "Tool execution not yet implemented via remote API" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupGitRoutes(app6) {
  app6.get("/api/git/diff", async (req, res) => {
    try {
      const filePath = req.query.path;
      const staged = req.query.staged === "true";
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = path38.isAbsolute(filePath) ? filePath : path38.join(resolveWorkingDirectory(req), filePath);
      const cwd = path38.dirname(resolvedPath);
      const relativePath = path38.basename(resolvedPath);
      const git = (0, import_simple_git4.default)(cwd);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        res.json({ path: resolvedPath, changes: [], isGitRepo: false });
        return;
      }
      const diffArgs = staged ? ["--staged", "--unified=0", relativePath] : ["--unified=0", relativePath];
      const diffOutput = await git.diff(diffArgs);
      const changes = parseGitDiff(diffOutput);
      res.json({
        path: resolvedPath,
        changes,
        isGitRepo: true,
        hasChanges: changes.length > 0
      });
    } catch (error) {
      console.error("[RemoteServer] Git diff error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/git/status", async (req, res) => {
    try {
      const dirPath = req.query.path;
      console.log("[GitStatus] Request for path:", dirPath);
      if (!dirPath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = path38.isAbsolute(dirPath) ? dirPath : path38.join(resolveWorkingDirectory(req), dirPath);
      console.log("[GitStatus] Resolved path:", resolvedPath);
      const git = (0, import_simple_git4.default)(resolvedPath);
      const isRepo = await git.checkIsRepo();
      console.log("[GitStatus] Is git repo:", isRepo);
      if (!isRepo) {
        res.json({
          isGitRepo: false,
          branch: null,
          files: {}
        });
        return;
      }
      const gitRoot = (await git.revparse(["--show-toplevel"])).trim();
      console.log("[GitStatus] Git root:", gitRoot);
      const relativeRequestedDir = path38.relative(gitRoot, resolvedPath);
      console.log("[GitStatus] Relative requested dir:", relativeRequestedDir);
      const getRelPath = (gitRelPath) => {
        const normalized = gitRelPath.replace(/\\/g, "/");
        if (!relativeRequestedDir || relativeRequestedDir === ".") {
          return normalized;
        }
        const prefix = relativeRequestedDir.replace(/\\/g, "/") + "/";
        if (normalized.startsWith(prefix)) {
          return normalized.slice(prefix.length);
        }
        return null;
      };
      const gitManager = new GitManager(gitRoot);
      const status = await gitManager.statusStructured();
      console.log("[GitStatus] Raw git status - modified:", status.modified.length, "untracked:", status.not_added.length);
      const fileStatuses = {};
      const addStatus = (gitRelPath, statusValue, overwrite = true) => {
        const relPath = getRelPath(gitRelPath);
        if (relPath === null)
          return;
        if (overwrite || !(relPath in fileStatuses)) {
          fileStatuses[relPath] = statusValue;
        }
      };
      for (const file of status.not_added) {
        addStatus(file, "untracked");
      }
      for (const file of status.modified) {
        addStatus(file, "modified");
      }
      for (const file of status.staged) {
        addStatus(file, "staged", false);
      }
      for (const file of status.created) {
        addStatus(file, "staged", false);
      }
      for (const file of status.deleted) {
        addStatus(file, "deleted");
      }
      for (const rename4 of status.renamed) {
        addStatus(rename4.to, "renamed");
      }
      for (const file of status.conflicted) {
        addStatus(file, "conflicted");
      }
      console.log("[GitStatus] Response - files count:", Object.keys(fileStatuses).length);
      console.log("[GitStatus] First few files:", Object.entries(fileStatuses).slice(0, 5));
      res.json({
        isGitRepo: true,
        branch: status.current,
        files: fileStatuses
      });
    } catch (error) {
      console.error("[RemoteServer] Git status error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
async function testTcpConnection(host, port2, timeout = 1e3) {
  const net = await import("net");
  return new Promise((resolve11) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve11(false);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve11(true);
    });
    socket.once("error", onError);
    socket.once("timeout", onError);
    socket.connect(port2, host);
  });
}
async function getListeningPorts() {
  const ports = /* @__PURE__ */ new Set();
  const platform = process.platform;
  try {
    let stdout = "";
    if (platform === "darwin") {
      try {
        const { stdout: lsofOut } = await execAsync('lsof -nP -iTCP -sTCP:LISTEN | grep -E "*:([0-9]+)" | grep -oE "*:([0-9]+)" | grep -oE "[0-9]+"');
        stdout = lsofOut;
      } catch {
        const { stdout: netstatOut } = await execAsync('netstat -anv | grep LISTEN | grep -oE ".([0-9]+)" | grep -oE "[0-9]+"');
        stdout = netstatOut;
      }
    } else if (platform === "linux") {
      try {
        const { stdout: ssOut } = await execAsync('ss -tln | grep LISTEN | grep -oE ":[0-9]+" | grep -oE "[0-9]+"');
        stdout = ssOut;
      } catch {
        const { stdout: lsofOut } = await execAsync('lsof -nP -iTCP -sTCP:LISTEN | grep -oE "TCP *:[0-9]+" | grep -oE "[0-9]+"');
        stdout = lsofOut;
      }
    } else if (platform === "win32") {
      const { stdout: netstatOut } = await execAsync("netstat -ano | findstr LISTENING | findstr 127.0.0.1");
      stdout = netstatOut;
    }
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      let port2 = null;
      if (platform === "win32") {
        const match = line.match(/127\.0\.0\.1:(\d+)/);
        if (match)
          port2 = parseInt(match[1], 10);
      } else {
        port2 = parseInt(trimmed, 10);
      }
      if (port2 && !isNaN(port2) && port2 > 0 && port2 <= 65535) {
        ports.add(port2);
      }
    }
  } catch (error) {
    console.error("[RemoteServer] Error getting listening ports:", error);
  }
  return Array.from(ports).sort((a, b) => a - b);
}
function setupProxyRoutes(app6) {
  app6.post("/api/proxy/register", (req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const { port: targetPort, name } = req.body;
      if (!targetPort || typeof targetPort !== "number") {
        res.status(400).json({ error: "Missing or invalid port (must be a number)" });
        return;
      }
      const allowedPorts = settingsManager.get("remoteAccess.proxyAllowedPorts");
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }
      registeredProxyPorts.set(targetPort, {
        name: name || `localhost:${targetPort}`,
        registeredAt: Date.now()
      });
      console.log(`[RemoteServer] Registered proxy port ${targetPort} as "${name || `localhost:${targetPort}`}"`);
      res.json({ success: true, port: targetPort });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.delete("/api/proxy/:port", (req, res) => {
    try {
      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: "Invalid port" });
        return;
      }
      const deleted = registeredProxyPorts.delete(targetPort);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/proxy/list", (_req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      const ports = Array.from(registeredProxyPorts.entries()).map(([p, info]) => ({
        port: p,
        name: info.name,
        registeredAt: info.registeredAt
      }));
      res.json({ enabled: proxyEnabled, ports });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/proxy/scan", async (_req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const listeningPorts = await getListeningPorts();
      const available = [];
      for (const testPort of listeningPorts) {
        try {
          const isReachable = await testTcpConnection("localhost", testPort, 300);
          if (isReachable) {
            const registered = registeredProxyPorts.get(testPort);
            available.push({
              port: testPort,
              name: registered?.name || `localhost:${testPort}`
            });
          }
        } catch {
        }
      }
      res.json({ enabled: proxyEnabled, available });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.all("/api/proxy/:port/*", (req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: "Invalid port" });
        return;
      }
      if (!registeredProxyPorts.has(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not registered for proxying` });
        return;
      }
      const allowedPorts = settingsManager.get("remoteAccess.proxyAllowedPorts");
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }
      const prefix = `/api/proxy/${targetPort}/`;
      const downstreamPath = "/" + req.originalUrl.slice(req.originalUrl.indexOf(prefix) + prefix.length);
      const proxyHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lk = key.toLowerCase();
        if (lk === "host" || lk === "x-api-key" || lk === "connection" || lk === "accept-encoding")
          continue;
        if (typeof value === "string")
          proxyHeaders[key] = value;
      }
      proxyHeaders["host"] = `localhost:${targetPort}`;
      proxyHeaders["accept-encoding"] = "identity";
      const proxyReq = http3.request(
        {
          hostname: "localhost",
          port: targetPort,
          path: downstreamPath,
          method: req.method,
          headers: proxyHeaders
        },
        (proxyRes) => {
          const contentType = (proxyRes.headers["content-type"] || "").toLowerCase();
          const isHtml = contentType.includes("text/html");
          const isJs = contentType.includes("javascript");
          const isCss = contentType.includes("text/css");
          if (isHtml || isJs || isCss) {
            const chunks = [];
            proxyRes.on("data", (chunk) => chunks.push(chunk));
            proxyRes.on("end", () => {
              let body = Buffer.concat(chunks).toString("utf8");
              const proxyBase = `/api/proxy/${targetPort}`;
              if (isHtml) {
                const proxyResetCss = `
<style id="omni-proxy-reset">
*, *::before, *::after {
  animation-duration: 0.001ms !important;
  animation-delay: -1ms !important;
  animation-fill-mode: both !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0ms !important;
}
[style*="opacity:0"] { opacity: 1 !important; }
[style*="opacity: 0"] { opacity: 1 !important; }
[style*="transform:translate"] { transform: none !important; }
[style*="transform: translate"] { transform: none !important; }
</style>`;
                body = body.replace("</head>", `${proxyResetCss}</head>`);
                body = body.replace(
                  /((?:src|href|action|content|srcset)=["'])(\/)(?!\/)/g,
                  `$1${proxyBase}/`
                );
                body = body.replace(
                  /url\(\s*["']?(\/)(?!\/)/g,
                  `url('${proxyBase}/`
                );
                body = body.replace(
                  /(<script id="__NEXT_DATA__" type="application\/json">)([\s\S]*?)(<\/script>)/,
                  (_match, open, jsonStr, close) => {
                    try {
                      const data = JSON.parse(jsonStr);
                      data.assetPrefix = proxyBase;
                      data.basePath = proxyBase;
                      return `${open}${JSON.stringify(data)}${close}`;
                    } catch {
                      return _match;
                    }
                  }
                );
              } else if (isJs || isCss) {
                body = body.replace(
                  /(["'`])(\/(?:_next|static|images|assets|public)\/)/g,
                  `$1${proxyBase}$2`
                );
              }
              const responseHeaders = { ...proxyRes.headers };
              delete responseHeaders["content-encoding"];
              delete responseHeaders["transfer-encoding"];
              responseHeaders["content-length"] = Buffer.byteLength(body, "utf8").toString();
              if (isHtml) {
                const sessionToken = createProxySession(targetPort);
                const existing = responseHeaders["set-cookie"];
                const sessionCookie = `omni-proxy-session=${sessionToken}; Path=/api/proxy/; HttpOnly; SameSite=Strict; Max-Age=3600`;
                responseHeaders["set-cookie"] = existing ? [
                  ...Array.isArray(existing) ? existing : [existing],
                  sessionCookie
                ] : sessionCookie;
              }
              res.writeHead(proxyRes.statusCode || 502, responseHeaders);
              res.end(body, "utf8");
            });
          } else {
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
            proxyRes.pipe(res);
          }
        }
      );
      proxyReq.on("error", (err) => {
        console.error(`[RemoteServer] Proxy error for localhost:${targetPort}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: `Cannot reach localhost:${targetPort} \u2014 ${err.message}` });
        }
      });
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupAdbRoutes(app6) {
  const getAdbPath = () => {
    return settingsManager.get("adb.path") || "adb";
  };
  const isAdbEnabled = () => {
    return settingsManager.get("adb.enabled") !== false;
  };
  app6.get("/api/adb/devices", async (_req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const adb = getAdbPath();
      const { stdout } = await execAsync(`${adb} devices -l`);
      const lines = stdout.trim().split("\n").slice(1);
      const devices = lines.map((line) => line.trim()).filter((line) => line.length > 0).map((line) => {
        const parts = line.split(/\s+/);
        const id = parts[0];
        const state = parts[1];
        const props = {};
        for (let i = 2; i < parts.length; i++) {
          const kv = parts[i].split(":");
          if (kv.length === 2)
            props[kv[0]] = kv[1];
        }
        return { id, state, model: props["model"] || null, product: props["product"] || null, transport: props["transport_id"] || null };
      });
      res.json({ devices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  async function extractApkPackageName(apkPath) {
    const aaptCandidates = ["aapt", "aapt2"];
    for (const tool of aaptCandidates) {
      try {
        const { stdout } = await execAsync(`${tool} dump badging "${apkPath}" 2>/dev/null`, { timeout: 15e3 });
        const m = stdout.match(/^package:\s+name='([^']+)'/m);
        if (m) {
          console.log(`[AdbInstall] Extracted package name via ${tool}: ${m[1]}`);
          return m[1];
        }
      } catch {
      }
    }
    try {
      const { stdout } = await execAsync(`apkanalyzer manifest application-id "${apkPath}" 2>/dev/null`, { timeout: 15e3 });
      const pkg = stdout.trim();
      if (pkg && pkg.includes(".")) {
        console.log(`[AdbInstall] Extracted package name via apkanalyzer: ${pkg}`);
        return pkg;
      }
    } catch {
    }
    console.log("[AdbInstall] Could not extract package name \u2014 no aapt/aapt2/apkanalyzer found");
    return null;
  }
  app6.post("/api/adb/install", destructiveLimiter, async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { filePath, deviceId } = req.body;
      if (!filePath) {
        res.status(400).json({ error: "Missing filePath" });
        return;
      }
      if (deviceId && !DEVICE_ID_RE.test(deviceId)) {
        res.status(400).json({ error: "Invalid deviceId format" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      try {
        await fs37.access(resolvedPath);
      } catch {
        res.status(404).json({ error: `File not found: ${resolvedPath}` });
        return;
      }
      const packageName = await extractApkPackageName(resolvedPath);
      const adb = getAdbPath();
      const installArgs = deviceId ? ["-s", deviceId, "install", "-r", resolvedPath] : ["install", "-r", resolvedPath];
      const { stdout, stderr } = await execFileAsync2(adb, installArgs, { timeout: 12e4 });
      const success = stdout.includes("Success") || stdout.includes("success");
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), packageName });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/adb/launch", async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { packageName, activityName, deviceId } = req.body;
      if (!packageName) {
        res.status(400).json({ error: "Missing packageName" });
        return;
      }
      if (!PKG_RE.test(packageName)) {
        res.status(400).json({ error: "Invalid packageName format" });
        return;
      }
      if (activityName && !ACTIVITY_RE.test(activityName)) {
        res.status(400).json({ error: "Invalid activityName format" });
        return;
      }
      if (deviceId && !DEVICE_ID_RE.test(deviceId)) {
        res.status(400).json({ error: "Invalid deviceId format" });
        return;
      }
      const adb = getAdbPath();
      let launchArgs;
      if (activityName) {
        launchArgs = [
          ...deviceId ? ["-s", deviceId] : [],
          "shell",
          "am",
          "start",
          "-n",
          `${packageName}/${activityName}`
        ];
      } else {
        launchArgs = [
          ...deviceId ? ["-s", deviceId] : [],
          "shell",
          "monkey",
          "-p",
          packageName,
          "-c",
          "android.intent.category.LAUNCHER",
          "1"
        ];
      }
      const { stdout, stderr } = await execFileAsync2(adb, launchArgs);
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/adb/wireless-pair", async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { ip, port: pairingPort, pairingCode } = req.body;
      if (!ip || !pairingPort || !pairingCode) {
        res.status(400).json({ error: "Missing ip, port, or pairingCode" });
        return;
      }
      if (!IP_RE.test(String(ip))) {
        res.status(400).json({ error: "Invalid ip format" });
        return;
      }
      const portNum = parseInt(String(pairingPort), 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        res.status(400).json({ error: "Invalid port (must be 1\u201365535)" });
        return;
      }
      const adb = getAdbPath();
      const { stdout, stderr } = await new Promise(
        (resolve11, reject) => {
          const proc = (0, import_node_child_process11.spawn)(adb, ["pair", `${ip}:${portNum}`]);
          let out = "";
          let err = "";
          proc.stdout.on("data", (d) => {
            out += d.toString();
          });
          proc.stderr.on("data", (d) => {
            err += d.toString();
          });
          proc.on("close", () => resolve11({ stdout: out, stderr: err }));
          proc.on("error", reject);
          proc.stdin.write(String(pairingCode) + "\n");
          proc.stdin.end();
          setTimeout(() => proc.kill(), 3e4);
        }
      );
      const success = stdout.toLowerCase().includes("successfully paired");
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/adb/logcat", (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const packageFilter = req.query.package;
      const deviceId = req.query.deviceId;
      const adb = getAdbPath();
      const args = [];
      if (deviceId)
        args.push("-s", deviceId);
      args.push("logcat", "-v", "time");
      if (packageFilter) {
        args.push("--pid", "$(pidof " + packageFilter + ")");
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      const logcat = (0, import_node_child_process11.spawn)(adb, args);
      logcat.stdout.on("data", (data) => {
        const lines = data.toString().split("\n").filter((l) => l.trim());
        for (const line of lines) {
          res.write(`data: ${JSON.stringify({ line })}

`);
        }
      });
      logcat.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ error: data.toString() })}

`);
      });
      logcat.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ type: "closed", code })}

`);
        res.end();
      });
      const keepAlive = setInterval(() => {
        res.write(":keepalive\n\n");
      }, 3e4);
      res.on("close", () => {
        clearInterval(keepAlive);
        logcat.kill();
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupIosRoutes(app6) {
  const isIosSupported = () => process.platform === "darwin";
  function parseXctraceDevices(output) {
    const devices = [];
    const lines = output.split("\n");
    let inDevicesSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "== Devices ==") {
        inDevicesSection = true;
        continue;
      }
      if (trimmed.startsWith("==")) {
        if (inDevicesSection)
          break;
        continue;
      }
      if (!inDevicesSection || !trimmed)
        continue;
      const match = trimmed.match(/^(.+?)\s+\(([^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)\s*$/);
      if (match) {
        devices.push({ name: match[1].trim(), osVersion: match[2], udid: match[3], type: "physical" });
      }
    }
    return devices;
  }
  app6.get("/api/ios/devices", async (_req, res) => {
    console.log("[IosDevices] Request received");
    if (!isIosSupported()) {
      res.status(403).json({ error: "iOS device management requires a macOS host", devices: [] });
      return;
    }
    try {
      const { stdout } = await execAsync("xcrun xctrace list devices 2>&1", { timeout: 12e3 });
      console.log("[IosDevices] xcrun output length:", stdout.length);
      const devices = parseXctraceDevices(stdout);
      console.log(`[IosDevices] xcrun found ${devices.length} physical devices`);
      res.json({ devices, tool: "xcrun" });
      return;
    } catch (err) {
      console.warn("[IosDevices] xcrun failed:", err.message);
    }
    try {
      const { stdout } = await execAsync(
        "ios-deploy --detect --timeout 5 2>&1",
        { timeout: 12e3 }
      );
      console.log("[IosDevices] ios-deploy output:", stdout.slice(0, 300));
      const devices = [];
      const re = /Found\s+(.+?)\s+\((iOS [^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)/g;
      let m;
      while ((m = re.exec(stdout)) !== null) {
        devices.push({ name: m[1].trim(), osVersion: m[2], udid: m[3], type: "physical" });
      }
      console.log(`[IosDevices] ios-deploy found ${devices.length} devices`);
      res.json({ devices, tool: "ios-deploy" });
      return;
    } catch (err) {
      console.warn("[IosDevices] ios-deploy failed:", err.message);
    }
    try {
      const { stdout: idList } = await execAsync("idevice_id -l", { timeout: 8e3 });
      const udids = idList.trim().split("\n").filter(Boolean);
      const devices = [];
      for (const udid of udids) {
        try {
          const { stdout: info } = await execAsync(
            `ideviceinfo -u ${udid} -k DeviceName 2>/dev/null; ideviceinfo -u ${udid} -k ProductVersion 2>/dev/null`
          );
          const lines = info.trim().split("\n");
          devices.push({
            udid,
            name: lines[0]?.trim() || udid,
            osVersion: lines[1]?.trim() || "unknown",
            type: "physical"
          });
        } catch {
          devices.push({ udid, name: udid, osVersion: "unknown", type: "physical" });
        }
      }
      console.log(`[IosDevices] libimobiledevice found ${devices.length} devices`);
      res.json({ devices, tool: "libimobiledevice" });
      return;
    } catch (err) {
      console.warn("[IosDevices] libimobiledevice failed:", err.message);
    }
    console.warn("[IosDevices] No iOS tools available");
    res.status(503).json({
      error: "No iOS tools found. Install Xcode Command Line Tools: xcode-select --install, or ios-deploy: npm install -g ios-deploy, or libimobiledevice: brew install libimobiledevice",
      devices: []
    });
  });
  app6.post("/api/ios/install", destructiveLimiter, async (req, res) => {
    console.log("[IosInstall] Request received:", req.body);
    if (!isIosSupported()) {
      res.status(403).json({ error: "iOS device management requires a macOS host" });
      return;
    }
    const { filePath, deviceId } = req.body;
    if (!filePath) {
      res.status(400).json({ error: "Missing filePath" });
      return;
    }
    let resolvedPath;
    try {
      resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
    } catch (sandboxErr) {
      sendRouteError(res, sandboxErr);
      return;
    }
    try {
      await fs37.access(resolvedPath);
    } catch {
      res.status(404).json({ error: `File not found: ${resolvedPath}` });
      return;
    }
    const ext = path38.extname(resolvedPath).toLowerCase();
    if (ext !== ".ipa" && ext !== ".app") {
      res.status(400).json({ error: `Unsupported file type: ${ext}. Expected .ipa or .app` });
      return;
    }
    try {
      const deviceFlag = deviceId ? `--id ${deviceId}` : "";
      console.log(`[IosInstall] Trying ios-deploy: ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`,
        { timeout: 18e4 }
      );
      console.log("[IosInstall] ios-deploy success:", stdout.slice(0, 200));
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim(), tool: "ios-deploy" });
      return;
    } catch (e) {
      console.warn("[IosInstall] ios-deploy failed:", e.message);
    }
    try {
      const deviceFlag = deviceId ? `-u ${deviceId}` : "";
      console.log(`[IosInstall] Trying ideviceinstaller: ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`,
        { timeout: 18e4 }
      );
      const success = stdout.toLowerCase().includes("complete") || stdout.toLowerCase().includes("installcomplete");
      console.log("[IosInstall] ideviceinstaller result:", { success, stdout: stdout.slice(0, 200) });
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), tool: "ideviceinstaller" });
      return;
    } catch (e) {
      console.warn("[IosInstall] ideviceinstaller failed:", e.message);
    }
    res.status(503).json({
      error: "No iOS install tools found. Install ios-deploy: npm install -g ios-deploy, or ideviceinstaller: brew install ideviceinstaller"
    });
  });
}
function parseGitDiff(diffOutput) {
  const changes = [];
  const lines = diffOutput.split("\n");
  let currentNewLine = 0;
  let inHunk = false;
  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentNewLine = parseInt(hunkMatch[2], 10);
      inHunk = true;
      continue;
    }
    if (!inHunk)
      continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      changes.push({
        lineNumber: currentNewLine,
        type: "added"
      });
      currentNewLine++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      changes.push({
        lineNumber: currentNewLine,
        type: "deleted"
      });
    } else if (line.startsWith(" ")) {
      currentNewLine++;
    } else if (line.startsWith("diff --git")) {
      inHunk = false;
    }
  }
  return changes;
}
var import_express, import_cors, import_express_rate_limit, fs37, fsSync3, path38, http3, zlib, import_node_child_process11, import_node_util2, os6, import_electron11, import_simple_git4, gunzipAsync, inflateAsync, brotliDecompressAsync, execAsync, execFileAsync2, DEVICE_ID_RE, IP_RE, PKG_RE, ACTIVITY_RE, app5, server, tunnelProvider, isRunning, publicUrl, port, terminalOutputs, registeredProxyPorts, remoteConversationMeta, autoSaveUnsubscribe, writeLimiter, destructiveLimiter;
var init_remote_server = __esm({
  "main/remote-server.ts"() {
    import_express = __toESM(require("express"), 1);
    import_cors = __toESM(require("cors"), 1);
    import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
    init_tunnel_providers();
    init_settings();
    init_agent_bridge();
    init_remote_auth();
    init_remote_event_emitter();
    init_remote_ws();
    init_terminal_manager();
    fs37 = __toESM(require("fs/promises"), 1);
    fsSync3 = __toESM(require("fs"), 1);
    path38 = __toESM(require("path"), 1);
    http3 = __toESM(require("http"), 1);
    zlib = __toESM(require("zlib"), 1);
    import_node_child_process11 = require("child_process");
    import_node_util2 = require("util");
    os6 = __toESM(require("os"), 1);
    init_core_integration();
    init_shared_workspace_manager();
    init_ipc_handlers();
    init_chat_storage();
    import_electron11 = require("electron");
    import_simple_git4 = __toESM(require("simple-git"), 1);
    init_git_manager();
    gunzipAsync = (0, import_node_util2.promisify)(zlib.gunzip);
    inflateAsync = (0, import_node_util2.promisify)(zlib.inflate);
    brotliDecompressAsync = (0, import_node_util2.promisify)(zlib.brotliDecompress);
    execAsync = (0, import_node_util2.promisify)(import_node_child_process11.exec);
    execFileAsync2 = (0, import_node_util2.promisify)(import_node_child_process11.execFile);
    DEVICE_ID_RE = /^[a-zA-Z0-9._:+-]{1,64}$/;
    IP_RE = /^[a-zA-Z0-9._-]{1,253}$/;
    PKG_RE = /^[a-zA-Z0-9._]{1,255}$/;
    ACTIVITY_RE = /^[a-zA-Z0-9._$/]{1,255}$/;
    app5 = null;
    server = null;
    tunnelProvider = null;
    isRunning = false;
    publicUrl = null;
    port = 3e3;
    terminalOutputs = /* @__PURE__ */ new Map();
    registeredProxyPorts = /* @__PURE__ */ new Map();
    remoteConversationMeta = /* @__PURE__ */ new Map();
    autoSaveUnsubscribe = null;
    writeLimiter = (0, import_express_rate_limit.default)({
      windowMs: 6e4,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: "Write rate limit exceeded. Please slow down." });
      }
    });
    destructiveLimiter = (0, import_express_rate_limit.default)({
      windowMs: 6e4,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: "Rate limit exceeded for destructive operations." });
      }
    });
  }
});
init_remote_server();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  destructiveLimiter,
  getRemoteServerStatus,
  initializeRemoteServer,
  stopRemoteServer,
  writeLimiter
});
//# sourceMappingURL=remote-server.cjs.map