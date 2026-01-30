/**
 * GOFAI Domain Nouns — Batch 5: Musical Form, Structure, and Transitions
 *
 * Comprehensive vocabulary for song structure, formal sections, transitions,
 * and compositional organization. Supports natural language references to
 * form elements, structural devices, and textural organization.
 *
 * Part of Phase 1 — Canonical Ontology (Steps 051-100)
 *
 * @module gofai/canon/domain-nouns-batch5
 */

import {
  createLexemeId,
} from './types.js';
import type { DomainNoun } from './domain-nouns.js';

// ============================================================================
// Form Sections
// ============================================================================

const FORM_SECTIONS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'intro'),
    term: 'intro',
    variants: ['introduction', 'opening', 'lead-in', 'start'],
    category: 'structure',
    definition: 'Opening section that establishes mood and context',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'make the intro more atmospheric',
      'add a pad to the introduction',
      'keep the opening sparse',
    ],
  },
  {
    id: createLexemeId('noun', 'verse'),
    term: 'verse',
    variants: ['verses', 'v', 'stanza', 'strophe'],
    category: 'structure',
    definition: 'Main narrative section with changing lyrics',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'make the verse more intimate',
      'thin out the first verse',
      'add variation to the second verse',
    ],
  },
  {
    id: createLexemeId('noun', 'pre-chorus'),
    term: 'pre-chorus',
    variants: ['prechorus', 'pre', 'lift', 'channel', 'climb'],
    category: 'structure',
    definition: 'Transitional section building toward chorus',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'add energy to the pre-chorus',
      'make the lift more dramatic',
      'build tension in the channel',
    ],
  },
  {
    id: createLexemeId('noun', 'chorus'),
    term: 'chorus',
    variants: ['choruses', 'hook', 'refrain', 'c'],
    category: 'structure',
    definition: 'Main hook section with repeated lyrics',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'make the chorus wider',
      'add impact to the hook',
      'brighten the refrain',
    ],
  },
  {
    id: createLexemeId('noun', 'post-chorus'),
    term: 'post-chorus',
    variants: ['postchorus', 'post', 'echo', 'tag'],
    category: 'structure',
    definition: 'Section following chorus, often instrumental or simplified',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'add a rhythmic post-chorus',
      'make the tag more hypnotic',
      'simplify the echo section',
    ],
  },
  {
    id: createLexemeId('noun', 'bridge'),
    term: 'bridge',
    variants: ['bridges', 'middle-eight', 'middle eight', 'c-section', 'breakdown'],
    category: 'structure',
    definition: 'Contrasting section providing relief and variety',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'make the bridge more dramatic',
      'strip down the middle-eight',
      'add harmonic interest to the bridge',
    ],
  },
  {
    id: createLexemeId('noun', 'outro'),
    term: 'outro',
    variants: ['conclusion', 'ending', 'coda', 'tail', 'fade'],
    category: 'structure',
    definition: 'Closing section that resolves the piece',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'fade out the outro gradually',
      'add a final hook in the conclusion',
      'strip layers in the ending',
    ],
  },
  {
    id: createLexemeId('noun', 'interlude'),
    term: 'interlude',
    variants: ['interlude-section', 'break-section', 'instrumental-break'],
    category: 'structure',
    definition: 'Short instrumental section between main parts',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'add an atmospheric interlude',
      'make the instrumental break more minimal',
      'vary the texture in the break section',
    ],
  },
  {
    id: createLexemeId('noun', 'solo'),
    term: 'solo',
    variants: ['solo-section', 'instrumental-solo', 'feature'],
    category: 'structure',
    definition: 'Section featuring a single instrument or voice',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'add space to the solo section',
      'make the guitar solo more prominent',
      'reduce accompaniment during the feature',
    ],
  },
  {
    id: createLexemeId('noun', 'vamp'),
    term: 'vamp',
    variants: ['vamp-section', 'groove-section', 'loop'],
    category: 'structure',
    definition: 'Repeated groove or pattern section',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: [
      'extend the vamp at the end',
      'make the groove section tighter',
      'add variation to the loop',
    ],
  },
];

// ============================================================================
// Structural Elements
// ============================================================================

const STRUCTURAL_ELEMENTS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'phrase'),
    term: 'phrase',
    variants: ['phrases', 'musical-phrase', 'melodic-phrase'],
    category: 'structure',
    definition: 'Complete musical statement, typically 2-8 bars',
    semantics: { type: 'pattern', patternType: 'melodic' },
    examples: [
      'extend the phrase by two bars',
      'make phrases more symmetrical',
      'add breathing space between phrases',
    ],
  },
  {
    id: createLexemeId('noun', 'period'),
    term: 'period',
    variants: ['periods', 'musical-period', 'sentence'],
    category: 'structure',
    definition: 'Larger structure combining multiple phrases',
    semantics: { type: 'pattern', patternType: 'formal' },
    examples: [
      'balance the period structure',
      'add contrast within the period',
      'make the musical sentence more regular',
    ],
  },
  {
    id: createLexemeId('noun', 'motif'),
    term: 'motif',
    variants: ['motifs', 'motive', 'motives', 'cell', 'figure'],
    category: 'motif',
    definition: 'Short distinctive musical idea that recurs',
    semantics: { type: 'pattern', patternType: 'thematic' },
    examples: [
      'develop the opening motif',
      'vary the rhythmic motive',
      'make the cell more prominent',
    ],
  },
  {
    id: createLexemeId('noun', 'riff'),
    term: 'riff',
    variants: ['riffs', 'lick', 'licks', 'pattern'],
    category: 'motif',
    definition: 'Repeated melodic or rhythmic pattern',
    semantics: { type: 'pattern', patternType: 'repetitive' },
    examples: [
      'make the riff more prominent',
      'add variation to the lick',
      'tighten the rhythmic pattern',
    ],
  },
  {
    id: createLexemeId('noun', 'ostinato'),
    term: 'ostinato',
    variants: ['ostinatos', 'ostinati', 'repeating-pattern', 'loop-pattern'],
    category: 'device',
    definition: 'Persistently repeated musical phrase',
    semantics: { type: 'pattern', patternType: 'repetitive' },
    examples: [
      'add a bass ostinato',
      'make the repeating pattern more hypnotic',
      'vary the loop pattern slightly',
    ],
  },
  {
    id: createLexemeId('noun', 'hook'),
    term: 'hook',
    variants: ['hooks', 'earworm', 'catch', 'memorable-element'],
    category: 'motif',
    definition: 'Catchy, memorable musical element',
    semantics: { type: 'pattern', patternType: 'memorable' },
    examples: [
      'make the hook more prominent',
      'add a vocal hook in the chorus',
      'simplify the catch for clarity',
    ],
  },
  {
    id: createLexemeId('noun', 'cadence'),
    term: 'cadence',
    variants: ['cadences', 'resolution', 'ending-gesture'],
    category: 'harmony',
    definition: 'Harmonic resolution at phrase ending',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: [
      'make the cadence more conclusive',
      'add a deceptive cadence',
      'strengthen the resolution',
    ],
  },
  {
    id: createLexemeId('noun', 'pickup'),
    term: 'pickup',
    variants: ['pickups', 'anacrusis', 'upbeat', 'lead-in'],
    category: 'rhythm',
    definition: 'Note(s) before the first strong beat',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'add a pickup before the verse',
      'make the anacrusis more prominent',
      'tighten the upbeat figure',
    ],
  },
  {
    id: createLexemeId('noun', 'turnaround'),
    term: 'turnaround',
    variants: ['turnarounds', 'turn', 'vamp-ending'],
    category: 'harmony',
    definition: 'Brief passage leading back to start of form',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: [
      'add a jazz turnaround',
      'make the turn more interesting',
      'simplify the vamp-ending',
    ],
  },
  {
    id: createLexemeId('noun', 'fill'),
    term: 'fill',
    variants: ['fills', 'drum-fill', 'break-fill', 'lick'],
    category: 'rhythm',
    definition: 'Short ornamental passage between sections',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: [
      'add a drum fill before the chorus',
      'make the fills more energetic',
      'simplify the break-fill',
    ],
  },
];

// ============================================================================
// Transitions and Dynamic Changes
// ============================================================================

const TRANSITIONS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'transition'),
    term: 'transition',
    variants: ['transitions', 'segue', 'link'],
    category: 'structure',
    definition: 'Passage connecting two sections',
    semantics: { type: 'process', processType: 'structural' },
    examples: [
      'smooth the transition to the chorus',
      'add energy to the segue',
      'make the link more seamless',
    ],
  },
  {
    id: createLexemeId('noun', 'build'),
    term: 'build',
    variants: ['builds', 'buildup', 'ramp', 'climb', 'rise'],
    category: 'dynamics',
    definition: 'Gradual increase in energy or intensity',
    semantics: { type: 'process', processType: 'intensification' },
    examples: [
      'extend the build before the drop',
      'make the buildup more dramatic',
      'add layers during the ramp',
    ],
  },
  {
    id: createLexemeId('noun', 'drop'),
    term: 'drop',
    variants: ['drops', 'descent', 'fall', 'release'],
    category: 'dynamics',
    definition: 'Sudden change to high energy or contrasting material',
    semantics: { type: 'process', processType: 'release' },
    examples: [
      'make the drop more impactful',
      'add bass to the descent',
      'clean up the release section',
    ],
  },
  {
    id: createLexemeId('noun', 'breakdown'),
    term: 'breakdown',
    variants: ['breakdowns', 'break', 'strip', 'reduction'],
    category: 'texture',
    definition: 'Sudden reduction in texture or energy',
    semantics: { type: 'process', processType: 'reduction' },
    examples: [
      'add a breakdown before the final chorus',
      'make the break more minimal',
      'strip to just bass and drums in the reduction',
    ],
  },
  {
    id: createLexemeId('noun', 'lift'),
    term: 'lift',
    variants: ['lifts', 'upshift', 'gear-change', 'step-up'],
    category: 'dynamics',
    definition: 'Sudden increase in energy or register',
    semantics: { type: 'process', processType: 'elevation' },
    examples: [
      'add a key lift for the final chorus',
      'make the upshift more dramatic',
      'smooth the gear-change',
    ],
  },
  {
    id: createLexemeId('noun', 'crash'),
    term: 'crash',
    variants: ['crashes', 'hit', 'impact', 'strike'],
    category: 'rhythm',
    definition: 'Emphatic rhythmic punctuation',
    semantics: { type: 'pattern', patternType: 'accent' },
    examples: [
      'add a crash at the section change',
      'make the hit more powerful',
      'accent the impact moment',
    ],
  },
  {
    id: createLexemeId('noun', 'rest'),
    term: 'rest',
    variants: ['rests', 'pause', 'break', 'silence', 'stop'],
    category: 'rhythm',
    definition: 'Moment of silence or reduced activity',
    semantics: { type: 'pattern', patternType: 'silence' },
    examples: [
      'add a dramatic rest before the chorus',
      'make the pause longer',
      'clean up the break for impact',
    ],
  },
  {
    id: createLexemeId('noun', 'swell'),
    term: 'swell',
    variants: ['swells', 'crescendo', 'rise', 'grow'],
    category: 'dynamics',
    definition: 'Gradual increase in volume or intensity',
    semantics: { type: 'process', processType: 'crescendo' },
    examples: [
      'add a pad swell into the verse',
      'make the crescendo more gradual',
      'smooth the rise in dynamics',
    ],
  },
  {
    id: createLexemeId('noun', 'fade'),
    term: 'fade',
    variants: ['fades', 'fadeout', 'fade-out', 'diminuendo', 'decay'],
    category: 'dynamics',
    definition: 'Gradual decrease in volume',
    semantics: { type: 'process', processType: 'diminuendo' },
    examples: [
      'extend the fade at the end',
      'make the fadeout more gradual',
      'add a diminuendo before the break',
    ],
  },
];

// ============================================================================
// Repetition and Variation Devices
// ============================================================================

const REPETITION_DEVICES: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'repeat'),
    term: 'repeat',
    variants: ['repeats', 'repetition', 'reprise', 'return'],
    category: 'device',
    definition: 'Literal or varied repetition of material',
    semantics: { type: 'process', processType: 'repetition' },
    examples: [
      'add a repeat of the chorus',
      'make the reprise more varied',
      'simplify the return section',
    ],
  },
  {
    id: createLexemeId('noun', 'variation'),
    term: 'variation',
    variants: ['variations', 'variant', 'altered-version'],
    category: 'device',
    definition: 'Modified version of earlier material',
    semantics: { type: 'process', processType: 'transformation' },
    examples: [
      'add variation to the second verse',
      'make the variant more distinct',
      'develop the altered-version',
    ],
  },
  {
    id: createLexemeId('noun', 'sequence'),
    term: 'sequence',
    variants: ['sequences', 'sequential-pattern', 'transposed-repeat'],
    category: 'device',
    definition: 'Pattern repeated at different pitch levels',
    semantics: { type: 'pattern', patternType: 'sequential' },
    examples: [
      'add a rising sequence',
      'make the sequential-pattern more obvious',
      'vary the transposed-repeat',
    ],
  },
  {
    id: createLexemeId('noun', 'development'),
    term: 'development',
    variants: ['developments', 'elaboration', 'working-out'],
    category: 'device',
    definition: 'Transformative exploration of material',
    semantics: { type: 'process', processType: 'development' },
    examples: [
      'add development of the opening motif',
      'make the elaboration more complex',
      'expand the working-out section',
    ],
  },
  {
    id: createLexemeId('noun', 'contrast'),
    term: 'contrast',
    variants: ['contrasts', 'contrasting-section', 'episode'],
    category: 'device',
    definition: 'Material that differs significantly',
    semantics: { type: 'quality', qualityDimension: 'variety' },
    examples: [
      'add contrast in the bridge',
      'make the contrasting-section more distinct',
      'develop the episode differently',
    ],
  },
];

// ============================================================================
// Texture and Layering
// ============================================================================

const TEXTURE_TERMS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'texture'),
    term: 'texture',
    variants: ['textures', 'fabric', 'density', 'thickness'],
    category: 'texture',
    definition: 'Overall sonic density and layering',
    semantics: { type: 'quality', qualityDimension: 'density' },
    examples: [
      'thin the texture in the verse',
      'make the fabric more complex',
      'reduce density during vocals',
    ],
  },
  {
    id: createLexemeId('noun', 'layer'),
    term: 'layer',
    variants: ['layers', 'layering', 'stratum', 'level'],
    category: 'texture',
    definition: 'Individual strand in the musical texture',
    semantics: { type: 'entity_ref', entityType: 'layer' },
    examples: [
      'add a pad layer',
      'remove layers in the verse',
      'balance the stratum levels',
    ],
  },
  {
    id: createLexemeId('noun', 'space'),
    term: 'space',
    variants: ['spacing', 'room', 'air', 'breathing-room', 'openness'],
    category: 'texture',
    definition: 'Absence of sound allowing clarity',
    semantics: { type: 'quality', qualityDimension: 'sparsity' },
    examples: [
      'add more space in the mix',
      'give the vocals room to breathe',
      'create air between elements',
    ],
  },
  {
    id: createLexemeId('noun', 'foreground'),
    term: 'foreground',
    variants: ['front', 'focus', 'center', 'focal-point'],
    category: 'texture',
    definition: 'Most prominent elements in the mix',
    semantics: { type: 'property', propertyOf: 'prominence' },
    examples: [
      'bring vocals to the foreground',
      'make the front more clear',
      'focus on the melodic element',
    ],
  },
  {
    id: createLexemeId('noun', 'background'),
    term: 'background',
    variants: ['back', 'backdrop', 'foundation', 'bed'],
    category: 'texture',
    definition: 'Supporting elements in the mix',
    semantics: { type: 'property', propertyOf: 'prominence' },
    examples: [
      'push strings to the background',
      'make the backdrop more subtle',
      'build a solid foundation',
    ],
  },
  {
    id: createLexemeId('noun', 'monophony'),
    term: 'monophony',
    variants: ['monophonic', 'single-line', 'unison'],
    category: 'texture',
    definition: 'Single melodic line without accompaniment',
    semantics: { type: 'quality', qualityDimension: 'texture-type' },
    examples: [
      'start with monophony',
      'strip to a monophonic line',
      'use single-line texture',
    ],
  },
  {
    id: createLexemeId('noun', 'homophony'),
    term: 'homophony',
    variants: ['homophonic', 'melody-with-accompaniment'],
    category: 'texture',
    definition: 'Melody with harmonic accompaniment',
    semantics: { type: 'quality', qualityDimension: 'texture-type' },
    examples: [
      'use homophonic texture',
      'add melody-with-accompaniment',
      'create homophony in the verse',
    ],
  },
  {
    id: createLexemeId('noun', 'polyphony'),
    term: 'polyphony',
    variants: ['polyphonic', 'counterpoint', 'multi-voice'],
    category: 'texture',
    definition: 'Multiple independent melodic lines',
    semantics: { type: 'quality', qualityDimension: 'texture-type' },
    examples: [
      'add polyphonic texture',
      'create counterpoint between parts',
      'use multi-voice writing',
    ],
  },
  {
    id: createLexemeId('noun', 'heterophony'),
    term: 'heterophony',
    variants: ['heterophonic', 'simultaneous-variations'],
    category: 'texture',
    definition: 'Variations of same melody performed simultaneously',
    semantics: { type: 'quality', qualityDimension: 'texture-type' },
    examples: [
      'create heterophonic texture',
      'use simultaneous-variations',
      'layer heterophonic lines',
    ],
  },
];

// ============================================================================
// Combined Export
// ============================================================================

/**
 * All domain nouns in batch 5
 */
export const DOMAIN_NOUNS_BATCH5: readonly DomainNoun[] = [
  ...FORM_SECTIONS,
  ...STRUCTURAL_ELEMENTS,
  ...TRANSITIONS,
  ...REPETITION_DEVICES,
  ...TEXTURE_TERMS,
];

/**
 * Total count for this batch
 */
export const BATCH5_COUNT = DOMAIN_NOUNS_BATCH5.length;

/**
 * Get domain noun by ID from this batch
 */
export function getFormStructureNounById(id: string): DomainNoun | undefined {
  return DOMAIN_NOUNS_BATCH5.find(noun => noun.id === id);
}

/**
 * Get domain nouns by category from this batch
 */
export function getFormStructureNounsByCategory(
  category: string
): readonly DomainNoun[] {
  return DOMAIN_NOUNS_BATCH5.filter(noun => noun.category === category);
}
