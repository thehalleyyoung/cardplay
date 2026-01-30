/**
 * @fileoverview Canonical Representations for Music Theory
 * 
 * Implements Phase C0 items C006-C030:
 * - Musical specification invariants
 * - Canonical naming conventions
 * - Time representation
 * - Pitch class sets
 * - MIDI utilities
 * 
 * These types and utilities are shared across TS and have corresponding
 * Prolog predicates in the knowledge base.
 * 
 * @module @cardplay/ai/theory/canonical-representations
 */

// Re-export core types from music-spec
export type {
  RootName,
  ModeName,
  ChordQuality,
  CultureTag,
  StyleTag,
  TonalityModel,
  GalantSchemaName,
  OrnamentType,
  AccentModel,
  TalaName,
  JatiType,
  CelticTuneType,
  ChineseModeName,
  RagaName,
} from './music-spec';

// ============================================================================
// C006: Musical Specification Invariants
// ============================================================================

/**
 * C006: Musical specification invariants (tempo/meter/key consistency rules).
 * These rules define what constitutes a valid musical specification.
 */
export interface MusicSpecInvariants {
  /** Tempo must be positive and within reasonable bounds */
  readonly tempoRange: { min: number; max: number };
  /** Meter numerator must be positive */
  readonly meterNumeratorMin: number;
  /** Meter denominator must be a power of 2 */
  readonly validDenominators: readonly number[];
  /** Key root must be a valid pitch class */
  readonly validRoots: readonly string[];
  /** Mode must be recognized */
  readonly recognizedModes: readonly string[];
}

export const MUSIC_SPEC_INVARIANTS: MusicSpecInvariants = {
  tempoRange: { min: 20, max: 400 },
  meterNumeratorMin: 1,
  validDenominators: [1, 2, 4, 8, 16, 32],
  validRoots: [
    'c', 'csharp', 'dflat', 'd', 'dsharp', 'eflat', 'e', 'f',
    'fsharp', 'gflat', 'g', 'gsharp', 'aflat', 'a', 'asharp', 'bflat', 'b'
  ],
  recognizedModes: [
    'major', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian',
    'aeolian', 'locrian', 'natural_minor', 'harmonic_minor', 'melodic_minor',
    'pentatonic_major', 'pentatonic_minor', 'blues', 'whole_tone', 'chromatic'
  ],
};

/**
 * Validate that a spec satisfies invariants.
 */
export function validateSpecInvariants(spec: {
  tempo?: number;
  meter?: { numerator: number; denominator: number };
  key?: { root: string; mode: string };
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (spec.tempo !== undefined) {
    if (spec.tempo < MUSIC_SPEC_INVARIANTS.tempoRange.min) {
      errors.push(`Tempo ${spec.tempo} is below minimum ${MUSIC_SPEC_INVARIANTS.tempoRange.min}`);
    }
    if (spec.tempo > MUSIC_SPEC_INVARIANTS.tempoRange.max) {
      errors.push(`Tempo ${spec.tempo} exceeds maximum ${MUSIC_SPEC_INVARIANTS.tempoRange.max}`);
    }
  }
  
  if (spec.meter !== undefined) {
    if (spec.meter.numerator < MUSIC_SPEC_INVARIANTS.meterNumeratorMin) {
      errors.push(`Meter numerator must be at least ${MUSIC_SPEC_INVARIANTS.meterNumeratorMin}`);
    }
    if (!MUSIC_SPEC_INVARIANTS.validDenominators.includes(spec.meter.denominator)) {
      errors.push(`Meter denominator ${spec.meter.denominator} must be a power of 2`);
    }
  }
  
  if (spec.key !== undefined) {
    if (!MUSIC_SPEC_INVARIANTS.validRoots.includes(spec.key.root)) {
      errors.push(`Unknown key root: ${spec.key.root}`);
    }
    if (!MUSIC_SPEC_INVARIANTS.recognizedModes.includes(spec.key.mode)) {
      errors.push(`Unknown mode: ${spec.key.mode}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// C013: Phrase Boundary Representation
// ============================================================================

/**
 * C013: Phrase boundary concept used by tracker + arranger + phrase tools.
 */
export interface PhraseBoundary {
  /** Position in beats from start */
  readonly position: number;
  /** Strength of boundary (0-1, 1 = strongest) */
  readonly strength: number;
  /** Type of boundary */
  readonly type: PhraseBoundaryType;
  /** Optional label */
  readonly label?: string;
}

export type PhraseBoundaryType =
  | 'phrase_start' | 'phrase_end'
  | 'subphrase' | 'section'
  | 'cadence' | 'pickup';

// ============================================================================
// C014: Schema Representation
// ============================================================================

/**
 * C014: Galant schema representation with full voice-leading details.
 */
export interface GalantSchema {
  readonly name: string;
  /** Bass scale degrees in sequence */
  readonly bassLine: readonly number[];
  /** Upper voice scale degree options */
  readonly upperVoices: readonly (readonly number[])[];
  /** Harmonic rhythm (beats per chord) */
  readonly harmonicRhythm: number;
  /** Target cadence at end */
  readonly cadenceTarget?: CadenceTargetType;
  /** Typical length in bars */
  readonly lengthBars: number;
}

export type CadenceTargetType =
  | 'tonic' | 'dominant' | 'subdominant'
  | 'mediant' | 'submediant' | 'leading_tone';

/**
 * Built-in galant schemas from music-theory-galant.pl
 */
export const GALANT_SCHEMAS: Record<string, GalantSchema> = {
  prinner: {
    name: 'Prinner',
    bassLine: [4, 3, 2, 1],
    upperVoices: [[6, 5, 4, 3], [4, 3, 2, 1]],
    harmonicRhythm: 1,
    cadenceTarget: 'tonic',
    lengthBars: 4,
  },
  romanesca: {
    name: 'Romanesca',
    bassLine: [1, 7, 6, 3, 4, 1, 2, 1],
    upperVoices: [[3, 2, 1, 5, 4, 3, 2, 3]],
    harmonicRhythm: 1,
    cadenceTarget: 'tonic',
    lengthBars: 4,
  },
  monte: {
    name: 'Monte',
    bassLine: [4, 5, 6],
    upperVoices: [[6, 7, 1]],
    harmonicRhythm: 2,
    lengthBars: 4,
  },
  fonte: {
    name: 'Fonte',
    bassLine: [4, 3, 2, 1],
    upperVoices: [[2, 1, 7, 1]],
    harmonicRhythm: 2,
    cadenceTarget: 'tonic',
    lengthBars: 4,
  },
  meyer: {
    name: 'Meyer',
    bassLine: [1, 7, 4, 3, 2, 1],
    upperVoices: [[3, 2, 6, 5, 4, 3]],
    harmonicRhythm: 1,
    cadenceTarget: 'tonic',
    lengthBars: 4,
  },
};

// ============================================================================
// C016: Meter Accent Model
// ============================================================================

/**
 * C016: Meter accent model representation (beat strength by position).
 */
export interface MeterAccentModel {
  readonly name: string;
  /** Number of beats in pattern */
  readonly beatsPerBar: number;
  /** Accent weights (0-1) for each beat position */
  readonly accentWeights: readonly number[];
  /** Optional swing ratio (1.0 = straight) */
  readonly swingRatio?: number;
}

export const METER_ACCENT_MODELS: Record<string, MeterAccentModel> = {
  '4/4_standard': {
    name: '4/4 Standard',
    beatsPerBar: 4,
    accentWeights: [1.0, 0.3, 0.7, 0.3],
  },
  '3/4_waltz': {
    name: '3/4 Waltz',
    beatsPerBar: 3,
    accentWeights: [1.0, 0.4, 0.4],
  },
  '6/8_compound': {
    name: '6/8 Compound',
    beatsPerBar: 6,
    accentWeights: [1.0, 0.3, 0.3, 0.7, 0.3, 0.3],
  },
  '4/4_swing': {
    name: '4/4 Swing',
    beatsPerBar: 4,
    accentWeights: [1.0, 0.2, 0.7, 0.4],
    swingRatio: 1.67,
  },
  'celtic_reel': {
    name: 'Celtic Reel',
    beatsPerBar: 4,
    accentWeights: [1.0, 0.5, 0.8, 0.5],
  },
  'celtic_jig': {
    name: 'Celtic Jig',
    beatsPerBar: 6,
    accentWeights: [1.0, 0.4, 0.4, 0.8, 0.4, 0.4],
  },
};

// ============================================================================
// C017: Tala Representation
// ============================================================================

/**
 * C017: Carnatic tala representation.
 */
export interface Tala {
  readonly name: string;
  /** Anga (component) groupings */
  readonly angas: readonly TalaAnga[];
  /** Total aksharas (beats) per cycle */
  readonly cycleLength: number;
  /** Default jati (laghu length) */
  readonly defaultJati: number;
}

export interface TalaAnga {
  readonly type: 'laghu' | 'drutam' | 'anudrutam';
  /** Number of aksharas */
  readonly length: number;
  /** Visual gesture (clap, wave, etc.) */
  readonly gesture: 'clap' | 'wave' | 'finger';
}

export const TALAS: Record<string, Tala> = {
  adi: {
    name: 'Adi Tala',
    angas: [
      { type: 'laghu', length: 4, gesture: 'clap' },
      { type: 'drutam', length: 2, gesture: 'wave' },
      { type: 'drutam', length: 2, gesture: 'wave' },
    ],
    cycleLength: 8,
    defaultJati: 4,
  },
  rupaka: {
    name: 'Rupaka Tala',
    angas: [
      { type: 'drutam', length: 2, gesture: 'wave' },
      { type: 'laghu', length: 4, gesture: 'clap' },
    ],
    cycleLength: 6,
    defaultJati: 4,
  },
  misra_chapu: {
    name: 'Misra Chapu',
    angas: [
      { type: 'laghu', length: 3, gesture: 'clap' },
      { type: 'laghu', length: 4, gesture: 'clap' },
    ],
    cycleLength: 7,
    defaultJati: 4,
  },
  khanda_chapu: {
    name: 'Khanda Chapu',
    angas: [
      { type: 'laghu', length: 2, gesture: 'clap' },
      { type: 'laghu', length: 3, gesture: 'clap' },
    ],
    cycleLength: 5,
    defaultJati: 4,
  },
};

// ============================================================================
// C018: Celtic Tune Type Representation
// ============================================================================

/**
 * C018: Celtic tune type representation.
 */
export interface CelticTuneTypeSpec {
  readonly name: string;
  /** Time signature */
  readonly meter: { numerator: number; denominator: number };
  /** Typical tempo range */
  readonly tempoRange: { min: number; max: number };
  /** Typical form (e.g., AABB) */
  readonly typicalForm: string;
  /** Characteristic rhythm pattern */
  readonly rhythmPattern?: string;
}

export const CELTIC_TUNE_TYPES: Record<string, CelticTuneTypeSpec> = {
  reel: {
    name: 'Reel',
    meter: { numerator: 4, denominator: 4 },
    tempoRange: { min: 100, max: 130 },
    typicalForm: 'AABB',
    rhythmPattern: 'eighth-note based',
  },
  jig: {
    name: 'Jig',
    meter: { numerator: 6, denominator: 8 },
    tempoRange: { min: 100, max: 132 },
    typicalForm: 'AABB',
    rhythmPattern: 'compound duple',
  },
  slip_jig: {
    name: 'Slip Jig',
    meter: { numerator: 9, denominator: 8 },
    tempoRange: { min: 100, max: 130 },
    typicalForm: 'AABB',
    rhythmPattern: 'compound triple',
  },
  hornpipe: {
    name: 'Hornpipe',
    meter: { numerator: 4, denominator: 4 },
    tempoRange: { min: 70, max: 90 },
    typicalForm: 'AABB',
    rhythmPattern: 'dotted-rhythm swing',
  },
  strathspey: {
    name: 'Strathspey',
    meter: { numerator: 4, denominator: 4 },
    tempoRange: { min: 100, max: 120 },
    typicalForm: 'AABB',
    rhythmPattern: 'Scotch snap',
  },
  polka: {
    name: 'Polka',
    meter: { numerator: 2, denominator: 4 },
    tempoRange: { min: 110, max: 140 },
    typicalForm: 'AABB',
  },
  air: {
    name: 'Air',
    meter: { numerator: 4, denominator: 4 },
    tempoRange: { min: 50, max: 80 },
    typicalForm: 'ABAB or through-composed',
  },
};

// ============================================================================
// C019: Chinese Pentatonic Mode Representation
// ============================================================================

/**
 * C019: Chinese pentatonic mode representation.
 */
export interface ChineseModeSpec {
  readonly name: string;
  /** Western name equivalent */
  readonly westernEquivalent: string;
  /** Intervals from root in semitones */
  readonly intervals: readonly number[];
  /** Scale degrees present */
  readonly degrees: readonly number[];
  /** Character/mood associations */
  readonly character: string;
}

export const CHINESE_MODES: Record<string, ChineseModeSpec> = {
  gong: {
    name: '宫 Gong',
    westernEquivalent: 'Major pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degrees: [1, 2, 3, 5, 6],
    character: 'Bright, majestic, ceremonial',
  },
  shang: {
    name: '商 Shang',
    westernEquivalent: 'Dorian pentatonic',
    intervals: [0, 2, 5, 7, 10],
    degrees: [1, 2, 4, 5, 7],
    character: 'Sad, melancholic',
  },
  jiao: {
    name: '角 Jiao',
    westernEquivalent: 'Phrygian pentatonic',
    intervals: [0, 3, 5, 8, 10],
    degrees: [1, 3, 4, 6, 7],
    character: 'Mournful, angry',
  },
  zhi: {
    name: '徵 Zhi',
    westernEquivalent: 'Mixolydian pentatonic',
    intervals: [0, 2, 5, 7, 9],
    degrees: [1, 2, 4, 5, 6],
    character: 'Joyful, festive',
  },
  yu: {
    name: '羽 Yu',
    westernEquivalent: 'Minor pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degrees: [1, 3, 4, 5, 7],
    character: 'Sorrowful, gentle',
  },
};

// ============================================================================
// C027: Time Representation
// ============================================================================

/**
 * C027: Time representation types.
 */
export type TimeUnit = 'ticks' | 'beats' | 'bars' | 'aksharas' | 'seconds';

export interface TimeValue {
  readonly value: number;
  readonly unit: TimeUnit;
}

/**
 * Ticks per quarter note (standard MIDI resolution).
 */
export const TICKS_PER_BEAT = 480;

/**
 * Convert between time units.
 */
export function convertTime(
  value: number,
  fromUnit: TimeUnit,
  toUnit: TimeUnit,
  context: {
    tempo: number;
    ticksPerBeat?: number;
    beatsPerBar?: number;
    talaLength?: number; // aksharas per cycle
  }
): number {
  const { tempo, ticksPerBeat = TICKS_PER_BEAT, beatsPerBar = 4 } = context;
  
  // Convert to beats first
  let beats: number;
  switch (fromUnit) {
    case 'ticks':
      beats = value / ticksPerBeat;
      break;
    case 'beats':
      beats = value;
      break;
    case 'bars':
      beats = value * beatsPerBar;
      break;
    case 'aksharas':
      beats = value; // Aksharas map 1:1 to beats in this model
      break;
    case 'seconds':
      beats = (value * tempo) / 60;
      break;
  }
  
  // Convert from beats to target
  switch (toUnit) {
    case 'ticks':
      return beats * ticksPerBeat;
    case 'beats':
      return beats;
    case 'bars':
      return beats / beatsPerBar;
    case 'aksharas':
      return beats; // Simple mapping
    case 'seconds':
      return (beats * 60) / tempo;
  }
}

// ============================================================================
// C028: Microtiming/Swing Representation
// ============================================================================

/**
 * C028: Microtiming/swing representation.
 */
export interface SwingSettings {
  /** Swing ratio (1.0 = straight, 2.0 = full triplet swing) */
  readonly ratio: number;
  /** Which beat divisions to swing (e.g., eighth notes) */
  readonly swingDivision: 'eighths' | 'sixteenths';
  /** Strength of swing (0-1, 0 = off) */
  readonly strength: number;
}

export const SWING_PRESETS: Record<string, SwingSettings> = {
  straight: { ratio: 1.0, swingDivision: 'eighths', strength: 0 },
  light_swing: { ratio: 1.2, swingDivision: 'eighths', strength: 0.5 },
  medium_swing: { ratio: 1.5, swingDivision: 'eighths', strength: 0.8 },
  triplet_swing: { ratio: 2.0, swingDivision: 'eighths', strength: 1.0 },
  shuffle: { ratio: 1.67, swingDivision: 'eighths', strength: 1.0 },
  sixteenth_shuffle: { ratio: 1.5, swingDivision: 'sixteenths', strength: 0.7 },
};

// ============================================================================
// C029: MIDI ↔ Note Name Utilities
// ============================================================================

/**
 * C029: MIDI note number to note name mapping.
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Convert MIDI note number to note name.
 */
export function midiToNoteName(
  midi: number,
  options: { useFlats?: boolean; includeOctave?: boolean } = {}
): string {
  const { useFlats = false, includeOctave = true } = options;
  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = useFlats ? NOTE_NAMES_FLAT[pitchClass] : NOTE_NAMES[pitchClass];
  return includeOctave ? `${name}${octave}` : name!;
}

/**
 * Convert note name to MIDI note number.
 */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-Ga-g])([#bsS]?)(-?\d+)?$/);
  if (!match) throw new Error(`Invalid note name: ${name}`);
  
  const [, letter, accidental, octaveStr] = match;
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  
  const baseNote: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  
  let pitchClass = baseNote[letter!.toUpperCase()]!;
  if (accidental === '#' || accidental === 's' || accidental === 'S') {
    pitchClass += 1;
  } else if (accidental === 'b') {
    pitchClass -= 1;
  }
  
  return (octave + 1) * 12 + pitchClass;
}

/**
 * Get pitch class (0-11) from MIDI note.
 */
export function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

// ============================================================================
// C030: Pitch Class Set Representation
// ============================================================================

/**
 * C030: Pitch class set representation.
 * Used for key detection and raga matching.
 */
export interface PitchClassSet {
  /** Bit vector representation (12 bits) */
  readonly bits: number;
  /** Array of pitch classes present */
  readonly pitchClasses: readonly number[];
  /** Optional label */
  readonly label?: string;
}

/**
 * Create a pitch class set from an array of pitch classes.
 */
export function createPitchClassSet(
  pitchClasses: readonly number[],
  label?: string
): PitchClassSet {
  const normalized = pitchClasses.map(pc => ((pc % 12) + 12) % 12);
  const uniqueSet = new Set(normalized);
  const unique = Array.from(uniqueSet).sort((a, b) => a - b);
  const bits = unique.reduce((acc, pc) => acc | (1 << pc), 0);
  return label !== undefined
    ? { bits, pitchClasses: unique, label }
    : { bits, pitchClasses: unique };
}

/**
 * Create a pitch class set from MIDI notes.
 */
export function pitchClassSetFromMidi(midiNotes: readonly number[]): PitchClassSet {
  return createPitchClassSet(midiNotes.map(midiToPitchClass));
}

/**
 * Check if one pitch class set is a subset of another.
 */
export function pitchClassSetSubset(subset: PitchClassSet, superset: PitchClassSet): boolean {
  return (subset.bits & superset.bits) === subset.bits;
}

/**
 * Compute Jaccard similarity between two pitch class sets.
 */
export function pitchClassSetSimilarity(a: PitchClassSet, b: PitchClassSet): number {
  const intersection = countBits(a.bits & b.bits);
  const union = countBits(a.bits | b.bits);
  return union > 0 ? intersection / union : 0;
}

function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}

/**
 * Standard pitch class sets for common scales.
 */
export const SCALE_PITCH_CLASS_SETS: Record<string, PitchClassSet> = {
  major: createPitchClassSet([0, 2, 4, 5, 7, 9, 11], 'Major'),
  natural_minor: createPitchClassSet([0, 2, 3, 5, 7, 8, 10], 'Natural Minor'),
  harmonic_minor: createPitchClassSet([0, 2, 3, 5, 7, 8, 11], 'Harmonic Minor'),
  dorian: createPitchClassSet([0, 2, 3, 5, 7, 9, 10], 'Dorian'),
  phrygian: createPitchClassSet([0, 1, 3, 5, 7, 8, 10], 'Phrygian'),
  lydian: createPitchClassSet([0, 2, 4, 6, 7, 9, 11], 'Lydian'),
  mixolydian: createPitchClassSet([0, 2, 4, 5, 7, 9, 10], 'Mixolydian'),
  pentatonic_major: createPitchClassSet([0, 2, 4, 7, 9], 'Pentatonic Major'),
  pentatonic_minor: createPitchClassSet([0, 3, 5, 7, 10], 'Pentatonic Minor'),
  blues: createPitchClassSet([0, 3, 5, 6, 7, 10], 'Blues'),
  whole_tone: createPitchClassSet([0, 2, 4, 6, 8, 10], 'Whole Tone'),
};

// ============================================================================
// C020: KB Layering Decision
// ============================================================================

/**
 * C020: Specification of which knowledge lives where.
 * This defines the canonical separation of concerns.
 */
export const KB_RESPONSIBILITIES = {
  'music-theory.pl': [
    'Basic pitch/interval/chord definitions',
    'Scale and mode definitions',
    'Key detection profiles',
    'Voice leading rules',
    'Harmonic function',
  ],
  'composition-patterns.pl': [
    'Phrase patterns',
    'Melody generation',
    'Rhythm patterns',
    'Genre-specific idioms',
    'Form templates',
  ],
  'music-theory-galant.pl': [
    'Galant schemata',
    'Cadence types',
    'Voice-leading models',
    'Schema variations',
  ],
  'music-theory-film.pl': [
    'Film moods',
    'Harmonic devices',
    'Orchestration patterns',
    'Leitmotif structures',
  ],
  'music-theory-world.pl': [
    'Carnatic ragas and talas',
    'Celtic tune types',
    'Chinese modes',
    'Ornament definitions',
    'Non-Western scales',
  ],
  'music-spec.pl': [
    'MusicSpec term structure',
    'Constraint predicates',
    'Normalization rules',
    'Conflict detection',
    'Card-to-fact mapping',
  ],
} as const;

// ============================================================================
// C039: Schema Similarity Metric
// ============================================================================

/**
 * C039: Schema similarity metric for fuzzy matching to real phrases.
 * Compares a phrase's characteristics to known schema templates.
 */
export interface SchemaSimilarityResult {
  schema: string;
  score: number; // 0-100
  matchedFeatures: SchemaFeatureMatch[];
  missingFeatures: string[];
}

export interface SchemaFeatureMatch {
  feature: 'bass_line' | 'upper_voice' | 'degree_pattern' | 'cadence' | 'rhythm';
  weight: number;
  match: number; // 0-1
  details: string;
}

/**
 * Weights for schema similarity calculation.
 * Bass line and degree pattern are most diagnostic.
 */
export const SCHEMA_SIMILARITY_WEIGHTS: Record<SchemaFeatureMatch['feature'], number> = {
  bass_line: 0.30,
  degree_pattern: 0.25,
  upper_voice: 0.20,
  cadence: 0.15,
  rhythm: 0.10,
};

/**
 * Calculate schema similarity score from feature matches.
 */
export function calculateSchemaSimilarity(matches: SchemaFeatureMatch[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const match of matches) {
    const weight = SCHEMA_SIMILARITY_WEIGHTS[match.feature] * match.weight;
    weightedSum += match.match * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
}

/**
 * Schema matching thresholds.
 */
export const SCHEMA_MATCH_THRESHOLDS = {
  /** Strong match - highly confident this is the schema */
  strong: 80,
  /** Good match - likely this schema with some variation */
  good: 60,
  /** Partial match - shares features but may be different */
  partial: 40,
  /** Weak match - only tangential similarity */
  weak: 20,
} as const;

// ============================================================================
// C040: Raga Similarity Metric
// ============================================================================

/**
 * C040: Raga similarity metric for approximate matching in 12-TET.
 * Accounts for the fact that ragas use microtones not available in 12-TET.
 */
export interface RagaSimilarityResult {
  raga: string;
  score: number; // 0-100
  pitchClassMatch: number; // 0-1, how well pitch classes match
  arohaMatch: number; // 0-1, ascending pattern match
  avarohaMatch: number; // 0-1, descending pattern match
  vadiMatch: boolean; // Does the phrase emphasize the vadi?
  samvadiMatch: boolean; // Does it emphasize the samvadi?
  notes: string[];
}

/**
 * Important ragas mapped to their 12-TET approximations.
 * Real ragas have microtonal shrutis not capturable here.
 */
export const RAGA_12TET_APPROXIMATIONS: Record<string, {
  aroha: number[]; // ascending pitch classes
  avaroha: number[]; // descending pitch classes
  vadi: number; // most important note
  samvadi: number; // second most important
  pakad: number[]; // characteristic phrase
  thaat: string; // parent scale
}> = {
  yaman: {
    aroha: [0, 2, 4, 6, 7, 9, 11], // C D E F# G A B
    avaroha: [0, 11, 9, 7, 6, 4, 2],
    vadi: 7, // G (Pa)
    samvadi: 2, // D (Re)
    pakad: [7, 6, 4, 2, 0], // G F# E D C
    thaat: 'kalyan',
  },
  bhairav: {
    aroha: [0, 1, 4, 5, 7, 8, 11], // C Db E F G Ab B
    avaroha: [0, 11, 8, 7, 5, 4, 1],
    vadi: 1, // Db (komal Re)
    samvadi: 8, // Ab (komal Dha)
    pakad: [0, 1, 4, 5, 4, 1, 0], 
    thaat: 'bhairav',
  },
  bhairavi: {
    aroha: [0, 1, 3, 5, 7, 8, 10], // C Db Eb F G Ab Bb
    avaroha: [0, 10, 8, 7, 5, 3, 1],
    vadi: 3, // Eb (komal Ga)
    samvadi: 10, // Bb (komal Ni)
    pakad: [0, 1, 3, 1, 0],
    thaat: 'bhairavi',
  },
  darbari: {
    aroha: [0, 2, 3, 5, 7, 8, 10], // C D Eb F G Ab Bb (with microtones)
    avaroha: [0, 10, 8, 7, 5, 3, 2],
    vadi: 2, // D (Re)
    samvadi: 8, // Ab (komal Dha)
    pakad: [0, 2, 3, 2, 0, 10, 0],
    thaat: 'asavari',
  },
  todi: {
    aroha: [0, 1, 3, 6, 7, 8, 11], // C Db Eb F# G Ab B
    avaroha: [0, 11, 8, 7, 6, 3, 1],
    vadi: 8, // Ab (komal Dha)
    samvadi: 3, // Eb (komal Ga)
    pakad: [0, 1, 3, 1, 0, 8, 7],
    thaat: 'todi',
  },
};

/**
 * Calculate raga similarity based on pitch class presence and melodic contour.
 */
export function calculateRagaSimilarity(
  pitchClasses: number[],
  ragaName: string,
  direction: 'ascending' | 'descending' | 'both' = 'both'
): RagaSimilarityResult | null {
  const raga = RAGA_12TET_APPROXIMATIONS[ragaName.toLowerCase()];
  if (!raga) return null;
  
  const phraseSet = new Set(pitchClasses);
  const arohaSet = new Set(raga.aroha);
  const avarohaSet = new Set(raga.avaroha);
  
  // Pitch class overlap
  const arohaOverlap = Array.from(phraseSet).filter(pc => arohaSet.has(pc)).length;
  const avarohaOverlap = Array.from(phraseSet).filter(pc => avarohaSet.has(pc)).length;
  
  const arohaMatch = arohaSet.size > 0 ? arohaOverlap / arohaSet.size : 0;
  const avarohaMatch = avarohaSet.size > 0 ? avarohaOverlap / avarohaSet.size : 0;
  
  // Check for characteristic notes
  const vadiMatch = phraseSet.has(raga.vadi);
  const samvadiMatch = phraseSet.has(raga.samvadi);
  
  // Combined pitch class match
  let pitchClassMatch: number;
  if (direction === 'ascending') {
    pitchClassMatch = arohaMatch;
  } else if (direction === 'descending') {
    pitchClassMatch = avarohaMatch;
  } else {
    pitchClassMatch = (arohaMatch + avarohaMatch) / 2;
  }
  
  // Overall score with vadi/samvadi bonus
  let score = pitchClassMatch * 70; // Base from pitch class match
  if (vadiMatch) score += 15;
  if (samvadiMatch) score += 15;
  
  return {
    raga: ragaName,
    score: Math.min(100, Math.round(score)),
    pitchClassMatch,
    arohaMatch,
    avarohaMatch,
    vadiMatch,
    samvadiMatch,
    notes: vadiMatch || samvadiMatch 
      ? [`Emphasizes ${vadiMatch ? 'vadi' : ''}${vadiMatch && samvadiMatch ? ' and ' : ''}${samvadiMatch ? 'samvadi' : ''}`]
      : ['Missing characteristic notes'],
  };
}

// ============================================================================
// C041: Mode Similarity Metric
// ============================================================================

/**
 * C041: Mode similarity metric based on shared degrees and leading-tone behavior.
 */
export interface ModeSimilarityResult {
  mode1: string;
  mode2: string;
  score: number; // 0-100
  sharedDegrees: number;
  totalDegrees: number;
  leadingToneSimilar: boolean;
  characteristicDegreesSimilar: boolean;
  relationship: 'parallel' | 'relative' | 'interchange' | 'distant';
}

/**
 * Mode pitch class sets (semitones from root).
 */
export const MODE_PITCH_CLASSES: Record<string, {
  pitchClasses: number[];
  leadingTone: number | null; // Semitones below tonic that wants to resolve up
  characteristicDegrees: number[]; // Degrees that define this mode
}> = {
  ionian: {
    pitchClasses: [0, 2, 4, 5, 7, 9, 11],
    leadingTone: 11,
    characteristicDegrees: [4, 11], // Major 3rd, major 7th
  },
  dorian: {
    pitchClasses: [0, 2, 3, 5, 7, 9, 10],
    leadingTone: null,
    characteristicDegrees: [3, 9], // Minor 3rd, major 6th
  },
  phrygian: {
    pitchClasses: [0, 1, 3, 5, 7, 8, 10],
    leadingTone: null,
    characteristicDegrees: [1, 3], // Minor 2nd, minor 3rd
  },
  lydian: {
    pitchClasses: [0, 2, 4, 6, 7, 9, 11],
    leadingTone: 11,
    characteristicDegrees: [6, 11], // Raised 4th, major 7th
  },
  mixolydian: {
    pitchClasses: [0, 2, 4, 5, 7, 9, 10],
    leadingTone: null,
    characteristicDegrees: [4, 10], // Major 3rd, minor 7th
  },
  aeolian: {
    pitchClasses: [0, 2, 3, 5, 7, 8, 10],
    leadingTone: null,
    characteristicDegrees: [3, 8], // Minor 3rd, minor 6th
  },
  locrian: {
    pitchClasses: [0, 1, 3, 5, 6, 8, 10],
    leadingTone: null,
    characteristicDegrees: [1, 6], // Minor 2nd, diminished 5th
  },
  // Extended modes
  harmonic_minor: {
    pitchClasses: [0, 2, 3, 5, 7, 8, 11],
    leadingTone: 11,
    characteristicDegrees: [3, 11], // Minor 3rd with leading tone
  },
  melodic_minor: {
    pitchClasses: [0, 2, 3, 5, 7, 9, 11],
    leadingTone: 11,
    characteristicDegrees: [3, 9, 11], // Minor 3rd, major 6th & 7th
  },
};

/**
 * Calculate similarity between two modes.
 */
export function calculateModeSimilarity(mode1: string, mode2: string): ModeSimilarityResult | null {
  const m1 = MODE_PITCH_CLASSES[mode1.toLowerCase()];
  const m2 = MODE_PITCH_CLASSES[mode2.toLowerCase()];
  
  if (!m1 || !m2) return null;
  
  const set1 = new Set(m1.pitchClasses);
  const set2 = new Set(m2.pitchClasses);
  
  // Count shared degrees
  const shared = Array.from(set1).filter(pc => set2.has(pc));
  const sharedDegrees = shared.length;
  const totalDegrees = Math.max(set1.size, set2.size);
  
  // Leading tone similarity
  const leadingToneSimilar = m1.leadingTone === m2.leadingTone;
  
  // Characteristic degrees similarity
  const char1 = new Set(m1.characteristicDegrees);
  const char2 = new Set(m2.characteristicDegrees);
  const sharedChar = Array.from(char1).filter(pc => char2.has(pc));
  const characteristicDegreesSimilar = sharedChar.length >= Math.min(char1.size, char2.size) / 2;
  
  // Determine relationship type
  let relationship: ModeSimilarityResult['relationship'];
  if (sharedDegrees === totalDegrees) {
    relationship = 'parallel'; // Same notes, different tonic
  } else if (sharedDegrees >= 5) {
    relationship = 'relative'; // Share most notes (like C major / A minor)
  } else if (sharedDegrees >= 3) {
    relationship = 'interchange'; // Modal interchange candidates
  } else {
    relationship = 'distant';
  }
  
  // Calculate score
  let score = (sharedDegrees / totalDegrees) * 60;
  if (leadingToneSimilar) score += 20;
  if (characteristicDegreesSimilar) score += 20;
  
  return {
    mode1,
    mode2,
    score: Math.round(score),
    sharedDegrees,
    totalDegrees,
    leadingToneSimilar,
    characteristicDegreesSimilar,
    relationship,
  };
}

// ============================================================================
// C042: Ornament Budget Model
// ============================================================================

/**
 * C042: Ornament budget model - density of ornaments per beat/phrase.
 * Different cultures and styles have different ornament densities.
 */
export interface OrnamentBudget {
  /** Maximum ornaments per beat (sparse to dense) */
  maxPerBeat: number;
  /** Maximum ornaments per phrase */
  maxPerPhrase: number;
  /** Preferred ornament placement (downbeat, offbeat, cadential) */
  preferredPlacement: OrnamentPlacement[];
  /** Ornament types appropriate for this budget */
  allowedTypes: string[];
  /** Minimum time between ornaments (in beats) */
  minSpacing: number;
}

export type OrnamentPlacement = 
  | 'downbeat'
  | 'offbeat'
  | 'pre_cadence'
  | 'post_cadence'
  | 'phrase_start'
  | 'phrase_end'
  | 'melodic_peak'
  | 'melodic_trough';

/**
 * Ornament budget presets by culture and style.
 */
export const ORNAMENT_BUDGETS: Record<string, OrnamentBudget> = {
  // Western Classical
  baroque: {
    maxPerBeat: 0.5,
    maxPerPhrase: 4,
    preferredPlacement: ['downbeat', 'pre_cadence'],
    allowedTypes: ['trill', 'mordent', 'turn', 'appoggiatura'],
    minSpacing: 2,
  },
  classical: {
    maxPerBeat: 0.3,
    maxPerPhrase: 2,
    preferredPlacement: ['pre_cadence', 'melodic_peak'],
    allowedTypes: ['trill', 'turn', 'grace_note'],
    minSpacing: 4,
  },
  romantic: {
    maxPerBeat: 0.4,
    maxPerPhrase: 3,
    preferredPlacement: ['melodic_peak', 'phrase_end'],
    allowedTypes: ['trill', 'grace_note', 'portamento', 'rubato'],
    minSpacing: 3,
  },
  
  // Galant (18th century)
  galant: {
    maxPerBeat: 0.6,
    maxPerPhrase: 5,
    preferredPlacement: ['downbeat', 'pre_cadence', 'phrase_end'],
    allowedTypes: ['appoggiatura', 'trill', 'mordent', 'slide'],
    minSpacing: 1.5,
  },
  
  // Celtic
  celtic_slow: {
    maxPerBeat: 0.8,
    maxPerPhrase: 8,
    preferredPlacement: ['phrase_start', 'melodic_peak', 'phrase_end'],
    allowedTypes: ['cut', 'roll', 'cran', 'slide', 'vibrato'],
    minSpacing: 0.5,
  },
  celtic_fast: {
    maxPerBeat: 1.5,
    maxPerPhrase: 16,
    preferredPlacement: ['downbeat', 'offbeat'],
    allowedTypes: ['cut', 'roll', 'triplet'],
    minSpacing: 0.25,
  },
  
  // Carnatic (Indian Classical)
  carnatic: {
    maxPerBeat: 2.0,
    maxPerPhrase: 24,
    preferredPlacement: ['downbeat', 'offbeat', 'melodic_peak', 'melodic_trough'],
    allowedTypes: ['gamaka', 'kampita', 'jaru', 'sphurita', 'pratyahata'],
    minSpacing: 0.125,
  },
  
  // Film/Cinematic
  cinematic: {
    maxPerBeat: 0.2,
    maxPerPhrase: 1,
    preferredPlacement: ['melodic_peak'],
    allowedTypes: ['portamento', 'vibrato', 'swell'],
    minSpacing: 8,
  },
  
  // EDM/Electronic
  edm: {
    maxPerBeat: 0.1,
    maxPerPhrase: 1,
    preferredPlacement: ['phrase_end'],
    allowedTypes: ['filter_sweep', 'pitch_bend', 'glide'],
    minSpacing: 16,
  },
  
  // Jazz
  jazz: {
    maxPerBeat: 0.5,
    maxPerPhrase: 6,
    preferredPlacement: ['offbeat', 'phrase_start'],
    allowedTypes: ['bend', 'fall', 'scoop', 'ghost_note', 'shake'],
    minSpacing: 1,
  },
};

/**
 * Calculate how many ornaments are allowed in a phrase.
 */
export function calculateOrnamentAllowance(
  budgetName: string,
  phraseBeats: number
): { maxOrnaments: number; budget: OrnamentBudget } | null {
  const budget = ORNAMENT_BUDGETS[budgetName.toLowerCase()];
  if (!budget) return null;
  
  const byBeat = Math.floor(phraseBeats * budget.maxPerBeat);
  const maxOrnaments = Math.min(byBeat, budget.maxPerPhrase);
  
  return { maxOrnaments, budget };
}

/**
 * Validate ornament placement against budget.
 */
export function validateOrnamentPlacement(
  budgetName: string,
  ornamentPositions: number[], // Positions in beats
  phraseLength: number
): { valid: boolean; violations: string[] } {
  const budget = ORNAMENT_BUDGETS[budgetName.toLowerCase()];
  if (!budget) return { valid: false, violations: ['Unknown ornament budget'] };
  
  const violations: string[] = [];
  
  // Check count
  const allowance = calculateOrnamentAllowance(budgetName, phraseLength);
  if (allowance && ornamentPositions.length > allowance.maxOrnaments) {
    violations.push(`Too many ornaments: ${ornamentPositions.length} > ${allowance.maxOrnaments}`);
  }
  
  // Check spacing
  const sorted = [...ornamentPositions].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    const currentPos = sorted[i];
    const prevPos = sorted[i - 1];
    if (currentPos !== undefined && prevPos !== undefined) {
      const spacing = currentPos - prevPos;
      if (spacing < budget.minSpacing) {
        violations.push(`Ornaments too close at beats ${prevPos.toFixed(1)} and ${currentPos.toFixed(1)}`);
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}
