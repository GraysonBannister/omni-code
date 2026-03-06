import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class GitDiffTool implements Tool {
  readonly name = 'GitDiff';
  readonly description = 'Show git diff for staged, unstaged, or branch comparison changes.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      staged: { type: 'boolean', description: 'Show staged changes only (default: false)' },
      file: { type: 'string', description: 'Show diff for a specific file only' },
      compare: { type: 'string', description: 'Compare branches/commits (e.g., "main...HEAD", "abc123..def456")' },
    },
    required: [],
  };

  validate(_input: Record<string, unknown>): string | null {
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const staged = input.staged as boolean;
    const file = input.file as string | undefined;
    const compare = input.compare as string | undefined;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      let diff: string;
      if (compare) {
        diff = await git.diffRange(compare);
      } else {
        diff = await git.diff(staged);
      }

      if (file) {
        // Filter diff to just the requested file
        const lines = diff.split('\n');
        const filtered: string[] = [];
        let inTargetFile = false;
        for (const line of lines) {
          if (line.startsWith('diff --git')) {
            inTargetFile = line.includes(file);
          }
          if (inTargetFile) filtered.push(line);
        }
        diff = filtered.join('\n');
      }

      if (!diff.trim()) return { content: 'No changes found.' };
      return { content: diff };
    } catch (error) {
      return { content: `Git diff error: ${(error as Error).message}`, isError: true };
    }
  }
}
