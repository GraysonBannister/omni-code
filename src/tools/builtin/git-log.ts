import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class GitLogTool implements Tool {
  readonly name = 'GitLog';
  readonly description = 'Show git commit history with optional formatting and filtering.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      maxCount: { type: 'number', description: 'Maximum number of commits to show (default: 10)' },
      oneline: { type: 'boolean', description: 'Show condensed one-line format (default: false)' },
      file: { type: 'string', description: 'Show commits affecting a specific file' },
    },
    required: [],
  };

  validate(_input: Record<string, unknown>): string | null {
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const maxCount = (input.maxCount as number) || 10;
    const oneline = input.oneline as boolean;
    const file = input.file as string | undefined;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      const log = await git.log(maxCount, oneline, file);
      if (!log.trim()) return { content: 'No commits found.' };
      return { content: log };
    } catch (error) {
      return { content: `Git log error: ${(error as Error).message}`, isError: true };
    }
  }
}
