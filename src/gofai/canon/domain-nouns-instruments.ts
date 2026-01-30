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

import type { Lexeme, LexemeId } from './types';

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
  description: 'Bass drum or kick drum - the lowest-pitched drum in a drum kit, providing foundational low-end pulse and rhythmic weight',
  examples: [
    'add more kick',
    'make the kick punchier',
    'remove kick from the bridge'
  ],
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
  description: 'Snare drum - a bright, crisp drum with wire snares that provide a characteristic rattle, typically used for backbeats and accents',
  examples: [
    'tighten the snare',
    'add a snare roll',
    'make the snare brighter'
  ],
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
  description: 'Hi-hat cymbals - two cymbals mounted on a stand, played with sticks or foot pedal, providing rhythmic subdivision and groove definition',
  examples: [
    'open the hats in the chorus',
    'tighten up the hi-hat pattern',
    'add more hats'
  ],
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
  description: 'Tom-tom drums - cylindrical drums without snares, available in various sizes providing pitched resonant tones for fills and transitions',
  examples: [
    'add a tom fill',
    'tune the toms lower',
    'double the tom pattern'
  ],
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
  description: 'Crash cymbal - a loud, bright cymbal used for accents, transitions, and climactic moments with a sustained wash of sound',
  examples: [
    'add a crash on the downbeat',
    'remove crashes from the verse',
    'make the crash more dramatic'
  ],
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
  description: 'Ride cymbal - a larger cymbal providing a steady rhythmic pattern with a sustained bell-like tone, often used as an alternative to hi-hats',
  examples: [
    'switch to ride in the bridge',
    'play the ride bell',
    'make the ride more prominent'
  ],
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
  description: 'Hand clap - a short, dry percussive sound simulating handclapping, commonly used for backbeats and rhythm reinforcement in pop and electronic music',
  examples: [
    'add claps on the backbeat',
    'layer claps with the snare',
    'remove claps from the intro'
  ],
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
  description: 'Rimshot or cross-stick - a dry click sound produced by striking the rim of a snare drum, often used for subtle backbeats in sparse arrangements',
  examples: [
    'use rimshot instead of snare',
    'add rim clicks to the verse',
    'make the rimshot louder'
  ],
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
  description: 'Cowbell - a pitched metallic percussion instrument with a resonant tone, used for rhythmic accents and color in many musical styles',
  examples: [
    'add more cowbell',
    'use cowbell on the offbeats',
    'make the cowbell brighter'
  ],
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
  description: 'Tambourine - a handheld percussion instrument with metal jingles, providing a continuous metallic shimmer or rhythmic accents',
  examples: [
    'add tambourine to the chorus',
    'shake the tambourine',
    'layer tambourine with hats'
  ],
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
  description: 'Marimba - a wooden-barred percussion instrument with resonators, producing warm, mellow tones ideal for melodic and harmonic content',
  examples: [
    'add a marimba melody',
    'layer marimba with vibes',
    'make the marimba softer'
  ],
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
  description: 'Xylophone - a bright, percussive wooden-barred instrument with short, articulate tones, commonly used for melodic accents',
  examples: [
    'add xylophone sparkle',
    'use xylo for the hook',
    'brighten the xylophone'
  ],
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
  description: 'Vibraphone - a metallic-barred percussion instrument with motor-driven resonators creating vibrato, known for its shimmering sustained tones',
  examples: [
    'add vibes to the jazz section',
    'use vibraphone for the bridge',
    'slow down the vibes vibrato'
  ],
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
  description: 'Glockenspiel - a small metallic-barred percussion instrument with a bright, bell-like sound in the high register, adding sparkle and clarity',
  examples: [
    'add glockenspiel to add sparkle',
    'use bells for the melody',
    'make the glock more delicate'
  ],
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
  description: 'Timpani - large kettle-shaped drums with definite pitch, providing powerful low-end melodic percussion and dramatic accents',
  examples: [
    'add timpani rolls',
    'use timpani for the crescendo',
    'tune timpani lower'
  ],
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
  description: 'Violin - the highest-pitched bowed string instrument, capable of brilliant, expressive melodies and virtuosic passages',
  examples: [
    'add violin melody',
    'make the violin more expressive',
    'layer violins in the chorus'
  ],
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
  description: 'Viola - a mid-register bowed string instrument, slightly larger than a violin, providing warm, mellow inner voices in string arrangements',
  examples: [
    'add viola for warmth',
    'use viola for the inner harmony',
    'make the viola darker'
  ],
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
  description: 'Cello - a large bowed string instrument with rich, resonant tone capable of melodic, harmonic, and bass functions',
  examples: [
    'add cello for depth',
    'use cello for the bassline',
    'make the cello more legato'
  ],
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
  description: 'Contrabass or double bass - the lowest-pitched string instrument, providing foundational bass whether bowed or pizzicato',
  examples: [
    'add double bass for foundation',
    'play the bass pizzicato',
    'bow the contrabass'
  ],
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
  description: 'Guitar - a versatile plucked string instrument used for rhythm, melody, and harmony across many musical genres',
  examples: [
    'add guitar strumming',
    'use guitar for the riff',
    'make the guitar cleaner'
  ],
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
  description: 'Acoustic guitar - an unplugged guitar with natural resonance from its body, offering warm, organic tones for rhythm and fingerstyle playing',
  examples: [
    'add acoustic guitar strumming',
    'fingerpick the acoustic',
    'make the acoustic warmer'
  ],
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
  description: 'Electric guitar - an amplified guitar capable of sustained notes, distortion, and effects, used for lead melodies and rhythm parts',
  examples: [
    'add electric guitar solo',
    'distort the electric guitar',
    'use clean electric guitar'
  ],
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
  description: 'Bass guitar - an electric four or five-string instrument providing the foundational bassline and groove in modern music',
  examples: [
    'add bass guitar groove',
    'slap the bass',
    'make the bass punchier'
  ],
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
  description: 'Harp - a large plucked string instrument with a wide range, known for cascading arpeggios and ethereal textures',
  examples: [
    'add harp glissando',
    'use harp for the intro',
    'make the harp more delicate'
  ],
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
  description: 'Piano - an acoustic keyboard instrument with hammers striking strings, offering a full range from bass to treble with dynamic expressiveness',
  examples: [
    'add piano accompaniment',
    'play the piano softer',
    'layer piano with strings'
  ],
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
  description: 'Grand piano - a large horizontal piano with superior tone and resonance, the standard for concert performances and studio recordings',
  examples: [
    'use grand piano for the solo',
    'record grand piano',
    'make the grand more resonant'
  ],
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
  description: 'Upright piano - a vertical piano with a more intimate, compact sound compared to grands, popular in homes and small venues',
  examples: [
    'use upright piano for warmth',
    'add upright for intimacy',
    'make the upright honky-tonk'
  ],
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
  description: 'Electric piano - an electromechanical keyboard producing warm, bell-like tones through pickups, iconic in soul, funk, and jazz',
  examples: [
    'add rhodes piano',
    'use wurlitzer for the verse',
    'make the ep funkier'
  ],
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
  description: 'Organ - a sustained keyboard instrument using wind or electronic tone generation, providing rich harmonic foundations and leads',
  examples: [
    'add hammond organ',
    'use church organ for drama',
    'make the organ swirl'
  ],
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
  description: 'Harpsichord - a baroque keyboard instrument with plucked strings, producing a bright, articulate sound with characteristic attack',
  examples: [
    'add harpsichord for baroque feel',
    'use harpsichord ornaments',
    'make the harpsichord brighter'
  ],
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
  description: 'Clavinet - an electric keyboard with a funky, percussive attack from amplified strings, essential in funk and disco music',
  examples: [
    'add clavinet for funk',
    'wah the clavinet',
    'make the clav tighter'
  ],
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
  description: 'Synthesizer - an electronic instrument generating and shaping sounds through oscillators, filters, and modulators, offering unlimited timbral possibilities',
  examples: [
    'add synth pad',
    'use analog synth',
    'make the synth brighter'
  ],
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
  description: 'Pad - a sustained synthesizer or string texture providing ambient harmonic foundation and atmospheric depth',
  examples: [
    'add a lush pad',
    'use string pads for atmosphere',
    'make the pad wider'
  ],
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
  description: 'Lead synth - a monophonic or focused synthesizer voice designed for cutting melodic lines and solos',
  examples: [
    'add lead synth melody',
    'use lead for the hook',
    'make the lead more aggressive'
  ],
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
  description: 'Bass synth - a synthesizer focused on low frequencies, providing powerful sub-bass and foundational groove in electronic music',
  examples: [
    'add sub bass',
    'use synth bass for the drop',
    'make the bass deeper'
  ],
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
  description: 'Arpeggio or arp - a rhythmically sequenced pattern of notes, typically from a chord, creating pulsing motion and texture',
  examples: [
    'add arpeggiated synth',
    'use arp for movement',
    'speed up the arpeggio'
  ],
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
