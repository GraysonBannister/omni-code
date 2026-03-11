import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export const PLAN_FILE_NAME = 'PLAN.md';

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
  readonly description = `Creates a PLAN.md file in the project root with a structured task list using markdown checkboxes. Use this in architect mode to create a plan that can be referenced and checked off as tasks are completed.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = true;

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
      const planPath = path.join(context.cwd, PLAN_FILE_NAME);

      // Check if plan already exists
      try {
        await fs.access(planPath);
        return {
          content: `Error: PLAN.md already exists at ${planPath}. Use UpdatePlan to modify the existing plan or delete it first.`,
          isError: true,
        };
      } catch {
        // File doesn't exist, proceed
      }

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

      return {
        content: `Created plan at ${planPath} with ${sections.length} sections and ${totalTasks} tasks.`,
        metadata: {
          path: planPath,
          title,
          sectionCount: sections.length,
          taskCount: totalTasks,
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

    // Header
    lines.push(`# Project Plan: ${params.title}`);
    lines.push('');

    // Metadata
    lines.push(`> Created: ${new Date(params.createdAt).toLocaleString()}`);
    lines.push('');

    // Description
    if (params.description) {
      lines.push('## Overview');
      lines.push(params.description);
      lines.push('');
    }

    // Progress summary
    const totalTasks = params.sections.reduce((sum, s) => sum + s.tasks.length, 0);
    lines.push('## Progress');
    lines.push(`- [ ] **${totalTasks} tasks** in ${params.sections.length} sections`);
    lines.push(`- Progress: 0/${totalTasks} (0%)`);
    lines.push('');

    // Tasks by section
    lines.push('## Tasks');
    lines.push('');

    for (const section of params.sections) {
      lines.push(`### ${section.title}`);
      lines.push('');
      for (const task of section.tasks) {
        lines.push(`- [ ] ${task}`);
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
