/**
 * @fileoverview Drum Pattern Generator
 * 
 * Prolog-powered drum pattern generator that uses the composition
 * pattern knowledge base to generate rhythmic patterns.
 * 
 * L191-L193: Drum generator using Prolog KB
 * 
 * @module @cardplay/ai/generators/drum-generator
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * A drum hit event.
 */
export interface DrumEvent {
  /** Drum instrument type */
  readonly instrument: DrumInstrument;
  /** MIDI note number for the instrument */
  readonly pitch: number;
  /** Start time in ticks */
  readonly start: number;
  /** Duration in ticks */
  readonly duration: number;
  /** Velocity (0-127) */
  readonly velocity: number;
}

/**
 * Drum instrument types.
 */
export type DrumInstrument = 
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'hihat_open'
  | 'tom_high'
  | 'tom_mid'
  | 'tom_low'
  | 'crash'
  | 'ride'
  | 'clap'
  | 'rim'
  | 'cowbell'
  | 'shaker'
  | 'clave';

/**
 * Drum generation options.
 */
export interface DrumGeneratorOptions {
  /** Genre for pattern selection */
  readonly genre?: string;
  /** Specific pattern ID to use */
  readonly patternId?: string;
  /** Base velocity (default: 100) */
  readonly velocity?: number;
  /** Random seed for reproducibility */
  readonly seed?: number;
  /** Humanization amount 0-1 (default: 0) */
  readonly humanize?: number;
  /** Swing amount 0-1 (default: 0) */
  readonly swing?: number;
  /** Ticks per beat (default: 480) */
  readonly ticksPerBeat?: number;
  /** Number of bars to generate (default: 1) */
  readonly bars?: number;
  /** Beats per bar (default: 4) */
  readonly beatsPerBar?: number;
}

/**
 * Generated drum pattern result.
 */
export interface DrumGeneratorResult {
  /** Generated drum events */
  readonly events: DrumEvent[];
  /** Pattern ID used */
  readonly patternId: string;
  /** Genre used */
  readonly genre: string;
}

// =============================================================================
// GM Drum Map
// =============================================================================

/**
 * General MIDI drum map (note numbers).
 */
const GM_DRUM_MAP: Record<DrumInstrument, number> = {
  'kick': 36,
  'snare': 38,
  'hihat': 42,
  'hihat_open': 46,
  'tom_high': 50,
  'tom_mid': 47,
  'tom_low': 45,
  'crash': 49,
  'ride': 51,
  'clap': 39,
  'rim': 37,
  'cowbell': 56,
  'shaker': 70,
  'clave': 75
};

// =============================================================================
// Built-in Patterns
// =============================================================================

/**
 * Pattern step: [step position (0-15), instrument, velocity modifier]
 */
type PatternStep = readonly [number, DrumInstrument, number];

/**
 * Built-in drum patterns by pattern ID.
 * These supplement the Prolog KB patterns.
 */
const BUILTIN_PATTERNS: Record<string, PatternStep[]> = {
  'basic_rock': [
    [0, 'kick', 1.0], [0, 'hihat', 0.8],
    [2, 'hihat', 0.6],
    [4, 'snare', 1.0], [4, 'hihat', 0.8],
    [6, 'hihat', 0.6],
    [8, 'kick', 0.9], [8, 'hihat', 0.8],
    [10, 'hihat', 0.6],
    [12, 'snare', 1.0], [12, 'hihat', 0.8],
    [14, 'hihat', 0.6]
  ],
  'four_on_floor': [
    [0, 'kick', 1.0], [0, 'hihat', 0.8],
    [2, 'hihat_open', 0.6],
    [4, 'kick', 0.95], [4, 'snare', 0.6], [4, 'hihat', 0.8],
    [6, 'hihat_open', 0.6],
    [8, 'kick', 0.95], [8, 'hihat', 0.8],
    [10, 'hihat_open', 0.6],
    [12, 'kick', 0.95], [12, 'snare', 0.6], [12, 'hihat', 0.8],
    [14, 'hihat_open', 0.6]
  ],
  'trap_beat': [
    [0, 'kick', 1.0],
    [3, 'hihat', 0.5],
    [4, 'hihat', 0.6],
    [6, 'hihat', 0.5],
    [7, 'kick', 0.8],
    [8, 'snare', 1.0], [8, 'hihat', 0.7],
    [10, 'hihat', 0.5],
    [11, 'hihat', 0.4],
    [12, 'hihat', 0.6],
    [13, 'hihat', 0.4],
    [14, 'hihat', 0.5],
    [15, 'kick', 0.7]
  ],
  'boom_bap': [
    [0, 'kick', 1.0], [0, 'hihat', 0.7],
    [2, 'hihat', 0.5],
    [4, 'snare', 1.0], [4, 'hihat', 0.7],
    [6, 'hihat', 0.5],
    [8, 'kick', 0.9], [8, 'hihat', 0.7],
    [10, 'kick', 0.7], [10, 'hihat', 0.5],
    [12, 'snare', 1.0], [12, 'hihat', 0.7],
    [14, 'hihat', 0.6]
  ],
  'jazz_swing': [
    [0, 'kick', 0.6], [0, 'ride', 0.9],
    [4, 'ride', 0.7],
    [6, 'ride', 0.5], // Swing position
    [8, 'kick', 0.5], [8, 'ride', 0.9],
    [10, 'snare', 0.3], // Ghost note
    [12, 'ride', 0.7],
    [14, 'ride', 0.5]
  ],
  'bossa_nova': [
    [0, 'kick', 0.8], [0, 'rim', 0.7],
    [3, 'rim', 0.5],
    [6, 'kick', 0.6], [6, 'rim', 0.6],
    [8, 'rim', 0.7],
    [10, 'kick', 0.7],
    [12, 'rim', 0.6],
    [15, 'rim', 0.5]
  ],
  'reggae': [
    [0, 'kick', 0.9],
    [4, 'rim', 0.8], [4, 'hihat', 0.6],
    [6, 'hihat', 0.5],
    [8, 'kick', 0.8], [8, 'hihat', 0.6],
    [10, 'hihat', 0.5],
    [12, 'snare', 0.9], [12, 'hihat', 0.6],
    [14, 'hihat', 0.5]
  ],
  'dnb': [
    [0, 'kick', 1.0], [0, 'hihat', 0.7],
    [2, 'hihat', 0.5],
    [4, 'hihat', 0.6],
    [6, 'snare', 1.0], [6, 'hihat', 0.6],
    [8, 'hihat', 0.6],
    [10, 'kick', 0.8], [10, 'hihat', 0.5],
    [12, 'hihat', 0.6],
    [14, 'snare', 0.9], [14, 'hihat', 0.6],
    [15, 'kick', 0.7]
  ]
};

/**
 * Map genres to pattern IDs.
 */
const GENRE_PATTERNS: Record<string, string[]> = {
  'rock': ['basic_rock'],
  'pop': ['basic_rock', 'four_on_floor'],
  'house': ['four_on_floor'],
  'techno': ['four_on_floor'],
  'edm': ['four_on_floor'],
  'trap': ['trap_beat'],
  'hiphop': ['boom_bap', 'trap_beat'],
  'jazz': ['jazz_swing'],
  'bossa': ['bossa_nova'],
  'reggae': ['reggae'],
  'dnb': ['dnb'],
  'drum_and_bass': ['dnb']
};

// =============================================================================
// Drum Generator Class
// =============================================================================

/**
 * Drum pattern generator using Prolog knowledge bases.
 */
export class DrumGenerator {
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
    
    await loadCompositionPatternsKB(this.adapter);
    this.kbLoaded = true;
  }
  
  /**
   * Get drum pattern info from Prolog KB.
   */
  private async getPatternFromKB(genre: string): Promise<string | null> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(`drum_pattern(${genre}, Pattern)`);
    if (result !== null) {
      return String(result.Pattern);
    }
    return null;
  }
  
  /**
   * Get swing feel from Prolog KB.
   */
  private async getSwingFeel(genre: string): Promise<number> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(`swing_feel(${genre}, Amount)`);
    if (result !== null) {
      const amount = String(result.Amount);
      switch (amount) {
        case 'heavy': return 0.7;
        case 'medium': return 0.5;
        case 'light': return 0.3;
        case 'straight': return 0;
        default: return 0;
      }
    }
    return 0;
  }
  
  /**
   * Get humanization parameters from Prolog KB.
   */
  private async getHumanization(genre: string): Promise<{ timing: number; velocity: number }> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(
      `humanization_rule(${genre}, TimingVariation, VelocityVariation)`
    );
    
    if (result !== null) {
      return {
        timing: Number(result.TimingVariation) || 0,
        velocity: Number(result.VelocityVariation) || 0
      };
    }
    
    return { timing: 0, velocity: 0 };
  }
  
  /**
   * Generate a drum pattern.
   * 
   * @param options - Generation options
   * @returns Generated drum pattern result
   * 
   * @example
   * const generator = new DrumGenerator();
   * const result = await generator.generate({
   *   genre: 'house',
   *   bars: 4,
   *   humanize: 0.2
   * });
   */
  async generate(options: DrumGeneratorOptions = {}): Promise<DrumGeneratorResult> {
    await this.ensureKBLoaded();
    
    const {
      genre = 'pop',
      patternId: requestedPatternId,
      velocity = 100,
      seed,
      humanize = 0,
      swing: optSwing,
      ticksPerBeat = 480,
      bars = 1,
      beatsPerBar = 4
    } = options;
    
    // Initialize random
    let rng = seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    // Determine pattern to use
    let patternId = requestedPatternId;
    
    if (!patternId) {
      // Try KB first
      const kbPattern = await this.getPatternFromKB(genre);
      if (kbPattern && BUILTIN_PATTERNS[kbPattern]) {
        patternId = kbPattern;
      } else {
        // Fall back to genre mapping
        const genrePatterns = GENRE_PATTERNS[genre.toLowerCase()];
        if (genrePatterns && genrePatterns.length > 0) {
          const randomIdx = Math.floor(random() * genrePatterns.length);
          patternId = genrePatterns[randomIdx] ?? 'basic_rock';
        } else {
          patternId = 'basic_rock';
        }
      }
    }
    
    // Ensure patternId is defined
    const finalPatternKey = patternId ?? 'basic_rock';
    const pattern: PatternStep[] =
      BUILTIN_PATTERNS[finalPatternKey] ?? BUILTIN_PATTERNS['basic_rock'] ?? [];
    
    // Get swing and humanization from KB
    const swingAmount = optSwing ?? await this.getSwingFeel(genre);
    const humanParams = humanize > 0 ? await this.getHumanization(genre) : { timing: 0, velocity: 0 };
    
    const events: DrumEvent[] = [];
    const ticksPerStep = ticksPerBeat / 4; // 16th notes
    const barTicks = beatsPerBar * ticksPerBeat;
    
    for (let bar = 0; bar < bars; bar++) {
      const barOffset = bar * barTicks;
      
      for (const [step, instrument, velMod] of pattern) {
        if (step === undefined || instrument === undefined || velMod === undefined) continue;
        
        let startTick = barOffset + step * ticksPerStep;
        
        // Apply swing to off-beat 8th notes (steps 2, 6, 10, 14)
        if (swingAmount > 0 && step % 4 === 2) {
          startTick += Math.round(ticksPerStep * swingAmount);
        }
        
        // Apply humanization
        if (humanize > 0) {
          // Timing variation
          const timingVar = humanParams.timing * humanize;
          startTick += Math.round((random() - 0.5) * timingVar * ticksPerStep);
        }
        
        // Calculate velocity
        let noteVelocity = Math.round(velocity * velMod);
        
        if (humanize > 0) {
          // Velocity variation
          const velVar = humanParams.velocity * humanize;
          noteVelocity += Math.round((random() - 0.5) * velVar * velocity);
        }
        
        noteVelocity = Math.max(1, Math.min(127, noteVelocity));
        
        // Type assertion for GM_DRUM_MAP lookup with validated instrument
        const drumInstrument = instrument as keyof typeof GM_DRUM_MAP;
        const pitch = GM_DRUM_MAP[drumInstrument];
        
        events.push({
          instrument: drumInstrument,
          pitch,
          start: Math.max(0, startTick),
          duration: Math.round(ticksPerStep * 0.5), // Short drum hits
          velocity: noteVelocity
        });
      }
    }
    
    // Sort by start time
    events.sort((a, b) => a.start - b.start);
    
    const finalPatternId: string = patternId ?? 'basic_rock';
    
    return {
      events,
      patternId: finalPatternId,
      genre
    };
  }
  
  /**
   * Get available patterns for a genre.
   */
  async getAvailablePatterns(genre: string): Promise<string[]> {
    const genrePatterns = GENRE_PATTERNS[genre.toLowerCase()] ?? [];
    return genrePatterns;
  }
  
  /**
   * Generate a fill pattern.
   */
  async generateFill(
    lengthBeats: number = 1,
    options: Omit<DrumGeneratorOptions, 'bars'> = {}
  ): Promise<DrumEvent[]> {
    const { velocity = 100, ticksPerBeat = 480 } = options;
    
    // Initialize random
    let rng = options.seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    const events: DrumEvent[] = [];
    const ticksPerStep = ticksPerBeat / 4;
    const totalSteps = lengthBeats * 4;
    
    // Build up fill with increasing intensity
    const instruments: DrumInstrument[] = ['snare', 'tom_high', 'tom_mid', 'tom_low'];
    
    for (let step = 0; step < totalSteps; step++) {
      // Increasing density towards the end
      const density = (step + 1) / totalSteps;
      
      if (random() < density) {
        const instrumentIdx = Math.floor(random() * instruments.length);
        const instrument = instruments[instrumentIdx];
        if (instrument === undefined) continue;
        
        const velMod = 0.7 + density * 0.3;
        
        events.push({
          instrument,
          pitch: GM_DRUM_MAP[instrument],
          start: step * ticksPerStep,
          duration: Math.round(ticksPerStep * 0.5),
          velocity: Math.round(velocity * velMod)
        });
      }
    }
    
    // Add crash on the downbeat after fill
    events.push({
      instrument: 'crash',
      pitch: GM_DRUM_MAP['crash'],
      start: totalSteps * ticksPerStep,
      duration: ticksPerBeat * 2,
      velocity: velocity
    });
    
    return events;
  }
}

/**
 * Create a new drum generator instance.
 */
export function createDrumGenerator(
  adapter: PrologAdapter = getPrologAdapter()
): DrumGenerator {
  return new DrumGenerator(adapter);
}
