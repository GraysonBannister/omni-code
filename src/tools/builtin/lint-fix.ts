import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class LintFixTool implements Tool {
  readonly name = 'LintFix';
  readonly description = 'Run ESLint/Prettier auto-fix on files. Detects project lint configuration automatically.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'File or directory to lint/fix',
      },
      fix: {
        type: 'boolean',
        description: 'Auto-fix issues (default: true)',
      },
    },
    required: ['file_path'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) {
      return 'file_path must be a non-empty string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const fix = input.fix !== false; // Default true
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(context.cwd, filePath);

    try {
      const commands: string[] = [];

      // Detect linters
      const hasEslint = await this.configExists(context.cwd, [
        'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
        '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc',
      ]);
      const hasPrettier = await this.configExists(context.cwd, [
        '.prettierrc', '.prettierrc.json', '.prettierrc.js',
        '.prettierrc.yml', '.prettierrc.yaml', 'prettier.config.js',
      ]);

      // Also check package.json for eslint/prettier configs
      let pkgHasEslint = false;
      let pkgHasPrettier = false;
      try {
        const pkg = JSON.parse(await fs.readFile(path.join(context.cwd, 'package.json'), 'utf-8'));
        pkgHasEslint = !!pkg.eslintConfig;
        pkgHasPrettier = !!pkg.prettier;
      } catch { /* no package.json */ }

      if (hasEslint || pkgHasEslint) {
        const fixFlag = fix ? ' --fix' : '';
        commands.push(`npx eslint${fixFlag} "${absPath}"`);
      }

      if (hasPrettier || pkgHasPrettier) {
        const fixFlag = fix ? ' --write' : ' --check';
        commands.push(`npx prettier${fixFlag} "${absPath}"`);
      }

      if (commands.length === 0) {
        return {
          content: 'No ESLint or Prettier configuration found in this project. Add a config file first.',
          isError: true,
        };
      }

      const results: string[] = [];
      for (const cmd of commands) {
        try {
          const output = execSync(cmd, {
            cwd: context.cwd,
            timeout: 30_000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '0' },
          });
          results.push(`$ ${cmd}\n${output || '(no issues found)'}`);
        } catch (error: any) {
          const output = (error.stdout || '') + (error.stderr || '');
          results.push(`$ ${cmd}\n${output || error.message}`);
        }
      }

      return { content: results.join('\n\n') };
    } catch (error) {
      return { content: `Error running lint: ${(error as Error).message}`, isError: true };
    }
  }

  private async configExists(cwd: string, filenames: string[]): Promise<boolean> {
    for (const filename of filenames) {
      try {
        await fs.access(path.join(cwd, filename));
        return true;
      } catch { /* not found */ }
    }
    return false;
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return 'Lint/format completed';
  }
}
