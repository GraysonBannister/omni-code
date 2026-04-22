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
    const workspacesDir = await this.getWorkspacesDir();
    const storagePath = path.join(workspacesDir, workspaceId);
    await fs.mkdir(storagePath, { recursive: true });
    return storagePath;
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
    try {
      const metadataPath = await this.getMetadataPath();
      const content = await fs.readFile(metadataPath, "utf-8");
      const data = JSON.parse(content);
      return new Map(Object.entries(data));
    } catch {
      return /* @__PURE__ */ new Map();
    }
  }
  /**
   * Save workspace metadata
   */
  async saveMetadata(metadata) {
    const metadataPath = await this.getMetadataPath();
    const data = Object.fromEntries(metadata);
    await fs.writeFile(metadataPath, JSON.stringify(data, null, 2), "utf-8");
  }
  /**
   * Create a new workspace
   */
  async createWorkspace(options) {
    try {
      const workspace = createWorkspace(options);
      await this.getWorkspaceStoragePath(workspace.id);
      const metadata = await this.loadMetadata();
      metadata.set(workspace.id, {
        id: workspace.id,
        lastOpenedAt: Date.now()
      });
      await this.saveMetadata(metadata);
      return { success: true, workspace };
    } catch (error) {
      console.error("[WorkspaceStorage] Failed to create workspace:", error);
      return { success: false, error: error.message };
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
            validWorkspaces.push(ws);
          } catch {
            console.log(`[SharedWorkspaceManager] Skipping missing workspace: ${ws.filePath}`);
          }
        }
        this.sharedWorkspaces = validWorkspaces;
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
    try {
      await fs2.access(workspaceFilePath);
      if (!workspaceFilePath.endsWith(".omnicode-workspace")) {
        throw new Error("Not a valid workspace file");
      }
      const existing = this.sharedWorkspaces.find((ws) => ws.filePath === workspaceFilePath);
      if (existing) {
        console.log(`[SharedWorkspaceManager] Workspace already shared: ${workspaceFilePath}`);
        return existing;
      }
      const content = await fs2.readFile(workspaceFilePath, "utf-8");
      const workspace = JSON.parse(content);
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
      this.sharedWorkspaces.push(sharedWorkspace);
      if (this.sharedWorkspaces.length === 1) {
        this.activeWorkspaceId = sharedWorkspace.sharedId;
      }
      await this.saveToSettings();
      console.log(`[SharedWorkspaceManager] Added workspace: ${sharedWorkspace.name}`);
      return sharedWorkspace;
    } catch (error) {
      console.error("[SharedWorkspaceManager] Failed to add workspace:", error);
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
        console.log(`[SharedWorkspaceManager] Folder already shared: ${folderPath}`);
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