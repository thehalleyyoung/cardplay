/**
 * GOFAI Domain Nouns — Batch 6: Production, Mixing, and Audio Engineering
 *
 * Comprehensive vocabulary for studio production, mixing concepts, audio
 * processing, effects, and engineering terminology. Supports natural language
 * references to production techniques, mix elements, and signal processing.
 *
 * Part of Phase 1 — Canonical Ontology (Steps 051-100)
 *
 * @module gofai/canon/domain-nouns-batch6
 */

import {
  createLexemeId,
} from './types.js';
import type { DomainNoun } from './domain-nouns.js';

// ============================================================================
// Mix Balance and Positioning
// ============================================================================

const MIX_CONCEPTS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'mix'),
    term: 'mix',
    variants: ['mixing', 'mixdown', 'balance'],
    category: 'production',
    definition: 'Overall balance and blend of all elements',
    semantics: { type: 'entity_ref', entityType: 'mix' },
    examples: [
      'improve the mix balance',
      'clean up the mixing',
      'adjust the overall balance',
    ],
  },
  {
    id: createLexemeId('noun', 'panning'),
    term: 'panning',
    variants: ['pan', 'stereo-position', 'placement'],
    category: 'production',
    definition: 'Left-right positioning in the stereo field',
    semantics: { type: 'property', propertyOf: 'spatial' },
    examples: [
      'widen the panning',
      'adjust the pan position',
      'spread the stereo-position',
    ],
  },
  {
    id: createLexemeId('noun', 'level'),
    term: 'level',
    variants: ['levels', 'volume', 'gain', 'fader'],
    category: 'production',
    definition: 'Amplitude or loudness of a signal',
    semantics: { type: 'property', propertyOf: 'amplitude' },
    examples: [
      'raise the levels',
      'adjust the volume',
      'increase the gain',
    ],
  },
  {
    id: createLexemeId('noun', 'headroom'),
    term: 'headroom',
    variants: ['dynamic-range', 'peak-room'],
    category: 'production',
    definition: 'Space between average and maximum level',
    semantics: { type: 'property', propertyOf: 'dynamics' },
    examples: [
      'add more headroom',
      'preserve dynamic-range',
      'create peak-room',
    ],
  },
  {
    id: createLexemeId('noun', 'clarity'),
    term: 'clarity',
    variants: ['definition', 'separation', 'articulation'],
    category: 'production',
    definition: 'Distinctness and separation of elements',
    semantics: { type: 'quality', qualityDimension: 'clarity' },
    examples: [
      'improve clarity in the mix',
      'add definition to the bass',
      'create better separation',
    ],
  },
  {
    id: createLexemeId('noun', 'depth'),
    term: 'depth',
    variants: ['dimension', 'three-dimensionality', 'front-to-back'],
    category: 'production',
    definition: 'Perceived distance from front to back',
    semantics: { type: 'quality', qualityDimension: 'spatial' },
    examples: [
      'add depth to the mix',
      'create dimension',
      'improve front-to-back positioning',
    ],
  },
  {
    id: createLexemeId('noun', 'width'),
    term: 'width',
    variants: ['stereo-width', 'spread', 'stereo-image'],
    category: 'production',
    definition: 'Left-right extent of the stereo field',
    semantics: { type: 'quality', qualityDimension: 'spatial' },
    examples: [
      'increase the width',
      'narrow the stereo-width',
      'widen the spread',
    ],
  },
  {
    id: createLexemeId('noun', 'punch'),
    term: 'punch',
    variants: ['impact', 'attack', 'transient-strength'],
    category: 'production',
    definition: 'Sharp, impactful quality of transients',
    semantics: { type: 'quality', qualityDimension: 'dynamics' },
    examples: [
      'add more punch',
      'increase the impact',
      'enhance transient-strength',
    ],
  },
  {
    id: createLexemeId('noun', 'glue'),
    term: 'glue',
    variants: ['cohesion', 'blend', 'integration'],
    category: 'production',
    definition: 'Quality that makes elements sound unified',
    semantics: { type: 'quality', qualityDimension: 'cohesion' },
    examples: [
      'add mix glue',
      'improve cohesion',
      'create better blend',
    ],
  },
];

// ============================================================================
// Frequency Ranges and EQ
// ============================================================================

const FREQUENCY_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'sub-bass'),
    term: 'sub-bass',
    variants: ['sub', 'low-end', 'bottom'],
    category: 'production',
    definition: 'Very low frequencies below 60 Hz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'boost the sub-bass',
      'clean up the sub',
      'add weight in the low-end',
    ],
  },
  {
    id: createLexemeId('noun', 'bass'),
    term: 'bass',
    variants: ['low-frequencies', 'lows', 'bass-range'],
    category: 'production',
    definition: 'Low frequencies from 60-250 Hz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'reduce the bass',
      'enhance low-frequencies',
      'cut the lows',
    ],
  },
  {
    id: createLexemeId('noun', 'low-mids'),
    term: 'low-mids',
    variants: ['lower-midrange', 'warmth-region'],
    category: 'production',
    definition: 'Frequencies from 250-500 Hz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'cut the low-mids',
      'reduce lower-midrange',
      'clean up the warmth-region',
    ],
  },
  {
    id: createLexemeId('noun', 'midrange'),
    term: 'midrange',
    variants: ['mids', 'middle-frequencies', 'mid-frequencies'],
    category: 'production',
    definition: 'Frequencies from 500 Hz-2 kHz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'boost the midrange',
      'enhance the mids',
      'add presence in middle-frequencies',
    ],
  },
  {
    id: createLexemeId('noun', 'high-mids'),
    term: 'high-mids',
    variants: ['upper-midrange', 'presence-region'],
    category: 'production',
    definition: 'Frequencies from 2-6 kHz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'boost high-mids for clarity',
      'reduce upper-midrange harshness',
      'enhance the presence-region',
    ],
  },
  {
    id: createLexemeId('noun', 'highs'),
    term: 'highs',
    variants: ['high-frequencies', 'treble', 'top-end'],
    category: 'production',
    definition: 'High frequencies from 6-12 kHz',
    semantics: { type: 'property', propertyOf: 'frequency' },
    examples: [
      'brighten the highs',
      'add high-frequencies',
      'enhance the treble',
    ],
  },
  {
    id: createLexemeId('noun', 'air'),
    term: 'air',
    variants: ['brilliance', 'ultra-highs', 'sparkle'],
    category: 'production',
    definition: 'Very high frequencies above 12 kHz',
    semantics: { type: 'quality', qualityDimension: 'brightness' },
    examples: [
      'add air to the mix',
      'enhance brilliance',
      'boost ultra-highs',
    ],
  },
  {
    id: createLexemeId('noun', 'mud'),
    term: 'mud',
    variants: ['muddiness', 'low-mid-buildup', 'cloudiness'],
    category: 'production',
    definition: 'Excessive energy in low-mid frequencies',
    semantics: { type: 'quality', qualityDimension: 'clarity' },
    examples: [
      'remove the mud',
      'clean up muddiness',
      'reduce low-mid-buildup',
    ],
  },
  {
    id: createLexemeId('noun', 'harshness'),
    term: 'harshness',
    variants: ['harsh-frequencies', 'edge', 'brittleness'],
    category: 'production',
    definition: 'Unpleasant high-mid frequency content',
    semantics: { type: 'quality', qualityDimension: 'harshness' },
    examples: [
      'reduce harshness',
      'tame harsh-frequencies',
      'soften the edge',
    ],
  },
];

// ============================================================================
// Effects and Processing
// ============================================================================

const EFFECTS_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'reverb'),
    term: 'reverb',
    variants: ['reverberation', 'room', 'space', 'ambience'],
    category: 'effect',
    definition: 'Reflections simulating acoustic space',
    semantics: { type: 'process', processType: 'spatial' },
    examples: [
      'add reverb',
      'increase reverberation',
      'create space with room',
    ],
  },
  {
    id: createLexemeId('noun', 'delay'),
    term: 'delay',
    variants: ['echo', 'repeat', 'slapback'],
    category: 'effect',
    definition: 'Delayed repetitions of the signal',
    semantics: { type: 'process', processType: 'time-based' },
    examples: [
      'add delay',
      'create echo',
      'use slapback on vocals',
    ],
  },
  {
    id: createLexemeId('noun', 'compression'),
    term: 'compression',
    variants: ['compressor', 'dynamic-control', 'squash'],
    category: 'effect',
    definition: 'Reduction of dynamic range',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'add compression',
      'apply compressor',
      'use dynamic-control',
    ],
  },
  {
    id: createLexemeId('noun', 'eq'),
    term: 'eq',
    variants: ['equalization', 'equalizer', 'tone-shaping'],
    category: 'effect',
    definition: 'Frequency balance adjustment',
    semantics: { type: 'process', processType: 'tonal' },
    examples: [
      'apply eq',
      'use equalization',
      'add tone-shaping',
    ],
  },
  {
    id: createLexemeId('noun', 'saturation'),
    term: 'saturation',
    variants: ['harmonic-saturation', 'warmth', 'color'],
    category: 'effect',
    definition: 'Harmonic enrichment through soft clipping',
    semantics: { type: 'process', processType: 'harmonic' },
    examples: [
      'add saturation',
      'apply harmonic-saturation',
      'give it warmth',
    ],
  },
  {
    id: createLexemeId('noun', 'distortion'),
    term: 'distortion',
    variants: ['overdrive', 'fuzz', 'grit'],
    category: 'effect',
    definition: 'Intentional harmonic distortion',
    semantics: { type: 'process', processType: 'harmonic' },
    examples: [
      'add distortion',
      'apply overdrive',
      'give it grit',
    ],
  },
  {
    id: createLexemeId('noun', 'chorus'),
    term: 'chorus',
    variants: ['chorusing', 'doubling', 'ensemble'],
    category: 'effect',
    definition: 'Pitch-modulated copies creating thickness',
    semantics: { type: 'process', processType: 'modulation' },
    examples: [
      'add chorus',
      'apply chorusing',
      'create doubling effect',
    ],
  },
  {
    id: createLexemeId('noun', 'flanger'),
    term: 'flanger',
    variants: ['flanging', 'jet-effect', 'whoosh'],
    category: 'effect',
    definition: 'Sweeping comb filter effect',
    semantics: { type: 'process', processType: 'modulation' },
    examples: [
      'add flanger',
      'apply flanging',
      'create jet-effect',
    ],
  },
  {
    id: createLexemeId('noun', 'phaser'),
    term: 'phaser',
    variants: ['phasing', 'phase-shift'],
    category: 'effect',
    definition: 'Phase-shifted modulation effect',
    semantics: { type: 'process', processType: 'modulation' },
    examples: [
      'add phaser',
      'apply phasing',
      'use phase-shift',
    ],
  },
  {
    id: createLexemeId('noun', 'tremolo'),
    term: 'tremolo',
    variants: ['amplitude-modulation', 'volume-modulation'],
    category: 'effect',
    definition: 'Rhythmic volume modulation',
    semantics: { type: 'process', processType: 'modulation' },
    examples: [
      'add tremolo',
      'apply amplitude-modulation',
      'use volume-modulation',
    ],
  },
  {
    id: createLexemeId('noun', 'vibrato'),
    term: 'vibrato',
    variants: ['pitch-modulation', 'pitch-wobble'],
    category: 'effect',
    definition: 'Rhythmic pitch modulation',
    semantics: { type: 'process', processType: 'modulation' },
    examples: [
      'add vibrato',
      'apply pitch-modulation',
      'increase pitch-wobble',
    ],
  },
];

// ============================================================================
// Dynamics Processing
// ============================================================================

const DYNAMICS_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'limiter'),
    term: 'limiter',
    variants: ['limiting', 'brick-wall', 'ceiling'],
    category: 'effect',
    definition: 'Hard ceiling on peak levels',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'apply limiter',
      'use limiting',
      'set brick-wall ceiling',
    ],
  },
  {
    id: createLexemeId('noun', 'gate'),
    term: 'gate',
    variants: ['noise-gate', 'gating', 'expander'],
    category: 'effect',
    definition: 'Silences signal below threshold',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'apply gate',
      'use noise-gate',
      'add gating',
    ],
  },
  {
    id: createLexemeId('noun', 'expansion'),
    term: 'expansion',
    variants: ['expander', 'upward-expansion'],
    category: 'effect',
    definition: 'Increases dynamic range',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'apply expansion',
      'use expander',
      'add upward-expansion',
    ],
  },
  {
    id: createLexemeId('noun', 'transient-shaper'),
    term: 'transient-shaper',
    variants: ['transient-designer', 'envelope-shaper'],
    category: 'effect',
    definition: 'Controls attack and sustain independently',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'apply transient-shaper',
      'use transient-designer',
      'add envelope-shaper',
    ],
  },
  {
    id: createLexemeId('noun', 'sidechain'),
    term: 'sidechain',
    variants: ['side-chain', 'ducking', 'keying'],
    category: 'production',
    definition: 'Processing triggered by external signal',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'add sidechain compression',
      'apply side-chain ducking',
      'use keying',
    ],
  },
  {
    id: createLexemeId('noun', 'de-esser'),
    term: 'de-esser',
    variants: ['de-essing', 'sibilance-control'],
    category: 'effect',
    definition: 'Reduces harsh sibilant frequencies',
    semantics: { type: 'process', processType: 'dynamics' },
    examples: [
      'apply de-esser',
      'use de-essing',
      'add sibilance-control',
    ],
  },
];

// ============================================================================
// Spatial and Stereo Processing
// ============================================================================

const SPATIAL_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'stereo-widening'),
    term: 'stereo-widening',
    variants: ['widening', 'stereo-enhancement', 'spread'],
    category: 'effect',
    definition: 'Increases perceived stereo width',
    semantics: { type: 'process', processType: 'spatial' },
    examples: [
      'apply stereo-widening',
      'use widening',
      'add stereo-enhancement',
    ],
  },
  {
    id: createLexemeId('noun', 'mid-side'),
    term: 'mid-side',
    variants: ['m-s', 'mid-side-processing', 'ms-technique'],
    category: 'production',
    definition: 'Separate processing of center and sides',
    semantics: { type: 'process', processType: 'spatial' },
    examples: [
      'use mid-side processing',
      'apply m-s technique',
      'process center and sides separately',
    ],
  },
  {
    id: createLexemeId('noun', 'haas-effect'),
    term: 'haas-effect',
    variants: ['precedence-effect', 'delay-panning'],
    category: 'production',
    definition: 'Stereo width from short delays',
    semantics: { type: 'process', processType: 'spatial' },
    examples: [
      'apply haas-effect',
      'use precedence-effect',
      'create delay-panning',
    ],
  },
  {
    id: createLexemeId('noun', 'binaural'),
    term: 'binaural',
    variants: ['3d-audio', 'spatial-audio', 'head-related'],
    category: 'production',
    definition: '3D spatial audio for headphones',
    semantics: { type: 'quality', qualityDimension: 'spatial' },
    examples: [
      'create binaural mix',
      'use 3d-audio',
      'apply spatial-audio',
    ],
  },
];

// ============================================================================
// Mastering and Finalization
// ============================================================================

const MASTERING_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'mastering'),
    term: 'mastering',
    variants: ['master', 'final-polish', 'finishing'],
    category: 'production',
    definition: 'Final processing for distribution',
    semantics: { type: 'process', processType: 'finalization' },
    examples: [
      'apply mastering',
      'prepare for master',
      'add final-polish',
    ],
  },
  {
    id: createLexemeId('noun', 'loudness'),
    term: 'loudness',
    variants: ['perceived-loudness', 'lufs', 'rms'],
    category: 'production',
    definition: 'Perceived volume level',
    semantics: { type: 'property', propertyOf: 'amplitude' },
    examples: [
      'increase loudness',
      'measure perceived-loudness',
      'target lufs level',
    ],
  },
  {
    id: createLexemeId('noun', 'dithering'),
    term: 'dithering',
    variants: ['dither', 'noise-shaping', 'bit-depth-reduction'],
    category: 'production',
    definition: 'Noise added when reducing bit depth',
    semantics: { type: 'process', processType: 'conversion' },
    examples: [
      'apply dithering',
      'use dither',
      'add noise-shaping',
    ],
  },
];

// ============================================================================
// Combined Export
// ============================================================================

/**
 * All domain nouns in batch 6
 */
export const DOMAIN_NOUNS_BATCH6: readonly DomainNoun[] = [
  ...MIX_CONCEPTS,
  ...FREQUENCY_TERMS,
  ...EFFECTS_TERMS,
  ...DYNAMICS_TERMS,
  ...SPATIAL_TERMS,
  ...MASTERING_TERMS,
];

/**
 * Total count for this batch
 */
export const BATCH6_COUNT = DOMAIN_NOUNS_BATCH6.length;

/**
 * Get domain noun by ID from this batch
 */
export function getProductionNounById(id: string): DomainNoun | undefined {
  return DOMAIN_NOUNS_BATCH6.find(noun => noun.id === id);
}

/**
 * Get domain nouns by category from this batch
 */
export function getProductionNounsByCategory(
  category: string
): readonly DomainNoun[] {
  return DOMAIN_NOUNS_BATCH6.filter(noun => noun.category === category);
}
