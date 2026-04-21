import { glob } from 'glob';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class GlobSearchTool implements Tool {
  readonly name = 'Glob';
  readonly description = 'Fast file pattern matching. Supports glob patterns like "**/*.ts" or "src/**/*.tsx". Returns matching file paths.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The glob pattern to match files against',
      },
      path: {
        type: 'string',
        description: 'Directory to search in. Must be within the workspace. Defaults to current working directory (workspace root).',
      },
    },
    required: ['pattern'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.pattern !== 'string' || !input.pattern) {
      return 'pattern must be a non-empty string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = input.pattern as string;
    const searchPath = (input.path as string) || context.cwd;

    try {
      const matches = await glob(pattern, {
        cwd: searchPath,
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      if (matches.length === 0) {
        return { content: `No files found matching pattern: ${pattern}` };
      }

      // Sort by modification time (most recent first)
      const sorted = matches.sort();
      const limited = sorted.slice(0, 500);
      const result = limited.join('\n');

      if (matches.length > 500) {
        return { content: `${result}\n\n... and ${matches.length - 500} more files (showing first 500)` };
      }

      return { content: result };
    } catch (error) {
      return { content: `Glob error: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const count = result.content.split('\n').length;
    return `Found ${count} files matching "${input.pattern}"`;
  }
}
