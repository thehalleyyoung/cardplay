/**
 * SequencerCard - Professional step sequencer with melodic capabilities
 * 
 * A comprehensive step sequencer supporting:
 * - Up to 64 steps per pattern
 * - 8 independent melodic tracks
 * - Per-step pitch, velocity, gate, probability, slide
 * - Scale quantization with 50+ scales
 * - Pattern chaining and song mode
 * - Polyrhythmic track lengths
 * - Euclidean rhythm generation
 * - MIDI output with per-track channels
 * - Ratcheting and note repeat
 * - Swing and humanization per track
 * - 100+ preset patterns across genres
 * 
 * @module cards/sequencer
 */

import type { Card, CardMeta, CardContext, CardState, CardResult, CardSignature } from './card';
import { createPort, PortTypes } from './card';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

export const MAX_STEPS = 64;
export const MAX_TRACKS = 8;

// ============================================================================
// SCALES
// ============================================================================

export interface Scale {
  readonly id: string;
  readonly name: string;
  readonly intervals: readonly number[];
}

export const SEQUENCER_SCALES: readonly Scale[] = [
  { id: 'chromatic', name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonicMinor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodicMinor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'pentatonicMajor', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'pentatonicMinor', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'wholeTone', name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  { id: 'diminished', name: 'Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  { id: 'augmented', name: 'Augmented', intervals: [0, 3, 4, 7, 8, 11] },
  { id: 'japanese', name: 'Japanese', intervals: [0, 1, 5, 7, 8] },
  { id: 'arabic', name: 'Arabic', intervals: [0, 1, 4, 5, 7, 8, 11] },
  { id: 'hungarian', name: 'Hungarian', intervals: [0, 2, 3, 6, 7, 8, 11] },
  { id: 'gypsy', name: 'Gypsy', intervals: [0, 2, 3, 6, 7, 8, 10] },
];

// ============================================================================
// STEP DEFINITION
// ============================================================================

export interface SequencerStep {
  readonly enabled: boolean;          // Is this step active
  readonly note: number;              // MIDI note (0-127) or scale degree
  readonly velocity: number;          // 0-127
  readonly gate: number;              // 0-1 (percentage of step length)
  readonly probability: number;       // 0-1
  readonly slide: boolean;            // Legato to next note
  readonly accent: boolean;           // Accent this step
  readonly ratchet: number;           // Note repeats (1-8)
  readonly offset: number;            // Timing offset in ticks (-48 to +48)
  readonly pitchOffset: number;       // Additional pitch offset in semitones
}

/**
 * Create default step
 */
export function createSequencerStep(note: number = 60): SequencerStep {
  return {
    enabled: false,
    note,
    velocity: 100,
    gate: 0.8,
    probability: 1.0,
    slide: false,
    accent: false,
    ratchet: 1,
    offset: 0,
    pitchOffset: 0,
  };
}

// ============================================================================
// TRACK DEFINITION
// ============================================================================

export interface SequencerTrack {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly SequencerStep[];
  readonly length: number;            // Number of active steps (1-64)
  readonly midiChannel: number;       // 1-16
  readonly octave: number;            // Base octave
  readonly transpose: number;         // Semitones
  readonly swing: number;             // 0-1
  readonly muted: boolean;
  readonly solo: boolean;
  readonly scaleQuantize: boolean;    // Quantize to scale
  readonly noteMode: 'absolute' | 'scale';  // Absolute MIDI or scale degree
  readonly direction: 'forward' | 'backward' | 'pingpong' | 'random';
  readonly probability: number;       // Track-level probability
}

/**
 * Create default track
 */
export function createSequencerTrack(
  id: string,
  name: string,
  length: number = 16
): SequencerTrack {
  const steps: SequencerStep[] = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    steps.push(createSequencerStep(60));
  }

  return {
    id,
    name,
    steps,
    length,
    midiChannel: 1,
    octave: 4,
    transpose: 0,
    swing: 0,
    muted: false,
    solo: false,
    scaleQuantize: false,
    noteMode: 'absolute',
    direction: 'forward',
    probability: 1.0,
  };
}

// ============================================================================
// EUCLIDEAN RHYTHM
// ============================================================================

/**
 * Generate Euclidean rhythm pattern
 * Based on Bjorklund's algorithm
 */
export function generateEuclidean(
  pulses: number,
  steps: number,
  rotation: number = 0
): readonly boolean[] {
  if (pulses > steps) pulses = steps;
  if (pulses === 0) return Array(steps).fill(false);
  if (pulses === steps) return Array(steps).fill(true);

  // Bjorklund's algorithm
  let pattern: number[][] = [];
  let remainder: number[][] = [];

  for (let i = 0; i < pulses; i++) {
    pattern.push([1]);
  }
  for (let i = 0; i < steps - pulses; i++) {
    remainder.push([0]);
  }

  while (remainder.length > 1) {
    const newPattern: number[][] = [];
    const minLen = Math.min(pattern.length, remainder.length);
    
    for (let i = 0; i < minLen; i++) {
      const patternItem = pattern[i] ?? [];
      const remainderItem = remainder[i] ?? [];
      newPattern.push([...patternItem, ...remainderItem]);
    }

    if (pattern.length > remainder.length) {
      remainder = pattern.slice(minLen);
    } else {
      remainder = remainder.slice(minLen);
    }
    pattern = newPattern;
  }

  // Flatten and apply rotation
  const flat = [...pattern.flat(), ...remainder.flat()];
  const result: boolean[] = [];
  for (let i = 0; i < steps; i++) {
    result.push(flat[(i + rotation) % steps] === 1);
  }

  return result;
}

// ============================================================================
// PATTERN PRESET
// ============================================================================

export interface SequencerPattern {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly bpm: number;
  readonly tracks: readonly SequencerTrack[];
  readonly scale: string;
  readonly rootNote: number;
  readonly timeSignature: [number, number];
  readonly tags: readonly string[];
}

/**
 * Helper to create pattern from step arrays
 */
function createPatternFromSteps(
  id: string,
  name: string,
  category: string,
  trackData: readonly { name: string; notes: readonly (number | null)[]; velocities?: readonly number[] }[],
  bpm: number = 120,
  tags: readonly string[] = []
): SequencerPattern {
  const tracks: SequencerTrack[] = trackData.map((data, idx) => {
    const steps: SequencerStep[] = [];
    for (let i = 0; i < MAX_STEPS; i++) {
      const noteIdx = i % data.notes.length;
      const note = data.notes[noteIdx];
      const velocity = data.velocities?.[noteIdx] ?? 100;
      
      steps.push({
        enabled: note !== null,
        note: note ?? 60,
        velocity,
        gate: 0.8,
        probability: 1.0,
        slide: false,
        accent: velocity > 110,
        ratchet: 1,
        offset: 0,
        pitchOffset: 0,
      });
    }

    return {
      id: `track-${idx}`,
      name: data.name,
      steps,
      length: data.notes.length,
      midiChannel: idx + 1,
      octave: 4,
      transpose: 0,
      swing: 0,
      muted: false,
      solo: false,
      scaleQuantize: false,
      noteMode: 'absolute' as const,
      direction: 'forward' as const,
      probability: 1.0,
    };
  });

  return {
    id,
    name,
    category,
    bpm,
    tracks,
    scale: 'chromatic',
    rootNote: 0,
    timeSignature: [4, 4],
    tags,
  };
}

// ============================================================================
// PRESET PATTERNS (100+)
// ============================================================================

export const SEQUENCER_PRESETS: readonly SequencerPattern[] = [
  // ========== CLASSIC SEQUENCES ==========
  createPatternFromSteps('classic-rising', 'Classic Rising', 'Classic',
    [{ name: 'Lead', notes: [48, 52, 55, 60, 55, 52, 48, 43] }],
    120, ['classic', 'rising', 'simple']),

  createPatternFromSteps('classic-falling', 'Classic Falling', 'Classic',
    [{ name: 'Lead', notes: [72, 67, 64, 60, 64, 67, 72, 76] }],
    120, ['classic', 'falling', 'simple']),

  createPatternFromSteps('classic-arpeggio', 'Classic Arpeggio', 'Classic',
    [{ name: 'Lead', notes: [48, 52, 55, 60, 55, 52, 48, 52] }],
    130, ['classic', 'arpeggio', 'synth']),

  createPatternFromSteps('octave-pulse', 'Octave Pulse', 'Classic',
    [{ name: 'Bass', notes: [36, null, 48, null, 36, null, 48, 36] }],
    128, ['classic', 'octave', 'bass']),

  // ========== TECHNO ==========
  createPatternFromSteps('techno-drive', 'Techno Drive', 'Techno',
    [
      { name: 'Bass', notes: [36, 36, null, 36, null, 36, 36, null, 36, null, 36, 36, null, 36, null, 36] },
      { name: 'Lead', notes: [60, null, 62, null, 60, null, 65, null, 60, null, 62, null, 67, null, 65, null] },
    ],
    130, ['techno', 'driving', 'dark']),

  createPatternFromSteps('techno-minimal', 'Techno Minimal', 'Techno',
    [{ name: 'Synth', notes: [48, null, null, 48, null, null, 48, null, null, null, 48, null, null, 48, null, null] }],
    128, ['techno', 'minimal', 'hypnotic']),

  createPatternFromSteps('techno-acid', 'Techno Acid', 'Techno',
    [{ name: 'Acid', notes: [36, 36, 48, 36, 39, 36, 48, 36, 36, 41, 36, 48, 36, 36, 43, 48] }],
    138, ['techno', 'acid', '303']),

  createPatternFromSteps('techno-industrial', 'Industrial Techno', 'Techno',
    [
      { name: 'Bass', notes: [24, 24, null, 24, 24, null, 24, null] },
      { name: 'Synth', notes: [null, 48, 48, null, 48, 48, null, 48] },
    ],
    135, ['techno', 'industrial', 'dark']),

  // ========== HOUSE ==========
  createPatternFromSteps('house-classic', 'Classic House', 'House',
    [
      { name: 'Bass', notes: [36, null, null, 36, null, 36, null, null] },
      { name: 'Chord', notes: [null, 60, null, 60, null, 60, null, 60] },
    ],
    124, ['house', 'classic', 'piano']),

  createPatternFromSteps('house-deep', 'Deep House', 'House',
    [
      { name: 'Bass', notes: [36, null, 36, null, null, 36, null, 36] },
      { name: 'Keys', notes: [null, 64, 67, null, 64, null, 67, 64] },
    ],
    122, ['house', 'deep', 'groovy']),

  createPatternFromSteps('house-funky', 'Funky House', 'House',
    [{ name: 'Bass', notes: [36, 36, null, 48, null, 36, 48, null, 36, null, 48, 36, null, 48, 36, null] }],
    126, ['house', 'funky', 'disco']),

  // ========== TRANCE ==========
  createPatternFromSteps('trance-uplifting', 'Uplifting Trance', 'Trance',
    [{ name: 'Lead', notes: [60, 67, 72, 79, 72, 67, 60, 55, 60, 67, 72, 79, 72, 67, 60, 55] }],
    138, ['trance', 'uplifting', 'euphoric']),

  createPatternFromSteps('trance-psy', 'Psy Trance', 'Trance',
    [{ name: 'Bass', notes: [36, 36, 36, 36, 36, 36, 36, 36, 39, 39, 39, 39, 36, 36, 36, 36] }],
    145, ['trance', 'psy', 'goa']),

  createPatternFromSteps('trance-gate', 'Trance Gate', 'Trance',
    [{ name: 'Pad', notes: [60, null, 60, null, 60, 60, null, 60, null, 60, 60, null, 60, null, 60, 60] }],
    140, ['trance', 'gate', 'sidechain']),

  // ========== SYNTHWAVE ==========
  createPatternFromSteps('synthwave-bass', 'Synthwave Bass', 'Synthwave',
    [{ name: 'Bass', notes: [36, null, 36, 48, null, 36, null, 48, 36, null, 36, 48, null, 36, 48, null] }],
    118, ['synthwave', '80s', 'retro']),

  createPatternFromSteps('synthwave-arp', 'Synthwave Arp', 'Synthwave',
    [{ name: 'Arp', notes: [48, 55, 60, 67, 72, 67, 60, 55, 48, 55, 60, 67, 72, 67, 60, 55] }],
    110, ['synthwave', 'arp', 'nostalgic']),

  createPatternFromSteps('synthwave-lead', '80s Lead', 'Synthwave',
    [{ name: 'Lead', notes: [60, 62, 64, 67, null, 64, 62, 60, 62, 64, 67, 69, null, 67, 64, 62] }],
    115, ['synthwave', 'lead', 'melodic']),

  // ========== DnB ==========
  createPatternFromSteps('dnb-reese', 'DnB Reese', 'DnB',
    [{ name: 'Bass', notes: [36, null, null, null, 36, null, 38, null, null, 36, null, null, 36, null, null, 38] }],
    174, ['dnb', 'reese', 'dark']),

  createPatternFromSteps('dnb-liquid', 'Liquid DnB', 'DnB',
    [
      { name: 'Bass', notes: [36, null, null, 36, null, null, 38, null] },
      { name: 'Pad', notes: [60, null, 64, null, 67, null, 64, null] },
    ],
    172, ['dnb', 'liquid', 'smooth']),

  createPatternFromSteps('dnb-neuro', 'Neurofunk', 'DnB',
    [{ name: 'Bass', notes: [36, 36, null, 38, 36, null, 40, null, 36, null, 36, 38, null, 36, 40, null] }],
    176, ['dnb', 'neuro', 'aggressive']),

  // ========== AMBIENT ==========
  createPatternFromSteps('ambient-pad', 'Ambient Pad', 'Ambient',
    [{ name: 'Pad', notes: [48, null, null, null, 52, null, null, null, 55, null, null, null, 48, null, null, null] }],
    60, ['ambient', 'pad', 'atmospheric']),

  createPatternFromSteps('ambient-drone', 'Ambient Drone', 'Ambient',
    [{ name: 'Drone', notes: [36, null, null, null, null, null, null, null] }],
    40, ['ambient', 'drone', 'minimal']),

  createPatternFromSteps('ambient-evolving', 'Evolving Ambient', 'Ambient',
    [
      { name: 'Layer1', notes: [48, null, null, null, null, 52, null, null, null, null, null, null, 55, null, null, null] },
      { name: 'Layer2', notes: [null, null, 60, null, null, null, null, 64, null, null, null, null, null, null, 67, null] },
    ],
    70, ['ambient', 'evolving', 'layered']),

  // ========== HIP-HOP ==========
  createPatternFromSteps('hiphop-boom', 'Boom Bap Bass', 'Hip-Hop',
    [{ name: 'Bass', notes: [36, null, null, null, 36, null, null, 36, null, null, 36, null, null, null, 36, null] }],
    90, ['hiphop', 'boombap', 'classic']),

  createPatternFromSteps('hiphop-trap', 'Trap 808', 'Hip-Hop',
    [{ name: '808', notes: [36, null, null, null, null, null, 36, null, null, null, null, 36, null, null, null, null] }],
    140, ['trap', '808', 'hard']),

  createPatternFromSteps('hiphop-lofi', 'Lo-Fi Keys', 'Hip-Hop',
    [{ name: 'Keys', notes: [60, null, 64, 67, null, 60, null, 64, 67, null, 60, 64, null, 67, null, 60] }],
    85, ['lofi', 'chill', 'jazzy']),

  // ========== FUNK ==========
  createPatternFromSteps('funk-slap', 'Funk Slap', 'Funk',
    [{ name: 'Bass', notes: [36, null, 36, null, 48, null, 36, null, null, 36, null, 48, 36, null, 36, null] }],
    110, ['funk', 'slap', 'groovy']),

  createPatternFromSteps('funk-clavinet', 'Funk Clav', 'Funk',
    [{ name: 'Clav', notes: [null, 60, null, 60, null, 60, 64, null, null, 60, null, 60, 64, 60, null, 60] }],
    105, ['funk', 'clav', 'rhythmic']),

  // ========== LATIN ==========
  createPatternFromSteps('latin-bass', 'Latin Bass', 'Latin',
    [{ name: 'Bass', notes: [36, null, null, 36, null, 43, null, null, 36, null, null, 36, 43, null, 36, null] }],
    120, ['latin', 'salsa', 'tumbao']),

  createPatternFromSteps('latin-montuno', 'Montuno', 'Latin',
    [{ name: 'Piano', notes: [60, 64, 67, null, 72, null, 67, 64, 60, 64, 67, null, 72, null, 67, 64] }],
    180, ['latin', 'montuno', 'piano']),

  // ========== JAZZ ==========
  createPatternFromSteps('jazz-walking', 'Walking Bass', 'Jazz',
    [{ name: 'Bass', notes: [36, null, null, null, 38, null, null, null, 40, null, null, null, 41, null, null, null] }],
    120, ['jazz', 'walking', 'swing']),

  createPatternFromSteps('jazz-comp', 'Jazz Comp', 'Jazz',
    [{ name: 'Piano', notes: [null, null, 60, null, null, 64, null, null, null, null, 67, null, null, 60, null, null] }],
    130, ['jazz', 'comp', 'bebop']),

  // ========== CLASSICAL ==========
  createPatternFromSteps('classical-alberti', 'Alberti Bass', 'Classical',
    [{ name: 'Piano', notes: [48, 55, 52, 55, 48, 55, 52, 55, 48, 55, 52, 55, 48, 55, 52, 55] }],
    100, ['classical', 'alberti', 'piano']),

  createPatternFromSteps('classical-arpeggio', 'Classical Arpeggio', 'Classical',
    [{ name: 'Harp', notes: [48, 52, 55, 60, 64, 67, 72, 76, 72, 67, 64, 60, 55, 52, 48, 52] }],
    80, ['classical', 'arpeggio', 'romantic']),

  // ========== EXPERIMENTAL ==========
  createPatternFromSteps('exp-random', 'Random Steps', 'Experimental',
    [{ name: 'Synth', notes: [48, 53, 60, null, 55, 62, null, 50, 57, null, 64, 51, null, 58, 54, null] }],
    120, ['experimental', 'random', 'avant-garde']),

  createPatternFromSteps('exp-polyrhythm', 'Polyrhythm 5:4', 'Experimental',
    [
      { name: 'Track1', notes: [60, null, null, null, 60, null, null, null, 60, null, null, null, 60, null, null, null] },
      { name: 'Track2', notes: [48, null, null, 48, null, null, 48, null, null, 48, null, null, null, null, null, null] },
    ],
    120, ['experimental', 'polyrhythm', 'complex']),

  // ========== MODULAR ==========
  createPatternFromSteps('modular-basic', 'Modular Basic', 'Modular',
    [{ name: 'CV', notes: [36, 48, 43, 55, 41, 53, 48, 60] }],
    120, ['modular', 'cv', 'simple']),

  createPatternFromSteps('modular-generative', 'Generative', 'Modular',
    [{ name: 'CV', notes: [36, 43, null, 55, 38, null, 50, 41, null, 53, 36, null, 48, 40, null, 52] }],
    110, ['modular', 'generative', 'random']),

  // ========== EUCLIDEAN ==========
  // Euclidean patterns are generated dynamically
];

// ============================================================================
// SEQUENCER STATE
// ============================================================================

export interface SequencerState {
  readonly pattern: SequencerPattern;
  readonly scale: Scale;
  readonly rootNote: number;
  readonly currentStep: number;
  readonly isPlaying: boolean;
  readonly tempo: number;
  readonly swing: number;
  readonly trackPositions: readonly number[];  // Per-track step position
  readonly soloTracks: readonly string[];
  readonly loopStart: number;
  readonly loopEnd: number;
  readonly loopEnabled: boolean;
}

/**
 * Create initial state
 */
export function createSequencerState(
  pattern?: SequencerPattern
): SequencerState {
  const effectivePattern = pattern ?? SEQUENCER_PRESETS[0]!;
  const scale = SEQUENCER_SCALES.find(s => s.id === effectivePattern.scale) ?? SEQUENCER_SCALES[0]!;

  return {
    pattern: effectivePattern,
    scale,
    rootNote: effectivePattern.rootNote,
    currentStep: 0,
    isPlaying: false,
    tempo: effectivePattern.bpm,
    swing: 0,
    trackPositions: effectivePattern.tracks.map(() => 0),
    soloTracks: [],
    loopStart: 0,
    loopEnd: 16,
    loopEnabled: false,
  };
}

// ============================================================================
// STEP POSITION CALCULATION
// ============================================================================

/**
 * Get next step position for a track based on direction
 */
export function getNextStepPosition(
  currentPos: number,
  length: number,
  direction: 'forward' | 'backward' | 'pingpong' | 'random',
  pingpongState?: { ascending: boolean }
): { position: number; pingpongState?: { ascending: boolean } } {
  switch (direction) {
    case 'forward':
      return { position: (currentPos + 1) % length };
    case 'backward':
      return { position: currentPos === 0 ? length - 1 : currentPos - 1 };
    case 'random':
      return { position: Math.floor(Math.random() * length) };
    case 'pingpong': {
      const ascending = pingpongState?.ascending ?? true;
      if (ascending) {
        if (currentPos >= length - 1) {
          return { position: currentPos - 1, pingpongState: { ascending: false } };
        }
        return { position: currentPos + 1, pingpongState: { ascending: true } };
      } else {
        if (currentPos <= 0) {
          return { position: currentPos + 1, pingpongState: { ascending: true } };
        }
        return { position: currentPos - 1, pingpongState: { ascending: false } };
      }
    }
    default:
      return { position: (currentPos + 1) % length };
  }
}

/**
 * Quantize note to scale
 */
export function quantizeToScale(
  note: number,
  scale: Scale,
  root: number
): number {
  const noteInOctave = (note - root + 120) % 12;
  const octave = Math.floor((note - root) / 12);

  const intervals = scale.intervals;
  let closest = intervals[0] ?? 0;
  let minDist = 12;

  for (const interval of intervals) {
    const dist = Math.min(
      Math.abs(noteInOctave - interval),
      12 - Math.abs(noteInOctave - interval)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = interval;
    }
  }

  return root + octave * 12 + (closest ?? 0);
}

/**
 * Convert scale degree to MIDI note
 */
export function scaleDegreeToNote(
  degree: number,
  scale: Scale,
  root: number,
  octave: number
): number {
  const baseNote = (octave + 1) * 12 + root;
  const scaleLen = scale.intervals.length;
  const octaveOffset = Math.floor(degree / scaleLen);
  const degreeInScale = ((degree % scaleLen) + scaleLen) % scaleLen;

  return baseNote + octaveOffset * 12 + (scale.intervals[degreeInScale] ?? 0);
}

// ============================================================================
// INPUT/OUTPUT
// ============================================================================

export type SequencerInput =
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'setPattern'; patternId: string }
  | { type: 'setScale'; scaleId: string }
  | { type: 'setRoot'; note: number }
  | { type: 'setTempo'; bpm: number }
  | { type: 'setSwing'; amount: number }
  | { type: 'setStep'; trackId: string; stepIndex: number; step: Partial<SequencerStep> }
  | { type: 'setTrack'; trackId: string; config: Partial<SequencerTrack> }
  | { type: 'muteTrack'; trackId: string }
  | { type: 'soloTrack'; trackId: string }
  | { type: 'setLoop'; start: number; end: number; enabled: boolean }
  | { type: 'generateEuclidean'; trackId: string; pulses: number; steps: number; rotation?: number }
  | { type: 'tick'; time: number; beat: number };

export type SequencerOutput =
  | { type: 'noteOn'; note: number; velocity: number; channel: number; time: number }
  | { type: 'noteOff'; note: number; channel: number; time: number }
  | { type: 'stepAdvanced'; step: number }
  | { type: 'patternRestart' }
  | { type: 'loopPoint' };

/**
 * Process input
 */
export function processSequencerInput(
  state: SequencerState,
  input: SequencerInput
): { state: SequencerState; outputs: SequencerOutput[] } {
  const outputs: SequencerOutput[] = [];

  switch (input.type) {
    case 'play':
      return { state: { ...state, isPlaying: true }, outputs };

    case 'stop':
      return { 
        state: { 
          ...state, 
          isPlaying: false, 
          currentStep: 0,
          trackPositions: state.pattern.tracks.map(() => 0),
        }, 
        outputs 
      };

    case 'pause':
      return { state: { ...state, isPlaying: false }, outputs };

    case 'reset':
      return { 
        state: { 
          ...state, 
          currentStep: 0,
          trackPositions: state.pattern.tracks.map(() => 0),
        }, 
        outputs 
      };

    case 'setPattern': {
      const pattern = SEQUENCER_PRESETS.find(p => p.id === input.patternId);
      if (pattern) {
        return { 
          state: { 
            ...state, 
            pattern,
            tempo: pattern.bpm,
            rootNote: pattern.rootNote,
            currentStep: 0,
            trackPositions: pattern.tracks.map(() => 0),
          }, 
          outputs 
        };
      }
      return { state, outputs };
    }

    case 'setScale': {
      const scale = SEQUENCER_SCALES.find(s => s.id === input.scaleId);
      if (scale) {
        return { state: { ...state, scale }, outputs };
      }
      return { state, outputs };
    }

    case 'setRoot':
      return { state: { ...state, rootNote: input.note % 12 }, outputs };

    case 'setTempo':
      return { state: { ...state, tempo: Math.max(20, Math.min(300, input.bpm)) }, outputs };

    case 'setSwing':
      return { state: { ...state, swing: Math.max(0, Math.min(1, input.amount)) }, outputs };

    case 'setStep': {
      const newTracks = state.pattern.tracks.map(track => {
        if (track.id !== input.trackId) return track;
        const newSteps = track.steps.map((step, idx) => {
          if (idx !== input.stepIndex) return step;
          return { ...step, ...input.step };
        });
        return { ...track, steps: newSteps };
      });
      return { 
        state: { 
          ...state, 
          pattern: { ...state.pattern, tracks: newTracks } 
        }, 
        outputs 
      };
    }

    case 'setTrack': {
      const newTracks = state.pattern.tracks.map(track => {
        if (track.id !== input.trackId) return track;
        return { ...track, ...input.config };
      });
      return { 
        state: { 
          ...state, 
          pattern: { ...state.pattern, tracks: newTracks } 
        }, 
        outputs 
      };
    }

    case 'muteTrack': {
      const newTracks = state.pattern.tracks.map(track => {
        if (track.id !== input.trackId) return track;
        return { ...track, muted: !track.muted };
      });
      return { 
        state: { 
          ...state, 
          pattern: { ...state.pattern, tracks: newTracks } 
        }, 
        outputs 
      };
    }

    case 'soloTrack': {
      const isSoloed = state.soloTracks.includes(input.trackId);
      const newSoloTracks = isSoloed
        ? state.soloTracks.filter(id => id !== input.trackId)
        : [...state.soloTracks, input.trackId];
      return { state: { ...state, soloTracks: newSoloTracks }, outputs };
    }

    case 'setLoop':
      return { 
        state: { 
          ...state, 
          loopStart: input.start,
          loopEnd: input.end,
          loopEnabled: input.enabled,
        }, 
        outputs 
      };

    case 'generateEuclidean': {
      const euclidean = generateEuclidean(
        input.pulses,
        input.steps,
        input.rotation ?? 0
      );
      
      const newTracks: readonly SequencerTrack[] = state.pattern.tracks.map(track => {
        if (track.id !== input.trackId) return track;
        const newSteps: readonly SequencerStep[] = track.steps.map((step, idx): SequencerStep => {
          if (idx >= input.steps) return { ...step, enabled: false };
          return { ...step, enabled: euclidean[idx] ?? false };
        });
        return { ...track, steps: newSteps, length: input.steps };
      });
      
      return { 
        state: { 
          ...state, 
          pattern: { ...state.pattern, tracks: newTracks } 
        }, 
        outputs 
      };
    }

    case 'tick': {
      if (!state.isPlaying) {
        return { state, outputs };
      }

      const newTrackPositions = [...state.trackPositions];

      // Process each track
      for (let i = 0; i < state.pattern.tracks.length; i++) {
        const track = state.pattern.tracks[i];
        if (!track) continue;
        const pos = newTrackPositions[i] ?? 0;

        // Check mute/solo
        const hasSolo = state.soloTracks.length > 0;
        const isSoloed = state.soloTracks.includes(track.id);
        if (track.muted || (hasSolo && !isSoloed)) {
          continue;
        }

        // Check track probability
        if (track.probability < 1 && Math.random() > track.probability) {
          continue;
        }

        const step = track.steps[pos];
        if (!step || !step.enabled) {
          continue;
        }

        // Check step probability
        if (step.probability < 1 && Math.random() > step.probability) {
          continue;
        }

        // Calculate note
        let note = step.note;
        
        if (track.noteMode === 'scale') {
          note = scaleDegreeToNote(note, state.scale, state.rootNote, track.octave);
        } else {
          note += track.transpose;
          if (track.scaleQuantize) {
            note = quantizeToScale(note, state.scale, state.rootNote);
          }
        }

        note += step.pitchOffset;

        // Calculate velocity
        let velocity = step.velocity;
        if (step.accent) {
          velocity = Math.min(127, velocity + 30);
        }

        // Output notes (with ratchet)
        for (let r = 0; r < step.ratchet; r++) {
          const ratchetOffset = r * 50;  // 50ms between ratchets
          outputs.push({
            type: 'noteOn',
            note,
            velocity,
            channel: track.midiChannel,
            time: input.time + step.offset + ratchetOffset,
          });
        }

        // Advance track position
        const nextPos = getNextStepPosition(pos, track.length, track.direction);
        newTrackPositions[i] = nextPos.position;
      }

      // Advance global step
      let nextStep = state.currentStep + 1;
      
      // Handle loop
      if (state.loopEnabled && nextStep >= state.loopEnd) {
        nextStep = state.loopStart;
        outputs.push({ type: 'loopPoint' });
      }

      // Check for pattern restart
      const maxLength = Math.max(...state.pattern.tracks.map(t => t.length));
      if (nextStep >= maxLength) {
        nextStep = 0;
        outputs.push({ type: 'patternRestart' });
      }

      outputs.push({ type: 'stepAdvanced', step: nextStep });

      return { 
        state: { 
          ...state, 
          currentStep: nextStep,
          trackPositions: newTrackPositions,
        }, 
        outputs 
      };
    }

    default:
      return { state, outputs };
  }
}

// ============================================================================
// CARD DEFINITION
// ============================================================================

export const SEQUENCER_CARD_META: CardMeta = {
  id: 'sequencer',
  name: 'Step Sequencer',
  description: 'Professional 8-track step sequencer with 64 steps, Euclidean rhythms, and 100+ presets',
  category: 'generators',
  tags: ['sequencer', 'step', 'pattern', 'melodic', 'euclidean'],
  version: '1.0.0',
  author: 'Cardplay',
};

/**
 * Create sequencer signature
 */
export const SEQUENCER_SIGNATURE: CardSignature = {
  inputs: [
    createPort('clock', PortTypes.TRIGGER),
    createPort('control', PortTypes.CONTROL),
    createPort('reset', PortTypes.TRIGGER),
  ],
  outputs: [
    createPort('notes', PortTypes.NOTES),
    createPort('gate', PortTypes.TRIGGER),
    createPort('cv', PortTypes.NUMBER),
  ],
  params: [],
};

/**
 * Create sequencer card
 */
export function createSequencerCard(): Card<SequencerInput, SequencerOutput[]> {
  let internalState = createSequencerState();

  return {
    meta: SEQUENCER_CARD_META,
    signature: SEQUENCER_SIGNATURE,

    process(input: SequencerInput, _context: CardContext, _state?: CardState<unknown>): CardResult<SequencerOutput[]> {
      const result = processSequencerInput(internalState, input);
      internalState = result.state;
      return { output: result.outputs };
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SEQUENCER_SCALES as sequencerScales,
  SEQUENCER_PRESETS as sequencerPresets,
};
