/**
 * @fileoverview Harmony-based cell coloring for tracker (G016-G019)
 * 
 * Provides non-intrusive visual hints showing:
 * - Chord tones (strongest highlight)
 * - Scale tones (medium highlight)  
 * - Out-of-key notes (subtle highlight)
 * 
 * Purely view-layer - does not mutate events.
 * 
 * @module @cardplay/boards/harmony/coloring
 */

/**
 * Note name to semitone mapping
 */
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

/**
 * Major scale intervals from root
 */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/**
 * Natural minor scale intervals from root
 */
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

/**
 * Note classification based on harmony context
 */
export type NoteClass = 'chord-tone' | 'scale-tone' | 'out-of-key';

/**
 * Harmony context for coloring
 */
export interface HarmonyContext {
  /** Current key (e.g., 'C', 'Am') */
  key: string;
  
  /** Current chord (e.g., 'Cmaj7', 'Dm') */
  chord: string;
}

/**
 * Parse a key signature into root and mode
 */
function parseKey(key: string): { root: string; isMinor: boolean } {
  const match = key.match(/^([A-G][b#]?)(m)?$/);
  if (!match || !match[1]) return { root: 'C', isMinor: false };
  return { root: match[1], isMinor: match[2] === 'm' };
}

/**
 * Parse a chord symbol into root and quality
 */
function parseChord(chord: string): { root: string; intervals: number[] } {
  const match = chord.match(/^([A-G][b#]?)(.*)?$/);
  if (!match || !match[1]) return { root: 'C', intervals: [0, 4, 7] };
  
  const root = match[1];
  const quality = match[2] || '';
  
  // Chord quality to intervals mapping
  const qualities: Record<string, number[]> = {
    '': [0, 4, 7],           // major
    'm': [0, 3, 7],          // minor
    '7': [0, 4, 7, 10],      // dominant 7
    'maj7': [0, 4, 7, 11],   // major 7
    'm7': [0, 3, 7, 10],     // minor 7
    'dim': [0, 3, 6],        // diminished
    'aug': [0, 4, 8],        // augmented
    '6': [0, 4, 7, 9],       // major 6
    'm6': [0, 3, 7, 9],      // minor 6
    '9': [0, 4, 7, 10, 14],  // dominant 9
    'maj9': [0, 4, 7, 11, 14], // major 9
    'm9': [0, 3, 7, 10, 14], // minor 9
    'sus4': [0, 5, 7],       // suspended 4th
    'sus2': [0, 2, 7],       // suspended 2nd
  };
  
  return {
    root,
    intervals: qualities[quality] ?? qualities['']!
  };
}

/**
 * Get scale degree semitones for a key
 */
function getScaleSemitones(key: string): Set<number> {
  const { root, isMinor } = parseKey(key);
  const rootSemitone = NOTE_TO_SEMITONE[root] ?? 0;
  const scaleIntervals = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  
  return new Set(scaleIntervals.map(interval => (rootSemitone + interval) % 12));
}

/**
 * Get chord tone semitones for a chord
 */
function getChordSemitones(chord: string): Set<number> {
  const { root, intervals } = parseChord(chord);
  const rootSemitone = NOTE_TO_SEMITONE[root] ?? 0;
  
  return new Set(intervals.map(interval => (rootSemitone + interval) % 12));
}

/**
 * Classify a note based on harmony context
 * 
 * @param noteName Note name (e.g., 'C', 'D#', 'Gb')
 * @param context Harmony context (key + chord)
 * @returns Note classification
 */
export function classifyNote(noteName: string, context: HarmonyContext): NoteClass {
  // Parse note to semitone
  const noteSemitone = NOTE_TO_SEMITONE[noteName];
  if (noteSemitone === undefined) return 'out-of-key';
  
  // Get chord tones and scale tones
  const chordTones = getChordSemitones(context.chord);
  const scaleTones = getScaleSemitones(context.key);
  
  // Classify by priority: chord tone > scale tone > out-of-key
  if (chordTones.has(noteSemitone)) {
    return 'chord-tone';
  } else if (scaleTones.has(noteSemitone)) {
    return 'scale-tone';
  } else {
    return 'out-of-key';
  }
}

/**
 * Get CSS class for note classification
 */
export function getNoteColorClass(noteClass: NoteClass): string {
  return `harmony-${noteClass}`;
}

/**
 * Get inline style for note classification
 * 
 * @param noteClass Note classification
 * @param colorMode Color mode ('subtle' | 'normal' | 'vibrant')
 * @returns CSS style properties
 */
export function getNoteColorStyle(noteClass: NoteClass, colorMode: 'subtle' | 'normal' | 'vibrant' = 'normal'): string {
  const alphas = {
    subtle: { chord: 0.2, scale: 0.1, out: 0.05 },
    normal: { chord: 0.3, scale: 0.15, out: 0.08 },
    vibrant: { chord: 0.5, scale: 0.25, out: 0.1 }
  };
  
  const alpha = alphas[colorMode];
  
  switch (noteClass) {
    case 'chord-tone':
      // Primary highlight - chord tones are the most important
      return `background-color: rgba(66, 165, 245, ${alpha.chord}); font-weight: 600;`;
    case 'scale-tone':
      // Secondary highlight - in key but not in current chord
      return `background-color: rgba(76, 175, 80, ${alpha.scale});`;
    case 'out-of-key':
      // Subtle highlight - chromatic/out-of-key notes
      return `background-color: rgba(255, 152, 0, ${alpha.out});`;
  }
}

/**
 * Inject CSS styles for harmony coloring
 */
export function injectHarmonyColoringStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'harmony-coloring-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Harmony coloring classes */
    .harmony-chord-tone {
      background-color: rgba(66, 165, 245, 0.3);
      font-weight: 600;
    }
    
    .harmony-scale-tone {
      background-color: rgba(76, 175, 80, 0.15);
    }
    
    .harmony-out-of-key {
      background-color: rgba(255, 152, 0, 0.08);
    }
    
    /* Hover states */
    .harmony-chord-tone:hover {
      background-color: rgba(66, 165, 245, 0.5);
    }
    
    .harmony-scale-tone:hover {
      background-color: rgba(76, 175, 80, 0.25);
    }
    
    .harmony-out-of-key:hover {
      background-color: rgba(255, 152, 0, 0.15);
    }
    
    /* Transition for smooth coloring */
    [class*="harmony-"] {
      transition: background-color 0.2s ease;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Settings for harmony coloring
 */
export interface HarmonyColoringSettings {
  /** Enable harmony coloring */
  enabled: boolean;
  
  /** Color intensity */
  colorMode: 'subtle' | 'normal' | 'vibrant';
  
  /** Show roman numerals in chord display */
  showRomanNumerals: boolean;
}

/**
 * Default harmony coloring settings
 */
export const DEFAULT_HARMONY_COLORING_SETTINGS: HarmonyColoringSettings = {
  enabled: true,
  colorMode: 'normal',
  showRomanNumerals: false
};
