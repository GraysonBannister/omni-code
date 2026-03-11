import React from 'react';
import { FolderOpen, FolderPlus, Folder, Clock, Zap } from 'lucide-react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onOpenFolder: () => void;
  onCreateFolder: () => void;
  onOpenRecent: (path: string) => void;
  recentWorkspaces: string[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenFolder,
  onCreateFolder,
  onOpenRecent,
  recentWorkspaces,
}) => {
  // Format path for display - show parent directory for context
  const formatPath = (fullPath: string): string => {
    const parts = fullPath.split('/');
    if (parts.length > 3) {
      return '.../' + parts.slice(-2).join('/');
    }
    return fullPath;
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="welcome-logo">
            <Zap size={48} className="logo-icon" />
          </div>
          <h1>Welcome to Omni Code</h1>
          <p className="welcome-subtitle">Your AI-powered coding assistant</p>
        </div>

        <div className="welcome-actions">
          <button onClick={onOpenFolder} className="welcome-btn primary">
            <FolderOpen size={20} />
            <span>Open Folder</span>
          </button>
          <button onClick={onCreateFolder} className="welcome-btn secondary">
            <FolderPlus size={20} />
            <span>Create Folder</span>
          </button>
        </div>

        {recentWorkspaces.length > 0 && (
          <div className="recent-section">
            <div className="recent-header">
              <Clock size={16} />
              <h2>Recent Projects</h2>
            </div>
            <div className="recent-list">
              {recentWorkspaces.map((workspacePath) => (
                <div
                  key={workspacePath}
                  className="recent-item"
                  onClick={() => onOpenRecent(workspacePath)}
                  title={workspacePath}
                >
                  <div className="recent-icon">
                    <Folder size={20} />
                  </div>
                  <div className="recent-info">
                    <span className="recent-name">
                      {workspacePath.split('/').pop()}
                    </span>
                    <span className="recent-path">
                      {formatPath(workspacePath)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="welcome-tips">
          <p>Tip: Use Cmd/Ctrl+O to quickly open a folder</p>
        </div>
      </div>
    </div>
  );
};
