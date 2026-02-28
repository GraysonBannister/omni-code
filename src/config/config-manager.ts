import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OmniCodeConfigSchema, type OmniCodeConfig } from './config-schema.js';
import { CONFIG_DIR_NAME, CONFIG_FILE_NAME } from '../constants.js';

export class ConfigManager {
  private config: OmniCodeConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): OmniCodeConfig {
    let config = OmniCodeConfigSchema.parse({});

    // Load user config (~/.omnicode/config.json)
    const userConfigPath = path.join(os.homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME);
    config = this.mergeConfig(config, this.loadFile(userConfigPath));

    // Load project config (.omnicode/config.json)
    const projectConfigPath = this.findProjectConfig();
    if (projectConfigPath) {
      config = this.mergeConfig(config, this.loadFile(projectConfigPath));
    }

    // Apply environment variables
    config = this.applyEnvVars(config);

    return config;
  }

  private loadFile(filePath: string): Partial<OmniCodeConfig> {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Ignore malformed config files
    }
    return {};
  }

  private findProjectConfig(): string | null {
    let dir = process.cwd();
    const root = path.parse(dir).root;
    const home = os.homedir();

    while (dir !== root && dir !== home) {
      const candidate = path.join(dir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      dir = path.dirname(dir);
    }
    return null;
  }

  private mergeConfig(base: OmniCodeConfig, overrides: Partial<OmniCodeConfig>): OmniCodeConfig {
    const merged = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined && value !== null) {
        if (key === 'providers' && typeof value === 'object') {
          merged.providers = { ...merged.providers, ...value as Record<string, any> };
        } else if (key === 'hooks' && typeof value === 'object') {
          merged.hooks = { ...merged.hooks, ...value as any };
        } else if (key === 'customEndpoints' && typeof value === 'object') {
          merged.customEndpoints = { ...merged.customEndpoints, ...value as Record<string, any> };
        } else {
          (merged as any)[key] = value;
        }
      }
    }
    return merged;
  }

  private applyEnvVars(config: OmniCodeConfig): OmniCodeConfig {
    const envMapping: Record<string, { path: string[]; transform?: (v: string) => any }> = {
      ANTHROPIC_API_KEY: { path: ['providers', 'anthropic', 'apiKey'] },
      OPENAI_API_KEY: { path: ['providers', 'openai', 'apiKey'] },
      GOOGLE_API_KEY: { path: ['providers', 'google', 'apiKey'] },
      MISTRAL_API_KEY: { path: ['providers', 'mistral', 'apiKey'] },
      GROQ_API_KEY: { path: ['providers', 'groq', 'apiKey'] },
      XAI_API_KEY: { path: ['providers', 'xai', 'apiKey'] },
      OMNICODE_MODEL: { path: ['defaultModel'] },
      OMNICODE_PROVIDER: { path: ['defaultProvider'] },
      OMNICODE_PERMISSION_MODE: { path: ['permissionMode'] },
    };

    for (const [envKey, { path: configPath }] of Object.entries(envMapping)) {
      const value = process.env[envKey];
      if (value) {
        this.deepSet(config, configPath, value);
      }
    }

    return config;
  }

  private deepSet(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined || current[path[i]] === null) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  overrideWith(overrides: Partial<OmniCodeConfig>): void {
    this.config = this.mergeConfig(this.config, overrides);
  }

  get<K extends keyof OmniCodeConfig>(key: K): OmniCodeConfig[K] {
    return this.config[key];
  }

  getAll(): Readonly<OmniCodeConfig> {
    return Object.freeze({ ...this.config });
  }

  getProviderApiKey(provider: string): string | undefined {
    return this.config.providers[provider]?.apiKey;
  }

  getProviderConfig(provider: string): OmniCodeConfig['providers'][string] | undefined {
    return this.config.providers[provider];
  }
}
