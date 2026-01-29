/**
 * @fileoverview Tests for Board Theme Defaults
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultBoardTheme,
  mergeBoardTheme,
  getBoardTheme,
  BOARD_THEME_OVERRIDES,
} from './board-theme-defaults';
import type { ControlLevel } from '../types';

describe('Board Theme Defaults', () => {
  describe('getDefaultBoardTheme', () => {
    it('should return theme for each control level', () => {
      const levels: ControlLevel[] = [
        'full-manual',
        'manual-with-hints',
        'assisted',
        'collaborative',
        'directed',
        'generative',
      ];

      for (const level of levels) {
        const theme = getDefaultBoardTheme(level);
        expect(theme.colors).toBeDefined();
        expect(theme.controlIndicators).toBeDefined();
      }
    });

    it('should set control indicators based on level', () => {
      const manualTheme = getDefaultBoardTheme('full-manual');
      expect(manualTheme.controlIndicators?.showHints).toBe(false);
      expect(manualTheme.controlIndicators?.showSuggestions).toBe(false);
      expect(manualTheme.controlIndicators?.showGenerative).toBe(false);

      const hintsTheme = getDefaultBoardTheme('manual-with-hints');
      expect(hintsTheme.controlIndicators?.showHints).toBe(true);

      const assistedTheme = getDefaultBoardTheme('assisted');
      expect(assistedTheme.controlIndicators?.showHints).toBe(true);
      expect(assistedTheme.controlIndicators?.showSuggestions).toBe(true);

      const generativeTheme = getDefaultBoardTheme('generative');
      expect(generativeTheme.controlIndicators?.showGenerative).toBe(true);
    });
  });

  describe('mergeBoardTheme', () => {
    it('should merge base theme with overrides', () => {
      const baseTheme = getDefaultBoardTheme('full-manual');
      const overrides = {
        colors: {
          primary: '#custom',
        },
      };

      const merged = mergeBoardTheme(baseTheme, overrides);
      expect(merged.colors?.primary).toBe('#custom');
      expect(merged.colors?.secondary).toBe(baseTheme.colors?.secondary);
    });

    it('should return base theme if no overrides', () => {
      const baseTheme = getDefaultBoardTheme('full-manual');
      const merged = mergeBoardTheme(baseTheme);
      expect(merged).toEqual(baseTheme);
    });
  });

  describe('getBoardTheme', () => {
    it('should return default theme without board ID', () => {
      const theme = getBoardTheme('assisted');
      expect(theme.colors?.primary).toBe('#059669');
    });

    it('should apply board-specific overrides', () => {
      const theme = getBoardTheme('full-manual', 'notation-manual');
      expect(theme.colors?.background).toBe('#ffffff');
      expect(theme.colors?.primary).toBe('#000000');
    });

    it('should handle unknown board ID gracefully', () => {
      const theme = getBoardTheme('assisted', 'unknown-board');
      expect(theme.colors?.primary).toBe('#059669');
    });
  });

  describe('BOARD_THEME_OVERRIDES', () => {
    it('should define overrides for known boards', () => {
      expect(BOARD_THEME_OVERRIDES['notation-manual']).toBeDefined();
      expect(BOARD_THEME_OVERRIDES['basic-tracker']).toBeDefined();
      expect(BOARD_THEME_OVERRIDES['basic-sampler']).toBeDefined();
      expect(BOARD_THEME_OVERRIDES['basic-session']).toBeDefined();
    });

    it('should have valid typography overrides', () => {
      const trackerOverride = BOARD_THEME_OVERRIDES['basic-tracker'];
      expect(trackerOverride?.typography?.fontFamily).toContain('mono');
    });
  });
});
