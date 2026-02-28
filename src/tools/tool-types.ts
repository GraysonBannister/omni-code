import type { JsonSchema } from '../providers/provider-types.js';

export enum PermissionLevel {
  SAFE = 'safe',
  MODERATE = 'moderate',
  DANGEROUS = 'dangerous',
}

export enum ToolCategory {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  NETWORK = 'network',
  AGENT = 'agent',
}

export interface ToolResult {
  content: string;
  isError?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  cwd: string;
  sessionId: string;
  planMode: boolean;
  abortSignal: AbortSignal;
  onProgress?: (message: string) => void;
}

export interface Tool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly permissionLevel: PermissionLevel;
  readonly category: ToolCategory;
  readonly availableInPlanMode: boolean;

  validate(input: Record<string, unknown>): string | null;
  execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
  formatForDisplay?(result: ToolResult, input: Record<string, unknown>): string;
}

export interface ToolRegistration {
  tool: Tool;
  source: 'builtin' | 'mcp' | 'plugin';
  enabled: boolean;
}
