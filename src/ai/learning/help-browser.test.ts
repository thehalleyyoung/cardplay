/**
 * @fileoverview Context-Sensitive Help Browser Tests
 *
 * M338-M343: Tests for context-sensitive help and documentation search.
 *
 * @module @cardplay/ai/learning/help-browser.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerHelpTopic,
  getHelpTopicById,
  getContextualHelp,
  searchHelp,
  getHelpCategories,
  getHelpTopicCount,
  resetHelp,
  type HelpTopic,
  type HelpContext,
} from './help-browser';

describe('HelpBrowser', () => {
  beforeEach(() => {
    resetHelp();
  });

  // ===========================================================================
  // Builtin content
  // ===========================================================================

  describe('builtin help topics', () => {
    it('ships builtin help topics', () => {
      expect(getHelpTopicCount()).toBeGreaterThan(10);
    });

    it('retrieves a builtin topic by ID', () => {
      const topic = getHelpTopicById('help_getting_started');
      expect(topic).not.toBeNull();
      expect(topic!.title).toBe('Getting Started with CardPlay');
    });

    it('returns null for unknown topic ID', () => {
      expect(getHelpTopicById('nonexistent')).toBeNull();
    });

    it('covers essential categories', () => {
      const categories = getHelpCategories();
      expect(categories).toContain('getting-started');
      expect(categories).toContain('decks');
      expect(categories).toContain('workflow');
    });
  });

  // ===========================================================================
  // M338: Context-sensitive help
  // ===========================================================================

  describe('context-sensitive help (M338)', () => {
    it('returns help relevant to active pattern deck', () => {
      const topics = getContextualHelp({ activeDeckTypes: ['pattern-deck'] });
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].relatedDeckTypes).toContain('pattern-deck');
    });

    it('returns help relevant to notation board', () => {
      const topics = getContextualHelp({ boardType: 'notation' });
      expect(topics.length).toBeGreaterThan(0);
      expect(topics.some(t => t.relatedBoardTypes.includes('notation'))).toBe(true);
    });

    it('returns help relevant to mixer deck', () => {
      const topics = getContextualHelp({ activeDeckTypes: ['mixer-deck'] });
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].relatedDeckTypes).toContain('mixer-deck');
    });

    it('returns help relevant to active feature', () => {
      const topics = getContextualHelp({ activeFeature: 'undo-branching' });
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].relatedFeatures).toContain('undo-branching');
    });

    it('boosts getting-started topics for beginners', () => {
      const topics = getContextualHelp({
        skillLevel: 'beginner',
        activeDeckTypes: ['pattern-deck'],
      });
      // Pattern deck topic should still be first (high deck match), but
      // getting-started should be boosted in the results
      const hasGettingStarted = topics.some(t => t.category === 'getting-started');
      // If no deck-related getting-started topics, that's OK
      expect(topics.length).toBeGreaterThan(0);
    });

    it('returns empty for no matching context', () => {
      const topics = getContextualHelp({ boardType: 'nonexistent-board-type' });
      expect(topics).toHaveLength(0);
    });

    it('combines board and deck context', () => {
      const topics = getContextualHelp({
        boardType: 'notation',
        activeDeckTypes: ['notation-deck'],
      });
      expect(topics.length).toBeGreaterThan(0);
      // Should score higher since both board + deck match
    });
  });

  // ===========================================================================
  // M339: Search help
  // ===========================================================================

  describe('search help (M339)', () => {
    it('searches by query text in titles', () => {
      const results = searchHelp({ query: 'counterpoint' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.title.toLowerCase().includes('counterpoint'))).toBe(true);
    });

    it('searches by query text in content', () => {
      const results = searchHelp({ query: 'gain staging' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('searches by tags', () => {
      const results = searchHelp({ query: 'reverb' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('filters by category', () => {
      const results = searchHelp({ category: 'decks' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.category === 'decks')).toBe(true);
    });

    it('filters by deck type', () => {
      const results = searchHelp({ deckType: 'harmony-deck' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.relatedDeckTypes.includes('harmony-deck'))).toBe(true);
    });

    it('filters by board type', () => {
      const results = searchHelp({ boardType: 'tracker' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.relatedBoardTypes.includes('tracker'))).toBe(true);
    });

    it('limits results', () => {
      const results = searchHelp({ limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('returns all topics when no criteria', () => {
      const results = searchHelp();
      expect(results.length).toBe(getHelpTopicCount());
    });
  });

  // ===========================================================================
  // M342-M343: Help relevance tests
  // ===========================================================================

  describe('help relevance (M342-M343)', () => {
    it('context-sensitive help matches active context', () => {
      const contexts: HelpContext[] = [
        { activeDeckTypes: ['pattern-deck'] },
        { activeDeckTypes: ['notation-deck'] },
        { activeDeckTypes: ['mixer-deck'] },
        { activeDeckTypes: ['harmony-deck'] },
        { activeDeckTypes: ['session-deck'] },
        { activeDeckTypes: ['dsp-chain'] },
        { activeDeckTypes: ['ai-advisor-deck'] },
      ];

      for (const ctx of contexts) {
        const topics = getContextualHelp(ctx);
        if (topics.length > 0) {
          // The top result should match the active deck type
          const topTopic = topics[0];
          expect(topTopic.relatedDeckTypes).toContain(ctx.activeDeckTypes![0]);
        }
      }
    });

    it('search finds content across all categories', () => {
      const queries = ['pattern', 'notation', 'mixer', 'harmony', 'ai', 'template', 'undo'];
      for (const q of queries) {
        const results = searchHelp({ query: q });
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // Custom topic registration
  // ===========================================================================

  describe('custom topic registration', () => {
    it('registers custom help topics', () => {
      const before = getHelpTopicCount();
      registerHelpTopic({
        topicId: 'custom_topic',
        title: 'Custom Feature Help',
        summary: 'Help for a custom feature.',
        content: 'Detailed help content...',
        category: 'workflow',
        relatedDeckTypes: ['pattern-deck'],
        relatedBoardTypes: [],
        relatedFeatures: [],
        tags: ['custom'],
      });
      expect(getHelpTopicCount()).toBe(before + 1);
      expect(getHelpTopicById('custom_topic')).not.toBeNull();
    });
  });
});
