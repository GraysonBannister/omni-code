import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { PLAN_FILE_NAME } from './create-plan.js';

export class UpdatePlanTool implements Tool {
  readonly name = 'UpdatePlan';
  readonly description = `Updates the PLAN.md file - check/uncheck tasks, add new tasks or sections, or append notes. Use this to mark tasks complete as you work through the plan.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The update action to perform',
        enum: ['check', 'uncheck', 'add_task', 'add_section', 'append_note', 'update_progress'],
      },
      section: {
        type: 'string',
        description: 'Section title for the task (required for check/uncheck/add_task)',
      },
      task: {
        type: 'string',
        description: 'Task description to check/uncheck or add (exact match for check/uncheck)',
      },
      newSection: {
        type: 'object',
        description: 'New section to add (for add_section action)',
        properties: {
          title: { type: 'string' },
          tasks: { type: 'array', items: { type: 'string' } },
        },
      },
      note: {
        type: 'string',
        description: 'Note text to append (for append_note action)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    const validActions = ['check', 'uncheck', 'add_task', 'add_section', 'append_note', 'update_progress'];

    if (!validActions.includes(action)) {
      return `action must be one of: ${validActions.join(', ')}`;
    }

    if (['check', 'uncheck', 'add_task'].includes(action)) {
      if (typeof input.section !== 'string' || !input.section.trim()) {
        return 'section is required for this action';
      }
      if (typeof input.task !== 'string' || !input.task.trim()) {
        return 'task is required for this action';
      }
    }

    if (action === 'add_section') {
      if (!input.newSection || typeof input.newSection !== 'object') {
        return 'newSection is required for add_section action';
      }
      const ns = input.newSection as { title?: string; tasks?: string[] };
      if (!ns.title || typeof ns.title !== 'string') {
        return 'newSection.title is required';
      }
      if (!Array.isArray(ns.tasks)) {
        return 'newSection.tasks must be an array';
      }
    }

    if (action === 'append_note') {
      if (typeof input.note !== 'string' || !input.note.trim()) {
        return 'note is required for append_note action';
      }
    }

    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as string;

    try {
      const planPath = path.join(context.cwd, PLAN_FILE_NAME);

      // Check if plan exists
      let content: string;
      try {
        content = await fs.readFile(planPath, 'utf-8');
      } catch {
        return {
          content: `Error: No PLAN.md found at ${planPath}. Use CreatePlan to create a plan first.`,
          isError: true,
        };
      }

      let updatedContent: string;
      let resultMessage: string;

      switch (action) {
        case 'check':
        case 'uncheck': {
          const section = (input.section as string).trim();
          const task = (input.task as string).trim();
          const checkbox = action === 'check' ? '- [x]' : '- [ ]';
          const oldCheckbox = action === 'check' ? '- [ ]' : '- [x]';

          // Find and replace the specific task in the specific section
          const sectionRegex = new RegExp(
            `^(### ${this.escapeRegex(section)}[\\s\\S]*?)(^${this.escapeRegex(oldCheckbox)} ${this.escapeRegex(task)}$)`,
            'm'
          );

          if (!sectionRegex.test(content)) {
            return {
              content: `Error: Task "${task}" not found in section "${section}"`,
              isError: true,
            };
          }

          updatedContent = content.replace(sectionRegex, `$1${checkbox} ${task}`);
          resultMessage = `Marked task "${task}" as ${action === 'check' ? 'complete' : 'incomplete'}`;
          break;
        }

        case 'add_task': {
          const section = (input.section as string).trim();
          const task = (input.task as string).trim();

          // Find the section and add task at the end of its task list
          const sectionRegex = new RegExp(`^(### ${this.escapeRegex(section)}.*?)(\n\n### |\n## |$)`, 'm');
          const match = content.match(sectionRegex);

          if (!match) {
            return {
              content: `Error: Section "${section}" not found`,
              isError: true,
            };
          }

          // Insert task before the next section or end
          const insertPos = (match.index || 0) + match[0].length - match[2].length;
          updatedContent = content.slice(0, insertPos) + `- [ ] ${task}\n` + content.slice(insertPos);
          resultMessage = `Added task "${task}" to section "${section}"`;
          break;
        }

        case 'add_section': {
          const newSection = input.newSection as { title: string; tasks: string[] };
          const sectionContent = [
            '',
            `### ${newSection.title}`,
            '',
            ...newSection.tasks.map(t => `- [ ] ${t}`),
            '',
          ].join('\n');

          // Add before Notes section or at the end
          const notesMatch = content.match(/\n## Notes\n/);
          if (notesMatch && notesMatch.index !== undefined) {
            updatedContent = content.slice(0, notesMatch.index) + sectionContent + content.slice(notesMatch.index);
          } else {
            updatedContent = content + sectionContent;
          }
          resultMessage = `Added section "${newSection.title}" with ${newSection.tasks.length} tasks`;
          break;
        }

        case 'append_note': {
          const note = (input.note as string).trim();
          const timestamp = new Date().toLocaleString();
          const noteEntry = `\n**${timestamp}:** ${note}`;

          const notesMatch = content.match(/\n## Notes\n/);
          if (notesMatch && notesMatch.index !== undefined) {
            // Append to existing Notes section
            updatedContent = content.slice(0, notesMatch.index + notesMatch[0].length) + noteEntry + content.slice(notesMatch.index + notesMatch[0].length);
          } else {
            // Add new Notes section at the end
            updatedContent = content + `\n## Notes\n${noteEntry}\n`;
          }
          resultMessage = `Appended note to plan`;
          break;
        }

        case 'update_progress': {
          // Recalculate and update the progress section
          const progress = this.calculateProgress(content);
          const progressRegex = /## Progress\n[\s\S]*?(?=\n## |\n### |$)/;
          const newProgress = `## Progress\n- ${progress.checked}/${progress.total} tasks complete (${progress.percent}%)\n`;

          if (progressRegex.test(content)) {
            updatedContent = content.replace(progressRegex, newProgress);
          } else {
            // Add progress section after Overview if it exists
            const overviewMatch = content.match(/## Overview\n[\s\S]*?\n\n/);
            if (overviewMatch && overviewMatch.index !== undefined) {
              const insertPos = overviewMatch.index + overviewMatch[0].length;
              updatedContent = content.slice(0, insertPos) + newProgress + '\n' + content.slice(insertPos);
            } else {
              // Add after header
              const headerMatch = content.match(/^# .*\n/);
              if (headerMatch && headerMatch.index !== undefined) {
                const insertPos = headerMatch.index + headerMatch[0].length;
                updatedContent = content.slice(0, insertPos) + '\n' + newProgress + '\n' + content.slice(insertPos);
              } else {
                updatedContent = newProgress + '\n' + content;
              }
            }
          }
          resultMessage = `Updated progress: ${progress.checked}/${progress.total} (${progress.percent}%)`;
          break;
        }

        default:
          return {
            content: `Error: Unknown action "${action}"`,
            isError: true,
          };
      }

      // Update the updated timestamp
      updatedContent = updatedContent.replace(
        /(> Created: .*?\n)(> Updated: .*?\n)?/,
        `$1> Updated: ${new Date().toLocaleString()}\n`
      );

      // Write updated content
      await fs.writeFile(planPath, updatedContent, 'utf-8');

      return {
        content: resultMessage,
        metadata: { action, path: planPath },
      };
    } catch (error) {
      return {
        content: `Error updating plan: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private calculateProgress(content: string): { total: number; checked: number; percent: number } {
    const unchecked = (content.match(/- \[ \]/g) || []).length;
    const checked = (content.match(/- \[x\]/g) || []).length;
    const total = unchecked + checked;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, percent };
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const action = input.action as string;
    switch (action) {
      case 'check':
        return `Checked off task`;
      case 'uncheck':
        return `Unchecked task`;
      case 'add_task':
        return `Added task to plan`;
      case 'add_section':
        return `Added section with ${input.newSection ? (input.newSection as { tasks: string[] }).tasks.length : 0} tasks`;
      case 'append_note':
        return `Added note to plan`;
      case 'update_progress':
        return `Updated progress`;
      default:
        return `Updated plan`;
    }
  }
}
