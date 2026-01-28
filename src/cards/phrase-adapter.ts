/**
 * @fileoverview Smart Phrase Adapter - Chord-Aware Phrase Transformation
 * 
 * Automatically adapts musical phrases to chord/scale context. Supports:
 * - Simple transposition
 * - Chord-tone mapping (snap to nearest chord tone)
 * - Scale-degree preservation
 * - Voice-leading optimization
 * - Rhythm-only mode (regenerate pitches)
 * 
 * @module @cardplay/cards/phrase-adapter
 */

import type { Tick } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type { ScoreNoteInput, ChordSymbolInput } from './score-notation';

// ============================================================================
// ADAPTATION TYPES
// ============================================================================

/**
 * Adaptation mode determines how phrases are transformed.
 */
export type AdaptationMode =
  | 'transpose'      // Simple transposition
  | 'chord-tone'     // Map to nearest chord tone
  | 'scale-degree'   // Preserve scale degrees
  | 'voice-leading'  // Smooth voice leading
  | 'rhythm-only';   // Keep rhythm, regenerate pitches

/**
 * Adaptation options for fine-tuning.
 */
export interface AdaptationOptions {
  /** Adaptation mode */
  readonly mode: AdaptationMode;
  /** Preserve rhythm exactly */
  readonly preserveRhythm: boolean;
  /** Preserve contour (relative motion) */
  readonly preserveContour: boolean;
  /** Octave range to keep notes within */
  readonly octaveRange?: { min: number; max: number };
  /** Velocity scaling factor */
  readonly velocityScale: number;
  /** Whether to handle passing tones specially */
  readonly preservePassingTones: boolean;
  /** Voice leading smoothness weight (0-1) */
  readonly voiceLeadingWeight: number;
}

/**
 * Default adaptation options.
 */
export const DEFAULT_ADAPTATION_OPTIONS: AdaptationOptions = {
  mode: 'chord-tone',
  preserveRhythm: true,
  preserveContour: true,
  velocityScale: 1.0,
  preservePassingTones: true,
  voiceLeadingWeight: 0.5,
};

/**
 * Chord analysis result.
 */
export interface ChordAnalysis {
  /** Root note (0-11) */
  readonly root: number;
  /** Chord tones as pitch classes (0-11) */
  readonly chordTones: readonly number[];
  /** Scale tones as pitch classes (0-11) */
  readonly scaleTones: readonly number[];
  /** Chord quality */
  readonly quality: string;
  /** Available tensions/extensions */
  readonly tensions: readonly number[];
}

/**
 * Note analysis for adaptation.
 */
export interface NoteAnalysis {
  /** Note is a chord tone */
  readonly isChordTone: boolean;
  /** Note is a scale tone (not chord tone) */
  readonly isScaleTone: boolean;
  /** Note is a passing tone */
  readonly isPassingTone: boolean;
  /** Scale degree (1-7) */
  readonly scaleDegree: number;
  /** Distance to nearest chord tone */
  readonly distanceToChordTone: number;
  /** Nearest chord tone pitch class */
  readonly nearestChordTone: number;
}

// ============================================================================
// MUSIC THEORY CONSTANTS
// ============================================================================

/**
 * Note name to pitch class mapping.
 */
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'E#': 5,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11, 'B#': 0,
};

/**
 * Pitch class to note name mapping.
 * @internal Reserved for future use in chord symbol formatting
 */
export const PITCH_TO_NOTE: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * Chord type to intervals mapping.
 */
const CHORD_INTERVALS: Record<string, readonly number[]> = {
  // Triads
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  
  // Seventh chords
  '7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'M7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'min7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'm7b5': [0, 3, 6, 10],
  'half-dim': [0, 3, 6, 10],
  'aug7': [0, 4, 8, 10],
  'mMaj7': [0, 3, 7, 11],
  
  // Extended chords
  '9': [0, 4, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  'm9': [0, 3, 7, 10, 14],
  '11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  
  // Add chords
  'add9': [0, 4, 7, 14],
  'add11': [0, 4, 7, 17],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  '6/9': [0, 4, 7, 9, 14],
};

/**
 * Scale patterns (semitones from root).
 */
const SCALE_PATTERNS: Record<string, readonly number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
};

// ============================================================================
// CHORD ANALYSIS
// ============================================================================

/**
 * Parse chord symbol to root pitch class.
 */
export function parseChordRoot(symbol: string): number {
  // Extract root from symbol (e.g., "Cm7" -> "C", "F#m" -> "F#")
  const match = symbol.match(/^([A-G][#b]?)/);
  if (!match) return 0;
  
  return NOTE_TO_PITCH[match[1]!] ?? 0;
}

/**
 * Parse chord symbol to chord type.
 */
export function parseChordType(symbol: string): string {
  // Extract type from symbol (e.g., "Cm7" -> "m7", "F#m" -> "m")
  const match = symbol.match(/^[A-G][#b]?(.*?)(?:\/[A-G][#b]?)?$/);
  if (!match) return 'major';
  
  const type = match[1] || 'major';
  
  // Normalize common variations
  if (type === 'm' || type === 'min') return 'minor';
  if (type === 'M' || type === 'Maj' || type === '') return 'major';
  if (type === '°' || type === 'o') return 'dim';
  if (type === '+') return 'aug';
  if (type === 'Δ' || type === 'Δ7') return 'maj7';
  if (type === 'ø' || type === 'ø7') return 'm7b5';
  
  return type;
}

/**
 * Analyze a chord symbol.
 */
export function analyzeChord(chord: ChordSymbolInput): ChordAnalysis {
  const root = NOTE_TO_PITCH[chord.root] ?? 0;
  const type = chord.type || 'major';
  
  // Get chord intervals
  const intervals = CHORD_INTERVALS[type] ?? CHORD_INTERVALS['major']!;
  
  // Calculate chord tones
  const chordTones = intervals.map(i => (root + i) % 12);
  
  // Determine scale based on chord type
  let scalePattern: readonly number[];
  if (type.includes('m') && !type.includes('maj')) {
    scalePattern = SCALE_PATTERNS['minor']!;
  } else if (type.includes('7') && !type.includes('maj7')) {
    scalePattern = SCALE_PATTERNS['mixolydian']!;
  } else {
    scalePattern = SCALE_PATTERNS['major']!;
  }
  
  const scaleTones = scalePattern.map(i => (root + i) % 12);
  
  // Calculate tensions (available extensions not in basic chord)
  const basicChordTones = new Set(chordTones.slice(0, 4));
  const tensions = scaleTones.filter(t => !basicChordTones.has(t));
  
  return {
    root,
    chordTones,
    scaleTones,
    quality: type,
    tensions,
  };
}

/**
 * Analyze a note in the context of a chord.
 */
export function analyzeNote(
  pitchClass: number,
  chordAnalysis: ChordAnalysis,
  _prevNote?: number,
  _nextNote?: number
): NoteAnalysis {
  const { chordTones, scaleTones } = chordAnalysis;
  
  // Check if chord/scale tone
  const isChordTone = chordTones.includes(pitchClass);
  const isScaleTone = scaleTones.includes(pitchClass) && !isChordTone;
  
  // Calculate distance to nearest chord tone
  let minDistance = 12;
  let nearestChordTone = chordTones[0]!;
  
  for (const ct of chordTones) {
    const dist = Math.min(
      Math.abs(pitchClass - ct),
      Math.abs(pitchClass - ct + 12),
      Math.abs(pitchClass - ct - 12)
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestChordTone = ct;
    }
  }
  
  // Determine if passing tone (simplified: non-chord tone between beats)
  const isPassingTone = !isChordTone && isScaleTone;
  
  // Calculate scale degree (1-7)
  const scaleDegree = scaleTones.indexOf(pitchClass) + 1 || 
    scaleTones.indexOf(nearestChordTone) + 1;
  
  return {
    isChordTone,
    isScaleTone,
    isPassingTone,
    scaleDegree,
    distanceToChordTone: minDistance,
    nearestChordTone,
  };
}

// ============================================================================
// TRANSPOSITION HELPERS
// ============================================================================

/**
 * Get transposition amount between two chords.
 */
export function getTranspositionAmount(
  sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput
): number {
  const sourceRoot = NOTE_TO_PITCH[sourceChord.root] ?? 0;
  const targetRoot = NOTE_TO_PITCH[targetChord.root] ?? 0;
  
  return targetRoot - sourceRoot;
}

/**
 * Transpose a MIDI pitch by semitones.
 */
export function transposePitch(pitch: number, semitones: number): number {
  return pitch + semitones;
}

/**
 * Constrain pitch to octave range.
 */
export function constrainToOctaveRange(
  pitch: number,
  range: { min: number; max: number }
): number {
  while (pitch < range.min) pitch += 12;
  while (pitch > range.max) pitch -= 12;
  return pitch;
}

// ============================================================================
// ADAPTATION ALGORITHMS
// ============================================================================

/**
 * Adapt phrase using simple transposition.
 */
export function adaptByTransposition(
  notes: readonly ScoreNoteInput[],
  sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: AdaptationOptions
): readonly ScoreNoteInput[] {
  const transposition = getTranspositionAmount(sourceChord, targetChord);
  
  return notes.map(note => {
    let newPitch = transposePitch(note.pitch, transposition);
    
    if (options.octaveRange) {
      newPitch = constrainToOctaveRange(newPitch, options.octaveRange);
    }
    
    return {
      ...note,
      id: `${note.id}_adapted`,
      pitch: newPitch,
      velocity: Math.round(note.velocity * options.velocityScale),
    };
  });
}

/**
 * Adapt phrase by mapping to chord tones.
 */
export function adaptByChordTone(
  notes: readonly ScoreNoteInput[],
  sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: AdaptationOptions
): readonly ScoreNoteInput[] {
  const sourceAnalysis = analyzeChord(sourceChord);
  const targetAnalysis = analyzeChord(targetChord);
  
  return notes.map((note, index) => {
    const pitchClass = note.pitch % 12;
    const octave = Math.floor(note.pitch / 12);
    
    // Analyze note in source context
    const prevNote = index > 0 ? notes[index - 1]?.pitch : undefined;
    const nextNote = index < notes.length - 1 ? notes[index + 1]?.pitch : undefined;
    const noteAnalysis = analyzeNote(pitchClass, sourceAnalysis, prevNote, nextNote);
    
    let newPitchClass: number;
    
    if (noteAnalysis.isChordTone) {
      // Map chord tone to corresponding chord tone in target
      const chordToneIndex = sourceAnalysis.chordTones.indexOf(pitchClass);
      newPitchClass = targetAnalysis.chordTones[chordToneIndex % targetAnalysis.chordTones.length]!;
    } else if (options.preservePassingTones && noteAnalysis.isPassingTone) {
      // Map passing tone to nearest target scale tone
      newPitchClass = findNearestScaleTone(pitchClass, targetAnalysis);
    } else {
      // Map to nearest chord tone
      newPitchClass = findNearestChordTone(pitchClass, targetAnalysis);
    }
    
    // Preserve octave (with contour adjustment if needed)
    let newPitch = octave * 12 + newPitchClass;
    
    // Preserve contour if enabled
    if (options.preserveContour && index > 0) {
      const prevPitch = notes[index - 1]!.pitch;
      const prevNewPitch = notes[index - 1]!.pitch; // Would need to track adapted pitches
      const originalInterval = note.pitch - prevPitch;
      
      // Adjust octave to maintain similar interval direction
      if (originalInterval > 0 && newPitch < prevNewPitch) {
        newPitch += 12;
      } else if (originalInterval < 0 && newPitch > prevNewPitch) {
        newPitch -= 12;
      }
    }
    
    if (options.octaveRange) {
      newPitch = constrainToOctaveRange(newPitch, options.octaveRange);
    }
    
    return {
      ...note,
      id: `${note.id}_adapted`,
      pitch: newPitch,
      velocity: Math.round(note.velocity * options.velocityScale),
    };
  });
}

/**
 * Adapt phrase by preserving scale degrees.
 */
export function adaptByScaleDegree(
  notes: readonly ScoreNoteInput[],
  sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: AdaptationOptions
): readonly ScoreNoteInput[] {
  const sourceAnalysis = analyzeChord(sourceChord);
  const targetAnalysis = analyzeChord(targetChord);
  
  return notes.map(note => {
    const pitchClass = note.pitch % 12;
    const octave = Math.floor(note.pitch / 12);
    
    // Find scale degree in source
    const sourceDegreeIndex = sourceAnalysis.scaleTones.indexOf(pitchClass);
    
    let newPitchClass: number;
    if (sourceDegreeIndex >= 0 && sourceDegreeIndex < targetAnalysis.scaleTones.length) {
      // Use same scale degree in target
      newPitchClass = targetAnalysis.scaleTones[sourceDegreeIndex]!;
    } else {
      // Fall back to nearest scale tone
      newPitchClass = findNearestScaleTone(pitchClass, targetAnalysis);
    }
    
    let newPitch = octave * 12 + newPitchClass;
    
    if (options.octaveRange) {
      newPitch = constrainToOctaveRange(newPitch, options.octaveRange);
    }
    
    return {
      ...note,
      id: `${note.id}_adapted`,
      pitch: newPitch,
      velocity: Math.round(note.velocity * options.velocityScale),
    };
  });
}

/**
 * Adapt phrase with voice leading optimization.
 */
export function adaptByVoiceLeading(
  notes: readonly ScoreNoteInput[],
  _sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: AdaptationOptions
): readonly ScoreNoteInput[] {
  const targetAnalysis = analyzeChord(targetChord);
  const adaptedNotes: ScoreNoteInput[] = [];
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]!;
    const octave = Math.floor(note.pitch / 12);
    
    // Get candidate pitches (chord tones in nearby octaves)
    const candidates: number[] = [];
    for (const ct of targetAnalysis.chordTones) {
      candidates.push((octave - 1) * 12 + ct);
      candidates.push(octave * 12 + ct);
      candidates.push((octave + 1) * 12 + ct);
    }
    
    // Score each candidate
    let bestCandidate = note.pitch;
    let bestScore = Infinity;
    
    for (const candidate of candidates) {
      if (options.octaveRange) {
        if (candidate < options.octaveRange.min || candidate > options.octaveRange.max) {
          continue;
        }
      }
      
      // Voice leading score: prefer small intervals
      const prevPitch = i > 0 ? adaptedNotes[i - 1]!.pitch : note.pitch;
      const interval = Math.abs(candidate - prevPitch);
      const voiceLeadingScore = interval;
      
      // Chord tone match score
      const chordToneScore = targetAnalysis.chordTones.includes(candidate % 12) ? 0 : 5;
      
      // Total score
      const score = voiceLeadingScore * options.voiceLeadingWeight + 
                   chordToneScore * (1 - options.voiceLeadingWeight);
      
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
    
    adaptedNotes.push({
      ...note,
      id: `${note.id}_adapted`,
      pitch: bestCandidate,
      velocity: Math.round(note.velocity * options.velocityScale),
    });
  }
  
  return adaptedNotes;
}

/**
 * Adapt phrase keeping only rhythm (regenerate pitches).
 */
export function adaptByRhythmOnly(
  notes: readonly ScoreNoteInput[],
  _sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: AdaptationOptions
): readonly ScoreNoteInput[] {
  const targetAnalysis = analyzeChord(targetChord);
  
  // Use chord tones for new pitches
  const chordTones = targetAnalysis.chordTones;
  
  // Determine octave range
  const minOctave = options.octaveRange?.min ? Math.floor(options.octaveRange.min / 12) : 4;
  const maxOctave = options.octaveRange?.max ? Math.floor(options.octaveRange.max / 12) : 5;
  
  return notes.map((note, index) => {
    // Cycle through chord tones
    const chordToneIndex = index % chordTones.length;
    const chordTone = chordTones[chordToneIndex]!;
    
    // Choose octave (alternate for variety)
    const octave = minOctave + (index % (maxOctave - minOctave + 1));
    
    const newPitch = octave * 12 + chordTone;
    
    return {
      ...note,
      id: `${note.id}_adapted`,
      pitch: newPitch,
      velocity: Math.round(note.velocity * options.velocityScale),
    };
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find nearest chord tone to a pitch class.
 */
function findNearestChordTone(pitchClass: number, analysis: ChordAnalysis): number {
  let nearest = analysis.chordTones[0]!;
  let minDist = 12;
  
  for (const ct of analysis.chordTones) {
    const dist = Math.min(
      Math.abs(pitchClass - ct),
      Math.abs(pitchClass - ct + 12),
      Math.abs(pitchClass - ct - 12)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = ct;
    }
  }
  
  return nearest;
}

/**
 * Find nearest scale tone to a pitch class.
 */
function findNearestScaleTone(pitchClass: number, analysis: ChordAnalysis): number {
  let nearest = analysis.scaleTones[0]!;
  let minDist = 12;
  
  for (const st of analysis.scaleTones) {
    const dist = Math.min(
      Math.abs(pitchClass - st),
      Math.abs(pitchClass - st + 12),
      Math.abs(pitchClass - st - 12)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = st;
    }
  }
  
  return nearest;
}

// ============================================================================
// MAIN ADAPTER FUNCTION
// ============================================================================

/**
 * Adapt a phrase to a new chord context.
 */
export function adaptPhrase(
  notes: readonly ScoreNoteInput[],
  sourceChord: ChordSymbolInput,
  targetChord: ChordSymbolInput,
  options: Partial<AdaptationOptions> = {}
): readonly ScoreNoteInput[] {
  const fullOptions: AdaptationOptions = {
    ...DEFAULT_ADAPTATION_OPTIONS,
    ...options,
  };
  
  // If same chord, just return with velocity scaling
  if (sourceChord.root === targetChord.root && 
      sourceChord.type === targetChord.type) {
    return notes.map(note => ({
      ...note,
      id: `${note.id}_adapted`,
      velocity: Math.round(note.velocity * fullOptions.velocityScale),
    }));
  }
  
  switch (fullOptions.mode) {
    case 'transpose':
      return adaptByTransposition(notes, sourceChord, targetChord, fullOptions);
    case 'chord-tone':
      return adaptByChordTone(notes, sourceChord, targetChord, fullOptions);
    case 'scale-degree':
      return adaptByScaleDegree(notes, sourceChord, targetChord, fullOptions);
    case 'voice-leading':
      return adaptByVoiceLeading(notes, sourceChord, targetChord, fullOptions);
    case 'rhythm-only':
      return adaptByRhythmOnly(notes, sourceChord, targetChord, fullOptions);
    default:
      return adaptByChordTone(notes, sourceChord, targetChord, fullOptions);
  }
}

// ============================================================================
// PHRASE ADAPTER SERVICE
// ============================================================================

/**
 * Phrase adapter service interface.
 */
export interface PhraseAdapterService {
  /** Adapt phrase to new chord */
  adapt(
    notes: readonly ScoreNoteInput[],
    sourceChord: ChordSymbolInput,
    targetChord: ChordSymbolInput,
    options?: Partial<AdaptationOptions>
  ): readonly ScoreNoteInput[];
  
  /** Analyze a chord */
  analyzeChord(chord: ChordSymbolInput): ChordAnalysis;
  
  /** Analyze a note in chord context */
  analyzeNote(
    pitch: number,
    chord: ChordSymbolInput
  ): NoteAnalysis;
  
  /** Get transposition amount between chords */
  getTransposition(
    source: ChordSymbolInput,
    target: ChordSymbolInput
  ): number;
  
  /** Preview adaptation (returns preview notes) */
  preview(
    notes: readonly ScoreNoteInput[],
    sourceChord: ChordSymbolInput,
    targetChord: ChordSymbolInput,
    mode: AdaptationMode
  ): readonly ScoreNoteInput[];
}

/**
 * Create phrase adapter service.
 */
export function createPhraseAdapterService(): PhraseAdapterService {
  return {
    adapt: adaptPhrase,
    analyzeChord,
    analyzeNote: (pitch, chord) => {
      const analysis = analyzeChord(chord);
      return analyzeNote(pitch % 12, analysis);
    },
    getTransposition: getTranspositionAmount,
    preview: (notes, sourceChord, targetChord, mode) => {
      return adaptPhrase(notes, sourceChord, targetChord, { mode });
    },
  };
}

// ============================================================================
// SINGLETON
// ============================================================================

let phraseAdapterInstance: PhraseAdapterService | null = null;

/**
 * Get phrase adapter service singleton.
 */
export function getPhraseAdapterService(): PhraseAdapterService {
  if (!phraseAdapterInstance) {
    phraseAdapterInstance = createPhraseAdapterService();
  }
  return phraseAdapterInstance;
}

/**
 * Reset phrase adapter service (for testing).
 */
export function resetPhraseAdapterService(): void {
  phraseAdapterInstance = null;
}

// ============================================================================
// BATCH ADAPTATION
// ============================================================================

/**
 * Adapt multiple phrases to a chord progression.
 */
export function adaptPhrasesToProgression(
  phrases: readonly {
    notes: readonly ScoreNoteInput[];
    sourceChord: ChordSymbolInput;
    startTick: Tick;
  }[],
  chordProgression: readonly {
    chord: ChordSymbolInput;
    startTick: Tick;
    endTick: Tick;
  }[],
  options: Partial<AdaptationOptions> = {}
): readonly ScoreNoteInput[] {
  const allNotes: ScoreNoteInput[] = [];
  
  for (const phrase of phrases) {
    // Find the chord at phrase start
    const currentChord = chordProgression.find(
      cp => (cp.startTick as number) <= (phrase.startTick as number) && 
            (cp.endTick as number) > (phrase.startTick as number)
    );
    
    if (currentChord) {
      const adapted = adaptPhrase(
        phrase.notes,
        phrase.sourceChord,
        currentChord.chord,
        options
      );
      
      // Offset notes by phrase start time
      const offsetNotes = adapted.map(note => ({
        ...note,
        startTick: asTick((note.startTick as number) + (phrase.startTick as number)),
      }));
      
      allNotes.push(...offsetNotes);
    } else {
      // No chord at this position, use original notes offset
      const offsetNotes = phrase.notes.map(note => ({
        ...note,
        id: `${note.id}_offset`,
        startTick: asTick((note.startTick as number) + (phrase.startTick as number)),
      }));
      
      allNotes.push(...offsetNotes);
    }
  }
  
  // Sort by start tick
  return allNotes.sort((a, b) => (a.startTick as number) - (b.startTick as number));
}

/**
 * Generate phrase variations.
 */
export function generatePhraseVariation(
  notes: readonly ScoreNoteInput[],
  chord: ChordSymbolInput,
  variationType: 'inversion' | 'octave-shift' | 'embellish' | 'simplify'
): readonly ScoreNoteInput[] {
  const analysis = analyzeChord(chord);
  
  switch (variationType) {
    case 'inversion': {
      // Shift some notes by octave to create different voicing
      return notes.map((note, index) => {
        const shift = index % 2 === 0 ? 12 : 0;
        return {
          ...note,
          id: `${note.id}_inv`,
          pitch: note.pitch + shift,
        };
      });
    }
    
    case 'octave-shift': {
      // Shift entire phrase up or down an octave
      const shift = Math.random() > 0.5 ? 12 : -12;
      return notes.map(note => ({
        ...note,
        id: `${note.id}_oct`,
        pitch: note.pitch + shift,
      }));
    }
    
    case 'embellish': {
      // Add passing tones between notes
      const embellished: ScoreNoteInput[] = [];
      
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]!;
        embellished.push({ ...note, id: `${note.id}_emb` });
        
        // Add passing tone between this and next note
        if (i < notes.length - 1) {
          const nextNote = notes[i + 1]!;
          const interval = nextNote.pitch - note.pitch;
          
          if (Math.abs(interval) > 2) {
            // Add a passing tone
            const passingPitch = note.pitch + Math.sign(interval) * 
              (analysis.scaleTones.includes((note.pitch + 1) % 12) ? 1 : 2);
            
            const noteEnd = (note.startTick as number) + (note.durationTick as number);
            const gap = (nextNote.startTick as number) - noteEnd;
            
            if (gap > 120) { // Only if there's room
              embellished.push({
                ...note,
                id: `${note.id}_pass`,
                startTick: asTick(noteEnd),
                durationTick: asTickDuration(Math.min(gap, note.durationTick as number / 2)),
                pitch: passingPitch,
                velocity: Math.round(note.velocity * 0.7),
              });
            }
          }
        }
      }
      
      return embellished;
    }
    
    case 'simplify': {
      // Remove non-chord tones
      return notes.filter(note => {
        const pitchClass = note.pitch % 12;
        return analysis.chordTones.includes(pitchClass);
      }).map(note => ({
        ...note,
        id: `${note.id}_simp`,
      }));
    }
    
    default:
      return notes;
  }
}
