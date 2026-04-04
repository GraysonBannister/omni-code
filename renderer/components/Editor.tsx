import React, { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { X, File as FileIcon, Circle, Settings, Globe, Check, XCircle, Code, Eye, Columns } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { SettingsPanel } from './Settings';
import { BrowserPanel } from './BrowserPanel';
import { HtmlPreviewPanel } from './HtmlPreviewPanel';
import { ResizableSplitPane } from './ResizableSplitPane';
import { ImageViewer } from './ImageViewer';
import './Editor.css';

// TypeScript type for the Monaco editor
import type { editor } from 'monaco-editor';

/**
 * Parse a unified diff string and return:
 * - addedLines: 1-based line numbers in the "after" file that were added
 * - deletedTexts: text content of lines that were removed (for ghost widgets)
 * - deletedAfterLine: the 1-based line number in the "after" file after which each deletion sits
 */
function parseDiff(diffContent: string): {
  addedLines: number[];
  deletedBlocks: { afterLine: number; lines: string[] }[];
} {
  const addedLines: number[] = [];
  const deletedBlocks: { afterLine: number; lines: string[] }[] = [];

  let afterLineNum = 0;
  let currentDeletedBlock: { afterLine: number; lines: string[] } | null = null;

  for (const raw of diffContent.split('\n')) {
    // Hunk header: @@ -a,b +c,d @@
    const hunkMatch = raw.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (hunkMatch) {
      afterLineNum = parseInt(hunkMatch[1], 10) - 1; // will be incremented on first context/add line
      if (currentDeletedBlock) {
        deletedBlocks.push(currentDeletedBlock);
        currentDeletedBlock = null;
      }
      continue;
    }

    if (raw.startsWith('---') || raw.startsWith('+++')) continue;
    if (raw.startsWith('diff ') || raw.startsWith('index ') || raw.startsWith('new file') || raw.startsWith('deleted file')) continue;

    if (raw.startsWith('+')) {
      afterLineNum++;
      addedLines.push(afterLineNum);
      if (currentDeletedBlock) {
        deletedBlocks.push(currentDeletedBlock);
        currentDeletedBlock = null;
      }
    } else if (raw.startsWith('-')) {
      const lineText = raw.slice(1);
      if (!currentDeletedBlock) {
        currentDeletedBlock = { afterLine: afterLineNum, lines: [lineText] };
      } else {
        currentDeletedBlock.lines.push(lineText);
      }
    } else {
      // Context line
      afterLineNum++;
      if (currentDeletedBlock) {
        deletedBlocks.push(currentDeletedBlock);
        currentDeletedBlock = null;
      }
    }
  }

  if (currentDeletedBlock) {
    deletedBlocks.push(currentDeletedBlock);
  }

  return { addedLines, deletedBlocks };
}

// Check if a file is HTML based on extension
const isHtmlFile = (filePath: string): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext === 'html' || ext === 'htm';
};

// Check if a file is an image based on extension
const isImageFile = (filePath: string): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
  return imageExtensions.includes(ext || '');
};

export const CodeEditor: React.FC = () => {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    updateFileContent,
    saveFile,
    theme,
    pendingFilePreviews,
    clearFilePendingPreview,
    markToolCallReviewed,
    setFileViewMode,
    setSplitRatio,
    setSplitOrientation,
  } = useAppStore();

  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const viewZoneIdsRef = useRef<string[]>([]);

  const activeFile = openFiles.find(f => f.path === activeFilePath);
  const pendingPreview = activeFilePath ? pendingFilePreviews.get(activeFilePath) : undefined;

  // Inject diff highlight CSS into document.head at mount time so Monaco's
  // style system can pick it up regardless of when Vite's CSS bundle loads.
  useEffect(() => {
    if (document.getElementById('editor-diff-styles')) return;
    const style = document.createElement('style');
    style.id = 'editor-diff-styles';
    style.textContent = `
      .monaco-editor .editor-diff-added-inline {
        background: rgba(46, 160, 67, 0.3) !important;
      }
      .monaco-editor .editor-diff-added {
        background: rgba(46, 160, 67, 0.15) !important;
      }
      .monaco-editor .editor-diff-added-margin {
        background: rgba(46, 160, 67, 0.5) !important;
        border-left: 3px solid #3fb950 !important;
        width: 3px !important;
      }
      .editor-diff-deleted-zone {
        font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
        font-size: 13px;
        line-height: 19px;
        background: rgba(248, 81, 73, 0.1);
        border-left: 3px solid #f85149;
        padding-left: 4px;
        box-sizing: border-box;
        overflow: hidden;
        white-space: pre;
      }
      .editor-diff-deleted-line {
        color: rgba(248, 81, 73, 0.9);
        text-decoration: line-through;
        text-decoration-color: rgba(248, 81, 73, 0.5);
        padding-left: 18px;
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('editor-diff-styles')?.remove(); };
  }, []);

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

  // Apply / clear diff decorations whenever active file or pending preview changes
  useEffect(() => {
    if (!editorInstance) return;

    const clearDecorations = () => {
      decorationCollectionRef.current?.clear();
      decorationCollectionRef.current = null;

      // Remove old view zones
      editorInstance.changeViewZones(accessor => {
        for (const id of viewZoneIdsRef.current) {
          accessor.removeZone(id);
        }
        viewZoneIdsRef.current = [];
      });
    };

    if (!pendingPreview) {
      clearDecorations();
      return;
    }

    const { addedLines, deletedBlocks } = parseDiff(pendingPreview.diffContent);

    // --- Line decorations for additions ---
    const decorations: editor.IModelDeltaDecoration[] = addedLines.map(lineNum => ({
      range: { startLineNumber: lineNum, startColumn: 1, endLineNumber: lineNum, endColumn: 1 },
      options: {
        isWholeLine: true,
        // className: background in the .view-overlays layer (may be behind text in some themes)
        className: 'editor-diff-added',
        // inlineClassName: applied to <span> elements inside .view-lines — always visible
        inlineClassName: 'editor-diff-added-inline',
        overviewRuler: {
          color: '#3fb950',
          position: 4, // OverviewRulerLane.Right
        },
        minimap: {
          color: '#3fb950',
          position: 1,
        },
        marginClassName: 'editor-diff-added-margin',
      },
    }));

    clearDecorations();
    decorationCollectionRef.current = editorInstance.createDecorationsCollection(decorations);

    // --- View zones (ghost lines) for deletions ---
    editorInstance.changeViewZones(accessor => {
      for (const block of deletedBlocks) {
        const domNode = document.createElement('div');
        domNode.className = 'editor-diff-deleted-zone';
        for (const line of block.lines) {
          const lineEl = document.createElement('div');
          lineEl.className = 'editor-diff-deleted-line';
          lineEl.textContent = line || '\u00a0';
          domNode.appendChild(lineEl);
        }
        const id = accessor.addZone({
          afterLineNumber: block.afterLine,
          heightInLines: block.lines.length,
          domNode,
        });
        viewZoneIdsRef.current.push(id);
      }
    });
  // activeFile?.content is included so decorations are re-applied after the
  // Monaco model is updated (e.g. file-watcher re-read after the AI writes the file).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorInstance, activeFilePath, pendingPreview, activeFile?.content]);

  const handleAcceptChange = useCallback(async () => {
    if (!pendingPreview || !activeFilePath) return;
    // Update the shared store immediately so the chat panel reflects the new
    // status without waiting for the backend event round-trip.
    markToolCallReviewed(pendingPreview.toolCallId, 'accepted');
    clearFilePendingPreview(activeFilePath);
    try {
      await (window as any).electronAPI!.agent.respondToChangeReview(
        pendingPreview.messageId,
        pendingPreview.toolCallId,
        'accept'
      );
    } catch (error) {
      console.error('[Editor] Failed to accept change:', error);
    }
  }, [pendingPreview, activeFilePath, clearFilePendingPreview, markToolCallReviewed]);

  const handleRejectChange = useCallback(async () => {
    if (!pendingPreview || !activeFilePath) return;
    markToolCallReviewed(pendingPreview.toolCallId, 'rejected');
    clearFilePendingPreview(activeFilePath);
    try {
      await (window as any).electronAPI!.agent.respondToChangeReview(
        pendingPreview.messageId,
        pendingPreview.toolCallId,
        'reject'
      );
    } catch (error) {
      console.error('[Editor] Failed to reject change:', error);
    }
  }, [pendingPreview, activeFilePath, clearFilePendingPreview, markToolCallReviewed]);

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
            {file.path === activeFilePath && pendingFilePreviews.get(file.path) && (
              <span className="editor-tab-pending-review" title="Pending change review" />
            )}
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

      {/* HTML View Mode Toggle - Only shown for HTML files */}
      {activeFile && activeFile.type !== 'settings' && activeFile.type !== 'browser' && isHtmlFile(activeFile.path) && (
        <div className="editor-view-toggle">
          <div className="editor-view-toggle-group">
            <button
              className={`editor-view-toggle-btn ${!activeFile.viewMode || activeFile.viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setFileViewMode(activeFile.path, 'code')}
              title="Code view"
            >
              <Code size={14} />
              <span>Code</span>
            </button>
            <button
              className={`editor-view-toggle-btn ${activeFile.viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setFileViewMode(activeFile.path, 'preview')}
              title="Preview view"
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
            <button
              className={`editor-view-toggle-btn ${activeFile.viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setFileViewMode(activeFile.path, 'split')}
              title="Split view"
            >
              <Columns size={14} />
              <span>Split</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="editor-content">
        {activeFile ? (
          activeFile.isLoading ? (
            <div className="editor-loading">Loading...</div>
          ) : activeFile.type === 'settings' ? (
            <SettingsPanel embedded />
          ) : activeFile.type === 'browser' ? (
            <BrowserPanel url={activeFile.url || activeFile.path} />
          ) : isImageFile(activeFile.path) ? (
            <ImageViewer filePath={activeFile.path} />
          ) : isHtmlFile(activeFile.path) && activeFile.viewMode === 'preview' ? (
            <HtmlPreviewPanel content={activeFile.content} filePath={activeFile.path} />
          ) : isHtmlFile(activeFile.path) && activeFile.viewMode === 'split' ? (
            <ResizableSplitPane
              primaryPane={
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
              }
              secondaryPane={
                <HtmlPreviewPanel
                  content={activeFile.content}
                  filePath={activeFile.path}
                  embedded
                />
              }
              ratio={activeFile.splitConfig?.ratio ?? 0.5}
              orientation={activeFile.splitConfig?.orientation ?? 'horizontal'}
              onRatioChange={(ratio) => setSplitRatio(activeFile.path, ratio)}
              onOrientationChange={(orientation) => setSplitOrientation(activeFile.path, orientation)}
            />
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
          {pendingPreview ? (
            <div className="editor-diff-review-bar">
              <span className="editor-diff-review-label">
                Pending changes: +{pendingPreview.additions} -{pendingPreview.deletions} in {pendingPreview.fileName}
              </span>
              <button className="editor-diff-reject" onClick={handleRejectChange} title="Reject changes">
                <XCircle size={13} />
                Reject
              </button>
              <button className="editor-diff-accept" onClick={handleAcceptChange} title="Accept changes">
                <Check size={13} />
                Accept
              </button>
            </div>
          ) : isImageFile(activeFile.path) ? (
            <>
              <span>IMAGE</span>
              <span>{activeFile.path.split('.').pop()?.toUpperCase() || 'IMG'}</span>
            </>
          ) : (
            <>
              <span>{getLanguage(activeFile.path).toUpperCase()}</span>
              <span>{activeFile.isDirty ? 'Modified' : 'Saved'}</span>
              <span>{activeFile.content.split('\n').length} lines</span>
              <span>{activeFile.content.length} chars</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
