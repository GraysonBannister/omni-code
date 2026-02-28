import type { Agent } from '../core/agent-types.js';
import type { ConfigManager } from '../config/config-manager.js';
import type { ProviderRegistry } from '../providers/provider-registry.js';
import type { CostTracker } from '../core/cost-tracker.js';

export interface CommandContext {
  agent: Agent;
  config: ConfigManager;
  providerRegistry: ProviderRegistry;
  costTracker: CostTracker;
  setModel: (model: string, provider: string) => void;
}

export interface SlashCommand {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  execute(args: string, context: CommandContext): Promise<string | void>;
}
