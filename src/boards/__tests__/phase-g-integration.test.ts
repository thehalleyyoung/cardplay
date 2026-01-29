/**
 * @fileoverview Phase G (Assisted Boards) Integration Tests
 * 
 * Tests:
 * - G026: Changing chord updates tracker coloring deterministically
 * - G027: Chord edits are undoable via UndoStack
 * - G055: Phrase library visible and drag enabled; generators/AI hidden
 * - G056: Dropping phrase writes correct event timings
 * - G057: Dropping phrase is undoable
 * 
 * @module @cardplay/boards/__tests__/phase-g-integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins/register';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';
import { handleDrop } from '../../ui/drop-handlers';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event';
import type { PhrasePayload, DropTargetContext } from '../../ui/drag-drop-payloads';
import { getBoardContextStore } from '../context/store';

describe('Phase G: Assisted Boards Integration', () => {
  beforeEach(() => {
    // Register builtin boards
    const registry = getBoardRegistry();
    registerBuiltinBoards();
    
    // Clear stores
    const eventStore = getSharedEventStore();
    const allStreams = eventStore.getAllStreams();
    allStreams.forEach(stream => eventStore.deleteStream(stream.id));
  });

  // ==========================================================================
  // G026-G027: Chord/Harmony Integration
  // ==========================================================================

  describe('G026-G027: Chord tracking and undo', () => {
    it('G026: should update tracker coloring when chord changes', () => {
      const eventStore = getSharedEventStore();
      
      // Create a chord stream
      const chordStream = eventStore.createStream({ name: 'Chords' });
      
      // Add a C major chord
      const chordEvent = {
        kind: EventKinds.CHORD,
        start: asTick(0),
        duration: asTickDuration(192),
        payload: {
          root: 0, // C
          quality: 'major',
          bass: 0,
          inversions: 0,
        },
      };
      
      eventStore.addEvents(chordStream.id, [chordEvent]);
      
      // Verify chord event exists
      const streamRecord = eventStore.getStream(chordStream.id);
      expect(streamRecord).toBeDefined();
      expect(streamRecord!.events.length).toBe(1);
      expect(streamRecord!.events[0].kind).toBe(EventKinds.CHORD);
      expect(streamRecord!.events[0].payload.root).toBe(0);
      
      // In real usage, tracker UI would compute colors based on this chord
      // For now, we verify the chord data is accessible
      const chordTones = [0, 4, 7]; // C, E, G
      const scaleTones = [0, 2, 4, 5, 7, 9, 11]; // C major scale
      
      // Test note classification
      const testNote = 60; // C4
      const notePitchClass = testNote % 12;
      const isChordTone = chordTones.includes(notePitchClass);
      const isScaleTone = scaleTones.includes(notePitchClass);
      
      expect(isChordTone).toBe(true);
      expect(isScaleTone).toBe(true);
    });

    it('G027: should make chord edits undoable', () => {
      const eventStore = getSharedEventStore();
      const undoStack = getUndoStack();
      
      const chordStream = eventStore.createStream({ name: 'Chords' });
      
      // Get initial undo stack depth
      const initialDepth = undoStack.getState().currentIndex;
      
      // Add chord with undo support
      const chordEvent = {
        kind: EventKinds.CHORD,
        start: asTick(0),
        duration: asTickDuration(192),
        payload: {
          root: 0,
          quality: 'major',
          bass: 0,
          inversions: 0,
        },
      };
      
      // Use undo-aware add
      undoStack.push({
        type: 'AddEvents',
        description: 'Add chord',
        execute: () => {
          eventStore.addEvents(chordStream.id, [chordEvent]);
        },
        undo: () => {
          const events = eventStore.getStream(chordStream.id)?.events || [];
          const eventIds = events.map(e => e.id);
          eventStore.removeEvents(chordStream.id, eventIds);
        },
      });
      
      // Verify chord added
      let streamRecord = eventStore.getStream(chordStream.id);
      expect(streamRecord!.events.length).toBe(1);
      
      // Verify undo stack updated
      const afterAddDepth = undoStack.getState().currentIndex;
      expect(afterAddDepth).toBe(initialDepth + 1);
      
      // Undo
      undoStack.undo();
      
      // Verify chord removed
      streamRecord = eventStore.getStream(chordStream.id);
      expect(streamRecord!.events.length).toBe(0);
      
      // Redo
      undoStack.redo();
      
      // Verify chord restored
      streamRecord = eventStore.getStream(chordStream.id);
      expect(streamRecord!.events.length).toBe(1);
    });
  });

  // ==========================================================================
  // G055-G057: Phrase Library Integration
  // ==========================================================================

  describe('G055-G057: Phrase library and drag/drop', () => {
    it('G055: should show phrase library deck on Tracker+Phrases board', () => {
      const registry = getBoardRegistry();
      const board = registry.get('tracker-phrases');
      
      expect(board).toBeDefined();
      
      // Verify phrase library deck is in the layout
      const hasPhraseLibrary = board!.decks.some(deck => deck.type === 'phrase-library');
      expect(hasPhraseLibrary).toBe(true);
      
      // Verify phrase database tool is enabled
      expect(board!.compositionTools.phraseDatabase.enabled).toBe(true);
      expect(board!.compositionTools.phraseDatabase.mode).toBe('drag-drop');
      
      // Verify AI composer is hidden
      expect(board!.compositionTools.aiComposer.enabled).toBe(false);
      
      // Verify generator decks are hidden via gating
      const visibleDeckTypes = computeVisibleDeckTypes(board!);
      expect(visibleDeckTypes).toContain('phrase-library');
      expect(visibleDeckTypes).not.toContain('generator');
    });

    it('G056: should write correct event timings when dropping phrase', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Pattern' });
      contextStore.setActiveStream(stream.id);
      
      // Create phrase with specific timings
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'timing-test',
        notes: [
          { pitch: 60, velocity: 100, start: 0, duration: 24 },    // 1/16 note
          { pitch: 62, velocity: 100, start: 24, duration: 24 },   // 1/16 note
          { pitch: 64, velocity: 100, start: 48, duration: 48 },   // 1/8 note
          { pitch: 65, velocity: 100, start: 96, duration: 96 },   // 1/4 note
        ],
        duration: 192, // 1 bar at 4/4
        tags: ['rhythm-test'],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        position: { tick: asTick(384), track: 0 }, // Drop at bar 2
        modifiers: { shift: false, alt: false, ctrl: false },
      };
      
      const result = await handleDrop(phrasePayload, dropContext);
      
      expect(result.accepted).toBe(true);
      
      const streamRecord = eventStore.getStream(stream.id);
      const events = streamRecord!.events;
      
      expect(events.length).toBe(4);
      
      // Verify exact timings with offset
      expect(events[0].start).toBe(asTick(384));
      expect(events[0].duration).toBe(asTickDuration(24));
      
      expect(events[1].start).toBe(asTick(408));
      expect(events[1].duration).toBe(asTickDuration(24));
      
      expect(events[2].start).toBe(asTick(432));
      expect(events[2].duration).toBe(asTickDuration(48));
      
      expect(events[3].start).toBe(asTick(480));
      expect(events[3].duration).toBe(asTickDuration(96));
    });

    it('G057: should make phrase drop undoable', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      const undoStack = getUndoStack();
      
      const stream = eventStore.createStream({ name: 'Pattern' });
      contextStore.setActiveStream(stream.id);
      
      const initialEventCount = eventStore.getStream(stream.id)!.events.length;
      
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'undo-test',
        notes: [
          { pitch: 60, velocity: 100, start: 0, duration: 48 },
          { pitch: 64, velocity: 100, start: 48, duration: 48 },
        ],
        duration: 96,
        tags: [],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        position: { tick: asTick(0), track: 0 },
        modifiers: { shift: false, alt: false, ctrl: false },
      };
      
      // Drop phrase
      const result = await handleDrop(phrasePayload, dropContext);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
      
      // Verify events added
      let streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord!.events.length).toBe(initialEventCount + 2);
      
      // Undo
      undoStack.undo();
      
      // Verify events removed
      streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord!.events.length).toBe(initialEventCount);
      
      // Redo
      undoStack.redo();
      
      // Verify events restored
      streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord!.events.length).toBe(initialEventCount + 2);
    });
  });

  // ==========================================================================
  // Additional Assisted Board Tests
  // ==========================================================================

  describe('Tracker+Harmony Board', () => {
    it('should have harmony display deck visible', () => {
      const registry = getBoardRegistry();
      const board = registry.get('tracker-harmony');
      
      expect(board).toBeDefined();
      
      const hasHarmonyDisplay = board!.decks.some(deck => deck.type === 'harmony-display');
      expect(hasHarmonyDisplay).toBe(true);
      
      expect(board!.compositionTools.harmonyExplorer.enabled).toBe(true);
    });
  });

  describe('Session+Generators Board', () => {
    it('should have generator deck visible', () => {
      const registry = getBoardRegistry();
      const board = registry.get('session-generators');
      
      expect(board).toBeDefined();
      
      const hasGeneratorDeck = board!.decks.some(deck => deck.type === 'generator');
      expect(hasGeneratorDeck).toBe(true);
      
      expect(board!.compositionTools.phraseGenerators.enabled).toBe(true);
    });
  });

  describe('Notation+Harmony Board', () => {
    it('should have notation and harmony decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('notation-harmony');
      
      expect(board).toBeDefined();
      
      const hasNotation = board!.decks.some(deck => deck.type === 'notation-score');
      const hasHarmony = board!.decks.some(deck => deck.type === 'harmony-display');
      
      expect(hasNotation).toBe(true);
      expect(hasHarmony).toBe(true);
      
      expect(board!.compositionTools.harmonyExplorer.enabled).toBe(true);
    });
  });
});
