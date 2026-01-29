/**
 * @fileoverview Tests for Harmony Analysis (Phase G)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getChordTones,
  findNearestChordTone,
  snapToChordTones,
  harmonizeMelody,
  getReharmonizationSuggestions,
  type Chord,
  type MusicalKey
} from './harmony-analysis';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';
import type { EventStreamId, EventId } from '../../state/types';

describe('Harmony Analysis', () => {
  const testStreamId = 'test-stream-1' as EventStreamId;
  
  beforeEach(() => {
    // Reset stores
    vi.clearAllMocks();
  });

  describe('getChordTones', () => {
    it('returns correct tones for C major', () => {
      const cMajor: Chord = {
        root: 0, // C
        quality: 'major',
        extensions: [],
        name: 'Cmaj'
      };
      
      const tones = getChordTones(cMajor);
      expect(tones).toEqual([0, 4, 7]); // C, E, G
    });

    it('returns correct tones for D minor', () => {
      const dMinor: Chord = {
        root: 2, // D
        quality: 'minor',
        extensions: [],
        name: 'Dmin'
      };
      
      const tones = getChordTones(dMinor);
      expect(tones).toEqual([2, 5, 9]); // D, F, A
    });

    it('returns correct tones for G7', () => {
      const g7: Chord = {
        root: 7, // G
        quality: 'dom7',
        extensions: [],
        name: 'G7'
      };
      
      const tones = getChordTones(g7);
      expect(tones).toEqual([7, 11, 2, 5]); // G, B, D, F
    });
  });

  describe('findNearestChordTone', () => {
    const cMajor: Chord = {
      root: 0,
      quality: 'major',
      extensions: [],
      name: 'Cmaj'
    };

    it('finds nearest chord tone for in-scale note', () => {
      const result = findNearestChordTone(60, cMajor); // Middle C
      expect(result % 12).toBe(0); // C
    });

    it('finds nearest chord tone for out-of-scale note', () => {
      const result = findNearestChordTone(61, cMajor); // C#
      expect([0, 4, 7]).toContain(result % 12); // Should snap to C, E, or G
    });

    it('snaps up when direction is up', () => {
      const result = findNearestChordTone(61, cMajor, 'up'); // C#
      expect(result % 12).toBe(4); // Should snap to E
    });

    it('snaps down when direction is down', () => {
      const result = findNearestChordTone(61, cMajor, 'down'); // C#
      expect(result % 12).toBe(0); // Should snap to C
    });
  });

  describe('snapToChordTones', () => {
    it('snaps notes to chord tones', () => {
      const store = getSharedEventStore();
      const streamId = store.createStream({ name: 'test' }).id;
      
      // Add some notes
      const event1 = store.addEvents(streamId, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { note: 61, velocity: 80 } // C#
      }])[0];
      
      const cMajor: Chord = {
        root: 0,
        quality: 'major',
        extensions: [],
        name: 'Cmaj'
      };
      
      snapToChordTones(streamId, [event1!.id], cMajor);
      
      // Check that note was snapped
      const stream = store.getStream(streamId);
      const snappedEvent = stream?.events[0];
      expect(snappedEvent).toBeDefined();
      const snappedNote = (snappedEvent!.payload as { note: number }).note;
      expect([0, 4, 7]).toContain(snappedNote % 12);
    });

    it('is undoable', () => {
      const store = getSharedEventStore();
      const undoStack = getUndoStack();
      const streamId = store.createStream({ name: 'test' }).id;
      
      const originalNote = 61;
      const event1 = store.addEvents(streamId, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { note: originalNote, velocity: 80 }
      }])[0];
      
      const cMajor: Chord = {
        root: 0,
        quality: 'major',
        extensions: [],
        name: 'Cmaj'
      };
      
      snapToChordTones(streamId, [event1!.id], cMajor);
      
      // Undo
      undoStack.undo();
      
      // Check that note was restored
      const stream = store.getStream(streamId);
      const restoredEvent = stream?.events[0];
      expect(restoredEvent).toBeDefined();
      const restoredNote = (restoredEvent!.payload as { note: number }).note;
      expect(restoredNote).toBe(originalNote);
    });
  });

  describe('harmonizeMelody', () => {
    it('adds harmony notes below melody', () => {
      const store = getSharedEventStore();
      const streamId = store.createStream({ name: 'test' }).id;
      
      const melodyEvent = store.addEvents(streamId, [{
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { note: 64, velocity: 80 } // E
      }])[0];
      
      const cMajor: Chord = {
        root: 0,
        quality: 'major',
        extensions: [],
        name: 'Cmaj'
      };
      
      harmonizeMelody(streamId, [melodyEvent!.id], cMajor);
      
      // Check that harmony note was added
      const stream = store.getStream(streamId);
      expect(stream?.events.length).toBeGreaterThan(1);
      
      // Check harmony note is below melody
      const harmonyEvent = stream?.events.find(e => e.id !== melodyEvent!.id);
      expect(harmonyEvent).toBeDefined();
      const harmonyNote = (harmonyEvent!.payload as { note: number }).note;
      expect(harmonyNote).toBeLessThan(64);
    });
  });

  describe('getReharmonizationSuggestions', () => {
    it('suggests chords based on melody', () => {
      const melodyEvents = [
        {
          id: 'e1' as EventId,
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(96),
          payload: { note: 60, velocity: 80 }, // C
          triggers: []
        },
        {
          id: 'e2' as EventId,
          kind: EventKinds.NOTE,
          start: asTick(96),
          duration: asTickDuration(96),
          payload: { note: 64, velocity: 80 }, // E
          triggers: []
        }
      ];
      
      const currentChord: Chord = {
        root: 0,
        quality: 'major',
        extensions: [],
        name: 'Cmaj'
      };
      
      const key: MusicalKey = {
        root: 0,
        scale: 'major',
        name: 'C major'
      };
      
      const suggestions = getReharmonizationSuggestions(melodyEvents, currentChord, key);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('chord');
      expect(suggestions[0]).toHaveProperty('score');
      expect(suggestions[0]).toHaveProperty('reason');
    });
  });
});
