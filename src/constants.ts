export const APP_NAME = 'omni-code';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Multi-LLM AI coding assistant for the terminal';

export const CONFIG_DIR_NAME = '.omnicode';
export const PROJECT_CONTEXT_FILE = 'OMNICODE.md';
export const SESSION_DB_NAME = 'sessions.db';
export const MEMORY_DB_NAME = 'memory.db';
export const CONFIG_FILE_NAME = 'config.json';

export const DEFAULT_PROVIDER = 'xai';
export const DEFAULT_MODEL = 'grok-4-1-fast-reasoning';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_TIMEOUT = 60_000;
export const DEFAULT_MAX_CONTEXT_TOKENS = 100_000;
export const MAX_OUTPUT_DISPLAY_LINES = 2000;
export const MAX_LINE_LENGTH = 2000;
export const CONTEXT_COMPRESSION_THRESHOLD = 0.9;
export const RECENT_MESSAGES_TO_KEEP = 6;

// Indexing Constants
export const INDEX_DIR_NAME = 'index';
export const INDEX_STATUS_FILE = 'status.json';
export const INDEX_VECTORS_FILE = 'vectors.hnsw';
export const INDEX_METADATA_FILE = 'metadata.db';
export const INDEX_CONFIG_FILE = 'index-config.json';
export const OMNIIIGNORE_FILE = '.omniignore';

export const DEFAULT_AUTO_INDEX = true;
export const DEFAULT_AUTO_SYNC = true;
export const DEFAULT_SYNC_INTERVAL_MINUTES = 5;
export const SEMANTIC_SEARCH_THRESHOLD_PERCENT = 80;
export const DEFAULT_CHUNK_SIZE = 20;
export const DEFAULT_MAX_CHUNK_SIZE = 2000;
export const DEFAULT_MAX_FILES_TO_INDEX = 500;
export const DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
export const DEFAULT_EMBEDDING_BATCH_SIZE = 10;
export const DEFAULT_INDEX_CONCURRENCY = 4;

export const DEFAULT_INDEXING_EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  '.nuxt/**',
  '.cache/**',
  '**/*.log',
  '**/Thumbs.db',
  '**/.DS_Store',
  '.omnicode/**',
  '**/*.min.js',
  '**/*.bundle.js',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/*.lock',
];

export const INDEXING_SUPPORTED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyi', '.pyw',
  '.java', '.kt',
  '.go', '.rs',
  '.rb', '.php',
  '.swift',
  '.c', '.cpp', '.h', '.hpp',
  '.cs', '.fs',
];

// Plan/Architecture Constants
export const PLAN_FILE_NAME = 'PLAN.md';
export const PLAN_FILE_ENCODING = 'utf-8';
export const ARCHITECTURE_FILE_NAME = 'ARCHITECTURE.md';
