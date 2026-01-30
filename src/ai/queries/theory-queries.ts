/**
 * @fileoverview Music Theory Query Functions
 * 
 * High-level TypeScript functions for querying the music theory
 * Prolog knowledge base. These provide a friendly API for:
 * - Scale and chord analysis
 * - Chord progression suggestions
 * - Voice leading checks
 * - Transposition
 * - Chord/scale identification
 * 
 * @module @cardplay/ai/queries/theory-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';

// Re-export CadenceType for consumers of this module
export type { CadenceType } from '../theory/music-spec';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Note name (lowercase with 'sharp' or 'flat' suffix).
 */
export type NoteName = 
  | 'c' | 'csharp' | 'd' | 'dsharp' | 'e' | 'f' 
  | 'fsharp' | 'g' | 'gsharp' | 'a' | 'asharp' | 'b'
  | 'dflat' | 'eflat' | 'gflat' | 'aflat' | 'bflat';

/**
 * Scale types supported by the knowledge base.
 */
export type ScaleType =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'pentatonic_major' | 'pentatonic_minor' | 'blues'
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian' 
  | 'mixolydian' | 'aeolian' | 'locrian'
  | 'chromatic' | 'whole_tone';

/**
 * Chord types supported by the knowledge base.
 */
export type ChordType =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'sus2' | 'sus4'
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'half_diminished7'
  | 'major9' | 'minor9' | 'dominant9' | 'add9'
  | 'major11' | 'minor11' | 'dominant11'
  | 'major13' | 'minor13' | 'dominant13';

/**
 * Interval names.
 */
export type IntervalName =
  | 'unison' | 'minor_second' | 'major_second'
  | 'minor_third' | 'major_third'
  | 'perfect_fourth' | 'tritone' | 'perfect_fifth'
  | 'minor_sixth' | 'major_sixth'
  | 'minor_seventh' | 'major_seventh'
  | 'octave';

/**
 * Harmonic function of a chord.
 */
export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant';

/**
 * Chord identification result.
 */
export interface ChordIdentification {
  readonly root: NoteName;
  readonly type: ChordType;
}

/**
 * Scale identification result.
 */
export interface ScaleIdentification {
  readonly root: NoteName;
  readonly type: ScaleType;
}

/**
 * Chord suggestion result.
 */
export interface ChordSuggestion {
  readonly degree: number;
  readonly quality: ChordType;
  readonly root?: NoteName;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure the music theory KB is loaded.
 */
async function ensureLoaded(adapter: PrologAdapter): Promise<void> {
  await loadMusicTheoryKB(adapter);
}

// ============================================================================
// L052: SCALE QUERIES
// ============================================================================

/**
 * Get the notes in a scale.
 * 
 * @example
 * const notes = await getScaleNotes('c', 'major');
 * // ['c', 'd', 'e', 'f', 'g', 'a', 'b']
 */
export async function getScaleNotes(
  root: NoteName,
  scaleType: ScaleType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<NoteName[]> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `scale_notes(${root}, ${scaleType}, Notes).`
  );
  
  if (!result || !result['Notes']) {
    return [];
  }
  
  return result['Notes'] as NoteName[];
}

/**
 * Check if a note is in a scale.
 */
export async function isNoteInScale(
  note: NoteName,
  root: NoteName,
  scaleType: ScaleType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(`in_scale(${note}, ${root}, ${scaleType}).`);
}

// ============================================================================
// L053: CHORD QUERIES
// ============================================================================

/**
 * Get the notes in a chord.
 * 
 * @example
 * const notes = await getChordTones('c', 'major');
 * // ['c', 'e', 'g']
 */
export async function getChordTones(
  root: NoteName,
  chordType: ChordType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<NoteName[]> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `chord_tones(${root}, ${chordType}, Notes).`
  );
  
  if (!result || !result['Notes']) {
    return [];
  }
  
  return result['Notes'] as NoteName[];
}

/**
 * Check if a note is a chord tone.
 */
export async function isChordTone(
  note: NoteName,
  root: NoteName,
  chordType: ChordType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(`chord_tone(${note}, ${root}, ${chordType}).`);
}

// ============================================================================
// L054: CHORD PROGRESSION SUGGESTIONS
// ============================================================================

/**
 * Suggest next chords based on current chord's harmonic function.
 * Returns chords that make harmonic sense as a follow-up.
 * 
 * @example
 * const suggestions = await suggestNextChord(1, 'major');
 * // Suggests chords that follow I chord (tonic -> subdominant or dominant)
 */
export async function suggestNextChord(
  currentDegree: number,
  currentQuality: ChordType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ChordSuggestion[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `suggest_next_chord(${currentDegree}, ${currentQuality}, NextDegree, NextQuality).`
  );
  
  return solutions.map(s => ({
    degree: s['NextDegree'] as number,
    quality: s['NextQuality'] as ChordType,
  }));
}

/**
 * Get the harmonic function of a scale degree.
 */
export async function getHarmonicFunction(
  degree: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<HarmonicFunction | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `harmonic_function(${degree}, Function).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Function'] as HarmonicFunction;
}

/**
 * Get the diatonic chord for a scale degree.
 */
export async function getDiatonicChord(
  scaleType: 'major' | 'natural_minor',
  degree: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ChordType | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `diatonic_chord(${scaleType}, ${degree}, Quality).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Quality'] as ChordType;
}

// ============================================================================
// L055: VOICE LEADING
// ============================================================================

/**
 * Check if two chords have good voice leading (common tones).
 */
export async function checkVoiceLeading(
  root1: NoteName,
  type1: ChordType,
  root2: NoteName,
  type2: ChordType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(
    `good_voice_leading(${root1}, ${type1}, ${root2}, ${type2}).`
  );
}

/**
 * Check if motion between two notes is smooth (≤2 semitones).
 */
export async function isSmoothMotion(
  note1: NoteName,
  note2: NoteName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(`smooth_motion(${note1}, ${note2}).`);
}

// ============================================================================
// L056: TRANSPOSITION
// ============================================================================

/**
 * Transpose a single note by a number of semitones.
 */
export async function transposeNote(
  note: NoteName,
  semitones: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<NoteName | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `transpose(${note}, ${semitones}, Result).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Result'] as NoteName;
}

/**
 * Transpose multiple notes by a number of semitones.
 */
export async function transposeNotes(
  notes: NoteName[],
  semitones: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<NoteName[]> {
  const results = await Promise.all(
    notes.map(note => transposeNote(note, semitones, adapter))
  );
  
  return results.filter((n): n is NoteName => n !== null);
}

// ============================================================================
// L057-L058: IDENTIFICATION
// ============================================================================

/**
 * Identify possible chords from a set of notes.
 * Returns all chord interpretations that match the given notes.
 */
export async function identifyChord(
  notes: NoteName[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ChordIdentification[]> {
  await ensureLoaded(adapter);
  
  const noteList = `[${notes.join(', ')}]`;
  const solutions = await adapter.queryAll(
    `identify_chord(${noteList}, Root, ChordType).`
  );
  
  return solutions.map(s => ({
    root: s['Root'] as NoteName,
    type: s['ChordType'] as ChordType,
  }));
}

/**
 * Identify possible scales that contain all the given notes.
 */
export async function identifyScale(
  notes: NoteName[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ScaleIdentification[]> {
  await ensureLoaded(adapter);
  
  const noteList = `[${notes.join(', ')}]`;
  const solutions = await adapter.queryAll(
    `identify_scale(${noteList}, Root, ScaleType).`
  );
  
  return solutions.map(s => ({
    root: s['Root'] as NoteName,
    type: s['ScaleType'] as ScaleType,
  }));
}

// ============================================================================
// INTERVAL QUERIES
// ============================================================================

/**
 * Get the interval between two notes.
 */
export async function getInterval(
  note1: NoteName,
  note2: NoteName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<IntervalName | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `interval(${note1}, ${note2}, IntervalName).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['IntervalName'] as IntervalName;
}

/**
 * Get the semitone distance between two notes.
 */
export async function getNoteDistance(
  note1: NoteName,
  note2: NoteName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `note_distance(${note1}, ${note2}, Distance).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Distance'] as number;
}

/**
 * Get the inversion of an interval.
 */
export async function invertInterval(
  interval: IntervalName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<IntervalName | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `invert_interval(${interval}, Inverted).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Inverted'] as IntervalName;
}

// ============================================================================
// UTILITY QUERIES
// ============================================================================

/**
 * Check if two notes are enharmonic equivalents.
 */
export async function areEnharmonic(
  note1: NoteName,
  note2: NoteName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(`enharmonic(${note1}, ${note2}).`);
}

/**
 * Get the tension level of a scale degree (0-5, higher = more tension).
 */
export async function getTension(
  degree: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `tension(${degree}, Level).`
  );
  
  if (!result) {
    return null;
  }
  
  return result['Level'] as number;
}

/**
 * Check if a MIDI note is in an instrument's range.
 */
export async function isInInstrumentRange(
  instrument: string,
  midiNote: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureLoaded(adapter);
  return adapter.succeeds(`register_suitable(${instrument}, ${midiNote}).`);
}

/**
 * Get a named chord progression.
 */
export async function getProgression(
  name: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Array<[number, ChordType]> | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `progression(${name}, Steps).`
  );
  
  if (!result || !result['Steps']) {
    return null;
  }
  
  // Steps is a list of [degree, quality] pairs
  const steps = result['Steps'] as Array<{ functor: string; args: [number, string] } | unknown[]>;
  
  return steps.map(step => {
    if (Array.isArray(step)) {
      return [step[0] as number, step[1] as ChordType];
    }
    return [0, 'major' as ChordType]; // fallback
  });
}
