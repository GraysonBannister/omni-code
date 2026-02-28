import type {
  LLMProvider,
  ProviderName,
  ProviderInitConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ToolDefinition,
} from './provider-types.js';
import type { UnifiedMessage, StreamDelta } from '../core/message-types.js';

export abstract class BaseProvider implements LLMProvider {
  abstract readonly name: ProviderName;
  abstract readonly displayName: string;

  protected config!: ProviderInitConfig;
  protected _available = false;

  async initialize(config: ProviderInitConfig): Promise<void> {
    this.config = config;
    try {
      await this.createClient(config);
      this._available = true;
    } catch (error) {
      this._available = false;
      throw error;
    }
  }

  isAvailable(): boolean {
    return this._available;
  }

  protected abstract createClient(config: ProviderInitConfig): Promise<void>;

  abstract listModels(): ModelInfo[];
  abstract getModelInfo(modelId: string): ModelInfo | undefined;
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta>;
  abstract countTokens(messages: UnifiedMessage[], model: string): Promise<number>;
  abstract formatTools(tools: ToolDefinition[]): unknown;
  abstract formatMessages(messages: UnifiedMessage[]): unknown;
}
