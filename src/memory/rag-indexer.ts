import { SemanticMemory } from './semantic-memory.js';
import type { MemoryChunk } from './persistent-store.js';
import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';

export class RAGIndexer {
  private semMem!: SemanticMemory;

  private constructor() {}

  static async create(basePath = './omni-rag'): Promise<RAGIndexer> {
    const indexer = new RAGIndexer();
    indexer.semMem = await SemanticMemory.create(basePath);
    return indexer;
  }

  async indexCodebase(globPattern: string = 'src/**/*.{ts,js,py}', maxFiles = 50): Promise<number> {
    const files = await fg(globPattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    });
    const limited = files.slice(0, maxFiles);
    const chunks: MemoryChunk[] = [];

    for (const rel of limited) {
      try {
        const content = await fs.readFile(path.join(process.cwd(), rel), 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i += 20) {
          const chunk = lines.slice(i, i + 20).join('\n').trim();
          if (chunk.length > 50) {
            chunks.push({
              id: `${rel}:${i}`,
              content: chunk,
              metadata: { file: rel, startLine: i + 1 },
              type: 'chunk',
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    await this.semMem.indexChunks(chunks);
    return chunks.length;
  }

  async query(query: string, topK = 5): Promise<MemoryChunk[]> {
    return this.semMem.search(query, topK);
  }

  close(): void {
    this.semMem.close();
  }
}
