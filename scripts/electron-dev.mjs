import { spawn } from 'node:child_process';
import { watchFile, unwatchFile } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const electronEntry = path.join(projectRoot, 'dist-electron', 'electron.cjs');
const electronBinary = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron.cmd' : 'electron',
);
const viteUrl = 'http://localhost:5173';

let electronProcess = null;
let shuttingDown = false;
let launchingElectron = false;

function spawnProcess(command, args, label, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown && label === 'electron' && signal !== 'SIGTERM') {
      console.log(`[electron-dev] Electron exited (${signal ?? code ?? 0}). Waiting for next rebuild.`);
    }
  });

  return child;
}

async function waitForFile(filePath) {
  while (!shuttingDown) {
    try {
      await access(filePath);
      return;
    } catch {
      await delay(250);
    }
  }
}

async function waitForRenderer(url) {
  while (!shuttingDown) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Renderer not ready yet.
    }
    await delay(500);
  }
}

async function stopElectron() {
  if (!electronProcess) return;

  const child = electronProcess;
  electronProcess = null;

  if (child.exitCode === null && !child.killed) {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      child.once('exit', resolve);
      setTimeout(resolve, 2000);
    });
  }
}

async function restartElectron() {
  if (launchingElectron || shuttingDown) return;
  launchingElectron = true;

  try {
    await waitForFile(electronEntry);
    await waitForRenderer(viteUrl);
    await stopElectron();
    electronProcess = spawnProcess(electronBinary, ['.'], 'electron', {
      NODE_ENV: 'development',
      ELECTRON_RUN_AS_NODE: '',
    });
  } finally {
    launchingElectron = false;
  }
}

const viteProcess = spawnProcess('npm', ['run', 'dev:vite'], 'vite', {
  NODE_ENV: 'development',
});
const buildWatchProcess = spawnProcess('npm', ['run', 'build', '--', '--watch'], 'tsup', {
  NODE_ENV: 'development',
});

watchFile(
  electronEntry,
  { interval: 300 },
  async (current, previous) => {
    if (current.mtimeMs === 0 || current.mtimeMs === previous.mtimeMs) {
      return;
    }
    await restartElectron();
  },
);

const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  unwatchFile(electronEntry);
  await stopElectron();
  viteProcess.kill('SIGTERM');
  buildWatchProcess.kill('SIGTERM');
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

await restartElectron();
