import OpenAI from 'openai';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig, ModelInfo, CompletionRequest, CompletionResponse, ToolDefinition, ModelCapabilities, ModelPricing,
} from '../provider-types.js';
import type { UnifiedMessage, StreamDelta, ContentBlock, ToolUseBlock, TextBlock } from '../../core/message-types.js';
import { getTextContent, getToolUseBlocks, getToolResultBlocks } from '../../core/message-types.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

interface EndpointConfig {
  baseUrl: string;
  apiKey?: string;
  models: string[];
}

/**
 * OpenAI-compatible provider for local models (Ollama, LM Studio, vLLM, etc.)
 * and any other service exposing an OpenAI-compatible API.
 */
export class OpenAICompatProvider extends BaseProvider {
  readonly name = 'openai-compatible' as const;
  readonly displayName: string;
  private client!: OpenAI;
  private models: ModelInfo[];
  private endpointName: string;

  constructor(name: string, endpointConfig: EndpointConfig) {
    super();
    this.endpointName = name;
    this.displayName = `${name} (OpenAI-compatible)`;

    this.models = endpointConfig.models.map(modelId => ({
      id: `${name}/${modelId}`,
      provider: 'openai-compatible' as const,
      displayName: `${modelId} (${name})`,
      aliases: [modelId],
      capabilities: {
        streaming: true, toolUse: true, vision: false, jsonMode: true,
        systemPrompt: true, caching: false, extendedThinking: false,
        maxContextWindow: 128_000, maxOutputTokens: 4_096,
      } as ModelCapabilities,
      pricing: { inputPerMillion: 0, outputPerMillion: 0 } as ModelPricing,
    }));

    // Store baseUrl for initialization
    this.config = { baseUrl: endpointConfig.baseUrl, apiKey: endpointConfig.apiKey };
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    this.client = new OpenAI({
      apiKey: config.apiKey || this.config?.apiKey || 'not-needed',
      baseURL: config.baseUrl || (this.config as any)?.baseUrl,
      maxRetries: config.maxRetries ?? 2,
      timeout: config.timeout ?? 120_000,
    });
  }

  listModels(): ModelInfo[] { return this.models; }
  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }
  formatTools(tools: ToolDefinition[]): unknown { return ToolCallNormalizer.toOpenAI(tools); }

  formatMessages(messages: UnifiedMessage[]): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [];
    for (const msg of messages) {
      if (msg.role === 'system') { result.push({ role: 'system', content: getTextContent(msg) }); continue; }
      if (msg.role === 'assistant') {
        const text = getTextContent(msg);
        const toolCalls = getToolUseBlocks(msg);
        if (toolCalls.length > 0) {
          result.push({
            role: 'assistant', content: text || null,
            tool_calls: toolCalls.map(tc => ({ id: tc.id, type: 'function' as const, function: { name: tc.name, arguments: JSON.stringify(tc.input) } })),
          });
        } else { result.push({ role: 'assistant', content: text }); }
        continue;
      }
      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          result.push({ role: 'tool', tool_call_id: tr.toolUseId, content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content) });
        }
      } else { result.push({ role: 'user', content: getTextContent(msg) }); }
    }
    return result;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Strip endpoint name prefix from model ID if present
    const modelId = request.model.replace(`${this.endpointName}/`, '');
    const params: any = {
      model: modelId,
      messages: this.formatMessages(request.messages),
      stream: false,
    };
    if (request.systemPrompt) params.messages = [{ role: 'system', content: request.systemPrompt }, ...params.messages];
    if (request.tools?.length) params.tools = this.formatTools(request.tools);
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.max_tokens = request.maxTokens;

    const response = await this.client.chat.completions.create(params);
    const choice = response.choices[0];
    const content: ContentBlock[] = [];
    if (choice.message.content) content.push({ type: 'text', text: choice.message.content } as TextBlock);
    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || '{}') } as ToolUseBlock);
      }
    }
    const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use' as const : 'end_turn' as const;
    return {
      message: { id: response.id, role: 'assistant', content, timestamp: Date.now(), metadata: { model: request.model, provider: 'openai-compatible', inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0, stopReason } },
      stopReason, usage: { inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0 },
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const modelId = request.model.replace(`${this.endpointName}/`, '');
    const params: any = {
      model: modelId,
      messages: this.formatMessages(request.messages),
      stream: true,
    };
    if (request.systemPrompt) params.messages = [{ role: 'system', content: request.systemPrompt }, ...params.messages];
    if (request.tools?.length) params.tools = this.formatTools(request.tools);
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.max_tokens = request.maxTokens;

    const stream = await this.client.chat.completions.create(params);
    const toolBuffers = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
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
    let chars = 0;
    for (const msg of messages) { chars += typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length; }
    return Math.ceil(chars / 4);
  }
}
