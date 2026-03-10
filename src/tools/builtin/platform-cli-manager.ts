import { spawn } from 'node:child_process';
import treeKill from 'tree-kill';

export interface CLIExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  isError: boolean;
}

export abstract class PlatformCLIManager {
  protected abstract cliName: string;
  protected abstract cliCommand: string;

  /**
   * Check if the CLI is installed and available
   */
  async isCLIInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', [this.cliCommand], { stdio: 'ignore' });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }

  /**
   * Check if user is authenticated with the platform
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const result = await this.executeCommand('whoami', [], {}, 10000);
      return result.exitCode === 0 && result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Execute a CLI command with arguments
   */
  async executeCommand(
    subcommand: string,
    args: string[] = [],
    options: { cwd?: string; env?: Record<string, string> } = {},
    timeoutMs: number = 120000,
  ): Promise<CLIExecutionResult> {
    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, ...options.env };

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const allArgs = [subcommand, ...args];
      const proc = spawn(this.cliCommand, allArgs, {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (stdout.length > 1_000_000) {
          stdout = stdout.substring(0, 1_000_000) + '\n\n[Output truncated at 1MB]';
          if (proc.pid) treeKill(proc.pid);
          killed = true;
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        if (stderr.length > 500_000) {
          stderr = stderr.substring(0, 500_000) + '\n\n[Stderr truncated at 500KB]';
        }
      });

      const timer = setTimeout(() => {
        if (proc.pid) treeKill(proc.pid);
        killed = true;
        resolve({
          stdout,
          stderr: `Command timed out after ${timeoutMs}ms.\n\n${stderr}`,
          exitCode: null,
          isError: true,
        });
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          isError: code !== 0,
        });
      });

      proc.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: `Failed to execute ${this.cliCommand}: ${error.message}`,
          exitCode: null,
          isError: true,
        });
      });
    });
  }

  /**
   * Build a formatted output from execution result
   */
  formatOutput(result: CLIExecutionResult, command: string): string {
    let output = `Command: ${this.cliName} ${command}\n`;
    output += `Exit code: ${result.exitCode ?? 'N/A'}\n\n`;

    if (result.stdout) {
      output += `Output:\n${result.stdout}\n`;
    }

    if (result.stderr) {
      if (result.stdout) output += '\n';
      output += `Stderr:\n${result.stderr}\n`;
    }

    if (!result.stdout && !result.stderr) {
      output += '(no output)\n';
    }

    return output.trim();
  }

  /**
   * Get installation instructions for the CLI
   */
  abstract getInstallInstructions(): string;
}
