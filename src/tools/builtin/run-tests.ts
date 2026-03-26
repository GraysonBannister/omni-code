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
      const detectionResult = await this.detectTestCommand(context.cwd);
      if (!detectionResult.found) {
        return {
          content: `No test command detected for this project.\n\n${detectionResult.message}`,
          isError: true,
        };
      }
      command = detectionResult.command;
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

  private async detectTestCommand(cwd: string): Promise<{ found: true; command: string; packageJsonContent?: any } | { found: false; command: null; message: string; packageJsonContent?: any }> {
    const projectHints: string[] = [];
    let packageJsonContent: any = null;

    // Check for package.json (Node.js)
    try {
      const pkgContent = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8');
      packageJsonContent = JSON.parse(pkgContent);
      const testScript = packageJsonContent.scripts?.test;
      if (testScript && testScript !== 'echo "Error: no test specified" && exit 1') {
        return { found: true, command: 'npm test', packageJsonContent };
      }
      // package.json exists but no valid test script
      projectHints.push('Found package.json but no "test" script defined');
    } catch {
      /* no package.json */
    }

    // Check for pytest
    const pytestConfigs = ['pytest.ini', 'pyproject.toml', 'setup.cfg', 'conftest.py'];
    for (const config of pytestConfigs) {
      try {
        await fs.access(path.join(cwd, config));
        return { found: true, command: 'pytest' };
      } catch { /* not found */ }
    }

    // Check for Python test files
    try {
      const files = await fs.readdir(cwd);
      if (files.some(f => f.startsWith('test_') && f.endsWith('.py')) || files.some(f => f.endsWith('_test.py'))) {
        return { found: true, command: 'pytest' };
      }
    } catch { /* cannot read dir */ }

    // Check for jest config
    const jestConfigs = ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.json'];
    for (const config of jestConfigs) {
      try {
        await fs.access(path.join(cwd, config));
        return { found: true, command: 'npx jest' };
      } catch { /* not found */ }
    }

    // Check for vitest config
    const vitestConfigs = ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs'];
    for (const config of vitestConfigs) {
      try {
        await fs.access(path.join(cwd, config));
        return { found: true, command: 'npx vitest run' };
      } catch { /* not found */ }
    }

    // Check for Makefile test target
    try {
      const makefile = await fs.readFile(path.join(cwd, 'Makefile'), 'utf-8');
      if (makefile.includes('test:')) {
        return { found: true, command: 'make test' };
      }
    } catch { /* no Makefile */ }

    // Check for Go test files
    try {
      const files = await fs.readdir(cwd);
      if (files.some(f => f.endsWith('_test.go'))) {
        return { found: true, command: 'go test ./...' };
      }
    } catch { /* cannot read dir */ }

    // Check for Rust Cargo
    try {
      await fs.access(path.join(cwd, 'Cargo.toml'));
      return { found: true, command: 'cargo test' };
    } catch { /* no Cargo.toml */ }

    // No test framework detected
    let message = 'Could not detect a test framework for this project.\n\n';

    if (projectHints.length > 0) {
      message += projectHints.join('\n') + '\n\n';
    }

    message += 'To set up tests, you can:\n\n';
    message += 'For Node.js projects:\n';
    message += '  - Add a "test" script to package.json:\n';
    message += '    "scripts": { "test": "jest" }\n';
    message += '  - Or install a test runner: npm install --save-dev jest vitest\n\n';
    message += 'For Python projects:\n';
    message += '  - Install pytest: pip install pytest\n';
    message += '  - Create test files: test_*.py or *_test.py\n\n';
    message += 'For other projects:\n';
    message += '  - Go: Create *_test.go files\n';
    message += '  - Rust: Cargo test is automatic with Cargo.toml\n\n';
    message += 'Or provide a custom test command:\n';
    message += '  RunTests with testCommand: "your-custom-command"';

    return { found: false, command: null, message };
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return 'Tests failed';
    return 'Tests passed';
  }
}
