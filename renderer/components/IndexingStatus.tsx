/**
 * IndexingStatus Component
 *
 * Displays the current indexing status in the status bar.
 * Shows progress bar, file count, and semantic search readiness.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useAppStore, type IndexingStatus as IndexingStateType } from '../stores/appStore';
import './IndexingStatus.css';

export const IndexingStatus: React.FC = () => {
  const {
    indexingState,
    projectPath,
    reindexProject,
    refreshIndexingState,
  } = useAppStore();

  const [showTooltip, setShowTooltip] = useState(false);

  // Poll for indexing state when indexing is active
  useEffect(() => {
    if (indexingState.status === 'indexing') {
      const interval = setInterval(() => {
        refreshIndexingState();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [indexingState.status, refreshIndexingState]);

  const handleReindex = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await reindexProject();
  }, [reindexProject]);

  const handleRefresh = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshIndexingState();
  }, [refreshIndexingState]);

  // Don't show anything if no project is open
  if (!projectPath) {
    return null;
  }

  // Don't show if idle and no previous index
  if (indexingState.status === 'idle' && indexingState.progress === 0) {
    return null;
  }

  const getStatusIcon = () => {
    switch (indexingState.status) {
      case 'indexing':
        return <RefreshCw size={12} className="indexing-status-icon spinning" />;
      case 'complete':
        return <CheckCircle size={12} className="indexing-status-icon complete" />;
      case 'error':
        return <AlertCircle size={12} className="indexing-status-icon error" />;
      default:
        return <Database size={12} className="indexing-status-icon" />;
    }
  };

  const getStatusText = () => {
    switch (indexingState.status) {
      case 'indexing':
        return `Indexing ${indexingState.progress}%`;
      case 'complete':
        return 'Index ready';
      case 'error':
        return 'Index error';
      case 'paused':
        return 'Indexing paused';
      default:
        return 'Index idle';
    }
  };

  const getTooltipContent = () => {
    const lines: string[] = [];

    lines.push(`Status: ${indexingState.status}`);

    if (indexingState.status === 'indexing') {
      lines.push(`Progress: ${indexingState.processedFiles} / ${indexingState.totalFiles} files`);
      lines.push(`${indexingState.indexedChunks} chunks indexed`);
      lines.push(`${indexingState.progress}% complete`);
    } else if (indexingState.status === 'complete') {
      lines.push(`${indexingState.processedFiles} files indexed`);
      lines.push(`${indexingState.indexedChunks} chunks in index`);
      if (indexingState.lastSyncAt) {
        const date = new Date(indexingState.lastSyncAt);
        lines.push(`Last sync: ${date.toLocaleTimeString()}`);
      }
    }

    if (indexingState.isSemanticSearchReady) {
      lines.push('Semantic search: Available');
    } else if (indexingState.status === 'indexing') {
      lines.push('Semantic search: Building (80% needed)...');
    }

    if (indexingState.lastError) {
      lines.push(`Error: ${indexingState.lastError}`);
    }

    return lines.join('\n');
  };

  return (
    <div
      className="indexing-status"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="indexing-status-content">
        {getStatusIcon()}
        <span className="indexing-status-text">{getStatusText()}</span>

        {/* Progress bar when indexing */}
        {indexingState.status === 'indexing' && (
          <div className="indexing-progress-container">
            <div
              className="indexing-progress-bar"
              style={{ width: `${indexingState.progress}%` }}
            />
          </div>
        )}

        {/* Semantic search indicator */}
        {indexingState.isSemanticSearchReady && (
          <Search size={10} className="semantic-search-indicator" title="Semantic search ready" />
        )}

        {/* Action buttons */}
        {indexingState.status === 'complete' && (
          <button
            className="indexing-action-btn"
            onClick={handleReindex}
            title="Reindex project"
          >
            <RefreshCw size={10} />
          </button>
        )}

        {indexingState.status === 'error' && (
          <button
            className="indexing-action-btn"
            onClick={handleRefresh}
            title="Refresh status"
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="indexing-tooltip">
          <pre>{getTooltipContent()}</pre>
          {indexingState.status === 'complete' && (
            <div className="indexing-tooltip-actions">
              <button onClick={handleReindex}>
                <RefreshCw size={12} /> Reindex
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
