/**
 * @fileoverview Tempo SSOT - Query and manage tempo from the SharedEventStore.
 *
 * Change 307-308: Tempo is stored as EventKind='tempo' events in the SSOT.
 * All code that needs the current tempo should use these helpers instead of
 * hardcoding BPM values.
 *
 * @module @cardplay/state/tempo
 */

import { EventKinds } from '../types/event-kind';
import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { asTick } from '../types/primitives';
import { getSharedEventStore, type EventStreamId } from './event-store';

// ============================================================================
// TEMPO EVENT PAYLOAD
// ============================================================================

/**
 * Payload for tempo change events (EventKind = 'tempo').
 *
 * Change 308: Canonical tempo event payload type.
 */
export interface TempoPayload {
  /** Tempo in beats per minute */
  readonly bpm: number;
}

/**
 * Default project tempo when no tempo events exist.
 *
 * Change 307: Explicit constant replaces scattered `tempo = 120` defaults.
 */
export const DEFAULT_PROJECT_TEMPO = 120;

// ============================================================================
// TEMPO QUERIES
// ============================================================================

/**
 * Gets the effective tempo at a given tick position by scanning tempo events
 * in the specified stream (or all streams).
 *
 * Scans for EventKind='tempo' events at or before the given tick and returns
 * the most recent one's BPM. Falls back to DEFAULT_PROJECT_TEMPO if none found.
 *
 * Change 307: Read tempo from SSOT instead of hardcoding.
 *
 * @param atTick - The tick position to query (defaults to 0)
 * @param streamId - Optional specific stream to search. If omitted, searches all streams.
 * @returns Tempo in BPM
 */
export function getTempoAtTick(
  atTick: Tick | number = 0,
  streamId?: EventStreamId
): number {
  const store = getSharedEventStore();
  const tick = typeof atTick === 'number' ? asTick(atTick) : atTick;

  let latestTempoEvent: Event<TempoPayload> | undefined;

  const streams = streamId
    ? [store.getStream(streamId)].filter(Boolean)
    : store.getAllStreams();

  for (const stream of streams) {
    if (!stream) continue;
    for (const event of stream.events) {
      if (
        event.kind === EventKinds.TEMPO &&
        event.start <= tick &&
        (!latestTempoEvent || event.start > latestTempoEvent.start)
      ) {
        latestTempoEvent = event as Event<TempoPayload>;
      }
    }
  }

  return latestTempoEvent?.payload?.bpm ?? DEFAULT_PROJECT_TEMPO;
}

/**
 * Gets all tempo events from the store, sorted by tick position.
 *
 * @param streamId - Optional specific stream. If omitted, collects from all streams.
 * @returns Array of tempo events sorted by start tick
 */
export function getAllTempoEvents(
  streamId?: EventStreamId
): readonly Event<TempoPayload>[] {
  const store = getSharedEventStore();

  const streams = streamId
    ? [store.getStream(streamId)].filter(Boolean)
    : store.getAllStreams();

  const tempoEvents: Event<TempoPayload>[] = [];

  for (const stream of streams) {
    if (!stream) continue;
    for (const event of stream.events) {
      if (event.kind === EventKinds.TEMPO) {
        tempoEvents.push(event as Event<TempoPayload>);
      }
    }
  }

  return tempoEvents.sort((a, b) => a.start - b.start);
}

/**
 * Gets the initial (project-level) tempo.
 * This is the tempo at tick 0, or DEFAULT_PROJECT_TEMPO if no tempo events exist.
 *
 * Change 307: Use this instead of hardcoded `tempo = 120`.
 */
export function getProjectTempo(streamId?: EventStreamId): number {
  return getTempoAtTick(0, streamId);
}
