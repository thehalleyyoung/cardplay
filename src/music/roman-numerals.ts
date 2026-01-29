/**
 * @fileoverview Roman Numeral Analysis Helpers (G020)
 * 
 * Converts chord symbols to roman numeral analysis relative to a key.
 * Used for harmony display panels on assisted boards.
 * 
 * @module @cardplay/music/roman-numerals
 */

/**
 * Roman numeral quality markers
 */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/**
 * Note names in chromatic order
 */
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Major scale intervals (semitones from root)
 */
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Minor scale intervals (natural minor)
 */
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/**
 * Gets pitch class (0-11) from note name
 */
function getPitchClass(note: string): number {
  // Handle specific flat notes
  const flatToSharp: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };
  const normalized = flatToSharp[note] || note;
  const index = CHROMATIC_NOTES.indexOf(normalized);
  return index >= 0 ? index : 0;
}

/**
 * Parses a chord symbol into root and quality
 */
function parseChord(chord: string): { root: string; quality: string } {
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match || !match[1]) return { root: 'C', quality: '' };
  return { root: match[1], quality: match[2] || '' };
}

/**
 * Determines if a chord quality is minor
 */
function isMinorQuality(quality: string): boolean {
  // Don't match "maj" as minor!
  if (quality.startsWith('maj')) return false;
  return quality.startsWith('m') || quality.startsWith('min') || quality.includes('dim');
}

/**
 * Determines if a chord quality is diminished
 */
function isDiminishedQuality(quality: string): boolean {
  return quality.includes('dim') || quality === 'o' || quality === '°';
}

/**
 * Determines if a chord quality is augmented
 */
function isAugmentedQuality(quality: string): boolean {
  return quality.includes('aug') || quality === '+';
}

/**
 * Converts chord symbol to roman numeral analysis.
 * 
 * @param chord Chord symbol (e.g., "Dm7", "G7", "Cmaj7")
 * @param key Key signature (e.g., "C", "Am", "Bb", "F#m")
 * @returns Roman numeral analysis (e.g., "ii7", "V7", "Imaj7") or null if chord is not in key
 */
export function chordToRomanNumeral(chord: string, key: string): string | null {
  if (!chord || !key) return null;
  
  const { root: chordRoot, quality } = parseChord(chord);
  const keyRoot = key.replace(/m$/, '');
  const isMinorKey = key.endsWith('m');
  
  // Get pitch classes
  const chordPitch = getPitchClass(chordRoot);
  const keyPitch = getPitchClass(keyRoot);
  
  // Get scale intervals for key
  const scaleIntervals = isMinorKey ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  
  // Find which scale degree this chord root is
  const semitoneFromRoot = (chordPitch - keyPitch + 12) % 12;
  const scaleDegreeIndex = scaleIntervals.indexOf(semitoneFromRoot);
  
  // If chord root is not in scale, return null (chromatic chord)
  if (scaleDegreeIndex === -1) {
    return null;
  }
  
  // Get roman numeral for this scale degree
  const romanBase = ROMAN_NUMERALS[scaleDegreeIndex];
  if (!romanBase) return null;
  
  // Determine case and quality markers
  const isChordMinor = isMinorQuality(quality);
  const isChordDim = isDiminishedQuality(quality);
  const isChordAug = isAugmentedQuality(quality);
  
  // In major key: I, ii, iii, IV, V, vi, vii°
  // In minor key: i, ii°, III, iv, v, VI, VII
  let romanNumeral: string;
  
  if (isMinorKey) {
    // Minor key conventions
    // i, ii°, III, iv, v, VI, VII
    const naturallyMinor = [1, 2, 4, 5].includes(scaleDegreeIndex + 1);  // i, ii°, iv, v are minor/dim
    romanNumeral = naturallyMinor ? romanBase.toLowerCase() : romanBase;
    
    // Add diminished symbol for ii°
    if (scaleDegreeIndex === 1 && isChordDim) {
      romanNumeral += '°';
    }
  } else {
    // Major key conventions
    const naturallyMinor = [2, 3, 6].includes(scaleDegreeIndex + 1);
    const naturallyDim = scaleDegreeIndex === 6; // vii° in major
    
    if (isChordDim && naturallyDim) {
      romanNumeral = romanBase.toLowerCase() + '°';
    } else if (isChordMinor && naturallyMinor) {
      romanNumeral = romanBase.toLowerCase();
    } else if (!isChordMinor && !naturallyMinor) {
      romanNumeral = romanBase;
    } else {
      // Altered chord (e.g., IV -> iv borrowed from minor)
      romanNumeral = isChordMinor ? romanBase.toLowerCase() : romanBase;
    }
  }
  
  // Add quality extensions
  if (isChordDim && !romanNumeral.includes('°')) {
    romanNumeral += '°';
  } else if (isChordAug) {
    romanNumeral += '+';
  }
  
  // Add 7th, 9th, etc. from quality
  const extensions = quality.replace(/^m(?!aj)/, '').replace(/dim/, '').replace(/aug/, '');
  if (extensions) {
    romanNumeral += extensions;
  }
  
  return romanNumeral;
}

/**
 * Gets a description of what scale degree a chord represents.
 * 
 * @param chord Chord symbol
 * @param key Key signature
 * @returns Description like "Tonic", "Dominant", "Subdominant", etc.
 */
export function getChordFunction(chord: string, key: string): string | null {
  const roman = chordToRomanNumeral(chord, key);
  if (!roman) return null;
  
  const degreeMap: Record<string, string> = {
    'I': 'Tonic',
    'II': 'Supertonic',
    'III': 'Mediant',
    'IV': 'Subdominant',
    'V': 'Dominant',
    'VI': 'Submediant',
    'VII': 'Leading Tone'
  };
  
  // Extract base roman numeral (uppercase)
  const baseRoman = roman.replace(/[°+]/g, '').replace(/\d+/g, '').toUpperCase();
  return degreeMap[baseRoman] || null;
}

/**
 * Roman numeral analysis result
 */
export interface RomanNumeralAnalysis {
  /** Roman numeral (e.g., "ii7", "V7", "Imaj7") */
  numeral: string | null;
  /** Function (e.g., "Tonic", "Dominant") */
  function: string | null;
  /** Whether chord is diatonic to key */
  isDiatonic: boolean;
  /** Scale degree (1-7) */
  scaleDegree: number | null;
}

/**
 * Analyzes a chord in context of a key.
 * 
 * @param chord Chord symbol
 * @param key Key signature
 * @returns Complete analysis
 */
export function analyzeChord(chord: string, key: string): RomanNumeralAnalysis {
  const numeral = chordToRomanNumeral(chord, key);
  const func = getChordFunction(chord, key);
  const isDiatonic = numeral !== null;
  
  // Get scale degree
  let scaleDegree: number | null = null;
  if (numeral) {
    const baseRoman = numeral.replace(/[°+]/g, '').replace(/\d+/g, '').toUpperCase();
    scaleDegree = ROMAN_NUMERALS.indexOf(baseRoman) + 1;
  }
  
  return {
    numeral,
    function: func,
    isDiatonic,
    scaleDegree
  };
}
