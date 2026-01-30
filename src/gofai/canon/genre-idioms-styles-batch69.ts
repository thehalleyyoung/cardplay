/**
 * GOFAI Canon — Genre Idioms and Styles Vocabulary (Batch 69)
 *
 * This batch provides extensive coverage of genre-specific terminology:
 * 1. Hip-hop and trap production vocabulary
 * 2. Electronic dance music (EDM) terminology
 * 3. Jazz and fusion descriptors
 * 4. Rock and metal idioms
 * 5. R&B and soul language
 * 6. Classical and orchestral terms
 * 7. World music descriptors
 * 8. Experimental and ambient styles
 *
 * Total entries in batch 69: 40 lexemes
 *
 * @module gofai/canon/genre-idioms-styles-batch69
 */

import type { Lexeme, LexemeId } from './types';
import { makeBuiltinId } from './gofai-id';

// =============================================================================
// Hip-Hop and Trap Vocabulary (10 entries)
// =============================================================================

export const HIP_HOP_TRAP_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'noun', '808') as LexemeId,
    lemma: '808',
    variants: ['808', 'eight-oh-eight', '808 bass', 'sub bass'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'instrument' as const,
      entity_type: 'synth_bass' as const,
    },
    description: 'Roland TR-808 style bass drum/sub bass',
    examples: [
      'add an 808',
      'boost the eight-oh-eight',
      'use sub bass',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'trap-style') as LexemeId,
    lemma: 'trap-style',
    variants: ['trap-style', 'trap', 'trap-influenced', 'trap beat'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Having trap music characteristics (hi-hats, 808s, etc.)',
    examples: [
      'make it trap-style',
      'add trap elements',
      'use a trap beat',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'hi-hat-roll') as LexemeId,
    lemma: 'hi-hat-roll',
    variants: ['hi-hat roll', 'hat roll', 'rolled hats', 'rapid hi-hats'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'rhythm' as const,
      aspect: 'pattern' as const,
    },
    description: 'Rapid hi-hat triplets or rolls characteristic of trap',
    examples: [
      'add hi-hat rolls',
      'use rapid hats',
      'insert hat rolls',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'boom-bap') as LexemeId,
    lemma: 'boom-bap',
    variants: ['boom-bap', 'boom bap', 'classic hip-hop', 'golden era'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Classic hip-hop drum style with punchy kicks and snares',
    examples: [
      'make it boom-bap',
      'use classic hip-hop',
      'add golden era feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'chopped') as LexemeId,
    lemma: 'chopped',
    variants: ['chopped', 'chopped and screwed', 'sliced', 'cut up'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'technique' as const,
    },
    description: 'Having samples cut up and rearranged',
    examples: [
      'chop the sample',
      'slice it up',
      'cut and rearrange',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'screwed') as LexemeId,
    lemma: 'screwed',
    variants: ['screwed', 'slowed down', 'chopped and screwed', 'pitched down'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'tempo_pitch' as const,
    },
    description: 'Slowed down and pitched down in Houston style',
    examples: [
      'screw it',
      'slow it down',
      'chop and screw',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'sampled') as LexemeId,
    lemma: 'sampled',
    variants: ['sampled', 'sample-based', 'using samples', 'from a sample'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'source' as const,
    },
    description: 'Using audio samples as source material',
    examples: [
      'use a sample',
      'make it sample-based',
      'build from samples',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'breakbeat') as LexemeId,
    lemma: 'breakbeat',
    variants: ['breakbeat', 'break', 'drum break', 'break loop'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'rhythm' as const,
      entity_type: 'drum_pattern' as const,
    },
    description: 'Sampled drum break loop',
    examples: [
      'add a breakbeat',
      'use the break',
      'loop the drum break',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'scratched') as LexemeId,
    lemma: 'scratched',
    variants: ['scratched', 'with scratching', 'turntablist', 'DJ scratches'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'technique' as const,
    },
    description: 'Having vinyl scratching techniques',
    examples: [
      'add scratching',
      'use DJ scratches',
      'scratch the sample',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'lo-fi-hip-hop') as LexemeId,
    lemma: 'lo-fi-hip-hop',
    variants: ['lo-fi hip-hop', 'lofi', 'chill hop', 'study beats'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Lo-fi hip-hop style with vinyl crackle and mellow beats',
    examples: [
      'make it lo-fi hip-hop',
      'add chill hop vibes',
      'use study beats style',
    ] as const,
  },
];

// =============================================================================
// Electronic Dance Music (EDM) Vocabulary (10 entries)
// =============================================================================

export const EDM_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'noun', 'drop') as LexemeId,
    lemma: 'drop',
    variants: ['drop', 'the drop', 'bass drop', 'beat drop'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'structure' as const,
      entity_type: 'section' as const,
    },
    description: 'High-energy climactic section in EDM',
    examples: [
      'add a drop',
      'make the drop harder',
      'build to the drop',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'buildup') as LexemeId,
    lemma: 'buildup',
    variants: ['buildup', 'build-up', 'build', 'rise'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'structure' as const,
      entity_type: 'section' as const,
    },
    description: 'Tension-building section before a drop',
    examples: [
      'extend the buildup',
      'add more build',
      'create tension in the rise',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'four-on-the-floor') as LexemeId,
    lemma: 'four-on-the-floor',
    variants: ['four-on-the-floor', 'four on the floor', '4/4 kick', 'steady kick'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'rhythm' as const,
      aspect: 'pattern' as const,
    },
    description: 'Kick drum on every quarter note',
    examples: [
      'use four-on-the-floor',
      'add steady kicks',
      'keep the 4/4 pattern',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'sidechain-pumping') as LexemeId,
    lemma: 'sidechain-pumping',
    variants: ['sidechain pumping', 'pumping', 'ducking', 'breathing'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'dynamics' as const,
    },
    description: 'Rhythmic pumping from sidechain compression',
    examples: [
      'add sidechain pumping',
      'make it breathe',
      'duck to the kick',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'plucked-synth') as LexemeId,
    lemma: 'plucked-synth',
    variants: ['plucked synth', 'pluck', 'plucky', 'short synth'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'synth_type' as const,
    },
    description: 'Short, plucked synthesizer sound',
    examples: [
      'use plucked synth',
      'add plucks',
      'create plucky sounds',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'riser') as LexemeId,
    lemma: 'riser',
    variants: ['riser', 'sweep', 'uplifter', 'rising effect'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'sound_effect' as const,
    },
    description: 'Rising sweep sound for building tension',
    examples: [
      'add a riser',
      'use sweep',
      'insert uplifters',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'impact') as LexemeId,
    lemma: 'impact',
    variants: ['impact', 'hit', 'boom', 'crash'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'sound_effect' as const,
    },
    description: 'Heavy impact sound at downbeats',
    examples: [
      'add impacts',
      'use hits at the drop',
      'insert boom sounds',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'sawtooth') as LexemeId,
    lemma: 'sawtooth',
    variants: ['sawtooth', 'saw wave', 'bright synth', 'buzzy'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'waveform' as const,
    },
    description: 'Using bright sawtooth waveforms',
    examples: [
      'use sawtooth',
      'add saw waves',
      'create buzzy synths',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'square-wave') as LexemeId,
    lemma: 'square-wave',
    variants: ['square wave', 'square', 'hollow synth', 'pulse wave'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'waveform' as const,
    },
    description: 'Using hollow square/pulse waveforms',
    examples: [
      'use square wave',
      'add pulse waves',
      'create hollow tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'supersaw') as LexemeId,
    lemma: 'supersaw',
    variants: ['supersaw', 'super saw', 'thick saw', 'detuned saws'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'synth_type' as const,
    },
    description: 'Multiple detuned sawtooth waves for thick sound',
    examples: [
      'use supersaw',
      'add thick saws',
      'create massive synths',
    ] as const,
  },
];

// =============================================================================
// Jazz and Fusion Vocabulary (10 entries)
// =============================================================================

export const JAZZ_FUSION_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'adj', 'swinging') as LexemeId,
    lemma: 'swinging',
    variants: ['swinging', 'with swing', 'jazz swing', 'swung feel'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'swing_amount') as any,
      direction: 'increase' as const,
    },
    description: 'Having jazz swing rhythmic feel',
    examples: [
      'add swing',
      'make it swinging',
      'use jazz feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'walking-bass') as LexemeId,
    lemma: 'walking-bass',
    variants: ['walking bass', 'walking', 'stepwise bass', 'jazz bass'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'rhythm' as const,
      aspect: 'bass_pattern' as const,
    },
    description: 'Quarter note bassline moving stepwise',
    examples: [
      'add walking bass',
      'use jazz bass',
      'create stepwise bass',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'bebop') as LexemeId,
    lemma: 'bebop',
    variants: ['bebop', 'bop', 'bebop-style', 'fast jazz'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Fast, complex jazz style with intricate melodies',
    examples: [
      'make it bebop',
      'use bop style',
      'add fast jazz lines',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'modal-jazz') as LexemeId,
    lemma: 'modal-jazz',
    variants: ['modal jazz', 'modal', 'mode-based jazz', 'Miles Davis style'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Jazz using modal scales rather than chord changes',
    examples: [
      'use modal jazz',
      'make it modal',
      'add Miles Davis feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'latin-jazz') as LexemeId,
    lemma: 'latin-jazz',
    variants: ['latin jazz', 'afro-cuban', 'latin feel', 'bossa nova'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Jazz with Latin/Afro-Cuban rhythms',
    examples: [
      'add latin jazz',
      'use afro-cuban feel',
      'make it bossa nova',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'comping') as LexemeId,
    lemma: 'comping',
    variants: ['comping', 'comp', 'accompaniment', 'chord hits'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'rhythm' as const,
      aspect: 'accompaniment' as const,
    },
    description: 'Rhythmic chord accompaniment in jazz',
    examples: [
      'add comping',
      'use chord hits',
      'create jazz comp',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'fusion') as LexemeId,
    lemma: 'fusion',
    variants: ['fusion', 'jazz fusion', 'jazz-rock', 'electric jazz'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Jazz mixed with rock, funk, or electronic elements',
    examples: [
      'make it fusion',
      'add jazz-rock feel',
      'use electric jazz',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'free-jazz') as LexemeId,
    lemma: 'free-jazz',
    variants: ['free jazz', 'free form', 'avant-garde jazz', 'free improvisation'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Freely improvised jazz without traditional structure',
    examples: [
      'make it free jazz',
      'use free improvisation',
      'add avant-garde feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'straight-ahead') as LexemeId,
    lemma: 'straight-ahead',
    variants: ['straight-ahead', 'mainstream jazz', 'traditional jazz', 'classic jazz'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Traditional mainstream jazz style',
    examples: [
      'keep it straight-ahead',
      'use mainstream jazz',
      'play traditional style',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'turnaround') as LexemeId,
    lemma: 'turnaround',
    variants: ['turnaround', 'turn around', 'cadential progression', 'ending phrase'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'progression' as const,
    },
    description: 'Short chord progression ending a phrase',
    examples: [
      'add a turnaround',
      'use ending progression',
      'insert turn around',
    ] as const,
  },
];

// =============================================================================
// Rock and Metal Vocabulary (10 entries)
// =============================================================================

export const ROCK_METAL_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'noun', 'power-chord') as LexemeId,
    lemma: 'power-chord',
    variants: ['power chord', 'fifth chord', 'rock chord', 'distorted chord'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'chord_type' as const,
    },
    description: 'Root and fifth chord used in rock',
    examples: [
      'use power chords',
      'add fifth chords',
      'play rock chords',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'riff') as LexemeId,
    lemma: 'riff',
    variants: ['riff', 'guitar riff', 'main riff', 'hook riff'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'motif' as const,
    },
    description: 'Short repeated melodic phrase',
    examples: [
      'add a riff',
      'use the main riff',
      'create a hook riff',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'palm-muted') as LexemeId,
    lemma: 'palm-muted',
    variants: ['palm-muted', 'palm muted', 'muted', 'chuggy'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'articulation' as const,
      aspect: 'technique' as const,
    },
    description: 'Muted with the palm on the bridge',
    examples: [
      'make it palm-muted',
      'add chugging',
      'use muted picking',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'metal') as LexemeId,
    lemma: 'metal',
    variants: ['metal', 'heavy metal', 'aggressive', 'brutal'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Heavy metal style with aggression',
    examples: [
      'make it metal',
      'add heavy metal feel',
      'use aggressive tone',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'djent') as LexemeId,
    lemma: 'djent',
    variants: ['djent', 'djent-style', 'palm-muted metal', 'progressive metal'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Modern progressive metal with tight palm-muted riffs',
    examples: [
      'make it djent',
      'add djent riffs',
      'use tight muting',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'breakdown') as LexemeId,
    lemma: 'breakdown',
    variants: ['breakdown', 'heavy breakdown', 'mosh section', 'beatdown'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'structure' as const,
      entity_type: 'section' as const,
    },
    description: 'Heavy rhythmic section in metal/hardcore',
    examples: [
      'add a breakdown',
      'insert mosh section',
      'create heavy beatdown',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'crunchy') as LexemeId,
    lemma: 'crunchy',
    variants: ['crunchy', 'crunching', 'distorted', 'overdriven'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'distortion_amount') as any,
      direction: 'increase' as const,
    },
    description: 'Having moderate distortion/crunch',
    examples: [
      'make it crunchy',
      'add crunch',
      'use crunching tone',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'guitar-solo') as LexemeId,
    lemma: 'guitar-solo',
    variants: ['guitar solo', 'solo', 'lead break', 'lead section'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'structure' as const,
      entity_type: 'section' as const,
    },
    description: 'Solo guitar section',
    examples: [
      'add a guitar solo',
      'insert solo section',
      'create lead break',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'shredding') as LexemeId,
    lemma: 'shredding',
    variants: ['shredding', 'shred', 'fast playing', 'virtuosic'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'performance' as const,
      aspect: 'technique' as const,
    },
    description: 'Very fast, technical guitar playing',
    examples: [
      'add shredding',
      'use fast playing',
      'create virtuosic runs',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'arena-rock') as LexemeId,
    lemma: 'arena-rock',
    variants: ['arena rock', 'stadium rock', 'anthemic', 'big rock'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'genre' as const,
      aspect: 'style' as const,
    },
    description: 'Large-scale anthemic rock style',
    examples: [
      'make it arena rock',
      'add stadium feel',
      'create anthemic sound',
    ] as const,
  },
];

// =============================================================================
// Export combined vocabulary
// =============================================================================

export const BATCH_69_VOCABULARY: readonly Lexeme[] = [
  ...HIP_HOP_TRAP_VOCABULARY,
  ...EDM_VOCABULARY,
  ...JAZZ_FUSION_VOCABULARY,
  ...ROCK_METAL_VOCABULARY,
];
