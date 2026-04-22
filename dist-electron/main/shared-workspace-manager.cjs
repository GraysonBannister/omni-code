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

// main/shared-workspace-manager.ts
var shared_workspace_manager_exports = {};
__export(shared_workspace_manager_exports, {
  SharedWorkspaceManager: () => SharedWorkspaceManager,
  getSharedWorkspaceManager: () => getSharedWorkspaceManager,
  initializeSharedWorkspaceManager: () => initializeSharedWorkspaceManager
});
module.exports = __toCommonJS(shared_workspace_manager_exports);
var fs2 = __toESM(require("fs/promises"), 1);
var path2 = __toESM(require("path"), 1);

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
  get: (path3) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.get(path3);
  },
  getAll: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getAll();
  },
  set: (path3, value) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.set(path3, value);
  },
  reset: (path3) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.reset(path3);
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

// main/workspace-storage.ts
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);
var import_electron2 = require("electron");

// src/types/workspace.ts
var WORKSPACE_VERSION = "1.0.0";
var WORKSPACE_FILE_EXTENSION = ".omnicode-workspace";
function createWorkspace(options) {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path3, index) => ({
      id: `folder-${index}-${now}`,
      path: path3
    })),
    settings: options.settings || {},
    createdAt: now,
    updatedAt: now
  };
}
function generateWorkspaceId() {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// main/workspace-storage.ts
var WORKSPACES_DIR = "workspaces";
var WORKSPACE_METADATA_FILE = "metadata.json";
var WorkspaceStorage = class {
  workspacesDir = null;
  /**
   * Get the workspaces directory in app data
   */
  async getWorkspacesDir() {
    if (this.workspacesDir)
      return this.workspacesDir;
    const userData = import_electron2.app.getPath("userData");
    this.workspacesDir = path.join(userData, WORKSPACES_DIR);
    await fs.mkdir(this.workspacesDir, { recursive: true });
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
      const storagePath = path.join(workspacesDir, workspaceId);
      console.log("[WorkspaceStorage] Creating storage directory:", storagePath);
      await fs.mkdir(storagePath, { recursive: true });
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
    return path.join(workspacesDir, WORKSPACE_METADATA_FILE);
  }
  /**
   * Load all workspace metadata
   */
  async loadMetadata() {
    console.log("[WorkspaceStorage] loadMetadata called");
    try {
      const metadataPath = await this.getMetadataPath();
      console.log("[WorkspaceStorage] Loading metadata from:", metadataPath);
      const content = await fs.readFile(metadataPath, "utf-8");
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
      await fs.writeFile(metadataPath, jsonData, "utf-8");
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
      await fs.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
      await fs.rename(tempPath, targetPath);
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
      const content = await fs.readFile(filePath, "utf-8");
      const workspace = JSON.parse(content);
      if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
        return { success: false, error: "Invalid workspace file format" };
      }
      const baseDir = path.dirname(filePath);
      workspace.folders = workspace.folders.map((folder) => ({
        ...folder,
        path: path.isAbsolute(folder.path) ? folder.path : path.resolve(baseDir, folder.path)
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
        await fs.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
        await fs.rename(tempPath, meta.filePath);
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
          await fs.unlink(meta.filePath);
        } catch {
        }
      }
      if (deleteData) {
        const storagePath = await this.getWorkspaceStoragePath(workspaceId);
        try {
          await fs.rm(storagePath, { recursive: true, force: true });
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
      const exportDir = path.join(targetDir, `${workspace.name}-workspace`);
      await fs.mkdir(exportDir, { recursive: true });
      const exportWorkspace = {
        ...workspace,
        folders: workspace.folders.map((f) => ({
          ...f,
          path: path.relative(exportDir, f.path)
        }))
      };
      const workspaceFilePath = path.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
      await fs.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), "utf-8");
      const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
      const targetStoragePath = path.join(exportDir, "workspace-data");
      try {
        await fs.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
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
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      const workspaceFile = entries.find(
        (e) => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
      );
      if (!workspaceFile) {
        return { success: false, error: "No workspace file found in source directory" };
      }
      const workspaceFilePath = path.join(sourceDir, workspaceFile.name);
      const result = await this.loadWorkspaceFromFile(workspaceFilePath);
      if (!result.success || !result.workspace) {
        return result;
      }
      const workspace = result.workspace;
      const sourceDataPath = path.join(sourceDir, "workspace-data");
      try {
        await fs.access(sourceDataPath);
        const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
        await fs.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
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
        name: folderName || path.basename(folderPath)
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
          const dir = path.dirname(oldPath);
          const newPath = path.join(dir, `${newName}${WORKSPACE_FILE_EXTENSION}`);
          try {
            await fs.rename(oldPath, newPath);
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

// main/shared-workspace-manager.ts
var SHARED_WORKSPACES_KEY = "remoteAccess.sharedWorkspaces";
var ACTIVE_WORKSPACE_KEY = "remoteAccess.activeWorkspaceId";
var SharedWorkspaceManager = class {
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
            await fs2.access(ws.filePath);
            if (!ws.isSingleFolder && ws.filePath.endsWith(".omnicode-workspace")) {
              try {
                const content = await fs2.readFile(ws.filePath, "utf-8");
                const workspace = JSON.parse(content);
                if (workspace.folders && workspace.folders.length > 0) {
                  const oldFolderCount = ws.folderCount;
                  ws.folders = workspace.folders.map((f) => ({
                    id: f.id,
                    path: f.path,
                    name: f.name || path2.basename(f.path)
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
                const stats = await fs2.stat(ws.filePath);
                if (!stats.isDirectory()) {
                  console.log(`[SharedWorkspaceManager] Skipping non-directory: ${ws.filePath}`);
                  continue;
                }
                if (ws.folders.length === 0) {
                  ws.folders = [{
                    id: `folder-${Date.now()}`,
                    path: ws.filePath,
                    name: ws.name || path2.basename(ws.filePath)
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
        const content = await fs2.readFile(ws.filePath, "utf-8");
        const workspace = JSON.parse(content);
        if (workspace.folders) {
          const oldFolderCount = ws.folderCount;
          ws.folders = workspace.folders.map((f) => ({
            id: f.id,
            path: f.path,
            name: f.name || path2.basename(f.path)
          }));
          ws.folderCount = workspace.folders.length;
          ws.name = workspace.name;
          await this.saveToSettings();
          console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}" from disk: ${oldFolderCount} -> ${ws.folderCount} folders`);
          return true;
        }
      } else if (ws.isSingleFolder) {
        const stats = await fs2.stat(ws.filePath);
        if (stats.isDirectory()) {
          if (ws.folders.length === 0) {
            ws.folders = [{
              id: `folder-${Date.now()}`,
              path: ws.filePath,
              name: ws.name || path2.basename(ws.filePath)
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
      await fs2.access(workspaceFilePath);
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
      const content = await fs2.readFile(workspaceFilePath, "utf-8");
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
          name: f.name || path2.basename(f.path)
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
      const stats = await fs2.stat(folderPath);
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
      const folderName = name || path2.basename(folderPath);
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
        folderPaths.map((fp) => fs2.mkdir(path2.join(fp, ".omnicode"), { recursive: true }).catch((e) => {
          console.warn(`[SharedWorkspaceManager] Could not create .omnicode in ${fp}:`, e.message);
        }))
      );
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = path2.join(storageDir, `${safeName}.omnicode-workspace`);
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
var sharedWorkspaceManager = null;
function getSharedWorkspaceManager() {
  if (!sharedWorkspaceManager) {
    sharedWorkspaceManager = new SharedWorkspaceManager();
  }
  return sharedWorkspaceManager;
}
async function initializeSharedWorkspaceManager() {
  const manager = getSharedWorkspaceManager();
  await manager.initialize();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SharedWorkspaceManager,
  getSharedWorkspaceManager,
  initializeSharedWorkspaceManager
});
//# sourceMappingURL=shared-workspace-manager.cjs.map