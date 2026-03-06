import type { ToolResult, ToolContext } from './tool-types.js';
import type { ToolRegistry } from './tool-registry.js';
import type { PermissionManager } from '../permissions/permission-manager.js';
import type { EventBus } from '../utils/event-bus.js';

const LINT_ELIGIBLE_TOOLS = new Set(['Edit', 'Write', 'MultiFileEdit', 'DiffEdit']);

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

    // 1. Validate input
    const validationError = tool.validate(input);
    if (validationError) {
      return { content: `Validation error: ${validationError}`, isError: true };
    }

    // 2. Plan mode check
    if (context.planMode && !tool.availableInPlanMode) {
      return {
        content: `Tool "${toolName}" is not available in plan mode (read-only).`,
        isError: true,
      };
    }

    // 3. Permission check
    const permitted = await this.permissionManager.check(tool, input, context);
    if (!permitted) {
      this.eventBus.emit('permission_denied', { toolName, toolId });
      return { content: 'Permission denied by user.', isError: true };
    }

    // 4. Execute the tool
    this.eventBus.emit('tool_call_start', { toolName, toolId, input });
    let result: ToolResult;
    try {
      result = await tool.execute(input, context);
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
          const filePath = input.file_path as string;
          if (filePath) {
            await lintReg.tool.execute({ file_path: filePath, fix: true }, context);
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
}
