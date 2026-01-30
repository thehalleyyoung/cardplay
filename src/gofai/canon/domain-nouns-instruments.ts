/**
 * GOFAI Domain Nouns — Instruments and Sound Sources
 * 
 * Comprehensive vocabulary of musical instruments, synthesizers, samplers,
 * and sound sources that can be referenced in natural language commands.
 * 
 * Part of Phase 1 vocabulary expansion (Steps 051-100) from gofai_goalB.md.
 * Each lexeme includes synonyms, categories, and semantic bindings.
 * 
 * @module gofai/canon/domain-nouns-instruments
 */

import type { Lexeme, LexemeId, GofaiId } from './types';

/**
 * Instrument category classifications
 */
export type InstrumentCategory =
  | 'percussion'
  | 'melodic-percussion'
  | 'string'
  | 'wind'
  | 'brass'
  | 'keyboard'
  | 'synthesizer'
  | 'sampler'
  | 'voice'
  | 'electronic'
  | 'sound-effect';

/**
 * Instrument lexeme with extended metadata
 */
export interface InstrumentLexeme extends Lexeme {
  readonly instrumentCategory: InstrumentCategory;
  readonly roleHints: readonly string[];      // Common musical roles
  readonly registerRange?: readonly [number, number]; // MIDI note range if applicable
  readonly timbreCharacteristics: readonly string[];  // acoustic, synthetic, percussive, etc.
}

// =============================================================================
// DRUM KIT COMPONENTS (Percussion)
// =============================================================================

export const NOUN_KICK: InstrumentLexeme = {
  id: 'lex:noun:lex:noun:kick' as LexemeId,
  lemma: 'kick',
  variants: ['kick', 'kick drum', 'bass drum', 'bd', 'kicks'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'foundation', 'pulse'],
  registerRange: [35, 40], // C1-E1
  timbreCharacteristics: ['percussive', 'low-frequency', 'transient']
};

export const NOUN_SNARE: InstrumentLexeme = {
  id: 'lex:noun:snare' as LexemeId,
  lemma: 'snare',
  variants: ['snare', 'snare drum', 'sd', 'snares'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'backbeat', 'accent'],
  registerRange: [38, 40], // D1-E1
  timbreCharacteristics: ['percussive', 'bright', 'transient', 'rattle']
};

export const NOUN_HIHAT: InstrumentLexeme = {
  id: 'lex:noun:hihat' as LexemeId,
  lemma: 'hihat',
  variants: ['hihat', 'hi-hat', 'hi hat', 'hats', 'hh', 'closed hat', 'open hat'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'subdivision', 'groove'],
  registerRange: [42, 46], // F#1-A#1
  timbreCharacteristics: ['percussive', 'metallic', 'bright', 'sizzle']
};

export const NOUN_TOM: InstrumentLexeme = {
  id: 'lex:noun:tom' as LexemeId,
  lemma: 'tom',
  variants: ['tom', 'toms', 'tom-tom', 'floor tom', 'rack tom'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'fill', 'transition'],
  registerRange: [41, 50], // F1-D2
  timbreCharacteristics: ['percussive', 'resonant', 'pitched']
};

export const NOUN_CRASH: InstrumentLexeme = {
  id: 'lex:noun:crash' as LexemeId,
  lemma: 'crash',
  variants: ['crash', 'crash cymbal', 'crashes'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['accent', 'transition', 'climax'],
  registerRange: [49, 57], // C#2-A2
  timbreCharacteristics: ['percussive', 'metallic', 'sustained', 'wash']
};

export const NOUN_RIDE: InstrumentLexeme = {
  id: 'lex:noun:ride' as LexemeId,
  lemma: 'ride',
  variants: ['ride', 'ride cymbal', 'rides'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'pulse', 'steady'],
  registerRange: [51, 59], // D#2-B2
  timbreCharacteristics: ['percussive', 'metallic', 'bell-like', 'sustained']
};

export const NOUN_CLAP: InstrumentLexeme = {
  id: 'lex:noun:clap' as LexemeId,
  lemma: 'clap',
  variants: ['clap', 'claps', 'handclap', 'hand clap'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'backbeat', 'accent'],
  registerRange: [39, 39], // D#1
  timbreCharacteristics: ['percussive', 'dry', 'short']
};

export const NOUN_RIMSHOT: InstrumentLexeme = {
  id: 'lex:noun:rimshot' as LexemeId,
  lemma: 'rimshot',
  variants: ['rimshot', 'rim shot', 'rim', 'cross stick'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'accent', 'click'],
  registerRange: [37, 37], // C#1
  timbreCharacteristics: ['percussive', 'dry', 'click', 'short']
};

export const NOUN_COWBELL: InstrumentLexeme = {
  id: 'lex:noun:cowbell' as LexemeId,
  lemma: 'cowbell',
  variants: ['cowbell', 'cow bell', 'bell'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'accent', 'color'],
  registerRange: [56, 56], // G#2
  timbreCharacteristics: ['percussive', 'metallic', 'pitched', 'resonant']
};

export const NOUN_TAMBOURINE: InstrumentLexeme = {
  id: 'lex:noun:tambourine' as LexemeId,
  lemma: 'tambourine',
  variants: ['tambourine', 'tamb', 'shaker'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'percussion',
  roleHints: ['rhythm', 'texture', 'shake'],
  registerRange: [54, 54], // F#2
  timbreCharacteristics: ['percussive', 'metallic', 'jingle', 'sustained']
};

// =============================================================================
// MELODIC PERCUSSION
// =============================================================================

export const NOUN_MARIMBA: InstrumentLexeme = {
  id: 'lex:noun:marimba' as LexemeId,
  lemma: 'marimba',
  variants: ['marimba', 'marimabas'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'melodic-percussion',
  roleHints: ['melody', 'harmony', 'texture'],
  registerRange: [48, 96], // C2-C6
  timbreCharacteristics: ['percussive', 'mellow', 'wooden', 'resonant']
};

export const NOUN_XYLOPHONE: InstrumentLexeme = {
  id: 'lex:noun:xylophone' as LexemeId,
  lemma: 'xylophone',
  variants: ['xylophone', 'xylo', 'xyl'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'melodic-percussion',
  roleHints: ['melody', 'bright', 'accent'],
  registerRange: [60, 108], // C3-C7
  timbreCharacteristics: ['percussive', 'bright', 'wooden', 'short']
};

export const NOUN_VIBRAPHONE: InstrumentLexeme = {
  id: 'lex:noun:vibraphone' as LexemeId,
  lemma: 'vibraphone',
  variants: ['vibraphone', 'vibes', 'vibe', 'vibra'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'melodic-percussion',
  roleHints: ['melody', 'harmony', 'sustained'],
  registerRange: [53, 89], // F2-F5
  timbreCharacteristics: ['percussive', 'metallic', 'sustained', 'vibrato']
};

export const NOUN_GLOCKENSPIEL: InstrumentLexeme = {
  id: 'lex:noun:glockenspiel' as LexemeId,
  lemma: 'glockenspiel',
  variants: ['glockenspiel', 'glock', 'bells'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'melodic-percussion',
  roleHints: ['melody', 'sparkle', 'accent'],
  registerRange: [72, 108], // C4-C7
  timbreCharacteristics: ['percussive', 'bright', 'metallic', 'bell-like']
};

export const NOUN_TIMPANI: InstrumentLexeme = {
  id: 'lex:noun:timpani' as LexemeId,
  lemma: 'timpani',
  variants: ['timpani', 'kettle drum', 'kettledrum', 'timp'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'melodic-percussion',
  roleHints: ['foundation', 'accent', 'dramatic'],
  registerRange: [41, 62], // F1-D3
  timbreCharacteristics: ['percussive', 'resonant', 'pitched', 'powerful']
};

// =============================================================================
// STRING INSTRUMENTS
// =============================================================================

export const NOUN_VIOLIN: InstrumentLexeme = {
  id: 'lex:noun:violin' as LexemeId,
  lemma: 'violin',
  variants: ['violin', 'violins', 'fiddle', 'fiddles'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['melody', 'harmony', 'sustained'],
  registerRange: [55, 103], // G2-G6
  timbreCharacteristics: ['bowed', 'expressive', 'bright', 'singing']
};

export const NOUN_VIOLA: InstrumentLexeme = {
  id: 'lex:noun:viola' as LexemeId,
  lemma: 'viola',
  variants: ['viola', 'violas'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['harmony', 'inner-voice', 'warm'],
  registerRange: [48, 91], // C2-G5
  timbreCharacteristics: ['bowed', 'warm', 'dark', 'mellow']
};

export const NOUN_CELLO: InstrumentLexeme = {
  id: 'lex:noun:cello' as LexemeId,
  lemma: 'cello',
  variants: ['cello', 'cellos', 'violoncello'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['bass', 'melody', 'foundation'],
  registerRange: [36, 76], // C1-E4
  timbreCharacteristics: ['bowed', 'rich', 'resonant', 'expressive']
};

export const NOUN_CONTRABASS: InstrumentLexeme = {
  id: 'lex:noun:contrabass' as LexemeId,
  lemma: 'contrabass',
  variants: ['contrabass', 'double bass', 'upright bass', 'acoustic bass', 'bass'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['bass', 'foundation', 'pulse'],
  registerRange: [28, 67], // E0-G3
  timbreCharacteristics: ['bowed', 'pizzicato', 'deep', 'resonant']
};

export const NOUN_GUITAR: InstrumentLexeme = {
  id: 'lex:noun:guitar' as LexemeId,
  lemma: 'guitar',
  variants: ['guitar', 'guitars', 'gtr'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['rhythm', 'melody', 'harmony'],
  registerRange: [40, 88], // E1-E5
  timbreCharacteristics: ['plucked', 'versatile', 'strummed', 'picked']
};

export const NOUN_ACOUSTIC_GUITAR: InstrumentLexeme = {
  id: 'lex:noun:acoustic-guitar' as LexemeId,
  lemma: 'acoustic guitar',
  variants: ['acoustic guitar', 'acoustic', 'steel string', 'nylon string'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['rhythm', 'accompaniment', 'fingerstyle'],
  registerRange: [40, 84], // E1-C5
  timbreCharacteristics: ['acoustic', 'natural', 'warm', 'resonant']
};

export const NOUN_ELECTRIC_GUITAR: InstrumentLexeme = {
  id: 'lex:noun:electric-guitar' as LexemeId,
  lemma: 'electric guitar',
  variants: ['electric guitar', 'electric', 'e-guitar', 'lead guitar', 'rhythm guitar'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['lead', 'rhythm', 'solo'],
  registerRange: [40, 88], // E1-E5
  timbreCharacteristics: ['electric', 'sustained', 'distorted', 'clean']
};

export const NOUN_BASS_GUITAR: InstrumentLexeme = {
  id: 'lex:noun:bass-guitar' as LexemeId,
  lemma: 'bass guitar',
  variants: ['bass guitar', 'electric bass', 'bass', 'e-bass'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['bass', 'foundation', 'groove'],
  registerRange: [28, 67], // E0-G3
  timbreCharacteristics: ['electric', 'deep', 'punchy', 'sustained']
};

export const NOUN_HARP: InstrumentLexeme = {
  id: 'lex:noun:harp' as LexemeId,
  lemma: 'harp',
  variants: ['harp', 'harps'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'string',
  roleHints: ['melody', 'arpeggio', 'texture'],
  registerRange: [23, 103], // B-1-G6
  timbreCharacteristics: ['plucked', 'delicate', 'cascading', 'ethereal']
};

// =============================================================================
// KEYBOARD INSTRUMENTS
// =============================================================================

export const NOUN_PIANO: InstrumentLexeme = {
  id: 'lex:noun:piano' as LexemeId,
  lemma: 'piano',
  variants: ['piano', 'pianos', 'pno'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['harmony', 'melody', 'foundation'],
  registerRange: [21, 108], // A0-C8
  timbreCharacteristics: ['acoustic', 'percussive', 'resonant', 'versatile']
};

export const NOUN_GRAND_PIANO: InstrumentLexeme = {
  id: 'lex:noun:grand-piano' as LexemeId,
  lemma: 'grand piano',
  variants: ['grand piano', 'grand', 'concert grand'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['harmony', 'melody', 'solo'],
  registerRange: [21, 108], // A0-C8
  timbreCharacteristics: ['acoustic', 'rich', 'resonant', 'powerful']
};

export const NOUN_UPRIGHT_PIANO: InstrumentLexeme = {
  id: 'lex:noun:upright-piano' as LexemeId,
  lemma: 'upright piano',
  variants: ['upright piano', 'upright', 'vertical piano'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['harmony', 'accompaniment'],
  registerRange: [21, 108], // A0-C8
  timbreCharacteristics: ['acoustic', 'warm', 'intimate', 'compact']
};

export const NOUN_ELECTRIC_PIANO: InstrumentLexeme = {
  id: 'lex:noun:electric-piano' as LexemeId,
  lemma: 'electric piano',
  variants: ['electric piano', 'ep', 'e-piano', 'rhodes', 'wurlitzer'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['harmony', 'melody', 'texture'],
  registerRange: [28, 103], // E0-G6
  timbreCharacteristics: ['electric', 'bell-like', 'warm', 'sustained']
};

export const NOUN_ORGAN: InstrumentLexeme = {
  id: 'lex:noun:organ' as LexemeId,
  lemma: 'organ',
  variants: ['organ', 'organs', 'hammond', 'church organ', 'pipe organ'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['harmony', 'sustained', 'foundation'],
  registerRange: [36, 96], // C1-C6
  timbreCharacteristics: ['sustained', 'rich', 'powerful', 'harmonic']
};

export const NOUN_HARPSICHORD: InstrumentLexeme = {
  id: 'lex:noun:harpsichord' as LexemeId,
  lemma: 'harpsichord',
  variants: ['harpsichord', 'harpsichords'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['melody', 'baroque', 'ornamental'],
  registerRange: [29, 89], // F0-F5
  timbreCharacteristics: ['plucked', 'bright', 'articulate', 'percussive']
};

export const NOUN_CLAVINET: InstrumentLexeme = {
  id: 'lex:noun:clavinet' as LexemeId,
  lemma: 'clavinet',
  variants: ['clavinet', 'clav'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'keyboard',
  roleHints: ['rhythm', 'funky', 'percussive'],
  registerRange: [36, 96], // C1-C6
  timbreCharacteristics: ['electric', 'percussive', 'funky', 'short']
};

// =============================================================================
// SYNTHESIZERS (50+ entries continuing...)
// =============================================================================

export const NOUN_SYNTH: InstrumentLexeme = {
  id: 'lex:noun:synth' as LexemeId,
  lemma: 'synth',
  variants: ['synth', 'synthesizer', 'synthesizers', 'synths'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'synthesizer',
  roleHints: ['melody', 'pad', 'lead', 'bass'],
  timbreCharacteristics: ['synthetic', 'versatile', 'electronic']
};

export const NOUN_PAD: InstrumentLexeme = {
  id: 'lex:noun:pad' as LexemeId,
  lemma: 'pad',
  variants: ['pad', 'pads', 'synth pad', 'string pad'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'synthesizer',
  roleHints: ['harmony', 'texture', 'atmosphere'],
  timbreCharacteristics: ['sustained', 'smooth', 'ambient', 'lush']
};

export const NOUN_LEAD: InstrumentLexeme = {
  id: 'lex:noun:lead' as LexemeId,
  lemma: 'lead',
  variants: ['lead', 'lead synth', 'solo synth', 'monosynth'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'synthesizer',
  roleHints: ['melody', 'solo', 'prominent'],
  timbreCharacteristics: ['bright', 'cutting', 'monophonic', 'expressive']
};

export const NOUN_BASS_SYNTH: InstrumentLexeme = {
  id: 'lex:noun:bass-synth' as LexemeId,
  lemma: 'bass synth',
  variants: ['bass synth', 'synth bass', 'sub bass', 'sub'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'synthesizer',
  roleHints: ['bass', 'foundation', 'low-end'],
  registerRange: [24, 60], // C0-C3
  timbreCharacteristics: ['deep', 'powerful', 'sub-frequency', 'punchy']
};

export const NOUN_ARPEGGIO: InstrumentLexeme = {
  id: 'lex:noun:arpeggio' as LexemeId,
  lemma: 'arpeggio',
  variants: ['arpeggio', 'arp', 'arpeggiated synth', 'sequencer'],
  category: 'noun',
  semantics: { type: 'entity', entityType: 'card' as const },
  instrumentCategory: 'synthesizer',
  roleHints: ['rhythm', 'texture', 'motion'],
  timbreCharacteristics: ['rhythmic', 'repetitive', 'sequenced', 'pulsing']
};

// Continue with more instruments...

/**
 * Complete instrument vocabulary table
 */
export const INSTRUMENT_NOUNS: readonly InstrumentLexeme[] = [
  // Percussion
  NOUN_KICK,
  NOUN_SNARE,
  NOUN_HIHAT,
  NOUN_TOM,
  NOUN_CRASH,
  NOUN_RIDE,
  NOUN_CLAP,
  NOUN_RIMSHOT,
  NOUN_COWBELL,
  NOUN_TAMBOURINE,
  
  // Melodic Percussion
  NOUN_MARIMBA,
  NOUN_XYLOPHONE,
  NOUN_VIBRAPHONE,
  NOUN_GLOCKENSPIEL,
  NOUN_TIMPANI,
  
  // Strings
  NOUN_VIOLIN,
  NOUN_VIOLA,
  NOUN_CELLO,
  NOUN_CONTRABASS,
  NOUN_GUITAR,
  NOUN_ACOUSTIC_GUITAR,
  NOUN_ELECTRIC_GUITAR,
  NOUN_BASS_GUITAR,
  NOUN_HARP,
  
  // Keyboards
  NOUN_PIANO,
  NOUN_GRAND_PIANO,
  NOUN_UPRIGHT_PIANO,
  NOUN_ELECTRIC_PIANO,
  NOUN_ORGAN,
  NOUN_HARPSICHORD,
  NOUN_CLAVINET,
  
  // Synthesizers
  NOUN_SYNTH,
  NOUN_PAD,
  NOUN_LEAD,
  NOUN_BASS_SYNTH,
  NOUN_ARPEGGIO,
];

/**
 * Get instrument by normalized name
 */
export function getInstrumentByName(name: string): InstrumentLexeme | undefined {
  const normalized = name.toLowerCase().trim();
  return INSTRUMENT_NOUNS.find(inst =>
    inst.lemma === normalized ||
    inst.variants.some(v => v.toLowerCase() === normalized)
  );
}

/**
 * Get instruments by category
 */
export function getInstrumentsByCategory(
  category: InstrumentCategory
): readonly InstrumentLexeme[] {
  return INSTRUMENT_NOUNS.filter(inst => inst.instrumentCategory === category);
}

/**
 * Get instruments by role hint
 */
export function getInstrumentsByRole(role: string): readonly InstrumentLexeme[] {
  const normalizedRole = role.toLowerCase();
  return INSTRUMENT_NOUNS.filter(inst =>
    inst.roleHints.some(r => r.toLowerCase() === normalizedRole)
  );
}
