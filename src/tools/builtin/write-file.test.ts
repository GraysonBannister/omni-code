import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ToolContext } from '../tool-types.js';
import { WriteFileTool } from './write-file.js';

function createContext(abortSignal?: AbortSignal): ToolContext {
  return {
    cwd: process.cwd(),
    sessionId: 'test-session',
    planMode: false,
    abortSignal: abortSignal ?? new AbortController().signal,
  };
}

describe('WriteFileTool', () => {
  let tempDir: string;
  let tool: WriteFileTool;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'write-file-tool-'));
    tool = new WriteFileTool();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('writes small files without chunking', async () => {
    const filePath = path.join(tempDir, 'small.md');
    const content = '# Hello\n\nSmall content.\n';

    const result = await tool.execute(
      { file_path: filePath, content },
      createContext(),
    );

    expect(result.isError).toBeUndefined();
    expect(result.content).toContain('File written successfully');
    expect(result.metadata).toMatchObject({
      chunkCount: 1,
      usedChunking: false,
      verified: true,
    });
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
  });

  it('writes large files in chunks and verifies output', async () => {
    const filePath = path.join(tempDir, 'large.md');
    const content = Array.from({ length: 2500 }, (_, index) =>
      `## Section ${index + 1}\nThis is a line of content for a large generated document.\n`
    ).join('\n');

    const result = await tool.execute(
      { file_path: filePath, content },
      createContext(),
    );

    expect(result.isError).toBeUndefined();
    expect(result.content).toContain('File written successfully');
    expect(result.metadata).toMatchObject({
      usedChunking: true,
      verified: true,
    });
    expect((result.metadata?.chunkCount as number) > 1).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
  });

  it('returns a clear error when the write is aborted', async () => {
    const filePath = path.join(tempDir, 'aborted.md');
    const content = 'This write should be aborted.';
    const controller = new AbortController();
    controller.abort();

    const result = await tool.execute(
      { file_path: filePath, content },
      createContext(controller.signal),
    );

    expect(result.isError).toBe(true);
    expect(result.content).toContain('cancelled');
  });
});
