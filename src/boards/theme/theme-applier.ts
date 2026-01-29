/**
 * @fileoverview Board Theme Applier
 * 
 * Applies board themes to the DOM via CSS custom properties.
 * Integrates with the existing design system in src/ui/theme.ts.
 * 
 * @module @cardplay/boards/theme/theme-applier
 */

import type { BoardTheme } from '../types';
import { controlLevelColorsToCSSProperties } from './control-level-colors';

/**
 * Convert board theme to CSS custom properties.
 */
export function boardThemeToCSSProperties(theme: BoardTheme): Record<string, string> {
  const properties: Record<string, string> = {};
  
  // Apply color overrides
  if (theme.colors) {
    if (theme.colors.primary) {
      properties['--board-primary'] = theme.colors.primary;
    }
    if (theme.colors.secondary) {
      properties['--board-secondary'] = theme.colors.secondary;
    }
    if (theme.colors.accent) {
      properties['--board-accent'] = theme.colors.accent;
    }
    if (theme.colors.background) {
      properties['--board-background'] = theme.colors.background;
    }
  }
  
  // Apply typography overrides
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      properties['--board-font-family'] = theme.typography.fontFamily;
    }
    if (theme.typography.fontSize) {
      properties['--board-font-size'] = `${theme.typography.fontSize}px`;
    }
  }
  
  // Apply control indicator flags
  if (theme.controlIndicators) {
    properties['--board-show-hints'] = theme.controlIndicators.showHints ? '1' : '0';
    properties['--board-show-suggestions'] = theme.controlIndicators.showSuggestions ? '1' : '0';
    properties['--board-show-generative'] = theme.controlIndicators.showGenerative ? '1' : '0';
  }
  
  return properties;
}

/**
 * Apply board theme to the DOM.
 * 
 * @param theme - Board theme to apply
 * @param target - Target element (defaults to document.documentElement)
 */
export function applyBoardTheme(
  theme: BoardTheme,
  target: HTMLElement = document.documentElement
): void {
  const properties = boardThemeToCSSProperties(theme);
  
  for (const [key, value] of Object.entries(properties)) {
    target.style.setProperty(key, value);
  }
}

/**
 * Remove board theme from the DOM.
 * 
 * @param target - Target element (defaults to document.documentElement)
 */
export function removeBoardTheme(
  target: HTMLElement = document.documentElement
): void {
  const boardProperties = [
    '--board-primary',
    '--board-secondary',
    '--board-accent',
    '--board-background',
    '--board-font-family',
    '--board-font-size',
    '--board-show-hints',
    '--board-show-suggestions',
    '--board-show-generative',
  ];
  
  for (const property of boardProperties) {
    target.style.removeProperty(property);
  }
}

/**
 * Apply control level colors to the DOM.
 * 
 * @param level - Control level
 * @param target - Target element (defaults to document.documentElement)
 */
export function applyControlLevelColors(
  level: import('../types').ControlLevel,
  target: HTMLElement = document.documentElement
): void {
  const properties = controlLevelColorsToCSSProperties(level);
  
  for (const [key, value] of Object.entries(properties)) {
    target.style.setProperty(key, value);
  }
}

/**
 * Create a scoped theme applier for a specific element.
 * Useful for per-deck theming.
 */
export function createScopedThemeApplier(target: HTMLElement) {
  return {
    apply: (theme: BoardTheme) => applyBoardTheme(theme, target),
    remove: () => removeBoardTheme(target),
  };
}
