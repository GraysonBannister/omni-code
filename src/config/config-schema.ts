import { z } from 'zod';

export const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  organizationId: z.string().optional(),
  defaultModel: z.string().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1000).max(300000).default(60000),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const PermissionModeSchema = z.enum(['ask', 'auto-allow', 'deny-all', 'plan']);
export type PermissionMode = z.infer<typeof PermissionModeSchema>;

export const MCPServerConfigSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).default({}),
  transport: z.enum(['stdio', 'sse', 'streamable-http']).default('stdio'),
  url: z.string().url().optional(),
});

export const HookEntrySchema = z.object({
  tool: z.string(),
  command: z.string(),
});

export const OmniCodeConfigSchema = z.object({
  defaultProvider: z.string().default('anthropic'),
  defaultModel: z.string().optional(),
  providers: z.record(z.string(), ProviderConfigSchema).default({}),
  permissionMode: PermissionModeSchema.default('ask'),
  disabledTools: z.array(z.string()).default([]),
  mcpServers: z.record(z.string(), MCPServerConfigSchema).default({}),
  hooks: z.object({
    preToolCall: z.array(HookEntrySchema).default([]),
    postToolCall: z.array(HookEntrySchema).default([]),
  }).default({ preToolCall: [], postToolCall: [] }),
  systemPromptAppend: z.string().optional(),
  sessionPersistence: z.boolean().default(true),
  maxContextTokens: z.number().default(100000),
  temperature: z.number().min(0).max(2).default(0.7),
  theme: z.enum(['dark', 'light', 'auto']).default('auto'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  customEndpoints: z.record(z.string(), z.object({
    baseUrl: z.string().url(),
    apiKey: z.string().optional(),
    models: z.array(z.string()).default([]),
  })).default({}),
  extendedThinking: z.object({
    enabled: z.boolean().default(false),
    budgetTokens: z.number().min(1024).max(128000).default(10000),
  }).default({ enabled: false, budgetTokens: 10000 }),
  autoLintFix: z.boolean().default(false),
  changeReview: z.object({
    enabled: z.boolean().default(true),
    mode: z.enum(['all', 'dangerous']).default('all'),
  }).default({ enabled: true, mode: 'all' }),
  modelRouting: z.object({
    enabled: z.boolean().default(false),
    simpleModel: z.string().optional(),
    complexModel: z.string().optional(),
    simpleProvider: z.string().optional(),
    complexProvider: z.string().optional(),
  }).default({ enabled: false }),
  automations: z.object({
    enabled: z.boolean().default(false),
    rules: z.array(z.object({
      name: z.string(),
      trigger: z.object({
        type: z.literal('file_change'),
        patterns: z.array(z.string()),
      }),
      action: z.object({
        type: z.enum(['run_command', 'lint', 'typecheck', 'test', 'notify']),
        command: z.string().optional(),
      }),
      enabled: z.boolean().default(true),
      debounceMs: z.number().optional(),
    })).default([]),
  }).default({ enabled: false, rules: [] }),
  orchestration: z.object({
    enabled: z.boolean().default(true),
    maxConcurrentAgents: z.number().min(1).max(10).default(3),
    maxTotalAgents: z.number().min(2).max(12).default(8),
    costBudget: z.number().optional(),
    analysisModel: z.string().optional(),
    analysisProvider: z.string().optional(),
    forceOrchestrate: z.boolean().default(false),
    forceSingleAgent: z.boolean().default(false),
    agentOverrides: z.record(z.string(), z.object({
      temperature: z.number().optional(),
      preferredModel: z.string().optional(),
      maxTurns: z.number().nullable().optional(),
    })).default({}),
  }).default({
    enabled: true,
    maxConcurrentAgents: 3,
    maxTotalAgents: 8,
    forceOrchestrate: false,
    forceSingleAgent: false,
    agentOverrides: {},
  }),
});

export type OmniCodeConfig = z.infer<typeof OmniCodeConfigSchema>;
