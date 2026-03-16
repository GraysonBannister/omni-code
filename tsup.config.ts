import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node20',
    external: ['better-sqlite3', 'puppeteer', '@xenova/transformers'],
    outDir: 'dist',
  },
  // Electron main process
  {
    entry: [
      'electron.ts',
      'main/preload.ts',
      'main/ipc-handlers.ts',
      'main/app-window.ts',
      'main/core-integration.ts',
      'main/agent-bridge.ts',
      'main/settings.ts',
      'main/shared-workspace-manager.ts',
      'main/remote-server.ts',
      'main/remote-auth.ts',
      'main/remote-event-emitter.ts',
      'main/terminal-manager.ts',
      'main/notifications.ts',
      'main/chat-storage.ts',
      'main/workspace-storage.ts',
      'main/file-history.ts',
      'main/usage-storage.ts',
    ],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    target: 'node20',
    external: ['electron', 'better-sqlite3', 'electron-store'],
    outDir: 'dist-electron',
    platform: 'node',
    // Define __dirname for CJS output
    define: {
      'import.meta.url': '__filename',
    },
  },
]);
