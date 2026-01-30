/**
 * @fileoverview Tracker User Persona Enhancements
 * 
 * Deep workflow enhancements for tracker power users including
 * pattern operations, effect commands, and macro automation.
 * 
 * @module @cardplay/boards/personas/tracker-user-enhancements
 */

import type { EventStreamId, EventId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { asEventId } from '../../types/event-id';
import { EventKinds } from '../../types/event-kind';
import { getUndoStack } from '../../state/undo-stack';
import { asTick, asTickDuration } from '../../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pattern operation context menu item
 */
export interface PatternContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  enabled: boolean;
  submenu?: PatternContextMenuItem[];
}

/**
 * Groove template for humanization
 */
export interface GrooveTemplate {
  id: string;
  name: string;
  timingOffsets: number[]; // Per step, in ticks
  velocityOffsets: number[]; // Per step, velocity adjustment
  swingAmount: number; // 0-100
}

/**
 * Pattern transformation options
 */
export interface TransformOptions {
  reverse?: boolean;
  invert?: boolean;
  rotate?: number; // Steps to rotate
  timeStretch?: number; // Multiplier
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

/**
 * Clones a pattern
 */
export function clonePattern(streamId: EventStreamId): EventStreamId | null {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return null;

  // Create new stream with cloned events
  const newStreamName = `${stream.name} (Copy)`;
  const newStreamId = store.createStream({ name: newStreamName });

  // Copy all events
  const clonedEvents = stream.events.map((event) => ({
    ...event,
    id: asEventId(`${event.id}-clone-${Date.now()}`),
  }));

  store.addEvents(newStreamId.id, clonedEvents as any);

  // Record undo action
  getUndoStack().push({
    type: 'stream-create',
    description: `Clone pattern ${stream.name}`,
    undo: () => {
      // Would delete the cloned stream
      console.log('Undo clone pattern');
    },
    redo: () => {
      console.log('Redo clone pattern');
    },
  });

  return newStreamId.id;
}

/**
 * Doubles pattern length by repeating events
 */
export function doubleLength(streamId: EventStreamId): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  // Find pattern length (max event end time)
  let maxEnd = 0;
  for (const event of stream.events) {
    const end = event.start + event.duration;
    if (end > maxEnd) maxEnd = end;
  }

  // Clone events shifted by pattern length
  const duplicatedEvents = stream.events.map((event) => ({
    ...event,
    id: `${event.id}-doubled-${Date.now()}` as EventId,
    start: asTick(event.start + maxEnd),
  }));

  store.addEvents(streamId, duplicatedEvents);

  // Record undo action
  getUndoStack().push({
    type: 'events-add',
    description: 'Double pattern length',
    undo: () => {
      const newEventIds = duplicatedEvents.map((e) => e.id);
      store.removeEvents(streamId, newEventIds);
    },
    redo: () => {
      store.addEvents(streamId, duplicatedEvents);
    },
  });
}

/**
 * Halves pattern length by removing second half
 */
export function halveLength(streamId: EventStreamId): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  // Find pattern length
  let maxEnd = 0;
  for (const event of stream.events) {
    const end = event.start + event.duration;
    if (end > maxEnd) maxEnd = end;
  }

  const midPoint = maxEnd / 2;

  // Find events in second half
  const secondHalfEvents = stream.events.filter((event) => event.start >= midPoint);
  const secondHalfIds = secondHalfEvents.map((e) => e.id);

  if (secondHalfIds.length > 0) {
    store.removeEvents(streamId, secondHalfIds);

    // Record undo action
    getUndoStack().push({
      type: 'events-remove',
      description: 'Halve pattern length',
      undo: () => {
        store.addEvents(streamId, secondHalfEvents);
      },
      redo: () => {
        store.removeEvents(streamId, secondHalfIds);
      },
    });
  }
}

/**
 * Transforms pattern (reverse, invert, rotate)
 */
export function transformPattern(
  streamId: EventStreamId,
  options: TransformOptions
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  const oldEvents = [...stream.events];
  let newEvents = [...stream.events];

  // Find pattern bounds
  let maxEnd = 0;
  for (const event of newEvents) {
    const end = event.start + event.duration;
    if (end > maxEnd) maxEnd = end;
  }

  // Apply transformations
  if (options.reverse) {
    newEvents = newEvents.map((event) => ({
      ...event,
      start: asTick(maxEnd - event.start - event.duration),
    }));
  }

  if (options.invert && newEvents.some((e) => e.kind === EventKinds.NOTE)) {
    // Find pitch center
    const pitches = newEvents
      .filter((e) => e.kind === EventKinds.NOTE)
      .map((e) => {
        const payload = e.payload as { note?: number };
        return payload.note ?? 60;
      });
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    const centerPitch = (minPitch + maxPitch) / 2;

    newEvents = newEvents.map((event) => {
      if (event.kind !== EventKinds.NOTE) return event;
      const payload = event.payload as { note?: number; [key: string]: unknown };
      const pitch = payload.note ?? 60;
      const distance = pitch - centerPitch;
      const invertedPitch = Math.round(centerPitch - distance);
      return {
        ...event,
        payload: {
          ...payload,
          note: Math.max(0, Math.min(127, invertedPitch)),
        },
      };
    });
  }

  if (options.rotate) {
    const rotateAmount = options.rotate;
    newEvents = newEvents.map((event) => ({
      ...event,
      start: asTick((event.start + rotateAmount + maxEnd) % maxEnd),
    }));
  }

  if (options.timeStretch && options.timeStretch !== 1) {
    newEvents = newEvents.map((event) => ({
      ...event,
      start: asTick(Math.round(event.start * options.timeStretch!)),
      duration: asTickDuration(Math.round(event.duration * options.timeStretch!)),
    }));
  }

  // Update stream
  const oldIds = oldEvents.map((e) => e.id);
  store.removeEvents(streamId, oldIds);
  store.addEvents(streamId, newEvents);

  // Record undo action
  getUndoStack().push({
    type: 'events-modify',
    description: 'Transform pattern',
    undo: () => {
      const newIds = newEvents.map((e) => e.id);
      store.removeEvents(streamId, newIds);
      store.addEvents(streamId, oldEvents);
    },
    redo: () => {
      const oldIds = oldEvents.map((e) => e.id);
      store.removeEvents(streamId, oldIds);
      store.addEvents(streamId, newEvents);
    },
  });
}

// ============================================================================
// GROOVE & HUMANIZATION
// ============================================================================

/**
 * Built-in groove templates
 */
export const GROOVE_TEMPLATES: Record<string, GrooveTemplate> = {
  straight: {
    id: 'straight',
    name: 'Straight (Quantized)',
    timingOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    velocityOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    swingAmount: 0,
  },
  swing16: {
    id: 'swing16',
    name: 'Swing 16th',
    timingOffsets: [0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 20],
    velocityOffsets: [0, -5, 0, -5, 0, -5, 0, -5, 0, -5, 0, -5, 0, -5, 0, -5],
    swingAmount: 66,
  },
  shuffle: {
    id: 'shuffle',
    name: 'Shuffle',
    timingOffsets: [0, 30, 0, 30, 0, 30, 0, 30, 0, 30, 0, 30, 0, 30, 0, 30],
    velocityOffsets: [0, -8, 0, -8, 0, -8, 0, -8, 0, -8, 0, -8, 0, -8, 0, -8],
    swingAmount: 75,
  },
  humanize: {
    id: 'humanize',
    name: 'Humanized',
    timingOffsets: [-3, 2, -1, 4, -2, 3, -4, 1, -1, 2, -3, 4, -2, 1, -4, 3],
    velocityOffsets: [-3, 2, -1, 4, -2, 3, -4, 1, -1, 2, -3, 4, -2, 1, -4, 3],
    swingAmount: 0,
  },
};

/**
 * Applies groove template to pattern
 */
export function applyGroove(
  streamId: EventStreamId,
  grooveId: string,
  amount: number = 100
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  const groove = GROOVE_TEMPLATES[grooveId];
  if (!groove) return;

  const oldEvents = [...stream.events];
  const noteEvents = oldEvents.filter((e) => e.kind === EventKinds.NOTE);

  // Find smallest note interval (quantization grid)
  const intervals = new Set<number>();
  for (let i = 0; i < noteEvents.length; i++) {
    for (let j = i + 1; j < noteEvents.length; j++) {
      const eventI = noteEvents[i];
      const eventJ = noteEvents[j];
      if (eventI && eventJ) {
        const diff = Math.abs(eventI.start - eventJ.start);
        if (diff > 0) intervals.add(diff);
      }
    }
  }

  // Apply groove
  const groovedEvents = noteEvents.map((event, index) => {
    const stepIndex = index % groove.timingOffsets.length;
    const timingOffset = groove.timingOffsets[stepIndex];
    const velocityOffset = groove.velocityOffsets[stepIndex];
    
    if (timingOffset === undefined) return event;

    const adjustedTiming = (timingOffset * amount) / 100;
    const adjustedVelocity = (velocityOffset ?? 0) * amount / 100;

    const eventPayload = event.payload as { velocity?: number };
    const newVelocity = Math.max(
      1,
      Math.min(127, (eventPayload.velocity ?? 80) + adjustedVelocity)
    );

    return {
      ...event,
      start: asTick(event.start + Math.round(adjustedTiming)),
      payload: {
        ...(event.payload as object),
        velocity: newVelocity,
      },
    };
  });

  // Update stream
  const noteIds = noteEvents.map((e) => e.id);
  store.removeEvents(streamId, noteIds);
  store.addEvents(streamId, groovedEvents);

  // Record undo action
  getUndoStack().push({
    type: 'events-modify' as const,
    description: `Apply ${groove.name} groove`,
    undo: () => {
      const groovedIds = groovedEvents.map((e) => e.id);
      store.removeEvents(streamId, groovedIds);
      store.addEvents(streamId, noteEvents);
    },
    redo: () => {
      const noteIds = noteEvents.map((e) => e.id);
      store.removeEvents(streamId, noteIds);
      store.addEvents(streamId, groovedEvents);
    },
  });
}

/**
 * Humanizes pattern by adding random timing and velocity variations
 */
export function humanizePattern(
  streamId: EventStreamId,
  timingAmount: number = 5,
  velocityAmount: number = 5
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  const oldEvents = [...stream.events];
  const noteEvents = oldEvents.filter((e) => e.kind === EventKinds.NOTE);

  // Apply random variations
  const humanizedEvents = noteEvents.map((event) => {
    const timingVariation = (Math.random() * 2 - 1) * timingAmount;
    const velocityVariation = Math.floor((Math.random() * 2 - 1) * velocityAmount);

    const eventPayload = event.payload as { velocity?: number };
    const newVelocity = Math.max(
      1,
      Math.min(127, (eventPayload.velocity ?? 80) + velocityVariation)
    );

    return {
      ...event,
      start: asTick(event.start + Math.round(timingVariation)),
      payload: {
        ...(event.payload as object),
        velocity: newVelocity,
      },
    };
  });

  // Update stream
  const noteIds = noteEvents.map((e) => e.id);
  store.removeEvents(streamId, noteIds);
  store.addEvents(streamId, humanizedEvents);

  // Record undo action
  getUndoStack().push({
    type: 'events-modify' as const,
    description: 'Humanize pattern',
    undo: () => {
      const humanizedIds = humanizedEvents.map((e) => e.id);
      store.removeEvents(streamId, humanizedIds);
      store.addEvents(streamId, noteEvents);
    },
    redo: () => {
      const noteIds = noteEvents.map((e) => e.id);
      store.removeEvents(streamId, noteIds);
      store.addEvents(streamId, humanizedEvents);
    },
  });
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

/**
 * Creates tracker-specific context menu items
 */
export function createTrackerContextMenu(
  streamId: EventStreamId,
  selectedEventIds: string[]
): PatternContextMenuItem[] {
  const hasSelection = selectedEventIds.length > 0;

  return [
    {
      id: 'clone-pattern',
      label: 'Clone Pattern',
      icon: '📋',
      shortcut: 'Ctrl+D',
      enabled: true,
      action: () => clonePattern(streamId),
    },
    {
      id: 'pattern-length',
      label: 'Pattern Length',
      icon: '↔️',
      enabled: true,
      action: () => {}, // Submenu parent - no action needed
      submenu: [
        {
          id: 'double-length',
          label: 'Double Length',
          enabled: true,
          action: () => doubleLength(streamId),
        },
        {
          id: 'halve-length',
          label: 'Halve Length',
          enabled: true,
          action: () => halveLength(streamId),
        },
      ],
    },
    {
      id: 'transform',
      label: 'Transform',
      icon: '🔄',
      enabled: true,
      action: () => {}, // Submenu parent - no action needed
      submenu: [
        {
          id: 'reverse',
          label: 'Reverse',
          enabled: true,
          action: () => transformPattern(streamId, { reverse: true }),
        },
        {
          id: 'invert',
          label: 'Invert',
          enabled: true,
          action: () => transformPattern(streamId, { invert: true }),
        },
        {
          id: 'rotate',
          label: 'Rotate...',
          enabled: true,
          action: () => {
            // Would open rotate dialog
            console.log('Open rotate dialog');
          },
        },
      ],
    },
    {
      id: 'groove',
      label: 'Apply Groove',
      icon: '🎵',
      enabled: hasSelection || true,
      action: () => {}, // Submenu parent - no action needed
      submenu: Object.keys(GROOVE_TEMPLATES).map((grooveId) => {
        const template = GROOVE_TEMPLATES[grooveId];
        if (!template) return null;
        return {
          id: `groove-${grooveId}`,
          label: template.name,
          enabled: true,
          action: () => applyGroove(streamId, grooveId),
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null),
    },
    {
      id: 'humanize',
      label: 'Humanize',
      icon: '👤',
      shortcut: 'Ctrl+H',
      enabled: hasSelection || true,
      action: () => humanizePattern(streamId),
    },
  ];
}
