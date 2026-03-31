import React from 'react';
import { Files, GitBranch } from 'lucide-react';
import { useAppStore, type SidebarTab } from '../stores/appStore';
import { FileExplorer } from './FileExplorer';
import { GitPanel } from './GitPanel';
import './SidebarPanel.css';

const tabs: Array<{ id: SidebarTab; icon: React.ReactNode; label: string }> = [
  { id: 'files', icon: <Files size={20} />, label: 'Explorer' },
  { id: 'git', icon: <GitBranch size={20} />, label: 'Source Control' },
];

export const SidebarPanel: React.FC = () => {
  const activeSidebarTab = useAppStore(s => s.activeSidebarTab);
  const setActiveSidebarTab = useAppStore(s => s.setActiveSidebarTab);

  return (
    <div className="sidebar-container">
      <div className="sidebar-icon-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-icon-btn ${activeSidebarTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSidebarTab(tab.id)}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>
      <div className="sidebar-content">
        {activeSidebarTab === 'files' && <FileExplorer />}
        {activeSidebarTab === 'git' && <GitPanel />}
      </div>
    </div>
  );
};
