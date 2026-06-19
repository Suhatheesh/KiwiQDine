import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook for managing keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'k',
 *       ctrl: true,
 *       handler: () => searchInputRef.current?.focus(),
 *       description: 'Focus search'
 *     },
 *     {
 *       key: 'n',
 *       ctrl: true,
 *       handler: handleNewOrder,
 *       description: 'Create new order'
 *     }
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      shortcuts.forEach((shortcut) => {
        const keyMatches = shortcut.key.toLowerCase() === key;
        const ctrlMatches = shortcut.ctrl === undefined || shortcut.ctrl === ctrl;
        const shiftMatches = shortcut.shift === undefined || shortcut.shift === shift;
        const altMatches = shortcut.alt === undefined || shortcut.alt === alt;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return shortcuts for documentation/help purposes
  return shortcuts;
}

/**
 * Predefined shortcuts for common POS actions
 */
export const commonPOSShortcuts = {
  search: {
    key: 'k',
    ctrl: true,
    description: 'Focus search input',
  },
  newOrder: {
    key: 'n',
    ctrl: true,
    description: 'Create new order',
  },
  processPayment: {
    key: 'p',
    ctrl: true,
    description: 'Process payment',
  },
  hold: {
    key: 'h',
    ctrl: true,
    description: 'Hold current order',
  },
  cancel: {
    key: 'Escape',
    description: 'Cancel/Close current action',
  },
  save: {
    key: 's',
    ctrl: true,
    description: 'Save changes',
  },
  print: {
    key: 'p',
    ctrl: true,
    shift: true,
    description: 'Print invoice',
  },
  help: {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts help',
  },
};

/**
 * Hook for displaying keyboard shortcuts help modal
 */
export function useKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];

    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.alt) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());

    return keys.join(' + ');
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.description.split(' ')[0]; // Simple categorization
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return {
    shortcuts,
    groupedShortcuts,
    formatShortcut,
  };
}
