/**
 * @fileoverview Accessibility Helper (K018)
 * 
 * Documentation and utilities for keyboard navigation and screen reader support.
 */

export interface AccessibilityShortcut {
  keys: string;
  action: string;
  context: string;
  ariaLabel: string;
}

export const GLOBAL_SHORTCUTS: AccessibilityShortcut[] = [
  { keys: 'Cmd+B', action: 'Open board switcher', context: 'global', ariaLabel: 'Switch board' },
  { keys: 'Cmd+Z', action: 'Undo', context: 'global', ariaLabel: 'Undo last action' },
  { keys: 'Space', action: 'Play/Pause', context: 'global', ariaLabel: 'Toggle playback' },
  { keys: 'Escape', action: 'Close modal', context: 'global', ariaLabel: 'Cancel' },
];

export const ARIA_ROLES = {
  BOARD_HOST: 'main',
  BOARD_SWITCHER: 'dialog',
  DECK: 'region',
  DECK_TABS: 'tablist',
  SESSION_GRID: 'grid',
};

export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches ||
         window.matchMedia('(forced-colors: active)').matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function meetsWCAGContrast(_fg: string, _bg: string, _large: boolean = false): boolean {
  // Simplified contrast check - would need full implementation
  return true; // Stub for now
}
