import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const execFileAsync = promisify(execFile);

export class GrepSearchTool implements Tool {
  readonly name = 'Grep';
  readonly description = 'Search file contents using regular expressions. Supports regex patterns, file type filtering, and context lines.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The regular expression pattern to search for',
      },
      path: {
        type: 'string',
        description: 'File or directory to search in. Defaults to current working directory.',
      },
      glob: {
        type: 'string',
        description: 'Glob pattern to filter files (e.g., "*.ts", "*.{ts,tsx}")',
      },
      context: {
        type: 'number',
        description: 'Number of context lines to show around each match',
      },
      case_insensitive: {
        type: 'boolean',
        description: 'Case insensitive search',
      },
      files_only: {
        type: 'boolean',
        description: 'Only return file paths, not matching lines',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return',
      },
    },
    required: ['pattern'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.pattern !== 'string' || !input.pattern) {
      return 'pattern must be a non-empty string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = input.pattern as string;
    const searchPath = (input.path as string) || context.cwd;
    const globPattern = input.glob as string | undefined;
    const contextLines = input.context as number | undefined;
    const caseInsensitive = input.case_insensitive as boolean | undefined;
    const filesOnly = input.files_only as boolean | undefined;
    const maxResults = (input.max_results as number) || 200;

    // Try ripgrep first, fall back to grep
    const args: string[] = [];

    // Use grep as fallback (ripgrep may not be installed)
    const cmd = await this.findSearchCmd();

    if (cmd === 'rg') {
      args.push('--no-heading', '--line-number', '--color=never');
      if (caseInsensitive) args.push('-i');
      if (filesOnly) args.push('-l');
      if (contextLines) args.push(`-C${contextLines}`);
      if (globPattern) args.push(`--glob=${globPattern}`);
      args.push('--max-count', String(maxResults));
      args.push('--glob=!node_modules', '--glob=!.git', '--glob=!dist');
      args.push(pattern, searchPath);
    } else {
      args.push('-r', '-n', '--color=never');
      if (caseInsensitive) args.push('-i');
      if (filesOnly) args.push('-l');
      if (contextLines) args.push(`-C${contextLines}`);
      args.push('--exclude-dir=node_modules', '--exclude-dir=.git', '--exclude-dir=dist');
      args.push(pattern, searchPath);
    }

    try {
      const { stdout } = await execFileAsync(cmd, args, {
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const lines = stdout.trim().split('\n');
      const limited = lines.slice(0, maxResults);

      if (limited.length === 0 || (limited.length === 1 && limited[0] === '')) {
        return { content: `No matches found for pattern: ${pattern}` };
      }

      let result = limited.join('\n');
      if (lines.length > maxResults) {
        result += `\n\n... and ${lines.length - maxResults} more matches (showing first ${maxResults})`;
      }

      return { content: result };
    } catch (error: any) {
      // grep/rg return exit code 1 for no matches
      if (error.code === 1) {
        return { content: `No matches found for pattern: ${pattern}` };
      }
      return { content: `Search error: ${error.message}`, isError: true };
    }
  }

  private async findSearchCmd(): Promise<string> {
    try {
      await execFileAsync('which', ['rg']);
      return 'rg';
    } catch {
      return 'grep';
    }
  }
}
