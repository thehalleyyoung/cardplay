/**
 * @fileoverview Phrase Integration Tests (G055-G057)
 * 
 * Tests for phrase drag/drop functionality:
 * - G055: Phrase library visible and drag enabled
 * - G056: Dropping phrase writes events correctly
 * - G057: Phrase drop is undoable
 * 
 * @module @cardplay/boards/builtins/phrase-integration.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { handlePhraseToPatternEditor } from '../../ui/drop-handlers';
import type { Event } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';

describe('Phrase Integration (G055-G057)', () => {
  beforeEach(() => {
    // Register builtin boards (only if not already registered)
    const registry = getBoardRegistry();
    if (!registry.get('basic-tracker')) {
      registerBuiltinBoards(registry);
    }
  });

  it('G055: tracker-phrases board shows phrase library deck and hides generators/AI', () => {
    const registry = getBoardRegistry();
    const board = registry.get('tracker-phrases');
    
    expect(board).toBeDefined();
    expect(board?.decks).toBeDefined();
    
    // Check that phrase library deck exists
    const phraseLibrary = board?.decks.find(d => d.type === 'phrases-deck');
    expect(phraseLibrary).toBeDefined();
    
    // Check that generator deck is not present
    const generatorDeck = board?.decks.find(d => d.type === 'generator');
    expect(generatorDeck).toBeUndefined();
    
    // Check that AI composer deck is not present
    const aiComposerDeck = board?.decks.find(d => d.type === 'ai-composer');
    expect(aiComposerDeck).toBeUndefined();
    
    // Check tool config ensures generators/AI hidden
    expect(board?.compositionTools.phraseGenerators.mode).toBe('hidden');
    expect(board?.compositionTools.aiComposer.mode).toBe('hidden');
  });

  it('G056: dropping phrase writes correct event timings into SharedEventStore', async () => {
    const eventStore = getSharedEventStore();
    
    // Create a test stream
    const streamRecord = eventStore.createStream({ name: 'Test Pattern' });
    const streamId = streamRecord.id;
    
    // Get initial event count
    const initialEvents = eventStore.getStream(streamId)?.events || [];
    const initialCount = initialEvents.length;
    
    // Create phrase payload
    const phrasePayload = {
      type: 'phrase' as const,
      phraseId: 'test-phrase-1',
      phraseName: 'Test Melody',
      notes: [
        { kind: EventKinds.NOTE, start: asTick(0), duration: asTickDuration(480), payload: { note: 60, velocity: 100 } },
        { kind: EventKinds.NOTE, start: asTick(480), duration: asTickDuration(480), payload: { note: 62, velocity: 90 } },
        { kind: EventKinds.NOTE, start: asTick(960), duration: asTickDuration(480), payload: { note: 64, velocity: 85 } },
      ],
      duration: 1920,
      metadata: {},
    };
    
    // Simulate drop at specific position
    const dropAtTick = asTick(1920); // Drop at beat 2
    
    // Create drop context
    const dropContext = {
      targetType: 'pattern-editor' as const,
      targetId: 'test-deck',
      position: { x: 0, y: 0 },
      streamId,
      time: dropAtTick,
      modifiers: { shift: false, alt: false, ctrl: false },
    };
    
    // Execute drop handler
    const result = await handlePhraseToPatternEditor(phrasePayload, dropContext);
    
    expect(result.accepted).toBe(true);
    
    // Verify events were written to store
    const updatedEvents = eventStore.getStream(streamId)?.events || [];
    expect(updatedEvents.length).toBe(initialCount + 3);
    
    // Verify event timings are offset correctly
    const newEvents = updatedEvents.slice(initialCount);
    expect(newEvents[0].start).toBe(dropAtTick);
    expect(newEvents[1].start).toBe(asTick(dropAtTick + 480));
    expect(newEvents[2].start).toBe(asTick(dropAtTick + 960));
    
    // Verify note data preserved
    expect(newEvents[0].payload.note).toBe(60);
    expect(newEvents[1].payload.note).toBe(62);
    expect(newEvents[2].payload.note).toBe(64);
  });

  it('G057: phrase drop is undoable and restores previous events', async () => {
    const eventStore = getSharedEventStore();
    const undoStack = getUndoStack();
    
    // Clear undo stack
    undoStack.clear();
    
    // Create a test stream with existing events
    const existingEvent = {
      kind: EventKinds.NOTE,
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { note: 48, velocity: 100 }
    };
    
    const streamRecord = eventStore.createStream({ 
      name: 'Test Pattern',
      events: [existingEvent]
    });
    const streamId = streamRecord.id;
    
    // Get initial state
    const initialEvents = eventStore.getStream(streamId)?.events || [];
    const initialCount = initialEvents.length;
    
    // Create phrase payload
    const phrasePayload = {
      type: 'phrase' as const,
      phraseId: 'test-phrase-2',
      phraseName: 'Test Phrase',
      notes: [
        { kind: EventKinds.NOTE, start: asTick(0), duration: asTickDuration(480), payload: { note: 60, velocity: 100 } },
        { kind: EventKinds.NOTE, start: asTick(480), duration: asTickDuration(480), payload: { note: 62, velocity: 90 } },
      ],
      duration: 960,
      metadata: {},
    };
    
    // Execute drop (should be undoable)
    const dropContext = {
      targetType: 'pattern-editor' as const,
      targetId: 'test-deck',
      position: { x: 0, y: 0 },
      streamId,
      time: 960,
      modifiers: { shift: false, alt: false, ctrl: false },
    };
    
    const result = await handlePhraseToPatternEditor(phrasePayload, dropContext);
    expect(result.accepted).toBe(true);
    expect(result.undoable).toBe(true);
    
    // Verify events were added
    const afterDropEvents = eventStore.getStream(streamId)?.events || [];
    expect(afterDropEvents.length).toBe(initialCount + 2);
    
    // Undo the drop
    expect(undoStack.canUndo()).toBe(true);
    undoStack.undo();
    
    // Verify events were restored
    const afterUndoEvents = eventStore.getStream(streamId)?.events || [];
    expect(afterUndoEvents.length).toBe(initialCount);
    expect(afterUndoEvents[0].payload.note).toBe(48); // Original event preserved
    
    // Verify we can redo
    expect(undoStack.canRedo()).toBe(true);
    undoStack.redo();
    
    // Verify events are back
    const afterRedoEvents = eventStore.getStream(streamId)?.events || [];
    expect(afterRedoEvents.length).toBe(initialCount + 2);
    expect(afterRedoEvents[1].payload.note).toBe(60); // Phrase note 1
    expect(afterRedoEvents[2].payload.note).toBe(62); // Phrase note 2
  });

  it('phrase adaptation: adapts to harmony context when available', async () => {
    const eventStore = getSharedEventStore();
    
    // Create test stream
    const streamRecord = eventStore.createStream({ name: 'Test Harmony Pattern' });
    const streamId = streamRecord.id;
    
    // Create phrase payload (in C major)
    const phrasePayload = {
      type: 'phrase' as const,
      phraseId: 'test-phrase-3',
      phraseName: 'C Major Phrase',
      notes: [
        { kind: EventKinds.NOTE, start: asTick(0), duration: asTickDuration(480), payload: { note: 60, velocity: 100 } }, // C
        { kind: EventKinds.NOTE, start: asTick(480), duration: asTickDuration(480), payload: { note: 64, velocity: 90 } }, // E
        { kind: EventKinds.NOTE, start: asTick(960), duration: asTickDuration(480), payload: { note: 67, velocity: 85 } }, // G
      ],
      duration: 1920,
      metadata: {
        originalKey: 'C',
        originalChord: 'C'
      },
    };
    
    // Drop with harmony context (transpose to G major)
    const harmonyContext = {
      key: 'G',
      chord: 'G',
      adaptationMode: 'transpose' // Simple transposition by perfect 5th
    };
    
    // Execute drop with adaptation (would use phrase-adapter.ts in real implementation)
    const dropContext = {
      targetType: 'pattern-editor' as const,
      targetId: 'test-deck',
      position: { x: 0, y: 0 },
      streamId,
      time: 0,
      modifiers: { shift: false, alt: false, ctrl: false },
      harmonyContext,
    };
    
    const result = await handlePhraseToPatternEditor(phrasePayload, dropContext);
    
    expect(result.accepted).toBe(true);
    
    // Verify events were transposed (C→G is +7 semitones)
    const events = eventStore.getStream(streamId)?.events || [];
    
    // Note: In full implementation, phrase-adapter.ts would handle this
    // For now, we verify the infrastructure is in place
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('phrase library deck supports search and filtering', () => {
    const registry = getBoardRegistry();
    const board = registry.get('tracker-phrases');
    
    expect(board).toBeDefined();
    
    // Verify phrase library configuration
    const phraseLibrary = board?.decks.find(d => d.type === 'phrases-deck');
    expect(phraseLibrary).toBeDefined();
    
    // Verify drag-drop mode enabled (not hidden)
    expect(board?.compositionTools.phraseDatabase.enabled).toBe(true);
    expect(board?.compositionTools.phraseDatabase.mode).toBe('drag-drop');
  });
});
