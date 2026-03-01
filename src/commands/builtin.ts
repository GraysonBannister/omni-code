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
      '/memory (mem)  - View, add, or search project memories',
      '/sessions      - List recent sessions',
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

export const memoryCommand: SlashCommand = {
  name: 'memory',
  aliases: ['mem'],
  description: 'View, add, or search project memories',
  usage: '/memory [add|search|list] [text]',
  async execute(args, context) {
    if (!context.memoryStore) {
      return 'Memory store not initialized.';
    }

    const parts = args.trim().split(/\s+/);
    const subCommand = parts[0]?.toLowerCase();
    const text = parts.slice(1).join(' ');
    const projectName = process.cwd().split('/').pop() || 'unknown';

    switch (subCommand) {
      case 'add': {
        if (!text) return 'Usage: /memory add <text>';
        const entry = context.memoryStore.add({
          content: text,
          category: 'fact',
          project: projectName,
          tags: [],
          source: 'user',
        });
        return `Memory saved (${entry.id.substring(0, 8)}).`;
      }
      case 'search': {
        if (!text) return 'Usage: /memory search <query>';
        const results = context.memoryStore.search(text, projectName);
        if (results.length === 0) return 'No memories found.';
        return results.map(m => `  [${m.category}] ${m.content}`).join('\n');
      }
      case 'list':
      default: {
        const memories = context.memoryStore.getForProject(projectName);
        if (memories.length === 0) return 'No memories stored for this project. Use /memory add <text> to add one.';
        return `Memories for ${projectName}:\n` +
          memories.map(m => `  [${m.category}] ${m.content}`).join('\n');
      }
    }
  },
};

export const sessionsCommand: SlashCommand = {
  name: 'sessions',
  aliases: ['sess'],
  description: 'List recent sessions for this project',
  usage: '/sessions',
  async execute(_args, context) {
    if (!context.sessionStore) {
      return 'Session store not initialized.';
    }

    const sessions = context.sessionStore.listRecent(process.cwd(), 10);
    if (sessions.length === 0) {
      return 'No previous sessions found for this directory.';
    }

    const lines = sessions.map(s => {
      const date = new Date(s.updatedAt).toLocaleString();
      const summary = s.summary || '(no summary)';
      return `  ${s.id.substring(0, 8)} | ${date} | ${s.model} | ${summary}`;
    });

    return `Recent sessions:\n${lines.join('\n')}\n\nUse --resume <id> to resume a session.`;
  },
};

export function registerBuiltinCommands(registry: import('./command-registry.js').CommandRegistry): void {
  registry.register(helpCommand);
  registry.register(modelCommand);
  registry.register(providersCommand);
  registry.register(costCommand);
  registry.register(compactCommand);
  registry.register(clearCommand);
  registry.register(memoryCommand);
  registry.register(sessionsCommand);
}
