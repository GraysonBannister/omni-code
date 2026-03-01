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
import { WebFetchTool } from './web-fetch.js';
import { TypeCheckTool } from './type-check.js';
import { HTTPClientTool } from './http-client.js';
import { SymbolRenameTool } from './symbol-rename.js';
import { MultiFileEditTool } from './multi-file-edit.js';
import { DependencyManagerTool } from './dependency-manager.js';
import { ScaffoldTool } from './scaffold.js';
import { DatabaseQueryTool } from './database-query.js';
import { SubAgentTool } from './sub-agent.js';
import { CheckpointTool } from './checkpoint.js';
import { TestGenTool } from './test-gen.js';

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

  // Network tools
  registry.register(new WebFetchTool());
  registry.register(new HTTPClientTool());

  // Code analysis & modification tools
  registry.register(new TypeCheckTool());
  registry.register(new SymbolRenameTool());
  registry.register(new MultiFileEditTool());

  // Development workflow tools
  registry.register(new DependencyManagerTool());
  registry.register(new ScaffoldTool());
  registry.register(new DatabaseQueryTool());

  // Agent & version control tools
  registry.register(new SubAgentTool());
  registry.register(new CheckpointTool());
  registry.register(new TestGenTool());
}
