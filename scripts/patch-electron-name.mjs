import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plist = path.resolve(
  __dirname,
  '..',
  'node_modules/electron/dist/Electron.app/Contents/Info.plist',
);

if (process.platform !== 'darwin' || !existsSync(plist)) {
  process.exit(0);
}

const plistBuddy = '/usr/libexec/PlistBuddy';

try {
  execFileSync(plistBuddy, ['-c', "Set :CFBundleDisplayName 'Omni Code'", plist]);
  execFileSync(plistBuddy, ['-c', "Set :CFBundleName 'Omni Code'", plist]);
  console.log('[patch-electron-name] Patched Electron.app Info.plist → "Omni Code"');
} catch (err) {
  console.warn('[patch-electron-name] Failed to patch Info.plist:', err.message);
}
