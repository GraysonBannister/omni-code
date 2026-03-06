import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface DiffHunk {
  origStart: number;
  origCount: number;
  newStart: number;
  newCount: number;
  contextLines: string[];
  removeLines: string[];
  addLines: string[];
  operations: Array<{ type: 'context' | 'remove' | 'add'; line: string }>;
}

export class UnifiedDiffEditTool implements Tool {
  readonly name = 'DiffEdit';
  readonly description = `Apply changes to a file using unified diff format. Accepts standard unified diff with @@ hunks and +/- line markers. More token-efficient than full file replacement for small changes.`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the target file' },
      diff: { type: 'string', description: 'Unified diff to apply (with @@ headers and +/- lines)' },
    },
    required: ['file_path', 'diff'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) return 'file_path must be a non-empty string';
    if (!path.isAbsolute(input.file_path as string)) return 'file_path must be an absolute path';
    if (typeof input.diff !== 'string' || !input.diff.trim()) return 'diff must be a non-empty string';
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const diff = input.diff as string;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const hunks = this.parseHunks(diff);

      if (hunks.length === 0) {
        return { content: 'No valid hunks found in the diff.', isError: true };
      }

      // Apply hunks in reverse order to preserve line numbers
      const sortedHunks = hunks.sort((a, b) => b.origStart - a.origStart);
      const result = [...lines];

      for (const hunk of sortedHunks) {
        const matchOffset = this.findHunkOffset(result, hunk);
        if (matchOffset === -1) {
          return { content: `Could not find matching context for hunk at line ${hunk.origStart}. Context lines don't match the file.`, isError: true };
        }

        // Apply the hunk
        const newLines: string[] = [];
        for (const op of hunk.operations) {
          if (op.type === 'context' || op.type === 'add') {
            newLines.push(op.line);
          }
          // 'remove' lines are simply skipped
        }

        const removeCount = hunk.operations.filter(op => op.type === 'context' || op.type === 'remove').length;
        result.splice(matchOffset, removeCount, ...newLines);
      }

      await fs.writeFile(filePath, result.join('\n'), 'utf-8');
      return {
        content: `Applied ${hunks.length} hunk(s) to ${filePath}. ${result.length} lines total.`,
        metadata: { hunksApplied: hunks.length, totalLines: result.length },
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') return { content: `File not found: ${filePath}`, isError: true };
      return { content: `Error applying diff: ${err.message}`, isError: true };
    }
  }

  private parseHunks(diff: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const lines = diff.split('\n');
    let i = 0;

    // Skip header lines (---, +++, etc.)
    while (i < lines.length && !lines[i].startsWith('@@')) i++;

    while (i < lines.length) {
      if (lines[i].startsWith('@@')) {
        const match = lines[i].match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (!match) { i++; continue; }

        const hunk: DiffHunk = {
          origStart: parseInt(match[1]),
          origCount: parseInt(match[2] ?? '1'),
          newStart: parseInt(match[3]),
          newCount: parseInt(match[4] ?? '1'),
          contextLines: [],
          removeLines: [],
          addLines: [],
          operations: [],
        };

        i++;
        while (i < lines.length && !lines[i].startsWith('@@')) {
          const line = lines[i];
          if (line.startsWith('+')) {
            const content = line.substring(1);
            hunk.addLines.push(content);
            hunk.operations.push({ type: 'add', line: content });
          } else if (line.startsWith('-')) {
            const content = line.substring(1);
            hunk.removeLines.push(content);
            hunk.operations.push({ type: 'remove', line: content });
          } else if (line.startsWith(' ') || line === '') {
            const content = line.startsWith(' ') ? line.substring(1) : line;
            hunk.contextLines.push(content);
            hunk.operations.push({ type: 'context', line: content });
          } else {
            // Unknown prefix — might be end of diff
            break;
          }
          i++;
        }

        if (hunk.operations.length > 0) hunks.push(hunk);
      } else {
        i++;
      }
    }

    return hunks;
  }

  private findHunkOffset(lines: string[], hunk: DiffHunk): number {
    // Try exact position first (0-indexed)
    const startIdx = hunk.origStart - 1;
    if (this.matchesAtOffset(lines, hunk, startIdx)) return startIdx;

    // Fuzzy search: try nearby offsets (±5 lines)
    for (let offset = 1; offset <= 5; offset++) {
      if (this.matchesAtOffset(lines, hunk, startIdx + offset)) return startIdx + offset;
      if (this.matchesAtOffset(lines, hunk, startIdx - offset)) return startIdx - offset;
    }

    return -1;
  }

  private matchesAtOffset(lines: string[], hunk: DiffHunk, offset: number): boolean {
    if (offset < 0 || offset >= lines.length) return false;

    let lineIdx = offset;
    for (const op of hunk.operations) {
      if (op.type === 'context' || op.type === 'remove') {
        if (lineIdx >= lines.length) return false;
        if (lines[lineIdx].trimEnd() !== op.line.trimEnd()) return false;
        lineIdx++;
      }
    }
    return true;
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    return result.content;
  }
}
