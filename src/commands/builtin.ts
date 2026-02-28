import type { SlashCommand } from './command-types.js';

export const helpCommand: SlashCommand = {
  name: 'help',
  aliases: ['h'],
  description: 'Show available commands',
  usage: '/help',
  async execute(_args, context) {
    const commands = [
      '/help (h)      - Show this help message',
      '/model (m)     - Switch model or list available models',
      '/providers (p) - List configured providers and their status',
      '/cost          - Show session token usage and cost',
      '/compact       - Compress conversation context',
      '/clear (c)     - Clear conversation history',
      '/exit          - Exit omni-code',
    ];
    return commands.join('\n');
  },
};

export const modelCommand: SlashCommand = {
  name: 'model',
  aliases: ['m'],
  description: 'Switch the active model or list available models',
  usage: '/model [model-name]',
  async execute(args, context) {
    if (!args) {
      const models = context.providerRegistry.getAvailableModels();
      const currentModel = context.agent.config.model;
      if (models.length === 0) {
        return 'No models available. Configure API keys in ~/.omnicode/config.json or via environment variables.';
      }
      const lines = models.map(m => {
        const current = m.id === currentModel ? ' ◂ current' : '';
        const aliases = m.aliases?.length ? ` (${m.aliases.join(', ')})` : '';
        return `  ${m.id}${aliases} - ${m.displayName} [${m.provider}]${current}`;
      });
      return `Available models:\n${lines.join('\n')}`;
    }

    const resolved = context.providerRegistry.resolveModel(args);
    if (!resolved) {
      return `Unknown model: "${args}". Use /model to list available models.`;
    }
    if (!resolved.provider.isAvailable()) {
      return `Provider "${resolved.provider.name}" is not configured. Set the API key first.`;
    }

    context.setModel(resolved.model.id, resolved.provider.name);
    return `Switched to ${resolved.model.displayName} (${resolved.provider.displayName})`;
  },
};

export const providersCommand: SlashCommand = {
  name: 'providers',
  aliases: ['p'],
  description: 'List configured providers and their status',
  usage: '/providers',
  async execute(_args, context) {
    const allModels = context.providerRegistry.getAllModels();
    const providers = new Map<string, { available: boolean; modelCount: number }>();

    for (const model of allModels) {
      const existing = providers.get(model.provider);
      if (existing) {
        existing.modelCount++;
      } else {
        const provider = context.providerRegistry.getProvider(model.provider);
        providers.set(model.provider, {
          available: provider?.isAvailable() || false,
          modelCount: 1,
        });
      }
    }

    const lines = Array.from(providers.entries()).map(([name, info]) => {
      const status = info.available ? '✓ configured' : '✗ not configured';
      return `  ${name}: ${status} (${info.modelCount} models)`;
    });

    return `Providers:\n${lines.join('\n')}`;
  },
};

export const costCommand: SlashCommand = {
  name: 'cost',
  description: 'Show session token usage and cost',
  usage: '/cost',
  async execute(_args, context) {
    return context.costTracker.getSummary();
  },
};

export const compactCommand: SlashCommand = {
  name: 'compact',
  description: 'Compress conversation context to free up tokens',
  usage: '/compact',
  async execute(_args, context) {
    const before = await context.agent.getTokenCount();
    await context.agent.compressContext();
    const after = await context.agent.getTokenCount();
    return `Context compressed: ${before.toLocaleString()} → ${after.toLocaleString()} tokens`;
  },
};

export const clearCommand: SlashCommand = {
  name: 'clear',
  aliases: ['c'],
  description: 'Clear conversation history',
  usage: '/clear',
  async execute(_args, _context) {
    return 'Conversation cleared. Starting fresh.';
  },
};

export function registerBuiltinCommands(registry: import('./command-registry.js').CommandRegistry): void {
  registry.register(helpCommand);
  registry.register(modelCommand);
  registry.register(providersCommand);
  registry.register(costCommand);
  registry.register(compactCommand);
  registry.register(clearCommand);
}
