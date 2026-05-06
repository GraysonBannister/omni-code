"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/config-schema.ts
var import_zod, ProviderConfigSchema, PermissionModeSchema, MCPServerConfigSchema, HookEntrySchema, OmniCodeConfigSchema;
var init_config_schema = __esm({
  "src/config/config-schema.ts"() {
    "use strict";
    import_zod = require("zod");
    ProviderConfigSchema = import_zod.z.object({
      apiKey: import_zod.z.string().optional(),
      baseUrl: import_zod.z.string().url().optional(),
      organizationId: import_zod.z.string().optional(),
      defaultModel: import_zod.z.string().optional(),
      maxRetries: import_zod.z.number().min(0).max(10).default(3),
      timeout: import_zod.z.number().min(1e3).max(3e5).default(6e4)
    });
    PermissionModeSchema = import_zod.z.enum(["ask", "auto-allow", "deny-all", "plan"]);
    MCPServerConfigSchema = import_zod.z.object({
      command: import_zod.z.string().optional(),
      args: import_zod.z.array(import_zod.z.string()).default([]),
      env: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).default({}),
      transport: import_zod.z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
      url: import_zod.z.string().url().optional()
    });
    HookEntrySchema = import_zod.z.object({
      tool: import_zod.z.string(),
      command: import_zod.z.string()
    });
    OmniCodeConfigSchema = import_zod.z.object({
      defaultProvider: import_zod.z.string().default("anthropic"),
      defaultModel: import_zod.z.string().optional(),
      activeModels: import_zod.z.array(import_zod.z.string()).default([]),
      // enabled model IDs that appear in UI (empty = all models)
      providers: import_zod.z.record(import_zod.z.string(), ProviderConfigSchema).default({}),
      permissionMode: PermissionModeSchema.default("ask"),
      disabledTools: import_zod.z.array(import_zod.z.string()).default([]),
      mcpServers: import_zod.z.record(import_zod.z.string(), MCPServerConfigSchema).default({}),
      hooks: import_zod.z.object({
        preToolCall: import_zod.z.array(HookEntrySchema).default([]),
        postToolCall: import_zod.z.array(HookEntrySchema).default([])
      }).default({ preToolCall: [], postToolCall: [] }),
      systemPromptAppend: import_zod.z.string().optional(),
      sessionPersistence: import_zod.z.boolean().default(true),
      maxContextTokens: import_zod.z.number().default(1e5),
      temperature: import_zod.z.number().min(0).max(2).default(0.7),
      theme: import_zod.z.enum(["dark", "light", "auto"]).default("auto"),
      logLevel: import_zod.z.enum(["debug", "info", "warn", "error"]).default("info"),
      customEndpoints: import_zod.z.record(import_zod.z.string(), import_zod.z.object({
        baseUrl: import_zod.z.string().url(),
        apiKey: import_zod.z.string().optional(),
        models: import_zod.z.array(import_zod.z.string()).default([])
      })).default({}),
      extendedThinking: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        budgetTokens: import_zod.z.number().min(1024).max(128e3).default(1e4)
      }).default({ enabled: false, budgetTokens: 1e4 }),
      autoLintFix: import_zod.z.boolean().default(false),
      changeReview: import_zod.z.object({
        enabled: import_zod.z.boolean().default(true),
        mode: import_zod.z.enum(["all", "dangerous"]).default("all")
      }).default({ enabled: true, mode: "all" }),
      modelRouting: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        simpleModel: import_zod.z.string().optional(),
        complexModel: import_zod.z.string().optional(),
        simpleProvider: import_zod.z.string().optional(),
        complexProvider: import_zod.z.string().optional()
      }).default({ enabled: false }),
      automations: import_zod.z.object({
        enabled: import_zod.z.boolean().default(false),
        rules: import_zod.z.array(import_zod.z.object({
          name: import_zod.z.string(),
          trigger: import_zod.z.object({
            type: import_zod.z.literal("file_change"),
            patterns: import_zod.z.array(import_zod.z.string())
          }),
          action: import_zod.z.object({
            type: import_zod.z.enum(["run_command", "lint", "typecheck", "test", "notify"]),
            command: import_zod.z.string().optional()
          }),
          enabled: import_zod.z.boolean().default(true),
          debounceMs: import_zod.z.number().optional()
        })).default([])
      }).default({ enabled: false, rules: [] }),
      orchestration: import_zod.z.object({
        enabled: import_zod.z.boolean().default(true),
        maxConcurrentAgents: import_zod.z.number().min(1).max(10).default(3),
        maxTotalAgents: import_zod.z.number().min(2).max(12).default(8),
        costBudget: import_zod.z.number().optional(),
        analysisModel: import_zod.z.string().optional(),
        analysisProvider: import_zod.z.string().optional(),
        forceOrchestrate: import_zod.z.boolean().default(false),
        forceSingleAgent: import_zod.z.boolean().default(false),
        agentOverrides: import_zod.z.record(import_zod.z.string(), import_zod.z.object({
          temperature: import_zod.z.number().optional(),
          preferredModel: import_zod.z.string().optional(),
          maxTurns: import_zod.z.number().nullable().optional()
        })).default({})
      }).default({
        enabled: true,
        maxConcurrentAgents: 3,
        maxTotalAgents: 8,
        forceOrchestrate: false,
        forceSingleAgent: false,
        agentOverrides: {}
      })
    });
  }
});

// src/constants.ts
var CONFIG_DIR_NAME, CONFIG_FILE_NAME, CONTEXT_COMPRESSION_THRESHOLD, RECENT_MESSAGES_TO_KEEP, DEFAULT_MAX_FILE_SIZE_BYTES;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    CONFIG_DIR_NAME = ".omnicode";
    CONFIG_FILE_NAME = "config.json";
    CONTEXT_COMPRESSION_THRESHOLD = 0.9;
    RECENT_MESSAGES_TO_KEEP = 6;
    DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024;
  }
});

// src/config/config-manager.ts
var fs, path, os, ConfigManager;
var init_config_manager = __esm({
  "src/config/config-manager.ts"() {
    "use strict";
    fs = __toESM(require("fs"), 1);
    path = __toESM(require("path"), 1);
    os = __toESM(require("os"), 1);
    init_config_schema();
    init_constants();
    ConfigManager = class {
      config;
      constructor() {
        this.config = this.loadConfig();
      }
      loadConfig() {
        let config = OmniCodeConfigSchema.parse({});
        const userConfigPath = path.join(os.homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME);
        config = this.mergeConfig(config, this.loadFile(userConfigPath));
        const projectConfigPath = this.findProjectConfig();
        if (projectConfigPath) {
          config = this.mergeConfig(config, this.loadFile(projectConfigPath));
        }
        config = this.applyEnvVars(config);
        return config;
      }
      loadFile(filePath) {
        try {
          if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(raw);
          }
        } catch {
        }
        return {};
      }
      findProjectConfig() {
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
      mergeConfig(base, overrides) {
        const merged = { ...base };
        for (const [key, value] of Object.entries(overrides)) {
          if (value !== void 0 && value !== null) {
            if (key === "providers" && typeof value === "object") {
              merged.providers = { ...merged.providers, ...value };
            } else if (key === "hooks" && typeof value === "object") {
              merged.hooks = { ...merged.hooks, ...value };
            } else if (key === "customEndpoints" && typeof value === "object") {
              merged.customEndpoints = { ...merged.customEndpoints, ...value };
            } else {
              merged[key] = value;
            }
          }
        }
        return merged;
      }
      applyEnvVars(config) {
        const envMapping = {
          ANTHROPIC_API_KEY: { path: ["providers", "anthropic", "apiKey"] },
          OPENAI_API_KEY: { path: ["providers", "openai", "apiKey"] },
          GOOGLE_API_KEY: { path: ["providers", "google", "apiKey"] },
          MISTRAL_API_KEY: { path: ["providers", "mistral", "apiKey"] },
          GROQ_API_KEY: { path: ["providers", "groq", "apiKey"] },
          XAI_API_KEY: { path: ["providers", "xai", "apiKey"] },
          OMNICODE_MODEL: { path: ["defaultModel"] },
          OMNICODE_PROVIDER: { path: ["defaultProvider"] },
          OMNICODE_PERMISSION_MODE: { path: ["permissionMode"] }
        };
        for (const [envKey, { path: configPath }] of Object.entries(envMapping)) {
          const value = process.env[envKey];
          if (value) {
            this.deepSet(config, configPath, value);
          }
        }
        return config;
      }
      deepSet(obj, path44, value) {
        let current = obj;
        for (let i = 0; i < path44.length - 1; i++) {
          if (current[path44[i]] === void 0 || current[path44[i]] === null) {
            current[path44[i]] = {};
          }
          current = current[path44[i]];
        }
        current[path44[path44.length - 1]] = value;
      }
      overrideWith(overrides) {
        this.config = this.mergeConfig(this.config, overrides);
      }
      get(key) {
        return this.config[key];
      }
      getAll() {
        return Object.freeze({ ...this.config });
      }
      getProviderApiKey(provider) {
        return this.config.providers[provider]?.apiKey;
      }
      getProviderConfig(provider) {
        return this.config.providers[provider];
      }
    };
  }
});

// src/utils/logger.ts
function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}
var LOG_LEVELS, currentLevel, logger;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    LOG_LEVELS = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    currentLevel = "info";
    logger = {
      debug(message, ...args) {
        if (shouldLog("debug")) {
          console.debug(`[DEBUG] ${message}`, ...args);
        }
      },
      info(message, ...args) {
        if (shouldLog("info")) {
          console.info(`[INFO] ${message}`, ...args);
        }
      },
      warn(message, ...args) {
        if (shouldLog("warn")) {
          console.warn(`[WARN] ${message}`, ...args);
        }
      },
      error(message, ...args) {
        if (shouldLog("error")) {
          console.error(`[ERROR] ${message}`, ...args);
        }
      }
    };
  }
});

// src/providers/provider-registry.ts
var ProviderRegistry;
var init_provider_registry = __esm({
  "src/providers/provider-registry.ts"() {
    "use strict";
    init_logger();
    ProviderRegistry = class {
      providers = /* @__PURE__ */ new Map();
      modelToProvider = /* @__PURE__ */ new Map();
      register(provider) {
        this.providers.set(provider.name, provider);
        for (const model of provider.listModels()) {
          this.modelToProvider.set(model.id, provider.name);
          for (const alias of model.aliases || []) {
            this.modelToProvider.set(alias, provider.name);
          }
        }
      }
      async initializeAll(configs) {
        console.log("[ProviderRegistry] initializeAll called with configs:", Object.keys(configs));
        const promises = [];
        for (const [name, config] of Object.entries(configs)) {
          const provider = this.providers.get(name);
          console.log(`[ProviderRegistry] Provider ${name}: exists=${!!provider}, hasApiKey=${!!config.apiKey}, hasBaseUrl=${!!config.baseUrl}`);
          if (provider && (config.apiKey || config.baseUrl)) {
            console.log(`[ProviderRegistry] Initializing ${name}...`);
            promises.push(
              provider.initialize(config).then(() => {
                console.log(`[ProviderRegistry] Successfully initialized ${name}`);
              }).catch((err) => {
                console.error(`[ProviderRegistry] Failed to initialize ${name}:`, err.message);
                logger.warn(`Failed to initialize provider "${name}": ${err.message}`);
              })
            );
          } else if (provider && !config.apiKey) {
            console.log(`[ProviderRegistry] Skipping ${name} - no API key provided`);
          }
        }
        console.log(`[ProviderRegistry] Initializing ${promises.length} providers...`);
        await Promise.allSettled(promises);
        console.log("[ProviderRegistry] All providers initialized");
      }
      resolveModel(modelId) {
        const providerName = this.modelToProvider.get(modelId);
        if (!providerName)
          return void 0;
        const provider = this.providers.get(providerName);
        if (!provider)
          return void 0;
        const model = provider.getModelInfo(modelId);
        if (!model)
          return void 0;
        return { provider, model };
      }
      getProvider(name) {
        return this.providers.get(name);
      }
      getAvailable() {
        const all = Array.from(this.providers.values());
        const available = all.filter((p) => p.isAvailable());
        console.log(`[ProviderRegistry] getAvailable: ${available.length}/${all.length} providers available`);
        all.forEach((p) => {
          console.log(`[ProviderRegistry]   ${p.name}: isAvailable=${p.isAvailable()}`);
        });
        return available;
      }
      getAllModels() {
        const models = Array.from(this.providers.values()).flatMap((p) => p.listModels());
        console.log(`[ProviderRegistry] getAllModels: ${models.length} models total`);
        return models;
      }
      getAvailableModels() {
        const models = this.getAvailable().flatMap((p) => p.listModels());
        console.log(`[ProviderRegistry] getAvailableModels: ${models.length} models from available providers`);
        return models;
      }
    };
  }
});

// src/providers/base-provider.ts
var BaseProvider;
var init_base_provider = __esm({
  "src/providers/base-provider.ts"() {
    "use strict";
    BaseProvider = class {
      config;
      _available = false;
      async initialize(config) {
        console.log(`[BaseProvider:${this.name}] initialize called`);
        this.config = config;
        try {
          await this.createClient(config);
          this._available = true;
          console.log(`[BaseProvider:${this.name}] initialized successfully, available: true`);
        } catch (error) {
          this._available = false;
          console.error(`[BaseProvider:${this.name}] initialization failed:`, error.message);
          throw error;
        }
      }
      isAvailable() {
        return this._available;
      }
    };
  }
});

// src/providers/model-registry.ts
function findModelInfo(modelId) {
  const direct = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (direct)
    return direct;
  return MODEL_REGISTRY.find((m) => m.aliases?.includes(modelId));
}
function getModelsForProvider(provider) {
  return MODEL_REGISTRY.filter((m) => m.provider === provider);
}
var MODEL_REGISTRY;
var init_model_registry = __esm({
  "src/providers/model-registry.ts"() {
    "use strict";
    MODEL_REGISTRY = [
      // ── Anthropic ──
      // Each thinking-capable model gets two entries:
      //   base  → extendedThinking: false  (user picks this to use the model without thinking)
      //   -thinking → extendedThinking: true, apiId = base model  (user picks this to enable thinking)
      // Claude Opus 4.7
      {
        id: "claude-opus-4-7",
        provider: "anthropic",
        displayName: "Claude Opus 4.7",
        aliases: ["opus", "claude-opus", "opus-4-7"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 }
      },
      {
        id: "claude-opus-4-7-thinking",
        apiId: "claude-opus-4-7",
        provider: "anthropic",
        displayName: "Claude Opus 4.7 (Thinking)",
        aliases: ["opus-thinking", "claude-opus-thinking", "opus-4-7-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 }
      },
      // Claude Opus 4.6
      {
        id: "claude-opus-4-6",
        provider: "anthropic",
        displayName: "Claude Opus 4.6",
        aliases: ["opus-4-6"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 }
      },
      {
        id: "claude-opus-4-6-thinking",
        apiId: "claude-opus-4-6",
        provider: "anthropic",
        displayName: "Claude Opus 4.6 (Thinking)",
        aliases: ["opus-4-6-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 }
      },
      // Claude Sonnet 4.6
      {
        id: "claude-sonnet-4-6",
        provider: "anthropic",
        displayName: "Claude Sonnet 4.6",
        aliases: ["sonnet", "claude-sonnet", "sonnet-4-6"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 }
      },
      {
        id: "claude-sonnet-4-6-thinking",
        apiId: "claude-sonnet-4-6",
        provider: "anthropic",
        displayName: "Claude Sonnet 4.6 (Thinking)",
        aliases: ["sonnet-thinking", "claude-sonnet-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 }
      },
      // Claude Haiku 4.5
      {
        id: "claude-haiku-4-5",
        provider: "anthropic",
        displayName: "Claude Haiku 4.5",
        aliases: ["haiku", "claude-haiku", "haiku-4-5"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 1, outputPerMillion: 5, cacheReadPerMillion: 0.1, cacheWritePerMillion: 1.25 }
      },
      {
        id: "claude-haiku-4-5-thinking",
        apiId: "claude-haiku-4-5",
        provider: "anthropic",
        displayName: "Claude Haiku 4.5 (Thinking)",
        aliases: ["haiku-thinking", "claude-haiku-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 1, outputPerMillion: 5, cacheReadPerMillion: 0.1, cacheWritePerMillion: 1.25 }
      },
      // Legacy models
      {
        id: "claude-opus-4-5",
        provider: "anthropic",
        displayName: "Claude Opus 4.5",
        aliases: ["opus-4-5"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 5, outputPerMillion: 25, cacheReadPerMillion: 0.5, cacheWritePerMillion: 6.25 }
      },
      {
        id: "claude-sonnet-4-5",
        provider: "anthropic",
        displayName: "Claude Sonnet 4.5",
        aliases: ["sonnet-4-5"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 }
      },
      {
        id: "claude-sonnet-4",
        provider: "anthropic",
        displayName: "Claude Sonnet 4",
        aliases: ["sonnet-4"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 }
      },
      {
        id: "claude-opus-4",
        provider: "anthropic",
        displayName: "Claude Opus 4",
        aliases: ["opus-4"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 32e3
        },
        pricing: { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 }
      },
      // Deprecated
      {
        id: "claude-haiku-3",
        provider: "anthropic",
        displayName: "Claude Haiku 3 (Deprecated)",
        aliases: ["haiku-3"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0.25, outputPerMillion: 1.25, cacheReadPerMillion: 0.025, cacheWritePerMillion: 0.3125 }
      },
      // ── OpenAI ──
      {
        id: "gpt-4.1",
        provider: "openai",
        displayName: "GPT-4.1",
        aliases: ["4.1"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 1047576,
          maxOutputTokens: 32768
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 8 }
      },
      {
        id: "gpt-4.1-mini",
        provider: "openai",
        displayName: "GPT-4.1 Mini",
        aliases: ["4.1-mini"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 1047576,
          maxOutputTokens: 32768
        },
        pricing: { inputPerMillion: 0.4, outputPerMillion: 1.6 }
      },
      {
        id: "gpt-4.1-nano",
        provider: "openai",
        displayName: "GPT-4.1 Nano",
        aliases: ["4.1-nano"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 1047576,
          maxOutputTokens: 32768
        },
        pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4 }
      },
      {
        id: "gpt-4o",
        provider: "openai",
        displayName: "GPT-4o",
        aliases: ["4o"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2.5, outputPerMillion: 10 }
      },
      {
        id: "gpt-4o-mini",
        provider: "openai",
        displayName: "GPT-4o Mini",
        aliases: ["4o-mini"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 }
      },
      {
        id: "o1",
        provider: "openai",
        displayName: "o1",
        aliases: ["o1-reasoning"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 15, outputPerMillion: 60 }
      },
      {
        id: "o1-pro",
        provider: "openai",
        displayName: "o1 Pro",
        aliases: ["o1-pro-high"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 150, outputPerMillion: 600 }
      },
      {
        id: "o3-pro",
        provider: "openai",
        displayName: "o3 Pro",
        aliases: ["o3-pro-high"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 20, outputPerMillion: 80 }
      },
      {
        id: "o3-mini",
        provider: "openai",
        displayName: "o3 Mini",
        aliases: ["o3m"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 }
      },
      {
        id: "o3-deep-research",
        provider: "openai",
        displayName: "o3 Deep Research",
        aliases: ["o3-dr", "deep-research"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 10, outputPerMillion: 40 }
      },
      {
        id: "o4-mini-high",
        provider: "openai",
        displayName: "o4 Mini High",
        aliases: ["o4m-high", "o4-mini-high"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 }
      },
      {
        id: "o4-mini-deep-research",
        provider: "openai",
        displayName: "o4 Mini Deep Research",
        aliases: ["o4m-dr", "o4-mini-dr"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 1e5
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 8 }
      },
      // ── GPT-5.4 Family (Latest Flagship) ──
      {
        id: "gpt-5.4",
        provider: "openai",
        displayName: "GPT-5.4",
        aliases: ["5.4", "gpt-5-4"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 1047576,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 2.5, outputPerMillion: 15 }
      },
      {
        id: "gpt-5.4-pro",
        provider: "openai",
        displayName: "GPT-5.4 Pro",
        aliases: ["5.4-pro", "gpt-5-4-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 1047576,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 30, outputPerMillion: 180 }
      },
      {
        id: "gpt-5.4-mini",
        provider: "openai",
        displayName: "GPT-5.4 Mini",
        aliases: ["5.4-mini", "gpt-5-4-mini"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 1047576,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 0.75, outputPerMillion: 4.5 }
      },
      {
        id: "gpt-5.4-nano",
        provider: "openai",
        displayName: "GPT-5.4 Nano",
        aliases: ["5.4-nano", "gpt-5-4-nano"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 1047576,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 1.25 }
      },
      // ── GPT-5 Family (Reasoning Models) ──
      {
        id: "gpt-5",
        provider: "openai",
        displayName: "GPT-5",
        aliases: ["5", "gpt-5-base"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 1.25, outputPerMillion: 10 }
      },
      {
        id: "gpt-5-pro",
        provider: "openai",
        displayName: "GPT-5 Pro",
        aliases: ["5-pro", "gpt-5-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 15, outputPerMillion: 120 }
      },
      {
        id: "gpt-5-mini",
        provider: "openai",
        displayName: "GPT-5 Mini",
        aliases: ["5-mini", "gpt-5-mini"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 0.25, outputPerMillion: 2 }
      },
      {
        id: "gpt-5-nano",
        provider: "openai",
        displayName: "GPT-5 Nano",
        aliases: ["5-nano", "gpt-5-nano"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 0.05, outputPerMillion: 0.4 }
      },
      {
        id: "gpt-5.1",
        provider: "openai",
        displayName: "GPT-5.1",
        aliases: ["5.1", "gpt-5-1"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 1.25, outputPerMillion: 10 }
      },
      {
        id: "gpt-5.2",
        provider: "openai",
        displayName: "GPT-5.2",
        aliases: ["5.2", "gpt-5-2"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 1.75, outputPerMillion: 14 }
      },
      {
        id: "gpt-5.2-pro",
        provider: "openai",
        displayName: "GPT-5.2 Pro",
        aliases: ["5.2-pro", "gpt-5-2-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 4e5,
          maxOutputTokens: 128e3
        },
        pricing: { inputPerMillion: 21, outputPerMillion: 168 }
      },
      // ── Google Gemini ──
      // Per https://ai.google.dev/gemini-api/docs/pricing
      // Note: Gemini 2.0 Flash/Flash-Lite are deprecated (shutdown June 1, 2026)
      // Gemini 2.5 Pro — flagship reasoning model (output includes thinking tokens)
      {
        id: "gemini-2.5-pro",
        provider: "google",
        displayName: "Gemini 2.5 Pro",
        aliases: ["gemini-pro", "gemini", "gemini-2-5-pro", "gemini-2.5-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 1.25, outputPerMillion: 10, cacheReadPerMillion: 0.125 }
      },
      // Gemini 2.5 Flash — hybrid reasoning with thinking budget
      {
        id: "gemini-2.5-flash",
        provider: "google",
        displayName: "Gemini 2.5 Flash",
        aliases: ["gemini-flash", "flash", "gemini-2-5-flash", "gemini-2.5-flash"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 0.3, outputPerMillion: 2.5, cacheReadPerMillion: 0.03 }
      },
      // Gemini 2.5 Flash-Lite — most cost-effective
      {
        id: "gemini-2.5-flash-lite",
        provider: "google",
        displayName: "Gemini 2.5 Flash-Lite",
        aliases: ["gemini-flash-lite", "flash-lite", "gemini-2-5-flash-lite"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4, cacheReadPerMillion: 0.01 }
      },
      // Gemini 3 Flash Preview — speed-focused with thinking
      {
        id: "gemini-3-flash-preview",
        provider: "google",
        displayName: "Gemini 3 Flash Preview",
        aliases: ["gemini-3-flash", "gemini3-flash"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 0.5, outputPerMillion: 3, cacheReadPerMillion: 0.05 }
      },
      // Gemini 3.1 Pro Preview — world-class multimodal (output includes thinking)
      {
        id: "gemini-3.1-pro-preview",
        provider: "google",
        displayName: "Gemini 3.1 Pro Preview",
        aliases: ["gemini-3-pro", "gemini3-pro", "gemini-3.1-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 12, cacheReadPerMillion: 0.2 }
      },
      // Gemini 3.1 Flash-Lite Preview — cost-effective for agent tasks
      {
        id: "gemini-3.1-flash-lite-preview",
        provider: "google",
        displayName: "Gemini 3.1 Flash-Lite Preview",
        aliases: ["gemini-3.1-flash-lite", "gemini3-flash-lite"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 64e3
        },
        pricing: { inputPerMillion: 0.25, outputPerMillion: 1.5, cacheReadPerMillion: 0.025 }
      },
      // Legacy: Gemini 2.0 Pro (deprecated, shutdown June 1, 2026)
      {
        id: "gemini-2.0-pro",
        provider: "google",
        displayName: "Gemini 2.0 Pro (Deprecated)",
        aliases: ["gemini-2-0-pro"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 1.25, outputPerMillion: 5 }
      },
      // Legacy: Gemini 2.0 Flash (deprecated, shutdown June 1, 2026)
      {
        id: "gemini-2.0-flash",
        provider: "google",
        displayName: "Gemini 2.0 Flash (Deprecated)",
        aliases: ["gemini-2-0-flash"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 1e6,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4 }
      },
      // ── Mistral ──
      {
        id: "mistral-large-latest",
        provider: "mistral",
        displayName: "Mistral Large",
        aliases: ["mistral-large", "mistral"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6 }
      },
      {
        id: "codestral-latest",
        provider: "mistral",
        displayName: "Codestral",
        aliases: ["codestral"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 256e3,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.3, outputPerMillion: 0.9 }
      },
      // ── Groq ──
      {
        id: "llama-3.3-70b-versatile",
        provider: "groq",
        displayName: "Llama 3.3 70B (Groq)",
        aliases: ["llama-70b", "groq-llama"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 32768
        },
        pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 }
      },
      {
        id: "mixtral-8x7b-32768",
        provider: "groq",
        displayName: "Mixtral 8x7B (Groq)",
        aliases: ["mixtral", "groq-mixtral"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 32768,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0.24, outputPerMillion: 0.24 }
      },
      // ── xAI Grok ──
      // Per official docs: https://docs.x.ai/docs/guides/reasoning
      // Only grok-3-mini models support reasoning_effort. grok-3 and grok-3-fast do NOT.
      // Each mini model gets a base entry (no thinking) + a thinking variant.
      // Grok 3 — deep domain knowledge, no reasoning_effort support
      // Per https://docs.x.ai/developers/models - Updated to Grok 4 pricing
      {
        id: "grok-3-latest",
        provider: "xai",
        displayName: "Grok 3",
        aliases: ["grok", "grok-3", "grok3", "grok-3-beta"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 }
      },
      {
        id: "grok-3-fast-latest",
        provider: "xai",
        displayName: "Grok 3 Fast",
        aliases: ["grok-fast", "grok-3-fast", "grok3-fast", "grok-3-fast-beta"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      // Grok 3 Mini — supports reasoning_effort; split into base and thinking variants
      // Updated per https://docs.x.ai/developers/models - Grok 4 specs
      {
        id: "grok-3-mini-latest",
        provider: "xai",
        displayName: "Grok 3 Mini",
        aliases: ["grok-mini", "grok-3-mini", "grok3-mini", "grok-3-mini-beta"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      {
        id: "grok-3-mini-latest-thinking",
        apiId: "grok-3-mini-latest",
        provider: "xai",
        displayName: "Grok 3 Mini (Thinking)",
        aliases: ["grok-mini-thinking", "grok-3-mini-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      {
        id: "grok-3-mini-fast-latest",
        provider: "xai",
        displayName: "Grok 3 Mini Fast",
        aliases: ["grok-mini-fast", "grok-3-mini-fast", "grok3-mini-fast", "grok-3-mini-fast-beta"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      {
        id: "grok-3-mini-fast-latest-thinking",
        apiId: "grok-3-mini-fast-latest",
        provider: "xai",
        displayName: "Grok 3 Mini Fast (Thinking)",
        aliases: ["grok-mini-fast-thinking", "grok-3-mini-fast-thinking"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      // Grok 2 — vision and general chat
      {
        id: "grok-2-1212",
        provider: "xai",
        displayName: "Grok 2",
        aliases: ["grok-2", "grok2", "grok-2-latest"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 131072,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 10 }
      },
      {
        id: "grok-2-vision-1212",
        provider: "xai",
        displayName: "Grok 2 Vision",
        aliases: ["grok-2-vision", "grok2-vision", "grok-2-vision-latest"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 8192,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 10 }
      },
      // Grok 4 — latest generation with large context window
      {
        id: "grok-4.20-0309-reasoning",
        provider: "xai",
        displayName: "Grok 4.20 Reasoning",
        aliases: ["grok-4.20-reasoning", "grok-4-20-reasoning"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 }
      },
      {
        id: "grok-4.20-0309-non-reasoning",
        provider: "xai",
        displayName: "Grok 4.20",
        aliases: ["grok-4.20", "grok-4-20", "grok-4.20-non-reasoning"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 }
      },
      {
        id: "grok-4-1-fast-reasoning",
        provider: "xai",
        displayName: "Grok 4.1 Fast Reasoning",
        aliases: ["grok-4.1-reasoning", "grok-4-1-reasoning"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      {
        id: "grok-4-1-fast-non-reasoning",
        provider: "xai",
        displayName: "Grok 4.1 Fast",
        aliases: ["grok-4.1", "grok-4-1", "grok-4.1-fast"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5, cacheReadPerMillion: 0.05 }
      },
      {
        id: "grok-4.20-multi-agent-0309",
        provider: "xai",
        displayName: "Grok 4.20 Multi-Agent",
        aliases: ["grok-4.20-multi-agent", "grok-multi-agent"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6, cacheReadPerMillion: 0.2 }
      },
      // Grok Image Generation Models
      {
        id: "grok-imagine-image-pro",
        provider: "xai",
        displayName: "Grok Image Pro",
        aliases: ["grok-image-pro", "grok-imagine-pro"],
        capabilities: {
          streaming: false,
          toolUse: false,
          vision: true,
          jsonMode: false,
          systemPrompt: false,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 8192,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0 }
      },
      {
        id: "grok-imagine-image",
        provider: "xai",
        displayName: "Grok Image",
        aliases: ["grok-image", "grok-imagine"],
        capabilities: {
          streaming: false,
          toolUse: false,
          vision: true,
          jsonMode: false,
          systemPrompt: false,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 8192,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0 }
      },
      // Grok Video Generation Model
      {
        id: "grok-imagine-video",
        provider: "xai",
        displayName: "Grok Video",
        aliases: ["grok-video", "grok-imagine-video"],
        capabilities: {
          streaming: false,
          toolUse: false,
          vision: true,
          jsonMode: false,
          systemPrompt: false,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 8192,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0 }
      },
      // ── Moonshot / Kimi ──
      {
        id: "kimi-k2.5",
        provider: "moonshot",
        displayName: "Kimi K2.5",
        aliases: ["kimi", "k2.5", "kimi-k2"],
        fixedTemperature: 1,
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 256e3,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.5, outputPerMillion: 2 }
      },
      {
        id: "kimi-k1.6",
        provider: "moonshot",
        displayName: "Kimi K1.6",
        aliases: ["k1.6", "kimi-k1"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 256e3,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.5, outputPerMillion: 2 }
      },
      {
        id: "kimi-k1.6-long-context",
        provider: "moonshot",
        displayName: "Kimi K1.6 Long Context",
        aliases: ["k1.6-long", "kimi-long"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: true,
          maxContextWindow: 2e6,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.5, outputPerMillion: 2 }
      },
      {
        id: "kimi-moonshot-v1",
        provider: "moonshot",
        displayName: "Kimi Moonshot v1",
        aliases: ["moonshot", "kimi-v1"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0.5, outputPerMillion: 2 }
      },
      // ── AWS Bedrock ──
      {
        id: "anthropic.claude-sonnet-4-5-v1",
        provider: "bedrock",
        displayName: "Claude Sonnet 4.5 (Bedrock)",
        aliases: ["bedrock-sonnet", "bedrock-claude-sonnet"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15 }
      },
      {
        id: "anthropic.claude-haiku-3-5-v1",
        provider: "bedrock",
        displayName: "Claude Haiku 3.5 (Bedrock)",
        aliases: ["bedrock-haiku", "bedrock-claude-haiku"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0.8, outputPerMillion: 4 }
      },
      {
        id: "meta.llama3-3-70b-instruct-v1:0",
        provider: "bedrock",
        displayName: "Llama 3.3 70B (Bedrock)",
        aliases: ["bedrock-llama", "bedrock-llama-70b"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 4096
        },
        pricing: { inputPerMillion: 0.72, outputPerMillion: 0.72 }
      },
      {
        id: "mistral.mistral-large-2411-v1:0",
        provider: "bedrock",
        displayName: "Mistral Large (Bedrock)",
        aliases: ["bedrock-mistral", "bedrock-mistral-large"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 128e3,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 6 }
      }
    ];
  }
});

// src/providers/tool-call-normalizer.ts
var ToolCallNormalizer;
var init_tool_call_normalizer = __esm({
  "src/providers/tool-call-normalizer.ts"() {
    "use strict";
    ToolCallNormalizer = class {
      /** Convert unified tool definitions to Anthropic format */
      static toAnthropic(tools) {
        return tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema
        }));
      }
      /** Convert unified tool definitions to OpenAI/Groq/xAI/Mistral format */
      static toOpenAI(tools) {
        return tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema
          }
        }));
      }
      /** Convert unified tool definitions to Google Gemini format */
      static toGoogle(tools) {
        return [{
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: this.jsonSchemaToGoogleSchema(t.inputSchema)
          }))
        }];
      }
      /** Convert unified tool definitions to AWS Bedrock format */
      static toBedrock(tools) {
        return {
          tools: tools.map((t) => ({
            toolSpec: {
              name: t.name,
              description: t.description,
              inputSchema: { json: t.inputSchema }
            }
          }))
        };
      }
      /** Parse a native tool call from any provider back to our unified format */
      static parseToolCall(provider, nativeToolCall) {
        switch (provider) {
          case "anthropic":
            return {
              type: "tool_use",
              id: nativeToolCall.id,
              name: nativeToolCall.name,
              input: nativeToolCall.input || {}
            };
          case "openai":
          case "groq":
          case "xai":
          case "mistral":
          case "openai-compatible":
            return {
              type: "tool_use",
              id: nativeToolCall.id,
              name: nativeToolCall.function.name,
              input: JSON.parse(nativeToolCall.function.arguments || "{}")
            };
          case "google":
            return {
              type: "tool_use",
              id: crypto.randomUUID(),
              name: nativeToolCall.name,
              input: nativeToolCall.args || {}
            };
          case "bedrock":
            return {
              type: "tool_use",
              id: nativeToolCall.toolUseId || crypto.randomUUID(),
              name: nativeToolCall.name || "",
              input: nativeToolCall.input || {}
            };
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      }
      /** Google uses a slightly different schema format */
      static jsonSchemaToGoogleSchema(schema) {
        const cleaned = { ...schema };
        delete cleaned["$schema"];
        delete cleaned["$ref"];
        delete cleaned["definitions"];
        delete cleaned["$defs"];
        return cleaned;
      }
    };
  }
});

// src/providers/anthropic/anthropic-provider.ts
var import_sdk, AnthropicProvider;
var init_anthropic_provider = __esm({
  "src/providers/anthropic/anthropic-provider.ts"() {
    "use strict";
    import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
    init_base_provider();
    init_model_registry();
    init_tool_call_normalizer();
    AnthropicProvider = class extends BaseProvider {
      name = "anthropic";
      displayName = "Anthropic";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("anthropic");
      }
      async createClient(config) {
        if (!config.apiKey) {
          throw new Error("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.");
        }
        this.client = new import_sdk.default({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
          maxRetries: config.maxRetries ?? 3,
          timeout: config.timeout ?? 6e4
        });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toAnthropic(tools);
      }
      formatMessages(messages) {
        const idMap = this.buildToolIdMap(messages);
        return messages.filter((m) => m.role !== "system").map((msg) => this.convertMessage(msg, idMap));
      }
      /**
       * Anthropic requires tool_use IDs to match ^[a-zA-Z0-9_-]+$.
       * When history originates from another provider (e.g. after a model switch),
       * IDs may contain dots, colons, or other characters that Anthropic rejects.
       * Build a remapping table so both tool_use and tool_result references stay in sync.
       */
      buildToolIdMap(messages) {
        const idMap = /* @__PURE__ */ new Map();
        const pattern = /^[a-zA-Z0-9_-]+$/;
        for (const msg of messages) {
          if (msg.role !== "assistant" || !Array.isArray(msg.content))
            continue;
          for (const block of msg.content) {
            if (block.type === "tool_use" && !pattern.test(block.id)) {
              idMap.set(block.id, crypto.randomUUID());
            }
          }
        }
        return idMap;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const response = await this.client.messages.create({
          ...params,
          stream: false
        });
        return this.parseResponse(response, request2.model);
      }
      async *streamComplete(request2) {
        console.log("[AnthropicProvider] streamComplete called with model:", request2.model, "thinking:", request2.thinking);
        const params = this.buildParams(request2);
        console.log("[AnthropicProvider] Final params - model:", params.model, "has thinking:", !!params.thinking, "thinkingConfig:", params.thinking);
        const stream = this.client.messages.stream({
          ...params
        });
        let currentToolId;
        for await (const event of stream) {
          switch (event.type) {
            case "content_block_start":
              if (event.content_block.type === "tool_use") {
                currentToolId = event.content_block.id;
                yield {
                  type: "tool_use_start",
                  toolUse: {
                    id: event.content_block.id,
                    name: event.content_block.name
                  }
                };
              } else if (event.content_block.type === "thinking") {
                yield { type: "thinking", text: "" };
              }
              break;
            case "content_block_delta":
              if (event.delta.type === "text_delta") {
                yield { type: "text", text: event.delta.text };
              } else if (event.delta.type === "input_json_delta") {
                yield {
                  type: "tool_use_delta",
                  toolUse: { id: currentToolId, inputDelta: event.delta.partial_json }
                };
              } else if (event.delta.type === "thinking_delta") {
                yield { type: "thinking", text: event.delta.thinking };
              }
              break;
            case "content_block_stop":
              if (currentToolId) {
                yield { type: "tool_use_end", toolUse: { id: currentToolId } };
                currentToolId = void 0;
              }
              break;
            case "message_delta":
              if (event.usage) {
                yield {
                  type: "usage",
                  usage: {
                    inputTokens: 0,
                    outputTokens: event.usage.output_tokens,
                    cacheReadTokens: event.usage.cache_read_tokens,
                    cacheWriteTokens: event.usage.cache_creation_tokens
                  }
                };
              }
              break;
            case "message_start":
              if (event.message.usage) {
                yield {
                  type: "usage",
                  usage: {
                    inputTokens: event.message.usage.input_tokens,
                    outputTokens: 0,
                    cacheReadTokens: event.message.usage.cache_read_tokens,
                    cacheWriteTokens: event.message.usage.cache_creation_tokens
                  }
                };
              }
              break;
            case "message_stop":
              yield { type: "done" };
              break;
          }
        }
      }
      async countTokens(messages, model) {
        let totalChars = 0;
        for (const msg of messages) {
          if (typeof msg.content === "string") {
            totalChars += msg.content.length;
          } else {
            for (const block of msg.content) {
              if (block.type === "text")
                totalChars += block.text.length;
              else if (block.type === "tool_use")
                totalChars += JSON.stringify(block.input).length;
              else if (block.type === "tool_result") {
                totalChars += typeof block.content === "string" ? block.content.length : JSON.stringify(block.content).length;
              }
            }
          }
        }
        return Math.ceil(totalChars / 3);
      }
      buildParams(request2) {
        const modelInfo = this.getModelInfo(request2.model);
        const canonicalModelId = modelInfo?.apiId || modelInfo?.id || request2.model;
        const params = {
          model: canonicalModelId,
          messages: this.formatMessages(request2.messages),
          max_tokens: request2.maxTokens ?? 8192
        };
        if (request2.systemPrompt) {
          params.system = request2.systemPrompt;
        }
        if (request2.tools && request2.tools.length > 0) {
          params.tools = this.formatTools(request2.tools);
        }
        if (request2.temperature !== void 0) {
          params.temperature = request2.temperature;
        }
        if (request2.stopSequences) {
          params.stop_sequences = request2.stopSequences;
        }
        if (request2.topP !== void 0) {
          params.top_p = request2.topP;
        }
        const thinkingEnabled = request2.thinking?.enabled && modelInfo?.capabilities.extendedThinking;
        if (thinkingEnabled) {
          const requestedBudget = request2.thinking?.budgetTokens ?? 8e3;
          const minMaxTokens = requestedBudget + 2e3;
          if (params.max_tokens < minMaxTokens) {
            params.max_tokens = minMaxTokens;
          }
          const budgetTokens = Math.min(requestedBudget, Math.floor(params.max_tokens * 0.8));
          console.log("[AnthropicProvider] Enabling thinking:", {
            canonicalModelId,
            maxTokens: params.max_tokens,
            budgetTokens
          });
          params.thinking = {
            type: "enabled",
            budget_tokens: budgetTokens
          };
          params.temperature = 1;
        }
        console.log("[AnthropicProvider] Final params:", {
          requestedModel: request2.model,
          canonicalModelId,
          modelInfoFound: !!modelInfo,
          modelExtendedThinking: modelInfo?.capabilities?.extendedThinking,
          thinkingEnabled,
          maxTokens: params.max_tokens,
          hasThinkingBlock: !!params.thinking
        });
        return params;
      }
      parseResponse(response, model) {
        const content = response.content.map((block) => {
          if (block.type === "text") {
            return { type: "text", text: block.text };
          } else if (block.type === "tool_use") {
            return {
              type: "tool_use",
              id: block.id,
              name: block.name,
              input: block.input
            };
          }
          return { type: "text", text: "" };
        });
        const stopReason = response.stop_reason === "tool_use" ? "tool_use" : response.stop_reason === "max_tokens" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: response.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "anthropic",
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              cacheReadTokens: response.usage.cache_read_tokens,
              cacheWriteTokens: response.usage.cache_creation_tokens,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cacheReadTokens: response.usage.cache_read_tokens,
            cacheWriteTokens: response.usage.cache_creation_tokens
          }
        };
      }
      convertMessage(msg, idMap = /* @__PURE__ */ new Map()) {
        if (typeof msg.content === "string") {
          return {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content
          };
        }
        const blocks = [];
        for (const block of msg.content) {
          switch (block.type) {
            case "text":
              blocks.push({ type: "text", text: block.text });
              break;
            case "tool_use":
              blocks.push({
                type: "tool_use",
                id: idMap.get(block.id) ?? block.id,
                name: block.name,
                input: block.input
              });
              break;
            case "tool_result":
              blocks.push({
                type: "tool_result",
                tool_use_id: idMap.get(block.toolUseId) ?? block.toolUseId,
                content: typeof block.content === "string" ? block.content : block.content.map((b) => {
                  if (b.type === "text")
                    return { type: "text", text: b.text };
                  return { type: "text", text: JSON.stringify(b) };
                }),
                is_error: block.isError
              });
              break;
            case "image":
              blocks.push({
                type: "image",
                source: {
                  type: block.source.type,
                  media_type: block.source.mediaType,
                  data: block.source.data
                }
              });
              break;
          }
        }
        return {
          role: msg.role === "assistant" ? "assistant" : "user",
          content: blocks
        };
      }
    };
  }
});

// src/core/message-types.ts
function getTextContent(message) {
  if (typeof message.content === "string")
    return message.content;
  return message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}
function getToolUseBlocks(message) {
  if (typeof message.content === "string")
    return [];
  return message.content.filter((b) => b.type === "tool_use");
}
function getToolResultBlocks(message) {
  if (typeof message.content === "string")
    return [];
  return message.content.filter((b) => b.type === "tool_result");
}
function getToolResultText(block) {
  const content = typeof block.content === "string" ? block.content : block.content.map((item) => {
    if (item.type === "text") {
      return item.text;
    }
    return JSON.stringify(item);
  }).join("\n");
  return block.isError ? `Tool execution failed: ${content}` : content;
}
var init_message_types = __esm({
  "src/core/message-types.ts"() {
    "use strict";
  }
});

// src/providers/openai/openai-provider.ts
var import_openai, OpenAIProvider;
var init_openai_provider = __esm({
  "src/providers/openai/openai-provider.ts"() {
    "use strict";
    import_openai = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    OpenAIProvider = class extends BaseProvider {
      name = "openai";
      displayName = "OpenAI";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("openai");
      }
      async createClient(config) {
        if (!config.apiKey) {
          throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable.");
        }
        this.client = new import_openai.default({
          apiKey: config.apiKey,
          organization: config.organizationId,
          baseURL: config.baseUrl,
          maxRetries: config.maxRetries ?? 3,
          timeout: config.timeout ?? 6e4
        });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        const knownToolCallIds = /* @__PURE__ */ new Set();
        for (const msg of messages) {
          if (msg.role === "assistant") {
            for (const tc of getToolUseBlocks(msg)) {
              if (tc.id)
                knownToolCallIds.add(tc.id);
            }
          }
        }
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              result.push({
                role: "assistant",
                content: text || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.input)
                  }
                }))
              });
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId))
                continue;
              if (typeof tr.content !== "string" && Array.isArray(tr.content)) {
                const hasImages = tr.content.some((b) => b.type === "image");
                if (hasImages) {
                  const parts = [];
                  for (const block of tr.content) {
                    if (block.type === "text") {
                      parts.push({ type: "text", text: block.text });
                    } else if (block.type === "image") {
                      parts.push({
                        type: "image_url",
                        image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` }
                      });
                    }
                  }
                  result.push({ role: "user", content: parts });
                  continue;
                }
              }
              result.push({
                role: "tool",
                tool_call_id: tr.toolUseId,
                content: getToolResultText(tr)
              });
            }
          } else {
            if (typeof msg.content !== "string") {
              const hasImages = msg.content.some((b) => b.type === "image");
              if (hasImages) {
                const parts = [];
                for (const block of msg.content) {
                  if (block.type === "text")
                    parts.push({ type: "text", text: block.text });
                  else if (block.type === "image") {
                    parts.push({
                      type: "image_url",
                      image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` }
                    });
                  }
                }
                result.push({ role: "user", content: parts });
                continue;
              }
            }
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const response = await this.client.chat.completions.create({
          ...params,
          stream: false
        });
        return this.parseNonStreamResponse(response, request2.model);
      }
      async *streamComplete(request2) {
        const params = this.buildParams(request2);
        const stream = await this.client.chat.completions.create({
          ...params,
          stream: true,
          stream_options: { include_usage: true }
        });
        const toolBuffers = /* @__PURE__ */ new Map();
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) {
            if (chunk.usage) {
              yield {
                type: "usage",
                usage: {
                  inputTokens: chunk.usage.prompt_tokens || 0,
                  outputTokens: chunk.usage.completion_tokens || 0,
                  cacheReadTokens: chunk.usage?.prompt_tokens_details?.cached_tokens
                }
              };
            }
            continue;
          }
          if (delta.content) {
            yield { type: "text", text: delta.content };
          }
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                const id = tc.id || crypto.randomUUID();
                toolBuffers.set(tc.index, {
                  id,
                  name: tc.function.name,
                  args: tc.function.arguments || ""
                });
                yield {
                  type: "tool_use_start",
                  toolUse: { id, name: tc.function.name }
                };
                if (tc.function.arguments) {
                  yield {
                    type: "tool_use_delta",
                    toolUse: { id, inputDelta: tc.function.arguments }
                  };
                }
              } else if (tc.function?.arguments) {
                const buf = toolBuffers.get(tc.index);
                if (buf) {
                  buf.args += tc.function.arguments;
                  yield {
                    type: "tool_use_delta",
                    toolUse: { id: buf.id, inputDelta: tc.function.arguments }
                  };
                }
              }
            }
          }
          if (chunk.choices?.[0]?.finish_reason) {
            for (const [, buf] of toolBuffers) {
              yield { type: "tool_use_end", toolUse: { id: buf.id } };
            }
            yield { type: "done" };
          }
        }
      }
      async countTokens(messages, _model) {
        let totalChars = 0;
        for (const msg of messages) {
          if (typeof msg.content === "string")
            totalChars += msg.content.length;
          else {
            for (const block of msg.content) {
              if (block.type === "text")
                totalChars += block.text.length;
              else if (block.type === "tool_use")
                totalChars += JSON.stringify(block.input).length;
              else if (block.type === "tool_result") {
                totalChars += typeof block.content === "string" ? block.content.length : JSON.stringify(block.content).length;
              }
            }
          }
        }
        return Math.ceil(totalChars / 3);
      }
      buildParams(request2) {
        const params = {
          model: request2.model,
          messages: this.formatMessages(request2.messages)
        };
        if (request2.systemPrompt) {
          params.messages = [
            { role: "system", content: request2.systemPrompt },
            ...params.messages
          ];
        }
        if (request2.tools && request2.tools.length > 0) {
          params.tools = this.formatTools(request2.tools);
        }
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        if (request2.topP !== void 0)
          params.top_p = request2.topP;
        if (request2.thinking?.enabled && (request2.model.startsWith("o3") || request2.model.startsWith("o4") || request2.model.startsWith("gpt-5"))) {
          params.reasoning_effort = request2.thinking.effort || "high";
          delete params.temperature;
        }
        return params;
      }
      parseNonStreamResponse(response, model) {
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content) {
          content.push({ type: "text", text: choice.message.content });
        }
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments || "{}")
            });
          }
        }
        const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: response.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "openai",
              inputTokens: response.usage?.prompt_tokens || 0,
              outputTokens: response.usage?.completion_tokens || 0,
              cacheReadTokens: response.usage?.prompt_tokens_details?.cached_tokens,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            cacheReadTokens: response.usage?.prompt_tokens_details?.cached_tokens
          }
        };
      }
    };
  }
});

// src/providers/google/google-provider.ts
var import_generative_ai, GoogleProvider;
var init_google_provider = __esm({
  "src/providers/google/google-provider.ts"() {
    "use strict";
    import_generative_ai = require("@google/generative-ai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    GoogleProvider = class extends BaseProvider {
      name = "google";
      displayName = "Google (Gemini)";
      genAI;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("google");
      }
      async createClient(config) {
        if (!config.apiKey) {
          throw new Error("Google API key is required. Set GOOGLE_API_KEY environment variable.");
        }
        this.genAI = new import_generative_ai.GoogleGenerativeAI(config.apiKey);
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toGoogle(tools);
      }
      formatMessages(messages) {
        const result = [];
        for (const msg of messages) {
          if (msg.role === "system")
            continue;
          if (msg.role === "assistant") {
            const parts = [];
            const text = getTextContent(msg);
            if (text)
              parts.push({ text });
            for (const tc of getToolUseBlocks(msg)) {
              parts.push({ functionCall: { name: tc.name, args: tc.input } });
            }
            result.push({ role: "model", parts });
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            const parts = toolResults.map((tr) => ({
              functionResponse: {
                name: tr.toolUseId,
                // Google uses name, not ID
                response: {
                  content: getToolResultText(tr),
                  isError: !!tr.isError
                }
              }
            }));
            result.push({ role: "user", parts });
          } else {
            result.push({ role: "user", parts: [{ text: getTextContent(msg) }] });
          }
        }
        return result;
      }
      async complete(request2) {
        const model = this.getModel(request2);
        const result = await model.generateContent({
          contents: this.formatMessages(request2.messages),
          ...request2.tools?.length ? { tools: this.formatTools(request2.tools) } : {}
        });
        const response = result.response;
        const content = [];
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if ("text" in part && part.text) {
            content.push({ type: "text", text: part.text });
          }
          if ("functionCall" in part && part.functionCall) {
            content.push({
              type: "tool_use",
              id: crypto.randomUUID(),
              name: part.functionCall.name,
              input: part.functionCall.args || {}
            });
          }
        }
        const hasToolCalls = content.some((c) => c.type === "tool_use");
        const stopReason = hasToolCalls ? "tool_use" : "end_turn";
        return {
          message: {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model: request2.model,
              provider: "google",
              inputTokens: response.usageMetadata?.promptTokenCount || 0,
              outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usageMetadata?.promptTokenCount || 0,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 0
          }
        };
      }
      async *streamComplete(request2) {
        const model = this.getModel(request2);
        const result = await model.generateContentStream({
          contents: this.formatMessages(request2.messages),
          ...request2.tools?.length ? { tools: this.formatTools(request2.tools) } : {}
        });
        for await (const chunk of result.stream) {
          for (const part of chunk.candidates?.[0]?.content?.parts || []) {
            if ("text" in part && part.text) {
              yield { type: "text", text: part.text };
            }
            if ("functionCall" in part && part.functionCall) {
              const id = crypto.randomUUID();
              yield {
                type: "tool_use_start",
                toolUse: { id, name: part.functionCall.name }
              };
              yield {
                type: "tool_use_delta",
                toolUse: { id, inputDelta: JSON.stringify(part.functionCall.args || {}) }
              };
              yield { type: "tool_use_end", toolUse: { id } };
            }
          }
          if (chunk.usageMetadata) {
            yield {
              type: "usage",
              usage: {
                inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
              }
            };
          }
        }
        yield { type: "done" };
      }
      async countTokens(messages, model) {
        try {
          const genModel = this.genAI.getGenerativeModel({ model });
          const result = await genModel.countTokens({
            contents: this.formatMessages(messages)
          });
          return result.totalTokens;
        } catch {
          let chars = 0;
          for (const msg of messages) {
            chars += typeof msg.content === "string" ? msg.content.length : JSON.stringify(msg.content).length;
          }
          return Math.ceil(chars / 3);
        }
      }
      getModel(request2) {
        const config = {};
        if (request2.temperature !== void 0)
          config.temperature = request2.temperature;
        if (request2.maxTokens)
          config.maxOutputTokens = request2.maxTokens;
        if (request2.topP !== void 0)
          config.topP = request2.topP;
        return this.genAI.getGenerativeModel({
          model: request2.model,
          generationConfig: config,
          ...request2.systemPrompt ? { systemInstruction: request2.systemPrompt } : {}
        });
      }
    };
  }
});

// src/providers/mistral/mistral-provider.ts
var import_mistralai, MistralProvider;
var init_mistral_provider = __esm({
  "src/providers/mistral/mistral-provider.ts"() {
    "use strict";
    import_mistralai = require("@mistralai/mistralai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    MistralProvider = class extends BaseProvider {
      name = "mistral";
      displayName = "Mistral";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("mistral");
      }
      async createClient(config) {
        if (!config.apiKey)
          throw new Error("Mistral API key is required. Set MISTRAL_API_KEY environment variable.");
        this.client = new import_mistralai.Mistral({ apiKey: config.apiKey });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              result.push({
                role: "assistant",
                content: text || "",
                toolCalls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.input) } }))
              });
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              result.push({ role: "tool", toolCallId: tr.toolUseId, content: getToolResultText(tr) });
            }
          } else {
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const response = await this.client.chat.complete(params);
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content)
          content.push({ type: "text", text: choice.message.content });
        if (choice.message.toolCalls) {
          for (const tc of choice.message.toolCalls) {
            content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || "{}") });
          }
        }
        const stopReason = choice.finishReason === "tool_calls" ? "tool_use" : choice.finishReason === "length" ? "max_tokens" : "end_turn";
        return {
          message: { id: response.id, role: "assistant", content, timestamp: Date.now(), metadata: { model: request2.model, provider: "mistral", inputTokens: response.usage?.promptTokens || 0, outputTokens: response.usage?.completionTokens || 0, stopReason } },
          stopReason,
          usage: { inputTokens: response.usage?.promptTokens || 0, outputTokens: response.usage?.completionTokens || 0 }
        };
      }
      async *streamComplete(request2) {
        const params = this.buildParams(request2);
        const stream = await this.client.chat.stream(params);
        const toolBuffers = /* @__PURE__ */ new Map();
        for await (const event of stream) {
          const chunk = event.data;
          const delta = chunk?.choices?.[0]?.delta;
          if (!delta) {
            if (chunk?.usage)
              yield { type: "usage", usage: { inputTokens: chunk.usage.promptTokens || 0, outputTokens: chunk.usage.completionTokens || 0 } };
            continue;
          }
          if (delta.content)
            yield { type: "text", text: delta.content };
          if (delta.toolCalls) {
            for (let i = 0; i < delta.toolCalls.length; i++) {
              const tc = delta.toolCalls[i];
              if (tc.function?.name) {
                const id = tc.id || crypto.randomUUID();
                toolBuffers.set(i, { id, name: tc.function.name, args: tc.function.arguments || "" });
                yield { type: "tool_use_start", toolUse: { id, name: tc.function.name } };
                if (tc.function.arguments) {
                  yield { type: "tool_use_delta", toolUse: { id, inputDelta: tc.function.arguments } };
                }
              } else if (tc.function?.arguments) {
                const buf = toolBuffers.get(i);
                if (buf) {
                  buf.args += tc.function.arguments;
                  yield { type: "tool_use_delta", toolUse: { id: buf.id, inputDelta: tc.function.arguments } };
                }
              }
            }
          }
          if (chunk?.choices?.[0]?.finishReason) {
            for (const [, buf] of toolBuffers)
              yield { type: "tool_use_end", toolUse: { id: buf.id } };
            yield { type: "done" };
          }
        }
      }
      async countTokens(messages, _model) {
        let chars = 0;
        for (const msg of messages) {
          chars += typeof msg.content === "string" ? msg.content.length : JSON.stringify(msg.content).length;
        }
        return Math.ceil(chars / 3);
      }
      buildParams(request2) {
        const params = { model: request2.model, messages: this.formatMessages(request2.messages) };
        if (request2.systemPrompt)
          params.messages = [{ role: "system", content: request2.systemPrompt }, ...params.messages];
        if (request2.tools?.length)
          params.tools = this.formatTools(request2.tools);
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.maxTokens = request2.maxTokens;
        return params;
      }
    };
  }
});

// src/providers/groq/groq-provider.ts
var import_groq_sdk, GroqProvider;
var init_groq_provider = __esm({
  "src/providers/groq/groq-provider.ts"() {
    "use strict";
    import_groq_sdk = __toESM(require("groq-sdk"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    GroqProvider = class extends BaseProvider {
      name = "groq";
      displayName = "Groq";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("groq");
      }
      async createClient(config) {
        if (!config.apiKey)
          throw new Error("Groq API key is required. Set GROQ_API_KEY environment variable.");
        this.client = new import_groq_sdk.default({ apiKey: config.apiKey, maxRetries: config.maxRetries ?? 3, timeout: config.timeout ?? 6e4 });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        const knownToolCallIds = /* @__PURE__ */ new Set();
        for (const msg of messages) {
          if (msg.role === "assistant") {
            for (const tc of getToolUseBlocks(msg)) {
              if (tc.id)
                knownToolCallIds.add(tc.id);
            }
          }
        }
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              result.push({
                role: "assistant",
                content: text || null,
                tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.input) } }))
              });
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId))
                continue;
              result.push({ role: "tool", tool_call_id: tr.toolUseId, content: getToolResultText(tr) });
            }
          } else {
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const response = await this.client.chat.completions.create({ ...params, stream: false });
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content)
          content.push({ type: "text", text: choice.message.content });
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || "{}") });
          }
        }
        const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end_turn";
        return {
          message: { id: response.id, role: "assistant", content, timestamp: Date.now(), metadata: { model: request2.model, provider: "groq", inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0, stopReason } },
          stopReason,
          usage: { inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0 }
        };
      }
      async *streamComplete(request2) {
        const params = this.buildParams(request2);
        const stream = await this.client.chat.completions.create({ ...params, stream: true });
        const toolBuffers = /* @__PURE__ */ new Map();
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) {
            if (chunk.usage)
              yield { type: "usage", usage: { inputTokens: chunk.usage.prompt_tokens || 0, outputTokens: chunk.usage.completion_tokens || 0 } };
            continue;
          }
          if (delta.content)
            yield { type: "text", text: delta.content };
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                const id = tc.id || crypto.randomUUID();
                toolBuffers.set(tc.index, { id, name: tc.function.name, args: tc.function.arguments || "" });
                yield { type: "tool_use_start", toolUse: { id, name: tc.function.name } };
                if (tc.function.arguments) {
                  yield { type: "tool_use_delta", toolUse: { id, inputDelta: tc.function.arguments } };
                }
              } else if (tc.function?.arguments) {
                const buf = toolBuffers.get(tc.index);
                if (buf) {
                  buf.args += tc.function.arguments;
                  yield { type: "tool_use_delta", toolUse: { id: buf.id, inputDelta: tc.function.arguments } };
                }
              }
            }
          }
          if (chunk.choices?.[0]?.finish_reason) {
            for (const [, buf] of toolBuffers)
              yield { type: "tool_use_end", toolUse: { id: buf.id } };
            yield { type: "done" };
          }
        }
      }
      async countTokens(messages, _model) {
        let chars = 0;
        for (const msg of messages) {
          chars += typeof msg.content === "string" ? msg.content.length : JSON.stringify(msg.content).length;
        }
        return Math.ceil(chars / 3);
      }
      buildParams(request2) {
        const params = { model: request2.model, messages: this.formatMessages(request2.messages) };
        if (request2.systemPrompt)
          params.messages = [{ role: "system", content: request2.systemPrompt }, ...params.messages];
        if (request2.tools?.length)
          params.tools = this.formatTools(request2.tools);
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        return params;
      }
    };
  }
});

// src/providers/xai/xai-provider.ts
var import_openai2, RESPONSES_API_MODELS, XAIProvider;
var init_xai_provider = __esm({
  "src/providers/xai/xai-provider.ts"() {
    "use strict";
    import_openai2 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    RESPONSES_API_MODELS = /* @__PURE__ */ new Set([]);
    XAIProvider = class extends BaseProvider {
      name = "xai";
      displayName = "xAI (Grok)";
      client;
      apiKey;
      baseURL;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("xai");
      }
      async createClient(config) {
        if (!config.apiKey) {
          throw new Error("xAI API key is required. Set XAI_API_KEY environment variable.");
        }
        this.apiKey = config.apiKey;
        this.baseURL = config.baseUrl || "https://api.x.ai/v1";
        this.client = new import_openai2.default({
          apiKey: config.apiKey,
          baseURL: this.baseURL,
          maxRetries: config.maxRetries ?? 3,
          timeout: config.timeout ?? 6e4
        });
      }
      isResponsesModel(model) {
        return RESPONSES_API_MODELS.has(model);
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        const knownToolCallIds = /* @__PURE__ */ new Set();
        for (const msg of messages) {
          if (msg.role === "assistant") {
            for (const tc of getToolUseBlocks(msg)) {
              if (tc.id)
                knownToolCallIds.add(tc.id);
            }
          }
        }
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              result.push({
                role: "assistant",
                content: text || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: { name: tc.name, arguments: JSON.stringify(tc.input) }
                }))
              });
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId))
                continue;
              if (typeof tr.content !== "string" && Array.isArray(tr.content)) {
                const hasImages = tr.content.some((b) => b.type === "image");
                if (hasImages) {
                  const parts = [];
                  for (const block of tr.content) {
                    if (block.type === "text")
                      parts.push({ type: "text", text: block.text });
                    else if (block.type === "image") {
                      parts.push({ type: "image_url", image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` } });
                    }
                  }
                  result.push({ role: "user", content: parts });
                  continue;
                }
              }
              result.push({
                role: "tool",
                tool_call_id: tr.toolUseId,
                content: getToolResultText(tr)
              });
            }
          } else {
            if (typeof msg.content !== "string") {
              const hasImages = msg.content.some((b) => b.type === "image");
              if (hasImages) {
                const parts = [];
                for (const block of msg.content) {
                  if (block.type === "text")
                    parts.push({ type: "text", text: block.text });
                  else if (block.type === "image") {
                    parts.push({ type: "image_url", image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` } });
                  }
                }
                result.push({ role: "user", content: parts });
                continue;
              }
            }
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request2) {
        if (this.isResponsesModel(request2.model)) {
          return this.completeViaResponses(request2);
        }
        const params = this.buildParams(request2);
        const response = await this.client.chat.completions.create({ ...params, stream: false });
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content)
          content.push({ type: "text", text: choice.message.content });
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments || "{}")
            });
          }
        }
        const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end_turn";
        const reasoningContent = choice.message.reasoning_content;
        return {
          message: {
            id: response.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            reasoning: reasoningContent || void 0,
            metadata: {
              model: request2.model,
              provider: "xai",
              inputTokens: response.usage?.prompt_tokens || 0,
              outputTokens: response.usage?.completion_tokens || 0,
              cacheReadTokens: response.usage?.prompt_tokens_details?.cached_tokens,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            cacheReadTokens: response.usage?.prompt_tokens_details?.cached_tokens
          }
        };
      }
      async *streamComplete(request2) {
        if (this.isResponsesModel(request2.model)) {
          yield* this.streamViaResponses(request2);
          return;
        }
        const params = this.buildParams(request2);
        const stream = await this.client.chat.completions.create({
          ...params,
          stream: true,
          stream_options: { include_usage: true }
        });
        const toolBuffers = /* @__PURE__ */ new Map();
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) {
            if (chunk.usage) {
              yield {
                type: "usage",
                usage: {
                  inputTokens: chunk.usage.prompt_tokens || 0,
                  outputTokens: chunk.usage.completion_tokens || 0,
                  cacheReadTokens: chunk.usage?.prompt_tokens_details?.cached_tokens
                }
              };
            }
            continue;
          }
          const reasoningDelta = delta.reasoning_content;
          if (reasoningDelta)
            yield { type: "thinking", text: reasoningDelta };
          if (delta.content)
            yield { type: "text", text: delta.content };
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                const id = tc.id || crypto.randomUUID();
                toolBuffers.set(tc.index, { id, name: tc.function.name, args: tc.function.arguments || "" });
                yield { type: "tool_use_start", toolUse: { id, name: tc.function.name } };
                if (tc.function.arguments) {
                  yield { type: "tool_use_delta", toolUse: { id, inputDelta: tc.function.arguments } };
                }
              } else if (tc.function?.arguments) {
                const buf = toolBuffers.get(tc.index);
                if (buf) {
                  buf.args += tc.function.arguments;
                  yield { type: "tool_use_delta", toolUse: { id: buf.id, inputDelta: tc.function.arguments } };
                }
              }
            }
          }
          if (chunk.choices?.[0]?.finish_reason) {
            for (const [, buf] of toolBuffers)
              yield { type: "tool_use_end", toolUse: { id: buf.id } };
            yield { type: "done" };
          }
        }
      }
      async countTokens(messages, _model) {
        let totalChars = 0;
        for (const msg of messages) {
          if (typeof msg.content === "string")
            totalChars += msg.content.length;
          else
            for (const block of msg.content) {
              if (block.type === "text")
                totalChars += block.text.length;
              else if (block.type === "tool_use")
                totalChars += JSON.stringify(block.input).length;
              else if (block.type === "tool_result")
                totalChars += typeof block.content === "string" ? block.content.length : JSON.stringify(block.content).length;
            }
        }
        return Math.ceil(totalChars / 3);
      }
      // ─── Responses API (multi-agent models) ───
      /**
       * Build the `input` field for the Responses API from unified messages.
       * The Responses API accepts either a string or an array of message objects.
       */
      buildResponsesInput(messages, systemPrompt) {
        const input = [];
        if (systemPrompt) {
          input.push({ role: "developer", content: systemPrompt });
        }
        for (const msg of messages) {
          const text = getTextContent(msg);
          if (msg.role === "user") {
            input.push({ role: "user", content: text });
          } else if (msg.role === "assistant") {
            input.push({ role: "assistant", content: text });
          }
        }
        return input;
      }
      async completeViaResponses(request2) {
        const input = this.buildResponsesInput(request2.messages, request2.systemPrompt);
        const url = `${this.baseURL}/responses`;
        const body = {
          model: request2.model,
          input,
          max_output_tokens: request2.maxTokens || 16384
        };
        if (request2.temperature !== void 0)
          body.temperature = request2.temperature;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`xAI Responses API error (${resp.status}): ${errText}`);
        }
        const data = await resp.json();
        const outputText = data.output?.[0]?.content?.[0]?.text || "";
        const content = [];
        if (outputText)
          content.push({ type: "text", text: outputText });
        return {
          message: {
            id: data.id || crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model: request2.model,
              provider: "xai",
              inputTokens: data.usage?.input_tokens || 0,
              outputTokens: data.usage?.output_tokens || 0,
              cacheReadTokens: data.usage?.cached_tokens,
              stopReason: "end_turn"
            }
          },
          stopReason: "end_turn",
          usage: {
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
            cacheReadTokens: data.usage?.cached_tokens
          }
        };
      }
      async *streamViaResponses(request2) {
        const input = this.buildResponsesInput(request2.messages, request2.systemPrompt);
        const url = `${this.baseURL}/responses`;
        const body = {
          model: request2.model,
          input,
          max_output_tokens: request2.maxTokens || 16384,
          stream: true
        };
        if (request2.temperature !== void 0)
          body.temperature = request2.temperature;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          yield { type: "error", error: new Error(`xAI Responses API error (${resp.status}): ${errText}`) };
          return;
        }
        const reader = resp.body?.getReader();
        if (!reader) {
          yield { type: "error", error: new Error("No response body") };
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done)
              break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr)
                  continue;
                try {
                  const event = JSON.parse(jsonStr);
                  if (event.type === "response.output_text.delta" && event.delta) {
                    yield { type: "text", text: event.delta };
                  } else if (event.type === "response.completed" && event.response?.usage) {
                    const usage = event.response.usage;
                    yield {
                      type: "usage",
                      usage: {
                        inputTokens: usage.input_tokens || 0,
                        outputTokens: usage.output_tokens || 0,
                        cacheReadTokens: usage.cached_tokens
                      }
                    };
                    yield { type: "done" };
                  }
                } catch {
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      // ─── Chat Completions API (standard models) ───
      buildParams(request2) {
        const modelInfo = this.getModelInfo(request2.model);
        const canonicalModelId = modelInfo?.apiId || modelInfo?.id || request2.model;
        const params = { model: canonicalModelId, messages: this.formatMessages(request2.messages) };
        if (request2.systemPrompt)
          params.messages = [{ role: "system", content: request2.systemPrompt }, ...params.messages];
        if (request2.tools?.length)
          params.tools = this.formatTools(request2.tools);
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        if (request2.topP !== void 0)
          params.top_p = request2.topP;
        if (request2.thinking?.enabled && modelInfo?.capabilities.extendedThinking) {
          const effort = request2.thinking.effort || "high";
          params.reasoning_effort = effort === "minimal" || effort === "low" ? "low" : "high";
        }
        return params;
      }
    };
  }
});

// src/providers/aws/bedrock-provider.ts
var import_client_bedrock_runtime, BedrockProvider;
var init_bedrock_provider = __esm({
  "src/providers/aws/bedrock-provider.ts"() {
    "use strict";
    import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
    init_base_provider();
    init_message_types();
    init_model_registry();
    BedrockProvider = class extends BaseProvider {
      name = "bedrock";
      displayName = "AWS Bedrock";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("bedrock");
      }
      async createClient(config) {
        this.client = new import_client_bedrock_runtime.BedrockRuntimeClient({
          region: config.baseUrl || process.env.AWS_REGION || "us-east-1"
        });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return {
          tools: tools.map((t) => ({
            toolSpec: {
              name: t.name,
              description: t.description,
              inputSchema: { json: t.inputSchema }
            }
          }))
        };
      }
      formatMessages(messages) {
        const result = [];
        for (const msg of messages) {
          if (msg.role === "system")
            continue;
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            const content = [];
            if (text) {
              content.push({ text });
            }
            for (const tc of toolCalls) {
              content.push({
                toolUse: {
                  toolUseId: tc.id,
                  name: tc.name,
                  input: tc.input
                }
              });
            }
            if (content.length > 0) {
              result.push({ role: "assistant", content });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            const content = toolResults.map((tr) => ({
              toolResult: {
                toolUseId: tr.toolUseId,
                content: [{
                  text: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content)
                }],
                status: tr.isError ? "error" : "success"
              }
            }));
            result.push({ role: "user", content });
          } else {
            const text = getTextContent(msg);
            if (text) {
              result.push({ role: "user", content: [{ text }] });
            }
          }
        }
        return result;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const command = new import_client_bedrock_runtime.ConverseCommand(params);
        const response = await this.client.send(command);
        const content = [];
        const outputContent = response.output?.message?.content || [];
        for (const block of outputContent) {
          if (block.text) {
            content.push({ type: "text", text: block.text });
          }
          if (block.toolUse) {
            content.push({
              type: "tool_use",
              id: block.toolUse.toolUseId || crypto.randomUUID(),
              name: block.toolUse.name || "",
              input: block.toolUse.input || {}
            });
          }
        }
        const stopReason = response.stopReason === "tool_use" ? "tool_use" : response.stopReason === "max_tokens" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model: request2.model,
              provider: "bedrock",
              inputTokens: response.usage?.inputTokens || 0,
              outputTokens: response.usage?.outputTokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usage?.inputTokens || 0,
            outputTokens: response.usage?.outputTokens || 0
          }
        };
      }
      async *streamComplete(request2) {
        const params = this.buildParams(request2);
        const command = new import_client_bedrock_runtime.ConverseStreamCommand(params);
        const response = await this.client.send(command);
        if (!response.stream) {
          yield { type: "error", error: new Error("No stream returned from Bedrock") };
          return;
        }
        let currentToolId;
        for await (const event of response.stream) {
          if (event.contentBlockStart) {
            const start = event.contentBlockStart.start;
            if (start?.toolUse) {
              currentToolId = start.toolUse.toolUseId || crypto.randomUUID();
              yield {
                type: "tool_use_start",
                toolUse: {
                  id: currentToolId,
                  name: start.toolUse.name || ""
                }
              };
            }
          }
          if (event.contentBlockDelta) {
            const delta = event.contentBlockDelta.delta;
            if (delta?.text) {
              yield { type: "text", text: delta.text };
            }
            if (delta?.toolUse?.input) {
              yield {
                type: "tool_use_delta",
                toolUse: { id: currentToolId, inputDelta: delta.toolUse.input }
              };
            }
          }
          if (event.contentBlockStop) {
            if (currentToolId) {
              yield { type: "tool_use_end", toolUse: { id: currentToolId } };
              currentToolId = void 0;
            }
          }
          if (event.messageStop) {
            yield { type: "done" };
          }
          if (event.metadata?.usage) {
            yield {
              type: "usage",
              usage: {
                inputTokens: event.metadata.usage.inputTokens || 0,
                outputTokens: event.metadata.usage.outputTokens || 0
              }
            };
          }
        }
      }
      async countTokens(messages, _model) {
        let totalChars = 0;
        for (const msg of messages) {
          if (typeof msg.content === "string") {
            totalChars += msg.content.length;
          } else {
            for (const block of msg.content) {
              if (block.type === "text")
                totalChars += block.text.length;
              else if (block.type === "tool_use")
                totalChars += JSON.stringify(block.input).length;
              else if (block.type === "tool_result") {
                totalChars += typeof block.content === "string" ? block.content.length : JSON.stringify(block.content).length;
              }
            }
          }
        }
        return Math.ceil(totalChars / 3);
      }
      buildParams(request2) {
        const params = {
          modelId: request2.model,
          messages: this.formatMessages(request2.messages)
        };
        if (request2.systemPrompt) {
          params.system = [{ text: request2.systemPrompt }];
        }
        if (request2.tools && request2.tools.length > 0) {
          params.toolConfig = this.formatTools(request2.tools);
        }
        const inferenceConfig = {};
        if (request2.maxTokens)
          inferenceConfig.maxTokens = request2.maxTokens;
        if (request2.temperature !== void 0)
          inferenceConfig.temperature = request2.temperature;
        if (request2.topP !== void 0)
          inferenceConfig.topP = request2.topP;
        if (request2.stopSequences)
          inferenceConfig.stopSequences = request2.stopSequences;
        if (Object.keys(inferenceConfig).length > 0) {
          params.inferenceConfig = inferenceConfig;
        }
        return params;
      }
    };
  }
});

// src/providers/moonshot/moonshot-provider.ts
var import_openai3, MoonshotProvider;
var init_moonshot_provider = __esm({
  "src/providers/moonshot/moonshot-provider.ts"() {
    "use strict";
    import_openai3 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
    MoonshotProvider = class extends BaseProvider {
      name = "moonshot";
      displayName = "Moonshot / Kimi";
      client;
      models;
      constructor() {
        super();
        this.models = getModelsForProvider("moonshot");
      }
      async createClient(config) {
        console.log("[MoonshotProvider] createClient called, apiKey exists:", !!config.apiKey);
        console.log("[MoonshotProvider] apiKey length:", config.apiKey?.length || 0);
        if (!config.apiKey) {
          throw new Error("Moonshot API key is required. Set MOONSHOT_API_KEY environment variable.");
        }
        console.log("[MoonshotProvider] Creating OpenAI client with baseURL:", config.baseUrl ?? "https://api.moonshot.ai/v1");
        this.client = new import_openai3.default({
          apiKey: config.apiKey,
          baseURL: config.baseUrl ?? "https://api.moonshot.ai/v1",
          maxRetries: config.maxRetries ?? 3,
          timeout: config.timeout ?? 6e4
        });
        console.log("[MoonshotProvider] OpenAI client created successfully");
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        const knownToolCallIds = /* @__PURE__ */ new Set();
        for (const msg of messages) {
          if (msg.role === "assistant") {
            for (const tc of getToolUseBlocks(msg)) {
              if (tc.id)
                knownToolCallIds.add(tc.id);
            }
          }
        }
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              const assistantMsg = {
                role: "assistant",
                content: text || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.input)
                  }
                }))
              };
              if (msg.reasoning) {
                assistantMsg.reasoning_content = msg.reasoning;
              }
              result.push(assistantMsg);
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId))
                continue;
              result.push({
                role: "tool",
                tool_call_id: tr.toolUseId,
                content: getToolResultText(tr)
              });
            }
            continue;
          }
          if (typeof msg.content !== "string") {
            const hasImages = msg.content.some((b) => b.type === "image");
            if (hasImages) {
              const parts = [];
              for (const block of msg.content) {
                if (block.type === "text")
                  parts.push({ type: "text", text: block.text });
                else if (block.type === "image") {
                  parts.push({
                    type: "image_url",
                    image_url: { url: `data:${block.source.mediaType};base64,${block.source.data}` }
                  });
                }
              }
              result.push({ role: "user", content: parts });
              continue;
            }
          }
          result.push({ role: "user", content: getTextContent(msg) });
        }
        return result;
      }
      async complete(request2) {
        const params = this.buildParams(request2);
        const response = await this.client.chat.completions.create({
          ...params,
          stream: false
        });
        return this.parseNonStreamResponse(response, request2.model);
      }
      async *streamComplete(request2) {
        console.log("[MoonshotProvider:streamComplete] Starting stream for model:", request2.model);
        console.log("[MoonshotProvider:streamComplete] Client available:", !!this.client);
        console.log("[MoonshotProvider:streamComplete] Provider available:", this.isAvailable());
        const params = this.buildParams(request2);
        console.log("[MoonshotProvider:streamComplete] Params built, making API call...");
        const MAX_RETRIES = 3;
        let attempt = 0;
        while (true) {
          attempt++;
          try {
            console.log("[MoonshotProvider:streamComplete] Sending request to Moonshot API...");
            console.log("[MoonshotProvider:streamComplete] Request params:", JSON.stringify(params, null, 2));
            const stream = await this.client.chat.completions.create({
              ...params,
              stream: true,
              stream_options: { include_usage: true }
            });
            console.log("[MoonshotProvider:streamComplete] Stream created successfully");
            const toolBuffers = /* @__PURE__ */ new Map();
            for await (const chunk of stream) {
              const delta = chunk.choices?.[0]?.delta;
              if (!delta) {
                if (chunk.usage) {
                  yield {
                    type: "usage",
                    usage: {
                      inputTokens: chunk.usage.prompt_tokens || 0,
                      outputTokens: chunk.usage.completion_tokens || 0
                    }
                  };
                }
                continue;
              }
              if (delta.reasoning_content) {
                yield { type: "thinking", text: delta.reasoning_content };
              }
              if (delta.content) {
                yield { type: "text", text: delta.content };
              }
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.function?.name) {
                    const id = tc.id || crypto.randomUUID();
                    toolBuffers.set(tc.index, {
                      id,
                      name: tc.function.name,
                      args: tc.function.arguments || ""
                    });
                    yield {
                      type: "tool_use_start",
                      toolUse: { id, name: tc.function.name }
                    };
                    if (tc.function.arguments) {
                      yield {
                        type: "tool_use_delta",
                        toolUse: { id, inputDelta: tc.function.arguments }
                      };
                    }
                  } else if (tc.function?.arguments) {
                    const buf = toolBuffers.get(tc.index);
                    if (buf) {
                      buf.args += tc.function.arguments;
                      yield {
                        type: "tool_use_delta",
                        toolUse: { id: buf.id, inputDelta: tc.function.arguments }
                      };
                    }
                  }
                }
              }
              if (chunk.choices?.[0]?.finish_reason) {
                for (const [, buf] of toolBuffers) {
                  yield { type: "tool_use_end", toolUse: { id: buf.id } };
                }
                yield { type: "done" };
              }
            }
            console.log("[MoonshotProvider:streamComplete] Stream completed successfully");
            return;
          } catch (error) {
            const status = error.status ?? error.statusCode;
            const msg = (error.message ?? "").toLowerCase();
            const isRateLimit = status === 429 || msg.includes("overload") || msg.includes("rate limit") || msg.includes("too many requests");
            if (isRateLimit && attempt <= MAX_RETRIES) {
              const waitMs = attempt * 5e3;
              console.warn(`[MoonshotProvider:streamComplete] 429/overloaded (attempt ${attempt}/${MAX_RETRIES}), retrying in ${waitMs}ms...`);
              await new Promise((resolve12) => setTimeout(resolve12, waitMs));
              continue;
            }
            console.error("[MoonshotProvider:streamComplete] Error during streaming:", error.message);
            console.error("[MoonshotProvider:streamComplete] Error status:", status);
            console.error("[MoonshotProvider:streamComplete] Error code:", error.code);
            console.error("[MoonshotProvider:streamComplete] Error type:", error.type);
            console.error("[MoonshotProvider:streamComplete] Error response:", error.response);
            console.error("[MoonshotProvider:streamComplete] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            throw error;
          }
        }
      }
      async countTokens(messages, _model) {
        let totalChars = 0;
        for (const msg of messages) {
          if (typeof msg.content === "string")
            totalChars += msg.content.length;
          else {
            for (const block of msg.content) {
              if (block.type === "text")
                totalChars += block.text.length;
              else if (block.type === "tool_use")
                totalChars += JSON.stringify(block.input).length;
              else if (block.type === "tool_result") {
                totalChars += typeof block.content === "string" ? block.content.length : JSON.stringify(block.content).length;
              }
            }
          }
        }
        return Math.ceil(totalChars / 3);
      }
      buildParams(request2) {
        console.log("[MoonshotProvider:buildParams] Building params for model:", request2.model);
        console.log("[MoonshotProvider:buildParams] Message count:", request2.messages.length);
        const formattedMessages = this.formatMessages(request2.messages);
        console.log("[MoonshotProvider:buildParams] Formatted messages:", JSON.stringify(formattedMessages, null, 2));
        const params = {
          model: request2.model,
          messages: formattedMessages
        };
        if (request2.systemPrompt) {
          params.messages = [
            { role: "system", content: request2.systemPrompt },
            ...params.messages
          ];
          console.log("[MoonshotProvider:buildParams] Added system prompt");
        }
        if (request2.tools && request2.tools.length > 0) {
          params.tools = this.formatTools(request2.tools);
          console.log("[MoonshotProvider:buildParams] Added", request2.tools.length, "tools");
        }
        const modelInfo = this.getModelInfo(request2.model);
        if (modelInfo?.fixedTemperature !== void 0) {
          params.temperature = modelInfo.fixedTemperature;
        } else if (request2.temperature !== void 0) {
          params.temperature = request2.temperature;
        }
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        if (request2.topP !== void 0)
          params.top_p = request2.topP;
        console.log("[MoonshotProvider:buildParams] Final params:", JSON.stringify(params, null, 2));
        return params;
      }
      parseNonStreamResponse(response, model) {
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content) {
          content.push({ type: "text", text: choice.message.content });
        }
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments || "{}")
            });
          }
        }
        const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: response.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "moonshot",
              inputTokens: response.usage?.prompt_tokens || 0,
              outputTokens: response.usage?.completion_tokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0
          }
        };
      }
    };
  }
});

// src/providers/openai-compatible/openai-compat-provider.ts
var import_openai4, OpenAICompatProvider;
var init_openai_compat_provider = __esm({
  "src/providers/openai-compatible/openai-compat-provider.ts"() {
    "use strict";
    import_openai4 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_tool_call_normalizer();
    OpenAICompatProvider = class extends BaseProvider {
      name = "openai-compatible";
      displayName;
      client;
      models;
      endpointName;
      constructor(name, endpointConfig) {
        super();
        this.endpointName = name;
        this.displayName = `${name} (OpenAI-compatible)`;
        this.models = endpointConfig.models.map((modelId) => ({
          id: `${name}/${modelId}`,
          provider: "openai-compatible",
          displayName: `${modelId} (${name})`,
          aliases: [modelId],
          capabilities: {
            streaming: true,
            toolUse: true,
            vision: false,
            jsonMode: true,
            systemPrompt: true,
            caching: false,
            extendedThinking: false,
            maxContextWindow: 128e3,
            maxOutputTokens: 4096
          },
          pricing: { inputPerMillion: 0, outputPerMillion: 0 }
        }));
        this.config = { baseUrl: endpointConfig.baseUrl, apiKey: endpointConfig.apiKey };
      }
      async createClient(config) {
        this.client = new import_openai4.default({
          apiKey: config.apiKey || this.config?.apiKey || "not-needed",
          baseURL: config.baseUrl || this.config?.baseUrl,
          maxRetries: config.maxRetries ?? 2,
          timeout: config.timeout ?? 12e4
        });
      }
      listModels() {
        return this.models;
      }
      getModelInfo(modelId) {
        return this.models.find((m) => m.id === modelId || m.aliases?.includes(modelId));
      }
      formatTools(tools) {
        return ToolCallNormalizer.toOpenAI(tools);
      }
      formatMessages(messages) {
        const result = [];
        const knownToolCallIds = /* @__PURE__ */ new Set();
        for (const msg of messages) {
          if (msg.role === "assistant") {
            for (const tc of getToolUseBlocks(msg)) {
              if (tc.id)
                knownToolCallIds.add(tc.id);
            }
          }
        }
        for (const msg of messages) {
          if (msg.role === "system") {
            result.push({ role: "system", content: getTextContent(msg) });
            continue;
          }
          if (msg.role === "assistant") {
            const text = getTextContent(msg);
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length > 0) {
              result.push({
                role: "assistant",
                content: text || null,
                tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.input) } }))
              });
            } else {
              result.push({ role: "assistant", content: text });
            }
            continue;
          }
          const toolResults = getToolResultBlocks(msg);
          if (toolResults.length > 0) {
            for (const tr of toolResults) {
              if (!tr.toolUseId || !knownToolCallIds.has(tr.toolUseId))
                continue;
              result.push({ role: "tool", tool_call_id: tr.toolUseId, content: getToolResultText(tr) });
            }
          } else {
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request2) {
        const modelId = request2.model.replace(`${this.endpointName}/`, "");
        const params = {
          model: modelId,
          messages: this.formatMessages(request2.messages),
          stream: false
        };
        if (request2.systemPrompt)
          params.messages = [{ role: "system", content: request2.systemPrompt }, ...params.messages];
        if (request2.tools?.length)
          params.tools = this.formatTools(request2.tools);
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        const response = await this.client.chat.completions.create(params);
        const choice = response.choices[0];
        const content = [];
        if (choice.message.content)
          content.push({ type: "text", text: choice.message.content });
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || "{}") });
          }
        }
        const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn";
        return {
          message: { id: response.id, role: "assistant", content, timestamp: Date.now(), metadata: { model: request2.model, provider: "openai-compatible", inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0, stopReason } },
          stopReason,
          usage: { inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0 }
        };
      }
      async *streamComplete(request2) {
        const modelId = request2.model.replace(`${this.endpointName}/`, "");
        const params = {
          model: modelId,
          messages: this.formatMessages(request2.messages),
          stream: true
        };
        if (request2.systemPrompt)
          params.messages = [{ role: "system", content: request2.systemPrompt }, ...params.messages];
        if (request2.tools?.length)
          params.tools = this.formatTools(request2.tools);
        if (request2.temperature !== void 0)
          params.temperature = request2.temperature;
        if (request2.maxTokens)
          params.max_tokens = request2.maxTokens;
        const stream = await this.client.chat.completions.create(params);
        const toolBuffers = /* @__PURE__ */ new Map();
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta)
            continue;
          if (delta.content)
            yield { type: "text", text: delta.content };
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                const id = tc.id || crypto.randomUUID();
                toolBuffers.set(tc.index, { id, name: tc.function.name, args: tc.function.arguments || "" });
                yield { type: "tool_use_start", toolUse: { id, name: tc.function.name } };
                if (tc.function.arguments) {
                  yield { type: "tool_use_delta", toolUse: { id, inputDelta: tc.function.arguments } };
                }
              } else if (tc.function?.arguments) {
                const buf = toolBuffers.get(tc.index);
                if (buf) {
                  buf.args += tc.function.arguments;
                  yield { type: "tool_use_delta", toolUse: { id: buf.id, inputDelta: tc.function.arguments } };
                }
              }
            }
          }
          if (chunk.choices?.[0]?.finish_reason) {
            for (const [, buf] of toolBuffers)
              yield { type: "tool_use_end", toolUse: { id: buf.id } };
            yield { type: "done" };
          }
        }
      }
      async countTokens(messages, _model) {
        let chars = 0;
        for (const msg of messages) {
          chars += typeof msg.content === "string" ? msg.content.length : JSON.stringify(msg.content).length;
        }
        return Math.ceil(chars / 3);
      }
    };
  }
});

// src/tools/tool-registry.ts
var ToolRegistry;
var init_tool_registry = __esm({
  "src/tools/tool-registry.ts"() {
    "use strict";
    ToolRegistry = class {
      tools = /* @__PURE__ */ new Map();
      register(tool, source = "builtin") {
        if (this.tools.has(tool.name)) {
          throw new Error(`Tool "${tool.name}" is already registered`);
        }
        this.tools.set(tool.name, { tool, source, enabled: true });
      }
      unregister(name) {
        this.tools.delete(name);
      }
      get(name) {
        return this.tools.get(name);
      }
      getForLLM(planMode) {
        return Array.from(this.tools.values()).map((reg) => ({
          name: reg.tool.name,
          description: reg.tool.description,
          inputSchema: reg.tool.inputSchema
        }));
      }
      getAll() {
        return Array.from(this.tools.values());
      }
      setEnabled(name, enabled) {
        const reg = this.tools.get(name);
        if (reg) {
          reg.enabled = enabled;
        }
      }
    };
  }
});

// src/tools/tool-types.ts
var init_tool_types = __esm({
  "src/tools/tool-types.ts"() {
    "use strict";
  }
});

// src/tools/builtin/read-file.ts
var fs2, path2, IMAGE_EXTENSIONS, MIME_MAP, ReadFileTool;
var init_read_file = __esm({
  "src/tools/builtin/read-file.ts"() {
    "use strict";
    fs2 = __toESM(require("fs/promises"), 1);
    path2 = __toESM(require("path"), 1);
    init_tool_types();
    IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"]);
    MIME_MAP = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml"
    };
    ReadFileTool = class {
      name = "Read";
      description = "Reads a file from the local filesystem. Returns content with line numbers.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The absolute path to the file to read"
          },
          offset: {
            type: "number",
            description: "Line number to start reading from (1-based)"
          },
          limit: {
            type: "number",
            description: "Maximum number of lines to read"
          }
        },
        required: ["file_path"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path) {
          return "file_path must be a non-empty string";
        }
        if (!path2.isAbsolute(input.file_path)) {
          return "file_path must be an absolute path";
        }
        return null;
      }
      async execute(input, _context) {
        const filePath = input.file_path;
        const offset = input.offset || 1;
        const limit = input.limit || 2e3;
        try {
          const ext = path2.extname(filePath).toLowerCase();
          if (IMAGE_EXTENSIONS.has(ext)) {
            const buffer = await fs2.readFile(filePath);
            const base64 = buffer.toString("base64");
            const mediaType = MIME_MAP[ext] || "application/octet-stream";
            const imageBlock = {
              type: "image",
              source: { type: "base64", mediaType, data: base64 }
            };
            return {
              content: `Image file: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB, ${mediaType})`,
              contentBlocks: [imageBlock]
            };
          }
          const content = await fs2.readFile(filePath, "utf-8");
          const lines = content.split("\n");
          const sliced = lines.slice(offset - 1, offset - 1 + limit);
          const numbered = sliced.map((line, i) => {
            const lineNum = String(offset + i).padStart(6);
            const truncated = line.length > 2e3 ? line.substring(0, 2e3) + "..." : line;
            return `${lineNum}	${truncated}`;
          }).join("\n");
          return { content: numbered };
        } catch (error) {
          const err = error;
          if (err.code === "ENOENT") {
            return { content: `File not found: ${filePath}`, isError: true };
          }
          if (err.code === "EISDIR") {
            return { content: `Path is a directory, not a file: ${filePath}`, isError: true };
          }
          return { content: `Error reading file: ${err.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const lines = result.content.split("\n").length;
        return `Read ${lines} lines from ${input.file_path}`;
      }
    };
  }
});

// src/utils/large-file-writer.ts
function splitIntoChunks(content, chunkSize) {
  const chunks = [];
  let remaining = content;
  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining);
      break;
    }
    let breakPoint = chunkSize;
    const searchStart = Math.max(0, chunkSize - 1e3);
    const searchWindow = remaining.slice(searchStart, chunkSize + 100);
    const lastNewline = searchWindow.lastIndexOf("\n");
    if (lastNewline !== -1) {
      breakPoint = searchStart + lastNewline + 1;
    }
    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint);
  }
  return chunks;
}
async function writeLargeFile(filePath, content, config = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const dir = path3.dirname(filePath);
  if (!fs3.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }
  if (content.length === 0) {
    await fsp.writeFile(filePath, "", { encoding: fullConfig.encoding, signal: fullConfig.signal });
    return {
      chunkCount: 1,
      bytesWritten: 0,
      verified: true,
      usedChunking: false
    };
  }
  const chunks = splitIntoChunks(content, fullConfig.chunkSize);
  await fsp.writeFile(filePath, chunks[0], { encoding: fullConfig.encoding, signal: fullConfig.signal });
  for (let i = 1; i < chunks.length; i++) {
    if (fullConfig.signal?.aborted) {
      throw new DOMException("Write aborted", "AbortError");
    }
    await fsp.appendFile(filePath, chunks[i], { encoding: fullConfig.encoding });
    if (fullConfig.onProgress) {
      fullConfig.onProgress(i + 1, chunks.length);
    }
  }
  let verified = true;
  if (fullConfig.verifyContents) {
    const writtenContent = await fsp.readFile(filePath, { encoding: fullConfig.encoding });
    verified = writtenContent === content;
    if (!verified) {
      throw new Error(`Write verification failed for ${filePath}`);
    }
  }
  return {
    chunkCount: chunks.length,
    bytesWritten: estimateSize(content),
    verified,
    usedChunking: chunks.length > 1
  };
}
function estimateSize(content) {
  return Buffer.byteLength(content, "utf-8");
}
var fs3, fsp, path3, DEFAULT_CONFIG, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_THRESHOLD_BYTES;
var init_large_file_writer = __esm({
  "src/utils/large-file-writer.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"), 1);
    fsp = __toESM(require("fs/promises"), 1);
    path3 = __toESM(require("path"), 1);
    DEFAULT_CONFIG = {
      chunkSize: 4e4,
      encoding: "utf-8",
      verifyContents: true
    };
    DEFAULT_CHUNK_SIZE = DEFAULT_CONFIG.chunkSize;
    DEFAULT_CHUNK_THRESHOLD_BYTES = 45e3;
  }
});

// src/tools/builtin/write-file.ts
var fs4, path4, WRITE_TIMEOUT_MS, WriteFileTool;
var init_write_file = __esm({
  "src/tools/builtin/write-file.ts"() {
    "use strict";
    fs4 = __toESM(require("fs/promises"), 1);
    path4 = __toESM(require("path"), 1);
    init_tool_types();
    init_large_file_writer();
    WRITE_TIMEOUT_MS = 15e3;
    WriteFileTool = class {
      name = "Write";
      description = "Creates or overwrites a file with the specified content.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The absolute path to the file to write"
          },
          content: {
            type: "string",
            description: "The content to write to the file"
          }
        },
        required: ["file_path", "content"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path) {
          return "file_path must be a non-empty string";
        }
        if (!path4.isAbsolute(input.file_path)) {
          return "file_path must be an absolute path";
        }
        if (typeof input.content !== "string") {
          return "content must be a string";
        }
        return null;
      }
      async execute(input, _context) {
        const filePath = input.file_path;
        const content = input.content;
        let timedOut = false;
        try {
          _context.onProgress?.("Validating target path");
          await fs4.mkdir(path4.dirname(filePath), { recursive: true });
          const timeoutController = new AbortController();
          const combinedSignal = AbortSignal.any([
            _context.abortSignal,
            timeoutController.signal
          ]);
          const timeoutId = setTimeout(() => {
            timedOut = true;
            timeoutController.abort();
          }, WRITE_TIMEOUT_MS);
          const byteLength = Buffer.byteLength(content, "utf-8");
          const needsChunking = byteLength > DEFAULT_CHUNK_THRESHOLD_BYTES;
          let writeMetadata;
          try {
            if (needsChunking) {
              _context.onProgress?.("Writing file in chunks");
              writeMetadata = await writeLargeFile(filePath, content, {
                signal: combinedSignal
              });
            } else {
              _context.onProgress?.("Writing file");
              await fs4.writeFile(filePath, content, { encoding: "utf-8", signal: combinedSignal });
              _context.onProgress?.("Verifying written file");
              const writtenContent = await fs4.readFile(filePath, "utf-8");
              if (writtenContent !== content) {
                throw new Error(`Write verification failed for ${filePath}`);
              }
              writeMetadata = {
                chunkCount: 1,
                bytesWritten: byteLength,
                verified: true,
                usedChunking: false
              };
            }
          } finally {
            clearTimeout(timeoutId);
          }
          const lines = content.split("\n").length;
          const chunkSummary = writeMetadata.usedChunking ? ` using ${writeMetadata.chunkCount} chunks` : "";
          return {
            content: `File written successfully: ${filePath} (${lines} lines, ${writeMetadata.bytesWritten} bytes${chunkSummary})`,
            metadata: writeMetadata
          };
        } catch (error) {
          if (error.name === "AbortError") {
            if (_context.abortSignal.aborted && !timedOut) {
              return {
                content: `Error writing file: write was cancelled before completion.`,
                isError: true
              };
            }
            return {
              content: `Error writing file: write timed out after ${WRITE_TIMEOUT_MS / 1e3}s. Try splitting the content into smaller files or using chunked writes.`,
              isError: true,
              metadata: { timeoutMs: WRITE_TIMEOUT_MS }
            };
          }
          return { content: `Error writing file: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/edit-file.ts
var fs5, path5, EditFileTool;
var init_edit_file = __esm({
  "src/tools/builtin/edit-file.ts"() {
    "use strict";
    fs5 = __toESM(require("fs/promises"), 1);
    path5 = __toESM(require("path"), 1);
    init_tool_types();
    EditFileTool = class {
      name = "Edit";
      description = "Performs exact string replacements in files. The old_string must be unique in the file.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The absolute path to the file to modify"
          },
          old_string: {
            type: "string",
            description: "The exact text to replace"
          },
          new_string: {
            type: "string",
            description: "The text to replace it with"
          },
          replace_all: {
            type: "boolean",
            description: "Replace all occurrences (default: false)"
          }
        },
        required: ["file_path", "old_string", "new_string"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path) {
          return "file_path must be a non-empty string";
        }
        if (!path5.isAbsolute(input.file_path)) {
          return "file_path must be an absolute path";
        }
        if (typeof input.old_string !== "string") {
          return "old_string must be a string";
        }
        if (typeof input.new_string !== "string") {
          return "new_string must be a string";
        }
        if (input.old_string === input.new_string) {
          return "old_string and new_string must be different";
        }
        return null;
      }
      async execute(input, _context) {
        const filePath = input.file_path;
        const oldString = input.old_string;
        const newString = input.new_string;
        const replaceAll = input.replace_all || false;
        try {
          const content = await fs5.readFile(filePath, "utf-8");
          if (!content.includes(oldString)) {
            return {
              content: `The old_string was not found in the file. Make sure it matches exactly, including whitespace and indentation.`,
              isError: true
            };
          }
          if (!replaceAll) {
            const firstIndex = content.indexOf(oldString);
            const lastIndex = content.lastIndexOf(oldString);
            if (firstIndex !== lastIndex) {
              const occurrences = content.split(oldString).length - 1;
              return {
                content: `The old_string appears ${occurrences} times in the file. Use replace_all: true to replace all occurrences, or provide a larger string with more context to make it unique.`,
                isError: true
              };
            }
          }
          const updated = replaceAll ? content.split(oldString).join(newString) : content.replace(oldString, newString);
          await fs5.writeFile(filePath, updated, "utf-8");
          const replacements = replaceAll ? content.split(oldString).length - 1 : 1;
          return {
            content: `Successfully replaced ${replacements} occurrence(s) in ${filePath}`
          };
        } catch (error) {
          const err = error;
          if (err.code === "ENOENT") {
            return { content: `File not found: ${filePath}`, isError: true };
          }
          return { content: `Error editing file: ${err.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/glob-search.ts
var import_glob, GlobSearchTool;
var init_glob_search = __esm({
  "src/tools/builtin/glob-search.ts"() {
    "use strict";
    import_glob = require("glob");
    init_tool_types();
    GlobSearchTool = class {
      name = "Glob";
      description = 'Fast file pattern matching. Supports glob patterns like "**/*.ts" or "src/**/*.tsx". Returns matching file paths.';
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The glob pattern to match files against"
          },
          path: {
            type: "string",
            description: "Directory to search in. Must be within the workspace. Defaults to current working directory (workspace root)."
          }
        },
        required: ["pattern"]
      };
      validate(input) {
        if (typeof input.pattern !== "string" || !input.pattern) {
          return "pattern must be a non-empty string";
        }
        return null;
      }
      async execute(input, context) {
        const pattern = input.pattern;
        const searchPath = input.path || context.cwd;
        try {
          const matches = await (0, import_glob.glob)(pattern, {
            cwd: searchPath,
            absolute: true,
            nodir: true,
            ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"]
          });
          if (matches.length === 0) {
            return { content: `No files found matching pattern: ${pattern}` };
          }
          const sorted = matches.sort();
          const limited = sorted.slice(0, 500);
          const result = limited.join("\n");
          if (matches.length > 500) {
            return { content: `${result}

... and ${matches.length - 500} more files (showing first 500)` };
          }
          return { content: result };
        } catch (error) {
          return { content: `Glob error: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const count = result.content.split("\n").length;
        return `Found ${count} files matching "${input.pattern}"`;
      }
    };
  }
});

// src/tools/builtin/grep-search.ts
var import_node_child_process, import_node_util, execFileAsync, GrepSearchTool;
var init_grep_search = __esm({
  "src/tools/builtin/grep-search.ts"() {
    "use strict";
    import_node_child_process = require("child_process");
    import_node_util = require("util");
    init_tool_types();
    execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
    GrepSearchTool = class {
      name = "Grep";
      description = "Search file contents using regular expressions. Supports regex patterns, file type filtering, and context lines.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The regular expression pattern to search for"
          },
          path: {
            type: "string",
            description: "File or directory to search in. Must be within the workspace. Defaults to current working directory (workspace root)."
          },
          glob: {
            type: "string",
            description: 'Glob pattern to filter files (e.g., "*.ts", "*.{ts,tsx}")'
          },
          context: {
            type: "number",
            description: "Number of context lines to show around each match"
          },
          case_insensitive: {
            type: "boolean",
            description: "Case insensitive search"
          },
          files_only: {
            type: "boolean",
            description: "Only return file paths, not matching lines"
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return"
          }
        },
        required: ["pattern"]
      };
      validate(input) {
        if (typeof input.pattern !== "string" || !input.pattern) {
          return "pattern must be a non-empty string";
        }
        return null;
      }
      async execute(input, context) {
        const pattern = input.pattern;
        const searchPath = input.path || context.cwd;
        const globPattern = input.glob;
        const contextLines = input.context;
        const caseInsensitive = input.case_insensitive;
        const filesOnly = input.files_only;
        const maxResults = input.max_results || 200;
        const args = [];
        const cmd = await this.findSearchCmd();
        if (cmd === "rg") {
          args.push("--no-heading", "--line-number", "--color=never");
          if (caseInsensitive)
            args.push("-i");
          if (filesOnly)
            args.push("-l");
          if (contextLines)
            args.push(`-C${contextLines}`);
          if (globPattern)
            args.push(`--glob=${globPattern}`);
          args.push("--max-count", String(maxResults));
          args.push("--glob=!node_modules", "--glob=!.git", "--glob=!dist");
          args.push(pattern, searchPath);
        } else {
          args.push("-r", "-n", "--color=never");
          if (caseInsensitive)
            args.push("-i");
          if (filesOnly)
            args.push("-l");
          if (contextLines)
            args.push(`-C${contextLines}`);
          args.push("--exclude-dir=node_modules", "--exclude-dir=.git", "--exclude-dir=dist");
          args.push(pattern, searchPath);
        }
        try {
          const { stdout } = await execFileAsync(cmd, args, {
            timeout: 3e4,
            maxBuffer: 2 * 1024 * 1024
          });
          const lines = stdout.trim().split("\n");
          const limited = lines.slice(0, maxResults);
          if (limited.length === 0 || limited.length === 1 && limited[0] === "") {
            return { content: `No matches found for pattern: ${pattern}` };
          }
          let result = limited.join("\n");
          if (lines.length > maxResults) {
            result += `

... and ${lines.length - maxResults} more matches (showing first ${maxResults})`;
          }
          return { content: result };
        } catch (error) {
          if (error.code === 1) {
            return { content: `No matches found for pattern: ${pattern}` };
          }
          return { content: `Search error: ${error.message}`, isError: true };
        }
      }
      async findSearchCmd() {
        try {
          await execFileAsync("which", ["rg"]);
          return "rg";
        } catch {
          return "grep";
        }
      }
    };
  }
});

// src/tools/builtin/bash-exec.ts
var import_node_child_process2, fs6, os2, path6, import_tree_kill, BashExecTool;
var init_bash_exec = __esm({
  "src/tools/builtin/bash-exec.ts"() {
    "use strict";
    import_node_child_process2 = require("child_process");
    fs6 = __toESM(require("fs"), 1);
    os2 = __toESM(require("os"), 1);
    path6 = __toESM(require("path"), 1);
    import_tree_kill = __toESM(require("tree-kill"), 1);
    init_tool_types();
    init_logger();
    BashExecTool = class {
      name = "Bash";
      description = "Executes a shell command and returns its output. Working directory persists between commands.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute"
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds (default: 120000, max: 600000)"
          },
          description: {
            type: "string",
            description: "A description of what this command does"
          }
        },
        required: ["command"]
      };
      validate(input) {
        if (typeof input.command !== "string" || !input.command.trim()) {
          return "command must be a non-empty string";
        }
        const timeout = input.timeout;
        if (timeout !== void 0 && (timeout < 0 || timeout > 6e5)) {
          return "timeout must be between 0 and 600000 milliseconds";
        }
        return null;
      }
      async execute(input, context) {
        const command = input.command;
        const timeout = Math.min(input.timeout || 12e4, 6e5);
        return new Promise((resolve12) => {
          let stdout = "";
          let stderr = "";
          let killed = false;
          let lastProgressAt = 0;
          const emitProgress = () => {
            const now = Date.now();
            if (now - lastProgressAt > 1e3) {
              lastProgressAt = now;
              const combined = (stdout + (stderr ? "\n" + stderr : "")).trimEnd();
              const lines = combined.split("\n").slice(-8).join("\n");
              if (lines)
                context.onProgress?.(lines);
            }
          };
          const resolvedCwd = path6.resolve(context.cwd || os2.homedir());
          const safeCwd = fs6.existsSync(resolvedCwd) ? resolvedCwd : os2.homedir();
          logger.info(`[BashExec] Spawning command: ${command} in cwd: ${safeCwd}`);
          const proc = (0, import_node_child_process2.spawn)(command, [], {
            cwd: safeCwd,
            shell: true,
            env: { ...process.env },
            stdio: ["ignore", "pipe", "pipe"]
          });
          logger.debug(`[BashExec] Process spawned with PID: ${proc.pid}`);
          proc.stdout?.on("data", (data) => {
            stdout += data.toString();
            if (stdout.length > 1e6) {
              stdout = stdout.substring(0, 1e6) + "\n\n[Output truncated at 1MB]";
              if (proc.pid)
                (0, import_tree_kill.default)(proc.pid);
              killed = true;
            }
            emitProgress();
          });
          proc.stderr?.on("data", (data) => {
            stderr += data.toString();
            if (stderr.length > 5e5) {
              stderr = stderr.substring(0, 5e5) + "\n\n[Stderr truncated at 500KB]";
            }
            emitProgress();
          });
          const timer = setTimeout(() => {
            if (proc.pid)
              (0, import_tree_kill.default)(proc.pid);
            killed = true;
            resolve12({
              content: `Command timed out after ${timeout}ms.

Partial stdout:
${stdout}

Partial stderr:
${stderr}`,
              isError: true
            });
          }, timeout);
          const abortHandler = () => {
            if (proc.pid)
              (0, import_tree_kill.default)(proc.pid);
            killed = true;
            resolve12({
              content: "Command was cancelled.",
              isError: true
            });
          };
          context.abortSignal.addEventListener("abort", abortHandler, { once: true });
          proc.on("close", (code) => {
            clearTimeout(timer);
            context.abortSignal.removeEventListener("abort", abortHandler);
            if (killed)
              return;
            logger.info(`[BashExec] Process exited with code ${code}`);
            let output = "";
            if (stdout)
              output += stdout;
            if (stderr) {
              if (output)
                output += "\n";
              output += stderr;
            }
            if (!output)
              output = "(no output)";
            resolve12({
              content: output.trim(),
              isError: code !== 0,
              metadata: { exitCode: code }
            });
          });
          proc.on("error", (error) => {
            clearTimeout(timer);
            context.abortSignal.removeEventListener("abort", abortHandler);
            logger.error(`[BashExec] Process spawn error: ${error.message}`, error);
            resolve12({
              content: `Failed to execute command: ${error.message}`,
              isError: true
            });
          });
        });
      }
    };
  }
});

// src/memory/persistent-store.ts
var import_better_sqlite3, PersistentMemoryStore;
var init_persistent_store = __esm({
  "src/memory/persistent-store.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
    PersistentMemoryStore = class {
      db;
      path;
      constructor(dbPath = "./omni-memory.db") {
        this.path = dbPath;
        this.db = new import_better_sqlite3.default(dbPath);
        this.initSchema();
      }
      initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        role TEXT,
        content TEXT,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        key TEXT UNIQUE,
        value TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_context_session ON context(session_id);
    `);
      }
      saveMessage(sessionId, msg) {
        const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (id, session_id, role, content, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(msg.id || Date.now().toString(), sessionId, msg.role, content, JSON.stringify(msg.metadata || {}));
      }
      getMessages(sessionId, limit = 100) {
        const stmt = this.db.prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?");
        const rows = stmt.all(sessionId, limit);
        return rows.map((row) => {
          let parsedContent;
          try {
            const parsed = JSON.parse(row.content);
            parsedContent = Array.isArray(parsed) ? parsed : row.content;
          } catch {
            parsedContent = row.content;
          }
          return {
            id: row.id,
            role: row.role,
            content: parsedContent,
            timestamp: new Date(row.timestamp).getTime(),
            metadata: JSON.parse(row.metadata || "{}")
          };
        });
      }
      saveContext(sessionId, key, value) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO context (session_id, key, value)
      VALUES (?, ?, ?)
    `);
        stmt.run(sessionId, key, value);
      }
      getContext(sessionId, key) {
        if (key) {
          const stmt2 = this.db.prepare("SELECT value FROM context WHERE session_id = ? AND key = ?");
          const row = stmt2.get(sessionId, key);
          return row?.value;
        }
        const stmt = this.db.prepare("SELECT key, value FROM context WHERE session_id = ?");
        const rows = stmt.all(sessionId);
        return Object.fromEntries(rows.map((r) => [r.key, r.value]));
      }
      deleteContext(sessionId, key) {
        const stmt = this.db.prepare("DELETE FROM context WHERE session_id = ? AND key = ?");
        const result = stmt.run(sessionId, key);
        return result.changes > 0;
      }
      clearSession(sessionId) {
        this.db.prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);
        this.db.prepare("DELETE FROM context WHERE session_id = ?").run(sessionId);
      }
      close() {
        this.db.close();
      }
    };
  }
});

// src/memory/embedding-config.ts
var EMBEDDING_DIM, MODEL_NAME, DEFAULT_MAX_ELEMENTS, DEFAULT_M, DEFAULT_EF_CONSTRUCTION;
var init_embedding_config = __esm({
  "src/memory/embedding-config.ts"() {
    "use strict";
    EMBEDDING_DIM = 384;
    MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
    DEFAULT_MAX_ELEMENTS = 5e4;
    DEFAULT_M = 16;
    DEFAULT_EF_CONSTRUCTION = 200;
  }
});

// src/memory/semantic-memory.ts
var import_transformers, hnswlib, import_path, import_promises, SemanticMemory;
var init_semantic_memory = __esm({
  "src/memory/semantic-memory.ts"() {
    "use strict";
    import_transformers = require("@xenova/transformers");
    hnswlib = __toESM(require("hnswlib-node"), 1);
    init_persistent_store();
    import_path = __toESM(require("path"), 1);
    import_promises = __toESM(require("fs/promises"), 1);
    init_embedding_config();
    import_transformers.env.allowLocalModels = true;
    import_transformers.env.allowRemoteModels = true;
    SemanticMemory = class _SemanticMemory {
      embedder;
      index;
      store;
      indexPath;
      metaPath;
      initialized = false;
      maxElements;
      constructor(basePath, maxElements = DEFAULT_MAX_ELEMENTS) {
        this.indexPath = import_path.default.join(basePath, "vectors.hnsw");
        this.metaPath = import_path.default.join(basePath, "metadata.db");
        this.store = new PersistentMemoryStore(this.metaPath);
        this.maxElements = maxElements;
      }
      static async create(basePath = "./omni-semantic", maxElements) {
        await import_promises.default.mkdir(basePath, { recursive: true });
        const instance = new _SemanticMemory(basePath, maxElements);
        await instance.init();
        return instance;
      }
      async init() {
        this.embedder = await (0, import_transformers.pipeline)("feature-extraction", MODEL_NAME);
        const indexExists = await import_promises.default.access(this.indexPath).then(() => true).catch(() => false);
        if (indexExists) {
          this.index = new hnswlib.HierarchicalNSW("l2", EMBEDDING_DIM);
          this.index.readIndexSync(this.indexPath);
        } else {
          this.index = new hnswlib.HierarchicalNSW("l2", EMBEDDING_DIM);
          this.index.initIndex(this.maxElements, DEFAULT_M, DEFAULT_EF_CONSTRUCTION);
        }
        this.initialized = true;
      }
      ensureInitialized() {
        if (!this.initialized) {
          throw new Error("SemanticMemory not initialized. Use SemanticMemory.create() factory method.");
        }
      }
      /**
       * Index multiple chunks efficiently
       */
      async indexChunks(chunks) {
        this.ensureInitialized();
        for (const chunk of chunks) {
          const embedding = await this.embedder(chunk.content, {
            pooling: "mean",
            normalize: true
          });
          const vector = Array.from(embedding.data);
          this.store.saveContext("semantic", chunk.id, JSON.stringify(chunk));
          const label = this.hashToInt(chunk.id);
          try {
            this.index.addPoint(vector, label);
          } catch {
            try {
              this.index.markDelete(label);
              this.index.addPoint(vector, label);
            } catch {
              console.warn(`[SemanticMemory] Could not index chunk ${chunk.id}`);
            }
          }
        }
        this.index.writeIndexSync(this.indexPath);
      }
      /**
       * Remove chunks by IDs
       */
      async removeChunks(chunkIds) {
        this.ensureInitialized();
        for (const id of chunkIds) {
          const label = this.hashToInt(id);
          try {
            this.index.markDelete(label);
            this.store.deleteContext?.("semantic", id);
          } catch {
          }
        }
        this.index.writeIndexSync(this.indexPath);
      }
      /**
       * Search for similar chunks
       */
      async search(query, topK = 5) {
        this.ensureInitialized();
        const currentCount = this.index.getCurrentCount();
        if (currentCount === 0)
          return [];
        const queryEmb = await this.embedder(query, { pooling: "mean", normalize: true });
        const queryVector = Array.from(queryEmb.data);
        const effectiveK = Math.min(topK, currentCount);
        const results = this.index.searchKnn(queryVector, effectiveK);
        const chunks = [];
        for (let i = 0; i < results.neighbors.length; i++) {
          const label = results.neighbors[i];
          const chunk = this.findChunkByLabel(label);
          if (chunk) {
            chunks.push(chunk);
          }
        }
        return chunks;
      }
      /**
       * Search with distances
       */
      async searchWithDistances(query, topK = 5) {
        this.ensureInitialized();
        const currentCount = this.index.getCurrentCount();
        if (currentCount === 0)
          return [];
        const queryEmb = await this.embedder(query, { pooling: "mean", normalize: true });
        const queryVector = Array.from(queryEmb.data);
        const effectiveK = Math.min(topK, currentCount);
        const results = this.index.searchKnn(queryVector, effectiveK);
        const chunks = [];
        for (let i = 0; i < results.neighbors.length; i++) {
          const label = results.neighbors[i];
          const chunk = this.findChunkByLabel(label);
          if (chunk) {
            chunks.push({
              ...chunk,
              distance: results.distances[i]
            });
          }
        }
        return chunks;
      }
      /**
       * Find all chunks for a specific file
       */
      findChunksByFile(filePath) {
        this.ensureInitialized();
        const allContext = this.store.getContext("semantic");
        const chunks = [];
        for (const [key, value] of Object.entries(allContext)) {
          try {
            const meta = JSON.parse(value);
            if (meta.metadata?.file === filePath) {
              chunks.push(meta);
            }
          } catch {
          }
        }
        return chunks;
      }
      /**
       * Get total number of indexed chunks
       */
      getChunkCount() {
        this.ensureInitialized();
        return this.index.getCurrentCount();
      }
      /**
       * Get all indexed file paths
       */
      getIndexedFiles() {
        this.ensureInitialized();
        const allContext = this.store.getContext("semantic");
        const files = /* @__PURE__ */ new Set();
        for (const value of Object.values(allContext)) {
          try {
            const meta = JSON.parse(value);
            if (meta.metadata?.file) {
              files.add(meta.metadata.file);
            }
          } catch {
          }
        }
        return Array.from(files);
      }
      findChunkByLabel(label) {
        const allContext = this.store.getContext("semantic");
        for (const [key, value] of Object.entries(allContext)) {
          try {
            const meta = JSON.parse(value);
            if (this.hashToInt(meta.id || key) === label) {
              return {
                id: meta.id || key,
                content: meta.content,
                metadata: meta.metadata,
                timestamp: meta.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
                type: meta.type || "chunk"
              };
            }
          } catch {
          }
        }
        return null;
      }
      async indexCodebase(globPattern) {
        this.ensureInitialized();
        console.log(`Indexing codebase with ${globPattern}`);
        return 0;
      }
      close() {
        if (this.initialized) {
          try {
            this.index.writeIndexSync(this.indexPath);
          } catch (error) {
            console.warn("[SemanticMemory] Error writing index:", error);
          }
        }
        this.store.close();
      }
      hashToInt(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      }
    };
  }
});

// src/memory/smart-chunker.ts
var fs8, path8, LANGUAGE_PATTERNS, EXT_TO_LANGUAGE, SmartChunker;
var init_smart_chunker = __esm({
  "src/memory/smart-chunker.ts"() {
    "use strict";
    fs8 = __toESM(require("fs/promises"), 1);
    path8 = __toESM(require("path"), 1);
    LANGUAGE_PATTERNS = {
      // TypeScript/JavaScript patterns
      typescript: [
        // Export declarations (functions, classes, const)
        /export\s+(?:async\s+)?(?:function\s+)?(?:class\s+)?(?:interface\s+)?(?:type\s+)?(?:const\s+)?(?:let\s+)?(?:var\s+)?([A-Za-z_$][A-Za-z0-9_$]*)/g,
        // Function declarations
        /(?:async\s+)?(?:function\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*[<(]/g,
        // Class declarations
        /class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends|implements|<|\{)/g,
        // Interface declarations
        /interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends|<|\{)/g,
        // Type declarations
        /type\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=]/g,
        // Method declarations (simplified)
        /(?:public|private|protected|static|async)?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g
      ],
      // Python patterns
      python: [
        // Function definitions
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        // Class definitions
        /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*:/g,
        // Import statements
        /(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/g
      ],
      // Scala patterns
      scala: [
        // Class/trait/object definitions
        /(?:class|trait|object|case class|case object)\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        // Method/function definitions
        /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
        // Val/Var declarations
        /(?:val|var|lazy val)\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        // Type definitions
        /type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g,
        // Import statements
        /import\s+([a-zA-Z_.]+)/g
      ],
      // Groovy patterns
      groovy: [
        // Class definitions
        /class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:extends|implements|\{)/g,
        // Method/closure definitions
        /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*[\(\{]/g,
        // Function definitions
        /(?:void|String|int|boolean|def)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
        // Import statements
        /import\s+([a-zA-Z_.]+)/g
      ],
      // Lua patterns
      lua: [
        // Function declarations (local and global)
        /(?:local\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        // Local function declarations with table prefix
        /(?:local\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)/g,
        // Variable assignments with function values
        /(?:local\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*function/g,
        // Module require statements
        /(?:local\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*require/g
      ],
      // Perl patterns
      perl: [
        // Subroutine definitions
        /sub\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g,
        // Package declarations
        /package\s+([A-Za-z_][A-Za-z0-9_]*);/g,
        // Use statements
        /use\s+([A-Za-z_][A-Za-z0-9_:]*)/g,
        // My/our variable declarations
        /(?:my|our)\s+\$?([A-Za-z_][A-Za-z0-9_]*)/g
      ],
      // R patterns
      r: [
        // Function definitions
        /([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*function/g,
        // Variable assignments
        /([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*[^<-]/g,
        // Library imports
        /(?:library|require)\s*\(\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*\)/g,
        // Source statements
        /source\s*\(/g
      ]
    };
    EXT_TO_LANGUAGE = {
      // TypeScript/JavaScript
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "typescript",
      ".jsx": "typescript",
      ".mjs": "typescript",
      ".cjs": "typescript",
      // Python
      ".py": "python",
      ".pyi": "python",
      ".pyw": "python",
      // Ruby/PHP
      ".rb": "ruby",
      ".erb": "ruby",
      ".php": "php",
      // Systems languages
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
      ".kt": "kotlin",
      ".kts": "kotlin",
      ".swift": "swift",
      ".cpp": "cpp",
      ".c": "c",
      ".h": "c",
      ".hpp": "cpp",
      ".cs": "csharp",
      ".fs": "fsharp",
      // JVM Languages
      ".scala": "scala",
      ".sc": "scala",
      ".groovy": "groovy",
      ".gvy": "groovy",
      // Scripting
      ".lua": "lua",
      ".pl": "perl",
      ".pm": "perl",
      ".r": "r",
      ".R": "r",
      ".rmd": "r",
      ".ps1": "powershell",
      ".psm1": "powershell",
      ".psd1": "powershell",
      // Functional
      ".hs": "haskell",
      ".lhs": "haskell",
      ".clj": "clojure",
      ".cljs": "clojure",
      ".erl": "erlang",
      ".hrl": "erlang",
      ".ex": "elixir",
      ".exs": "elixir",
      ".ml": "ocaml",
      ".mli": "ocaml",
      // Scientific
      ".jl": "julia",
      // Systems/Embedded
      ".zig": "zig",
      ".nim": "nim",
      ".nims": "nim",
      ".cr": "crystal",
      // Data/Schema
      ".graphql": "graphql",
      ".gql": "graphql",
      ".proto": "protobuf",
      // Config/Infrastructure
      ".tf": "hcl",
      ".tfvars": "hcl",
      ".hcl": "hcl"
    };
    SmartChunker = class {
      maxChunkSize;
      fallbackChunkSize;
      constructor(maxChunkSize = 2e3, fallbackChunkSize = 20) {
        this.maxChunkSize = maxChunkSize;
        this.fallbackChunkSize = fallbackChunkSize;
      }
      async chunkFile(filePath, baseDir) {
        try {
          const stats = await fs8.stat(filePath);
          const content = await fs8.readFile(filePath, "utf-8");
          const relPath = path8.relative(baseDir, filePath);
          const ext = path8.extname(filePath).toLowerCase();
          const language = EXT_TO_LANGUAGE[ext] || "text";
          if (content.length > this.maxChunkSize * 50) {
            return this.createSimpleChunk(relPath, content, language, stats.mtimeMs);
          }
          const semanticLanguages = ["typescript", "python", "scala", "groovy", "lua", "perl", "r"];
          if (semanticLanguages.includes(language)) {
            const chunks = this.extractSemanticChunks(relPath, content, language, stats.mtimeMs);
            if (chunks.length > 0) {
              return chunks;
            }
          }
          return this.createLineBasedChunks(relPath, content, language, stats.mtimeMs);
        } catch (error) {
          console.warn(`[SmartChunker] Failed to chunk ${filePath}:`, error);
          return [];
        }
      }
      extractSemanticChunks(filePath, content, language, lastModified) {
        const lines = content.split("\n");
        const chunks = [];
        const patterns = LANGUAGE_PATTERNS[language] || [];
        const symbols = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (language === "typescript") {
            const exportMatch = line.match(
              /export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:class|function|interface|type|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/
            );
            if (exportMatch) {
              const type = this.detectType(line);
              symbols.push({
                line: i,
                type,
                name: exportMatch[1],
                signature: this.extractSignature(lines, i)
              });
              continue;
            }
            const classMatch = line.match(/class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[<{]/);
            if (classMatch) {
              symbols.push({
                line: i,
                type: "class",
                name: classMatch[1],
                signature: this.extractSignature(lines, i)
              });
              continue;
            }
            const interfaceMatch = line.match(/interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[<{]/);
            if (interfaceMatch) {
              symbols.push({
                line: i,
                type: "interface",
                name: interfaceMatch[1],
                signature: this.extractSignature(lines, i)
              });
              continue;
            }
            const funcMatch = line.match(
              /(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/
            );
            if (funcMatch && !line.includes("=>")) {
              symbols.push({
                line: i,
                type: "function",
                name: funcMatch[1],
                signature: this.extractSignature(lines, i)
              });
              continue;
            }
            const arrowMatch = line.match(
              /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=].*=>/
            );
            if (arrowMatch) {
              symbols.push({
                line: i,
                type: "function",
                name: arrowMatch[1],
                signature: this.extractSignature(lines, i)
              });
            }
          }
          if (language === "python") {
            const funcMatch = line.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
            if (funcMatch) {
              symbols.push({
                line: i,
                type: "function",
                name: funcMatch[1],
                signature: line.trim()
              });
              continue;
            }
            const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/);
            if (classMatch) {
              symbols.push({
                line: i,
                type: "class",
                name: classMatch[1],
                signature: line.trim()
              });
            }
          }
        }
        if (symbols.length > 0) {
          symbols.sort((a, b) => a.line - b.line);
          for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const startLine = symbol.line;
            const endLine = i < symbols.length - 1 ? symbols[i + 1].line : lines.length;
            let chunkLines = lines.slice(startLine, endLine);
            let chunkContent = chunkLines.join("\n").trim();
            if (chunkContent.length > this.maxChunkSize) {
              const subChunks = this.splitLargeChunk(chunkContent, this.maxChunkSize);
              for (let j = 0; j < subChunks.length; j++) {
                chunks.push({
                  id: `${filePath}:${symbol.name}:${j}`,
                  content: subChunks[j],
                  metadata: {
                    file: filePath,
                    startLine: startLine + 1,
                    endLine,
                    type: symbol.type,
                    name: symbol.name,
                    signature: j === 0 ? symbol.signature : void 0,
                    language,
                    lastModified
                  }
                });
              }
            } else if (chunkContent.length > 50) {
              chunks.push({
                id: `${filePath}:${symbol.name}`,
                content: chunkContent,
                metadata: {
                  file: filePath,
                  startLine: startLine + 1,
                  endLine,
                  type: symbol.type,
                  name: symbol.name,
                  signature: symbol.signature,
                  language,
                  lastModified
                }
              });
            }
          }
        }
        return chunks;
      }
      detectType(line) {
        if (line.includes("class"))
          return "class";
        if (line.includes("interface"))
          return "interface";
        if (line.includes("type "))
          return "type";
        if (line.includes("function"))
          return "function";
        return "export";
      }
      extractSignature(lines, startLine) {
        let signature = lines[startLine].trim();
        let i = startLine + 1;
        while (i < lines.length && i < startLine + 3) {
          const line = lines[i].trim();
          if (line.startsWith("<") || line.startsWith("(") || line.startsWith("extends")) {
            signature += " " + line;
          }
          if (line.includes("{") || line.includes("=")) {
            break;
          }
          i++;
        }
        return signature.substring(0, 200);
      }
      splitLargeChunk(content, maxSize) {
        const chunks = [];
        let remaining = content;
        while (remaining.length > maxSize) {
          let breakPoint = maxSize;
          while (breakPoint > maxSize * 0.5 && remaining[breakPoint] !== "\n") {
            breakPoint--;
          }
          if (breakPoint <= maxSize * 0.5) {
            breakPoint = maxSize;
          }
          chunks.push(remaining.substring(0, breakPoint).trim());
          remaining = remaining.substring(breakPoint).trim();
        }
        if (remaining.length > 50) {
          chunks.push(remaining);
        }
        return chunks;
      }
      createLineBasedChunks(filePath, content, language, lastModified) {
        const lines = content.split("\n");
        const chunks = [];
        const chunkSize = this.fallbackChunkSize;
        for (let i = 0; i < lines.length; i += chunkSize) {
          const chunkLines = lines.slice(i, i + chunkSize);
          const chunkContent = chunkLines.join("\n").trim();
          if (chunkContent.length > 50) {
            chunks.push({
              id: `${filePath}:${i}`,
              content: chunkContent,
              metadata: {
                file: filePath,
                startLine: i + 1,
                endLine: Math.min(i + chunkSize, lines.length),
                type: "chunk",
                language,
                lastModified
              }
            });
          }
        }
        return chunks;
      }
      createSimpleChunk(filePath, content, language, lastModified) {
        const firstPart = content.substring(0, this.maxChunkSize);
        const lastPart = content.substring(content.length - Math.min(this.maxChunkSize, content.length * 0.1));
        const chunks = [
          {
            id: `${filePath}:start`,
            content: firstPart,
            metadata: {
              file: filePath,
              startLine: 1,
              endLine: firstPart.split("\n").length,
              type: "chunk",
              language,
              lastModified
            }
          }
        ];
        if (content.length > this.maxChunkSize * 2) {
          chunks.push({
            id: `${filePath}:end`,
            content: lastPart,
            metadata: {
              file: filePath,
              startLine: content.split("\n").length - lastPart.split("\n").length + 1,
              endLine: content.split("\n").length,
              type: "chunk",
              language,
              lastModified
            }
          });
        }
        return chunks;
      }
      // Utility method to check if a file should be indexed
      static shouldIndexFile(filePath, excludePatterns) {
        const basename13 = path8.basename(filePath);
        const relativePath = filePath;
        for (const pattern of excludePatterns) {
          if (this.matchesGlob(basename13, pattern) || this.matchesGlob(relativePath, pattern)) {
            return false;
          }
        }
        const binaryExts = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".ico",
          ".svg",
          ".webp",
          ".mp3",
          ".mp4",
          ".wav",
          ".avi",
          ".mov",
          ".pdf",
          ".doc",
          ".docx",
          ".xls",
          ".xlsx",
          ".zip",
          ".tar",
          ".gz",
          ".rar",
          ".7z",
          ".exe",
          ".dll",
          ".so",
          ".dylib",
          ".ttf",
          ".otf",
          ".woff",
          ".woff2"
        ];
        const ext = path8.extname(filePath).toLowerCase();
        if (binaryExts.includes(ext)) {
          return false;
        }
        return true;
      }
      static matchesGlob(str, pattern) {
        const regexPattern = pattern.replace(/\*\*/g, "{{GLOBSTAR}}").replace(/\*/g, "[^/]*").replace(/\?/g, ".").replace(/\{\{GLOBSTAR\}\}/g, ".*");
        try {
          const regex = new RegExp(regexPattern);
          return regex.test(str);
        } catch {
          return str.includes(pattern.replace(/\*/g, "").replace(/\?/g, ""));
        }
      }
    };
  }
});

// src/memory/indexing-config.ts
var indexing_config_exports = {};
__export(indexing_config_exports, {
  DEFAULT_INDEXING_CONFIG: () => DEFAULT_INDEXING_CONFIG,
  IndexingConfigManager: () => IndexingConfigManager,
  clearConfigManager: () => clearConfigManager,
  getIndexingConfigManager: () => getIndexingConfigManager
});
function getIndexingConfigManager(projectPath) {
  if (!configManagers.has(projectPath)) {
    configManagers.set(projectPath, new IndexingConfigManager(projectPath));
  }
  return configManagers.get(projectPath);
}
function clearConfigManager(projectPath) {
  configManagers.delete(projectPath);
}
var fs9, path9, DEFAULT_INDEXING_CONFIG, GITIGNORE_PATTERNS, IndexingConfigManager, configManagers;
var init_indexing_config = __esm({
  "src/memory/indexing-config.ts"() {
    "use strict";
    fs9 = __toESM(require("fs/promises"), 1);
    path9 = __toESM(require("path"), 1);
    DEFAULT_INDEXING_CONFIG = {
      autoIndex: true,
      autoSync: true,
      syncIntervalMinutes: 5,
      chunkSize: 20,
      useSemanticChunking: true,
      maxChunkSize: 2e3,
      maxFilesToIndex: 500,
      maxFileSizeBytes: 1024 * 1024,
      // 1MB
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        ".next/**",
        ".cache/**",
        "**/*.log",
        "**/Thumbs.db",
        "**/.DS_Store",
        ".omnicode/**",
        "**/*.min.js",
        "**/*.bundle.js",
        "**/package-lock.json",
        "**/yarn.lock",
        "**/pnpm-lock.yaml"
      ],
      embeddingBatchSize: 10,
      indexConcurrency: 4
    };
    GITIGNORE_PATTERNS = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".next",
      ".nuxt",
      ".cache",
      "*.log",
      "*.min.js",
      "*.min.css",
      "*.map",
      ".env",
      ".env.*",
      ".idea",
      ".vscode"
    ];
    IndexingConfigManager = class {
      configPath;
      omniignorePath;
      config;
      customExcludes = [];
      constructor(projectPath) {
        const omnicodeDir = path9.join(projectPath, ".omnicode");
        this.configPath = path9.join(omnicodeDir, "index-config.json");
        this.omniignorePath = path9.join(projectPath, ".omniignore");
        this.config = { ...DEFAULT_INDEXING_CONFIG };
      }
      async load() {
        try {
          const configExists = await fs9.access(this.configPath).then(() => true).catch(() => false);
          if (configExists) {
            const content = await fs9.readFile(this.configPath, "utf-8");
            const loaded = JSON.parse(content);
            this.config = { ...DEFAULT_INDEXING_CONFIG, ...loaded };
          }
          await this.loadOmniignore();
          return this.config;
        } catch (error) {
          console.warn("[IndexingConfig] Failed to load config, using defaults:", error);
          return this.config;
        }
      }
      async save() {
        try {
          const dir = path9.dirname(this.configPath);
          await fs9.mkdir(dir, { recursive: true });
          await fs9.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
        } catch (error) {
          console.error("[IndexingConfig] Failed to save config:", error);
          throw error;
        }
      }
      async loadOmniignore() {
        try {
          const exists = await fs9.access(this.omniignorePath).then(() => true).catch(() => false);
          if (exists) {
            const content = await fs9.readFile(this.omniignorePath, "utf-8");
            this.customExcludes = content.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
          }
        } catch (error) {
        }
        return this.customExcludes;
      }
      getConfig() {
        return { ...this.config };
      }
      updateConfig(updates) {
        this.config = { ...this.config, ...updates };
      }
      getAllExclusionPatterns() {
        return [
          ...this.config.excludePatterns,
          ...GITIGNORE_PATTERNS,
          ...this.customExcludes
        ];
      }
      getIndexDirectory() {
        return path9.join(path9.dirname(this.configPath), "index");
      }
      async ensureIndexDirectory() {
        const dir = this.getIndexDirectory();
        await fs9.mkdir(dir, { recursive: true });
        return dir;
      }
    };
    configManagers = /* @__PURE__ */ new Map();
  }
});

// src/memory/project-indexer.ts
function clearConfigManager2(projectPath) {
  Promise.resolve().then(() => (init_indexing_config(), indexing_config_exports)).then((m) => m.clearConfigManager(projectPath));
}
async function getProjectIndexer(projectPath) {
  if (!activeIndexers.has(projectPath)) {
    const indexer = new ProjectIndexer(projectPath);
    await indexer.initialize();
    activeIndexers.set(projectPath, indexer);
  }
  return activeIndexers.get(projectPath);
}
async function closeProjectIndexer(projectPath) {
  const indexer = activeIndexers.get(projectPath);
  if (indexer) {
    await indexer.destroy();
    activeIndexers.delete(projectPath);
  }
}
async function closeAllProjectIndexers() {
  const promises = Array.from(activeIndexers.values()).map((idx) => idx.destroy());
  await Promise.all(promises);
  activeIndexers.clear();
}
var fs10, path10, import_fast_glob, INDEX_VERSION, SEMANTIC_SEARCH_THRESHOLD, DEFAULT_SYNC_INTERVAL_MS, ProjectIndexer, DEFAULT_INDEXING_CONFIG2, activeIndexers;
var init_project_indexer = __esm({
  "src/memory/project-indexer.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    import_fast_glob = __toESM(require("fast-glob"), 1);
    init_semantic_memory();
    init_smart_chunker();
    init_indexing_config();
    INDEX_VERSION = 1;
    SEMANTIC_SEARCH_THRESHOLD = 80;
    DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1e3;
    ProjectIndexer = class {
      projectPath;
      semanticMemory = null;
      smartChunker;
      config;
      state;
      statusFilePath;
      indexDir;
      fileTimestamps = /* @__PURE__ */ new Map();
      indexedFiles = /* @__PURE__ */ new Set();
      syncTimer = null;
      abortController = null;
      isDestroyed = false;
      // Callbacks for status updates
      onStatusChange;
      onProgress;
      constructor(projectPath) {
        this.projectPath = projectPath;
        this.config = { ...DEFAULT_INDEXING_CONFIG2 };
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        this.indexDir = path10.join(projectPath, ".omnicode", "index");
        this.statusFilePath = path10.join(this.indexDir, "status.json");
        this.state = {
          status: "idle",
          progress: 0,
          totalFiles: 0,
          processedFiles: 0,
          indexedChunks: 0,
          lastSyncAt: null,
          lastError: null,
          isSemanticSearchReady: false
        };
      }
      async initialize() {
        if (this.isDestroyed) {
          throw new Error("ProjectIndexer has been destroyed");
        }
        const configManager = getIndexingConfigManager(this.projectPath);
        this.config = await configManager.load();
        await fs10.mkdir(this.indexDir, { recursive: true });
        this.semanticMemory = await SemanticMemory.create(this.indexDir);
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        await this.loadStatus();
      }
      async loadStatus() {
        try {
          const exists = await fs10.access(this.statusFilePath).then(() => true).catch(() => false);
          if (exists) {
            const content = await fs10.readFile(this.statusFilePath, "utf-8");
            const status = JSON.parse(content);
            if (status.version === INDEX_VERSION) {
              this.state = status.state;
              this.indexedFiles = new Set(status.indexedFiles);
              this.fileTimestamps.clear();
              for (const [file, timestamp] of Object.entries(status.fileTimestamps)) {
                this.fileTimestamps.set(file, timestamp);
              }
              if (this.state.lastSyncAt) {
                const hoursSinceSync = (Date.now() - this.state.lastSyncAt) / (1e3 * 60 * 60);
                if (hoursSinceSync > 24 && this.config.autoIndex) {
                  console.log("[ProjectIndexer] Index is stale, will reindex");
                  this.state.status = "idle";
                  this.state.progress = 0;
                }
              }
            }
          }
        } catch (error) {
          console.warn("[ProjectIndexer] Failed to load status:", error);
          this.resetState();
        }
      }
      async saveStatus() {
        try {
          const status = {
            version: INDEX_VERSION,
            projectPath: this.projectPath,
            state: this.state,
            indexedFiles: Array.from(this.indexedFiles),
            fileTimestamps: Object.fromEntries(this.fileTimestamps)
          };
          await fs10.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), "utf-8");
        } catch (error) {
          console.error("[ProjectIndexer] Failed to save status:", error);
        }
      }
      resetState() {
        this.state = {
          status: "idle",
          progress: 0,
          totalFiles: 0,
          processedFiles: 0,
          indexedChunks: 0,
          lastSyncAt: null,
          lastError: null,
          isSemanticSearchReady: false
        };
        this.indexedFiles.clear();
        this.fileTimestamps.clear();
      }
      /**
       * Start automatic indexing
       */
      async startIndexing() {
        if (this.isDestroyed)
          return;
        if (this.state.status === "indexing") {
          console.log("[ProjectIndexer] Already indexing, skipping");
          return;
        }
        if (!this.config.autoIndex) {
          console.log("[ProjectIndexer] Auto-index disabled, skipping");
          return;
        }
        try {
          await this.performIndexing(false);
        } catch (error) {
          console.error("[ProjectIndexer] Indexing failed:", error);
          this.updateState({
            status: "error",
            lastError: error.message
          });
        }
      }
      /**
       * Force full reindex
       */
      async reindex() {
        if (this.isDestroyed)
          return;
        await this.clearIndex();
        await this.performIndexing(true);
      }
      /**
       * Clear the index completely
       */
      async clearIndex() {
        if (this.semanticMemory) {
          this.semanticMemory.close();
          this.semanticMemory = null;
        }
        try {
          const files = ["vectors.hnsw", "metadata.db", "status.json"];
          for (const file of files) {
            const filePath = path10.join(this.indexDir, file);
            const exists = await fs10.access(filePath).then(() => true).catch(() => false);
            if (exists) {
              await fs10.unlink(filePath);
            }
          }
        } catch (error) {
          console.warn("[ProjectIndexer] Error clearing index files:", error);
        }
        this.resetState();
        await fs10.mkdir(this.indexDir, { recursive: true });
        this.semanticMemory = await SemanticMemory.create(this.indexDir);
        this.notifyStatusChange();
      }
      /**
       * Perform the actual indexing
       */
      async performIndexing(fullRebuild) {
        if (!this.semanticMemory) {
          throw new Error("Semantic memory not initialized");
        }
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        this.updateState({
          status: "indexing",
          progress: 0,
          processedFiles: 0,
          indexedChunks: 0
        });
        try {
          const configManager = getIndexingConfigManager(this.projectPath);
          const excludePatterns = configManager.getAllExclusionPatterns();
          const includePatterns = [
            "**/*.{ts,tsx,js,jsx,mjs,cjs}",
            "**/*.{py,pyi}",
            "**/*.{java,kt}",
            "**/*.{go,rs}",
            "**/*.{rb,php}",
            "**/*.{swift,c,cpp,h,hpp}",
            "**/*.{cs,fs}"
          ];
          const files = await (0, import_fast_glob.default)(includePatterns, {
            cwd: this.projectPath,
            ignore: excludePatterns,
            absolute: true,
            followSymbolicLinks: false,
            concurrency: this.config.indexConcurrency
          });
          const limitedFiles = files.slice(0, this.config.maxFilesToIndex);
          this.updateState({ totalFiles: limitedFiles.length });
          let filesToIndex = limitedFiles;
          if (!fullRebuild && this.state.lastSyncAt) {
            filesToIndex = await this.getChangedFiles(limitedFiles);
            if (filesToIndex.length === 0) {
              console.log("[ProjectIndexer] No changed files, skipping sync");
              this.updateState({
                status: "complete",
                progress: 100,
                lastSyncAt: Date.now()
              });
              return;
            }
            console.log(`[ProjectIndexer] Incremental sync: ${filesToIndex.length} changed files`);
          }
          const batchSize = this.config.embeddingBatchSize;
          let processedCount = 0;
          let totalChunks = 0;
          for (let i = 0; i < filesToIndex.length; i += batchSize) {
            if (signal.aborted) {
              throw new Error("Indexing aborted");
            }
            const batch = filesToIndex.slice(i, i + batchSize);
            const batchChunks = [];
            for (const filePath of batch) {
              try {
                const chunks = await this.smartChunker.chunkFile(filePath, this.projectPath);
                batchChunks.push(...chunks);
                this.indexedFiles.add(path10.relative(this.projectPath, filePath));
                const stats = await fs10.stat(filePath);
                this.fileTimestamps.set(filePath, stats.mtimeMs);
              } catch (error) {
                console.warn(`[ProjectIndexer] Failed to process ${filePath}:`, error);
              }
            }
            if (batchChunks.length > 0) {
              const memoryChunks = batchChunks.map((chunk) => ({
                id: chunk.id,
                content: this.formatChunkContent(chunk),
                type: "rag_chunk",
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                metadata: chunk.metadata
              }));
              await this.semanticMemory.indexChunks(memoryChunks);
              totalChunks += memoryChunks.length;
            }
            processedCount += batch.length;
            const progress = Math.round(processedCount / filesToIndex.length * 100);
            const isSemanticReady = progress >= SEMANTIC_SEARCH_THRESHOLD || fullRebuild === false && this.state.isSemanticSearchReady;
            this.updateState({
              progress,
              processedFiles: processedCount,
              indexedChunks: totalChunks,
              isSemanticSearchReady: isSemanticReady
            });
            if (processedCount % 20 === 0) {
              await this.saveStatus();
            }
          }
          if (!fullRebuild) {
            await this.removeDeletedFiles(limitedFiles);
          }
          this.updateState({
            status: "complete",
            progress: 100,
            lastSyncAt: Date.now(),
            indexedChunks: totalChunks,
            isSemanticSearchReady: true
          });
          await this.saveStatus();
          if (this.config.autoSync) {
            this.startAutoSync();
          }
        } catch (error) {
          if (error.message === "Indexing aborted") {
            this.updateState({ status: "paused" });
          } else {
            this.updateState({
              status: "error",
              lastError: error.message
            });
          }
          throw error;
        }
      }
      /**
       * Get files that have changed since last sync
       */
      async getChangedFiles(allFiles) {
        const changed = [];
        for (const filePath of allFiles) {
          try {
            const stats = await fs10.stat(filePath);
            const lastModified = this.fileTimestamps.get(filePath);
            if (!lastModified || stats.mtimeMs > lastModified) {
              changed.push(filePath);
            }
          } catch {
            changed.push(filePath);
          }
        }
        const currentFiles = new Set(allFiles);
        for (const [filePath] of this.fileTimestamps) {
          if (!currentFiles.has(filePath)) {
          }
        }
        return changed;
      }
      /**
       * Remove deleted files from the index
       */
      async removeDeletedFiles(currentFiles) {
        const currentSet = new Set(currentFiles);
        const toRemove = [];
        for (const indexedFile of this.indexedFiles) {
          const fullPath = path10.join(this.projectPath, indexedFile);
          if (!currentSet.has(fullPath)) {
            toRemove.push(indexedFile);
            this.fileTimestamps.delete(fullPath);
          }
        }
        for (const file of toRemove) {
          this.indexedFiles.delete(file);
        }
      }
      /**
       * Format chunk content with metadata for better embeddings
       */
      formatChunkContent(chunk) {
        const parts = [];
        parts.push(`File: ${chunk.metadata.file}`);
        if (chunk.metadata.name) {
          parts.push(`${chunk.metadata.type}: ${chunk.metadata.name}`);
        }
        if (chunk.metadata.signature) {
          parts.push(`Signature: ${chunk.metadata.signature}`);
        }
        parts.push("---");
        parts.push(chunk.content);
        return parts.join("\n");
      }
      /**
       * Start automatic periodic sync
       */
      startAutoSync() {
        this.stopAutoSync();
        if (!this.config.autoSync)
          return;
        const intervalMs = this.config.syncIntervalMinutes * 60 * 1e3;
        this.syncTimer = setInterval(async () => {
          if (this.state.status !== "indexing") {
            console.log("[ProjectIndexer] Running auto-sync...");
            try {
              await this.performIndexing(false);
            } catch (error) {
              console.error("[ProjectIndexer] Auto-sync failed:", error);
            }
          }
        }, intervalMs);
      }
      /**
       * Stop auto-sync
       */
      stopAutoSync() {
        if (this.syncTimer) {
          clearInterval(this.syncTimer);
          this.syncTimer = null;
        }
      }
      /**
       * Abort current indexing operation
       */
      abort() {
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
        }
      }
      /**
       * Update indexing configuration
       */
      async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        const configManager = getIndexingConfigManager(this.projectPath);
        configManager.updateConfig(updates);
        await configManager.save();
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        if (updates.syncIntervalMinutes !== void 0) {
          this.startAutoSync();
        }
      }
      /**
       * Query the indexed codebase
       */
      async query(query, topK = 5) {
        if (!this.semanticMemory) {
          throw new Error("Semantic memory not initialized");
        }
        if (!this.state.isSemanticSearchReady) {
          throw new Error(`Semantic search not ready. Indexing at ${this.state.progress}%, need ${SEMANTIC_SEARCH_THRESHOLD}%`);
        }
        return this.semanticMemory.search(query, topK);
      }
      /**
       * Get current indexing state
       */
      getState() {
        return { ...this.state };
      }
      /**
       * Check if semantic search is available
       */
      isSemanticSearchReady() {
        return this.state.isSemanticSearchReady;
      }
      /**
       * Update state and notify listeners
       */
      updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyStatusChange();
      }
      notifyStatusChange() {
        if (this.onStatusChange) {
          this.onStatusChange(this.getState());
        }
        if (this.onProgress && this.state.totalFiles > 0) {
          this.onProgress(this.state.processedFiles, this.state.totalFiles);
        }
      }
      /**
       * Cleanup resources
       */
      async destroy() {
        this.isDestroyed = true;
        this.abort();
        this.stopAutoSync();
        if (this.semanticMemory) {
          await this.saveStatus();
          this.semanticMemory.close();
          this.semanticMemory = null;
        }
        clearConfigManager2(this.projectPath);
      }
    };
    DEFAULT_INDEXING_CONFIG2 = {
      autoIndex: true,
      autoSync: true,
      syncIntervalMinutes: 5,
      chunkSize: 20,
      useSemanticChunking: true,
      maxChunkSize: 2e3,
      maxFilesToIndex: 500,
      maxFileSizeBytes: 1024 * 1024,
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        ".next/**",
        ".cache/**"
      ],
      embeddingBatchSize: 10,
      indexConcurrency: 4
    };
    activeIndexers = /* @__PURE__ */ new Map();
  }
});

// src/tools/builtin/index-codebase.ts
var IndexCodebaseTool;
var init_index_codebase = __esm({
  "src/tools/builtin/index-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
    IndexCodebaseTool = class {
      name = "IndexCodebase";
      description = `Indexes the codebase for semantic search. Chunks files into embeddable pieces and stores in vector DB. Use before complex tasks like refactoring. Runs ~1-5min first time. Uses smart semantic chunking for better results.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "Glob pattern to index (default: src/**/*.{ts,tsx,js,jsx,py})"
          },
          maxFiles: {
            type: "number",
            description: "Max files to index (default: 100)"
          },
          force: {
            type: "boolean",
            description: "Force full reindex instead of incremental update"
          }
        },
        required: []
      };
      validate(input) {
        if (input.pattern !== void 0 && typeof input.pattern !== "string") {
          return "pattern must be a string glob pattern";
        }
        if (input.maxFiles !== void 0 && (typeof input.maxFiles !== "number" || input.maxFiles < 1)) {
          return "maxFiles must be a positive number";
        }
        if (input.force !== void 0 && typeof input.force !== "boolean") {
          return "force must be a boolean";
        }
        return null;
      }
      async execute(input, context) {
        const force = input.force || false;
        try {
          const indexer = new ProjectIndexer(context.cwd);
          await indexer.initialize();
          const maxFiles = input.maxFiles;
          if (maxFiles) {
            await indexer.updateConfig({ maxFilesToIndex: maxFiles });
          }
          if (force) {
            await indexer.reindex();
          } else {
            await indexer.startIndexing();
          }
          const state = indexer.getState();
          indexer.destroy();
          if (state.status === "error") {
            return {
              content: `Error indexing codebase: ${state.lastError}`,
              isError: true
            };
          }
          return {
            content: `Successfully indexed ${state.processedFiles} files with ${state.indexedChunks} chunks. Semantic search is ${state.isSemanticSearchReady ? "ready" : "building (80% needed)"}.`
          };
        } catch (error) {
          return {
            content: `Error indexing codebase: ${error.message}`,
            isError: true
          };
        }
      }
      formatForDisplay(result, _input) {
        return result.content;
      }
    };
  }
});

// src/git/git-manager.ts
var import_simple_git, GitManager;
var init_git_manager = __esm({
  "src/git/git-manager.ts"() {
    "use strict";
    import_simple_git = __toESM(require("simple-git"), 1);
    GitManager = class {
      git;
      constructor(cwd) {
        this.git = (0, import_simple_git.default)(cwd);
      }
      async isRepo() {
        try {
          await this.git.revparse(["--is-inside-work-tree"]);
          return true;
        } catch {
          return false;
        }
      }
      async status() {
        const status = await this.git.status();
        const lines = [];
        lines.push(`Branch: ${status.current}`);
        if (status.ahead)
          lines.push(`Ahead: ${status.ahead}`);
        if (status.behind)
          lines.push(`Behind: ${status.behind}`);
        if (status.staged.length)
          lines.push(`Staged: ${status.staged.join(", ")}`);
        if (status.modified.length)
          lines.push(`Modified: ${status.modified.join(", ")}`);
        if (status.not_added.length)
          lines.push(`Untracked: ${status.not_added.join(", ")}`);
        if (status.conflicted.length)
          lines.push(`Conflicted: ${status.conflicted.join(", ")}`);
        return lines.join("\n");
      }
      async statusStructured() {
        const status = await this.git.status();
        return {
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          modified: status.modified,
          not_added: status.not_added,
          conflicted: status.conflicted,
          deleted: status.deleted,
          renamed: status.renamed.map((r) => ({ from: r.from, to: r.to })),
          created: status.created
        };
      }
      async diff(staged = false) {
        if (staged) {
          return this.git.diff(["--staged"]);
        }
        return this.git.diff();
      }
      async diffFile(filePath, staged = false) {
        const args = staged ? ["--staged", "--", filePath] : ["--", filePath];
        return this.git.diff(args);
      }
      async log(maxCount = 10, oneline = false, file) {
        const options = { maxCount };
        if (file)
          options.file = file;
        const log = await this.git.log(options);
        if (oneline) {
          return log.all.map((c) => `${c.hash.substring(0, 7)} ${c.message}`).join("\n");
        }
        return log.all.map((c) => `${c.hash.substring(0, 7)} ${c.message} (${c.author_name})`).join("\n");
      }
      async logStructured(maxCount = 20) {
        const log = await this.git.log({ maxCount });
        return log.all.map((c) => ({
          hash: c.hash.substring(0, 7),
          message: c.message,
          author: c.author_name,
          date: c.date
        }));
      }
      async add(files) {
        await this.git.add(files);
      }
      async addAll() {
        await this.git.add(["-A"]);
      }
      async unstage(files) {
        await this.git.reset(["HEAD", "--", ...files]);
      }
      async discardFile(files) {
        await this.git.checkout(["--", ...files]);
      }
      async commit(message) {
        const result = await this.git.commit(message);
        return result.commit;
      }
      async currentBranch() {
        const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
        return branch.trim();
      }
      async createBranch(name) {
        await this.git.checkoutLocalBranch(name);
      }
      async push(remote = "origin", branch) {
        const currentBranch = branch || await this.currentBranch();
        await this.git.push(remote, currentBranch, ["--set-upstream"]);
      }
      async pull(remote = "origin", branch) {
        const currentBranch = branch || await this.currentBranch();
        await this.git.pull(remote, currentBranch);
      }
      async fetch(remote = "origin") {
        await this.git.fetch(remote);
      }
      async diffRange(range) {
        return this.git.diff([range]);
      }
      async listBranches() {
        const result = await this.git.branchLocal();
        return result.all;
      }
      async switchBranch(name) {
        await this.git.checkout(name);
      }
      async deleteBranch(name) {
        await this.git.deleteLocalBranch(name);
      }
      async stash(action, message, index = 0) {
        switch (action) {
          case "push": {
            const args = message ? ["push", "-m", message] : ["push"];
            return this.git.stash(args);
          }
          case "pop":
            return this.git.stash(["pop", `stash@{${index}}`]);
          case "apply":
            return this.git.stash(["apply", `stash@{${index}}`]);
          case "drop":
            return this.git.stash(["drop", `stash@{${index}}`]);
          case "list":
            return this.git.stash(["list"]);
          default:
            throw new Error(`Unknown stash action: ${action}`);
        }
      }
      async init() {
        await this.git.init();
      }
    };
  }
});

// src/tools/builtin/preview-diff.ts
var import_simple_git2, PreviewDiffTool;
var init_preview_diff = __esm({
  "src/tools/builtin/preview-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    import_simple_git2 = __toESM(require("simple-git"), 1);
    PreviewDiffTool = class {
      name = "PreviewDiff";
      description = "Preview git diff for current changes. Shows unstaged or staged changes, optionally for a specific file.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          staged: {
            type: "boolean",
            description: "Show staged (--cached) diff instead of unstaged (default: false)"
          },
          file: {
            type: "string",
            description: "Specific file path to diff (default: all files)"
          }
        },
        required: []
      };
      validate(input) {
        if (input.staged !== void 0 && typeof input.staged !== "boolean") {
          return "staged must be a boolean";
        }
        if (input.file !== void 0 && typeof input.file !== "string") {
          return "file must be a string path";
        }
        return null;
      }
      async execute(input, context) {
        const staged = input.staged || false;
        const file = input.file;
        try {
          const gitManager = new GitManager(context.cwd);
          const isRepo = await gitManager.isRepo();
          if (!isRepo) {
            return { content: "Not a git repository.", isError: true };
          }
          const git = (0, import_simple_git2.default)(context.cwd);
          const args = [];
          if (staged)
            args.push("--staged");
          if (file)
            args.push("--", file);
          const diff = await git.diff(args);
          if (!diff.trim()) {
            const target = file ? `for ${file}` : "";
            const type = staged ? "staged" : "unstaged";
            return { content: `No ${type} changes ${target}`.trim() + "." };
          }
          const statArgs = ["--stat", ...args];
          const stat10 = await git.diff(statArgs);
          return {
            content: `## Diff Summary
${stat10}
## Full Diff
${diff}`
          };
        } catch (error) {
          return { content: `Error getting diff: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const lines = result.content.split("\n").length;
        const type = input.staged ? "staged" : "unstaged";
        return `Showing ${type} diff (${lines} lines)`;
      }
    };
  }
});

// src/tools/builtin/run-tests.ts
var fs11, path11, import_node_child_process3, RunTestsTool;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
    RunTestsTool = class {
      name = "RunTests";
      description = "Run project tests. Auto-detects test framework (npm test, pytest, jest) or accepts a custom command.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          testCommand: {
            type: "string",
            description: "Override test command (default: auto-detect from project config)"
          },
          timeout: {
            type: "number",
            description: "Timeout in seconds (default: 120)"
          }
        },
        required: []
      };
      validate(input) {
        if (input.testCommand !== void 0 && typeof input.testCommand !== "string") {
          return "testCommand must be a string";
        }
        if (input.timeout !== void 0 && (typeof input.timeout !== "number" || input.timeout < 1)) {
          return "timeout must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        const timeout = (input.timeout || 120) * 1e3;
        let command = input.testCommand;
        if (!command) {
          const detectionResult = await this.detectTestCommand(context.cwd);
          if (!detectionResult.found) {
            return {
              content: `No test command detected for this project.

${detectionResult.message}`,
              isError: true
            };
          }
          command = detectionResult.command;
        }
        try {
          const output = (0, import_node_child_process3.execSync)(command, {
            cwd: context.cwd,
            timeout,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env, FORCE_COLOR: "0", CI: "1" }
          });
          return {
            content: `Test command: ${command}

\`\`\`
${output}
\`\`\``
          };
        } catch (error) {
          const output = (error.stdout || "") + (error.stderr || "");
          const exitCode = error.status ?? "unknown";
          return {
            content: `Test command: ${command}
Exit code: ${exitCode}

\`\`\`
${output}
\`\`\``,
            isError: exitCode !== 0
          };
        }
      }
      async detectTestCommand(cwd) {
        const projectHints = [];
        let packageJsonContent = null;
        try {
          const pkgContent = await fs11.readFile(path11.join(cwd, "package.json"), "utf-8");
          packageJsonContent = JSON.parse(pkgContent);
          const testScript = packageJsonContent.scripts?.test;
          if (testScript && testScript !== 'echo "Error: no test specified" && exit 1') {
            return { found: true, command: "npm test", packageJsonContent };
          }
          projectHints.push('Found package.json but no "test" script defined');
        } catch {
        }
        const pytestConfigs = ["pytest.ini", "pyproject.toml", "setup.cfg", "conftest.py"];
        for (const config of pytestConfigs) {
          try {
            await fs11.access(path11.join(cwd, config));
            return { found: true, command: "pytest" };
          } catch {
          }
        }
        try {
          const files = await fs11.readdir(cwd);
          if (files.some((f) => f.startsWith("test_") && f.endsWith(".py")) || files.some((f) => f.endsWith("_test.py"))) {
            return { found: true, command: "pytest" };
          }
        } catch {
        }
        const jestConfigs = ["jest.config.js", "jest.config.ts", "jest.config.mjs", "jest.config.json"];
        for (const config of jestConfigs) {
          try {
            await fs11.access(path11.join(cwd, config));
            return { found: true, command: "npx jest" };
          } catch {
          }
        }
        const vitestConfigs = ["vitest.config.js", "vitest.config.ts", "vitest.config.mjs"];
        for (const config of vitestConfigs) {
          try {
            await fs11.access(path11.join(cwd, config));
            return { found: true, command: "npx vitest run" };
          } catch {
          }
        }
        try {
          const makefile = await fs11.readFile(path11.join(cwd, "Makefile"), "utf-8");
          if (makefile.includes("test:")) {
            return { found: true, command: "make test" };
          }
        } catch {
        }
        try {
          const files = await fs11.readdir(cwd);
          if (files.some((f) => f.endsWith("_test.go"))) {
            return { found: true, command: "go test ./..." };
          }
        } catch {
        }
        try {
          await fs11.access(path11.join(cwd, "Cargo.toml"));
          return { found: true, command: "cargo test" };
        } catch {
        }
        let message = "Could not detect a test framework for this project.\n\n";
        if (projectHints.length > 0) {
          message += projectHints.join("\n") + "\n\n";
        }
        message += "To set up tests, you can:\n\n";
        message += "For Node.js projects:\n";
        message += '  - Add a "test" script to package.json:\n';
        message += '    "scripts": { "test": "jest" }\n';
        message += "  - Or install a test runner: npm install --save-dev jest vitest\n\n";
        message += "For Python projects:\n";
        message += "  - Install pytest: pip install pytest\n";
        message += "  - Create test files: test_*.py or *_test.py\n\n";
        message += "For other projects:\n";
        message += "  - Go: Create *_test.go files\n";
        message += "  - Rust: Cargo test is automatic with Cargo.toml\n\n";
        message += "Or provide a custom test command:\n";
        message += '  RunTests with testCommand: "your-custom-command"';
        return { found: false, command: null, message };
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return "Tests failed";
        return "Tests passed";
      }
    };
  }
});

// src/tools/builtin/file-tree.ts
var fs12, path12, DEFAULT_IGNORE, FileTreeTool;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
    init_tool_types();
    DEFAULT_IGNORE = /* @__PURE__ */ new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".cache",
      "__pycache__",
      ".pytest_cache",
      ".mypy_cache",
      "coverage",
      ".DS_Store",
      "Thumbs.db"
    ]);
    FileTreeTool = class {
      name = "FileTree";
      description = "Display hierarchical directory structure as a tree. Useful for understanding project layout.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory to display tree for. Must be within the workspace. Defaults to current working directory (workspace root)."
          },
          maxDepth: {
            type: "number",
            description: "Maximum depth to traverse (default: 3)"
          },
          includeHidden: {
            type: "boolean",
            description: "Include hidden files/directories (default: false)"
          }
        },
        required: []
      };
      validate(input) {
        if (input.maxDepth !== void 0 && (typeof input.maxDepth !== "number" || input.maxDepth < 1)) {
          return "maxDepth must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        const targetPath = input.path || context.cwd;
        const maxDepth = input.maxDepth || 3;
        const includeHidden = input.includeHidden || false;
        try {
          const absPath = path12.isAbsolute(targetPath) ? targetPath : path12.join(context.cwd, targetPath);
          const stat10 = await fs12.stat(absPath);
          if (!stat10.isDirectory()) {
            return { content: `Not a directory: ${absPath}`, isError: true };
          }
          const lines = [path12.basename(absPath) + "/"];
          await this.buildTree(absPath, "", maxDepth, 0, includeHidden, lines);
          return { content: lines.join("\n") };
        } catch (error) {
          return { content: `Error reading directory: ${error.message}`, isError: true };
        }
      }
      async buildTree(dirPath, prefix, maxDepth, currentDepth, includeHidden, lines) {
        if (currentDepth >= maxDepth)
          return;
        let entries = await fs12.readdir(dirPath, { withFileTypes: true });
        entries = entries.filter((entry) => {
          if (!includeHidden && entry.name.startsWith("."))
            return false;
          if (DEFAULT_IGNORE.has(entry.name))
            return false;
          return true;
        });
        entries.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory())
            return -1;
          if (!a.isDirectory() && b.isDirectory())
            return 1;
          return a.name.localeCompare(b.name);
        });
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const isLast = i === entries.length - 1;
          const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
          const childPrefix = isLast ? "    " : "\u2502   ";
          const name = entry.isDirectory() ? entry.name + "/" : entry.name;
          lines.push(prefix + connector + name);
          if (entry.isDirectory()) {
            await this.buildTree(
              path12.join(dirPath, entry.name),
              prefix + childPrefix,
              maxDepth,
              currentDepth + 1,
              includeHidden,
              lines
            );
          }
        }
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return result.content;
        const lines = result.content.split("\n").length;
        return `File tree: ${lines} entries`;
      }
    };
  }
});

// src/tools/builtin/lint-fix.ts
var fs13, path13, import_node_child_process4, LintFixTool;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
    import_node_child_process4 = require("child_process");
    init_tool_types();
    LintFixTool = class {
      name = "LintFix";
      description = "Run ESLint/Prettier auto-fix on files. Detects project lint configuration automatically.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "File or directory to lint/fix"
          },
          fix: {
            type: "boolean",
            description: "Auto-fix issues (default: true)"
          }
        },
        required: ["file_path"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path) {
          return "file_path must be a non-empty string";
        }
        return null;
      }
      async execute(input, context) {
        const filePath = input.file_path;
        const fix = input.fix !== false;
        const absPath = path13.isAbsolute(filePath) ? filePath : path13.join(context.cwd, filePath);
        try {
          const commands = [];
          const hasEslint = await this.configExists(context.cwd, [
            "eslint.config.js",
            "eslint.config.mjs",
            "eslint.config.cjs",
            ".eslintrc.js",
            ".eslintrc.json",
            ".eslintrc.yml",
            ".eslintrc"
          ]);
          const hasPrettier = await this.configExists(context.cwd, [
            ".prettierrc",
            ".prettierrc.json",
            ".prettierrc.js",
            ".prettierrc.yml",
            ".prettierrc.yaml",
            "prettier.config.js"
          ]);
          let pkgHasEslint = false;
          let pkgHasPrettier = false;
          try {
            const pkg = JSON.parse(await fs13.readFile(path13.join(context.cwd, "package.json"), "utf-8"));
            pkgHasEslint = !!pkg.eslintConfig;
            pkgHasPrettier = !!pkg.prettier;
          } catch {
          }
          if (hasEslint || pkgHasEslint) {
            const fixFlag = fix ? " --fix" : "";
            commands.push(`npx eslint${fixFlag} "${absPath}"`);
          }
          if (hasPrettier || pkgHasPrettier) {
            const fixFlag = fix ? " --write" : " --check";
            commands.push(`npx prettier${fixFlag} "${absPath}"`);
          }
          if (commands.length === 0) {
            return {
              content: "No ESLint or Prettier configuration found in this project. Add a config file first.",
              isError: true
            };
          }
          const results = [];
          for (const cmd of commands) {
            try {
              const output = (0, import_node_child_process4.execSync)(cmd, {
                cwd: context.cwd,
                timeout: 3e4,
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "pipe"],
                env: { ...process.env, FORCE_COLOR: "0" }
              });
              results.push(`$ ${cmd}
${output || "(no issues found)"}`);
            } catch (error) {
              const output = (error.stdout || "") + (error.stderr || "");
              results.push(`$ ${cmd}
${output || error.message}`);
            }
          }
          return { content: results.join("\n\n") };
        } catch (error) {
          return { content: `Error running lint: ${error.message}`, isError: true };
        }
      }
      async configExists(cwd, filenames) {
        for (const filename of filenames) {
          try {
            await fs13.access(path13.join(cwd, filename));
            return true;
          } catch {
          }
        }
        return false;
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return result.content;
        return "Lint/format completed";
      }
    };
  }
});

// src/tools/builtin/search-web.ts
var SearchWebTool;
var init_search_web = __esm({
  "src/tools/builtin/search-web.ts"() {
    "use strict";
    init_tool_types();
    SearchWebTool = class {
      name = "SearchWeb";
      description = "Search the web using DuckDuckGo. Returns results with titles, URLs, and snippets.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query"
          },
          maxResults: {
            type: "number",
            description: "Maximum number of results to return (default: 5)"
          }
        },
        required: ["query"]
      };
      validate(input) {
        if (typeof input.query !== "string" || !input.query.trim()) {
          return "query must be a non-empty string";
        }
        if (input.maxResults !== void 0 && (typeof input.maxResults !== "number" || input.maxResults < 1)) {
          return "maxResults must be a positive number";
        }
        return null;
      }
      async execute(input, _context) {
        const query = input.query;
        const maxResults = input.maxResults || 5;
        try {
          const searchApi = await import("duckduckgo-search");
          const results = [];
          for await (const result of searchApi.text(query)) {
            results.push({
              title: result.title,
              href: result.href,
              body: result.body
            });
            if (results.length >= maxResults)
              break;
          }
          if (!results || results.length === 0) {
            return { content: `No results found for: "${query}"` };
          }
          const formatted = results.map((r, i) => {
            return `${i + 1}. **${r.title}**
   ${r.href}
   ${r.body || ""}`;
          }).join("\n\n");
          return {
            content: `Search results for "${query}":

${formatted}`
          };
        } catch (error) {
          return {
            content: `Error searching web: ${error.message}`,
            isError: true
          };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        return `Web search: "${input.query}"`;
      }
    };
  }
});

// src/tools/builtin/web-fetch.ts
var WebFetchTool;
var init_web_fetch = __esm({
  "src/tools/builtin/web-fetch.ts"() {
    "use strict";
    init_tool_types();
    WebFetchTool = class {
      name = "WebFetch";
      description = "Fetch a URL and return its content as readable text. Handles HTML (strips tags), JSON (pretty-prints), and plain text.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to fetch (must start with http:// or https://)"
          },
          maxLength: {
            type: "number",
            description: "Maximum content length in characters (default: 50000)"
          }
        },
        required: ["url"]
      };
      validate(input) {
        if (typeof input.url !== "string" || !input.url) {
          return "url must be a non-empty string";
        }
        if (!input.url.startsWith("http://") && !input.url.startsWith("https://")) {
          return "url must start with http:// or https://";
        }
        if (input.maxLength !== void 0 && (typeof input.maxLength !== "number" || input.maxLength < 1)) {
          return "maxLength must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        const url = input.url;
        const maxLength = input.maxLength || 5e4;
        try {
          const timeoutSignal = AbortSignal.timeout(3e4);
          const combinedSignal = AbortSignal.any([timeoutSignal, context.abortSignal]);
          const response = await fetch(url, {
            signal: combinedSignal,
            headers: {
              "User-Agent": "omni-code/0.1.0",
              "Accept": "text/html,application/json,text/plain,*/*"
            },
            redirect: "follow"
          });
          if (!response.ok) {
            return {
              content: `HTTP ${response.status} ${response.statusText} for ${url}`,
              isError: true
            };
          }
          const contentType = response.headers.get("content-type") || "";
          const rawBody = await response.text();
          let content;
          if (contentType.includes("application/json")) {
            try {
              content = JSON.stringify(JSON.parse(rawBody), null, 2);
            } catch {
              content = rawBody;
            }
          } else if (contentType.includes("text/html")) {
            content = this.stripHtml(rawBody);
          } else {
            content = rawBody;
          }
          if (content.length > maxLength) {
            content = content.substring(0, maxLength) + `

[Truncated at ${maxLength} characters]`;
          }
          return {
            content: `Fetched ${url} (${contentType}):

${content}`,
            metadata: { statusCode: response.status, contentType, length: content.length }
          };
        } catch (error) {
          const err = error;
          if (err.name === "AbortError" || err.name === "TimeoutError") {
            return { content: `Request timed out or was cancelled for ${url}`, isError: true };
          }
          return { content: `Error fetching ${url}: ${err.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const len = result.metadata?.length || 0;
        return `Fetched ${input.url} (${len} chars)`;
      }
      stripHtml(html) {
        let text = html;
        text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
        text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
        text = text.replace(/<!--[\s\S]*?-->/g, "");
        text = text.replace(/<\/?(?:div|p|br|hr|h[1-6]|li|tr|blockquote|pre|section|article|header|footer|nav|main|aside)\b[^>]*\/?>/gi, "\n");
        text = text.replace(/<[^>]+>/g, "");
        text = text.replace(/&amp;/g, "&");
        text = text.replace(/&lt;/g, "<");
        text = text.replace(/&gt;/g, ">");
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        text = text.replace(/&nbsp;/g, " ");
        text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
        text = text.replace(/[ \t]+/g, " ");
        text = text.replace(/\n\s*\n/g, "\n\n");
        return text.trim();
      }
    };
  }
});

// src/tools/builtin/type-check.ts
var fs14, path14, import_node_child_process5, TypeCheckTool;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
    import_node_child_process5 = require("child_process");
    init_tool_types();
    TypeCheckTool = class {
      name = "TypeCheck";
      description = "Run type checker (tsc, mypy, cargo check) and return diagnostics. Auto-detects the project type.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Override type check command (default: auto-detect)"
          },
          file: {
            type: "string",
            description: "Specific file to check (optional)"
          }
        },
        required: []
      };
      validate(input) {
        if (input.command !== void 0 && typeof input.command !== "string") {
          return "command must be a string";
        }
        if (input.file !== void 0 && typeof input.file !== "string") {
          return "file must be a string";
        }
        return null;
      }
      async execute(input, context) {
        let command = input.command;
        const file = input.file;
        if (!command) {
          try {
            command = await this.detectCommand(context.cwd, file);
          } catch (error) {
            return { content: error.message, isError: true };
          }
        }
        try {
          const output = (0, import_node_child_process5.execSync)(command, {
            cwd: context.cwd,
            timeout: 6e4,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env, FORCE_COLOR: "0" }
          });
          return {
            content: `Type check passed.

Command: ${command}

${output || "(no output)"}`,
            metadata: { exitCode: 0 }
          };
        } catch (error) {
          const output = (error.stdout || "") + (error.stderr || "");
          const exitCode = error.status ?? "unknown";
          return {
            content: `Type check failed (exit code ${exitCode}).

Command: ${command}

\`\`\`
${output}
\`\`\``,
            isError: true,
            metadata: { exitCode }
          };
        }
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return "Type check: errors found";
        return "Type check: passed";
      }
      async detectCommand(cwd, file) {
        try {
          await fs14.access(path14.join(cwd, "tsconfig.json"));
          return file ? `npx tsc --noEmit ${file}` : "npx tsc --noEmit";
        } catch {
        }
        for (const cfg of ["mypy.ini", "pyproject.toml", "setup.py", "setup.cfg"]) {
          try {
            await fs14.access(path14.join(cwd, cfg));
            return file ? `mypy ${file}` : "mypy .";
          } catch {
          }
        }
        try {
          await fs14.access(path14.join(cwd, "Cargo.toml"));
          return "cargo check";
        } catch {
        }
        throw new Error("No type checker detected. Provide a command manually or ensure tsconfig.json, pyproject.toml, or Cargo.toml exists.");
      }
    };
  }
});

// src/tools/builtin/http-client.ts
var ALLOWED_METHODS, HTTPClientTool;
var init_http_client = __esm({
  "src/tools/builtin/http-client.ts"() {
    "use strict";
    init_tool_types();
    ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
    HTTPClientTool = class {
      name = "HTTPClient";
      description = "Make HTTP requests (GET, POST, PUT, DELETE, PATCH). Useful for testing APIs and debugging endpoints.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The request URL"
          },
          method: {
            type: "string",
            description: "HTTP method: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS (default: GET)"
          },
          headers: {
            type: "object",
            description: "Request headers as key-value pairs"
          },
          body: {
            type: "string",
            description: "Request body (string or JSON string)"
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds (default: 30000)"
          }
        },
        required: ["url"]
      };
      validate(input) {
        if (typeof input.url !== "string" || !input.url) {
          return "url must be a non-empty string";
        }
        if (!input.url.startsWith("http://") && !input.url.startsWith("https://")) {
          return "url must start with http:// or https://";
        }
        if (input.method !== void 0) {
          const method = input.method.toUpperCase();
          if (!ALLOWED_METHODS.includes(method)) {
            return `method must be one of: ${ALLOWED_METHODS.join(", ")}`;
          }
        }
        if (input.timeout !== void 0 && (typeof input.timeout !== "number" || input.timeout < 1)) {
          return "timeout must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        const url = input.url;
        const method = (input.method || "GET").toUpperCase();
        const headers = input.headers || {};
        const body = input.body;
        const timeout = input.timeout || 3e4;
        if (context.planMode && method !== "GET") {
          return {
            content: `Cannot make ${method} requests in plan mode. Only GET is allowed.`,
            isError: true
          };
        }
        try {
          const timeoutSignal = AbortSignal.timeout(timeout);
          const combinedSignal = AbortSignal.any([timeoutSignal, context.abortSignal]);
          const fetchOptions = {
            method,
            headers: {
              "User-Agent": "omni-code/0.1.0",
              ...headers
            },
            signal: combinedSignal,
            redirect: "follow"
          };
          if (body && method !== "GET" && method !== "HEAD") {
            fetchOptions.body = body;
            if (!headers["content-type"] && !headers["Content-Type"]) {
              try {
                JSON.parse(body);
                fetchOptions.headers["Content-Type"] = "application/json";
              } catch {
              }
            }
          }
          const response = await fetch(url, fetchOptions);
          const statusLine = `HTTP ${response.status} ${response.statusText}`;
          const responseHeaders = [];
          response.headers.forEach((value, key) => {
            responseHeaders.push(`  ${key}: ${value}`);
          });
          let responseBody = await response.text();
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              responseBody = JSON.stringify(JSON.parse(responseBody), null, 2);
            } catch {
            }
          }
          if (responseBody.length > 1e5) {
            responseBody = responseBody.substring(0, 1e5) + "\n\n[Truncated at 100000 characters]";
          }
          const output = [
            `${method} ${url}`,
            "",
            `Response: ${statusLine}`,
            "",
            "Headers:",
            ...responseHeaders,
            "",
            "Body:",
            responseBody || "(empty)"
          ].join("\n");
          return {
            content: output,
            isError: response.status >= 400,
            metadata: { statusCode: response.status, contentType }
          };
        } catch (error) {
          const err = error;
          if (err.name === "AbortError" || err.name === "TimeoutError") {
            return { content: `Request timed out after ${timeout}ms: ${method} ${url}`, isError: true };
          }
          return { content: `Request failed: ${err.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        const method = (input.method || "GET").toUpperCase();
        const status = result.metadata?.statusCode;
        return `HTTP ${method} ${input.url} -> ${status || "error"}`;
      }
    };
  }
});

// src/tools/builtin/symbol-rename.ts
var fs15, path15, import_fast_glob2, SymbolRenameTool;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
    SymbolRenameTool = class {
      name = "SymbolRename";
      description = "Rename a symbol across all matching files using word-boundary matching. Defaults to dry-run mode for previewing changes.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          oldName: {
            type: "string",
            description: "The symbol name to rename"
          },
          newName: {
            type: "string",
            description: "The new name for the symbol"
          },
          path: {
            type: "string",
            description: "Directory scope for the rename (default: cwd)"
          },
          glob: {
            type: "string",
            description: "File filter glob pattern (default: **/*.{ts,tsx,js,jsx,py,rs,go})"
          },
          dryRun: {
            type: "boolean",
            description: "Preview changes without applying (default: true)"
          }
        },
        required: ["oldName", "newName"]
      };
      validate(input) {
        if (typeof input.oldName !== "string" || !input.oldName.trim()) {
          return "oldName must be a non-empty string";
        }
        if (typeof input.newName !== "string" || !input.newName.trim()) {
          return "newName must be a non-empty string";
        }
        if (input.oldName === input.newName) {
          return "oldName and newName must be different";
        }
        return null;
      }
      async execute(input, context) {
        const oldName = input.oldName;
        const newName = input.newName;
        const searchPath = input.path || context.cwd;
        const globPattern = input.glob || "**/*.{ts,tsx,js,jsx,py,rs,go}";
        const dryRun = input.dryRun !== false;
        const absPath = path15.isAbsolute(searchPath) ? searchPath : path15.join(context.cwd, searchPath);
        const regex = new RegExp("\\b" + this.escapeRegex(oldName) + "\\b", "g");
        try {
          const files = await (0, import_fast_glob2.default)(globPattern, {
            cwd: absPath,
            absolute: true,
            ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"]
          });
          const changes = [];
          let totalReplacements = 0;
          const filesChanged = /* @__PURE__ */ new Set();
          for (const filePath of files) {
            const content = await fs15.readFile(filePath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const matches = line.match(regex);
              if (matches) {
                const replaced = line.replace(regex, newName);
                changes.push({
                  file: path15.relative(absPath, filePath),
                  line: i + 1,
                  before: line.trim(),
                  after: replaced.trim()
                });
                totalReplacements += matches.length;
                filesChanged.add(filePath);
              }
            }
          }
          if (changes.length === 0) {
            return { content: `No occurrences of "${oldName}" found in ${files.length} files.` };
          }
          if (!dryRun) {
            for (const filePath of filesChanged) {
              const content = await fs15.readFile(filePath, "utf-8");
              const updated = content.replace(regex, newName);
              await fs15.writeFile(filePath, updated, "utf-8");
            }
          }
          const prefix = dryRun ? "[DRY RUN] " : "";
          const verb = dryRun ? "Would rename" : "Renamed";
          const header = `${prefix}${verb} "${oldName}" to "${newName}": ${totalReplacements} occurrence(s) in ${filesChanged.size} file(s)
`;
          const preview = changes.slice(0, 50).map(
            (c) => `  ${c.file}:${c.line}
    - ${c.before}
    + ${c.after}`
          ).join("\n\n");
          const truncation = changes.length > 50 ? `

... and ${changes.length - 50} more changes` : "";
          return {
            content: header + "\n" + preview + truncation,
            metadata: { filesChanged: filesChanged.size, replacements: totalReplacements, dryRun }
          };
        } catch (error) {
          return { content: `Error during rename: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const dryRun = result.metadata?.dryRun;
        const count = result.metadata?.replacements || 0;
        const files = result.metadata?.filesChanged || 0;
        const prefix = dryRun ? "[DRY RUN] " : "";
        return `${prefix}Renamed "${input.oldName}" -> "${input.newName}" (${count} in ${files} files)`;
      }
      escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    };
  }
});

// src/tools/builtin/multi-file-edit.ts
var fs16, path16, MultiFileEditTool;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    init_tool_types();
    MultiFileEditTool = class {
      name = "MultiFileEdit";
      description = "Apply multiple edits across files atomically. All edits are validated first, then applied. Rolls back on failure.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          edits: {
            type: "array",
            description: "Array of edits to apply",
            items: {
              type: "object",
              properties: {
                file_path: { type: "string", description: "Absolute path to the file" },
                old_string: { type: "string", description: "Text to replace (must be unique in the file)" },
                new_string: { type: "string", description: "Replacement text" }
              },
              required: ["file_path", "old_string", "new_string"]
            }
          }
        },
        required: ["edits"]
      };
      validate(input) {
        if (!Array.isArray(input.edits) || input.edits.length === 0) {
          return "edits must be a non-empty array";
        }
        for (let i = 0; i < input.edits.length; i++) {
          const edit = input.edits[i];
          if (typeof edit.file_path !== "string" || !edit.file_path) {
            return `edits[${i}].file_path must be a non-empty string`;
          }
          if (!path16.isAbsolute(edit.file_path)) {
            return `edits[${i}].file_path must be an absolute path`;
          }
          if (typeof edit.old_string !== "string") {
            return `edits[${i}].old_string must be a string`;
          }
          if (typeof edit.new_string !== "string") {
            return `edits[${i}].new_string must be a string`;
          }
          if (edit.old_string === edit.new_string) {
            return `edits[${i}]: old_string and new_string must be different`;
          }
        }
        return null;
      }
      async execute(input, _context) {
        const edits = input.edits;
        const fileContents = /* @__PURE__ */ new Map();
        const validationErrors = [];
        for (let i = 0; i < edits.length; i++) {
          const edit = edits[i];
          try {
            if (!fileContents.has(edit.file_path)) {
              const content2 = await fs16.readFile(edit.file_path, "utf-8");
              fileContents.set(edit.file_path, content2);
            }
            const content = fileContents.get(edit.file_path);
            if (!content.includes(edit.old_string)) {
              validationErrors.push(`edits[${i}]: old_string not found in ${edit.file_path}`);
              continue;
            }
            const firstIdx = content.indexOf(edit.old_string);
            const lastIdx = content.lastIndexOf(edit.old_string);
            if (firstIdx !== lastIdx) {
              const count = content.split(edit.old_string).length - 1;
              validationErrors.push(`edits[${i}]: old_string appears ${count} times in ${edit.file_path} (must be unique)`);
            }
          } catch (error) {
            validationErrors.push(`edits[${i}]: cannot read ${edit.file_path}: ${error.message}`);
          }
        }
        if (validationErrors.length > 0) {
          return {
            content: `Validation failed. No files were modified.

${validationErrors.join("\n")}`,
            isError: true
          };
        }
        const backups = /* @__PURE__ */ new Map();
        for (const [filePath, content] of fileContents) {
          backups.set(filePath, content);
        }
        const appliedFiles = /* @__PURE__ */ new Set();
        try {
          const finalContents = new Map(fileContents);
          for (const edit of edits) {
            const current = finalContents.get(edit.file_path);
            const updated = current.replace(edit.old_string, edit.new_string);
            finalContents.set(edit.file_path, updated);
          }
          for (const [filePath, content] of finalContents) {
            await fs16.writeFile(filePath, content, "utf-8");
            appliedFiles.add(filePath);
          }
          return {
            content: `Successfully applied ${edits.length} edit(s) across ${appliedFiles.size} file(s).`,
            metadata: { editsApplied: edits.length, filesChanged: appliedFiles.size }
          };
        } catch (error) {
          const rollbackErrors = [];
          for (const filePath of appliedFiles) {
            const original = backups.get(filePath);
            if (original !== void 0) {
              try {
                await fs16.writeFile(filePath, original, "utf-8");
              } catch (rollbackErr) {
                rollbackErrors.push(`Failed to rollback ${filePath}: ${rollbackErr.message}`);
              }
            }
          }
          let message = `Error applying edits: ${error.message}. Rolled back ${appliedFiles.size} file(s).`;
          if (rollbackErrors.length > 0) {
            message += `

Rollback errors:
${rollbackErrors.join("\n")}`;
          }
          return { content: message, isError: true };
        }
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return "Multi-file edit: failed (rolled back)";
        const edits = result.metadata?.editsApplied || 0;
        const files = result.metadata?.filesChanged || 0;
        return `Multi-file edit: ${edits} edits in ${files} files`;
      }
    };
  }
});

// src/tools/builtin/dependency-manager.ts
var fs17, path17, import_node_child_process6, VALID_ACTIONS, DependencyManagerTool;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
    VALID_ACTIONS = ["add", "remove", "update", "list"];
    DependencyManagerTool = class {
      name = "DependencyManager";
      description = "Add, remove, update, or list project dependencies. Auto-detects package manager (npm, yarn, pnpm, pip, cargo).";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action: add, remove, update, or list"
          },
          packages: {
            type: "array",
            items: { type: "string" },
            description: "Package names (required for add/remove/update)"
          },
          dev: {
            type: "boolean",
            description: "Install as dev dependency (default: false)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS.join(", ")}`;
        }
        if (action !== "list") {
          if (!Array.isArray(input.packages) || input.packages.length === 0) {
            return `packages must be a non-empty array for "${action}" action`;
          }
          for (const pkg of input.packages) {
            if (typeof pkg !== "string" || !pkg.trim()) {
              return "each package must be a non-empty string";
            }
          }
        }
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        const packages = input.packages || [];
        const dev = input.dev || false;
        let manager;
        try {
          manager = await this.detectManager(context.cwd);
        } catch (error) {
          return { content: error.message, isError: true };
        }
        const command = this.buildCommand(manager, action, packages, dev);
        try {
          const output = (0, import_node_child_process6.execSync)(command, {
            cwd: context.cwd,
            timeout: 12e4,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env, FORCE_COLOR: "0" }
          });
          return {
            content: `${manager} ${action}: ${packages.length > 0 ? packages.join(", ") : "all"}

Command: ${command}

${output || "(no output)"}`,
            metadata: { manager, action }
          };
        } catch (error) {
          const output = (error.stdout || "") + (error.stderr || "");
          return {
            content: `Command failed: ${command}

${output}`,
            isError: true,
            metadata: { exitCode: error.status }
          };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return `Dependency ${input.action}: failed`;
        return `Dependency ${input.action}: success`;
      }
      async detectManager(cwd) {
        const exists = async (file) => {
          try {
            await fs17.access(path17.join(cwd, file));
            return true;
          } catch {
            return false;
          }
        };
        if (await exists("pnpm-lock.yaml"))
          return "pnpm";
        if (await exists("yarn.lock"))
          return "yarn";
        if (await exists("bun.lockb"))
          return "bun";
        if (await exists("package.json"))
          return "npm";
        if (await exists("requirements.txt") || await exists("pyproject.toml"))
          return "pip";
        if (await exists("Cargo.toml"))
          return "cargo";
        throw new Error("No package manager detected. Ensure package.json, requirements.txt, pyproject.toml, or Cargo.toml exists.");
      }
      buildCommand(manager, action, packages, dev) {
        const pkgList = packages.join(" ");
        switch (manager) {
          case "npm":
            switch (action) {
              case "add":
                return `npm install ${dev ? "--save-dev " : ""}${pkgList}`;
              case "remove":
                return `npm uninstall ${pkgList}`;
              case "update":
                return `npm update ${pkgList}`;
              case "list":
                return "npm list --depth=0";
            }
            break;
          case "pnpm":
            switch (action) {
              case "add":
                return `pnpm add ${dev ? "-D " : ""}${pkgList}`;
              case "remove":
                return `pnpm remove ${pkgList}`;
              case "update":
                return `pnpm update ${pkgList}`;
              case "list":
                return "pnpm list --depth=0";
            }
            break;
          case "yarn":
            switch (action) {
              case "add":
                return `yarn add ${dev ? "--dev " : ""}${pkgList}`;
              case "remove":
                return `yarn remove ${pkgList}`;
              case "update":
                return `yarn upgrade ${pkgList}`;
              case "list":
                return "yarn list --depth=0";
            }
            break;
          case "bun":
            switch (action) {
              case "add":
                return `bun add ${dev ? "-d " : ""}${pkgList}`;
              case "remove":
                return `bun remove ${pkgList}`;
              case "update":
                return `bun update ${pkgList}`;
              case "list":
                return "bun pm ls";
            }
            break;
          case "pip":
            switch (action) {
              case "add":
                return `pip install ${pkgList}`;
              case "remove":
                return `pip uninstall -y ${pkgList}`;
              case "update":
                return `pip install --upgrade ${pkgList}`;
              case "list":
                return "pip list";
            }
            break;
          case "cargo":
            switch (action) {
              case "add":
                return `cargo add ${dev ? "--dev " : ""}${pkgList}`;
              case "remove":
                return `cargo remove ${pkgList}`;
              case "update":
                return "cargo update";
              case "list":
                return "cargo tree --depth 1";
            }
            break;
        }
        return `${manager} ${action} ${pkgList}`;
      }
    };
  }
});

// src/tools/builtin/scaffold.ts
var fs18, path18, TEMPLATES, ScaffoldTool;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
    init_tool_types();
    TEMPLATES = ["react-component", "api-route", "test-file", "typescript-class", "express-middleware"];
    ScaffoldTool = class {
      name = "Scaffold";
      description = "Generate boilerplate code from templates: react-component, api-route, test-file, typescript-class, express-middleware.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          template: {
            type: "string",
            description: "Template: react-component, api-route, test-file, typescript-class, express-middleware"
          },
          name: {
            type: "string",
            description: "Name for the generated code (e.g., component name, class name)"
          },
          path: {
            type: "string",
            description: "Output directory (default: cwd)"
          },
          options: {
            type: "object",
            description: "Template-specific options"
          }
        },
        required: ["template", "name"]
      };
      validate(input) {
        const template = input.template;
        if (!TEMPLATES.includes(template)) {
          return `template must be one of: ${TEMPLATES.join(", ")}`;
        }
        if (typeof input.name !== "string" || !input.name.trim()) {
          return "name must be a non-empty string";
        }
        return null;
      }
      async execute(input, context) {
        const template = input.template;
        const name = input.name;
        const outputDir = input.path || context.cwd;
        const options = input.options || {};
        const absDir = path18.isAbsolute(outputDir) ? outputDir : path18.join(context.cwd, outputDir);
        const result = this.generateTemplate(template, name, options);
        try {
          await fs18.mkdir(absDir, { recursive: true });
          const filePath = path18.join(absDir, result.filename);
          try {
            await fs18.access(filePath);
            return { content: `File already exists: ${filePath}`, isError: true };
          } catch {
          }
          await fs18.writeFile(filePath, result.content, "utf-8");
          return {
            content: `Created ${filePath}

\`\`\`
${result.content}
\`\`\``,
            metadata: { filePath, template }
          };
        } catch (error) {
          return { content: `Error creating file: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        return `Scaffolded ${input.template}: ${result.metadata?.filePath}`;
      }
      generateTemplate(template, name, options) {
        const pascal = this.toPascalCase(name);
        const kebab = this.toKebabCase(name);
        const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
        switch (template) {
          case "react-component":
            return {
              filename: `${pascal}.tsx`,
              content: `import React from 'react';

interface ${pascal}Props {
  className?: string;
}

export const ${pascal}: React.FC<${pascal}Props> = ({ className }) => {
  return (
    <div className={className}>
      <h2>${pascal}</h2>
    </div>
  );
};
`
            };
          case "api-route":
            return {
              filename: `${kebab}.ts`,
              content: `import type { Request, Response, Router } from 'express';

export function register${pascal}Routes(router: Router): void {
  router.get('/${kebab}', async (_req: Request, res: Response) => {
    try {
      res.json({ message: '${pascal} list' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/${kebab}/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({ id, message: '${pascal} detail' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/${kebab}', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      res.status(201).json({ message: '${pascal} created', data });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
`
            };
          case "test-file": {
            const framework = options.framework || "vitest";
            const importLine = framework === "jest" ? "" : `import { describe, it, expect } from '${framework}';
`;
            return {
              filename: `${kebab}.test.ts`,
              content: `${importLine}
describe('${pascal}', () => {
  it('should exist', () => {
    expect(true).toBe(true);
  });

  it('should handle basic case', () => {
    // TODO: implement test
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // TODO: implement test
    expect(true).toBe(true);
  });
});
`
            };
          }
          case "typescript-class":
            return {
              filename: `${kebab}.ts`,
              content: `export interface ${pascal}Options {
  // Add options here
}

export class ${pascal} {
  private options: ${pascal}Options;

  constructor(options: ${pascal}Options = {}) {
    this.options = options;
  }

  // Add methods here
}
`
            };
          case "express-middleware":
            return {
              filename: `${kebab}.ts`,
              content: `import type { Request, Response, NextFunction } from 'express';

export function ${camel}Middleware(req: Request, _res: Response, next: NextFunction): void {
  // TODO: implement middleware logic
  next();
}

export function ${camel}ErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('${pascal} error:', err.message);
  res.status(500).json({ error: err.message });
}
`
            };
        }
      }
      toPascalCase(str) {
        return str.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase());
      }
      toKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
      }
    };
  }
});

// src/tools/builtin/database-query.ts
var fs19, path19, import_better_sqlite32, WRITE_KEYWORDS, DatabaseQueryTool;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
    import_better_sqlite32 = __toESM(require("better-sqlite3"), 1);
    init_tool_types();
    WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE)\b/i;
    DatabaseQueryTool = class {
      name = "DatabaseQuery";
      description = "Run SQL queries against a local SQLite database. Read-only by default.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "SQL query to execute"
          },
          database: {
            type: "string",
            description: "Path to SQLite database file (auto-detects if omitted)"
          },
          readonly: {
            type: "boolean",
            description: "Enforce read-only mode (default: true)"
          }
        },
        required: ["query"]
      };
      validate(input) {
        if (typeof input.query !== "string" || !input.query.trim()) {
          return "query must be a non-empty string";
        }
        return null;
      }
      async execute(input, context) {
        const query = input.query.trim();
        const dbPath = input.database;
        const readonly = input.readonly !== false;
        if (context.planMode && !readonly) {
          return { content: "Cannot run write queries in plan mode.", isError: true };
        }
        if (readonly && WRITE_KEYWORDS.test(query)) {
          return {
            content: "Write operation detected but readonly mode is enabled. Set readonly: false to allow writes.",
            isError: true
          };
        }
        let resolvedDbPath;
        if (dbPath) {
          resolvedDbPath = path19.isAbsolute(dbPath) ? dbPath : path19.join(context.cwd, dbPath);
        } else {
          try {
            resolvedDbPath = await this.detectDatabase(context.cwd);
          } catch (error) {
            return { content: error.message, isError: true };
          }
        }
        let db;
        try {
          db = new import_better_sqlite32.default(resolvedDbPath, { readonly });
          const isSelect = /^\s*SELECT\b/i.test(query) || /^\s*PRAGMA\b/i.test(query) || /^\s*EXPLAIN\b/i.test(query);
          if (isSelect) {
            const rows = db.prepare(query).all();
            if (rows.length === 0) {
              return { content: `Query returned 0 rows.

Database: ${resolvedDbPath}` };
            }
            const limited = rows.slice(0, 1e3);
            const table = this.formatAsTable(limited);
            const truncation = rows.length > 1e3 ? `

... showing first 1000 of ${rows.length} rows` : "";
            return {
              content: `Database: ${resolvedDbPath}
Rows: ${rows.length}

${table}${truncation}`,
              metadata: { rowCount: rows.length, database: resolvedDbPath }
            };
          } else {
            const result = db.prepare(query).run();
            return {
              content: `Database: ${resolvedDbPath}
Changes: ${result.changes} row(s) affected`,
              metadata: { changes: result.changes, database: resolvedDbPath }
            };
          }
        } catch (error) {
          return { content: `SQL error: ${error.message}`, isError: true };
        } finally {
          db?.close();
        }
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return result.content;
        const rows = result.metadata?.rowCount;
        const changes = result.metadata?.changes;
        if (rows !== void 0)
          return `Query: ${rows} rows returned`;
        if (changes !== void 0)
          return `Query: ${changes} rows affected`;
        return "Query executed";
      }
      async detectDatabase(cwd) {
        const entries = await fs19.readdir(cwd);
        const dbFiles = entries.filter(
          (f) => f.endsWith(".db") || f.endsWith(".sqlite") || f.endsWith(".sqlite3")
        );
        if (dbFiles.length === 0) {
          throw new Error("No SQLite database found in current directory. Specify a database path.");
        }
        if (dbFiles.length === 1) {
          return path19.join(cwd, dbFiles[0]);
        }
        throw new Error(
          `Multiple databases found. Specify one:
${dbFiles.map((f) => `  - ${f}`).join("\n")}`
        );
      }
      formatAsTable(rows) {
        if (rows.length === 0)
          return "(empty)";
        const columns = Object.keys(rows[0]);
        const maxWidth = 100;
        const widths = columns.map((col) => {
          const headerLen = col.length;
          const maxDataLen = Math.max(...rows.map((r) => {
            const val = String(r[col] ?? "NULL");
            return Math.min(val.length, maxWidth);
          }));
          return Math.max(headerLen, maxDataLen);
        });
        const header = columns.map((col, i) => col.padEnd(widths[i])).join(" | ");
        const separator = widths.map((w) => "-".repeat(w)).join("-+-");
        const dataRows = rows.map(
          (row) => columns.map((col, i) => {
            let val = String(row[col] ?? "NULL");
            if (val.length > maxWidth)
              val = val.substring(0, maxWidth - 3) + "...";
            return val.padEnd(widths[i]);
          }).join(" | ")
        );
        return [header, separator, ...dataRows].join("\n");
      }
    };
  }
});

// src/tools/builtin/sub-agent.ts
var import_p_queue, SubAgentTool;
var init_sub_agent = __esm({
  "src/tools/builtin/sub-agent.ts"() {
    "use strict";
    import_p_queue = __toESM(require("p-queue"), 1);
    init_tool_types();
    SubAgentTool = class {
      name = "SubAgent";
      description = "Spawn parallel sub-agents for concurrent research tasks. Each sub-agent runs independently and results are collected.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "agent" /* AGENT */;
      inputSchema = {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Array of tasks for sub-agents to execute in parallel",
            items: {
              type: "object",
              properties: {
                description: { type: "string", description: "Task description for the sub-agent" },
                planMode: { type: "boolean", description: "Run sub-agent in plan/read-only mode (default: true)" }
              },
              required: ["description"]
            }
          },
          maxConcurrent: {
            type: "number",
            description: "Maximum concurrent sub-agents (default: 3)"
          }
        },
        required: ["tasks"]
      };
      validate(input) {
        if (!Array.isArray(input.tasks) || input.tasks.length === 0) {
          return "tasks must be a non-empty array";
        }
        for (let i = 0; i < input.tasks.length; i++) {
          const task = input.tasks[i];
          if (typeof task.description !== "string" || !task.description.trim()) {
            return `tasks[${i}].description must be a non-empty string`;
          }
        }
        if (input.maxConcurrent !== void 0 && (typeof input.maxConcurrent !== "number" || input.maxConcurrent < 1)) {
          return "maxConcurrent must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        if (!context.spawnSubAgent) {
          return {
            content: "Sub-agent spawning is not available in this context.",
            isError: true
          };
        }
        const tasks = input.tasks;
        const maxConcurrent = input.maxConcurrent || 3;
        const queue = new import_p_queue.default({ concurrency: maxConcurrent });
        const results = [];
        const promises = tasks.map(
          (task, index) => queue.add(async () => {
            try {
              const result = await context.spawnSubAgent(
                task.description,
                task.planMode ?? true
              );
              results.push({ index, description: task.description, result });
            } catch (error) {
              results.push({
                index,
                description: task.description,
                result: "",
                error: error.message
              });
            }
          })
        );
        await Promise.all(promises);
        results.sort((a, b) => a.index - b.index);
        const succeeded = results.filter((r) => !r.error);
        const failed = results.filter((r) => r.error);
        let output = `Sub-agent results (${succeeded.length}/${tasks.length} succeeded):
`;
        for (const r of results) {
          output += `
--- Task ${r.index + 1}: ${r.description} ---
`;
          if (r.error) {
            output += `ERROR: ${r.error}
`;
          } else {
            output += `${r.result}
`;
          }
        }
        return {
          content: output,
          isError: failed.length === tasks.length,
          metadata: { total: tasks.length, succeeded: succeeded.length, failed: failed.length }
        };
      }
      formatForDisplay(result, _input) {
        const s = result.metadata?.succeeded || 0;
        const t = result.metadata?.total || 0;
        return `Sub-agents: ${s}/${t} completed`;
      }
    };
  }
});

// src/tools/builtin/checkpoint.ts
var import_simple_git3, CHECKPOINT_PREFIX, VALID_ACTIONS2, CheckpointTool;
var init_checkpoint = __esm({
  "src/tools/builtin/checkpoint.ts"() {
    "use strict";
    import_simple_git3 = __toESM(require("simple-git"), 1);
    init_tool_types();
    CHECKPOINT_PREFIX = "omni-checkpoint:";
    VALID_ACTIONS2 = ["create", "list", "restore", "delete", "diff"];
    CheckpointTool = class {
      name = "Checkpoint";
      description = "Create, list, restore, or delete named git checkpoints. Useful for safe experimentation with rollback capability.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action: create, list, restore, delete, or diff"
          },
          name: {
            type: "string",
            description: "Checkpoint name (required for create/restore/delete/diff)"
          },
          description: {
            type: "string",
            description: "Description of what this checkpoint captures (optional, for create)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS2.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS2.join(", ")}`;
        }
        if (action !== "list" && (typeof input.name !== "string" || !input.name.trim())) {
          return `name is required for "${action}" action`;
        }
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        const name = input.name?.trim();
        const git = (0, import_simple_git3.default)(context.cwd);
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
          return { content: "Not a git repository. Checkpoints require git.", isError: true };
        }
        try {
          const description = input.description || "";
          switch (action) {
            case "create":
              return await this.createCheckpoint(git, name, description);
            case "list":
              return await this.listCheckpoints(git);
            case "restore":
              return await this.restoreCheckpoint(git, name);
            case "delete":
              return await this.deleteCheckpoint(git, name);
            case "diff":
              return await this.diffCheckpoint(git, name);
          }
        } catch (error) {
          return { content: `Checkpoint error: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        return `Checkpoint: ${input.action} "${input.name || ""}"`;
      }
      async createCheckpoint(git, name, description = "") {
        const desc = description ? `:${description}` : "";
        const stashMessage = `${CHECKPOINT_PREFIX}${name}${desc}`;
        await git.add("-A");
        const stashResult = await git.stash(["push", "--include-untracked", "-m", stashMessage]);
        if (stashResult.includes("No local changes")) {
          return { content: `No changes to checkpoint. Working directory is clean.` };
        }
        await git.stash(["apply"]);
        return {
          content: `Checkpoint "${name}" created. Working directory preserved.
Use "restore" to revert to this state, or "list" to see all checkpoints.`
        };
      }
      async listCheckpoints(git) {
        const stashList = await git.stash(["list"]);
        if (!stashList.trim()) {
          return { content: "No checkpoints found." };
        }
        const lines = stashList.trim().split("\n");
        const checkpoints = lines.filter((line) => line.includes(CHECKPOINT_PREFIX)).map((line) => {
          const match = line.match(/^(stash@\{\d+\}):.*omni-checkpoint:(.+)$/);
          if (match) {
            return `  ${match[2]} (${match[1]})`;
          }
          return null;
        }).filter(Boolean);
        if (checkpoints.length === 0) {
          return { content: "No omni-code checkpoints found (other stashes may exist)." };
        }
        return {
          content: `Checkpoints:
${checkpoints.join("\n")}`,
          metadata: { count: checkpoints.length }
        };
      }
      async restoreCheckpoint(git, name) {
        const stashRef = await this.findStashRef(git, name);
        if (!stashRef) {
          return { content: `Checkpoint "${name}" not found. Use "list" to see available checkpoints.`, isError: true };
        }
        await git.stash(["apply", stashRef]);
        return {
          content: `Restored checkpoint "${name}" (${stashRef}). The checkpoint still exists \u2014 use "delete" to remove it.`
        };
      }
      async deleteCheckpoint(git, name) {
        const stashRef = await this.findStashRef(git, name);
        if (!stashRef) {
          return { content: `Checkpoint "${name}" not found.`, isError: true };
        }
        await git.stash(["drop", stashRef]);
        return { content: `Deleted checkpoint "${name}" (${stashRef}).` };
      }
      async diffCheckpoint(git, name) {
        const stashRef = await this.findStashRef(git, name);
        if (!stashRef) {
          return { content: `Checkpoint "${name}" not found.`, isError: true };
        }
        const diff = await git.stash(["show", "-p", stashRef]);
        if (!diff.trim())
          return { content: `No differences in checkpoint "${name}".` };
        return { content: `Diff for checkpoint "${name}" (${stashRef}):

${diff}` };
      }
      async findStashRef(git, name) {
        const stashList = await git.stash(["list"]);
        const lines = stashList.trim().split("\n");
        for (const line of lines) {
          if (line.includes(`${CHECKPOINT_PREFIX}${name}`)) {
            const match = line.match(/^(stash@\{\d+\})/);
            if (match)
              return match[1];
          }
        }
        return null;
      }
    };
  }
});

// src/tools/builtin/test-gen.ts
var fs20, path20, TestGenTool;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    init_tool_types();
    TestGenTool = class {
      name = "TestGen";
      description = "Generate a test skeleton for a source file. Analyzes exports and creates describe/it blocks.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file: {
            type: "string",
            description: "Source file path to generate tests for"
          },
          framework: {
            type: "string",
            description: "Test framework: vitest, jest, or pytest (default: auto-detect)"
          },
          outputPath: {
            type: "string",
            description: "Output path for the test file (default: auto-generated)"
          }
        },
        required: ["file"]
      };
      validate(input) {
        if (typeof input.file !== "string" || !input.file.trim()) {
          return "file must be a non-empty string";
        }
        if (input.framework !== void 0) {
          const fw = input.framework;
          if (!["vitest", "jest", "pytest"].includes(fw)) {
            return "framework must be one of: vitest, jest, pytest";
          }
        }
        return null;
      }
      async execute(input, context) {
        const filePath = input.file;
        const framework = input.framework;
        const outputPath = input.outputPath;
        const absPath = path20.isAbsolute(filePath) ? filePath : path20.join(context.cwd, filePath);
        const ext = path20.extname(absPath);
        let content;
        try {
          content = await fs20.readFile(absPath, "utf-8");
        } catch (error) {
          return { content: `Cannot read file: ${error.message}`, isError: true };
        }
        const detectedFramework = framework || await this.detectFramework(context.cwd, ext);
        const exports = this.extractExports(content, ext);
        if (exports.length === 0) {
          return { content: `No exported symbols found in ${filePath}. Cannot generate meaningful tests.`, isError: true };
        }
        const testContent = this.generateTests(absPath, exports, detectedFramework, ext);
        const testPath = outputPath ? path20.isAbsolute(outputPath) ? outputPath : path20.join(context.cwd, outputPath) : this.defaultTestPath(absPath, ext, detectedFramework);
        try {
          await fs20.access(testPath);
          return { content: `Test file already exists: ${testPath}`, isError: true };
        } catch {
        }
        try {
          await fs20.mkdir(path20.dirname(testPath), { recursive: true });
          await fs20.writeFile(testPath, testContent, "utf-8");
          return {
            content: `Generated test file: ${testPath}
Framework: ${detectedFramework}
Exports found: ${exports.map((e) => e.name).join(", ")}

\`\`\`
${testContent}
\`\`\``,
            metadata: { testPath, framework: detectedFramework, exports: exports.length }
          };
        } catch (error) {
          return { content: `Error writing test file: ${error.message}`, isError: true };
        }
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return result.content;
        return `Generated tests: ${result.metadata?.testPath} (${result.metadata?.exports} exports)`;
      }
      extractExports(content, ext) {
        const exports = [];
        if (ext === ".py") {
          for (const match of content.matchAll(/^def (\w+)\s*\(/gm)) {
            if (!match[1].startsWith("_")) {
              exports.push({ name: match[1], type: "function" });
            }
          }
          for (const match of content.matchAll(/^class (\w+)/gm)) {
            exports.push({ name: match[1], type: "class" });
          }
        } else {
          for (const match of content.matchAll(/export\s+function\s+(\w+)/g)) {
            exports.push({ name: match[1], type: "function" });
          }
          for (const match of content.matchAll(/export\s+async\s+function\s+(\w+)/g)) {
            if (!exports.find((e) => e.name === match[1])) {
              exports.push({ name: match[1], type: "function" });
            }
          }
          for (const match of content.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
            exports.push({ name: match[1], type: "const" });
          }
          for (const match of content.matchAll(/export\s+class\s+(\w+)/g)) {
            exports.push({ name: match[1], type: "class" });
          }
          if (/export\s+default\b/.test(content)) {
            exports.push({ name: "default", type: "default" });
          }
        }
        return exports;
      }
      generateTests(sourcePath, exports, framework, ext) {
        if (framework === "pytest") {
          return this.generatePytestTests(sourcePath, exports);
        }
        return this.generateJsTests(sourcePath, exports, framework, ext);
      }
      generateJsTests(sourcePath, exports, framework, ext) {
        const sourceBasename = path20.basename(sourcePath, ext);
        const relativePath = `./${sourceBasename}${ext === ".tsx" ? "" : ""}`;
        const importLine = framework === "vitest" ? `import { describe, it, expect } from 'vitest';
` : "";
        const namedExports = exports.filter((e) => e.type !== "default").map((e) => e.name);
        const hasDefault = exports.some((e) => e.type === "default");
        let importStatement = "";
        if (namedExports.length > 0 && hasDefault) {
          importStatement = `import defaultExport, { ${namedExports.join(", ")} } from '${relativePath}';
`;
        } else if (namedExports.length > 0) {
          importStatement = `import { ${namedExports.join(", ")} } from '${relativePath}';
`;
        } else if (hasDefault) {
          importStatement = `import defaultExport from '${relativePath}';
`;
        }
        let tests = `${importLine}${importStatement}
`;
        for (const exp of exports) {
          const name = exp.type === "default" ? "defaultExport" : exp.name;
          switch (exp.type) {
            case "function":
              tests += `describe('${exp.name}', () => {
`;
              tests += `  it('should be defined', () => {
`;
              tests += `    expect(${name}).toBeDefined();
`;
              tests += `  });

`;
              tests += `  it('should return expected result', () => {
`;
              tests += `    // TODO: implement test
`;
              tests += `    const result = ${name}();
`;
              tests += `    expect(result).toBeDefined();
`;
              tests += `  });
`;
              tests += `});

`;
              break;
            case "class":
              tests += `describe('${exp.name}', () => {
`;
              tests += `  it('should be instantiable', () => {
`;
              tests += `    // TODO: provide constructor arguments
`;
              tests += `    const instance = new ${name}();
`;
              tests += `    expect(instance).toBeInstanceOf(${name});
`;
              tests += `  });
`;
              tests += `});

`;
              break;
            case "const":
              tests += `describe('${exp.name}', () => {
`;
              tests += `  it('should be defined', () => {
`;
              tests += `    expect(${name}).toBeDefined();
`;
              tests += `  });
`;
              tests += `});

`;
              break;
            case "default":
              tests += `describe('default export', () => {
`;
              tests += `  it('should be defined', () => {
`;
              tests += `    expect(${name}).toBeDefined();
`;
              tests += `  });
`;
              tests += `});

`;
              break;
          }
        }
        return tests;
      }
      generatePytestTests(sourcePath, exports) {
        const moduleName = path20.basename(sourcePath, ".py");
        let imports = `import pytest
`;
        const funcs = exports.filter((e) => e.type === "function").map((e) => e.name);
        const classes = exports.filter((e) => e.type === "class").map((e) => e.name);
        if (funcs.length > 0) {
          imports += `from ${moduleName} import ${funcs.join(", ")}
`;
        }
        if (classes.length > 0) {
          imports += `from ${moduleName} import ${classes.join(", ")}
`;
        }
        let tests = `${imports}

`;
        for (const exp of exports) {
          if (exp.type === "function") {
            tests += `def test_${exp.name}():
`;
            tests += `    """Test ${exp.name} function."""
`;
            tests += `    # TODO: implement test
`;
            tests += `    result = ${exp.name}()
`;
            tests += `    assert result is not None


`;
          } else if (exp.type === "class") {
            tests += `class Test${exp.name}:
`;
            tests += `    """Tests for ${exp.name} class."""

`;
            tests += `    def test_instantiation(self):
`;
            tests += `        # TODO: provide constructor arguments
`;
            tests += `        instance = ${exp.name}()
`;
            tests += `        assert instance is not None


`;
          }
        }
        return tests;
      }
      defaultTestPath(sourcePath, ext, framework) {
        const dir = path20.dirname(sourcePath);
        const basename13 = path20.basename(sourcePath, ext);
        if (framework === "pytest") {
          const testsDir = path20.join(dir, "..", "tests");
          return path20.join(testsDir, `test_${basename13}.py`);
        }
        return path20.join(dir, `${basename13}.test${ext === ".tsx" ? ".tsx" : ext}`);
      }
      async detectFramework(cwd, ext) {
        if (ext === ".py")
          return "pytest";
        try {
          const pkgJson = JSON.parse(await fs20.readFile(path20.join(cwd, "package.json"), "utf-8"));
          const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
          if (allDeps["vitest"])
            return "vitest";
          if (allDeps["jest"])
            return "jest";
        } catch {
        }
        return "vitest";
      }
    };
  }
});

// src/tools/builtin/query-codebase.ts
var QueryCodebaseTool;
var init_query_codebase = __esm({
  "src/tools/builtin/query-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
    QueryCodebaseTool = class {
      name = "QueryCodebase";
      description = `Search the indexed codebase using semantic/vector search. Returns relevant code chunks matching a natural language query. Run IndexCodebase first to build the index. Semantic search becomes available at 80% indexing completion.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: 'Natural language query to search the codebase for (e.g. "error handling in API routes")'
          },
          topK: {
            type: "number",
            description: "Number of results to return (default: 5, max: 20)"
          }
        },
        required: ["query"]
      };
      validate(input) {
        if (typeof input.query !== "string" || !input.query.trim()) {
          return "query must be a non-empty string";
        }
        if (input.topK !== void 0 && (typeof input.topK !== "number" || input.topK < 1 || input.topK > 20)) {
          return "topK must be a number between 1 and 20";
        }
        return null;
      }
      async execute(input, context) {
        const query = input.query.trim();
        const topK = input.topK || 5;
        try {
          const indexer = new ProjectIndexer(context.cwd);
          await indexer.initialize();
          const state = indexer.getState();
          if (!state.isSemanticSearchReady && state.status === "indexing") {
            indexer.destroy();
            return {
              content: `Indexing still in progress (${state.progress}% complete). Semantic search will be available at 80% completion. Please wait or try again in a moment.`,
              isError: true
            };
          }
          const results = await indexer.query(query, topK);
          indexer.destroy();
          if (results.length === 0) {
            return {
              content: "No results found. Make sure you have run IndexCodebase first to build the semantic index."
            };
          }
          const formatted = results.map((chunk, i) => {
            const file = chunk.metadata?.file || "unknown";
            const startLine = chunk.metadata?.startLine || "?";
            const endLine = chunk.metadata?.endLine || "?";
            const type = chunk.metadata?.type || "code";
            const name = chunk.metadata?.name;
            let header = `### Result ${i + 1}: ${file}:${startLine}`;
            if (name) {
              header += ` (${type}: ${name})`;
            }
            return `${header}
\`\`\`
${chunk.content}
\`\`\``;
          }).join("\n\n");
          return {
            content: `Found ${results.length} relevant chunks for "${query}":

${formatted}`
          };
        } catch (error) {
          return {
            content: `Error querying codebase: ${error.message}. Have you run IndexCodebase first?`,
            isError: true
          };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const lines = result.content.split("\n");
        return lines[0] || `Queried for "${input.query}"`;
      }
    };
  }
});

// src/tools/builtin/repo-map.ts
var fs21, path21, import_fast_glob3, RepoMapTool;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    path21 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
    RepoMapTool = class {
      name = "RepoMap";
      description = `Generate a structural map of the codebase showing files and their exported symbols (functions, classes, interfaces, types, enums) with signatures. Useful for understanding project architecture without reading every file.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "Glob pattern for files to analyze (default: src/**/*.{ts,tsx,js,jsx,py})"
          },
          maxFiles: {
            type: "number",
            description: "Maximum number of files to analyze (default: 100)"
          },
          includeSignatures: {
            type: "boolean",
            description: "Include function signatures (default: true)"
          }
        },
        required: []
      };
      validate(input) {
        if (input.pattern !== void 0 && typeof input.pattern !== "string") {
          return "pattern must be a string glob pattern";
        }
        if (input.maxFiles !== void 0 && (typeof input.maxFiles !== "number" || input.maxFiles < 1)) {
          return "maxFiles must be a positive number";
        }
        return null;
      }
      async execute(input, context) {
        const pattern = input.pattern || "src/**/*.{ts,tsx,js,jsx,py}";
        const maxFiles = input.maxFiles || 100;
        const includeSignatures = input.includeSignatures !== false;
        try {
          const files = await (0, import_fast_glob3.default)(pattern, {
            cwd: context.cwd,
            deep: 6,
            ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/build/**"]
          });
          const limitedFiles = files.sort().slice(0, maxFiles);
          const output = [];
          let totalSymbols = 0;
          for (const relPath of limitedFiles) {
            try {
              const absPath = path21.join(context.cwd, relPath);
              const content = await fs21.readFile(absPath, "utf-8");
              const ext = path21.extname(relPath).toLowerCase();
              const isPython = ext === ".py";
              const symbols = isPython ? this.extractPythonSymbols(content) : this.extractTSSymbols(content);
              if (symbols.length > 0) {
                output.push(relPath);
                for (const sym of symbols) {
                  const sig = includeSignatures && sym.signature ? sym.signature.trim() : "";
                  output.push(`  ${sym.kind} ${sym.name}${sig ? " " + sig : ""}`);
                  totalSymbols++;
                }
                output.push("");
              }
            } catch {
            }
          }
          if (output.length === 0) {
            return { content: `No exported symbols found in ${limitedFiles.length} files matching "${pattern}".` };
          }
          return {
            content: `Repository map: ${totalSymbols} symbols across ${limitedFiles.length} files

${output.join("\n")}`
          };
        } catch (error) {
          return { content: `Error generating repo map: ${error.message}`, isError: true };
        }
      }
      extractTSSymbols(content) {
        const symbols = [];
        const seen = /* @__PURE__ */ new Set();
        for (const match of content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*(\([^)]*\)(?:\s*:\s*[^{]+)?)/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            symbols.push({ name: match[1], kind: "function", signature: match[2]?.trim() });
          }
        }
        for (const match of content.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            const ext = match[2] ? ` extends ${match[2]}` : "";
            symbols.push({ name: match[1], kind: "class", signature: ext || void 0 });
          }
        }
        for (const match of content.matchAll(/export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            const ext = match[2] ? ` extends ${match[2].trim()}` : "";
            symbols.push({ name: match[1], kind: "interface", signature: ext || void 0 });
          }
        }
        for (const match of content.matchAll(/export\s+type\s+(\w+)(?:\s*<[^>]*>)?\s*=/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            symbols.push({ name: match[1], kind: "type" });
          }
        }
        for (const match of content.matchAll(/export\s+(?:const\s+)?enum\s+(\w+)/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            symbols.push({ name: match[1], kind: "enum" });
          }
        }
        for (const match of content.matchAll(/export\s+const\s+(\w+)(?:\s*:\s*([^=]+))?\s*=/g)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            const typeAnnotation = match[2]?.trim();
            symbols.push({ name: match[1], kind: "const", signature: typeAnnotation });
          }
        }
        return symbols;
      }
      extractPythonSymbols(content) {
        const symbols = [];
        const seen = /* @__PURE__ */ new Set();
        for (const match of content.matchAll(/^def\s+(\w+)\s*(\([^)]*\)(?:\s*->\s*[^:]+)?)/gm)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            symbols.push({ name: match[1], kind: "def", signature: match[2]?.trim() });
          }
        }
        for (const match of content.matchAll(/^class\s+(\w+)(?:\(([^)]*)\))?/gm)) {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            const bases = match[2] ? `(${match[2]})` : "";
            symbols.push({ name: match[1], kind: "class", signature: bases || void 0 });
          }
        }
        return symbols;
      }
      formatForDisplay(result, _input) {
        if (result.isError)
          return result.content;
        return result.content.split("\n")[0] || "Repository map generated";
      }
    };
  }
});

// src/tools/builtin/self-analyze.ts
var fs22, path22, IGNORES, SelfAnalyzeTool;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs22 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
    init_tool_types();
    IGNORES = /* @__PURE__ */ new Set([
      "node_modules",
      "dist",
      "build",
      ".git",
      ".next",
      "coverage",
      "__pycache__",
      ".vscode",
      ".idea"
    ]);
    SelfAnalyzeTool = class {
      name = "SelfAnalyze";
      description = "Reports on the codebase structure: directory tree (depth-limited), file/dir stats by extension/language, total size, detected frameworks/project type from package.json, top dependencies. Supports custom root, maxDepth, statsOnly mode.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          root: {
            type: "string",
            description: "Root directory path (relative to cwd or absolute). Defaults to cwd."
          },
          maxDepth: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "Maximum recursion depth for directory tree. Defaults to 3."
          },
          statsOnly: {
            type: "boolean",
            description: "Fast stats-only mode without building tree structure (full recursion for stats)."
          }
        },
        additionalProperties: false
      };
      validate(input) {
        const input_ = input;
        if (input_.root != null && typeof input_.root !== "string") {
          return "root must be a string";
        }
        if (input_.maxDepth != null && (typeof input_.maxDepth !== "number" || input_.maxDepth < 1 || input_.maxDepth > 10)) {
          return "maxDepth must be a number between 1 and 10";
        }
        if (input_.statsOnly != null && typeof input_.statsOnly !== "boolean") {
          return "statsOnly must be a boolean";
        }
        return null;
      }
      getLangFromExt(ext) {
        const map = {
          ts: "TypeScript",
          tsx: "TSX",
          js: "JavaScript",
          jsx: "JSX",
          py: "Python",
          rs: "Rust",
          go: "Go",
          json: "JSON",
          md: "Markdown",
          yaml: "YAML",
          yml: "YAML",
          toml: "TOML",
          html: "HTML",
          css: "CSS",
          scss: "SCSS"
        };
        return map[ext] || ext.toUpperCase();
      }
      detectFrameworks(pkg) {
        if (!pkg)
          return [];
        const frameworks = [];
        const allDeps = { ...pkg.dependencies || {}, ...pkg.devDependencies || {} };
        if (allDeps.react || allDeps["react-dom"])
          frameworks.push("React");
        if (allDeps.vite)
          frameworks.push("Vite");
        if (allDeps.next)
          frameworks.push("Next.js");
        if (allDeps.vitest || allDeps.jest)
          frameworks.push(allDeps.vitest ? "Vitest" : "Jest");
        if (allDeps.typescript || (pkg.scripts?.build || "").includes("tsc"))
          frameworks.push("TypeScript");
        if (allDeps.express)
          frameworks.push("Express");
        if (pkg.bin && typeof pkg.bin === "object")
          frameworks.push("CLI Tool");
        return [...new Set(frameworks)];
      }
      async analyzeDir(absPath, currentDepth, maxDepth, stats, statsOnly, parentChildren) {
        let stat10;
        try {
          stat10 = await fs22.stat(absPath);
        } catch {
          return;
        }
        const name = path22.basename(absPath);
        if (name.startsWith(".") || IGNORES.has(name)) {
          return;
        }
        if (stat10.isFile()) {
          stats.files++;
          const size = BigInt(stat10.size);
          stats.size += size;
          const ext = path22.extname(name).slice(1).toLowerCase() || "other";
          stats.fileStats[ext] = (stats.fileStats[ext] || 0) + 1;
          stats.langs.add(this.getLangFromExt(ext));
          if (!statsOnly && parentChildren) {
            parentChildren.push({ name, type: "file", size });
          }
          return;
        }
        if (!stat10.isDirectory()) {
          return;
        }
        stats.dirs++;
        const node = { name, type: "dir", children: [] };
        if (!statsOnly && parentChildren) {
          parentChildren.push(node);
        }
        if (currentDepth >= maxDepth) {
          return;
        }
        let entries;
        try {
          entries = await fs22.readdir(absPath, { withFileTypes: true });
        } catch {
          return;
        }
        const validEntries = entries.filter((e) => !e.name.startsWith(".") && !IGNORES.has(e.name)).sort((a, b) => a.name.localeCompare(b.name));
        await Promise.all(
          validEntries.map(
            (entry) => this.analyzeDir(
              path22.join(absPath, entry.name),
              currentDepth + 1,
              maxDepth,
              stats,
              statsOnly,
              !statsOnly ? node.children : void 0
            )
          )
        );
      }
      treeToMarkdown(node, prefix = "", isLast = true) {
        let str = prefix + (isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ") + (node.type === "dir" ? "\u{1F4C1} " : "\u{1F4C4} ") + node.name;
        if (node.type === "file" && node.size !== void 0) {
          str += ` (${(Number(node.size) / 1024).toFixed(1)}kB)`;
        }
        str += "\\n";
        if (node.children && node.children.length > 0) {
          const newPrefix = prefix + (isLast ? "    " : "\u2502   ");
          for (let i = 0; i < node.children.length; i++) {
            const childIsLast = i === node.children.length - 1;
            str += this.treeToMarkdown(node.children[i], newPrefix, childIsLast);
          }
        }
        return str;
      }
      async getStatsAndTree(dir, maxDepth, statsOnly) {
        const stats = {
          files: 0,
          dirs: 0,
          size: 0n,
          fileStats: {},
          langs: /* @__PURE__ */ new Set(),
          pkg: null
        };
        const pkgPath = path22.join(dir, "package.json");
        try {
          const data = await fs22.readFile(pkgPath, "utf8");
          stats.pkg = JSON.parse(data);
        } catch {
        }
        if (statsOnly) {
          await this.analyzeDir(dir, 0, maxDepth, stats, true);
        } else {
          const treeRoot = { name: path22.basename(dir), type: "dir", children: [] };
          await this.analyzeDir(dir, 0, maxDepth, stats, false, treeRoot.children);
          return { tree: treeRoot, stats };
        }
        return { tree: void 0, stats };
      }
      async execute(input, context) {
        const err = this.validate(input);
        if (err) {
          return { content: err, isError: true };
        }
        const input_ = input;
        const root = input_.root || ".";
        const targetDir = path22.resolve(context.cwd, root);
        const maxDepth = input_.maxDepth ?? 3;
        const statsOnly = !!input_.statsOnly;
        try {
          await fs22.access(targetDir);
        } catch {
          return { content: `Cannot access directory: ${targetDir}`, isError: true };
        }
        const relativeRoot = path22.relative(process.cwd(), targetDir) || ".";
        const analysis = await this.getStatsAndTree(targetDir, maxDepth, statsOnly);
        const stats = analysis.stats;
        let content = `# Codebase Analysis: ${relativeRoot}\\n\\n`;
        if (analysis.tree) {
          content += "## Directory Tree\\n\\n";
          content += "```\\n" + this.treeToMarkdown(analysis.tree) + "\\n```\\n\\n";
        }
        content += "## Statistics\\n\\n";
        const sizeMB = Number(stats.size) / (1024 * 1024);
        content += `- Files: ${stats.files.toLocaleString()}\\n`;
        content += `- Directories: ${stats.dirs.toLocaleString()}\\n`;
        content += `- Total Size: ${sizeMB.toFixed(2)} MB (${stats.size.toString()} bytes)\\n`;
        const langsList = Array.from(stats.langs).sort().join(", ");
        content += `- Languages: ${langsList}\\n`;
        const topExts = Object.entries(stats.fileStats).sort(([, a], [, b]) => b - a).slice(0, 5).map(([ext, count]) => `${ext}: ${count}`).join(", ");
        content += `- Top Extensions: ${topExts}${Object.keys(stats.fileStats).length > 5 ? " ..." : ""}\\n`;
        if (stats.pkg) {
          content += "\\n## Package Info\\n\\n";
          content += `- Name: ${stats.pkg.name || "unknown"}\\n`;
          content += `- Version: ${stats.pkg.version || "unknown"}\\n`;
          const fw = this.detectFrameworks(stats.pkg);
          if (fw.length) {
            content += `- Frameworks: ${fw.join(", ")}\\n`;
          }
          const deps = Object.keys(stats.pkg.dependencies || {});
          const topDeps = deps.slice(0, 10).join(", ");
          content += `- Dependencies: ${topDeps}${deps.length > 10 ? " ..." : ""} (${deps.length})\\n`;
          const devDeps = Object.keys(stats.pkg.devDependencies || {}).length;
          content += `- Dev Dependencies: ${devDeps}\\n`;
          const projectType = stats.pkg.bin && typeof stats.pkg.bin === "object" ? "CLI Tool" : stats.pkg.main ? "Library/Web App" : "Unknown";
          content += `- Project Type: ${projectType}\\n`;
        }
        const metadata = {
          path: relativeRoot,
          stats: {
            files: stats.files,
            dirs: stats.dirs,
            size: stats.size.toString(),
            langs: Array.from(stats.langs).sort(),
            fileStats: stats.fileStats,
            frameworks: stats.pkg ? this.detectFrameworks(stats.pkg) : [],
            projectType: stats.pkg?.bin ? "CLI" : "Library"
          }
        };
        return { content, metadata, isError: false };
      }
      formatForDisplay(result) {
        if (result.isError) {
          return `SelfAnalyze error: ${result.content}`;
        }
        const meta = result.metadata?.stats || {};
        const sizeMB = Number(meta.size || 0) / (1024 * 1024);
        const langs = meta.langs?.slice(0, 3).join(", ") || "N/A";
        const fw = meta.frameworks?.slice(0, 3).join(", ") || "N/A";
        return `SelfAnalyze: ${meta.files || 0} files, ${sizeMB.toFixed(1)}MB, langs: ${langs}${langs !== "N/A" ? "..." : ""}, frameworks: ${fw}`;
      }
    };
  }
});

// src/tools/builtin/git-commit.ts
var GitCommitTool;
var init_git_commit = __esm({
  "src/tools/builtin/git-commit.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    GitCommitTool = class {
      name = "GitCommit";
      description = "Stage files and create a git commit with a message. Can stage specific files or all changes.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          message: { type: "string", description: "Commit message" },
          files: { type: "array", items: { type: "string" }, description: "Specific files to stage (optional, stages all if omitted)" },
          all: { type: "boolean", description: "Stage all modified and deleted files (default: false)" }
        },
        required: ["message"]
      };
      validate(input) {
        if (typeof input.message !== "string" || !input.message.trim())
          return "message must be a non-empty string";
        return null;
      }
      async execute(input, context) {
        const message = input.message;
        const files = input.files;
        const all = input.all;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          if (files && files.length > 0) {
            await git.add(files);
          } else if (all) {
            await git.add(["-A"]);
          }
          const result = await git.commit(message);
          return { content: `Committed: ${result}` };
        } catch (error) {
          return { content: `Git commit error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/git-diff.ts
var GitDiffTool;
var init_git_diff = __esm({
  "src/tools/builtin/git-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    GitDiffTool = class {
      name = "GitDiff";
      description = "Show git diff for staged, unstaged, or branch comparison changes.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          staged: { type: "boolean", description: "Show staged changes only (default: false)" },
          file: { type: "string", description: "Show diff for a specific file only" },
          compare: { type: "string", description: 'Compare branches/commits (e.g., "main...HEAD", "abc123..def456")' }
        },
        required: []
      };
      validate(_input) {
        return null;
      }
      async execute(input, context) {
        const staged = input.staged;
        const file = input.file;
        const compare = input.compare;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          let diff;
          if (compare) {
            diff = await git.diffRange(compare);
          } else {
            diff = await git.diff(staged);
          }
          if (file) {
            const lines = diff.split("\n");
            const filtered = [];
            let inTargetFile = false;
            for (const line of lines) {
              if (line.startsWith("diff --git")) {
                inTargetFile = line.includes(file);
              }
              if (inTargetFile)
                filtered.push(line);
            }
            diff = filtered.join("\n");
          }
          if (!diff.trim())
            return { content: "No changes found." };
          return { content: diff };
        } catch (error) {
          return { content: `Git diff error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/git-log.ts
var GitLogTool;
var init_git_log = __esm({
  "src/tools/builtin/git-log.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    GitLogTool = class {
      name = "GitLog";
      description = "Show git commit history with optional formatting and filtering.";
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          maxCount: { type: "number", description: "Maximum number of commits to show (default: 10)" },
          oneline: { type: "boolean", description: "Show condensed one-line format (default: false)" },
          file: { type: "string", description: "Show commits affecting a specific file" }
        },
        required: []
      };
      validate(_input) {
        return null;
      }
      async execute(input, context) {
        const maxCount = input.maxCount || 10;
        const oneline = input.oneline;
        const file = input.file;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          const log = await git.log(maxCount, oneline, file);
          if (!log.trim())
            return { content: "No commits found." };
          return { content: log };
        } catch (error) {
          return { content: `Git log error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/git-branch.ts
var GitBranchTool;
var init_git_branch = __esm({
  "src/tools/builtin/git-branch.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    GitBranchTool = class {
      name = "GitBranch";
      description = "List, create, switch, or delete git branches.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: { type: "string", enum: ["list", "create", "switch", "delete"], description: "Branch action to perform" },
          name: { type: "string", description: "Branch name (required for create/switch/delete)" }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!["list", "create", "switch", "delete"].includes(action))
          return "action must be list, create, switch, or delete";
        if (action !== "list" && (!input.name || typeof input.name !== "string"))
          return "name is required for create/switch/delete";
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        const name = input.name;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          switch (action) {
            case "list": {
              const branches = await git.listBranches();
              const current = await git.currentBranch();
              const formatted = branches.map((b) => b === current ? `* ${b}` : `  ${b}`).join("\n");
              return { content: formatted || "No branches found." };
            }
            case "create":
              await git.createBranch(name);
              return { content: `Created and switched to branch: ${name}` };
            case "switch":
              await git.switchBranch(name);
              return { content: `Switched to branch: ${name}` };
            case "delete":
              await git.deleteBranch(name);
              return { content: `Deleted branch: ${name}` };
            default:
              return { content: `Unknown action: ${action}`, isError: true };
          }
        } catch (error) {
          return { content: `Git branch error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/git-stash.ts
var GitStashTool;
var init_git_stash = __esm({
  "src/tools/builtin/git-stash.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    GitStashTool = class {
      name = "GitStash";
      description = "Manage git stash: save, restore, list, or drop stashed changes.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: { type: "string", enum: ["push", "pop", "list", "apply", "drop"], description: "Stash action" },
          message: { type: "string", description: "Stash message (for push action)" },
          index: { type: "number", description: "Stash index (for pop/apply/drop, default: 0)" }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!["push", "pop", "list", "apply", "drop"].includes(action))
          return "action must be push, pop, list, apply, or drop";
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        const message = input.message;
        const index = input.index ?? 0;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          const result = await git.stash(action, message, index);
          return { content: result || `Stash ${action} completed.` };
        } catch (error) {
          return { content: `Git stash error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/unified-diff-edit.ts
var fs23, path23, UnifiedDiffEditTool;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    path23 = __toESM(require("path"), 1);
    init_tool_types();
    UnifiedDiffEditTool = class {
      name = "DiffEdit";
      description = `Apply changes to a file using unified diff format. Accepts standard unified diff with @@ hunks and +/- line markers. More token-efficient than full file replacement for small changes.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Absolute path to the target file" },
          diff: { type: "string", description: "Unified diff to apply (with @@ headers and +/- lines)" }
        },
        required: ["file_path", "diff"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path)
          return "file_path must be a non-empty string";
        if (!path23.isAbsolute(input.file_path))
          return "file_path must be an absolute path";
        if (typeof input.diff !== "string" || !input.diff.trim())
          return "diff must be a non-empty string";
        return null;
      }
      async execute(input, _context) {
        const filePath = input.file_path;
        const diff = input.diff;
        try {
          const content = await fs23.readFile(filePath, "utf-8");
          const lines = content.split("\n");
          const hunks = this.parseHunks(diff);
          if (hunks.length === 0) {
            return { content: "No valid hunks found in the diff.", isError: true };
          }
          const sortedHunks = hunks.sort((a, b) => b.origStart - a.origStart);
          const result = [...lines];
          for (const hunk of sortedHunks) {
            const matchOffset = this.findHunkOffset(result, hunk);
            if (matchOffset === -1) {
              return { content: `Could not find matching context for hunk at line ${hunk.origStart}. Context lines don't match the file.`, isError: true };
            }
            const newLines = [];
            for (const op of hunk.operations) {
              if (op.type === "context" || op.type === "add") {
                newLines.push(op.line);
              }
            }
            const removeCount = hunk.operations.filter((op) => op.type === "context" || op.type === "remove").length;
            result.splice(matchOffset, removeCount, ...newLines);
          }
          await fs23.writeFile(filePath, result.join("\n"), "utf-8");
          return {
            content: `Applied ${hunks.length} hunk(s) to ${filePath}. ${result.length} lines total.`,
            metadata: { hunksApplied: hunks.length, totalLines: result.length }
          };
        } catch (error) {
          const err = error;
          if (err.code === "ENOENT")
            return { content: `File not found: ${filePath}`, isError: true };
          return { content: `Error applying diff: ${err.message}`, isError: true };
        }
      }
      parseHunks(diff) {
        const hunks = [];
        const lines = diff.split("\n");
        let i = 0;
        while (i < lines.length && !lines[i].startsWith("@@"))
          i++;
        while (i < lines.length) {
          if (lines[i].startsWith("@@")) {
            const match = lines[i].match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (!match) {
              i++;
              continue;
            }
            const hunk = {
              origStart: parseInt(match[1]),
              origCount: parseInt(match[2] ?? "1"),
              newStart: parseInt(match[3]),
              newCount: parseInt(match[4] ?? "1"),
              contextLines: [],
              removeLines: [],
              addLines: [],
              operations: []
            };
            i++;
            while (i < lines.length && !lines[i].startsWith("@@")) {
              const line = lines[i];
              if (line.startsWith("+")) {
                const content = line.substring(1);
                hunk.addLines.push(content);
                hunk.operations.push({ type: "add", line: content });
              } else if (line.startsWith("-")) {
                const content = line.substring(1);
                hunk.removeLines.push(content);
                hunk.operations.push({ type: "remove", line: content });
              } else if (line.startsWith(" ") || line === "") {
                const content = line.startsWith(" ") ? line.substring(1) : line;
                hunk.contextLines.push(content);
                hunk.operations.push({ type: "context", line: content });
              } else {
                break;
              }
              i++;
            }
            if (hunk.operations.length > 0)
              hunks.push(hunk);
          } else {
            i++;
          }
        }
        return hunks;
      }
      findHunkOffset(lines, hunk) {
        const startIdx = hunk.origStart - 1;
        if (this.matchesAtOffset(lines, hunk, startIdx))
          return startIdx;
        for (let offset = 1; offset <= 5; offset++) {
          if (this.matchesAtOffset(lines, hunk, startIdx + offset))
            return startIdx + offset;
          if (this.matchesAtOffset(lines, hunk, startIdx - offset))
            return startIdx - offset;
        }
        return -1;
      }
      matchesAtOffset(lines, hunk, offset) {
        if (offset < 0 || offset >= lines.length)
          return false;
        let lineIdx = offset;
        for (const op of hunk.operations) {
          if (op.type === "context" || op.type === "remove") {
            if (lineIdx >= lines.length)
              return false;
            if (lines[lineIdx].trimEnd() !== op.line.trimEnd())
              return false;
            lineIdx++;
          }
        }
        return true;
      }
      formatForDisplay(result, _input) {
        return result.content;
      }
    };
  }
});

// src/tools/builtin/background-agent.ts
function evictOldestCompleted() {
  for (const [id, t] of backgroundTasks) {
    if (t.status !== "running") {
      backgroundTasks.delete(id);
      return;
    }
  }
}
var MAX_TASKS, TASK_TTL_MS, backgroundTasks, BackgroundAgentTool;
var init_background_agent = __esm({
  "src/tools/builtin/background-agent.ts"() {
    "use strict";
    init_tool_types();
    MAX_TASKS = 50;
    TASK_TTL_MS = 10 * 60 * 1e3;
    backgroundTasks = /* @__PURE__ */ new Map();
    BackgroundAgentTool = class {
      name = "BackgroundAgent";
      description = `Spawn a background agent that works independently on a task. Returns a task ID immediately. Use 'status' to check progress and retrieve results.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "agent" /* AGENT */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["spawn", "status", "list"],
            description: "Action: spawn a new task, check status, or list all tasks"
          },
          task: {
            type: "string",
            description: "Task description for the background agent (required for spawn)"
          },
          task_id: {
            type: "string",
            description: "Task ID to check status of (required for status)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!["spawn", "status", "list"].includes(action))
          return "action must be spawn, status, or list";
        if (action === "spawn" && (!input.task || typeof input.task !== "string"))
          return "task is required for spawn action";
        if (action === "status" && (!input.task_id || typeof input.task_id !== "string"))
          return "task_id is required for status action";
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        switch (action) {
          case "spawn": {
            const taskDesc = input.task;
            const taskId = crypto.randomUUID().substring(0, 8);
            if (!context.spawnSubAgent) {
              return { content: "Background agents require sub-agent spawning capability.", isError: true };
            }
            if (backgroundTasks.size >= MAX_TASKS) {
              evictOldestCompleted();
            }
            const task = {
              id: taskId,
              task: taskDesc,
              status: "running",
              startedAt: Date.now()
            };
            backgroundTasks.set(taskId, task);
            context.spawnSubAgent(taskDesc, false).then((result) => {
              task.status = "done";
              task.result = result;
              task.completedAt = Date.now();
              setTimeout(() => backgroundTasks.delete(taskId), TASK_TTL_MS);
            }).catch((err) => {
              task.status = "error";
              task.error = err.message;
              task.completedAt = Date.now();
              setTimeout(() => backgroundTasks.delete(taskId), TASK_TTL_MS);
            });
            return {
              content: `Background task spawned with ID: ${taskId}
Task: ${taskDesc}
Use BackgroundAgent with action "status" and task_id "${taskId}" to check progress.`,
              metadata: { taskId }
            };
          }
          case "status": {
            const taskId = input.task_id;
            const task = backgroundTasks.get(taskId);
            if (!task)
              return { content: `No task found with ID: ${taskId}`, isError: true };
            const elapsed = ((task.completedAt || Date.now()) - task.startedAt) / 1e3;
            let statusText = `Task ${task.id}: ${task.status} (${elapsed.toFixed(1)}s)
Description: ${task.task}`;
            if (task.status === "done" && task.result) {
              statusText += `

Result:
${task.result}`;
            } else if (task.status === "error" && task.error) {
              statusText += `

Error: ${task.error}`;
            }
            return { content: statusText };
          }
          case "list": {
            if (backgroundTasks.size === 0)
              return { content: "No background tasks." };
            const lines = [];
            for (const [id, task] of backgroundTasks) {
              const elapsed = ((task.completedAt || Date.now()) - task.startedAt) / 1e3;
              lines.push(`${id} | ${task.status.padEnd(7)} | ${elapsed.toFixed(1)}s | ${task.task.substring(0, 60)}`);
            }
            return { content: `Background tasks:

ID       | Status  | Time   | Task
${lines.join("\n")}` };
          }
          default:
            return { content: `Unknown action: ${action}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/code-review.ts
var CodeReviewTool;
var init_code_review = __esm({
  "src/tools/builtin/code-review.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    CodeReviewTool = class {
      name = "CodeReview";
      description = `Gather git diff for code review analysis. Returns the diff formatted with review guidelines for systematic review of changes for bugs, security issues, style, and improvements.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["staged", "unstaged", "branch"],
            description: "What to review: staged changes, unstaged changes, or branch diff (default: unstaged)"
          },
          branch: {
            type: "string",
            description: 'Branch to compare against (for target="branch", e.g., "main")'
          },
          file: {
            type: "string",
            description: "Review changes for a specific file only"
          }
        },
        required: []
      };
      validate(input) {
        if (input.target === "branch" && !input.branch)
          return 'branch is required when target is "branch"';
        return null;
      }
      async execute(input, context) {
        const target = input.target || "unstaged";
        const branch = input.branch;
        const file = input.file;
        try {
          const git = new GitManager(context.cwd);
          if (!await git.isRepo())
            return { content: "Not a git repository", isError: true };
          let diff;
          if (target === "branch" && branch) {
            diff = await git.diffRange(`${branch}...HEAD`);
          } else {
            diff = await git.diff(target === "staged");
          }
          if (file) {
            const lines = diff.split("\n");
            const filtered = [];
            let inFile = false;
            for (const line of lines) {
              if (line.startsWith("diff --git"))
                inFile = line.includes(file);
              if (inFile)
                filtered.push(line);
            }
            diff = filtered.join("\n");
          }
          if (!diff.trim())
            return { content: "No changes to review." };
          const status = await git.status();
          const reviewPrompt = `## Code Review

### Repository Status
${status}

### Changes to Review
\`\`\`diff
${diff}
\`\`\`

### Review Checklist
Please analyze the diff above for:
1. **Correctness**: Logic errors, off-by-one, null/undefined handling
2. **Security**: Injection vulnerabilities, data exposure, auth issues
3. **Performance**: N+1 queries, unnecessary allocations, blocking operations
4. **Style**: Naming conventions, code organization, consistency
5. **Edge cases**: Error handling, boundary conditions, empty inputs
6. **Testing**: Are the changes covered by tests?`;
          return { content: reviewPrompt };
        } catch (error) {
          return { content: `Code review error: ${error.message}`, isError: true };
        }
      }
    };
  }
});

// src/tools/builtin/browser-automation.ts
var VALID_ACTIONS3, browserInstance, BrowserAutomationTool;
var init_browser_automation = __esm({
  "src/tools/builtin/browser-automation.ts"() {
    "use strict";
    init_tool_types();
    VALID_ACTIONS3 = ["navigate", "screenshot", "evaluate", "click", "type", "select", "content"];
    browserInstance = null;
    BrowserAutomationTool = class {
      name = "Browser";
      description = `Automate a headless browser for web testing, scraping, or UI verification. Actions: navigate (go to URL), screenshot (capture page), evaluate (run JS), click (click selector), type (type into input), select (select option), content (get page text/HTML).`;
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action to perform: navigate, screenshot, evaluate, click, type, select, content"
          },
          url: {
            type: "string",
            description: "URL to navigate to (for navigate action)"
          },
          selector: {
            type: "string",
            description: "CSS selector for click/type/select actions"
          },
          text: {
            type: "string",
            description: "Text to type (for type action) or option value (for select action)"
          },
          code: {
            type: "string",
            description: "JavaScript code to evaluate in the page context (for evaluate action)"
          },
          fullPage: {
            type: "boolean",
            description: "Capture full page screenshot (default: true)"
          },
          waitFor: {
            type: "string",
            description: "CSS selector to wait for before action"
          },
          timeout: {
            type: "number",
            description: "Timeout in ms (default: 30000)"
          },
          format: {
            type: "string",
            description: 'For content action: "text" or "html" (default: "text")'
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS3.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS3.join(", ")}`;
        }
        if (action === "navigate" && !input.url)
          return "url is required for navigate action";
        if (action === "evaluate" && !input.code)
          return "code is required for evaluate action";
        if ((action === "click" || action === "type" || action === "select") && !input.selector) {
          return `selector is required for ${action} action`;
        }
        if (action === "type" && !input.text)
          return "text is required for type action";
        return null;
      }
      async execute(input, _context) {
        const action = input.action;
        const timeout = input.timeout || 3e4;
        try {
          const { page, isNew } = await this.getPage();
          if (input.waitFor) {
            await page.waitForSelector(input.waitFor, { timeout });
          }
          switch (action) {
            case "navigate": {
              const url = input.url;
              const response = await page.goto(url, { waitUntil: "networkidle2", timeout });
              const status = response?.status() || "unknown";
              const title = await page.title();
              return { content: `Navigated to ${url}
Status: ${status}
Title: ${title}` };
            }
            case "screenshot": {
              const fullPage = input.fullPage !== false;
              const buffer = await page.screenshot({ fullPage, type: "png" });
              const base64 = Buffer.from(buffer).toString("base64");
              const imageBlock = {
                type: "image",
                source: { type: "base64", mediaType: "image/png", data: base64 }
              };
              const title = await page.title();
              const url = page.url();
              return {
                content: `Screenshot captured: ${title} (${url}), ${(buffer.length / 1024).toFixed(1)}KB`,
                contentBlocks: [imageBlock]
              };
            }
            case "evaluate": {
              const code = input.code;
              const result = await page.evaluate(code);
              const serialized = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);
              return { content: `Evaluation result:
${serialized}` };
            }
            case "click": {
              const selector = input.selector;
              await page.click(selector);
              return { content: `Clicked element: ${selector}` };
            }
            case "type": {
              const selector = input.selector;
              const text = input.text;
              await page.type(selector, text);
              return { content: `Typed "${text}" into ${selector}` };
            }
            case "select": {
              const selector = input.selector;
              const value = input.text;
              await page.select(selector, value);
              return { content: `Selected "${value}" in ${selector}` };
            }
            case "content": {
              const format = input.format || "text";
              let content;
              if (format === "html") {
                content = await page.content();
              } else {
                content = await page.evaluate("document.body.innerText");
              }
              if (content.length > 5e4) {
                content = content.substring(0, 5e4) + "\n\n[...truncated]";
              }
              return { content };
            }
          }
        } catch (error) {
          const msg = error.message;
          if (msg.includes("Cannot find module") || msg.includes("puppeteer")) {
            return {
              content: "Puppeteer is not installed. Install it with: npm install puppeteer\n\nPuppeteer is an optional dependency for browser automation.",
              isError: true
            };
          }
          return { content: `Browser error: ${msg}`, isError: true };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        return `Browser: ${input.action}${input.url ? ` ${input.url}` : ""}${input.selector ? ` ${input.selector}` : ""}`;
      }
      async getPage() {
        if (browserInstance) {
          const pages = await browserInstance.pages();
          return { page: pages[0] || await browserInstance.newPage(), isNew: false };
        }
        const puppeteer = await import("puppeteer").catch(() => null);
        browserInstance = await (puppeteer.default || puppeteer).launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });
        const cleanup2 = () => {
          if (browserInstance) {
            browserInstance.close().catch(() => {
            });
            browserInstance = null;
          }
        };
        process.on("exit", cleanup2);
        process.on("SIGINT", cleanup2);
        const page = await browserInstance.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        return { page, isNew: true };
      }
    };
  }
});

// src/tools/builtin/open-browser.ts
var OpenBrowserTool;
var init_open_browser = __esm({
  "src/tools/builtin/open-browser.ts"() {
    "use strict";
    init_tool_types();
    OpenBrowserTool = class {
      name = "OpenBrowser";
      description = `Open a browser tab in the editor to show the user a website. Use this when you want to share visual content, documentation, tutorials, or any web page with the user. The browser tab will appear alongside their code files in the editor.

Examples:
- "Let me show you the React documentation" -> OpenBrowser with url: "https://react.dev"
- "Here's the API reference" -> OpenBrowser with url: "https://api.example.com/docs"
- "Check out this demo" -> OpenBrowser with url: "https://demo.example.com"

The tab will open automatically without requiring user permission.`;
      // Safe permission level - opens automatically without user confirmation
      permissionLevel = "safe" /* SAFE */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to open in the browser tab. Must be a valid HTTP or HTTPS URL."
          },
          title: {
            type: "string",
            description: "Optional title for the browser tab (shown in the tab label). If not provided, the domain will be used."
          }
        },
        required: ["url"]
      };
      validate(input) {
        const url = input.url;
        if (!url) {
          return "url is required";
        }
        if (!url.match(/^https?:\/\/.+/i) && !url.match(/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]+/i)) {
          return "url must be a valid HTTP/HTTPS URL or domain";
        }
        return null;
      }
      async execute(input, _context) {
        const url = input.url;
        const title = input.title;
        try {
          const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
          const result = await this.sendOpenBrowserCommand(fullUrl, title);
          if (result.success) {
            return {
              content: `Opened browser tab: ${fullUrl}${title ? ` (${title})` : ""}`,
              metadata: { url: fullUrl, title }
            };
          } else {
            return {
              content: `Failed to open browser tab: ${result.error || "Unknown error"}`,
              isError: true
            };
          }
        } catch (error) {
          return {
            content: `Error opening browser tab: ${error.message}`,
            isError: true
          };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError) {
          return `OpenBrowser: ${result.content}`;
        }
        return `Opened browser: ${input.url}${input.title ? ` (${input.title})` : ""}`;
      }
      async sendOpenBrowserCommand(url, title) {
        const { ipcMain: ipcMain5 } = await import("electron");
        const { BrowserWindow: BrowserWindow8 } = await import("electron");
        const windows = BrowserWindow8.getAllWindows();
        if (windows.length === 0) {
          return { success: false, error: "No browser window available" };
        }
        windows[0].webContents.send("browser:open", { url, title });
        return { success: true };
      }
    };
  }
});

// main/remote-client.ts
var remote_client_exports = {};
__export(remote_client_exports, {
  RemoteClient: () => RemoteClient
});
var http, https, import_node_crypto, import_node_url, RemoteClient;
var init_remote_client = __esm({
  "main/remote-client.ts"() {
    "use strict";
    http = __toESM(require("http"), 1);
    https = __toESM(require("https"), 1);
    import_node_crypto = require("crypto");
    import_node_url = require("url");
    RemoteClient = class {
      baseUrl;
      apiKey;
      agentSseController = null;
      terminalSseControllers = /* @__PURE__ */ new Map();
      constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.apiKey = config.apiKey;
      }
      // -------------------------------------------------------------------------
      // Auth helpers
      // -------------------------------------------------------------------------
      buildAuthHeaders(method, path44) {
        const timestamp = Date.now().toString();
        const signingString = `${method.toUpperCase()}
${path44}
${timestamp}`;
        const signature = (0, import_node_crypto.createHmac)("sha256", this.apiKey).update(signingString).digest("hex");
        return {
          "X-API-Key": this.apiKey,
          "X-Timestamp": timestamp,
          "X-Signature": signature,
          "Content-Type": "application/json"
        };
      }
      buildUrl(path44, params) {
        const url = new import_node_url.URL(path44, this.baseUrl + "/");
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
          }
        }
        return url.toString();
      }
      pathWithQuery(path44, params) {
        if (!params || Object.keys(params).length === 0)
          return path44;
        const sp = new URLSearchParams(params);
        return `${path44}?${sp.toString()}`;
      }
      // -------------------------------------------------------------------------
      // Low-level HTTP fetch
      // -------------------------------------------------------------------------
      async request(method, path44, body, queryParams) {
        const fullPath = this.pathWithQuery(path44, queryParams);
        const headers = this.buildAuthHeaders(method, fullPath);
        const url = this.buildUrl(path44, queryParams);
        const bodyStr = body !== void 0 ? JSON.stringify(body) : void 0;
        if (bodyStr) {
          headers["Content-Length"] = Buffer.byteLength(bodyStr).toString();
        }
        return new Promise((resolve12, reject) => {
          const parsed = new import_node_url.URL(url);
          const options = {
            method,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: parsed.pathname + parsed.search,
            headers
          };
          const transport = parsed.protocol === "https:" ? https : http;
          const req = transport.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              const raw = Buffer.concat(chunks).toString("utf-8");
              if (res.statusCode && res.statusCode >= 400) {
                let message = `HTTP ${res.statusCode}`;
                try {
                  const parsed2 = JSON.parse(raw);
                  message = parsed2.error || parsed2.message || message;
                } catch {
                }
                reject(new Error(message));
                return;
              }
              try {
                resolve12(JSON.parse(raw));
              } catch {
                resolve12(raw);
              }
            });
          });
          req.on("error", reject);
          if (bodyStr)
            req.write(bodyStr);
          req.end();
        });
      }
      // -------------------------------------------------------------------------
      // Connection testing
      // -------------------------------------------------------------------------
      async testConnection() {
        try {
          const statusUrl = `${this.baseUrl}/api/status`;
          await new Promise((resolve12, reject) => {
            const parsed = new import_node_url.URL(statusUrl);
            const transport = parsed.protocol === "https:" ? https : http;
            const req = transport.request(
              { method: "GET", hostname: parsed.hostname, port: parsed.port || (parsed.protocol === "https:" ? 443 : 80), path: parsed.pathname },
              (res) => {
                res.resume();
                if (res.statusCode === 200)
                  resolve12();
                else
                  reject(new Error(`Status endpoint returned ${res.statusCode}`));
              }
            );
            req.on("error", reject);
            req.setTimeout(8e3, () => {
              req.destroy();
              reject(new Error("Connection timed out"));
            });
            req.end();
          });
          const config = await this.request("GET", "/api/config");
          return {
            success: true,
            info: {
              workspacePath: config.workspacePath,
              version: config.version
            }
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // -------------------------------------------------------------------------
      // Agent operations
      // -------------------------------------------------------------------------
      async createConversation(conversationId, model, provider) {
        const result = await this.request("POST", "/api/agent/create-conversation", {
          conversationId,
          model,
          provider
        });
        return result.success ?? false;
      }
      async sendMessage(conversationId, message, workingDirectory, fileReferences, images) {
        await this.request("POST", "/api/agent/send-message", {
          conversationId,
          message,
          workingDirectory,
          fileReferences,
          images
        });
      }
      async abort(conversationId) {
        await this.request("POST", "/api/agent/abort", { conversationId });
      }
      async closeConversation(conversationId) {
        const result = await this.request("POST", "/api/agent/close-conversation", { conversationId });
        return result.success ?? false;
      }
      async hasConversation(conversationId) {
        const result = await this.request("GET", "/api/agent/conversations", void 0, {
          conversationId
        });
        return result.exists ?? false;
      }
      async switchModel(conversationId, model, provider) {
        const result = await this.request("POST", "/api/agent/switch-model", {
          conversationId,
          model,
          provider
        });
        return result.success ?? false;
      }
      async setMode(conversationId, mode) {
        return this.request("POST", "/api/agent/set-mode", {
          conversationId,
          mode
        });
      }
      async respondPermission(toolId, decision) {
        const result = await this.request("POST", "/api/agent/respond-permission", {
          toolId,
          decision
        });
        return result.success ?? false;
      }
      async respondUserInput(requestId, response, cancelled) {
        const result = await this.request("POST", "/api/agent/respond-user-input", {
          requestId,
          response,
          cancelled
        });
        return result.success ?? false;
      }
      async clearConversation(conversationId) {
        await this.request("POST", "/api/agent/close-conversation", { conversationId });
      }
      async getTokenCount(conversationId) {
        const result = await this.request("GET", "/api/agent/conversations", void 0, {
          conversationId
        });
        return result.count ?? 0;
      }
      async restoreHistory(conversationId, messages) {
        const result = await this.request("POST", "/api/agent/create-conversation", {
          conversationId,
          messages
        });
        return result.success ?? false;
      }
      async getModels() {
        const result = await this.request("GET", "/api/models");
        return result.models ?? [];
      }
      async getWorkspaces() {
        const result = await this.request("GET", "/api/workspaces");
        return result.workspaces ?? [];
      }
      // -------------------------------------------------------------------------
      // File operations
      // -------------------------------------------------------------------------
      async readFile(filePath) {
        try {
          const result = await this.request("GET", "/api/files/read", void 0, {
            path: filePath
          });
          return { content: result.content ?? "" };
        } catch (err) {
          return { content: "", error: err.message };
        }
      }
      async writeFile(filePath, content) {
        try {
          const result = await this.request("POST", "/api/files/write", {
            path: filePath,
            content
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async editFile(filePath, oldString, newString) {
        try {
          const result = await this.request("POST", "/api/files/edit", {
            path: filePath,
            oldString,
            newString
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async listFiles(dirPath) {
        try {
          const result = await this.request("GET", "/api/files/list", void 0, {
            path: dirPath
          });
          return { files: result.files ?? [] };
        } catch (err) {
          return { files: [], error: err.message };
        }
      }
      async mkdir(dirPath) {
        try {
          const result = await this.request("POST", "/api/files/mkdir", { path: dirPath });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async deleteFile(filePath) {
        try {
          const result = await this.request("POST", "/api/files/delete", { path: filePath });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async searchContent(projectPath, searchTerm) {
        try {
          const result = await this.request(
            "GET",
            "/api/files/search",
            void 0,
            { path: projectPath, query: searchTerm }
          );
          return { results: result.results ?? [] };
        } catch (err) {
          return { results: [], error: err.message };
        }
      }
      // -------------------------------------------------------------------------
      // Terminal operations
      // -------------------------------------------------------------------------
      async createTerminal(id, cwd, cols, rows) {
        try {
          const result = await this.request("POST", "/api/terminal/create", {
            id,
            cwd,
            cols,
            rows
          });
          return { success: result.success ?? true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      async writeTerminal(id, data) {
        await this.request("POST", "/api/terminal/write", { id, data });
      }
      async resizeTerminal(id, cols, rows) {
        await this.request("POST", "/api/terminal/resize", { id, cols, rows });
      }
      async destroyTerminal(id) {
        await this.request("POST", "/api/terminal/destroy", { id });
      }
      // -------------------------------------------------------------------------
      // SSE: Agent events
      // -------------------------------------------------------------------------
      subscribeAgentEvents(onEvent, conversationId) {
        if (this.agentSseController) {
          this.agentSseController.abort();
        }
        this.agentSseController = new AbortController();
        const { signal } = this.agentSseController;
        const queryParams = {};
        if (conversationId)
          queryParams.conversationId = conversationId;
        const fullPath = this.pathWithQuery("/api/agent/events", Object.keys(queryParams).length ? queryParams : void 0);
        const headers = this.buildAuthHeaders("GET", fullPath);
        headers["Accept"] = "text/event-stream";
        const url = this.buildUrl("/api/agent/events", Object.keys(queryParams).length ? queryParams : void 0);
        this.openSseStream(url, headers, signal, (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.type === "string") {
              onEvent(parsed);
            }
          } catch {
          }
        });
      }
      unsubscribeAgentEvents() {
        if (this.agentSseController) {
          this.agentSseController.abort();
          this.agentSseController = null;
        }
      }
      // -------------------------------------------------------------------------
      // SSE: Terminal stream
      // -------------------------------------------------------------------------
      subscribeTerminalStream(id, onData, onExit) {
        if (this.terminalSseControllers.has(id)) {
          this.terminalSseControllers.get(id).abort();
        }
        const controller = new AbortController();
        this.terminalSseControllers.set(id, controller);
        const { signal } = controller;
        const path44 = `/api/terminal/stream/${encodeURIComponent(id)}`;
        const headers = this.buildAuthHeaders("GET", path44);
        headers["Accept"] = "text/event-stream";
        const url = this.buildUrl(path44);
        this.openSseStream(url, headers, signal, (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "data" && typeof parsed.data === "string") {
              onData(id, parsed.data);
            } else if (parsed.type === "exit") {
              onExit(id);
              this.terminalSseControllers.delete(id);
            }
          } catch {
            if (data)
              onData(id, data);
          }
        });
      }
      unsubscribeTerminalStream(id) {
        const controller = this.terminalSseControllers.get(id);
        if (controller) {
          controller.abort();
          this.terminalSseControllers.delete(id);
        }
      }
      // -------------------------------------------------------------------------
      // Teardown
      // -------------------------------------------------------------------------
      destroy() {
        this.unsubscribeAgentEvents();
        for (const id of this.terminalSseControllers.keys()) {
          this.unsubscribeTerminalStream(id);
        }
      }
      // -------------------------------------------------------------------------
      // Internal SSE reader
      // -------------------------------------------------------------------------
      openSseStream(url, headers, signal, onLine) {
        const parsed = new import_node_url.URL(url);
        const transport = parsed.protocol === "https:" ? https : http;
        const options = {
          method: "GET",
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers
        };
        const connect = () => {
          if (signal.aborted)
            return;
          const req = transport.request(options, (res) => {
            if (signal.aborted) {
              res.destroy();
              return;
            }
            let buffer = "";
            let currentData = "";
            res.setEncoding("utf-8");
            res.on("data", (chunk) => {
              if (signal.aborted)
                return;
              buffer += chunk;
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  currentData = line.slice(6);
                } else if (line === "" && currentData) {
                  if (currentData !== ":keepalive") {
                    onLine(currentData);
                  }
                  currentData = "";
                } else if (line.startsWith(":")) {
                  currentData = "";
                }
              }
            });
            res.on("end", () => {
              if (!signal.aborted) {
                setTimeout(connect, 3e3);
              }
            });
            res.on("error", () => {
              if (!signal.aborted) {
                setTimeout(connect, 5e3);
              }
            });
          });
          req.on("error", () => {
            if (!signal.aborted) {
              setTimeout(connect, 5e3);
            }
          });
          signal.addEventListener("abort", () => req.destroy());
          req.end();
        };
        connect();
      }
    };
  }
});

// main/remote-client-mode.ts
var remote_client_mode_exports = {};
__export(remote_client_mode_exports, {
  remoteClientMode: () => remoteClientMode
});
var import_electron, RemoteClientMode, remoteClientMode;
var init_remote_client_mode = __esm({
  "main/remote-client-mode.ts"() {
    "use strict";
    import_electron = require("electron");
    init_remote_client();
    RemoteClientMode = class {
      client = null;
      connected = false;
      url = null;
      serverInfo = null;
      lastError = null;
      // -------------------------------------------------------------------------
      // Connection lifecycle
      // -------------------------------------------------------------------------
      async connect(url, apiKey) {
        await this.disconnect();
        try {
          const candidate = new RemoteClient({ baseUrl: url, apiKey });
          const test = await candidate.testConnection();
          if (!test.success) {
            return { success: false, error: test.error ?? "Connection failed" };
          }
          this.client = candidate;
          this.connected = true;
          this.url = url;
          this.serverInfo = test.info ?? null;
          this.lastError = null;
          this.client.subscribeAgentEvents((event) => {
            this.broadcastToRenderers("agent:event", event);
          });
          console.log("[RemoteClientMode] Connected to remote server:", url);
          this.broadcastToRenderers("remote-client:status-changed", this.getStatus());
          return { success: true, serverInfo: test.info };
        } catch (err) {
          const message = err.message;
          this.lastError = message;
          console.error("[RemoteClientMode] Connection failed:", message);
          return { success: false, error: message };
        }
      }
      async disconnect() {
        if (this.client) {
          this.client.destroy();
          this.client = null;
        }
        const wasConnected = this.connected;
        this.connected = false;
        this.url = null;
        this.serverInfo = null;
        this.lastError = null;
        if (wasConnected) {
          console.log("[RemoteClientMode] Disconnected from remote server");
          this.broadcastToRenderers("remote-client:status-changed", this.getStatus());
        }
      }
      // -------------------------------------------------------------------------
      // Introspection
      // -------------------------------------------------------------------------
      isActive() {
        return this.connected && this.client !== null;
      }
      getClient() {
        return this.client;
      }
      getStatus() {
        return {
          connected: this.connected,
          url: this.url,
          serverInfo: this.serverInfo,
          error: this.lastError
        };
      }
      // -------------------------------------------------------------------------
      // Terminal stream bridging
      // -------------------------------------------------------------------------
      /**
       * Subscribe to a remote terminal stream and forward data to the renderer.
       * Call this after createTerminal() to start receiving output.
       */
      subscribeTerminalStream(id) {
        if (!this.client)
          return;
        this.client.subscribeTerminalStream(
          id,
          (terminalId, data) => {
            this.broadcastToRenderers("terminal:data", { id: terminalId, data });
          },
          (terminalId) => {
            this.broadcastToRenderers("terminal:exit", { id: terminalId });
          }
        );
      }
      unsubscribeTerminalStream(id) {
        this.client?.unsubscribeTerminalStream(id);
      }
      // -------------------------------------------------------------------------
      // IPC broadcast helper
      // -------------------------------------------------------------------------
      broadcastToRenderers(channel, payload) {
        const windows = import_electron.BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send(channel, payload);
          }
        }
      }
    };
    remoteClientMode = new RemoteClientMode();
  }
});

// main/plan-file-manager.ts
function getPlanFilePath(workspaceRoot) {
  return path24.join(workspaceRoot, OMNICODE_DIR, PLAN_FILE_NAME);
}
async function createPlanFile(workspaceRoot, plan, conversationId) {
  const omnicodeDir = path24.join(workspaceRoot, OMNICODE_DIR);
  await fs24.mkdir(omnicodeDir, { recursive: true });
  const filePath = getPlanFilePath(workspaceRoot);
  const data = {
    version: 1,
    id: (0, import_node_crypto2.randomUUID)(),
    conversationId,
    title: plan.title,
    goal: plan.goal,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    approvedAt: null,
    completedAt: null,
    files: plan.files ?? [],
    steps: plan.steps.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      files: s.files,
      status: "pending",
      startedAt: null,
      completedAt: null
    })),
    risks: plan.risks ?? [],
    questions: plan.questions ?? []
  };
  await fs24.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}
async function readPlanFile(filePath) {
  try {
    const content = await fs24.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
async function updatePlanStep(filePath, stepId, status) {
  const data = await readPlanFile(filePath);
  if (!data)
    return;
  const step = data.steps.find((s) => s.id === stepId);
  if (!step)
    return;
  step.status = status;
  if (status === "in_progress" && !step.startedAt) {
    step.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (status === "completed" || status === "failed") {
    step.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (data.steps.every((s) => s.status === "completed" || s.status === "failed")) {
    data.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  await fs24.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
async function markPlanApproved(filePath) {
  const data = await readPlanFile(filePath);
  if (!data)
    return;
  data.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
  await fs24.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
async function openPlanFile(filePath) {
  await import_electron2.shell.openPath(filePath);
}
function watchPlanFile(filePath, conversationId, onChange) {
  stopWatchingPlanFile(filePath);
  try {
    const watcher = fsSync.watch(filePath, (eventType) => {
      if (eventType !== "change")
        return;
      const existing = debounceTimers.get(filePath);
      if (existing)
        clearTimeout(existing);
      const timer = setTimeout(async () => {
        debounceTimers.delete(filePath);
        const data = await readPlanFile(filePath);
        if (data) {
          onChange(conversationId, data);
        }
      }, 300);
      debounceTimers.set(filePath, timer);
    });
    activeWatchers.set(filePath, watcher);
  } catch (error) {
    console.error("[PlanFileManager] Failed to watch plan file:", error);
  }
}
function stopWatchingPlanFile(filePath) {
  const timer = debounceTimers.get(filePath);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(filePath);
  }
  const watcher = activeWatchers.get(filePath);
  if (watcher) {
    watcher.close();
    activeWatchers.delete(filePath);
  }
}
function stopAllPlanWatchers() {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
  for (const watcher of activeWatchers.values()) {
    watcher.close();
  }
  activeWatchers.clear();
}
var fs24, fsSync, path24, import_node_crypto2, import_electron2, OMNICODE_DIR, PLAN_FILE_NAME, activeWatchers, debounceTimers;
var init_plan_file_manager = __esm({
  "main/plan-file-manager.ts"() {
    "use strict";
    fs24 = __toESM(require("fs/promises"), 1);
    fsSync = __toESM(require("fs"), 1);
    path24 = __toESM(require("path"), 1);
    import_node_crypto2 = require("crypto");
    import_electron2 = require("electron");
    OMNICODE_DIR = ".omnicode";
    PLAN_FILE_NAME = "plan.json";
    activeWatchers = /* @__PURE__ */ new Map();
    debounceTimers = /* @__PURE__ */ new Map();
  }
});

// main/system-sounds.ts
var system_sounds_exports = {};
__export(system_sounds_exports, {
  getOperatingSystem: () => getOperatingSystem,
  getSoundLabel: () => getSoundLabel,
  getSoundSelectOptions: () => getSoundSelectOptions,
  getSystemSounds: () => getSystemSounds,
  isSystemSound: () => isSystemSound,
  playSystemSound: () => playSystemSound
});
function getOperatingSystem() {
  const p = (0, import_os.platform)();
  if (p === "darwin")
    return "macos";
  if (p === "win32")
    return "windows";
  if (p === "linux")
    return "linux";
  return "unknown";
}
function getSystemSounds() {
  const os7 = getOperatingSystem();
  switch (os7) {
    case "macos":
      return MACOS_SOUNDS;
    case "windows":
      return WINDOWS_SOUNDS;
    case "linux":
      return LINUX_SOUNDS;
    default:
      return [
        { id: "default", label: "System Beep (Default)", isSystemSound: true },
        { id: "none", label: "No Sound", isSystemSound: true }
      ];
  }
}
function isSystemSound(soundId) {
  if (soundId === "default" || soundId === "none")
    return true;
  if (soundId.startsWith("macos://") || soundId.startsWith("windows://") || soundId.startsWith("linux://"))
    return true;
  return false;
}
async function playSystemSound(soundId) {
  const os7 = getOperatingSystem();
  if (soundId === "default") {
    import_electron3.shell.beep();
    return true;
  }
  if (soundId === "none") {
    return true;
  }
  try {
    if (os7 === "macos" && soundId.startsWith("macos://")) {
      const soundName = soundId.replace("macos://", "");
      const { exec: exec2 } = await import("child_process");
      const { promisify: promisify3 } = await import("util");
      const execAsync2 = promisify3(exec2);
      const soundPath = `/System/Library/Sounds/${soundName}.aiff`;
      await execAsync2(`afplay "${soundPath}"`);
      return true;
    }
    if (os7 === "windows" && soundId.startsWith("windows://")) {
      const { exec: exec2 } = await import("child_process");
      const { promisify: promisify3 } = await import("util");
      const execAsync2 = promisify3(exec2);
      const soundName = soundId.replace("windows://", "");
      const psCommand = `[System.Media.SystemSounds]::${soundName}.Play(); Start-Sleep -m 500`;
      await execAsync2(`powershell.exe -Command "${psCommand}"`);
      return true;
    }
    if (os7 === "linux" && soundId.startsWith("linux://")) {
      const { exec: exec2 } = await import("child_process");
      const { promisify: promisify3 } = await import("util");
      const execAsync2 = promisify3(exec2);
      const soundName = soundId.replace("linux://", "");
      try {
        await execAsync2(`canberra-gtk-play -i ${soundName}`);
        return true;
      } catch {
        try {
          const searchPaths = [
            `/usr/share/sounds/freedesktop/stereo/${soundName}.oga`,
            `/usr/share/sounds/gnome/default/alerts/${soundName}.ogg`,
            `/usr/share/sounds/deepin/stereo/${soundName}.wav`,
            `/usr/share/sounds/ubuntu/stereo/${soundName}.ogg`
          ];
          for (const path44 of searchPaths) {
            try {
              await execAsync2(`paplay "${path44}"`);
              return true;
            } catch {
              continue;
            }
          }
        } catch {
        }
      }
    }
    return false;
  } catch (error) {
    console.error("[SystemSounds] Failed to play system sound:", error);
    return false;
  }
}
function getSoundLabel(soundId) {
  if (soundId === "default")
    return "System Beep (Default)";
  if (soundId === "none")
    return "No Sound";
  if (!isSystemSound(soundId))
    return "Custom Sound File";
  const sounds = getSystemSounds();
  const sound = sounds.find((s) => s.id === soundId);
  return sound?.label || soundId;
}
function getSoundSelectOptions() {
  const sounds = getSystemSounds();
  const options = sounds.map((sound) => ({
    value: sound.id,
    label: sound.label
  }));
  options.push({ value: "custom", label: "Custom Sound File..." });
  return options;
}
var import_os, import_electron3, MACOS_SOUNDS, WINDOWS_SOUNDS, LINUX_SOUNDS;
var init_system_sounds = __esm({
  "main/system-sounds.ts"() {
    "use strict";
    import_os = require("os");
    import_electron3 = require("electron");
    MACOS_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "macos://Basso", label: "Basso", path: "/System/Library/Sounds/Basso.aiff", isSystemSound: true },
      { id: "macos://Blow", label: "Blow", path: "/System/Library/Sounds/Blow.aiff", isSystemSound: true },
      { id: "macos://Bottle", label: "Bottle", path: "/System/Library/Sounds/Bottle.aiff", isSystemSound: true },
      { id: "macos://Frog", label: "Frog", path: "/System/Library/Sounds/Frog.aiff", isSystemSound: true },
      { id: "macos://Funk", label: "Funk", path: "/System/Library/Sounds/Funk.aiff", isSystemSound: true },
      { id: "macos://Glass", label: "Glass", path: "/System/Library/Sounds/Glass.aiff", isSystemSound: true },
      { id: "macos://Hero", label: "Hero", path: "/System/Library/Sounds/Hero.aiff", isSystemSound: true },
      { id: "macos://Morse", label: "Morse", path: "/System/Library/Sounds/Morse.aiff", isSystemSound: true },
      { id: "macos://Ping", label: "Ping", path: "/System/Library/Sounds/Ping.aiff", isSystemSound: true },
      { id: "macos://Pop", label: "Pop", path: "/System/Library/Sounds/Pop.aiff", isSystemSound: true },
      { id: "macos://Purr", label: "Purr", path: "/System/Library/Sounds/Purr.aiff", isSystemSound: true },
      { id: "macos://Sosumi", label: "Sosumi", path: "/System/Library/Sounds/Sosumi.aiff", isSystemSound: true },
      { id: "macos://Submarine", label: "Submarine", path: "/System/Library/Sounds/Submarine.aiff", isSystemSound: true },
      { id: "macos://Tink", label: "Tink", path: "/System/Library/Sounds/Tink.aiff", isSystemSound: true }
    ];
    WINDOWS_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "windows://asterisk", label: "Asterisk", isSystemSound: true },
      { id: "windows://exclamation", label: "Exclamation", isSystemSound: true },
      { id: "windows://hand", label: "Critical Stop", isSystemSound: true },
      { id: "windows://question", label: "Question", isSystemSound: true },
      { id: "windows://default", label: "Default Beep", isSystemSound: true }
    ];
    LINUX_SOUNDS = [
      { id: "default", label: "System Beep (Default)", isSystemSound: true },
      { id: "none", label: "No Sound", isSystemSound: true },
      { id: "linux://message", label: "Message", isSystemSound: true },
      { id: "linux://dialog-info", label: "Dialog Info", isSystemSound: true },
      { id: "linux://dialog-warning", label: "Dialog Warning", isSystemSound: true },
      { id: "linux://dialog-error", label: "Dialog Error", isSystemSound: true },
      { id: "linux://complete", label: "Complete", isSystemSound: true },
      { id: "linux://attention", label: "Attention", isSystemSound: true }
    ];
  }
});

// main/settings.ts
var settings_exports = {};
__export(settings_exports, {
  cleanupSettingsIpcHandlers: () => cleanupSettingsIpcHandlers,
  defaultSettings: () => defaultSettings,
  getSettingsManager: () => getSettingsManager,
  settingsManager: () => settingsManager,
  setupSettingsIpcHandlers: () => setupSettingsIpcHandlers
});
async function initializeStore() {
  if (Store)
    return Store;
  try {
    const storeModule = await import("electron-store");
    const StoreClass = storeModule.default || storeModule;
    if (typeof StoreClass !== "function") {
      throw new Error(`electron-store export is not a constructor. Got: ${typeof StoreClass}`);
    }
    Store = StoreClass;
    console.log("[Settings] electron-store initialized successfully");
    return Store;
  } catch (error) {
    storeImportError = error;
    console.error("[Settings] Failed to initialize electron-store:", error);
    throw error;
  }
}
async function getSettingsManager() {
  if (settingsManagerInstance) {
    return settingsManagerInstance;
  }
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const manager = new SettingsManager();
      await manager.initialize();
      settingsManagerInstance = manager;
      return manager;
    })();
  }
  return initializationPromise;
}
function setupSettingsIpcHandlers() {
  console.log("[Settings] Setting up IPC handlers...");
  getSettingsManager().then(() => {
    console.log("[Settings] SettingsManager initialized via IPC setup");
  }).catch((error) => {
    console.error("[Settings] Failed to initialize settings manager:", error);
  });
  import_electron4.ipcMain.handle("settings:get", async (_, path44) => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.get(path44), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:getAll", async () => {
    try {
      const manager = await getSettingsManager();
      return { value: manager.getAll(), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:set", async (_, path44, value) => {
    try {
      const manager = await getSettingsManager();
      manager.set(path44, value);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:reset", async (_, path44) => {
    try {
      const manager = await getSettingsManager();
      manager.reset(path44);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:addRecentFolder", async (_, folderPath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentFolder(folderPath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent folder:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:getRecentFolders", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentFolders();
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting recent folders:", error);
      return { value: [], error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:addRecentWorkspace", async (_, workspacePath) => {
    try {
      const manager = await getSettingsManager();
      manager.addRecentWorkspace(workspacePath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error adding recent workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:getRecentWorkspaces", async () => {
    try {
      const manager = await getSettingsManager();
      const value = manager.getRecentWorkspaces();
      console.log("[Settings] Getting recent workspaces:", value);
      return { value, error: null };
    } catch (error) {
      console.error("[Settings] Error getting recent workspaces:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:getSystemSounds", async () => {
    try {
      const { getSoundSelectOptions: getSoundSelectOptions2, getOperatingSystem: getOperatingSystem3 } = await Promise.resolve().then(() => (init_system_sounds(), system_sounds_exports));
      const sounds = getSoundSelectOptions2();
      const os7 = getOperatingSystem3();
      return { value: { sounds, os: os7 }, error: null };
    } catch (error) {
      console.error("[Settings] Error getting system sounds:", error);
      return { value: null, error: error.message };
    }
  });
  import_electron4.ipcMain.handle("settings:playTestSound", async (_, soundId) => {
    try {
      const { playSystemSound: playSystemSound2, isSystemSound: isSystemSound2 } = await Promise.resolve().then(() => (init_system_sounds(), system_sounds_exports));
      const { shell: shell6 } = await import("electron");
      if (isSystemSound2(soundId)) {
        const played = await playSystemSound2(soundId);
        if (!played) {
          shell6.beep();
        }
      } else {
        try {
          const soundPlay = await import("sound-play");
          await soundPlay.play(soundId);
        } catch {
          shell6.beep();
        }
      }
      return { success: true, error: null };
    } catch (error) {
      console.error("[Settings] Error playing test sound:", error);
      return { success: false, error: error.message };
    }
  });
  console.log("[Settings] IPC handlers setup complete");
}
function cleanupSettingsIpcHandlers() {
  import_electron4.ipcMain.removeHandler("settings:get");
  import_electron4.ipcMain.removeHandler("settings:getAll");
  import_electron4.ipcMain.removeHandler("settings:set");
  import_electron4.ipcMain.removeHandler("settings:reset");
  import_electron4.ipcMain.removeHandler("settings:addRecentFolder");
  import_electron4.ipcMain.removeHandler("settings:getRecentFolders");
  import_electron4.ipcMain.removeHandler("settings:addRecentWorkspace");
  import_electron4.ipcMain.removeHandler("settings:getRecentWorkspaces");
  import_electron4.ipcMain.removeHandler("settings:getSystemSounds");
  import_electron4.ipcMain.removeHandler("settings:playTestSound");
}
var import_electron4, Store, storeImportError, defaultSettings, SettingsManager, settingsManagerInstance, initializationPromise, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron4 = require("electron");
    Store = null;
    storeImportError = null;
    defaultSettings = {
      general: {
        theme: "dark",
        fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
        fontSize: 14,
        sidebarVisible: true,
        chatVisible: true,
        windowRestore: "last"
      },
      editor: {
        tabSize: 2,
        wordWrap: "on",
        minimap: true,
        lineNumbers: "on",
        formatOnSave: true,
        autoSave: "off",
        autoSaveDelay: 1e3,
        showWhitespace: false,
        smoothScrolling: true,
        cursorBlinking: "blink"
      },
      ai: {
        activeModels: [],
        // empty = all models available in chat panel
        temperature: 0.7,
        maxContextTokens: 128e3,
        autoRunMode: "always",
        showTokenCosts: true,
        showThinking: true,
        autoAcceptEdits: false,
        contextCompressionThreshold: 0.9,
        contextRecentMessagesToKeep: 6,
        maxTurns: null
      },
      chat: {
        autoSave: true,
        autoSaveIntervalMs: 3e3,
        maxSavedChatsPerWorkspace: 50
      },
      shortcuts: {
        openChat: "CmdOrCtrl+Shift+L",
        toggleSidebar: "CmdOrCtrl+B",
        toggleChat: "CmdOrCtrl+Shift+C",
        sendMessage: "CmdOrCtrl+Enter",
        abortAgent: "Escape",
        acceptAllEdits: "CmdOrCtrl+Shift+A",
        rejectAllEdits: "CmdOrCtrl+Shift+R",
        openSettings: "CmdOrCtrl+,",
        newFile: "CmdOrCtrl+N",
        openFolder: "CmdOrCtrl+O",
        saveFile: "CmdOrCtrl+S",
        formatDocument: "Shift+Alt+F",
        searchFiles: "CmdOrCtrl+Shift+F"
      },
      files: {
        excludePatterns: [
          "node_modules/**",
          ".git/**",
          "dist/**",
          "build/**",
          ".next/**",
          ".cache/**",
          "**/*.log",
          "**/Thumbs.db",
          "**/.DS_Store"
        ],
        defaultWorkspace: null,
        recentFolders: [],
        maxRecentFolders: 10,
        recentWorkspaces: [],
        maxRecentWorkspaces: 10,
        followSymlinks: false
      },
      indexing: {
        autoIndex: true,
        autoSync: true,
        syncIntervalMinutes: 5,
        useSemanticChunking: true,
        maxFilesToIndex: 500,
        maxFileSizeMB: 1,
        excludePatterns: [
          "node_modules/**",
          ".git/**",
          "dist/**",
          "build/**",
          "**/*.min.js",
          "**/*.bundle.js",
          "**/package-lock.json",
          "**/yarn.lock"
        ]
      },
      privacy: {
        telemetryEnabled: false,
        crashReportsEnabled: false,
        analyticsEnabled: false
      },
      apiKeys: {},
      customModels: [],
      usage: {
        monthlyLimit: null,
        alertThresholds: [0.8, 0.95, 1],
        dataRetentionMonths: 12,
        showInStatusBar: true
      },
      notifications: {
        enabled: true,
        soundEnabled: true,
        sound: "default",
        playOnUserInput: true,
        playOnResponseComplete: true,
        showTrayBadge: true
      },
      remoteAccess: {
        enabled: false,
        tunnelProvider: "ngrok",
        ngrokAuthToken: "",
        cloudflaredToken: "",
        apiKey: null,
        port: 3e3,
        allowedOrigins: [],
        rateLimitRequests: 100,
        rateLimitWindowMs: 15 * 60 * 1e3,
        // 15 minutes
        proxyEnabled: true,
        proxyAllowedPorts: []
      },
      remoteClient: {
        url: "",
        apiKey: "",
        autoConnect: false
      },
      adb: {
        enabled: true,
        path: "adb"
      },
      changeReview: {
        enabled: true,
        mode: "all"
      }
    };
    SettingsManager = class {
      store = null;
      listeners = /* @__PURE__ */ new Set();
      initialized = false;
      async initialize() {
        if (this.initialized)
          return;
        try {
          const StoreClass = await initializeStore();
          this.store = new StoreClass({
            projectName: "omni-code",
            defaults: defaultSettings,
            clearInvalidConfig: true
          });
          this.initialized = true;
          console.log("[Settings] SettingsManager initialized successfully");
        } catch (error) {
          console.error("[Settings] Failed to initialize SettingsManager:", error);
          throw error;
        }
      }
      ensureInitialized() {
        if (!this.store || !this.initialized) {
          throw new Error("SettingsManager not initialized. Call initialize() first.");
        }
        return this.store;
      }
      // Get a specific setting by path (e.g., 'general.theme')
      get(path44) {
        return this.ensureInitialized().get(path44);
      }
      // Get all settings
      getAll() {
        return this.ensureInitialized().store;
      }
      // Set a specific setting by path
      set(path44, value) {
        this.ensureInitialized().set(path44, value);
        this.notifyListeners(path44, value);
      }
      // Reset a setting to default (or all if no path provided)
      reset(path44) {
        const store = this.ensureInitialized();
        if (path44) {
          const defaultValue = this.getDefaultValue(path44);
          this.set(path44, defaultValue);
        } else {
          store.clear();
          Object.entries(defaultSettings).forEach(([key, value]) => {
            store.set(key, value);
          });
          this.notifyListeners("*", store.store);
        }
      }
      // Get default value for a path
      getDefaultValue(path44) {
        const parts = path44.split(".");
        let value = defaultSettings;
        for (const part of parts) {
          value = value[part];
        }
        return value;
      }
      // Subscribe to changes
      onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      }
      // Notify all listeners
      notifyListeners(key, value) {
        this.listeners.forEach((listener) => listener(key, value));
      }
      // Add a recent folder (plain directory, not a workspace file)
      addRecentFolder(folderPath) {
        const store = this.ensureInitialized();
        const recent = store.get("files.recentFolders");
        const maxRecent = store.get("files.maxRecentFolders");
        const filtered = recent.filter((f) => f !== folderPath);
        filtered.unshift(folderPath);
        const limited = filtered.slice(0, maxRecent);
        store.set("files.recentFolders", limited);
        console.log("[Settings] Added recent folder:", folderPath);
      }
      // Add a recent workspace
      addRecentWorkspace(workspacePath) {
        const store = this.ensureInitialized();
        const recent = store.get("files.recentWorkspaces");
        const maxRecent = store.get("files.maxRecentWorkspaces");
        const filtered = recent.filter((w) => w !== workspacePath);
        filtered.unshift(workspacePath);
        const limited = filtered.slice(0, maxRecent);
        store.set("files.recentWorkspaces", limited);
        console.log("[Settings] Added recent workspace:", workspacePath);
      }
      // Get recent workspaces (with migration to filter out non-workspace files)
      getRecentWorkspaces() {
        const store = this.ensureInitialized();
        const workspaces = store.get("files.recentWorkspaces");
        const validWorkspaces = workspaces.filter((w) => w.endsWith(".omnicode-workspace"));
        if (validWorkspaces.length !== workspaces.length) {
          store.set("files.recentWorkspaces", validWorkspaces);
          console.log("[Settings] Cleaned up recent workspaces, removed:", workspaces.length - validWorkspaces.length, "invalid entries");
        }
        return validWorkspaces;
      }
      // Get recent folders (with migration to filter out any workspace files that were incorrectly stored)
      getRecentFolders() {
        const store = this.ensureInitialized();
        const folders = store.get("files.recentFolders");
        const validFolders = folders.filter((f) => !f.endsWith(".omnicode-workspace"));
        if (validFolders.length !== folders.length) {
          store.set("files.recentFolders", validFolders);
          console.log("[Settings] Cleaned up recent folders, removed:", folders.length - validFolders.length, "invalid entries");
        }
        return validFolders;
      }
    };
    settingsManagerInstance = null;
    initializationPromise = null;
    syncManagerProxy = {
      get: (path44) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path44);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path44, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path44, value);
      },
      reset: (path44) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path44);
      },
      addRecentFolder: (folderPath) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.addRecentFolder(folderPath);
      },
      getRecentFolders: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getRecentFolders();
      },
      addRecentWorkspace: (workspacePath) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.addRecentWorkspace(workspacePath);
      },
      getRecentWorkspaces: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getRecentWorkspaces();
      },
      onChange: (callback) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.onChange(callback);
      }
    };
    settingsManager = syncManagerProxy;
  }
});

// src/types/workspace.ts
function createWorkspace(options) {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path44, index) => ({
      id: `folder-${index}-${now}`,
      path: path44
    })),
    settings: options.settings || {},
    createdAt: now,
    updatedAt: now
  };
}
function generateWorkspaceId() {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
var WORKSPACE_VERSION, WORKSPACE_FILE_EXTENSION;
var init_workspace = __esm({
  "src/types/workspace.ts"() {
    "use strict";
    WORKSPACE_VERSION = "1.0.0";
    WORKSPACE_FILE_EXTENSION = ".omnicode-workspace";
  }
});

// main/workspace-storage.ts
function getWorkspaceStorage() {
  if (!workspaceStorage) {
    workspaceStorage = new WorkspaceStorage();
  }
  return workspaceStorage;
}
var fs25, path25, import_electron5, WORKSPACES_DIR, WORKSPACE_METADATA_FILE, WorkspaceStorage, workspaceStorage;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path25 = __toESM(require("path"), 1);
    import_electron5 = require("electron");
    init_workspace();
    WORKSPACES_DIR = "workspaces";
    WORKSPACE_METADATA_FILE = "metadata.json";
    WorkspaceStorage = class {
      workspacesDir = null;
      /**
       * Get the workspaces directory in app data
       */
      async getWorkspacesDir() {
        if (this.workspacesDir)
          return this.workspacesDir;
        const userData = import_electron5.app.getPath("userData");
        this.workspacesDir = path25.join(userData, WORKSPACES_DIR);
        await fs25.mkdir(this.workspacesDir, { recursive: true });
        return this.workspacesDir;
      }
      /**
       * Get the storage path for a specific workspace's app data
       */
      async getWorkspaceStoragePath(workspaceId) {
        console.log("[WorkspaceStorage] getWorkspaceStoragePath called for workspaceId:", workspaceId);
        try {
          const workspacesDir = await this.getWorkspacesDir();
          console.log("[WorkspaceStorage] Workspaces directory resolved:", workspacesDir);
          const storagePath = path25.join(workspacesDir, workspaceId);
          console.log("[WorkspaceStorage] Creating storage directory:", storagePath);
          await fs25.mkdir(storagePath, { recursive: true });
          console.log("[WorkspaceStorage] Storage directory created/verified:", storagePath);
          return storagePath;
        } catch (error) {
          console.error("[WorkspaceStorage] getWorkspaceStoragePath FAILED:", {
            workspaceId,
            error: error.message,
            stack: error.stack
          });
          throw error;
        }
      }
      /**
       * Get the metadata file path
       */
      async getMetadataPath() {
        const workspacesDir = await this.getWorkspacesDir();
        return path25.join(workspacesDir, WORKSPACE_METADATA_FILE);
      }
      /**
       * Load all workspace metadata
       */
      async loadMetadata() {
        console.log("[WorkspaceStorage] loadMetadata called");
        try {
          const metadataPath = await this.getMetadataPath();
          console.log("[WorkspaceStorage] Loading metadata from:", metadataPath);
          const content = await fs25.readFile(metadataPath, "utf-8");
          console.log("[WorkspaceStorage] Metadata file read, size:", content.length, "bytes");
          const data = JSON.parse(content);
          const map = new Map(Object.entries(data));
          console.log("[WorkspaceStorage] Metadata parsed successfully, entries:", map.size);
          return map;
        } catch (error) {
          if (error.code === "ENOENT") {
            console.log("[WorkspaceStorage] No metadata file exists yet, returning empty map");
          } else {
            console.error("[WorkspaceStorage] Error loading metadata:", {
              error: error.message,
              code: error.code
            });
          }
          return /* @__PURE__ */ new Map();
        }
      }
      /**
       * Save workspace metadata
       */
      async saveMetadata(metadata) {
        console.log("[WorkspaceStorage] saveMetadata called with", metadata.size, "workspaces");
        try {
          const metadataPath = await this.getMetadataPath();
          console.log("[WorkspaceStorage] Metadata file path:", metadataPath);
          const data = Object.fromEntries(metadata);
          const jsonData = JSON.stringify(data, null, 2);
          console.log("[WorkspaceStorage] Writing metadata JSON, size:", jsonData.length, "bytes");
          await fs25.writeFile(metadataPath, jsonData, "utf-8");
          console.log("[WorkspaceStorage] Metadata saved successfully to:", metadataPath);
        } catch (error) {
          console.error("[WorkspaceStorage] saveMetadata FAILED:", {
            error: error.message,
            stack: error.stack,
            metadataSize: metadata.size
          });
          throw error;
        }
      }
      /**
       * Create a new workspace
       */
      async createWorkspace(options) {
        console.log("[WorkspaceStorage] createWorkspace started:", {
          name: options.name,
          folderCount: options.folders?.length || 0,
          folders: options.folders
        });
        try {
          console.log("[WorkspaceStorage] Creating workspace object...");
          const workspace = createWorkspace(options);
          console.log("[WorkspaceStorage] Workspace object created:", {
            id: workspace.id,
            name: workspace.name,
            version: workspace.version,
            folderCount: workspace.folders.length
          });
          console.log("[WorkspaceStorage] Getting workspace storage path for ID:", workspace.id);
          const storagePath = await this.getWorkspaceStoragePath(workspace.id);
          console.log("[WorkspaceStorage] Storage path created:", storagePath);
          console.log("[WorkspaceStorage] Loading existing metadata...");
          const metadata = await this.loadMetadata();
          console.log("[WorkspaceStorage] Metadata loaded, existing workspaces:", metadata.size);
          const metadataEntry = {
            id: workspace.id,
            lastOpenedAt: Date.now()
          };
          console.log("[WorkspaceStorage] Adding workspace to metadata:", metadataEntry);
          metadata.set(workspace.id, metadataEntry);
          console.log("[WorkspaceStorage] Saving metadata...");
          await this.saveMetadata(metadata);
          console.log("[WorkspaceStorage] Metadata saved successfully");
          console.log("[WorkspaceStorage] createWorkspace completed successfully:", {
            workspaceId: workspace.id,
            name: workspace.name
          });
          return { success: true, workspace };
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[WorkspaceStorage] Failed to create workspace:", {
            error: errorMessage,
            stack: errorStack,
            options: {
              name: options.name,
              folders: options.folders
            }
          });
          return { success: false, error: errorMessage };
        }
      }
      /**
       * Save a workspace to a file
       */
      async saveWorkspaceToFile(workspace, filePath) {
        try {
          let targetPath = filePath;
          if (!targetPath.endsWith(WORKSPACE_FILE_EXTENSION)) {
            targetPath = `${targetPath}${WORKSPACE_FILE_EXTENSION}`;
          }
          const updatedWorkspace = {
            ...workspace,
            updatedAt: Date.now()
          };
          const tempPath = `${targetPath}.tmp`;
          await fs25.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
          await fs25.rename(tempPath, targetPath);
          const metadata = await this.loadMetadata();
          const existing = metadata.get(workspace.id) || { id: workspace.id };
          metadata.set(workspace.id, {
            ...existing,
            filePath: targetPath
          });
          await this.saveMetadata(metadata);
          return { success: true, workspace: updatedWorkspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to save workspace to file:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load a workspace from a file
       */
      async loadWorkspaceFromFile(filePath) {
        try {
          const content = await fs25.readFile(filePath, "utf-8");
          const workspace = JSON.parse(content);
          if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
            return { success: false, error: "Invalid workspace file format" };
          }
          const baseDir = path25.dirname(filePath);
          workspace.folders = workspace.folders.map((folder) => ({
            ...folder,
            path: path25.isAbsolute(folder.path) ? folder.path : path25.resolve(baseDir, folder.path)
          }));
          const metadata = await this.loadMetadata();
          const existing = metadata.get(workspace.id) || { id: workspace.id };
          metadata.set(workspace.id, {
            ...existing,
            filePath,
            lastOpenedAt: Date.now()
          });
          await this.saveMetadata(metadata);
          await this.getWorkspaceStoragePath(workspace.id);
          return { success: true, workspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to load workspace from file:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load a workspace by ID (from app data storage)
       */
      async loadWorkspaceById(workspaceId) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          if (meta.filePath) {
            return this.loadWorkspaceFromFile(meta.filePath);
          }
          return { success: false, error: "Workspace has no saved file" };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to load workspace by ID:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Update an existing workspace
       */
      async updateWorkspace(workspace) {
        try {
          const updatedWorkspace = {
            ...workspace,
            updatedAt: Date.now()
          };
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspace.id);
          if (meta?.filePath) {
            const tempPath = `${meta.filePath}.tmp`;
            await fs25.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
            await fs25.rename(tempPath, meta.filePath);
          }
          metadata.set(workspace.id, {
            ...meta,
            id: workspace.id,
            lastOpenedAt: Date.now()
          });
          await this.saveMetadata(metadata);
          return { success: true, workspace: updatedWorkspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to update workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * List all saved workspaces
       */
      async listWorkspaces() {
        try {
          const metadata = await this.loadMetadata();
          const workspaces = [];
          for (const [id, meta] of metadata) {
            try {
              let workspace;
              if (meta.filePath) {
                const result = await this.loadWorkspaceFromFile(meta.filePath);
                if (result.success && result.workspace) {
                  workspace = result.workspace;
                }
              }
              workspaces.push({
                id,
                name: workspace?.name || "Unknown",
                folderCount: workspace?.folders?.length || 0,
                filePath: meta.filePath,
                lastOpenedAt: meta.lastOpenedAt
              });
            } catch (error) {
              console.warn(`[WorkspaceStorage] Failed to load workspace ${id}:`, error);
              workspaces.push({
                id,
                name: "Unknown",
                folderCount: 0,
                filePath: meta.filePath,
                lastOpenedAt: meta.lastOpenedAt
              });
            }
          }
          workspaces.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
          return { workspaces };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to list workspaces:", error);
          return { workspaces: [], error: error.message };
        }
      }
      /**
       * Delete a workspace
       */
      async deleteWorkspace(workspaceId, deleteData = false) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          if (meta.filePath) {
            try {
              await fs25.unlink(meta.filePath);
            } catch {
            }
          }
          if (deleteData) {
            const storagePath = await this.getWorkspaceStoragePath(workspaceId);
            try {
              await fs25.rm(storagePath, { recursive: true, force: true });
            } catch {
            }
          }
          metadata.delete(workspaceId);
          await this.saveMetadata(metadata);
          return { success: true };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to delete workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Export a workspace with its data (chats, index, etc.)
       */
      async exportWorkspace(workspaceId, targetDir) {
        try {
          const metadata = await this.loadMetadata();
          const meta = metadata.get(workspaceId);
          if (!meta) {
            return { success: false, error: "Workspace not found" };
          }
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return { success: false, error: result.error || "Failed to load workspace" };
          }
          const workspace = result.workspace;
          const exportDir = path25.join(targetDir, `${workspace.name}-workspace`);
          await fs25.mkdir(exportDir, { recursive: true });
          const exportWorkspace = {
            ...workspace,
            folders: workspace.folders.map((f) => ({
              ...f,
              path: path25.relative(exportDir, f.path)
            }))
          };
          const workspaceFilePath = path25.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
          await fs25.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), "utf-8");
          const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
          const targetStoragePath = path25.join(exportDir, "workspace-data");
          try {
            await fs25.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
          } catch {
          }
          metadata.set(workspaceId, {
            ...meta,
            isExported: true
          });
          await this.saveMetadata(metadata);
          return { success: true, filePath: workspaceFilePath };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to export workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Import a workspace from an exported directory
       */
      async importWorkspace(sourceDir) {
        try {
          const entries = await fs25.readdir(sourceDir, { withFileTypes: true });
          const workspaceFile = entries.find(
            (e) => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
          );
          if (!workspaceFile) {
            return { success: false, error: "No workspace file found in source directory" };
          }
          const workspaceFilePath = path25.join(sourceDir, workspaceFile.name);
          const result = await this.loadWorkspaceFromFile(workspaceFilePath);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const sourceDataPath = path25.join(sourceDir, "workspace-data");
          try {
            await fs25.access(sourceDataPath);
            const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
            await fs25.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
          } catch {
          }
          return { success: true, workspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to import workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Add a folder to a workspace
       */
      async addFolderToWorkspace(workspaceId, folderPath, folderName) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const exists = workspace.folders.some((f) => f.path === folderPath);
          if (exists) {
            return { success: false, error: "Folder already in workspace" };
          }
          const newFolder = {
            id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: folderPath,
            name: folderName || path25.basename(folderPath)
          };
          workspace.folders.push(newFolder);
          return this.updateWorkspace(workspace);
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to add folder to workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Remove a folder from a workspace
       */
      async removeFolderFromWorkspace(workspaceId, folderId) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          workspace.folders = workspace.folders.filter((f) => f.id !== folderId);
          return this.updateWorkspace(workspace);
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to remove folder from workspace:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Rename a workspace
       */
      async renameWorkspace(workspaceId, newName) {
        try {
          const result = await this.loadWorkspaceById(workspaceId);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          workspace.name = newName;
          const updateResult = await this.updateWorkspace(workspace);
          if (updateResult.success) {
            const metadata = await this.loadMetadata();
            const meta = metadata.get(workspaceId);
            if (meta?.filePath) {
              const oldPath = meta.filePath;
              const dir = path25.dirname(oldPath);
              const newPath = path25.join(dir, `${newName}${WORKSPACE_FILE_EXTENSION}`);
              try {
                await fs25.rename(oldPath, newPath);
                metadata.set(workspaceId, {
                  ...meta,
                  filePath: newPath
                });
                await this.saveMetadata(metadata);
              } catch {
              }
            }
          }
          return updateResult;
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to rename workspace:", error);
          return { success: false, error: error.message };
        }
      }
    };
    workspaceStorage = null;
  }
});

// main/shared-workspace-manager.ts
var shared_workspace_manager_exports = {};
__export(shared_workspace_manager_exports, {
  SharedWorkspaceManager: () => SharedWorkspaceManager,
  getSharedWorkspaceManager: () => getSharedWorkspaceManager,
  initializeSharedWorkspaceManager: () => initializeSharedWorkspaceManager
});
function getSharedWorkspaceManager() {
  if (!sharedWorkspaceManager) {
    sharedWorkspaceManager = new SharedWorkspaceManager();
  }
  return sharedWorkspaceManager;
}
async function initializeSharedWorkspaceManager() {
  const manager = getSharedWorkspaceManager();
  await manager.initialize();
}
var fs26, path26, SHARED_WORKSPACES_KEY, ACTIVE_WORKSPACE_KEY, SharedWorkspaceManager, sharedWorkspaceManager;
var init_shared_workspace_manager = __esm({
  "main/shared-workspace-manager.ts"() {
    "use strict";
    fs26 = __toESM(require("fs/promises"), 1);
    path26 = __toESM(require("path"), 1);
    init_settings();
    init_workspace_storage();
    SHARED_WORKSPACES_KEY = "remoteAccess.sharedWorkspaces";
    ACTIVE_WORKSPACE_KEY = "remoteAccess.activeWorkspaceId";
    SharedWorkspaceManager = class {
      workspaceStorage;
      sharedWorkspaces = [];
      activeWorkspaceId = null;
      initialized = false;
      constructor() {
        this.workspaceStorage = new WorkspaceStorage();
      }
      /**
       * Initialize the manager - load shared workspaces from settings
       */
      async initialize() {
        if (this.initialized)
          return;
        try {
          const shared = settingsManager.get(SHARED_WORKSPACES_KEY);
          const active = settingsManager.get(ACTIVE_WORKSPACE_KEY);
          if (shared && Array.isArray(shared)) {
            const validWorkspaces = [];
            for (const ws of shared) {
              try {
                await fs26.access(ws.filePath);
                if (!ws.isSingleFolder && ws.filePath.endsWith(".omnicode-workspace")) {
                  try {
                    const content = await fs26.readFile(ws.filePath, "utf-8");
                    const workspace = JSON.parse(content);
                    if (workspace.folders && workspace.folders.length > 0) {
                      const oldFolderCount = ws.folderCount;
                      ws.folders = workspace.folders.map((f) => ({
                        id: f.id,
                        path: f.path,
                        name: f.name || path26.basename(f.path)
                      }));
                      ws.folderCount = workspace.folders.length;
                      ws.name = workspace.name;
                      if (oldFolderCount !== ws.folderCount) {
                        console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}": ${oldFolderCount} -> ${ws.folderCount} folders`);
                      }
                    }
                  } catch (readError) {
                    console.error(`[SharedWorkspaceManager] Failed to refresh workspace file ${ws.filePath}:`, readError);
                  }
                } else if (ws.isSingleFolder) {
                  try {
                    const stats = await fs26.stat(ws.filePath);
                    if (!stats.isDirectory()) {
                      console.log(`[SharedWorkspaceManager] Skipping non-directory: ${ws.filePath}`);
                      continue;
                    }
                    if (ws.folders.length === 0) {
                      ws.folders = [{
                        id: `folder-${Date.now()}`,
                        path: ws.filePath,
                        name: ws.name || path26.basename(ws.filePath)
                      }];
                      ws.folderCount = 1;
                    }
                  } catch {
                    console.log(`[SharedWorkspaceManager] Skipping inaccessible folder: ${ws.filePath}`);
                    continue;
                  }
                }
                validWorkspaces.push(ws);
              } catch {
                console.log(`[SharedWorkspaceManager] Skipping missing workspace: ${ws.filePath}`);
              }
            }
            this.sharedWorkspaces = validWorkspaces;
            if (this.sharedWorkspaces.length > 0) {
              await this.saveToSettings();
            }
          }
          if (active && this.sharedWorkspaces.some((ws) => ws.sharedId === active)) {
            this.activeWorkspaceId = active;
          } else if (this.sharedWorkspaces.length > 0) {
            this.activeWorkspaceId = this.sharedWorkspaces[0].sharedId;
            this.sharedWorkspaces[0].isActive = true;
          }
          this.initialized = true;
          console.log(`[SharedWorkspaceManager] Initialized with ${this.sharedWorkspaces.length} shared workspaces`);
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to initialize:", error);
          this.sharedWorkspaces = [];
          this.activeWorkspaceId = null;
          this.initialized = true;
        }
      }
      /**
       * Get all shared workspaces
       */
      getSharedWorkspaces() {
        return [...this.sharedWorkspaces];
      }
      /**
       * Refresh a specific workspace from disk
       */
      async refreshWorkspaceFromDisk(sharedId) {
        const ws = this.sharedWorkspaces.find((w) => w.sharedId === sharedId);
        if (!ws) {
          console.log(`[SharedWorkspaceManager] Workspace not found for refresh: ${sharedId}`);
          return false;
        }
        try {
          if (!ws.isSingleFolder && ws.filePath.endsWith(".omnicode-workspace")) {
            const content = await fs26.readFile(ws.filePath, "utf-8");
            const workspace = JSON.parse(content);
            if (workspace.folders) {
              const oldFolderCount = ws.folderCount;
              ws.folders = workspace.folders.map((f) => ({
                id: f.id,
                path: f.path,
                name: f.name || path26.basename(f.path)
              }));
              ws.folderCount = workspace.folders.length;
              ws.name = workspace.name;
              await this.saveToSettings();
              console.log(`[SharedWorkspaceManager] Refreshed workspace "${ws.name}" from disk: ${oldFolderCount} -> ${ws.folderCount} folders`);
              return true;
            }
          } else if (ws.isSingleFolder) {
            const stats = await fs26.stat(ws.filePath);
            if (stats.isDirectory()) {
              if (ws.folders.length === 0) {
                ws.folders = [{
                  id: `folder-${Date.now()}`,
                  path: ws.filePath,
                  name: ws.name || path26.basename(ws.filePath)
                }];
                ws.folderCount = 1;
                await this.saveToSettings();
              }
              return true;
            }
          }
        } catch (error) {
          console.error(`[SharedWorkspaceManager] Failed to refresh workspace ${sharedId}:`, error);
        }
        return false;
      }
      /**
       * Get the currently active shared workspace
       */
      getActiveWorkspace() {
        if (!this.activeWorkspaceId)
          return null;
        return this.sharedWorkspaces.find((ws) => ws.sharedId === this.activeWorkspaceId) || null;
      }
      /**
       * Get the active workspace's working directory (first folder)
       */
      getActiveWorkingDirectory() {
        const active = this.getActiveWorkspace();
        if (!active || active.folders.length === 0)
          return null;
        return active.folders[0].path;
      }
      /**
       * Set the active workspace by ID
       */
      setActiveWorkspace(sharedId) {
        const workspace = this.sharedWorkspaces.find((ws) => ws.sharedId === sharedId);
        if (!workspace) {
          console.warn(`[SharedWorkspaceManager] Workspace not found: ${sharedId}`);
          return false;
        }
        for (const ws of this.sharedWorkspaces) {
          ws.isActive = ws.sharedId === sharedId;
        }
        this.activeWorkspaceId = sharedId;
        this.saveToSettings();
        console.log(`[SharedWorkspaceManager] Activated workspace: ${workspace.name}`);
        return true;
      }
      /**
       * Add a workspace file to the shared list
       */
      async addWorkspaceFile(workspaceFilePath) {
        console.log("[SharedWorkspaceManager] addWorkspaceFile called:", workspaceFilePath);
        try {
          console.log("[SharedWorkspaceManager] Checking if file exists and is accessible...");
          await fs26.access(workspaceFilePath);
          console.log("[SharedWorkspaceManager] File exists and is accessible");
          if (!workspaceFilePath.endsWith(".omnicode-workspace")) {
            console.error("[SharedWorkspaceManager] Invalid file extension:", workspaceFilePath);
            throw new Error("Not a valid workspace file");
          }
          console.log("[SharedWorkspaceManager] File extension validated (.omnicode-workspace)");
          console.log("[SharedWorkspaceManager] Checking if workspace is already shared...");
          const existing = this.sharedWorkspaces.find((ws) => ws.filePath === workspaceFilePath);
          if (existing) {
            console.log(`[SharedWorkspaceManager] Workspace already shared: ${workspaceFilePath}`);
            return existing;
          }
          console.log("[SharedWorkspaceManager] Workspace not previously shared, proceeding...");
          console.log("[SharedWorkspaceManager] Reading workspace file...");
          const content = await fs26.readFile(workspaceFilePath, "utf-8");
          console.log("[SharedWorkspaceManager] Workspace file read, size:", content.length, "bytes");
          console.log("[SharedWorkspaceManager] Parsing workspace JSON...");
          const workspace = JSON.parse(content);
          console.log("[SharedWorkspaceManager] Workspace parsed:", {
            id: workspace.id,
            name: workspace.name,
            version: workspace.version,
            folderCount: workspace.folders?.length || 0
          });
          console.log("[SharedWorkspaceManager] Creating shared workspace entry...");
          const sharedWorkspace = {
            sharedId: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: workspace.id,
            filePath: workspaceFilePath,
            name: workspace.name,
            folderCount: workspace.folders.length,
            folders: workspace.folders.map((f) => ({
              id: f.id,
              path: f.path,
              name: f.name || path26.basename(f.path)
            })),
            isActive: this.sharedWorkspaces.length === 0,
            // First one is active by default
            addedAt: Date.now(),
            isSingleFolder: false
          };
          console.log("[SharedWorkspaceManager] Shared workspace entry created:", {
            sharedId: sharedWorkspace.sharedId,
            workspaceId: sharedWorkspace.workspaceId,
            name: sharedWorkspace.name
          });
          this.sharedWorkspaces.push(sharedWorkspace);
          console.log("[SharedWorkspaceManager] Workspace added to shared list, total count:", this.sharedWorkspaces.length);
          if (this.sharedWorkspaces.length === 1) {
            this.activeWorkspaceId = sharedWorkspace.sharedId;
            console.log("[SharedWorkspaceManager] First workspace, set as active:", sharedWorkspace.sharedId);
          }
          console.log("[SharedWorkspaceManager] Saving to settings...");
          await this.saveToSettings();
          console.log("[SharedWorkspaceManager] Settings saved successfully");
          console.log(`[SharedWorkspaceManager] addWorkspaceFile completed successfully: ${sharedWorkspace.name}`);
          return sharedWorkspace;
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[SharedWorkspaceManager] addWorkspaceFile FAILED:", {
            error: errorMessage,
            stack: errorStack,
            workspaceFilePath
          });
          return null;
        }
      }
      /**
       * Add a single folder as a workspace (for folder-only mode)
       */
      async addFolder(folderPath, name) {
        try {
          const stats = await fs26.stat(folderPath);
          if (!stats.isDirectory()) {
            throw new Error("Path is not a directory");
          }
          const existing = this.sharedWorkspaces.find(
            (ws) => ws.isSingleFolder && ws.filePath === folderPath
          );
          if (existing) {
            if (name && name.trim() && name.trim() !== existing.name) {
              const newName = name.trim();
              existing.name = newName;
              existing.folders[0].name = newName;
              await this.saveToSettings();
              console.log(`[SharedWorkspaceManager] Updated folder name: ${existing.name} -> ${newName}`);
            } else {
              console.log(`[SharedWorkspaceManager] Folder already shared: ${folderPath}`);
            }
            return existing;
          }
          const folderName = name || path26.basename(folderPath);
          const sharedWorkspace = {
            sharedId: `shared-folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: `folder-${Date.now()}`,
            filePath: folderPath,
            name: folderName,
            folderCount: 1,
            folders: [{
              id: `folder-${Date.now()}`,
              path: folderPath,
              name: folderName
            }],
            isActive: this.sharedWorkspaces.length === 0,
            addedAt: Date.now(),
            isSingleFolder: true
          };
          this.sharedWorkspaces.push(sharedWorkspace);
          if (this.sharedWorkspaces.length === 1) {
            this.activeWorkspaceId = sharedWorkspace.sharedId;
          }
          await this.saveToSettings();
          console.log(`[SharedWorkspaceManager] Added folder: ${sharedWorkspace.name}`);
          return sharedWorkspace;
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to add folder:", error);
          return null;
        }
      }
      /**
       * Create a new multi-folder workspace, persist it to a file, and add it to the shared list.
       */
      async createWorkspaceFromFolders(name, folderPaths) {
        console.log("[SharedWorkspaceManager] createWorkspaceFromFolders started:", {
          name,
          folderCount: folderPaths.length,
          folderPaths
        });
        try {
          console.log("[SharedWorkspaceManager] Step 1: Creating workspace via WorkspaceStorage...");
          const createResult = await this.workspaceStorage.createWorkspace({ name, folders: folderPaths });
          if (!createResult.success || !createResult.workspace) {
            console.error("[SharedWorkspaceManager] Step 1 FAILED: WorkspaceStorage.createWorkspace failed:", {
              success: createResult.success,
              error: createResult.error,
              hasWorkspace: !!createResult.workspace
            });
            return null;
          }
          const workspace = createResult.workspace;
          console.log("[SharedWorkspaceManager] Step 1 SUCCESS: Workspace created:", {
            workspaceId: workspace.id,
            name: workspace.name,
            folderCount: workspace.folders.length
          });
          console.log("[SharedWorkspaceManager] Step 2: Getting storage path for workspace ID:", workspace.id);
          const storageDir = await this.workspaceStorage.getWorkspaceStoragePath(workspace.id);
          console.log("[SharedWorkspaceManager] Step 2 SUCCESS: App storage directory:", storageDir);
          await Promise.all(
            folderPaths.map((fp) => fs26.mkdir(path26.join(fp, ".omnicode"), { recursive: true }).catch((e) => {
              console.warn(`[SharedWorkspaceManager] Could not create .omnicode in ${fp}:`, e.message);
            }))
          );
          const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
          const filePath = path26.join(storageDir, `${safeName}.omnicode-workspace`);
          console.log("[SharedWorkspaceManager] Step 4 prepared file path:", { safeName, filePath });
          console.log("[SharedWorkspaceManager] Step 5: Saving workspace to file...");
          const saveResult = await this.workspaceStorage.saveWorkspaceToFile(workspace, filePath);
          if (!saveResult.success) {
            console.error("[SharedWorkspaceManager] Step 5 FAILED: saveWorkspaceToFile failed:", {
              error: saveResult.error,
              filePath
            });
            return null;
          }
          console.log("[SharedWorkspaceManager] Step 5 SUCCESS: Workspace file saved");
          console.log("[SharedWorkspaceManager] Step 6: Adding workspace file to shared list...");
          const sharedWorkspace = await this.addWorkspaceFile(filePath);
          if (!sharedWorkspace) {
            console.error("[SharedWorkspaceManager] Step 6 FAILED: addWorkspaceFile returned null for path:", filePath);
            return null;
          }
          console.log("[SharedWorkspaceManager] createWorkspaceFromFolders completed successfully:", {
            sharedId: sharedWorkspace.sharedId,
            workspaceId: sharedWorkspace.workspaceId,
            name: sharedWorkspace.name,
            folderCount: sharedWorkspace.folderCount
          });
          return sharedWorkspace;
        } catch (error) {
          const errorMessage = error.message;
          const errorStack = error.stack;
          console.error("[SharedWorkspaceManager] createWorkspaceFromFolders EXCEPTION:", {
            error: errorMessage,
            stack: errorStack,
            name,
            folderPaths
          });
          return null;
        }
      }
      /**
       * Remove a workspace from the shared list
       */
      async removeWorkspace(sharedId) {
        const index = this.sharedWorkspaces.findIndex((ws) => ws.sharedId === sharedId);
        if (index === -1)
          return false;
        const removed = this.sharedWorkspaces.splice(index, 1)[0];
        if (this.activeWorkspaceId === sharedId) {
          this.activeWorkspaceId = this.sharedWorkspaces.length > 0 ? this.sharedWorkspaces[0].sharedId : null;
          if (this.activeWorkspaceId) {
            const newActive = this.sharedWorkspaces.find((ws) => ws.sharedId === this.activeWorkspaceId);
            if (newActive)
              newActive.isActive = true;
          }
        }
        await this.saveToSettings();
        console.log(`[SharedWorkspaceManager] Removed workspace: ${removed.name}`);
        return true;
      }
      /**
       * Get details for a specific shared workspace
       */
      getWorkspaceById(sharedId) {
        return this.sharedWorkspaces.find((ws) => ws.sharedId === sharedId) || null;
      }
      /**
       * Get the working directory (first folder path) for a specific shared workspace.
       * Returns null if the workspace is not found or has no folders.
       */
      getWorkingDirectory(sharedId) {
        const workspace = this.getWorkspaceById(sharedId);
        if (!workspace || workspace.folders.length === 0)
          return null;
        return workspace.folders[0].path;
      }
      /**
       * Sync all registered workspaces from WorkspaceStorage into the shared list.
       * Any workspace that already exists (matched by workspaceId) is skipped.
       * Newly added workspaces that have no filePath (legacy entries) are skipped.
       * After syncing, ensures at least one workspace is marked active.
       */
      async syncAllWorkspaces() {
        try {
          const result = await this.workspaceStorage.listWorkspaces();
          if (result.error) {
            console.warn("[SharedWorkspaceManager] syncAllWorkspaces: WorkspaceStorage error:", result.error);
          }
          const summaries = result.workspaces ?? [];
          let added = 0;
          for (const summary of summaries) {
            const alreadyShared = this.sharedWorkspaces.some(
              (sw) => sw.workspaceId === summary.id
            );
            if (alreadyShared)
              continue;
            if (!summary.filePath)
              continue;
            const newEntry = await this.addWorkspaceFile(summary.filePath);
            if (newEntry) {
              added++;
            }
          }
          if (!this.activeWorkspaceId && this.sharedWorkspaces.length > 0) {
            const first = this.sharedWorkspaces[0];
            this.activeWorkspaceId = first.sharedId;
            first.isActive = true;
            await this.saveToSettings();
          }
          console.log(`[SharedWorkspaceManager] syncAllWorkspaces complete: added ${added}, total ${this.sharedWorkspaces.length}`);
        } catch (error) {
          console.error("[SharedWorkspaceManager] syncAllWorkspaces failed:", error);
        }
      }
      /**
       * Get folders for a specific workspace
       */
      getWorkspaceFolders(sharedId) {
        const workspace = this.getWorkspaceById(sharedId);
        return workspace?.folders || [];
      }
      /**
       * Set the active folder within a workspace (for navigation)
       */
      setActiveFolder(sharedId, folderId) {
        const workspace = this.getWorkspaceById(sharedId);
        if (!workspace)
          return false;
        const folder = workspace.folders.find((f) => f.id === folderId);
        if (!folder)
          return false;
        console.log(`[SharedWorkspaceManager] Set active folder for ${workspace.name}: ${folder.name}`);
        return true;
      }
      /**
       * Save current state to settings
       */
      async saveToSettings() {
        try {
          settingsManager.set(SHARED_WORKSPACES_KEY, this.sharedWorkspaces);
          settingsManager.set(ACTIVE_WORKSPACE_KEY, this.activeWorkspaceId);
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to save settings:", error);
        }
      }
      /**
       * Clear all shared workspaces
       */
      async clearAll() {
        this.sharedWorkspaces = [];
        this.activeWorkspaceId = null;
        await this.saveToSettings();
        console.log("[SharedWorkspaceManager] Cleared all shared workspaces");
      }
    };
    sharedWorkspaceManager = null;
  }
});

// main/chat-storage.ts
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
var fs27, path27, STORAGE_VERSION, CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path27 = __toESM(require("path"), 1);
    STORAGE_VERSION = "1.0.0";
    CHATS_DIR = ".omnicode/chats";
    MAX_CHATS_PER_WORKSPACE = 50;
    ChatStorage = class {
      ensureChatsDir(workspacePath) {
        const chatsDir = path27.join(workspacePath, CHATS_DIR);
        return chatsDir;
      }
      /**
       * Save a conversation to disk
       */
      async saveConversation(workspacePath, conversation) {
        try {
          if (!workspacePath) {
            return { success: false, error: "No workspace path provided" };
          }
          const chatsDir = await this.ensureChatsDir(workspacePath);
          await fs27.mkdir(chatsDir, { recursive: true });
          const pendingPreviews = conversation.pendingChangePreviews;
          const serializedPreviews = pendingPreviews instanceof Map ? Array.from(pendingPreviews.entries()) : pendingPreviews;
          const serialized = {
            version: STORAGE_VERSION,
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages,
            toolCalls: conversation.toolCalls,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.messages.length,
            model: conversation.model,
            provider: conversation.provider,
            contextTokens: conversation.contextTokens,
            maxContextTokens: conversation.maxContextTokens,
            mode: conversation.mode,
            planningApproach: conversation.planningApproach,
            pendingPlan: conversation.pendingPlan ?? void 0,
            planFilePath: conversation.planFilePath ?? void 0,
            pendingChangePreviews: serializedPreviews
          };
          const filePath = path27.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs27.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          await fs27.rename(tempPath, filePath);
          return { success: true };
        } catch (error) {
          console.error("[ChatStorage] Failed to save conversation:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load all conversations from a workspace
       */
      async loadConversations(workspacePath) {
        try {
          if (!workspacePath) {
            return { conversations: [] };
          }
          const chatsDir = path27.join(workspacePath, CHATS_DIR);
          try {
            await fs27.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs27.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path27.join(chatsDir, file.name);
              const content = await fs27.readFile(filePath, "utf-8");
              const serialized = JSON.parse(content);
              const migrated = this.migrateIfNeeded(serialized);
              const pendingChangePreviews = migrated.pendingChangePreviews ? new Map(migrated.pendingChangePreviews) : /* @__PURE__ */ new Map();
              const loadedConv = {
                id: migrated.id,
                title: migrated.title,
                messages: migrated.messages,
                toolCalls: migrated.toolCalls,
                createdAt: migrated.createdAt,
                updatedAt: migrated.updatedAt,
                model: migrated.model,
                provider: migrated.provider,
                contextTokens: migrated.contextTokens,
                maxContextTokens: migrated.maxContextTokens,
                mode: migrated.mode,
                planningApproach: migrated.planningApproach,
                pendingPlan: migrated.pendingPlan ?? null,
                planFilePath: migrated.planFilePath ?? null,
                pendingChangePreviews,
                // Reset runtime state
                isProcessing: false,
                streamingContent: "",
                orchestrationStatus: null
              };
              conversations.push(loadedConv);
            } catch (error) {
              console.error(`[ChatStorage] Failed to load conversation ${file.name}:`, error);
            }
          }
          conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          return { conversations };
        } catch (error) {
          console.error("[ChatStorage] Failed to load conversations:", error);
          return { conversations: [], error: error.message };
        }
      }
      /**
       * Delete a conversation from disk
       */
      async deleteConversation(workspacePath, conversationId) {
        try {
          if (!workspacePath) {
            return { success: false, error: "No workspace path provided" };
          }
          const chatsDir = path27.join(workspacePath, CHATS_DIR);
          const filePath = path27.join(chatsDir, `${conversationId}.json`);
          await fs27.unlink(filePath);
          return { success: true };
        } catch (error) {
          if (error.code === "ENOENT") {
            return { success: true };
          }
          console.error("[ChatStorage] Failed to delete conversation:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * List all saved conversation IDs and metadata
       */
      async listConversations(workspacePath) {
        try {
          if (!workspacePath) {
            return { conversations: [] };
          }
          const chatsDir = path27.join(workspacePath, CHATS_DIR);
          try {
            await fs27.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs27.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path27.join(chatsDir, file.name);
              const content = await fs27.readFile(filePath, "utf-8");
              const serialized = JSON.parse(content);
              conversations.push({
                id: serialized.id,
                title: serialized.title,
                updatedAt: serialized.updatedAt,
                messageCount: serialized.messageCount
              });
            } catch {
            }
          }
          conversations.sort((a, b) => b.updatedAt - a.updatedAt);
          return { conversations };
        } catch (error) {
          console.error("[ChatStorage] Failed to list conversations:", error);
          return { conversations: [], error: error.message };
        }
      }
      /**
       * Clean up old conversations if exceeding the limit
       */
      async cleanupOldConversations(workspacePath, maxChats = MAX_CHATS_PER_WORKSPACE) {
        try {
          const { conversations } = await this.listConversations(workspacePath);
          if (conversations.length <= maxChats) {
            return { deleted: 0 };
          }
          const toDelete = conversations.slice(maxChats);
          let deleted = 0;
          for (const conv of toDelete) {
            const result = await this.deleteConversation(workspacePath, conv.id);
            if (result.success) {
              deleted++;
            }
          }
          return { deleted };
        } catch (error) {
          console.error("[ChatStorage] Failed to cleanup conversations:", error);
          return { deleted: 0, error: error.message };
        }
      }
      /**
       * Handle version migration of stored conversations
       */
      migrateIfNeeded(serialized) {
        const currentVersion = serialized.version || "0.0.0";
        return serialized;
      }
    };
    chatStorage = null;
  }
});

// src/core/usage-types.ts
var USAGE_DATA_VERSION, DEFAULT_RETENTION_MONTHS;
var init_usage_types = __esm({
  "src/core/usage-types.ts"() {
    "use strict";
    USAGE_DATA_VERSION = "1.0.0";
    DEFAULT_RETENTION_MONTHS = 12;
  }
});

// main/usage-storage.ts
async function getStore() {
  if (Store2)
    return Store2;
  const storeModule = await import("electron-store");
  Store2 = storeModule.default || storeModule;
  return Store2;
}
async function getUsageStorage() {
  if (!usageStorage) {
    usageStorage = new UsageStorage();
    await usageStorage.initialize();
  }
  return usageStorage;
}
var fs28, path28, Store2, USAGE_DIR, USAGE_FILE, UsageStorage, usageStorage;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs28 = __toESM(require("fs/promises"), 1);
    path28 = __toESM(require("path"), 1);
    init_usage_types();
    Store2 = null;
    USAGE_DIR = ".omnicode";
    USAGE_FILE = "usage.json";
    UsageStorage = class {
      globalStore = null;
      initialized = false;
      async initialize() {
        if (this.initialized)
          return;
        try {
          const StoreClass = await getStore();
          this.globalStore = new StoreClass({
            projectName: "omni-code",
            name: "usage",
            defaults: {
              usage: {
                version: USAGE_DATA_VERSION,
                monthly: [],
                allTimeTotal: 0,
                lastUpdated: Date.now()
              },
              monthlyLimits: {}
            }
          });
          this.initialized = true;
        } catch (error) {
          console.error("[UsageStorage] Failed to initialize:", error);
          throw error;
        }
      }
      ensureInitialized() {
        if (!this.globalStore || !this.initialized) {
          throw new Error("UsageStorage not initialized");
        }
        return this.globalStore;
      }
      /**
       * Get workspace usage file path
       */
      getWorkspaceUsagePath(workspacePath) {
        return path28.join(workspacePath, USAGE_DIR, USAGE_FILE);
      }
      /**
       * Ensure usage directory exists
       */
      async ensureUsageDir(workspacePath) {
        const usageDir = path28.join(workspacePath, USAGE_DIR);
        await fs28.mkdir(usageDir, { recursive: true });
      }
      /**
       * Record usage to both global and workspace storage
       */
      async recordUsage(record, workspacePath) {
        try {
          this.updateGlobalUsage(record);
          if (workspacePath) {
            await this.updateWorkspaceUsage(record, workspacePath);
          }
          return { success: true };
        } catch (error) {
          console.error("[UsageStorage] Failed to record usage:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Update global usage store
       */
      updateGlobalUsage(record) {
        const store = this.ensureInitialized();
        const usage = store.get("usage");
        const month = this.formatMonth(new Date(record.timestamp));
        let monthData = usage.monthly.find((m) => m.month === month);
        if (!monthData) {
          monthData = {
            month,
            days: [],
            totalCost: 0,
            limit: store.get("monthlyLimits")[month],
            alertedAt: []
          };
          usage.monthly.push(monthData);
        }
        const date = this.formatDate(new Date(record.timestamp));
        let day = monthData.days.find((d) => d.date === date);
        if (!day) {
          day = {
            date,
            records: [],
            totalCost: 0,
            byModel: {},
            byProvider: {}
          };
          monthData.days.push(day);
        }
        day.records.push(record);
        day.totalCost += record.cost;
        day.byModel[record.model] = (day.byModel[record.model] || 0) + record.cost;
        day.byProvider[record.provider] = (day.byProvider[record.provider] || 0) + record.cost;
        monthData.totalCost += record.cost;
        usage.allTimeTotal += record.cost;
        usage.lastUpdated = Date.now();
        store.set("usage", usage);
      }
      /**
       * Update workspace-specific usage file
       */
      async updateWorkspaceUsage(record, workspacePath) {
        const usagePath = this.getWorkspaceUsagePath(workspacePath);
        let data = {
          version: USAGE_DATA_VERSION,
          monthly: [],
          allTimeTotal: 0,
          lastUpdated: Date.now()
        };
        try {
          const content = await fs28.readFile(usagePath, "utf-8");
          data = JSON.parse(content);
        } catch {
        }
        const month = this.formatMonth(new Date(record.timestamp));
        let monthData = data.monthly.find((m) => m.month === month);
        if (!monthData) {
          monthData = {
            month,
            days: [],
            totalCost: 0,
            alertedAt: []
          };
          data.monthly.push(monthData);
        }
        const date = this.formatDate(new Date(record.timestamp));
        let day = monthData.days.find((d) => d.date === date);
        if (!day) {
          day = {
            date,
            records: [],
            totalCost: 0,
            byModel: {},
            byProvider: {}
          };
          monthData.days.push(day);
        }
        day.records.push(record);
        day.totalCost += record.cost;
        day.byModel[record.model] = (day.byModel[record.model] || 0) + record.cost;
        day.byProvider[record.provider] = (day.byProvider[record.provider] || 0) + record.cost;
        monthData.totalCost += record.cost;
        data.allTimeTotal += record.cost;
        data.lastUpdated = Date.now();
        await this.ensureUsageDir(workspacePath);
        await fs28.writeFile(usagePath, JSON.stringify(data, null, 2), "utf-8");
      }
      /**
       * Get usage data for a specific month
       */
      async getUsage(month, workspacePath) {
        try {
          if (workspacePath) {
            const workspaceData = await this.getWorkspaceUsage(workspacePath, month);
            if (workspaceData) {
              return { usage: workspaceData };
            }
          }
          const store = this.ensureInitialized();
          const usage = store.get("usage");
          if (month) {
            const monthData = usage.monthly.find((m) => m.month === month);
            if (!monthData) {
              return { usage: { version: USAGE_DATA_VERSION, monthly: [], allTimeTotal: 0, lastUpdated: Date.now() } };
            }
            return {
              usage: {
                version: usage.version,
                monthly: [monthData],
                allTimeTotal: monthData.totalCost,
                lastUpdated: usage.lastUpdated
              }
            };
          }
          return { usage };
        } catch (error) {
          return { error: error.message };
        }
      }
      /**
       * Get usage data from a specific workspace
       */
      async getWorkspaceUsage(workspacePath, month) {
        try {
          const usagePath = this.getWorkspaceUsagePath(workspacePath);
          const content = await fs28.readFile(usagePath, "utf-8");
          const data = JSON.parse(content);
          if (month) {
            const monthData = data.monthly.find((m) => m.month === month);
            if (!monthData)
              return null;
            return {
              version: data.version,
              monthly: [monthData],
              allTimeTotal: monthData.totalCost,
              lastUpdated: data.lastUpdated
            };
          }
          return data;
        } catch {
          return null;
        }
      }
      /**
       * Get list of months with usage data
       */
      async getAvailableMonths(workspacePath) {
        const months = /* @__PURE__ */ new Set();
        try {
          const store = this.ensureInitialized();
          const usage = store.get("usage");
          usage.monthly.forEach((m) => months.add(m.month));
        } catch {
        }
        if (workspacePath) {
          try {
            const usagePath = this.getWorkspaceUsagePath(workspacePath);
            const content = await fs28.readFile(usagePath, "utf-8");
            const data = JSON.parse(content);
            data.monthly.forEach((m) => months.add(m.month));
          } catch {
          }
        }
        return Array.from(months).sort();
      }
      /**
       * Set monthly spend limit
       */
      async setMonthlyLimit(month, limit) {
        try {
          const store = this.ensureInitialized();
          const limits = store.get("monthlyLimits");
          limits[month] = limit;
          store.set("monthlyLimits", limits);
          const usage = store.get("usage");
          const monthData = usage.monthly.find((m) => m.month === month);
          if (monthData) {
            monthData.limit = limit;
            store.set("usage", usage);
          }
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      /**
       * Get monthly limit
       */
      async getMonthlyLimit(month) {
        try {
          const store = this.ensureInitialized();
          const limits = store.get("monthlyLimits");
          return limits[month];
        } catch {
          return void 0;
        }
      }
      /**
       * Get all monthly limits
       */
      async getAllMonthlyLimits() {
        try {
          const store = this.ensureInitialized();
          return store.get("monthlyLimits");
        } catch {
          return {};
        }
      }
      /**
       * Clean up old data older than specified months
       */
      async cleanupOldData(monthsToKeep = DEFAULT_RETENTION_MONTHS) {
        try {
          const store = this.ensureInitialized();
          const usage = store.get("usage");
          const cutoff = /* @__PURE__ */ new Date();
          cutoff.setMonth(cutoff.getMonth() - monthsToKeep);
          const cutoffStr = this.formatMonth(cutoff);
          const originalCount = usage.monthly.length;
          usage.monthly = usage.monthly.filter((m) => m.month >= cutoffStr);
          usage.lastUpdated = Date.now();
          store.set("usage", usage);
          return { deleted: originalCount - usage.monthly.length };
        } catch (error) {
          return { deleted: 0, error: error.message };
        }
      }
      /**
       * Export usage data to CSV format
       */
      async exportToCSV(workspacePath) {
        try {
          const { usage } = await this.getUsage(void 0, workspacePath);
          if (!usage || usage.monthly.length === 0) {
            return { error: "No usage data available" };
          }
          const headers = ["Date", "Provider", "Model", "Input Tokens", "Output Tokens", "Cost"];
          const rows = [headers.join(",")];
          for (const month of usage.monthly) {
            for (const day of month.days) {
              for (const record of day.records) {
                const row = [
                  new Date(record.timestamp).toISOString(),
                  record.provider,
                  record.model,
                  record.inputTokens,
                  record.outputTokens,
                  record.cost.toFixed(4)
                ];
                rows.push(row.join(","));
              }
            }
          }
          return { csv: rows.join("\n") };
        } catch (error) {
          return { error: error.message };
        }
      }
      /**
       * Get summary statistics
       */
      async getSummary(month, workspacePath) {
        try {
          const { usage } = await this.getUsage(month, workspacePath);
          if (!usage) {
            return { totalCost: 0, totalTokens: 0, requestCount: 0, byModel: {}, byProvider: {} };
          }
          const monthsToProcess = month ? usage.monthly.filter((m) => m.month === month) : usage.monthly;
          let totalCost = 0;
          let totalTokens = 0;
          let requestCount = 0;
          const byModel = {};
          const byProvider = {};
          for (const monthData of monthsToProcess) {
            totalCost += monthData.totalCost;
            for (const day of monthData.days) {
              for (const record of day.records) {
                requestCount++;
                const recordTokens = record.inputTokens + record.outputTokens;
                totalTokens += recordTokens;
                if (!byModel[record.model]) {
                  byModel[record.model] = { cost: 0, tokens: 0 };
                }
                byModel[record.model].cost += record.cost;
                byModel[record.model].tokens += recordTokens;
                if (!byProvider[record.provider]) {
                  byProvider[record.provider] = { cost: 0, tokens: 0 };
                }
                byProvider[record.provider].cost += record.cost;
                byProvider[record.provider].tokens += recordTokens;
              }
            }
          }
          return { totalCost, totalTokens, requestCount, byModel, byProvider };
        } catch (error) {
          return {
            totalCost: 0,
            totalTokens: 0,
            requestCount: 0,
            byModel: {},
            byProvider: {},
            error: error.message
          };
        }
      }
      formatMonth(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
    };
    usageStorage = null;
  }
});

// main/file-history.ts
function calculateLineDiff(beforeContent, afterContent) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let additions = 0;
  let deletions = 0;
  if (!beforeContent && afterContent) {
    additions = afterLines.length;
    return { additions, deletions };
  }
  if (beforeContent && !afterContent) {
    deletions = beforeLines.length;
    return { additions, deletions };
  }
  const lineDiff = afterLines.length - beforeLines.length;
  if (lineDiff > 0) {
    additions = lineDiff;
    deletions = Math.max(0, Math.floor(beforeLines.length * 0.05));
  } else if (lineDiff < 0) {
    deletions = Math.abs(lineDiff);
    additions = Math.max(0, Math.floor(afterLines.length * 0.05));
  } else {
    additions = Math.max(1, Math.floor(afterLines.length * 0.05));
    deletions = Math.max(1, Math.floor(beforeLines.length * 0.05));
  }
  return { additions, deletions };
}
function generateUnifiedDiff(beforeContent, afterContent, filePath, contextLines = 3) {
  const chunks = (0, import_diff.diffLines)(beforeContent, afterContent);
  const lines = [];
  for (const chunk of chunks) {
    const chunkLines = chunk.value.split("\n");
    if (chunkLines[chunkLines.length - 1] === "")
      chunkLines.pop();
    const type = chunk.added ? "added" : chunk.removed ? "removed" : "unchanged";
    for (const line of chunkLines) {
      lines.push({ type, content: line });
    }
  }
  let diff = `--- ${filePath}
+++ ${filePath}
`;
  let oldLine = 1;
  let newLine = 1;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "unchanged") {
      oldLine++;
      newLine++;
      i++;
      continue;
    }
    const hunkStart = Math.max(0, i - contextLines);
    const hunkOldStart = oldLine - (i - hunkStart);
    const hunkNewStart = newLine - (i - hunkStart);
    const hunkLines = [];
    for (let k = hunkStart; k < i; k++) {
      hunkLines.push(lines[k]);
    }
    let lastChangeIdx = i;
    while (i < lines.length) {
      hunkLines.push(lines[i]);
      if (lines[i].type !== "unchanged") {
        lastChangeIdx = i;
      }
      if (lines[i].type === "unchanged" && i - lastChangeIdx >= contextLines) {
        i++;
        break;
      }
      i++;
    }
    const trailingUnchanged = hunkLines.reduceRight((count, l) => {
      if (count === -1)
        return -1;
      return l.type === "unchanged" ? count + 1 : -1;
    }, 0);
    const trimCount = trailingUnchanged > contextLines ? trailingUnchanged - contextLines : 0;
    const trimmedHunk = trimCount > 0 ? hunkLines.slice(0, hunkLines.length - trimCount) : hunkLines;
    const oldCount = trimmedHunk.filter((l) => l.type !== "added").length;
    const newCount = trimmedHunk.filter((l) => l.type !== "removed").length;
    diff += `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@
`;
    for (const l of trimmedHunk) {
      if (l.type === "added")
        diff += `+${l.content}
`;
      else if (l.type === "removed")
        diff += `-${l.content}
`;
      else
        diff += ` ${l.content}
`;
    }
    for (const l of trimmedHunk) {
      if (l.type !== "added")
        oldLine++;
      if (l.type !== "removed")
        newLine++;
    }
  }
  return diff;
}
function findChangeLocation(beforeContent, afterContent, toolName, toolInput) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let startLine = 1;
  let endLine = afterLines.length;
  let lineCount = afterLines.length;
  if (toolName === "Edit" && typeof toolInput.old_string === "string") {
    const oldString = toolInput.old_string;
    const oldLines = oldString.split("\n");
    for (let i = 0; i <= beforeLines.length - oldLines.length; i++) {
      const match = oldLines.every((line, idx) => beforeLines[i + idx] === line);
      if (match) {
        startLine = i + 1;
        endLine = startLine + oldLines.length - 1;
        break;
      }
    }
    if (typeof toolInput.new_string === "string") {
      const newLines = toolInput.new_string.split("\n");
      lineCount = newLines.length;
      endLine = startLine + newLines.length - 1;
    }
  } else if (toolName === "Write") {
    startLine = 1;
    endLine = afterLines.length;
    lineCount = afterLines.length;
  }
  return { startLine, endLine, lineCount };
}
function generateSnippet(content, startLine, endLine, contextLines = 3) {
  const lines = content.split("\n");
  const snippetStart = Math.max(0, startLine - 1 - contextLines);
  const snippetEnd = Math.min(lines.length, endLine + contextLines);
  return lines.slice(snippetStart, snippetEnd).join("\n");
}
function getFileExtension(filePath) {
  const ext = (0, import_node_path.extname)(filePath).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}
function getFileName(filePath) {
  return (0, import_node_path.basename)(filePath);
}
function applyInversePatch(beforeContent, afterContent, currentContent) {
  const inversePatch = (0, import_diff.createPatch)("file", afterContent, beforeContent, "", "", { context: 4 });
  const result = (0, import_diff.applyPatch)(currentContent, inversePatch, { fuzzFactor: 2 });
  return result === false ? null : result;
}
function getFileHistoryManager(workspacePath) {
  if (!fileHistoryManager || fileHistoryManager["workspacePath"] !== workspacePath) {
    fileHistoryManager = new FileHistoryManager(workspacePath);
    fileHistoryManager.initialize().catch(console.error);
  }
  return fileHistoryManager;
}
var import_node_fs, import_node_path, import_diff, MAX_INMEMORY_SNAPSHOTS, FileHistoryManager, fileHistoryManager;
var init_file_history = __esm({
  "main/file-history.ts"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = require("path");
    import_diff = require("diff");
    MAX_INMEMORY_SNAPSHOTS = 50;
    FileHistoryManager = class {
      snapshots = /* @__PURE__ */ new Map();
      // key: `${conversationId}/${messageId}`
      workspacePath;
      backupDir;
      constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.backupDir = (0, import_node_path.join)(workspacePath, ".omnicode", "backups");
      }
      resolveFilePath(filePath) {
        return (0, import_node_path.isAbsolute)(filePath) ? filePath : (0, import_node_path.resolve)(this.workspacePath, filePath);
      }
      /**
       * Initialize the backup directory
       */
      async initialize() {
        try {
          await import_node_fs.promises.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
          console.error("[FileHistoryManager] Failed to create backup directory:", error);
        }
      }
      /**
       * Create a snapshot of a file before it's modified
       * Call this before executing file-modifying tools
       */
      async captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType) {
        const absolutePath = this.resolveFilePath(filePath);
        let beforeContent = "";
        try {
          beforeContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
        } catch (error) {
          beforeContent = "";
        }
        const key = `${conversationId}/${messageId}`;
        let snapshot = this.snapshots.get(key);
        if (!snapshot) {
          snapshot = {
            messageId,
            conversationId,
            changes: [],
            timestamp: Date.now()
          };
          this.snapshots.set(key, snapshot);
        }
        const existingChange = snapshot.changes.find((c) => c.filePath === filePath);
        if (existingChange) {
          return;
        }
        const change = {
          messageId,
          toolCallId,
          filePath,
          beforeContent,
          timestamp: Date.now(),
          changeType
        };
        snapshot.changes.push(change);
        await this.persistSnapshot(snapshot);
      }
      /**
       * Update the afterContent of a change after tool execution completes
       */
      async captureAfterChange(conversationId, messageId, toolCallId, filePath) {
        const absolutePath = this.resolveFilePath(filePath);
        let afterContent = "";
        try {
          afterContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
        } catch (error) {
          afterContent = "";
        }
        const key = `${conversationId}/${messageId}`;
        const snapshot = this.snapshots.get(key);
        if (!snapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for ${key}`);
          return;
        }
        const change = snapshot.changes.find(
          (c) => c.filePath === filePath && c.toolCallId === toolCallId
        );
        if (change) {
          change.afterContent = afterContent;
          await this.persistSnapshot(snapshot);
        }
      }
      /**
       * Get all file changes for a specific message.
       * Loads from disk if the snapshot was evicted from memory.
       */
      async getMessageChanges(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        return snapshot?.changes.filter((change) => change.afterContent !== void 0) || [];
      }
      /**
       * Check if a message has any file changes
       */
      async hasChanges(conversationId, messageId) {
        const changes = await this.getMessageChanges(conversationId, messageId);
        return changes.length > 0;
      }
      /**
       * Get all messages that have file changes in a conversation
       */
      getMessagesWithChanges(conversationId) {
        const messages = [];
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.changes.length > 0) {
            messages.push(snapshot.messageId);
          }
        }
        return messages;
      }
      /**
       * Get aggregated file changes for an entire conversation.
       * Loads evicted snapshots from disk as needed.
       */
      async getAllConversationChanges(conversationId) {
        await this.ensureConversationLoaded(conversationId);
        const fileMap = /* @__PURE__ */ new Map();
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId !== conversationId)
            continue;
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            const existing = fileMap.get(change.filePath);
            let effectiveType;
            if (change.changeType === "delete") {
              effectiveType = "deleted";
            } else if (!change.beforeContent && change.afterContent) {
              effectiveType = "added";
            } else {
              effectiveType = "modified";
            }
            const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
            if (existing) {
              if (snapshot.timestamp > existing.lastTimestamp) {
                if (existing.changeType === "deleted" && effectiveType === "added") {
                  effectiveType = "added";
                } else if (effectiveType === "deleted") {
                  effectiveType = "deleted";
                } else if (existing.changeType === "added") {
                  effectiveType = "added";
                } else {
                  effectiveType = "modified";
                }
                existing.changeType = effectiveType;
                existing.lastMessageId = snapshot.messageId;
                existing.lastTimestamp = snapshot.timestamp;
                existing.lastBeforeContent = change.beforeContent;
                existing.lastAfterContent = change.afterContent || "";
              }
              existing.changeCount++;
              existing.additions += lineDiff.additions;
              existing.deletions += lineDiff.deletions;
            } else {
              fileMap.set(change.filePath, {
                filePath: change.filePath,
                fileName: getFileName(change.filePath),
                extension: getFileExtension(change.filePath),
                changeType: effectiveType,
                lastMessageId: snapshot.messageId,
                lastTimestamp: snapshot.timestamp,
                changeCount: 1,
                additions: lineDiff.additions,
                deletions: lineDiff.deletions,
                lastBeforeContent: change.beforeContent,
                lastAfterContent: change.afterContent || ""
              });
            }
          }
        }
        return Array.from(fileMap.values()).map(({ lastBeforeContent, lastAfterContent, ...summary }) => summary).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      }
      /**
       * Get file changes for a specific message with line statistics.
       * Loads from disk if the snapshot was evicted from memory.
       */
      async getMessageChangesWithStats(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return [];
        }
        return snapshot.changes.filter((change) => change.afterContent !== void 0).map((change) => {
          const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
          let changeType;
          if (change.changeType === "delete") {
            changeType = "deleted";
          } else if (!change.beforeContent && change.afterContent) {
            changeType = "added";
          } else {
            changeType = "modified";
          }
          return {
            filePath: change.filePath,
            fileName: getFileName(change.filePath),
            extension: getFileExtension(change.filePath),
            changeType,
            lastMessageId: messageId,
            lastTimestamp: change.timestamp,
            changeCount: 1,
            additions: lineDiff.additions,
            deletions: lineDiff.deletions
          };
        });
      }
      /**
       * Rollback all changes from a specific message onwards.
       * Collects ALL snapshots from the target message onward, determines the
       * earliest beforeContent for each affected file, and restores it.
       */
      async rollbackToMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
          return { success: false, restoredFiles, failedFiles };
        }
        await this.ensureConversationLoaded(conversationId);
        const affectedSnapshots = [];
        for (const [, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
            affectedSnapshots.push(snapshot);
          }
        }
        affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[FileHistoryManager] Rolling back ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);
        const fileRestoreMap = /* @__PURE__ */ new Map();
        for (const snapshot of affectedSnapshots) {
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            if (!fileRestoreMap.has(change.filePath)) {
              fileRestoreMap.set(change.filePath, {
                beforeContent: change.beforeContent,
                lastAfterContent: change.afterContent,
                changeType: change.changeType,
                hadBeforeContent: !!change.beforeContent
              });
            } else {
              const existing = fileRestoreMap.get(change.filePath);
              existing.lastAfterContent = change.afterContent;
            }
          }
        }
        for (const [filePath, restore] of fileRestoreMap.entries()) {
          const absolutePath = this.resolveFilePath(filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            let currentContent;
            try {
              currentContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
            } catch {
              currentContent = null;
            }
            if (!restore.hadBeforeContent) {
              if (currentContent === null || currentContent === restore.lastAfterContent) {
                try {
                  await import_node_fs.promises.unlink(absolutePath);
                } catch {
                }
              } else {
                const reverted = applyInversePatch("", restore.lastAfterContent, currentContent);
                if (reverted !== null && reverted.trim() === "") {
                  try {
                    await import_node_fs.promises.unlink(absolutePath);
                  } catch {
                  }
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert created file ${filePath}. Deleting.`);
                  try {
                    await import_node_fs.promises.unlink(absolutePath);
                  } catch {
                  }
                }
              }
              restoredFiles.push(filePath);
            } else if (restore.changeType === "delete" && !restore.lastAfterContent) {
              await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
              restoredFiles.push(filePath);
            } else {
              if (currentContent === null) {
                if (restore.beforeContent) {
                  await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
                }
              } else if (currentContent === restore.lastAfterContent) {
                await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
              } else {
                const reverted = applyInversePatch(restore.beforeContent, restore.lastAfterContent, currentContent);
                if (reverted !== null) {
                  await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert ${filePath}. Restoring to pre-change state.`);
                  await import_node_fs.promises.writeFile(absolutePath, restore.beforeContent, "utf8");
                }
              }
              restoredFiles.push(filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to restore ${filePath}:`, error);
            failedFiles.push(filePath);
          }
        }
        this.clearSnapshotsFromMessage(conversationId, targetSnapshot.timestamp);
        return {
          success: failedFiles.length === 0,
          restoredFiles,
          failedFiles
        };
      }
      /**
       * Re-apply changes from a specific message onward (undo a previous rollback).
       * Loads all snapshots from the target message onward and writes the latest
       * afterContent for each affected file.
       */
      async reapplyMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        await this.ensureConversationLoaded(conversationId);
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId} (reapply)`);
          return { success: false, restoredFiles, failedFiles };
        }
        const affectedSnapshots = [];
        for (const [, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
            affectedSnapshots.push(snapshot);
          }
        }
        affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[FileHistoryManager] Re-applying ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);
        const fileReapplyMap = /* @__PURE__ */ new Map();
        for (const snapshot of affectedSnapshots) {
          for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
            fileReapplyMap.set(change.filePath, {
              afterContent: change.afterContent,
              changeType: change.changeType
            });
          }
        }
        for (const [filePath, reapply] of fileReapplyMap.entries()) {
          const absolutePath = this.resolveFilePath(filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            if (reapply.changeType === "delete") {
              try {
                await import_node_fs.promises.unlink(absolutePath);
              } catch {
              }
              restoredFiles.push(filePath);
            } else {
              await import_node_fs.promises.writeFile(absolutePath, reapply.afterContent, "utf8");
              restoredFiles.push(filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to reapply ${filePath}:`, error);
            failedFiles.push(filePath);
          }
        }
        return {
          success: failedFiles.length === 0,
          restoredFiles,
          failedFiles
        };
      }
      /**
       * Clear all snapshots for a conversation (when conversation is deleted)
       */
      async clearConversation(conversationId) {
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId) {
            this.snapshots.delete(key);
          }
        }
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          await import_node_fs.promises.rmdir(conversationBackupDir, { recursive: true });
        } catch (error) {
        }
      }
      /**
       * Clear snapshots from a specific message onwards (after rollback)
       */
      clearSnapshotsFromMessage(conversationId, fromTimestamp) {
        for (const [key, snapshot] of this.snapshots.entries()) {
          if (snapshot.conversationId === conversationId && snapshot.timestamp >= fromTimestamp) {
            this.snapshots.delete(key);
          }
        }
      }
      /**
       * Persist a snapshot to disk for safety, then evict old entries from memory.
       */
      async persistSnapshot(snapshot) {
        const snapshotDir = (0, import_node_path.join)(this.backupDir, snapshot.conversationId, snapshot.messageId);
        try {
          await import_node_fs.promises.mkdir(snapshotDir, { recursive: true });
          for (const change of snapshot.changes) {
            const safeFileName = change.filePath.replace(/[/\\]/g, "_");
            const backupPath = (0, import_node_path.join)(snapshotDir, `${safeFileName}.json`);
            await import_node_fs.promises.writeFile(backupPath, JSON.stringify(change, null, 2), "utf8");
          }
        } catch (error) {
          console.error("[FileHistoryManager] Failed to persist snapshot:", error);
          return;
        }
        this.evictOldSnapshots();
      }
      /**
       * Remove the oldest snapshots from memory when exceeding the cap.
       * Evicted snapshots are safe to remove because they were already persisted to disk.
       */
      evictOldSnapshots() {
        if (this.snapshots.size <= MAX_INMEMORY_SNAPSHOTS)
          return;
        const entries = Array.from(this.snapshots.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toEvict = entries.length - MAX_INMEMORY_SNAPSHOTS;
        for (let i = 0; i < toEvict; i++) {
          this.snapshots.delete(entries[i][0]);
        }
      }
      /**
       * Load a single snapshot from disk into memory if it isn't already present.
       */
      async ensureSnapshotLoaded(key) {
        const existing = this.snapshots.get(key);
        if (existing)
          return existing;
        const [conversationId, messageId] = key.split("/");
        if (!conversationId || !messageId)
          return void 0;
        const messageDir = (0, import_node_path.join)(this.backupDir, conversationId, messageId);
        try {
          const stat10 = await import_node_fs.promises.stat(messageDir);
          if (!stat10.isDirectory())
            return void 0;
          const files = await import_node_fs.promises.readdir(messageDir);
          const changes = [];
          for (const file of files) {
            if (!file.endsWith(".json"))
              continue;
            const filePath = (0, import_node_path.join)(messageDir, file);
            try {
              const content = await import_node_fs.promises.readFile(filePath, "utf8");
              changes.push(JSON.parse(content));
            } catch {
            }
          }
          if (changes.length > 0) {
            const snapshot = {
              messageId,
              conversationId,
              changes,
              timestamp: changes[0]?.timestamp || Date.now()
            };
            this.snapshots.set(key, snapshot);
            return snapshot;
          }
        } catch {
        }
        return void 0;
      }
      /**
       * Ensure all snapshots for a conversation are loaded into memory.
       * Re-reads any that were evicted since initial load.
       */
      async ensureConversationLoaded(conversationId) {
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
          for (const messageId of messageDirs) {
            const key = `${conversationId}/${messageId}`;
            if (this.snapshots.has(key))
              continue;
            await this.ensureSnapshotLoaded(key);
          }
        } catch {
        }
      }
      /**
       * Load snapshots from disk for a conversation
       */
      async loadSnapshots(conversationId) {
        const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
        try {
          const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
          for (const messageId of messageDirs) {
            const messageDir = (0, import_node_path.join)(conversationBackupDir, messageId);
            const stat10 = await import_node_fs.promises.stat(messageDir);
            if (!stat10.isDirectory())
              continue;
            const files = await import_node_fs.promises.readdir(messageDir);
            const changes = [];
            for (const file of files) {
              if (!file.endsWith(".json"))
                continue;
              const filePath = (0, import_node_path.join)(messageDir, file);
              try {
                const content = await import_node_fs.promises.readFile(filePath, "utf8");
                const change = JSON.parse(content);
                changes.push(change);
              } catch (error) {
                console.error(`[FileHistoryManager] Failed to load change from ${filePath}:`, error);
              }
            }
            if (changes.length > 0) {
              const snapshot = {
                messageId,
                conversationId,
                changes,
                timestamp: changes[0]?.timestamp || Date.now()
              };
              this.snapshots.set(`${conversationId}/${messageId}`, snapshot);
            }
          }
        } catch (error) {
        }
      }
      /**
       * Get detailed change preview for a specific tool call
       * Includes diff content and line location information
       */
      async getChangePreview(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot)
          return null;
        const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
        if (!change || !change.afterContent)
          return null;
        let changeType;
        if (change.changeType === "delete") {
          changeType = "deleted";
        } else if (!change.beforeContent && change.afterContent) {
          changeType = "added";
        } else {
          changeType = "modified";
        }
        const diffContent = generateUnifiedDiff(
          change.beforeContent,
          change.afterContent || "",
          change.filePath
        );
        const additions = (diffContent.match(/^\+(?!\+\+)/gm) || []).length;
        const deletions = (diffContent.match(/^-(?!--)/gm) || []).length;
        const { startLine, endLine, lineCount } = findChangeLocation(
          change.beforeContent,
          change.afterContent || "",
          change.changeType === "write" ? "Write" : "Edit",
          {}
        );
        const beforeSnippet = generateSnippet(change.beforeContent, startLine, endLine);
        const afterSnippet = generateSnippet(change.afterContent || "", startLine, endLine);
        return {
          toolCallId: change.toolCallId,
          messageId: change.messageId,
          filePath: change.filePath,
          fileName: getFileName(change.filePath),
          toolName: change.changeType === "write" ? "Write" : "Edit",
          changeType,
          startLine,
          endLine,
          lineCount,
          diffContent,
          beforeSnippet,
          afterSnippet,
          additions,
          deletions,
          timestamp: change.timestamp
        };
      }
      /**
       * Get all tool call changes for a message
       */
      async getToolCallChanges(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot)
          return [];
        const previews = [];
        for (const change of snapshot.changes.filter((c) => c.afterContent !== void 0)) {
          const preview = await this.getChangePreview(conversationId, messageId, change.toolCallId);
          if (preview)
            previews.push(preview);
        }
        return previews;
      }
      /**
       * Reconstruct file content without a specific tool call's changes
       * Used when rejecting a single tool call change while keeping others
       */
      async reconstructFileWithoutToolCall(conversationId, messageId, toolCallIdToExclude) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return { success: false, content: "", error: "Snapshot not found" };
        }
        const targetChange = snapshot.changes.find((c) => c.toolCallId === toolCallIdToExclude);
        if (!targetChange) {
          return { success: false, content: "", error: "Tool call change not found" };
        }
        let reconstructedContent = targetChange.beforeContent;
        const otherChanges = snapshot.changes.filter(
          (c) => c.filePath === targetChange.filePath && c.toolCallId !== toolCallIdToExclude && c.afterContent !== void 0
        );
        otherChanges.sort((a, b) => a.timestamp - b.timestamp);
        for (const change of otherChanges) {
          if (change.timestamp > targetChange.timestamp) {
            reconstructedContent = change.afterContent || reconstructedContent;
          }
        }
        return { success: true, content: reconstructedContent };
      }
      /**
       * Revert a specific tool call change
       */
      async revertToolCallChange(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = await this.ensureSnapshotLoaded(key);
        if (!snapshot) {
          return { success: false, error: "Snapshot not found" };
        }
        const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
        if (!change) {
          return { success: false, error: "Tool call change not found" };
        }
        const absolutePath = this.resolveFilePath(change.filePath);
        try {
          const result = await this.reconstructFileWithoutToolCall(conversationId, messageId, toolCallId);
          if (!result.success) {
            return { success: false, error: result.error };
          }
          await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
          await import_node_fs.promises.writeFile(absolutePath, result.content, "utf8");
          return { success: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to revert change: ${errorMsg}` };
        }
      }
    };
    fileHistoryManager = null;
  }
});

// main/notifications.ts
function initializeWindowFocusTracking(window) {
  const windowId = window.id;
  windowFocusState.set(windowId, window.isFocused());
  window.on("focus", () => {
    windowFocusState.set(windowId, true);
  });
  window.on("blur", () => {
    windowFocusState.set(windowId, false);
  });
  window.on("closed", () => {
    windowFocusState.delete(windowId);
  });
}
async function playSound(soundSetting) {
  try {
    if (soundSetting === "none") {
      return;
    }
    if (isSystemSound(soundSetting) || !soundSetting) {
      const played = await playSystemSound(soundSetting || "default");
      if (!played) {
        import_electron6.shell.beep();
      }
      return;
    }
    try {
      const soundPlay = await import("sound-play");
      await soundPlay.play(soundSetting);
      return;
    } catch (playError) {
      console.error("[Notifications] Failed to play custom sound, falling back to system beep:", playError);
      import_electron6.shell.beep();
      return;
    }
  } catch (error) {
    console.error("[Notifications] Failed to play sound:", error);
    try {
      import_electron6.shell.beep();
    } catch {
    }
  }
}
async function requestNotificationSound(window, type) {
  try {
    if (!settingsManager.get("notifications.enabled")) {
      return;
    }
    if (!settingsManager.get("notifications.soundEnabled")) {
      return;
    }
    if (type === "user_input" && !settingsManager.get("notifications.playOnUserInput")) {
      return;
    }
    if (type === "response_complete" && !settingsManager.get("notifications.playOnResponseComplete")) {
      return;
    }
    if (!window.isFocused()) {
      const soundSetting = settingsManager.get("notifications.sound");
      await playSound(soundSetting);
    }
  } catch (error) {
    console.error("[Notifications] Error requesting notification sound:", error);
  }
}
var import_electron6, windowFocusState;
var init_notifications = __esm({
  "main/notifications.ts"() {
    "use strict";
    import_electron6 = require("electron");
    init_settings();
    init_system_sounds();
    windowFocusState = /* @__PURE__ */ new Map();
  }
});

// main/terminal-manager.ts
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path29.dirname(require.resolve("node-pty/package.json"));
    const platform2 = `${process.platform}-${process.arch}`;
    const helperPath = path29.join(ptyDir, "prebuilds", platform2, "spawn-helper");
    if (fs30.existsSync(helperPath)) {
      fs30.chmodSync(helperPath, 493);
    }
  } catch {
  }
}
function getShell() {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "cmd.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}
function createTerminal(id, cwd, cols, rows, window) {
  if (sessions.has(id)) {
    destroyTerminal(id);
  }
  const shell6 = getShell();
  const resolvedCwd = path29.resolve(cwd || os3.homedir());
  const safeCwd = fs30.existsSync(resolvedCwd) ? resolvedCwd : os3.homedir();
  const ptyProcess = pty.spawn(shell6, [], {
    name: "xterm-256color",
    cols,
    rows,
    cwd: safeCwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor"
    }
  });
  ptyProcess.onData((data) => {
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:data", { id, data });
    }
    const session = sessions.get(id);
    if (session) {
      session.outputBuffer += data;
      if (session.outputBuffer.length > OUTPUT_BUFFER_LIMIT) {
        session.outputBuffer = session.outputBuffer.slice(session.outputBuffer.length - OUTPUT_BUFFER_LIMIT);
      }
      for (const cb of session.outputCallbacks) {
        cb(data);
      }
    }
  });
  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:exit", { id });
    }
  });
  sessions.set(id, { id, pty: ptyProcess, outputCallbacks: /* @__PURE__ */ new Set(), outputBuffer: "" });
}
function writeToTerminal(id, data) {
  const session = sessions.get(id);
  if (session) {
    session.pty.write(data);
  }
}
function resizeTerminal(id, cols, rows) {
  const session = sessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
}
function destroyTerminal(id) {
  const session = sessions.get(id);
  if (session) {
    try {
      session.pty.kill();
    } catch {
    }
    sessions.delete(id);
  }
}
function destroyAllTerminals() {
  for (const id of sessions.keys()) {
    destroyTerminal(id);
  }
}
function registerTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.add(cb);
}
function unregisterTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.delete(cb);
}
function getTerminalBuffer(id) {
  return sessions.get(id)?.outputBuffer ?? "";
}
var pty, os3, path29, fs30, OUTPUT_BUFFER_LIMIT, sessions;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os3 = __toESM(require("os"), 1);
    path29 = __toESM(require("path"), 1);
    fs30 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
    OUTPUT_BUFFER_LIMIT = 64 * 1024;
    sessions = /* @__PURE__ */ new Map();
  }
});

// main/tunnel-providers.ts
function createTunnelProvider(settings) {
  switch (settings.tunnelProvider) {
    case "ngrok": {
      if (!settings.ngrokAuthToken) {
        console.warn("[TunnelProviders] No ngrok auth token configured \u2014 falling back to local-only");
        return new NoneProvider();
      }
      return new NgrokProvider(settings.ngrokAuthToken);
    }
    case "cloudflared":
      return new CloudflaredProvider(settings.cloudflaredToken || void 0);
    case "localtunnel":
      return new LocaltunnelProvider();
    case "none":
    default:
      return new NoneProvider();
  }
}
var ngrok, import_cloudflared, NgrokProvider, CloudflaredProvider, LocaltunnelProvider, NoneProvider;
var init_tunnel_providers = __esm({
  "main/tunnel-providers.ts"() {
    "use strict";
    ngrok = __toESM(require("@ngrok/ngrok"), 1);
    import_cloudflared = require("cloudflared");
    NgrokProvider = class {
      constructor(authToken) {
        this.authToken = authToken;
      }
      listener = null;
      async start(port2) {
        this.listener = await ngrok.forward({
          addr: port2,
          authtoken: this.authToken
        });
        const url = this.listener.url();
        if (!url)
          throw new Error("ngrok did not return a URL");
        return url;
      }
      async stop() {
        if (this.listener) {
          try {
            await this.listener.close();
          } catch {
          }
          this.listener = null;
        }
      }
    };
    CloudflaredProvider = class {
      constructor(token) {
        this.token = token;
      }
      tunnelInstance = null;
      async start(port2) {
        return new Promise((resolve12, reject) => {
          const t = this.token ? import_cloudflared.Tunnel.withToken(this.token) : import_cloudflared.Tunnel.quick(`http://localhost:${port2}`);
          this.tunnelInstance = t;
          const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for Cloudflare Tunnel URL (30s)"));
          }, 3e4);
          t.once("url", (url) => {
            clearTimeout(timeout);
            resolve12(url);
          });
          t.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
          t.once("exit", (code) => {
            clearTimeout(timeout);
            reject(new Error(`cloudflared exited unexpectedly (code ${code})`));
          });
        });
      }
      async stop() {
        if (this.tunnelInstance) {
          try {
            this.tunnelInstance.stop();
          } catch {
          }
          this.tunnelInstance = null;
        }
      }
    };
    LocaltunnelProvider = class {
      client = null;
      async start(port2) {
        const mod = await import("localtunnel");
        const lt = mod.default ?? mod;
        this.client = await lt({ port: port2 });
        return this.client.url;
      }
      async stop() {
        if (this.client) {
          try {
            this.client.close();
          } catch {
          }
          this.client = null;
        }
      }
    };
    NoneProvider = class {
      async start(port2) {
        return `http://localhost:${port2}`;
      }
      async stop() {
      }
    };
  }
});

// main/change-review-manager.ts
function getChangeReviewManager(fileHistoryManager2) {
  if (!changeReviewManager) {
    changeReviewManager = new ChangeReviewManager(fileHistoryManager2);
  }
  return changeReviewManager;
}
var ChangeReviewManager, changeReviewManager;
var init_change_review_manager = __esm({
  "main/change-review-manager.ts"() {
    "use strict";
    ChangeReviewManager = class {
      // Key: `${conversationId}/${toolCallId}`
      pendingChanges = /* @__PURE__ */ new Map();
      fileHistoryManager;
      constructor(fileHistoryManager2) {
        this.fileHistoryManager = fileHistoryManager2;
      }
      /**
       * Stage a tool call change for review
       */
      stageToolCallChange(change) {
        const key = `${change.conversationId}/${change.toolCallId}`;
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Staged change ${change.toolCallId} for ${change.filePath}`);
      }
      /**
       * Get all pending changes for a conversation
       */
      getPendingChanges(conversationId) {
        const changes = [];
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`) && change.status === "pending") {
            changes.push(change);
          }
        }
        return changes.sort((a, b) => a.timestamp - b.timestamp);
      }
      /**
       * Get pending changes for a specific file
       */
      getPendingForFile(conversationId, filePath) {
        return this.getPendingChanges(conversationId).filter(
          (c) => c.filePath === filePath
        );
      }
      /**
       * Get a specific pending change by tool call ID
       */
      getPendingChange(conversationId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        return this.pendingChanges.get(key);
      }
      /**
       * Check if a conversation has any pending changes
       */
      hasPendingChanges(conversationId) {
        return this.getPendingChanges(conversationId).length > 0;
      }
      /**
       * Get summary of changes for a conversation
       */
      getChangeSummary(conversationId) {
        const allChanges = [];
        const byFile = /* @__PURE__ */ new Map();
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`)) {
            allChanges.push(change);
            const fileChanges = byFile.get(change.filePath) || [];
            fileChanges.push(change);
            byFile.set(change.filePath, fileChanges);
          }
        }
        return {
          conversationId,
          totalPending: allChanges.filter((c) => c.status === "pending").length,
          totalAccepted: allChanges.filter((c) => c.status === "accepted").length,
          totalRejected: allChanges.filter((c) => c.status === "rejected").length,
          byFile
        };
      }
      /**
       * Accept a specific tool call change
       * Simply marks it as accepted - the change stays in the file
       */
      async acceptToolCallChange(conversationId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        const change = this.pendingChanges.get(key);
        if (!change) {
          return { success: false, error: "Change not found" };
        }
        if (change.status !== "pending") {
          return { success: false, error: `Change already ${change.status}` };
        }
        change.status = "accepted";
        change.reviewedAt = Date.now();
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Accepted change ${toolCallId} for ${change.filePath}`);
        return { success: true };
      }
      /**
       * Reject a specific tool call change
       * Reconstructs the file without this change while keeping other changes
       */
      async rejectToolCallChange(conversationId, messageId, toolCallId) {
        const key = `${conversationId}/${toolCallId}`;
        const change = this.pendingChanges.get(key);
        if (!change) {
          return { success: false, error: "Change not found" };
        }
        if (change.status !== "pending") {
          return { success: false, error: `Change already ${change.status}` };
        }
        const absolutePath = this.fileHistoryManager["resolveFilePath"](change.filePath);
        const { promises: fs42 } = await import("fs");
        if (change.changeType === "added") {
          try {
            await fs42.unlink(absolutePath);
            console.log(`[ChangeReviewManager] Deleted newly created file ${change.filePath}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (error.code !== "ENOENT") {
              console.warn(`[ChangeReviewManager] Error deleting file ${change.filePath}: ${errorMsg}`);
            }
          }
        } else {
          const result = await this.fileHistoryManager.reconstructFileWithoutToolCall(
            conversationId,
            messageId,
            toolCallId
          );
          if (!result.success) {
            return { success: false, error: result.error };
          }
          const { dirname: dirname12 } = await import("path");
          try {
            await fs42.mkdir(dirname12(absolutePath), { recursive: true });
            await fs42.writeFile(absolutePath, result.content, "utf8");
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return { success: false, error: `Failed to write file: ${errorMsg}` };
          }
        }
        change.status = "rejected";
        change.reviewedAt = Date.now();
        this.pendingChanges.set(key, change);
        console.log(`[ChangeReviewManager] Rejected change ${toolCallId} for ${change.filePath}`);
        return { success: true };
      }
      /**
       * Accept all pending changes for a conversation
       */
      async acceptAllChanges(conversationId) {
        const pending = this.getPendingChanges(conversationId);
        const accepted = [];
        const failed = [];
        for (const change of pending) {
          const result = await this.acceptToolCallChange(conversationId, change.toolCallId);
          if (result.success) {
            accepted.push(change.toolCallId);
          } else {
            failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
          }
        }
        return {
          success: failed.length === 0,
          accepted,
          failed
        };
      }
      /**
       * Reject all pending changes for a conversation
       */
      async rejectAllChanges(conversationId, messageId) {
        const pending = this.getPendingChanges(conversationId);
        const rejected = [];
        const failed = [];
        for (const change of pending) {
          const result = await this.rejectToolCallChange(conversationId, messageId, change.toolCallId);
          if (result.success) {
            rejected.push(change.toolCallId);
          } else {
            failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
          }
        }
        return {
          success: failed.length === 0,
          rejected,
          failed
        };
      }
      /**
       * Clear all changes for a conversation
       */
      clearConversation(conversationId) {
        for (const [key, change] of this.pendingChanges.entries()) {
          if (key.startsWith(`${conversationId}/`)) {
            this.pendingChanges.delete(key);
          }
        }
        console.log(`[ChangeReviewManager] Cleared all changes for conversation ${conversationId}`);
      }
      /**
       * Convert a ChangePreview to PendingToolCallChange
       */
      static fromPreview(preview, beforeContent, afterContent) {
        return {
          toolCallId: preview.toolCallId,
          messageId: preview.messageId,
          conversationId: preview.conversationId || "",
          filePath: preview.filePath,
          fileName: preview.fileName,
          toolName: preview.toolName,
          changeType: preview.changeType,
          startLine: preview.startLine,
          endLine: preview.endLine,
          lineCount: preview.lineCount,
          beforeContent,
          afterContent,
          diffContent: preview.diffContent,
          beforeSnippet: preview.beforeSnippet,
          afterSnippet: preview.afterSnippet,
          additions: preview.additions,
          deletions: preview.deletions,
          status: "pending",
          timestamp: preview.timestamp
        };
      }
    };
    changeReviewManager = null;
  }
});

// main/tray-notifications.ts
function resolveIconPaths() {
  const appRoot = import_electron7.app.getAppPath();
  const isDev2 = process.env.NODE_ENV === "development";
  if (isDev2) {
    return {
      png: path30.join(appRoot, "logo.png"),
      icns: path30.join(appRoot, "logo.icns")
    };
  }
  return {
    png: path30.join(process.resourcesPath || appRoot, "logo.png"),
    icns: path30.join(process.resourcesPath || appRoot, "logo.icns")
  };
}
var import_electron7, path30, MAX_MENU_ITEMS, TrayNotificationManager, trayNotificationManager;
var init_tray_notifications = __esm({
  "main/tray-notifications.ts"() {
    "use strict";
    import_electron7 = require("electron");
    path30 = __toESM(require("path"), 1);
    init_settings();
    MAX_MENU_ITEMS = 10;
    TrayNotificationManager = class {
      tray = null;
      mainWindow = null;
      notifications = /* @__PURE__ */ new Map();
      recentChats = /* @__PURE__ */ new Map();
      activeConversationId = null;
      isWindowFocused = false;
      isChatVisible = true;
      baseIcon = null;
      navigateCallback = null;
      clearAllCallback = null;
      openProject = null;
      /**
       * Initialize the tray icon
       * Call this when the main window is created
       */
      initialize(mainWindow2) {
        if (this.tray) {
          console.log("[TrayNotifications] Already initialized, destroying previous tray");
          this.tray.destroy();
        }
        this.mainWindow = mainWindow2;
        this.loadBaseIcon();
        this.createTray();
        this.setupWindowTracking();
        this.setupIpcHandlers();
        console.log("[TrayNotifications] Tray manager initialized");
      }
      /**
       * Load the base app icon
       */
      loadBaseIcon() {
        try {
          const iconPaths = resolveIconPaths();
          const iconPath = process.platform === "darwin" ? iconPaths.icns : iconPaths.png;
          this.baseIcon = import_electron7.nativeImage.createFromPath(iconPath);
          if (this.baseIcon.isEmpty() && process.platform === "darwin") {
            this.baseIcon = import_electron7.nativeImage.createFromPath(iconPaths.png);
          }
          const traySize = process.platform === "darwin" ? 16 : 24;
          if (!this.baseIcon.isEmpty()) {
            this.baseIcon = this.baseIcon.resize({ width: traySize, height: traySize });
            if (process.platform === "darwin") {
              this.baseIcon.setTemplateImage(true);
            }
            console.log("[TrayNotifications] Base icon loaded successfully from:", iconPath);
          } else {
            console.warn("[TrayNotifications] Could not load icon from:", iconPath);
            this.baseIcon = import_electron7.nativeImage.createEmpty();
          }
        } catch (error) {
          console.error("[TrayNotifications] Failed to load base icon:", error);
          this.baseIcon = import_electron7.nativeImage.createEmpty();
        }
      }
      /**
       * Create the tray icon with context menu
       */
      createTray() {
        if (!this.baseIcon) {
          console.error("[TrayNotifications] Cannot create tray: base icon not loaded");
          return;
        }
        this.tray = new import_electron7.Tray(this.baseIcon);
        this.tray.setToolTip("Omni Code");
        this.tray.on("click", (_event, bounds) => {
          this.updateContextMenu();
          this.tray?.popUpContextMenu(bounds);
        });
        this.tray.on("right-click", (_event, bounds) => {
          this.updateContextMenu();
          this.tray?.popUpContextMenu(bounds);
        });
        this.updateContextMenu();
      }
      /**
       * Set up tracking for window focus and visibility state
       */
      setupWindowTracking() {
        if (!this.mainWindow)
          return;
        this.mainWindow.on("focus", () => {
          this.isWindowFocused = true;
        });
        this.mainWindow.on("blur", () => {
          this.isWindowFocused = false;
        });
        this.isWindowFocused = this.mainWindow.isFocused();
      }
      /**
       * Set up IPC handlers for renderer communication
       */
      setupIpcHandlers() {
        import_electron7.ipcMain.handle("tray:update-active", (_event, conversationId) => {
          this.activeConversationId = conversationId;
          if (conversationId) {
            this.clearNotification(conversationId);
          }
        });
        import_electron7.ipcMain.handle("tray:clear-notification", (_event, conversationId) => {
          this.clearNotification(conversationId);
        });
        import_electron7.ipcMain.handle("tray:clear-all-notifications", () => {
          this.clearAllNotifications();
        });
        import_electron7.ipcMain.handle("tray:update-recent-chats", (_event, chats) => {
          this.recentChats.clear();
          for (const chat of chats) {
            this.recentChats.set(chat.conversationId, chat);
          }
          this.updateContextMenu();
        });
        import_electron7.ipcMain.handle("tray:update-open-project", (_event, project) => {
          this.openProject = project;
          this.updateContextMenu();
        });
      }
      /**
       * Update open project info
       */
      updateOpenProject(project) {
        this.openProject = project;
        this.updateContextMenu();
      }
      /**
       * Update recent chats list from renderer
       */
      updateRecentChats(chats) {
        this.recentChats.clear();
        for (const chat of chats) {
          this.recentChats.set(chat.conversationId, chat);
        }
        this.updateContextMenu();
      }
      /**
       * Generate icon with notification badge
       * Returns base icon - badge is shown via tooltip and context menu
       */
      generateBadgeIcon(count) {
        if (!this.baseIcon) {
          return import_electron7.nativeImage.createEmpty();
        }
        return this.baseIcon;
      }
      /**
       * Update the tray icon based on notification count
       */
      updateIcon() {
        if (!this.tray || !this.baseIcon)
          return;
        const count = this.notifications.size;
        const icon = this.generateBadgeIcon(count);
        this.tray.setImage(icon);
        if (count > 0) {
          const chatText = count === 1 ? "chat" : "chats";
          this.tray.setToolTip(`${count} ${chatText} with new responses - Omni Code`);
        } else {
          this.tray.setToolTip("Omni Code");
        }
        if (process.platform === "darwin") {
          import_electron7.app.setBadgeCount(count);
        }
      }
      /**
       * Update the context menu with recent chats and pending notifications
       */
      updateContextMenu() {
        if (!this.tray)
          return;
        const menuItems = [];
        const notificationCount = this.notifications.size;
        if (notificationCount > 0) {
          menuItems.push({
            label: `\u{1F514} ${notificationCount} new response${notificationCount > 1 ? "s" : ""} waiting`,
            enabled: false
          });
          menuItems.push({
            label: "Clear All Notifications",
            click: () => {
              this.clearAllNotifications();
            }
          });
          menuItems.push({ type: "separator" });
        }
        let recentChatsList = Array.from(this.recentChats.values());
        if (this.openProject) {
          recentChatsList = recentChatsList.filter((chat) => {
            if (this.openProject.isWorkspaceMode && chat.workspaceId) {
              return chat.workspaceId === this.openProject.workspaceId;
            } else if (!this.openProject.isWorkspaceMode && chat.projectPath) {
              return chat.projectPath === this.openProject.projectPath;
            }
            return true;
          });
        }
        recentChatsList = recentChatsList.sort((a, b) => b.lastActivity - a.lastActivity).slice(0, MAX_MENU_ITEMS);
        if (recentChatsList.length > 0) {
          if (this.openProject) {
            menuItems.push({
              label: this.openProject.isWorkspaceMode ? "Open Workspace Chats" : "Open Project Chats",
              enabled: false
            });
          } else {
            menuItems.push({
              label: "Recent Chats",
              enabled: false
            });
          }
          for (const chat of recentChatsList) {
            const hasNotification = this.notifications.has(chat.conversationId);
            const notification = this.notifications.get(chat.conversationId);
            const timeAgo = this.formatTimeAgo(chat.lastActivity);
            let label;
            if (hasNotification && notification) {
              const preview = notification.messagePreview.slice(0, 30) + (notification.messagePreview.length > 30 ? "..." : "");
              label = `\u{1F534} ${chat.title} - ${preview} (${timeAgo})`;
            } else {
              label = `   ${chat.title} (${timeAgo})`;
            }
            menuItems.push({
              label,
              click: () => {
                this.navigateToChat(chat.conversationId);
              }
            });
          }
          menuItems.push({ type: "separator" });
        }
        menuItems.push({
          label: "Open Omni Code",
          click: () => {
            this.showMainWindow();
          }
        });
        menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Quit",
          role: "quit"
        });
        const contextMenu = import_electron7.Menu.buildFromTemplate(menuItems);
        this.tray.setContextMenu(contextMenu);
      }
      /**
       * Format timestamp to relative time string
       */
      formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1e3);
        if (seconds < 60)
          return "just now";
        if (seconds < 3600)
          return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400)
          return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
      }
      /**
       * Show/focus the main window and navigate to a specific chat
       */
      navigateToChat(conversationId) {
        this.showMainWindow();
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("tray:navigate-to-chat", conversationId);
        }
        this.clearNotification(conversationId);
      }
      /**
       * Show and focus the main window
       */
      showMainWindow() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
          return;
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.show();
        this.mainWindow.focus();
      }
      /**
       * Notify of a completed chat response
       * Call this when a response completes and should show in tray
       */
      notifyResponseComplete(conversationId, conversationTitle, messagePreview, isConversationActive) {
        if (!settingsManager.get("notifications.enabled")) {
          return;
        }
        if (!settingsManager.get("notifications.showTrayBadge")) {
          return;
        }
        if (isConversationActive && this.isWindowFocused && this.isChatVisible) {
          return;
        }
        const existing = this.notifications.get(conversationId);
        const notification = {
          conversationId,
          title: conversationTitle,
          messagePreview,
          timestamp: Date.now(),
          count: existing ? existing.count + 1 : 1
        };
        this.notifications.set(conversationId, notification);
        this.updateIcon();
        this.updateContextMenu();
        console.log(`[TrayNotifications] Added notification for conversation: ${conversationTitle} (${conversationId})`);
      }
      /**
       * Update chat visibility state from renderer
       */
      updateChatVisibility(isVisible) {
        this.isChatVisible = isVisible;
      }
      /**
       * Clear notification for a specific conversation
       */
      clearNotification(conversationId) {
        const hadNotification = this.notifications.has(conversationId);
        this.notifications.delete(conversationId);
        if (hadNotification) {
          this.updateIcon();
          this.updateContextMenu();
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("tray:notification-cleared", conversationId);
          }
        }
      }
      /**
       * Clear all notifications
       */
      clearAllNotifications() {
        const count = this.notifications.size;
        this.notifications.clear();
        if (count > 0) {
          this.updateIcon();
          this.updateContextMenu();
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("tray:all-notifications-cleared");
          }
          console.log("[TrayNotifications] All notifications cleared");
        }
      }
      /**
       * Get current notification count
       */
      getNotificationCount() {
        return this.notifications.size;
      }
      /**
       * Check if a conversation has pending notification
       */
      hasNotification(conversationId) {
        return this.notifications.has(conversationId);
      }
      /**
       * Clean up tray resources
       */
      destroy() {
        if (this.tray) {
          this.tray.destroy();
          this.tray = null;
        }
        this.notifications.clear();
        this.mainWindow = null;
        console.log("[TrayNotifications] Tray manager destroyed");
      }
    };
    trayNotificationManager = new TrayNotificationManager();
  }
});

// src/config/modes.ts
var modes_exports = {};
__export(modes_exports, {
  BUILTIN_MODES: () => BUILTIN_MODES
});
var BUILTIN_MODES;
var init_modes = __esm({
  "src/config/modes.ts"() {
    "use strict";
    BUILTIN_MODES = {
      architect: {
        systemPromptAppend: `You are in architect mode. Your role is to deeply analyze the codebase and produce a structured execution plan \u2014 do NOT write or modify any code or files.

When given a task:
1. Read all relevant files using available read/search tools to fully understand the codebase
2. Think through the approach, trade-offs, and risks
3. Output your plan in EXACTLY this format (valid JSON inside the XML tags):

<plan>
{
  "title": "Brief descriptive title for the task",
  "goal": "What this plan accomplishes in 1-2 sentences",
  "files": [
    { "path": "relative/path/to/file.ts", "action": "create", "reason": "Why this file needs to be created" },
    { "path": "relative/path/to/other.ts", "action": "modify", "reason": "What changes are needed and why" }
  ],
  "steps": [
    { "id": "1", "title": "Step title", "description": "Detailed description of what to do and why", "files": ["relative/path/to/file.ts"] },
    { "id": "2", "title": "Next step", "description": "What this step does", "files": ["relative/path/to/other.ts"] }
  ],
  "risks": ["Potential breaking changes or gotchas to watch out for"],
  "questions": ["Any clarifications needed before executing \u2014 leave empty if none"]
}
</plan>

After outputting the plan, stop. Do not make any file changes. Wait for the user to approve, modify, or reject the plan.

Note: when the user approves the plan, it will be saved to \`.omnicode/plan.json\` in the workspace. During execution you can read that file to review the full plan context.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      code: {
        systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code.

If a plan file exists at \`.omnicode/plan.json\`, you can read it with the Read tool to review the approved plan. As you complete each step, update that file by setting the step's \`status\` field to \`"in_progress"\` when you begin it and \`"completed"\` when you finish it. This keeps the plan progress visible to the user.`,
        temperature: 0.3
      },
      review: {
        systemPromptAppend: "You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      security: {
        systemPromptAppend: "You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      debug: {
        systemPromptAppend: "You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.",
        temperature: 0.2
      },
      ask: {
        systemPromptAppend: `You are in ASK mode. Your ONLY purpose is to answer questions and provide information.

CRITICAL RULES:
1. You are in READ-ONLY mode - you CANNOT and MUST NOT make any changes to files, code, or the system
2. If the user asks you to make a change, fix something, edit code, create files, or run commands, you MUST REFUSE
3. When refusing, tell the user: "I can't make changes in Ask mode. Please switch to Code mode (\u2318I) if you'd like me to make this change."
4. You may use Read, Glob, Grep, SearchWeb, WebFetch, and other read/search tools to find information
5. NEVER use Write, Edit, MultiFileEdit, DiffEdit, Bash, GitCommit, or any tool that modifies files or executes commands
6. If you need to show code, copy it into your response - do not create or modify files

You are an assistant that provides information ONLY. Changes require switching to Code mode.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      }
    };
  }
});

// main/agent-bridge.ts
function getFilePathsFromToolInput(toolName, input) {
  const paths = [];
  switch (toolName) {
    case "Write":
    case "Edit":
    case "DiffEdit":
      if (typeof input.file_path === "string") {
        paths.push(input.file_path);
      }
      break;
    case "MultiFileEdit":
      if (Array.isArray(input.edits)) {
        for (const edit of input.edits) {
          if (typeof edit === "object" && edit && typeof edit.file_path === "string") {
            paths.push(edit.file_path);
          }
        }
      }
      break;
  }
  return paths;
}
function getChangeType(toolName) {
  switch (toolName) {
    case "Write":
      return "write";
    case "Edit":
    case "MultiFileEdit":
    case "DiffEdit":
      return "edit";
    default:
      return "write";
  }
}
var import_electron8, FILE_MODIFYING_TOOLS, AgentBridge, agentBridge;
var init_agent_bridge = __esm({
  "main/agent-bridge.ts"() {
    "use strict";
    import_electron8 = require("electron");
    init_file_history();
    init_change_review_manager();
    init_settings();
    init_tray_notifications();
    FILE_MODIFYING_TOOLS = ["Write", "Edit", "MultiFileEdit", "DiffEdit"];
    AgentBridge = class {
      // Store conversation instances
      conversations = /* @__PURE__ */ new Map();
      pendingPermissionRequests = /* @__PURE__ */ new Map();
      pendingUserInputRequests = /* @__PURE__ */ new Map();
      // Factory function to create new agent instances
      agentFactory = null;
      // Provider registry for resolving providers when switching models
      providerRegistry = null;
      eventListeners = /* @__PURE__ */ new Set();
      // Workspace path for file history
      workspacePath = "";
      // Change review mode enabled (default: true)
      changeReviewEnabled = true;
      // Initialize the bridge with agent factory
      initialize(agentFactory) {
        this.agentFactory = agentFactory;
        this.initializeChangeReviewFromSettings().catch((err) => {
          console.error("[AgentBridge] Failed to initialize change review settings:", err);
        });
      }
      /**
       * Enable or disable change review mode
       */
      setChangeReviewEnabled(enabled) {
        this.changeReviewEnabled = enabled;
        console.log(`[AgentBridge] Change review mode ${enabled ? "enabled" : "disabled"}`);
        getSettingsManager().then((manager) => {
          manager.set("changeReview.enabled", enabled);
        }).catch((err) => console.error("[AgentBridge] Failed to save change review setting:", err));
      }
      /**
       * Check if change review mode is enabled
       */
      isChangeReviewEnabled() {
        return this.changeReviewEnabled;
      }
      /**
       * Get change review setting from settings manager
       */
      async getChangeReviewSetting() {
        try {
          const manager = await getSettingsManager();
          return {
            enabled: manager.get("changeReview.enabled") ?? true,
            mode: manager.get("changeReview.mode") ?? "all"
          };
        } catch (error) {
          console.error("[AgentBridge] Failed to get change review setting:", error);
          return { enabled: true, mode: "all" };
        }
      }
      /**
       * Set change review mode (all or dangerous only)
       */
      async setChangeReviewMode(mode) {
        try {
          const manager = await getSettingsManager();
          manager.set("changeReview.mode", mode);
          console.log(`[AgentBridge] Change review mode set to: ${mode}`);
        } catch (error) {
          console.error("[AgentBridge] Failed to set change review mode:", error);
        }
      }
      /**
       * Initialize change review settings from settings manager
       */
      async initializeChangeReviewFromSettings() {
        try {
          const manager = await getSettingsManager();
          const enabled = manager.get("changeReview.enabled");
          if (typeof enabled === "boolean") {
            this.changeReviewEnabled = enabled;
            console.log(`[AgentBridge] Loaded change review setting: ${enabled ? "enabled" : "disabled"}`);
          }
          manager.onChange((key, value) => {
            if (key === "changeReview.enabled" && typeof value === "boolean") {
              this.changeReviewEnabled = value;
              console.log(`[AgentBridge] Change review setting updated: ${value ? "enabled" : "disabled"}`);
            }
          });
        } catch (error) {
          console.error("[AgentBridge] Failed to initialize change review from settings:", error);
        }
      }
      // Set the workspace path for file history tracking
      setWorkspacePath(workspacePath) {
        this.workspacePath = workspacePath;
      }
      updateWorkspaceContext(workspacePath, systemPrompt, workspacePaths) {
        this.workspacePath = workspacePath;
        for (const state of this.conversations.values()) {
          state.agent.updateConfig({
            cwd: workspacePath,
            systemPrompt,
            workspacePaths: workspacePaths ?? [workspacePath]
          });
        }
      }
      // Targeted variant: only updates the specified conversations so that a folder
      // change in one window does not overwrite another window's agent context.
      updateWorkspaceContextForConversations(workspacePath, systemPrompt, conversationIds, workspacePaths) {
        for (const conversationId of conversationIds) {
          const state = this.conversations.get(conversationId);
          if (state) {
            state.agent.updateConfig({ cwd: workspacePath, systemPrompt, workspacePaths: workspacePaths ?? [workspacePath] });
          }
        }
      }
      // Get the working directory for a specific conversation (may differ from global path in multi-window)
      getWorkspacePathForConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        return state?.agent.config.cwd || this.workspacePath;
      }
      // Set the provider registry for model switching
      setProviderRegistry(registry) {
        this.providerRegistry = registry;
      }
      // Create a new conversation with optional model, provider, and working directory
      createConversation(conversationId, model, provider, workingDirectory) {
        console.log(`[AgentBridge] createConversation: id=${conversationId}, model=${model || "default"}, provider=${provider || "default"}, workingDirectory=${workingDirectory || "default"}`);
        if (!this.agentFactory) {
          console.error("[AgentBridge] Not initialized - no agent factory");
          return false;
        }
        if (this.conversations.has(conversationId)) {
          console.log(`[AgentBridge] Conversation ${conversationId} already exists, reusing`);
          if (workingDirectory) {
            const existing = this.conversations.get(conversationId);
            existing.agent.updateConfig({ cwd: workingDirectory });
            this.workspacePath = workingDirectory;
          }
          return true;
        }
        const agent = this.agentFactory(conversationId, model, provider, workingDirectory);
        if (workingDirectory) {
          this.workspacePath = workingDirectory;
          console.log(`[AgentBridge] Created conversation ${conversationId} with cwd: ${workingDirectory}`);
        }
        this.conversations.set(conversationId, {
          agent,
          isRunning: false,
          abortController: null,
          pendingFileChanges: /* @__PURE__ */ new Map()
        });
        console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || "default"}, provider: ${provider || "default"}, cwd: ${workingDirectory || "default"})`);
        return true;
      }
      // Restore message history into an existing conversation's agent context
      restoreHistory(conversationId, messages) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`[AgentBridge] restoreHistory: conversation ${conversationId} not found`);
          return false;
        }
        state.agent.restoreHistory(messages);
        console.log(`[AgentBridge] Restored ${messages.length} messages into conversation ${conversationId}`);
        return true;
      }
      // Close a conversation and cleanup
      closeConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found`);
          return false;
        }
        if (state.abortController) {
          state.abortController.abort();
        }
        for (const [toolId, pending] of this.pendingPermissionRequests.entries()) {
          if (pending.conversationId === conversationId) {
            pending.onDeny();
            this.pendingPermissionRequests.delete(toolId);
          }
        }
        for (const [requestId, pending] of this.pendingUserInputRequests.entries()) {
          if (pending.conversationId === conversationId) {
            pending.onCancel();
            this.pendingUserInputRequests.delete(requestId);
          }
        }
        this.conversations.delete(conversationId);
        if (this.workspacePath) {
          getFileHistoryManager(this.workspacePath).clearConversation(conversationId).catch((err) => {
            console.error(`[AgentBridge] Failed to clear file history for ${conversationId}:`, err);
          });
        }
        console.log(`[AgentBridge] Closed conversation: ${conversationId}`);
        return true;
      }
      // Check if conversation exists
      hasConversation(conversationId) {
        return this.conversations.has(conversationId);
      }
      // Get list of active conversation IDs
      getActiveConversations() {
        return Array.from(this.conversations.keys());
      }
      // Get a snapshot of a conversation's messages and model info for persistence
      getConversationSnapshot(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state)
          return null;
        return {
          messages: [...state.agent.messages],
          model: state.agent.config.model,
          provider: state.agent.config.provider.name
        };
      }
      // Get available models from the provider registry
      getAvailableModels() {
        if (!this.providerRegistry) {
          console.warn("[AgentBridge] No provider registry set, returning empty model list");
          return [];
        }
        try {
          const models = [];
          const registry = this.providerRegistry;
          let providers = [];
          if (typeof registry.getAvailable === "function") {
            providers = registry.getAvailable();
          } else if (registry.providers) {
            providers = Array.from(registry.providers.values());
          }
          for (const provider of providers) {
            if (!provider.isAvailable())
              continue;
            const providerModels = provider.listModels();
            for (const model of providerModels) {
              models.push({
                id: model.id,
                name: model.name || model.id,
                provider: provider.name,
                description: model.description,
                isAvailable: true,
                aliases: model.aliases
              });
            }
          }
          console.log(`[AgentBridge] Returning ${models.length} available models`);
          return models;
        } catch (error) {
          console.error("[AgentBridge] Error getting available models:", error);
          return [];
        }
      }
      getConversationIdForSession(sessionId) {
        for (const [conversationId, state] of this.conversations.entries()) {
          if (state.agent.id === sessionId) {
            return conversationId;
          }
        }
        return void 0;
      }
      async sendMessage(conversationId, message, workingDirectory, fileReferences, images) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`Conversation ${conversationId} not found`);
          throw new Error(`Conversation ${conversationId} not found`);
        }
        if (state.isRunning) {
          console.warn(`Conversation ${conversationId} is already processing`);
          return;
        }
        state.isRunning = true;
        state.abortController = new AbortController();
        state.currentAssistantMessageId = void 0;
        state.pendingFileChanges.clear();
        const workingDir = workingDirectory || this.workspacePath;
        if (workingDir) {
          this.workspacePath = workingDir;
          if (state.agent.config.cwd !== workingDir) {
            state.agent.updateConfig({ cwd: workingDir });
          }
        }
        let messageWithContext = message;
        if (fileReferences && fileReferences.length > 0) {
          const fileContext = fileReferences.filter((ref) => !ref.isDirectory && ref.content).map((ref) => `

--- File: ${ref.path} ---
${ref.content}`).join("");
          if (fileContext) {
            messageWithContext = `${message}${fileContext}`;
          }
        }
        const messageContent = images && images.length > 0 ? [
          { type: "text", text: messageWithContext },
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", mediaType: img.mediaType, data: img.data }
          }))
        ] : messageWithContext;
        const userMsgId = `user-${Date.now()}`;
        console.log(`[AgentBridge] Emitting user_message event: conversationId=${conversationId}, id=${userMsgId}, contentType=${typeof messageContent}, isArray=${Array.isArray(messageContent)}`);
        const displayContent = images && images.length > 0 ? [
          { type: "text", text: message },
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", mediaType: img.mediaType, data: img.data }
          }))
        ] : message;
        this.emitEvent(conversationId, {
          type: "user_message",
          message: {
            id: userMsgId,
            role: "user",
            content: displayContent,
            timestamp: Date.now(),
            fileReferences: fileReferences?.map(({ path: path44, name, isDirectory, extension }) => ({ path: path44, name, isDirectory, extension }))
          }
        });
        console.log(`[AgentBridge] user_message event emitted, listener count=${this.eventListeners.size}`);
        try {
          console.log(`[AgentBridge] Starting agent.run for conversation ${conversationId}${images?.length ? ` with ${images.length} image(s)` : ""}`);
          for await (const event of state.agent.run(messageContent)) {
            if (state.abortController.signal.aborted) {
              break;
            }
            const agentEvent = event;
            if (agentEvent.type === "error") {
              console.error("[AgentBridge] Agent error event:", agentEvent.error);
            }
            if (agentEvent.type === "turn_complete") {
              const stopReason = agentEvent.message.metadata?.stopReason;
              const assistantMessage = agentEvent.message;
              const assistantMessageId = assistantMessage.id;
              if (stopReason === "tool_use") {
                state.currentAssistantMessageId = assistantMessageId;
              } else {
                state.isRunning = false;
                state.currentAssistantMessageId = void 0;
                state.pendingFileChanges.clear();
                const content = assistantMessage.content;
                const messagePreview = typeof content === "string" ? content.slice(0, 100) : "New response";
                const firstUserMessage = state.agent.messages.find((m) => m.role === "user");
                const conversationTitle = firstUserMessage ? typeof firstUserMessage.content === "string" ? firstUserMessage.content.slice(0, 30) : "Chat" : "Chat";
                trayNotificationManager.notifyResponseComplete(
                  conversationId,
                  conversationTitle,
                  messagePreview,
                  false
                  // isConversationActive - will be determined by tray manager based on activeConversationId
                );
              }
            }
            if (agentEvent.type === "tool_call_start") {
              const { toolName, toolId, input } = agentEvent;
              if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
                try {
                  const filePaths = getFilePathsFromToolInput(toolName, input);
                  const changeType = getChangeType(toolName);
                  state.pendingFileChanges.set(toolId, filePaths);
                  const fileHistoryManager2 = getFileHistoryManager(workingDir);
                  for (const filePath of filePaths) {
                    await fileHistoryManager2.captureBeforeChange(
                      conversationId,
                      state.currentAssistantMessageId,
                      toolId,
                      filePath,
                      changeType
                    );
                  }
                } catch (error) {
                  console.error("[AgentBridge] Failed to capture before-change state:", error);
                }
              }
            }
            if (agentEvent.type === "tool_call_end") {
              const { toolName, toolId, result } = agentEvent;
              console.log(`[ChangeReview] tool_call_end: toolName=${toolName}, toolId=${toolId}, changeReviewEnabled=${this.changeReviewEnabled}, workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
              if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
                try {
                  const filePaths = state.pendingFileChanges.get(toolId) || [];
                  const fileHistoryManager2 = getFileHistoryManager(workingDir);
                  const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
                  console.log(`[ChangeReview] Processing tool_call_end for ${toolName}, filePaths=${JSON.stringify(filePaths)}, isError=${result.isError}`);
                  if (!result.isError) {
                    for (const filePath of filePaths) {
                      await fileHistoryManager2.captureAfterChange(
                        conversationId,
                        state.currentAssistantMessageId,
                        toolId,
                        filePath
                      );
                    }
                    const changes = await fileHistoryManager2.getMessageChanges(
                      conversationId,
                      state.currentAssistantMessageId
                    );
                    console.log(`[ChangeReview] getMessageChanges returned ${changes.length} change(s) for messageId=${state.currentAssistantMessageId}`);
                    if (changes.length > 0) {
                      this.emit("file_change", {
                        conversationId,
                        messageId: state.currentAssistantMessageId,
                        toolCallId: toolId,
                        fileChanges: changes.map((c) => ({
                          filePath: c.filePath,
                          changeType: c.changeType,
                          hasBeforeContent: !!c.beforeContent,
                          hasAfterContent: !!c.afterContent
                        }))
                      });
                      if (this.changeReviewEnabled) {
                        console.log(`[ChangeReview] Change review enabled, processing ${changes.length} change(s) for preview`);
                        const currentToolChanges = changes.filter((c) => c.toolCallId === toolId);
                        console.log(`[ChangeReview] Current tool (${toolId}) has ${currentToolChanges.length} change(s)`);
                        for (const change of currentToolChanges) {
                          const preview = await fileHistoryManager2.getChangePreview(
                            conversationId,
                            state.currentAssistantMessageId,
                            change.toolCallId
                          );
                          console.log(`[ChangeReview] getChangePreview for toolCallId=${change.toolCallId}: ${preview ? `found (${preview.filePath}, +${preview.additions}/-${preview.deletions})` : "null"}`);
                          if (preview) {
                            const pendingChange = {
                              toolCallId: preview.toolCallId,
                              messageId: preview.messageId,
                              conversationId,
                              filePath: preview.filePath,
                              fileName: preview.fileName,
                              toolName: preview.toolName,
                              changeType: preview.changeType,
                              startLine: preview.startLine,
                              endLine: preview.endLine,
                              lineCount: preview.lineCount,
                              beforeContent: change.beforeContent,
                              afterContent: change.afterContent || "",
                              diffContent: preview.diffContent,
                              beforeSnippet: preview.beforeSnippet,
                              afterSnippet: preview.afterSnippet,
                              additions: preview.additions,
                              deletions: preview.deletions,
                              status: "pending",
                              timestamp: preview.timestamp
                            };
                            changeReviewManager2.stageToolCallChange(pendingChange);
                            console.log(`[ChangeReview] Emitting change_preview for ${preview.filePath} (toolId=${change.toolCallId}, messageId=${state.currentAssistantMessageId})`);
                            this.emitEvent(conversationId, {
                              type: "change_preview",
                              conversationId,
                              message: { id: state.currentAssistantMessageId },
                              toolId: change.toolCallId,
                              filePath: preview.filePath,
                              fileName: preview.fileName,
                              toolName: preview.toolName,
                              changeType: preview.changeType,
                              startLine: preview.startLine,
                              endLine: preview.endLine,
                              lineCount: preview.lineCount,
                              diffContent: preview.diffContent,
                              beforeSnippet: preview.beforeSnippet,
                              afterSnippet: preview.afterSnippet,
                              additions: preview.additions,
                              deletions: preview.deletions,
                              status: "pending"
                            });
                          }
                        }
                      } else {
                        console.log(`[ChangeReview] Change review disabled, skipping preview emission`);
                      }
                    } else {
                      console.log(`[ChangeReview] No changes found, skipping preview emission`);
                    }
                  } else {
                    console.log(`[ChangeReview] Tool returned error, skipping change capture`);
                  }
                } catch (error) {
                  console.error("[AgentBridge] Failed to capture after-change state:", error);
                } finally {
                  state.pendingFileChanges.delete(toolId);
                }
              } else {
                if (!FILE_MODIFYING_TOOLS.includes(toolName)) {
                } else {
                  console.log(`[ChangeReview] Skipping change review: workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
                }
              }
            }
            if (agentEvent.type === "error") {
              const rawErr = agentEvent.error;
              const message2 = rawErr?.message || rawErr?.error?.message || (typeof rawErr === "string" ? rawErr : JSON.stringify(rawErr));
              const status = rawErr?.status;
              this.emitEvent(conversationId, {
                type: "error",
                error: { message: message2, ...status != null ? { status } : {} }
              });
              state.isRunning = false;
              state.currentAssistantMessageId = void 0;
              state.pendingFileChanges.clear();
            } else if (agentEvent.type === "tool_call_start" && state.currentAssistantMessageId) {
              this.emitEvent(conversationId, { ...agentEvent, messageId: state.currentAssistantMessageId });
            } else {
              this.emitEvent(conversationId, agentEvent);
            }
          }
        } catch (error) {
          console.error(`[AgentBridge] Agent error in conversation ${conversationId}:`, error);
          console.error("[AgentBridge] Error details:", {
            message: error.message,
            stack: error.stack,
            status: error.status,
            code: error.code,
            type: error.type,
            response: error.response
          });
          this.emitEvent(conversationId, {
            type: "error",
            error: { message: error.message }
          });
          state.isRunning = false;
          state.currentAssistantMessageId = void 0;
          state.pendingFileChanges.clear();
        }
      }
      abort(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for abort`);
          return;
        }
        if (state.abortController) {
          state.abortController.abort();
        }
        state.isRunning = false;
      }
      /**
       * Rollback all file changes from a specific message onwards
       * This restores files to their state before the specified message was processed
       */
      async rollbackToMessage(conversationId, messageId) {
        if (!this.workspacePath) {
          console.error("[AgentBridge] No workspace path set for rollback");
          return { success: false, restoredFiles: [], failedFiles: [] };
        }
        const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
        return await fileHistoryManager2.rollbackToMessage(conversationId, messageId);
      }
      requestPermission(sessionId, toolName, toolId, input, callbacks) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId) {
          callbacks.onDeny();
          return;
        }
        this.pendingPermissionRequests.set(toolId, {
          conversationId,
          ...callbacks
        });
        this.emitEvent(conversationId, {
          type: "permission_request",
          toolName,
          toolId,
          input
        });
      }
      respondPermission(toolId, decision) {
        const pending = this.pendingPermissionRequests.get(toolId);
        if (!pending) {
          return false;
        }
        this.pendingPermissionRequests.delete(toolId);
        if (decision === "deny") {
          pending.onDeny();
          this.emitEvent(pending.conversationId, { type: "permission_denied", toolId });
          return true;
        }
        if (decision === "allowAlways") {
          pending.onAllowAlways();
        } else {
          pending.onAllow();
        }
        this.emitEvent(pending.conversationId, { type: "permission_granted", toolId });
        return true;
      }
      requestUserInput(sessionId, requestId, prompt, terminalCommand, waitForInput, placeholder, callbacks) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId) {
          callbacks.onCancel();
          return;
        }
        this.pendingUserInputRequests.set(requestId, {
          conversationId,
          ...callbacks
        });
        this.emitEvent(conversationId, {
          type: "user_input_request",
          requestId,
          prompt,
          terminalCommand,
          waitForInput,
          placeholder
        });
      }
      respondUserInput(requestId, response, cancelled) {
        const pending = this.pendingUserInputRequests.get(requestId);
        if (!pending) {
          return false;
        }
        this.pendingUserInputRequests.delete(requestId);
        if (cancelled) {
          pending.onCancel();
          this.emitEvent(pending.conversationId, { type: "user_input_cancelled", requestId });
          return true;
        }
        pending.onResponse(response);
        this.emitEvent(pending.conversationId, { type: "user_input_responded", requestId, response });
        return true;
      }
      emitToolProgress(sessionId, toolName, toolId, message) {
        const conversationId = this.getConversationIdForSession(sessionId);
        if (!conversationId)
          return;
        this.emitEvent(conversationId, {
          type: "tool_call_progress",
          toolName,
          toolId,
          message
        });
      }
      async switchModel(conversationId, model, providerName) {
        console.log(`[AgentBridge] switchModel called: conversation=${conversationId}, model=${model}, provider=${providerName}`);
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`[AgentBridge] Conversation ${conversationId} not found`);
          return false;
        }
        try {
          let newProvider = state.agent.config.provider;
          console.log(`[AgentBridge] Current provider: ${newProvider.name}, requested: ${providerName}`);
          if (providerName && providerName !== state.agent.config.provider.name) {
            if (this.providerRegistry) {
              console.log(`[AgentBridge] Looking up provider ${providerName} in registry`);
              const resolved = this.providerRegistry.getProvider(providerName);
              console.log(`[AgentBridge] Provider ${providerName} found:`, !!resolved);
              if (resolved) {
                console.log(`[AgentBridge] Provider ${providerName} isAvailable:`, resolved.isAvailable());
              }
              if (resolved && resolved.isAvailable()) {
                newProvider = resolved;
                console.log(`[AgentBridge] Switched provider to ${providerName} for conversation ${conversationId}`);
              } else {
                console.warn(`[AgentBridge] Provider ${providerName} not available, keeping current provider`);
                if (resolved && !resolved.isAvailable()) {
                  console.warn(`[AgentBridge] Provider ${providerName} exists but is not available (check API key)`);
                }
              }
            } else {
              console.warn(`[AgentBridge] No provider registry set, cannot switch provider`);
            }
          }
          state.agent.updateConfig({
            model,
            provider: newProvider
          });
          console.log(`[AgentBridge] Switched model to ${model} for conversation ${conversationId}`);
          return true;
        } catch (error) {
          console.error(`Failed to switch model for conversation ${conversationId}:`, error);
          return false;
        }
      }
      async setMode(conversationId, mode) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`Conversation ${conversationId} not found`);
          return { success: false, mode };
        }
        try {
          const { BUILTIN_MODES: BUILTIN_MODES2 } = await Promise.resolve().then(() => (init_modes(), modes_exports));
          const modeConfig = BUILTIN_MODES2[mode];
          if (!modeConfig) {
            console.warn(`[AgentBridge] Unknown mode: ${mode}`);
            return { success: false, mode };
          }
          const updates = {};
          if (modeConfig.temperature !== void 0) {
            updates.temperature = modeConfig.temperature;
          }
          const currentSystemPrompt = state.agent.config.systemPrompt || "";
          const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug|ask) mode\.?.*/s, "");
          updates.systemPrompt = basePrompt + "\n\n" + modeConfig.systemPromptAppend;
          state.agent.updateConfig(updates);
          if (modeConfig.disabledTools || modeConfig.allowedTools) {
            const updatedTools = state.agent.config.tools.map((tool) => {
              const shouldDisable = modeConfig.disabledTools?.includes(tool.name);
              const shouldEnable = modeConfig.allowedTools?.includes(tool.name);
              if (shouldDisable) {
                return { ...tool, enabled: false };
              }
              if (modeConfig.allowedTools && !shouldEnable) {
                return { ...tool, enabled: false };
              }
              return { ...tool, enabled: true };
            });
            state.agent.updateConfig({ tools: updatedTools });
          }
          console.log(`[AgentBridge] Set mode to ${mode} for conversation ${conversationId}`);
          return { success: true, mode };
        } catch (error) {
          console.error(`[AgentBridge] Failed to set mode for conversation ${conversationId}:`, error);
          return { success: false, mode };
        }
      }
      clearConversation(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for clear`);
          return;
        }
        state.agent.clearMessages();
        if (this.workspacePath) {
          const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
          const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
          changeReviewManager2.clearConversation(conversationId);
        }
      }
      /**
       * Respond to a pending change review request
       */
      async respondToChangeReview(conversationId, messageId, toolCallId, decision) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, error: "No workspace path set for conversation" };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        if (decision === "accept") {
          const result = await changeReviewManager2.acceptToolCallChange(conversationId, toolCallId);
          if (result.success) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_accepted",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
          return result;
        } else {
          const result = await changeReviewManager2.rejectToolCallChange(conversationId, messageId, toolCallId);
          if (result.success) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_rejected",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
          return result;
        }
      }
      /**
       * Accept all pending changes for a conversation
       */
      async acceptAllChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, accepted: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        const result = await changeReviewManager2.acceptAllChanges(conversationId);
        if (result.accepted.length > 0) {
          for (const toolCallId of result.accepted) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_accepted",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
        }
        return result;
      }
      /**
       * Reject all pending changes for a conversation
       */
      async rejectAllChanges(conversationId, messageId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { success: false, rejected: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        const result = await changeReviewManager2.rejectAllChanges(conversationId, messageId);
        if (result.rejected.length > 0) {
          for (const toolCallId of result.rejected) {
            const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
            this.emitEvent(conversationId, {
              type: "change_rejected",
              toolId: toolCallId,
              filePath: pendingChange?.filePath || ""
            });
          }
        }
        return result;
      }
      /**
       * Get pending changes for a conversation
       */
      getPendingChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return [];
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.getPendingChanges(conversationId);
      }
      /**
       * Get change summary for a conversation
       */
      getChangeSummary(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return { totalPending: 0, totalAccepted: 0, totalRejected: 0 };
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.getChangeSummary(conversationId);
      }
      /**
       * Check if there are pending changes for a conversation
       */
      hasPendingChanges(conversationId) {
        const workingDir = this.getWorkspacePathForConversation(conversationId);
        if (!workingDir) {
          return false;
        }
        const fileHistoryManager2 = getFileHistoryManager(workingDir);
        const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
        return changeReviewManager2.hasPendingChanges(conversationId);
      }
      /**
       * Truncate conversation messages to a specific index
       * Keeps messages from 0 to messageIndex (inclusive)
       * @returns true if successful, false if conversation not found
       */
      truncateMessages(conversationId, messageIndex) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`[AgentBridge] Conversation ${conversationId} not found for truncate`);
          return false;
        }
        const currentMessages = state.agent.messages;
        if (messageIndex < 0 || messageIndex >= currentMessages.length) {
          console.warn(`[AgentBridge] Invalid message index ${messageIndex} for conversation with ${currentMessages.length} messages`);
          return false;
        }
        const truncatedMessages = currentMessages.slice(0, messageIndex + 1);
        state.agent.clearMessages();
        const agentWithAddMessage = state.agent;
        if (typeof agentWithAddMessage.addMessage === "function") {
          for (const msg of truncatedMessages) {
            agentWithAddMessage.addMessage(msg);
          }
        } else {
          const agentWithInternal = state.agent;
          if (agentWithInternal._messages) {
            agentWithInternal._messages.push(...truncatedMessages);
          } else {
            console.error("[AgentBridge] Cannot add messages - no addMessage method or _messages array available");
            return false;
          }
        }
        console.log(`[AgentBridge] Truncated conversation ${conversationId} to ${truncatedMessages.length} messages (removed ${currentMessages.length - truncatedMessages.length})`);
        return true;
      }
      onEvent(callback) {
        this.eventListeners.add(callback);
        return () => this.eventListeners.delete(callback);
      }
      emitEvent(conversationId, event) {
        const eventWithId = { ...event, conversationId };
        const windows = import_electron8.BrowserWindow.getAllWindows();
        if (event.type === "user_message") {
          console.log(`[AgentBridge.emitEvent] user_message: broadcasting to ${windows.length} window(s), ${this.eventListeners.size} listener(s), conversationId=${conversationId}`);
        }
        windows.forEach((window) => {
          window.webContents.send("agent:event", eventWithId);
        });
        this.eventListeners.forEach((listener) => listener(eventWithId));
      }
      // General event emitter for non-agent events (like file_change)
      emit(eventName, data) {
        const event = {
          type: "file_change",
          ...data
        };
        const eventWithId = { ...event, conversationId: data.conversationId };
        import_electron8.BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send("agent:event", eventWithId);
        });
        this.eventListeners.forEach((listener) => listener(eventWithId));
      }
      isProcessing(conversationId) {
        const state = this.conversations.get(conversationId);
        return state ? state.isRunning : false;
      }
      async getTokenCount(conversationId) {
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.warn(`Conversation ${conversationId} not found for getTokenCount`);
          return 0;
        }
        const agent = state.agent;
        if (typeof agent.getTokenCount === "function") {
          return await agent.getTokenCount();
        }
        return 0;
      }
    };
    agentBridge = new AgentBridge();
  }
});

// main/remote-auth.ts
var remote_auth_exports = {};
__export(remote_auth_exports, {
  createProxySession: () => createProxySession,
  ensureApiKey: () => ensureApiKey,
  generateApiKey: () => generateApiKey,
  getApiKey: () => getApiKey,
  getCorsOptions: () => getCorsOptions,
  regenerateApiKey: () => regenerateApiKey,
  validateApiKey: () => validateApiKey,
  validateIp: () => validateIp,
  validateProxySessionToken: () => validateProxySessionToken,
  validateRequestSignature: () => validateRequestSignature
});
function createProxySession(port2) {
  const token = (0, import_node_crypto3.randomBytes)(32).toString("hex");
  proxySessionStore.set(token, { port: port2, expiresAt: Date.now() + 60 * 60 * 1e3 });
  for (const [key, val] of proxySessionStore) {
    if (val.expiresAt < Date.now())
      proxySessionStore.delete(key);
  }
  return token;
}
function validateProxySessionToken(token) {
  const session = proxySessionStore.get(token);
  if (!session)
    return false;
  if (session.expiresAt < Date.now()) {
    proxySessionStore.delete(token);
    return false;
  }
  return true;
}
function validateApiKey(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({ error: "Missing API key. Include X-API-Key header." });
    return;
  }
  const storedKey = settingsManager.get("remoteAccess.apiKey");
  if (!storedKey) {
    res.status(500).json({ error: "Server not properly configured. API key not set." });
    return;
  }
  if (!timingSafeEqual2(apiKey, storedKey)) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }
  next();
}
function generateApiKey() {
  return (0, import_node_crypto3.randomBytes)(32).toString("hex");
}
function ensureApiKey() {
  let apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    apiKey = generateApiKey();
    settingsManager.set("remoteAccess.apiKey", apiKey);
    console.log("[RemoteAuth] Generated new API key for remote access");
  }
  return apiKey;
}
function getApiKey() {
  return settingsManager.get("remoteAccess.apiKey");
}
function regenerateApiKey() {
  const newKey = generateApiKey();
  settingsManager.set("remoteAccess.apiKey", newKey);
  console.log("[RemoteAuth] Regenerated API key for remote access");
  return newKey;
}
function getCorsOptions() {
  const allowedOrigins = settingsManager.get("remoteAccess.allowedOrigins");
  const origin = allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  return {
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key", "Authorization"],
    credentials: true
  };
}
function validateIp(req, res, next) {
  next();
}
function validateRequestSignature(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!timestamp || !signature) {
    res.status(401).json({ error: "Missing X-Timestamp or X-Signature headers." });
    return;
  }
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1e3) {
    res.status(401).json({ error: "Request timestamp is expired or invalid." });
    return;
  }
  const apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    res.status(500).json({ error: "Server not properly configured." });
    return;
  }
  const signingString = `${req.method}
${req.originalUrl}
${timestamp}`;
  const expected = crypto2.createHmac("sha256", apiKey).update(signingString).digest("hex");
  console.log("[SignatureDebug] Server signing string:", JSON.stringify(signingString));
  console.log("[SignatureDebug] Server expected sig:", expected.substring(0, 16) + "...");
  console.log("[SignatureDebug] Client sent sig:", signature.substring(0, 16) + "...");
  if (!timingSafeEqual2(signature, expected)) {
    res.status(401).json({ error: "Invalid request signature.", debug: { serverString: signingString } });
    return;
  }
  next();
}
function timingSafeEqual2(a, b) {
  if (a.length !== b.length) {
    const bufA2 = Buffer.from(a);
    const bufB2 = Buffer.alloc(bufA2.length, 0);
    crypto2.timingSafeEqual(bufA2, bufB2);
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto2.timingSafeEqual(bufA, bufB);
}
var import_node_crypto3, crypto2, proxySessionStore;
var init_remote_auth = __esm({
  "main/remote-auth.ts"() {
    "use strict";
    import_node_crypto3 = require("crypto");
    init_settings();
    crypto2 = __toESM(require("crypto"), 1);
    proxySessionStore = /* @__PURE__ */ new Map();
  }
});

// main/remote-event-emitter.ts
function initializeEventEmitter() {
  if (unsubscribe) {
    return;
  }
  unsubscribe = agentBridge.onEvent((event) => {
    broadcastEvent(event);
  });
  console.log("[RemoteEventEmitter] Initialized and subscribed to AgentBridge events");
}
function cleanupEventEmitter() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    Array.from(responseSet).forEach((res) => {
      try {
        res.end();
      } catch {
      }
    });
    responseSet.clear();
  });
  connections.clear();
  console.log("[RemoteEventEmitter] Cleaned up all connections");
}
function registerConnection(conversationId, res) {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, /* @__PURE__ */ new Set());
  }
  const responseSet = connections.get(conversationId);
  responseSet.add(res);
  console.log(`[RemoteEventEmitter] Registered connection for conversation ${conversationId}`);
  res.on("close", () => {
    unregisterConnection(conversationId, res);
  });
  res.on("error", () => {
    unregisterConnection(conversationId, res);
  });
}
function unregisterConnection(conversationId, res) {
  const responseSet = connections.get(conversationId);
  if (responseSet) {
    responseSet.delete(res);
    if (responseSet.size === 0) {
      connections.delete(conversationId);
    }
    console.log(`[RemoteEventEmitter] Unregistered connection for conversation ${conversationId}`);
  }
}
function broadcastEvent(event) {
  const { conversationId, ...eventData } = event;
  const responseSet = connections.get(conversationId);
  if (!responseSet || responseSet.size === 0) {
    console.log(`[RemoteEventEmitter] Event ${event.type} has no SSE connections for conversation ${conversationId}. Active conversations: [${Array.from(connections.keys()).join(", ")}]`);
    return;
  }
  console.log(`[RemoteEventEmitter] Broadcasting ${event.type} to ${responseSet.size} SSE connection(s) for conversation ${conversationId}`);
  const sseData = `data: ${JSON.stringify(eventData)}

`;
  Array.from(responseSet).forEach((res) => {
    try {
      const ok = res.write(sseData);
      if (!ok) {
        console.warn(`[RemoteEventEmitter] Backpressure on SSE write for ${event.type} (conversation ${conversationId}) \u2014 buffer full`);
      }
    } catch (error) {
      console.error(`[RemoteEventEmitter] Failed to send event to conversation ${conversationId}:`, error);
      responseSet.delete(res);
    }
  });
}
function getConnectionStats() {
  let totalConnections = 0;
  const conversationIds = [];
  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    conversationIds.push(conversationId);
    totalConnections += responseSet.size;
  });
  return {
    totalConversations: connections.size,
    totalConnections,
    conversations: conversationIds
  };
}
var connections, unsubscribe;
var init_remote_event_emitter = __esm({
  "main/remote-event-emitter.ts"() {
    "use strict";
    init_agent_bridge();
    connections = /* @__PURE__ */ new Map();
    unsubscribe = null;
  }
});

// main/remote-ws.ts
function authenticateUpgrade(req) {
  const apiKey = req.headers["x-api-key"];
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!apiKey || !timestamp || !signature)
    return false;
  const storedKey = settingsManager.get("remoteAccess.apiKey");
  if (!storedKey)
    return false;
  if (!timingSafeEqual4(apiKey, storedKey))
    return false;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1e3)
    return false;
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathWithQuery = url.pathname + (url.search || "");
  const signingString = `GET
${pathWithQuery}
${timestamp}`;
  const expected = crypto3.createHmac("sha256", storedKey).update(signingString).digest("hex");
  return timingSafeEqual4(signature, expected);
}
function timingSafeEqual4(a, b) {
  if (a.length !== b.length) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.alloc(bufA.length, 0);
    crypto3.timingSafeEqual(bufA, bufB);
    return false;
  }
  return crypto3.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function broadcastAgentEvent(event) {
  const { conversationId, ...eventData } = event;
  const clients = agentClients.get(conversationId);
  if (!clients || clients.size === 0)
    return;
  const payload = JSON.stringify(eventData);
  Array.from(clients).forEach((client) => {
    if (client.ws.readyState === import_ws.WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}
function handleClientMessage(client, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    client.ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
    return;
  }
  if (msg.type === "subscribe") {
    if (msg.channel === "agent" && msg.conversationId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);
      client.agentSubscription = msg.conversationId;
      if (!agentClients.has(msg.conversationId)) {
        agentClients.set(msg.conversationId, /* @__PURE__ */ new Set());
      }
      agentClients.get(msg.conversationId).add(client);
      client.ws.send(JSON.stringify({ type: "subscribed", channel: "agent", conversationId: msg.conversationId }));
      console.log(`[RemoteWS] Client subscribed to agent conversation ${msg.conversationId}`);
    } else if (msg.channel === "terminal" && msg.terminalId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);
      client.terminalSubscription = msg.terminalId;
      const buffered = getTerminalBuffer(msg.terminalId);
      if (buffered.length > 0) {
        client.ws.send(JSON.stringify({ type: "stream_delta", delta: { text: buffered } }));
      }
      const cb = (data) => {
        if (client.ws.readyState === import_ws.WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: "stream_delta", delta: { text: data } }));
        }
      };
      client.terminalCallback = cb;
      registerTerminalCallback(msg.terminalId, cb);
      client.ws.send(JSON.stringify({ type: "subscribed", channel: "terminal", terminalId: msg.terminalId }));
      console.log(`[RemoteWS] Client subscribed to terminal ${msg.terminalId}`);
    }
  } else if (msg.type === "unsubscribe") {
    unsubscribeFromAgent(client);
    unsubscribeFromTerminal(client);
    client.ws.send(JSON.stringify({ type: "unsubscribed" }));
  }
}
function unsubscribeFromAgent(client) {
  if (client.agentSubscription) {
    const set = agentClients.get(client.agentSubscription);
    if (set) {
      set.delete(client);
      if (set.size === 0)
        agentClients.delete(client.agentSubscription);
    }
    client.agentSubscription = void 0;
  }
}
function unsubscribeFromTerminal(client) {
  if (client.terminalSubscription && client.terminalCallback) {
    unregisterTerminalCallback(client.terminalSubscription, client.terminalCallback);
    client.terminalSubscription = void 0;
    client.terminalCallback = void 0;
  }
}
function removeClient(client) {
  unsubscribeFromAgent(client);
  unsubscribeFromTerminal(client);
  allClients.delete(client);
}
function initializeWebSocketServer(httpServer) {
  if (wss)
    return;
  wss = new import_ws.WebSocketServer({
    noServer: true
  });
  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/api/ws") {
      socket.destroy();
      return;
    }
    if (!authenticateUpgrade(req)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      console.log("[RemoteWS] Rejected unauthenticated WebSocket upgrade");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
  wss.on("connection", (ws) => {
    const client = { ws, alive: true };
    allClients.add(client);
    console.log(`[RemoteWS] Client connected (total: ${allClients.size})`);
    ws.on("pong", () => {
      client.alive = true;
    });
    ws.on("message", (data) => {
      handleClientMessage(client, data.toString());
    });
    ws.on("close", () => {
      removeClient(client);
      console.log(`[RemoteWS] Client disconnected (total: ${allClients.size})`);
    });
    ws.on("error", () => {
      removeClient(client);
    });
  });
  pingInterval = setInterval(() => {
    Array.from(allClients).forEach((client) => {
      if (!client.alive) {
        console.log("[RemoteWS] Terminating unresponsive client");
        client.ws.terminate();
        removeClient(client);
        return;
      }
      client.alive = false;
      client.ws.ping();
    });
  }, 25e3);
  unsubscribeAgent = agentBridge.onEvent((event) => {
    broadcastAgentEvent(event);
  });
  console.log("[RemoteWS] WebSocket server initialized");
}
function cleanupWebSocketServer() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (unsubscribeAgent) {
    unsubscribeAgent();
    unsubscribeAgent = null;
  }
  Array.from(allClients).forEach((client) => {
    try {
      client.ws.close(1001, "Server shutting down");
    } catch {
    }
  });
  allClients.clear();
  agentClients.clear();
  if (wss) {
    wss.close();
    wss = null;
  }
  console.log("[RemoteWS] WebSocket server cleaned up");
}
var import_ws, crypto3, wss, unsubscribeAgent, pingInterval, agentClients, allClients;
var init_remote_ws = __esm({
  "main/remote-ws.ts"() {
    "use strict";
    import_ws = require("ws");
    crypto3 = __toESM(require("crypto"), 1);
    init_settings();
    init_agent_bridge();
    init_terminal_manager();
    wss = null;
    unsubscribeAgent = null;
    pingInterval = null;
    agentClients = /* @__PURE__ */ new Map();
    allClients = /* @__PURE__ */ new Set();
  }
});

// main/remote-server.ts
var remote_server_exports = {};
__export(remote_server_exports, {
  destructiveLimiter: () => destructiveLimiter,
  getRemoteServerStatus: () => getRemoteServerStatus,
  initializeRemoteServer: () => initializeRemoteServer,
  stopRemoteServer: () => stopRemoteServer,
  writeLimiter: () => writeLimiter
});
function resolveWorkingDirectory(req) {
  const workspaceId = req.query.workspaceId || req.body?.workspaceId;
  if (workspaceId) {
    const cwd = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
    if (cwd)
      return cwd;
  }
  return getSharedWorkspaceManager().getActiveWorkingDirectory() ?? getWorkingDirectory();
}
function resolveAndSandbox(inputPath, fallbackCwd) {
  const resolved = path31.resolve(
    path31.isAbsolute(inputPath) ? inputPath : path31.join(fallbackCwd, inputPath)
  );
  const allowedBases = getSharedWorkspaceManager().getSharedWorkspaces().flatMap((ws) => ws.folders.map((f) => path31.resolve(f.path)));
  const allowed = allowedBases.some(
    (base) => resolved === base || resolved.startsWith(base + path31.sep)
  );
  if (!allowed) {
    const err = new Error("Access denied: path is outside allowed workspace directories");
    err.status = 403;
    throw err;
  }
  return resolved;
}
function assertWithinHomeDir(dirPath) {
  const resolved = path31.resolve(dirPath);
  const home = os4.homedir();
  if (!resolved.startsWith(home + path31.sep) && resolved !== home) {
    const err = new Error("Folder path must be within the user home directory");
    err.status = 403;
    throw err;
  }
}
function sendRouteError(res, error) {
  const err = error;
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}
function deriveConversationTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser)
    return "Remote Conversation";
  const text = typeof firstUser.content === "string" ? firstUser.content : String(firstUser.content);
  return text.length > 60 ? text.slice(0, 60).trim() + "\u2026" : text.trim();
}
async function initializeRemoteServer() {
  if (isRunning) {
    return {
      success: true,
      url: publicUrl || void 0,
      apiKey: getApiKey() || void 0
    };
  }
  try {
    port = settingsManager.get("remoteAccess.port") || 3e3;
    const providerType = settingsManager.get("remoteAccess.tunnelProvider") || "ngrok";
    const ngrokAuthToken = settingsManager.get("remoteAccess.ngrokAuthToken");
    const cloudflaredToken = settingsManager.get("remoteAccess.cloudflaredToken");
    const apiKey = ensureApiKey();
    app3 = (0, import_express.default)();
    setupMiddleware(app3);
    setupRoutes(app3);
    autoSaveUnsubscribe = agentBridge.onEvent(async (event) => {
      if (event.type !== "turn_complete")
        return;
      const stopReason = event.message?.metadata?.stopReason;
      if (stopReason === "tool_use")
        return;
      const meta = remoteConversationMeta.get(event.conversationId);
      if (!meta)
        return;
      const snapshot = agentBridge.getConversationSnapshot(event.conversationId);
      console.log(`[RemoteServer] Auto-save snapshot: conversationId=${event.conversationId}, messages=${snapshot?.messages.length ?? 0}, roles=${snapshot?.messages.map((m) => m.role).join(",") ?? "none"}`);
      if (!snapshot || snapshot.messages.length === 0)
        return;
      try {
        await getChatStorage().saveConversation(meta.workspacePath, {
          id: event.conversationId,
          title: deriveConversationTitle(snapshot.messages),
          messages: snapshot.messages,
          toolCalls: [],
          createdAt: meta.createdAt,
          updatedAt: Date.now(),
          isProcessing: false,
          streamingContent: "",
          orchestrationStatus: null,
          model: snapshot.model,
          provider: snapshot.provider
        });
        console.log(`[RemoteServer] Auto-saved conversation ${event.conversationId} to ${meta.workspacePath}`);
      } catch (err) {
        console.error(`[RemoteServer] Failed to auto-save conversation ${event.conversationId}:`, err);
      }
    });
    await new Promise((resolve12, reject) => {
      server = app3.listen(port, () => {
        console.log(`[RemoteServer] Express server running on port ${port}`);
        resolve12();
      });
      server.on("error", (error) => {
        reject(error);
      });
    });
    try {
      tunnelProvider = createTunnelProvider({
        tunnelProvider: providerType,
        ngrokAuthToken: ngrokAuthToken || void 0,
        cloudflaredToken: cloudflaredToken || void 0
      });
      publicUrl = await tunnelProvider.start(port);
      console.log(`[RemoteServer] Tunnel established via ${providerType}: ${publicUrl}`);
    } catch (error) {
      console.error(`[RemoteServer] Failed to create ${providerType} tunnel:`, error);
      publicUrl = `http://localhost:${port}`;
      tunnelProvider = null;
    }
    initializeEventEmitter();
    initializeWebSocketServer(server);
    isRunning = true;
    console.log("[RemoteServer] Remote access ready");
    console.log(`[RemoteServer] URL: ${publicUrl}`);
    console.log(`[RemoteServer] API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`);
    return {
      success: true,
      url: publicUrl || void 0,
      apiKey
    };
  } catch (error) {
    console.error("[RemoteServer] Failed to initialize:", error);
    await cleanup();
    return {
      success: false,
      error: error.message
    };
  }
}
async function stopRemoteServer() {
  if (!isRunning) {
    return { success: true };
  }
  try {
    await cleanup();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
function getRemoteServerStatus() {
  return {
    running: isRunning,
    url: publicUrl,
    apiKey: getApiKey(),
    port,
    connections: getConnectionStats()
  };
}
async function cleanup() {
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }
  remoteConversationMeta.clear();
  cleanupEventEmitter();
  cleanupWebSocketServer();
  if (tunnelProvider) {
    await tunnelProvider.stop();
    tunnelProvider = null;
  }
  if (server) {
    await new Promise((resolve12) => {
      server.close(() => {
        resolve12();
      });
    });
    server = null;
  }
  app3 = null;
  isRunning = false;
  publicUrl = null;
  terminalOutputs.clear();
  registeredProxyPorts.clear();
  console.log("[RemoteServer] Server stopped");
}
function setupMiddleware(app6) {
  app6.use(import_express.default.json({ limit: "10mb" }));
  app6.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
  const corsOptions = getCorsOptions();
  app6.use((0, import_cors.default)(corsOptions));
  const rateLimitWindowMs = settingsManager.get("remoteAccess.rateLimitWindowMs") || 15 * 60 * 1e3;
  const rateLimitMax = settingsManager.get("remoteAccess.rateLimitRequests") || 100;
  const limiter = (0, import_express_rate_limit.default)({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many requests, please try again later." });
    }
  });
  app6.use(limiter);
}
function setupRoutes(app6) {
  app6.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      running: isRunning,
      url: publicUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app6.get("/api/sse-test", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    let count = 0;
    const interval = setInterval(() => {
      count++;
      res.write(`data: ${JSON.stringify({ count, ts: Date.now() })}

`);
      if (count >= 30) {
        clearInterval(interval);
        res.end();
      }
    }, 1e3);
    res.on("close", () => clearInterval(interval));
  });
  app6.use("/api", validateApiKey);
  app6.use("/api", validateRequestSignature);
  setupConfigRoutes(app6);
  setupWorkspaceRoutes(app6);
  setupChatRoutes(app6);
  setupAgentRoutes(app6);
  setupFileRoutes(app6);
  setupTerminalRoutes(app6);
  setupToolRoutes(app6);
  setupGitRoutes(app6);
  setupProxyRoutes(app6);
  setupAdbRoutes(app6);
  setupIosRoutes(app6);
  app6.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app6.use((err, _req, res, _next) => {
    console.error("[RemoteServer] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
}
function setupConfigRoutes(app6) {
  app6.get("/api/config", async (_req, res) => {
    try {
      const models = agentBridge.getActiveConversations();
      const sharedWM = getSharedWorkspaceManager();
      res.json({
        models,
        workingDirectory: sharedWM.getActiveWorkingDirectory() ?? getWorkingDirectory(),
        activeWorkspaceId: sharedWM.getActiveWorkspace()?.sharedId ?? null,
        version: process.env.npm_package_version || "unknown"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/models", async (_req, res) => {
    try {
      const models = getConfigModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/providers", async (_req, res) => {
    try {
      const providers = getConfigProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupWorkspaceRoutes(app6) {
  app6.get("/api/workspaces", (_req, res) => {
    try {
      const workspaces = getSharedWorkspaceManager().getSharedWorkspaces();
      const activeId = getSharedWorkspaceManager().getActiveWorkspace()?.sharedId ?? null;
      res.json({ workspaces, activeWorkspaceId: activeId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/workspaces/:workspaceId", (req, res) => {
    try {
      const workspace = getSharedWorkspaceManager().getWorkspaceById(req.params.workspaceId);
      if (!workspace) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      res.json({ workspace });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/workspaces/active", (req, res) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const success = getSharedWorkspaceManager().setActiveWorkspace(workspaceId);
      if (!success) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      res.json({ success: true, workspaceId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/workspaces", async (req, res) => {
    console.log("[POST /api/workspaces] Request body:", JSON.stringify(req.body));
    try {
      const { name, folders } = req.body;
      if (!name || !name.trim()) {
        console.warn("[POST /api/workspaces] Missing workspace name");
        res.status(400).json({ error: "Missing workspace name" });
        return;
      }
      if (!folders || !Array.isArray(folders) || folders.length === 0) {
        console.warn("[POST /api/workspaces] No folders provided");
        res.status(400).json({ error: "At least one folder path is required" });
        return;
      }
      for (const folderPath of folders) {
        try {
          assertWithinHomeDir(folderPath.trim());
        } catch (guardErr) {
          console.warn(`[POST /api/workspaces] Path rejected: ${folderPath.trim()}`);
          sendRouteError(res, guardErr);
          return;
        }
      }
      for (const folderPath of folders) {
        console.log(`[POST /api/workspaces] Ensuring folder exists: ${folderPath.trim()}`);
        await fs31.mkdir(folderPath.trim(), { recursive: true });
        console.log(`[POST /api/workspaces] Folder ready: ${folderPath.trim()}`);
      }
      console.log(`[POST /api/workspaces] Creating workspace "${name.trim()}" with ${folders.length} folder(s)`);
      const workspace = await getSharedWorkspaceManager().createWorkspaceFromFolders(name.trim(), folders);
      if (!workspace) {
        console.error("[POST /api/workspaces] createWorkspaceFromFolders returned null");
        res.status(500).json({ error: "Failed to create workspace" });
        return;
      }
      console.log(`[POST /api/workspaces] Created workspace: sharedId=${workspace.sharedId}, name=${workspace.name}`);
      res.status(201).json({ success: true, workspace });
    } catch (error) {
      console.error("[POST /api/workspaces] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/projects", async (req, res) => {
    console.log("[POST /api/projects] Request body:", JSON.stringify(req.body));
    try {
      const { folderPath, name } = req.body;
      if (!folderPath || !folderPath.trim()) {
        console.warn("[POST /api/projects] Missing folderPath");
        res.status(400).json({ error: "Missing folderPath" });
        return;
      }
      try {
        assertWithinHomeDir(folderPath.trim());
      } catch (guardErr) {
        console.warn(`[POST /api/projects] Path rejected: ${folderPath.trim()}`);
        sendRouteError(res, guardErr);
        return;
      }
      console.log(`[POST /api/projects] Ensuring folder exists: ${folderPath.trim()}`);
      await fs31.mkdir(folderPath.trim(), { recursive: true });
      console.log(`[POST /api/projects] Folder ready: ${folderPath.trim()}`);
      const workspace = await getSharedWorkspaceManager().addFolder(folderPath.trim(), name?.trim());
      if (!workspace) {
        console.error(`[POST /api/projects] addFolder returned null for path: ${folderPath.trim()}`);
        res.status(500).json({ error: "Failed to create project" });
        return;
      }
      console.log(`[POST /api/projects] Created project: sharedId=${workspace.sharedId}, name=${workspace.name}`);
      res.status(201).json({ success: true, workspace });
    } catch (error) {
      console.error("[POST /api/projects] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.delete("/api/workspaces/:workspaceId", async (req, res) => {
    console.log(`[DELETE /api/workspaces] workspaceId=${req.params.workspaceId}`);
    try {
      const removed = await getSharedWorkspaceManager().removeWorkspace(req.params.workspaceId);
      if (!removed) {
        console.warn(`[DELETE /api/workspaces] Not found: ${req.params.workspaceId}`);
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      console.log(`[DELETE /api/workspaces] Removed: ${req.params.workspaceId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[DELETE /api/workspaces] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
function setupChatRoutes(app6) {
  app6.get("/api/chat/list", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      const result = await getChatStorage().listConversations(workspacePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/chat/load/:conversationId", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: "Missing workspaceId" });
        return;
      }
      const workspacePath = getSharedWorkspaceManager().getWorkingDirectory(workspaceId);
      if (!workspacePath) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      const result = await getChatStorage().loadConversations(workspacePath);
      const conversation = result.conversations?.find(
        (c) => c.id === req.params.conversationId
      ) ?? null;
      if (!conversation) {
        console.log(`[RemoteServer] loadConversation: NOT FOUND id=${req.params.conversationId}, available ids=[${result.conversations?.map((c) => c.id).join(", ")}]`);
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const msgRoles = (conversation.messages ?? []).map((m) => m.role).join(",");
      console.log(`[RemoteServer] loadConversation: found id=${conversation.id}, messageCount=${(conversation.messages ?? []).length}, roles=${msgRoles}`);
      res.json({ conversation });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupAgentRoutes(app6) {
  app6.post("/api/agent/create-conversation", async (req, res) => {
    try {
      const { conversationId, model, provider, workingDirectory, mode } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      const success = agentBridge.createConversation(conversationId, model, provider, resolvedCwd);
      if (success) {
        remoteConversationMeta.set(conversationId, {
          workspacePath: resolvedCwd,
          model,
          provider,
          createdAt: Date.now()
        });
        if (mode) {
          await agentBridge.setMode(conversationId, mode);
          console.log(`[RemoteServer] Applied mode '${mode}' to conversation ${conversationId}`);
        }
        res.json({ success: true, conversationId });
      } else {
        res.status(400).json({ error: "Failed to create conversation" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/send-message", async (req, res) => {
    try {
      const { conversationId, message, workingDirectory, fileReferences, images } = req.body;
      if (!conversationId || !message) {
        res.status(400).json({ error: "Missing conversationId or message" });
        return;
      }
      console.log(`[RemoteServer] Send message: conversationId=${conversationId}, messageLength=${message?.length || 0}, fileReferences=${fileReferences?.length || 0}, images=${images?.length || 0}`);
      if (images && images.length > 0) {
        images.forEach((img, idx) => {
          console.log(`[RemoteServer] Image ${idx}: mediaType=${img.mediaType}, dataLength=${img.data?.length || 0}`);
        });
      }
      const resolvedCwd = workingDirectory || resolveWorkingDirectory(req);
      agentBridge.sendMessage(conversationId, message, resolvedCwd, fileReferences, images).catch((error) => {
        console.error(`[RemoteServer] Error sending message to ${conversationId}:`, error);
      });
      res.json({ success: true, conversationId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/abort", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      agentBridge.abort(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/close-conversation", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const success = agentBridge.closeConversation(conversationId);
      remoteConversationMeta.delete(conversationId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/conversations", async (_req, res) => {
    try {
      const conversations = agentBridge.getActiveConversations();
      res.json({ conversations });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/events", async (req, res) => {
    const conversationId = req.query.conversationId;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    if (conversationId) {
      registerConnection(conversationId, res);
    }
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}

`);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
    });
  });
  app6.post("/api/agent/respond-permission", async (req, res) => {
    try {
      const { toolId, decision } = req.body;
      if (!toolId || !decision) {
        res.status(400).json({ error: "Missing toolId or decision" });
        return;
      }
      const success = agentBridge.respondPermission(toolId, decision);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/respond-user-input", async (req, res) => {
    try {
      const { requestId, response, cancelled } = req.body;
      if (!requestId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
      }
      const success = agentBridge.respondUserInput(requestId, response || "", cancelled || false);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/switch-model", async (req, res) => {
    try {
      const { conversationId, model, provider } = req.body;
      if (!conversationId || !model || !provider) {
        res.status(400).json({ error: "Missing conversationId, model, or provider" });
        return;
      }
      const success = await agentBridge.switchModel(conversationId, model, provider);
      if (success) {
        console.log(`[RemoteServer] Switched model to ${model} (${provider}) for conversation ${conversationId}`);
        res.json({ success: true, conversationId, model, provider });
      } else {
        res.status(404).json({ error: "Conversation not found or model switch failed" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-mode", async (req, res) => {
    try {
      const { conversationId, mode } = req.body;
      if (!conversationId || !mode) {
        res.status(400).json({ error: "Missing conversationId or mode" });
        return;
      }
      const result = await agentBridge.setMode(conversationId, mode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-change-review", async (req, res) => {
    try {
      const { enabled } = req.body;
      if (enabled === void 0) {
        res.status(400).json({ error: "Missing enabled parameter" });
        return;
      }
      agentBridge.setChangeReviewEnabled(enabled);
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/agent/change-review-status", async (_req, res) => {
    try {
      const settings = await agentBridge.getChangeReviewSetting();
      res.json({
        enabled: settings.enabled,
        mode: settings.mode
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/set-change-review/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      if (!mode || !["all", "dangerous"].includes(mode)) {
        res.status(400).json({ error: 'Invalid mode. Must be "all" or "dangerous"' });
        return;
      }
      await agentBridge.setChangeReviewMode(mode);
      res.json({ success: true, mode });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/changes/pending", async (req, res) => {
    try {
      const conversationId = req.query.conversationId;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId query parameter" });
        return;
      }
      const pendingChanges = agentBridge.getPendingChanges(conversationId);
      const summary = agentBridge.getChangeSummary(conversationId);
      res.json({
        conversationId,
        pendingChanges,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/respond", async (req, res) => {
    try {
      const { conversationId, messageId, toolCallId, decision } = req.body;
      if (!conversationId || !messageId || !toolCallId || !decision) {
        res.status(400).json({ error: "Missing conversationId, messageId, toolCallId, or decision" });
        return;
      }
      if (decision !== "accept" && decision !== "reject") {
        res.status(400).json({ error: 'Invalid decision. Must be "accept" or "reject"' });
        return;
      }
      const result = await agentBridge.respondToChangeReview(conversationId, messageId, toolCallId, decision);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/accept-all", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const result = await agentBridge.acceptAllChanges(conversationId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/changes/reject-all", async (req, res) => {
    try {
      const { conversationId, messageId } = req.body;
      if (!conversationId || !messageId) {
        res.status(400).json({ error: "Missing conversationId or messageId" });
        return;
      }
      const result = await agentBridge.rejectAllChanges(conversationId, messageId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/agent/truncate-messages", async (req, res) => {
    try {
      const { conversationId, messageIndex } = req.body;
      if (!conversationId || messageIndex === void 0) {
        res.status(400).json({ error: "Missing conversationId or messageIndex" });
        return;
      }
      const index = parseInt(messageIndex, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ error: "Invalid messageIndex" });
        return;
      }
      const success = agentBridge.truncateMessages(conversationId, index);
      if (success) {
        res.json({ success: true, messageIndex: index });
      } else {
        res.status(404).json({ error: "Conversation not found or invalid message index" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupFileRoutes(app6) {
  app6.get("/api/files/read", async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const content = await fs31.readFile(resolvedPath, "utf-8");
      res.json({ content, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/write", writeLimiter, async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === void 0) {
        res.status(400).json({ error: "Missing path or content" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      await fs31.mkdir(path31.dirname(resolvedPath), { recursive: true });
      await fs31.writeFile(resolvedPath, content, "utf-8");
      const written = await fs31.readFile(resolvedPath, "utf-8");
      if (written !== content) {
        res.status(500).json({ error: "Write verification failed" });
        return;
      }
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/edit", writeLimiter, async (req, res) => {
    try {
      const { path: filePath, oldString, newString } = req.body;
      if (!filePath || oldString === void 0 || newString === void 0) {
        res.status(400).json({ error: "Missing path, oldString, or newString" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const content = await fs31.readFile(resolvedPath, "utf-8");
      if (!content.includes(oldString)) {
        res.status(400).json({ error: "Old string not found in file" });
        return;
      }
      const newContent = content.replace(oldString, newString);
      await fs31.writeFile(resolvedPath, newContent, "utf-8");
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/list", async (req, res) => {
    try {
      const cwd = resolveWorkingDirectory(req);
      const dirPath = req.query.path || cwd;
      const resolvedPath = resolveAndSandbox(dirPath, cwd);
      const entries = await fs31.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.filter((entry) => !entry.name.startsWith(".")).map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path31.join(resolvedPath, entry.name)
      }));
      res.json({ files, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/download", async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const stat10 = await fs31.stat(resolvedPath);
      if (!stat10.isFile()) {
        res.status(400).json({ error: "Path is not a file" });
        return;
      }
      const fileName = path31.basename(resolvedPath);
      const ext = path31.extname(fileName).toLowerCase();
      const mimeTypes = {
        ".apk": "application/vnd.android.package-archive",
        ".zip": "application/zip",
        ".tar": "application/x-tar",
        ".gz": "application/gzip",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".pdf": "application/pdf"
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", stat10.size);
      const readStream = fsSync2.createReadStream(resolvedPath);
      readStream.pipe(res);
      readStream.on("error", (err) => {
        console.error("[RemoteServer] File download stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "File read error" });
        }
      });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/mkdir", async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: "Missing path" });
        return;
      }
      const resolvedPath = resolveAndSandbox(dirPath, resolveWorkingDirectory(req));
      await fs31.mkdir(resolvedPath, { recursive: true });
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/files/delete", destructiveLimiter, async (req, res) => {
    try {
      const { path: filePath } = req.body;
      if (!filePath) {
        res.status(400).json({ error: "Missing path" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      const stat10 = await fs31.stat(resolvedPath);
      if (stat10.isDirectory()) {
        await fs31.rm(resolvedPath, { recursive: true });
      } else {
        await fs31.unlink(resolvedPath);
      }
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/files/search", async (req, res) => {
    try {
      const pattern = req.query.pattern || "*";
      const maxResults = Math.min(parseInt(req.query.maxResults) || 100, 500);
      const cwd = resolveWorkingDirectory(req);
      console.log(`[FileSearch] pattern=${pattern}, maxResults=${maxResults}, cwd=${cwd}`);
      const skipDirs = /* @__PURE__ */ new Set([
        "node_modules",
        ".git",
        ".gradle",
        ".dart_tool",
        ".idea",
        ".vscode",
        ".cursor",
        "__pycache__",
        ".next",
        ".cache",
        "dist",
        ".build",
        "Pods",
        "build/intermediates",
        ".svn"
      ]);
      const ext = pattern.startsWith("*.") ? pattern.slice(1).toLowerCase() : null;
      const results = [];
      async function walk(dir, relativeBase) {
        if (results.length >= maxResults)
          return;
        let entries;
        try {
          entries = await fs31.readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (results.length >= maxResults)
            break;
          if (entry.isDirectory()) {
            if (skipDirs.has(entry.name) || entry.name.startsWith("."))
              continue;
            await walk(path31.join(dir, entry.name), relativeBase ? `${relativeBase}/${entry.name}` : entry.name);
          } else if (entry.isFile()) {
            const matches = ext ? entry.name.toLowerCase().endsWith(ext) : true;
            if (matches) {
              const fullPath = path31.join(dir, entry.name);
              const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
              let size = 0;
              try {
                const fileStat = await fs31.stat(fullPath);
                size = fileStat.size;
              } catch {
              }
              results.push({ name: entry.name, path: fullPath, relativePath, size });
            }
          }
        }
      }
      await walk(cwd, "");
      console.log(`[FileSearch] Found ${results.length} files matching ${pattern} in ${cwd}`);
      if (results.length === 0) {
        console.log(`[FileSearch] No files found \u2014 workspace root was: ${cwd}`);
      }
      res.json({ files: results, pattern, cwd });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupTerminalRoutes(app6) {
  app6.post("/api/terminal/create", async (req, res) => {
    try {
      const { id, cwd, cols, rows } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing terminal id" });
        return;
      }
      const mainWindow2 = import_electron9.BrowserWindow.getAllWindows()[0];
      if (!mainWindow2) {
        res.status(500).json({ error: "No main window available" });
        return;
      }
      const terminalCwd = cwd || resolveWorkingDirectory(req);
      createTerminal(id, terminalCwd, cols || 80, rows || 24, mainWindow2);
      terminalOutputs.set(id, { callbacks: /* @__PURE__ */ new Set(), buffer: [] });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/write", writeLimiter, async (req, res) => {
    try {
      const { id, data } = req.body;
      if (!id || !data) {
        res.status(400).json({ error: "Missing id or data" });
        return;
      }
      writeToTerminal(id, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/resize", async (req, res) => {
    try {
      const { id, cols, rows } = req.body;
      if (!id || cols === void 0 || rows === void 0) {
        res.status(400).json({ error: "Missing id, cols, or rows" });
        return;
      }
      resizeTerminal(id, cols, rows);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/terminal/destroy", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      destroyTerminal(id);
      terminalOutputs.delete(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/terminal/stream/:id", (req, res) => {
    const { id } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "connected", terminalId: id })}

`);
    const buffered = getTerminalBuffer(id);
    if (buffered.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "stream_delta", delta: { text: buffered } })}

`);
    }
    const onData = (data) => {
      res.write(`data: ${JSON.stringify({ type: "stream_delta", delta: { text: data } })}

`);
    };
    registerTerminalCallback(id, onData);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
      unregisterTerminalCallback(id, onData);
    });
  });
}
function setupToolRoutes(app6) {
  app6.get("/api/tools/list", async (_req, res) => {
    try {
      res.json({ tools: [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.post("/api/tools/execute", async (req, res) => {
    try {
      const { toolName, input } = req.body;
      if (!toolName) {
        res.status(400).json({ error: "Missing toolName" });
        return;
      }
      res.status(501).json({ error: "Tool execution not yet implemented via remote API" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupGitRoutes(app6) {
  app6.get("/api/git/diff", async (req, res) => {
    try {
      const filePath = req.query.path;
      const staged = req.query.staged === "true";
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = path31.isAbsolute(filePath) ? filePath : path31.join(resolveWorkingDirectory(req), filePath);
      const cwd = path31.dirname(resolvedPath);
      const relativePath = path31.basename(resolvedPath);
      const git = (0, import_simple_git4.default)(cwd);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        res.json({ path: resolvedPath, changes: [], isGitRepo: false });
        return;
      }
      const diffArgs = staged ? ["--staged", "--unified=0", relativePath] : ["--unified=0", relativePath];
      const diffOutput = await git.diff(diffArgs);
      const changes = parseGitDiff(diffOutput);
      res.json({
        path: resolvedPath,
        changes,
        isGitRepo: true,
        hasChanges: changes.length > 0
      });
    } catch (error) {
      console.error("[RemoteServer] Git diff error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/git/status", async (req, res) => {
    try {
      const dirPath = req.query.path;
      console.log("[GitStatus] Request for path:", dirPath);
      if (!dirPath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = path31.isAbsolute(dirPath) ? dirPath : path31.join(resolveWorkingDirectory(req), dirPath);
      console.log("[GitStatus] Resolved path:", resolvedPath);
      const git = (0, import_simple_git4.default)(resolvedPath);
      const isRepo = await git.checkIsRepo();
      console.log("[GitStatus] Is git repo:", isRepo);
      if (!isRepo) {
        res.json({
          isGitRepo: false,
          branch: null,
          files: {}
        });
        return;
      }
      const gitRoot = (await git.revparse(["--show-toplevel"])).trim();
      console.log("[GitStatus] Git root:", gitRoot);
      const relativeRequestedDir = path31.relative(gitRoot, resolvedPath);
      console.log("[GitStatus] Relative requested dir:", relativeRequestedDir);
      const getRelPath = (gitRelPath) => {
        const normalized = gitRelPath.replace(/\\/g, "/");
        if (!relativeRequestedDir || relativeRequestedDir === ".") {
          return normalized;
        }
        const prefix = relativeRequestedDir.replace(/\\/g, "/") + "/";
        if (normalized.startsWith(prefix)) {
          return normalized.slice(prefix.length);
        }
        return null;
      };
      const gitManager = new GitManager(gitRoot);
      const status = await gitManager.statusStructured();
      console.log("[GitStatus] Raw git status - modified:", status.modified.length, "untracked:", status.not_added.length);
      const fileStatuses = {};
      const addStatus = (gitRelPath, statusValue, overwrite = true) => {
        const relPath = getRelPath(gitRelPath);
        if (relPath === null)
          return;
        if (overwrite || !(relPath in fileStatuses)) {
          fileStatuses[relPath] = statusValue;
        }
      };
      for (const file of status.not_added) {
        addStatus(file, "untracked");
      }
      for (const file of status.modified) {
        addStatus(file, "modified");
      }
      for (const file of status.staged) {
        addStatus(file, "staged", false);
      }
      for (const file of status.created) {
        addStatus(file, "staged", false);
      }
      for (const file of status.deleted) {
        addStatus(file, "deleted");
      }
      for (const rename4 of status.renamed) {
        addStatus(rename4.to, "renamed");
      }
      for (const file of status.conflicted) {
        addStatus(file, "conflicted");
      }
      console.log("[GitStatus] Response - files count:", Object.keys(fileStatuses).length);
      console.log("[GitStatus] First few files:", Object.entries(fileStatuses).slice(0, 5));
      res.json({
        isGitRepo: true,
        branch: status.current,
        files: fileStatuses
      });
    } catch (error) {
      console.error("[RemoteServer] Git status error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
async function testTcpConnection(host, port2, timeout = 1e3) {
  const net = await import("net");
  return new Promise((resolve12) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve12(false);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve12(true);
    });
    socket.once("error", onError);
    socket.once("timeout", onError);
    socket.connect(port2, host);
  });
}
async function getListeningPorts() {
  const ports = /* @__PURE__ */ new Set();
  const platform2 = process.platform;
  try {
    let stdout = "";
    if (platform2 === "darwin") {
      try {
        const { stdout: lsofOut } = await execAsync('lsof -nP -iTCP -sTCP:LISTEN | grep -E "*:([0-9]+)" | grep -oE "*:([0-9]+)" | grep -oE "[0-9]+"');
        stdout = lsofOut;
      } catch {
        const { stdout: netstatOut } = await execAsync('netstat -anv | grep LISTEN | grep -oE ".([0-9]+)" | grep -oE "[0-9]+"');
        stdout = netstatOut;
      }
    } else if (platform2 === "linux") {
      try {
        const { stdout: ssOut } = await execAsync('ss -tln | grep LISTEN | grep -oE ":[0-9]+" | grep -oE "[0-9]+"');
        stdout = ssOut;
      } catch {
        const { stdout: lsofOut } = await execAsync('lsof -nP -iTCP -sTCP:LISTEN | grep -oE "TCP *:[0-9]+" | grep -oE "[0-9]+"');
        stdout = lsofOut;
      }
    } else if (platform2 === "win32") {
      const { stdout: netstatOut } = await execAsync("netstat -ano | findstr LISTENING | findstr 127.0.0.1");
      stdout = netstatOut;
    }
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      let port2 = null;
      if (platform2 === "win32") {
        const match = line.match(/127\.0\.0\.1:(\d+)/);
        if (match)
          port2 = parseInt(match[1], 10);
      } else {
        port2 = parseInt(trimmed, 10);
      }
      if (port2 && !isNaN(port2) && port2 > 0 && port2 <= 65535) {
        ports.add(port2);
      }
    }
  } catch (error) {
    console.error("[RemoteServer] Error getting listening ports:", error);
  }
  return Array.from(ports).sort((a, b) => a - b);
}
function setupProxyRoutes(app6) {
  app6.post("/api/proxy/register", (req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const { port: targetPort, name } = req.body;
      if (!targetPort || typeof targetPort !== "number") {
        res.status(400).json({ error: "Missing or invalid port (must be a number)" });
        return;
      }
      const allowedPorts = settingsManager.get("remoteAccess.proxyAllowedPorts");
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }
      registeredProxyPorts.set(targetPort, {
        name: name || `localhost:${targetPort}`,
        registeredAt: Date.now()
      });
      console.log(`[RemoteServer] Registered proxy port ${targetPort} as "${name || `localhost:${targetPort}`}"`);
      res.json({ success: true, port: targetPort });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.delete("/api/proxy/:port", (req, res) => {
    try {
      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: "Invalid port" });
        return;
      }
      const deleted = registeredProxyPorts.delete(targetPort);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/proxy/list", (_req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      const ports = Array.from(registeredProxyPorts.entries()).map(([p, info]) => ({
        port: p,
        name: info.name,
        registeredAt: info.registeredAt
      }));
      res.json({ enabled: proxyEnabled, ports });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.get("/api/proxy/scan", async (_req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const listeningPorts = await getListeningPorts();
      const available = [];
      for (const testPort of listeningPorts) {
        try {
          const isReachable = await testTcpConnection("localhost", testPort, 300);
          if (isReachable) {
            const registered = registeredProxyPorts.get(testPort);
            available.push({
              port: testPort,
              name: registered?.name || `localhost:${testPort}`
            });
          }
        } catch {
        }
      }
      res.json({ enabled: proxyEnabled, available });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app6.all("/api/proxy/:port/*", (req, res) => {
    try {
      const proxyEnabled = settingsManager.get("remoteAccess.proxyEnabled");
      if (!proxyEnabled) {
        res.status(403).json({ error: "Proxy is disabled in settings" });
        return;
      }
      const targetPort = parseInt(req.params.port, 10);
      if (isNaN(targetPort)) {
        res.status(400).json({ error: "Invalid port" });
        return;
      }
      if (!registeredProxyPorts.has(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not registered for proxying` });
        return;
      }
      const allowedPorts = settingsManager.get("remoteAccess.proxyAllowedPorts");
      if (allowedPorts.length > 0 && !allowedPorts.includes(targetPort)) {
        res.status(403).json({ error: `Port ${targetPort} is not in the allowed proxy ports list` });
        return;
      }
      const prefix = `/api/proxy/${targetPort}/`;
      const downstreamPath = "/" + req.originalUrl.slice(req.originalUrl.indexOf(prefix) + prefix.length);
      const proxyHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lk = key.toLowerCase();
        if (lk === "host" || lk === "x-api-key" || lk === "connection" || lk === "accept-encoding")
          continue;
        if (typeof value === "string")
          proxyHeaders[key] = value;
      }
      proxyHeaders["host"] = `localhost:${targetPort}`;
      proxyHeaders["accept-encoding"] = "identity";
      const proxyReq = http2.request(
        {
          hostname: "localhost",
          port: targetPort,
          path: downstreamPath,
          method: req.method,
          headers: proxyHeaders
        },
        (proxyRes) => {
          const contentType = (proxyRes.headers["content-type"] || "").toLowerCase();
          const isHtml = contentType.includes("text/html");
          const isJs = contentType.includes("javascript");
          const isCss = contentType.includes("text/css");
          if (isHtml || isJs || isCss) {
            const chunks = [];
            proxyRes.on("data", (chunk) => chunks.push(chunk));
            proxyRes.on("end", () => {
              let body = Buffer.concat(chunks).toString("utf8");
              const proxyBase = `/api/proxy/${targetPort}`;
              if (isHtml) {
                const proxyResetCss = `
<style id="omni-proxy-reset">
*, *::before, *::after {
  animation-duration: 0.001ms !important;
  animation-delay: -1ms !important;
  animation-fill-mode: both !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0ms !important;
}
[style*="opacity:0"] { opacity: 1 !important; }
[style*="opacity: 0"] { opacity: 1 !important; }
[style*="transform:translate"] { transform: none !important; }
[style*="transform: translate"] { transform: none !important; }
</style>`;
                body = body.replace("</head>", `${proxyResetCss}</head>`);
                body = body.replace(
                  /((?:src|href|action|content|srcset)=["'])(\/)(?!\/)/g,
                  `$1${proxyBase}/`
                );
                body = body.replace(
                  /url\(\s*["']?(\/)(?!\/)/g,
                  `url('${proxyBase}/`
                );
                body = body.replace(
                  /(<script id="__NEXT_DATA__" type="application\/json">)([\s\S]*?)(<\/script>)/,
                  (_match, open, jsonStr, close) => {
                    try {
                      const data = JSON.parse(jsonStr);
                      data.assetPrefix = proxyBase;
                      data.basePath = proxyBase;
                      return `${open}${JSON.stringify(data)}${close}`;
                    } catch {
                      return _match;
                    }
                  }
                );
              } else if (isJs || isCss) {
                body = body.replace(
                  /(["'`])(\/(?:_next|static|images|assets|public)\/)/g,
                  `$1${proxyBase}$2`
                );
              }
              const responseHeaders = { ...proxyRes.headers };
              delete responseHeaders["content-encoding"];
              delete responseHeaders["transfer-encoding"];
              responseHeaders["content-length"] = Buffer.byteLength(body, "utf8").toString();
              if (isHtml) {
                const sessionToken = createProxySession(targetPort);
                const existing = responseHeaders["set-cookie"];
                const sessionCookie = `omni-proxy-session=${sessionToken}; Path=/api/proxy/; HttpOnly; SameSite=Strict; Max-Age=3600`;
                responseHeaders["set-cookie"] = existing ? [
                  ...Array.isArray(existing) ? existing : [existing],
                  sessionCookie
                ] : sessionCookie;
              }
              res.writeHead(proxyRes.statusCode || 502, responseHeaders);
              res.end(body, "utf8");
            });
          } else {
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
            proxyRes.pipe(res);
          }
        }
      );
      proxyReq.on("error", (err) => {
        console.error(`[RemoteServer] Proxy error for localhost:${targetPort}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: `Cannot reach localhost:${targetPort} \u2014 ${err.message}` });
        }
      });
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupAdbRoutes(app6) {
  const getAdbPath = () => {
    return settingsManager.get("adb.path") || "adb";
  };
  const isAdbEnabled = () => {
    return settingsManager.get("adb.enabled") !== false;
  };
  app6.get("/api/adb/devices", async (_req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const adb = getAdbPath();
      const { stdout } = await execAsync(`${adb} devices -l`);
      const lines = stdout.trim().split("\n").slice(1);
      const devices = lines.map((line) => line.trim()).filter((line) => line.length > 0).map((line) => {
        const parts = line.split(/\s+/);
        const id = parts[0];
        const state = parts[1];
        const props = {};
        for (let i = 2; i < parts.length; i++) {
          const kv = parts[i].split(":");
          if (kv.length === 2)
            props[kv[0]] = kv[1];
        }
        return { id, state, model: props["model"] || null, product: props["product"] || null, transport: props["transport_id"] || null };
      });
      res.json({ devices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  async function extractApkPackageName(apkPath) {
    const aaptCandidates = ["aapt", "aapt2"];
    for (const tool of aaptCandidates) {
      try {
        const { stdout } = await execAsync(`${tool} dump badging "${apkPath}" 2>/dev/null`, { timeout: 15e3 });
        const m = stdout.match(/^package:\s+name='([^']+)'/m);
        if (m) {
          console.log(`[AdbInstall] Extracted package name via ${tool}: ${m[1]}`);
          return m[1];
        }
      } catch {
      }
    }
    try {
      const { stdout } = await execAsync(`apkanalyzer manifest application-id "${apkPath}" 2>/dev/null`, { timeout: 15e3 });
      const pkg = stdout.trim();
      if (pkg && pkg.includes(".")) {
        console.log(`[AdbInstall] Extracted package name via apkanalyzer: ${pkg}`);
        return pkg;
      }
    } catch {
    }
    console.log("[AdbInstall] Could not extract package name \u2014 no aapt/aapt2/apkanalyzer found");
    return null;
  }
  app6.post("/api/adb/install", destructiveLimiter, async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { filePath, deviceId } = req.body;
      if (!filePath) {
        res.status(400).json({ error: "Missing filePath" });
        return;
      }
      if (deviceId && !DEVICE_ID_RE.test(deviceId)) {
        res.status(400).json({ error: "Invalid deviceId format" });
        return;
      }
      const resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
      try {
        await fs31.access(resolvedPath);
      } catch {
        res.status(404).json({ error: `File not found: ${resolvedPath}` });
        return;
      }
      const packageName = await extractApkPackageName(resolvedPath);
      const adb = getAdbPath();
      const installArgs = deviceId ? ["-s", deviceId, "install", "-r", resolvedPath] : ["install", "-r", resolvedPath];
      const { stdout, stderr } = await execFileAsync2(adb, installArgs, { timeout: 12e4 });
      const success = stdout.includes("Success") || stdout.includes("success");
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), packageName });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/adb/launch", async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { packageName, activityName, deviceId } = req.body;
      if (!packageName) {
        res.status(400).json({ error: "Missing packageName" });
        return;
      }
      if (!PKG_RE.test(packageName)) {
        res.status(400).json({ error: "Invalid packageName format" });
        return;
      }
      if (activityName && !ACTIVITY_RE.test(activityName)) {
        res.status(400).json({ error: "Invalid activityName format" });
        return;
      }
      if (deviceId && !DEVICE_ID_RE.test(deviceId)) {
        res.status(400).json({ error: "Invalid deviceId format" });
        return;
      }
      const adb = getAdbPath();
      let launchArgs;
      if (activityName) {
        launchArgs = [
          ...deviceId ? ["-s", deviceId] : [],
          "shell",
          "am",
          "start",
          "-n",
          `${packageName}/${activityName}`
        ];
      } else {
        launchArgs = [
          ...deviceId ? ["-s", deviceId] : [],
          "shell",
          "monkey",
          "-p",
          packageName,
          "-c",
          "android.intent.category.LAUNCHER",
          "1"
        ];
      }
      const { stdout, stderr } = await execFileAsync2(adb, launchArgs);
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.post("/api/adb/wireless-pair", async (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const { ip, port: pairingPort, pairingCode } = req.body;
      if (!ip || !pairingPort || !pairingCode) {
        res.status(400).json({ error: "Missing ip, port, or pairingCode" });
        return;
      }
      if (!IP_RE.test(String(ip))) {
        res.status(400).json({ error: "Invalid ip format" });
        return;
      }
      const portNum = parseInt(String(pairingPort), 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        res.status(400).json({ error: "Invalid port (must be 1\u201365535)" });
        return;
      }
      const adb = getAdbPath();
      const { stdout, stderr } = await new Promise(
        (resolve12, reject) => {
          const proc = (0, import_node_child_process7.spawn)(adb, ["pair", `${ip}:${portNum}`]);
          let out = "";
          let err = "";
          proc.stdout.on("data", (d) => {
            out += d.toString();
          });
          proc.stderr.on("data", (d) => {
            err += d.toString();
          });
          proc.on("close", () => resolve12({ stdout: out, stderr: err }));
          proc.on("error", reject);
          proc.stdin.write(String(pairingCode) + "\n");
          proc.stdin.end();
          setTimeout(() => proc.kill(), 3e4);
        }
      );
      const success = stdout.toLowerCase().includes("successfully paired");
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim() });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
  app6.get("/api/adb/logcat", (req, res) => {
    try {
      if (!isAdbEnabled()) {
        res.status(403).json({ error: "ADB is disabled in settings" });
        return;
      }
      const packageFilter = req.query.package;
      const deviceId = req.query.deviceId;
      const adb = getAdbPath();
      const args = [];
      if (deviceId)
        args.push("-s", deviceId);
      args.push("logcat", "-v", "time");
      if (packageFilter) {
        args.push("--pid", "$(pidof " + packageFilter + ")");
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      const logcat = (0, import_node_child_process7.spawn)(adb, args);
      logcat.stdout.on("data", (data) => {
        const lines = data.toString().split("\n").filter((l) => l.trim());
        for (const line of lines) {
          res.write(`data: ${JSON.stringify({ line })}

`);
        }
      });
      logcat.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ error: data.toString() })}

`);
      });
      logcat.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ type: "closed", code })}

`);
        res.end();
      });
      const keepAlive = setInterval(() => {
        res.write(":keepalive\n\n");
      }, 3e4);
      res.on("close", () => {
        clearInterval(keepAlive);
        logcat.kill();
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupIosRoutes(app6) {
  const isIosSupported = () => process.platform === "darwin";
  function parseXctraceDevices(output) {
    const devices = [];
    const lines = output.split("\n");
    let inDevicesSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "== Devices ==") {
        inDevicesSection = true;
        continue;
      }
      if (trimmed.startsWith("==")) {
        if (inDevicesSection)
          break;
        continue;
      }
      if (!inDevicesSection || !trimmed)
        continue;
      const match = trimmed.match(/^(.+?)\s+\(([^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)\s*$/);
      if (match) {
        devices.push({ name: match[1].trim(), osVersion: match[2], udid: match[3], type: "physical" });
      }
    }
    return devices;
  }
  app6.get("/api/ios/devices", async (_req, res) => {
    console.log("[IosDevices] Request received");
    if (!isIosSupported()) {
      res.status(403).json({ error: "iOS device management requires a macOS host", devices: [] });
      return;
    }
    try {
      const { stdout } = await execAsync("xcrun xctrace list devices 2>&1", { timeout: 12e3 });
      console.log("[IosDevices] xcrun output length:", stdout.length);
      const devices = parseXctraceDevices(stdout);
      console.log(`[IosDevices] xcrun found ${devices.length} physical devices`);
      res.json({ devices, tool: "xcrun" });
      return;
    } catch (err) {
      console.warn("[IosDevices] xcrun failed:", err.message);
    }
    try {
      const { stdout } = await execAsync(
        "ios-deploy --detect --timeout 5 2>&1",
        { timeout: 12e3 }
      );
      console.log("[IosDevices] ios-deploy output:", stdout.slice(0, 300));
      const devices = [];
      const re = /Found\s+(.+?)\s+\((iOS [^)]+)\)\s+\(([0-9A-Fa-f-]{25,})\)/g;
      let m;
      while ((m = re.exec(stdout)) !== null) {
        devices.push({ name: m[1].trim(), osVersion: m[2], udid: m[3], type: "physical" });
      }
      console.log(`[IosDevices] ios-deploy found ${devices.length} devices`);
      res.json({ devices, tool: "ios-deploy" });
      return;
    } catch (err) {
      console.warn("[IosDevices] ios-deploy failed:", err.message);
    }
    try {
      const { stdout: idList } = await execAsync("idevice_id -l", { timeout: 8e3 });
      const udids = idList.trim().split("\n").filter(Boolean);
      const devices = [];
      for (const udid of udids) {
        try {
          const { stdout: info } = await execAsync(
            `ideviceinfo -u ${udid} -k DeviceName 2>/dev/null; ideviceinfo -u ${udid} -k ProductVersion 2>/dev/null`
          );
          const lines = info.trim().split("\n");
          devices.push({
            udid,
            name: lines[0]?.trim() || udid,
            osVersion: lines[1]?.trim() || "unknown",
            type: "physical"
          });
        } catch {
          devices.push({ udid, name: udid, osVersion: "unknown", type: "physical" });
        }
      }
      console.log(`[IosDevices] libimobiledevice found ${devices.length} devices`);
      res.json({ devices, tool: "libimobiledevice" });
      return;
    } catch (err) {
      console.warn("[IosDevices] libimobiledevice failed:", err.message);
    }
    console.warn("[IosDevices] No iOS tools available");
    res.status(503).json({
      error: "No iOS tools found. Install Xcode Command Line Tools: xcode-select --install, or ios-deploy: npm install -g ios-deploy, or libimobiledevice: brew install libimobiledevice",
      devices: []
    });
  });
  app6.post("/api/ios/install", destructiveLimiter, async (req, res) => {
    console.log("[IosInstall] Request received:", req.body);
    if (!isIosSupported()) {
      res.status(403).json({ error: "iOS device management requires a macOS host" });
      return;
    }
    const { filePath, deviceId } = req.body;
    if (!filePath) {
      res.status(400).json({ error: "Missing filePath" });
      return;
    }
    let resolvedPath;
    try {
      resolvedPath = resolveAndSandbox(filePath, resolveWorkingDirectory(req));
    } catch (sandboxErr) {
      sendRouteError(res, sandboxErr);
      return;
    }
    try {
      await fs31.access(resolvedPath);
    } catch {
      res.status(404).json({ error: `File not found: ${resolvedPath}` });
      return;
    }
    const ext = path31.extname(resolvedPath).toLowerCase();
    if (ext !== ".ipa" && ext !== ".app") {
      res.status(400).json({ error: `Unsupported file type: ${ext}. Expected .ipa or .app` });
      return;
    }
    try {
      const deviceFlag = deviceId ? `--id ${deviceId}` : "";
      console.log(`[IosInstall] Trying ios-deploy: ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ios-deploy ${deviceFlag} --bundle "${resolvedPath}"`,
        { timeout: 18e4 }
      );
      console.log("[IosInstall] ios-deploy success:", stdout.slice(0, 200));
      res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim(), tool: "ios-deploy" });
      return;
    } catch (e) {
      console.warn("[IosInstall] ios-deploy failed:", e.message);
    }
    try {
      const deviceFlag = deviceId ? `-u ${deviceId}` : "";
      console.log(`[IosInstall] Trying ideviceinstaller: ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`);
      const { stdout, stderr } = await execAsync(
        `ideviceinstaller ${deviceFlag} -i "${resolvedPath}"`,
        { timeout: 18e4 }
      );
      const success = stdout.toLowerCase().includes("complete") || stdout.toLowerCase().includes("installcomplete");
      console.log("[IosInstall] ideviceinstaller result:", { success, stdout: stdout.slice(0, 200) });
      res.json({ success, stdout: stdout.trim(), stderr: stderr.trim(), tool: "ideviceinstaller" });
      return;
    } catch (e) {
      console.warn("[IosInstall] ideviceinstaller failed:", e.message);
    }
    res.status(503).json({
      error: "No iOS install tools found. Install ios-deploy: npm install -g ios-deploy, or ideviceinstaller: brew install ideviceinstaller"
    });
  });
}
function parseGitDiff(diffOutput) {
  const changes = [];
  const lines = diffOutput.split("\n");
  let currentNewLine = 0;
  let inHunk = false;
  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentNewLine = parseInt(hunkMatch[2], 10);
      inHunk = true;
      continue;
    }
    if (!inHunk)
      continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      changes.push({
        lineNumber: currentNewLine,
        type: "added"
      });
      currentNewLine++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      changes.push({
        lineNumber: currentNewLine,
        type: "deleted"
      });
    } else if (line.startsWith(" ")) {
      currentNewLine++;
    } else if (line.startsWith("diff --git")) {
      inHunk = false;
    }
  }
  return changes;
}
var import_express, import_cors, import_express_rate_limit, fs31, fsSync2, path31, http2, zlib, import_node_child_process7, import_node_util2, os4, import_electron9, import_simple_git4, gunzipAsync, inflateAsync, brotliDecompressAsync, execAsync, execFileAsync2, DEVICE_ID_RE, IP_RE, PKG_RE, ACTIVITY_RE, app3, server, tunnelProvider, isRunning, publicUrl, port, terminalOutputs, registeredProxyPorts, remoteConversationMeta, autoSaveUnsubscribe, writeLimiter, destructiveLimiter;
var init_remote_server = __esm({
  "main/remote-server.ts"() {
    "use strict";
    import_express = __toESM(require("express"), 1);
    import_cors = __toESM(require("cors"), 1);
    import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
    init_tunnel_providers();
    init_settings();
    init_agent_bridge();
    init_remote_auth();
    init_remote_event_emitter();
    init_remote_ws();
    init_terminal_manager();
    fs31 = __toESM(require("fs/promises"), 1);
    fsSync2 = __toESM(require("fs"), 1);
    path31 = __toESM(require("path"), 1);
    http2 = __toESM(require("http"), 1);
    zlib = __toESM(require("zlib"), 1);
    import_node_child_process7 = require("child_process");
    import_node_util2 = require("util");
    os4 = __toESM(require("os"), 1);
    init_core_integration();
    init_shared_workspace_manager();
    init_ipc_handlers();
    init_chat_storage();
    import_electron9 = require("electron");
    import_simple_git4 = __toESM(require("simple-git"), 1);
    init_git_manager();
    gunzipAsync = (0, import_node_util2.promisify)(zlib.gunzip);
    inflateAsync = (0, import_node_util2.promisify)(zlib.inflate);
    brotliDecompressAsync = (0, import_node_util2.promisify)(zlib.brotliDecompress);
    execAsync = (0, import_node_util2.promisify)(import_node_child_process7.exec);
    execFileAsync2 = (0, import_node_util2.promisify)(import_node_child_process7.execFile);
    DEVICE_ID_RE = /^[a-zA-Z0-9._:+-]{1,64}$/;
    IP_RE = /^[a-zA-Z0-9._-]{1,253}$/;
    PKG_RE = /^[a-zA-Z0-9._]{1,255}$/;
    ACTIVITY_RE = /^[a-zA-Z0-9._$/]{1,255}$/;
    app3 = null;
    server = null;
    tunnelProvider = null;
    isRunning = false;
    publicUrl = null;
    port = 3e3;
    terminalOutputs = /* @__PURE__ */ new Map();
    registeredProxyPorts = /* @__PURE__ */ new Map();
    remoteConversationMeta = /* @__PURE__ */ new Map();
    autoSaveUnsubscribe = null;
    writeLimiter = (0, import_express_rate_limit.default)({
      windowMs: 6e4,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: "Write rate limit exceeded. Please slow down." });
      }
    });
    destructiveLimiter = (0, import_express_rate_limit.default)({
      windowMs: 6e4,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: "Rate limit exceeded for destructive operations." });
      }
    });
  }
});

// main/app-window.ts
var app_window_exports = {};
__export(app_window_exports, {
  createWindow: () => createWindow,
  getMainWindow: () => getMainWindow,
  rebuildMenu: () => rebuildMenu,
  setupAppEventHandlers: () => setupAppEventHandlers
});
function buildMenu() {
  const recentWorkspaces = settingsManager.getRecentWorkspaces();
  const recentSubmenu = recentWorkspaces.length > 0 ? recentWorkspaces.map((workspacePath) => ({
    label: `${path32.basename(workspacePath)} - ${workspacePath}`,
    click: () => {
      const focusedWindow = import_electron10.BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.webContents.send("menu:open-recent", workspacePath);
      }
    }
  })) : [{ label: "No Recent Projects", enabled: false }];
  if (recentWorkspaces.length > 0) {
    recentSubmenu.push({ type: "separator" });
    recentSubmenu.push({
      label: "Clear Recent",
      click: () => {
        settingsManager.reset("files.recentWorkspaces");
        const newMenu = buildMenu();
        import_electron10.Menu.setApplicationMenu(newMenu);
      }
    });
  }
  const fw = () => import_electron10.BrowserWindow.getFocusedWindow();
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => {
            createWindow();
          }
        },
        { type: "separator" },
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => fw()?.webContents.send("menu:new-file")
        },
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+O",
          click: () => fw()?.webContents.send("menu:open-folder")
        },
        { type: "separator" },
        {
          label: "Close Folder",
          accelerator: "CmdOrCtrl+Shift+W",
          click: () => fw()?.webContents.send("menu:close-folder")
        },
        { type: "separator" },
        {
          label: "Add Folder to Workspace",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => fw()?.webContents.send("menu:add-folder-to-workspace")
        },
        { type: "separator" },
        {
          label: "Recent Projects",
          submenu: recentSubmenu,
          id: "recent-projects"
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => fw()?.webContents.send("menu:save")
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => fw()?.webContents.send("menu:open-settings")
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => fw()?.webContents.send("menu:toggle-sidebar")
        },
        {
          label: "Toggle Chat",
          accelerator: "CmdOrCtrl+Shift+L",
          click: () => fw()?.webContents.send("menu:toggle-chat")
        },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Agent",
      submenu: [
        {
          label: "Send Message",
          accelerator: "CmdOrCtrl+Enter",
          click: () => fw()?.webContents.send("menu:send-message")
        },
        {
          label: "Abort",
          accelerator: "Escape",
          click: () => fw()?.webContents.send("menu:abort")
        },
        { type: "separator" },
        {
          label: "Clear Conversation",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => fw()?.webContents.send("menu:clear-chat")
        }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" }
      ]
    }
  ];
  return import_electron10.Menu.buildFromTemplate(template);
}
async function createWindow() {
  const preloadPath = path32.resolve(__dirname, "main", "preload.cjs");
  console.log("__dirname:", __dirname);
  console.log("Preload path:", preloadPath);
  const { app: app6 } = await import("electron");
  const appRoot = app6.getAppPath();
  const iconPaths = process.platform === "darwin" ? [
    path32.join(appRoot, "build", "icon.icns"),
    path32.join(appRoot, "..", "build", "icon.icns"),
    path32.join(__dirname, "..", "build", "icon.icns"),
    path32.join(appRoot, "logo.png"),
    path32.join(__dirname, "..", "logo.png")
  ] : [
    path32.join(process.resourcesPath, "logo.png"),
    path32.join(appRoot, "logo.png"),
    path32.join(__dirname, "..", "logo.png"),
    path32.join(__dirname, "..", "..", "logo.png")
  ];
  let icon = void 0;
  for (const iconPath of iconPaths) {
    try {
      const img = import_electron10.nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) {
        icon = img;
        console.log("[Main] Using icon:", iconPath);
        break;
      }
    } catch {
    }
  }
  const existingWindows = import_electron10.BrowserWindow.getAllWindows();
  let windowPosition;
  if (existingWindows.length > 0) {
    const ref = import_electron10.BrowserWindow.getFocusedWindow() ?? existingWindows[existingWindows.length - 1];
    const [rx, ry] = ref.getPosition();
    const cascade = existingWindows.length * 30;
    windowPosition = { x: rx + cascade, y: ry + cascade };
  }
  const win = new import_electron10.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    ...windowPosition ?? {},
    titleBarStyle: "hiddenInset",
    icon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      webviewTag: true
    },
    show: false
  });
  if (!mainWindow) {
    mainWindow = win;
    setMainWindowForBrowser(win);
    trayNotificationManager.initialize(win);
  }
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });
  if (isDev) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path32.join(__dirname, "../renderer/index.html"));
  }
  win.on("closed", () => {
    if (mainWindow === win) {
      const remaining = import_electron10.BrowserWindow.getAllWindows();
      mainWindow = remaining.length > 0 ? remaining[0] : null;
      trayNotificationManager.destroy();
      if (remaining.length > 0) {
        trayNotificationManager.initialize(remaining[0]);
      }
    }
  });
  initializeWindowFocusTracking(win);
  win.on("focus", () => {
    setMainWindowForBrowser(win);
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    import_electron10.shell.openExternal(url);
    return { action: "deny" };
  });
  const menu = buildMenu();
  import_electron10.Menu.setApplicationMenu(menu);
  return win;
}
function rebuildMenu() {
  const menu = buildMenu();
  import_electron10.Menu.setApplicationMenu(menu);
}
function setupAppEventHandlers() {
  const { app: app6 } = require("electron");
  app6.on("activate", () => {
    if (import_electron10.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app6.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app6.quit();
    }
  });
  app6.on("before-quit", async (e) => {
    if (isQuitting)
      return;
    const allWindows = import_electron10.BrowserWindow.getAllWindows();
    if (allWindows.length === 0)
      return;
    e.preventDefault();
    isQuitting = true;
    try {
      await Promise.race([
        Promise.all(allWindows.map((w) => new Promise((resolve12) => {
          const replyChannel = `app:save-complete-${w.id}`;
          import_electron10.ipcMain.handleOnce(replyChannel, () => {
            console.log(`[Main] Window ${w.id} signaled save complete`);
            resolve12();
          });
          w.webContents.send("app:before-quit", { replyChannel });
        }))),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Save timeout")), 5e3)
        )
      ]);
      console.log("[Main] All windows saved, quitting now");
    } catch (error) {
      console.error("[Main] Save failed or timed out, quitting anyway:", error);
    }
    app6.quit();
  });
}
function getMainWindow() {
  return mainWindow;
}
var import_electron10, path32, mainWindow, isQuitting, isDev;
var init_app_window = __esm({
  "main/app-window.ts"() {
    "use strict";
    import_electron10 = require("electron");
    path32 = __toESM(require("path"), 1);
    init_settings();
    init_notifications();
    init_ipc_handlers();
    init_tray_notifications();
    mainWindow = null;
    isQuitting = false;
    isDev = process.env.NODE_ENV === "development";
  }
});

// main/ipc-handlers.ts
var ipc_handlers_exports = {};
__export(ipc_handlers_exports, {
  cleanupIpcHandlers: () => cleanupIpcHandlers,
  getConfigModels: () => getConfigModels,
  getConfigProviders: () => getConfigProviders,
  requestScreenshot: () => requestScreenshot,
  setAgentRef: () => setAgentRef,
  setConfigRef: () => setConfigRef,
  setMainWindowForBrowser: () => setMainWindowForBrowser,
  setToolsRef: () => setToolsRef,
  setupIpcHandlers: () => setupIpcHandlers,
  setupRulesAndSkillsIpcHandlers: () => setupRulesAndSkillsIpcHandlers,
  setupUpdaterIpcHandlers: () => setupUpdaterIpcHandlers,
  setupWorkspaceIpcHandlers: () => setupWorkspaceIpcHandlers
});
async function checkMacOSFullDiskAccess() {
  try {
    const testPath = path33.join(os5.homedir(), "Library", "Application Support", "com.apple.tccd");
    await fs32.access(testPath).catch(() => {
    });
    const testFile = path33.join(os5.homedir(), "Desktop", ".omni-perm-test");
    try {
      await fs32.writeFile(testFile, "test", { flag: "wx" });
      await fs32.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
async function checkMacOSAccessibility() {
  try {
    const { exec: exec2 } = await import("child_process");
    const { promisify: promisify3 } = await import("util");
    const execAsync2 = promisify3(exec2);
    try {
      await execAsync2('osascript -e "tell application \\"System Events\\" to get name of first application process"', {
        timeout: 5e3
      });
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
async function checkWindowsExecutionPolicy() {
  try {
    const { exec: exec2 } = await import("child_process");
    const { promisify: promisify3 } = await import("util");
    const execAsync2 = promisify3(exec2);
    const { stdout } = await execAsync2('powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"', {
      timeout: 1e4
    });
    const policy = stdout.trim();
    return policy === "RemoteSigned" || policy === "Unrestricted" || policy === "Bypass";
  } catch {
    return false;
  }
}
async function checkWindowsFirewall() {
  try {
    const { exec: exec2 } = await import("child_process");
    const { promisify: promisify3 } = await import("util");
    const execAsync2 = promisify3(exec2);
    const { stdout } = await execAsync2(
      'netsh advfirewall firewall show rule name="Omni Code"',
      { timeout: 1e4 }
    );
    return stdout.includes("Enabled") && stdout.includes("Allow");
  } catch {
    return false;
  }
}
async function checkLinuxGroups() {
  try {
    const { exec: exec2 } = await import("child_process");
    const { promisify: promisify3 } = await import("util");
    const execAsync2 = promisify3(exec2);
    const { stdout: groups } = await execAsync2("groups", { timeout: 5e3 });
    const usefulGroups = ["dialout", "docker", "video"];
    const userGroups = groups.trim().split(" ");
    return usefulGroups.some((g) => userGroups.includes(g));
  } catch {
    return false;
  }
}
async function checkLinuxFilePermissions() {
  try {
    const testFile = path33.join(os5.homedir(), ".omni-perm-test");
    await fs32.writeFile(testFile, "test", { flag: "wx" });
    await fs32.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}
function setAgentRef(agent) {
  agentRef = agent;
}
function setToolsRef(tools) {
  toolsRef = tools;
}
function setConfigRef(config) {
  configRef = config;
}
function getConfigModels() {
  const registry = getProviderRegistry();
  if (!registry)
    return [];
  const allModels = registry.getAllModels();
  return allModels.map((model) => {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;
    return {
      id: model.id,
      name: model.name || model.id,
      provider: model.provider,
      available: isProviderAvailable,
      maxContextWindow: model.capabilities?.maxContextWindow
    };
  });
}
function getConfigProviders() {
  const registry = getProviderRegistry();
  if (!registry)
    return [];
  const allModels = registry.getAllModels();
  const providers = /* @__PURE__ */ new Map();
  for (const model of allModels) {
    const provider = registry.getProvider(model.provider);
    const isProviderAvailable = provider?.isAvailable() ?? false;
    if (!providers.has(model.provider)) {
      providers.set(model.provider, {
        name: model.provider,
        available: isProviderAvailable,
        models: []
      });
    }
    providers.get(model.provider).models.push(model.id);
  }
  return Array.from(providers.values());
}
function setupIpcHandlers() {
  console.log("[IPC] setupIpcHandlers() called");
  import_electron11.ipcMain.handle("agent:create-conversation", async (event, conversationId, model, provider) => {
    const windowId = event.sender.id;
    if (!windowConversationsMap.has(windowId))
      windowConversationsMap.set(windowId, /* @__PURE__ */ new Set());
    windowConversationsMap.get(windowId).add(conversationId);
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().createConversation(conversationId, model, provider);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    const cwd = windowCwdMap.get(windowId);
    return agentRef.createConversation(conversationId, model, provider, cwd);
  });
  import_electron11.ipcMain.handle("agent:close-conversation", async (event, conversationId) => {
    const windowId = event.sender.id;
    windowConversationsMap.get(windowId)?.delete(conversationId);
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().closeConversation(conversationId);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.closeConversation(conversationId);
  });
  import_electron11.ipcMain.handle("agent:has-conversation", async (_, conversationId) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().hasConversation(conversationId);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.hasConversation(conversationId);
  });
  import_electron11.ipcMain.handle("agent:send-message", async (_, conversationId, message, workingDirectory, fileReferences, images) => {
    if (remoteClientMode.isActive()) {
      await remoteClientMode.getClient().sendMessage(conversationId, message, workingDirectory, fileReferences, images);
      return;
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    await agentRef.sendMessage(conversationId, message, workingDirectory, fileReferences, images);
  });
  import_electron11.ipcMain.handle("agent:abort", async (_, conversationId) => {
    if (remoteClientMode.isActive()) {
      await remoteClientMode.getClient().abort(conversationId);
      return;
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    agentRef.abort(conversationId);
  });
  import_electron11.ipcMain.handle("agent:switch-model", async (_, conversationId, model, provider) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().switchModel(conversationId, model, provider);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.switchModel(conversationId, model, provider);
  });
  import_electron11.ipcMain.handle("agent:clear-conversation", async (_, conversationId) => {
    if (remoteClientMode.isActive()) {
      await remoteClientMode.getClient().clearConversation(conversationId);
      return;
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    agentRef.clearConversation(conversationId);
  });
  import_electron11.ipcMain.handle("agent:get-token-count", async (_, conversationId) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().getTokenCount(conversationId);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.getTokenCount(conversationId);
  });
  import_electron11.ipcMain.handle("agent:respond-permission", async (_, toolId, decision) => {
    if (remoteClientMode.isActive()) {
      const success = await remoteClientMode.getClient().respondPermission(toolId, decision);
      return { success };
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return { success: agentRef.respondPermission(toolId, decision) };
  });
  import_electron11.ipcMain.handle("agent:respond-user-input", async (_, requestId, response, cancelled) => {
    if (remoteClientMode.isActive()) {
      const success = await remoteClientMode.getClient().respondUserInput(requestId, response, cancelled);
      return { success };
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return { success: agentRef.respondUserInput(requestId, response, cancelled) };
  });
  import_electron11.ipcMain.handle("agent:set-mode", async (_, conversationId, mode) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().setMode(conversationId, mode);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.setMode(conversationId, mode);
  });
  import_electron11.ipcMain.handle("agent:restore-history", async (_, conversationId, messages) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().restoreHistory(conversationId, messages);
    }
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.restoreHistory(conversationId, messages);
  });
  import_electron11.ipcMain.handle("agent:set-permission-mode", (_, autoRunMode) => {
    setPermissionMode(autoRunMode);
  });
  import_electron11.ipcMain.handle("agent:set-change-review-enabled", (_, enabled) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    agentRef.setChangeReviewEnabled(enabled);
  });
  import_electron11.ipcMain.handle("changes:respond", async (_, conversationId, messageId, toolCallId, decision) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.respondToChangeReview(conversationId, messageId, toolCallId, decision);
  });
  import_electron11.ipcMain.handle("changes:accept-all", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.acceptAllChanges(conversationId);
  });
  import_electron11.ipcMain.handle("changes:reject-all", async (_, conversationId, messageId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.rejectAllChanges(conversationId, messageId);
  });
  import_electron11.ipcMain.handle("tools:get-metadata", async (_, toolName) => {
    if (!toolsRef)
      return null;
    const tools = toolsRef.list();
    return tools.find((t) => t.name === toolName) || null;
  });
  import_electron11.ipcMain.handle("chat:save", async (_, workspacePath, conversation) => {
    return chatStorageRef.saveConversation(workspacePath, conversation);
  });
  import_electron11.ipcMain.handle("chat:load", async (_, workspacePath) => {
    return chatStorageRef.loadConversations(workspacePath);
  });
  import_electron11.ipcMain.handle("chat:delete", async (_, workspacePath, conversationId) => {
    const result = await chatStorageRef.deleteConversation(workspacePath, conversationId);
    try {
      const fileHistoryManager2 = getFileHistoryManager(workspacePath);
      await fileHistoryManager2.clearConversation(conversationId);
    } catch (error) {
      console.error("[IPC] Failed to clear file history for conversation:", error);
    }
    return result;
  });
  import_electron11.ipcMain.handle("chat:list", async (_, workspacePath) => {
    return chatStorageRef.listConversations(workspacePath);
  });
  const getMimeType = (filePath) => {
    const ext = path33.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".ico": "image/x-icon"
    };
    return mimeTypes[ext] || "application/octet-stream";
  };
  import_electron11.ipcMain.handle("file:read", async (_, filePath) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().readFile(filePath);
    }
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      const content = await fs32.readFile(resolvedPath, "utf-8");
      return { content };
    } catch (error) {
      return { content: "", error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:readBinary", async (_, filePath) => {
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      const buffer = await fs32.readFile(resolvedPath);
      const base64 = buffer.toString("base64");
      const mimeType = getMimeType(resolvedPath);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { dataUrl, size: buffer.length };
    } catch (error) {
      return { dataUrl: "", size: 0, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:write", async (_, filePath, content) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().writeFile(filePath, content);
    }
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      await fs32.mkdir(path33.dirname(resolvedPath), { recursive: true });
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), FILE_WRITE_TIMEOUT_MS);
      const byteLength = Buffer.byteLength(content, "utf-8");
      const needsChunking = byteLength > DEFAULT_CHUNK_THRESHOLD_BYTES;
      try {
        if (needsChunking) {
          const metadata = await writeLargeFile(resolvedPath, content, {
            signal: timeoutController.signal
          });
          return { success: true, metadata };
        }
        await fs32.writeFile(resolvedPath, content, {
          encoding: "utf-8",
          signal: timeoutController.signal
        });
        const writtenContent = await fs32.readFile(resolvedPath, "utf-8");
        if (writtenContent !== content) {
          return { success: false, error: "Write verification failed after saving file." };
        }
        return {
          success: true,
          metadata: {
            chunkCount: 1,
            bytesWritten: byteLength,
            verified: true,
            usedChunking: false
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Write timed out after ${FILE_WRITE_TIMEOUT_MS / 1e3}s. Try saving a smaller file or chunking the content.`
        };
      }
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:edit", async (_, filePath, oldString, newString) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().editFile(filePath, oldString, newString);
    }
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      const content = await fs32.readFile(resolvedPath, "utf-8");
      if (!content.includes(oldString)) {
        return { success: false, error: "Old string not found in file" };
      }
      const newContent = content.replace(oldString, newString);
      await fs32.writeFile(resolvedPath, newContent, "utf-8");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:list", async (_, dirPath) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().listFiles(dirPath);
    }
    console.log("[file:list] Listing directory:", dirPath);
    try {
      const resolvedPath = path33.isAbsolute(dirPath) ? dirPath : path33.join(getWorkingDirectory(), dirPath);
      console.log("[file:list] Resolved path:", resolvedPath);
      const entries = await fs32.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path33.join(resolvedPath, entry.name)
      }));
      console.log(`[file:list] Found ${files.length} entries in ${resolvedPath}`);
      return { files };
    } catch (error) {
      console.error("[file:list] Error:", error.message, "for path:", dirPath);
      return { files: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("project:scan", async (_, dirs) => {
    const found = [];
    for (const dir of dirs) {
      const entries = await fs32.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        const projectPath = path33.join(dir, entry.name);
        const hasOmnicode = await fs32.access(path33.join(projectPath, ".omnicode")).then(() => true).catch(() => false);
        if (hasOmnicode)
          found.push(projectPath);
      }
    }
    return { projects: [...new Set(found)] };
  });
  import_electron11.ipcMain.handle("file:mkdir", async (_, dirPath) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().mkdir(dirPath);
    }
    console.log("[file:mkdir] Creating directory:", dirPath);
    try {
      const resolvedPath = path33.isAbsolute(dirPath) ? dirPath : path33.join(getWorkingDirectory(), dirPath);
      await fs32.mkdir(resolvedPath, { recursive: true });
      console.log("[file:mkdir] Created successfully:", resolvedPath);
      return { success: true };
    } catch (error) {
      console.error("[file:mkdir] Error:", error.message, "for path:", dirPath);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:rename", async (_, oldPath, newPath) => {
    console.log("[file:rename] Renaming:", oldPath, "->", newPath);
    try {
      const resolvedOld = path33.isAbsolute(oldPath) ? oldPath : path33.join(getWorkingDirectory(), oldPath);
      const resolvedNew = path33.isAbsolute(newPath) ? newPath : path33.join(getWorkingDirectory(), newPath);
      await fs32.rename(resolvedOld, resolvedNew);
      console.log("[file:rename] Renamed successfully");
      return { success: true };
    } catch (error) {
      console.error("[file:rename] Error:", error.message);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:delete", async (_, filePath) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().deleteFile(filePath);
    }
    console.log("[file:delete] Deleting:", filePath);
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      await fs32.rm(resolvedPath, { recursive: true, force: true });
      console.log("[file:delete] Deleted successfully:", resolvedPath);
      return { success: true };
    } catch (error) {
      console.error("[file:delete] Error:", error.message, "for path:", filePath);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:revealInFinder", async (_, filePath) => {
    console.log("[file:revealInFinder] Revealing:", filePath);
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      import_electron11.shell.showItemInFolder(resolvedPath);
      console.log("[file:revealInFinder] Revealed successfully");
      return { success: true };
    } catch (error) {
      console.error("[file:revealInFinder] Error:", error.message);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:copyPath", async (_, filePath, type, workspacePath) => {
    console.log("[file:copyPath] Copying path:", filePath, "type:", type);
    try {
      const resolvedPath = path33.isAbsolute(filePath) ? filePath : path33.join(getWorkingDirectory(), filePath);
      const pathToCopy = type === "relative" ? path33.relative(workspacePath || getWorkingDirectory(), resolvedPath) : resolvedPath;
      import_electron11.clipboard.writeText(pathToCopy);
      console.log("[file:copyPath] Copied to clipboard:", pathToCopy);
      return { success: true };
    } catch (error) {
      console.error("[file:copyPath] Error:", error.message);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:watch", async (event, dirPath) => {
    try {
      const resolvedPath = path33.isAbsolute(dirPath) ? dirPath : path33.join(getWorkingDirectory(), dirPath);
      const existing = fileWatchers.get(resolvedPath);
      if (existing) {
        existing.abort();
      }
      const abortController = new AbortController();
      fileWatchers.set(resolvedPath, abortController);
      const IGNORED_DIRS = /* @__PURE__ */ new Set([
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        ".cache",
        ".turbo",
        ".nuxt",
        ".output",
        "__pycache__",
        ".venv",
        "venv",
        ".expo",
        ".parcel-cache",
        "coverage",
        ".svelte-kit"
      ]);
      const { watch: watch2 } = await import("fs");
      let pendingChanges = /* @__PURE__ */ new Map();
      let debounceTimer = null;
      const flushChanges = () => {
        const changes = Array.from(pendingChanges.entries());
        pendingChanges = /* @__PURE__ */ new Map();
        debounceTimer = null;
        import_electron11.BrowserWindow.getAllWindows().forEach((window) => {
          for (const [fullPath, type] of changes) {
            window.webContents.send("file:change", { type, path: fullPath });
          }
        });
      };
      const watcher = watch2(resolvedPath, { recursive: true }, (eventType, filename) => {
        if (!filename)
          return;
        const parts = filename.split(path33.sep);
        if (parts.some((p) => IGNORED_DIRS.has(p)))
          return;
        const fullPath = path33.join(resolvedPath, filename);
        const type = eventType === "rename" ? "unlink" : "change";
        pendingChanges.set(fullPath, type);
        if (!debounceTimer) {
          debounceTimer = setTimeout(flushChanges, 300);
        }
      });
      abortController.signal.addEventListener("abort", () => {
        if (debounceTimer)
          clearTimeout(debounceTimer);
        pendingChanges.clear();
        watcher.close();
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:unwatch", async (_, dirPath) => {
    const resolvedPath = path33.isAbsolute(dirPath) ? dirPath : path33.join(getWorkingDirectory(), dirPath);
    const watcher = fileWatchers.get(resolvedPath);
    if (watcher) {
      watcher.abort();
      fileWatchers.delete(resolvedPath);
    }
  });
  import_electron11.ipcMain.handle("file:searchContent", async (_, projectPath, searchTerm) => {
    if (remoteClientMode.isActive()) {
      return remoteClientMode.getClient().searchContent(projectPath, searchTerm);
    }
    try {
      const results = [];
      const MAX_RESULTS = 100;
      const MAX_FILE_SIZE = 1024 * 1024;
      const ignorePatterns = [
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        "out",
        "coverage",
        ".cache",
        "vendor"
      ];
      const binaryExtensions = /* @__PURE__ */ new Set([
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".ico",
        ".mp3",
        ".mp4",
        ".wav",
        ".avi",
        ".mov",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".zip",
        ".tar",
        ".gz",
        ".rar",
        ".7z",
        ".exe",
        ".dll",
        ".so",
        ".dylib",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot"
      ]);
      const shouldIgnore = (filePath) => {
        const normalizedPath = filePath.toLowerCase();
        return ignorePatterns.some(
          (pattern) => normalizedPath.includes(`/${pattern}/`) || normalizedPath.includes(`\\${pattern}\\`)
        );
      };
      const isBinary = (filePath) => {
        const ext = path33.extname(filePath).toLowerCase();
        return binaryExtensions.has(ext);
      };
      const searchFile = async (filePath) => {
        if (results.length >= MAX_RESULTS)
          return;
        if (isBinary(filePath))
          return;
        try {
          const stats = await fs32.stat(filePath);
          if (stats.size > MAX_FILE_SIZE)
            return;
          const content = await fs32.readFile(filePath, "utf-8");
          const lines = content.split("\n");
          const lowerTerm = searchTerm.toLowerCase();
          lines.forEach((line, index) => {
            if (results.length >= MAX_RESULTS)
              return;
            if (line.toLowerCase().includes(lowerTerm)) {
              const linePreview = line.trim().slice(0, 100);
              results.push({
                path: filePath,
                lineNumber: index + 1,
                preview: linePreview
              });
            }
          });
        } catch (error) {
        }
      };
      const searchDirectory = async (dirPath) => {
        if (results.length >= MAX_RESULTS)
          return;
        if (shouldIgnore(dirPath))
          return;
        try {
          const entries = await fs32.readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (results.length >= MAX_RESULTS)
              return;
            const fullPath = path33.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              await searchDirectory(fullPath);
            } else if (entry.isFile()) {
              await searchFile(fullPath);
            }
          }
        } catch (error) {
        }
      };
      await searchDirectory(projectPath);
      return { results };
    } catch (error) {
      return { results: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:backup", async (_, conversationId, messageId, toolCallId, filePath, changeType) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      await fileHistoryManager2.captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:restore", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const result = await fileHistoryManager2.rollbackToMessage(conversationId, messageId);
      return result;
    } catch (error) {
      return { success: false, restoredFiles: [], failedFiles: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:reapply", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const result = await fileHistoryManager2.reapplyMessage(conversationId, messageId);
      return result;
    } catch (error) {
      return { success: false, restoredFiles: [], failedFiles: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:getChanges", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const changes = await fileHistoryManager2.getMessageChangesWithStats(conversationId, messageId);
      return { changes };
    } catch (error) {
      return { changes: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:hasChanges", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const hasChanges = await fileHistoryManager2.hasChanges(conversationId, messageId);
      return { hasChanges };
    } catch (error) {
      return { hasChanges: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:getAllChanges", async (_, conversationId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const changes = await fileHistoryManager2.getAllConversationChanges(conversationId);
      return { changes };
    } catch (error) {
      return { changes: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("file:getDiff", async (_, conversationId, messageId, filePath) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectoryForConversation(conversationId));
      const changes = await fileHistoryManager2.getMessageChanges(conversationId, messageId);
      const change = changes.find((c) => c.filePath === filePath);
      if (!change) {
        return { before: "", after: "", error: "File change not found" };
      }
      return {
        before: change.beforeContent,
        after: change.afterContent || "",
        changeType: change.changeType
      };
    } catch (error) {
      return { before: "", after: "", error: error.message };
    }
  });
  import_electron11.ipcMain.handle("tool:execute", async (_, toolName, input) => {
    if (!toolsRef)
      throw new Error("Tools not initialized");
    try {
      const result = await toolsRef.execute(toolName, input);
      return { result };
    } catch (error) {
      return { result: null, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("tool:list", async () => {
    if (!toolsRef)
      return [];
    return toolsRef.list();
  });
  import_electron11.ipcMain.handle("config:get", async (_, key) => {
    if (!configRef)
      return null;
    return configRef.get(key);
  });
  import_electron11.ipcMain.handle("config:set", async (_, key, value) => {
    if (!configRef)
      throw new Error("Config not initialized");
    configRef.set(key, value);
  });
  import_electron11.ipcMain.handle("config:get-models", async () => {
    if (!configRef)
      return [];
    return configRef.getModels();
  });
  import_electron11.ipcMain.handle("config:get-providers", async () => {
    if (!configRef)
      return [];
    return configRef.getProviders();
  });
  import_electron11.ipcMain.handle("custom-models:test-connection", async (_, { baseUrl, apiKey }) => {
    try {
      const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const modelsUrl = `${normalizedUrl}/v1/models`;
      console.log(`[IPC] Testing custom endpoint connection: ${modelsUrl}`);
      const headers = {
        "Content-Type": "application/json"
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      const response = await fetch(modelsUrl, {
        method: "GET",
        headers,
        // Short timeout for the connection test
        signal: AbortSignal.timeout(1e4)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[IPC] Custom endpoint test failed: ${response.status} ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      const data = await response.json();
      const models = data.data?.map((m) => m.id) || [];
      console.log(`[IPC] Custom endpoint test successful, found ${models.length} models`);
      return {
        success: true,
        models
      };
    } catch (error) {
      console.error("[IPC] Custom endpoint test error:", error);
      const errorMessage = error instanceof Error ? error.message : "Connection failed";
      return {
        success: false,
        error: errorMessage
      };
    }
  });
  import_electron11.ipcMain.handle("config:set-cwd", async (event, cwd) => {
    const windowId = event.sender.id;
    windowCwdMap.set(windowId, cwd);
    const conversationIds = [...windowConversationsMap.get(windowId) ?? []];
    await setWorkingDirectoryForWindow(cwd, conversationIds);
    const sharedManager = getSharedWorkspaceManager();
    try {
      await sharedManager.addFolder(cwd);
      console.log("[IPC] Added folder to shared workspaces:", cwd);
    } catch (err) {
      console.log("[IPC] Folder may already be shared:", cwd);
    }
    sharedManager.syncAllWorkspaces().catch((err) => {
      console.error("[IPC] Failed to sync shared workspaces after cwd change:", err);
    });
    return { success: true };
  });
  import_electron11.ipcMain.handle("config:get-cwd", async () => {
    return { cwd: getWorkingDirectory() };
  });
  import_electron11.ipcMain.handle("config:set-workspace-context", async (event, activeFolderPath, workspaceName, folders) => {
    const windowId = event.sender.id;
    windowCwdMap.set(windowId, activeFolderPath);
    const conversationIds = [...windowConversationsMap.get(windowId) ?? []];
    console.log(`[IPC] config:set-workspace-context "${workspaceName}" with ${folders.length} folders, active: ${activeFolderPath}`);
    await setWorkspaceContext(activeFolderPath, workspaceName, folders, conversationIds);
    return { success: true };
  });
  import_electron11.ipcMain.handle("config:clear-workspace-context", () => {
    clearWorkspaceContext();
    return { success: true };
  });
  import_electron11.ipcMain.handle("dialog:open-folder", async () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null };
    const result = await import_electron11.dialog.showOpenDialog(window, {
      properties: ["openDirectory", "createDirectory"],
      title: "Open Folder"
    });
    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null
    };
  });
  import_electron11.ipcMain.handle("dialog:create-folder", async () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null, error: "No window available" };
    const result = await import_electron11.dialog.showOpenDialog(window, {
      properties: ["openDirectory", "createDirectory"],
      title: "Create or Select a Project Folder",
      buttonLabel: "Select Folder",
      message: "Create a new folder or select an existing one"
    });
    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true, path: null };
    }
    return { canceled: false, path: result.filePaths[0] };
  });
  import_electron11.ipcMain.handle("dialog:open-workspace", async () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null };
    const result = await import_electron11.dialog.showOpenDialog(window, {
      title: "Open Workspace",
      buttonLabel: "Open Workspace",
      filters: [{ name: "Omni Code Workspace", extensions: ["omnicode-workspace"] }],
      properties: ["openFile"]
    });
    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null
    };
  });
  import_electron11.ipcMain.handle("app:get-version", async () => {
    const { app: app6 } = require("electron");
    return app6.getVersion();
  });
  import_electron11.ipcMain.handle("app:get-platform", async () => {
    return process.platform;
  });
  import_electron11.ipcMain.handle("usage:get", async (_, month, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getUsage(month, workspacePath);
    } catch (error) {
      return { error: error.message };
    }
  });
  import_electron11.ipcMain.handle("usage:getSummary", async (_, month, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getSummary(month, workspacePath);
    } catch (error) {
      return {
        totalCost: 0,
        totalTokens: 0,
        requestCount: 0,
        byModel: {},
        byProvider: {},
        error: error.message
      };
    }
  });
  import_electron11.ipcMain.handle("usage:getAvailableMonths", async (_, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getAvailableMonths(workspacePath);
    } catch (error) {
      return [];
    }
  });
  import_electron11.ipcMain.handle("usage:setLimit", async (_, month, limit) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.setMonthlyLimit(month, limit);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("usage:getLimits", async () => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getAllMonthlyLimits();
    } catch (error) {
      return {};
    }
  });
  import_electron11.ipcMain.handle("usage:getModelPricing", async () => {
    try {
      return MODEL_REGISTRY.map((model) => ({
        id: model.id,
        displayName: model.displayName,
        provider: model.provider,
        inputPerMillion: model.pricing.inputPerMillion,
        outputPerMillion: model.pricing.outputPerMillion,
        cacheReadPerMillion: model.pricing.cacheReadPerMillion,
        cacheWritePerMillion: model.pricing.cacheWritePerMillion
      }));
    } catch (error) {
      return [];
    }
  });
  import_electron11.ipcMain.handle("usage:cleanup", async (_, monthsToKeep) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.cleanupOldData(monthsToKeep);
    } catch (error) {
      return { deleted: 0, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("usage:export", async (_, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.exportToCSV(workspacePath);
    } catch (error) {
      return { error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:start", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.startIndexing();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to start indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:reindex", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.reindex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to reindex:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:stop", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      indexer.abort();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to stop indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:getState", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const state = indexer.getState();
      return { state, error: null };
    } catch (error) {
      console.error("[IPC] Failed to get indexing state:", error);
      return { state: null, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:query", async (_, projectPath, query, topK) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const results = await indexer.query(query, topK || 5);
      return { results, error: null };
    } catch (error) {
      console.error("[IPC] Failed to query index:", error);
      return { results: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:clear", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.clearIndex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to clear index:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:close", async (_, projectPath) => {
    try {
      await closeProjectIndexer(projectPath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close indexer:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("indexing:closeAll", async () => {
    try {
      await closeAllProjectIndexers();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close all indexers:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("window:minimize", () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    window?.minimize();
  });
  import_electron11.ipcMain.handle("window:maximize", () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });
  import_electron11.ipcMain.handle("window:close", () => {
    const window = import_electron11.BrowserWindow.getFocusedWindow();
    window?.close();
  });
  import_electron11.ipcMain.handle("notification:request-sound", async (event, type) => {
    const window = import_electron11.BrowserWindow.fromWebContents(event.sender);
    if (window) {
      await requestNotificationSound(window, type);
    }
  });
  import_electron11.ipcMain.handle("dialogs:select-sound-file", async () => {
    const { dialog: dialog2 } = await import("electron");
    const result = await dialog2.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Audio Files", extensions: ["mp3", "wav", "ogg", "m4a", "webm", "aiff"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], error: null };
    }
    return { filePath: null, error: null };
  });
  import_electron11.ipcMain.handle("terminal:create", async (event, id, cwd, cols, rows) => {
    if (remoteClientMode.isActive()) {
      const result = await remoteClientMode.getClient().createTerminal(id, cwd, cols, rows);
      if (result.success) {
        remoteClientMode.subscribeTerminalStream(id);
      }
      return result;
    }
    const window = import_electron11.BrowserWindow.fromWebContents(event.sender);
    if (!window)
      return { success: false, error: "No window found" };
    try {
      createTerminal(id, cwd, cols, rows, window);
      return { success: true };
    } catch (error) {
      console.error("[Terminal] Failed to create terminal:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("terminal:write", async (_, id, data) => {
    if (remoteClientMode.isActive()) {
      await remoteClientMode.getClient().writeTerminal(id, data);
      return;
    }
    writeToTerminal(id, data);
  });
  import_electron11.ipcMain.handle("terminal:resize", async (_, id, cols, rows) => {
    if (remoteClientMode.isActive()) {
      await remoteClientMode.getClient().resizeTerminal(id, cols, rows);
      return;
    }
    resizeTerminal(id, cols, rows);
  });
  import_electron11.ipcMain.handle("terminal:destroy", async (_, id) => {
    if (remoteClientMode.isActive()) {
      remoteClientMode.unsubscribeTerminalStream(id);
      await remoteClientMode.getClient().destroyTerminal(id);
      return;
    }
    destroyTerminal(id);
  });
  import_electron11.ipcMain.handle("browser:open", async (event, url, title) => {
    const win = import_electron11.BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: "Main window not available" };
    }
    win.webContents.send("browser:open", { url, title });
    return { success: true, url };
  });
  import_electron11.ipcMain.handle("browser:navigate", async (event, tabId, url) => {
    const win = import_electron11.BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: "Main window not available" };
    }
    win.webContents.send("browser:navigate", { tabId, url });
    return { success: true, tabId, url };
  });
  import_electron11.ipcMain.handle("browser:close", async (event, tabId) => {
    const win = import_electron11.BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: "Main window not available" };
    }
    win.webContents.send("browser:close", { tabId });
    return { success: true, tabId };
  });
  pendingScreenshotRequests.clear();
  import_electron11.ipcMain.handle("browser:request-screenshot", async (event, tabId) => {
    const win = import_electron11.BrowserWindow.fromWebContents(event.sender) ?? mainWindowRef;
    if (!win) {
      return { success: false, error: "Main window not available" };
    }
    win.webContents.send("browser:request-screenshot", { tabId });
    return new Promise((resolve12) => {
      const timeout = setTimeout(() => {
        pendingScreenshotRequests.delete(tabId);
        resolve12({ success: false, error: "Screenshot request timed out" });
      }, 3e4);
      pendingScreenshotRequests.set(tabId, {
        resolve: (result) => {
          clearTimeout(timeout);
          pendingScreenshotRequests.delete(tabId);
          resolve12({ success: !result.error, ...result });
        },
        reject: (error) => {
          clearTimeout(timeout);
          pendingScreenshotRequests.delete(tabId);
          resolve12({ success: false, error: error.message });
        }
      });
    });
  });
  import_electron11.ipcMain.handle("browser:screenshot-response", async (_, { tabId, dataUrl, error }) => {
    const pending = pendingScreenshotRequests.get(tabId);
    if (pending) {
      pending.resolve({ dataUrl, error });
    }
    return { success: true };
  });
  import_electron11.ipcMain.handle("remote:start", async () => {
    try {
      const { initializeRemoteServer: initializeRemoteServer2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      const result = await initializeRemoteServer2();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote:stop", async () => {
    try {
      const { stopRemoteServer: stopRemoteServer2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      return await stopRemoteServer2();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote:status", async () => {
    try {
      const { getRemoteServerStatus: getRemoteServerStatus2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      return getRemoteServerStatus2();
    } catch (error) {
      return { running: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote:regenerate-api-key", async () => {
    try {
      const { regenerateApiKey: regenerateApiKey2 } = await Promise.resolve().then(() => (init_remote_auth(), remote_auth_exports));
      const newKey = regenerateApiKey2();
      return { success: true, apiKey: newKey };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote:generate-qr", async () => {
    try {
      const { getRemoteServerStatus: getRemoteServerStatus2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      const { default: QRCode } = await import("qrcode");
      const status = getRemoteServerStatus2();
      if (!status.running || !status.url || !status.apiKey) {
        return { success: false, error: "Remote server is not running or not configured" };
      }
      const qrData = {
        url: status.url,
        key: status.apiKey,
        name: "Omni Code Desktop"
      };
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });
      return {
        success: true,
        qrCodeDataUrl,
        url: status.url
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote-client:connect", async (_, url, apiKey) => {
    try {
      const { settingsManager: settingsManager2 } = await Promise.resolve().then(() => (init_settings(), settings_exports));
      settingsManager2.set("remoteClient.url", url);
      settingsManager2.set("remoteClient.apiKey", apiKey);
      return await remoteClientMode.connect(url, apiKey);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote-client:disconnect", async () => {
    try {
      await remoteClientMode.disconnect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("remote-client:status", async () => {
    return remoteClientMode.getStatus();
  });
  import_electron11.ipcMain.handle("remote-client:test-connection", async (_, url, apiKey) => {
    try {
      const { RemoteClient: RemoteClient2 } = await Promise.resolve().then(() => (init_remote_client(), remote_client_exports));
      const client = new RemoteClient2({ baseUrl: url, apiKey });
      return await client.testConnection();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  console.log("[IPC:system] Registering system permission handlers...");
  import_electron11.ipcMain.handle("system:check-permissions", async () => {
    const platform2 = process.platform;
    const permissions = {
      platform: platform2,
      allGranted: true,
      permissions: []
    };
    try {
      if (platform2 === "darwin") {
        const privacyUrl = "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension";
        permissions.permissions = [
          {
            name: "Full Disk Access",
            granted: await checkMacOSFullDiskAccess(),
            required: true,
            description: "Required to access files in protected locations (Desktop, Documents, etc.)",
            macosSetting: privacyUrl
          },
          {
            name: "Accessibility",
            granted: await checkMacOSAccessibility(),
            required: false,
            description: "Recommended for window management and terminal operations",
            macosSetting: privacyUrl
          }
        ];
      } else if (platform2 === "win32") {
        permissions.permissions = [
          {
            name: "PowerShell Execution Policy",
            granted: await checkWindowsExecutionPolicy(),
            required: false,
            description: "Required to run PowerShell scripts remotely",
            windowsSetting: "ms-settings:developers"
          },
          {
            name: "Windows Firewall",
            granted: await checkWindowsFirewall(),
            required: true,
            description: "Required for mobile app to connect to the server",
            windowsSetting: "ms-settings:windowsdefender"
          }
        ];
      } else if (platform2 === "linux") {
        permissions.permissions = [
          {
            name: "User Groups",
            granted: await checkLinuxGroups(),
            required: false,
            description: "Recommended for hardware access (serial ports, Docker, etc.)",
            linuxSetting: "users"
          },
          {
            name: "File Permissions",
            granted: await checkLinuxFilePermissions(),
            required: true,
            description: "Required to read and write project files"
          }
        ];
      }
      permissions.allGranted = permissions.permissions.every((p) => !p.required || p.granted);
      return permissions;
    } catch (error) {
      console.error("[IPC:system] Error checking permissions:", error);
      return {
        platform: platform2,
        allGranted: false,
        permissions: [],
        error: error.message
      };
    }
  });
  import_electron11.ipcMain.handle("system:open-settings", async (_, setting) => {
    const platform2 = process.platform;
    try {
      if (platform2 === "darwin") {
        const url = setting && setting.startsWith("x-apple.systempreferences:") ? setting : "x-apple.systempreferences:com.apple.preference.security";
        const { execFile: ef } = await import("child_process");
        const { promisify: promisify3 } = await import("util");
        const efAsync = promisify3(ef);
        try {
          await efAsync("open", [url]);
        } catch {
          await import_electron11.shell.openExternal(url);
        }
      } else if (platform2 === "win32") {
        const url = setting && setting.startsWith("ms-settings:") ? setting : "ms-settings:privacy";
        await import_electron11.shell.openExternal(url);
      } else if (platform2 === "linux") {
        const { exec: ex } = await import("child_process");
        const { promisify: promisify3 } = await import("util");
        const exAsync = promisify3(ex);
        const desktop = process.env.XDG_CURRENT_DESKTOP?.toLowerCase() || "";
        try {
          if (desktop.includes("gnome") || desktop.includes("ubuntu")) {
            await exAsync("gnome-control-center privacy", { timeout: 5e3 });
          } else if (desktop.includes("kde")) {
            await exAsync("systemsettings5", { timeout: 5e3 });
          } else {
            await exAsync("xdg-open settings:", { timeout: 5e3 });
          }
        } catch {
        }
      }
      return { success: true };
    } catch (error) {
      console.error("[IPC:system] Error opening settings:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("system:request-permission", async (_, permissionName) => {
    const platform2 = process.platform;
    try {
      if (platform2 === "darwin") {
        if (permissionName === "Accessibility") {
          const already = import_electron11.systemPreferences.isTrustedAccessibilityClient(false);
          if (already)
            return { success: true, granted: true, method: "already-granted" };
          import_electron11.systemPreferences.isTrustedAccessibilityClient(true);
          await new Promise((r) => setTimeout(r, 1500));
          const granted = import_electron11.systemPreferences.isTrustedAccessibilityClient(false);
          return { success: true, granted, method: "prompt" };
        }
        if (permissionName === "Full Disk Access") {
          const { execFile: ef } = await import("child_process");
          const { promisify: promisify3 } = await import("util");
          const efAsync = promisify3(ef);
          try {
            await efAsync("open", ["x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AllFiles"]);
          } catch {
            try {
              await efAsync("open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"]);
            } catch {
              await import_electron11.shell.openExternal("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension");
            }
          }
          const appName = import_electron11.app.getName();
          await import_electron11.dialog.showMessageBox({
            type: "information",
            title: "Grant Full Disk Access",
            message: `System Settings has been opened to Full Disk Access.`,
            detail: [
              `To allow ${appName} to run commands remotely without permission prompts:`,
              "",
              '1. Find "Omni Code" in the list (or click "+" to add it)',
              "2. Toggle the switch ON next to Omni Code",
              '3. Click "Quit & Reopen" if prompted',
              '4. Come back here and click "Refresh" to verify'
            ].join("\n"),
            buttons: ["OK"],
            defaultId: 0
          });
          const granted = await checkMacOSFullDiskAccess();
          return { success: true, granted, method: "manual-settings" };
        }
      } else if (platform2 === "win32") {
        if (permissionName === "PowerShell Execution Policy") {
          const { exec: ex } = await import("child_process");
          const { promisify: promisify3 } = await import("util");
          const exAsync = promisify3(ex);
          try {
            await exAsync(
              'powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"',
              { timeout: 15e3 }
            );
            const granted = await checkWindowsExecutionPolicy();
            return { success: true, granted, method: "auto" };
          } catch (err) {
            return { success: false, granted: false, error: err.message };
          }
        }
        if (permissionName === "Windows Firewall") {
          const { exec: ex } = await import("child_process");
          const { promisify: promisify3 } = await import("util");
          const exAsync = promisify3(ex);
          const exePath = import_electron11.app.getPath("exe");
          const appName = import_electron11.app.getName();
          try {
            await exAsync(
              `netsh advfirewall firewall add rule name="${appName}" dir=in action=allow program="${exePath}" enable=yes`,
              { timeout: 15e3 }
            );
            const granted = await checkWindowsFirewall();
            return { success: true, granted, method: "auto" };
          } catch {
            await import_electron11.shell.openExternal("ms-settings:windowsdefender");
            await import_electron11.dialog.showMessageBox({
              type: "information",
              title: "Allow Through Firewall",
              message: "Windows Security has been opened.",
              detail: [
                `To allow ${appName} through the firewall:`,
                "",
                '1. Go to "Firewall & network protection"',
                '2. Click "Allow an app through firewall"',
                '3. Click "Change settings" then "Allow another app"',
                `4. Browse to the Omni Code executable and add it`,
                "5. Ensure both Private and Public are checked"
              ].join("\n"),
              buttons: ["OK"],
              defaultId: 0
            });
            return { success: true, granted: false, method: "manual-settings" };
          }
        }
      }
      return { success: false, granted: false, error: "No automatic grant available for this permission" };
    } catch (error) {
      console.error("[IPC:system] Error requesting permission:", error);
      return { success: false, granted: false, error: error.message };
    }
  });
  console.log("[IPC:git] Registering git handlers...");
  const GIT_MANAGER_CACHE_MAX = 10;
  const gitManagerCache = /* @__PURE__ */ new Map();
  function getGitManager(cwd) {
    let mgr = gitManagerCache.get(cwd);
    if (mgr) {
      gitManagerCache.delete(cwd);
      gitManagerCache.set(cwd, mgr);
      return mgr;
    }
    mgr = new GitManager(cwd);
    gitManagerCache.set(cwd, mgr);
    if (gitManagerCache.size > GIT_MANAGER_CACHE_MAX) {
      const oldest = gitManagerCache.keys().next().value;
      if (oldest)
        gitManagerCache.delete(oldest);
    }
    return mgr;
  }
  import_electron11.ipcMain.handle("git:is-repo", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      const isRepo = await git.isRepo();
      return { isRepo };
    } catch (error) {
      return { isRepo: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:status", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      const status = await git.statusStructured();
      return { status };
    } catch (error) {
      return { status: null, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:stage", async (_, cwd, files) => {
    try {
      const git = getGitManager(cwd);
      await git.add(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:stage-all", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      await git.addAll();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:unstage", async (_, cwd, files) => {
    try {
      const git = getGitManager(cwd);
      await git.unstage(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:commit", async (_, cwd, message) => {
    try {
      const git = getGitManager(cwd);
      const hash = await git.commit(message);
      return { success: true, hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:push", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      await git.push();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:pull", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      await git.pull();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:fetch", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      await git.fetch();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:diff-file", async (_, cwd, filePath, staged) => {
    try {
      const git = getGitManager(cwd);
      const diff = await git.diffFile(filePath, staged ?? false);
      return { diff };
    } catch (error) {
      return { diff: "", error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:discard", async (_, cwd, files) => {
    try {
      const git = getGitManager(cwd);
      await git.discardFile(files);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:branch-list", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      const branches = await git.listBranches();
      const current = await git.currentBranch();
      return { branches, current };
    } catch (error) {
      return { branches: [], current: "", error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:checkout", async (_, cwd, branch) => {
    try {
      const git = getGitManager(cwd);
      await git.switchBranch(branch);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:create-branch", async (_, cwd, name) => {
    try {
      const git = getGitManager(cwd);
      await git.createBranch(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:log", async (_, cwd, maxCount) => {
    try {
      const git = getGitManager(cwd);
      const commits = await git.logStructured(maxCount ?? 20);
      return { commits };
    } catch (error) {
      return { commits: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("git:init", async (_, cwd) => {
    try {
      const git = getGitManager(cwd);
      await git.init();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  console.log("[IPC:git] All git handlers registered");
  console.log("[IPC] Registering plan file handlers...");
  import_electron11.ipcMain.handle("plan:create-file", async (_, workspaceRoot, plan, conversationId) => {
    try {
      const filePath = await createPlanFile(workspaceRoot, plan, conversationId);
      watchPlanFile(filePath, conversationId, (convId, data) => {
        import_electron11.BrowserWindow.getAllWindows().forEach((win) => {
          win.webContents.send("plan:file-changed", { conversationId: convId, plan: data });
        });
      });
      return { success: true, filePath };
    } catch (error) {
      console.error("[IPC] plan:create-file error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("plan:update-step", async (_, filePath, stepId, status) => {
    try {
      await updatePlanStep(filePath, stepId, status);
      return { success: true };
    } catch (error) {
      console.error("[IPC] plan:update-step error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("plan:mark-approved", async (_, filePath) => {
    try {
      await markPlanApproved(filePath);
      return { success: true };
    } catch (error) {
      console.error("[IPC] plan:mark-approved error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("plan:open-file", async (_, filePath) => {
    try {
      await openPlanFile(filePath);
      return { success: true };
    } catch (error) {
      console.error("[IPC] plan:open-file error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("plan:read-file", async (_, filePath) => {
    try {
      const data = await readPlanFile(filePath);
      return { success: true, data };
    } catch (error) {
      console.error("[IPC] plan:read-file error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("plan:stop-watching", async (_, filePath) => {
    try {
      stopWatchingPlanFile(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  console.log("[IPC] Plan file handlers registered");
}
async function requestScreenshot(tabId) {
  if (!mainWindowRef) {
    return { error: "Main window not available" };
  }
  mainWindowRef.webContents.send("browser:request-screenshot", { tabId });
  return new Promise((resolve12) => {
    const timeout = setTimeout(() => {
      pendingScreenshotRequests.delete(tabId);
      resolve12({ error: "Screenshot request timed out" });
    }, 3e4);
    pendingScreenshotRequests.set(tabId, {
      resolve: (result) => {
        clearTimeout(timeout);
        pendingScreenshotRequests.delete(tabId);
        resolve12(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        pendingScreenshotRequests.delete(tabId);
        resolve12({ error: error.message });
      }
    });
  });
}
function setMainWindowForBrowser(window) {
  mainWindowRef = window;
}
function setupRulesAndSkillsIpcHandlers() {
  import_electron11.ipcMain.handle("rules:list", async () => {
    try {
      return { rules: rulesManager.getAllRules(), error: null };
    } catch (error) {
      return { rules: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("rules:save", async (_, id, fullContent) => {
    try {
      await rulesManager.saveRuleFile(id, fullContent);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("rules:delete", async (_, id) => {
    try {
      await rulesManager.deleteRule(id);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("rules:toggle", async (_, id, enabled) => {
    try {
      await rulesManager.toggleRule(id, enabled);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("skills:list", async () => {
    try {
      return { skills: skillsManager.getAllSkills(), error: null };
    } catch (error) {
      return { skills: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("skills:get", async (_, id) => {
    try {
      const skill = skillsManager.getSkill(id);
      return { skill: skill || null, error: skill ? null : "Skill not found" };
    } catch (error) {
      return { skill: null, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("skills:save", async (_, id, content) => {
    try {
      await skillsManager.saveSkill(id, content);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("skills:delete", async (_, id) => {
    try {
      await skillsManager.deleteSkill(id);
      refreshSystemPrompt();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  const getAddonsDir2 = () => path33.join(import_electron11.app.getPath("userData"), "addons");
  const downloadFile = (url, destPath) => {
    return new Promise((resolve12, reject) => {
      let redirects = 0;
      const doGet = (targetUrl) => {
        const mod = targetUrl.startsWith("https:") ? https2 : http3;
        mod.get(targetUrl, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
            if (++redirects > 5) {
              reject(new Error("Too many redirects"));
              return;
            }
            doGet(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            return;
          }
          const fileStream = fsSync3.createWriteStream(destPath);
          res.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve12();
          });
          fileStream.on("error", reject);
        }).on("error", reject);
      };
      doGet(url);
    });
  };
  import_electron11.ipcMain.handle("addons:list", async () => {
    try {
      const addonsDir = getAddonsDir2();
      await fs32.mkdir(addonsDir, { recursive: true });
      const entries = await fs32.readdir(addonsDir, { withFileTypes: true });
      const manifests = [];
      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        const manifestPath = path33.join(addonsDir, entry.name, "manifest.json");
        try {
          const raw = await fs32.readFile(manifestPath, "utf-8");
          manifests.push(JSON.parse(raw));
        } catch {
        }
      }
      return { manifests, error: null };
    } catch (error) {
      return { manifests: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("addons:install", async (_, manifest) => {
    try {
      if (!manifest?.id || !manifest?.download) {
        return { success: false, error: "Invalid manifest: missing id or download URL" };
      }
      const addonsDir = getAddonsDir2();
      const addonDir = path33.join(addonsDir, manifest.id);
      const zipPath = path33.join(os5.tmpdir(), `omni-addon-${manifest.id}-${Date.now()}.zip`);
      await downloadFile(manifest.download, zipPath);
      await fs32.mkdir(addonDir, { recursive: true });
      await new Promise((resolve12, reject) => {
        (0, import_node_child_process8.execFile)("unzip", ["-o", "-q", zipPath, "-d", addonDir], (err) => {
          if (err)
            reject(err);
          else
            resolve12();
        });
      });
      await fs32.unlink(zipPath).catch(() => {
      });
      const contents = await fs32.readdir(addonDir, { withFileTypes: true });
      const subdirs = contents.filter((e) => e.isDirectory());
      if (contents.length === 1 && subdirs.length === 1) {
        const innerDir = path33.join(addonDir, subdirs[0].name);
        const innerContents = await fs32.readdir(innerDir);
        for (const item of innerContents) {
          await fs32.rename(path33.join(innerDir, item), path33.join(addonDir, item));
        }
        await fs32.rmdir(innerDir);
      }
      await fs32.writeFile(
        path33.join(addonDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      );
      await reloadAddons();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("addons:uninstall", async (_, id) => {
    try {
      if (!id || typeof id !== "string" || id.includes("..") || path33.isAbsolute(id)) {
        return { success: false, error: "Invalid add-on ID" };
      }
      const addonDir = path33.join(getAddonsDir2(), id);
      await fs32.rm(addonDir, { recursive: true, force: true });
      await reloadAddons();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
function setupUpdaterIpcHandlers() {
  if (!import_electron11.app.isPackaged)
    return;
  const { autoUpdater } = require("electron-updater");
  autoUpdater.on("update-available", (info) => {
    const win = import_electron11.BrowserWindow.getAllWindows()[0];
    win?.webContents.send("app:update-available", info);
  });
  autoUpdater.on("update-downloaded", (info) => {
    const win = import_electron11.BrowserWindow.getAllWindows()[0];
    win?.webContents.send("app:update-downloaded", info);
  });
  autoUpdater.on("error", (err) => {
    console.error("[Updater] Error:", err);
  });
  import_electron11.ipcMain.handle("app:check-for-updates", async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err) {
      return { error: String(err) };
    }
  });
  import_electron11.ipcMain.handle("app:install-update", () => {
    autoUpdater.quitAndInstall(false, true);
  });
  import_electron11.ipcMain.handle("window:new", async () => {
    const { createWindow: createWindow2 } = await Promise.resolve().then(() => (init_app_window(), app_window_exports));
    await createWindow2();
    return { success: true };
  });
}
function setupWorkspaceIpcHandlers() {
  console.log("[IPC] Registering workspace handlers...");
  const workspaceStorage2 = getWorkspaceStorage();
  import_electron11.ipcMain.handle("workspace:create", async (_, options) => {
    console.log("[IPC] workspace:create called:", options);
    try {
      const window = import_electron11.BrowserWindow.getFocusedWindow();
      const safeName = (options.name || "workspace").replace(/[^a-zA-Z0-9_-]/g, "_");
      const saveResult = await import_electron11.dialog.showSaveDialog(window, {
        title: "Save Workspace",
        defaultPath: safeName,
        buttonLabel: "Save Workspace",
        filters: [{ name: "Omni Code Workspace", extensions: ["omnicode-workspace"] }],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (saveResult.canceled || !saveResult.filePath) {
        console.log("[IPC] workspace:create canceled by user");
        return { success: false, error: "canceled" };
      }
      const filePath = saveResult.filePath;
      console.log("[IPC] workspace:create save path chosen:", filePath);
      const result = await workspaceStorage2.createWorkspace(options);
      if (!result.success || !result.workspace) {
        console.error("[IPC] workspace:create storage failed:", result.error);
        return result;
      }
      await Promise.all(
        (options.folders ?? []).map(
          (fp) => fs32.mkdir(path33.join(fp, ".omnicode"), { recursive: true }).catch((e) => {
            console.warn(`[IPC] workspace:create could not create .omnicode in ${fp}:`, e.message);
          })
        )
      );
      const saveFileResult = await workspaceStorage2.saveWorkspaceToFile(result.workspace, filePath);
      if (!saveFileResult.success) {
        console.error("[IPC] workspace:create saveWorkspaceToFile failed:", saveFileResult.error);
        return { success: false, error: saveFileResult.error };
      }
      const { settingsManager: sm } = await Promise.resolve().then(() => (init_settings(), settings_exports));
      sm.addRecentWorkspace(filePath);
      console.log("[IPC] workspace:create added to recent workspaces:", filePath);
      try {
        const sharedManager = getSharedWorkspaceManager();
        await sharedManager.addWorkspaceFile(filePath);
        console.log("[IPC] workspace:create registered with SharedWorkspaceManager");
      } catch (sharedErr) {
        console.warn("[IPC] workspace:create SharedWorkspaceManager registration failed:", sharedErr);
      }
      console.log("[IPC] workspace:create succeeded, file at:", filePath);
      return { success: true, workspace: saveFileResult.workspace, filePath };
    } catch (error) {
      console.error("[IPC] workspace:create error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:loadFromFile", async (_, filePath) => {
    console.log("[IPC] workspace:loadFromFile called:", filePath);
    try {
      const result = await workspaceStorage2.loadWorkspaceFromFile(filePath);
      console.log("[IPC] workspace:loadFromFile result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:loadFromFile error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:update", async (_, workspace) => {
    console.log("[IPC] workspace:update called:", workspace.id);
    try {
      const result = await workspaceStorage2.updateWorkspace(workspace);
      console.log("[IPC] workspace:update result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:update error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:addFolder", async (_, workspaceId, folderPath, folderName) => {
    console.log("[IPC] workspace:addFolder called:", { workspaceId, folderPath, folderName });
    try {
      const result = await workspaceStorage2.addFolderToWorkspace(workspaceId, folderPath, folderName);
      console.log("[IPC] workspace:addFolder result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:addFolder error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:removeFolder", async (_, workspaceId, folderId) => {
    console.log("[IPC] workspace:removeFolder called:", { workspaceId, folderId });
    try {
      const result = await workspaceStorage2.removeFolderFromWorkspace(workspaceId, folderId);
      console.log("[IPC] workspace:removeFolder result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:removeFolder error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:rename", async (_, workspaceId, newName) => {
    console.log("[IPC] workspace:rename called:", { workspaceId, newName });
    try {
      const result = await workspaceStorage2.renameWorkspace(workspaceId, newName);
      console.log("[IPC] workspace:rename result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:rename error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:list", async () => {
    console.log("[IPC] workspace:list called");
    try {
      const result = await workspaceStorage2.listWorkspaces();
      console.log("[IPC] workspace:list result:", result.workspaces.length, "workspaces");
      return result;
    } catch (error) {
      console.error("[IPC] workspace:list error:", error);
      return { workspaces: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:export", async (_, workspaceId, targetDir) => {
    console.log("[IPC] workspace:export called:", { workspaceId, targetDir });
    try {
      const result = await workspaceStorage2.exportWorkspace(workspaceId, targetDir);
      console.log("[IPC] workspace:export result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:export error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:import", async (_, sourceDir) => {
    console.log("[IPC] workspace:import called:", sourceDir);
    try {
      const result = await workspaceStorage2.importWorkspace(sourceDir);
      console.log("[IPC] workspace:import result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:import error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:delete", async (_, workspaceId, deleteData) => {
    console.log("[IPC] workspace:delete called:", { workspaceId, deleteData });
    try {
      const result = await workspaceStorage2.deleteWorkspace(workspaceId, deleteData);
      console.log("[IPC] workspace:delete result:", result.success);
      return result;
    } catch (error) {
      console.error("[IPC] workspace:delete error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:chat:load", async (_, workspace) => {
    try {
      const storagePath = await workspaceStorage2.getWorkspaceStoragePath(workspace.id);
      return chatStorageRef.loadConversations(storagePath);
    } catch (error) {
      console.error("[IPC] workspace:chat:load error:", error);
      return { conversations: [], error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:chat:save", async (_, workspace, conversation) => {
    try {
      const storagePath = await workspaceStorage2.getWorkspaceStoragePath(workspace.id);
      return chatStorageRef.saveConversation(storagePath, conversation);
    } catch (error) {
      console.error("[IPC] workspace:chat:save error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron11.ipcMain.handle("workspace:chat:delete", async (_, workspace, conversationId) => {
    try {
      const storagePath = await workspaceStorage2.getWorkspaceStoragePath(workspace.id);
      return chatStorageRef.deleteConversation(storagePath, conversationId);
    } catch (error) {
      console.error("[IPC] workspace:chat:delete error:", error);
      return { success: false, error: error.message };
    }
  });
  console.log("[IPC] Workspace handlers registered");
}
function cleanupIpcHandlers() {
  destroyAllTerminals();
  fileWatchers.forEach((controller) => controller.abort());
  fileWatchers.clear();
  pendingScreenshotRequests.clear();
  import_electron11.ipcMain.removeHandler("agent:create-conversation");
  import_electron11.ipcMain.removeHandler("agent:close-conversation");
  import_electron11.ipcMain.removeHandler("agent:has-conversation");
  import_electron11.ipcMain.removeHandler("agent:send-message");
  import_electron11.ipcMain.removeHandler("agent:abort");
  import_electron11.ipcMain.removeHandler("agent:switch-model");
  import_electron11.ipcMain.removeHandler("agent:clear-conversation");
  import_electron11.ipcMain.removeHandler("agent:get-token-count");
  import_electron11.ipcMain.removeHandler("agent:respond-permission");
  import_electron11.ipcMain.removeHandler("agent:respond-user-input");
  import_electron11.ipcMain.removeHandler("agent:set-mode");
  import_electron11.ipcMain.removeHandler("agent:set-permission-mode");
  import_electron11.ipcMain.removeHandler("agent:set-change-review-enabled");
  import_electron11.ipcMain.removeHandler("changes:respond");
  import_electron11.ipcMain.removeHandler("tools:get-metadata");
  import_electron11.ipcMain.removeHandler("chat:save");
  import_electron11.ipcMain.removeHandler("chat:load");
  import_electron11.ipcMain.removeHandler("chat:delete");
  import_electron11.ipcMain.removeHandler("chat:list");
  import_electron11.ipcMain.removeHandler("file:read");
  import_electron11.ipcMain.removeHandler("file:readBinary");
  import_electron11.ipcMain.removeHandler("file:write");
  import_electron11.ipcMain.removeHandler("file:edit");
  import_electron11.ipcMain.removeHandler("file:list");
  import_electron11.ipcMain.removeHandler("file:watch");
  import_electron11.ipcMain.removeHandler("file:unwatch");
  import_electron11.ipcMain.removeHandler("file:searchContent");
  import_electron11.ipcMain.removeHandler("file:backup");
  import_electron11.ipcMain.removeHandler("file:restore");
  import_electron11.ipcMain.removeHandler("file:getChanges");
  import_electron11.ipcMain.removeHandler("file:hasChanges");
  import_electron11.ipcMain.removeHandler("file:getAllChanges");
  import_electron11.ipcMain.removeHandler("tool:execute");
  import_electron11.ipcMain.removeHandler("tool:list");
  import_electron11.ipcMain.removeHandler("config:get");
  import_electron11.ipcMain.removeHandler("config:set");
  import_electron11.ipcMain.removeHandler("config:get-models");
  import_electron11.ipcMain.removeHandler("config:get-providers");
  import_electron11.ipcMain.removeHandler("dialog:open-folder");
  import_electron11.ipcMain.removeHandler("dialog:create-folder");
  import_electron11.ipcMain.removeHandler("dialog:open-workspace");
  import_electron11.ipcMain.removeHandler("app:get-version");
  import_electron11.ipcMain.removeHandler("app:get-platform");
  import_electron11.ipcMain.removeHandler("usage:get");
  import_electron11.ipcMain.removeHandler("usage:getSummary");
  import_electron11.ipcMain.removeHandler("usage:getAvailableMonths");
  import_electron11.ipcMain.removeHandler("usage:setLimit");
  import_electron11.ipcMain.removeHandler("usage:getLimits");
  import_electron11.ipcMain.removeHandler("usage:getModelPricing");
  import_electron11.ipcMain.removeHandler("usage:cleanup");
  import_electron11.ipcMain.removeHandler("usage:export");
  import_electron11.ipcMain.removeHandler("indexing:start");
  import_electron11.ipcMain.removeHandler("indexing:reindex");
  import_electron11.ipcMain.removeHandler("indexing:stop");
  import_electron11.ipcMain.removeHandler("indexing:getState");
  import_electron11.ipcMain.removeHandler("indexing:query");
  import_electron11.ipcMain.removeHandler("indexing:clear");
  import_electron11.ipcMain.removeHandler("indexing:close");
  import_electron11.ipcMain.removeHandler("indexing:closeAll");
  import_electron11.ipcMain.removeHandler("window:minimize");
  import_electron11.ipcMain.removeHandler("window:maximize");
  import_electron11.ipcMain.removeHandler("window:close");
  import_electron11.ipcMain.removeHandler("notification:request-sound");
  import_electron11.ipcMain.removeHandler("dialogs:select-sound-file");
  import_electron11.ipcMain.removeHandler("terminal:create");
  import_electron11.ipcMain.removeHandler("terminal:write");
  import_electron11.ipcMain.removeHandler("terminal:resize");
  import_electron11.ipcMain.removeHandler("terminal:destroy");
  import_electron11.ipcMain.removeHandler("browser:open");
  import_electron11.ipcMain.removeHandler("browser:navigate");
  import_electron11.ipcMain.removeHandler("browser:close");
  import_electron11.ipcMain.removeHandler("browser:request-screenshot");
  import_electron11.ipcMain.removeHandler("browser:screenshot-response");
  import_electron11.ipcMain.removeHandler("project:scan");
  stopAllPlanWatchers();
  import_electron11.ipcMain.removeHandler("plan:create-file");
  import_electron11.ipcMain.removeHandler("plan:update-step");
  import_electron11.ipcMain.removeHandler("plan:mark-approved");
  import_electron11.ipcMain.removeHandler("plan:open-file");
  import_electron11.ipcMain.removeHandler("plan:read-file");
  import_electron11.ipcMain.removeHandler("plan:stop-watching");
  import_electron11.ipcMain.removeHandler("git:is-repo");
  import_electron11.ipcMain.removeHandler("git:status");
  import_electron11.ipcMain.removeHandler("git:stage");
  import_electron11.ipcMain.removeHandler("git:stage-all");
  import_electron11.ipcMain.removeHandler("git:unstage");
  import_electron11.ipcMain.removeHandler("git:commit");
  import_electron11.ipcMain.removeHandler("git:push");
  import_electron11.ipcMain.removeHandler("git:pull");
  import_electron11.ipcMain.removeHandler("git:fetch");
  import_electron11.ipcMain.removeHandler("git:diff-file");
  import_electron11.ipcMain.removeHandler("git:discard");
  import_electron11.ipcMain.removeHandler("git:branch-list");
  import_electron11.ipcMain.removeHandler("git:checkout");
  import_electron11.ipcMain.removeHandler("git:create-branch");
  import_electron11.ipcMain.removeHandler("git:log");
  import_electron11.ipcMain.removeHandler("git:init");
  import_electron11.ipcMain.removeHandler("remote:start");
  import_electron11.ipcMain.removeHandler("remote:stop");
  import_electron11.ipcMain.removeHandler("remote:status");
  import_electron11.ipcMain.removeHandler("remote:regenerate-api-key");
  import_electron11.ipcMain.removeHandler("remote:generate-qr");
  import_electron11.ipcMain.removeHandler("remote-client:connect");
  import_electron11.ipcMain.removeHandler("remote-client:disconnect");
  import_electron11.ipcMain.removeHandler("remote-client:status");
  import_electron11.ipcMain.removeHandler("remote-client:test-connection");
  remoteClientMode.disconnect().catch(() => {
  });
  import_electron11.ipcMain.removeHandler("rules:list");
  import_electron11.ipcMain.removeHandler("rules:save");
  import_electron11.ipcMain.removeHandler("rules:delete");
  import_electron11.ipcMain.removeHandler("rules:toggle");
  import_electron11.ipcMain.removeHandler("skills:list");
  import_electron11.ipcMain.removeHandler("skills:get");
  import_electron11.ipcMain.removeHandler("skills:save");
  import_electron11.ipcMain.removeHandler("skills:delete");
  import_electron11.ipcMain.removeHandler("addons:list");
  import_electron11.ipcMain.removeHandler("addons:install");
  import_electron11.ipcMain.removeHandler("addons:uninstall");
  import_electron11.ipcMain.removeHandler("app:check-for-updates");
  import_electron11.ipcMain.removeHandler("app:install-update");
  import_electron11.ipcMain.removeHandler("workspace:create");
  import_electron11.ipcMain.removeHandler("workspace:loadFromFile");
  import_electron11.ipcMain.removeHandler("workspace:update");
  import_electron11.ipcMain.removeHandler("workspace:addFolder");
  import_electron11.ipcMain.removeHandler("workspace:removeFolder");
  import_electron11.ipcMain.removeHandler("workspace:rename");
  import_electron11.ipcMain.removeHandler("workspace:list");
  import_electron11.ipcMain.removeHandler("workspace:export");
  import_electron11.ipcMain.removeHandler("workspace:import");
  import_electron11.ipcMain.removeHandler("workspace:delete");
  import_electron11.ipcMain.removeHandler("workspace:chat:load");
  import_electron11.ipcMain.removeHandler("workspace:chat:save");
  import_electron11.ipcMain.removeHandler("workspace:chat:delete");
  import_electron11.ipcMain.removeHandler("system:check-permissions");
  import_electron11.ipcMain.removeHandler("system:open-settings");
  import_electron11.ipcMain.removeHandler("system:request-permission");
}
var import_electron11, fs32, fsSync3, path33, os5, https2, http3, import_node_child_process8, mainWindowRef, windowCwdMap, windowConversationsMap, agentRef, toolsRef, configRef, chatStorageRef, fileWatchers, FILE_WRITE_TIMEOUT_MS, pendingScreenshotRequests;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    "use strict";
    import_electron11 = require("electron");
    fs32 = __toESM(require("fs/promises"), 1);
    fsSync3 = __toESM(require("fs"), 1);
    path33 = __toESM(require("path"), 1);
    os5 = __toESM(require("os"), 1);
    https2 = __toESM(require("https"), 1);
    http3 = __toESM(require("http"), 1);
    import_node_child_process8 = require("child_process");
    init_core_integration();
    init_model_registry();
    init_remote_client_mode();
    init_plan_file_manager();
    init_shared_workspace_manager();
    init_workspace_storage();
    init_chat_storage();
    init_usage_storage();
    init_file_history();
    init_notifications();
    init_terminal_manager();
    init_git_manager();
    init_large_file_writer();
    init_project_indexer();
    mainWindowRef = null;
    windowCwdMap = /* @__PURE__ */ new Map();
    windowConversationsMap = /* @__PURE__ */ new Map();
    agentRef = null;
    toolsRef = null;
    configRef = null;
    chatStorageRef = getChatStorage();
    fileWatchers = /* @__PURE__ */ new Map();
    FILE_WRITE_TIMEOUT_MS = 15e3;
    pendingScreenshotRequests = /* @__PURE__ */ new Map();
  }
});

// src/tools/builtin/browser-control.ts
var VALID_ACTIONS4, BrowserControlTool;
var init_browser_control = __esm({
  "src/tools/builtin/browser-control.ts"() {
    "use strict";
    init_tool_types();
    VALID_ACTIONS4 = ["navigate", "reload", "back", "forward", "screenshot", "close"];
    BrowserControlTool = class {
      name = "BrowserControl";
      description = `Control a browser tab that was previously opened with OpenBrowser. Use this to navigate to different pages, reload, go back/forward, take screenshots, or close the tab.

Actions:
- navigate: Navigate to a new URL (requires 'url' parameter)
- reload: Reload the current page
- back: Go back to the previous page in history
- forward: Go forward to the next page in history  
- screenshot: Capture a screenshot of the current page (returns image)
- close: Close the browser tab

Examples:
- "Go to the API docs" -> BrowserControl with action: "navigate", url: "https://api.example.com"
- "Reload the page" -> BrowserControl with action: "reload"
- "Take a screenshot" -> BrowserControl with action: "screenshot"
- "Close this tab" -> BrowserControl with action: "close"

Note: Screenshots are captured from the visible browser tab and returned as images you can analyze.`;
      permissionLevel = "safe" /* SAFE */;
      category = "network" /* NETWORK */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The action to perform: navigate, reload, back, forward, screenshot, close",
            enum: VALID_ACTIONS4
          },
          url: {
            type: "string",
            description: 'The URL to navigate to (required for "navigate" action)'
          },
          tabId: {
            type: "string",
            description: "The URL of the tab to control (acts as the tab identifier). If not provided, controls the most recently opened browser tab."
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS4.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS4.join(", ")}`;
        }
        if (action === "navigate" && !input.url) {
          return "url is required for navigate action";
        }
        return null;
      }
      async execute(input, _context) {
        const action = input.action;
        const tabId = input.tabId;
        const url = input.url;
        try {
          const { BrowserWindow: BrowserWindow8 } = await import("electron");
          const windows = BrowserWindow8.getAllWindows();
          if (windows.length === 0) {
            return {
              content: "No browser window available",
              isError: true
            };
          }
          const mainWindow2 = windows[0];
          switch (action) {
            case "navigate": {
              const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
              mainWindow2.webContents.send("browser:navigate", {
                tabId: tabId || url,
                url: fullUrl
              });
              return {
                content: `Navigated to ${fullUrl}`,
                metadata: { url: fullUrl, previousUrl: tabId }
              };
            }
            case "reload": {
              return {
                content: "Reload requested. Please click the refresh button in the browser tab, or navigate to the same URL again.",
                metadata: { action: "reload" }
              };
            }
            case "back": {
              return {
                content: "Going back is not yet fully supported. Please use the back button in the browser tab.",
                metadata: { action: "back" }
              };
            }
            case "forward": {
              return {
                content: "Going forward is not yet fully supported. Please use the forward button in the browser tab.",
                metadata: { action: "forward" }
              };
            }
            case "screenshot": {
              const targetTabId = tabId || "current";
              const { requestScreenshot: requestScreenshot2 } = await Promise.resolve().then(() => (init_ipc_handlers(), ipc_handlers_exports));
              const result = await requestScreenshot2(targetTabId);
              if (result.error || !result.dataUrl) {
                return {
                  content: `Screenshot failed: ${result.error || "Unknown error"}`,
                  isError: true,
                  metadata: { action: "screenshot", tabId: targetTabId }
                };
              }
              const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, "");
              const imageBlock = {
                type: "image",
                source: {
                  type: "base64",
                  mediaType: "image/png",
                  data: base64Data
                }
              };
              const sizeKB = (base64Data.length * 0.75 / 1024).toFixed(1);
              return {
                content: `Screenshot captured successfully (${sizeKB}KB). The image is attached for analysis.`,
                contentBlocks: [imageBlock],
                metadata: { action: "screenshot", tabId: targetTabId, sizeKB }
              };
            }
            case "close": {
              mainWindow2.webContents.send("browser:close", {
                tabId: tabId || "current"
              });
              return {
                content: "Browser tab close requested",
                metadata: { action: "close", tabId }
              };
            }
            default:
              return {
                content: `Unknown action: ${action}`,
                isError: true
              };
          }
        } catch (error) {
          return {
            content: `Browser control error: ${error.message}`,
            isError: true
          };
        }
      }
      formatForDisplay(result, input) {
        if (result.isError) {
          return `BrowserControl: ${result.content}`;
        }
        return `Browser ${input.action}${input.url ? ` to ${input.url}` : ""}`;
      }
    };
  }
});

// src/tools/builtin/debugger.ts
var inspector, VALID_ACTIONS5, debugSession, DebuggerTool;
var init_debugger = __esm({
  "src/tools/builtin/debugger.ts"() {
    "use strict";
    init_tool_types();
    inspector = __toESM(require("inspector"), 1);
    VALID_ACTIONS5 = ["connect", "breakpoint", "evaluate", "pause", "resume", "step", "stacktrace", "disconnect"];
    debugSession = null;
    DebuggerTool = class {
      name = "Debugger";
      description = `Connect to Node.js inspector for debugging. Actions: connect (start debug session), breakpoint (set breakpoint), evaluate (eval expression in paused context), pause, resume, step (stepOver/stepInto/stepOut), stacktrace, disconnect.`;
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action: connect, breakpoint, evaluate, pause, resume, step, stacktrace, disconnect"
          },
          file: {
            type: "string",
            description: "File path for breakpoint (absolute path)"
          },
          line: {
            type: "number",
            description: "Line number for breakpoint (1-based)"
          },
          expression: {
            type: "string",
            description: "Expression to evaluate"
          },
          stepType: {
            type: "string",
            description: "Step type: over, into, out (default: over)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS5.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS5.join(", ")}`;
        }
        if (action === "breakpoint") {
          if (!input.file)
            return "file is required for breakpoint action";
          if (typeof input.line !== "number")
            return "line is required for breakpoint action";
        }
        if (action === "evaluate" && !input.expression)
          return "expression is required for evaluate action";
        return null;
      }
      async execute(input, _context) {
        const action = input.action;
        try {
          switch (action) {
            case "connect": {
              if (debugSession) {
                return { content: "Debug session already active. Use disconnect first." };
              }
              debugSession = new inspector.Session();
              debugSession.connect();
              await this.post("Debugger.enable", {});
              await this.post("Runtime.enable", {});
              return { content: "Debug session connected. Debugger and Runtime enabled." };
            }
            case "disconnect": {
              if (!debugSession)
                return { content: "No active debug session." };
              try {
                await this.post("Debugger.disable", {});
                await this.post("Runtime.disable", {});
              } catch {
              }
              debugSession.disconnect();
              debugSession = null;
              return { content: "Debug session disconnected." };
            }
            case "breakpoint": {
              this.ensureConnected();
              const file = input.file;
              const line = input.line - 1;
              const result = await this.post("Debugger.setBreakpointByUrl", {
                lineNumber: line,
                urlRegex: file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              });
              const bp = result;
              return {
                content: `Breakpoint set at ${file}:${input.line}
Breakpoint ID: ${bp.breakpointId}`
              };
            }
            case "evaluate": {
              this.ensureConnected();
              const expression = input.expression;
              const result = await this.post("Runtime.evaluate", {
                expression,
                generatePreview: true,
                returnByValue: true
              });
              if (result.exceptionDetails) {
                return {
                  content: `Evaluation error: ${result.exceptionDetails.text}
${result.exceptionDetails.exception?.description || ""}`,
                  isError: true
                };
              }
              const value = result.result;
              const display = value.type === "object" ? JSON.stringify(value.value, null, 2) : String(value.value ?? value.description ?? value.type);
              return { content: `${value.type}: ${display}` };
            }
            case "pause": {
              this.ensureConnected();
              await this.post("Debugger.pause", {});
              return { content: "Execution paused." };
            }
            case "resume": {
              this.ensureConnected();
              await this.post("Debugger.resume", {});
              return { content: "Execution resumed." };
            }
            case "step": {
              this.ensureConnected();
              const stepType = input.stepType || "over";
              const method = stepType === "into" ? "Debugger.stepInto" : stepType === "out" ? "Debugger.stepOut" : "Debugger.stepOver";
              await this.post(method, {});
              return { content: `Stepped ${stepType}.` };
            }
            case "stacktrace": {
              this.ensureConnected();
              const result = await this.post("Runtime.evaluate", {
                expression: "new Error().stack",
                returnByValue: true
              });
              return { content: `Stack trace:
${result.result?.value || "Not available (execution may not be paused)"}` };
            }
          }
        } catch (error) {
          return { content: `Debugger error: ${error.message}`, isError: true };
        }
      }
      ensureConnected() {
        if (!debugSession) {
          throw new Error("No active debug session. Use connect action first.");
        }
      }
      post(method, params) {
        return new Promise((resolve12, reject) => {
          debugSession.post(method, params, (err, result) => {
            if (err)
              reject(err);
            else
              resolve12(result || {});
          });
        });
      }
    };
  }
});

// src/tools/builtin/doc-gen.ts
var fs33, path34, VALID_STYLES, DocGenTool;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs33 = __toESM(require("fs/promises"), 1);
    path34 = __toESM(require("path"), 1);
    init_tool_types();
    VALID_STYLES = ["jsdoc", "tsdoc", "python", "auto"];
    DocGenTool = class {
      name = "DocGen";
      description = "Generate documentation stubs (JSDoc/TSDoc/Python docstrings) for functions, classes, and interfaces in a file. Detects undocumented symbols and generates template comments.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "Absolute path to the file to document"
          },
          style: {
            type: "string",
            description: "Documentation style: jsdoc, tsdoc, python, auto (default: auto)"
          },
          overwrite: {
            type: "boolean",
            description: "Overwrite existing doc comments (default: false)"
          },
          dryRun: {
            type: "boolean",
            description: "Preview generated docs without modifying the file (default: false)"
          }
        },
        required: ["file_path"]
      };
      validate(input) {
        if (typeof input.file_path !== "string" || !input.file_path.trim()) {
          return "file_path must be a non-empty string";
        }
        if (input.style && !VALID_STYLES.includes(input.style)) {
          return `style must be one of: ${VALID_STYLES.join(", ")}`;
        }
        return null;
      }
      async execute(input, context) {
        const filePath = input.file_path;
        const overwrite = input.overwrite === true;
        const dryRun = input.dryRun === true;
        try {
          const content = await fs33.readFile(filePath, "utf-8");
          const ext = path34.extname(filePath).toLowerCase();
          const style = this.resolveStyle(input.style, ext);
          const symbols = style === "python" ? this.extractPythonSymbols(content) : this.extractTSSymbols(content);
          const undocumented = overwrite ? symbols : symbols.filter((s) => !s.hasDoc);
          if (undocumented.length === 0) {
            return { content: "All exported symbols are already documented." };
          }
          const docs = undocumented.map((sym) => ({
            symbol: sym,
            doc: style === "python" ? this.generatePythonDoc(sym) : this.generateJSDoc(sym, style === "tsdoc")
          }));
          if (dryRun) {
            const preview = docs.map(
              (d) => `--- ${d.symbol.kind} ${d.symbol.name} (line ${d.symbol.line}) ---
${d.doc}`
            ).join("\n\n");
            return {
              content: `Documentation preview for ${path34.basename(filePath)}:

${preview}

${undocumented.length} symbol(s) would be documented.`
            };
          }
          const lines = content.split("\n");
          const insertions = docs.map((d) => ({
            line: d.symbol.line - 1,
            doc: d.doc
          }));
          insertions.sort((a, b) => b.line - a.line);
          for (const ins of insertions) {
            const indent = lines[ins.line]?.match(/^(\s*)/)?.[1] || "";
            const docLines = ins.doc.split("\n").map((l) => indent + l);
            lines.splice(ins.line, 0, ...docLines);
          }
          await fs33.writeFile(filePath, lines.join("\n"), "utf-8");
          return {
            content: `Generated documentation for ${undocumented.length} symbol(s) in ${path34.basename(filePath)}:
` + undocumented.map((s) => `  - ${s.kind} ${s.name} (line ${s.line})`).join("\n")
          };
        } catch (error) {
          return { content: `DocGen error: ${error.message}`, isError: true };
        }
      }
      resolveStyle(requested, ext) {
        if (requested && requested !== "auto")
          return requested;
        if (ext === ".py")
          return "python";
        if (ext === ".ts" || ext === ".tsx")
          return "tsdoc";
        return "jsdoc";
      }
      extractTSSymbols(content) {
        const symbols = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const hasDoc = i > 0 && this.hasPrecedingDocComment(lines, i);
          const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*(.+?))?[\s{]/);
          if (funcMatch) {
            symbols.push({
              name: funcMatch[1],
              kind: "function",
              signature: line.trim(),
              params: this.parseParams(funcMatch[3]),
              returnType: funcMatch[4]?.trim(),
              line: i + 1,
              hasDoc
            });
            continue;
          }
          const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
          if (classMatch) {
            symbols.push({
              name: classMatch[1],
              kind: "class",
              signature: line.trim(),
              params: [],
              line: i + 1,
              hasDoc
            });
            continue;
          }
          const ifaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
          if (ifaceMatch) {
            symbols.push({
              name: ifaceMatch[1],
              kind: "interface",
              signature: line.trim(),
              params: [],
              line: i + 1,
              hasDoc
            });
            continue;
          }
          const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
          if (typeMatch) {
            symbols.push({
              name: typeMatch[1],
              kind: "type",
              signature: line.trim(),
              params: [],
              line: i + 1,
              hasDoc
            });
            continue;
          }
          const methodMatch = line.match(/^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(.+?))?[\s{]/);
          if (methodMatch && !line.includes("//") && !methodMatch[1].match(/^(if|for|while|switch|catch|constructor)$/)) {
            symbols.push({
              name: methodMatch[1],
              kind: "method",
              signature: line.trim(),
              params: this.parseParams(methodMatch[2]),
              returnType: methodMatch[3]?.trim(),
              line: i + 1,
              hasDoc
            });
          }
        }
        return symbols;
      }
      extractPythonSymbols(content) {
        const symbols = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const hasDoc = i + 1 < lines.length && /^\s*"""/.test(lines[i + 1]);
          const funcMatch = line.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(.+?))?:/);
          if (funcMatch) {
            const indent = funcMatch[1];
            symbols.push({
              name: funcMatch[2],
              kind: indent.length > 0 ? "method" : "function",
              signature: line.trim(),
              params: this.parsePythonParams(funcMatch[3]),
              returnType: funcMatch[4]?.trim(),
              line: i + 1,
              hasDoc
            });
            continue;
          }
          const classMatch = line.match(/^class\s+(\w+)/);
          if (classMatch) {
            symbols.push({
              name: classMatch[1],
              kind: "class",
              signature: line.trim(),
              params: [],
              line: i + 1,
              hasDoc
            });
          }
        }
        return symbols;
      }
      hasPrecedingDocComment(lines, lineIndex) {
        for (let i = lineIndex - 1; i >= 0 && i >= lineIndex - 5; i--) {
          const l = lines[i].trim();
          if (l.endsWith("*/") || l.startsWith("/**") || l.startsWith("* "))
            return true;
          if (l === "" || l.startsWith("//"))
            continue;
          break;
        }
        return false;
      }
      parseParams(paramStr) {
        if (!paramStr.trim())
          return [];
        return paramStr.split(",").map((p) => {
          const parts = p.trim().split(/:\s*/);
          return { name: parts[0].replace(/[?=].*/, "").trim(), type: parts[1]?.trim() };
        }).filter((p) => p.name && !p.name.startsWith("..."));
      }
      parsePythonParams(paramStr) {
        if (!paramStr.trim())
          return [];
        return paramStr.split(",").map((p) => {
          const parts = p.trim().split(/:\s*/);
          const name = parts[0].replace(/=.*/, "").trim();
          return { name, type: parts[1]?.replace(/=.*/, "").trim() };
        }).filter((p) => p.name && p.name !== "self" && p.name !== "cls");
      }
      generateJSDoc(sym, isTSDoc) {
        const lines = ["/**"];
        lines.push(` * ${sym.kind === "class" ? `Class ${sym.name}` : sym.kind === "interface" ? `Interface ${sym.name}` : `TODO: Add description for ${sym.name}`}`);
        if (sym.params.length > 0) {
          lines.push(" *");
          for (const p of sym.params) {
            const typeTag = p.type && !isTSDoc ? ` {${p.type}}` : "";
            lines.push(` * @param${typeTag} ${p.name} - TODO: describe parameter`);
          }
        }
        if (sym.returnType && sym.returnType !== "void" && sym.kind !== "class") {
          const typeTag = sym.returnType && !isTSDoc ? ` {${sym.returnType}}` : "";
          lines.push(` * @returns${typeTag} TODO: describe return value`);
        }
        lines.push(" */");
        return lines.join("\n");
      }
      generatePythonDoc(sym) {
        const indent = "    ";
        const lines = [`${indent}"""TODO: Add description for ${sym.name}`];
        if (sym.params.length > 0) {
          lines.push("");
          lines.push(`${indent}Args:`);
          for (const p of sym.params) {
            const typeHint = p.type ? ` (${p.type})` : "";
            lines.push(`${indent}    ${p.name}${typeHint}: TODO: describe parameter`);
          }
        }
        if (sym.returnType && sym.returnType !== "None") {
          lines.push("");
          lines.push(`${indent}Returns:`);
          lines.push(`${indent}    ${sym.returnType}: TODO: describe return value`);
        }
        lines.push(`${indent}"""`);
        return lines.join("\n");
      }
    };
  }
});

// src/tools/builtin/notebook.ts
var fs34, vm, VALID_ACTIONS6, replContext, NotebookTool;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs34 = __toESM(require("fs/promises"), 1);
    vm = __toESM(require("vm"), 1);
    init_tool_types();
    VALID_ACTIONS6 = ["eval", "notebook_read", "notebook_edit", "notebook_add_cell", "notebook_run"];
    replContext = null;
    NotebookTool = class {
      name = "Notebook";
      description = `JavaScript/TypeScript REPL and Jupyter notebook editor. Actions: eval (evaluate JS code in persistent context), notebook_read (read .ipynb), notebook_edit (edit a cell), notebook_add_cell (add cell), notebook_run (evaluate code cells).`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action: eval, notebook_read, notebook_edit, notebook_add_cell, notebook_run"
          },
          code: {
            type: "string",
            description: "JavaScript code to evaluate (for eval action)"
          },
          file_path: {
            type: "string",
            description: "Path to .ipynb file (for notebook actions)"
          },
          cell_index: {
            type: "number",
            description: "Cell index (0-based) for notebook_edit"
          },
          cell_type: {
            type: "string",
            description: "Cell type: code or markdown (for notebook_add_cell)"
          },
          source: {
            type: "string",
            description: "New cell source content (for notebook_edit and notebook_add_cell)"
          },
          resetContext: {
            type: "boolean",
            description: "Reset the REPL context (for eval action)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        if (!VALID_ACTIONS6.includes(action)) {
          return `action must be one of: ${VALID_ACTIONS6.join(", ")}`;
        }
        if (action === "eval" && !input.code)
          return "code is required for eval action";
        if (["notebook_read", "notebook_edit", "notebook_add_cell", "notebook_run"].includes(action) && !input.file_path) {
          return "file_path is required for notebook actions";
        }
        if (action === "notebook_edit" && typeof input.cell_index !== "number") {
          return "cell_index is required for notebook_edit action";
        }
        if (action === "notebook_add_cell" && !input.source) {
          return "source is required for notebook_add_cell action";
        }
        return null;
      }
      async execute(input, _context) {
        const action = input.action;
        try {
          switch (action) {
            case "eval":
              return this.evalCode(input.code, input.resetContext === true);
            case "notebook_read":
              return await this.readNotebook(input.file_path);
            case "notebook_edit":
              return await this.editCell(
                input.file_path,
                input.cell_index,
                input.source,
                input.cell_type
              );
            case "notebook_add_cell":
              return await this.addCell(
                input.file_path,
                input.source,
                input.cell_type || "code",
                input.cell_index
              );
            case "notebook_run":
              return await this.runNotebook(input.file_path);
          }
        } catch (error) {
          return { content: `Notebook error: ${error.message}`, isError: true };
        }
      }
      evalCode(code, reset) {
        if (reset || !replContext) {
          replContext = vm.createContext({
            console: {
              log: (...args) => outputLines.push(args.map(String).join(" ")),
              error: (...args) => outputLines.push("[ERROR] " + args.map(String).join(" ")),
              warn: (...args) => outputLines.push("[WARN] " + args.map(String).join(" "))
            },
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            Buffer,
            URL,
            URLSearchParams,
            JSON,
            Math,
            Date,
            RegExp,
            Map,
            Set,
            WeakMap,
            WeakSet,
            Promise,
            Array,
            Object,
            String,
            Number,
            Boolean,
            parseInt,
            parseFloat,
            isNaN,
            isFinite
          });
        }
        const outputLines = [];
        replContext.console = {
          log: (...args) => outputLines.push(args.map(String).join(" ")),
          error: (...args) => outputLines.push("[ERROR] " + args.map(String).join(" ")),
          warn: (...args) => outputLines.push("[WARN] " + args.map(String).join(" "))
        };
        try {
          const result = vm.runInContext(code, replContext, { timeout: 1e4 });
          const consoleOutput = outputLines.length > 0 ? outputLines.join("\n") + "\n" : "";
          const resultStr = result !== void 0 ? `=> ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}` : "";
          return {
            content: `${consoleOutput}${resultStr}`.trim() || "(no output)"
          };
        } catch (error) {
          const consoleOutput = outputLines.length > 0 ? outputLines.join("\n") + "\n" : "";
          return {
            content: `${consoleOutput}Error: ${error.message}`,
            isError: true
          };
        }
      }
      async readNotebook(filePath) {
        const content = await fs34.readFile(filePath, "utf-8");
        const nb = JSON.parse(content);
        if (!nb.cells || !Array.isArray(nb.cells)) {
          return { content: "Invalid notebook format: no cells array", isError: true };
        }
        const cellSummaries = nb.cells.map((cell, i) => {
          const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source || "";
          const type = cell.cell_type || "unknown";
          const outputCount = cell.outputs?.length || 0;
          const preview = source.substring(0, 200).replace(/\n/g, "\n  ");
          return `[${i}] ${type}${outputCount > 0 ? ` (${outputCount} outputs)` : ""}:
  ${preview}${source.length > 200 ? "..." : ""}`;
        });
        const kernel = nb.metadata?.kernelspec?.display_name || "unknown";
        return {
          content: `Notebook: ${filePath}
Kernel: ${kernel}
Cells: ${nb.cells.length}

${cellSummaries.join("\n\n")}`
        };
      }
      async editCell(filePath, index, source, cellType) {
        const content = await fs34.readFile(filePath, "utf-8");
        const nb = JSON.parse(content);
        if (!nb.cells || index < 0 || index >= nb.cells.length) {
          return { content: `Invalid cell index: ${index} (notebook has ${nb.cells?.length || 0} cells)`, isError: true };
        }
        if (source !== void 0) {
          nb.cells[index].source = source.split("\n").map(
            (l, i, arr) => i < arr.length - 1 ? l + "\n" : l
          );
        }
        if (cellType) {
          nb.cells[index].cell_type = cellType;
        }
        await fs34.writeFile(filePath, JSON.stringify(nb, null, 1), "utf-8");
        return { content: `Updated cell [${index}] in ${filePath}` };
      }
      async addCell(filePath, source, cellType, afterIndex) {
        const content = await fs34.readFile(filePath, "utf-8");
        const nb = JSON.parse(content);
        const newCell = {
          cell_type: cellType,
          metadata: {},
          source: source.split("\n").map(
            (l, i, arr) => i < arr.length - 1 ? l + "\n" : l
          )
        };
        if (cellType === "code") {
          newCell.execution_count = null;
          newCell.outputs = [];
        }
        const insertAt = afterIndex !== void 0 ? afterIndex + 1 : nb.cells.length;
        nb.cells.splice(insertAt, 0, newCell);
        await fs34.writeFile(filePath, JSON.stringify(nb, null, 1), "utf-8");
        return { content: `Added ${cellType} cell at index [${insertAt}] in ${filePath}` };
      }
      async runNotebook(filePath) {
        const content = await fs34.readFile(filePath, "utf-8");
        const nb = JSON.parse(content);
        const codeCells = nb.cells.filter((c) => c.cell_type === "code");
        if (codeCells.length === 0) {
          return { content: "No code cells to run." };
        }
        const context = vm.createContext({
          console: { log: (...args) => {
          } },
          JSON,
          Math,
          Date,
          RegExp,
          Map,
          Set,
          Array,
          Object,
          String,
          Number,
          parseInt,
          parseFloat
        });
        const results = [];
        for (let i = 0; i < codeCells.length; i++) {
          const cell = codeCells[i];
          const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
          const outputs = [];
          context.console = {
            log: (...args) => outputs.push(args.map(String).join(" ")),
            error: (...args) => outputs.push("[ERROR] " + args.map(String).join(" "))
          };
          try {
            const result = vm.runInContext(source, context, { timeout: 1e4 });
            if (result !== void 0) {
              outputs.push(`=> ${typeof result === "object" ? JSON.stringify(result) : String(result)}`);
            }
            results.push(`Cell [${i}]: OK
${outputs.join("\n")}`);
          } catch (error) {
            results.push(`Cell [${i}]: ERROR
${error.message}`);
          }
        }
        return { content: `Executed ${codeCells.length} code cells:

${results.join("\n\n")}` };
      }
    };
  }
});

// src/tools/builtin/platform-cli-manager.ts
var import_node_child_process9, import_tree_kill2, PlatformCLIManager;
var init_platform_cli_manager = __esm({
  "src/tools/builtin/platform-cli-manager.ts"() {
    "use strict";
    import_node_child_process9 = require("child_process");
    import_tree_kill2 = __toESM(require("tree-kill"), 1);
    PlatformCLIManager = class {
      /**
       * Check if the CLI is installed and available
       */
      async isCLIInstalled() {
        return new Promise((resolve12) => {
          const proc = (0, import_node_child_process9.spawn)("which", [this.cliCommand], { stdio: "ignore" });
          proc.on("close", (code) => resolve12(code === 0));
          proc.on("error", () => resolve12(false));
        });
      }
      /**
       * Check if user is authenticated with the platform
       */
      async isAuthenticated() {
        try {
          const result = await this.executeCommand("whoami", [], {}, 1e4);
          return result.exitCode === 0 && result.stdout.trim().length > 0;
        } catch {
          return false;
        }
      }
      /**
       * Execute a CLI command with arguments
       */
      async executeCommand(subcommand, args = [], options = {}, timeoutMs = 12e4) {
        const cwd = options.cwd || process.cwd();
        const env2 = { ...process.env, ...options.env };
        return new Promise((resolve12) => {
          let stdout = "";
          let stderr = "";
          let killed = false;
          const allArgs = [subcommand, ...args];
          const proc = (0, import_node_child_process9.spawn)(this.cliCommand, allArgs, {
            cwd,
            env: env2,
            stdio: ["ignore", "pipe", "pipe"]
          });
          proc.stdout?.on("data", (data) => {
            stdout += data.toString();
            if (stdout.length > 1e6) {
              stdout = stdout.substring(0, 1e6) + "\n\n[Output truncated at 1MB]";
              if (proc.pid)
                (0, import_tree_kill2.default)(proc.pid);
              killed = true;
            }
          });
          proc.stderr?.on("data", (data) => {
            stderr += data.toString();
            if (stderr.length > 5e5) {
              stderr = stderr.substring(0, 5e5) + "\n\n[Stderr truncated at 500KB]";
            }
          });
          const timer = setTimeout(() => {
            if (proc.pid)
              (0, import_tree_kill2.default)(proc.pid);
            killed = true;
            resolve12({
              stdout,
              stderr: `Command timed out after ${timeoutMs}ms.

${stderr}`,
              exitCode: null,
              isError: true
            });
          }, timeoutMs);
          proc.on("close", (code) => {
            clearTimeout(timer);
            if (killed)
              return;
            resolve12({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: code,
              isError: code !== 0
            });
          });
          proc.on("error", (error) => {
            clearTimeout(timer);
            resolve12({
              stdout: "",
              stderr: `Failed to execute ${this.cliCommand}: ${error.message}`,
              exitCode: null,
              isError: true
            });
          });
        });
      }
      /**
       * Build a formatted output from execution result
       */
      formatOutput(result, command) {
        let output = `Command: ${this.cliName} ${command}
`;
        output += `Exit code: ${result.exitCode ?? "N/A"}

`;
        if (result.stdout) {
          output += `Output:
${result.stdout}
`;
        }
        if (result.stderr) {
          if (result.stdout)
            output += "\n";
          output += `Stderr:
${result.stderr}
`;
        }
        if (!result.stdout && !result.stderr) {
          output += "(no output)\n";
        }
        return output.trim();
      }
    };
  }
});

// src/tools/builtin/supabase-cli.ts
var import_node_child_process10, SupabaseTool;
var init_supabase_cli = __esm({
  "src/tools/builtin/supabase-cli.ts"() {
    "use strict";
    import_node_child_process10 = require("child_process");
    init_tool_types();
    init_platform_cli_manager();
    SupabaseTool = class extends PlatformCLIManager {
      name = "Supabase";
      description = "Execute Supabase CLI commands for local development, database management, and deployment. Supports init, start, stop, db operations, functions, and more. NOTE: login/logout require manual terminal use. Docker is required for local stack commands.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      cliName = "Supabase";
      cliCommand = "supabase";
      // Commands that require Docker daemon to be running
      dockerCommands = [
        "start",
        "stop",
        "status",
        "db reset",
        "db push",
        "db pull",
        "db dump",
        "db restore",
        "seed",
        "migration up",
        "migration repair",
        "functions deploy"
      ];
      // Commands that require interactive TTY (cannot run in non-TTY environment)
      interactiveCommands = ["login", "logout"];
      inputSchema = {
        type: "object",
        properties: {
          command: {
            type: "string",
            enum: [
              "init",
              "start",
              "stop",
              "status",
              "db reset",
              "db push",
              "db pull",
              "db dump",
              "db restore",
              "functions deploy",
              "functions new",
              "migration new",
              "migration up",
              "migration repair",
              "seed",
              "link",
              "unlink",
              "list",
              "login",
              "logout",
              "gen types"
            ],
            description: "The Supabase CLI command to execute. Common commands: init (create new project), start (launch local stack), stop (stop local stack), db push (push migrations), functions deploy (deploy edge functions), link (link to hosted project). NOTE: login/logout require manual terminal use."
          },
          projectId: {
            type: "string",
            description: "Project reference ID for link/unlink or remote commands. REQUIRED for link command."
          },
          name: {
            type: "string",
            description: "Name for new resources (function, migration, etc.)"
          },
          flags: {
            type: "array",
            items: { type: "string" },
            description: "Additional CLI flags like --debug, --experimental, --db-url, etc."
          }
        },
        required: ["command"]
      };
      validate(input) {
        if (typeof input.command !== "string" || !input.command.trim()) {
          return "command must be a non-empty string";
        }
        const validCommands = this.inputSchema.properties.command.enum;
        if (!validCommands.includes(input.command)) {
          return `command must be one of: ${validCommands.join(", ")}`;
        }
        const requiresName = ["functions new", "migration new"];
        if (requiresName.includes(input.command) && !input.name) {
          return `command "${input.command}" requires a "name" parameter`;
        }
        if (input.command === "link" && !input.projectId) {
          return 'command "link" requires a "projectId" parameter (the project reference ID from your Supabase dashboard)';
        }
        if (input.command === "unlink" && !input.projectId) {
          return 'command "unlink" requires a "projectId" parameter to specify which project to unlink';
        }
        return null;
      }
      async execute(input, context) {
        const installed = await this.isCLIInstalled();
        if (!installed) {
          return {
            content: `Supabase CLI is not installed.

${this.getInstallInstructions()}`,
            isError: true
          };
        }
        const command = input.command;
        if (this.interactiveCommands.includes(command)) {
          return {
            content: `Command "${command}" requires an interactive terminal and cannot run in this environment.

Please run manually in your terminal:
  supabase ${command}

Alternative authentication methods:
1. Use --token flag: supabase ${command} --token <your-access-token>
2. Set environment variable: SUPABASE_ACCESS_TOKEN=<token> supabase ${command}

You can get your access token from https://supabase.com/dashboard/account/tokens`,
            isError: true
          };
        }
        if (this.dockerCommands.includes(command)) {
          const dockerRunning = await this.isDockerRunning();
          if (!dockerRunning) {
            return {
              content: `Docker daemon is not running. The "${command}" command requires Docker to be active.

To fix this:
1. Start Docker Desktop (macOS/Windows)
2. Or run: sudo systemctl start docker (Linux)
3. Verify with: docker ps

Then try the command again.`,
              isError: true
            };
          }
        }
        const args = [];
        const flags = input.flags;
        if (flags) {
          args.push(...flags);
        }
        if (input.projectId) {
          args.push("--project-ref", input.projectId);
        }
        if (input.name) {
          args.push(input.name);
        }
        const [mainCmd, subCmd] = command.split(" ");
        const result = await this.executeCommand(
          mainCmd,
          subCmd ? [subCmd, ...args] : args,
          { cwd: context.cwd },
          3e5
          // 5 minute timeout for DB operations
        );
        return {
          content: this.formatOutput(result, command),
          isError: result.isError,
          metadata: { exitCode: result.exitCode }
        };
      }
      /**
       * Check if Docker daemon is running
       */
      async isDockerRunning() {
        return new Promise((resolve12) => {
          const proc = (0, import_node_child_process10.spawn)("docker", ["ps"], { stdio: "ignore" });
          proc.on("close", (code) => resolve12(code === 0));
          proc.on("error", () => resolve12(false));
        });
      }
      getInstallInstructions() {
        return `To install Supabase CLI:

macOS (Homebrew):
  brew install supabase

npm (cross-platform):
  npm install supabase --save-dev
  # or globally: npm install -g supabase

Direct install script:
  curl -fsSL https://get.supabase.com | bash

See https://supabase.com/docs/guides/local-development/cli/getting-started for more details.`;
      }
    };
  }
});

// src/tools/builtin/netlify-cli.ts
var NetlifyTool;
var init_netlify_cli = __esm({
  "src/tools/builtin/netlify-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
    NetlifyTool = class extends PlatformCLIManager {
      name = "Netlify";
      description = "Execute Netlify CLI commands for deployment, environment variables, functions, and site management. WARNING: Can deploy to production.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      cliName = "Netlify";
      cliCommand = "netlify";
      inputSchema = {
        type: "object",
        properties: {
          command: {
            type: "string",
            enum: [
              "init",
              "link",
              "deploy",
              "dev",
              "build",
              "env list",
              "env get",
              "env set",
              "env unset",
              "env import",
              "functions list",
              "functions build",
              "functions create",
              "sites list",
              "sites create",
              "sites delete",
              "open",
              "status",
              "login",
              "logout",
              "unlink"
            ],
            description: "The Netlify CLI command to execute. DANGER: deploy command publishes to production. Use --prod flag explicitly for production deploys."
          },
          siteId: {
            type: "string",
            description: "Site ID for link/deploy commands"
          },
          flags: {
            type: "array",
            items: { type: "string" },
            description: "CLI flags like --prod (production deploy), --build (build before deploy), --dir (publish directory), --functions (functions directory)"
          },
          key: {
            type: "string",
            description: "Environment variable key for env commands"
          },
          value: {
            type: "string",
            description: "Environment variable value for env set command"
          },
          functionName: {
            type: "string",
            description: "Function name for functions commands"
          }
        },
        required: ["command"]
      };
      validate(input) {
        if (typeof input.command !== "string" || !input.command.trim()) {
          return "command must be a non-empty string";
        }
        const validCommands = this.inputSchema.properties.command.enum;
        if (!validCommands.includes(input.command)) {
          return `command must be one of: ${validCommands.join(", ")}`;
        }
        if (input.command === "env set") {
          if (!input.key || typeof input.key !== "string") {
            return 'env set command requires a "key" parameter';
          }
          if (!input.value || typeof input.value !== "string") {
            return 'env set command requires a "value" parameter';
          }
        }
        if (["env get", "env unset"].includes(input.command)) {
          if (!input.key || typeof input.key !== "string") {
            return `${input.command} command requires a "key" parameter`;
          }
        }
        return null;
      }
      async execute(input, context) {
        const installed = await this.isCLIInstalled();
        if (!installed) {
          return {
            content: `Netlify CLI is not installed.

${this.getInstallInstructions()}`,
            isError: true
          };
        }
        const command = input.command;
        const args = [];
        const flags = input.flags;
        if (flags) {
          args.push(...flags);
        }
        if (input.siteId) {
          args.push("--site", input.siteId);
        }
        const [mainCmd, subCmd] = command.split(" ");
        if (command === "env set" && input.key && input.value) {
          args.push(input.key, input.value);
        }
        if ((command === "env get" || command === "env unset") && input.key) {
          args.push(input.key);
        }
        if (command === "functions create" && input.functionName) {
          args.push(input.functionName);
        }
        const result = await this.executeCommand(
          mainCmd,
          subCmd ? [subCmd, ...args] : args,
          { cwd: context.cwd },
          3e5
          // 5 minute timeout for builds/deploys
        );
        let content = this.formatOutput(result, command);
        if (command === "deploy" && flags?.includes("--prod")) {
          content = `WARNING: Deployed to PRODUCTION environment.

${content}`;
        }
        return {
          content,
          isError: result.isError,
          metadata: { exitCode: result.exitCode }
        };
      }
      getInstallInstructions() {
        return `To install Netlify CLI:

npm (global):
  npm install netlify-cli -g

npm (local dev dependency):
  npm install netlify-cli --save-dev

Then run commands with npx:
  npx netlify deploy

See https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/ for more details.`;
      }
    };
  }
});

// src/tools/builtin/railway-cli.ts
var RailwayTool;
var init_railway_cli = __esm({
  "src/tools/builtin/railway-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
    RailwayTool = class extends PlatformCLIManager {
      name = "Railway";
      description = "Execute Railway CLI commands for deployment, environment variables, and service management. WARNING: up command deploys to production. Use down to stop services.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      cliName = "Railway";
      cliCommand = "railway";
      inputSchema = {
        type: "object",
        properties: {
          command: {
            type: "string",
            enum: [
              "init",
              "link",
              "up",
              "down",
              "run",
              "logs",
              "status",
              "open",
              "variable list",
              "variable get",
              "variable set",
              "variable unset",
              "variable import",
              "environment",
              "environment new",
              "environment delete",
              "service",
              "add",
              "domain",
              "volume",
              "list",
              "login",
              "logout",
              "unlink",
              "whoami",
              "ssh",
              "shell",
              "connect"
            ],
            description: "The Railway CLI command to execute. DANGER: up command deploys current directory to production. down stops the service."
          },
          service: {
            type: "string",
            description: "Target service name or ID (-s flag)"
          },
          environment: {
            type: "string",
            description: "Target environment name (-e flag)"
          },
          flags: {
            type: "array",
            items: { type: "string" },
            description: "CLI flags like --detach (no logs), --yes (skip confirm), --verbose, etc."
          },
          key: {
            type: "string",
            description: "Variable key for variable commands"
          },
          value: {
            type: "string",
            description: "Variable value for variable set command"
          }
        },
        required: ["command"]
      };
      validate(input) {
        if (typeof input.command !== "string" || !input.command.trim()) {
          return "command must be a non-empty string";
        }
        const validCommands = this.inputSchema.properties.command.enum;
        if (!validCommands.includes(input.command)) {
          return `command must be one of: ${validCommands.join(", ")}`;
        }
        if (input.command === "variable set") {
          if (!input.key || typeof input.key !== "string") {
            return 'variable set command requires a "key" parameter';
          }
          if (!input.value || typeof input.value !== "string") {
            return 'variable set command requires a "value" parameter';
          }
        }
        if (["variable get", "variable unset"].includes(input.command)) {
          if (!input.key || typeof input.key !== "string") {
            return `${input.command} command requires a "key" parameter`;
          }
        }
        return null;
      }
      async execute(input, context) {
        const installed = await this.isCLIInstalled();
        if (!installed) {
          return {
            content: `Railway CLI is not installed.

${this.getInstallInstructions()}`,
            isError: true
          };
        }
        const command = input.command;
        const args = [];
        if (input.service) {
          args.push("-s", input.service);
        }
        if (input.environment) {
          args.push("-e", input.environment);
        }
        const flags = input.flags;
        if (flags) {
          args.push(...flags);
        }
        const [mainCmd, subCmd] = command.split(" ");
        if (command === "variable set" && input.key && input.value) {
          args.push(input.key, input.value);
        }
        if ((command === "variable get" || command === "variable unset") && input.key) {
          args.push(input.key);
        }
        const result = await this.executeCommand(
          mainCmd,
          subCmd ? [subCmd, ...args] : args,
          { cwd: context.cwd },
          3e5
          // 5 minute timeout for deploys
        );
        let content = this.formatOutput(result, command);
        if (command === "up") {
          content = `WARNING: Deployed to Railway production environment.

${content}`;
        }
        if (command === "down") {
          content = `WARNING: Stopped Railway service.

${content}`;
        }
        return {
          content,
          isError: result.isError,
          metadata: { exitCode: result.exitCode }
        };
      }
      getInstallInstructions() {
        return `To install Railway CLI:

npm (global):
  npm i -g @railway/cli

Homebrew (macOS):
  brew install railway

Shell script (macOS/Linux):
  bash <(curl -fsSL cli.new)

Scoop (Windows):
  scoop install railway

Pre-built binaries:
  https://github.com/railwayapp/cli/releases/latest

See https://docs.railway.com/cli for more details.`;
      }
    };
  }
});

// src/tools/builtin/ask-user.ts
var AskUserTool;
var init_ask_user = __esm({
  "src/tools/builtin/ask-user.ts"() {
    "use strict";
    init_tool_types();
    AskUserTool = class {
      name = "AskUser";
      description = "Pause the conversation to ask the user a question or prompt them to perform an action in their terminal. The AI will wait for the user to respond before continuing. Useful for interactive authentication, terminal commands that require user interaction, or getting user input.";
      permissionLevel = "safe" /* SAFE */;
      category = "agent" /* AGENT */;
      inputSchema = {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The message/prompt to show the user explaining what action to take or question to answer"
          },
          terminalCommand: {
            type: "string",
            description: 'Optional: A specific terminal command the user should run (e.g., "supabase login"). This will be shown prominently in the UI.'
          },
          waitForInput: {
            type: "boolean",
            description: 'If true, show a text input field for the user to type a response. If false (default), just show a "Done" button for the user to click when ready.'
          },
          placeholder: {
            type: "string",
            description: "Optional placeholder text for the input field (only used if waitForInput is true)"
          }
        },
        required: ["prompt"]
      };
      validate(input) {
        if (typeof input.prompt !== "string" || !input.prompt.trim()) {
          return "prompt must be a non-empty string";
        }
        if (input.terminalCommand !== void 0 && typeof input.terminalCommand !== "string") {
          return "terminalCommand must be a string";
        }
        if (input.waitForInput !== void 0 && typeof input.waitForInput !== "boolean") {
          return "waitForInput must be a boolean";
        }
        if (input.placeholder !== void 0 && typeof input.placeholder !== "string") {
          return "placeholder must be a string";
        }
        return null;
      }
      async execute(input, context) {
        const prompt = input.prompt;
        const terminalCommand = input.terminalCommand;
        const waitForInput = input.waitForInput ?? false;
        const placeholder = input.placeholder;
        return new Promise((resolve12) => {
          const ctx = context;
          const eventBus = ctx.eventBus;
          if (!eventBus) {
            resolve12({
              content: "Error: EventBus not available in tool context.",
              isError: true
            });
            return;
          }
          const requestId = `${context.sessionId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          eventBus.emit("user_input_request", {
            sessionId: context.sessionId,
            requestId,
            prompt,
            terminalCommand,
            waitForInput,
            placeholder,
            onResponse: (response) => {
              let content = `User responded to: "${prompt}"

`;
              if (terminalCommand) {
                content += `Terminal command provided: \`${terminalCommand}\`

`;
              }
              if (response) {
                content += `Response: ${response}`;
              } else {
                content += "User confirmed completion (no text input provided).";
              }
              resolve12({
                content,
                metadata: { response, hadInput: waitForInput }
              });
            },
            onCancel: () => {
              resolve12({
                content: `User cancelled the request: "${prompt}"`,
                isError: true,
                metadata: { cancelled: true }
              });
            }
          });
        });
      }
    };
  }
});

// src/tools/builtin/process-manager.ts
function appendOutput(info, text) {
  const newLines = text.split("\n");
  for (const line of newLines) {
    if (line || info.outputLines.length > 0) {
      info.outputLines.push(line);
    }
  }
  if (info.outputLines.length > MAX_OUTPUT_LINES) {
    info.outputLines.splice(0, info.outputLines.length - MAX_OUTPUT_LINES);
  }
}
var import_node_child_process11, fs35, os6, path35, import_tree_kill3, processRegistry, MAX_OUTPUT_LINES, ProcessManagerTool;
var init_process_manager = __esm({
  "src/tools/builtin/process-manager.ts"() {
    "use strict";
    import_node_child_process11 = require("child_process");
    fs35 = __toESM(require("fs"), 1);
    os6 = __toESM(require("os"), 1);
    path35 = __toESM(require("path"), 1);
    import_tree_kill3 = __toESM(require("tree-kill"), 1);
    init_tool_types();
    init_logger();
    processRegistry = /* @__PURE__ */ new Map();
    MAX_OUTPUT_LINES = 500;
    ProcessManagerTool = class {
      name = "ProcessManager";
      description = "Start and manage long-running background processes such as dev servers, build watchers, and test runners. Use `start` to launch a named process, `wait_url` to block until a dev server is ready, `status` to read its recent output, `stop` to kill it, and `list` to see all running processes.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["start", "stop", "status", "wait_url", "list"],
            description: "Action to perform"
          },
          name: {
            type: "string",
            description: "Process name (required for start/stop/status)"
          },
          command: {
            type: "string",
            description: "Shell command to run (required for start)"
          },
          cwd: {
            type: "string",
            description: "Working directory for the process (optional, defaults to agent cwd)"
          },
          url: {
            type: "string",
            description: "URL to poll until it returns an HTTP 2xx response (required for wait_url)"
          },
          timeout_ms: {
            type: "number",
            description: "Timeout in milliseconds for wait_url (default: 30000)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        const validActions = ["start", "stop", "status", "wait_url", "list"];
        if (!validActions.includes(action)) {
          return `action must be one of: ${validActions.join(", ")}`;
        }
        if ((action === "start" || action === "stop" || action === "status") && !input.name) {
          return `name is required for action "${action}"`;
        }
        if (action === "start" && !input.command) {
          return 'command is required for action "start"';
        }
        if (action === "wait_url" && !input.url) {
          return 'url is required for action "wait_url"';
        }
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        switch (action) {
          case "start":
            return this.startProcess(input, context);
          case "stop":
            return this.stopProcess(input);
          case "status":
            return this.statusProcess(input);
          case "wait_url":
            return this.waitUrl(input, context);
          case "list":
            return this.listProcesses();
          default:
            return { content: `Unknown action: ${action}`, isError: true };
        }
      }
      async startProcess(input, context) {
        const name = input.name;
        const command = input.command;
        const cwd = input.cwd || context.cwd;
        const existing = processRegistry.get(name);
        if (existing?.running && existing.proc.pid) {
          (0, import_tree_kill3.default)(existing.proc.pid);
          existing.running = false;
        }
        const resolvedCwd = path35.resolve(cwd || os6.homedir());
        const safeCwd = fs35.existsSync(resolvedCwd) ? resolvedCwd : os6.homedir();
        logger.info(`[ProcessManager] Starting process "${name}": ${command} in cwd: ${safeCwd}`);
        const proc = (0, import_node_child_process11.spawn)(command, [], {
          cwd: safeCwd,
          shell: true,
          env: { ...process.env },
          stdio: ["ignore", "pipe", "pipe"],
          detached: false
        });
        logger.debug(`[ProcessManager] Process spawned with PID: ${proc.pid}`);
        if (!proc.pid) {
          return { content: `Failed to start process "${name}": no PID assigned`, isError: true };
        }
        const info = {
          name,
          command,
          proc,
          pid: proc.pid,
          startedAt: Date.now(),
          outputLines: [],
          running: true,
          exitCode: null
        };
        processRegistry.set(name, info);
        proc.stdout?.on("data", (data) => appendOutput(info, data.toString()));
        proc.stderr?.on("data", (data) => appendOutput(info, data.toString()));
        proc.on("close", (code) => {
          info.running = false;
          info.exitCode = code;
          logger.info(`[ProcessManager] Process "${name}" exited with code ${code}`);
        });
        proc.on("error", (err) => {
          info.running = false;
          logger.error(`[ProcessManager] Process "${name}" error: ${err.message}`, err);
          appendOutput(info, `[Process error: ${err.message}]`);
        });
        await new Promise((resolve12) => setTimeout(resolve12, 2e3));
        const recentOutput = info.outputLines.slice(-20).join("\n");
        const status = info.running ? "running" : `exited (code ${info.exitCode})`;
        return {
          content: `Process "${name}" started (PID ${info.pid}), status: ${status}

Startup output:
${recentOutput || "(no output yet)"}`
        };
      }
      stopProcess(input) {
        const name = input.name;
        const info = processRegistry.get(name);
        if (!info) {
          return { content: `No process named "${name}" found.`, isError: true };
        }
        if (!info.running) {
          processRegistry.delete(name);
          return { content: `Process "${name}" was already stopped (exit code ${info.exitCode}).` };
        }
        if (info.proc.pid) {
          (0, import_tree_kill3.default)(info.proc.pid);
        }
        info.running = false;
        processRegistry.delete(name);
        return { content: `Process "${name}" (PID ${info.pid}) has been stopped.` };
      }
      statusProcess(input) {
        const name = input.name;
        const info = processRegistry.get(name);
        if (!info) {
          return { content: `No process named "${name}" found. Use action "list" to see all processes.`, isError: true };
        }
        const uptimeSec = Math.round((Date.now() - info.startedAt) / 1e3);
        const status = info.running ? `running (uptime ${uptimeSec}s, PID ${info.pid})` : `stopped (exit code ${info.exitCode})`;
        const recentOutput = info.outputLines.slice(-50).join("\n");
        return {
          content: `Process "${name}" \u2014 ${status}
Command: ${info.command}

Recent output (last ${Math.min(50, info.outputLines.length)} lines):
${recentOutput || "(no output)"}`
        };
      }
      async waitUrl(input, context) {
        const url = input.url;
        const timeoutMs = input.timeout_ms ?? 3e4;
        const intervalMs = 500;
        const deadline = Date.now() + timeoutMs;
        context.onProgress?.(`Waiting for ${url} to become available...`);
        while (Date.now() < deadline) {
          if (context.abortSignal.aborted) {
            return { content: "Cancelled while waiting for URL.", isError: true };
          }
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3e3) });
            if (res.ok || res.status >= 200 && res.status < 400) {
              return { content: `${url} is ready (HTTP ${res.status}).` };
            }
          } catch {
          }
          const elapsed = Math.round((Date.now() - (deadline - timeoutMs)) / 1e3);
          context.onProgress?.(`Waiting for ${url}... (${elapsed}s elapsed)`);
          await new Promise((resolve12) => setTimeout(resolve12, intervalMs));
        }
        return {
          content: `Timed out after ${timeoutMs}ms waiting for ${url} to respond.`,
          isError: true
        };
      }
      listProcesses() {
        if (processRegistry.size === 0) {
          return { content: "No background processes are currently tracked." };
        }
        const rows = Array.from(processRegistry.values()).map((info) => {
          const uptimeSec = Math.round((Date.now() - info.startedAt) / 1e3);
          const status = info.running ? `running ${uptimeSec}s` : `stopped (exit ${info.exitCode})`;
          return `  \u2022 ${info.name} \u2014 PID ${info.pid} \u2014 ${status}
    Command: ${info.command}`;
        });
        return { content: `Background processes (${processRegistry.size}):

${rows.join("\n\n")}` };
      }
    };
  }
});

// src/tools/builtin/create-plan.ts
function generatePlanFileName(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").substring(0, 40);
  const hash = Array.from(
    { length: 8 },
    () => "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
  ).join("");
  return `${slug}_${hash}.plan.md`;
}
async function findExistingPlan(cwd, title) {
  try {
    const files = await fs36.readdir(cwd);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const planFiles = files.filter(
      (f) => f.endsWith(".plan.md") || f === "PLAN.md"
    );
    for (const file of planFiles) {
      if (file.startsWith(slug) || file === "PLAN.md") {
        return path36.join(cwd, file);
      }
    }
  } catch {
  }
  return null;
}
var fs36, path36, CreatePlanTool;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs36 = __toESM(require("fs/promises"), 1);
    path36 = __toESM(require("path"), 1);
    init_tool_types();
    CreatePlanTool = class {
      name = "CreatePlan";
      description = `Creates a plan file in the project root with a structured task list using markdown checkboxes. Generates unique filenames like "my_plan_abc123.plan.md" so multiple plans can coexist. Use this in architect mode to create a plan that can be referenced and checked off as tasks are completed.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the plan/project"
          },
          description: {
            type: "string",
            description: "Brief overview of what the plan covers"
          },
          sections: {
            type: "array",
            description: "Organized sections of tasks",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: 'Section title (e.g., "Phase 1: Setup")' },
                tasks: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of task descriptions for this section"
                }
              },
              required: ["title", "tasks"]
            }
          },
          notes: {
            type: "string",
            description: "Optional notes, context, or decisions to include at the end"
          }
        },
        required: ["title", "sections"]
      };
      validate(input) {
        if (typeof input.title !== "string" || !input.title.trim()) {
          return "title must be a non-empty string";
        }
        if (!Array.isArray(input.sections) || input.sections.length === 0) {
          return "sections must be a non-empty array";
        }
        for (const section of input.sections) {
          if (typeof section.title !== "string" || !section.title.trim()) {
            return "each section must have a non-empty title";
          }
          if (!Array.isArray(section.tasks) || section.tasks.length === 0) {
            return "each section must have a non-empty tasks array";
          }
          for (const task of section.tasks) {
            if (typeof task !== "string" || !task.trim()) {
              return "each task must be a non-empty string";
            }
          }
        }
        return null;
      }
      async execute(input, context) {
        const title = input.title.trim();
        const description = input.description?.trim();
        const sections = input.sections;
        const notes = input.notes?.trim();
        try {
          const existingPlan = await findExistingPlan(context.cwd, title);
          const planFileName = generatePlanFileName(title);
          const planPath = path36.join(context.cwd, planFileName);
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const planContent = this.generatePlanContent({
            title,
            description,
            sections,
            notes,
            createdAt: now,
            updatedAt: now
          });
          await fs36.writeFile(planPath, planContent, "utf-8");
          const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);
          let message = `Created plan at ${planPath} with ${sections.length} sections and ${totalTasks} tasks.`;
          if (existingPlan) {
            message += `

Note: Another plan with a similar title exists at ${existingPlan}. Both plans are preserved.`;
          }
          return {
            content: message,
            metadata: {
              path: planPath,
              title,
              sectionCount: sections.length,
              taskCount: totalTasks,
              existingPlan: existingPlan || void 0
            }
          };
        } catch (error) {
          return {
            content: `Error creating plan: ${error.message}`,
            isError: true
          };
        }
      }
      generatePlanContent(params) {
        const lines = [];
        const todos = [];
        let todoId = 1;
        for (const section of params.sections) {
          for (const task of section.tasks) {
            let complexity;
            let taskContent = task;
            const complexityMatch = task.match(/^\[(LOW|MEDIUM|HIGH)\]\s*/i);
            if (complexityMatch) {
              complexity = complexityMatch[1].toLowerCase();
              taskContent = task.replace(/^\[(LOW|MEDIUM|HIGH)\]\s*/i, "");
            }
            todos.push({
              id: String(todoId++),
              content: taskContent,
              status: "pending",
              complexity
            });
          }
        }
        const estimatedCost = todos.reduce((sum, todo) => {
          const complexityCost = todo.complexity === "high" ? 0.5 : todo.complexity === "medium" ? 0.2 : 0.1;
          return sum + complexityCost;
        }, 0.5);
        lines.push("---");
        lines.push(`name: ${params.title}`);
        lines.push(`overview: |`);
        lines.push(`  ${params.description || `Implementation plan for ${params.title}`}`);
        lines.push(`isProject: true`);
        lines.push(`createdAt: ${params.createdAt}`);
        lines.push(`updatedAt: ${params.updatedAt}`);
        lines.push(`estimatedCost: ${estimatedCost.toFixed(2)}`);
        lines.push(`costLimit: ${Math.max(5, Math.ceil(estimatedCost * 2))}`);
        lines.push("todos:");
        for (const todo of todos) {
          lines.push(`  - id: "${todo.id}"`);
          lines.push(`    content: "${todo.content.replace(/"/g, '\\"')}"`);
          lines.push(`    status: "${todo.status}"`);
          if (todo.complexity) {
            lines.push(`    complexity: "${todo.complexity}"`);
          }
        }
        lines.push("---");
        lines.push("");
        lines.push("## Overview");
        lines.push(params.description || `Implementation plan for ${params.title}`);
        lines.push("");
        lines.push("## Progress");
        lines.push(`- Total Tasks: ${todos.length}`);
        lines.push(`- Completed: 0/${todos.length} (0%)`);
        lines.push(`- Estimated Cost: ~$${estimatedCost.toFixed(2)}`);
        lines.push("");
        lines.push("## Implementation Tasks");
        lines.push("");
        let taskIdx = 0;
        for (const section of params.sections) {
          lines.push(`### ${section.title}`);
          lines.push("");
          for (const _task of section.tasks) {
            const todo = todos[taskIdx++];
            const complexityBadge = todo.complexity ? `[${todo.complexity.toUpperCase()}] ` : "";
            lines.push(`- [ ] ${complexityBadge}${todo.content}`);
          }
          lines.push("");
        }
        if (params.notes) {
          lines.push("## Notes");
          lines.push(params.notes);
          lines.push("");
        }
        return lines.join("\n");
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const title = input.title;
        return `Created plan "${title}" with ${result.metadata?.taskCount || 0} tasks`;
      }
    };
  }
});

// src/tools/builtin/update-plan.ts
async function findPlanFiles(cwd) {
  try {
    const files = await fs37.readdir(cwd);
    return files.filter((f) => f.endsWith(".plan.md") || f === "PLAN.md");
  } catch {
    return [];
  }
}
async function getMostRecentPlan(cwd) {
  const planFiles = await findPlanFiles(cwd);
  if (planFiles.length === 0)
    return null;
  if (planFiles.length === 1)
    return planFiles[0];
  const filesWithStats = await Promise.all(
    planFiles.map(async (file) => {
      const filePath = path37.join(cwd, file);
      try {
        const stats = await fs37.stat(filePath);
        return { file, mtime: stats.mtime };
      } catch {
        return { file, mtime: /* @__PURE__ */ new Date(0) };
      }
    })
  );
  filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return filesWithStats[0].file;
}
var fs37, path37, UpdatePlanTool;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs37 = __toESM(require("fs/promises"), 1);
    path37 = __toESM(require("path"), 1);
    init_tool_types();
    UpdatePlanTool = class {
      name = "UpdatePlan";
      description = `Updates a plan file - check/uncheck tasks, add new tasks or sections, or append notes. Can work with multiple plan files; uses the most recent plan by default or a specific plan file when specified. Use 'list_plans' action to see available plans.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The update action to perform",
            enum: ["check", "uncheck", "add_task", "add_section", "append_note", "update_progress", "list_plans"]
          },
          planFile: {
            type: "string",
            description: 'Specific plan file to update (e.g., "my_plan_abc123.plan.md"). If not provided, uses the most recent plan file.'
          },
          section: {
            type: "string",
            description: "Section title for the task (required for check/uncheck/add_task)"
          },
          task: {
            type: "string",
            description: "Task description to check/uncheck or add (exact match for check/uncheck)"
          },
          newSection: {
            type: "object",
            description: "New section to add (for add_section action)",
            properties: {
              title: { type: "string" },
              tasks: { type: "array", items: { type: "string" } }
            }
          },
          note: {
            type: "string",
            description: "Note text to append (for append_note action)"
          }
        },
        required: ["action"]
      };
      validate(input) {
        const action = input.action;
        const validActions = ["check", "uncheck", "add_task", "add_section", "append_note", "update_progress", "list_plans"];
        if (!validActions.includes(action)) {
          return `action must be one of: ${validActions.join(", ")}`;
        }
        if (action === "list_plans") {
          return null;
        }
        if (["check", "uncheck", "add_task"].includes(action)) {
          if (typeof input.section !== "string" || !input.section.trim()) {
            return "section is required for this action";
          }
          if (typeof input.task !== "string" || !input.task.trim()) {
            return "task is required for this action";
          }
        }
        if (action === "add_section") {
          if (!input.newSection || typeof input.newSection !== "object") {
            return "newSection is required for add_section action";
          }
          const ns = input.newSection;
          if (!ns.title || typeof ns.title !== "string") {
            return "newSection.title is required";
          }
          if (!Array.isArray(ns.tasks)) {
            return "newSection.tasks must be an array";
          }
        }
        if (action === "append_note") {
          if (typeof input.note !== "string" || !input.note.trim()) {
            return "note is required for append_note action";
          }
        }
        return null;
      }
      async execute(input, context) {
        const action = input.action;
        const planFile = input.planFile;
        try {
          if (action === "list_plans") {
            const planFiles = await findPlanFiles(context.cwd);
            if (planFiles.length === 0) {
              return {
                content: "No plan files found in the workspace. Use CreatePlan to create a plan.",
                metadata: { plans: [] }
              };
            }
            const planList = planFiles.join("\n  - ");
            return {
              content: `Found ${planFiles.length} plan file(s):
  - ${planList}

Use 'planFile' parameter to specify which plan to update.`,
              metadata: { plans: planFiles }
            };
          }
          let targetPlanFile;
          if (planFile) {
            targetPlanFile = planFile;
          } else {
            const mostRecent = await getMostRecentPlan(context.cwd);
            if (!mostRecent) {
              return {
                content: "No plan files found in the workspace. Use CreatePlan to create a plan first.",
                isError: true
              };
            }
            targetPlanFile = mostRecent;
          }
          const planPath = path37.join(context.cwd, targetPlanFile);
          let content;
          try {
            content = await fs37.readFile(planPath, "utf-8");
          } catch {
            const availablePlans = await findPlanFiles(context.cwd);
            let errorMsg = `Error: Plan file "${targetPlanFile}" not found.`;
            if (availablePlans.length > 0) {
              errorMsg += `

Available plans:
  - ${availablePlans.join("\n  - ")}`;
            }
            return {
              content: errorMsg,
              isError: true
            };
          }
          let updatedContent;
          let resultMessage;
          switch (action) {
            case "check":
            case "uncheck": {
              const section = input.section.trim();
              const task = input.task.trim();
              const checkbox = action === "check" ? "- [x]" : "- [ ]";
              const oldCheckbox = action === "check" ? "- [ ]" : "- [x]";
              const sectionRegex = new RegExp(
                `^(### ${this.escapeRegex(section)}[\\s\\S]*?)(^${this.escapeRegex(oldCheckbox)} ${this.escapeRegex(task)}$)`,
                "m"
              );
              if (!sectionRegex.test(content)) {
                return {
                  content: `Error: Task "${task}" not found in section "${section}"`,
                  isError: true
                };
              }
              updatedContent = content.replace(sectionRegex, `$1${checkbox} ${task}`);
              resultMessage = `Marked task "${task}" as ${action === "check" ? "complete" : "incomplete"}`;
              break;
            }
            case "add_task": {
              const section = input.section.trim();
              const task = input.task.trim();
              const sectionRegex = new RegExp(`^(### ${this.escapeRegex(section)}.*?)(

### |
## |$)`, "m");
              const match = content.match(sectionRegex);
              if (!match) {
                return {
                  content: `Error: Section "${section}" not found`,
                  isError: true
                };
              }
              const insertPos = (match.index || 0) + match[0].length - match[2].length;
              updatedContent = content.slice(0, insertPos) + `- [ ] ${task}
` + content.slice(insertPos);
              resultMessage = `Added task "${task}" to section "${section}"`;
              break;
            }
            case "add_section": {
              const newSection = input.newSection;
              const sectionContent = [
                "",
                `### ${newSection.title}`,
                "",
                ...newSection.tasks.map((t) => `- [ ] ${t}`),
                ""
              ].join("\n");
              const notesMatch = content.match(/\n## Notes\n/);
              if (notesMatch && notesMatch.index !== void 0) {
                updatedContent = content.slice(0, notesMatch.index) + sectionContent + content.slice(notesMatch.index);
              } else {
                updatedContent = content + sectionContent;
              }
              resultMessage = `Added section "${newSection.title}" with ${newSection.tasks.length} tasks`;
              break;
            }
            case "append_note": {
              const note = input.note.trim();
              const timestamp = (/* @__PURE__ */ new Date()).toLocaleString();
              const noteEntry = `
**${timestamp}:** ${note}`;
              const notesMatch = content.match(/\n## Notes\n/);
              if (notesMatch && notesMatch.index !== void 0) {
                updatedContent = content.slice(0, notesMatch.index + notesMatch[0].length) + noteEntry + content.slice(notesMatch.index + notesMatch[0].length);
              } else {
                updatedContent = content + `
## Notes
${noteEntry}
`;
              }
              resultMessage = `Appended note to plan`;
              break;
            }
            case "update_progress": {
              const progress = this.calculateProgress(content);
              const progressRegex = /## Progress\n[\s\S]*?(?=\n## |\n### |$)/;
              const newProgress = `## Progress
- ${progress.checked}/${progress.total} tasks complete (${progress.percent}%)
`;
              if (progressRegex.test(content)) {
                updatedContent = content.replace(progressRegex, newProgress);
              } else {
                const overviewMatch = content.match(/## Overview\n[\s\S]*?\n\n/);
                if (overviewMatch && overviewMatch.index !== void 0) {
                  const insertPos = overviewMatch.index + overviewMatch[0].length;
                  updatedContent = content.slice(0, insertPos) + newProgress + "\n" + content.slice(insertPos);
                } else {
                  const headerMatch = content.match(/^# .*\n/);
                  if (headerMatch && headerMatch.index !== void 0) {
                    const insertPos = headerMatch.index + headerMatch[0].length;
                    updatedContent = content.slice(0, insertPos) + "\n" + newProgress + "\n" + content.slice(insertPos);
                  } else {
                    updatedContent = newProgress + "\n" + content;
                  }
                }
              }
              resultMessage = `Updated progress: ${progress.checked}/${progress.total} (${progress.percent}%)`;
              break;
            }
            default:
              return {
                content: `Error: Unknown action "${action}"`,
                isError: true
              };
          }
          updatedContent = updatedContent.replace(
            /(> Created: .*?\n)(> Updated: .*?\n)?/,
            `$1> Updated: ${(/* @__PURE__ */ new Date()).toLocaleString()}
`
          );
          await fs37.writeFile(planPath, updatedContent, "utf-8");
          return {
            content: resultMessage,
            metadata: { action, path: planPath }
          };
        } catch (error) {
          return {
            content: `Error updating plan: ${error.message}`,
            isError: true
          };
        }
      }
      escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      calculateProgress(content) {
        const unchecked = (content.match(/- \[ \]/g) || []).length;
        const checked = (content.match(/- \[x\]/g) || []).length;
        const total = unchecked + checked;
        const percent = total > 0 ? Math.round(checked / total * 100) : 0;
        return { total, checked, percent };
      }
      formatForDisplay(result, input) {
        if (result.isError)
          return result.content;
        const action = input.action;
        switch (action) {
          case "check":
            return `Checked off task`;
          case "uncheck":
            return `Unchecked task`;
          case "add_task":
            return `Added task to plan`;
          case "add_section":
            return `Added section with ${input.newSection ? input.newSection.tasks.length : 0} tasks`;
          case "append_note":
            return `Added note to plan`;
          case "update_progress":
            return `Updated progress`;
          case "list_plans":
            return `Listed ${(result.metadata?.plans || []).length} plan(s)`;
          default:
            return `Updated plan`;
        }
      }
    };
  }
});

// src/tools/builtin/read-plan.ts
async function findPlanFiles2(cwd) {
  try {
    const files = await fs38.readdir(cwd);
    return files.filter((f) => f.endsWith(".plan.md") || f === "PLAN.md");
  } catch {
    return [];
  }
}
async function getMostRecentPlan2(cwd) {
  const planFiles = await findPlanFiles2(cwd);
  if (planFiles.length === 0)
    return null;
  if (planFiles.length === 1)
    return planFiles[0];
  const filesWithStats = await Promise.all(
    planFiles.map(async (file) => {
      const filePath = path38.join(cwd, file);
      try {
        const stats = await fs38.stat(filePath);
        return { file, mtime: stats.mtime };
      } catch {
        return { file, mtime: /* @__PURE__ */ new Date(0) };
      }
    })
  );
  filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return filesWithStats[0].file;
}
var fs38, path38, ReadPlanTool;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs38 = __toESM(require("fs/promises"), 1);
    path38 = __toESM(require("path"), 1);
    init_tool_types();
    ReadPlanTool = class {
      name = "ReadPlan";
      description = `Reads and parses plan files (.plan.md) to check current status, view tasks, and see progress. Can read the most recent plan or a specific plan file. Returns structured data about tasks, sections, and completion status.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      inputSchema = {
        type: "object",
        properties: {
          planFile: {
            type: "string",
            description: 'Specific plan file to read (e.g., "my_plan_abc123.plan.md"). If not provided, uses the most recent plan file.'
          },
          listAll: {
            type: "boolean",
            description: "If true, list all available plan files instead of reading one"
          },
          section: {
            type: "string",
            description: "Filter by section title (optional)"
          },
          status: {
            type: "string",
            description: "Filter tasks by status",
            enum: ["all", "pending", "complete"]
          },
          format: {
            type: "string",
            description: "Output format",
            enum: ["structured", "markdown", "summary"]
          }
        }
      };
      validate(input) {
        if (input.status !== void 0 && !["all", "pending", "complete"].includes(input.status)) {
          return "status must be one of: all, pending, complete";
        }
        if (input.format !== void 0 && !["structured", "markdown", "summary"].includes(input.format)) {
          return "format must be one of: structured, markdown, summary";
        }
        return null;
      }
      async execute(input, context) {
        const sectionFilter = input.section?.trim();
        const statusFilter = input.status || "all";
        const format = input.format || "structured";
        const planFile = input.planFile;
        const listAll = input.listAll || false;
        try {
          if (listAll) {
            const planFiles = await findPlanFiles2(context.cwd);
            if (planFiles.length === 0) {
              return {
                content: "No plan files found in the workspace. Use CreatePlan to create a plan.",
                metadata: { exists: false, plans: [] }
              };
            }
            const planList = planFiles.join("\n  - ");
            return {
              content: `Found ${planFiles.length} plan file(s):
  - ${planList}

Use 'planFile' parameter to specify which plan to read.`,
              metadata: { exists: true, plans: planFiles }
            };
          }
          let targetPlanFile;
          if (planFile) {
            targetPlanFile = planFile;
          } else {
            const mostRecent = await getMostRecentPlan2(context.cwd);
            if (!mostRecent) {
              return {
                content: "No plan files found in the workspace. Use CreatePlan to create a plan.",
                isError: false,
                metadata: { exists: false }
              };
            }
            targetPlanFile = mostRecent;
          }
          const planPath = path38.join(context.cwd, targetPlanFile);
          let content;
          try {
            content = await fs38.readFile(planPath, "utf-8");
          } catch {
            const availablePlans = await findPlanFiles2(context.cwd);
            let errorMsg = `Plan file "${targetPlanFile}" not found.`;
            if (availablePlans.length > 0) {
              errorMsg += `

Available plans:
  - ${availablePlans.join("\n  - ")}`;
              errorMsg += `

Use 'planFile' parameter to specify which plan to read, or omit it to use the most recent plan.`;
            } else {
              errorMsg += " Use CreatePlan to create a plan.";
            }
            return {
              content: errorMsg,
              isError: false,
              metadata: { exists: false }
            };
          }
          const planData = this.parsePlan(content);
          let filteredData = planData;
          if (sectionFilter) {
            filteredData = {
              ...planData,
              sections: planData.sections.filter(
                (s) => s.title.toLowerCase().includes(sectionFilter.toLowerCase())
              )
            };
          }
          if (statusFilter !== "all") {
            filteredData = {
              ...filteredData,
              sections: filteredData.sections.map((s) => ({
                ...s,
                tasks: s.tasks.filter(
                  (t) => statusFilter === "complete" ? t.checked : !t.checked
                )
              })).filter((s) => s.tasks.length > 0)
            };
          }
          const totalTasks = filteredData.sections.reduce((sum, s) => sum + s.tasks.length, 0);
          const checkedTasks = filteredData.sections.reduce(
            (sum, s) => sum + s.tasks.filter((t) => t.checked).length,
            0
          );
          filteredData.progress = {
            total: totalTasks,
            checked: checkedTasks,
            percent: totalTasks > 0 ? Math.round(checkedTasks / totalTasks * 100) : 0
          };
          let outputContent;
          switch (format) {
            case "markdown":
              outputContent = content;
              break;
            case "summary":
              outputContent = this.formatSummary(filteredData, targetPlanFile);
              break;
            case "structured":
            default:
              outputContent = this.formatStructured(filteredData, targetPlanFile);
              break;
          }
          return {
            content: outputContent,
            metadata: {
              exists: true,
              path: planPath,
              planFile: targetPlanFile,
              plan: filteredData
            }
          };
        } catch (error) {
          return {
            content: `Error reading plan: ${error.message}`,
            isError: true
          };
        }
      }
      parsePlan(content) {
        const lines = content.split("\n");
        const plan = {
          title: "",
          progress: { total: 0, checked: 0, percent: 0 },
          sections: []
        };
        let currentSection = null;
        let inNotes = false;
        const notesLines = [];
        for (const line of lines) {
          if (line.startsWith("# ")) {
            plan.title = line.replace("# ", "").replace("Project Plan: ", "").trim();
            continue;
          }
          const createdMatch = line.match(/> Created: (.+)$/);
          if (createdMatch) {
            plan.createdAt = createdMatch[1].trim();
          }
          const updatedMatch = line.match(/> Updated: (.+)$/);
          if (updatedMatch) {
            plan.updatedAt = updatedMatch[1].trim();
          }
          if (line === "## Overview") {
            continue;
          }
          if (line === "## Progress") {
            continue;
          }
          if (line.startsWith("- [ ] **") || line.startsWith("- [x] **")) {
            const match = line.match(/- \[([ x])\] \*\*(\d+) tasks\*\*/);
            if (match) {
              plan.progress.total = parseInt(match[2], 10);
            }
            continue;
          }
          if (line.includes("Progress:")) {
            const match = line.match(/Progress: (\d+)\/(\d+)/);
            if (match) {
              plan.progress.checked = parseInt(match[1], 10);
              plan.progress.total = parseInt(match[2], 10);
              plan.progress.percent = plan.progress.total > 0 ? Math.round(plan.progress.checked / plan.progress.total * 100) : 0;
            }
            continue;
          }
          if (line.startsWith("### ")) {
            if (currentSection) {
              plan.sections.push(currentSection);
            }
            currentSection = {
              title: line.replace("### ", "").trim(),
              tasks: []
            };
            inNotes = false;
            continue;
          }
          if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
            const checked2 = line.startsWith("- [x] ");
            const description = line.replace(/^- \[([ x])\] /, "").trim();
            if (currentSection) {
              currentSection.tasks.push({
                description,
                checked: checked2,
                section: currentSection.title
              });
            }
            continue;
          }
          if (line === "## Notes") {
            inNotes = true;
            continue;
          }
          if (inNotes && line.startsWith("## ")) {
            inNotes = false;
          }
          if (inNotes && line.trim()) {
            notesLines.push(line);
          }
        }
        if (currentSection) {
          plan.sections.push(currentSection);
        }
        if (notesLines.length > 0) {
          plan.notes = notesLines.join("\n");
        }
        const total = plan.sections.reduce((sum, s) => sum + s.tasks.length, 0);
        const checked = plan.sections.reduce(
          (sum, s) => sum + s.tasks.filter((t) => t.checked).length,
          0
        );
        plan.progress = {
          total,
          checked,
          percent: total > 0 ? Math.round(checked / total * 100) : 0
        };
        return plan;
      }
      formatSummary(data, fileName) {
        const lines = [];
        if (fileName) {
          lines.push(`File: ${fileName}`);
          lines.push("");
        }
        lines.push(`Plan: ${data.title}`);
        lines.push(`Progress: ${data.progress.checked}/${data.progress.total} (${data.progress.percent}%)`);
        lines.push("");
        for (const section of data.sections) {
          const sectionChecked = section.tasks.filter((t) => t.checked).length;
          const sectionTotal = section.tasks.length;
          lines.push(`${section.title}: ${sectionChecked}/${sectionTotal}`);
        }
        return lines.join("\n");
      }
      formatStructured(data, fileName) {
        const lines = [];
        if (fileName) {
          lines.push(`**File:** ${fileName}`);
          lines.push("");
        }
        lines.push(`# ${data.title}`);
        lines.push("");
        lines.push(`**Progress:** ${data.progress.checked}/${data.progress.total} tasks (${data.progress.percent}%)`);
        lines.push("");
        for (const section of data.sections) {
          lines.push(`## ${section.title}`);
          lines.push("");
          for (const task of section.tasks) {
            const status = task.checked ? "[x]" : "[ ]";
            lines.push(`- ${status} ${task.description}`);
          }
          lines.push("");
        }
        if (data.notes) {
          lines.push("## Notes");
          lines.push(data.notes);
        }
        return lines.join("\n");
      }
      formatForDisplay(result) {
        if (result.isError)
          return result.content;
        if (!result.metadata?.exists)
          return "No plan exists yet";
        const plan = result.metadata.plan;
        const fileName = result.metadata.planFile;
        return `${fileName}: ${plan.title} - ${plan.progress.checked}/${plan.progress.total} (${plan.progress.percent}%)`;
      }
    };
  }
});

// src/tools/builtin/index.ts
function registerBuiltinTools(registry) {
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new EditFileTool());
  registry.register(new GlobSearchTool());
  registry.register(new GrepSearchTool());
  registry.register(new BashExecTool());
  registry.register(new IndexCodebaseTool());
  registry.register(new PreviewDiffTool());
  registry.register(new RunTestsTool());
  registry.register(new FileTreeTool());
  registry.register(new LintFixTool());
  registry.register(new SearchWebTool());
  registry.register(new WebFetchTool());
  registry.register(new HTTPClientTool());
  registry.register(new TypeCheckTool());
  registry.register(new SymbolRenameTool());
  registry.register(new MultiFileEditTool());
  registry.register(new DependencyManagerTool());
  registry.register(new ScaffoldTool());
  registry.register(new DatabaseQueryTool());
  registry.register(new SubAgentTool());
  registry.register(new CheckpointTool());
  registry.register(new TestGenTool());
  registry.register(new QueryCodebaseTool());
  registry.register(new RepoMapTool());
  registry.register(new SelfAnalyzeTool());
  registry.register(new GitCommitTool());
  registry.register(new GitDiffTool());
  registry.register(new GitLogTool());
  registry.register(new GitBranchTool());
  registry.register(new GitStashTool());
  registry.register(new UnifiedDiffEditTool());
  registry.register(new BackgroundAgentTool());
  registry.register(new CodeReviewTool());
  registry.register(new BrowserAutomationTool());
  registry.register(new OpenBrowserTool());
  registry.register(new BrowserControlTool());
  registry.register(new DebuggerTool());
  registry.register(new DocGenTool());
  registry.register(new NotebookTool());
  registry.register(new SupabaseTool());
  registry.register(new NetlifyTool());
  registry.register(new RailwayTool());
  registry.register(new AskUserTool());
  registry.register(new ProcessManagerTool());
  registry.register(new CreatePlanTool());
  registry.register(new UpdatePlanTool());
  registry.register(new ReadPlanTool());
}
var init_builtin = __esm({
  "src/tools/builtin/index.ts"() {
    "use strict";
    init_read_file();
    init_write_file();
    init_edit_file();
    init_glob_search();
    init_grep_search();
    init_bash_exec();
    init_index_codebase();
    init_preview_diff();
    init_run_tests();
    init_file_tree();
    init_lint_fix();
    init_search_web();
    init_web_fetch();
    init_type_check();
    init_http_client();
    init_symbol_rename();
    init_multi_file_edit();
    init_dependency_manager();
    init_scaffold();
    init_database_query();
    init_sub_agent();
    init_checkpoint();
    init_test_gen();
    init_query_codebase();
    init_repo_map();
    init_self_analyze();
    init_git_commit();
    init_git_diff();
    init_git_log();
    init_git_branch();
    init_git_stash();
    init_unified_diff_edit();
    init_background_agent();
    init_code_review();
    init_browser_automation();
    init_open_browser();
    init_browser_control();
    init_debugger();
    init_doc_gen();
    init_notebook();
    init_supabase_cli();
    init_netlify_cli();
    init_railway_cli();
    init_ask_user();
    init_process_manager();
    init_create_plan();
    init_update_plan();
    init_read_plan();
  }
});

// src/permissions/permission-manager.ts
var PermissionManager;
var init_permission_manager = __esm({
  "src/permissions/permission-manager.ts"() {
    "use strict";
    init_tool_types();
    PermissionManager = class {
      constructor(mode, eventBus) {
        this.mode = mode;
        this.eventBus = eventBus;
      }
      sessionPermissions = /* @__PURE__ */ new Map();
      setMode(mode) {
        this.mode = mode;
      }
      getMode() {
        return this.mode;
      }
      async check(tool, input, context, toolId) {
        if (this.mode === "auto-allow") {
          return true;
        }
        if (this.mode === "deny-all" && tool.permissionLevel !== "safe" /* SAFE */) {
          return false;
        }
        if (tool.permissionLevel === "safe" /* SAFE */) {
          return true;
        }
        const toolKey = tool.name;
        const specificKey = this.getPermissionKey(tool, input);
        const sessionGrant = this.sessionPermissions.get(specificKey) || this.sessionPermissions.get(toolKey);
        if (sessionGrant === "allow")
          return true;
        if (sessionGrant === "deny")
          return false;
        return this.promptUser(tool, input, context, toolId);
      }
      grantSession(toolName) {
        this.sessionPermissions.set(toolName, "allow");
      }
      denySession(toolName) {
        this.sessionPermissions.set(toolName, "deny");
      }
      clearSessionPermissions() {
        this.sessionPermissions.clear();
      }
      async promptUser(tool, input, context, toolId) {
        return new Promise((resolve12) => {
          this.eventBus.emit("permission_request", {
            sessionId: context.sessionId,
            toolName: tool.name,
            toolId,
            input,
            onAllow: () => resolve12(true),
            onDeny: () => resolve12(false),
            onAllowAlways: () => {
              this.sessionPermissions.set(tool.name, "allow");
              resolve12(true);
            }
          });
        });
      }
      getPermissionKey(tool, input) {
        switch (tool.name) {
          case "Write":
          case "Edit":
          case "Read":
            return `${tool.name}:${input.file_path}`;
          case "Bash":
            return `${tool.name}:${String(input.command || "").split(" ")[0]}`;
          default:
            return tool.name;
        }
      }
    };
  }
});

// src/tools/tool-runner.ts
var path39, LINT_ELIGIBLE_TOOLS, FILE_PATH_TOOLS, WRITE_TOOLS, WORKSPACE_BOUND_TOOLS, ToolRunner;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path39 = __toESM(require("path"), 1);
    LINT_ELIGIBLE_TOOLS = /* @__PURE__ */ new Set(["Edit", "Write", "MultiFileEdit", "DiffEdit"]);
    FILE_PATH_TOOLS = /* @__PURE__ */ new Set(["Read", "Write", "Edit", "DiffEdit"]);
    WRITE_TOOLS = /* @__PURE__ */ new Set(["Write", "Edit", "MultiFileEdit", "DiffEdit"]);
    WORKSPACE_BOUND_TOOLS = /* @__PURE__ */ new Set(["Glob", "Grep", "FileTree"]);
    ToolRunner = class {
      constructor(registry, permissionManager2, eventBus, autoLintFix = false, protectedPaths = []) {
        this.registry = registry;
        this.permissionManager = permissionManager2;
        this.eventBus = eventBus;
        this.autoLintFix = autoLintFix;
        this.protectedPaths = protectedPaths.map((p) => path39.resolve(p));
      }
      autoLintFix;
      protectedPaths;
      outputFilters = [];
      /**
       * Returns true if the resolved filePath falls inside (or equals) a protected directory.
       * Used to prevent the agent from modifying the application's own source files.
       */
      isProtectedPath(filePath) {
        const resolved = path39.resolve(filePath);
        return this.protectedPaths.some(
          (protected_) => resolved === protected_ || resolved.startsWith(protected_ + path39.sep)
        );
      }
      /**
       * Returns true if the resolved filePath falls inside (or equals) one of the workspace roots.
       * Used to keep search/exploration tools scoped to the open workspace.
       */
      isWithinWorkspace(filePath, workspacePaths) {
        const resolved = path39.resolve(filePath);
        return workspacePaths.some(
          (wp) => resolved === wp || resolved.startsWith(wp + path39.sep)
        );
      }
      /**
       * Get access to the EventBus for tools that need to emit events
       */
      getEventBus() {
        return this.eventBus;
      }
      /**
       * Replace the active set of addon-provided output filters.
       * Called by core-integration after addons are (re)loaded.
       */
      setOutputFilters(filters) {
        this.outputFilters = filters;
      }
      /** Run the output string through all registered filters in order. */
      applyOutputFilters(toolName, output) {
        let result = output;
        for (const filter of this.outputFilters) {
          try {
            result = filter(toolName, result);
          } catch {
          }
        }
        return result;
      }
      async execute(toolName, toolId, input, context) {
        const registration = this.registry.get(toolName);
        if (!registration) {
          return { content: `Unknown tool: ${toolName}`, isError: true };
        }
        const tool = registration.tool;
        const normalizedInput = this.normalizeInput(toolName, input, context);
        if (WRITE_TOOLS.has(toolName) && this.protectedPaths.length > 0) {
          const filePath = normalizedInput.file_path;
          if (filePath && this.isProtectedPath(filePath)) {
            return {
              content: `Access denied: the agent is not allowed to modify application files at "${filePath}". You can only write files inside the user's open workspace.`,
              isError: true
            };
          }
          if (toolName === "MultiFileEdit" && Array.isArray(normalizedInput.edits)) {
            for (const edit of normalizedInput.edits) {
              const editPath = edit?.file_path;
              if (editPath && this.isProtectedPath(editPath)) {
                return {
                  content: `Access denied: the agent is not allowed to modify application files at "${editPath}". You can only write files inside the user's open workspace.`,
                  isError: true
                };
              }
            }
          }
        }
        if (WORKSPACE_BOUND_TOOLS.has(toolName) && context.workspacePaths && context.workspacePaths.length > 0) {
          const searchPath = normalizedInput.path;
          if (searchPath) {
            const resolvedSearch = path39.resolve(context.cwd, searchPath);
            if (!this.isWithinWorkspace(resolvedSearch, context.workspacePaths)) {
              const workspaceList = context.workspacePaths.join(", ");
              return {
                content: `Access denied: path "${resolvedSearch}" is outside the workspace. Use a path within the workspace: ${workspaceList}`,
                isError: true
              };
            }
          }
        }
        const validationError = tool.validate(normalizedInput);
        if (validationError) {
          return {
            content: this.formatValidationError(validationError, normalizedInput, context),
            isError: true,
            metadata: { validationError, normalizedInput }
          };
        }
        const permitted = await this.permissionManager.check(tool, normalizedInput, context, toolId);
        if (!permitted) {
          this.eventBus.emit("permission_denied", { toolName, toolId });
          return { content: "Permission denied by user.", isError: true };
        }
        this.eventBus.emit("tool_call_start", { toolName, toolId, input: normalizedInput });
        const executionContext = {
          ...context,
          eventBus: this.eventBus,
          onProgress: (message) => {
            context.onProgress?.(message);
            this.eventBus.emit("tool_call_progress", {
              sessionId: context.sessionId,
              toolName,
              toolId,
              message
            });
          }
        };
        let result;
        try {
          result = await tool.execute(normalizedInput, executionContext);
        } catch (error) {
          result = {
            content: `Tool execution error: ${error.message}`,
            isError: true
          };
        }
        if (!result.isError && typeof result.content === "string" && this.outputFilters.length > 0) {
          result = { ...result, content: this.applyOutputFilters(toolName, result.content) };
        }
        if (this.autoLintFix && !result.isError && LINT_ELIGIBLE_TOOLS.has(toolName)) {
          try {
            const lintReg = this.registry.get("LintFix");
            if (lintReg?.enabled) {
              const filePath = normalizedInput.file_path;
              if (filePath) {
                await lintReg.tool.execute({ file_path: filePath, fix: true }, executionContext);
              }
            }
          } catch {
          }
        }
        this.eventBus.emit("tool_call_end", { toolName, toolId, result });
        return result;
      }
      normalizeInput(toolName, input, context) {
        const normalized = { ...input };
        if (typeof normalized._raw === "string") {
          try {
            const parsed = JSON.parse(normalized._raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              Object.assign(normalized, parsed);
            }
          } catch {
            const extractedPath = this.extractAbsolutePath(normalized._raw);
            if (extractedPath && typeof normalized.file_path !== "string") {
              normalized.file_path = extractedPath;
            }
          }
        }
        if (FILE_PATH_TOOLS.has(toolName)) {
          const candidatePath = this.normalizeFilePath(
            normalized.file_path ?? normalized.path,
            context.cwd
          );
          if (candidatePath) {
            normalized.file_path = candidatePath;
          }
          delete normalized.path;
        }
        if (toolName === "MultiFileEdit" && Array.isArray(normalized.edits)) {
          normalized.edits = normalized.edits.map((edit) => {
            if (!edit || typeof edit !== "object") {
              return edit;
            }
            const normalizedEdit = { ...edit };
            const candidatePath = this.normalizeFilePath(
              normalizedEdit.file_path ?? normalizedEdit.path,
              context.cwd
            );
            if (candidatePath) {
              normalizedEdit.file_path = candidatePath;
            }
            delete normalizedEdit.path;
            return normalizedEdit;
          });
        }
        return normalized;
      }
      normalizeFilePath(value, cwd) {
        if (typeof value !== "string") {
          return void 0;
        }
        const trimmed = value.trim().replace(/^["'`]|["'`]$/g, "");
        if (!trimmed) {
          return void 0;
        }
        return path39.isAbsolute(trimmed) ? trimmed : path39.resolve(cwd, trimmed);
      }
      extractAbsolutePath(raw) {
        const match = raw.match(/(?:\/|[A-Za-z]:[\\/])[^"'`\s]+/);
        return match?.[0];
      }
      formatValidationError(validationError, input, context) {
        const filePath = typeof input.file_path === "string" ? input.file_path : typeof input.path === "string" ? input.path : void 0;
        if (filePath) {
          return `Validation error: ${validationError} (resolved file_path: ${filePath}, cwd: ${context.cwd})`;
        }
        return `Validation error: ${validationError}`;
      }
    };
  }
});

// src/core/agent.ts
function enhanceErrorMessage(error, model) {
  const message = error.message || "";
  const lowerMsg = message.toLowerCase();
  const context = model ? `[Model: ${model}] ` : "";
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests") || lowerMsg.includes("overload")) {
    return `${context}${message}. Suggestion: Wait a moment and try again, or switch to a different model.`;
  }
  if (lowerMsg.includes("unauthorized") || lowerMsg.includes("api key") || lowerMsg.includes("authentication")) {
    return `${context}${message}. Suggestion: Check your API key in Settings > Providers.`;
  }
  if (lowerMsg.includes("model") && (lowerMsg.includes("not found") || lowerMsg.includes("not supported"))) {
    return `${context}${message}. Suggestion: Try a different model in Settings > Providers.`;
  }
  if (lowerMsg.includes("context length") || lowerMsg.includes("token") && lowerMsg.includes("exceed")) {
    return `${context}${message}. Suggestion: Try clearing conversation history or use a model with larger context window.`;
  }
  if (lowerMsg.includes("network") || lowerMsg.includes("connection") || lowerMsg.includes("timeout")) {
    return `${context}${message}. Suggestion: Check your internet connection and try again.`;
  }
  if (message.includes("tool_use.id") || message.includes("String should match pattern")) {
    return `${context}${message}. Suggestion: The conversation history contains tool call IDs from a previous model that are incompatible with this provider. Start a new conversation to resolve this.`;
  }
  return `${context}${message}`;
}
function truncateToolResults(messages, maxChars = 6e3) {
  return messages.map((msg) => {
    if (msg.role !== "user")
      return msg;
    const blocks = Array.isArray(msg.content) ? msg.content : null;
    if (!blocks)
      return msg;
    const truncated = blocks.map((block) => {
      if (block.type !== "tool_result")
        return block;
      const tr = block;
      const content = typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content);
      if (content.length <= maxChars)
        return block;
      const head = content.slice(0, 4e3);
      const tail = content.slice(-2e3);
      const removed = content.length - maxChars;
      return { ...tr, content: `${head}
...[truncated ${removed} chars]...
${tail}` };
    });
    return { ...msg, content: truncated };
  });
}
var AgentImpl;
var init_agent = __esm({
  "src/core/agent.ts"() {
    "use strict";
    init_message_types();
    init_constants();
    AgentImpl = class _AgentImpl {
      id;
      config;
      _messages = [];
      abortController = new AbortController();
      toolRunner;
      costTracker;
      constructor(config, toolRunner, costTracker, existingMessages) {
        this.id = crypto.randomUUID();
        this.config = config;
        this._messages = existingMessages || [];
        this.toolRunner = toolRunner;
        this.costTracker = costTracker;
      }
      get messages() {
        return [...this._messages];
      }
      async *run(userMessage) {
        if (this.config.limitCheck) {
          const limitResult = await this.config.limitCheck.check();
          if (!limitResult.allowed) {
            yield {
              type: "error",
              error: new Error(`Monthly spend limit exceeded (${limitResult.percentage.toFixed(0)}%). Please increase your limit or try again next month.`)
            };
            return;
          }
          if (limitResult.warning) {
            yield {
              type: "cost_update",
              totalCost: 0,
              turnCost: 0
            };
          }
        }
        {
          let cutAt = -1;
          for (let i = 0; i < this._messages.length; i++) {
            const msg = this._messages[i];
            if (msg.role !== "assistant")
              continue;
            const toolCalls = getToolUseBlocks(msg);
            if (toolCalls.length === 0)
              continue;
            const next = this._messages[i + 1];
            if (next?.role === "user") {
              const resultIds = new Set(getToolResultBlocks(next).map((r) => r.toolUseId));
              if (toolCalls.every((tc) => resultIds.has(tc.id)))
                continue;
            }
            cutAt = i;
            break;
          }
          if (cutAt >= 0) {
            this._messages = this._messages.slice(0, cutAt);
          }
        }
        const userMsg = {
          id: crypto.randomUUID(),
          role: "user",
          content: userMessage,
          timestamp: Date.now()
        };
        this._messages.push(userMsg);
        let turns = 0;
        const maxTurns = this.config.maxTurns !== void 0 ? this.config.maxTurns : 50;
        while (maxTurns === null || turns < maxTurns) {
          turns++;
          const modelInfo = this.config.provider.getModelInfo(this.config.model);
          const modelMaxContext = modelInfo?.capabilities?.maxContextWindow;
          const modelMaxOutput = modelInfo?.capabilities?.maxOutputTokens ?? 8192;
          const modelEffectiveLimit = modelMaxContext ? modelMaxContext - modelMaxOutput : void 0;
          try {
            const currentTokens = await this.getTokenCount();
            const thresholdValue = this.config.contextCompressionThreshold ?? CONTEXT_COMPRESSION_THRESHOLD;
            const exceedsModelLimit = modelEffectiveLimit !== void 0 && currentTokens > modelEffectiveLimit * thresholdValue;
            if (exceedsModelLimit) {
              const before = currentTokens;
              await this.compressContext();
              const originalKeep = this.config.contextRecentMessagesToKeep ?? RECENT_MESSAGES_TO_KEEP;
              let retries = 0;
              while (retries < 2) {
                const afterTokens = await this.getTokenCount();
                if (afterTokens <= modelEffectiveLimit * 0.95)
                  break;
                this.config.contextRecentMessagesToKeep = Math.max(2, originalKeep - 2 * (retries + 1));
                await this.compressContext();
                retries++;
              }
              this.config.contextRecentMessagesToKeep = originalKeep;
              const after = await this.getTokenCount();
              yield {
                type: "context_compressed",
                removedTokens: before - after,
                remainingTokens: after
              };
            }
          } catch {
          }
          const tools = this.config.tools.filter((t) => t.enabled).map((t) => ({
            name: t.tool.name,
            description: t.tool.description,
            inputSchema: t.tool.inputSchema
          }));
          const thinkingConfig = this.config.thinking?.enabled && modelInfo?.capabilities.extendedThinking ? this.config.thinking : void 0;
          console.log("[AgentImpl:run] Thinking configuration:", {
            model: this.config.model,
            provider: this.config.provider.name,
            configThinkingEnabled: this.config.thinking?.enabled,
            modelSupportsExtendedThinking: modelInfo?.capabilities.extendedThinking,
            thinkingConfigWillBeSent: !!thinkingConfig,
            thinkingBudgetTokens: thinkingConfig?.budgetTokens,
            modelInfoFound: !!modelInfo,
            modelId: modelInfo?.id,
            modelAliases: modelInfo?.aliases
          });
          const request2 = {
            messages: this._messages,
            model: this.config.model,
            systemPrompt: this.config.systemPrompt,
            tools: tools.length > 0 ? tools : void 0,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            stream: true,
            thinking: thinkingConfig
          };
          console.log("[AgentImpl:run] Sending request to provider:", {
            provider: this.config.provider.name,
            model: this.config.model,
            hasThinkingConfig: !!thinkingConfig,
            messageCount: this._messages.length,
            messages: this._messages.map((m) => ({
              id: m.id,
              role: m.role,
              contentType: typeof m.content,
              hasContentBlocks: Array.isArray(m.content),
              contentBlocksTypes: Array.isArray(m.content) ? m.content.map((c) => c.type).join(", ") : "N/A"
            }))
          });
          const assistantContent = [];
          let textBuffer = "";
          let thinkingBuffer = "";
          const toolCallBuffers = /* @__PURE__ */ new Map();
          let activeToolId;
          const usage = { inputTokens: 0, outputTokens: 0 };
          let hasToolCalls = false;
          try {
            for await (const delta of this.config.provider.streamComplete(request2)) {
              if (this.abortController.signal.aborted)
                break;
              yield { type: "stream_delta", delta };
              switch (delta.type) {
                case "text":
                  textBuffer += delta.text || "";
                  break;
                case "thinking":
                  thinkingBuffer += delta.text || "";
                  console.log(`[AgentImpl:run] Received thinking delta, buffer length now: ${thinkingBuffer.length}`);
                  yield { type: "thinking_delta", text: delta.text || "", accumulated: thinkingBuffer };
                  break;
                case "tool_use_start":
                  if (delta.toolUse?.id && delta.toolUse?.name) {
                    activeToolId = delta.toolUse.id;
                    toolCallBuffers.set(delta.toolUse.id, {
                      id: delta.toolUse.id,
                      name: delta.toolUse.name,
                      inputJson: ""
                    });
                    hasToolCalls = true;
                  }
                  break;
                case "tool_use_delta":
                  {
                    const targetToolId = delta.toolUse?.id || activeToolId;
                    if (!targetToolId || !delta.toolUse?.inputDelta) {
                      break;
                    }
                    const buf = toolCallBuffers.get(targetToolId);
                    if (buf) {
                      buf.inputJson += delta.toolUse.inputDelta;
                    }
                  }
                  break;
                case "tool_use_end":
                  if (delta.toolUse?.id) {
                    if (activeToolId === delta.toolUse.id) {
                      activeToolId = void 0;
                    }
                  } else {
                    activeToolId = void 0;
                  }
                  break;
                case "usage":
                  if (delta.usage) {
                    usage.inputTokens += delta.usage.inputTokens;
                    usage.outputTokens += delta.usage.outputTokens;
                    if (delta.usage.cacheReadTokens) {
                      usage.cacheReadTokens = (usage.cacheReadTokens || 0) + delta.usage.cacheReadTokens;
                    }
                    if (delta.usage.cacheWriteTokens) {
                      usage.cacheWriteTokens = (usage.cacheWriteTokens || 0) + delta.usage.cacheWriteTokens;
                    }
                  }
                  break;
                case "error": {
                  const streamError = delta.error || new Error("Unknown streaming error");
                  const enhancedMessage = enhanceErrorMessage(streamError, this.config.model);
                  yield { type: "error", error: new Error(enhancedMessage) };
                  return;
                }
              }
            }
          } catch (error) {
            const errorMessage = error?.message || String(error);
            console.error("[AgentImpl:run] Stream error:", errorMessage);
            if (thinkingConfig && errorMessage.includes("thinking is not supported")) {
              console.log("[AgentImpl:run] Model does not support thinking, retrying without thinking configuration...");
              const retryRequest = {
                ...request2,
                thinking: void 0
              };
              try {
                for await (const delta of this.config.provider.streamComplete(retryRequest)) {
                  if (this.abortController.signal.aborted)
                    break;
                  yield { type: "stream_delta", delta };
                  switch (delta.type) {
                    case "text":
                      textBuffer += delta.text || "";
                      break;
                    case "tool_use_start":
                      if (delta.toolUse?.id && delta.toolUse?.name) {
                        activeToolId = delta.toolUse.id;
                        toolCallBuffers.set(delta.toolUse.id, {
                          id: delta.toolUse.id,
                          name: delta.toolUse.name,
                          inputJson: ""
                        });
                        hasToolCalls = true;
                      }
                      break;
                    case "tool_use_delta":
                      {
                        const targetToolId = delta.toolUse?.id || activeToolId;
                        if (!targetToolId || !delta.toolUse?.inputDelta) {
                          break;
                        }
                        const buf = toolCallBuffers.get(targetToolId);
                        if (buf) {
                          buf.inputJson += delta.toolUse.inputDelta;
                        }
                      }
                      break;
                    case "tool_use_end":
                      if (activeToolId) {
                        activeToolId = void 0;
                      }
                      break;
                    case "usage":
                      if (delta.usage) {
                        usage.inputTokens += delta.usage.inputTokens || 0;
                        usage.outputTokens += delta.usage.outputTokens || 0;
                      }
                      break;
                    case "error": {
                      const streamError = delta.error || new Error("Unknown streaming error");
                      const enhancedMessage = enhanceErrorMessage(streamError, this.config.model);
                      yield { type: "error", error: new Error(enhancedMessage) };
                      return;
                    }
                  }
                }
              } catch (retryError) {
                const enhancedMessage = enhanceErrorMessage(retryError, this.config.model);
                yield { type: "error", error: new Error(enhancedMessage) };
                return;
              }
            } else {
              const enhancedMessage = enhanceErrorMessage(error, this.config.model);
              yield { type: "error", error: new Error(enhancedMessage) };
              return;
            }
          }
          if (textBuffer) {
            assistantContent.push({ type: "text", text: textBuffer });
          }
          const toolCalls = [];
          for (const [, buf] of toolCallBuffers) {
            let parsedInput = {};
            try {
              parsedInput = buf.inputJson ? JSON.parse(buf.inputJson) : {};
            } catch {
              parsedInput = { _raw: buf.inputJson };
            }
            const toolUse = {
              type: "tool_use",
              id: buf.id,
              name: buf.name,
              input: parsedInput
            };
            assistantContent.push(toolUse);
            toolCalls.push(toolUse);
          }
          const assistantMsg = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent.length === 1 && assistantContent[0].type === "text" ? assistantContent[0].text : assistantContent,
            timestamp: Date.now(),
            ...thinkingBuffer ? { reasoning: thinkingBuffer } : {},
            metadata: {
              model: this.config.model,
              provider: this.config.provider.name,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              cacheReadTokens: usage.cacheReadTokens,
              cacheWriteTokens: usage.cacheWriteTokens,
              stopReason: hasToolCalls ? "tool_use" : "end_turn"
            }
          };
          this._messages.push(assistantMsg);
          console.log("[AgentImpl:run] Turn complete:", {
            messageId: assistantMsg.id,
            hasReasoning: !!thinkingBuffer,
            reasoningLength: thinkingBuffer?.length || 0,
            hasToolCalls,
            contentLength: typeof assistantMsg.content === "string" ? assistantMsg.content.length : JSON.stringify(assistantMsg.content).length
          });
          const turnCost = this.costTracker.calculateCost(this.config.model, usage);
          yield { type: "cost_update", totalCost: this.costTracker.totalCost, turnCost };
          yield { type: "turn_complete", message: assistantMsg };
          if (toolCalls.length === 0) {
            break;
          }
          const toolResultBlocks = [];
          let toolExecutionAborted = false;
          for (const toolCall of toolCalls) {
            yield {
              type: "tool_call_start",
              toolName: toolCall.name,
              toolId: toolCall.id,
              input: toolCall.input
            };
            let result;
            try {
              result = await this.toolRunner.execute(
                toolCall.name,
                toolCall.id,
                toolCall.input,
                {
                  cwd: this.config.cwd || process.cwd(),
                  workspacePaths: this.config.workspacePaths,
                  sessionId: this.id,
                  abortSignal: this.abortController.signal,
                  eventBus: this.toolRunner.getEventBus(),
                  spawnSubAgent: async (task) => {
                    const subAgent = this.spawnSubAgent({});
                    let subResult = "";
                    for await (const event of subAgent.run(task)) {
                      if (event.type === "turn_complete") {
                        subResult = getTextContent(event.message);
                      }
                    }
                    return subResult;
                  }
                }
              );
            } catch (execError) {
              const isAborted = this.abortController.signal.aborted;
              result = {
                content: isAborted ? "[Tool execution interrupted by user]" : `[Tool execution error: ${execError?.message ?? String(execError)}]`,
                isError: true
              };
              if (isAborted)
                toolExecutionAborted = true;
            }
            yield {
              type: "tool_call_end",
              toolName: toolCall.name,
              toolId: toolCall.id,
              result
            };
            const resultContent = result.contentBlocks ? [
              ...result.content ? [{ type: "text", text: result.content }] : [],
              ...result.contentBlocks
            ] : result.content;
            toolResultBlocks.push({
              type: "tool_result",
              toolUseId: toolCall.id,
              content: resultContent,
              isError: result.isError
            });
            if (toolExecutionAborted)
              break;
          }
          const toolResultMsg = {
            id: crypto.randomUUID(),
            role: "user",
            content: toolResultBlocks,
            timestamp: Date.now()
          };
          this._messages.push(toolResultMsg);
          yield { type: "tool_results_complete", message: toolResultMsg };
          if (toolExecutionAborted)
            break;
        }
        if (maxTurns !== null && turns >= maxTurns) {
          yield {
            type: "error",
            error: new Error(`Agent reached maximum turns (${maxTurns}). Stopping.`)
          };
        }
      }
      addMessage(message) {
        this._messages.push(message);
      }
      restoreHistory(messages) {
        this._messages = [...messages];
      }
      async compressContext() {
        const recentMessagesToKeep = this.config.contextRecentMessagesToKeep ?? RECENT_MESSAGES_TO_KEEP;
        const minMessagesBeforeCompress = recentMessagesToKeep + 4;
        if (this._messages.length <= minMessagesBeforeCompress) {
          this._messages = truncateToolResults(this._messages);
          return;
        }
        const firstMsg = this._messages[0];
        let keepFrom = this._messages.length - recentMessagesToKeep;
        if (keepFrom < 1)
          keepFrom = 1;
        while (keepFrom > 1) {
          const candidate = this._messages[keepFrom];
          if (candidate.role === "user" && getToolResultBlocks(candidate).length > 0) {
            keepFrom--;
          } else {
            break;
          }
        }
        while (keepFrom > 1) {
          const retained = this._messages.slice(keepFrom);
          const toolCallIds = /* @__PURE__ */ new Set();
          for (const msg of retained) {
            if (msg.role === "assistant") {
              for (const tc of getToolUseBlocks(msg)) {
                toolCallIds.add(tc.id);
              }
            }
          }
          let orphanFound = false;
          for (const msg of retained) {
            if (msg.role === "user") {
              for (const tr of getToolResultBlocks(msg)) {
                if (!toolCallIds.has(tr.toolUseId)) {
                  orphanFound = true;
                  break;
                }
              }
            }
            if (orphanFound)
              break;
          }
          if (!orphanFound)
            break;
          keepFrom--;
        }
        const recentMessages = this._messages.slice(keepFrom);
        const oldMessages = this._messages.slice(1, keepFrom);
        const removedCount = oldMessages.length;
        let summaryText = `[Context compressed: ${removedCount} messages removed. Keeping recent context.]`;
        try {
          const oldContent = oldMessages.map((m) => {
            const text = typeof m.content === "string" ? m.content : getTextContent(m);
            return `[${m.role}]: ${text.substring(0, 500)}`;
          }).join("\n");
          if (oldContent.length > 100) {
            const summaryRequest = {
              messages: [{
                id: crypto.randomUUID(),
                role: "user",
                content: `Summarize the following conversation context concisely, focusing on key decisions, files modified, and current task state. Keep it under 500 words:

${oldContent.substring(0, 8e3)}`,
                timestamp: Date.now()
              }],
              model: this.config.model,
              systemPrompt: "You are a conversation summarizer. Be concise and focus on actionable context.",
              temperature: 0.3,
              maxTokens: 1e3,
              stream: false
            };
            let responseText = "";
            for await (const delta of this.config.provider.streamComplete(summaryRequest)) {
              if (delta.type === "text" && delta.text) {
                responseText += delta.text;
              }
            }
            if (responseText.length > 50) {
              summaryText = `## Compressed Context Summary
${responseText}

[${removedCount} messages compressed into this summary]`;
            }
          }
        } catch {
        }
        const summaryMsg = {
          id: crypto.randomUUID(),
          role: "user",
          content: summaryText,
          timestamp: Date.now()
        };
        this._messages = [summaryMsg, ...truncateToolResults(recentMessages)];
      }
      async getTokenCount() {
        return this.config.provider.countTokens(this._messages, this.config.model);
      }
      abort() {
        this.abortController.abort();
      }
      spawnSubAgent(overrides) {
        const subConfig = {
          ...this.config,
          ...overrides,
          isSubAgent: true,
          parentAgentId: this.id
        };
        return new _AgentImpl(subConfig, this.toolRunner, this.costTracker);
      }
      updateConfig(updates) {
        Object.assign(this.config, updates);
      }
      clearMessages() {
        this._messages = [];
      }
    };
  }
});

// src/core/cost-tracker.ts
var CostTracker;
var init_cost_tracker = __esm({
  "src/core/cost-tracker.ts"() {
    "use strict";
    init_model_registry();
    CostTracker = class {
      _totalCost = 0;
      _totalInputTokens = 0;
      _totalOutputTokens = 0;
      turns = [];
      config;
      constructor(config = {}) {
        this.config = config;
      }
      get totalCost() {
        return this._totalCost;
      }
      get totalInputTokens() {
        return this._totalInputTokens;
      }
      get totalOutputTokens() {
        return this._totalOutputTokens;
      }
      get turnCount() {
        return this.turns.length;
      }
      calculateCost(modelId, usage, provider) {
        const model = findModelInfo(modelId);
        if (!model)
          return 0;
        const inputCost = usage.inputTokens / 1e6 * model.pricing.inputPerMillion;
        const outputCost = usage.outputTokens / 1e6 * model.pricing.outputPerMillion;
        let cacheCost = 0;
        if (usage.cacheReadTokens && model.pricing.cacheReadPerMillion) {
          cacheCost += usage.cacheReadTokens / 1e6 * model.pricing.cacheReadPerMillion;
        }
        if (usage.cacheWriteTokens && model.pricing.cacheWritePerMillion) {
          cacheCost += usage.cacheWriteTokens / 1e6 * model.pricing.cacheWritePerMillion;
        }
        const turnCost = inputCost + outputCost + cacheCost;
        this._totalCost += turnCost;
        this._totalInputTokens += usage.inputTokens;
        this._totalOutputTokens += usage.outputTokens;
        this.turns.push({ model: modelId, usage, cost: turnCost });
        if (this.config.onUsageRecorded) {
          const record = {
            timestamp: Date.now(),
            provider: provider || model.provider,
            model: modelId,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cost: turnCost,
            conversationId: this.config.conversationId
          };
          this.config.onUsageRecorded(record);
        }
        return turnCost;
      }
      getSummary() {
        return [
          `Total cost: $${this._totalCost.toFixed(4)}`,
          `Input tokens: ${this._totalInputTokens.toLocaleString()}`,
          `Output tokens: ${this._totalOutputTokens.toLocaleString()}`,
          `Turns: ${this.turns.length}`
        ].join(" | ");
      }
      reset() {
        this._totalCost = 0;
        this._totalInputTokens = 0;
        this._totalOutputTokens = 0;
        this.turns = [];
      }
      /**
       * Update configuration (e.g., to set conversation ID after creation)
       */
      updateConfig(config) {
        this.config = { ...this.config, ...config };
      }
    };
  }
});

// src/utils/event-bus.ts
var EventBus;
var init_event_bus = __esm({
  "src/utils/event-bus.ts"() {
    "use strict";
    EventBus = class {
      handlers = /* @__PURE__ */ new Map();
      on(event, handler) {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, /* @__PURE__ */ new Set());
        }
        this.handlers.get(event).add(handler);
        return () => this.off(event, handler);
      }
      off(event, handler) {
        this.handlers.get(event)?.delete(handler);
      }
      emit(event, ...args) {
        const handlers = this.handlers.get(event);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(...args);
            } catch (err) {
              console.error(`EventBus handler error for "${event}":`, err);
            }
          }
        }
      }
      once(event, handler) {
        const wrapper = (...args) => {
          this.off(event, wrapper);
          handler(...args);
        };
        return this.on(event, wrapper);
      }
      removeAllListeners(event) {
        if (event) {
          this.handlers.delete(event);
        } else {
          this.handlers.clear();
        }
      }
    };
  }
});

// src/config/rules-parser.ts
function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw.trim() };
  }
  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();
  const frontmatter = {};
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1)
      continue;
    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();
    if (rawValue === "true") {
      frontmatter[key] = true;
    } else if (rawValue === "false") {
      frontmatter[key] = false;
    } else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      frontmatter[key] = rawValue.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    } else {
      frontmatter[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
  return { frontmatter, body };
}
function parseRuleFrontmatter(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    frontmatter: {
      description: typeof frontmatter.description === "string" ? frontmatter.description : void 0,
      globs: Array.isArray(frontmatter.globs) ? frontmatter.globs : typeof frontmatter.globs === "string" ? frontmatter.globs : void 0,
      alwaysApply: typeof frontmatter.alwaysApply === "boolean" ? frontmatter.alwaysApply : void 0
    },
    body
  };
}
function parseSkillFrontmatter(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    name: typeof frontmatter.name === "string" ? frontmatter.name : void 0,
    description: typeof frontmatter.description === "string" ? frontmatter.description : void 0,
    body
  };
}
var FRONTMATTER_RE;
var init_rules_parser = __esm({
  "src/config/rules-parser.ts"() {
    "use strict";
    FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
  }
});

// main/rules-manager.ts
var fs39, path40, import_fast_glob4, import_minimatch, RULES_SUBDIR, STATE_FILE, RulesManager, rulesManager;
var init_rules_manager = __esm({
  "main/rules-manager.ts"() {
    "use strict";
    fs39 = __toESM(require("fs/promises"), 1);
    path40 = __toESM(require("path"), 1);
    import_fast_glob4 = require("fast-glob");
    import_minimatch = require("minimatch");
    init_rules_parser();
    RULES_SUBDIR = path40.join(".omnicode", "rules");
    STATE_FILE = path40.join(".omnicode", "rules-state.json");
    RulesManager = class {
      projectPath = "";
      rules = /* @__PURE__ */ new Map();
      async loadRules(projectPath) {
        this.projectPath = projectPath;
        const rulesDir = path40.join(projectPath, RULES_SUBDIR);
        const disabledIds = await this.loadDisabledState(projectPath);
        let files = [];
        try {
          await fs39.access(rulesDir);
          files = await (0, import_fast_glob4.glob)("**/*.mdc", { cwd: rulesDir, absolute: true });
        } catch {
          this.rules.clear();
          return;
        }
        this.rules.clear();
        for (const filePath of files) {
          const id = path40.basename(filePath, ".mdc");
          try {
            const raw = await fs39.readFile(filePath, "utf-8");
            const { frontmatter, body } = parseRuleFrontmatter(raw);
            this.rules.set(id, {
              id,
              filePath,
              frontmatter,
              content: body,
              enabled: !disabledIds.has(id)
            });
          } catch {
            continue;
          }
        }
        console.log(`[RulesManager] Loaded ${this.rules.size} rules from ${rulesDir}`);
      }
      getAllRules() {
        return Array.from(this.rules.values()).sort((a, b) => a.id.localeCompare(b.id));
      }
      getActiveRules(openFiles = []) {
        return Array.from(this.rules.values()).filter((rule) => {
          if (!rule.enabled)
            return false;
          if (rule.frontmatter.alwaysApply === true)
            return true;
          if (!rule.frontmatter.globs && rule.frontmatter.alwaysApply !== false)
            return true;
          if (rule.frontmatter.globs) {
            const globs = Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs : [rule.frontmatter.globs];
            return openFiles.some(
              (file) => globs.some((g) => (0, import_minimatch.minimatch)(path40.basename(file), g) || (0, import_minimatch.minimatch)(file, g))
            );
          }
          return false;
        });
      }
      buildRulesPrompt(openFiles = []) {
        const active = this.getActiveRules(openFiles);
        if (active.length === 0)
          return "";
        const parts = active.map((rule) => {
          const scopeNote = rule.frontmatter.globs ? ` (applies to: ${Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs.join(", ") : rule.frontmatter.globs})` : "";
          const header = rule.frontmatter.description ? `### ${rule.frontmatter.description}${scopeNote}` : `### ${rule.id}${scopeNote}`;
          return `${header}
${rule.content}`;
        });
        return `
## Project Rules

The following rules have been configured for this project. Follow them carefully.

${parts.join("\n\n")}`;
      }
      async toggleRule(id, enabled) {
        const rule = this.rules.get(id);
        if (!rule)
          return;
        rule.enabled = enabled;
        await this.saveDisabledState();
      }
      async saveRule(id, frontmatterRaw, body) {
        const rulesDir = path40.join(this.projectPath, RULES_SUBDIR);
        await fs39.mkdir(rulesDir, { recursive: true });
        const filePath = path40.join(rulesDir, `${id}.mdc`);
        const content = frontmatterRaw ? `${frontmatterRaw}
${body}` : body;
        await fs39.writeFile(filePath, content, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async saveRuleFile(id, fullContent) {
        const rulesDir = path40.join(this.projectPath, RULES_SUBDIR);
        await fs39.mkdir(rulesDir, { recursive: true });
        const filePath = path40.join(rulesDir, `${id}.mdc`);
        await fs39.writeFile(filePath, fullContent, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async deleteRule(id) {
        const rule = this.rules.get(id);
        if (!rule)
          return;
        await fs39.unlink(rule.filePath);
        this.rules.delete(id);
        await this.saveDisabledState();
      }
      getRulesDir() {
        return path40.join(this.projectPath, RULES_SUBDIR);
      }
      async loadDisabledState(projectPath) {
        try {
          const statePath = path40.join(projectPath, STATE_FILE);
          const raw = await fs39.readFile(statePath, "utf-8");
          const data = JSON.parse(raw);
          return new Set(Array.isArray(data.disabledRules) ? data.disabledRules : []);
        } catch {
          return /* @__PURE__ */ new Set();
        }
      }
      async saveDisabledState() {
        if (!this.projectPath)
          return;
        const disabled = Array.from(this.rules.values()).filter((r) => !r.enabled).map((r) => r.id);
        const statePath = path40.join(this.projectPath, STATE_FILE);
        await fs39.mkdir(path40.dirname(statePath), { recursive: true });
        await fs39.writeFile(statePath, JSON.stringify({ disabledRules: disabled }, null, 2), "utf-8");
      }
    };
    rulesManager = new RulesManager();
  }
});

// main/skills-manager.ts
var fs40, path41, SKILLS_SUBDIR, SKILL_FILENAME, SkillsManager, skillsManager;
var init_skills_manager = __esm({
  "main/skills-manager.ts"() {
    "use strict";
    fs40 = __toESM(require("fs/promises"), 1);
    path41 = __toESM(require("path"), 1);
    init_rules_parser();
    SKILLS_SUBDIR = path41.join(".omnicode", "skills");
    SKILL_FILENAME = "SKILL.md";
    SkillsManager = class {
      projectPath = "";
      skills = /* @__PURE__ */ new Map();
      async loadSkills(projectPath) {
        this.projectPath = projectPath;
        const skillsDir = path41.join(projectPath, SKILLS_SUBDIR);
        let entries = [];
        try {
          await fs40.access(skillsDir);
          entries = await fs40.readdir(skillsDir, { withFileTypes: true });
        } catch {
          this.skills.clear();
          return;
        }
        this.skills.clear();
        for (const entry of entries) {
          if (!entry.isDirectory())
            continue;
          const skillId = entry.name;
          const skillFile = path41.join(skillsDir, skillId, SKILL_FILENAME);
          try {
            await fs40.access(skillFile);
            const raw = await fs40.readFile(skillFile, "utf-8");
            const { name, description, body } = parseSkillFrontmatter(raw);
            this.skills.set(skillId, {
              id: skillId,
              dirPath: path41.join(skillsDir, skillId),
              filePath: skillFile,
              name: name || skillId,
              description: description || "",
              content: raw,
              enabled: true
            });
          } catch {
            continue;
          }
        }
        console.log(`[SkillsManager] Loaded ${this.skills.size} skills from ${skillsDir}`);
      }
      getAllSkills() {
        return Array.from(this.skills.values()).sort((a, b) => a.name.localeCompare(b.name));
      }
      getSkill(id) {
        return this.skills.get(id);
      }
      buildSkillsPrompt() {
        const all = this.getAllSkills();
        if (all.length === 0)
          return "";
        const lines = all.map((skill) => {
          const desc = skill.description ? ` \u2014 ${skill.description}` : "";
          return `- **${skill.name}** (\`${skill.filePath}\`)${desc}`;
        });
        return `
## Available Skills

The following agent skills are available. When a skill is relevant, read its SKILL.md file for detailed instructions.

${lines.join("\n")}`;
      }
      async saveSkill(id, content) {
        const skillDir = path41.join(this.projectPath, SKILLS_SUBDIR, id);
        await fs40.mkdir(skillDir, { recursive: true });
        const filePath = path41.join(skillDir, SKILL_FILENAME);
        await fs40.writeFile(filePath, content, "utf-8");
        await this.loadSkills(this.projectPath);
      }
      async deleteSkill(id) {
        const skill = this.skills.get(id);
        if (!skill)
          return;
        await fs40.rm(skill.dirPath, { recursive: true, force: true });
        this.skills.delete(id);
      }
      getSkillsDir() {
        return path41.join(this.projectPath, SKILLS_SUBDIR);
      }
    };
    skillsManager = new SkillsManager();
  }
});

// main/addon-loader.ts
function getSystemPromptFragments() {
  return systemPromptFragments;
}
function getToolOutputFilters() {
  return toolOutputFilters;
}
function getAddonsDir() {
  return path42.join(import_electron12.app.getPath("userData"), "addons");
}
async function loadInstalledAddons(toolRegistry) {
  systemPromptFragments.length = 0;
  toolOutputFilters.length = 0;
  const addonsDir = getAddonsDir();
  try {
    await fs41.mkdir(addonsDir, { recursive: true });
    const entries = await fs41.readdir(addonsDir, { withFileTypes: true });
    for (const entry of entries.filter((e) => e.isDirectory())) {
      await loadAddon(entry.name, path42.join(addonsDir, entry.name), toolRegistry);
    }
  } catch (err) {
    console.error("[AddonLoader] Failed to scan addons directory:", err);
  }
  const toolNames = toolRegistry.getAll().filter((r) => r.source === "plugin").map((r) => r.tool.name);
  console.log(
    `[AddonLoader] Load complete \u2014 ${toolNames.length} plugin tool(s): [${toolNames.join(", ") || "none"}] | ${systemPromptFragments.length} prompt fragment(s) | ${toolOutputFilters.length} output filter(s)`
  );
}
async function loadAddon(id, addonDir, toolRegistry) {
  const previousModule = loadedAddonModules.get(id);
  if (previousModule?.deactivate) {
    try {
      previousModule.deactivate();
    } catch (err) {
      console.warn(`[AddonLoader] deactivate() threw for addon "${id}":`, err);
    }
  }
  loadedAddonModules.delete(id);
  const previousTools = addonToolNames.get(id) ?? [];
  for (const name of previousTools) {
    try {
      toolRegistry.unregister(name);
    } catch {
    }
  }
  addonToolNames.delete(id);
  try {
    const manifestPath = path42.join(addonDir, "manifest.json");
    const manifestRaw = await fs41.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestRaw);
    const entrypointRelative = manifest.entrypoint ?? "index.js";
    const entrypoint = path42.resolve(addonDir, entrypointRelative);
    try {
      const resolved = require.resolve(entrypoint);
      delete require.cache[resolved];
    } catch {
    }
    const addon = require(entrypoint);
    const registered = [];
    const context = {
      registerTool(tool) {
        if (toolRegistry.get(tool.name)) {
          toolRegistry.unregister(tool.name);
        }
        toolRegistry.register(tool, "plugin");
        registered.push(tool.name);
      },
      registerSystemPromptFragment(fragment) {
        if (fragment && fragment.trim()) {
          systemPromptFragments.push(fragment.trim());
          console.log(`[AddonLoader] "${id}" registered a system prompt fragment (${fragment.trim().length} chars)`);
        }
      },
      registerToolOutputFilter(filter) {
        if (typeof filter === "function") {
          toolOutputFilters.push(filter);
          console.log(`[AddonLoader] "${id}" registered a tool output filter`);
        }
      }
    };
    addon.activate(context);
    addonToolNames.set(id, registered);
    loadedAddonModules.set(id, addon);
    const label = manifest.name ? `"${manifest.name}" (${id})` : `"${id}"`;
    console.log(`[AddonLoader] Loaded addon ${label} v${manifest.version ?? "?"} \u2014 tools: [${registered.join(", ")}]`);
  } catch (err) {
    console.error(`[AddonLoader] Failed to load addon "${id}":`, err);
  }
}
var fs41, path42, import_electron12, systemPromptFragments, toolOutputFilters, addonToolNames, loadedAddonModules;
var init_addon_loader = __esm({
  "main/addon-loader.ts"() {
    "use strict";
    fs41 = __toESM(require("fs/promises"), 1);
    path42 = __toESM(require("path"), 1);
    import_electron12 = require("electron");
    systemPromptFragments = [];
    toolOutputFilters = [];
    addonToolNames = /* @__PURE__ */ new Map();
    loadedAddonModules = /* @__PURE__ */ new Map();
  }
});

// main/core-integration.ts
var core_integration_exports = {};
__export(core_integration_exports, {
  clearWorkspaceContext: () => clearWorkspaceContext,
  getProviderRegistry: () => getProviderRegistry,
  getWorkingDirectory: () => getWorkingDirectory,
  getWorkingDirectoryForConversation: () => getWorkingDirectoryForConversation,
  initializeCore: () => initializeCore,
  isCoreInitialized: () => isCoreInitialized,
  refreshSystemPrompt: () => refreshSystemPrompt,
  reinitializeProviders: () => reinitializeProviders2,
  reloadAddons: () => reloadAddons,
  rulesManager: () => rulesManager,
  setPermissionMode: () => setPermissionMode,
  setWorkingDirectory: () => setWorkingDirectory2,
  setWorkingDirectoryForWindow: () => setWorkingDirectoryForWindow,
  setWorkspaceContext: () => setWorkspaceContext,
  skillsManager: () => skillsManager
});
module.exports = __toCommonJS(core_integration_exports);
function toPermissionMode(autoRunMode) {
  if (autoRunMode === "ask")
    return "ask";
  if (autoRunMode === "never")
    return "deny-all";
  return "auto-allow";
}
function setPermissionMode(autoRunMode) {
  if (permissionManager) {
    permissionManager.setMode(toPermissionMode(autoRunMode));
  }
}
function buildAddonPromptSection() {
  const fragments = getSystemPromptFragments();
  if (fragments.length === 0)
    return "";
  return "\n\n" + fragments.join("\n\n");
}
function buildSystemPrompt(cwd, workspaceName, workspaceFolders) {
  const rulesSection = rulesManager.buildRulesPrompt();
  const skillsSection = skillsManager.buildSkillsPrompt();
  let workingDirectorySection;
  if (workspaceFolders && workspaceFolders.length > 1) {
    const folderList = workspaceFolders.map((f) => {
      const name = f.name || path43.basename(f.path);
      const isActive = f.path === cwd;
      return `- ${name}: ${f.path}${isActive ? " (active)" : ""}`;
    }).join("\n");
    workingDirectorySection = `## Workspace: ${workspaceName || "Multi-folder Workspace"}
This is a multi-folder workspace containing ${workspaceFolders.length} projects:
${folderList}

The currently active folder is: ${cwd}

## File System Boundaries \u2014 CRITICAL
Your file access is STRICTLY CONFINED to the workspace folders listed above.
- NEVER search, read, list, or explore any path outside the workspace folders above.
- NEVER use "/" (filesystem root), "~" (home directory), or any other path that is not under one of the listed workspace folders.
- When creating a new project or file, always create it INSIDE the active workspace folder (${cwd}).
- If a task seems to require going outside the workspace, stop and ask the user to open the relevant folder in the workspace first.
- File operations and searches default to the active folder (${cwd}) unless the user explicitly requests a different workspace folder from the list above.`;
  } else {
    workingDirectorySection = `## Working Directory
The user's current working directory is: ${cwd}

## File System Boundaries \u2014 CRITICAL
Your file access is STRICTLY CONFINED to the workspace directory: ${cwd}
- NEVER search, read, list, or explore any path outside ${cwd}.
- NEVER use "/" (filesystem root), "~" (home directory), or any path that is not under ${cwd}.
- When creating a new project or file, always create it INSIDE ${cwd}.
- If a task seems to require going outside the workspace, stop and ask the user to open the relevant folder first.
- All file operations and searches must use ${cwd} or a subdirectory within it as the root.`;
  }
  return `You are omni-code, a powerful AI coding assistant running in the Electron GUI.
You help users with software engineering tasks: writing code, debugging, refactoring, explaining code, and more.

You have access to tools for reading/writing files, searching codebases, running shell commands, and more.
Use these tools to accomplish tasks effectively and autonomously \u2014 do not stop after writing files and tell the user to run things themselves.

## Core Guidelines
- Read files before modifying them to understand existing patterns
- Prefer editing existing files over creating new ones
- Use Glob and Grep for searching the codebase
- Use Bash for running commands, tests, and builds
- Be concise in your responses
- Ask for clarification when requirements are ambiguous

## Web Search
- Use SearchWeb to find packages, API references, documentation, and examples.
  Prefer it over guessing when you need: package names, correct API shapes, CLI flags, configuration options, or explanations for errors.
- Use WebFetch to read a specific documentation URL, README, or changelog.
- Use HTTPClient to probe API endpoints or health-check a running service.
- Search before inventing: if you are unsure of a library's API or a tool's flags, search rather than guessing.

## Verifying Projects Work
After scaffolding a new project or making significant changes, always verify it works end-to-end:

1. Install dependencies \u2014 use DependencyManager or Bash (npm install / pip install / cargo build / etc.)
2. Build \u2014 run the build command with Bash (npm run build, tsc, cargo build, etc.) and read any errors carefully.
   If the build fails, fix the errors and rebuild before moving on.
3. Start the dev server \u2014 use ProcessManager.start with the dev command (e.g. "npm run dev").
4. Wait for readiness \u2014 use ProcessManager.wait_url to poll until the server responds (e.g. "http://localhost:3000").
5. Visual verification \u2014 use Browser.navigate followed by Browser.screenshot to confirm the UI renders correctly.
   If Puppeteer is not installed, skip this step and note it to the user.
6. API verification \u2014 use HTTPClient to probe key API endpoints and confirm responses are correct.
7. Run tests \u2014 use RunTests if a test script or test framework config is present.

Do NOT hand off to the user after writing files. Run the project, observe the result, fix any issues, and confirm it works before finishing.

${workingDirectorySection}
${rulesSection}${skillsSection}${buildAddonPromptSection()}`;
}
async function setWorkingDirectory2(cwd) {
  currentWorkingDirectory = cwd;
  console.log("Working directory updated to:", cwd);
  await Promise.all([
    rulesManager.loadRules(cwd),
    skillsManager.loadSkills(cwd)
  ]);
  const newSystemPrompt = buildSystemPrompt(cwd, currentWorkspaceName, currentWorkspaceFolders);
  const newWorkspacePaths = currentWorkspaceFolders?.map((f) => f.path) ?? [cwd];
  agentBridge.updateWorkspaceContext(cwd, newSystemPrompt, newWorkspacePaths);
  if (agentInstance) {
    agentInstance.updateConfig({
      systemPrompt: newSystemPrompt,
      cwd,
      workspacePaths: currentWorkspaceFolders?.map((f) => f.path) ?? [cwd]
    });
    console.log("Agent updated with new working directory:", cwd);
  }
}
async function setWorkingDirectoryForWindow(cwd, conversationIds) {
  console.log(`Working directory updated for window (${conversationIds.length} conversations):`, cwd);
  await Promise.all([
    rulesManager.loadRules(cwd),
    skillsManager.loadSkills(cwd)
  ]);
  const newSystemPrompt = buildSystemPrompt(cwd, currentWorkspaceName, currentWorkspaceFolders);
  const newWorkspacePaths = currentWorkspaceFolders?.map((f) => f.path) ?? [cwd];
  agentBridge.updateWorkspaceContextForConversations(cwd, newSystemPrompt, conversationIds, newWorkspacePaths);
}
async function setWorkspaceContext(activeFolderPath, workspaceName, folders, conversationIds) {
  currentWorkingDirectory = activeFolderPath;
  currentWorkspaceName = workspaceName;
  currentWorkspaceFolders = folders;
  console.log(`[WorkspaceContext] Setting workspace "${workspaceName}" with ${folders.length} folder(s), active: ${activeFolderPath}`);
  await Promise.all(
    folders.map((f) => Promise.all([
      rulesManager.loadRules(f.path),
      skillsManager.loadSkills(f.path)
    ]))
  );
  const newSystemPrompt = buildSystemPrompt(activeFolderPath, workspaceName, folders);
  const folderPaths = folders.map((f) => f.path);
  if (conversationIds && conversationIds.length > 0) {
    agentBridge.updateWorkspaceContextForConversations(activeFolderPath, newSystemPrompt, conversationIds, folderPaths);
  } else {
    agentBridge.updateWorkspaceContext(activeFolderPath, newSystemPrompt, folderPaths);
  }
  if (agentInstance) {
    agentInstance.updateConfig({
      systemPrompt: newSystemPrompt,
      cwd: activeFolderPath,
      workspacePaths: folders.map((f) => f.path)
    });
  }
}
function clearWorkspaceContext() {
  currentWorkspaceName = void 0;
  currentWorkspaceFolders = void 0;
  console.log("[WorkspaceContext] Cleared workspace context");
}
function refreshSystemPrompt() {
  const newSystemPrompt = buildSystemPrompt(currentWorkingDirectory, currentWorkspaceName, currentWorkspaceFolders);
  const refreshWorkspacePaths = currentWorkspaceFolders?.map((f) => f.path) ?? [currentWorkingDirectory];
  agentBridge.updateWorkspaceContext(currentWorkingDirectory, newSystemPrompt, refreshWorkspacePaths);
  if (agentInstance) {
    agentInstance.updateConfig({ systemPrompt: newSystemPrompt, workspacePaths: refreshWorkspacePaths });
  }
}
function getWorkingDirectory() {
  return currentWorkingDirectory;
}
function getWorkingDirectoryForConversation(conversationId) {
  return agentBridge.getWorkspacePathForConversation(conversationId) || currentWorkingDirectory;
}
async function initializeCore() {
  if (coreInitialized)
    return;
  try {
    console.log("Initializing omni-code core...");
    const config = new ConfigManager();
    const eventBus = new EventBus();
    providerRegistry = new ProviderRegistry();
    providerRegistry.register(new AnthropicProvider());
    providerRegistry.register(new OpenAIProvider());
    providerRegistry.register(new GoogleProvider());
    providerRegistry.register(new MistralProvider());
    providerRegistry.register(new GroqProvider());
    providerRegistry.register(new XAIProvider());
    providerRegistry.register(new BedrockProvider());
    providerRegistry.register(new MoonshotProvider());
    const customModels = settingsManager.get("customModels") || [];
    console.log(`[CoreIntegration] Found ${customModels.length} custom model endpoints`);
    for (const customEndpoint of customModels) {
      try {
        const endpointConfig = {
          baseUrl: customEndpoint.baseUrl,
          apiKey: customEndpoint.apiKey,
          models: customEndpoint.models.map((m) => m.id)
        };
        const customProvider = new OpenAICompatProvider(customEndpoint.id, endpointConfig);
        const uniqueProviderName = `custom-${customEndpoint.id}`;
        Object.defineProperty(customProvider, "name", {
          value: uniqueProviderName,
          writable: false,
          configurable: true
        });
        Object.defineProperty(customProvider, "displayName", {
          value: customEndpoint.name,
          writable: true,
          configurable: true
        });
        customProvider.models = customEndpoint.models.map((m) => ({
          id: `${customEndpoint.id}/${m.id}`,
          provider: uniqueProviderName,
          displayName: m.displayName,
          aliases: [m.id],
          capabilities: {
            streaming: m.capabilities.streaming,
            toolUse: m.capabilities.toolUse,
            vision: m.capabilities.vision,
            jsonMode: m.capabilities.jsonMode,
            systemPrompt: m.capabilities.systemPrompt,
            caching: false,
            extendedThinking: false,
            maxContextWindow: m.capabilities.maxContextWindow,
            maxOutputTokens: m.capabilities.maxOutputTokens
          },
          pricing: { inputPerMillion: 0, outputPerMillion: 0 }
        }));
        providerRegistry.register(customProvider);
        console.log(`[CoreIntegration] Registered custom endpoint: ${customEndpoint.name} (${uniqueProviderName}) with ${customEndpoint.models.length} models`);
      } catch (error) {
        console.error(`[CoreIntegration] Failed to register custom endpoint ${customEndpoint.id}:`, error);
      }
    }
    const providerConfigs = { ...config.get("providers") };
    const settingsApiKeys = {
      anthropic: "anthropic",
      openai: "openai",
      google: "google",
      mistral: "openai",
      // Mistral uses OpenAI-compatible API
      groq: "groq",
      xai: "xai",
      bedrock: "anthropic",
      // Bedrock uses AWS credentials
      moonshot: "moonshot"
    };
    const apiKeys = settingsManager.get("apiKeys");
    console.log("[CoreIntegration] API keys from settings:", Object.keys(apiKeys));
    console.log("[CoreIntegration] Moonshot key exists:", !!apiKeys["moonshot"]);
    console.log("[CoreIntegration] Moonshot key length:", apiKeys["moonshot"]?.length || 0);
    for (const [providerName, settingsKey] of Object.entries(settingsApiKeys)) {
      const apiKey = apiKeys[settingsKey];
      if (apiKey && typeof apiKey === "string" && apiKey.trim()) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: apiKey.trim()
        };
        console.log(`[CoreIntegration] Loaded API key for ${providerName} from settings`);
      } else {
        console.log(`[CoreIntegration] No API key found for ${providerName} in settings`);
      }
    }
    const envKeys = {
      ANTHROPIC_API_KEY: "anthropic",
      OPENAI_API_KEY: "openai",
      GOOGLE_API_KEY: "google",
      MISTRAL_API_KEY: "mistral",
      GROQ_API_KEY: "groq",
      XAI_API_KEY: "xai",
      AWS_ACCESS_KEY_ID: "bedrock",
      MOONSHOT_API_KEY: "moonshot"
    };
    for (const [envVar, providerName] of Object.entries(envKeys)) {
      if (process.env[envVar] && !providerConfigs[providerName]?.apiKey) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: process.env[envVar]
        };
      }
    }
    for (const customEndpoint of customModels) {
      providerConfigs[`custom-${customEndpoint.id}`] = {
        baseUrl: customEndpoint.baseUrl,
        apiKey: customEndpoint.apiKey
      };
    }
    console.log("[CoreIntegration] Initializing providers with configs:", Object.keys(providerConfigs));
    await providerRegistry.initializeAll(providerConfigs);
    const availableProviders = providerRegistry.getAvailable().map((p) => p.name);
    console.log("[CoreIntegration] Available providers after init:", availableProviders);
    const activeModels = config.get("activeModels") || [];
    const allModels = providerRegistry.getAllModels();
    let defaultModel;
    let defaultProvider;
    if (activeModels.length > 0) {
      const firstActiveId = activeModels[0];
      const resolved2 = providerRegistry.resolveModel(firstActiveId);
      defaultModel = resolved2?.model.id || firstActiveId;
      defaultProvider = resolved2?.provider.name || "openai";
    } else {
      const firstModel = allModels[0];
      defaultModel = firstModel?.id || "claude-sonnet-4-5";
      defaultProvider = firstModel?.provider || "anthropic";
    }
    const resolved = providerRegistry.resolveModel(defaultModel);
    const currentModel = resolved?.model.id || defaultModel;
    const currentProviderName = resolved?.provider.name || defaultProvider;
    const activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);
    if (!activeProvider || !activeProvider.isAvailable()) {
      console.warn(`Provider "${currentProviderName}" is not available.`);
    } else {
      console.log(`[CoreIntegration] Default provider "${currentProviderName}" is available`);
    }
    const toolRegistry = new ToolRegistry();
    registerBuiltinTools(toolRegistry);
    toolRegistryRef = toolRegistry;
    await loadInstalledAddons(toolRegistry);
    for (const toolName of config.get("disabledTools")) {
      toolRegistry.setEnabled(toolName, false);
    }
    permissionManager = new PermissionManager(
      "auto-allow",
      eventBus
    );
    eventBus.on("permission_request", (request2) => {
      if (!request2.toolId) {
        request2.onDeny();
        return;
      }
      agentBridge.requestPermission(
        request2.sessionId,
        request2.toolName,
        request2.toolId,
        request2.input,
        {
          onAllow: request2.onAllow,
          onDeny: request2.onDeny,
          onAllowAlways: request2.onAllowAlways
        }
      );
    });
    eventBus.on("tool_call_progress", (event) => {
      agentBridge.emitToolProgress(event.sessionId, event.toolName, event.toolId, event.message);
    });
    eventBus.on("user_input_request", (request2) => {
      agentBridge.requestUserInput(
        request2.sessionId,
        request2.requestId,
        request2.prompt,
        request2.terminalCommand,
        request2.waitForInput,
        request2.placeholder,
        {
          onResponse: request2.onResponse,
          onCancel: request2.onCancel
        }
      );
    });
    const { app: app6 } = await import("electron");
    const appRoot = path43.resolve(app6.getAppPath());
    const mainDir = path43.resolve(__dirname);
    const protectedAppPaths = [.../* @__PURE__ */ new Set([appRoot, mainDir])];
    const toolRunner = new ToolRunner(toolRegistry, permissionManager, eventBus, config.get("autoLintFix"), protectedAppPaths);
    toolRunnerRef = toolRunner;
    toolRunner.setOutputFilters([...getToolOutputFilters()]);
    const costTracker = new CostTracker();
    const systemPrompt = buildSystemPrompt(currentWorkingDirectory);
    setToolsRef({
      execute: async (toolName, input) => {
        const tool = toolRegistry.get(toolName);
        if (!tool)
          throw new Error(`Tool ${toolName} not found`);
        const result = await toolRunner.execute(
          toolName,
          crypto.randomUUID(),
          input,
          {
            cwd: currentWorkingDirectory,
            sessionId: "temp-session",
            planMode: false,
            abortSignal: new AbortController().signal,
            spawnSubAgent: async () => ""
          }
        );
        return result;
      },
      list: () => toolRegistry.getAll().map((t) => ({
        name: t.tool.name,
        description: t.tool.description,
        category: t.tool.category,
        permissionLevel: t.tool.permissionLevel
      }))
    });
    setConfigRef({
      get: (key) => config.get(key),
      set: (key, value) => config.set(key, value),
      getModels: () => {
        const allModels2 = providerRegistry.getAllModels();
        return allModels2.map((m) => {
          const provider = providerRegistry.getProvider(m.provider);
          return {
            id: m.id,
            name: m.displayName,
            provider: m.provider,
            available: provider?.isAvailable() || false,
            maxContextWindow: m.capabilities?.maxContextWindow
          };
        });
      },
      getProviders: () => {
        const allModels2 = providerRegistry.getAllModels();
        const providers = /* @__PURE__ */ new Map();
        for (const model of allModels2) {
          const existing = providers.get(model.provider);
          if (existing) {
            existing.models.push(model.id);
          } else {
            const provider = providerRegistry.getProvider(model.provider);
            providers.set(model.provider, {
              available: provider?.isAvailable() || false,
              models: [model.id]
            });
          }
        }
        return Array.from(providers.entries()).map(([name, info]) => ({
          name,
          available: info.available,
          models: info.models
        }));
      }
    });
    agentBridge.initialize((conversationId, conversationModel, conversationProvider, conversationCwd) => {
      const effectiveCwd = conversationCwd || currentWorkingDirectory;
      const systemPrompt2 = buildSystemPrompt(effectiveCwd);
      const model = conversationModel || currentModel;
      const providerName = conversationProvider || currentProviderName;
      let resolvedProvider;
      if (conversationProvider && conversationProvider !== currentProviderName) {
        resolvedProvider = providerRegistry.getProvider(conversationProvider);
      } else {
        resolvedProvider = activeProvider;
      }
      if (!resolvedProvider || !resolvedProvider.isAvailable()) {
        console.warn(`Provider "${providerName}" is not available for conversation ${conversationId}, falling back to global provider`);
        resolvedProvider = activeProvider;
      }
      const conversationCostTracker = new CostTracker({
        conversationId,
        onUsageRecorded: async (record) => {
          try {
            const usageStorage2 = await getUsageStorage();
            await usageStorage2.recordUsage(record, currentWorkingDirectory);
          } catch (error) {
            console.error("[CostTracker] Failed to record usage:", error);
          }
        }
      });
      const modelInfo = resolvedProvider?.getModelInfo(model);
      const modelRequestsThinking = modelInfo?.capabilities?.extendedThinking ?? false;
      const thinkingConfig = modelRequestsThinking ? { enabled: true, budgetTokens: 8e3 } : void 0;
      console.log("[core-integration] Creating agent:", {
        model,
        provider: providerName,
        modelRequestsThinking,
        thinkingEnabled: !!thinkingConfig,
        modelId: modelInfo?.id,
        modelApiId: modelInfo?.apiId
      });
      return new AgentImpl(
        {
          provider: resolvedProvider,
          model,
          systemPrompt: systemPrompt2,
          tools: toolRegistry.getAll(),
          temperature: config.get("temperature"),
          maxContextTokens: config.get("maxContextTokens"),
          maxTurns: settingsManager.get("ai.maxTurns") ?? null,
          contextCompressionThreshold: config.get("contextCompressionThreshold"),
          contextRecentMessagesToKeep: config.get("contextRecentMessagesToKeep"),
          planMode: false,
          cwd: effectiveCwd,
          workspacePaths: currentWorkspaceFolders?.map((f) => f.path) ?? [effectiveCwd],
          thinking: thinkingConfig,
          limitCheck: {
            check: async () => {
              try {
                const usageStorage2 = await getUsageStorage();
                const now = /* @__PURE__ */ new Date();
                const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                const summary = await usageStorage2.getSummary(month, currentWorkingDirectory);
                if (summary.error) {
                  return { allowed: true, percentage: 0 };
                }
                const limits = await usageStorage2.getAllMonthlyLimits();
                const monthlyLimit = limits[month] || config.get("usage.monthlyLimit") || 0;
                if (!monthlyLimit || monthlyLimit <= 0) {
                  return { allowed: true, percentage: 0 };
                }
                const percentage = summary.totalCost / monthlyLimit * 100;
                if (percentage >= 100) {
                  return {
                    allowed: false,
                    percentage,
                    warning: `Monthly limit exceeded: $${summary.totalCost.toFixed(2)} / $${monthlyLimit.toFixed(2)}`
                  };
                }
                if (percentage >= 95) {
                  return {
                    allowed: true,
                    percentage,
                    warning: `Warning: You've used ${percentage.toFixed(0)}% of your monthly limit`
                  };
                }
                if (percentage >= 80) {
                  return {
                    allowed: true,
                    percentage,
                    warning: `Notice: You've used ${percentage.toFixed(0)}% of your monthly limit`
                  };
                }
                return { allowed: true, percentage };
              } catch (error) {
                console.error("[LimitCheck] Failed to check limit:", error);
                return { allowed: true, percentage: 0 };
              }
            }
          }
        },
        toolRunner,
        conversationCostTracker
      );
    });
    agentBridge.setProviderRegistry(providerRegistry);
    agentBridge.setWorkspacePath(currentWorkingDirectory);
    setAgentRef(agentBridge);
    coreInitialized = true;
    console.log("Core initialization complete");
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const sharedWM = getSharedWorkspaceManager2();
      await sharedWM.initialize();
      await sharedWM.syncAllWorkspaces();
    } catch (error) {
      console.error("[CoreIntegration] Error syncing workspaces:", error);
    }
    try {
      const remoteEnabled = settingsManager.get("remoteAccess.enabled");
      const ngrokAuthToken = settingsManager.get("remoteAccess.ngrokAuthToken");
      if (remoteEnabled && ngrokAuthToken) {
        console.log("[CoreIntegration] Remote access enabled, starting server...");
        const { initializeRemoteServer: initializeRemoteServer2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
        const result = await initializeRemoteServer2();
        if (result.success) {
          console.log("[CoreIntegration] Remote server started:", result.url);
        } else {
          console.error("[CoreIntegration] Failed to start remote server:", result.error);
        }
      }
    } catch (error) {
      console.error("[CoreIntegration] Error starting remote server:", error);
    }
    try {
      const remoteClientUrl = settingsManager.get("remoteClient.url");
      const remoteClientApiKey = settingsManager.get("remoteClient.apiKey");
      const remoteClientAutoConnect = settingsManager.get("remoteClient.autoConnect");
      if (remoteClientAutoConnect && remoteClientUrl && remoteClientApiKey) {
        console.log("[CoreIntegration] Auto-connecting to remote host:", remoteClientUrl);
        const { remoteClientMode: remoteClientMode2 } = await Promise.resolve().then(() => (init_remote_client_mode(), remote_client_mode_exports));
        const result = await remoteClientMode2.connect(remoteClientUrl, remoteClientApiKey);
        if (result.success) {
          console.log("[CoreIntegration] Connected to remote host:", remoteClientUrl);
        } else {
          console.error("[CoreIntegration] Failed to connect to remote host:", result.error);
        }
      }
    } catch (error) {
      console.error("[CoreIntegration] Error auto-connecting to remote host:", error);
    }
    settingsManager.onChange((key, value) => {
      if (key.startsWith("apiKeys.")) {
        const providerName = key.replace("apiKeys.", "");
        console.log(`[CoreIntegration] API key changed for provider: ${providerName}`);
        reinitializeProviders2().then((result) => {
          if (result.success) {
            console.log(`[CoreIntegration] Providers re-initialized after API key change for ${providerName}`);
          } else {
            console.error(`[CoreIntegration] Failed to re-initialize providers: ${result.error}`);
          }
        });
      }
    });
  } catch (error) {
    console.error("Failed to initialize core:", error);
    throw error;
  }
}
function isCoreInitialized() {
  return coreInitialized;
}
async function reinitializeProviders2() {
  if (!providerRegistry) {
    return { success: false, error: "Provider registry not initialized" };
  }
  try {
    console.log("[CoreIntegration] Re-initializing providers with updated API keys...");
    const providerConfigs = {};
    const settingsApiKeys = {
      anthropic: "anthropic",
      openai: "openai",
      google: "google",
      mistral: "openai",
      groq: "groq",
      xai: "xai",
      bedrock: "anthropic",
      moonshot: "moonshot"
    };
    const apiKeys = settingsManager.get("apiKeys");
    console.log("[CoreIntegration:Reinit] API keys from settings:", Object.keys(apiKeys));
    console.log("[CoreIntegration:Reinit] Moonshot key exists:", !!apiKeys["moonshot"]);
    for (const [providerName, settingsKey] of Object.entries(settingsApiKeys)) {
      const apiKey = apiKeys[settingsKey];
      if (apiKey && typeof apiKey === "string" && apiKey.trim()) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: apiKey.trim()
        };
        console.log(`[CoreIntegration:Reinit] Loaded API key for ${providerName}`);
      } else {
        console.log(`[CoreIntegration:Reinit] No API key for ${providerName}`);
      }
    }
    const envKeys = {
      ANTHROPIC_API_KEY: "anthropic",
      OPENAI_API_KEY: "openai",
      GOOGLE_API_KEY: "google",
      MISTRAL_API_KEY: "mistral",
      GROQ_API_KEY: "groq",
      XAI_API_KEY: "xai",
      AWS_ACCESS_KEY_ID: "bedrock",
      MOONSHOT_API_KEY: "moonshot"
    };
    for (const [envVar, providerName] of Object.entries(envKeys)) {
      if (process.env[envVar] && !providerConfigs[providerName]?.apiKey) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: process.env[envVar]
        };
      }
    }
    await providerRegistry.initializeAll(providerConfigs);
    const availableProviders = providerRegistry.getAvailable().map((p) => p.name);
    console.log("[CoreIntegration] Providers re-initialized. Available:", availableProviders);
    return { success: true };
  } catch (error) {
    const errorMsg = error.message;
    console.error("[CoreIntegration] Failed to re-initialize providers:", error);
    return { success: false, error: errorMsg };
  }
}
function getProviderRegistry() {
  return providerRegistry;
}
async function reloadAddons() {
  if (toolRegistryRef) {
    await loadInstalledAddons(toolRegistryRef);
    toolRunnerRef?.setOutputFilters([...getToolOutputFilters()]);
  }
}
var path43, coreInitialized, currentWorkingDirectory, agentInstance, providerRegistry, toolRegistryRef, toolRunnerRef, permissionManager, currentWorkspaceName, currentWorkspaceFolders;
var init_core_integration = __esm({
  "main/core-integration.ts"() {
    path43 = __toESM(require("path"), 1);
    init_config_manager();
    init_provider_registry();
    init_anthropic_provider();
    init_openai_provider();
    init_google_provider();
    init_mistral_provider();
    init_groq_provider();
    init_xai_provider();
    init_bedrock_provider();
    init_moonshot_provider();
    init_openai_compat_provider();
    init_tool_registry();
    init_builtin();
    init_permission_manager();
    init_tool_runner();
    init_agent();
    init_cost_tracker();
    init_event_bus();
    init_agent_bridge();
    init_ipc_handlers();
    init_usage_storage();
    init_settings();
    init_rules_manager();
    init_skills_manager();
    init_addon_loader();
    coreInitialized = false;
    currentWorkingDirectory = process.cwd();
    agentInstance = null;
    providerRegistry = null;
    toolRegistryRef = null;
    toolRunnerRef = null;
    permissionManager = null;
  }
});
init_core_integration();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearWorkspaceContext,
  getProviderRegistry,
  getWorkingDirectory,
  getWorkingDirectoryForConversation,
  initializeCore,
  isCoreInitialized,
  refreshSystemPrompt,
  reinitializeProviders,
  reloadAddons,
  rulesManager,
  setPermissionMode,
  setWorkingDirectory,
  setWorkingDirectoryForWindow,
  setWorkspaceContext,
  skillsManager
});
//# sourceMappingURL=core-integration.cjs.map