import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Globe, QrCode, Bug } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useAppStore } from '../stores/appStore';
import './HeaderBar.css';

export const HeaderBar: React.FC = () => {
  const { projectPath, openBrowser } = useAppStore();
  const [browserUrl, setBrowserUrl] = useState('');
  const [showBrowserInput, setShowBrowserInput] = useState(false);

  // QR Code state
  const [showQRPopover, setShowQRPopover] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const qrButtonRef = useRef<HTMLButtonElement>(null);

  // Bug report state
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugMessage, setBugMessage] = useState('');
  const [bugSending, setBugSending] = useState(false);
  const [bugSent, setBugSent] = useState(false);
  const bugButtonRef = useRef<HTMLButtonElement>(null);
  const bugPopoverRef = useRef<HTMLDivElement>(null);

  // Check server status on mount and when popover opens
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await window.electronAPI?.remote?.status();
        setServerRunning(status?.running || false);
      } catch {
        setServerRunning(false);
      }
    };

    checkStatus();
    // Poll status every 5 seconds when popover is open
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [showQRPopover]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showQRPopover &&
        qrButtonRef.current &&
        !qrButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.qr-popover')
      ) {
        setShowQRPopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQRPopover]);

  // Close bug report popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showBugReport &&
        bugButtonRef.current &&
        !bugButtonRef.current.contains(event.target as Node) &&
        bugPopoverRef.current &&
        !bugPopoverRef.current.contains(event.target as Node)
      ) {
        setShowBugReport(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBugReport]);

  const handleSendBugReport = async () => {
    setBugSending(true);
    try {
      // Collect debug info
      const installedAddons: string[] = [];
      try {
        const result = await window.electronAPI?.addons?.list();
        if (result?.manifests) {
          result.manifests.forEach((m: { name: string; version: string }) =>
            installedAddons.push(`  - ${m.name} v${m.version}`)
          );
        }
      } catch { /* ignore */ }

      const debugInfo = [
        `Timestamp: ${new Date().toISOString()}`,
        `Platform: ${navigator.platform}`,
        `User Agent: ${navigator.userAgent}`,
        `Installed Add-ons:\n${installedAddons.length > 0 ? installedAddons.join('\n') : '  (none)'}`,
      ].join('\n');

      const subject = encodeURIComponent('Bug Report — Omni Code');
      const body = encodeURIComponent(
        `Hi Grayson,\n\n${bugMessage.trim() || '(No description provided)'}\n\n---\nDebug Info\n${debugInfo}`
      );

      const mailtoUrl = `mailto:grayson@omni-code.io?subject=${subject}&body=${body}`;

      // Open mailto in default mail client
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.click();

      setBugSent(true);
      setTimeout(() => {
        setBugSent(false);
        setShowBugReport(false);
        setBugMessage('');
      }, 2000);
    } finally {
      setBugSending(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!serverRunning) return;

    setQrLoading(true);
    try {
      const result = await window.electronAPI?.remote?.generateQR();
      if (result?.success && result.qrCodeDataUrl) {
        setQrCodeDataUrl(result.qrCodeDataUrl);
        setShowQRPopover(true);
      } else {
        console.error('Failed to generate QR code:', result?.error);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const handleQRClick = () => {
    if (showQRPopover) {
      setShowQRPopover(false);
    } else if (qrCodeDataUrl) {
      setShowQRPopover(true);
    } else {
      handleGenerateQR();
    }
  };

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
        <span className="header-bar-title">Omni Code</span>

        {/* QR Code Button */}
        <div className="qr-code-button-wrapper">
          <button
            ref={qrButtonRef}
            className={`header-bar-qr-btn ${!serverRunning ? 'disabled' : ''}`}
            onClick={handleQRClick}
            disabled={!serverRunning || qrLoading}
            title={serverRunning ? 'Show connection QR code' : 'Start remote server to connect'}
          >
            {qrLoading ? (
              <span className="qr-loading-spinner" />
            ) : (
              <QrCode size={16} />
            )}
          </button>

          {/* QR Code Popover */}
          {showQRPopover && qrCodeDataUrl && (
            <div className="qr-popover">
              <div className="qr-popover-header">
                <span>Scan to connect</span>
                <button
                  className="qr-popover-close"
                  onClick={() => setShowQRPopover(false)}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="qr-popover-content">
                <img
                  src={qrCodeDataUrl}
                  alt="Connection QR Code"
                  className="qr-code-image"
                />
                <p className="qr-popover-hint">
                  Scan with your mobile app
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bug Report Button */}
        <div className="bug-report-wrapper">
          <button
            ref={bugButtonRef}
            className="header-bar-bug-btn"
            onClick={() => setShowBugReport((v) => !v)}
            title="Report a bug"
          >
            <Bug size={15} />
          </button>

          {showBugReport && (
            <div className="bug-popover" ref={bugPopoverRef}>
              <div className="bug-popover-header">
                <span>Report a Bug</span>
                <button
                  className="qr-popover-close"
                  onClick={() => { setShowBugReport(false); setBugMessage(''); }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="bug-popover-body">
                <p className="bug-popover-hint">
                  Describe what happened and we'll include your system info automatically.
                </p>
                <textarea
                  className="bug-textarea"
                  value={bugMessage}
                  onChange={(e) => setBugMessage(e.target.value)}
                  placeholder="What went wrong? Steps to reproduce, error messages, unexpected behaviour…"
                  rows={5}
                  autoFocus
                />
                <button
                  className={`bug-send-btn ${bugSent ? 'bug-send-btn--sent' : ''}`}
                  onClick={handleSendBugReport}
                  disabled={bugSending || bugSent}
                >
                  {bugSent ? '✓ Opening mail client…' : bugSending ? 'Preparing…' : 'Send Report'}
                </button>
                <p className="bug-popover-dest">Sends to grayson@omni-code.io via your mail app</p>
              </div>
            </div>
          )}
        </div>
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
