import type { AgentRole } from '../agent-types.js';

/** Capability tags used to match tasks to specialized agents */
export type AgentCapability =
  | 'code_read'
  | 'code_write'
  | 'code_review'
  | 'testing'
  | 'debugging'
  | 'architecture'
  | 'research'
  | 'documentation'
  | 'refactoring';

/** Complexity classification for a user prompt */
export type TaskComplexity = 'simple' | 'moderate' | 'complex';

/** Model preference hint */
export type ModelPreference = 'cheap' | 'powerful';

/** Result of analyzing a user prompt */
export interface TaskAnalysis {
  complexity: TaskComplexity;
  shouldOrchestrate: boolean;
  capabilities: AgentCapability[];
  estimatedAgentCount: number;
  reasoning: string;
}

/** A single sub-task in a decomposed task graph */
export interface SubTask {
  id: string;
  description: string;
  capability: AgentCapability;
  dependencies: string[];
  context?: string;
}

/** DAG of sub-tasks produced by decomposition */
export interface TaskGraph {
  tasks: SubTask[];
  originalPrompt: string;
}

/** Specification for a specialized agent type */
export interface AgentSpec {
  capability: AgentCapability;
  role: AgentRole;
  planMode: boolean;
  temperature: number;
  modelPreference: ModelPreference;
  systemPromptSuffix: string;
  /** Tool name prefixes to include. Empty = all tools. */
  toolFilter: 'all' | 'read_only' | 'research_only';
}

/** Result from a completed agent execution */
export interface AgentResult {
  taskId: string;
  capability: AgentCapability;
  output: string;
  success: boolean;
  error?: string;
  tokenUsage: { inputTokens: number; outputTokens: number };
  durationMs: number;
}

/** Orchestration configuration */
export interface OrchestrationConfig {
  enabled: boolean;
  maxConcurrentAgents: number;
  maxTotalAgents: number;
  costBudget?: number;
  analysisModel?: string;
  analysisProvider?: string;
  forceOrchestrate: boolean;
  forceSingleAgent: boolean;
  agentOverrides: Record<string, {
    temperature?: number;
    preferredModel?: string;
    maxTurns?: number | null;
  }>;
}

/** Events emitted during orchestration */
export interface OrchestrationTaskStartEvent {
  type: 'orchestration_task_start';
  taskId: string;
  description: string;
  capability: AgentCapability;
}

export interface OrchestrationTaskEndEvent {
  type: 'orchestration_task_end';
  taskId: string;
  success: boolean;
  durationMs: number;
}

export interface OrchestrationAnalysisEvent {
  type: 'orchestration_analysis';
  analysis: TaskAnalysis;
}

export interface OrchestrationSynthesisEvent {
  type: 'orchestration_synthesis';
  summary: string;
}
