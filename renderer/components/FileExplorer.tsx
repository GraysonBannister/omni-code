import React, { useEffect, useState, useCallback } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, RefreshCw, FolderOpen as FolderOpenIcon, FilePlus, FolderPlus } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './FileExplorer.css';

interface FileNodeProps {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
  selectedFolderPath?: string | null;
  onSelectFolder?: (path: string) => void;
  isCreatingFile?: boolean;
  isCreatingFolder?: boolean;
  newItemName?: string;
  setNewItemName?: (name: string) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
}

const FileNode: React.FC<FileNodeProps> = ({
  name,
  path,
  isDirectory,
  depth,
  selectedFolderPath,
  onSelectFolder,
  isCreatingFile,
  isCreatingFolder,
  newItemName,
  setNewItemName,
  handleKeyDown
}) => {
  const { expandedDirs, toggleDir, openFile, activeFilePath, files } = useAppStore();
  const isExpanded = expandedDirs.has(path) || ((isCreatingFile || isCreatingFolder) && selectedFolderPath === path);
  const isActiveFile = activeFilePath === path;
  const isSelectedFolder = selectedFolderPath === path;

  // Check if we're creating an item in this folder
  const showCreateInput = (isCreatingFile || isCreatingFolder) && selectedFolderPath === path;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDirectory) {
      // If clicking a folder, select it and optionally toggle expansion
      if (onSelectFolder) {
        onSelectFolder(path);
      }
      // Double-click or normal click to toggle
      toggleDir(path);
      if (!isExpanded) {
        // Get loadDirectory from store to avoid dependency cycle
        const { loadDirectory } = useAppStore.getState();
        loadDirectory(path);
      }
    } else {
      openFile(path);
    }
  }, [isDirectory, path, isExpanded, toggleDir, openFile, onSelectFolder]);

  const childFiles = files.filter(f => {
    const parentDir = path;
    const fileDir = f.path.substring(0, f.path.lastIndexOf('/')) || f.path;
    return fileDir === parentDir && f.path !== path;
  });

  return (
    <div className="file-node">
      <div
        className={`file-node-row ${isActiveFile ? 'active' : ''} ${isSelectedFolder ? 'selected-folder' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        title={isDirectory ? 'Click to select folder, click again to expand/collapse' : ''}
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
            <File size={16} />
          )}
        </span>
        <span className="file-node-name">{name}</span>
      </div>
      
      {isDirectory && isExpanded && (
        <div className="file-node-children">
          {showCreateInput && (
            <div className="file-explorer-new-item" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
              <span className="file-node-icon">
                {isCreatingFile ? <File size={16} /> : <Folder size={16} />}
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
              selectedFolderPath={selectedFolderPath}
              onSelectFolder={onSelectFolder}
              isCreatingFile={isCreatingFile}
              isCreatingFolder={isCreatingFolder}
              newItemName={newItemName}
              setNewItemName={setNewItemName}
              handleKeyDown={handleKeyDown}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const {
    projectPath,
    files,
    setProjectPath,
    setFiles,
    openFolder,
    isAppInitialized,
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

  // Clear selected folder when project path changes
  useEffect(() => {
    setSelectedFolderPath(null);
  }, [projectPath]);

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
      if (!projectPath) {
        // Try to use current working directory from main process
        try {
          const result = await window.electronAPI!.config.getCwd() as { cwd: string };
          const cwd = result.cwd;
          if (cwd && cwd !== '/' && cwd !== process.cwd()) {
            setProjectPath(cwd);

            try {
              setIsLoading(true);
              // Get loadDirectory from store to avoid dependency cycle
              const { loadDirectory } = useAppStore.getState();
              await loadDirectory(cwd);
            } finally {
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('Failed to get cwd:', error);
        }
        // If no cwd is set or it's root, show empty state
        // User can click "Open Folder" to select a workspace
      }
    };

    loadInitialDir();

    // Setup file change listener
    const unsubscribe = window.electronAPI!.file.onChange((event) => {
      console.log('File changed:', event);
      // Refresh directory on changes
      if (projectPath) {
        // Get loadDirectory from store to avoid dependency cycle
        const { loadDirectory } = useAppStore.getState();
        loadDirectory(projectPath);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath, setProjectPath]);

  const handleRefresh = useCallback(async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      // Get loadDirectory from store to avoid dependency cycle
      const { loadDirectory } = useAppStore.getState();
      await loadDirectory(projectPath);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  const handleAddFileClick = useCallback(() => {
    if (!projectPath) return;
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
    setNewItemName('');
  }, [projectPath]);

  const handleAddFolderClick = useCallback(() => {
    if (!projectPath) return;
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setNewItemName('');
  }, [projectPath]);

  const handleCreateItem = useCallback(async () => {
    // Use selected folder path if available, otherwise use project root
    const targetPath = selectedFolderPath || projectPath;

    if (!targetPath || !newItemName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }

    try {
      const itemPath = `${targetPath}/${newItemName.trim()}`;

      if (isCreatingFile) {
        const result = await window.electronAPI!.file.write(itemPath, '');
        if (result.success) {
          // Refresh the directory where the file was created
          const { loadDirectory } = useAppStore.getState();
          await loadDirectory(targetPath);
        } else {
          console.error(`Failed to create file: ${result.error}`);
        }
      } else if (isCreatingFolder) {
        const result = await window.electronAPI!.file.mkdir(itemPath);
        if (result.success) {
          // Refresh the directory where the folder was created
          const { loadDirectory } = useAppStore.getState();
          await loadDirectory(targetPath);
        } else {
          console.error(`Failed to create folder: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`Failed to create item: ${(error as Error).message}`);
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
    if (e.key === 'Enter') {
      handleCreateItem();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  }, [handleCreateItem, handleCancelCreate]);

  // Toggle project expansion in workspace mode
  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  // Handle project selection in workspace mode
  const handleProjectClick = useCallback((folder: { id: string; path: string; name?: string }) => {
    setActiveFolder(folder.id);
    // Load the directory
    loadDirectory(folder.path);
  }, [setActiveFolder, loadDirectory]);

  // Group files by parent directory
  const rootFiles = files.filter(f => {
    const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '';
    return parent === projectPath || parent === '';
  });

  // Get files for a specific project folder
  const getProjectFiles = useCallback((folderPath: string) => {
    return files.filter(f => {
      const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '';
      return parent === folderPath || f.path === folderPath;
    });
  }, [files]);

  return (
    <div className="file-explorer">
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
        {/* Workspace Mode: Show project headers for each folder */}
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
                            selectedFolderPath={selectedFolderPath}
                            onSelectFolder={setSelectedFolderPath}
                            isCreatingFile={isCreatingFile}
                            isCreatingFolder={isCreatingFolder}
                            newItemName={newItemName}
                            setNewItemName={setNewItemName}
                            handleKeyDown={handleKeyDown}
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
          /* Single Folder Mode */
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
                {/* Show input at root only if no folder is selected */}
                {(isCreatingFile || isCreatingFolder) && !selectedFolderPath && (
                  <div className="file-explorer-new-item" style={{ paddingLeft: '8px' }}>
                    <span className="file-node-icon">
                      {isCreatingFile ? <File size={16} /> : <Folder size={16} />}
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
                    selectedFolderPath={selectedFolderPath}
                    onSelectFolder={setSelectedFolderPath}
                    isCreatingFile={isCreatingFile}
                    isCreatingFolder={isCreatingFolder}
                    newItemName={newItemName}
                    setNewItemName={setNewItemName}
                    handleKeyDown={handleKeyDown}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
