import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { ProjectIndexer } from '../../memory/project-indexer.js';

export class IndexCodebaseTool implements Tool {
  readonly name = 'IndexCodebase';
  readonly description = `Indexes the codebase for semantic search. Chunks files into embeddable pieces and stores in vector DB. Use before complex tasks like refactoring. Runs ~1-5min first time. Uses smart semantic chunking for better results.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.READ;

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
      force: {
        type: 'boolean',
        description: 'Force full reindex instead of incremental update',
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
    if (input.force !== undefined && typeof input.force !== 'boolean') {
      return 'force must be a boolean';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const force = (input.force as boolean) || false;

    try {
      // Use ProjectIndexer for better integration with the new indexing system
      const indexer = new ProjectIndexer(context.cwd);
      await indexer.initialize();

      // Update config if custom maxFiles provided
      const maxFiles = (input.maxFiles as number);
      if (maxFiles) {
        await indexer.updateConfig({ maxFilesToIndex: maxFiles });
      }

      if (force) {
        await indexer.reindex();
      } else {
        await indexer.startIndexing();
      }

      // Get the final state
      const state = indexer.getState();
      indexer.destroy();

      if (state.status === 'error') {
        return {
          content: `Error indexing codebase: ${state.lastError}`,
          isError: true,
        };
      }

      return {
        content: `Successfully indexed ${state.processedFiles} files with ${state.indexedChunks} chunks. Semantic search is ${state.isSemanticSearchReady ? 'ready' : 'building (80% needed)'}.`,
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
