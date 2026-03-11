/**
 * Project Indexer Service
 *
 * Main indexing orchestrator that:
 * - Automatically indexes projects when opened
 * - Tracks indexing progress and status
 * - Provides periodic sync (5-minute intervals)
 * - Handles incremental updates for changed files
 * - Manages per-project index storage
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import { SemanticMemory } from './semantic-memory.js';
import { SmartChunker, type CodeChunk } from './smart-chunker.js';
import {
  getIndexingConfigManager,
  type IndexingConfig,
} from './indexing-config.js';
import type { MemoryChunk } from './persistent-store.js';

export type IndexingStatus = 'idle' | 'indexing' | 'complete' | 'error' | 'paused';

export interface IndexingState {
  status: IndexingStatus;
  progress: number; // 0-100
  totalFiles: number;
  processedFiles: number;
  indexedChunks: number;
  lastSyncAt: number | null;
  lastError: string | null;
  isSemanticSearchReady: boolean; // Available at 80%
}

export interface IndexStatusFile {
  version: number;
  projectPath: string;
  state: IndexingState;
  indexedFiles: string[];
  fileTimestamps: Record<string, number>;
}

const INDEX_VERSION = 1;
const SEMANTIC_SEARCH_THRESHOLD = 80; // 80% for semantic search availability
const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class ProjectIndexer {
  private projectPath: string;
  private semanticMemory: SemanticMemory | null = null;
  private smartChunker: SmartChunker;
  private config: IndexingConfig;
  private state: IndexingState;
  private statusFilePath: string;
  private indexDir: string;
  private fileTimestamps: Map<string, number> = new Map();
  private indexedFiles: Set<string> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private isDestroyed = false;

  // Callbacks for status updates
  onStatusChange?: (state: IndexingState) => void;
  onProgress?: (processed: number, total: number) => void;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.config = { ...DEFAULT_INDEXING_CONFIG };
    this.smartChunker = new SmartChunker(
      this.config.maxChunkSize,
      this.config.chunkSize
    );
    this.indexDir = path.join(projectPath, '.omnicode', 'index');
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
    };
  }

  async initialize(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('ProjectIndexer has been destroyed');
    }

    // Load configuration
    const configManager = getIndexingConfigManager(this.projectPath);
    this.config = await configManager.load();

    // Ensure index directory exists
    await fs.mkdir(this.indexDir, { recursive: true });

    // Initialize semantic memory
    this.semanticMemory = await SemanticMemory.create(this.indexDir);

    // Recreate smart chunker with loaded config
    this.smartChunker = new SmartChunker(
      this.config.maxChunkSize,
      this.config.chunkSize
    );

    // Load previous status if exists
    await this.loadStatus();
  }

  async loadStatus(): Promise<void> {
    try {
      const exists = await fs.access(this.statusFilePath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.statusFilePath, 'utf-8');
        const status: IndexStatusFile = JSON.parse(content);

        if (status.version === INDEX_VERSION) {
          this.state = status.state;
          this.indexedFiles = new Set(status.indexedFiles);

          // Restore timestamps
          this.fileTimestamps.clear();
          for (const [file, timestamp] of Object.entries(status.fileTimestamps)) {
            this.fileTimestamps.set(file, timestamp);
          }

          // Check if index is stale (older than 24 hours)
          if (this.state.lastSyncAt) {
            const hoursSinceSync = (Date.now() - this.state.lastSyncAt) / (1000 * 60 * 60);
            if (hoursSinceSync > 24 && this.config.autoIndex) {
              console.log('[ProjectIndexer] Index is stale, will reindex');
              this.state.status = 'idle';
              this.state.progress = 0;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[ProjectIndexer] Failed to load status:', error);
      // Start fresh
      this.resetState();
    }
  }

  async saveStatus(): Promise<void> {
    try {
      const status: IndexStatusFile = {
        version: INDEX_VERSION,
        projectPath: this.projectPath,
        state: this.state,
        indexedFiles: Array.from(this.indexedFiles),
        fileTimestamps: Object.fromEntries(this.fileTimestamps),
      };

      await fs.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (error) {
      console.error('[ProjectIndexer] Failed to save status:', error);
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
    };
    this.indexedFiles.clear();
    this.fileTimestamps.clear();
  }

  /**
   * Start automatic indexing
   */
  async startIndexing(): Promise<void> {
    if (this.isDestroyed) return;
    if (this.state.status === 'indexing') {
      console.log('[ProjectIndexer] Already indexing, skipping');
      return;
    }

    if (!this.config.autoIndex) {
      console.log('[ProjectIndexer] Auto-index disabled, skipping');
      return;
    }

    try {
      await this.performIndexing(false);
    } catch (error) {
      console.error('[ProjectIndexer] Indexing failed:', error);
      this.updateState({
        status: 'error',
        lastError: (error as Error).message,
      });
    }
  }

  /**
   * Force full reindex
   */
  async reindex(): Promise<void> {
    if (this.isDestroyed) return;

    // Clear existing index
    await this.clearIndex();

    // Start fresh indexing
    await this.performIndexing(true);
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
      console.warn('[ProjectIndexer] Error clearing index files:', error);
    }

    // Reinitialize
    this.resetState();
    await fs.mkdir(this.indexDir, { recursive: true });
    this.semanticMemory = await SemanticMemory.create(this.indexDir);

    this.notifyStatusChange();
  }

  /**
   * Perform the actual indexing
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
    });

    try {
      // Get list of files to index
      const configManager = getIndexingConfigManager(this.projectPath);
      const excludePatterns = configManager.getAllExclusionPatterns();

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
        cwd: this.projectPath,
        ignore: excludePatterns,
        absolute: true,
        followSymbolicLinks: false,
        concurrency: this.config.indexConcurrency,
      });

      const limitedFiles = files.slice(0, this.config.maxFilesToIndex);
      this.updateState({ totalFiles: limitedFiles.length });

      // For incremental sync, filter to changed files only
      let filesToIndex = limitedFiles;
      if (!fullRebuild && this.state.lastSyncAt) {
        filesToIndex = await this.getChangedFiles(limitedFiles);
        if (filesToIndex.length === 0) {
          console.log('[ProjectIndexer] No changed files, skipping sync');
          this.updateState({
            status: 'complete',
            progress: 100,
            lastSyncAt: Date.now(),
          });
          return;
        }
        console.log(`[ProjectIndexer] Incremental sync: ${filesToIndex.length} changed files`);
      }

      // Process files in batches
      const batchSize = this.config.embeddingBatchSize;
      let processedCount = 0;
      let totalChunks = 0;

      for (let i = 0; i < filesToIndex.length; i += batchSize) {
        if (signal.aborted) {
          throw new Error('Indexing aborted');
        }

        const batch = filesToIndex.slice(i, i + batchSize);
        const batchChunks: CodeChunk[] = [];

        // Chunk each file
        for (const filePath of batch) {
          try {
            const chunks = await this.smartChunker.chunkFile(filePath, this.projectPath);
            batchChunks.push(...chunks);

            // Track file
            this.indexedFiles.add(path.relative(this.projectPath, filePath));
            const stats = await fs.stat(filePath);
            this.fileTimestamps.set(filePath, stats.mtimeMs);
          } catch (error) {
            console.warn(`[ProjectIndexer] Failed to process ${filePath}:`, error);
          }
        }

        // Convert to MemoryChunks and index
        if (batchChunks.length > 0) {
          const memoryChunks: MemoryChunk[] = batchChunks.map(chunk => ({
            id: chunk.id,
            content: this.formatChunkContent(chunk),
            type: 'rag_chunk',
            timestamp: new Date().toISOString(),
            metadata: chunk.metadata,
          }));

          await this.semanticMemory.indexChunks(memoryChunks);
          totalChunks += memoryChunks.length;
        }

        // Update progress
        processedCount += batch.length;
        const progress = Math.round((processedCount / filesToIndex.length) * 100);
        const isSemanticReady = progress >= SEMANTIC_SEARCH_THRESHOLD ||
          (fullRebuild === false && this.state.isSemanticSearchReady);

        this.updateState({
          progress,
          processedFiles: processedCount,
          indexedChunks: totalChunks,
          isSemanticSearchReady: isSemanticReady,
        });

        // Save status periodically
        if (processedCount % 20 === 0) {
          await this.saveStatus();
        }
      }

      // Remove deleted files from index (for incremental sync)
      if (!fullRebuild) {
        await this.removeDeletedFiles(limitedFiles);
      }

      // Mark complete
      this.updateState({
        status: 'complete',
        progress: 100,
        lastSyncAt: Date.now(),
        indexedChunks: totalChunks,
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
   * Get files that have changed since last sync
   */
  private async getChangedFiles(allFiles: string[]): Promise<string[]> {
    const changed: string[] = [];

    for (const filePath of allFiles) {
      try {
        const stats = await fs.stat(filePath);
        const lastModified = this.fileTimestamps.get(filePath);

        if (!lastModified || stats.mtimeMs > lastModified) {
          changed.push(filePath);
        }
      } catch {
        // File might have been deleted, skip
        changed.push(filePath);
      }
    }

    // Also check for deleted files
    const currentFiles = new Set(allFiles);
    for (const [filePath] of this.fileTimestamps) {
      if (!currentFiles.has(filePath)) {
        // File was deleted - we need to handle this separately
      }
    }

    return changed;
  }

  /**
   * Remove deleted files from the index
   */
  private async removeDeletedFiles(currentFiles: string[]): Promise<void> {
    const currentSet = new Set(currentFiles);
    const toRemove: string[] = [];

    for (const indexedFile of this.indexedFiles) {
      const fullPath = path.join(this.projectPath, indexedFile);
      if (!currentSet.has(fullPath)) {
        toRemove.push(indexedFile);
        this.fileTimestamps.delete(fullPath);
      }
    }

    // Remove from tracked set
    for (const file of toRemove) {
      this.indexedFiles.delete(file);
    }

    // Note: Actually removing vectors from HNSW is complex and may require
    // rebuilding the index. For now, we just track the change and
    // filter results later.
  }

  /**
   * Format chunk content with metadata for better embeddings
   */
  private formatChunkContent(chunk: CodeChunk): string {
    const parts: string[] = [];

    // Add file context
    parts.push(`File: ${chunk.metadata.file}`);

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
        console.log('[ProjectIndexer] Running auto-sync...');
        try {
          await this.performIndexing(false);
        } catch (error) {
          console.error('[ProjectIndexer] Auto-sync failed:', error);
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
   * Update indexing configuration
   */
  async updateConfig(updates: Partial<IndexingConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };

    const configManager = getIndexingConfigManager(this.projectPath);
    configManager.updateConfig(updates);
    await configManager.save();

    // Update chunker with new config
    this.smartChunker = new SmartChunker(
      this.config.maxChunkSize,
      this.config.chunkSize
    );

    // Restart auto-sync if interval changed
    if (updates.syncIntervalMinutes !== undefined) {
      this.startAutoSync();
    }
  }

  /**
   * Query the indexed codebase
   */
  async query(query: string, topK = 5): Promise<MemoryChunk[]> {
    if (!this.semanticMemory) {
      throw new Error('Semantic memory not initialized');
    }

    if (!this.state.isSemanticSearchReady) {
      throw new Error(`Semantic search not ready. Indexing at ${this.state.progress}%, need ${SEMANTIC_SEARCH_THRESHOLD}%`);
    }

    return this.semanticMemory.search(query, topK);
  }

  /**
   * Get current indexing state
   */
  getState(): IndexingState {
    return { ...this.state };
  }

  /**
   * Check if semantic search is available
   */
  isSemanticSearchReady(): boolean {
    return this.state.isSemanticSearchReady;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<IndexingState>): void {
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

    clearConfigManager(this.projectPath);
  }
}

// Default config for reference
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

// Clear config manager helper
function clearConfigManager(projectPath: string): void {
  // Import dynamically to avoid circular dependency
  import('./indexing-config.js').then(m => m.clearConfigManager(projectPath));
}

// Singleton map for active indexers
const activeIndexers = new Map<string, ProjectIndexer>();

/**
 * Get or create a ProjectIndexer for a project
 */
export async function getProjectIndexer(projectPath: string): Promise<ProjectIndexer> {
  if (!activeIndexers.has(projectPath)) {
    const indexer = new ProjectIndexer(projectPath);
    await indexer.initialize();
    activeIndexers.set(projectPath, indexer);
  }
  return activeIndexers.get(projectPath)!;
}

/**
 * Close and cleanup a project indexer
 */
export async function closeProjectIndexer(projectPath: string): Promise<void> {
  const indexer = activeIndexers.get(projectPath);
  if (indexer) {
    await indexer.destroy();
    activeIndexers.delete(projectPath);
  }
}

/**
 * Close all project indexers
 */
export async function closeAllProjectIndexers(): Promise<void> {
  const promises = Array.from(activeIndexers.values()).map(idx => idx.destroy());
  await Promise.all(promises);
  activeIndexers.clear();
}
