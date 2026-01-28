/**
 * @fileoverview Transposing instruments and concert pitch handling.
 * 
 * Supports automatic transposition for instruments that sound different
 * from written pitch (e.g., Bb trumpet, F horn, Eb alto sax).
 * 
 * @module @cardplay/core/notation/transposition
 */

// ============================================================================
// TRANSPOSITION TYPES
// ============================================================================

/**
 * Instrument transposition configuration.
 */
export interface TransposingInstrument {
  readonly name: string;
  readonly transposition: number; // Semitones (positive = sounds higher, negative = sounds lower)
  readonly displayKey: string; // Key signature to show in part
  readonly octaveShift?: number; // Additional octave shift (-1, 0, +1, +2)
}

/**
 * Common transposing instruments.
 */
export const TRANSPOSING_INSTRUMENTS: Record<string, TransposingInstrument> = {
  // Bb instruments (sound major 2nd lower than written)
  'clarinet-bb': {
    name: 'Clarinet in Bb',
    transposition: -2,
    displayKey: 'Bb',
  },
  'trumpet-bb': {
    name: 'Trumpet in Bb',
    transposition: -2,
    displayKey: 'Bb',
  },
  'soprano-sax-bb': {
    name: 'Soprano Saxophone in Bb',
    transposition: -2,
    displayKey: 'Bb',
  },
  'tenor-sax-bb': {
    name: 'Tenor Saxophone in Bb',
    transposition: -14, // Major 9th lower (octave + major 2nd)
    displayKey: 'Bb',
    octaveShift: -1,
  },
  'bass-clarinet-bb': {
    name: 'Bass Clarinet in Bb',
    transposition: -14, // Major 9th lower
    displayKey: 'Bb',
    octaveShift: -1,
  },
  
  // Eb instruments
  'alto-sax-eb': {
    name: 'Alto Saxophone in Eb',
    transposition: -9, // Major 6th lower
    displayKey: 'Eb',
  },
  'baritone-sax-eb': {
    name: 'Baritone Saxophone in Eb',
    transposition: -21, // Major 13th lower (octave + major 6th)
    displayKey: 'Eb',
    octaveShift: -1,
  },
  'alto-clarinet-eb': {
    name: 'Alto Clarinet in Eb',
    transposition: -9,
    displayKey: 'Eb',
  },
  'alto-horn-eb': {
    name: 'Alto Horn in Eb',
    transposition: -9,
    displayKey: 'Eb',
  },
  
  // F instruments (sound perfect 5th lower than written)
  'horn-f': {
    name: 'Horn in F',
    transposition: -7,
    displayKey: 'F',
  },
  'english-horn': {
    name: 'English Horn in F',
    transposition: -7,
    displayKey: 'F',
  },
  
  // Other transpositions
  'horn-eb': {
    name: 'Horn in Eb',
    transposition: -9,
    displayKey: 'Eb',
  },
  'horn-d': {
    name: 'Horn in D',
    transposition: -10,
    displayKey: 'D',
  },
  'trumpet-c': {
    name: 'Trumpet in C',
    transposition: 0,
    displayKey: 'C',
  },
  'piccolo': {
    name: 'Piccolo',
    transposition: 12, // Octave higher
    displayKey: 'C',
    octaveShift: 1,
  },
  'double-bass': {
    name: 'Double Bass',
    transposition: -12, // Octave lower
    displayKey: 'C',
    octaveShift: -1,
  },
  'guitar': {
    name: 'Guitar',
    transposition: -12, // Sounds octave lower than written
    displayKey: 'C',
    octaveShift: -1,
  },
};

// ============================================================================
// CONCERT PITCH CONVERSION
// ============================================================================

/**
 * Convert written pitch to concert (sounding) pitch.
 */
export function writtenToConcert(
  writtenPitch: number,
  instrument: TransposingInstrument
): number {
  return writtenPitch + instrument.transposition;
}

/**
 * Convert concert (sounding) pitch to written pitch.
 */
export function concertToWritten(
  concertPitch: number,
  instrument: TransposingInstrument
): number {
  return concertPitch - instrument.transposition;
}

/**
 * Transpose entire part between concert and written pitch.
 */
export function transposePart(
  pitches: readonly number[],
  instrument: TransposingInstrument,
  toConcert: boolean
): readonly number[] {
  const semitones = toConcert ? instrument.transposition : -instrument.transposition;
  return pitches.map((pitch) => pitch + semitones);
}

// ============================================================================
// KEY SIGNATURE ADJUSTMENT
// ============================================================================

/**
 * Calculate the written key signature for a transposing instrument.
 */
export function getWrittenKeySignature(
  concertKey: string,
  instrument: TransposingInstrument
): string {
  // Map of key transpositions (concert key -> written key for each transposition interval)
  const keyTranspositions: Record<number, Record<string, string>> = {
    // Bb instruments (-2 semitones)
    [-2]: {
      'C': 'D', 'G': 'A', 'D': 'E', 'A': 'B', 'E': 'F#', 'B': 'C#', 'F#': 'G#',
      'F': 'G', 'Bb': 'C', 'Eb': 'F', 'Ab': 'Bb', 'Db': 'Eb', 'Gb': 'Ab',
      'Am': 'Bm', 'Em': 'F#m', 'Bm': 'C#m', 'F#m': 'G#m', 'C#m': 'D#m',
      'Dm': 'Em', 'Gm': 'Am', 'Cm': 'Dm', 'Fm': 'Gm', 'Bbm': 'Cm',
    },
    // Eb instruments (-9 semitones)
    [-9]: {
      'C': 'A', 'G': 'E', 'D': 'B', 'A': 'F#', 'E': 'C#', 'B': 'G#',
      'F': 'D', 'Bb': 'G', 'Eb': 'C', 'Ab': 'F', 'Db': 'Bb', 'Gb': 'Eb',
      'Am': 'F#m', 'Em': 'C#m', 'Bm': 'G#m',
      'Dm': 'Bm', 'Gm': 'Em', 'Cm': 'Am', 'Fm': 'Dm', 'Bbm': 'Gm',
    },
    // F instruments (-7 semitones)
    [-7]: {
      'C': 'G', 'G': 'D', 'D': 'A', 'A': 'E', 'E': 'B', 'B': 'F#', 'F#': 'C#',
      'F': 'C', 'Bb': 'F', 'Eb': 'Bb', 'Ab': 'Eb', 'Db': 'Ab', 'Gb': 'Db',
      'Am': 'Em', 'Em': 'Bm', 'Bm': 'F#m', 'F#m': 'C#m',
      'Dm': 'Am', 'Gm': 'Dm', 'Cm': 'Gm', 'Fm': 'Cm', 'Bbm': 'Fm',
    },
  };
  
  const transpositionMap = keyTranspositions[instrument.transposition];
  if (transpositionMap && concertKey in transpositionMap) {
    const result = transpositionMap[concertKey];
    if (result !== undefined) {
      return result;
    }
  }
  
  // Fallback: return concert key if no mapping exists
  return concertKey;
}

// ============================================================================
// DISPLAY MODE
// ============================================================================

/**
 * Display mode for transposing instruments.
 */
export type DisplayMode = 'written' | 'concert';

/**
 * Score configuration for transposing instruments.
 */
export interface TranspositionConfig {
  readonly mode: DisplayMode;
  readonly instrument?: TransposingInstrument;
  readonly showConcertPitchToggle: boolean;
}

/**
 * Default transposition configuration.
 */
export const DEFAULT_TRANSPOSITION_CONFIG: TranspositionConfig = {
  mode: 'written',
  showConcertPitchToggle: true,
};

/**
 * Get instrument by name.
 */
export function getTransposingInstrument(name: string): TransposingInstrument | null {
  return TRANSPOSING_INSTRUMENTS[name] || null;
}

/**
 * List all transposing instruments by family.
 */
export function getInstrumentsByFamily(): Record<string, TransposingInstrument[]> {
  const instruments = TRANSPOSING_INSTRUMENTS;
  return {
    'Bb Instruments': [
      instruments['clarinet-bb'],
      instruments['trumpet-bb'],
      instruments['soprano-sax-bb'],
      instruments['tenor-sax-bb'],
      instruments['bass-clarinet-bb'],
    ].filter((i): i is TransposingInstrument => i !== undefined),
    'Eb Instruments': [
      instruments['alto-sax-eb'],
      instruments['baritone-sax-eb'],
      instruments['alto-clarinet-eb'],
      instruments['alto-horn-eb'],
    ].filter((i): i is TransposingInstrument => i !== undefined),
    'F Instruments': [
      instruments['horn-f'],
      instruments['english-horn'],
    ].filter((i): i is TransposingInstrument => i !== undefined),
    'Other': [
      instruments['piccolo'],
      instruments['double-bass'],
      instruments['guitar'],
    ].filter((i): i is TransposingInstrument => i !== undefined),
  };
}

/**
 * Check if instrument is transposing.
 */
export function isTransposing(instrument: TransposingInstrument): boolean {
  return instrument.transposition !== 0;
}
