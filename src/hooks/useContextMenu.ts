import { useState, useCallback } from 'react';

interface ContextMenuState<T> {
  contextMenuPosition: { top: number; left: number } | null;
  contextMenuTarget: T | null;
  handleContextMenu: (event: React.MouseEvent, target: T) => void;
  closeContextMenu: () => void;
}

export function useContextMenu<T>(): ContextMenuState<T> {
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<T | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent, target: T) => {
    event.preventDefault();
    setContextMenuPosition({ top: event.clientY, left: event.clientX });
    setContextMenuTarget(target);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setContextMenuTarget(null);
  }, []);

  return { contextMenuPosition, contextMenuTarget, handleContextMenu, closeContextMenu };
}
