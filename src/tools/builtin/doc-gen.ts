import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const VALID_STYLES = ['jsdoc', 'tsdoc', 'python', 'auto'] as const;
type DocStyle = typeof VALID_STYLES[number];

interface ExtractedSymbol {
  name: string;
  kind: 'function' | 'class' | 'method' | 'interface' | 'type';
  signature: string;
  params: { name: string; type?: string }[];
  returnType?: string;
  line: number;
  hasDoc: boolean;
}

export class DocGenTool implements Tool {
  readonly name = 'DocGen';
  readonly description = 'Generate documentation stubs (JSDoc/TSDoc/Python docstrings) for functions, classes, and interfaces in a file. Detects undocumented symbols and generates template comments.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to document',
      },
      style: {
        type: 'string',
        description: 'Documentation style: jsdoc, tsdoc, python, auto (default: auto)',
      },
      overwrite: {
        type: 'boolean',
        description: 'Overwrite existing doc comments (default: false)',
      },
      dryRun: {
        type: 'boolean',
        description: 'Preview generated docs without modifying the file (default: false)',
      },
    },
    required: ['file_path'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path.trim()) {
      return 'file_path must be a non-empty string';
    }
    if (input.style && !VALID_STYLES.includes(input.style as DocStyle)) {
      return `style must be one of: ${VALID_STYLES.join(', ')}`;
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const overwrite = input.overwrite === true;
    const dryRun = input.dryRun === true;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      const style = this.resolveStyle(input.style as DocStyle | undefined, ext);

      const symbols = style === 'python'
        ? this.extractPythonSymbols(content)
        : this.extractTSSymbols(content);

      const undocumented = overwrite ? symbols : symbols.filter(s => !s.hasDoc);

      if (undocumented.length === 0) {
        return { content: 'All exported symbols are already documented.' };
      }

      const docs = undocumented.map(sym => ({
        symbol: sym,
        doc: style === 'python'
          ? this.generatePythonDoc(sym)
          : this.generateJSDoc(sym, style === 'tsdoc'),
      }));

      if (dryRun) {
        const preview = docs.map(d =>
          `--- ${d.symbol.kind} ${d.symbol.name} (line ${d.symbol.line}) ---\n${d.doc}`
        ).join('\n\n');
        return {
          content: `Documentation preview for ${path.basename(filePath)}:\n\n${preview}\n\n${undocumented.length} symbol(s) would be documented.`,
        };
      }

      // Apply docs to file — insert before each symbol's line
      const lines = content.split('\n');
      const insertions: { line: number; doc: string }[] = docs.map(d => ({
        line: d.symbol.line - 1,
        doc: d.doc,
      }));

      // Sort by line descending so insertions don't shift earlier line numbers
      insertions.sort((a, b) => b.line - a.line);

      for (const ins of insertions) {
        const indent = lines[ins.line]?.match(/^(\s*)/)?.[1] || '';
        const docLines = ins.doc.split('\n').map(l => indent + l);
        lines.splice(ins.line, 0, ...docLines);
      }

      await fs.writeFile(filePath, lines.join('\n'), 'utf-8');

      return {
        content: `Generated documentation for ${undocumented.length} symbol(s) in ${path.basename(filePath)}:\n` +
          undocumented.map(s => `  - ${s.kind} ${s.name} (line ${s.line})`).join('\n'),
      };
    } catch (error) {
      return { content: `DocGen error: ${(error as Error).message}`, isError: true };
    }
  }

  private resolveStyle(requested: DocStyle | undefined, ext: string): 'jsdoc' | 'tsdoc' | 'python' {
    if (requested && requested !== 'auto') return requested;
    if (ext === '.py') return 'python';
    if (ext === '.ts' || ext === '.tsx') return 'tsdoc';
    return 'jsdoc';
  }

  private extractTSSymbols(content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if previous line(s) have a doc comment
      const hasDoc = i > 0 && this.hasPrecedingDocComment(lines, i);

      // Exported function
      const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*(.+?))?[\s{]/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          signature: line.trim(),
          params: this.parseParams(funcMatch[3]),
          returnType: funcMatch[4]?.trim(),
          line: i + 1,
          hasDoc,
        });
        continue;
      }

      // Exported class
      const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          signature: line.trim(),
          params: [],
          line: i + 1,
          hasDoc,
        });
        continue;
      }

      // Exported interface
      const ifaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
      if (ifaceMatch) {
        symbols.push({
          name: ifaceMatch[1],
          kind: 'interface',
          signature: line.trim(),
          params: [],
          line: i + 1,
          hasDoc,
        });
        continue;
      }

      // Exported type alias
      const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: 'type',
          signature: line.trim(),
          params: [],
          line: i + 1,
          hasDoc,
        });
        continue;
      }

      // Class methods
      const methodMatch = line.match(/^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(.+?))?[\s{]/);
      if (methodMatch && !line.includes('//') && !methodMatch[1].match(/^(if|for|while|switch|catch|constructor)$/)) {
        symbols.push({
          name: methodMatch[1],
          kind: 'method',
          signature: line.trim(),
          params: this.parseParams(methodMatch[2]),
          returnType: methodMatch[3]?.trim(),
          line: i + 1,
          hasDoc,
        });
      }
    }

    return symbols;
  }

  private extractPythonSymbols(content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for existing docstring on next line
      const hasDoc = i + 1 < lines.length && /^\s*"""/.test(lines[i + 1]);

      const funcMatch = line.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(.+?))?:/);
      if (funcMatch) {
        const indent = funcMatch[1];
        symbols.push({
          name: funcMatch[2],
          kind: indent.length > 0 ? 'method' : 'function',
          signature: line.trim(),
          params: this.parsePythonParams(funcMatch[3]),
          returnType: funcMatch[4]?.trim(),
          line: i + 1,
          hasDoc,
        });
        continue;
      }

      const classMatch = line.match(/^class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          signature: line.trim(),
          params: [],
          line: i + 1,
          hasDoc,
        });
      }
    }

    return symbols;
  }

  private hasPrecedingDocComment(lines: string[], lineIndex: number): boolean {
    for (let i = lineIndex - 1; i >= 0 && i >= lineIndex - 5; i--) {
      const l = lines[i].trim();
      if (l.endsWith('*/') || l.startsWith('/**') || l.startsWith('* ')) return true;
      if (l === '' || l.startsWith('//')) continue;
      break;
    }
    return false;
  }

  private parseParams(paramStr: string): { name: string; type?: string }[] {
    if (!paramStr.trim()) return [];
    return paramStr.split(',').map(p => {
      const parts = p.trim().split(/:\s*/);
      return { name: parts[0].replace(/[?=].*/, '').trim(), type: parts[1]?.trim() };
    }).filter(p => p.name && !p.name.startsWith('...'));
  }

  private parsePythonParams(paramStr: string): { name: string; type?: string }[] {
    if (!paramStr.trim()) return [];
    return paramStr.split(',').map(p => {
      const parts = p.trim().split(/:\s*/);
      const name = parts[0].replace(/=.*/, '').trim();
      return { name, type: parts[1]?.replace(/=.*/, '').trim() };
    }).filter(p => p.name && p.name !== 'self' && p.name !== 'cls');
  }

  private generateJSDoc(sym: ExtractedSymbol, isTSDoc: boolean): string {
    const lines: string[] = ['/**'];
    lines.push(` * ${sym.kind === 'class' ? `Class ${sym.name}` : sym.kind === 'interface' ? `Interface ${sym.name}` : `TODO: Add description for ${sym.name}`}`);

    if (sym.params.length > 0) {
      lines.push(' *');
      for (const p of sym.params) {
        const typeTag = p.type && !isTSDoc ? ` {${p.type}}` : '';
        lines.push(` * @param${typeTag} ${p.name} - TODO: describe parameter`);
      }
    }

    if (sym.returnType && sym.returnType !== 'void' && sym.kind !== 'class') {
      const typeTag = sym.returnType && !isTSDoc ? ` {${sym.returnType}}` : '';
      lines.push(` * @returns${typeTag} TODO: describe return value`);
    }

    lines.push(' */');
    return lines.join('\n');
  }

  private generatePythonDoc(sym: ExtractedSymbol): string {
    const indent = '    ';
    const lines: string[] = [`${indent}"""TODO: Add description for ${sym.name}`];

    if (sym.params.length > 0) {
      lines.push('');
      lines.push(`${indent}Args:`);
      for (const p of sym.params) {
        const typeHint = p.type ? ` (${p.type})` : '';
        lines.push(`${indent}    ${p.name}${typeHint}: TODO: describe parameter`);
      }
    }

    if (sym.returnType && sym.returnType !== 'None') {
      lines.push('');
      lines.push(`${indent}Returns:`);
      lines.push(`${indent}    ${sym.returnType}: TODO: describe return value`);
    }

    lines.push(`${indent}"""`);
    return lines.join('\n');
  }
}
