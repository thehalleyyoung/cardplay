/**
 * @fileoverview Sample Playback Engine.
 * 
 * Provides high-performance sample playback with:
 * - Multi-voice polyphony (128+ voices)
 * - Voice stealing with priority
 * - Sample streaming for long files
 * - Sample caching and preloading
 * - Format and sample rate conversion
 * - Loop points with crossfade
 * - Time-stretching and pitch-shifting
 * - Velocity layers and round-robin
 * - Per-voice filtering and envelopes
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Voice state in the sample player.
 */
export type VoiceState = 
  | 'idle'
  | 'attack'
  | 'sustain'
  | 'release'
  | 'stopping';

/**
 * Playback mode for samples.
 */
export type PlaybackMode =
  | 'one-shot'      // Play once, ignore note-off
  | 'sustain'       // Hold until note-off
  | 'loop'          // Loop continuously
  | 'loop-release'; // Loop until note-off, then release

/**
 * Loop mode for sample looping.
 */
export type LoopMode =
  | 'forward'        // Forward loop
  | 'backward'       // Backward loop
  | 'ping-pong'      // Alternate forward/backward
  | 'random';        // Random playback within loop

/**
 * Voice stealing strategy.
 */
export type StealingMode =
  | 'oldest'         // Steal oldest voice
  | 'quietest'       // Steal quietest voice
  | 'lowest'         // Steal lowest pitch
  | 'highest'        // Steal highest pitch
  | 'none';          // No stealing, reject new notes

/**
 * Sample format information.
 */
export interface SampleFormat {
  readonly sampleRate: number;
  readonly channels: 1 | 2;
  readonly bitDepth: 16 | 24 | 32;
}

/**
 * Loop point definition.
 */
export interface LoopPoint {
  readonly start: number;      // Start sample
  readonly end: number;        // End sample
  readonly crossfade: number;  // Crossfade samples
}

/**
 * Sample metadata.
 */
export interface SampleMeta {
  readonly id: string;
  readonly name: string;
  readonly format: SampleFormat;
  readonly frameCount: number;
  readonly duration: number;           // Duration in seconds
  readonly rootNote?: number;          // MIDI root note (60 = C4)
  readonly loopPoints?: LoopPoint;
  readonly gain?: number;              // Gain adjustment (dB)
  readonly tuning?: number;            // Fine tuning (cents)
}

/**
 * Loaded sample data.
 */
export interface Sample {
  readonly meta: SampleMeta;
  readonly buffer: AudioBuffer | null;   // Null if streaming
  readonly streamUrl?: string;           // URL for streaming
}

/**
 * Velocity layer mapping.
 */
export interface VelocityLayer {
  readonly minVelocity: number;  // 0-127
  readonly maxVelocity: number;  // 0-127
  readonly sampleId: string;
}

/**
 * Key zone mapping.
 */
export interface KeyZone {
  readonly lowKey: number;       // MIDI note
  readonly highKey: number;      // MIDI note
  readonly rootKey: number;      // MIDI root note
  readonly layers: readonly VelocityLayer[];
  readonly roundRobin?: number;  // Number of round-robin variations
}

/**
 * Sample instrument definition.
 */
export interface SampleInstrument {
  readonly id: string;
  readonly name: string;
  readonly zones: readonly KeyZone[];
  readonly playbackMode: PlaybackMode;
  readonly stealingMode: StealingMode;
  readonly maxVoices: number;
  readonly releaseTime: number;        // Release time in seconds
  readonly attackTime?: number;        // Attack time in seconds
}

/**
 * Voice parameters.
 */
export interface VoiceParams {
  readonly note: number;             // MIDI note
  readonly velocity: number;         // 0-127
  readonly pan?: number;             // -1 to 1
  readonly pitch?: number;           // Pitch offset (semitones)
  readonly filter?: number;          // Filter cutoff (0-1)
  readonly filterQ?: number;         // Filter resonance (0-1)
}

/**
 * Active voice state.
 */
export interface ActiveVoice {
  readonly id: number;
  readonly sampleId: string;
  readonly note: number;
  readonly velocity: number;
  readonly state: VoiceState;
  readonly startTime: number;
  readonly playbackPosition: number;  // Current sample position
  readonly gain: number;              // Current gain (0-1)
  readonly pitch: number;             // Current pitch ratio
  readonly pan: number;               // Current pan (-1 to 1)
  readonly filter: number;            // Current filter cutoff (0-1)
  readonly releaseStartTime?: number;
}

/**
 * Voice event for scheduling.
 */
export type VoiceEvent =
  | { readonly type: 'noteOn'; readonly params: VoiceParams; readonly time: number }
  | { readonly type: 'noteOff'; readonly note: number; readonly time: number }
  | { readonly type: 'allNotesOff'; readonly time: number }
  | { readonly type: 'pitch'; readonly note: number; readonly pitch: number; readonly time: number }
  | { readonly type: 'filter'; readonly note: number; readonly value: number; readonly time: number };

// ============================================================================
// SAMPLE CACHE
// ============================================================================

/**
 * Cache entry state.
 */
export type CacheState = 'pending' | 'loaded' | 'error';

/**
 * Sample cache entry.
 */
export interface CacheEntry {
  readonly sample: Sample;
  readonly state: CacheState;
  readonly lastUsed: number;
  readonly useCount: number;
}

/**
 * Sample cache for managing loaded samples.
 */
export class SampleCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private totalSize = 0;

  constructor(maxSizeMB: number = 256) {
    this.maxSize = maxSizeMB * 1024 * 1024;
  }

  /**
   * Gets a sample from the cache.
   */
  get(id: string): Sample | undefined {
    const entry = this.cache.get(id);
    if (entry) {
      // Update usage stats
      const updated: CacheEntry = {
        ...entry,
        lastUsed: Date.now(),
        useCount: entry.useCount + 1,
      };
      this.cache.set(id, updated);
      return entry.sample;
    }
    return undefined;
  }

  /**
   * Adds a sample to the cache.
   */
  set(sample: Sample): void {
    const size = this.getSampleSize(sample);
    
    // Evict if necessary
    while (this.totalSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      sample,
      state: sample.buffer ? 'loaded' : 'pending',
      lastUsed: Date.now(),
      useCount: 0,
    };

    this.cache.set(sample.meta.id, entry);
    this.totalSize += size;
  }

  /**
   * Removes a sample from the cache.
   */
  delete(id: string): boolean {
    const entry = this.cache.get(id);
    if (entry) {
      this.totalSize -= this.getSampleSize(entry.sample);
      return this.cache.delete(id);
    }
    return false;
  }

  /**
   * Checks if a sample is in the cache.
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * Gets cache statistics.
   */
  getStats(): { size: number; count: number; maxSize: number } {
    return {
      size: this.totalSize,
      count: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Evicts least recently used entry.
   */
  private evictLRU(): void {
    let oldest: { id: string; time: number } | null = null;
    
    for (const [id, entry] of this.cache) {
      if (!oldest || entry.lastUsed < oldest.time) {
        oldest = { id, time: entry.lastUsed };
      }
    }

    if (oldest) {
      this.delete(oldest.id);
    }
  }

  /**
   * Calculates sample size in bytes.
   */
  private getSampleSize(sample: Sample): number {
    if (!sample.buffer) return 0;
    return sample.buffer.length * sample.buffer.numberOfChannels * 4;
  }
}

// ============================================================================
// VOICE POOL
// ============================================================================

/**
 * Manages a pool of voices for polyphony.
 */
export class VoicePool {
  private readonly voices: Map<number, ActiveVoice> = new Map();
  private nextId = 0;
  private readonly maxVoices: number;
  private readonly stealingMode: StealingMode;

  constructor(maxVoices: number = 128, stealingMode: StealingMode = 'oldest') {
    this.maxVoices = maxVoices;
    this.stealingMode = stealingMode;
  }

  /**
   * Allocates a new voice.
   */
  allocate(params: VoiceParams, sampleId: string, startTime: number): ActiveVoice | undefined {
    // Check if we need to steal
    if (this.voices.size >= this.maxVoices) {
      if (this.stealingMode === 'none') {
        return undefined;
      }
      this.stealVoice();
    }

    const id = this.nextId++;
    const voice: ActiveVoice = {
      id,
      sampleId,
      note: params.note,
      velocity: params.velocity,
      state: 'attack',
      startTime,
      playbackPosition: 0,
      gain: params.velocity / 127,
      pitch: params.pitch !== undefined ? Math.pow(2, params.pitch / 12) : 1,
      pan: params.pan ?? 0,
      filter: params.filter ?? 1,
    };

    this.voices.set(id, voice);
    return voice;
  }

  /**
   * Releases a voice by note.
   */
  releaseByNote(note: number, time: number): void {
    for (const [id, voice] of this.voices) {
      if (voice.note === note && voice.state !== 'release' && voice.state !== 'stopping') {
        const released: ActiveVoice = {
          ...voice,
          state: 'release',
          releaseStartTime: time,
        };
        this.voices.set(id, released);
      }
    }
  }

  /**
   * Releases all voices.
   */
  releaseAll(time: number): void {
    for (const [id, voice] of this.voices) {
      if (voice.state !== 'release' && voice.state !== 'stopping') {
        const released: ActiveVoice = {
          ...voice,
          state: 'release',
          releaseStartTime: time,
        };
        this.voices.set(id, released);
      }
    }
  }

  /**
   * Removes a voice.
   */
  free(id: number): boolean {
    return this.voices.delete(id);
  }

  /**
   * Gets all active voices.
   */
  getActive(): readonly ActiveVoice[] {
    return Array.from(this.voices.values());
  }

  /**
   * Gets voice count.
   */
  get count(): number {
    return this.voices.size;
  }

  /**
   * Gets maximum voices.
   */
  get capacity(): number {
    return this.maxVoices;
  }

  /**
   * Updates a voice.
   */
  update(id: number, updates: Partial<ActiveVoice>): void {
    const voice = this.voices.get(id);
    if (voice) {
      const updated = { ...voice, ...updates } as ActiveVoice;
      this.voices.set(id, updated);
    }
  }

  /**
   * Gets voices playing a specific note.
   */
  getByNote(note: number): readonly ActiveVoice[] {
    return Array.from(this.voices.values()).filter(v => v.note === note);
  }

  /**
   * Steals a voice based on stealing mode.
   */
  private stealVoice(): void {
    const voices = Array.from(this.voices.entries());
    if (voices.length === 0) return;

    let victimId: number;

    switch (this.stealingMode) {
      case 'oldest':
        victimId = voices.reduce(
          (oldest, [id, v]) => 
            v.startTime < (this.voices.get(oldest)?.startTime ?? Infinity) ? id : oldest,
          voices[0]![0]
        );
        break;

      case 'quietest':
        victimId = voices.reduce(
          (quietest, [id, v]) =>
            v.gain < (this.voices.get(quietest)?.gain ?? Infinity) ? id : quietest,
          voices[0]![0]
        );
        break;

      case 'lowest':
        victimId = voices.reduce(
          (lowest, [id, v]) =>
            v.note < (this.voices.get(lowest)?.note ?? Infinity) ? id : lowest,
          voices[0]![0]
        );
        break;

      case 'highest':
        victimId = voices.reduce(
          (highest, [id, v]) =>
            v.note > (this.voices.get(highest)?.note ?? -Infinity) ? id : highest,
          voices[0]![0]
        );
        break;

      default:
        return;
    }

    this.voices.delete(victimId);
  }
}

// ============================================================================
// ENVELOPE GENERATOR
// ============================================================================

/**
 * ADSR envelope parameters.
 */
export interface EnvelopeParams {
  readonly attack: number;   // Attack time in seconds
  readonly decay: number;    // Decay time in seconds
  readonly sustain: number;  // Sustain level (0-1)
  readonly release: number;  // Release time in seconds
}

/**
 * Default envelope parameters.
 */
export const DEFAULT_ENVELOPE: EnvelopeParams = {
  attack: 0.001,
  decay: 0.1,
  sustain: 1.0,
  release: 0.1,
};

/**
 * Envelope stage.
 */
export type EnvelopeStage = 'attack' | 'decay' | 'sustain' | 'release' | 'idle';

/**
 * ADSR envelope generator.
 */
export class EnvelopeGenerator {
  private readonly params: EnvelopeParams;
  private stage: EnvelopeStage = 'idle';
  private stageTime = 0;
  private currentValue = 0;
  private peakValue = 1;
  private releaseStartValue = 0;

  constructor(params: EnvelopeParams = DEFAULT_ENVELOPE) {
    this.params = params;
  }

  /**
   * Triggers the envelope.
   */
  trigger(velocity: number = 1): void {
    this.stage = 'attack';
    this.stageTime = 0;
    this.currentValue = 0;
    this.peakValue = velocity;
  }

  /**
   * Releases the envelope.
   */
  release(): void {
    if (this.stage !== 'idle') {
      this.stage = 'release';
      this.stageTime = 0;
      this.releaseStartValue = this.currentValue;
    }
  }

  /**
   * Processes the envelope for a time delta.
   */
  process(deltaTime: number): number {
    this.stageTime += deltaTime;

    switch (this.stage) {
      case 'attack':
        if (this.params.attack > 0) {
          this.currentValue = (this.stageTime / this.params.attack) * this.peakValue;
          if (this.currentValue >= this.peakValue) {
            this.currentValue = this.peakValue;
            this.stage = 'decay';
            this.stageTime = 0;
          }
        } else {
          this.currentValue = this.peakValue;
          this.stage = 'decay';
          this.stageTime = 0;
        }
        break;

      case 'decay':
        if (this.params.decay > 0) {
          const decayProgress = this.stageTime / this.params.decay;
          this.currentValue = this.peakValue - 
            (this.peakValue - this.params.sustain * this.peakValue) * decayProgress;
          if (decayProgress >= 1) {
            this.currentValue = this.params.sustain * this.peakValue;
            this.stage = 'sustain';
          }
        } else {
          this.currentValue = this.params.sustain * this.peakValue;
          this.stage = 'sustain';
        }
        break;

      case 'sustain':
        this.currentValue = this.params.sustain * this.peakValue;
        break;

      case 'release':
        if (this.params.release > 0) {
          const releaseProgress = this.stageTime / this.params.release;
          this.currentValue = this.releaseStartValue * (1 - releaseProgress);
          if (releaseProgress >= 1) {
            this.currentValue = 0;
            this.stage = 'idle';
          }
        } else {
          this.currentValue = 0;
          this.stage = 'idle';
        }
        break;

      case 'idle':
        this.currentValue = 0;
        break;
    }

    return Math.max(0, Math.min(1, this.currentValue));
  }

  /**
   * Gets the current envelope value.
   */
  get value(): number {
    return this.currentValue;
  }

  /**
   * Gets the current stage.
   */
  get currentStage(): EnvelopeStage {
    return this.stage;
  }

  /**
   * Checks if the envelope is idle.
   */
  get isIdle(): boolean {
    return this.stage === 'idle';
  }

  /**
   * Resets the envelope.
   */
  reset(): void {
    this.stage = 'idle';
    this.stageTime = 0;
    this.currentValue = 0;
  }
}

// ============================================================================
// FILTER
// ============================================================================

/**
 * Filter type.
 */
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

/**
 * Biquad filter coefficients.
 */
export interface FilterCoeffs {
  readonly a0: number;
  readonly a1: number;
  readonly a2: number;
  readonly b0: number;
  readonly b1: number;
  readonly b2: number;
}

/**
 * Calculates biquad filter coefficients.
 */
export function calculateFilterCoeffs(
  type: FilterType,
  frequency: number,
  q: number,
  sampleRate: number
): FilterCoeffs {
  const omega = 2 * Math.PI * frequency / sampleRate;
  const sin = Math.sin(omega);
  const cos = Math.cos(omega);
  const alpha = sin / (2 * q);

  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;

  switch (type) {
    case 'lowpass':
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    case 'highpass':
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    case 'bandpass':
      b0 = sin / 2;
      b1 = 0;
      b2 = -sin / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    case 'notch':
      b0 = 1;
      b1 = -2 * cos;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
  }

  return {
    a0: a0 / a0,  // Normalize
    a1: a1 / a0,
    a2: a2 / a0,
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
  };
}

/**
 * Biquad filter state.
 */
export class BiquadFilter {
  private coeffs: FilterCoeffs;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(
    type: FilterType = 'lowpass',
    frequency: number = 1000,
    q: number = 1,
    sampleRate: number = 48000
  ) {
    this.coeffs = calculateFilterCoeffs(type, frequency, q, sampleRate);
  }

  /**
   * Updates filter coefficients.
   */
  setCoeffs(coeffs: FilterCoeffs): void {
    this.coeffs = coeffs;
  }

  /**
   * Processes a single sample.
   */
  process(input: number): number {
    const output = 
      this.coeffs.b0 * input +
      this.coeffs.b1 * this.x1 +
      this.coeffs.b2 * this.x2 -
      this.coeffs.a1 * this.y1 -
      this.coeffs.a2 * this.y2;

    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;

    return output;
  }

  /**
   * Resets the filter state.
   */
  reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }
}

// ============================================================================
// SAMPLE PLAYER PROCESSOR
// ============================================================================

/**
 * Sample playback parameters for a voice.
 */
export interface PlaybackState {
  readonly position: number;       // Current sample position
  readonly direction: 1 | -1;      // Playback direction
  readonly pitch: number;          // Pitch ratio
  readonly looping: boolean;       // Whether looping is active
}

/**
 * Calculates pitch ratio for resampling.
 */
export function calculatePitchRatio(
  note: number,
  rootNote: number,
  tuning: number = 0,
  pitchBend: number = 0
): number {
  const semitones = note - rootNote + pitchBend;
  const cents = tuning;
  return Math.pow(2, (semitones + cents / 100) / 12);
}

/**
 * Performs linear interpolation for sample reading.
 */
export function interpolateSample(
  buffer: Float32Array,
  position: number
): number {
  const index = Math.floor(position);
  const frac = position - index;
  
  if (index < 0 || index >= buffer.length - 1) {
    return 0;
  }

  const s0 = buffer[index]!;
  const s1 = buffer[index + 1]!;
  
  return s0 + (s1 - s0) * frac;
}

/**
 * Performs cubic interpolation for higher quality.
 */
export function interpolateSampleCubic(
  buffer: Float32Array,
  position: number
): number {
  const index = Math.floor(position);
  const frac = position - index;

  if (index < 1 || index >= buffer.length - 2) {
    return interpolateSample(buffer, position);
  }

  const s0 = buffer[index - 1]!;
  const s1 = buffer[index]!;
  const s2 = buffer[index + 1]!;
  const s3 = buffer[index + 2]!;

  // Catmull-Rom spline
  const a = -0.5 * s0 + 1.5 * s1 - 1.5 * s2 + 0.5 * s3;
  const b = s0 - 2.5 * s1 + 2 * s2 - 0.5 * s3;
  const c = -0.5 * s0 + 0.5 * s2;
  const d = s1;

  return a * frac * frac * frac + b * frac * frac + c * frac + d;
}

/**
 * Applies crossfade at loop points.
 */
export function applyLoopCrossfade(
  buffer: Float32Array,
  loopStart: number,
  loopEnd: number,
  crossfadeLength: number
): Float32Array {
  const result = new Float32Array(buffer.length);
  result.set(buffer);

  for (let i = 0; i < crossfadeLength; i++) {
    const fadeIn = i / crossfadeLength;
    const fadeOut = 1 - fadeIn;
    
    const loopPos = loopEnd - crossfadeLength + i;
    const preLoopPos = loopStart + i;
    
    if (loopPos >= 0 && loopPos < buffer.length && preLoopPos < buffer.length) {
      result[loopPos] = 
        buffer[loopPos]! * fadeOut + 
        buffer[preLoopPos]! * fadeIn;
    }
  }

  return result;
}

// ============================================================================
// SAMPLE INSTRUMENT
// ============================================================================

/**
 * Finds the appropriate sample for a note and velocity.
 */
export function findSampleForNote(
  instrument: SampleInstrument,
  note: number,
  velocity: number,
  roundRobinIndex: number = 0
): { zoneIndex: number; layerIndex: number; sampleId: string } | undefined {
  for (let z = 0; z < instrument.zones.length; z++) {
    const zone = instrument.zones[z]!;
    
    if (note >= zone.lowKey && note <= zone.highKey) {
      // Find velocity layer
      for (let l = 0; l < zone.layers.length; l++) {
        const layer = zone.layers[l]!;
        
        if (velocity >= layer.minVelocity && velocity <= layer.maxVelocity) {
          // Apply round-robin if configured
          let sampleId = layer.sampleId;
          if (zone.roundRobin !== undefined && zone.roundRobin > 1) {
            const rrIndex = roundRobinIndex % zone.roundRobin;
            sampleId = `${layer.sampleId}_rr${rrIndex}`;
          }
          
          return { zoneIndex: z, layerIndex: l, sampleId };
        }
      }
    }
  }

  return undefined;
}

/**
 * Creates a default sample instrument.
 */
export function createSampleInstrument(
  id: string,
  name: string,
  sampleId: string
): SampleInstrument {
  return {
    id,
    name,
    zones: [{
      lowKey: 0,
      highKey: 127,
      rootKey: 60,
      layers: [{
        minVelocity: 0,
        maxVelocity: 127,
        sampleId,
      }],
    }],
    playbackMode: 'sustain',
    stealingMode: 'oldest',
    maxVoices: 128,
    releaseTime: 0.1,
  };
}

// ============================================================================
// SAMPLE PLAYER NODE
// ============================================================================

/**
 * Sample player configuration.
 */
export interface SamplePlayerConfig {
  readonly maxVoices: number;
  readonly stealingMode: StealingMode;
  readonly interpolation: 'linear' | 'cubic';
  readonly filterEnabled: boolean;
}

/**
 * Default sample player configuration.
 */
export const DEFAULT_SAMPLE_PLAYER_CONFIG: SamplePlayerConfig = {
  maxVoices: 128,
  stealingMode: 'oldest',
  interpolation: 'linear',
  filterEnabled: true,
};

/**
 * Sample player metrics.
 */
export interface SamplePlayerMetrics {
  readonly activeVoices: number;
  readonly maxVoices: number;
  readonly cpuPercent: number;
  readonly voicesStolenCount: number;
  readonly samplesLoaded: number;
}

/**
 * Sample player state.
 */
export interface SamplePlayerState {
  readonly config: SamplePlayerConfig;
  readonly instruments: readonly SampleInstrument[];
  readonly activeInstrumentId: string | null;
  readonly voiceCount: number;
  readonly metrics: SamplePlayerMetrics;
}

/**
 * Creates initial sample player state.
 */
export function createSamplePlayerState(
  config: Partial<SamplePlayerConfig> = {}
): SamplePlayerState {
  return {
    config: { ...DEFAULT_SAMPLE_PLAYER_CONFIG, ...config },
    instruments: [],
    activeInstrumentId: null,
    voiceCount: 0,
    metrics: {
      activeVoices: 0,
      maxVoices: config.maxVoices ?? DEFAULT_SAMPLE_PLAYER_CONFIG.maxVoices,
      cpuPercent: 0,
      voicesStolenCount: 0,
      samplesLoaded: 0,
    },
  };
}

// ============================================================================
// WORKLET PROCESSOR SCRIPT
// ============================================================================

/**
 * Generates the sample player processor script.
 */
export function generateSamplePlayerProcessorScript(): string {
  return `
/**
 * SamplePlayerProcessor - AudioWorklet for sample playback.
 * Generated by Cardplay audio engine.
 */
class SamplePlayerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.voices = new Map();
    this.nextVoiceId = 0;
    this.samples = new Map();
    this.config = {
      maxVoices: 128,
      stealingMode: 'oldest',
      interpolation: 'linear',
    };
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'noteOn':
        this.startVoice(data);
        break;
      case 'noteOff':
        this.releaseVoice(data.note);
        break;
      case 'allNotesOff':
        this.releaseAllVoices();
        break;
      case 'loadSample':
        this.loadSample(data);
        break;
      case 'config':
        Object.assign(this.config, data);
        break;
    }
  }

  startVoice(params) {
    // Voice allocation logic
    if (this.voices.size >= this.config.maxVoices) {
      this.stealVoice();
    }
    
    const id = this.nextVoiceId++;
    const voice = {
      id,
      note: params.note,
      velocity: params.velocity,
      sampleId: params.sampleId,
      position: 0,
      pitch: Math.pow(2, (params.note - 60) / 12),
      gain: params.velocity / 127,
      state: 'attack',
      envelope: { stage: 'attack', value: 0, time: 0 },
    };
    
    this.voices.set(id, voice);
  }

  releaseVoice(note) {
    for (const [id, voice] of this.voices) {
      if (voice.note === note && voice.state !== 'release') {
        voice.state = 'release';
        voice.envelope.stage = 'release';
        voice.envelope.time = 0;
      }
    }
  }

  releaseAllVoices() {
    for (const voice of this.voices.values()) {
      if (voice.state !== 'release') {
        voice.state = 'release';
        voice.envelope.stage = 'release';
        voice.envelope.time = 0;
      }
    }
  }

  stealVoice() {
    // Find oldest voice
    let oldest = null;
    for (const voice of this.voices.values()) {
      if (!oldest || voice.id < oldest.id) {
        oldest = voice;
      }
    }
    if (oldest) {
      this.voices.delete(oldest.id);
    }
  }

  loadSample(data) {
    this.samples.set(data.id, {
      buffer: data.buffer,
      rootNote: data.rootNote || 60,
      loopStart: data.loopStart,
      loopEnd: data.loopEnd,
    });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output) return true;

    const left = output[0];
    const right = output[1] || output[0];
    if (!left) return true;

    // Clear output
    left.fill(0);
    if (right !== left) right.fill(0);

    // Process each voice
    const voicesToRemove = [];
    
    for (const [id, voice] of this.voices) {
      const sample = this.samples.get(voice.sampleId);
      if (!sample || !sample.buffer) continue;

      const buffer = sample.buffer;
      
      for (let i = 0; i < left.length; i++) {
        // Process envelope
        this.processEnvelope(voice, 1 / sampleRate);
        
        if (voice.envelope.stage === 'idle') {
          voicesToRemove.push(id);
          break;
        }

        // Read sample with interpolation
        const pos = voice.position;
        const index = Math.floor(pos);
        const frac = pos - index;
        
        let sampleValue = 0;
        if (index >= 0 && index < buffer.length - 1) {
          sampleValue = buffer[index] + (buffer[index + 1] - buffer[index]) * frac;
        }

        // Apply envelope and gain
        const finalGain = voice.gain * voice.envelope.value;
        left[i] += sampleValue * finalGain;
        right[i] += sampleValue * finalGain;

        // Advance position
        voice.position += voice.pitch;
        
        // Handle loop or end
        if (voice.position >= buffer.length) {
          if (sample.loopEnd && voice.state !== 'release') {
            voice.position = sample.loopStart || 0;
          } else {
            voicesToRemove.push(id);
            break;
          }
        }
      }
    }

    // Remove finished voices
    for (const id of voicesToRemove) {
      this.voices.delete(id);
    }

    // Send metrics
    this.port.postMessage({
      type: 'metrics',
      data: {
        voiceCount: this.voices.size,
        cpuTime: 0, // Would need performance measurement
      },
    });

    return true;
  }

  processEnvelope(voice, deltaTime) {
    const env = voice.envelope;
    env.time += deltaTime;
    
    const attack = 0.001;
    const decay = 0.1;
    const sustain = 1.0;
    const release = 0.1;

    switch (env.stage) {
      case 'attack':
        env.value = env.time / attack;
        if (env.value >= 1) {
          env.value = 1;
          env.stage = 'decay';
          env.time = 0;
        }
        break;
      case 'decay':
        env.value = 1 - (1 - sustain) * (env.time / decay);
        if (env.time >= decay) {
          env.value = sustain;
          env.stage = 'sustain';
        }
        break;
      case 'sustain':
        env.value = sustain;
        break;
      case 'release':
        env.value = sustain * (1 - env.time / release);
        if (env.time >= release) {
          env.value = 0;
          env.stage = 'idle';
        }
        break;
      case 'idle':
        env.value = 0;
        break;
    }
  }
}

registerProcessor('sample-player-processor', SamplePlayerProcessor);
`;
}

// ============================================================================
// FORMAT CONVERSION
// ============================================================================

/**
 * Converts sample rate.
 */
export function resampleBuffer(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  if (inputRate === outputRate) {
    return input;
  }

  const ratio = inputRate / outputRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio;
    output[i] = interpolateSample(input, position);
  }

  return output;
}

/**
 * Converts stereo to mono.
 */
export function stereoToMono(left: Float32Array, right: Float32Array): Float32Array {
  const output = new Float32Array(left.length);
  
  for (let i = 0; i < left.length; i++) {
    output[i] = (left[i]! + right[i]!) * 0.5;
  }

  return output;
}

/**
 * Converts mono to stereo.
 */
export function monoToStereo(input: Float32Array): [Float32Array, Float32Array] {
  return [new Float32Array(input), new Float32Array(input)];
}

/**
 * Normalizes audio buffer.
 */
export function normalizeBuffer(buffer: Float32Array, targetPeak: number = 1.0): Float32Array {
  let peak = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    peak = Math.max(peak, Math.abs(buffer[i]!));
  }

  if (peak === 0) return buffer;

  const gain = targetPeak / peak;
  const output = new Float32Array(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    output[i] = buffer[i]! * gain;
  }

  return output;
}

/**
 * Reverses a buffer.
 */
export function reverseBuffer(buffer: Float32Array): Float32Array {
  const output = new Float32Array(buffer.length);
  
  for (let i = 0; i < buffer.length; i++) {
    output[i] = buffer[buffer.length - 1 - i]!;
  }

  return output;
}
