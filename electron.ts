// Electron Application Entry Point
// This file initializes the Electron app with the omni-code core

// Prevent the Electron crash dialog for errors we can recover from
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});

import { app } from 'electron';
import { createWindow, setupAppEventHandlers } from './main/app-window.js';
import { initializeCore } from './main/core-integration.js';
import { setupIpcHandlers, cleanupIpcHandlers, setupRulesAndSkillsIpcHandlers } from './main/ipc-handlers.js';
import { setupSettingsIpcHandlers, cleanupSettingsIpcHandlers } from './main/settings.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
  // Windows specific setup
}

// Initialize app
async function initializeApp(): Promise<void> {
  try {
    // Setup IPC handlers FIRST (before window loads)
    setupIpcHandlers();
    setupSettingsIpcHandlers();
    setupRulesAndSkillsIpcHandlers();

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
