/**
 * Sample pack system - Built-in and downloadable sample collections
 * 
 * Provides:
 * - Sample pack definitions with metadata
 * - Freesound-based sample acquisition
 * - Pack loading and caching
 * - Attribution and licensing tracking
 * - Pack manager UI integration
 * 
 * @module audio/sample-packs
 */

import { searchFreesoundSamples, fetchFreesoundSample } from '../cards/drum-machine';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample pack category
 */
export type SamplePackCategory =
  | 'drums'
  | 'synth'
  | 'bass'
  | 'melodic'
  | 'vocal'
  | 'fx'
  | 'orchestral'
  | 'world'
  | 'foley';

/**
 * Individual sample within a pack
 */
export interface PackSample {
  readonly id: string;
  readonly name: string;
  readonly note?: string; // MIDI note name (e.g., "C3", "Kick")
  readonly midiNote?: number; // MIDI note number
  readonly tags: readonly string[];
  readonly freesoundId?: number;
  readonly freesoundQuery?: string;
  buffer?: AudioBuffer;
}

/**
 * Sample pack definition
 */
export interface SamplePack {
  readonly id: string;
  readonly name: string;
  readonly category: SamplePackCategory;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  readonly license: string;
  readonly sampleCount: number;
  readonly samples: readonly PackSample[];
  readonly tags: readonly string[];
  readonly icon: string; // emoji icon
  readonly freesoundAttribution: readonly FreesoundAttribution[];
}

/**
 * Attribution for Freesound samples
 */
export interface FreesoundAttribution {
  readonly sampleId: number;
  readonly name: string;
  readonly username: string;
  readonly url: string;
  readonly license: string;
}

/**
 * Pack loading status
 */
export interface PackLoadStatus {
  readonly packId: string;
  loaded: number;
  readonly total: number;
  progress: number; // 0-1
  status: 'idle' | 'loading' | 'complete' | 'error';
  readonly error?: string;
}

// ============================================================================
// 808 DRUMS PACK (50 SAMPLES)
// ============================================================================

/**
 * Roland TR-808 inspired drum samples from Freesound
 */
export const PACK_808_DRUMS: SamplePack = {
  id: '808-drums',
  name: '808 Drums',
  category: 'drums',
  description: 'Classic TR-808 drum machine sounds with punch and character',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 50,
  icon: '🥁',
  tags: ['808', 'drums', 'electronic', 'trap', 'hip-hop'],
  samples: [
    // Kick drums (10 variations)
    { id: '808-kick-01', name: '808 Kick Deep', note: 'C1', midiNote: 36, freesoundQuery: '808 kick deep bass', tags: ['kick', '808', 'bass'] },
    { id: '808-kick-02', name: '808 Kick Punchy', note: 'C#1', midiNote: 37, freesoundQuery: '808 kick punchy', tags: ['kick', '808', 'punchy'] },
    { id: '808-kick-03', name: '808 Kick Sub', note: 'D1', midiNote: 38, freesoundQuery: '808 kick sub bass', tags: ['kick', '808', 'sub'] },
    { id: '808-kick-04', name: '808 Kick Long', note: 'D#1', midiNote: 39, freesoundQuery: '808 kick long tail', tags: ['kick', '808', 'long'] },
    { id: '808-kick-05', name: '808 Kick Short', note: 'E1', midiNote: 40, freesoundQuery: '808 kick short tight', tags: ['kick', '808', 'short'] },
    { id: '808-kick-06', name: '808 Kick Distorted', note: 'F1', midiNote: 41, freesoundQuery: '808 kick distorted', tags: ['kick', '808', 'distorted'] },
    { id: '808-kick-07', name: '808 Kick Tuned', note: 'F#1', midiNote: 42, freesoundQuery: '808 kick tuned', tags: ['kick', '808', 'tuned'] },
    { id: '808-kick-08', name: '808 Kick Hard', note: 'G1', midiNote: 43, freesoundQuery: '808 kick hard attack', tags: ['kick', '808', 'hard'] },
    { id: '808-kick-09', name: '808 Kick Soft', note: 'G#1', midiNote: 44, freesoundQuery: '808 kick soft', tags: ['kick', '808', 'soft'] },
    { id: '808-kick-10', name: '808 Kick Boomy', note: 'A1', midiNote: 45, freesoundQuery: '808 kick boomy', tags: ['kick', '808', 'boomy'] },

    // Snare drums (10 variations)
    { id: '808-snare-01', name: '808 Snare Classic', note: 'D2', midiNote: 50, freesoundQuery: '808 snare classic', tags: ['snare', '808', 'classic'] },
    { id: '808-snare-02', name: '808 Snare Tight', note: 'D#2', midiNote: 51, freesoundQuery: '808 snare tight', tags: ['snare', '808', 'tight'] },
    { id: '808-snare-03', name: '808 Snare Clap', note: 'E2', midiNote: 52, freesoundQuery: '808 snare clap', tags: ['snare', '808', 'clap'] },
    { id: '808-snare-04', name: '808 Snare Rim', note: 'F2', midiNote: 53, freesoundQuery: '808 snare rimshot', tags: ['snare', '808', 'rim'] },
    { id: '808-snare-05', name: '808 Snare Long', note: 'F#2', midiNote: 54, freesoundQuery: '808 snare long decay', tags: ['snare', '808', 'long'] },
    { id: '808-snare-06', name: '808 Snare Short', note: 'G2', midiNote: 55, freesoundQuery: '808 snare short', tags: ['snare', '808', 'short'] },
    { id: '808-snare-07', name: '808 Snare Pitch Up', note: 'G#2', midiNote: 56, freesoundQuery: '808 snare high pitch', tags: ['snare', '808', 'pitch'] },
    { id: '808-snare-08', name: '808 Snare Pitch Down', note: 'A2', midiNote: 57, freesoundQuery: '808 snare low pitch', tags: ['snare', '808', 'pitch'] },
    { id: '808-snare-09', name: '808 Snare Noisy', note: 'A#2', midiNote: 58, freesoundQuery: '808 snare noisy', tags: ['snare', '808', 'noisy'] },
    { id: '808-snare-10', name: '808 Snare Clean', note: 'B2', midiNote: 59, freesoundQuery: '808 snare clean', tags: ['snare', '808', 'clean'] },

    // Hi-hats (10 variations)
    { id: '808-hat-closed-01', name: '808 Hat Closed', note: 'F#3', midiNote: 66, freesoundQuery: '808 closed hi-hat', tags: ['hihat', '808', 'closed'] },
    { id: '808-hat-closed-02', name: '808 Hat Closed Tight', note: 'G3', midiNote: 67, freesoundQuery: '808 hi-hat closed tight', tags: ['hihat', '808', 'closed'] },
    { id: '808-hat-open-01', name: '808 Hat Open', note: 'G#3', midiNote: 68, freesoundQuery: '808 open hi-hat', tags: ['hihat', '808', 'open'] },
    { id: '808-hat-open-02', name: '808 Hat Open Long', note: 'A3', midiNote: 69, freesoundQuery: '808 hi-hat open long', tags: ['hihat', '808', 'open'] },
    { id: '808-hat-pedal', name: '808 Hat Pedal', note: 'A#3', midiNote: 70, freesoundQuery: '808 hi-hat pedal', tags: ['hihat', '808', 'pedal'] },
    { id: '808-hat-half-open', name: '808 Hat Half Open', note: 'B3', midiNote: 71, freesoundQuery: '808 hi-hat half open', tags: ['hihat', '808', 'half'] },
    { id: '808-hat-closed-03', name: '808 Hat Closed Metallic', note: 'C4', midiNote: 72, freesoundQuery: '808 hi-hat metallic', tags: ['hihat', '808', 'metallic'] },
    { id: '808-hat-closed-04', name: '808 Hat Closed Dark', note: 'C#4', midiNote: 73, freesoundQuery: '808 hi-hat dark', tags: ['hihat', '808', 'dark'] },
    { id: '808-hat-open-03', name: '808 Hat Open Bright', note: 'D4', midiNote: 74, freesoundQuery: '808 hi-hat bright', tags: ['hihat', '808', 'bright'] },
    { id: '808-hat-open-04', name: '808 Hat Open Sizzle', note: 'D#4', midiNote: 75, freesoundQuery: '808 hi-hat sizzle', tags: ['hihat', '808', 'sizzle'] },

    // Toms (5 variations)
    { id: '808-tom-low', name: '808 Tom Low', note: 'C2', midiNote: 48, freesoundQuery: '808 tom low', tags: ['tom', '808', 'low'] },
    { id: '808-tom-mid', name: '808 Tom Mid', note: 'C#2', midiNote: 49, freesoundQuery: '808 tom mid', tags: ['tom', '808', 'mid'] },
    { id: '808-tom-high', name: '808 Tom High', note: 'F2', midiNote: 53, freesoundQuery: '808 tom high', tags: ['tom', '808', 'high'] },
    { id: '808-tom-floor', name: '808 Tom Floor', note: 'A1', midiNote: 45, freesoundQuery: '808 floor tom', tags: ['tom', '808', 'floor'] },
    { id: '808-tom-tuned', name: '808 Tom Tuned', note: 'B1', midiNote: 47, freesoundQuery: '808 tom tuned', tags: ['tom', '808', 'tuned'] },

    // Cymbals (5 variations)
    { id: '808-cymbal-crash', name: '808 Crash Cymbal', note: 'C#5', midiNote: 85, freesoundQuery: '808 crash cymbal', tags: ['cymbal', '808', 'crash'] },
    { id: '808-cymbal-ride', name: '808 Ride Cymbal', note: 'D5', midiNote: 86, freesoundQuery: '808 ride cymbal', tags: ['cymbal', '808', 'ride'] },
    { id: '808-cymbal-splash', name: '808 Splash Cymbal', note: 'D#5', midiNote: 87, freesoundQuery: '808 splash cymbal', tags: ['cymbal', '808', 'splash'] },
    { id: '808-cymbal-china', name: '808 China Cymbal', note: 'E5', midiNote: 88, freesoundQuery: '808 china cymbal', tags: ['cymbal', '808', 'china'] },
    { id: '808-cymbal-reverse', name: '808 Reverse Cymbal', note: 'F5', midiNote: 89, freesoundQuery: '808 reverse cymbal', tags: ['cymbal', '808', 'reverse'] },

    // Percussion (10 variations)
    { id: '808-clap', name: '808 Handclap', note: 'E3', midiNote: 64, freesoundQuery: '808 handclap', tags: ['clap', '808', 'percussion'] },
    { id: '808-cowbell', name: '808 Cowbell', note: 'G#4', midiNote: 80, freesoundQuery: '808 cowbell', tags: ['cowbell', '808', 'percussion'] },
    { id: '808-conga-high', name: '808 Conga High', note: 'C3', midiNote: 60, freesoundQuery: '808 conga high', tags: ['conga', '808', 'percussion'] },
    { id: '808-conga-mid', name: '808 Conga Mid', note: 'C#3', midiNote: 61, freesoundQuery: '808 conga mid', tags: ['conga', '808', 'percussion'] },
    { id: '808-conga-low', name: '808 Conga Low', note: 'D3', midiNote: 62, freesoundQuery: '808 conga low', tags: ['conga', '808', 'percussion'] },
    { id: '808-maracas', name: '808 Maracas', note: 'A4', midiNote: 81, freesoundQuery: '808 maracas', tags: ['maracas', '808', 'percussion'] },
    { id: '808-claves', name: '808 Claves', note: 'A#4', midiNote: 82, freesoundQuery: '808 claves', tags: ['claves', '808', 'percussion'] },
    { id: '808-rimshot', name: '808 Rimshot', note: 'D#3', midiNote: 63, freesoundQuery: '808 rimshot', tags: ['rimshot', '808', 'percussion'] },
    { id: '808-tambourine', name: '808 Tambourine', note: 'F#4', midiNote: 78, freesoundQuery: '808 tambourine', tags: ['tambourine', '808', 'percussion'] },
    { id: '808-woodblock', name: '808 Woodblock', note: 'B4', midiNote: 83, freesoundQuery: '808 woodblock', tags: ['woodblock', '808', 'percussion'] },
  ],
  freesoundAttribution: [], // Will be populated when samples are loaded
};

// ============================================================================
// TRAP DRUMS PACK (50 SAMPLES)
// ============================================================================

/**
 * Modern trap/hip-hop drum samples with heavy 808s and crisp hi-hats
 */
export const PACK_TRAP_DRUMS: SamplePack = {
  id: 'trap-drums',
  name: 'Trap Drums',
  category: 'drums',
  description: 'Modern trap and hip-hop drums with thundering 808s and rapid hi-hats',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 50,
  icon: '🔥',
  tags: ['trap', 'drums', 'hip-hop', '808', 'drill'],
  samples: [
    // 808 Bass Kicks (12 variations - the cornerstone of trap)
    { id: 'trap-808-01', name: 'Trap 808 Sub', note: 'C1', midiNote: 36, freesoundQuery: 'trap 808 bass sub long', tags: ['808', 'bass', 'sub', 'trap'] },
    { id: 'trap-808-02', name: 'Trap 808 Hard', note: 'C#1', midiNote: 37, freesoundQuery: 'trap 808 bass hard', tags: ['808', 'bass', 'hard', 'trap'] },
    { id: 'trap-808-03', name: 'Trap 808 Distorted', note: 'D1', midiNote: 38, freesoundQuery: 'trap 808 distorted', tags: ['808', 'bass', 'distorted', 'trap'] },
    { id: 'trap-808-04', name: 'Trap 808 Tuned Low', note: 'D#1', midiNote: 39, freesoundQuery: 'trap 808 bass low tuned', tags: ['808', 'bass', 'tuned', 'trap'] },
    { id: 'trap-808-05', name: 'Trap 808 Tuned Mid', note: 'E1', midiNote: 40, freesoundQuery: 'trap 808 bass mid tuned', tags: ['808', 'bass', 'tuned', 'trap'] },
    { id: 'trap-808-06', name: 'Trap 808 Punchy', note: 'F1', midiNote: 41, freesoundQuery: 'trap 808 punchy attack', tags: ['808', 'bass', 'punchy', 'trap'] },
    { id: 'trap-808-07', name: 'Trap 808 Slide', note: 'F#1', midiNote: 42, freesoundQuery: 'trap 808 slide glide', tags: ['808', 'bass', 'slide', 'trap'] },
    { id: 'trap-808-08', name: 'Trap 808 Crispy', note: 'G1', midiNote: 43, freesoundQuery: 'trap 808 crispy', tags: ['808', 'bass', 'crispy', 'trap'] },
    { id: 'trap-808-09', name: 'Trap 808 Deep', note: 'G#1', midiNote: 44, freesoundQuery: 'trap 808 deep sub bass', tags: ['808', 'bass', 'deep', 'trap'] },
    { id: 'trap-808-10', name: 'Trap 808 Short', note: 'A1', midiNote: 45, freesoundQuery: 'trap 808 short tight', tags: ['808', 'bass', 'short', 'trap'] },
    { id: 'trap-808-11', name: 'Trap 808 Boom', note: 'A#1', midiNote: 46, freesoundQuery: 'trap 808 boom', tags: ['808', 'bass', 'boom', 'trap'] },
    { id: 'trap-808-12', name: 'Trap 808 Drill', note: 'B1', midiNote: 47, freesoundQuery: 'drill 808 bass', tags: ['808', 'bass', 'drill', 'trap'] },

    // Kicks (8 variations - acoustic-style)
    { id: 'trap-kick-01', name: 'Trap Kick Hard', note: 'C2', midiNote: 48, freesoundQuery: 'trap kick hard', tags: ['kick', 'hard', 'trap'] },
    { id: 'trap-kick-02', name: 'Trap Kick Punchy', note: 'C#2', midiNote: 49, freesoundQuery: 'trap kick punchy', tags: ['kick', 'punchy', 'trap'] },
    { id: 'trap-kick-03', name: 'Trap Kick Layered', note: 'D2', midiNote: 50, freesoundQuery: 'trap kick layered', tags: ['kick', 'layered', 'trap'] },
    { id: 'trap-kick-04', name: 'Trap Kick Sub', note: 'D#2', midiNote: 51, freesoundQuery: 'trap kick sub bass', tags: ['kick', 'sub', 'trap'] },
    { id: 'trap-kick-05', name: 'Trap Kick Distorted', note: 'E2', midiNote: 52, freesoundQuery: 'trap kick distorted', tags: ['kick', 'distorted', 'trap'] },
    { id: 'trap-kick-06', name: 'Trap Kick Clicky', note: 'F2', midiNote: 53, freesoundQuery: 'trap kick clicky', tags: ['kick', 'clicky', 'trap'] },
    { id: 'trap-kick-07', name: 'Trap Kick Deep', note: 'F#2', midiNote: 54, freesoundQuery: 'trap kick deep', tags: ['kick', 'deep', 'trap'] },
    { id: 'trap-kick-08', name: 'Trap Kick Drill', note: 'G2', midiNote: 55, freesoundQuery: 'drill kick', tags: ['kick', 'drill', 'trap'] },

    // Snares (8 variations)
    { id: 'trap-snare-01', name: 'Trap Snare Hard', note: 'G#2', midiNote: 56, freesoundQuery: 'trap snare hard', tags: ['snare', 'hard', 'trap'] },
    { id: 'trap-snare-02', name: 'Trap Snare Tight', note: 'A2', midiNote: 57, freesoundQuery: 'trap snare tight', tags: ['snare', 'tight', 'trap'] },
    { id: 'trap-snare-03', name: 'Trap Snare Clap', note: 'A#2', midiNote: 58, freesoundQuery: 'trap snare clap', tags: ['snare', 'clap', 'trap'] },
    { id: 'trap-snare-04', name: 'Trap Snare Rim', note: 'B2', midiNote: 59, freesoundQuery: 'trap snare rimshot', tags: ['snare', 'rim', 'trap'] },
    { id: 'trap-snare-05', name: 'Trap Snare Crispy', note: 'C3', midiNote: 60, freesoundQuery: 'trap snare crispy', tags: ['snare', 'crispy', 'trap'] },
    { id: 'trap-snare-06', name: 'Trap Snare Layered', note: 'C#3', midiNote: 61, freesoundQuery: 'trap snare layered', tags: ['snare', 'layered', 'trap'] },
    { id: 'trap-snare-07', name: 'Trap Snare Pop', note: 'D3', midiNote: 62, freesoundQuery: 'trap snare pop', tags: ['snare', 'pop', 'trap'] },
    { id: 'trap-snare-08', name: 'Trap Snare Drill', note: 'D#3', midiNote: 63, freesoundQuery: 'drill snare', tags: ['snare', 'drill', 'trap'] },

    // Hi-Hats (12 variations - essential for trap)
    { id: 'trap-hat-closed-01', name: 'Trap Hat Closed', note: 'E3', midiNote: 64, freesoundQuery: 'trap hi-hat closed', tags: ['hihat', 'closed', 'trap'] },
    { id: 'trap-hat-closed-02', name: 'Trap Hat Closed Tight', note: 'F3', midiNote: 65, freesoundQuery: 'trap hi-hat closed tight', tags: ['hihat', 'closed', 'trap'] },
    { id: 'trap-hat-closed-03', name: 'Trap Hat Closed Hard', note: 'F#3', midiNote: 66, freesoundQuery: 'trap hi-hat closed hard', tags: ['hihat', 'closed', 'trap'] },
    { id: 'trap-hat-open-01', name: 'Trap Hat Open', note: 'G3', midiNote: 67, freesoundQuery: 'trap hi-hat open', tags: ['hihat', 'open', 'trap'] },
    { id: 'trap-hat-open-02', name: 'Trap Hat Open Long', note: 'G#3', midiNote: 68, freesoundQuery: 'trap hi-hat open long', tags: ['hihat', 'open', 'trap'] },
    { id: 'trap-hat-roll', name: 'Trap Hat Roll', note: 'A3', midiNote: 69, freesoundQuery: 'trap hi-hat roll', tags: ['hihat', 'roll', 'trap'] },
    { id: 'trap-hat-triplet', name: 'Trap Hat Triplet', note: 'A#3', midiNote: 70, freesoundQuery: 'trap hi-hat triplet', tags: ['hihat', 'triplet', 'trap'] },
    { id: 'trap-hat-pedal', name: 'Trap Hat Pedal', note: 'B3', midiNote: 71, freesoundQuery: 'trap hi-hat pedal', tags: ['hihat', 'pedal', 'trap'] },
    { id: 'trap-hat-metallic', name: 'Trap Hat Metallic', note: 'C4', midiNote: 72, freesoundQuery: 'trap hi-hat metallic', tags: ['hihat', 'metallic', 'trap'] },
    { id: 'trap-hat-drill', name: 'Drill Hat', note: 'C#4', midiNote: 73, freesoundQuery: 'drill hi-hat', tags: ['hihat', 'drill', 'trap'] },
    { id: 'trap-hat-closed-04', name: 'Trap Hat Closed Crispy', note: 'D4', midiNote: 74, freesoundQuery: 'trap hi-hat crispy', tags: ['hihat', 'closed', 'trap'] },
    { id: 'trap-hat-open-03', name: 'Trap Hat Open Bright', note: 'D#4', midiNote: 75, freesoundQuery: 'trap hi-hat bright', tags: ['hihat', 'open', 'trap'] },

    // Percussion & FX (10 variations)
    { id: 'trap-clap-01', name: 'Trap Clap', note: 'E4', midiNote: 76, freesoundQuery: 'trap clap', tags: ['clap', 'trap'] },
    { id: 'trap-clap-02', name: 'Trap Clap Layered', note: 'F4', midiNote: 77, freesoundQuery: 'trap clap layered', tags: ['clap', 'layered', 'trap'] },
    { id: 'trap-rim', name: 'Trap Rimshot', note: 'F#4', midiNote: 78, freesoundQuery: 'trap rimshot', tags: ['rim', 'trap'] },
    { id: 'trap-perc-01', name: 'Trap Percussion 1', note: 'G4', midiNote: 79, freesoundQuery: 'trap percussion hit', tags: ['percussion', 'trap'] },
    { id: 'trap-perc-02', name: 'Trap Percussion 2', note: 'G#4', midiNote: 80, freesoundQuery: 'trap shaker', tags: ['percussion', 'shaker', 'trap'] },
    { id: 'trap-snap', name: 'Trap Snap', note: 'A4', midiNote: 81, freesoundQuery: 'trap snap finger', tags: ['snap', 'trap'] },
    { id: 'trap-cowbell', name: 'Trap Cowbell', note: 'A#4', midiNote: 82, freesoundQuery: 'trap cowbell', tags: ['cowbell', 'trap'] },
    { id: 'trap-riser', name: 'Trap Riser', note: 'B4', midiNote: 83, freesoundQuery: 'trap riser fx', tags: ['riser', 'fx', 'trap'] },
    { id: 'trap-downlifter', name: 'Trap Downlifter', note: 'C5', midiNote: 84, freesoundQuery: 'trap downlifter fx', tags: ['downlifter', 'fx', 'trap'] },
    { id: 'trap-impact', name: 'Trap Impact', note: 'C#5', midiNote: 85, freesoundQuery: 'trap impact hit', tags: ['impact', 'fx', 'trap'] },
  ],
  freesoundAttribution: [], // Will be populated when samples are loaded
};

// ============================================================================
// ACOUSTIC DRUMS PACK (50 SAMPLES)
// ============================================================================

/**
 * Natural acoustic drum kit samples with realistic dynamics
 */
export const PACK_ACOUSTIC_DRUMS: SamplePack = {
  id: 'acoustic-drums',
  name: 'Acoustic Drums',
  category: 'drums',
  description: 'Natural acoustic drum kit with multi-velocity layers and realistic room ambience',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 50,
  icon: '🎸',
  tags: ['acoustic', 'drums', 'natural', 'rock', 'jazz'],
  samples: [
    // Kick drums (8 variations)
    { id: 'acoustic-kick-01', name: 'Acoustic Kick Soft', note: 'C1', midiNote: 36, freesoundQuery: 'acoustic kick drum soft', tags: ['kick', 'acoustic', 'soft'] },
    { id: 'acoustic-kick-02', name: 'Acoustic Kick Medium', note: 'C#1', midiNote: 37, freesoundQuery: 'acoustic kick drum medium', tags: ['kick', 'acoustic', 'medium'] },
    { id: 'acoustic-kick-03', name: 'Acoustic Kick Hard', note: 'D1', midiNote: 38, freesoundQuery: 'acoustic kick drum hard', tags: ['kick', 'acoustic', 'hard'] },
    { id: 'acoustic-kick-04', name: 'Acoustic Kick Jazz', note: 'D#1', midiNote: 39, freesoundQuery: 'jazz kick drum', tags: ['kick', 'acoustic', 'jazz'] },
    { id: 'acoustic-kick-05', name: 'Acoustic Kick Rock', note: 'E1', midiNote: 40, freesoundQuery: 'rock kick drum', tags: ['kick', 'acoustic', 'rock'] },
    { id: 'acoustic-kick-06', name: 'Acoustic Kick Deep', note: 'F1', midiNote: 41, freesoundQuery: 'acoustic kick drum deep', tags: ['kick', 'acoustic', 'deep'] },
    { id: 'acoustic-kick-07', name: 'Acoustic Kick Tight', note: 'F#1', midiNote: 42, freesoundQuery: 'acoustic kick drum tight', tags: ['kick', 'acoustic', 'tight'] },
    { id: 'acoustic-kick-08', name: 'Acoustic Kick Vintage', note: 'G1', midiNote: 43, freesoundQuery: 'vintage acoustic kick', tags: ['kick', 'acoustic', 'vintage'] },

    // Snare drums (10 variations)
    { id: 'acoustic-snare-01', name: 'Acoustic Snare Center Soft', note: 'D2', midiNote: 50, freesoundQuery: 'acoustic snare center soft', tags: ['snare', 'acoustic', 'soft'] },
    { id: 'acoustic-snare-02', name: 'Acoustic Snare Center Medium', note: 'D#2', midiNote: 51, freesoundQuery: 'acoustic snare center medium', tags: ['snare', 'acoustic', 'medium'] },
    { id: 'acoustic-snare-03', name: 'Acoustic Snare Center Hard', note: 'E2', midiNote: 52, freesoundQuery: 'acoustic snare center hard', tags: ['snare', 'acoustic', 'hard'] },
    { id: 'acoustic-snare-04', name: 'Acoustic Snare Rim', note: 'F2', midiNote: 53, freesoundQuery: 'acoustic snare rimshot', tags: ['snare', 'acoustic', 'rim'] },
    { id: 'acoustic-snare-05', name: 'Acoustic Snare Side Stick', note: 'F#2', midiNote: 54, freesoundQuery: 'acoustic snare side stick', tags: ['snare', 'acoustic', 'sidestick'] },
    { id: 'acoustic-snare-06', name: 'Acoustic Snare Jazz', note: 'G2', midiNote: 55, freesoundQuery: 'jazz snare drum', tags: ['snare', 'acoustic', 'jazz'] },
    { id: 'acoustic-snare-07', name: 'Acoustic Snare Rock', note: 'G#2', midiNote: 56, freesoundQuery: 'rock snare drum', tags: ['snare', 'acoustic', 'rock'] },
    { id: 'acoustic-snare-08', name: 'Acoustic Snare Brush Soft', note: 'A2', midiNote: 57, freesoundQuery: 'snare brush soft', tags: ['snare', 'acoustic', 'brush'] },
    { id: 'acoustic-snare-09', name: 'Acoustic Snare Brush Swirl', note: 'A#2', midiNote: 58, freesoundQuery: 'snare brush swirl', tags: ['snare', 'acoustic', 'brush'] },
    { id: 'acoustic-snare-10', name: 'Acoustic Snare Ghost Note', note: 'B2', midiNote: 59, freesoundQuery: 'snare ghost note', tags: ['snare', 'acoustic', 'ghost'] },

    // Hi-hats (10 variations)
    { id: 'acoustic-hat-closed-01', name: 'Acoustic Hat Closed Soft', note: 'F#3', midiNote: 66, freesoundQuery: 'acoustic hi-hat closed soft', tags: ['hihat', 'acoustic', 'closed', 'soft'] },
    { id: 'acoustic-hat-closed-02', name: 'Acoustic Hat Closed Medium', note: 'G3', midiNote: 67, freesoundQuery: 'acoustic hi-hat closed medium', tags: ['hihat', 'acoustic', 'closed', 'medium'] },
    { id: 'acoustic-hat-closed-03', name: 'Acoustic Hat Closed Hard', note: 'G#3', midiNote: 68, freesoundQuery: 'acoustic hi-hat closed hard', tags: ['hihat', 'acoustic', 'closed', 'hard'] },
    { id: 'acoustic-hat-open-01', name: 'Acoustic Hat Open Soft', note: 'A3', midiNote: 69, freesoundQuery: 'acoustic hi-hat open soft', tags: ['hihat', 'acoustic', 'open', 'soft'] },
    { id: 'acoustic-hat-open-02', name: 'Acoustic Hat Open Medium', note: 'A#3', midiNote: 70, freesoundQuery: 'acoustic hi-hat open medium', tags: ['hihat', 'acoustic', 'open', 'medium'] },
    { id: 'acoustic-hat-open-03', name: 'Acoustic Hat Open Hard', note: 'B3', midiNote: 71, freesoundQuery: 'acoustic hi-hat open hard', tags: ['hihat', 'acoustic', 'open', 'hard'] },
    { id: 'acoustic-hat-pedal-01', name: 'Acoustic Hat Pedal', note: 'C4', midiNote: 72, freesoundQuery: 'acoustic hi-hat pedal', tags: ['hihat', 'acoustic', 'pedal'] },
    { id: 'acoustic-hat-half-open', name: 'Acoustic Hat Half Open', note: 'C#4', midiNote: 73, freesoundQuery: 'acoustic hi-hat half open', tags: ['hihat', 'acoustic', 'half'] },
    { id: 'acoustic-hat-edge', name: 'Acoustic Hat Edge', note: 'D4', midiNote: 74, freesoundQuery: 'acoustic hi-hat edge', tags: ['hihat', 'acoustic', 'edge'] },
    { id: 'acoustic-hat-bell', name: 'Acoustic Hat Bell', note: 'D#4', midiNote: 75, freesoundQuery: 'acoustic hi-hat bell', tags: ['hihat', 'acoustic', 'bell'] },

    // Toms (8 variations)
    { id: 'acoustic-tom-floor', name: 'Acoustic Tom Floor', note: 'A1', midiNote: 45, freesoundQuery: 'acoustic floor tom', tags: ['tom', 'acoustic', 'floor'] },
    { id: 'acoustic-tom-low', name: 'Acoustic Tom Low', note: 'B1', midiNote: 47, freesoundQuery: 'acoustic low tom', tags: ['tom', 'acoustic', 'low'] },
    { id: 'acoustic-tom-mid-low', name: 'Acoustic Tom Mid Low', note: 'C2', midiNote: 48, freesoundQuery: 'acoustic mid low tom', tags: ['tom', 'acoustic', 'mid'] },
    { id: 'acoustic-tom-mid-high', name: 'Acoustic Tom Mid High', note: 'C#2', midiNote: 49, freesoundQuery: 'acoustic mid high tom', tags: ['tom', 'acoustic', 'mid'] },
    { id: 'acoustic-tom-high', name: 'Acoustic Tom High', note: 'E3', midiNote: 64, freesoundQuery: 'acoustic high tom', tags: ['tom', 'acoustic', 'high'] },
    { id: 'acoustic-tom-rack-01', name: 'Acoustic Rack Tom 1', note: 'G#1', midiNote: 44, freesoundQuery: 'acoustic rack tom', tags: ['tom', 'acoustic', 'rack'] },
    { id: 'acoustic-tom-rack-02', name: 'Acoustic Rack Tom 2', note: 'D3', midiNote: 62, freesoundQuery: 'acoustic rack tom high', tags: ['tom', 'acoustic', 'rack'] },
    { id: 'acoustic-tom-roto', name: 'Acoustic Rototom', note: 'D#3', midiNote: 63, freesoundQuery: 'rototom', tags: ['tom', 'acoustic', 'roto'] },

    // Cymbals (10 variations)
    { id: 'acoustic-crash-01', name: 'Acoustic Crash 1', note: 'C#5', midiNote: 85, freesoundQuery: 'acoustic crash cymbal', tags: ['cymbal', 'acoustic', 'crash'] },
    { id: 'acoustic-crash-02', name: 'Acoustic Crash 2', note: 'D5', midiNote: 86, freesoundQuery: 'acoustic crash cymbal bright', tags: ['cymbal', 'acoustic', 'crash'] },
    { id: 'acoustic-ride-01', name: 'Acoustic Ride Bow', note: 'D#5', midiNote: 87, freesoundQuery: 'acoustic ride cymbal bow', tags: ['cymbal', 'acoustic', 'ride'] },
    { id: 'acoustic-ride-02', name: 'Acoustic Ride Bell', note: 'E5', midiNote: 88, freesoundQuery: 'acoustic ride cymbal bell', tags: ['cymbal', 'acoustic', 'ride'] },
    { id: 'acoustic-ride-03', name: 'Acoustic Ride Edge', note: 'F5', midiNote: 89, freesoundQuery: 'acoustic ride cymbal edge', tags: ['cymbal', 'acoustic', 'ride'] },
    { id: 'acoustic-china', name: 'Acoustic China', note: 'F#5', midiNote: 90, freesoundQuery: 'acoustic china cymbal', tags: ['cymbal', 'acoustic', 'china'] },
    { id: 'acoustic-splash', name: 'Acoustic Splash', note: 'G5', midiNote: 91, freesoundQuery: 'acoustic splash cymbal', tags: ['cymbal', 'acoustic', 'splash'] },
    { id: 'acoustic-crash-choke', name: 'Acoustic Crash Choke', note: 'G#5', midiNote: 92, freesoundQuery: 'acoustic crash choke', tags: ['cymbal', 'acoustic', 'crash', 'choke'] },
    { id: 'acoustic-cymbal-swell', name: 'Acoustic Cymbal Swell', note: 'A5', midiNote: 93, freesoundQuery: 'acoustic cymbal swell', tags: ['cymbal', 'acoustic', 'swell'] },
    { id: 'acoustic-cymbal-scrape', name: 'Acoustic Cymbal Scrape', note: 'A#5', midiNote: 94, freesoundQuery: 'cymbal scrape', tags: ['cymbal', 'acoustic', 'scrape'] },

    // Percussion (4 variations)
    { id: 'acoustic-tambourine', name: 'Acoustic Tambourine', note: 'E4', midiNote: 76, freesoundQuery: 'acoustic tambourine', tags: ['percussion', 'acoustic', 'tambourine'] },
    { id: 'acoustic-cowbell', name: 'Acoustic Cowbell', note: 'F4', midiNote: 77, freesoundQuery: 'acoustic cowbell', tags: ['percussion', 'acoustic', 'cowbell'] },
    { id: 'acoustic-woodblock', name: 'Acoustic Woodblock', note: 'F#4', midiNote: 78, freesoundQuery: 'acoustic woodblock', tags: ['percussion', 'acoustic', 'woodblock'] },
    { id: 'acoustic-clap', name: 'Acoustic Handclap', note: 'G4', midiNote: 79, freesoundQuery: 'acoustic handclap', tags: ['percussion', 'acoustic', 'clap'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// SYNTH ONE-SHOTS PACK (50 SAMPLES)
// ============================================================================

/**
 * Synthesizer stabs, hits, and one-shot sounds
 */
export const PACK_SYNTH_ONE_SHOTS: SamplePack = {
  id: 'synth-one-shots',
  name: 'Synth One-Shots',
  category: 'synth',
  description: 'Punchy synthesizer stabs, hits, and one-shot sounds for electronic music',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 50,
  icon: '⚡',
  tags: ['synth', 'stab', 'hit', 'electronic', 'edm'],
  samples: [
    // Bass stabs (10 variations)
    { id: 'synth-bass-stab-01', name: 'Synth Bass Stab Deep', note: 'C1', midiNote: 36, freesoundQuery: 'synth bass stab deep', tags: ['synth', 'bass', 'stab'] },
    { id: 'synth-bass-stab-02', name: 'Synth Bass Stab Fat', note: 'C#1', midiNote: 37, freesoundQuery: 'synth bass stab fat', tags: ['synth', 'bass', 'stab'] },
    { id: 'synth-bass-stab-03', name: 'Synth Bass Stab Short', note: 'D1', midiNote: 38, freesoundQuery: 'synth bass stab short', tags: ['synth', 'bass', 'stab'] },
    { id: 'synth-bass-hit-01', name: 'Synth Bass Hit', note: 'D#1', midiNote: 39, freesoundQuery: 'synth bass hit', tags: ['synth', 'bass', 'hit'] },
    { id: 'synth-bass-drop', name: 'Synth Bass Drop', note: 'E1', midiNote: 40, freesoundQuery: 'synth bass drop', tags: ['synth', 'bass', 'drop'] },
    { id: 'synth-sub-hit', name: 'Synth Sub Hit', note: 'F1', midiNote: 41, freesoundQuery: 'synth sub bass hit', tags: ['synth', 'bass', 'sub'] },
    { id: 'synth-bass-pluck', name: 'Synth Bass Pluck', note: 'F#1', midiNote: 42, freesoundQuery: 'synth bass pluck', tags: ['synth', 'bass', 'pluck'] },
    { id: 'synth-bass-stab-bright', name: 'Synth Bass Stab Bright', note: 'G1', midiNote: 43, freesoundQuery: 'synth bass stab bright', tags: ['synth', 'bass', 'stab'] },
    { id: 'synth-bass-wobble', name: 'Synth Bass Wobble', note: 'G#1', midiNote: 44, freesoundQuery: 'synth wobble bass', tags: ['synth', 'bass', 'wobble'] },
    { id: 'synth-bass-growl', name: 'Synth Bass Growl', note: 'A1', midiNote: 45, freesoundQuery: 'synth growl bass', tags: ['synth', 'bass', 'growl'] },

    // Chord stabs (10 variations)
    { id: 'synth-chord-stab-01', name: 'Synth Chord Stab Major', note: 'C2', midiNote: 48, freesoundQuery: 'synth chord stab major', tags: ['synth', 'chord', 'stab'] },
    { id: 'synth-chord-stab-02', name: 'Synth Chord Stab Minor', note: 'C#2', midiNote: 49, freesoundQuery: 'synth chord stab minor', tags: ['synth', 'chord', 'stab'] },
    { id: 'synth-chord-stab-03', name: 'Synth Chord Stab Seventh', note: 'D2', midiNote: 50, freesoundQuery: 'synth seventh chord stab', tags: ['synth', 'chord', 'stab'] },
    { id: 'synth-chord-hit-bright', name: 'Synth Chord Hit Bright', note: 'D#2', midiNote: 51, freesoundQuery: 'synth chord hit bright', tags: ['synth', 'chord', 'hit'] },
    { id: 'synth-chord-hit-dark', name: 'Synth Chord Hit Dark', note: 'E2', midiNote: 52, freesoundQuery: 'synth chord hit dark', tags: ['synth', 'chord', 'hit'] },
    { id: 'synth-chord-organ', name: 'Synth Organ Chord', note: 'F2', midiNote: 53, freesoundQuery: 'synth organ chord', tags: ['synth', 'chord', 'organ'] },
    { id: 'synth-chord-brass', name: 'Synth Brass Chord', note: 'F#2', midiNote: 54, freesoundQuery: 'synth brass chord stab', tags: ['synth', 'chord', 'brass'] },
    { id: 'synth-chord-pad', name: 'Synth Pad Chord Short', note: 'G2', midiNote: 55, freesoundQuery: 'synth pad chord short', tags: ['synth', 'chord', 'pad'] },
    { id: 'synth-chord-rave', name: 'Synth Rave Chord', note: 'G#2', midiNote: 56, freesoundQuery: 'synth rave chord stab', tags: ['synth', 'chord', 'rave'] },
    { id: 'synth-chord-house', name: 'Synth House Chord', note: 'A2', midiNote: 57, freesoundQuery: 'house chord stab', tags: ['synth', 'chord', 'house'] },

    // Lead hits (10 variations)
    { id: 'synth-lead-hit-01', name: 'Synth Lead Hit Sharp', note: 'C3', midiNote: 60, freesoundQuery: 'synth lead hit sharp', tags: ['synth', 'lead', 'hit'] },
    { id: 'synth-lead-hit-02', name: 'Synth Lead Hit Soft', note: 'C#3', midiNote: 61, freesoundQuery: 'synth lead hit soft', tags: ['synth', 'lead', 'hit'] },
    { id: 'synth-lead-pluck-01', name: 'Synth Lead Pluck', note: 'D3', midiNote: 62, freesoundQuery: 'synth lead pluck', tags: ['synth', 'lead', 'pluck'] },
    { id: 'synth-lead-blip', name: 'Synth Lead Blip', note: 'D#3', midiNote: 63, freesoundQuery: 'synth blip', tags: ['synth', 'lead', 'blip'] },
    { id: 'synth-lead-zap', name: 'Synth Lead Zap', note: 'E3', midiNote: 64, freesoundQuery: 'synth zap', tags: ['synth', 'lead', 'zap'] },
    { id: 'synth-lead-laser', name: 'Synth Laser', note: 'F3', midiNote: 65, freesoundQuery: 'synth laser', tags: ['synth', 'lead', 'laser'] },
    { id: 'synth-lead-squawk', name: 'Synth Squawk', note: 'F#3', midiNote: 66, freesoundQuery: 'synth squawk', tags: ['synth', 'lead', 'squawk'] },
    { id: 'synth-lead-horn', name: 'Synth Horn Stab', note: 'G3', midiNote: 67, freesoundQuery: 'synth horn stab', tags: ['synth', 'lead', 'horn'] },
    { id: 'synth-lead-bell', name: 'Synth Bell Hit', note: 'G#3', midiNote: 68, freesoundQuery: 'synth bell hit', tags: ['synth', 'lead', 'bell'] },
    { id: 'synth-lead-chime', name: 'Synth Chime', note: 'A3', midiNote: 69, freesoundQuery: 'synth chime', tags: ['synth', 'lead', 'chime'] },

    // Percussive synths (10 variations)
    { id: 'synth-perc-kick', name: 'Synth Kick', note: 'A#3', midiNote: 70, freesoundQuery: 'synth kick', tags: ['synth', 'percussion', 'kick'] },
    { id: 'synth-perc-snare', name: 'Synth Snare', note: 'B3', midiNote: 71, freesoundQuery: 'synth snare', tags: ['synth', 'percussion', 'snare'] },
    { id: 'synth-perc-clap', name: 'Synth Clap', note: 'C4', midiNote: 72, freesoundQuery: 'synth clap', tags: ['synth', 'percussion', 'clap'] },
    { id: 'synth-perc-tom', name: 'Synth Tom', note: 'C#4', midiNote: 73, freesoundQuery: 'synth tom', tags: ['synth', 'percussion', 'tom'] },
    { id: 'synth-perc-bleep', name: 'Synth Bleep', note: 'D4', midiNote: 74, freesoundQuery: 'synth bleep', tags: ['synth', 'percussion', 'bleep'] },
    { id: 'synth-perc-blip', name: 'Synth Blip Perc', note: 'D#4', midiNote: 75, freesoundQuery: 'synth blip percussion', tags: ['synth', 'percussion', 'blip'] },
    { id: 'synth-perc-click', name: 'Synth Click', note: 'E4', midiNote: 76, freesoundQuery: 'synth click', tags: ['synth', 'percussion', 'click'] },
    { id: 'synth-perc-tick', name: 'Synth Tick', note: 'F4', midiNote: 77, freesoundQuery: 'synth tick', tags: ['synth', 'percussion', 'tick'] },
    { id: 'synth-perc-cowbell', name: 'Synth Cowbell', note: 'F#4', midiNote: 78, freesoundQuery: 'synth cowbell', tags: ['synth', 'percussion', 'cowbell'] },
    { id: 'synth-perc-rim', name: 'Synth Rim', note: 'G4', midiNote: 79, freesoundQuery: 'synth rim', tags: ['synth', 'percussion', 'rim'] },

    // FX synths (10 variations)
    { id: 'synth-fx-rise', name: 'Synth Riser Short', note: 'G#4', midiNote: 80, freesoundQuery: 'synth riser short', tags: ['synth', 'fx', 'riser'] },
    { id: 'synth-fx-fall', name: 'Synth Downlifter Short', note: 'A4', midiNote: 81, freesoundQuery: 'synth downlifter short', tags: ['synth', 'fx', 'downlifter'] },
    { id: 'synth-fx-whoosh', name: 'Synth Whoosh', note: 'A#4', midiNote: 82, freesoundQuery: 'synth whoosh', tags: ['synth', 'fx', 'whoosh'] },
    { id: 'synth-fx-sweep', name: 'Synth Sweep', note: 'B4', midiNote: 83, freesoundQuery: 'synth sweep', tags: ['synth', 'fx', 'sweep'] },
    { id: 'synth-fx-impact', name: 'Synth Impact', note: 'C5', midiNote: 84, freesoundQuery: 'synth impact', tags: ['synth', 'fx', 'impact'] },
    { id: 'synth-fx-hit', name: 'Synth FX Hit', note: 'C#5', midiNote: 85, freesoundQuery: 'synth fx hit', tags: ['synth', 'fx', 'hit'] },
    { id: 'synth-fx-explosion', name: 'Synth Explosion', note: 'D5', midiNote: 86, freesoundQuery: 'synth explosion', tags: ['synth', 'fx', 'explosion'] },
    { id: 'synth-fx-glitch', name: 'Synth Glitch', note: 'D#5', midiNote: 87, freesoundQuery: 'synth glitch', tags: ['synth', 'fx', 'glitch'] },
    { id: 'synth-fx-noise-burst', name: 'Synth Noise Burst', note: 'E5', midiNote: 88, freesoundQuery: 'synth noise burst', tags: ['synth', 'fx', 'noise'] },
    { id: 'synth-fx-reverse', name: 'Synth Reverse', note: 'F5', midiNote: 89, freesoundQuery: 'synth reverse', tags: ['synth', 'fx', 'reverse'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// BASS HITS PACK (30 SAMPLES)
// ============================================================================

/**
 * Bass drops, punches, and low-end hits
 */
export const PACK_BASS_HITS: SamplePack = {
  id: 'bass-hits',
  name: 'Bass Hits',
  category: 'bass',
  description: 'Powerful bass drops, punches, and low-end impact sounds',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '💥',
  tags: ['bass', 'drop', 'hit', 'sub', 'low-end'],
  samples: [
    // Sub bass hits (10 variations)
    { id: 'bass-hit-sub-01', name: 'Sub Bass Hit Deep', note: 'C1', midiNote: 36, freesoundQuery: 'sub bass hit deep', tags: ['bass', 'sub', 'hit'] },
    { id: 'bass-hit-sub-02', name: 'Sub Bass Hit Punch', note: 'C#1', midiNote: 37, freesoundQuery: 'sub bass punch', tags: ['bass', 'sub', 'punch'] },
    { id: 'bass-hit-sub-03', name: 'Sub Bass Hit Short', note: 'D1', midiNote: 38, freesoundQuery: 'sub bass hit short', tags: ['bass', 'sub', 'short'] },
    { id: 'bass-hit-sub-04', name: 'Sub Bass Hit Long', note: 'D#1', midiNote: 39, freesoundQuery: 'sub bass hit long', tags: ['bass', 'sub', 'long'] },
    { id: 'bass-drop-01', name: 'Bass Drop Heavy', note: 'E1', midiNote: 40, freesoundQuery: 'bass drop heavy', tags: ['bass', 'drop', 'heavy'] },
    { id: 'bass-drop-02', name: 'Bass Drop Wobble', note: 'F1', midiNote: 41, freesoundQuery: 'bass drop wobble', tags: ['bass', 'drop', 'wobble'] },
    { id: 'bass-drop-03', name: 'Bass Drop Distorted', note: 'F#1', midiNote: 42, freesoundQuery: 'bass drop distorted', tags: ['bass', 'drop', 'distorted'] },
    { id: 'bass-boom', name: 'Bass Boom', note: 'G1', midiNote: 43, freesoundQuery: 'bass boom', tags: ['bass', 'boom'] },
    { id: 'bass-thud', name: 'Bass Thud', note: 'G#1', midiNote: 44, freesoundQuery: 'bass thud', tags: ['bass', 'thud'] },
    { id: 'bass-rumble', name: 'Bass Rumble', note: 'A1', midiNote: 45, freesoundQuery: 'bass rumble', tags: ['bass', 'rumble'] },

    // Synth bass hits (10 variations)
    { id: 'synth-bass-hit-deep', name: 'Synth Bass Hit Deep', note: 'A#1', midiNote: 46, freesoundQuery: 'synth bass hit deep', tags: ['synth', 'bass', 'hit'] },
    { id: 'synth-bass-hit-fat', name: 'Synth Bass Hit Fat', note: 'B1', midiNote: 47, freesoundQuery: 'synth bass hit fat', tags: ['synth', 'bass', 'hit'] },
    { id: 'synth-bass-hit-analog', name: 'Analog Bass Hit', note: 'C2', midiNote: 48, freesoundQuery: 'analog bass hit', tags: ['synth', 'bass', 'analog'] },
    { id: 'synth-bass-hit-fm', name: 'FM Bass Hit', note: 'C#2', midiNote: 49, freesoundQuery: 'fm bass hit', tags: ['synth', 'bass', 'fm'] },
    { id: 'synth-bass-hit-reese', name: 'Reese Bass Hit', note: 'D2', midiNote: 50, freesoundQuery: 'reese bass hit', tags: ['synth', 'bass', 'reese'] },
    { id: 'synth-bass-hit-growl', name: 'Growl Bass Hit', note: 'D#2', midiNote: 51, freesoundQuery: 'growl bass hit', tags: ['synth', 'bass', 'growl'] },
    { id: 'synth-bass-hit-squelch', name: 'Squelch Bass Hit', note: 'E2', midiNote: 52, freesoundQuery: 'squelch bass hit', tags: ['synth', 'bass', 'squelch'] },
    { id: 'synth-bass-hit-acid', name: 'Acid Bass Hit', note: 'F2', midiNote: 53, freesoundQuery: 'acid bass hit', tags: ['synth', 'bass', 'acid'] },
    { id: 'synth-bass-hit-303', name: '303 Bass Hit', note: 'F#2', midiNote: 54, freesoundQuery: '303 bass hit', tags: ['synth', 'bass', '303'] },
    { id: 'synth-bass-hit-dirty', name: 'Dirty Bass Hit', note: 'G2', midiNote: 55, freesoundQuery: 'dirty bass hit', tags: ['synth', 'bass', 'dirty'] },

    // Acoustic bass hits (10 variations)
    { id: 'acoustic-bass-hit-01', name: 'Acoustic Bass Pluck', note: 'G#2', midiNote: 56, freesoundQuery: 'acoustic bass pluck', tags: ['acoustic', 'bass', 'pluck'] },
    { id: 'acoustic-bass-hit-02', name: 'Acoustic Bass Slap', note: 'A2', midiNote: 57, freesoundQuery: 'acoustic bass slap', tags: ['acoustic', 'bass', 'slap'] },
    { id: 'acoustic-bass-hit-03', name: 'Acoustic Bass Pop', note: 'A#2', midiNote: 58, freesoundQuery: 'acoustic bass pop', tags: ['acoustic', 'bass', 'pop'] },
    { id: 'acoustic-bass-hit-04', name: 'Electric Bass Punch', note: 'B2', midiNote: 59, freesoundQuery: 'electric bass punch', tags: ['acoustic', 'bass', 'punch'] },
    { id: 'acoustic-bass-hit-05', name: 'Electric Bass Slap', note: 'C3', midiNote: 60, freesoundQuery: 'electric bass slap', tags: ['acoustic', 'bass', 'slap'] },
    { id: 'acoustic-bass-hit-06', name: 'Upright Bass Pluck', note: 'C#3', midiNote: 61, freesoundQuery: 'upright bass pluck', tags: ['acoustic', 'bass', 'upright'] },
    { id: 'acoustic-bass-hit-07', name: 'Fretless Bass', note: 'D3', midiNote: 62, freesoundQuery: 'fretless bass note', tags: ['acoustic', 'bass', 'fretless'] },
    { id: 'bass-guitar-muted', name: 'Bass Guitar Muted', note: 'D#3', midiNote: 63, freesoundQuery: 'bass guitar muted', tags: ['acoustic', 'bass', 'muted'] },
    { id: 'bass-guitar-harmonic', name: 'Bass Harmonic', note: 'E3', midiNote: 64, freesoundQuery: 'bass guitar harmonic', tags: ['acoustic', 'bass', 'harmonic'] },
    { id: 'bass-guitar-pick', name: 'Bass Pick Attack', note: 'F3', midiNote: 65, freesoundQuery: 'bass pick attack', tags: ['acoustic', 'bass', 'pick'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// GUITAR LOOPS PACK (30 SAMPLES)
// ============================================================================

/**
 * Guitar loops: riffs, strums, and melodic phrases
 */
export const PACK_GUITAR_LOOPS: SamplePack = {
  id: 'guitar-loops',
  name: 'Guitar Loops',
  category: 'melodic',
  description: 'Versatile guitar loops from acoustic fingerpicking to electric riffs',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🎸',
  tags: ['guitar', 'loop', 'melodic', 'riff', 'strum'],
  samples: [
    // Acoustic guitar loops (10 variations)
    { id: 'guitar-acoustic-loop-01', name: 'Acoustic Fingerpicking C', note: 'C3', midiNote: 60, freesoundQuery: 'acoustic guitar fingerpicking loop', tags: ['guitar', 'acoustic', 'fingerpicking', 'loop'] },
    { id: 'guitar-acoustic-loop-02', name: 'Acoustic Strum Pattern', note: 'C#3', midiNote: 61, freesoundQuery: 'acoustic guitar strum pattern loop', tags: ['guitar', 'acoustic', 'strum', 'loop'] },
    { id: 'guitar-acoustic-loop-03', name: 'Acoustic Arpeggio Am', note: 'D3', midiNote: 62, freesoundQuery: 'acoustic guitar arpeggio loop', tags: ['guitar', 'acoustic', 'arpeggio', 'loop'] },
    { id: 'guitar-acoustic-loop-04', name: 'Acoustic Folk Strum', note: 'D#3', midiNote: 63, freesoundQuery: 'folk guitar strum loop', tags: ['guitar', 'acoustic', 'folk', 'loop'] },
    { id: 'guitar-acoustic-loop-05', name: 'Acoustic Percussive', note: 'E3', midiNote: 64, freesoundQuery: 'acoustic guitar percussive loop', tags: ['guitar', 'acoustic', 'percussive', 'loop'] },
    { id: 'guitar-acoustic-loop-06', name: 'Acoustic Ballad Picking', note: 'F3', midiNote: 65, freesoundQuery: 'acoustic guitar ballad picking loop', tags: ['guitar', 'acoustic', 'ballad', 'loop'] },
    { id: 'guitar-acoustic-loop-07', name: 'Acoustic Country', note: 'F#3', midiNote: 66, freesoundQuery: 'country guitar loop', tags: ['guitar', 'acoustic', 'country', 'loop'] },
    { id: 'guitar-acoustic-loop-08', name: 'Acoustic Blues', note: 'G3', midiNote: 67, freesoundQuery: 'acoustic blues guitar loop', tags: ['guitar', 'acoustic', 'blues', 'loop'] },
    { id: 'guitar-acoustic-loop-09', name: 'Acoustic Flamenco', note: 'G#3', midiNote: 68, freesoundQuery: 'flamenco guitar loop', tags: ['guitar', 'acoustic', 'flamenco', 'loop'] },
    { id: 'guitar-acoustic-loop-10', name: 'Acoustic Bossa Nova', note: 'A3', midiNote: 69, freesoundQuery: 'bossa nova guitar loop', tags: ['guitar', 'acoustic', 'bossa', 'loop'] },

    // Electric guitar loops (10 variations)
    { id: 'guitar-electric-loop-01', name: 'Electric Rock Riff', note: 'A#3', midiNote: 70, freesoundQuery: 'electric guitar rock riff loop', tags: ['guitar', 'electric', 'rock', 'loop'] },
    { id: 'guitar-electric-loop-02', name: 'Electric Blues Lick', note: 'B3', midiNote: 71, freesoundQuery: 'electric guitar blues lick loop', tags: ['guitar', 'electric', 'blues', 'loop'] },
    { id: 'guitar-electric-loop-03', name: 'Electric Funk Rhythm', note: 'C4', midiNote: 72, freesoundQuery: 'funk guitar rhythm loop', tags: ['guitar', 'electric', 'funk', 'loop'] },
    { id: 'guitar-electric-loop-04', name: 'Electric Power Chord', note: 'C#4', midiNote: 73, freesoundQuery: 'power chord guitar loop', tags: ['guitar', 'electric', 'power', 'loop'] },
    { id: 'guitar-electric-loop-05', name: 'Electric Clean Arpeggio', note: 'D4', midiNote: 74, freesoundQuery: 'clean electric guitar arpeggio loop', tags: ['guitar', 'electric', 'clean', 'loop'] },
    { id: 'guitar-electric-loop-06', name: 'Electric Surf Rock', note: 'D#4', midiNote: 75, freesoundQuery: 'surf rock guitar loop', tags: ['guitar', 'electric', 'surf', 'loop'] },
    { id: 'guitar-electric-loop-07', name: 'Electric Distorted Riff', note: 'E4', midiNote: 76, freesoundQuery: 'distorted guitar riff loop', tags: ['guitar', 'electric', 'distorted', 'loop'] },
    { id: 'guitar-electric-loop-08', name: 'Electric Jazz Comping', note: 'F4', midiNote: 77, freesoundQuery: 'jazz guitar comping loop', tags: ['guitar', 'electric', 'jazz', 'loop'] },
    { id: 'guitar-electric-loop-09', name: 'Electric Palm Mute', note: 'F#4', midiNote: 78, freesoundQuery: 'palm muted guitar loop', tags: ['guitar', 'electric', 'muted', 'loop'] },
    { id: 'guitar-electric-loop-10', name: 'Electric Reggae Skank', note: 'G4', midiNote: 79, freesoundQuery: 'reggae guitar skank loop', tags: ['guitar', 'electric', 'reggae', 'loop'] },

    // Ambient/atmospheric guitar (10 variations)
    { id: 'guitar-ambient-loop-01', name: 'Guitar Ambient Pad', note: 'G#4', midiNote: 80, freesoundQuery: 'ambient guitar pad loop', tags: ['guitar', 'ambient', 'pad', 'loop'] },
    { id: 'guitar-ambient-loop-02', name: 'Guitar Delay Echo', note: 'A4', midiNote: 81, freesoundQuery: 'guitar delay echo loop', tags: ['guitar', 'ambient', 'delay', 'loop'] },
    { id: 'guitar-ambient-loop-03', name: 'Guitar Reverb Wash', note: 'A#4', midiNote: 82, freesoundQuery: 'guitar reverb wash loop', tags: ['guitar', 'ambient', 'reverb', 'loop'] },
    { id: 'guitar-ambient-loop-04', name: 'Guitar Harmonics', note: 'B4', midiNote: 83, freesoundQuery: 'guitar harmonics loop', tags: ['guitar', 'ambient', 'harmonics', 'loop'] },
    { id: 'guitar-ambient-loop-05', name: 'Guitar Ebow Drone', note: 'C5', midiNote: 84, freesoundQuery: 'ebow guitar drone loop', tags: ['guitar', 'ambient', 'ebow', 'loop'] },
    { id: 'guitar-ambient-loop-06', name: 'Guitar Tremolo', note: 'C#5', midiNote: 85, freesoundQuery: 'guitar tremolo loop', tags: ['guitar', 'ambient', 'tremolo', 'loop'] },
    { id: 'guitar-ambient-loop-07', name: 'Guitar Swells', note: 'D5', midiNote: 86, freesoundQuery: 'guitar volume swell loop', tags: ['guitar', 'ambient', 'swell', 'loop'] },
    { id: 'guitar-ambient-loop-08', name: 'Guitar Atmospheric', note: 'D#5', midiNote: 87, freesoundQuery: 'atmospheric guitar loop', tags: ['guitar', 'ambient', 'atmospheric', 'loop'] },
    { id: 'guitar-ambient-loop-09', name: 'Guitar Shimmer', note: 'E5', midiNote: 88, freesoundQuery: 'guitar shimmer reverb loop', tags: ['guitar', 'ambient', 'shimmer', 'loop'] },
    { id: 'guitar-ambient-loop-10', name: 'Guitar Reverse', note: 'F5', midiNote: 89, freesoundQuery: 'reverse guitar loop', tags: ['guitar', 'ambient', 'reverse', 'loop'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// PIANO CHORDS PACK (30 SAMPLES)
// ============================================================================

/**
 * Piano chord progressions and stabs
 */
export const PACK_PIANO_CHORDS: SamplePack = {
  id: 'piano-chords',
  name: 'Piano Chords',
  category: 'melodic',
  description: 'Piano chord stabs and progressions from jazz to classical',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🎹',
  tags: ['piano', 'chord', 'keys', 'progression'],
  samples: [
    // Major chords (5 variations)
    { id: 'piano-chord-c-major', name: 'Piano C Major', note: 'C3', midiNote: 60, freesoundQuery: 'piano C major chord', tags: ['piano', 'chord', 'major'] },
    { id: 'piano-chord-f-major', name: 'Piano F Major', note: 'F3', midiNote: 65, freesoundQuery: 'piano F major chord', tags: ['piano', 'chord', 'major'] },
    { id: 'piano-chord-g-major', name: 'Piano G Major', note: 'G3', midiNote: 67, freesoundQuery: 'piano G major chord', tags: ['piano', 'chord', 'major'] },
    { id: 'piano-chord-d-major', name: 'Piano D Major', note: 'D3', midiNote: 62, freesoundQuery: 'piano D major chord', tags: ['piano', 'chord', 'major'] },
    { id: 'piano-chord-a-major', name: 'Piano A Major', note: 'A3', midiNote: 69, freesoundQuery: 'piano A major chord', tags: ['piano', 'chord', 'major'] },

    // Minor chords (5 variations)
    { id: 'piano-chord-a-minor', name: 'Piano A Minor', note: 'A2', midiNote: 57, freesoundQuery: 'piano A minor chord', tags: ['piano', 'chord', 'minor'] },
    { id: 'piano-chord-d-minor', name: 'Piano D Minor', note: 'D3', midiNote: 50, freesoundQuery: 'piano D minor chord', tags: ['piano', 'chord', 'minor'] },
    { id: 'piano-chord-e-minor', name: 'Piano E Minor', note: 'E3', midiNote: 52, freesoundQuery: 'piano E minor chord', tags: ['piano', 'chord', 'minor'] },
    { id: 'piano-chord-b-minor', name: 'Piano B Minor', note: 'B2', midiNote: 59, freesoundQuery: 'piano B minor chord', tags: ['piano', 'chord', 'minor'] },
    { id: 'piano-chord-f-sharp-minor', name: 'Piano F# Minor', note: 'F#2', midiNote: 54, freesoundQuery: 'piano F sharp minor chord', tags: ['piano', 'chord', 'minor'] },

    // Seventh chords (5 variations)
    { id: 'piano-chord-cmaj7', name: 'Piano Cmaj7', note: 'C4', midiNote: 72, freesoundQuery: 'piano C major seventh chord', tags: ['piano', 'chord', 'maj7'] },
    { id: 'piano-chord-dm7', name: 'Piano Dm7', note: 'D4', midiNote: 74, freesoundQuery: 'piano D minor seventh chord', tags: ['piano', 'chord', 'min7'] },
    { id: 'piano-chord-g7', name: 'Piano G7', note: 'G4', midiNote: 79, freesoundQuery: 'piano G dominant seventh chord', tags: ['piano', 'chord', '7'] },
    { id: 'piano-chord-am7', name: 'Piano Am7', note: 'A4', midiNote: 81, freesoundQuery: 'piano A minor seventh chord', tags: ['piano', 'chord', 'min7'] },
    { id: 'piano-chord-fmaj7', name: 'Piano Fmaj7', note: 'F4', midiNote: 77, freesoundQuery: 'piano F major seventh chord', tags: ['piano', 'chord', 'maj7'] },

    // Extended/altered chords (10 variations)
    { id: 'piano-chord-c9', name: 'Piano C9', note: 'C5', midiNote: 84, freesoundQuery: 'piano C ninth chord', tags: ['piano', 'chord', '9'] },
    { id: 'piano-chord-dmin9', name: 'Piano Dm9', note: 'D5', midiNote: 86, freesoundQuery: 'piano D minor ninth chord', tags: ['piano', 'chord', 'min9'] },
    { id: 'piano-chord-gmaj9', name: 'Piano Gmaj9', note: 'G5', midiNote: 91, freesoundQuery: 'piano G major ninth chord', tags: ['piano', 'chord', 'maj9'] },
    { id: 'piano-chord-c11', name: 'Piano C11', note: 'C2', midiNote: 48, freesoundQuery: 'piano C eleventh chord', tags: ['piano', 'chord', '11'] },
    { id: 'piano-chord-f13', name: 'Piano F13', note: 'F2', midiNote: 53, freesoundQuery: 'piano F thirteenth chord', tags: ['piano', 'chord', '13'] },
    { id: 'piano-chord-dim7', name: 'Piano Dim7', note: 'B3', midiNote: 71, freesoundQuery: 'piano diminished seventh chord', tags: ['piano', 'chord', 'dim7'] },
    { id: 'piano-chord-aug', name: 'Piano Aug', note: 'E4', midiNote: 76, freesoundQuery: 'piano augmented chord', tags: ['piano', 'chord', 'aug'] },
    { id: 'piano-chord-sus4', name: 'Piano Sus4', note: 'A#3', midiNote: 70, freesoundQuery: 'piano suspended fourth chord', tags: ['piano', 'chord', 'sus4'] },
    { id: 'piano-chord-sus2', name: 'Piano Sus2', note: 'D#4', midiNote: 75, freesoundQuery: 'piano suspended second chord', tags: ['piano', 'chord', 'sus2'] },
    { id: 'piano-chord-cluster', name: 'Piano Cluster', note: 'C#4', midiNote: 73, freesoundQuery: 'piano cluster chord', tags: ['piano', 'chord', 'cluster'] },

    // Progression snippets (5 variations)
    { id: 'piano-progression-i-vi-ii-v', name: 'Piano I-VI-II-V', note: 'C6', midiNote: 96, freesoundQuery: 'piano chord progression loop', tags: ['piano', 'progression', 'loop'] },
    { id: 'piano-progression-i-v-vi-iv', name: 'Piano I-V-VI-IV', note: 'D6', midiNote: 98, freesoundQuery: 'piano pop progression loop', tags: ['piano', 'progression', 'pop'] },
    { id: 'piano-progression-i-iv-v', name: 'Piano I-IV-V', note: 'E6', midiNote: 100, freesoundQuery: 'piano blues progression loop', tags: ['piano', 'progression', 'blues'] },
    { id: 'piano-progression-minor-i-iv', name: 'Piano Minor i-iv', note: 'F6', midiNote: 101, freesoundQuery: 'piano minor progression loop', tags: ['piano', 'progression', 'minor'] },
    { id: 'piano-progression-jazz', name: 'Piano Jazz Turnaround', note: 'G6', midiNote: 103, freesoundQuery: 'piano jazz turnaround', tags: ['piano', 'progression', 'jazz'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// VOCAL CHOPS PACK (30 SAMPLES)
// ============================================================================

/**
 * Vocal chops and one-shots for electronic music
 */
export const PACK_VOCAL_CHOPS: SamplePack = {
  id: 'vocal-chops',
  name: 'Vocal Chops',
  category: 'vocal',
  description: 'Short vocal phrases, chops, and one-shots perfect for electronic production',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🎤',
  tags: ['vocal', 'chop', 'voice', 'phrase'],
  samples: [
    // Vowel sounds (10 variations)
    { id: 'vocal-chop-ah', name: 'Vocal Ah', note: 'C3', midiNote: 60, freesoundQuery: 'vocal ah sample short', tags: ['vocal', 'vowel', 'ah'] },
    { id: 'vocal-chop-eh', name: 'Vocal Eh', note: 'C#3', midiNote: 61, freesoundQuery: 'vocal eh sample short', tags: ['vocal', 'vowel', 'eh'] },
    { id: 'vocal-chop-oh', name: 'Vocal Oh', note: 'D3', midiNote: 62, freesoundQuery: 'vocal oh sample short', tags: ['vocal', 'vowel', 'oh'] },
    { id: 'vocal-chop-oo', name: 'Vocal Oo', note: 'D#3', midiNote: 63, freesoundQuery: 'vocal oo sample short', tags: ['vocal', 'vowel', 'oo'] },
    { id: 'vocal-chop-ee', name: 'Vocal Ee', note: 'E3', midiNote: 64, freesoundQuery: 'vocal ee sample short', tags: ['vocal', 'vowel', 'ee'] },
    { id: 'vocal-chop-male-ah', name: 'Male Vocal Ah', note: 'F3', midiNote: 65, freesoundQuery: 'male vocal ah sample', tags: ['vocal', 'male', 'ah'] },
    { id: 'vocal-chop-female-oh', name: 'Female Vocal Oh', note: 'F#3', midiNote: 66, freesoundQuery: 'female vocal oh sample', tags: ['vocal', 'female', 'oh'] },
    { id: 'vocal-chop-choir-ah', name: 'Choir Ah', note: 'G3', midiNote: 67, freesoundQuery: 'choir ah sample', tags: ['vocal', 'choir', 'ah'] },
    { id: 'vocal-chop-whisper', name: 'Vocal Whisper', note: 'G#3', midiNote: 68, freesoundQuery: 'vocal whisper sample', tags: ['vocal', 'whisper'] },
    { id: 'vocal-chop-breath', name: 'Vocal Breath', note: 'A3', midiNote: 69, freesoundQuery: 'vocal breath sample', tags: ['vocal', 'breath'] },

    // Words and phrases (10 variations)
    { id: 'vocal-chop-yeah', name: 'Vocal Yeah', note: 'A#3', midiNote: 70, freesoundQuery: 'vocal yeah sample', tags: ['vocal', 'word', 'yeah'] },
    { id: 'vocal-chop-hey', name: 'Vocal Hey', note: 'B3', midiNote: 71, freesoundQuery: 'vocal hey sample', tags: ['vocal', 'word', 'hey'] },
    { id: 'vocal-chop-go', name: 'Vocal Go', note: 'C4', midiNote: 72, freesoundQuery: 'vocal go sample', tags: ['vocal', 'word', 'go'] },
    { id: 'vocal-chop-stop', name: 'Vocal Stop', note: 'C#4', midiNote: 73, freesoundQuery: 'vocal stop sample', tags: ['vocal', 'word', 'stop'] },
    { id: 'vocal-chop-love', name: 'Vocal Love', note: 'D4', midiNote: 74, freesoundQuery: 'vocal love sample', tags: ['vocal', 'word', 'love'] },
    { id: 'vocal-chop-baby', name: 'Vocal Baby', note: 'D#4', midiNote: 75, freesoundQuery: 'vocal baby sample', tags: ['vocal', 'word', 'baby'] },
    { id: 'vocal-chop-come-on', name: 'Vocal Come On', note: 'E4', midiNote: 76, freesoundQuery: 'vocal come on sample', tags: ['vocal', 'phrase', 'come-on'] },
    { id: 'vocal-chop-lets-go', name: 'Vocal Let\'s Go', note: 'F4', midiNote: 77, freesoundQuery: 'vocal lets go sample', tags: ['vocal', 'phrase', 'lets-go'] },
    { id: 'vocal-chop-right-now', name: 'Vocal Right Now', note: 'F#4', midiNote: 78, freesoundQuery: 'vocal right now sample', tags: ['vocal', 'phrase', 'right-now'] },
    { id: 'vocal-chop-tonight', name: 'Vocal Tonight', note: 'G4', midiNote: 79, freesoundQuery: 'vocal tonight sample', tags: ['vocal', 'word', 'tonight'] },

    // Vocal FX (10 variations)
    { id: 'vocal-chop-stutter', name: 'Vocal Stutter', note: 'G#4', midiNote: 80, freesoundQuery: 'vocal stutter sample', tags: ['vocal', 'fx', 'stutter'] },
    { id: 'vocal-chop-chopped', name: 'Vocal Chopped', note: 'A4', midiNote: 81, freesoundQuery: 'vocal chop sample', tags: ['vocal', 'fx', 'chopped'] },
    { id: 'vocal-chop-pitched-up', name: 'Vocal Pitched Up', note: 'A#4', midiNote: 82, freesoundQuery: 'vocal pitched up sample', tags: ['vocal', 'fx', 'pitched'] },
    { id: 'vocal-chop-pitched-down', name: 'Vocal Pitched Down', note: 'B4', midiNote: 83, freesoundQuery: 'vocal pitched down sample', tags: ['vocal', 'fx', 'pitched'] },
    { id: 'vocal-chop-reversed', name: 'Vocal Reversed', note: 'C5', midiNote: 84, freesoundQuery: 'vocal reversed sample', tags: ['vocal', 'fx', 'reversed'] },
    { id: 'vocal-chop-formant', name: 'Vocal Formant Shift', note: 'C#5', midiNote: 85, freesoundQuery: 'vocal formant sample', tags: ['vocal', 'fx', 'formant'] },
    { id: 'vocal-chop-vocoded', name: 'Vocal Vocoded', note: 'D5', midiNote: 86, freesoundQuery: 'vocoded vocal sample', tags: ['vocal', 'fx', 'vocoded'] },
    { id: 'vocal-chop-distorted', name: 'Vocal Distorted', note: 'D#5', midiNote: 87, freesoundQuery: 'distorted vocal sample', tags: ['vocal', 'fx', 'distorted'] },
    { id: 'vocal-chop-robot', name: 'Vocal Robot', note: 'E5', midiNote: 88, freesoundQuery: 'robot vocal sample', tags: ['vocal', 'fx', 'robot'] },
    { id: 'vocal-chop-granular', name: 'Vocal Granular', note: 'F5', midiNote: 89, freesoundQuery: 'granular vocal sample', tags: ['vocal', 'fx', 'granular'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// AMBIENT TEXTURES PACK (30 SAMPLES)
// ============================================================================

/**
 * Ambient textures and atmospheric pads
 */
export const PACK_AMBIENT_TEXTURES: SamplePack = {
  id: 'ambient-textures',
  name: 'Ambient Textures',
  category: 'fx',
  description: 'Evolving ambient textures, drones, and atmospheric soundscapes',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🌌',
  tags: ['ambient', 'texture', 'drone', 'atmosphere', 'pad'],
  samples: [
    // Drones (10 variations)
    { id: 'ambient-drone-dark', name: 'Dark Drone', note: 'C1', midiNote: 36, freesoundQuery: 'dark ambient drone', tags: ['ambient', 'drone', 'dark'] },
    { id: 'ambient-drone-warm', name: 'Warm Drone', note: 'C#1', midiNote: 37, freesoundQuery: 'warm ambient drone', tags: ['ambient', 'drone', 'warm'] },
    { id: 'ambient-drone-cold', name: 'Cold Drone', note: 'D1', midiNote: 38, freesoundQuery: 'cold ambient drone', tags: ['ambient', 'drone', 'cold'] },
    { id: 'ambient-drone-metallic', name: 'Metallic Drone', note: 'D#1', midiNote: 39, freesoundQuery: 'metallic drone', tags: ['ambient', 'drone', 'metallic'] },
    { id: 'ambient-drone-organic', name: 'Organic Drone', note: 'E1', midiNote: 40, freesoundQuery: 'organic ambient drone', tags: ['ambient', 'drone', 'organic'] },
    { id: 'ambient-drone-bass', name: 'Bass Drone', note: 'F1', midiNote: 41, freesoundQuery: 'bass drone ambient', tags: ['ambient', 'drone', 'bass'] },
    { id: 'ambient-drone-shimmer', name: 'Shimmer Drone', note: 'F#1', midiNote: 42, freesoundQuery: 'shimmer drone ambient', tags: ['ambient', 'drone', 'shimmer'] },
    { id: 'ambient-drone-pad', name: 'Pad Drone', note: 'G1', midiNote: 43, freesoundQuery: 'pad drone ambient', tags: ['ambient', 'drone', 'pad'] },
    { id: 'ambient-drone-evolving', name: 'Evolving Drone', note: 'G#1', midiNote: 44, freesoundQuery: 'evolving drone ambient', tags: ['ambient', 'drone', 'evolving'] },
    { id: 'ambient-drone-sub', name: 'Sub Drone', note: 'A1', midiNote: 45, freesoundQuery: 'sub bass drone ambient', tags: ['ambient', 'drone', 'sub'] },

    // Textured pads (10 variations)
    { id: 'ambient-pad-string', name: 'String Texture', note: 'A#1', midiNote: 46, freesoundQuery: 'ambient string texture', tags: ['ambient', 'pad', 'string'] },
    { id: 'ambient-pad-vocal', name: 'Vocal Texture', note: 'B1', midiNote: 47, freesoundQuery: 'ambient vocal texture', tags: ['ambient', 'pad', 'vocal'] },
    { id: 'ambient-pad-synth', name: 'Synth Texture', note: 'C2', midiNote: 48, freesoundQuery: 'synth ambient texture', tags: ['ambient', 'pad', 'synth'] },
    { id: 'ambient-pad-choir', name: 'Choir Texture', note: 'C#2', midiNote: 49, freesoundQuery: 'ambient choir texture', tags: ['ambient', 'pad', 'choir'] },
    { id: 'ambient-pad-glass', name: 'Glass Texture', note: 'D2', midiNote: 50, freesoundQuery: 'glass ambient texture', tags: ['ambient', 'pad', 'glass'] },
    { id: 'ambient-pad-wind', name: 'Wind Texture', note: 'D#2', midiNote: 51, freesoundQuery: 'wind ambient texture', tags: ['ambient', 'pad', 'wind'] },
    { id: 'ambient-pad-water', name: 'Water Texture', note: 'E2', midiNote: 52, freesoundQuery: 'water ambient texture', tags: ['ambient', 'pad', 'water'] },
    { id: 'ambient-pad-space', name: 'Space Texture', note: 'F2', midiNote: 53, freesoundQuery: 'space ambient texture', tags: ['ambient', 'pad', 'space'] },
    { id: 'ambient-pad-forest', name: 'Forest Texture', note: 'F#2', midiNote: 54, freesoundQuery: 'forest ambient texture', tags: ['ambient', 'pad', 'forest'] },
    { id: 'ambient-pad-granular', name: 'Granular Texture', note: 'G2', midiNote: 55, freesoundQuery: 'granular ambient texture', tags: ['ambient', 'pad', 'granular'] },

    // Atmospheres (10 variations)
    { id: 'ambient-atmosphere-field', name: 'Field Recording Atmo', note: 'G#2', midiNote: 56, freesoundQuery: 'field recording atmosphere', tags: ['ambient', 'atmosphere', 'field'] },
    { id: 'ambient-atmosphere-rain', name: 'Rain Atmosphere', note: 'A2', midiNote: 57, freesoundQuery: 'rain ambient atmosphere', tags: ['ambient', 'atmosphere', 'rain'] },
    { id: 'ambient-atmosphere-storm', name: 'Storm Atmosphere', note: 'A#2', midiNote: 58, freesoundQuery: 'storm ambient atmosphere', tags: ['ambient', 'atmosphere', 'storm'] },
    { id: 'ambient-atmosphere-city', name: 'City Atmosphere', note: 'B2', midiNote: 59, freesoundQuery: 'city ambient atmosphere', tags: ['ambient', 'atmosphere', 'city'] },
    { id: 'ambient-atmosphere-traffic', name: 'Traffic Atmosphere', note: 'C3', midiNote: 60, freesoundQuery: 'traffic ambient atmosphere', tags: ['ambient', 'atmosphere', 'traffic'] },
    { id: 'ambient-atmosphere-ocean', name: 'Ocean Atmosphere', note: 'C#3', midiNote: 61, freesoundQuery: 'ocean ambient atmosphere', tags: ['ambient', 'atmosphere', 'ocean'] },
    { id: 'ambient-atmosphere-night', name: 'Night Atmosphere', note: 'D3', midiNote: 62, freesoundQuery: 'night ambient atmosphere', tags: ['ambient', 'atmosphere', 'night'] },
    { id: 'ambient-atmosphere-industrial', name: 'Industrial Atmosphere', note: 'D#3', midiNote: 63, freesoundQuery: 'industrial ambient atmosphere', tags: ['ambient', 'atmosphere', 'industrial'] },
    { id: 'ambient-atmosphere-cave', name: 'Cave Atmosphere', note: 'E3', midiNote: 64, freesoundQuery: 'cave ambient atmosphere', tags: ['ambient', 'atmosphere', 'cave'] },
    { id: 'ambient-atmosphere-cosmic', name: 'Cosmic Atmosphere', note: 'F3', midiNote: 65, freesoundQuery: 'cosmic ambient atmosphere', tags: ['ambient', 'atmosphere', 'cosmic'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// FX RISERS PACK (20 SAMPLES)
// ============================================================================

/**
 * FX risers for build-ups and transitions
 */
export const PACK_FX_RISERS: SamplePack = {
  id: 'fx-risers',
  name: 'FX Risers',
  category: 'fx',
  description: 'Build-up risers and uplifters for transitions and drops',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 20,
  icon: '📈',
  tags: ['fx', 'riser', 'build-up', 'transition', 'uplifter'],
  samples: [
    // Short risers (5 variations)
    { id: 'fx-riser-short-01', name: 'Short Riser 1', note: 'C3', midiNote: 60, freesoundQuery: 'short riser fx', tags: ['fx', 'riser', 'short'] },
    { id: 'fx-riser-short-02', name: 'Short Riser 2', note: 'C#3', midiNote: 61, freesoundQuery: 'short uplifter fx', tags: ['fx', 'riser', 'short'] },
    { id: 'fx-riser-short-03', name: 'Short Riser 3', note: 'D3', midiNote: 62, freesoundQuery: 'quick riser fx', tags: ['fx', 'riser', 'short'] },
    { id: 'fx-riser-short-04', name: 'Short Riser 4', note: 'D#3', midiNote: 63, freesoundQuery: 'fast riser fx', tags: ['fx', 'riser', 'short'] },
    { id: 'fx-riser-short-05', name: 'Short Riser 5', note: 'E3', midiNote: 64, freesoundQuery: 'riser 1 bar', tags: ['fx', 'riser', 'short'] },

    // Medium risers (5 variations)
    { id: 'fx-riser-medium-01', name: 'Medium Riser 1', note: 'F3', midiNote: 65, freesoundQuery: 'medium riser fx', tags: ['fx', 'riser', 'medium'] },
    { id: 'fx-riser-medium-02', name: 'Medium Riser 2', note: 'F#3', midiNote: 66, freesoundQuery: 'uplifter 2 bar', tags: ['fx', 'riser', 'medium'] },
    { id: 'fx-riser-medium-03', name: 'Medium Riser 3', note: 'G3', midiNote: 67, freesoundQuery: 'riser 4 bar', tags: ['fx', 'riser', 'medium'] },
    { id: 'fx-riser-medium-04', name: 'Medium Riser 4', note: 'G#3', midiNote: 68, freesoundQuery: 'build up riser', tags: ['fx', 'riser', 'medium'] },
    { id: 'fx-riser-medium-05', name: 'Medium Riser 5', note: 'A3', midiNote: 69, freesoundQuery: 'tension riser', tags: ['fx', 'riser', 'medium'] },

    // Long risers (5 variations)
    { id: 'fx-riser-long-01', name: 'Long Riser 1', note: 'A#3', midiNote: 70, freesoundQuery: 'long riser fx', tags: ['fx', 'riser', 'long'] },
    { id: 'fx-riser-long-02', name: 'Long Riser 2', note: 'B3', midiNote: 71, freesoundQuery: 'riser 8 bar', tags: ['fx', 'riser', 'long'] },
    { id: 'fx-riser-long-03', name: 'Long Riser 3', note: 'C4', midiNote: 72, freesoundQuery: 'long uplifter', tags: ['fx', 'riser', 'long'] },
    { id: 'fx-riser-long-04', name: 'Long Riser 4', note: 'C#4', midiNote: 73, freesoundQuery: 'extended riser', tags: ['fx', 'riser', 'long'] },
    { id: 'fx-riser-long-05', name: 'Long Riser 5', note: 'D4', midiNote: 74, freesoundQuery: 'epic riser', tags: ['fx', 'riser', 'long'] },

    // Special risers (5 variations)
    { id: 'fx-riser-noise', name: 'Noise Riser', note: 'D#4', midiNote: 75, freesoundQuery: 'noise riser fx', tags: ['fx', 'riser', 'noise'] },
    { id: 'fx-riser-filtered', name: 'Filtered Riser', note: 'E4', midiNote: 76, freesoundQuery: 'filtered riser fx', tags: ['fx', 'riser', 'filtered'] },
    { id: 'fx-riser-vocal', name: 'Vocal Riser', note: 'F4', midiNote: 77, freesoundQuery: 'vocal riser fx', tags: ['fx', 'riser', 'vocal'] },
    { id: 'fx-riser-impact', name: 'Impact Riser', note: 'F#4', midiNote: 78, freesoundQuery: 'impact riser fx', tags: ['fx', 'riser', 'impact'] },
    { id: 'fx-riser-orchestral', name: 'Orchestral Riser', note: 'G4', midiNote: 79, freesoundQuery: 'orchestral riser', tags: ['fx', 'riser', 'orchestral'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// FX DOWNLIFTERS PACK (20 SAMPLES)
// ============================================================================

/**
 * FX downlifters for post-drop transitions
 */
export const PACK_FX_DOWNLIFTERS: SamplePack = {
  id: 'fx-downlifters',
  name: 'FX Downlifters',
  category: 'fx',
  description: 'Downlifters and falls for post-drop transitions and breakdowns',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 20,
  icon: '📉',
  tags: ['fx', 'downlifter', 'fall', 'transition'],
  samples: [
    // Short downlifters (5 variations)
    { id: 'fx-down-short-01', name: 'Short Downlifter 1', note: 'C3', midiNote: 60, freesoundQuery: 'short downlifter fx', tags: ['fx', 'downlifter', 'short'] },
    { id: 'fx-down-short-02', name: 'Short Downlifter 2', note: 'C#3', midiNote: 61, freesoundQuery: 'quick fall fx', tags: ['fx', 'downlifter', 'short'] },
    { id: 'fx-down-short-03', name: 'Short Downlifter 3', note: 'D3', midiNote: 62, freesoundQuery: 'fast downlifter', tags: ['fx', 'downlifter', 'short'] },
    { id: 'fx-down-short-04', name: 'Short Downlifter 4', note: 'D#3', midiNote: 63, freesoundQuery: 'pitch down fx short', tags: ['fx', 'downlifter', 'short'] },
    { id: 'fx-down-short-05', name: 'Short Downlifter 5', note: 'E3', midiNote: 64, freesoundQuery: 'drop fx short', tags: ['fx', 'downlifter', 'short'] },

    // Medium downlifters (5 variations)
    { id: 'fx-down-medium-01', name: 'Medium Downlifter 1', note: 'F3', midiNote: 65, freesoundQuery: 'medium downlifter fx', tags: ['fx', 'downlifter', 'medium'] },
    { id: 'fx-down-medium-02', name: 'Medium Downlifter 2', note: 'F#3', midiNote: 66, freesoundQuery: 'downlifter 2 bar', tags: ['fx', 'downlifter', 'medium'] },
    { id: 'fx-down-medium-03', name: 'Medium Downlifter 3', note: 'G3', midiNote: 67, freesoundQuery: 'fall fx 4 bar', tags: ['fx', 'downlifter', 'medium'] },
    { id: 'fx-down-medium-04', name: 'Medium Downlifter 4', note: 'G#3', midiNote: 68, freesoundQuery: 'pitch down medium', tags: ['fx', 'downlifter', 'medium'] },
    { id: 'fx-down-medium-05', name: 'Medium Downlifter 5', note: 'A3', midiNote: 69, freesoundQuery: 'breakdown fall fx', tags: ['fx', 'downlifter', 'medium'] },

    // Long downlifters (5 variations)
    { id: 'fx-down-long-01', name: 'Long Downlifter 1', note: 'A#3', midiNote: 70, freesoundQuery: 'long downlifter fx', tags: ['fx', 'downlifter', 'long'] },
    { id: 'fx-down-long-02', name: 'Long Downlifter 2', note: 'B3', midiNote: 71, freesoundQuery: 'downlifter 8 bar', tags: ['fx', 'downlifter', 'long'] },
    { id: 'fx-down-long-03', name: 'Long Downlifter 3', note: 'C4', midiNote: 72, freesoundQuery: 'extended fall fx', tags: ['fx', 'downlifter', 'long'] },
    { id: 'fx-down-long-04', name: 'Long Downlifter 4', note: 'C#4', midiNote: 73, freesoundQuery: 'long pitch down', tags: ['fx', 'downlifter', 'long'] },
    { id: 'fx-down-long-05', name: 'Long Downlifter 5', note: 'D4', midiNote: 74, freesoundQuery: 'slow downlifter', tags: ['fx', 'downlifter', 'long'] },

    // Special downlifters (5 variations)
    { id: 'fx-down-noise', name: 'Noise Downlifter', note: 'D#4', midiNote: 75, freesoundQuery: 'noise downlifter fx', tags: ['fx', 'downlifter', 'noise'] },
    { id: 'fx-down-filtered', name: 'Filtered Downlifter', note: 'E4', midiNote: 76, freesoundQuery: 'filtered downlifter', tags: ['fx', 'downlifter', 'filtered'] },
    { id: 'fx-down-vocal', name: 'Vocal Downlifter', note: 'F4', midiNote: 77, freesoundQuery: 'vocal downlifter fx', tags: ['fx', 'downlifter', 'vocal'] },
    { id: 'fx-down-wind', name: 'Wind Down', note: 'F#4', midiNote: 78, freesoundQuery: 'wind down fx', tags: ['fx', 'downlifter', 'wind'] },
    { id: 'fx-down-woosh', name: 'Woosh Down', note: 'G4', midiNote: 79, freesoundQuery: 'woosh down fx', tags: ['fx', 'downlifter', 'woosh'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// FX IMPACTS PACK (20 SAMPLES)
// ============================================================================

/**
 * Impact FX for accents and transitions
 */
export const PACK_FX_IMPACTS: SamplePack = {
  id: 'fx-impacts',
  name: 'FX Impacts',
  category: 'fx',
  description: 'Impact sounds for accents, transitions, and punctuation',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 20,
  icon: '💫',
  tags: ['fx', 'impact', 'hit', 'accent'],
  samples: [
    // Bass impacts (5 variations)
    { id: 'fx-impact-bass-01', name: 'Bass Impact 1', note: 'C3', midiNote: 60, freesoundQuery: 'bass impact fx', tags: ['fx', 'impact', 'bass'] },
    { id: 'fx-impact-bass-02', name: 'Bass Impact 2', note: 'C#3', midiNote: 61, freesoundQuery: 'sub bass impact', tags: ['fx', 'impact', 'bass'] },
    { id: 'fx-impact-bass-03', name: 'Bass Impact 3', note: 'D3', midiNote: 62, freesoundQuery: 'low impact fx', tags: ['fx', 'impact', 'bass'] },
    { id: 'fx-impact-bass-04', name: 'Bass Impact 4', note: 'D#3', midiNote: 63, freesoundQuery: 'boom impact fx', tags: ['fx', 'impact', 'bass'] },
    { id: 'fx-impact-bass-05', name: 'Bass Impact 5', note: 'E3', midiNote: 64, freesoundQuery: 'thud impact fx', tags: ['fx', 'impact', 'bass'] },

    // Mid impacts (5 variations)
    { id: 'fx-impact-mid-01', name: 'Mid Impact 1', note: 'F3', midiNote: 65, freesoundQuery: 'mid impact fx', tags: ['fx', 'impact', 'mid'] },
    { id: 'fx-impact-mid-02', name: 'Mid Impact 2', note: 'F#3', midiNote: 66, freesoundQuery: 'punch impact fx', tags: ['fx', 'impact', 'mid'] },
    { id: 'fx-impact-mid-03', name: 'Mid Impact 3', note: 'G3', midiNote: 67, freesoundQuery: 'hit impact fx', tags: ['fx', 'impact', 'mid'] },
    { id: 'fx-impact-mid-04', name: 'Mid Impact 4', note: 'G#3', midiNote: 68, freesoundQuery: 'smack impact fx', tags: ['fx', 'impact', 'mid'] },
    { id: 'fx-impact-mid-05', name: 'Mid Impact 5', note: 'A3', midiNote: 69, freesoundQuery: 'thump impact fx', tags: ['fx', 'impact', 'mid'] },

    // High impacts (5 variations)
    { id: 'fx-impact-high-01', name: 'High Impact 1', note: 'A#3', midiNote: 70, freesoundQuery: 'high impact fx', tags: ['fx', 'impact', 'high'] },
    { id: 'fx-impact-high-02', name: 'High Impact 2', note: 'B3', midiNote: 71, freesoundQuery: 'bright impact fx', tags: ['fx', 'impact', 'high'] },
    { id: 'fx-impact-high-03', name: 'High Impact 3', note: 'C4', midiNote: 72, freesoundQuery: 'metallic impact fx', tags: ['fx', 'impact', 'high'] },
    { id: 'fx-impact-high-04', name: 'High Impact 4', note: 'C#4', midiNote: 73, freesoundQuery: 'crash impact fx', tags: ['fx', 'impact', 'high'] },
    { id: 'fx-impact-high-05', name: 'High Impact 5', note: 'D4', midiNote: 74, freesoundQuery: 'splash impact fx', tags: ['fx', 'impact', 'high'] },

    // Special impacts (5 variations)
    { id: 'fx-impact-cinematic', name: 'Cinematic Impact', note: 'D#4', midiNote: 75, freesoundQuery: 'cinematic impact fx', tags: ['fx', 'impact', 'cinematic'] },
    { id: 'fx-impact-explosion', name: 'Explosion Impact', note: 'E4', midiNote: 76, freesoundQuery: 'explosion impact fx', tags: ['fx', 'impact', 'explosion'] },
    { id: 'fx-impact-reverse', name: 'Reverse Impact', note: 'F4', midiNote: 77, freesoundQuery: 'reverse impact fx', tags: ['fx', 'impact', 'reverse'] },
    { id: 'fx-impact-distorted', name: 'Distorted Impact', note: 'F#4', midiNote: 78, freesoundQuery: 'distorted impact fx', tags: ['fx', 'impact', 'distorted'] },
    { id: 'fx-impact-glitch', name: 'Glitch Impact', note: 'G4', midiNote: 79, freesoundQuery: 'glitch impact fx', tags: ['fx', 'impact', 'glitch'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// FOLEY SOUNDS PACK (30 SAMPLES)
// ============================================================================

/**
 * Foley sounds for organic textures and realism
 */
export const PACK_FOLEY_SOUNDS: SamplePack = {
  id: 'foley-sounds',
  name: 'Foley Sounds',
  category: 'foley',
  description: 'Organic foley sounds for adding texture and realism',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🎬',
  tags: ['foley', 'sound-design', 'organic', 'texture'],
  samples: [
    // Impacts and hits (10 variations)
    { id: 'foley-wood-hit', name: 'Wood Hit', note: 'C3', midiNote: 60, freesoundQuery: 'wood hit foley', tags: ['foley', 'wood', 'hit'] },
    { id: 'foley-metal-clang', name: 'Metal Clang', note: 'C#3', midiNote: 61, freesoundQuery: 'metal clang foley', tags: ['foley', 'metal', 'clang'] },
    { id: 'foley-glass-break', name: 'Glass Break', note: 'D3', midiNote: 62, freesoundQuery: 'glass break foley', tags: ['foley', 'glass', 'break'] },
    { id: 'foley-paper-crumple', name: 'Paper Crumple', note: 'D#3', midiNote: 63, freesoundQuery: 'paper crumple foley', tags: ['foley', 'paper', 'crumple'] },
    { id: 'foley-cloth-rustle', name: 'Cloth Rustle', note: 'E3', midiNote: 64, freesoundQuery: 'cloth rustle foley', tags: ['foley', 'cloth', 'rustle'] },
    { id: 'foley-door-slam', name: 'Door Slam', note: 'F3', midiNote: 65, freesoundQuery: 'door slam foley', tags: ['foley', 'door', 'slam'] },
    { id: 'foley-footstep', name: 'Footstep', note: 'F#3', midiNote: 66, freesoundQuery: 'footstep foley', tags: ['foley', 'footstep'] },
    { id: 'foley-click', name: 'Click', note: 'G3', midiNote: 67, freesoundQuery: 'click foley', tags: ['foley', 'click'] },
    { id: 'foley-snap', name: 'Snap', note: 'G#3', midiNote: 68, freesoundQuery: 'snap foley', tags: ['foley', 'snap'] },
    { id: 'foley-scratch', name: 'Scratch', note: 'A3', midiNote: 69, freesoundQuery: 'scratch foley', tags: ['foley', 'scratch'] },

    // Movement sounds (10 variations)
    { id: 'foley-whoosh', name: 'Whoosh', note: 'A#3', midiNote: 70, freesoundQuery: 'whoosh foley', tags: ['foley', 'whoosh'] },
    { id: 'foley-swish', name: 'Swish', note: 'B3', midiNote: 71, freesoundQuery: 'swish foley', tags: ['foley', 'swish'] },
    { id: 'foley-drag', name: 'Drag', note: 'C4', midiNote: 72, freesoundQuery: 'drag foley', tags: ['foley', 'drag'] },
    { id: 'foley-slide', name: 'Slide', note: 'C#4', midiNote: 73, freesoundQuery: 'slide foley', tags: ['foley', 'slide'] },
    { id: 'foley-zip', name: 'Zip', note: 'D4', midiNote: 74, freesoundQuery: 'zip foley', tags: ['foley', 'zip'] },
    { id: 'foley-rattle', name: 'Rattle', note: 'D#4', midiNote: 75, freesoundQuery: 'rattle foley', tags: ['foley', 'rattle'] },
    { id: 'foley-shake', name: 'Shake', note: 'E4', midiNote: 76, freesoundQuery: 'shake foley', tags: ['foley', 'shake'] },
    { id: 'foley-spin', name: 'Spin', note: 'F4', midiNote: 77, freesoundQuery: 'spin foley', tags: ['foley', 'spin'] },
    { id: 'foley-flutter', name: 'Flutter', note: 'F#4', midiNote: 78, freesoundQuery: 'flutter foley', tags: ['foley', 'flutter'] },
    { id: 'foley-flap', name: 'Flap', note: 'G4', midiNote: 79, freesoundQuery: 'flap foley', tags: ['foley', 'flap'] },

    // Environmental sounds (10 variations)
    { id: 'foley-water-drop', name: 'Water Drop', note: 'G#4', midiNote: 80, freesoundQuery: 'water drop foley', tags: ['foley', 'water', 'drop'] },
    { id: 'foley-water-splash', name: 'Water Splash', note: 'A4', midiNote: 81, freesoundQuery: 'water splash foley', tags: ['foley', 'water', 'splash'] },
    { id: 'foley-fire-crackle', name: 'Fire Crackle', note: 'A#4', midiNote: 82, freesoundQuery: 'fire crackle foley', tags: ['foley', 'fire', 'crackle'] },
    { id: 'foley-wind-gust', name: 'Wind Gust', note: 'B4', midiNote: 83, freesoundQuery: 'wind gust foley', tags: ['foley', 'wind', 'gust'] },
    { id: 'foley-leaves-rustle', name: 'Leaves Rustle', note: 'C5', midiNote: 84, freesoundQuery: 'leaves rustle foley', tags: ['foley', 'leaves', 'rustle'] },
    { id: 'foley-gravel', name: 'Gravel', note: 'C#5', midiNote: 85, freesoundQuery: 'gravel foley', tags: ['foley', 'gravel'] },
    { id: 'foley-dirt', name: 'Dirt', note: 'D5', midiNote: 86, freesoundQuery: 'dirt foley', tags: ['foley', 'dirt'] },
    { id: 'foley-stone', name: 'Stone', note: 'D#5', midiNote: 87, freesoundQuery: 'stone foley', tags: ['foley', 'stone'] },
    { id: 'foley-organic', name: 'Organic Texture', note: 'E5', midiNote: 88, freesoundQuery: 'organic texture foley', tags: ['foley', 'organic', 'texture'] },
    { id: 'foley-creak', name: 'Creak', note: 'F5', midiNote: 89, freesoundQuery: 'creak foley', tags: ['foley', 'creak'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// ORCHESTRAL HITS PACK (30 SAMPLES)
// ============================================================================

/**
 * Orchestral hits and stabs for dramatic accents
 */
export const PACK_ORCHESTRAL_HITS: SamplePack = {
  id: 'orchestral-hits',
  name: 'Orchestral Hits',
  category: 'orchestral',
  description: 'Dramatic orchestral hits, stabs, and accents',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🎻',
  tags: ['orchestral', 'hit', 'stab', 'accent', 'dramatic'],
  samples: [
    // String hits (10 variations)
    { id: 'orch-string-stab-high', name: 'String Stab High', note: 'C4', midiNote: 72, freesoundQuery: 'orchestral string stab high', tags: ['orchestral', 'string', 'stab', 'high'] },
    { id: 'orch-string-stab-mid', name: 'String Stab Mid', note: 'C3', midiNote: 60, freesoundQuery: 'orchestral string stab', tags: ['orchestral', 'string', 'stab', 'mid'] },
    { id: 'orch-string-stab-low', name: 'String Stab Low', note: 'C2', midiNote: 48, freesoundQuery: 'orchestral string stab low', tags: ['orchestral', 'string', 'stab', 'low'] },
    { id: 'orch-string-pizz', name: 'String Pizzicato', note: 'D3', midiNote: 62, freesoundQuery: 'orchestral pizzicato', tags: ['orchestral', 'string', 'pizzicato'] },
    { id: 'orch-string-tremolo', name: 'String Tremolo', note: 'D#3', midiNote: 63, freesoundQuery: 'orchestral string tremolo', tags: ['orchestral', 'string', 'tremolo'] },
    { id: 'orch-string-spiccato', name: 'String Spiccato', note: 'E3', midiNote: 64, freesoundQuery: 'orchestral spiccato', tags: ['orchestral', 'string', 'spiccato'] },
    { id: 'orch-string-col-legno', name: 'String Col Legno', note: 'F3', midiNote: 65, freesoundQuery: 'col legno strings', tags: ['orchestral', 'string', 'col-legno'] },
    { id: 'orch-string-cluster', name: 'String Cluster', note: 'F#3', midiNote: 66, freesoundQuery: 'orchestral string cluster', tags: ['orchestral', 'string', 'cluster'] },
    { id: 'orch-string-accent', name: 'String Accent', note: 'G3', midiNote: 67, freesoundQuery: 'orchestral string accent', tags: ['orchestral', 'string', 'accent'] },
    { id: 'orch-string-marcato', name: 'String Marcato', note: 'G#3', midiNote: 68, freesoundQuery: 'orchestral string marcato', tags: ['orchestral', 'string', 'marcato'] },

    // Brass hits (10 variations)
    { id: 'orch-brass-stab', name: 'Brass Stab', note: 'A3', midiNote: 69, freesoundQuery: 'orchestral brass stab', tags: ['orchestral', 'brass', 'stab'] },
    { id: 'orch-brass-accent', name: 'Brass Accent', note: 'A#3', midiNote: 70, freesoundQuery: 'orchestral brass accent', tags: ['orchestral', 'brass', 'accent'] },
    { id: 'orch-brass-fanfare', name: 'Brass Fanfare', note: 'B3', midiNote: 71, freesoundQuery: 'orchestral brass fanfare', tags: ['orchestral', 'brass', 'fanfare'] },
    { id: 'orch-brass-hit-low', name: 'Brass Hit Low', note: 'C3', midiNote: 48, freesoundQuery: 'orchestral brass hit low', tags: ['orchestral', 'brass', 'hit', 'low'] },
    { id: 'orch-brass-hit-high', name: 'Brass Hit High', note: 'C5', midiNote: 84, freesoundQuery: 'orchestral brass hit high', tags: ['orchestral', 'brass', 'hit', 'high'] },
    { id: 'orch-trumpet-stab', name: 'Trumpet Stab', note: 'C#4', midiNote: 73, freesoundQuery: 'trumpet stab', tags: ['orchestral', 'brass', 'trumpet', 'stab'] },
    { id: 'orch-trombone-stab', name: 'Trombone Stab', note: 'D4', midiNote: 74, freesoundQuery: 'trombone stab', tags: ['orchestral', 'brass', 'trombone', 'stab'] },
    { id: 'orch-french-horn-stab', name: 'French Horn Stab', note: 'D#4', midiNote: 75, freesoundQuery: 'french horn stab', tags: ['orchestral', 'brass', 'horn', 'stab'] },
    { id: 'orch-brass-ensemble', name: 'Brass Ensemble Hit', note: 'E4', midiNote: 76, freesoundQuery: 'brass ensemble hit', tags: ['orchestral', 'brass', 'ensemble', 'hit'] },
    { id: 'orch-brass-sforzando', name: 'Brass Sforzando', note: 'F4', midiNote: 77, freesoundQuery: 'brass sforzando', tags: ['orchestral', 'brass', 'sforzando'] },

    // Percussion hits (10 variations)
    { id: 'orch-timpani-hit', name: 'Timpani Hit', note: 'C2', midiNote: 36, freesoundQuery: 'timpani hit', tags: ['orchestral', 'percussion', 'timpani', 'hit'] },
    { id: 'orch-bass-drum-hit', name: 'Bass Drum Hit', note: 'C#2', midiNote: 37, freesoundQuery: 'orchestral bass drum hit', tags: ['orchestral', 'percussion', 'bass-drum', 'hit'] },
    { id: 'orch-cymbal-crash', name: 'Cymbal Crash', note: 'F#4', midiNote: 78, freesoundQuery: 'orchestral cymbal crash', tags: ['orchestral', 'percussion', 'cymbal', 'crash'] },
    { id: 'orch-gong-hit', name: 'Gong Hit', note: 'D2', midiNote: 38, freesoundQuery: 'gong hit', tags: ['orchestral', 'percussion', 'gong', 'hit'] },
    { id: 'orch-tam-tam', name: 'Tam Tam', note: 'D#2', midiNote: 39, freesoundQuery: 'tam tam hit', tags: ['orchestral', 'percussion', 'tam-tam', 'hit'] },
    { id: 'orch-snare-roll', name: 'Snare Roll', note: 'E2', midiNote: 40, freesoundQuery: 'orchestral snare roll', tags: ['orchestral', 'percussion', 'snare', 'roll'] },
    { id: 'orch-triangle-hit', name: 'Triangle Hit', note: 'G4', midiNote: 79, freesoundQuery: 'triangle hit', tags: ['orchestral', 'percussion', 'triangle', 'hit'] },
    { id: 'orch-suspended-cymbal', name: 'Suspended Cymbal', note: 'G#4', midiNote: 80, freesoundQuery: 'suspended cymbal hit', tags: ['orchestral', 'percussion', 'cymbal'] },
    { id: 'orch-crash-cymbal-choke', name: 'Crash Cymbal Choke', note: 'A4', midiNote: 81, freesoundQuery: 'crash cymbal choke', tags: ['orchestral', 'percussion', 'cymbal', 'choke'] },
    { id: 'orch-perc-ensemble', name: 'Percussion Ensemble Hit', note: 'F2', midiNote: 41, freesoundQuery: 'orchestral percussion ensemble hit', tags: ['orchestral', 'percussion', 'ensemble', 'hit'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// WORLD PERCUSSION PACK (30 SAMPLES)
// ============================================================================

/**
 * World percussion instruments from various cultures
 */
export const PACK_WORLD_PERCUSSION: SamplePack = {
  id: 'world-percussion',
  name: 'World Percussion',
  category: 'world',
  description: 'Percussion instruments from around the world',
  version: '1.0.0',
  author: 'Cardplay',
  license: 'CC0 (Creative Commons Zero)',
  sampleCount: 30,
  icon: '🌍',
  tags: ['world', 'percussion', 'ethnic', 'global'],
  samples: [
    // African percussion (10 variations)
    { id: 'world-djembe-bass', name: 'Djembe Bass', note: 'C2', midiNote: 48, freesoundQuery: 'djembe bass', tags: ['world', 'african', 'djembe', 'bass'] },
    { id: 'world-djembe-tone', name: 'Djembe Tone', note: 'C3', midiNote: 60, freesoundQuery: 'djembe tone', tags: ['world', 'african', 'djembe', 'tone'] },
    { id: 'world-djembe-slap', name: 'Djembe Slap', note: 'C4', midiNote: 72, freesoundQuery: 'djembe slap', tags: ['world', 'african', 'djembe', 'slap'] },
    { id: 'world-conga-low', name: 'Conga Low', note: 'C#2', midiNote: 49, freesoundQuery: 'conga low', tags: ['world', 'african', 'conga', 'low'] },
    { id: 'world-conga-high', name: 'Conga High', note: 'C#3', midiNote: 61, freesoundQuery: 'conga high', tags: ['world', 'african', 'conga', 'high'] },
    { id: 'world-conga-slap', name: 'Conga Slap', note: 'C#4', midiNote: 73, freesoundQuery: 'conga slap', tags: ['world', 'african', 'conga', 'slap'] },
    { id: 'world-talking-drum', name: 'Talking Drum', note: 'D3', midiNote: 62, freesoundQuery: 'talking drum', tags: ['world', 'african', 'talking-drum'] },
    { id: 'world-udu-drum', name: 'Udu Drum', note: 'D#3', midiNote: 63, freesoundQuery: 'udu drum', tags: ['world', 'african', 'udu'] },
    { id: 'world-shekere', name: 'Shekere', note: 'E3', midiNote: 64, freesoundQuery: 'shekere', tags: ['world', 'african', 'shekere'] },
    { id: 'world-kalimba', name: 'Kalimba', note: 'F3', midiNote: 65, freesoundQuery: 'kalimba note', tags: ['world', 'african', 'kalimba'] },

    // Latin percussion (10 variations)
    { id: 'world-bongo-low', name: 'Bongo Low', note: 'F#3', midiNote: 66, freesoundQuery: 'bongo low', tags: ['world', 'latin', 'bongo', 'low'] },
    { id: 'world-bongo-high', name: 'Bongo High', note: 'G3', midiNote: 67, freesoundQuery: 'bongo high', tags: ['world', 'latin', 'bongo', 'high'] },
    { id: 'world-timbales-low', name: 'Timbales Low', note: 'G#3', midiNote: 68, freesoundQuery: 'timbales low', tags: ['world', 'latin', 'timbales', 'low'] },
    { id: 'world-timbales-high', name: 'Timbales High', note: 'A3', midiNote: 69, freesoundQuery: 'timbales high', tags: ['world', 'latin', 'timbales', 'high'] },
    { id: 'world-clave', name: 'Clave', note: 'A#3', midiNote: 70, freesoundQuery: 'clave', tags: ['world', 'latin', 'clave'] },
    { id: 'world-guiro-scrape', name: 'Guiro Scrape', note: 'B3', midiNote: 71, freesoundQuery: 'guiro scrape', tags: ['world', 'latin', 'guiro'] },
    { id: 'world-cabasa', name: 'Cabasa', note: 'C4', midiNote: 72, freesoundQuery: 'cabasa', tags: ['world', 'latin', 'cabasa'] },
    { id: 'world-agogo-high', name: 'Agogo High', note: 'C#4', midiNote: 73, freesoundQuery: 'agogo bell high', tags: ['world', 'latin', 'agogo', 'high'] },
    { id: 'world-agogo-low', name: 'Agogo Low', note: 'D4', midiNote: 74, freesoundQuery: 'agogo bell low', tags: ['world', 'latin', 'agogo', 'low'] },
    { id: 'world-surdo', name: 'Surdo', note: 'D#4', midiNote: 75, freesoundQuery: 'surdo drum', tags: ['world', 'latin', 'surdo'] },

    // Asian/Middle Eastern percussion (10 variations)
    { id: 'world-tabla-dayan', name: 'Tabla Dayan', note: 'E4', midiNote: 76, freesoundQuery: 'tabla dayan', tags: ['world', 'asian', 'tabla', 'dayan'] },
    { id: 'world-tabla-bayan', name: 'Tabla Bayan', note: 'F4', midiNote: 77, freesoundQuery: 'tabla bayan', tags: ['world', 'asian', 'tabla', 'bayan'] },
    { id: 'world-darbuka-doum', name: 'Darbuka Doum', note: 'F#4', midiNote: 78, freesoundQuery: 'darbuka doum', tags: ['world', 'middle-eastern', 'darbuka', 'doum'] },
    { id: 'world-darbuka-tek', name: 'Darbuka Tek', note: 'G4', midiNote: 79, freesoundQuery: 'darbuka tek', tags: ['world', 'middle-eastern', 'darbuka', 'tek'] },
    { id: 'world-riq', name: 'Riq', note: 'G#4', midiNote: 80, freesoundQuery: 'riq tambourine', tags: ['world', 'middle-eastern', 'riq'] },
    { id: 'world-frame-drum', name: 'Frame Drum', note: 'A4', midiNote: 81, freesoundQuery: 'frame drum', tags: ['world', 'middle-eastern', 'frame-drum'] },
    { id: 'world-taiko', name: 'Taiko', note: 'A#4', midiNote: 82, freesoundQuery: 'taiko drum', tags: ['world', 'asian', 'taiko'] },
    { id: 'world-temple-bell', name: 'Temple Bell', note: 'B4', midiNote: 83, freesoundQuery: 'temple bell', tags: ['world', 'asian', 'bell'] },
    { id: 'world-singing-bowl', name: 'Singing Bowl', note: 'C5', midiNote: 84, freesoundQuery: 'singing bowl', tags: ['world', 'asian', 'singing-bowl'] },
    { id: 'world-woodblock', name: 'Wooden Block', note: 'C#5', midiNote: 85, freesoundQuery: 'wooden block percussion', tags: ['world', 'percussion', 'woodblock'] },
  ],
  freesoundAttribution: [],
};

// ============================================================================
// PACK REGISTRY
// ============================================================================

/**
 * Global registry of all available sample packs
 */
export const SAMPLE_PACK_REGISTRY = new Map<string, SamplePack>([
  [PACK_808_DRUMS.id, PACK_808_DRUMS],
  [PACK_TRAP_DRUMS.id, PACK_TRAP_DRUMS],
  [PACK_ACOUSTIC_DRUMS.id, PACK_ACOUSTIC_DRUMS],
  [PACK_SYNTH_ONE_SHOTS.id, PACK_SYNTH_ONE_SHOTS],
  [PACK_BASS_HITS.id, PACK_BASS_HITS],
  [PACK_GUITAR_LOOPS.id, PACK_GUITAR_LOOPS],
  [PACK_PIANO_CHORDS.id, PACK_PIANO_CHORDS],
  [PACK_VOCAL_CHOPS.id, PACK_VOCAL_CHOPS],
  [PACK_AMBIENT_TEXTURES.id, PACK_AMBIENT_TEXTURES],
  [PACK_FX_RISERS.id, PACK_FX_RISERS],
  [PACK_FX_DOWNLIFTERS.id, PACK_FX_DOWNLIFTERS],
  [PACK_FX_IMPACTS.id, PACK_FX_IMPACTS],
  [PACK_FOLEY_SOUNDS.id, PACK_FOLEY_SOUNDS],
  [PACK_ORCHESTRAL_HITS.id, PACK_ORCHESTRAL_HITS],
  [PACK_WORLD_PERCUSSION.id, PACK_WORLD_PERCUSSION],
]);

/**
 * Get all packs in a category
 */
export function getPacksByCategory(category: SamplePackCategory): readonly SamplePack[] {
  return Array.from(SAMPLE_PACK_REGISTRY.values())
    .filter(pack => pack.category === category);
}

/**
 * Get pack by ID
 */
export function getPack(packId: string): SamplePack | undefined {
  return SAMPLE_PACK_REGISTRY.get(packId);
}

/**
 * Search packs by tag
 */
export function searchPacksByTag(tag: string): readonly SamplePack[] {
  const normalizedTag = tag.toLowerCase();
  return Array.from(SAMPLE_PACK_REGISTRY.values())
    .filter(pack => pack.tags.some(t => t.toLowerCase().includes(normalizedTag)));
}

// ============================================================================
// PACK LOADER
// ============================================================================

/**
 * Sample pack loader with progress tracking and caching
 */
export class SamplePackLoader {
  private readonly audioContext: AudioContext;
  private readonly loadedPacks = new Map<string, SamplePack>();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Load a sample pack from Freesound
   */
  async loadPack(
    packId: string,
    onProgress?: (status: PackLoadStatus) => void
  ): Promise<SamplePack> {
    const packDef = getPack(packId);
    if (!packDef) {
      throw new Error(`Unknown pack: ${packId}`);
    }

    // Check if already loaded
    const cached = this.loadedPacks.get(packId);
    if (cached) {
      return cached;
    }

    const status: PackLoadStatus = {
      packId,
      loaded: 0,
      total: packDef.sampleCount,
      progress: 0,
      status: 'loading',
    };

    const updateStatus = (loaded: number) => {
      status.loaded = loaded;
      status.progress = loaded / status.total;
      onProgress?.(status);
    };

    updateStatus(0);

    // Load all samples
    const loadedSamples: PackSample[] = [];
    const attributions: FreesoundAttribution[] = [];

    for (let i = 0; i < packDef.samples.length; i++) {
      const sample = packDef.samples[i];
      if (!sample) continue;
      
      try {
        // Search for the sample on Freesound
        const results = await searchFreesoundSamples(sample.freesoundQuery || sample.name, 1);
        
        if (results.length > 0) {
          const freesoundSample = results[0];
          if (!freesoundSample) continue;
          
          // Fetch and decode the audio
          const buffer = await fetchFreesoundSample(freesoundSample, this.audioContext, 'hq');
          
          // Create loaded sample
          const loadedSample: PackSample = {
            id: sample.id,
            name: sample.name,
            ...(sample.note && { note: sample.note }),
            ...(sample.midiNote !== undefined && { midiNote: sample.midiNote }),
            tags: sample.tags,
            ...(sample.freesoundQuery && { freesoundQuery: sample.freesoundQuery }),
            freesoundId: freesoundSample.id,
            buffer,
          };
          
          loadedSamples.push(loadedSample);
          
          // Track attribution
          attributions.push({
            sampleId: freesoundSample.id,
            name: freesoundSample.name,
            username: freesoundSample.username,
            url: freesoundSample.url,
            license: 'CC0',
          });
        } else {
          // No sample found, skip
          console.warn(`No Freesound sample found for: ${sample.name}`);
          loadedSamples.push(sample);
        }
      } catch (error) {
        console.error(`Failed to load sample: ${sample.name}`, error);
        loadedSamples.push(sample);
      }
      
      updateStatus(i + 1);
      
      // Yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Create loaded pack
    const loadedPack: SamplePack = {
      ...packDef,
      samples: loadedSamples,
      freesoundAttribution: attributions,
    };

    this.loadedPacks.set(packId, loadedPack);
    
    status.status = 'complete';
    status.loaded = status.total;
    status.progress = 1;
    onProgress?.(status);

    return loadedPack;
  }

  /**
   * Get a loaded pack (without loading)
   */
  getLoadedPack(packId: string): SamplePack | undefined {
    return this.loadedPacks.get(packId);
  }

  /**
   * Unload a pack from memory
   */
  unloadPack(packId: string): void {
    this.loadedPacks.delete(packId);
  }

  /**
   * Get all loaded pack IDs
   */
  getLoadedPackIds(): readonly string[] {
    return Array.from(this.loadedPacks.keys());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  searchFreesoundSamples,
  fetchFreesoundSample,
} from '../cards/drum-machine';
