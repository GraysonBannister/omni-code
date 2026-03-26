import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[ContextMenu] Mounted at', x, y, 'with', items.length, 'items');

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        console.log('[ContextMenu] Click outside, closing');
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[ContextMenu] Escape pressed, closing');
        onClose();
      }
    };

    // Use setTimeout so the mousedown that opened the menu doesn't immediately close it
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 0);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, x, y, items.length]);

  // Clamp position to stay within viewport
  const menuWidth = 220;
  const estimatedMenuHeight = items.length * 28 + 8;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(y, window.innerHeight - estimatedMenuHeight - 8);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || !item.action) return;
    console.log('[ContextMenu] Action clicked:', item.id, item.label);
    item.action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="context-menu-divider" />;
        }
        return (
          <div
            key={item.id}
            className={`context-menu-item${item.disabled ? ' disabled' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <span className="context-menu-item-icon">{item.icon}</span>}
            <span className="context-menu-item-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-item-shortcut">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
