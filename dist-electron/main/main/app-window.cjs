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
var import_electron, defaultSettings, settingsManagerInstance, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron = require("electron");
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
      get: (path30) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path30);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path30, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path30, value);
      },
      reset: (path30) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path30);
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
var import_electron2, windowFocusState;
var init_notifications = __esm({
  "main/notifications.ts"() {
    "use strict";
    import_electron2 = require("electron");
    init_settings();
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
var import_node_child_process2, import_tree_kill;
var init_bash_exec = __esm({
  "src/tools/builtin/bash-exec.ts"() {
    "use strict";
    import_node_child_process2 = require("child_process");
    import_tree_kill = __toESM(require("tree-kill"), 1);
    init_tool_types();
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
var fs6, path6, import_node_child_process3;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs6 = __toESM(require("fs/promises"), 1);
    path6 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/file-tree.ts
var fs7, path7;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs7 = __toESM(require("fs/promises"), 1);
    path7 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/lint-fix.ts
var fs8, path8, import_node_child_process4;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs8 = __toESM(require("fs/promises"), 1);
    path8 = __toESM(require("path"), 1);
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
var fs9, path9, import_node_child_process5;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs9 = __toESM(require("fs/promises"), 1);
    path9 = __toESM(require("path"), 1);
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
var fs10, path10, import_fast_glob2;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/multi-file-edit.ts
var fs11, path11;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/dependency-manager.ts
var fs12, path12, import_node_child_process6;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/scaffold.ts
var fs13, path13;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/database-query.ts
var fs14, path14, import_better_sqlite32;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
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
var fs15, path15;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
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
var fs16, path16, import_fast_glob3;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/self-analyze.ts
var fs17, path17;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
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
var fs18, path18;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/background-agent.ts
var init_background_agent = __esm({
  "src/tools/builtin/background-agent.ts"() {
    "use strict";
    init_tool_types();
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
var fs19, path19;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/notebook.ts
var fs20, vm;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
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
var import_node_child_process9, import_tree_kill3;
var init_process_manager = __esm({
  "src/tools/builtin/process-manager.ts"() {
    "use strict";
    import_node_child_process9 = require("child_process");
    import_tree_kill3 = __toESM(require("tree-kill"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/create-plan.ts
var fs21, path20;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/update-plan.ts
var fs22, path21;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs22 = __toESM(require("fs/promises"), 1);
    path21 = __toESM(require("path"), 1);
    init_tool_types();
    init_create_plan();
  }
});

// src/tools/builtin/read-plan.ts
var fs23, path22;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
    init_tool_types();
    init_create_plan();
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
var path23;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path23 = __toESM(require("path"), 1);
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
            const stat4 = await import_node_fs.promises.stat(messageDir);
            if (!stat4.isDirectory())
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
var import_electron3, FILE_MODIFYING_TOOLS, AgentBridge, agentBridge;
var init_agent_bridge = __esm({
  "main/agent-bridge.ts"() {
    "use strict";
    import_electron3 = require("electron");
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
        import_electron3.BrowserWindow.getAllWindows().forEach((window) => {
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
        import_electron3.BrowserWindow.getAllWindows().forEach((window) => {
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
var fs25, path24;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path24 = __toESM(require("path"), 1);
    init_usage_types();
  }
});

// main/core-integration.ts
var currentWorkingDirectory;
var init_core_integration = __esm({
  "main/core-integration.ts"() {
    "use strict";
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
    currentWorkingDirectory = process.cwd();
  }
});

// main/chat-storage.ts
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
var fs26, path25, import_electron4, syncNotifier, STORAGE_VERSION, CHATS_DIR, WORKSPACE_CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs26 = __toESM(require("fs/promises"), 1);
    path25 = __toESM(require("path"), 1);
    import_electron4 = require("electron");
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
        this.workspacesBaseDir = path25.join(import_electron4.app.getPath("userData"), "workspaces");
        return this.workspacesBaseDir;
      }
      /**
       * Get the chats directory path based on storage context
       */
      async getChatsDir(context) {
        if (context.type === "workspace" && context.workspace) {
          const workspacesDir = await this.getWorkspacesBaseDir();
          const workspaceDir = path25.join(workspacesDir, context.workspace.id);
          return path25.join(workspaceDir, WORKSPACE_CHATS_DIR);
        } else if (context.type === "project" && context.projectPath) {
          return path25.join(context.projectPath, CHATS_DIR);
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
          await fs26.mkdir(chatsDir, { recursive: true });
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
          const filePath = path25.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs26.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          let isNew = false;
          try {
            await fs26.access(filePath);
          } catch {
            isNew = true;
          }
          await fs26.rename(tempPath, filePath);
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
            await fs26.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs26.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path25.join(chatsDir, file.name);
              const content = await fs26.readFile(filePath, "utf-8");
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
          const filePath = path25.join(chatsDir, `${conversationId}.json`);
          await fs26.unlink(filePath);
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
            await fs26.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs26.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path25.join(chatsDir, file.name);
              const content = await fs26.readFile(filePath, "utf-8");
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
var init_workspace = __esm({
  "src/types/workspace.ts"() {
    "use strict";
  }
});

// main/workspace-storage.ts
var fs27, path26, import_electron5;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path26 = __toESM(require("path"), 1);
    import_electron5 = require("electron");
    init_workspace();
  }
});

// src/memory/workspace-indexer.ts
var import_electron6, import_fast_glob4, DEFAULT_SYNC_INTERVAL_MS2, DEFAULT_INDEXING_CONFIG3;
var init_workspace_indexer = __esm({
  "src/memory/workspace-indexer.ts"() {
    "use strict";
    import_electron6 = require("electron");
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

// main/terminal-manager.ts
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path27.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path27.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs28.existsSync(helperPath)) {
      fs28.chmodSync(helperPath, 493);
    }
  } catch {
  }
}
var pty, os2, path27, fs28;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os2 = __toESM(require("os"), 1);
    path27 = __toESM(require("path"), 1);
    fs28 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
  }
});

// main/ipc-handlers.ts
function setMainWindowForBrowser(window) {
  mainWindowRef = window;
}
var import_electron7, fs29, path28, mainWindowRef, chatStorageRef;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    "use strict";
    import_electron7 = require("electron");
    fs29 = __toESM(require("fs/promises"), 1);
    path28 = __toESM(require("path"), 1);
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
var import_electron8 = require("electron");
var path29 = __toESM(require("path"), 1);
init_settings();
init_notifications();
init_ipc_handlers();
var mainWindow = null;
var isQuitting = false;
var isDev = process.env.NODE_ENV === "development";
function buildMenu() {
  const recentWorkspaces = settingsManager.getRecentWorkspaces();
  const recentSubmenu = recentWorkspaces.length > 0 ? recentWorkspaces.map((workspacePath) => ({
    label: `${path29.basename(workspacePath)} - ${workspacePath}`,
    click: () => {
      const focusedWindow = import_electron8.BrowserWindow.getFocusedWindow();
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
        import_electron8.Menu.setApplicationMenu(newMenu);
      }
    });
  }
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow?.webContents.send("menu:new-file")
        },
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+O",
          click: () => mainWindow?.webContents.send("menu:open-folder")
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
          click: () => mainWindow?.webContents.send("menu:save")
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => mainWindow?.webContents.send("menu:open-settings")
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
          click: () => mainWindow?.webContents.send("menu:toggle-sidebar")
        },
        {
          label: "Toggle Chat",
          accelerator: "CmdOrCtrl+Shift+L",
          click: () => mainWindow?.webContents.send("menu:toggle-chat")
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
          click: () => mainWindow?.webContents.send("menu:send-message")
        },
        {
          label: "Abort",
          accelerator: "Escape",
          click: () => mainWindow?.webContents.send("menu:abort")
        },
        { type: "separator" },
        {
          label: "Clear Conversation",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => mainWindow?.webContents.send("menu:clear-chat")
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
  return import_electron8.Menu.buildFromTemplate(template);
}
async function createWindow() {
  const preloadPath = path29.resolve(__dirname, "main", "preload.cjs");
  console.log("__dirname:", __dirname);
  console.log("Preload path:", preloadPath);
  const iconPaths = [
    path29.join(process.resourcesPath, "logo.png"),
    path29.join(__dirname, "..", "logo.png"),
    path29.join(__dirname, "..", "..", "logo.png"),
    path29.join(__dirname, "logo.png")
  ];
  let icon = void 0;
  for (const iconPath of iconPaths) {
    try {
      const img = import_electron8.nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) {
        icon = img;
        console.log("[Main] Using icon:", iconPath);
        break;
      }
    } catch {
    }
  }
  mainWindow = new import_electron8.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
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
  setMainWindowForBrowser(mainWindow);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path29.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  initializeWindowFocusTracking(mainWindow);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import_electron8.shell.openExternal(url);
    return { action: "deny" };
  });
  const menu = buildMenu();
  import_electron8.Menu.setApplicationMenu(menu);
  return mainWindow;
}
function rebuildMenu() {
  const menu = buildMenu();
  import_electron8.Menu.setApplicationMenu(menu);
}
function setupAppEventHandlers() {
  const { app: app4 } = require("electron");
  app4.on("activate", () => {
    if (import_electron8.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app4.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app4.quit();
    }
  });
  app4.on("before-quit", async (e) => {
    if (isQuitting || !mainWindow)
      return;
    e.preventDefault();
    isQuitting = true;
    try {
      await Promise.race([
        new Promise((resolve7) => {
          import_electron8.ipcMain.handleOnce("app:save-complete", () => {
            console.log("[Main] Renderer signaled save complete");
            resolve7();
          });
          mainWindow?.webContents.send("app:before-quit");
        }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Save timeout")), 5e3)
        )
      ]);
      console.log("[Main] Save complete, quitting now");
    } catch (error) {
      console.error("[Main] Save failed or timed out, quitting anyway:", error);
    }
    app4.quit();
  });
}
function getMainWindow() {
  return mainWindow;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createWindow,
  getMainWindow,
  rebuildMenu,
  setupAppEventHandlers
});
//# sourceMappingURL=app-window.cjs.map