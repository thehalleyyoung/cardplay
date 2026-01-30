/**
 * @fileoverview Melody Generator
 * 
 * Prolog-powered melody generator that uses the music theory and
 * composition pattern knowledge bases to generate melodic lines.
 * 
 * L187-L190: Melody generator using Prolog KB
 * 
 * @module @cardplay/ai/generators/melody-generator
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
 * Chord information for melody generation.
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
 * Scale context for melody generation.
 */
export interface ScaleContext {
  /** Root note name */
  readonly root: string;
  /** Scale type (e.g., 'major', 'minor', 'pentatonic') */
  readonly scale: string;
}

/**
 * Melody generation options.
 */
export interface MelodyGeneratorOptions {
  /** Genre for melody constraints */
  readonly genre?: string;
  /** Octave for melody notes (default: 4) */
  readonly octave?: number;
  /** Base velocity (default: 100) */
  readonly velocity?: number;
  /** Random seed for reproducibility */
  readonly seed?: number;
  /** Note density (0-1, default: 0.5) */
  readonly density?: number;
  /** Melodic contour preference: 'ascending' | 'descending' | 'arch' | 'random' */
  readonly contour?: string;
  /** Maximum interval jump in semitones (default: 5) */
  readonly maxInterval?: number;
  /** Ticks per beat (default: 480) */
  readonly ticksPerBeat?: number;
  /** Phrase length in beats (default: 4) */
  readonly phraseLength?: number;
}

/**
 * Generated melody result.
 */
export interface MelodyGeneratorResult {
  /** Generated note events */
  readonly events: NoteEvent[];
  /** Genre used */
  readonly genre: string;
  /** Scale used */
  readonly scale: ScaleContext;
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
 * Scale interval patterns (semitones from root).
 */
const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'pentatonic_major': [0, 2, 4, 7, 9],
  'pentatonic_minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

/**
 * Convert note name to MIDI pitch at given octave.
 */
function noteToMidi(note: string, octave: number): number {
  const semitone = NOTE_TO_SEMITONE[note.toLowerCase()] ?? 0;
  return (octave + 1) * 12 + semitone;
}

/**
 * Get chord tones as semitones from root.
 */
function getChordTones(quality: string): number[] {
  const tones: Record<string, number[]> = {
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
  return tones[quality] ?? [0, 4, 7];
}

// =============================================================================
// Melody Generator Class
// =============================================================================

/**
 * Melody generator using Prolog knowledge bases.
 */
export class MelodyGenerator {
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
   * Get melodic range constraints from Prolog.
   */
  private async getMelodicRange(genre: string): Promise<{ minInterval: number; maxInterval: number }> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(
      `melodic_range(${genre}, MinInterval, MaxInterval)`
    );
    
    if (result !== null) {
      return {
        minInterval: Number(result.MinInterval) || 1,
        maxInterval: Number(result.MaxInterval) || 5
      };
    }
    
    return { minInterval: 1, maxInterval: 5 };
  }
  
  /**
   * Generate a melody for a chord progression.
   * 
   * @param chords - Array of chord contexts
   * @param scale - Scale context
   * @param options - Generation options
   * @returns Generated melody result
   * 
   * @example
   * const generator = new MelodyGenerator();
   * const result = await generator.generate(
   *   [{ root: 'c', quality: 'major', start: 0, duration: 1920 }],
   *   { root: 'c', scale: 'major' },
   *   { genre: 'pop', density: 0.6 }
   * );
   */
  async generate(
    chords: ChordContext[],
    scale: ScaleContext,
    options: MelodyGeneratorOptions = {}
  ): Promise<MelodyGeneratorResult> {
    await this.ensureKBLoaded();
    
    const {
      genre = 'pop',
      octave = 4,
      velocity = 100,
      seed,
      density = 0.5,
      contour = 'random',
      maxInterval: optMaxInterval,
      ticksPerBeat = PPQ,
      phraseLength: _phraseLength = 4
    } = options;
    
    // Consume _phraseLength to avoid unused variable error
    void _phraseLength;
    
    // Get melodic range constraints from KB
    const rangeConstraints = await this.getMelodicRange(genre);
    const maxInterval = optMaxInterval ?? rangeConstraints.maxInterval;
    
    // Initialize random
    let rng = seed ?? Date.now();
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };
    
    const scaleIntervals = SCALE_INTERVALS[scale.scale] ?? SCALE_INTERVALS.major;
    const rootOffset = NOTE_TO_SEMITONE[scale.root.toLowerCase()] ?? 0;
    
    const events: NoteEvent[] = [];
    let lastPitch = noteToMidi(scale.root, octave);
    let contourDirection = contour === 'ascending' ? 1 : contour === 'descending' ? -1 : 0;
    
    for (const chord of chords) {
      const chordRoot = noteToMidi(chord.root, octave);
      const chordTones = getChordTones(chord.quality);
      
      // Calculate number of notes based on density
      const beatsInChord = chord.duration / ticksPerBeat;
      const maxNotes = Math.ceil(beatsInChord * 4); // Maximum 16th notes
      const noteCount = Math.max(1, Math.round(maxNotes * density));
      
      const noteDuration = chord.duration / noteCount;
      
      for (let i = 0; i < noteCount; i++) {
        // Decide whether to generate a note or rest
        if (random() > density + 0.2) {
          continue; // Rest
        }
        
        // Calculate target pitch
        let targetPitch: number;
        
        // Prefer chord tones on strong beats
        const isStrongBeat = i % 2 === 0;
        
        if (isStrongBeat && random() < 0.7) {
          // Use chord tone
          const toneIndex = Math.floor(random() * chordTones.length);
          targetPitch = chordRoot + (chordTones[toneIndex] ?? 0);
        } else {
          // Use scale tone near last pitch
          // scaleIntervals always has a fallback via ?? SCALE_INTERVALS.major above
          const activeScaleIntervals = scaleIntervals!;
          const scaleTones = activeScaleIntervals.map(s => {
            const basePitch = (octave + 1) * 12 + rootOffset + s;
            // Include octave above and below
            return [basePitch - 12, basePitch, basePitch + 12];
          }).flat();
          
          // Find scale tones within max interval of last pitch
          const nearbyTones = scaleTones.filter(p => 
            Math.abs(p - lastPitch) <= maxInterval
          );
          
          if (nearbyTones.length > 0) {
            // Apply contour preference
            let candidates = nearbyTones;
            if (contour === 'arch' && i < noteCount / 2) {
              candidates = nearbyTones.filter(p => p >= lastPitch);
              if (candidates.length === 0) candidates = nearbyTones;
            } else if (contour === 'arch') {
              candidates = nearbyTones.filter(p => p <= lastPitch);
              if (candidates.length === 0) candidates = nearbyTones;
            } else if (contourDirection !== 0) {
              candidates = nearbyTones.filter(p => 
                contourDirection > 0 ? p >= lastPitch : p <= lastPitch
              );
              if (candidates.length === 0) {
                contourDirection *= -1; // Reverse direction
                candidates = nearbyTones;
              }
            }
            
            targetPitch = candidates[Math.floor(random() * candidates.length)] ?? lastPitch;
          } else {
            targetPitch = lastPitch; // Stay on same note if nothing nearby
          }
        }
        
        // Apply slight velocity variation
        let noteVelocity = velocity;
        noteVelocity = Math.round(velocity + (isStrongBeat ? 10 : -10) + (random() - 0.5) * 20);
        noteVelocity = Math.max(1, Math.min(127, noteVelocity));
        
        events.push({
          pitch: targetPitch,
          start: chord.start + Math.round(i * noteDuration),
          duration: Math.round(noteDuration * 0.85),
          velocity: noteVelocity
        });
        
        lastPitch = targetPitch;
      }
    }
    
    return {
      events,
      genre,
      scale
    };
  }
  
  /**
   * Generate a simple motif that can be developed.
   */
  async generateMotif(
    scale: ScaleContext,
    lengthBeats: number = 2,
    options: Omit<MelodyGeneratorOptions, 'phraseLength'> = {}
  ): Promise<NoteEvent[]> {
    const ticksPerBeat = options.ticksPerBeat ?? 480;
    const totalTicks = lengthBeats * ticksPerBeat;
    
    // Create a temporary chord for the motif duration
    const tempChord: ChordContext = {
      root: scale.root,
      quality: 'major',
      start: 0,
      duration: totalTicks
    };
    
    const result = await this.generate([tempChord], scale, {
      ...options,
      density: options.density ?? 0.7 // Slightly denser for motifs
    });
    
    return result.events;
  }
  
  /**
   * Apply a variation technique to a melody.
   */
  async applyVariation(
    events: NoteEvent[],
    technique: string,
    amount: number = 0.5
  ): Promise<NoteEvent[]> {
    await this.ensureKBLoaded();
    
    // Query Prolog for variation technique details
    const _result = await this.adapter.querySingle(
      `variation_technique(${technique}, Description)`
    );
    // _result used for future technique metadata lookup
    void _result;
    
    const varied: NoteEvent[] = [];
    
    switch (technique) {
      case 'transposition':
        // Transpose by a number of semitones
        const semitones = Math.round(amount * 12) - 6; // -6 to +6
        for (const e of events) {
          varied.push({ ...e, pitch: e.pitch + semitones });
        }
        break;
        
      case 'inversion':
        // Invert around the first note
        if (events.length > 0) {
          const firstEvent = events[0]!;
          const axis = firstEvent.pitch;
          for (const e of events) {
            const interval = e.pitch - axis;
            varied.push({ ...e, pitch: axis - interval });
          }
        }
        break;
        
      case 'retrograde':
        // Reverse the order of notes
        if (events.length > 0) {
          const firstEvent = events[0]!;
          const lastEvent = events[events.length - 1]!;
          const totalDuration = lastEvent.start + lastEvent.duration - firstEvent.start;
          const startOffset = firstEvent.start;
          
          for (let i = events.length - 1; i >= 0; i--) {
            const e = events[i]!;
            const newStart = startOffset + (totalDuration - (e.start - startOffset) - e.duration);
            varied.push({ ...e, start: newStart });
          }
        }
        break;
        
      case 'augmentation':
        // Double the duration
        if (events.length > 0) {
          const firstStart = events[0]!.start;
          for (const e of events) {
            const relStart = e.start - firstStart;
            varied.push({
              ...e,
              start: firstStart + relStart * 2,
              duration: e.duration * 2
            });
          }
        }
        break;
        
      case 'diminution':
        // Halve the duration
        if (events.length > 0) {
          const firstStart = events[0]!.start;
          for (const e of events) {
            const relStart = e.start - firstStart;
            varied.push({
              ...e,
              start: firstStart + relStart / 2,
              duration: e.duration / 2
            });
          }
        }
        break;
        
      case 'ornamentation':
        // Add passing tones
        for (let i = 0; i < events.length; i++) {
          const current = events[i]!;
          varied.push(current);
          
          if (i < events.length - 1 && Math.random() < amount) {
            const next = events[i + 1]!;
            const interval = next.pitch - current.pitch;
            
            if (Math.abs(interval) > 2) {
              // Add passing tone
              const passingPitch = current.pitch + Math.sign(interval) * 2;
              const gapStart = current.start + current.duration;
              const gapDuration = next.start - gapStart;
              
              if (gapDuration > 60) { // Only if there's space
                varied.push({
                  pitch: passingPitch,
                  start: gapStart,
                  duration: Math.min(gapDuration / 2, 120),
                  velocity: Math.round(current.velocity * 0.7)
                });
              }
            }
          }
        }
        break;
        
      default:
        // Unknown technique, return original
        return events;
    }
    
    return varied;
  }
}

/**
 * Create a new melody generator instance.
 */
export function createMelodyGenerator(
  adapter: PrologAdapter = getPrologAdapter()
): MelodyGenerator {
  return new MelodyGenerator(adapter);
}

// =============================================================================
// SCHEMA CHAIN MELODY GENERATION (C338)
// =============================================================================

/**
 * Schema melody constraint - defines upper-voice targets for a schema
 */
export interface SchemaMelodyConstraint {
  readonly schemaName: string;
  /** Scale degrees for upper voice skeleton */
  readonly upperVoice: readonly number[];
  /** Metric positions (beats) */
  readonly metricPositions: readonly number[];
  /** Elaboration level */
  readonly elaboration: 'skeletal' | 'simple' | 'ornate';
}

/**
 * Predefined schema upper-voice patterns
 */
export const SCHEMA_MELODY_PATTERNS: readonly SchemaMelodyConstraint[] = [
  { schemaName: 'romanesca', upperVoice: [0, 4, 2, 4], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
  { schemaName: 'prinner', upperVoice: [5, 4, 3, 2], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
  { schemaName: 'monte', upperVoice: [2, 4, 3, 5], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
  { schemaName: 'fonte', upperVoice: [1, 0, 0, 6], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
  { schemaName: 'do-re-mi', upperVoice: [0, 1, 2], metricPositions: [0, 1, 2], elaboration: 'simple' },
  { schemaName: 'sol-fa-mi', upperVoice: [4, 3, 2], metricPositions: [0, 1, 2], elaboration: 'simple' },
  { schemaName: 'quiescenza', upperVoice: [0, 6, 0, 6], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
  { schemaName: 'converging', upperVoice: [5, 4, 3, 2], metricPositions: [0, 1, 2, 3], elaboration: 'simple' },
];

/**
 * Get melody pattern for a schema
 */
export function getSchemaMelodyPattern(schemaName: string): SchemaMelodyConstraint | undefined {
  return SCHEMA_MELODY_PATTERNS.find(p => 
    p.schemaName.toLowerCase() === schemaName.toLowerCase()
  );
}

/**
 * Generate melody from schema chain using upper-voice path.
 * 
 * This is the C338 integration: schema chain to melody generator (upper-voice path).
 */
export function generateMelodyFromSchemaChain(
  schemata: readonly string[],
  scale: ScaleContext,
  options: Partial<MelodyGeneratorOptions> = {}
): NoteEvent[] {
  const ticksPerBeat = options.ticksPerBeat ?? 480;
  const octave = options.octave ?? 5; // Upper voice octave
  const velocity = options.velocity ?? 90;
  
  // Get scale intervals
  const scaleIntervals = getScaleIntervals(scale.scale);
  const rootPitch = NOTE_NAME_TO_MIDI[scale.root.toLowerCase()] ?? 60;
  
  const notes: NoteEvent[] = [];
  let currentTick = 0;
  
  for (const schemaName of schemata) {
    const pattern = getSchemaMelodyPattern(schemaName);
    if (!pattern) {
      currentTick += ticksPerBeat * 4; // Skip if no pattern
      continue;
    }
    
    const ticksPerNote = ticksPerBeat; // One beat per skeleton note
    
    for (let i = 0; i < pattern.upperVoice.length; i++) {
      const scaleDegree = pattern.upperVoice[i]!;
      const pitch = scaleDegreeToMidi(scaleDegree, rootPitch, octave, scaleIntervals);
      
      // Generate based on elaboration level
      if (pattern.elaboration === 'skeletal') {
        // Just skeleton notes
        notes.push({
          pitch,
          start: currentTick,
          duration: ticksPerNote * 0.9,
          velocity,
        });
      } else if (pattern.elaboration === 'simple') {
        // Add slight ornamentation
        notes.push({
          pitch,
          start: currentTick,
          duration: ticksPerNote * 0.45,
          velocity,
        });
        
        // Add neighbor tone on upbeat
        const neighbor = i < pattern.upperVoice.length - 1 ? 
          scaleDegreeToMidi(scaleDegree + 1, rootPitch, octave, scaleIntervals) :
          pitch;
        notes.push({
          pitch: neighbor,
          start: currentTick + ticksPerNote * 0.5,
          duration: ticksPerNote * 0.35,
          velocity: Math.round(velocity * 0.8),
        });
      } else {
        // Ornate - add more embellishments
        const duration = ticksPerNote / 4;
        notes.push({ pitch: pitch + 2, start: currentTick, duration, velocity: Math.round(velocity * 0.7) });
        notes.push({ pitch, start: currentTick + duration, duration: duration * 2, velocity });
        notes.push({ pitch: pitch - 1, start: currentTick + duration * 3, duration, velocity: Math.round(velocity * 0.75) });
      }
      
      currentTick += ticksPerNote;
    }
  }
  
  return notes;
}

/**
 * Get scale intervals for a scale type
 */
function getScaleIntervals(scaleType: string): readonly number[] {
  const scales: Record<string, readonly number[]> = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  };
  return scales[scaleType.toLowerCase()] ?? scales['major']!;
}

/**
 * Convert scale degree to MIDI pitch
 */
function scaleDegreeToMidi(
  degree: number,
  rootPitch: number,
  octave: number,
  scaleIntervals: readonly number[]
): number {
  const normalizedDegree = ((degree % 7) + 7) % 7;
  const octaveOffset = Math.floor(degree / 7);
  const interval = scaleIntervals[normalizedDegree] ?? 0;
  return (rootPitch % 12) + octave * 12 + interval + octaveOffset * 12;
}

/**
 * Note name to MIDI note number mapping
 */
const NOTE_NAME_TO_MIDI: Record<string, number> = {
  'c': 0, 'csharp': 1, 'dflat': 1,
  'd': 2, 'dsharp': 3, 'eflat': 3,
  'e': 4,
  'f': 5, 'fsharp': 6, 'gflat': 6,
  'g': 7, 'gsharp': 8, 'aflat': 8,
  'a': 9, 'asharp': 10, 'bflat': 10,
  'b': 11,
};
