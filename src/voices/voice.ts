/**
 * @fileoverview Voice<P> and Pitch System implementation.
 * 
 * Provides a polymorphic pitch system supporting:
 * - Standard MIDI pitch (12-TET)
 * - Microtonal pitch (cents-based)
 * - Just intonation (ratio-based)
 * - Cultural systems (Carnatic swaras, Arabic maqam, Gamelan)
 * 
 * @module @cardplay/core/voices
 */

import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type { EventId, EventMeta, EventKind } from '../types';
import { generateEventId, EventKinds } from '../types';

// ============================================================================
// PITCH BASE INTERFACE
// ============================================================================

/**
 * Base Pitch interface that all pitch systems must implement.
 * Provides universal conversion methods.
 */
export interface Pitch {
  /** Convert to MIDI note number (may be fractional for microtonal) */
  readonly toMIDI: () => number;
  /** Convert to cents from A4 (440Hz) */
  readonly toCents: () => number;
  /** Pitch system identifier */
  readonly system: PitchSystem;
}

/**
 * Supported pitch systems.
 */
export type PitchSystem = 
  | 'midi'
  | 'microtonal'
  | 'just'
  | 'swara'
  | 'maqam'
  | 'gamelan';

// ============================================================================
// MIDI PITCH (12-TET)
// ============================================================================

/**
 * MIDIPitch - Standard 12-tone equal temperament pitch.
 * Branded number type for type safety.
 */
export interface MIDIPitch extends Pitch {
  readonly value: number;
  readonly system: 'midi';
}

/**
 * Creates a MIDIPitch from a MIDI note number (0-127).
 */
export function createMIDIPitch(midiNote: number): MIDIPitch {
  if (midiNote < 0 || midiNote > 127) {
    throw new RangeError(`MIDI note must be 0-127, got ${midiNote}`);
  }
  const value = Math.round(midiNote);
  return {
    value,
    system: 'midi',
    toMIDI: () => value,
    toCents: () => (value - 69) * 100, // A4 = 69
  };
}

/**
 * Type guard for MIDIPitch.
 */
export function isMIDIPitch(pitch: Pitch): pitch is MIDIPitch {
  return pitch.system === 'midi';
}

// ============================================================================
// MICROTONAL PITCH (Cents-based)
// ============================================================================

/**
 * MicrotonalPitch - Pitch specified in cents with a reference.
 * Allows arbitrary tuning systems.
 */
export interface MicrotonalPitch extends Pitch {
  /** Cents offset from reference */
  readonly cents: number;
  /** Reference frequency in Hz (default A4 = 440) */
  readonly reference: number;
  readonly system: 'microtonal';
}

/**
 * Creates a MicrotonalPitch.
 */
export function createMicrotonalPitch(
  cents: number,
  reference: number = 440
): MicrotonalPitch {
  return {
    cents,
    reference,
    system: 'microtonal',
    toMIDI: () => 69 + cents / 100,
    toCents: () => cents,
  };
}

/**
 * Type guard for MicrotonalPitch.
 */
export function isMicrotonalPitch(pitch: Pitch): pitch is MicrotonalPitch {
  return pitch.system === 'microtonal';
}

// ============================================================================
// JUST INTONATION PITCH
// ============================================================================

/**
 * JustPitch - Pitch specified as a ratio.
 * Used for pure intervals and just intonation systems.
 */
export interface JustPitch extends Pitch {
  /** Ratio as [numerator, denominator] */
  readonly ratio: readonly [number, number];
  /** Reference MIDI note for ratio */
  readonly referenceMidi: number;
  readonly system: 'just';
}

/**
 * Creates a JustPitch from a ratio and reference.
 */
export function createJustPitch(
  numerator: number,
  denominator: number,
  referenceMidi: number = 60 // Middle C
): JustPitch {
  const ratio: readonly [number, number] = [numerator, denominator];
  const cents = 1200 * Math.log2(numerator / denominator);
  
  return {
    ratio,
    referenceMidi,
    system: 'just',
    toMIDI: () => referenceMidi + cents / 100,
    toCents: () => (referenceMidi - 69) * 100 + cents,
  };
}

/**
 * Type guard for JustPitch.
 */
export function isJustPitch(pitch: Pitch): pitch is JustPitch {
  return pitch.system === 'just';
}

// ============================================================================
// SWARA PITCH (Carnatic/Hindustani)
// ============================================================================

/**
 * Carnatic/Hindustani swara names.
 */
export type Swara = 'Sa' | 'Ri' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni';

/**
 * Shruti positions (0-22 in Carnatic theory).
 */
export type Shruti = number;

/**
 * SwaraPitch - Pitch in Indian classical music.
 */
export interface SwaraPitch extends Pitch {
  readonly swara: Swara;
  readonly shruti: Shruti;
  /** Raga name for context-dependent intonation */
  readonly raga?: string;
  /** Octave (0 = mandra, 1 = madhya, 2 = tara) */
  readonly octave: number;
  readonly system: 'swara';
}

// Shruti to cents mapping (approximate)
const SHRUTI_TO_CENTS: readonly number[] = [
  0, 90, 112, 182, 204, 294, 316, 386, 408, 498, 520, 590,
  612, 702, 792, 814, 884, 906, 996, 1018, 1088, 1110, 1200,
];

/**
 * Creates a SwaraPitch.
 */
export function createSwaraPitch(
  swara: Swara,
  shruti: Shruti,
  octave: number = 1,
  raga?: string
): SwaraPitch {
  const baseCents = SHRUTI_TO_CENTS[shruti] ?? 0;
  const totalCents = baseCents + (octave - 1) * 1200;
  
  const result: SwaraPitch = {
    swara,
    shruti,
    octave,
    system: 'swara',
    toMIDI: () => 60 + totalCents / 100, // Sa = C4
    toCents: () => (60 - 69) * 100 + totalCents,
  };
  
  if (raga !== undefined) {
    return { ...result, raga };
  }
  return result;
}

/**
 * Type guard for SwaraPitch.
 */
export function isSwaraPitch(pitch: Pitch): pitch is SwaraPitch {
  return pitch.system === 'swara';
}

// ============================================================================
// MAQAM PITCH (Arabic/Turkish)
// ============================================================================

/**
 * Arabic note names.
 */
export type ArabicNote = 
  | 'Rast' | 'Duka' | 'Sika' | 'Jaharka' | 'Nawa' | 'Husayni' | 'Awj' | 'Kirdan';

/**
 * MaqamPitch - Pitch in Arabic maqam system.
 */
export interface MaqamPitch extends Pitch {
  readonly note: ArabicNote;
  /** Quarter-tone adjustment (-1, 0, 1) */
  readonly quarterTone: -1 | 0 | 1;
  /** Maqam name for context */
  readonly maqam?: string;
  readonly octave: number;
  readonly system: 'maqam';
}

// Arabic note to semitone offset from C
const ARABIC_NOTE_SEMITONES: Record<ArabicNote, number> = {
  'Rast': 0,
  'Duka': 2,
  'Sika': 3.5, // Quarter tone
  'Jaharka': 5,
  'Nawa': 7,
  'Husayni': 9,
  'Awj': 10.5, // Quarter tone
  'Kirdan': 12,
};

/**
 * Creates a MaqamPitch.
 */
export function createMaqamPitch(
  note: ArabicNote,
  quarterTone: -1 | 0 | 1 = 0,
  octave: number = 4,
  maqam?: string
): MaqamPitch {
  const baseSemitones = ARABIC_NOTE_SEMITONES[note];
  const totalSemitones = baseSemitones + quarterTone * 0.5 + (octave - 4) * 12;
  
  const result: MaqamPitch = {
    note,
    quarterTone,
    octave,
    system: 'maqam',
    toMIDI: () => 60 + totalSemitones,
    toCents: () => (60 - 69 + totalSemitones) * 100,
  };
  
  if (maqam !== undefined) {
    return { ...result, maqam };
  }
  return result;
}

/**
 * Type guard for MaqamPitch.
 */
export function isMaqamPitch(pitch: Pitch): pitch is MaqamPitch {
  return pitch.system === 'maqam';
}

// ============================================================================
// GAMELAN PITCH
// ============================================================================

/**
 * Javanese gamelan tuning systems.
 */
export type Laras = 'slendro' | 'pelog';

/**
 * Gamelan tone numbers (1-7, with gaps in pelog).
 */
export type GamelanTone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * GamelanPitch - Pitch in Javanese gamelan.
 */
export interface GamelanPitch extends Pitch {
  readonly laras: Laras;
  readonly tone: GamelanTone;
  /** Octave in gamelan (low, mid, high) */
  readonly register: 'low' | 'mid' | 'high';
  readonly system: 'gamelan';
}

// Approximate cents for slendro (5-tone)
const SLENDRO_CENTS: Record<GamelanTone, number> = {
  1: 0,
  2: 240,
  3: 480,
  4: 720, // Not typically used in slendro
  5: 720,
  6: 960,
  7: 1200, // Not typically used
};

// Approximate cents for pelog (7-tone)
const PELOG_CENTS: Record<GamelanTone, number> = {
  1: 0,
  2: 120,
  3: 270,
  4: 540,
  5: 680,
  6: 780,
  7: 1020,
};

/**
 * Creates a GamelanPitch.
 */
export function createGamelanPitch(
  laras: Laras,
  tone: GamelanTone,
  register: 'low' | 'mid' | 'high' = 'mid'
): GamelanPitch {
  const centsMap = laras === 'slendro' ? SLENDRO_CENTS : PELOG_CENTS;
  const baseCents = centsMap[tone];
  const registerOffset = register === 'low' ? -1200 : register === 'high' ? 1200 : 0;
  const totalCents = baseCents + registerOffset;
  
  return {
    laras,
    tone,
    register,
    system: 'gamelan',
    toMIDI: () => 60 + totalCents / 100,
    toCents: () => (60 - 69) * 100 + totalCents,
  };
}

/**
 * Type guard for GamelanPitch.
 */
export function isGamelanPitch(pitch: Pitch): pitch is GamelanPitch {
  return pitch.system === 'gamelan';
}

// ============================================================================
// VOICE<P> - Generic Voice Type
// ============================================================================

/**
 * Articulation styles for note expression.
 */
export enum Articulation {
  Normal = 'normal',
  Legato = 'legato',
  Staccato = 'staccato',
  Staccatissimo = 'staccatissimo',
  Tenuto = 'tenuto',
  Marcato = 'marcato',
  Accent = 'accent',
  Sforzando = 'sforzando',
}

/**
 * ADSR Envelope for per-voice amplitude shaping.
 */
export interface Envelope {
  /** Attack time in ms */
  readonly attack: number;
  /** Decay time in ms */
  readonly decay: number;
  /** Sustain level 0-1 */
  readonly sustain: number;
  /** Release time in ms */
  readonly release: number;
}

/**
 * Voice<P> - A sounding pitch with expression data.
 * Generic over pitch type P for polymorphic pitch systems.
 */
export interface Voice<P extends Pitch> {
  /** The pitch */
  readonly pitch: P;
  /** Velocity 0-127 */
  readonly velocity: number;
  /** MIDI channel 1-16 */
  readonly channel?: number;
  /** Articulation style */
  readonly articulation?: Articulation;
  /** Per-voice envelope override */
  readonly envelope?: Envelope;
}

/**
 * NotePayload<P> - Alias for Voice<P>.
 */
export type NotePayload<P extends Pitch> = Voice<P>;

// ============================================================================
// NOTE EVENT
// ============================================================================

// Note kind is pre-registered in EventKinds

/**
 * NoteEvent<P> - An Event carrying a Voice<P> payload.
 */
export interface NoteEvent<P extends Pitch> {
  readonly id: EventId;
  readonly kind: EventKind;
  readonly start: Tick;
  readonly duration: TickDuration;
  readonly payload: Voice<P>;
  readonly meta?: EventMeta;
}

/**
 * Options for creating a note.
 */
export interface CreateNoteOptions<P extends Pitch> {
  readonly pitch: P;
  readonly start?: Tick | number;
  readonly duration?: TickDuration | number;
  readonly velocity?: number;
  readonly channel?: number;
  readonly articulation?: Articulation;
  readonly envelope?: Envelope;
  readonly meta?: EventMeta;
}

/**
 * Creates a NoteEvent with sensible defaults.
 */
export function createNote<P extends Pitch>(
  options: CreateNoteOptions<P>
): NoteEvent<P> {
  const voice: Voice<P> = {
    pitch: options.pitch,
    velocity: options.velocity ?? 100,
  };
  
  // Add optional properties
  if (options.channel !== undefined) {
    (voice as { channel: number }).channel = options.channel;
  }
  if (options.articulation !== undefined) {
    (voice as { articulation: Articulation }).articulation = options.articulation;
  }
  if (options.envelope !== undefined) {
    (voice as { envelope: Envelope }).envelope = options.envelope;
  }
  
  const note: NoteEvent<P> = {
    id: generateEventId(),
    kind: EventKinds.NOTE,
    start: typeof options.start === 'number' ? asTick(options.start) : (options.start ?? asTick(0)),
    duration: typeof options.duration === 'number' ? asTickDuration(options.duration) : (options.duration ?? asTickDuration(480)),
    payload: voice,
  };
  
  if (options.meta !== undefined) {
    return { ...note, meta: options.meta };
  }
  
  return note;
}

// ============================================================================
// PITCH OPERATIONS
// ============================================================================

/**
 * Universal pitch to MIDI conversion.
 */
export function pitchToMIDI<P extends Pitch>(pitch: P): number {
  return pitch.toMIDI();
}

/**
 * Creates a pitch from MIDI note number.
 * Returns MIDIPitch by default.
 */
export function midiToPitch(midiNote: number): MIDIPitch;
export function midiToPitch<P extends Pitch>(
  midiNote: number,
  system: PitchSystem,
  options?: unknown
): P;
export function midiToPitch(
  midiNote: number,
  system: PitchSystem = 'midi',
  _options?: unknown
): Pitch {
  switch (system) {
    case 'midi':
      return createMIDIPitch(midiNote);
    case 'microtonal':
      return createMicrotonalPitch((midiNote - 69) * 100);
    case 'just':
      // Default to unison ratio at the given MIDI note
      return createJustPitch(1, 1, midiNote);
    default:
      return createMIDIPitch(midiNote);
  }
}

/**
 * Transposes a pitch by a number of semitones.
 */
export function transposePitch<P extends Pitch>(pitch: P, semitones: number): P {
  const currentMidi = pitch.toMIDI();
  const newMidi = currentMidi + semitones;
  
  // For MIDI pitch, recreate with new value
  if (isMIDIPitch(pitch)) {
    return createMIDIPitch(Math.round(newMidi)) as unknown as P;
  }
  
  // For microtonal, adjust cents
  if (isMicrotonalPitch(pitch)) {
    return createMicrotonalPitch(pitch.cents + semitones * 100, pitch.reference) as unknown as P;
  }
  
  // For other systems, convert through MIDI (lossy but functional)
  return createMIDIPitch(Math.round(newMidi)) as unknown as P;
}

/**
 * Checks if two pitches are equal (considering enharmonics for MIDI).
 */
export function pitchEquals<P extends Pitch>(a: P, b: P): boolean {
  // Same system: compare exact values
  if (a.system === b.system) {
    if (isMIDIPitch(a) && isMIDIPitch(b)) {
      return a.value === b.value;
    }
    if (isMicrotonalPitch(a) && isMicrotonalPitch(b)) {
      return Math.abs(a.cents - b.cents) < 0.1;
    }
    if (isJustPitch(a) && isJustPitch(b)) {
      return a.ratio[0] === b.ratio[0] && 
             a.ratio[1] === b.ratio[1] &&
             a.referenceMidi === b.referenceMidi;
    }
  }
  
  // Different systems: compare via cents (with tolerance)
  return Math.abs(a.toCents() - b.toCents()) < 1; // 1 cent tolerance
}

/**
 * Returns the distance between two pitches in cents.
 */
export function pitchDistance<P extends Pitch>(a: P, b: P): number {
  return Math.abs(a.toCents() - b.toCents());
}

/**
 * Quantizes a pitch to the nearest scale degree.
 * @param pitch The pitch to quantize
 * @param scale Array of semitone offsets from root (e.g., [0,2,4,5,7,9,11] for major)
 * @param root The root note as MIDI number (default C = 0)
 */
export function quantizePitch<P extends Pitch>(
  pitch: P,
  scale: readonly number[],
  root: number = 0
): P {
  const midi = pitch.toMIDI();
  const octave = Math.floor(midi / 12);
  const pitchClass = midi - octave * 12;
  const relativePitch = (pitchClass - root + 12) % 12;
  
  // Find nearest scale degree
  let nearestDegree = 0;
  let minDistance = Infinity;
  
  for (const degree of scale) {
    const distance = Math.min(
      Math.abs(relativePitch - degree),
      Math.abs(relativePitch - degree + 12),
      Math.abs(relativePitch - degree - 12)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestDegree = degree;
    }
  }
  
  const quantizedMidi = octave * 12 + root + nearestDegree;
  
  if (isMIDIPitch(pitch)) {
    return createMIDIPitch(quantizedMidi) as unknown as P;
  }
  
  // For other systems, transpose by the difference
  return transposePitch(pitch, quantizedMidi - midi);
}

/**
 * Converts a pitch to a human-readable string.
 */
export function noteToString<P extends Pitch>(pitch: P): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = pitch.toMIDI();
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = Math.round(midi % 12);
  const noteName = noteNames[noteIndex] ?? '?';
  
  if (isMIDIPitch(pitch)) {
    return `${noteName}${octave}`;
  }
  
  if (isMicrotonalPitch(pitch)) {
    const deviation = (midi % 1) * 100;
    if (Math.abs(deviation) > 1) {
      return `${noteName}${octave}${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}¢`;
    }
    return `${noteName}${octave}`;
  }
  
  if (isJustPitch(pitch)) {
    return `${noteName}${octave} (${pitch.ratio[0]}/${pitch.ratio[1]})`;
  }
  
  if (isSwaraPitch(pitch)) {
    return `${pitch.swara}${pitch.octave === 0 ? '.' : pitch.octave === 2 ? '\'' : ''}`;
  }
  
  if (isMaqamPitch(pitch)) {
    const qt = pitch.quarterTone === 1 ? '↑' : pitch.quarterTone === -1 ? '↓' : '';
    return `${pitch.note}${qt}${pitch.octave}`;
  }
  
  if (isGamelanPitch(pitch)) {
    const reg = pitch.register === 'low' ? '.' : pitch.register === 'high' ? '\'' : '';
    return `${pitch.laras.charAt(0).toUpperCase()}${pitch.tone}${reg}`;
  }
  
  return `${noteName}${octave}`;
}
