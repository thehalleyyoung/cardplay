/**
 * GOFAI Domain Nouns — Batch 7: Rhythm, Groove, Timing, and Feel
 *
 * Comprehensive vocabulary for rhythmic concepts, groove types, timing
 * variations, rhythmic devices, and feel characteristics. Supports natural
 * language references to rhythm, timing, syncopation, and groove qualities.
 *
 * Part of Phase 1 — Canonical Ontology (Steps 051-100)
 *
 * @module gofai/canon/domain-nouns-batch7
 */

import {
  createLexemeId,
} from './types.js';
import type { DomainNoun } from './domain-nouns.js';

// ============================================================================
// Basic Rhythmic Units and Divisions
// ============================================================================

const RHYTHMIC_UNITS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'downbeat'),
    term: 'downbeat',
    variants: ['strong-beat', 'one', 'beat-one'],
    category: 'rhythm',
    definition: 'First and strongest beat of a measure',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'accent the downbeat',
      'emphasize the strong-beat',
      'mark beat-one',
    ],
  },
  {
    id: createLexemeId('noun', 'upbeat'),
    term: 'upbeat',
    variants: ['weak-beat', 'offbeat', 'backbeat'],
    category: 'rhythm',
    definition: 'Unaccented beats, especially 2 and 4',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'accent the upbeat',
      'emphasize weak-beats',
      'strengthen the backbeat',
    ],
  },
  {
    id: createLexemeId('noun', 'subdivision'),
    term: 'subdivision',
    variants: ['subdivisions', 'beat-division', 'micro-timing'],
    category: 'rhythm',
    definition: 'Division of beats into smaller units',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'tighten the subdivisions',
      'vary beat-division',
      'adjust micro-timing',
    ],
  },
  {
    id: createLexemeId('noun', 'triplet'),
    term: 'triplet',
    variants: ['triplets', 'triple-division', 'triplet-feel'],
    category: 'rhythm',
    definition: 'Three notes in the space of two',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'add triplets',
      'use triple-division',
      'create triplet-feel',
    ],
  },
  {
    id: createLexemeId('noun', 'sixteenth'),
    term: 'sixteenth',
    variants: ['sixteenths', '16th-notes', 'semiquavers'],
    category: 'rhythm',
    definition: 'Notes lasting 1/16 of a whole note',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'add sixteenth notes',
      'use 16th-notes',
      'play semiquavers',
    ],
  },
  {
    id: createLexemeId('noun', 'eighth'),
    term: 'eighth',
    variants: ['eighths', '8th-notes', 'quavers'],
    category: 'rhythm',
    definition: 'Notes lasting 1/8 of a whole note',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'use eighth notes',
      'play 8th-notes',
      'add quavers',
    ],
  },
  {
    id: createLexemeId('noun', 'quarter'),
    term: 'quarter',
    variants: ['quarters', 'quarter-notes', 'crotchets'],
    category: 'rhythm',
    definition: 'Notes lasting 1/4 of a whole note',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'play quarter notes',
      'use quarter-notes',
      'add crotchets',
    ],
  },
];

// ============================================================================
// Groove and Feel Types
// ============================================================================

const GROOVE_TYPES: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'groove'),
    term: 'groove',
    variants: ['grooves', 'pocket', 'feel'],
    category: 'feel',
    definition: 'Rhythmic pattern and timing feel',
    semantics: { type: 'quality', qualityDimension: 'rhythmic' },
    examples: [
      'tighten the groove',
      'lock into the pocket',
      'improve the feel',
    ],
  },
  {
    id: createLexemeId('noun', 'swing'),
    term: 'swing',
    variants: ['swung', 'shuffle', 'triplet-swing'],
    category: 'feel',
    definition: 'Unequal eighth note timing',
    semantics: { type: 'quality', qualityDimension: 'timing' },
    examples: [
      'add swing',
      'use swung eighths',
      'create shuffle feel',
    ],
  },
  {
    id: createLexemeId('noun', 'straight'),
    term: 'straight',
    variants: ['straight-eighths', 'even', 'quantized'],
    category: 'feel',
    definition: 'Equal division of beats',
    semantics: { type: 'quality', qualityDimension: 'timing' },
    examples: [
      'make it straight',
      'use straight-eighths',
      'play even subdivisions',
    ],
  },
  {
    id: createLexemeId('noun', 'laid-back'),
    term: 'laid-back',
    variants: ['behind-the-beat', 'relaxed', 'lazy'],
    category: 'feel',
    definition: 'Playing slightly behind the beat',
    semantics: { type: 'quality', qualityDimension: 'timing' },
    examples: [
      'make it laid-back',
      'play behind-the-beat',
      'create relaxed feel',
    ],
  },
  {
    id: createLexemeId('noun', 'pushed'),
    term: 'pushed',
    variants: ['ahead-of-the-beat', 'urgent', 'rushing'],
    category: 'feel',
    definition: 'Playing slightly ahead of the beat',
    semantics: { type: 'quality', qualityDimension: 'timing' },
    examples: [
      'make it pushed',
      'play ahead-of-the-beat',
      'create urgent feel',
    ],
  },
  {
    id: createLexemeId('noun', 'bounce'),
    term: 'bounce',
    variants: ['bouncy', 'skip', 'lilt'],
    category: 'feel',
    definition: 'Light, springy rhythmic quality',
    semantics: { type: 'quality', qualityDimension: 'rhythmic' },
    examples: [
      'add bounce',
      'make it bouncy',
      'create skip feel',
    ],
  },
  {
    id: createLexemeId('noun', 'half-time'),
    term: 'half-time',
    variants: ['halftime', 'slow-down', 'half-speed'],
    category: 'feel',
    definition: 'Feel of half the tempo',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'switch to half-time',
      'use halftime feel',
      'create slow-down effect',
    ],
  },
  {
    id: createLexemeId('noun', 'double-time'),
    term: 'double-time',
    variants: ['doubletime', 'double-speed', 'double-up'],
    category: 'feel',
    definition: 'Feel of double the tempo',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'switch to double-time',
      'use doubletime feel',
      'double-up the rhythm',
    ],
  },
];

// ============================================================================
// Syncopation and Rhythmic Devices
// ============================================================================

const RHYTHMIC_DEVICES: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'syncopation'),
    term: 'syncopation',
    variants: ['syncopated', 'off-beat-accent', 'anticipation'],
    category: 'rhythm',
    definition: 'Emphasis on weak beats or offbeats',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'add syncopation',
      'create syncopated rhythm',
      'use off-beat-accent',
    ],
  },
  {
    id: createLexemeId('noun', 'polyrhythm'),
    term: 'polyrhythm',
    variants: ['polyrhythmic', 'cross-rhythm', 'multiple-meters'],
    category: 'rhythm',
    definition: 'Multiple rhythms played simultaneously',
    semantics: { type: 'pattern', patternType: 'complex' },
    examples: [
      'create polyrhythm',
      'use polyrhythmic pattern',
      'add cross-rhythm',
    ],
  },
  {
    id: createLexemeId('noun', 'hemiola'),
    term: 'hemiola',
    variants: ['three-against-two', '3-over-2', 'metric-shift'],
    category: 'rhythm',
    definition: 'Three beats implied over two',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'add hemiola',
      'use three-against-two',
      'create metric-shift',
    ],
  },
  {
    id: createLexemeId('noun', 'clave'),
    term: 'clave',
    variants: ['clave-pattern', 'son-clave', 'rumba-clave'],
    category: 'world_rhythm',
    definition: 'Foundational Afro-Cuban rhythm pattern',
    semantics: { type: 'pattern', patternType: 'traditional' },
    examples: [
      'use clave pattern',
      'follow son-clave',
      'add rumba-clave',
    ],
    tradition: 'Afro-Cuban',
  },
  {
    id: createLexemeId('noun', 'tresillo'),
    term: 'tresillo',
    variants: ['habanera', '3-3-2-pattern'],
    category: 'world_rhythm',
    definition: 'Three-note rhythm pattern (3+3+2)',
    semantics: { type: 'pattern', patternType: 'traditional' },
    examples: [
      'use tresillo',
      'play habanera pattern',
      'add 3-3-2-pattern',
    ],
    tradition: 'Latin',
  },
  {
    id: createLexemeId('noun', 'bembe'),
    term: 'bembe',
    variants: ['bembe-pattern', '12-8-clave'],
    category: 'world_rhythm',
    definition: 'Afro-Cuban 12/8 rhythm pattern',
    semantics: { type: 'pattern', patternType: 'traditional' },
    examples: [
      'use bembe pattern',
      'play 12-8-clave',
      'add bembe feel',
    ],
    tradition: 'Afro-Cuban',
  },
  {
    id: createLexemeId('noun', 'cascara'),
    term: 'cascara',
    variants: ['cáscara', 'shell-pattern', 'timbale-pattern'],
    category: 'world_rhythm',
    definition: 'Latin rhythm played on shell of drum',
    semantics: { type: 'pattern', patternType: 'traditional' },
    examples: [
      'play cascara',
      'use shell-pattern',
      'add timbale-pattern',
    ],
    tradition: 'Latin',
  },
];

// ============================================================================
// Timing and Humanization
// ============================================================================

const TIMING_CONCEPTS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'timing'),
    term: 'timing',
    variants: ['time-feel', 'rhythmic-placement', 'onset-timing'],
    category: 'rhythm',
    definition: 'Precise or loose placement of notes',
    semantics: { type: 'quality', qualityDimension: 'precision' },
    examples: [
      'improve timing',
      'adjust time-feel',
      'tighten rhythmic-placement',
    ],
  },
  {
    id: createLexemeId('noun', 'quantization'),
    term: 'quantization',
    variants: ['quantize', 'grid-alignment', 'timing-correction'],
    category: 'production',
    definition: 'Alignment of notes to rhythmic grid',
    semantics: { type: 'process', processType: 'timing' },
    examples: [
      'apply quantization',
      'quantize to grid',
      'use timing-correction',
    ],
  },
  {
    id: createLexemeId('noun', 'humanization'),
    term: 'humanization',
    variants: ['humanize', 'timing-variation', 'groove-randomization'],
    category: 'production',
    definition: 'Adding natural timing variations',
    semantics: { type: 'process', processType: 'timing' },
    examples: [
      'apply humanization',
      'humanize the drums',
      'add timing-variation',
    ],
  },
  {
    id: createLexemeId('noun', 'rubato'),
    term: 'rubato',
    variants: ['tempo-rubato', 'tempo-flexibility', 'expressive-timing'],
    category: 'expression',
    definition: 'Flexible, expressive tempo variation',
    semantics: { type: 'quality', qualityDimension: 'expression' },
    examples: [
      'add rubato',
      'use tempo-rubato',
      'create expressive-timing',
    ],
  },
  {
    id: createLexemeId('noun', 'ritardando'),
    term: 'ritardando',
    variants: ['rit', 'slow-down', 'rallentando'],
    category: 'expression',
    definition: 'Gradual slowing of tempo',
    semantics: { type: 'process', processType: 'tempo-change' },
    examples: [
      'add ritardando',
      'use rit at end',
      'create slow-down',
    ],
  },
  {
    id: createLexemeId('noun', 'accelerando'),
    term: 'accelerando',
    variants: ['accel', 'speed-up', 'tempo-increase'],
    category: 'expression',
    definition: 'Gradual increase of tempo',
    semantics: { type: 'process', processType: 'tempo-change' },
    examples: [
      'add accelerando',
      'use accel into chorus',
      'create speed-up',
    ],
  },
  {
    id: createLexemeId('noun', 'fermata'),
    term: 'fermata',
    variants: ['hold', 'pause', 'bird-eye'],
    category: 'expression',
    definition: 'Prolonged note or rest beyond normal duration',
    semantics: { type: 'pattern', patternType: 'expressive' },
    examples: [
      'add fermata',
      'use hold on final note',
      'create pause for effect',
    ],
  },
];

// ============================================================================
// Groove Density and Activity
// ============================================================================

const GROOVE_DENSITY: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'sparsity'),
    term: 'sparsity',
    variants: ['sparse', 'minimal-rhythm', 'space'],
    category: 'rhythm',
    definition: 'Low density of rhythmic events',
    semantics: { type: 'quality', qualityDimension: 'density' },
    examples: [
      'increase sparsity',
      'make it sparse',
      'use minimal-rhythm',
    ],
  },
  {
    id: createLexemeId('noun', 'density'),
    term: 'density',
    variants: ['rhythmic-density', 'note-density', 'busyness'],
    category: 'rhythm',
    definition: 'Number of rhythmic events per unit time',
    semantics: { type: 'quality', qualityDimension: 'density' },
    examples: [
      'reduce density',
      'thin rhythmic-density',
      'decrease note-density',
    ],
  },
  {
    id: createLexemeId('noun', 'drive'),
    term: 'drive',
    variants: ['driving', 'propulsion', 'forward-motion'],
    category: 'feel',
    definition: 'Forward-moving rhythmic energy',
    semantics: { type: 'quality', qualityDimension: 'energy' },
    examples: [
      'add drive',
      'create driving rhythm',
      'increase propulsion',
    ],
  },
  {
    id: createLexemeId('noun', 'momentum'),
    term: 'momentum',
    variants: ['rhythmic-momentum', 'flow', 'propulsion'],
    category: 'feel',
    definition: 'Sense of continuous forward motion',
    semantics: { type: 'quality', qualityDimension: 'energy' },
    examples: [
      'build momentum',
      'create rhythmic-momentum',
      'improve flow',
    ],
  },
  {
    id: createLexemeId('noun', 'pulse'),
    term: 'pulse',
    variants: ['beat-pulse', 'heartbeat', 'steady-beat'],
    category: 'rhythm',
    definition: 'Regular underlying beat',
    semantics: { type: 'pattern', patternType: 'metrical' },
    examples: [
      'establish pulse',
      'maintain beat-pulse',
      'create steady-beat',
    ],
  },
];

// ============================================================================
// Meter and Time Signatures
// ============================================================================

const METER_CONCEPTS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'meter'),
    term: 'meter',
    variants: ['metre', 'time-signature', 'metric-organization'],
    category: 'meter',
    definition: 'Recurring pattern of strong and weak beats',
    semantics: { type: 'property', propertyOf: 'metrical' },
    examples: [
      'change meter',
      'use compound metre',
      'alter time-signature',
    ],
  },
  {
    id: createLexemeId('noun', 'duple'),
    term: 'duple',
    variants: ['duple-meter', 'two-beat', 'march-feel'],
    category: 'meter',
    definition: 'Two-beat meter grouping',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use duple meter',
      'create two-beat feel',
      'add march-feel',
    ],
  },
  {
    id: createLexemeId('noun', 'triple'),
    term: 'triple',
    variants: ['triple-meter', 'three-beat', 'waltz-feel'],
    category: 'meter',
    definition: 'Three-beat meter grouping',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use triple meter',
      'create three-beat feel',
      'add waltz-feel',
    ],
  },
  {
    id: createLexemeId('noun', 'quadruple'),
    term: 'quadruple',
    variants: ['quadruple-meter', 'four-beat', 'common-time'],
    category: 'meter',
    definition: 'Four-beat meter grouping',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use quadruple meter',
      'stay in four-beat',
      'maintain common-time',
    ],
  },
  {
    id: createLexemeId('noun', 'compound'),
    term: 'compound',
    variants: ['compound-meter', 'compound-time', 'triple-subdivision'],
    category: 'meter',
    definition: 'Meter with triple subdivision of beats',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use compound meter',
      'switch to compound-time',
      'add triple-subdivision',
    ],
  },
  {
    id: createLexemeId('noun', 'simple'),
    term: 'simple',
    variants: ['simple-meter', 'simple-time', 'duple-subdivision'],
    category: 'meter',
    definition: 'Meter with duple subdivision of beats',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use simple meter',
      'switch to simple-time',
      'use duple-subdivision',
    ],
  },
  {
    id: createLexemeId('noun', 'irregular'),
    term: 'irregular',
    variants: ['irregular-meter', 'odd-meter', 'asymmetric'],
    category: 'meter',
    definition: 'Meter with unusual groupings (5/4, 7/8, etc.)',
    semantics: { type: 'quality', qualityDimension: 'metrical' },
    examples: [
      'use irregular meter',
      'switch to odd-meter',
      'create asymmetric feel',
    ],
  },
];

// ============================================================================
// Combined Export
// ============================================================================

/**
 * All domain nouns in batch 7
 */
export const DOMAIN_NOUNS_BATCH7: readonly DomainNoun[] = [
  ...RHYTHMIC_UNITS,
  ...GROOVE_TYPES,
  ...RHYTHMIC_DEVICES,
  ...TIMING_CONCEPTS,
  ...GROOVE_DENSITY,
  ...METER_CONCEPTS,
];

/**
 * Total count for this batch
 */
export const BATCH7_COUNT = DOMAIN_NOUNS_BATCH7.length;

/**
 * Get domain noun by ID from this batch
 */
export function getRhythmNounById(id: string): DomainNoun | undefined {
  return DOMAIN_NOUNS_BATCH7.find(noun => noun.id === id);
}

/**
 * Get domain nouns by category from this batch
 */
export function getRhythmNounsByCategory(
  category: string
): readonly DomainNoun[] {
  return DOMAIN_NOUNS_BATCH7.filter(noun => noun.category === category);
}
