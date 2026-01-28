/**
 * @fileoverview Generator Integration for Tracker
 * 
 * Bridges between CardPlay's generator system and the tracker view.
 * 
 * Key responsibilities:
 * - Convert generator output (Event<P>) to tracker rows
 * - Trigger generators from tracker effect commands
 * - Store generator-produced content as phrases
 * - Live generation during playback
 * 
 * Design Philosophy:
 * - Generators produce Events, tracker displays them
 * - Generator effect commands (0x80-0x8F) trigger generation
 * - Generated content can be "frozen" to static pattern data
 */

import {
  TrackerRow,
  EffectCommand,
  PatternId,
  TrackId,
  MidiNote,
  Velocity,
  emptyRow,
  noteCell,
  noteOffCell,
} from './types';
import { FX } from './effects';
import { PhraseStore, getPhraseStore, Phrase, PhrasePlayMode, PhraseKeyMode } from './phrases';

// =============================================================================
// GENERATOR TYPES
// =============================================================================

/** Generator output event (simplified from main event system) */
export interface GeneratorEvent {
  id: string;
  type: 'note' | 'control' | 'meta';
  time: number; // In ticks from generation start
  duration?: number;
  pitch?: number;
  velocity?: number;
  channel?: number;
  data?: Record<string, unknown>;
}

/** Generator context passed to generators */
export interface GeneratorContext {
  /** Current tick within generation range */
  tick: number;
  /** Total ticks to generate */
  totalTicks: number;
  /** Current pattern being generated into */
  patternId: PatternId;
  /** Current track being generated */
  trackId: TrackId;
  /** Random seed for reproducibility */
  seed: number;
  /** Scale/key context */
  scale?: number[];
  /** Root note */
  rootNote?: number;
  /** Tempo */
  tempo?: number;
  /** LPB (lines per beat) */
  lpb?: number;
  /** Custom parameters from effect command */
  params: Record<string, number>;
}

/** Generator function signature */
export type GeneratorFunction = (ctx: GeneratorContext) => GeneratorEvent[];

/** Generator definition */
export interface GeneratorDefinition {
  id: string;
  name: string;
  description: string;
  category: 'melody' | 'rhythm' | 'harmony' | 'arpeggio' | 'random' | 'custom';
  /** Parameter definitions for effect command */
  params: {
    name: string;
    min: number;
    max: number;
    default: number;
  }[];
  /** The generator function */
  generate: GeneratorFunction;
}

// =============================================================================
// GENERATOR REGISTRY
// =============================================================================

/** Registry of available generators */
export class GeneratorRegistry {
  private generators: Map<string, GeneratorDefinition> = new Map();
  private generatorsBySlot: Map<number, string> = new Map(); // Slot (0x00-0x7F) -> Generator ID
  
  /**
   * Register a generator
   */
  register(definition: GeneratorDefinition, slot?: number): void {
    this.generators.set(definition.id, definition);
    
    if (slot !== undefined && slot >= 0 && slot < 128) {
      this.generatorsBySlot.set(slot, definition.id);
    }
  }
  
  /**
   * Get generator by ID
   */
  get(id: string): GeneratorDefinition | undefined {
    return this.generators.get(id);
  }
  
  /**
   * Get generator by slot number
   */
  getBySlot(slot: number): GeneratorDefinition | undefined {
    const id = this.generatorsBySlot.get(slot);
    return id ? this.generators.get(id) : undefined;
  }
  
  /**
   * List all generators
   */
  getAll(): GeneratorDefinition[] {
    return Array.from(this.generators.values());
  }
  
  /**
   * Get generators by category
   */
  getByCategory(category: GeneratorDefinition['category']): GeneratorDefinition[] {
    return this.getAll().filter(g => g.category === category);
  }
}

// =============================================================================
// GENERATOR EXECUTOR
// =============================================================================

/** Execution result */
export interface GeneratorResult {
  events: GeneratorEvent[];
  rows: TrackerRow[];
  phrase?: Phrase;
}

/**
 * Execute a generator and convert output to tracker rows
 */
export class GeneratorExecutor {
  private registry: GeneratorRegistry;
  private phraseStore: PhraseStore;
  private seedCounter: number = 0;
  
  constructor(registry: GeneratorRegistry, phraseStore?: PhraseStore) {
    this.registry = registry;
    this.phraseStore = phraseStore ?? getPhraseStore();
  }
  
  /**
   * Execute generator and return result
   */
  execute(
    generatorId: string,
    numRows: number,
    ticksPerRow: number = 6,
    seed?: number,
    params: Record<string, number> = {},
    context?: Partial<GeneratorContext>,
  ): GeneratorResult | undefined {
    const definition = this.registry.get(generatorId);
    if (!definition) return undefined;
    
    const actualSeed = seed ?? this.seedCounter++;
    
    const ctx: GeneratorContext = {
      tick: 0,
      totalTicks: numRows * ticksPerRow,
      patternId: context?.patternId ?? ('' as PatternId),
      trackId: context?.trackId ?? ('' as TrackId),
      seed: actualSeed,
      scale: context?.scale ?? [0, 2, 4, 5, 7, 9, 11], // Major scale default
      rootNote: context?.rootNote ?? 60,
      tempo: context?.tempo ?? 120,
      lpb: context?.lpb ?? 4,
      params,
    };
    
    // Run generator
    const events = definition.generate(ctx);
    
    // Convert events to tracker rows
    const rows = this.eventsToRows(events, numRows, ticksPerRow);
    
    return { events, rows };
  }
  
  /**
   * Execute generator from effect command
   */
  executeFromEffect(
    effectCommand: EffectCommand,
    numRows: number,
    ticksPerRow: number = 6,
  ): GeneratorResult | undefined {
    // GEN_TRIGGER format: 0x80 + generator slot, param = seed/variation
    if (effectCommand.code < FX.GEN_TRIGGER || effectCommand.code >= FX.GEN_TRIGGER + 0x10) {
      return undefined;
    }
    
    const slot = effectCommand.code - FX.GEN_TRIGGER;
    const definition = this.registry.getBySlot(slot);
    if (!definition) return undefined;
    
    return this.execute(definition.id, numRows, ticksPerRow, effectCommand.param);
  }
  
  /**
   * Convert generator events to tracker rows
   */
  eventsToRows(events: GeneratorEvent[], numRows: number, ticksPerRow: number): TrackerRow[] {
    const rows: TrackerRow[] = [];
    
    // Create empty rows
    for (let i = 0; i < numRows; i++) {
      rows.push(emptyRow(1));
    }
    
    // Place events on rows
    for (const event of events) {
      const rowIndex = Math.floor(event.time / ticksPerRow);
      const subTick = event.time % ticksPerRow;
      
      if (rowIndex < 0 || rowIndex >= numRows) continue;
      
      const row = rows[rowIndex];
      
      if (event.type === 'note' && event.pitch !== undefined) {
        // Note on - TrackerRow is per-track, so we modify note directly
        // Create a mutable copy since TrackerRow uses readonly
        (row as any).note = noteCell(event.pitch as MidiNote, undefined, (event.velocity ?? 127) as Velocity);
        
        // Add delay if sub-tick
        if (subTick > 0) {
          (row as any).note.delay = Math.round((subTick / ticksPerRow) * 255);
        }
        
        // Add note-off if duration specified
        if (event.duration !== undefined) {
          const offTick = event.time + event.duration;
          const offRowIndex = Math.floor(offTick / ticksPerRow);
          
          if (offRowIndex < numRows && offRowIndex !== rowIndex) {
            (rows[offRowIndex] as any).note = noteOffCell();
          }
        }
      }
    }
    
    return rows;
  }
  
  /**
   * Execute generator and create phrase from result
   */
  executeAsPhrase(
    name: string,
    generatorId: string,
    numRows: number,
    ticksPerRow: number = 6,
    seed?: number,
    params: Record<string, number> = {},
  ): Phrase | undefined {
    const result = this.execute(generatorId, numRows, ticksPerRow, seed, params);
    if (!result) return undefined;
    
    const phrase = this.phraseStore.createPhrase({
      name,
      length: numRows,
      playMode: PhrasePlayMode.OneShot,
      keyMode: PhraseKeyMode.Relative,
    });
    
    phrase.sourceGenerator = generatorId;
    
    // Copy rows
    for (let i = 0; i < result.rows.length && i < phrase.rows.length; i++) {
      phrase.rows[i] = result.rows[i]!;
    }
    
    return phrase;
  }
}

// =============================================================================
// BUILT-IN GENERATORS
// =============================================================================

/**
 * Simple random melody generator
 */
export const randomMelodyGenerator: GeneratorDefinition = {
  id: 'random-melody',
  name: 'Random Melody',
  description: 'Generates random notes from the current scale',
  category: 'melody',
  params: [
    { name: 'density', min: 1, max: 100, default: 50 },
    { name: 'range', min: 12, max: 48, default: 24 },
  ],
  generate(ctx: GeneratorContext): GeneratorEvent[] {
    const events: GeneratorEvent[] = [];
    const rng = createSeededRNG(ctx.seed);
    
    const density = ctx.params['density'] ?? 50;
    const range = ctx.params['range'] ?? 24;
    const scale = ctx.scale ?? [0, 2, 4, 5, 7, 9, 11];
    const root = ctx.rootNote ?? 60;
    
    let tick = 0;
    while (tick < ctx.totalTicks) {
      if (rng() * 100 < density) {
        // Pick note from scale
        const scaleIndex = Math.floor(rng() * scale.length);
        const octaveOffset = Math.floor(rng() * (range / 12)) * 12;
        const pitch = root + scale[scaleIndex]! + octaveOffset;
        
        const duration = Math.floor(rng() * 12) + 3;
        
        events.push({
          id: `note-${tick}`,
          type: 'note',
          time: tick,
          pitch: Math.max(0, Math.min(127, pitch)),
          velocity: 80 + Math.floor(rng() * 47),
          duration,
        });
        
        tick += duration;
      } else {
        tick += 3;
      }
    }
    
    return events;
  },
};

/**
 * Euclidean rhythm generator
 */
export const euclideanRhythmGenerator: GeneratorDefinition = {
  id: 'euclidean-rhythm',
  name: 'Euclidean Rhythm',
  description: 'Generates evenly-distributed rhythmic patterns',
  category: 'rhythm',
  params: [
    { name: 'hits', min: 1, max: 32, default: 5 },
    { name: 'steps', min: 2, max: 64, default: 16 },
    { name: 'rotation', min: 0, max: 31, default: 0 },
    { name: 'note', min: 0, max: 127, default: 36 },
  ],
  generate(ctx: GeneratorContext): GeneratorEvent[] {
    const events: GeneratorEvent[] = [];
    
    const hits = ctx.params['hits'] ?? 5;
    const steps = ctx.params['steps'] ?? 16;
    const rotation = ctx.params['rotation'] ?? 0;
    const note = ctx.params['note'] ?? 36;
    
    // Generate Euclidean rhythm
    const pattern: boolean[] = new Array(steps).fill(false);
    
    for (let i = 0; i < hits; i++) {
      const position = Math.floor((i * steps) / hits);
      pattern[(position + rotation) % steps] = true;
    }
    
    // Convert to events
    const ticksPerStep = Math.floor(ctx.totalTicks / steps);
    
    for (let i = 0; i < steps; i++) {
      if (pattern[i]) {
        events.push({
          id: `hit-${i}`,
          type: 'note',
          time: i * ticksPerStep,
          pitch: note,
          velocity: 100 + Math.floor(Math.random() * 27),
          duration: Math.floor(ticksPerStep * 0.5),
        });
      }
    }
    
    return events;
  },
};

/**
 * Arpeggio pattern generator
 */
export const arpeggioGenerator: GeneratorDefinition = {
  id: 'arpeggio',
  name: 'Arpeggio',
  description: 'Generates arpeggiated chord patterns',
  category: 'arpeggio',
  params: [
    { name: 'pattern', min: 0, max: 7, default: 0 }, // 0=up, 1=down, 2=updown, etc.
    { name: 'octaves', min: 1, max: 4, default: 2 },
    { name: 'speed', min: 1, max: 8, default: 2 }, // Ticks per note
  ],
  generate(ctx: GeneratorContext): GeneratorEvent[] {
    const events: GeneratorEvent[] = [];
    
    const patternType = ctx.params['pattern'] ?? 0;
    const octaves = ctx.params['octaves'] ?? 2;
    const speed = ctx.params['speed'] ?? 2;
    const root = ctx.rootNote ?? 60;
    
    // Build chord notes (major triad by default)
    const chordIntervals = [0, 4, 7]; // Major
    const notes: number[] = [];
    
    for (let oct = 0; oct < octaves; oct++) {
      for (const interval of chordIntervals) {
        notes.push(root + interval + oct * 12);
      }
    }
    
    // Apply pattern
    let sequence: number[] = [];
    switch (patternType) {
      case 0: // Up
        sequence = [...notes];
        break;
      case 1: // Down
        sequence = [...notes].reverse();
        break;
      case 2: // Up-Down
        sequence = [...notes, ...notes.slice(1, -1).reverse()];
        break;
      case 3: // Down-Up
        sequence = [...notes.reverse(), ...notes.slice(1, -1)];
        break;
      case 4: // Random
        sequence = shuffle([...notes], ctx.seed);
        break;
      default:
        sequence = [...notes];
    }
    
    // Generate events
    let tick = 0;
    let noteIndex = 0;
    
    while (tick < ctx.totalTicks) {
      events.push({
        id: `arp-${tick}`,
        type: 'note',
        time: tick,
        pitch: sequence[noteIndex % sequence.length]!,
        velocity: 100,
        duration: speed - 1,
      });

      tick += speed;
      noteIndex++;
    }
    
    return events;
  },
};

/**
 * Walking bass generator
 */
export const walkingBassGenerator: GeneratorDefinition = {
  id: 'walking-bass',
  name: 'Walking Bass',
  description: 'Generates walking bass lines',
  category: 'melody',
  params: [
    { name: 'activity', min: 1, max: 100, default: 70 },
    { name: 'range', min: 12, max: 24, default: 12 },
  ],
  generate(ctx: GeneratorContext): GeneratorEvent[] {
    const events: GeneratorEvent[] = [];
    const rng = createSeededRNG(ctx.seed);
    
    const activity = ctx.params['activity'] ?? 70;
    const range = ctx.params['range'] ?? 12;
    const root = (ctx.rootNote ?? 60) - 12; // Bass is usually an octave lower
    const scale = ctx.scale ?? [0, 2, 4, 5, 7, 9, 11];
    
    const ticksPerBeat = ctx.lpb ? Math.floor(ctx.totalTicks / (ctx.totalTicks / ctx.lpb)) : 6;
    
    let currentNote = root;
    let tick = 0;
    
    while (tick < ctx.totalTicks) {
      // Play note
      events.push({
        id: `bass-${tick}`,
        type: 'note',
        time: tick,
        pitch: currentNote,
        velocity: 90 + Math.floor(rng() * 30),
        duration: ticksPerBeat - 1,
      });
      
      // Choose next note
      if (rng() * 100 < activity) {
        // Step motion
        const direction = rng() > 0.5 ? 1 : -1;
        const scaleIndex = findClosestScaleIndex(currentNote - root, scale);
        const nextIndex = (scaleIndex + direction + scale.length) % scale.length;
        const octaveShift = direction > 0 && nextIndex < scaleIndex ? 12
          : direction < 0 && nextIndex > scaleIndex ? -12 : 0;

        currentNote = root + scale[nextIndex]! + octaveShift;
        
        // Keep in range
        while (currentNote < root) currentNote += 12;
        while (currentNote > root + range) currentNote -= 12;
      }
      
      tick += ticksPerBeat;
    }
    
    return events;
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create seeded RNG (xorshift)
 */
function createSeededRNG(seed: number): () => number {
  let state = seed || 1;
  
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

/**
 * Shuffle array with seed
 */
function shuffle<T>(array: T[], seed: number): T[] {
  const rng = createSeededRNG(seed);
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  
  return result;
}

/**
 * Find closest scale index for a pitch
 */
function findClosestScaleIndex(pitch: number, scale: number[]): number {
  const normalizedPitch = ((pitch % 12) + 12) % 12;
  
  let closestIndex = 0;
  let closestDistance = 12;
  
  for (let i = 0; i < scale.length; i++) {
    const distance = Math.abs(scale[i]! - normalizedPitch);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }
  
  return closestIndex;
}

// =============================================================================
// SINGLETON ACCESS
// =============================================================================

let registryInstance: GeneratorRegistry | undefined;
let executorInstance: GeneratorExecutor | undefined;

/**
 * Get global generator registry
 */
export function getGeneratorRegistry(): GeneratorRegistry {
  if (!registryInstance) {
    registryInstance = new GeneratorRegistry();
    
    // Register built-in generators
    registryInstance.register(randomMelodyGenerator, 0);
    registryInstance.register(euclideanRhythmGenerator, 1);
    registryInstance.register(arpeggioGenerator, 2);
    registryInstance.register(walkingBassGenerator, 3);
  }
  return registryInstance;
}

/**
 * Get global generator executor
 */
export function getGeneratorExecutor(): GeneratorExecutor {
  if (!executorInstance) {
    executorInstance = new GeneratorExecutor(getGeneratorRegistry());
  }
  return executorInstance;
}

/**
 * Reset generators (for testing)
 */
export function resetGenerators(): void {
  registryInstance = undefined;
  executorInstance = undefined;
}
