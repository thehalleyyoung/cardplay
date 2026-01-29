/**
 * @fileoverview Bass Line Generator
 * 
 * Prolog-powered bass line generator that uses the music theory and
 * composition pattern knowledge bases to generate bass lines.
 * 
 * L182-L186: Bass generator using Prolog KB
 * 
 * @module @cardplay/ai/generators/bass-generator
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * A musical note event.
 */
export interface NoteEvent {
  /** MIDI note number (0-127) */
  readonly pitch: number;
  /** Start time in ticks */
  readonly start: number;
  /** Duration in ticks */
  readonly duration: number;
  /** Velocity (0-127) */
  readonly velocity: number;
}

/**
 * Chord information for bass generation.
 */
export interface ChordInfo {
  /** Root note name (e.g., 'c', 'fsharp') */
  readonly root: string;
  /** Chord quality (e.g., 'major', 'minor', 'dom7') */
  readonly quality: string;
  /** Start time in ticks */
  readonly start: number;
  /** Duration in ticks */
  readonly duration: number;
}

/**
 * Bass generation options.
 */
export interface BassGeneratorOptions {
  /** Genre for pattern selection */
  readonly genre?: string;
  /** Specific pattern ID to use */
  readonly patternId?: string;
  /** Octave for bass notes (default: 2) */
  readonly octave?: number;
  /** Base velocity (default: 100) */
  readonly velocity?: number;
  /** Random seed for reproducibility */
  readonly seed?: number;
  /** Variation amount 0-1 (default: 0) */
  readonly variation?: number;
  /** Ticks per beat (default: 480) */
  readonly ticksPerBeat?: number;
}

/**
 * Generated bass line result.
 */
export interface BassGeneratorResult {
  /** Generated note events */
  readonly events: NoteEvent[];
  /** Pattern ID used */
  readonly patternId: string;
  /** Genre used */
  readonly genre: string;
}

// =============================================================================
// Note Mapping
// =============================================================================

/**
 * Map note names to MIDI semitone offsets.
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
 * Convert note name to MIDI pitch at given octave.
 */
function noteToMidi(note: string, octave: number): number {
  const semitone = NOTE_TO_SEMITONE[note.toLowerCase()] ?? 0;
  return (octave + 1) * 12 + semitone;
}

/**
 * Get scale degrees for a chord quality.
 */
function getChordDegrees(quality: string): number[] {
  const degrees: Record<string, number[]> = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'dom7': [0, 4, 7, 10],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dim7': [0, 3, 6, 9],
    'sus4': [0, 5, 7],
    'sus2': [0, 2, 7]
  };
  return degrees[quality] ?? [0, 4, 7]; // Default to major triad
}

// =============================================================================
// Bass Generator Class
// =============================================================================

/**
 * Bass line generator using Prolog knowledge bases.
 */
export class BassGenerator {
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
   * Get bass pattern for a genre.
   */
  private async getPatternForGenre(genre: string): Promise<{ id: string; steps: (number | string)[] } | null> {
    await this.ensureKBLoaded();
    
    // Query for bass patterns in this genre
    const patternResult = await this.adapter.querySingle(`bass_pattern(${genre}, Pattern)`);
    if (patternResult === null) {
      return null;
    }
    
    const patternId = String(patternResult.Pattern);
    
    // Get the pattern steps
    const stepsResult = await this.adapter.querySingle(`bass_pattern_steps(${patternId}, Steps)`);
    if (stepsResult === null) {
      return null;
    }
    
    return {
      id: patternId,
      steps: Array.isArray(stepsResult.Steps) ? stepsResult.Steps : []
    };
  }
  
  /**
   * Convert scale degree to semitone offset.
   */
  private degreeToSemitone(degree: number | string, chordDegrees: number[]): number | null {
    if (degree === 'rest') return null;
    if (degree === 'slide') return null; // Handle slides separately
    
    const deg = Number(degree);
    if (isNaN(deg)) return null;
    
    // Map scale degrees to semitones (1-based)
    const degreeMap: Record<number, number> = {
      1: 0,   // Root
      2: 2,   // Major 2nd
      3: chordDegrees[1] ?? 4,  // Use chord's 3rd
      4: 5,   // Perfect 4th
      5: 7,   // Perfect 5th
      6: 9,   // Major 6th
      7: 10,  // Minor 7th
      8: 12   // Octave
    };
    
    return degreeMap[deg] ?? 0;
  }
  
  /**
   * Generate a bass line for a chord progression.
   * 
   * @param chords - Array of chord information
   * @param options - Generation options
   * @returns Generated bass line result
   * 
   * @example
   * const generator = new BassGenerator();
   * const result = await generator.generate([
   *   { root: 'c', quality: 'major', start: 0, duration: 1920 },
   *   { root: 'g', quality: 'major', start: 1920, duration: 1920 }
   * ], { genre: 'house' });
   */
  async generate(
    chords: ChordInfo[],
    options: BassGeneratorOptions = {}
  ): Promise<BassGeneratorResult> {
    await this.ensureKBLoaded();
    
    const {
      genre = 'pop',
      patternId: requestedPatternId,
      octave = 2,
      velocity = 100,
      seed,
      variation = 0,
    } = options;
    
    // Get pattern
    let pattern: { id: string; steps: (number | string)[] };
    
    if (requestedPatternId) {
      const stepsResult = await this.adapter.querySingle(`bass_pattern_steps(${requestedPatternId}, Steps)`);
      if (stepsResult !== null && Array.isArray(stepsResult.Steps)) {
        pattern = { id: requestedPatternId, steps: stepsResult.Steps };
      } else {
        // Fallback to simple root pattern
        pattern = { id: 'root_only', steps: [1] };
      }
    } else {
      const genrePattern = await this.getPatternForGenre(genre);
      pattern = genrePattern ?? { id: 'root_only', steps: [1] };
    }
    
    const events: NoteEvent[] = [];
    
    // Initialize simple random for reproducibility
    let rng = seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    // Generate notes for each chord
    for (const chord of chords) {
      const chordDegrees = getChordDegrees(chord.quality);
      const rootMidi = noteToMidi(chord.root, octave);
      
      const stepsPerChord = pattern.steps.length;
      const stepDuration = chord.duration / Math.max(stepsPerChord, 1);
      
      for (let i = 0; i < stepsPerChord; i++) {
        const step = pattern.steps[i];
        if (step === undefined) continue;
        const semitoneOffset = this.degreeToSemitone(step, chordDegrees);
        
        if (semitoneOffset === null) continue; // Rest
        
        let pitch = rootMidi + semitoneOffset;
        
        // Apply variation
        if (variation > 0 && random() < variation) {
          // Randomly choose a chord tone
          const chordTone = chordDegrees[Math.floor(random() * chordDegrees.length)] ?? 0;
          pitch = rootMidi + chordTone;
        }
        
        // Apply slight velocity variation
        let noteVelocity = velocity;
        if (variation > 0) {
          noteVelocity = Math.round(velocity + (random() - 0.5) * 20 * variation);
          noteVelocity = Math.max(1, Math.min(127, noteVelocity));
        }
        
        events.push({
          pitch,
          start: chord.start + Math.round(i * stepDuration),
          duration: Math.round(stepDuration * 0.9), // Slight gap between notes
          velocity: noteVelocity
        });
      }
    }
    
    return {
      events,
      patternId: pattern.id,
      genre
    };
  }
  
  /**
   * Get available patterns for a genre.
   */
  async getAvailablePatterns(genre: string): Promise<string[]> {
    await this.ensureKBLoaded();
    
    const results = await this.adapter.queryAll(`bass_pattern(${genre}, Pattern)`);
    
    return results
      .map(r => String(r.Pattern));
  }
}

/**
 * Create a new bass generator instance.
 */
export function createBassGenerator(
  adapter: PrologAdapter = getPrologAdapter()
): BassGenerator {
  return new BassGenerator(adapter);
}
