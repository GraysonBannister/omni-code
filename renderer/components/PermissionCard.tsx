import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import './PermissionCard.css';

export interface PermissionRequest {
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
}

interface Props {
  request: PermissionRequest;
  onRespond: (toolId: string, decision: 'allowAlways' | 'allow' | 'deny') => void;
}

const PERMISSION_RISK: Record<string, { label: string; level: 'low' | 'medium' | 'high' }> = {
  Bash: { label: 'Execute shell command', level: 'high' },
  ProcessManager: { label: 'Manage background process', level: 'high' },
  Write: { label: 'Write to file', level: 'medium' },
  Edit: { label: 'Edit file', level: 'medium' },
  MultiFileEdit: { label: 'Edit multiple files', level: 'medium' },
  DiffEdit: { label: 'Apply diff to file', level: 'medium' },
  RunTests: { label: 'Run tests', level: 'medium' },
  LintFix: { label: 'Run linter', level: 'medium' },
  TypeCheck: { label: 'Run type checker', level: 'low' },
  DependencyManager: { label: 'Modify dependencies', level: 'high' },
  GitCommit: { label: 'Create git commit', level: 'medium' },
  GitBranch: { label: 'Modify git branch', level: 'medium' },
  Supabase: { label: 'Run Supabase CLI', level: 'high' },
  Netlify: { label: 'Run Netlify CLI', level: 'high' },
  Railway: { label: 'Run Railway CLI', level: 'high' },
};

function getDetailLine(toolName: string, input: Record<string, unknown>): string | null {
  if (toolName === 'Bash' && typeof input.command === 'string') {
    return input.command;
  }
  if ((toolName === 'Write' || toolName === 'Edit' || toolName === 'DiffEdit') && typeof input.file_path === 'string') {
    return input.file_path;
  }
  if (toolName === 'ProcessManager' && typeof input.command === 'string') {
    return `${input.action ?? 'start'}: ${input.command}`;
  }
  if ((toolName === 'Supabase' || toolName === 'Netlify' || toolName === 'Railway') && typeof input.command === 'string') {
    return `${toolName.toLowerCase()} ${input.command}`;
  }
  if (toolName === 'DependencyManager' && input.packages) {
    const pkgs = Array.isArray(input.packages) ? input.packages.join(', ') : String(input.packages);
    return `${input.action ?? 'add'} ${pkgs}`;
  }
  return null;
}

export const PermissionCard: React.FC<Props> = ({ request, onRespond }) => {
  const { toolId, toolName, input } = request;
  const risk = PERMISSION_RISK[toolName] ?? { label: `Run ${toolName}`, level: 'medium' };
  const detail = getDetailLine(toolName, input);

  return (
    <div className={`permission-card permission-card--${risk.level}`}>
      <div className="permission-card-header">
        <ShieldAlert size={14} />
        <span>Permission required</span>
      </div>

      <div className="permission-card-body">
        <div className="permission-card-tool">
          <span className="permission-card-tool-name">{toolName}</span>
          <span className="permission-card-tool-action">{risk.label}</span>
        </div>
        {detail && (
          <div className="permission-card-detail">
            <code>{detail}</code>
          </div>
        )}
      </div>

      <div className="permission-card-actions">
        <button
          className="permission-card-btn permission-card-btn--deny"
          onClick={() => onRespond(toolId, 'deny')}
        >
          <X size={12} />
          Deny
        </button>
        <button
          className="permission-card-btn permission-card-btn--allow-once"
          onClick={() => onRespond(toolId, 'allow')}
        >
          <Check size={12} />
          Allow Once
        </button>
        <button
          className="permission-card-btn permission-card-btn--allow-always"
          onClick={() => onRespond(toolId, 'allowAlways')}
        >
          <Check size={12} />
          Always Allow
        </button>
      </div>
    </div>
  );
};
