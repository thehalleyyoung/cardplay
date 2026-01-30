/**
 * @fileoverview Arpeggio Generator
 * 
 * Prolog-powered arpeggio generator that uses the music theory
 * knowledge base to generate arpeggiated patterns.
 * 
 * L197-L199: Arpeggio generator using Prolog KB
 * 
 * @module @cardplay/ai/generators/arpeggio-generator
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';
import { PPQ } from '../../types/primitives';

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
 * Chord information for arpeggio generation.
 */
export interface ChordContext {
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
 * Arpeggio pattern type.
 */
export type ArpeggioPattern = 
  | 'up'           // Ascending
  | 'down'         // Descending
  | 'up_down'      // Ascending then descending
  | 'down_up'      // Descending then ascending
  | 'random'       // Random order
  | 'chord'        // All notes together
  | 'pinky'        // Alternating bass and treble
  | 'alberti'      // Alberti bass pattern (1-5-3-5)
  | 'pedal'        // Pedal tone with moving notes
  | 'cascade';     // Overlapping notes

/**
 * Arpeggio generation options.
 */
export interface ArpeggioGeneratorOptions {
  /** Arpeggio pattern type (default: 'up') */
  readonly pattern?: ArpeggioPattern;
  /** Octave for root note (default: 4) */
  readonly octave?: number;
  /** Base velocity (default: 100) */
  readonly velocity?: number;
  /** Random seed for reproducibility */
  readonly seed?: number;
  /** Notes per beat (default: 4 = 16th notes) */
  readonly notesPerBeat?: number;
  /** Note overlap (0-1, default: 0 = staccato, 1 = legato) */
  readonly overlap?: number;
  /** Octave range (default: 1) */
  readonly octaveRange?: number;
  /** Ticks per beat (default: 480) */
  readonly ticksPerBeat?: number;
  /** Velocity curve: 'flat' | 'accent_first' | 'crescendo' | 'decrescendo' */
  readonly velocityCurve?: string;
  /** Whether to include extensions/alterations */
  readonly includeExtensions?: boolean;
}

/**
 * Generated arpeggio result.
 */
export interface ArpeggioGeneratorResult {
  /** Generated note events */
  readonly events: NoteEvent[];
  /** Pattern used */
  readonly pattern: ArpeggioPattern;
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
 * Chord intervals by quality.
 */
const CHORD_INTERVALS: Record<string, number[]> = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'dom7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'halfdim7': [0, 3, 6, 10],
  'minmaj7': [0, 3, 7, 11],
  'aug7': [0, 4, 8, 10],
  'sus4': [0, 5, 7],
  'sus2': [0, 2, 7],
  '6': [0, 4, 7, 9],
  'min6': [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  'min9': [0, 3, 7, 10, 14],
  'add9': [0, 4, 7, 14],
  'add11': [0, 4, 7, 17]
};

/**
 * Convert note name to MIDI pitch at given octave.
 */
function noteToMidi(note: string, octave: number): number {
  const semitone = NOTE_TO_SEMITONE[note.toLowerCase()] ?? 0;
  return (octave + 1) * 12 + semitone;
}

// =============================================================================
// Arpeggio Generator Class
// =============================================================================

/**
 * Arpeggio generator using Prolog knowledge bases.
 */
export class ArpeggioGenerator {
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
   * Get chord intervals from Prolog KB.
   */
  private async getChordIntervalsFromKB(quality: string): Promise<number[] | null> {
    await this.ensureKBLoaded();
    
    // Try to get intervals from KB
    const result = await this.adapter.querySingle(
      `chord_intervals(${quality}, Intervals)`
    );
    
    if (result !== null && Array.isArray(result.Intervals)) {
      return result.Intervals.map(Number);
    }
    
    return null;
  }
  
  /**
   * Get chord tones for a given quality.
   */
  private async getChordTones(quality: string): Promise<number[]> {
    // First try KB
    const kbIntervals = await this.getChordIntervalsFromKB(quality);
    if (kbIntervals && kbIntervals.length > 0) {
      return kbIntervals;
    }
    
    // Fall back to built-in
    return CHORD_INTERVALS[quality] ?? CHORD_INTERVALS['major'] ?? [0, 4, 7];
  }
  
  /**
   * Order pitches according to pattern.
   */
  private orderByPattern(
    pitches: number[],
    pattern: ArpeggioPattern,
    random: () => number
  ): number[] {
    const sorted = [...pitches].sort((a, b) => a - b);
    
    switch (pattern) {
      case 'up':
        return sorted;
        
      case 'down':
        return sorted.reverse();
        
      case 'up_down':
        return [...sorted, ...sorted.slice(1, -1).reverse()];
        
      case 'down_up':
        const down = sorted.reverse();
        return [...down, ...down.slice(1, -1).reverse()];
        
      case 'random':
        const shuffled = [...pitches];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          const a = shuffled[i];
          const b = shuffled[j];
          if (a === undefined || b === undefined) continue;
          shuffled[i] = b;
          shuffled[j] = a;
        }
        return shuffled;
        
      case 'chord':
        return sorted; // All played together
        
      case 'pinky':
        // Alternating low and high notes
        const low = sorted[0] ?? 0;
        const result: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const p = sorted[i];
          if (p === undefined) continue;
          result.push(low, p);
        }
        return result;
        
      case 'alberti':
        // Alberti bass: 1-5-3-5
        if (sorted.length >= 3) {
          const a = sorted[0];
          const b = sorted[1];
          const c = sorted[2];
          if (a === undefined || b === undefined || c === undefined) return sorted;
          return [a, c, b, c];
        }
        return sorted;
        
      case 'pedal':
        // Pedal tone (root) with moving notes
        const pedal = sorted[0] ?? 0;
        const moving: number[] = [];
        for (const p of sorted.slice(1)) {
          moving.push(pedal, p);
        }
        return moving;
        
      case 'cascade':
        // Notes overlap (handled in generation)
        return sorted;
        
      default:
        return sorted;
    }
  }
  
  /**
   * Generate an arpeggio for a chord.
   * 
   * @param chord - Chord context
   * @param options - Generation options
   * @returns Generated arpeggio result
   * 
   * @example
   * const generator = new ArpeggioGenerator();
   * const result = await generator.generate(
   *   { root: 'c', quality: 'major', start: 0, duration: 1920 },
   *   { pattern: 'up_down', octaveRange: 2 }
   * );
   */
  async generate(
    chord: ChordContext,
    options: ArpeggioGeneratorOptions = {}
  ): Promise<ArpeggioGeneratorResult> {
    await this.ensureKBLoaded();
    
    const {
      pattern = 'up',
      octave = 4,
      velocity = 100,
      seed,
      notesPerBeat = 4,
      overlap = 0,
      octaveRange = 1,
      ticksPerBeat = PPQ,
      velocityCurve = 'flat',
      includeExtensions = false
    } = options;
    
    // Initialize random
    let rng = seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    // Get chord intervals
    let intervals = await this.getChordTones(chord.quality);
    
    // If not including extensions, limit to basic triad/7th
    if (!includeExtensions && intervals.length > 4) {
      intervals = intervals.slice(0, 4);
    }
    
    // Build pitches across octave range
    const rootMidi = noteToMidi(chord.root, octave);
    const pitches: number[] = [];
    
    for (let oct = 0; oct < octaveRange; oct++) {
      for (const interval of intervals) {
        pitches.push(rootMidi + interval + oct * 12);
      }
    }
    
    // Add final octave note if pattern wants it
    if (pattern === 'up' || pattern === 'up_down') {
      const octaveNote = rootMidi + 12 * octaveRange;
      if (!pitches.includes(octaveNote)) {
        pitches.push(octaveNote);
      }
    }
    
    // Order by pattern
    const orderedPitches = this.orderByPattern(pitches, pattern, random);
    
    const events: NoteEvent[] = [];
    
    if (pattern === 'chord') {
      // All notes at once
      for (const pitch of orderedPitches) {
        events.push({
          pitch,
          start: chord.start,
          duration: chord.duration,
          velocity
        });
      }
    } else {
      // Sequential notes
      const noteCount = orderedPitches.length;
      if (noteCount === 0) {
        return { events, pattern };
      }
      const ticksPerNote = ticksPerBeat / notesPerBeat;
      
      // Repeat pattern to fill duration
      let currentTick = chord.start;
      let noteIndex = 0;
      
      while (currentTick < chord.start + chord.duration) {
        const pitch = orderedPitches[noteIndex % noteCount];
        if (pitch === undefined) break;
        
        // Calculate note duration with overlap
        let noteDuration = ticksPerNote * (1 + overlap);
        
        // For cascade pattern, make notes longer
        if (pattern === 'cascade') {
          noteDuration = ticksPerNote * 3;
        }
        
        // Don't extend past chord duration
        const remainingTime = chord.start + chord.duration - currentTick;
        noteDuration = Math.min(noteDuration, remainingTime);
        
        // Calculate velocity based on curve
        let noteVelocity = velocity;
        const position = noteIndex / Math.max(noteCount - 1, 1);
        
        switch (velocityCurve) {
          case 'accent_first':
            noteVelocity = noteIndex === 0 ? velocity : Math.round(velocity * 0.7);
            break;
          case 'crescendo':
            noteVelocity = Math.round(velocity * (0.5 + position * 0.5));
            break;
          case 'decrescendo':
            noteVelocity = Math.round(velocity * (1 - position * 0.5));
            break;
        }
        
        noteVelocity = Math.max(1, Math.min(127, noteVelocity));
        
        events.push({
          pitch,
          start: currentTick,
          duration: Math.max(1, Math.round(noteDuration)),
          velocity: noteVelocity
        });
        
        currentTick += ticksPerNote;
        noteIndex++;
      }
    }
    
    return {
      events,
      pattern
    };
  }
  
  /**
   * Generate arpeggios for a chord progression.
   */
  async generateProgression(
    chords: ChordContext[],
    options: ArpeggioGeneratorOptions = {}
  ): Promise<NoteEvent[]> {
    const allEvents: NoteEvent[] = [];
    
    for (const chord of chords) {
      const result = await this.generate(chord, options);
      allEvents.push(...result.events);
    }
    
    return allEvents;
  }
  
  /**
   * Suggest arpeggio pattern for a genre.
   */
  async suggestPattern(genre: string): Promise<ArpeggioPattern> {
    await this.ensureKBLoaded();
    
    // Genre to pattern suggestions
    const genrePatterns: Record<string, ArpeggioPattern[]> = {
      'classical': ['alberti', 'up_down', 'pedal'],
      'pop': ['up', 'up_down'],
      'edm': ['up', 'up_down', 'cascade'],
      'house': ['up', 'cascade'],
      'trance': ['up', 'cascade'],
      'jazz': ['up', 'down', 'random'],
      'ambient': ['cascade', 'up'],
      'rock': ['up', 'down'],
      'metal': ['pedal', 'up']
    };
    
    const patterns = genrePatterns[genre.toLowerCase()] ?? ['up'];
    
    // Query KB for any genre-specific pattern preference
    const result = await this.adapter.querySingle(
      `genre_characteristic(${genre}, arpeggio_style)`
    );
    void result;
    
    // Return first suggested pattern
    return patterns[0] ?? 'up';
  }
  
  /**
   * Get available patterns.
   */
  getAvailablePatterns(): ArpeggioPattern[] {
    return [
      'up', 'down', 'up_down', 'down_up', 'random',
      'chord', 'pinky', 'alberti', 'pedal', 'cascade'
    ];
  }
}

/**
 * Create a new arpeggio generator instance.
 */
export function createArpeggioGenerator(
  adapter: PrologAdapter = getPrologAdapter()
): ArpeggioGenerator {
  return new ArpeggioGenerator(adapter);
}
