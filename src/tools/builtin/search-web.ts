import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class SearchWebTool implements Tool {
  readonly name = 'SearchWeb';
  readonly description = 'Search the web using DuckDuckGo. Returns results with titles, URLs, and snippets.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.NETWORK;

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
      const searchApi = await import('duckduckgo-search');

      // The duckduckgo-search package exports a SearchApi instance with text() async generator
      const results: Array<{ title: string; href: string; body: string }> = [];
      for await (const result of searchApi.text(query)) {
        results.push({
          title: result.title,
          href: result.href,
          body: result.body,
        });
        if (results.length >= maxResults) break;
      }

      if (!results || results.length === 0) {
        return { content: `No results found for: "${query}"` };
      }

      const formatted = results.map((r, i) => {
        return `${i + 1}. **${r.title}**\n   ${r.href}\n   ${r.body || ''}`;
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
