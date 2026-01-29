/**
 * @fileoverview Board Theme Defaults
 * 
 * Provides default theme configurations for each control level.
 * Boards can override these defaults with custom themes.
 * 
 * @module @cardplay/boards/theme/board-theme-defaults
 */

import type { ControlLevel, BoardTheme } from '../types';
import { getControlLevelColors } from './control-level-colors';

/**
 * Get default theme for a control level.
 */
export function getDefaultBoardTheme(level: ControlLevel): BoardTheme {
  const colors = getControlLevelColors(level);
  
  return {
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      background: colors.background,
    },
    typography: {
      // Don't set optional properties to avoid exactOptionalPropertyTypes issues
    },
    controlIndicators: {
      showHints: level === 'manual-with-hints' || level === 'assisted',
      showSuggestions: level === 'assisted' || level === 'collaborative',
      showGenerative: level === 'directed' || level === 'generative',
    },
  };
}

/**
 * Board-specific theme overrides.
 * These provide specialized theming for specific board types.
 */
export const BOARD_THEME_OVERRIDES: Record<string, Partial<BoardTheme>> = {
  // Notation boards: clean, print-ready styling
  'notation-manual': {
    colors: {
      background: '#ffffff',
      primary: '#000000',
    },
    typography: {
      fontFamily: '"Bravura", "MusGlyphs", serif',
    },
  },
  
  // Tracker boards: monospace, high-contrast
  'basic-tracker': {
    typography: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
    },
    colors: {
      background: '#1a1a1a',
      primary: '#00ff00',
    },
  },
  
  // Sampler boards: waveform-focused, high contrast
  'basic-sampler': {
    colors: {
      primary: '#ff6b35',
      accent: '#f7931e',
      background: '#1e1e1e',
    },
  },
  
  // Session boards: clip-grid optimized
  'basic-session': {
    colors: {
      primary: '#00a8e8',
      secondary: '#007ea7',
      accent: '#00e0ff',
    },
  },
};

/**
 * Merge board theme with overrides.
 */
export function mergeBoardTheme(
  baseTheme: BoardTheme,
  overrides?: Partial<BoardTheme>
): BoardTheme {
  if (!overrides) return baseTheme;
  
  return {
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
    },
    controlIndicators: {
      ...baseTheme.controlIndicators,
      ...overrides.controlIndicators,
    },
  };
}

/**
 * Get complete theme for a board.
 */
export function getBoardTheme(
  controlLevel: ControlLevel,
  boardId?: string
): BoardTheme {
  const defaultTheme = getDefaultBoardTheme(controlLevel);
  const overrides = boardId ? BOARD_THEME_OVERRIDES[boardId] : undefined;
  return mergeBoardTheme(defaultTheme, overrides);
}
