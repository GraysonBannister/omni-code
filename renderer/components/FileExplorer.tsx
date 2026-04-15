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
}) => {
  const { expandedDirs, toggleDir, openFile, activeFilePath, files } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedDirs.has(path) || ((isCreatingFile || isCreatingFolder) && selectedFolderPath === path);
  const isActiveFile = activeFilePath === path;
  const isSelectedFolder = selectedFolderPath === path;
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
    if (isDirectory) {
      if (onSelectFolder) onSelectFolder(path);
      toggleDir(path);
      if (!isExpanded) {
        const { loadDirectory } = useAppStore.getState();
        console.log('[FileNode] Loading directory on expand:', path);
        loadDirectory(path);
      }
    } else {
      console.log('[FileNode] Opening file:', path);
      openFile(path);
    }
  }, [isDirectory, path, isExpanded, toggleDir, openFile, onSelectFolder]);

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

  const buildContextMenuItems = (): ContextMenuItem[] => {
    const divider: ContextMenuItem = { id: 'divider', label: '', divider: true };

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
        className={`file-node-row ${isActiveFile ? 'active' : ''} ${isSelectedFolder ? 'selected-folder' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={isDirectory ? 'Click to select folder, click again to expand/collapse' : path}
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
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [rootContextMenu, setRootContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Clear selected folder when project path changes
  useEffect(() => {
    setSelectedFolderPath(null);
  }, [projectPath]);

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
