/**
 * Workspace Indexer Service
 *
 * Multi-project indexing orchestrator that:
 * - Indexes multiple projects within a workspace
 * - Provides unified semantic search across all projects
 * - Tracks indexing progress per project
 * - Stores index in workspace's app data location
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import fg from 'fast-glob';
import { SemanticMemory } from './semantic-memory.js';
import { SmartChunker, type CodeChunk } from './smart-chunker.js';
import type { MemoryChunk } from './persistent-store.js';
import type { Workspace, FolderRef } from '../types/workspace.js';

export type WorkspaceIndexingStatus = 'idle' | 'indexing' | 'complete' | 'error' | 'paused';

export interface WorkspaceIndexingState {
  status: WorkspaceIndexingStatus;
  progress: number; // 0-100
  totalFiles: number;
  processedFiles: number;
  indexedChunks: number;
  lastSyncAt: number | null;
  lastError: string | null;
  isSemanticSearchReady: boolean;
  perProjectState: Record<string, {
    status: 'pending' | 'indexing' | 'complete' | 'error';
    processedFiles: number;
    totalFiles: number;
  }>;
}

export interface WorkspaceIndexStatusFile {
  version: number;
  workspaceId: string;
  state: WorkspaceIndexingState;
  indexedFiles: string[];
  fileTimestamps: Record<string, number>;
  projectTimestamps: Record<string, number>; // Last index time per project
}

export interface SearchResult extends MemoryChunk {
  projectId?: string;
  projectName?: string;
  relativePath?: string;
}

const INDEX_VERSION = 1;
const SEMANTIC_SEARCH_THRESHOLD = 80;
const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;

interface IndexingConfig {
  autoIndex: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
  chunkSize: number;
  useSemanticChunking: boolean;
  maxChunkSize: number;
  maxFilesToIndex: number;
  maxFileSizeBytes: number;
  excludePatterns: string[];
  embeddingBatchSize: number;
  indexConcurrency: number;
}

const DEFAULT_INDEXING_CONFIG: IndexingConfig = {
  autoIndex: true,
  autoSync: true,
  syncIntervalMinutes: 5,
  chunkSize: 20,
  useSemanticChunking: true,
  maxChunkSize: 2000,
  maxFilesToIndex: 500,
  maxFileSizeBytes: 1024 * 1024,
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    '.cache/**',
  ],
  embeddingBatchSize: 10,
  indexConcurrency: 4,
};

/**
 * WorkspaceIndexer handles semantic indexing across multiple projects
 */
export class WorkspaceIndexer {
  private workspace: Workspace;
  private semanticMemory: SemanticMemory | null = null;
  private smartChunker: SmartChunker;
  private config: IndexingConfig;
  private state: WorkspaceIndexingState;
  private statusFilePath: string;
  private indexDir: string;
  private fileTimestamps: Map<string, number> = new Map();
  private indexedFiles: Set<string> = new Set();
  private projectTimestamps: Map<string, number> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private isDestroyed = false;

  // Callbacks for status updates
  onStatusChange?: (state: WorkspaceIndexingState) => void;
  onProgress?: (processed: number, total: number, projectId?: string) => void;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
    this.config = { ...DEFAULT_INDEXING_CONFIG };
    this.smartChunker = new SmartChunker(
      this.config.maxChunkSize,
      this.config.chunkSize
    );
    // Store index in app data
    const workspacesDir = path.join(app.getPath('userData'), 'workspaces');
    this.indexDir = path.join(workspacesDir, workspace.id, 'index');
    this.statusFilePath = path.join(this.indexDir, 'status.json');
    this.state = {
      status: 'idle',
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      indexedChunks: 0,
      lastSyncAt: null,
      lastError: null,
      isSemanticSearchReady: false,
      perProjectState: {},
    };
  }

  async initialize(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('WorkspaceIndexer has been destroyed');
    }

    // Ensure index directory exists
    await fs.mkdir(this.indexDir, { recursive: true });

    // Initialize semantic memory
    this.semanticMemory = await SemanticMemory.create(this.indexDir);

    // Load previous status if exists
    await this.loadStatus();
  }

  async loadStatus(): Promise<void> {
    try {
      const exists = await fs.access(this.statusFilePath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.statusFilePath, 'utf-8');
        const status: WorkspaceIndexStatusFile = JSON.parse(content);

        if (status.version === INDEX_VERSION && status.workspaceId === this.workspace.id) {
          this.state = status.state;
          this.indexedFiles = new Set(status.indexedFiles);

          // Restore timestamps
          this.fileTimestamps.clear();
          for (const [file, timestamp] of Object.entries(status.fileTimestamps)) {
            this.fileTimestamps.set(file, timestamp);
          }

          // Restore project timestamps
          this.projectTimestamps.clear();
          for (const [project, timestamp] of Object.entries(status.projectTimestamps || {})) {
            this.projectTimestamps.set(project, timestamp);
          }

          // Check if index is stale
          if (this.state.lastSyncAt) {
            const hoursSinceSync = (Date.now() - this.state.lastSyncAt) / (1000 * 60 * 60);
            if (hoursSinceSync > 24 && this.config.autoIndex) {
              console.log('[WorkspaceIndexer] Index is stale, will reindex');
              this.state.status = 'idle';
              this.state.progress = 0;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[WorkspaceIndexer] Failed to load status:', error);
      this.resetState();
    }
  }

  async saveStatus(): Promise<void> {
    try {
      const status: WorkspaceIndexStatusFile = {
        version: INDEX_VERSION,
        workspaceId: this.workspace.id,
        state: this.state,
        indexedFiles: Array.from(this.indexedFiles),
        fileTimestamps: Object.fromEntries(this.fileTimestamps),
        projectTimestamps: Object.fromEntries(this.projectTimestamps),
      };

      await fs.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (error) {
      console.error('[WorkspaceIndexer] Failed to save status:', error);
    }
  }

  private resetState(): void {
    this.state = {
      status: 'idle',
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      indexedChunks: 0,
      lastSyncAt: null,
      lastError: null,
      isSemanticSearchReady: false,
      perProjectState: {},
    };
    this.indexedFiles.clear();
    this.fileTimestamps.clear();
    this.projectTimestamps.clear();
  }

  /**
   * Start automatic indexing for all projects in workspace
   */
  async startIndexing(): Promise<void> {
    if (this.isDestroyed) return;
    if (this.state.status === 'indexing') {
      console.log('[WorkspaceIndexer] Already indexing, skipping');
      return;
    }

    if (!this.config.autoIndex) {
      console.log('[WorkspaceIndexer] Auto-index disabled, skipping');
      return;
    }

    try {
      await this.performIndexing(false);
    } catch (error) {
      console.error('[WorkspaceIndexer] Indexing failed:', error);
      this.updateState({
        status: 'error',
        lastError: (error as Error).message,
      });
    }
  }

  /**
   * Force full reindex of all projects
   */
  async reindex(): Promise<void> {
    if (this.isDestroyed) return;
    await this.clearIndex();
    await this.performIndexing(true);
  }

  /**
   * Reindex a specific project in the workspace
   */
  async reindexProject(projectId: string): Promise<void> {
    if (this.isDestroyed) return;

    const folder = this.workspace.folders.find(f => f.id === projectId);
    if (!folder) {
      throw new Error(`Project ${projectId} not found in workspace`);
    }

    // Mark project for reindexing by clearing its timestamp
    this.projectTimestamps.delete(projectId);

    // Remove project files from indexed set
    const prefix = `${projectId}:`;
    for (const file of this.indexedFiles) {
      if (file.startsWith(prefix)) {
        this.indexedFiles.delete(file);
      }
    }

    await this.performIndexing(false);
  }

  /**
   * Clear the index completely
   */
  async clearIndex(): Promise<void> {
    if (this.semanticMemory) {
      this.semanticMemory.close();
      this.semanticMemory = null;
    }

    // Delete index files
    try {
      const files = ['vectors.hnsw', 'metadata.db', 'status.json'];
      for (const file of files) {
        const filePath = path.join(this.indexDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        if (exists) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.warn('[WorkspaceIndexer] Error clearing index files:', error);
    }

    // Reinitialize
    this.resetState();
    await fs.mkdir(this.indexDir, { recursive: true });
    this.semanticMemory = await SemanticMemory.create(this.indexDir);

    this.notifyStatusChange();
  }

  /**
   * Perform the actual indexing across all projects
   */
  private async performIndexing(fullRebuild: boolean): Promise<void> {
    if (!this.semanticMemory) {
      throw new Error('Semantic memory not initialized');
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.updateState({
      status: 'indexing',
      progress: 0,
      processedFiles: 0,
      indexedChunks: 0,
      perProjectState: {},
    });

    try {
      // Collect files from all projects
      const projectFiles: Map<string, string[]> = new Map();
      let totalFiles = 0;

      for (const folder of this.workspace.folders) {
        const files = await this.getProjectFiles(folder.path);
        projectFiles.set(folder.id, files);
        totalFiles += files.length;

        // Initialize per-project state
        this.state.perProjectState[folder.id] = {
          status: 'pending',
          processedFiles: 0,
          totalFiles: files.length,
        };
      }

      this.updateState({ totalFiles });

      // Process each project
      let globalProcessed = 0;
      let globalChunks = 0;

      for (const [projectId, files] of projectFiles) {
        if (signal.aborted) {
          throw new Error('Indexing aborted');
        }

        const folder = this.workspace.folders.find(f => f.id === projectId);
        if (!folder) continue;

        // Update project state
        this.state.perProjectState[projectId] = {
          status: 'indexing',
          processedFiles: 0,
          totalFiles: files.length,
        };

        // Get changed files for this project
        let filesToIndex = files;
        if (!fullRebuild) {
          const lastProjectIndex = this.projectTimestamps.get(projectId);
          if (lastProjectIndex) {
            filesToIndex = await this.getChangedFiles(files, projectId);
            if (filesToIndex.length === 0) {
              console.log(`[WorkspaceIndexer] No changes in ${folder.name || projectId}`);
              this.state.perProjectState[projectId].status = 'complete';
              continue;
            }
          }
        }

        // Index this project
        const { processed, chunks } = await this.indexProject(
          folder,
          filesToIndex,
          signal,
          (processed) => {
            this.state.perProjectState[projectId].processedFiles = processed;
            this.onProgress?.(globalProcessed + processed, totalFiles, projectId);
          }
        );

        globalProcessed += processed;
        globalChunks += chunks;

        // Update project timestamp
        this.projectTimestamps.set(projectId, Date.now());
        this.state.perProjectState[projectId].status = 'complete';

        // Update global progress
        const progress = Math.round((globalProcessed / totalFiles) * 100);
        this.updateState({
          progress,
          processedFiles: globalProcessed,
          indexedChunks: globalChunks,
          isSemanticSearchReady: progress >= SEMANTIC_SEARCH_THRESHOLD,
        });

        // Save status periodically
        if (globalProcessed % 20 === 0) {
          await this.saveStatus();
        }
      }

      // Mark complete
      this.updateState({
        status: 'complete',
        progress: 100,
        lastSyncAt: Date.now(),
        indexedChunks: globalChunks,
        isSemanticSearchReady: true,
      });

      await this.saveStatus();

      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    } catch (error) {
      if ((error as Error).message === 'Indexing aborted') {
        this.updateState({ status: 'paused' });
      } else {
        this.updateState({
          status: 'error',
          lastError: (error as Error).message,
        });
      }
      throw error;
    }
  }

  /**
   * Get files to index for a project
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const includePatterns = [
      '**/*.{ts,tsx,js,jsx,mjs,cjs}',
      '**/*.{py,pyi}',
      '**/*.{java,kt}',
      '**/*.{go,rs}',
      '**/*.{rb,php}',
      '**/*.{swift,c,cpp,h,hpp}',
      '**/*.{cs,fs}',
    ];

    const files = await fg(includePatterns, {
      cwd: projectPath,
      ignore: this.config.excludePatterns,
      absolute: true,
      followSymbolicLinks: false,
      concurrency: this.config.indexConcurrency,
    });

    return files.slice(0, this.config.maxFilesToIndex);
  }

  /**
   * Index a single project
   */
  private async indexProject(
    folder: FolderRef,
    files: string[],
    signal: AbortSignal,
    onProgress: (processed: number) => void
  ): Promise<{ processed: number; chunks: number }> {
    if (!this.semanticMemory) {
      throw new Error('Semantic memory not initialized');
    }

    const batchSize = this.config.embeddingBatchSize;
    let processed = 0;
    let totalChunks = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      if (signal.aborted) {
        throw new Error('Indexing aborted');
      }

      const batch = files.slice(i, i + batchSize);
      const batchChunks: CodeChunk[] = [];

      for (const filePath of batch) {
        try {
          const chunks = await this.smartChunker.chunkFile(filePath, folder.path);
          batchChunks.push(...chunks);

          // Track file with project prefix
          const relativePath = path.relative(folder.path, filePath);
          const storageKey = `${folder.id}:${relativePath}`;
          this.indexedFiles.add(storageKey);

          const stats = await fs.stat(filePath);
          this.fileTimestamps.set(storageKey, stats.mtimeMs);
        } catch (error) {
          console.warn(`[WorkspaceIndexer] Failed to process ${filePath}:`, error);
        }
      }

      // Convert to MemoryChunks and index
      if (batchChunks.length > 0) {
        const memoryChunks: MemoryChunk[] = batchChunks.map(chunk => ({
          id: chunk.id,
          content: this.formatChunkContent(chunk, folder),
          type: 'rag_chunk',
          timestamp: new Date().toISOString(),
          metadata: {
            ...chunk.metadata,
            projectId: folder.id,
            projectName: folder.name || path.basename(folder.path),
            projectPath: folder.path,
          },
        }));

        await this.semanticMemory.indexChunks(memoryChunks);
        totalChunks += memoryChunks.length;
      }

      processed += batch.length;
      onProgress(processed);
    }

    return { processed, chunks: totalChunks };
  }

  /**
   * Get files that have changed since last sync for a project
   */
  private async getChangedFiles(allFiles: string[], projectId: string): Promise<string[]> {
    const changed: string[] = [];

    for (const filePath of allFiles) {
      try {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(this.workspace.folders.find(f => f.id === projectId)?.path || '', filePath);
        const storageKey = `${projectId}:${relativePath}`;
        const lastModified = this.fileTimestamps.get(storageKey);

        if (!lastModified || stats.mtimeMs > lastModified) {
          changed.push(filePath);
        }
      } catch {
        // File might have been deleted, skip
        changed.push(filePath);
      }
    }

    return changed;
  }

  /**
   * Format chunk content with metadata for better embeddings
   */
  private formatChunkContent(chunk: CodeChunk, folder: FolderRef): string {
    const parts: string[] = [];

    // Add file context
    parts.push(`File: ${chunk.metadata.file}`);

    // Add project context
    parts.push(`Project: ${folder.name || path.basename(folder.path)}`);

    // Add type and name context
    if (chunk.metadata.name) {
      parts.push(`${chunk.metadata.type}: ${chunk.metadata.name}`);
    }

    // Add signature if available
    if (chunk.metadata.signature) {
      parts.push(`Signature: ${chunk.metadata.signature}`);
    }

    // Add the actual content
    parts.push('---');
    parts.push(chunk.content);

    return parts.join('\n');
  }

  /**
   * Start automatic periodic sync
   */
  startAutoSync(): void {
    this.stopAutoSync();

    if (!this.config.autoSync) return;

    const intervalMs = this.config.syncIntervalMinutes * 60 * 1000;

    this.syncTimer = setInterval(async () => {
      if (this.state.status !== 'indexing') {
        console.log('[WorkspaceIndexer] Running auto-sync...');
        try {
          await this.performIndexing(false);
        } catch (error) {
          console.error('[WorkspaceIndexer] Auto-sync failed:', error);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Abort current indexing operation
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Query the indexed workspace (cross-project search)
   */
  async query(query: string, options?: { topK?: number; projectId?: string }): Promise<SearchResult[]> {
    if (!this.semanticMemory) {
      throw new Error('Semantic memory not initialized');
    }

    if (!this.state.isSemanticSearchReady) {
      throw new Error(`Semantic search not ready. Indexing at ${this.state.progress}%, need ${SEMANTIC_SEARCH_THRESHOLD}%`);
    }

    const topK = options?.topK || 5;
    const results = await this.semanticMemory.search(query, topK * 2); // Get more results for filtering

    // Transform and optionally filter by project
    const searchResults: SearchResult[] = results.map(chunk => ({
      ...chunk,
      projectId: chunk.metadata?.projectId as string,
      projectName: chunk.metadata?.projectName as string,
      relativePath: chunk.metadata?.file as string,
    }));

    if (options?.projectId) {
      return searchResults.filter(r => r.projectId === options.projectId).slice(0, topK);
    }

    return searchResults.slice(0, topK);
  }

  /**
   * Get current indexing state
   */
  getState(): WorkspaceIndexingState {
    return { ...this.state };
  }

  /**
   * Check if semantic search is available
   */
  isSemanticSearchReady(): boolean {
    return this.state.isSemanticSearchReady;
  }

  /**
   * Update indexing configuration
   */
  async updateConfig(updates: Partial<IndexingConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };

    this.smartChunker = new SmartChunker(
      this.config.maxChunkSize,
      this.config.chunkSize
    );

    if (updates.syncIntervalMinutes !== undefined) {
      this.startAutoSync();
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<WorkspaceIndexingState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    if (this.onStatusChange) {
      this.onStatusChange(this.getState());
    }
    if (this.onProgress && this.state.totalFiles > 0) {
      this.onProgress(this.state.processedFiles, this.state.totalFiles);
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.abort();
    this.stopAutoSync();

    if (this.semanticMemory) {
      await this.saveStatus();
      this.semanticMemory.close();
      this.semanticMemory = null;
    }
  }
}

// Singleton map for active workspace indexers
const activeIndexers = new Map<string, WorkspaceIndexer>();

/**
 * Get or create a WorkspaceIndexer for a workspace
 */
export async function getWorkspaceIndexer(workspace: Workspace): Promise<WorkspaceIndexer> {
  if (!activeIndexers.has(workspace.id)) {
    const indexer = new WorkspaceIndexer(workspace);
    await indexer.initialize();
    activeIndexers.set(workspace.id, indexer);
  }
  return activeIndexers.get(workspace.id)!;
}

/**
 * Close and cleanup a workspace indexer
 */
export async function closeWorkspaceIndexer(workspaceId: string): Promise<void> {
  const indexer = activeIndexers.get(workspaceId);
  if (indexer) {
    await indexer.destroy();
    activeIndexers.delete(workspaceId);
  }
}

/**
 * Close all workspace indexers
 */
export async function closeAllWorkspaceIndexers(): Promise<void> {
  const promises = Array.from(activeIndexers.values()).map(idx => idx.destroy());
  await Promise.all(promises);
  activeIndexers.clear();
}
