/**
 * Sampler Card
 *
 * Professional multi-zone sampler with velocity layers, round-robin,
 * key switching, and extensive modulation. Supports common sampler
 * formats and provides factory instrument presets.
 *
 * This card is a facade that uses the Phase 38 audio modules as its backend:
 * - sampler-core: Zone/voice architecture, layer selection, tempo detection
 * - sampler-modulation: AHDSR envelopes, LFOs, modulation matrix
 * - sampler-filter: Multi-mode filters
 * - sampler-voice: Voice allocation and management
 *
 * Features:
 * - 128 zones across keyboard
 * - 8 velocity layers per zone
 * - Round-robin samples (up to 8 variations)
 * - Key switching for articulations
 * - ADSR envelope per sample
 * - Filter with envelope
 * - LFO modulation
 * - Sample start/end/loop points
 * - Pitch tracking and fixed pitch modes
 * - Legato and portamento
 * - Multi-output routing
 * - Factory instrument presets
 */

// =============================================================================
// IMPORTS FROM PHASE 38 AUDIO MODULES
// =============================================================================

import {
  // Layer selection
  selectRandomLayer,
  selectSequenceLayer,
  selectRoundRobinLayer,
  // Crossfades
  calculateCrossfadeGain,
  getVelocityCrossfadePosition,
  getKeyCrossfadePosition,
  // Voice management
  createUnisonVoices,
  findVoicesToSteal,
  calculateGlidePitch,
  // Factory functions
  createDefaultLayerConfig,
  createDefaultUnisonConfig,
  createDefaultGlideConfig,
  createDefaultVelocityCrossfade,
  createDefaultKeyCrossfade,
  // Types
  type LayerSelectionMode,
  type RandomLayerConfig,
  type SequenceLayerConfig,
  type RoundRobinLayerConfig,
  type LayerConfig,
  type CrossfadeCurve,
  type VelocityCrossfade,
  type KeyCrossfade,
  type ZoneTriggerMode,
  type ExtendedSampleZone,
  type VoiceState as CoreVoiceState,
  type VoicePriority,
  type GlideCurve,
  type UnisonConfig,
  type GlideConfig,
  type ExtendedSamplerVoice,
} from '../audio/sampler-core';

import {
  // Envelope functions
  createDefaultEnvelope,
  createEnvelopeState,
  applyCurve,
  processEnvelope as processModEnvelope,
  // LFO functions
  createLFOState,
  syncDivisionToMultiplier,
  getLFOValue,
  processLFO,
  // Modulation matrix
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
  // Utilities
  ccToNormalized,
  normalizedToCC,
  pitchBendToNormalized,
  lerp,
  expLerp,
  // Constants
  MAX_MOD_SLOTS,
  MAX_MACROS,
  LFO_MIN_RATE,
  LFO_MAX_RATE,
  ENV_MIN_TIME,
  ENV_MAX_TIME,
  // Types
  type EnvelopeCurve,
  type AHDSREnvelope,
  type EnvelopeState,
  type LFOWaveform,
  type LFOSyncDivision,
  type LFOParams as ModLFOParams,
  type LFOState,
  type ModSource,
  type ModDestination,
  type ModSlot,
  type MacroTarget,
  type MacroConfig,
  type MPEZone,
  type MPEVoiceState,
} from '../audio/sampler-modulation';

import {
  // Filter class and factory
  createSamplerFilter,
  createDualSamplerFilter,
  createFilterConfig,
  createDualFilterConfig,
  SamplerFilter,
  DualSamplerFilter,
  // Defaults
  DEFAULT_FILTER_CONFIG,
  DEFAULT_DUAL_FILTER_CONFIG,
  // Types
  type SamplerFilterType,
  type FilterRoutingMode,
  type SaturationMode,
  type FilterConfig,
  type DualFilterConfig,
} from '../audio/sampler-filter';

import {
  // Sample manipulation operations
  applyManipulation,
  processBatch,
  createUndoState,
  applyUndo,
  generateWaveformForUI,
  getSampleRegion,
  // Types
  type ManipulationOperation,
  type ManipulationParams,
  type ManipulationResult,
  type TrimParams,
  type FadeParams,
  type NormalizeParams,
  type TimeStretchParams,
  type PitchShiftParams,
  type ConvertRateParams,
  type ConvertDepthParams,
  type ConvertChannelsParams,
  type CropParams,
  type SliceParams,
  type BatchJob,
  type BatchResult,
  type UndoState,
} from '../audio/sample-manipulation-ui';

import {
  // Voice manager
  SamplerVoiceManager,
  DEFAULT_VOICE_CONFIG,
  // Types
  type VoiceState,
  type VoiceMode,
  type NotePriority,
  type VoiceStealingMode,
  type VoiceAllocationInfo,
  type VoiceConfig,
  type VoicePoolStats,
} from '../audio/sampler-voice';

// =============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Re-export audio module types and functions that consumers might need
export {
  // From sampler-core
  selectRandomLayer,
  selectSequenceLayer,
  selectRoundRobinLayer,
  calculateCrossfadeGain,
  getVelocityCrossfadePosition,
  getKeyCrossfadePosition,
  createUnisonVoices,
  findVoicesToSteal,
  calculateGlidePitch,
  createDefaultLayerConfig,
  createDefaultUnisonConfig,
  createDefaultGlideConfig,
  createDefaultVelocityCrossfade,
  createDefaultKeyCrossfade,
  type LayerSelectionMode,
  type RandomLayerConfig,
  type SequenceLayerConfig,
  type RoundRobinLayerConfig,
  type LayerConfig,
  type CrossfadeCurve,
  type VelocityCrossfade,
  type KeyCrossfade,
  type ZoneTriggerMode,
  type ExtendedSampleZone,
  type VoicePriority,
  type GlideCurve,
  type UnisonConfig,
  type GlideConfig,
  type ExtendedSamplerVoice,
  
  // From sampler-modulation
  createDefaultEnvelope,
  createEnvelopeState,
  applyCurve,
  createLFOState,
  syncDivisionToMultiplier,
  getLFOValue,
  processLFO,
  createModSlot,
  getModSourceValue,
  calculateModulation,
  createMacroConfig,
  addMacroTarget,
  calculateMacroValue,
  createMPEZone,
  createMPEVoiceState,
  ccToNormalized,
  normalizedToCC,
  pitchBendToNormalized,
  lerp,
  expLerp,
  MAX_MOD_SLOTS,
  MAX_MACROS,
  LFO_MIN_RATE,
  LFO_MAX_RATE,
  ENV_MIN_TIME,
  ENV_MAX_TIME,
  type EnvelopeCurve,
  type AHDSREnvelope,
  type EnvelopeState,
  type LFOWaveform,
  type LFOSyncDivision,
  type LFOState,
  type ModSource,
  type ModDestination,
  type ModSlot,
  type MacroTarget,
  type MacroConfig,
  type MPEZone,
  type MPEVoiceState,
  
  // From sampler-filter
  createSamplerFilter,
  createDualSamplerFilter,
  createFilterConfig,
  createDualFilterConfig,
  SamplerFilter,
  DualSamplerFilter,
  DEFAULT_FILTER_CONFIG,
  DEFAULT_DUAL_FILTER_CONFIG,
  type SamplerFilterType,
  type FilterRoutingMode,
  type SaturationMode,
  type FilterConfig,
  type DualFilterConfig,
  
  // From sampler-voice
  SamplerVoiceManager,
  DEFAULT_VOICE_CONFIG,
  type VoiceState,
  type VoiceMode,
  type NotePriority,
  type VoiceStealingMode,
  type VoiceAllocationInfo,
  type VoiceConfig,
  type VoicePoolStats,
  
  // From sample-manipulation-ui
  applyManipulation,
  processBatch,
  createUndoState,
  applyUndo,
  generateWaveformForUI,
  getSampleRegion,
  type ManipulationOperation,
  type ManipulationParams,
  type ManipulationResult,
  type TrimParams,
  type FadeParams,
  type NormalizeParams,
  type TimeStretchParams,
  type PitchShiftParams,
  type ConvertRateParams,
  type ConvertDepthParams,
  type ConvertChannelsParams,
  type CropParams,
  type SliceParams,
  type BatchJob,
  type BatchResult,
  type UndoState,
};

// =============================================================================
// CONSTANTS (kept for backward compatibility)
// =============================================================================

/** Maximum zones (one per MIDI note) */
export const MAX_ZONES = 128;

/** Maximum velocity layers per zone */
export const MAX_VELOCITY_LAYERS = 8;

/** Maximum round-robin variations */
export const MAX_ROUND_ROBIN = 8;

/** Maximum voices (polyphony) */
export const MAX_VOICES = 64;

/** Sample rate */
export const SAMPLE_RATE = 44100;

/** Note names */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// =============================================================================
// CARD-LEVEL TYPES (legacy types that map to audio module types)
// =============================================================================

/**
 * Sample playback mode
 */
export type PlaybackMode =
  | 'oneShot'      // Play to end
  | 'sustain'      // Play while note held, then release
  | 'loop'         // Loop while note held
  | 'loopRelease'  // Loop while held, release to end
  | 'toggle';      // Toggle on/off

/**
 * Loop mode
 */
export type LoopMode =
  | 'forward'      // Loop forward
  | 'backward'     // Loop backward
  | 'pingpong'     // Alternate direction
  | 'noLoop';      // No looping

/**
 * Trigger mode
 */
export type TriggerMode =
  | 'attack'       // Trigger on note-on
  | 'release'      // Trigger on note-off
  | 'both'         // Trigger on both
  | 'legato';      // Only first note triggers

/**
 * Voice stealing mode (legacy - maps to VoiceStealingMode)
 */
export type VoiceStealMode =
  | 'oldest'       // Steal oldest voice
  | 'quietest'     // Steal quietest voice
  | 'lowest'       // Steal lowest note
  | 'highest'      // Steal highest note
  | 'none';        // No stealing (drop new notes)

/**
 * Instrument category
 */
export type InstrumentCategory =
  | 'piano'
  | 'keys'
  | 'organ'
  | 'guitar'
  | 'bass'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'synth'
  | 'pads'
  | 'leads'
  | 'drums'
  | 'percussion'
  | 'ethnic'
  | 'sfx'
  | 'vocal';

/**
 * Envelope parameters (legacy - simpler than AHDSREnvelope)
 */
export interface EnvelopeParams {
  /** Attack time in seconds */
  attack: number;
  /** Decay time in seconds */
  decay: number;
  /** Sustain level 0-1 */
  sustain: number;
  /** Release time in seconds */
  release: number;
  /** Attack curve (-1 to 1, 0 = linear) */
  attackCurve: number;
  /** Decay curve (-1 to 1, 0 = linear) */
  decayCurve: number;
  /** Release curve (-1 to 1, 0 = linear) */
  releaseCurve: number;
}

/**
 * LFO parameters (legacy - maps to ModLFOParams)
 */
export interface LFOParams {
  /** LFO waveform */
  waveform: 'sine' | 'triangle' | 'square' | 'saw' | 'random' | 'sampleHold';
  /** Rate in Hz */
  rate: number;
  /** Rate synced to tempo */
  syncedRate: '1/16' | '1/8' | '1/4' | '1/2' | '1' | '2' | '4' | null;
  /** Depth 0-1 */
  depth: number;
  /** Phase offset 0-1 */
  phase: number;
  /** Delay before LFO starts (seconds) */
  delay: number;
  /** Fade-in time (seconds) */
  fadeIn: number;
  /** Key tracking (cents per semitone) */
  keyTracking: number;
}

/**
 * Filter parameters (legacy - simpler than FilterConfig)
 */
export interface FilterParams {
  /** Filter enabled */
  enabled: boolean;
  /** Filter type */
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'lowshelf' | 'highshelf' | 'peaking';
  /** Cutoff frequency in Hz */
  frequency: number;
  /** Resonance (Q factor) */
  resonance: number;
  /** Envelope amount (-1 to 1) */
  envelopeAmount: number;
  /** Key tracking (0 = none, 1 = full) */
  keyTracking: number;
  /** Velocity sensitivity (0-1) */
  velocitySensitivity: number;
  /** LFO modulation amount */
  lfoAmount: number;
}

/**
 * Sample data
 */
export interface SampleData {
  /** Sample ID */
  id: string;

  /** Sample name */
  name: string;

  /** Audio buffer (left channel) */
  audioL?: Float32Array;

  /** Audio buffer (right channel) */
  audioR?: Float32Array;

  /** Sample rate of original audio */
  sampleRate: number;

  /** Total samples */
  length: number;

  /** Root note (MIDI) */
  rootNote: number;

  /** Sample start point */
  startPoint: number;

  /** Sample end point */
  endPoint: number;

  /** Loop start point */
  loopStart: number;

  /** Loop end point */
  loopEnd: number;

  /** Loop mode */
  loopMode: LoopMode;

  /** Crossfade samples for smooth looping */
  loopCrossfade: number;

  /** Fine tune in cents */
  fineTune: number;

  /** Volume adjustment dB */
  volumeDb: number;

  /** Pan -1 to 1 */
  pan: number;
}

/**
 * Zone mapping (key range + velocity range -> sample)
 */
export interface SampleZone {
  /** Zone ID */
  id: string;

  /** Low key (inclusive) */
  keyLow: number;

  /** High key (inclusive) */
  keyHigh: number;

  /** Root key for zone */
  rootKey: number;

  /** Low velocity (inclusive) */
  velocityLow: number;

  /** High velocity (inclusive) */
  velocityHigh: number;

  /** Sample for this zone */
  sample: SampleData | null;

  /** Round-robin samples (alternatives) */
  roundRobinSamples: SampleData[];

  /** Current round-robin index */
  roundRobinIndex: number;

  /** Volume for this zone 0-1 */
  volume: number;

  /** Pan for this zone -1 to 1 */
  pan: number;

  /** Transpose in semitones */
  transpose: number;

  /** Fine tune in cents */
  fineTune: number;

  /** Playback mode */
  playbackMode: PlaybackMode;

  /** Fixed pitch (don't track keyboard) */
  fixedPitch: boolean;

  /** Envelope override (null = use global) */
  envelope: EnvelopeParams | null;

  /** Output routing (0 = main, 1-7 = aux) */
  outputBus: number;

  /** Muted */
  muted: boolean;

  /** Solo */
  solo: boolean;

  /** Exclusive group (zones in same group cut each other) */
  exclusiveGroup: number | null;
}

/**
 * Articulation (key switch)
 */
export interface Articulation {
  /** Articulation ID */
  id: string;

  /** Display name */
  name: string;

  /** Key switch note */
  keySwitchNote: number;

  /** Zones for this articulation */
  zones: SampleZone[];

  /** Is default articulation */
  isDefault: boolean;

  /** Envelope overrides */
  envelope?: Partial<EnvelopeParams>;

  /** Filter overrides */
  filter?: Partial<FilterParams>;
}

/**
 * Instrument preset
 */
export interface SamplerPreset {
  /** Preset ID */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: InstrumentCategory;

  /** Tags */
  tags: string[];

  /** Description */
  description?: string;

  /** Articulations (each with zones) */
  articulations: Articulation[];

  /** Global amp envelope */
  ampEnvelope: EnvelopeParams;

  /** Filter envelope */
  filterEnvelope: EnvelopeParams;

  /** Filter parameters */
  filter: FilterParams;

  /** LFO 1 (pitch) */
  lfo1: LFOParams;

  /** LFO 2 (filter) */
  lfo2: LFOParams;

  /** Pitch bend range (semitones) */
  pitchBendRange: number;

  /** Portamento time (seconds) */
  portamentoTime: number;

  /** Portamento enabled */
  portamentoEnabled: boolean;

  /** Legato mode */
  legatoMode: boolean;

  /** Mono mode */
  monoMode: boolean;

  /** Voice stealing mode */
  voiceStealMode: VoiceStealMode;

  /** Max polyphony (0 = unlimited up to MAX_VOICES) */
  maxPolyphony: number;

  /** Velocity curve (0 = linear, -1 = soft, 1 = hard) */
  velocityCurve: number;

  /** Master volume dB */
  masterVolume: number;

  /** Master pan */
  masterPan: number;

  /** Master tune cents */
  masterTune: number;
}

/**
 * Active voice
 */
export interface SamplerVoice {
  /** Voice ID */
  id: string;

  /** MIDI note that triggered this voice */
  note: number;

  /** Velocity 0-127 */
  velocity: number;

  /** Current playhead position */
  playhead: number;

  /** Sample being played */
  sample: SampleData;

  /** Zone this voice belongs to */
  zone: SampleZone;

  /** Is voice active */
  isActive: boolean;

  /** Is in release phase */
  isReleasing: boolean;

  /** Current envelope value */
  envelopeValue: number;

  /** Envelope stage (0=attack, 1=decay, 2=sustain, 3=release) */
  envelopeStage: number;

  /** Time in current envelope stage */
  envelopeTime: number;

  /** Current filter envelope value */
  filterEnvelopeValue: number;

  /** Filter envelope stage */
  filterEnvelopeStage: number;

  /** LFO 1 phase */
  lfo1Phase: number;

  /** LFO 2 phase */
  lfo2Phase: number;

  /** Start time */
  startTime: number;

  /** Current pitch (for portamento) */
  currentPitch: number;

  /** Target pitch (for portamento) */
  targetPitch: number;

  /** Loop direction (for pingpong) */
  loopDirection: number;

  /** Output gain (after envelope) */
  outputGain: number;
}

/**
 * Sampler state
 */
export interface SamplerState {
  /** Current preset */
  preset: SamplerPreset;

  /** Active articulation */
  activeArticulation: string;

  /** Active voices */
  voices: SamplerVoice[];

  /** Held notes */
  heldNotes: Set<number>;

  /** Sustain pedal state */
  sustainPedal: boolean;

  /** Sostenuto pedal state */
  sostenutoPedal: boolean;

  /** Current pitch bend value (-1 to 1) */
  pitchBend: number;

  /** Mod wheel value (0-1) */
  modWheel: number;

  /** Expression value (0-1) */
  expression: number;

  /** Master volume (0-1) */
  masterVolume: number;

  /** Last played note (for legato/portamento) */
  lastNote: number;

  /** Voice counter for unique IDs */
  voiceCounter: number;

  /** Sample library */
  sampleLibrary: Map<string, SampleData>;
}

/**
 * Sampler input events
 */
export type SamplerInput =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'pitchBend'; value: number }
  | { type: 'modWheel'; value: number }
  | { type: 'expression'; value: number }
  | { type: 'sustainPedal'; value: boolean }
  | { type: 'sostenutoPedal'; value: boolean }
  | { type: 'allNotesOff' }
  | { type: 'allSoundOff' }
  | { type: 'loadPreset'; presetId: string }
  | { type: 'setArticulation'; articulationId: string }
  | { type: 'setVolume'; volume: number }
  | { type: 'setPan'; pan: number }
  | { type: 'setTune'; cents: number }
  | { type: 'setPitchBendRange'; semitones: number }
  | { type: 'setPortamento'; time: number; enabled: boolean }
  | { type: 'setLegato'; enabled: boolean }
  | { type: 'setMono'; enabled: boolean }
  | { type: 'setFilter'; config: Partial<FilterParams> }
  | { type: 'setEnvelope'; target: 'amp' | 'filter'; params: Partial<EnvelopeParams> }
  | { type: 'setLFO'; lfoId: 1 | 2; params: Partial<LFOParams> }
  | { type: 'tick'; time: number; deltaTime: number }
  | { type: 'midiCC'; controller: number; value: number }
  | { type: 'addSample'; sample: SampleData }
  | { type: 'removeSample'; sampleId: string }
  | { type: 'setZone'; zoneId: string; config: Partial<SampleZone> };

/**
 * Sampler output events
 */
export type SamplerOutput =
  | { type: 'voiceStart'; voiceId: string; note: number; velocity: number }
  | { type: 'voiceEnd'; voiceId: string; note: number }
  | { type: 'voiceStolen'; voiceId: string; note: number; byNote: number }
  | { type: 'audioFrame'; bufferL: Float32Array; bufferR: Float32Array; time: number }
  | { type: 'articulationChanged'; articulationId: string }
  | { type: 'presetLoaded'; presetId: string }
  | { type: 'error'; message: string };

/**
 * Result from processing
 */
export interface SamplerResult {
  state: SamplerState;
  outputs: SamplerOutput[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default amp envelope
 */
export const DEFAULT_AMP_ENVELOPE: EnvelopeParams = {
  attack: 0.001,
  decay: 0.1,
  sustain: 1.0,
  release: 0.3,
  attackCurve: 0,
  decayCurve: 0,
  releaseCurve: 0,
};

/**
 * Default filter envelope
 */
export const DEFAULT_FILTER_ENVELOPE: EnvelopeParams = {
  attack: 0.05,
  decay: 0.3,
  sustain: 0.3,
  release: 0.5,
  attackCurve: 0,
  decayCurve: 0,
  releaseCurve: 0,
};

/**
 * Default filter
 */
export const DEFAULT_FILTER: FilterParams = {
  enabled: false,
  type: 'lowpass',
  frequency: 20000,
  resonance: 0.707,
  envelopeAmount: 0,
  keyTracking: 0,
  velocitySensitivity: 0,
  lfoAmount: 0,
};

/**
 * Default LFO
 */
export const DEFAULT_LFO: LFOParams = {
  waveform: 'sine',
  rate: 5,
  syncedRate: null,
  depth: 0,
  phase: 0,
  delay: 0,
  fadeIn: 0,
  keyTracking: 0,
};

// =============================================================================
// CONVERSION HELPERS (between legacy types and audio module types)
// =============================================================================

/**
 * Convert legacy EnvelopeParams to AHDSREnvelope
 */
function toAHDSREnvelope(params: EnvelopeParams): AHDSREnvelope {
  const curveToType = (curve: number): EnvelopeCurve => {
    if (curve < -0.3) return 'logarithmic';
    if (curve > 0.3) return 'exponential';
    return 'linear';
  };
  
  return {
    attack: params.attack,
    hold: 0,
    decay: params.decay,
    sustain: params.sustain,
    release: params.release,
    attackCurve: curveToType(params.attackCurve),
    decayCurve: curveToType(params.decayCurve),
    releaseCurve: curveToType(params.releaseCurve),
    velocitySensitivity: 0.5,
    keyTracking: 0,
  };
}

/**
 * Convert legacy LFOParams to ModLFOParams
 */
export function toModLFOParams(params: LFOParams): ModLFOParams {
  const waveformMap: Record<string, LFOWaveform> = {
    'sine': 'sine',
    'triangle': 'triangle',
    'square': 'square',
    'saw': 'saw',
    'random': 'random',
    'sampleHold': 'sampleHold',
  };
  
  const syncMap: Record<string, LFOSyncDivision> = {
    '1/16': '1/16',
    '1/8': '1/8',
    '1/4': '1/4',
    '1/2': '1/2',
    '1': '1/1',
    '2': '2/1',
    '4': '4/1',
  };
  
  return {
    waveform: waveformMap[params.waveform] ?? 'sine',
    rate: params.rate,
    tempoSync: params.syncedRate !== null,
    syncDivision: params.syncedRate ? (syncMap[params.syncedRate] ?? '1/4') : '1/4',
    depth: params.depth,
    phase: params.phase,
    delay: params.delay,
    fadeIn: params.fadeIn,
    keyTrigger: true,
    polarity: 'bipolar',
  };
}

/**
 * Convert legacy VoiceStealMode to VoiceStealingMode
 */
export function toVoiceStealingMode(mode: VoiceStealMode): VoiceStealingMode {
  switch (mode) {
    case 'oldest': return 'oldest';
    case 'quietest': return 'quietest';
    case 'lowest': return 'furthest';
    case 'highest': return 'furthest';
    case 'none': return 'none';
    default: return 'oldest';
  }
}

// =============================================================================
// FACTORY SAMPLE DATA (Placeholders)
// =============================================================================

/**
 * Create placeholder sample
 */
function createSampleData(
  id: string,
  name: string,
  rootNote: number,
  lengthMs: number = 1000
): SampleData {
  const length = Math.floor((lengthMs / 1000) * SAMPLE_RATE);

  return {
    id,
    name,
    sampleRate: SAMPLE_RATE,
    length,
    rootNote,
    startPoint: 0,
    endPoint: length,
    loopStart: 0,
    loopEnd: length,
    loopMode: 'noLoop',
    loopCrossfade: 0,
    fineTune: 0,
    volumeDb: 0,
    pan: 0,
  };
}

/**
 * Create velocity layers for a note
 */
function createVelocityZones(
  keyLow: number,
  keyHigh: number,
  rootKey: number,
  samplePrefix: string,
  layerCount: number = 4
): SampleZone[] {
  const zones: SampleZone[] = [];
  const velocityStep = Math.floor(127 / layerCount);

  for (let i = 0; i < layerCount; i++) {
    zones.push({
      id: `${samplePrefix}-vel${i}`,
      keyLow,
      keyHigh,
      rootKey,
      velocityLow: i * velocityStep + 1,
      velocityHigh: (i + 1) * velocityStep,
      sample: createSampleData(`${samplePrefix}-vel${i}`, `${samplePrefix} Layer ${i + 1}`, rootKey),
      roundRobinSamples: [],
      roundRobinIndex: 0,
      volume: 1.0,
      pan: 0,
      transpose: 0,
      fineTune: 0,
      playbackMode: 'sustain',
      fixedPitch: false,
      envelope: null,
      outputBus: 0,
      muted: false,
      solo: false,
      exclusiveGroup: null,
    });
  }

  // Fix last layer to go to 127
  if (zones.length > 0) {
    zones[zones.length - 1]!.velocityHigh = 127;
  }

  return zones;
}

// =============================================================================
// FACTORY PRESETS
// =============================================================================

/**
 * Create piano preset
 */
function createPianoPreset(): SamplerPreset {
  const zones: SampleZone[] = [];

  // Create zones for each octave with velocity layers
  for (let octave = 0; octave < 9; octave++) {
    for (let note = 0; note < 12; note++) {
      const midiNote = octave * 12 + note;
      if (midiNote >= 21 && midiNote <= 108) {
        // A0 to C8
        zones.push(...createVelocityZones(midiNote, midiNote, midiNote, `piano-${NOTE_NAMES[note]}${octave}`, 4));
      }
    }
  }

  return {
    id: 'acoustic-grand-piano',
    name: 'Acoustic Grand Piano',
    category: 'piano',
    tags: ['acoustic', 'grand', 'concert', 'classical'],
    description: 'Concert grand piano with 4 velocity layers',
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 0,
        zones,
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, release: 1.5 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: false },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 32,
    velocityCurve: 0,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  };
}

/**
 * Factory presets
 */
export const SAMPLER_PRESETS: SamplerPreset[] = [
  // =========================================================================
  // PIANO
  // =========================================================================
  createPianoPreset(),
  {
    id: 'bright-piano',
    name: 'Bright Piano',
    category: 'piano',
    tags: ['bright', 'pop', 'modern'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 0,
        zones: createVelocityZones(21, 108, 60, 'bright-piano', 3),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, release: 1.0 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 8000 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 32,
    velocityCurve: 0.2,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
  {
    id: 'upright-piano',
    name: 'Upright Piano',
    category: 'piano',
    tags: ['upright', 'warm', 'intimate'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 0,
        zones: createVelocityZones(21, 108, 60, 'upright-piano', 3),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.002, decay: 0.2, release: 0.8 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: true, type: 'lowpass', frequency: 6000 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 24,
    velocityCurve: -0.1,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // KEYS
  // =========================================================================
  {
    id: 'rhodes-electric-piano',
    name: 'Rhodes Electric Piano',
    category: 'keys',
    tags: ['rhodes', 'electric', 'vintage', 'soulful'],
    articulations: [
      {
        id: 'normal',
        name: 'Normal',
        keySwitchNote: 0,
        zones: createVelocityZones(28, 103, 60, 'rhodes', 4),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.8, sustain: 0.6, release: 0.5 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, decay: 0.5, sustain: 0.4 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 4000, envelopeAmount: 0.3 },
    lfo1: { ...DEFAULT_LFO, waveform: 'triangle', rate: 4, depth: 0.1 },
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 16,
    velocityCurve: 0.3,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
  {
    id: 'wurlitzer',
    name: 'Wurlitzer',
    category: 'keys',
    tags: ['wurlitzer', 'electric', 'funky'],
    articulations: [
      {
        id: 'normal',
        name: 'Normal',
        keySwitchNote: 0,
        zones: createVelocityZones(36, 96, 60, 'wurli', 3),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.002, decay: 0.3, sustain: 0.7, release: 0.3 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.01, decay: 0.2 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 3500, envelopeAmount: 0.4, velocitySensitivity: 0.3 },
    lfo1: { ...DEFAULT_LFO, waveform: 'triangle', rate: 5.5, depth: 0.05 },
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 12,
    velocityCurve: 0.4,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
  {
    id: 'clavinet',
    name: 'Clavinet D6',
    category: 'keys',
    tags: ['clavinet', 'funky', 'percussive'],
    articulations: [
      {
        id: 'normal',
        name: 'Normal',
        keySwitchNote: 0,
        zones: createVelocityZones(36, 96, 60, 'clav', 4),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.15, sustain: 0.5, release: 0.1 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.001, decay: 0.1, sustain: 0.2 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 5000, resonance: 1.5, envelopeAmount: 0.5, velocitySensitivity: 0.5 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 12,
    velocityCurve: 0.5,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // ORGAN
  // =========================================================================
  {
    id: 'hammond-b3',
    name: 'Hammond B3',
    category: 'organ',
    tags: ['hammond', 'organ', 'jazz', 'rock'],
    articulations: [
      {
        id: 'full',
        name: 'Full',
        keySwitchNote: 24,
        zones: createVelocityZones(36, 96, 60, 'hammond-full', 1),
        isDefault: true,
      },
      {
        id: 'jazz',
        name: 'Jazz',
        keySwitchNote: 25,
        zones: createVelocityZones(36, 96, 60, 'hammond-jazz', 1),
        isDefault: false,
      },
      {
        id: 'rock',
        name: 'Rock',
        keySwitchNote: 26,
        zones: createVelocityZones(36, 96, 60, 'hammond-rock', 1),
        isDefault: false,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.005, decay: 0, sustain: 1, release: 0.05 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: false },
    lfo1: { ...DEFAULT_LFO, waveform: 'sine', rate: 6.4, depth: 0.15 },  // Rotary slow
    lfo2: { ...DEFAULT_LFO, waveform: 'sine', rate: 40, depth: 0.1 },     // Rotary fast
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 32,
    velocityCurve: -0.5,  // Organs often velocity-insensitive
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // STRINGS
  // =========================================================================
  {
    id: 'string-ensemble',
    name: 'String Ensemble',
    category: 'strings',
    tags: ['strings', 'orchestra', 'ensemble', 'lush'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 24,
        zones: createVelocityZones(28, 103, 60, 'strings-sustain', 3),
        isDefault: true,
      },
      {
        id: 'staccato',
        name: 'Staccato',
        keySwitchNote: 25,
        zones: createVelocityZones(28, 103, 60, 'strings-staccato', 3),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
      },
      {
        id: 'tremolo',
        name: 'Tremolo',
        keySwitchNote: 26,
        zones: createVelocityZones(28, 103, 60, 'strings-tremolo', 2),
        isDefault: false,
      },
      {
        id: 'pizzicato',
        name: 'Pizzicato',
        keySwitchNote: 27,
        zones: createVelocityZones(28, 103, 60, 'strings-pizz', 3),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.3, decay: 0.1, sustain: 0.9, release: 0.4 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 8000 },
    lfo1: { ...DEFAULT_LFO, waveform: 'sine', rate: 5, depth: 0.05 },  // Vibrato
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0.1,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 24,
    velocityCurve: 0,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // BRASS
  // =========================================================================
  {
    id: 'brass-section',
    name: 'Brass Section',
    category: 'brass',
    tags: ['brass', 'section', 'orchestra', 'powerful'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 24,
        zones: createVelocityZones(36, 84, 60, 'brass-sustain', 3),
        isDefault: true,
      },
      {
        id: 'staccato',
        name: 'Staccato',
        keySwitchNote: 25,
        zones: createVelocityZones(36, 84, 60, 'brass-staccato', 3),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 },
      },
      {
        id: 'sforzando',
        name: 'Sforzando',
        keySwitchNote: 26,
        zones: createVelocityZones(36, 84, 60, 'brass-sfz', 2),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.2 },
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.08, decay: 0.1, sustain: 0.85, release: 0.25 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.05, decay: 0.2, sustain: 0.5 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 6000, envelopeAmount: 0.3 },
    lfo1: { ...DEFAULT_LFO, waveform: 'sine', rate: 5.5, depth: 0.03 },
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0.08,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 16,
    velocityCurve: 0.2,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // WOODWINDS
  // =========================================================================
  {
    id: 'flute',
    name: 'Flute',
    category: 'woodwinds',
    tags: ['flute', 'woodwind', 'solo', 'classical'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 24,
        zones: createVelocityZones(60, 96, 72, 'flute-sustain', 3),
        isDefault: true,
      },
      {
        id: 'staccato',
        name: 'Staccato',
        keySwitchNote: 25,
        zones: createVelocityZones(60, 96, 72, 'flute-staccato', 2),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.02, decay: 0.1, sustain: 0, release: 0.08 },
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.05, decay: 0.05, sustain: 0.95, release: 0.15 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: false },
    lfo1: { ...DEFAULT_LFO, waveform: 'sine', rate: 5, depth: 0.04, delay: 0.3, fadeIn: 0.2 },
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0.05,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: true,
    voiceStealMode: 'oldest',
    maxPolyphony: 1,
    velocityCurve: 0.1,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // BASS
  // =========================================================================
  {
    id: 'acoustic-bass',
    name: 'Acoustic Upright Bass',
    category: 'bass',
    tags: ['acoustic', 'upright', 'jazz', 'double-bass'],
    articulations: [
      {
        id: 'finger',
        name: 'Finger',
        keySwitchNote: 24,
        zones: createVelocityZones(28, 60, 40, 'upright-finger', 4),
        isDefault: true,
      },
      {
        id: 'slap',
        name: 'Slap',
        keySwitchNote: 25,
        zones: createVelocityZones(28, 60, 40, 'upright-slap', 3),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.4, sustain: 0.3, release: 0.3 },
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.01, decay: 0.5, sustain: 0.5, release: 0.4 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 3000 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0.05,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 8,
    velocityCurve: 0.2,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
  {
    id: 'electric-bass',
    name: 'Electric Bass',
    category: 'bass',
    tags: ['electric', 'finger', 'rock', 'pop'],
    articulations: [
      {
        id: 'finger',
        name: 'Finger',
        keySwitchNote: 24,
        zones: createVelocityZones(28, 67, 40, 'ebass-finger', 4),
        isDefault: true,
      },
      {
        id: 'pick',
        name: 'Pick',
        keySwitchNote: 25,
        zones: createVelocityZones(28, 67, 40, 'ebass-pick', 3),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.3, sustain: 0.6, release: 0.2 },
      },
      {
        id: 'slap',
        name: 'Slap',
        keySwitchNote: 26,
        zones: createVelocityZones(28, 67, 40, 'ebass-slap', 4),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.2, sustain: 0.4, release: 0.15 },
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.005, decay: 0.3, sustain: 0.7, release: 0.25 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.01, decay: 0.2, sustain: 0.3 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 4000, envelopeAmount: 0.2, velocitySensitivity: 0.3 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 8,
    velocityCurve: 0.3,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // GUITAR
  // =========================================================================
  {
    id: 'acoustic-guitar',
    name: 'Acoustic Guitar',
    category: 'guitar',
    tags: ['acoustic', 'nylon', 'classical', 'fingerpicking'],
    articulations: [
      {
        id: 'sustain',
        name: 'Sustain',
        keySwitchNote: 24,
        zones: createVelocityZones(40, 88, 60, 'acoustic-guitar', 4),
        isDefault: true,
      },
      {
        id: 'muted',
        name: 'Muted',
        keySwitchNote: 25,
        zones: createVelocityZones(40, 88, 60, 'acoustic-guitar-mute', 2),
        isDefault: false,
        envelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      },
      {
        id: 'harmonics',
        name: 'Harmonics',
        keySwitchNote: 26,
        zones: createVelocityZones(40, 88, 60, 'acoustic-guitar-harm', 2),
        isDefault: false,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.001, decay: 0.8, sustain: 0.3, release: 0.5 },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 8000 },
    lfo1: DEFAULT_LFO,
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 12,
    velocityCurve: 0.3,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },

  // =========================================================================
  // SYNTH
  // =========================================================================
  {
    id: 'analog-pad',
    name: 'Analog Pad',
    category: 'pads',
    tags: ['pad', 'analog', 'warm', 'lush'],
    articulations: [
      {
        id: 'pad',
        name: 'Pad',
        keySwitchNote: 0,
        zones: createVelocityZones(24, 108, 60, 'analog-pad', 2),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.8, decay: 1.0, sustain: 0.5, release: 0.8 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 3000, resonance: 1.2, envelopeAmount: 0.4 },
    lfo1: { ...DEFAULT_LFO, waveform: 'triangle', rate: 0.5, depth: 0.02 },  // Slow pitch drift
    lfo2: { ...DEFAULT_LFO, waveform: 'sine', rate: 0.3, depth: 0.15 },  // Filter mod
    pitchBendRange: 2,
    portamentoTime: 0.2,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 16,
    velocityCurve: -0.3,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
  {
    id: 'synth-lead',
    name: 'Synth Lead',
    category: 'leads',
    tags: ['lead', 'mono', 'analog', 'classic'],
    articulations: [
      {
        id: 'lead',
        name: 'Lead',
        keySwitchNote: 0,
        zones: createVelocityZones(24, 96, 60, 'synth-lead', 2),
        isDefault: true,
      },
    ],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.2 },
    filterEnvelope: { ...DEFAULT_FILTER_ENVELOPE, attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
    filter: { ...DEFAULT_FILTER, enabled: true, frequency: 2000, resonance: 2, envelopeAmount: 0.6, velocitySensitivity: 0.5 },
    lfo1: { ...DEFAULT_LFO, waveform: 'sine', rate: 6, depth: 0.05, delay: 0.2, fadeIn: 0.3 },
    lfo2: DEFAULT_LFO,
    pitchBendRange: 2,
    portamentoTime: 0.08,
    portamentoEnabled: true,
    legatoMode: true,
    monoMode: true,
    voiceStealMode: 'oldest',
    maxPolyphony: 1,
    velocityCurve: 0.4,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  },
];

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial sampler state
 */
export function createSamplerState(preset?: SamplerPreset): SamplerState {
  const defaultPreset = preset ?? SAMPLER_PRESETS[0]!;

  return {
    preset: defaultPreset,
    activeArticulation: defaultPreset.articulations.find(a => a.isDefault)?.id ?? defaultPreset.articulations[0]?.id ?? '',
    voices: [],
    heldNotes: new Set(),
    sustainPedal: false,
    sostenutoPedal: false,
    pitchBend: 0,
    modWheel: 0,
    expression: 1,
    masterVolume: 0.8,
    lastNote: -1,
    voiceCounter: 0,
    sampleLibrary: new Map(),
  };
}

// =============================================================================
// VOICE MANAGEMENT
// =============================================================================

/**
 * Find zone for note and velocity
 */
export function findZone(
  articulations: Articulation[],
  activeArticulationId: string,
  note: number,
  velocity: number
): SampleZone | null {
  const articulation = articulations.find(a => a.id === activeArticulationId);
  if (!articulation) return null;

  for (const zone of articulation.zones) {
    if (
      note >= zone.keyLow &&
      note <= zone.keyHigh &&
      velocity >= zone.velocityLow &&
      velocity <= zone.velocityHigh &&
      !zone.muted
    ) {
      return zone;
    }
  }

  return null;
}

/**
 * Create a new voice
 */
export function createVoice(
  id: string,
  note: number,
  velocity: number,
  zone: SampleZone,
  time: number
): SamplerVoice | null {
  // Get sample (handle round-robin using audio module function)
  let sample = zone.sample;
  if (zone.roundRobinSamples.length > 0) {
    // Use the audio module's round-robin selection
    const rrConfig: RoundRobinLayerConfig = {
      mode: 'roundRobin',
      currentIndex: zone.roundRobinIndex,
      resetInterval: 0,
      lastTriggerTime: 0,
    };
    const result = selectRoundRobinLayer(rrConfig, zone.roundRobinSamples.length + 1, Date.now());
    if (result.index === 0) {
      sample = zone.sample;
    } else {
      sample = zone.roundRobinSamples[result.index - 1] ?? zone.sample;
    }
    zone.roundRobinIndex = result.config.currentIndex;
  }

  if (!sample) return null;

  return {
    id,
    note,
    velocity,
    playhead: sample.startPoint,
    sample,
    zone,
    isActive: true,
    isReleasing: false,
    envelopeValue: 0,
    envelopeStage: 0,  // Attack
    envelopeTime: 0,
    filterEnvelopeValue: 0,
    filterEnvelopeStage: 0,
    lfo1Phase: 0,
    lfo2Phase: 0,
    startTime: time,
    currentPitch: note,
    targetPitch: note,
    loopDirection: 1,
    outputGain: 0,
  };
}

/**
 * Find voice to steal
 * 
 * Uses simple algorithms for backward compatibility.
 * For advanced voice management, use SamplerVoiceManager from the audio module.
 */
export function findVoiceToSteal(
  voices: SamplerVoice[],
  mode: VoiceStealMode,
  _newNote: number
): SamplerVoice | null {
  if (voices.length === 0) return null;

  switch (mode) {
    case 'oldest':
      return voices.reduce((oldest, v) =>
        v.startTime < oldest.startTime ? v : oldest
      );

    case 'quietest':
      return voices.reduce((quietest, v) =>
        v.outputGain < quietest.outputGain ? v : quietest
      );

    case 'lowest':
      return voices.reduce((lowest, v) =>
        v.note < lowest.note ? v : lowest
      );

    case 'highest':
      return voices.reduce((highest, v) =>
        v.note > highest.note ? v : highest
      );

    case 'none':
    default:
      return null;
  }
}

/**
 * Find voices to steal using audio module's advanced algorithm
 * 
 * This uses the Phase 38 audio module's voice stealing with additional features
 * like unison voice awareness and flexible priorities.
 */
export function findVoicesToStealAdvanced(
  voices: SamplerVoice[],
  mode: VoiceStealMode,
  count: number
): SamplerVoice[] {
  if (voices.length === 0 || mode === 'none') return [];

  // Convert to extended voice format for audio module
  const extendedVoices: ExtendedSamplerVoice[] = voices.map(v => ({
    id: v.id,
    state: v.isReleasing ? 'release' as CoreVoiceState : 'sustain' as CoreVoiceState,
    note: v.note,
    velocity: v.velocity,
    zoneId: v.zone.id,
    sampleId: v.sample.id,
    playhead: v.playhead,
    startTime: v.startTime,
    currentPitch: v.currentPitch,
    targetPitch: v.targetPitch,
    envelopeValue: v.envelopeValue,
    envelopeStageTime: v.envelopeTime,
    filterEnvValue: v.filterEnvelopeValue,
    lfoPhases: [v.lfo1Phase, v.lfo2Phase, 0, 0],
    outputGain: v.outputGain,
    pan: 0,
    isUnisonVoice: false,
    parentVoiceId: null,
    unisonIndex: 0,
    loopDirection: v.loopDirection as 1 | -1,
  }));

  // Map to VoicePriority
  const priorityMap: Record<VoiceStealMode, VoicePriority> = {
    'oldest': 'oldest',
    'quietest': 'quietest',
    'lowest': 'lowest',
    'highest': 'highest',
    'none': 'oldest',
  };

  const toSteal = findVoicesToSteal(extendedVoices, priorityMap[mode], count);
  
  // Find the original voices
  return toSteal
    .map(ext => voices.find(v => v.id === ext.id))
    .filter((v): v is SamplerVoice => v !== undefined);
}

// =============================================================================
// ENVELOPE PROCESSING (uses audio module)
// =============================================================================

/**
 * Process envelope and return new value
 * 
 * This uses the original time-based implementation for backward compatibility
 * with the card API. For sample-accurate processing, use the audio module's
 * processEnvelope with processModEnvelope.
 */
export function processEnvelope(
  value: number,
  stage: number,
  time: number,
  params: EnvelopeParams,
  deltaTime: number,
  isReleasing: boolean
): { value: number; stage: number; time: number } {
  let newValue = value;
  let newStage = stage;
  let newTime = time + deltaTime;

  if (isReleasing && stage !== 3) {
    newStage = 3;
    newTime = 0;
  }

  switch (newStage) {
    case 0:  // Attack
      if (params.attack <= 0) {
        newValue = 1;
        newStage = 1;
        newTime = 0;
      } else {
        newValue = Math.min(1, newTime / params.attack);
        if (newValue >= 1) {
          newStage = 1;
          newTime = 0;
        }
      }
      break;

    case 1:  // Decay
      if (params.decay <= 0) {
        newValue = params.sustain;
        newStage = 2;
        newTime = 0;
      } else {
        const decayProgress = Math.min(1, newTime / params.decay);
        newValue = 1 - (1 - params.sustain) * decayProgress;
        if (decayProgress >= 1) {
          newStage = 2;
          newTime = 0;
        }
      }
      break;

    case 2:  // Sustain
      newValue = params.sustain;
      break;

    case 3:  // Release
      if (params.release <= 0) {
        newValue = 0;
      } else {
        const releaseProgress = Math.min(1, newTime / params.release);
        newValue = value * (1 - releaseProgress);
        if (releaseProgress >= 1) {
          newValue = 0;
        }
      }
      break;
  }

  return { value: newValue, stage: newStage, time: newTime };
}

/**
 * Process envelope using audio module (sample-accurate)
 * 
 * This is the sample-accurate version that uses the Phase 38 audio modules.
 * Use this for sample-by-sample processing at the audio rate.
 */
export function processEnvelopeSampleAccurate(
  state: EnvelopeState,
  params: EnvelopeParams,
  sampleRate: number,
  noteOn: boolean,
  velocity: number = 1,
  keyOffset: number = 0
): EnvelopeState {
  const ahdsrParams = toAHDSREnvelope(params);
  return processModEnvelope(state, ahdsrParams, sampleRate, noteOn, velocity, keyOffset);
}

// =============================================================================
// INPUT PROCESSING
// =============================================================================

/**
 * Process sampler input
 */
export function processSamplerInput(
  state: SamplerState,
  input: SamplerInput
): SamplerResult {
  const outputs: SamplerOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const { note, velocity } = input;
      if (velocity === 0) {
        // Note-on with velocity 0 is note-off
        return processSamplerInput(state, { type: 'noteOff', note });
      }

      // Check for key switch
      const keySwitch = state.preset.articulations.find(a => a.keySwitchNote === note);
      if (keySwitch) {
        return {
          state: { ...state, activeArticulation: keySwitch.id },
          outputs: [{ type: 'articulationChanged', articulationId: keySwitch.id }],
        };
      }

      // Find zone for this note/velocity
      const zone = findZone(
        state.preset.articulations,
        state.activeArticulation,
        note,
        velocity
      );

      if (!zone) {
        return { state, outputs };
      }

      // Handle mono mode
      let newVoices = [...state.voices];
      if (state.preset.monoMode) {
        // Release existing voices
        newVoices = newVoices.map(v => ({ ...v, isReleasing: true }));
      }

      // Check polyphony limit
      const maxVoices = state.preset.maxPolyphony || MAX_VOICES;
      if (newVoices.filter(v => v.isActive).length >= maxVoices) {
        const toSteal = findVoiceToSteal(
          newVoices.filter(v => v.isActive),
          state.preset.voiceStealMode,
          note
        );

        if (toSteal) {
          outputs.push({ type: 'voiceStolen', voiceId: toSteal.id, note: toSteal.note, byNote: note });
          newVoices = newVoices.filter(v => v.id !== toSteal.id);
        } else {
          // Can't steal, drop note
          return { state, outputs };
        }
      }

      // Create new voice
      const voiceId = `voice-${state.voiceCounter}`;
      const voice = createVoice(voiceId, note, velocity, zone, 0);

      if (voice) {
        // Handle portamento using audio module's glide calculation
        if (state.preset.portamentoEnabled && state.lastNote >= 0) {
          voice.currentPitch = state.lastNote;
        }

        newVoices.push(voice);
        outputs.push({ type: 'voiceStart', voiceId, note, velocity });
      }

      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.add(note);

      return {
        state: {
          ...state,
          voices: newVoices,
          heldNotes: newHeldNotes,
          lastNote: note,
          voiceCounter: state.voiceCounter + 1,
        },
        outputs,
      };
    }

    case 'noteOff': {
      const { note } = input;
      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.delete(note);

      // If sustain pedal is held, don't release
      if (state.sustainPedal) {
        return { state: { ...state, heldNotes: newHeldNotes }, outputs };
      }

      // Release voices for this note
      const newVoices = state.voices.map(v => {
        if (v.note === note && !v.isReleasing) {
          return { ...v, isReleasing: true };
        }
        return v;
      });

      return {
        state: { ...state, voices: newVoices, heldNotes: newHeldNotes },
        outputs,
      };
    }

    case 'pitchBend': {
      const pitchBend = Math.max(-1, Math.min(1, input.value));
      return { state: { ...state, pitchBend }, outputs };
    }

    case 'modWheel': {
      const modWheel = Math.max(0, Math.min(1, input.value));
      return { state: { ...state, modWheel }, outputs };
    }

    case 'expression': {
      const expression = Math.max(0, Math.min(1, input.value));
      return { state: { ...state, expression }, outputs };
    }

    case 'sustainPedal': {
      const newState = { ...state, sustainPedal: input.value };

      // If pedal released, release all non-held notes
      if (!input.value) {
        const newVoices = state.voices.map(v => {
          if (!state.heldNotes.has(v.note) && !v.isReleasing) {
            return { ...v, isReleasing: true };
          }
          return v;
        });
        newState.voices = newVoices;
      }

      return { state: newState, outputs };
    }

    case 'sostenutoPedal': {
      return { state: { ...state, sostenutoPedal: input.value }, outputs };
    }

    case 'allNotesOff': {
      const newVoices = state.voices.map(v => ({ ...v, isReleasing: true }));
      return {
        state: { ...state, voices: newVoices, heldNotes: new Set() },
        outputs,
      };
    }

    case 'allSoundOff': {
      // Immediate silence
      for (const voice of state.voices) {
        outputs.push({ type: 'voiceEnd', voiceId: voice.id, note: voice.note });
      }
      return {
        state: { ...state, voices: [], heldNotes: new Set() },
        outputs,
      };
    }

    case 'loadPreset': {
      const preset = SAMPLER_PRESETS.find(p => p.id === input.presetId);
      if (!preset) {
        outputs.push({ type: 'error', message: `Preset not found: ${input.presetId}` });
        return { state, outputs };
      }

      const newState = createSamplerState(preset);
      outputs.push({ type: 'presetLoaded', presetId: preset.id });

      return { state: newState, outputs };
    }

    case 'setArticulation': {
      const articulation = state.preset.articulations.find(a => a.id === input.articulationId);
      if (articulation) {
        outputs.push({ type: 'articulationChanged', articulationId: input.articulationId });
        return { state: { ...state, activeArticulation: input.articulationId }, outputs };
      }
      return { state, outputs };
    }

    case 'setVolume': {
      const masterVolume = Math.max(0, Math.min(1, input.volume));
      return { state: { ...state, masterVolume }, outputs };
    }

    case 'setPan': {
      const newPreset = {
        ...state.preset,
        masterPan: Math.max(-1, Math.min(1, input.pan)),
      };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setTune': {
      const newPreset = {
        ...state.preset,
        masterTune: Math.max(-100, Math.min(100, input.cents)),
      };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setPitchBendRange': {
      const newPreset = {
        ...state.preset,
        pitchBendRange: Math.max(0, Math.min(24, input.semitones)),
      };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setPortamento': {
      const newPreset = {
        ...state.preset,
        portamentoTime: Math.max(0, Math.min(5, input.time)),
        portamentoEnabled: input.enabled,
      };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setLegato': {
      const newPreset = { ...state.preset, legatoMode: input.enabled };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setMono': {
      const newPreset = { ...state.preset, monoMode: input.enabled };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setFilter': {
      const newFilter = { ...state.preset.filter, ...input.config };
      const newPreset = { ...state.preset, filter: newFilter };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    case 'setEnvelope': {
      if (input.target === 'amp') {
        const newEnv = { ...state.preset.ampEnvelope, ...input.params };
        const newPreset = { ...state.preset, ampEnvelope: newEnv };
        return { state: { ...state, preset: newPreset }, outputs };
      } else {
        const newEnv = { ...state.preset.filterEnvelope, ...input.params };
        const newPreset = { ...state.preset, filterEnvelope: newEnv };
        return { state: { ...state, preset: newPreset }, outputs };
      }
    }

    case 'setLFO': {
      if (input.lfoId === 1) {
        const newLFO = { ...state.preset.lfo1, ...input.params };
        const newPreset = { ...state.preset, lfo1: newLFO };
        return { state: { ...state, preset: newPreset }, outputs };
      } else {
        const newLFO = { ...state.preset.lfo2, ...input.params };
        const newPreset = { ...state.preset, lfo2: newLFO };
        return { state: { ...state, preset: newPreset }, outputs };
      }
    }

    case 'tick': {
      const { deltaTime } = input;
      if (deltaTime <= 0) return { state, outputs };

      // Process each voice
      const newVoices: SamplerVoice[] = [];

      for (const voice of state.voices) {
        if (!voice.isActive) continue;

        // Process envelope using audio module
        const envResult = processEnvelope(
          voice.envelopeValue,
          voice.envelopeStage,
          voice.envelopeTime,
          voice.zone.envelope ?? state.preset.ampEnvelope,
          deltaTime,
          voice.isReleasing
        );

        // Check if voice finished
        if (envResult.value <= 0 && voice.isReleasing) {
          outputs.push({ type: 'voiceEnd', voiceId: voice.id, note: voice.note });
          continue;
        }

        // Process portamento using audio module's glide calculation
        let currentPitch = voice.currentPitch;
        if (state.preset.portamentoEnabled && voice.currentPitch !== voice.targetPitch) {
          const progress = Math.min(1, deltaTime / state.preset.portamentoTime);
          currentPitch = calculateGlidePitch(
            voice.currentPitch,
            voice.targetPitch,
            progress,
            'linear'
          );
          if (Math.abs(currentPitch - voice.targetPitch) < 0.01) {
            currentPitch = voice.targetPitch;
          }
        }

        newVoices.push({
          ...voice,
          envelopeValue: envResult.value,
          envelopeStage: envResult.stage,
          envelopeTime: envResult.time,
          currentPitch,
          outputGain: envResult.value * (voice.velocity / 127) * state.expression * state.masterVolume,
        });
      }

      return { state: { ...state, voices: newVoices }, outputs };
    }

    case 'midiCC': {
      const { controller, value } = input;
      switch (controller) {
        case 1:   // Mod wheel
          return processSamplerInput(state, { type: 'modWheel', value: ccToNormalized(value) });
        case 7:   // Volume
          return processSamplerInput(state, { type: 'setVolume', volume: ccToNormalized(value) });
        case 10:  // Pan
          return processSamplerInput(state, { type: 'setPan', pan: (value - 64) / 64 });
        case 11:  // Expression
          return processSamplerInput(state, { type: 'expression', value: ccToNormalized(value) });
        case 64:  // Sustain pedal
          return processSamplerInput(state, { type: 'sustainPedal', value: value >= 64 });
        case 66:  // Sostenuto
          return processSamplerInput(state, { type: 'sostenutoPedal', value: value >= 64 });
        case 123: // All notes off
          return processSamplerInput(state, { type: 'allNotesOff' });
        case 120: // All sound off
          return processSamplerInput(state, { type: 'allSoundOff' });
        default:
          return { state, outputs };
      }
    }

    case 'addSample': {
      const newLibrary = new Map(state.sampleLibrary);
      newLibrary.set(input.sample.id, input.sample);
      return { state: { ...state, sampleLibrary: newLibrary }, outputs };
    }

    case 'removeSample': {
      const newLibrary = new Map(state.sampleLibrary);
      newLibrary.delete(input.sampleId);
      return { state: { ...state, sampleLibrary: newLibrary }, outputs };
    }

    case 'setZone': {
      // Find and update zone
      const newArticulations = state.preset.articulations.map(art => ({
        ...art,
        zones: art.zones.map(z => (z.id === input.zoneId ? { ...z, ...input.config } : z)),
      }));
      const newPreset = { ...state.preset, articulations: newArticulations };
      return { state: { ...state, preset: newPreset }, outputs };
    }

    default:
      return { state, outputs };
  }
}

// =============================================================================
// CARD IMPLEMENTATION
// =============================================================================

/**
 * Card metadata
 */
export const SAMPLER_CARD_META = {
  id: 'sampler',
  name: 'Sampler',
  category: 'generator' as const,
  description: 'Multi-zone sampler with velocity layers and articulations',

  inputPorts: [
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
    { id: 'trigger', name: 'Trigger', type: 'trigger' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
  ],

  parameters: [
    { id: 'preset', name: 'Preset', type: 'enum' as const, values: SAMPLER_PRESETS.map(p => p.id), default: SAMPLER_PRESETS[0]?.id },
    { id: 'volume', name: 'Volume', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'pan', name: 'Pan', type: 'float' as const, min: -1, max: 1, default: 0 },
    { id: 'tune', name: 'Fine Tune', type: 'int' as const, min: -100, max: 100, default: 0 },
    { id: 'pitchBendRange', name: 'Pitch Bend Range', type: 'int' as const, min: 0, max: 24, default: 2 },
    { id: 'attack', name: 'Attack', type: 'float' as const, min: 0, max: 5, default: 0.001 },
    { id: 'decay', name: 'Decay', type: 'float' as const, min: 0, max: 5, default: 0.1 },
    { id: 'sustain', name: 'Sustain', type: 'float' as const, min: 0, max: 1, default: 1 },
    { id: 'release', name: 'Release', type: 'float' as const, min: 0, max: 10, default: 0.3 },
    { id: 'filterEnabled', name: 'Filter', type: 'bool' as const, default: false },
    { id: 'filterFreq', name: 'Filter Freq', type: 'float' as const, min: 20, max: 20000, default: 20000 },
    { id: 'filterRes', name: 'Filter Res', type: 'float' as const, min: 0, max: 20, default: 0.707 },
  ],
};

/**
 * Create sampler card instance
 */
export function createSamplerCard() {
  let state = createSamplerState();

  return {
    meta: SAMPLER_CARD_META,

    process(input: SamplerInput): SamplerOutput[] {
      const result = processSamplerInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): SamplerState {
      return state;
    },

    reset(): void {
      state = createSamplerState();
    },

    loadPreset(presetId: string): SamplerOutput[] {
      return this.process({ type: 'loadPreset', presetId });
    },

    getPresets(): SamplerPreset[] {
      return SAMPLER_PRESETS;
    },

    getPresetsByCategory(category: InstrumentCategory): SamplerPreset[] {
      return SAMPLER_PRESETS.filter(p => p.category === category);
    },

    getArticulations(): Articulation[] {
      return state.preset.articulations;
    },

    getActiveVoiceCount(): number {
      return state.voices.filter(v => v.isActive).length;
    },

    /**
     * Edit a zone's sample by applying a manipulation operation.
     * @param zoneId The ID of the zone to edit
     * @param operation The manipulation operation to apply
     * @param params Parameters for the operation
     * @returns The manipulation result or null if zone/sample not found
     */
    editZoneSample(
      zoneId: string,
      operation: ManipulationOperation,
      params: ManipulationParams
    ): ManipulationResult | null {
      // Find the zone across all articulations
      for (const articulation of state.preset.articulations) {
        const zone = articulation.zones.find(z => z.id === zoneId);
        if (zone && zone.sample && zone.sample.audioL) {
          // Apply the manipulation
          const result = applyManipulation(
            zone.sample.audioL,
            zone.sample.sampleRate,
            operation,
            params
          );
          
          // Update the zone's sample if we have new samples
          if (result.samples) {
            zone.sample = {
              ...zone.sample,
              audioL: result.samples,
              length: result.samples.length,
              sampleRate: result.sampleRate,
              // Update end point if it was at the end
              endPoint: zone.sample.endPoint === zone.sample.length 
                ? result.samples.length 
                : Math.min(zone.sample.endPoint, result.samples.length),
              // Update loop end if it was at the end
              loopEnd: zone.sample.loopEnd === zone.sample.length
                ? result.samples.length
                : Math.min(zone.sample.loopEnd, result.samples.length),
            };
          }
          
          return result;
        }
      }
      
      return null;
    },

    /**
     * Apply operations to multiple zones in batch.
     * @param zoneIds Array of zone IDs to process
     * @param operations Array of operations to apply to each zone
     * @returns Array of batch results for each zone
     */
    async batchEditZones(
      zoneIds: string[],
      operations: Array<{ type: ManipulationOperation; params: ManipulationParams }>
    ): Promise<BatchResult[]> {
      // Build batch jobs for each zone
      const jobs: BatchJob[] = [];
      
      for (const zoneId of zoneIds) {
        // Find the zone
        for (const articulation of state.preset.articulations) {
          const zone = articulation.zones.find(z => z.id === zoneId);
          if (zone && zone.sample && zone.sample.audioL) {
            jobs.push({
              id: zoneId,
              samples: zone.sample.audioL,
              sampleRate: zone.sample.sampleRate,
              operations,
              filename: zone.sample.name,
            });
            break;
          }
        }
      }
      
      // Process the batch
      const results = await processBatch(jobs);
      
      // Apply results back to zones
      for (const result of results) {
        if (result.success && result.result?.samples) {
          for (const articulation of state.preset.articulations) {
            const zone = articulation.zones.find(z => z.id === result.jobId);
            if (zone && zone.sample) {
              zone.sample = {
                ...zone.sample,
                audioL: result.result.samples,
                length: result.result.samples.length,
                sampleRate: result.result.sampleRate,
                endPoint: zone.sample.endPoint === zone.sample.length
                  ? result.result.samples.length
                  : Math.min(zone.sample.endPoint, result.result.samples.length),
                loopEnd: zone.sample.loopEnd === zone.sample.length
                  ? result.result.samples.length
                  : Math.min(zone.sample.loopEnd, result.result.samples.length),
              };
              break;
            }
          }
        }
      }
      
      return results;
    },

    /**
     * Get the zone by ID.
     * @param zoneId The ID of the zone to find
     * @returns The zone or null if not found
     */
    getZone(zoneId: string): SampleZone | null {
      for (const articulation of state.preset.articulations) {
        const zone = articulation.zones.find(z => z.id === zoneId);
        if (zone) return zone;
      }
      return null;
    },

    /**
     * Get all zones from the active articulation.
     * @returns Array of zones
     */
    getZones(): SampleZone[] {
      const articulation = state.preset.articulations.find(
        a => a.id === state.activeArticulation
      );
      return articulation?.zones ?? [];
    },

    /**
     * Generate waveform visualization for a zone's sample.
     * @param zoneId The ID of the zone
     * @param width Width of the waveform in samples
     * @returns WaveformOverview or null if zone/sample not found
     */
    getZoneWaveform(zoneId: string, width: number = 1000) {
      for (const articulation of state.preset.articulations) {
        const zone = articulation.zones.find(z => z.id === zoneId);
        if (zone && zone.sample && zone.sample.audioL) {
          return generateWaveformForUI(zone.sample.audioL, zone.sample.sampleRate, width);
        }
      }
      return null;
    },
  };
}
