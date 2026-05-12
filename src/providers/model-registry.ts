import type { ModelInfo } from './provider-types.js';

export const MODEL_REGISTRY: ModelInfo[] = [
  // ── Anthropic ──
  // Each thinking-capable model gets two entries:
  //   base  → extendedThinking: false  (user picks this to use the model without thinking)
  //   -thinking → extendedThinking: true, apiId = base model  (user picks this to enable thinking)

  // Claude Opus 4.7
  {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.7',
    aliases: ['opus', 'claude-opus', 'opus-4-7'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 },
  },
  {
    id: 'claude-opus-4-7-thinking',
    apiId: 'claude-opus-4-7',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.7 (Thinking)',
    aliases: ['opus-thinking', 'claude-opus-thinking', 'opus-4-7-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 },
  },
  // Claude Opus 4.6
  {
    id: 'claude-opus-4-6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6',
    aliases: ['opus-4-6'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 },
  },
  {
    id: 'claude-opus-4-6-thinking',
    apiId: 'claude-opus-4-6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6 (Thinking)',
    aliases: ['opus-4-6-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 },
  },
  // Claude Sonnet 4.6
  {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    aliases: ['sonnet', 'claude-sonnet', 'sonnet-4-6'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
  },
  {
    id: 'claude-sonnet-4-6-thinking',
    apiId: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6 (Thinking)',
    aliases: ['sonnet-thinking', 'claude-sonnet-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
  },
  // Claude Haiku 4.5
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    aliases: ['haiku', 'claude-haiku', 'haiku-4-5'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 1, outputPerMillion: 5, cacheReadPerMillion: 0.1, cacheWritePerMillion: 1.25 },
  },
  {
    id: 'claude-haiku-4-5-thinking',
    apiId: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5 (Thinking)',
    aliases: ['haiku-thinking', 'claude-haiku-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 1, outputPerMillion: 5, cacheReadPerMillion: 0.1, cacheWritePerMillion: 1.25 },
  },
  // Legacy models
  {
    id: 'claude-opus-4-5',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.5',
    aliases: ['opus-4-5'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 },
  },
  {
    id: 'claude-sonnet-4-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.5',
    aliases: ['sonnet-4-5'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
  },
  {
    id: 'claude-sonnet-4',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4',
    aliases: ['sonnet-4'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
  },
  {
    id: 'claude-opus-4',
    provider: 'anthropic',
    displayName: 'Claude Opus 4',
    aliases: ['opus-4'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 32_000,
    },
    pricing: { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 },
  },
  // Deprecated
  {
    id: 'claude-haiku-3',
    provider: 'anthropic',
    displayName: 'Claude Haiku 3 (Deprecated)',
    aliases: ['haiku-3'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0.25, outputPerMillion: 1.25, cacheReadPerMillion: 0.025, cacheWritePerMillion: 0.3125 },
  },

  // ── OpenAI ──
  {
    id: 'gpt-4.1',
    provider: 'openai',
    displayName: 'GPT-4.1',
    aliases: ['4.1'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 1_047_576, maxOutputTokens: 32_768,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 8 },
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    displayName: 'GPT-4.1 Mini',
    aliases: ['4.1-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 1_047_576, maxOutputTokens: 32_768,
    },
    pricing: { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  },
  {
    id: 'gpt-4.1-nano',
    provider: 'openai',
    displayName: 'GPT-4.1 Nano',
    aliases: ['4.1-nano'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 1_047_576, maxOutputTokens: 32_768,
    },
    pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  },
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
    id: 'o1',
    provider: 'openai',
    displayName: 'o1',
    aliases: ['o1-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 15, outputPerMillion: 60 },
  },
  {
    id: 'o1-pro',
    provider: 'openai',
    displayName: 'o1 Pro',
    aliases: ['o1-pro-high'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 150, outputPerMillion: 600 },
  },
  {
    id: 'o3-pro',
    provider: 'openai',
    displayName: 'o3 Pro',
    aliases: ['o3-pro-high'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 20, outputPerMillion: 80 },
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
  {
    id: 'o3-deep-research',
    provider: 'openai',
    displayName: 'o3 Deep Research',
    aliases: ['o3-dr', 'deep-research'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 10, outputPerMillion: 40 },
  },
  {
    id: 'o4-mini-high',
    provider: 'openai',
    displayName: 'o4 Mini High',
    aliases: ['o4m-high', 'o4-mini-high'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 },
  },
  {
    id: 'o4-mini-deep-research',
    provider: 'openai',
    displayName: 'o4 Mini Deep Research',
    aliases: ['o4m-dr', 'o4-mini-dr'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 200_000, maxOutputTokens: 100_000,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 8 },
  },

  // ── GPT-5.4 Family (Latest Flagship) ──
  {
    id: 'gpt-5.4',
    provider: 'openai',
    displayName: 'GPT-5.4',
    aliases: ['5.4', 'gpt-5-4'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 1_047_576, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 2.5, outputPerMillion: 15 },
  },
  {
    id: 'gpt-5.4-pro',
    provider: 'openai',
    displayName: 'GPT-5.4 Pro',
    aliases: ['5.4-pro', 'gpt-5-4-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 1_047_576, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 30, outputPerMillion: 180 },
  },
  {
    id: 'gpt-5.4-mini',
    provider: 'openai',
    displayName: 'GPT-5.4 Mini',
    aliases: ['5.4-mini', 'gpt-5-4-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 1_047_576, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 0.75, outputPerMillion: 4.5 },
  },
  {
    id: 'gpt-5.4-nano',
    provider: 'openai',
    displayName: 'GPT-5.4 Nano',
    aliases: ['5.4-nano', 'gpt-5-4-nano'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 1_047_576, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 1.25 },
  },

  // ── GPT-5 Family (Reasoning Models) ──
  {
    id: 'gpt-5',
    provider: 'openai',
    displayName: 'GPT-5',
    aliases: ['5', 'gpt-5-base'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 1.25, outputPerMillion: 10 },
  },
  {
    id: 'gpt-5-pro',
    provider: 'openai',
    displayName: 'GPT-5 Pro',
    aliases: ['5-pro', 'gpt-5-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 15, outputPerMillion: 120 },
  },
  {
    id: 'gpt-5-mini',
    provider: 'openai',
    displayName: 'GPT-5 Mini',
    aliases: ['5-mini', 'gpt-5-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 0.25, outputPerMillion: 2 },
  },
  {
    id: 'gpt-5-nano',
    provider: 'openai',
    displayName: 'GPT-5 Nano',
    aliases: ['5-nano', 'gpt-5-nano'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 0.05, outputPerMillion: 0.4 },
  },
  {
    id: 'gpt-5.1',
    provider: 'openai',
    displayName: 'GPT-5.1',
    aliases: ['5.1', 'gpt-5-1'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 1.25, outputPerMillion: 10 },
  },
  {
    id: 'gpt-5.2',
    provider: 'openai',
    displayName: 'GPT-5.2',
    aliases: ['5.2', 'gpt-5-2'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 1.75, outputPerMillion: 14 },
  },
  {
    id: 'gpt-5.2-pro',
    provider: 'openai',
    displayName: 'GPT-5.2 Pro',
    aliases: ['5.2-pro', 'gpt-5-2-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 400_000, maxOutputTokens: 128_000,
    },
    pricing: { inputPerMillion: 21, outputPerMillion: 168 },
  },

  // ── Google Gemini ──
  // Per https://ai.google.dev/gemini-api/docs/pricing
  // Note: Gemini 2.0 Flash/Flash-Lite are deprecated (shutdown June 1, 2026)

  // Gemini 2.5 Pro — flagship reasoning model (output includes thinking tokens)
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    aliases: ['gemini-pro', 'gemini', 'gemini-2-5-pro', 'gemini-2.5-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 1.25, outputPerMillion: 10, cacheReadPerMillion: 0.125 },
  },
  // Gemini 2.5 Flash — hybrid reasoning with thinking budget
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash',
    aliases: ['gemini-flash', 'flash', 'gemini-2-5-flash', 'gemini-2.5-flash'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 2.5, cacheReadPerMillion: 0.03 },
  },
  // Gemini 2.5 Flash-Lite — most cost-effective
  {
    id: 'gemini-2.5-flash-lite',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash-Lite',
    aliases: ['gemini-flash-lite', 'flash-lite', 'gemini-2-5-flash-lite'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4, cacheReadPerMillion: 0.01 },
  },
  // Gemini 3 Flash Preview — speed-focused with thinking
  {
    id: 'gemini-3-flash-preview',
    provider: 'google',
    displayName: 'Gemini 3 Flash Preview',
    aliases: ['gemini-3-flash', 'gemini3-flash'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 3, cacheReadPerMillion: 0.05 },
  },
  // Gemini 3.1 Pro Preview — world-class multimodal (output includes thinking)
  {
    id: 'gemini-3.1-pro-preview',
    provider: 'google',
    displayName: 'Gemini 3.1 Pro Preview',
    aliases: ['gemini-3-pro', 'gemini3-pro', 'gemini-3.1-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 12, cacheReadPerMillion: 0.2 },
  },
  // Gemini 3.1 Flash-Lite Preview — cost-effective for agent tasks
  {
    id: 'gemini-3.1-flash-lite-preview',
    provider: 'google',
    displayName: 'Gemini 3.1 Flash-Lite Preview',
    aliases: ['gemini-3.1-flash-lite', 'gemini3-flash-lite'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 64_000,
    },
    pricing: { inputPerMillion: 0.25, outputPerMillion: 1.5, cacheReadPerMillion: 0.025 },
  },
  // Legacy: Gemini 2.0 Pro (deprecated, shutdown June 1, 2026)
  {
    id: 'gemini-2.0-pro',
    provider: 'google',
    displayName: 'Gemini 2.0 Pro (Deprecated)',
    aliases: ['gemini-2-0-pro'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 1.25, outputPerMillion: 5 },
  },
  // Legacy: Gemini 2.0 Flash (deprecated, shutdown June 1, 2026)
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash (Deprecated)',
    aliases: ['gemini-2-0-flash'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 1_000_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4 },
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
  // Per official docs: https://docs.x.ai/docs/guides/reasoning
  // Only grok-3-mini models support reasoning_effort. grok-3 and grok-3-fast do NOT.
  // Each mini model gets a base entry (no thinking) + a thinking variant.

  // Grok 3 — deep domain knowledge, no reasoning_effort support
  // Per https://docs.x.ai/developers/models - Updated to Grok 4 pricing
  {
    id: 'grok-3-latest',
    provider: 'xai',
    displayName: 'Grok 3',
    aliases: ['grok', 'grok-3', 'grok3', 'grok-3-beta'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 },
  },
  {
    id: 'grok-3-fast-latest',
    provider: 'xai',
    displayName: 'Grok 3 Fast',
    aliases: ['grok-fast', 'grok-3-fast', 'grok3-fast', 'grok-3-fast-beta'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  // Grok 3 Mini — supports reasoning_effort; split into base and thinking variants
  // Updated per https://docs.x.ai/developers/models - Grok 4 specs
  {
    id: 'grok-3-mini-latest',
    provider: 'xai',
    displayName: 'Grok 3 Mini',
    aliases: ['grok-mini', 'grok-3-mini', 'grok3-mini', 'grok-3-mini-beta'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-3-mini-latest-thinking',
    apiId: 'grok-3-mini-latest',
    provider: 'xai',
    displayName: 'Grok 3 Mini (Thinking)',
    aliases: ['grok-mini-thinking', 'grok-3-mini-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-3-mini-fast-latest',
    provider: 'xai',
    displayName: 'Grok 3 Mini Fast',
    aliases: ['grok-mini-fast', 'grok-3-mini-fast', 'grok3-mini-fast', 'grok-3-mini-fast-beta'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-3-mini-fast-latest-thinking',
    apiId: 'grok-3-mini-fast-latest',
    provider: 'xai',
    displayName: 'Grok 3 Mini Fast (Thinking)',
    aliases: ['grok-mini-fast-thinking', 'grok-3-mini-fast-thinking'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  // Grok 2 — vision and general chat
  {
    id: 'grok-2-1212',
    provider: 'xai',
    displayName: 'Grok 2',
    aliases: ['grok-2', 'grok2', 'grok-2-latest'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 10 },
  },
  {
    id: 'grok-2-vision-1212',
    provider: 'xai',
    displayName: 'Grok 2 Vision',
    aliases: ['grok-2-vision', 'grok2-vision', 'grok-2-vision-latest'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 8_192, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 10 },
  },

  // Grok 4 — latest generation with large context window
  {
    id: 'grok-4.20-0309-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.20 Reasoning',
    aliases: ['grok-4.20-reasoning', 'grok-4-20-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 },
  },
  {
    id: 'grok-4.20-0309-non-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.20',
    aliases: ['grok-4.20', 'grok-4-20', 'grok-4.20-non-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 },
  },
  {
    id: 'grok-4-1-fast-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.1 Fast Reasoning',
    aliases: ['grok-4.1-reasoning', 'grok-4-1-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-4-1-fast-non-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.1 Fast',
    aliases: ['grok-4.1', 'grok-4-1', 'grok-4.1-fast'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-4.20-multi-agent-0309',
    provider: 'xai',
    displayName: 'Grok 4.20 Multi-Agent',
    aliases: ['grok-4.20-multi-agent', 'grok-multi-agent'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 },
  },
  // Grok Image Generation Models
  {
    id: 'grok-imagine-image-pro',
    provider: 'xai',
    displayName: 'Grok Image Pro',
    aliases: ['grok-image-pro', 'grok-imagine-pro'],
    capabilities: {
      streaming: false, toolUse: false, vision: true, jsonMode: false,
      systemPrompt: false, caching: false, extendedThinking: false,
      maxContextWindow: 8_192, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    id: 'grok-imagine-image',
    provider: 'xai',
    displayName: 'Grok Image',
    aliases: ['grok-image', 'grok-imagine'],
    capabilities: {
      streaming: false, toolUse: false, vision: true, jsonMode: false,
      systemPrompt: false, caching: false, extendedThinking: false,
      maxContextWindow: 8_192, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  // Grok Video Generation Model
  {
    id: 'grok-imagine-video',
    provider: 'xai',
    displayName: 'Grok Video',
    aliases: ['grok-video', 'grok-imagine-video'],
    capabilities: {
      streaming: false, toolUse: false, vision: true, jsonMode: false,
      systemPrompt: false, caching: false, extendedThinking: false,
      maxContextWindow: 8_192, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },

  // ── Moonshot / Kimi ──
  {
    id: 'kimi-k2.5',
    provider: 'moonshot',
    displayName: 'Kimi K2.5',
    aliases: ['kimi', 'k2.5', 'kimi-k2'],
    fixedTemperature: 1,
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 256_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2 },
  },
  {
    id: 'kimi-k2.6',
    provider: 'moonshot',
    displayName: 'Kimi K2.6',
    aliases: ['k2.6', 'kimi-k2-6'],
    fixedTemperature: 1,
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 256_000, maxOutputTokens: 32_768,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2 },
  },
  {
    id: 'kimi-k1.6',
    provider: 'moonshot',
    displayName: 'Kimi K1.6',
    aliases: ['k1.6', 'kimi-k1'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 256_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2 },
  },
  {
    id: 'kimi-k1.6-long-context',
    provider: 'moonshot',
    displayName: 'Kimi K1.6 Long Context',
    aliases: ['k1.6-long', 'kimi-long'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2 },
  },
  {
    id: 'kimi-moonshot-v1',
    provider: 'moonshot',
    displayName: 'Kimi Moonshot v1',
    aliases: ['moonshot', 'kimi-v1'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2 },
  },

  // ── AWS Bedrock ──
  {
    id: 'anthropic.claude-sonnet-4-5-v1',
    provider: 'bedrock',
    displayName: 'Claude Sonnet 4.5 (Bedrock)',
    aliases: ['bedrock-sonnet', 'bedrock-claude-sonnet'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15 },
  },
  {
    id: 'anthropic.claude-haiku-3-5-v1',
    provider: 'bedrock',
    displayName: 'Claude Haiku 3.5 (Bedrock)',
    aliases: ['bedrock-haiku', 'bedrock-claude-haiku'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 200_000, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0.8, outputPerMillion: 4 },
  },
  {
    id: 'meta.llama3-3-70b-instruct-v1:0',
    provider: 'bedrock',
    displayName: 'Llama 3.3 70B (Bedrock)',
    aliases: ['bedrock-llama', 'bedrock-llama-70b'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 4_096,
    },
    pricing: { inputPerMillion: 0.72, outputPerMillion: 0.72 },
  },
  {
    id: 'mistral.mistral-large-2411-v1:0',
    provider: 'bedrock',
    displayName: 'Mistral Large (Bedrock)',
    aliases: ['bedrock-mistral', 'bedrock-mistral-large'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 128_000, maxOutputTokens: 8_192,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6 },
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
