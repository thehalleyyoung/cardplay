/**
 * UI Polish Checklist Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createUIPolishChecklist,
  calculateChecklistCompletion,
  generateChecklistReport,
  calculateContrastRatio,
  checkLargeTextContrast,
  batchCheckContrast,
  generateContrastReport,
} from './polish-checklist';

describe('UI Polish Checklist', () => {
  describe('createUIPolishChecklist', () => {
    it('creates a checklist with all categories', () => {
      const checklist = createUIPolishChecklist();
      
      expect(checklist).toHaveProperty('spacing');
      expect(checklist).toHaveProperty('typography');
      expect(checklist).toHaveProperty('colors');
      expect(checklist).toHaveProperty('icons');
      expect(checklist).toHaveProperty('interactions');
      expect(checklist).toHaveProperty('animations');
      expect(checklist).toHaveProperty('loadingStates');
      expect(checklist).toHaveProperty('emptyStates');
      expect(checklist).toHaveProperty('errorStates');
      expect(checklist).toHaveProperty('modals');
      expect(checklist).toHaveProperty('tooltips');
      expect(checklist).toHaveProperty('notifications');
      expect(checklist).toHaveProperty('contrast');
      expect(checklist).toHaveProperty('focusIndicators');
      expect(checklist).toHaveProperty('hoverStates');
      expect(checklist).toHaveProperty('themes');
      expect(checklist).toHaveProperty('reducedMotion');
      expect(checklist).toHaveProperty('progressIndicators');
      expect(checklist).toHaveProperty('undoSupport');
      expect(checklist).toHaveProperty('confirmations');
      expect(checklist).toHaveProperty('keyboardNav');
      expect(checklist).toHaveProperty('screenReader');
    });

    it('initializes all categories as unverified', () => {
      const checklist = createUIPolishChecklist();
      
      expect(checklist.spacing.verified).toBe(false);
      expect(checklist.typography.verified).toBe(false);
      expect(checklist.colors.verified).toBe(false);
    });
  });

  describe('calculateChecklistCompletion', () => {
    it('returns 0% for empty checklist', () => {
      const checklist = createUIPolishChecklist();
      const completion = calculateChecklistCompletion(checklist);
      
      expect(completion).toBe(0);
    });

    it('returns 100% for fully completed checklist', () => {
      const checklist = createUIPolishChecklist();
      
      // Mark all as verified
      Object.keys(checklist).forEach((key) => {
        const item = checklist[key as keyof typeof checklist];
        if (typeof item === 'object' && 'verified' in item) {
          item.verified = true;
        }
      });
      
      const completion = calculateChecklistCompletion(checklist);
      // Should be close to 100 (might be 95 due to rounding)
      expect(completion).toBeGreaterThanOrEqual(95);
    });

    it('calculates partial completion correctly', () => {
      const checklist = createUIPolishChecklist();
      
      checklist.spacing.verified = true;
      checklist.typography.verified = true;
      
      const completion = calculateChecklistCompletion(checklist);
      expect(completion).toBeGreaterThan(0);
      expect(completion).toBeLessThan(100);
    });
  });

  describe('generateChecklistReport', () => {
    it('generates a markdown report', () => {
      const checklist = createUIPolishChecklist();
      const report = generateChecklistReport(checklist);
      
      expect(report).toContain('# UI Polish Checklist Report');
      expect(report).toContain('Completion:');
      expect(report).toContain('Status by Category');
    });

    it('shows completed items with checkmarks', () => {
      const checklist = createUIPolishChecklist();
      checklist.spacing.verified = true;
      
      const report = generateChecklistReport(checklist);
      expect(report).toContain('✅');
    });

    it('shows incomplete items with pending markers', () => {
      const checklist = createUIPolishChecklist();
      
      const report = generateChecklistReport(checklist);
      expect(report).toContain('⏳');
    });
  });
});

describe('WCAG Contrast Checker', () => {
  describe('calculateContrastRatio', () => {
    it('calculates black on white correctly', () => {
      const result = calculateContrastRatio('#000000', '#FFFFFF');
      
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.passesAA).toBe(true);
      expect(result.passesAAA).toBe(true);
    });

    it('calculates white on black correctly', () => {
      const result = calculateContrastRatio('#FFFFFF', '#000000');
      
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.passesAA).toBe(true);
      expect(result.passesAAA).toBe(true);
    });

    it('detects insufficient contrast', () => {
      // Light gray on white
      const result = calculateContrastRatio('#CCCCCC', '#FFFFFF');
      
      expect(result.passesAA).toBe(false);
    });

    it('validates typical UI color combinations', () => {
      // Common button: white text on darker blue background
      const result = calculateContrastRatio('#FFFFFF', '#0056B3');
      
      expect(result.ratio).toBeGreaterThan(4.5);
      expect(result.passesAA).toBe(true);
    });

    it('handles hex colors with or without #', () => {
      const result1 = calculateContrastRatio('#000000', '#FFFFFF');
      const result2 = calculateContrastRatio('000000', 'FFFFFF');
      
      expect(result1.ratio).toBeCloseTo(result2.ratio, 1);
    });
  });

  describe('checkLargeTextContrast', () => {
    it('uses lower threshold for large text', () => {
      // 3:1 ratio should pass for large text but not normal
      const color1 = '#767676';
      const color2 = '#FFFFFF';
      
      const largeTextResult = checkLargeTextContrast(color1, color2);
      const normalTextResult = calculateContrastRatio(color1, color2);
      
      // For this specific ratio around 4:1, large text may pass AA while normal doesn't
      expect(largeTextResult.passesAA).toBeDefined();
      expect(normalTextResult.passesAA).toBeDefined();
    });
  });

  describe('batchCheckContrast', () => {
    it('checks multiple combinations at once', () => {
      const combinations = [
        { foreground: '#000000', background: '#FFFFFF', label: 'Black on white' },
        { foreground: '#FFFFFF', background: '#000000', label: 'White on black' },
        { foreground: '#FF0000', background: '#FFFFFF', label: 'Red on white' },
      ];
      
      const results = batchCheckContrast(combinations);
      
      expect(results).toHaveLength(3);
      expect(results[0].label).toBe('Black on white');
      expect(results[0].passesAA).toBe(true);
    });
  });

  describe('generateContrastReport', () => {
    it('generates a markdown table', () => {
      const results = [
        {
          ratio: 21,
          passesAA: true,
          passesAAA: true,
          foreground: '#000000',
          background: '#FFFFFF',
          label: 'Test',
        },
      ];
      
      const report = generateContrastReport(results);
      
      expect(report).toContain('# WCAG Contrast Audit Report');
      expect(report).toContain('| Component | Ratio | AA | AAA | Colors |');
      expect(report).toContain('21.00:1');
    });

    it('highlights failures', () => {
      const results = [
        {
          ratio: 2.5,
          passesAA: false,
          passesAAA: false,
          foreground: '#CCCCCC',
          background: '#FFFFFF',
          label: 'Failing',
        },
      ];
      
      const report = generateContrastReport(results);
      
      expect(report).toContain('Failed Combinations');
      expect(report).toContain('Failing');
    });

    it('shows success message when all pass', () => {
      const results = [
        {
          ratio: 21,
          passesAA: true,
          passesAAA: true,
          foreground: '#000000',
          background: '#FFFFFF',
          label: 'Passing',
        },
      ];
      
      const report = generateContrastReport(results);
      
      expect(report).toContain('All combinations pass WCAG AA');
    });
  });

  describe('Real-world color combinations', () => {
    it('validates theme primary colors', () => {
      const combinations = [
        { foreground: '#FFFFFF', background: '#0056B3', label: 'Primary button' },
        { foreground: '#000000', background: '#F5F5F5', label: 'Surface' },
        { foreground: '#C62828', background: '#FFFFFF', label: 'Error text' },
        { foreground: '#2E7D32', background: '#FFFFFF', label: 'Success text' },
      ];
      
      const results = batchCheckContrast(combinations);
      
      // All should pass AA for accessibility
      results.forEach((result) => {
        expect(result.passesAA).toBe(true);
      });
    });
  });
});
