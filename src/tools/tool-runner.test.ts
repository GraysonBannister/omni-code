import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ToolRegistry } from './tool-registry.js';
import { ToolRunner } from './tool-runner.js';
import { PermissionManager } from '../permissions/permission-manager.js';
import { EventBus } from '../utils/event-bus.js';
import { ReadFileTool } from './builtin/read-file.js';

describe('ToolRunner path normalization', () => {
  let tempDir: string;
  let runner: ToolRunner;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-runner-'));

    const registry = new ToolRegistry();
    registry.register(new ReadFileTool());

    runner = new ToolRunner(
      registry,
      new PermissionManager('auto-allow', new EventBus()),
      new EventBus(),
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('resolves relative file_path values against cwd before validation', async () => {
    const filePath = path.join(tempDir, 'notes.txt');
    fs.writeFileSync(filePath, 'hello world\n');

    const result = await runner.execute(
      'Read',
      'tool-1',
      { file_path: 'notes.txt' },
      {
        cwd: tempDir,
        sessionId: 'session-1',
        planMode: false,
        abortSignal: new AbortController().signal,
      },
    );

    expect(result.isError).toBeUndefined();
    expect(result.content).toContain('hello world');
  });

  it('maps path to file_path for file-based tools', async () => {
    const filePath = path.join(tempDir, 'alias.txt');
    fs.writeFileSync(filePath, 'alias path works\n');

    const result = await runner.execute(
      'Read',
      'tool-2',
      { path: filePath },
      {
        cwd: tempDir,
        sessionId: 'session-2',
        planMode: false,
        abortSignal: new AbortController().signal,
      },
    );

    expect(result.isError).toBeUndefined();
    expect(result.content).toContain('alias path works');
  });

  it('recovers file_path from raw tool input when JSON is reparsed', async () => {
    const filePath = path.join(tempDir, 'raw.txt');
    fs.writeFileSync(filePath, 'raw repair works\n');

    const result = await runner.execute(
      'Read',
      'tool-3',
      { _raw: JSON.stringify({ file_path: filePath }) },
      {
        cwd: tempDir,
        sessionId: 'session-3',
        planMode: false,
        abortSignal: new AbortController().signal,
      },
    );

    expect(result.isError).toBeUndefined();
    expect(result.content).toContain('raw repair works');
  });
});
