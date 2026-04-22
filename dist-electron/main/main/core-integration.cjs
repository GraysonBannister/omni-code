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
          maxTurns: import_zod.z.number().optional()
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
      deepSet(obj, path35, value) {
        let current = obj;
        for (let i = 0; i < path35.length - 1; i++) {
          if (current[path35[i]] === void 0 || current[path35[i]] === null) {
            current[path35[i]] = {};
          }
          current = current[path35[i]];
        }
        current[path35[path35.length - 1]] = value;
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
        const promises = [];
        for (const [name, config] of Object.entries(configs)) {
          const provider = this.providers.get(name);
          if (provider && (config.apiKey || config.baseUrl)) {
            promises.push(
              provider.initialize(config).catch((err) => {
                logger.warn(`Failed to initialize provider "${name}": ${err.message}`);
              })
            );
          }
        }
        await Promise.allSettled(promises);
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
        return Array.from(this.providers.values()).filter((p) => p.isAvailable());
      }
      getAllModels() {
        return Array.from(this.providers.values()).flatMap((p) => p.listModels());
      }
      getAvailableModels() {
        return this.getAvailable().flatMap((p) => p.listModels());
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
        this.config = config;
        try {
          await this.createClient(config);
          this._available = true;
        } catch (error) {
          this._available = false;
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
      {
        id: "claude-opus-4-6",
        provider: "anthropic",
        displayName: "Claude Opus 4.6",
        aliases: ["opus", "claude-opus"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 32e3
        },
        pricing: { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 }
      },
      {
        id: "claude-sonnet-4-5",
        provider: "anthropic",
        displayName: "Claude Sonnet 4.5",
        aliases: ["sonnet", "claude-sonnet"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 2e5,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 }
      },
      {
        id: "claude-haiku-3-5",
        provider: "anthropic",
        displayName: "Claude Haiku 3.5",
        aliases: ["haiku", "claude-haiku"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 2e5,
          maxOutputTokens: 8192
        },
        pricing: { inputPerMillion: 0.8, outputPerMillion: 4, cacheReadPerMillion: 0.08, cacheWritePerMillion: 1 }
      },
      // ── OpenAI ──
      {
        id: "gpt-4.5-preview",
        provider: "openai",
        displayName: "GPT-4.5 Preview",
        aliases: ["gpt-4.5", "4.5"],
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
        pricing: { inputPerMillion: 75, outputPerMillion: 150 }
      },
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
        id: "o3",
        provider: "openai",
        displayName: "o3",
        aliases: ["o3-reasoning"],
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
        id: "o4-mini",
        provider: "openai",
        displayName: "o4 Mini",
        aliases: ["o4m", "o4-mini"],
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
      // ── Google Gemini ──
      {
        id: "gemini-2.0-pro",
        provider: "google",
        displayName: "Gemini 2.0 Pro",
        aliases: ["gemini-pro", "gemini"],
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
      {
        id: "gemini-2.0-flash",
        provider: "google",
        displayName: "Gemini 2.0 Flash",
        aliases: ["gemini-flash", "flash"],
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
        pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 }
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
      {
        id: "grok-4-1-fast-reasoning",
        provider: "xai",
        displayName: "Grok 4.1 Fast (Reasoning)",
        aliases: ["grok-4-1-fast", "grok-4-fast", "grok-fast", "grok"],
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
        displayName: "Grok 4.1 Fast (Non-Reasoning)",
        aliases: ["grok-4-1-nr", "grok-fast-nr"],
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
        id: "grok-code-fast-1",
        provider: "xai",
        displayName: "Grok Code Fast",
        aliases: ["grok-code", "grok-coder"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: false,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 256e3,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.2, outputPerMillion: 1.5, cacheReadPerMillion: 0.02 }
      },
      {
        id: "grok-4.20-multi-agent-experimental-beta-0304",
        provider: "xai",
        displayName: "Grok 4.20 Multi-Agent (Experimental)",
        aliases: ["grok-4.20", "grok-multi-agent", "grok-experimental"],
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
        pricing: { inputPerMillion: 2, outputPerMillion: 6 }
      },
      {
        id: "grok-4.20-experimental-beta-0304-reasoning",
        provider: "xai",
        displayName: "Grok 4.20 Experimental (Reasoning)",
        aliases: ["grok-4.20-reasoning"],
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
        pricing: { inputPerMillion: 2, outputPerMillion: 6 }
      },
      {
        id: "grok-4.20-experimental-beta-0304-non-reasoning",
        provider: "xai",
        displayName: "Grok 4.20 Experimental (Non-Reasoning)",
        aliases: ["grok-4.20-nr"],
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
        pricing: { inputPerMillion: 2, outputPerMillion: 6 }
      },
      {
        id: "grok-4-fast-reasoning",
        provider: "xai",
        displayName: "Grok 4 Fast (Reasoning)",
        aliases: ["grok-4-fr"],
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
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5 }
      },
      {
        id: "grok-4-fast-non-reasoning",
        provider: "xai",
        displayName: "Grok 4 Fast (Non-Reasoning)",
        aliases: ["grok-4-fnr"],
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
        pricing: { inputPerMillion: 0.2, outputPerMillion: 0.5 }
      },
      {
        id: "grok-4-0709",
        provider: "xai",
        displayName: "Grok 4",
        aliases: ["grok-4", "grok4"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 256e3,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.75 }
      },
      {
        id: "grok-3",
        provider: "xai",
        displayName: "Grok-3",
        aliases: ["grok3"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: false,
          maxContextWindow: 131072,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.75 }
      },
      {
        id: "grok-3-mini",
        provider: "xai",
        displayName: "Grok-3 Mini",
        aliases: ["grok-mini", "grok3-mini"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: true,
          extendedThinking: true,
          maxContextWindow: 131072,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 0.3, outputPerMillion: 0.5, cacheReadPerMillion: 0.07 }
      },
      {
        id: "grok-2-vision-1212",
        provider: "xai",
        displayName: "Grok-2 Vision",
        aliases: ["grok2-vision", "grok-2-vision"],
        capabilities: {
          streaming: true,
          toolUse: true,
          vision: true,
          jsonMode: true,
          systemPrompt: true,
          caching: false,
          extendedThinking: false,
          maxContextWindow: 32768,
          maxOutputTokens: 16384
        },
        pricing: { inputPerMillion: 2, outputPerMillion: 10 }
      },
      // ── Moonshot / Kimi ──
      {
        id: "kimi-k2.5",
        provider: "moonshot",
        displayName: "Kimi K2.5",
        aliases: ["kimi", "k2.5", "kimi-k2"],
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
        return messages.filter((m) => m.role !== "system").map((msg) => this.convertMessage(msg));
      }
      async complete(request) {
        const params = this.buildParams(request);
        const response2 = await this.client.messages.create({
          ...params,
          stream: false
        });
        return this.parseResponse(response2, request.model);
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
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
                    outputTokens: event.usage.output_tokens
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
                    outputTokens: 0
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
        return Math.ceil(totalChars / 4);
      }
      buildParams(request) {
        const modelInfo = this.getModelInfo(request.model);
        const params = {
          model: request.model,
          messages: this.formatMessages(request.messages),
          max_tokens: request.maxTokens ?? 8192
        };
        if (request.systemPrompt) {
          params.system = request.systemPrompt;
        }
        if (request.tools && request.tools.length > 0) {
          params.tools = this.formatTools(request.tools);
        }
        if (request.temperature !== void 0) {
          params.temperature = request.temperature;
        }
        if (request.stopSequences) {
          params.stop_sequences = request.stopSequences;
        }
        if (request.topP !== void 0) {
          params.top_p = request.topP;
        }
        if (request.thinking?.enabled && modelInfo?.capabilities.extendedThinking) {
          params.thinking = {
            type: "enabled",
            budget_tokens: request.thinking.budgetTokens
          };
          params.temperature = 1;
        }
        return params;
      }
      parseResponse(response2, model) {
        const content = response2.content.map((block) => {
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
        const stopReason = response2.stop_reason === "tool_use" ? "tool_use" : response2.stop_reason === "max_tokens" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: response2.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "anthropic",
              inputTokens: response2.usage.input_tokens,
              outputTokens: response2.usage.output_tokens,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usage.input_tokens,
            outputTokens: response2.usage.output_tokens
          }
        };
      }
      convertMessage(msg) {
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
                id: block.id,
                name: block.name,
                input: block.input
              });
              break;
            case "tool_result":
              blocks.push({
                type: "tool_result",
                tool_use_id: block.toolUseId,
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
      async complete(request) {
        const params = this.buildParams(request);
        const response2 = await this.client.chat.completions.create({
          ...params,
          stream: false
        });
        return this.parseNonStreamResponse(response2, request.model);
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
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
                  outputTokens: chunk.usage.completion_tokens || 0
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
        return Math.ceil(totalChars / 4);
      }
      buildParams(request) {
        const params = {
          model: request.model,
          messages: this.formatMessages(request.messages)
        };
        if (request.systemPrompt) {
          params.messages = [
            { role: "system", content: request.systemPrompt },
            ...params.messages
          ];
        }
        if (request.tools && request.tools.length > 0) {
          params.tools = this.formatTools(request.tools);
        }
        if (request.temperature !== void 0)
          params.temperature = request.temperature;
        if (request.maxTokens)
          params.max_tokens = request.maxTokens;
        if (request.topP !== void 0)
          params.top_p = request.topP;
        if (request.thinking?.enabled && (request.model.startsWith("o3") || request.model.startsWith("o4"))) {
          params.reasoning_effort = "high";
          delete params.temperature;
        }
        return params;
      }
      parseNonStreamResponse(response2, model) {
        const choice = response2.choices[0];
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
            id: response2.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "openai",
              inputTokens: response2.usage?.prompt_tokens || 0,
              outputTokens: response2.usage?.completion_tokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usage?.prompt_tokens || 0,
            outputTokens: response2.usage?.completion_tokens || 0
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
      async complete(request) {
        const model = this.getModel(request);
        const result = await model.generateContent({
          contents: this.formatMessages(request.messages),
          ...request.tools?.length ? { tools: this.formatTools(request.tools) } : {}
        });
        const response2 = result.response;
        const content = [];
        for (const part of response2.candidates?.[0]?.content?.parts || []) {
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
              model: request.model,
              provider: "google",
              inputTokens: response2.usageMetadata?.promptTokenCount || 0,
              outputTokens: response2.usageMetadata?.candidatesTokenCount || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usageMetadata?.promptTokenCount || 0,
            outputTokens: response2.usageMetadata?.candidatesTokenCount || 0
          }
        };
      }
      async *streamComplete(request) {
        const model = this.getModel(request);
        const result = await model.generateContentStream({
          contents: this.formatMessages(request.messages),
          ...request.tools?.length ? { tools: this.formatTools(request.tools) } : {}
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
          return Math.ceil(chars / 4);
        }
      }
      getModel(request) {
        const config = {};
        if (request.temperature !== void 0)
          config.temperature = request.temperature;
        if (request.maxTokens)
          config.maxOutputTokens = request.maxTokens;
        if (request.topP !== void 0)
          config.topP = request.topP;
        return this.genAI.getGenerativeModel({
          model: request.model,
          generationConfig: config,
          ...request.systemPrompt ? { systemInstruction: request.systemPrompt } : {}
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
      async complete(request) {
        const params = this.buildParams(request);
        const response2 = await this.client.chat.complete(params);
        const choice = response2.choices[0];
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
          message: { id: response2.id, role: "assistant", content, timestamp: Date.now(), metadata: { model: request.model, provider: "mistral", inputTokens: response2.usage?.promptTokens || 0, outputTokens: response2.usage?.completionTokens || 0, stopReason } },
          stopReason,
          usage: { inputTokens: response2.usage?.promptTokens || 0, outputTokens: response2.usage?.completionTokens || 0 }
        };
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
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
        return Math.ceil(chars / 4);
      }
      buildParams(request) {
        const params = { model: request.model, messages: this.formatMessages(request.messages) };
        if (request.systemPrompt)
          params.messages = [{ role: "system", content: request.systemPrompt }, ...params.messages];
        if (request.tools?.length)
          params.tools = this.formatTools(request.tools);
        if (request.temperature !== void 0)
          params.temperature = request.temperature;
        if (request.maxTokens)
          params.maxTokens = request.maxTokens;
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
              result.push({ role: "tool", tool_call_id: tr.toolUseId, content: getToolResultText(tr) });
            }
          } else {
            result.push({ role: "user", content: getTextContent(msg) });
          }
        }
        return result;
      }
      async complete(request) {
        const params = this.buildParams(request);
        const response2 = await this.client.chat.completions.create({ ...params, stream: false });
        const choice = response2.choices[0];
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
          message: { id: response2.id, role: "assistant", content, timestamp: Date.now(), metadata: { model: request.model, provider: "groq", inputTokens: response2.usage?.prompt_tokens || 0, outputTokens: response2.usage?.completion_tokens || 0, stopReason } },
          stopReason,
          usage: { inputTokens: response2.usage?.prompt_tokens || 0, outputTokens: response2.usage?.completion_tokens || 0 }
        };
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
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
        return Math.ceil(chars / 4);
      }
      buildParams(request) {
        const params = { model: request.model, messages: this.formatMessages(request.messages) };
        if (request.systemPrompt)
          params.messages = [{ role: "system", content: request.systemPrompt }, ...params.messages];
        if (request.tools?.length)
          params.tools = this.formatTools(request.tools);
        if (request.temperature !== void 0)
          params.temperature = request.temperature;
        if (request.maxTokens)
          params.max_tokens = request.maxTokens;
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
    RESPONSES_API_MODELS = /* @__PURE__ */ new Set([
      "grok-4.20-multi-agent-experimental-beta-0304"
    ]);
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
        return RESPONSES_API_MODELS.has(model) || model.includes("multi-agent");
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
      async complete(request) {
        if (this.isResponsesModel(request.model)) {
          return this.completeViaResponses(request);
        }
        const params = this.buildParams(request);
        const response2 = await this.client.chat.completions.create({ ...params, stream: false });
        const choice = response2.choices[0];
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
        return {
          message: {
            id: response2.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model: request.model,
              provider: "xai",
              inputTokens: response2.usage?.prompt_tokens || 0,
              outputTokens: response2.usage?.completion_tokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usage?.prompt_tokens || 0,
            outputTokens: response2.usage?.completion_tokens || 0
          }
        };
      }
      async *streamComplete(request) {
        if (this.isResponsesModel(request.model)) {
          yield* this.streamViaResponses(request);
          return;
        }
        const params = this.buildParams(request);
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
              yield { type: "usage", usage: { inputTokens: chunk.usage.prompt_tokens || 0, outputTokens: chunk.usage.completion_tokens || 0 } };
            }
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
        return Math.ceil(totalChars / 4);
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
      async completeViaResponses(request) {
        const input = this.buildResponsesInput(request.messages, request.systemPrompt);
        const url = `${this.baseURL}/responses`;
        const body = {
          model: request.model,
          input,
          max_output_tokens: request.maxTokens || 16384
        };
        if (request.temperature !== void 0)
          body.temperature = request.temperature;
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
              model: request.model,
              provider: "xai",
              inputTokens: data.usage?.input_tokens || 0,
              outputTokens: data.usage?.output_tokens || 0,
              stopReason: "end_turn"
            }
          },
          stopReason: "end_turn",
          usage: {
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0
          }
        };
      }
      async *streamViaResponses(request) {
        const input = this.buildResponsesInput(request.messages, request.systemPrompt);
        const url = `${this.baseURL}/responses`;
        const body = {
          model: request.model,
          input,
          max_output_tokens: request.maxTokens || 16384,
          stream: true
        };
        if (request.temperature !== void 0)
          body.temperature = request.temperature;
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
                        outputTokens: usage.output_tokens || 0
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
      buildParams(request) {
        const params = { model: request.model, messages: this.formatMessages(request.messages) };
        if (request.systemPrompt)
          params.messages = [{ role: "system", content: request.systemPrompt }, ...params.messages];
        if (request.tools?.length)
          params.tools = this.formatTools(request.tools);
        if (request.temperature !== void 0)
          params.temperature = request.temperature;
        if (request.maxTokens)
          params.max_tokens = request.maxTokens;
        if (request.topP !== void 0)
          params.top_p = request.topP;
        if (request.thinking?.enabled && request.model.includes("reasoning")) {
          params.reasoning_effort = "high";
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
      async complete(request) {
        const params = this.buildParams(request);
        const command = new import_client_bedrock_runtime.ConverseCommand(params);
        const response2 = await this.client.send(command);
        const content = [];
        const outputContent = response2.output?.message?.content || [];
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
        const stopReason = response2.stopReason === "tool_use" ? "tool_use" : response2.stopReason === "max_tokens" ? "max_tokens" : "end_turn";
        return {
          message: {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model: request.model,
              provider: "bedrock",
              inputTokens: response2.usage?.inputTokens || 0,
              outputTokens: response2.usage?.outputTokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usage?.inputTokens || 0,
            outputTokens: response2.usage?.outputTokens || 0
          }
        };
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
        const command = new import_client_bedrock_runtime.ConverseStreamCommand(params);
        const response2 = await this.client.send(command);
        if (!response2.stream) {
          yield { type: "error", error: new Error("No stream returned from Bedrock") };
          return;
        }
        let currentToolId;
        for await (const event of response2.stream) {
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
        return Math.ceil(totalChars / 4);
      }
      buildParams(request) {
        const params = {
          modelId: request.model,
          messages: this.formatMessages(request.messages)
        };
        if (request.systemPrompt) {
          params.system = [{ text: request.systemPrompt }];
        }
        if (request.tools && request.tools.length > 0) {
          params.toolConfig = this.formatTools(request.tools);
        }
        const inferenceConfig = {};
        if (request.maxTokens)
          inferenceConfig.maxTokens = request.maxTokens;
        if (request.temperature !== void 0)
          inferenceConfig.temperature = request.temperature;
        if (request.topP !== void 0)
          inferenceConfig.topP = request.topP;
        if (request.stopSequences)
          inferenceConfig.stopSequences = request.stopSequences;
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
        if (!config.apiKey) {
          throw new Error("Moonshot API key is required. Set MOONSHOT_API_KEY environment variable.");
        }
        this.client = new import_openai3.default({
          apiKey: config.apiKey,
          baseURL: config.baseUrl ?? "https://api.moonshot.cn/v1",
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
      async complete(request) {
        const params = this.buildParams(request);
        const response2 = await this.client.chat.completions.create({
          ...params,
          stream: false
        });
        return this.parseNonStreamResponse(response2, request.model);
      }
      async *streamComplete(request) {
        const params = this.buildParams(request);
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
                  outputTokens: chunk.usage.completion_tokens || 0
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
        return Math.ceil(totalChars / 4);
      }
      buildParams(request) {
        const params = {
          model: request.model,
          messages: this.formatMessages(request.messages)
        };
        if (request.systemPrompt) {
          params.messages = [
            { role: "system", content: request.systemPrompt },
            ...params.messages
          ];
        }
        if (request.tools && request.tools.length > 0) {
          params.tools = this.formatTools(request.tools);
        }
        if (request.temperature !== void 0)
          params.temperature = request.temperature;
        if (request.maxTokens)
          params.max_tokens = request.maxTokens;
        if (request.topP !== void 0)
          params.top_p = request.topP;
        return params;
      }
      parseNonStreamResponse(response2, model) {
        const choice = response2.choices[0];
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
            id: response2.id,
            role: "assistant",
            content,
            timestamp: Date.now(),
            metadata: {
              model,
              provider: "moonshot",
              inputTokens: response2.usage?.prompt_tokens || 0,
              outputTokens: response2.usage?.completion_tokens || 0,
              stopReason
            }
          },
          stopReason,
          usage: {
            inputTokens: response2.usage?.prompt_tokens || 0,
            outputTokens: response2.usage?.completion_tokens || 0
          }
        };
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
        return Array.from(this.tools.values()).filter((reg) => reg.enabled && (!planMode || reg.tool.availableInPlanMode)).map((reg) => ({
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
      availableInPlanMode = true;
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
      availableInPlanMode = false;
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
      availableInPlanMode = false;
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
      availableInPlanMode = true;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The glob pattern to match files against"
          },
          path: {
            type: "string",
            description: "Directory to search in. Defaults to current working directory."
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
      availableInPlanMode = true;
      inputSchema = {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The regular expression pattern to search for"
          },
          path: {
            type: "string",
            description: "File or directory to search in. Defaults to current working directory."
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
            maxBuffer: 10 * 1024 * 1024
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
var import_node_child_process2, import_tree_kill, BashExecTool;
var init_bash_exec = __esm({
  "src/tools/builtin/bash-exec.ts"() {
    "use strict";
    import_node_child_process2 = require("child_process");
    import_tree_kill = __toESM(require("tree-kill"), 1);
    init_tool_types();
    BashExecTool = class {
      name = "Bash";
      description = "Executes a shell command and returns its output. Working directory persists between commands.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
        return new Promise((resolve6) => {
          let stdout = "";
          let stderr = "";
          let killed = false;
          let lastProgressAt = 0;
          const emitProgress = () => {
            const now = Date.now();
            if (now - lastProgressAt > 500) {
              lastProgressAt = now;
              const combined = (stdout + (stderr ? "\n" + stderr : "")).trimEnd();
              const lines = combined.split("\n").slice(-8).join("\n");
              if (lines)
                context.onProgress?.(lines);
            }
          };
          const proc = (0, import_node_child_process2.spawn)("bash", ["-c", command], {
            cwd: context.cwd,
            env: { ...process.env },
            stdio: ["ignore", "pipe", "pipe"]
          });
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
            resolve6({
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
            resolve6({
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
            resolve6({
              content: output.trim(),
              isError: code !== 0,
              metadata: { exitCode: code }
            });
          });
          proc.on("error", (error) => {
            clearTimeout(timer);
            context.abortSignal.removeEventListener("abort", abortHandler);
            resolve6({
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
var fs7, path7, LANGUAGE_PATTERNS, EXT_TO_LANGUAGE, SmartChunker;
var init_smart_chunker = __esm({
  "src/memory/smart-chunker.ts"() {
    "use strict";
    fs7 = __toESM(require("fs/promises"), 1);
    path7 = __toESM(require("path"), 1);
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
      ]
    };
    EXT_TO_LANGUAGE = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "typescript",
      ".jsx": "typescript",
      ".mjs": "typescript",
      ".cjs": "typescript",
      ".py": "python",
      ".pyi": "python",
      ".pyw": "python",
      ".rb": "ruby",
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
      ".kt": "kotlin",
      ".swift": "swift",
      ".cpp": "cpp",
      ".c": "c",
      ".h": "c",
      ".hpp": "cpp",
      ".cs": "csharp",
      ".php": "php"
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
          const stats = await fs7.stat(filePath);
          const content = await fs7.readFile(filePath, "utf-8");
          const relPath = path7.relative(baseDir, filePath);
          const ext = path7.extname(filePath).toLowerCase();
          const language = EXT_TO_LANGUAGE[ext] || "text";
          if (content.length > this.maxChunkSize * 50) {
            return this.createSimpleChunk(relPath, content, language, stats.mtimeMs);
          }
          if (language === "typescript" || language === "python") {
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
        const basename9 = path7.basename(filePath);
        const relativePath = filePath;
        for (const pattern of excludePatterns) {
          if (this.matchesGlob(basename9, pattern) || this.matchesGlob(relativePath, pattern)) {
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
        const ext = path7.extname(filePath).toLowerCase();
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
var fs8, path8, DEFAULT_INDEXING_CONFIG, GITIGNORE_PATTERNS, IndexingConfigManager, configManagers;
var init_indexing_config = __esm({
  "src/memory/indexing-config.ts"() {
    "use strict";
    fs8 = __toESM(require("fs/promises"), 1);
    path8 = __toESM(require("path"), 1);
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
        const omnicodeDir = path8.join(projectPath, ".omnicode");
        this.configPath = path8.join(omnicodeDir, "index-config.json");
        this.omniignorePath = path8.join(projectPath, ".omniignore");
        this.config = { ...DEFAULT_INDEXING_CONFIG };
      }
      async load() {
        try {
          const configExists = await fs8.access(this.configPath).then(() => true).catch(() => false);
          if (configExists) {
            const content = await fs8.readFile(this.configPath, "utf-8");
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
          const dir = path8.dirname(this.configPath);
          await fs8.mkdir(dir, { recursive: true });
          await fs8.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
        } catch (error) {
          console.error("[IndexingConfig] Failed to save config:", error);
          throw error;
        }
      }
      async loadOmniignore() {
        try {
          const exists = await fs8.access(this.omniignorePath).then(() => true).catch(() => false);
          if (exists) {
            const content = await fs8.readFile(this.omniignorePath, "utf-8");
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
        return path8.join(path8.dirname(this.configPath), "index");
      }
      async ensureIndexDirectory() {
        const dir = this.getIndexDirectory();
        await fs8.mkdir(dir, { recursive: true });
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
var fs9, path9, import_fast_glob, INDEX_VERSION, SEMANTIC_SEARCH_THRESHOLD, DEFAULT_SYNC_INTERVAL_MS, ProjectIndexer, DEFAULT_INDEXING_CONFIG2;
var init_project_indexer = __esm({
  "src/memory/project-indexer.ts"() {
    "use strict";
    fs9 = __toESM(require("fs/promises"), 1);
    path9 = __toESM(require("path"), 1);
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
        this.indexDir = path9.join(projectPath, ".omnicode", "index");
        this.statusFilePath = path9.join(this.indexDir, "status.json");
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
        await fs9.mkdir(this.indexDir, { recursive: true });
        this.semanticMemory = await SemanticMemory.create(this.indexDir);
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        await this.loadStatus();
      }
      async loadStatus() {
        try {
          const exists = await fs9.access(this.statusFilePath).then(() => true).catch(() => false);
          if (exists) {
            const content = await fs9.readFile(this.statusFilePath, "utf-8");
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
          await fs9.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), "utf-8");
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
            const filePath = path9.join(this.indexDir, file);
            const exists = await fs9.access(filePath).then(() => true).catch(() => false);
            if (exists) {
              await fs9.unlink(filePath);
            }
          }
        } catch (error) {
          console.warn("[ProjectIndexer] Error clearing index files:", error);
        }
        this.resetState();
        await fs9.mkdir(this.indexDir, { recursive: true });
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
                this.indexedFiles.add(path9.relative(this.projectPath, filePath));
                const stats = await fs9.stat(filePath);
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
            const stats = await fs9.stat(filePath);
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
          const fullPath = path9.join(this.projectPath, indexedFile);
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
      availableInPlanMode = true;
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
      async diff(staged = false) {
        if (staged) {
          return this.git.diff(["--staged"]);
        }
        return this.git.diff();
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
      async add(files) {
        await this.git.add(files);
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
      availableInPlanMode = true;
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
          const stat7 = await git.diff(statArgs);
          return {
            content: `## Diff Summary
${stat7}
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
var fs10, path10, import_node_child_process3, RunTestsTool;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
    RunTestsTool = class {
      name = "RunTests";
      description = "Run project tests. Auto-detects test framework (npm test, pytest, jest) or accepts a custom command.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
          const pkgContent = await fs10.readFile(path10.join(cwd, "package.json"), "utf-8");
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
            await fs10.access(path10.join(cwd, config));
            return { found: true, command: "pytest" };
          } catch {
          }
        }
        try {
          const files = await fs10.readdir(cwd);
          if (files.some((f) => f.startsWith("test_") && f.endsWith(".py")) || files.some((f) => f.endsWith("_test.py"))) {
            return { found: true, command: "pytest" };
          }
        } catch {
        }
        const jestConfigs = ["jest.config.js", "jest.config.ts", "jest.config.mjs", "jest.config.json"];
        for (const config of jestConfigs) {
          try {
            await fs10.access(path10.join(cwd, config));
            return { found: true, command: "npx jest" };
          } catch {
          }
        }
        const vitestConfigs = ["vitest.config.js", "vitest.config.ts", "vitest.config.mjs"];
        for (const config of vitestConfigs) {
          try {
            await fs10.access(path10.join(cwd, config));
            return { found: true, command: "npx vitest run" };
          } catch {
          }
        }
        try {
          const makefile = await fs10.readFile(path10.join(cwd, "Makefile"), "utf-8");
          if (makefile.includes("test:")) {
            return { found: true, command: "make test" };
          }
        } catch {
        }
        try {
          const files = await fs10.readdir(cwd);
          if (files.some((f) => f.endsWith("_test.go"))) {
            return { found: true, command: "go test ./..." };
          }
        } catch {
        }
        try {
          await fs10.access(path10.join(cwd, "Cargo.toml"));
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
var fs11, path11, DEFAULT_IGNORE, FileTreeTool;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
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
      availableInPlanMode = true;
      inputSchema = {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory to display tree for (default: cwd)"
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
          const absPath = path11.isAbsolute(targetPath) ? targetPath : path11.join(context.cwd, targetPath);
          const stat7 = await fs11.stat(absPath);
          if (!stat7.isDirectory()) {
            return { content: `Not a directory: ${absPath}`, isError: true };
          }
          const lines = [path11.basename(absPath) + "/"];
          await this.buildTree(absPath, "", maxDepth, 0, includeHidden, lines);
          return { content: lines.join("\n") };
        } catch (error) {
          return { content: `Error reading directory: ${error.message}`, isError: true };
        }
      }
      async buildTree(dirPath, prefix, maxDepth, currentDepth, includeHidden, lines) {
        if (currentDepth >= maxDepth)
          return;
        let entries = await fs11.readdir(dirPath, { withFileTypes: true });
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
              path11.join(dirPath, entry.name),
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
var fs12, path12, import_node_child_process4, LintFixTool;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
    import_node_child_process4 = require("child_process");
    init_tool_types();
    LintFixTool = class {
      name = "LintFix";
      description = "Run ESLint/Prettier auto-fix on files. Detects project lint configuration automatically.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
        const absPath = path12.isAbsolute(filePath) ? filePath : path12.join(context.cwd, filePath);
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
            const pkg = JSON.parse(await fs12.readFile(path12.join(context.cwd, "package.json"), "utf-8"));
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
            await fs12.access(path12.join(cwd, filename));
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
      availableInPlanMode = true;
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
      availableInPlanMode = true;
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
          const response2 = await fetch(url, {
            signal: combinedSignal,
            headers: {
              "User-Agent": "omni-code/0.1.0",
              "Accept": "text/html,application/json,text/plain,*/*"
            },
            redirect: "follow"
          });
          if (!response2.ok) {
            return {
              content: `HTTP ${response2.status} ${response2.statusText} for ${url}`,
              isError: true
            };
          }
          const contentType = response2.headers.get("content-type") || "";
          const rawBody = await response2.text();
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
            metadata: { statusCode: response2.status, contentType, length: content.length }
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
var fs13, path13, import_node_child_process5, TypeCheckTool;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
    import_node_child_process5 = require("child_process");
    init_tool_types();
    TypeCheckTool = class {
      name = "TypeCheck";
      description = "Run type checker (tsc, mypy, cargo check) and return diagnostics. Auto-detects the project type.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
          await fs13.access(path13.join(cwd, "tsconfig.json"));
          return file ? `npx tsc --noEmit ${file}` : "npx tsc --noEmit";
        } catch {
        }
        for (const cfg of ["mypy.ini", "pyproject.toml", "setup.py", "setup.cfg"]) {
          try {
            await fs13.access(path13.join(cwd, cfg));
            return file ? `mypy ${file}` : "mypy .";
          } catch {
          }
        }
        try {
          await fs13.access(path13.join(cwd, "Cargo.toml"));
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
      availableInPlanMode = true;
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
          const response2 = await fetch(url, fetchOptions);
          const statusLine = `HTTP ${response2.status} ${response2.statusText}`;
          const responseHeaders = [];
          response2.headers.forEach((value, key) => {
            responseHeaders.push(`  ${key}: ${value}`);
          });
          let responseBody = await response2.text();
          const contentType = response2.headers.get("content-type") || "";
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
            isError: response2.status >= 400,
            metadata: { statusCode: response2.status, contentType }
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
var fs14, path14, import_fast_glob2, SymbolRenameTool;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
    SymbolRenameTool = class {
      name = "SymbolRename";
      description = "Rename a symbol across all matching files using word-boundary matching. Defaults to dry-run mode for previewing changes.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
        const absPath = path14.isAbsolute(searchPath) ? searchPath : path14.join(context.cwd, searchPath);
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
            const content = await fs14.readFile(filePath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const matches = line.match(regex);
              if (matches) {
                const replaced = line.replace(regex, newName);
                changes.push({
                  file: path14.relative(absPath, filePath),
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
              const content = await fs14.readFile(filePath, "utf-8");
              const updated = content.replace(regex, newName);
              await fs14.writeFile(filePath, updated, "utf-8");
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
var fs15, path15, MultiFileEditTool;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
    init_tool_types();
    MultiFileEditTool = class {
      name = "MultiFileEdit";
      description = "Apply multiple edits across files atomically. All edits are validated first, then applied. Rolls back on failure.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
          if (!path15.isAbsolute(edit.file_path)) {
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
              const content2 = await fs15.readFile(edit.file_path, "utf-8");
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
            await fs15.writeFile(filePath, content, "utf-8");
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
                await fs15.writeFile(filePath, original, "utf-8");
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
var fs16, path16, import_node_child_process6, VALID_ACTIONS, DependencyManagerTool;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
    VALID_ACTIONS = ["add", "remove", "update", "list"];
    DependencyManagerTool = class {
      name = "DependencyManager";
      description = "Add, remove, update, or list project dependencies. Auto-detects package manager (npm, yarn, pnpm, pip, cargo).";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
            await fs16.access(path16.join(cwd, file));
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
var fs17, path17, TEMPLATES, ScaffoldTool;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
    init_tool_types();
    TEMPLATES = ["react-component", "api-route", "test-file", "typescript-class", "express-middleware"];
    ScaffoldTool = class {
      name = "Scaffold";
      description = "Generate boilerplate code from templates: react-component, api-route, test-file, typescript-class, express-middleware.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
        const absDir = path17.isAbsolute(outputDir) ? outputDir : path17.join(context.cwd, outputDir);
        const result = this.generateTemplate(template, name, options);
        try {
          await fs17.mkdir(absDir, { recursive: true });
          const filePath = path17.join(absDir, result.filename);
          try {
            await fs17.access(filePath);
            return { content: `File already exists: ${filePath}`, isError: true };
          } catch {
          }
          await fs17.writeFile(filePath, result.content, "utf-8");
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
var fs18, path18, import_better_sqlite32, WRITE_KEYWORDS, DatabaseQueryTool;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
    import_better_sqlite32 = __toESM(require("better-sqlite3"), 1);
    init_tool_types();
    WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE)\b/i;
    DatabaseQueryTool = class {
      name = "DatabaseQuery";
      description = "Run SQL queries against a local SQLite database. Read-only by default.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = true;
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
          resolvedDbPath = path18.isAbsolute(dbPath) ? dbPath : path18.join(context.cwd, dbPath);
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
        const entries = await fs18.readdir(cwd);
        const dbFiles = entries.filter(
          (f) => f.endsWith(".db") || f.endsWith(".sqlite") || f.endsWith(".sqlite3")
        );
        if (dbFiles.length === 0) {
          throw new Error("No SQLite database found in current directory. Specify a database path.");
        }
        if (dbFiles.length === 1) {
          return path18.join(cwd, dbFiles[0]);
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
      availableInPlanMode = true;
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
      availableInPlanMode = false;
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
var fs19, path19, TestGenTool;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
    init_tool_types();
    TestGenTool = class {
      name = "TestGen";
      description = "Generate a test skeleton for a source file. Analyzes exports and creates describe/it blocks.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
        const absPath = path19.isAbsolute(filePath) ? filePath : path19.join(context.cwd, filePath);
        const ext = path19.extname(absPath);
        let content;
        try {
          content = await fs19.readFile(absPath, "utf-8");
        } catch (error) {
          return { content: `Cannot read file: ${error.message}`, isError: true };
        }
        const detectedFramework = framework || await this.detectFramework(context.cwd, ext);
        const exports = this.extractExports(content, ext);
        if (exports.length === 0) {
          return { content: `No exported symbols found in ${filePath}. Cannot generate meaningful tests.`, isError: true };
        }
        const testContent = this.generateTests(absPath, exports, detectedFramework, ext);
        const testPath = outputPath ? path19.isAbsolute(outputPath) ? outputPath : path19.join(context.cwd, outputPath) : this.defaultTestPath(absPath, ext, detectedFramework);
        try {
          await fs19.access(testPath);
          return { content: `Test file already exists: ${testPath}`, isError: true };
        } catch {
        }
        try {
          await fs19.mkdir(path19.dirname(testPath), { recursive: true });
          await fs19.writeFile(testPath, testContent, "utf-8");
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
        const sourceBasename = path19.basename(sourcePath, ext);
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
        const moduleName = path19.basename(sourcePath, ".py");
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
        const dir = path19.dirname(sourcePath);
        const basename9 = path19.basename(sourcePath, ext);
        if (framework === "pytest") {
          const testsDir = path19.join(dir, "..", "tests");
          return path19.join(testsDir, `test_${basename9}.py`);
        }
        return path19.join(dir, `${basename9}.test${ext === ".tsx" ? ".tsx" : ext}`);
      }
      async detectFramework(cwd, ext) {
        if (ext === ".py")
          return "pytest";
        try {
          const pkgJson = JSON.parse(await fs19.readFile(path19.join(cwd, "package.json"), "utf-8"));
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
      availableInPlanMode = true;
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
var fs20, path20, import_fast_glob3, RepoMapTool;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
    RepoMapTool = class {
      name = "RepoMap";
      description = `Generate a structural map of the codebase showing files and their exported symbols (functions, classes, interfaces, types, enums) with signatures. Useful for understanding project architecture without reading every file.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      availableInPlanMode = true;
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
              const absPath = path20.join(context.cwd, relPath);
              const content = await fs20.readFile(absPath, "utf-8");
              const ext = path20.extname(relPath).toLowerCase();
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
var fs21, path21, IGNORES, SelfAnalyzeTool;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    path21 = __toESM(require("path"), 1);
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
      availableInPlanMode = true;
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
        let stat7;
        try {
          stat7 = await fs21.stat(absPath);
        } catch {
          return;
        }
        const name = path21.basename(absPath);
        if (name.startsWith(".") || IGNORES.has(name)) {
          return;
        }
        if (stat7.isFile()) {
          stats.files++;
          const size = BigInt(stat7.size);
          stats.size += size;
          const ext = path21.extname(name).slice(1).toLowerCase() || "other";
          stats.fileStats[ext] = (stats.fileStats[ext] || 0) + 1;
          stats.langs.add(this.getLangFromExt(ext));
          if (!statsOnly && parentChildren) {
            parentChildren.push({ name, type: "file", size });
          }
          return;
        }
        if (!stat7.isDirectory()) {
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
          entries = await fs21.readdir(absPath, { withFileTypes: true });
        } catch {
          return;
        }
        const validEntries = entries.filter((e) => !e.name.startsWith(".") && !IGNORES.has(e.name)).sort((a, b) => a.name.localeCompare(b.name));
        await Promise.all(
          validEntries.map(
            (entry) => this.analyzeDir(
              path21.join(absPath, entry.name),
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
        const pkgPath = path21.join(dir, "package.json");
        try {
          const data = await fs21.readFile(pkgPath, "utf8");
          stats.pkg = JSON.parse(data);
        } catch {
        }
        if (statsOnly) {
          await this.analyzeDir(dir, 0, maxDepth, stats, true);
        } else {
          const treeRoot = { name: path21.basename(dir), type: "dir", children: [] };
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
        const targetDir = path21.resolve(context.cwd, root);
        const maxDepth = input_.maxDepth ?? 3;
        const statsOnly = !!input_.statsOnly;
        try {
          await fs21.access(targetDir);
        } catch {
          return { content: `Cannot access directory: ${targetDir}`, isError: true };
        }
        const relativeRoot = path21.relative(process.cwd(), targetDir) || ".";
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
      availableInPlanMode = false;
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
      availableInPlanMode = true;
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
      availableInPlanMode = true;
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
      availableInPlanMode = false;
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
      availableInPlanMode = false;
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
var fs22, path22, UnifiedDiffEditTool;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs22 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
    init_tool_types();
    UnifiedDiffEditTool = class {
      name = "DiffEdit";
      description = `Apply changes to a file using unified diff format. Accepts standard unified diff with @@ hunks and +/- line markers. More token-efficient than full file replacement for small changes.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
        if (!path22.isAbsolute(input.file_path))
          return "file_path must be an absolute path";
        if (typeof input.diff !== "string" || !input.diff.trim())
          return "diff must be a non-empty string";
        return null;
      }
      async execute(input, _context) {
        const filePath = input.file_path;
        const diff = input.diff;
        try {
          const content = await fs22.readFile(filePath, "utf-8");
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
          await fs22.writeFile(filePath, result.join("\n"), "utf-8");
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
var backgroundTasks, BackgroundAgentTool;
var init_background_agent = __esm({
  "src/tools/builtin/background-agent.ts"() {
    "use strict";
    init_tool_types();
    backgroundTasks = /* @__PURE__ */ new Map();
    BackgroundAgentTool = class {
      name = "BackgroundAgent";
      description = `Spawn a background agent that works independently on a task. Returns a task ID immediately. Use 'status' to check progress and retrieve results.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "agent" /* AGENT */;
      availableInPlanMode = true;
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
            }).catch((err) => {
              task.status = "error";
              task.error = err.message;
              task.completedAt = Date.now();
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
      availableInPlanMode = true;
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
      availableInPlanMode = false;
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
              const response2 = await page.goto(url, { waitUntil: "networkidle2", timeout });
              const status = response2?.status() || "unknown";
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
      availableInPlanMode = false;
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
        const { ipcMain: ipcMain3 } = await import("electron");
        const { BrowserWindow: BrowserWindow5 } = await import("electron");
        const windows = BrowserWindow5.getAllWindows();
        if (windows.length === 0) {
          return { success: false, error: "No browser window available" };
        }
        windows[0].webContents.send("browser:open", { url, title });
        return { success: true };
      }
    };
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
      availableInPlanMode = false;
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
          const { BrowserWindow: BrowserWindow5 } = await import("electron");
          const windows = BrowserWindow5.getAllWindows();
          if (windows.length === 0) {
            return {
              content: "No browser window available",
              isError: true
            };
          }
          const mainWindow = windows[0];
          switch (action) {
            case "navigate": {
              const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
              mainWindow.webContents.send("browser:navigate", {
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
              return {
                content: "Screenshot capture is not yet implemented. The browser tab has a screenshot button you can click manually.",
                metadata: { action: "screenshot" }
              };
            }
            case "close": {
              mainWindow.webContents.send("browser:close", {
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
      availableInPlanMode = false;
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
        return new Promise((resolve6, reject) => {
          debugSession.post(method, params, (err, result) => {
            if (err)
              reject(err);
            else
              resolve6(result || {});
          });
        });
      }
    };
  }
});

// src/tools/builtin/doc-gen.ts
var fs23, path23, VALID_STYLES, DocGenTool;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    path23 = __toESM(require("path"), 1);
    init_tool_types();
    VALID_STYLES = ["jsdoc", "tsdoc", "python", "auto"];
    DocGenTool = class {
      name = "DocGen";
      description = "Generate documentation stubs (JSDoc/TSDoc/Python docstrings) for functions, classes, and interfaces in a file. Detects undocumented symbols and generates template comments.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = false;
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
          const content = await fs23.readFile(filePath, "utf-8");
          const ext = path23.extname(filePath).toLowerCase();
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
              content: `Documentation preview for ${path23.basename(filePath)}:

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
          await fs23.writeFile(filePath, lines.join("\n"), "utf-8");
          return {
            content: `Generated documentation for ${undocumented.length} symbol(s) in ${path23.basename(filePath)}:
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
var fs24, vm, VALID_ACTIONS6, replContext, NotebookTool;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs24 = __toESM(require("fs/promises"), 1);
    vm = __toESM(require("vm"), 1);
    init_tool_types();
    VALID_ACTIONS6 = ["eval", "notebook_read", "notebook_edit", "notebook_add_cell", "notebook_run"];
    replContext = null;
    NotebookTool = class {
      name = "Notebook";
      description = `JavaScript/TypeScript REPL and Jupyter notebook editor. Actions: eval (evaluate JS code in persistent context), notebook_read (read .ipynb), notebook_edit (edit a cell), notebook_add_cell (add cell), notebook_run (evaluate code cells).`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
        const content = await fs24.readFile(filePath, "utf-8");
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
        const content = await fs24.readFile(filePath, "utf-8");
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
        await fs24.writeFile(filePath, JSON.stringify(nb, null, 1), "utf-8");
        return { content: `Updated cell [${index}] in ${filePath}` };
      }
      async addCell(filePath, source, cellType, afterIndex) {
        const content = await fs24.readFile(filePath, "utf-8");
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
        await fs24.writeFile(filePath, JSON.stringify(nb, null, 1), "utf-8");
        return { content: `Added ${cellType} cell at index [${insertAt}] in ${filePath}` };
      }
      async runNotebook(filePath) {
        const content = await fs24.readFile(filePath, "utf-8");
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
var import_node_child_process7, import_tree_kill2, PlatformCLIManager;
var init_platform_cli_manager = __esm({
  "src/tools/builtin/platform-cli-manager.ts"() {
    "use strict";
    import_node_child_process7 = require("child_process");
    import_tree_kill2 = __toESM(require("tree-kill"), 1);
    PlatformCLIManager = class {
      /**
       * Check if the CLI is installed and available
       */
      async isCLIInstalled() {
        return new Promise((resolve6) => {
          const proc = (0, import_node_child_process7.spawn)("which", [this.cliCommand], { stdio: "ignore" });
          proc.on("close", (code) => resolve6(code === 0));
          proc.on("error", () => resolve6(false));
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
        return new Promise((resolve6) => {
          let stdout = "";
          let stderr = "";
          let killed = false;
          const allArgs = [subcommand, ...args];
          const proc = (0, import_node_child_process7.spawn)(this.cliCommand, allArgs, {
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
            resolve6({
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
            resolve6({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: code,
              isError: code !== 0
            });
          });
          proc.on("error", (error) => {
            clearTimeout(timer);
            resolve6({
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
var import_node_child_process8, SupabaseTool;
var init_supabase_cli = __esm({
  "src/tools/builtin/supabase-cli.ts"() {
    "use strict";
    import_node_child_process8 = require("child_process");
    init_tool_types();
    init_platform_cli_manager();
    SupabaseTool = class extends PlatformCLIManager {
      name = "Supabase";
      description = "Execute Supabase CLI commands for local development, database management, and deployment. Supports init, start, stop, db operations, functions, and more. NOTE: login/logout require manual terminal use. Docker is required for local stack commands.";
      permissionLevel = "moderate" /* MODERATE */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
        return new Promise((resolve6) => {
          const proc = (0, import_node_child_process8.spawn)("docker", ["ps"], { stdio: "ignore" });
          proc.on("close", (code) => resolve6(code === 0));
          proc.on("error", () => resolve6(false));
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
      availableInPlanMode = false;
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
      availableInPlanMode = false;
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
      availableInPlanMode = true;
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
        return new Promise((resolve6) => {
          const ctx = context;
          const eventBus = ctx.eventBus;
          if (!eventBus) {
            resolve6({
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
            onResponse: (response2) => {
              let content = `User responded to: "${prompt}"

`;
              if (terminalCommand) {
                content += `Terminal command provided: \`${terminalCommand}\`

`;
              }
              if (response2) {
                content += `Response: ${response2}`;
              } else {
                content += "User confirmed completion (no text input provided).";
              }
              resolve6({
                content,
                metadata: { response: response2, hadInput: waitForInput }
              });
            },
            onCancel: () => {
              resolve6({
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
var import_node_child_process9, import_tree_kill3, processRegistry, MAX_OUTPUT_LINES, ProcessManagerTool;
var init_process_manager = __esm({
  "src/tools/builtin/process-manager.ts"() {
    "use strict";
    import_node_child_process9 = require("child_process");
    import_tree_kill3 = __toESM(require("tree-kill"), 1);
    init_tool_types();
    processRegistry = /* @__PURE__ */ new Map();
    MAX_OUTPUT_LINES = 500;
    ProcessManagerTool = class {
      name = "ProcessManager";
      description = "Start and manage long-running background processes such as dev servers, build watchers, and test runners. Use `start` to launch a named process, `wait_url` to block until a dev server is ready, `status` to read its recent output, `stop` to kill it, and `list` to see all running processes.";
      permissionLevel = "dangerous" /* DANGEROUS */;
      category = "execute" /* EXECUTE */;
      availableInPlanMode = false;
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
        const proc = (0, import_node_child_process9.spawn)("bash", ["-c", command], {
          cwd,
          env: { ...process.env },
          stdio: ["ignore", "pipe", "pipe"],
          detached: false
        });
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
        });
        proc.on("error", (err) => {
          info.running = false;
          appendOutput(info, `[Process error: ${err.message}]`);
        });
        await new Promise((resolve6) => setTimeout(resolve6, 2e3));
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
          await new Promise((resolve6) => setTimeout(resolve6, intervalMs));
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
var fs25, path24, PLAN_FILE_NAME, CreatePlanTool;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path24 = __toESM(require("path"), 1);
    init_tool_types();
    PLAN_FILE_NAME = "PLAN.md";
    CreatePlanTool = class {
      name = "CreatePlan";
      description = `Creates a PLAN.md file in the project root with a structured task list using markdown checkboxes. Use this in architect mode to create a plan that can be referenced and checked off as tasks are completed.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = true;
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
          const planPath = path24.join(context.cwd, PLAN_FILE_NAME);
          try {
            await fs25.access(planPath);
            return {
              content: `Error: PLAN.md already exists at ${planPath}. Use UpdatePlan to modify the existing plan or delete it first.`,
              isError: true
            };
          } catch {
          }
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const planContent = this.generatePlanContent({
            title,
            description,
            sections,
            notes,
            createdAt: now,
            updatedAt: now
          });
          await fs25.writeFile(planPath, planContent, "utf-8");
          const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);
          return {
            content: `Created plan at ${planPath} with ${sections.length} sections and ${totalTasks} tasks.`,
            metadata: {
              path: planPath,
              title,
              sectionCount: sections.length,
              taskCount: totalTasks
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
        lines.push(`# Project Plan: ${params.title}`);
        lines.push("");
        lines.push(`> Created: ${new Date(params.createdAt).toLocaleString()}`);
        lines.push("");
        if (params.description) {
          lines.push("## Overview");
          lines.push(params.description);
          lines.push("");
        }
        const totalTasks = params.sections.reduce((sum, s) => sum + s.tasks.length, 0);
        lines.push("## Progress");
        lines.push(`- [ ] **${totalTasks} tasks** in ${params.sections.length} sections`);
        lines.push(`- Progress: 0/${totalTasks} (0%)`);
        lines.push("");
        lines.push("## Tasks");
        lines.push("");
        for (const section of params.sections) {
          lines.push(`### ${section.title}`);
          lines.push("");
          for (const task of section.tasks) {
            lines.push(`- [ ] ${task}`);
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
var fs26, path25, UpdatePlanTool;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs26 = __toESM(require("fs/promises"), 1);
    path25 = __toESM(require("path"), 1);
    init_tool_types();
    init_create_plan();
    UpdatePlanTool = class {
      name = "UpdatePlan";
      description = `Updates the PLAN.md file - check/uncheck tasks, add new tasks or sections, or append notes. Use this to mark tasks complete as you work through the plan.`;
      permissionLevel = "moderate" /* MODERATE */;
      category = "write" /* WRITE */;
      availableInPlanMode = true;
      inputSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The update action to perform",
            enum: ["check", "uncheck", "add_task", "add_section", "append_note", "update_progress"]
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
        const validActions = ["check", "uncheck", "add_task", "add_section", "append_note", "update_progress"];
        if (!validActions.includes(action)) {
          return `action must be one of: ${validActions.join(", ")}`;
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
        try {
          const planPath = path25.join(context.cwd, PLAN_FILE_NAME);
          let content;
          try {
            content = await fs26.readFile(planPath, "utf-8");
          } catch {
            return {
              content: `Error: No PLAN.md found at ${planPath}. Use CreatePlan to create a plan first.`,
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
          await fs26.writeFile(planPath, updatedContent, "utf-8");
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
          default:
            return `Updated plan`;
        }
      }
    };
  }
});

// src/tools/builtin/read-plan.ts
var fs27, path26, ReadPlanTool;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path26 = __toESM(require("path"), 1);
    init_tool_types();
    init_create_plan();
    ReadPlanTool = class {
      name = "ReadPlan";
      description = `Reads and parses the PLAN.md file to check current status, view tasks, and see progress. Returns structured data about tasks, sections, and completion status.`;
      permissionLevel = "safe" /* SAFE */;
      category = "read" /* READ */;
      availableInPlanMode = true;
      inputSchema = {
        type: "object",
        properties: {
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
        try {
          const planPath = path26.join(context.cwd, PLAN_FILE_NAME);
          let content;
          try {
            content = await fs27.readFile(planPath, "utf-8");
          } catch {
            return {
              content: `No PLAN.md found at ${planPath}. Use CreatePlan to create a plan.`,
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
              outputContent = this.formatSummary(filteredData);
              break;
            case "structured":
            default:
              outputContent = this.formatStructured(filteredData);
              break;
          }
          return {
            content: outputContent,
            metadata: {
              exists: true,
              path: planPath,
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
      formatSummary(data) {
        const lines = [];
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
      formatStructured(data) {
        const lines = [];
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
        return `Plan: ${plan.title} - ${plan.progress.checked}/${plan.progress.total} (${plan.progress.percent}%)`;
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
        if (context.planMode && !tool.availableInPlanMode) {
          return false;
        }
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
        return new Promise((resolve6) => {
          this.eventBus.emit("permission_request", {
            sessionId: context.sessionId,
            toolName: tool.name,
            toolId,
            input,
            onAllow: () => resolve6(true),
            onDeny: () => resolve6(false),
            onAllowAlways: () => {
              this.sessionPermissions.set(tool.name, "allow");
              resolve6(true);
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
var path27, LINT_ELIGIBLE_TOOLS, FILE_PATH_TOOLS, ToolRunner;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path27 = __toESM(require("path"), 1);
    LINT_ELIGIBLE_TOOLS = /* @__PURE__ */ new Set(["Edit", "Write", "MultiFileEdit", "DiffEdit"]);
    FILE_PATH_TOOLS = /* @__PURE__ */ new Set(["Read", "Write", "Edit", "DiffEdit"]);
    ToolRunner = class {
      constructor(registry, permissionManager2, eventBus, autoLintFix = false) {
        this.registry = registry;
        this.permissionManager = permissionManager2;
        this.eventBus = eventBus;
        this.autoLintFix = autoLintFix;
      }
      autoLintFix;
      /**
       * Get access to the EventBus for tools that need to emit events
       */
      getEventBus() {
        return this.eventBus;
      }
      async execute(toolName, toolId, input, context) {
        const registration = this.registry.get(toolName);
        if (!registration) {
          return { content: `Unknown tool: ${toolName}`, isError: true };
        }
        const tool = registration.tool;
        const normalizedInput = this.normalizeInput(toolName, input, context);
        const validationError = tool.validate(normalizedInput);
        if (validationError) {
          return {
            content: this.formatValidationError(validationError, normalizedInput, context),
            isError: true,
            metadata: { validationError, normalizedInput }
          };
        }
        if (context.planMode && !tool.availableInPlanMode) {
          return {
            content: `Tool "${toolName}" is not available in plan mode (read-only).`,
            isError: true
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
        return path27.isAbsolute(trimmed) ? trimmed : path27.resolve(cwd, trimmed);
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
        const userMsg = {
          id: crypto.randomUUID(),
          role: "user",
          content: userMessage,
          timestamp: Date.now()
        };
        this._messages.push(userMsg);
        let turns = 0;
        const maxTurns = this.config.maxTurns || 50;
        while (turns < maxTurns) {
          turns++;
          const maxCtx = this.config.maxContextTokens;
          if (maxCtx && this._messages.length > 10) {
            try {
              const currentTokens = await this.getTokenCount();
              const thresholdValue = this.config.contextCompressionThreshold ?? CONTEXT_COMPRESSION_THRESHOLD;
              const threshold = maxCtx * thresholdValue;
              if (currentTokens > threshold) {
                const before = currentTokens;
                await this.compressContext();
                const after = await this.getTokenCount();
                yield {
                  type: "context_compressed",
                  removedTokens: before - after,
                  remainingTokens: after
                };
              }
            } catch {
            }
          }
          const tools = this.config.tools.filter((t) => t.enabled && (!this.config.planMode || t.tool.availableInPlanMode)).map((t) => ({
            name: t.tool.name,
            description: t.tool.description,
            inputSchema: t.tool.inputSchema
          }));
          const modelInfo = this.config.provider.getModelInfo(this.config.model);
          const thinkingConfig = this.config.thinking?.enabled && modelInfo?.capabilities.extendedThinking ? this.config.thinking : void 0;
          const request = {
            messages: this._messages,
            model: this.config.model,
            systemPrompt: this.config.systemPrompt,
            tools: tools.length > 0 ? tools : void 0,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            stream: true,
            thinking: thinkingConfig
          };
          const assistantContent = [];
          let textBuffer = "";
          const toolCallBuffers = /* @__PURE__ */ new Map();
          let activeToolId;
          const usage = { inputTokens: 0, outputTokens: 0 };
          let hasToolCalls = false;
          try {
            for await (const delta of this.config.provider.streamComplete(request)) {
              if (this.abortController.signal.aborted)
                break;
              yield { type: "stream_delta", delta };
              switch (delta.type) {
                case "text":
                  textBuffer += delta.text || "";
                  break;
                case "thinking":
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
                case "error":
                  yield { type: "error", error: delta.error || new Error("Unknown streaming error") };
                  return;
              }
            }
          } catch (error) {
            yield { type: "error", error };
            return;
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
          const turnCost = this.costTracker.calculateCost(this.config.model, usage);
          yield { type: "cost_update", totalCost: this.costTracker.totalCost, turnCost };
          yield { type: "turn_complete", message: assistantMsg };
          if (toolCalls.length === 0) {
            break;
          }
          const toolResultBlocks = [];
          for (const toolCall of toolCalls) {
            yield {
              type: "tool_call_start",
              toolName: toolCall.name,
              toolId: toolCall.id,
              input: toolCall.input
            };
            const result = await this.toolRunner.execute(
              toolCall.name,
              toolCall.id,
              toolCall.input,
              {
                cwd: this.config.cwd || process.cwd(),
                sessionId: this.id,
                planMode: this.config.planMode || false,
                abortSignal: this.abortController.signal,
                eventBus: this.toolRunner.getEventBus(),
                spawnSubAgent: async (task, planMode) => {
                  const subAgent = this.spawnSubAgent({ planMode });
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
          }
          const toolResultMsg = {
            id: crypto.randomUUID(),
            role: "user",
            content: toolResultBlocks,
            timestamp: Date.now()
          };
          this._messages.push(toolResultMsg);
          yield { type: "tool_results_complete", message: toolResultMsg };
        }
        if (turns >= maxTurns) {
          yield {
            type: "error",
            error: new Error(`Agent reached maximum turns (${maxTurns}). Stopping.`)
          };
        }
      }
      addMessage(message) {
        this._messages.push(message);
      }
      async compressContext() {
        const recentMessagesToKeep = this.config.contextRecentMessagesToKeep ?? RECENT_MESSAGES_TO_KEEP;
        const minMessagesBeforeCompress = recentMessagesToKeep + 4;
        if (this._messages.length <= minMessagesBeforeCompress)
          return;
        const firstMsg = this._messages[0];
        const recentMessages = this._messages.slice(-recentMessagesToKeep);
        const oldMessages = this._messages.slice(1, -recentMessagesToKeep);
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
        this._messages = [firstMsg, summaryMsg, ...recentMessages];
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
function getFileExtension(filePath) {
  const ext = (0, import_node_path.extname)(filePath).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}
function getFileName(filePath) {
  return (0, import_node_path.basename)(filePath);
}
function getFileHistoryManager(workspacePath) {
  if (!fileHistoryManager || fileHistoryManager["workspacePath"] !== workspacePath) {
    fileHistoryManager = new FileHistoryManager(workspacePath);
    fileHistoryManager.initialize().catch(console.error);
  }
  return fileHistoryManager;
}
var import_node_fs, import_node_path, FileHistoryManager, fileHistoryManager;
var init_file_history = __esm({
  "main/file-history.ts"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = require("path");
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
       * Get all file changes for a specific message
       */
      getMessageChanges(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = this.snapshots.get(key);
        return snapshot?.changes.filter((change) => change.afterContent !== void 0) || [];
      }
      /**
       * Check if a message has any file changes
       */
      hasChanges(conversationId, messageId) {
        const changes = this.getMessageChanges(conversationId, messageId);
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
       * Get aggregated file changes for an entire conversation
       * Groups by file path showing the final state of each file with line statistics
       */
      getAllConversationChanges(conversationId) {
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
       * Get file changes for a specific message with line statistics
       */
      getMessageChangesWithStats(conversationId, messageId) {
        const key = `${conversationId}/${messageId}`;
        const snapshot = this.snapshots.get(key);
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
       * Rollback all changes from a specific message onwards
       * This restores files to their state before the specified message was processed
       */
      async rollbackToMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = this.snapshots.get(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
          return { success: false, restoredFiles, failedFiles };
        }
        for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
          const absolutePath = this.resolveFilePath(change.filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            if (change.changeType === "delete") {
              if (change.beforeContent) {
                await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
                restoredFiles.push(change.filePath);
              }
            } else if (change.changeType === "write" && !change.beforeContent) {
              try {
                await import_node_fs.promises.unlink(absolutePath);
                restoredFiles.push(change.filePath);
              } catch (error) {
                restoredFiles.push(change.filePath);
              }
            } else {
              await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
              restoredFiles.push(change.filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to restore ${change.filePath}:`, error);
            failedFiles.push(change.filePath);
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
       * Persist a snapshot to disk for safety
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
            const stat7 = await import_node_fs.promises.stat(messageDir);
            if (!stat7.isDirectory())
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
    };
    fileHistoryManager = null;
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
        systemPromptAppend: `You are in architect mode. Focus on high-level design, planning, and code review. Prefer reading and analysis over writing code. Suggest implementation strategies without modifying files directly.

PLAN MANAGEMENT:
When creating a plan:
1. Use CreatePlan tool to generate PLAN.md with markdown checkboxes for all tasks
2. Structure tasks in logical phases/sections (e.g., "Phase 1: Setup", "Phase 2: Implementation")
3. Each task should be specific and actionable
4. Include an Overview section explaining the approach

When reviewing/updating:
1. Use ReadPlan to check current status
2. Use UpdatePlan to mark items complete or add new tasks
3. Keep the plan current with implementation progress

The PLAN.md serves as the single source of truth for the project roadmap.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      code: {
        systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code. Test when possible.

PLAN REFERENCE:
When working on a task:
1. Check if PLAN.md exists using ReadPlan tool
2. Reference the plan for context on current task and overall progress
3. After completing work, use UpdatePlan to check off relevant items
4. Add implementation notes to the plan if decisions were made

Do NOT create new plans in code mode - only reference or update existing plans.`,
        temperature: 0.3
      },
      review: {
        systemPromptAppend: "You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      security: {
        systemPromptAppend: "You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      debug: {
        systemPromptAppend: "You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.",
        temperature: 0.2
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
var import_electron, FILE_MODIFYING_TOOLS, AgentBridge, agentBridge;
var init_agent_bridge = __esm({
  "main/agent-bridge.ts"() {
    "use strict";
    import_electron = require("electron");
    init_file_history();
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
      // Initialize the bridge with agent factory
      initialize(agentFactory) {
        this.agentFactory = agentFactory;
      }
      // Set the workspace path for file history tracking
      setWorkspacePath(workspacePath) {
        this.workspacePath = workspacePath;
      }
      updateWorkspaceContext(workspacePath, systemPrompt) {
        this.workspacePath = workspacePath;
        for (const state of this.conversations.values()) {
          state.agent.updateConfig({
            cwd: workspacePath,
            systemPrompt
          });
        }
      }
      // Set the provider registry for model switching
      setProviderRegistry(registry) {
        this.providerRegistry = registry;
      }
      // Create a new conversation with optional model and provider
      createConversation(conversationId, model, provider) {
        if (!this.agentFactory) {
          console.error("AgentBridge not initialized - no agent factory");
          return false;
        }
        if (this.conversations.has(conversationId)) {
          console.warn(`Conversation ${conversationId} already exists`);
          return false;
        }
        const agent = this.agentFactory(conversationId, model, provider);
        this.conversations.set(conversationId, {
          agent,
          isRunning: false,
          abortController: null,
          pendingFileChanges: /* @__PURE__ */ new Map()
        });
        console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || "default"}, provider: ${provider || "default"})`);
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
      async sendMessage(conversationId, message, workingDirectory) {
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
        try {
          for await (const event of state.agent.run(message)) {
            if (state.abortController.signal.aborted) {
              break;
            }
            const agentEvent = event;
            if (agentEvent.type === "turn_complete") {
              const stopReason = agentEvent.message.metadata?.stopReason;
              const assistantMessageId = agentEvent.message.id;
              if (stopReason === "tool_use") {
                state.currentAssistantMessageId = assistantMessageId;
              } else {
                state.isRunning = false;
                state.currentAssistantMessageId = void 0;
                state.pendingFileChanges.clear();
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
              if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
                try {
                  const filePaths = state.pendingFileChanges.get(toolId) || [];
                  const fileHistoryManager2 = getFileHistoryManager(workingDir);
                  if (!result.isError) {
                    for (const filePath of filePaths) {
                      await fileHistoryManager2.captureAfterChange(
                        conversationId,
                        state.currentAssistantMessageId,
                        toolId,
                        filePath
                      );
                    }
                    const changes = fileHistoryManager2.getMessageChanges(
                      conversationId,
                      state.currentAssistantMessageId
                    );
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
                    }
                  }
                } catch (error) {
                  console.error("[AgentBridge] Failed to capture after-change state:", error);
                } finally {
                  state.pendingFileChanges.delete(toolId);
                }
              }
            }
            this.emitEvent(conversationId, agentEvent);
            if (agentEvent.type === "error") {
              state.isRunning = false;
              state.currentAssistantMessageId = void 0;
              state.pendingFileChanges.clear();
            }
          }
        } catch (error) {
          console.error(`Agent error in conversation ${conversationId}:`, error);
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
      respondUserInput(requestId, response2, cancelled) {
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
        pending.onResponse(response2);
        this.emitEvent(pending.conversationId, { type: "user_input_responded", requestId, response: response2 });
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
        const state = this.conversations.get(conversationId);
        if (!state) {
          console.error(`Conversation ${conversationId} not found`);
          return false;
        }
        try {
          let newProvider = state.agent.config.provider;
          if (providerName && providerName !== state.agent.config.provider.name) {
            if (this.providerRegistry) {
              const resolved = this.providerRegistry.getProvider(providerName);
              if (resolved && resolved.isAvailable()) {
                newProvider = resolved;
                console.log(`[AgentBridge] Switched provider to ${providerName} for conversation ${conversationId}`);
              } else {
                console.warn(`[AgentBridge] Provider ${providerName} not available, keeping current provider`);
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
          if (modeConfig.planMode !== void 0) {
            updates.planMode = modeConfig.planMode;
          }
          const currentSystemPrompt = state.agent.config.systemPrompt || "";
          const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug) mode\.?.*/s, "");
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
      }
      onEvent(callback) {
        this.eventListeners.add(callback);
        return () => this.eventListeners.delete(callback);
      }
      emitEvent(conversationId, event) {
        const eventWithId = { ...event, conversationId };
        import_electron.BrowserWindow.getAllWindows().forEach((window) => {
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
        import_electron.BrowserWindow.getAllWindows().forEach((window) => {
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

// main/chat-storage.ts
function setSyncNotifier(fn) {
  syncNotifier = fn;
}
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
var fs29, path28, import_electron2, syncNotifier, STORAGE_VERSION, CHATS_DIR, WORKSPACE_CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs29 = __toESM(require("fs/promises"), 1);
    path28 = __toESM(require("path"), 1);
    import_electron2 = require("electron");
    syncNotifier = null;
    STORAGE_VERSION = "1.0.0";
    CHATS_DIR = ".omnicode/chats";
    WORKSPACE_CHATS_DIR = "chats";
    MAX_CHATS_PER_WORKSPACE = 50;
    ChatStorage = class {
      workspacesBaseDir = null;
      /**
       * Get the base directory for workspace storage in app data
       */
      async getWorkspacesBaseDir() {
        if (this.workspacesBaseDir)
          return this.workspacesBaseDir;
        this.workspacesBaseDir = path28.join(import_electron2.app.getPath("userData"), "workspaces");
        return this.workspacesBaseDir;
      }
      /**
       * Get the chats directory path based on storage context
       */
      async getChatsDir(context) {
        if (context.type === "workspace" && context.workspace) {
          const workspacesDir = await this.getWorkspacesBaseDir();
          const workspaceDir = path28.join(workspacesDir, context.workspace.id);
          return path28.join(workspaceDir, WORKSPACE_CHATS_DIR);
        } else if (context.type === "project" && context.projectPath) {
          return path28.join(context.projectPath, CHATS_DIR);
        }
        throw new Error("Invalid storage context");
      }
      /**
       * Save a conversation to disk
       */
      async saveConversation(context, conversation) {
        try {
          if (!context || context.type === "project" && !context.projectPath || context.type === "workspace" && !context.workspace) {
            return { success: false, error: "Invalid storage context provided" };
          }
          const chatsDir = await this.getChatsDir(context);
          await fs29.mkdir(chatsDir, { recursive: true });
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
            maxContextTokens: conversation.maxContextTokens
          };
          const filePath = path28.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs29.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          let isNew = false;
          try {
            await fs29.access(filePath);
          } catch {
            isNew = true;
          }
          await fs29.rename(tempPath, filePath);
          syncNotifier?.({
            type: isNew ? "conversation_created" : "conversation_updated",
            conversationId: conversation.id,
            title: conversation.title,
            messageCount: conversation.messages.length,
            updatedAt: conversation.updatedAt
          });
          return { success: true };
        } catch (error) {
          console.error("[ChatStorage] Failed to save conversation:", error);
          return { success: false, error: error.message };
        }
      }
      /**
       * Load all conversations from storage
       */
      async loadConversations(context) {
        try {
          if (!context || context.type === "project" && !context.projectPath || context.type === "workspace" && !context.workspace) {
            return { conversations: [] };
          }
          const chatsDir = await this.getChatsDir(context);
          try {
            await fs29.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs29.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path28.join(chatsDir, file.name);
              const content = await fs29.readFile(filePath, "utf-8");
              const serialized = JSON.parse(content);
              const migrated = this.migrateIfNeeded(serialized);
              const loadedConv = {
                id: migrated.id,
                title: migrated.title,
                messages: migrated.messages,
                toolCalls: migrated.toolCalls,
                createdAt: migrated.createdAt,
                updatedAt: migrated.updatedAt,
                contextTokens: migrated.contextTokens,
                maxContextTokens: migrated.maxContextTokens,
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
      async deleteConversation(context, conversationId) {
        try {
          if (!context || context.type === "project" && !context.projectPath || context.type === "workspace" && !context.workspace) {
            return { success: false, error: "Invalid storage context provided" };
          }
          const chatsDir = await this.getChatsDir(context);
          const filePath = path28.join(chatsDir, `${conversationId}.json`);
          await fs29.unlink(filePath);
          syncNotifier?.({ type: "conversation_deleted", conversationId });
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
      async listConversations(context) {
        try {
          if (!context || context.type === "project" && !context.projectPath || context.type === "workspace" && !context.workspace) {
            return { conversations: [] };
          }
          const chatsDir = await this.getChatsDir(context);
          try {
            await fs29.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs29.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path28.join(chatsDir, file.name);
              const content = await fs29.readFile(filePath, "utf-8");
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
      async cleanupOldConversations(context, maxChats = MAX_CHATS_PER_WORKSPACE) {
        try {
          const { conversations } = await this.listConversations(context);
          if (conversations.length <= maxChats) {
            return { deleted: 0 };
          }
          const toDelete = conversations.slice(maxChats);
          let deleted = 0;
          for (const conv of toDelete) {
            const result = await this.deleteConversation(context, conv.id);
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
      /**
       * Backward compatibility: Save conversation using project path directly
       */
      async saveConversationForProject(projectPath, conversation) {
        return this.saveConversation({ type: "project", projectPath }, conversation);
      }
      /**
       * Backward compatibility: Load conversations using project path directly
       */
      async loadConversationsForProject(projectPath) {
        return this.loadConversations({ type: "project", projectPath });
      }
      /**
       * Backward compatibility: Delete conversation using project path directly
       */
      async deleteConversationForProject(projectPath, conversationId) {
        return this.deleteConversation({ type: "project", projectPath }, conversationId);
      }
      /**
       * Backward compatibility: List conversations using project path directly
       */
      async listConversationsForProject(projectPath) {
        return this.listConversations({ type: "project", projectPath });
      }
      /**
       * Save conversation for a workspace
       */
      async saveConversationForWorkspace(workspace, conversation) {
        return this.saveConversation({ type: "workspace", workspace }, conversation);
      }
      /**
       * Load conversations for a workspace
       */
      async loadConversationsForWorkspace(workspace) {
        return this.loadConversations({ type: "workspace", workspace });
      }
      /**
       * Delete conversation for a workspace
       */
      async deleteConversationForWorkspace(workspace, conversationId) {
        return this.deleteConversation({ type: "workspace", workspace }, conversationId);
      }
      /**
       * List conversations for a workspace
       */
      async listConversationsForWorkspace(workspace) {
        return this.listConversations({ type: "workspace", workspace });
      }
    };
    chatStorage = null;
  }
});

// src/types/workspace.ts
function createWorkspace(options) {
  const now = Date.now();
  return {
    version: WORKSPACE_VERSION,
    id: generateWorkspaceId(),
    name: options.name,
    folders: (options.folders || []).map((path35, index) => ({
      id: `folder-${index}-${now}`,
      path: path35
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
var fs30, path29, import_electron3, WORKSPACES_DIR, WORKSPACE_METADATA_FILE, WorkspaceStorage;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs30 = __toESM(require("fs/promises"), 1);
    path29 = __toESM(require("path"), 1);
    import_electron3 = require("electron");
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
        const userData = import_electron3.app.getPath("userData");
        this.workspacesDir = path29.join(userData, WORKSPACES_DIR);
        await fs30.mkdir(this.workspacesDir, { recursive: true });
        return this.workspacesDir;
      }
      /**
       * Get the storage path for a specific workspace's app data
       */
      async getWorkspaceStoragePath(workspaceId) {
        const workspacesDir = await this.getWorkspacesDir();
        const storagePath = path29.join(workspacesDir, workspaceId);
        await fs30.mkdir(storagePath, { recursive: true });
        return storagePath;
      }
      /**
       * Get the metadata file path
       */
      async getMetadataPath() {
        const workspacesDir = await this.getWorkspacesDir();
        return path29.join(workspacesDir, WORKSPACE_METADATA_FILE);
      }
      /**
       * Load all workspace metadata
       */
      async loadMetadata() {
        try {
          const metadataPath = await this.getMetadataPath();
          const content = await fs30.readFile(metadataPath, "utf-8");
          const data = JSON.parse(content);
          return new Map(Object.entries(data));
        } catch {
          return /* @__PURE__ */ new Map();
        }
      }
      /**
       * Save workspace metadata
       */
      async saveMetadata(metadata) {
        const metadataPath = await this.getMetadataPath();
        const data = Object.fromEntries(metadata);
        await fs30.writeFile(metadataPath, JSON.stringify(data, null, 2), "utf-8");
      }
      /**
       * Create a new workspace
       */
      async createWorkspace(options) {
        try {
          const workspace = createWorkspace(options);
          await this.getWorkspaceStoragePath(workspace.id);
          const metadata = await this.loadMetadata();
          metadata.set(workspace.id, {
            id: workspace.id,
            lastOpenedAt: Date.now()
          });
          await this.saveMetadata(metadata);
          return { success: true, workspace };
        } catch (error) {
          console.error("[WorkspaceStorage] Failed to create workspace:", error);
          return { success: false, error: error.message };
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
          await fs30.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
          await fs30.rename(tempPath, targetPath);
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
          const content = await fs30.readFile(filePath, "utf-8");
          const workspace = JSON.parse(content);
          if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
            return { success: false, error: "Invalid workspace file format" };
          }
          const baseDir = path29.dirname(filePath);
          workspace.folders = workspace.folders.map((folder) => ({
            ...folder,
            path: path29.isAbsolute(folder.path) ? folder.path : path29.resolve(baseDir, folder.path)
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
            await fs30.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
            await fs30.rename(tempPath, meta.filePath);
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
              await fs30.unlink(meta.filePath);
            } catch {
            }
          }
          if (deleteData) {
            const storagePath = await this.getWorkspaceStoragePath(workspaceId);
            try {
              await fs30.rm(storagePath, { recursive: true, force: true });
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
          const exportDir = path29.join(targetDir, `${workspace.name}-workspace`);
          await fs30.mkdir(exportDir, { recursive: true });
          const exportWorkspace = {
            ...workspace,
            folders: workspace.folders.map((f) => ({
              ...f,
              path: path29.relative(exportDir, f.path)
            }))
          };
          const workspaceFilePath = path29.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
          await fs30.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), "utf-8");
          const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
          const targetStoragePath = path29.join(exportDir, "workspace-data");
          try {
            await fs30.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
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
          const entries = await fs30.readdir(sourceDir, { withFileTypes: true });
          const workspaceFile = entries.find(
            (e) => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
          );
          if (!workspaceFile) {
            return { success: false, error: "No workspace file found in source directory" };
          }
          const workspaceFilePath = path29.join(sourceDir, workspaceFile.name);
          const result = await this.loadWorkspaceFromFile(workspaceFilePath);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const sourceDataPath = path29.join(sourceDir, "workspace-data");
          try {
            await fs30.access(sourceDataPath);
            const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
            await fs30.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
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
            name: folderName || path29.basename(folderPath)
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
              const dir = path29.dirname(oldPath);
              const newPath = path29.join(dir, `${newName}${WORKSPACE_FILE_EXTENSION}`);
              try {
                await fs30.rename(oldPath, newPath);
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
  }
});

// src/memory/workspace-indexer.ts
var import_electron4, import_fast_glob4, DEFAULT_SYNC_INTERVAL_MS2, DEFAULT_INDEXING_CONFIG3;
var init_workspace_indexer = __esm({
  "src/memory/workspace-indexer.ts"() {
    "use strict";
    import_electron4 = require("electron");
    import_fast_glob4 = __toESM(require("fast-glob"), 1);
    init_semantic_memory();
    init_smart_chunker();
    DEFAULT_SYNC_INTERVAL_MS2 = 5 * 60 * 1e3;
    DEFAULT_INDEXING_CONFIG3 = {
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
  if (Store)
    return Store;
  const storeModule = await import("electron-store");
  Store = storeModule.default || storeModule;
  return Store;
}
async function getUsageStorage() {
  if (!usageStorage) {
    usageStorage = new UsageStorage();
    await usageStorage.initialize();
  }
  return usageStorage;
}
var fs31, path30, Store, USAGE_DIR, USAGE_FILE, UsageStorage, usageStorage;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs31 = __toESM(require("fs/promises"), 1);
    path30 = __toESM(require("path"), 1);
    init_usage_types();
    Store = null;
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
        return path30.join(workspacePath, USAGE_DIR, USAGE_FILE);
      }
      /**
       * Ensure usage directory exists
       */
      async ensureUsageDir(workspacePath) {
        const usageDir = path30.join(workspacePath, USAGE_DIR);
        await fs31.mkdir(usageDir, { recursive: true });
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
          const content = await fs31.readFile(usagePath, "utf-8");
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
        await fs31.writeFile(usagePath, JSON.stringify(data, null, 2), "utf-8");
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
          const content = await fs31.readFile(usagePath, "utf-8");
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
            const content = await fs31.readFile(usagePath, "utf-8");
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

// main/settings.ts
var import_electron5, defaultSettings, settingsManagerInstance, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron5 = require("electron");
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
        defaultProvider: "anthropic",
        defaultModel: "claude-sonnet-4-5",
        temperature: 0.7,
        maxContextTokens: 128e3,
        autoRunMode: "always",
        showTokenCosts: true,
        showThinking: true,
        autoAcceptEdits: false,
        contextCompressionThreshold: 0.9,
        contextRecentMessagesToKeep: 6,
        maxTurns: 50
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
        defaultFolder: null,
        defaultWorkspace: null,
        // @deprecated
        recentFolders: [],
        recentWorkspaces: [],
        maxRecentFolders: 10,
        maxRecentWorkspaces: 10,
        followSymlinks: false
      },
      workspaces: {
        savedWorkspaces: [],
        maxRecentWorkspaces: 10
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
      usage: {
        monthlyLimit: null,
        alertThresholds: [0.8, 0.95, 1],
        dataRetentionMonths: 12,
        showInStatusBar: true
      },
      notifications: {
        enabled: true,
        soundEnabled: true,
        playOnUserInput: true,
        playOnResponseComplete: true
      },
      remoteAccess: {
        enabled: false,
        ngrokAuthToken: "",
        apiKey: null,
        port: 3e3,
        allowedOrigins: [],
        rateLimitRequests: 100,
        rateLimitWindowMs: 15 * 60 * 1e3,
        // 15 minutes
        sharedWorkspaces: [],
        activeWorkspaceId: null
      }
    };
    settingsManagerInstance = null;
    syncManagerProxy = {
      get: (path35) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path35);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path35, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path35, value);
      },
      reset: (path35) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path35);
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
      addSavedWorkspace: (workspacePath) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.addSavedWorkspace(workspacePath);
      },
      removeSavedWorkspace: (workspacePath) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.removeSavedWorkspace(workspacePath);
      },
      getSavedWorkspaces: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getSavedWorkspaces();
      },
      resolveSetting: (key, workspaceSettings, projectSettings) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.resolveSetting(key, workspaceSettings, projectSettings);
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

// main/notifications.ts
var import_electron6;
var init_notifications = __esm({
  "main/notifications.ts"() {
    "use strict";
    import_electron6 = require("electron");
    init_settings();
  }
});

// main/terminal-manager.ts
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path31.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path31.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs32.existsSync(helperPath)) {
      fs32.chmodSync(helperPath, 493);
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
  const shell2 = getShell();
  const resolvedCwd = path31.resolve(cwd || os2.homedir());
  const safeCwd = fs32.existsSync(resolvedCwd) ? resolvedCwd : os2.homedir();
  const ptyProcess = pty.spawn(shell2, [], {
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
  });
  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:exit", { id });
    }
  });
  sessions.set(id, { id, pty: ptyProcess });
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
var pty, os2, path31, fs32, sessions;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os2 = __toESM(require("os"), 1);
    path31 = __toESM(require("path"), 1);
    fs32 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
    sessions = /* @__PURE__ */ new Map();
  }
});

// main/ipc-handlers.ts
function setAgentRef(agent) {
  agentRef = agent;
}
function setToolsRef(tools) {
  toolsRef = tools;
}
function setConfigRef(config) {
  configRef = config;
}
var import_electron7, fs33, path32, agentRef, toolsRef, configRef, chatStorageRef;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    "use strict";
    import_electron7 = require("electron");
    fs33 = __toESM(require("fs/promises"), 1);
    path32 = __toESM(require("path"), 1);
    init_core_integration();
    init_chat_storage();
    init_workspace_storage();
    init_workspace_indexer();
    init_usage_storage();
    init_file_history();
    init_notifications();
    init_terminal_manager();
    init_settings();
    init_large_file_writer();
    init_project_indexer();
    agentRef = null;
    toolsRef = null;
    configRef = null;
    chatStorageRef = getChatStorage();
  }
});

// main/remote-auth.ts
function validateApiKey(req, res, next) {
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
  return (0, import_node_crypto.randomBytes)(32).toString("hex");
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
var import_node_crypto, crypto2;
var init_remote_auth = __esm({
  "main/remote-auth.ts"() {
    "use strict";
    import_node_crypto = require("crypto");
    init_settings();
    crypto2 = __toESM(require("crypto"), 1);
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
  Array.from(syncConnections).forEach((res) => {
    try {
      res.end();
    } catch {
    }
  });
  syncConnections.clear();
  console.log("[RemoteEventEmitter] Cleaned up all connections");
}
function registerSyncConnection(res) {
  syncConnections.add(res);
  console.log(`[RemoteEventEmitter] Registered sync connection (total: ${syncConnections.size})`);
  res.on("close", () => {
    syncConnections.delete(res);
    console.log(`[RemoteEventEmitter] Sync connection closed (remaining: ${syncConnections.size})`);
  });
  res.on("error", () => {
    syncConnections.delete(res);
  });
}
function broadcastSyncEvent(event) {
  if (syncConnections.size === 0)
    return;
  const sseData = `data: ${JSON.stringify(event)}

`;
  Array.from(syncConnections).forEach((res) => {
    try {
      res.write(sseData);
    } catch {
      syncConnections.delete(res);
    }
  });
  console.log(`[RemoteEventEmitter] Broadcast sync event: ${event.type} for ${event.conversationId}`);
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
    return;
  }
  const sseData = `data: ${JSON.stringify(eventData)}

`;
  Array.from(responseSet).forEach((res) => {
    try {
      res.write(sseData);
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
var connections, syncConnections, unsubscribe;
var init_remote_event_emitter = __esm({
  "main/remote-event-emitter.ts"() {
    "use strict";
    init_agent_bridge();
    connections = /* @__PURE__ */ new Map();
    syncConnections = /* @__PURE__ */ new Set();
    unsubscribe = null;
  }
});

// main/shared-workspace-manager.ts
function getSharedWorkspaceManager() {
  if (!sharedWorkspaceManager) {
    sharedWorkspaceManager = new SharedWorkspaceManager();
  }
  return sharedWorkspaceManager;
}
var fs34, path33, SHARED_WORKSPACES_KEY, ACTIVE_WORKSPACE_KEY, SharedWorkspaceManager, sharedWorkspaceManager;
var init_shared_workspace_manager = __esm({
  "main/shared-workspace-manager.ts"() {
    "use strict";
    fs34 = __toESM(require("fs/promises"), 1);
    path33 = __toESM(require("path"), 1);
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
                await fs34.access(ws.filePath);
                validWorkspaces.push(ws);
              } catch {
                console.log(`[SharedWorkspaceManager] Skipping missing workspace: ${ws.filePath}`);
              }
            }
            this.sharedWorkspaces = validWorkspaces;
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
        try {
          await fs34.access(workspaceFilePath);
          if (!workspaceFilePath.endsWith(".omnicode-workspace")) {
            throw new Error("Not a valid workspace file");
          }
          const existing = this.sharedWorkspaces.find((ws) => ws.filePath === workspaceFilePath);
          if (existing) {
            console.log(`[SharedWorkspaceManager] Workspace already shared: ${workspaceFilePath}`);
            return existing;
          }
          const content = await fs34.readFile(workspaceFilePath, "utf-8");
          const workspace = JSON.parse(content);
          const sharedWorkspace = {
            sharedId: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: workspace.id,
            filePath: workspaceFilePath,
            name: workspace.name,
            folderCount: workspace.folders.length,
            folders: workspace.folders.map((f) => ({
              id: f.id,
              path: f.path,
              name: f.name || path33.basename(f.path)
            })),
            isActive: this.sharedWorkspaces.length === 0,
            // First one is active by default
            addedAt: Date.now(),
            isSingleFolder: false
          };
          this.sharedWorkspaces.push(sharedWorkspace);
          if (this.sharedWorkspaces.length === 1) {
            this.activeWorkspaceId = sharedWorkspace.sharedId;
          }
          await this.saveToSettings();
          console.log(`[SharedWorkspaceManager] Added workspace: ${sharedWorkspace.name}`);
          return sharedWorkspace;
        } catch (error) {
          console.error("[SharedWorkspaceManager] Failed to add workspace:", error);
          return null;
        }
      }
      /**
       * Add a single folder as a workspace (for folder-only mode)
       */
      async addFolder(folderPath, name) {
        try {
          const stats = await fs34.stat(folderPath);
          if (!stats.isDirectory()) {
            throw new Error("Path is not a directory");
          }
          const existing = this.sharedWorkspaces.find(
            (ws) => ws.isSingleFolder && ws.filePath === folderPath
          );
          if (existing) {
            console.log(`[SharedWorkspaceManager] Folder already shared: ${folderPath}`);
            return existing;
          }
          const folderName = name || path33.basename(folderPath);
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

// main/remote-server.ts
var remote_server_exports = {};
__export(remote_server_exports, {
  getRemoteServerStatus: () => getRemoteServerStatus,
  initializeRemoteServer: () => initializeRemoteServer,
  stopRemoteServer: () => stopRemoteServer
});
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
    const ngrokAuthToken = settingsManager.get("remoteAccess.ngrokAuthToken");
    const apiKey = ensureApiKey();
    app4 = (0, import_express.default)();
    setupMiddleware(app4);
    setupRoutes(app4);
    await new Promise((resolve6, reject) => {
      server = app4.listen(port, () => {
        console.log(`[RemoteServer] Express server running on port ${port}`);
        resolve6();
      });
      server.on("error", (error) => {
        reject(error);
      });
    });
    if (ngrokAuthToken) {
      try {
        ngrokListener = await ngrok.forward({
          addr: port,
          authtoken: ngrokAuthToken
        });
        publicUrl = ngrokListener.url() || null;
        console.log(`[RemoteServer] Ngrok tunnel established: ${publicUrl}`);
      } catch (error) {
        console.error("[RemoteServer] Failed to create ngrok tunnel:", error);
        publicUrl = `http://localhost:${port}`;
      }
    } else {
      console.warn("[RemoteServer] No ngrok auth token configured. Only local access available.");
      publicUrl = `http://localhost:${port}`;
    }
    initializeEventEmitter();
    setSyncNotifier((event) => broadcastSyncEvent(event));
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
  cleanupEventEmitter();
  if (ngrokListener) {
    try {
      await ngrokListener.close();
    } catch {
    }
    ngrokListener = null;
  }
  if (server) {
    await new Promise((resolve6) => {
      server.close(() => {
        resolve6();
      });
    });
    server = null;
  }
  app4 = null;
  isRunning = false;
  publicUrl = null;
  terminalOutputs.clear();
  console.log("[RemoteServer] Server stopped");
}
function setupMiddleware(app5) {
  app5.use(import_express.default.json({ limit: "10mb" }));
  app5.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
  const corsOptions = getCorsOptions();
  app5.use((0, import_cors.default)(corsOptions));
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
  app5.use(limiter);
}
function setupRoutes(app5) {
  app5.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      running: isRunning,
      url: publicUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app5.use("/api", validateApiKey);
  setupConfigRoutes(app5);
  setupWorkspaceRoutes(app5);
  setupAgentRoutes(app5);
  setupFileRoutes(app5);
  setupTerminalRoutes(app5);
  setupToolRoutes(app5);
  app5.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app5.use((err, _req, res, _next) => {
    console.error("[RemoteServer] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
}
function setupConfigRoutes(app5) {
  app5.get("/api/config", async (_req, res) => {
    try {
      const models = agentBridge.getActiveConversations();
      res.json({
        models,
        workingDirectory: getWorkingDirectory(),
        version: process.env.npm_package_version || "unknown"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/models", async (_req, res) => {
    try {
      const models = agentBridge.getAvailableModels();
      res.json({
        models,
        count: models.length
      });
    } catch (error) {
      console.error("[RemoteServer] Error fetching models:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
function setupWorkspaceRoutes(app5) {
  const workspaceManager = getSharedWorkspaceManager();
  app5.get("/api/workspaces", async (_req, res) => {
    try {
      const workspaces = workspaceManager.getSharedWorkspaces();
      const activeWorkspace = workspaceManager.getActiveWorkspace();
      res.json({
        workspaces: workspaces.map((ws) => ({
          sharedId: ws.sharedId,
          workspaceId: ws.workspaceId,
          name: ws.name,
          folderCount: ws.folderCount,
          isActive: ws.isActive,
          isSingleFolder: ws.isSingleFolder,
          addedAt: ws.addedAt
        })),
        activeWorkspaceId: activeWorkspace?.sharedId || null,
        count: workspaces.length
      });
    } catch (error) {
      console.error("[RemoteServer] Error fetching workspaces:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/workspaces/:sharedId", async (req, res) => {
    try {
      const { sharedId } = req.params;
      const workspace = workspaceManager.getWorkspaceById(sharedId);
      if (!workspace) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      res.json({
        sharedId: workspace.sharedId,
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        folderCount: workspace.folderCount,
        folders: workspace.folders.map((f) => ({
          id: f.id,
          path: f.path,
          name: f.name
        })),
        isActive: workspace.isActive,
        isSingleFolder: workspace.isSingleFolder,
        addedAt: workspace.addedAt
      });
    } catch (error) {
      console.error("[RemoteServer] Error fetching workspace:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/workspaces/:sharedId/folders", async (req, res) => {
    try {
      const { sharedId } = req.params;
      const folders = workspaceManager.getWorkspaceFolders(sharedId);
      if (folders.length === 0) {
        res.status(404).json({ error: "Workspace not found or has no folders" });
        return;
      }
      res.json({
        sharedId,
        folders: folders.map((f) => ({
          id: f.id,
          path: f.path,
          name: f.name
        })),
        count: folders.length
      });
    } catch (error) {
      console.error("[RemoteServer] Error fetching workspace folders:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/workspaces/switch", async (req, res) => {
    try {
      const { sharedId } = req.body;
      if (!sharedId) {
        res.status(400).json({ error: "Missing sharedId" });
        return;
      }
      const success = workspaceManager.setActiveWorkspace(sharedId);
      if (success) {
        const workspace = workspaceManager.getActiveWorkspace();
        res.json({
          success: true,
          activeWorkspace: workspace ? {
            sharedId: workspace.sharedId,
            name: workspace.name,
            workingDirectory: workspace.folders[0]?.path || null
          } : null
        });
      } else {
        res.status(400).json({ error: "Failed to switch workspace - workspace not found" });
      }
    } catch (error) {
      console.error("[RemoteServer] Error switching workspace:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/workspaces/active", async (_req, res) => {
    try {
      const workspace = workspaceManager.getActiveWorkspace();
      if (!workspace) {
        res.json({
          activeWorkspace: null,
          workingDirectory: null
        });
        return;
      }
      res.json({
        activeWorkspace: {
          sharedId: workspace.sharedId,
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          folderCount: workspace.folderCount,
          folders: workspace.folders.map((f) => ({
            id: f.id,
            path: f.path,
            name: f.name
          })),
          isSingleFolder: workspace.isSingleFolder
        },
        workingDirectory: workspace.folders[0]?.path || null
      });
    } catch (error) {
      console.error("[RemoteServer] Error fetching active workspace:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
function setupAgentRoutes(app5) {
  app5.post("/api/agent/create-conversation", async (req, res) => {
    try {
      const { conversationId, model, provider } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const success = agentBridge.createConversation(conversationId, model, provider);
      if (success) {
        res.json({ success: true, conversationId });
      } else {
        res.status(400).json({ error: "Failed to create conversation" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/agent/send-message", async (req, res) => {
    try {
      const { conversationId, message, workingDirectory } = req.body;
      if (!conversationId || !message) {
        res.status(400).json({ error: "Missing conversationId or message" });
        return;
      }
      agentBridge.sendMessage(conversationId, message, workingDirectory).catch((error) => {
        console.error(`[RemoteServer] Error sending message to ${conversationId}:`, error);
      });
      res.json({ success: true, conversationId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/agent/abort", async (req, res) => {
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
  app5.post("/api/agent/close-conversation", async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId" });
        return;
      }
      const success = agentBridge.closeConversation(conversationId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/agent/conversations", async (_req, res) => {
    try {
      const workspacePath = getWorkingDirectory();
      const chatStorage2 = getChatStorage();
      const { conversations: savedConversations, error: storageError } = await chatStorage2.listConversations(workspacePath);
      if (storageError) {
        console.error("[RemoteServer] Error loading conversations from storage:", storageError);
      }
      const activeConversationIds = agentBridge.getActiveConversations();
      const savedMap = new Map(savedConversations.map((c) => [c.id, c]));
      for (const activeId of activeConversationIds) {
        if (!savedMap.has(activeId)) {
          savedConversations.push({
            id: activeId,
            title: "Active Conversation",
            updatedAt: Date.now(),
            messageCount: 0
          });
        }
      }
      savedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      res.json({
        conversations: savedConversations,
        total: savedConversations.length
      });
    } catch (error) {
      console.error("[RemoteServer] Error in /api/agent/conversations:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/agent/conversation/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workspacePath = getWorkingDirectory();
      const chatStorage2 = getChatStorage();
      const { conversations, error } = await chatStorage2.loadConversations(workspacePath);
      if (error) {
        return res.status(500).json({ error });
      }
      const conversation = conversations.find((c) => c.id === id);
      if (!conversation) {
        if (agentBridge.hasConversation(id)) {
          return res.json({
            id,
            title: "Active Conversation",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("[RemoteServer] Error in /api/agent/conversation/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/sync/events", validateApiKey, (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    registerSyncConnection(res);
    res.write(`data: ${JSON.stringify({ type: "sync_connected", timestamp: Date.now() })}

`);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
    });
  });
  app5.get("/api/agent/events", async (req, res) => {
    const conversationId = req.query.conversationId;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
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
  app5.post("/api/agent/respond-permission", async (req, res) => {
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
  app5.post("/api/agent/respond-user-input", async (req, res) => {
    try {
      const { requestId, response: response2, cancelled } = req.body;
      if (!requestId) {
        res.status(400).json({ error: "Missing requestId" });
        return;
      }
      const success = agentBridge.respondUserInput(requestId, response2 || "", cancelled || false);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupFileRoutes(app5) {
  app5.get("/api/files/read", async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        res.status(400).json({ error: "Missing path query parameter" });
        return;
      }
      const resolvedPath = path34.isAbsolute(filePath) ? filePath : path34.join(getWorkingDirectory(), filePath);
      const content = await fs35.readFile(resolvedPath, "utf-8");
      res.json({ content, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/files/write", async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === void 0) {
        res.status(400).json({ error: "Missing path or content" });
        return;
      }
      const resolvedPath = path34.isAbsolute(filePath) ? filePath : path34.join(getWorkingDirectory(), filePath);
      await fs35.mkdir(path34.dirname(resolvedPath), { recursive: true });
      await fs35.writeFile(resolvedPath, content, "utf-8");
      const written = await fs35.readFile(resolvedPath, "utf-8");
      if (written !== content) {
        res.status(500).json({ error: "Write verification failed" });
        return;
      }
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/files/edit", async (req, res) => {
    try {
      const { path: filePath, oldString, newString } = req.body;
      if (!filePath || oldString === void 0 || newString === void 0) {
        res.status(400).json({ error: "Missing path, oldString, or newString" });
        return;
      }
      const resolvedPath = path34.isAbsolute(filePath) ? filePath : path34.join(getWorkingDirectory(), filePath);
      const content = await fs35.readFile(resolvedPath, "utf-8");
      if (!content.includes(oldString)) {
        res.status(400).json({ error: "Old string not found in file" });
        return;
      }
      const newContent = content.replace(oldString, newString);
      await fs35.writeFile(resolvedPath, newContent, "utf-8");
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.get("/api/files/list", async (req, res) => {
    try {
      const dirPath = req.query.path || getWorkingDirectory();
      const resolvedPath = path34.isAbsolute(dirPath) ? dirPath : path34.join(getWorkingDirectory(), dirPath);
      const entries = await fs35.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path34.join(resolvedPath, entry.name)
      }));
      res.json({ files, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/files/mkdir", async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: "Missing path" });
        return;
      }
      const resolvedPath = path34.isAbsolute(dirPath) ? dirPath : path34.join(getWorkingDirectory(), dirPath);
      await fs35.mkdir(resolvedPath, { recursive: true });
      res.json({ success: true, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
function setupTerminalRoutes(app5) {
  app5.post("/api/terminal/create", async (req, res) => {
    try {
      const { id, cwd, cols, rows } = req.body;
      if (!id) {
        res.status(400).json({ error: "Missing terminal id" });
        return;
      }
      const mainWindow = import_electron8.BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        res.status(500).json({ error: "No main window available" });
        return;
      }
      const terminalCwd = cwd || getWorkingDirectory();
      const success = createTerminal(id, terminalCwd, cols || 80, rows || 24, mainWindow);
      terminalOutputs.set(id, { callbacks: /* @__PURE__ */ new Set(), buffer: [] });
      res.json({ success, id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/terminal/write", async (req, res) => {
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
  app5.post("/api/terminal/resize", async (req, res) => {
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
  app5.post("/api/terminal/destroy", async (req, res) => {
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
  app5.get("/api/terminal/stream/:id", async (req, res) => {
    const { id } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ type: "connected", terminalId: id })}

`);
    const keepAlive = setInterval(() => {
      res.write(":keepalive\n\n");
    }, 3e4);
    res.on("close", () => {
      clearInterval(keepAlive);
    });
  });
}
function setupToolRoutes(app5) {
  app5.get("/api/tools/list", async (_req, res) => {
    try {
      res.json({ tools: [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app5.post("/api/tools/execute", async (req, res) => {
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
var import_express, import_cors, import_express_rate_limit, ngrok, fs35, path34, import_electron8, app4, server, ngrokListener, isRunning, publicUrl, port, terminalOutputs;
var init_remote_server = __esm({
  "main/remote-server.ts"() {
    "use strict";
    import_express = __toESM(require("express"), 1);
    import_cors = __toESM(require("cors"), 1);
    import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
    ngrok = __toESM(require("@ngrok/ngrok"), 1);
    init_settings();
    init_agent_bridge();
    init_remote_auth();
    init_remote_event_emitter();
    init_terminal_manager();
    fs35 = __toESM(require("fs/promises"), 1);
    path34 = __toESM(require("path"), 1);
    init_core_integration();
    init_shared_workspace_manager();
    init_chat_storage();
    import_electron8 = require("electron");
    app4 = null;
    server = null;
    ngrokListener = null;
    isRunning = false;
    publicUrl = null;
    port = 3e3;
    terminalOutputs = /* @__PURE__ */ new Map();
  }
});

// main/core-integration.ts
var core_integration_exports = {};
__export(core_integration_exports, {
  getWorkingDirectory: () => getWorkingDirectory,
  initializeCore: () => initializeCore,
  isCoreInitialized: () => isCoreInitialized,
  setPermissionMode: () => setPermissionMode,
  setWorkingDirectory: () => setWorkingDirectory
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
function buildSystemPrompt(cwd) {
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

## Working Directory
The user's current working directory is: ${cwd}
Always use this working directory for file operations and searches unless specifically asked to work elsewhere.
`;
}
function setWorkingDirectory(cwd) {
  currentWorkingDirectory = cwd;
  console.log("Working directory updated to:", cwd);
  const newSystemPrompt = buildSystemPrompt(cwd);
  agentBridge.updateWorkspaceContext(cwd, newSystemPrompt);
  if (agentInstance) {
    agentInstance.updateConfig({
      systemPrompt: newSystemPrompt,
      cwd
    });
    console.log("Agent updated with new working directory:", cwd);
  }
}
function getWorkingDirectory() {
  return currentWorkingDirectory;
}
async function initializeCore() {
  if (coreInitialized)
    return;
  try {
    console.log("Initializing omni-code core...");
    const config = new ConfigManager();
    const eventBus = new EventBus();
    const providerRegistry = new ProviderRegistry();
    providerRegistry.register(new AnthropicProvider());
    providerRegistry.register(new OpenAIProvider());
    providerRegistry.register(new GoogleProvider());
    providerRegistry.register(new MistralProvider());
    providerRegistry.register(new GroqProvider());
    providerRegistry.register(new XAIProvider());
    providerRegistry.register(new BedrockProvider());
    providerRegistry.register(new MoonshotProvider());
    const providerConfigs = { ...config.get("providers") };
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
    const defaultModel = config.get("defaultModel") || "claude-sonnet-4-5";
    const defaultProvider = config.get("defaultProvider") || "anthropic";
    const resolved = providerRegistry.resolveModel(defaultModel);
    const currentModel = resolved?.model.id || defaultModel;
    const currentProviderName = resolved?.provider.name || defaultProvider;
    const activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);
    if (!activeProvider || !activeProvider.isAvailable()) {
      console.warn(`Provider "${currentProviderName}" is not available.`);
    }
    const toolRegistry = new ToolRegistry();
    registerBuiltinTools(toolRegistry);
    for (const toolName of config.get("disabledTools")) {
      toolRegistry.setEnabled(toolName, false);
    }
    permissionManager = new PermissionManager(
      "auto-allow",
      eventBus
    );
    eventBus.on("permission_request", (request) => {
      if (!request.toolId) {
        request.onDeny();
        return;
      }
      agentBridge.requestPermission(
        request.sessionId,
        request.toolName,
        request.toolId,
        request.input,
        {
          onAllow: request.onAllow,
          onDeny: request.onDeny,
          onAllowAlways: request.onAllowAlways
        }
      );
    });
    eventBus.on("tool_call_progress", (event) => {
      agentBridge.emitToolProgress(event.sessionId, event.toolName, event.toolId, event.message);
    });
    eventBus.on("user_input_request", (request) => {
      agentBridge.requestUserInput(
        request.sessionId,
        request.requestId,
        request.prompt,
        request.terminalCommand,
        request.waitForInput,
        request.placeholder,
        {
          onResponse: request.onResponse,
          onCancel: request.onCancel
        }
      );
    });
    const toolRunner = new ToolRunner(toolRegistry, permissionManager, eventBus, config.get("autoLintFix"));
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
        const allModels = providerRegistry.getAllModels();
        return allModels.map((m) => {
          const provider = providerRegistry.getProvider(m.provider);
          return {
            id: m.id,
            name: m.displayName,
            provider: m.provider,
            available: provider?.isAvailable() || false
          };
        });
      },
      getProviders: () => {
        const allModels = providerRegistry.getAllModels();
        const providers = /* @__PURE__ */ new Map();
        for (const model of allModels) {
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
    agentBridge.initialize((conversationId, conversationModel, conversationProvider) => {
      const systemPrompt2 = buildSystemPrompt(currentWorkingDirectory);
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
      return new AgentImpl(
        {
          provider: resolvedProvider,
          model,
          systemPrompt: systemPrompt2,
          tools: toolRegistry.getAll(),
          temperature: config.get("temperature"),
          maxContextTokens: config.get("maxContextTokens"),
          maxTurns: config.get("maxTurns"),
          contextCompressionThreshold: config.get("contextCompressionThreshold"),
          contextRecentMessagesToKeep: config.get("contextRecentMessagesToKeep"),
          planMode: false,
          cwd: currentWorkingDirectory,
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
  } catch (error) {
    console.error("Failed to initialize core:", error);
    throw error;
  }
}
function isCoreInitialized() {
  return coreInitialized;
}
var coreInitialized, currentWorkingDirectory, agentInstance, permissionManager;
var init_core_integration = __esm({
  "main/core-integration.ts"() {
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
    coreInitialized = false;
    currentWorkingDirectory = process.cwd();
    agentInstance = null;
    permissionManager = null;
  }
});
init_core_integration();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getWorkingDirectory,
  initializeCore,
  isCoreInitialized,
  setPermissionMode,
  setWorkingDirectory
});
//# sourceMappingURL=core-integration.cjs.map