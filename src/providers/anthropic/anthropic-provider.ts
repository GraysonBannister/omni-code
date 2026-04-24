import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ToolDefinition,
} from '../provider-types.js';
import type { UnifiedMessage, StreamDelta, ContentBlock, ToolUseBlock, TextBlock } from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic' as const;
  readonly displayName = 'Anthropic';
  private client!: Anthropic;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('anthropic');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60_000,
    });
  }

  listModels(): ModelInfo[] {
    return this.models;
  }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }

  formatTools(tools: ToolDefinition[]): unknown {
    return ToolCallNormalizer.toAnthropic(tools);
  }

  formatMessages(messages: UnifiedMessage[]): Anthropic.MessageParam[] {
    const idMap = this.buildToolIdMap(messages);
    return messages
      .filter(m => m.role !== 'system')
      .map(msg => this.convertMessage(msg, idMap));
  }

  /**
   * Anthropic requires tool_use IDs to match ^[a-zA-Z0-9_-]+$.
   * When history originates from another provider (e.g. after a model switch),
   * IDs may contain dots, colons, or other characters that Anthropic rejects.
   * Build a remapping table so both tool_use and tool_result references stay in sync.
   */
  private buildToolIdMap(messages: UnifiedMessage[]): Map<string, string> {
    const idMap = new Map<string, string>();
    const pattern = /^[a-zA-Z0-9_-]+$/;
    for (const msg of messages) {
      if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
      for (const block of msg.content) {
        if (block.type === 'tool_use' && !pattern.test(block.id)) {
          idMap.set(block.id, crypto.randomUUID());
        }
      }
    }
    return idMap;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const params = this.buildParams(request);
    const response = await this.client.messages.create({
      ...params,
      stream: false,
    });

    return this.parseResponse(response, request.model);
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    console.log('[AnthropicProvider] streamComplete called with model:', request.model, 'thinking:', request.thinking);
    const params = this.buildParams(request);
    console.log('[AnthropicProvider] Final params - model:', params.model, 'has thinking:', !!params.thinking, 'thinkingConfig:', params.thinking);

    const stream = this.client.messages.stream({
      ...params,
    });

    let currentToolId: string | undefined;

    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_start':
          if (event.content_block.type === 'tool_use') {
            currentToolId = event.content_block.id;
            yield {
              type: 'tool_use_start',
              toolUse: {
                id: event.content_block.id,
                name: event.content_block.name,
              },
            };
          } else if ((event.content_block as any).type === 'thinking') {
            yield { type: 'thinking', text: '' };
          }
          break;

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text };
          } else if (event.delta.type === 'input_json_delta') {
            yield {
              type: 'tool_use_delta',
              toolUse: { id: currentToolId, inputDelta: event.delta.partial_json },
            };
          } else if ((event.delta as any).type === 'thinking_delta') {
            yield { type: 'thinking', text: (event.delta as any).thinking };
          }
          break;

        case 'content_block_stop':
          if (currentToolId) {
            yield { type: 'tool_use_end', toolUse: { id: currentToolId } };
            currentToolId = undefined;
          }
          break;

        case 'message_delta':
          if (event.usage) {
            yield {
              type: 'usage',
              usage: {
                inputTokens: 0,
                outputTokens: event.usage.output_tokens,
                cacheReadTokens: event.usage.cache_read_tokens,
                cacheWriteTokens: event.usage.cache_creation_tokens,
              },
            };
          }
          break;

        case 'message_start':
          if (event.message.usage) {
            yield {
              type: 'usage',
              usage: {
                inputTokens: event.message.usage.input_tokens,
                outputTokens: 0,
                cacheReadTokens: event.message.usage.cache_read_tokens,
                cacheWriteTokens: event.message.usage.cache_creation_tokens,
              },
            };
          }
          break;

        case 'message_stop':
          yield { type: 'done' };
          break;
      }
    }
  }

  async countTokens(messages: UnifiedMessage[], model: string): Promise<number> {
    // Rough estimation: ~3 chars per token — code and tool output are denser than prose
    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else {
        for (const block of msg.content) {
          if (block.type === 'text') totalChars += block.text.length;
          else if (block.type === 'tool_use') totalChars += JSON.stringify(block.input).length;
          else if (block.type === 'tool_result') {
            totalChars += typeof block.content === 'string'
              ? block.content.length
              : JSON.stringify(block.content).length;
          }
        }
      }
    }
    return Math.ceil(totalChars / 3);
  }

  private buildParams(request: CompletionRequest): Anthropic.MessageCreateParamsNonStreaming {
    const modelInfo = this.getModelInfo(request.model);
    // Use apiId if set (thinking variants share same API model as base), then id, then raw model string
    const canonicalModelId = modelInfo?.apiId || modelInfo?.id || request.model;
    const params: any = {
      model: canonicalModelId,
      messages: this.formatMessages(request.messages),
      max_tokens: request.maxTokens ?? 8192,
    };

    if (request.systemPrompt) {
      params.system = request.systemPrompt;
    }
    if (request.tools && request.tools.length > 0) {
      params.tools = this.formatTools(request.tools);
    }
    if (request.temperature !== undefined) {
      params.temperature = request.temperature;
    }
    if (request.stopSequences) {
      params.stop_sequences = request.stopSequences;
    }
    if (request.topP !== undefined) {
      params.top_p = request.topP;
    }

    // Extended thinking for Claude models that support it
    const thinkingEnabled = request.thinking?.enabled && modelInfo?.capabilities.extendedThinking;

    if (thinkingEnabled) {
      // Anthropic requires: budget_tokens >= 1024, budget_tokens < max_tokens
      // When thinking is enabled, ensure max_tokens is large enough to accommodate both
      // thinking budget AND the actual response.
      const requestedBudget = request.thinking?.budgetTokens ?? 8000;
      const minMaxTokens = requestedBudget + 2000; // reserve 2k for the actual response
      if (params.max_tokens < minMaxTokens) {
        params.max_tokens = minMaxTokens;
      }
      // Cap budget at 80% of max_tokens to always leave room for the response
      const budgetTokens = Math.min(requestedBudget, Math.floor(params.max_tokens * 0.8));

      console.log('[AnthropicProvider] Enabling thinking:', {
        canonicalModelId,
        maxTokens: params.max_tokens,
        budgetTokens,
      });

      params.thinking = {
        type: 'enabled',
        budget_tokens: budgetTokens,
      };
      // Anthropic requires temperature=1 with extended thinking
      params.temperature = 1;
    }

    console.log('[AnthropicProvider] Final params:', {
      requestedModel: request.model,
      canonicalModelId,
      modelInfoFound: !!modelInfo,
      modelExtendedThinking: modelInfo?.capabilities?.extendedThinking,
      thinkingEnabled,
      maxTokens: params.max_tokens,
      hasThinkingBlock: !!params.thinking,
    });

    return params;
  }

  private parseResponse(response: Anthropic.Message, model: string): CompletionResponse {
    const content: ContentBlock[] = response.content.map(block => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text } as TextBlock;
      } else if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        } as ToolUseBlock;
      }
      return { type: 'text', text: '' } as TextBlock;
    });

    const stopReason = response.stop_reason === 'tool_use' ? 'tool_use' as const
      : response.stop_reason === 'max_tokens' ? 'max_tokens' as const
      : 'end_turn' as const;

    return {
      message: {
        id: response.id,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        metadata: {
          model,
          provider: 'anthropic',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheReadTokens: response.usage.cache_read_tokens,
          cacheWriteTokens: response.usage.cache_creation_tokens,
          stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_tokens,
        cacheWriteTokens: response.usage.cache_creation_tokens,
      },
    };
  }

  private convertMessage(msg: UnifiedMessage, idMap: Map<string, string> = new Map()): Anthropic.MessageParam {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      };
    }

    const blocks: Anthropic.ContentBlockParam[] = [];
    for (const block of msg.content) {
      switch (block.type) {
        case 'text':
          blocks.push({ type: 'text', text: block.text });
          break;
        case 'tool_use':
          blocks.push({
            type: 'tool_use',
            id: idMap.get(block.id) ?? block.id,
            name: block.name,
            input: block.input,
          });
          break;
        case 'tool_result':
          blocks.push({
            type: 'tool_result',
            tool_use_id: idMap.get(block.toolUseId) ?? block.toolUseId,
            content: typeof block.content === 'string'
              ? block.content
              : block.content.map(b => {
                  if (b.type === 'text') return { type: 'text' as const, text: b.text };
                  return { type: 'text' as const, text: JSON.stringify(b) };
                }),
            is_error: block.isError,
          });
          break;
        case 'image':
          blocks.push({
            type: 'image',
            source: {
              type: block.source.type as 'base64',
              media_type: block.source.mediaType as any,
              data: block.source.data,
            },
          });
          break;
      }
    }

    return {
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: blocks,
    };
  }
}
