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

// main/workspace-storage.ts
var workspace_storage_exports = {};
__export(workspace_storage_exports, {
  WorkspaceStorage: () => WorkspaceStorage,
  getWorkspaceStorage: () => getWorkspaceStorage,
  resetWorkspaceStorage: () => resetWorkspaceStorage
});
module.exports = __toCommonJS(workspace_storage_exports);
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);
var import_electron = require("electron");

// src/types/workspace.ts
var WORKSPACE_VERSION = "1.0.0";
var WORKSPACE_FILE_EXTENSION = ".omnicode-workspace";
function createWorkspace(options) {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path2, index) => ({
      id: `folder-${index}-${now}`,
      path: path2
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
    const userData = import_electron.app.getPath("userData");
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
var workspaceStorage = null;
function getWorkspaceStorage() {
  if (!workspaceStorage) {
    workspaceStorage = new WorkspaceStorage();
  }
  return workspaceStorage;
}
function resetWorkspaceStorage() {
  workspaceStorage = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WorkspaceStorage,
  getWorkspaceStorage,
  resetWorkspaceStorage
});
//# sourceMappingURL=workspace-storage.cjs.map