import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Dirent, Stats as FsStats } from 'node:fs';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface Stats {
  files: number;
  dirs: number;
  size: bigint;
  fileStats: { [key: string]: number };
  langs: Set<string>;
  pkg: any | null;
}

interface TreeNode {
  name: string;
  type: 'dir' | 'file';
  size?: bigint;
  children?: TreeNode[];
}

const IGNORES = new Set([
  'node_modules', 'dist', 'build', '.git', '.next', 'coverage', '__pycache__', '.vscode', '.idea'
]);

export class SelfAnalyzeTool implements Tool {
  readonly name = 'SelfAnalyze';
  readonly description = 'Reports on the codebase structure: directory tree (depth-limited), file/dir stats by extension/language, total size, detected frameworks/project type from package.json, top dependencies. Supports custom root, maxDepth, statsOnly mode.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      root: {
        type: 'string',
        description: 'Root directory path (relative to cwd or absolute). Defaults to cwd.'
      },
      maxDepth: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        description: 'Maximum recursion depth for directory tree. Defaults to 3.'
      },
      statsOnly: {
        type: 'boolean',
        description: 'Fast stats-only mode without building tree structure (full recursion for stats).'
      }
    },
    additionalProperties: false
  } as const;

  validate(input: Record<string, unknown>): string | null {
    const input_ = input as any;
    if (input_.root != null && typeof input_.root !== 'string') {
      return 'root must be a string';
    }
    if (input_.maxDepth != null && (typeof input_.maxDepth !== 'number' || input_.maxDepth < 1 || input_.maxDepth > 10)) {
      return 'maxDepth must be a number between 1 and 10';
    }
    if (input_.statsOnly != null && typeof input_.statsOnly !== 'boolean') {
      return 'statsOnly must be a boolean';
    }
    return null;
  }

  private getLangFromExt(ext: string): string {
    const map: { [key: string]: string } = {
      ts: 'TypeScript',
      tsx: 'TSX',
      js: 'JavaScript',
      jsx: 'JSX',
      py: 'Python',
      rs: 'Rust',
      go: 'Go',
      json: 'JSON',
      md: 'Markdown',
      yaml: 'YAML',
      yml: 'YAML',
      toml: 'TOML',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS'
    };
    return map[ext] || ext.toUpperCase();
  }

  private detectFrameworks(pkg: any): string[] {
    if (!pkg) return [];
    const frameworks: string[] = [];
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (allDeps.react || allDeps['react-dom']) frameworks.push('React');
    if (allDeps.vite) frameworks.push('Vite');
    if (allDeps.next) frameworks.push('Next.js');
    if (allDeps.vitest || allDeps.jest) frameworks.push(allDeps.vitest ? 'Vitest' : 'Jest');
    if (allDeps.typescript || (pkg.scripts?.build || '').includes('tsc')) frameworks.push('TypeScript');
    if (allDeps.express) frameworks.push('Express');
    if (pkg.bin && typeof pkg.bin === 'object') frameworks.push('CLI Tool');
    return [...new Set(frameworks)];
  }

  private async analyzeDir(
    absPath: string,
    currentDepth: number,
    maxDepth: number,
    stats: Stats,
    statsOnly: boolean,
    parentChildren?: TreeNode[]
  ): Promise<void> {
    let stat: FsStats;
    try {
      stat = await fs.stat(absPath);
    } catch {
      return;
    }
    const name = path.basename(absPath);
    if (name.startsWith('.') || IGNORES.has(name)) {
      return;
    }
    if (stat.isFile()) {
      stats.files++;
      const size = BigInt(stat.size);
      stats.size += size;
      const ext = path.extname(name).slice(1).toLowerCase() || 'other';
      stats.fileStats[ext] = (stats.fileStats[ext] || 0) + 1;
      stats.langs.add(this.getLangFromExt(ext));
      if (!statsOnly && parentChildren) {
        parentChildren.push({ name, type: 'file', size });
      }
      return;
    }
    if (!stat.isDirectory()) {
      return;
    }
    stats.dirs++;
    const node: TreeNode = { name, type: 'dir', children: [] };
    if (!statsOnly && parentChildren) {
      parentChildren.push(node);
    }
    if (currentDepth >= maxDepth) {
      return;
    }
    let entries: Dirent[];
    try {
      entries = await fs.readdir(absPath, { withFileTypes: true });
    } catch {
      return;
    }
    const validEntries = entries
      .filter((e) => !e.name.startsWith('.') && !IGNORES.has(e.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    await Promise.all(
      validEntries.map((entry) =>
        this.analyzeDir(
          path.join(absPath, entry.name),
          currentDepth + 1,
          maxDepth,
          stats,
          statsOnly,
          !statsOnly ? node.children! : undefined
        )
      )
    );
  }

  private treeToMarkdown(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
    let str = prefix + (isLast ? '└── ' : '├── ') + (node.type === 'dir' ? '📁 ' : '📄 ') + node.name;
    if (node.type === 'file' && node.size !== undefined) {
      str += ` (${(Number(node.size) / 1024).toFixed(1)}kB)`;
    }
    str += '\\n';
    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      for (let i = 0; i < node.children.length; i++) {
        const childIsLast = i === node.children.length - 1;
        str += this.treeToMarkdown(node.children[i], newPrefix, childIsLast);
      }
    }
    return str;
  }

  private async getStatsAndTree(
    dir: string,
    maxDepth: number,
    statsOnly: boolean
  ): Promise<{ tree?: TreeNode; stats: Stats }> {
    const stats: Stats = {
      files: 0,
      dirs: 0,
      size: 0n,
      fileStats: {},
      langs: new Set(),
      pkg: null
    };
    // Load package.json
    const pkgPath = path.join(dir, 'package.json');
    try {
      const data = await fs.readFile(pkgPath, 'utf8');
      stats.pkg = JSON.parse(data);
    } catch {}
    if (statsOnly) {
      await this.analyzeDir(dir, 0, maxDepth, stats, true);
    } else {
      const treeRoot: TreeNode = { name: path.basename(dir), type: 'dir', children: [] };
      await this.analyzeDir(dir, 0, maxDepth, stats, false, treeRoot.children);
      return { tree: treeRoot, stats };
    }
    return { tree: undefined, stats };
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const err = this.validate(input);
    if (err) {
      return { content: err, isError: true };
    }
    const input_ = input as any;
    const root = input_.root || '.';
    const targetDir = path.resolve(context.cwd, root);
    const maxDepth = (input_.maxDepth as number) ?? 3;
    const statsOnly = !!(input_.statsOnly as boolean);
    try {
      await fs.access(targetDir);
    } catch {
      return { content: `Cannot access directory: ${targetDir}`, isError: true };
    }
    const relativeRoot = path.relative(process.cwd(), targetDir) || '.';
    const analysis = await this.getStatsAndTree(targetDir, maxDepth, statsOnly);
    const stats = analysis.stats;
    let content = `# Codebase Analysis: ${relativeRoot}\\n\\n`;
    if (analysis.tree) {
      content += '## Directory Tree\\n\\n';
      content += '```\\n' + this.treeToMarkdown(analysis.tree) + '\\n```\\n\\n';
    }
    content += '## Statistics\\n\\n';
    const sizeMB = Number(stats.size) / (1024 * 1024);
    content += `- Files: ${stats.files.toLocaleString()}\\n`;
    content += `- Directories: ${stats.dirs.toLocaleString()}\\n`;
    content += `- Total Size: ${sizeMB.toFixed(2)} MB (${stats.size.toString()} bytes)\\n`;
    const langsList = Array.from(stats.langs).sort().join(', ');
    content += `- Languages: ${langsList}\\n`;
    const topExts = Object.entries(stats.fileStats)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 5)
      .map(([ext, count]) => `${ext}: ${count}`)
      .join(', ');
    content += `- Top Extensions: ${topExts}${Object.keys(stats.fileStats).length > 5 ? ' ...' : ''}\\n`;
    if (stats.pkg) {
      content += '\\n## Package Info\\n\\n';
      content += `- Name: ${stats.pkg.name || 'unknown'}\\n`;
      content += `- Version: ${stats.pkg.version || 'unknown'}\\n`;
      const fw = this.detectFrameworks(stats.pkg);
      if (fw.length) {
        content += `- Frameworks: ${fw.join(', ')}\\n`;
      }
      const deps = Object.keys(stats.pkg.dependencies || {});
      const topDeps = deps.slice(0, 10).join(', ');
      content += `- Dependencies: ${topDeps}${deps.length > 10 ? ' ...' : ''} (${deps.length})\\n`;
      const devDeps = Object.keys(stats.pkg.devDependencies || {}).length;
      content += `- Dev Dependencies: ${devDeps}\\n`;
      const projectType = stats.pkg.bin && typeof stats.pkg.bin === 'object' ? 'CLI Tool' : stats.pkg.main ? 'Library/Web App' : 'Unknown';
      content += `- Project Type: ${projectType}\\n`;
    }
    const metadata = {
      path: relativeRoot,
      stats: {
        files: stats.files,
        dirs: stats.dirs,
        size: stats.size.toString(),
        langs: Array.from(stats.langs).sort(),
        fileStats: stats.fileStats,
        frameworks: stats.pkg ? this.detectFrameworks(stats.pkg) : [],
        projectType: stats.pkg?.bin ? 'CLI' : 'Library'
      }
    };
    return { content, metadata, isError: false };
  }

  formatForDisplay(result: ToolResult): string {
    if ((result as any).isError) {
      return `SelfAnalyze error: ${(result as any).content}`;
    }
    const meta = (result as any).metadata?.stats || {};
    const sizeMB = Number(meta.size || 0) / (1024 * 1024);
    const langs = meta.langs?.slice(0, 3).join(', ') || 'N/A';
    const fw = meta.frameworks?.slice(0, 3).join(', ') || 'N/A';
    return `SelfAnalyze: ${meta.files || 0} files, ${sizeMB.toFixed(1)}MB, langs: ${langs}${langs !== 'N/A' ? '...' : ''}, frameworks: ${fw}`;
  }
}
