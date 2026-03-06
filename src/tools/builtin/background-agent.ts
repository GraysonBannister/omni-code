import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface BackgroundTask {
  id: string;
  task: string;
  status: 'running' | 'done' | 'error';
  result?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

// Module-level task tracking (persists for session lifetime)
const backgroundTasks = new Map<string, BackgroundTask>();

export class BackgroundAgentTool implements Tool {
  readonly name = 'BackgroundAgent';
  readonly description = `Spawn a background agent that works independently on a task. Returns a task ID immediately. Use 'status' to check progress and retrieve results.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.AGENT;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['spawn', 'status', 'list'],
        description: 'Action: spawn a new task, check status, or list all tasks',
      },
      task: {
        type: 'string',
        description: 'Task description for the background agent (required for spawn)',
      },
      task_id: {
        type: 'string',
        description: 'Task ID to check status of (required for status)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!['spawn', 'status', 'list'].includes(action)) return 'action must be spawn, status, or list';
    if (action === 'spawn' && (!input.task || typeof input.task !== 'string')) return 'task is required for spawn action';
    if (action === 'status' && (!input.task_id || typeof input.task_id !== 'string')) return 'task_id is required for status action';
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as string;

    switch (action) {
      case 'spawn': {
        const taskDesc = input.task as string;
        const taskId = crypto.randomUUID().substring(0, 8);

        if (!context.spawnSubAgent) {
          return { content: 'Background agents require sub-agent spawning capability.', isError: true };
        }

        const task: BackgroundTask = {
          id: taskId,
          task: taskDesc,
          status: 'running',
          startedAt: Date.now(),
        };
        backgroundTasks.set(taskId, task);

        // Fire and forget — the promise runs in the background
        context.spawnSubAgent(taskDesc, false).then(result => {
          task.status = 'done';
          task.result = result;
          task.completedAt = Date.now();
        }).catch(err => {
          task.status = 'error';
          task.error = (err as Error).message;
          task.completedAt = Date.now();
        });

        return {
          content: `Background task spawned with ID: ${taskId}\nTask: ${taskDesc}\nUse BackgroundAgent with action "status" and task_id "${taskId}" to check progress.`,
          metadata: { taskId },
        };
      }

      case 'status': {
        const taskId = input.task_id as string;
        const task = backgroundTasks.get(taskId);
        if (!task) return { content: `No task found with ID: ${taskId}`, isError: true };

        const elapsed = ((task.completedAt || Date.now()) - task.startedAt) / 1000;
        let statusText = `Task ${task.id}: ${task.status} (${elapsed.toFixed(1)}s)\nDescription: ${task.task}`;

        if (task.status === 'done' && task.result) {
          statusText += `\n\nResult:\n${task.result}`;
        } else if (task.status === 'error' && task.error) {
          statusText += `\n\nError: ${task.error}`;
        }

        return { content: statusText };
      }

      case 'list': {
        if (backgroundTasks.size === 0) return { content: 'No background tasks.' };

        const lines: string[] = [];
        for (const [id, task] of backgroundTasks) {
          const elapsed = ((task.completedAt || Date.now()) - task.startedAt) / 1000;
          lines.push(`${id} | ${task.status.padEnd(7)} | ${elapsed.toFixed(1)}s | ${task.task.substring(0, 60)}`);
        }

        return { content: `Background tasks:\n\nID       | Status  | Time   | Task\n${lines.join('\n')}` };
      }

      default:
        return { content: `Unknown action: ${action}`, isError: true };
    }
  }
}
