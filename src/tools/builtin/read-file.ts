import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import type { ImageBlock } from '../../core/message-types.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']);
const MIME_MAP: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
};

export class ReadFileTool implements Tool {
  readonly name = 'Read';
  readonly description = 'Reads a file from the local filesystem. Returns content with line numbers.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to read',
      },
      offset: {
        type: 'number',
        description: 'Line number to start reading from (1-based)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of lines to read',
      },
    },
    required: ['file_path'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) {
      return 'file_path must be a non-empty string';
    }
    if (!path.isAbsolute(input.file_path)) {
      return 'file_path must be an absolute path';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const offset = (input.offset as number) || 1;
    const limit = (input.limit as number) || 2000;

    try {
      // Handle image files
      const ext = path.extname(filePath).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        const mediaType = MIME_MAP[ext] || 'application/octet-stream';
        const imageBlock: ImageBlock = {
          type: 'image',
          source: { type: 'base64', mediaType, data: base64 },
        };
        return {
          content: `Image file: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB, ${mediaType})`,
          contentBlocks: [imageBlock],
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const sliced = lines.slice(offset - 1, offset - 1 + limit);
      const numbered = sliced
        .map((line, i) => {
          const lineNum = String(offset + i).padStart(6);
          const truncated = line.length > 2000 ? line.substring(0, 2000) + '...' : line;
          return `${lineNum}\t${truncated}`;
        })
        .join('\n');

      return { content: numbered };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return { content: `File not found: ${filePath}`, isError: true };
      }
      if (err.code === 'EISDIR') {
        return { content: `Path is a directory, not a file: ${filePath}`, isError: true };
      }
      return { content: `Error reading file: ${err.message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const lines = result.content.split('\n').length;
    return `Read ${lines} lines from ${input.file_path}`;
  }
}
