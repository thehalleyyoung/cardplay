/**
 * @fileoverview Tests for Deck Capabilities Table
 * @module @cardplay/boards/decks/__tests__/deck-capabilities
 */

import { describe, it, expect } from 'vitest';
import {
  DECK_CAPABILITIES,
  getDeckCapabilities,
  deckReadsSpec,
  deckWritesSpec,
  deckRequestsProlog,
  deckSupportsSlotGrid,
  getDeckTypesWithCapability,
} from '../deck-capabilities';
import type { DeckType } from '../../types';

describe('Deck Capabilities', () => {
  describe('DECK_CAPABILITIES table', () => {
    it('should define capabilities for all deck types', () => {
      expect(Object.keys(DECK_CAPABILITIES).length).toBeGreaterThan(0);
    });

    it('should have valid boolean values for all capabilities', () => {
      Object.entries(DECK_CAPABILITIES).forEach(([deckType, caps]) => {
        expect(typeof caps.readsSpec).toBe('boolean');
        expect(typeof caps.writesSpec).toBe('boolean');
        expect(typeof caps.requestsProlog).toBe('boolean');
        expect(typeof caps.supportsSlotGrid).toBe('boolean');
      });
    });

    it('should require readsSpec for decks that writeSpec', () => {
      // If a deck writes to MusicSpec, it should also read it
      Object.entries(DECK_CAPABILITIES).forEach(([deckType, caps]) => {
        if (caps.writesSpec) {
          expect(caps.readsSpec).toBe(true);
        }
      });
    });
  });

  describe('getDeckCapabilities', () => {
    it('should return capabilities for known deck types', () => {
      const caps = getDeckCapabilities('harmony-deck');
      expect(caps.readsSpec).toBe(true);
      expect(caps.writesSpec).toBe(true);
      expect(caps.requestsProlog).toBe(true);
      expect(caps.supportsSlotGrid).toBe(true);
    });

    it('should return default capabilities for unknown deck types', () => {
      const caps = getDeckCapabilities('unknown-deck' as DeckType);
      expect(caps.readsSpec).toBe(false);
      expect(caps.writesSpec).toBe(false);
      expect(caps.requestsProlog).toBe(false);
      expect(caps.supportsSlotGrid).toBe(false);
    });
  });

  describe('capability helper functions', () => {
    it('deckReadsSpec should return correct value', () => {
      expect(deckReadsSpec('harmony-deck')).toBe(true);
      expect(deckReadsSpec('mixer-deck')).toBe(false);
    });

    it('deckWritesSpec should return correct value', () => {
      expect(deckWritesSpec('harmony-deck')).toBe(true);
      expect(deckWritesSpec('pattern-deck')).toBe(false);
    });

    it('deckRequestsProlog should return correct value', () => {
      expect(deckRequestsProlog('ai-advisor-deck')).toBe(true);
      expect(deckRequestsProlog('mixer-deck')).toBe(false);
    });

    it('deckSupportsSlotGrid should return correct value', () => {
      expect(deckSupportsSlotGrid('pattern-deck')).toBe(true);
      expect(deckSupportsSlotGrid('session-deck')).toBe(false);
    });
  });

  describe('getDeckTypesWithCapability', () => {
    it('should return all decks that read spec', () => {
      const decks = getDeckTypesWithCapability('readsSpec');
      expect(decks).toContain('harmony-deck');
      expect(decks).toContain('pattern-deck');
      expect(decks).not.toContain('mixer-deck');
    });

    it('should return all decks that write spec', () => {
      const decks = getDeckTypesWithCapability('writesSpec');
      expect(decks).toContain('harmony-deck');
      expect(decks).not.toContain('pattern-deck');
    });

    it('should return all decks that request prolog', () => {
      const decks = getDeckTypesWithCapability('requestsProlog');
      expect(decks).toContain('ai-advisor-deck');
      expect(decks).toContain('harmony-deck');
    });

    it('should return all decks that support slot grid', () => {
      const decks = getDeckTypesWithCapability('supportsSlotGrid');
      expect(decks).toContain('pattern-deck');
      expect(decks).toContain('harmony-deck');
      expect(decks).not.toContain('session-deck');
    });
  });

  describe('theory deck capabilities', () => {
    it('harmony-deck should have full AI integration', () => {
      const caps = getDeckCapabilities('harmony-deck');
      expect(caps.readsSpec).toBe(true);
      expect(caps.writesSpec).toBe(true);
      expect(caps.requestsProlog).toBe(true);
    });

    it('generators-deck should read spec and request prolog', () => {
      const caps = getDeckCapabilities('generators-deck');
      expect(caps.readsSpec).toBe(true);
      expect(caps.requestsProlog).toBe(true);
      expect(caps.writesSpec).toBe(false); // generators don't write constraints
    });
  });

  describe('audio deck capabilities', () => {
    it('mixer-deck should not interact with spec or prolog', () => {
      const caps = getDeckCapabilities('mixer-deck');
      expect(caps.readsSpec).toBe(false);
      expect(caps.writesSpec).toBe(false);
      expect(caps.requestsProlog).toBe(false);
    });

    it('effects-deck should support slot grid', () => {
      const caps = getDeckCapabilities('effects-deck');
      expect(caps.supportsSlotGrid).toBe(true);
    });
  });

  describe('AI deck capabilities', () => {
    it('ai-advisor-deck should read spec and request prolog', () => {
      const caps = getDeckCapabilities('ai-advisor-deck');
      expect(caps.readsSpec).toBe(true);
      expect(caps.requestsProlog).toBe(true);
    });

    it('ai-composer-deck should have full capabilities', () => {
      const caps = getDeckCapabilities('ai-composer-deck');
      expect(caps.readsSpec).toBe(true);
      expect(caps.writesSpec).toBe(true);
      expect(caps.requestsProlog).toBe(true);
    });
  });
});
