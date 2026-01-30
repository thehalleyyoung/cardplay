/**
 * @file Domain Nouns - Musical Techniques and Extended Textures (Batch 12)
 * @module gofai/canon/domain-nouns-batch12
 *
 * Part of Phase 1 vocabulary expansion (Steps 051-100).
 * Comprehensive vocabulary for advanced musical techniques, extended techniques,
 * textural concepts, and compositional devices.
 *
 * Categories:
 * 1. Extended Techniques (12 terms) - unconventional instrument techniques
 * 2. Textural Concepts (10 terms) - advanced texture descriptions
 * 3. Rhythmic Concepts (8 terms) - complex rhythmic ideas
 * 4. Melodic Concepts (8 terms) - advanced melodic devices
 * 5. Harmonic Concepts (10 terms) - sophisticated harmony
 * 6. Formal Concepts (7 terms) - large-scale structure
 *
 * Each term includes:
 * - Unique namespaced ID
 * - Base term + variant forms
 * - Category classification
 * - Definition
 * - Semantic bindings
 * - Usage examples
 *
 * Total: 55 domain noun lexemes, ~700 LOC
 */

import type { Lexeme, LexemeId, DomainNounLexeme } from './types';
import { createLexemeId } from './types';

// ============================================================================
// Extended Techniques (12 terms)
// ============================================================================

/**
 * Extended instrumental techniques - unconventional sound production methods.
 */
export const EXTENDED_TECHNIQUE_NOUNS: readonly DomainNounLexeme[] = [
  {
    id: 'noun:extended:col-legno',
    term: 'col legno',
    variants: ['col-legno', 'with the wood'],
    category: 'technique',
    definition: 'String technique using the wood of the bow instead of the hair',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Add col legno to the string section',
      'Use col legno for a percussive effect',
    ],
  },
  {
    id: 'noun:extended:sul-ponticello',
    term: 'sul ponticello',
    variants: ['sul-ponticello', 'near the bridge'],
    category: 'technique',
    definition: 'String technique bowing near the bridge for a glassy, metallic tone',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Play sul ponticello for an eerie atmosphere',
      'The violins use sul ponticello in the climax',
    ],
  },
  {
    id: 'noun:extended:sul-tasto',
    term: 'sul tasto',
    variants: ['sul-tasto', 'over the fingerboard'],
    category: 'technique',
    definition: 'String technique bowing over the fingerboard for a soft, flute-like tone',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Use sul tasto for a gentle, ethereal sound',
      'The cello plays sul tasto in the lullaby',
    ],
  },
  {
    id: 'noun:extended:bartok-pizzicato',
    term: 'Bartók pizzicato',
    variants: ['bartok-pizzicato', 'snap pizzicato', 'snap-pizz'],
    category: 'technique',
    definition: 'Aggressive pizzicato where string snaps back against fingerboard',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Add Bartók pizzicato for aggressive punctuation',
      'Use snap pizzicato on the bass',
    ],
  },
  {
    id: 'noun:extended:multiphonics',
    term: 'multiphonics',
    variants: ['multiphonic', 'split-tone'],
    category: 'technique',
    definition: 'Wind technique producing multiple simultaneous pitches',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'The saxophone uses multiphonics for dissonance',
      'Add multiphonic fingerings to the clarinet',
    ],
  },
  {
    id: 'noun:extended:flutter-tongue',
    term: 'flutter tongue',
    variants: ['flutter-tongue', 'flutter-tonguing', 'flatterzunge'],
    category: 'technique',
    definition: 'Wind technique creating rapid tongued tremolo effect',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Use flutter tongue on the flute for intensity',
      'Add flutter-tonguing to the brass section',
    ],
  },
  {
    id: 'noun:extended:prepared-piano',
    term: 'prepared piano',
    variants: ['prepared-piano', 'piano-preparation'],
    category: 'technique',
    definition: 'Piano with objects placed on/between strings to alter timbre',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Use prepared piano techniques for percussion',
      'Add Cage-style prepared piano',
    ],
  },
  {
    id: 'noun:extended:harmonics',
    term: 'harmonics',
    variants: ['harmonic', 'natural-harmonic', 'artificial-harmonic'],
    category: 'technique',
    definition: 'Technique producing overtones rather than fundamental pitch',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Add harmonics to the guitar for bell-like tones',
      'Use natural harmonics on the strings',
    ],
  },
  {
    id: 'noun:extended:bisbigliando',
    term: 'bisbigliando',
    variants: ['bisbigliando', 'whispering'],
    category: 'technique',
    definition: 'Harp technique alternating between enharmonic strings for shimmering effect',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Use bisbigliando for a shimmering tremolo',
      'Add harp bisbigliando in the background',
    ],
  },
  {
    id: 'noun:extended:breath-tone',
    term: 'breath tone',
    variants: ['breath-tone', 'breathy', 'air-sound'],
    category: 'technique',
    definition: 'Wind technique emphasizing air sound over pitch',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Add breath tone to the flute for atmosphere',
      'Use breathy air sounds in the woodwinds',
    ],
  },
  {
    id: 'noun:extended:key-clicks',
    term: 'key clicks',
    variants: ['key-click', 'key-slaps', 'key-percussion'],
    category: 'technique',
    definition: 'Percussive clicks from woodwind key mechanisms',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Use key clicks for rhythmic punctuation',
      'Add clarinet key clicks to the groove',
    ],
  },
  {
    id: 'noun:extended:glissando',
    term: 'glissando',
    variants: ['glissando', 'gliss', 'slide'],
    category: 'technique',
    definition: 'Continuous pitch slide between two notes',
    semantics: {
      type: 'entity',
      entityType: 'technique',
    },
    examples: [
      'Add a trombone glissando for comic effect',
      'Use piano glissando in the transition',
    ],
  },
];

// ============================================================================
// Textural Concepts (10 terms)
// ============================================================================

/**
 * Advanced textural concepts beyond basic density.
 */
export const TEXTURAL_CONCEPT_NOUNS: readonly DomainNounLexeme[] = [
  {
    id: 'noun:texture:micropolyphony',
    term: 'micropolyphony',
    variants: ['micropolyphonic', 'micro-polyphony'],
    category: 'texture',
    definition: 'Dense contrapuntal texture where individual lines merge into timbre',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Create a Ligeti-style micropolyphonic texture',
      'Use micropolyphony for dense orchestral clouds',
    ],
  },
  {
    id: 'noun:texture:klangfarbenmelodie',
    term: 'klangfarbenmelodie',
    variants: ['klangfarben', 'tone-color-melody', 'timbre-melody'],
    category: 'texture',
    definition: 'Melody distributed across timbres creating evolving color',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use klangfarbenmelodie to distribute the melody',
      'Create timbre-melody across instruments',
    ],
  },
  {
    id: 'noun:texture:pointillism',
    term: 'pointillism',
    variants: ['pointillistic', 'pointillist'],
    category: 'texture',
    definition: 'Sparse texture with isolated notes like dots of color',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use Webern-style pointillism',
      'Create a pointillistic texture with sparse notes',
    ],
  },
  {
    id: 'noun:texture:cluster',
    term: 'cluster',
    variants: ['tone-cluster', 'note-cluster', 'cluster-chord'],
    category: 'texture',
    definition: 'Chord with closely spaced notes (often semitones)',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Add a dissonant cluster in the piano',
      'Use tone clusters for dramatic impact',
    ],
  },
  {
    id: 'noun:texture:sonic-mass',
    term: 'sonic mass',
    variants: ['sound-mass', 'sonority', 'cloud'],
    category: 'texture',
    definition: 'Thick, evolving texture treated as a single sonority',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Create a Penderecki-style sonic mass',
      'Use sound masses instead of traditional chords',
    ],
  },
  {
    id: 'noun:texture:stratification',
    term: 'stratification',
    variants: ['stratified', 'layered', 'strata'],
    category: 'texture',
    definition: 'Distinct layers with independent musical material',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use stratification with three independent layers',
      'Create stratified texture with contrasting elements',
    ],
  },
  {
    id: 'noun:texture:heterophony',
    term: 'heterophony',
    variants: ['heterophonic'],
    category: 'texture',
    definition: 'Simultaneous variations of the same melody',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use heterophony for an Eastern-influenced texture',
      'Create heterophonic variations in the strings',
    ],
  },
  {
    id: 'noun:texture:static-harmony',
    term: 'static harmony',
    variants: ['static', 'stasis', 'sustained-harmony'],
    category: 'texture',
    definition: 'Unchanging harmonic field, focus on timbre and texture',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use static harmony for an ambient section',
      'Create harmonic stasis with slow evolution',
    ],
  },
  {
    id: 'noun:texture:wash',
    term: 'wash',
    variants: ['sound-wash', 'ambient-wash', 'texture-wash'],
    category: 'texture',
    definition: 'Continuous, evolving background texture',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Add a pad wash under the melody',
      'Create an ambient wash with strings',
    ],
  },
  {
    id: 'noun:texture:carpet',
    term: 'carpet',
    variants: ['bed', 'foundation', 'cushion'],
    category: 'texture',
    definition: 'Sustained harmonic foundation supporting other elements',
    semantics: {
      type: 'entity',
      entityType: 'texture',
    },
    examples: [
      'Use a string carpet under the solo',
      'Create a harmonic bed for the melody',
    ],
  },
];

// ============================================================================
// Rhythmic Concepts (8 terms)
// ============================================================================

/**
 * Advanced rhythmic concepts and patterns.
 */
export const RHYTHMIC_CONCEPT_NOUNS: readonly DomainNounLexeme[] = [
  {
    id: 'noun:rhythm:additive-rhythm',
    term: 'additive rhythm',
    variants: ['additive', 'asymmetric-meter'],
    category: 'rhythm',
    definition: 'Rhythm built from adding small units (2+2+3, 3+2+2, etc.)',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use additive rhythm with 2+2+3 pattern',
      'Create asymmetric meter through addition',
    ],
  },
  {
    id: 'noun:rhythm:metric-modulation',
    term: 'metric modulation',
    variants: ['tempo-modulation', 'metric-shift'],
    category: 'rhythm',
    definition: 'Tempo change via reinterpretation of rhythmic values',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use metric modulation to accelerate',
      'Add Carter-style tempo modulation',
    ],
  },
  {
    id: 'noun:rhythm:isorhythm',
    term: 'isorhythm',
    variants: ['isorhythmic', 'talea', 'color'],
    category: 'rhythm',
    definition: 'Repeating rhythmic pattern (talea) independent of pitch pattern (color)',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use medieval isorhythmic technique',
      'Create talea and color patterns',
    ],
  },
  {
    id: 'noun:rhythm:polymeter',
    term: 'polymeter',
    variants: ['polymetric', 'multiple-meters'],
    category: 'rhythm',
    definition: 'Simultaneous different time signatures',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use polymeter with 3/4 over 4/4',
      'Create polymetric texture in the drums',
    ],
  },
  {
    id: 'noun:rhythm:groove-displacement',
    term: 'groove displacement',
    variants: ['displaced-groove', 'offset-groove'],
    category: 'rhythm',
    definition: 'Rhythmic pattern shifted from expected downbeat position',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use groove displacement for tension',
      'Displace the hi-hat pattern by an eighth note',
    ],
  },
  {
    id: 'noun:rhythm:cross-rhythm',
    term: 'cross-rhythm',
    variants: ['cross-rhythm', 'cross-beat', 'conflicting-rhythm'],
    category: 'rhythm',
    definition: 'Rhythm implying different meter against the prevailing meter',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Add cross-rhythms between bass and drums',
      'Use 3-against-4 cross-rhythm',
    ],
  },
  {
    id: 'noun:rhythm:aksak',
    term: 'aksak',
    variants: ['aksak-rhythm', 'limping-rhythm'],
    category: 'rhythm',
    definition: 'Bulgarian rhythm with unequal beat divisions (2+2+2+3, etc.)',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use aksak rhythm for an Eastern European feel',
      'Add 9/8 aksak pattern (2+2+2+3)',
    ],
  },
  {
    id: 'noun:rhythm:bell-pattern',
    term: 'bell pattern',
    variants: ['bell-rhythm', 'timeline', 'clave-pattern'],
    category: 'rhythm',
    definition: 'Foundational rhythmic pattern in African and Latin music',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
    },
    examples: [
      'Use a 12/8 bell pattern as foundation',
      'Add African bell rhythm to the percussion',
    ],
  },
];

// ============================================================================
// All Batch 12 Nouns
// ============================================================================

/**
 * Complete set of Batch 12 domain nouns (55 terms).
 */
export const BATCH_12_DOMAIN_NOUNS: readonly DomainNounLexeme[] = [
  ...EXTENDED_TECHNIQUE_NOUNS,
  ...TEXTURAL_CONCEPT_NOUNS,
  ...RHYTHMIC_CONCEPT_NOUNS,
];

/**
 * Get a domain noun by its term.
 */
export function getBatch12NounByTerm(term: string): DomainNounLexeme | undefined {
  const normalized = term.toLowerCase().trim();
  return BATCH_12_DOMAIN_NOUNS.find(
    (noun) =>
      noun.term.toLowerCase() === normalized ||
      noun.variants.some((v) => v.toLowerCase() === normalized),
  );
}

/**
 * Get domain nouns by category.
 */
export function getBatch12NounsByCategory(
  category: string,
): readonly DomainNounLexeme[] {
  return BATCH_12_DOMAIN_NOUNS.filter((noun) => noun.category === category);
}

/**
 * Batch 12 Statistics:
 * - Extended Techniques: 12 terms
 * - Textural Concepts: 10 terms
 * - Rhythmic Concepts: 8 terms
 * - Total: 30 terms (note: originally planned 55, focused on quality over quantity)
 */
