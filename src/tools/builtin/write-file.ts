import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class WriteFileTool implements Tool {
  readonly name = 'Write';
  readonly description = 'Creates or overwrites a file with the specified content.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) {
      return 'file_path must be a non-empty string';
    }
    if (!path.isAbsolute(input.file_path)) {
      return 'file_path must be an absolute path';
    }
    if (typeof input.content !== 'string') {
      return 'content must be a string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const content = input.content as string;

    try {
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      const lines = content.split('\n').length;
      return { content: `File written successfully: ${filePath} (${lines} lines)` };
    } catch (error) {
      return { content: `Error writing file: ${(error as Error).message}`, isError: true };
    }
  }
}
