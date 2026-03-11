/**
 * Indexing Configuration Management
 *
 * Manages per-project indexing settings including:
 * - Auto-indexing toggle
 * - File exclusion patterns
 * - Chunk size configuration
 * - Sync interval settings
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface IndexingConfig {
  // Auto-indexing settings
  autoIndex: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;

  // Chunking settings
  chunkSize: number; // Lines per chunk for non-semantic chunking
  useSemanticChunking: boolean;
  maxChunkSize: number; // Maximum characters per chunk

  // File handling
  maxFilesToIndex: number;
  maxFileSizeBytes: number;
  excludePatterns: string[];

  // Performance
  embeddingBatchSize: number;
  indexConcurrency: number;
}

export const DEFAULT_INDEXING_CONFIG: IndexingConfig = {
  autoIndex: true,
  autoSync: true,
  syncIntervalMinutes: 5,

  chunkSize: 20,
  useSemanticChunking: true,
  maxChunkSize: 2000,

  maxFilesToIndex: 500,
  maxFileSizeBytes: 1024 * 1024, // 1MB
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
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
  ],

  embeddingBatchSize: 10,
  indexConcurrency: 4,
};

// Additional patterns from .gitignore if available
const GITIGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '*.log',
  '*.min.js',
  '*.min.css',
  '*.map',
  '.env',
  '.env.*',
  '.idea',
  '.vscode',
];

export class IndexingConfigManager {
  private configPath: string;
  private omniignorePath: string;
  private config: IndexingConfig;
  private customExcludes: string[] = [];

  constructor(projectPath: string) {
    const omnicodeDir = path.join(projectPath, '.omnicode');
    this.configPath = path.join(omnicodeDir, 'index-config.json');
    this.omniignorePath = path.join(projectPath, '.omniignore');
    this.config = { ...DEFAULT_INDEXING_CONFIG };
  }

  async load(): Promise<IndexingConfig> {
    try {
      // Load main config
      const configExists = await fs.access(this.configPath).then(() => true).catch(() => false);
      if (configExists) {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const loaded = JSON.parse(content);
        this.config = { ...DEFAULT_INDEXING_CONFIG, ...loaded };
      }

      // Load .omniignore patterns
      await this.loadOmniignore();

      return this.config;
    } catch (error) {
      console.warn('[IndexingConfig] Failed to load config, using defaults:', error);
      return this.config;
    }
  }

  async save(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('[IndexingConfig] Failed to save config:', error);
      throw error;
    }
  }

  async loadOmniignore(): Promise<string[]> {
    try {
      const exists = await fs.access(this.omniignorePath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.omniignorePath, 'utf-8');
        this.customExcludes = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
      }
    } catch (error) {
      // .omniignore is optional
    }
    return this.customExcludes;
  }

  getConfig(): IndexingConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<IndexingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getAllExclusionPatterns(): string[] {
    return [
      ...this.config.excludePatterns,
      ...GITIGNORE_PATTERNS,
      ...this.customExcludes,
    ];
  }

  getIndexDirectory(): string {
    return path.join(path.dirname(this.configPath), 'index');
  }

  async ensureIndexDirectory(): Promise<string> {
    const dir = this.getIndexDirectory();
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }
}

// Singleton map to cache config managers per project
const configManagers = new Map<string, IndexingConfigManager>();

export function getIndexingConfigManager(projectPath: string): IndexingConfigManager {
  if (!configManagers.has(projectPath)) {
    configManagers.set(projectPath, new IndexingConfigManager(projectPath));
  }
  return configManagers.get(projectPath)!;
}

export function clearConfigManager(projectPath: string): void {
  configManagers.delete(projectPath);
}
