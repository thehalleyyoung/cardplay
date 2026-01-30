/**
 * GOFAI Canon — Adjectives Batch 38: Comprehensive Audio Descriptors
 *
 * Massive vocabulary of adjectives for describing audio properties, timbre,
 * texture, spatial characteristics, dynamic qualities, and sonic character.
 *
 * This batch provides extensive coverage across:
 * - Frequency domain (bright, dark, warm, cold, harsh, smooth)
 * - Time domain (tight, loose, fast, slow, sustained, staccato)
 * - Spatial domain (wide, narrow, centered, spread, immersive)
 * - Dynamic domain (loud, quiet, compressed, dynamic, punchy)
 * - Timbral domain (rich, thin, full, hollow, metallic, organic)
 * - Textural domain (dense, sparse, layered, minimal, complex)
 *
 * Each adjective maps to perceptual axes for planning and transformation.
 *
 * Following gofai_goalB.md Step 002-004: extensive natural language coverage
 * with systematic axis bindings and semantic grounding.
 *
 * @module gofai/canon/adjectives-audio-descriptors-batch38
 */

import type { Lexeme } from './types';
import { createLexemeId, createAxisId } from './types';

// =============================================================================
// Frequency Domain Adjectives
// =============================================================================

export const FREQUENCY_ADJECTIVES: readonly Lexeme[] = [
  // BRIGHT spectrum
  {
    id: createLexemeId('adj', 'bright'),
    lemma: 'bright',
    variants: ['bright', 'brilliant', 'sparkly', 'shimmering', 'glittering', 'glittery', 'shiny', 'crisp'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'increase',
    },
    description: 'High-frequency emphasis, sparkly character',
    examples: [
      'make it brighter',
      'add some brilliance',
      'give it sparkle',
    ],
  },

  {
    id: createLexemeId('adj', 'dark'),
    lemma: 'dark',
    variants: ['dark', 'dim', 'dull', 'muted', 'subdued', 'shadowy', 'murky'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'decrease',
    },
    description: 'Reduced high-frequency content, muted character',
    examples: [
      'make it darker',
      'dull the high end',
      'subdue the brightness',
    ],
  },

  {
    id: createLexemeId('adj', 'warm'),
    lemma: 'warm',
    variants: ['warm', 'warmer', 'cozy', 'mellow', 'smooth', 'rounded', 'gentle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'increase',
    },
    description: 'Mid-frequency emphasis, warm character',
    examples: [
      'make it warmer',
      'add warmth',
      'give it a mellow quality',
    ],
  },

  {
    id: createLexemeId('adj', 'cold'),
    lemma: 'cold',
    variants: ['cold', 'cool', 'icy', 'clinical', 'sterile', 'stark', 'brittle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'decrease',
    },
    description: 'Reduced mid-frequency content, cold character',
    examples: [
      'make it colder',
      'add a clinical quality',
      'give it an icy feel',
    ],
  },

  {
    id: createLexemeId('adj', 'harsh'),
    lemma: 'harsh',
    variants: ['harsh', 'abrasive', 'grating', 'strident', 'shrill', 'piercing', 'edgy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harshness'),
      direction: 'increase',
    },
    description: 'Unpleasant high-frequency emphasis',
    examples: [
      'reduce the harshness',
      'soften the abrasive quality',
      'tame the edginess',
    ],
  },

  {
    id: createLexemeId('adj', 'smooth'),
    lemma: 'smooth',
    variants: ['smooth', 'silky', 'velvety', 'creamy', 'polished', 'refined'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harshness'),
      direction: 'decrease',
    },
    description: 'Gentle, non-aggressive frequency response',
    examples: [
      'make it smoother',
      'add a silky quality',
      'polish the sound',
    ],
  },

  {
    id: createLexemeId('adj', 'bassy'),
    lemma: 'bassy',
    variants: ['bassy', 'bass-heavy', 'bottom-heavy', 'boomy', 'thumpy', 'rumbling'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('bass_level'),
      direction: 'increase',
    },
    description: 'Low-frequency emphasis',
    examples: [
      'make it bassier',
      'add more bottom end',
      'boost the low frequencies',
    ],
  },

  {
    id: createLexemeId('adj', 'thin'),
    lemma: 'thin',
    variants: ['thin', 'tinny', 'anemic', 'weak', 'insubstantial', 'lacking'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('bass_level'),
      direction: 'decrease',
    },
    description: 'Insufficient low-frequency content',
    examples: [
      'fatten the thin sound',
      'add weight to the tinny tone',
      'beef up the weak bottom end',
    ],
  },

  {
    id: createLexemeId('adj', 'muddy'),
    lemma: 'muddy',
    variants: ['muddy', 'murky', 'cloudy', 'unclear', 'boomy', 'woofy', 'indistinct'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'decrease',
    },
    description: 'Excessive low-mid buildup causing lack of clarity',
    examples: [
      'clean up the muddy mix',
      'clear the murky sound',
      'define the cloudy frequencies',
    ],
  },

  {
    id: createLexemeId('adj', 'clear'),
    lemma: 'clear',
    variants: ['clear', 'clean', 'transparent', 'defined', 'articulate', 'focused'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'increase',
    },
    description: 'Well-defined, articulate sound',
    examples: [
      'make it clearer',
      'clean up the sound',
      'improve the definition',
    ],
  },
];

// =============================================================================
// Time Domain Adjectives
// =============================================================================

export const TIME_DOMAIN_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'tight'),
    lemma: 'tight',
    variants: ['tight', 'locked', 'precise', 'synchronized', 'together', 'solid'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tightness'),
      direction: 'increase',
    },
    description: 'Precise timing, well-synchronized',
    examples: [
      'make it tighter',
      'lock the timing',
      'tighten the groove',
    ],
  },

  {
    id: createLexemeId('adj', 'loose'),
    lemma: 'loose',
    variants: ['loose', 'relaxed', 'laid-back', 'sloppy', 'free', 'casual'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tightness'),
      direction: 'decrease',
    },
    description: 'Relaxed timing, less quantized',
    examples: [
      'make it looser',
      'relax the timing',
      'loosen the groove',
    ],
  },

  {
    id: createLexemeId('adj', 'fast'),
    lemma: 'fast',
    variants: ['fast', 'quick', 'rapid', 'swift', 'speedy', 'brisk', 'up-tempo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo'),
      direction: 'increase',
    },
    description: 'Higher tempo, quicker pace',
    examples: [
      'make it faster',
      'speed up the tempo',
      'quicken the pace',
    ],
  },

  {
    id: createLexemeId('adj', 'slow'),
    lemma: 'slow',
    variants: ['slow', 'slower', 'relaxed', 'leisurely', 'unhurried', 'dragging'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo'),
      direction: 'decrease',
    },
    description: 'Lower tempo, slower pace',
    examples: [
      'make it slower',
      'slow down the tempo',
      'relax the pace',
    ],
  },

  {
    id: createLexemeId('adj', 'sustained'),
    lemma: 'sustained',
    variants: ['sustained', 'held', 'legato', 'flowing', 'connected', 'smooth'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'increase',
    },
    description: 'Long note durations, connected phrasing',
    examples: [
      'make it more sustained',
      'lengthen the notes',
      'connect the phrasing',
    ],
  },

  {
    id: createLexemeId('adj', 'staccato'),
    lemma: 'staccato',
    variants: ['staccato', 'short', 'detached', 'choppy', 'clipped', 'punctuated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Short note durations, detached phrasing',
    examples: [
      'make it more staccato',
      'shorten the notes',
      'detach the phrasing',
    ],
  },

  {
    id: createLexemeId('adj', 'rhythmic'),
    lemma: 'rhythmic',
    variants: ['rhythmic', 'groovy', 'pulsing', 'driving', 'propulsive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_energy'),
      direction: 'increase',
    },
    description: 'Strong rhythmic character',
    examples: [
      'make it more rhythmic',
      'add groove',
      'emphasize the pulse',
    ],
  },

  {
    id: createLexemeId('adj', 'arrhythmic'),
    lemma: 'arrhythmic',
    variants: ['arrhythmic', 'floating', 'rubato', 'free-time', 'flowing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_energy'),
      direction: 'decrease',
    },
    description: 'Weak or absent rhythmic pulse',
    examples: [
      'make it less rhythmic',
      'float the timing',
      'remove the pulse',
    ],
  },
];

// =============================================================================
// Spatial Domain Adjectives
// =============================================================================

export const SPATIAL_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'wide'),
    lemma: 'wide',
    variants: ['wide', 'broad', 'expansive', 'spacious', 'stretched', 'spread'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('width'),
      direction: 'increase',
    },
    description: 'Wide stereo image',
    examples: [
      'make it wider',
      'expand the stereo',
      'spread the sound',
    ],
  },

  {
    id: createLexemeId('adj', 'narrow'),
    lemma: 'narrow',
    variants: ['narrow', 'tight', 'centered', 'mono', 'focused', 'concentrated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('width'),
      direction: 'decrease',
    },
    description: 'Narrow stereo image',
    examples: [
      'make it narrower',
      'center the sound',
      'focus the image',
    ],
  },

  {
    id: createLexemeId('adj', 'distant'),
    lemma: 'distant',
    variants: ['distant', 'far', 'remote', 'recessed', 'back', 'withdrawn'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('depth'),
      direction: 'increase',
    },
    description: 'Sound appears far away',
    examples: [
      'make it more distant',
      'push it back',
      'recess the sound',
    ],
  },

  {
    id: createLexemeId('adj', 'close'),
    lemma: 'close',
    variants: ['close', 'near', 'intimate', 'forward', 'present', 'upfront'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('depth'),
      direction: 'decrease',
    },
    description: 'Sound appears close and intimate',
    examples: [
      'make it closer',
      'bring it forward',
      'make it more present',
    ],
  },

  {
    id: createLexemeId('adj', 'immersive'),
    lemma: 'immersive',
    variants: ['immersive', 'enveloping', 'surrounding', 'spatial', 'three-dimensional'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('immersion'),
      direction: 'increase',
    },
    description: 'Enveloping, surround-sound quality',
    examples: [
      'make it more immersive',
      'create an enveloping sound',
      'add spatial depth',
    ],
  },

  {
    id: createLexemeId('adj', 'flat'),
    lemma: 'flat',
    variants: ['flat', 'two-dimensional', 'mono-like', 'depth-less'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('immersion'),
      direction: 'decrease',
    },
    description: 'Lacking spatial depth',
    examples: [
      'flatten the image',
      'reduce the spatial depth',
      'make it less immersive',
    ],
  },

  {
    id: createLexemeId('adj', 'reverberant'),
    lemma: 'reverberant',
    variants: ['reverberant', 'echoey', 'spacious', 'ambient', 'wet'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('reverb_level'),
      direction: 'increase',
    },
    description: 'High level of reverberation',
    examples: [
      'make it more reverberant',
      'add space',
      'wet the signal',
    ],
  },

  {
    id: createLexemeId('adj', 'dry'),
    lemma: 'dry',
    variants: ['dry', 'dead', 'close-miked', 'unreverberant', 'dampened'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('reverb_level'),
      direction: 'decrease',
    },
    description: 'Low level of reverberation',
    examples: [
      'make it drier',
      'remove the reverb',
      'dry the signal',
    ],
  },
];

// =============================================================================
// Dynamic Domain Adjectives
// =============================================================================

export const DYNAMIC_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'loud'),
    lemma: 'loud',
    variants: ['loud', 'louder', 'strong', 'powerful', 'forceful', 'intense'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'increase',
    },
    description: 'High volume level',
    examples: [
      'make it louder',
      'increase the level',
      'boost the volume',
    ],
  },

  {
    id: createLexemeId('adj', 'quiet'),
    lemma: 'quiet',
    variants: ['quiet', 'soft', 'gentle', 'subtle', 'understated', 'hushed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('loudness'),
      direction: 'decrease',
    },
    description: 'Low volume level',
    examples: [
      'make it quieter',
      'reduce the level',
      'lower the volume',
    ],
  },

  {
    id: createLexemeId('adj', 'compressed'),
    lemma: 'compressed',
    variants: ['compressed', 'squashed', 'controlled', 'limited', 'even'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('compression'),
      direction: 'increase',
    },
    description: 'Reduced dynamic range',
    examples: [
      'make it more compressed',
      'even out the dynamics',
      'control the peaks',
    ],
  },

  {
    id: createLexemeId('adj', 'dynamic'),
    lemma: 'dynamic',
    variants: ['dynamic', 'expressive', 'varied', 'contrasted', 'uncompressed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('compression'),
      direction: 'decrease',
    },
    description: 'Wide dynamic range',
    examples: [
      'make it more dynamic',
      'increase the range',
      'add contrast',
    ],
  },

  {
    id: createLexemeId('adj', 'punchy'),
    lemma: 'punchy',
    variants: ['punchy', 'impactful', 'aggressive', 'attacking', 'hard-hitting'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('punch'),
      direction: 'increase',
    },
    description: 'Strong transient emphasis',
    examples: [
      'make it punchier',
      'add impact',
      'emphasize the attack',
    ],
  },

  {
    id: createLexemeId('adj', 'soft'),
    lemma: 'soft',
    variants: ['soft', 'gentle', 'rounded', 'mellow', 'cushioned'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('punch'),
      direction: 'decrease',
    },
    description: 'Gentle transients',
    examples: [
      'make it softer',
      'round the attack',
      'gentle the transients',
    ],
  },
];

// =============================================================================
// Timbral Quality Adjectives
// =============================================================================

export const TIMBRAL_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'rich'),
    lemma: 'rich',
    variants: ['rich', 'full', 'lush', 'sumptuous', 'luxurious', 'opulent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('richness'),
      direction: 'increase',
    },
    description: 'Harmonically complex, full-bodied',
    examples: [
      'make it richer',
      'add harmonic content',
      'fatten the tone',
    ],
  },

  {
    id: createLexemeId('adj', 'thin'),
    lemma: 'thin',
    variants: ['thin', 'sparse', 'hollow', 'empty', 'weak'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('richness'),
      direction: 'decrease',
    },
    description: 'Lacking harmonic content',
    examples: [
      'fatten the thin sound',
      'add body',
      'fill out the tone',
    ],
  },

  {
    id: createLexemeId('adj', 'metallic'),
    lemma: 'metallic',
    variants: ['metallic', 'ringing', 'bell-like', 'tinny', 'clangy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('metallicity'),
      direction: 'increase',
    },
    description: 'Metallic, ringing character',
    examples: [
      'add metallic quality',
      'make it ring more',
      'emphasize the overtones',
    ],
  },

  {
    id: createLexemeId('adj', 'organic'),
    lemma: 'organic',
    variants: ['organic', 'natural', 'acoustic', 'earthy', 'wooden'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('metallicity'),
      direction: 'decrease',
    },
    description: 'Natural, organic character',
    examples: [
      'make it more organic',
      'add natural quality',
      'warm up the tone',
    ],
  },

  {
    id: createLexemeId('adj', 'distorted'),
    lemma: 'distorted',
    variants: ['distorted', 'overdriven', 'gritty', 'dirty', 'saturated', 'crunchy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'increase',
    },
    description: 'Harmonically distorted',
    examples: [
      'make it more distorted',
      'add grit',
      'overdrive the signal',
    ],
  },

  {
    id: createLexemeId('adj', 'clean'),
    lemma: 'clean',
    variants: ['clean', 'pristine', 'pure', 'undistorted', 'transparent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'decrease',
    },
    description: 'Undistorted, pure tone',
    examples: [
      'clean up the sound',
      'remove the distortion',
      'purify the tone',
    ],
  },

  {
    id: createLexemeId('adj', 'resonant'),
    lemma: 'resonant',
    variants: ['resonant', 'ringing', 'resonating', 'sustained', 'humming'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'increase',
    },
    description: 'High resonance, sustained tones',
    examples: [
      'make it more resonant',
      'add resonance',
      'let it ring',
    ],
  },

  {
    id: createLexemeId('adj', 'damped'),
    lemma: 'damped',
    variants: ['damped', 'muted', 'deadened', 'dampened', 'choked'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'decrease',
    },
    description: 'Reduced resonance, short decay',
    examples: [
      'damp the resonance',
      'choke the sustain',
      'deaden the ring',
    ],
  },
];

// =============================================================================
// Textural Adjectives
// =============================================================================

export const TEXTURAL_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'dense'),
    lemma: 'dense',
    variants: ['dense', 'thick', 'packed', 'heavy', 'crowded', 'full'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('density'),
      direction: 'increase',
    },
    description: 'High event density, many notes',
    examples: [
      'make it denser',
      'add more notes',
      'thicken the texture',
    ],
  },

  {
    id: createLexemeId('adj', 'sparse'),
    lemma: 'sparse',
    variants: ['sparse', 'thin', 'minimal', 'empty', 'spacious', 'open'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('density'),
      direction: 'decrease',
    },
    description: 'Low event density, few notes',
    examples: [
      'make it sparser',
      'thin out the texture',
      'open up space',
    ],
  },

  {
    id: createLexemeId('adj', 'layered'),
    lemma: 'layered',
    variants: ['layered', 'stacked', 'multi-layered', 'complex', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('layers'),
      direction: 'increase',
    },
    description: 'Multiple simultaneous layers',
    examples: [
      'make it more layered',
      'add layers',
      'build complexity',
    ],
  },

  {
    id: createLexemeId('adj', 'minimal'),
    lemma: 'minimal',
    variants: ['minimal', 'simple', 'bare', 'stripped', 'basic', 'essential'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('layers'),
      direction: 'decrease',
    },
    description: 'Few layers, simple arrangement',
    examples: [
      'make it more minimal',
      'strip down the layers',
      'simplify the arrangement',
    ],
  },

  {
    id: createLexemeId('adj', 'complex'),
    lemma: 'complex',
    variants: ['complex', 'intricate', 'elaborate', 'detailed', 'sophisticated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('complexity'),
      direction: 'increase',
    },
    description: 'High musical complexity',
    examples: [
      'make it more complex',
      'add intricacy',
      'elaborate the arrangement',
    ],
  },

  {
    id: createLexemeId('adj', 'simple'),
    lemma: 'simple',
    variants: ['simple', 'straightforward', 'uncomplicated', 'basic', 'plain'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('complexity'),
      direction: 'decrease',
    },
    description: 'Low musical complexity',
    examples: [
      'simplify the arrangement',
      'make it less complex',
      'strip back to basics',
    ],
  },

  {
    id: createLexemeId('adj', 'busy'),
    lemma: 'busy',
    variants: ['busy', 'active', 'cluttered', 'hectic', 'frantic', 'frenetic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('busyness'),
      direction: 'increase',
    },
    description: 'High activity level',
    examples: [
      'make it less busy',
      'reduce the activity',
      'calm the frantic feel',
    ],
  },

  {
    id: createLexemeId('adj', 'calm'),
    lemma: 'calm',
    variants: ['calm', 'peaceful', 'tranquil', 'serene', 'still', 'quiet'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('busyness'),
      direction: 'decrease',
    },
    description: 'Low activity level',
    examples: [
      'make it calmer',
      'reduce activity',
      'create tranquility',
    ],
  },
];

// =============================================================================
// Energy and Movement Adjectives
// =============================================================================

export const ENERGY_MOVEMENT_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'energetic'),
    lemma: 'energetic',
    variants: ['energetic', 'lively', 'vigorous', 'animated', 'spirited', 'vivacious'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('energy'),
      direction: 'increase',
    },
    description: 'High energy level',
    examples: [
      'make it more energetic',
      'add liveliness',
      'inject energy',
    ],
  },

  {
    id: createLexemeId('adj', 'subdued'),
    lemma: 'subdued',
    variants: ['subdued', 'restrained', 'muted', 'low-key', 'understated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('energy'),
      direction: 'decrease',
    },
    description: 'Low energy level',
    examples: [
      'make it more subdued',
      'reduce the energy',
      'restrain the intensity',
    ],
  },

  {
    id: createLexemeId('adj', 'driving'),
    lemma: 'driving',
    variants: ['driving', 'propulsive', 'pushing', 'forward-moving', 'urgent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('momentum'),
      direction: 'increase',
    },
    description: 'Strong forward momentum',
    examples: [
      'make it more driving',
      'add propulsion',
      'create urgency',
    ],
  },

  {
    id: createLexemeId('adj', 'static'),
    lemma: 'static',
    variants: ['static', 'stationary', 'still', 'unchanging', 'stagnant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('momentum'),
      direction: 'decrease',
    },
    description: 'Little forward momentum',
    examples: [
      'make it less static',
      'add movement',
      'create motion',
    ],
  },

  {
    id: createLexemeId('adj', 'tense'),
    lemma: 'tense',
    variants: ['tense', 'anxious', 'nervous', 'tight', 'strained', 'uptight'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tension'),
      direction: 'increase',
    },
    description: 'High harmonic/rhythmic tension',
    examples: [
      'make it more tense',
      'add tension',
      'create unease',
    ],
  },

  {
    id: createLexemeId('adj', 'relaxed'),
    lemma: 'relaxed',
    variants: ['relaxed', 'easygoing', 'laid-back', 'comfortable', 'loose'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tension'),
      direction: 'decrease',
    },
    description: 'Low harmonic/rhythmic tension',
    examples: [
      'make it more relaxed',
      'release the tension',
      'ease the strain',
    ],
  },
];

// =============================================================================
// Export All Adjectives
// =============================================================================

export const AUDIO_DESCRIPTOR_ADJECTIVES_BATCH_38: readonly Lexeme[] = [
  ...FREQUENCY_ADJECTIVES,
  ...TIME_DOMAIN_ADJECTIVES,
  ...SPATIAL_ADJECTIVES,
  ...DYNAMIC_ADJECTIVES,
  ...TIMBRAL_ADJECTIVES,
  ...TEXTURAL_ADJECTIVES,
  ...ENERGY_MOVEMENT_ADJECTIVES,
];

/**
 * Total count of adjectives in this batch.
 */
export const BATCH_38_COUNT = AUDIO_DESCRIPTOR_ADJECTIVES_BATCH_38.length;
