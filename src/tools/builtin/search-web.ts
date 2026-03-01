import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class SearchWebTool implements Tool {
  readonly name = 'SearchWeb';
  readonly description = 'Search the web using DuckDuckGo. Returns results with titles, URLs, and snippets.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.NETWORK;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
      },
    },
    required: ['query'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.query !== 'string' || !input.query.trim()) {
      return 'query must be a non-empty string';
    }
    if (input.maxResults !== undefined && (typeof input.maxResults !== 'number' || input.maxResults < 1)) {
      return 'maxResults must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const query = input.query as string;
    const maxResults = (input.maxResults as number) || 5;

    try {
      // Dynamic import for ESM compatibility
      const { search } = await import('duckduckgo-search');
      const results = await search(query, { maxResults });

      if (!results || results.length === 0) {
        return { content: `No results found for: "${query}"` };
      }

      const formatted = results.slice(0, maxResults).map((r: any, i: number) => {
        return `${i + 1}. **${r.title}**\n   ${r.link}\n   ${r.snippet || r.description || ''}`;
      }).join('\n\n');

      return {
        content: `Search results for "${query}":\n\n${formatted}`,
      };
    } catch (error) {
      return {
        content: `Error searching web: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return `Web search: "${input.query}"`;
  }
}
