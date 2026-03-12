// Notification Service for omni-code Electron app
// Handles notification sounds for user prompts and response completion
// Only plays sounds when window is not focused

import { BrowserWindow, shell } from 'electron';
import { settingsManager } from './settings.js';

// Track focus state per window
const windowFocusState = new Map<number, boolean>();

/**
 * Initialize focus tracking for a BrowserWindow
 * Call this when creating a new window
 */
export function initializeWindowFocusTracking(window: BrowserWindow): void {
  const windowId = window.id;

  // Set initial focus state
  windowFocusState.set(windowId, window.isFocused());

  // Listen for focus events
  window.on('focus', () => {
    windowFocusState.set(windowId, true);
  });

  window.on('blur', () => {
    windowFocusState.set(windowId, false);
  });

  // Clean up when window is closed
  window.on('closed', () => {
    windowFocusState.delete(windowId);
  });
}

/**
 * Check if a window is currently focused
 */
export function isWindowFocused(windowId: number): boolean {
  return windowFocusState.get(windowId) ?? false;
}

/**
 * Play a notification sound
 * Uses shell.beep() for cross-platform compatibility
 */
function playSound(): void {
  try {
    shell.beep();
  } catch (error) {
    console.error('[Notifications] Failed to play sound:', error);
  }
}

/**
 * Request a notification sound for a specific window
 * Only plays if:
 * 1. Notifications are enabled in settings
 * 2. Sound is enabled in settings
 * 3. The specific notification type is enabled
 * 4. The window is NOT currently focused
 */
export function requestNotificationSound(
  window: BrowserWindow,
  type: 'user_input' | 'response_complete'
): void {
  try {
    // Check if notifications are enabled
    if (!settingsManager.get('notifications.enabled')) {
      return;
    }

    // Check if sound is enabled
    if (!settingsManager.get('notifications.soundEnabled')) {
      return;
    }

    // Check if this specific notification type is enabled
    if (type === 'user_input' && !settingsManager.get('notifications.playOnUserInput')) {
      return;
    }
    if (type === 'response_complete' && !settingsManager.get('notifications.playOnResponseComplete')) {
      return;
    }

    // Only play sound if window is not focused
    if (!window.isFocused()) {
      playSound();
    }
  } catch (error) {
    console.error('[Notifications] Error requesting notification sound:', error);
  }
}

/**
 * Cleanup focus tracking for a window (called when window is destroyed)
 */
export function cleanupWindowFocusTracking(windowId: number): void {
  windowFocusState.delete(windowId);
}
