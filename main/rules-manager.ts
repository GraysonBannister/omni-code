import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'fast-glob';
import { minimatch } from 'minimatch';
import type { Rule } from '../src/types/rules.js';
import { parseRuleFrontmatter } from '../src/config/rules-parser.js';

const RULES_SUBDIR = path.join('.omnicode', 'rules');
const STATE_FILE = path.join('.omnicode', 'rules-state.json');

export class RulesManager {
  private projectPath: string = '';
  private rules: Map<string, Rule> = new Map();

  async loadRules(projectPath: string): Promise<void> {
    this.projectPath = projectPath;
    const rulesDir = path.join(projectPath, RULES_SUBDIR);

    const disabledIds = await this.loadDisabledState(projectPath);

    let files: string[] = [];
    try {
      await fs.access(rulesDir);
      files = await glob('**/*.mdc', { cwd: rulesDir, absolute: true });
    } catch {
      // Rules dir doesn't exist yet — that's fine
      this.rules.clear();
      return;
    }

    this.rules.clear();
    for (const filePath of files) {
      const id = path.basename(filePath, '.mdc');
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const { frontmatter, body } = parseRuleFrontmatter(raw);
        this.rules.set(id, {
          id,
          filePath,
          frontmatter,
          content: body,
          enabled: !disabledIds.has(id),
        });
      } catch {
        continue;
      }
    }

    console.log(`[RulesManager] Loaded ${this.rules.size} rules from ${rulesDir}`);
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  getActiveRules(openFiles: string[] = []): Rule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false;

      // alwaysApply: true — always include
      if (rule.frontmatter.alwaysApply === true) return true;

      // No scope constraints — treat as always apply if alwaysApply isn't explicitly false
      if (!rule.frontmatter.globs && rule.frontmatter.alwaysApply !== false) return true;

      // Glob matching — include if any open file matches
      if (rule.frontmatter.globs) {
        const globs = Array.isArray(rule.frontmatter.globs)
          ? rule.frontmatter.globs
          : [rule.frontmatter.globs];

        return openFiles.some(file =>
          globs.some(g => minimatch(path.basename(file), g) || minimatch(file, g)),
        );
      }

      return false;
    });
  }

  buildRulesPrompt(openFiles: string[] = []): string {
    const active = this.getActiveRules(openFiles);
    if (active.length === 0) return '';

    const parts = active.map(rule => {
      const scopeNote = rule.frontmatter.globs
        ? ` (applies to: ${Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs.join(', ') : rule.frontmatter.globs})`
        : '';
      const header = rule.frontmatter.description
        ? `### ${rule.frontmatter.description}${scopeNote}`
        : `### ${rule.id}${scopeNote}`;
      return `${header}\n${rule.content}`;
    });

    return `\n## Project Rules\n\nThe following rules have been configured for this project. Follow them carefully.\n\n${parts.join('\n\n')}`;
  }

  async toggleRule(id: string, enabled: boolean): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) return;
    rule.enabled = enabled;
    await this.saveDisabledState();
  }

  async saveRule(id: string, frontmatterRaw: string, body: string): Promise<void> {
    const rulesDir = path.join(this.projectPath, RULES_SUBDIR);
    await fs.mkdir(rulesDir, { recursive: true });
    const filePath = path.join(rulesDir, `${id}.mdc`);
    const content = frontmatterRaw ? `${frontmatterRaw}\n${body}` : body;
    await fs.writeFile(filePath, content, 'utf-8');
    // Reload to pick up the new/updated rule
    await this.loadRules(this.projectPath);
  }

  async saveRuleFile(id: string, fullContent: string): Promise<void> {
    const rulesDir = path.join(this.projectPath, RULES_SUBDIR);
    await fs.mkdir(rulesDir, { recursive: true });
    const filePath = path.join(rulesDir, `${id}.mdc`);
    await fs.writeFile(filePath, fullContent, 'utf-8');
    await this.loadRules(this.projectPath);
  }

  async deleteRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) return;
    await fs.unlink(rule.filePath);
    this.rules.delete(id);
    await this.saveDisabledState();
  }

  getRulesDir(): string {
    return path.join(this.projectPath, RULES_SUBDIR);
  }

  private async loadDisabledState(projectPath: string): Promise<Set<string>> {
    try {
      const statePath = path.join(projectPath, STATE_FILE);
      const raw = await fs.readFile(statePath, 'utf-8');
      const data = JSON.parse(raw);
      return new Set<string>(Array.isArray(data.disabledRules) ? data.disabledRules : []);
    } catch {
      return new Set();
    }
  }

  private async saveDisabledState(): Promise<void> {
    if (!this.projectPath) return;
    const disabled = Array.from(this.rules.values())
      .filter(r => !r.enabled)
      .map(r => r.id);
    const statePath = path.join(this.projectPath, STATE_FILE);
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify({ disabledRules: disabled }, null, 2), 'utf-8');
  }
}

export const rulesManager = new RulesManager();
