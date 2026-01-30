/**
 * GOFAI Vocabulary — Rhythmic Complexity Descriptors (Batch 66)
 *
 * Comprehensive vocabulary for describing rhythmic patterns, complexity,
 * groove characteristics, syncopation, polyrhythms, and temporal organization.
 *
 * This batch enables sophisticated rhythmic analysis and manipulation in natural language.
 *
 * @module gofai/canon/rhythmic-complexity-batch66
 */

import { type Lexeme, createLexemeId, createAxisId, createOpcodeId } from './types';

// =============================================================================
// Category 1: Syncopation and Off-Beat Patterns (8 entries)
// =============================================================================

const SYNCOPATION_PATTERNS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'syncopated'),
    lemma: 'syncopated',
    variants: ['syncopated', 'off-beat', 'displaced', 'rhythmically displaced'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_syncopation'),
      direction: 'increase',
    },
    description: 'Emphasis on weak beats or off-beat positions',
    examples: ['make it syncopated', 'add off-beat accents', 'displace rhythms'],
  },
  {
    id: createLexemeId('adj', 'on-beat'),
    lemma: 'on-beat',
    variants: ['on-beat', 'on the beat', 'straight', 'square'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_syncopation'),
      direction: 'decrease',
    },
    description: 'Emphasis on strong beats, no syncopation',
    examples: ['make it on-beat', 'play straight', 'keep it square'],
  },
  {
    id: createLexemeId('noun', 'anticipation'),
    lemma: 'anticipation',
    variants: ['anticipation', 'anticipated note', 'early arrival'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'syncopation_type',
      value: 'anticipation',
    },
    description: 'Note arrives before expected beat',
    examples: ['add anticipations', 'use anticipated notes', 'arrive early'],
  },
  {
    id: createLexemeId('noun', 'suspension'),
    lemma: 'suspension',
    variants: ['suspension', 'suspended note', 'held over', 'tied note'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'syncopation_type',
      value: 'suspension',
    },
    description: 'Note held over from previous beat',
    examples: ['add suspensions', 'hold notes over', 'tie across bar'],
  },
  {
    id: createLexemeId('noun', 'hemiola'),
    lemma: 'hemiola',
    variants: ['hemiola', 'three over two', 'metric shift'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'metric_displacement',
      value: 'hemiola',
    },
    description: 'Momentary shift to 3:2 ratio in rhythmic grouping',
    examples: ['create hemiola', 'use three over two', 'shift metric grouping'],
  },
  {
    id: createLexemeId('noun', 'backbeat'),
    lemma: 'backbeat',
    variants: ['backbeat', 'two and four', 'snare on two and four'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'accent_pattern',
      value: 'backbeat',
    },
    description: 'Emphasis on beats 2 and 4 in 4/4 time',
    examples: ['emphasize backbeat', 'hit two and four', 'strengthen snare backbeat'],
  },
  {
    id: createLexemeId('noun', 'clave'),
    lemma: 'clave',
    variants: ['clave', 'clave pattern', 'son clave', 'rumba clave'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'rhythmic_pattern',
      value: 'clave',
    },
    description: 'Fundamental rhythmic pattern in Afro-Cuban music',
    examples: ['use clave pattern', 'establish son clave', 'play rumba clave'],
  },
  {
    id: createLexemeId('noun', 'tresillo'),
    lemma: 'tresillo',
    variants: ['tresillo', 'habanera rhythm', '3-3-2 pattern'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'rhythmic_pattern',
      value: 'tresillo',
    },
    description: 'Basic 3-3-2 rhythmic cell common in Latin music',
    examples: ['use tresillo', 'apply habanera rhythm', 'establish 3-3-2 pattern'],
  },
];

// =============================================================================
// Category 2: Polyrhythms and Cross-Rhythms (8 entries)
// =============================================================================

const POLYRHYTHMS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'polyrhythm'),
    lemma: 'polyrhythm',
    variants: ['polyrhythm', 'multiple rhythms', 'layered rhythms'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'complexity',
      value: 'polyrhythm',
    },
    description: 'Multiple contrasting rhythmic patterns simultaneously',
    examples: ['create polyrhythm', 'layer multiple rhythms', 'combine rhythmic patterns'],
  },
  {
    id: createLexemeId('noun', 'cross-rhythm'),
    lemma: 'cross-rhythm',
    variants: ['cross-rhythm', 'conflicting rhythm', 'polymetric'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'complexity',
      value: 'cross_rhythm',
    },
    description: 'Rhythm that contradicts the prevailing meter',
    examples: ['add cross-rhythm', 'create conflicting pattern', 'use polymetric feel'],
  },
  {
    id: createLexemeId('noun', 'three-against-two'),
    lemma: 'three against two',
    variants: ['three against two', '3:2', 'triplet feel', 'vertical hemiola'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'polyrhythm_ratio',
      value: '3:2',
    },
    description: 'Triplets against duple subdivisions',
    examples: ['play three against two', 'use 3:2 ratio', 'create triplet feel'],
  },
  {
    id: createLexemeId('noun', 'four-against-three'),
    lemma: 'four against three',
    variants: ['four against three', '4:3', 'quarternote triplets'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'polyrhythm_ratio',
      value: '4:3',
    },
    description: 'Four pulses against three',
    examples: ['play four against three', 'use 4:3 ratio', 'layer quarternote triplets'],
  },
  {
    id: createLexemeId('noun', 'five-against-four'),
    lemma: 'five against four',
    variants: ['five against four', '5:4', 'quintuplets'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'polyrhythm_ratio',
      value: '5:4',
    },
    description: 'Five pulses against four',
    examples: ['play five against four', 'use 5:4 ratio', 'add quintuplets'],
  },
  {
    id: createLexemeId('noun', 'metric-modulation'),
    lemma: 'metric modulation',
    variants: ['metric modulation', 'tempo change via subdivision', 'Elliott Carter technique'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('modulate_metric'),
      role: 'main',
      actionType: 'temporal_transformation',
      technique: 'metric_modulation',
    },
    description: 'Change tempo by reinterpreting subdivision as beat',
    examples: ['apply metric modulation', 'change tempo via subdivision', 'use Carter technique'],
  },
  {
    id: createLexemeId('noun', 'polymeter'),
    lemma: 'polymeter',
    variants: ['polymeter', 'multiple meters', 'metric independence'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'complexity',
      value: 'polymeter',
    },
    description: 'Different meters in different voices simultaneously',
    examples: ['use polymeter', 'layer multiple meters', 'create metric independence'],
  },
  {
    id: createLexemeId('noun', 'phase-shift'),
    lemma: 'phase shift',
    variants: ['phase shift', 'phasing', 'gradual displacement', 'Steve Reich technique'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('apply_phase_shift'),
      role: 'main',
      actionType: 'temporal_transformation',
      technique: 'phasing',
    },
    description: 'Pattern gradually shifts out of phase with itself',
    examples: ['apply phase shift', 'use phasing', 'create gradual displacement'],
  },
];

// =============================================================================
// Category 3: Groove and Feel (8 entries)
// =============================================================================

const GROOVE_FEEL: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'swung'),
    lemma: 'swung',
    variants: ['swung', 'swing feel', 'triplet feel', 'shuffle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('swing_amount'),
      direction: 'increase',
    },
    description: 'Unequal subdivision with long-short pattern',
    examples: ['make it swung', 'add swing feel', 'create shuffle groove'],
  },
  {
    id: createLexemeId('adj', 'straight'),
    lemma: 'straight',
    variants: ['straight', 'even', 'no swing', 'metronomic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('swing_amount'),
      direction: 'decrease',
    },
    description: 'Equal subdivisions, no swing',
    examples: ['make it straight', 'remove swing', 'play even eighths'],
  },
  {
    id: createLexemeId('adj', 'laid-back'),
    lemma: 'laid-back',
    variants: ['laid-back', 'behind the beat', 'relaxed', 'dragging'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('groove_placement'),
      direction: 'decrease',
    },
    description: 'Slightly delayed feel, behind the beat',
    examples: ['make it laid-back', 'play behind the beat', 'relax the groove'],
  },
  {
    id: createLexemeId('adj', 'pushing'),
    lemma: 'pushing',
    variants: ['pushing', 'ahead of the beat', 'driving', 'urgent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('groove_placement'),
      direction: 'increase',
    },
    description: 'Slightly early feel, ahead of the beat',
    examples: ['make it pushing', 'play ahead of the beat', 'drive the groove forward'],
  },
  {
    id: createLexemeId('noun', 'pocket'),
    lemma: 'pocket',
    variants: ['pocket', 'in the pocket', 'locked in', 'tight groove'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'groove_quality',
      value: 'pocket',
    },
    description: 'Tight, consistent groove with strong internal cohesion',
    examples: ['find the pocket', 'lock into groove', 'get in the pocket'],
  },
  {
    id: createLexemeId('noun', 'ghost-note'),
    lemma: 'ghost note',
    variants: ['ghost note', 'grace note', 'quiet note', 'implied note'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'articulation',
      value: 'ghost_note',
    },
    description: 'Very soft note that adds rhythmic texture',
    examples: ['add ghost notes', 'include grace notes', 'use implied notes'],
  },
  {
    id: createLexemeId('adj', 'stiff'),
    lemma: 'stiff',
    variants: ['stiff', 'rigid', 'mechanical', 'robotic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('groove_looseness'),
      direction: 'decrease',
    },
    description: 'Overly precise, lacks human feel',
    examples: ['make it stiff', 'play mechanically', 'remove humanization'],
  },
  {
    id: createLexemeId('adj', 'loose'),
    lemma: 'loose',
    variants: ['loose', 'relaxed', 'human', 'organic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('groove_looseness'),
      direction: 'increase',
    },
    description: 'Relaxed timing with natural variation',
    examples: ['make it loose', 'relax the timing', 'add human feel'],
  },
];

// =============================================================================
// Category 4: Rhythmic Density and Complexity (8 entries)
// =============================================================================

const RHYTHMIC_DENSITY: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'sparse'),
    lemma: 'sparse',
    variants: ['sparse', 'sparse rhythm', 'spacious', 'open'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_density'),
      direction: 'decrease',
    },
    description: 'Few notes with lots of space between',
    examples: ['make it sparse', 'open up rhythms', 'create spacious feel'],
  },
  {
    id: createLexemeId('adj', 'dense'),
    lemma: 'dense',
    variants: ['dense', 'busy', 'active', 'filled'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_density'),
      direction: 'increase',
    },
    description: 'Many notes filling available space',
    examples: ['make it dense', 'fill with activity', 'increase busyness'],
  },
  {
    id: createLexemeId('adj', 'subdivided'),
    lemma: 'subdivided',
    variants: ['subdivided', 'broken up', 'fragmented', 'split'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_subdivision'),
      direction: 'increase',
    },
    description: 'Beat divided into smaller note values',
    examples: ['make it subdivided', 'break up the beat', 'add smaller divisions'],
  },
  {
    id: createLexemeId('noun', 'tuplet'),
    lemma: 'tuplet',
    variants: ['tuplet', 'triplet', 'quintuplet', 'sextuplet'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'subdivision_type',
      value: 'tuplet',
    },
    description: 'Irregular division of beat into n equal parts',
    examples: ['add tuplets', 'use triplets', 'include quintuplets'],
  },
  {
    id: createLexemeId('noun', 'riff'),
    lemma: 'riff',
    variants: ['riff', 'rhythmic figure', 'repeated pattern', 'groove pattern'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'pattern',
      value: 'riff',
    },
    description: 'Short repeated rhythmic or melodic pattern',
    examples: ['create a riff', 'establish rhythmic figure', 'repeat pattern'],
  },
  {
    id: createLexemeId('adj', 'intricate'),
    lemma: 'intricate',
    variants: ['intricate', 'complex', 'detailed', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_complexity'),
      direction: 'increase',
    },
    description: 'Complex, detailed rhythmic patterns',
    examples: ['make it intricate', 'add complexity', 'elaborate rhythms'],
  },
  {
    id: createLexemeId('adj', 'simple'),
    lemma: 'simple',
    variants: ['simple', 'straightforward', 'basic', 'uncomplicated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_complexity'),
      direction: 'decrease',
    },
    description: 'Uncomplicated, easy-to-follow rhythms',
    examples: ['make it simple', 'simplify rhythms', 'keep it basic'],
  },
  {
    id: createLexemeId('noun', 'irregular-meter'),
    lemma: 'irregular meter',
    variants: ['irregular meter', 'odd time', 'asymmetric meter', 'complex time'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'meter_type',
      value: 'irregular',
    },
    description: 'Meters with unusual beat groupings (5/4, 7/8, etc.)',
    examples: ['use irregular meter', 'switch to odd time', 'create asymmetric feel'],
  },
];

// =============================================================================
// Category 5: Temporal Organization (8 entries)
// =============================================================================

const TEMPORAL_ORGANIZATION: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'tempo'),
    lemma: 'tempo',
    variants: ['tempo', 'speed', 'pace', 'bpm'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal',
      value: 'tempo',
    },
    description: 'Speed of the beat',
    examples: ['adjust tempo', 'change speed', 'set bpm'],
  },
  {
    id: createLexemeId('noun', 'accelerando'),
    lemma: 'accelerando',
    variants: ['accelerando', 'speeding up', 'getting faster', 'accel'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('accelerando'),
      role: 'main',
      actionType: 'tempo_change',
      technique: 'gradual_increase',
    },
    description: 'Gradual increase in tempo',
    examples: ['add accelerando', 'speed up gradually', 'apply accel'],
  },
  {
    id: createLexemeId('noun', 'ritardando'),
    lemma: 'ritardando',
    variants: ['ritardando', 'slowing down', 'getting slower', 'ritard', 'rit'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('ritardando'),
      role: 'main',
      actionType: 'tempo_change',
      technique: 'gradual_decrease',
    },
    description: 'Gradual decrease in tempo',
    examples: ['add ritardando', 'slow down gradually', 'apply ritard'],
  },
  {
    id: createLexemeId('noun', 'rubato'),
    lemma: 'rubato',
    variants: ['rubato', 'tempo rubato', 'flexible time', 'expressive timing'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'timing_flexibility',
      value: 'rubato',
    },
    description: 'Expressive freedom in timing',
    examples: ['add rubato', 'play with flexible time', 'use expressive timing'],
  },
  {
    id: createLexemeId('noun', 'fermata'),
    lemma: 'fermata',
    variants: ['fermata', 'hold', 'pause', 'prolonged note'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'duration_marking',
      value: 'fermata',
    },
    description: 'Hold note or rest longer than written value',
    examples: ['add fermata', 'hold the note', 'insert pause'],
  },
  {
    id: createLexemeId('noun', 'downbeat'),
    lemma: 'downbeat',
    variants: ['downbeat', 'strong beat', 'one', 'first beat'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'metric_position',
      value: 'downbeat',
    },
    description: 'First beat of a measure, strongest metric position',
    examples: ['emphasize downbeat', 'hit the one', 'strengthen first beat'],
  },
  {
    id: createLexemeId('noun', 'upbeat'),
    lemma: 'upbeat',
    variants: ['upbeat', 'weak beat', 'pickup', 'anacrusis'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'metric_position',
      value: 'upbeat',
    },
    description: 'Unaccented beat before downbeat',
    examples: ['start on upbeat', 'add pickup', 'begin with anacrusis'],
  },
  {
    id: createLexemeId('noun', 'ostinato-rhythm'),
    lemma: 'ostinato',
    variants: ['ostinato', 'rhythmic ostinato', 'repeated pattern', 'loop'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'pattern_type',
      value: 'ostinato',
    },
    description: 'Persistently repeated rhythmic pattern',
    examples: ['establish ostinato', 'create repeated pattern', 'loop rhythm'],
  },
];

// =============================================================================
// Exports and Summary
// =============================================================================

/**
 * All rhythmic complexity descriptor lexemes (Batch 66).
 */
export const RHYTHMIC_COMPLEXITY_BATCH66: readonly Lexeme[] = [
  ...SYNCOPATION_PATTERNS,
  ...POLYRHYTHMS,
  ...GROOVE_FEEL,
  ...RHYTHMIC_DENSITY,
  ...TEMPORAL_ORGANIZATION,
];

/**
 * Count of entries in Batch 66.
 */
export const BATCH_66_COUNT = RHYTHMIC_COMPLEXITY_BATCH66.length;

/**
 * Category summary for Batch 66.
 * 
 * Axes introduced:
 * - rhythmic_syncopation (syncopated vs on-beat)
 * - swing_amount (swung vs straight)
 * - groove_placement (laid-back vs pushing)
 * - groove_looseness (stiff vs loose)
 * - rhythmic_density (sparse vs dense)
 * - rhythmic_subdivision (subdivided complexity)
 * - rhythmic_complexity (intricate vs simple)
 * 
 * Categories covered:
 * 1. Syncopation and Off-Beat Patterns (8 entries)
 * 2. Polyrhythms and Cross-Rhythms (8 entries)
 * 3. Groove and Feel (8 entries)
 * 4. Rhythmic Density and Complexity (8 entries)
 * 5. Temporal Organization (8 entries)
 * 
 * Total: 40 lexemes covering comprehensive rhythmic vocabulary
 */
