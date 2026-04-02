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

// Cap the replay buffer at 64 KB to avoid sending stale megabytes to new SSE clients
const OUTPUT_BUFFER_LIMIT = 64 * 1024;

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  outputCallbacks: Set<(data: string) => void>;
  outputBuffer: string;
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
    const session = sessions.get(id);
    if (session) {
      // Append to replay buffer, trimming oldest data if over the cap
      session.outputBuffer += data;
      if (session.outputBuffer.length > OUTPUT_BUFFER_LIMIT) {
        session.outputBuffer = session.outputBuffer.slice(session.outputBuffer.length - OUTPUT_BUFFER_LIMIT);
      }
      for (const cb of session.outputCallbacks) {
        cb(data);
      }
    }
  });

  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send('terminal:exit', { id });
    }
  });

  sessions.set(id, { id, pty: ptyProcess, outputCallbacks: new Set(), outputBuffer: '' });
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

export function registerTerminalCallback(id: string, cb: (data: string) => void): void {
  sessions.get(id)?.outputCallbacks.add(cb);
}

export function unregisterTerminalCallback(id: string, cb: (data: string) => void): void {
  sessions.get(id)?.outputCallbacks.delete(cb);
}

/** Returns all PTY output produced so far for a terminal (for replaying to late SSE clients). */
export function getTerminalBuffer(id: string): string {
  return sessions.get(id)?.outputBuffer ?? '';
}
