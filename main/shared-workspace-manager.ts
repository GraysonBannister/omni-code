// Shared Workspace Manager for Remote Server
// Manages which workspaces are shared/exposed via the remote access API

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { settingsManager } from './settings.js';
import { WorkspaceStorage } from './workspace-storage.js';
import type { Workspace, FolderRef } from '../src/types/workspace.js';

/**
 * Information about a shared workspace exposed to remote clients
 */
export interface SharedWorkspace {
  /** Unique identifier for this shared workspace entry */
  sharedId: string;
  /** The workspace ID from the workspace file */
  workspaceId: string;
  /** Path to the workspace file or folder */
  filePath: string;
  /** Display name */
  name: string;
  /** Number of folders in the workspace */
  folderCount: number;
  /** List of folders in this workspace */
  folders: SharedFolder[];
  /** Whether this is the currently active workspace */
  isActive: boolean;
  /** When this workspace was added to shared list */
  addedAt: number;
  /** Whether this is a single folder (not a workspace file) */
  isSingleFolder: boolean;
}

/**
 * Folder information within a shared workspace
 */
export interface SharedFolder {
  id: string;
  path: string;
  name: string;
}

/**
 * Settings structure for shared workspaces
 */
interface SharedWorkspaceSettings {
  sharedWorkspaces: SharedWorkspace[];
  activeWorkspaceId: string | null;
}

const SHARED_WORKSPACES_KEY = 'remoteAccess.sharedWorkspaces';
const ACTIVE_WORKSPACE_KEY = 'remoteAccess.activeWorkspaceId';

/**
 * Manages which workspaces are shared on the remote server
 */
export class SharedWorkspaceManager {
  private workspaceStorage: WorkspaceStorage;
  private sharedWorkspaces: SharedWorkspace[] = [];
  private activeWorkspaceId: string | null = null;
  private initialized = false;

  constructor() {
    this.workspaceStorage = new WorkspaceStorage();
  }

  /**
   * Initialize the manager - load shared workspaces from settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const shared = settingsManager.get(SHARED_WORKSPACES_KEY) as SharedWorkspace[] | undefined;
      const active = settingsManager.get(ACTIVE_WORKSPACE_KEY) as string | null | undefined;

      if (shared && Array.isArray(shared)) {
        // Validate that workspaces still exist and refresh folder info from disk
        const validWorkspaces: SharedWorkspace[] = [];
        for (const ws of shared) {
          try {
            await fs.access(ws.filePath);
            
            // Refresh folder information from disk
            if (!ws.isSingleFolder && ws.filePath.endsWith('.omnicode-workspace')) {
              // Re-read workspace file from disk to get current folders
              try {
                const content = await fs.readFile(ws.filePath, 'utf-8');
                const workspace: Workspace = JSON.parse(content);
                
                if (workspace.folders && workspace.folders.length > 0) {
                  const oldFolderCount = ws.folderCount;
                  ws.folders = workspace.folders.map(f => ({
                    id: f.id,
                    path: f.path,
                    name: f.name || path.basename(f.path),
                  }));
                  ws.folderCount = workspace.folders.length;
                  ws.name = workspace.name; // Also refresh name
                  
                  if (oldFolderCount !== ws.folderCount) {
                    console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}": ${oldFolderCount} -> ${ws.folderCount} folders`);
                  }
                }
              } catch (readError) {
                console.error(`[SharedWorkspaceManager] Failed to refresh workspace file ${ws.filePath}:`, readError);
              }
            } else if (ws.isSingleFolder) {
              // For single-folder workspaces, validate the folder still exists
              try {
                const stats = await fs.stat(ws.filePath);
                if (!stats.isDirectory()) {
                  console.log(`[SharedWorkspaceManager] Skipping non-directory: ${ws.filePath}`);
                  continue;
                }
                // Ensure folder info is correct
                if (ws.folders.length === 0) {
                  ws.folders = [{
                    id: `folder-${Date.now()}`,
                    path: ws.filePath,
                    name: ws.name || path.basename(ws.filePath),
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
            // Workspace file no longer exists, skip it
            console.log(`[SharedWorkspaceManager] Skipping missing workspace: ${ws.filePath}`);
          }
        }
        this.sharedWorkspaces = validWorkspaces;
        
        // Save updated workspace info back to settings if any changes were made
        if (this.sharedWorkspaces.length > 0) {
          await this.saveToSettings();
        }
      }

      // Validate active workspace still exists
      if (active && this.sharedWorkspaces.some(ws => ws.sharedId === active)) {
        this.activeWorkspaceId = active;
      } else if (this.sharedWorkspaces.length > 0) {
        // Default to first shared workspace
        this.activeWorkspaceId = this.sharedWorkspaces[0].sharedId;
        this.sharedWorkspaces[0].isActive = true;
      }

      this.initialized = true;
      console.log(`[SharedWorkspaceManager] Initialized with ${this.sharedWorkspaces.length} shared workspaces`);
    } catch (error) {
      console.error('[SharedWorkspaceManager] Failed to initialize:', error);
      this.sharedWorkspaces = [];
      this.activeWorkspaceId = null;
      this.initialized = true;
    }
  }

  /**
   * Get all shared workspaces
   */
  getSharedWorkspaces(): SharedWorkspace[] {
    return [...this.sharedWorkspaces];
  }

  /**
   * Refresh a specific workspace from disk
   */
  async refreshWorkspaceFromDisk(sharedId: string): Promise<boolean> {
    const ws = this.sharedWorkspaces.find(w => w.sharedId === sharedId);
    if (!ws) {
      console.log(`[SharedWorkspaceManager] Workspace not found for refresh: ${sharedId}`);
      return false;
    }

    try {
      if (!ws.isSingleFolder && ws.filePath.endsWith('.omnicode-workspace')) {
        // Re-read workspace file
        const content = await fs.readFile(ws.filePath, 'utf-8');
        const workspace: Workspace = JSON.parse(content);
        
        if (workspace.folders) {
          const oldFolderCount = ws.folderCount;
          ws.folders = workspace.folders.map(f => ({
            id: f.id,
            path: f.path,
            name: f.name || path.basename(f.path),
          }));
          ws.folderCount = workspace.folders.length;
          ws.name = workspace.name;
          
          await this.saveToSettings();
          console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}" from disk: ${oldFolderCount} -> ${ws.folderCount} folders`);
          return true;
        }
      } else if (ws.isSingleFolder) {
        // Validate single folder
        const stats = await fs.stat(ws.filePath);
        if (stats.isDirectory()) {
          if (ws.folders.length === 0) {
            ws.folders = [{
              id: `folder-${Date.now()}`,
              path: ws.filePath,
              name: ws.name || path.basename(ws.filePath),
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
  getActiveWorkspace(): SharedWorkspace | null {
    if (!this.activeWorkspaceId) return null;
    return this.sharedWorkspaces.find(ws => ws.sharedId === this.activeWorkspaceId) || null;
  }

  /**
   * Get the active workspace's working directory (first folder)
   */
  getActiveWorkingDirectory(): string | null {
    const active = this.getActiveWorkspace();
    if (!active || active.folders.length === 0) return null;
    return active.folders[0].path;
  }

  /**
   * Set the active workspace by ID
   */
  setActiveWorkspace(sharedId: string): boolean {
    const workspace = this.sharedWorkspaces.find(ws => ws.sharedId === sharedId);
    if (!workspace) {
      console.warn(`[SharedWorkspaceManager] Workspace not found: ${sharedId}`);
      return false;
    }

    // Update isActive flag on all workspaces
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
  async addWorkspaceFile(workspaceFilePath: string): Promise<SharedWorkspace | null> {
    try {
      // Validate file exists and is a workspace file
      await fs.access(workspaceFilePath);
      if (!workspaceFilePath.endsWith('.omnicode-workspace')) {
        throw new Error('Not a valid workspace file');
      }

      // Check if already shared
      const existing = this.sharedWorkspaces.find(ws => ws.filePath === workspaceFilePath);
      if (existing) {
        console.log(`[SharedWorkspaceManager] Workspace already shared: ${workspaceFilePath}`);
        return existing;
      }

      // Load workspace file
      const content = await fs.readFile(workspaceFilePath, 'utf-8');
      const workspace: Workspace = JSON.parse(content);

      // Create shared workspace entry
      const sharedWorkspace: SharedWorkspace = {
        sharedId: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: workspace.id,
        filePath: workspaceFilePath,
        name: workspace.name,
        folderCount: workspace.folders.length,
        folders: workspace.folders.map(f => ({
          id: f.id,
          path: f.path,
          name: f.name || path.basename(f.path),
        })),
        isActive: this.sharedWorkspaces.length === 0, // First one is active by default
        addedAt: Date.now(),
        isSingleFolder: false,
      };

      this.sharedWorkspaces.push(sharedWorkspace);

      // If this is the first workspace, make it active
      if (this.sharedWorkspaces.length === 1) {
        this.activeWorkspaceId = sharedWorkspace.sharedId;
      }

      await this.saveToSettings();

      console.log(`[SharedWorkspaceManager] Added workspace: ${sharedWorkspace.name}`);
      return sharedWorkspace;
    } catch (error) {
      console.error('[SharedWorkspaceManager] Failed to add workspace:', error);
      return null;
    }
  }

  /**
   * Add a single folder as a workspace (for folder-only mode)
   */
  async addFolder(folderPath: string, name?: string): Promise<SharedWorkspace | null> {
    try {
      // Validate folder exists
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      // Check if already shared
      const existing = this.sharedWorkspaces.find(ws =>
        ws.isSingleFolder && ws.filePath === folderPath
      );
      if (existing) {
        console.log(`[SharedWorkspaceManager] Folder already shared: ${folderPath}`);
        return existing;
      }

      // Create shared workspace entry for single folder
      const folderName = name || path.basename(folderPath);
      const sharedWorkspace: SharedWorkspace = {
        sharedId: `shared-folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: `folder-${Date.now()}`,
        filePath: folderPath,
        name: folderName,
        folderCount: 1,
        folders: [{
          id: `folder-${Date.now()}`,
          path: folderPath,
          name: folderName,
        }],
        isActive: this.sharedWorkspaces.length === 0,
        addedAt: Date.now(),
        isSingleFolder: true,
      };

      this.sharedWorkspaces.push(sharedWorkspace);

      if (this.sharedWorkspaces.length === 1) {
        this.activeWorkspaceId = sharedWorkspace.sharedId;
      }

      await this.saveToSettings();

      console.log(`[SharedWorkspaceManager] Added folder: ${sharedWorkspace.name}`);
      return sharedWorkspace;
    } catch (error) {
      console.error('[SharedWorkspaceManager] Failed to add folder:', error);
      return null;
    }
  }

  /**
   * Remove a workspace from the shared list
   */
  async removeWorkspace(sharedId: string): Promise<boolean> {
    const index = this.sharedWorkspaces.findIndex(ws => ws.sharedId === sharedId);
    if (index === -1) return false;

    const removed = this.sharedWorkspaces.splice(index, 1)[0];

    // If we removed the active workspace, activate another one
    if (this.activeWorkspaceId === sharedId) {
      this.activeWorkspaceId = this.sharedWorkspaces.length > 0
        ? this.sharedWorkspaces[0].sharedId
        : null;
      if (this.activeWorkspaceId) {
        const newActive = this.sharedWorkspaces.find(ws => ws.sharedId === this.activeWorkspaceId);
        if (newActive) newActive.isActive = true;
      }
    }

    await this.saveToSettings();

    console.log(`[SharedWorkspaceManager] Removed workspace: ${removed.name}`);
    return true;
  }

  /**
   * Get details for a specific shared workspace
   */
  getWorkspaceById(sharedId: string): SharedWorkspace | null {
    return this.sharedWorkspaces.find(ws => ws.sharedId === sharedId) || null;
  }

  /**
   * Get the working directory (first folder path) for a specific shared workspace.
   * Returns null if the workspace is not found or has no folders.
   */
  getWorkingDirectory(sharedId: string): string | null {
    const workspace = this.getWorkspaceById(sharedId);
    if (!workspace || workspace.folders.length === 0) return null;
    return workspace.folders[0].path;
  }

  /**
   * Sync all registered workspaces from WorkspaceStorage into the shared list.
   * Any workspace that already exists (matched by workspaceId) is skipped.
   * Newly added workspaces that have no filePath (legacy entries) are skipped.
   * After syncing, ensures at least one workspace is marked active.
   */
  async syncAllWorkspaces(): Promise<void> {
    try {
      const result = await this.workspaceStorage.listWorkspaces();
      if (result.error) {
        console.warn('[SharedWorkspaceManager] syncAllWorkspaces: WorkspaceStorage error:', result.error);
      }

      const summaries = result.workspaces ?? [];
      let added = 0;

      for (const summary of summaries) {
        // Skip if it's already in the shared list (matched by workspace ID)
        const alreadyShared = this.sharedWorkspaces.some(
          sw => sw.workspaceId === summary.id
        );
        if (alreadyShared) continue;

        // Skip entries without a file path (can't load them)
        if (!summary.filePath) continue;

        const newEntry = await this.addWorkspaceFile(summary.filePath);
        if (newEntry) {
          added++;
        }
      }

      // Ensure at least one workspace is active
      if (!this.activeWorkspaceId && this.sharedWorkspaces.length > 0) {
        const first = this.sharedWorkspaces[0];
        this.activeWorkspaceId = first.sharedId;
        first.isActive = true;
        await this.saveToSettings();
      }

      console.log(`[SharedWorkspaceManager] syncAllWorkspaces complete: added ${added}, total ${this.sharedWorkspaces.length}`);
    } catch (error) {
      console.error('[SharedWorkspaceManager] syncAllWorkspaces failed:', error);
    }
  }

  /**
   * Get folders for a specific workspace
   */
  getWorkspaceFolders(sharedId: string): SharedFolder[] {
    const workspace = this.getWorkspaceById(sharedId);
    return workspace?.folders || [];
  }

  /**
   * Set the active folder within a workspace (for navigation)
   */
  setActiveFolder(sharedId: string, folderId: string): boolean {
    const workspace = this.getWorkspaceById(sharedId);
    if (!workspace) return false;

    const folder = workspace.folders.find(f => f.id === folderId);
    if (!folder) return false;

    // Store the active folder preference (could be persisted)
    console.log(`[SharedWorkspaceManager] Set active folder for ${workspace.name}: ${folder.name}`);
    return true;
  }

  /**
   * Save current state to settings
   */
  private async saveToSettings(): Promise<void> {
    try {
      settingsManager.set(SHARED_WORKSPACES_KEY, this.sharedWorkspaces);
      settingsManager.set(ACTIVE_WORKSPACE_KEY, this.activeWorkspaceId);
    } catch (error) {
      console.error('[SharedWorkspaceManager] Failed to save settings:', error);
    }
  }

  /**
   * Clear all shared workspaces
   */
  async clearAll(): Promise<void> {
    this.sharedWorkspaces = [];
    this.activeWorkspaceId = null;
    await this.saveToSettings();
    console.log('[SharedWorkspaceManager] Cleared all shared workspaces');
  }
}

// Singleton instance
let sharedWorkspaceManager: SharedWorkspaceManager | null = null;

export function getSharedWorkspaceManager(): SharedWorkspaceManager {
  if (!sharedWorkspaceManager) {
    sharedWorkspaceManager = new SharedWorkspaceManager();
  }
  return sharedWorkspaceManager;
}

export async function initializeSharedWorkspaceManager(): Promise<void> {
  const manager = getSharedWorkspaceManager();
  await manager.initialize();
}
