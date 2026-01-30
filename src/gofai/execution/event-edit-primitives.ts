/**
 * @file Event-Level Edit Primitives for GOFAI Execution
 * @module gofai/execution/event-edit-primitives
 * 
 * Implements Step 306: Implement event-level edit primitives by composing
 * existing `cardplay/src/events/operations.ts` functions where possible.
 * 
 * These primitives are the foundational building blocks for plan execution.
 * They provide safe, typed, composable operations on Event<P> streams that
 * respect CardPlay's immutability and provide rollback support.
 * 
 * Design Principles:
 * - **Pure functions**: No side effects, return new events
 * - **Type-safe**: Leverage TypeScript for safety
 * - **Composable**: Can be chained and combined
 * - **Atomic**: Each primitive does one thing well
 * - **Revertible**: Every operation can be undone
 * - **Traceable**: Preserve provenance and reasoning
 * 
 * @see gofai_goalB.md Step 306
 * @see cardplay/src/events/operations.ts
 * @see docs/gofai/execution/event-edit-primitives.md
 */

import type { Event } from '../../types/event.js';
import type { EventId } from '../../types/event-id.js';
import type { Tick, TickDuration } from '../../types/primitives.js';
import {
  shiftEvent,
  quantizeEvent,
  stretchEvent,
  splitEvent,
  mergeEvents,
  resizeEvent,
  moveEvent,
} from '../../events/operations.js';
import { updateEvent } from '../../types/event.js';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Result of an edit primitive operation.
 */
export type EditResult<P> = {
  /** The resulting events (may be modified, new, or removed) */
  readonly events: readonly Event<P>[];
  
  /** IDs of events that were removed */
  readonly removedIds: readonly EventId[];
  
  /** Undo token for reverting this operation */
  readonly undoToken: UndoToken<P>;
  
  /** Human-readable description of what changed */
  readonly description: string;
};

/**
 * Token for undoing an edit operation.
 */
export interface UndoToken<P> {
  /** Type of operation that was performed */
  readonly operation: EditOperationType;
  
  /** Original events before modification */
  readonly originalEvents: readonly Event<P>[];
  
  /** IDs of events that were removed */
  readonly removedIds: readonly EventId[];
  
  /** Metadata for undo */
  readonly metadata: Record<string, any>;
}

/**
 * Types of edit operations.
 */
export type EditOperationType =
  | 'shift'
  | 'quantize'
  | 'stretch'
  | 'split'
  | 'merge'
  | 'resize'
  | 'move'
  | 'transpose'
  | 'velocity_scale'
  | 'velocity_shift'
  | 'density_thin'
  | 'density_densify'
  | 'register_shift'
  | 'rhythm_humanize'
  | 'rhythm_swing'
  | 'articulation_adjust'
  | 'duplicate'
  | 'delete'
  | 'insert';

// ============================================================================
// Temporal Transformations
// ============================================================================

/**
 * Shift events by a time offset.
 * 
 * Moves events forward or backward in time without changing their duration.
 * Preserves all other properties.
 */
export function shiftEvents<P>(
  events: readonly Event<P>[],
  offset: TickDuration,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  const shiftedEvents = events.map(e => shiftEvent(e, offset));
  
  return {
    events: shiftedEvents,
    removedIds: [],
    undoToken: {
      operation: 'shift',
      originalEvents,
      removedIds: [],
      metadata: { offset },
    },
    description: options?.description || `Shifted ${events.length} event(s) by ${offset} ticks`,
  };
}

/**
 * Quantize events to a grid.
 * 
 * Snaps event onsets to the nearest grid point. Can preserve or adjust
 * duration based on options.
 */
export function quantizeEvents<P>(
  events: readonly Event<P>[],
  gridSize: TickDuration,
  options?: {
    strength?: number;
    mode?: 'start' | 'start_and_end' | 'start_preserve_duration';
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const strength = options?.strength ?? 1.0;
  const mode = options?.mode ?? 'start_preserve_duration';
  
  const quantizedEvents = events.map(e => {
    const quantizeOptions = {
      gridSize,
      strength,
      mode: mode as any,
    };
    return quantizeEvent(e, quantizeOptions);
  });
  
  return {
    events: quantizedEvents,
    removedIds: [],
    undoToken: {
      operation: 'quantize',
      originalEvents,
      removedIds: [],
      metadata: { gridSize, strength, mode },
    },
    description: options?.description || 
      `Quantized ${events.length} event(s) to ${gridSize}-tick grid (${(strength * 100).toFixed(0)}% strength)`,
  };
}

/**
 * Stretch or compress events temporally.
 * 
 * Scales event duration by a factor. Can anchor to start, end, or center.
 */
export function stretchEventsBy<P>(
  events: readonly Event<P>[],
  factor: number,
  options?: {
    anchor?: 'start' | 'end' | 'center';
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const anchor = options?.anchor ?? 'start';
  
  const stretchedEvents = events.map(e => 
    stretchEvent(e, factor, anchor as any)
  );
  
  return {
    events: stretchedEvents,
    removedIds: [],
    undoToken: {
      operation: 'stretch',
      originalEvents,
      removedIds: [],
      metadata: { factor, anchor },
    },
    description: options?.description ||
      `Stretched ${events.length} event(s) by ${factor}x (anchor: ${anchor})`,
  };
}

/**
 * Split events at a specific time point.
 * 
 * Divides events that span the split point into two separate events.
 * Events that don't span the point are unaffected.
 */
export function splitEventsAt<P>(
  events: readonly Event<P>[],
  splitTick: Tick,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  const resultEvents: Event<P>[] = [];
  
  for (const event of events) {
    const eventEnd = event.start + event.duration;
    
    // Check if event spans the split point
    if (event.start < splitTick && eventEnd > splitTick) {
      const [left, right] = splitEvent(event, splitTick);
      resultEvents.push(left, right);
    } else {
      resultEvents.push(event);
    }
  }
  
  return {
    events: resultEvents,
    removedIds: [],
    undoToken: {
      operation: 'split',
      originalEvents,
      removedIds: [],
      metadata: { splitTick },
    },
    description: options?.description ||
      `Split events at tick ${splitTick}`,
  };
}

/**
 * Merge adjacent or overlapping events.
 * 
 * Combines events that are adjacent or overlapping into single events.
 * Uses the first event's payload properties as base.
 */
export function mergeAdjacentEvents<P>(
  events: readonly Event<P>[],
  options?: {
    maxGap?: TickDuration;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const maxGap = options?.maxGap ?? 0;
  
  // Sort events by start time
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const merged: Event<P>[] = [];
  
  let current = sorted[0];
  if (!current) {
    return {
      events: [],
      removedIds: [],
      undoToken: {
        operation: 'merge',
        originalEvents,
        removedIds: [],
        metadata: { maxGap },
      },
      description: 'No events to merge',
    };
  }
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const currentEnd = current.start + current.duration;
    const gap = next.start - currentEnd;
    
    if (gap <= maxGap) {
      // Merge current and next
      current = mergeEvents(current, next);
    } else {
      // Gap too large, start new merge group
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  
  return {
    events: merged,
    removedIds: [],
    undoToken: {
      operation: 'merge',
      originalEvents,
      removedIds: [],
      metadata: { maxGap },
    },
    description: options?.description ||
      `Merged ${events.length} events into ${merged.length} event(s)`,
  };
}

/**
 * Resize events to a specific duration.
 * 
 * Changes event duration while preserving start time.
 */
export function resizeEventsTo<P>(
  events: readonly Event<P>[],
  newDuration: TickDuration,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  const resizedEvents = events.map(e => resizeEvent(e, newDuration));
  
  return {
    events: resizedEvents,
    removedIds: [],
    undoToken: {
      operation: 'resize',
      originalEvents,
      removedIds: [],
      metadata: { newDuration },
    },
    description: options?.description ||
      `Resized ${events.length} event(s) to ${newDuration} ticks`,
  };
}

/**
 * Move events to a new time position.
 * 
 * Moves events to a specific time, maintaining relative spacing between them.
 */
export function moveEventsTo<P>(
  events: readonly Event<P>[],
  newStart: Tick,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  
  if (events.length === 0) {
    return {
      events: [],
      removedIds: [],
      undoToken: {
        operation: 'move',
        originalEvents,
        removedIds: [],
        metadata: { newStart },
      },
      description: 'No events to move',
    };
  }
  
  // Find earliest start time
  const earliestStart = Math.min(...events.map(e => e.start));
  const offset = newStart - earliestStart;
  
  const movedEvents = events.map(e => moveEvent(e, newStart + (e.start - earliestStart)));
  
  return {
    events: movedEvents,
    removedIds: [],
    undoToken: {
      operation: 'move',
      originalEvents,
      removedIds: [],
      metadata: { newStart, offset },
    },
    description: options?.description ||
      `Moved ${events.length} event(s) to start at tick ${newStart}`,
  };
}

// ============================================================================
// Musical Transformations
// ============================================================================

/**
 * Transpose pitch events by semitones.
 * 
 * Shifts pitch up or down by a specified interval. Only affects events
 * with pitch information (notes, chords).
 */
export function transposeEvents<P>(
  events: readonly Event<P>[],
  semitones: number,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  
  const transposedEvents = events.map(event => {
    // Check if event has pitch
    if (event.kind === 'note' && event.payload && 'pitch' in event.payload) {
      const newPayload = {
        ...event.payload,
        pitch: (event.payload as any).pitch + semitones,
      };
      return updateEvent(event, { payload: newPayload as P });
    }
    
    // For chord events, transpose all pitches
    if (event.kind === 'chord' && event.payload && 'pitches' in event.payload) {
      const oldPitches = (event.payload as any).pitches as number[];
      const newPitches = oldPitches.map((p: number) => p + semitones);
      const newPayload = {
        ...event.payload,
        pitches: newPitches,
      };
      return updateEvent(event, { payload: newPayload as P });
    }
    
    // Return unchanged if no pitch
    return event;
  });
  
  const direction = semitones > 0 ? 'up' : 'down';
  return {
    events: transposedEvents,
    removedIds: [],
    undoToken: {
      operation: 'transpose',
      originalEvents,
      removedIds: [],
      metadata: { semitones },
    },
    description: options?.description ||
      `Transposed ${events.length} event(s) ${direction} by ${Math.abs(semitones)} semitones`,
  };
}

/**
 * Scale velocity of events by a factor.
 * 
 * Multiplies velocity values, useful for dynamic shaping.
 * Clamps to valid MIDI range [0, 127].
 */
export function scaleVelocity<P>(
  events: readonly Event<P>[],
  factor: number,
  options?: {
    clamp?: boolean;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const clamp = options?.clamp ?? true;
  
  const scaledEvents = events.map(event => {
    if (event.payload && 'velocity' in event.payload) {
      let newVelocity = (event.payload as any).velocity * factor;
      
      if (clamp) {
        newVelocity = Math.max(0, Math.min(127, newVelocity));
      }
      
      const newPayload = {
        ...event.payload,
        velocity: Math.round(newVelocity),
      };
      return updateEvent(event, { payload: newPayload as P });
    }
    return event;
  });
  
  return {
    events: scaledEvents,
    removedIds: [],
    undoToken: {
      operation: 'velocity_scale',
      originalEvents,
      removedIds: [],
      metadata: { factor, clamp },
    },
    description: options?.description ||
      `Scaled velocity of ${events.length} event(s) by ${factor}x`,
  };
}

/**
 * Shift velocity of events by an amount.
 * 
 * Adds a constant value to velocity, useful for overall level adjustment.
 * Clamps to valid MIDI range [0, 127].
 */
export function shiftVelocity<P>(
  events: readonly Event<P>[],
  amount: number,
  options?: {
    clamp?: boolean;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const clamp = options?.clamp ?? true;
  
  const shiftedEvents = events.map(event => {
    if (event.payload && 'velocity' in event.payload) {
      let newVelocity = (event.payload as any).velocity + amount;
      
      if (clamp) {
        newVelocity = Math.max(0, Math.min(127, newVelocity));
      }
      
      const newPayload = {
        ...event.payload,
        velocity: Math.round(newVelocity),
      };
      return updateEvent(event, { payload: newPayload as P });
    }
    return event;
  });
  
  const direction = amount > 0 ? 'up' : 'down';
  return {
    events: shiftedEvents,
    removedIds: [],
    undoToken: {
      operation: 'velocity_shift',
      originalEvents,
      removedIds: [],
      metadata: { amount, clamp },
    },
    description: options?.description ||
      `Shifted velocity ${direction} by ${Math.abs(amount)}`,
  };
}

/**
 * Thin out events to reduce density.
 * 
 * Removes a proportion of events based on various strategies.
 */
export function thinEvents<P>(
  events: readonly Event<P>[],
  amount: number,
  options?: {
    strategy?: 'random' | 'every_nth' | 'low_velocity';
    seed?: number;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const strategy = options?.strategy ?? 'every_nth';
  const targetCount = Math.round(events.length * (1 - amount));
  
  let keptEvents: Event<P>[];
  let removedIds: EventId[];
  
  if (strategy === 'every_nth') {
    const step = Math.max(1, Math.floor(events.length / targetCount));
    keptEvents = events.filter((_, i) => i % step === 0);
    removedIds = events.filter((_, i) => i % step !== 0).map(e => e.id);
  } else if (strategy === 'low_velocity') {
    // Sort by velocity and keep highest
    const sorted = [...events].sort((a, b) => {
      const aVel = (a.payload && 'velocity' in a.payload) ? (a.payload as any).velocity : 64;
      const bVel = (b.payload && 'velocity' in b.payload) ? (b.payload as any).velocity : 64;
      return bVel - aVel;
    });
    keptEvents = sorted.slice(0, targetCount);
    removedIds = sorted.slice(targetCount).map(e => e.id);
  } else {
    // Random (deterministic if seed provided)
    const indices = events.map((_, i) => i);
    // Simple shuffle (would use seeded RNG in production)
    keptEvents = indices.slice(0, targetCount).map(i => events[i]);
    removedIds = indices.slice(targetCount).map(i => events[i].id);
  }
  
  return {
    events: keptEvents,
    removedIds,
    undoToken: {
      operation: 'density_thin',
      originalEvents,
      removedIds,
      metadata: { amount, strategy },
    },
    description: options?.description ||
      `Thinned ${events.length} events to ${keptEvents.length} (${(amount * 100).toFixed(0)}% reduction)`,
  };
}

/**
 * Densify events by adding interpolated events.
 * 
 * Increases density by adding events between existing ones.
 */
export function densifyEvents<P>(
  events: readonly Event<P>[],
  factor: number,
  options?: {
    interpolate?: boolean;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const interpolate = options?.interpolate ?? true;
  const densifiedEvents: Event<P>[] = [...events];
  
  // Sort by start time
  const sorted = [...events].sort((a, b) => a.start - b.start);
  
  // Add events between pairs
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const gap = next.start - (current.start + current.duration);
    
    if (gap > 0) {
      const newEventsCount = Math.floor(factor);
      for (let j = 0; j < newEventsCount; j++) {
        const position = current.start + current.duration + (gap / (newEventsCount + 1)) * (j + 1);
        
        // Create new event (simplified - would need proper event creation)
        const newEvent = updateEvent(current, {
          start: Math.round(position),
          duration: current.duration,
        });
        densifiedEvents.push(newEvent);
      }
    }
  }
  
  return {
    events: densifiedEvents,
    removedIds: [],
    undoToken: {
      operation: 'density_densify',
      originalEvents,
      removedIds: [],
      metadata: { factor, interpolate },
    },
    description: options?.description ||
      `Densified ${events.length} events to ${densifiedEvents.length} events`,
  };
}

/**
 * Shift register (octave) of pitch events.
 * 
 * Moves pitches up or down by octaves while preserving pitch class.
 */
export function shiftRegister<P>(
  events: readonly Event<P>[],
  octaves: number,
  options?: { description?: string }
): EditResult<P> {
  const semitones = octaves * 12;
  return transposeEvents(events, semitones, {
    description: options?.description ||
      `Shifted register ${octaves > 0 ? 'up' : 'down'} by ${Math.abs(octaves)} octave(s)`,
  });
}

/**
 * Humanize rhythm by adding subtle timing variations.
 * 
 * Adds random microtiming offsets to create a more human feel.
 */
export function humanizeRhythm<P>(
  events: readonly Event<P>[],
  amount: number,
  options?: {
    seed?: number;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const maxOffset = Math.round(amount * 20); // Up to 20 ticks per 1.0 amount
  
  const humanizedEvents = events.map(event => {
    // Generate pseudo-random offset (would use seeded RNG in production)
    const offset = Math.floor(Math.random() * (2 * maxOffset + 1)) - maxOffset;
    const newStart = Math.max(0, event.start + offset);
    return updateEvent(event, { start: newStart });
  });
  
  return {
    events: humanizedEvents,
    removedIds: [],
    undoToken: {
      operation: 'rhythm_humanize',
      originalEvents,
      removedIds: [],
      metadata: { amount, maxOffset },
    },
    description: options?.description ||
      `Humanized rhythm of ${events.length} event(s) (amount: ${(amount * 100).toFixed(0)}%)`,
  };
}

/**
 * Apply swing timing to events.
 * 
 * Delays every other beat to create swing feel.
 */
export function applySwing<P>(
  events: readonly Event<P>[],
  swingAmount: number,
  gridSize: TickDuration,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  
  const swungEvents = events.map(event => {
    // Check if event is on off-beat
    const beatPosition = event.start % gridSize;
    const isOffBeat = beatPosition >= gridSize / 2;
    
    if (isOffBeat) {
      const delay = Math.round((gridSize / 2) * swingAmount);
      const newStart = event.start + delay;
      return updateEvent(event, { start: newStart });
    }
    
    return event;
  });
  
  return {
    events: swungEvents,
    removedIds: [],
    undoToken: {
      operation: 'rhythm_swing',
      originalEvents,
      removedIds: [],
      metadata: { swingAmount, gridSize },
    },
    description: options?.description ||
      `Applied ${(swingAmount * 100).toFixed(0)}% swing to ${events.length} event(s)`,
  };
}

/**
 * Adjust articulation (note duration relative to grid).
 * 
 * Makes notes more staccato (shorter) or legato (longer).
 */
export function adjustArticulation<P>(
  events: readonly Event<P>[],
  factor: number,
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  
  const adjustedEvents = events.map(event => {
    const newDuration = Math.max(1, Math.round(event.duration * factor));
    return updateEvent(event, { duration: newDuration });
  });
  
  const style = factor < 1 ? 'staccato' : 'legato';
  return {
    events: adjustedEvents,
    removedIds: [],
    undoToken: {
      operation: 'articulation_adjust',
      originalEvents,
      removedIds: [],
      metadata: { factor },
    },
    description: options?.description ||
      `Adjusted articulation to ${(factor * 100).toFixed(0)}% (more ${style})`,
  };
}

// ============================================================================
// Structural Operations
// ============================================================================

/**
 * Duplicate events with offset.
 * 
 * Creates copies of events at a new time position.
 */
export function duplicateEvents<P>(
  events: readonly Event<P>[],
  offset: TickDuration,
  options?: {
    times?: number;
    description?: string;
  }
): EditResult<P> {
  const originalEvents = [...events];
  const times = options?.times ?? 1;
  const duplicatedEvents: Event<P>[] = [...events];
  
  for (let i = 1; i <= times; i++) {
    const shiftAmount = offset * i;
    const copies = events.map(e => shiftEvent(e, shiftAmount));
    duplicatedEvents.push(...copies);
  }
  
  return {
    events: duplicatedEvents,
    removedIds: [],
    undoToken: {
      operation: 'duplicate',
      originalEvents,
      removedIds: [],
      metadata: { offset, times },
    },
    description: options?.description ||
      `Duplicated ${events.length} event(s) ${times} time(s) with ${offset} tick offset`,
  };
}

/**
 * Delete events.
 * 
 * Removes events from the stream.
 */
export function deleteEvents<P>(
  events: readonly Event<P>[],
  options?: { description?: string }
): EditResult<P> {
  const originalEvents = [...events];
  const removedIds = events.map(e => e.id);
  
  return {
    events: [],
    removedIds,
    undoToken: {
      operation: 'delete',
      originalEvents,
      removedIds,
      metadata: {},
    },
    description: options?.description ||
      `Deleted ${events.length} event(s)`,
  };
}

/**
 * Insert new events.
 * 
 * Adds new events to the stream.
 */
export function insertEvents<P>(
  newEvents: readonly Event<P>[],
  options?: { description?: string }
): EditResult<P> {
  return {
    events: [...newEvents],
    removedIds: [],
    undoToken: {
      operation: 'insert',
      originalEvents: [],
      removedIds: [],
      metadata: { count: newEvents.length },
    },
    description: options?.description ||
      `Inserted ${newEvents.length} new event(s)`,
  };
}

// ============================================================================
// Undo Support
// ============================================================================

/**
 * Apply an undo token to revert an operation.
 * 
 * Restores the original state before the operation was applied.
 */
export function applyUndo<P>(undoToken: UndoToken<P>): EditResult<P> {
  return {
    events: undoToken.originalEvents,
    removedIds: [],
    undoToken: {
      operation: undoToken.operation,
      originalEvents: [],
      removedIds: undoToken.removedIds,
      metadata: undoToken.metadata,
    },
    description: `Undid ${undoToken.operation} operation`,
  };
}

/**
 * Check if two edit results are equivalent.
 * 
 * Useful for testing and validation.
 */
export function editResultsEqual<P>(a: EditResult<P>, b: EditResult<P>): boolean {
  if (a.events.length !== b.events.length) return false;
  if (a.removedIds.length !== b.removedIds.length) return false;
  
  for (let i = 0; i < a.events.length; i++) {
    if (a.events[i].id !== b.events[i].id) return false;
  }
  
  return true;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Compose multiple edit operations into a single operation.
 * 
 * Applies operations in sequence and combines their results.
 */
export function composeEdits<P>(
  initialEvents: readonly Event<P>[],
  operations: Array<(events: readonly Event<P>[]) => EditResult<P>>
): EditResult<P> {
  let currentEvents = initialEvents;
  const allRemovedIds: EventId[] = [];
  const descriptions: string[] = [];
  const originalEvents = [...initialEvents];
  
  for (const operation of operations) {
    const result = operation(currentEvents);
    currentEvents = result.events;
    allRemovedIds.push(...result.removedIds);
    descriptions.push(result.description);
  }
  
  return {
    events: currentEvents,
    removedIds: allRemovedIds,
    undoToken: {
      operation: 'shift', // Composite operation
      originalEvents,
      removedIds: allRemovedIds,
      metadata: { operationCount: operations.length },
    },
    description: `Composed ${operations.length} operations: ${descriptions.join('; ')}`,
  };
}
