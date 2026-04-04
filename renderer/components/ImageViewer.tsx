import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCw, Image as ImageIcon, Download } from 'lucide-react';
import './ImageViewer.css';

interface ImageViewerProps {
  filePath: string;
}

interface ImageMetadata {
  width: number;
  height: number;
  fileSize?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ filePath }) => {
  const [scale, setScale] = useState(1);
  const [fitToView, setFitToView] = useState(true);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image via IPC as data URL (Electron blocks file:// URLs in renderer)
  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      setScale(1);
      setRotation(0);
      setFitToView(true);
      setImageUrl('');

      try {
        const result = await (window as any).electronAPI?.file?.readBinary(filePath);
        if (result?.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }
        if (result?.dataUrl) {
          setImageUrl(result.dataUrl);
          setFileSize(result.size || 0);
        } else {
          setError('Failed to load image');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
        setIsLoading(false);
      }
    };

    loadImage();
  }, [filePath]);

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    setMetadata({
      width: img.naturalWidth,
      height: img.naturalHeight,
      fileSize: fileSize,
    });
    setIsLoading(false);

    // Auto-fit to view on first load
    if (fitToView && containerRef.current) {
      calculateFitScale();
    }
  }, [fitToView, fileSize]);

  const handleImageError = useCallback(() => {
    setError('Failed to load image');
    setIsLoading(false);
  }, []);

  const calculateFitScale = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const containerWidth = container.clientWidth - 40; // padding
    const containerHeight = container.clientHeight - 40;
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;

    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

    setScale(fitScale);
  }, []);

  const handleZoomIn = useCallback(() => {
    setFitToView(false);
    setScale(s => Math.min(s * 1.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitToView(false);
    setScale(s => Math.max(s / 1.25, 0.1));
  }, []);

  const handleFitToView = useCallback(() => {
    setFitToView(true);
    calculateFitScale();
  }, [calculateFitScale]);

  const handleActualSize = useCallback(() => {
    setFitToView(false);
    setScale(1);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(r => (r + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    // Open the file in default system viewer
    window.electronAPI?.file?.openInDefaultApp?.(filePath);
  }, [filePath]);

  // Auto-fit when container size changes
  useEffect(() => {
    if (!fitToView) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      calculateFitScale();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToView, calculateFitScale]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileName = filePath.split('/').pop() || 'Image';
  const fileExtension = filePath.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="image-viewer">
      <div className="image-viewer-toolbar">
        <div className="image-viewer-toolbar-left">
          <ImageIcon size={14} className="image-viewer-icon" />
          <span className="image-viewer-filename" title={fileName}>
            {fileName}
          </span>
          {metadata && (
            <span className="image-viewer-dimensions">
              {metadata.width} x {metadata.height} px
            </span>
          )}
        </div>

        <div className="image-viewer-toolbar-center">
          <button
            className="image-viewer-zoom-btn"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="image-viewer-zoom-value">{Math.round(scale * 100)}%</span>
          <button
            className="image-viewer-zoom-btn"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className={`image-viewer-fit-btn ${fitToView ? 'active' : ''}`}
            onClick={handleFitToView}
            title="Fit to view"
          >
            <Maximize size={14} />
          </button>
          <button
            className="image-viewer-rotate-btn"
            onClick={handleRotate}
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
        </div>

        <div className="image-viewer-toolbar-right">
          <button
            className="image-viewer-download-btn"
            onClick={handleDownload}
            title="Open in default app"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="image-viewer-container" ref={containerRef}>
        {isLoading && (
          <div className="image-viewer-loading">
            <ImageIcon size={48} className="image-viewer-loading-icon" />
            <span>Loading image...</span>
          </div>
        )}

        {error && (
          <div className="image-viewer-error">
            <span className="image-viewer-error-text">{error}</span>
          </div>
        )}

        <img
          ref={imageRef}
          src={imageUrl}
          alt={fileName}
          className="image-viewer-content"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            opacity: isLoading ? 0 : 1,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  );
};
