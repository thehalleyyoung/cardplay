/**
 * @fileoverview Event Projection Tests
 * 
 * Change 335-336: Tests for tracker projection and piano-roll projection
 * to assert they match SSOT event streams.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  projectTrackerRows,
  projectPianoRollNotes,
  projectNotationMeasures,
  isProjectionValid,
  subscribeToProjectionInvalidation,
} from './event-projections';
import { getSharedEventStore, resetProject } from '../../state/ssot';
import { createNoteEvent } from '../../types/event';
import type { EventStreamId, Tick } from '../../types/primitives';

describe('Event Projections', () => {
  const streamId = 'test-stream' as EventStreamId;
  
  beforeEach(() => {
    resetProject();
  });

  describe('Change 335: Tracker projection matches SSOT', () => {
    it('should project events onto tracker rows', () => {
      const store = getSharedEventStore();
      
      // Add note events at different steps (PPQ 960, 16th notes = 240 ticks)
      const events = [
        createNoteEvent(0 as Tick, 240, 60, 100), // Step 0
        createNoteEvent(240 as Tick, 240, 62, 100), // Step 1
        createNoteEvent(480 as Tick, 240, 64, 100), // Step 2
        createNoteEvent(960 as Tick, 240, 65, 100), // Step 4
      ];
      
      store.addEvents(streamId, events);
      
      // Project onto 8-step pattern with 240 ticks per step
      const projection = projectTrackerRows(
        streamId,
        0 as Tick,
        8, // 8 steps
        240, // 16th note grid
        undefined
      );
      
      expect(projection.length).toBe(8);
      expect(projection.rows).toHaveLength(8);
      
      // Check step 0 has first note
      expect(projection.rows[0]!.events).toHaveLength(1);
      expect((projection.rows[0]!.events[0]!.payload as { note: number }).note).toBe(60);
      
      // Check step 1 has second note
      expect(projection.rows[1]!.events).toHaveLength(1);
      expect((projection.rows[1]!.events[0]!.payload as { note: number }).note).toBe(62);
      
      // Check step 2 has third note
      expect(projection.rows[2]!.events).toHaveLength(1);
      expect((projection.rows[2]!.events[0]!.payload as { note: number }).note).toBe(64);
      
      // Check step 3 has no notes
      expect(projection.rows[3]!.events).toHaveLength(0);
      
      // Check step 4 has fourth note
      expect(projection.rows[4]!.events).toHaveLength(1);
      expect((projection.rows[4]!.events[0]!.payload as { note: number }).note).toBe(65);
    });

    it('should highlight active playhead step', () => {
      const projection = projectTrackerRows(
        streamId,
        0 as Tick,
        8,
        240,
        480 as Tick // Playhead at step 2
      );
      
      expect(projection.playheadStep).toBe(2);
      expect(projection.rows[2]!.active).toBe(true);
      expect(projection.rows[0]!.active).toBe(false);
      expect(projection.rows[1]!.active).toBe(false);
    });

    it('should handle empty patterns', () => {
      const projection = projectTrackerRows(
        streamId,
        0 as Tick,
        16,
        240,
        undefined
      );
      
      expect(projection.rows).toHaveLength(16);
      expect(projection.rows.every(row => row.events.length === 0)).toBe(true);
    });
  });

  describe('Change 336: Piano roll projection matches SSOT', () => {
    it('should project notes onto piano roll grid', () => {
      const store = getSharedEventStore();
      
      // Add notes at different times and pitches
      const events = [
        createNoteEvent(0 as Tick, 480, 60, 100),
        createNoteEvent(480 as Tick, 480, 64, 90),
        createNoteEvent(960 as Tick, 960, 67, 80),
      ];
      
      store.addEvents(streamId, events);
      
      // Project piano roll
      const projection = projectPianoRollNotes(
        streamId,
        0 as Tick,
        2000 as Tick,
        0,
        127
      );
      
      expect(projection.notes).toHaveLength(3);
      
      // Check first note
      expect(projection.notes[0]!.note).toBe(60);
      expect(projection.notes[0]!.startTick).toBe(0);
      expect(projection.notes[0]!.duration).toBe(480);
      expect(projection.notes[0]!.velocity).toBe(100);
      
      // Check second note
      expect(projection.notes[1]!.note).toBe(64);
      expect(projection.notes[1]!.startTick).toBe(480);
      
      // Check third note
      expect(projection.notes[2]!.note).toBe(67);
      expect(projection.notes[2]!.startTick).toBe(960);
    });

    it('should filter by pitch range', () => {
      const store = getSharedEventStore();
      
      // Add notes across different octaves
      const events = [
        createNoteEvent(0 as Tick, 480, 36, 100), // C2
        createNoteEvent(0 as Tick, 480, 60, 100), // C4
        createNoteEvent(0 as Tick, 480, 84, 100), // C6
      ];
      
      store.addEvents(streamId, events);
      
      // Project only middle octave (C3-B4, notes 48-71)
      const projection = projectPianoRollNotes(
        streamId,
        0 as Tick,
        1000 as Tick,
        48,
        71
      );
      
      expect(projection.notes).toHaveLength(1);
      expect(projection.notes[0]!.note).toBe(60);
    });

    it('should track selection state', () => {
      const store = getSharedEventStore();
      
      const events = [
        createNoteEvent(0 as Tick, 480, 60, 100),
        createNoteEvent(480 as Tick, 480, 64, 100),
      ];
      
      store.addEvents(streamId, events);
      
      const selectedIds = new Set([events[0]!.id]);
      
      const projection = projectPianoRollNotes(
        streamId,
        0 as Tick,
        1000 as Tick,
        0,
        127,
        selectedIds
      );
      
      expect(projection.notes[0]!.selected).toBe(true);
      expect(projection.notes[1]!.selected).toBe(false);
    });

    it('should handle viewport clipping', () => {
      const store = getSharedEventStore();
      
      // Add notes outside viewport
      const events = [
        createNoteEvent(0 as Tick, 100, 60, 100), // Before viewport
        createNoteEvent(500 as Tick, 200, 64, 100), // In viewport
        createNoteEvent(2000 as Tick, 100, 67, 100), // After viewport
      ];
      
      store.addEvents(streamId, events);
      
      // Viewport from 400-1500
      const projection = projectPianoRollNotes(
        streamId,
        400 as Tick,
        1500 as Tick
      );
      
      expect(projection.notes).toHaveLength(1);
      expect(projection.notes[0]!.note).toBe(64);
    });
  });

  describe('Notation projection', () => {
    it('should organize notes into measures', () => {
      const store = getSharedEventStore();
      
      // PPQ 960, 4/4 time: measure = 960*4 = 3840 ticks
      const events = [
        createNoteEvent(0 as Tick, 960, 60, 100), // Measure 1, beat 1
        createNoteEvent(960 as Tick, 960, 62, 100), // Measure 1, beat 2
        createNoteEvent(3840 as Tick, 960, 64, 100), // Measure 2, beat 1
      ];
      
      store.addEvents(streamId, events);
      
      const projection = projectNotationMeasures(
        streamId,
        0 as Tick,
        7680 as Tick, // 2 measures
        960, // PPQ
        4, // 4/4 time
        4
      );
      
      expect(projection.measures).toHaveLength(2);
      
      // Measure 1 should have 2 notes
      expect(projection.measures[0]!.notes).toHaveLength(2);
      expect(projection.measures[0]!.number).toBe(1);
      
      // Measure 2 should have 1 note
      expect(projection.measures[1]!.notes).toHaveLength(1);
      expect(projection.measures[1]!.number).toBe(2);
    });
  });

  describe('Change 334: Projection invalidation', () => {
    it('should track projection version', () => {
      const projection1 = projectTrackerRows(
        streamId,
        0 as Tick,
        8,
        240
      );
      
      expect(isProjectionValid(projection1.version)).toBe(true);
      
      // Modify SSOT
      const store = getSharedEventStore();
      store.addEvents(streamId, [
        createNoteEvent(0 as Tick, 240, 60, 100),
      ]);
      
      // Projection should now be invalid
      expect(isProjectionValid(projection1.version)).toBe(false);
      
      // New projection should have new version
      const projection2 = projectTrackerRows(
        streamId,
        0 as Tick,
        8,
        240
      );
      
      expect(projection2.version).not.toBe(projection1.version);
      expect(isProjectionValid(projection2.version)).toBe(true);
    });

    it('should notify subscribers on invalidation', () => {
      let invalidated = false;
      
      const unsubscribe = subscribeToProjectionInvalidation(() => {
        invalidated = true;
      });
      
      expect(invalidated).toBe(false);
      
      // Modify SSOT
      const store = getSharedEventStore();
      store.addEvents(streamId, [
        createNoteEvent(0 as Tick, 240, 60, 100),
      ]);
      
      expect(invalidated).toBe(true);
      
      unsubscribe();
    });
  });
});
