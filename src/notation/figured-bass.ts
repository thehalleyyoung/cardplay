/**
 * @fileoverview Basso continuo figured bass notation.
 * 
 * Supports figured bass numbers and accidentals for Baroque continuo parts.
 * Includes Roman numeral analysis and chord symbol conversion.
 * 
 * @module @cardplay/core/notation/figured-bass
 */

// ============================================================================
// FIGURED BASS TYPES
// ============================================================================

/**
 * Figured bass figure for a bass note.
 */
export interface FiguredBassFigure {
  readonly numbers: ReadonlyArray<FigureNumber>;
  readonly duration: number; // Duration in ticks
}

/**
 * Individual figure number with optional accidental.
 */
export interface FigureNumber {
  readonly number: number; // 2, 3, 4, 5, 6, 7, 8, 9, etc.
  readonly accidental?: FigureAccidental;
  readonly position?: 'above' | 'below' | 'through'; // Position of accidental relative to number
}

/**
 * Accidental for figured bass.
 */
export type FigureAccidental = 'sharp' | 'flat' | 'natural';

/**
 * Common figured bass patterns.
 */
export const FIGURED_BASS_PATTERNS: Record<string, readonly FigureNumber[]> = {
  // Root position triads
  '': [], // Empty = 5/3 implied
  '5/3': [{ number: 5 }, { number: 3 }],
  '8/5/3': [{ number: 8 }, { number: 5 }, { number: 3 }],
  
  // First inversion (6 chords)
  '6': [{ number: 6 }], // 6/3 implied
  '6/3': [{ number: 6 }, { number: 3 }],
  '6/4/3': [{ number: 6 }, { number: 4 }, { number: 3 }],
  
  // Second inversion (6/4 chords)
  '6/4': [{ number: 6 }, { number: 4 }],
  '8/6/4': [{ number: 8 }, { number: 6 }, { number: 4 }],
  
  // Seventh chords
  '7': [{ number: 7 }], // 7/5/3 implied
  '7/5/3': [{ number: 7 }, { number: 5 }, { number: 3 }],
  '6/5': [{ number: 6 }, { number: 5 }], // First inversion seventh
  '4/3': [{ number: 4 }, { number: 3 }], // Second inversion seventh
  '4/2': [{ number: 4 }, { number: 2 }], // Third inversion seventh (also written as 2)
  '2': [{ number: 2 }], // Third inversion seventh shorthand
  
  // Ninth chords
  '9': [{ number: 9 }],
  '9/7': [{ number: 9 }, { number: 7 }],
  
  // Suspensions
  '4-3': [{ number: 4 }, { number: 3 }], // 4-3 suspension
  '7-6': [{ number: 7 }, { number: 6 }], // 7-6 suspension
  '9-8': [{ number: 9 }, { number: 8 }], // 9-8 suspension
  '2-3': [{ number: 2 }, { number: 3 }], // 2-3 suspension
  
  // Augmented sixth chords
  'Aug6': [{ number: 6, accidental: 'sharp' }], // Italian sixth
  'Aug6/5': [{ number: 6, accidental: 'sharp' }, { number: 5 }], // French sixth
  'Aug6/4/3': [{ number: 6, accidental: 'sharp' }, { number: 4 }, { number: 3 }], // German sixth
};

// ============================================================================
// FIGURE PARSING
// ============================================================================

/**
 * Parse figured bass string to figure objects.
 */
export function parseFiguredBass(figureString: string): ReadonlyArray<FigureNumber> {
  const pattern = FIGURED_BASS_PATTERNS[figureString];
  if (pattern !== undefined) {
    return pattern;
  }
  
  // Parse custom figures
  const parts = figureString.split('/');
  const figures: FigureNumber[] = [];
  
  for (const part of parts) {
    const match = part.match(/^([#bnat])?(\d+)([#bnat])?$/);
    if (match) {
      const accidentalBefore = parseAccidental(match[1]);
      const numberStr = match[2];
      const accidentalAfter = parseAccidental(match[3]);
      
      if (numberStr !== undefined) {
        const number = parseInt(numberStr, 10);
        const accidental = accidentalBefore || accidentalAfter;
        const position = accidentalBefore ? 'above' as const : accidentalAfter ? 'below' as const : undefined;
        
        figures.push({
          number,
          ...(accidental !== undefined && { accidental }),
          ...(position !== undefined && { position }),
        });
      }
    }
  }
  
  return figures;
}

/**
 * Parse accidental character.
 */
function parseAccidental(char?: string): FigureAccidental | undefined {
  switch (char) {
    case '#':
      return 'sharp';
    case 'b':
      return 'flat';
    case 'nat':
      return 'natural';
    default:
      return undefined;
  }
}

/**
 * Format figures back to string.
 */
export function formatFiguredBass(figures: ReadonlyArray<FigureNumber>): string {
  if (figures.length === 0) return '';
  
  return figures
    .map((fig) => {
      let str = '';
      if (fig.accidental && fig.position === 'above') {
        str += formatAccidental(fig.accidental);
      }
      str += fig.number.toString();
      if (fig.accidental && fig.position !== 'above') {
        str += formatAccidental(fig.accidental);
      }
      return str;
    })
    .join('/');
}

/**
 * Format accidental to symbol.
 */
function formatAccidental(accidental: FigureAccidental): string {
  switch (accidental) {
    case 'sharp':
      return '#';
    case 'flat':
      return 'b';
    case 'natural':
      return '♮';
  }
}

// ============================================================================
// CHORD REALIZATION
// ============================================================================

/**
 * Realize figured bass to actual chord intervals above bass.
 */
export function realizeFiguredBass(
  bassNote: number,
  figures: ReadonlyArray<FigureNumber>
): ReadonlyArray<number> {
  // Default to root position triad if no figures
  if (figures.length === 0) {
    return [bassNote, bassNote + 4, bassNote + 7]; // Major triad (adjust based on key)
  }
  
  const intervals = new Set([0]); // Always include bass
  
  for (const figure of figures) {
    let semitones = 0;
    
    // Approximate interval in semitones (would need key context for accuracy)
    switch (figure.number) {
      case 2:
        semitones = 2; // Major 2nd
        break;
      case 3:
        semitones = 4; // Major 3rd
        break;
      case 4:
        semitones = 5; // Perfect 4th
        break;
      case 5:
        semitones = 7; // Perfect 5th
        break;
      case 6:
        semitones = 9; // Major 6th
        break;
      case 7:
        semitones = 11; // Major 7th
        break;
      case 8:
        semitones = 12; // Octave
        break;
      case 9:
        semitones = 14; // Major 9th
        break;
    }
    
    // Adjust for accidentals
    if (figure.accidental === 'sharp') {
      semitones += 1;
    } else if (figure.accidental === 'flat') {
      semitones -= 1;
    }
    
    intervals.add(semitones);
  }
  
  return Array.from(intervals)
    .sort((a, b) => a - b)
    .map((interval) => bassNote + interval);
}

// ============================================================================
// ROMAN NUMERAL ANALYSIS
// ============================================================================

/**
 * Roman numeral chord symbol.
 */
export interface RomanNumeral {
  readonly degree: number; // 1-7 (I-VII)
  readonly quality: ChordQuality;
  readonly inversion: number; // 0 = root, 1 = first inversion, etc.
  readonly figures?: ReadonlyArray<FigureNumber>;
}

/**
 * Chord quality for Roman numeral analysis.
 */
export type ChordQuality = 
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant-seventh'
  | 'major-seventh'
  | 'minor-seventh'
  | 'half-diminished'
  | 'diminished-seventh';

/**
 * Convert figured bass to Roman numeral.
 */
export function figuredBassToRomanNumeral(
  bassNote: number,
  figures: ReadonlyArray<FigureNumber>,
  keyRoot: number
): RomanNumeral {
  const degree = ((bassNote - keyRoot) % 12 + 12) % 12 + 1;
  
  // Determine quality and inversion from figures
  let quality: ChordQuality = 'major';
  let inversion = 0;
  
  const figureString = formatFiguredBass(figures);
  
  if (figureString === '6' || figureString === '6/3') {
    inversion = 1;
  } else if (figureString === '6/4') {
    inversion = 2;
  } else if (figureString === '7') {
    quality = 'dominant-seventh';
  } else if (figureString === '6/5') {
    quality = 'dominant-seventh';
    inversion = 1;
  } else if (figureString === '4/3') {
    quality = 'dominant-seventh';
    inversion = 2;
  } else if (figureString === '4/2' || figureString === '2') {
    quality = 'dominant-seventh';
    inversion = 3;
  }
  
  return { degree, quality, inversion, figures };
}

/**
 * Format Roman numeral to string (e.g., "V7", "ii⁶", "viio").
 */
export function formatRomanNumeral(roman: RomanNumeral): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const numeral = numerals[roman.degree - 1];
  if (numeral === undefined) {
    return '?';
  }
  let str = numeral;
  
  // Adjust case for minor chords
  if (roman.quality === 'minor' || roman.quality === 'minor-seventh') {
    str = str.toLowerCase();
  }
  
  // Add quality symbols
  if (roman.quality === 'diminished' || roman.quality === 'diminished-seventh') {
    str = str.toLowerCase() + 'o';
  } else if (roman.quality === 'augmented') {
    str += '+';
  } else if (roman.quality === 'half-diminished') {
    str = str.toLowerCase() + 'ø';
  }
  
  // Add seventh symbol
  if (roman.quality.includes('seventh')) {
    str += '7';
  }
  
  // Add inversion symbol
  if (roman.inversion === 1) {
    str += '⁶';
  } else if (roman.inversion === 2) {
    str += '⁶₄';
  } else if (roman.inversion === 3) {
    str += '⁴₂';
  }
  
  return str;
}

// ============================================================================
// RENDERING UTILITIES
// ============================================================================

/**
 * Calculate vertical positions for stacked figured bass numbers.
 */
export function calculateFigurePositions(
  figures: ReadonlyArray<FigureNumber>,
  baselineY: number,
  spacing: number = 12
): ReadonlyArray<{ number: FigureNumber; y: number }> {
  return figures.map((figure, index) => ({
    number: figure,
    y: baselineY - index * spacing,
  }));
}

/**
 * Get SVG path for figured bass accidental symbol.
 */
export function getFigureAccidentalPath(accidental: FigureAccidental): string {
  switch (accidental) {
    case 'sharp':
      return 'M -1 -6 L -1 -2 L 1 -2 L 1 -6 M -2 -5 L 2 -4 M -2 -3 L 2 -2';
    case 'flat':
      return 'M 0 -6 L 0 2 M 0 -2 Q 2 -1 2 1 Q 2 3 0 2';
    case 'natural':
      return 'M -2 -4 L -2 2 M 2 -2 L 2 4 M -2 0 L 2 0';
    default:
      return '';
  }
}
