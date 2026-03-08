import { execSync } from 'node:child_process';
import type { SlashCommand } from './command-types.js';
import { BUILTIN_MODES } from '../config/modes.js';

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
      '/search (s)    - Semantic search across the codebase',
      '/sessions      - List recent sessions',
      '/mode (md)     - Switch to a custom mode',
      '/health        - Show project health status',
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

    // Actually update the model in all components
    context.setModel(resolved.model.id, resolved.provider.name);

    // Update the agent's config with new model and provider
    context.agent.updateConfig({
      model: resolved.model.id,
      provider: resolved.provider,
    });

    // Update the orchestrator if available
    if (context.orchestrator) {
      context.orchestrator.updateModel(resolved.provider, resolved.model.id);
    }

    // Update the UI state if updater is available
    if (context.updateUIState) {
      context.updateUIState({
        model: resolved.model.id,
        provider: resolved.provider.name,
      });
    }

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
  async execute(_args, context) {
    // Actually clear the agent's messages
    context.agent.clearMessages();

    // Update the UI state to clear messages if updater is available
    if (context.updateUIState) {
      context.updateUIState({});
    }

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

export const modeCommand: SlashCommand = {
  name: 'mode',
  aliases: ['md'],
  description: 'Switch to a custom mode (architect, code, review, security, debug)',
  usage: '/mode [mode-name]',
  async execute(args, context) {
    if (!args.trim()) {
      const modeNames = Object.keys(BUILTIN_MODES);
      const lines = modeNames.map(name => {
        const mode = BUILTIN_MODES[name];
        const planTag = mode.planMode ? ' [read-only]' : '';
        return `  ${name}${planTag} - ${mode.systemPromptAppend.substring(0, 80)}...`;
      });
      return `Available modes:\n${lines.join('\n')}\n\nUse /mode <name> to switch.`;
    }

    const modeName = args.trim().toLowerCase();
    const mode = BUILTIN_MODES[modeName];
    if (!mode) {
      return `Unknown mode: "${modeName}". Available: ${Object.keys(BUILTIN_MODES).join(', ')}`;
    }

    // Get current system prompt and append the mode's prompt
    const currentSystemPrompt = context.agent.config.systemPrompt;
    const basePrompt = currentSystemPrompt.split('## Mode Instructions')[0].trim();
    const newSystemPrompt = `${basePrompt}\n\n## Mode Instructions\n${mode.systemPromptAppend}`;

    // Update the agent's config with new system prompt and plan mode
    context.agent.updateConfig({
      systemPrompt: newSystemPrompt,
      planMode: mode.planMode || false,
    });

    // Update the UI state if updater is available
    if (context.updateUIState) {
      context.updateUIState({
        systemPrompt: newSystemPrompt,
        planMode: mode.planMode || false,
      });
    }

    return `Switched to ${modeName} mode.\n${mode.systemPromptAppend}${mode.planMode ? '\n(Read-only mode — file modifications disabled)' : ''}`;
  },
};

export const healthCommand: SlashCommand = {
  name: 'health',
  description: 'Show project health: type errors, lint status, TODO count',
  usage: '/health',
  async execute(_args, _context) {
    const results: string[] = ['## Project Health'];

    // Type checking
    try {
      execSync('npx tsc --noEmit 2>&1', { cwd: process.cwd(), encoding: 'utf-8', timeout: 30000 });
      results.push('Types: OK');
    } catch (e: any) {
      const errors = ((e.stdout || '') as string).split('\n').filter((l: string) => l.includes('error TS')).length;
      results.push(`Types: ${errors} error(s)`);
    }

    // Lint
    try {
      execSync('npx eslint src/ --quiet 2>&1', { cwd: process.cwd(), encoding: 'utf-8', timeout: 30000 });
      results.push('Lint: OK');
    } catch (e: any) {
      const warnings = ((e.stdout || '') as string).split('\n').filter((l: string) => l.includes('warning') || l.includes('error')).length;
      results.push(`Lint: ${warnings} issue(s)`);
    }

    // TODO/FIXME count
    try {
      const output = execSync('grep -r "TODO\\|FIXME\\|HACK\\|XXX" src/ --include="*.ts" --include="*.tsx" -c 2>/dev/null || echo "0"', { cwd: process.cwd(), encoding: 'utf-8', timeout: 10000 });
      const count = output.trim().split('\n').reduce((sum, line) => {
        const m = line.match(/:(\d+)$/);
        return sum + (m ? parseInt(m[1]) : 0);
      }, 0);
      results.push(`TODOs/FIXMEs: ${count}`);
    } catch {
      results.push('TODOs: unable to scan');
    }

    return results.join('\n');
  },
};

export const searchCommand: SlashCommand = {
  name: 'search',
  aliases: ['s'],
  description: 'Semantic search across the codebase using vector embeddings',
  usage: '/search <query> [--top <n>]',
  async execute(args, _context) {
    if (!args.trim()) return 'Usage: /search <query> [--top <n>]';

    // Parse --top flag
    let topK = 10;
    let query = args;
    const topMatch = args.match(/--top\s+(\d+)/);
    if (topMatch) {
      topK = parseInt(topMatch[1]);
      query = args.replace(/--top\s+\d+/, '').trim();
    }

    try {
      const { SemanticMemory } = await import('../memory/semantic-memory.js');
      const memory = await SemanticMemory.create(process.cwd());
      const results = await memory.search(query, topK);

      if (results.length === 0) {
        return `No results for "${query}". Try indexing first with the IndexCodebase tool.`;
      }

      const lines = results.map((r: any, i: number) => {
        const score = (r.score * 100).toFixed(1);
        const lineRange = r.startLine && r.endLine ? `:${r.startLine}-${r.endLine}` : '';
        return `${i + 1}. [${score}%] ${r.filePath}${lineRange}\n   ${(r.content || '').substring(0, 120).replace(/\n/g, ' ')}`;
      });

      return `Semantic search results for "${query}":\n\n${lines.join('\n\n')}`;
    } catch (error) {
      return `Search error: ${(error as Error).message}\nMake sure the codebase has been indexed first.`;
    }
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
  registry.register(modeCommand);
  registry.register(healthCommand);
  registry.register(searchCommand);
}
