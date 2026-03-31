import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw, GitBranch, ChevronDown, ChevronRight,
  Plus, Minus, Undo2, Upload, Download, ArrowUpDown,
  Check, File, AlertCircle, Eye, GitCommitHorizontal,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './GitPanel.css';

interface GitStatusResult {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  not_added: string[];
  conflicted: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  created: string[];
}

interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

type ChangeSection = 'staged' | 'changes' | 'untracked';

export const GitPanel: React.FC = () => {
  const projectPath = useAppStore(s => s.projectPath);

  const [isRepo, setIsRepo] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GitStatusResult | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<ChangeSection>>(
    new Set(['staged', 'changes', 'untracked'])
  );
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState<GitLogEntry[]>([]);
  const [diffPreview, setDiffPreview] = useState<{ file: string; diff: string; staged: boolean } | null>(null);

  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const git = window.electronAPI?.git;

  const refreshStatus = useCallback(async () => {
    if (!projectPath || !git) return;
    try {
      const repoResult = await git.isRepo(projectPath);
      setIsRepo(repoResult.isRepo);
      if (!repoResult.isRepo) return;

      const [statusResult, branchResult] = await Promise.all([
        git.status(projectPath),
        git.branchList(projectPath),
      ]);

      if (statusResult.status) setStatus(statusResult.status);
      if (branchResult.branches) {
        setBranches(branchResult.branches);
        setCurrentBranch(branchResult.current);
      }
    } catch (err) {
      console.error('[GitPanel] refresh error:', err);
    }
  }, [projectPath, git]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!projectPath || !git) return;
    pollIntervalRef.current = setInterval(refreshStatus, 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [projectPath, git, refreshStatus]);

  useEffect(() => {
    if (!window.electronAPI?.file) return;
    const unsub = window.electronAPI.file.onChange(() => {
      refreshStatus();
    });
    return unsub;
  }, [refreshStatus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false);
        setIsCreatingBranch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const withAction = useCallback(async (name: string, fn: () => Promise<void>) => {
    setActionInProgress(name);
    setError(null);
    try {
      await fn();
      await refreshStatus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  }, [refreshStatus]);

  const handleStageFile = useCallback((file: string) => {
    if (!git || !projectPath) return;
    withAction('stage', async () => {
      const result = await git.stage(projectPath, [file]);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleUnstageFile = useCallback((file: string) => {
    if (!git || !projectPath) return;
    withAction('unstage', async () => {
      const result = await git.unstage(projectPath, [file]);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleDiscardFile = useCallback((file: string) => {
    if (!git || !projectPath) return;
    const confirmed = window.confirm(`Discard changes to "${file}"? This cannot be undone.`);
    if (!confirmed) return;
    withAction('discard', async () => {
      const result = await git.discard(projectPath, [file]);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleStageAll = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('stage-all', async () => {
      const result = await git.stageAll(projectPath);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleUnstageAll = useCallback(() => {
    if (!git || !projectPath || !status) return;
    withAction('unstage-all', async () => {
      const result = await git.unstage(projectPath, status.staged);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, status, withAction]);

  const handleCommit = useCallback(() => {
    if (!git || !projectPath || !commitMessage.trim()) return;
    withAction('commit', async () => {
      const result = await git.commit(projectPath, commitMessage.trim());
      if (!result.success) throw new Error(result.error);
      setCommitMessage('');
    });
  }, [git, projectPath, commitMessage, withAction]);

  const handlePush = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('push', async () => {
      const result = await git.push(projectPath);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handlePull = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('pull', async () => {
      const result = await git.pull(projectPath);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleSync = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('sync', async () => {
      const pullResult = await git.pull(projectPath);
      if (!pullResult.success) throw new Error(pullResult.error);
      const pushResult = await git.push(projectPath);
      if (!pushResult.success) throw new Error(pushResult.error);
    });
  }, [git, projectPath, withAction]);

  const handleFetch = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('fetch', async () => {
      const result = await git.fetch(projectPath);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleCheckout = useCallback((branch: string) => {
    if (!git || !projectPath) return;
    setShowBranchDropdown(false);
    withAction('checkout', async () => {
      const result = await git.checkout(projectPath, branch);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, withAction]);

  const handleCreateBranch = useCallback(() => {
    if (!git || !projectPath || !newBranchName.trim()) return;
    setShowBranchDropdown(false);
    setIsCreatingBranch(false);
    const name = newBranchName.trim();
    setNewBranchName('');
    withAction('create-branch', async () => {
      const result = await git.createBranch(projectPath, name);
      if (!result.success) throw new Error(result.error);
    });
  }, [git, projectPath, newBranchName, withAction]);

  const handleInitRepo = useCallback(() => {
    if (!git || !projectPath) return;
    withAction('init', async () => {
      const result = await git.init(projectPath);
      if (!result.success) throw new Error(result.error);
      setIsRepo(true);
    });
  }, [git, projectPath, withAction]);

  const handleViewDiff = useCallback(async (file: string, staged: boolean) => {
    if (!git || !projectPath) return;
    if (diffPreview?.file === file && diffPreview?.staged === staged) {
      setDiffPreview(null);
      return;
    }
    try {
      const result = await git.diffFile(projectPath, file, staged);
      setDiffPreview({ file, diff: result.diff || '(no diff available)', staged });
    } catch {
      setDiffPreview({ file, diff: '(error loading diff)', staged });
    }
  }, [git, projectPath, diffPreview]);

  const handleToggleLog = useCallback(async () => {
    if (showLog) {
      setShowLog(false);
      return;
    }
    if (!git || !projectPath) return;
    try {
      const result = await git.log(projectPath, 20);
      setLogEntries(result.commits || []);
      setShowLog(true);
    } catch {
      setLogEntries([]);
      setShowLog(true);
    }
  }, [git, projectPath, showLog]);

  const toggleSection = useCallback((section: ChangeSection) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  if (!window.electronAPI) {
    return (
      <div className="git-panel">
        <div className="git-panel-header">
          <span className="git-panel-title">Source Control</span>
        </div>
        <div className="git-panel-empty">Git requires Electron</div>
      </div>
    );
  }

  if (!projectPath) {
    return (
      <div className="git-panel">
        <div className="git-panel-header">
          <span className="git-panel-title">Source Control</span>
        </div>
        <div className="git-panel-empty">Open a folder to use source control</div>
      </div>
    );
  }

  if (isRepo === false) {
    return (
      <div className="git-panel">
        <div className="git-panel-header">
          <span className="git-panel-title">Source Control</span>
        </div>
        <div className="git-panel-empty">
          <p>This folder is not a git repository.</p>
          <button className="btn btn-primary btn-sm" onClick={handleInitRepo} style={{ marginTop: 12 }}>
            Initialize Repository
          </button>
        </div>
      </div>
    );
  }

  if (isRepo === null || !status) {
    return (
      <div className="git-panel">
        <div className="git-panel-header">
          <span className="git-panel-title">Source Control</span>
        </div>
        <div className="git-panel-empty">
          <RefreshCw size={16} className="loading-spinner" /> Loading...
        </div>
      </div>
    );
  }

  const stagedFiles = status.staged;
  const modifiedFiles = [...status.modified, ...status.deleted];
  const untrackedFiles = [...status.not_added, ...status.created];
  const totalChanges = stagedFiles.length + modifiedFiles.length + untrackedFiles.length;
  const hasConflicts = status.conflicted.length > 0;

  return (
    <div className="git-panel">
      {/* Header */}
      <div className="git-panel-header">
        <span className="git-panel-title">Source Control</span>
        <div className="git-panel-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setIsLoading(true); refreshStatus().finally(() => setIsLoading(false)); }}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'loading-spinner' : ''} />
          </button>
        </div>
      </div>

      <div className="git-panel-content">
        {/* Error banner */}
        {error && (
          <div className="git-error-banner" onClick={clearError}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Branch bar */}
        <div className="git-branch-bar" ref={branchDropdownRef}>
          <button
            className="git-branch-button"
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            title="Switch branch"
          >
            <GitBranch size={14} />
            <span className="git-branch-name">{currentBranch || 'HEAD'}</span>
            {(status.ahead > 0 || status.behind > 0) && (
              <span className="git-branch-sync-info">
                {status.ahead > 0 && <span className="git-ahead">{status.ahead}↑</span>}
                {status.behind > 0 && <span className="git-behind">{status.behind}↓</span>}
              </span>
            )}
            <ChevronDown size={12} />
          </button>

          {showBranchDropdown && (
            <div className="git-branch-dropdown">
              {!isCreatingBranch ? (
                <>
                  <button
                    className="git-branch-dropdown-item git-branch-new"
                    onClick={() => setIsCreatingBranch(true)}
                  >
                    <Plus size={14} />
                    <span>Create new branch...</span>
                  </button>
                  <div className="git-branch-dropdown-divider" />
                  {branches.map(branch => (
                    <button
                      key={branch}
                      className={`git-branch-dropdown-item ${branch === currentBranch ? 'active' : ''}`}
                      onClick={() => handleCheckout(branch)}
                      disabled={branch === currentBranch}
                    >
                      {branch === currentBranch && <Check size={14} />}
                      <span>{branch}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="git-branch-create-input">
                  <input
                    type="text"
                    placeholder="Branch name"
                    value={newBranchName}
                    onChange={e => setNewBranchName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateBranch();
                      if (e.key === 'Escape') { setIsCreatingBranch(false); setNewBranchName(''); }
                    }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                    Create
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conflicts warning */}
        {hasConflicts && (
          <div className="git-conflicts-banner">
            <AlertCircle size={14} />
            <span>{status.conflicted.length} conflicted file{status.conflicted.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Commit section */}
        <div className="git-commit-section">
          <textarea
            className="git-commit-input"
            placeholder="Commit message"
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleCommit();
              }
            }}
            rows={3}
          />
          <button
            className="btn btn-primary git-commit-btn"
            onClick={handleCommit}
            disabled={!commitMessage.trim() || stagedFiles.length === 0 || !!actionInProgress}
            title={stagedFiles.length === 0 ? 'Stage changes before committing' : 'Commit (⌘+Enter)'}
          >
            {actionInProgress === 'commit' ? (
              <RefreshCw size={14} className="loading-spinner" />
            ) : (
              <Check size={14} />
            )}
            Commit
          </button>
        </div>

        {/* Action buttons */}
        <div className="git-actions-row">
          <button
            className="btn btn-ghost btn-sm git-action-btn"
            onClick={handlePush}
            disabled={!!actionInProgress}
            title="Push"
          >
            <Upload size={14} />
            Push
            {status.ahead > 0 && <span className="git-action-badge">{status.ahead}</span>}
          </button>
          <button
            className="btn btn-ghost btn-sm git-action-btn"
            onClick={handlePull}
            disabled={!!actionInProgress}
            title="Pull"
          >
            <Download size={14} />
            Pull
            {status.behind > 0 && <span className="git-action-badge">{status.behind}</span>}
          </button>
          <button
            className="btn btn-ghost btn-sm git-action-btn"
            onClick={handleSync}
            disabled={!!actionInProgress}
            title="Sync (Pull + Push)"
          >
            <ArrowUpDown size={14} />
            Sync
          </button>
          <button
            className="btn btn-ghost btn-sm git-action-btn"
            onClick={handleFetch}
            disabled={!!actionInProgress}
            title="Fetch"
          >
            <Download size={14} />
            Fetch
          </button>
        </div>

        {/* Staged Changes */}
        <ChangesSectionHeader
          title="Staged Changes"
          count={stagedFiles.length}
          expanded={expandedSections.has('staged')}
          onToggle={() => toggleSection('staged')}
          actions={
            stagedFiles.length > 0 ? (
              <button className="btn btn-ghost btn-sm" onClick={handleUnstageAll} title="Unstage All">
                <Minus size={12} />
              </button>
            ) : null
          }
        />
        {expandedSections.has('staged') && (
          <div className="git-changes-list">
            {stagedFiles.length === 0 ? (
              <div className="git-changes-empty">No staged changes</div>
            ) : (
              stagedFiles.map(file => (
                <ChangeFileRow
                  key={`staged-${file}`}
                  file={file}
                  type="staged"
                  onUnstage={() => handleUnstageFile(file)}
                  onViewDiff={() => handleViewDiff(file, true)}
                  isActive={diffPreview?.file === file && diffPreview?.staged}
                />
              ))
            )}
          </div>
        )}

        {/* Unstaged Changes */}
        <ChangesSectionHeader
          title="Changes"
          count={modifiedFiles.length}
          expanded={expandedSections.has('changes')}
          onToggle={() => toggleSection('changes')}
          actions={
            modifiedFiles.length > 0 ? (
              <button className="btn btn-ghost btn-sm" onClick={handleStageAll} title="Stage All">
                <Plus size={12} />
              </button>
            ) : null
          }
        />
        {expandedSections.has('changes') && (
          <div className="git-changes-list">
            {modifiedFiles.length === 0 ? (
              <div className="git-changes-empty">No changes</div>
            ) : (
              modifiedFiles.map(file => (
                <ChangeFileRow
                  key={`mod-${file}`}
                  file={file}
                  type={status.deleted.includes(file) ? 'deleted' : 'modified'}
                  onStage={() => handleStageFile(file)}
                  onDiscard={() => handleDiscardFile(file)}
                  onViewDiff={() => handleViewDiff(file, false)}
                  isActive={diffPreview?.file === file && !diffPreview?.staged}
                />
              ))
            )}
          </div>
        )}

        {/* Untracked Files */}
        <ChangesSectionHeader
          title="Untracked"
          count={untrackedFiles.length}
          expanded={expandedSections.has('untracked')}
          onToggle={() => toggleSection('untracked')}
          actions={
            untrackedFiles.length > 0 ? (
              <button className="btn btn-ghost btn-sm" onClick={handleStageAll} title="Stage All">
                <Plus size={12} />
              </button>
            ) : null
          }
        />
        {expandedSections.has('untracked') && (
          <div className="git-changes-list">
            {untrackedFiles.length === 0 ? (
              <div className="git-changes-empty">No untracked files</div>
            ) : (
              untrackedFiles.map(file => (
                <ChangeFileRow
                  key={`untracked-${file}`}
                  file={file}
                  type="untracked"
                  onStage={() => handleStageFile(file)}
                  onViewDiff={() => handleViewDiff(file, false)}
                  isActive={false}
                />
              ))
            )}
          </div>
        )}

        {/* Diff Preview */}
        {diffPreview && (
          <div className="git-diff-preview">
            <div className="git-diff-preview-header">
              <span>Diff: {diffPreview.file}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setDiffPreview(null)} title="Close diff">
                ×
              </button>
            </div>
            <pre className="git-diff-preview-content">{diffPreview.diff}</pre>
          </div>
        )}

        {/* Commit Log Toggle */}
        <div className="git-log-section">
          <button className="git-log-toggle" onClick={handleToggleLog}>
            <GitCommitHorizontal size={14} />
            <span>Commit History</span>
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showLog && (
            <div className="git-log-list">
              {logEntries.length === 0 ? (
                <div className="git-changes-empty">No commits yet</div>
              ) : (
                logEntries.map(entry => (
                  <div key={entry.hash} className="git-log-entry">
                    <span className="git-log-hash">{entry.hash}</span>
                    <span className="git-log-message">{entry.message}</span>
                    <span className="git-log-author">{entry.author}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Summary footer */}
        {totalChanges > 0 && (
          <div className="git-summary">
            {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            {stagedFiles.length > 0 && ` (${stagedFiles.length} staged)`}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

interface ChangesSectionHeaderProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
}

const ChangesSectionHeader: React.FC<ChangesSectionHeaderProps> = ({
  title, count, expanded, onToggle, actions,
}) => (
  <div className="git-section-header" onClick={onToggle}>
    <span className="git-section-chevron">
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </span>
    <span className="git-section-title">{title}</span>
    {count > 0 && <span className="git-section-badge">{count}</span>}
    {actions && <div className="git-section-actions" onClick={e => e.stopPropagation()}>{actions}</div>}
  </div>
);

interface ChangeFileRowProps {
  file: string;
  type: 'staged' | 'modified' | 'deleted' | 'untracked';
  onStage?: () => void;
  onUnstage?: () => void;
  onDiscard?: () => void;
  onViewDiff?: () => void;
  isActive?: boolean;
}

const ChangeFileRow: React.FC<ChangeFileRowProps> = ({
  file, type, onStage, onUnstage, onDiscard, onViewDiff, isActive,
}) => {
  const fileName = file.split('/').pop() || file;
  const dirPath = file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '';

  const typeIndicator = {
    staged: 'S',
    modified: 'M',
    deleted: 'D',
    untracked: 'U',
  }[type];

  const typeClass = `git-change-type-${type}`;

  return (
    <div className={`git-change-row ${isActive ? 'active' : ''}`}>
      <button className="git-change-row-content" onClick={onViewDiff} title={file}>
        <File size={14} className="git-change-file-icon" />
        <span className="git-change-filename">{fileName}</span>
        {dirPath && <span className="git-change-dirpath">{dirPath}</span>}
      </button>
      <span className={`git-change-indicator ${typeClass}`}>{typeIndicator}</span>
      <div className="git-change-actions">
        {onViewDiff && (
          <button className="btn btn-ghost btn-sm" onClick={onViewDiff} title="View Diff">
            <Eye size={12} />
          </button>
        )}
        {onStage && (
          <button className="btn btn-ghost btn-sm" onClick={onStage} title="Stage">
            <Plus size={12} />
          </button>
        )}
        {onUnstage && (
          <button className="btn btn-ghost btn-sm" onClick={onUnstage} title="Unstage">
            <Minus size={12} />
          </button>
        )}
        {onDiscard && (
          <button className="btn btn-ghost btn-sm" onClick={onDiscard} title="Discard Changes">
            <Undo2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
