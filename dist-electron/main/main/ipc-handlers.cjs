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
        const basename10 = path7.basename(filePath);
        const relativePath = filePath;
        for (const pattern of excludePatterns) {
          if (this.matchesGlob(basename10, pattern) || this.matchesGlob(relativePath, pattern)) {
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
var fs9, path9, import_fast_glob, INDEX_VERSION, SEMANTIC_SEARCH_THRESHOLD, DEFAULT_SYNC_INTERVAL_MS, ProjectIndexer, DEFAULT_INDEXING_CONFIG2, activeIndexers;
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
    activeIndexers = /* @__PURE__ */ new Map();
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
var fs10, path10, import_node_child_process3;
var init_run_tests = __esm({
  "src/tools/builtin/run-tests.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"), 1);
    path10 = __toESM(require("path"), 1);
    import_node_child_process3 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/file-tree.ts
var fs11, path11;
var init_file_tree = __esm({
  "src/tools/builtin/file-tree.ts"() {
    "use strict";
    fs11 = __toESM(require("fs/promises"), 1);
    path11 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/lint-fix.ts
var fs12, path12, import_node_child_process4;
var init_lint_fix = __esm({
  "src/tools/builtin/lint-fix.ts"() {
    "use strict";
    fs12 = __toESM(require("fs/promises"), 1);
    path12 = __toESM(require("path"), 1);
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
var fs13, path13, import_node_child_process5;
var init_type_check = __esm({
  "src/tools/builtin/type-check.ts"() {
    "use strict";
    fs13 = __toESM(require("fs/promises"), 1);
    path13 = __toESM(require("path"), 1);
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
var fs14, path14, import_fast_glob2;
var init_symbol_rename = __esm({
  "src/tools/builtin/symbol-rename.ts"() {
    "use strict";
    fs14 = __toESM(require("fs/promises"), 1);
    path14 = __toESM(require("path"), 1);
    import_fast_glob2 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/multi-file-edit.ts
var fs15, path15;
var init_multi_file_edit = __esm({
  "src/tools/builtin/multi-file-edit.ts"() {
    "use strict";
    fs15 = __toESM(require("fs/promises"), 1);
    path15 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/dependency-manager.ts
var fs16, path16, import_node_child_process6;
var init_dependency_manager = __esm({
  "src/tools/builtin/dependency-manager.ts"() {
    "use strict";
    fs16 = __toESM(require("fs/promises"), 1);
    path16 = __toESM(require("path"), 1);
    import_node_child_process6 = require("child_process");
    init_tool_types();
  }
});

// src/tools/builtin/scaffold.ts
var fs17, path17;
var init_scaffold = __esm({
  "src/tools/builtin/scaffold.ts"() {
    "use strict";
    fs17 = __toESM(require("fs/promises"), 1);
    path17 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/database-query.ts
var fs18, path18, import_better_sqlite32;
var init_database_query = __esm({
  "src/tools/builtin/database-query.ts"() {
    "use strict";
    fs18 = __toESM(require("fs/promises"), 1);
    path18 = __toESM(require("path"), 1);
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
var fs19, path19;
var init_test_gen = __esm({
  "src/tools/builtin/test-gen.ts"() {
    "use strict";
    fs19 = __toESM(require("fs/promises"), 1);
    path19 = __toESM(require("path"), 1);
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
var fs20, path20, import_fast_glob3;
var init_repo_map = __esm({
  "src/tools/builtin/repo-map.ts"() {
    "use strict";
    fs20 = __toESM(require("fs/promises"), 1);
    path20 = __toESM(require("path"), 1);
    import_fast_glob3 = __toESM(require("fast-glob"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/self-analyze.ts
var fs21, path21;
var init_self_analyze = __esm({
  "src/tools/builtin/self-analyze.ts"() {
    "use strict";
    fs21 = __toESM(require("fs/promises"), 1);
    path21 = __toESM(require("path"), 1);
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
var fs22, path22;
var init_unified_diff_edit = __esm({
  "src/tools/builtin/unified-diff-edit.ts"() {
    "use strict";
    fs22 = __toESM(require("fs/promises"), 1);
    path22 = __toESM(require("path"), 1);
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
var fs23, path23;
var init_doc_gen = __esm({
  "src/tools/builtin/doc-gen.ts"() {
    "use strict";
    fs23 = __toESM(require("fs/promises"), 1);
    path23 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/notebook.ts
var fs24, vm;
var init_notebook = __esm({
  "src/tools/builtin/notebook.ts"() {
    "use strict";
    fs24 = __toESM(require("fs/promises"), 1);
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
var fs25, path24;
var init_create_plan = __esm({
  "src/tools/builtin/create-plan.ts"() {
    "use strict";
    fs25 = __toESM(require("fs/promises"), 1);
    path24 = __toESM(require("path"), 1);
    init_tool_types();
  }
});

// src/tools/builtin/update-plan.ts
var fs26, path25;
var init_update_plan = __esm({
  "src/tools/builtin/update-plan.ts"() {
    "use strict";
    fs26 = __toESM(require("fs/promises"), 1);
    path25 = __toESM(require("path"), 1);
    init_tool_types();
    init_create_plan();
  }
});

// src/tools/builtin/read-plan.ts
var fs27, path26;
var init_read_plan = __esm({
  "src/tools/builtin/read-plan.ts"() {
    "use strict";
    fs27 = __toESM(require("fs/promises"), 1);
    path26 = __toESM(require("path"), 1);
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
var path27;
var init_tool_runner = __esm({
  "src/tools/tool-runner.ts"() {
    "use strict";
    path27 = __toESM(require("path"), 1);
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
            const stat8 = await import_node_fs.promises.stat(messageDir);
            if (!stat8.isDirectory())
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
var fs29, path28, Store, USAGE_DIR, USAGE_FILE, UsageStorage, usageStorage;
var init_usage_storage = __esm({
  "main/usage-storage.ts"() {
    "use strict";
    fs29 = __toESM(require("fs/promises"), 1);
    path28 = __toESM(require("path"), 1);
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
        return path28.join(workspacePath, USAGE_DIR, USAGE_FILE);
      }
      /**
       * Ensure usage directory exists
       */
      async ensureUsageDir(workspacePath) {
        const usageDir = path28.join(workspacePath, USAGE_DIR);
        await fs29.mkdir(usageDir, { recursive: true });
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
          const content = await fs29.readFile(usagePath, "utf-8");
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
        await fs29.writeFile(usagePath, JSON.stringify(data, null, 2), "utf-8");
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
          const content = await fs29.readFile(usagePath, "utf-8");
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
            const content = await fs29.readFile(usagePath, "utf-8");
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
function cleanupSettingsIpcHandlers() {
  import_electron2.ipcMain.removeHandler("settings:get");
  import_electron2.ipcMain.removeHandler("settings:getAll");
  import_electron2.ipcMain.removeHandler("settings:set");
  import_electron2.ipcMain.removeHandler("settings:reset");
  import_electron2.ipcMain.removeHandler("settings:addRecentFolder");
  import_electron2.ipcMain.removeHandler("settings:getRecentFolders");
  import_electron2.ipcMain.removeHandler("settings:addRecentWorkspace");
  import_electron2.ipcMain.removeHandler("settings:getRecentWorkspaces");
  import_electron2.ipcMain.removeHandler("settings:addSavedWorkspace");
  import_electron2.ipcMain.removeHandler("settings:removeSavedWorkspace");
  import_electron2.ipcMain.removeHandler("settings:getSavedWorkspaces");
  import_electron2.ipcMain.removeHandler("settings:resolve");
}
var import_electron2, defaultSettings, settingsManagerInstance, syncManagerProxy, settingsManager;
var init_settings = __esm({
  "main/settings.ts"() {
    "use strict";
    import_electron2 = require("electron");
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
      get: (path36) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.get(path36);
      },
      getAll: () => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.getAll();
      },
      set: (path36, value) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.set(path36, value);
      },
      reset: (path36) => {
        if (!settingsManagerInstance) {
          throw new Error("SettingsManager not initialized");
        }
        return settingsManagerInstance.reset(path36);
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

// main/core-integration.ts
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
var currentWorkingDirectory, agentInstance, permissionManager;
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
    agentInstance = null;
    permissionManager = null;
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
var fs30, path29, import_electron3, syncNotifier, STORAGE_VERSION, CHATS_DIR, WORKSPACE_CHATS_DIR, MAX_CHATS_PER_WORKSPACE, ChatStorage, chatStorage;
var init_chat_storage = __esm({
  "main/chat-storage.ts"() {
    "use strict";
    fs30 = __toESM(require("fs/promises"), 1);
    path29 = __toESM(require("path"), 1);
    import_electron3 = require("electron");
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
        this.workspacesBaseDir = path29.join(import_electron3.app.getPath("userData"), "workspaces");
        return this.workspacesBaseDir;
      }
      /**
       * Get the chats directory path based on storage context
       */
      async getChatsDir(context) {
        if (context.type === "workspace" && context.workspace) {
          const workspacesDir = await this.getWorkspacesBaseDir();
          const workspaceDir = path29.join(workspacesDir, context.workspace.id);
          return path29.join(workspaceDir, WORKSPACE_CHATS_DIR);
        } else if (context.type === "project" && context.projectPath) {
          return path29.join(context.projectPath, CHATS_DIR);
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
          await fs30.mkdir(chatsDir, { recursive: true });
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
          const filePath = path29.join(chatsDir, `${conversation.id}.json`);
          const tempPath = `${filePath}.tmp`;
          await fs30.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
          let isNew = false;
          try {
            await fs30.access(filePath);
          } catch {
            isNew = true;
          }
          await fs30.rename(tempPath, filePath);
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
            await fs30.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs30.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path29.join(chatsDir, file.name);
              const content = await fs30.readFile(filePath, "utf-8");
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
          const filePath = path29.join(chatsDir, `${conversationId}.json`);
          await fs30.unlink(filePath);
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
            await fs30.access(chatsDir);
          } catch {
            return { conversations: [] };
          }
          const entries = await fs30.readdir(chatsDir, { withFileTypes: true });
          const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
          const conversations = [];
          for (const file of chatFiles) {
            try {
              const filePath = path29.join(chatsDir, file.name);
              const content = await fs30.readFile(filePath, "utf-8");
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
    folders: (options.folders || []).map((path36, index) => ({
      id: `folder-${index}-${now}`,
      path: path36
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
var fs31, path30, import_electron4, WORKSPACES_DIR, WORKSPACE_METADATA_FILE, WorkspaceStorage, workspaceStorage;
var init_workspace_storage = __esm({
  "main/workspace-storage.ts"() {
    "use strict";
    fs31 = __toESM(require("fs/promises"), 1);
    path30 = __toESM(require("path"), 1);
    import_electron4 = require("electron");
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
        const userData = import_electron4.app.getPath("userData");
        this.workspacesDir = path30.join(userData, WORKSPACES_DIR);
        await fs31.mkdir(this.workspacesDir, { recursive: true });
        return this.workspacesDir;
      }
      /**
       * Get the storage path for a specific workspace's app data
       */
      async getWorkspaceStoragePath(workspaceId) {
        const workspacesDir = await this.getWorkspacesDir();
        const storagePath = path30.join(workspacesDir, workspaceId);
        await fs31.mkdir(storagePath, { recursive: true });
        return storagePath;
      }
      /**
       * Get the metadata file path
       */
      async getMetadataPath() {
        const workspacesDir = await this.getWorkspacesDir();
        return path30.join(workspacesDir, WORKSPACE_METADATA_FILE);
      }
      /**
       * Load all workspace metadata
       */
      async loadMetadata() {
        try {
          const metadataPath = await this.getMetadataPath();
          const content = await fs31.readFile(metadataPath, "utf-8");
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
        await fs31.writeFile(metadataPath, JSON.stringify(data, null, 2), "utf-8");
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
          await fs31.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
          await fs31.rename(tempPath, targetPath);
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
          const content = await fs31.readFile(filePath, "utf-8");
          const workspace = JSON.parse(content);
          if (!workspace.id || !workspace.name || !Array.isArray(workspace.folders)) {
            return { success: false, error: "Invalid workspace file format" };
          }
          const baseDir = path30.dirname(filePath);
          workspace.folders = workspace.folders.map((folder) => ({
            ...folder,
            path: path30.isAbsolute(folder.path) ? folder.path : path30.resolve(baseDir, folder.path)
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
            await fs31.writeFile(tempPath, JSON.stringify(updatedWorkspace, null, 2), "utf-8");
            await fs31.rename(tempPath, meta.filePath);
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
              await fs31.unlink(meta.filePath);
            } catch {
            }
          }
          if (deleteData) {
            const storagePath = await this.getWorkspaceStoragePath(workspaceId);
            try {
              await fs31.rm(storagePath, { recursive: true, force: true });
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
          const exportDir = path30.join(targetDir, `${workspace.name}-workspace`);
          await fs31.mkdir(exportDir, { recursive: true });
          const exportWorkspace = {
            ...workspace,
            folders: workspace.folders.map((f) => ({
              ...f,
              path: path30.relative(exportDir, f.path)
            }))
          };
          const workspaceFilePath = path30.join(exportDir, `${workspace.name}${WORKSPACE_FILE_EXTENSION}`);
          await fs31.writeFile(workspaceFilePath, JSON.stringify(exportWorkspace, null, 2), "utf-8");
          const sourceStoragePath = await this.getWorkspaceStoragePath(workspaceId);
          const targetStoragePath = path30.join(exportDir, "workspace-data");
          try {
            await fs31.cp(sourceStoragePath, targetStoragePath, { recursive: true, force: true });
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
          const entries = await fs31.readdir(sourceDir, { withFileTypes: true });
          const workspaceFile = entries.find(
            (e) => e.isFile() && e.name.endsWith(WORKSPACE_FILE_EXTENSION)
          );
          if (!workspaceFile) {
            return { success: false, error: "No workspace file found in source directory" };
          }
          const workspaceFilePath = path30.join(sourceDir, workspaceFile.name);
          const result = await this.loadWorkspaceFromFile(workspaceFilePath);
          if (!result.success || !result.workspace) {
            return result;
          }
          const workspace = result.workspace;
          const sourceDataPath = path30.join(sourceDir, "workspace-data");
          try {
            await fs31.access(sourceDataPath);
            const targetStoragePath = await this.getWorkspaceStoragePath(workspace.id);
            await fs31.cp(sourceDataPath, targetStoragePath, { recursive: true, force: true });
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
            name: folderName || path30.basename(folderPath)
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
              const dir = path30.dirname(oldPath);
              const newPath = path30.join(dir, `${newName}${WORKSPACE_FILE_EXTENSION}`);
              try {
                await fs31.rename(oldPath, newPath);
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

// src/memory/workspace-indexer.ts
async function getWorkspaceIndexer(workspace) {
  if (!activeIndexers2.has(workspace.id)) {
    const indexer = new WorkspaceIndexer(workspace);
    await indexer.initialize();
    activeIndexers2.set(workspace.id, indexer);
  }
  return activeIndexers2.get(workspace.id);
}
async function closeWorkspaceIndexer(workspaceId) {
  const indexer = activeIndexers2.get(workspaceId);
  if (indexer) {
    await indexer.destroy();
    activeIndexers2.delete(workspaceId);
  }
}
async function closeAllWorkspaceIndexers() {
  const promises = Array.from(activeIndexers2.values()).map((idx) => idx.destroy());
  await Promise.all(promises);
  activeIndexers2.clear();
}
var fs32, path31, import_electron5, import_fast_glob4, INDEX_VERSION2, SEMANTIC_SEARCH_THRESHOLD2, DEFAULT_SYNC_INTERVAL_MS2, DEFAULT_INDEXING_CONFIG3, WorkspaceIndexer, activeIndexers2;
var init_workspace_indexer = __esm({
  "src/memory/workspace-indexer.ts"() {
    "use strict";
    fs32 = __toESM(require("fs/promises"), 1);
    path31 = __toESM(require("path"), 1);
    import_electron5 = require("electron");
    import_fast_glob4 = __toESM(require("fast-glob"), 1);
    init_semantic_memory();
    init_smart_chunker();
    INDEX_VERSION2 = 1;
    SEMANTIC_SEARCH_THRESHOLD2 = 80;
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
    WorkspaceIndexer = class {
      workspace;
      semanticMemory = null;
      smartChunker;
      config;
      state;
      statusFilePath;
      indexDir;
      fileTimestamps = /* @__PURE__ */ new Map();
      indexedFiles = /* @__PURE__ */ new Set();
      projectTimestamps = /* @__PURE__ */ new Map();
      syncTimer = null;
      abortController = null;
      isDestroyed = false;
      // Callbacks for status updates
      onStatusChange;
      onProgress;
      constructor(workspace) {
        this.workspace = workspace;
        this.config = { ...DEFAULT_INDEXING_CONFIG3 };
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        const workspacesDir = path31.join(import_electron5.app.getPath("userData"), "workspaces");
        this.indexDir = path31.join(workspacesDir, workspace.id, "index");
        this.statusFilePath = path31.join(this.indexDir, "status.json");
        this.state = {
          status: "idle",
          progress: 0,
          totalFiles: 0,
          processedFiles: 0,
          indexedChunks: 0,
          lastSyncAt: null,
          lastError: null,
          isSemanticSearchReady: false,
          perProjectState: {}
        };
      }
      async initialize() {
        if (this.isDestroyed) {
          throw new Error("WorkspaceIndexer has been destroyed");
        }
        await fs32.mkdir(this.indexDir, { recursive: true });
        this.semanticMemory = await SemanticMemory.create(this.indexDir);
        await this.loadStatus();
      }
      async loadStatus() {
        try {
          const exists = await fs32.access(this.statusFilePath).then(() => true).catch(() => false);
          if (exists) {
            const content = await fs32.readFile(this.statusFilePath, "utf-8");
            const status = JSON.parse(content);
            if (status.version === INDEX_VERSION2 && status.workspaceId === this.workspace.id) {
              this.state = status.state;
              this.indexedFiles = new Set(status.indexedFiles);
              this.fileTimestamps.clear();
              for (const [file, timestamp] of Object.entries(status.fileTimestamps)) {
                this.fileTimestamps.set(file, timestamp);
              }
              this.projectTimestamps.clear();
              for (const [project, timestamp] of Object.entries(status.projectTimestamps || {})) {
                this.projectTimestamps.set(project, timestamp);
              }
              if (this.state.lastSyncAt) {
                const hoursSinceSync = (Date.now() - this.state.lastSyncAt) / (1e3 * 60 * 60);
                if (hoursSinceSync > 24 && this.config.autoIndex) {
                  console.log("[WorkspaceIndexer] Index is stale, will reindex");
                  this.state.status = "idle";
                  this.state.progress = 0;
                }
              }
            }
          }
        } catch (error) {
          console.warn("[WorkspaceIndexer] Failed to load status:", error);
          this.resetState();
        }
      }
      async saveStatus() {
        try {
          const status = {
            version: INDEX_VERSION2,
            workspaceId: this.workspace.id,
            state: this.state,
            indexedFiles: Array.from(this.indexedFiles),
            fileTimestamps: Object.fromEntries(this.fileTimestamps),
            projectTimestamps: Object.fromEntries(this.projectTimestamps)
          };
          await fs32.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), "utf-8");
        } catch (error) {
          console.error("[WorkspaceIndexer] Failed to save status:", error);
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
          isSemanticSearchReady: false,
          perProjectState: {}
        };
        this.indexedFiles.clear();
        this.fileTimestamps.clear();
        this.projectTimestamps.clear();
      }
      /**
       * Start automatic indexing for all projects in workspace
       */
      async startIndexing() {
        if (this.isDestroyed)
          return;
        if (this.state.status === "indexing") {
          console.log("[WorkspaceIndexer] Already indexing, skipping");
          return;
        }
        if (!this.config.autoIndex) {
          console.log("[WorkspaceIndexer] Auto-index disabled, skipping");
          return;
        }
        try {
          await this.performIndexing(false);
        } catch (error) {
          console.error("[WorkspaceIndexer] Indexing failed:", error);
          this.updateState({
            status: "error",
            lastError: error.message
          });
        }
      }
      /**
       * Force full reindex of all projects
       */
      async reindex() {
        if (this.isDestroyed)
          return;
        await this.clearIndex();
        await this.performIndexing(true);
      }
      /**
       * Reindex a specific project in the workspace
       */
      async reindexProject(projectId) {
        if (this.isDestroyed)
          return;
        const folder = this.workspace.folders.find((f) => f.id === projectId);
        if (!folder) {
          throw new Error(`Project ${projectId} not found in workspace`);
        }
        this.projectTimestamps.delete(projectId);
        const prefix = `${projectId}:`;
        for (const file of this.indexedFiles) {
          if (file.startsWith(prefix)) {
            this.indexedFiles.delete(file);
          }
        }
        await this.performIndexing(false);
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
            const filePath = path31.join(this.indexDir, file);
            const exists = await fs32.access(filePath).then(() => true).catch(() => false);
            if (exists) {
              await fs32.unlink(filePath);
            }
          }
        } catch (error) {
          console.warn("[WorkspaceIndexer] Error clearing index files:", error);
        }
        this.resetState();
        await fs32.mkdir(this.indexDir, { recursive: true });
        this.semanticMemory = await SemanticMemory.create(this.indexDir);
        this.notifyStatusChange();
      }
      /**
       * Perform the actual indexing across all projects
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
          indexedChunks: 0,
          perProjectState: {}
        });
        try {
          const projectFiles = /* @__PURE__ */ new Map();
          let totalFiles = 0;
          for (const folder of this.workspace.folders) {
            const files = await this.getProjectFiles(folder.path);
            projectFiles.set(folder.id, files);
            totalFiles += files.length;
            this.state.perProjectState[folder.id] = {
              status: "pending",
              processedFiles: 0,
              totalFiles: files.length
            };
          }
          this.updateState({ totalFiles });
          let globalProcessed = 0;
          let globalChunks = 0;
          for (const [projectId, files] of projectFiles) {
            if (signal.aborted) {
              throw new Error("Indexing aborted");
            }
            const folder = this.workspace.folders.find((f) => f.id === projectId);
            if (!folder)
              continue;
            this.state.perProjectState[projectId] = {
              status: "indexing",
              processedFiles: 0,
              totalFiles: files.length
            };
            let filesToIndex = files;
            if (!fullRebuild) {
              const lastProjectIndex = this.projectTimestamps.get(projectId);
              if (lastProjectIndex) {
                filesToIndex = await this.getChangedFiles(files, projectId);
                if (filesToIndex.length === 0) {
                  console.log(`[WorkspaceIndexer] No changes in ${folder.name || projectId}`);
                  this.state.perProjectState[projectId].status = "complete";
                  continue;
                }
              }
            }
            const { processed, chunks } = await this.indexProject(
              folder,
              filesToIndex,
              signal,
              (processed2) => {
                this.state.perProjectState[projectId].processedFiles = processed2;
                this.onProgress?.(globalProcessed + processed2, totalFiles, projectId);
              }
            );
            globalProcessed += processed;
            globalChunks += chunks;
            this.projectTimestamps.set(projectId, Date.now());
            this.state.perProjectState[projectId].status = "complete";
            const progress = Math.round(globalProcessed / totalFiles * 100);
            this.updateState({
              progress,
              processedFiles: globalProcessed,
              indexedChunks: globalChunks,
              isSemanticSearchReady: progress >= SEMANTIC_SEARCH_THRESHOLD2
            });
            if (globalProcessed % 20 === 0) {
              await this.saveStatus();
            }
          }
          this.updateState({
            status: "complete",
            progress: 100,
            lastSyncAt: Date.now(),
            indexedChunks: globalChunks,
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
       * Get files to index for a project
       */
      async getProjectFiles(projectPath) {
        const includePatterns = [
          "**/*.{ts,tsx,js,jsx,mjs,cjs}",
          "**/*.{py,pyi}",
          "**/*.{java,kt}",
          "**/*.{go,rs}",
          "**/*.{rb,php}",
          "**/*.{swift,c,cpp,h,hpp}",
          "**/*.{cs,fs}"
        ];
        const files = await (0, import_fast_glob4.default)(includePatterns, {
          cwd: projectPath,
          ignore: this.config.excludePatterns,
          absolute: true,
          followSymbolicLinks: false,
          concurrency: this.config.indexConcurrency
        });
        return files.slice(0, this.config.maxFilesToIndex);
      }
      /**
       * Index a single project
       */
      async indexProject(folder, files, signal, onProgress) {
        if (!this.semanticMemory) {
          throw new Error("Semantic memory not initialized");
        }
        const batchSize = this.config.embeddingBatchSize;
        let processed = 0;
        let totalChunks = 0;
        for (let i = 0; i < files.length; i += batchSize) {
          if (signal.aborted) {
            throw new Error("Indexing aborted");
          }
          const batch = files.slice(i, i + batchSize);
          const batchChunks = [];
          for (const filePath of batch) {
            try {
              const chunks = await this.smartChunker.chunkFile(filePath, folder.path);
              batchChunks.push(...chunks);
              const relativePath = path31.relative(folder.path, filePath);
              const storageKey = `${folder.id}:${relativePath}`;
              this.indexedFiles.add(storageKey);
              const stats = await fs32.stat(filePath);
              this.fileTimestamps.set(storageKey, stats.mtimeMs);
            } catch (error) {
              console.warn(`[WorkspaceIndexer] Failed to process ${filePath}:`, error);
            }
          }
          if (batchChunks.length > 0) {
            const memoryChunks = batchChunks.map((chunk) => ({
              id: chunk.id,
              content: this.formatChunkContent(chunk, folder),
              type: "rag_chunk",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              metadata: {
                ...chunk.metadata,
                projectId: folder.id,
                projectName: folder.name || path31.basename(folder.path),
                projectPath: folder.path
              }
            }));
            await this.semanticMemory.indexChunks(memoryChunks);
            totalChunks += memoryChunks.length;
          }
          processed += batch.length;
          onProgress(processed);
        }
        return { processed, chunks: totalChunks };
      }
      /**
       * Get files that have changed since last sync for a project
       */
      async getChangedFiles(allFiles, projectId) {
        const changed = [];
        for (const filePath of allFiles) {
          try {
            const stats = await fs32.stat(filePath);
            const relativePath = path31.relative(this.workspace.folders.find((f) => f.id === projectId)?.path || "", filePath);
            const storageKey = `${projectId}:${relativePath}`;
            const lastModified = this.fileTimestamps.get(storageKey);
            if (!lastModified || stats.mtimeMs > lastModified) {
              changed.push(filePath);
            }
          } catch {
            changed.push(filePath);
          }
        }
        return changed;
      }
      /**
       * Format chunk content with metadata for better embeddings
       */
      formatChunkContent(chunk, folder) {
        const parts = [];
        parts.push(`File: ${chunk.metadata.file}`);
        parts.push(`Project: ${folder.name || path31.basename(folder.path)}`);
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
            console.log("[WorkspaceIndexer] Running auto-sync...");
            try {
              await this.performIndexing(false);
            } catch (error) {
              console.error("[WorkspaceIndexer] Auto-sync failed:", error);
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
       * Query the indexed workspace (cross-project search)
       */
      async query(query, options) {
        if (!this.semanticMemory) {
          throw new Error("Semantic memory not initialized");
        }
        if (!this.state.isSemanticSearchReady) {
          throw new Error(`Semantic search not ready. Indexing at ${this.state.progress}%, need ${SEMANTIC_SEARCH_THRESHOLD2}%`);
        }
        const topK = options?.topK || 5;
        const results = await this.semanticMemory.search(query, topK * 2);
        const searchResults = results.map((chunk) => ({
          ...chunk,
          projectId: chunk.metadata?.projectId,
          projectName: chunk.metadata?.projectName,
          relativePath: chunk.metadata?.file
        }));
        if (options?.projectId) {
          return searchResults.filter((r) => r.projectId === options.projectId).slice(0, topK);
        }
        return searchResults.slice(0, topK);
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
       * Update indexing configuration
       */
      async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.smartChunker = new SmartChunker(
          this.config.maxChunkSize,
          this.config.chunkSize
        );
        if (updates.syncIntervalMinutes !== void 0) {
          this.startAutoSync();
        }
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
      }
    };
    activeIndexers2 = /* @__PURE__ */ new Map();
  }
});

// main/notifications.ts
function playSound() {
  try {
    import_electron6.shell.beep();
  } catch (error) {
    console.error("[Notifications] Failed to play sound:", error);
  }
}
function requestNotificationSound(window, type) {
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
      playSound();
    }
  } catch (error) {
    console.error("[Notifications] Error requesting notification sound:", error);
  }
}
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
    const ptyDir = path32.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path32.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs33.existsSync(helperPath)) {
      fs33.chmodSync(helperPath, 493);
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
  const resolvedCwd = path32.resolve(cwd || os2.homedir());
  const safeCwd = fs33.existsSync(resolvedCwd) ? resolvedCwd : os2.homedir();
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
function destroyAllTerminals() {
  for (const id of sessions.keys()) {
    destroyTerminal(id);
  }
}
var pty, os2, path32, fs33, sessions;
var init_terminal_manager = __esm({
  "main/terminal-manager.ts"() {
    "use strict";
    pty = __toESM(require("node-pty"), 1);
    os2 = __toESM(require("os"), 1);
    path32 = __toESM(require("path"), 1);
    fs33 = __toESM(require("fs"), 1);
    ensureSpawnHelperExecutable();
    sessions = /* @__PURE__ */ new Map();
  }
});

// main/remote-auth.ts
var remote_auth_exports = {};
__export(remote_auth_exports, {
  ensureApiKey: () => ensureApiKey,
  generateApiKey: () => generateApiKey,
  getApiKey: () => getApiKey,
  getCorsOptions: () => getCorsOptions,
  regenerateApiKey: () => regenerateApiKey,
  validateApiKey: () => validateApiKey,
  validateIp: () => validateIp
});
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
      const mainWindow = import_electron7.BrowserWindow.getAllWindows()[0];
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
var import_express, import_cors, import_express_rate_limit, ngrok, fs35, path34, import_electron7, app4, server, ngrokListener, isRunning, publicUrl, port, terminalOutputs;
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
    import_electron7 = require("electron");
    app4 = null;
    server = null;
    ngrokListener = null;
    isRunning = false;
    publicUrl = null;
    port = 3e3;
    terminalOutputs = /* @__PURE__ */ new Map();
  }
});

// main/ipc-handlers.ts
var ipc_handlers_exports = {};
__export(ipc_handlers_exports, {
  cleanupIpcHandlers: () => cleanupIpcHandlers,
  setAgentRef: () => setAgentRef,
  setConfigRef: () => setConfigRef,
  setMainWindowForBrowser: () => setMainWindowForBrowser,
  setToolsRef: () => setToolsRef,
  setupIpcHandlers: () => setupIpcHandlers
});
module.exports = __toCommonJS(ipc_handlers_exports);
function setAgentRef(agent) {
  agentRef = agent;
}
function setToolsRef(tools) {
  toolsRef = tools;
}
function setConfigRef(config) {
  configRef = config;
}
function setupIpcHandlers() {
  import_electron8.ipcMain.handle("agent:create-conversation", async (_, conversationId, model, provider) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.createConversation(conversationId, model, provider);
  });
  import_electron8.ipcMain.handle("agent:close-conversation", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.closeConversation(conversationId);
  });
  import_electron8.ipcMain.handle("agent:has-conversation", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return agentRef.hasConversation(conversationId);
  });
  import_electron8.ipcMain.handle("agent:send-message", async (_, conversationId, message, workingDirectory) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    await agentRef.sendMessage(conversationId, message, workingDirectory);
  });
  import_electron8.ipcMain.handle("agent:abort", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    agentRef.abort(conversationId);
  });
  import_electron8.ipcMain.handle("agent:switch-model", async (_, conversationId, model, provider) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.switchModel(conversationId, model, provider);
  });
  import_electron8.ipcMain.handle("agent:clear-conversation", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    agentRef.clearConversation(conversationId);
  });
  import_electron8.ipcMain.handle("agent:get-token-count", async (_, conversationId) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.getTokenCount(conversationId);
  });
  import_electron8.ipcMain.handle("agent:respond-permission", async (_, toolId, decision) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return { success: agentRef.respondPermission(toolId, decision) };
  });
  import_electron8.ipcMain.handle("agent:respond-user-input", async (_, requestId, response2, cancelled) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return { success: agentRef.respondUserInput(requestId, response2, cancelled) };
  });
  import_electron8.ipcMain.handle("agent:set-mode", async (_, conversationId, mode) => {
    if (!agentRef)
      throw new Error("Agent not initialized");
    return await agentRef.setMode(conversationId, mode);
  });
  import_electron8.ipcMain.handle("agent:set-permission-mode", (_, autoRunMode) => {
    setPermissionMode(autoRunMode);
  });
  import_electron8.ipcMain.handle("tools:get-metadata", async (_, toolName) => {
    if (!toolsRef)
      return null;
    const tools = toolsRef.list();
    return tools.find((t) => t.name === toolName) || null;
  });
  import_electron8.ipcMain.handle("chat:save", async (_, projectPath, conversation) => {
    return chatStorageRef.saveConversationForProject(projectPath, conversation);
  });
  import_electron8.ipcMain.handle("chat:load", async (_, projectPath) => {
    return chatStorageRef.loadConversationsForProject(projectPath);
  });
  import_electron8.ipcMain.handle("chat:delete", async (_, projectPath, conversationId) => {
    const result = await chatStorageRef.deleteConversationForProject(projectPath, conversationId);
    try {
      const fileHistoryManager2 = getFileHistoryManager(projectPath);
      await fileHistoryManager2.clearConversation(conversationId);
    } catch (error) {
      console.error("[IPC] Failed to clear file history for conversation:", error);
    }
    return result;
  });
  import_electron8.ipcMain.handle("chat:list", async (_, projectPath) => {
    return chatStorageRef.listConversationsForProject(projectPath);
  });
  import_electron8.ipcMain.handle("file:read", async (_, filePath) => {
    try {
      const resolvedPath = path35.isAbsolute(filePath) ? filePath : path35.join(getWorkingDirectory(), filePath);
      const content = await fs36.readFile(resolvedPath, "utf-8");
      return { content };
    } catch (error) {
      return { content: "", error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:write", async (_, filePath, content) => {
    try {
      const resolvedPath = path35.isAbsolute(filePath) ? filePath : path35.join(getWorkingDirectory(), filePath);
      await fs36.mkdir(path35.dirname(resolvedPath), { recursive: true });
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
        await fs36.writeFile(resolvedPath, content, {
          encoding: "utf-8",
          signal: timeoutController.signal
        });
        const writtenContent = await fs36.readFile(resolvedPath, "utf-8");
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
  import_electron8.ipcMain.handle("file:edit", async (_, filePath, oldString, newString) => {
    try {
      const resolvedPath = path35.isAbsolute(filePath) ? filePath : path35.join(getWorkingDirectory(), filePath);
      const content = await fs36.readFile(resolvedPath, "utf-8");
      if (!content.includes(oldString)) {
        return { success: false, error: "Old string not found in file" };
      }
      const newContent = content.replace(oldString, newString);
      await fs36.writeFile(resolvedPath, newContent, "utf-8");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:list", async (_, dirPath) => {
    try {
      const resolvedPath = path35.isAbsolute(dirPath) ? dirPath : path35.join(getWorkingDirectory(), dirPath);
      const entries = await fs36.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path35.join(resolvedPath, entry.name)
      }));
      return { files };
    } catch (error) {
      return { files: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:mkdir", async (_, dirPath) => {
    try {
      const resolvedPath = path35.isAbsolute(dirPath) ? dirPath : path35.join(getWorkingDirectory(), dirPath);
      await fs36.mkdir(resolvedPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:watch", async (event, dirPath) => {
    try {
      const resolvedPath = path35.isAbsolute(dirPath) ? dirPath : path35.join(getWorkingDirectory(), dirPath);
      const existing = fileWatchers.get(resolvedPath);
      if (existing) {
        existing.abort();
      }
      const abortController = new AbortController();
      fileWatchers.set(resolvedPath, abortController);
      const { watch } = await import("fs");
      const watcher = watch(resolvedPath, { recursive: true }, (eventType, filename) => {
        if (!filename)
          return;
        const fullPath = path35.join(resolvedPath, filename);
        import_electron8.BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send("file:change", {
            type: eventType === "rename" ? "unlink" : "change",
            path: fullPath
          });
        });
      });
      abortController.signal.addEventListener("abort", () => {
        watcher.close();
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:unwatch", async (_, dirPath) => {
    const resolvedPath = path35.isAbsolute(dirPath) ? dirPath : path35.join(getWorkingDirectory(), dirPath);
    const watcher = fileWatchers.get(resolvedPath);
    if (watcher) {
      watcher.abort();
      fileWatchers.delete(resolvedPath);
    }
  });
  import_electron8.ipcMain.handle("file:searchContent", async (_, projectPath, searchTerm) => {
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
        const ext = path35.extname(filePath).toLowerCase();
        return binaryExtensions.has(ext);
      };
      const searchFile = async (filePath) => {
        if (results.length >= MAX_RESULTS)
          return;
        if (isBinary(filePath))
          return;
        try {
          const stats = await fs36.stat(filePath);
          if (stats.size > MAX_FILE_SIZE)
            return;
          const content = await fs36.readFile(filePath, "utf-8");
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
          const entries = await fs36.readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (results.length >= MAX_RESULTS)
              return;
            const fullPath = path35.join(dirPath, entry.name);
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
  import_electron8.ipcMain.handle("file:backup", async (_, conversationId, messageId, toolCallId, filePath, changeType) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      await fileHistoryManager2.captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:restore", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      const result = await fileHistoryManager2.rollbackToMessage(conversationId, messageId);
      return result;
    } catch (error) {
      return { success: false, restoredFiles: [], failedFiles: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:getChanges", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager2.getMessageChangesWithStats(conversationId, messageId);
      return { changes };
    } catch (error) {
      return { changes: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:hasChanges", async (_, conversationId, messageId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      const hasChanges = fileHistoryManager2.hasChanges(conversationId, messageId);
      return { hasChanges };
    } catch (error) {
      return { hasChanges: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:getAllChanges", async (_, conversationId) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager2.getAllConversationChanges(conversationId);
      return { changes };
    } catch (error) {
      return { changes: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("file:getDiff", async (_, conversationId, messageId, filePath) => {
    try {
      const fileHistoryManager2 = getFileHistoryManager(getWorkingDirectory());
      const changes = fileHistoryManager2.getMessageChanges(conversationId, messageId);
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
  import_electron8.ipcMain.handle("tool:execute", async (_, toolName, input) => {
    if (!toolsRef)
      throw new Error("Tools not initialized");
    try {
      const result = await toolsRef.execute(toolName, input);
      return { result };
    } catch (error) {
      return { result: null, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("tool:list", async () => {
    if (!toolsRef)
      return [];
    return toolsRef.list();
  });
  import_electron8.ipcMain.handle("config:get", async (_, key) => {
    if (!configRef)
      return null;
    return configRef.get(key);
  });
  import_electron8.ipcMain.handle("config:set", async (_, key, value) => {
    if (!configRef)
      throw new Error("Config not initialized");
    configRef.set(key, value);
  });
  import_electron8.ipcMain.handle("config:get-models", async () => {
    if (!configRef)
      return [];
    return configRef.getModels();
  });
  import_electron8.ipcMain.handle("config:get-providers", async () => {
    if (!configRef)
      return [];
    return configRef.getProviders();
  });
  import_electron8.ipcMain.handle("config:set-cwd", async (_, cwd) => {
    setWorkingDirectory(cwd);
    return { success: true };
  });
  import_electron8.ipcMain.handle("config:get-cwd", async () => {
    return { cwd: getWorkingDirectory() };
  });
  import_electron8.ipcMain.handle("dialog:open-folder", async () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null };
    const result = await import_electron8.dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "Open Folder"
    });
    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null
    };
  });
  import_electron8.ipcMain.handle("dialog:open-workspace", async () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null };
    const result = await import_electron8.dialog.showOpenDialog(window, {
      properties: ["openFile"],
      title: "Open Workspace",
      buttonLabel: "Open Workspace",
      filters: [
        { name: "Omni Code Workspace", extensions: ["omnicode-workspace"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return {
      canceled: result.canceled,
      path: result.filePaths[0] || null
    };
  });
  import_electron8.ipcMain.handle("dialog:create-folder", async () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    if (!window)
      return { canceled: true, path: null, error: "No window available" };
    const result = await import_electron8.dialog.showOpenDialog(window, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select Parent Directory for New Folder",
      buttonLabel: "Select Parent"
    });
    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true, path: null };
    }
    const parentPath = result.filePaths[0];
    const { response: folderName } = await import_electron8.dialog.showMessageBox(window, {
      type: "question",
      buttons: ["Create", "Cancel"],
      defaultId: 0,
      cancelId: 1,
      title: "Create New Folder",
      message: "Enter a name for the new folder:",
      detail: "The folder will be created in: " + parentPath
    });
    if (response === 1) {
      return { canceled: true, path: null };
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-");
    const defaultFolderName = `new-project-${timestamp}`;
    const newFolderPath = path35.join(parentPath, defaultFolderName);
    try {
      try {
        await fs36.access(newFolderPath);
        return { canceled: false, path: null, error: `Folder "${defaultFolderName}" already exists` };
      } catch {
      }
      await fs36.mkdir(newFolderPath, { recursive: false });
      return { canceled: false, path: newFolderPath };
    } catch (error) {
      return { canceled: false, path: null, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("app:get-version", async () => {
    const { app: app5 } = require("electron");
    return app5.getVersion();
  });
  import_electron8.ipcMain.handle("app:get-platform", async () => {
    return process.platform;
  });
  import_electron8.ipcMain.handle("usage:get", async (_, month, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getUsage(month, workspacePath);
    } catch (error) {
      return { error: error.message };
    }
  });
  import_electron8.ipcMain.handle("usage:getSummary", async (_, month, workspacePath) => {
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
  import_electron8.ipcMain.handle("usage:getAvailableMonths", async (_, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getAvailableMonths(workspacePath);
    } catch (error) {
      return [];
    }
  });
  import_electron8.ipcMain.handle("usage:setLimit", async (_, month, limit) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.setMonthlyLimit(month, limit);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("usage:getLimits", async () => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.getAllMonthlyLimits();
    } catch (error) {
      return {};
    }
  });
  import_electron8.ipcMain.handle("usage:cleanup", async (_, monthsToKeep) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.cleanupOldData(monthsToKeep);
    } catch (error) {
      return { deleted: 0, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("usage:export", async (_, workspacePath) => {
    try {
      const usageStorage2 = await getUsageStorage();
      return await usageStorage2.exportToCSV(workspacePath);
    } catch (error) {
      return { error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:start", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.startIndexing();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to start indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:reindex", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.reindex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to reindex:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:stop", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      indexer.abort();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to stop indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:getState", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const state = indexer.getState();
      return { state, error: null };
    } catch (error) {
      console.error("[IPC] Failed to get indexing state:", error);
      return { state: null, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:query", async (_, projectPath, query, topK) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      const results = await indexer.query(query, topK || 5);
      return { results, error: null };
    } catch (error) {
      console.error("[IPC] Failed to query index:", error);
      return { results: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:clear", async (_, projectPath) => {
    try {
      const indexer = await getProjectIndexer(projectPath);
      await indexer.clearIndex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to clear index:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:close", async (_, projectPath) => {
    try {
      await closeProjectIndexer(projectPath);
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close indexer:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("indexing:closeAll", async () => {
    try {
      await closeAllProjectIndexers();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close all indexers:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("window:minimize", () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    window?.minimize();
  });
  import_electron8.ipcMain.handle("window:maximize", () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });
  import_electron8.ipcMain.handle("window:close", () => {
    const window = import_electron8.BrowserWindow.getFocusedWindow();
    window?.close();
  });
  import_electron8.ipcMain.handle("notification:request-sound", async (event, type) => {
    const window = import_electron8.BrowserWindow.fromWebContents(event.sender);
    if (window) {
      requestNotificationSound(window, type);
    }
  });
  import_electron8.ipcMain.handle("terminal:create", (event, id, cwd, cols, rows) => {
    const window = import_electron8.BrowserWindow.fromWebContents(event.sender);
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
  import_electron8.ipcMain.handle("terminal:write", (_, id, data) => {
    writeToTerminal(id, data);
  });
  import_electron8.ipcMain.handle("terminal:resize", (_, id, cols, rows) => {
    resizeTerminal(id, cols, rows);
  });
  import_electron8.ipcMain.handle("terminal:destroy", (_, id) => {
    destroyTerminal(id);
  });
  import_electron8.ipcMain.handle("browser:open", async (_, url, title) => {
    if (!mainWindowRef) {
      return { success: false, error: "Main window not available" };
    }
    mainWindowRef.webContents.send("browser:open", { url, title });
    return { success: true, url };
  });
  import_electron8.ipcMain.handle("browser:navigate", async (_, tabId, url) => {
    if (!mainWindowRef) {
      return { success: false, error: "Main window not available" };
    }
    mainWindowRef.webContents.send("browser:navigate", { tabId, url });
    return { success: true, tabId, url };
  });
  import_electron8.ipcMain.handle("browser:close", async (_, tabId) => {
    if (!mainWindowRef) {
      return { success: false, error: "Main window not available" };
    }
    mainWindowRef.webContents.send("browser:close", { tabId });
    return { success: true, tabId };
  });
  import_electron8.ipcMain.handle("remote:start", async () => {
    try {
      const { initializeRemoteServer: initializeRemoteServer2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      const result = await initializeRemoteServer2();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("remote:stop", async () => {
    try {
      const { stopRemoteServer: stopRemoteServer2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      return await stopRemoteServer2();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("remote:status", async () => {
    try {
      const { getRemoteServerStatus: getRemoteServerStatus2 } = await Promise.resolve().then(() => (init_remote_server(), remote_server_exports));
      return getRemoteServerStatus2();
    } catch (error) {
      return { running: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("remote:regenerate-api-key", async () => {
    try {
      const { regenerateApiKey: regenerateApiKey2 } = await Promise.resolve().then(() => (init_remote_auth(), remote_auth_exports));
      const newKey = regenerateApiKey2();
      return { success: true, apiKey: newKey };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:list", async () => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      return { success: true, workspaces: manager.getSharedWorkspaces() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:add-workspace", async (_, filePath) => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      const workspace = await manager.addWorkspaceFile(filePath);
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:add-folder", async (_, folderPath) => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      const workspace = await manager.addFolder(folderPath);
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:remove", async (_, sharedId) => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      const success = await manager.removeWorkspace(sharedId);
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:set-active", async (_, sharedId) => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      const success = manager.setActiveWorkspace(sharedId);
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("shared-workspaces:active", async () => {
    try {
      const { getSharedWorkspaceManager: getSharedWorkspaceManager2 } = await Promise.resolve().then(() => (init_shared_workspace_manager(), shared_workspace_manager_exports));
      const manager = getSharedWorkspaceManager2();
      await manager.initialize();
      const workspace = manager.getActiveWorkspace();
      return { success: true, workspace };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:create", async (_, options) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.createWorkspace(options);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to create workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:saveToFile", async (_, workspace, filePath) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.saveWorkspaceToFile(workspace, filePath);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to save workspace to file:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:loadFromFile", async (_, filePath) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.loadWorkspaceFromFile(filePath);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to load workspace from file:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:loadById", async (_, workspaceId) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.loadWorkspaceById(workspaceId);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to load workspace by ID:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:update", async (_, workspace) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.updateWorkspace(workspace);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to update workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:list", async () => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.listWorkspaces();
      return result;
    } catch (error) {
      console.error("[IPC] Failed to list workspaces:", error);
      return { workspaces: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:delete", async (_, workspaceId, deleteData) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.deleteWorkspace(workspaceId, deleteData);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to delete workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:addFolder", async (_, workspaceId, folderPath, folderName) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.addFolderToWorkspace(workspaceId, folderPath, folderName);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to add folder to workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:removeFolder", async (_, workspaceId, folderId) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.removeFolderFromWorkspace(workspaceId, folderId);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to remove folder from workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:rename", async (_, workspaceId, newName) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.renameWorkspace(workspaceId, newName);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to rename workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:export", async (_, workspaceId, targetDir) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.exportWorkspace(workspaceId, targetDir);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to export workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:import", async (_, sourceDir) => {
    try {
      const storage = getWorkspaceStorage();
      const result = await storage.importWorkspace(sourceDir);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to import workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:chat:save", async (_, workspace, conversation) => {
    try {
      const storage = getChatStorage();
      const result = await storage.saveConversationForWorkspace(workspace, conversation);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to save workspace conversation:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:chat:load", async (_, workspace) => {
    try {
      const storage = getChatStorage();
      const result = await storage.loadConversationsForWorkspace(workspace);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to load workspace conversations:", error);
      return { conversations: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:chat:delete", async (_, workspace, conversationId) => {
    try {
      const storage = getChatStorage();
      const result = await storage.deleteConversationForWorkspace(workspace, conversationId);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to delete workspace conversation:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:chat:list", async (_, workspace) => {
    try {
      const storage = getChatStorage();
      const result = await storage.listConversationsForWorkspace(workspace);
      return result;
    } catch (error) {
      console.error("[IPC] Failed to list workspace conversations:", error);
      return { conversations: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:start", async (_, workspace) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.startIndexing();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to start workspace indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:reindex", async (_, workspace) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.reindex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to reindex workspace:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:reindexProject", async (_, workspace, projectId) => {
    try {
      const indexer = await getWorkspaceIndexer(workspace);
      await indexer.reindexProject(projectId);
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to reindex workspace project:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:stop", async (_, workspaceId) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: "", folders: [], version: "1.0.0", createdAt: 0, updatedAt: 0 });
      indexer.abort();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to stop workspace indexing:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:getState", async (_, workspaceId) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: "", folders: [], version: "1.0.0", createdAt: 0, updatedAt: 0 });
      const state = indexer.getState();
      return { state, error: null };
    } catch (error) {
      console.error("[IPC] Failed to get workspace indexing state:", error);
      return { state: null, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:query", async (_, workspaceId, query, options) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: "", folders: [], version: "1.0.0", createdAt: 0, updatedAt: 0 });
      const results = await indexer.query(query, options);
      return { results, error: null };
    } catch (error) {
      console.error("[IPC] Failed to query workspace index:", error);
      return { results: [], error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:clear", async (_, workspaceId) => {
    try {
      const indexer = await getWorkspaceIndexer({ id: workspaceId, name: "", folders: [], version: "1.0.0", createdAt: 0, updatedAt: 0 });
      await indexer.clearIndex();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to clear workspace index:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:close", async (_, workspaceId) => {
    try {
      await closeWorkspaceIndexer(workspaceId);
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close workspace indexer:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron8.ipcMain.handle("workspace:indexing:closeAll", async () => {
    try {
      await closeAllWorkspaceIndexers();
      return { success: true, error: null };
    } catch (error) {
      console.error("[IPC] Failed to close all workspace indexers:", error);
      return { success: false, error: error.message };
    }
  });
}
function setMainWindowForBrowser(window) {
  mainWindowRef = window;
}
function cleanupIpcHandlers() {
  destroyAllTerminals();
  fileWatchers.forEach((controller) => controller.abort());
  fileWatchers.clear();
  import_electron8.ipcMain.removeHandler("agent:create-conversation");
  import_electron8.ipcMain.removeHandler("agent:close-conversation");
  import_electron8.ipcMain.removeHandler("agent:has-conversation");
  import_electron8.ipcMain.removeHandler("agent:send-message");
  import_electron8.ipcMain.removeHandler("agent:abort");
  import_electron8.ipcMain.removeHandler("agent:switch-model");
  import_electron8.ipcMain.removeHandler("agent:clear-conversation");
  import_electron8.ipcMain.removeHandler("agent:get-token-count");
  import_electron8.ipcMain.removeHandler("agent:respond-permission");
  import_electron8.ipcMain.removeHandler("agent:respond-user-input");
  import_electron8.ipcMain.removeHandler("agent:set-mode");
  import_electron8.ipcMain.removeHandler("agent:set-permission-mode");
  import_electron8.ipcMain.removeHandler("tools:get-metadata");
  import_electron8.ipcMain.removeHandler("chat:save");
  import_electron8.ipcMain.removeHandler("chat:load");
  import_electron8.ipcMain.removeHandler("chat:delete");
  import_electron8.ipcMain.removeHandler("chat:list");
  import_electron8.ipcMain.removeHandler("file:read");
  import_electron8.ipcMain.removeHandler("file:write");
  import_electron8.ipcMain.removeHandler("file:edit");
  import_electron8.ipcMain.removeHandler("file:list");
  import_electron8.ipcMain.removeHandler("file:watch");
  import_electron8.ipcMain.removeHandler("file:unwatch");
  import_electron8.ipcMain.removeHandler("file:searchContent");
  import_electron8.ipcMain.removeHandler("file:backup");
  import_electron8.ipcMain.removeHandler("file:restore");
  import_electron8.ipcMain.removeHandler("file:getChanges");
  import_electron8.ipcMain.removeHandler("file:hasChanges");
  import_electron8.ipcMain.removeHandler("file:getAllChanges");
  import_electron8.ipcMain.removeHandler("tool:execute");
  import_electron8.ipcMain.removeHandler("tool:list");
  import_electron8.ipcMain.removeHandler("config:get");
  import_electron8.ipcMain.removeHandler("config:set");
  import_electron8.ipcMain.removeHandler("config:get-models");
  import_electron8.ipcMain.removeHandler("config:get-providers");
  import_electron8.ipcMain.removeHandler("dialog:open-folder");
  import_electron8.ipcMain.removeHandler("dialog:create-folder");
  import_electron8.ipcMain.removeHandler("dialog:open-workspace");
  import_electron8.ipcMain.removeHandler("app:get-version");
  import_electron8.ipcMain.removeHandler("app:get-platform");
  import_electron8.ipcMain.removeHandler("usage:get");
  import_electron8.ipcMain.removeHandler("usage:getSummary");
  import_electron8.ipcMain.removeHandler("usage:getAvailableMonths");
  import_electron8.ipcMain.removeHandler("usage:setLimit");
  import_electron8.ipcMain.removeHandler("usage:getLimits");
  import_electron8.ipcMain.removeHandler("usage:cleanup");
  import_electron8.ipcMain.removeHandler("usage:export");
  import_electron8.ipcMain.removeHandler("indexing:start");
  import_electron8.ipcMain.removeHandler("indexing:reindex");
  import_electron8.ipcMain.removeHandler("indexing:stop");
  import_electron8.ipcMain.removeHandler("indexing:getState");
  import_electron8.ipcMain.removeHandler("indexing:query");
  import_electron8.ipcMain.removeHandler("indexing:clear");
  import_electron8.ipcMain.removeHandler("indexing:close");
  import_electron8.ipcMain.removeHandler("indexing:closeAll");
  import_electron8.ipcMain.removeHandler("window:minimize");
  import_electron8.ipcMain.removeHandler("window:maximize");
  import_electron8.ipcMain.removeHandler("window:close");
  import_electron8.ipcMain.removeHandler("notification:request-sound");
  import_electron8.ipcMain.removeHandler("terminal:create");
  import_electron8.ipcMain.removeHandler("terminal:write");
  import_electron8.ipcMain.removeHandler("terminal:resize");
  import_electron8.ipcMain.removeHandler("terminal:destroy");
  import_electron8.ipcMain.removeHandler("browser:open");
  import_electron8.ipcMain.removeHandler("browser:navigate");
  import_electron8.ipcMain.removeHandler("browser:close");
  import_electron8.ipcMain.removeHandler("browser:request-screenshot");
  import_electron8.ipcMain.removeHandler("remote:start");
  import_electron8.ipcMain.removeHandler("remote:stop");
  import_electron8.ipcMain.removeHandler("remote:status");
  import_electron8.ipcMain.removeHandler("remote:regenerate-api-key");
  import_electron8.ipcMain.removeHandler("shared-workspaces:list");
  import_electron8.ipcMain.removeHandler("shared-workspaces:add-workspace");
  import_electron8.ipcMain.removeHandler("shared-workspaces:add-folder");
  import_electron8.ipcMain.removeHandler("shared-workspaces:remove");
  import_electron8.ipcMain.removeHandler("shared-workspaces:set-active");
  import_electron8.ipcMain.removeHandler("shared-workspaces:active");
  import_electron8.ipcMain.removeHandler("workspace:create");
  import_electron8.ipcMain.removeHandler("workspace:saveToFile");
  import_electron8.ipcMain.removeHandler("workspace:loadFromFile");
  import_electron8.ipcMain.removeHandler("workspace:loadById");
  import_electron8.ipcMain.removeHandler("workspace:update");
  import_electron8.ipcMain.removeHandler("workspace:list");
  import_electron8.ipcMain.removeHandler("workspace:delete");
  import_electron8.ipcMain.removeHandler("workspace:addFolder");
  import_electron8.ipcMain.removeHandler("workspace:removeFolder");
  import_electron8.ipcMain.removeHandler("workspace:rename");
  import_electron8.ipcMain.removeHandler("workspace:export");
  import_electron8.ipcMain.removeHandler("workspace:import");
  import_electron8.ipcMain.removeHandler("workspace:chat:save");
  import_electron8.ipcMain.removeHandler("workspace:chat:load");
  import_electron8.ipcMain.removeHandler("workspace:chat:delete");
  import_electron8.ipcMain.removeHandler("workspace:chat:list");
  import_electron8.ipcMain.removeHandler("workspace:indexing:start");
  import_electron8.ipcMain.removeHandler("workspace:indexing:reindex");
  import_electron8.ipcMain.removeHandler("workspace:indexing:reindexProject");
  import_electron8.ipcMain.removeHandler("workspace:indexing:stop");
  import_electron8.ipcMain.removeHandler("workspace:indexing:getState");
  import_electron8.ipcMain.removeHandler("workspace:indexing:query");
  import_electron8.ipcMain.removeHandler("workspace:indexing:clear");
  import_electron8.ipcMain.removeHandler("workspace:indexing:close");
  import_electron8.ipcMain.removeHandler("workspace:indexing:closeAll");
  closeAllWorkspaceIndexers().catch((error) => {
    console.error("[IPC] Error closing workspace indexers during cleanup:", error);
  });
  cleanupSettingsIpcHandlers();
}
var import_electron8, fs36, path35, mainWindowRef, agentRef, toolsRef, configRef, chatStorageRef, fileWatchers, FILE_WRITE_TIMEOUT_MS;
var init_ipc_handlers = __esm({
  "main/ipc-handlers.ts"() {
    import_electron8 = require("electron");
    fs36 = __toESM(require("fs/promises"), 1);
    path35 = __toESM(require("path"), 1);
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
    agentRef = null;
    toolsRef = null;
    configRef = null;
    chatStorageRef = getChatStorage();
    fileWatchers = /* @__PURE__ */ new Map();
    FILE_WRITE_TIMEOUT_MS = 15e3;
  }
});
init_ipc_handlers();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanupIpcHandlers,
  setAgentRef,
  setConfigRef,
  setMainWindowForBrowser,
  setToolsRef,
  setupIpcHandlers
});
//# sourceMappingURL=ipc-handlers.cjs.map