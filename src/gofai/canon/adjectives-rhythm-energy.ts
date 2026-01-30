/**
 * GOFAI Canon — Comprehensive Adjectives Lexicon (Batch 2: Rhythm & Energy)
 *
 * This batch covers adjectives describing rhythmic feel, groove quality,
 * energy levels, and dynamic characteristics.
 *
 * Part of the 20,000+ LOC vocabulary enumeration from gofai_goalB.md.
 * Target: ~600 lines for this batch.
 *
 * @module gofai/canon/adjectives-rhythm-energy
 */

import type { LexemeId, AxisId } from './types';
import type { AdjectiveLexeme } from './adjectives-production-timbre';

// =============================================================================
// Energy / Activity Level Adjectives
// =============================================================================

/**
 * Adjectives describing overall energy and activity level.
 */
export const ENERGY_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:energetic' as LexemeId,
    lemma: 'energetic',
    forms: ['energetic', 'more energetic', 'most energetic'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['active', 'lively', 'vibrant', 'dynamic'],
    antonyms: ['calm', 'sedate', 'low-energy'],
    examples: ['make it more energetic', 'too calm, increase energy'],
    domains: ['energy', 'mood', 'dynamics'],
  },
  {
    id: 'lex:adj:lively' as LexemeId,
    lemma: 'lively',
    forms: ['lively', 'livelier', 'liveliest'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['energetic', 'vibrant', 'animated'],
    antonyms: ['lifeless', 'flat', 'dull'],
    examples: ['lively rhythm section', 'make the drums livelier'],
    domains: ['energy', 'mood', 'performance'],
  },
  {
    id: 'lex:adj:vibrant' as LexemeId,
    lemma: 'vibrant',
    forms: ['vibrant', 'more vibrant', 'most vibrant'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['energetic', 'lively', 'vivid'],
    antonyms: ['dull', 'lifeless'],
    examples: ['vibrant percussion', 'more vibrant overall'],
    domains: ['energy', 'mood', 'timbre'],
  },
  {
    id: 'lex:adj:dynamic' as LexemeId,
    lemma: 'dynamic',
    forms: ['dynamic', 'more dynamic', 'most dynamic'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['energetic', 'lively', 'expressive'],
    antonyms: ['static', 'flat', 'monotonous'],
    examples: ['dynamic arrangement', 'make it more dynamic'],
    domains: ['energy', 'dynamics', 'variation'],
  },
  {
    id: 'lex:adj:intense' as LexemeId,
    lemma: 'intense',
    forms: ['intense', 'more intense', 'most intense'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['powerful', 'strong', 'fierce'],
    antonyms: ['gentle', 'mild', 'subdued'],
    examples: ['intense drop', 'too intense, dial it back'],
    domains: ['energy', 'emotion', 'dynamics'],
  },
  {
    id: 'lex:adj:aggressive' as LexemeId,
    lemma: 'aggressive',
    forms: ['aggressive', 'more aggressive', 'most aggressive'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.6,
    synonyms: ['intense', 'fierce', 'forceful'],
    antonyms: ['gentle', 'soft', 'passive'],
    examples: ['aggressive drums', 'make the bass more aggressive'],
    domains: ['energy', 'mood', 'timbre'],
  },
  {
    id: 'lex:adj:powerful' as LexemeId,
    lemma: 'powerful',
    forms: ['powerful', 'more powerful', 'most powerful'],
    axis: 'axis:energy' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['strong', 'forceful', 'mighty'],
    antonyms: ['weak', 'gentle', 'delicate'],
    examples: ['powerful kick', 'make the chorus more powerful'],
    domains: ['energy', 'dynamics', 'impact'],
  },
  {
    id: 'lex:adj:calm' as LexemeId,
    lemma: 'calm',
    forms: ['calm', 'calmer', 'calmest'],
    axis: 'axis:energy' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['peaceful', 'serene', 'tranquil'],
    antonyms: ['energetic', 'agitated', 'intense'],
    examples: ['make it calmer', 'calm intro', 'too energetic, calm it down'],
    domains: ['energy', 'mood', 'emotion'],
  },
  {
    id: 'lex:adj:peaceful' as LexemeId,
    lemma: 'peaceful',
    forms: ['peaceful', 'more peaceful', 'most peaceful'],
    axis: 'axis:energy' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['calm', 'serene', 'tranquil'],
    antonyms: ['agitated', 'chaotic'],
    examples: ['peaceful pads', 'make it more peaceful'],
    domains: ['energy', 'mood', 'emotion'],
  },
  {
    id: 'lex:adj:sedate' as LexemeId,
    lemma: 'sedate',
    forms: ['sedate', 'more sedate', 'most sedate'],
    axis: 'axis:energy' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['calm', 'subdued', 'restrained'],
    antonyms: ['energetic', 'lively'],
    examples: ['sedate tempo', 'too lively, make it sedate'],
    domains: ['energy', 'mood', 'dynamics'],
  },
  {
    id: 'lex:adj:gentle' as LexemeId,
    lemma: 'gentle',
    forms: ['gentle', 'gentler', 'gentlest'],
    axis: 'axis:energy' as AxisId,
    direction: 'decrease',
    intensity: 0.9,
    synonyms: ['soft', 'mild', 'delicate'],
    antonyms: ['aggressive', 'harsh', 'forceful'],
    examples: ['gentle piano', 'make the attack gentler'],
    domains: ['energy', 'dynamics', 'timbre'],
  },
  {
    id: 'lex:adj:relaxed' as LexemeId,
    lemma: 'relaxed',
    forms: ['relaxed', 'more relaxed', 'most relaxed'],
    axis: 'axis:energy' as AxisId,
    direction: 'decrease',
    intensity: 0.8,
    synonyms: ['calm', 'easygoing', 'laid-back'],
    antonyms: ['tense', 'tight', 'intense'],
    examples: ['relaxed groove', 'more relaxed feel'],
    domains: ['energy', 'mood', 'rhythm'],
  },
];

// =============================================================================
// Rhythmic Tightness / Groove Adjectives
// =============================================================================

/**
 * Adjectives describing rhythmic precision and groove quality.
 */
export const GROOVE_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:tight_rhythm' as LexemeId,
    lemma: 'tight',
    forms: ['tight', 'tighter', 'tightest'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['precise', 'locked', 'solid'],
    antonyms: ['loose', 'sloppy', 'ragged'],
    examples: ['tight rhythm section', 'make the drums tighter'],
    domains: ['rhythm', 'groove', 'timing'],
  },
  {
    id: 'lex:adj:locked' as LexemeId,
    lemma: 'locked',
    forms: ['locked', 'locked in', 'more locked', 'tightly locked'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['tight', 'solid', 'together'],
    antonyms: ['loose', 'disconnected'],
    examples: ['locked groove', 'drums and bass need to lock in'],
    domains: ['rhythm', 'groove', 'ensemble'],
  },
  {
    id: 'lex:adj:precise' as LexemeId,
    lemma: 'precise',
    forms: ['precise', 'more precise', 'most precise'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['tight', 'exact', 'accurate'],
    antonyms: ['loose', 'sloppy', 'vague'],
    examples: ['precise timing', 'make the hi-hats more precise'],
    domains: ['rhythm', 'timing', 'performance'],
  },
  {
    id: 'lex:adj:solid' as LexemeId,
    lemma: 'solid',
    forms: ['solid', 'more solid', 'most solid'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['tight', 'steady', 'reliable'],
    antonyms: ['shaky', 'unstable'],
    examples: ['solid kick pattern', 'make the bass more solid'],
    domains: ['rhythm', 'groove', 'foundation'],
  },
  {
    id: 'lex:adj:punchy' as LexemeId,
    lemma: 'punchy',
    forms: ['punchy', 'punchier', 'punchiest'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['tight', 'snappy', 'impactful'],
    antonyms: ['soft', 'weak', 'loose'],
    examples: ['punchy drums', 'make the kick punchier'],
    domains: ['rhythm', 'transient', 'dynamics'],
  },
  {
    id: 'lex:adj:snappy' as LexemeId,
    lemma: 'snappy',
    forms: ['snappy', 'snappier', 'snappiest'],
    axis: 'axis:tightness' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['punchy', 'crisp', 'tight'],
    antonyms: ['soft', 'dull', 'sluggish'],
    examples: ['snappy snare', 'make the transients snappier'],
    domains: ['rhythm', 'transient', 'timbre'],
  },
  {
    id: 'lex:adj:loose_rhythm' as LexemeId,
    lemma: 'loose',
    forms: ['loose', 'looser', 'loosest'],
    axis: 'axis:tightness' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['relaxed', 'laid-back', 'free'],
    antonyms: ['tight', 'rigid', 'locked'],
    examples: ['loose groove', 'make it less tight, more loose'],
    domains: ['rhythm', 'groove', 'feel'],
  },
  {
    id: 'lex:adj:laid_back' as LexemeId,
    lemma: 'laid-back',
    forms: ['laid-back', 'more laid-back', 'most laid-back'],
    axis: 'axis:tightness' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['loose', 'relaxed', 'behind the beat'],
    antonyms: ['tight', 'pushed', 'aggressive'],
    examples: ['laid-back feel', 'make the drums more laid-back'],
    domains: ['rhythm', 'groove', 'feel'],
  },
  {
    id: 'lex:adj:sloppy' as LexemeId,
    lemma: 'sloppy',
    forms: ['sloppy', 'sloppier', 'sloppiest'],
    axis: 'axis:tightness' as AxisId,
    direction: 'decrease',
    intensity: 1.5,
    synonyms: ['loose', 'messy', 'ragged'],
    antonyms: ['tight', 'precise', 'clean'],
    examples: ['sounds sloppy', 'tighten up the sloppy timing'],
    domains: ['rhythm', 'timing', 'performance'],
  },
  {
    id: 'lex:adj:swung' as LexemeId,
    lemma: 'swung',
    forms: ['swung', 'swinging', 'more swing', 'swingier'],
    axis: 'axis:swing' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['shuffled', 'triplet feel'],
    antonyms: ['straight', 'quantized', 'rigid'],
    examples: ['add swing to the hi-hats', 'more swung feel'],
    domains: ['rhythm', 'groove', 'feel'],
  },
  {
    id: 'lex:adj:straight' as LexemeId,
    lemma: 'straight',
    forms: ['straight', 'straighter', 'straightest'],
    axis: 'axis:swing' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['even', 'quantized', 'unswung'],
    antonyms: ['swung', 'shuffled'],
    examples: ['straight 8ths', 'make it less swung, more straight'],
    domains: ['rhythm', 'groove', 'feel'],
  },
  {
    id: 'lex:adj:shuffled' as LexemeId,
    lemma: 'shuffled',
    forms: ['shuffled', 'shuffle feel'],
    axis: 'axis:swing' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['swung', 'triplet feel'],
    antonyms: ['straight', 'even'],
    examples: ['shuffled groove', 'add a shuffle feel'],
    domains: ['rhythm', 'groove', 'style'],
  },
];

// =============================================================================
// Busyness / Density Adjectives
// =============================================================================

/**
 * Adjectives describing rhythmic and textural density.
 */
export const BUSYNESS_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:busy' as LexemeId,
    lemma: 'busy',
    forms: ['busy', 'busier', 'busiest'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['active', 'dense', 'full'],
    antonyms: ['sparse', 'empty', 'simple'],
    examples: ['too busy, thin it out', 'busy hi-hat pattern'],
    domains: ['density', 'texture', 'rhythm'],
  },
  {
    id: 'lex:adj:dense' as LexemeId,
    lemma: 'dense',
    forms: ['dense', 'denser', 'densest'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['thick', 'packed', 'full'],
    antonyms: ['sparse', 'thin', 'open'],
    examples: ['dense arrangement', 'too sparse, make it denser'],
    domains: ['density', 'texture', 'arrangement'],
  },
  {
    id: 'lex:adj:thick' as LexemeId,
    lemma: 'thick',
    forms: ['thick', 'thicker', 'thickest'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['dense', 'heavy', 'full'],
    antonyms: ['thin', 'light', 'transparent'],
    examples: ['thick texture', 'thicken the pads'],
    domains: ['density', 'texture', 'timbre'],
  },
  {
    id: 'lex:adj:full' as LexemeId,
    lemma: 'full',
    forms: ['full', 'fuller', 'fullest'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['rich', 'lush', 'complete'],
    antonyms: ['empty', 'hollow', 'sparse'],
    examples: ['full sound', 'make the chorus fuller'],
    domains: ['density', 'texture', 'frequency'],
  },
  {
    id: 'lex:adj:cluttered' as LexemeId,
    lemma: 'cluttered',
    forms: ['cluttered', 'more cluttered', 'most cluttered'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['busy', 'crowded', 'messy'],
    antonyms: ['clean', 'sparse', 'minimal'],
    examples: ['sounds cluttered', 'too cluttered, remove some layers'],
    domains: ['density', 'arrangement', 'mix'],
  },
  {
    id: 'lex:adj:sparse' as LexemeId,
    lemma: 'sparse',
    forms: ['sparse', 'sparser', 'sparsest'],
    axis: 'axis:density' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['thin', 'minimal', 'empty'],
    antonyms: ['dense', 'busy', 'full'],
    examples: ['sparse arrangement', 'too dense, make it sparser'],
    domains: ['density', 'texture', 'minimalism'],
  },
  {
    id: 'lex:adj:thin_texture' as LexemeId,
    lemma: 'thin',
    forms: ['thin', 'thinner', 'thinnest'],
    axis: 'axis:density' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['sparse', 'light', 'delicate'],
    antonyms: ['thick', 'dense', 'heavy'],
    examples: ['thin texture', 'thin out the arrangement'],
    domains: ['density', 'texture', 'timbre'],
  },
  {
    id: 'lex:adj:minimal' as LexemeId,
    lemma: 'minimal',
    forms: ['minimal', 'more minimal', 'most minimal'],
    axis: 'axis:density' as AxisId,
    direction: 'decrease',
    intensity: 1.3,
    synonyms: ['sparse', 'simple', 'bare'],
    antonyms: ['maximal', 'dense', 'busy'],
    examples: ['minimal arrangement', 'keep it minimal'],
    domains: ['density', 'style', 'aesthetic'],
  },
  {
    id: 'lex:adj:empty' as LexemeId,
    lemma: 'empty',
    forms: ['empty', 'emptier', 'emptiest'],
    axis: 'axis:density' as AxisId,
    direction: 'decrease',
    intensity: 1.5,
    synonyms: ['bare', 'hollow', 'vacant'],
    antonyms: ['full', 'rich', 'dense'],
    examples: ['sounds too empty', 'empty space in the middle'],
    domains: ['density', 'texture', 'frequency'],
  },
  {
    id: 'lex:adj:simple' as LexemeId,
    lemma: 'simple',
    forms: ['simple', 'simpler', 'simplest'],
    axis: 'axis:density' as AxisId,
    direction: 'decrease',
    intensity: 0.9,
    synonyms: ['minimal', 'basic', 'straightforward'],
    antonyms: ['complex', 'intricate', 'busy'],
    examples: ['keep it simple', 'simpler drum pattern'],
    domains: ['density', 'arrangement', 'composition'],
  },
  {
    id: 'lex:adj:complex' as LexemeId,
    lemma: 'complex',
    forms: ['complex', 'more complex', 'most complex'],
    axis: 'axis:density' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['intricate', 'elaborate', 'sophisticated'],
    antonyms: ['simple', 'basic', 'straightforward'],
    examples: ['complex harmony', 'make the rhythm more complex'],
    domains: ['density', 'composition', 'theory'],
  },
];

// =============================================================================
// Impact / Punch Adjectives
// =============================================================================

/**
 * Adjectives describing transient impact and punch.
 */
export const IMPACT_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:impactful' as LexemeId,
    lemma: 'impactful',
    forms: ['impactful', 'more impactful', 'most impactful'],
    axis: 'axis:impact' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['punchy', 'powerful', 'hard-hitting'],
    antonyms: ['soft', 'weak', 'gentle'],
    examples: ['impactful kick', 'make the snare more impactful'],
    domains: ['dynamics', 'transient', 'percussion'],
  },
  {
    id: 'lex:adj:hard_hitting' as LexemeId,
    lemma: 'hard-hitting',
    forms: ['hard-hitting', 'harder-hitting'],
    axis: 'axis:impact' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['impactful', 'powerful', 'aggressive'],
    antonyms: ['soft', 'gentle'],
    examples: ['hard-hitting drums', 'make the drop harder-hitting'],
    domains: ['dynamics', 'energy', 'percussion'],
  },
  {
    id: 'lex:adj:weak' as LexemeId,
    lemma: 'weak',
    forms: ['weak', 'weaker', 'weakest'],
    axis: 'axis:impact' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['soft', 'feeble', 'anemic'],
    antonyms: ['strong', 'powerful', 'impactful'],
    examples: ['kick sounds weak', 'strengthen the weak transients'],
    domains: ['dynamics', 'transient', 'energy'],
  },
  {
    id: 'lex:adj:soft_impact' as LexemeId,
    lemma: 'soft',
    forms: ['soft', 'softer', 'softest'],
    axis: 'axis:impact' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['gentle', 'subtle', 'delicate'],
    antonyms: ['hard', 'powerful', 'aggressive'],
    examples: ['soft attack', 'make the hits softer'],
    domains: ['dynamics', 'transient', 'timbre'],
  },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * All rhythm/energy adjectives in one array.
 */
export const ALL_RHYTHM_ENERGY_ADJECTIVES: readonly AdjectiveLexeme[] = [
  ...ENERGY_ADJECTIVES,
  ...GROOVE_ADJECTIVES,
  ...BUSYNESS_ADJECTIVES,
  ...IMPACT_ADJECTIVES,
];

/**
 * Get adjective by ID.
 */
export function getRhythmEnergyAdjectiveById(id: LexemeId): AdjectiveLexeme | undefined {
  return ALL_RHYTHM_ENERGY_ADJECTIVES.find(adj => adj.id === id);
}

/**
 * Get adjectives by axis.
 */
export function getRhythmEnergyAdjectivesByAxis(axis: AxisId): readonly AdjectiveLexeme[] {
  return ALL_RHYTHM_ENERGY_ADJECTIVES.filter(adj => adj.axis === axis);
}

/**
 * Get adjective by any surface form.
 */
export function getRhythmEnergyAdjectiveByForm(form: string): AdjectiveLexeme | undefined {
  const normalized = form.toLowerCase().trim();
  return ALL_RHYTHM_ENERGY_ADJECTIVES.find(adj =>
    adj.forms.some(f => f.toLowerCase() === normalized)
  );
}

/**
 * Get all unique axes covered by these adjectives.
 */
export function getRhythmEnergyCoveredAxes(): ReadonlySet<AxisId> {
  const axes = new Set<AxisId>();
  for (const adj of ALL_RHYTHM_ENERGY_ADJECTIVES) {
    axes.add(adj.axis);
  }
  return axes;
}
