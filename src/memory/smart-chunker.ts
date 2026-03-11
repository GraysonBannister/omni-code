/**
 * Smart Code Chunker
 *
 * Provides semantic chunking of code files by extracting:
 * - Functions and methods
 * - Classes and interfaces
 * - Type definitions
 * - Logical code blocks
 *
 * Uses language-specific regex patterns for TypeScript/JavaScript and Python.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface CodeChunk {
  id: string;
  content: string;
  metadata: {
    file: string;
    startLine: number;
    endLine: number;
    type: 'function' | 'class' | 'interface' | 'type' | 'method' | 'export' | 'chunk';
    name?: string;
    signature?: string;
    language: string;
    lastModified: number;
  };
}

// Language patterns for different file types
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  // TypeScript/JavaScript patterns
  typescript: [
    // Export declarations (functions, classes, const)
    /export\s+(?:async\s+)?(?:function\s+)?(?:class\s+)?(?:interface\s+)?(?:type\s+)?(?:const\s+)?(?:let\s+)?(?:var\s+)?([A-Za-z_$][A-Za-z0-9_$]*)/g,
    // Function declarations
    /(?:async\s+)?(?:function\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*[<(]/g,
    // Class declarations
    /class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends|implements|<|\{)/g,
    // Interface declarations
    /interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends|<|\{)/g,
    // Type declarations
    /type\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=]/g,
    // Method declarations (simplified)
    /(?:public|private|protected|static|async)?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
  ],
  // Python patterns
  python: [
    // Function definitions
    /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    // Class definitions
    /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*:/g,
    // Import statements
    /(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/g,
  ],
};

// Extensions to language mapping
const EXT_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'typescript',
  '.jsx': 'typescript',
  '.mjs': 'typescript',
  '.cjs': 'typescript',
  '.py': 'python',
  '.pyi': 'python',
  '.pyw': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
};

export class SmartChunker {
  private maxChunkSize: number;
  private fallbackChunkSize: number;

  constructor(maxChunkSize = 2000, fallbackChunkSize = 20) {
    this.maxChunkSize = maxChunkSize;
    this.fallbackChunkSize = fallbackChunkSize;
  }

  async chunkFile(filePath: string, baseDir: string): Promise<CodeChunk[]> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const relPath = path.relative(baseDir, filePath);
      const ext = path.extname(filePath).toLowerCase();
      const language = EXT_TO_LANGUAGE[ext] || 'text';

      // For binary or very large files, skip
      if (content.length > this.maxChunkSize * 50) {
        return this.createSimpleChunk(relPath, content, language, stats.mtimeMs);
      }

      // Use semantic chunking for supported languages
      if (language === 'typescript' || language === 'python') {
        const chunks = this.extractSemanticChunks(relPath, content, language, stats.mtimeMs);
        if (chunks.length > 0) {
          return chunks;
        }
      }

      // Fallback to simple line-based chunking
      return this.createLineBasedChunks(relPath, content, language, stats.mtimeMs);
    } catch (error) {
      console.warn(`[SmartChunker] Failed to chunk ${filePath}:`, error);
      return [];
    }
  }

  private extractSemanticChunks(
    filePath: string,
    content: string,
    language: string,
    lastModified: number
  ): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];
    const patterns = LANGUAGE_PATTERNS[language] || [];

    // Find all symbol positions
    const symbols: Array<{
      line: number;
      type: CodeChunk['metadata']['type'];
      name: string;
      signature: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // TypeScript/JavaScript patterns
      if (language === 'typescript') {
        // Export class/function/interface/type
        const exportMatch = line.match(
          /export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:class|function|interface|type|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/
        );
        if (exportMatch) {
          const type = this.detectType(line);
          symbols.push({
            line: i,
            type,
            name: exportMatch[1],
            signature: this.extractSignature(lines, i),
          });
          continue;
        }

        // Class declaration
        const classMatch = line.match(/class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[<{]/);
        if (classMatch) {
          symbols.push({
            line: i,
            type: 'class',
            name: classMatch[1],
            signature: this.extractSignature(lines, i),
          });
          continue;
        }

        // Interface declaration
        const interfaceMatch = line.match(/interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[<{]/);
        if (interfaceMatch) {
          symbols.push({
            line: i,
            type: 'interface',
            name: interfaceMatch[1],
            signature: this.extractSignature(lines, i),
          });
          continue;
        }

        // Function declaration (not export)
        const funcMatch = line.match(
          /(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/
        );
        if (funcMatch && !line.includes('=>')) {
          symbols.push({
            line: i,
            type: 'function',
            name: funcMatch[1],
            signature: this.extractSignature(lines, i),
          });
          continue;
        }

        // Const arrow functions with names
        const arrowMatch = line.match(
          /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=].*=>/
        );
        if (arrowMatch) {
          symbols.push({
            line: i,
            type: 'function',
            name: arrowMatch[1],
            signature: this.extractSignature(lines, i),
          });
        }
      }

      // Python patterns
      if (language === 'python') {
        // Function definition
        const funcMatch = line.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (funcMatch) {
          symbols.push({
            line: i,
            type: 'function',
            name: funcMatch[1],
            signature: line.trim(),
          });
          continue;
        }

        // Class definition
        const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/);
        if (classMatch) {
          symbols.push({
            line: i,
            type: 'class',
            name: classMatch[1],
            signature: line.trim(),
          });
        }
      }
    }

    // Create chunks from symbols
    if (symbols.length > 0) {
      // Sort by line number
      symbols.sort((a, b) => a.line - b.line);

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const startLine = symbol.line;
        const endLine = i < symbols.length - 1 ? symbols[i + 1].line : lines.length;

        // Extract content
        let chunkLines = lines.slice(startLine, endLine);
        let chunkContent = chunkLines.join('\n').trim();

        // Handle very large chunks by splitting
        if (chunkContent.length > this.maxChunkSize) {
          const subChunks = this.splitLargeChunk(chunkContent, this.maxChunkSize);
          for (let j = 0; j < subChunks.length; j++) {
            chunks.push({
              id: `${filePath}:${symbol.name}:${j}`,
              content: subChunks[j],
              metadata: {
                file: filePath,
                startLine: startLine + 1,
                endLine: endLine,
                type: symbol.type,
                name: symbol.name,
                signature: j === 0 ? symbol.signature : undefined,
                language,
                lastModified,
              },
            });
          }
        } else if (chunkContent.length > 50) {
          // Only add chunks with meaningful content
          chunks.push({
            id: `${filePath}:${symbol.name}`,
            content: chunkContent,
            metadata: {
              file: filePath,
              startLine: startLine + 1,
              endLine: endLine,
              type: symbol.type,
              name: symbol.name,
              signature: symbol.signature,
              language,
              lastModified,
            },
          });
        }
      }
    }

    return chunks;
  }

  private detectType(line: string): CodeChunk['metadata']['type'] {
    if (line.includes('class')) return 'class';
    if (line.includes('interface')) return 'interface';
    if (line.includes('type ')) return 'type';
    if (line.includes('function')) return 'function';
    return 'export';
  }

  private extractSignature(lines: string[], startLine: number): string {
    // Extract the declaration line(s)
    let signature = lines[startLine].trim();

    // For multi-line signatures (e.g., generic types), try to extend
    let i = startLine + 1;
    while (i < lines.length && i < startLine + 3) {
      const line = lines[i].trim();
      if (line.startsWith('<') || line.startsWith('(') || line.startsWith('extends')) {
        signature += ' ' + line;
      }
      if (line.includes('{') || line.includes('=')) {
        break;
      }
      i++;
    }

    return signature.substring(0, 200); // Limit length
  }

  private splitLargeChunk(content: string, maxSize: number): string[] {
    const chunks: string[] = [];
    let remaining = content;

    while (remaining.length > maxSize) {
      // Try to find a good break point (empty line or logical boundary)
      let breakPoint = maxSize;
      while (breakPoint > maxSize * 0.5 && remaining[breakPoint] !== '\n') {
        breakPoint--;
      }

      // If no good break point found, just cut at maxSize
      if (breakPoint <= maxSize * 0.5) {
        breakPoint = maxSize;
      }

      chunks.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    }

    if (remaining.length > 50) {
      chunks.push(remaining);
    }

    return chunks;
  }

  private createLineBasedChunks(
    filePath: string,
    content: string,
    language: string,
    lastModified: number
  ): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];
    const chunkSize = this.fallbackChunkSize;

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      const chunkContent = chunkLines.join('\n').trim();

      if (chunkContent.length > 50) {
        chunks.push({
          id: `${filePath}:${i}`,
          content: chunkContent,
          metadata: {
            file: filePath,
            startLine: i + 1,
            endLine: Math.min(i + chunkSize, lines.length),
            type: 'chunk',
            language,
            lastModified,
          },
        });
      }
    }

    return chunks;
  }

  private createSimpleChunk(
    filePath: string,
    content: string,
    language: string,
    lastModified: number
  ): CodeChunk[] {
    // For very large files, just take the first part and last part
    const firstPart = content.substring(0, this.maxChunkSize);
    const lastPart = content.substring(content.length - Math.min(this.maxChunkSize, content.length * 0.1));

    const chunks: CodeChunk[] = [
      {
        id: `${filePath}:start`,
        content: firstPart,
        metadata: {
          file: filePath,
          startLine: 1,
          endLine: firstPart.split('\n').length,
          type: 'chunk',
          language,
          lastModified,
        },
      },
    ];

    if (content.length > this.maxChunkSize * 2) {
      chunks.push({
        id: `${filePath}:end`,
        content: lastPart,
        metadata: {
          file: filePath,
          startLine: content.split('\n').length - lastPart.split('\n').length + 1,
          endLine: content.split('\n').length,
          type: 'chunk',
          language,
          lastModified,
        },
      });
    }

    return chunks;
  }

  // Utility method to check if a file should be indexed
  static shouldIndexFile(filePath: string, excludePatterns: string[]): boolean {
    const basename = path.basename(filePath);
    const relativePath = filePath;

    for (const pattern of excludePatterns) {
      // Simple glob matching
      if (this.matchesGlob(basename, pattern) || this.matchesGlob(relativePath, pattern)) {
        return false;
      }
    }

    // Check for binary files by extension
    const binaryExts = [
      '.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg', '.webp',
      '.mp3', '.mp4', '.wav', '.avi', '.mov',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.ttf', '.otf', '.woff', '.woff2',
    ];

    const ext = path.extname(filePath).toLowerCase();
    if (binaryExts.includes(ext)) {
      return false;
    }

    return true;
  }

  private static matchesGlob(str: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');

    try {
      const regex = new RegExp(regexPattern);
      return regex.test(str);
    } catch {
      // If pattern is invalid, do simple includes check
      return str.includes(pattern.replace(/\*/g, '').replace(/\?/g, ''));
    }
  }
}
