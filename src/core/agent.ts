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
import { CONTEXT_COMPRESSION_THRESHOLD, RECENT_MESSAGES_TO_KEEP, DEFAULT_MAX_CONTEXT_TOKENS } from '../constants.js';

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
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests') || lowerMsg.includes('overload')) {
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

  if (message.includes('tool_use.id') || message.includes('String should match pattern')) {
    return `${context}${message}. Suggestion: The conversation history contains tool call IDs from a previous model that are incompatible with this provider. Start a new conversation to resolve this.`;
  }

  return `${context}${message}`;
}

/**
 * Truncate oversized tool_result blocks in-place to reduce token usage during compression.
 * Keeps the first 4000 + last 2000 characters of each result, inserting a marker in the middle.
 * This targets the primary source of token bloat: file reads, bash output, and search results.
 */
function truncateToolResults(messages: UnifiedMessage[], maxChars = 6000): UnifiedMessage[] {
  return messages.map(msg => {
    if (msg.role !== 'user') return msg;
    const blocks = Array.isArray(msg.content) ? msg.content : null;
    if (!blocks) return msg;
    const truncated = blocks.map((block: ContentBlock) => {
      if (block.type !== 'tool_result') return block;
      const tr = block as ToolResultBlock;
      const content = typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content);
      if (content.length <= maxChars) return block;
      const head = content.slice(0, 4000);
      const tail = content.slice(-2000);
      const removed = content.length - maxChars;
      return { ...tr, content: `${head}\n...[truncated ${removed} chars]...\n${tail}` };
    });
    return { ...msg, content: truncated };
  });
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

    // Sanitize message history: scan for any assistant message whose tool_calls lack matching
    // tool result messages. This can happen mid-history (not just at the end) when a turn was
    // interrupted after the tool call was appended but before the result came back.
    // Truncate at the first broken position to give the model the cleanest possible context.
    {
      let cutAt = -1;
      for (let i = 0; i < this._messages.length; i++) {
        const msg = this._messages[i];
        if (msg.role !== 'assistant') continue;
        const toolCalls = getToolUseBlocks(msg);
        if (toolCalls.length === 0) continue;

        const next = this._messages[i + 1];
        if (next?.role === 'user') {
          const resultIds = new Set(getToolResultBlocks(next).map(r => r.toolUseId));
          if (toolCalls.every(tc => resultIds.has(tc.id))) continue; // all resolved
        }

        // Found an assistant with unresolved tool_calls — truncate from here
        cutAt = i;
        break;
      }
      if (cutAt >= 0) {
        this._messages = this._messages.slice(0, cutAt);
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

      // Auto-compress context if approaching the model's token limit.
      // Derive effective limits from the model registry so we respect each model's
      // actual context window rather than relying solely on the global config value.
      const modelInfo = this.config.provider.getModelInfo(this.config.model);
      const modelMaxContext = modelInfo?.capabilities?.maxContextWindow;
      const modelMaxOutput = modelInfo?.capabilities?.maxOutputTokens ?? 8192;
      // Reserve space for the model's output; this is the usable input ceiling.
      const modelEffectiveLimit = modelMaxContext ? modelMaxContext - modelMaxOutput : undefined;
      try {
        const currentTokens = await this.getTokenCount();
        const thresholdValue = this.config.contextCompressionThreshold ?? CONTEXT_COMPRESSION_THRESHOLD;
        // Trigger compression when tokens exceed the configured percentage of the model's hard limit.
        const exceedsModelLimit = modelEffectiveLimit !== undefined && currentTokens > modelEffectiveLimit * thresholdValue;
        if (exceedsModelLimit) {
          const before = currentTokens;
          await this.compressContext();

          // If still over the limit after the first pass, retry up to 2 more
          // times with progressively fewer retained messages until we fit.
          const originalKeep = this.config.contextRecentMessagesToKeep ?? RECENT_MESSAGES_TO_KEEP;
          let retries = 0;
          while (retries < 2) {
            const afterTokens = await this.getTokenCount();
            if (afterTokens <= modelEffectiveLimit * 0.95) break;
            this.config.contextRecentMessagesToKeep = Math.max(2, originalKeep - 2 * (retries + 1));
            await this.compressContext();
            retries++;
          }
          // Restore so future turns use the configured setting
          this.config.contextRecentMessagesToKeep = originalKeep;

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

      // Build the tools list
      const tools = this.config.tools
        .filter(t => t.enabled)
        .map(t => ({
          name: t.tool.name,
          description: t.tool.description,
          inputSchema: t.tool.inputSchema,
        }));

      // Resolve extended thinking if model supports it (modelInfo already fetched above)
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

      // Execute tool calls and add results.
      // IMPORTANT: tool results are always pushed to _messages even if a tool throws or the
      // agent is aborted mid-execution. Without this guarantee, _messages ends up with an
      // orphaned assistant message (tool_calls with no matching tool results), which causes
      // strict APIs like Moonshot/Kimi to reject subsequent requests.
      const toolResultBlocks: ContentBlock[] = [];
      let toolExecutionAborted = false;
      for (const toolCall of toolCalls) {
        yield {
          type: 'tool_call_start',
          toolName: toolCall.name,
          toolId: toolCall.id,
          input: toolCall.input,
        };

        let result: { content: string; isError?: boolean; contentBlocks?: ContentBlock[] };
        try {
          result = await this.toolRunner.execute(
            toolCall.name,
            toolCall.id,
            toolCall.input,
            {
              cwd: this.config.cwd || process.cwd(),
              workspacePaths: this.config.workspacePaths,
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
        } catch (execError) {
          // Execution threw (e.g. AbortError or unexpected failure). Record a placeholder
          // result so _messages stays consistent with no orphaned tool_calls.
          const isAborted = this.abortController.signal.aborted;
          result = {
            content: isAborted
              ? '[Tool execution interrupted by user]'
              : `[Tool execution error: ${(execError as Error)?.message ?? String(execError)}]`,
            isError: true,
          };
          if (isAborted) toolExecutionAborted = true;
        }

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

        // Stop executing further tools if aborted
        if (toolExecutionAborted) break;
      }

      // Always add tool results as a user message so _messages is never left with an
      // orphaned assistant message. This must happen even on abort or partial failure.
      const toolResultMsg: UnifiedMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: toolResultBlocks,
        timestamp: Date.now(),
      };
      this._messages.push(toolResultMsg);

      // Yield event so UI can display tool results in correct order
      yield { type: 'tool_results_complete', message: toolResultMsg };

      // Stop the agent loop if execution was aborted
      if (toolExecutionAborted) break;

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

    if (this._messages.length <= minMessagesBeforeCompress) {
      // Not enough messages to summarize, but we can still truncate large tool results
      this._messages = truncateToolResults(this._messages);
      return;
    }

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
    // Also truncate large tool results in the retained window to prevent them from
    // individually exceeding the model's token budget.
    this._messages = [summaryMsg, ...truncateToolResults(recentMessages)];
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
