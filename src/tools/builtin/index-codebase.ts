import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { SemanticMemory } from '../../memory/semantic-memory.js';
import type { MemoryChunk } from '../../memory/persistent-store.js';
import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';

export class IndexCodebaseTool implements Tool {
  readonly name = 'IndexCodebase';
  readonly description = `Indexes the codebase for semantic search. Chunks files into embeddable pieces and stores in vector DB. Use before complex tasks like refactoring. Runs ~1-5min first time.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.READ;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to index (default: src/**/*.{ts,tsx,js,jsx,py})',
      },
      maxFiles: {
        type: 'number',
        description: 'Max files to index (default: 100)',
      },
      chunkLines: {
        type: 'number',
        description: 'Lines per chunk (default: 20)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.pattern !== undefined && typeof input.pattern !== 'string') {
      return 'pattern must be a string glob pattern';
    }
    if (input.maxFiles !== undefined && (typeof input.maxFiles !== 'number' || input.maxFiles < 1)) {
      return 'maxFiles must be a positive number';
    }
    if (input.chunkLines !== undefined && (typeof input.chunkLines !== 'number' || input.chunkLines < 1)) {
      return 'chunkLines must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = (input.pattern as string) || 'src/**/*.{ts,tsx,js,jsx,py}';
    const maxFiles = (input.maxFiles as number) || 100;
    const chunkLines = (input.chunkLines as number) || 20;

    try {
      const semMem = await SemanticMemory.create();
      const files = await fg(pattern, {
        cwd: context.cwd,
        deep: 5,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });

      const limitedFiles = files.slice(0, maxFiles) as string[];
      const chunks: MemoryChunk[] = [];

      for (const relPath of limitedFiles) {
        try {
          const absPath = path.join(context.cwd, relPath);
          const content = await fs.readFile(absPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i += chunkLines) {
            const chunkText = lines.slice(i, i + chunkLines).join('\n').trim();
            if (chunkText.length > 50) {
              chunks.push({
                id: `${relPath}:${i}`,
                content: chunkText,
                metadata: { file: relPath, startLine: i + 1 },
                type: 'chunk',
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          // Skip unreadable files
        }
      }

      await semMem.indexChunks(chunks);
      semMem.close();

      return {
        content: `Indexed ${chunks.length} chunks from ${limitedFiles.length} files. Ready for semantic queries!`,
      };
    } catch (error) {
      return {
        content: `Error indexing codebase: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    return result.content;
  }
}
