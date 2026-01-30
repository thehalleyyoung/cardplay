/**
 * @fileoverview Event Projections
 * 
 * Change 333: Explicit projection layers (tracker rows, piano-roll notes, notation measures)
 * as derived views over SSOT streams.
 * 
 * Projections transform the canonical event store into view-specific formats.
 * - Tracker: Events → pattern rows with step sequencing
 * - Piano Roll: Events → note rectangles with time/pitch coordinates
 * - Notation: Events → measures with staff notation symbols
 * 
 * Change 334: Projections have invalidation semantics tied to SSOT updates.
 * 
 * @module @cardplay/ui/projections/event-projections
 */

import type { Event, EventStreamId } from '../../types/event';
import type { Tick } from '../../types/primitives';
import { getSharedEventStore } from '../../state/ssot';

// ============================================================================
// TRACKER PROJECTION
// ============================================================================

/**
 * Tracker row representing a step in a pattern.
 */
export interface TrackerRow {
  /** Step number (0-based) */
  readonly step: number;
  
  /** Tick position */
  readonly tick: Tick;
  
  /** Events at this step */
  readonly events: readonly Event<unknown>[];
  
  /** Whether step is active/highlighted */
  readonly active: boolean;
}

/**
 * Tracker pattern projection.
 */
export interface TrackerProjection {
  /** Pattern length in steps */
  readonly length: number;
  
  /** Ticks per step */
  readonly ticksPerStep: number;
  
  /** All rows */
  readonly rows: readonly TrackerRow[];
  
  /** Current playhead position (step) */
  readonly playheadStep?: number;
  
  /** Projection version (for invalidation) */
  readonly version: number;
}

/**
 * Change 333: Project events from SSOT onto tracker grid.
 * 
 * @param streamId - Event stream to project
 * @param startTick - Start position
 * @param length - Pattern length in steps
 * @param ticksPerStep - Grid resolution (e.g., 240 = 16th notes at PPQ 960)
 * @param playheadTick - Current playhead position
 * @returns Tracker projection
 */
export function projectTrackerRows(
  streamId: EventStreamId,
  startTick: Tick,
  length: number,
  ticksPerStep: number,
  playheadTick?: Tick
): TrackerProjection {
  const store = getSharedEventStore();
  const endTick = (startTick + length * ticksPerStep) as Tick;
  
  // Get events in range from SSOT
  const events = store.getEventsInRange(streamId, startTick, endTick);
  
  // Build rows
  const rows: TrackerRow[] = [];
  const playheadStep = playheadTick !== undefined
    ? Math.floor((playheadTick - startTick) / ticksPerStep)
    : undefined;
  
  for (let step = 0; step < length; step++) {
    const stepTick = (startTick + step * ticksPerStep) as Tick;
    const nextStepTick = (stepTick + ticksPerStep) as Tick;
    
    // Find events that start in this step
    const stepEvents = events.filter(e => 
      e.start >= stepTick && e.start < nextStepTick
    );
    
    rows.push({
      step,
      tick: stepTick,
      events: stepEvents,
      active: playheadStep === step,
    });
  }
  
  return {
    length,
    ticksPerStep,
    rows,
    playheadStep,
    version: store.getVersion(),
  };
}

// ============================================================================
// PIANO ROLL PROJECTION
// ============================================================================

/**
 * Piano roll note rectangle.
 */
export interface PianoRollNote {
  /** Event ID */
  readonly id: string;
  
  /** MIDI note number */
  readonly note: number;
  
  /** Start time (ticks) */
  readonly startTick: Tick;
  
  /** Duration (ticks) */
  readonly duration: number;
  
  /** Velocity (0-127) */
  readonly velocity: number;
  
  /** Whether note is selected */
  readonly selected: boolean;
  
  /** Original event reference */
  readonly event: Event<unknown>;
}

/**
 * Piano roll projection.
 */
export interface PianoRollProjection {
  /** All visible notes */
  readonly notes: readonly PianoRollNote[];
  
  /** Time range */
  readonly startTick: Tick;
  readonly endTick: Tick;
  
  /** Pitch range */
  readonly minNote: number;
  readonly maxNote: number;
  
  /** Selected note IDs */
  readonly selectedIds: ReadonlySet<string>;
  
  /** Projection version (for invalidation) */
  readonly version: number;
}

/**
 * Change 333: Project events from SSOT onto piano roll grid.
 * 
 * @param streamId - Event stream to project
 * @param startTick - Viewport start
 * @param endTick - Viewport end
 * @param minNote - Minimum MIDI note to show
 * @param maxNote - Maximum MIDI note to show
 * @param selectedIds - Selected note IDs
 * @returns Piano roll projection
 */
export function projectPianoRollNotes(
  streamId: EventStreamId,
  startTick: Tick,
  endTick: Tick,
  minNote: number = 0,
  maxNote: number = 127,
  selectedIds: Set<string> = new Set()
): PianoRollProjection {
  const store = getSharedEventStore();
  
  // Get events in range from SSOT
  const events = store.getEventsInRange(streamId, startTick, endTick);
  
  // Filter to note events and map to piano roll notes
  const notes: PianoRollNote[] = [];
  
  for (const event of events) {
    // Check if event has note information (note_on, note_off, or note payload)
    const payload = event.payload as { note?: number; velocity?: number };
    
    if (payload?.note !== undefined) {
      const note = payload.note;
      
      // Filter by pitch range
      if (note < minNote || note > maxNote) continue;
      
      notes.push({
        id: event.id,
        note,
        startTick: event.start,
        duration: event.duration,
        velocity: payload.velocity ?? 64,
        selected: selectedIds.has(event.id),
        event,
      });
    }
  }
  
  return {
    notes,
    startTick,
    endTick,
    minNote,
    maxNote,
    selectedIds,
    version: store.getVersion(),
  };
}

// ============================================================================
// NOTATION PROJECTION
// ============================================================================

/**
 * Notation measure.
 */
export interface NotationMeasure {
  /** Measure number (1-based) */
  readonly number: number;
  
  /** Start tick */
  readonly startTick: Tick;
  
  /** Duration in ticks */
  readonly duration: number;
  
  /** Time signature numerator */
  readonly timeSigNumerator: number;
  
  /** Time signature denominator */
  readonly timeSigDenominator: number;
  
  /** Notes in this measure */
  readonly notes: readonly NotationNote[];
}

/**
 * Notation note symbol.
 */
export interface NotationNote {
  /** Event ID */
  readonly id: string;
  
  /** MIDI note number */
  readonly note: number;
  
  /** Position within measure (beats) */
  readonly beat: number;
  
  /** Note duration (quarters) */
  readonly quarters: number;
  
  /** Original event */
  readonly event: Event<unknown>;
}

/**
 * Notation projection.
 */
export interface NotationProjection {
  /** All measures */
  readonly measures: readonly NotationMeasure[];
  
  /** Projection version (for invalidation) */
  readonly version: number;
}

/**
 * Change 333: Project events from SSOT onto notation staff.
 * 
 * @param streamId - Event stream to project
 * @param startTick - Start position
 * @param endTick - End position
 * @param ppq - Pulses per quarter note (for timing calculations)
 * @param timeSigNumerator - Time signature numerator (default: 4)
 * @param timeSigDenominator - Time signature denominator (default: 4)
 * @returns Notation projection
 */
export function projectNotationMeasures(
  streamId: EventStreamId,
  startTick: Tick,
  endTick: Tick,
  ppq: number = 960,
  timeSigNumerator: number = 4,
  timeSigDenominator: number = 4
): NotationProjection {
  const store = getSharedEventStore();
  
  // Calculate measure duration in ticks
  const ticksPerQuarter = ppq;
  const ticksPerMeasure = ticksPerQuarter * timeSigNumerator * (4 / timeSigDenominator);
  
  // Get events in range from SSOT
  const events = store.getEventsInRange(streamId, startTick, endTick);
  
  // Build measures
  const measures: NotationMeasure[] = [];
  const measureCount = Math.ceil((endTick - startTick) / ticksPerMeasure);
  
  for (let i = 0; i < measureCount; i++) {
    const measureStart = (startTick + i * ticksPerMeasure) as Tick;
    const measureEnd = (measureStart + ticksPerMeasure) as Tick;
    
    // Find notes in this measure
    const measureEvents = events.filter(e => 
      e.start >= measureStart && e.start < measureEnd
    );
    
    const notes: NotationNote[] = [];
    
    for (const event of measureEvents) {
      const payload = event.payload as { note?: number };
      
      if (payload?.note !== undefined) {
        const beatOffset = (event.start - measureStart) / ticksPerQuarter;
        const quarters = event.duration / ticksPerQuarter;
        
        notes.push({
          id: event.id,
          note: payload.note,
          beat: beatOffset,
          quarters,
          event,
        });
      }
    }
    
    measures.push({
      number: i + 1,
      startTick: measureStart,
      duration: ticksPerMeasure,
      timeSigNumerator,
      timeSigDenominator,
      notes,
    });
  }
  
  return {
    measures,
    version: store.getVersion(),
  };
}

// ============================================================================
// INVALIDATION (Change 334)
// ============================================================================

/**
 * Check if a projection is still valid (SSOT hasn't changed).
 * 
 * @param projectionVersion - Version from the projection
 * @returns True if projection is still valid
 */
export function isProjectionValid(projectionVersion: number): boolean {
  const store = getSharedEventStore();
  return store.getVersion() === projectionVersion;
}

/**
 * Projection invalidation callback.
 */
export type ProjectionInvalidationCallback = () => void;

/**
 * Subscribe to projection invalidation.
 * Callback is called whenever SSOT updates and projection should be recomputed.
 * 
 * @param callback - Invalidation callback
 * @returns Unsubscribe function
 */
export function subscribeToProjectionInvalidation(
  callback: ProjectionInvalidationCallback
): () => void {
  const store = getSharedEventStore();
  
  const subscriptionId = store.subscribe(() => {
    callback();
  });
  
  return () => {
    store.unsubscribe(subscriptionId);
  };
}
