import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { CONFIG_DIR_NAME, PROJECT_CONTEXT_FILE } from '../constants.js';

export class ProjectContextLoader {
  async load(cwd: string): Promise<string> {
    const contexts: string[] = [];
    const home = os.homedir();

    // Walk up from cwd looking for OMNICODE.md files
    let dir = cwd;
    while (dir !== path.dirname(dir) && dir !== home) {
      const candidates = [
        path.join(dir, CONFIG_DIR_NAME, PROJECT_CONTEXT_FILE),
        path.join(dir, PROJECT_CONTEXT_FILE),
      ];
      for (const candidate of candidates) {
        if (await this.fileExists(candidate)) {
          const content = await fs.readFile(candidate, 'utf-8');
          contexts.unshift(content);
        }
      }
      dir = path.dirname(dir);
    }

    // Global context
    const globalPath = path.join(home, CONFIG_DIR_NAME, PROJECT_CONTEXT_FILE);
    if (await this.fileExists(globalPath)) {
      const content = await fs.readFile(globalPath, 'utf-8');
      contexts.unshift(content);
    }

    return contexts.join('\n\n---\n\n');
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
