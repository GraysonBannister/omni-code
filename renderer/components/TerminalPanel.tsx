import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Plus, X, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useAppStore, type TerminalSession } from '../stores/appStore';
import type { FolderRef } from '../../src/types/workspace';
import '@xterm/xterm/css/xterm.css';
import './TerminalPanel.css';

const DEFAULT_HEIGHT = 280;
const MIN_HEIGHT = 100;
const MAX_HEIGHT_FRACTION = 0.75;

/** Max lines kept in the xterm buffer (viewport rows + scrollback history). Reduces lag on noisy output. */
const TERMINAL_MAX_BUFFER_LINES = 5000;
/** Minimum scrollback lines to keep after subtracting viewport height from the cap. */
const TERMINAL_MIN_SCROLLBACK = 100;

function cappedScrollbackRows(termRows: number): number {
  return Math.max(TERMINAL_MIN_SCROLLBACK, TERMINAL_MAX_BUFFER_LINES - termRows);
}

function folderDisplayLabel(folder: FolderRef): string {
  if (folder.name?.trim()) return folder.name.trim();
  const p = folder.path.replace(/\\/g, '/');
  const seg = p.split('/').filter(Boolean);
  return seg[seg.length - 1] || folder.path;
}

// Individual terminal instance component
interface TerminalInstanceProps {
  session: TerminalSession;
  active: boolean;
  onTitleChange: (title: string) => void;
  onSearchAddonReady: (id: string, addon: SearchAddon) => void;
  onSearchAddonDisposed: (id: string) => void;
  onSearchOpen: () => void;
  onXTermReady: (id: string, term: Terminal) => void;
  onXTermDisposed: (id: string) => void;
}

const TerminalInstance: React.FC<TerminalInstanceProps> = ({
  session,
  active,
  onTitleChange,
  onSearchAddonReady,
  onSearchAddonDisposed,
  onSearchOpen,
  onXTermReady,
  onXTermDisposed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Keep refs up-to-date so the PTY init effect doesn't depend on them directly,
  // preventing terminal restarts when active or onTitleChange change.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const onTitleChangeRef = useRef(onTitleChange);
  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
  }, [onTitleChange]);

  const onSearchOpenRef = useRef(onSearchOpen);
  useEffect(() => {
    onSearchOpenRef.current = onSearchOpen;
  }, [onSearchOpen]);

  const fitTerminal = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current && activeRef.current) {
      try {
        fitAddonRef.current.fit();
        const term = xtermRef.current;
        term.options.scrollback = cappedScrollbackRows(term.rows);
        const dims = fitAddonRef.current.proposeDimensions();
        if (dims && window.electronAPI) {
          window.electronAPI.terminal.resize(session.id, dims.cols, dims.rows);
        }
      } catch {
        // Ignore fit errors during rapid resize
      }
    }
  }, [session.id]);

  // Initialize xterm and PTY — only restarts if the session identity changes
  useEffect(() => {
    if (!containerRef.current || !window.electronAPI) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, Monaco, monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
        padding: 6,
      },
      scrollback: cappedScrollbackRows(24),
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    onSearchAddonReady(session.id, searchAddon);
    onXTermReady(session.id, term);

    term.attachCustomKeyEventHandler((ev) => {
      if (ev.type === 'keydown' && (ev.ctrlKey || ev.metaKey) && ev.key === 'f') {
        ev.preventDefault();
        onSearchOpenRef.current?.();
        return false;
      }
      return true;
    });

    // Use ref so title changes never restart the PTY
    term.onTitleChange((title) => {
      if (title) onTitleChangeRef.current(title);
    });

    // Delay fit + PTY creation to ensure the panel has fully laid out in the DOM
    const initTimer = setTimeout(() => {
      fitAddon.fit();
      term.options.scrollback = cappedScrollbackRows(term.rows);
      const dims = fitAddon.proposeDimensions() || { cols: 80, rows: 24 };
      window.electronAPI!.terminal.create(session.id, session.cwd, dims.cols, dims.rows);
    }, 50);

    // Handle user input
    term.onData((data) => {
      window.electronAPI!.terminal.write(session.id, data);
    });

    // Listen for terminal output
    const unsubData = window.electronAPI.terminal.onData(({ id, data }) => {
      if (id === session.id) {
        term.write(data);
      }
    });

    const unsubExit = window.electronAPI.terminal.onExit(({ id }) => {
      if (id === session.id) {
        term.writeln('\r\n\x1b[90m[Process exited]\x1b[0m');
      }
    });

    // Setup resize observer
    resizeObserverRef.current = new ResizeObserver(() => {
      fitTerminal();
    });
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      clearTimeout(initTimer);
      unsubData();
      unsubExit();
      resizeObserverRef.current?.disconnect();
      onSearchAddonDisposed(session.id);
      onXTermDisposed(session.id);
      window.electronAPI!.terminal.destroy(session.id);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, [session.id, session.cwd, fitTerminal, onSearchAddonReady, onSearchAddonDisposed, onXTermReady, onXTermDisposed]);

  // Refit when becoming active
  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => fitTerminal());
    }
  }, [active, fitTerminal]);

  return (
    <div
      ref={containerRef}
      className="terminal-instance"
      style={{
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: active ? 1 : 0,
      }}
    />
  );
};

// Main Terminal Panel with tabs
export const TerminalPanel: React.FC = () => {
  const {
    terminals,
    activeTerminalId,
    createTerminal,
    closeTerminal,
    setActiveTerminal,
    updateTerminalTitle,
    projectPath,
    isWorkspaceMode,
    currentWorkspace,
  } = useAppStore();

  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  const searchAddonMapRef = useRef<Map<string, SearchAddon>>(new Map());
  const xtermByIdRef = useRef<Map<string, Terminal>>(new Map());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const folderPickerRef = useRef<HTMLDivElement>(null);

  const registerSearchAddon = useCallback((id: string, addon: SearchAddon) => {
    searchAddonMapRef.current.set(id, addon);
  }, []);

  const unregisterSearchAddon = useCallback((id: string) => {
    searchAddonMapRef.current.delete(id);
  }, []);

  const registerXTerm = useCallback((id: string, term: Terminal) => {
    xtermByIdRef.current.set(id, term);
  }, []);

  const unregisterXTerm = useCallback((id: string) => {
    xtermByIdRef.current.delete(id);
  }, []);

  const handleSearchOpen = useCallback(() => {
    setShowSearch(true);
  }, []);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [showSearch]);

  const runSearchNext = useCallback(
    (query: string) => {
      const id = activeTerminalId;
      if (!id || !query.trim()) return;
      const addon = searchAddonMapRef.current.get(id);
      addon?.findNext(query.trim());
    },
    [activeTerminalId]
  );

  const runSearchPrevious = useCallback(
    (query: string) => {
      const id = activeTerminalId;
      if (!id || !query.trim()) return;
      const addon = searchAddonMapRef.current.get(id);
      addon?.findPrevious(query.trim());
    },
    [activeTerminalId]
  );

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    const id = activeTerminalId;
    if (id) {
      searchAddonMapRef.current.get(id)?.clearDecorations();
    }
    requestAnimationFrame(() => {
      const focusId = useAppStore.getState().activeTerminalId;
      if (focusId) {
        xtermByIdRef.current.get(focusId)?.focus();
      }
    });
  }, [activeTerminalId]);

  const workspaceFolders = currentWorkspace?.folders ?? [];
  const showWorkspaceFolderChoice =
    isWorkspaceMode && workspaceFolders.length > 1;

  // Create initial terminal if none exist
  useEffect(() => {
    if (terminals.length === 0 && projectPath) {
      createTerminal(projectPath);
    }
  }, [terminals.length, projectPath, createTerminal]);

  const handleNewTerminalClick = () => {
    if (showWorkspaceFolderChoice) {
      setShowFolderPicker((v) => !v);
      return;
    }
    createTerminal(projectPath);
  };

  const pickWorkspaceFolder = (path: string) => {
    createTerminal(path);
    setShowFolderPicker(false);
  };

  // Click-away for folder picker — defer attaching so the same pointer sequence
  // that opened the menu cannot immediately hit this listener (capture/bubble edge cases).
  useEffect(() => {
    if (!showFolderPicker) return;
    let removeListener: (() => void) | undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const onDown = (e: MouseEvent) => {
        const t = e.target as Node;
        if (addBtnRef.current?.contains(t)) return;
        if (folderPickerRef.current?.contains(t)) return;
        setShowFolderPicker(false);
      };
      document.addEventListener('mousedown', onDown);
      removeListener = () => document.removeEventListener('mousedown', onDown);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      removeListener?.();
    };
  }, [showFolderPicker]);

  const handleCloseTerminal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeTerminal(id);
  };

  const handleTitleChange = (id: string, title: string) => {
    updateTerminalTitle(id, title);
  };

  // Drag-to-resize logic
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartYRef.current = e.clientY;
      dragStartHeightRef.current = height;

      const onMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = dragStartYRef.current - e.clientY;
        const parentHeight = containerRef.current?.parentElement?.clientHeight ?? window.innerHeight;
        const maxHeight = Math.floor(parentHeight * MAX_HEIGHT_FRACTION);
        const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, dragStartHeightRef.current + delta));
        setHeight(newHeight);
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [height]
  );

  return (
    <div ref={containerRef} className="terminal-panel-container" style={{ height }}>
      {/* Resize handle */}
      <div
        className="terminal-resize-handle"
        onMouseDown={handleDragStart}
        title="Drag to resize"
      />
      {/* Tab bar */}
      <div className="terminal-panel-header">
        <div className="terminal-tabs-row">
          <div className="terminal-tabs-scroll">
            {terminals.map((session) => (
              <div
                key={session.id}
                className={`terminal-tab ${session.id === activeTerminalId ? 'active' : ''}`}
                onClick={() => setActiveTerminal(session.id)}
              >
                <span className="terminal-tab-title">{session.title || 'Terminal'}</span>
                <button
                  className="terminal-tab-close"
                  onClick={(e) => handleCloseTerminal(e, session.id)}
                  title="Close terminal"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="terminal-add-wrap">
            <button
              ref={addBtnRef}
              type="button"
              className={`terminal-add-btn ${showFolderPicker ? 'active' : ''}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleNewTerminalClick}
              title={showWorkspaceFolderChoice ? 'New terminal in folder…' : 'New terminal'}
            >
              <Plus size={14} />
            </button>
            {showFolderPicker && showWorkspaceFolderChoice && (
              <div ref={folderPickerRef} className="terminal-folder-picker" role="menu">
                {workspaceFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="terminal-folder-picker-item"
                    role="menuitem"
                    onClick={() => pickWorkspaceFolder(folder.path)}
                  >
                    {folderDisplayLabel(folder)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`terminal-search-toggle ${showSearch ? 'active' : ''}`}
          title="Find in terminal (⌘F / Ctrl+F)"
          onClick={() => (showSearch ? closeSearch() : setShowSearch(true))}
        >
          <Search size={14} />
        </button>

        {showSearch && (
          <div className="terminal-search-bar">
            <input
              ref={searchInputRef}
              className="terminal-search-input"
              placeholder="Find in terminal…"
              value={searchQuery}
              onChange={(e) => {
                const q = e.target.value;
                setSearchQuery(q);
                if (q.trim()) {
                  requestAnimationFrame(() => runSearchNext(q));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) runSearchPrevious(searchQuery);
                  else runSearchNext(searchQuery);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closeSearch();
                }
              }}
            />
            <button
              type="button"
              className="terminal-search-nav-btn"
              title="Previous match (Shift+Enter)"
              onClick={() => runSearchPrevious(searchQuery)}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="terminal-search-nav-btn"
              title="Next match (Enter)"
              onClick={() => runSearchNext(searchQuery)}
            >
              <ChevronDown size={14} />
            </button>
            <button type="button" className="terminal-search-nav-btn" title="Close" onClick={closeSearch}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Terminal instances */}
      <div className="terminal-instances">
        {terminals.map((session) => (
          <TerminalInstance
            key={session.id}
            session={session}
            active={session.id === activeTerminalId}
            onTitleChange={(title) => handleTitleChange(session.id, title)}
            onSearchAddonReady={registerSearchAddon}
            onSearchAddonDisposed={unregisterSearchAddon}
            onSearchOpen={handleSearchOpen}
            onXTermReady={registerXTerm}
            onXTermDisposed={unregisterXTerm}
          />
        ))}
      </div>
    </div>
  );
};
