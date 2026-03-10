import { spawn, type ChildProcess } from 'node:child_process';
import treeKill from 'tree-kill';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface ProcessInfo {
  name: string;
  command: string;
  proc: ChildProcess;
  pid: number;
  startedAt: number;
  outputLines: string[];
  running: boolean;
  exitCode: number | null;
}

// Module-level registry persists across all tool calls within a session
const processRegistry = new Map<string, ProcessInfo>();

const MAX_OUTPUT_LINES = 500;

function appendOutput(info: ProcessInfo, text: string): void {
  const newLines = text.split('\n');
  for (const line of newLines) {
    if (line || info.outputLines.length > 0) {
      info.outputLines.push(line);
    }
  }
  if (info.outputLines.length > MAX_OUTPUT_LINES) {
    info.outputLines.splice(0, info.outputLines.length - MAX_OUTPUT_LINES);
  }
}

export class ProcessManagerTool implements Tool {
  readonly name = 'ProcessManager';
  readonly description =
    'Start and manage long-running background processes such as dev servers, build watchers, and test runners. ' +
    'Use `start` to launch a named process, `wait_url` to block until a dev server is ready, ' +
    '`status` to read its recent output, `stop` to kill it, and `list` to see all running processes.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start', 'stop', 'status', 'wait_url', 'list'],
        description: 'Action to perform',
      },
      name: {
        type: 'string',
        description: 'Process name (required for start/stop/status)',
      },
      command: {
        type: 'string',
        description: 'Shell command to run (required for start)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the process (optional, defaults to agent cwd)',
      },
      url: {
        type: 'string',
        description: 'URL to poll until it returns an HTTP 2xx response (required for wait_url)',
      },
      timeout_ms: {
        type: 'number',
        description: 'Timeout in milliseconds for wait_url (default: 30000)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    const validActions = ['start', 'stop', 'status', 'wait_url', 'list'];
    if (!validActions.includes(action)) {
      return `action must be one of: ${validActions.join(', ')}`;
    }
    if ((action === 'start' || action === 'stop' || action === 'status') && !input.name) {
      return `name is required for action "${action}"`;
    }
    if (action === 'start' && !input.command) {
      return 'command is required for action "start"';
    }
    if (action === 'wait_url' && !input.url) {
      return 'url is required for action "wait_url"';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const action = input.action as string;

    switch (action) {
      case 'start':
        return this.startProcess(input, context);
      case 'stop':
        return this.stopProcess(input);
      case 'status':
        return this.statusProcess(input);
      case 'wait_url':
        return this.waitUrl(input, context);
      case 'list':
        return this.listProcesses();
      default:
        return { content: `Unknown action: ${action}`, isError: true };
    }
  }

  private async startProcess(
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const name = input.name as string;
    const command = input.command as string;
    const cwd = (input.cwd as string | undefined) || context.cwd;

    // Kill existing process with same name
    const existing = processRegistry.get(name);
    if (existing?.running && existing.proc.pid) {
      treeKill(existing.proc.pid);
      existing.running = false;
    }

    const proc = spawn('bash', ['-c', command], {
      cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    if (!proc.pid) {
      return { content: `Failed to start process "${name}": no PID assigned`, isError: true };
    }

    const info: ProcessInfo = {
      name,
      command,
      proc,
      pid: proc.pid,
      startedAt: Date.now(),
      outputLines: [],
      running: true,
      exitCode: null,
    };

    processRegistry.set(name, info);

    proc.stdout?.on('data', (data: Buffer) => appendOutput(info, data.toString()));
    proc.stderr?.on('data', (data: Buffer) => appendOutput(info, data.toString()));

    proc.on('close', (code) => {
      info.running = false;
      info.exitCode = code;
    });

    proc.on('error', (err) => {
      info.running = false;
      appendOutput(info, `[Process error: ${err.message}]`);
    });

    // Wait up to 2 seconds to collect startup output
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    const recentOutput = info.outputLines.slice(-20).join('\n');
    const status = info.running ? 'running' : `exited (code ${info.exitCode})`;

    return {
      content: `Process "${name}" started (PID ${info.pid}), status: ${status}\n\nStartup output:\n${recentOutput || '(no output yet)'}`,
    };
  }

  private stopProcess(input: Record<string, unknown>): ToolResult {
    const name = input.name as string;
    const info = processRegistry.get(name);

    if (!info) {
      return { content: `No process named "${name}" found.`, isError: true };
    }

    if (!info.running) {
      processRegistry.delete(name);
      return { content: `Process "${name}" was already stopped (exit code ${info.exitCode}).` };
    }

    if (info.proc.pid) {
      treeKill(info.proc.pid);
    }
    info.running = false;
    processRegistry.delete(name);

    return { content: `Process "${name}" (PID ${info.pid}) has been stopped.` };
  }

  private statusProcess(input: Record<string, unknown>): ToolResult {
    const name = input.name as string;
    const info = processRegistry.get(name);

    if (!info) {
      return { content: `No process named "${name}" found. Use action "list" to see all processes.`, isError: true };
    }

    const uptimeSec = Math.round((Date.now() - info.startedAt) / 1000);
    const status = info.running
      ? `running (uptime ${uptimeSec}s, PID ${info.pid})`
      : `stopped (exit code ${info.exitCode})`;

    const recentOutput = info.outputLines.slice(-50).join('\n');

    return {
      content: `Process "${name}" — ${status}\nCommand: ${info.command}\n\nRecent output (last ${Math.min(50, info.outputLines.length)} lines):\n${recentOutput || '(no output)'}`,
    };
  }

  private async waitUrl(
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const url = input.url as string;
    const timeoutMs = (input.timeout_ms as number | undefined) ?? 30_000;
    const intervalMs = 500;
    const deadline = Date.now() + timeoutMs;

    context.onProgress?.(`Waiting for ${url} to become available...`);

    while (Date.now() < deadline) {
      if (context.abortSignal.aborted) {
        return { content: 'Cancelled while waiting for URL.', isError: true };
      }

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok || (res.status >= 200 && res.status < 400)) {
          return { content: `${url} is ready (HTTP ${res.status}).` };
        }
      } catch {
        // Not ready yet — keep polling
      }

      const elapsed = Math.round((Date.now() - (deadline - timeoutMs)) / 1000);
      context.onProgress?.(`Waiting for ${url}... (${elapsed}s elapsed)`);
      await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      content: `Timed out after ${timeoutMs}ms waiting for ${url} to respond.`,
      isError: true,
    };
  }

  private listProcesses(): ToolResult {
    if (processRegistry.size === 0) {
      return { content: 'No background processes are currently tracked.' };
    }

    const rows = Array.from(processRegistry.values()).map((info) => {
      const uptimeSec = Math.round((Date.now() - info.startedAt) / 1000);
      const status = info.running ? `running ${uptimeSec}s` : `stopped (exit ${info.exitCode})`;
      return `  • ${info.name} — PID ${info.pid} — ${status}\n    Command: ${info.command}`;
    });

    return { content: `Background processes (${processRegistry.size}):\n\n${rows.join('\n\n')}` };
  }
}
