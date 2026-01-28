/**
 * @fileoverview Automation Lane - Automation curves and parameter modulation.
 * 
 * Unifies automation across:
 * - Visual lane display in arrangement
 * - Audio parameter modulation
 * - Real-time interpolation
 * - Envelope generation
 * 
 * @module @cardplay/audio/automation-lane
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.2, F.3
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import { EventKinds } from '../types/event-kind';
import type {
  EventStreamId,
  EventId,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  executeWithUndo,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Automation point identifier.
 */
export type AutomationPointId = string & { readonly __brand: 'AutomationPointId' };

export function asAutomationPointId(id: string): AutomationPointId {
  return id as AutomationPointId;
}

/**
 * Curve types for automation.
 */
export type CurveType = 'linear' | 'exponential' | 'logarithmic' | 'step' | 'smooth';

/**
 * Automation point.
 */
export interface AutomationPoint {
  readonly id: AutomationPointId;
  readonly tick: Tick;
  readonly value: number; // 0-1 normalized
  readonly curveType: CurveType;
  /** Tension for smooth curves (-1 to 1) */
  readonly tension?: number;
  /** Whether point is selected */
  readonly selected?: boolean;
}

/**
 * Automation point event payload.
 */
export interface AutomationEventPayload {
  readonly point: AutomationPoint;
  readonly parameterPath: string;
}

/**
 * Automation lane configuration.
 */
export interface AutomationLaneConfig {
  readonly id: string;
  readonly streamId: EventStreamId;
  readonly parameterPath: string;
  readonly name: string;
  readonly color?: string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly defaultValue: number;
  readonly unit?: string;
  readonly visible: boolean;
  readonly height: number;
}

/**
 * Lane state callback.
 */
export type AutomationLaneCallback = (points: readonly AutomationPoint[]) => void;

// ============================================================================
// AUTOMATION LANE
// ============================================================================

/**
 * AutomationLane manages automation points and interpolation.
 */
export class AutomationLane {
  private config: AutomationLaneConfig;
  private points: AutomationPoint[] = [];
  private subscriptionId: SubscriptionId | null = null;
  private stateCallbacks = new Set<AutomationLaneCallback>();
  private disposed = false;

  constructor(config: AutomationLaneConfig) {
    this.config = config;

    // Subscribe to store for this stream
    const store = getSharedEventStore();
    this.subscriptionId = store.subscribeToStream(
      config.streamId,
      (events) => this.syncFromStore(events)
    );

    // Initial sync
    const stream = store.getStream(config.streamId);
    if (stream) {
      this.syncFromStore(stream.events);
    }
  }

  // ==========================================================================
  // CONFIG
  // ==========================================================================

  getConfig(): AutomationLaneConfig {
    return this.config;
  }

  setConfig(config: Partial<AutomationLaneConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================================================
  // POINTS ACCESS
  // ==========================================================================

  getPoints(): readonly AutomationPoint[] {
    return this.points;
  }

  getPointAt(tick: Tick): AutomationPoint | undefined {
    return this.points.find(p => p.tick === tick);
  }

  getPointById(id: AutomationPointId): AutomationPoint | undefined {
    return this.points.find(p => p.id === id);
  }

  /**
   * Gets points in range.
   */
  getPointsInRange(start: Tick, end: Tick): readonly AutomationPoint[] {
    return this.points.filter(
      p => (p.tick as number) >= (start as number) && (p.tick as number) < (end as number)
    );
  }

  // ==========================================================================
  // VALUE INTERPOLATION
  // ==========================================================================

  /**
   * Gets interpolated value at tick.
   */
  getValueAtTick(tick: Tick): number {
    if (this.points.length === 0) {
      return this.config.defaultValue;
    }

    // Find surrounding points
    let before: AutomationPoint | undefined;
    let after: AutomationPoint | undefined;

    for (const point of this.points) {
      if ((point.tick as number) <= (tick as number)) {
        before = point;
      }
      if (!after && (point.tick as number) > (tick as number)) {
        after = point;
      }
    }

    // Handle edge cases
    if (!before && !after) {
      return this.config.defaultValue;
    }
    if (!before) {
      return this.denormalize(after!.value);
    }
    if (!after) {
      return this.denormalize(before.value);
    }

    // Interpolate
    const t = ((tick as number) - (before.tick as number)) /
              ((after.tick as number) - (before.tick as number));

    const interpolated = this.interpolate(before.value, after.value, t, before.curveType, before.tension);
    return this.denormalize(interpolated);
  }

  /**
   * Gets value at time (seconds).
   */
  getValueAtTime(time: number, tempo: number, ticksPerBeat: number = 480): number {
    const ticksPerSecond = (tempo * ticksPerBeat) / 60;
    const tick = asTick(Math.floor(time * ticksPerSecond));
    return this.getValueAtTick(tick);
  }

  /**
   * Interpolates between values.
   */
  private interpolate(
    v1: number,
    v2: number,
    t: number,
    curveType: CurveType,
    tension?: number
  ): number {
    switch (curveType) {
      case 'step':
        return v1;

      case 'linear':
        return v1 + (v2 - v1) * t;

      case 'exponential':
        return v1 * Math.pow(v2 / Math.max(v1, 0.0001), t);

      case 'logarithmic':
        return v1 + (v2 - v1) * Math.log(1 + t * 9) / Math.log(10);

      case 'smooth': {
        // Smooth step with optional tension
        const tensionVal = tension ?? 0;
        const smoothT = this.smoothstep(t, tensionVal);
        return v1 + (v2 - v1) * smoothT;
      }

      default:
        return v1 + (v2 - v1) * t;
    }
  }

  /**
   * Smooth step function with tension.
   */
  private smoothstep(t: number, tension: number): number {
    // Base smoothstep
    let result = t * t * (3 - 2 * t);

    // Apply tension
    if (tension > 0) {
      // More aggressive curve
      result = Math.pow(result, 1 + tension);
    } else if (tension < 0) {
      // More gentle curve
      result = 1 - Math.pow(1 - result, 1 - tension);
    }

    return result;
  }

  /**
   * Normalizes value to 0-1 range.
   */
  normalize(value: number): number {
    return (value - this.config.minValue) / (this.config.maxValue - this.config.minValue);
  }

  /**
   * Denormalizes 0-1 value to actual range.
   */
  denormalize(normalized: number): number {
    return this.config.minValue + normalized * (this.config.maxValue - this.config.minValue);
  }

  // ==========================================================================
  // POINT OPERATIONS
  // ==========================================================================

  /**
   * Adds an automation point.
   */
  addPoint(
    tick: Tick,
    value: number,
    curveType: CurveType = 'smooth',
    tension?: number
  ): AutomationPointId {
    const id = asAutomationPointId(`ap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const normalizedValue = this.normalize(value);

    const point: AutomationPoint = {
      id,
      tick,
      value: Math.max(0, Math.min(1, normalizedValue)),
      curveType,
      ...(tension !== undefined && { tension }),
    };

    const store = getSharedEventStore();
    const event: Event<AutomationEventPayload> = {
      id: id as unknown as EventId,
      kind: EventKinds.AUTOMATION,
      start: tick,
      duration: asTickDuration(0),
      payload: {
        point,
        parameterPath: this.config.parameterPath,
      },
    };

    executeWithUndo({
      type: 'automation:add',
      description: 'Add automation point',
      execute: () => {
        store.addEvent(this.config.streamId, event);
        return event;
      },
      undo: (evt) => {
        store.deleteEvent(this.config.streamId, evt.id);
      },
      redo: (evt) => {
        store.addEvent(this.config.streamId, evt);
      },
    });

    return id;
  }

  /**
   * Moves an automation point.
   */
  movePoint(id: AutomationPointId, newTick: Tick, newValue?: number): void {
    const point = this.getPointById(id);
    if (!point) return;

    const store = getSharedEventStore();
    const oldTick = point.tick;
    const oldValue = point.value;
    const updatedValue = newValue !== undefined ? this.normalize(newValue) : oldValue;

    const updatedPoint: AutomationPoint = {
      ...point,
      tick: newTick,
      value: Math.max(0, Math.min(1, updatedValue)),
    };

    const event: Event<AutomationEventPayload> = {
      id: id as unknown as EventId,
      kind: EventKinds.AUTOMATION,
      start: newTick,
      duration: asTickDuration(0),
      payload: {
        point: updatedPoint,
        parameterPath: this.config.parameterPath,
      },
    };

    executeWithUndo({
      type: 'automation:move',
      description: 'Move automation point',
      execute: () => {
        store.deleteEvent(this.config.streamId, id as unknown as EventId);
        store.addEvent(this.config.streamId, event);
        return { oldTick, oldValue };
      },
      undo: ({ oldTick: ot, oldValue: ov }) => {
        store.deleteEvent(this.config.streamId, id as unknown as EventId);
        const oldEvent: Event<AutomationEventPayload> = {
          id: id as unknown as EventId,
          kind: EventKinds.AUTOMATION,
          start: ot,
          duration: asTickDuration(0),
          payload: {
            point: { ...point, tick: ot, value: ov },
            parameterPath: this.config.parameterPath,
          },
        };
        store.addEvent(this.config.streamId, oldEvent);
      },
      redo: () => {
        store.deleteEvent(this.config.streamId, id as unknown as EventId);
        store.addEvent(this.config.streamId, event);
      },
    });
  }

  /**
   * Removes an automation point.
   */
  removePoint(id: AutomationPointId): void {
    const point = this.getPointById(id);
    if (!point) return;

    const store = getSharedEventStore();

    executeWithUndo({
      type: 'automation:remove',
      description: 'Remove automation point',
      execute: () => {
        store.deleteEvent(this.config.streamId, id as unknown as EventId);
        return point;
      },
      undo: (p) => {
        const event: Event<AutomationEventPayload> = {
          id: id as unknown as EventId,
          kind: EventKinds.AUTOMATION,
          start: p.tick,
          duration: asTickDuration(0),
          payload: {
            point: p,
            parameterPath: this.config.parameterPath,
          },
        };
        store.addEvent(this.config.streamId, event);
      },
      redo: () => {
        store.deleteEvent(this.config.streamId, id as unknown as EventId);
      },
    });
  }

  /**
   * Sets curve type for a point.
   */
  setCurveType(id: AutomationPointId, curveType: CurveType, tension?: number): void {
    const point = this.getPointById(id);
    if (!point) return;

    const store = getSharedEventStore();
    const updatedPoint: AutomationPoint = {
      ...point,
      curveType,
      ...(tension !== undefined && { tension }),
    };

    const event: Event<AutomationEventPayload> = {
      id: id as unknown as EventId,
      kind: EventKinds.AUTOMATION,
      start: point.tick,
      duration: asTickDuration(0),
      payload: {
        point: updatedPoint,
        parameterPath: this.config.parameterPath,
      },
    };

    store.deleteEvent(this.config.streamId, id as unknown as EventId);
    store.addEvent(this.config.streamId, event);
  }

  /**
   * Clears all points.
   */
  clearPoints(): void {
    const store = getSharedEventStore();
    const events = store.getStream(this.config.streamId)?.events ?? [];

    for (const event of events) {
      if (event.kind === EventKinds.AUTOMATION) {
        const payload = event.payload as AutomationEventPayload;
        if (payload.parameterPath === this.config.parameterPath) {
          store.deleteEvent(this.config.streamId, event.id);
        }
      }
    }
  }

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  /**
   * Selects a point.
   */
  selectPoint(id: AutomationPointId, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.points = this.points.map(p => ({ ...p, selected: false }));
    }

    this.points = this.points.map(p =>
      p.id === id ? { ...p, selected: true } : p
    );

    this.notifyChange();
  }

  /**
   * Selects points in range.
   */
  selectPointsInRange(start: Tick, end: Tick): void {
    this.points = this.points.map(p => ({
      ...p,
      selected: (p.tick as number) >= (start as number) && (p.tick as number) < (end as number),
    }));

    this.notifyChange();
  }

  /**
   * Gets selected points.
   */
  getSelectedPoints(): readonly AutomationPoint[] {
    return this.points.filter(p => p.selected);
  }

  /**
   * Clears selection.
   */
  clearSelection(): void {
    this.points = this.points.map(p => ({ ...p, selected: false }));
    this.notifyChange();
  }

  // ==========================================================================
  // ENVELOPE GENERATION
  // ==========================================================================

  /**
   * Generates an envelope shape.
   */
  generateEnvelope(
    startTick: Tick,
    lengthTicks: TickDuration,
    shape: 'attack' | 'decay' | 'sustain' | 'release' | 'triangle' | 'sine',
    startValue: number = 0,
    peakValue: number = 1,
    endValue: number = 0
  ): void {
    const start = startTick as number;
    const length = lengthTicks as number;

    // Clear existing points in range
    const toRemove = this.points.filter(
      p => (p.tick as number) >= start && (p.tick as number) <= start + length
    );
    for (const point of toRemove) {
      this.removePoint(point.id);
    }

    // Generate new points based on shape
    switch (shape) {
      case 'attack':
        this.addPoint(asTick(start), startValue, 'exponential');
        this.addPoint(asTick(start + length), peakValue, 'exponential');
        break;

      case 'decay':
        this.addPoint(asTick(start), peakValue, 'exponential');
        this.addPoint(asTick(start + length), endValue, 'exponential');
        break;

      case 'sustain':
        this.addPoint(asTick(start), peakValue, 'step');
        this.addPoint(asTick(start + length), peakValue, 'step');
        break;

      case 'release':
        this.addPoint(asTick(start), peakValue, 'exponential');
        this.addPoint(asTick(start + length), 0, 'exponential');
        break;

      case 'triangle':
        this.addPoint(asTick(start), startValue, 'linear');
        this.addPoint(asTick(start + length / 2), peakValue, 'linear');
        this.addPoint(asTick(start + length), endValue, 'linear');
        break;

      case 'sine': {
        // Approximate sine with multiple points
        const numPoints = 16;
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const tick = asTick(start + t * length);
          const value = startValue + (peakValue - startValue) * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
          this.addPoint(tick, value, 'smooth');
        }
        break;
      }
    }
  }

  /**
   * Generates ADSR envelope.
   */
  generateADSR(
    startTick: Tick,
    attack: TickDuration,
    decay: TickDuration,
    sustainLevel: number,
    release: TickDuration,
    peakValue: number = 1
  ): void {
    const start = startTick as number;
    const a = attack as number;
    const d = decay as number;
    const r = release as number;

    // Clear existing in range
    const totalLength = a + d + r;
    const toRemove = this.points.filter(
      p => (p.tick as number) >= start && (p.tick as number) <= start + totalLength
    );
    for (const point of toRemove) {
      this.removePoint(point.id);
    }

    // Generate ADSR
    this.addPoint(asTick(start), 0, 'exponential');
    this.addPoint(asTick(start + a), peakValue, 'exponential');
    this.addPoint(asTick(start + a + d), sustainLevel * peakValue, 'exponential');
    this.addPoint(asTick(start + a + d + r), 0, 'exponential');
  }

  // ==========================================================================
  // STORE SYNC
  // ==========================================================================

  private syncFromStore(events: readonly Event<unknown>[]): void {
    this.points = events
      .filter(e => {
        if (e.kind !== EventKinds.AUTOMATION) return false;
        const payload = e.payload as AutomationEventPayload;
        return payload.parameterPath === this.config.parameterPath;
      })
      .map(e => {
        const payload = e.payload as AutomationEventPayload;
        return payload.point;
      })
      .sort((a, b) => (a.tick as number) - (b.tick as number));

    this.notifyChange();
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  subscribe(callback: AutomationLaneCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.points);

    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  private notifyChange(): void {
    for (const callback of this.stateCallbacks) {
      try {
        callback(this.points);
      } catch (e) {
        console.error('Automation lane callback error:', e);
      }
    }
  }

  // ==========================================================================
  // AUDIO INTEGRATION
  // ==========================================================================

  /**
   * Connects to an AudioParam for real-time automation.
   */
  connectToAudioParam(
    param: AudioParam,
    tempo: number,
    startTime: number,
    startTick: Tick,
    endTick: Tick
  ): void {
    const ticksPerSecond = (tempo * 480) / 60;

    // Get points in range
    const points = this.getPointsInRange(startTick, endTick);
    if (points.length === 0) return;

    // Cancel existing automation
    param.cancelScheduledValues(startTime);

    // Schedule automation
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;
      const tickOffset = (point.tick as number) - (startTick as number);
      const time = startTime + tickOffset / ticksPerSecond;
      const value = this.denormalize(point.value);

      if (i === 0) {
        param.setValueAtTime(value, time);
      } else {
        const prevPoint = points[i - 1];
        if (!prevPoint) continue;
        const prevTime = startTime + ((prevPoint.tick as number) - (startTick as number)) / ticksPerSecond;

        switch (prevPoint.curveType) {
          case 'step':
            param.setValueAtTime(value, time);
            break;

          case 'linear':
            param.linearRampToValueAtTime(value, time);
            break;

          case 'exponential':
            // Avoid zero values for exponential
            const expValue = Math.max(0.0001, value);
            param.exponentialRampToValueAtTime(expValue, time);
            break;

          case 'smooth':
          case 'logarithmic':
          default:
            // Use setValueCurve for complex curves
            const numSteps = 10;
            const curve = new Float32Array(numSteps);
            for (let j = 0; j < numSteps; j++) {
              const t = j / (numSteps - 1);
              const prevValue = this.denormalize(prevPoint.value);
              curve[j] = this.interpolate(prevValue, value, t, prevPoint.curveType, prevPoint.tension);
            }
            param.setValueCurveAtTime(curve, prevTime, time - prevTime);
            break;
        }
      }
    }
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.subscriptionId) {
      const store = getSharedEventStore();
      store.unsubscribeFromStream(this.config.streamId, this.subscriptionId);
    }

    this.stateCallbacks.clear();
  }
}

// ============================================================================
// AUTOMATION MANAGER
// ============================================================================

/**
 * Manages multiple automation lanes.
 */
export class AutomationManager {
  private lanes = new Map<string, AutomationLane>();

  constructor(audioContext?: AudioContext) {
    void audioContext;
  }

  /**
   * Creates or gets an automation lane.
   */
  getLane(config: AutomationLaneConfig): AutomationLane {
    let lane = this.lanes.get(config.id);
    if (!lane) {
      lane = new AutomationLane(config);
      this.lanes.set(config.id, lane);
    }
    return lane;
  }

  /**
   * Removes a lane.
   */
  removeLane(id: string): void {
    const lane = this.lanes.get(id);
    if (lane) {
      lane.dispose();
      this.lanes.delete(id);
    }
  }

  /**
   * Gets all lanes for a track.
   */
  getLanesForTrack(trackIndex: number): readonly AutomationLane[] {
    return Array.from(this.lanes.values()).filter(
      lane => lane.getConfig().id.startsWith(`track-${trackIndex}-`)
    );
  }

  /**
   * Gets lane for a parameter path.
   */
  getLaneForParameter(parameterPath: string): AutomationLane | undefined {
    for (const lane of this.lanes.values()) {
      if (lane.getConfig().parameterPath === parameterPath) {
        return lane;
      }
    }
    return undefined;
  }

  /**
   * Clears all lanes.
   */
  clear(): void {
    for (const lane of this.lanes.values()) {
      lane.dispose();
    }
    this.lanes.clear();
  }

  dispose(): void {
    this.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates an automation lane.
 */
export function createAutomationLane(config: AutomationLaneConfig): AutomationLane {
  return new AutomationLane(config);
}

/**
 * Creates an automation manager.
 */
export function createAutomationManager(audioContext?: AudioContext): AutomationManager {
  return new AutomationManager(audioContext);
}
