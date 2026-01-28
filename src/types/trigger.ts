/**
 * @fileoverview Trigger<P> type for sub-event actions.
 * 
 * Triggers fire at specific points within an event's duration.
 * 
 * @module @cardplay/core/types/trigger
 * @see cardplay2.md Section 1.1 - Trigger<P>
 */

import { type Tick, type TickDuration, asTick } from './primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Offset mode for trigger timing.
 */
export type TriggerOffsetMode = 'absolute' | 'relative' | 'fromEnd';

/**
 * Trigger that fires at a specific point within an event.
 * 
 * @template P - Payload type for the trigger action
 */
export interface Trigger<P> {
  /** Offset value (interpretation depends on offsetMode) */
  readonly offset: number;
  /** How to interpret the offset */
  readonly offsetMode: TriggerOffsetMode;
  /** Action type identifier */
  readonly action: string;
  /** Action payload */
  readonly payload: P;
  /** Priority for ordering simultaneous triggers */
  readonly priority?: number;
  /** Whether trigger is enabled */
  readonly enabled: boolean;
}

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Options for creating a trigger.
 */
export interface CreateTriggerOptions<P> {
  offset: number;
  offsetMode: TriggerOffsetMode;
  action: string;
  payload: P;
  priority?: number;
  enabled?: boolean;
}

/**
 * Creates a new Trigger.
 */
export function createTrigger<P>(options: CreateTriggerOptions<P>): Trigger<P> {
  // Validate relative offset (0.0 - 1.0)
  if (options.offsetMode === 'relative' && (options.offset < 0 || options.offset > 1)) {
    throw new RangeError(`Relative offset must be 0.0-1.0, got ${options.offset}`);
  }
  
  // Validate offset for absolute modes
  if ((options.offsetMode === 'absolute' || options.offsetMode === 'fromEnd') && options.offset < 0) {
    throw new RangeError(`Offset must be non-negative, got ${options.offset}`);
  }
  
  const trigger: Trigger<P> = {
    offset: options.offset,
    offsetMode: options.offsetMode,
    action: options.action,
    payload: options.payload,
    enabled: options.enabled ?? true,
  };
  
  if (options.priority !== undefined) {
    (trigger as { priority: number }).priority = options.priority;
  }
  
  return Object.freeze(trigger);
}

/**
 * Creates an absolute-timed trigger.
 */
export function createAbsoluteTrigger<P = void>(
  offsetTicks: Tick | number,
  action: string,
  payload?: P
): Trigger<P> {
  return createTrigger<P>({
    offset: typeof offsetTicks === 'number' ? offsetTicks : offsetTicks,
    offsetMode: 'absolute',
    action,
    payload: payload as P,
  });
}

/**
 * Creates a relative-timed trigger (fraction of event duration).
 */
export function createRelativeTrigger<P = void>(
  fraction: number,
  action: string,
  payload?: P
): Trigger<P> {
  return createTrigger<P>({
    offset: fraction,
    offsetMode: 'relative',
    action,
    payload: payload as P,
  });
}

/**
 * Creates a trigger that fires relative to the event end.
 */
export function createFromEndTrigger<P = void>(
  ticksBeforeEnd: Tick | number,
  action: string,
  payload?: P
): Trigger<P> {
  return createTrigger<P>({
    offset: typeof ticksBeforeEnd === 'number' ? ticksBeforeEnd : ticksBeforeEnd,
    offsetMode: 'fromEnd',
    action,
    payload: payload as P,
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Resolves a trigger's absolute tick position within an event.
 */
export function resolveTriggerTick<P>(
  trigger: Trigger<P>,
  eventStart: Tick,
  eventDuration: TickDuration
): Tick {
  switch (trigger.offsetMode) {
    case 'absolute':
      return asTick(eventStart + trigger.offset);
    case 'relative':
      return asTick(eventStart + Math.round(trigger.offset * eventDuration));
    case 'fromEnd':
      return asTick(eventStart + eventDuration - trigger.offset);
  }
}

/**
 * Checks if a trigger is within an event's bounds.
 */
export function isTriggerInBounds<P>(
  trigger: Trigger<P>,
  eventDuration: TickDuration
): boolean {
  switch (trigger.offsetMode) {
    case 'absolute':
      return trigger.offset >= 0 && trigger.offset <= eventDuration;
    case 'relative':
      return trigger.offset >= 0 && trigger.offset <= 1;
    case 'fromEnd':
      return trigger.offset >= 0 && trigger.offset <= eventDuration;
  }
}

/**
 * Adjusts a trigger's offset for event resize.
 */
export function adjustTriggerForResize<P>(
  trigger: Trigger<P>,
  _oldDuration: TickDuration,
  newDuration: TickDuration
): Trigger<P> {
  // Only absolute/fromEnd triggers need adjustment for clamping
  if (trigger.offsetMode !== 'relative') {
    if (trigger.offsetMode === 'absolute' && trigger.offset > newDuration) {
      return createTrigger({ ...trigger, offset: newDuration });
    }
    if (trigger.offsetMode === 'fromEnd' && trigger.offset > newDuration) {
      return createTrigger({ ...trigger, offset: newDuration });
    }
    return trigger;
  }
  
  // Relative triggers scale automatically
  return trigger;
}

/**
 * Clones a trigger with optional overrides.
 */
export function cloneTrigger<P>(
  trigger: Trigger<P>,
  overrides?: Partial<Trigger<P>>
): Trigger<P> {
  return createTrigger({ ...trigger, ...overrides } as CreateTriggerOptions<P>);
}
