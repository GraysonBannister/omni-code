import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ToolResult } from '../tools/tool-types.js';
import type { JsonSchema } from '../providers/provider-types.js';
import { logger } from '../utils/logger.js';

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse' | 'streamable-http';
  url?: string;
}

export interface MCPToolInfo {
  serverName: string;
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export class MCPClientManager {
  private clients = new Map<string, Client>();

  async connect(config: MCPServerConfig): Promise<void> {
    if (config.transport !== 'stdio') {
      logger.warn(`MCP transport "${config.transport}" not yet supported. Only stdio is currently implemented.`);
      return;
    }

    if (!config.command) {
      throw new Error(`MCP server "${config.name}" requires a command for stdio transport.`);
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    const client = new Client(
      { name: 'omni-code', version: '0.1.0' },
      { capabilities: {} },
    );

    await client.connect(transport);
    this.clients.set(config.name, client);
    logger.info(`Connected to MCP server: ${config.name}`);
  }

  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch {
        // Ignore disconnect errors
      }
      this.clients.delete(name);
    }
  }

  async discoverTools(): Promise<MCPToolInfo[]> {
    const allTools: MCPToolInfo[] = [];
    for (const [serverName, client] of this.clients) {
      try {
        const response = await client.listTools();
        for (const tool of response.tools) {
          allTools.push({
            serverName,
            name: tool.name,
            description: tool.description || '',
            inputSchema: (tool.inputSchema || {}) as JsonSchema,
          });
        }
      } catch (error) {
        logger.warn(`Failed to list tools from MCP server "${serverName}": ${(error as Error).message}`);
      }
    }
    return allTools;
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      return { content: `MCP server "${serverName}" not connected`, isError: true };
    }

    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      const content = (result.content as any[])
        .map((c: any) => (c.type === 'text' ? c.text : JSON.stringify(c)))
        .join('\n');
      return {
        content,
        isError: (result.isError as boolean) || false,
      };
    } catch (error) {
      return {
        content: `MCP tool error: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}
