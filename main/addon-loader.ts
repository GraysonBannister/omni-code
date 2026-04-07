import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import type { ToolRegistry } from '../src/tools/tool-registry.js';
import type { Tool } from '../src/tools/tool-types.js';

interface AddonContext {
  registerTool: (tool: Tool) => void;
}

interface AddonModule {
  activate: (context: AddonContext) => void;
  deactivate?: () => void;
}

interface AddonManifest {
  id: string;
  entrypoint?: string;
  name?: string;
  version?: string;
}

// Track which tool names each addon registered so we can cleanly unregister on reload/uninstall
const addonToolNames = new Map<string, string[]>();

// Track loaded addon modules so deactivate() can be called before reload
const loadedAddonModules = new Map<string, AddonModule>();

export function getAddonsDir(): string {
  return path.join(app.getPath('userData'), 'addons');
}

/**
 * Loads all installed add-ons from {userData}/addons/ into the given ToolRegistry.
 * Safe to call multiple times — existing tools from each addon are unregistered
 * before re-requiring the entrypoint, so reinstalls pick up new code.
 */
export async function loadInstalledAddons(toolRegistry: ToolRegistry): Promise<void> {
  const addonsDir = getAddonsDir();
  try {
    await fs.mkdir(addonsDir, { recursive: true });
    const entries = await fs.readdir(addonsDir, { withFileTypes: true });

    for (const entry of entries.filter(e => e.isDirectory())) {
      await loadAddon(entry.name, path.join(addonsDir, entry.name), toolRegistry);
    }
  } catch (err) {
    console.error('[AddonLoader] Failed to scan addons directory:', err);
  }
}

async function loadAddon(id: string, addonDir: string, toolRegistry: ToolRegistry): Promise<void> {
  // Call deactivate on the previous instance if available
  const previousModule = loadedAddonModules.get(id);
  if (previousModule?.deactivate) {
    try {
      previousModule.deactivate();
    } catch (err) {
      console.warn(`[AddonLoader] deactivate() threw for addon "${id}":`, err);
    }
  }
  loadedAddonModules.delete(id);

  // Unregister tools from the previous load of this addon
  const previousTools = addonToolNames.get(id) ?? [];
  for (const name of previousTools) {
    try {
      toolRegistry.unregister(name);
    } catch {
      // already gone, ignore
    }
  }
  addonToolNames.delete(id);

  try {
    const manifestPath = path.join(addonDir, 'manifest.json');
    const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
    const manifest: AddonManifest = JSON.parse(manifestRaw);
    const entrypointRelative = manifest.entrypoint ?? 'index.js';
    const entrypoint = path.resolve(addonDir, entrypointRelative);

    // Clear require cache so a reinstall always loads fresh code
    try {
      const resolved = require.resolve(entrypoint);
      delete require.cache[resolved];
    } catch {
      // resolve can fail if the file doesn't exist yet; will surface properly below
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const addon: AddonModule = require(entrypoint);
    const registered: string[] = [];

    const context: AddonContext = {
      registerTool(tool: Tool) {
        // If somehow the same tool name was left behind, remove it before re-registering
        if (toolRegistry.get(tool.name)) {
          toolRegistry.unregister(tool.name);
        }
        toolRegistry.register(tool, 'plugin');
        registered.push(tool.name);
      },
    };

    addon.activate(context);
    addonToolNames.set(id, registered);
    loadedAddonModules.set(id, addon);

    const label = manifest.name ? `"${manifest.name}" (${id})` : `"${id}"`;
    console.log(`[AddonLoader] Loaded addon ${label} v${manifest.version ?? '?'} — tools: [${registered.join(', ')}]`);
  } catch (err) {
    console.error(`[AddonLoader] Failed to load addon "${id}":`, err);
  }
}
