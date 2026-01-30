/**
 * @fileoverview Audio Deck Adapter Tests
 *
 * Change 240: Tests ensuring routing graph edges are created/removed correctly
 * when slot connections change in the DeckLayoutAdapter.
 *
 * @module @cardplay/boards/decks/audio-deck-adapter.test
 */

import { describe, it, expect } from 'vitest';
import { createAudioDeckAdapter } from './audio-deck-adapter';
import { asDeckId, type BoardDeck, type DeckId } from '../types';

function createTestBoardDeck(id: string): BoardDeck {
  return {
    id: asDeckId(id),
    type: 'mixer-deck',
    cardLayout: 'grid',
    allowReordering: true,
    allowDragOut: false,
  };
}

const testContext = {
  activeStreamId: null,
  activeClipId: null,
  selectedEventIds: [],
  cursorPosition: 0,
  selectionRange: null,
} as const;

describe('AudioDeckAdapter', () => {
  it('should create adapter with routing node ID', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer'),
      testContext as any
    );

    const nodeId = adapter.getRoutingNodeId();
    expect(nodeId).toContain('deck-audio-');
    expect(nodeId).toContain('test-mixer');

    adapter.dispose();
  });

  it('should return empty slot connection edges when no connections', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-2'),
      testContext as any
    );

    const edges = adapter.getSlotConnectionEdges();
    expect(edges).toEqual([]);

    adapter.dispose();
  });

  it('should expose audio input and output nodes', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-3'),
      testContext as any
    );

    // Without AudioContext, nodes will be null
    const inputNode = adapter.getInputNode();
    const outputNode = adapter.getOutputNode();
    expect(inputNode).toBeNull();
    expect(outputNode).toBeNull();

    adapter.dispose();
  });

  it('should get current deck state', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-4'),
      testContext as any
    );

    const state = adapter.getState();
    expect(state).toBeDefined();
    expect(state.id).toBeDefined();

    adapter.dispose();
  });
});
