/**
 * Keyboard shortcuts and accessibility utilities
 */

import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+enter', 'shift+t') */
  key: string;
  /** Action to perform when shortcut is triggered */
  action: () => void;
  /** Description of the shortcut for help display */
  description: string;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

/**
 * Parse a key combination string into its components
 * @param keyCombination Key combination string (e.g., 'ctrl+enter')
 * @returns Object with modifier keys and main key
 */
function parseKeyCombination(keyCombination: string): {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  key: string;
} {
  const parts = keyCombination.toLowerCase().split('+');
  const key = parts.pop() || '';

  return {
    ctrlKey: parts.includes('ctrl') || parts.includes('control'),
    shiftKey: parts.includes('shift'),
    altKey: parts.includes('alt'),
    metaKey: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    key
  };
}

/**
 * Hook for registering keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if target is an input or textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;

      const { ctrlKey, shiftKey, altKey, metaKey, key } = parseKeyCombination(shortcut.key);

      if (
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey &&
        event.key.toLowerCase() === key
      ) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Generate a help text for keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts
 * @returns Formatted help text
 */
export function generateShortcutsHelp(shortcuts: KeyboardShortcut[]): string {
  return shortcuts
    .filter(shortcut => shortcut.enabled !== false)
    .map(shortcut => `${shortcut.key}: ${shortcut.description}`)
    .join('\n');
}

/**
 * Format a key combination for display
 * @param keyCombination Key combination string (e.g., 'ctrl+enter')
 * @returns Formatted key combination for display
 */
export function formatKeyboardShortcut(keyCombination: string): string {
  return keyCombination
    .split('+')
    .map(part => {
      switch (part.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'Ctrl';
        case 'shift':
          return 'Shift';
        case 'alt':
          return 'Alt';
        case 'meta':
        case 'cmd':
        case 'command':
          return 'Cmd';
        case 'enter':
          return 'Enter';
        case 'escape':
        case 'esc':
          return 'Esc';
        default:
          return part.charAt(0).toUpperCase() + part.slice(1);
      }
    })
    .join(' + ');
}

/**
 * Default keyboard shortcuts for the application
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'ctrl+enter',
    action: () => { }, // Placeholder, should be replaced with actual action
    description: '翻译文本'
  },
  {
    key: 'ctrl+shift+s',
    action: () => { }, // Placeholder
    description: '交换语言'
  },
  {
    key: 'escape',
    action: () => { }, // Placeholder
    description: '取消翻译'
  },
  {
    key: 'ctrl+shift+c',
    action: () => { }, // Placeholder
    description: '复制翻译结果'
  },
  {
    key: 'ctrl+shift+x',
    action: () => { }, // Placeholder
    description: '清空输入'
  }
];