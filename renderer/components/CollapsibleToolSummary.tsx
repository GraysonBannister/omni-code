import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import './CollapsibleToolSummary.css';

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  phase?: string;
  detail?: string;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  permissionLevel?: string;
  category?: string;
}

interface Props {
  tools: ToolCall[];
  now: number;
}

const SEARCH_TOOLS = ['Grep', 'Glob', 'SemanticSearch', 'QueryCodebase'];
const LINT_TOOLS = ['ReadLints', 'LintFix'];
const READ_TOOLS = ['Read', 'FileTree', 'RepoMap', 'GitDiff', 'GitLog', 'PreviewDiff'];

// Primary input keys to highlight first in the detail panel
const PRIMARY_INPUT_KEYS = ['command', 'path', 'pattern', 'query', 'glob_pattern', 'url', 'file_path', 'content'];
const OUTPUT_TRUNCATE_LINES = 40;

function generateSummaryText(tools: ToolCall[]): string {
  const counts = {
    searches: tools.filter(t => SEARCH_TOOLS.includes(t.toolName)).length,
    lints: tools.filter(t => LINT_TOOLS.includes(t.toolName)).length,
    reads: tools.filter(t => READ_TOOLS.includes(t.toolName)).length,
    other: tools.filter(t =>
      !SEARCH_TOOLS.includes(t.toolName) &&
      !LINT_TOOLS.includes(t.toolName) &&
      !READ_TOOLS.includes(t.toolName)
    ).length,
  };

  const parts: string[] = [];

  if (counts.searches > 0) {
    parts.push(`${counts.searches} search${counts.searches !== 1 ? 'es' : ''}`);
  }
  if (counts.reads > 0) {
    parts.push(`${counts.reads} file${counts.reads !== 1 ? 's' : ''}`);
  }
  if (counts.lints > 0) {
    parts.push(`${counts.lints} lint${counts.lints !== 1 ? 's' : ''}`);
  }
  if (counts.other > 0) {
    parts.push(`${counts.other} other`);
  }

  return `Explored ${parts.join(', ')}`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function getToolSummary(tool: ToolCall): string {
  const inputs = tool.input;

  if (tool.toolName === 'Read' && inputs.path) {
    const path = String(inputs.path);
    const filename = path.split('/').pop() || path;
    return `Read ${truncate(filename, 40)}`;
  }

  if (tool.toolName === 'FileTree' && inputs.path) {
    const path = String(inputs.path);
    const dirname = path.split('/').pop() || path || 'root';
    return `Listed ${truncate(dirname, 30)}`;
  }

  if ((tool.toolName === 'Grep' || tool.toolName === 'Glob') && inputs.pattern) {
    return `${tool.toolName} ${truncate(String(inputs.pattern), 35)}`;
  }
  if (tool.toolName === 'SemanticSearch' && inputs.query) {
    return `Search ${truncate(String(inputs.query), 35)}`;
  }
  if (tool.toolName === 'QueryCodebase' && inputs.query) {
    return `Query ${truncate(String(inputs.query), 35)}`;
  }

  if (tool.toolName === 'ProcessManager' || tool.toolName === 'Shell' || tool.toolName === 'BashExec') {
    const cmd = inputs.command || inputs.name || inputs.cmd;
    if (cmd) {
      const cmdStr = String(cmd).split('\n')[0];
      return `${tool.toolName} ${truncate(cmdStr, 50)}`;
    }
  }

  if ((tool.toolName === 'WebFetch' || tool.toolName === 'HTTPClient') && inputs.url) {
    const url = String(inputs.url);
    const hostname = url.replace(/^https?:\/\//, '').split('/')[0];
    return `Fetch ${truncate(hostname, 35)}`;
  }

  if (tool.toolName === 'Write' || tool.toolName === 'StrReplace' || tool.toolName === 'EditNotebook') {
    const path = inputs.path || inputs.file_path || inputs.target_notebook;
    if (path) {
      const filename = String(path).split('/').pop() || String(path);
      return `${tool.toolName} ${truncate(filename, 35)}`;
    }
  }

  if (tool.toolName === 'GitDiff') return 'Git diff';
  if (tool.toolName === 'GitLog') return 'Git log';

  if (tool.toolName === 'ReadLints') {
    const files = inputs.files || inputs.path || inputs.paths;
    if (files) {
      const fileStr = Array.isArray(files) ? files[0] : String(files);
      const filename = String(fileStr).split('/').pop() || String(fileStr);
      return `Lint check ${truncate(filename, 30)}`;
    }
    return 'Checked lints';
  }
  if (tool.toolName === 'LintFix') return 'Fixed lints';

  if (tool.toolName === 'RepoMap') return 'Repo map';

  if (tool.toolName === 'PreviewDiff') {
    const path = inputs.path ? String(inputs.path).split('/').pop() : null;
    return path ? `Preview ${truncate(path, 30)}` : 'Preview changes';
  }

  const hint = inputs.name || inputs.title || inputs.path || inputs.command || inputs.query;
  if (hint) {
    return `${tool.toolName} ${truncate(String(hint), 30)}`;
  }

  return tool.toolName;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatInputValue(key: string, value: unknown): string {
  if (typeof value === 'string') {
    // For content/long strings, don't quote — just show raw
    if (key === 'content' || key === 'new_string' || key === 'old_string') {
      return value;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(v => String(v)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function getDurationText(tool: ToolCall): string | null {
  if (tool.startedAt && tool.completedAt) {
    const ms = tool.completedAt - tool.startedAt;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return null;
}

// ─── ToolDetail: expandable per-tool detail panel ───────────────────────────

interface ToolDetailProps {
  tool: ToolCall;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool }) => {
  const [outputExpanded, setOutputExpanded] = useState(false);

  const inputEntries = Object.entries(tool.input);
  // Sort: primary keys first, then the rest alphabetically
  const sortedEntries = [
    ...inputEntries.filter(([k]) => PRIMARY_INPUT_KEYS.includes(k)),
    ...inputEntries.filter(([k]) => !PRIMARY_INPUT_KEYS.includes(k)),
  ];

  const outputText = tool.error || tool.result || '';
  const outputLines = outputText.split('\n');
  const isTruncated = outputLines.length > OUTPUT_TRUNCATE_LINES;
  const visibleOutput = isTruncated && !outputExpanded
    ? outputLines.slice(0, OUTPUT_TRUNCATE_LINES).join('\n')
    : outputText;

  const duration = getDurationText(tool);
  const isError = tool.status === 'error' || !!tool.error;

  return (
    <div className="tool-detail">
      {/* Input section */}
      {sortedEntries.length > 0 && (
        <div className="tool-detail-section">
          <div className="tool-detail-label">Input</div>
          <div className="tool-detail-inputs">
            {sortedEntries.map(([key, value]) => {
              const formatted = formatInputValue(key, value);
              const isLong = formatted.includes('\n') || formatted.length > 120;
              return (
                <div key={key} className={`tool-detail-input-row ${isLong ? 'is-long' : ''}`}>
                  <span className="tool-detail-input-key">{key}</span>
                  <span className="tool-detail-input-value">
                    {isLong
                      ? <pre className="tool-detail-input-pre">{formatted}</pre>
                      : formatted
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Output section */}
      {outputText && (
        <div className="tool-detail-section">
          <div className="tool-detail-label">
            <span className={isError ? 'tool-detail-label-error' : ''}>
              {isError ? 'Error' : 'Output'}
            </span>
            {duration && <span className="tool-detail-duration">{duration}</span>}
          </div>
          <pre className={`tool-detail-output ${isError ? 'is-error' : ''}`}>
            {visibleOutput}
          </pre>
          {isTruncated && (
            <button
              className="tool-detail-show-more"
              onClick={(e) => { e.stopPropagation(); setOutputExpanded(!outputExpanded); }}
            >
              {outputExpanded
                ? `Show less`
                : `Show ${outputLines.length - OUTPUT_TRUNCATE_LINES} more lines`
              }
            </button>
          )}
        </div>
      )}

      {/* Running / no output yet */}
      {!outputText && tool.status === 'running' && tool.detail && (
        <div className="tool-detail-section">
          <div className="tool-detail-running">{tool.detail}</div>
        </div>
      )}
    </div>
  );
};

// ─── StatusDot ──────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: ToolCall['status'] }> = ({ status }) => (
  <span className={`tool-status-dot tool-status-dot--${status}`} />
);

// ─── CollapsibleToolSummary ──────────────────────────────────────────────────

export const CollapsibleToolSummary: React.FC<Props> = ({ tools, now: _now }) => {
  const [isGroupExpanded, setIsGroupExpanded] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  if (tools.length === 0) {
    return null;
  }

  const summaryText = tools.length === 1 ? getToolSummary(tools[0]) : generateSummaryText(tools);
  const hasErrors = tools.some(t => t.status === 'error');

  function toggleTool(id: string) {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="collapsible-tool-summary">
      {/* Group header */}
      <button
        className={`collapsible-tool-summary-header ${hasErrors ? 'has-errors' : ''}`}
        onClick={() => setIsGroupExpanded(!isGroupExpanded)}
      >
        {isGroupExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="collapsible-tool-summary-text">{summaryText}</span>
      </button>

      {/* Tool list */}
      {isGroupExpanded && (
        <div className="collapsible-tool-summary-content">
          {tools.map((tool) => {
            const isToolExpanded = expandedTools.has(tool.id);
            const hasDetails = Object.keys(tool.input).length > 0 || !!tool.result || !!tool.error;

            return (
              <div key={tool.id} className="collapsible-tool-item">
                {/* Per-tool row */}
                <button
                  className={`collapsible-tool-item-header ${hasDetails ? 'is-expandable' : ''}`}
                  onClick={() => hasDetails && toggleTool(tool.id)}
                  disabled={!hasDetails}
                >
                  <StatusDot status={tool.status} />
                  {hasDetails && (
                    isToolExpanded
                      ? <ChevronDown size={10} className="tool-item-chevron" />
                      : <ChevronRight size={10} className="tool-item-chevron" />
                  )}
                  <span className="collapsible-tool-item-name">{getToolSummary(tool)}</span>
                </button>

                {/* Detail panel */}
                {isToolExpanded && hasDetails && (
                  <ToolDetail tool={tool} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
