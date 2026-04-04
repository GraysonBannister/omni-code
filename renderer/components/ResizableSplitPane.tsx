import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';
import './ResizableSplitPane.css';

interface ResizableSplitPaneProps {
  primaryPane: React.ReactNode;
  secondaryPane: React.ReactNode;
  ratio: number; // 0.0 to 1.0
  orientation: 'horizontal' | 'vertical';
  onRatioChange: (ratio: number) => void;
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void;
}

export const ResizableSplitPane: React.FC<ResizableSplitPaneProps> = ({
  primaryPane,
  secondaryPane,
  ratio,
  orientation,
  onRatioChange,
  onOrientationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mousePos: 0, startRatio: ratio });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mousePos = orientation === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;
    dragStartRef.current = { mousePos, startRatio: ratio };
  }, [orientation, ratio]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentPos = orientation === 'horizontal'
      ? e.clientX - rect.left
      : e.clientY - rect.top;

    const size = orientation === 'horizontal' ? rect.width : rect.height;
    const newRatio = currentPos / size;

    onRatioChange(newRatio);
  }, [isDragging, orientation, onRatioChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  const toggleOrientation = useCallback(() => {
    onOrientationChange(orientation === 'horizontal' ? 'vertical' : 'horizontal');
  }, [orientation, onOrientationChange]);

  const clampedRatio = Math.max(0.1, Math.min(0.9, ratio));
  const primarySize = `${clampedRatio * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`resizable-split-pane ${orientation} ${isDragging ? 'dragging' : ''}`}
    >
      <div
        className="split-pane-primary"
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: primarySize,
          [orientation === 'horizontal' ? 'height' : 'width']: '100%',
        }}
      >
        {primaryPane}
      </div>

      <div
        className={`split-pane-handle ${orientation}`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        <div className="split-pane-handle-grip">
          {orientation === 'horizontal' ? '⋮' : '⋯'}
        </div>
        <button
          className="split-pane-orientation-toggle"
          onClick={toggleOrientation}
          title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} split`}
        >
          <LayoutTemplate size={12} />
        </button>
      </div>

      <div className="split-pane-secondary">
        {secondaryPane}
      </div>
    </div>
  );
};
