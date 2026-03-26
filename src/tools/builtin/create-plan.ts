import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

/**
 * Generate a unique plan filename like Cursor: {snake_case}_{8_char_hash}.plan.md
 */
function generatePlanFileName(title: string): string {
  // Convert to snake_case
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);

  // Generate 8-char hex hash
  const hash = Array.from({ length: 8 }, () =>
    '0123456789abcdef'.charAt(Math.floor(Math.random() * 16))
  ).join('');

  return `${slug}_${hash}.plan.md`;
}

/**
 * Find an existing plan by title (partial match)
 */
async function findExistingPlan(cwd: string, title: string): Promise<string | null> {
  try {
    const files = await fs.readdir(cwd);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // Look for files matching the pattern: {slug}_*.plan.md or PLAN.md
    const planFiles = files.filter(f =>
      f.endsWith('.plan.md') || f === 'PLAN.md'
    );

    // Check if any existing plan matches this title
    for (const file of planFiles) {
      if (file.startsWith(slug) || file === 'PLAN.md') {
        return path.join(cwd, file);
      }
    }
  } catch {
    // Directory doesn't exist or can't read
  }
  return null;
}

export interface PlanSection {
  title: string;
  tasks: string[];
}

export interface PlanMetadata {
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export class CreatePlanTool implements Tool {
  readonly name = 'CreatePlan';
  readonly description = `Creates a plan file in the project root with a structured task list using markdown checkboxes. Generates unique filenames like "my_plan_abc123.plan.md" so multiple plans can coexist. Use this in architect mode to create a plan that can be referenced and checked off as tasks are completed.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the plan/project',
      },
      description: {
        type: 'string',
        description: 'Brief overview of what the plan covers',
      },
      sections: {
        type: 'array',
        description: 'Organized sections of tasks',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Section title (e.g., "Phase 1: Setup")' },
            tasks: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of task descriptions for this section',
            },
          },
          required: ['title', 'tasks'],
        },
      },
      notes: {
        type: 'string',
        description: 'Optional notes, context, or decisions to include at the end',
      },
    },
    required: ['title', 'sections'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      return 'title must be a non-empty string';
    }
    if (!Array.isArray(input.sections) || input.sections.length === 0) {
      return 'sections must be a non-empty array';
    }
    for (const section of input.sections) {
      if (typeof section.title !== 'string' || !section.title.trim()) {
        return 'each section must have a non-empty title';
      }
      if (!Array.isArray(section.tasks) || section.tasks.length === 0) {
        return 'each section must have a non-empty tasks array';
      }
      for (const task of section.tasks) {
        if (typeof task !== 'string' || !task.trim()) {
          return 'each task must be a non-empty string';
        }
      }
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const title = (input.title as string).trim();
    const description = (input.description as string)?.trim();
    const sections = input.sections as PlanSection[];
    const notes = (input.notes as string)?.trim();

    try {
      // Check for existing plan with same title
      const existingPlan = await findExistingPlan(context.cwd, title);

      // Generate unique filename
      const planFileName = generatePlanFileName(title);
      const planPath = path.join(context.cwd, planFileName);

      // Generate plan content
      const now = new Date().toISOString();
      const planContent = this.generatePlanContent({
        title,
        description,
        sections,
        notes,
        createdAt: now,
        updatedAt: now,
      });

      // Write the plan file
      await fs.writeFile(planPath, planContent, 'utf-8');

      // Count total tasks
      const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);

      let message = `Created plan at ${planPath} with ${sections.length} sections and ${totalTasks} tasks.`;
      if (existingPlan) {
        message += `\n\nNote: Another plan with a similar title exists at ${existingPlan}. Both plans are preserved.`;
      }

      return {
        content: message,
        metadata: {
          path: planPath,
          title,
          sectionCount: sections.length,
          taskCount: totalTasks,
          existingPlan: existingPlan || undefined,
        },
      };
    } catch (error) {
      return {
        content: `Error creating plan: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  private generatePlanContent(params: {
    title: string;
    description?: string;
    sections: PlanSection[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }): string {
    const lines: string[] = [];

    // Generate todos from sections
    const todos: Array<{ id: string; content: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; complexity?: 'low' | 'medium' | 'high' }> = [];
    let todoId = 1;

    for (const section of params.sections) {
      for (const task of section.tasks) {
        // Try to extract complexity from task text (e.g., "[MEDIUM] Task description")
        let complexity: 'low' | 'medium' | 'high' | undefined;
        let taskContent = task;

        const complexityMatch = task.match(/^\[(LOW|MEDIUM|HIGH)\]\s*/i);
        if (complexityMatch) {
          complexity = complexityMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
          taskContent = task.replace(/^\[(LOW|MEDIUM|HIGH)\]\s*/i, '');
        }

        todos.push({
          id: String(todoId++),
          content: taskContent,
          status: 'pending',
          complexity,
        });
      }
    }

    // Calculate estimated cost (rough estimate)
    const estimatedCost = todos.reduce((sum, todo) => {
      const complexityCost = todo.complexity === 'high' ? 0.5 : todo.complexity === 'medium' ? 0.2 : 0.1;
      return sum + complexityCost;
    }, 0.5); // Base cost

    // YAML Frontmatter
    lines.push('---');
    lines.push(`name: ${params.title}`);
    lines.push(`overview: |`);
    lines.push(`  ${params.description || `Implementation plan for ${params.title}`}`);
    lines.push(`isProject: true`);
    lines.push(`createdAt: ${params.createdAt}`);
    lines.push(`updatedAt: ${params.updatedAt}`);
    lines.push(`estimatedCost: ${estimatedCost.toFixed(2)}`);
    lines.push(`costLimit: ${Math.max(5, Math.ceil(estimatedCost * 2))}`);
    lines.push('todos:');

    for (const todo of todos) {
      lines.push(`  - id: "${todo.id}"`);
      lines.push(`    content: "${todo.content.replace(/"/g, '\\"')}"`);
      lines.push(`    status: "${todo.status}"`);
      if (todo.complexity) {
        lines.push(`    complexity: "${todo.complexity}"`);
      }
    }

    lines.push('---');
    lines.push('');

    // Overview section
    lines.push('## Overview');
    lines.push(params.description || `Implementation plan for ${params.title}`);
    lines.push('');

    // Progress summary
    lines.push('## Progress');
    lines.push(`- Total Tasks: ${todos.length}`);
    lines.push(`- Completed: 0/${todos.length} (0%)`);
    lines.push(`- Estimated Cost: ~$${estimatedCost.toFixed(2)}`);
    lines.push('');

    // Tasks by section
    lines.push('## Implementation Tasks');
    lines.push('');

    let taskIdx = 0;
    for (const section of params.sections) {
      lines.push(`### ${section.title}`);
      lines.push('');
      for (const _task of section.tasks) {
        const todo = todos[taskIdx++];
        const complexityBadge = todo.complexity ? `[${todo.complexity.toUpperCase()}] ` : '';
        lines.push(`- [ ] ${complexityBadge}${todo.content}`);
      }
      lines.push('');
    }

    // Notes
    if (params.notes) {
      lines.push('## Notes');
      lines.push(params.notes);
      lines.push('');
    }

    return lines.join('\n');
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const title = input.title as string;
    return `Created plan "${title}" with ${result.metadata?.taskCount || 0} tasks`;
  }
}
