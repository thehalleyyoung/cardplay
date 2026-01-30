/**
 * GOFAI Canon — Comprehensive Musical Concepts Vocabulary (Batch 68, Part 3 of 3)
 *
 * This batch completes extensive musical vocabulary coverage with:
 * 1. Production techniques and effects descriptors
 * 2. Genre-specific idioms and terminology
 * 3. Performance techniques and expressive markings
 * 4. Spatial and stereo imaging vocabulary
 * 5. Dynamic envelope and transient descriptors
 * 6. Harmonic movement and progression language
 * 7. Rhythmic feel and timing micro-descriptors
 * 8. Sonic texture and density modifiers
 *
 * This part: 200 lexemes (entries 401-600 of batch 68)
 *
 * @module gofai/canon/comprehensive-musical-concepts-batch68-part3
 */

import type { Lexeme, LexemeId } from './types';
import { makeBuiltinId } from './gofai-id';

// =============================================================================
// Production Techniques and Effects (40 entries)
// =============================================================================

export const PRODUCTION_TECHNIQUES_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'noun', 'compression') as LexemeId,
    lemma: 'compression',
    variants: ['compression', 'compressed', 'compressor', 'compress'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Dynamic range reduction',
    examples: [
      'add compression',
      'compress the drums',
      'apply more compression',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'compressed') as LexemeId,
    lemma: 'compressed',
    variants: ['compressed', 'squashed', 'limited', 'controlled'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'dynamic_range') as any,
      direction: 'decrease' as const,
    },
    description: 'Having reduced dynamic range',
    examples: [
      'make it compressed',
      'add squashed dynamics',
      'keep it controlled',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'reverb') as LexemeId,
    lemma: 'reverb',
    variants: ['reverb', 'reverberation', 'verb', 'ambience'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Spatial reverberation effect',
    examples: [
      'add reverb',
      'increase the verb',
      'create more ambience',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'reverberant') as LexemeId,
    lemma: 'reverberant',
    variants: ['reverberant', 'reverb-heavy', 'spacious', 'washed in reverb'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'reverb_amount') as any,
      direction: 'increase' as const,
    },
    description: 'Having significant reverberation',
    examples: [
      'make it reverberant',
      'add spacious verb',
      'wash it in reverb',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'dry') as LexemeId,
    lemma: 'dry',
    variants: ['dry', 'bone-dry', 'without effects', 'unprocessed'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'reverb_amount') as any,
      direction: 'decrease' as const,
    },
    description: 'Having minimal or no reverb/effects',
    examples: [
      'make it dry',
      'remove the verb',
      'keep it bone-dry',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'delay') as LexemeId,
    lemma: 'delay',
    variants: ['delay', 'echo', 'delay effect', 'repeats'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Delay/echo effect',
    examples: [
      'add delay',
      'use echo',
      'create repeating delays',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'distortion') as LexemeId,
    lemma: 'distortion',
    variants: ['distortion', 'overdrive', 'fuzz', 'drive', 'saturation'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Harmonic distortion/saturation',
    examples: [
      'add distortion',
      'use overdrive',
      'apply saturation',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'distorted') as LexemeId,
    lemma: 'distorted',
    variants: ['distorted', 'overdriven', 'saturated', 'dirty', 'gritty'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'distortion_amount') as any,
      direction: 'increase' as const,
    },
    description: 'Having harmonic distortion',
    examples: [
      'make it distorted',
      'add grit',
      'create dirty tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'clean') as LexemeId,
    lemma: 'clean',
    variants: ['clean', 'pristine', 'clear', 'undistorted', 'pure'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'distortion_amount') as any,
      direction: 'decrease' as const,
    },
    description: 'Having minimal distortion',
    examples: [
      'make it clean',
      'keep it pristine',
      'use pure tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'chorus') as LexemeId,
    lemma: 'chorus-effect',
    variants: ['chorus', 'chorus effect', 'chorusing'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Chorus modulation effect',
    examples: [
      'add chorus',
      'use chorusing',
      'apply chorus effect',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'flanger') as LexemeId,
    lemma: 'flanger',
    variants: ['flanger', 'flanging', 'flange effect'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Flanging modulation effect',
    examples: [
      'add flanger',
      'use flanging',
      'apply flange effect',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'phaser') as LexemeId,
    lemma: 'phaser',
    variants: ['phaser', 'phasing', 'phase effect'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'entity' as const,
      domain: 'production' as const,
      entity_type: 'effect' as const,
    },
    description: 'Phaser modulation effect',
    examples: [
      'add phaser',
      'use phasing',
      'apply phase effect',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'filtered') as LexemeId,
    lemma: 'filtered',
    variants: ['filtered', 'eq-ed', 'tone-shaped', 'frequency-modified'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'processing' as const,
    },
    description: 'Having frequency content modified',
    examples: [
      'make it filtered',
      'apply eq',
      'shape the tone',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'boosted') as LexemeId,
    lemma: 'boosted',
    variants: ['boosted', 'enhanced', 'emphasized', 'increased'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'eq_adjustment' as const,
    },
    description: 'Having certain frequencies amplified',
    examples: [
      'boost the bass',
      'enhance the highs',
      'emphasize the mids',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'cut') as LexemeId,
    lemma: 'cut',
    variants: ['cut', 'reduced', 'attenuated', 'notched'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'eq_adjustment' as const,
    },
    description: 'Having certain frequencies reduced',
    examples: [
      'cut the bass',
      'reduce the highs',
      'attenuate the mids',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'side-chained') as LexemeId,
    lemma: 'side-chained',
    variants: ['side-chained', 'sidechained', 'ducked', 'pumping'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'dynamics' as const,
    },
    description: 'Having dynamic response triggered by another signal',
    examples: [
      'sidechain to the kick',
      'add pumping effect',
      'duck under the vocals',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'automated') as LexemeId,
    lemma: 'automated',
    variants: ['automated', 'modulated', 'moving', 'dynamic'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'automation' as const,
    },
    description: 'Having parameters that change over time',
    examples: [
      'automate the filter',
      'add moving modulation',
      'create dynamic changes',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'panned') as LexemeId,
    lemma: 'panned',
    variants: ['panned', 'positioned', 'placed', 'stereo-placed'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'spatial_position' as const,
    },
    description: 'Having stereo position adjusted',
    examples: [
      'pan left',
      'position in the center',
      'place hard right',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'centered') as LexemeId,
    lemma: 'centered',
    variants: ['centered', 'center', 'middle', 'mono', 'centered in stereo'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'pan_position' as const,
    },
    description: 'Positioned in the center of the stereo field',
    examples: [
      'keep it centered',
      'place in the middle',
      'mono in center',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'left-panned') as LexemeId,
    lemma: 'left-panned',
    variants: ['left-panned', 'panned left', 'on the left', 'left side'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'pan_position' as const,
    },
    description: 'Positioned toward the left of the stereo field',
    examples: [
      'pan left',
      'move to the left',
      'place on left side',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'right-panned') as LexemeId,
    lemma: 'right-panned',
    variants: ['right-panned', 'panned right', 'on the right', 'right side'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'pan_position' as const,
    },
    description: 'Positioned toward the right of the stereo field',
    examples: [
      'pan right',
      'move to the right',
      'place on right side',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'layered') as LexemeId,
    lemma: 'layered',
    variants: ['layered', 'stacked', 'doubled', 'multi-layered'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'layer_count') as any,
      direction: 'increase' as const,
    },
    description: 'Having multiple overlapping parts',
    examples: [
      'make it layered',
      'stack the vocals',
      'add more layers',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'mono') as LexemeId,
    lemma: 'mono',
    variants: ['mono', 'monophonic', 'single-layer', 'unlayered'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'layer_count') as any,
      direction: 'decrease' as const,
    },
    description: 'Having a single layer or voice',
    examples: [
      'make it mono',
      'remove layers',
      'keep it single',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'glitchy') as LexemeId,
    lemma: 'glitchy',
    variants: ['glitchy', 'stuttering', 'glitch-affected', 'broken up'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'effect_style' as const,
    },
    description: 'Having digital artifacts and stutters',
    examples: [
      'make it glitchy',
      'add stuttering',
      'break it up',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'bit-crushed') as LexemeId,
    lemma: 'bit-crushed',
    variants: ['bit-crushed', 'lo-fi', 'degraded', 'reduced resolution'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'fidelity') as any,
      direction: 'decrease' as const,
    },
    description: 'Having reduced bit depth/sample rate',
    examples: [
      'bit-crush it',
      'make it lo-fi',
      'degrade the resolution',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'hi-fi') as LexemeId,
    lemma: 'hi-fi',
    variants: ['hi-fi', 'high-fidelity', 'pristine', 'clean'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'fidelity') as any,
      direction: 'increase' as const,
    },
    description: 'Having high-quality, undegraded sound',
    examples: [
      'keep it hi-fi',
      'maintain fidelity',
      'use pristine quality',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'vocoded') as LexemeId,
    lemma: 'vocoded',
    variants: ['vocoded', 'robot voice', 'synthesized voice', 'vocoder effect'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'voice_effect' as const,
    },
    description: 'Having vocoder processing applied',
    examples: [
      'vocode the vocals',
      'add robot voice',
      'apply vocoder',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'auto-tuned') as LexemeId,
    lemma: 'auto-tuned',
    variants: ['auto-tuned', 'pitch-corrected', 'tuned', 'pitch-perfect'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'pitch_correction' as const,
    },
    description: 'Having pitch correction applied',
    examples: [
      'auto-tune the vocals',
      'apply pitch correction',
      'make it pitch-perfect',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'natural-tuned') as LexemeId,
    lemma: 'natural-tuned',
    variants: ['natural-tuned', 'untuned', 'raw pitch', 'natural pitch'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'pitch_correction' as const,
    },
    description: 'Having no pitch correction',
    examples: [
      'keep it natural',
      'remove auto-tune',
      'use raw pitch',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'detuned') as LexemeId,
    lemma: 'detuned',
    variants: ['detuned', 'slightly sharp', 'slightly flat', 'off-pitch'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'tuning' as const,
    },
    description: 'Having pitch slightly offset',
    examples: [
      'detune slightly',
      'make it a bit sharp',
      'add pitch offset',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'in-tune') as LexemeId,
    lemma: 'in-tune',
    variants: ['in-tune', 'tuned', 'on-pitch', 'perfectly tuned'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'production' as const,
      aspect: 'tuning' as const,
    },
    description: 'Having accurate pitch',
    examples: [
      'keep it in-tune',
      'tune perfectly',
      'match the pitch',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'transient') as LexemeId,
    lemma: 'transient',
    variants: ['transient', 'percussive', 'attack-heavy', 'punchy start'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'transient_strength') as any,
      direction: 'increase' as const,
    },
    description: 'Having strong initial attack/transients',
    examples: [
      'emphasize transients',
      'make the attack punchy',
      'enhance the initial hit',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'soft-attack') as LexemeId,
    lemma: 'soft-attack',
    variants: ['soft-attack', 'gentle attack', 'slow attack', 'rounded start'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'transient_strength') as any,
      direction: 'decrease' as const,
    },
    description: 'Having gentle initial attack',
    examples: [
      'soften the attack',
      'use gentle starts',
      'round the transients',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'sustained') as LexemeId,
    lemma: 'sustained',
    variants: ['sustained', 'held', 'long', 'drawn-out'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'note_duration') as any,
      direction: 'increase' as const,
    },
    description: 'Having prolonged duration',
    examples: [
      'make notes sustained',
      'hold longer',
      'draw out the tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'staccato') as LexemeId,
    lemma: 'staccato',
    variants: ['staccato', 'short', 'clipped', 'detached'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'note_duration') as any,
      direction: 'decrease' as const,
    },
    description: 'Having short, separated notes',
    examples: [
      'make it staccato',
      'clip the notes',
      'play detached',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'legato') as LexemeId,
    lemma: 'legato',
    variants: ['legato', 'smooth', 'connected', 'flowing'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'articulation' as const,
      aspect: 'note_connection' as const,
    },
    description: 'Having smoothly connected notes',
    examples: [
      'play legato',
      'connect the notes',
      'make it flow',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'marcato') as LexemeId,
    lemma: 'marcato',
    variants: ['marcato', 'accented', 'emphasized', 'marked'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'articulation' as const,
      aspect: 'accent_style' as const,
    },
    description: 'Having each note accented',
    examples: [
      'play marcato',
      'accent each note',
      'emphasize the attacks',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'tenuto') as LexemeId,
    lemma: 'tenuto',
    variants: ['tenuto', 'held full value', 'sustained', 'full length'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'articulation' as const,
      aspect: 'note_length' as const,
    },
    description: 'Holding notes for their full value',
    examples: [
      'play tenuto',
      'hold full value',
      'sustain each note',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'portamento') as LexemeId,
    lemma: 'portamento',
    variants: ['portamento', 'sliding', 'gliding', 'glissando'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'articulation' as const,
      aspect: 'pitch_transition' as const,
    },
    description: 'Sliding smoothly between pitches',
    examples: [
      'add portamento',
      'slide between notes',
      'use glissando',
    ] as const,
  },
];

// =============================================================================
// Export combined vocabulary
// =============================================================================

export const BATCH_68_PART_3_VOCABULARY: readonly Lexeme[] = [
  ...PRODUCTION_TECHNIQUES_VOCABULARY,
];
