/**
 * @fileoverview Tests for Card Allowance Query System.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { getCardRegistry } from '../../cards/registry';
import { createCard, createSignature } from '../../cards/card';
import { registerBuiltinBoards } from '../builtins';
import {
  getAllowedCardEntries,
  getAllCardEntries,
  getAllowedCardMeta,
  getAllowedCardIds,
  isCardIdAllowed,
  groupAllowedCardsByCategory,
  searchAllowedCards,
} from './get-allowed-cards';

describe('get-allowed-cards', () => {
  beforeEach(() => {
    // Register builtin boards for tests
    registerBuiltinBoards();
    
    // Get registries
    const cardRegistry = getCardRegistry();
    const boardRegistry = getBoardRegistry();
    
    // Register test cards
    const manualCard = createCard({
      meta: {
        id: 'test-manual-instrument',
        name: 'Manual Instrument',
        category: 'generators',
        tags: ['manual', 'instrument', 'piano'],
        description: 'A manual piano instrument',
      },
      signature: createSignature([], []),
      create: () => ({ state: {}, outputs: [], params: {} }),
    });
    
    const generatorCard = createCard({
      meta: {
        id: 'test-melody-generator',
        name: 'Melody Generator',
        category: 'generators',
        tags: ['generative', 'melody', 'AI'],
        description: 'Generates melodies automatically',
      },
      signature: createSignature([], []),
      create: () => ({ state: {}, outputs: [], params: {} }),
    });
    
    const effectCard = createCard({
      meta: {
        id: 'test-reverb',
        name: 'Reverb',
        category: 'effects',
        tags: ['effect', 'reverb', 'spatial'],
        description: 'Reverb effect',
      },
      signature: createSignature([], []),
      create: () => ({ state: {}, outputs: [], params: {} }),
    });
    
    cardRegistry.register(manualCard);
    cardRegistry.register(generatorCard);
    cardRegistry.register(effectCard);
  });
  
  describe('getAllowedCardEntries', () => {
    it('returns only manual cards for manual board', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const allowed = getAllowedCardEntries(board);
      const ids = allowed.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
      expect(ids).toContain('test-reverb');
      expect(ids).not.toContain('test-melody-generator');
    });
    
    it('includes generators for assisted boards', () => {
      const board = getBoardRegistry().get('tracker-phrases');
      if (!board) throw new Error('Board not found');
      
      const allowed = getAllowedCardEntries(board);
      const ids = allowed.map(e => e.card.meta.id);
      
      // Phrase board allows manual but not full generative
      expect(ids).toContain('test-manual-instrument');
      expect(ids).toContain('test-reverb');
    });
  });
  
  describe('getAllCardEntries', () => {
    it('filters cards when includeDisabled is false', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const filtered = getAllCardEntries(board, false);
      const ids = filtered.map(e => e.card.meta.id);
      
      expect(ids).not.toContain('test-melody-generator');
    });
    
    it('returns all cards when includeDisabled is true', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const all = getAllCardEntries(board, true);
      const ids = all.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
      expect(ids).toContain('test-melody-generator');
      expect(ids).toContain('test-reverb');
    });
  });
  
  describe('getAllowedCardMeta', () => {
    it('returns metadata for allowed cards', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const meta = getAllowedCardMeta(board);
      const ids = meta.map(m => m.id);
      
      expect(ids).toContain('test-manual-instrument');
      expect(ids).not.toContain('test-melody-generator');
    });
  });
  
  describe('getAllowedCardIds', () => {
    it('returns IDs for allowed cards', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const ids = getAllowedCardIds(board);
      
      expect(ids).toContain('test-manual-instrument');
      expect(ids).not.toContain('test-melody-generator');
    });
  });
  
  describe('isCardIdAllowed', () => {
    it('returns true for allowed card ID', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      expect(isCardIdAllowed(board, 'test-manual-instrument')).toBe(true);
      expect(isCardIdAllowed(board, 'test-reverb')).toBe(true);
    });
    
    it('returns false for disallowed card ID', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      expect(isCardIdAllowed(board, 'test-melody-generator')).toBe(false);
    });
    
    it('returns false for non-existent card ID', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      expect(isCardIdAllowed(board, 'non-existent-card')).toBe(false);
    });
  });
  
  describe('groupAllowedCardsByCategory', () => {
    it('groups cards by category', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const grouped = groupAllowedCardsByCategory(board);
      
      const generators = grouped.get('generators') ?? [];
      const effects = grouped.get('effects') ?? [];
      
      expect(generators.length).toBeGreaterThan(0);
      expect(effects.length).toBeGreaterThan(0);
      
      const generatorIds = generators.map(e => e.card.meta.id);
      expect(generatorIds).toContain('test-manual-instrument');
      expect(generatorIds).not.toContain('test-melody-generator');
    });
  });
  
  describe('searchAllowedCards', () => {
    it('searches by name', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const results = searchAllowedCards(board, 'Manual');
      const ids = results.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
    });
    
    it('searches by description', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const results = searchAllowedCards(board, 'piano');
      const ids = results.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
    });
    
    it('searches by tags', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const results = searchAllowedCards(board, 'instrument');
      const ids = results.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
    });
    
    it('is case insensitive', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const results = searchAllowedCards(board, 'MANUAL');
      const ids = results.map(e => e.card.meta.id);
      
      expect(ids).toContain('test-manual-instrument');
    });
    
    it('excludes disallowed cards from search', () => {
      const board = getBoardRegistry().get('basic-tracker');
      if (!board) throw new Error('Board not found');
      
      const results = searchAllowedCards(board, 'melody');
      const ids = results.map(e => e.card.meta.id);
      
      expect(ids).not.toContain('test-melody-generator');
    });
  });
});
