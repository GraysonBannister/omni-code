import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import fg from 'fast-glob';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class SymbolRenameTool implements Tool {
  readonly name = 'SymbolRename';
  readonly description = 'Rename a symbol across all matching files using word-boundary matching. Defaults to dry-run mode for previewing changes.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.WRITE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      oldName: {
        type: 'string',
        description: 'The symbol name to rename',
      },
      newName: {
        type: 'string',
        description: 'The new name for the symbol',
      },
      path: {
        type: 'string',
        description: 'Directory scope for the rename (default: cwd)',
      },
      glob: {
        type: 'string',
        description: 'File filter glob pattern (default: **/*.{ts,tsx,js,jsx,py,rs,go})',
      },
      dryRun: {
        type: 'boolean',
        description: 'Preview changes without applying (default: true)',
      },
    },
    required: ['oldName', 'newName'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.oldName !== 'string' || !input.oldName.trim()) {
      return 'oldName must be a non-empty string';
    }
    if (typeof input.newName !== 'string' || !input.newName.trim()) {
      return 'newName must be a non-empty string';
    }
    if (input.oldName === input.newName) {
      return 'oldName and newName must be different';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const oldName = input.oldName as string;
    const newName = input.newName as string;
    const searchPath = (input.path as string) || context.cwd;
    const globPattern = (input.glob as string) || '**/*.{ts,tsx,js,jsx,py,rs,go}';
    const dryRun = input.dryRun !== false; // default true

    const absPath = path.isAbsolute(searchPath) ? searchPath : path.join(context.cwd, searchPath);
    const regex = new RegExp('\\b' + this.escapeRegex(oldName) + '\\b', 'g');

    try {
      const files = await fg(globPattern, {
        cwd: absPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      const changes: { file: string; line: number; before: string; after: string }[] = [];
      let totalReplacements = 0;
      const filesChanged = new Set<string>();

      for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(regex);
          if (matches) {
            const replaced = line.replace(regex, newName);
            changes.push({
              file: path.relative(absPath, filePath),
              line: i + 1,
              before: line.trim(),
              after: replaced.trim(),
            });
            totalReplacements += matches.length;
            filesChanged.add(filePath);
          }
        }
      }

      if (changes.length === 0) {
        return { content: `No occurrences of "${oldName}" found in ${files.length} files.` };
      }

      // Apply if not dry run
      if (!dryRun) {
        for (const filePath of filesChanged) {
          const content = await fs.readFile(filePath, 'utf-8');
          const updated = content.replace(regex, newName);
          await fs.writeFile(filePath, updated, 'utf-8');
        }
      }

      // Format output
      const prefix = dryRun ? '[DRY RUN] ' : '';
      const verb = dryRun ? 'Would rename' : 'Renamed';
      const header = `${prefix}${verb} "${oldName}" to "${newName}": ${totalReplacements} occurrence(s) in ${filesChanged.size} file(s)\n`;

      const preview = changes.slice(0, 50).map(c =>
        `  ${c.file}:${c.line}\n    - ${c.before}\n    + ${c.after}`
      ).join('\n\n');

      const truncation = changes.length > 50 ? `\n\n... and ${changes.length - 50} more changes` : '';

      return {
        content: header + '\n' + preview + truncation,
        metadata: { filesChanged: filesChanged.size, replacements: totalReplacements, dryRun },
      };
    } catch (error) {
      return { content: `Error during rename: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const dryRun = result.metadata?.dryRun;
    const count = result.metadata?.replacements || 0;
    const files = result.metadata?.filesChanged || 0;
    const prefix = dryRun ? '[DRY RUN] ' : '';
    return `${prefix}Renamed "${input.oldName}" -> "${input.newName}" (${count} in ${files} files)`;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
