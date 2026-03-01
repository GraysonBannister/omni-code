import type { Agent, AgentConfig, AgentEvent } from './agent-types.js';
import type {
  UnifiedMessage,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlock,
  StreamDelta,
  TextBlock,
} from './message-types.js';
import { getTextContent } from './message-types.js';
import type { ToolRunner } from '../tools/tool-runner.js';
import type { CostTracker } from './cost-tracker.js';
import type { TokenUsage } from '../providers/provider-types.js';

export class AgentImpl implements Agent {
  readonly id: string;
  readonly config: AgentConfig;
  private _messages: UnifiedMessage[] = [];
  private abortController = new AbortController();
  private toolRunner: ToolRunner;
  private costTracker: CostTracker;

  constructor(
    config: AgentConfig,
    toolRunner: ToolRunner,
    costTracker: CostTracker,
    existingMessages?: UnifiedMessage[],
  ) {
    this.id = crypto.randomUUID();
    this.config = config;
    this._messages = existingMessages || [];
    this.toolRunner = toolRunner;
    this.costTracker = costTracker;
  }

  get messages(): UnifiedMessage[] {
    return [...this._messages];
  }

  async *run(userMessage: string): AsyncIterable<AgentEvent> {
    // Add user message
    const userMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    this._messages.push(userMsg);

    let turns = 0;
    const maxTurns = this.config.maxTurns || 25;

    while (turns < maxTurns) {
      turns++;

      // Build the tools list (respecting plan mode)
      const tools = this.config.tools
        .filter(t => t.enabled && (!this.config.planMode || t.tool.availableInPlanMode))
        .map(t => ({
          name: t.tool.name,
          description: t.tool.description,
          inputSchema: t.tool.inputSchema,
        }));

      // Call the LLM (streaming)
      const request = {
        messages: this._messages,
        model: this.config.model,
        systemPrompt: this.config.systemPrompt,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        stream: true as const,
      };

      const assistantContent: ContentBlock[] = [];
      let textBuffer = '';
      const toolCallBuffers = new Map<string, { id: string; name: string; inputJson: string }>();
      let activeToolId: string | undefined;
      const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
      let hasToolCalls = false;

      try {
        for await (const delta of this.config.provider.streamComplete(request)) {
          if (this.abortController.signal.aborted) break;

          yield { type: 'stream_delta', delta };

          switch (delta.type) {
            case 'text':
              textBuffer += delta.text || '';
              break;

            case 'tool_use_start':
              if (delta.toolUse?.id && delta.toolUse?.name) {
                activeToolId = delta.toolUse.id;
                toolCallBuffers.set(delta.toolUse.id, {
                  id: delta.toolUse.id,
                  name: delta.toolUse.name,
                  inputJson: '',
                });
                hasToolCalls = true;
              }
              break;

            case 'tool_use_delta':
              if (activeToolId && delta.toolUse?.inputDelta) {
                const buf = toolCallBuffers.get(activeToolId);
                if (buf) {
                  buf.inputJson += delta.toolUse.inputDelta;
                }
              }
              break;

            case 'tool_use_end':
              activeToolId = undefined;
              break;

            case 'usage':
              if (delta.usage) {
                usage.inputTokens += delta.usage.inputTokens;
                usage.outputTokens += delta.usage.outputTokens;
                if (delta.usage.cacheReadTokens) {
                  usage.cacheReadTokens = (usage.cacheReadTokens || 0) + delta.usage.cacheReadTokens;
                }
                if (delta.usage.cacheWriteTokens) {
                  usage.cacheWriteTokens = (usage.cacheWriteTokens || 0) + delta.usage.cacheWriteTokens;
                }
              }
              break;

            case 'error':
              yield { type: 'error', error: delta.error || new Error('Unknown streaming error') };
              return;
          }
        }
      } catch (error) {
        yield { type: 'error', error: error as Error };
        return;
      }

      // Assemble the assistant message
      if (textBuffer) {
        assistantContent.push({ type: 'text', text: textBuffer } as TextBlock);
      }

      const toolCalls: ToolUseBlock[] = [];
      for (const [, buf] of toolCallBuffers) {
        let parsedInput: Record<string, unknown> = {};
        try {
          parsedInput = buf.inputJson ? JSON.parse(buf.inputJson) : {};
        } catch {
          parsedInput = { _raw: buf.inputJson };
        }
        const toolUse: ToolUseBlock = {
          type: 'tool_use',
          id: buf.id,
          name: buf.name,
          input: parsedInput,
        };
        assistantContent.push(toolUse);
        toolCalls.push(toolUse);
      }

      const assistantMsg: UnifiedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent.length === 1 && assistantContent[0].type === 'text'
          ? (assistantContent[0] as TextBlock).text
          : assistantContent,
        timestamp: Date.now(),
        metadata: {
          model: this.config.model,
          provider: this.config.provider.name,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens,
          cacheWriteTokens: usage.cacheWriteTokens,
          stopReason: hasToolCalls ? 'tool_use' : 'end_turn',
        },
      };
      this._messages.push(assistantMsg);

      // Track cost
      const turnCost = this.costTracker.calculateCost(this.config.model, usage);
      yield { type: 'cost_update', totalCost: this.costTracker.totalCost, turnCost };
      yield { type: 'turn_complete', message: assistantMsg };

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        break;
      }

      // Execute tool calls and add results
      const toolResultBlocks: ContentBlock[] = [];
      for (const toolCall of toolCalls) {
        yield {
          type: 'tool_call_start',
          toolName: toolCall.name,
          toolId: toolCall.id,
          input: toolCall.input,
        };

        const result = await this.toolRunner.execute(
          toolCall.name,
          toolCall.id,
          toolCall.input,
          {
            cwd: process.cwd(),
            sessionId: this.id,
            planMode: this.config.planMode || false,
            abortSignal: this.abortController.signal,
            spawnSubAgent: async (task: string, planMode: boolean): Promise<string> => {
              const subAgent = this.spawnSubAgent({ planMode });
              let subResult = '';
              for await (const event of subAgent.run(task)) {
                if (event.type === 'turn_complete') {
                  subResult = getTextContent(event.message);
                }
              }
              return subResult;
            },
          },
        );

        yield {
          type: 'tool_call_end',
          toolName: toolCall.name,
          toolId: toolCall.id,
          result,
        };

        toolResultBlocks.push({
          type: 'tool_result',
          toolUseId: toolCall.id,
          content: result.content,
          isError: result.isError,
        } as ToolResultBlock);
      }

      // Add tool results as a user message
      const toolResultMsg: UnifiedMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: toolResultBlocks,
        timestamp: Date.now(),
      };
      this._messages.push(toolResultMsg);

      // Loop back to let the LLM process tool results
    }

    if (turns >= maxTurns) {
      yield {
        type: 'error',
        error: new Error(`Agent reached maximum turns (${maxTurns}). Stopping.`),
      };
    }
  }

  addMessage(message: UnifiedMessage): void {
    this._messages.push(message);
  }

  async compressContext(): Promise<void> {
    // Simple compression: keep system-like context + last N messages
    if (this._messages.length <= 10) return;

    const firstMsg = this._messages[0];
    const recentMessages = this._messages.slice(-6);
    const removedCount = this._messages.length - 7;

    const summaryMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `[Context compressed: ${removedCount} messages removed. Keeping recent context.]`,
      timestamp: Date.now(),
    };

    this._messages = [firstMsg, summaryMsg, ...recentMessages];
  }

  async getTokenCount(): Promise<number> {
    return this.config.provider.countTokens(this._messages, this.config.model);
  }

  abort(): void {
    this.abortController.abort();
  }

  spawnSubAgent(overrides: Partial<AgentConfig>): Agent {
    const subConfig: AgentConfig = {
      ...this.config,
      ...overrides,
      isSubAgent: true,
      parentAgentId: this.id,
    };

    return new AgentImpl(subConfig, this.toolRunner, this.costTracker);
  }
}
