import type { ToolResult, ToolContext } from './tool-types.js';
import type { ToolRegistry } from './tool-registry.js';
import type { PermissionManager } from '../permissions/permission-manager.js';
import type { EventBus } from '../utils/event-bus.js';
import * as path from 'node:path';

const LINT_ELIGIBLE_TOOLS = new Set(['Edit', 'Write', 'MultiFileEdit', 'DiffEdit']);
const FILE_PATH_TOOLS = new Set(['Read', 'Write', 'Edit', 'DiffEdit']);

export class ToolRunner {
  private autoLintFix: boolean;

  constructor(
    private registry: ToolRegistry,
    private permissionManager: PermissionManager,
    private eventBus: EventBus,
    autoLintFix = false,
  ) {
    this.autoLintFix = autoLintFix;
  }

  /**
   * Get access to the EventBus for tools that need to emit events
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  async execute(
    toolName: string,
    toolId: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const registration = this.registry.get(toolName);
    if (!registration) {
      return { content: `Unknown tool: ${toolName}`, isError: true };
    }

    const tool = registration.tool;
    const normalizedInput = this.normalizeInput(toolName, input, context);

    // 1. Validate input
    const validationError = tool.validate(normalizedInput);
    if (validationError) {
      return {
        content: this.formatValidationError(validationError, normalizedInput, context),
        isError: true,
        metadata: { validationError, normalizedInput },
      };
    }

    // 2. Plan mode check
    if (context.planMode && !tool.availableInPlanMode) {
      return {
        content: `Tool "${toolName}" is not available in plan mode (read-only).`,
        isError: true,
      };
    }

    // 3. Permission check
    const permitted = await this.permissionManager.check(tool, normalizedInput, context, toolId);
    if (!permitted) {
      this.eventBus.emit('permission_denied', { toolName, toolId });
      return { content: 'Permission denied by user.', isError: true };
    }

    // 4. Execute the tool
    this.eventBus.emit('tool_call_start', { toolName, toolId, input: normalizedInput });
    const executionContext: ToolContext & { eventBus: EventBus } = {
      ...context,
      eventBus: this.eventBus,
      onProgress: (message: string) => {
        context.onProgress?.(message);
        this.eventBus.emit('tool_call_progress', {
          sessionId: context.sessionId,
          toolName,
          toolId,
          message,
        });
      },
    };
    let result: ToolResult;
    try {
      result = await tool.execute(normalizedInput, executionContext);
    } catch (error) {
      result = {
        content: `Tool execution error: ${(error as Error).message}`,
        isError: true,
      };
    }

    // 5. Auto lint-fix after file modifications
    if (this.autoLintFix && !result.isError && LINT_ELIGIBLE_TOOLS.has(toolName)) {
      try {
        const lintReg = this.registry.get('LintFix');
        if (lintReg?.enabled) {
          const filePath = normalizedInput.file_path as string;
          if (filePath) {
            await lintReg.tool.execute({ file_path: filePath, fix: true }, executionContext);
          }
        }
      } catch {
        // Lint errors are non-fatal
      }
    }

    // 6. Emit completion event
    this.eventBus.emit('tool_call_end', { toolName, toolId, result });

    return result;
  }

  private normalizeInput(
    toolName: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Record<string, unknown> {
    const normalized = { ...input };

    if (typeof normalized._raw === 'string') {
      try {
        const parsed = JSON.parse(normalized._raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.assign(normalized, parsed);
        }
      } catch {
        const extractedPath = this.extractAbsolutePath(normalized._raw);
        if (extractedPath && typeof normalized.file_path !== 'string') {
          normalized.file_path = extractedPath;
        }
      }
    }

    if (FILE_PATH_TOOLS.has(toolName)) {
      const candidatePath = this.normalizeFilePath(
        normalized.file_path ?? normalized.path,
        context.cwd,
      );
      if (candidatePath) {
        normalized.file_path = candidatePath;
      }
      delete normalized.path;
    }

    if (toolName === 'MultiFileEdit' && Array.isArray(normalized.edits)) {
      normalized.edits = normalized.edits.map((edit) => {
        if (!edit || typeof edit !== 'object') {
          return edit;
        }

        const normalizedEdit = { ...(edit as Record<string, unknown>) };
        const candidatePath = this.normalizeFilePath(
          normalizedEdit.file_path ?? normalizedEdit.path,
          context.cwd,
        );
        if (candidatePath) {
          normalizedEdit.file_path = candidatePath;
        }
        delete normalizedEdit.path;
        return normalizedEdit;
      });
    }

    return normalized;
  }

  private normalizeFilePath(value: unknown, cwd: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim().replace(/^["'`]|["'`]$/g, '');
    if (!trimmed) {
      return undefined;
    }

    return path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
  }

  private extractAbsolutePath(raw: string): string | undefined {
    const match = raw.match(/(?:\/|[A-Za-z]:[\\/])[^"'`\s]+/);
    return match?.[0];
  }

  private formatValidationError(
    validationError: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): string {
    const filePath = typeof input.file_path === 'string'
      ? input.file_path
      : typeof input.path === 'string'
        ? input.path
        : undefined;

    if (filePath) {
      return `Validation error: ${validationError} (resolved file_path: ${filePath}, cwd: ${context.cwd})`;
    }

    return `Validation error: ${validationError}`;
  }
}
