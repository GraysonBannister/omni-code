import type { UnifiedMessage, StreamDelta } from './message-types.js';
import type { LLMProvider } from '../providers/provider-types.js';
import type { ToolRegistration, ToolResult } from '../tools/tool-types.js';
import type {
  AgentCapability,
  TaskAnalysis,
  OrchestrationTaskStartEvent,
  OrchestrationTaskEndEvent,
  OrchestrationAnalysisEvent,
  OrchestrationSynthesisEvent,
} from './orchestration/orchestration-types.js';

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
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'agent_phase_start'; role: AgentRole; description: string }
  | { type: 'agent_phase_end'; role: AgentRole }
  | { type: 'orchestration_complete'; summary: string }
  | OrchestrationTaskStartEvent
  | OrchestrationTaskEndEvent
  | OrchestrationAnalysisEvent
  | OrchestrationSynthesisEvent;

export enum AgentRole {
  planner = 'planner',
  coder = 'coder',
  reviewer = 'reviewer',
  researcher = 'researcher',
  tester = 'tester',
  debugger = 'debugger',
  architect = 'architect',
  documenter = 'documenter',
  refactorer = 'refactorer',
}

export interface AgentConfig {
  agentRole?: AgentRole;
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  tools: ToolRegistration[];
  maxTurns?: number;
  temperature?: number;
  maxTokens?: number;
  maxContextTokens?: number;
  isSubAgent?: boolean;
  parentAgentId?: string;
  planMode?: boolean;
  cwd?: string;
  thinking?: {
    enabled: boolean;
    budgetTokens: number;
  };
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
  updateConfig(updates: Partial<AgentConfig>): void;
  clearMessages(): void;
}
