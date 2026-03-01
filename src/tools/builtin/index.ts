import type { ToolRegistry } from '../tool-registry.js';
import { ReadFileTool } from './read-file.js';
import { WriteFileTool } from './write-file.js';
import { EditFileTool } from './edit-file.js';
import { GlobSearchTool } from './glob-search.js';
import { GrepSearchTool } from './grep-search.js';
import { BashExecTool } from './bash-exec.js';
import { IndexCodebaseTool } from './index-codebase.js';
import { PreviewDiffTool } from './preview-diff.js';
import { RunTestsTool } from './run-tests.js';
import { FileTreeTool } from './file-tree.js';
import { LintFixTool } from './lint-fix.js';
import { SearchWebTool } from './search-web.js';

export function registerBuiltinTools(registry: ToolRegistry): void {
  // Core tools
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new EditFileTool());
  registry.register(new GlobSearchTool());
  registry.register(new GrepSearchTool());
  registry.register(new BashExecTool());

  // Extended tools
  registry.register(new IndexCodebaseTool());
  registry.register(new PreviewDiffTool());
  registry.register(new RunTestsTool());
  registry.register(new FileTreeTool());
  registry.register(new LintFixTool());
  registry.register(new SearchWebTool());
}
