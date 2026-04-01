// System Sounds for different operating systems
// Provides OS-specific default notification sounds

import { platform } from 'os';
import { shell } from 'electron';

export type SoundOption = {
  id: string;
  label: string;
  path?: string;
  isSystemSound: boolean;
};

// macOS system sounds (located in /System/Library/Sounds/)
const MACOS_SOUNDS: SoundOption[] = [
  { id: 'default', label: 'System Beep (Default)', isSystemSound: true },
  { id: 'none', label: 'No Sound', isSystemSound: true },
  { id: 'macos://Basso', label: 'Basso', path: '/System/Library/Sounds/Basso.aiff', isSystemSound: true },
  { id: 'macos://Blow', label: 'Blow', path: '/System/Library/Sounds/Blow.aiff', isSystemSound: true },
  { id: 'macos://Bottle', label: 'Bottle', path: '/System/Library/Sounds/Bottle.aiff', isSystemSound: true },
  { id: 'macos://Frog', label: 'Frog', path: '/System/Library/Sounds/Frog.aiff', isSystemSound: true },
  { id: 'macos://Funk', label: 'Funk', path: '/System/Library/Sounds/Funk.aiff', isSystemSound: true },
  { id: 'macos://Glass', label: 'Glass', path: '/System/Library/Sounds/Glass.aiff', isSystemSound: true },
  { id: 'macos://Hero', label: 'Hero', path: '/System/Library/Sounds/Hero.aiff', isSystemSound: true },
  { id: 'macos://Morse', label: 'Morse', path: '/System/Library/Sounds/Morse.aiff', isSystemSound: true },
  { id: 'macos://Ping', label: 'Ping', path: '/System/Library/Sounds/Ping.aiff', isSystemSound: true },
  { id: 'macos://Pop', label: 'Pop', path: '/System/Library/Sounds/Pop.aiff', isSystemSound: true },
  { id: 'macos://Purr', label: 'Purr', path: '/System/Library/Sounds/Purr.aiff', isSystemSound: true },
  { id: 'macos://Sosumi', label: 'Sosumi', path: '/System/Library/Sounds/Sosumi.aiff', isSystemSound: true },
  { id: 'macos://Submarine', label: 'Submarine', path: '/System/Library/Sounds/Submarine.aiff', isSystemSound: true },
  { id: 'macos://Tink', label: 'Tink', path: '/System/Library/Sounds/Tink.aiff', isSystemSound: true },
];

// Windows system sounds
const WINDOWS_SOUNDS: SoundOption[] = [
  { id: 'default', label: 'System Beep (Default)', isSystemSound: true },
  { id: 'none', label: 'No Sound', isSystemSound: true },
  { id: 'windows://asterisk', label: 'Asterisk', isSystemSound: true },
  { id: 'windows://exclamation', label: 'Exclamation', isSystemSound: true },
  { id: 'windows://hand', label: 'Critical Stop', isSystemSound: true },
  { id: 'windows://question', label: 'Question', isSystemSound: true },
  { id: 'windows://default', label: 'Default Beep', isSystemSound: true },
];

// Linux system sounds (using canberra-gtk-play or paplay)
const LINUX_SOUNDS: SoundOption[] = [
  { id: 'default', label: 'System Beep (Default)', isSystemSound: true },
  { id: 'none', label: 'No Sound', isSystemSound: true },
  { id: 'linux://message', label: 'Message', isSystemSound: true },
  { id: 'linux://dialog-info', label: 'Dialog Info', isSystemSound: true },
  { id: 'linux://dialog-warning', label: 'Dialog Warning', isSystemSound: true },
  { id: 'linux://dialog-error', label: 'Dialog Error', isSystemSound: true },
  { id: 'linux://complete', label: 'Complete', isSystemSound: true },
  { id: 'linux://attention', label: 'Attention', isSystemSound: true },
];

/**
 * Get the current operating system
 */
export function getOperatingSystem(): 'macos' | 'windows' | 'linux' | 'unknown' {
  const p = platform();
  if (p === 'darwin') return 'macos';
  if (p === 'win32') return 'windows';
  if (p === 'linux') return 'linux';
  return 'unknown';
}

/**
 * Get available system sounds for the current OS
 */
export function getSystemSounds(): SoundOption[] {
  const os = getOperatingSystem();
  
  switch (os) {
    case 'macos':
      return MACOS_SOUNDS;
    case 'windows':
      return WINDOWS_SOUNDS;
    case 'linux':
      return LINUX_SOUNDS;
    default:
      // Fallback to basic options
      return [
        { id: 'default', label: 'System Beep (Default)', isSystemSound: true },
        { id: 'none', label: 'No Sound', isSystemSound: true },
      ];
  }
}

/**
 * Check if a sound ID is a system sound
 */
export function isSystemSound(soundId: string): boolean {
  if (soundId === 'default' || soundId === 'none') return true;
  if (soundId.startsWith('macos://') || soundId.startsWith('windows://') || soundId.startsWith('linux://')) return true;
  return false;
}

/**
 * Play a system sound by ID
 * Returns true if played successfully, false if fallback to beep needed
 */
export async function playSystemSound(soundId: string): Promise<boolean> {
  const os = getOperatingSystem();
  
  if (soundId === 'default') {
    shell.beep();
    return true;
  }
  
  if (soundId === 'none') {
    return true;
  }
  
  try {
    if (os === 'macos' && soundId.startsWith('macos://')) {
      const soundName = soundId.replace('macos://', '');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Use afplay to play macOS system sounds
      const soundPath = `/System/Library/Sounds/${soundName}.aiff`;
      await execAsync(`afplay "${soundPath}"`);
      return true;
    }
    
    if (os === 'windows' && soundId.startsWith('windows://')) {
      // On Windows, we can use PowerShell to play system sounds
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const soundName = soundId.replace('windows://', '');
      const psCommand = `[System.Media.SystemSounds]::${soundName}.Play(); Start-Sleep -m 500`;
      await execAsync(`powershell.exe -Command "${psCommand}"`);
      return true;
    }
    
    if (os === 'linux' && soundId.startsWith('linux://')) {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const soundName = soundId.replace('linux://', '');
      
      // Try canberra-gtk-play first (GNOME/PulseAudio)
      try {
        await execAsync(`canberra-gtk-play -i ${soundName}`);
        return true;
      } catch {
        // Fallback to paplay (PulseAudio)
        try {
          // Look for the sound in common locations
          const searchPaths = [
            `/usr/share/sounds/freedesktop/stereo/${soundName}.oga`,
            `/usr/share/sounds/gnome/default/alerts/${soundName}.ogg`,
            `/usr/share/sounds/deepin/stereo/${soundName}.wav`,
            `/usr/share/sounds/ubuntu/stereo/${soundName}.ogg`,
          ];
          
          for (const path of searchPaths) {
            try {
              await execAsync(`paplay "${path}"`);
              return true;
            } catch {
              continue;
            }
          }
        } catch {
          // All Linux sound methods failed
        }
      }
    }
    
    // If we get here, the system sound couldn't be played
    return false;
  } catch (error) {
    console.error('[SystemSounds] Failed to play system sound:', error);
    return false;
  }
}

/**
 * Get the label for a sound ID
 */
export function getSoundLabel(soundId: string): string {
  if (soundId === 'default') return 'System Beep (Default)';
  if (soundId === 'none') return 'No Sound';
  if (!isSystemSound(soundId)) return 'Custom Sound File';
  
  const sounds = getSystemSounds();
  const sound = sounds.find(s => s.id === soundId);
  return sound?.label || soundId;
}

/**
 * Get sound options for the settings dropdown
 * Returns options suitable for SettingSelect component
 */
export function getSoundSelectOptions(): { value: string; label: string }[] {
  const sounds = getSystemSounds();
  const options = sounds.map(sound => ({
    value: sound.id,
    label: sound.label,
  }));
  
  // Add custom sound file option at the end
  options.push({ value: 'custom', label: 'Custom Sound File...' });
  
  return options;
}
