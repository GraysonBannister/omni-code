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

// main/settings.ts
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
var import_electron, Store, storeImportError, defaultSettings, SettingsManager, settingsManagerInstance, initializationPromise, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron = require("electron");
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
      get(path39) {
        return this.ensureInitialized().get(path39);
      }
      // Get all settings
      getAll() {
        return this.ensureInitialized().store;
      }
      // Set a specific setting by path
      set(path39, value) {
        this.ensureInitialized().set(path39, value);
        this.notifyListeners(path39, value);
      }
      // Reset a setting to default (or all if no path provided)
      reset(path39) {
        const store = this.ensureInitialized();
        if (path39) {
          const defaultValue = this.getDefaultValue(path39);
          this.set(path39, defaultValue);
        } else {
          store.clear();
          Object.entries(defaultSettings).forEach(([key, value]) => {
            store.set(key, value);
          });
          this.notifyListeners("*", store.store);
        }
      }
      // Get default value for a path
      getDefaultValue(path39) {
        const parts = path39.split(".");
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
      get: (path39) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path39);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path39, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path39, value);
      },
      reset: (path39) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path39);
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

// main/system-sounds.ts
var import_electron2;
var init_system_sounds = __esm({
  "main/system-sounds.ts"() {
    "use strict";
    import_electron2 = require("electron");
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
var import_electron3, windowFocusState;
var init_notifications = __esm({
  "main/notifications.ts"() {
    "use strict";
    import_electron3 = require("electron");
    init_settings();
    init_system_sounds();
    windowFocusState = /* @__PURE__ */ new Map();
  }
});

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
var DEFAULT_MAX_FILE_SIZE_BYTES;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024;
  }
});

// src/config/config-manager.ts
var fs, path, os;
var init_config_manager = __esm({
  "src/config/config-manager.ts"() {
    "use strict";
    fs = __toESM(require("fs"), 1);
    path = __toESM(require("path"), 1);
    os = __toESM(require("os"), 1);
    init_config_schema();
    init_constants();
  }
});

// src/utils/logger.ts
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
  }
});

// src/providers/provider-registry.ts
var init_provider_registry = __esm({
  "src/providers/provider-registry.ts"() {
    "use strict";
    init_logger();
  }
});

// src/providers/base-provider.ts
var init_base_provider = __esm({
  "src/providers/base-provider.ts"() {
    "use strict";
  }
});

// src/providers/model-registry.ts
var init_model_registry = __esm({
  "src/providers/model-registry.ts"() {
    "use strict";
  }
});

// src/providers/tool-call-normalizer.ts
var init_tool_call_normalizer = __esm({
  "src/providers/tool-call-normalizer.ts"() {
    "use strict";
  }
});

// src/providers/anthropic/anthropic-provider.ts
var import_sdk;
var init_anthropic_provider = __esm({
  "src/providers/anthropic/anthropic-provider.ts"() {
    "use strict";
    import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
    init_base_provider();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/core/message-types.ts
var init_message_types = __esm({
  "src/core/message-types.ts"() {
    "use strict";
  }
});

// src/providers/openai/openai-provider.ts
var import_openai;
var init_openai_provider = __esm({
  "src/providers/openai/openai-provider.ts"() {
    "use strict";
    import_openai = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/google/google-provider.ts
var import_generative_ai;
var init_google_provider = __esm({
  "src/providers/google/google-provider.ts"() {
    "use strict";
    import_generative_ai = require("@google/generative-ai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/mistral/mistral-provider.ts
var import_mistralai;
var init_mistral_provider = __esm({
  "src/providers/mistral/mistral-provider.ts"() {
    "use strict";
    import_mistralai = require("@mistralai/mistralai");
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/groq/groq-provider.ts
var import_groq_sdk;
var init_groq_provider = __esm({
  "src/providers/groq/groq-provider.ts"() {
    "use strict";
    import_groq_sdk = __toESM(require("groq-sdk"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/xai/xai-provider.ts
var import_openai2;
var init_xai_provider = __esm({
  "src/providers/xai/xai-provider.ts"() {
    "use strict";
    import_openai2 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/aws/bedrock-provider.ts
var import_client_bedrock_runtime;
var init_bedrock_provider = __esm({
  "src/providers/aws/bedrock-provider.ts"() {
    "use strict";
    import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
    init_base_provider();
    init_message_types();
    init_model_registry();
  }
});

// src/providers/moonshot/moonshot-provider.ts
var import_openai3;
var init_moonshot_provider = __esm({
  "src/providers/moonshot/moonshot-provider.ts"() {
    "use strict";
    import_openai3 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_model_registry();
    init_tool_call_normalizer();
  }
});

// src/providers/openai-compatible/openai-compat-provider.ts
var import_openai4;
var init_openai_compat_provider = __esm({
  "src/providers/openai-compatible/openai-compat-provider.ts"() {
    "use strict";
    import_openai4 = __toESM(require("openai"), 1);
    init_base_provider();
    init_message_types();
    init_tool_call_normalizer();
  }
});

// src/tools/tool-registry.ts
var init_tool_registry = __esm({
  "src/tools/tool-registry.ts"() {
    "use strict";
  }
});

// src/tools/tool-types.ts
var init_tool_types = __esm({
  "src/tools/tool-types.ts"() {
    "use strict";
  }
});

// src/tools/builtin/read-file.ts
var fs2, path2;
var init_read_file = __esm({
  "src/tools/builtin/read-file.ts"() {
    "use strict";
    fs2 = __toESM(require("fs/promises"), 1);
    path2 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/utils/large-file-writer.ts
var fs3, fsp, path3, DEFAULT_CONFIG, DEFAULT_CHUNK_SIZE;
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
  }
});

// src/tools/builtin/write-file.ts
var fs4, path4;
var init_write_file = __esm({
  "src/tools/builtin/write-file.ts"() {
    "use strict";
    fs4 = __toESM(require("fs/promises"), 1);
    path4 = __toESM(require("path"), 1);
    init_tool_types();
    init_large_file_writer();
  }
});

// src/tools/builtin/edit-file.ts
var fs5, path5;
var init_edit_file = __esm({
  "src/tools/builtin/edit-file.ts"() {
    "use strict";
    fs5 = __toESM(require("fs/promises"), 1);
    path5 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/glob-search.ts
var import_glob;
var init_glob_search = __esm({
  "src/tools/builtin/glob-search.ts"() {
    "use strict";
    import_glob = require("glob");
    init_tool_types();
  }
});

// src/tools/builtin/grep-search.ts
var import_node_child_process, import_node_util, execFileAsync;
var init_grep_search = __esm({
  "src/tools/builtin/grep-search.ts"() {
    "use strict";
    import_node_child_process = require("child_process");
    import_node_util = require("util");
    init_tool_types();
    execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
  }
});

// src/tools/builtin/bash-exec.ts
var import_node_child_process2, fs6, os2, path6, import_tree_kill;
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
  }
});

// src/memory/persistent-store.ts
var import_better_sqlite3;
var init_persistent_store = __esm({
  "src/memory/persistent-store.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
  }
});

// src/memory/embedding-config.ts
var init_embedding_config = __esm({
  "src/memory/embedding-config.ts"() {
    "use strict";
  }
});

// src/memory/semantic-memory.ts
var import_transformers, hnswlib;
var init_semantic_memory = __esm({
  "src/memory/semantic-memory.ts"() {
    "use strict";
    import_transformers = require("@xenova/transformers");
    hnswlib = __toESM(require("hnswlib-node"), 1);
    init_persistent_store();
    init_embedding_config();
    import_transformers.env.allowLocalModels = true;
    import_transformers.env.allowRemoteModels = true;
  }
});

// src/memory/smart-chunker.ts
var init_smart_chunker = __esm({
  "src/memory/smart-chunker.ts"() {
    "use strict";
  }
});

// src/memory/indexing-config.ts
var DEFAULT_INDEXING_CONFIG;
var init_indexing_config = __esm({
  "src/memory/indexing-config.ts"() {
    "use strict";
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
  }
});

// src/memory/project-indexer.ts
var import_fast_glob, DEFAULT_SYNC_INTERVAL_MS, DEFAULT_INDEXING_CONFIG2;
var init_project_indexer = __esm({
  "src/memory/project-indexer.ts"() {
    "use strict";
    import_fast_glob = __toESM(require("fast-glob"), 1);
    init_semantic_memory();
    init_smart_chunker();
    init_indexing_config();
    DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1e3;
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
var init_index_codebase = __esm({
  "src/tools/builtin/index-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
  }
});

// src/git/git-manager.ts
var import_simple_git;
var init_git_manager = __esm({
  "src/git/git-manager.ts"() {
    "use strict";
    import_simple_git = __toESM(require("simple-git"), 1);
  }
});

// src/tools/builtin/preview-diff.ts
var import_simple_git2;
var init_preview_diff = __esm({
  "src/tools/builtin/preview-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
    import_simple_git2 = __toESM(require("simple-git"), 1);
  }
});

// src/tools/builtin/run-tests.ts
var fs7, path7, import_node_child_process3;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs7 = __toESM(require("fs/promises"), 1);
    path7 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/file-tree.ts
var fs8, path8;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs8 = __toESM(require("fs/promises"), 1);
    path8 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/lint-fix.ts
var fs9, path9, import_node_child_process4;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs9 = __toESM(require("fs/promises"), 1);
    path9 = __toESM(require("path"), 1);
    import_node_child_process4 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/search-web.ts
var init_search_web = __esm({
  "src/tools/builtin/search-web.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/web-fetch.ts
var init_web_fetch = __esm({
  "src/tools/builtin/web-fetch.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/type-check.ts
var fs10, path10, import_node_child_process5;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    import_node_child_process5 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/http-client.ts
var init_http_client = __esm({
  "src/tools/builtin/http-client.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/symbol-rename.ts
var fs11, path11, import_fast_glob2;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/multi-file-edit.ts
var fs12, path12;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/dependency-manager.ts
var fs13, path13, import_node_child_process6;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/scaffold.ts
var fs14, path14;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/database-query.ts
var fs15, path15, import_better_sqlite32;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
    import_better_sqlite32 = __toESM(require("better-sqlite3"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/sub-agent.ts
var import_p_queue;
var init_sub_agent = __esm({
  "src/tools/builtin/sub-agent.ts"() {
    "use strict";
    import_p_queue = __toESM(require("p-queue"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/checkpoint.ts
var import_simple_git3;
var init_checkpoint = __esm({
  "src/tools/builtin/checkpoint.ts"() {
    "use strict";
    import_simple_git3 = __toESM(require("simple-git"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/test-gen.ts
var fs16, path16;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/query-codebase.ts
var init_query_codebase = __esm({
  "src/tools/builtin/query-codebase.ts"() {
    "use strict";
    init_tool_types();
    init_project_indexer();
  }
});

// src/tools/builtin/repo-map.ts
var fs17, path17, import_fast_glob3;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/self-analyze.ts
var fs18, path18;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/git-commit.ts
var init_git_commit = __esm({
  "src/tools/builtin/git-commit.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-diff.ts
var init_git_diff = __esm({
  "src/tools/builtin/git-diff.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-log.ts
var init_git_log = __esm({
  "src/tools/builtin/git-log.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-branch.ts
var init_git_branch = __esm({
  "src/tools/builtin/git-branch.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/git-stash.ts
var init_git_stash = __esm({
  "src/tools/builtin/git-stash.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/unified-diff-edit.ts
var fs19, path19;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/background-agent.ts
var TASK_TTL_MS;
var init_background_agent = __esm({
  "src/tools/builtin/background-agent.ts"() {
    "use strict";
    init_tool_types();
    TASK_TTL_MS = 10 * 60 * 1e3;
  }
});

// src/tools/builtin/code-review.ts
var init_code_review = __esm({
  "src/tools/builtin/code-review.ts"() {
    "use strict";
    init_tool_types();
    init_git_manager();
  }
});

// src/tools/builtin/browser-automation.ts
var init_browser_automation = __esm({
  "src/tools/builtin/browser-automation.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/open-browser.ts
var init_open_browser = __esm({
  "src/tools/builtin/open-browser.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/browser-control.ts
var init_browser_control = __esm({
  "src/tools/builtin/browser-control.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/debugger.ts
var inspector;
var init_debugger = __esm({
  "src/tools/builtin/debugger.ts"() {
    "use strict";
    init_tool_types();
    inspector = __toESM(require("inspector"), 1);
  }
});

// src/tools/builtin/doc-gen.ts
var fs20, path20;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/notebook.ts
var fs21, vm;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    vm = __toESM(require("vm"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/platform-cli-manager.ts
var import_node_child_process7, import_tree_kill2;
var init_platform_cli_manager = __esm({
  "src/tools/builtin/platform-cli-manager.ts"() {
    "use strict";
    import_node_child_process7 = require("child_process");
    import_tree_kill2 = __toESM(require("tree-kill"), 1);
  }
});

// src/tools/builtin/supabase-cli.ts
var import_node_child_process8;
var init_supabase_cli = __esm({
  "src/tools/builtin/supabase-cli.ts"() {
    "use strict";
    import_node_child_process8 = require("child_process");
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/netlify-cli.ts
var init_netlify_cli = __esm({
  "src/tools/builtin/netlify-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/railway-cli.ts
var init_railway_cli = __esm({
  "src/tools/builtin/railway-cli.ts"() {
    "use strict";
    init_tool_types();
    init_platform_cli_manager();
  }
});

// src/tools/builtin/ask-user.ts
var init_ask_user = __esm({
  "src/tools/builtin/ask-user.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/builtin/process-manager.ts
var import_node_child_process9, fs22, os3, path21, import_tree_kill3;
var init_process_manager = __esm({
  "src/tools/builtin/process-manager.ts"() {
    "use strict";
    import_node_child_process9 = require("child_process");
    fs22 = __toESM(require("fs"), 1);
    os3 = __toESM(require("os"), 1);
    path21 = __toESM(require("path"), 1);
    import_tree_kill3 = __toESM(require("tree-kill"), 1);
    init_tool_types();
    init_logger();
  }
});

// src/tools/builtin/create-plan.ts
var fs23, path22;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/update-plan.ts
var fs24, path23;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs24 = __toESM(require("fs/promises"), 1);
    path23 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/read-plan.ts
var fs25, path24;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path24 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/index.ts
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
var init_permission_manager = __esm({
  "src/permissions/permission-manager.ts"() {
    "use strict";
    init_tool_types();
  }
});

// src/tools/tool-runner.ts
var path25;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path25 = __toESM(require("path"), 1);
  }
});

// src/core/agent.ts
var init_agent = __esm({
  "src/core/agent.ts"() {
    "use strict";
    init_message_types();
    init_constants();
  }
});

// src/core/cost-tracker.ts
var init_cost_tracker = __esm({
  "src/core/cost-tracker.ts"() {
    "use strict";
    init_model_registry();
  }
});

// src/utils/event-bus.ts
var init_event_bus = __esm({
  "src/utils/event-bus.ts"() {
    "use strict";
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
       * Rollback all changes from a specific message onwards
       * This restores files to their state before the specified message was processed
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
        for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
          const absolutePath = this.resolveFilePath(change.filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            let currentContent;
            try {
              currentContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
            } catch {
              currentContent = null;
            }
            if (change.changeType === "delete") {
              if (change.beforeContent) {
                await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
              }
              restoredFiles.push(change.filePath);
            } else if (change.changeType === "write" && !change.beforeContent) {
              if (currentContent === null || currentContent === change.afterContent) {
                try {
                  await import_node_fs.promises.unlink(absolutePath);
                } catch {
                }
                restoredFiles.push(change.filePath);
              } else {
                const reverted = applyInversePatch("", change.afterContent, currentContent);
                if (reverted !== null) {
                  if (reverted.trim() === "") {
                    try {
                      await import_node_fs.promises.unlink(absolutePath);
                    } catch {
                    }
                  } else {
                    await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
                  }
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert ${change.filePath} without affecting concurrent changes from another chat. Deleting the file.`);
                  try {
                    await import_node_fs.promises.unlink(absolutePath);
                  } catch {
                  }
                }
                restoredFiles.push(change.filePath);
              }
            } else {
              if (currentContent === null) {
                if (change.beforeContent) {
                  await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
                }
                restoredFiles.push(change.filePath);
              } else if (currentContent === change.afterContent) {
                await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
                restoredFiles.push(change.filePath);
              } else {
                const reverted = applyInversePatch(change.beforeContent, change.afterContent, currentContent);
                if (reverted !== null) {
                  await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
                } else {
                  console.warn(`[FileHistoryManager] Could not cleanly revert ${change.filePath} without affecting concurrent changes from another chat. Restoring to pre-change state.`);
                  await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
                }
                restoredFiles.push(change.filePath);
              }
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
       * Re-apply the changes from a specific message (undo a previous rollback).
       * Writes afterContent for each file change captured in the snapshot.
       */
      async reapplyMessage(conversationId, messageId) {
        const restoredFiles = [];
        const failedFiles = [];
        const targetKey = `${conversationId}/${messageId}`;
        const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
        if (!targetSnapshot) {
          console.warn(`[FileHistoryManager] No snapshot found for message ${messageId} (reapply)`);
          return { success: false, restoredFiles, failedFiles };
        }
        for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
          const absolutePath = this.resolveFilePath(change.filePath);
          try {
            await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
            if (change.changeType === "delete") {
              try {
                await import_node_fs.promises.unlink(absolutePath);
              } catch {
              }
              restoredFiles.push(change.filePath);
            } else {
              await import_node_fs.promises.writeFile(absolutePath, change.afterContent, "utf8");
              restoredFiles.push(change.filePath);
            }
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to reapply ${change.filePath}:`, error);
            failedFiles.push(change.filePath);
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
          const stat7 = await import_node_fs.promises.stat(messageDir);
          if (!stat7.isDirectory())
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
        const { promises: fs37 } = await import("fs");
        if (change.changeType === "added") {
          try {
            await fs37.unlink(absolutePath);
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
          const { dirname: dirname10 } = await import("path");
          try {
            await fs37.mkdir(dirname10(absolutePath), { recursive: true });
            await fs37.writeFile(absolutePath, result.content, "utf8");
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
  const appRoot = import_electron4.app.getAppPath();
  const isDev2 = process.env.NODE_ENV === "development";
  if (isDev2) {
    return {
      png: path26.join(appRoot, "logo.png"),
      icns: path26.join(appRoot, "logo.icns")
    };
  }
  return {
    png: path26.join(process.resourcesPath || appRoot, "logo.png"),
    icns: path26.join(process.resourcesPath || appRoot, "logo.icns")
  };
}
var import_electron4, path26, MAX_MENU_ITEMS, TrayNotificationManager, trayNotificationManager;
var init_tray_notifications = __esm({
  "main/tray-notifications.ts"() {
    "use strict";
    import_electron4 = require("electron");
    path26 = __toESM(require("path"), 1);
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
          this.baseIcon = import_electron4.nativeImage.createFromPath(iconPath);
          if (this.baseIcon.isEmpty() && process.platform === "darwin") {
            this.baseIcon = import_electron4.nativeImage.createFromPath(iconPaths.png);
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
            this.baseIcon = import_electron4.nativeImage.createEmpty();
          }
        } catch (error) {
          console.error("[TrayNotifications] Failed to load base icon:", error);
          this.baseIcon = import_electron4.nativeImage.createEmpty();
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
        this.tray = new import_electron4.Tray(this.baseIcon);
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
        import_electron4.ipcMain.handle("tray:update-active", (_event, conversationId) => {
          this.activeConversationId = conversationId;
          if (conversationId) {
            this.clearNotification(conversationId);
          }
        });
        import_electron4.ipcMain.handle("tray:clear-notification", (_event, conversationId) => {
          this.clearNotification(conversationId);
        });
        import_electron4.ipcMain.handle("tray:clear-all-notifications", () => {
          this.clearAllNotifications();
        });
        import_electron4.ipcMain.handle("tray:update-recent-chats", (_event, chats) => {
          this.recentChats.clear();
          for (const chat of chats) {
            this.recentChats.set(chat.conversationId, chat);
          }
          this.updateContextMenu();
        });
        import_electron4.ipcMain.handle("tray:update-open-project", (_event, project) => {
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
          return import_electron4.nativeImage.createEmpty();
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
          import_electron4.app.setBadgeCount(count);
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
        const contextMenu = import_electron4.Menu.buildFromTemplate(menuItems);
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
var import_electron5, FILE_MODIFYING_TOOLS, AgentBridge, agentBridge;
var init_agent_bridge = __esm({
  "main/agent-bridge.ts"() {
    "use strict";
    import_electron5 = require("electron");
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
        const agent = this.agentFactory(conversationId, model, provider);
        if (workingDirectory) {
          agent.updateConfig({ cwd: workingDirectory });
          this.workspacePath = workingDirectory;
          console.log(`[AgentBridge] Set cwd for conversation ${conversationId}: ${workingDirectory}`);
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
            fileReferences: fileReferences?.map(({ path: path39, name, isDirectory, extension }) => ({ path: path39, name, isDirectory, extension }))
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
        const windows = import_electron5.BrowserWindow.getAllWindows();
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
        import_electron5.BrowserWindow.getAllWindows().forEach((window) => {
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

// src/core/usage-types.ts
var init_usage_types = __esm({
  "src/core/usage-types.ts"() {
    "use strict";
  }
});

// main/usage-storage.ts
var fs27, path27;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path27 = __toESM(require("path"), 1);
    init_usage_types();
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
var fs28, path28, import_fast_glob4, import_minimatch, RULES_SUBDIR, STATE_FILE, RulesManager, rulesManager;
var init_rules_manager = __esm({
  "main/rules-manager.ts"() {
    "use strict";
    fs28 = __toESM(require("fs/promises"), 1);
    path28 = __toESM(require("path"), 1);
    import_fast_glob4 = require("fast-glob");
    import_minimatch = require("minimatch");
    init_rules_parser();
    RULES_SUBDIR = path28.join(".omnicode", "rules");
    STATE_FILE = path28.join(".omnicode", "rules-state.json");
    RulesManager = class {
      projectPath = "";
      rules = /* @__PURE__ */ new Map();
      async loadRules(projectPath) {
        this.projectPath = projectPath;
        const rulesDir = path28.join(projectPath, RULES_SUBDIR);
        const disabledIds = await this.loadDisabledState(projectPath);
        let files = [];
        try {
          await fs28.access(rulesDir);
          files = await (0, import_fast_glob4.glob)("**/*.mdc", { cwd: rulesDir, absolute: true });
        } catch {
          this.rules.clear();
          return;
        }
        this.rules.clear();
        for (const filePath of files) {
          const id = path28.basename(filePath, ".mdc");
          try {
            const raw = await fs28.readFile(filePath, "utf-8");
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
              (file) => globs.some((g) => (0, import_minimatch.minimatch)(path28.basename(file), g) || (0, import_minimatch.minimatch)(file, g))
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
        const rulesDir = path28.join(this.projectPath, RULES_SUBDIR);
        await fs28.mkdir(rulesDir, { recursive: true });
        const filePath = path28.join(rulesDir, `${id}.mdc`);
        const content = frontmatterRaw ? `${frontmatterRaw}
${body}` : body;
        await fs28.writeFile(filePath, content, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async saveRuleFile(id, fullContent) {
        const rulesDir = path28.join(this.projectPath, RULES_SUBDIR);
        await fs28.mkdir(rulesDir, { recursive: true });
        const filePath = path28.join(rulesDir, `${id}.mdc`);
        await fs28.writeFile(filePath, fullContent, "utf-8");
        await this.loadRules(this.projectPath);
      }
      async deleteRule(id) {
        const rule = this.rules.get(id);
        if (!rule)
          return;
        await fs28.unlink(rule.filePath);
        this.rules.delete(id);
        await this.saveDisabledState();
      }
      getRulesDir() {
        return path28.join(this.projectPath, RULES_SUBDIR);
      }
      async loadDisabledState(projectPath) {
        try {
          const statePath = path28.join(projectPath, STATE_FILE);
          const raw = await fs28.readFile(statePath, "utf-8");
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
        const statePath = path28.join(this.projectPath, STATE_FILE);
        await fs28.mkdir(path28.dirname(statePath), { recursive: true });
        await fs28.writeFile(statePath, JSON.stringify({ disabledRules: disabled }, null, 2), "utf-8");
      }
    };
    rulesManager = new RulesManager();
  }
});

// main/skills-manager.ts
var fs29, path29, SKILLS_SUBDIR, SKILL_FILENAME, SkillsManager, skillsManager;
var init_skills_manager = __esm({
  "main/skills-manager.ts"() {
    "use strict";
    fs29 = __toESM(require("fs/promises"), 1);
    path29 = __toESM(require("path"), 1);
    init_rules_parser();
    SKILLS_SUBDIR = path29.join(".omnicode", "skills");
    SKILL_FILENAME = "SKILL.md";
    SkillsManager = class {
      projectPath = "";
      skills = /* @__PURE__ */ new Map();
      async loadSkills(projectPath) {
        this.projectPath = projectPath;
        const skillsDir = path29.join(projectPath, SKILLS_SUBDIR);
        let entries = [];
        try {
          await fs29.access(skillsDir);
          entries = await fs29.readdir(skillsDir, { withFileTypes: true });
        } catch {
          this.skills.clear();
          return;
        }
        this.skills.clear();
        for (const entry of entries) {
          if (!entry.isDirectory())
            continue;
          const skillId = entry.name;
          const skillFile = path29.join(skillsDir, skillId, SKILL_FILENAME);
          try {
            await fs29.access(skillFile);
            const raw = await fs29.readFile(skillFile, "utf-8");
            const { name, description, body } = parseSkillFrontmatter(raw);
            this.skills.set(skillId, {
              id: skillId,
              dirPath: path29.join(skillsDir, skillId),
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
        const skillDir = path29.join(this.projectPath, SKILLS_SUBDIR, id);
        await fs29.mkdir(skillDir, { recursive: true });
        const filePath = path29.join(skillDir, SKILL_FILENAME);
        await fs29.writeFile(filePath, content, "utf-8");
        await this.loadSkills(this.projectPath);
      }
      async deleteSkill(id) {
        const skill = this.skills.get(id);
        if (!skill)
          return;
        await fs29.rm(skill.dirPath, { recursive: true, force: true });
        this.skills.delete(id);
      }
      getSkillsDir() {
        return path29.join(this.projectPath, SKILLS_SUBDIR);
      }
    };
    skillsManager = new SkillsManager();
  }
});

// main/addon-loader.ts
var fs30, path30, import_electron6;
var init_addon_loader = __esm({
  "main/addon-loader.ts"() {
    "use strict";
    fs30 = __toESM(require("fs/promises"), 1);
    path30 = __toESM(require("path"), 1);
    import_electron6 = require("electron");
  }
});

// main/core-integration.ts
var path31, currentWorkingDirectory;
var init_core_integration = __esm({
  "main/core-integration.ts"() {
    "use strict";
    path31 = __toESM(require("path"), 1);
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
    currentWorkingDirectory = process.cwd();
  }
});

// main/remote-client.ts
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
      buildAuthHeaders(method, path39) {
        const timestamp = Date.now().toString();
        const signingString = `${method.toUpperCase()}
${path39}
${timestamp}`;
        const signature = (0, import_node_crypto.createHmac)("sha256", this.apiKey).update(signingString).digest("hex");
        return {
          "X-API-Key": this.apiKey,
          "X-Timestamp": timestamp,
          "X-Signature": signature,
          "Content-Type": "application/json"
        };
      }
      buildUrl(path39, params) {
        const url = new import_node_url.URL(path39, this.baseUrl + "/");
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
          }
        }
        return url.toString();
      }
      pathWithQuery(path39, params) {
        if (!params || Object.keys(params).length === 0)
          return path39;
        const sp = new URLSearchParams(params);
        return `${path39}?${sp.toString()}`;
      }
      // -------------------------------------------------------------------------
      // Low-level HTTP fetch
      // -------------------------------------------------------------------------
      async request(method, path39, body, queryParams) {
        const fullPath = this.pathWithQuery(path39, queryParams);
        const headers = this.buildAuthHeaders(method, fullPath);
        const url = this.buildUrl(path39, queryParams);
        const bodyStr = body !== void 0 ? JSON.stringify(body) : void 0;
        if (bodyStr) {
          headers["Content-Length"] = Buffer.byteLength(bodyStr).toString();
        }
        return new Promise((resolve11, reject) => {
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
                resolve11(JSON.parse(raw));
              } catch {
                resolve11(raw);
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
          await new Promise((resolve11, reject) => {
            const parsed = new import_node_url.URL(statusUrl);
            const transport = parsed.protocol === "https:" ? https : http;
            const req = transport.request(
              { method: "GET", hostname: parsed.hostname, port: parsed.port || (parsed.protocol === "https:" ? 443 : 80), path: parsed.pathname },
              (res) => {
                res.resume();
                if (res.statusCode === 200)
                  resolve11();
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
        const path39 = `/api/terminal/stream/${encodeURIComponent(id)}`;
        const headers = this.buildAuthHeaders("GET", path39);
        headers["Accept"] = "text/event-stream";
        const url = this.buildUrl(path39);
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
var import_electron7, RemoteClientMode, remoteClientMode;
var init_remote_client_mode = __esm({
  "main/remote-client-mode.ts"() {
    "use strict";
    import_electron7 = require("electron");
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
        const windows = import_electron7.BrowserWindow.getAllWindows();
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
var fs31, fsSync, path32, import_node_crypto2, import_electron8;
var init_plan_file_manager = __esm({
  "main/plan-file-manager.ts"() {
    "use strict";
    fs31 = __toESM(require("fs/promises"), 1);
    fsSync = __toESM(require("fs"), 1);
    path32 = __toESM(require("path"), 1);
    import_node_crypto2 = require("crypto");
    import_electron8 = require("electron");
  }
});

// src/types/workspace.ts
var init_workspace = __esm({
  "src/types/workspace.ts"() {
    "use strict";
  }
});

// main/workspace-storage.ts
var fs32, path33, import_electron9;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs32 = __toESM(require("fs/promises"), 1);
    path33 = __toESM(require("path"), 1);
    import_electron9 = require("electron");
    init_workspace();
  }
});

// main/shared-workspace-manager.ts
var fs33, path34;
var init_shared_workspace_manager = __esm({
  "main/shared-workspace-manager.ts"() {
    "use strict";
    fs33 = __toESM(require("fs/promises"), 1);
    path34 = __toESM(require("path"), 1);
    init_settings();
    init_workspace_storage();
  }
});

// main/chat-storage.ts
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
var fs34, path35, STORAGE_VERSION, CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs34 = __toESM(require("fs/promises"), 1);
    path35 = __toESM(require("path"), 1);
    STORAGE_VERSION = "1.0.0";
    CHATS_DIR = ".omnicode/chats";
    MAX_CHATS_PER_WORKSPACE = 50;
    ChatStorage = class {
      ensureChatsDir(workspacePath) {
        const chatsDir = path35.join(workspacePath, CHATS_DIR);
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
          await fs34.mkdir(chatsDir, { recursive: true });
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
          const filePath = path35.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs34.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          await fs34.rename(tempPath, filePath);
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
          const chatsDir = path35.join(workspacePath, CHATS_DIR);
          try {
            await fs34.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs34.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path35.join(chatsDir, file.name);
              const content = await fs34.readFile(filePath, "utf-8");
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
          const chatsDir = path35.join(workspacePath, CHATS_DIR);
          const filePath = path35.join(chatsDir, `${conversationId}.json`);
          await fs34.unlink(filePath);
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
          const chatsDir = path35.join(workspacePath, CHATS_DIR);
          try {
            await fs34.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs34.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path35.join(chatsDir, file.name);
              const content = await fs34.readFile(filePath, "utf-8");
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

// main/terminal-manager.ts
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path36.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path36.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs35.existsSync(helperPath)) {
      fs35.chmodSync(helperPath, 493);
    }
  } catch {
  }
}
var pty, os4, path36, fs35, OUTPUT_BUFFER_LIMIT;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os4 = __toESM(require("os"), 1);
    path36 = __toESM(require("path"), 1);
    fs35 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
    OUTPUT_BUFFER_LIMIT = 64 * 1024;
  }
});

// main/ipc-handlers.ts
function setMainWindowForBrowser(window) {
  mainWindowRef = window;
}
var import_electron10, fs36, fsSync2, path37, os5, https2, http2, import_node_child_process10, mainWindowRef, chatStorageRef;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    "use strict";
    import_electron10 = require("electron");
    fs36 = __toESM(require("fs/promises"), 1);
    fsSync2 = __toESM(require("fs"), 1);
    path37 = __toESM(require("path"), 1);
    os5 = __toESM(require("os"), 1);
    https2 = __toESM(require("https"), 1);
    http2 = __toESM(require("http"), 1);
    import_node_child_process10 = require("child_process");
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
    chatStorageRef = getChatStorage();
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
module.exports = __toCommonJS(app_window_exports);
function buildMenu() {
  const recentWorkspaces = settingsManager.getRecentWorkspaces();
  const recentSubmenu = recentWorkspaces.length > 0 ? recentWorkspaces.map((workspacePath) => ({
    label: `${path38.basename(workspacePath)} - ${workspacePath}`,
    click: () => {
      const focusedWindow = import_electron11.BrowserWindow.getFocusedWindow();
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
        import_electron11.Menu.setApplicationMenu(newMenu);
      }
    });
  }
  const fw = () => import_electron11.BrowserWindow.getFocusedWindow();
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
  return import_electron11.Menu.buildFromTemplate(template);
}
async function createWindow() {
  const preloadPath = path38.resolve(__dirname, "main", "preload.cjs");
  console.log("__dirname:", __dirname);
  console.log("Preload path:", preloadPath);
  const { app: app5 } = await import("electron");
  const appRoot = app5.getAppPath();
  const iconPaths = process.platform === "darwin" ? [
    path38.join(appRoot, "build", "icon.icns"),
    path38.join(appRoot, "..", "build", "icon.icns"),
    path38.join(__dirname, "..", "build", "icon.icns"),
    path38.join(appRoot, "logo.png"),
    path38.join(__dirname, "..", "logo.png")
  ] : [
    path38.join(process.resourcesPath, "logo.png"),
    path38.join(appRoot, "logo.png"),
    path38.join(__dirname, "..", "logo.png"),
    path38.join(__dirname, "..", "..", "logo.png")
  ];
  let icon = void 0;
  for (const iconPath of iconPaths) {
    try {
      const img = import_electron11.nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) {
        icon = img;
        console.log("[Main] Using icon:", iconPath);
        break;
      }
    } catch {
    }
  }
  const existingWindows = import_electron11.BrowserWindow.getAllWindows();
  let windowPosition;
  if (existingWindows.length > 0) {
    const ref = import_electron11.BrowserWindow.getFocusedWindow() ?? existingWindows[existingWindows.length - 1];
    const [rx, ry] = ref.getPosition();
    const cascade = existingWindows.length * 30;
    windowPosition = { x: rx + cascade, y: ry + cascade };
  }
  const win = new import_electron11.BrowserWindow({
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
    await win.loadFile(path38.join(__dirname, "../renderer/index.html"));
  }
  win.on("closed", () => {
    if (mainWindow === win) {
      const remaining = import_electron11.BrowserWindow.getAllWindows();
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
    import_electron11.shell.openExternal(url);
    return { action: "deny" };
  });
  const menu = buildMenu();
  import_electron11.Menu.setApplicationMenu(menu);
  return win;
}
function rebuildMenu() {
  const menu = buildMenu();
  import_electron11.Menu.setApplicationMenu(menu);
}
function setupAppEventHandlers() {
  const { app: app5 } = require("electron");
  app5.on("activate", () => {
    if (import_electron11.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app5.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app5.quit();
    }
  });
  app5.on("before-quit", async (e) => {
    if (isQuitting)
      return;
    const allWindows = import_electron11.BrowserWindow.getAllWindows();
    if (allWindows.length === 0)
      return;
    e.preventDefault();
    isQuitting = true;
    try {
      await Promise.race([
        Promise.all(allWindows.map((w) => new Promise((resolve11) => {
          const replyChannel = `app:save-complete-${w.id}`;
          import_electron11.ipcMain.handleOnce(replyChannel, () => {
            console.log(`[Main] Window ${w.id} signaled save complete`);
            resolve11();
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
    app5.quit();
  });
}
function getMainWindow() {
  return mainWindow;
}
var import_electron11, path38, mainWindow, isQuitting, isDev;
var init_app_window = __esm({
  "main/app-window.ts"() {
    import_electron11 = require("electron");
    path38 = __toESM(require("path"), 1);
    init_settings();
    init_notifications();
    init_ipc_handlers();
    init_tray_notifications();
    mainWindow = null;
    isQuitting = false;
    isDev = process.env.NODE_ENV === "development";
  }
});
init_app_window();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createWindow,
  getMainWindow,
  rebuildMenu,
  setupAppEventHandlers
});
//# sourceMappingURL=app-window.cjs.map