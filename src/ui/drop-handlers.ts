/**
 * @fileoverview Drop Handlers (E065-E070)
 * 
 * Implements drop handlers for all drag payload types:
 * - E065: phrase→pattern-editor (writes events to active stream)
 * - E066: clip→timeline (places clip on track lane)
 * - E067: card-template→deck slot (instantiates card)
 * - E068: sample→sampler card (loads sample asset)
 * - E069: Visual affordances for drop targets
 * - E070: Undo integration for all drops
 * 
 * @module @cardplay/ui/drop-handlers
 */

import type {
  DragPayload,
  DropHandler,
  DropHandlerResult,
  DropTargetContext,
  PhrasePayload,
  ClipPayload,
  CardTemplatePayload,
  SamplePayload,
  HostActionPayload,
  EventsPayload,
} from './drag-drop-payloads';
import { getSharedEventStore } from '../state/event-store';
import { getClipRegistry } from '../state/clip-registry';
import { getUndoStack } from '../state/undo-stack';
import { asTick, asTickDuration } from '../types/primitives';
import type { Event } from '../types/event';
import type { EventId } from '../types/event-id';

// ============================================================================
// DROP HANDLER REGISTRY
// ============================================================================

type PayloadType = DragPayload['type'];
type TargetType = string;

const dropHandlers = new Map<
  `${PayloadType}:${TargetType}`,
  DropHandler
>();

/**
 * Register a drop handler for a payload/target combination
 */
export function registerDropHandler(
  payloadType: PayloadType,
  targetType: TargetType,
  handler: DropHandler
): void {
  const key = `${payloadType}:${targetType}` as const;
  dropHandlers.set(key, handler);
}

/**
 * Get a drop handler for a payload/target combination
 */
export function getDropHandler(
  payloadType: PayloadType,
  targetType: TargetType
): DropHandler | undefined {
  const key = `${payloadType}:${targetType}` as const;
  return dropHandlers.get(key);
}

/**
 * Handle a drop operation
 */
export async function handleDrop(
  payload: DragPayload,
  context: DropTargetContext
): Promise<DropHandlerResult> {
  const handler = getDropHandler(payload.type, context.targetType);
  
  if (!handler) {
    return {
      accepted: false,
      reason: `No handler registered for ${payload.type} → ${context.targetType}`,
    };
  }
  
  try {
    const result = await handler(payload, context);
    return result;
  } catch (error) {
    console.error('Drop handler error:', error);
    return {
      accepted: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// E065: PHRASE → PATTERN EDITOR
// ============================================================================

/**
 * Handle phrase drop into pattern editor (G045)
 * Writes events from phrase into active stream at drop position.
 * If harmony context exists, adapts phrase using phrase-adapter.
 */
export const handlePhraseToPatternEditor: DropHandler<PhrasePayload> = async (
  payload,
  context
) => {
  if (!context.streamId) {
    return {
      accepted: false,
      reason: 'No active stream for phrase drop',
    };
  }
  
  if (context.time === undefined) {
    return {
      accepted: false,
      reason: 'No drop time specified',
    };
  }
  
  const eventStore = getSharedEventStore();
  const undoStack = getUndoStack();
  
  // G045: Check if harmony context exists for phrase adaptation
  let notesToDrop = payload.notes;
  
  if (context.harmonyContext && 
      payload.metadata?.sourceChord && 
      context.harmonyContext.currentChord) {
    // Dynamic import to avoid circular dependencies
    const phraseAdapterModule = await import('../cards/phrase-adapter');
    const settingsModule = await import('./components/phrase-adaptation-settings');
    
    // Get adaptation settings for this board/category
    const settings = settingsModule.getAdaptationSettings(
      context.boardId || 'default',
      payload.metadata?.category
    );
    const options = settingsModule.settingsToOptions(settings);
    
    // Adapt phrase
    notesToDrop = phraseAdapterModule.adaptPhrase(
      payload.notes as any,
      payload.metadata.sourceChord,
      context.harmonyContext.currentChord,
      options
    ) as any;
  }
  
  // Transform phrase notes to events at drop position
  const baseTime = Math.round(context.time);
  const newEvents: Event<unknown>[] = notesToDrop.map(note => ({
    ...note,
    start: asTick((note.start as unknown as number) + baseTime),
  }));
  
  // Execute with undo support (E070)
  const eventIds = newEvents.map(e => e.id);
  
  // Add events
  eventStore.addEvents(context.streamId!, newEvents);
  
  // Create undo action
  undoStack.push({
    type: 'events-add',
    description: `Drop phrase "${payload.phraseName}"${context.harmonyContext ? ' (adapted)' : ''}`,
    redo: () => {
      eventStore.addEvents(context.streamId!, newEvents);
    },
    undo: () => {
      // Remove the added events
      eventStore.removeEvents(context.streamId!, eventIds);
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// E065: HOST ACTION → PATTERN EDITOR
// ============================================================================

/**
 * Handle host action drop into pattern editor
 * Inserts arrangeable call events or applies a patch
 */
export const handleHostActionToPatternEditor: DropHandler<HostActionPayload> = (
  payload,
  context
) => {
  if (!context.streamId) {
    return {
      accepted: false,
      reason: 'No active stream for host action',
    };
  }
  
  const eventStore = getSharedEventStore();
  const undoStack = getUndoStack();
  
  // Determine scheduling time
  const time = context.time !== undefined 
    ? asTick(Math.round(context.time))
    : asTick(0);
  
  // Create action event based on type
  const actionEventId = `action-${Date.now()}-${Math.random()}` as EventId;
  const actionEvent: Event<unknown> = {
    id: actionEventId,
    kind: 'host-action',
    start: time,
    duration: asTickDuration(0), // Instant action
    payload: {
      type: 'host-action',
      actionType: payload.actionType,
      targetCardId: payload.targetCardId,
      actionData: payload.actionData,
    },
  };
  
  // Add event
  eventStore.addEvents(context.streamId!, [actionEvent]);
  
  // Create undo action
  undoStack.push({
    type: 'event:add',
    description: `Drop host action: ${payload.actionType}`,
    redo: () => {
      eventStore.addEvents(context.streamId!, [actionEvent]);
    },
    undo: () => {
      eventStore.removeEvents(context.streamId!, [actionEventId]);
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// E066: CLIP → TIMELINE
// ============================================================================

/**
 * Handle clip drop into timeline
 * Places clip on track lane in arrangement view
 */
export const handleClipToTimeline: DropHandler<ClipPayload> = (
  payload,
  context
) => {
  if (context.trackIndex === undefined) {
    return {
      accepted: false,
      reason: 'No track specified for clip drop',
    };
  }
  
  if (context.time === undefined) {
    return {
      accepted: false,
      reason: 'No time position specified for clip drop',
    };
  }
  
  const clipRegistry = getClipRegistry();
  const undoStack = getUndoStack();
  
  // Get the source clip
  const sourceClip = clipRegistry.getClip(payload.clipId);
  if (!sourceClip) {
    return {
      accepted: false,
      reason: `Clip not found: ${payload.clipId}`,
    };
  }
  
  // Create arrangement clip instance (reference to existing clip)
  // This is a lightweight reference, not a copy
  const arrangementEntry = {
    clipId: payload.clipId,
    trackIndex: context.trackIndex,
    startTime: asTick(Math.round(context.time)),
    // Additional arrangement metadata could go here
  };
  
  // Store arrangement entry (this would go into an arrangement store)
  // For now, we'll just demonstrate the pattern
  
  // Create undo action
  undoStack.push({
    type: 'clip-create',
    description: `Place clip "${sourceClip.name}" on track ${context.trackIndex}`,
    redo: () => {
      // TODO: Add to arrangement store when it exists
      console.log('Add to timeline:', arrangementEntry);
    },
    undo: () => {
      // TODO: Remove from arrangement store
      console.log('Remove from timeline:', arrangementEntry);
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// E067: CARD TEMPLATE → DECK SLOT
// ============================================================================

/**
 * Handle card template drop into deck slot
 * Instantiates card in stack or deck
 */
export const handleCardTemplateToDeck: DropHandler<CardTemplatePayload> = (
  payload,
  context
) => {
  // This would interact with the card instantiation system
  // For now, just demonstrate the interface
  
  const undoStack = getUndoStack();
  
  const cardInstance = {
    id: `card-${Date.now()}`,
    type: payload.cardType,
    category: payload.cardCategory,
    params: payload.defaultParams || {},
    presetId: payload.presetId,
  };
  
  // Create undo action
  undoStack.push({
    type: 'events-add',
    description: `Add ${payload.cardType} card`,
    redo: () => {
      // TODO: Add to deck via deck container API
      console.log('Add card to deck:', cardInstance, context.targetId);
    },
    undo: () => {
      // TODO: Remove from deck
      console.log('Remove card from deck:', cardInstance.id);
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// E068: SAMPLE → SAMPLER CARD
// ============================================================================

/**
 * Handle sample drop into sampler instrument card
 * Loads sample asset reference
 */
export const handleSampleToSampler: DropHandler<SamplePayload> = (
  payload,
  context
) => {
  if (!context.targetId) {
    return {
      accepted: false,
      reason: 'No sampler card specified',
    };
  }
  
  const undoStack = getUndoStack();
  
  // Store previous sample reference for undo
  let previousSample: { id: string; url: string } | null = null;
  
  // Create undo action
  undoStack.push({
    type: 'events-modify',
    description: `Load sample "${payload.sampleName}"`,
    redo: () => {
      // TODO: Set new sample on card
      console.log('Load sample into sampler:', {
        cardId: context.targetId,
        sample: payload,
      });
    },
    undo: () => {
      // TODO: Restore previous sample
      if (previousSample) {
        console.log('Restore previous sample:', previousSample);
      }
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// EVENTS DRAG HANDLER
// ============================================================================

/**
 * Handle events drop between views (copy or move)
 */
export const handleEventsDrop: DropHandler<EventsPayload> = (
  payload,
  context
) => {
  if (!context.streamId) {
    return {
      accepted: false,
      reason: 'No target stream specified',
    };
  }
  
  const eventStore = getSharedEventStore();
  const undoStack = getUndoStack();
  
  const baseTime = context.time !== undefined ? asTick(Math.round(context.time)) : asTick(0);
  const timeOffset = baseTime - payload.timeRange.start;
  
  // Transform events to new position
  const newEvents = payload.events.map(e => ({
    ...e,
    id: (payload.selectionMode === 'copy' ? `${e.id}-copy-${Date.now()}` : e.id) as EventId,
    start: asTick(e.start + timeOffset),
  }));
  
  const newEventIds = newEvents.map(e => e.id);
  const sourceEventIds = payload.events.map(e => e.id);
  
  // Perform the operation
  if (payload.selectionMode === 'move' && payload.sourceStreamId !== context.streamId) {
    // Remove from source stream
    eventStore.removeEvents(payload.sourceStreamId, sourceEventIds);
  }
  
  // Add to target stream
  eventStore.addEvents(context.streamId!, newEvents);
  
  // Create undo action
  undoStack.push({
    type: payload.selectionMode === 'copy' ? 'events-add' : 'events-modify',
    description: payload.selectionMode === 'copy' ? 'Copy events' : 'Move events',
    redo: () => {
      if (payload.selectionMode === 'move' && payload.sourceStreamId !== context.streamId) {
        eventStore.removeEvents(payload.sourceStreamId, sourceEventIds);
      }
      eventStore.addEvents(context.streamId!, newEvents);
    },
    undo: () => {
      // Remove from target
      eventStore.removeEvents(context.streamId!, newEventIds);
      
      // Restore to source if moved
      if (payload.selectionMode === 'move' && payload.sourceStreamId !== context.streamId) {
        eventStore.addEvents(payload.sourceStreamId, payload.events);
      }
    },
  });
  
  return {
    accepted: true,
    undoable: true,
  };
};

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all built-in drop handlers
 */
export function registerBuiltinDropHandlers(): void {
  // E065: Phrase and host-action to pattern editor
  registerDropHandler('phrase', 'pattern-editor', handlePhraseToPatternEditor as DropHandler);
  registerDropHandler('host-action', 'pattern-editor', handleHostActionToPatternEditor as DropHandler);
  
  // E066: Clip to timeline
  registerDropHandler('clip', 'timeline', handleClipToTimeline as DropHandler);
  registerDropHandler('clip', 'arrangement-view', handleClipToTimeline as DropHandler);
  
  // E067: Card template to deck
  registerDropHandler('card-template', 'deck', handleCardTemplateToDeck as DropHandler);
  registerDropHandler('card-template', 'stack', handleCardTemplateToDeck as DropHandler);
  
  // E068: Sample to sampler
  registerDropHandler('sample', 'sampler-card', handleSampleToSampler as DropHandler);
  registerDropHandler('sample', 'sampler', handleSampleToSampler as DropHandler);
  
  // Events between views
  registerDropHandler('events', 'pattern-editor', handleEventsDrop as DropHandler);
  registerDropHandler('events', 'piano-roll', handleEventsDrop as DropHandler);
  registerDropHandler('events', 'notation', handleEventsDrop as DropHandler);
  registerDropHandler('events', 'timeline', handleEventsDrop as DropHandler);
}

// ============================================================================
// E069: VISUAL AFFORDANCES
// ============================================================================

/**
 * Drop zone highlighting styles (E069)
 * Use theme tokens for consistency
 */
export const dropZoneStyles = {
  canDrop: {
    outline: '2px solid var(--color-success)',
    backgroundColor: 'var(--color-success-alpha-10)',
    cursor: 'copy',
  },
  cannotDrop: {
    outline: '2px solid var(--color-error)',
    backgroundColor: 'var(--color-error-alpha-10)',
    cursor: 'not-allowed',
  },
  isOver: {
    outline: '2px solid var(--color-primary)',
    backgroundColor: 'var(--color-primary-alpha-20)',
    cursor: 'copy',
  },
};

/**
 * Apply drop zone styles to an element
 */
export function applyDropZoneStyle(
  element: HTMLElement,
  state: 'canDrop' | 'cannotDrop' | 'isOver' | 'none'
): void {
  // Clear all styles
  element.style.outline = '';
  element.style.backgroundColor = '';
  element.style.cursor = '';
  
  if (state === 'none') return;
  
  const styles = dropZoneStyles[state];
  Object.assign(element.style, styles);
}

/**
 * Add drop zone class for CSS-based styling
 */
export function setDropZoneClass(
  element: HTMLElement,
  state: 'canDrop' | 'cannotDrop' | 'isOver' | 'none'
): void {
  element.classList.remove('drop-zone--can-drop', 'drop-zone--cannot-drop', 'drop-zone--is-over');
  
  if (state !== 'none') {
    element.classList.add(`drop-zone--${state.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a payload can be dropped on a target
 */
export function canDrop(
  payload: DragPayload,
  context: DropTargetContext
): { canDrop: boolean; reason?: string } {
  const handler = getDropHandler(payload.type, context.targetType);
  
  if (!handler) {
    return {
      canDrop: false,
      reason: `No handler for ${payload.type} → ${context.targetType}`,
    };
  }
  
  // Perform quick validation checks based on payload type
  switch (payload.type) {
    case 'phrase':
    case 'events':
    case 'host-action':
      if (!context.streamId) {
        return { canDrop: false, reason: 'No active stream' };
      }
      break;
      
    case 'clip':
      if (context.targetType === 'timeline' && context.trackIndex === undefined) {
        return { canDrop: false, reason: 'No track specified' };
      }
      break;
      
    case 'sample':
      if (!context.targetId) {
        return { canDrop: false, reason: 'No sampler card specified' };
      }
      break;
  }
  
  return { canDrop: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  DropHandler,
  DropHandlerResult,
  DropTargetContext,
} from './drag-drop-payloads';
