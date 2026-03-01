import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const TEMPLATES = ['react-component', 'api-route', 'test-file', 'typescript-class', 'express-middleware'] as const;
type TemplateName = typeof TEMPLATES[number];

interface TemplateOutput {
  filename: string;
  content: string;
}

export class ScaffoldTool implements Tool {
  readonly name = 'Scaffold';
  readonly description = 'Generate boilerplate code from templates: react-component, api-route, test-file, typescript-class, express-middleware.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'Template: react-component, api-route, test-file, typescript-class, express-middleware',
      },
      name: {
        type: 'string',
        description: 'Name for the generated code (e.g., component name, class name)',
      },
      path: {
        type: 'string',
        description: 'Output directory (default: cwd)',
      },
      options: {
        type: 'object',
        description: 'Template-specific options',
      },
    },
    required: ['template', 'name'],
  };

  validate(input: Record<string, unknown>): string | null {
    const template = input.template as string;
    if (!TEMPLATES.includes(template as TemplateName)) {
      return `template must be one of: ${TEMPLATES.join(', ')}`;
    }
    if (typeof input.name !== 'string' || !input.name.trim()) {
      return 'name must be a non-empty string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const template = input.template as TemplateName;
    const name = input.name as string;
    const outputDir = (input.path as string) || context.cwd;
    const options = (input.options as Record<string, unknown>) || {};

    const absDir = path.isAbsolute(outputDir) ? outputDir : path.join(context.cwd, outputDir);
    const result = this.generateTemplate(template, name, options);

    try {
      await fs.mkdir(absDir, { recursive: true });
      const filePath = path.join(absDir, result.filename);

      // Check if file already exists
      try {
        await fs.access(filePath);
        return { content: `File already exists: ${filePath}`, isError: true };
      } catch { /* doesn't exist, good */ }

      await fs.writeFile(filePath, result.content, 'utf-8');

      return {
        content: `Created ${filePath}\n\n\`\`\`\n${result.content}\n\`\`\``,
        metadata: { filePath, template },
      };
    } catch (error) {
      return { content: `Error creating file: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return `Scaffolded ${input.template}: ${result.metadata?.filePath}`;
  }

  private generateTemplate(template: TemplateName, name: string, options: Record<string, unknown>): TemplateOutput {
    const pascal = this.toPascalCase(name);
    const kebab = this.toKebabCase(name);
    const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

    switch (template) {
      case 'react-component':
        return {
          filename: `${pascal}.tsx`,
          content: `import React from 'react';

interface ${pascal}Props {
  className?: string;
}

export const ${pascal}: React.FC<${pascal}Props> = ({ className }) => {
  return (
    <div className={className}>
      <h2>${pascal}</h2>
    </div>
  );
};
`,
        };

      case 'api-route':
        return {
          filename: `${kebab}.ts`,
          content: `import type { Request, Response, Router } from 'express';

export function register${pascal}Routes(router: Router): void {
  router.get('/${kebab}', async (_req: Request, res: Response) => {
    try {
      res.json({ message: '${pascal} list' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/${kebab}/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({ id, message: '${pascal} detail' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/${kebab}', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      res.status(201).json({ message: '${pascal} created', data });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
`,
        };

      case 'test-file': {
        const framework = (options.framework as string) || 'vitest';
        const importLine = framework === 'jest'
          ? ''
          : `import { describe, it, expect } from '${framework}';\n`;
        return {
          filename: `${kebab}.test.ts`,
          content: `${importLine}
describe('${pascal}', () => {
  it('should exist', () => {
    expect(true).toBe(true);
  });

  it('should handle basic case', () => {
    // TODO: implement test
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // TODO: implement test
    expect(true).toBe(true);
  });
});
`,
        };
      }

      case 'typescript-class':
        return {
          filename: `${kebab}.ts`,
          content: `export interface ${pascal}Options {
  // Add options here
}

export class ${pascal} {
  private options: ${pascal}Options;

  constructor(options: ${pascal}Options = {}) {
    this.options = options;
  }

  // Add methods here
}
`,
        };

      case 'express-middleware':
        return {
          filename: `${kebab}.ts`,
          content: `import type { Request, Response, NextFunction } from 'express';

export function ${camel}Middleware(req: Request, _res: Response, next: NextFunction): void {
  // TODO: implement middleware logic
  next();
}

export function ${camel}ErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('${pascal} error:', err.message);
  res.status(500).json({ error: err.message });
}
`,
        };
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}
