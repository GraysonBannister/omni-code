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
import { QueryCodebaseTool } from './query-codebase.js';
import { RepoMapTool } from './repo-map.js';
import { GitCommitTool } from './git-commit.js';
import { GitDiffTool } from './git-diff.js';
import { GitLogTool } from './git-log.js';
import { GitBranchTool } from './git-branch.js';
import { GitStashTool } from './git-stash.js';
import { UnifiedDiffEditTool } from './unified-diff-edit.js';
import { BackgroundAgentTool } from './background-agent.js';
import { CodeReviewTool } from './code-review.js';
import { BrowserAutomationTool } from './browser-automation.js';
import { DebuggerTool } from './debugger.js';
import { DocGenTool } from './doc-gen.js';
import { NotebookTool } from './notebook.js';

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

  // Semantic search tools
  registry.register(new QueryCodebaseTool());

  // Repository analysis
  registry.register(new RepoMapTool());

  // Git workflow tools
  registry.register(new GitCommitTool());
  registry.register(new GitDiffTool());
  registry.register(new GitLogTool());
  registry.register(new GitBranchTool());
  registry.register(new GitStashTool());

  // Alternative edit format
  registry.register(new UnifiedDiffEditTool());

  // Background & review tools
  registry.register(new BackgroundAgentTool());
  registry.register(new CodeReviewTool());

  // Browser & debugging tools
  registry.register(new BrowserAutomationTool());
  registry.register(new DebuggerTool());

  // Documentation & notebook tools
  registry.register(new DocGenTool());
  registry.register(new NotebookTool());
}
