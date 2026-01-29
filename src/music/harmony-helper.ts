/**
 * @fileoverview Harmony Helper - Music Theory Utilities (G016-G020)
 *
 * Provides classification of notes relative to harmony context:
 * - Chord tones (notes in the current chord)
 * - Scale tones (notes in the current key/scale)
 * - Out-of-key notes (chromatic notes)
 *
 * Used for visual coloring in harmony-assisted boards.
 *
 * @module @cardplay/music/harmony-helper
 */

// ============================================================================
// TYPES
// ============================================================================

export type NoteClass = 'chord-tone' | 'scale-tone' | 'out-of-key';

export interface HarmonyContext {
  key: string | null;
  chord: string | null;
}

export interface NoteClassification {
  noteClass: NoteClass;
  isChordTone: boolean;
  isScaleTone: boolean;
  isOutOfKey: boolean;
}

// ============================================================================
// NOTE HELPERS
// ============================================================================

/**
 * Note names in chromatic order
 */
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Normalizes a note name (converts flats to sharps)
 */
function normalizeNote(note: string): string {
  const flatToSharp: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };
  return flatToSharp[note] || note;
}

/**
 * Gets the pitch class (0-11) from a note name
 */
function getPitchClass(note: string): number {
  const normalized = normalizeNote(note);
  const index = CHROMATIC_NOTES.indexOf(normalized);
  return index >= 0 ? index : 0;
}

// ============================================================================
// SCALE HELPERS
// ============================================================================

/**
 * Scale intervals (semitones from root)
 */
const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
};

/**
 * Determines scale type from key signature
 */
function getScaleType(key: string): 'major' | 'minor' {
  return key.endsWith('m') ? 'minor' : 'major';
}

/**
 * Gets the root note from a key signature
 */
function getKeyRoot(key: string): string {
  return key.replace(/m$/, '');
}

/**
 * Gets scale notes for a given key
 */
function getScaleNotes(key: string): number[] {
  const root = getKeyRoot(key);
  const scaleType = getScaleType(key);
  const rootPitch = getPitchClass(root);
  const intervals = SCALE_INTERVALS[scaleType] || SCALE_INTERVALS['major']!;
  
  return intervals.map(interval => (rootPitch + interval) % 12);
}

// ============================================================================
// CHORD HELPERS
// ============================================================================

/**
 * Chord quality intervals (semitones from root)
 */
const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],           // major
  'm': [0, 3, 7],          // minor
  '7': [0, 4, 7, 10],      // dominant 7
  'maj7': [0, 4, 7, 11],   // major 7
  'm7': [0, 3, 7, 10],     // minor 7
  'dim': [0, 3, 6],        // diminished
  'dim7': [0, 3, 6, 9],    // diminished 7
  'aug': [0, 4, 8],        // augmented
  '6': [0, 4, 7, 9],       // major 6
  'm6': [0, 3, 7, 9],      // minor 6
  '9': [0, 4, 7, 10, 14],  // dominant 9
  'maj9': [0, 4, 7, 11, 14], // major 9
  'm9': [0, 3, 7, 10, 14], // minor 9
  'sus4': [0, 5, 7],       // suspended 4th
  'sus2': [0, 2, 7],       // suspended 2nd
  'add9': [0, 4, 7, 14],   // add 9
};

/**
 * Parses a chord symbol into root and quality
 */
function parseChord(chord: string): { root: string; quality: string } {
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match || !match[1]) return { root: 'C', quality: '' };
  return { root: match[1], quality: match[2] || '' };
}

/**
 * Gets chord tones (pitch classes) for a chord symbol
 */
function getChordTones(chord: string): number[] {
  const { root, quality } = parseChord(chord);
  const rootPitch = getPitchClass(root);
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS['']!;
  
  return intervals.map(interval => (rootPitch + interval) % 12);
}

// ============================================================================
// NOTE CLASSIFICATION
// ============================================================================

/**
 * Classifies a MIDI note number relative to harmony context.
 * 
 * Priority:
 * 1. Chord tone (highest priority - note is in current chord)
 * 2. Scale tone (note is in current key/scale but not in chord)
 * 3. Out-of-key (chromatic note not in scale)
 * 
 * @param midiNote MIDI note number (0-127)
 * @param context Current harmony context (key + chord)
 * @returns Note classification
 */
export function classifyNote(midiNote: number, context: HarmonyContext): NoteClassification {
  const pitchClass = midiNote % 12;
  
  // Get chord tones and scale tones
  const chordTones = context.chord ? getChordTones(context.chord) : [];
  const scaleTones = context.key ? getScaleNotes(context.key) : [];
  
  // Check if note is chord tone (highest priority)
  const isChordTone = chordTones.includes(pitchClass);
  if (isChordTone) {
    return {
      noteClass: 'chord-tone',
      isChordTone: true,
      isScaleTone: true, // Chord tones are also scale tones
      isOutOfKey: false,
    };
  }
  
  // Check if note is scale tone
  const isScaleTone = scaleTones.includes(pitchClass);
  if (isScaleTone) {
    return {
      noteClass: 'scale-tone',
      isChordTone: false,
      isScaleTone: true,
      isOutOfKey: false,
    };
  }
  
  // Out-of-key (chromatic)
  return {
    noteClass: 'out-of-key',
    isChordTone: false,
    isScaleTone: false,
    isOutOfKey: true,
  };
}

/**
 * Gets CSS color class for a note classification.
 * Used for visual coloring in tracker/piano roll.
 * 
 * @param classification Note classification
 * @returns CSS class name
 */
export function getHarmonyColorClass(classification: NoteClassification): string {
  switch (classification.noteClass) {
    case 'chord-tone':
      return 'harmony-chord-tone';
    case 'scale-tone':
      return 'harmony-scale-tone';
    case 'out-of-key':
      return 'harmony-out-of-key';
    default:
      return '';
  }
}

/**
 * Gets CSS variables for harmony coloring.
 * Can be injected into document or component.
 */
export function getHarmonyColorVars(): Record<string, string> {
  return {
    '--harmony-chord-tone-bg': 'rgba(16, 185, 129, 0.3)',      // Green tint
    '--harmony-chord-tone-border': 'rgba(16, 185, 129, 0.6)',
    '--harmony-scale-tone-bg': 'rgba(59, 130, 246, 0.2)',      // Blue tint
    '--harmony-scale-tone-border': 'rgba(59, 130, 246, 0.4)',
    '--harmony-out-of-key-bg': 'rgba(245, 158, 11, 0.2)',      // Orange tint
    '--harmony-out-of-key-border': 'rgba(245, 158, 11, 0.4)',
  };
}

/**
 * Injects harmony color CSS variables into document.
 */
export function injectHarmonyColors(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'harmony-color-vars';
  if (document.getElementById(styleId)) return;
  
  const vars = getHarmonyColorVars();
  const cssText = `:root {
${Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}

.harmony-chord-tone {
  background: var(--harmony-chord-tone-bg) !important;
  border-color: var(--harmony-chord-tone-border) !important;
}

.harmony-scale-tone {
  background: var(--harmony-scale-tone-bg) !important;
  border-color: var(--harmony-scale-tone-border) !important;
}

.harmony-out-of-key {
  background: var(--harmony-out-of-key-bg) !important;
  border-color: var(--harmony-out-of-key-border) !important;
}`;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = cssText;
  document.head.appendChild(style);
}
