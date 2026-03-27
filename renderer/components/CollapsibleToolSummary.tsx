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

  // File reads - show filename
  if (tool.toolName === 'Read' && inputs.path) {
    const path = String(inputs.path);
    const filename = path.split('/').pop() || path;
    return `Read ${truncate(filename, 40)}`;
  }

  // File tree - show directory
  if (tool.toolName === 'FileTree' && inputs.path) {
    const path = String(inputs.path);
    const dirname = path.split('/').pop() || path || 'root';
    return `Listed ${truncate(dirname, 30)}`;
  }

  // Searches - show pattern/query
  if ((tool.toolName === 'Grep' || tool.toolName === 'Glob') && inputs.pattern) {
    return `${tool.toolName} ${truncate(String(inputs.pattern), 35)}`;
  }
  if (tool.toolName === 'SemanticSearch' && inputs.query) {
    return `Search ${truncate(String(inputs.query), 35)}`;
  }
  if (tool.toolName === 'QueryCodebase' && inputs.query) {
    return `Query ${truncate(String(inputs.query), 35)}`;
  }

  // Process/Bash - show command
  if (tool.toolName === 'ProcessManager' || tool.toolName === 'BashExec') {
    const cmd = inputs.command || inputs.name || inputs.cmd;
    if (cmd) {
      const cmdStr = String(cmd).split(' ')[0];
      return `${tool.toolName} ${truncate(cmdStr, 30)}`;
    }
  }

  // HTTP/Web - show URL
  if ((tool.toolName === 'WebFetch' || tool.toolName === 'HTTPClient') && inputs.url) {
    const url = String(inputs.url);
    const hostname = url.replace(/^https?:\/\//, '').split('/')[0];
    return `Fetch ${truncate(hostname, 35)}`;
  }

  // Git - show operation
  if (tool.toolName === 'GitDiff') return 'Git diff';
  if (tool.toolName === 'GitLog') return 'Git log';

  // Lint
  if (tool.toolName === 'ReadLints') {
    const files = inputs.files || inputs.path;
    if (files) {
      const fileStr = Array.isArray(files) ? files[0] : String(files);
      const filename = fileStr.split('/').pop() || fileStr;
      return `Lint check ${truncate(filename, 30)}`;
    }
    return 'Checked lints';
  }
  if (tool.toolName === 'LintFix') return 'Fixed lints';

  // Repo map
  if (tool.toolName === 'RepoMap') return 'Repo map';

  // Preview
  if (tool.toolName === 'PreviewDiff') {
    const path = inputs.path ? String(inputs.path).split('/').pop() : null;
    return path ? `Preview ${truncate(path, 30)}` : 'Preview changes';
  }

  // Default: tool name with any available name/title/path hint
  const hint = inputs.name || inputs.title || inputs.path || inputs.command || inputs.query;
  if (hint) {
    return `${tool.toolName} ${truncate(String(hint), 30)}`;
  }

  return tool.toolName;
}

export const CollapsibleToolSummary: React.FC<Props> = ({ tools }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tools.length === 0) {
    return null;
  }

  const summaryText = tools.length === 1 ? getToolSummary(tools[0]) : generateSummaryText(tools);
  const hasErrors = tools.some(t => t.status === 'error');

  return (
    <div className="collapsible-tool-summary">
      <button
        className={`collapsible-tool-summary-header ${hasErrors ? 'has-errors' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="collapsible-tool-summary-text">{summaryText}</span>
      </button>

      {isExpanded && (
        <div className="collapsible-tool-summary-content">
          {tools.map((tool) => (
            <div key={tool.id} className="collapsible-tool-item">
              <span className="collapsible-tool-item-name">{getToolSummary(tool)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
