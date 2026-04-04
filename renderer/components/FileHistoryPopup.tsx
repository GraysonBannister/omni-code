import React, { useCallback } from 'react';
import { X, ChevronUp, Pin, PinOff, FileText } from 'lucide-react';
import './FileHistoryPopup.css';

export interface FileHistoryItem {
  filePath: string;
  fileName: string;
  extension: string;
  changeType: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  messageId?: string;
}

interface FileHistoryPopupProps {
  files: FileHistoryItem[];
  isPinned?: boolean;
  onClose: () => void;
  onPinToggle?: (pinned: boolean) => void;
  onReviewFile?: (filePath: string, messageId?: string) => void;
  onReviewAll?: () => void;
}

// Extension to icon/color mapping (same as FileHistoryPanel)
const EXTENSION_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
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
  dart: { icon: 'DART', color: '#00b4ab', bgColor: 'rgba(0, 180, 171, 0.15)' },
  // Additional languages
  // Systems/Embedded
  zig: { icon: 'ZIG', color: '#f7a41d', bgColor: 'rgba(247, 164, 29, 0.15)' },
  nim: { icon: 'NIM', color: '#ffe953', bgColor: 'rgba(255, 233, 83, 0.15)' },
  cr: { icon: 'CR', color: '#000000', bgColor: 'rgba(0, 0, 0, 0.15)' },
  // Functional
  hs: { icon: 'HS', color: '#5e5086', bgColor: 'rgba(94, 80, 134, 0.15)' },
  lhs: { icon: 'HS', color: '#5e5086', bgColor: 'rgba(94, 80, 134, 0.15)' },
  clj: { icon: 'CLJ', color: '#db5855', bgColor: 'rgba(219, 88, 85, 0.15)' },
  cljs: { icon: 'CLJ', color: '#db5855', bgColor: 'rgba(219, 88, 85, 0.15)' },
  erl: { icon: 'ERL', color: '#b83998', bgColor: 'rgba(184, 57, 152, 0.15)' },
  hrl: { icon: 'ERL', color: '#b83998', bgColor: 'rgba(184, 57, 152, 0.15)' },
  ex: { icon: 'EX', color: '#6e4a7e', bgColor: 'rgba(110, 74, 126, 0.15)' },
  exs: { icon: 'EX', color: '#6e4a7e', bgColor: 'rgba(110, 74, 126, 0.15)' },
  ml: { icon: 'ML', color: '#ec5800', bgColor: 'rgba(236, 88, 0, 0.15)' },
  mli: { icon: 'ML', color: '#ec5800', bgColor: 'rgba(236, 88, 0, 0.15)' },
  // Scientific/Statistical
  r: { icon: 'R', color: '#276dc3', bgColor: 'rgba(39, 109, 195, 0.15)' },
  rmd: { icon: 'RMD', color: '#276dc3', bgColor: 'rgba(39, 109, 195, 0.15)' },
  jl: { icon: 'JL', color: '#9558b2', bgColor: 'rgba(149, 88, 178, 0.15)' },
  // JVM Languages
  scala: { icon: 'SC', color: '#c41d32', bgColor: 'rgba(196, 29, 50, 0.15)' },
  sc: { icon: 'SC', color: '#c41d32', bgColor: 'rgba(196, 29, 50, 0.15)' },
  groovy: { icon: 'GRV', color: '#4298b8', bgColor: 'rgba(66, 152, 184, 0.15)' },
  gvy: { icon: 'GRV', color: '#4298b8', bgColor: 'rgba(66, 152, 184, 0.15)' },
  // Scripting
  lua: { icon: 'LUA', color: '#000080', bgColor: 'rgba(0, 0, 128, 0.15)' },
  pl: { icon: 'PL', color: '#0298c3', bgColor: 'rgba(2, 152, 195, 0.15)' },
  pm: { icon: 'PL', color: '#0298c3', bgColor: 'rgba(2, 152, 195, 0.15)' },
  ps1: { icon: 'PS', color: '#012456', bgColor: 'rgba(1, 36, 86, 0.15)' },
  psm1: { icon: 'PS', color: '#012456', bgColor: 'rgba(1, 36, 86, 0.15)' },
  psd1: { icon: 'PS', color: '#012456', bgColor: 'rgba(1, 36, 86, 0.15)' },
  vim: { icon: 'VIM', color: '#019733', bgColor: 'rgba(1, 151, 51, 0.15)' },
  // Infrastructure/Config
  tf: { icon: 'TF', color: '#844fba', bgColor: 'rgba(132, 79, 186, 0.15)' },
  tfvars: { icon: 'TF', color: '#844fba', bgColor: 'rgba(132, 79, 186, 0.15)' },
  hcl: { icon: 'HCL', color: '#844fba', bgColor: 'rgba(132, 79, 186, 0.15)' },
  // Data/Schema
  graphql: { icon: 'GQL', color: '#e10098', bgColor: 'rgba(225, 0, 152, 0.15)' },
  gql: { icon: 'GQL', color: '#e10098', bgColor: 'rgba(225, 0, 152, 0.15)' },
  proto: { icon: 'PB', color: '#007d9c', bgColor: 'rgba(0, 125, 156, 0.15)' },
  // Additional extensions
  kts: { icon: 'KT', color: '#A97BFF', bgColor: 'rgba(169, 123, 255, 0.15)' },
  erb: { icon: 'RB', color: '#cc342d', bgColor: 'rgba(204, 52, 45, 0.15)' },
  fish: { icon: 'SH', color: '#89e051', bgColor: 'rgba(137, 224, 81, 0.15)' },
  sass: { icon: 'S', color: '#cc6699', bgColor: 'rgba(204, 102, 153, 0.15)' },
  txt: { icon: 'TXT', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
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
      className="file-history-popup-extension-badge"
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
  const handleClick = useCallback(() => {
    onClick?.(file);
  }, [file, onClick]);

  return (
    <div
      className={`file-history-popup-file-row ${file.changeType}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`Click to open ${file.filePath}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <ExtensionBadge extension={file.extension} />
      <span className="file-history-popup-file-name">
        {file.fileName}
      </span>
      <span className="file-history-popup-line-stats">
        {file.additions > 0 && (
          <span className="file-history-popup-additions">+{file.additions}</span>
        )}
        {file.deletions > 0 && (
          <span className="file-history-popup-deletions">-{file.deletions}</span>
        )}
        {file.additions === 0 && file.deletions === 0 && file.changeType === 'added' && (
          <span className="file-history-popup-additions">+0</span>
        )}
        {file.additions === 0 && file.deletions === 0 && file.changeType === 'deleted' && (
          <span className="file-history-popup-deletions">-0</span>
        )}
      </span>
    </div>
  );
}

export const FileHistoryPopup: React.FC<FileHistoryPopupProps> = ({
  files,
  isPinned = false,
  onClose,
  onPinToggle,
  onReviewFile,
  onReviewAll,
}) => {
  const handleReviewAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReviewAll?.();
  }, [onReviewAll]);

  const handlePinToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPinToggle?.(!isPinned);
  }, [isPinned, onPinToggle]);

  const handleFileClick = useCallback((file: FileHistoryItem) => {
    onReviewFile?.(file.filePath, file.messageId);
  }, [onReviewFile]);

  if (files.length === 0) {
    return null;
  }

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="file-history-popup">
      <div className="file-history-popup-header">
        <div className="file-history-popup-header-left">
          <ChevronUp className="file-history-popup-chevron" size={16} />
          <span className="file-history-popup-count">
            {files.length} File{files.length !== 1 ? 's' : ''}
          </span>
          {(totalAdditions > 0 || totalDeletions > 0) && (
            <span className="file-history-popup-total-stats">
              {totalAdditions > 0 && (
                <span className="file-history-popup-total-additions">+{totalAdditions}</span>
              )}
              {totalDeletions > 0 && (
                <span className="file-history-popup-total-deletions">-{totalDeletions}</span>
              )}
            </span>
          )}
        </div>
        <div className="file-history-popup-header-right">
          <button
            className="file-history-popup-review-btn"
            onClick={handleReviewAll}
            type="button"
          >
            Review
          </button>
          {onPinToggle && (
            <button
              className={`file-history-popup-pin-btn ${isPinned ? 'pinned' : ''}`}
              onClick={handlePinToggle}
              type="button"
              title={isPinned ? 'Unpin popup' : 'Pin popup'}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          )}
          <button
            className="file-history-popup-close-btn"
            onClick={onClose}
            type="button"
            title="Hide file history"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="file-history-popup-file-list">
        {files.map((file, index) => (
          <FileRow
            key={`${file.filePath}-${index}`}
            file={file}
            onClick={handleFileClick}
          />
        ))}
      </div>
    </div>
  );
};

export default FileHistoryPopup;
