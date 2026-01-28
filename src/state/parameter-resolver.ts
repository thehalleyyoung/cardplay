/**
 * @fileoverview Parameter Resolver - Unified parameter value resolution.
 * 
 * Resolves parameter values from multiple sources in priority order:
 * 1. Live code / API override (highest)
 * 2. Modulation (LFO, envelope, etc.)
 * 3. Automation (from automation lanes)
 * 4. MIDI CC (from MIDI learn)
 * 5. Preset value (lowest)
 * 
 * @module @cardplay/state/parameter-resolver
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase G.1
 */

import type { Tick } from '../types/primitives';
import type { SubscriptionId } from './types';
import { generateSubscriptionId } from './types';
import { getSharedEventStore } from './event-store';
import type { EventStreamId } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parameter source types in priority order.
 */
export type ParameterSource = 
  | 'live'        // Live code / API override
  | 'modulation'  // LFO, envelope, etc.
  | 'automation'  // Automation lane
  | 'midi'        // MIDI CC
  | 'preset';     // Preset value

/** @deprecated legacy alias */
export type ParameterSourceType = ParameterSource;

/**
 * Parameter value with source information.
 */
export interface ResolvedParameter {
  /** Final resolved value */
  readonly value: number;
  /** Source that provided the value */
  readonly source: ParameterSource;
  /** Original value before modulation */
  readonly baseValue: number;
  /** Modulation amount applied */
  readonly modulationAmount: number;
}

/**
 * Parameter descriptor.
 */
export interface ParameterDescriptor {
  readonly id: string;
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly step?: number;
  readonly unit?: string;
  readonly curve?: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * Automation point.
 */
export interface AutomationPoint {
  readonly tick: Tick;
  readonly value: number;
  readonly curve?: 'linear' | 'hold' | 'exponential';
}

/**
 * Modulation source configuration.
 */
export interface ModulationSource {
  readonly id: string;
  readonly type: 'lfo' | 'envelope' | 'random' | 'follower';
  readonly amount: number; // -1 to 1
  /** Current modulation value (updated by modulation system) */
  value: number;
}

/**
 * MIDI CC mapping.
 */
export interface MidiCcMapping {
  readonly channel: number;
  readonly cc: number;
  readonly min: number;
  readonly max: number;
  /** Current CC value (0-127) */
  value: number;
}

/**
 * Parameter registration info.
 */
export interface ParameterRegistration {
  readonly cardId: string;
  readonly paramId: string;
  readonly descriptor: ParameterDescriptor;
  /** Preset value */
  presetValue: number;
  /** Live override value */
  liveValue: number | null;
  /** Automation stream ID */
  automationStreamId: EventStreamId | null;
  /** Modulation sources */
  modulationSources: ModulationSource[];
  /** MIDI CC mapping */
  midiMapping: MidiCcMapping | null;
}

/**
 * Callback for parameter changes.
 */
export type ParameterChangeCallback = (
  cardId: string,
  paramId: string,
  resolved: ResolvedParameter
) => void;

// ============================================================================
// PARAMETER RESOLVER
// ============================================================================

/**
 * ParameterResolver manages parameter values from multiple sources.
 */
export interface ParameterResolver {
  /**
   * Registers a parameter.
   */
  registerParameter(
    cardId: string,
    paramId: string,
    descriptor: ParameterDescriptor
  ): void;
  
  /**
   * Unregisters a parameter.
   */
  unregisterParameter(cardId: string, paramId: string): void;
  
  /**
   * Gets parameter descriptor.
   */
  getDescriptor(cardId: string, paramId: string): ParameterDescriptor | undefined;
  
  /**
   * Resolves parameter value at a specific tick.
   */
  resolveValue(cardId: string, paramId: string, tick: Tick): ResolvedParameter | undefined;
  
  /**
   * Resolves parameter value at current time.
   */
  resolveCurrentValue(cardId: string, paramId: string): ResolvedParameter | undefined;
  
  /**
   * Sets preset value.
   */
  setPresetValue(cardId: string, paramId: string, value: number): void;
  
  /**
   * Sets live override value.
   */
  setLiveValue(cardId: string, paramId: string, value: number | null): void;
  
  /**
   * Gets live override value.
   */
  getLiveValue(cardId: string, paramId: string): number | null;
  
  /**
   * Clears all live overrides for a card.
   */
  clearLiveValues(cardId: string): void;
  
  /**
   * Sets automation stream.
   */
  setAutomationStream(cardId: string, paramId: string, streamId: EventStreamId | null): void;
  
  /**
   * Adds modulation source.
   */
  addModulationSource(cardId: string, paramId: string, source: ModulationSource): void;
  
  /**
   * Removes modulation source.
   */
  removeModulationSource(cardId: string, paramId: string, sourceId: string): void;
  
  /**
   * Updates modulation source value.
   */
  updateModulationValue(sourceId: string, value: number): void;
  
  /**
   * Sets MIDI CC mapping.
   */
  setMidiMapping(cardId: string, paramId: string, mapping: MidiCcMapping | null): void;
  
  /**
   * Updates MIDI CC value.
   */
  updateMidiCcValue(channel: number, cc: number, value: number): void;
  
  /**
   * Enters MIDI learn mode.
   */
  startMidiLearn(cardId: string, paramId: string): void;

  /**
   * Exits MIDI learn mode.
   */
  stopMidiLearn(): void;

  /**
   * Gets current MIDI learn target.
   */
  getMidiLearnTarget(): { cardId: string; paramId: string } | null;

  /**
   * Sets MIDI learn mode for a parameter path.
   * @deprecated Use startMidiLearn instead
   */
  setMidiLearnMode(parameterPath: string): void;

  /**
   * Cancels MIDI learn mode.
   * @deprecated Use stopMidiLearn instead
   */
  cancelMidiLearnMode(): void;

  /**
   * Completes MIDI learn with captured CC.
   */
  completeMidiLearn(channel: number, cc: number | undefined): void;

  /**
   * Sets MIDI-controlled parameter value.
   */
  setMidiValue(parameterPath: string, normalizedValue: number, channel: number, cc?: number): void;
  
  /**
   * Subscribes to parameter changes.
   */
  subscribe(callback: ParameterChangeCallback): SubscriptionId;
  
  /**
   * Unsubscribes from parameter changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;
  
  /**
   * Gets all registered parameters for a card.
   */
  getCardParameters(cardId: string): readonly ParameterRegistration[];
  
  /**
   * Gets all registered cards.
   */
  getRegisteredCards(): readonly string[];
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates a ParameterResolver.
 */
export function createParameterResolver(): ParameterResolver {
  const parameters = new Map<string, ParameterRegistration>();
  const subscriptions = new Map<SubscriptionId, ParameterChangeCallback>();
  const modulationValues = new Map<string, number>();
  let midiLearnTarget: { cardId: string; paramId: string } | null = null;
  let currentTick: Tick = 0 as Tick;

  function getKey(cardId: string, paramId: string): string {
    return `${cardId}:${paramId}`;
  }

  function notify(cardId: string, paramId: string, resolved: ResolvedParameter): void {
    for (const callback of subscriptions.values()) {
      try {
        callback(cardId, paramId, resolved);
      } catch (e) {
        console.error('Parameter callback error:', e);
      }
    }
  }

  function clampValue(value: number, descriptor: ParameterDescriptor): number {
    return Math.max(descriptor.min, Math.min(descriptor.max, value));
  }

  function getAutomationValue(streamId: EventStreamId, tick: Tick): number | null {
    const store = getSharedEventStore();
    const events = store.getStream(streamId)?.events ?? [];
    if (events.length === 0) return null;

    type AutomationPoint = { tick: Tick; value: number; curve: string | undefined };

    // Find automation points
    const points = events
      .map((e): AutomationPoint | null => {
        const value = (e.payload as { value?: unknown }).value;
        if (typeof value !== 'number') return null;
        const curve = (e.payload as { curve?: unknown }).curve;
        return {
          tick: e.start as Tick,
          value,
          curve: typeof curve === 'string' ? curve : undefined,
        };
      })
      .filter((p): p is AutomationPoint => p !== null)
      .sort((a, b) => (a.tick as number) - (b.tick as number));

    if (points.length === 0) return null;

    // Find surrounding points
    const first = points[0];
    if (!first) return null;
    let before = first;
    let after: typeof before | null = null;

    for (const point of points) {
      if ((point.tick as number) <= (tick as number)) {
        before = point;
      } else {
        after = point;
        break;
      }
    }

    // If no point after, return last value
    if (!after) return before.value;

    // Interpolate based on curve
    const t = ((tick as number) - (before.tick as number)) / 
              ((after.tick as number) - (before.tick as number));

    switch (before.curve) {
      case 'hold':
        return before.value;
      case 'exponential':
        return before.value + (after.value - before.value) * (t * t);
      case 'linear':
      default:
        return before.value + (after.value - before.value) * t;
    }
  }

  const resolver: ParameterResolver = {
    registerParameter(
      cardId: string,
      paramId: string,
      descriptor: ParameterDescriptor
    ): void {
      const key = getKey(cardId, paramId);
      parameters.set(key, {
        cardId,
        paramId,
        descriptor,
        presetValue: descriptor.default,
        liveValue: null,
        automationStreamId: null,
        modulationSources: [],
        midiMapping: null,
      });
    },

    unregisterParameter(cardId: string, paramId: string): void {
      const key = getKey(cardId, paramId);
      parameters.delete(key);
    },

    getDescriptor(cardId: string, paramId: string): ParameterDescriptor | undefined {
      const key = getKey(cardId, paramId);
      return parameters.get(key)?.descriptor;
    },

    resolveValue(cardId: string, paramId: string, tick: Tick): ResolvedParameter | undefined {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return undefined;

      const { descriptor } = reg;

      // 1. Check live override (highest priority)
      if (reg.liveValue !== null) {
        return {
          value: clampValue(reg.liveValue, descriptor),
          source: 'live',
          baseValue: reg.liveValue,
          modulationAmount: 0,
        };
      }

      // Start with base value
      let baseValue = reg.presetValue;
      let source: ParameterSource = 'preset';

      // 2. Check MIDI CC
      if (reg.midiMapping) {
        const ccNormalized = reg.midiMapping.value / 127;
        const range = reg.midiMapping.max - reg.midiMapping.min;
        baseValue = reg.midiMapping.min + ccNormalized * range;
        source = 'midi';
      }

      // 3. Check automation
      if (reg.automationStreamId) {
        const autoValue = getAutomationValue(reg.automationStreamId, tick);
        if (autoValue !== null) {
          baseValue = autoValue;
          source = 'automation';
        }
      }

      // 4. Apply modulation
      let modulationAmount = 0;
      for (const mod of reg.modulationSources) {
        const modValue = modulationValues.get(mod.id) ?? mod.value;
        modulationAmount += modValue * mod.amount;
      }

      if (modulationAmount !== 0) {
        const range = descriptor.max - descriptor.min;
        const modulatedValue = baseValue + modulationAmount * range;
        return {
          value: clampValue(modulatedValue, descriptor),
          source: 'modulation',
          baseValue,
          modulationAmount,
        };
      }

      return {
        value: clampValue(baseValue, descriptor),
        source,
        baseValue,
        modulationAmount: 0,
      };
    },

    resolveCurrentValue(cardId: string, paramId: string): ResolvedParameter | undefined {
      return resolver.resolveValue(cardId, paramId, currentTick);
    },

    setPresetValue(cardId: string, paramId: string, value: number): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, { ...reg, presetValue: value });

      const resolved = resolver.resolveCurrentValue(cardId, paramId);
      if (resolved) notify(cardId, paramId, resolved);
    },

    setLiveValue(cardId: string, paramId: string, value: number | null): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, { ...reg, liveValue: value });

      const resolved = resolver.resolveCurrentValue(cardId, paramId);
      if (resolved) notify(cardId, paramId, resolved);
    },

    getLiveValue(cardId: string, paramId: string): number | null {
      const key = getKey(cardId, paramId);
      return parameters.get(key)?.liveValue ?? null;
    },

    clearLiveValues(cardId: string): void {
      for (const [key, reg] of parameters) {
        if (reg.cardId === cardId && reg.liveValue !== null) {
          parameters.set(key, { ...reg, liveValue: null });
          const resolved = resolver.resolveCurrentValue(reg.cardId, reg.paramId);
          if (resolved) notify(reg.cardId, reg.paramId, resolved);
        }
      }
    },

    setAutomationStream(cardId: string, paramId: string, streamId: EventStreamId | null): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, { ...reg, automationStreamId: streamId });
    },

    addModulationSource(cardId: string, paramId: string, source: ModulationSource): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, {
        ...reg,
        modulationSources: [...reg.modulationSources, source],
      });
    },

    removeModulationSource(cardId: string, paramId: string, sourceId: string): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, {
        ...reg,
        modulationSources: reg.modulationSources.filter(s => s.id !== sourceId),
      });
    },

    updateModulationValue(sourceId: string, value: number): void {
      modulationValues.set(sourceId, value);

      // Notify affected parameters
      for (const reg of parameters.values()) {
        if (reg.modulationSources.some(s => s.id === sourceId)) {
          const resolved = resolver.resolveCurrentValue(reg.cardId, reg.paramId);
          if (resolved) notify(reg.cardId, reg.paramId, resolved);
        }
      }
    },

    setMidiMapping(cardId: string, paramId: string, mapping: MidiCcMapping | null): void {
      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      parameters.set(key, { ...reg, midiMapping: mapping });
    },

    updateMidiCcValue(channel: number, cc: number, value: number): void {
      // Check if we're in learn mode
      if (midiLearnTarget) {
        const key = getKey(midiLearnTarget.cardId, midiLearnTarget.paramId);
        const reg = parameters.get(key);
        if (reg) {
          parameters.set(key, {
            ...reg,
            midiMapping: {
              channel,
              cc,
              min: reg.descriptor.min,
              max: reg.descriptor.max,
              value,
            },
          });
        }
        midiLearnTarget = null;
        return;
      }

      // Update existing mappings
      for (const [key, reg] of parameters) {
        if (reg.midiMapping && 
            reg.midiMapping.channel === channel && 
            reg.midiMapping.cc === cc) {
          const updatedMapping = { ...reg.midiMapping, value };
          parameters.set(key, { ...reg, midiMapping: updatedMapping });

          const resolved = resolver.resolveCurrentValue(reg.cardId, reg.paramId);
          if (resolved) notify(reg.cardId, reg.paramId, resolved);
        }
      }
    },

    startMidiLearn(cardId: string, paramId: string): void {
      midiLearnTarget = { cardId, paramId };
    },

    stopMidiLearn(): void {
      midiLearnTarget = null;
    },

    getMidiLearnTarget(): { cardId: string; paramId: string } | null {
      return midiLearnTarget;
    },

    setMidiLearnMode(parameterPath: string): void {
      const [cardId, paramId] = parameterPath.split(':');
      if (!cardId || !paramId) return;
      resolver.startMidiLearn(cardId, paramId);
    },

    cancelMidiLearnMode(): void {
      resolver.stopMidiLearn();
    },

    completeMidiLearn(channel: number, cc: number | undefined): void {
      if (!midiLearnTarget) return;
      if (cc === undefined) {
        midiLearnTarget = null;
        return;
      }
      resolver.updateMidiCcValue(channel, cc, 0);
    },

    setMidiValue(parameterPath: string, normalizedValue: number, channel: number, cc?: number): void {
      const [cardId, paramId] = parameterPath.split(':');
      if (!cardId || !paramId) return;

      const key = getKey(cardId, paramId);
      const reg = parameters.get(key);
      if (!reg) return;

      const value = Math.round(Math.max(0, Math.min(1, normalizedValue)) * 127);
      const targetCc = cc ?? reg.midiMapping?.cc;
      if (targetCc === undefined) return;

      parameters.set(key, {
        ...reg,
        midiMapping: {
          channel,
          cc: targetCc,
          min: reg.descriptor.min,
          max: reg.descriptor.max,
          value,
        },
      });

      const resolved = resolver.resolveCurrentValue(cardId, paramId);
      if (resolved) notify(cardId, paramId, resolved);
    },

    subscribe(callback: ParameterChangeCallback): SubscriptionId {
      const id = generateSubscriptionId();
      subscriptions.set(id, callback);
      return id;
    },

    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return subscriptions.delete(subscriptionId);
    },

    getCardParameters(cardId: string): readonly ParameterRegistration[] {
      return Array.from(parameters.values()).filter(p => p.cardId === cardId);
    },

    getRegisteredCards(): readonly string[] {
      const cards = new Set<string>();
      for (const reg of parameters.values()) {
        cards.add(reg.cardId);
      }
      return Array.from(cards);
    },
  };

  return resolver;
}

// ============================================================================
// SINGLETON
// ============================================================================

let _resolver: ParameterResolver | null = null;

/**
 * Gets the shared parameter resolver singleton.
 */
export function getParameterResolver(): ParameterResolver {
  if (!_resolver) {
    _resolver = createParameterResolver();
  }
  return _resolver;
}

/**
 * Resets the parameter resolver (for testing).
 */
export function resetParameterResolver(): void {
  _resolver = null;
}
