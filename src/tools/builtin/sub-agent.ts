import PQueue from 'p-queue';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface SubTask {
  description: string;
  planMode?: boolean;
}

export class SubAgentTool implements Tool {
  readonly name = 'SubAgent';
  readonly description = 'Spawn parallel sub-agents for concurrent research tasks. Each sub-agent runs independently and results are collected.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.AGENT;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        description: 'Array of tasks for sub-agents to execute in parallel',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Task description for the sub-agent' },
            planMode: { type: 'boolean', description: 'Run sub-agent in plan/read-only mode (default: true)' },
          },
          required: ['description'],
        },
      },
      maxConcurrent: {
        type: 'number',
        description: 'Maximum concurrent sub-agents (default: 3)',
      },
    },
    required: ['tasks'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (!Array.isArray(input.tasks) || input.tasks.length === 0) {
      return 'tasks must be a non-empty array';
    }
    for (let i = 0; i < input.tasks.length; i++) {
      const task = input.tasks[i] as Record<string, unknown>;
      if (typeof task.description !== 'string' || !task.description.trim()) {
        return `tasks[${i}].description must be a non-empty string`;
      }
    }
    if (input.maxConcurrent !== undefined && (typeof input.maxConcurrent !== 'number' || input.maxConcurrent < 1)) {
      return 'maxConcurrent must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    if (!context.spawnSubAgent) {
      return {
        content: 'Sub-agent spawning is not available in this context.',
        isError: true,
      };
    }

    const tasks = input.tasks as SubTask[];
    const maxConcurrent = (input.maxConcurrent as number) || 3;

    const queue = new PQueue({ concurrency: maxConcurrent });
    const results: { index: number; description: string; result: string; error?: string }[] = [];

    const promises = tasks.map((task, index) =>
      queue.add(async () => {
        try {
          const result = await context.spawnSubAgent!(
            task.description,
            task.planMode ?? true,
          );
          results.push({ index, description: task.description, result });
        } catch (error) {
          results.push({
            index,
            description: task.description,
            result: '',
            error: (error as Error).message,
          });
        }
      })
    );

    await Promise.all(promises);

    // Sort by original index
    results.sort((a, b) => a.index - b.index);

    const succeeded = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    let output = `Sub-agent results (${succeeded.length}/${tasks.length} succeeded):\n`;

    for (const r of results) {
      output += `\n--- Task ${r.index + 1}: ${r.description} ---\n`;
      if (r.error) {
        output += `ERROR: ${r.error}\n`;
      } else {
        output += `${r.result}\n`;
      }
    }

    return {
      content: output,
      isError: failed.length === tasks.length,
      metadata: { total: tasks.length, succeeded: succeeded.length, failed: failed.length },
    };
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    const s = result.metadata?.succeeded || 0;
    const t = result.metadata?.total || 0;
    return `Sub-agents: ${s}/${t} completed`;
  }
}
