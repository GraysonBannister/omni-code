import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { CONFIG_DIR_NAME, MEMORY_DB_NAME } from '../constants.js';

export interface MemoryEntry {
  id: string;
  content: string;
  category: 'fact' | 'preference' | 'instruction' | 'context';
  project: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  source: 'user' | 'auto';
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultDir = path.join(os.homedir(), CONFIG_DIR_NAME);
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    this.db = new Database(dbPath || path.join(defaultDir, MEMORY_DB_NAME));
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        project TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        source TEXT NOT NULL DEFAULT 'user'
      );
      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
    `);
  }

  add(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): MemoryEntry {
    const id = crypto.randomUUID();
    const now = Date.now();
    const memory: MemoryEntry = { ...entry, id, createdAt: now, updatedAt: now };

    this.db.prepare(`
      INSERT INTO memories (id, content, category, project, tags, created_at, updated_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, memory.content, memory.category, memory.project,
           JSON.stringify(memory.tags), now, now, memory.source);

    return memory;
  }

  search(query: string, project?: string, limit = 10): MemoryEntry[] {
    const likeQuery = `%${query}%`;
    let sql = 'SELECT * FROM memories WHERE content LIKE ?';
    const params: unknown[] = [likeQuery];

    if (project) {
      sql += ' AND (project = ? OR project IS NULL)';
      params.push(project);
    }
    sql += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    return (this.db.prepare(sql).all(...params) as any[]).map(this.deserialize);
  }

  getForProject(project: string): MemoryEntry[] {
    return (this.db.prepare(
      'SELECT * FROM memories WHERE project = ? OR project IS NULL ORDER BY updated_at DESC'
    ).all(project) as any[]).map(this.deserialize);
  }

  getAll(limit = 100): MemoryEntry[] {
    return (this.db.prepare(
      'SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?'
    ).all(limit) as any[]).map(this.deserialize);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
  }

  close(): void {
    this.db.close();
  }

  private deserialize(row: any): MemoryEntry {
    return {
      id: row.id,
      content: row.content,
      category: row.category,
      project: row.project,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: row.source,
    };
  }
}
