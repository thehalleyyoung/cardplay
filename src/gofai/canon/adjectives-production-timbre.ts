/**
 * GOFAI Canon — Comprehensive Adjectives Lexicon (Batch 1: Production & Timbre)
 *
 * This is part of the extensive lexicon that maps natural language adjectives
 * to musical semantics. This file covers production and timbral quality adjectives.
 *
 * According to gofai_goalB.md, comprehensive vocabulary enumeration should span
 * 20,000+ LOC total across all batches. This batch focuses on ~600 lines of
 * production/timbre adjectives.
 *
 * @module gofai/canon/adjectives-production-timbre
 */

import type { LexemeId, AxisId } from './types';

// =============================================================================
// Adjective Lexeme Type
// =============================================================================

/**
 * An adjective lexeme with semantic axis mapping.
 */
export interface AdjectiveLexeme {
  /** Unique lexeme ID */
  readonly id: LexemeId;
  
  /** Base form */
  readonly lemma: string;
  
  /** All surface forms */
  readonly forms: readonly string[];
  
  /** Target axis */
  readonly axis: AxisId;
  
  /** Direction on axis */
  readonly direction: 'increase' | 'decrease';
  
  /** Intensity modifier (0.5 = slight, 1.0 = normal, 2.0 = extreme) */
  readonly intensity: number;
  
  /** Synonyms (for documentation) */
  readonly synonyms: readonly string[];
  
  /** Antonyms (for documentation) */
  readonly antonyms: readonly string[];
  
  /** Usage examples */
  readonly examples: readonly string[];
  
  /** Semantic domain tags */
  readonly domains: readonly string[];
}

// =============================================================================
// Brightness / Spectral Content Adjectives
// =============================================================================

/**
 * Adjectives describing timbral brightness (high-frequency content).
 */
export const BRIGHTNESS_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:bright' as LexemeId,
    lemma: 'bright',
    forms: ['bright', 'brighter', 'brightest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['brilliant', 'shiny', 'sparkly', 'shimmering'],
    antonyms: ['dark', 'dull', 'muted', 'muffled'],
    examples: [
      'make it brighter',
      'the lead is too bright',
      'brighten the hi-hats',
    ],
    domains: ['timbre', 'production', 'frequency'],
  },
  {
    id: 'lex:adj:brilliant' as LexemeId,
    lemma: 'brilliant',
    forms: ['brilliant', 'more brilliant', 'most brilliant'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['bright', 'shiny', 'radiant'],
    antonyms: ['dull', 'dark'],
    examples: ['make the strings brilliant', 'too brilliant on top'],
    domains: ['timbre', 'production'],
  },
  {
    id: 'lex:adj:shiny' as LexemeId,
    lemma: 'shiny',
    forms: ['shiny', 'shinier', 'shiniest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['bright', 'sparkly', 'glossy'],
    antonyms: ['dull', 'matte'],
    examples: ['make the pads shiny', 'a shiny lead sound'],
    domains: ['timbre', 'production'],
  },
  {
    id: 'lex:adj:sparkly' as LexemeId,
    lemma: 'sparkly',
    forms: ['sparkly', 'sparklier', 'sparkliest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['bright', 'shiny', 'glittery'],
    antonyms: ['dull', 'flat'],
    examples: ['add some sparkly percussion', 'too sparkly'],
    domains: ['timbre', 'production'],
  },
  {
    id: 'lex:adj:shimmering' as LexemeId,
    lemma: 'shimmering',
    forms: ['shimmering', 'more shimmering', 'most shimmering'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['bright', 'sparkly', 'glimmering'],
    antonyms: ['static', 'dull'],
    examples: ['shimmering cymbals', 'a shimmering pad'],
    domains: ['timbre', 'production', 'modulation'],
  },
  {
    id: 'lex:adj:airy' as LexemeId,
    lemma: 'airy',
    forms: ['airy', 'airier', 'airiest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['bright', 'light', 'breathy'],
    antonyms: ['dense', 'heavy', 'thick'],
    examples: ['make the vocals more airy', 'an airy reverb'],
    domains: ['timbre', 'production', 'space'],
  },
  {
    id: 'lex:adj:crisp' as LexemeId,
    lemma: 'crisp',
    forms: ['crisp', 'crisper', 'crispest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['bright', 'clear', 'sharp'],
    antonyms: ['dull', 'soft', 'muddy'],
    examples: ['crisp snare hits', 'make the hi-hats crisper'],
    domains: ['timbre', 'production', 'transient'],
  },
  {
    id: 'lex:adj:dark' as LexemeId,
    lemma: 'dark',
    forms: ['dark', 'darker', 'darkest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['dull', 'muted', 'muffled', 'warm'],
    antonyms: ['bright', 'brilliant', 'shiny'],
    examples: ['make it darker', 'a dark bass tone', 'darken the mix'],
    domains: ['timbre', 'production', 'frequency'],
  },
  {
    id: 'lex:adj:dull' as LexemeId,
    lemma: 'dull',
    forms: ['dull', 'duller', 'dullest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['dark', 'muted', 'flat'],
    antonyms: ['bright', 'sharp', 'brilliant'],
    examples: ['dull the cymbals', 'too dull overall'],
    domains: ['timbre', 'production'],
  },
  {
    id: 'lex:adj:muted' as LexemeId,
    lemma: 'muted',
    forms: ['muted', 'more muted', 'most muted'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['dark', 'subdued', 'dampened'],
    antonyms: ['bright', 'loud', 'prominent'],
    examples: ['muted trumpet sound', 'make the percussion muted'],
    domains: ['timbre', 'production', 'dynamics'],
  },
  {
    id: 'lex:adj:muffled' as LexemeId,
    lemma: 'muffled',
    forms: ['muffled', 'more muffled', 'most muffled'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 1.5,
    synonyms: ['dark', 'muted', 'dampened'],
    antonyms: ['clear', 'bright', 'crisp'],
    examples: ['sounds too muffled', 'muffled kick drum'],
    domains: ['timbre', 'production'],
  },
  {
    id: 'lex:adj:warm' as LexemeId,
    lemma: 'warm',
    forms: ['warm', 'warmer', 'warmest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 0.8,
    synonyms: ['dark', 'soft', 'rounded'],
    antonyms: ['cold', 'harsh', 'bright'],
    examples: ['warm bass tone', 'make the pads warmer', 'too cold, needs warmth'],
    domains: ['timbre', 'production', 'emotion'],
  },
  {
    id: 'lex:adj:soft' as LexemeId,
    lemma: 'soft',
    forms: ['soft', 'softer', 'softest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['gentle', 'mellow', 'smooth'],
    antonyms: ['harsh', 'hard', 'aggressive'],
    examples: ['softer lead sound', 'make the attack soft'],
    domains: ['timbre', 'production', 'dynamics'],
  },
  {
    id: 'lex:adj:smooth' as LexemeId,
    lemma: 'smooth',
    forms: ['smooth', 'smoother', 'smoothest'],
    axis: 'axis:brightness' as AxisId,
    direction: 'decrease',
    intensity: 0.9,
    synonyms: ['soft', 'silky', 'polished'],
    antonyms: ['rough', 'harsh', 'gritty'],
    examples: ['smooth out the synth', 'a smooth lead tone'],
    domains: ['timbre', 'production'],
  },
];

// =============================================================================
// Clarity / Definition Adjectives
// =============================================================================

/**
 * Adjectives describing mix clarity and separation.
 */
export const CLARITY_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:clear' as LexemeId,
    lemma: 'clear',
    forms: ['clear', 'clearer', 'clearest'],
    axis: 'axis:clarity' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['defined', 'distinct', 'transparent'],
    antonyms: ['muddy', 'unclear', 'murky'],
    examples: ['make the vocals clearer', 'needs more clarity'],
    domains: ['production', 'mix', 'frequency'],
  },
  {
    id: 'lex:adj:defined' as LexemeId,
    lemma: 'defined',
    forms: ['defined', 'more defined', 'most defined', 'well-defined'],
    axis: 'axis:clarity' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['clear', 'distinct', 'articulate'],
    antonyms: ['vague', 'blurry', 'indistinct'],
    examples: ['more defined bass line', 'well-defined kick'],
    domains: ['production', 'mix'],
  },
  {
    id: 'lex:adj:distinct' as LexemeId,
    lemma: 'distinct',
    forms: ['distinct', 'more distinct', 'most distinct'],
    axis: 'axis:clarity' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['clear', 'defined', 'separate'],
    antonyms: ['blended', 'indistinct'],
    examples: ['make each layer distinct', 'distinct articulation'],
    domains: ['production', 'mix', 'separation'],
  },
  {
    id: 'lex:adj:transparent' as LexemeId,
    lemma: 'transparent',
    forms: ['transparent', 'more transparent', 'most transparent'],
    axis: 'axis:clarity' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['clear', 'open', 'airy'],
    antonyms: ['opaque', 'dense', 'muddy'],
    examples: ['transparent mix', 'keep it transparent'],
    domains: ['production', 'mix'],
  },
  {
    id: 'lex:adj:articulate' as LexemeId,
    lemma: 'articulate',
    forms: ['articulate', 'more articulate', 'most articulate', 'well-articulated'],
    axis: 'axis:clarity' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['clear', 'defined', 'precise'],
    antonyms: ['slurred', 'muddy'],
    examples: ['articulate bass notes', 'more articulation'],
    domains: ['production', 'performance'],
  },
  {
    id: 'lex:adj:muddy' as LexemeId,
    lemma: 'muddy',
    forms: ['muddy', 'muddier', 'muddiest'],
    axis: 'axis:clarity' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['unclear', 'murky', 'cloudy'],
    antonyms: ['clear', 'transparent', 'defined'],
    examples: ['the low end is muddy', 'clean up the muddy mids'],
    domains: ['production', 'mix', 'frequency'],
  },
  {
    id: 'lex:adj:murky' as LexemeId,
    lemma: 'murky',
    forms: ['murky', 'murkier', 'murkiest'],
    axis: 'axis:clarity' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['muddy', 'unclear', 'opaque'],
    antonyms: ['clear', 'bright', 'transparent'],
    examples: ['sounds murky', 'murky low end'],
    domains: ['production', 'mix'],
  },
  {
    id: 'lex:adj:cloudy' as LexemeId,
    lemma: 'cloudy',
    forms: ['cloudy', 'cloudier', 'cloudiest'],
    axis: 'axis:clarity' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['muddy', 'hazy', 'vague'],
    antonyms: ['clear', 'sharp'],
    examples: ['the mix sounds cloudy', 'too cloudy in the mids'],
    domains: ['production', 'mix'],
  },
  {
    id: 'lex:adj:blurry' as LexemeId,
    lemma: 'blurry',
    forms: ['blurry', 'blurrier', 'blurriest'],
    axis: 'axis:clarity' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['unclear', 'fuzzy', 'vague'],
    antonyms: ['clear', 'focused', 'sharp'],
    examples: ['the attack is blurry', 'blurry transients'],
    domains: ['production', 'transient'],
  },
];

// =============================================================================
// Stereo Width / Space Adjectives
// =============================================================================

/**
 * Adjectives describing stereo width and spatial characteristics.
 */
export const WIDTH_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:wide' as LexemeId,
    lemma: 'wide',
    forms: ['wide', 'wider', 'widest'],
    axis: 'axis:width' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['broad', 'expansive', 'open'],
    antonyms: ['narrow', 'thin', 'mono'],
    examples: ['make it wider', 'wide stereo image', 'widen the chorus'],
    domains: ['production', 'stereo', 'space'],
  },
  {
    id: 'lex:adj:broad' as LexemeId,
    lemma: 'broad',
    forms: ['broad', 'broader', 'broadest'],
    axis: 'axis:width' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['wide', 'expansive'],
    antonyms: ['narrow', 'tight'],
    examples: ['broad stereo field', 'make the pads broader'],
    domains: ['production', 'stereo'],
  },
  {
    id: 'lex:adj:expansive' as LexemeId,
    lemma: 'expansive',
    forms: ['expansive', 'more expansive', 'most expansive'],
    axis: 'axis:width' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['wide', 'broad', 'vast'],
    antonyms: ['narrow', 'confined'],
    examples: ['expansive chorus', 'feels too narrow, make it expansive'],
    domains: ['production', 'stereo', 'space'],
  },
  {
    id: 'lex:adj:spread' as LexemeId,
    lemma: 'spread',
    forms: ['spread', 'spread out', 'more spread', 'most spread'],
    axis: 'axis:width' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['wide', 'dispersed'],
    antonyms: ['centered', 'tight'],
    examples: ['spread out the backing vocals', 'more spread on the strings'],
    domains: ['production', 'stereo'],
  },
  {
    id: 'lex:adj:narrow' as LexemeId,
    lemma: 'narrow',
    forms: ['narrow', 'narrower', 'narrowest'],
    axis: 'axis:width' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['thin', 'tight', 'centered'],
    antonyms: ['wide', 'broad', 'expansive'],
    examples: ['narrow the synth', 'too wide, make it narrower'],
    domains: ['production', 'stereo'],
  },
  {
    id: 'lex:adj:tight' as LexemeId,
    lemma: 'tight',
    forms: ['tight', 'tighter', 'tightest'],
    axis: 'axis:width' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['narrow', 'focused', 'centered'],
    antonyms: ['wide', 'loose', 'spread'],
    examples: ['keep the bass tight', 'tighten the stereo image'],
    domains: ['production', 'stereo', 'rhythm'],
  },
  {
    id: 'lex:adj:centered' as LexemeId,
    lemma: 'centered',
    forms: ['centered', 'more centered', 'most centered'],
    axis: 'axis:width' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['mono', 'focused', 'tight'],
    antonyms: ['wide', 'spread', 'panned'],
    examples: ['keep the vocals centered', 'too spread, center it'],
    domains: ['production', 'stereo'],
  },
  {
    id: 'lex:adj:mono' as LexemeId,
    lemma: 'mono',
    forms: ['mono', 'monophonic'],
    axis: 'axis:width' as AxisId,
    direction: 'decrease',
    intensity: 2.0,
    synonyms: ['centered', 'narrow'],
    antonyms: ['stereo', 'wide'],
    examples: ['make the kick mono', 'mono bass'],
    domains: ['production', 'stereo', 'technical'],
  },
];

// =============================================================================
// Depth / Distance Adjectives
// =============================================================================

/**
 * Adjectives describing perceived depth and distance in the mix.
 */
export const DEPTH_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:close' as LexemeId,
    lemma: 'close',
    forms: ['close', 'closer', 'closest'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['intimate', 'near', 'upfront'],
    antonyms: ['distant', 'far', 'recessed'],
    examples: ['bring the vocals closer', 'close-miked sound'],
    domains: ['production', 'space', 'depth'],
  },
  {
    id: 'lex:adj:intimate' as LexemeId,
    lemma: 'intimate',
    forms: ['intimate', 'more intimate', 'most intimate'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['close', 'personal', 'direct'],
    antonyms: ['distant', 'impersonal'],
    examples: ['intimate vocal sound', 'make it more intimate'],
    domains: ['production', 'space', 'emotion'],
  },
  {
    id: 'lex:adj:upfront' as LexemeId,
    lemma: 'upfront',
    forms: ['upfront', 'more upfront', 'most upfront'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['close', 'present', 'in-your-face'],
    antonyms: ['recessed', 'back', 'distant'],
    examples: ['upfront snare', 'make the lead more upfront'],
    domains: ['production', 'space', 'prominence'],
  },
  {
    id: 'lex:adj:present' as LexemeId,
    lemma: 'present',
    forms: ['present', 'more present', 'most present'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['close', 'forward', 'prominent'],
    antonyms: ['recessed', 'absent'],
    examples: ['more presence on the vocals', 'very present bass'],
    domains: ['production', 'space', 'frequency'],
  },
  {
    id: 'lex:adj:distant' as LexemeId,
    lemma: 'distant',
    forms: ['distant', 'more distant', 'most distant'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['far', 'recessed', 'remote'],
    antonyms: ['close', 'intimate', 'upfront'],
    examples: ['distant reverb', 'make the background vocals distant'],
    domains: ['production', 'space', 'depth'],
  },
  {
    id: 'lex:adj:recessed' as LexemeId,
    lemma: 'recessed',
    forms: ['recessed', 'more recessed', 'most recessed'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['distant', 'back', 'pushed back'],
    antonyms: ['upfront', 'forward', 'prominent'],
    examples: ['recessed in the mix', 'too upfront, recess it'],
    domains: ['production', 'space'],
  },
  {
    id: 'lex:adj:far' as LexemeId,
    lemma: 'far',
    forms: ['far', 'farther', 'farthest'],
    axis: 'axis:intimacy' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['distant', 'remote'],
    antonyms: ['close', 'near'],
    examples: ['push the reverb far back', 'sounds too far away'],
    domains: ['production', 'space'],
  },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * All production/timbre adjectives in one array.
 */
export const ALL_PRODUCTION_TIMBRE_ADJECTIVES: readonly AdjectiveLexeme[] = [
  ...BRIGHTNESS_ADJECTIVES,
  ...CLARITY_ADJECTIVES,
  ...WIDTH_ADJECTIVES,
  ...DEPTH_ADJECTIVES,
];

/**
 * Get adjective by ID.
 */
export function getAdjectiveById(id: LexemeId): AdjectiveLexeme | undefined {
  return ALL_PRODUCTION_TIMBRE_ADJECTIVES.find(adj => adj.id === id);
}

/**
 * Get adjectives by axis.
 */
export function getAdjectivesByAxis(axis: AxisId): readonly AdjectiveLexeme[] {
  return ALL_PRODUCTION_TIMBRE_ADJECTIVES.filter(adj => adj.axis === axis);
}

/**
 * Get adjective by any surface form.
 */
export function getAdjectiveByForm(form: string): AdjectiveLexeme | undefined {
  const normalized = form.toLowerCase().trim();
  return ALL_PRODUCTION_TIMBRE_ADJECTIVES.find(adj =>
    adj.forms.some(f => f.toLowerCase() === normalized)
  );
}

/**
 * Get all unique axes covered by these adjectives.
 */
export function getCoveredAxes(): ReadonlySet<AxisId> {
  const axes = new Set<AxisId>();
  for (const adj of ALL_PRODUCTION_TIMBRE_ADJECTIVES) {
    axes.add(adj.axis);
  }
  return axes;
}
