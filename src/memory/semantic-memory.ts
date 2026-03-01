import { pipeline, env } from '@xenova/transformers';
import * as hnswlib from 'hnswlib-node';
import { PersistentMemoryStore } from './persistent-store.js';
import type { MemoryChunk } from './persistent-store.js';
import path from 'path';
import fs from 'fs/promises';

// Allow remote model downloads on first use
env.allowLocalModels = true;
env.allowRemoteModels = true;

const EMBEDDING_DIM = 384;  // all-MiniLM-L6-v2
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

export { MemoryChunk };

export class SemanticMemory {
  private embedder: any;
  private index!: hnswlib.HierarchicalNSW;
  private store: PersistentMemoryStore;
  private indexPath: string;
  private metaPath: string;
  private initialized = false;

  private constructor(basePath: string) {
    this.indexPath = path.join(basePath, 'vectors.hnsw');
    this.metaPath = path.join(basePath, 'metadata.db');
    this.store = new PersistentMemoryStore(this.metaPath);
  }

  static async create(basePath = './omni-semantic'): Promise<SemanticMemory> {
    // Ensure directory exists
    await fs.mkdir(basePath, { recursive: true });
    const instance = new SemanticMemory(basePath);
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
      this.index.initIndex(10000, 16, 200);  // maxElements, M, efConstruction
    }

    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SemanticMemory not initialized. Use SemanticMemory.create() factory method.');
    }
  }

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
        // Point may already exist; that's fine
      }
    }

    // Persist index
    this.index.writeIndexSync(this.indexPath);
  }

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
      // Look up metadata from all stored context entries
      const allContext = this.store.getContext('semantic') as Record<string, string>;
      for (const [key, value] of Object.entries(allContext)) {
        try {
          const meta = JSON.parse(value);
          if (this.hashToInt(meta.id || key) === label) {
            chunks.push({
              id: meta.id || key,
              content: meta.content,
              metadata: meta.metadata,
              timestamp: meta.timestamp || new Date().toISOString(),
              type: meta.type || 'chunk',
            });
            break;
          }
        } catch { /* skip invalid entries */ }
      }
    }
    return chunks;
  }

  async indexCodebase(globPattern: string): Promise<number> {
    this.ensureInitialized();
    // Delegate to RAGIndexer for actual implementation
    console.log(`Indexing codebase with ${globPattern}`);
    return 0;
  }

  close(): void {
    if (this.initialized) {
      this.index.writeIndexSync(this.indexPath);
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
