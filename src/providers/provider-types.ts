import type { UnifiedMessage, StreamDelta, StopReason } from '../core/message-types.js';

export type ProviderName =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'xai'
  | 'bedrock'
  | 'moonshot'
  | 'openai-compatible';

export interface ModelCapabilities {
  streaming: boolean;
  toolUse: boolean;
  vision: boolean;
  jsonMode: boolean;
  systemPrompt: boolean;
  caching: boolean;
  extendedThinking: boolean;
  maxContextWindow: number;
  maxOutputTokens: number;
}

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion?: number;
  cacheWritePerMillion?: number;
}

export interface ModelInfo {
  id: string;
  provider: ProviderName;
  displayName: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  aliases?: string[];
  fixedTemperature?: number;
}

export interface ProviderInitConfig {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export type JsonSchema = Record<string, unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface CompletionRequest {
  messages: UnifiedMessage[];
  model: string;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  topP?: number;
  stream: boolean;
  thinking?: {
    enabled: boolean;
    budgetTokens: number;
    effort?: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface CompletionResponse {
  message: UnifiedMessage;
  stopReason: StopReason;
  usage: TokenUsage;
}

export interface LLMProvider {
  readonly name: ProviderName;
  readonly displayName: string;

  initialize(config: ProviderInitConfig): Promise<void>;
  isAvailable(): boolean;
  listModels(): ModelInfo[];
  getModelInfo(modelId: string): ModelInfo | undefined;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta>;
  countTokens(messages: UnifiedMessage[], model: string): Promise<number>;
  formatTools(tools: ToolDefinition[]): unknown;
  formatMessages(messages: UnifiedMessage[]): unknown;
}
