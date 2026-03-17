import OpenAI from 'openai';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ToolDefinition,
} from '../provider-types.js';
import type { UnifiedMessage, StreamDelta, ContentBlock, ToolUseBlock, TextBlock } from '../../core/message-types.js';
import { getTextContent, getToolUseBlocks, getToolResultBlocks, getToolResultText } from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

export class MoonshotProvider extends BaseProvider {
  readonly name = 'moonshot' as const;
  readonly displayName = 'Moonshot / Kimi';
  private client!: OpenAI;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('moonshot');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    console.log('[MoonshotProvider] createClient called, apiKey exists:', !!config.apiKey);
    console.log('[MoonshotProvider] apiKey length:', config.apiKey?.length || 0);
    if (!config.apiKey) {
      throw new Error('Moonshot API key is required. Set MOONSHOT_API_KEY environment variable.');
    }
    console.log('[MoonshotProvider] Creating OpenAI client with baseURL:', config.baseUrl ?? 'https://api.moonshot.cn/v1');
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl ?? 'https://api.moonshot.cn/v1',
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60_000,
    });
    console.log('[MoonshotProvider] OpenAI client created successfully');
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

      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          result.push({
            role: 'tool',
            tool_call_id: tr.toolUseId,
            content: getToolResultText(tr),
          });
        }
        continue;
      }

      // User messages
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
    console.log('[MoonshotProvider:streamComplete] Starting stream for model:', request.model);
    console.log('[MoonshotProvider:streamComplete] Client available:', !!this.client);
    console.log('[MoonshotProvider:streamComplete] Provider available:', this.isAvailable());

    const params = this.buildParams(request);
    console.log('[MoonshotProvider:streamComplete] Params built, making API call...');

    try {
      console.log('[MoonshotProvider:streamComplete] Sending request to Moonshot API...');
      console.log('[MoonshotProvider:streamComplete] Request params:', JSON.stringify(params, null, 2));

      const stream = await this.client.chat.completions.create({
        ...params,
        stream: true,
        stream_options: { include_usage: true },
      } as OpenAI.ChatCompletionCreateParamsStreaming);
      console.log('[MoonshotProvider:streamComplete] Stream created successfully');

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
          for (const [, buf] of toolBuffers) {
            yield { type: 'tool_use_end', toolUse: { id: buf.id } };
          }
          yield { type: 'done' };
        }
      }
      console.log('[MoonshotProvider:streamComplete] Stream completed successfully');
    } catch (error) {
      console.error('[MoonshotProvider:streamComplete] Error during streaming:', (error as Error).message);
      console.error('[MoonshotProvider:streamComplete] Error status:', (error as any).status);
      console.error('[MoonshotProvider:streamComplete] Error code:', (error as any).code);
      console.error('[MoonshotProvider:streamComplete] Error type:', (error as any).type);
      console.error('[MoonshotProvider:streamComplete] Error response:', (error as any).response);
      console.error('[MoonshotProvider:streamComplete] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
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
    return Math.ceil(totalChars / 4);
  }

  private buildParams(request: CompletionRequest): any {
    console.log('[MoonshotProvider:buildParams] Building params for model:', request.model);
    console.log('[MoonshotProvider:buildParams] Message count:', request.messages.length);

    const formattedMessages = this.formatMessages(request.messages);
    console.log('[MoonshotProvider:buildParams] Formatted messages:', JSON.stringify(formattedMessages, null, 2));

    const params: any = {
      model: request.model,
      messages: formattedMessages,
    };

    if (request.systemPrompt) {
      params.messages = [
        { role: 'system', content: request.systemPrompt },
        ...params.messages,
      ];
      console.log('[MoonshotProvider:buildParams] Added system prompt');
    }
    if (request.tools && request.tools.length > 0) {
      params.tools = this.formatTools(request.tools);
      console.log('[MoonshotProvider:buildParams] Added', request.tools.length, 'tools');
    }
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.max_tokens = request.maxTokens;
    if (request.topP !== undefined) params.top_p = request.topP;

    console.log('[MoonshotProvider:buildParams] Final params:', JSON.stringify(params, null, 2));
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
          provider: 'moonshot',
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}
