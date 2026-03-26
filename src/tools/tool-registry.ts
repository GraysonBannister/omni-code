import type { ToolDefinition } from '../providers/provider-types.js';
import type { Tool, ToolRegistration } from './tool-types.js';

export class ToolRegistry {
  private tools = new Map<string, ToolRegistration>();

  register(tool: Tool, source: ToolRegistration['source'] = 'builtin'): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, { tool, source, enabled: true });
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolRegistration | undefined {
    return this.tools.get(name);
  }

  getForLLM(planMode: boolean): ToolDefinition[] {
    return Array.from(this.tools.values())
      .map(reg => ({
        name: reg.tool.name,
        description: reg.tool.description,
        inputSchema: reg.tool.inputSchema,
      }));
  }

  getAll(): ToolRegistration[] {
    return Array.from(this.tools.values());
  }

  setEnabled(name: string, enabled: boolean): void {
    const reg = this.tools.get(name);
    if (reg) {
      reg.enabled = enabled;
    }
  }
}
