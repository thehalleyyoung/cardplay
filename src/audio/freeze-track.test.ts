/**
 * @fileoverview Tests for Track Freezing System
 * @module @cardplay/audio/freeze-track.test
 */

import { describe, it, expect } from 'vitest';
import { freezeTrack, unfreezeTrack, isTrackFrozen } from './freeze-track';
import { getSharedEventStore } from '../state/event-store';
import { EventKinds } from '../types/event-kind';
import { asTick, asTickDuration } from '../types/primitives';
import { generateEventId } from '../types/event-id';

describe('Track Freezing System', () => {
  describe('freezeTrack()', () => {
    it('should freeze a track with events', async () => {
      const store = getSharedEventStore();
      const stream = store.createStream({ name: 'Test Track' });
      
      // Add some events
      store.addEvents(stream.id, [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        },
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100 }
        }
      ]);
      
      const result = await freezeTrack({
        streamId: stream.id,
        format: 'wav',
        sampleRate: 48000,
        bitDepth: 24,
        normalize: true
      });
      
      expect(result.success).toBe(true);
      expect(result.frozenStreamId).toBe(stream.id);
      expect(result.metadata.frozen).toBe(true);
      expect(result.metadata.eventCount).toBe(2);
    });

    it('should fail gracefully for non-existent stream', async () => {
      const result = await freezeTrack({
        streamId: 'non-existent' as any
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Stream not found');
    });

    it('should fail gracefully for empty stream', async () => {
      const store = getSharedEventStore();
      const stream = store.createStream({ name: 'Empty Track' });
      
      const result = await freezeTrack({
        streamId: stream.id
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No events to freeze');
    });

    it('should call progress callback', async () => {
      const store = getSharedEventStore();
      const stream = store.createStream({ name: 'Test Track' });
      
      store.addEvents(stream.id, [
        {
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }
      ]);
      
      const progressUpdates: string[] = [];
      
      await freezeTrack({
        streamId: stream.id,
        onProgress: (progress) => {
          progressUpdates.push(progress.stage);
        }
      });
      
      expect(progressUpdates).toContain('analyzing');
      expect(progressUpdates).toContain('rendering');
      expect(progressUpdates).toContain('complete');
    });
  });

  describe('unfreezeTrack()', () => {
    it('should return true (placeholder)', () => {
      const result = unfreezeTrack('stream-1' as any);
      expect(result).toBe(true);
    });
  });

  describe('isTrackFrozen()', () => {
    it('should return false for unfrozen tracks', () => {
      const result = isTrackFrozen('stream-1' as any);
      expect(result).toBe(false);
    });
  });
});
