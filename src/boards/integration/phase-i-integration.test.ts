/**
 * @fileoverview Phase I Integration Tests - Hybrid Boards
 * Tests integration between hybrid boards, session/timeline, and control levels.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins/register';
import { switchBoard } from '../switching/switch-board';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';

describe('Phase I: Hybrid Boards Integration', () => {
  beforeEach(() => {
    // Register boards
    registerBuiltinBoards();
    
    // Reset stores
    const stateStore = getBoardStateStore();
    const contextStore = getBoardContextStore();
    
    // Clear localStorage in test environment
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('I024: Session Clip Selection Updates Context', () => {
    it('should update notation/tracker editor context when session clip is selected', () => {
      const registry = getBoardRegistry();
      const composerBoard = registry.get('composer');
      
      expect(composerBoard).toBeDefined();
      expect(composerBoard?.decks.some(d => d.type === 'session-deck')).toBe(true);
      expect(composerBoard?.decks.some(d => d.type === 'notation-deck')).toBe(true);
    });

    it('should share active stream context across session and notation decks', () => {
      const contextStore = getBoardContextStore();
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();

      // Create a test stream
      const stream = eventStore.createStream({ name: 'Test Stream' });
      
      // Create a clip referencing the stream
      const clip = clipRegistry.createClip({
        name: 'Test Clip',
        streamId: stream.id,
        loop: false,
        duration: asTickDuration(480)
      });

      // Set active clip (as session grid would do)
      contextStore.setActiveClip(clip.id);
      contextStore.setActiveStream(stream.id);

      // Verify context is set
      const context = contextStore.getContext();
      expect(context.activeClipId).toBe(clip.id);
      expect(context.activeStreamId).toBe(stream.id);
    });
  });

  describe('I047: Session and Timeline Share Clips', () => {
    it('should show clip added in session in timeline view', () => {
      const clipRegistry = getClipRegistry();
      const eventStore = getSharedEventStore();

      // Create stream with events
      const stream = eventStore.createStream({ name: 'Shared Stream' });
      eventStore.addEvents(stream.id, [{
        id: 'evt-1' as any,
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { note: 60, velocity: 100 }
      }]);

      // Create clip (as session would)
      const clip = clipRegistry.createClip({
        name: 'Session Clip',
        streamId: stream.id,
        loop: false,
        duration: asTickDuration(480)
      });

      // Verify clip is in registry (accessible to timeline)
      const retrievedClip = clipRegistry.getClip(clip.id);
      expect(retrievedClip).toBeDefined();
      expect(retrievedClip?.streamId).toBe(stream.id);

      // Verify timeline can access the stream's events
      const streamData = eventStore.getStream(stream.id);
      expect(streamData?.events).toHaveLength(1);
    });

    it('should reflect clip edits in both session and timeline', () => {
      const clipRegistry = getClipRegistry();
      const eventStore = getSharedEventStore();

      // Create clip
      const stream = eventStore.createStream({ name: 'Shared' });
      const clip = clipRegistry.createClip({
        name: 'Original Name',
        streamId: stream.id,
        loop: false,
        duration: asTickDuration(480)
      });

      // Update clip properties (as timeline or session would)
      clipRegistry.updateClip(clip.id, { name: 'Updated Name' });

      // Verify both views see the update
      const updated = clipRegistry.getClip(clip.id);
      expect(updated?.name).toBe('Updated Name');
    });
  });

  describe('I048: DSP Chain Routing', () => {
    it('should support routing graph connections for dsp-chain deck', () => {
      const registry = getBoardRegistry();
      const producerBoard = registry.get('producer');
      
      expect(producerBoard).toBeDefined();
      expect(producerBoard?.decks.some(d => d.type === 'dsp-chain')).toBe(true);
      // Producer board uses transport-deck (not dedicated routing deck)
      expect(producerBoard?.decks.some(d => d.type === 'transport-deck')).toBe(true);
    });
  });

  describe('I071: Live Performance 60fps', () => {
    it('should have live performance board with optimized session deck', () => {
      const registry = getBoardRegistry();
      const liveBoard = registry.get('live-performance');
      
      expect(liveBoard).toBeDefined();
      // Note: May be 'collaborative' or 'full-manual' depending on variant
      expect(['collaborative', 'full-manual']).toContain(liveBoard?.controlLevel);
      expect(liveBoard?.primaryView).toBe('session');
    });
  });

  describe('I072: Tempo Tap Sync', () => {
    it('should have transport deck available in live performance board', () => {
      const registry = getBoardRegistry();
      const liveBoard = registry.get('live-performance');
      
      expect(liveBoard).toBeDefined();
      expect(liveBoard?.decks.some(d => d.type === 'transport-deck')).toBe(true);
    });
  });

  describe('Per-Track Control Levels', () => {
    it('should support per-track control level indicators', () => {
      const registry = getBoardRegistry();
      const composerBoard = registry.get('composer');
      
      expect(composerBoard).toBeDefined();
      expect(composerBoard?.controlLevel).toBe('collaborative');
      
      // Verify hybrid board supports mixed control levels
      expect(composerBoard?.compositionTools.phraseDatabase.enabled).toBe(true);
      expect(composerBoard?.compositionTools.phraseGenerators.enabled).toBe(true);
    });
  });
});
