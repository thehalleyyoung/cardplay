/**
 * @fileoverview Notation Type Definitions.
 * 
 * Core types for the notation rendering engine.
 * These types map musical concepts to notation symbols.
 * 
 * @module @cardplay/core/notation/types
 */

// ============================================================================
// CLEF TYPES
// ============================================================================

/**
 * Clef type identifier.
 */
export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor' | 'soprano' | 'mezzo-soprano' | 'baritone' | 'percussion' | 'tab';

/**
 * Clef definition with line position.
 */
export interface ClefDefinition {
  readonly type: ClefType;
  /** Staff line (1-5 from bottom) where clef sits */
  readonly line: number;
  /** MIDI note number for middle line of staff with this clef */
  readonly middleLinePitch: number;
  /** Ottava shift: 8 = 8va, -8 = 8vb, 15 = 15ma, etc. */
  readonly ottava?: number;
}

/**
 * Standard clef definitions.
 */
export const CLEF_DEFINITIONS: Record<ClefType, ClefDefinition> = {
  treble: { type: 'treble', line: 2, middleLinePitch: 71 }, // B4
  bass: { type: 'bass', line: 4, middleLinePitch: 50 }, // D3
  alto: { type: 'alto', line: 3, middleLinePitch: 60 }, // C4
  tenor: { type: 'tenor', line: 4, middleLinePitch: 57 }, // A3
  soprano: { type: 'soprano', line: 1, middleLinePitch: 60 }, // C4
  'mezzo-soprano': { type: 'mezzo-soprano', line: 2, middleLinePitch: 60 }, // C4
  baritone: { type: 'baritone', line: 5, middleLinePitch: 60 }, // C4
  percussion: { type: 'percussion', line: 3, middleLinePitch: 60 },
  tab: { type: 'tab', line: 3, middleLinePitch: 64 }, // E4 for guitar
};

// ============================================================================
// KEY SIGNATURE TYPES
// ============================================================================

/**
 * Key signature specification.
 */
export interface KeySignature {
  /** Root note name */
  readonly root: NoteName;
  /** Mode: major or minor */
  readonly mode: 'major' | 'minor';
  /** Number of sharps (positive) or flats (negative) */
  readonly accidentals: number;
}

/**
 * Note name without octave.
 */
export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/**
 * Accidental type.
 */
export type AccidentalType = 
  | 'sharp' 
  | 'flat' 
  | 'natural' 
  | 'double-sharp' 
  | 'double-flat'
  | 'quarter-sharp'
  | 'quarter-flat'
  | 'three-quarter-sharp'
  | 'three-quarter-flat';

/**
 * Key signature definitions for all major/minor keys.
 */
export const KEY_SIGNATURES: Record<string, KeySignature> = {
  'C': { root: 'C', mode: 'major', accidentals: 0 },
  'G': { root: 'G', mode: 'major', accidentals: 1 },
  'D': { root: 'D', mode: 'major', accidentals: 2 },
  'A': { root: 'A', mode: 'major', accidentals: 3 },
  'E': { root: 'E', mode: 'major', accidentals: 4 },
  'B': { root: 'B', mode: 'major', accidentals: 5 },
  'F#': { root: 'F', mode: 'major', accidentals: 6 },
  'C#': { root: 'C', mode: 'major', accidentals: 7 },
  'F': { root: 'F', mode: 'major', accidentals: -1 },
  'Bb': { root: 'B', mode: 'major', accidentals: -2 },
  'Eb': { root: 'E', mode: 'major', accidentals: -3 },
  'Ab': { root: 'A', mode: 'major', accidentals: -4 },
  'Db': { root: 'D', mode: 'major', accidentals: -5 },
  'Gb': { root: 'G', mode: 'major', accidentals: -6 },
  'Cb': { root: 'C', mode: 'major', accidentals: -7 },
  // Minor keys
  'Am': { root: 'A', mode: 'minor', accidentals: 0 },
  'Em': { root: 'E', mode: 'minor', accidentals: 1 },
  'Bm': { root: 'B', mode: 'minor', accidentals: 2 },
  'F#m': { root: 'F', mode: 'minor', accidentals: 3 },
  'C#m': { root: 'C', mode: 'minor', accidentals: 4 },
  'G#m': { root: 'G', mode: 'minor', accidentals: 5 },
  'D#m': { root: 'D', mode: 'minor', accidentals: 6 },
  'A#m': { root: 'A', mode: 'minor', accidentals: 7 },
  'Dm': { root: 'D', mode: 'minor', accidentals: -1 },
  'Gm': { root: 'G', mode: 'minor', accidentals: -2 },
  'Cm': { root: 'C', mode: 'minor', accidentals: -3 },
  'Fm': { root: 'F', mode: 'minor', accidentals: -4 },
  'Bbm': { root: 'B', mode: 'minor', accidentals: -5 },
  'Ebm': { root: 'E', mode: 'minor', accidentals: -6 },
  'Abm': { root: 'A', mode: 'minor', accidentals: -7 },
};

// ============================================================================
// TIME SIGNATURE TYPES
// ============================================================================

/**
 * Time signature specification.
 */
export interface TimeSignature {
  /** Numerator (beats per measure) */
  readonly numerator: number;
  /** Denominator (beat unit: 4 = quarter, 8 = eighth, etc.) */
  readonly denominator: number;
  /** Display type */
  readonly display?: TimeSignatureDisplay;
}

/**
 * Time signature display type.
 */
export type TimeSignatureDisplay = 'numeric' | 'common' | 'cut' | 'single-number';

/**
 * Common time signatures.
 */
export const COMMON_TIME_SIGNATURES: Record<string, TimeSignature> = {
  '4/4': { numerator: 4, denominator: 4 },
  '3/4': { numerator: 3, denominator: 4 },
  '2/4': { numerator: 2, denominator: 4 },
  '6/8': { numerator: 6, denominator: 8 },
  '2/2': { numerator: 2, denominator: 2 },
  '3/8': { numerator: 3, denominator: 8 },
  '9/8': { numerator: 9, denominator: 8 },
  '12/8': { numerator: 12, denominator: 8 },
  '5/4': { numerator: 5, denominator: 4 },
  '7/8': { numerator: 7, denominator: 8 },
  'C': { numerator: 4, denominator: 4, display: 'common' },
  'cut': { numerator: 2, denominator: 2, display: 'cut' },
};

// ============================================================================
// NOTE DURATION TYPES
// ============================================================================

/**
 * Base note duration type.
 */
export type NoteDurationType = 
  | 'maxima'      // 8 whole notes (rare)
  | 'longa'       // 4 whole notes (rare)
  | 'breve'       // 2 whole notes (double whole)
  | 'whole'       // whole note / semibreve
  | 'half'        // half note / minim
  | 'quarter'     // quarter note / crotchet
  | 'eighth'      // eighth note / quaver
  | '16th'        // sixteenth / semiquaver
  | '32nd'        // thirty-second / demisemiquaver
  | '64th'        // sixty-fourth / hemidemisemiquaver
  | '128th'       // 128th / semihemidemisemiquaver
  | '256th';      // 256th (extremely rare)

/**
 * Duration value in terms of quarter notes (1.0 = quarter note).
 */
export const DURATION_VALUES: Record<NoteDurationType, number> = {
  'maxima': 32.0,
  'longa': 16.0,
  'breve': 8.0,
  'whole': 4.0,
  'half': 2.0,
  'quarter': 1.0,
  'eighth': 0.5,
  '16th': 0.25,
  '32nd': 0.125,
  '64th': 0.0625,
  '128th': 0.03125,
  '256th': 0.015625,
};

/**
 * Number of flags/beams for each duration.
 */
export const DURATION_FLAGS: Record<NoteDurationType, number> = {
  'maxima': 0,
  'longa': 0,
  'breve': 0,
  'whole': 0,
  'half': 0,
  'quarter': 0,
  'eighth': 1,
  '16th': 2,
  '32nd': 3,
  '64th': 4,
  '128th': 5,
  '256th': 6,
};

/**
 * Note duration with dots.
 */
export interface NoteDuration {
  readonly base: NoteDurationType;
  /** Number of dots (0, 1, or 2) */
  readonly dots: number;
}

/**
 * Calculate total duration value including dots.
 */
export function calculateDurationValue(duration: NoteDuration): number {
  const baseValue = DURATION_VALUES[duration.base];
  let total = baseValue;
  let dotValue = baseValue / 2;
  for (let i = 0; i < duration.dots; i++) {
    total += dotValue;
    dotValue /= 2;
  }
  return total;
}

/**
 * Find best matching duration for a given value in quarter notes.
 */
export function findClosestDuration(value: number): NoteDuration {
  const durations: NoteDurationType[] = [
    'maxima', 'longa', 'breve', 'whole', 'half', 'quarter',
    'eighth', '16th', '32nd', '64th', '128th', '256th'
  ];
  
  // Try each duration with 0, 1, 2 dots
  let closest: NoteDuration = { base: 'quarter', dots: 0 };
  let closestDiff = Math.abs(value - 1.0);
  
  for (const base of durations) {
    for (let dots = 0; dots <= 2; dots++) {
      const dur: NoteDuration = { base, dots };
      const durValue = calculateDurationValue(dur);
      const diff = Math.abs(value - durValue);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = dur;
      }
    }
  }
  
  return closest;
}

// ============================================================================
// BAR LINE TYPES
// ============================================================================

/**
 * Bar line type.
 */
export type BarLineType = 
  | 'single'
  | 'double'
  | 'end'           // Final double bar (thick)
  | 'repeat-start'
  | 'repeat-end'
  | 'repeat-both'
  | 'dashed'
  | 'dotted'
  | 'none';

// ============================================================================
// STEM & BEAM TYPES
// ============================================================================

/**
 * Stem direction.
 */
export type StemDirection = 'up' | 'down' | 'auto';

/**
 * Beam grouping pattern.
 */
export interface BeamGroup {
  /** Indices of notes in the beam group */
  readonly noteIndices: number[];
  /** Direction of stems in group */
  readonly stemDirection: StemDirection;
  /** Beam level (1 = eighth, 2 = sixteenth, etc.) */
  readonly level: number;
}

// ============================================================================
// TIE & SLUR TYPES
// ============================================================================

/**
 * Tie connecting two notes of same pitch.
 */
export interface NoteTie {
  readonly id: string;
  readonly startNoteId: string;
  readonly endNoteId: string;
  readonly placement: 'above' | 'below' | 'auto';
}

/**
 * Slur connecting multiple notes (phrase mark).
 */
export interface NoteSlur {
  readonly id: string;
  readonly startNoteId: string;
  readonly endNoteId: string;
  readonly placement: 'above' | 'below' | 'auto';
}

// ============================================================================
// TUPLET TYPES
// ============================================================================

/**
 * Tuplet specification (triplets, quintuplets, etc.).
 */
export interface Tuplet {
  readonly id: string;
  /** Number of notes played */
  readonly actual: number;
  /** In the space of how many normal notes */
  readonly normal: number;
  /** IDs of notes in this tuplet */
  readonly noteIds: string[];
  /** Whether to show bracket */
  readonly showBracket: boolean;
  /** Whether to show number */
  readonly showNumber: boolean;
  /** Placement */
  readonly placement: 'above' | 'below' | 'auto';
}

// ============================================================================
// STAFF & SYSTEM TYPES
// ============================================================================

/**
 * Single staff configuration.
 */
export interface StaffConfig {
  readonly id: string;
  readonly clef: ClefType;
  readonly keySignature: string;
  readonly timeSignature: string;
  /** Number of lines (usually 5, 1 for percussion, 6 for tab) */
  readonly lines: number;
  /** Whether staff is visible */
  readonly visible: boolean;
  /** Staff label (instrument name) */
  readonly label?: string;
  /** Short label for subsequent systems */
  readonly shortLabel?: string;
}

/**
 * Grand staff (piano) with two staves connected by brace.
 */
export interface GrandStaff {
  readonly id: string;
  readonly trebleStaff: StaffConfig;
  readonly bassStaff: StaffConfig;
  /** Whether to show brace */
  readonly showBrace: boolean;
  /** Label for the grand staff */
  readonly label?: string;
}

/**
 * System: a horizontal group of staves that play together.
 */
export interface SystemConfig {
  readonly id: string;
  readonly staves: StaffConfig[];
  /** Which staves are connected by brackets */
  readonly brackets: StaffBracket[];
  /** Whether to show system barlines */
  readonly systemBarlines: boolean;
}

/**
 * Staff bracket/brace grouping.
 */
export interface StaffBracket {
  readonly type: 'bracket' | 'brace' | 'line' | 'none';
  /** Start staff index */
  readonly startStaff: number;
  /** End staff index */
  readonly endStaff: number;
}

// ============================================================================
// PAGE LAYOUT TYPES
// ============================================================================

/**
 * Page configuration.
 */
export interface PageConfig {
  /** Width in pixels */
  readonly width: number;
  /** Height in pixels */
  readonly height: number;
  /** Margins */
  readonly margins: PageMargins;
  /** Staff spacing */
  readonly staffSpacing: number;
  /** System spacing */
  readonly systemSpacing: number;
}

/**
 * Page margins.
 */
export interface PageMargins {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/**
 * Default page configuration (A4-like).
 */
export const DEFAULT_PAGE_CONFIG: PageConfig = {
  width: 800,
  height: 1132, // ~A4 ratio
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  staffSpacing: 80,
  systemSpacing: 100,
};

/**
 * System break specification.
 */
export interface SystemBreak {
  /** Measure number after which to break */
  readonly afterMeasure: number;
  /** Whether this is a forced break or automatic */
  readonly forced: boolean;
}

/**
 * Page break specification.
 */
export interface PageBreak {
  /** Measure number after which to break */
  readonly afterMeasure: number;
  /** Whether this is a forced break or automatic */
  readonly forced: boolean;
}

// ============================================================================
// NOTATION NOTE TYPE
// ============================================================================

/**
 * A single notation note (may be part of a chord).
 */
export interface NotationNote {
  readonly id: string;
  /** MIDI pitch number */
  readonly pitch: number;
  /** Accidental to display (may differ from pitch's natural accidental) */
  readonly accidental?: AccidentalType;
  /** Whether accidental is courtesy/cautionary */
  readonly cautionary?: boolean;
}

/**
 * A notation event (single note or chord at a point in time).
 */
export interface NotationEvent {
  readonly id: string;
  /** Notes in this event (1 for single note, >1 for chord) */
  readonly notes: NotationNote[];
  /** Duration */
  readonly duration: NoteDuration;
  /** Start position in ticks */
  readonly tick: number;
  /** Voice number (for multi-voice notation) */
  readonly voice: number;
  /** Staff index (for multi-staff) */
  readonly staff: number;
  /** Stem direction override */
  readonly stemDirection?: StemDirection;
  /** Is this a rest? */
  readonly isRest: boolean;
  /** Articulations */
  readonly articulations?: ArticulationType[];
  /** Is grace note? */
  readonly isGrace?: boolean;
  /** Grace note type */
  readonly graceType?: 'acciaccatura' | 'appoggiatura';
}

/**
 * Articulation types.
 */
export type ArticulationType = 
  | 'staccato'
  | 'staccatissimo'
  | 'tenuto'
  | 'accent'
  | 'marcato'
  | 'fermata'
  | 'breath-mark'
  | 'caesura'
  | 'spiccato'
  | 'portato';

// ============================================================================
// MEASURE TYPE
// ============================================================================

/**
 * A measure in the notation.
 */
export interface NotationMeasure {
  readonly number: number;
  /** Events in this measure, indexed by voice */
  readonly events: Map<number, NotationEvent[]>;
  /** Time signature (if changes in this measure) */
  readonly timeSignature?: TimeSignature;
  /** Key signature (if changes in this measure) */
  readonly keySignature?: KeySignature;
  /** Clef changes */
  readonly clefChanges?: ClefChange[];
  /** Starting bar line type */
  readonly startBarLine?: BarLineType;
  /** Ending bar line type */
  readonly endBarLine?: BarLineType;
  /** Rehearsal mark */
  readonly rehearsalMark?: string;
  /** Tempo marking */
  readonly tempo?: TempoMarking;
}

/**
 * Clef change within a measure.
 */
export interface ClefChange {
  readonly tick: number;
  readonly clef: ClefType;
  readonly staff: number;
}

/**
 * Tempo marking.
 */
export interface TempoMarking {
  readonly bpm: number;
  readonly beatUnit: NoteDurationType;
  readonly text?: string; // "Allegro", "Andante", etc.
}

// ============================================================================
// VOICE SEPARATION
// ============================================================================

/**
 * Voice configuration for multi-voice notation.
 */
export interface VoiceConfig {
  readonly id: number;
  /** Preferred stem direction for this voice */
  readonly defaultStemDirection: StemDirection;
  /** Voice color for display */
  readonly color?: string;
  /** Voice label */
  readonly label?: string;
}

/**
 * Standard two-voice configuration (stems up / stems down).
 */
export const STANDARD_TWO_VOICES: VoiceConfig[] = [
  { id: 1, defaultStemDirection: 'up', label: 'Voice 1' },
  { id: 2, defaultStemDirection: 'down', label: 'Voice 2' },
];

/**
 * Standard four-voice configuration (SATB).
 */
export const STANDARD_FOUR_VOICES: VoiceConfig[] = [
  { id: 1, defaultStemDirection: 'up', label: 'Soprano' },
  { id: 2, defaultStemDirection: 'down', label: 'Alto' },
  { id: 3, defaultStemDirection: 'up', label: 'Tenor' },
  { id: 4, defaultStemDirection: 'down', label: 'Bass' },
];
