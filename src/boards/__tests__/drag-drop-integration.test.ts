/**
 * @fileoverview Drag/Drop Integration Tests (E079-E080)
 * 
 * Tests:
 * - E079: phrase drop writes events into SharedEventStore
 * - E080: disallowed drop rejected with reason (Phase D validate-deck-drop)
 * 
 * @module @cardplay/boards/__tests__/drag-drop-integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleDrop, registerDropHandler, registerBuiltinDropHandlers } from '../../ui/drop-handlers';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getBoardContextStore } from '../context/store';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';
import { createNoteEvent } from '../../types/event';
import type { PhrasePayload, CardTemplatePayload, DropTargetContext } from '../../ui/drag-drop-payloads';
import type { Event } from '../../types/event';

describe('Drag/Drop Integration (E079-E080)', () => {
  beforeEach(() => {
    // Register all drop handlers
    registerBuiltinDropHandlers();
    
    // Reset stores before each test
    const eventStore = getSharedEventStore();
    const clipRegistry = getClipRegistry();
    const contextStore = getBoardContextStore();
    
    // Clear existing data
    const allStreams = eventStore.getAllStreams();
    allStreams.forEach(stream => {
      eventStore.deleteStream(stream.id);
    });
    
    const allClips = clipRegistry.getAllClips();
    allClips.forEach(clip => {
      clipRegistry.deleteClip(clip.id);
    });
  });

  // ==========================================================================
  // E079: Phrase drop writes events into SharedEventStore
  // ==========================================================================

  describe('E079: Phrase drop writes events into store', () => {
    it('should write phrase notes to active stream', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      // Create a test stream
      const stream = eventStore.createStream({ name: 'Test Pattern' });
      contextStore.setActiveStream(stream.id);
      
      // Create phrase payload with proper Event objects
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'test-phrase-1',
        phraseName: 'Test Phrase',
        notes: [
          createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) }),
          createNoteEvent({ pitch: 64, velocity: 100, start: asTick(48), duration: asTickDuration(48) }),
          createNoteEvent({ pitch: 67, velocity: 100, start: asTick(96), duration: asTickDuration(48) }),
        ],
        duration: 192,
        tags: ['melodic', 'test'],
      };
      
      // Create drop context with required fields
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'tracker-deck-1',
        position: { x: 0, y: 0 },
        streamId: stream.id, // Required by handlePhraseToPatternEditor
        time: 0, // Drop position in ticks
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      // Perform drop
      const result = await handleDrop(phrasePayload, dropContext);
      
      // Verify drop accepted
      expect(result.accepted).toBe(true);
      
      // Verify events written to store
      const streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord).toBeDefined();
      
      const events = streamRecord!.events;
      expect(events.length).toBe(3);
      
      // Verify first note
      expect(events[0].kind).toBe(EventKinds.NOTE);
      expect(events[0].start).toBe(asTick(0));
      expect(events[0].duration).toBe(asTickDuration(48));
      expect(events[0].payload.pitch).toBe(60);
      expect(events[0].payload.velocity).toBe(100);
      
      // Verify second note
      expect(events[1].kind).toBe(EventKinds.NOTE);
      expect(events[1].start).toBe(asTick(48));
      expect(events[1].duration).toBe(asTickDuration(48));
      expect(events[1].payload.pitch).toBe(64);
      
      // Verify third note
      expect(events[2].kind).toBe(EventKinds.NOTE);
      expect(events[2].start).toBe(asTick(96));
      expect(events[2].duration).toBe(asTickDuration(48));
      expect(events[2].payload.pitch).toBe(67);
    });

    it('should offset phrase notes by drop position', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test Pattern' });
      contextStore.setActiveStream(stream.id);
      
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'test-phrase-2',
        phraseName: 'Test Phrase 2',
        notes: [
          createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) }),
        ],
        duration: 48,
        tags: [],
      };
      
      // Drop at tick 192
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'tracker-deck-1',
        position: { x: 0, y: 192 },
        streamId: stream.id,
        time: 192,
      } as any;
      
      const result = await handleDrop(phrasePayload, dropContext);
      
      expect(result.accepted).toBe(true);
      
      const streamRecord = eventStore.getStream(stream.id);
      const events = streamRecord!.events;
      
      // Note should be offset to start at tick 192
      expect(events[0].start).toBe(asTick(192));
    });

    it('should handle empty phrase gracefully', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test Pattern' });
      contextStore.setActiveStream(stream.id);
      
      const emptyPhrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'empty-phrase',
        phraseName: 'Empty Phrase',
        notes: [],
        duration: 0,
        tags: [],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'tracker-deck-1',
        position: { x: 0, y: 0 },
        streamId: stream.id,
        time: 0,
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      const result = await handleDrop(emptyPhrasePayload, dropContext);
      
      // Should accept but write no events
      expect(result.accepted).toBe(true);
      
      const streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord!.events.length).toBe(0);
    });
  });

  // ==========================================================================
  // E080: Disallowed drop rejected with reason
  // ==========================================================================

  describe('E080: Disallowed drops rejected with reason', () => {
    it('should reject drop when no active stream exists', async () => {
      const contextStore = getBoardContextStore();
      
      // Clear active stream
      contextStore.setActiveStream(null);
      
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'test-phrase',
        phraseName: 'Test Phrase',
        notes: [createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) })],
        duration: 48,
        tags: [],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'test-deck',
        position: { x: 0, y: 0 },
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      const result = await handleDrop(phrasePayload, dropContext);
      
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('active stream');
    });

    it('should reject drop on unsupported target type', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      contextStore.setActiveStream(stream.id);
      
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'test-phrase',
        phraseName: 'Test Phrase',
        notes: [createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) })],
        duration: 48,
        tags: [],
      };
      
      // Drop on unsupported target
      const dropContext: DropTargetContext = {
        targetType: 'unsupported-target',
        targetId: 'test-deck',
        position: { x: 0, y: 0 },
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      const result = await handleDrop(phrasePayload, dropContext);
      
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('No handler');
    });

    it('should reject generator card drop on manual-only deck', async () => {
      // This test simulates Phase D gating validation
      // A generator card template should not be droppable on a manual-only deck
      
      const cardPayload: CardTemplatePayload = {
        type: 'card-template',
        cardType: 'generator',
        cardCategory: 'generator',
        defaultParams: {
          style: 'melodic',
          seed: 42,
        },
      };
      
      // Drop on manual-only deck (e.g., dsp-chain that only accepts effects)
      const dropContext: DropTargetContext = {
        targetType: 'dsp-chain',
        targetId: 'test-deck',
        position: { index: 0 },
        modifiers: { shift: false, alt: false, ctrl: false },
        deckControlLevel: 'full-manual', // Manual-only deck
      } as any;
      
      const result = await handleDrop(cardPayload, dropContext);
      
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('generator');
    });

    it('should provide helpful reason when validation fails', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      contextStore.setActiveStream(stream.id);
      
      // Create malformed payload (missing required field)
      const badPayload = {
        type: 'phrase',
        phraseId: 'bad-phrase',
        // Missing notes and duration fields
      } as any;
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'test-deck',
        position: { x: 0, y: 0 },
        modifiers: { shift: false, alt: false, ctrl: false },
      };
      
      const result = await handleDrop(badPayload, dropContext);
      
      // Should fail validation
      expect(result.accepted).toBe(false);
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(result.reason!.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Additional Integration Tests
  // ==========================================================================

  describe('Drop handler undo integration', () => {
    it('should mark drop as undoable when successful', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Test' });
      contextStore.setActiveStream(stream.id);
      
      const phrasePayload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'test-phrase',
        phraseName: 'Test Phrase',
        notes: [createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) })],
        duration: 48,
        tags: [],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'test-deck',
        position: { x: 0, y: 0 },
        streamId: stream.id,
        time: 0,
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      const result = await handleDrop(phrasePayload, dropContext);
      
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });
  });

  describe('Multi-track phrase drops', () => {
    it('should handle phrases with multiple tracks', async () => {
      const eventStore = getSharedEventStore();
      const contextStore = getBoardContextStore();
      
      const stream = eventStore.createStream({ name: 'Multi-track' });
      contextStore.setActiveStream(stream.id);
      
      const multiTrackPhrase: PhrasePayload = {
        type: 'phrase',
        phraseId: 'multi-track-phrase',
        phraseName: 'Multi-track Phrase',
        notes: [
          createNoteEvent({ pitch: 60, velocity: 100, start: asTick(0), duration: asTickDuration(48) }),
          createNoteEvent({ pitch: 48, velocity: 80, start: asTick(0), duration: asTickDuration(96) }),
        ],
        duration: 96,
        tags: ['chord'],
      };
      
      const dropContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'test-deck',
        position: { x: 0, y: 0 },
        streamId: stream.id,
        time: 0,
        modifiers: { shift: false, alt: false, ctrl: false },
      } as any;
      
      const result = await handleDrop(multiTrackPhrase, dropContext);
      
      expect(result.accepted).toBe(true);
      
      const streamRecord = eventStore.getStream(stream.id);
      expect(streamRecord!.events.length).toBe(2);
    });
  });
});
