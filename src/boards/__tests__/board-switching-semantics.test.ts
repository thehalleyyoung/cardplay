/**
 * @fileoverview Board Switching Semantics Tests (K005)
 * 
 * Tests what persists, what resets, and what migrates during board switches.
 * 
 * @module @cardplay/boards/__tests__/board-switching-semantics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { registerBuiltinBoards } from '../builtins/register';
import { switchBoard } from '../switching/switch-board';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event';

describe('K005: Board Switching Semantics', () => {
  beforeEach(() => {
    registerBuiltinBoards();
    
    // Clear stores
    const eventStore = getSharedEventStore();
    const clipRegistry = getClipRegistry();
    
    eventStore.getAllStreams().forEach(s => eventStore.deleteStream(s.id));
    clipRegistry.getAllClips().forEach(c => clipRegistry.deleteClip(c.id));
  });

  // ==========================================================================
  // What Persists
  // ==========================================================================

  describe('What persists across board switches', () => {
    it('should persist all streams and events', () => {
      const eventStore = getSharedEventStore();
      
      const stream1 = eventStore.createStream({ name: 'Stream 1' });
      const stream2 = eventStore.createStream({ name: 'Stream 2' });
      
      eventStore.addEvents(stream1.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      const initialStreamCount = eventStore.getAllStreams().length;
      const initialEvent = eventStore.getStream(stream1.id)!.events[0];
      
      // Switch boards
      switchBoard('basic-tracker', {});
      switchBoard('notation-manual', {});
      
      // Verify persistence
      expect(eventStore.getAllStreams().length).toBe(initialStreamCount);
      
      const event = eventStore.getStream(stream1.id)!.events[0];
      expect(event.id).toBe(initialEvent.id);
      expect(event.start).toBe(initialEvent.start);
      expect(event.payload.pitch).toBe(initialEvent.payload.pitch);
    });

    it('should persist all clips and clip registry', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      const stream = eventStore.createStream({ name: 'Test' });
      const clip = clipRegistry.createClip({
        name: 'Persistent Clip',
        streamId: stream.id,
        color: '#ff0000',
        loop: true,
      });
      
      const initialClipCount = clipRegistry.getAllClips().length;
      
      switchBoard('basic-session', {});
      switchBoard('producer', {});
      
      expect(clipRegistry.getAllClips().length).toBe(initialClipCount);
      
      const clipRecord = clipRegistry.getClip(clip.id);
      expect(clipRecord).toBeDefined();
      expect(clipRecord!.name).toBe('Persistent Clip');
    });

    it('should persist recent boards list', () => {
      const stateStore = getBoardStateStore();
      
      // Get initial state
      const initialState = stateStore.getState();
      
      // Switch to several boards
      switchBoard('basic-tracker', {});
      switchBoard('notation-manual', {});
      switchBoard('basic-session', {});
      
      const finalState = stateStore.getState();
      
      // Recent boards should be updated
      expect(finalState.recentBoardIds).toContain('basic-tracker');
      expect(finalState.recentBoardIds).toContain('notation-manual');
      expect(finalState.recentBoardIds).toContain('basic-session');
    });

    it('should persist favorite boards', () => {
      const stateStore = getBoardStateStore();
      
      // Add favorite
      stateStore.toggleFavorite('basic-tracker');
      
      // Switch boards
      switchBoard('notation-manual', {});
      switchBoard('basic-session', {});
      
      // Verify favorite persisted
      const state = stateStore.getState();
      expect(state.favoriteBoardIds).toContain('basic-tracker');
    });

    it('should persist per-board layout preferences', () => {
      const stateStore = getBoardStateStore();
      
      // Set layout for one board
      switchBoard('basic-tracker', {});
      stateStore.setLayoutState('basic-tracker', {
        panelSizes: { left: 300, right: 400 },
        panelCollapsed: { left: false, right: false },
      });
      
      // Switch away and back
      switchBoard('notation-manual', {});
      switchBoard('basic-tracker', {});
      
      // Verify layout persisted
      const layout = stateStore.getLayoutState('basic-tracker');
      expect(layout?.panelSizes?.left).toBe(300);
      expect(layout?.panelSizes?.right).toBe(400);
    });
  });

  // ==========================================================================
  // What Resets
  // ==========================================================================

  describe('What resets on board switch', () => {
    it('should reset layout when resetLayout option is true', () => {
      const stateStore = getBoardStateStore();
      
      switchBoard('basic-tracker', {});
      stateStore.setLayoutState('basic-tracker', {
        panelSizes: { left: 300, right: 400 },
        panelCollapsed: { left: false, right: false },
      });
      
      // Switch with reset
      switchBoard('notation-manual', {});
      switchBoard('basic-tracker', { resetLayout: true });
      
      // Layout should be reset (empty or default)
      const layout = stateStore.getLayoutState('basic-tracker');
      
      // After reset, layout should be undefined or have default values
      if (layout) {
        expect(layout.panelSizes).toBeUndefined();
      }
    });

    it('should reset deck state when resetDecks option is true', () => {
      const stateStore = getBoardStateStore();
      
      switchBoard('basic-tracker', {});
      stateStore.setDeckState('basic-tracker', {
        'pattern-editor': {
          activeCards: ['tracker-1'],
          scrollPosition: { x: 100, y: 200 },
          zoom: 1.5,
        },
      });
      
      // Switch with reset
      switchBoard('notation-manual', {});
      switchBoard('basic-tracker', { resetDecks: true });
      
      // Deck state should be reset
      const deckState = stateStore.getDeckState('basic-tracker');
      
      if (deckState) {
        expect(deckState['pattern-editor']).toBeUndefined();
      }
    });

    it('should reset active context when preserveActiveContext is false', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      contextStore.setActiveStream(stream.id);
      contextStore.setActiveClip(null);
      contextStore.setActiveTrack(null);
      
      // Switch without preservation
      switchBoard('basic-tracker', { preserveActiveContext: false });
      
      // Context should be reset
      const context = contextStore.getContext();
      
      // After reset, activeStreamId should be null or undefined
      expect(context.activeStreamId).toBeNull();
    });
  });

  // ==========================================================================
  // What Migrates
  // ==========================================================================

  describe('What migrates during board switch', () => {
    it('should migrate active stream to new board when preserving context', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Migrating Stream' });
      contextStore.setActiveStream(stream.id);
      
      // Switch with preservation
      switchBoard('basic-tracker', { preserveActiveContext: true });
      
      expect(contextStore.getContext().activeStreamId).toBe(stream.id);
      
      switchBoard('notation-manual', { preserveActiveContext: true });
      
      expect(contextStore.getContext().activeStreamId).toBe(stream.id);
    });

    it('should maintain stream visibility across compatible boards', () => {
      const eventStore = getSharedEventStore();
      
      const stream = eventStore.createStream({ name: 'Visible Stream' });
      eventStore.addEvents(stream.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      // Stream should be visible in tracker
      switchBoard('basic-tracker', {});
      expect(eventStore.getStream(stream.id)).toBeDefined();
      
      // Stream should be visible in notation
      switchBoard('notation-manual', {});
      expect(eventStore.getStream(stream.id)).toBeDefined();
      
      // Stream should be visible in piano roll
      switchBoard('piano-roll-producer', {});
      expect(eventStore.getStream(stream.id)).toBeDefined();
    });

    it('should maintain clip references across session/arrangement boards', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      const stream = eventStore.createStream({ name: 'Test' });
      const clip = clipRegistry.createClip({
        name: 'Migrating Clip',
        streamId: stream.id,
        color: '#ff0000',
        loop: true,
      });
      
      // Switch between boards that use clips
      switchBoard('basic-session', {});
      expect(clipRegistry.getClip(clip.id)).toBeDefined();
      
      switchBoard('producer', {});
      expect(clipRegistry.getClip(clip.id)).toBeDefined();
      
      switchBoard('live-performance', {});
      expect(clipRegistry.getClip(clip.id)).toBeDefined();
    });
  });

  // ==========================================================================
  // Board Lifecycle Hooks
  // ==========================================================================

  describe('Board lifecycle hooks', () => {
    it('should update current board ID on switch', () => {
      const stateStore = getBoardStateStore();
      
      switchBoard('basic-tracker', {});
      expect(stateStore.getState().currentBoardId).toBe('basic-tracker');
      
      switchBoard('notation-manual', {});
      expect(stateStore.getState().currentBoardId).toBe('notation-manual');
      
      switchBoard('basic-session', {});
      expect(stateStore.getState().currentBoardId).toBe('basic-session');
    });

    it('should add board to recent list on switch', () => {
      const stateStore = getBoardStateStore();
      
      const initialRecent = stateStore.getState().recentBoardIds;
      
      switchBoard('basic-tracker', {});
      
      const afterSwitchRecent = stateStore.getState().recentBoardIds;
      
      // Should include the switched board
      expect(afterSwitchRecent).toContain('basic-tracker');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error handling during board switch', () => {
    it('should handle switch to non-existent board gracefully', () => {
      // Attempting to switch to invalid board should not crash
      expect(() => {
        switchBoard('non-existent-board', {});
      }).toThrow(); // Should throw but not crash the app
    });

    it('should preserve data even if switch fails', () => {
      const eventStore = getSharedEventStore();
      
      const stream = eventStore.createStream({ name: 'Safe Stream' });
      eventStore.addEvents(stream.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      const initialEvents = eventStore.getStream(stream.id)!.events.length;
      
      // Try invalid switch
      try {
        switchBoard('invalid-board', {});
      } catch (e) {
        // Expected to fail
      }
      
      // Data should still be intact
      expect(eventStore.getStream(stream.id)!.events.length).toBe(initialEvents);
    });
  });
});
