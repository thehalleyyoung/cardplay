/**
 * @fileoverview Is Card Allowed Tests
 */

import { describe, it, expect } from 'vitest';
import { isCardAllowed, filterAllowedCards, partitionCardsByAllowance } from './is-card-allowed';
import { createCardMeta } from '../../cards/card';
import type { Board } from '../types';

// Helper to create a minimal board for testing
function createTestBoard(overrides?: Partial<Board>): Board {
  return {
    id: 'test-board',
    name: 'Test Board',
    description: 'Test',
    icon: 'test',
    controlLevel: 'full-manual',
    difficulty: 'beginner',
    category: 'manual',
    tags: [],
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    primaryView: 'tracker',
    layout: {
      type: 'dock',
      panels: [],
    },
    decks: [],
    ...overrides,
  };
}

describe('isCardAllowed', () => {
  it('allows manual cards on full-manual board', () => {
    const board = createTestBoard();
    const effect = createCardMeta('reverb', 'Reverb', 'effects');
    expect(isCardAllowed(board, effect)).toBe(true);
  });

  it('blocks generative cards on full-manual board', () => {
    const board = createTestBoard();
    const generator = createCardMeta('melody-gen', 'Melody Generator', 'generators');
    expect(isCardAllowed(board, generator)).toBe(false);
  });

  it('allows phrase cards when phraseDatabase is enabled', () => {
    const board = createTestBoard({
      controlLevel: 'assisted',
      compositionTools: {
        phraseDatabase: { enabled: true, mode: 'drag-drop' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
    });
    const phrase = createCardMeta('phrase-lib', 'Phrase Library', 'generators', {
      tags: ['phrase', 'template'],
    });
    expect(isCardAllowed(board, phrase)).toBe(true);
  });

  it('blocks phrase cards when phraseDatabase is hidden', () => {
    const board = createTestBoard({
      controlLevel: 'assisted',
      compositionTools: {
        phraseDatabase: { enabled: true, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
    });
    const phrase = createCardMeta('phrase-lib', 'Phrase Library', 'generators', {
      tags: ['phrase'],
    });
    expect(isCardAllowed(board, phrase)).toBe(false);
  });

  it('allows generators when phraseGenerators is enabled', () => {
    const board = createTestBoard({
      controlLevel: 'directed',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: true, mode: 'on-demand' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
    });
    const generator = createCardMeta('bass-gen', 'Bass Generator', 'generators');
    expect(isCardAllowed(board, generator)).toBe(true);
  });

  it('allows harmony hints when harmonyExplorer is enabled', () => {
    const board = createTestBoard({
      controlLevel: 'manual-with-hints',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: true, mode: 'display-only' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' },
      },
    });
    const harmony = createCardMeta('harmony-display', 'Harmony Display', 'analysis', {
      tags: ['harmony', 'chord'],
    });
    expect(isCardAllowed(board, harmony)).toBe(true);
  });
});

describe('filterAllowedCards', () => {
  it('filters out disallowed cards', () => {
    const board = createTestBoard({ controlLevel: 'full-manual' });
    const cards = [
      createCardMeta('reverb', 'Reverb', 'effects'),
      createCardMeta('melody-gen', 'Melody Generator', 'generators'),
      createCardMeta('delay', 'Delay', 'effects'),
    ];
    const allowed = filterAllowedCards(board, cards);
    expect(allowed).toHaveLength(2);
    expect(allowed[0].id).toBe('reverb');
    expect(allowed[1].id).toBe('delay');
  });
});

describe('partitionCardsByAllowance', () => {
  it('partitions cards into allowed and disallowed', () => {
    const board = createTestBoard({ controlLevel: 'full-manual' });
    const cards = [
      createCardMeta('reverb', 'Reverb', 'effects'),
      createCardMeta('melody-gen', 'Melody Generator', 'generators'),
      createCardMeta('harmony', 'Harmony', 'analysis', { tags: ['harmony'] }),
      createCardMeta('delay', 'Delay', 'effects'),
    ];
    const { allowed, disallowed } = partitionCardsByAllowance(board, cards);
    expect(allowed).toHaveLength(2);
    expect(disallowed).toHaveLength(2);
    expect(allowed.map(c => c.id)).toEqual(['reverb', 'delay']);
    expect(disallowed.map(c => c.id)).toEqual(['melody-gen', 'harmony']);
  });
});
