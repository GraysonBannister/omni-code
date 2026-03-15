// Workspace Storage Module for omni-code-v2
// Handles persistence of workspace files and metadata

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import type {
  Workspace,
  WorkspaceSummary,
  WorkspaceOperationResult,
  CreateWorkspaceOptions,
  FolderRef,
} from '../src/types/workspace.js';
import {
  WORKSPACE_VERSION,
  WORKSPACE_FILE_EXTENSION,
  createWorkspace,
  getWorkspaceStorageKey,
} from '../src/types/workspace.js';

// Workspace metadata stored in app data
const WORKSPACES_DIR = 'workspaces';
const WORKSPACE_METADATA_FILE = 'metadata.json';

/**
 * Metadata entry for a saved workspace
 */
interface WorkspaceMetadata {
  id: string;
  filePath?: string;
  lastOpenedAt?: number;
  isExported?: boolean;
}

/**
 * Workspace storage handles persisting workspace files and managing workspace metadata
 */
export class WorkspaceStorage {
  private workspacesDir: string | null = null;

  /**
   * Get the workspaces directory in app data
   */
  private async getWorkspacesDir(): Promise<string> {
    if (this.workspacesDir) return this.workspacesDir;

    const userData = app.getPath('userData');
    this.workspacesDir = path.join(userData, WORKSPACES_DIR);
    await fs.mkdir(this.workspacesDir, { recursive: true });
    return this.workspacesDir;
  }

  /**
   * Get the storage path for a specific workspace's app data
   */
  async getWorkspaceStoragePath(workspaceId: string): Promise<string> {
    const workspacesDir = await this.getWorkspacesDir();
    const storagePath = path.join(workspacesDir, workspaceId);
    await fs.mkdir(storagePath, { recursive: true });
    return storagePath;
  }

  /**
   * Get the metadata file path
   */
  private async getMetadataPath(): Promise<string> {
    const workspacesDir = await this.getWorkspacesDir();
    return path.join(workspacesDir, WORKSPACE_METADATA_FILE);
  }

  /**
   * Load all workspace metadata
   */
  private async loadMetadata(): Promise<Map<string, WorkspaceMetadata>> {
    try {
      const metadataPath = await this.getMetadataPath();
      const content = await fs.readFile(metadataPath, 'utf-8');
      const data = JSON.parse(content) as Record<string, WorkspaceMetadata>;
      return new Map(Object.entries(data));
    } catch {
      // No metadata file yet, return empty map
      return new Map();
    }
  }

  /**
   * Save workspace metadata
   */
  private async saveMetadata(metadata: Map<string, WorkspaceMetadata>): Promise<void> {
    const metadataPath = await this.getMetadataPath();
    const data = Object.fromEntries(metadata);
    await fs.writeFile(metadataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(options: CreateWorkspaceOptions): Promise<WorkspaceOperationResult> {
    try {
      const workspace = createWorkspace(options);

      // Ensure workspace has a folder in app data
      await this.getWorkspaceStoragePath(workspace.id);

      // Save to metadata
      const metadata = await this.loadMetadata();
      metadata.set(workspace.id, {
        id: workspace.id,
        lastOpenedAt: Date.now(),
      });
      await this.saveMetadata(metadata);

      return { success: true, workspace };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to create workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Save a workspace to a file
   */
  async saveWorkspaceToFile(workspace: Workspace, filePath: string): Promise<WorkspaceOperationResult> {
    try {
      // Ensure the file has the correct extension
      let targetPath = filePath;
      if (!targetPath.endsWith(WORKSPACE_FILE_EXTENSION)) {
        targetPath = `${targetPath}${WORKSPACE_FILE_EXTENSION}`;
      }

      // Update the workspace
      const updatedWorkspace: Workspace = {
        ...workspace,
        updatedAt: Date.now(),
      };

      // Write to temp file first, then rename for atomic operation
      const tempPath = `${targetPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), 'utf-8');
      await fs.rename(tempPath, targetPath);

      // Update metadata with file path
      const metadata = await this.loadMetadata();
      const existing = metadata.get(workspace.id) || { id: workspace.id };
      metadata.set(workspace.id, {
        ...existing,
        filePath: targetPath,
      });
      await this.saveMetadata(metadata);

      return { success: true, workspace: updatedWorkspace };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to save workspace to file:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Load a workspace from a file
   */
  async loadWorkspaceFromFile(filePath: string): Promise<WorkspaceOperationResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const workspace = JSON.parse(content) as Workspace;

      // Validate workspace structure
      if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
        return { success: false, error: 'Invalid workspace file format' };
      }

      // Normalize folder paths to absolute paths
      const baseDir = path.dirname(filePath);
      workspace.folders = workspace.folders.map((folder: FolderRef) => ({
        ...folder,
        path: path.isAbsolute(folder.path) ? folder.path : path.resolve(baseDir, folder.path),
      }));

      // Update metadata
      const metadata = await this.loadMetadata();
      const existing = metadata.get(workspace.id) || { id: workspace.id };
      metadata.set(workspace.id, {
        ...existing,
        filePath: filePath,
        lastOpenedAt: Date.now(),
      });
      await this.saveMetadata(metadata);

      // Ensure storage directory exists
      await this.getWorkspaceStoragePath(workspace.id);

      return { success: true, workspace };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to load workspace from file:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Load a workspace by ID (from app data storage)
   */
  async loadWorkspaceById(workspaceId: string): Promise<WorkspaceOperationResult> {
    try {
      const metadata = await this.loadMetadata();
      const meta = metadata.get(workspaceId);

      if (!meta) {
        return { success: false, error: 'Workspace not found' };
      }

      // If there's a file path, load from file
      if (meta.filePath) {
        return this.loadWorkspaceFromFile(meta.filePath);
      }

      // Otherwise, this is an in-memory only workspace (shouldn't happen normally)
      return { success: false, error: 'Workspace has no saved file' };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to load workspace by ID:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update an existing workspace
   */
  async updateWorkspace(workspace: Workspace): Promise<WorkspaceOperationResult> {
    try {
      const updatedWorkspace: Workspace = {
        ...workspace,
        updatedAt: Date.now(),
      };

      // If there's a file path, save to file
      const metadata = await this.loadMetadata();
      const meta = metadata.get(workspace.id);

      if (meta?.filePath) {
        const tempPath = `${meta.filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), 'utf-8');
        await fs.rename(tempPath, meta.filePath);
      }

      metadata.set(workspace.id, {
        ...meta,
        id: workspace.id,
        lastOpenedAt: Date.now(),
      });
      await this.saveMetadata(metadata);

      return { success: true, workspace: updatedWorkspace };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to update workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all saved workspaces
   */
  async listWorkspaces(): Promise<{ workspaces: WorkspaceSummary[]; error?: string }> {
    try {
      const metadata = await this.loadMetadata();
      const workspaces: WorkspaceSummary[] = [];

      for (const [id, meta] of metadata) {
        try {
          // Try to load the workspace to get current info
          let workspace: Workspace | undefined;

          if (meta.filePath) {
            const result = await this.loadWorkspaceFromFile(meta.filePath);
            if (result.success && result.workspace) {
              workspace = result.workspace;
            }
          }

          workspaces.push({
            id,
            name: workspace?.name || 'Unknown',
            folderCount: workspace?.folders?.length || 0,
            filePath: meta.filePath,
            lastOpenedAt: meta.lastOpenedAt,
          });
        } catch (error) {
          console.warn(`[WorkspaceStorage] Failed to load workspace ${id}:`, error);
          // Include workspace with minimal info
          workspaces.push({
            id,
            name: 'Unknown',
            folderCount: 0,
            filePath: meta.filePath,
            lastOpenedAt: meta.lastOpenedAt,
          });
        }
      }

      // Sort by last opened, most recent first
      workspaces.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));

      return { workspaces };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to list workspaces:', error);
      return { workspaces: [], error: (error as Error).message };
    }
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string, deleteData: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const metadata = await this.loadMetadata();
      const meta = metadata.get(workspaceId);

      if (!meta) {
        return { success: false, error: 'Workspace not found' };
      }

      // Delete workspace file if it exists
      if (meta.filePath) {
        try {
          await fs.unlink(meta.filePath);
        } catch {
          // File might not exist, that's okay
        }
      }

      // Delete workspace data if requested
      if (deleteData) {
        const storagePath = await this.getWorkspaceStoragePath(workspaceId);
        try {
          await fs.rm(storagePath, { recursive: true, force: true });
        } catch {
          // Directory might not exist, that's okay
        }
      }

      // Remove from metadata
      metadata.delete(workspaceId);
      await this.saveMetadata(metadata);

      return { success: true };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to delete workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Export a workspace with its data (chats, index, etc.)
   */
  async exportWorkspace(workspaceId: string, targetDir: string): Promise<{ success: boolean; error?: string; filePath?: string }> {
    try {
      const metadata = await this.loadMetadata();
      const meta = metadata.get(workspaceId);

      if (!meta) {
        return { success: false, error: 'Workspace not found' };
      }

      // Load the workspace
      const result = await this.loadWorkspaceById(workspaceId);
      if (!result.success || !result.workspace) {
        return { success: false, error: result.error || 'Failed to load workspace' };
      }

      const workspace = result.workspace;

      // Create export directory
      const exportDir = path.join(targetDir, `${workspace.name}-workspace`);
      await fs.mkdir(exportDir, { recursive: true });

      // Save workspace file with updated paths
      const exportWorkspace: Workspace = {
        ...workspace,
        folders: workspace.folders.map(f => ({
          ...f,
          path: path.relative(exportDir, f.path),
        })),
      };

      const workspaceFilePath = path.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
      await fs.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), 'utf-8');

      // Copy workspace data (chats, index)
      const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
      const targetStoragePath = path.join(exportDir, 'workspace-data');

      try {
        await fs.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
      } catch {
        // Source might not exist, that's okay
      }

      // Update metadata
      metadata.set(workspaceId, {
        ...meta,
        isExported: true,
      });
      await this.saveMetadata(metadata);

      return { success: true, filePath: workspaceFilePath };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to export workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Import a workspace from an exported directory
   */
  async importWorkspace(sourceDir: string): Promise<WorkspaceOperationResult> {
    try {
      // Find the workspace file in the source directory
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      const workspaceFile = entries.find(
        e => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
      );

      if (!workspaceFile) {
        return { success: false, error: 'No workspace file found in source directory' };
      }

      const workspaceFilePath = path.join(sourceDir, workspaceFile.name);
      const result = await this.loadWorkspaceFromFile(workspaceFilePath);

      if (!result.success || !result.workspace) {
        return result;
      }

      const workspace = result.workspace;

      // Copy workspace data if it exists
      const sourceDataPath = path.join(sourceDir, 'workspace-data');
      try {
        await fs.access(sourceDataPath);
        const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
        await fs.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
      } catch {
        // No data directory to copy
      }

      return { success: true, workspace };
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to import workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Add a folder to a workspace
   */
  async addFolderToWorkspace(workspaceId: string, folderPath: string, folderName?: string): Promise<WorkspaceOperationResult> {
    try {
      const result = await this.loadWorkspaceById(workspaceId);
      if (!result.success || !result.workspace) {
        return result;
      }

      const workspace = result.workspace;

      // Check if folder already exists
      const exists = workspace.folders.some(f => f.path === folderPath);
      if (exists) {
        return { success: false, error: 'Folder already in workspace' };
      }

      // Add the folder
      const newFolder: FolderRef = {
        id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        path: folderPath,
        name: folderName || path.basename(folderPath),
      };

      workspace.folders.push(newFolder);

      // Save the updated workspace
      return this.updateWorkspace(workspace);
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to add folder to workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Remove a folder from a workspace
   */
  async removeFolderFromWorkspace(workspaceId: string, folderId: string): Promise<WorkspaceOperationResult> {
    try {
      const result = await this.loadWorkspaceById(workspaceId);
      if (!result.success || !result.workspace) {
        return result;
      }

      const workspace = result.workspace;

      // Remove the folder
      workspace.folders = workspace.folders.filter(f => f.id !== folderId);

      // Save the updated workspace
      return this.updateWorkspace(workspace);
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to remove folder from workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Rename a workspace
   */
  async renameWorkspace(workspaceId: string, newName: string): Promise<WorkspaceOperationResult> {
    try {
      const result = await this.loadWorkspaceById(workspaceId);
      if (!result.success || !result.workspace) {
        return result;
      }

      const workspace = result.workspace;
      workspace.name = newName;

      // Save the updated workspace
      const updateResult = await this.updateWorkspace(workspace);

      // If there's a file, rename it too
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
              filePath: newPath,
            });
            await this.saveMetadata(metadata);
          } catch {
            // Rename failed, but workspace was updated
          }
        }
      }

      return updateResult;
    } catch (error) {
      console.error('[WorkspaceStorage] Failed to rename workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Singleton instance
let workspaceStorage: WorkspaceStorage | null = null;

export function getWorkspaceStorage(): WorkspaceStorage {
  if (!workspaceStorage) {
    workspaceStorage = new WorkspaceStorage();
  }
  return workspaceStorage;
}

export function resetWorkspaceStorage(): void {
  workspaceStorage = null;
}
