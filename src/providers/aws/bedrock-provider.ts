import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type ContentBlock as BedrockContentBlock,
  type Message as BedrockMessage,
  type ToolConfiguration,
  type SystemContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { BaseProvider } from '../base-provider.js';
import type {
  ProviderInitConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ToolDefinition,
} from '../provider-types.js';
import type {
  UnifiedMessage,
  StreamDelta,
  ContentBlock,
  ToolUseBlock,
  TextBlock,
} from '../../core/message-types.js';
import {
  getTextContent,
  getToolUseBlocks,
  getToolResultBlocks,
} from '../../core/message-types.js';
import { getModelsForProvider } from '../model-registry.js';

export class BedrockProvider extends BaseProvider {
  readonly name = 'bedrock' as const;
  readonly displayName = 'AWS Bedrock';
  private client!: BedrockRuntimeClient;
  private models: ModelInfo[];

  constructor() {
    super();
    this.models = getModelsForProvider('bedrock');
  }

  protected async createClient(config: ProviderInitConfig): Promise<void> {
    // Bedrock uses the AWS credential chain (env vars, ~/.aws/credentials, IAM roles)
    // The apiKey field is repurposed: if present, treat as AWS_ACCESS_KEY_ID check
    // baseUrl is used as the region
    this.client = new BedrockRuntimeClient({
      region: config.baseUrl || process.env.AWS_REGION || 'us-east-1',
    });
  }

  listModels(): ModelInfo[] {
    return this.models;
  }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId || m.aliases?.includes(modelId));
  }

  formatTools(tools: ToolDefinition[]): unknown {
    return {
      tools: tools.map(t => ({
        toolSpec: {
          name: t.name,
          description: t.description,
          inputSchema: { json: t.inputSchema },
        },
      })),
    };
  }

  formatMessages(messages: UnifiedMessage[]): BedrockMessage[] {
    const result: BedrockMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue; // System handled separately

      if (msg.role === 'assistant') {
        const text = getTextContent(msg);
        const toolCalls = getToolUseBlocks(msg);
        const content: BedrockContentBlock[] = [];

        if (text) {
          content.push({ text });
        }
        for (const tc of toolCalls) {
          content.push({
            toolUse: {
              toolUseId: tc.id,
              name: tc.name,
              input: tc.input as any,
            },
          });
        }

        if (content.length > 0) {
          result.push({ role: 'assistant', content });
        }
        continue;
      }

      // User messages (including tool results)
      const toolResults = getToolResultBlocks(msg);
      if (toolResults.length > 0) {
        const content: BedrockContentBlock[] = toolResults.map(tr => ({
          toolResult: {
            toolUseId: tr.toolUseId,
            content: [{
              text: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
            }],
            status: tr.isError ? 'error' as const : 'success' as const,
          },
        }));
        result.push({ role: 'user', content });
      } else {
        const text = getTextContent(msg);
        if (text) {
          result.push({ role: 'user', content: [{ text }] });
        }
      }
    }

    return result;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const params = this.buildParams(request);
    const command = new ConverseCommand(params);
    const response = await this.client.send(command);

    const content: ContentBlock[] = [];
    const outputContent = response.output?.message?.content || [];

    for (const block of outputContent) {
      if (block.text) {
        content.push({ type: 'text', text: block.text } as TextBlock);
      }
      if (block.toolUse) {
        content.push({
          type: 'tool_use',
          id: block.toolUse.toolUseId || crypto.randomUUID(),
          name: block.toolUse.name || '',
          input: (block.toolUse.input as Record<string, unknown>) || {},
        } as ToolUseBlock);
      }
    }

    const stopReason = response.stopReason === 'tool_use' ? 'tool_use' as const
      : response.stopReason === 'max_tokens' ? 'max_tokens' as const
      : 'end_turn' as const;

    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        metadata: {
          model: request.model,
          provider: 'bedrock',
          inputTokens: response.usage?.inputTokens || 0,
          outputTokens: response.usage?.outputTokens || 0,
          stopReason,
        },
      },
      stopReason,
      usage: {
        inputTokens: response.usage?.inputTokens || 0,
        outputTokens: response.usage?.outputTokens || 0,
      },
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamDelta> {
    const params = this.buildParams(request);
    const command = new ConverseStreamCommand(params);
    const response = await this.client.send(command);

    if (!response.stream) {
      yield { type: 'error', error: new Error('No stream returned from Bedrock') };
      return;
    }

    let currentToolId: string | undefined;

    for await (const event of response.stream) {
      if (event.contentBlockStart) {
        const start = event.contentBlockStart.start;
        if (start?.toolUse) {
          currentToolId = start.toolUse.toolUseId || crypto.randomUUID();
          yield {
            type: 'tool_use_start',
            toolUse: {
              id: currentToolId,
              name: start.toolUse.name || '',
            },
          };
        }
      }

      if (event.contentBlockDelta) {
        const delta = event.contentBlockDelta.delta;
        if (delta?.text) {
          yield { type: 'text', text: delta.text };
        }
        if (delta?.toolUse?.input) {
          yield {
            type: 'tool_use_delta',
            toolUse: { id: currentToolId, inputDelta: delta.toolUse.input },
          };
        }
      }

      if (event.contentBlockStop) {
        if (currentToolId) {
          yield { type: 'tool_use_end', toolUse: { id: currentToolId } };
          currentToolId = undefined;
        }
      }

      if (event.messageStop) {
        yield { type: 'done' };
      }

      if (event.metadata?.usage) {
        yield {
          type: 'usage',
          usage: {
            inputTokens: event.metadata.usage.inputTokens || 0,
            outputTokens: event.metadata.usage.outputTokens || 0,
          },
        };
      }
    }
  }

  async countTokens(messages: UnifiedMessage[], _model: string): Promise<number> {
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
    return Math.ceil(totalChars / 4);
  }

  private buildParams(request: CompletionRequest): any {
    const params: any = {
      modelId: request.model,
      messages: this.formatMessages(request.messages),
    };

    if (request.systemPrompt) {
      params.system = [{ text: request.systemPrompt }] as SystemContentBlock[];
    }

    if (request.tools && request.tools.length > 0) {
      params.toolConfig = this.formatTools(request.tools);
    }

    const inferenceConfig: any = {};
    if (request.maxTokens) inferenceConfig.maxTokens = request.maxTokens;
    if (request.temperature !== undefined) inferenceConfig.temperature = request.temperature;
    if (request.topP !== undefined) inferenceConfig.topP = request.topP;
    if (request.stopSequences) inferenceConfig.stopSequences = request.stopSequences;

    if (Object.keys(inferenceConfig).length > 0) {
      params.inferenceConfig = inferenceConfig;
    }

    return params;
  }
}
