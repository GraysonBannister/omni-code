import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  writeLargeFile,
  writeLargeFileSync,
  splitIntoChunks,
  calculateChunkCount,
  estimateSize,
  shouldChunk,
} from './large-file-writer';

describe('large-file-writer', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'large-file-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('splitIntoChunks', () => {
    it('should return single chunk for content smaller than chunk size', () => {
      const content = 'Hello, world!';
      const chunks = splitIntoChunks(content, 100);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(content);
    });

    it('should split content at newlines when possible', () => {
      const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
      const content = lines.join('\n');
      const chunkSize = 15; // Force splitting

      const chunks = splitIntoChunks(content, chunkSize);
      expect(chunks.length).toBeGreaterThan(1);

      // Verify reassembly produces original content
      const reassembled = chunks.join('');
      expect(reassembled).toBe(content);
    });

    it('should handle content with no good break points', () => {
      // Long string without newlines
      const content = 'a'.repeat(1000);
      const chunks = splitIntoChunks(content, 100);

      expect(chunks.length).toBe(10);
      const reassembled = chunks.join('');
      expect(reassembled).toBe(content);
    });

    it('should handle empty content', () => {
      const chunks = splitIntoChunks('', 100);
      expect(chunks).toHaveLength(0);
    });
  });

  describe('calculateChunkCount', () => {
    it('should calculate correct number of chunks', () => {
      expect(calculateChunkCount('', 100)).toBe(0);
      expect(calculateChunkCount('abc', 100)).toBe(1);
      expect(calculateChunkCount('a'.repeat(100), 100)).toBe(1);
      expect(calculateChunkCount('a'.repeat(101), 100)).toBe(2);
      expect(calculateChunkCount('a'.repeat(200), 100)).toBe(2);
      expect(calculateChunkCount('a'.repeat(201), 100)).toBe(3);
    });
  });

  describe('estimateSize', () => {
    it('should estimate ASCII content correctly', () => {
      const ascii = 'Hello, World!';
      expect(estimateSize(ascii)).toBe(13);
    });

    it('should estimate UTF-8 content correctly', () => {
      const utf8 = 'Hello, 世界! 🌍';
      // Hello, (7) + 世界 (6) + ! (1) + space (1) + 🌍 (4) = 19 bytes
      expect(estimateSize(utf8)).toBe(19);
    });
  });

  describe('shouldChunk', () => {
    it('should return false for small content', () => {
      expect(shouldChunk('small content', 100)).toBe(false);
    });

    it('should return true for content over threshold', () => {
      const largeContent = 'a'.repeat(1000);
      expect(shouldChunk(largeContent, 500)).toBe(true);
    });

    it('should use default threshold when not specified', () => {
      const smallContent = 'a'.repeat(1000);
      expect(shouldChunk(smallContent)).toBe(false);

      const largeContent = 'a'.repeat(50000);
      expect(shouldChunk(largeContent)).toBe(true);
    });
  });

  describe('writeLargeFileSync', () => {
    it('should write small content to file', () => {
      const filePath = path.join(tempDir, 'small.txt');
      const content = 'Hello, world!';

      writeLargeFileSync(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should write empty content to file', () => {
      const filePath = path.join(tempDir, 'empty.txt');

      writeLargeFileSync(filePath, '');

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('');
    });

    it('should write large content in chunks', () => {
      const filePath = path.join(tempDir, 'large.txt');
      // Create content that will need chunking
      const line = 'This is a test line with some content.\n';
      const content = line.repeat(1000); // ~40KB

      writeLargeFileSync(filePath, content, { chunkSize: 5000 });

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should create directory if it does not exist', () => {
      const nestedDir = path.join(tempDir, 'nested', 'deep', 'dir');
      const filePath = path.join(nestedDir, 'file.txt');
      const content = 'Nested content';

      writeLargeFileSync(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should handle content with no newlines', () => {
      const filePath = path.join(tempDir, 'no-newlines.txt');
      const content = 'a'.repeat(10000);

      writeLargeFileSync(filePath, content, { chunkSize: 1000 });

      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should call progress callback', () => {
      const filePath = path.join(tempDir, 'progress.txt');
      const content = 'Line\n'.repeat(100);
      const progressCalls: Array<{ index: number; total: number }> = [];

      writeLargeFileSync(filePath, content, {
        chunkSize: 100,
        onProgress: (index, total) => {
          progressCalls.push({ index, total });
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1].index).toBe(
        progressCalls[progressCalls.length - 1].total
      );
    });

    it('should handle Unicode content correctly', () => {
      const filePath = path.join(tempDir, 'unicode.txt');
      const content = 'Hello, 世界! 🌍\n'.repeat(100);

      writeLargeFileSync(filePath, content, { chunkSize: 50 });

      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });
  });

  describe('writeLargeFile (async)', () => {
    it('should write content asynchronously', async () => {
      const filePath = path.join(tempDir, 'async.txt');
      const content = 'Async content here';

      await writeLargeFile(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should handle large content asynchronously', async () => {
      const filePath = path.join(tempDir, 'large-async.txt');
      const line = 'This is line number '.padEnd(50, ' ') + '\n';
      const content = line.repeat(1000);

      await writeLargeFile(filePath, content, { chunkSize: 5000 });

      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should report progress asynchronously', async () => {
      const filePath = path.join(tempDir, 'progress-async.txt');
      const content = 'Content line\n'.repeat(200);
      const progressCalls: Array<{ index: number; total: number }> = [];

      await writeLargeFile(filePath, content, {
        chunkSize: 500,
        onProgress: (index, total) => {
          progressCalls.push({ index, total });
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should produce identical output for sync and async versions', async () => {
      const syncPath = path.join(tempDir, 'sync.txt');
      const asyncPath = path.join(tempDir, 'async.txt');
      const content = 'Test line content here\n'.repeat(500);

      writeLargeFileSync(syncPath, content, { chunkSize: 2000 });
      await writeLargeFile(asyncPath, content, { chunkSize: 2000 });

      const syncContent = fs.readFileSync(syncPath, 'utf-8');
      const asyncContent = fs.readFileSync(asyncPath, 'utf-8');

      expect(syncContent).toBe(asyncContent);
      expect(syncContent).toBe(content);
    });

    it('should handle realistic large document', async () => {
      const filePath = path.join(tempDir, 'document.md');

      // Simulate a large markdown document
      const sections = [];
      for (let i = 1; i <= 100; i++) {
        sections.push(`# Section ${i}\n\n`);
        sections.push(`This is the content for section ${i}. `.repeat(20));
        sections.push('\n\n');
        sections.push('- Bullet point 1\n');
        sections.push('- Bullet point 2\n');
        sections.push('- Bullet point 3\n\n');
      }
      const content = sections.join('');

      await writeLargeFile(filePath, content, { chunkSize: 5000 });

      const written = fs.readFileSync(filePath, 'utf-8');
      expect(written).toBe(content);
      expect(written.split('\n').length).toBe(content.split('\n').length);
    });
  });
});
