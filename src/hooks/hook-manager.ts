import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { minimatch } from 'minimatch';
import type { ToolResult, ToolContext } from '../tools/tool-types.js';
import type { OmniCodeConfig } from '../config/config-schema.js';

const execFileAsync = promisify(execFile);

export interface HookDefinition {
  toolPattern: string;
  command: string;
}

export class HookManager {
  private preHooks: HookDefinition[];
  private postHooks: HookDefinition[];

  constructor(config: OmniCodeConfig['hooks']) {
    this.preHooks = config.preToolCall.map(h => ({
      toolPattern: h.tool,
      command: h.command,
    }));
    this.postHooks = config.postToolCall.map(h => ({
      toolPattern: h.tool,
      command: h.command,
    }));
  }

  async runPreHooks(
    toolName: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<void> {
    for (const hook of this.matchingHooks(this.preHooks, toolName)) {
      await this.executeHook(hook, {
        OMNICODE_TOOL: toolName,
        OMNICODE_INPUT: JSON.stringify(input),
        OMNICODE_HOOK_TYPE: 'pre',
        OMNICODE_CWD: context.cwd,
      });
    }
  }

  async runPostHooks(
    toolName: string,
    input: Record<string, unknown>,
    result: ToolResult,
    context: ToolContext,
  ): Promise<void> {
    for (const hook of this.matchingHooks(this.postHooks, toolName)) {
      await this.executeHook(hook, {
        OMNICODE_TOOL: toolName,
        OMNICODE_INPUT: JSON.stringify(input),
        OMNICODE_RESULT: result.content.substring(0, 10000),
        OMNICODE_HOOK_TYPE: 'post',
        OMNICODE_IS_ERROR: String(result.isError || false),
        OMNICODE_CWD: context.cwd,
      });
    }
  }

  private matchingHooks(hooks: HookDefinition[], toolName: string): HookDefinition[] {
    return hooks.filter(h =>
      h.toolPattern === '*' ||
      h.toolPattern === toolName ||
      minimatch(toolName, h.toolPattern),
    );
  }

  private async executeHook(
    hook: HookDefinition,
    env: Record<string, string>,
  ): Promise<void> {
    try {
      await execFileAsync('sh', ['-c', hook.command], {
        env: { ...process.env, ...env },
        timeout: 30_000,
      });
    } catch (error) {
      // Hooks failing should not break the tool execution
      console.error(`Hook failed: ${hook.command}`, (error as Error).message);
    }
  }
}
