import type { Agent, AgentConfig, AgentEvent } from './agent-types.js';
import type {
  UnifiedMessage,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlock,
  StreamDelta,
  TextBlock,
} from './message-types.js';
import { getTextContent, getToolUseBlocks, getToolResultBlocks } from './message-types.js';
import type { ToolRunner } from '../tools/tool-runner.js';
import type { CostTracker, CostTrackerConfig } from './cost-tracker.js';
import type { TokenUsage } from '../providers/provider-types.js';
import { CONTEXT_COMPRESSION_THRESHOLD, RECENT_MESSAGES_TO_KEEP } from '../constants.js';

export interface AgentLimitCheck {
  check: () => Promise<{ allowed: boolean; warning?: string; percentage: number }>;
  onLimitWarning?: (percentage: number) => void;
  onLimitExceeded?: () => void;
}

/**
 * Helper to enhance error messages with actionable context
 */
function enhanceErrorMessage(error: Error, model?: string): string {
  const message = error.message || '';
  const lowerMsg = message.toLowerCase();
  const context = model ? `[Model: ${model}] ` : '';

  // Check for specific error patterns and add suggestions
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests')) {
    return `${context}${message}. Suggestion: Wait a moment and try again, or switch to a different model.`;
  }
  
  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('api key') || lowerMsg.includes('authentication')) {
    return `${context}${message}. Suggestion: Check your API key in Settings > Providers.`;
  }

  if (lowerMsg.includes('model') && (lowerMsg.includes('not found') || lowerMsg.includes('not supported'))) {
    return `${context}${message}. Suggestion: Try a different model in Settings > Providers.`;
  }

  if (lowerMsg.includes('context length') || lowerMsg.includes('token') && lowerMsg.includes('exceed')) {
    return `${context}${message}. Suggestion: Try clearing conversation history or use a model with larger context window.`;
  }

  if (lowerMsg.includes('network') || lowerMsg.includes('connection') || lowerMsg.includes('timeout')) {
    return `${context}${message}. Suggestion: Check your internet connection and try again.`;
  }

  return `${context}${message}`;
}

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

  async *run(userMessage: string | ContentBlock[]): AsyncIterable<AgentEvent> {
    // Check monthly limit before processing
    if (this.config.limitCheck) {
      const limitResult = await this.config.limitCheck.check();
      if (!limitResult.allowed) {
        yield {
          type: 'error',
          error: new Error(`Monthly spend limit exceeded (${limitResult.percentage.toFixed(0)}%). Please increase your limit or try again next month.`),
        };
        return;
      }
      if (limitResult.warning) {
        yield {
          type: 'cost_update',
          totalCost: 0,
          turnCost: 0,
        } as any; // Will be extended with warning
      }
    }

    // Add user message — supports plain text or multi-part content blocks (e.g. text + images)
    const userMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    this._messages.push(userMsg);

    let turns = 0;
    // Preserve null as unlimited (no turn limit), only default to 50 for undefined
    const maxTurns = this.config.maxTurns !== undefined ? this.config.maxTurns : 50;

    while (maxTurns === null || turns < maxTurns) {
      turns++;

      // Auto-compress context if approaching token limit
      const maxCtx = this.config.maxContextTokens;
      if (maxCtx && this._messages.length > 10) {
        try {
          const currentTokens = await this.getTokenCount();
          // Use configurable threshold, falling back to default
          const thresholdValue = this.config.contextCompressionThreshold ?? CONTEXT_COMPRESSION_THRESHOLD;
          const threshold = maxCtx * thresholdValue;
          if (currentTokens > threshold) {
            const before = currentTokens;
            await this.compressContext();
            const after = await this.getTokenCount();
            yield {
              type: 'context_compressed',
              removedTokens: before - after,
              remainingTokens: after,
            };
          }
        } catch {
          // Token counting may fail; skip compression
        }
      }

      // Build the tools list
      const tools = this.config.tools
        .filter(t => t.enabled)
        .map(t => ({
          name: t.tool.name,
          description: t.tool.description,
          inputSchema: t.tool.inputSchema,
        }));

      // Resolve extended thinking if model supports it
      const modelInfo = this.config.provider.getModelInfo(this.config.model);
      const thinkingConfig = this.config.thinking?.enabled && modelInfo?.capabilities.extendedThinking
        ? this.config.thinking
        : undefined;

      // Debug: Log thinking configuration details
      console.log('[AgentImpl:run] Thinking configuration:', {
        model: this.config.model,
        provider: this.config.provider.name,
        configThinkingEnabled: this.config.thinking?.enabled,
        modelSupportsExtendedThinking: modelInfo?.capabilities.extendedThinking,
        thinkingConfigWillBeSent: !!thinkingConfig,
        thinkingBudgetTokens: thinkingConfig?.budgetTokens,
        modelInfoFound: !!modelInfo,
        modelId: modelInfo?.id,
        modelAliases: modelInfo?.aliases,
      });

      // Call the LLM (streaming)
      const request = {
        messages: this._messages,
        model: this.config.model,
        systemPrompt: this.config.systemPrompt,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        stream: true as const,
        thinking: thinkingConfig,
      };

      // Debug: Log messages being sent to provider
      console.log('[AgentImpl:run] Sending request to provider:', {
        provider: this.config.provider.name,
        model: this.config.model,
        hasThinkingConfig: !!thinkingConfig,
        messageCount: this._messages.length,
        messages: this._messages.map(m => ({
          id: m.id,
          role: m.role,
          contentType: typeof m.content,
          hasContentBlocks: Array.isArray(m.content),
          contentBlocksTypes: Array.isArray(m.content) ? m.content.map((c: any) => c.type).join(', ') : 'N/A',
        })),
      });

      const assistantContent: ContentBlock[] = [];
      let textBuffer = '';
      let thinkingBuffer = '';
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

            case 'thinking':
              thinkingBuffer += delta.text || '';
              console.log(`[AgentImpl:run] Received thinking delta, buffer length now: ${thinkingBuffer.length}`);
              // Emit thinking delta for real-time display in renderer
              yield { type: 'thinking_delta', text: delta.text || '', accumulated: thinkingBuffer };
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
              {
                const targetToolId = delta.toolUse?.id || activeToolId;
                if (!targetToolId || !delta.toolUse?.inputDelta) {
                  break;
                }

                const buf = toolCallBuffers.get(targetToolId);
                if (buf) {
                  buf.inputJson += delta.toolUse.inputDelta;
                }
              }
              break;

            case 'tool_use_end':
              if (delta.toolUse?.id) {
                if (activeToolId === delta.toolUse.id) {
                  activeToolId = undefined;
                }
              } else {
                activeToolId = undefined;
              }
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
              {
                const streamError = delta.error || new Error('Unknown streaming error');
                // Enhance error with context if it's a model/provider error
                const enhancedMessage = enhanceErrorMessage(streamError, this.config.model); 
                yield { type: 'error', error: new Error(enhancedMessage) };
                return;
              }
          }
        }
      } catch (error) {
        const errorMessage = (error as Error)?.message || String(error);
        console.error('[AgentImpl:run] Stream error:', errorMessage);

        // Check if this is a "thinking not supported" error - retry without thinking
        if (thinkingConfig && errorMessage.includes('thinking is not supported')) {
          console.log('[AgentImpl:run] Model does not support thinking, retrying without thinking configuration...');
          // Retry without thinking - this will disable thinking for this request
          const retryRequest = {
            ...request,
            thinking: undefined,
          };
          try {
            for await (const delta of this.config.provider.streamComplete(retryRequest)) {
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
                  {
                    const targetToolId = delta.toolUse?.id || activeToolId;
                    if (!targetToolId || !delta.toolUse?.inputDelta) {
                      break;
                    }
                    const buf = toolCallBuffers.get(targetToolId);
                    if (buf) {
                      buf.inputJson += delta.toolUse.inputDelta;
                    }
                  }
                  break;
                case 'tool_use_end':
                  if (activeToolId) {
                    activeToolId = undefined;
                  }
                  break;
                case 'usage':
                  if (delta.usage) {
                    usage.inputTokens += delta.usage.inputTokens || 0;
                    usage.outputTokens += delta.usage.outputTokens || 0;
                  }
                  break;
                case 'error':
                  {
                    const streamError = delta.error || new Error('Unknown streaming error');
                    const enhancedMessage = enhanceErrorMessage(streamError, this.config.model);
                    yield { type: 'error', error: new Error(enhancedMessage) };
                    return;
                  }
              }
            }
            // Continue to message assembly below
          } catch (retryError) {
            const enhancedMessage = enhanceErrorMessage(retryError as Error, this.config.model);
            yield { type: 'error', error: new Error(enhancedMessage) };
            return;
          }
        } else {
          const enhancedMessage = enhanceErrorMessage(error as Error, this.config.model);
          yield { type: 'error', error: new Error(enhancedMessage) };
          return;
        }
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
        ...(thinkingBuffer ? { reasoning: thinkingBuffer } : {}),
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

      // Debug: Log turn completion with reasoning status
      console.log('[AgentImpl:run] Turn complete:', {
        messageId: assistantMsg.id,
        hasReasoning: !!thinkingBuffer,
        reasoningLength: thinkingBuffer?.length || 0,
        hasToolCalls,
        contentLength: typeof assistantMsg.content === 'string'
          ? assistantMsg.content.length
          : JSON.stringify(assistantMsg.content).length,
      });

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
            cwd: this.config.cwd || process.cwd(),
            sessionId: this.id,
            abortSignal: this.abortController.signal,
            eventBus: this.toolRunner.getEventBus(),
            spawnSubAgent: async (task: string): Promise<string> => {
              const subAgent = this.spawnSubAgent({});
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

        // Build tool result content — include image blocks if present
        const resultContent: string | ContentBlock[] = result.contentBlocks
          ? [
              ...(result.content ? [{ type: 'text' as const, text: result.content }] : []),
              ...result.contentBlocks,
            ]
          : result.content;

        toolResultBlocks.push({
          type: 'tool_result',
          toolUseId: toolCall.id,
          content: resultContent,
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

      // Yield event so UI can display tool results in correct order
      yield { type: 'tool_results_complete', message: toolResultMsg };

      // Loop back to let the LLM process tool results
    }

    if (maxTurns !== null && turns >= maxTurns) {
      yield {
        type: 'error',
        error: new Error(`Agent reached maximum turns (${maxTurns}). Stopping.`),
      };
    }
  }

  addMessage(message: UnifiedMessage): void {
    this._messages.push(message);
  }

  restoreHistory(messages: UnifiedMessage[]): void {
    this._messages = [...messages];
  }

  async compressContext(): Promise<void> {
    // Smart compression: try LLM-powered summarization, fall back to simple truncation
    // Use configurable values, falling back to defaults
    const recentMessagesToKeep = this.config.contextRecentMessagesToKeep ?? RECENT_MESSAGES_TO_KEEP;
    const minMessagesBeforeCompress = recentMessagesToKeep + 4; // Need some messages to compress

    if (this._messages.length <= minMessagesBeforeCompress) return;

    const firstMsg = this._messages[0];

    // Find a safe cut point that preserves tool_call / tool_result pairing.
    // Strict APIs (Moonshot/Kimi, xAI) reject messages where a role:"tool"
    // message references a tool_call_id not present in any preceding assistant.
    let keepFrom = this._messages.length - recentMessagesToKeep;
    if (keepFrom < 1) keepFrom = 1;

    // Walk backwards to ensure keepFrom doesn't land on an orphaned tool_result
    while (keepFrom > 1) {
      const candidate = this._messages[keepFrom];
      if (candidate.role === 'user' && getToolResultBlocks(candidate).length > 0) {
        keepFrom--;
      } else {
        break;
      }
    }

    // Extra safety: verify every tool_result in the retained window has a matching
    // tool_call. If not, keep backing up to include the missing assistant message.
    while (keepFrom > 1) {
      const retained = this._messages.slice(keepFrom);
      const toolCallIds = new Set<string>();
      for (const msg of retained) {
        if (msg.role === 'assistant') {
          for (const tc of getToolUseBlocks(msg)) { toolCallIds.add(tc.id); }
        }
      }
      let orphanFound = false;
      for (const msg of retained) {
        if (msg.role === 'user') {
          for (const tr of getToolResultBlocks(msg)) {
            if (!toolCallIds.has(tr.toolUseId)) { orphanFound = true; break; }
          }
        }
        if (orphanFound) break;
      }
      if (!orphanFound) break;
      keepFrom--;
    }

    const recentMessages = this._messages.slice(keepFrom);
    const oldMessages = this._messages.slice(1, keepFrom);
    const removedCount = oldMessages.length;

    let summaryText = `[Context compressed: ${removedCount} messages removed. Keeping recent context.]`;

    // Attempt LLM-powered summary of removed messages
    try {
      const oldContent = oldMessages.map(m => {
        const text = typeof m.content === 'string' ? m.content : getTextContent(m);
        return `[${m.role}]: ${text.substring(0, 500)}`;
      }).join('\n');

      if (oldContent.length > 100) {
        const summaryRequest = {
          messages: [{
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: `Summarize the following conversation context concisely, focusing on key decisions, files modified, and current task state. Keep it under 500 words:\n\n${oldContent.substring(0, 8000)}`,
            timestamp: Date.now(),
          }],
          model: this.config.model,
          systemPrompt: 'You are a conversation summarizer. Be concise and focus on actionable context.',
          temperature: 0.3,
          maxTokens: 1000,
          stream: false as const,
        };

        let responseText = '';
        for await (const delta of this.config.provider.streamComplete(summaryRequest)) {
          if (delta.type === 'text' && delta.text) {
            responseText += delta.text;
          }
        }

        if (responseText.length > 50) {
          summaryText = `## Compressed Context Summary\n${responseText}\n\n[${removedCount} messages compressed into this summary]`;
        }
      }
    } catch {
      // Fall back to simple compression
    }

    const summaryMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: summaryText,
      timestamp: Date.now(),
    };

    // Note: firstMsg is intentionally excluded here. Keeping it would create two
    // consecutive user messages ([firstMsg, summaryMsg]) which is invalid for all
    // OpenAI-compatible APIs and causes a 400 "no body" error.
    // The summary already captures the context from the first message.
    this._messages = [summaryMsg, ...recentMessages];
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

  updateConfig(updates: Partial<AgentConfig>): void {
    Object.assign(this.config, updates);
  }

  clearMessages(): void {
    this._messages = [];
  }
}
