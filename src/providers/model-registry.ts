import type { ModelInfo } from './provider-types.js';

export const MODEL_REGISTRY: ModelInfo[] = [
  // ── Anthropic ──
  {
    id: 'claude-opus-4-6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6',
    aliases: ['opus', 'claude-opus'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 32_000,
    },
    pricing: { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 },
  },
  {
    id: 'claude-sonnet-4-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.5',
    aliases: ['sonnet', 'claude-sonnet'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
  },
  {
    id: 'claude-haiku-3-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 3.5',
    aliases: ['haiku', 'claude-haiku'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.8, outputPerMillion: 4, cacheReadPerMillion: 0.08, cacheWritePerMillion: 1 },
  },

  // ── OpenAI ──
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    aliases: ['4o'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2.5, outputPerMillion: 10 },
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    aliases: ['4o-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  },
  {
    id: 'o3',
    provider: 'openai',
    displayName: 'o3',
    aliases: ['o3-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 10, outputPerMillion: 40 },
  },
  {
    id: 'o3-mini',
    provider: 'openai',
    displayName: 'o3 Mini',
    aliases: ['o3m'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 },
  },

  // ── Google Gemini ──
  {
    id: 'gemini-2.0-pro',
    provider: 'google',
    displayName: 'Gemini 2.0 Pro',
    aliases: ['gemini-pro', 'gemini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 1.25, outputPerMillion: 5 },
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    aliases: ['gemini-flash', 'flash'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 },
  },

  // ── Mistral ──
  {
    id: 'mistral-large-latest',
    provider: 'mistral',
    displayName: 'Mistral Large',
    aliases: ['mistral-large', 'mistral'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6 },
  },
  {
    id: 'codestral-latest',
    provider: 'mistral',
    displayName: 'Codestral',
    aliases: ['codestral'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 256_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.9 },
  },

  // ── Groq ──
  {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    displayName: 'Llama 3.3 70B (Groq)',
    aliases: ['llama-70b', 'groq-llama'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 32_768,
    },
    pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  },
  {
    id: 'mixtral-8x7b-32768',
    provider: 'groq',
    displayName: 'Mixtral 8x7B (Groq)',
    aliases: ['mixtral', 'groq-mixtral'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 32_768, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0.24, outputPerMillion: 0.24 },
  },

  // ── xAI Grok ──
  {
    id: 'grok-3',
    provider: 'xai',
    displayName: 'Grok-3',
    aliases: ['grok', 'grok3'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15 },
  },
  {
    id: 'grok-3-mini',
    provider: 'xai',
    displayName: 'Grok-3 Mini',
    aliases: ['grok-mini', 'grok3-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5 },
  },
  {
    id: 'grok-2',
    provider: 'xai',
    displayName: 'Grok-2',
    aliases: ['grok2'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 10 },
  },
];

export function findModelInfo(modelId: string): ModelInfo | undefined {
  // Direct match
  const direct = MODEL_REGISTRY.find(m => m.id === modelId);
  if (direct) return direct;

  // Alias match
  return MODEL_REGISTRY.find(m => m.aliases?.includes(modelId));
}

export function getModelsForProvider(provider: string): ModelInfo[] {
  return MODEL_REGISTRY.filter(m => m.provider === provider);
}
