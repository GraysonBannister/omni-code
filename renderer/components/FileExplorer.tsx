import React, { useEffect, useState, useCallback } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, RefreshCw, FolderOpen as FolderOpenIcon } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './FileExplorer.css';

interface FileNodeProps {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
}

const FileNode: React.FC<FileNodeProps> = ({ name, path, isDirectory, depth }) => {
  const { expandedDirs, toggleDir, openFile, activeFilePath, loadDirectory, files } = useAppStore();
  const isExpanded = expandedDirs.has(path);
  const isActive = activeFilePath === path;

  const handleClick = useCallback(() => {
    if (isDirectory) {
      toggleDir(path);
      if (!isExpanded) {
        loadDirectory(path);
      }
    } else {
      openFile(path);
    }
  }, [isDirectory, path, isExpanded, toggleDir, loadDirectory, openFile]);

  const childFiles = files.filter(f => {
    const parentDir = path;
    const fileDir = f.path.substring(0, f.path.lastIndexOf('/')) || f.path;
    return fileDir === parentDir && f.path !== path;
  });

  return (
    <div className="file-node">
      <div
        className={`file-node-row ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
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
      
      {isDirectory && isExpanded && childFiles.length > 0 && (
        <div className="file-node-children">
          {childFiles.map((child) => (
            <FileNode
              key={child.path}
              name={child.name}
              path={child.path}
              isDirectory={child.isDirectory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const { projectPath, files, setProjectPath, setFiles, loadDirectory, openFolder, isAppInitialized } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

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
        loadDirectory(projectPath);
      }
    });

    return () => unsubscribe();
  }, [projectPath, setProjectPath, loadDirectory]);

  const handleRefresh = useCallback(async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      await loadDirectory(projectPath);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, loadDirectory]);

  // Group files by parent directory
  const rootFiles = files.filter(f => {
    const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '';
    return parent === projectPath || parent === '';
  });

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span className="file-explorer-title">Explorer</span>
        <div className="file-explorer-actions">
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
        {projectPath && (
          <div className="file-explorer-project">
            {projectPath.split('/').pop() || projectPath}
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
            {rootFiles.map((file) => (
              <FileNode
                key={file.path}
                name={file.name}
                path={file.path}
                isDirectory={file.isDirectory}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
