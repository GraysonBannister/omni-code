import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class GitCommitTool implements Tool {
  readonly name = 'GitCommit';
  readonly description = 'Stage files and create a git commit with a message. Can stage specific files or all changes.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Commit message' },
      files: { type: 'array', items: { type: 'string' }, description: 'Specific files to stage (optional, stages all if omitted)' },
      all: { type: 'boolean', description: 'Stage all modified and deleted files (default: false)' },
    },
    required: ['message'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.message !== 'string' || !input.message.trim()) return 'message must be a non-empty string';
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const message = input.message as string;
    const files = input.files as string[] | undefined;
    const all = input.all as boolean;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      if (files && files.length > 0) {
        await git.add(files);
      } else if (all) {
        await git.add(['-A']);
      }

      const result = await git.commit(message);
      return { content: `Committed: ${result}` };
    } catch (error) {
      return { content: `Git commit error: ${(error as Error).message}`, isError: true };
    }
  }
}
