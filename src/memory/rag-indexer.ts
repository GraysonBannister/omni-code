import { SemanticMemory } from './semantic-memory.js';
import type { MemoryChunk } from './persistent-store.js';
import { SmartChunker } from './smart-chunker.js';
import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';

export class RAGIndexer {
  private semMem!: SemanticMemory;
  private smartChunker: SmartChunker;
  private basePath: string;

  private constructor(basePath: string) {
    this.basePath = basePath;
    this.smartChunker = new SmartChunker();
  }

  static async create(basePath = './omni-rag'): Promise<RAGIndexer> {
    const indexer = new RAGIndexer(basePath);
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
        const absPath = path.join(process.cwd(), rel);

        // Use SmartChunker for semantic chunking
        const codeChunks = await this.smartChunker.chunkFile(absPath, process.cwd());

        for (const codeChunk of codeChunks) {
          chunks.push({
            id: codeChunk.id,
            content: this.formatChunkContent(codeChunk),
            metadata: codeChunk.metadata,
            type: 'rag_chunk',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Skip unreadable files
      }
    }

    await this.semMem.indexChunks(chunks);
    return chunks.length;
  }

  /**
   * Format chunk content with metadata for better embeddings
   */
  private formatChunkContent(chunk: { content: string; metadata: { file: string; type?: string; name?: string; signature?: string } }): string {
    const parts: string[] = [];

    // Add file context
    parts.push(`File: ${chunk.metadata.file}`);

    // Add type and name context
    if (chunk.metadata.name) {
      parts.push(`${chunk.metadata.type || 'symbol'}: ${chunk.metadata.name}`);
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

  async query(query: string, topK = 5): Promise<MemoryChunk[]> {
    return this.semMem.search(query, topK);
  }

  close(): void {
    this.semMem.close();
  }
}
