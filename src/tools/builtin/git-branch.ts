import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class GitBranchTool implements Tool {
  readonly name = 'GitBranch';
  readonly description = 'List, create, switch, or delete git branches.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['list', 'create', 'switch', 'delete'], description: 'Branch action to perform' },
      name: { type: 'string', description: 'Branch name (required for create/switch/delete)' },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!['list', 'create', 'switch', 'delete'].includes(action)) return 'action must be list, create, switch, or delete';
    if (action !== 'list' && (!input.name || typeof input.name !== 'string')) return 'name is required for create/switch/delete';
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as string;
    const name = input.name as string;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      switch (action) {
        case 'list': {
          const branches = await git.listBranches();
          const current = await git.currentBranch();
          const formatted = branches.map(b => b === current ? `* ${b}` : `  ${b}`).join('\n');
          return { content: formatted || 'No branches found.' };
        }
        case 'create':
          await git.createBranch(name);
          return { content: `Created and switched to branch: ${name}` };
        case 'switch':
          await git.switchBranch(name);
          return { content: `Switched to branch: ${name}` };
        case 'delete':
          await git.deleteBranch(name);
          return { content: `Deleted branch: ${name}` };
        default:
          return { content: `Unknown action: ${action}`, isError: true };
      }
    } catch (error) {
      return { content: `Git branch error: ${(error as Error).message}`, isError: true };
    }
  }
}
