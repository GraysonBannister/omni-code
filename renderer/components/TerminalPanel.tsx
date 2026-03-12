import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Plus, X } from 'lucide-react';
import { useAppStore, type TerminalSession } from '../stores/appStore';
import '@xterm/xterm/css/xterm.css';
import './TerminalPanel.css';

const DEFAULT_HEIGHT = 280;
const MIN_HEIGHT = 100;
const MAX_HEIGHT_FRACTION = 0.75;

// Individual terminal instance component
interface TerminalInstanceProps {
  session: TerminalSession;
  active: boolean;
  onTitleChange: (title: string) => void;
}

const TerminalInstance: React.FC<TerminalInstanceProps> = ({ session, active, onTitleChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Keep refs up-to-date so the PTY init effect doesn't depend on them directly,
  // preventing terminal restarts when active or onTitleChange change.
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  const onTitleChangeRef = useRef(onTitleChange);
  useEffect(() => { onTitleChangeRef.current = onTitleChange; }, [onTitleChange]);

  const fitTerminal = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current && activeRef.current) {
      try {
        fitAddonRef.current.fit();
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
      scrollback: 5000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Use ref so title changes never restart the PTY
    term.onTitleChange((title) => {
      if (title) onTitleChangeRef.current(title);
    });

    // Delay fit + PTY creation to ensure the panel has fully laid out in the DOM
    const initTimer = setTimeout(() => {
      fitAddon.fit();
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
      window.electronAPI!.terminal.destroy(session.id);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [session.id, session.cwd, fitTerminal]); // fitTerminal is now stable (only deps on session.id)

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
  } = useAppStore();

  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  // Create initial terminal if none exist
  useEffect(() => {
    if (terminals.length === 0 && projectPath) {
      createTerminal(projectPath);
    }
  }, [terminals.length, projectPath, createTerminal]);

  const handleNewTerminal = () => {
    createTerminal(projectPath);
  };

  const handleCloseTerminal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeTerminal(id);
  };

  const handleTitleChange = (id: string, title: string) => {
    updateTerminalTitle(id, title);
  };

  // Drag-to-resize logic
  const handleDragStart = useCallback((e: React.MouseEvent) => {
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
  }, [height]);

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
        <div className="terminal-tabs">
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
          <button
            className="terminal-add-btn"
            onClick={handleNewTerminal}
            title="New terminal"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Terminal instances */}
      <div className="terminal-instances">
        {terminals.map((session) => (
          <TerminalInstance
            key={session.id}
            session={session}
            active={session.id === activeTerminalId}
            onTitleChange={(title) => handleTitleChange(session.id, title)}
          />
        ))}
      </div>
    </div>
  );
};
