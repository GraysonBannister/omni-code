import { BrowserWindow, Menu, MenuItemConstructorOptions, shell, ipcMain, nativeImage } from 'electron';
import * as path from 'node:path';
import { settingsManager } from './settings.js';
import { initializeWindowFocusTracking } from './notifications.js';
import { setMainWindowForBrowser } from './ipc-handlers.js';
import { trayNotificationManager } from './tray-notifications.js';

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

  const fw = () => BrowserWindow.getFocusedWindow();

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => { createWindow(); },
        },
        { type: 'separator' },
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => fw()?.webContents.send('menu:new-file'),
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => fw()?.webContents.send('menu:open-folder'),
        },
        { type: 'separator' },
        {
          label: 'Close Folder',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => fw()?.webContents.send('menu:close-folder'),
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
          click: () => fw()?.webContents.send('menu:save'),
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => fw()?.webContents.send('menu:open-settings'),
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
          click: () => fw()?.webContents.send('menu:toggle-sidebar'),
        },
        {
          label: 'Toggle Chat',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => fw()?.webContents.send('menu:toggle-chat'),
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
          click: () => fw()?.webContents.send('menu:send-message'),
        },
        {
          label: 'Abort',
          accelerator: 'Escape',
          click: () => fw()?.webContents.send('menu:abort'),
        },
        { type: 'separator' },
        {
          label: 'Clear Conversation',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => fw()?.webContents.send('menu:clear-chat'),
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

  // Calculate cascaded position so new windows appear offset from the existing window
  const existingWindows = BrowserWindow.getAllWindows();
  let windowPosition: { x: number; y: number } | undefined;
  if (existingWindows.length > 0) {
    const ref = BrowserWindow.getFocusedWindow() ?? existingWindows[existingWindows.length - 1];
    const [rx, ry] = ref.getPosition();
    const cascade = existingWindows.length * 30;
    windowPosition = { x: rx + cascade, y: ry + cascade };
  }

  // Create the browser window
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    ...(windowPosition ?? {}),
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

  // Track the first window as mainWindow for backward-compat (before-quit, etc.)
  if (!mainWindow) {
    mainWindow = win;
    setMainWindowForBrowser(win);

    // Initialize tray notifications for the main window
    trayNotificationManager.initialize(win);
  }

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Load the app
  if (isDev) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // If the primary window closes, promote the next available window
  win.on('closed', () => {
    if (mainWindow === win) {
      const remaining = BrowserWindow.getAllWindows();
      mainWindow = remaining.length > 0 ? remaining[0] : null;

      // Clean up tray notifications when main window closes
      trayNotificationManager.destroy();

      // If there's a remaining window, initialize tray for it
      if (remaining.length > 0) {
        trayNotificationManager.initialize(remaining[0]);
      }
    }
  });

  // Initialize focus tracking for notification sounds
  initializeWindowFocusTracking(win);

  // Keep mainWindowRef (used by agent browser tools) pointing to the focused window
  win.on('focus', () => {
    setMainWindowForBrowser(win);
  });

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Build and set the menu
  const menu = buildMenu();
  Menu.setApplicationMenu(menu);

  return win;
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

  app.on('before-quit', async (e: Electron.Event) => {
    if (isQuitting) return;

    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length === 0) return;

    // Prevent immediate quit
    e.preventDefault();
    isQuitting = true;

    try {
      // Notify every open window to save, wait for all (or 5s timeout)
      await Promise.race([
        Promise.all(allWindows.map(w => new Promise<void>(resolve => {
          const replyChannel = `app:save-complete-${w.id}`;
          ipcMain.handleOnce(replyChannel, () => {
            console.log(`[Main] Window ${w.id} signaled save complete`);
            resolve();
          });
          w.webContents.send('app:before-quit', { replyChannel });
        }))),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Save timeout')), 5000)
        )
      ]);

      console.log('[Main] All windows saved, quitting now');
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
