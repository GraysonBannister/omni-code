// Tray Notification Manager for omni-code Electron app
// Manages system tray icon with notification badges for completed chat responses

import { Tray, Menu, BrowserWindow, nativeImage, ipcMain, app } from 'electron';
import * as path from 'node:path';
import { settingsManager } from './settings.js';

// Resolve icon paths - works in both dev and production builds
function resolveIconPaths(): { png: string; icns: string } {
  const appRoot = app.getAppPath();

  // In production, resources are in the app resources folder
  // In dev, they're in the project root
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return {
      png: path.join(appRoot, 'logo.png'),
      icns: path.join(appRoot, 'logo.icns'),
    };
  }

  // Production paths
  return {
    png: path.join(process.resourcesPath || appRoot, 'logo.png'),
    icns: path.join(process.resourcesPath || appRoot, 'logo.icns'),
  };
}

// Badge colors and sizes
const BADGE_BG_COLOR = '#FF3B30'; // iOS red
const BADGE_TEXT_COLOR = '#FFFFFF';
const BADGE_SIZE = 22;
const BADGE_FONT_SIZE = 14;

// Maximum notifications to show in context menu
const MAX_MENU_ITEMS = 10;

// Notification state per conversation
interface PendingNotification {
  conversationId: string;
  title: string;
  messagePreview: string;
  timestamp: number;
  count: number;
}

// Recent chat info for the menu
interface RecentChat {
  conversationId: string;
  title: string;
  lastActivity: number;
  messageCount: number;
  workspaceId?: string; // To filter by open workspace
  projectPath?: string; // For single-folder mode
}

// Track open workspace/project
interface OpenProjectInfo {
  workspaceId?: string;
  projectPath?: string;
  isWorkspaceMode: boolean;
}

// Tray notification manager singleton
class TrayNotificationManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private notifications: Map<string, PendingNotification> = new Map();
  private recentChats: Map<string, RecentChat> = new Map();
  private activeConversationId: string | null = null;
  private isWindowFocused: boolean = false;
  private isChatVisible: boolean = true;
  private baseIcon: nativeImage.NativeImage | null = null;
  private navigateCallback: ((conversationId: string) => void) | null = null;
  private clearAllCallback: (() => void) | null = null;
  private openProject: OpenProjectInfo | null = null;

  /**
   * Initialize the tray icon
   * Call this when the main window is created
   */
  initialize(mainWindow: BrowserWindow): void {
    // Prevent multiple initializations
    if (this.tray) {
      console.log('[TrayNotifications] Already initialized, destroying previous tray');
      this.tray.destroy();
    }

    this.mainWindow = mainWindow;
    this.loadBaseIcon();
    this.createTray();
    this.setupWindowTracking();
    this.setupIpcHandlers();

    console.log('[TrayNotifications] Tray manager initialized');
  }

  /**
   * Load the base app icon
   */
  private loadBaseIcon(): void {
    try {
      const iconPaths = resolveIconPaths();

      // Use platform-specific icon
      const iconPath = process.platform === 'darwin'
        ? iconPaths.icns
        : iconPaths.png;

      this.baseIcon = nativeImage.createFromPath(iconPath);

      // If the icon couldn't be loaded, try the PNG fallback
      if (this.baseIcon.isEmpty() && process.platform === 'darwin') {
        this.baseIcon = nativeImage.createFromPath(iconPaths.png);
      }

      // Resize to appropriate tray size (16x16 or 32x32 depending on DPI)
      const traySize = process.platform === 'darwin' ? 16 : 24;
      if (!this.baseIcon.isEmpty()) {
        this.baseIcon = this.baseIcon.resize({ width: traySize, height: traySize });

        // Template image for macOS (adapts to dark/light mode)
        if (process.platform === 'darwin') {
          this.baseIcon.setTemplateImage(true);
        }

        console.log('[TrayNotifications] Base icon loaded successfully from:', iconPath);
      } else {
        console.warn('[TrayNotifications] Could not load icon from:', iconPath);
        this.baseIcon = nativeImage.createEmpty();
      }
    } catch (error) {
      console.error('[TrayNotifications] Failed to load base icon:', error);
      // Create a blank icon as fallback
      this.baseIcon = nativeImage.createEmpty();
    }
  }

  /**
   * Create the tray icon with context menu
   */
  private createTray(): void {
    if (!this.baseIcon) {
      console.error('[TrayNotifications] Cannot create tray: base icon not loaded');
      return;
    }

    this.tray = new Tray(this.baseIcon);

    // Set tooltip
    this.tray.setToolTip('Omni Code');

    // Handle click events - on macOS left-click shows menu, on Windows/Linux show context menu
    this.tray.on('click', (_event, bounds) => {
      // Just show the context menu on click, don't open window
      this.updateContextMenu();
      this.tray?.popUpContextMenu(bounds);
    });

    // Handle right-click (show context menu on all platforms)
    this.tray.on('right-click', (_event, bounds) => {
      this.updateContextMenu();
      this.tray?.popUpContextMenu(bounds);
    });

    // Update context menu
    this.updateContextMenu();
  }

  /**
   * Set up tracking for window focus and visibility state
   */
  private setupWindowTracking(): void {
    if (!this.mainWindow) return;

    // Track window focus
    this.mainWindow.on('focus', () => {
      this.isWindowFocused = true;
      // When window gets focus, we keep notifications but user will clear them by viewing chats
    });

    this.mainWindow.on('blur', () => {
      this.isWindowFocused = false;
    });

    // Set initial focus state
    this.isWindowFocused = this.mainWindow.isFocused();
  }

  /**
   * Set up IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    // Handle active conversation update from renderer
    ipcMain.handle('tray:update-active', (_event, conversationId: string | null) => {
      this.activeConversationId = conversationId;
      // Clear notification for this conversation since user is viewing it
      if (conversationId) {
        this.clearNotification(conversationId);
      }
    });

    // Handle clear notification request
    ipcMain.handle('tray:clear-notification', (_event, conversationId: string) => {
      this.clearNotification(conversationId);
    });

    // Handle clear all notifications request
    ipcMain.handle('tray:clear-all-notifications', () => {
      this.clearAllNotifications();
    });

    // Handle recent chats update from renderer
    ipcMain.handle('tray:update-recent-chats', (_event, chats: RecentChat[]) => {
      this.recentChats.clear();
      for (const chat of chats) {
        this.recentChats.set(chat.conversationId, chat);
      }
      // Update menu to reflect recent chats
      this.updateContextMenu();
    });

    // Handle open project/workspace update from renderer
    ipcMain.handle('tray:update-open-project', (_event, project: OpenProjectInfo | null) => {
      this.openProject = project;
      this.updateContextMenu();
    });
  }

  /**
   * Update open project info
   */
  updateOpenProject(project: OpenProjectInfo | null): void {
    this.openProject = project;
    this.updateContextMenu();
  }

  /**
   * Update recent chats list from renderer
   */
  updateRecentChats(chats: RecentChat[]): void {
    this.recentChats.clear();
    for (const chat of chats) {
      this.recentChats.set(chat.conversationId, chat);
    }
    this.updateContextMenu();
  }

  /**
   * Generate icon with notification badge
   * Returns base icon - badge is shown via tooltip and context menu
   */
  private generateBadgeIcon(count: number): nativeImage.NativeImage {
    if (!this.baseIcon) {
      return nativeImage.createEmpty();
    }

    // Badge is shown in tooltip and context menu, not as icon overlay
    // A true icon badge overlay would require Sharp library or Canvas
    return this.baseIcon;
  }

  /**
   * Update the tray icon based on notification count
   */
  private updateIcon(): void {
    if (!this.tray || !this.baseIcon) return;

    const count = this.notifications.size;
    const icon = this.generateBadgeIcon(count);
    this.tray.setImage(icon);

    // Update tooltip
    if (count > 0) {
      const chatText = count === 1 ? 'chat' : 'chats';
      this.tray.setToolTip(`${count} ${chatText} with new responses - Omni Code`);
    } else {
      this.tray.setToolTip('Omni Code');
    }

    // Update dock badge on macOS
    if (process.platform === 'darwin') {
      app.setBadgeCount(count);
    }
  }

  /**
   * Update the context menu with recent chats and pending notifications
   */
  private updateContextMenu(): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [];
    const notificationCount = this.notifications.size;

    // Header with notification count if there are pending notifications
    if (notificationCount > 0) {
      menuItems.push({
        label: `🔔 ${notificationCount} new response${notificationCount > 1 ? 's' : ''} waiting`,
        enabled: false,
      });

      menuItems.push({
        label: 'Clear All Notifications',
        click: () => {
          this.clearAllNotifications();
        },
      });

      menuItems.push({ type: 'separator' });
    }

    // Filter recent chats to only show those from the open project/workspace
    let recentChatsList = Array.from(this.recentChats.values());

    // If we have open project info, filter to only show chats from that project
    if (this.openProject) {
      recentChatsList = recentChatsList.filter(chat => {
        if (this.openProject!.isWorkspaceMode && chat.workspaceId) {
          return chat.workspaceId === this.openProject!.workspaceId;
        } else if (!this.openProject!.isWorkspaceMode && chat.projectPath) {
          return chat.projectPath === this.openProject!.projectPath;
        }
        // Include chats without project info (backward compatibility)
        return true;
      });
    }

    // Sort by activity and limit
    recentChatsList = recentChatsList
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, MAX_MENU_ITEMS);

    if (recentChatsList.length > 0) {
      // Show section title based on whether we have an open project
      if (this.openProject) {
        menuItems.push({
          label: this.openProject.isWorkspaceMode ? 'Open Workspace Chats' : 'Open Project Chats',
          enabled: false,
        });
      } else {
        menuItems.push({
          label: 'Recent Chats',
          enabled: false,
        });
      }

      for (const chat of recentChatsList) {
        const hasNotification = this.notifications.has(chat.conversationId);
        const notification = this.notifications.get(chat.conversationId);
        const timeAgo = this.formatTimeAgo(chat.lastActivity);

        // Build label with notification indicator
        let label: string;
        if (hasNotification && notification) {
          const preview = notification.messagePreview.slice(0, 30) +
            (notification.messagePreview.length > 30 ? '...' : '');
          label = `🔴 ${chat.title} - ${preview} (${timeAgo})`;
        } else {
          label = `   ${chat.title} (${timeAgo})`;
        }

        menuItems.push({
          label,
          click: () => {
            this.navigateToChat(chat.conversationId);
          },
        });
      }

      menuItems.push({ type: 'separator' });
    }

    // Standard menu items
    menuItems.push({
      label: 'Open Omni Code',
      click: () => {
        this.showMainWindow();
      },
    });

    menuItems.push({ type: 'separator' });

    menuItems.push({
      label: 'Quit',
      role: 'quit',
    });

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Format timestamp to relative time string
   */
  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Show/focus the main window and navigate to a specific chat
   */
  private navigateToChat(conversationId: string): void {
    // Show and focus the main window first
    this.showMainWindow();

    // Notify renderer to navigate to this conversation
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('tray:navigate-to-chat', conversationId);
    }

    // Clear the notification for this conversation
    this.clearNotification(conversationId);
  }

  /**
   * Show and focus the main window
   */
  private showMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }

    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * Notify of a completed chat response
   * Call this when a response completes and should show in tray
   */
  notifyResponseComplete(
    conversationId: string,
    conversationTitle: string,
    messagePreview: string,
    isConversationActive: boolean
  ): void {
    // Check if notifications are enabled
    if (!settingsManager.get('notifications.enabled')) {
      return;
    }

    // Check if tray badge is enabled
    if (!settingsManager.get('notifications.showTrayBadge')) {
      return;
    }

    // Don't show notification if this conversation is currently active and window is focused
    if (isConversationActive && this.isWindowFocused && this.isChatVisible) {
      return;
    }

    // Update or add notification for this conversation
    const existing = this.notifications.get(conversationId);
    const notification: PendingNotification = {
      conversationId,
      title: conversationTitle,
      messagePreview,
      timestamp: Date.now(),
      count: existing ? existing.count + 1 : 1,
    };

    this.notifications.set(conversationId, notification);

    // Update tray icon and menu
    this.updateIcon();
    this.updateContextMenu();

    console.log(`[TrayNotifications] Added notification for conversation: ${conversationTitle} (${conversationId})`);
  }

  /**
   * Update chat visibility state from renderer
   */
  updateChatVisibility(isVisible: boolean): void {
    this.isChatVisible = isVisible;
  }

  /**
   * Clear notification for a specific conversation
   */
  clearNotification(conversationId: string): void {
    const hadNotification = this.notifications.has(conversationId);
    this.notifications.delete(conversationId);

    if (hadNotification) {
      this.updateIcon();
      this.updateContextMenu();

      // Notify renderer that notification was cleared
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('tray:notification-cleared', conversationId);
      }
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    const count = this.notifications.size;
    this.notifications.clear();

    if (count > 0) {
      this.updateIcon();
      this.updateContextMenu();

      // Notify renderer that all notifications were cleared
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('tray:all-notifications-cleared');
      }

      console.log('[TrayNotifications] All notifications cleared');
    }
  }

  /**
   * Get current notification count
   */
  getNotificationCount(): number {
    return this.notifications.size;
  }

  /**
   * Check if a conversation has pending notification
   */
  hasNotification(conversationId: string): boolean {
    return this.notifications.has(conversationId);
  }

  /**
   * Clean up tray resources
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }

    this.notifications.clear();
    this.mainWindow = null;

    console.log('[TrayNotifications] Tray manager destroyed');
  }
}

// Export singleton instance
export const trayNotificationManager = new TrayNotificationManager();

// Convenience exports for direct use
export const initializeTrayNotifications = (window: BrowserWindow): void => {
  trayNotificationManager.initialize(window);
};

export const notifyChatResponseComplete = (
  conversationId: string,
  conversationTitle: string,
  messagePreview: string,
  isConversationActive: boolean
): void => {
  trayNotificationManager.notifyResponseComplete(
    conversationId,
    conversationTitle,
    messagePreview,
    isConversationActive
  );
};

export const updateActiveConversation = (conversationId: string | null): void => {
  trayNotificationManager['activeConversationId'] = conversationId;
  if (conversationId) {
    trayNotificationManager.clearNotification(conversationId);
  }
};

export const destroyTrayNotifications = (): void => {
  trayNotificationManager.destroy();
};
