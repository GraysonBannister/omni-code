import type { ToolRegistry } from '../tool-registry.js';
import { ReadFileTool } from './read-file.js';
import { WriteFileTool } from './write-file.js';
import { EditFileTool } from './edit-file.js';
import { GlobSearchTool } from './glob-search.js';
import { GrepSearchTool } from './grep-search.js';
import { BashExecTool } from './bash-exec.js';

export function registerBuiltinTools(registry: ToolRegistry): void {
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new EditFileTool());
  registry.register(new GlobSearchTool());
  registry.register(new GrepSearchTool());
  registry.register(new BashExecTool());
}
