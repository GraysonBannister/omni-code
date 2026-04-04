import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, ExternalLink, Monitor } from 'lucide-react';
import './HtmlPreviewPanel.css';

interface HtmlPreviewPanelProps {
  content: string;
  filePath?: string;
  embedded?: boolean;
}

export const HtmlPreviewPanel: React.FC<HtmlPreviewPanelProps> = ({ content, filePath, embedded }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1);

  // Update iframe content when it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);

    // Use srcDoc for sandboxed rendering
    // This prevents the HTML from accessing parent window
    iframe.srcdoc = content;

    const handleLoad = () => {
      setIsLoading(false);
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [content]);

  const handleRefresh = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);
    iframe.srcdoc = content;
  }, [content]);

  const handleOpenExternal = useCallback(() => {
    if (!filePath) return;

    // Create a blob URL for the content
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new window/tab
    window.open(url, '_blank');

    // Clean up the blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [content, filePath]);

  const handleZoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.1, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
  }, []);

  return (
    <div className={`html-preview-panel ${embedded ? 'embedded' : ''}`}>
      {!embedded ? (
        <div className="html-preview-toolbar">
          <div className="html-preview-toolbar-left">
            <Monitor size={14} className="html-preview-icon" />
            <span className="html-preview-label">Live Preview</span>
          </div>

          <div className="html-preview-toolbar-center">
            <button
              className="html-preview-zoom-btn"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              -
            </button>
            <span className="html-preview-zoom-value">{Math.round(scale * 100)}%</span>
            <button
              className="html-preview-zoom-btn"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              +
            </button>
            <button
              className="html-preview-zoom-reset"
              onClick={handleZoomReset}
              title="Reset zoom"
            >
              Reset
            </button>
          </div>

          <div className="html-preview-toolbar-right">
            <button
              className={`html-preview-refresh-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleRefresh}
              title="Refresh preview"
            >
              <RotateCw size={14} className={isLoading ? 'spinning' : ''} />
            </button>
            <button
              className="html-preview-external-btn"
              onClick={handleOpenExternal}
              title="Open in external browser"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="html-preview-toolbar embedded-toolbar">
          <div className="html-preview-toolbar-left">
            <span className="html-preview-label">Preview</span>
          </div>
          <div className="html-preview-toolbar-right">
            <button
              className={`html-preview-refresh-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleRefresh}
              title="Refresh preview"
            >
              <RotateCw size={12} className={isLoading ? 'spinning' : ''} />
            </button>
            <button
              className="html-preview-external-btn"
              onClick={handleOpenExternal}
              title="Open in external browser"
            >
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="html-preview-container">
        <div
          className="html-preview-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <iframe
            ref={iframeRef}
            className="html-preview-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="HTML Preview"
          />
        </div>
      </div>
    </div>
  );
};
