import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Provides power-user functionality with keyboard navigation
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach((shortcut) => {
      const {
        key,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        metaKey = false,
        action,
      } = shortcut;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? metaKey : ctrlKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === modifierKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === (isMac ? metaKey : false)
      ) {
        event.preventDefault();
        action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Common keyboard shortcuts for the application
 */
export const COMMON_SHORTCUTS = {
  CREATE_PROJECT: { key: 'n', ctrlKey: true, description: 'Create new project' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Open search' },
  UPLOAD: { key: 'u', ctrlKey: true, description: 'Upload files' },
  SAVE: { key: 's', ctrlKey: true, description: 'Save changes' },
  ESCAPE: { key: 'Escape', description: 'Close dialog/panel' },
} as const;

