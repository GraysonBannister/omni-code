import { pipeline, env } from '@xenova/transformers';
import * as hnswlib from 'hnswlib-node';
import { PersistentMemoryStore } from './persistent-store.js';
import type { MemoryChunk } from './persistent-store.js';
import path from 'path';
import fs from 'fs/promises';
import {
  EMBEDDING_DIM,
  MODEL_NAME,
  DEFAULT_MAX_ELEMENTS,
  DEFAULT_M,
  DEFAULT_EF_CONSTRUCTION,
} from './embedding-config.js';

// Allow remote model downloads on first use
env.allowLocalModels = true;
env.allowRemoteModels = true;

export { MemoryChunk };

export interface SearchResult extends MemoryChunk {
  distance: number;
}

export class SemanticMemory {
  private embedder: any;
  private index!: hnswlib.HierarchicalNSW;
  private store: PersistentMemoryStore;
  private indexPath: string;
  private metaPath: string;
  private initialized = false;
  private maxElements: number;

  private constructor(basePath: string, maxElements = DEFAULT_MAX_ELEMENTS) {
    this.indexPath = path.join(basePath, 'vectors.hnsw');
    this.metaPath = path.join(basePath, 'metadata.db');
    this.store = new PersistentMemoryStore(this.metaPath);
    this.maxElements = maxElements;
  }

  static async create(basePath = './omni-semantic', maxElements?: number): Promise<SemanticMemory> {
    // Ensure directory exists
    await fs.mkdir(basePath, { recursive: true });
    const instance = new SemanticMemory(basePath, maxElements);
    await instance.init();
    return instance;
  }

  private async init() {
    // Load embedder
    this.embedder = await pipeline('feature-extraction', MODEL_NAME);

    // Load or create HNSW index
    const indexExists = await fs.access(this.indexPath).then(() => true).catch(() => false);
    if (indexExists) {
      this.index = new hnswlib.HierarchicalNSW('l2', EMBEDDING_DIM);
      this.index.readIndexSync(this.indexPath);
    } else {
      this.index = new hnswlib.HierarchicalNSW('l2', EMBEDDING_DIM);
      this.index.initIndex(this.maxElements, DEFAULT_M, DEFAULT_EF_CONSTRUCTION);
    }

    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SemanticMemory not initialized. Use SemanticMemory.create() factory method.');
    }
  }

  /**
   * Index multiple chunks efficiently
   */
  async indexChunks(chunks: MemoryChunk[]): Promise<void> {
    this.ensureInitialized();

    for (const chunk of chunks) {
      const embedding = await this.embedder(chunk.content, {
        pooling: 'mean',
        normalize: true,
      });
      const vector = Array.from(embedding.data as Float32Array);

      // Save metadata
      this.store.saveContext('semantic', chunk.id, JSON.stringify(chunk));

      // Add to index - use numeric label derived from chunk id hash
      const label = this.hashToInt(chunk.id);
      try {
        this.index.addPoint(vector, label);
      } catch {
        // Point may already exist; mark for update
        try {
          this.index.markDelete(label);
          this.index.addPoint(vector, label);
        } catch {
          // If we can't update, skip this chunk
          console.warn(`[SemanticMemory] Could not index chunk ${chunk.id}`);
        }
      }
    }

    // Persist index
    this.index.writeIndexSync(this.indexPath);
  }

  /**
   * Remove chunks by IDs
   */
  async removeChunks(chunkIds: string[]): Promise<void> {
    this.ensureInitialized();

    for (const id of chunkIds) {
      const label = this.hashToInt(id);
      try {
        this.index.markDelete(label);
        // Also remove from metadata store
        this.store.deleteContext?.('semantic', id);
      } catch {
        // Chunk might not exist
      }
    }

    this.index.writeIndexSync(this.indexPath);
  }

  /**
   * Search for similar chunks
   */
  async search(query: string, topK = 5): Promise<MemoryChunk[]> {
    this.ensureInitialized();

    const currentCount = this.index.getCurrentCount();
    if (currentCount === 0) return [];

    const queryEmb = await this.embedder(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmb.data as Float32Array);

    const effectiveK = Math.min(topK, currentCount);
    const results = this.index.searchKnn(queryVector, effectiveK);
    const chunks: MemoryChunk[] = [];

    for (let i = 0; i < results.neighbors.length; i++) {
      const label = results.neighbors[i];
      const chunk = this.findChunkByLabel(label);
      if (chunk) {
        chunks.push(chunk);
      }
    }
    return chunks;
  }

  /**
   * Search with distances
   */
  async searchWithDistances(query: string, topK = 5): Promise<SearchResult[]> {
    this.ensureInitialized();

    const currentCount = this.index.getCurrentCount();
    if (currentCount === 0) return [];

    const queryEmb = await this.embedder(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmb.data as Float32Array);

    const effectiveK = Math.min(topK, currentCount);
    const results = this.index.searchKnn(queryVector, effectiveK);
    const chunks: SearchResult[] = [];

    for (let i = 0; i < results.neighbors.length; i++) {
      const label = results.neighbors[i];
      const chunk = this.findChunkByLabel(label);
      if (chunk) {
        chunks.push({
          ...chunk,
          distance: results.distances[i],
        });
      }
    }
    return chunks;
  }

  /**
   * Find all chunks for a specific file
   */
  findChunksByFile(filePath: string): MemoryChunk[] {
    this.ensureInitialized();

    const allContext = this.store.getContext('semantic') as Record<string, string>;
    const chunks: MemoryChunk[] = [];

    for (const [key, value] of Object.entries(allContext)) {
      try {
        const meta = JSON.parse(value) as MemoryChunk;
        if (meta.metadata?.file === filePath) {
          chunks.push(meta);
        }
      } catch { /* skip invalid entries */ }
    }

    return chunks;
  }

  /**
   * Get total number of indexed chunks
   */
  getChunkCount(): number {
    this.ensureInitialized();
    return this.index.getCurrentCount();
  }

  /**
   * Get all indexed file paths
   */
  getIndexedFiles(): string[] {
    this.ensureInitialized();

    const allContext = this.store.getContext('semantic') as Record<string, string>;
    const files = new Set<string>();

    for (const value of Object.values(allContext)) {
      try {
        const meta = JSON.parse(value) as MemoryChunk;
        if (meta.metadata?.file) {
          files.add(meta.metadata.file);
        }
      } catch { /* skip invalid entries */ }
    }

    return Array.from(files);
  }

  private findChunkByLabel(label: number): MemoryChunk | null {
    const allContext = this.store.getContext('semantic') as Record<string, string>;

    for (const [key, value] of Object.entries(allContext)) {
      try {
        const meta = JSON.parse(value) as MemoryChunk;
        if (this.hashToInt(meta.id || key) === label) {
          return {
            id: meta.id || key,
            content: meta.content,
            metadata: meta.metadata,
            timestamp: meta.timestamp || new Date().toISOString(),
            type: meta.type || 'chunk',
          };
        }
      } catch { /* skip invalid entries */ }
    }

    return null;
  }

  async indexCodebase(globPattern: string): Promise<number> {
    this.ensureInitialized();
    // Delegate to RAGIndexer for actual implementation
    console.log(`Indexing codebase with ${globPattern}`);
    return 0;
  }

  close(): void {
    if (this.initialized) {
      try {
        this.index.writeIndexSync(this.indexPath);
      } catch (error) {
        console.warn('[SemanticMemory] Error writing index:', error);
      }
    }
    this.store.close();
  }

  private hashToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
