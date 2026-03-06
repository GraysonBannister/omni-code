import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { SemanticMemory } from '../../memory/semantic-memory.js';

export class QueryCodebaseTool implements Tool {
  readonly name = 'QueryCodebase';
  readonly description = `Search the indexed codebase using semantic/vector search. Returns relevant code chunks matching a natural language query. Run IndexCodebase first to build the index.`;
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query to search the codebase for (e.g. "error handling in API routes")',
      },
      topK: {
        type: 'number',
        description: 'Number of results to return (default: 5, max: 20)',
      },
    },
    required: ['query'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.query !== 'string' || !input.query.trim()) {
      return 'query must be a non-empty string';
    }
    if (input.topK !== undefined && (typeof input.topK !== 'number' || input.topK < 1 || input.topK > 20)) {
      return 'topK must be a number between 1 and 20';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const query = (input.query as string).trim();
    const topK = (input.topK as number) || 5;

    try {
      const semMem = await SemanticMemory.create();
      const results = await semMem.search(query, topK);
      semMem.close();

      if (results.length === 0) {
        return {
          content: 'No results found. Make sure you have run IndexCodebase first to build the semantic index.',
        };
      }

      const formatted = results.map((chunk, i) => {
        const file = chunk.metadata?.file || 'unknown';
        const startLine = chunk.metadata?.startLine || '?';
        return `### Result ${i + 1}: ${file}:${startLine}\n\`\`\`\n${chunk.content}\n\`\`\``;
      }).join('\n\n');

      return {
        content: `Found ${results.length} relevant chunks for "${query}":\n\n${formatted}`,
      };
    } catch (error) {
      return {
        content: `Error querying codebase: ${(error as Error).message}. Have you run IndexCodebase first?`,
        isError: true,
      };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const lines = result.content.split('\n');
    return lines[0] || `Queried for "${input.query}"`;
  }
}
