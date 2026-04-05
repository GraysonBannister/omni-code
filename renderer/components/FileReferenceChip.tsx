import React, { useCallback } from 'react';
import { X, Folder, FileText } from 'lucide-react';
import './FileReferenceChip.css';

export interface FileReference {
  path: string;
  name: string;
  isDirectory: boolean;
  extension?: string;
  content?: string;
}

interface FileReferenceChipProps {
  reference: FileReference;
  onRemove: () => void;
  onClick?: () => void;
  compact?: boolean;
  readonly?: boolean;
}

// Extension to color mapping
const EXTENSION_COLORS: Record<string, { bg: string; text: string }> = {
  ts: { bg: 'rgba(49, 120, 198, 0.15)', text: '#3178c6' },
  tsx: { bg: 'rgba(49, 120, 198, 0.15)', text: '#3178c6' },
  js: { bg: 'rgba(247, 223, 30, 0.15)', text: '#f7df1e' },
  jsx: { bg: 'rgba(247, 223, 30, 0.15)', text: '#f7df1e' },
  json: { bg: 'rgba(139, 139, 139, 0.15)', text: '#8b8b8b' },
  css: { bg: 'rgba(38, 77, 228, 0.15)', text: '#264de4' },
  scss: { bg: 'rgba(204, 102, 153, 0.15)', text: '#cc6699' },
  sass: { bg: 'rgba(204, 102, 153, 0.15)', text: '#cc6699' },
  html: { bg: 'rgba(227, 76, 38, 0.15)', text: '#e34c26' },
  htm: { bg: 'rgba(227, 76, 38, 0.15)', text: '#e34c26' },
  py: { bg: 'rgba(55, 118, 171, 0.15)', text: '#3776ab' },
  rs: { bg: 'rgba(222, 165, 132, 0.15)', text: '#dea584' },
  go: { bg: 'rgba(0, 173, 216, 0.15)', text: '#00add8' },
  java: { bg: 'rgba(176, 114, 25, 0.15)', text: '#b07219' },
  rb: { bg: 'rgba(204, 52, 45, 0.15)', text: '#cc342d' },
  php: { bg: 'rgba(79, 93, 149, 0.15)', text: '#4F5D95' },
  swift: { bg: 'rgba(255, 172, 69, 0.15)', text: '#ffac45' },
  kt: { bg: 'rgba(169, 123, 255, 0.15)', text: '#A97BFF' },
  md: { bg: 'rgba(8, 63, 161, 0.15)', text: '#083fa1' },
  mdx: { bg: 'rgba(8, 63, 161, 0.15)', text: '#083fa1' },
  yml: { bg: 'rgba(203, 23, 30, 0.15)', text: '#cb171e' },
  yaml: { bg: 'rgba(203, 23, 30, 0.15)', text: '#cb171e' },
  xml: { bg: 'rgba(0, 96, 172, 0.15)', text: '#0060ac' },
  svg: { bg: 'rgba(255, 177, 59, 0.15)', text: '#ffb13b' },
  sql: { bg: 'rgba(227, 140, 0, 0.15)', text: '#e38c00' },
  sh: { bg: 'rgba(137, 224, 81, 0.15)', text: '#89e051' },
  bash: { bg: 'rgba(137, 224, 81, 0.15)', text: '#89e051' },
  dart: { bg: 'rgba(0, 180, 171, 0.15)', text: '#00b4ab' },
};

function getExtensionColors(extension: string): { bg: string; text: string } {
  return EXTENSION_COLORS[extension.toLowerCase()] || {
    bg: 'rgba(107, 114, 128, 0.15)',
    text: '#6b7280',
  };
}

export const FileReferenceChip: React.FC<FileReferenceChipProps> = ({
  reference,
  onRemove,
  onClick,
  compact = false,
  readonly = false,
}) => {
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  }, [onRemove]);

  const colors = reference.isDirectory
    ? { bg: 'rgba(220, 182, 122, 0.15)', text: '#dcb67a' }
    : getExtensionColors(reference.extension || '');

  return (
    <div
      className={`file-reference-chip ${compact ? 'compact' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        backgroundColor: colors.bg,
        borderColor: `${colors.text}30`,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {reference.isDirectory ? (
        <Folder size={compact ? 12 : 14} style={{ color: colors.text }} />
      ) : (
        <FileText size={compact ? 12 : 14} style={{ color: colors.text }} />
      )}
      
      <span className="file-reference-chip-name" style={{ color: colors.text }}>
        {reference.name}
      </span>
      
      {!readonly && (
        <button
          className="file-reference-chip-remove"
          onClick={handleRemove}
          type="button"
          title="Remove reference"
        >
          <X size={compact ? 10 : 12} />
        </button>
      )}
    </div>
  );
};

interface FileReferenceChipRowProps {
  references: FileReference[];
  onRemove?: (reference: FileReference) => void;
  onClick?: (reference: FileReference) => void;
  compact?: boolean;
  maxChips?: number;
  readonly?: boolean;
}

export const FileReferenceChipRow: React.FC<FileReferenceChipRowProps> = ({
  references,
  onRemove,
  onClick,
  compact = false,
  maxChips = 5,
  readonly = false,
}) => {
  if (references.length === 0) return null;

  const displayRefs = references.slice(0, maxChips);
  const remainingCount = references.length - maxChips;

  return (
    <div className="file-reference-chip-row">
      {displayRefs.map((ref) => (
        <FileReferenceChip
          key={ref.path}
          reference={ref}
          onRemove={() => onRemove?.(ref)}
          onClick={() => onClick?.(ref)}
          compact={compact}
          readonly={readonly}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={`file-reference-chip-more ${compact ? 'compact' : ''}`}>
          +{remainingCount} more
        </div>
      )}
    </div>
  );
};

export default FileReferenceChip;
