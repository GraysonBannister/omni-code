import Database from 'better-sqlite3';
import type { UnifiedMessage } from '../core/message-types.js';

export interface MemoryChunk {
  id: string;
  sessionId?: string;
  type: 'message' | 'context' | 'chunk' | 'code_chunk' | 'rag_chunk';
  key?: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class PersistentMemoryStore {
  private db: Database.Database;
  private path: string;

  constructor(dbPath = './omni-memory.db') {
    this.path = dbPath;
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        role TEXT,
        content TEXT,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        key TEXT UNIQUE,
        value TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_context_session ON context(session_id);
    `);
  }

  saveMessage(sessionId: string, msg: UnifiedMessage): void {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (id, session_id, role, content, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(msg.id || Date.now().toString(), sessionId, msg.role, content, JSON.stringify(msg.metadata || {}));
  }

  getMessages(sessionId: string, limit = 100): UnifiedMessage[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?');
    const rows = stmt.all(sessionId, limit) as any[];
    return rows.map(row => {
      let parsedContent: string | any[];
      try {
        const parsed = JSON.parse(row.content);
        parsedContent = Array.isArray(parsed) ? parsed : row.content;
      } catch {
        parsedContent = row.content;
      }
      return {
        id: row.id,
        role: row.role,
        content: parsedContent,
        timestamp: new Date(row.timestamp).getTime(),
        metadata: JSON.parse(row.metadata || '{}'),
      };
    });
  }

  saveContext(sessionId: string, key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO context (session_id, key, value)
      VALUES (?, ?, ?)
    `);
    stmt.run(sessionId, key, value);
  }

  getContext(sessionId: string, key?: string): any {
    if (key) {
      const stmt = this.db.prepare('SELECT value FROM context WHERE session_id = ? AND key = ?');
      const row = stmt.get(sessionId, key) as any;
      return row?.value;
    }
    const stmt = this.db.prepare('SELECT key, value FROM context WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];
    return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  }

  deleteContext(sessionId: string, key: string): boolean {
    const stmt = this.db.prepare('DELETE FROM context WHERE session_id = ? AND key = ?');
    const result = stmt.run(sessionId, key);
    return result.changes > 0;
  }

  clearSession(sessionId: string): void {
    this.db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
    this.db.prepare('DELETE FROM context WHERE session_id = ?').run(sessionId);
  }

  close(): void {
    this.db.close();
  }
}
