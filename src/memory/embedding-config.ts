/**
 * Embedding Configuration
 *
 * Shared configuration for embedding models and vector index settings.
 */

// Embedding model configuration
export const EMBEDDING_DIM = 384;  // all-MiniLM-L6-v2 output dimension
export const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// HNSW index configuration
export const DEFAULT_MAX_ELEMENTS = 50000;  // Maximum number of vectors
export const DEFAULT_M = 16;               // Number of bi-directional links
export const DEFAULT_EF_CONSTRUCTION = 200; // Quality vs speed tradeoff during construction
export const DEFAULT_EF_SEARCH = 128;      // Quality vs speed tradeoff during search

// Chunking configuration
export const DEFAULT_CHUNK_SIZE_LINES = 20;
export const DEFAULT_CHUNK_OVERLAP_LINES = 5;
export const MIN_CHUNK_LENGTH = 50;  // Minimum characters to be meaningful
export const MAX_CHUNK_LENGTH = 2000; // Maximum characters per chunk

// Batch processing configuration
export const DEFAULT_BATCH_SIZE = 10;
export const MAX_BATCH_SIZE = 32;

// Timeout configuration
export const EMBEDDING_TIMEOUT_MS = 30000;
