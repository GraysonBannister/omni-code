import type {
  LLMProvider,
  ProviderName,
  ProviderInitConfig,
  ModelInfo,
} from './provider-types.js';
import { logger } from '../utils/logger.js';

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();
  private modelToProvider = new Map<string, string>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    for (const model of provider.listModels()) {
      this.modelToProvider.set(model.id, provider.name);
      for (const alias of model.aliases || []) {
        this.modelToProvider.set(alias, provider.name);
      }
    }
  }

  async initializeAll(configs: Record<string, ProviderInitConfig>): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [name, config] of Object.entries(configs)) {
      const provider = this.providers.get(name);
      if (provider && (config.apiKey || config.baseUrl)) {
        promises.push(
          provider.initialize(config).catch(err => {
            logger.warn(`Failed to initialize provider "${name}": ${(err as Error).message}`);
          })
        );
      }
    }
    await Promise.allSettled(promises);
  }

  resolveModel(modelId: string): { provider: LLMProvider; model: ModelInfo } | undefined {
    const providerName = this.modelToProvider.get(modelId);
    if (!providerName) return undefined;
    const provider = this.providers.get(providerName);
    if (!provider) return undefined;
    const model = provider.getModelInfo(modelId);
    if (!model) return undefined;
    return { provider, model };
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  getAvailable(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isAvailable());
  }

  getAllModels(): ModelInfo[] {
    return Array.from(this.providers.values()).flatMap(p => p.listModels());
  }

  getAvailableModels(): ModelInfo[] {
    return this.getAvailable().flatMap(p => p.listModels());
  }
}
