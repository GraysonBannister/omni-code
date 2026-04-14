import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
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

export class GoogleProvider extends BaseProvider {
  readonly name = 'google' as const;
  readonly displayName = 'Google (Gemini)';
  private genAI!: GoogleGenerativeAI;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('google');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Google API key is required. Set GOOGLE_API_KEY environment variable.');
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  listModels(): ModelInfo[] { return this.models; }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }

  formatTools(tools: ToolDefinition[]): unknown {
    return ToolCallNormalizer.toGoogle(tools);
  }

  formatMessages(messages: UnifiedMessage[]): any[] {
    const result: any[] = [];
    for (const msg of messages) {
      if (msg.role === 'system') continue; // System prompt handled separately

      if (msg.role === 'assistant') {
        const parts: any[] = [];
        const text = getTextContent(msg);
        if (text) parts.push({ text });
        for (const tc of getToolUseBlocks(msg)) {
          parts.push({ functionCall: { name: tc.name, args: tc.input } });
        }
        result.push({ role: 'model', parts });
        continue;
      }

      // User messages
      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        const parts = toolResults.map(tr => ({
          functionResponse: {
            name: tr.toolUseId, // Google uses name, not ID
            response: {
              content: getToolResultText(tr),
              isError: !!tr.isError,
            },
          },
        }));
        result.push({ role: 'user', parts });
      } else {
        result.push({ role: 'user', parts: [{ text: getTextContent(msg) }] });
      }
    }
    return result;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const model = this.getModel(request);
    const result = await model.generateContent({
      contents: this.formatMessages(request.messages),
      ...(request.tools?.length ? { tools: this.formatTools(request.tools) as any } : {}),
    });

    const response = result.response;
    const content: ContentBlock[] = [];

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if ('text' in part && part.text) {
        content.push({ type: 'text', text: part.text } as TextBlock);
      }
      if ('functionCall' in part && part.functionCall) {
        content.push({
          type: 'tool_use',
          id: crypto.randomUUID(),
          name: part.functionCall.name,
          input: (part.functionCall.args || {}) as Record<string, unknown>,
        } as ToolUseBlock);
      }
    }

    const hasToolCalls = content.some(c => c.type === 'tool_use');
    const stopReason = hasToolCalls ? 'tool_use' as const : 'end_turn' as const;

    return {
      message: {
        id: crypto.randomUUID(), role: 'assistant', content, timestamp: Date.now(),
        metadata: {
          model: request.model, provider: 'google',
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
          stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const model = this.getModel(request);
    const result = await model.generateContentStream({
      contents: this.formatMessages(request.messages),
      ...(request.tools?.length ? { tools: this.formatTools(request.tools) as any } : {}),
    });

    for await (const chunk of result.stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts || []) {
        if ('text' in part && part.text) {
          yield { type: 'text', text: part.text };
        }
        if ('functionCall' in part && part.functionCall) {
          const id = crypto.randomUUID();
          yield {
            type: 'tool_use_start',
            toolUse: { id, name: part.functionCall.name },
          };
          yield {
            type: 'tool_use_delta',
            toolUse: { id, inputDelta: JSON.stringify(part.functionCall.args || {}) },
          };
          yield { type: 'tool_use_end', toolUse: { id } };
        }
      }

      if (chunk.usageMetadata) {
        yield {
          type: 'usage',
          usage: {
            inputTokens: chunk.usageMetadata.promptTokenCount || 0,
            outputTokens: chunk.usageMetadata.candidatesTokenCount || 0,
          },
        };
      }
    }

    yield { type: 'done' };
  }

  async countTokens(messages: UnifiedMessage[], model: string): Promise<number> {
    try {
      const genModel = this.genAI.getGenerativeModel({ model });
      const result = await genModel.countTokens({
        contents: this.formatMessages(messages),
      });
      return result.totalTokens;
    } catch {
      // Fallback to estimation
      let chars = 0;
      for (const msg of messages) {
        chars += typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length;
      }
      // Use chars/3 (not chars/4) — code and tool output are denser than prose
      return Math.ceil(chars / 3);
    }
  }

  private getModel(request: CompletionRequest): GenerativeModel {
    const config: any = {};
    if (request.temperature !== undefined) config.temperature = request.temperature;
    if (request.maxTokens) config.maxOutputTokens = request.maxTokens;
    if (request.topP !== undefined) config.topP = request.topP;

    return this.genAI.getGenerativeModel({
      model: request.model,
      generationConfig: config,
      ...(request.systemPrompt ? { systemInstruction: request.systemPrompt } : {}),
    });
  }
}
