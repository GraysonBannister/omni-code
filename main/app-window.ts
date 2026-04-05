import { BrowserWindow, Menu, MenuItemConstructorOptions, shell, ipcMain, nativeImage } from 'electron';
import * as path from 'node:path';
import { settingsManager } from './settings.js';
import { initializeWindowFocusTracking } from './notifications.js';
import { setMainWindowForBrowser } from './ipc-handlers.js';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development';

// Build the application menu with dynamic Recent Projects submenu
function buildMenu(): Menu {
  const recentWorkspaces = settingsManager.getRecentWorkspaces();

  // Build Recent Projects submenu
  const recentSubmenu: MenuItemConstructorOptions[] = recentWorkspaces.length > 0
    ? recentWorkspaces.map(workspacePath => ({
        label: `${path.basename(workspacePath)} - ${workspacePath}`,
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.send('menu:open-recent', workspacePath);
          }
        },
      }))
    : [{ label: 'No Recent Projects', enabled: false }];

  // Add Clear Recent option if there are recent workspaces
  if (recentWorkspaces.length > 0) {
    recentSubmenu.push({ type: 'separator' });
    recentSubmenu.push({
      label: 'Clear Recent',
      click: () => {
        settingsManager.reset('files.recentWorkspaces');
        // Rebuild menu to reflect changes
        const newMenu = buildMenu();
        Menu.setApplicationMenu(newMenu);
      },
    });
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-file'),
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-folder'),
        },
        { type: 'separator' },
        {
          label: 'Close Folder',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => mainWindow?.webContents.send('menu:close-folder'),
        },
        { type: 'separator' },
        {
          label: 'Recent Projects',
          submenu: recentSubmenu,
          id: 'recent-projects',
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('menu:open-settings'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:toggle-sidebar'),
        },
        {
          label: 'Toggle Chat',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => mainWindow?.webContents.send('menu:toggle-chat'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Agent',
      submenu: [
        {
          label: 'Send Message',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow?.webContents.send('menu:send-message'),
        },
        {
          label: 'Abort',
          accelerator: 'Escape',
          click: () => mainWindow?.webContents.send('menu:abort'),
        },
        { type: 'separator' },
        {
          label: 'Clear Conversation',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow?.webContents.send('menu:clear-chat'),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

export async function createWindow(): Promise<BrowserWindow> {
  // Resolve preload path - files are in main/ subdirectory
  const preloadPath = path.resolve(__dirname, 'main', 'preload.cjs');
  console.log('__dirname:', __dirname);
  console.log('Preload path:', preloadPath);

  // Resolve icon path - try multiple locations for dev and production
  const { app } = await import('electron');
  const appRoot = app.getAppPath();
  const iconPaths = process.platform === 'darwin'
    ? [
        path.join(appRoot, 'build', 'icon.icns'),
        path.join(appRoot, '..', 'build', 'icon.icns'),
        path.join(__dirname, '..', 'build', 'icon.icns'),
        path.join(appRoot, 'logo.png'),
        path.join(__dirname, '..', 'logo.png'),
      ]
    : [
        path.join(process.resourcesPath, 'logo.png'),
        path.join(appRoot, 'logo.png'),
        path.join(__dirname, '..', 'logo.png'),
        path.join(__dirname, '..', '..', 'logo.png'),
      ];

  let icon: Electron.NativeImage | undefined = undefined;
  for (const iconPath of iconPaths) {
    try {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) {
        icon = img;
        console.log('[Main] Using icon:', iconPath);
        break;
      }
    } catch {
      // Try next path
    }
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    icon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      webviewTag: true,
    },
    show: false,
  });

  // Set main window reference for browser events
  setMainWindowForBrowser(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Load the app
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize focus tracking for notification sounds
  initializeWindowFocusTracking(mainWindow);

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Build and set the menu
  const menu = buildMenu();
  Menu.setApplicationMenu(menu);

  return mainWindow;
}

// Rebuild the menu (call this when recent workspaces change)
export function rebuildMenu(): void {
  const menu = buildMenu();
  Menu.setApplicationMenu(menu);
}

export function setupAppEventHandlers(): void {
  const { app } = require('electron');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', async (e) => {
    if (isQuitting || !mainWindow) return;

    // Prevent immediate quit
    e.preventDefault();
    isQuitting = true;

    try {
      // Wait for renderer to save (with 5 second timeout)
      await Promise.race([
        new Promise<void>((resolve) => {
          // Set up one-time handler for save complete
          ipcMain.handleOnce('app:save-complete', () => {
            console.log('[Main] Renderer signaled save complete');
            resolve();
          });
          // Notify renderer to start saving
          mainWindow?.webContents.send('app:before-quit');
        }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Save timeout')), 5000)
        )
      ]);

      console.log('[Main] Save complete, quitting now');
    } catch (error) {
      console.error('[Main] Save failed or timed out, quitting anyway:', error);
    }

    // Now actually quit
    app.quit();
  });
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
