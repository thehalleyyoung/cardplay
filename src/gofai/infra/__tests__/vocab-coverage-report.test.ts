/**
 * Tests for vocabulary coverage report (Step 098).
 *
 * @module gofai/infra/__tests__/vocab-coverage-report
 */

import { describe, it, expect } from 'vitest';
import {
  generateVocabCoverageReport,
  formatCoverageReport,
  type VocabCoverageReport,
} from '../vocab-coverage-report';

describe('vocab-coverage-report', () => {
  describe('generateVocabCoverageReport', () => {
    it('should generate a complete coverage report', () => {
      const report = generateVocabCoverageReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.stats).toBeDefined();
      expect(report.cards).toBeDefined();
      expect(report.boards).toBeDefined();
      expect(report.decks).toBeDefined();
      expect(report.criticalGaps).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should calculate coverage statistics correctly', () => {
      const report = generateVocabCoverageReport();

      expect(report.stats.totalCards).toBeGreaterThan(0);
      expect(report.stats.totalBoards).toBeGreaterThan(0);
      expect(report.stats.totalDecks).toBeGreaterThan(0);

      expect(report.stats.cardsCoveragePercent).toBeGreaterThanOrEqual(0);
      expect(report.stats.cardsCoveragePercent).toBeLessThanOrEqual(100);

      expect(report.stats.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.stats.overallScore).toBeLessThanOrEqual(100);
    });

    it('should identify critical gaps', () => {
      const report = generateVocabCoverageReport();

      // Should have some gaps in sample data
      expect(report.criticalGaps).toBeDefined();

      // Gaps should be properly structured
      for (const gap of report.criticalGaps) {
        expect(gap.entityType).toMatch(/^(card|board|deck)$/);
        expect(gap.entityId).toBeDefined();
        expect(gap.entityName).toBeDefined();
        expect(gap.gap).toBeDefined();
        expect(gap.priority).toBeGreaterThan(0);
      }
    });

    it('should provide recommendations', () => {
      const report = generateVocabCoverageReport();

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);

      for (const rec of report.recommendations) {
        expect(rec).toBeDefined();
        expect(rec.length).toBeGreaterThan(0);
      }
    });

    it('should analyze card coverage', () => {
      const report = generateVocabCoverageReport();

      expect(report.cards.length).toBeGreaterThan(0);

      for (const card of report.cards) {
        expect(card.cardId).toBeDefined();
        expect(card.displayName).toBeDefined();
        expect(card.level).toMatch(/^(none|minimal|partial|good|excellent)$/);
        expect(card.score).toBeGreaterThanOrEqual(0);
        expect(card.score).toBeLessThanOrEqual(100);
      }
    });

    it('should analyze board coverage', () => {
      const report = generateVocabCoverageReport();

      expect(report.boards.length).toBeGreaterThan(0);

      for (const board of report.boards) {
        expect(board.boardId).toBeDefined();
        expect(board.displayName).toBeDefined();
        expect(board.level).toMatch(/^(none|minimal|partial|good|excellent)$/);
        expect(board.score).toBeGreaterThanOrEqual(0);
        expect(board.score).toBeLessThanOrEqual(100);
      }
    });

    it('should analyze deck coverage', () => {
      const report = generateVocabCoverageReport();

      expect(report.decks.length).toBeGreaterThan(0);

      for (const deck of report.decks) {
        expect(deck.deckTypeId).toBeDefined();
        expect(deck.displayName).toBeDefined();
        expect(deck.level).toMatch(/^(none|minimal|partial|good|excellent)$/);
        expect(deck.score).toBeGreaterThanOrEqual(0);
        expect(deck.score).toBeLessThanOrEqual(100);
      }
    });

    it('should work with custom entity lists', () => {
      const customCards = [
        { id: 'card:test1', name: 'Test Card 1' },
        { id: 'card:test2', name: 'Test Card 2' },
      ];

      const report = generateVocabCoverageReport({ cards: customCards });

      expect(report.cards.length).toBe(2);
      expect(report.cards[0]?.cardId).toBe('card:test1');
      expect(report.cards[1]?.cardId).toBe('card:test2');
    });
  });

  describe('formatCoverageReport', () => {
    it('should format a report as readable text', () => {
      const report = generateVocabCoverageReport();
      const formatted = formatCoverageReport(report);

      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);

      // Should contain key sections
      expect(formatted).toContain('OVERALL STATISTICS');
      expect(formatted).toContain('Coverage Report');
      expect(formatted).toContain('Cards:');
      expect(formatted).toContain('Boards:');
      expect(formatted).toContain('Decks:');
    });

    it('should include critical gaps in output', () => {
      const report = generateVocabCoverageReport();
      const formatted = formatCoverageReport(report);

      if (report.criticalGaps.length > 0) {
        expect(formatted).toContain('CRITICAL GAPS');
      }
    });

    it('should include recommendations in output', () => {
      const report = generateVocabCoverageReport();
      const formatted = formatCoverageReport(report);

      if (report.recommendations.length > 0) {
        expect(formatted).toContain('RECOMMENDATIONS');
      }
    });
  });
});
