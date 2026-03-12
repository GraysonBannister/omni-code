import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Camera, Globe } from 'lucide-react';
import './BrowserPanel.css';

interface BrowserPanelProps {
  url: string;
}

export const BrowserPanel: React.FC<BrowserPanelProps> = ({ url }) => {
  const webviewRef = useRef<HTMLElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState(url);

  // Ensure URL has a protocol
  const safeUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleError = (e: Event) => {
      console.warn('Webview load error:', e);
      setLoadError('Failed to load page. The site may block embedding.');
      setIsLoading(false);
    };

    const handleConsole = (e: any) => {
      // Suppress console errors from the webview
      if (e.message && e.message.includes('ERR_ABORTED')) {
        return;
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setLoadError(null);
    };

    const handleLoadStop = () => {
      setIsLoading(false);
      // Update navigation state
      try {
        // @ts-ignore - webview methods are not in types
        setCanGoBack(webview.canGoBack());
        // @ts-ignore
        setCanGoForward(webview.canGoForward());
      } catch {
        // Ignore errors
      }
    };

    const handleNavigation = () => {
      try {
        // @ts-ignore
        setCanGoBack(webview.canGoBack());
        // @ts-ignore
        setCanGoForward(webview.canGoForward());
      } catch {
        // Ignore errors
      }
    };

    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('console-message', handleConsole);
    webview.addEventListener('did-start-loading', handleLoadStart);
    webview.addEventListener('did-stop-loading', handleLoadStop);
    webview.addEventListener('did-navigate', handleNavigation);
    webview.addEventListener('did-navigate-in-page', handleNavigation);

    return () => {
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('console-message', handleConsole);
      webview.removeEventListener('did-start-loading', handleLoadStart);
      webview.removeEventListener('did-stop-loading', handleLoadStop);
      webview.removeEventListener('did-navigate', handleNavigation);
      webview.removeEventListener('did-navigate-in-page', handleNavigation);
    };
  }, [safeUrl]);

  const handleBack = useCallback(() => {
    try {
      // @ts-ignore
      webviewRef.current?.goBack();
    } catch (e) {
      console.error('Failed to go back:', e);
    }
  }, []);

  const handleForward = useCallback(() => {
    try {
      // @ts-ignore
      webviewRef.current?.goForward();
    } catch (e) {
      console.error('Failed to go forward:', e);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    try {
      // @ts-ignore
      webviewRef.current?.reload();
    } catch (e) {
      console.error('Failed to refresh:', e);
    }
  }, []);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    let newUrl = inputUrl.trim();
    if (!newUrl) return;
    
    // Ensure protocol
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = `https://${newUrl}`;
    }
    
    try {
      // @ts-ignore
      webviewRef.current?.loadURL(newUrl);
    } catch (e) {
      console.error('Failed to navigate:', e);
    }
  }, [inputUrl]);

  const handleScreenshot = useCallback(async () => {
    try {
      // Request screenshot via IPC
      const result = await window.electronAPI.browser.sendScreenshotResponse(url, undefined, 'Not implemented yet');
      console.log('Screenshot requested:', result);
    } catch (e) {
      console.error('Failed to take screenshot:', e);
    }
  }, [url]);

  return (
    <div className="browser-panel">
      <div className="browser-toolbar">
        <div className="browser-nav-buttons">
          <button 
            className="browser-nav-btn" 
            onClick={handleBack}
            disabled={!canGoBack}
            title="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            className="browser-nav-btn" 
            onClick={handleForward}
            disabled={!canGoForward}
            title="Go forward"
          >
            <ArrowRight size={16} />
          </button>
          <button 
            className={`browser-nav-btn ${isLoading ? 'loading' : ''}`}
            onClick={handleRefresh}
            title="Refresh"
          >
            <RotateCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
        
        <form className="browser-address-bar" onSubmit={handleUrlSubmit}>
          <Globe size={14} className="browser-address-icon" />
          <input
            type="text"
            className="browser-url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter URL..."
          />
        </form>

        <button 
          className="browser-nav-btn" 
          onClick={handleScreenshot}
          title="Take screenshot"
        >
          <Camera size={16} />
        </button>
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
