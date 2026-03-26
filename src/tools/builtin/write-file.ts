import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import {
  DEFAULT_CHUNK_THRESHOLD_BYTES,
  writeLargeFile,
} from '../../utils/large-file-writer.js';

const WRITE_TIMEOUT_MS = 15000;

export class WriteFileTool implements Tool {
  readonly name = 'Write';
  readonly description = 'Creates or overwrites a file with the specified content.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.WRITE;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file_path !== 'string' || !input.file_path) {
      return 'file_path must be a non-empty string';
    }
    if (!path.isAbsolute(input.file_path)) {
      return 'file_path must be an absolute path';
    }
    if (typeof input.content !== 'string') {
      return 'content must be a string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const content = input.content as string;
    let timedOut = false;

    try {
      _context.onProgress?.('Validating target path');

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      const timeoutController = new AbortController();
      const combinedSignal = AbortSignal.any([
        _context.abortSignal,
        timeoutController.signal,
      ]);
      const timeoutId = setTimeout(() => {
        timedOut = true;
        timeoutController.abort();
      }, WRITE_TIMEOUT_MS);

      const byteLength = Buffer.byteLength(content, 'utf-8');
      const needsChunking = byteLength > DEFAULT_CHUNK_THRESHOLD_BYTES;

      let writeMetadata: {
        chunkCount: number;
        bytesWritten: number;
        verified: boolean;
        usedChunking: boolean;
      };

      try {
        if (needsChunking) {
          _context.onProgress?.('Writing file in chunks');
          writeMetadata = await writeLargeFile(filePath, content, {
            signal: combinedSignal,
          });
        } else {
          _context.onProgress?.('Writing file');
          await fs.writeFile(filePath, content, { encoding: 'utf-8', signal: combinedSignal });

          _context.onProgress?.('Verifying written file');
          const writtenContent = await fs.readFile(filePath, 'utf-8');
          if (writtenContent !== content) {
            throw new Error(`Write verification failed for ${filePath}`);
          }

          writeMetadata = {
            chunkCount: 1,
            bytesWritten: byteLength,
            verified: true,
            usedChunking: false,
          };
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const lines = content.split('\n').length;
      const chunkSummary = writeMetadata.usedChunking
        ? ` using ${writeMetadata.chunkCount} chunks`
        : '';

      return {
        content: `File written successfully: ${filePath} (${lines} lines, ${writeMetadata.bytesWritten} bytes${chunkSummary})`,
        metadata: writeMetadata,
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        if (_context.abortSignal.aborted && !timedOut) {
          return {
            content: `Error writing file: write was cancelled before completion.`,
            isError: true,
          };
        }

        return {
          content: `Error writing file: write timed out after ${WRITE_TIMEOUT_MS / 1000}s. Try splitting the content into smaller files or using chunked writes.`,
          isError: true,
          metadata: { timeoutMs: WRITE_TIMEOUT_MS },
        };
      }
      return { content: `Error writing file: ${(error as Error).message}`, isError: true };
    }
  }
}
