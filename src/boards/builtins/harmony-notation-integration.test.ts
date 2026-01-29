/**
 * @fileoverview Harmony Coloring Integration Tests (G103-G104, G112, G114)
 * 
 * Tests for harmony coloring and snap-to-chord features:
 * - G103: Chord tones highlight overlay in notation
 * - G104: Snap selection to chord tones
 * - G112: Harmony deck visibility smoke test
 * - G114: Snap to chord tones undo test
 * 
 * @module @cardplay/boards/builtins/harmony-notation-integration.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';
import { classifyNote, getNoteColorClass } from '../harmony/coloring';
import type { HarmonyContext } from '../harmony/coloring';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';

describe('Harmony-Notation Integration (G103-G104, G112, G114)', () => {
  beforeEach(() => {
    const registry = getBoardRegistry();
    if (!registry.get('notation-harmony')) {
      registerBuiltinBoards(registry);
    }
  });

  it('G103: applies chord tones highlight overlay in notation view (non-destructive)', () => {
    // Test that harmony coloring classifies notes correctly
    const harmonyContext: HarmonyContext = {
      key: 'C',
      chord: 'Cmaj7'
    };
    
    // Test chord tones (C, E, G, B)
    expect(classifyNote('C', harmonyContext)).toBe('chord-tone');
    expect(classifyNote('E', harmonyContext)).toBe('chord-tone');
    expect(classifyNote('G', harmonyContext)).toBe('chord-tone');
    expect(classifyNote('B', harmonyContext)).toBe('chord-tone');
    
    // Test scale tones (D, F, A)
    expect(classifyNote('D', harmonyContext)).toBe('scale-tone');
    expect(classifyNote('F', harmonyContext)).toBe('scale-tone');
    expect(classifyNote('A', harmonyContext)).toBe('scale-tone');
    
    // Test out-of-key notes (C#, Eb, F#, etc.)
    expect(classifyNote('C#', harmonyContext)).toBe('out-of-key');
    expect(classifyNote('Eb', harmonyContext)).toBe('out-of-key');
    expect(classifyNote('F#', harmonyContext)).toBe('out-of-key');
    
    // Verify CSS classes are generated
    expect(getNoteColorClass('chord-tone')).toBe('harmony-chord-tone');
    expect(getNoteColorClass('scale-tone')).toBe('harmony-scale-tone');
    expect(getNoteColorClass('out-of-key')).toBe('harmony-out-of-key');
  });

  it('G103: coloring works across different chords and keys', () => {
    // Test Dm chord in C major
    const dmContext: HarmonyContext = {
      key: 'C',
      chord: 'Dm'
    };
    
    expect(classifyNote('D', dmContext)).toBe('chord-tone');
    expect(classifyNote('F', dmContext)).toBe('chord-tone');
    expect(classifyNote('A', dmContext)).toBe('chord-tone');
    expect(classifyNote('C', dmContext)).toBe('scale-tone'); // In key but not in chord
    
    // Test G7 chord in C major
    const g7Context: HarmonyContext = {
      key: 'C',
      chord: 'G7'
    };
    
    expect(classifyNote('G', g7Context)).toBe('chord-tone');
    expect(classifyNote('B', g7Context)).toBe('chord-tone');
    expect(classifyNote('D', g7Context)).toBe('chord-tone');
    expect(classifyNote('F', g7Context)).toBe('chord-tone');
    
    // Test in different key (F major, Fmaj7 chord)
    const fMajContext: HarmonyContext = {
      key: 'F',
      chord: 'Fmaj7'
    };
    
    expect(classifyNote('F', fMajContext)).toBe('chord-tone');
    expect(classifyNote('A', fMajContext)).toBe('chord-tone');
    expect(classifyNote('C', fMajContext)).toBe('chord-tone');
    expect(classifyNote('E', fMajContext)).toBe('chord-tone');
    expect(classifyNote('G', fMajContext)).toBe('scale-tone');
    expect(classifyNote('F#', fMajContext)).toBe('out-of-key');
  });

  it('G104: snap selection to chord tones (with undo support)', () => {
    const eventStore = getSharedEventStore();
    const undoStack = getUndoStack();
    
    undoStack.clear();
    
    // Create stream with mixed notes
    const streamRecord = eventStore.createStream({
      name: 'Test Harmony',
      events: [
        { kind: EventKinds.NOTE, start: asTick(0), duration: asTickDuration(480), payload: { note: 60, velocity: 100 } },    // C (chord tone)
        { kind: EventKinds.NOTE, start: asTick(480), duration: asTickDuration(480), payload: { note: 61, velocity: 100 } },  // C# (out-of-key)
        { kind: EventKinds.NOTE, start: asTick(960), duration: asTickDuration(480), payload: { note: 62, velocity: 100 } },  // D (scale tone)
        { kind: EventKinds.NOTE, start: asTick(1440), duration: asTickDuration(480), payload: { note: 64, velocity: 100 } }, // E (chord tone)
        { kind: EventKinds.NOTE, start: asTick(1920), duration: asTickDuration(480), payload: { note: 66, velocity: 100 } }, // F# (out-of-key)
      ]
    });
    
    const streamId = streamRecord.id;
    const initialEvents = eventStore.getStream(streamId)?.events || [];
    
    // Simulate "snap to chord tones" action for Cmaj7 chord
    // This would move: C#→C, D→E, F#→G
    const harmonyContext: HarmonyContext = {
      key: 'C',
      chord: 'Cmaj7'
    };
    
    // Get chord tones (C=60, E=64, G=67, B=71)
    const chordTones = [60, 64, 67, 71];
    
    // Helper to find nearest chord tone
    const snapToChordTone = (note: number): number => {
      return chordTones.reduce((nearest, ct) => {
        const distToCurrent = Math.abs(note - ct);
        const distToNearest = Math.abs(note - nearest);
        return distToCurrent < distToNearest ? ct : nearest;
      }, chordTones[0]);
    };
    
    // Store original state for undo
    const originalNotes = initialEvents.map(evt => evt.payload.note);
    
    // Manually snap notes (simulating the snap action)
    const snappedNotes = originalNotes.map(snapToChordTone);
    
    // Apply transformation by replacing all events
    const snappedEvents = initialEvents.map((evt, i) => ({
      ...evt,
      payload: {
        ...evt.payload,
        note: snappedNotes[i]
      }
    }));
    
    // Update stream with snapped events (this is the action to test)
    eventStore.updateStream(streamId, () => ({
      events: snappedEvents
    }));
    
    // Push undo action
    undoStack.push({
      type: 'snap-to-chord-tones',
      undo: () => {
        // Restore original events
        eventStore.updateStream(streamId, () => ({
          events: initialEvents
        }));
      },
      redo: () => {
        // Re-apply snapped events
        eventStore.updateStream(streamId, () => ({
          events: snappedEvents
        }));
      },
      timestamp: Date.now()
    });
    
    // Verify transformation occurred
    const afterSnapEvents = eventStore.getStream(streamId)?.events || [];
    expect(afterSnapEvents[1].payload.note).toBe(60); // C# (61) → C (60), distance 1
    expect(afterSnapEvents[2].payload.note).toBe(60); // D (62) → C (60), distance 2 (ties go to first in array)
    expect(afterSnapEvents[4].payload.note).toBe(67); // F# (66) → G (67), distance 1
    
    // Verify rhythm preserved (G114)
    afterSnapEvents.forEach((evt, i) => {
      expect(evt.start).toBe(initialEvents[i].start);
      expect(evt.duration).toBe(initialEvents[i].duration);
    });
    
    // Test undo (G114)
    expect(undoStack.canUndo()).toBe(true);
    undoStack.undo();
    
    const afterUndoEvents = eventStore.getStream(streamId)?.events || [];
    expect(afterUndoEvents[1].payload.note).toBe(61); // Back to C#
    expect(afterUndoEvents[2].payload.note).toBe(62); // Back to D
    expect(afterUndoEvents[4].payload.note).toBe(66); // Back to F#
  });

  it('G112: notation-harmony board shows harmony deck and hides generators/AI', () => {
    const registry = getBoardRegistry();
    const board = registry.get('notation-harmony');
    
    expect(board).toBeDefined();
    
    // Check harmony deck exists
    const harmonyDeck = board?.decks.find(d => d.type === 'harmony-deck');
    expect(harmonyDeck).toBeDefined();
    
    // Check generators/AI hidden
    const generatorDeck = board?.decks.find(d => d.type === 'generator');
    expect(generatorDeck).toBeUndefined();
    
    const aiComposerDeck = board?.decks.find(d => d.type === 'ai-composer');
    expect(aiComposerDeck).toBeUndefined();
    
    // Verify tool config
    expect(board?.compositionTools.phraseGenerators.mode).toBe('hidden');
    expect(board?.compositionTools.aiComposer.mode).toBe('hidden');
    expect(board?.compositionTools.harmonyExplorer.enabled).toBe(true);
  });

  it('harmony context updates trigger coloring changes', () => {
    // Test that changing chord updates coloring
    const context1: HarmonyContext = {
      key: 'C',
      chord: 'C'
    };
    
    expect(classifyNote('F', context1)).toBe('scale-tone');
    
    // Change chord to include F (F major chord)
    const context2: HarmonyContext = {
      key: 'C',
      chord: 'F'
    };
    
    expect(classifyNote('F', context2)).toBe('chord-tone');
    
    // Change to minor key
    const context3: HarmonyContext = {
      key: 'Am',
      chord: 'Am'
    };
    
    expect(classifyNote('A', context3)).toBe('chord-tone');
    expect(classifyNote('C', context3)).toBe('chord-tone');
    expect(classifyNote('E', context3)).toBe('chord-tone');
  });

  it('coloring respects enharmonic equivalents', () => {
    const context: HarmonyContext = {
      key: 'Db',
      chord: 'Db'
    };
    
    // Db and C# should be treated the same
    expect(classifyNote('Db', context)).toBe('chord-tone');
    expect(classifyNote('C#', context)).toBe('chord-tone');
    
    // F and Gb should be the same
    const context2: HarmonyContext = {
      key: 'Db',
      chord: 'Gbmaj7'
    };
    
    expect(classifyNote('Gb', context2)).toBe('chord-tone');
    expect(classifyNote('F#', context2)).toBe('chord-tone');
  });
});
