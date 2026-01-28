/**
 * @fileoverview Voice module barrel export.
 * 
 * @module @cardplay/core/voices
 */

export {
  // Pitch base
  type Pitch,
  type PitchSystem,
  
  // MIDI Pitch
  type MIDIPitch,
  createMIDIPitch,
  isMIDIPitch,
  
  // Microtonal Pitch
  type MicrotonalPitch,
  createMicrotonalPitch,
  isMicrotonalPitch,
  
  // Just Intonation
  type JustPitch,
  createJustPitch,
  isJustPitch,
  
  // Carnatic Swara
  type Swara,
  type Shruti,
  type SwaraPitch,
  createSwaraPitch,
  isSwaraPitch,
  
  // Arabic Maqam
  type ArabicNote,
  type MaqamPitch,
  createMaqamPitch,
  isMaqamPitch,
  
  // Gamelan
  type Laras,
  type GamelanTone,
  type GamelanPitch,
  createGamelanPitch,
  isGamelanPitch,
  
  // Voice
  Articulation,
  type Envelope,
  type Voice,
  type NotePayload,
  
  // Note Event
  type NoteEvent,
  type CreateNoteOptions,
  createNote,
  
  // Pitch Operations
  pitchToMIDI,
  midiToPitch,
  transposePitch,
  pitchEquals,
  pitchDistance,
  quantizePitch,
  noteToString,
} from './voice';
