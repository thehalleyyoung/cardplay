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
import { PPQ } from '../../types/primitives';

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
      ticksPerBeat = PPQ,
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

// =============================================================================
// SCHEMA CHAIN SUPPORT (C337)
// =============================================================================

/**
 * Schema chain - a sequence of galant schemata that define a progression
 */
export interface SchemaChain {
  /** Chain identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Sequence of schema names in order */
  readonly schemata: readonly string[];
  /** Duration per schema in beats */
  readonly beatsPerSchema: number;
  /** Total duration in beats */
  readonly totalBeats: number;
  /** Style tags for this chain */
  readonly styles: readonly string[];
}

/**
 * Schema to chord progression mapping
 */
export interface SchemaChordMapping {
  readonly schemaName: string;
  /** Chord numerals for this schema */
  readonly numerals: readonly string[];
  /** Bass line scale degrees */
  readonly bassLine: readonly number[];
  /** Duration in beats */
  readonly duration: number;
}

/**
 * Predefined schema to chord mappings
 */
export const SCHEMA_CHORD_MAPPINGS: readonly SchemaChordMapping[] = [
  { schemaName: 'romanesca', numerals: ['I', 'V', 'vi', 'III'], bassLine: [0, 4, 5, 2], duration: 4 },
  { schemaName: 'prinner', numerals: ['IV', 'I6', 'ii', 'V'], bassLine: [5, 4, 3, 2], duration: 4 },
  { schemaName: 'monte', numerals: ['ii', 'V/V', 'iii', 'vi'], bassLine: [0, 4, 2, 5], duration: 4 },
  { schemaName: 'fonte', numerals: ['v/vi', 'vi', 'V', 'I'], bassLine: [1, 4, 0, 3], duration: 4 },
  { schemaName: 'do-re-mi', numerals: ['I', 'V', 'I'], bassLine: [0, 4, 0], duration: 3 },
  { schemaName: 'sol-fa-mi', numerals: ['I', 'IV', 'I'], bassLine: [4, 4, 0], duration: 3 },
  { schemaName: 'quiescenza', numerals: ['I', 'IV', 'V', 'I'], bassLine: [0, 6, 4, 0], duration: 4 },
  { schemaName: 'converging', numerals: ['IV', 'vii°', 'I6', 'V'], bassLine: [0, 1, 2, 2], duration: 4 },
  { schemaName: 'cadence-perfect', numerals: ['V', 'I'], bassLine: [4, 0], duration: 2 },
  { schemaName: 'cadence-deceptive', numerals: ['V', 'vi'], bassLine: [4, 5], duration: 2 },
  { schemaName: 'cadence-half', numerals: ['ii', 'V'], bassLine: [1, 4], duration: 2 },
  { schemaName: 'cadence-plagal', numerals: ['IV', 'I'], bassLine: [3, 0], duration: 2 },
];

/**
 * Get chord mapping for a schema
 */
export function getSchemaChordMapping(schemaName: string): SchemaChordMapping | undefined {
  return SCHEMA_CHORD_MAPPINGS.find(m => 
    m.schemaName.toLowerCase() === schemaName.toLowerCase()
  );
}

/**
 * Generate chord progression from schema chain.
 * 
 * This is the C337 integration: schema chain to chord progression generator.
 */
export function generateProgressionFromSchemaChain(
  schemaChain: SchemaChain,
  key: KeyContext,
  ticksPerBeat: number = 480
): Chord[] {
  const chords: Chord[] = [];
  let currentTick = 0;
  
  for (const schemaName of schemaChain.schemata) {
    const mapping = getSchemaChordMapping(schemaName);
    if (!mapping) continue;
    
    const ticksPerChord = ticksPerBeat * (schemaChain.beatsPerSchema / mapping.numerals.length);
    
    for (const numeral of mapping.numerals) {
      const { root, quality } = numeralToChord(numeral, key);
      
      chords.push({
        root,
        quality,
        numeral,
        start: currentTick,
        duration: ticksPerChord,
      });
      
      currentTick += ticksPerChord;
    }
  }
  
  return chords;
}

/**
 * Convert roman numeral to chord in key
 */
function numeralToChord(numeral: string, key: KeyContext): { root: string; quality: string } {
  // Parse numeral: uppercase = major, lowercase = minor, ° = diminished
  const isMinor = numeral === numeral.toLowerCase() && !numeral.includes('°');
  const isDiminished = numeral.includes('°');
  // const isMajorQuality = numeral === numeral.toUpperCase() && !isDiminished;
  
  // Extract degree number (I=0, ii=1, iii=2, IV=3, V=4, vi=5, vii=6)
  const degreeMap: Record<string, number> = {
    'i': 0, 'I': 0,
    'ii': 1, 'II': 1,
    'iii': 2, 'III': 2,
    'iv': 3, 'IV': 3,
    'v': 4, 'V': 4,
    'vi': 5, 'VI': 5,
    'vii': 6, 'VII': 6,
  };
  
  const cleanNumeral = numeral.replace(/[°67]/g, '').replace(/6$/, '').replace(/\/.*/, '');
  const degree = degreeMap[cleanNumeral] ?? 0;
  
  // Scale intervals for major and minor
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  const minorScale = [0, 2, 3, 5, 7, 8, 10];
  const scale = key.mode === 'minor' ? minorScale : majorScale;
  
  const keyRoot = NOTE_TO_SEMITONE[key.root.toLowerCase()] ?? 0;
  const chordRootSemitone = (keyRoot + (scale[degree] ?? 0)) % 12;
  
  const SEMITONE_TO_NOTE_MAP: Record<number, string> = {
    0: 'c', 1: 'csharp', 2: 'd', 3: 'eflat', 4: 'e', 5: 'f',
    6: 'fsharp', 7: 'g', 8: 'aflat', 9: 'a', 10: 'bflat', 11: 'b'
  };
  
  const root = SEMITONE_TO_NOTE_MAP[chordRootSemitone] ?? 'c';
  const quality = isDiminished ? 'diminished' : isMinor ? 'minor' : 'major';
  
  return { root, quality };
}

/**
 * Create a schema chain from schema names
 */
export function createSchemaChain(
  name: string,
  schemata: readonly string[],
  beatsPerSchema: number = 4,
  styles: readonly string[] = []
): SchemaChain {
  return {
    id: `chain-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    schemata,
    beatsPerSchema,
    totalBeats: schemata.length * beatsPerSchema,
    styles,
  };
}

/**
 * Predefined schema chains for common progressions
 */
export const SCHEMA_CHAINS: readonly SchemaChain[] = [
  createSchemaChain('Galant Sentence', ['romanesca', 'prinner', 'cadence-perfect'], 4, ['classical', 'baroque']),
  createSchemaChain('Monte-Fonte', ['monte', 'fonte'], 4, ['classical']),
  createSchemaChain('Opening Gambit', ['do-re-mi', 'cadence-half'], 3, ['classical']),
  createSchemaChain('Full Cadence', ['prinner', 'cadence-perfect'], 4, ['classical', 'baroque']),
  createSchemaChain('Deceptive Phrase', ['romanesca', 'cadence-deceptive', 'cadence-perfect'], 4, ['classical']),
];

// =============================================================================
// CADENCE CONTROL (C460, C461)
// =============================================================================

/**
 * Cadence control mode for film scoring
 */
export type CadenceMode = 'normal' | 'avoid' | 'emphasize';

/**
 * Cadence control options
 */
export interface CadenceControlOptions {
  /** Cadence mode */
  readonly mode: CadenceMode;
  /** Avoid specific cadence types */
  readonly avoidTypes?: readonly string[];
  /** Prefer specific cadence types */
  readonly preferTypes?: readonly string[];
  /** Strength of cadence (for emphasis) */
  readonly strength?: number;
}

/**
 * Apply cadence avoidance for underscore cues.
 * 
 * This is the C460 integration: cadence avoidance toggles for underscore cues.
 * Replaces cadential progressions with non-resolving alternatives.
 */
export function applyCadenceAvoidance(
  chords: Chord[],
  key: KeyContext
): Chord[] {
  const result: Chord[] = [];
  
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i]!;
    const isLast = i === chords.length - 1;
    const prevChord = i > 0 ? chords[i - 1] : null;
    
    // Detect V-I or V-i cadence and replace
    const isResolvingCadence = 
      isLast && 
      prevChord && 
      prevChord.numeral.toUpperCase() === 'V' &&
      (chord.numeral === 'I' || chord.numeral === 'i');
    
    if (isResolvingCadence) {
      // Replace with deceptive or suspended resolution
      const alternatives = ['vi', 'IV', 'bVII', 'iii'];
      const replacement = alternatives[Math.floor(Math.random() * alternatives.length)]!;
      const { root, quality } = numeralToChord(replacement, key);
      result.push({
        ...chord,
        root,
        quality,
        numeral: replacement,
      });
    } else {
      result.push(chord);
    }
  }
  
  return result;
}

/**
 * Apply cadence emphasis for endings/trailers.
 * 
 * This is the C461 integration: cadence emphasis toggles for endings/trailers.
 * Strengthens cadential progressions with pre-dominants and secondary dominants.
 */
export function applyCadenceEmphasis(
  chords: Chord[],
  key: KeyContext,
  strength: number = 0.7
): Chord[] {
  const result: Chord[] = [];
  
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i]!;
    const nextChord = i < chords.length - 1 ? chords[i + 1] : null;
    
    // Detect approach to V and add pre-dominant
    const isApproachingDominant = nextChord && nextChord.numeral.toUpperCase() === 'V';
    
    if (isApproachingDominant && strength > 0.5) {
      // Add pre-dominant (IV or ii) before current chord if not already there
      if (chord.numeral !== 'IV' && chord.numeral !== 'ii') {
        const preDom = strength > 0.8 ? 'IV' : 'ii';
        const { root, quality } = numeralToChord(preDom, key);
        result.push({
          root,
          quality,
          numeral: preDom,
          start: chord.start - chord.duration / 2,
          duration: chord.duration / 2,
        });
        result.push({
          ...chord,
          start: chord.start,
          duration: chord.duration / 2,
        });
        continue;
      }
    }
    
    // Strengthen final cadence with ritardando feel (longer durations)
    const isLast = i === chords.length - 1;
    if (isLast && strength > 0.6) {
      result.push({
        ...chord,
        duration: chord.duration * (1 + strength * 0.5),
      });
    } else {
      result.push(chord);
    }
  }
  
  return result;
}

// =============================================================================
// CHROMATIC MEDIANTS AND PLANING (C464)
// =============================================================================

/**
 * Chromatic mediant type
 */
export type ChromaticMediantType = 
  | 'upper_major' // Major third above (e.g., C → E)
  | 'upper_minor' // Minor third above (e.g., C → Eb)
  | 'lower_major' // Major third below (e.g., C → Ab)
  | 'lower_minor'; // Minor third below (e.g., C → A)

/**
 * Get chromatic mediant chord from a given chord
 */
export function getChromaticMediant(
  chord: Chord,
  mediantType: ChromaticMediantType
): Chord {
  const rootSemitone = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
  
  let interval: number;
  let quality: string;
  
  switch (mediantType) {
    case 'upper_major':
      interval = 4; // Major third up
      quality = 'major';
      break;
    case 'upper_minor':
      interval = 3; // Minor third up
      quality = 'minor';
      break;
    case 'lower_major':
      interval = -4; // Major third down
      quality = 'major';
      break;
    case 'lower_minor':
      interval = -3; // Minor third down
      quality = 'minor';
      break;
  }
  
  const newRootSemitone = ((rootSemitone + interval) % 12 + 12) % 12;
  const SEMITONE_TO_NOTE_MAP: Record<number, string> = {
    0: 'c', 1: 'csharp', 2: 'd', 3: 'eflat', 4: 'e', 5: 'f',
    6: 'fsharp', 7: 'g', 8: 'aflat', 9: 'a', 10: 'bflat', 11: 'b'
  };
  
  return {
    ...chord,
    root: SEMITONE_TO_NOTE_MAP[newRootSemitone] ?? 'c',
    quality,
    numeral: `♭III${quality === 'minor' ? 'm' : ''}`, // Simplified numeral
  };
}

/**
 * Planing type (parallel motion)
 */
export type PlaningType = 'chromatic' | 'diatonic' | 'whole_tone';

/**
 * Generate planing (parallel chord motion)
 * 
 * This is the C464 integration: chord generator supports chromatic mediants and planing.
 */
export function generatePlaningProgression(
  startChord: Chord,
  direction: 'up' | 'down',
  steps: number,
  planingType: PlaningType,
  ticksPerChord: number
): Chord[] {
  const chords: Chord[] = [startChord];
  let currentRoot = NOTE_TO_SEMITONE[startChord.root.toLowerCase()] ?? 0;
  let currentTick = startChord.start + startChord.duration;
  
  const stepSize = planingType === 'chromatic' ? 1 : 
                   planingType === 'whole_tone' ? 2 : 2; // Diatonic approximated as whole steps
  
  const increment = direction === 'up' ? stepSize : -stepSize;
  
  const SEMITONE_TO_NOTE_MAP: Record<number, string> = {
    0: 'c', 1: 'csharp', 2: 'd', 3: 'eflat', 4: 'e', 5: 'f',
    6: 'fsharp', 7: 'g', 8: 'aflat', 9: 'a', 10: 'bflat', 11: 'b'
  };
  
  for (let i = 0; i < steps; i++) {
    currentRoot = ((currentRoot + increment) % 12 + 12) % 12;
    
    chords.push({
      root: SEMITONE_TO_NOTE_MAP[currentRoot] ?? 'c',
      quality: startChord.quality, // Keep same quality for planing
      numeral: '?', // Planing doesn't follow functional harmony
      start: currentTick,
      duration: ticksPerChord,
    });
    
    currentTick += ticksPerChord;
  }
  
  return chords;
}
