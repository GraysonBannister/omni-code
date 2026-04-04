import React from 'react';
import { DollarSign, Activity, Code, Building2, Eye, Shield, Bug, TerminalSquare, Briefcase, Folder } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { IndexingStatus } from './IndexingStatus';
import './StatusBar.css';

const modeIcons = {
  code: Code,
  architect: Building2,
  review: Eye,
  security: Shield,
  debug: Bug,
};

const modeLabels = {
  code: 'Code',
  architect: 'Architect',
  review: 'Review',
  security: 'Security',
  debug: 'Debug',
};

export const StatusBar: React.FC = () => {
  const {
    currentProvider,
    isProcessing,
    totalCost,
    inputTokens,
    outputTokens,
    activeConversationId,
    conversations,
    terminalVisible,
    toggleTerminal,
    isWorkspaceMode,
    currentWorkspace,
    activeFolderId,
    projectPath,
  } = useAppStore();

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentMode = activeConversation?.mode || 'code';
  const ModeIcon = modeIcons[currentMode as keyof typeof modeIcons] || Code;

  return (
    <div className="status-bar">
      {/* Left - Mode indicator, Workspace indicator, Processing indicator and Indexing Status */}
      <div className="status-bar-section">
        <div className="status-item mode-indicator" title={`AI Mode: ${modeLabels[currentMode as keyof typeof modeLabels]}`}>
          <ModeIcon size={14} />
          <span className="mode-text">{modeLabels[currentMode as keyof typeof modeLabels]}</span>
        </div>

        {/* Workspace Indicator */}
        {isWorkspaceMode && currentWorkspace && (
          <div className="status-item workspace-indicator" title={`Workspace: ${currentWorkspace.name}`}>
            <Briefcase size={14} className="workspace-icon" />
            <span className="workspace-name">{currentWorkspace.name}</span>
            {activeFolderId && (
              <>
                <span className="workspace-separator">/</span>
                <span className="workspace-project">
                  <Folder size={12} />
                  {currentWorkspace.folders.find(f => f.id === activeFolderId)?.name || 'Project'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Single folder indicator */}
        {!isWorkspaceMode && projectPath && (
          <div className="status-item folder-indicator" title={`Project: ${projectPath}`}>
            <Folder size={14} />
            <span className="folder-name">{projectPath.split('/').pop() || projectPath}</span>
          </div>
        )}

        {isProcessing && (
          <div className="status-item status-processing">
            <Activity size={14} className="spinning" />
            <span>Processing...</span>
          </div>
        )}
        <IndexingStatus />
      </div>

      {/* Right - Stats + Terminal toggle */}
      <div className="status-bar-section right">
        {totalCost > 0 && (
          <div className="status-item" title="Total cost">
            <DollarSign size={14} />
            <span>${totalCost.toFixed(4)}</span>
          </div>
        )}
        {(inputTokens > 0 || outputTokens > 0) && (
          <div className="status-item" title="Token usage">
            <span>{inputTokens.toLocaleString()} / {outputTokens.toLocaleString()} tokens</span>
          </div>
        )}
        <div className="status-item">
          <span>{currentProvider}</span>
        </div>
        <button
          className={`status-item status-terminal-toggle ${terminalVisible ? 'active' : ''}`}
          onClick={toggleTerminal}
          title={`${terminalVisible ? 'Hide' : 'Show'} Terminal (⌘\`)`}
        >
          <TerminalSquare size={14} />
        </button>
      </div>
    </div>
  );
};
