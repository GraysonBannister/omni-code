import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface EditOperation {
  file_path: string;
  old_string: string;
  new_string: string;
}

export class MultiFileEditTool implements Tool {
  readonly name = 'MultiFileEdit';
  readonly description = 'Apply multiple edits across files atomically. All edits are validated first, then applied. Rolls back on failure.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.WRITE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        description: 'Array of edits to apply',
        items: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Absolute path to the file' },
            old_string: { type: 'string', description: 'Text to replace (must be unique in the file)' },
            new_string: { type: 'string', description: 'Replacement text' },
          },
          required: ['file_path', 'old_string', 'new_string'],
        },
      },
    },
    required: ['edits'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (!Array.isArray(input.edits) || input.edits.length === 0) {
      return 'edits must be a non-empty array';
    }
    for (let i = 0; i < input.edits.length; i++) {
      const edit = input.edits[i] as Record<string, unknown>;
      if (typeof edit.file_path !== 'string' || !edit.file_path) {
        return `edits[${i}].file_path must be a non-empty string`;
      }
      if (!path.isAbsolute(edit.file_path)) {
        return `edits[${i}].file_path must be an absolute path`;
      }
      if (typeof edit.old_string !== 'string') {
        return `edits[${i}].old_string must be a string`;
      }
      if (typeof edit.new_string !== 'string') {
        return `edits[${i}].new_string must be a string`;
      }
      if (edit.old_string === edit.new_string) {
        return `edits[${i}]: old_string and new_string must be different`;
      }
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const edits = input.edits as EditOperation[];

    // Phase 1: Read all files and validate edits
    const fileContents = new Map<string, string>();
    const validationErrors: string[] = [];

    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      try {
        if (!fileContents.has(edit.file_path)) {
          const content = await fs.readFile(edit.file_path, 'utf-8');
          fileContents.set(edit.file_path, content);
        }

        const content = fileContents.get(edit.file_path)!;
        if (!content.includes(edit.old_string)) {
          validationErrors.push(`edits[${i}]: old_string not found in ${edit.file_path}`);
          continue;
        }

        const firstIdx = content.indexOf(edit.old_string);
        const lastIdx = content.lastIndexOf(edit.old_string);
        if (firstIdx !== lastIdx) {
          const count = content.split(edit.old_string).length - 1;
          validationErrors.push(`edits[${i}]: old_string appears ${count} times in ${edit.file_path} (must be unique)`);
        }
      } catch (error) {
        validationErrors.push(`edits[${i}]: cannot read ${edit.file_path}: ${(error as Error).message}`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        content: `Validation failed. No files were modified.\n\n${validationErrors.join('\n')}`,
        isError: true,
      };
    }

    // Phase 2: Backup originals
    const backups = new Map<string, string>();
    for (const [filePath, content] of fileContents) {
      backups.set(filePath, content);
    }

    // Phase 3: Apply edits
    const appliedFiles = new Set<string>();
    try {
      // Build the final content for each file by applying all its edits
      const finalContents = new Map<string, string>(fileContents);

      for (const edit of edits) {
        const current = finalContents.get(edit.file_path)!;
        const updated = current.replace(edit.old_string, edit.new_string);
        finalContents.set(edit.file_path, updated);
      }

      // Write all files
      for (const [filePath, content] of finalContents) {
        await fs.writeFile(filePath, content, 'utf-8');
        appliedFiles.add(filePath);
      }

      return {
        content: `Successfully applied ${edits.length} edit(s) across ${appliedFiles.size} file(s).`,
        metadata: { editsApplied: edits.length, filesChanged: appliedFiles.size },
      };
    } catch (error) {
      // Phase 4: Rollback on failure
      const rollbackErrors: string[] = [];
      for (const filePath of appliedFiles) {
        const original = backups.get(filePath);
        if (original !== undefined) {
          try {
            await fs.writeFile(filePath, original, 'utf-8');
          } catch (rollbackErr) {
            rollbackErrors.push(`Failed to rollback ${filePath}: ${(rollbackErr as Error).message}`);
          }
        }
      }

      let message = `Error applying edits: ${(error as Error).message}. Rolled back ${appliedFiles.size} file(s).`;
      if (rollbackErrors.length > 0) {
        message += `\n\nRollback errors:\n${rollbackErrors.join('\n')}`;
      }

      return { content: message, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return 'Multi-file edit: failed (rolled back)';
    const edits = result.metadata?.editsApplied || 0;
    const files = result.metadata?.filesChanged || 0;
    return `Multi-file edit: ${edits} edits in ${files} files`;
  }
}
