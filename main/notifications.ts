// Notification Service for omni-code Electron app
// Handles notification sounds for user prompts and response completion
// Only plays sounds when window is not focused

import { BrowserWindow, shell } from 'electron';
import { settingsManager } from './settings.js';
import {
  playSystemSound,
  isSystemSound,
  getOperatingSystem,
} from './system-sounds.js';

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
 * Uses system sound if configured, custom sound file, or falls back to shell.beep()
 * Only ONE sound will play - either the selected sound or a single fallback beep
 *
 * @param soundSetting The sound setting value (read once by the caller)
 */
async function playSound(soundSetting: string): Promise<void> {
  try {
    // 'none' means no sound should play at all
    if (soundSetting === 'none') {
      return;
    }

    // For system sounds (including 'default' and OS-specific sounds)
    if (isSystemSound(soundSetting) || !soundSetting) {
      const played = await playSystemSound(soundSetting || 'default');
      if (!played) {
        // Only play fallback beep if the system sound completely failed
        shell.beep();
      }
      return; // Early return - only one sound plays
    }

    // Custom sound file path (not a system sound, so it's a file path)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const soundPlay: any = await import('sound-play');
      await soundPlay.play(soundSetting);
      return; // Early return - custom sound played successfully
    } catch (playError) {
      console.error('[Notifications] Failed to play custom sound, falling back to system beep:', playError);
      // Only play beep as fallback if custom sound failed
      shell.beep();
      return;
    }
  } catch (error) {
    console.error('[Notifications] Failed to play sound:', error);
    // Final fallback - only one beep
    try {
      shell.beep();
    } catch {
      // Ignore beep errors
    }
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
export async function requestNotificationSound(
  window: BrowserWindow,
  type: 'user_input' | 'response_complete'
): Promise<void> {
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
      // Read the sound setting ONCE and pass it to playSound
      // This ensures consistency and prevents race conditions
      const soundSetting = settingsManager.get('notifications.sound') as string;
      await playSound(soundSetting);
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
