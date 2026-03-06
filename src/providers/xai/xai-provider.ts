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
import { getTextContent, getToolUseBlocks, getToolResultBlocks } from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

/** Models that require the /v1/responses endpoint instead of /v1/chat/completions */
const RESPONSES_API_MODELS = new Set([
  'grok-4.20-multi-agent-experimental-beta-0304',
]);

/**
 * xAI Grok provider — uses the OpenAI SDK with xAI's base URL for standard models,
 * and the Responses API for multi-agent/experimental models.
 */
export class XAIProvider extends BaseProvider {
  readonly name = 'xai' as const;
  readonly displayName = 'xAI (Grok)';
  private client!: OpenAI;
  private apiKey!: string;
  private baseURL!: string;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('xai');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('xAI API key is required. Set XAI_API_KEY environment variable.');
    }
    this.apiKey = config.apiKey;
    this.baseURL = config.baseUrl || 'https://api.x.ai/v1';
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: this.baseURL,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60_000,
    });
  }

  private isResponsesModel(model: string): boolean {
    return RESPONSES_API_MODELS.has(model) || model.includes('multi-agent');
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
              function: { name: tc.name, arguments: JSON.stringify(tc.input) },
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
          if (typeof tr.content !== 'string' && Array.isArray(tr.content)) {
            const hasImages = tr.content.some(b => b.type === 'image');
            if (hasImages) {
              const parts: any[] = [];
              for (const block of tr.content) {
                if (block.type === 'text') parts.push({ type: 'text', text: block.text });
                else if (block.type === 'image') {
                  parts.push({ type: 'image_url', image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` } });
                }
              }
              result.push({ role: 'user' as const, content: parts });
              continue;
            }
          }
          result.push({
            role: 'tool',
            tool_call_id: tr.toolUseId,
            content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
          });
        }
      } else {
        if (typeof msg.content !== 'string') {
          const hasImages = msg.content.some(b => b.type === 'image');
          if (hasImages) {
            const parts: any[] = [];
            for (const block of msg.content) {
              if (block.type === 'text') parts.push({ type: 'text', text: block.text });
              else if (block.type === 'image') {
                parts.push({ type: 'image_url', image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` } });
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
    if (this.isResponsesModel(request.model)) {
      return this.completeViaResponses(request);
    }
    const params = this.buildParams(request);
    const response = await this.client.chat.completions.create({ ...params, stream: false });

    const choice = response.choices[0];
    const content: ContentBlock[] = [];
    if (choice.message.content) content.push({ type: 'text', text: choice.message.content } as TextBlock);
    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        content.push({
          type: 'tool_use', id: tc.id, name: tc.function.name,
          input: JSON.parse(tc.function.arguments || '{}'),
        } as ToolUseBlock);
      }
    }

    const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use' as const
      : choice.finish_reason === 'length' ? 'max_tokens' as const : 'end_turn' as const;

    return {
      message: {
        id: response.id, role: 'assistant', content, timestamp: Date.now(),
        metadata: {
          model: request.model, provider: 'xai',
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0, stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    if (this.isResponsesModel(request.model)) {
      yield* this.streamViaResponses(request);
      return;
    }

    const params = this.buildParams(request);
    const stream = await this.client.chat.completions.create({
      ...params, stream: true, stream_options: { include_usage: true },
    } as OpenAI.ChatCompletionCreateParamsStreaming);

    const toolBuffers = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) {
        if (chunk.usage) {
          yield { type: 'usage', usage: { inputTokens: chunk.usage.prompt_tokens || 0, outputTokens: chunk.usage.completion_tokens || 0 } };
        }
        continue;
      }
      if (delta.content) yield { type: 'text', text: delta.content };
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.function?.name) {
            const id = tc.id || crypto.randomUUID();
            toolBuffers.set(tc.index, { id, name: tc.function.name, args: tc.function.arguments || '' });
            yield { type: 'tool_use_start', toolUse: { id, name: tc.function.name } };
            if (tc.function.arguments) {
              yield { type: 'tool_use_delta', toolUse: { inputDelta: tc.function.arguments } };
            }
          } else if (tc.function?.arguments) {
            const buf = toolBuffers.get(tc.index);
            if (buf) { buf.args += tc.function.arguments; yield { type: 'tool_use_delta', toolUse: { inputDelta: tc.function.arguments } }; }
          }
        }
      }
      if (chunk.choices?.[0]?.finish_reason) {
        for (const [,] of toolBuffers) yield { type: 'tool_use_end' };
        yield { type: 'done' };
      }
    }
  }

  async countTokens(messages: UnifiedMessage[], _model: string): Promise<number> {
    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') totalChars += msg.content.length;
      else for (const block of msg.content) {
        if (block.type === 'text') totalChars += block.text.length;
        else if (block.type === 'tool_use') totalChars += JSON.stringify(block.input).length;
        else if (block.type === 'tool_result') totalChars += typeof block.content === 'string' ? block.content.length : JSON.stringify(block.content).length;
      }
    }
    return Math.ceil(totalChars / 4);
  }

  // ─── Responses API (multi-agent models) ───

  /**
   * Build the `input` field for the Responses API from unified messages.
   * The Responses API accepts either a string or an array of message objects.
   */
  private buildResponsesInput(messages: UnifiedMessage[], systemPrompt?: string): any {
    const input: any[] = [];

    if (systemPrompt) {
      input.push({ role: 'developer', content: systemPrompt });
    }

    for (const msg of messages) {
      const text = getTextContent(msg);
      if (msg.role === 'user') {
        input.push({ role: 'user', content: text });
      } else if (msg.role === 'assistant') {
        input.push({ role: 'assistant', content: text });
      }
    }

    return input;
  }

  private async completeViaResponses(request: CompletionRequest): Promise<CompletionResponse> {
    const input = this.buildResponsesInput(request.messages, request.systemPrompt);
    const url = `${this.baseURL}/responses`;

    const body: any = {
      model: request.model,
      input,
      max_output_tokens: request.maxTokens || 16384,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`xAI Responses API error (${resp.status}): ${errText}`);
    }

    const data = await resp.json() as any;
    const outputText = data.output?.[0]?.content?.[0]?.text || '';

    const content: ContentBlock[] = [];
    if (outputText) content.push({ type: 'text', text: outputText } as TextBlock);

    return {
      message: {
        id: data.id || crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        metadata: {
          model: request.model,
          provider: 'xai',
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          stopReason: 'end_turn',
        },
      },
      stopReason: 'end_turn',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    };
  }

  private async *streamViaResponses(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const input = this.buildResponsesInput(request.messages, request.systemPrompt);
    const url = `${this.baseURL}/responses`;

    const body: any = {
      model: request.model,
      input,
      max_output_tokens: request.maxTokens || 16384,
      stream: true,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      yield { type: 'error', error: new Error(`xAI Responses API error (${resp.status}): ${errText}`) };
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: new Error('No response body') };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'response.output_text.delta' && event.delta) {
                yield { type: 'text', text: event.delta };
              } else if (event.type === 'response.completed' && event.response?.usage) {
                const usage = event.response.usage;
                yield {
                  type: 'usage',
                  usage: {
                    inputTokens: usage.input_tokens || 0,
                    outputTokens: usage.output_tokens || 0,
                  },
                };
                yield { type: 'done' };
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ─── Chat Completions API (standard models) ───

  private buildParams(request: CompletionRequest): any {
    const params: any = { model: request.model, messages: this.formatMessages(request.messages) };
    if (request.systemPrompt) params.messages = [{ role: 'system', content: request.systemPrompt }, ...params.messages];
    if (request.tools?.length) params.tools = this.formatTools(request.tools);
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.max_tokens = request.maxTokens;
    if (request.topP !== undefined) params.top_p = request.topP;

    // Extended thinking for Grok reasoning models
    if (request.thinking?.enabled && request.model.includes('reasoning')) {
      params.reasoning_effort = 'high';
    }

    return params;
  }
}
