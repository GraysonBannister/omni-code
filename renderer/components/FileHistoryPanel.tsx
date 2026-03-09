import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, FileText, FileCode, FileJson, FileType2, ScrollText, Layers } from 'lucide-react';
import './FileHistoryPanel.css';

export interface FileHistoryItem {
  filePath: string;
  fileName: string;
  extension: string;
  changeType: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  messageId?: string;
}

interface FileHistoryPanelProps {
  files: FileHistoryItem[];
  title?: string;
  defaultExpanded?: boolean;
  onReviewFile?: (filePath: string, messageId?: string) => void;
  onReviewAll?: () => void;
  showReviewButton?: boolean;
  className?: string;
}

// Extension to icon/color mapping
const EXTENSION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  ts: { icon: 'TS', color: '#3178c6', bgColor: 'rgba(49, 120, 198, 0.15)' },
  tsx: { icon: 'TSX', color: '#3178c6', bgColor: 'rgba(49, 120, 198, 0.15)' },
  js: { icon: 'JS', color: '#f7df1e', bgColor: 'rgba(247, 223, 30, 0.15)' },
  jsx: { icon: 'JSX', color: '#f7df1e', bgColor: 'rgba(247, 223, 30, 0.15)' },
  json: { icon: '{}', color: '#8b8b8b', bgColor: 'rgba(139, 139, 139, 0.15)' },
  css: { icon: '#', color: '#264de4', bgColor: 'rgba(38, 77, 228, 0.15)' },
  scss: { icon: 'S', color: '#cc6699', bgColor: 'rgba(204, 102, 153, 0.15)' },
  sass: { icon: 'S', color: '#cc6699', bgColor: 'rgba(204, 102, 153, 0.15)' },
  html: { icon: '</>', color: '#e34c26', bgColor: 'rgba(227, 76, 38, 0.15)' },
  htm: { icon: '</>', color: '#e34c26', bgColor: 'rgba(227, 76, 38, 0.15)' },
  py: { icon: 'PY', color: '#3776ab', bgColor: 'rgba(55, 118, 171, 0.15)' },
  rs: { icon: 'RS', color: '#dea584', bgColor: 'rgba(222, 165, 132, 0.15)' },
  go: { icon: 'GO', color: '#00add8', bgColor: 'rgba(0, 173, 216, 0.15)' },
  java: { icon: 'JV', color: '#b07219', bgColor: 'rgba(176, 114, 25, 0.15)' },
  rb: { icon: 'RB', color: '#cc342d', bgColor: 'rgba(204, 52, 45, 0.15)' },
  php: { icon: 'PHP', color: '#4F5D95', bgColor: 'rgba(79, 93, 149, 0.15)' },
  swift: { icon: 'SW', color: '#ffac45', bgColor: 'rgba(255, 172, 69, 0.15)' },
  kt: { icon: 'KT', color: '#A97BFF', bgColor: 'rgba(169, 123, 255, 0.15)' },
  md: { icon: 'MD', color: '#083fa1', bgColor: 'rgba(8, 63, 161, 0.15)' },
  mdx: { icon: 'MDX', color: '#083fa1', bgColor: 'rgba(8, 63, 161, 0.15)' },
  yml: { icon: 'YML', color: '#cb171e', bgColor: 'rgba(203, 23, 30, 0.15)' },
  yaml: { icon: 'YML', color: '#cb171e', bgColor: 'rgba(203, 23, 30, 0.15)' },
  xml: { icon: 'XML', color: '#0060ac', bgColor: 'rgba(0, 96, 172, 0.15)' },
  svg: { icon: 'SVG', color: '#ffb13b', bgColor: 'rgba(255, 177, 59, 0.15)' },
  sql: { icon: 'SQL', color: '#e38c00', bgColor: 'rgba(227, 140, 0, 0.15)' },
  sh: { icon: 'SH', color: '#89e051', bgColor: 'rgba(137, 224, 81, 0.15)' },
  bash: { icon: 'SH', color: '#89e051', bgColor: 'rgba(137, 224, 81, 0.15)' },
  zsh: { icon: 'SH', color: '#89e051', bgColor: 'rgba(137, 224, 81, 0.15)' },
  dockerfile: { icon: 'DOCKER', color: '#2496ed', bgColor: 'rgba(36, 150, 237, 0.15)' },
  vue: { icon: 'VUE', color: '#41b883', bgColor: 'rgba(65, 184, 131, 0.15)' },
  svelte: { icon: 'SV', color: '#ff3e00', bgColor: 'rgba(255, 62, 0, 0.15)' },
};

function getExtensionConfig(extension: string): { icon: string; color: string; bgColor: string } {
  return EXTENSION_CONFIG[extension.toLowerCase()] || {
    icon: extension.toUpperCase() || 'TXT',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
  };
}

function ExtensionBadge({ extension }: { extension: string }) {
  const config = getExtensionConfig(extension);

  return (
    <span
      className="extension-badge"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {config.icon}
    </span>
  );
}

function FileRow({
  file,
  onClick,
}: {
  file: FileHistoryItem;
  onClick?: (file: FileHistoryItem) => void;
}) {
  const handleClick = () => {
    onClick?.(file);
  };

  return (
    <div
      className={`file-row ${file.changeType}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <ExtensionBadge extension={file.extension} />
      <span className="file-name" title={file.filePath}>
        {file.fileName}
      </span>
      <span className="line-stats">
        {file.additions > 0 && (
          <span className="additions">+{file.additions}</span>
        )}
        {file.deletions > 0 && (
          <span className="deletions">-{file.deletions}</span>
        )}
        {file.additions === 0 && file.deletions === 0 && file.changeType === 'added' && (
          <span className="additions">+0</span>
        )}
        {file.additions === 0 && file.deletions === 0 && file.changeType === 'deleted' && (
          <span className="deletions">-0</span>
        )}
      </span>
    </div>
  );
}

export const FileHistoryPanel: React.FC<FileHistoryPanelProps> = ({
  files,
  title,
  defaultExpanded = true,
  onReviewFile,
  onReviewAll,
  showReviewButton = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Reset expanded state when files change significantly
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [files.length, defaultExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReviewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReviewAll?.();
  };

  const handleFileClick = (file: FileHistoryItem) => {
    onReviewFile?.(file.filePath, file.messageId);
  };

  if (files.length === 0) {
    return null;
  }

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const displayTitle = title || `${files.length} File${files.length !== 1 ? 's' : ''}`;

  return (
    <div className={`file-history-panel ${className}`}>
      <div
        className={`file-history-header ${isExpanded ? 'expanded' : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="header-left">
          {isExpanded ? (
            <ChevronDown className="chevron-icon" size={16} />
          ) : (
            <ChevronRight className="chevron-icon" size={16} />
          )}
          <span className="file-count">{displayTitle}</span>
          {(totalAdditions > 0 || totalDeletions > 0) && (
            <span className="total-stats">
              {totalAdditions > 0 && (
                <span className="total-additions">+{totalAdditions}</span>
              )}
              {totalDeletions > 0 && (
                <span className="total-deletions">-{totalDeletions}</span>
              )}
            </span>
          )}
        </div>
        {showReviewButton && (
          <button
            className="review-button"
            onClick={handleReviewAll}
            type="button"
          >
            Review
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="file-list">
          {files.map((file, index) => (
            <FileRow
              key={`${file.filePath}-${index}`}
              file={file}
              onClick={handleFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileHistoryPanel;
