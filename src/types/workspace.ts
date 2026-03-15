// Workspace type definitions for omni-code-v2
// Defines the data models for multi-project workspaces

// Workspace file format version
export const WORKSPACE_VERSION = '1.0.0';
export const WORKSPACE_FILE_EXTENSION = '.omnicode-workspace';

/**
 * Reference to a folder/project within a workspace
 */
export interface FolderRef {
  /** Unique identifier for this folder reference */
  id: string;
  /** Absolute or relative path to the folder */
  path: string;
  /** Display name for this folder (optional, defaults to folder name) */
  name?: string;
}

/**
 * AI/Agent settings at workspace level
 */
export interface WorkspaceAISettings {
  /** Default provider for this workspace */
  provider?: string;
  /** Default model for this workspace */
  model?: string;
  /** Temperature override */
  temperature?: number;
  /** Max context tokens override */
  maxContextTokens?: number;
}

/**
 * Indexing settings at workspace level
 */
export interface WorkspaceIndexingSettings {
  /** Auto-index when opening workspace */
  autoIndex?: boolean;
  /** Auto-sync index periodically */
  autoSync?: boolean;
  /** Sync interval in minutes */
  syncIntervalMinutes?: number;
  /** Patterns to exclude from indexing */
  excludePatterns?: string[];
}

/**
 * Settings specific to a workspace
 * These override global settings but can be overridden by project-level settings
 */
export interface WorkspaceSettings {
  /** AI/Agent configuration */
  ai?: WorkspaceAISettings;
  /** Indexing configuration */
  indexing?: WorkspaceIndexingSettings;
  /** File exclusion patterns */
  excludePatterns?: string[];
}

/**
 * Summary information about a workspace (for listing)
 */
export interface WorkspaceSummary {
  id: string;
  name: string;
  folderCount: number;
  filePath?: string;
  lastOpenedAt?: number;
}

/**
 * Complete workspace data structure
 * This is what gets saved to .omnicode-workspace files
 */
export interface Workspace {
  /** Workspace format version */
  version: string;
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Folders/projects in this workspace */
  folders: FolderRef[];
  /** Workspace-level settings */
  settings?: WorkspaceSettings;
  /** When the workspace was created */
  createdAt: number;
  /** When the workspace was last modified */
  updatedAt: number;
}

/**
 * Workspace with additional runtime state (not persisted)
 */
export interface WorkspaceWithState extends Workspace {
  /** Absolute path to the workspace file (if saved) */
  filePath?: string;
  /** Whether this workspace has unsaved changes */
  isDirty?: boolean;
  /** Currently active folder within the workspace */
  activeFolderId?: string | null;
}

/**
 * Result of workspace operations
 */
export interface WorkspaceOperationResult {
  success: boolean;
  error?: string;
  workspace?: Workspace;
}

/**
 * Options for creating a new workspace
 */
export interface CreateWorkspaceOptions {
  name: string;
  folders?: string[];
  settings?: WorkspaceSettings;
}

/**
 * Runtime context for workspace-aware operations
 * Used to route storage and indexing to the correct location
 */
export interface WorkspaceContext {
  /** The workspace being operated on */
  workspace: Workspace;
  /** Storage key for app data (derived from workspace id) */
  storageKey: string;
  /** Whether to use workspace storage or project storage */
  useWorkspaceStorage: boolean;
}

/**
 * Default empty workspace settings
 */
export const defaultWorkspaceSettings: WorkspaceSettings = {
  ai: {},
  indexing: {},
  excludePatterns: [],
};

/**
 * Create a new workspace with default values
 */
export function createWorkspace(options: CreateWorkspaceOptions): Workspace {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path, index) => ({
      id: `folder-${index}-${now}`,
      path,
    })),
    settings: options.settings || {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate a unique workspace ID
 */
function generateWorkspaceId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get the storage key for a workspace (used in app data paths)
 */
export function getWorkspaceStorageKey(workspaceId: string): string {
  return workspaceId;
}

/**
 * Check if a file path is a workspace file
 */
export function isWorkspaceFile(filePath: string): boolean {
  return filePath.endsWith(WORKSPACE_FILE_EXTENSION);
}

/**
 * Get workspace file filter for dialog boxes
 */
export function getWorkspaceFileFilter() {
  return {
    name: 'Omni Code Workspace',
    extensions: ['omnicode-workspace'],
  };
}
