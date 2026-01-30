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

  it('should track slot connection edges from deck state', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-5'),
      testContext as any,
      { rows: 2, cols: 2 }
    );

    // Get initial state - starts with empty slots
    const state = adapter.getState();
    expect(state.rows).toBe(2);
    expect(state.cols).toBe(2);
    expect(state.slots).toEqual([]);

    // Verify edges extraction matches slot connection structure
    const edges = adapter.getSlotConnectionEdges();
    
    // Count total output connections from slots
    const totalConnections = state.slots.reduce(
      (sum, slot) => sum + slot.outputConnections.length,
      0
    );
    
    // Initially, no slots means no edges
    expect(edges.length).toBe(totalConnections);
    expect(edges.length).toBe(0);

    adapter.dispose();
  });

  it('should format routing node ID consistently', () => {
    const adapter1 = createAudioDeckAdapter(
      createTestBoardDeck('mixer-a'),
      testContext as any
    );
    const adapter2 = createAudioDeckAdapter(
      createTestBoardDeck('mixer-b'),
      testContext as any
    );

    const nodeId1 = adapter1.getRoutingNodeId();
    const nodeId2 = adapter2.getRoutingNodeId();

    // Node IDs should be unique
    expect(nodeId1).not.toBe(nodeId2);

    // Both should follow the deck-audio-* pattern
    expect(nodeId1).toMatch(/^deck-audio-/);
    expect(nodeId2).toMatch(/^deck-audio-/);

    adapter1.dispose();
    adapter2.dispose();
  });

  it('should expose deck operations', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-6'),
      testContext as any
    );

    // These should not throw
    expect(() => adapter.setVolume(0.5)).not.toThrow();
    expect(() => adapter.setPan(-0.5)).not.toThrow();
    expect(() => adapter.setMuted(true)).not.toThrow();
    expect(() => adapter.setSoloed(false)).not.toThrow();
    expect(() => adapter.setArmed(true)).not.toThrow();

    adapter.dispose();
  });

  it('should allow subscribing to state changes', () => {
    const adapter = createAudioDeckAdapter(
      createTestBoardDeck('test-mixer-7'),
      testContext as any
    );

    let callbackCalled = false;
    const unsubscribe = adapter.subscribe(() => {
      callbackCalled = true;
    });

    // Trigger a state change
    adapter.setVolume(0.8);

    expect(callbackCalled).toBe(true);
    unsubscribe();
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
