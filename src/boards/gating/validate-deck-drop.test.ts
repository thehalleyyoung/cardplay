/**
 * @fileoverview Tests for Deck Drop Validation.
 * 
 * @module @cardplay/boards/gating/validate-deck-drop.test
 */

import { describe, it, expect } from 'vitest';
import {
  validateDeckDrop,
  validateDeckDropBatch,
  getDeckConstraintsSummary,
} from './validate-deck-drop';
import type { Board } from '../types';
import type { CardMeta } from '../../cards/card';

describe('validateDeckDrop', () => {
  const mockBoard: Board = {
    id: 'test-board',
    name: 'Test Board',
    controlLevel: 'assisted',
    compositionTools: {
      phraseDatabase: { enabled: true, mode: 'drag-drop' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    primaryView: 'tracker',
    layout: {
      type: 'dock-tree',
      panels: [],
    },
    decks: [],
    difficulty: 'intermediate',
    tags: [],
  };

  const effectMeta: CardMeta = {
    id: 'reverb',
    name: 'Reverb',
    category: 'effects',
    tags: ['effect', 'manual'],
  };

  const generatorMeta: CardMeta = {
    id: 'melody-gen',
    name: 'Melody Generator',
    category: 'generators',
    tags: ['generator', 'generative'],
  };

  const instrumentMeta: CardMeta = {
    id: 'sampler',
    name: 'Sampler',
    category: 'generators', // This is correct - instruments are in generators category
    tags: ['sampler', 'playable', 'manual'], // Playable makes it manual
  };

  it('allows effect card into effects-deck', () => {
    const result = validateDeckDrop(mockBoard, 'effects-deck', effectMeta);
    expect(result.allowed).toBe(true);
  });

  it('denies generator card into effects-deck', () => {
    // Use a directed board where generators are allowed
    const directedBoard: Board = {
      ...mockBoard,
      controlLevel: 'directed',
      compositionTools: {
        ...mockBoard.compositionTools,
        phraseGenerators: { enabled: true, mode: 'on-demand' },
      },
    };
    
    const result = validateDeckDrop(directedBoard, 'effects-deck', generatorMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('effects');
  });

  it('denies generator into pattern-deck (manual board)', () => {
    const manualBoard: Board = {
      ...mockBoard,
      controlLevel: 'full-manual',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
    };

    const result = validateDeckDrop(manualBoard, 'pattern-deck', generatorMeta);
    expect(result.allowed).toBe(false);
  });

  it('allows instrument into pattern-deck', () => {
    // Use a board where generators are allowed
    const instrumentBoard: Board = {
      ...mockBoard,
      controlLevel: 'assisted',
    };
    const result = validateDeckDrop(instrumentBoard, 'pattern-deck', instrumentMeta);
    expect(result.allowed).toBe(true);
  });

  it('denies drops into mixer-deck', () => {
    const result = validateDeckDrop(mockBoard, 'mixer-deck', instrumentMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('does not accept');
  });

  it('denies drops into properties-deck', () => {
    const result = validateDeckDrop(mockBoard, 'properties-deck', instrumentMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('does not accept');
  });

  it('denies drops into instruments-deck (read-only browser)', () => {
    const result = validateDeckDrop(mockBoard, 'instruments-deck', instrumentMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Browser');
  });

  it('denies drops into phrases-deck (read-only)', () => {
    const phraseMeta: CardMeta = {
      id: 'phrase-1',
      name: 'Piano Phrase',
      category: 'utilities',
      tags: ['phrase', 'assisted'],
    };

    const result = validateDeckDrop(mockBoard, 'phrases-deck', phraseMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('read-only');
  });

  it('denies drops into samples-deck (read-only)', () => {
    const sampleMeta: CardMeta = {
      id: 'kick',
      name: 'Kick Sample',
      category: 'utilities',
      tags: ['sample', 'manual'],
    };

    const result = validateDeckDrop(mockBoard, 'samples-deck', sampleMeta);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('read-only');
  });
});

describe('validateDeckDropBatch', () => {
  const mockBoard: Board = {
    id: 'test-board',
    name: 'Test Board',
    controlLevel: 'assisted',
    compositionTools: {
      phraseDatabase: { enabled: true, mode: 'drag-drop' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    primaryView: 'tracker',
    layout: { type: 'dock-tree', panels: [] },
    decks: [],
    difficulty: 'intermediate',
    tags: [],
  };

  it('validates multiple cards at once', () => {
    const cards: CardMeta[] = [
      { id: 'reverb', name: 'Reverb', category: 'effects', tags: ['effect'] },
      { id: 'delay', name: 'Delay', category: 'effects', tags: ['effect'] },
      { id: 'gen', name: 'Generator', category: 'generators', tags: ['generative'] },
    ];

    const results = validateDeckDropBatch(mockBoard, 'effects-deck', cards);
    
    expect(results).toHaveLength(3);
    expect(results[0]!.allowed).toBe(true); // reverb ok
    expect(results[1]!.allowed).toBe(true); // delay ok
    expect(results[2]!.allowed).toBe(false); // generator denied
  });
});

describe('getDeckConstraintsSummary', () => {
  it('returns summary for effects-deck', () => {
    const summary = getDeckConstraintsSummary('effects-deck');
    expect(summary).toContain('effects');
    expect(summary.toLowerCase()).toContain('accept');
  });

  it('returns summary for mixer-deck', () => {
    const summary = getDeckConstraintsSummary('mixer-deck');
    expect(summary).toContain('Mixer');
  });

  it('returns summary for pattern-deck', () => {
    const summary = getDeckConstraintsSummary('pattern-deck');
    expect(summary).toContain('generator');
  });

  it('returns "accepts all" for unconstrained decks', () => {
    const summary = getDeckConstraintsSummary('timeline-deck');
    expect(summary.toLowerCase()).toContain('all');
  });
});
