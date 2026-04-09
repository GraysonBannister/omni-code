import React from 'react';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  FileImage,
  FileTerminal,
  Settings,
  GitBranch,
  Hash,
} from 'lucide-react';

interface FileIconProps {
  filename: string;
  size?: number;
}

const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
};

const getFilenameWithoutExt = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return filename;
  return filename.substring(0, lastDot);
};

// Icon mapping for file types
export const FileIcon: React.FC<FileIconProps> = ({ filename, size = 16 }) => {
  const ext = getFileExtension(filename);
  const name = getFilenameWithoutExt(filename);

  // Special files
  if (filename.toLowerCase() === 'package.json') {
    return <span className="file-icon file-icon-npm" style={{ fontSize: size }}>npm</span>;
  }
  if (filename.toLowerCase() === 'license' || filename.toLowerCase().startsWith('license.')) {
    return <span className="file-icon file-icon-license">📝</span>;
  }
  if (filename.toLowerCase() === 'readme.md' || filename.toLowerCase().startsWith('readme.')) {
    return <span className="file-icon file-icon-readme">📖</span>;
  }
  if (filename.toLowerCase() === '.gitignore') {
    return <GitBranch size={size} className="file-icon-git" />;
  }

  // Extension-based icons
  switch (ext) {
    // TypeScript
    case 'ts':
    case 'tsx':
      return <span className="file-icon file-icon-typescript" style={{ fontSize: size }}>TS</span>;
    
    // JavaScript
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return <span className="file-icon file-icon-javascript" style={{ fontSize: size }}>JS</span>;
    
    // JSON
    case 'json':
      return <FileJson size={size} className="file-icon-json" />;
    
    // Markdown
    case 'md':
    case 'mdx':
      return <span className="file-icon file-icon-markdown" style={{ fontSize: size }}>MD</span>;
    
    // CSS & Styling
    case 'css':
      return <span className="file-icon file-icon-css" style={{ fontSize: size }}>#</span>;
    case 'scss':
    case 'sass':
      return <span className="file-icon file-icon-scss" style={{ fontSize: size }}>SC</span>;
    case 'less':
      return <span className="file-icon file-icon-less" style={{ fontSize: size }}>LE</span>;
    
    // HTML
    case 'html':
    case 'htm':
      return <span className="file-icon file-icon-html" style={{ fontSize: size }}>&lt;&gt;</span>;
    
    // Python
    case 'py':
    case 'pyw':
      return <span className="file-icon file-icon-python" style={{ fontSize: size }}>PY</span>;
    
    // Go
    case 'go':
      return <span className="file-icon file-icon-go" style={{ fontSize: size }}>GO</span>;
    
    // Rust
    case 'rs':
      return <span className="file-icon file-icon-rust" style={{ fontSize: size }}>RS</span>;
    
    // Java
    case 'java':
      return <span className="file-icon file-icon-java" style={{ fontSize: size }}>JA</span>;
    
    // C/C++
    case 'c':
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
      return <span className="file-icon file-icon-c" style={{ fontSize: size }}>C</span>;
    
    // C#
    case 'cs':
      return <span className="file-icon file-icon-csharp" style={{ fontSize: size }}>C#</span>;
    
    // Ruby
    case 'rb':
      return <span className="file-icon file-icon-ruby" style={{ fontSize: size }}>RB</span>;
    
    // PHP
    case 'php':
      return <span className="file-icon file-icon-php" style={{ fontSize: size }}>PH</span>;
    
    // Swift
    case 'swift':
      return <span className="file-icon file-icon-swift" style={{ fontSize: size }}>SW</span>;
    
    // Kotlin
    case 'kt':
      return <span className="file-icon file-icon-kotlin" style={{ fontSize: size }}>KT</span>;
    
    // Dart
    case 'dart':
      return <span className="file-icon file-icon-dart" style={{ fontSize: size }}>DA</span>;
    
    // Shell/Bash
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'fish':
      return <FileTerminal size={size} className="file-icon-shell" />;
    
    // YAML/TOML/Config
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'ini':
    case 'conf':
    case 'config':
      return <Settings size={size} className="file-icon-config" />;
    
    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return <FileImage size={size} className="file-icon-image" />;
    
    // Lock files
    case 'lock':
      return <Hash size={size} className="file-icon-lock" />;
    
    // XML
    case 'xml':
      return <FileCode size={size} className="file-icon-xml" />;
    
    // SQL
    case 'sql':
      return <span className="file-icon file-icon-sql" style={{ fontSize: size }}>SQ</span>;
    
    // GraphQL
    case 'gql':
    case 'graphql':
      return <span className="file-icon file-icon-graphql" style={{ fontSize: size }}>GQ</span>;
    
    // Vue
    case 'vue':
      return <span className="file-icon file-icon-vue" style={{ fontSize: size }}>VU</span>;
    
    // Svelte
    case 'svelte':
      return <span className="file-icon file-icon-svelte" style={{ fontSize: size }}>SV</span>;
    
    // Test files
    case 'test':
    case 'spec':
      if (name.includes('.test') || name.includes('.spec')) {
        return <span className="file-icon file-icon-test" style={{ fontSize: size }}>TE</span>;
      }
      return <FileText size={size} className="file-icon-text" />;
    
    // Log
    case 'log':
      return <FileText size={size} className="file-icon-log" />;
    
    // Environment files
    case 'env':
      return <span className="file-icon file-icon-env" style={{ fontSize: size }}>ENV</span>;
    
    // Default
    default:
      return <File size={size} className="file-icon-default" />;
  }
};
