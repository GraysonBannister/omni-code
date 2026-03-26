import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';
import simpleGit from 'simple-git';

export class PreviewDiffTool implements Tool {
  readonly name = 'PreviewDiff';
  readonly description = 'Preview git diff for current changes. Shows unstaged or staged changes, optionally for a specific file.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      staged: {
        type: 'boolean',
        description: 'Show staged (--cached) diff instead of unstaged (default: false)',
      },
      file: {
        type: 'string',
        description: 'Specific file path to diff (default: all files)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.staged !== undefined && typeof input.staged !== 'boolean') {
      return 'staged must be a boolean';
    }
    if (input.file !== undefined && typeof input.file !== 'string') {
      return 'file must be a string path';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const staged = (input.staged as boolean) || false;
    const file = input.file as string | undefined;

    try {
      const gitManager = new GitManager(context.cwd);
      const isRepo = await gitManager.isRepo();
      if (!isRepo) {
        return { content: 'Not a git repository.', isError: true };
      }

      // Use simple-git directly for file-specific diffs
      const git = simpleGit(context.cwd);
      const args: string[] = [];
      if (staged) args.push('--staged');
      if (file) args.push('--', file);

      const diff = await git.diff(args);

      if (!diff.trim()) {
        const target = file ? `for ${file}` : '';
        const type = staged ? 'staged' : 'unstaged';
        return { content: `No ${type} changes ${target}`.trim() + '.' };
      }

      // Also get a summary
      const statArgs = ['--stat', ...args];
      const stat = await git.diff(statArgs);

      return {
        content: `## Diff Summary\n${stat}\n## Full Diff\n${diff}`,
      };
    } catch (error) {
      return { content: `Error getting diff: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const lines = result.content.split('\n').length;
    const type = input.staged ? 'staged' : 'unstaged';
    return `Showing ${type} diff (${lines} lines)`;
  }
}
