import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import * as inspector from 'node:inspector';

const VALID_ACTIONS = ['connect', 'breakpoint', 'evaluate', 'pause', 'resume', 'step', 'stacktrace', 'disconnect'] as const;
type Action = typeof VALID_ACTIONS[number];

let debugSession: inspector.Session | null = null;

export class DebuggerTool implements Tool {
  readonly name = 'Debugger';
  readonly description = `Connect to Node.js inspector for debugging. Actions: connect (start debug session), breakpoint (set breakpoint), evaluate (eval expression in paused context), pause, resume, step (stepOver/stepInto/stepOut), stacktrace, disconnect.`;
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: connect, breakpoint, evaluate, pause, resume, step, stacktrace, disconnect',
      },
      file: {
        type: 'string',
        description: 'File path for breakpoint (absolute path)',
      },
      line: {
        type: 'number',
        description: 'Line number for breakpoint (1-based)',
      },
      expression: {
        type: 'string',
        description: 'Expression to evaluate',
      },
      stepType: {
        type: 'string',
        description: 'Step type: over, into, out (default: over)',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    if (action === 'breakpoint') {
      if (!input.file) return 'file is required for breakpoint action';
      if (typeof input.line !== 'number') return 'line is required for breakpoint action';
    }
    if (action === 'evaluate' && !input.expression) return 'expression is required for evaluate action';
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;

    try {
      switch (action) {
        case 'connect': {
          if (debugSession) {
            return { content: 'Debug session already active. Use disconnect first.' };
          }
          debugSession = new inspector.Session();
          debugSession.connect();
          await this.post('Debugger.enable', {});
          await this.post('Runtime.enable', {});
          return { content: 'Debug session connected. Debugger and Runtime enabled.' };
        }

        case 'disconnect': {
          if (!debugSession) return { content: 'No active debug session.' };
          try {
            await this.post('Debugger.disable', {});
            await this.post('Runtime.disable', {});
          } catch { /* ignore */ }
          debugSession.disconnect();
          debugSession = null;
          return { content: 'Debug session disconnected.' };
        }

        case 'breakpoint': {
          this.ensureConnected();
          const file = input.file as string;
          const line = (input.line as number) - 1; // Convert to 0-based
          const result = await this.post('Debugger.setBreakpointByUrl', {
            lineNumber: line,
            urlRegex: file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          });
          const bp = result as any;
          return {
            content: `Breakpoint set at ${file}:${(input.line as number)}\nBreakpoint ID: ${bp.breakpointId}`,
          };
        }

        case 'evaluate': {
          this.ensureConnected();
          const expression = input.expression as string;
          const result = await this.post('Runtime.evaluate', {
            expression,
            generatePreview: true,
            returnByValue: true,
          }) as any;
          if (result.exceptionDetails) {
            return {
              content: `Evaluation error: ${result.exceptionDetails.text}\n${result.exceptionDetails.exception?.description || ''}`,
              isError: true,
            };
          }
          const value = result.result;
          const display = value.type === 'object'
            ? JSON.stringify(value.value, null, 2)
            : String(value.value ?? value.description ?? value.type);
          return { content: `${value.type}: ${display}` };
        }

        case 'pause': {
          this.ensureConnected();
          await this.post('Debugger.pause', {});
          return { content: 'Execution paused.' };
        }

        case 'resume': {
          this.ensureConnected();
          await this.post('Debugger.resume', {});
          return { content: 'Execution resumed.' };
        }

        case 'step': {
          this.ensureConnected();
          const stepType = (input.stepType as string) || 'over';
          const method = stepType === 'into' ? 'Debugger.stepInto'
            : stepType === 'out' ? 'Debugger.stepOut'
            : 'Debugger.stepOver';
          await this.post(method, {});
          return { content: `Stepped ${stepType}.` };
        }

        case 'stacktrace': {
          this.ensureConnected();
          // Attempt to get the call stack when paused
          const result = await this.post('Runtime.evaluate', {
            expression: 'new Error().stack',
            returnByValue: true,
          }) as any;
          return { content: `Stack trace:\n${result.result?.value || 'Not available (execution may not be paused)'}` };
        }
      }
    } catch (error) {
      return { content: `Debugger error: ${(error as Error).message}`, isError: true };
    }
  }

  private ensureConnected(): void {
    if (!debugSession) {
      throw new Error('No active debug session. Use connect action first.');
    }
  }

  private post(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      debugSession!.post(method, params, (err: Error | null, result?: any) => {
        if (err) reject(err);
        else resolve(result || {});
      });
    });
  }
}
