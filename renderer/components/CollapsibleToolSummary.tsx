import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Terminal } from 'lucide-react';
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
    parts.push(`${counts.reads} read${counts.reads !== 1 ? 's' : ''}`);
  }
  if (counts.lints > 0) {
    parts.push(`${counts.lints} lint${counts.lints !== 1 ? 's' : ''}`);
  }
  if (counts.other > 0) {
    parts.push(`${counts.other} other${counts.other !== 1 ? 's' : ''}`);
  }

  return `Explored ${parts.join(', ')}`;
}

function getToolStatusDetail(tool: ToolCall, now: number): string | undefined {
  if (tool.detail) {
    return tool.detail;
  }

  if (tool.phase === 'waiting_permission') {
    return `Waiting for permission to run ${tool.toolName}.`;
  }

  if (tool.phase === 'validating') {
    return 'Validating tool input.';
  }

  return undefined;
}

export const CollapsibleToolSummary: React.FC<Props> = ({ tools, now }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tools.length === 0) {
    return null;
  }

  const summaryText = generateSummaryText(tools);
  const hasErrors = tools.some(t => t.status === 'error');

  return (
    <div className="collapsible-tool-summary">
      <div 
        className={`collapsible-tool-summary-header ${hasErrors ? 'has-errors' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="collapsible-tool-summary-text">{summaryText}</span>
        {hasErrors && <span className="collapsible-tool-summary-error-badge">!</span>}
      </div>

      {isExpanded && (
        <div className="collapsible-tool-summary-content">
          {tools.map((tool) => (
            <div key={tool.id} className={`collapsible-tool-item ${tool.status}`}>
              <Terminal size={12} />
              <span className="collapsible-tool-item-name">{tool.toolName}</span>
              <span className="collapsible-tool-item-status">{tool.status}</span>
              {!tool.error && !tool.result && getToolStatusDetail(tool, now) && (
                <span className="collapsible-tool-item-detail">{getToolStatusDetail(tool, now)}</span>
              )}
              {tool.error && <span className="collapsible-tool-item-error">{tool.error}</span>}
              {!tool.error && tool.result && (
                <span className="collapsible-tool-item-result">{tool.result}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
