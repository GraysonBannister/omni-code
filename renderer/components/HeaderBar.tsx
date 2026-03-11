import React, { useState, useCallback } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useAppStore } from '../stores/appStore';
import './HeaderBar.css';

export const HeaderBar: React.FC = () => {
  const { projectPath, openBrowser } = useAppStore();
  const [browserUrl, setBrowserUrl] = useState('');
  const [showBrowserInput, setShowBrowserInput] = useState(false);

  const handleOpenBrowser = useCallback(() => {
    if (browserUrl.trim()) {
      openBrowser(browserUrl.trim());
      setBrowserUrl('');
      setShowBrowserInput(false);
    }
  }, [browserUrl, openBrowser]);

  const handleBrowserKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOpenBrowser();
    } else if (e.key === 'Escape') {
      setShowBrowserInput(false);
      setBrowserUrl('');
    }
  };

  return (
    <div className="header-bar">
      <div className="header-bar-left">
        <button className="header-bar-menu-btn" title="Menu">
          <Menu size={18} />
        </button>
        <span className="header-bar-title">Omni Code</span>
      </div>

      <div className="header-bar-center">
        {projectPath && <SearchBar />}
      </div>

      <div className="header-bar-browser">
        {showBrowserInput ? (
          <div className="browser-input-wrapper">
            <Globe size={14} className="browser-input-icon" />
            <input
              type="text"
              className="browser-input"
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
              onKeyDown={handleBrowserKeyDown}
              placeholder="Enter URL (e.g., google.com)"
              autoFocus
            />
            <button
              className="browser-input-btn"
              onClick={handleOpenBrowser}
              title="Open"
            >
              Open
            </button>
            <button
              className="browser-input-btn cancel"
              onClick={() => {
                setShowBrowserInput(false);
                setBrowserUrl('');
              }}
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            className="header-bar-browser-btn"
            onClick={() => setShowBrowserInput(true)}
            title="Open Browser Tab"
          >
            <Globe size={16} />
            <span>Browser</span>
          </button>
        )}
      </div>

    </div>
  );
};
