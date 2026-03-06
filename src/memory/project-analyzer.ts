import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { MemoryStore } from './memory-store.js';

interface ProjectAnalysis {
  language: string[];
  framework: string[];
  testFramework: string[];
  buildSystem: string[];
  packageManager: string;
  entryPoints: string[];
  projectType: string;
}

const CONFIG_FILE_MAP: Record<string, { language?: string; framework?: string; buildSystem?: string; packageManager?: string }> = {
  'package.json': { language: 'JavaScript/TypeScript', packageManager: 'npm' },
  'pnpm-lock.yaml': { packageManager: 'pnpm' },
  'yarn.lock': { packageManager: 'yarn' },
  'bun.lockb': { packageManager: 'bun' },
  'Cargo.toml': { language: 'Rust', buildSystem: 'cargo', packageManager: 'cargo' },
  'go.mod': { language: 'Go', buildSystem: 'go', packageManager: 'go' },
  'pyproject.toml': { language: 'Python', packageManager: 'pip/poetry' },
  'requirements.txt': { language: 'Python', packageManager: 'pip' },
  'Gemfile': { language: 'Ruby', packageManager: 'bundler' },
  'build.gradle': { language: 'Java/Kotlin', buildSystem: 'gradle' },
  'pom.xml': { language: 'Java', buildSystem: 'maven' },
  'CMakeLists.txt': { language: 'C/C++', buildSystem: 'cmake' },
  'Makefile': { buildSystem: 'make' },
  'docker-compose.yml': { buildSystem: 'docker-compose' },
  'Dockerfile': { buildSystem: 'docker' },
};

const FRAMEWORK_INDICATORS: Record<string, string> = {
  'next.config': 'Next.js',
  'nuxt.config': 'Nuxt',
  'vite.config': 'Vite',
  'angular.json': 'Angular',
  'svelte.config': 'SvelteKit',
  'remix.config': 'Remix',
  'astro.config': 'Astro',
  'tailwind.config': 'Tailwind CSS',
  '.eslintrc': 'ESLint',
  'tsconfig.json': 'TypeScript',
};

export class ProjectAnalyzer {
  async analyze(cwd: string): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      language: [],
      framework: [],
      testFramework: [],
      buildSystem: [],
      packageManager: 'unknown',
      entryPoints: [],
      projectType: 'unknown',
    };

    const seen = { lang: new Set<string>(), fw: new Set<string>(), build: new Set<string>() };

    // Scan for config files
    for (const [filename, info] of Object.entries(CONFIG_FILE_MAP)) {
      try {
        await fs.access(path.join(cwd, filename));
        if (info.language && !seen.lang.has(info.language)) { analysis.language.push(info.language); seen.lang.add(info.language); }
        if (info.framework && !seen.fw.has(info.framework)) { analysis.framework.push(info.framework); seen.fw.add(info.framework); }
        if (info.buildSystem && !seen.build.has(info.buildSystem)) { analysis.buildSystem.push(info.buildSystem); seen.build.add(info.buildSystem); }
        if (info.packageManager) analysis.packageManager = info.packageManager;
      } catch { /* file doesn't exist */ }
    }

    // Scan for framework indicators
    for (const [pattern, framework] of Object.entries(FRAMEWORK_INDICATORS)) {
      try {
        const entries = await fs.readdir(cwd);
        if (entries.some(e => e.startsWith(pattern))) {
          if (!seen.fw.has(framework)) { analysis.framework.push(framework); seen.fw.add(framework); }
        }
      } catch { /* skip */ }
    }

    // Detect test frameworks from package.json
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

      if (allDeps.vitest) analysis.testFramework.push('vitest');
      else if (allDeps.jest) analysis.testFramework.push('jest');
      else if (allDeps.mocha) analysis.testFramework.push('mocha');
      if (allDeps.pytest || allDeps['pytest-cov']) analysis.testFramework.push('pytest');

      // Detect framework from deps
      if (allDeps.react && !seen.fw.has('React')) analysis.framework.push('React');
      if (allDeps.vue && !seen.fw.has('Vue')) analysis.framework.push('Vue');
      if (allDeps.express && !seen.fw.has('Express')) analysis.framework.push('Express');
      if (allDeps.fastify && !seen.fw.has('Fastify')) analysis.framework.push('Fastify');

      // Detect entry points
      if (pkgJson.main) analysis.entryPoints.push(pkgJson.main);
      if (pkgJson.module) analysis.entryPoints.push(pkgJson.module);

      // Project type
      if (pkgJson.bin) analysis.projectType = 'CLI tool';
      else if (allDeps.react || allDeps.vue || allDeps.angular) analysis.projectType = 'web application';
      else if (allDeps.express || allDeps.fastify || allDeps.koa) analysis.projectType = 'server/API';
      else analysis.projectType = 'library';
    } catch { /* no package.json */ }

    // Python test framework
    try {
      await fs.access(path.join(cwd, 'pytest.ini'));
      if (!analysis.testFramework.includes('pytest')) analysis.testFramework.push('pytest');
    } catch { /* skip */ }

    return analysis;
  }

  formatAnalysis(analysis: ProjectAnalysis): string {
    const lines: string[] = ['## Project Analysis'];
    if (analysis.language.length) lines.push(`Languages: ${analysis.language.join(', ')}`);
    if (analysis.framework.length) lines.push(`Frameworks: ${analysis.framework.join(', ')}`);
    if (analysis.testFramework.length) lines.push(`Test frameworks: ${analysis.testFramework.join(', ')}`);
    if (analysis.buildSystem.length) lines.push(`Build systems: ${analysis.buildSystem.join(', ')}`);
    lines.push(`Package manager: ${analysis.packageManager}`);
    if (analysis.entryPoints.length) lines.push(`Entry points: ${analysis.entryPoints.join(', ')}`);
    lines.push(`Project type: ${analysis.projectType}`);
    return lines.join('\n');
  }

  async analyzeAndStore(cwd: string, memoryStore: MemoryStore): Promise<string> {
    const projectName = path.basename(cwd);

    // Check if analysis already exists
    const existing = memoryStore.getForProject(projectName)
      .find(m => m.category === 'context' && m.source === 'auto');
    if (existing) return existing.content;

    const analysis = await this.analyze(cwd);
    const formatted = this.formatAnalysis(analysis);

    memoryStore.add({
      content: formatted,
      category: 'context',
      project: projectName,
      tags: ['auto-analysis'],
      source: 'auto',
    });

    return formatted;
  }
}
