import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { PLAN_FILE_NAME } from './create-plan.js';

export interface PlanTask {
  description: string;
  checked: boolean;
  section: string;
}

export interface PlanSectionData {
  title: string;
  tasks: PlanTask[];
}

export interface PlanData {
  title: string;
  description?: string;
  progress: {
    total: number;
    checked: number;
    percent: number;
  };
  sections: PlanSectionData[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ReadPlanTool implements Tool {
  readonly name = 'ReadPlan';
  readonly description = `Reads and parses the PLAN.md file to check current status, view tasks, and see progress. Returns structured data about tasks, sections, and completion status.`;
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description: 'Filter by section title (optional)',
      },
      status: {
        type: 'string',
        description: 'Filter tasks by status',
        enum: ['all', 'pending', 'complete'],
      },
      format: {
        type: 'string',
        description: 'Output format',
        enum: ['structured', 'markdown', 'summary'],
      },
    },
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.status !== undefined && !['all', 'pending', 'complete'].includes(input.status as string)) {
      return 'status must be one of: all, pending, complete';
    }
    if (input.format !== undefined && !['structured', 'markdown', 'summary'].includes(input.format as string)) {
      return 'format must be one of: structured, markdown, summary';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const sectionFilter = (input.section as string)?.trim();
    const statusFilter = (input.status as string) || 'all';
    const format = (input.format as string) || 'structured';

    try {
      const planPath = path.join(context.cwd, PLAN_FILE_NAME);

      // Read plan file
      let content: string;
      try {
        content = await fs.readFile(planPath, 'utf-8');
      } catch {
        return {
          content: `No PLAN.md found at ${planPath}. Use CreatePlan to create a plan.`,
          isError: false,
          metadata: { exists: false },
        };
      }

      // Parse the plan
      const planData = this.parsePlan(content);

      // Apply filters
      let filteredData = planData;
      if (sectionFilter) {
        filteredData = {
          ...planData,
          sections: planData.sections.filter(s =>
            s.title.toLowerCase().includes(sectionFilter.toLowerCase())
          ),
        };
      }

      if (statusFilter !== 'all') {
        filteredData = {
          ...filteredData,
          sections: filteredData.sections.map(s => ({
            ...s,
            tasks: s.tasks.filter(t =>
              statusFilter === 'complete' ? t.checked : !t.checked
            ),
          })).filter(s => s.tasks.length > 0),
        };
      }

      // Recalculate progress for filtered data
      const totalTasks = filteredData.sections.reduce((sum, s) => sum + s.tasks.length, 0);
      const checkedTasks = filteredData.sections.reduce(
        (sum, s) => sum + s.tasks.filter(t => t.checked).length,
        0
      );
      filteredData.progress = {
        total: totalTasks,
        checked: checkedTasks,
        percent: totalTasks > 0 ? Math.round((checkedTasks / totalTasks) * 100) : 0,
      };

      // Format output
      let outputContent: string;
      switch (format) {
        case 'markdown':
          outputContent = content;
          break;
        case 'summary':
          outputContent = this.formatSummary(filteredData);
          break;
        case 'structured':
        default:
          outputContent = this.formatStructured(filteredData);
          break;
      }

      return {
        content: outputContent,
        metadata: {
          exists: true,
          path: planPath,
          plan: filteredData,
        },
      };
    } catch (error) {
      return {
        content: `Error reading plan: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  private parsePlan(content: string): PlanData {
    const lines = content.split('\n');
    const plan: PlanData = {
      title: '',
      progress: { total: 0, checked: 0, percent: 0 },
      sections: [],
    };

    let currentSection: PlanSectionData | null = null;
    let inNotes = false;
    const notesLines: string[] = [];

    for (const line of lines) {
      // Title
      if (line.startsWith('# ')) {
        plan.title = line.replace('# ', '').replace('Project Plan: ', '').trim();
        continue;
      }

      // Metadata (Created/Updated)
      const createdMatch = line.match(/> Created: (.+)$/);
      if (createdMatch) {
        plan.createdAt = createdMatch[1].trim();
      }
      const updatedMatch = line.match(/> Updated: (.+)$/);
      if (updatedMatch) {
        plan.updatedAt = updatedMatch[1].trim();
      }

      // Overview/Description
      if (line === '## Overview') {
        continue;
      }
      if (line === '## Progress') {
        // Parse progress
        continue;
      }
      if (line.startsWith('- [ ] **') || line.startsWith('- [x] **')) {
        const match = line.match(/- \[([ x])\] \*\*(\d+) tasks\*\*/);
        if (match) {
          plan.progress.total = parseInt(match[2], 10);
        }
        continue;
      }
      if (line.includes('Progress:')) {
        const match = line.match(/Progress: (\d+)\/(\d+)/);
        if (match) {
          plan.progress.checked = parseInt(match[1], 10);
          plan.progress.total = parseInt(match[2], 10);
          plan.progress.percent = plan.progress.total > 0
            ? Math.round((plan.progress.checked / plan.progress.total) * 100)
            : 0;
        }
        continue;
      }

      // Section headers
      if (line.startsWith('### ')) {
        if (currentSection) {
          plan.sections.push(currentSection);
        }
        currentSection = {
          title: line.replace('### ', '').trim(),
          tasks: [],
        };
        inNotes = false;
        continue;
      }

      // Task lines
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        const description = line.replace(/^- \[([ x])\] /, '').trim();
        if (currentSection) {
          currentSection.tasks.push({
            description,
            checked,
            section: currentSection.title,
          });
        }
        continue;
      }

      // Notes section
      if (line === '## Notes') {
        inNotes = true;
        continue;
      }
      if (inNotes && line.startsWith('## ')) {
        inNotes = false;
      }
      if (inNotes && line.trim()) {
        notesLines.push(line);
      }
    }

    // Add final section
    if (currentSection) {
      plan.sections.push(currentSection);
    }

    if (notesLines.length > 0) {
      plan.notes = notesLines.join('\n');
    }

    // Recalculate progress from actual tasks
    const total = plan.sections.reduce((sum, s) => sum + s.tasks.length, 0);
    const checked = plan.sections.reduce(
      (sum, s) => sum + s.tasks.filter(t => t.checked).length,
      0
    );
    plan.progress = {
      total,
      checked,
      percent: total > 0 ? Math.round((checked / total) * 100) : 0,
    };

    return plan;
  }

  private formatSummary(data: PlanData): string {
    const lines: string[] = [];
    lines.push(`Plan: ${data.title}`);
    lines.push(`Progress: ${data.progress.checked}/${data.progress.total} (${data.progress.percent}%)`);
    lines.push('');

    for (const section of data.sections) {
      const sectionChecked = section.tasks.filter(t => t.checked).length;
      const sectionTotal = section.tasks.length;
      lines.push(`${section.title}: ${sectionChecked}/${sectionTotal}`);
    }

    return lines.join('\n');
  }

  private formatStructured(data: PlanData): string {
    const lines: string[] = [];
    lines.push(`# ${data.title}`);
    lines.push('');
    lines.push(`**Progress:** ${data.progress.checked}/${data.progress.total} tasks (${data.progress.percent}%)`);
    lines.push('');

    for (const section of data.sections) {
      lines.push(`## ${section.title}`);
      lines.push('');
      for (const task of section.tasks) {
        const status = task.checked ? '[x]' : '[ ]';
        lines.push(`- ${status} ${task.description}`);
      }
      lines.push('');
    }

    if (data.notes) {
      lines.push('## Notes');
      lines.push(data.notes);
    }

    return lines.join('\n');
  }

  formatForDisplay(result: ToolResult): string {
    if (result.isError) return result.content;
    if (!result.metadata?.exists) return 'No plan exists yet';

    const plan = result.metadata.plan as PlanData;
    return `Plan: ${plan.title} - ${plan.progress.checked}/${plan.progress.total} (${plan.progress.percent}%)`;
  }
}
