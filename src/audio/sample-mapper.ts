/**
 * @fileoverview Sample Auto-Mapper
 * 
 * Automatically creates multi-sample instruments by:
 * - Detecting pitch of each sample
 * - Organizing by pitch, velocity, and round-robin
 * - Creating optimal zone mappings
 * - Filling gaps with pitch-shifted samples
 * 
 * @module @cardplay/core/audio/sample-mapper
 */

import { detectPitchFromBuffer, midiToNoteName } from './pitch-detect';
import type { PitchResult } from './pitch-detect';
import type {
  SampleZone,
  SampleData,
  SamplerPreset,
  PlaybackMode,
  LoopMode,
  EnvelopeParams,
  FilterParams,
  InstrumentCategory,
} from '../cards/sampler';
import {
  DEFAULT_AMP_ENVELOPE,
  DEFAULT_FILTER_ENVELOPE,
  DEFAULT_FILTER,
  DEFAULT_LFO,
} from '../cards/sampler';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum pitch shift in semitones before quality degrades */
export const MAX_PITCH_SHIFT_UP = 7;

/** Maximum pitch shift down in semitones */
export const MAX_PITCH_SHIFT_DOWN = 12;

/** Minimum velocity for a velocity layer */
export const MIN_VELOCITY = 1;

/** Maximum velocity */
export const MAX_VELOCITY = 127;

/** Standard velocity layer boundaries (8 layers) */
export const VELOCITY_LAYERS_8 = [1, 16, 32, 48, 64, 80, 96, 112, 128];

/** Standard velocity layer boundaries (4 layers) */
export const VELOCITY_LAYERS_4 = [1, 32, 64, 96, 128];

/** MIDI note range */
export const MIDI_NOTE_MIN = 0;
export const MIDI_NOTE_MAX = 127;

/** Piano key range (A0 to C8) */
export const PIANO_RANGE = { low: 21, high: 108 };

// ============================================================================
// TYPES
// ============================================================================

/**
 * A sample with detected pitch information.
 */
export interface AnalyzedSample {
  /** Sample identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** The audio buffer */
  readonly buffer: AudioBuffer;
  /** Detected pitch result */
  readonly pitch: PitchResult;
  /** Inferred velocity layer (1-127) */
  readonly velocity: number;
  /** Round-robin group index */
  readonly roundRobinIndex: number;
  /** Fine tuning offset in cents */
  readonly fineTuneCents: number;
  /** Sample duration in seconds */
  readonly duration: number;
  /** Whether pitch was detected or inferred */
  readonly pitchSource: 'detected' | 'filename' | 'inferred' | 'manual';
}

/**
 * A group of samples at the same pitch.
 */
export interface SampleGroup {
  /** MIDI note this group represents */
  readonly midiNote: number;
  /** Samples in this group */
  readonly samples: readonly AnalyzedSample[];
  /** Velocity layers available */
  readonly velocityLayers: readonly number[];
  /** Round-robin count */
  readonly roundRobinCount: number;
}

/**
 * Mapping options.
 */
export interface MappingOptions {
  /** Low note of the keyboard range */
  readonly lowNote?: number;
  /** High note of the keyboard range */
  readonly highNote?: number;
  /** Maximum pitch shift up in semitones */
  readonly maxPitchShiftUp?: number;
  /** Maximum pitch shift down in semitones */
  readonly maxPitchShiftDown?: number;
  /** Number of velocity layers to create */
  readonly velocityLayers?: number;
  /** Create round-robin variations */
  readonly enableRoundRobin?: boolean;
  /** Fill gaps in velocity layers */
  readonly fillVelocityGaps?: boolean;
  /** Instrument category for defaults */
  readonly category?: InstrumentCategory;
  /** Playback mode */
  readonly playbackMode?: PlaybackMode;
}

/**
 * Result of auto-mapping.
 */
export interface MappingResult {
  /** Created zones */
  readonly zones: readonly SampleZone[];
  /** Sample groups organized by pitch */
  readonly groups: readonly SampleGroup[];
  /** Pitch range covered */
  readonly pitchRange: { low: number; high: number };
  /** Statistics */
  readonly stats: MappingStats;
  /** Warnings during mapping */
  readonly warnings: readonly string[];
}

/**
 * Mapping statistics.
 */
export interface MappingStats {
  /** Total samples analyzed */
  readonly totalSamples: number;
  /** Samples with detected pitch */
  readonly pitchedSamples: number;
  /** Unique pitches detected */
  readonly uniquePitches: number;
  /** Total zones created */
  readonly totalZones: number;
  /** Notes covered */
  readonly notesCovered: number;
  /** Average pitch shift required */
  readonly avgPitchShift: number;
  /** Maximum pitch shift used */
  readonly maxPitchShift: number;
}

/**
 * Velocity layer configuration.
 */
export interface VelocityLayerConfig {
  readonly lowVelocity: number;
  readonly highVelocity: number;
  readonly samples: readonly AnalyzedSample[];
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze a single sample to detect its pitch and characteristics.
 */
export function analyzeSample(
  id: string,
  name: string,
  buffer: AudioBuffer,
  filenameHint?: { midiNote?: number; velocity?: number; roundRobin?: number }
): AnalyzedSample {
  // Detect pitch from audio
  const pitch = detectPitchFromBuffer(buffer);
  
  let finalMidiNote = pitch.midiNote;
  let pitchSource: AnalyzedSample['pitchSource'] = 'detected';
  let fineTuneCents = pitch.fineTuneCents;

  // Use filename hint if detection failed or has low confidence
  if (!pitch.isPitched || pitch.confidence < 0.5) {
    if (filenameHint?.midiNote !== undefined) {
      finalMidiNote = filenameHint.midiNote;
      pitchSource = 'filename';
      fineTuneCents = 0;
    } else {
      pitchSource = 'inferred';
    }
  }

  // Use velocity from filename or infer from amplitude
  let velocity = filenameHint?.velocity ?? 100;
  if (velocity === 100 && pitch.rms > 0) {
    // Infer velocity from RMS (rough approximation)
    velocity = Math.round(Math.min(127, Math.max(1, pitch.rms * 200)));
  }

  return {
    id,
    name,
    buffer,
    pitch: {
      ...pitch,
      midiNote: finalMidiNote,
      noteName: midiToNoteName(finalMidiNote),
    },
    velocity,
    roundRobinIndex: filenameHint?.roundRobin ?? 0,
    fineTuneCents,
    duration: buffer.duration,
    pitchSource,
  };
}

/**
 * Analyze multiple samples in batch.
 */
export async function analyzeSamples(
  samples: readonly { id: string; name: string; buffer: AudioBuffer }[],
  filenameParser?: (name: string) => { midiNote?: number; velocity?: number; roundRobin?: number },
  onProgress?: (completed: number, total: number) => void
): Promise<AnalyzedSample[]> {
  const results: AnalyzedSample[] = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]!;
    const hint = filenameParser?.(sample.name);
    const analyzed = analyzeSample(sample.id, sample.name, sample.buffer, hint);
    results.push(analyzed);
    
    onProgress?.(i + 1, samples.length);
    
    // Yield to prevent blocking
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

/**
 * Group samples by their detected pitch.
 */
export function groupSamplesByPitch(
  samples: readonly AnalyzedSample[]
): SampleGroup[] {
  const groups = new Map<number, AnalyzedSample[]>();
  
  for (const sample of samples) {
    const note = sample.pitch.midiNote;
    const existing = groups.get(note) ?? [];
    existing.push(sample);
    groups.set(note, existing);
  }
  
  const result: SampleGroup[] = [];
  
  for (const [midiNote, groupSamples] of groups) {
    // Sort by velocity then round-robin
    const sorted = [...groupSamples].sort((a, b) => {
      if (a.velocity !== b.velocity) return a.velocity - b.velocity;
      return a.roundRobinIndex - b.roundRobinIndex;
    });
    
    // Get unique velocity layers
    const velocities = [...new Set(sorted.map(s => s.velocity))].sort((a, b) => a - b);
    
    // Get round-robin count
    const maxRR = Math.max(...sorted.map(s => s.roundRobinIndex)) + 1;
    
    result.push({
      midiNote,
      samples: sorted,
      velocityLayers: velocities,
      roundRobinCount: maxRR,
    });
  }
  
  // Sort by pitch
  result.sort((a, b) => a.midiNote - b.midiNote);
  
  return result;
}

// ============================================================================
// ZONE CREATION
// ============================================================================

/**
 * Create a sample data structure from an analyzed sample.
 */
export function createSampleData(
  sample: AnalyzedSample,
  sampleIndex: number
): SampleData {
  const buffer = sample.buffer;
  const channelData = buffer.getChannelData(0);
  
  const result: SampleData = {
    id: `sample-${sampleIndex}`,
    name: sample.name,
    audioL: new Float32Array(channelData),
    sampleRate: buffer.sampleRate,
    length: buffer.length,
    rootNote: sample.pitch.midiNote,
    startPoint: 0,
    endPoint: buffer.length,
    loopStart: 0,
    loopEnd: buffer.length,
    loopMode: 'noLoop' as LoopMode,
    loopCrossfade: 0,
    fineTune: sample.fineTuneCents,
    volumeDb: 0,
    pan: 0,
  };
  if (buffer.numberOfChannels > 1) {
    result.audioR = new Float32Array(buffer.getChannelData(1));
  }
  return result;
}

/**
 * Create a zone for a key range.
 */
export function createZone(
  sample: AnalyzedSample,
  keyLow: number,
  keyHigh: number,
  velocityLow: number,
  velocityHigh: number,
  zoneIndex: number,
  options: { playbackMode?: PlaybackMode } = {}
): SampleZone {
  const sampleData = createSampleData(sample, zoneIndex);
  
  return {
    id: `zone-${zoneIndex}`,
    keyLow,
    keyHigh,
    rootKey: sample.pitch.midiNote,
    velocityLow,
    velocityHigh,
    sample: sampleData,
    roundRobinSamples: [],
    roundRobinIndex: 0,
    volume: 1,
    pan: 0,
    transpose: 0,
    fineTune: sample.fineTuneCents,
    playbackMode: options.playbackMode ?? 'sustain',
    fixedPitch: false,
    envelope: null,
    outputBus: 0,
    muted: false,
    solo: false,
    exclusiveGroup: null,
  };
}

/**
 * Find the best sample to cover a target note.
 */
export function findBestSampleForNote(
  groups: readonly SampleGroup[],
  targetNote: number,
  targetVelocity: number,
  maxShiftUp: number,
  maxShiftDown: number
): { sample: AnalyzedSample; pitchShift: number } | null {
  let bestSample: AnalyzedSample | null = null;
  let bestShift = Infinity;
  
  for (const group of groups) {
    const shift = targetNote - group.midiNote;
    
    // Check if within pitch shift range
    if (shift > maxShiftUp || shift < -maxShiftDown) continue;
    
    // Find best velocity match
    let closestVelSample: AnalyzedSample | null = null;
    let closestVelDiff = Infinity;
    
    for (const sample of group.samples) {
      const velDiff = Math.abs(sample.velocity - targetVelocity);
      if (velDiff < closestVelDiff) {
        closestVelDiff = velDiff;
        closestVelSample = sample;
      }
    }
    
    if (closestVelSample && Math.abs(shift) < Math.abs(bestShift)) {
      bestShift = shift;
      bestSample = closestVelSample;
    }
  }
  
  if (bestSample === null) return null;
  
  return { sample: bestSample, pitchShift: bestShift };
}

// ============================================================================
// AUTO-MAPPING ALGORITHM
// ============================================================================

/**
 * Automatically create keyboard zones from analyzed samples.
 */
export function autoMapSamples(
  samples: readonly AnalyzedSample[],
  options: MappingOptions = {}
): MappingResult {
  const {
    lowNote = PIANO_RANGE.low,
    highNote = PIANO_RANGE.high,
    maxPitchShiftUp = MAX_PITCH_SHIFT_UP,
    maxPitchShiftDown = MAX_PITCH_SHIFT_DOWN,
    velocityLayers = 1,
    playbackMode = 'sustain',
  } = options;

  const warnings: string[] = [];
  const zones: SampleZone[] = [];
  
  // Group samples by pitch
  const groups = groupSamplesByPitch(samples);
  
  if (groups.length === 0) {
    warnings.push('No pitched samples found');
    return {
      zones: [],
      groups: [],
      pitchRange: { low: 60, high: 60 },
      stats: {
        totalSamples: samples.length,
        pitchedSamples: 0,
        uniquePitches: 0,
        totalZones: 0,
        notesCovered: 0,
        avgPitchShift: 0,
        maxPitchShift: 0,
      },
      warnings,
    };
  }

  // Determine velocity layer boundaries
  const velBoundaries = calculateVelocityBoundaries(velocityLayers);
  
  // Track statistics
  let totalPitchShift = 0;
  let maxPitchShift = 0;
  let notesCovered = 0;
  let zoneIndex = 0;

  // Create zones for each note in range
  for (let note = lowNote; note <= highNote; note++) {
    for (let velLayer = 0; velLayer < velBoundaries.length - 1; velLayer++) {
      const velLow = velBoundaries[velLayer]!;
      const velHigh = velBoundaries[velLayer + 1]! - 1;
      const targetVel = Math.floor((velLow + velHigh) / 2);
      
      // Find best sample for this note
      const match = findBestSampleForNote(
        groups,
        note as number,
        targetVel,
        maxPitchShiftUp,
        maxPitchShiftDown
      );
      
      if (match) {
        const zone = createZone(
          match.sample,
          note,
          note,
          velLow,
          velHigh,
          zoneIndex++,
          { playbackMode }
        );
        zones.push(zone);
        
        totalPitchShift += Math.abs(match.pitchShift);
        maxPitchShift = Math.max(maxPitchShift, Math.abs(match.pitchShift));
        if (velLayer === 0) notesCovered++;
      }
    }
  }

  // Merge consecutive zones with the same sample
  const mergedZones = mergeConsecutiveZones(zones);

  // Calculate statistics
  const pitchedSamples = samples.filter(s => s.pitchSource === 'detected').length;
  
  return {
    zones: mergedZones,
    groups,
    pitchRange: {
      low: groups[0]!.midiNote,
      high: groups[groups.length - 1]!.midiNote,
    },
    stats: {
      totalSamples: samples.length,
      pitchedSamples,
      uniquePitches: groups.length,
      totalZones: mergedZones.length,
      notesCovered,
      avgPitchShift: zones.length > 0 ? totalPitchShift / zones.length : 0,
      maxPitchShift,
    },
    warnings,
  };
}

/**
 * Calculate velocity layer boundaries.
 */
function calculateVelocityBoundaries(numLayers: number): number[] {
  if (numLayers <= 1) return [1, 128];
  if (numLayers === 4) return VELOCITY_LAYERS_4;
  if (numLayers === 8) return VELOCITY_LAYERS_8;
  
  // Calculate even distribution
  const boundaries: number[] = [1];
  const step = Math.floor(127 / numLayers);
  
  for (let i = 1; i < numLayers; i++) {
    boundaries.push(i * step);
  }
  boundaries.push(128);
  
  return boundaries;
}

/**
 * Merge consecutive zones that use the same sample and root key.
 */
function mergeConsecutiveZones(zones: readonly SampleZone[]): SampleZone[] {
  if (zones.length === 0) return [];
  
  const sorted = [...zones].sort((a, b) => {
    if (a.keyLow !== b.keyLow) return a.keyLow - b.keyLow;
    return a.velocityLow - b.velocityLow;
  });
  
  const merged: SampleZone[] = [];
  let current = { ...sorted[0] };
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    
    // Check if can merge (same sample, same velocity range, consecutive keys)
    const canMerge = 
      current.sample?.id === next.sample?.id &&
      current.rootKey === next.rootKey &&
      current.velocityLow === next.velocityLow &&
      current.velocityHigh === next.velocityHigh &&
      (current.keyHigh ?? 0) + 1 === next.keyLow;
    
    if (canMerge) {
      current.keyHigh = next.keyHigh;
    } else {
      merged.push(current as SampleZone);
      current = { ...next };
    }
  }
  merged.push(current as SampleZone);
  
  // Re-assign IDs
  return merged.map((zone, i) => ({
    ...zone,
    id: `zone-${i}`,
  }));
}

// ============================================================================
// PRESET GENERATION
// ============================================================================

/**
 * Create a sampler preset from mapped zones.
 */
export function createSamplerPreset(
  name: string,
  zones: readonly SampleZone[],
  options: {
    category?: InstrumentCategory;
    tags?: string[];
    description?: string;
    ampEnvelope?: Partial<EnvelopeParams>;
    filter?: Partial<FilterParams>;
  } = {}
): SamplerPreset {
  const {
    category = 'synth',
    tags = [],
    ampEnvelope,
    filter,
  } = options;

  // Create default articulation with all zones
  const articulation = {
    id: 'main',
    name: 'Main',
    keySwitchNote: -1,
    zones: [...zones] as SampleZone[],
    isDefault: true,
  };

  const preset: SamplerPreset = {
    id: `preset-${Date.now()}`,
    name,
    category,
    tags,
    articulations: [articulation],
    ampEnvelope: { ...DEFAULT_AMP_ENVELOPE, ...ampEnvelope },
    filterEnvelope: DEFAULT_FILTER_ENVELOPE,
    filter: { ...DEFAULT_FILTER, ...filter },
    lfo1: { ...DEFAULT_LFO, depth: 0 },
    lfo2: { ...DEFAULT_LFO, depth: 0 },
    pitchBendRange: 2,
    portamentoTime: 0.05,
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
  if (options.description !== undefined) {
    preset.description = options.description;
  }
  return preset;
}

/**
 * Default envelope settings for different instrument categories.
 */
export const CATEGORY_ENVELOPES: Record<InstrumentCategory, Partial<EnvelopeParams>> = {
  piano: { attack: 0.001, decay: 0.5, sustain: 0.3, release: 0.5 },
  keys: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
  organ: { attack: 0.01, decay: 0.1, sustain: 1.0, release: 0.1 },
  guitar: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 0.3 },
  bass: { attack: 0.001, decay: 0.3, sustain: 0.6, release: 0.2 },
  strings: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.4 },
  brass: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.2 },
  woodwinds: { attack: 0.03, decay: 0.2, sustain: 0.7, release: 0.2 },
  synth: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
  pads: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 0.8 },
  leads: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.2 },
  drums: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  percussion: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
  ethnic: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
  sfx: { attack: 0.001, decay: 0.1, sustain: 1.0, release: 0.1 },
  vocal: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 },
};

// ============================================================================
// HIGH-LEVEL BUILDER
// ============================================================================

/**
 * Build a complete sampler instrument from audio buffers.
 */
export async function buildInstrumentFromBuffers(
  name: string,
  buffers: readonly { id: string; name: string; buffer: AudioBuffer }[],
  options: MappingOptions & {
    filenameParser?: (name: string) => { midiNote?: number; velocity?: number; roundRobin?: number };
    onProgress?: (stage: string, progress: number) => void;
  } = {}
): Promise<{
  preset: SamplerPreset;
  mapping: MappingResult;
  samples: readonly AnalyzedSample[];
}> {
  const { filenameParser, onProgress, ...mappingOptions } = options;

  // Analyze samples
  onProgress?.('Analyzing samples...', 0);
  const analyzed = await analyzeSamples(
    buffers,
    filenameParser,
    (done, total) => onProgress?.('Analyzing samples...', done / total * 0.4)
  );

  // Auto-map
  onProgress?.('Creating zones...', 0.5);
  const mapping = autoMapSamples(analyzed, mappingOptions);

  // Create preset
  onProgress?.('Building preset...', 0.9);
  const category = mappingOptions.category ?? 'synth';
  const preset = createSamplerPreset(name, mapping.zones, {
    category,
    ampEnvelope: CATEGORY_ENVELOPES[category],
  });

  onProgress?.('Complete!', 1);

  return {
    preset,
    mapping,
    samples: analyzed,
  };
}

// ============================================================================
// FILENAME PARSERS
// ============================================================================

/**
 * Standard filename parser for samples.
 * Handles patterns like: violin_C4_mf.wav, Piano-A#3-loud.wav
 */
export function standardFilenameParser(
  filename: string
): { midiNote?: number; velocity?: number; roundRobin?: number } {
  const result: { midiNote?: number; velocity?: number; roundRobin?: number } = {};
  
  // Parse note name
  const noteMatch = filename.match(/(?:^|[_\-\s])([A-Ga-g])([#b]?)(\d)(?:[_\-\s]|$|\.)/);
  if (noteMatch) {
    const [, note, accidental, octaveStr] = noteMatch;
    const noteMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let semitone = noteMap[note!.toUpperCase()] ?? 0;
    if (accidental === '#') semitone += 1;
    if (accidental === 'b') semitone -= 1;
    result.midiNote = (parseInt(octaveStr ?? '0') + 1) * 12 + semitone;
  }
  
  // Parse velocity
  const lowerName = filename.toLowerCase();
  // Order matters - longer patterns first to avoid partial matches
  const velocityMarkers: [RegExp, number][] = [
    [/(?:^|[_\-\s])fff(?:[_\-\s]|$|\.)/, 127],
    [/(?:^|[_\-\s])ppp(?:[_\-\s]|$|\.)/, 16],
    [/(?:^|[_\-\s])ff(?:[_\-\s]|$|\.)/, 112],
    [/(?:^|[_\-\s])pp(?:[_\-\s]|$|\.)/, 32],
    [/(?:^|[_\-\s])mf(?:[_\-\s]|$|\.)/, 80],
    [/(?:^|[_\-\s])mp(?:[_\-\s]|$|\.)/, 64],
    [/(?:^|[_\-\s])f(?:[_\-\s]|$|\.)/, 96],
    [/(?:^|[_\-\s])p(?:[_\-\s]|$|\.)/, 48],
    [/(?:^|[_\-\s])soft(?:[_\-\s]|$|\.)/, 48],
    [/(?:^|[_\-\s])medium(?:[_\-\s]|$|\.)/, 80],
    [/(?:^|[_\-\s])hard(?:[_\-\s]|$|\.)/, 112],
    [/(?:^|[_\-\s])loud(?:[_\-\s]|$|\.)/, 112],
    [/(?:^|[_\-\s])gentle(?:[_\-\s]|$|\.)/, 32],
  ];
  
  for (const [pattern, vel] of velocityMarkers) {
    if (pattern.test(lowerName)) {
      result.velocity = vel;
      break;
    }
  }
  
  // Parse round-robin
  const rrMatch = lowerName.match(/(?:rr|round[\s_-]?robin)[\s_-]?(\d)/);
  if (rrMatch?.[1]) {
    result.roundRobin = parseInt(rrMatch[1]) - 1;
  }
  
  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analyzeSample,
  analyzeSamples,
  groupSamplesByPitch,
  autoMapSamples,
  createSamplerPreset,
  buildInstrumentFromBuffers,
  standardFilenameParser,
  findBestSampleForNote,
  createZone,
  createSampleData,
  CATEGORY_ENVELOPES,
  MAX_PITCH_SHIFT_UP,
  MAX_PITCH_SHIFT_DOWN,
  PIANO_RANGE,
};
