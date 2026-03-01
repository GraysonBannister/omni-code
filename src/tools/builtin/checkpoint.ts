import simpleGit from 'simple-git';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const CHECKPOINT_PREFIX = 'omni-checkpoint:';
const VALID_ACTIONS = ['create', 'list', 'restore', 'delete'] as const;
type Action = typeof VALID_ACTIONS[number];

export class CheckpointTool implements Tool {
  readonly name = 'Checkpoint';
  readonly description = 'Create, list, restore, or delete named git checkpoints. Useful for safe experimentation with rollback capability.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: create, list, restore, or delete',
      },
      name: {
        type: 'string',
        description: 'Checkpoint name (required for create/restore/delete)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    if (action !== 'list' && (typeof input.name !== 'string' || !input.name.trim())) {
      return `name is required for "${action}" action`;
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;
    const name = (input.name as string)?.trim();
    const git = simpleGit(context.cwd);

    // Verify we're in a git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { content: 'Not a git repository. Checkpoints require git.', isError: true };
    }

    try {
      switch (action) {
        case 'create':
          return await this.createCheckpoint(git, name);
        case 'list':
          return await this.listCheckpoints(git);
        case 'restore':
          return await this.restoreCheckpoint(git, name);
        case 'delete':
          return await this.deleteCheckpoint(git, name);
      }
    } catch (error) {
      return { content: `Checkpoint error: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return `Checkpoint: ${input.action} "${input.name || ''}"`;
  }

  private async createCheckpoint(git: ReturnType<typeof simpleGit>, name: string): Promise<ToolResult> {
    const stashMessage = `${CHECKPOINT_PREFIX}${name}`;

    // Stage all files including untracked
    await git.add('-A');

    // Stash everything with our prefix
    const stashResult = await git.stash(['push', '--include-untracked', '-m', stashMessage]);

    if (stashResult.includes('No local changes')) {
      return { content: `No changes to checkpoint. Working directory is clean.` };
    }

    // Immediately restore the working state
    await git.stash(['apply']);

    return {
      content: `Checkpoint "${name}" created. Working directory preserved.\nUse "restore" to revert to this state, or "list" to see all checkpoints.`,
    };
  }

  private async listCheckpoints(git: ReturnType<typeof simpleGit>): Promise<ToolResult> {
    const stashList = await git.stash(['list']);

    if (!stashList.trim()) {
      return { content: 'No checkpoints found.' };
    }

    const lines = stashList.trim().split('\n');
    const checkpoints = lines
      .filter(line => line.includes(CHECKPOINT_PREFIX))
      .map(line => {
        const match = line.match(/^(stash@\{\d+\}):.*omni-checkpoint:(.+)$/);
        if (match) {
          return `  ${match[2]} (${match[1]})`;
        }
        return null;
      })
      .filter(Boolean);

    if (checkpoints.length === 0) {
      return { content: 'No omni-code checkpoints found (other stashes may exist).' };
    }

    return {
      content: `Checkpoints:\n${checkpoints.join('\n')}`,
      metadata: { count: checkpoints.length },
    };
  }

  private async restoreCheckpoint(git: ReturnType<typeof simpleGit>, name: string): Promise<ToolResult> {
    const stashRef = await this.findStashRef(git, name);
    if (!stashRef) {
      return { content: `Checkpoint "${name}" not found. Use "list" to see available checkpoints.`, isError: true };
    }

    await git.stash(['apply', stashRef]);

    return {
      content: `Restored checkpoint "${name}" (${stashRef}). The checkpoint still exists — use "delete" to remove it.`,
    };
  }

  private async deleteCheckpoint(git: ReturnType<typeof simpleGit>, name: string): Promise<ToolResult> {
    const stashRef = await this.findStashRef(git, name);
    if (!stashRef) {
      return { content: `Checkpoint "${name}" not found.`, isError: true };
    }

    await git.stash(['drop', stashRef]);

    return { content: `Deleted checkpoint "${name}" (${stashRef}).` };
  }

  private async findStashRef(git: ReturnType<typeof simpleGit>, name: string): Promise<string | null> {
    const stashList = await git.stash(['list']);
    const lines = stashList.trim().split('\n');

    for (const line of lines) {
      if (line.includes(`${CHECKPOINT_PREFIX}${name}`)) {
        const match = line.match(/^(stash@\{\d+\})/);
        if (match) return match[1];
      }
    }

    return null;
  }
}
