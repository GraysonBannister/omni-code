import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache',
  '__pycache__', '.pytest_cache', '.mypy_cache', 'coverage',
  '.DS_Store', 'Thumbs.db',
]);

export class FileTreeTool implements Tool {
  readonly name = 'FileTree';
  readonly description = 'Display hierarchical directory structure as a tree. Useful for understanding project layout.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory to display tree for (default: cwd)',
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth to traverse (default: 3)',
      },
      includeHidden: {
        type: 'boolean',
        description: 'Include hidden files/directories (default: false)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.maxDepth !== undefined && (typeof input.maxDepth !== 'number' || input.maxDepth < 1)) {
      return 'maxDepth must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const targetPath = (input.path as string) || context.cwd;
    const maxDepth = (input.maxDepth as number) || 3;
    const includeHidden = (input.includeHidden as boolean) || false;

    try {
      const absPath = path.isAbsolute(targetPath) ? targetPath : path.join(context.cwd, targetPath);
      const stat = await fs.stat(absPath);
      if (!stat.isDirectory()) {
        return { content: `Not a directory: ${absPath}`, isError: true };
      }

      const lines: string[] = [path.basename(absPath) + '/'];
      await this.buildTree(absPath, '', maxDepth, 0, includeHidden, lines);

      return { content: lines.join('\n') };
    } catch (error) {
      return { content: `Error reading directory: ${(error as Error).message}`, isError: true };
    }
  }

  private async buildTree(
    dirPath: string,
    prefix: string,
    maxDepth: number,
    currentDepth: number,
    includeHidden: boolean,
    lines: string[],
  ): Promise<void> {
    if (currentDepth >= maxDepth) return;

    let entries = await fs.readdir(dirPath, { withFileTypes: true });

    // Filter
    entries = entries.filter(entry => {
      if (!includeHidden && entry.name.startsWith('.')) return false;
      if (DEFAULT_IGNORE.has(entry.name)) return false;
      return true;
    });

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      const name = entry.isDirectory() ? entry.name + '/' : entry.name;

      lines.push(prefix + connector + name);

      if (entry.isDirectory()) {
        await this.buildTree(
          path.join(dirPath, entry.name),
          prefix + childPrefix,
          maxDepth,
          currentDepth + 1,
          includeHidden,
          lines,
        );
      }
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const lines = result.content.split('\n').length;
    return `File tree: ${lines} entries`;
  }
}
