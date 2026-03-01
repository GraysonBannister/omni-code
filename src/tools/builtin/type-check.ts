import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class TypeCheckTool implements Tool {
  readonly name = 'TypeCheck';
  readonly description = 'Run type checker (tsc, mypy, cargo check) and return diagnostics. Auto-detects the project type.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Override type check command (default: auto-detect)',
      },
      file: {
        type: 'string',
        description: 'Specific file to check (optional)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.command !== undefined && typeof input.command !== 'string') {
      return 'command must be a string';
    }
    if (input.file !== undefined && typeof input.file !== 'string') {
      return 'file must be a string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    let command = input.command as string | undefined;
    const file = input.file as string | undefined;

    if (!command) {
      try {
        command = await this.detectCommand(context.cwd, file);
      } catch (error) {
        return { content: (error as Error).message, isError: true };
      }
    }

    try {
      const output = execSync(command, {
        cwd: context.cwd,
        timeout: 60_000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      return {
        content: `Type check passed.\n\nCommand: ${command}\n\n${output || '(no output)'}`,
        metadata: { exitCode: 0 },
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const exitCode = error.status ?? 'unknown';
      return {
        content: `Type check failed (exit code ${exitCode}).\n\nCommand: ${command}\n\n\`\`\`\n${output}\n\`\`\``,
        isError: true,
        metadata: { exitCode },
      };
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return 'Type check: errors found';
    return 'Type check: passed';
  }

  private async detectCommand(cwd: string, file?: string): Promise<string> {
    // TypeScript
    try {
      await fs.access(path.join(cwd, 'tsconfig.json'));
      return file ? `npx tsc --noEmit ${file}` : 'npx tsc --noEmit';
    } catch { /* not found */ }

    // Python (mypy)
    for (const cfg of ['mypy.ini', 'pyproject.toml', 'setup.py', 'setup.cfg']) {
      try {
        await fs.access(path.join(cwd, cfg));
        return file ? `mypy ${file}` : 'mypy .';
      } catch { /* not found */ }
    }

    // Rust
    try {
      await fs.access(path.join(cwd, 'Cargo.toml'));
      return 'cargo check';
    } catch { /* not found */ }

    throw new Error('No type checker detected. Provide a command manually or ensure tsconfig.json, pyproject.toml, or Cargo.toml exists.');
  }
}
