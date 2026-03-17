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
    console.log('[ProviderRegistry] initializeAll called with configs:', Object.keys(configs));
    const promises: Promise<void>[] = [];
    for (const [name, config] of Object.entries(configs)) {
      const provider = this.providers.get(name);
      console.log(`[ProviderRegistry] Provider ${name}: exists=${!!provider}, hasApiKey=${!!config.apiKey}, hasBaseUrl=${!!config.baseUrl}`);
      if (provider && (config.apiKey || config.baseUrl)) {
        console.log(`[ProviderRegistry] Initializing ${name}...`);
        promises.push(
          provider.initialize(config).then(() => {
            console.log(`[ProviderRegistry] Successfully initialized ${name}`);
          }).catch(err => {
            console.error(`[ProviderRegistry] Failed to initialize ${name}:`, (err as Error).message);
            logger.warn(`Failed to initialize provider "${name}": ${(err as Error).message}`);
          })
        );
      } else if (provider && !config.apiKey) {
        console.log(`[ProviderRegistry] Skipping ${name} - no API key provided`);
      }
    }
    console.log(`[ProviderRegistry] Initializing ${promises.length} providers...`);
    await Promise.allSettled(promises);
    console.log('[ProviderRegistry] All providers initialized');
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
    const all = Array.from(this.providers.values());
    const available = all.filter(p => p.isAvailable());
    console.log(`[ProviderRegistry] getAvailable: ${available.length}/${all.length} providers available`);
    all.forEach(p => {
      console.log(`[ProviderRegistry]   ${p.name}: isAvailable=${p.isAvailable()}`);
    });
    return available;
  }

  getAllModels(): ModelInfo[] {
    const models = Array.from(this.providers.values()).flatMap(p => p.listModels());
    console.log(`[ProviderRegistry] getAllModels: ${models.length} models total`);
    return models;
  }

  getAvailableModels(): ModelInfo[] {
    const models = this.getAvailable().flatMap(p => p.listModels());
    console.log(`[ProviderRegistry] getAvailableModels: ${models.length} models from available providers`);
    return models;
  }
}
