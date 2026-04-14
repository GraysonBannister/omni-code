import { Mistral } from '@mistralai/mistralai';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig, ModelInfo, CompletionRequest, CompletionResponse, ToolDefinition,
} from '../provider-types.js';
import type { UnifiedMessage, StreamDelta, ContentBlock, ToolUseBlock, TextBlock } from '../../core/message-types.js';
import { getTextContent, getToolUseBlocks, getToolResultBlocks, getToolResultText } from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';
import { ToolCallNormalizer } from '../tool-call-normalizer.js';

export class MistralProvider extends BaseProvider {
  readonly name = 'mistral' as const;
  readonly displayName = 'Mistral';
  private client!: Mistral;
  private models: ModelInfo[];

  constructor() { super(); this.models = getModelsForProvider('mistral'); }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    if (!config.apiKey) throw new Error('Mistral API key is required. Set MISTRAL_API_KEY environment variable.');
    this.client = new Mistral({ apiKey: config.apiKey });
  }

  listModels(): ModelInfo[] { return this.models; }
  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }
  formatTools(tools: ToolDefinition[]): unknown { return ToolCallNormalizer.toOpenAI(tools); }

  formatMessages(messages: UnifiedMessage[]): any[] {
    const result: any[] = [];
    for (const msg of messages) {
      if (msg.role === 'system') { result.push({ role: 'system', content: getTextContent(msg) }); continue; }
      if (msg.role === 'assistant') {
        const text = getTextContent(msg);
        const toolCalls = getToolUseBlocks(msg);
        if (toolCalls.length > 0) {
          result.push({
            role: 'assistant', content: text || '',
            toolCalls: toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.input) } })),
          });
        } else { result.push({ role: 'assistant', content: text }); }
        continue;
      }
      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          result.push({ role: 'tool', toolCallId: tr.toolUseId, content: getToolResultText(tr) });
        }
      } else { result.push({ role: 'user', content: getTextContent(msg) }); }
    }
    return result;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const params = this.buildParams(request);
    const response = await this.client.chat.complete(params) as any;
    const choice = response.choices[0];
    const content: ContentBlock[] = [];
    if (choice.message.content) content.push({ type: 'text', text: choice.message.content } as TextBlock);
    if (choice.message.toolCalls) {
      for (const tc of choice.message.toolCalls) {
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || '{}') } as ToolUseBlock);
      }
    }
    const stopReason = choice.finishReason === 'tool_calls' ? 'tool_use' as const : choice.finishReason === 'length' ? 'max_tokens' as const : 'end_turn' as const;
    return {
      message: { id: response.id, role: 'assistant', content, timestamp: Date.now(), metadata: { model: request.model, provider: 'mistral', inputTokens: response.usage?.promptTokens || 0, outputTokens: response.usage?.completionTokens || 0, stopReason } },
      stopReason, usage: { inputTokens: response.usage?.promptTokens || 0, outputTokens: response.usage?.completionTokens || 0 },
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const params = this.buildParams(request);
    const stream = await this.client.chat.stream(params) as any;
    const toolBuffers = new Map<number, { id: string; name: string; args: string }>();

    for await (const event of stream) {
      const chunk = event.data;
      const delta = chunk?.choices?.[0]?.delta;
      if (!delta) {
        if (chunk?.usage) yield { type: 'usage', usage: { inputTokens: chunk.usage.promptTokens || 0, outputTokens: chunk.usage.completionTokens || 0 } };
        continue;
      }
      if (delta.content) yield { type: 'text', text: delta.content };
      if (delta.toolCalls) {
        for (let i = 0; i < delta.toolCalls.length; i++) {
          const tc = delta.toolCalls[i];
          if (tc.function?.name) {
            const id = tc.id || crypto.randomUUID();
            toolBuffers.set(i, { id, name: tc.function.name, args: tc.function.arguments || '' });
            yield { type: 'tool_use_start', toolUse: { id, name: tc.function.name } };
            if (tc.function.arguments) {
              yield { type: 'tool_use_delta', toolUse: { id, inputDelta: tc.function.arguments } };
            }
          } else if (tc.function?.arguments) {
            const buf = toolBuffers.get(i);
            if (buf) { buf.args += tc.function.arguments; yield { type: 'tool_use_delta', toolUse: { id: buf.id, inputDelta: tc.function.arguments } }; }
          }
        }
      }
      if (chunk?.choices?.[0]?.finishReason) {
        for (const [, buf] of toolBuffers) yield { type: 'tool_use_end', toolUse: { id: buf.id } };
        yield { type: 'done' };
      }
    }
  }

  async countTokens(messages: UnifiedMessage[], _model: string): Promise<number> {
    let chars = 0;
    for (const msg of messages) { chars += typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length; }
    // Use chars/3 (not chars/4) — code and tool output are denser than prose
    return Math.ceil(chars / 3);
  }

  private buildParams(request: CompletionRequest): any {
    const params: any = { model: request.model, messages: this.formatMessages(request.messages) };
    if (request.systemPrompt) params.messages = [{ role: 'system', content: request.systemPrompt }, ...params.messages];
    if (request.tools?.length) params.tools = this.formatTools(request.tools);
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens) params.maxTokens = request.maxTokens;
    return params;
  }
}
