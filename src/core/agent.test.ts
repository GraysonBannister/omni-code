import { describe, expect, it } from 'vitest';
import { AgentImpl } from './agent.js';
import type { AgentEvent } from './agent-types.js';
import type { CompletionRequest, CompletionResponse, LLMProvider, ModelInfo, TokenUsage } from '../providers/provider-types.js';
import type { UnifiedMessage, StreamDelta } from './message-types.js';

class MockProvider implements LLMProvider {
  readonly name = 'openai';
  readonly displayName = 'Mock';
  private callCount = 0;

  async initialize(): Promise<void> {}
  isAvailable(): boolean { return true; }
  listModels(): ModelInfo[] { return []; }
  getModelInfo(): ModelInfo | undefined {
    return {
      id: 'mock-model',
      provider: 'openai',
      displayName: 'Mock Model',
      capabilities: {
        streaming: true,
        toolUse: true,
        vision: false,
        jsonMode: true,
        systemPrompt: true,
        caching: false,
        extendedThinking: false,
        maxContextWindow: 128000,
        maxOutputTokens: 8192,
      },
      pricing: { inputPerMillion: 0, outputPerMillion: 0 },
    };
  }

  async complete(): Promise<CompletionResponse> {
    throw new Error('Not used in test');
  }

  async *streamComplete(_request: CompletionRequest): AsyncIterable<StreamDelta> {
    if (this.callCount === 0) {
      this.callCount += 1;
      yield { type: 'tool_use_start', toolUse: { id: 'read-1', name: 'Read' } };
      yield { type: 'tool_use_delta', toolUse: { id: 'read-1', inputDelta: '{"file_path":"' } };
      yield { type: 'tool_use_start', toolUse: { id: 'write-1', name: 'Write' } };
      yield {
        type: 'tool_use_delta',
        toolUse: {
          id: 'write-1',
          inputDelta: '{"file_path":"/tmp/write.txt","content":"done"}',
        },
      };
      yield {
        type: 'tool_use_delta',
        toolUse: { id: 'read-1', inputDelta: '/tmp/read.txt"}' },
      };
      yield { type: 'tool_use_end', toolUse: { id: 'write-1' } };
      yield { type: 'tool_use_end', toolUse: { id: 'read-1' } };
      yield { type: 'done' };
      return;
    }

    yield { type: 'text', text: 'All done.' };
    yield { type: 'done' };
  }

  async countTokens(_messages: UnifiedMessage[], _model: string): Promise<number> {
    return 0;
  }

  formatTools(): unknown[] { return []; }
  formatMessages(): unknown[] { return []; }
}

describe('AgentImpl tool argument assembly', () => {
  it('keeps interleaved tool deltas attached to the correct tool id', async () => {
    const provider = new MockProvider();
    const executedInputs: Array<{ toolName: string; input: Record<string, unknown> }> = [];

    const toolRunner = {
      async execute(toolName: string, _toolId: string, input: Record<string, unknown>) {
        executedInputs.push({ toolName, input });
        return { content: `${toolName} ok` };
      },
    };

    const costTracker = {
      totalCost: 0,
      calculateCost: (_model: string, _usage: TokenUsage) => 0,
    };

    const agent = new AgentImpl(
      {
        provider,
        model: 'mock-model',
        systemPrompt: 'test',
        tools: [],
        cwd: process.cwd(),
      },
      toolRunner as any,
      costTracker as any,
    );

    const events: AgentEvent[] = [];
    for await (const event of agent.run('Use tools')) {
      events.push(event);
    }

    expect(events.some(event => event.type === 'tool_call_end')).toBe(true);
    expect(executedInputs).toEqual([
      {
        toolName: 'Read',
        input: { file_path: '/tmp/read.txt' },
      },
      {
        toolName: 'Write',
        input: { file_path: '/tmp/write.txt', content: 'done' },
      },
    ]);
  });
});
