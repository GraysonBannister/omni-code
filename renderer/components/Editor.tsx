import React, { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { X, File as FileIcon, Circle, Settings, Globe } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { SettingsPanel } from './Settings';
import { BrowserPanel } from './BrowserPanel';
import './Editor.css';

// TypeScript type for the Monaco editor
import type { editor } from 'monaco-editor';

export const CodeEditor: React.FC = () => {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    updateFileContent,
    saveFile,
    theme,
  } = useAppStore();

  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeFilePath) {
          saveFile(activeFilePath);
        }
      }
      
      // Cmd/Ctrl + W - Close file
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeFilePath) {
          closeFile(activeFilePath);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath, closeFile, saveFile]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      updateFileContent(activeFilePath, value);
    }
  }, [activeFilePath, updateFileContent]);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    // Add keyboard shortcuts
    editor.addCommand(
      // Monaco KeyMod.CtrlCmd | Monaco KeyCode.KeyS
      2048 | 49, // Ctrl/Cmd + S
      () => {
        if (activeFilePath) {
          saveFile(activeFilePath);
        }
      }
    );
  }, [activeFilePath, saveFile]);

  const getLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'py': 'python',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'toml': 'toml',
      'sh': 'shell',
      'bash': 'shell',
      'sql': 'sql',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (openFiles.length === 0) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <FileIcon size={48} className="editor-empty-icon" />
          <p>No file open</p>
          <p className="editor-empty-hint">
            Select a file from the explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Tab Bar */}
      <div className="editor-tabs">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`editor-tab ${file.path === activeFilePath ? 'active' : ''} ${file.isDirty ? 'dirty' : ''}`}
            onClick={() => setActiveFile(file.path)}
          >
            {file.type === 'settings' ? <Settings size={14} /> :
             file.type === 'browser' ? <Globe size={14} /> : <FileIcon size={14} />}
            <span className="editor-tab-name">
              {file.type === 'settings' ? 'Settings' :
               file.type === 'browser' ? (file.url || file.path).split('/')[2] || 'Browser' :
               file.path.split('/').pop()}
            </span>
            {file.isDirty && <Circle size={6} className="editor-tab-dirty" />}
            <button
              className="editor-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Area */}
      <div className="editor-content">
        {activeFile ? (
          activeFile.isLoading ? (
            <div className="editor-loading">Loading...</div>
          ) : activeFile.type === 'settings' ? (
            <SettingsPanel embedded />
          ) : activeFile.type === 'browser' ? (
            <BrowserPanel url={activeFile.url || activeFile.path} />
          ) : (
            <Editor
              height="100%"
              language={getLanguage(activeFile.path)}
              value={activeFile.content}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: 'SF Mono, Monaco, Inconsolata, "Fira Code", monospace',
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                folding: true,
                renderWhitespace: 'selection',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          )
        ) : (
          <div className="editor-no-file">
            Select a file to edit
          </div>
        )}
      </div>

      {/* Editor Status */}
      {activeFile && activeFile.type !== 'settings' && (
        <div className="editor-status">
          <span>{getLanguage(activeFile.path).toUpperCase()}</span>
          <span>{activeFile.isDirty ? 'Modified' : 'Saved'}</span>
          <span>{activeFile.content.split('\n').length} lines</span>
          <span>{activeFile.content.length} chars</span>
        </div>
      )}
    </div>
  );
};
