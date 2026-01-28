/**
 * @fileoverview Drum notation implementation.
 * 
 * Provides drum-specific notation with proper note head shapes and staff placement.
 * Supports General MIDI drum mapping and custom percussion keys.
 * 
 * @module @cardplay/core/notation/drum-notation
 */

// ============================================================================
// DRUM NOTE MAPPING
// ============================================================================

/**
 * Drum instrument definition with notation properties.
 */
export interface DrumInstrument {
  readonly name: string;
  readonly midiNote: number;
  readonly staffLine: number; // 1-5 from bottom, or ledger lines (0, 6+)
  readonly noteHead: DrumNoteHead;
  readonly stemDirection: 'up' | 'down' | 'none';
}

/**
 * Note head shapes for drum notation.
 */
export type DrumNoteHead =
  | 'normal' // Filled note head (default)
  | 'x' // Cross note head (hi-hat, ride)
  | 'circle' // Open circle (open hi-hat)
  | 'triangle' // Triangle (cowbell, triangle)
  | 'diamond' // Diamond (rim shot)
  | 'square' // Square (wood block)
  | 'slash'; // Slash (rhythmic notation)

/**
 * General MIDI drum map (notes 35-81).
 */
export const GM_DRUM_MAP: Record<number, DrumInstrument> = {
  35: { name: 'Acoustic Bass Drum', midiNote: 35, staffLine: 1, noteHead: 'normal', stemDirection: 'down' },
  36: { name: 'Bass Drum 1', midiNote: 36, staffLine: 1, noteHead: 'normal', stemDirection: 'down' },
  37: { name: 'Side Stick', midiNote: 37, staffLine: 3, noteHead: 'x', stemDirection: 'up' },
  38: { name: 'Acoustic Snare', midiNote: 38, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  39: { name: 'Hand Clap', midiNote: 39, staffLine: 3, noteHead: 'triangle', stemDirection: 'up' },
  40: { name: 'Electric Snare', midiNote: 40, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  41: { name: 'Low Floor Tom', midiNote: 41, staffLine: 2, noteHead: 'normal', stemDirection: 'down' },
  42: { name: 'Closed Hi-Hat', midiNote: 42, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  43: { name: 'High Floor Tom', midiNote: 43, staffLine: 2, noteHead: 'normal', stemDirection: 'up' },
  44: { name: 'Pedal Hi-Hat', midiNote: 44, staffLine: 5, noteHead: 'x', stemDirection: 'down' },
  45: { name: 'Low Tom', midiNote: 45, staffLine: 3, noteHead: 'normal', stemDirection: 'down' },
  46: { name: 'Open Hi-Hat', midiNote: 46, staffLine: 5, noteHead: 'circle', stemDirection: 'up' },
  47: { name: 'Low-Mid Tom', midiNote: 47, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  48: { name: 'Hi-Mid Tom', midiNote: 48, staffLine: 4, noteHead: 'normal', stemDirection: 'up' },
  49: { name: 'Crash Cymbal 1', midiNote: 49, staffLine: 6, noteHead: 'x', stemDirection: 'up' },
  50: { name: 'High Tom', midiNote: 50, staffLine: 4, noteHead: 'normal', stemDirection: 'up' },
  51: { name: 'Ride Cymbal 1', midiNote: 51, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  52: { name: 'Chinese Cymbal', midiNote: 52, staffLine: 6, noteHead: 'x', stemDirection: 'up' },
  53: { name: 'Ride Bell', midiNote: 53, staffLine: 5, noteHead: 'triangle', stemDirection: 'up' },
  54: { name: 'Tambourine', midiNote: 54, staffLine: 6, noteHead: 'x', stemDirection: 'up' },
  55: { name: 'Splash Cymbal', midiNote: 55, staffLine: 6, noteHead: 'x', stemDirection: 'up' },
  56: { name: 'Cowbell', midiNote: 56, staffLine: 6, noteHead: 'triangle', stemDirection: 'up' },
  57: { name: 'Crash Cymbal 2', midiNote: 57, staffLine: 6, noteHead: 'x', stemDirection: 'up' },
  58: { name: 'Vibraslap', midiNote: 58, staffLine: 5, noteHead: 'diamond', stemDirection: 'up' },
  59: { name: 'Ride Cymbal 2', midiNote: 59, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  60: { name: 'Hi Bongo', midiNote: 60, staffLine: 4, noteHead: 'normal', stemDirection: 'up' },
  61: { name: 'Low Bongo', midiNote: 61, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  62: { name: 'Mute Hi Conga', midiNote: 62, staffLine: 4, noteHead: 'normal', stemDirection: 'up' },
  63: { name: 'Open Hi Conga', midiNote: 63, staffLine: 4, noteHead: 'circle', stemDirection: 'up' },
  64: { name: 'Low Conga', midiNote: 64, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  65: { name: 'High Timbale', midiNote: 65, staffLine: 4, noteHead: 'normal', stemDirection: 'up' },
  66: { name: 'Low Timbale', midiNote: 66, staffLine: 3, noteHead: 'normal', stemDirection: 'up' },
  67: { name: 'High Agogo', midiNote: 67, staffLine: 5, noteHead: 'triangle', stemDirection: 'up' },
  68: { name: 'Low Agogo', midiNote: 68, staffLine: 4, noteHead: 'triangle', stemDirection: 'up' },
  69: { name: 'Cabasa', midiNote: 69, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  70: { name: 'Maracas', midiNote: 70, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  71: { name: 'Short Whistle', midiNote: 71, staffLine: 6, noteHead: 'triangle', stemDirection: 'up' },
  72: { name: 'Long Whistle', midiNote: 72, staffLine: 6, noteHead: 'triangle', stemDirection: 'up' },
  73: { name: 'Short Guiro', midiNote: 73, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  74: { name: 'Long Guiro', midiNote: 74, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  75: { name: 'Claves', midiNote: 75, staffLine: 5, noteHead: 'x', stemDirection: 'up' },
  76: { name: 'Hi Wood Block', midiNote: 76, staffLine: 5, noteHead: 'square', stemDirection: 'up' },
  77: { name: 'Low Wood Block', midiNote: 77, staffLine: 4, noteHead: 'square', stemDirection: 'up' },
  78: { name: 'Mute Cuica', midiNote: 78, staffLine: 4, noteHead: 'triangle', stemDirection: 'up' },
  79: { name: 'Open Cuica', midiNote: 79, staffLine: 4, noteHead: 'circle', stemDirection: 'up' },
  80: { name: 'Mute Triangle', midiNote: 80, staffLine: 6, noteHead: 'triangle', stemDirection: 'up' },
  81: { name: 'Open Triangle', midiNote: 81, staffLine: 6, noteHead: 'triangle', stemDirection: 'up' },
};

// ============================================================================
// PERCUSSION KEY
// ============================================================================

/**
 * Percussion key shows which line represents which instrument.
 */
export interface PercussionKey {
  readonly instruments: ReadonlyArray<DrumInstrument>;
  readonly layout: 'standard' | 'compact' | 'custom';
}

/**
 * Standard 5-line percussion staff layout.
 */
export const STANDARD_DRUM_KEY: PercussionKey = {
  layout: 'standard',
  instruments: [
    GM_DRUM_MAP[36],
    GM_DRUM_MAP[38],
    GM_DRUM_MAP[42],
    GM_DRUM_MAP[46],
    GM_DRUM_MAP[49],
  ].filter((drum): drum is DrumInstrument => drum !== undefined),
};

/**
 * Get drum instrument by MIDI note number.
 */
export function getDrumInstrument(midiNote: number): DrumInstrument | null {
  return GM_DRUM_MAP[midiNote] || null;
}

/**
 * Find all drums that use a specific staff line.
 */
export function getDrumsByStaffLine(line: number): ReadonlyArray<DrumInstrument> {
  return Object.values(GM_DRUM_MAP).filter((drum) => drum.staffLine === line);
}

// ============================================================================
// UNPITCHED PERCUSSION
// ============================================================================

/**
 * Unpitched percussion notation (single line or rhythmic slashes).
 */
export interface UnpitchedNotation {
  readonly instrument: string;
  readonly notation: 'single-line' | 'rhythmic-slashes';
  readonly noteHead: DrumNoteHead;
}

/**
 * Common unpitched percussion instruments.
 */
export const UNPITCHED_INSTRUMENTS: Record<string, UnpitchedNotation> = {
  'shaker': {
    instrument: 'Shaker',
    notation: 'rhythmic-slashes',
    noteHead: 'slash',
  },
  'tambourine': {
    instrument: 'Tambourine',
    notation: 'single-line',
    noteHead: 'x',
  },
  'maracas': {
    instrument: 'Maracas',
    notation: 'rhythmic-slashes',
    noteHead: 'x',
  },
  'guiro': {
    instrument: 'Guiro',
    notation: 'single-line',
    noteHead: 'x',
  },
  'whistle': {
    instrument: 'Whistle',
    notation: 'single-line',
    noteHead: 'triangle',
  },
};

/**
 * Get unpitched notation for instrument name.
 */
export function getUnpitchedNotation(instrument: string): UnpitchedNotation | null {
  return UNPITCHED_INSTRUMENTS[instrument.toLowerCase()] || null;
}

// ============================================================================
// DRUM STAFF CONFIGURATION
// ============================================================================

/**
 * Drum staff configuration.
 */
export interface DrumStaffConfig {
  readonly key: PercussionKey;
  readonly showInstrumentNames: boolean;
  readonly showNoteHeadLegend: boolean;
  readonly allowCustomMapping: boolean;
}

/**
 * Default drum staff configuration.
 */
export const DEFAULT_DRUM_STAFF_CONFIG: DrumStaffConfig = {
  key: STANDARD_DRUM_KEY,
  showInstrumentNames: true,
  showNoteHeadLegend: false,
  allowCustomMapping: true,
};

/**
 * Create custom percussion key from selected instruments.
 */
export function createCustomPercussionKey(
  instruments: ReadonlyArray<number> // MIDI note numbers
): PercussionKey {
  const drumInstruments = instruments
    .map((note) => getDrumInstrument(note))
    .filter((drum): drum is DrumInstrument => drum !== null);
  
  return {
    layout: 'custom',
    instruments: drumInstruments,
  };
}

// ============================================================================
// RENDERING UTILITIES
// ============================================================================

/**
 * Get SVG path for drum note head.
 */
export function getDrumNoteHeadPath(noteHead: DrumNoteHead): string {
  switch (noteHead) {
    case 'normal':
      return 'M -4 0 A 4 3 0 0 1 4 0 A 4 3 0 0 1 -4 0 Z'; // Ellipse
    case 'x':
      return 'M -4 -4 L 4 4 M -4 4 L 4 -4'; // Cross
    case 'circle':
      return 'M -4 0 A 4 3 0 0 1 4 0 A 4 3 0 0 1 -4 0 M -3 0 A 3 2 0 0 0 3 0 A 3 2 0 0 0 -3 0'; // Open circle
    case 'triangle':
      return 'M 0 -4 L 4 3 L -4 3 Z'; // Triangle
    case 'diamond':
      return 'M 0 -4 L 4 0 L 0 4 L -4 0 Z'; // Diamond
    case 'square':
      return 'M -3 -3 L 3 -3 L 3 3 L -3 3 Z'; // Square
    case 'slash':
      return 'M -4 4 L 4 -4'; // Slash
    default:
      return '';
  }
}

/**
 * Determine if note should have stem based on duration and note head.
 */
export function drumNoteRequiresStem(noteHead: DrumNoteHead, duration: number): boolean {
  if (noteHead === 'slash') return false;
  return duration < 4.0; // Whole notes and longer don't have stems
}
