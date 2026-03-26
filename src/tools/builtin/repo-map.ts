import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import fg from 'fast-glob';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface SymbolInfo {
  name: string;
  kind: string;
  signature?: string;
}

const TS_PATTERNS = [
  // exported function with signature
  /export\s+(?:async\s+)?function\s+(\w+)\s*(\([^)]*\)(?:\s*:\s*[^{]+)?)/g,
  // exported class
  /export\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[^{]+)?/g,
  // exported interface
  /export\s+interface\s+(\w+)(?:\s+extends\s+[^{]+)?/g,
  // exported type
  /export\s+type\s+(\w+)(?:\s*<[^>]*>)?\s*=/g,
  // exported enum
  /export\s+(?:const\s+)?enum\s+(\w+)/g,
  // exported const (arrow functions and values)
  /export\s+const\s+(\w+)(?:\s*:\s*([^=]+))?\s*=/g,
  // default export
  /export\s+default\s+(?:class|function)\s+(\w+)/g,
];

const PY_PATTERNS = [
  // top-level function
  /^def\s+(\w+)\s*(\([^)]*\)(?:\s*->\s*[^:]+)?)/gm,
  // top-level class
  /^class\s+(\w+)(?:\([^)]*\))?/gm,
];

export class RepoMapTool implements Tool {
  readonly name = 'RepoMap';
  readonly description = `Generate a structural map of the codebase showing files and their exported symbols (functions, classes, interfaces, types, enums) with signatures. Useful for understanding project architecture without reading every file.`;
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern for files to analyze (default: src/**/*.{ts,tsx,js,jsx,py})',
      },
      maxFiles: {
        type: 'number',
        description: 'Maximum number of files to analyze (default: 100)',
      },
      includeSignatures: {
        type: 'boolean',
        description: 'Include function signatures (default: true)',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.pattern !== undefined && typeof input.pattern !== 'string') {
      return 'pattern must be a string glob pattern';
    }
    if (input.maxFiles !== undefined && (typeof input.maxFiles !== 'number' || input.maxFiles < 1)) {
      return 'maxFiles must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = (input.pattern as string) || 'src/**/*.{ts,tsx,js,jsx,py}';
    const maxFiles = (input.maxFiles as number) || 100;
    const includeSignatures = input.includeSignatures !== false;

    try {
      const files = await fg(pattern, {
        cwd: context.cwd,
        deep: 6,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**'],
      });

      const limitedFiles = files.sort().slice(0, maxFiles);
      const output: string[] = [];
      let totalSymbols = 0;

      for (const relPath of limitedFiles) {
        try {
          const absPath = path.join(context.cwd, relPath);
          const content = await fs.readFile(absPath, 'utf-8');
          const ext = path.extname(relPath).toLowerCase();
          const isPython = ext === '.py';
          const symbols = isPython
            ? this.extractPythonSymbols(content)
            : this.extractTSSymbols(content);

          if (symbols.length > 0) {
            output.push(relPath);
            for (const sym of symbols) {
              const sig = includeSignatures && sym.signature ? sym.signature.trim() : '';
              output.push(`  ${sym.kind} ${sym.name}${sig ? ' ' + sig : ''}`);
              totalSymbols++;
            }
            output.push('');
          }
        } catch {
          // Skip unreadable files
        }
      }

      if (output.length === 0) {
        return { content: `No exported symbols found in ${limitedFiles.length} files matching "${pattern}".` };
      }

      return {
        content: `Repository map: ${totalSymbols} symbols across ${limitedFiles.length} files\n\n${output.join('\n')}`,
      };
    } catch (error) {
      return { content: `Error generating repo map: ${(error as Error).message}`, isError: true };
    }
  }

  private extractTSSymbols(content: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const seen = new Set<string>();

    // Functions
    for (const match of content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*(\([^)]*\)(?:\s*:\s*[^{]+)?)/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        symbols.push({ name: match[1], kind: 'function', signature: match[2]?.trim() });
      }
    }

    // Classes
    for (const match of content.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        const ext = match[2] ? ` extends ${match[2]}` : '';
        symbols.push({ name: match[1], kind: 'class', signature: ext || undefined });
      }
    }

    // Interfaces
    for (const match of content.matchAll(/export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        const ext = match[2] ? ` extends ${match[2].trim()}` : '';
        symbols.push({ name: match[1], kind: 'interface', signature: ext || undefined });
      }
    }

    // Types
    for (const match of content.matchAll(/export\s+type\s+(\w+)(?:\s*<[^>]*>)?\s*=/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        symbols.push({ name: match[1], kind: 'type' });
      }
    }

    // Enums
    for (const match of content.matchAll(/export\s+(?:const\s+)?enum\s+(\w+)/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        symbols.push({ name: match[1], kind: 'enum' });
      }
    }

    // Const exports (arrow functions, values)
    for (const match of content.matchAll(/export\s+const\s+(\w+)(?:\s*:\s*([^=]+))?\s*=/g)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        const typeAnnotation = match[2]?.trim();
        symbols.push({ name: match[1], kind: 'const', signature: typeAnnotation });
      }
    }

    return symbols;
  }

  private extractPythonSymbols(content: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const seen = new Set<string>();

    // Top-level functions (no indentation)
    for (const match of content.matchAll(/^def\s+(\w+)\s*(\([^)]*\)(?:\s*->\s*[^:]+)?)/gm)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        symbols.push({ name: match[1], kind: 'def', signature: match[2]?.trim() });
      }
    }

    // Top-level classes
    for (const match of content.matchAll(/^class\s+(\w+)(?:\(([^)]*)\))?/gm)) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        const bases = match[2] ? `(${match[2]})` : '';
        symbols.push({ name: match[1], kind: 'class', signature: bases || undefined });
      }
    }

    return symbols;
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return result.content.split('\n')[0] || 'Repository map generated';
  }
}
