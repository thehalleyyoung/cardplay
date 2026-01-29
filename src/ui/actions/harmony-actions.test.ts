/**
 * @fileoverview Tests for Harmony Actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setChord, setKey, removeChordAt, getChordProgression, ensureChordStream } from './harmony-actions';
import { getSharedEventStore } from '../../state/event-store';
import { getBoardContextStore } from '../../boards/context/store';
import { getUndoStack } from '../../state/undo-stack';

describe('Harmony Actions (G014-G015)', () => {
  beforeEach(() => {
    // Reset stores
    const store = getSharedEventStore();
    const contextStore = getBoardContextStore();
    const undoStack = getUndoStack();
    
    // Clear any existing chord stream
    contextStore.setChordStreamId(null);
    contextStore.setCurrentKey(null);
    contextStore.setCurrentChord(null);
    
    // Clear undo stack
    while (undoStack.canUndo()) {
      undoStack.undo();
    }
  });

  describe('ensureChordStream', () => {
    it('creates a new chord stream if none exists', () => {
      const contextStore = getBoardContextStore();
      expect(contextStore.getChordStreamId()).toBeNull();
      
      const streamId = ensureChordStream();
      
      expect(streamId).toBeTruthy();
      expect(contextStore.getChordStreamId()).toBe(streamId);
      
      const store = getSharedEventStore();
      const stream = store.getStream(streamId);
      expect(stream).toBeTruthy();
      expect(stream?.name).toBe('Chord Progression');
    });

    it('reuses existing chord stream', () => {
      const streamId1 = ensureChordStream();
      const streamId2 = ensureChordStream();
      
      expect(streamId1).toBe(streamId2);
    });
  });

  describe('setKey (G015)', () => {
    it('updates the current key in context', () => {
      const contextStore = getBoardContextStore();
      
      setKey('C');
      expect(contextStore.getCurrentKey()).toBe('C');
      
      setKey('Dm');
      expect(contextStore.getCurrentKey()).toBe('Dm');
    });

    it('allows setting major and minor keys', () => {
      const contextStore = getBoardContextStore();
      
      setKey('F#');
      expect(contextStore.getCurrentKey()).toBe('F#');
      
      setKey('Bbm');
      expect(contextStore.getCurrentKey()).toBe('Bbm');
    });
  });

  describe('setChord (G014)', () => {
    it('updates the current chord in context', () => {
      const contextStore = getBoardContextStore();
      
      setChord('C');
      expect(contextStore.getCurrentChord()).toBe('C');
      
      setChord('Dm7');
      expect(contextStore.getCurrentChord()).toBe('Dm7');
    });

    it('writes chord event to chord stream', () => {
      setChord('Cmaj7', 0, 1920);
      
      const contextStore = getBoardContextStore();
      const store = getSharedEventStore();
      const chordStreamId = contextStore.getChordStreamId();
      
      expect(chordStreamId).toBeTruthy();
      const stream = store.getStream(chordStreamId!);
      expect(stream).toBeTruthy();
      expect(stream?.events.length).toBe(1);
      
      const event = stream?.events[0];
      expect(event?.kind).toBe('chord');
      expect(event?.start).toBe(0);
      expect(event?.duration).toBe(1920);
    });

    it('replaces existing chord at same position', () => {
      setChord('C', 0);
      setChord('Dm', 0);
      
      const contextStore = getBoardContextStore();
      const store = getSharedEventStore();
      const stream = store.getStream(contextStore.getChordStreamId()!);
      
      expect(stream?.events.length).toBe(1);
      expect((stream?.events[0]?.payload as any).symbol).toBe('Dm');
    });

    it('supports multiple chords at different positions', () => {
      setChord('C', 0);
      setChord('F', 1920);
      setChord('G', 3840);
      
      const progression = getChordProgression();
      expect(progression.length).toBe(3);
      expect(progression[0].chord).toBe('C');
      expect(progression[1].chord).toBe('F');
      expect(progression[2].chord).toBe('G');
    });

    it('is undoable (G027)', () => {
      setChord('C', 0);
      
      const contextStore = getBoardContextStore();
      const store = getSharedEventStore();
      const undoStack = getUndoStack();
      
      expect(undoStack.canUndo()).toBe(true);
      
      const beforeUndo = store.getStream(contextStore.getChordStreamId()!)?.events.length;
      expect(beforeUndo).toBe(1);
      
      undoStack.undo();
      
      const afterUndo = store.getStream(contextStore.getChordStreamId()!)?.events.length;
      expect(afterUndo).toBe(0);
    });

    it('is redoable after undo', () => {
      setChord('Cmaj7', 0);
      
      const undoStack = getUndoStack();
      undoStack.undo();
      expect(undoStack.canRedo()).toBe(true);
      
      undoStack.redo();
      
      const progression = getChordProgression();
      expect(progression.length).toBe(1);
      expect(progression[0].chord).toBe('Cmaj7');
    });
  });

  describe('removeChordAt', () => {
    it('removes chord at specified position', () => {
      setChord('C', 0);
      setChord('F', 1920);
      
      let progression = getChordProgression();
      expect(progression.length).toBe(2);
      
      removeChordAt(0);
      
      progression = getChordProgression();
      expect(progression.length).toBe(1);
      expect(progression[0].chord).toBe('F');
    });

    it('is undoable', () => {
      setChord('C', 0);
      removeChordAt(0);
      
      const undoStack = getUndoStack();
      expect(undoStack.canUndo()).toBe(true);
      
      undoStack.undo();
      
      const progression = getChordProgression();
      expect(progression.length).toBe(1);
      expect(progression[0].chord).toBe('C');
    });

    it('does nothing if no chord at position', () => {
      setChord('C', 0);
      
      removeChordAt(1920); // No chord here
      
      const progression = getChordProgression();
      expect(progression.length).toBe(1);
    });
  });

  describe('getChordProgression', () => {
    it('returns empty array if no chord stream', () => {
      const progression = getChordProgression();
      expect(progression).toEqual([]);
    });

    it('returns sorted chord progression', () => {
      setChord('C', 3840);
      setChord('G', 1920);
      setChord('F', 0);
      
      const progression = getChordProgression();
      expect(progression.length).toBe(3);
      expect(progression[0].chord).toBe('F');
      expect(progression[0].position).toBe(0);
      expect(progression[1].chord).toBe('G');
      expect(progression[1].position).toBe(1920);
      expect(progression[2].chord).toBe('C');
      expect(progression[2].position).toBe(3840);
    });
  });

  describe('Chord symbol parsing', () => {
    it('parses simple major chords', () => {
      setChord('C', 0);
      const progression = getChordProgression();
      const payload = progression[0];
      expect(payload.chord).toBe('C');
    });

    it('parses minor chords', () => {
      setChord('Dm', 0);
      const progression = getChordProgression();
      expect(progression[0].chord).toBe('Dm');
    });

    it('parses seventh chords', () => {
      setChord('G7', 0);
      const progression = getChordProgression();
      expect(progression[0].chord).toBe('G7');
    });

    it('parses complex chords', () => {
      setChord('Cmaj7', 0);
      setChord('Dm9', 1920);
      setChord('G7sus4', 3840);
      
      const progression = getChordProgression();
      expect(progression[0].chord).toBe('Cmaj7');
      expect(progression[1].chord).toBe('Dm9');
      expect(progression[2].chord).toBe('G7sus4');
    });
  });

  describe('Integration with tracker coloring (G026)', () => {
    it('provides chord context for harmony hints', () => {
      const contextStore = getBoardContextStore();
      
      setKey('C');
      setChord('Cmaj7', 0);
      
      // Context is available for tracker to use
      expect(contextStore.getCurrentKey()).toBe('C');
      expect(contextStore.getCurrentChord()).toBe('Cmaj7');
      
      // Chord stream is available for lookup
      const chordStreamId = contextStore.getChordStreamId();
      expect(chordStreamId).toBeTruthy();
      
      const store = getSharedEventStore();
      const stream = store.getStream(chordStreamId!);
      expect(stream?.events.length).toBeGreaterThan(0);
    });
  });
});
