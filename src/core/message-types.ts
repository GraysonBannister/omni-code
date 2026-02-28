export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    mediaType: string;
    data: string;
  };
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  toolUseId: string;
  content: string | ContentBlock[];
  isError?: boolean;
}

export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;

export type StopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error';

export interface MessageMetadata {
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  latencyMs?: number;
  stopReason?: StopReason;
  cost?: number;
}

export interface UnifiedMessage {
  id: string;
  role: MessageRole;
  content: string | ContentBlock[];
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface StreamDelta {
  type: 'text' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_end' | 'usage' | 'error' | 'done';
  text?: string;
  toolUse?: {
    id?: string;
    name?: string;
    inputDelta?: string;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  error?: Error;
}

// Helper functions

export function getTextContent(message: UnifiedMessage): string {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((b): b is TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
}

export function getToolUseBlocks(message: UnifiedMessage): ToolUseBlock[] {
  if (typeof message.content === 'string') return [];
  return message.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
}

export function getToolResultBlocks(message: UnifiedMessage): ToolResultBlock[] {
  if (typeof message.content === 'string') return [];
  return message.content.filter((b): b is ToolResultBlock => b.type === 'tool_result');
}

export function createTextMessage(
  role: MessageRole,
  text: string,
  metadata?: MessageMetadata,
): UnifiedMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content: text,
    timestamp: Date.now(),
    metadata,
  };
}
