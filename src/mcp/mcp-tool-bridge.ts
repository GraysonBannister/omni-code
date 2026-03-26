import type { MCPClientManager, MCPToolInfo } from './mcp-client.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import type { Tool, ToolResult, ToolContext } from '../tools/tool-types.js';
import { PermissionLevel, ToolCategory } from '../tools/tool-types.js';

export class MCPToolBridge {
  constructor(
    private mcpClient: MCPClientManager,
    private toolRegistry: ToolRegistry,
  ) {}

  async registerAll(): Promise<number> {
    const mcpTools = await this.mcpClient.discoverTools();
    let registered = 0;

    for (const mcpTool of mcpTools) {
      const tool: Tool = {
        name: `mcp__${mcpTool.serverName}__${mcpTool.name}`,
        description: `[MCP: ${mcpTool.serverName}] ${mcpTool.description}`,
        inputSchema: mcpTool.inputSchema,
        permissionLevel: PermissionLevel.MODERATE,
        category: ToolCategory.EXECUTE,

        validate: () => null,

        execute: async (input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> => {
          return this.mcpClient.callTool(mcpTool.serverName, mcpTool.name, input);
        },
      };

      try {
        this.toolRegistry.register(tool, 'mcp');
        registered++;
      } catch {
        // Tool name collision — skip
      }
    }

    return registered;
  }
}
