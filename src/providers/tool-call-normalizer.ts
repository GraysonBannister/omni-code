import type { ToolDefinition, JsonSchema, ProviderName } from './provider-types.js';
import type { ToolUseBlock } from '../core/message-types.js';

export class ToolCallNormalizer {
  /** Convert unified tool definitions to Anthropic format */
  static toAnthropic(tools: ToolDefinition[]): unknown[] {
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }

  /** Convert unified tool definitions to OpenAI/Groq/xAI/Mistral format */
  static toOpenAI(tools: ToolDefinition[]): unknown[] {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));
  }

  /** Convert unified tool definitions to Google Gemini format */
  static toGoogle(tools: ToolDefinition[]): unknown[] {
    return [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: this.jsonSchemaToGoogleSchema(t.inputSchema),
      })),
    }];
  }

  /** Parse a native tool call from any provider back to our unified format */
  static parseToolCall(provider: ProviderName, nativeToolCall: any): ToolUseBlock {
    switch (provider) {
      case 'anthropic':
        return {
          type: 'tool_use',
          id: nativeToolCall.id,
          name: nativeToolCall.name,
          input: nativeToolCall.input || {},
        };

      case 'openai':
      case 'groq':
      case 'xai':
      case 'mistral':
      case 'openai-compatible':
        return {
          type: 'tool_use',
          id: nativeToolCall.id,
          name: nativeToolCall.function.name,
          input: JSON.parse(nativeToolCall.function.arguments || '{}'),
        };

      case 'google':
        return {
          type: 'tool_use',
          id: crypto.randomUUID(),
          name: nativeToolCall.name,
          input: nativeToolCall.args || {},
        };

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /** Google uses a slightly different schema format */
  private static jsonSchemaToGoogleSchema(schema: JsonSchema): Record<string, unknown> {
    const cleaned = { ...schema };
    delete cleaned['$schema'];
    delete cleaned['$ref'];
    delete cleaned['definitions'];
    delete cleaned['$defs'];
    return cleaned;
  }
}
