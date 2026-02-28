import type { PermissionMode } from '../config/config-schema.js';
import type { Tool, ToolContext } from '../tools/tool-types.js';
import { PermissionLevel } from '../tools/tool-types.js';
import { EventBus } from '../utils/event-bus.js';

export class PermissionManager {
  private sessionPermissions = new Map<string, 'allow' | 'deny'>();

  constructor(
    private mode: PermissionMode,
    private eventBus: EventBus,
  ) {}

  setMode(mode: PermissionMode): void {
    this.mode = mode;
  }

  getMode(): PermissionMode {
    return this.mode;
  }

  async check(
    tool: Tool,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<boolean> {
    // Plan mode: only allow tools marked as available
    if (context.planMode && !tool.availableInPlanMode) {
      return false;
    }

    // Auto-allow mode
    if (this.mode === 'auto-allow') {
      return true;
    }

    // Deny-all mode
    if (this.mode === 'deny-all' && tool.permissionLevel !== PermissionLevel.SAFE) {
      return false;
    }

    // SAFE tools always pass
    if (tool.permissionLevel === PermissionLevel.SAFE) {
      return true;
    }

    // Check session-level grants
    const toolKey = tool.name;
    const specificKey = this.getPermissionKey(tool, input);

    const sessionGrant = this.sessionPermissions.get(specificKey)
      || this.sessionPermissions.get(toolKey);
    if (sessionGrant === 'allow') return true;
    if (sessionGrant === 'deny') return false;

    // Ask the user
    return this.promptUser(tool, input);
  }

  grantSession(toolName: string): void {
    this.sessionPermissions.set(toolName, 'allow');
  }

  denySession(toolName: string): void {
    this.sessionPermissions.set(toolName, 'deny');
  }

  clearSessionPermissions(): void {
    this.sessionPermissions.clear();
  }

  private async promptUser(tool: Tool, input: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      this.eventBus.emit('permission_request', {
        toolName: tool.name,
        input,
        onAllow: () => resolve(true),
        onDeny: () => resolve(false),
        onAllowAlways: () => {
          this.sessionPermissions.set(tool.name, 'allow');
          resolve(true);
        },
      });
    });
  }

  private getPermissionKey(tool: Tool, input: Record<string, unknown>): string {
    switch (tool.name) {
      case 'Write':
      case 'Edit':
      case 'Read':
        return `${tool.name}:${input.file_path}`;
      case 'Bash':
        return `${tool.name}:${String(input.command || '').split(' ')[0]}`;
      default:
        return tool.name;
    }
  }
}
