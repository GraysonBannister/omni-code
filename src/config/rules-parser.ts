import type { RuleFrontmatter } from '../types/rules.js';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();

    if (rawValue === 'true') {
      frontmatter[key] = true;
    } else if (rawValue === 'false') {
      frontmatter[key] = false;
    } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      frontmatter[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      frontmatter[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }

  return { frontmatter, body };
}

export function parseRuleFrontmatter(raw: string): { frontmatter: RuleFrontmatter; body: string } {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    frontmatter: {
      description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
      globs: Array.isArray(frontmatter.globs)
        ? (frontmatter.globs as string[])
        : typeof frontmatter.globs === 'string'
        ? frontmatter.globs
        : undefined,
      alwaysApply: typeof frontmatter.alwaysApply === 'boolean' ? frontmatter.alwaysApply : undefined,
    },
    body,
  };
}

export function parseSkillFrontmatter(raw: string): { name?: string; description?: string; body: string } {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    name: typeof frontmatter.name === 'string' ? frontmatter.name : undefined,
    description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
    body,
  };
}

export function serializeRuleFrontmatter(frontmatter: RuleFrontmatter, body: string): string {
  const lines: string[] = ['---'];

  if (frontmatter.description) {
    lines.push(`description: ${frontmatter.description}`);
  }
  if (frontmatter.globs) {
    if (Array.isArray(frontmatter.globs)) {
      lines.push(`globs: [${frontmatter.globs.join(', ')}]`);
    } else {
      lines.push(`globs: ${frontmatter.globs}`);
    }
  }
  if (frontmatter.alwaysApply !== undefined) {
    lines.push(`alwaysApply: ${frontmatter.alwaysApply}`);
  }

  lines.push('---');
  lines.push('');
  lines.push(body);

  return lines.join('\n');
}
