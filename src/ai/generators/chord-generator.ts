/**
 * @fileoverview Chord Progression Generator
 * 
 * Prolog-powered chord progression generator that uses the music theory
 * knowledge base to generate harmonically coherent progressions.
 * 
 * L194-L196: Chord progression generator using Prolog KB
 * 
 * @module @cardplay/ai/generators/chord-generator
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * A chord in a progression.
 */
export interface Chord {
  /** Root note name (e.g., 'c', 'fsharp') */
  readonly root: string;
  /** Chord quality (e.g., 'major', 'minor', 'dom7') */
  readonly quality: string;
  /** Roman numeral analysis (e.g., 'I', 'iv', 'V7') */
  readonly numeral: string;
  /** Start time in ticks */
  readonly start: number;
  /** Duration in ticks */
  readonly duration: number;
}

/**
 * Key context for chord generation.
 */
export interface KeyContext {
  /** Root note name */
  readonly root: string;
  /** Mode (e.g., 'major', 'minor') */
  readonly mode: string;
}

/**
 * Chord generation options.
 */
export interface ChordGeneratorOptions {
  /** Genre for progression style */
  readonly genre?: string;
  /** Number of chords to generate (default: 4) */
  readonly length?: number;
  /** Random seed for reproducibility */
  readonly seed?: number;
  /** Ticks per beat (default: 480) */
  readonly ticksPerBeat?: number;
  /** Beats per chord (default: 4) */
  readonly beatsPerChord?: number;
  /** Whether to allow borrowed chords (default: false) */
  readonly allowBorrowed?: boolean;
  /** Whether to use extended chords (default: false) */
  readonly useExtensions?: boolean;
  /** Target cadence type (e.g., 'authentic', 'plagal', 'deceptive') */
  readonly cadence?: string;
}

/**
 * Generated chord progression result.
 */
export interface ChordGeneratorResult {
  /** Generated chords */
  readonly chords: Chord[];
  /** Key used */
  readonly key: KeyContext;
  /** Genre used */
  readonly genre: string;
}

// =============================================================================
// Note Mapping
// =============================================================================

/**
 * Map note names to semitone offsets.
 */
const NOTE_TO_SEMITONE: Record<string, number> = {
  'c': 0, 'csharp': 1, 'dflat': 1,
  'd': 2, 'dsharp': 3, 'eflat': 3,
  'e': 4, 'fflat': 4,
  'f': 5, 'esharp': 5, 'fsharp': 6, 'gflat': 6,
  'g': 7, 'gsharp': 8, 'aflat': 8,
  'a': 9, 'asharp': 10, 'bflat': 10,
  'b': 11, 'cflat': 11
};

/**
 * Map semitone offsets to note names (using sharps).
 */
const SEMITONE_TO_NOTE: Record<number, string> = {
  0: 'c', 1: 'csharp', 2: 'd', 3: 'dsharp',
  4: 'e', 5: 'f', 6: 'fsharp', 7: 'g',
  8: 'gsharp', 9: 'a', 10: 'asharp', 11: 'b'
};

/**
 * Scale degrees for major key (diatonic chords).
 */
const MAJOR_SCALE_DEGREES: readonly { semitone: number; quality: string; numeral: string }[] = [
  { semitone: 0, quality: 'major', numeral: 'I' },
  { semitone: 2, quality: 'minor', numeral: 'ii' },
  { semitone: 4, quality: 'minor', numeral: 'iii' },
  { semitone: 5, quality: 'major', numeral: 'IV' },
  { semitone: 7, quality: 'major', numeral: 'V' },
  { semitone: 9, quality: 'minor', numeral: 'vi' },
  { semitone: 11, quality: 'dim', numeral: 'vii°' }
];

/**
 * Scale degrees for minor key (natural minor diatonic chords).
 */
const MINOR_SCALE_DEGREES: readonly { semitone: number; quality: string; numeral: string }[] = [
  { semitone: 0, quality: 'minor', numeral: 'i' },
  { semitone: 2, quality: 'dim', numeral: 'ii°' },
  { semitone: 3, quality: 'major', numeral: 'III' },
  { semitone: 5, quality: 'minor', numeral: 'iv' },
  { semitone: 7, quality: 'minor', numeral: 'v' },
  { semitone: 8, quality: 'major', numeral: 'VI' },
  { semitone: 10, quality: 'major', numeral: 'VII' }
];

// =============================================================================
// Common Progressions
// =============================================================================

/**
 * Common chord progressions by genre (as scale degree indices 0-6).
 */
const COMMON_PROGRESSIONS: Record<string, number[][]> = {
  'pop': [
    [0, 4, 5, 3],      // I-V-vi-IV
    [0, 3, 4, 4],      // I-IV-V-V
    [0, 5, 3, 4],      // I-vi-IV-V
    [5, 3, 0, 4]       // vi-IV-I-V
  ],
  'rock': [
    [0, 3, 4, 4],      // I-IV-V-V
    [0, 4, 3, 3],      // I-V-IV-IV
    [0, 5, 3, 4],      // I-vi-IV-V
    [0, 0, 3, 4]       // I-I-IV-V
  ],
  'jazz': [
    [1, 4, 0, 0],      // ii-V-I-I
    [0, 5, 1, 4],      // I-vi-ii-V
    [2, 5, 1, 4],      // iii-vi-ii-V
    [0, 1, 2, 3]       // I-ii-iii-IV
  ],
  'blues': [
    [0, 0, 0, 0],      // I-I-I-I (first 4 bars)
    [3, 3, 0, 0],      // IV-IV-I-I
    [4, 3, 0, 4]       // V-IV-I-V
  ],
  'edm': [
    [0, 4, 5, 3],      // I-V-vi-IV
    [5, 3, 0, 4],      // vi-IV-I-V
    [0, 3, 5, 4]       // I-IV-vi-V
  ],
  'house': [
    [0, 4, 5, 3],      // I-V-vi-IV
    [5, 3, 0, 4]       // vi-IV-I-V
  ],
  'hiphop': [
    [5, 3, 0, 4],      // vi-IV-I-V
    [0, 3, 5, 5],      // I-IV-vi-vi
    [5, 4, 3, 0]       // vi-V-IV-I
  ],
  'classical': [
    [0, 3, 4, 0],      // I-IV-V-I
    [0, 4, 5, 4],      // I-V-vi-V (interrupted)
    [0, 1, 4, 0]       // I-ii-V-I
  ]
};

// =============================================================================
// Chord Generator Class
// =============================================================================

/**
 * Chord progression generator using Prolog knowledge bases.
 */
export class ChordGenerator {
  private adapter: PrologAdapter;
  private kbLoaded = false;
  
  constructor(adapter: PrologAdapter = getPrologAdapter()) {
    this.adapter = adapter;
  }
  
  /**
   * Ensure knowledge bases are loaded.
   */
  private async ensureKBLoaded(): Promise<void> {
    if (this.kbLoaded) return;
    
    await loadMusicTheoryKB(this.adapter);
    await loadCompositionPatternsKB(this.adapter);
    this.kbLoaded = true;
  }
  
  /**
   * Generate a chord progression.
   * 
   * @param key - Key context
   * @param options - Generation options
   * @returns Generated chord progression result
   * 
   * @example
   * const generator = new ChordGenerator();
   * const result = await generator.generate(
   *   { root: 'c', mode: 'major' },
   *   { genre: 'pop', length: 4 }
   * );
   */
  async generate(
    key: KeyContext,
    options: ChordGeneratorOptions = {}
  ): Promise<ChordGeneratorResult> {
    await this.ensureKBLoaded();
    
    const {
      genre = 'pop',
      length = 4,
      seed,
      ticksPerBeat = 480,
      beatsPerChord = 4,
      allowBorrowed = false,
      useExtensions = false,
      cadence
    } = options;
    
    // Initialize random
    let rng = seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    const keyRoot = NOTE_TO_SEMITONE[key.root.toLowerCase()] ?? 0;
    const scaleDegrees = key.mode === 'minor' ? MINOR_SCALE_DEGREES : MAJOR_SCALE_DEGREES;
    
    // Get genre progressions or use defaults
    const genreProgressions =
      COMMON_PROGRESSIONS[genre.toLowerCase()] ?? COMMON_PROGRESSIONS['pop'] ?? [[0, 3, 4, 0]];
    
    // Select a progression pattern
    let progression: number[];
    
    if (length <= 4) {
      // Use a single pattern
      const selected =
        genreProgressions[Math.floor(random() * genreProgressions.length)] ??
        genreProgressions[0] ??
        [0, 3, 4, 0];
      progression = [...selected];
      // Adjust length if needed
      while (progression.length < length) {
        const last = progression.at(-1) ?? 0;
        progression = [...progression, last];
      }
      progression = progression.slice(0, length);
    } else {
      // Combine patterns for longer progressions
      progression = [];
      while (progression.length < length) {
        const pattern =
          genreProgressions[Math.floor(random() * genreProgressions.length)] ??
          genreProgressions[0] ??
          [0, 3, 4, 0];
        progression.push(...pattern);
      }
      progression = progression.slice(0, length);
    }
    
    // Apply cadence if specified
    if (cadence && length >= 2) {
      switch (cadence) {
        case 'authentic':
          // End with V-I
          progression[length - 2] = 4;
          progression[length - 1] = 0;
          break;
        case 'plagal':
          // End with IV-I
          progression[length - 2] = 3;
          progression[length - 1] = 0;
          break;
        case 'deceptive':
          // End with V-vi
          progression[length - 2] = 4;
          progression[length - 1] = 5;
          break;
        case 'half':
          // End on V
          progression[length - 1] = 4;
          break;
      }
    }
    
    // Build chords
    const chordDuration = beatsPerChord * ticksPerBeat;
    const chords: Chord[] = [];
    
    for (let i = 0; i < progression.length; i++) {
      const degreeIndex = progression[i];
      if (degreeIndex === undefined) continue;
      
      const degree = scaleDegrees[degreeIndex];
      if (!degree) continue;
      
      const rootSemitone = (keyRoot + degree.semitone) % 12;
      const rootNote = SEMITONE_TO_NOTE[rootSemitone] ?? 'C';
      
      let quality = degree.quality;
      
      // Add extensions for jazz
      if (useExtensions) {
        if (quality === 'major' && degreeIndex === 4) {
          quality = 'dom7';
        } else if (quality === 'major') {
          quality = 'maj7';
        } else if (quality === 'minor') {
          quality = 'min7';
        }
      }
      
      // Handle borrowed chords
      if (allowBorrowed && random() < 0.1) {
        // Occasionally borrow from parallel mode
        const parallelDegrees = key.mode === 'minor' ? MAJOR_SCALE_DEGREES : MINOR_SCALE_DEGREES;
        const borrowedDegree = parallelDegrees[degreeIndex];
        if (borrowedDegree) {
          quality = borrowedDegree.quality;
        }
      }
      
      chords.push({
        root: rootNote,
        quality,
        numeral: degree.numeral,
        start: i * chordDuration,
        duration: chordDuration
      });
    }
    
    return {
      chords,
      key,
      genre
    };
  }
  
  /**
   * Suggest next chord based on current chord.
   */
  async suggestNextChord(
    currentNumeral: string,
    key: KeyContext
  ): Promise<string[]> {
    await this.ensureKBLoaded();
    
    // Map numerals to Prolog chord functions
    const numeralToFunction: Record<string, string> = {
      'I': 'tonic', 'i': 'tonic',
      'ii': 'supertonic', 'ii°': 'supertonic',
      'iii': 'mediant', 'III': 'mediant',
      'IV': 'subdominant', 'iv': 'subdominant',
      'V': 'dominant', 'v': 'dominant',
      'vi': 'submediant', 'VI': 'submediant',
      'vii°': 'leading_tone', 'VII': 'subtonic'
    };
    
    const functionToNumeral: Record<string, string[]> = {
      'tonic': key.mode === 'minor' ? ['i'] : ['I'],
      'supertonic': key.mode === 'minor' ? ['ii°'] : ['ii'],
      'mediant': key.mode === 'minor' ? ['III'] : ['iii'],
      'subdominant': key.mode === 'minor' ? ['iv'] : ['IV'],
      'dominant': ['V'],
      'submediant': key.mode === 'minor' ? ['VI'] : ['vi'],
      'leading_tone': ['vii°'],
      'subtonic': ['VII']
    };
    
    const currentFunction = numeralToFunction[currentNumeral] ?? 'tonic';
    
    // Query Prolog for valid transitions
    const results = await this.adapter.queryAll(
      `chord_tendency(${currentFunction}, NextChord)`
    );
    
    const suggestions: string[] = [];
    for (const result of results) {
      const next = result.NextChord;
      if (next === undefined) continue;

      const nextFunc = String(next);
      const numerals = functionToNumeral[nextFunc];
      if (numerals) {
        suggestions.push(...numerals);
      }
    }
    
    return [...new Set(suggestions)];
  }
  
  /**
   * Analyze a chord progression.
   */
  async analyzeProgression(
    chords: Array<{ root: string; quality: string }>,
    key: KeyContext
  ): Promise<{
    numerals: string[];
    isValid: boolean;
    suggestions: string[];
  }> {
    await this.ensureKBLoaded();
    
    const keyRoot = NOTE_TO_SEMITONE[key.root.toLowerCase()] ?? 0;
    const scaleDegrees = key.mode === 'minor' ? MINOR_SCALE_DEGREES : MAJOR_SCALE_DEGREES;
    
    const numerals: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;
    
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];
      if (!chord) continue;
      
      const chordRoot = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
      const interval = (chordRoot - keyRoot + 12) % 12;
      
      // Find matching scale degree
      const degree = scaleDegrees.find(d => d.semitone === interval);
      
      if (degree) {
        numerals.push(degree.numeral);
      } else {
        // Non-diatonic chord
        numerals.push('?');
        isValid = false;
      }
      
      // Check transition validity
      if (i > 0) {
        const prevNumeral = numerals[i - 1];
        const currNumeral = numerals[i];
        if (!prevNumeral || !currNumeral) continue;
        
        const nextSuggestions = await this.suggestNextChord(prevNumeral, key);
        if (nextSuggestions.length > 0 && !nextSuggestions.includes(currNumeral)) {
          suggestions.push(`After ${prevNumeral}, consider: ${nextSuggestions.join(', ')}`);
        }
      }
    }
    
    return { numerals, isValid, suggestions };
  }
}

/**
 * Create a new chord generator instance.
 */
export function createChordGenerator(
  adapter: PrologAdapter = getPrologAdapter()
): ChordGenerator {
  return new ChordGenerator(adapter);
}
