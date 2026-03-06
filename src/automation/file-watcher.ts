import * as fs from 'node:fs';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
}

export interface WatchOptions {
  patterns: string[];
  ignored?: string[];
  debounceMs?: number;
}

export class FileWatcher extends EventEmitter {
  private watchers = new Map<string, fs.FSWatcher>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private debounceMs: number;
  private ignored: Set<string>;
  private running = false;

  constructor(options: WatchOptions) {
    super();
    this.debounceMs = options.debounceMs || 300;
    this.ignored = new Set(options.ignored || ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__']);
  }

  start(rootDir: string, patterns: string[]): void {
    if (this.running) return;
    this.running = true;

    // Use fs.watch recursively
    try {
      const watcher = fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(rootDir, filename);

        // Check ignored
        const parts = filename.split(path.sep);
        if (parts.some(p => this.ignored.has(p))) return;

        // Check patterns (simple glob matching)
        if (patterns.length > 0 && !this.matchesAny(filename, patterns)) return;

        // Debounce
        const existing = this.debounceTimers.get(fullPath);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(fullPath, setTimeout(() => {
          this.debounceTimers.delete(fullPath);
          const event: FileChangeEvent = {
            type: eventType === 'rename' ? 'change' : 'change',
            path: fullPath,
            timestamp: Date.now(),
          };

          // Try to determine more specific type
          try {
            fs.statSync(fullPath);
            event.type = 'change';
          } catch {
            event.type = 'unlink';
          }

          this.emit('change', event);
        }, this.debounceMs));
      });

      this.watchers.set(rootDir, watcher);
    } catch (error) {
      this.emit('error', error);
    }
  }

  stop(): void {
    this.running = false;
    for (const [, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    for (const [, timer] of this.debounceTimers) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  private matchesAny(filename: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      if (this.simpleMatch(filename, pattern)) return true;
    }
    return false;
  }

  private simpleMatch(filename: string, pattern: string): boolean {
    // Simple glob: *.ts, *.tsx, src/**/*.ts
    if (pattern.startsWith('*.')) {
      return filename.endsWith(pattern.substring(1));
    }
    if (pattern.includes('**')) {
      const ext = pattern.split('**')[1]?.replace('/', '');
      if (ext) return filename.endsWith(ext);
    }
    return filename.includes(pattern);
  }
}
