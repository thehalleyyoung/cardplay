/**
 * Tests for card filtering by control level.
 */

import { describe, it, expect } from 'vitest';
import {
  categoryToKind,
  getCardKind,
  isCardAllowed,
  filterCardsByLevel,
  filterCardMetaByLevel,
  getVisibleCards,
} from './card-filtering';
import { createCardMeta } from './card';

describe('card-filtering', () => {
  describe('categoryToKind', () => {
    it('maps generators to generator', () => {
      expect(categoryToKind('generators')).toBe('generator');
    });

    it('maps effects to effect', () => {
      expect(categoryToKind('effects')).toBe('effect');
    });

    it('maps transforms and filters to processor', () => {
      expect(categoryToKind('transforms')).toBe('processor');
      expect(categoryToKind('filters')).toBe('processor');
    });

    it('maps routing, analysis, utilities to utility', () => {
      expect(categoryToKind('routing')).toBe('utility');
      expect(categoryToKind('analysis')).toBe('utility');
      expect(categoryToKind('utilities')).toBe('utility');
    });

    it('maps custom to utility', () => {
      expect(categoryToKind('custom')).toBe('utility');
    });
  });

  describe('getCardKind', () => {
    it('extracts kind from explicit kind tag', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'generators', {
        tags: ['kind:control', 'synth'],
      });
      expect(getCardKind(meta)).toBe('control');
    });

    it('falls back to category mapping when no kind tag', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'generators', {
        tags: ['synth', 'lead'],
      });
      expect(getCardKind(meta)).toBe('generator');
    });

    it('handles no tags', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'effects');
      expect(getCardKind(meta)).toBe('effect');
    });
  });

  describe('isCardAllowed', () => {
    it('allows generators at basic level', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'generators');
      expect(isCardAllowed(meta, 'basic')).toBe(true);
    });

    it('allows effects at basic level', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'effects');
      expect(isCardAllowed(meta, 'basic')).toBe(true);
    });

    it('allows utilities at basic level', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'utilities');
      expect(isCardAllowed(meta, 'basic')).toBe(true);
    });

    it('disallows processors at basic level', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'transforms');
      expect(isCardAllowed(meta, 'basic')).toBe(false);
    });

    it('allows processors at standard level', () => {
      const meta = createCardMeta('test:card', 'Test Card', 'transforms');
      expect(isCardAllowed(meta, 'standard')).toBe(true);
    });

    it('disallows theory cards at standard level', () => {
      const meta = createCardMeta('theory:scale', 'Scale', 'utilities', {
        tags: ['kind:theory'],
      });
      expect(isCardAllowed(meta, 'standard')).toBe(false);
    });

    it('allows theory cards at advanced level', () => {
      const meta = createCardMeta('theory:scale', 'Scale', 'utilities', {
        tags: ['kind:theory'],
      });
      expect(isCardAllowed(meta, 'advanced')).toBe(true);
    });

    it('disallows experimental cards at advanced level', () => {
      const meta = createCardMeta('test:experimental', 'Experimental', 'utilities', {
        tags: ['kind:experimental'],
      });
      expect(isCardAllowed(meta, 'advanced')).toBe(false);
    });

    it('allows experimental cards at expert level', () => {
      const meta = createCardMeta('test:experimental', 'Experimental', 'utilities', {
        tags: ['kind:experimental'],
      });
      expect(isCardAllowed(meta, 'expert')).toBe(true);
    });
  });

  describe('filterCardsByLevel', () => {
    const cards = [
      {
        id: 'gen1',
        meta: createCardMeta('test:gen1', 'Generator 1', 'generators'),
      },
      {
        id: 'eff1',
        meta: createCardMeta('test:eff1', 'Effect 1', 'effects'),
      },
      {
        id: 'trans1',
        meta: createCardMeta('test:trans1', 'Transform 1', 'transforms'),
      },
      {
        id: 'theory1',
        meta: createCardMeta('theory:scale', 'Scale', 'utilities', {
          tags: ['kind:theory'],
        }),
      },
      {
        id: 'exp1',
        meta: createCardMeta('test:exp1', 'Experimental', 'utilities', {
          tags: ['kind:experimental'],
        }),
      },
    ];

    it('filters to basic cards at basic level', () => {
      const filtered = filterCardsByLevel(cards, 'basic');
      expect(filtered).toHaveLength(2);
      expect(filtered.map(c => c.id)).toEqual(['gen1', 'eff1']);
    });

    it('filters to standard cards at standard level', () => {
      const filtered = filterCardsByLevel(cards, 'standard');
      expect(filtered).toHaveLength(3);
      expect(filtered.map(c => c.id)).toEqual(['gen1', 'eff1', 'trans1']);
    });

    it('filters to advanced cards at advanced level', () => {
      const filtered = filterCardsByLevel(cards, 'advanced');
      expect(filtered).toHaveLength(4);
      expect(filtered.map(c => c.id)).toEqual(['gen1', 'eff1', 'trans1', 'theory1']);
    });

    it('includes all cards at expert level', () => {
      const filtered = filterCardsByLevel(cards, 'expert');
      expect(filtered).toHaveLength(5);
      expect(filtered.map(c => c.id)).toEqual(['gen1', 'eff1', 'trans1', 'theory1', 'exp1']);
    });
  });

  describe('filterCardMetaByLevel', () => {
    const metas = [
      createCardMeta('test:gen1', 'Generator 1', 'generators'),
      createCardMeta('test:eff1', 'Effect 1', 'effects'),
      createCardMeta('test:trans1', 'Transform 1', 'transforms'),
    ];

    it('filters card metadata', () => {
      const filtered = filterCardMetaByLevel(metas, 'basic');
      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.id)).toEqual(['test:gen1', 'test:eff1']);
    });
  });

  describe('getVisibleCards', () => {
    const cards = [
      {
        id: 'gen1',
        meta: createCardMeta('test:gen1', 'Generator 1', 'generators', {
          tags: ['synth'],
        }),
      },
      {
        id: 'gen2',
        meta: createCardMeta('test:gen2', 'Generator 2', 'generators', {
          tags: ['drum'],
        }),
      },
      {
        id: 'eff1',
        meta: createCardMeta('test:eff1', 'Effect 1', 'effects'),
      },
    ];

    it('returns cards filtered by level only', () => {
      const visible = getVisibleCards(cards, 'basic');
      expect(visible).toHaveLength(3);
    });

    it('applies additional filter', () => {
      const visible = getVisibleCards(cards, 'basic', card =>
        card.meta.tags?.includes('synth') ?? false
      );
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('gen1');
    });

    it('combines level and additional filters', () => {
      const cards2 = [
        ...cards,
        {
          id: 'trans1',
          meta: createCardMeta('test:trans1', 'Transform 1', 'transforms', {
            tags: ['synth'],
          }),
        },
      ];

      const visible = getVisibleCards(cards2, 'basic', card =>
        card.meta.tags?.includes('synth') ?? false
      );
      // Only gen1 should pass (basic level + synth tag)
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('gen1');
    });
  });
});
