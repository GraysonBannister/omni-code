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
    id: 'grok-4-1-fast-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.1 Fast (Reasoning)',
    aliases: ['grok-4-1-fast', 'grok-4-fast', 'grok-fast', 'grok'],
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
    displayName: 'Grok 4.1 Fast (Non-Reasoning)',
    aliases: ['grok-4-1-nr', 'grok-fast-nr'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 },
  },
  {
    id: 'grok-code-fast-1',
    provider: 'xai',
    displayName: 'Grok Code Fast',
    aliases: ['grok-code', 'grok-coder'],
    capabilities: {
      streaming: true, toolUse: true, vision: false, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 256_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 1.5, cacheReadPerMillion: 0.02 },
  },
  {
    id: 'grok-4.20-multi-agent-experimental-beta-0304',
    provider: 'xai',
    displayName: 'Grok 4.20 Multi-Agent (Experimental)',
    aliases: ['grok-4.20', 'grok-multi-agent', 'grok-experimental'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6 },
  },
  {
    id: 'grok-4.20-experimental-beta-0304-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.20 Experimental (Reasoning)',
    aliases: ['grok-4.20-reasoning'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6 },
  },
  {
    id: 'grok-4.20-experimental-beta-0304-non-reasoning',
    provider: 'xai',
    displayName: 'Grok 4.20 Experimental (Non-Reasoning)',
    aliases: ['grok-4.20-nr'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 6 },
  },
  {
    id: 'grok-4-fast-reasoning',
    provider: 'xai',
    displayName: 'Grok 4 Fast (Reasoning)',
    aliases: ['grok-4-fr'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5 },
  },
  {
    id: 'grok-4-fast-non-reasoning',
    provider: 'xai',
    displayName: 'Grok 4 Fast (Non-Reasoning)',
    aliases: ['grok-4-fnr'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 2_000_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5 },
  },
  {
    id: 'grok-4-0709',
    provider: 'xai',
    displayName: 'Grok 4',
    aliases: ['grok-4', 'grok4'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 256_000, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.75 },
  },
  {
    id: 'grok-3',
    provider: 'xai',
    displayName: 'Grok-3',
    aliases: ['grok3'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: false,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.75 },
  },
  {
    id: 'grok-3-mini',
    provider: 'xai',
    displayName: 'Grok-3 Mini',
    aliases: ['grok-mini', 'grok3-mini'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: true, extendedThinking: true,
      maxContextWindow: 131_072, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.07 },
  },
  {
    id: 'grok-2-vision-1212',
    provider: 'xai',
    displayName: 'Grok-2 Vision',
    aliases: ['grok2-vision', 'grok-2-vision'],
    capabilities: {
      streaming: true, toolUse: true, vision: true, jsonMode: true,
      systemPrompt: true, caching: false, extendedThinking: false,
      maxContextWindow: 32_768, maxOutputTokens: 16_384,
    },
    pricing: { inputPerMillion: 2, outputPerMillion: 10 },
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
