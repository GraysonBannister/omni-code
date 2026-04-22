import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  RefreshCw, FolderOpen as FolderOpenIcon, FilePlus, FolderPlus,
  Copy, Eye, Pencil, Trash2, Terminal,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { FileIcon } from './FileIcon';
import './FileExplorer.css';

interface FileNodeProps {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
  projectPath: string;
  selectedFolderPath?: string | null;
  onSelectFolder?: (path: string) => void;
  isCreatingFile?: boolean;
  isCreatingFolder?: boolean;
  newItemName?: string;
  setNewItemName?: (name: string) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  onRefresh: () => void;
  onStartCreate: (type: 'file' | 'folder', targetPath: string) => void;
  // Drag and drop props
  draggedPath: string | null;
  setDraggedPath: (path: string | null) => void;
  dragOverPath: string | null;
  setDragOverPath: (path: string | null) => void;
  onMoveItem: (sourcePath: string, targetPath: string) => Promise<void>;
  // Multi-selection props
  selectedPaths: Set<string>;
  onSelectPath: (path: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  lastClickedPath: string | null;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}

const FileNode: React.FC<FileNodeProps> = ({
  name,
  path,
  isDirectory,
  depth,
  projectPath,
  selectedFolderPath,
  onSelectFolder,
  isCreatingFile,
  isCreatingFolder,
  newItemName,
  setNewItemName,
  handleKeyDown,
  onRefresh,
  onStartCreate,
  // Drag and drop
  draggedPath,
  setDraggedPath,
  dragOverPath,
  setDragOverPath,
  onMoveItem,
  // Multi-selection
  selectedPaths,
  onSelectPath,
  lastClickedPath,
  onDeleteSelected,
  onClearSelection,
}) => {
  const { expandedDirs, toggleDir, openFile, activeFilePath, files } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedDirs.has(path) || ((isCreatingFile || isCreatingFolder) && selectedFolderPath === path);
  const isActiveFile = activeFilePath === path;
  const isSelectedFolder = selectedFolderPath === path;
  const isSelected = selectedPaths.has(path);
  const showCreateInput = (isCreatingFile || isCreatingFolder) && selectedFolderPath === path;

  // Scroll into view when this file becomes active
  // Small delay to allow parent directory expansion to complete first
  useEffect(() => {
    if (isActiveFile && nodeRef.current && !isDirectory) {
      setTimeout(() => {
        nodeRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    }
  }, [isActiveFile, isDirectory]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const isMultiSelect = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Windows/Linux
    const isRangeSelect = e.shiftKey;

    if (isMultiSelect || isRangeSelect) {
      // Multi-selection mode - don't open file, just select
      e.preventDefault();
      e.stopPropagation();
      onSelectPath(path, isMultiSelect, isRangeSelect);
    } else if (isDirectory) {
      // Normal folder click - select folder for creation and toggle expansion
      if (onSelectFolder) onSelectFolder(path);
      toggleDir(path);
      if (!isExpanded) {
        const { loadDirectory } = useAppStore.getState();
        console.log('[FileNode] Loading directory on expand:', path);
        loadDirectory(path);
      }
      // Also select the path in multi-selection (single selection mode)
      onSelectPath(path, false, false);
    } else {
      // Normal file click - open file and select
      console.log('[FileNode] Opening file:', path);
      openFile(path);
      onSelectPath(path, false, false);
    }
  }, [isDirectory, path, isExpanded, toggleDir, openFile, onSelectFolder, onSelectPath]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[FileNode] Context menu triggered for:', path, 'isDirectory:', isDirectory);
    if (isDirectory && onSelectFolder) onSelectFolder(path);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [path, isDirectory, onSelectFolder]);

  const handleRename = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === name) {
      setIsRenaming(false);
      setRenameValue(name);
      return;
    }
    const parentDir = path.substring(0, path.lastIndexOf('/'));
    const newPath = `${parentDir}/${trimmed}`;
    console.log('[FileNode] Renaming:', path, '->', newPath);
    const result = await window.electronAPI!.file.rename(path, newPath);
    console.log('[FileNode] Rename result:', result);
    if (result.success) {
      onRefresh();
    } else {
      alert(`Rename failed: ${result.error}`);
      setRenameValue(name);
    }
    setIsRenaming(false);
  }, [path, name, renameValue, onRefresh]);

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;
    console.log('[FileNode] Deleting:', path);
    const result = await window.electronAPI!.file.delete(path);
    console.log('[FileNode] Delete result:', result);
    if (result.success) {
      onRefresh();
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  }, [path, name, onRefresh]);

  const handleRevealInFinder = useCallback(async () => {
    console.log('[FileNode] Revealing in Finder:', path);
    const result = await window.electronAPI!.file.revealInFinder(path);
    console.log('[FileNode] Reveal result:', result);
    if (!result.success) alert(`Could not reveal: ${result.error}`);
  }, [path]);

  const handleCopyPath = useCallback(async (type: 'full' | 'relative') => {
    console.log('[FileNode] Copying path:', path, 'type:', type);
    const result = await window.electronAPI!.file.copyPath(path, type, projectPath);
    console.log('[FileNode] Copy path result:', result);
    if (!result.success) alert(`Could not copy path: ${result.error}`);
  }, [path, projectPath]);

  // Drag and drop handlers
  const isDescendant = useCallback((parentPath: string, childPath: string): boolean => {
    return childPath.startsWith(parentPath + '/');
  }, []);

  const isValidDropTarget = useCallback((dragPath: string, dropPath: string): boolean => {
    // Cannot drop onto itself
    if (dragPath === dropPath) return false;
    // Cannot drop a folder into itself or its descendants
    if (isDirectory && isDescendant(dragPath, dropPath)) return false;
    // Cannot drop into same parent (no-op)
    const dragParent = dragPath.substring(0, dragPath.lastIndexOf('/'));
    const dropParent = isDirectory ? dropPath : dropPath.substring(0, dropPath.lastIndexOf('/'));
    if (dragParent === dropParent && !isDirectory) return false;
    return true;
  }, [isDirectory, isDescendant]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPath(path);
    setIsDragging(true);
    console.log('[FileNode] Drag started:', path);
  }, [path, setDraggedPath]);

  const handleDragEnd = useCallback(() => {
    setDraggedPath(null);
    setIsDragging(false);
    setDragOverPath(null);
    setIsDragOver(false);
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    console.log('[FileNode] Drag ended');
  }, [setDraggedPath, setDragOverPath]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedPath || draggedPath === path) return;

    if (isValidDropTarget(draggedPath, path)) {
      setDragOverPath(path);
      setIsDragOver(true);

      // Auto-expand folder after hovering for 500ms
      if (isDirectory && !expandedDirs.has(path) && !expandTimeoutRef.current) {
        expandTimeoutRef.current = setTimeout(() => {
          toggleDir(path);
          const { loadDirectory } = useAppStore.getState();
          loadDirectory(path);
          expandTimeoutRef.current = null;
        }, 500);
      }
    }
  }, [draggedPath, path, isDirectory, expandedDirs, toggleDir, isValidDropTarget, setDragOverPath]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the node (not entering a child)
    if (!nodeRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      if (dragOverPath === path) {
        setDragOverPath(null);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }
    }
  }, [dragOverPath, path, setDragOverPath]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sourcePath = e.dataTransfer.getData('text/plain') || draggedPath;
    if (!sourcePath || sourcePath === path || !isValidDropTarget(sourcePath, path)) {
      handleDragEnd();
      return;
    }

    console.log('[FileNode] Dropping:', sourcePath, 'onto', path);

    // Calculate destination path
    let destinationPath: string;
    if (isDirectory) {
      // Drop into folder
      const itemName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
      destinationPath = `${path}/${itemName}`;
    } else {
      // Drop onto file - move to same folder as target file
      const targetParent = path.substring(0, path.lastIndexOf('/'));
      const itemName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
      destinationPath = `${targetParent}/${itemName}`;
    }

    // Check if destination already exists
    if (sourcePath !== destinationPath) {
      await onMoveItem(sourcePath, destinationPath);
    }

    handleDragEnd();
  }, [draggedPath, path, isDirectory, isValidDropTarget, onMoveItem, handleDragEnd]);

  const buildContextMenuItems = (): ContextMenuItem[] => {
    const divider: ContextMenuItem = { id: 'divider', label: '', divider: true };

    // Check if we have multiple items selected
    const hasMultiSelection = selectedPaths.size > 1 && selectedPaths.has(path);

    if (hasMultiSelection) {
      // Multi-selection context menu
      return [
        {
          id: 'delete-selected',
          label: `Delete ${selectedPaths.size} Items`,
          icon: <Trash2 size={14} />,
          action: () => {
            console.log('[FileNode] Context: Delete selected', selectedPaths.size, 'items');
            onDeleteSelected?.();
          },
        },
        divider,
        {
          id: 'clear-selection',
          label: 'Clear Selection',
          icon: <Eye size={14} />,
          shortcut: 'Esc',
          action: () => {
            console.log('[FileNode] Context: Clear selection');
            onClearSelection?.();
          },
        },
      ];
    }

    if (isDirectory) {
      return [
        {
          id: 'new-file',
          label: 'New File...',
          icon: <FilePlus size={14} />,
          action: () => {
            console.log('[FileNode] Context: New File in', path);
            onStartCreate('file', path);
          },
        },
        {
          id: 'new-folder',
          label: 'New Folder...',
          icon: <FolderPlus size={14} />,
          action: () => {
            console.log('[FileNode] Context: New Folder in', path);
            onStartCreate('folder', path);
          },
        },
        divider,
        {
          id: 'copy-path',
          label: 'Copy Path',
          icon: <Copy size={14} />,
          shortcut: '⌥⌘C',
          action: () => handleCopyPath('full'),
        },
        {
          id: 'copy-rel-path',
          label: 'Copy Relative Path',
          icon: <Copy size={14} />,
          shortcut: '⌥⇧⌘C',
          action: () => handleCopyPath('relative'),
        },
        {
          id: 'reveal',
          label: 'Reveal in Finder',
          icon: <Eye size={14} />,
          shortcut: '⌥⌘R',
          action: handleRevealInFinder,
        },
        divider,
        {
          id: 'rename',
          label: 'Rename',
          icon: <Pencil size={14} />,
          action: () => {
            console.log('[FileNode] Context: Rename', path);
            setRenameValue(name);
            setIsRenaming(true);
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 size={14} />,
          action: handleDelete,
        },
      ];
    }

    // File
    const items: ContextMenuItem[] = [
      {
        id: 'open',
        label: 'Open',
        icon: <FileIcon filename={name} size={14} />,
        action: () => {
          console.log('[FileNode] Context: Open', path);
          openFile(path);
        },
      },
      divider,
      {
        id: 'copy-path',
        label: 'Copy Path',
        icon: <Copy size={14} />,
        shortcut: '⌥⌘C',
        action: () => handleCopyPath('full'),
      },
      {
        id: 'copy-rel-path',
        label: 'Copy Relative Path',
        icon: <Copy size={14} />,
        shortcut: '⌥⇧⌘C',
        action: () => handleCopyPath('relative'),
      },
      {
        id: 'reveal',
        label: 'Reveal in Finder',
        icon: <Eye size={14} />,
        shortcut: '⌥⌘R',
        action: handleRevealInFinder,
      },
      divider,
      {
        id: 'rename',
        label: 'Rename',
        icon: <Pencil size={14} />,
        action: () => {
          console.log('[FileNode] Context: Rename', path);
          setRenameValue(name);
          setIsRenaming(true);
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        action: handleDelete,
      },
    ];

    return items;
  };

  const childFiles = files.filter(f => {
    const parentDir = path;
    const fileDir = f.path.substring(0, f.path.lastIndexOf('/')) || f.path;
    return fileDir === parentDir && f.path !== path;
  });

  return (
    <div className="file-node">
      <div
        ref={nodeRef}
        className={`file-node-row ${isActiveFile ? 'active' : ''} ${isSelectedFolder ? 'selected-folder' : ''} ${isSelected ? 'multi-selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title={isDirectory ? 'Click to select folder, Cmd/Ctrl+Click for multi-select, Shift+Click for range select. Drag to move.' : `${path} - Cmd/Ctrl+Click for multi-select, Shift+Click for range select, Drag to move`}
      >
        <span className="file-node-icon">
          {isDirectory ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        <span className="file-node-icon">
          {isDirectory ? (
            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <FileIcon filename={name} size={16} />
          )}
        </span>
        {isRenaming ? (
          <input
            className="file-node-rename-input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setRenameValue(name);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="file-node-name">{name}</span>
        )}
      </div>

      {isDirectory && isExpanded && (
        <div className="file-node-children">
          {showCreateInput && (
            <div className="file-explorer-new-item" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
              <span className="file-node-icon">
                {isCreatingFile ? <FileIcon filename={newItemName || 'file'} size={16} /> : <Folder size={16} />}
              </span>
              <input
                type="text"
                className="file-explorer-new-item-input"
                value={newItemName}
                onChange={(e) => setNewItemName?.(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isCreatingFile ? 'filename.ext' : 'foldername'}
                autoFocus
              />
            </div>
          )}
          {childFiles.map((child) => (
            <FileNode
              key={child.path}
              name={child.name}
              path={child.path}
              isDirectory={child.isDirectory}
              depth={depth + 1}
              projectPath={projectPath}
              selectedFolderPath={selectedFolderPath}
              onSelectFolder={onSelectFolder}
              isCreatingFile={isCreatingFile}
              isCreatingFolder={isCreatingFolder}
              newItemName={newItemName}
              setNewItemName={setNewItemName}
              handleKeyDown={handleKeyDown}
              onRefresh={onRefresh}
              onStartCreate={onStartCreate}
              draggedPath={draggedPath}
              setDraggedPath={setDraggedPath}
              dragOverPath={dragOverPath}
              setDragOverPath={setDragOverPath}
              onMoveItem={onMoveItem}
              selectedPaths={selectedPaths}
              onSelectPath={onSelectPath}
              lastClickedPath={lastClickedPath}
              onDeleteSelected={onDeleteSelected}
              onClearSelection={onClearSelection}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const {
    projectPath,
    files,
    setProjectPath,
    openFolder,
    isWorkspaceMode,
    currentWorkspace,
    activeFolderId,
    setActiveFolder,
    loadDirectory,
    expandedDirs,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [rootContextMenu, setRootContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Drag and drop state
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  // Multi-selection state
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [lastClickedPath, setLastClickedPath] = useState<string | null>(null);

  // Clear selected folder and multi-selection when project path changes
  useEffect(() => {
    setSelectedFolderPath(null);
    setSelectedPaths(new Set());
    setLastClickedPath(null);
  }, [projectPath]);

  // Handle multi-selection of files/folders
  const handleSelectPath = useCallback((path: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    setSelectedPaths(prev => {
      const newSet = new Set(prev);

      if (isRangeSelect && lastClickedPath && lastClickedPath !== path) {
        // Range selection - select all files between last clicked and current
        // Get all visible file paths in order
        const allPaths = getAllVisiblePaths();
        const lastIndex = allPaths.indexOf(lastClickedPath);
        const currentIndex = allPaths.indexOf(path);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            newSet.add(allPaths[i]);
          }
        }
      } else if (isMultiSelect) {
        // Toggle selection
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
      } else {
        // Single selection - clear others
        newSet.clear();
        newSet.add(path);
      }

      return newSet;
    });

    setLastClickedPath(path);
  }, [lastClickedPath]);

  // Get all visible file paths in the tree order
  const getAllVisiblePaths = useCallback((): string[] => {
    const paths: string[] = [];

    const collectPaths = (parentPath: string) => {
      const children = files.filter(f => {
        const fileDir = f.path.substring(0, f.path.lastIndexOf('/')) || '';
        return fileDir === parentPath && f.path !== parentPath;
      });

      for (const child of children) {
        paths.push(child.path);
        if (child.isDirectory && expandedDirs.has(child.path)) {
          collectPaths(child.path);
        }
      }
    };

    if (projectPath) {
      collectPaths(projectPath);
    }

    return paths;
  }, [files, expandedDirs, projectPath]);

  // Handle deleting multiple selected files
  const handleDeleteSelected = useCallback(async () => {
    if (selectedPaths.size === 0) return;

    const confirmed = window.confirm(`Delete ${selectedPaths.size} item(s)? This cannot be undone.`);
    if (!confirmed) return;

    const pathsArray = Array.from(selectedPaths);
    const parentDirs = new Set<string>();

    for (const path of pathsArray) {
      console.log('[FileExplorer] Deleting:', path);
      const result = await window.electronAPI!.file.delete(path);
      if (result.success) {
        const parentDir = path.substring(0, path.lastIndexOf('/'));
        parentDirs.add(parentDir);
      } else {
        console.error('[FileExplorer] Delete failed:', result.error);
      }
    }

    // Refresh all affected directories
    const { loadDirectory } = useAppStore.getState();
    for (const dir of parentDirs) {
      await loadDirectory(dir);
    }

    setSelectedPaths(new Set());
  }, [selectedPaths]);

  // Clear selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPaths(new Set());
        setLastClickedPath(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-expand parent directories when activeFilePath changes, loading each directory
  // level sequentially so its children appear in the file tree before expanding further.
  const { activeFilePath } = useAppStore();
  useEffect(() => {
    if (!activeFilePath || !projectPath) return;

    const expandAndLoad = async () => {
      // Build parent paths from outermost to innermost so we can load them in order
      const pathSegments: string[] = [];
      let current = activeFilePath.substring(0, activeFilePath.lastIndexOf('/'));

      while (current && current.startsWith(projectPath) && current !== projectPath) {
        pathSegments.unshift(current); // unshift keeps outermost first
        const parentIndex = current.lastIndexOf('/');
        if (parentIndex <= 0) break;
        current = current.substring(0, parentIndex);
      }

      // Load and expand each directory from outermost to innermost.
      // loadDirectory must be awaited before moving inward so the children exist
      // in the files array when the next level tries to render.
      const { loadDirectory } = useAppStore.getState();
      for (const dirPath of pathSegments) {
        await loadDirectory(dirPath);
        const { expandedDirs } = useAppStore.getState();
        expandedDirs.add(dirPath);
        useAppStore.setState({ expandedDirs: new Set(expandedDirs) });
      }
    };

    expandAndLoad();
  }, [activeFilePath, projectPath]);

  // Auto-expand all projects when entering workspace mode
  useEffect(() => {
    if (isWorkspaceMode && currentWorkspace) {
      const allProjectIds = currentWorkspace.folders.map(f => f.id);
      setExpandedProjects(new Set(allProjectIds));
    } else {
      setExpandedProjects(new Set());
    }
  }, [isWorkspaceMode, currentWorkspace]);

  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.warn('[FileExplorer] window.electronAPI is not available');
    return (
      <div className="file-explorer">
        <div className="file-explorer-header">
          <span className="file-explorer-title">Explorer</span>
        </div>
        <div className="file-explorer-content">
          <div className="file-explorer-empty">
            File explorer requires Electron
          </div>
        </div>
      </div>
    );
  }

  // Load initial directory
  useEffect(() => {
    const loadInitialDir = async () => {
      console.log('[FileExplorer] loadInitialDir called, projectPath:', projectPath);
      if (!projectPath) {
        try {
          const result = await window.electronAPI!.config.getCwd() as { cwd: string };
          const cwd = result.cwd;
          console.log('[FileExplorer] getCwd result:', cwd);
          if (cwd && cwd !== '/' && cwd !== process.cwd()) {
            setProjectPath(cwd);
            try {
              setIsLoading(true);
              const { loadDirectory } = useAppStore.getState();
              console.log('[FileExplorer] Loading directory:', cwd);
              await loadDirectory(cwd);
              console.log('[FileExplorer] Directory loaded successfully');
            } finally {
              setIsLoading(false);
            }
          } else {
            console.log('[FileExplorer] No valid cwd, showing empty state. cwd was:', cwd);
          }
        } catch (error) {
          console.error('[FileExplorer] Failed to get cwd:', error);
        }
      }
    };

    loadInitialDir();

    const unsubscribe = window.electronAPI!.file.onChange((event) => {
      console.log('[FileExplorer] File changed:', event);
      if (projectPath) {
        const { loadDirectory } = useAppStore.getState();
        loadDirectory(projectPath);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath, setProjectPath]);

  const handleRefresh = useCallback(async () => {
    if (!projectPath) {
      console.warn('[FileExplorer] handleRefresh: no projectPath');
      return;
    }
    console.log('[FileExplorer] Refreshing:', projectPath);
    setIsLoading(true);
    try {
      const { loadDirectory } = useAppStore.getState();
      await loadDirectory(projectPath);
      console.log('[FileExplorer] Refresh complete');
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  const handleMoveItem = useCallback(async (sourcePath: string, destinationPath: string) => {
    console.log('[FileExplorer] Moving item:', sourcePath, '->', destinationPath);
    try {
      const result = await window.electronAPI!.file.rename(sourcePath, destinationPath);
      if (result.success) {
        // Refresh both source and destination parent directories
        const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
        const destParent = destinationPath.substring(0, destinationPath.lastIndexOf('/'));

        const { loadDirectory } = useAppStore.getState();
        await loadDirectory(sourceParent);
        if (destParent !== sourceParent) {
          await loadDirectory(destParent);
        }

        // If the moved file was the active file, update activeFilePath
        const { activeFilePath, setActiveFile } = useAppStore.getState();
        if (activeFilePath === sourcePath) {
          setActiveFile?.(destinationPath);
        }
      } else {
        console.error('[FileExplorer] Move failed:', result.error);
        alert(`Move failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[FileExplorer] Exception moving item:', (error as Error).message);
      alert(`Move failed: ${(error as Error).message}`);
    }
  }, []);

  const handleAddFileClick = useCallback(() => {
    if (!projectPath) return;
    console.log('[FileExplorer] Starting file creation in:', selectedFolderPath || projectPath);
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
    setNewItemName('');
  }, [projectPath, selectedFolderPath]);

  const handleAddFolderClick = useCallback(() => {
    if (!projectPath) return;
    console.log('[FileExplorer] Starting folder creation in:', selectedFolderPath || projectPath);
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setNewItemName('');
  }, [projectPath, selectedFolderPath]);

  // Called from FileNode context menu or header buttons to start inline creation
  const handleStartCreate = useCallback((type: 'file' | 'folder', targetPath: string) => {
    console.log('[FileExplorer] handleStartCreate type:', type, 'targetPath:', targetPath);
    setSelectedFolderPath(targetPath);
    if (type === 'file') {
      setIsCreatingFile(true);
      setIsCreatingFolder(false);
    } else {
      setIsCreatingFolder(true);
      setIsCreatingFile(false);
    }
    setNewItemName('');
  }, []);

  const handleCreateItem = useCallback(async () => {
    const targetPath = selectedFolderPath || projectPath;
    if (!targetPath || !newItemName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }

    const itemPath = `${targetPath}/${newItemName.trim()}`;
    console.log('[FileExplorer] Creating item:', itemPath, 'isFile:', isCreatingFile);

    try {
      if (isCreatingFile) {
        const result = await window.electronAPI!.file.write(itemPath, '');
        console.log('[FileExplorer] Create file result:', result);
        if (result.success) {
          const { loadDirectory } = useAppStore.getState();
          await loadDirectory(targetPath);
        } else {
          console.error('[FileExplorer] Failed to create file:', result.error);
        }
      } else if (isCreatingFolder) {
        const result = await window.electronAPI!.file.mkdir(itemPath);
        console.log('[FileExplorer] Create folder result:', result);
        if (result.success) {
          const { loadDirectory } = useAppStore.getState();
          await loadDirectory(targetPath);
        } else {
          console.error('[FileExplorer] Failed to create folder:', result.error);
        }
      }
    } catch (error) {
      console.error('[FileExplorer] Exception creating item:', (error as Error).message);
    } finally {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setNewItemName('');
    }
  }, [projectPath, selectedFolderPath, newItemName, isCreatingFile, isCreatingFolder]);

  const handleCancelCreate = useCallback(() => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewItemName('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateItem();
    else if (e.key === 'Escape') handleCancelCreate();
  }, [handleCreateItem, handleCancelCreate]);

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) newSet.delete(projectId);
      else newSet.add(projectId);
      return newSet;
    });
  }, []);

  const handleProjectClick = useCallback((folder: { id: string; path: string; name?: string }) => {
    setActiveFolder(folder.id);
    loadDirectory(folder.path);
  }, [setActiveFolder, loadDirectory]);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger on blank area (not on file nodes)
    if ((e.target as HTMLElement).closest('.file-node-row')) return;
    e.preventDefault();
    console.log('[FileExplorer] Root context menu at', e.clientX, e.clientY);
    setRootContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const getRootContextMenuItems = (): ContextMenuItem[] => [
    {
      id: 'new-file',
      label: 'New File...',
      icon: <FilePlus size={14} />,
      disabled: !projectPath,
      action: handleAddFileClick,
    },
    {
      id: 'new-folder',
      label: 'New Folder...',
      icon: <FolderPlus size={14} />,
      disabled: !projectPath,
      action: handleAddFolderClick,
    },
    { id: 'divider1', label: '', divider: true },
    {
      id: 'reveal',
      label: 'Reveal in Finder',
      icon: <Eye size={14} />,
      disabled: !projectPath,
      action: async () => {
        if (!projectPath) return;
        console.log('[FileExplorer] Reveal workspace in Finder:', projectPath);
        await window.electronAPI!.file.revealInFinder(projectPath);
      },
    },
    { id: 'divider2', label: '', divider: true },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <RefreshCw size={14} />,
      action: handleRefresh,
    },
  ];

  const rootFiles = files.filter(f => {
    const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '';
    return parent === projectPath || parent === '';
  });

  const getProjectFiles = useCallback((folderPath: string) => {
    return files.filter(f => {
      const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '';
      return parent === folderPath || f.path === folderPath;
    });
  }, [files]);

  return (
    <div className="file-explorer" onContextMenu={handleRootContextMenu}>
      <div className="file-explorer-header">
        <span className="file-explorer-title">Explorer</span>
        <div className="file-explorer-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleAddFileClick}
            disabled={!projectPath}
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleAddFolderClick}
            disabled={!projectPath}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={openFolder}
            title="Open Folder"
          >
            <FolderOpenIcon size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'loading-spinner' : ''} />
          </button>
        </div>
      </div>

      <div className="file-explorer-content">
        {isWorkspaceMode && currentWorkspace ? (
          <div className="file-explorer-workspace">
            <div className="file-explorer-workspace-header">
              <span className="file-explorer-workspace-name">{currentWorkspace.name}</span>
              <span className="file-explorer-workspace-badge">
                {currentWorkspace.folders.length} projects
              </span>
            </div>

            {currentWorkspace.folders.map((folder) => {
              const isExpanded = expandedProjects.has(folder.id);
              const isActive = activeFolderId === folder.id;
              const projectFiles = getProjectFiles(folder.path);

              return (
                <div
                  key={folder.id}
                  className={`file-explorer-project-section ${isActive ? 'active' : ''}`}
                >
                  <div
                    className="file-explorer-project-header"
                    onClick={() => {
                      toggleProject(folder.id);
                      handleProjectClick(folder);
                    }}
                  >
                    <span className="file-explorer-project-toggle">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="file-explorer-project-icon">
                      <Folder size={16} />
                    </span>
                    <span className="file-explorer-project-name">
                      {folder.name || folder.path.split('/').pop()}
                    </span>
                    {isActive && <span className="file-explorer-project-active-indicator">●</span>}
                  </div>

                  {isExpanded && (
                    <div className="file-explorer-project-content">
                      {projectFiles.length === 0 ? (
                        <div className="file-explorer-project-empty">Empty project</div>
                      ) : (
                        projectFiles.map((file) => (
                          <FileNode
                            key={file.path}
                            name={file.name}
                            path={file.path}
                            isDirectory={file.isDirectory}
                            depth={0}
                            projectPath={folder.path}
                            selectedFolderPath={selectedFolderPath}
                            onSelectFolder={setSelectedFolderPath}
                            isCreatingFile={isCreatingFile}
                            isCreatingFolder={isCreatingFolder}
                            newItemName={newItemName}
                            setNewItemName={setNewItemName}
                            handleKeyDown={handleKeyDown}
                            onRefresh={handleRefresh}
                            onStartCreate={handleStartCreate}
                            draggedPath={draggedPath}
                            setDraggedPath={setDraggedPath}
                            dragOverPath={dragOverPath}
                            setDragOverPath={setDragOverPath}
                            onMoveItem={handleMoveItem}
                            selectedPaths={selectedPaths}
                            onSelectPath={handleSelectPath}
                            lastClickedPath={lastClickedPath}
                            onDeleteSelected={handleDeleteSelected}
                            onClearSelection={() => {
                              setSelectedPaths(new Set());
                              setLastClickedPath(null);
                            }}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {projectPath && (
              <div className="file-explorer-project">
                {projectPath.split('/').pop() || projectPath}
                {selectedFolderPath && selectedFolderPath !== projectPath && (
                  <span className="file-explorer-selected-indicator">
                    {' '}/ {selectedFolderPath.replace(projectPath + '/', '').split('/').pop()}
                  </span>
                )}
              </div>
            )}

            {isLoading && rootFiles.length === 0 ? (
              <div className="file-explorer-loading">Loading...</div>
            ) : rootFiles.length === 0 ? (
              <div className="file-explorer-empty">
                <p>No files in workspace</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={openFolder}
                  style={{ marginTop: '12px' }}
                >
                  <FolderOpenIcon size={14} />
                  Open Folder
                </button>
              </div>
            ) : (
              <div className="file-explorer-tree">
                {(isCreatingFile || isCreatingFolder) && !selectedFolderPath && (
                  <div className="file-explorer-new-item" style={{ paddingLeft: '8px' }}>
                    <span className="file-node-icon">
                      {isCreatingFile ? <FileIcon filename={newItemName || 'file'} size={16} /> : <Folder size={16} />}
                    </span>
                    <input
                      type="text"
                      className="file-explorer-new-item-input"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isCreatingFile ? 'filename.ext' : 'foldername'}
                      autoFocus
                    />
                  </div>
                )}
                {rootFiles.map((file) => (
                  <FileNode
                    key={file.path}
                    name={file.name}
                    path={file.path}
                    isDirectory={file.isDirectory}
                    depth={0}
                    projectPath={projectPath}
                    selectedFolderPath={selectedFolderPath}
                    onSelectFolder={setSelectedFolderPath}
                    isCreatingFile={isCreatingFile}
                    isCreatingFolder={isCreatingFolder}
                    newItemName={newItemName}
                    setNewItemName={setNewItemName}
                    handleKeyDown={handleKeyDown}
                    onRefresh={handleRefresh}
                    onStartCreate={handleStartCreate}
                    draggedPath={draggedPath}
                    setDraggedPath={setDraggedPath}
                    dragOverPath={dragOverPath}
                    setDragOverPath={setDragOverPath}
                    onMoveItem={handleMoveItem}
                    selectedPaths={selectedPaths}
                    onSelectPath={handleSelectPath}
                    lastClickedPath={lastClickedPath}
                    onDeleteSelected={handleDeleteSelected}
                    onClearSelection={() => {
                      setSelectedPaths(new Set());
                      setLastClickedPath(null);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {rootContextMenu && (
        <ContextMenu
          x={rootContextMenu.x}
          y={rootContextMenu.y}
          items={getRootContextMenuItems()}
          onClose={() => setRootContextMenu(null)}
        />
      )}
    </div>
  );
};
