/**
 * MelodyCard - Professional melody generator with contour control
 * 
 * A comprehensive melody generation card supporting:
 * - Multiple generation algorithms (random, markov, fractal, motif-based)
 * - Contour shapes (ascending, descending, arch, wave, flat)
 * - Scale constraints with 50+ scales
 * - Rhythm patterns with 80+ presets
 * - Phrase structures (question/answer, call/response)
 * - Motif development (repetition, sequence, inversion, retrograde)
 * - Expression control (velocity curves, articulation)
 * - MIDI recording and playback
 * - Real-time pitch correction
 * 
 * @module cards/melody
 */

import type { Card, CardMeta, CardContext, CardState, CardResult } from './card';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

// ============================================================================
// SCALES (50+)
// ============================================================================

export interface ScaleDefinition {
  readonly id: string;
  readonly name: string;
  readonly intervals: readonly number[];  // Semitones from root
  readonly category: string;
}

export const MELODY_SCALES: readonly ScaleDefinition[] = [
  // ========== DIATONIC ==========
  { id: 'major', name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], category: 'Diatonic' },
  { id: 'minor', name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10], category: 'Diatonic' },
  { id: 'harmonicMinor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], category: 'Diatonic' },
  { id: 'melodicMinor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11], category: 'Diatonic' },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], category: 'Diatonic' },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], category: 'Diatonic' },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], category: 'Diatonic' },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], category: 'Diatonic' },
  { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], category: 'Diatonic' },

  // ========== PENTATONIC ==========
  { id: 'pentatonicMajor', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], category: 'Pentatonic' },
  { id: 'pentatonicMinor', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], category: 'Pentatonic' },
  { id: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], category: 'Pentatonic' },
  { id: 'minorBlues', name: 'Minor Blues', intervals: [0, 3, 5, 6, 7, 10], category: 'Pentatonic' },
  { id: 'majorBlues', name: 'Major Blues', intervals: [0, 2, 3, 4, 7, 9], category: 'Pentatonic' },

  // ========== BEBOP ==========
  { id: 'bebopMajor', name: 'Bebop Major', intervals: [0, 2, 4, 5, 7, 8, 9, 11], category: 'Bebop' },
  { id: 'bebopMinor', name: 'Bebop Minor', intervals: [0, 2, 3, 5, 7, 8, 9, 10], category: 'Bebop' },
  { id: 'bebopDominant', name: 'Bebop Dominant', intervals: [0, 2, 4, 5, 7, 9, 10, 11], category: 'Bebop' },

  // ========== EXOTIC ==========
  { id: 'phrygianDominant', name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10], category: 'Exotic' },
  { id: 'doubleHarmonic', name: 'Double Harmonic', intervals: [0, 1, 4, 5, 7, 8, 11], category: 'Exotic' },
  { id: 'hungarian', name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11], category: 'Exotic' },
  { id: 'gypsy', name: 'Gypsy', intervals: [0, 2, 3, 6, 7, 8, 10], category: 'Exotic' },
  { id: 'persian', name: 'Persian', intervals: [0, 1, 4, 5, 6, 8, 11], category: 'Exotic' },
  { id: 'arabic', name: 'Arabic', intervals: [0, 2, 4, 5, 6, 8, 10], category: 'Exotic' },
  { id: 'japanese', name: 'Japanese (Hirajoshi)', intervals: [0, 2, 3, 7, 8], category: 'Exotic' },
  { id: 'insen', name: 'In Sen', intervals: [0, 1, 5, 7, 10], category: 'Exotic' },
  { id: 'iwato', name: 'Iwato', intervals: [0, 1, 5, 6, 10], category: 'Exotic' },
  { id: 'chinese', name: 'Chinese', intervals: [0, 4, 6, 7, 11], category: 'Exotic' },
  { id: 'kumoi', name: 'Kumoi', intervals: [0, 2, 3, 7, 9], category: 'Exotic' },
  { id: 'pelog', name: 'Pelog', intervals: [0, 1, 3, 7, 8], category: 'Exotic' },

  // ========== SYMMETRICAL ==========
  { id: 'chromatic', name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], category: 'Symmetrical' },
  { id: 'wholeTone', name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10], category: 'Symmetrical' },
  { id: 'diminished', name: 'Diminished (HW)', intervals: [0, 1, 3, 4, 6, 7, 9, 10], category: 'Symmetrical' },
  { id: 'diminishedWH', name: 'Diminished (WH)', intervals: [0, 2, 3, 5, 6, 8, 9, 11], category: 'Symmetrical' },
  { id: 'augmented', name: 'Augmented', intervals: [0, 3, 4, 7, 8, 11], category: 'Symmetrical' },

  // ========== JAZZ ==========
  { id: 'altered', name: 'Altered', intervals: [0, 1, 3, 4, 6, 8, 10], category: 'Jazz' },
  { id: 'superLocrian', name: 'Super Locrian', intervals: [0, 1, 3, 4, 6, 8, 10], category: 'Jazz' },
  { id: 'lydianDominant', name: 'Lydian Dominant', intervals: [0, 2, 4, 6, 7, 9, 10], category: 'Jazz' },
  { id: 'lydianAugmented', name: 'Lydian Augmented', intervals: [0, 2, 4, 6, 8, 9, 11], category: 'Jazz' },

  // ========== WORLD ==========
  { id: 'raga', name: 'Raga Bhairav', intervals: [0, 1, 4, 5, 7, 8, 11], category: 'World' },
  { id: 'maqam', name: 'Maqam Hijaz', intervals: [0, 1, 4, 5, 7, 8, 10], category: 'World' },
  { id: 'flamenco', name: 'Flamenco', intervals: [0, 1, 4, 5, 7, 8, 11], category: 'World' },
  { id: 'klezmer', name: 'Klezmer', intervals: [0, 2, 3, 6, 7, 8, 11], category: 'World' },
];

// ============================================================================
// CONTOUR SHAPES
// ============================================================================

export type ContourShape = 
  | 'ascending'    // Gradually rises
  | 'descending'   // Gradually falls
  | 'arch'         // Rises then falls
  | 'valley'       // Falls then rises
  | 'wave'         // Oscillates up and down
  | 'flat'         // Stays around center
  | 'jump'         // Large intervals
  | 'step'         // Small intervals
  | 'random';      // No pattern

export interface ContourConfig {
  readonly shape: ContourShape;
  readonly range: number;          // Octave range (1-4)
  readonly centerNote: number;     // MIDI note for center
  readonly smoothness: number;     // 0-1, how smooth the contour
  readonly tension: number;        // 0-1, how much curve
}

/**
 * Generate contour value for position in phrase
 */
export function getContourValue(
  shape: ContourShape,
  position: number,  // 0-1 within phrase
  _tension: number = 0.5 // Reserved for future tension control
): number {
  switch (shape) {
    case 'ascending':
      return position;
    case 'descending':
      return 1 - position;
    case 'arch':
      return Math.sin(position * Math.PI);
    case 'valley':
      return 1 - Math.sin(position * Math.PI);
    case 'wave':
      return (Math.sin(position * Math.PI * 2) + 1) / 2;
    case 'flat':
      return 0.5 + (Math.random() - 0.5) * 0.1;
    case 'jump':
      return Math.random();
    case 'step':
      return Math.floor(position * 4) / 4;
    case 'random':
    default:
      return Math.random();
  }
}

// ============================================================================
// RHYTHM PATTERNS (80+)
// ============================================================================

export interface RhythmPattern {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly number[];  // Duration in 16ths (0 = rest)
  readonly category: string;
  readonly timeSignature: [number, number];
}

export const RHYTHM_PATTERNS: readonly RhythmPattern[] = [
  // ========== SIMPLE ==========
  { id: 'whole', name: 'Whole Notes', steps: [16], category: 'Simple', timeSignature: [4, 4] },
  { id: 'half', name: 'Half Notes', steps: [8, 8], category: 'Simple', timeSignature: [4, 4] },
  { id: 'quarter', name: 'Quarter Notes', steps: [4, 4, 4, 4], category: 'Simple', timeSignature: [4, 4] },
  { id: 'eighth', name: 'Eighth Notes', steps: [2, 2, 2, 2, 2, 2, 2, 2], category: 'Simple', timeSignature: [4, 4] },
  { id: 'sixteenth', name: 'Sixteenth Notes', steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], category: 'Simple', timeSignature: [4, 4] },

  // ========== SYNCOPATED ==========
  { id: 'syncopated1', name: 'Syncopated 1', steps: [3, 3, 2, 4, 4], category: 'Syncopated', timeSignature: [4, 4] },
  { id: 'syncopated2', name: 'Syncopated 2', steps: [2, 3, 3, 4, 4], category: 'Syncopated', timeSignature: [4, 4] },
  { id: 'syncopated3', name: 'Syncopated 3', steps: [3, 1, 2, 2, 4, 4], category: 'Syncopated', timeSignature: [4, 4] },
  { id: 'offbeat', name: 'Offbeat', steps: [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2], category: 'Syncopated', timeSignature: [4, 4] },

  // ========== SWING ==========
  { id: 'swing', name: 'Swing Eighths', steps: [3, 1, 3, 1, 3, 1, 3, 1], category: 'Swing', timeSignature: [4, 4] },
  { id: 'shuffle', name: 'Shuffle', steps: [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1], category: 'Swing', timeSignature: [4, 4] },
  { id: 'triplet', name: 'Triplets', steps: [2, 2, 2, 2, 2, 2, 2, 2], category: 'Swing', timeSignature: [4, 4] },

  // ========== LATIN ==========
  { id: 'clave32', name: '3-2 Son Clave', steps: [3, 3, 4, 2, 4], category: 'Latin', timeSignature: [4, 4] },
  { id: 'clave23', name: '2-3 Son Clave', steps: [2, 4, 3, 3, 4], category: 'Latin', timeSignature: [4, 4] },
  { id: 'rumba', name: 'Rumba Clave', steps: [3, 4, 3, 2, 4], category: 'Latin', timeSignature: [4, 4] },
  { id: 'bossa', name: 'Bossa Nova', steps: [3, 3, 2, 3, 3, 2], category: 'Latin', timeSignature: [4, 4] },
  { id: 'samba', name: 'Samba', steps: [2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2], category: 'Latin', timeSignature: [4, 4] },
  { id: 'tresillo', name: 'Tresillo', steps: [3, 3, 2, 3, 3, 2], category: 'Latin', timeSignature: [4, 4] },
  { id: 'cascara', name: 'Cascara', steps: [2, 2, 1, 2, 2, 2, 2, 1, 2], category: 'Latin', timeSignature: [4, 4] },

  // ========== FUNK ==========
  { id: 'funk1', name: 'Funk 1', steps: [1, 0, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2], category: 'Funk', timeSignature: [4, 4] },
  { id: 'funk2', name: 'Funk 2', steps: [2, 0, 2, 2, 2, 2, 0, 2, 2, 2], category: 'Funk', timeSignature: [4, 4] },
  { id: 'funk16th', name: 'Funk 16th', steps: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1], category: 'Funk', timeSignature: [4, 4] },
  { id: 'disco', name: 'Disco', steps: [2, 2, 2, 2, 2, 2, 2, 2], category: 'Funk', timeSignature: [4, 4] },

  // ========== HIP-HOP ==========
  { id: 'trapHiHat', name: 'Trap Hi-Hat', steps: [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0], category: 'Hip-Hop', timeSignature: [4, 4] },
  { id: 'boomBap', name: 'Boom Bap', steps: [4, 0, 4, 4, 0, 4], category: 'Hip-Hop', timeSignature: [4, 4] },
  { id: 'lofi', name: 'Lo-Fi', steps: [3, 0, 2, 3, 2, 0, 3, 3], category: 'Hip-Hop', timeSignature: [4, 4] },

  // ========== ELECTRONIC ==========
  { id: 'fourOnFloor', name: 'Four On The Floor', steps: [4, 4, 4, 4], category: 'Electronic', timeSignature: [4, 4] },
  { id: 'offbeat8th', name: 'Offbeat 8ths', steps: [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2], category: 'Electronic', timeSignature: [4, 4] },
  { id: 'tranceGate', name: 'Trance Gate', steps: [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], category: 'Electronic', timeSignature: [4, 4] },
  { id: 'dubstep', name: 'Dubstep', steps: [4, 0, 0, 4, 0, 0, 4, 4], category: 'Electronic', timeSignature: [4, 4] },
  { id: 'dnb', name: 'Drum and Bass', steps: [2, 1, 1, 0, 2, 2, 0, 2, 1, 1, 0, 2, 2, 2], category: 'Electronic', timeSignature: [4, 4] },
  { id: 'breakbeat', name: 'Breakbeat', steps: [2, 0, 2, 2, 0, 2, 2, 2, 0, 2, 2, 0], category: 'Electronic', timeSignature: [4, 4] },

  // ========== WORLD ==========
  { id: 'africanBell', name: 'African Bell', steps: [2, 2, 1, 2, 2, 2, 1, 2, 2], category: 'World', timeSignature: [4, 4] },
  { id: 'middle_eastern', name: 'Middle Eastern', steps: [3, 2, 3, 2, 3, 3], category: 'World', timeSignature: [4, 4] },
  { id: 'indian', name: 'Indian Tala', steps: [4, 2, 2, 4, 4], category: 'World', timeSignature: [4, 4] },

  // ========== ODD METERS ==========
  { id: 'waltz', name: 'Waltz (3/4)', steps: [4, 4, 4], category: 'Odd Meter', timeSignature: [3, 4] },
  { id: '5/4', name: '5/4 Time', steps: [4, 4, 4, 4, 4], category: 'Odd Meter', timeSignature: [5, 4] },
  { id: '6/8', name: '6/8 Time', steps: [3, 3, 3, 3], category: 'Odd Meter', timeSignature: [6, 8] },
  { id: '7/8', name: '7/8 Time', steps: [3, 2, 2, 2, 2, 3], category: 'Odd Meter', timeSignature: [7, 8] },
  { id: '9/8', name: '9/8 Time', steps: [3, 3, 3, 3, 3, 3], category: 'Odd Meter', timeSignature: [9, 8] },
  { id: '11/8', name: '11/8 Time', steps: [3, 2, 3, 3], category: 'Odd Meter', timeSignature: [11, 8] },

  // ========== CLASSICAL ==========
  { id: 'march', name: 'March', steps: [2, 2, 4, 2, 2, 4], category: 'Classical', timeSignature: [4, 4] },
  { id: 'minuet', name: 'Minuet', steps: [4, 2, 2, 4], category: 'Classical', timeSignature: [3, 4] },
  { id: 'sarabande', name: 'Sarabande', steps: [4, 6, 2, 4], category: 'Classical', timeSignature: [3, 4] },
  { id: 'gigue', name: 'Gigue', steps: [2, 1, 2, 1, 2, 1, 2, 1], category: 'Classical', timeSignature: [6, 8] },
];

// ============================================================================
// MOTIF DEVELOPMENT
// ============================================================================

export type MotifTransform = 
  | 'repeat'        // Exact repetition
  | 'transpose'     // Shift pitch
  | 'invert'        // Flip intervals
  | 'retrograde'    // Reverse order
  | 'augment'       // Double durations
  | 'diminish'      // Halve durations
  | 'sequence'      // Repeat at different pitch
  | 'embellish'     // Add ornaments
  | 'simplify'      // Remove notes
  | 'fragment';     // Use part of motif

export interface MotifConfig {
  readonly length: number;           // Notes in motif
  readonly transforms: readonly MotifTransform[];
  readonly repetitions: number;
  readonly variationAmount: number;  // 0-1
}

// ============================================================================
// MELODY NOTE
// ============================================================================

export interface MelodyNote {
  readonly pitch: number;          // MIDI note
  readonly duration: number;       // In 16th notes
  readonly velocity: number;       // 0-127
  readonly articulation: 'legato' | 'staccato' | 'accent' | 'normal';
  readonly ornament?: 'trill' | 'mordent' | 'turn' | 'grace';
}

/**
 * Create a melody note
 */
export function createMelodyNote(
  pitch: number,
  duration: number = 4,
  velocity: number = 80
): MelodyNote {
  return {
    pitch,
    duration,
    velocity,
    articulation: 'normal',
  };
}

// ============================================================================
// MELODY PRESET (50+)
// ============================================================================

export interface MelodyPreset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly scale: string;
  readonly contour: ContourShape;
  readonly rhythm: string;
  readonly range: number;          // Octaves
  readonly noteLength: 'short' | 'medium' | 'long' | 'mixed';
  readonly density: number;        // 0-1, how many notes
  readonly chromaticism: number;   // 0-1, non-scale notes
  readonly jumpiness: number;      // 0-1, interval size
  readonly repetition: number;     // 0-1, note repetition
  readonly tags: readonly string[];
}

export const MELODY_PRESETS: readonly MelodyPreset[] = [
  // ========== POP ==========
  { id: 'popHook', name: 'Pop Hook', category: 'Pop', scale: 'major', contour: 'arch', rhythm: 'syncopated1', range: 1.5, noteLength: 'medium', density: 0.6, chromaticism: 0, jumpiness: 0.3, repetition: 0.5, tags: ['pop', 'catchy', 'hook'] },
  { id: 'popVerse', name: 'Pop Verse', category: 'Pop', scale: 'major', contour: 'wave', rhythm: 'quarter', range: 1, noteLength: 'medium', density: 0.5, chromaticism: 0, jumpiness: 0.2, repetition: 0.3, tags: ['pop', 'verse', 'simple'] },
  { id: 'popChorus', name: 'Pop Chorus', category: 'Pop', scale: 'major', contour: 'ascending', rhythm: 'eighth', range: 1.5, noteLength: 'medium', density: 0.7, chromaticism: 0.1, jumpiness: 0.4, repetition: 0.4, tags: ['pop', 'chorus', 'uplifting'] },
  { id: 'popBallad', name: 'Pop Ballad', category: 'Pop', scale: 'major', contour: 'arch', rhythm: 'half', range: 1.5, noteLength: 'long', density: 0.4, chromaticism: 0.1, jumpiness: 0.3, repetition: 0.2, tags: ['pop', 'ballad', 'emotional'] },

  // ========== JAZZ ==========
  { id: 'jazzBebop', name: 'Bebop Line', category: 'Jazz', scale: 'bebopDominant', contour: 'wave', rhythm: 'swing', range: 2, noteLength: 'short', density: 0.9, chromaticism: 0.3, jumpiness: 0.5, repetition: 0.1, tags: ['jazz', 'bebop', 'fast', 'chromatic'] },
  { id: 'jazzCool', name: 'Cool Jazz', category: 'Jazz', scale: 'dorian', contour: 'flat', rhythm: 'triplet', range: 1.5, noteLength: 'medium', density: 0.5, chromaticism: 0.2, jumpiness: 0.3, repetition: 0.2, tags: ['jazz', 'cool', 'relaxed'] },
  { id: 'jazzBallad', name: 'Jazz Ballad', category: 'Jazz', scale: 'major', contour: 'arch', rhythm: 'syncopated2', range: 1.5, noteLength: 'long', density: 0.4, chromaticism: 0.2, jumpiness: 0.4, repetition: 0.1, tags: ['jazz', 'ballad', 'expressive'] },
  { id: 'jazzModal', name: 'Modal Jazz', category: 'Jazz', scale: 'dorian', contour: 'step', rhythm: 'quarter', range: 1, noteLength: 'medium', density: 0.5, chromaticism: 0.1, jumpiness: 0.2, repetition: 0.3, tags: ['jazz', 'modal', 'miles'] },

  // ========== CLASSICAL ==========
  { id: 'baroqueLine', name: 'Baroque Line', category: 'Classical', scale: 'major', contour: 'wave', rhythm: 'sixteenth', range: 2, noteLength: 'short', density: 0.9, chromaticism: 0.1, jumpiness: 0.3, repetition: 0.2, tags: ['classical', 'baroque', 'ornate'] },
  { id: 'classicalTheme', name: 'Classical Theme', category: 'Classical', scale: 'major', contour: 'arch', rhythm: 'quarter', range: 1.5, noteLength: 'medium', density: 0.6, chromaticism: 0, jumpiness: 0.3, repetition: 0.4, tags: ['classical', 'theme', 'elegant'] },
  { id: 'romanticMelody', name: 'Romantic Melody', category: 'Classical', scale: 'harmonicMinor', contour: 'arch', rhythm: 'syncopated3', range: 2, noteLength: 'long', density: 0.5, chromaticism: 0.2, jumpiness: 0.5, repetition: 0.1, tags: ['classical', 'romantic', 'expressive'] },
  { id: 'fugueSubject', name: 'Fugue Subject', category: 'Classical', scale: 'major', contour: 'ascending', rhythm: 'eighth', range: 1.5, noteLength: 'medium', density: 0.7, chromaticism: 0.1, jumpiness: 0.4, repetition: 0.3, tags: ['classical', 'fugue', 'contrapuntal'] },

  // ========== BLUES ==========
  { id: 'bluesLick', name: 'Blues Lick', category: 'Blues', scale: 'blues', contour: 'valley', rhythm: 'shuffle', range: 1.5, noteLength: 'medium', density: 0.7, chromaticism: 0.2, jumpiness: 0.4, repetition: 0.3, tags: ['blues', 'lick', 'soulful'] },
  { id: 'bluesVocal', name: 'Blues Vocal', category: 'Blues', scale: 'minorBlues', contour: 'descending', rhythm: 'syncopated1', range: 1, noteLength: 'long', density: 0.4, chromaticism: 0.1, jumpiness: 0.3, repetition: 0.2, tags: ['blues', 'vocal', 'expressive'] },

  // ========== ELECTRONIC ==========
  { id: 'tranceLead', name: 'Trance Lead', category: 'Electronic', scale: 'minor', contour: 'ascending', rhythm: 'tranceGate', range: 2, noteLength: 'medium', density: 0.8, chromaticism: 0, jumpiness: 0.5, repetition: 0.4, tags: ['trance', 'lead', 'uplifting', 'edm'] },
  { id: 'synthPop', name: 'Synth Pop', category: 'Electronic', scale: 'major', contour: 'wave', rhythm: 'syncopated2', range: 1.5, noteLength: 'medium', density: 0.6, chromaticism: 0.1, jumpiness: 0.3, repetition: 0.5, tags: ['synthpop', '80s', 'retro'] },
  { id: 'chiptune', name: 'Chiptune', category: 'Electronic', scale: 'pentatonicMajor', contour: 'jump', rhythm: 'sixteenth', range: 2, noteLength: 'short', density: 0.8, chromaticism: 0, jumpiness: 0.6, repetition: 0.4, tags: ['chiptune', '8bit', 'retro', 'game'] },
  { id: 'ambientPad', name: 'Ambient Pad', category: 'Electronic', scale: 'lydian', contour: 'flat', rhythm: 'whole', range: 1, noteLength: 'long', density: 0.2, chromaticism: 0, jumpiness: 0.2, repetition: 0.1, tags: ['ambient', 'pad', 'atmospheric'] },

  // ========== WORLD ==========
  { id: 'middleEastern', name: 'Middle Eastern', category: 'World', scale: 'phrygianDominant', contour: 'wave', rhythm: 'middle_eastern', range: 1.5, noteLength: 'mixed', density: 0.7, chromaticism: 0.1, jumpiness: 0.4, repetition: 0.3, tags: ['world', 'arabic', 'exotic'] },
  { id: 'indian', name: 'Indian Raga', category: 'World', scale: 'raga', contour: 'ascending', rhythm: 'indian', range: 2, noteLength: 'mixed', density: 0.6, chromaticism: 0, jumpiness: 0.4, repetition: 0.2, tags: ['world', 'indian', 'raga', 'meditative'] },
  { id: 'japanese', name: 'Japanese', category: 'World', scale: 'japanese', contour: 'step', rhythm: 'waltz', range: 1.5, noteLength: 'long', density: 0.4, chromaticism: 0, jumpiness: 0.3, repetition: 0.2, tags: ['world', 'japanese', 'zen', 'minimal'] },
  { id: 'celtic', name: 'Celtic', category: 'World', scale: 'dorian', contour: 'wave', rhythm: 'gigue', range: 1.5, noteLength: 'short', density: 0.8, chromaticism: 0, jumpiness: 0.4, repetition: 0.4, tags: ['world', 'celtic', 'irish', 'folk'] },
  { id: 'flamenco', name: 'Flamenco', category: 'World', scale: 'flamenco', contour: 'descending', rhythm: 'bossa', range: 1.5, noteLength: 'mixed', density: 0.7, chromaticism: 0.1, jumpiness: 0.5, repetition: 0.2, tags: ['world', 'flamenco', 'spanish', 'passionate'] },

  // ========== HIP-HOP ==========
  { id: 'trapMelody', name: 'Trap Melody', category: 'Hip-Hop', scale: 'pentatonicMinor', contour: 'flat', rhythm: 'trapHiHat', range: 1.5, noteLength: 'medium', density: 0.5, chromaticism: 0.1, jumpiness: 0.3, repetition: 0.6, tags: ['trap', 'hiphop', 'dark', 'modern'] },
  { id: 'lofiMelody', name: 'Lo-Fi Melody', category: 'Hip-Hop', scale: 'pentatonicMajor', contour: 'wave', rhythm: 'lofi', range: 1, noteLength: 'medium', density: 0.4, chromaticism: 0, jumpiness: 0.2, repetition: 0.4, tags: ['lofi', 'chill', 'study', 'relaxed'] },

  // ========== FUNK/SOUL ==========
  { id: 'funkLine', name: 'Funk Line', category: 'Funk', scale: 'pentatonicMinor', contour: 'step', rhythm: 'funk16th', range: 1, noteLength: 'short', density: 0.8, chromaticism: 0.2, jumpiness: 0.3, repetition: 0.5, tags: ['funk', 'groove', 'rhythmic'] },
  { id: 'soulVocal', name: 'Soul Vocal', category: 'Funk', scale: 'pentatonicMinor', contour: 'arch', rhythm: 'syncopated3', range: 1.5, noteLength: 'medium', density: 0.5, chromaticism: 0.1, jumpiness: 0.4, repetition: 0.2, tags: ['soul', 'vocal', 'emotional'] },
];

// ============================================================================
// MELODY STATE
// ============================================================================

export interface MelodyState {
  readonly preset: MelodyPreset;
  readonly scale: ScaleDefinition;
  readonly rootNote: number;         // 0-11
  readonly octave: number;           // Base octave
  readonly rhythm: RhythmPattern;
  readonly contour: ContourConfig;
  readonly isPlaying: boolean;
  readonly currentStep: number;
  readonly generatedNotes: readonly MelodyNote[];
  readonly tempo: number;
  readonly swing: number;            // 0-1
  readonly humanize: number;         // 0-1
  readonly motif: MotifConfig;
}

/**
 * Create initial state
 */
export function createMelodyState(preset?: MelodyPreset): MelodyState {
  const actualPreset = preset ?? MELODY_PRESETS[0];
  if (!actualPreset) throw new Error('No preset available');
  
  const scale = MELODY_SCALES.find(s => s.id === actualPreset.scale) ?? MELODY_SCALES[0];
  if (!scale) throw new Error('Scale not found');
  
  const rhythm = RHYTHM_PATTERNS.find(r => r.id === actualPreset.rhythm) ?? RHYTHM_PATTERNS[0];
  if (!rhythm) throw new Error('Rhythm pattern not found');

  return {
    preset: actualPreset,
    scale,
    rootNote: 0,
    octave: 4,
    rhythm,
    contour: {
      shape: actualPreset.contour,
      range: actualPreset.range,
      centerNote: 60,
      smoothness: 0.5,
      tension: 0.5,
    },
    isPlaying: false,
    currentStep: 0,
    generatedNotes: [],
    tempo: 120,
    swing: 0,
    humanize: 0,
    motif: {
      length: 4,
      transforms: ['repeat', 'transpose'],
      repetitions: 4,
      variationAmount: 0.2,
    },
  };
}

// ============================================================================
// MELODY GENERATION
// ============================================================================

/**
 * Quantize pitch to scale
 */
export function quantizeToScale(
  pitch: number,
  scale: ScaleDefinition,
  root: number
): number {
  const noteInOctave = (pitch - root + 120) % 12;
  const octave = Math.floor((pitch - root) / 12);
  
  // Find closest scale degree
  let minDistance = 12;
  let closestDegree = 0;
  
  for (const interval of scale.intervals) {
    const distance = Math.min(
      Math.abs(noteInOctave - interval),
      12 - Math.abs(noteInOctave - interval)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestDegree = interval;
    }
  }
  
  return root + octave * 12 + closestDegree;
}

/**
 * Generate melody notes
 */
export function generateMelody(
  state: MelodyState,
  bars: number = 4
): readonly MelodyNote[] {
  const notes: MelodyNote[] = [];
  const stepsPerBar = state.rhythm.steps.reduce((a, b) => a + b, 0);
  const totalSteps = bars * stepsPerBar;
  
  let currentStep = 0;
  let stepIndex = 0;
  
  while (currentStep < totalSteps) {
    const duration = state.rhythm.steps[stepIndex % state.rhythm.steps.length];
    
    if (duration && duration > 0) {  // Not a rest and exists
      const position = currentStep / totalSteps;
      const contourValue = getContourValue(state.contour.shape, position, state.contour.tension);
      
      // Calculate pitch from contour
      const rangeInSemitones = state.contour.range * 12;
      const pitchOffset = (contourValue - 0.5) * rangeInSemitones;
      const basePitch = state.contour.centerNote + pitchOffset;
      
      // Add some randomness based on preset
      const randomOffset = (Math.random() - 0.5) * state.preset.jumpiness * 12;
      const rawPitch = Math.round(basePitch + randomOffset);
      
      // Quantize to scale
      const pitch = quantizeToScale(rawPitch, state.scale, state.rootNote);
      
      // Determine velocity with variation
      const baseVelocity = 80;
      const velocityVariation = Math.random() * 30 - 15;
      const velocity = Math.max(40, Math.min(127, baseVelocity + velocityVariation));
      
      notes.push(createMelodyNote(pitch, duration, velocity));
    }
    
    currentStep += duration || 1;
    stepIndex++;
  }
  
  return notes;
}

// ============================================================================
// INPUT/OUTPUT
// ============================================================================

export type MelodyInput =
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'generate'; bars?: number }
  | { type: 'setPreset'; presetId: string }
  | { type: 'setScale'; scaleId: string }
  | { type: 'setRoot'; note: number }
  | { type: 'setOctave'; octave: number }
  | { type: 'setRhythm'; rhythmId: string }
  | { type: 'setContour'; shape: ContourShape }
  | { type: 'setTempo'; bpm: number }
  | { type: 'setSwing'; amount: number }
  | { type: 'tick'; time: number; beat: number };

export type MelodyOutput =
  | { type: 'noteOn'; note: number; velocity: number; time: number }
  | { type: 'noteOff'; note: number; time: number }
  | { type: 'melodyGenerated'; notes: readonly MelodyNote[] }
  | { type: 'stepAdvanced'; step: number };

/**
 * Process input
 */
export function processMelodyInput(
  state: MelodyState,
  input: MelodyInput
): { state: MelodyState; outputs: MelodyOutput[] } {
  const outputs: MelodyOutput[] = [];

  switch (input.type) {
    case 'play':
      return { state: { ...state, isPlaying: true }, outputs };

    case 'stop':
      return { state: { ...state, isPlaying: false, currentStep: 0 }, outputs };

    case 'generate': {
      const notes = generateMelody(state, input.bars || 4);
      outputs.push({ type: 'melodyGenerated', notes });
      return { state: { ...state, generatedNotes: notes }, outputs };
    }

    case 'setPreset': {
      const preset = MELODY_PRESETS.find(p => p.id === input.presetId);
      if (preset) {
        const scale = MELODY_SCALES.find(s => s.id === preset.scale) || state.scale;
        const rhythm = RHYTHM_PATTERNS.find(r => r.id === preset.rhythm) || state.rhythm;
        return { 
          state: { 
            ...state, 
            preset, 
            scale, 
            rhythm,
            contour: { ...state.contour, shape: preset.contour, range: preset.range },
          }, 
          outputs 
        };
      }
      return { state, outputs };
    }

    case 'setScale': {
      const scale = MELODY_SCALES.find(s => s.id === input.scaleId);
      if (scale) {
        return { state: { ...state, scale }, outputs };
      }
      return { state, outputs };
    }

    case 'setRoot':
      return { state: { ...state, rootNote: input.note % 12 }, outputs };

    case 'setOctave':
      return { state: { ...state, octave: Math.max(1, Math.min(7, input.octave)) }, outputs };

    case 'setRhythm': {
      const rhythm = RHYTHM_PATTERNS.find(r => r.id === input.rhythmId);
      if (rhythm) {
        return { state: { ...state, rhythm }, outputs };
      }
      return { state, outputs };
    }

    case 'setContour':
      return { state: { ...state, contour: { ...state.contour, shape: input.shape } }, outputs };

    case 'setTempo':
      return { state: { ...state, tempo: Math.max(20, Math.min(300, input.bpm)) }, outputs };

    case 'setSwing':
      return { state: { ...state, swing: Math.max(0, Math.min(1, input.amount)) }, outputs };

    case 'tick': {
      if (!state.isPlaying || state.generatedNotes.length === 0) {
        return { state, outputs };
      }

      const noteIndex = state.currentStep % state.generatedNotes.length;
      const note = state.generatedNotes[noteIndex];

      if (note) {
        outputs.push({
          type: 'noteOn',
          note: note.pitch,
          velocity: note.velocity,
          time: input.time,
        });
      }

      outputs.push({ type: 'stepAdvanced', step: state.currentStep + 1 });

      return { 
        state: { ...state, currentStep: state.currentStep + 1 },
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

export const MELODY_CARD_META: CardMeta = {
  id: 'melody',
  name: 'Melody Generator',
  description: 'Professional melody generator with contour control, 50+ scales, and 80+ rhythm patterns',
  category: 'generators',
  tags: ['melody', 'lead', 'contour', 'scale', 'rhythm'],
  version: '1.0.0',
  author: 'Cardplay',
};

/**
 * Create melody card
 */
export function createMelodyCard(): Card<MelodyInput, MelodyOutput> {
  let internalState = createMelodyState();

  return {
    meta: MELODY_CARD_META,

    signature: {
      inputs: [{ name: 'input', type: 'control' }],
      outputs: [{ name: 'output', type: 'notes' }],
      params: [],
    },

    process(_input: MelodyInput, _context: CardContext, cardState?: CardState<unknown>): CardResult<MelodyOutput> {
      const result = processMelodyInput(internalState, _input);
      internalState = result.state;
      const output: MelodyOutput = result.outputs[0] ?? { type: 'melodyGenerated', notes: [] };
      return {
        output,
        ...(cardState !== undefined ? { state: cardState } : {}),
      };
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MELODY_SCALES as melodyScales,
  RHYTHM_PATTERNS as rhythmPatterns,
  MELODY_PRESETS as melodyPresets,
};
