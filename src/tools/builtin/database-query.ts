import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import Database from 'better-sqlite3';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE)\b/i;

export class DatabaseQueryTool implements Tool {
  readonly name = 'DatabaseQuery';
  readonly description = 'Run SQL queries against a local SQLite database. Read-only by default.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute',
      },
      database: {
        type: 'string',
        description: 'Path to SQLite database file (auto-detects if omitted)',
      },
      readonly: {
        type: 'boolean',
        description: 'Enforce read-only mode (default: true)',
      },
    },
    required: ['query'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.query !== 'string' || !input.query.trim()) {
      return 'query must be a non-empty string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const query = (input.query as string).trim();
    const dbPath = input.database as string | undefined;
    const readonly = input.readonly !== false; // default true

    // Plan mode guard
    if (context.planMode && !readonly) {
      return { content: 'Cannot run write queries in plan mode.', isError: true };
    }

    // Check for write operations in readonly mode
    if (readonly && WRITE_KEYWORDS.test(query)) {
      return {
        content: 'Write operation detected but readonly mode is enabled. Set readonly: false to allow writes.',
        isError: true,
      };
    }

    // Resolve database path
    let resolvedDbPath: string;
    if (dbPath) {
      resolvedDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(context.cwd, dbPath);
    } else {
      try {
        resolvedDbPath = await this.detectDatabase(context.cwd);
      } catch (error) {
        return { content: (error as Error).message, isError: true };
      }
    }

    let db: Database.Database | undefined;
    try {
      db = new Database(resolvedDbPath, { readonly });

      const isSelect = /^\s*SELECT\b/i.test(query) ||
                       /^\s*PRAGMA\b/i.test(query) ||
                       /^\s*EXPLAIN\b/i.test(query);

      if (isSelect) {
        const rows = db.prepare(query).all() as Record<string, unknown>[];

        if (rows.length === 0) {
          return { content: `Query returned 0 rows.\n\nDatabase: ${resolvedDbPath}` };
        }

        const limited = rows.slice(0, 1000);
        const table = this.formatAsTable(limited);
        const truncation = rows.length > 1000 ? `\n\n... showing first 1000 of ${rows.length} rows` : '';

        return {
          content: `Database: ${resolvedDbPath}\nRows: ${rows.length}\n\n${table}${truncation}`,
          metadata: { rowCount: rows.length, database: resolvedDbPath },
        };
      } else {
        const result = db.prepare(query).run();
        return {
          content: `Database: ${resolvedDbPath}\nChanges: ${result.changes} row(s) affected`,
          metadata: { changes: result.changes, database: resolvedDbPath },
        };
      }
    } catch (error) {
      return { content: `SQL error: ${(error as Error).message}`, isError: true };
    } finally {
      db?.close();
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const rows = result.metadata?.rowCount;
    const changes = result.metadata?.changes;
    if (rows !== undefined) return `Query: ${rows} rows returned`;
    if (changes !== undefined) return `Query: ${changes} rows affected`;
    return 'Query executed';
  }

  private async detectDatabase(cwd: string): Promise<string> {
    const entries = await fs.readdir(cwd);
    const dbFiles = entries.filter(f =>
      f.endsWith('.db') || f.endsWith('.sqlite') || f.endsWith('.sqlite3')
    );

    if (dbFiles.length === 0) {
      throw new Error('No SQLite database found in current directory. Specify a database path.');
    }
    if (dbFiles.length === 1) {
      return path.join(cwd, dbFiles[0]);
    }

    // Multiple databases found, list them
    throw new Error(
      `Multiple databases found. Specify one:\n${dbFiles.map(f => `  - ${f}`).join('\n')}`
    );
  }

  private formatAsTable(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '(empty)';

    const columns = Object.keys(rows[0]);
    const maxWidth = 100;

    // Calculate column widths
    const widths = columns.map(col => {
      const headerLen = col.length;
      const maxDataLen = Math.max(...rows.map(r => {
        const val = String(r[col] ?? 'NULL');
        return Math.min(val.length, maxWidth);
      }));
      return Math.max(headerLen, maxDataLen);
    });

    // Build table
    const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
    const separator = widths.map(w => '-'.repeat(w)).join('-+-');
    const dataRows = rows.map(row =>
      columns.map((col, i) => {
        let val = String(row[col] ?? 'NULL');
        if (val.length > maxWidth) val = val.substring(0, maxWidth - 3) + '...';
        return val.padEnd(widths[i]);
      }).join(' | ')
    );

    return [header, separator, ...dataRows].join('\n');
  }
}
