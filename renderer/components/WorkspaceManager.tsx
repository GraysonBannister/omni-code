import React, { useState, useCallback } from 'react';
import { X, FolderPlus, Folder, Trash2, Save, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { Workspace, FolderRef } from '../../src/types/workspace';
import './WorkspaceManager.css';

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated?: (workspace: Workspace) => void;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated,
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [folders, setFolders] = useState<FolderRef[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createWorkspace, addFolderToWorkspace, currentWorkspace } = useAppStore();

  const handleAddFolder = useCallback(async () => {
    try {
      const result = await window.electronAPI?.dialog?.openFolder();
      if (result && !result.canceled && result.path) {
        const newFolder: FolderRef = {
          id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          path: result.path,
          name: result.path.split('/').pop() || 'Unknown',
        };
        setFolders((prev) => [...prev, newFolder]);
        setError(null);
      }
    } catch (err) {
      setError('Failed to add folder');
    }
  }, []);

  const handleRemoveFolder = useCallback((folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
  }, []);

  const handleCreateWorkspace = useCallback(async () => {
    if (!workspaceName.trim()) {
      setError('Please enter a workspace name');
      return;
    }

    if (folders.length === 0) {
      setError('Please add at least one folder');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const workspace = await createWorkspace({
        name: workspaceName.trim(),
        folders: folders.map((f) => f.path),
      });

      if (workspace) {
        // Save workspace to file
        const saveResult = await window.electronAPI?.workspace?.saveToFile(
          workspace,
          workspace.name + '.omnicode-workspace'
        );

        if (saveResult?.success) {
          onWorkspaceCreated?.(workspace);
          onClose();
          // Reset form
          setWorkspaceName('');
          setFolders([]);
        } else {
          setError(saveResult?.error || 'Failed to save workspace file');
        }
      } else {
        setError('Failed to create workspace');
      }
    } catch (err) {
      setError('An error occurred while creating the workspace');
    } finally {
      setIsCreating(false);
    }
  }, [workspaceName, folders, createWorkspace, onWorkspaceCreated, onClose]);

  const handleCancel = useCallback(() => {
    setWorkspaceName('');
    setFolders([]);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="workspace-manager-overlay" onClick={handleCancel}>
      <div
        className="workspace-manager-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="workspace-manager-header">
          <h2>Create Workspace</h2>
          <button
            className="workspace-manager-close"
            onClick={handleCancel}
            disabled={isCreating}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-manager-content">
          {error && <div className="workspace-manager-error">{error}</div>}

          <div className="workspace-manager-section">
            <label className="workspace-manager-label">Workspace Name</label>
            <input
              type="text"
              className="workspace-manager-input"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Workspace"
              disabled={isCreating}
            />
          </div>

          <div className="workspace-manager-section">
            <div className="workspace-manager-section-header">
              <label className="workspace-manager-label">Folders</label>
              <button
                className="workspace-manager-add-btn"
                onClick={handleAddFolder}
                disabled={isCreating}
              >
                <FolderPlus size={16} />
                <span>Add Folder</span>
              </button>
            </div>

            {folders.length === 0 ? (
              <div className="workspace-manager-empty">
                No folders added yet. Click &quot;Add Folder&quot; to add projects to this
                workspace.
              </div>
            ) : (
              <div className="workspace-manager-folders">
                {folders.map((folder) => (
                  <div key={folder.id} className="workspace-manager-folder">
                    <div className="workspace-manager-folder-icon">
                      <Folder size={18} />
                    </div>
                    <div className="workspace-manager-folder-info">
                      <span className="workspace-manager-folder-name">
                        {folder.name}
                      </span>
                      <span className="workspace-manager-folder-path">
                        {folder.path}
                      </span>
                    </div>
                    <button
                      className="workspace-manager-folder-remove"
                      onClick={() => handleRemoveFolder(folder.id)}
                      disabled={isCreating}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-manager-footer">
          <button
            className="workspace-manager-btn secondary"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            className="workspace-manager-btn primary"
            onClick={handleCreateWorkspace}
            disabled={isCreating || !workspaceName.trim() || folders.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Create Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
