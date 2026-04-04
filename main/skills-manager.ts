import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Skill } from '../src/types/rules.js';
import { parseSkillFrontmatter } from '../src/config/rules-parser.js';

const SKILLS_SUBDIR = path.join('.omnicode', 'skills');
const SKILL_FILENAME = 'SKILL.md';

export class SkillsManager {
  private projectPath: string = '';
  private skills: Map<string, Skill> = new Map();

  async loadSkills(projectPath: string): Promise<void> {
    this.projectPath = projectPath;
    const skillsDir = path.join(projectPath, SKILLS_SUBDIR);

    let entries: import('node:fs').Dirent[] = [];
    try {
      await fs.access(skillsDir);
      entries = await fs.readdir(skillsDir, { withFileTypes: true });
    } catch {
      this.skills.clear();
      return;
    }

    this.skills.clear();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillId = entry.name;
      const skillFile = path.join(skillsDir, skillId, SKILL_FILENAME);

      try {
        await fs.access(skillFile);
        const raw = await fs.readFile(skillFile, 'utf-8');
        const { name, description, body } = parseSkillFrontmatter(raw);

        this.skills.set(skillId, {
          id: skillId,
          dirPath: path.join(skillsDir, skillId),
          filePath: skillFile,
          name: name || skillId,
          description: description || '',
          content: raw,
          enabled: true,
        });
      } catch {
        continue;
      }
    }

    console.log(`[SkillsManager] Loaded ${this.skills.size} skills from ${skillsDir}`);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  buildSkillsPrompt(): string {
    const all = this.getAllSkills();
    if (all.length === 0) return '';

    const lines = all.map(skill => {
      const desc = skill.description ? ` — ${skill.description}` : '';
      return `- **${skill.name}** (\`${skill.filePath}\`)${desc}`;
    });

    return `\n## Available Skills\n\nThe following agent skills are available. When a skill is relevant, read its SKILL.md file for detailed instructions.\n\n${lines.join('\n')}`;
  }

  async saveSkill(id: string, content: string): Promise<void> {
    const skillDir = path.join(this.projectPath, SKILLS_SUBDIR, id);
    await fs.mkdir(skillDir, { recursive: true });
    const filePath = path.join(skillDir, SKILL_FILENAME);
    await fs.writeFile(filePath, content, 'utf-8');
    await this.loadSkills(this.projectPath);
  }

  async deleteSkill(id: string): Promise<void> {
    const skill = this.skills.get(id);
    if (!skill) return;
    await fs.rm(skill.dirPath, { recursive: true, force: true });
    this.skills.delete(id);
  }

  getSkillsDir(): string {
    return path.join(this.projectPath, SKILLS_SUBDIR);
  }
}

export const skillsManager = new SkillsManager();
