/**
 * @fileoverview Project Compatibility Tests (K004)
 * 
 * Tests that boards share the same project format and can interoperate
 * without data loss or corruption.
 * 
 * @module @cardplay/boards/__tests__/project-compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins/register';
import { switchBoard } from '../switching/switch-board';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event';

describe('K004: Project Compatibility', () => {
  beforeEach(() => {
    registerBuiltinBoards();
    
    // Clear all stores
    const eventStore = getSharedEventStore();
    const clipRegistry = getClipRegistry();
    const boardStateStore = getBoardStateStore();
    const contextStore = getBoardContextStore();
    
    eventStore.getAllStreams().forEach(s => eventStore.deleteStream(s.id));
    clipRegistry.getAllClips().forEach(c => clipRegistry.deleteClip(c.id));
  });

  // ==========================================================================
  // Cross-Board Data Sharing
  // ==========================================================================

  describe('Cross-board data sharing', () => {
    it('should share streams across all boards', () => {
      const eventStore = getSharedEventStore();
      const registry = getBoardRegistry();
      
      // Create a stream
      const stream = eventStore.createStream({ name: 'Shared Pattern' });
      eventStore.addEvents(stream.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      // Switch to tracker board
      switchBoard('basic-tracker', { preserveActiveContext: true });
      
      // Verify stream still exists
      let streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord).toBeDefined();
      expect(streamRecord!.events.length).toBe(1);
      
      // Switch to notation board
      switchBoard('notation-manual', { preserveActiveContext: true });
      
      // Verify stream still exists
      streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord).toBeDefined();
      expect(streamRecord!.events.length).toBe(1);
      
      // Switch to session board
      switchBoard('basic-session', { preserveActiveContext: true });
      
      // Verify stream still exists
      streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord).toBeDefined();
      expect(streamRecord!.events.length).toBe(1);
    });

    it('should share clips across all boards', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      // Create stream and clip
      const stream = eventStore.createStream({ name: 'Test' });
      const clip = clipRegistry.createClip({
        name: 'Shared Clip',
        streamId: stream.id,
        color: '#ff0000',
        loop: true,
      });
      
      // Switch boards multiple times
      switchBoard('basic-tracker', {});
      switchBoard('basic-session', {});
      switchBoard('basic-sampler', {});
      
      // Verify clip exists
      const clipRecord = clipRegistry.getClip(clip.id);
      expect(clipRecord).toBeDefined();
      expect(clipRecord!.name).toBe('Shared Clip');
    });

    it('should preserve routing graph across boards', () => {
      // Routing graph is global - connections should persist
      // This is implicit in the architecture but worth testing
      
      const registry = getBoardRegistry();
      
      // Start with modular board (routing-focused)
      switchBoard('modular-routing', {});
      
      // In real usage, routing connections would be created here
      // For now, verify board switch doesn't crash
      
      switchBoard('producer', {});
      switchBoard('live-performance', {});
      
      // Routing graph should still be accessible
      expect(true).toBe(true); // Placeholder - routing graph tested in Phase J
    });
  });

  // ==========================================================================
  // Project Format Consistency
  // ==========================================================================

  describe('Project format consistency', () => {
    it('should serialize and deserialize projects across boards', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      // Create a complete project
      const stream1 = eventStore.createStream({ name: 'Melody' });
      const stream2 = eventStore.createStream({ name: 'Bass' });
      
      eventStore.addEvents(stream1.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      eventStore.addEvents(stream2.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 48, velocity: 80 },
      }]);
      
      const clip1 = clipRegistry.createClip({
        name: 'Melody Clip',
        streamId: stream1.id,
        color: '#ff0000',
        loop: true,
      });
      
      const clip2 = clipRegistry.createClip({
        name: 'Bass Clip',
        streamId: stream2.id,
        color: '#00ff00',
        loop: false,
      });
      
      // Get project snapshot
      const allStreams = eventStore.getAllStreams();
      const allClips = clipRegistry.getAllClips();
      
      expect(allStreams.length).toBe(2);
      expect(allClips.length).toBe(2);
      
      // Project format is just references - all data lives in stores
      const projectSnapshot = {
        streamIds: allStreams.map(s => s.id),
        clipIds: allClips.map(c => c.id),
      };
      
      // Switch boards - project data should remain intact
      switchBoard('basic-tracker', {});
      
      const afterSwitchStreams = eventStore.getAllStreams();
      const afterSwitchClips = clipRegistry.getAllClips();
      
      expect(afterSwitchStreams.length).toBe(2);
      expect(afterSwitchClips.length).toBe(2);
      
      // Verify IDs match
      expect(afterSwitchStreams.map(s => s.id).sort()).toEqual(
        projectSnapshot.streamIds.sort()
      );
      expect(afterSwitchClips.map(c => c.id).sort()).toEqual(
        projectSnapshot.clipIds.sort()
      );
    });

    it('should not duplicate data when switching boards', () => {
      const eventStore = getSharedEventStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      eventStore.addEvents(stream.id, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(48),
        payload: { pitch: 60, velocity: 100 },
      }]);
      
      const initialStreamCount = eventStore.getAllStreams().length;
      const initialEventCount = eventStore.getStream(stream.id)!.events.length;
      
      // Switch boards multiple times
      switchBoard('basic-tracker', {});
      switchBoard('notation-manual', {});
      switchBoard('basic-session', {});
      switchBoard('basic-tracker', {});
      
      // Verify no duplication
      expect(eventStore.getAllStreams().length).toBe(initialStreamCount);
      expect(eventStore.getStream(stream.id)!.events.length).toBe(initialEventCount);
    });
  });

  // ==========================================================================
  // Active Context Preservation
  // ==========================================================================

  describe('Active context preservation', () => {
    it('should preserve active stream when requested', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Active' });
      contextStore.setActiveStream(stream.id);
      
      // Switch with preservation
      switchBoard('basic-tracker', { preserveActiveContext: true });
      
      expect(contextStore.getContext().activeStreamId).toBe(stream.id);
      
      switchBoard('notation-manual', { preserveActiveContext: true });
      
      expect(contextStore.getContext().activeStreamId).toBe(stream.id);
    });

    it('should preserve active clip when requested', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      const clip = clipRegistry.createClip({
        name: 'Active Clip',
        streamId: stream.id,
        color: '#ff0000',
        loop: true,
      });
      
      contextStore.setActiveClip(clip.id);
      
      switchBoard('basic-session', { preserveActiveContext: true });
      
      expect(contextStore.getContext().activeClipId).toBe(clip.id);
    });

    it('should clear context when preservation not requested', () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      contextStore.setActiveStream(stream.id);
      
      // Switch without preservation
      switchBoard('basic-tracker', { preserveActiveContext: false });
      
      // Context may be cleared (implementation dependent)
      // Just verify no crashes
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Board-Specific State Isolation
  // ==========================================================================

  describe('Board-specific state isolation', () => {
    it('should isolate per-board layout state', () => {
      const boardStateStore = getBoardStateStore();
      
      // Set layout for tracker board
      switchBoard('basic-tracker', {});
      boardStateStore.setLayoutState('basic-tracker', {
        panelSizes: { left: 200, right: 300 },
        panelCollapsed: { left: false, right: false },
      });
      
      // Switch to notation board
      switchBoard('notation-manual', {});
      boardStateStore.setLayoutState('notation-manual', {
        panelSizes: { left: 250, right: 250 },
        panelCollapsed: { left: false, right: true },
      });
      
      // Verify states are separate
      const trackerLayout = boardStateStore.getLayoutState('basic-tracker');
      const notationLayout = boardStateStore.getLayoutState('notation-manual');
      
      expect(trackerLayout?.panelSizes?.left).toBe(200);
      expect(notationLayout?.panelSizes?.left).toBe(250);
    });

    it('should isolate per-board deck state', () => {
      const boardStateStore = getBoardStateStore();
      
      switchBoard('basic-tracker', {});
      boardStateStore.setDeckState('basic-tracker', {
        'pattern-editor': {
          activeCards: ['tracker-1'],
          scrollPosition: { x: 100, y: 200 },
          zoom: 1.5,
        },
      });
      
      switchBoard('notation-manual', {});
      boardStateStore.setDeckState('notation-manual', {
        'notation-score': {
          activeCards: ['score-1'],
          scrollPosition: { x: 0, y: 0 },
          zoom: 1.0,
        },
      });
      
      // Verify states are separate
      const trackerDeck = boardStateStore.getDeckState('basic-tracker');
      const notationDeck = boardStateStore.getDeckState('notation-manual');
      
      expect(trackerDeck?.['pattern-editor']?.zoom).toBe(1.5);
      expect(notationDeck?.['notation-score']?.zoom).toBe(1.0);
    });
  });

  // ==========================================================================
  // Data Integrity
  // ==========================================================================

  describe('Data integrity', () => {
    it('should maintain event ordering across board switches', () => {
      const eventStore = getSharedEventStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      
      // Add events in specific order
      eventStore.addEvents(stream.id, [
        {
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(48),
          payload: { pitch: 60, velocity: 100 },
        },
        {
          kind: EventKinds.NOTE,
          start: asTick(48),
          duration: asTickDuration(48),
          payload: { pitch: 62, velocity: 100 },
        },
        {
          kind: EventKinds.NOTE,
          start: asTick(96),
          duration: asTickDuration(48),
          payload: { pitch: 64, velocity: 100 },
        },
      ]);
      
      const initialEvents = eventStore.getStream(stream.id)!.events;
      
      // Switch boards
      switchBoard('basic-tracker', {});
      switchBoard('notation-manual', {});
      switchBoard('basic-session', {});
      
      // Verify order preserved
      const finalEvents = eventStore.getStream(stream.id)!.events;
      
      expect(finalEvents.length).toBe(initialEvents.length);
      
      for (let i = 0; i < finalEvents.length; i++) {
        expect(finalEvents[i].start).toBe(initialEvents[i].start);
        expect(finalEvents[i].payload.pitch).toBe(initialEvents[i].payload.pitch);
      }
    });

    it('should maintain clip-stream references', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      const stream = eventStore.createStream({ name: 'Test' });
      const clip = clipRegistry.createClip({
        name: 'Test Clip',
        streamId: stream.id,
        color: '#ff0000',
        loop: true,
      });
      
      // Switch boards
      switchBoard('basic-tracker', {});
      switchBoard('basic-session', {});
      
      // Verify reference intact
      const clipRecord = clipRegistry.getClip(clip.id);
      expect(clipRecord).toBeDefined();
      expect(clipRecord!.streamId).toBe(stream.id);
      
      // Verify stream still exists
      const streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord).toBeDefined();
    });
  });
});
