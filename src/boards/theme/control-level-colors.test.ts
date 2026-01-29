/**
 * @fileoverview Tests for Control Level Colors
 */

import { describe, it, expect } from 'vitest';
import {
  CONTROL_LEVEL_COLORS,
  getControlLevelColors,
  getControlLevelBadgeColor,
  getControlLevelPrimaryColor,
  controlLevelColorsToCSSProperties,
} from './control-level-colors';
import type { ControlLevel } from '../types';

describe('Control Level Colors', () => {
  describe('CONTROL_LEVEL_COLORS', () => {
    it('should define colors for all control levels', () => {
      const levels: ControlLevel[] = [
        'full-manual',
        'manual-with-hints',
        'assisted',
        'collaborative',
        'directed',
        'generative',
      ];

      for (const level of levels) {
        expect(CONTROL_LEVEL_COLORS[level]).toBeDefined();
        expect(CONTROL_LEVEL_COLORS[level].primary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(CONTROL_LEVEL_COLORS[level].badge).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should have unique primary colors for each level', () => {
      const primaryColors = Object.values(CONTROL_LEVEL_COLORS).map(c => c.primary);
      const uniqueColors = new Set(primaryColors);
      expect(uniqueColors.size).toBe(6);
    });
  });

  describe('getControlLevelColors', () => {
    it('should return correct colors for full-manual', () => {
      const colors = getControlLevelColors('full-manual');
      expect(colors.primary).toBe('#2563eb');
      expect(colors.text).toBe('#1e3a8a');
    });

    it('should return correct colors for generative', () => {
      const colors = getControlLevelColors('generative');
      expect(colors.primary).toBe('#9333ea');
      expect(colors.badge).toBe('#9333ea');
    });
  });

  describe('getControlLevelBadgeColor', () => {
    it('should return badge color', () => {
      const color = getControlLevelBadgeColor('assisted');
      expect(color).toBe('#059669');
    });
  });

  describe('getControlLevelPrimaryColor', () => {
    it('should return primary color', () => {
      const color = getControlLevelPrimaryColor('directed');
      expect(color).toBe('#dc2626');
    });
  });

  describe('controlLevelColorsToCSSProperties', () => {
    it('should convert colors to CSS custom properties', () => {
      const props = controlLevelColorsToCSSProperties('full-manual');
      expect(props['--control-level-primary']).toBe('#2563eb');
      expect(props['--control-level-badge']).toBe('#2563eb');
      expect(Object.keys(props)).toHaveLength(6);
    });

    it('should support custom prefix', () => {
      const props = controlLevelColorsToCSSProperties('assisted', '--custom');
      expect(props['--custom-primary']).toBe('#059669');
      expect(props['--custom-badge']).toBe('#059669');
    });
  });
});
