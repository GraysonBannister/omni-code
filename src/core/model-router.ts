import type { ProviderRegistry } from '../providers/provider-registry.js';

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export interface RoutingConfig {
  enabled: boolean;
  simpleModel?: string;
  complexModel?: string;
  simpleProvider?: string;
  complexProvider?: string;
}

interface RoutingDecision {
  model: string;
  provider: string;
  complexity: TaskComplexity;
  reason: string;
}

const SIMPLE_PATTERNS = [
  /^(fix|correct)\s+(the\s+)?typo/i,
  /^add\s+(a\s+)?comment/i,
  /^rename\s+/i,
  /^remove\s+(unused|dead)/i,
  /^update\s+(the\s+)?import/i,
  /^change\s+\w+\s+to\s+\w+$/i,
  /^what\s+(is|does)\s+/i,
  /^explain\s+(this|the)\s+/i,
  /^show\s+(me\s+)?/i,
  /^list\s+/i,
  /^find\s+/i,
  /^search\s+/i,
  /^read\s+/i,
];

const COMPLEX_PATTERNS = [
  /refactor/i,
  /architect/i,
  /design/i,
  /implement.*from\s+scratch/i,
  /build\s+(a|an|the)\s+/i,
  /create\s+(a|an)\s+(new\s+)?(system|service|api|framework|library)/i,
  /migrate/i,
  /optimize.*performance/i,
  /security\s+audit/i,
  /review.*codebase/i,
  /debug.*complex/i,
  /multi.*(file|step|phase)/i,
];

export class ModelRouter {
  private config: RoutingConfig;
  private providerRegistry: ProviderRegistry;
  private defaultModel: string;
  private defaultProvider: string;

  constructor(
    config: RoutingConfig,
    providerRegistry: ProviderRegistry,
    defaultModel: string,
    defaultProvider: string,
  ) {
    this.config = config;
    this.providerRegistry = providerRegistry;
    this.defaultModel = defaultModel;
    this.defaultProvider = defaultProvider;
  }

  route(userMessage: string, toolCallCount?: number): RoutingDecision {
    if (!this.config.enabled) {
      return {
        model: this.defaultModel,
        provider: this.defaultProvider,
        complexity: 'moderate',
        reason: 'Routing disabled',
      };
    }

    const complexity = this.classifyComplexity(userMessage, toolCallCount);

    switch (complexity) {
      case 'simple': {
        const model = this.config.simpleModel || this.defaultModel;
        const provider = this.config.simpleProvider || this.defaultProvider;
        if (this.isModelAvailable(model, provider)) {
          return { model, provider, complexity, reason: 'Simple task — routed to fast/cheap model' };
        }
        return { model: this.defaultModel, provider: this.defaultProvider, complexity, reason: 'Simple task (preferred model unavailable, using default)' };
      }

      case 'complex': {
        const model = this.config.complexModel || this.defaultModel;
        const provider = this.config.complexProvider || this.defaultProvider;
        if (this.isModelAvailable(model, provider)) {
          return { model, provider, complexity, reason: 'Complex task — routed to powerful model' };
        }
        return { model: this.defaultModel, provider: this.defaultProvider, complexity, reason: 'Complex task (preferred model unavailable, using default)' };
      }

      default:
        return {
          model: this.defaultModel,
          provider: this.defaultProvider,
          complexity: 'moderate',
          reason: 'Moderate complexity — using default model',
        };
    }
  }

  classifyComplexity(message: string, toolCallCount?: number): TaskComplexity {
    // Check tool call history — many tool calls suggest complexity
    if (toolCallCount && toolCallCount > 10) return 'complex';

    // Check message length as a proxy for complexity
    if (message.length < 50) {
      // Short messages are often simple
      for (const pattern of SIMPLE_PATTERNS) {
        if (pattern.test(message)) return 'simple';
      }
    }

    // Check for complex patterns
    for (const pattern of COMPLEX_PATTERNS) {
      if (pattern.test(message)) return 'complex';
    }

    // Very long messages with multiple requirements suggest complexity
    if (message.length > 500) return 'complex';
    if (message.split('\n').length > 10) return 'complex';

    // Default to moderate
    return 'moderate';
  }

  private isModelAvailable(model: string, provider: string): boolean {
    const p = this.providerRegistry.getProvider(provider);
    return p?.isAvailable() || false;
  }
}
