/**
 * @fileoverview Generators Module Index
 * 
 * Exports all Prolog-powered generators for music generation.
 * 
 * L200: Generator module exports
 * 
 * @module @cardplay/ai/generators
 */

// Bass Generator
export {
  BassGenerator,
  createBassGenerator,
  type NoteEvent as BassNoteEvent,
  type ChordInfo as BassChordInfo,
  type BassGeneratorOptions,
  type BassGeneratorResult
} from './bass-generator';

// Melody Generator
export {
  MelodyGenerator,
  createMelodyGenerator,
  type NoteEvent as MelodyNoteEvent,
  type ChordContext as MelodyChordContext,
  type ScaleContext,
  type MelodyGeneratorOptions,
  type MelodyGeneratorResult
} from './melody-generator';

// Drum Generator
export {
  DrumGenerator,
  createDrumGenerator,
  type DrumEvent,
  type DrumInstrument,
  type DrumGeneratorOptions,
  type DrumGeneratorResult
} from './drum-generator';

// Chord Generator
export {
  ChordGenerator,
  createChordGenerator,
  type Chord,
  type KeyContext,
  type ChordGeneratorOptions,
  type ChordGeneratorResult
} from './chord-generator';

// Arpeggio Generator
export {
  ArpeggioGenerator,
  createArpeggioGenerator,
  type NoteEvent as ArpeggioNoteEvent,
  type ChordContext as ArpeggioChordContext,
  type ArpeggioPattern,
  type ArpeggioGeneratorOptions,
  type ArpeggioGeneratorResult
} from './arpeggio-generator';
