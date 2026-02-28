import type { UnifiedMessage, StreamDelta } from './message-types.js';
import type { LLMProvider } from '../providers/provider-types.js';
import type { ToolRegistration, ToolResult } from '../tools/tool-types.js';

export type AgentEvent =
  | { type: 'stream_delta'; delta: StreamDelta }
  | { type: 'tool_call_start'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolName: string; toolId: string; result: ToolResult }
  | { type: 'permission_request'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'permission_granted'; toolId: string }
  | { type: 'permission_denied'; toolId: string }
  | { type: 'turn_complete'; message: UnifiedMessage }
  | { type: 'error'; error: Error }
  | { type: 'context_compressed'; removedTokens: number; remainingTokens: number }
  | { type: 'cost_update'; totalCost: number; turnCost: number };

export interface AgentConfig {
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  tools: ToolRegistration[];
  maxTurns?: number;
  temperature?: number;
  maxTokens?: number;
  isSubAgent?: boolean;
  parentAgentId?: string;
  planMode?: boolean;
}

export interface Agent {
  readonly id: string;
  readonly config: AgentConfig;
  readonly messages: UnifiedMessage[];

  run(userMessage: string): AsyncIterable<AgentEvent>;
  addMessage(message: UnifiedMessage): void;
  compressContext(): Promise<void>;
  getTokenCount(): Promise<number>;
  abort(): void;
  spawnSubAgent(config: Partial<AgentConfig>): Agent;
}
