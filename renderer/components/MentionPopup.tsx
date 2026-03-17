import React, { useCallback, useMemo } from 'react';
import { Folder, FileText, ChevronUp, ChevronDown, CornerDownLeft } from 'lucide-react';
import './MentionPopup.css';

export interface MentionFile {
  path: string;
  name: string;
  isDirectory: boolean;
  extension?: string;
}

interface MentionPopupProps {
  files: MentionFile[];
  query: string;
  highlightedIndex: number;
  onSelect: (file: MentionFile) => void;
  onClose: () => void;
}

// Extension to icon/color mapping (same pattern as FileHistoryPopup)
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
  txt: { icon: 'TXT', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
};

function getExtensionConfig(extension: string): { icon: string; color: string; bgColor: string } {
  return EXTENSION_CONFIG[extension.toLowerCase()] || {
    icon: extension.toUpperCase() || 'FILE',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
  };
}

function ExtensionBadge({ extension }: { extension: string }) {
  const config = getExtensionConfig(extension);

  return (
    <span
      className="mention-popup-extension-badge"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {config.icon}
    </span>
  );
}

interface MentionItemProps {
  file: MentionFile;
  isHighlighted: boolean;
  query: string;
  onClick: () => void;
}

function HighlightedText({ text, query, className }: { text: string; query: string; className?: string }) {
  if (!query) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="mention-popup-highlight">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function MentionItem({ file, isHighlighted, query, onClick }: MentionItemProps) {
  return (
    <div
      className={`mention-popup-item ${isHighlighted ? 'highlighted' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {file.isDirectory ? (
        <Folder size={18} className="mention-popup-folder-icon" />
      ) : (
        <FileText size={18} className="mention-popup-file-icon" />
      )}
      
      <div className="mention-popup-item-content">
        <HighlightedText 
          text={file.name} 
          query={query}
          className="mention-popup-item-name"
        />
        <span className="mention-popup-item-path">{file.path}</span>
      </div>
      
      {file.isDirectory ? (
        <span className="mention-popup-folder-badge">folder</span>
      ) : file.extension ? (
        <ExtensionBadge extension={file.extension} />
      ) : null}
    </div>
  );
}

export const MentionPopup: React.FC<MentionPopupProps> = ({
  files,
  query,
  highlightedIndex,
  onSelect,
  onClose,
}) => {
  const handleFileClick = useCallback((file: MentionFile) => {
    onSelect(file);
  }, [onSelect]);

  const keyboardHints = useMemo(() => [
    { icon: <ChevronUp size={12} />, label: '' },
    { icon: <ChevronDown size={12} />, label: 'navigate' },
    { icon: <CornerDownLeft size={12} />, label: 'select' },
  ], []);

  if (files.length === 0) {
    return (
      <div className="mention-popup">
        <div className="mention-popup-header">
          <span className="mention-popup-count">No files found</span>
        </div>
        <div className="mention-popup-empty">
          No files matching &quot;{query}&quot;
        </div>
      </div>
    );
  }

  return (
    <div className="mention-popup">
      <div className="mention-popup-header">
        <div className="mention-popup-header-left">
          <span className="mention-popup-count">
            {files.length} file{files.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <div className="mention-popup-header-right">
          {keyboardHints.map((hint, index) => (
            <span key={index} className="mention-popup-keyboard-hint">
              <kbd className="mention-popup-kbd">{hint.icon}</kbd>
              {hint.label && <span className="mention-popup-hint-label">{hint.label}</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mention-popup-list">
        {files.map((file, index) => (
          <MentionItem
            key={`${file.path}-${index}`}
            file={file}
            isHighlighted={index === highlightedIndex}
            query={query}
            onClick={() => handleFileClick(file)}
          />
        ))}
      </div>
    </div>
  );
};

export default MentionPopup;
