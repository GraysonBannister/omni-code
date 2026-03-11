import React, { useRef, useEffect, useState } from 'react';
import './BrowserPanel.css';

interface BrowserPanelProps {
  url: string;
}

export const BrowserPanel: React.FC<BrowserPanelProps> = ({ url }) => {
  const webviewRef = useRef<HTMLElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ensure URL has a protocol
  const safeUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleError = (e: Event) => {
      console.warn('Webview load error:', e);
      setLoadError('Failed to load page. The site may block embedding.');
    };

    const handleConsole = (e: any) => {
      // Suppress console errors from the webview
      if (e.message && e.message.includes('ERR_ABORTED')) {
        return;
      }
    };

    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('console-message', handleConsole);

    return () => {
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('console-message', handleConsole);
    };
  }, [safeUrl]);

  return (
    <div className="browser-panel">
      <div className="browser-address-bar">
        <span className="browser-url">{safeUrl}</span>
      </div>
      {loadError && (
        <div className="browser-error">
          <p>{loadError}</p>
          <p className="browser-error-hint">
            Some sites like YouTube, Google, and Facebook block embedding for security reasons.
            <br />
            Try other websites or use the external browser.
          </p>
        </div>
      )}
      {/* @ts-ignore - webview is an Electron custom element */}
      <webview
        ref={webviewRef}
        src={safeUrl}
        className="browser-webview"
        allowpopups=""
      />
    </div>
  );
};
