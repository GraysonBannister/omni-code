import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

// Ensure node-pty's spawn-helper has execute permissions (prebuilt binaries
// are often distributed without the execute bit on macOS/Linux)
function ensureSpawnHelperExecutable(): void {
  try {
    const ptyDir = path.dirname(require.resolve('node-pty/package.json'));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path.join(ptyDir, 'prebuilds', platform, 'spawn-helper');
    if (fs.existsSync(helperPath)) {
      fs.chmodSync(helperPath, 0o755);
    }
  } catch {
    // Non-fatal: spawn will fail with a clear error if the binary stays non-executable
  }
}

ensureSpawnHelperExecutable();

interface TerminalSession {
  id: string;
  pty: pty.IPty;
}

const sessions = new Map<string, TerminalSession>();

function getShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/zsh';
}

export function createTerminal(
  id: string,
  cwd: string,
  cols: number,
  rows: number,
  window: BrowserWindow
): void {
  if (sessions.has(id)) {
    destroyTerminal(id);
  }

  const shell = getShell();
  const resolvedCwd = path.resolve(cwd || os.homedir());
  const safeCwd = fs.existsSync(resolvedCwd) ? resolvedCwd : os.homedir();

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: safeCwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    } as Record<string, string>,
  });

  ptyProcess.onData((data: string) => {
    if (!window.isDestroyed()) {
      window.webContents.send('terminal:data', { id, data });
    }
  });

  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send('terminal:exit', { id });
    }
  });

  sessions.set(id, { id, pty: ptyProcess });
}

export function writeToTerminal(id: string, data: string): void {
  const session = sessions.get(id);
  if (session) {
    session.pty.write(data);
  }
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  const session = sessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
}

export function destroyTerminal(id: string): void {
  const session = sessions.get(id);
  if (session) {
    try {
      session.pty.kill();
    } catch {
      // Process may already be dead
    }
    sessions.delete(id);
  }
}

export function destroyAllTerminals(): void {
  for (const id of sessions.keys()) {
    destroyTerminal(id);
  }
}
