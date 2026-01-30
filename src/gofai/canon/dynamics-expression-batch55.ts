/**
 * GOFAI Canon — Musical Dynamics and Expression Vocabulary (Batch 55)
 *
 * Comprehensive vocabulary for describing dynamics, articulation, expression,
 * and performance nuance in music. Critical for production and arrangement control.
 *
 * Categories:
 * 1. Dynamic levels (pp, p, mp, mf, f, ff, etc.)
 * 2. Dynamic changes (crescendo, diminuendo, swell, fade)
 * 3. Articulation types (staccato, legato, marcato, tenuto)
 * 4. Attack characteristics (soft, hard, percussive, gentle)
 * 5. Envelope shaping (sustained, short, plucky, smooth)
 * 6. Expression modifiers (expressive, mechanical, humanized)
 *
 * Connects natural language like "make it more expressive", "add a crescendo",
 * "soften the attacks" to concrete parameters and transformations.
 *
 * @module gofai/canon/dynamics-expression-batch55
 */

import type { Lexeme } from './types';
import { createLexemeId, createAxisId, createOpcodeId } from './types';

// =============================================================================
// 1. Dynamic Levels
// =============================================================================

export const DYNAMIC_LEVELS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'pianissimo'),
    lemma: 'pianissimo',
    variants: ['pianissimo', 'very_soft', 'very_quiet', 'pp', 'pianississimo', 'ppp'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'decrease',
    },
    description: 'Very soft dynamics',
    examples: ['make it pianissimo', 'bring it down to pp', 'very soft dynamics'],
  },
  {
    id: createLexemeId('adj', 'piano'),
    lemma: 'piano',
    variants: ['piano', 'soft', 'quiet', 'p', 'gentle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'decrease',
    },
    description: 'Soft dynamics',
    examples: ['make it piano', 'soft dynamics', 'play it quietly'],
  },
  {
    id: createLexemeId('adj', 'mezzo-piano'),
    lemma: 'mezzo_piano',
    variants: ['mezzo_piano', 'moderately_soft', 'mp', 'medium_soft'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'decrease',
    },
    description: 'Moderately soft dynamics',
    examples: ['mezzo piano in the verse', 'moderately soft', 'mp dynamics'],
  },
  {
    id: createLexemeId('adj', 'mezzo-forte'),
    lemma: 'mezzo_forte',
    variants: ['mezzo_forte', 'moderately_loud', 'mf', 'medium_loud'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'increase',
    },
    description: 'Moderately loud dynamics',
    examples: ['mezzo forte', 'moderately loud', 'mf dynamics'],
  },
  {
    id: createLexemeId('adj', 'forte'),
    lemma: 'forte',
    variants: ['forte', 'loud', 'strong', 'f', 'powerful'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'increase',
    },
    description: 'Loud dynamics',
    examples: ['make it forte', 'loud dynamics', 'play it strong'],
  },
  {
    id: createLexemeId('adj', 'fortissimo'),
    lemma: 'fortissimo',
    variants: ['fortissimo', 'very_loud', 'very_strong', 'ff', 'fortississimo', 'fff'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'increase',
    },
    description: 'Very loud dynamics',
    examples: ['make it fortissimo', 'very loud', 'ff dynamics'],
  },
  {
    id: createLexemeId('adj', 'whisper'),
    lemma: 'whisper',
    variants: ['whisper', 'whispered', 'barely_audible', 'hushed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'decrease',
    },
    description: 'Extremely soft, whisper-like',
    examples: ['make it whisper quiet', 'whispered vocals', 'barely audible'],
  },
  {
    id: createLexemeId('adj', 'thunderous'),
    lemma: 'thunderous',
    variants: ['thunderous', 'massive', 'crushing', 'overwhelming'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'increase',
    },
    description: 'Extremely loud, overwhelming',
    examples: ['make it thunderous', 'thunderous drums', 'massive dynamics'],
  },
];

// =============================================================================
// 2. Dynamic Changes
// =============================================================================

export const DYNAMIC_CHANGES: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'crescendo'),
    lemma: 'crescendo',
    variants: ['crescendo', 'cresc', 'get_louder', 'build_up', 'swell', 'grow'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('crescendo'),
      role: 'main',
    },
    description: 'Gradually increase loudness',
    examples: ['add a crescendo', 'crescendo into the chorus', 'get louder over 4 bars'],
  },
  {
    id: createLexemeId('verb', 'diminuendo'),
    lemma: 'diminuendo',
    variants: ['diminuendo', 'dim', 'decrescendo', 'decresc', 'get_quieter', 'fade_down'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('diminuendo'),
      role: 'main',
    },
    description: 'Gradually decrease loudness',
    examples: ['add a diminuendo', 'diminuendo at the end', 'get quieter gradually'],
  },
  {
    id: createLexemeId('verb', 'swell'),
    lemma: 'swell',
    variants: ['swell', 'bloom', 'bulge', 'rise_and_fall'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('dynamic_swell'),
      role: 'main',
    },
    description: 'Increase then decrease loudness',
    examples: ['add a swell', 'make it swell up and back down', 'bloom the strings'],
  },
  {
    id: createLexemeId('verb', 'fade-in'),
    lemma: 'fade_in',
    variants: ['fade_in', 'fade_up', 'bring_in', 'introduce'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('fade_in'),
      role: 'main',
    },
    description: 'Gradually introduce from silence',
    examples: ['fade in the pad', 'bring in the vocals', 'fade up over 2 bars'],
  },
  {
    id: createLexemeId('verb', 'fade-out'),
    lemma: 'fade_out',
    variants: ['fade_out', 'fade_down', 'fade_away', 'remove'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('fade_out'),
      role: 'main',
    },
    description: 'Gradually fade to silence',
    examples: ['fade out the drums', 'fade away at the end', 'fade down over 4 bars'],
  },
  {
    id: createLexemeId('verb', 'spike'),
    lemma: 'spike',
    variants: ['spike', 'burst', 'punch', 'hit', 'accent_peak'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('dynamic_spike'),
      role: 'main',
    },
    description: 'Sudden brief increase in loudness',
    examples: ['add a spike on the downbeat', 'spike the snare', 'sudden burst'],
  },
  {
    id: createLexemeId('verb', 'drop'),
    lemma: 'drop',
    variants: ['drop', 'cut', 'duck', 'dip', 'sudden_decrease'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('dynamic_drop'),
      role: 'main',
    },
    description: 'Sudden brief decrease in loudness',
    examples: ['drop the bass', 'sudden dynamic drop', 'duck the volume'],
  },
  {
    id: createLexemeId('verb', 'pulse'),
    lemma: 'pulse',
    variants: ['pulse', 'pump', 'breathe', 'undulate', 'throb'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('rhythmic_pulse'),
      role: 'main',
    },
    description: 'Rhythmic dynamic variation',
    examples: ['make it pulse rhythmically', 'add a pumping effect', 'breathing dynamics'],
  },
];

// =============================================================================
// 3. Articulation Types
// =============================================================================

export const ARTICULATIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'staccato'),
    lemma: 'staccato',
    variants: ['staccato', 'short', 'detached', 'crisp', 'separated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Short, detached notes',
    examples: ['make it staccato', 'short detached notes', 'crisp articulation'],
  },
  {
    id: createLexemeId('adj', 'legato'),
    lemma: 'legato',
    variants: ['legato', 'smooth', 'connected', 'flowing', 'sustained'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'increase',
    },
    description: 'Smooth, connected notes',
    examples: ['make it legato', 'smooth connected notes', 'flowing articulation'],
  },
  {
    id: createLexemeId('adj', 'marcato'),
    lemma: 'marcato',
    variants: ['marcato', 'marked', 'emphasized', 'accented', 'stressed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent'),
      direction: 'increase',
    },
    description: 'Strongly emphasized notes',
    examples: ['make it marcato', 'strongly emphasized', 'marked articulation'],
  },
  {
    id: createLexemeId('adj', 'tenuto'),
    lemma: 'tenuto',
    variants: ['tenuto', 'held', 'sustained', 'full_length'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain'),
      direction: 'increase',
    },
    description: 'Held for full duration',
    examples: ['make it tenuto', 'hold the full length', 'sustained notes'],
  },
  {
    id: createLexemeId('adj', 'staccatissimo'),
    lemma: 'staccatissimo',
    variants: ['staccatissimo', 'very_short', 'extremely_detached', 'super_crisp'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Very short, extremely detached',
    examples: ['make it staccatissimo', 'very short notes', 'extremely detached'],
  },
  {
    id: createLexemeId('adj', 'portato'),
    lemma: 'portato',
    variants: ['portato', 'mezzo_staccato', 'semi_detached', 'lightly_separated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Semi-detached, between staccato and legato',
    examples: ['make it portato', 'slightly separated', 'semi-staccato'],
  },
  {
    id: createLexemeId('adj', 'sforzando'),
    lemma: 'sforzando',
    variants: ['sforzando', 'sfz', 'sudden_force', 'explosive_accent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent'),
      direction: 'increase',
    },
    description: 'Sudden, forceful emphasis',
    examples: ['add sforzando accents', 'sudden explosive emphasis', 'sfz on downbeats'],
  },
  {
    id: createLexemeId('adj', 'pizzicato'),
    lemma: 'pizzicato',
    variants: ['pizzicato', 'plucked', 'pizz', 'picked'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Plucked string sound',
    examples: ['make it pizzicato', 'plucked strings', 'pizz articulation'],
  },
  {
    id: createLexemeId('adj', 'tremolo'),
    lemma: 'tremolo',
    variants: ['tremolo', 'rapid_repeat', 'shaking', 'trembling'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('vibrato'),
      direction: 'increase',
    },
    description: 'Rapid repetition or trembling',
    examples: ['add tremolo', 'rapid repeated notes', 'trembling effect'],
  },
];

// =============================================================================
// 4. Attack Characteristics
// =============================================================================

export const ATTACK_CHARACTERISTICS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'soft-attack'),
    lemma: 'soft_attack',
    variants: ['soft_attack', 'gentle_attack', 'slow_attack', 'smooth_onset'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_time'),
      direction: 'increase',
    },
    description: 'Gradual, gentle note onset',
    examples: ['soften the attacks', 'gentle attack', 'slow onset'],
  },
  {
    id: createLexemeId('adj', 'hard-attack'),
    lemma: 'hard_attack',
    variants: ['hard_attack', 'sharp_attack', 'fast_attack', 'instant_onset'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_time'),
      direction: 'decrease',
    },
    description: 'Sharp, sudden note onset',
    examples: ['make the attacks harder', 'sharp attack', 'instant onset'],
  },
  {
    id: createLexemeId('adj', 'punchy'),
    lemma: 'punchy',
    variants: ['punchy', 'snappy', 'tight', 'crisp', 'aggressive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('impact'),
      direction: 'increase',
    },
    description: 'Strong transient impact',
    examples: ['make it punchier', 'snappy attacks', 'tight and crisp'],
  },
  {
    id: createLexemeId('adj', 'percussive'),
    lemma: 'percussive',
    variants: ['percussive', 'drum_like', 'struck', 'hit'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_time'),
      direction: 'decrease',
    },
    description: 'Very fast attack, drum-like',
    examples: ['make it more percussive', 'drum-like attack', 'struck sound'],
  },
  {
    id: createLexemeId('adj', 'gentle'),
    lemma: 'gentle',
    variants: ['gentle', 'delicate', 'tender', 'subtle_onset'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_time'),
      direction: 'increase',
    },
    description: 'Soft, gradual onset',
    examples: ['make it gentler', 'delicate attack', 'subtle onset'],
  },
];

// =============================================================================
// 5. Envelope Shaping
// =============================================================================

export const ENVELOPE_SHAPING: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'sustained'),
    lemma: 'sustained',
    variants: ['sustained', 'held', 'long', 'prolonged', 'extended'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain'),
      direction: 'increase',
    },
    description: 'Long sustain time',
    examples: ['make it more sustained', 'longer sustain', 'hold the notes'],
  },
  {
    id: createLexemeId('adj', 'short-envelope'),
    lemma: 'short_envelope',
    variants: ['short', 'brief', 'quick_decay', 'fast_release'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('release_time'),
      direction: 'decrease',
    },
    description: 'Quick decay and release',
    examples: ['make the envelope shorter', 'quick decay', 'fast release'],
  },
  {
    id: createLexemeId('adj', 'plucky'),
    lemma: 'plucky',
    variants: ['plucky', 'plucked', 'struck', 'mallet_like'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('envelope_shape'),
      direction: 'increase',
    },
    description: 'Sharp attack, rapid decay',
    examples: ['make it plucky', 'plucked sound', 'struck character'],
  },
  {
    id: createLexemeId('adj', 'smooth-envelope'),
    lemma: 'smooth_envelope',
    variants: ['smooth', 'flowing', 'gentle_curve', 'gradual'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('envelope_shape'),
      direction: 'increase',
    },
    description: 'Smooth envelope transitions',
    examples: ['smooth envelope shape', 'flowing dynamics', 'gentle curve'],
  },
];

// =============================================================================
// 6. Expression Modifiers
// =============================================================================

export const EXPRESSION_MODIFIERS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'expressive'),
    lemma: 'expressive',
    variants: ['expressive', 'emotional', 'feeling', 'soulful', 'passionate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('expressiveness'),
      direction: 'increase',
    },
    description: 'Emotional, varied expression',
    examples: ['make it more expressive', 'add emotional feeling', 'soulful performance'],
  },
  {
    id: createLexemeId('adj', 'mechanical'),
    lemma: 'mechanical',
    variants: ['mechanical', 'robotic', 'rigid', 'stiff', 'quantized'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('expressiveness'),
      direction: 'decrease',
    },
    description: 'Rigid, uniform, machine-like',
    examples: ['make it more mechanical', 'robotic feel', 'rigid timing'],
  },
  {
    id: createLexemeId('adj', 'humanized'),
    lemma: 'humanized',
    variants: ['humanized', 'natural', 'organic', 'live_feeling', 'performed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('expressiveness'),
      direction: 'increase',
    },
    description: 'Natural, human-like variation',
    examples: ['humanize the MIDI', 'make it feel natural', 'add organic variation'],
  },
  {
    id: createLexemeId('adj', 'sensitive'),
    lemma: 'sensitive',
    variants: ['sensitive', 'responsive', 'nuanced', 'delicate', 'subtle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_range'),
      direction: 'increase',
    },
    description: 'Wide dynamic range, responsive',
    examples: ['more sensitive touch', 'responsive dynamics', 'nuanced expression'],
  },
  {
    id: createLexemeId('adj', 'bold'),
    lemma: 'bold',
    variants: ['bold', 'confident', 'assertive', 'strong', 'decisive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('assertiveness'),
      direction: 'increase',
    },
    description: 'Confident, assertive performance',
    examples: ['make it bolder', 'confident expression', 'assertive playing'],
  },
];

// =============================================================================
// Exports
// =============================================================================

/**
 * All dynamics and expression vocabulary entries in batch 55.
 */
export const DYNAMICS_EXPRESSION_VOCABULARY: readonly Lexeme[] = [
  ...DYNAMIC_LEVELS,
  ...DYNAMIC_CHANGES,
  ...ARTICULATIONS,
  ...ATTACK_CHARACTERISTICS,
  ...ENVELOPE_SHAPING,
  ...EXPRESSION_MODIFIERS,
];

/**
 * Count of entries in this batch.
 */
export const BATCH_55_COUNT = DYNAMICS_EXPRESSION_VOCABULARY.length;
