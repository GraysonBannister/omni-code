import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'const' | 'default';
}

export class TestGenTool implements Tool {
  readonly name = 'TestGen';
  readonly description = 'Generate a test skeleton for a source file. Analyzes exports and creates describe/it blocks.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.WRITE;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        description: 'Source file path to generate tests for',
      },
      framework: {
        type: 'string',
        description: 'Test framework: vitest, jest, or pytest (default: auto-detect)',
      },
      outputPath: {
        type: 'string',
        description: 'Output path for the test file (default: auto-generated)',
      },
    },
    required: ['file'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.file !== 'string' || !input.file.trim()) {
      return 'file must be a non-empty string';
    }
    if (input.framework !== undefined) {
      const fw = input.framework as string;
      if (!['vitest', 'jest', 'pytest'].includes(fw)) {
        return 'framework must be one of: vitest, jest, pytest';
      }
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = input.file as string;
    const framework = input.framework as string | undefined;
    const outputPath = input.outputPath as string | undefined;

    const absPath = path.isAbsolute(filePath) ? filePath : path.join(context.cwd, filePath);
    const ext = path.extname(absPath);

    // Read source file
    let content: string;
    try {
      content = await fs.readFile(absPath, 'utf-8');
    } catch (error) {
      return { content: `Cannot read file: ${(error as Error).message}`, isError: true };
    }

    // Detect framework
    const detectedFramework = framework || await this.detectFramework(context.cwd, ext);

    // Extract exports
    const exports = this.extractExports(content, ext);

    if (exports.length === 0) {
      return { content: `No exported symbols found in ${filePath}. Cannot generate meaningful tests.`, isError: true };
    }

    // Generate test content
    const testContent = this.generateTests(absPath, exports, detectedFramework, ext);

    // Determine output path
    const testPath = outputPath
      ? (path.isAbsolute(outputPath) ? outputPath : path.join(context.cwd, outputPath))
      : this.defaultTestPath(absPath, ext, detectedFramework);

    // Check if test file already exists
    try {
      await fs.access(testPath);
      return { content: `Test file already exists: ${testPath}`, isError: true };
    } catch { /* doesn't exist, good */ }

    // Write test file
    try {
      await fs.mkdir(path.dirname(testPath), { recursive: true });
      await fs.writeFile(testPath, testContent, 'utf-8');

      return {
        content: `Generated test file: ${testPath}\nFramework: ${detectedFramework}\nExports found: ${exports.map(e => e.name).join(', ')}\n\n\`\`\`\n${testContent}\n\`\`\``,
        metadata: { testPath, framework: detectedFramework, exports: exports.length },
      };
    } catch (error) {
      return { content: `Error writing test file: ${(error as Error).message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, _input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return `Generated tests: ${result.metadata?.testPath} (${result.metadata?.exports} exports)`;
  }

  private extractExports(content: string, ext: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    if (ext === '.py') {
      // Python: top-level def and class
      for (const match of content.matchAll(/^def (\w+)\s*\(/gm)) {
        if (!match[1].startsWith('_')) {
          exports.push({ name: match[1], type: 'function' });
        }
      }
      for (const match of content.matchAll(/^class (\w+)/gm)) {
        exports.push({ name: match[1], type: 'class' });
      }
    } else {
      // TypeScript / JavaScript
      for (const match of content.matchAll(/export\s+function\s+(\w+)/g)) {
        exports.push({ name: match[1], type: 'function' });
      }
      for (const match of content.matchAll(/export\s+async\s+function\s+(\w+)/g)) {
        if (!exports.find(e => e.name === match[1])) {
          exports.push({ name: match[1], type: 'function' });
        }
      }
      for (const match of content.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
        exports.push({ name: match[1], type: 'const' });
      }
      for (const match of content.matchAll(/export\s+class\s+(\w+)/g)) {
        exports.push({ name: match[1], type: 'class' });
      }
      if (/export\s+default\b/.test(content)) {
        exports.push({ name: 'default', type: 'default' });
      }
    }

    return exports;
  }

  private generateTests(sourcePath: string, exports: ExportInfo[], framework: string, ext: string): string {
    if (framework === 'pytest') {
      return this.generatePytestTests(sourcePath, exports);
    }
    return this.generateJsTests(sourcePath, exports, framework, ext);
  }

  private generateJsTests(sourcePath: string, exports: ExportInfo[], framework: string, ext: string): string {
    const sourceBasename = path.basename(sourcePath, ext);
    const relativePath = `./${sourceBasename}${ext === '.tsx' ? '' : ''}`;

    const importLine = framework === 'vitest'
      ? `import { describe, it, expect } from 'vitest';\n`
      : '';

    const namedExports = exports.filter(e => e.type !== 'default').map(e => e.name);
    const hasDefault = exports.some(e => e.type === 'default');

    let importStatement = '';
    if (namedExports.length > 0 && hasDefault) {
      importStatement = `import defaultExport, { ${namedExports.join(', ')} } from '${relativePath}';\n`;
    } else if (namedExports.length > 0) {
      importStatement = `import { ${namedExports.join(', ')} } from '${relativePath}';\n`;
    } else if (hasDefault) {
      importStatement = `import defaultExport from '${relativePath}';\n`;
    }

    let tests = `${importLine}${importStatement}\n`;

    for (const exp of exports) {
      const name = exp.type === 'default' ? 'defaultExport' : exp.name;

      switch (exp.type) {
        case 'function':
          tests += `describe('${exp.name}', () => {\n`;
          tests += `  it('should be defined', () => {\n`;
          tests += `    expect(${name}).toBeDefined();\n`;
          tests += `  });\n\n`;
          tests += `  it('should return expected result', () => {\n`;
          tests += `    // TODO: implement test\n`;
          tests += `    const result = ${name}();\n`;
          tests += `    expect(result).toBeDefined();\n`;
          tests += `  });\n`;
          tests += `});\n\n`;
          break;

        case 'class':
          tests += `describe('${exp.name}', () => {\n`;
          tests += `  it('should be instantiable', () => {\n`;
          tests += `    // TODO: provide constructor arguments\n`;
          tests += `    const instance = new ${name}();\n`;
          tests += `    expect(instance).toBeInstanceOf(${name});\n`;
          tests += `  });\n`;
          tests += `});\n\n`;
          break;

        case 'const':
          tests += `describe('${exp.name}', () => {\n`;
          tests += `  it('should be defined', () => {\n`;
          tests += `    expect(${name}).toBeDefined();\n`;
          tests += `  });\n`;
          tests += `});\n\n`;
          break;

        case 'default':
          tests += `describe('default export', () => {\n`;
          tests += `  it('should be defined', () => {\n`;
          tests += `    expect(${name}).toBeDefined();\n`;
          tests += `  });\n`;
          tests += `});\n\n`;
          break;
      }
    }

    return tests;
  }

  private generatePytestTests(sourcePath: string, exports: ExportInfo[]): string {
    const moduleName = path.basename(sourcePath, '.py');

    let imports = `import pytest\n`;
    const funcs = exports.filter(e => e.type === 'function').map(e => e.name);
    const classes = exports.filter(e => e.type === 'class').map(e => e.name);

    if (funcs.length > 0) {
      imports += `from ${moduleName} import ${funcs.join(', ')}\n`;
    }
    if (classes.length > 0) {
      imports += `from ${moduleName} import ${classes.join(', ')}\n`;
    }

    let tests = `${imports}\n\n`;

    for (const exp of exports) {
      if (exp.type === 'function') {
        tests += `def test_${exp.name}():\n`;
        tests += `    """Test ${exp.name} function."""\n`;
        tests += `    # TODO: implement test\n`;
        tests += `    result = ${exp.name}()\n`;
        tests += `    assert result is not None\n\n\n`;
      } else if (exp.type === 'class') {
        tests += `class Test${exp.name}:\n`;
        tests += `    """Tests for ${exp.name} class."""\n\n`;
        tests += `    def test_instantiation(self):\n`;
        tests += `        # TODO: provide constructor arguments\n`;
        tests += `        instance = ${exp.name}()\n`;
        tests += `        assert instance is not None\n\n\n`;
      }
    }

    return tests;
  }

  private defaultTestPath(sourcePath: string, ext: string, framework: string): string {
    const dir = path.dirname(sourcePath);
    const basename = path.basename(sourcePath, ext);

    if (framework === 'pytest') {
      const testsDir = path.join(dir, '..', 'tests');
      return path.join(testsDir, `test_${basename}.py`);
    }

    // JS/TS: place test next to source file
    return path.join(dir, `${basename}.test${ext === '.tsx' ? '.tsx' : ext}`);
  }

  private async detectFramework(cwd: string, ext: string): Promise<string> {
    if (ext === '.py') return 'pytest';

    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      if (allDeps['vitest']) return 'vitest';
      if (allDeps['jest']) return 'jest';
    } catch { /* no package.json */ }

    return 'vitest'; // default
  }
}
