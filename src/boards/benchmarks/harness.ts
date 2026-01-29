/**
 * @fileoverview Performance Benchmark Harness (K014)
 */

import { getSharedEventStore } from '../../state/event-store';
import { createEvent } from '../../types/event';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';
import type { EventStreamId } from '../../state/types';

export interface BenchmarkResult {
  operation: string;
  durationMs: number;
  opsPerSecond: number | undefined;
  success: boolean;
}

async function measure(op: string, fn: () => void, count?: number): Promise<BenchmarkResult> {
  const start = performance.now();
  try {
    fn();
    const duration = performance.now() - start;
    return {
      operation: op,
      durationMs: duration,
      opsPerSecond: count !== undefined ? (count / duration) * 1000 : undefined,
      success: true
    };
  } catch (error) {
    return { operation: op, durationMs: performance.now() - start, opsPerSecond: undefined, success: false };
  }
}

export async function runBenchmark(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const store = getSharedEventStore();
  const streamIds: EventStreamId[] = [];

  results.push(await measure('Create 10 streams', () => {
    for (let i = 0; i < 10; i++) {
      streamIds.push(store.createStream(`Bench ${i}`));
    }
  }, 10));

  results.push(await measure('Add 10000 events', () => {
    for (const streamId of streamIds) {
      const events = Array.from({ length: 1000 }, (_, i) => createEvent({
        kind: EventKinds.NOTE,
        start: asTick(i * 120),
        duration: asTickDuration(120),
        payload: { note: 60, velocity: 100 }
      }));
      store.addEvents(streamId, events);
    }
  }, 10000));

  return results;
}
