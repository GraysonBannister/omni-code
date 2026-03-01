import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class RunTestsTool implements Tool {
  readonly name = 'RunTests';
  readonly description = 'Run project tests. Auto-detects test framework (npm test, pytest, jest) or accepts a custom command.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      testCommand: {
        type: 'string',
        description: 'Override test command (default: auto-detect from project config)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in seconds (default: 120)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.testCommand !== undefined && typeof input.testCommand !== 'string') {
      return 'testCommand must be a string';
    }
    if (input.timeout !== undefined && (typeof input.timeout !== 'number' || input.timeout < 1)) {
      return 'timeout must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const timeout = ((input.timeout as number) || 120) * 1000;
    let command = input.testCommand as string | undefined;

    if (!command) {
      command = await this.detectTestCommand(context.cwd);
    }

    try {
      const output = execSync(command, {
        cwd: context.cwd,
        timeout,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0', CI: '1' },
      });

      return {
        content: `Test command: ${command}\n\n\`\`\`\n${output}\n\`\`\``,
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const exitCode = error.status ?? 'unknown';
      return {
        content: `Test command: ${command}\nExit code: ${exitCode}\n\n\`\`\`\n${output}\n\`\`\``,
        isError: exitCode !== 0,
      };
    }
  }

  private async detectTestCommand(cwd: string): Promise<string> {
    // Check for package.json (Node.js)
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      if (pkgJson.scripts?.test && pkgJson.scripts.test !== 'echo "Error: no test specified" && exit 1') {
        return 'npm test';
      }
    } catch { /* no package.json */ }

    // Check for pytest
    const pytestConfigs = ['pytest.ini', 'pyproject.toml', 'setup.cfg', 'conftest.py'];
    for (const config of pytestConfigs) {
      try {
        await fs.access(path.join(cwd, config));
        return 'pytest';
      } catch { /* not found */ }
    }

    // Check for jest config
    const jestConfigs = ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'];
    for (const config of jestConfigs) {
      try {
        await fs.access(path.join(cwd, config));
        return 'npx jest';
      } catch { /* not found */ }
    }

    // Check for Makefile test target
    try {
      const makefile = await fs.readFile(path.join(cwd, 'Makefile'), 'utf-8');
      if (makefile.includes('test:')) {
        return 'make test';
      }
    } catch { /* no Makefile */ }

    // Fallback
    return 'npm test';
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return 'Tests failed';
    return 'Tests passed';
  }
}
