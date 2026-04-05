// Electron Application Entry Point
// This file initializes the Electron app with the omni-code core

// Prevent the Electron crash dialog for errors we can recover from
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});

import { app, nativeImage } from 'electron';
import * as path from 'node:path';
import { createWindow, setupAppEventHandlers } from './main/app-window.js';
import { initializeCore } from './main/core-integration.js';
import { setupIpcHandlers, cleanupIpcHandlers, setupRulesAndSkillsIpcHandlers, setupUpdaterIpcHandlers } from './main/ipc-handlers.js';
import { setupSettingsIpcHandlers, cleanupSettingsIpcHandlers } from './main/settings.js';

// Set app name before ready so it appears correctly in dock/taskbar
app.setName('Omni Code');

// Windows-specific setup (NSIS installer handles shortcuts — no Squirrel handler needed)

// Initialize app
async function initializeApp(): Promise<void> {
  try {
    // Set macOS dock icon - must be called after app is ready
    if (process.platform === 'darwin' && app.dock) {
      const appRoot = app.getAppPath();
      const iconPaths = [
        path.join(appRoot, 'build', 'icon.icns'),
        path.join(appRoot, '..', 'build', 'icon.icns'),
        path.join(__dirname, '..', 'build', 'icon.icns'),
        path.join(process.resourcesPath, 'build', 'icon.icns'),
        path.join(appRoot, 'logo.png'),
        path.join(__dirname, '..', 'logo.png'),
      ];
      for (const iconPath of iconPaths) {
        try {
          const img = nativeImage.createFromPath(iconPath);
          if (!img.isEmpty()) {
            app.dock.setIcon(img);
            console.log('[Main] Using dock icon:', iconPath);
            break;
          }
        } catch {
          // Try next path
        }
      }
    }

    // Setup IPC handlers FIRST (before window loads)
    setupIpcHandlers();
    setupSettingsIpcHandlers();
    setupRulesAndSkillsIpcHandlers();
    setupUpdaterIpcHandlers();

    // Wait for settings manager to be ready before creating window
    const { getSettingsManager } = await import('./main/settings.js');
    await getSettingsManager();
    console.log('[Main] Settings manager initialized');

    // Initialize the omni-code core (agent, tools, providers)
    await initializeCore();

    // Create the main window
    await createWindow();

    // Setup app event handlers
    setupAppEventHandlers();

    // Check for updates in production builds (not during development)
    if (app.isPackaged) {
      const { autoUpdater } = await import('electron-updater');
      autoUpdater.logger = null; // IPC handlers in ipc-handlers.ts forward events to renderer
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error('[Updater] Failed to check for updates:', err);
      });
    }

    // Setup cleanup on quit
    app.on('before-quit', () => {
      cleanupIpcHandlers();
      cleanupSettingsIpcHandlers();
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (event) => {
        event.preventDefault();
      });
    });

  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
}

// App ready event
app.whenReady().then(initializeApp);
