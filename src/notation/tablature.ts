/**
 * @fileoverview Tablature (tab) notation implementation.
 * 
 * Supports guitar, bass, ukulele, banjo, and other fretted instruments.
 * Includes standard notation conversion and fret position calculation.
 * 
 * @module @cardplay/core/notation/tablature
 */

// ============================================================================
// INSTRUMENT TUNINGS
// ============================================================================

/**
 * String tuning definition (MIDI note numbers from lowest to highest string).
 */
export interface StringTuning {
  readonly name: string;
  readonly strings: readonly number[];
  readonly fretCount: number;
}

/**
 * Standard tunings for common instruments.
 */
export const STANDARD_TUNINGS: Record<string, StringTuning> = {
  // Guitar (6 strings)
  'guitar-standard': {
    name: 'Guitar Standard (E)',
    strings: [40, 45, 50, 55, 59, 64], // E2, A2, D3, G3, B3, E4
    fretCount: 24,
  },
  'guitar-drop-d': {
    name: 'Guitar Drop D',
    strings: [38, 45, 50, 55, 59, 64], // D2, A2, D3, G3, B3, E4
    fretCount: 24,
  },
  'guitar-dadgad': {
    name: 'Guitar DADGAD',
    strings: [38, 45, 50, 55, 57, 62], // D2, A2, D3, G3, A3, D4
    fretCount: 24,
  },
  'guitar-open-g': {
    name: 'Guitar Open G',
    strings: [38, 43, 50, 55, 59, 62], // D2, G2, D3, G3, B3, D4
    fretCount: 24,
  },
  // Bass (4 strings)
  'bass-4-standard': {
    name: 'Bass 4-String Standard',
    strings: [28, 33, 38, 43], // E1, A1, D2, G2
    fretCount: 24,
  },
  'bass-5-standard': {
    name: 'Bass 5-String Standard',
    strings: [23, 28, 33, 38, 43], // B0, E1, A1, D2, G2
    fretCount: 24,
  },
  // Ukulele
  'ukulele-standard': {
    name: 'Ukulele Standard (GCEA)',
    strings: [67, 60, 64, 69], // G4, C4, E4, A4
    fretCount: 15,
  },
  // Banjo (5 strings)
  'banjo-open-g': {
    name: 'Banjo Open G',
    strings: [67, 50, 55, 59, 62], // G4 (5th), D3, G3, B3, D4
    fretCount: 22,
  },
};

// ============================================================================
// TAB NOTATION TYPES
// ============================================================================

/**
 * Fret position on a specific string.
 */
export interface TabNote {
  readonly stringIndex: number; // 0 = lowest string
  readonly fret: number; // 0 = open string
  readonly technique?: TabTechnique;
}

/**
 * Playing techniques for tab notation.
 */
export type TabTechnique = 
  | 'hammer-on'
  | 'pull-off'
  | 'slide-up'
  | 'slide-down'
  | 'bend'
  | 'vibrato'
  | 'palm-mute'
  | 'harmonic'
  | 'pinch-harmonic'
  | 'trill'
  | 'tapping'
  | 'slap'
  | 'pop';

/**
 * Tab measure containing notes for all strings.
 */
export interface TabMeasure {
  readonly notes: ReadonlyArray<TabNote | null>; // null = rest
  readonly barline?: 'single' | 'double' | 'repeat-start' | 'repeat-end' | 'final';
}

// ============================================================================
// PITCH TO TAB CONVERSION
// ============================================================================

/**
 * Find all possible fret positions for a MIDI pitch on a given tuning.
 * Returns array of [stringIndex, fret] pairs.
 */
export function findFretPositions(
  pitch: number,
  tuning: StringTuning
): ReadonlyArray<[number, number]> {
  const positions: Array<[number, number]> = [];
  
  for (let stringIndex = 0; stringIndex < tuning.strings.length; stringIndex++) {
    const openNote = tuning.strings[stringIndex];
    if (openNote === undefined) continue;
    
    const fret = pitch - openNote;
    
    if (fret >= 0 && fret <= tuning.fretCount) {
      positions.push([stringIndex, fret]);
    }
  }
  
  return positions;
}

/**
 * Choose best fret position from available options.
 * Prefers lower frets and middle strings for ergonomics.
 */
export function chooseBestFretPosition(
  positions: ReadonlyArray<[number, number]>,
  previousPosition?: [number, number]
): [number, number] | null {
  if (positions.length === 0) return null;
  const firstPos = positions[0];
  if (firstPos === undefined) return null;
  if (positions.length === 1) return firstPos;
  
  // If we have a previous position, prefer staying on the same string or nearby
  if (previousPosition) {
    const [prevString, prevFret] = previousPosition;
    
    // Find position closest to previous (minimize hand movement)
    let bestPos = firstPos;
    let minDistance = Math.abs(firstPos[0] - prevString) + 
                      Math.abs(firstPos[1] - prevFret);
    
    for (let i = 1; i < positions.length; i++) {
      const pos = positions[i];
      if (pos === undefined) continue;
      const distance = Math.abs(pos[0] - prevString) + 
                       Math.abs(pos[1] - prevFret);
      if (distance < minDistance) {
        minDistance = distance;
        bestPos = pos;
      }
    }
    
    return bestPos;
  }
  
  // No previous position: prefer middle strings with lower frets
  return positions.reduce((best, curr) => {
    const bestScore = best[1] + Math.abs(best[0] - positions.length / 2);
    const currScore = curr[1] + Math.abs(curr[0] - positions.length / 2);
    return currScore < bestScore ? curr : best;
  });
}

/**
 * Convert MIDI note sequence to tablature notation.
 */
export function convertToTab(
  pitches: readonly number[],
  tuning: StringTuning
): ReadonlyArray<TabNote | null> {
  const result: Array<TabNote | null> = [];
  let previousPosition: [number, number] | undefined;
  
  for (const pitch of pitches) {
    if (pitch === -1) {
      // Rest
      result.push(null);
      continue;
    }
    
    const positions = findFretPositions(pitch, tuning);
    const chosen = chooseBestFretPosition(positions, previousPosition);
    
    if (chosen) {
      result.push({
        stringIndex: chosen[0],
        fret: chosen[1],
      });
      previousPosition = chosen;
    } else {
      // Pitch out of range
      result.push(null);
    }
  }
  
  return result;
}

// ============================================================================
// CHORD DIAGRAMS
// ============================================================================

/**
 * Chord diagram showing finger positions.
 */
export interface ChordDiagram {
  readonly name: string;
  readonly fingers: ReadonlyArray<ChordFinger>;
  readonly barres: ReadonlyArray<ChordBarre>;
  readonly muted: ReadonlySet<number>; // String indices that are muted (x)
}

/**
 * Individual finger position.
 */
export interface ChordFinger {
  readonly stringIndex: number;
  readonly fret: number;
  readonly finger?: 1 | 2 | 3 | 4; // Which finger to use
}

/**
 * Barre across multiple strings.
 */
export interface ChordBarre {
  readonly fret: number;
  readonly startString: number;
  readonly endString: number;
  readonly finger: 1 | 2 | 3 | 4;
}

/**
 * Common guitar chord shapes.
 */
export const GUITAR_CHORD_LIBRARY: Record<string, ChordDiagram> = {
  'C': {
    name: 'C Major',
    fingers: [
      { stringIndex: 1, fret: 1, finger: 1 },
      { stringIndex: 2, fret: 0 },
      { stringIndex: 3, fret: 2, finger: 2 },
      { stringIndex: 4, fret: 3, finger: 3 },
    ],
    barres: [],
    muted: new Set([0]), // Low E muted
  },
  'G': {
    name: 'G Major',
    fingers: [
      { stringIndex: 0, fret: 3, finger: 2 },
      { stringIndex: 1, fret: 2, finger: 1 },
      { stringIndex: 2, fret: 0 },
      { stringIndex: 3, fret: 0 },
      { stringIndex: 4, fret: 0 },
      { stringIndex: 5, fret: 3, finger: 3 },
    ],
    barres: [],
    muted: new Set(),
  },
  'D': {
    name: 'D Major',
    fingers: [
      { stringIndex: 2, fret: 2, finger: 1 },
      { stringIndex: 3, fret: 3, finger: 3 },
      { stringIndex: 4, fret: 2, finger: 2 },
    ],
    barres: [],
    muted: new Set([0, 1]), // Low E and A muted
  },
  'Em': {
    name: 'E Minor',
    fingers: [
      { stringIndex: 1, fret: 2, finger: 2 },
      { stringIndex: 2, fret: 2, finger: 3 },
    ],
    barres: [],
    muted: new Set(),
  },
  'Am': {
    name: 'A Minor',
    fingers: [
      { stringIndex: 2, fret: 2, finger: 3 },
      { stringIndex: 3, fret: 2, finger: 2 },
      { stringIndex: 4, fret: 1, finger: 1 },
    ],
    barres: [],
    muted: new Set([0]), // Low E muted
  },
};

/**
 * Get chord diagram by name.
 */
export function getChordDiagram(name: string): ChordDiagram | null {
  return GUITAR_CHORD_LIBRARY[name] || null;
}

/**
 * Generate chord diagram from fret positions.
 */
export function createChordDiagram(
  name: string,
  positions: ReadonlyArray<number | null> // Fret for each string, null = muted
): ChordDiagram {
  const fingers: ChordFinger[] = [];
  const muted = new Set<number>();
  
  positions.forEach((fret, stringIndex) => {
    if (fret === null) {
      muted.add(stringIndex);
    } else if (fret > 0) {
      fingers.push({ stringIndex, fret });
    }
  });
  
  return { name, fingers, barres: [], muted };
}

// ============================================================================
// TAB RENDERING HELPERS
// ============================================================================

/**
 * Format fret number for display (single digit, or double for 10+).
 */
export function formatFret(fret: number): string {
  return fret < 10 ? String(fret) : String(fret);
}

/**
 * Format tab line with fret numbers and technique symbols.
 */
export function formatTabLine(
  notes: ReadonlyArray<TabNote | null>,
  stringIndex: number
): string {
  const chars: string[] = [];
  
  for (const note of notes) {
    if (note === null || note.stringIndex !== stringIndex) {
      chars.push('-');
    } else {
      chars.push(formatFret(note.fret));
      
      // Add technique symbols
      if (note.technique) {
        switch (note.technique) {
          case 'hammer-on':
            chars.push('h');
            break;
          case 'pull-off':
            chars.push('p');
            break;
          case 'slide-up':
            chars.push('/');
            break;
          case 'slide-down':
            chars.push('\\');
            break;
          case 'bend':
            chars.push('b');
            break;
          case 'vibrato':
            chars.push('~');
            break;
        }
      }
    }
    
    chars.push('-');
  }
  
  return chars.join('');
}
