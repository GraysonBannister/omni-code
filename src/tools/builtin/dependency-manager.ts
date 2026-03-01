import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const VALID_ACTIONS = ['add', 'remove', 'update', 'list'] as const;
type Action = typeof VALID_ACTIONS[number];

export class DependencyManagerTool implements Tool {
  readonly name = 'DependencyManager';
  readonly description = 'Add, remove, update, or list project dependencies. Auto-detects package manager (npm, yarn, pnpm, pip, cargo).';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: add, remove, update, or list',
      },
      packages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Package names (required for add/remove/update)',
      },
      dev: {
        type: 'boolean',
        description: 'Install as dev dependency (default: false)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    if (action !== 'list') {
      if (!Array.isArray(input.packages) || input.packages.length === 0) {
        return `packages must be a non-empty array for "${action}" action`;
      }
      for (const pkg of input.packages as unknown[]) {
        if (typeof pkg !== 'string' || !pkg.trim()) {
          return 'each package must be a non-empty string';
        }
      }
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;
    const packages = (input.packages as string[]) || [];
    const dev = (input.dev as boolean) || false;

    let manager: string;
    try {
      manager = await this.detectManager(context.cwd);
    } catch (error) {
      return { content: (error as Error).message, isError: true };
    }

    const command = this.buildCommand(manager, action, packages, dev);

    try {
      const output = execSync(command, {
        cwd: context.cwd,
        timeout: 120_000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      return {
        content: `${manager} ${action}: ${packages.length > 0 ? packages.join(', ') : 'all'}\n\nCommand: ${command}\n\n${output || '(no output)'}`,
        metadata: { manager, action },
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      return {
        content: `Command failed: ${command}\n\n${output}`,
        isError: true,
        metadata: { exitCode: error.status },
      };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return `Dependency ${input.action}: failed`;
    return `Dependency ${input.action}: success`;
  }

  private async detectManager(cwd: string): Promise<string> {
    const exists = async (file: string) => {
      try { await fs.access(path.join(cwd, file)); return true; } catch { return false; }
    };

    if (await exists('pnpm-lock.yaml')) return 'pnpm';
    if (await exists('yarn.lock')) return 'yarn';
    if (await exists('bun.lockb')) return 'bun';
    if (await exists('package.json')) return 'npm';
    if (await exists('requirements.txt') || await exists('pyproject.toml')) return 'pip';
    if (await exists('Cargo.toml')) return 'cargo';

    throw new Error('No package manager detected. Ensure package.json, requirements.txt, pyproject.toml, or Cargo.toml exists.');
  }

  private buildCommand(manager: string, action: Action, packages: string[], dev: boolean): string {
    const pkgList = packages.join(' ');

    switch (manager) {
      case 'npm':
        switch (action) {
          case 'add': return `npm install ${dev ? '--save-dev ' : ''}${pkgList}`;
          case 'remove': return `npm uninstall ${pkgList}`;
          case 'update': return `npm update ${pkgList}`;
          case 'list': return 'npm list --depth=0';
        }
        break;
      case 'pnpm':
        switch (action) {
          case 'add': return `pnpm add ${dev ? '-D ' : ''}${pkgList}`;
          case 'remove': return `pnpm remove ${pkgList}`;
          case 'update': return `pnpm update ${pkgList}`;
          case 'list': return 'pnpm list --depth=0';
        }
        break;
      case 'yarn':
        switch (action) {
          case 'add': return `yarn add ${dev ? '--dev ' : ''}${pkgList}`;
          case 'remove': return `yarn remove ${pkgList}`;
          case 'update': return `yarn upgrade ${pkgList}`;
          case 'list': return 'yarn list --depth=0';
        }
        break;
      case 'bun':
        switch (action) {
          case 'add': return `bun add ${dev ? '-d ' : ''}${pkgList}`;
          case 'remove': return `bun remove ${pkgList}`;
          case 'update': return `bun update ${pkgList}`;
          case 'list': return 'bun pm ls';
        }
        break;
      case 'pip':
        switch (action) {
          case 'add': return `pip install ${pkgList}`;
          case 'remove': return `pip uninstall -y ${pkgList}`;
          case 'update': return `pip install --upgrade ${pkgList}`;
          case 'list': return 'pip list';
        }
        break;
      case 'cargo':
        switch (action) {
          case 'add': return `cargo add ${dev ? '--dev ' : ''}${pkgList}`;
          case 'remove': return `cargo remove ${pkgList}`;
          case 'update': return 'cargo update';
          case 'list': return 'cargo tree --depth 1';
        }
        break;
    }

    return `${manager} ${action} ${pkgList}`;
  }
}
