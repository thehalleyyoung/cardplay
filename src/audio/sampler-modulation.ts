/**
 * @fileoverview Sampler Modulation Module - Envelopes, LFOs, and Mod Matrix
 * 
 * Provides comprehensive modulation for the sampler:
 * - AHDSR envelopes with curve shapes
 * - Multi-waveform LFOs with sync
 * - Modulation matrix with via modulation
 * - Macro knobs for multi-parameter control
 * - MPE (MIDI Polyphonic Expression) support
 * 
 * @module @cardplay/core/audio/sampler-modulation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum modulation matrix slots */
export const MAX_MOD_SLOTS = 32;

/** Maximum macro knobs */
export const MAX_MACROS = 8;

/** Maximum targets per macro */
export const MAX_MACRO_TARGETS = 16;

/** LFO rate range */
export const LFO_MIN_RATE = 0.01;
export const LFO_MAX_RATE = 50;

/** Envelope time range */
export const ENV_MIN_TIME = 0.001;
export const ENV_MAX_TIME = 30;

// ============================================================================
// TYPES - ENVELOPES
// ============================================================================

/**
 * Envelope curve shape.
 */
export type EnvelopeCurve = 'linear' | 'exponential' | 'logarithmic' | 'sCurve';

/**
 * AHDSR envelope parameters.
 */
export interface AHDSREnvelope {
  /** Attack time in seconds */
  attack: number;
  /** Hold time in seconds (at peak before decay) */
  hold: number;
  /** Decay time in seconds */
  decay: number;
  /** Sustain level 0-1 */
  sustain: number;
  /** Release time in seconds */
  release: number;
  /** Attack curve shape */
  attackCurve: EnvelopeCurve;
  /** Decay curve shape */
  decayCurve: EnvelopeCurve;
  /** Release curve shape */
  releaseCurve: EnvelopeCurve;
  /** Velocity sensitivity 0-1 (how much velocity affects envelope amount) */
  velocitySensitivity: number;
  /** Key tracking (positive = higher keys have faster envelopes) */
  keyTracking: number;
}

/**
 * Envelope state for real-time processing.
 */
export interface EnvelopeState {
  /** Current stage: 0=idle, 1=attack, 2=hold, 3=decay, 4=sustain, 5=release */
  stage: number;
  /** Current value 0-1 */
  value: number;
  /** Time in current stage (seconds) */
  stageTime: number;
  /** Value at start of current stage */
  startValue: number;
  /** Target value for current stage */
  targetValue: number;
  /** Is envelope active */
  active: boolean;
}

// ============================================================================
// TYPES - LFO
// ============================================================================

/**
 * LFO waveform type.
 */
export type LFOWaveform = 
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'sawDown'
  | 'square'
  | 'pulse25'
  | 'pulse10'
  | 'random'
  | 'sampleHold'
  | 'smoothRandom';

/**
 * LFO sync division.
 */
export type LFOSyncDivision = 
  | '8/1' | '4/1' | '2/1' | '1/1' | '1/2' | '1/2T' | '1/2D'
  | '1/4' | '1/4T' | '1/4D' | '1/8' | '1/8T' | '1/8D'
  | '1/16' | '1/16T' | '1/16D' | '1/32' | '1/32T' | '1/64';

/**
 * LFO parameters.
 */
export interface LFOParams {
  /** Waveform type */
  waveform: LFOWaveform;
  /** Rate in Hz (when not synced) */
  rate: number;
  /** Tempo sync enabled */
  tempoSync: boolean;
  /** Sync division (when synced) */
  syncDivision: LFOSyncDivision;
  /** Depth/amount 0-1 */
  depth: number;
  /** Phase offset 0-1 (0 = 0°, 0.5 = 180°) */
  phase: number;
  /** Delay before LFO starts (seconds) */
  delay: number;
  /** Fade-in time (seconds) */
  fadeIn: number;
  /** Key trigger mode (true = restart on note, false = free-running) */
  keyTrigger: boolean;
  /** Polarity: 'bipolar' (-1 to 1) or 'unipolar' (0 to 1) */
  polarity: 'bipolar' | 'unipolar';
}

/**
 * LFO state for real-time processing.
 */
export interface LFOState {
  /** Current phase 0-1 */
  phase: number;
  /** Current output value */
  value: number;
  /** Delay countdown (seconds remaining) */
  delayRemaining: number;
  /** Fade-in progress 0-1 */
  fadeProgress: number;
  /** Last sample-hold value */
  sampleHoldValue: number;
  /** Smooth random target */
  smoothTarget: number;
}

// ============================================================================
// TYPES - MODULATION MATRIX
// ============================================================================

/**
 * Modulation source.
 */
export type ModSource =
  // Envelopes
  | 'ampEnv'
  | 'filterEnv'
  | 'modEnv'
  | 'pitchEnv'
  // LFOs
  | 'lfo1'
  | 'lfo2'
  | 'lfo3'
  | 'lfo4'
  // MIDI/Performance
  | 'velocity'
  | 'keytrack'
  | 'aftertouch'
  | 'modWheel'
  | 'pitchBend'
  | 'expression'
  // MPE
  | 'mpeSlide'
  | 'mpePressure'
  | 'mpeTimbre'
  // Macros
  | 'macro1' | 'macro2' | 'macro3' | 'macro4'
  | 'macro5' | 'macro6' | 'macro7' | 'macro8'
  // Random/Time
  | 'random'
  | 'noteOnRandom'
  | 'voiceIndex'
  // Constant
  | 'constant';

/**
 * Modulation destination.
 */
export type ModDestination =
  // Pitch
  | 'pitch'
  | 'pitchFine'
  // Amplitude
  | 'volume'
  | 'pan'
  // Sample
  | 'sampleStart'
  | 'loopStart'
  | 'loopEnd'
  // Filter
  | 'filterCutoff'
  | 'filterResonance'
  | 'filterDrive'
  // LFO modulation
  | 'lfo1Rate' | 'lfo1Depth'
  | 'lfo2Rate' | 'lfo2Depth'
  | 'lfo3Rate' | 'lfo3Depth'
  | 'lfo4Rate' | 'lfo4Depth'
  // Envelope modulation
  | 'ampEnvAttack' | 'ampEnvDecay' | 'ampEnvSustain' | 'ampEnvRelease'
  | 'filterEnvAttack' | 'filterEnvDecay' | 'filterEnvSustain' | 'filterEnvRelease'
  | 'filterEnvAmount'
  // Effects
  | 'effectMix'
  | 'effectParam1'
  | 'effectParam2';

/**
 * Modulation matrix slot.
 */
export interface ModSlot {
  /** Slot ID */
  id: string;
  /** Source */
  source: ModSource;
  /** Destination */
  destination: ModDestination;
  /** Amount (-1 to 1) */
  amount: number;
  /** Via modulator (optional second source that scales the amount) */
  via: ModSource | null;
  /** Via amount (-1 to 1) */
  viaAmount: number;
  /** Slot enabled */
  enabled: boolean;
}

/**
 * Macro knob target.
 */
export interface MacroTarget {
  /** Parameter to control */
  destination: ModDestination;
  /** Min value when macro at 0 */
  min: number;
  /** Max value when macro at 1 */
  max: number;
  /** Curve type */
  curve: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * Macro knob configuration.
 */
export interface MacroConfig {
  /** Macro ID (1-8) */
  id: number;
  /** Display name */
  name: string;
  /** Current value 0-1 */
  value: number;
  /** Default value */
  defaultValue: number;
  /** Targets controlled by this macro */
  targets: MacroTarget[];
}

// ============================================================================
// TYPES - MPE
// ============================================================================

/**
 * MPE zone configuration.
 */
export interface MPEZone {
  /** Master channel (1 or 16 for lower/upper zone) */
  masterChannel: 1 | 16;
  /** Number of member channels */
  memberChannels: number;
  /** Pitch bend range in semitones */
  pitchBendRange: number;
}

/**
 * MPE voice state.
 */
export interface MPEVoiceState {
  /** Channel for this voice */
  channel: number;
  /** Per-note pitch bend */
  pitchBend: number;
  /** Slide (CC74) */
  slide: number;
  /** Pressure (channel aftertouch) */
  pressure: number;
}

// ============================================================================
// ENVELOPE FUNCTIONS
// ============================================================================

/**
 * Create default AHDSR envelope.
 */
export function createDefaultEnvelope(type: 'amp' | 'filter' | 'mod' | 'pitch' = 'amp'): AHDSREnvelope {
  switch (type) {
    case 'amp':
      return {
        attack: 0.005,
        hold: 0,
        decay: 0.1,
        sustain: 1,
        release: 0.3,
        attackCurve: 'linear',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
        velocitySensitivity: 0.5,
        keyTracking: 0,
      };
    case 'filter':
      return {
        attack: 0.01,
        hold: 0,
        decay: 0.3,
        sustain: 0.3,
        release: 0.2,
        attackCurve: 'linear',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
        velocitySensitivity: 0.7,
        keyTracking: 0,
      };
    case 'mod':
      return {
        attack: 0.1,
        hold: 0,
        decay: 0.5,
        sustain: 0,
        release: 0.3,
        attackCurve: 'linear',
        decayCurve: 'linear',
        releaseCurve: 'linear',
        velocitySensitivity: 0,
        keyTracking: 0,
      };
    case 'pitch':
      return {
        attack: 0,
        hold: 0,
        decay: 0.1,
        sustain: 0,
        release: 0,
        attackCurve: 'linear',
        decayCurve: 'exponential',
        releaseCurve: 'linear',
        velocitySensitivity: 0,
        keyTracking: 0,
      };
  }
}

/**
 * Create initial envelope state.
 */
export function createEnvelopeState(): EnvelopeState {
  return {
    stage: 0,
    value: 0,
    stageTime: 0,
    startValue: 0,
    targetValue: 0,
    active: false,
  };
}

/**
 * Apply curve to linear value (0-1).
 */
export function applyCurve(value: number, curve: EnvelopeCurve): number {
  const clamped = Math.max(0, Math.min(1, value));
  
  switch (curve) {
    case 'linear':
      return clamped;
    case 'exponential':
      return clamped * clamped;
    case 'logarithmic':
      return Math.sqrt(clamped);
    case 'sCurve':
      return clamped * clamped * (3 - 2 * clamped);
  }
}

/**
 * Process envelope for one sample.
 */
export function processEnvelope(
  state: EnvelopeState,
  env: AHDSREnvelope,
  sampleRate: number,
  noteOn: boolean,
  velocity: number = 1,
  keyOffset: number = 0
): EnvelopeState {
  const dt = 1 / sampleRate;
  let { stage, value, stageTime, startValue, targetValue, active } = state;
  
  // Apply key tracking to times
  const keyFactor = 1 + env.keyTracking * keyOffset / 127;
  const adjustedAttack = Math.max(ENV_MIN_TIME, env.attack * keyFactor);
  const adjustedDecay = Math.max(ENV_MIN_TIME, env.decay * keyFactor);
  const adjustedRelease = Math.max(ENV_MIN_TIME, env.release * keyFactor);
  
  // Apply velocity sensitivity
  const velAmount = 1 - env.velocitySensitivity + env.velocitySensitivity * velocity;
  
  // Handle note off -> release
  if (!noteOn && stage !== 0 && stage !== 5) {
    stage = 5; // Release
    stageTime = 0;
    startValue = value;
    targetValue = 0;
  }
  
  // Handle note on -> attack
  if (noteOn && (stage === 0 || stage === 5)) {
    stage = 1; // Attack
    stageTime = 0;
    startValue = value;
    targetValue = velAmount;
    active = true;
  }
  
  // Process current stage
  stageTime += dt;
  
  switch (stage) {
    case 1: // Attack
      if (stageTime >= adjustedAttack) {
        value = targetValue;
        stage = 2; // Hold
        stageTime = 0;
        startValue = value;
      } else {
        const progress = stageTime / adjustedAttack;
        value = startValue + (targetValue - startValue) * applyCurve(progress, env.attackCurve);
      }
      break;
      
    case 2: // Hold
      if (stageTime >= env.hold) {
        stage = 3; // Decay
        stageTime = 0;
        startValue = value;
        targetValue = env.sustain * velAmount;
      }
      break;
      
    case 3: // Decay
      if (stageTime >= adjustedDecay) {
        value = targetValue;
        stage = 4; // Sustain
        stageTime = 0;
      } else {
        const progress = stageTime / adjustedDecay;
        value = startValue + (targetValue - startValue) * applyCurve(progress, env.decayCurve);
      }
      break;
      
    case 4: // Sustain
      value = env.sustain * velAmount;
      break;
      
    case 5: // Release
      if (stageTime >= adjustedRelease) {
        value = 0;
        stage = 0; // Idle
        active = false;
      } else {
        const progress = stageTime / adjustedRelease;
        value = startValue * (1 - applyCurve(progress, env.releaseCurve));
      }
      break;
  }
  
  return { stage, value, stageTime, startValue, targetValue, active };
}

// ============================================================================
// LFO FUNCTIONS
// ============================================================================

/**
 * Create default LFO parameters.
 */
export function createDefaultLFO(): LFOParams {
  return {
    waveform: 'sine',
    rate: 1,
    tempoSync: false,
    syncDivision: '1/4',
    depth: 1,
    phase: 0,
    delay: 0,
    fadeIn: 0,
    keyTrigger: true,
    polarity: 'bipolar',
  };
}

/**
 * Create initial LFO state.
 */
export function createLFOState(params: LFOParams): LFOState {
  return {
    phase: params.phase,
    value: 0,
    delayRemaining: params.delay,
    fadeProgress: 0,
    sampleHoldValue: Math.random() * 2 - 1,
    smoothTarget: Math.random() * 2 - 1,
  };
}

/**
 * Convert sync division to multiplier relative to beat.
 */
export function syncDivisionToMultiplier(division: LFOSyncDivision): number {
  const map: Record<LFOSyncDivision, number> = {
    '8/1': 8, '4/1': 4, '2/1': 2, '1/1': 1,
    '1/2': 0.5, '1/2T': 1/3, '1/2D': 0.75,
    '1/4': 0.25, '1/4T': 1/6, '1/4D': 0.375,
    '1/8': 0.125, '1/8T': 1/12, '1/8D': 0.1875,
    '1/16': 0.0625, '1/16T': 1/24, '1/16D': 0.09375,
    '1/32': 0.03125, '1/32T': 1/48, '1/64': 0.015625,
  };
  return map[division] ?? 0.25;
}

/**
 * Get LFO value for a given waveform and phase.
 */
export function getLFOValue(
  waveform: LFOWaveform,
  phase: number,
  state: LFOState
): { value: number; state: LFOState } {
  const p = phase % 1;
  let value: number;
  let newState = { ...state };
  
  switch (waveform) {
    case 'sine':
      value = Math.sin(p * 2 * Math.PI);
      break;
      
    case 'triangle':
      value = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
      break;
      
    case 'saw':
      value = 2 * p - 1;
      break;
      
    case 'sawDown':
      value = 1 - 2 * p;
      break;
      
    case 'square':
      value = p < 0.5 ? 1 : -1;
      break;
      
    case 'pulse25':
      value = p < 0.25 ? 1 : -1;
      break;
      
    case 'pulse10':
      value = p < 0.1 ? 1 : -1;
      break;
      
    case 'random':
      value = Math.random() * 2 - 1;
      break;
      
    case 'sampleHold':
      // Update value only when phase crosses zero
      if (p < state.phase || (p > 0.99 && state.phase < 0.01)) {
        newState.sampleHoldValue = Math.random() * 2 - 1;
      }
      value = newState.sampleHoldValue;
      break;
      
    case 'smoothRandom':
      // Interpolate to new random target
      if (p < state.phase) {
        newState.smoothTarget = Math.random() * 2 - 1;
      }
      // Smooth interpolation
      const smoothSpeed = 0.1;
      newState.sampleHoldValue += (newState.smoothTarget - newState.sampleHoldValue) * smoothSpeed;
      value = newState.sampleHoldValue;
      break;
      
    default:
      value = 0;
  }
  
  newState.phase = p;
  return { value, state: newState };
}

/**
 * Process LFO for one sample.
 */
export function processLFO(
  state: LFOState,
  params: LFOParams,
  sampleRate: number,
  tempo: number = 120
): LFOState {
  const dt = 1 / sampleRate;
  let newState = { ...state };
  
  // Handle delay
  if (newState.delayRemaining > 0) {
    newState.delayRemaining -= dt;
    newState.value = 0;
    return newState;
  }
  
  // Handle fade-in
  if (params.fadeIn > 0 && newState.fadeProgress < 1) {
    newState.fadeProgress = Math.min(1, newState.fadeProgress + dt / params.fadeIn);
  } else {
    newState.fadeProgress = 1;
  }
  
  // Calculate rate
  let rate: number;
  if (params.tempoSync) {
    const beatsPerSecond = tempo / 60;
    const multiplier = syncDivisionToMultiplier(params.syncDivision);
    rate = beatsPerSecond / multiplier;
  } else {
    rate = params.rate;
  }
  
  // Update phase
  const phaseIncrement = rate * dt;
  const newPhase = (newState.phase + phaseIncrement) % 1;
  
  // Get waveform value
  const result = getLFOValue(params.waveform, newPhase, newState);
  newState = result.state;
  
  // Apply depth and fade
  let value = result.value * params.depth * newState.fadeProgress;
  
  // Convert to unipolar if needed
  if (params.polarity === 'unipolar') {
    value = (value + 1) / 2;
  }
  
  newState.value = value;
  newState.phase = newPhase;
  
  return newState;
}

// ============================================================================
// MODULATION MATRIX FUNCTIONS
// ============================================================================

/**
 * Create empty mod slot.
 */
export function createModSlot(id: string): ModSlot {
  return {
    id,
    source: 'constant',
    destination: 'pitch',
    amount: 0,
    via: null,
    viaAmount: 1,
    enabled: false,
  };
}

/**
 * Get modulation source value.
 */
export function getModSourceValue(
  source: ModSource,
  context: {
    ampEnv?: number;
    filterEnv?: number;
    modEnv?: number;
    pitchEnv?: number;
    lfo1?: number;
    lfo2?: number;
    lfo3?: number;
    lfo4?: number;
    velocity?: number;
    keytrack?: number;
    aftertouch?: number;
    modWheel?: number;
    pitchBend?: number;
    expression?: number;
    mpeSlide?: number;
    mpePressure?: number;
    mpeTimbre?: number;
    macros?: number[];
    random?: number;
    noteOnRandom?: number;
    voiceIndex?: number;
  }
): number {
  switch (source) {
    case 'ampEnv': return context.ampEnv ?? 0;
    case 'filterEnv': return context.filterEnv ?? 0;
    case 'modEnv': return context.modEnv ?? 0;
    case 'pitchEnv': return context.pitchEnv ?? 0;
    case 'lfo1': return context.lfo1 ?? 0;
    case 'lfo2': return context.lfo2 ?? 0;
    case 'lfo3': return context.lfo3 ?? 0;
    case 'lfo4': return context.lfo4 ?? 0;
    case 'velocity': return context.velocity ?? 0;
    case 'keytrack': return context.keytrack ?? 0;
    case 'aftertouch': return context.aftertouch ?? 0;
    case 'modWheel': return context.modWheel ?? 0;
    case 'pitchBend': return context.pitchBend ?? 0;
    case 'expression': return context.expression ?? 1;
    case 'mpeSlide': return context.mpeSlide ?? 0;
    case 'mpePressure': return context.mpePressure ?? 0;
    case 'mpeTimbre': return context.mpeTimbre ?? 0;
    case 'macro1': return context.macros?.[0] ?? 0;
    case 'macro2': return context.macros?.[1] ?? 0;
    case 'macro3': return context.macros?.[2] ?? 0;
    case 'macro4': return context.macros?.[3] ?? 0;
    case 'macro5': return context.macros?.[4] ?? 0;
    case 'macro6': return context.macros?.[5] ?? 0;
    case 'macro7': return context.macros?.[6] ?? 0;
    case 'macro8': return context.macros?.[7] ?? 0;
    case 'random': return context.random ?? Math.random();
    case 'noteOnRandom': return context.noteOnRandom ?? 0;
    case 'voiceIndex': return context.voiceIndex ?? 0;
    case 'constant': return 1;
  }
}

/**
 * Calculate modulation for a destination.
 */
export function calculateModulation(
  slots: ModSlot[],
  destination: ModDestination,
  context: Parameters<typeof getModSourceValue>[1]
): number {
  let total = 0;
  
  for (const slot of slots) {
    if (!slot.enabled || slot.destination !== destination) continue;
    
    const sourceValue = getModSourceValue(slot.source, context);
    let amount = slot.amount;
    
    // Apply via modulation
    if (slot.via) {
      const viaValue = getModSourceValue(slot.via, context);
      amount *= (1 - slot.viaAmount) + slot.viaAmount * viaValue;
    }
    
    total += sourceValue * amount;
  }
  
  return total;
}

// ============================================================================
// MACRO FUNCTIONS
// ============================================================================

/**
 * Create default macro configuration.
 */
export function createMacroConfig(id: number): MacroConfig {
  return {
    id,
    name: `Macro ${id}`,
    value: 0,
    defaultValue: 0,
    targets: [],
  };
}

/**
 * Add target to macro.
 */
export function addMacroTarget(
  macro: MacroConfig,
  target: MacroTarget
): MacroConfig {
  if (macro.targets.length >= MAX_MACRO_TARGETS) {
    return macro;
  }
  
  return {
    ...macro,
    targets: [...macro.targets, target],
  };
}

/**
 * Calculate macro target value.
 */
export function calculateMacroValue(
  macroValue: number,
  target: MacroTarget
): number {
  let t = Math.max(0, Math.min(1, macroValue));
  
  // Apply curve
  switch (target.curve) {
    case 'exponential':
      t = t * t;
      break;
    case 'logarithmic':
      t = Math.sqrt(t);
      break;
  }
  
  return target.min + (target.max - target.min) * t;
}

// ============================================================================
// MPE FUNCTIONS
// ============================================================================

/**
 * Create default MPE zone configuration.
 */
export function createMPEZone(isLowerZone: boolean = true): MPEZone {
  return {
    masterChannel: isLowerZone ? 1 : 16,
    memberChannels: 15,
    pitchBendRange: 48, // Standard MPE pitch bend range
  };
}

/**
 * Create MPE voice state.
 */
export function createMPEVoiceState(channel: number): MPEVoiceState {
  return {
    channel,
    pitchBend: 0,
    slide: 0,
    pressure: 0,
  };
}

/**
 * Process MPE pitch bend.
 */
export function processMPEPitchBend(
  bendValue: number, // 0-16383 (14-bit)
  range: number // semitones
): number {
  // Convert to -1 to 1 range
  const normalized = (bendValue - 8192) / 8192;
  return normalized * range;
}

/**
 * Check if channel is in MPE zone.
 */
export function isInMPEZone(channel: number, zone: MPEZone): boolean {
  if (zone.masterChannel === 1) {
    // Lower zone: channels 2 to (2 + memberChannels - 1)
    return channel >= 2 && channel <= 1 + zone.memberChannels;
  } else {
    // Upper zone: channels (16 - memberChannels) to 15
    return channel >= 16 - zone.memberChannels && channel <= 15;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert MIDI CC value (0-127) to normalized (0-1).
 */
export function ccToNormalized(cc: number): number {
  return cc / 127;
}

/**
 * Convert normalized value (0-1) to MIDI CC (0-127).
 */
export function normalizedToCC(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 127);
}

/**
 * Convert MIDI pitch bend (0-16383) to normalized (-1 to 1).
 */
export function pitchBendToNormalized(bend: number): number {
  return (bend - 8192) / 8192;
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Exponential interpolation (for frequencies, etc.).
 */
export function expLerp(a: number, b: number, t: number): number {
  return a * Math.pow(b / a, t);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Envelope
  createDefaultEnvelope,
  createEnvelopeState,
  applyCurve,
  processEnvelope,
  
  // LFO
  createDefaultLFO,
  createLFOState,
  syncDivisionToMultiplier,
  getLFOValue,
  processLFO,
  
  // Modulation Matrix
  createModSlot,
  getModSourceValue,
  calculateModulation,
  
  // Macros
  createMacroConfig,
  addMacroTarget,
  calculateMacroValue,
  
  // MPE
  createMPEZone,
  createMPEVoiceState,
  processMPEPitchBend,
  isInMPEZone,
  
  // Utilities
  ccToNormalized,
  normalizedToCC,
  pitchBendToNormalized,
  lerp,
  expLerp,
};
