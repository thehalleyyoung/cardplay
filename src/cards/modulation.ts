/**
 * @fileoverview Modulation Routing System.
 * 
 * Provides modulation routing between sources (LFO, envelope, MIDI CC, expression, 
 * cross-card) and target parameters with depth, polarity, and real-time processing.
 * 
 * @module @cardplay/core/cards/modulation
 */

import type { Parameter, FloatParameter, IntParameter } from './parameters';

// ============================================================================
// MODULATION SOURCE TYPES
// ============================================================================

/**
 * Types of modulation sources.
 */
export type ModulationSourceType = 
  | 'lfo'
  | 'envelope'
  | 'midi-cc'
  | 'expression'
  | 'cross-card'
  | 'macro'
  | 'random'
  | 'step-sequencer'
  | 'follower'
  | 'manual';

/**
 * LFO waveform shapes.
 */
export type LfoWaveform = 
  | 'sine'
  | 'triangle'
  | 'sawtooth'
  | 'reverse-sawtooth'
  | 'square'
  | 'pulse'
  | 'random'
  | 'sample-hold'
  | 'smooth-random';

/**
 * LFO sync modes.
 */
export type LfoSyncMode = 'free' | 'tempo' | 'key';

/**
 * Tempo-synced rate values.
 */
export type LfoTempoRate = 
  | '8/1' | '4/1' | '2/1' | '1/1'
  | '1/2' | '1/2T' | '1/2D'
  | '1/4' | '1/4T' | '1/4D'
  | '1/8' | '1/8T' | '1/8D'
  | '1/16' | '1/16T' | '1/16D'
  | '1/32' | '1/32T' | '1/32D'
  | '1/64';

// ============================================================================
// LFO SOURCE
// ============================================================================

/**
 * LFO modulation source configuration.
 */
export interface LfoSource {
  readonly type: 'lfo';
  readonly id: string;
  readonly name: string;
  /** Waveform shape */
  readonly waveform: LfoWaveform;
  /** Sync mode */
  readonly syncMode: LfoSyncMode;
  /** Rate in Hz (when free-running) */
  readonly rateHz: number;
  /** Tempo-synced rate */
  readonly tempoRate: LfoTempoRate;
  /** Phase offset (0-1) */
  readonly phase: number;
  /** Fade-in time in seconds */
  readonly fadeIn: number;
  /** Pulse width for pulse waveform (0-1) */
  readonly pulseWidth: number;
  /** Whether LFO is bipolar (-1 to +1) or unipolar (0 to +1) */
  readonly bipolar: boolean;
  /** Smooth/slew rate for S&H and random */
  readonly smooth: number;
}

/**
 * Creates an LFO source with defaults.
 */
export function createLfoSource(options: Partial<LfoSource> & { id: string; name?: string }): LfoSource {
  return Object.freeze({
    type: 'lfo' as const,
    id: options.id,
    name: options.name ?? `LFO ${options.id}`,
    waveform: options.waveform ?? 'sine',
    syncMode: options.syncMode ?? 'free',
    rateHz: options.rateHz ?? 1,
    tempoRate: options.tempoRate ?? '1/4',
    phase: options.phase ?? 0,
    fadeIn: options.fadeIn ?? 0,
    pulseWidth: options.pulseWidth ?? 0.5,
    bipolar: options.bipolar ?? true,
    smooth: options.smooth ?? 0,
  });
}

/**
 * Calculate LFO value at given phase.
 */
export function calculateLfoValue(lfo: LfoSource, phase: number): number {
  const normalizedPhase = ((phase + lfo.phase) % 1 + 1) % 1;
  let value: number;
  
  switch (lfo.waveform) {
    case 'sine':
      value = Math.sin(normalizedPhase * Math.PI * 2);
      break;
    case 'triangle':
      value = normalizedPhase < 0.5
        ? normalizedPhase * 4 - 1
        : 3 - normalizedPhase * 4;
      break;
    case 'sawtooth':
      value = normalizedPhase * 2 - 1;
      break;
    case 'reverse-sawtooth':
      value = 1 - normalizedPhase * 2;
      break;
    case 'square':
      value = normalizedPhase < 0.5 ? 1 : -1;
      break;
    case 'pulse':
      value = normalizedPhase < lfo.pulseWidth ? 1 : -1;
      break;
    case 'random':
    case 'sample-hold':
      // Deterministic pseudo-random based on phase
      value = Math.sin(normalizedPhase * 12.9898 + 78.233) * 43758.5453;
      value = (value - Math.floor(value)) * 2 - 1;
      break;
    case 'smooth-random':
      // Smooth interpolated random
      const floor = Math.floor(normalizedPhase * 10);
      const frac = normalizedPhase * 10 - floor;
      const v1 = Math.sin(floor * 12.9898 + 78.233) * 43758.5453;
      const v2 = Math.sin((floor + 1) * 12.9898 + 78.233) * 43758.5453;
      const r1 = (v1 - Math.floor(v1)) * 2 - 1;
      const r2 = (v2 - Math.floor(v2)) * 2 - 1;
      // Smoothstep interpolation
      const t = frac * frac * (3 - 2 * frac);
      value = r1 + (r2 - r1) * t;
      break;
    default:
      value = 0;
  }
  
  // Convert to unipolar if needed
  if (!lfo.bipolar) {
    value = (value + 1) / 2;
  }
  
  return value;
}

// ============================================================================
// ENVELOPE SOURCE
// ============================================================================

/**
 * Envelope curve types.
 */
export type EnvelopeCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve';

/**
 * Envelope modulation source configuration.
 */
export interface EnvelopeSource {
  readonly type: 'envelope';
  readonly id: string;
  readonly name: string;
  /** Attack time in seconds */
  readonly attack: number;
  /** Decay time in seconds */
  readonly decay: number;
  /** Sustain level (0-1) */
  readonly sustain: number;
  /** Release time in seconds */
  readonly release: number;
  /** Attack curve */
  readonly attackCurve: EnvelopeCurve;
  /** Decay curve */
  readonly decayCurve: EnvelopeCurve;
  /** Release curve */
  readonly releaseCurve: EnvelopeCurve;
  /** Whether envelope is bipolar */
  readonly bipolar: boolean;
  /** Velocity sensitivity (0-1) */
  readonly velocitySensitivity: number;
  /** Key tracking amount (-1 to +1) */
  readonly keyTracking: number;
}

/**
 * Creates an envelope source with ADSR defaults.
 */
export function createEnvelopeSource(options: Partial<EnvelopeSource> & { id: string; name?: string }): EnvelopeSource {
  return Object.freeze({
    type: 'envelope' as const,
    id: options.id,
    name: options.name ?? `Envelope ${options.id}`,
    attack: options.attack ?? 0.01,
    decay: options.decay ?? 0.1,
    sustain: options.sustain ?? 0.7,
    release: options.release ?? 0.3,
    attackCurve: options.attackCurve ?? 'exponential',
    decayCurve: options.decayCurve ?? 'exponential',
    releaseCurve: options.releaseCurve ?? 'exponential',
    bipolar: options.bipolar ?? false,
    velocitySensitivity: options.velocitySensitivity ?? 1,
    keyTracking: options.keyTracking ?? 0,
  });
}

/**
 * Envelope stage.
 */
export type EnvelopeStage = 'idle' | 'attack' | 'decay' | 'sustain' | 'release';

/**
 * Envelope state for per-voice tracking.
 */
export interface EnvelopeState {
  readonly stage: EnvelopeStage;
  readonly value: number;
  readonly startTime: number;
  readonly releaseStartValue: number;
  readonly velocity: number;
}

/**
 * Creates initial envelope state.
 */
export function createEnvelopeState(): EnvelopeState {
  return Object.freeze({
    stage: 'idle' as const,
    value: 0,
    startTime: 0,
    releaseStartValue: 0,
    velocity: 1,
  });
}

/**
 * Trigger envelope (note on).
 */
export function triggerEnvelope(state: EnvelopeState, time: number, velocity: number): EnvelopeState {
  return Object.freeze({
    stage: 'attack' as const,
    value: state.value,
    startTime: time,
    releaseStartValue: 0,
    velocity,
  });
}

/**
 * Release envelope (note off).
 */
export function releaseEnvelope(state: EnvelopeState, time: number): EnvelopeState {
  if (state.stage === 'idle' || state.stage === 'release') {
    return state;
  }
  return Object.freeze({
    stage: 'release' as const,
    value: state.value,
    startTime: time,
    releaseStartValue: state.value,
    velocity: state.velocity,
  });
}

/**
 * Apply curve to time value.
 */
function applyCurve(t: number, curve: EnvelopeCurve, isDecay: boolean): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (curve) {
    case 'linear':
      return clamped;
    case 'exponential':
      return isDecay ? Math.pow(clamped, 3) : 1 - Math.pow(1 - clamped, 3);
    case 'logarithmic':
      return isDecay ? 1 - Math.pow(1 - clamped, 3) : Math.pow(clamped, 3);
    case 's-curve':
      return clamped * clamped * (3 - 2 * clamped);
    default:
      return clamped;
  }
}

/**
 * Process envelope at given time.
 */
export function processEnvelope(
  env: EnvelopeSource,
  state: EnvelopeState,
  currentTime: number
): EnvelopeState {
  const elapsed = currentTime - state.startTime;
  let value: number;
  let stage = state.stage;
  
  switch (state.stage) {
    case 'idle':
      return state;
      
    case 'attack': {
      if (elapsed >= env.attack) {
        // Move to decay
        stage = 'decay';
        value = 1;
      } else {
        const t = elapsed / env.attack;
        value = applyCurve(t, env.attackCurve, false);
      }
      break;
    }
    
    case 'decay': {
      const decayElapsed = elapsed - env.attack;
      if (decayElapsed >= env.decay) {
        stage = 'sustain';
        value = env.sustain;
      } else {
        const t = decayElapsed / env.decay;
        const curved = applyCurve(t, env.decayCurve, true);
        value = 1 - curved * (1 - env.sustain);
      }
      break;
    }
    
    case 'sustain':
      value = env.sustain;
      break;
      
    case 'release': {
      if (elapsed >= env.release) {
        return Object.freeze({
          stage: 'idle' as const,
          value: 0,
          startTime: 0,
          releaseStartValue: 0,
          velocity: state.velocity,
        });
      }
      const t = elapsed / env.release;
      const curved = applyCurve(t, env.releaseCurve, true);
      value = state.releaseStartValue * (1 - curved);
      break;
    }
    
    default:
      value = 0;
  }
  
  // Apply velocity
  value *= state.velocity * env.velocitySensitivity + (1 - env.velocitySensitivity);
  
  // Convert to bipolar if needed
  if (env.bipolar) {
    value = value * 2 - 1;
  }
  
  if (value === state.value && stage === state.stage) {
    return state;
  }
  
  return Object.freeze({
    ...state,
    stage,
    value,
    startTime: stage !== state.stage ? currentTime : state.startTime,
  });
}

// ============================================================================
// MIDI CC SOURCE
// ============================================================================

/**
 * MIDI CC modulation source.
 */
export interface MidiCcSource {
  readonly type: 'midi-cc';
  readonly id: string;
  readonly name: string;
  /** CC number (0-127) */
  readonly ccNumber: number;
  /** MIDI channel (0-15, or -1 for omni) */
  readonly channel: number;
  /** Default value when no CC received */
  readonly defaultValue: number;
  /** Whether to invert the CC value */
  readonly invert: boolean;
  /** Smoothing time in ms */
  readonly smoothing: number;
  /** Whether CC is bipolar (center at 64) */
  readonly bipolar: boolean;
}

/**
 * Creates a MIDI CC source.
 */
export function createMidiCcSource(options: Partial<MidiCcSource> & { id: string; ccNumber: number }): MidiCcSource {
  return Object.freeze({
    type: 'midi-cc' as const,
    id: options.id,
    name: options.name ?? `CC ${options.ccNumber}`,
    ccNumber: options.ccNumber,
    channel: options.channel ?? -1,
    defaultValue: options.defaultValue ?? 0,
    invert: options.invert ?? false,
    smoothing: options.smoothing ?? 0,
    bipolar: options.bipolar ?? false,
  });
}

/**
 * Process MIDI CC value.
 */
export function processMidiCc(source: MidiCcSource, ccValue: number): number {
  let value = ccValue / 127;
  
  if (source.invert) {
    value = 1 - value;
  }
  
  if (source.bipolar) {
    value = value * 2 - 1;
  }
  
  return value;
}

// ============================================================================
// EXPRESSION SOURCE (Per-Note)
// ============================================================================

/**
 * Expression source for MPE/per-note modulation.
 */
export interface ExpressionSource {
  readonly type: 'expression';
  readonly id: string;
  readonly name: string;
  /** Expression dimension */
  readonly dimension: 'pressure' | 'slide' | 'glide' | 'velocity' | 'release-velocity' | 'pitch-bend';
  /** Sensitivity (0-1) */
  readonly sensitivity: number;
  /** Curve type */
  readonly curve: 'linear' | 'exponential' | 'logarithmic';
  /** Whether to invert */
  readonly invert: boolean;
  /** Bipolar mode */
  readonly bipolar: boolean;
}

/**
 * Creates an expression source.
 */
export function createExpressionSource(
  options: Partial<ExpressionSource> & { id: string; dimension: ExpressionSource['dimension'] }
): ExpressionSource {
  return Object.freeze({
    type: 'expression' as const,
    id: options.id,
    name: options.name ?? options.dimension,
    dimension: options.dimension,
    sensitivity: options.sensitivity ?? 1,
    curve: options.curve ?? 'linear',
    invert: options.invert ?? false,
    bipolar: options.bipolar ?? options.dimension === 'pitch-bend',
  });
}

// ============================================================================
// CROSS-CARD SOURCE
// ============================================================================

/**
 * Cross-card modulation source (card output → card parameter).
 */
export interface CrossCardSource {
  readonly type: 'cross-card';
  readonly id: string;
  readonly name: string;
  /** Source card ID */
  readonly sourceCardId: string;
  /** Source output/parameter ID */
  readonly sourceOutputId: string;
  /** Lag/smoothing time in ms */
  readonly lag: number;
  /** Whether to use absolute value */
  readonly absolute: boolean;
  /** Bipolar mode */
  readonly bipolar: boolean;
}

/**
 * Creates a cross-card source.
 */
export function createCrossCardSource(
  options: Partial<CrossCardSource> & { id: string; sourceCardId: string; sourceOutputId: string }
): CrossCardSource {
  return Object.freeze({
    type: 'cross-card' as const,
    id: options.id,
    name: options.name ?? `${options.sourceCardId}.${options.sourceOutputId}`,
    sourceCardId: options.sourceCardId,
    sourceOutputId: options.sourceOutputId,
    lag: options.lag ?? 0,
    absolute: options.absolute ?? false,
    bipolar: options.bipolar ?? true,
  });
}

// ============================================================================
// MODULATION SOURCE UNION
// ============================================================================

/**
 * Union of all modulation source types.
 */
export type ModulationSource = 
  | LfoSource
  | EnvelopeSource
  | MidiCcSource
  | ExpressionSource
  | CrossCardSource;

// ============================================================================
// MODULATION ROUTING
// ============================================================================

/**
 * A single modulation routing from source to target.
 */
export interface ModulationRouting {
  /** Unique routing ID */
  readonly id: string;
  /** Source ID */
  readonly sourceId: string;
  /** Target parameter ID (cardId.paramId) */
  readonly targetId: string;
  /** Modulation depth (-1 to +1) */
  readonly amount: number;
  /** Whether modulation is bipolar (center at 0) */
  readonly bipolar: boolean;
  /** Whether routing is enabled */
  readonly enabled: boolean;
  /** Optional curve for amount scaling */
  readonly curve: 'linear' | 'exponential' | 'logarithmic';
  /** Via parameter (modulates the amount itself) */
  readonly viaSourceId?: string;
  /** Via amount (how much via modulates the depth) */
  readonly viaAmount?: number;
}

/**
 * Creates a modulation routing.
 */
export function createModulationRouting(
  options: Partial<ModulationRouting> & { id: string; sourceId: string; targetId: string }
): ModulationRouting {
  const routing: ModulationRouting = {
    id: options.id,
    sourceId: options.sourceId,
    targetId: options.targetId,
    amount: options.amount ?? 1,
    bipolar: options.bipolar ?? true,
    enabled: options.enabled ?? true,
    curve: options.curve ?? 'linear',
    ...(options.viaSourceId !== undefined && { viaSourceId: options.viaSourceId }),
    ...(options.viaAmount !== undefined && { viaAmount: options.viaAmount }),
  };
  return Object.freeze(routing);
}

/**
 * Update routing amount.
 */
export function setRoutingAmount(routing: ModulationRouting, amount: number): ModulationRouting {
  const clamped = Math.max(-1, Math.min(1, amount));
  if (clamped === routing.amount) return routing;
  return Object.freeze({ ...routing, amount: clamped });
}

/**
 * Toggle routing enabled state.
 */
export function toggleRouting(routing: ModulationRouting): ModulationRouting {
  return Object.freeze({ ...routing, enabled: !routing.enabled });
}

// ============================================================================
// MODULATION MATRIX
// ============================================================================

/**
 * Complete modulation matrix for a card or system.
 */
export interface ModulationMatrix {
  /** All sources by ID */
  readonly sources: ReadonlyMap<string, ModulationSource>;
  /** All routings by ID */
  readonly routings: ReadonlyMap<string, ModulationRouting>;
  /** Routings indexed by target for fast lookup */
  readonly byTarget: ReadonlyMap<string, readonly ModulationRouting[]>;
  /** Routings indexed by source */
  readonly bySource: ReadonlyMap<string, readonly ModulationRouting[]>;
}

/**
 * Creates an empty modulation matrix.
 */
export function createModulationMatrix(): ModulationMatrix {
  return Object.freeze({
    sources: new Map<string, ModulationSource>(),
    routings: new Map<string, ModulationRouting>(),
    byTarget: new Map<string, readonly ModulationRouting[]>(),
    bySource: new Map<string, readonly ModulationRouting[]>(),
  });
}

/**
 * Add a modulation source.
 */
export function addSource(matrix: ModulationMatrix, source: ModulationSource): ModulationMatrix {
  const sources = new Map(matrix.sources);
  sources.set(source.id, source);
  
  return Object.freeze({
    ...matrix,
    sources,
  });
}

/**
 * Remove a modulation source (and its routings).
 */
export function removeSource(matrix: ModulationMatrix, sourceId: string): ModulationMatrix {
  const sources = new Map(matrix.sources);
  sources.delete(sourceId);
  
  // Remove all routings that use this source - start with empty maps
  const routings = new Map<string, ModulationRouting>();
  const byTarget = new Map<string, ModulationRouting[]>();
  const bySource = new Map<string, ModulationRouting[]>();
  
  for (const [id, routing] of Array.from(matrix.routings)) {
    if (routing.sourceId === sourceId || routing.viaSourceId === sourceId) {
      // Skip routings that use the removed source
      continue;
    }
    // Keep this routing
    routings.set(id, routing);
    
    // Rebuild byTarget
    const targetRoutings = byTarget.get(routing.targetId) ?? [];
    byTarget.set(routing.targetId, [...targetRoutings, routing]);
    
    // Rebuild bySource
    const sourceRoutings = bySource.get(routing.sourceId) ?? [];
    bySource.set(routing.sourceId, [...sourceRoutings, routing]);
  }
  
  return Object.freeze({
    sources,
    routings,
    byTarget: new Map(Array.from(byTarget).map(([k, v]) => [k, Object.freeze(v)])),
    bySource: new Map(Array.from(bySource).map(([k, v]) => [k, Object.freeze(v)])),
  });
}

/**
 * Add a modulation routing.
 */
export function addRouting(matrix: ModulationMatrix, routing: ModulationRouting): ModulationMatrix {
  const routings = new Map(matrix.routings);
  routings.set(routing.id, routing);
  
  // Update byTarget
  const byTarget = new Map(matrix.byTarget);
  const targetRoutings = [...(matrix.byTarget.get(routing.targetId) ?? []), routing];
  byTarget.set(routing.targetId, Object.freeze(targetRoutings));
  
  // Update bySource
  const bySource = new Map(matrix.bySource);
  const sourceRoutings = [...(matrix.bySource.get(routing.sourceId) ?? []), routing];
  bySource.set(routing.sourceId, Object.freeze(sourceRoutings));
  
  return Object.freeze({
    ...matrix,
    routings,
    byTarget,
    bySource,
  });
}

/**
 * Remove a modulation routing.
 */
export function removeRouting(matrix: ModulationMatrix, routingId: string): ModulationMatrix {
  const routing = matrix.routings.get(routingId);
  if (!routing) return matrix;
  
  const routings = new Map(matrix.routings);
  routings.delete(routingId);
  
  // Update byTarget
  const byTarget = new Map(matrix.byTarget);
  const targetRoutings = (matrix.byTarget.get(routing.targetId) ?? []).filter(r => r.id !== routingId);
  if (targetRoutings.length === 0) {
    byTarget.delete(routing.targetId);
  } else {
    byTarget.set(routing.targetId, Object.freeze(targetRoutings));
  }
  
  // Update bySource
  const bySource = new Map(matrix.bySource);
  const sourceRoutings = (matrix.bySource.get(routing.sourceId) ?? []).filter(r => r.id !== routingId);
  if (sourceRoutings.length === 0) {
    bySource.delete(routing.sourceId);
  } else {
    bySource.set(routing.sourceId, Object.freeze(sourceRoutings));
  }
  
  return Object.freeze({
    ...matrix,
    routings,
    byTarget,
    bySource,
  });
}

/**
 * Get all routings for a target parameter.
 */
export function getRoutingsForTarget(matrix: ModulationMatrix, targetId: string): readonly ModulationRouting[] {
  return matrix.byTarget.get(targetId) ?? [];
}

/**
 * Get all routings from a source.
 */
export function getRoutingsFromSource(matrix: ModulationMatrix, sourceId: string): readonly ModulationRouting[] {
  return matrix.bySource.get(sourceId) ?? [];
}

// ============================================================================
// MODULATION PROCESSING
// ============================================================================

/**
 * Current modulation source values.
 */
export interface ModulationState {
  readonly sourceValues: ReadonlyMap<string, number>;
  readonly timestamp: number;
}

/**
 * Creates initial modulation state.
 */
export function createModulationState(): ModulationState {
  return Object.freeze({
    sourceValues: new Map<string, number>(),
    timestamp: 0,
  });
}

/**
 * Update source value in state.
 */
export function updateSourceValue(
  state: ModulationState,
  sourceId: string,
  value: number,
  timestamp: number
): ModulationState {
  const sourceValues = new Map(state.sourceValues);
  sourceValues.set(sourceId, value);
  
  return Object.freeze({
    sourceValues,
    timestamp,
  });
}

/**
 * Calculate modulated parameter value.
 */
export function calculateModulatedValue(
  baseValue: number,
  param: Parameter,
  routings: readonly ModulationRouting[],
  modState: ModulationState,
  _matrix: ModulationMatrix  // Reserved for future use
): number {
  if (routings.length === 0) return baseValue;
  
  let totalModulation = 0;
  
  for (const routing of routings) {
    if (!routing.enabled) continue;
    
    const sourceValue = modState.sourceValues.get(routing.sourceId) ?? 0;
    let modAmount = sourceValue * routing.amount;
    
    // Apply via modulation if present
    if (routing.viaSourceId && routing.viaAmount) {
      const viaValue = modState.sourceValues.get(routing.viaSourceId) ?? 0;
      modAmount *= Math.abs(viaValue) * routing.viaAmount;
    }
    
    // Apply curve
    if (routing.curve !== 'linear') {
      const sign = Math.sign(modAmount);
      const abs = Math.abs(modAmount);
      switch (routing.curve) {
        case 'exponential':
          modAmount = sign * abs * abs;
          break;
        case 'logarithmic':
          modAmount = sign * Math.sqrt(abs);
          break;
      }
    }
    
    totalModulation += modAmount;
  }
  
  // Calculate final value based on parameter type
  if (param.type === 'float' || param.type === 'int') {
    const floatParam = param as FloatParameter | IntParameter;
    const range = floatParam.max - floatParam.min;
    
    // Modulation affects the parameter within its range
    const modulated = baseValue + totalModulation * range;
    return Math.max(floatParam.min, Math.min(floatParam.max, modulated));
  }
  
  return baseValue;
}

/**
 * Process all modulation for a set of parameters.
 */
export function processModulation(
  params: readonly Parameter[],
  baseValues: ReadonlyMap<string, unknown>,
  matrix: ModulationMatrix,
  modState: ModulationState,
  cardId: string
): Map<string, unknown> {
  const result = new Map<string, unknown>();
  
  for (const param of params) {
    const targetId = `${cardId}.${param.id}`;
    const baseValue = baseValues.get(param.id) ?? param.default;
    const routings = getRoutingsForTarget(matrix, targetId);
    
    if (routings.length === 0 || typeof baseValue !== 'number') {
      result.set(param.id, baseValue);
      continue;
    }
    
    const modulated = calculateModulatedValue(
      baseValue as number,
      param,
      routings,
      modState,
      matrix
    );
    
    result.set(param.id, modulated);
  }
  
  return result;
}

// ============================================================================
// PRESET MODULATION CONFIGURATIONS
// ============================================================================

/**
 * Common LFO presets.
 */
export const LFO_PRESETS = {
  VIBRATO: createLfoSource({
    id: 'vibrato',
    name: 'Vibrato',
    waveform: 'sine',
    rateHz: 5,
    bipolar: true,
  }),
  TREMOLO: createLfoSource({
    id: 'tremolo',
    name: 'Tremolo',
    waveform: 'sine',
    rateHz: 4,
    bipolar: false,
  }),
  SLOW_SWEEP: createLfoSource({
    id: 'slow-sweep',
    name: 'Slow Sweep',
    waveform: 'triangle',
    rateHz: 0.1,
    bipolar: true,
  }),
  PWM: createLfoSource({
    id: 'pwm',
    name: 'PWM',
    waveform: 'triangle',
    rateHz: 0.5,
    bipolar: true,
  }),
  RANDOM_MOD: createLfoSource({
    id: 'random-mod',
    name: 'Random Mod',
    waveform: 'smooth-random',
    rateHz: 2,
    bipolar: true,
    smooth: 0.3,
  }),
  SYNCED_GATE: createLfoSource({
    id: 'synced-gate',
    name: 'Synced Gate',
    waveform: 'square',
    syncMode: 'tempo',
    tempoRate: '1/8',
    rateHz: 1,
    bipolar: false,
  }),
  AUTO_PAN: createLfoSource({
    id: 'auto-pan',
    name: 'Auto Pan',
    waveform: 'sine',
    rateHz: 0.25,
    bipolar: true,
    phase: 0.25,
  }),
  DUBSTEP_WOBBLE: createLfoSource({
    id: 'wobble',
    name: 'Wobble',
    waveform: 'sine',
    syncMode: 'tempo',
    tempoRate: '1/4',
    rateHz: 1,
    bipolar: true,
  }),
} as const;

/**
 * Common envelope presets.
 */
export const ENVELOPE_PRESETS = {
  PLUCK: createEnvelopeSource({
    id: 'pluck',
    name: 'Pluck',
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.1,
  }),
  PAD: createEnvelopeSource({
    id: 'pad',
    name: 'Pad',
    attack: 0.5,
    decay: 0.3,
    sustain: 0.8,
    release: 1.0,
  }),
  FILTER_SWEEP: createEnvelopeSource({
    id: 'filter-sweep',
    name: 'Filter Sweep',
    attack: 0.01,
    decay: 0.5,
    sustain: 0.2,
    release: 0.3,
    bipolar: false,
  }),
  SWELL: createEnvelopeSource({
    id: 'swell',
    name: 'Swell',
    attack: 1.0,
    decay: 0.5,
    sustain: 0.9,
    release: 2.0,
  }),
  PERCUSSIVE: createEnvelopeSource({
    id: 'percussive',
    name: 'Percussive',
    attack: 0.001,
    decay: 0.1,
    sustain: 0,
    release: 0.05,
  }),
} as const;
