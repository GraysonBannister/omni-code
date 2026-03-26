import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class GitStashTool implements Tool {
  readonly name = 'GitStash';
  readonly description = 'Manage git stash: save, restore, list, or drop stashed changes.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['push', 'pop', 'list', 'apply', 'drop'], description: 'Stash action' },
      message: { type: 'string', description: 'Stash message (for push action)' },
      index: { type: 'number', description: 'Stash index (for pop/apply/drop, default: 0)' },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!['push', 'pop', 'list', 'apply', 'drop'].includes(action)) return 'action must be push, pop, list, apply, or drop';
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as string;
    const message = input.message as string | undefined;
    const index = (input.index as number) ?? 0;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      const result = await git.stash(action, message, index);
      return { content: result || `Stash ${action} completed.` };
    } catch (error) {
      return { content: `Git stash error: ${(error as Error).message}`, isError: true };
    }
  }
}
