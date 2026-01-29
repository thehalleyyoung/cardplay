/**
 * @fileoverview Drop Handlers Tests (E065-E070)
 * 
 * Tests for all drop handler implementations.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerDropHandler,
  getDropHandler,
  handleDrop,
  handlePhraseToPatternEditor,
  handleHostActionToPatternEditor,
  handleClipToTimeline,
  handleCardTemplateToDeck,
  handleSampleToSampler,
  handleEventsDrop,
  registerBuiltinDropHandlers,
  canDrop,
  applyDropZoneStyle,
  setDropZoneClass,
} from './drop-handlers';
import type {
  PhrasePayload,
  ClipPayload,
  CardTemplatePayload,
  SamplePayload,
  HostActionPayload,
  EventsPayload,
  DropTargetContext,
} from './drag-drop-payloads';
import { asTick } from '../types/primitives';

// Mock stores
vi.mock('../state/event-store', () => ({
  getSharedEventStore: vi.fn(() => ({
    addEvents: vi.fn(),
    removeEvents: vi.fn(),
  })),
}));

vi.mock('../state/clip-registry', () => ({
  getClipRegistry: vi.fn(() => ({
    getClip: vi.fn((id) => ({
      id,
      name: 'Test Clip',
      streamId: 'stream-1',
      duration: asTick(1920),
      loop: true,
    })),
  })),
}));

vi.mock('../state/undo-stack', () => ({
  getUndoStack: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('Drop Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Handler Registry', () => {
    it('should register and retrieve handlers', () => {
      const handler = vi.fn();
      registerDropHandler('phrase', 'pattern-editor', handler);
      
      const retrieved = getDropHandler('phrase', 'pattern-editor');
      expect(retrieved).toBe(handler);
    });

    it('should return undefined for unregistered combinations', () => {
      const handler = getDropHandler('phrase', 'nonexistent-target');
      expect(handler).toBeUndefined();
    });
  });

  describe('E065: Phrase → Pattern Editor', () => {
    const phrasePayload: PhrasePayload = {
      type: 'phrase',
      phraseId: 'phrase-1',
      phraseName: 'Test Phrase',
      notes: [
        { id: 'note-1', start: asTick(0), duration: asTick(480), payload: { note: 60 } },
        { id: 'note-2', start: asTick(480), duration: asTick(480), payload: { note: 62 } },
      ],
      duration: 960,
      tags: ['melody'],
    };

    const context: DropTargetContext = {
      targetType: 'pattern-editor',
      targetId: 'editor-1',
      streamId: 'stream-1',
      time: 1920,
      position: { x: 0, y: 0 },
    };

    it('should accept phrase drop with valid context', async () => {
      const result = await handlePhraseToPatternEditor(phrasePayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should reject phrase drop without stream ID', async () => {
      const invalidContext = { ...context, streamId: undefined };
      const result = await handlePhraseToPatternEditor(phrasePayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('stream');
    });

    it('should reject phrase drop without time', async () => {
      const invalidContext = { ...context, time: undefined };
      const result = await handlePhraseToPatternEditor(phrasePayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('time');
    });
  });

  describe('E065: Host Action → Pattern Editor', () => {
    const hostActionPayload: HostActionPayload = {
      type: 'host-action',
      actionType: 'set-parameter',
      actionData: {
        parameter: 'volume',
        value: 0.8,
      },
      targetCardId: 'card-1',
    };

    const context: DropTargetContext = {
      targetType: 'pattern-editor',
      targetId: 'editor-1',
      streamId: 'stream-1',
      time: 1920,
      position: { x: 0, y: 0 },
    };

    it('should accept host action drop with valid context', async () => {
      const result = await handleHostActionToPatternEditor(hostActionPayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should reject host action drop without stream ID', async () => {
      const invalidContext = { ...context, streamId: undefined };
      const result = await handleHostActionToPatternEditor(hostActionPayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('stream');
    });

    it('should handle all action types', async () => {
      const actionTypes: Array<HostActionPayload['actionType']> = [
        'set-parameter',
        'invoke-method',
        'patch-state',
      ];

      for (const actionType of actionTypes) {
        const payload: HostActionPayload = {
          ...hostActionPayload,
          actionType,
        };
        const result = await handleHostActionToPatternEditor(payload, context);
        expect(result.accepted).toBe(true);
      }
    });
  });

  describe('E066: Clip → Timeline', () => {
    const clipPayload: ClipPayload = {
      type: 'clip',
      clipId: 'clip-1' as any,
      streamId: 'stream-1',
      clipName: 'Test Clip',
      duration: 1920,
      loop: true,
    };

    const context: DropTargetContext = {
      targetType: 'timeline',
      targetId: 'timeline-1',
      trackIndex: 2,
      time: 3840,
      position: { x: 0, y: 0 },
    };

    it('should accept clip drop with valid context', async () => {
      const result = await handleClipToTimeline(clipPayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should reject clip drop without track index', async () => {
      const invalidContext = { ...context, trackIndex: undefined };
      const result = await handleClipToTimeline(clipPayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('track');
    });

    it('should reject clip drop without time', async () => {
      const invalidContext = { ...context, time: undefined };
      const result = await handleClipToTimeline(clipPayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('time');
    });
  });

  describe('E067: Card Template → Deck', () => {
    const cardPayload: CardTemplatePayload = {
      type: 'card-template',
      cardType: 'synthesizer',
      cardCategory: 'instrument',
      defaultParams: { waveform: 'saw', cutoff: 2000 },
    };

    const context: DropTargetContext = {
      targetType: 'deck',
      targetId: 'deck-1',
      position: { x: 0, y: 0 },
    };

    it('should accept card template drop', async () => {
      const result = await handleCardTemplateToDeck(cardPayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should handle card with preset', async () => {
      const payloadWithPreset = { ...cardPayload, presetId: 'preset-123' };
      const result = await handleCardTemplateToDeck(payloadWithPreset, context);
      expect(result.accepted).toBe(true);
    });
  });

  describe('E068: Sample → Sampler', () => {
    const samplePayload: SamplePayload = {
      type: 'sample',
      sampleId: 'sample-1',
      sampleName: 'Kick.wav',
      sampleUrl: '/samples/kick.wav',
      duration: 1.2,
      tags: ['drums', 'kick'],
    };

    const context: DropTargetContext = {
      targetType: 'sampler-card',
      targetId: 'sampler-1',
      position: { x: 0, y: 0 },
    };

    it('should accept sample drop with valid context', async () => {
      const result = await handleSampleToSampler(samplePayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should reject sample drop without target ID', async () => {
      const invalidContext = { ...context, targetId: undefined };
      const result = await handleSampleToSampler(samplePayload, invalidContext);
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('sampler');
    });
  });

  describe('Events Drag', () => {
    const eventsPayload: EventsPayload = {
      type: 'events',
      events: [
        { id: 'e1', start: asTick(0), duration: asTick(480), payload: { note: 60 } },
        { id: 'e2', start: asTick(480), duration: asTick(480), payload: { note: 62 } },
      ],
      sourceStreamId: 'stream-1',
      timeRange: { start: 0, end: 960 },
      selectionMode: 'copy',
    };

    const context: DropTargetContext = {
      targetType: 'pattern-editor',
      targetId: 'editor-1',
      streamId: 'stream-2',
      time: 1920,
      position: { x: 0, y: 0 },
    };

    it('should accept events copy', async () => {
      const result = await handleEventsDrop(eventsPayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should accept events move', async () => {
      const movePayload = { ...eventsPayload, selectionMode: 'move' as const };
      const result = await handleEventsDrop(movePayload, context);
      expect(result.accepted).toBe(true);
      expect(result.undoable).toBe(true);
    });

    it('should reject events drop without stream', async () => {
      const invalidContext = { ...context, streamId: undefined };
      const result = await handleEventsDrop(eventsPayload, invalidContext);
      expect(result.accepted).toBe(false);
    });
  });

  describe('Builtin Registration', () => {
    it('should register all builtin handlers', () => {
      registerBuiltinDropHandlers();
      
      // Check key combinations are registered
      expect(getDropHandler('phrase', 'pattern-editor')).toBeDefined();
      expect(getDropHandler('host-action', 'pattern-editor')).toBeDefined();
      expect(getDropHandler('clip', 'timeline')).toBeDefined();
      expect(getDropHandler('card-template', 'deck')).toBeDefined();
      expect(getDropHandler('sample', 'sampler-card')).toBeDefined();
      expect(getDropHandler('events', 'pattern-editor')).toBeDefined();
    });
  });

  describe('canDrop Validation', () => {
    beforeEach(() => {
      registerBuiltinDropHandlers();
    });

    it('should validate phrase drops', () => {
      const payload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'p1',
        phraseName: 'Test',
        notes: [],
        duration: 960,
      };

      const validContext: DropTargetContext = {
        targetType: 'pattern-editor',
        targetId: 'e1',
        streamId: 'stream-1',
        position: { x: 0, y: 0 },
      };

      expect(canDrop(payload, validContext).canDrop).toBe(true);

      const invalidContext = { ...validContext, streamId: undefined };
      const result = canDrop(payload, invalidContext);
      expect(result.canDrop).toBe(false);
      expect(result.reason).toContain('stream');
    });

    it('should validate clip drops', () => {
      const payload: ClipPayload = {
        type: 'clip',
        clipId: 'c1' as any,
        streamId: 's1',
        duration: 1920,
        loop: true,
      };

      const validContext: DropTargetContext = {
        targetType: 'timeline',
        targetId: 't1',
        trackIndex: 0,
        position: { x: 0, y: 0 },
      };

      expect(canDrop(payload, validContext).canDrop).toBe(true);

      const invalidContext = { ...validContext, trackIndex: undefined };
      const result = canDrop(payload, invalidContext);
      expect(result.canDrop).toBe(false);
      expect(result.reason).toContain('track');
    });

    it('should reject unregistered combinations', () => {
      const payload: PhrasePayload = {
        type: 'phrase',
        phraseId: 'p1',
        phraseName: 'Test',
        notes: [],
        duration: 960,
      };

      const context: DropTargetContext = {
        targetType: 'nonexistent-target',
        targetId: 'x',
        position: { x: 0, y: 0 },
      };

      const result = canDrop(payload, context);
      expect(result.canDrop).toBe(false);
      expect(result.reason).toContain('No handler');
    });
  });

  describe('E069: Visual Affordances', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
    });

    it('should apply canDrop styles', () => {
      applyDropZoneStyle(element, 'canDrop');
      expect(element.style.outline).toContain('success');
      expect(element.style.cursor).toBe('copy');
    });

    it('should apply cannotDrop styles', () => {
      applyDropZoneStyle(element, 'cannotDrop');
      expect(element.style.outline).toContain('error');
      expect(element.style.cursor).toBe('not-allowed');
    });

    it('should apply isOver styles', () => {
      applyDropZoneStyle(element, 'isOver');
      expect(element.style.outline).toContain('primary');
    });

    it('should clear styles when state is none', () => {
      applyDropZoneStyle(element, 'canDrop');
      applyDropZoneStyle(element, 'none');
      expect(element.style.outline).toBe('');
      expect(element.style.cursor).toBe('');
    });

    it('should set drop zone classes', () => {
      setDropZoneClass(element, 'canDrop');
      expect(element.classList.contains('drop-zone--can-drop')).toBe(true);

      setDropZoneClass(element, 'isOver');
      expect(element.classList.contains('drop-zone--can-drop')).toBe(false);
      expect(element.classList.contains('drop-zone--is-over')).toBe(true);

      setDropZoneClass(element, 'none');
      expect(element.classList.contains('drop-zone--is-over')).toBe(false);
    });
  });

  describe('E070: Undo Integration', () => {
    it('should mark all drop results as undoable', async () => {
      registerBuiltinDropHandlers();

      const testCases: Array<{
        payload: any;
        context: DropTargetContext;
      }> = [
        {
          payload: {
            type: 'phrase',
            phraseId: 'p1',
            phraseName: 'Test',
            notes: [],
            duration: 960,
          },
          context: {
            targetType: 'pattern-editor',
            targetId: 'e1',
            streamId: 'stream-1',
            time: 0,
            position: { x: 0, y: 0 },
          },
        },
        {
          payload: {
            type: 'clip',
            clipId: 'c1',
            streamId: 's1',
            duration: 1920,
            loop: true,
          },
          context: {
            targetType: 'timeline',
            targetId: 't1',
            trackIndex: 0,
            time: 0,
            position: { x: 0, y: 0 },
          },
        },
      ];

      for (const { payload, context } of testCases) {
        const result = await handleDrop(payload, context);
        if (result.accepted) {
          expect(result.undoable).toBe(true);
        }
      }
    });
  });
});
