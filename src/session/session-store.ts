import Database from 'better-sqlite3';
import type { PersistentMemoryStore } from '../memory/persistent-store';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { CONFIG_DIR_NAME, SESSION_DB_NAME } from '../constants.js';

export interface StoredSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  provider: string;
  cwd: string;
  summary: string;
  messages: string; // JSON
  metadata: string; // JSON
}

export class SessionStore {
  public persistentMemory?: PersistentMemoryStore;  // Optional integration
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultDir = path.join(os.homedir(), CONFIG_DIR_NAME);
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    this.db = new Database(dbPath || path.join(defaultDir, SESSION_DB_NAME));
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        cwd TEXT NOT NULL,
        summary TEXT DEFAULT '',
        messages TEXT NOT NULL DEFAULT '[]',
        metadata TEXT NOT NULL DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_cwd ON sessions(cwd);
    `);
  }

  save(session: StoredSession): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO sessions (id, created_at, updated_at, model, provider, cwd, summary, messages, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, session.createdAt, session.updatedAt,
      session.model, session.provider, session.cwd,
      session.summary, session.messages, session.metadata,
    );
  }

  load(id: string): StoredSession | null {
    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as StoredSession | null;
  }

  listRecent(cwd?: string, limit = 20): StoredSession[] {
    if (cwd) {
      return this.db.prepare(
        'SELECT id, created_at as createdAt, updated_at as updatedAt, model, provider, cwd, summary FROM sessions WHERE cwd = ? ORDER BY updated_at DESC LIMIT ?'
      ).all(cwd, limit) as StoredSession[];
    }
    return this.db.prepare(
      'SELECT id, created_at as createdAt, updated_at as updatedAt, model, provider, cwd, summary FROM sessions ORDER BY updated_at DESC LIMIT ?'
    ).all(limit) as StoredSession[];
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }

  close(): void {
    this.db.close();
  }
}
