import * as fs from 'node:fs/promises';
import * as vm from 'node:vm';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const VALID_ACTIONS = ['eval', 'notebook_read', 'notebook_edit', 'notebook_add_cell', 'notebook_run'] as const;
type Action = typeof VALID_ACTIONS[number];

// Persistent REPL context across evaluations
let replContext: vm.Context | null = null;

export class NotebookTool implements Tool {
  readonly name = 'Notebook';
  readonly description = `JavaScript/TypeScript REPL and Jupyter notebook editor. Actions: eval (evaluate JS code in persistent context), notebook_read (read .ipynb), notebook_edit (edit a cell), notebook_add_cell (add cell), notebook_run (evaluate code cells).`;
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: eval, notebook_read, notebook_edit, notebook_add_cell, notebook_run',
      },
      code: {
        type: 'string',
        description: 'JavaScript code to evaluate (for eval action)',
      },
      file_path: {
        type: 'string',
        description: 'Path to .ipynb file (for notebook actions)',
      },
      cell_index: {
        type: 'number',
        description: 'Cell index (0-based) for notebook_edit',
      },
      cell_type: {
        type: 'string',
        description: 'Cell type: code or markdown (for notebook_add_cell)',
      },
      source: {
        type: 'string',
        description: 'New cell source content (for notebook_edit and notebook_add_cell)',
      },
      resetContext: {
        type: 'boolean',
        description: 'Reset the REPL context (for eval action)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    if (action === 'eval' && !input.code) return 'code is required for eval action';
    if (['notebook_read', 'notebook_edit', 'notebook_add_cell', 'notebook_run'].includes(action) && !input.file_path) {
      return 'file_path is required for notebook actions';
    }
    if (action === 'notebook_edit' && typeof input.cell_index !== 'number') {
      return 'cell_index is required for notebook_edit action';
    }
    if (action === 'notebook_add_cell' && !input.source) {
      return 'source is required for notebook_add_cell action';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;

    try {
      switch (action) {
        case 'eval':
          return this.evalCode(input.code as string, input.resetContext === true);

        case 'notebook_read':
          return await this.readNotebook(input.file_path as string);

        case 'notebook_edit':
          return await this.editCell(
            input.file_path as string,
            input.cell_index as number,
            input.source as string,
            input.cell_type as string | undefined,
          );

        case 'notebook_add_cell':
          return await this.addCell(
            input.file_path as string,
            input.source as string,
            (input.cell_type as string) || 'code',
            input.cell_index as number | undefined,
          );

        case 'notebook_run':
          return await this.runNotebook(input.file_path as string);
      }
    } catch (error) {
      return { content: `Notebook error: ${(error as Error).message}`, isError: true };
    }
  }

  private evalCode(code: string, reset: boolean): ToolResult {
    if (reset || !replContext) {
      replContext = vm.createContext({
        console: {
          log: (...args: unknown[]) => outputLines.push(args.map(String).join(' ')),
          error: (...args: unknown[]) => outputLines.push('[ERROR] ' + args.map(String).join(' ')),
          warn: (...args: unknown[]) => outputLines.push('[WARN] ' + args.map(String).join(' ')),
        },
        setTimeout, setInterval, clearTimeout, clearInterval,
        Buffer, URL, URLSearchParams,
        JSON, Math, Date, RegExp, Map, Set, WeakMap, WeakSet,
        Promise, Array, Object, String, Number, Boolean,
        parseInt, parseFloat, isNaN, isFinite,
      });
    }

    const outputLines: string[] = [];
    // Inject console capture into context
    (replContext as any).console = {
      log: (...args: unknown[]) => outputLines.push(args.map(String).join(' ')),
      error: (...args: unknown[]) => outputLines.push('[ERROR] ' + args.map(String).join(' ')),
      warn: (...args: unknown[]) => outputLines.push('[WARN] ' + args.map(String).join(' ')),
    };

    try {
      const result = vm.runInContext(code, replContext, { timeout: 10000 });
      const consoleOutput = outputLines.length > 0 ? outputLines.join('\n') + '\n' : '';
      const resultStr = result !== undefined
        ? `=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`
        : '';
      return {
        content: `${consoleOutput}${resultStr}`.trim() || '(no output)',
      };
    } catch (error) {
      const consoleOutput = outputLines.length > 0 ? outputLines.join('\n') + '\n' : '';
      return {
        content: `${consoleOutput}Error: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  private async readNotebook(filePath: string): Promise<ToolResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const nb = JSON.parse(content);

    if (!nb.cells || !Array.isArray(nb.cells)) {
      return { content: 'Invalid notebook format: no cells array', isError: true };
    }

    const cellSummaries = nb.cells.map((cell: any, i: number) => {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
      const type = cell.cell_type || 'unknown';
      const outputCount = cell.outputs?.length || 0;
      const preview = source.substring(0, 200).replace(/\n/g, '\n  ');
      return `[${i}] ${type}${outputCount > 0 ? ` (${outputCount} outputs)` : ''}:\n  ${preview}${source.length > 200 ? '...' : ''}`;
    });

    const kernel = nb.metadata?.kernelspec?.display_name || 'unknown';
    return {
      content: `Notebook: ${filePath}\nKernel: ${kernel}\nCells: ${nb.cells.length}\n\n${cellSummaries.join('\n\n')}`,
    };
  }

  private async editCell(filePath: string, index: number, source: string | undefined, cellType: string | undefined): Promise<ToolResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const nb = JSON.parse(content);

    if (!nb.cells || index < 0 || index >= nb.cells.length) {
      return { content: `Invalid cell index: ${index} (notebook has ${nb.cells?.length || 0} cells)`, isError: true };
    }

    if (source !== undefined) {
      nb.cells[index].source = source.split('\n').map((l: string, i: number, arr: string[]) =>
        i < arr.length - 1 ? l + '\n' : l
      );
    }
    if (cellType) {
      nb.cells[index].cell_type = cellType;
    }

    await fs.writeFile(filePath, JSON.stringify(nb, null, 1), 'utf-8');
    return { content: `Updated cell [${index}] in ${filePath}` };
  }

  private async addCell(filePath: string, source: string, cellType: string, afterIndex?: number): Promise<ToolResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const nb = JSON.parse(content);

    const newCell: any = {
      cell_type: cellType,
      metadata: {},
      source: source.split('\n').map((l: string, i: number, arr: string[]) =>
        i < arr.length - 1 ? l + '\n' : l
      ),
    };

    if (cellType === 'code') {
      newCell.execution_count = null;
      newCell.outputs = [];
    }

    const insertAt = afterIndex !== undefined ? afterIndex + 1 : nb.cells.length;
    nb.cells.splice(insertAt, 0, newCell);

    await fs.writeFile(filePath, JSON.stringify(nb, null, 1), 'utf-8');
    return { content: `Added ${cellType} cell at index [${insertAt}] in ${filePath}` };
  }

  private async runNotebook(filePath: string): Promise<ToolResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const nb = JSON.parse(content);
    const codeCells = nb.cells.filter((c: any) => c.cell_type === 'code');

    if (codeCells.length === 0) {
      return { content: 'No code cells to run.' };
    }

    // Create a fresh context for notebook execution
    const context = vm.createContext({
      console: { log: (...args: unknown[]) => {} },
      JSON, Math, Date, RegExp, Map, Set, Array, Object, String, Number,
      parseInt, parseFloat,
    });

    const results: string[] = [];
    for (let i = 0; i < codeCells.length; i++) {
      const cell = codeCells[i];
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      const outputs: string[] = [];

      // Capture console output
      (context as any).console = {
        log: (...args: unknown[]) => outputs.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => outputs.push('[ERROR] ' + args.map(String).join(' ')),
      };

      try {
        const result = vm.runInContext(source, context, { timeout: 10000 });
        if (result !== undefined) {
          outputs.push(`=> ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
        }
        results.push(`Cell [${i}]: OK\n${outputs.join('\n')}`);
      } catch (error) {
        results.push(`Cell [${i}]: ERROR\n${(error as Error).message}`);
      }
    }

    return { content: `Executed ${codeCells.length} code cells:\n\n${results.join('\n\n')}` };
  }
}
