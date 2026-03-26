import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class EditFileTool implements Tool {
  readonly name = 'Edit';
  readonly description = 'Performs exact string replacements in files. The old_string must be unique in the file.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to modify',
      },
      old_string: {
        type: 'string',
        description: 'The exact text to replace',
      },
      new_string: {
        type: 'string',
        description: 'The text to replace it with',
      },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences (default: false)',
      },
    },
    required: ['file_path', 'old_string', 'new_string'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) {
      return 'file_path must be a non-empty string';
    }
    if (!path.isAbsolute(input.file_path)) {
      return 'file_path must be an absolute path';
    }
    if (typeof input.old_string !== 'string') {
      return 'old_string must be a string';
    }
    if (typeof input.new_string !== 'string') {
      return 'new_string must be a string';
    }
    if (input.old_string === input.new_string) {
      return 'old_string and new_string must be different';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const oldString = input.old_string as string;
    const newString = input.new_string as string;
    const replaceAll = (input.replace_all as boolean) || false;

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (!content.includes(oldString)) {
        return {
          content: `The old_string was not found in the file. Make sure it matches exactly, including whitespace and indentation.`,
          isError: true,
        };
      }

      if (!replaceAll) {
        const firstIndex = content.indexOf(oldString);
        const lastIndex = content.lastIndexOf(oldString);
        if (firstIndex !== lastIndex) {
          const occurrences = content.split(oldString).length - 1;
          return {
            content: `The old_string appears ${occurrences} times in the file. Use replace_all: true to replace all occurrences, or provide a larger string with more context to make it unique.`,
            isError: true,
          };
        }
      }

      const updated = replaceAll
        ? content.split(oldString).join(newString)
        : content.replace(oldString, newString);

      await fs.writeFile(filePath, updated, 'utf-8');

      const replacements = replaceAll ? content.split(oldString).length - 1 : 1;
      return {
        content: `Successfully replaced ${replacements} occurrence(s) in ${filePath}`,
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { content: `File not found: ${filePath}`, isError: true };
      }
      return { content: `Error editing file: ${err.message}`, isError: true };
    }
  }
}
