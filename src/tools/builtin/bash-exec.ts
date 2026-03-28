import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import treeKill from 'tree-kill';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { logger } from '../../utils/logger.js';

export class BashExecTool implements Tool {
  readonly name = 'Bash';
  readonly description = 'Executes a shell command and returns its output. Working directory persists between commands.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 120000, max: 600000)',
      },
      description: {
        type: 'string',
        description: 'A description of what this command does',
      },
    },
    required: ['command'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.command !== 'string' || !input.command.trim()) {
      return 'command must be a non-empty string';
    }
    const timeout = input.timeout as number | undefined;
    if (timeout !== undefined && (timeout < 0 || timeout > 600_000)) {
      return 'timeout must be between 0 and 600000 milliseconds';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const command = input.command as string;
    const timeout = Math.min((input.timeout as number) || 120_000, 600_000);

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;
      let lastProgressAt = 0;

      const emitProgress = () => {
        const now = Date.now();
        if (now - lastProgressAt > 1000) {
          lastProgressAt = now;
          const combined = (stdout + (stderr ? '\n' + stderr : '')).trimEnd();
          const lines = combined.split('\n').slice(-8).join('\n');
          if (lines) context.onProgress?.(lines);
        }
      };

      const resolvedCwd = path.resolve(context.cwd || os.homedir());
      const safeCwd = fs.existsSync(resolvedCwd) ? resolvedCwd : os.homedir();
      logger.info(`[BashExec] Spawning command: ${command} in cwd: ${safeCwd}`);
      const proc = spawn(command, [], {
        cwd: safeCwd,
        shell: true,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      logger.debug(`[BashExec] Process spawned with PID: ${proc.pid}`);

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
        // Truncate if output gets too large
        if (stdout.length > 1_000_000) {
          stdout = stdout.substring(0, 1_000_000) + '\n\n[Output truncated at 1MB]';
          if (proc.pid) treeKill(proc.pid);
          killed = true;
        }
        emitProgress();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        if (stderr.length > 500_000) {
          stderr = stderr.substring(0, 500_000) + '\n\n[Stderr truncated at 500KB]';
        }
        emitProgress();
      });

      const timer = setTimeout(() => {
        if (proc.pid) treeKill(proc.pid);
        killed = true;
        resolve({
          content: `Command timed out after ${timeout}ms.\n\nPartial stdout:\n${stdout}\n\nPartial stderr:\n${stderr}`,
          isError: true,
        });
      }, timeout);

      // Handle abort signal
      const abortHandler = () => {
        if (proc.pid) treeKill(proc.pid);
        killed = true;
        resolve({
          content: 'Command was cancelled.',
          isError: true,
        });
      };
      context.abortSignal.addEventListener('abort', abortHandler, { once: true });

      proc.on('close', (code) => {
        clearTimeout(timer);
        context.abortSignal.removeEventListener('abort', abortHandler);
        if (killed) return;

        logger.info(`[BashExec] Process exited with code ${code}`);

        let output = '';
        if (stdout) output += stdout;
        if (stderr) {
          if (output) output += '\n';
          output += stderr;
        }
        if (!output) output = '(no output)';

        resolve({
          content: output.trim(),
          isError: code !== 0,
          metadata: { exitCode: code },
        });
      });

      proc.on('error', (error) => {
        clearTimeout(timer);
        context.abortSignal.removeEventListener('abort', abortHandler);
        logger.error(`[BashExec] Process spawn error: ${error.message}`, error);
        resolve({
          content: `Failed to execute command: ${error.message}`,
          isError: true,
        });
      });
    });
  }
}
