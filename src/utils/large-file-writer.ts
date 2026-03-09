import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Configuration for chunked file writing.
 */
export interface ChunkedWriteConfig {
  /** Maximum size of each chunk in characters. Default: 40000 (conservative for UTF-8) */
  chunkSize: number;
  /** Encoding to use. Default: 'utf-8' */
  encoding: BufferEncoding;
  /** Whether to add a progress callback */
  onProgress?: (chunkIndex: number, totalChunks: number) => void;
  /** Abort signal used to cancel long-running writes */
  signal?: AbortSignal;
  /** Whether to verify the final file contents after writing */
  verifyContents: boolean;
}

export interface ChunkedWriteResult {
  chunkCount: number;
  bytesWritten: number;
  verified: boolean;
  usedChunking: boolean;
}

/**
 * Default configuration for safe chunked writes.
 * Uses 40KB chunks to stay well under tool limits (typically ~50-100KB)
 */
const DEFAULT_CONFIG: ChunkedWriteConfig = {
  chunkSize: 40000,
  encoding: 'utf-8',
  verifyContents: true,
};

export const DEFAULT_CHUNK_SIZE = DEFAULT_CONFIG.chunkSize;
export const DEFAULT_CHUNK_THRESHOLD_BYTES = 45000;

/**
 * Calculates the number of chunks needed for the given content.
 */
export function calculateChunkCount(content: string, chunkSize: number): number {
  return Math.ceil(content.length / chunkSize);
}

/**
 * Splits content into chunks at safe boundaries (preferring newlines).
 * Falls back to hard chunk size if no good boundary found.
 */
export function splitIntoChunks(content: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining);
      break;
    }

    // Try to find a good break point (newline) within the chunk size
    let breakPoint = chunkSize;
    const searchStart = Math.max(0, chunkSize - 1000); // Look back up to 1000 chars
    const searchWindow = remaining.slice(searchStart, chunkSize + 100);
    const lastNewline = searchWindow.lastIndexOf('\n');

    if (lastNewline !== -1) {
      breakPoint = searchStart + lastNewline + 1; // Include the newline
    }

    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint);
  }

  return chunks;
}

/**
 * Writes a large file by chunking content to avoid tool size limits.
 *
 * This is designed to work with AI assistant tools that have content size
 * limits on file write operations. It splits content into safe-sized chunks
 * and writes them sequentially.
 *
 * @param filePath - Absolute path to the file to write
 * @param content - The full content to write
 * @param config - Optional configuration for chunking
 * @returns Promise that resolves when complete
 *
 * @example
 * ```typescript
 * await writeLargeFile('/path/to/file.md', veryLongContent);
 * ```
 */
export async function writeLargeFile(
  filePath: string,
  content: string,
  config: Partial<ChunkedWriteConfig> = {}
): Promise<ChunkedWriteResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }

  // Handle empty content
  if (content.length === 0) {
    await fsp.writeFile(filePath, '', { encoding: fullConfig.encoding, signal: fullConfig.signal });
    return {
      chunkCount: 1,
      bytesWritten: 0,
      verified: true,
      usedChunking: false,
    };
  }

  // Split into chunks
  const chunks = splitIntoChunks(content, fullConfig.chunkSize);

  // Write first chunk (creates/truncates file)
  await fsp.writeFile(filePath, chunks[0], { encoding: fullConfig.encoding, signal: fullConfig.signal });

  // Append remaining chunks
  for (let i = 1; i < chunks.length; i++) {
    if (fullConfig.signal?.aborted) {
      throw new DOMException('Write aborted', 'AbortError');
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
    usedChunking: chunks.length > 1,
  };
}

/**
 * Utility function to estimate the size of content in bytes.
 * Useful for determining if chunking is needed.
 */
export function estimateSize(content: string): number {
  // Rough estimate: 1 char = 1-4 bytes in UTF-8
  // This is conservative for mostly ASCII content
  return Buffer.byteLength(content, 'utf-8');
}

/**
 * Check if content should be chunked based on size.
 *
 * @param content - Content to check
 * @param threshold - Size threshold in bytes (default: 45000)
 * @returns True if content should be chunked
 */
export function shouldChunk(content: string, threshold: number = DEFAULT_CHUNK_THRESHOLD_BYTES): boolean {
  return estimateSize(content) > threshold;
}

/**
 * Synchronous version of writeLargeFile for simpler use cases.
 * Note: This still performs I/O operations synchronously internally.
 */
export function writeLargeFileSync(
  filePath: string,
  content: string,
  config: Partial<ChunkedWriteConfig> = {}
): ChunkedWriteResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Handle empty content
  if (content.length === 0) {
    fs.writeFileSync(filePath, '', { encoding: fullConfig.encoding });
    return {
      chunkCount: 1,
      bytesWritten: 0,
      verified: true,
      usedChunking: false,
    };
  }

  // Split into chunks
  const chunks = splitIntoChunks(content, fullConfig.chunkSize);

  // Write first chunk (creates/truncates file)
  fs.writeFileSync(filePath, chunks[0], { encoding: fullConfig.encoding });

  // Append remaining chunks
  for (let i = 1; i < chunks.length; i++) {
    fs.appendFileSync(filePath, chunks[i], { encoding: fullConfig.encoding });

    if (fullConfig.onProgress) {
      fullConfig.onProgress(i + 1, chunks.length);
    }
  }

  let verified = true;
  if (fullConfig.verifyContents) {
    const writtenContent = fs.readFileSync(filePath, { encoding: fullConfig.encoding });
    verified = writtenContent === content;
    if (!verified) {
      throw new Error(`Write verification failed for ${filePath}`);
    }
  }

  return {
    chunkCount: chunks.length,
    bytesWritten: estimateSize(content),
    verified,
    usedChunking: chunks.length > 1,
  };
}
