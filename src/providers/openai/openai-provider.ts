import OpenAI from 'openai';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ToolDefinition,
  TokenUsage,
} from '../provider-types.js';
import type { UnifiedMessage, StreamDelta, ContentBlock, ToolUseBlock, TextBlock, ToolResultBlock } from '../../core/message-types.js';
import { getTextContent, getToolUseBlocks, getToolResultBlocks, getToolResultText } from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai' as const;
  readonly displayName = 'OpenAI';
  private client!: OpenAI;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('openai');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.baseUrl,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60_000,
    });
  }

  listModels(): ModelInfo[] { return this.models; }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }

  formatTools(tools: ToolDefinition[]): unknown {
    return ToolCallNormalizer.toOpenAI(tools);
  }

  formatMessages(messages: UnifiedMessage[]): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [];

    // Collect all valid tool_call IDs from assistant messages first so we can
    // strip orphaned tool results that would cause the API to reject the request.
    const knownToolCallIds = new Set<string>();
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        for (const tc of getToolUseBlocks(msg)) {
          if (tc.id) knownToolCallIds.add(tc.id);
        }
      }
    }

    for (const msg of messages) {
      if (msg.role === 'system') {
        result.push({ role: 'system', content: getTextContent(msg) });
        continue;
      }

      if (msg.role === 'assistant') {
        const text = getTextContent(msg);
        const toolCalls = getToolUseBlocks(msg);

        if (toolCalls.length > 0) {
          result.push({
            role: 'assistant',
            content: text || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.input),
              },
            })),
          });
        } else {
          result.push({ role: 'assistant', content: text });
        }
        continue;
      }

      // User messages - check for tool results
      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId)) continue;
          if (typeof tr.content !== 'string' && Array.isArray(tr.content)) {
            const hasImages = tr.content.some(b => b.type === 'image');
            if (hasImages) {
              const parts: any[] = [];
              for (const block of tr.content) {
                if (block.type === 'text') {
                  parts.push({ type: 'text', text: block.text });
                } else if (block.type === 'image') {
                  parts.push({
                    type: 'image_url',
                    image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` },
                  });
                }
              }
              result.push({ role: 'user' as const, content: parts });
              continue;
            }
          }
          result.push({
            role: 'tool',
            tool_call_id: tr.toolUseId,
            content: getToolResultText(tr),
          });
        }
      } else {
        // Check for image blocks in regular user messages
        if (typeof msg.content !== 'string') {
          const hasImages = msg.content.some(b => b.type === 'image');
          if (hasImages) {
            const parts: any[] = [];
            for (const block of msg.content) {
              if (block.type === 'text') parts.push({ type: 'text', text: block.text });
              else if (block.type === 'image') {
                parts.push({
                  type: 'image_url',
                  image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` },
                });
              }
            }
            result.push({ role: 'user' as const, content: parts });
            continue;
          }
        }
        result.push({ role: 'user', content: getTextContent(msg) });
      }
    }

    return result;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const params = this.buildParams(request);
    const response = await this.client.chat.completions.create({
      ...params,
      stream: false,
    });

    return this.parseNonStreamResponse(response, request.model);
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const params = this.buildParams(request);
    const stream = await this.client.chat.completions.create({
      ...params,
      stream: true,
      stream_options: { include_usage: true },
    } as OpenAI.ChatCompletionCreateParamsStreaming);

    const toolBuffers = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) {
        if (chunk.usage) {
          yield {
            type: 'usage',
            usage: {
              inputTokens: chunk.usage.prompt_tokens || 0,
              outputTokens: chunk.usage.completion_tokens || 0,
              cacheReadTokens: (chunk.usage as any)?.prompt_tokens_details?.cached_tokens,
            },
          };
        }
        continue;
      }

      if (delta.content) {
        yield { type: 'text', text: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.function?.name) {
            const id = tc.id || crypto.randomUUID();
            toolBuffers.set(tc.index, {
              id,
              name: tc.function.name,
              args: tc.function.arguments || '',
            });
            yield {
              type: 'tool_use_start',
              toolUse: { id, name: tc.function.name },
            };
            // Some providers send arguments in the same chunk as the name
            if (tc.function.arguments) {
              yield {
                type: 'tool_use_delta',
                toolUse: { id, inputDelta: tc.function.arguments },
              };
            }
          } else if (tc.function?.arguments) {
            const buf = toolBuffers.get(tc.index);
            if (buf) {
              buf.args += tc.function.arguments;
              yield {
                type: 'tool_use_delta',
                toolUse: { id: buf.id, inputDelta: tc.function.arguments },
              };
            }
          }
        }
      }

      if (chunk.choices?.[0]?.finish_reason) {
        // Emit tool_use_end for each completed tool call
        for (const [, buf] of toolBuffers) {
          yield { type: 'tool_use_end', toolUse: { id: buf.id } };
        }
        yield { type: 'done' };
      }
    }
  }

  async countTokens(messages: UnifiedMessage[], _model: string): Promise<number> {
    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') totalChars += msg.content.length;
      else {
        for (const block of msg.content) {
          if (block.type === 'text') totalChars += block.text.length;
          else if (block.type === 'tool_use') totalChars += JSON.stringify(block.input).length;
          else if (block.type === 'tool_result') {
            totalChars += typeof block.content === 'string' ? block.content.length : JSON.stringify(block.content).length;
          }
        }
      }
    }
    // Use chars/3 (not chars/4) — code and tool output are denser than prose
    return Math.ceil(totalChars / 3);
  }

  private buildParams(request: CompletionRequest): any {
    const params: any = {
      model: request.model,
      messages: this.formatMessages(request.messages),
    };

    if (request.systemPrompt) {
      params.messages = [
        { role: 'system', content: request.systemPrompt },
        ...params.messages,
      ];
    }
    if (request.tools && request.tools.length > 0) {
      params.tools = this.formatTools(request.tools);
    }
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.max_tokens = request.maxTokens;
    if (request.topP !== undefined) params.top_p = request.topP;

    // Extended thinking for o3/o4/gpt-5 reasoning models
    if (request.thinking?.enabled &&
        (request.model.startsWith('o3') ||
         request.model.startsWith('o4') ||
         request.model.startsWith('gpt-5'))) {
      params.reasoning_effort = request.thinking.effort || 'high';
      delete params.temperature; // Reasoning models don't support temperature
    }

    return params;
  }

  private parseNonStreamResponse(response: OpenAI.ChatCompletion, model: string): CompletionResponse {
    const choice = response.choices[0];
    const content: ContentBlock[] = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content } as TextBlock);
    }
    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments || '{}'),
        } as ToolUseBlock);
      }
    }

    const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use' as const
      : choice.finish_reason === 'length' ? 'max_tokens' as const
      : 'end_turn' as const;

    return {
      message: {
        id: response.id,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        metadata: {
          model,
          provider: 'openai',
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          cacheReadTokens: (response.usage as any)?.prompt_tokens_details?.cached_tokens,
          stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        cacheReadTokens: (response.usage as any)?.prompt_tokens_details?.cached_tokens,
      },
    };
  }
}
