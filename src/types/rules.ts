export interface RuleFrontmatter {
  description?: string;
  globs?: string | string[];
  alwaysApply?: boolean;
}

export interface Rule {
  id: string;
  filePath: string;
  frontmatter: RuleFrontmatter;
  content: string;
  enabled: boolean;
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
}

export interface Skill {
  id: string;
  dirPath: string;
  filePath: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
}
