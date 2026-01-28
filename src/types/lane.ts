/**
 * @fileoverview Lane<T> type for automation and modulation data.
 * 
 * Lanes store time-varying values with interpolation.
 * 
 * @module @cardplay/core/types/lane
 * @see cardplay2.md Section 1.5 - Lane<T>
 */

import { type Tick, asTick } from './primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Interpolation mode for automation curves.
 */
export type Interpolation = 'step' | 'linear' | 'bezier' | 'smooth';

/**
 * Normalized control value (0.0 - 1.0).
 */
export type Control = number & { readonly __control: unique symbol };

/**
 * Automation target descriptor.
 */
export interface Target<T> {
  /** Parameter path (e.g., "synth.filter.cutoff") */
  readonly path: string;
  /** Minimum value */
  readonly min?: number;
  /** Maximum value */
  readonly max?: number;
  /** Default value */
  readonly default?: T;
  /** Unit string (e.g., "Hz", "dB") */
  readonly unit?: string;
}

/**
 * Automation point with optional curve data.
 */
export interface Point<T> {
  /** Time position */
  readonly tick: Tick;
  /** Value at this point */
  readonly value: T;
  /** Interpolation to next point (overrides lane default) */
  readonly interpolation?: Interpolation;
  /** Bezier curve tension (-1 to 1) */
  readonly curve?: number;
  /** Bezier control points [x1, y1, x2, y2] */
  readonly controlPoints?: readonly [number, number, number, number];
  /** Whether point is locked (can't be moved) */
  readonly locked?: boolean;
}

/**
 * Automation lane with time-varying values.
 * 
 * @template T - Value type
 */
export interface Lane<T> {
  /** Target parameter */
  readonly target: Target<T>;
  /** Automation points (sorted by tick) */
  readonly points: readonly Point<T>[];
  /** Default interpolation mode */
  readonly interpolation?: Interpolation;
  /** Whether lane is bypassed */
  readonly bypassed?: boolean;
  /** Display color */
  readonly color?: string;
  /** Human-readable name */
  readonly name?: string;
}

/**
 * Automation lane for numeric values.
 */
export type AutomationLane = Lane<number>;

// ============================================================================
// CONTROL VALUE HELPERS
// ============================================================================

/**
 * Creates a Control value with validation.
 */
export function asControl(value: number): Control {
  if (value < 0 || value > 1) {
    throw new RangeError(`Control must be 0.0-1.0, got ${value}`);
  }
  return value as Control;
}

/**
 * Clamps a value to Control range.
 */
export function clampControl(value: number): Control {
  return Math.max(0, Math.min(1, value)) as Control;
}

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Options for creating a lane.
 */
export interface CreateLaneOptions<T> {
  target: Target<T> | string;
  points?: Point<T>[];
  interpolation?: Interpolation;
  bypassed?: boolean;
  color?: string;
  name?: string;
}

/**
 * Creates a new Lane.
 */
export function createLane<T>(options: CreateLaneOptions<T>): Lane<T> {
  const target: Target<T> = typeof options.target === 'string'
    ? { path: options.target }
    : options.target;
  
  // Sort points by tick
  const points = [...(options.points ?? [])].sort((a, b) => a.tick - b.tick);
  
  const lane: Lane<T> = {
    target,
    points,
  };
  
  if (options.interpolation !== undefined) {
    (lane as { interpolation: Interpolation }).interpolation = options.interpolation;
  }
  if (options.bypassed !== undefined) {
    (lane as { bypassed: boolean }).bypassed = options.bypassed;
  }
  if (options.color !== undefined) {
    (lane as { color: string }).color = options.color;
  }
  if (options.name !== undefined) {
    (lane as { name: string }).name = options.name;
  }
  
  return Object.freeze(lane);
}

/**
 * Creates a point.
 */
export function createPoint<T>(tick: Tick | number, value: T, options?: Partial<Point<T>>): Point<T> {
  const point: Point<T> = {
    tick: typeof tick === 'number' ? asTick(tick) : tick,
    value,
  };
  
  if (options?.interpolation !== undefined) {
    (point as { interpolation: Interpolation }).interpolation = options.interpolation;
  }
  if (options?.curve !== undefined) {
    (point as { curve: number }).curve = options.curve;
  }
  if (options?.controlPoints !== undefined) {
    (point as { controlPoints: readonly [number, number, number, number] }).controlPoints = options.controlPoints;
  }
  if (options?.locked !== undefined) {
    (point as { locked: boolean }).locked = options.locked;
  }
  
  return Object.freeze(point);
}

// ============================================================================
// LANE OPERATIONS
// ============================================================================

/**
 * Gets the value at a specific tick with interpolation.
 */
export function laneValueAt<T extends number>(lane: Lane<T>, tick: Tick): T {
  const { points, interpolation = 'linear' } = lane;
  
  if (points.length === 0) {
    return (lane.target.default ?? 0) as T;
  }
  
  // Before first point
  if (tick <= points[0]!.tick) {
    return points[0]!.value;
  }
  
  // After last point
  if (tick >= points[points.length - 1]!.tick) {
    return points[points.length - 1]!.value;
  }
  
  // Find surrounding points
  let left = 0;
  let right = points.length - 1;
  
  while (right - left > 1) {
    const mid = Math.floor((left + right) / 2);
    if (points[mid]!.tick <= tick) {
      left = mid;
    } else {
      right = mid;
    }
  }
  
  const p1 = points[left]!;
  const p2 = points[right]!;
  const mode = p1.interpolation ?? interpolation;
  
  // Calculate interpolation factor
  const t = (tick - p1.tick) / (p2.tick - p1.tick);
  
  switch (mode) {
    case 'step':
      return p1.value;
    case 'linear':
      return (p1.value + (p2.value - p1.value) * t) as T;
    case 'smooth':
      // Smoothstep interpolation
      const smoothT = t * t * (3 - 2 * t);
      return (p1.value + (p2.value - p1.value) * smoothT) as T;
    case 'bezier':
      // Cubic bezier with control points or curve tension
      if (p1.controlPoints) {
        const bezierT = cubicBezier(t, p1.controlPoints[1], p1.controlPoints[3]);
        return (p1.value + (p2.value - p1.value) * bezierT) as T;
      }
      const curve = p1.curve ?? 0;
      const curveT = t + curve * t * (1 - t) * (0.5 - t) * 4;
      return (p1.value + (p2.value - p1.value) * curveT) as T;
    default:
      return p1.value;
  }
}

/**
 * Evaluates cubic bezier curve.
 */
function cubicBezier(t: number, p1: number, p2: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  return 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3;
}

/**
 * Adds a point to a lane, maintaining sorted order.
 */
export function addPointToLane<T>(lane: Lane<T>, point: Point<T>): Lane<T> {
  const points = [...lane.points];
  
  // Find insertion position
  let i = 0;
  while (i < points.length && points[i]!.tick < point.tick) {
    i++;
  }
  
  // Replace if same tick, otherwise insert
  if (i < points.length && points[i]!.tick === point.tick) {
    points[i] = point;
  } else {
    points.splice(i, 0, point);
  }
  
  return createLane({ ...lane, points });
}

/**
 * Removes a point from a lane by tick.
 */
export function removePointFromLane<T>(lane: Lane<T>, tick: Tick): Lane<T> {
  const points = lane.points.filter(p => p.tick !== tick);
  return createLane({ ...lane, points });
}

/**
 * Slices a lane to a tick range.
 */
export function laneSlice<T>(lane: Lane<T>, start: Tick, end: Tick): Lane<T> {
  const points = lane.points.filter(p => p.tick >= start && p.tick <= end);
  return createLane({ ...lane, points });
}

/**
 * Merges two lanes (second takes priority for overlapping points).
 */
export function laneMerge<T>(a: Lane<T>, b: Lane<T>): Lane<T> {
  const pointMap = new Map<number, Point<T>>();
  
  for (const p of a.points) {
    pointMap.set(p.tick, p);
  }
  for (const p of b.points) {
    pointMap.set(p.tick, p);
  }
  
  const points = Array.from(pointMap.values()).sort((x, y) => x.tick - y.tick);
  return createLane({ ...a, ...b, points });
}

/**
 * Quantizes lane points to a grid.
 */
export function laneQuantize<T>(lane: Lane<T>, grid: number): Lane<T> {
  const points = lane.points.map(p => ({
    ...p,
    tick: asTick(Math.round(p.tick / grid) * grid),
  }));
  
  // Remove duplicates (keep last)
  const uniquePoints = new Map<number, Point<T>>();
  for (const p of points) {
    uniquePoints.set(p.tick, p);
  }
  
  return createLane({
    ...lane,
    points: Array.from(uniquePoints.values()).sort((a, b) => a.tick - b.tick),
  });
}

/**
 * Simplifies a lane by removing points that don't significantly affect the curve.
 */
export function laneSimplify<T extends number>(lane: Lane<T>, tolerance: number): Lane<T> {
  if (lane.points.length <= 2) return lane;
  
  // Douglas-Peucker-like simplification
  const keep = new Set<number>([0, lane.points.length - 1]);
  
  function simplifyRange(start: number, end: number): void {
    if (end - start <= 1) return;
    
    const startPoint = lane.points[start]!;
    const endPoint = lane.points[end]!;
    
    let maxDist = 0;
    let maxIndex = start;
    
    for (let i = start + 1; i < end; i++) {
      const point = lane.points[i]!;
      
      // Calculate perpendicular distance from line
      const t = (point.tick - startPoint.tick) / (endPoint.tick - startPoint.tick);
      const expectedValue = startPoint.value + (endPoint.value - startPoint.value) * t;
      const dist = Math.abs(point.value - expectedValue);
      
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    if (maxDist > tolerance) {
      keep.add(maxIndex);
      simplifyRange(start, maxIndex);
      simplifyRange(maxIndex, end);
    }
  }
  
  simplifyRange(0, lane.points.length - 1);
  
  const points = lane.points.filter((_, i) => keep.has(i));
  return createLane({ ...lane, points });
}

/**
 * Gets the bounds of a lane (first and last tick).
 */
export function laneBounds<T>(lane: Lane<T>): { start: Tick; end: Tick } | null {
  if (lane.points.length === 0) return null;
  return {
    start: lane.points[0]!.tick,
    end: lane.points[lane.points.length - 1]!.tick,
  };
}

// ============================================================================
// EXPRESSION AND MODULATION TYPES
// ============================================================================

/**
 * Expression data for MIDI CC.
 * Includes control number and value.
 */
export interface Expression {
  /** MIDI CC number (0-127) */
  readonly cc: number;
  /** Value (0-127) */
  readonly value: number;
}

/**
 * Creates an Expression value.
 */
export function createExpression(cc: number, value: number): Expression {
  if (cc < 0 || cc > 127) {
    throw new RangeError(`CC number must be 0-127, got ${cc}`);
  }
  if (value < 0 || value > 127) {
    throw new RangeError(`CC value must be 0-127, got ${value}`);
  }
  return { cc: Math.round(cc), value: Math.round(value) };
}

/**
 * Modulation lane with source signal info.
 */
export interface Modulation<T> extends Lane<T> {
  /** Source signal identifier */
  readonly source: string;
  /** Amount of modulation (-1 to 1) */
  readonly amount: number;
  /** Whether modulation is bipolar */
  readonly bipolar?: boolean;
}

/**
 * Lane alias for Control values.
 */
export type ModulationLane = Lane<Control>;

/**
 * Lane alias for Expression values.
 */
export type ExpressionLane = Lane<Expression>;

/**
 * Blend modes for combining modulations.
 */
export type BlendMode = 'add' | 'multiply' | 'max' | 'min' | 'average';

/**
 * Creates a Modulation lane.
 */
export function createModulation<T>(
  options: CreateLaneOptions<T> & {
    source: string;
    amount?: number;
    bipolar?: boolean;
  }
): Modulation<T> {
  const lane = createLane(options);
  const mod: Modulation<T> = {
    ...lane,
    source: options.source,
    amount: options.amount ?? 1.0,
  };
  
  if (options.bipolar !== undefined) {
    return { ...mod, bipolar: options.bipolar };
  }
  
  return Object.freeze(mod);
}

/**
 * Applies modulation to a base value.
 * 
 * @param baseValue The base value to modulate
 * @param modulation The modulation lane
 * @param tick The time position
 * @returns The modulated value
 */
export function applyModulation<T extends number>(
  baseValue: T,
  modulation: Modulation<T>,
  tick: Tick
): T {
  const modValue = laneValueAt(modulation, tick);
  if (modValue === undefined) return baseValue;
  
  const amount = modulation.amount;
  
  if (modulation.bipolar) {
    // Bipolar: modValue is centered at 0.5
    const offset = ((modValue as number) - 0.5) * 2 * amount;
    return (baseValue + offset) as T;
  } else {
    // Unipolar: simple multiply
    const scaledMod = (modValue as number) * amount;
    return (baseValue * (1 + scaledMod)) as T;
  }
}

/**
 * Combines multiple modulations using a blend mode.
 */
export function combineModulations<T extends number>(
  modulations: readonly Modulation<T>[],
  tick: Tick,
  mode: BlendMode = 'add'
): T | undefined {
  if (modulations.length === 0) return undefined;
  
  const values: number[] = [];
  for (const mod of modulations) {
    const v = laneValueAt(mod, tick);
    if (v !== undefined) {
      values.push((v as number) * mod.amount);
    }
  }
  
  if (values.length === 0) return undefined;
  
  let result: number;
  switch (mode) {
    case 'add':
      result = values.reduce((a, b) => a + b, 0);
      break;
    case 'multiply':
      result = values.reduce((a, b) => a * b, 1);
      break;
    case 'max':
      result = Math.max(...values);
      break;
    case 'min':
      result = Math.min(...values);
      break;
    case 'average':
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
  }
  
  return result as T;
}

// ============================================================================
// LANE <-> EVENT CONVERSION
// ============================================================================

/**
 * Automation event payload for lane-to-event conversion.
 */
export interface AutomationPayload {
  readonly path: string;
  readonly value: number;
  readonly interpolation?: Interpolation;
  readonly curve?: number;
}

/**
 * Converts a lane to automation events.
 * Each point becomes an event.
 */
export function laneToEvents<T extends number>(
  lane: Lane<T>,
  createEventFn: (
    start: Tick,
    payload: AutomationPayload
  ) => { id: string; kind: string; start: Tick; duration: number; payload: AutomationPayload }
): readonly { id: string; kind: string; start: Tick; duration: number; payload: AutomationPayload }[] {
  return lane.points.map(point => {
    const payload: AutomationPayload = {
      path: lane.target.path,
      value: point.value as number,
    };
    const interpolation = point.interpolation ?? lane.interpolation;
    if (interpolation !== undefined) {
      (payload as { interpolation: Interpolation }).interpolation = interpolation;
    }
    if (point.curve !== undefined) {
      (payload as { curve: number }).curve = point.curve;
    }
    return createEventFn(point.tick, payload);
  });
}

/**
 * Converts automation events back to a lane.
 */
export function eventsToLane<T extends number>(
  events: readonly { start: Tick; payload: { path: string; value: number; interpolation?: Interpolation; curve?: number } }[],
  target?: Target<T>
): Lane<T> {
  if (events.length === 0) {
    throw new Error('Cannot create lane from empty events');
  }
  
  const path = events[0]!.payload.path;
  const points: Point<T>[] = events.map(e => {
    const point: Point<T> = {
      tick: e.start,
      value: e.payload.value as T,
    };
    if (e.payload.interpolation !== undefined) {
      (point as { interpolation: Interpolation }).interpolation = e.payload.interpolation;
    }
    if (e.payload.curve !== undefined) {
      (point as { curve: number }).curve = e.payload.curve;
    }
    return point;
  });
  
  return createLane({
    target: target ?? { path },
    points,
  });
}
