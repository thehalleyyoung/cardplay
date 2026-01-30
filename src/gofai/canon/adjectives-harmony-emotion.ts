/**
 * GOFAI Canon — Comprehensive Adjectives Lexicon (Batch 3: Harmony & Emotion)
 *
 * This batch covers adjectives describing harmonic quality, tonal character,
 * and emotional/expressive qualities of music.
 *
 * Part of the 20,000+ LOC vocabulary enumeration from gofai_goalB.md.
 * Target: ~600 lines for this batch.
 *
 * @module gofai/canon/adjectives-harmony-emotion
 */

import type { LexemeId, AxisId } from './types';
import type { AdjectiveLexeme } from './adjectives-production-timbre';

// =============================================================================
// Tension / Resolution Adjectives
// =============================================================================

/**
 * Adjectives describing harmonic tension and resolution.
 */
export const TENSION_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:tense' as LexemeId,
    lemma: 'tense',
    forms: ['tense', 'tenser', 'tensest'],
    axis: 'axis:tension' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['dissonant', 'unstable', 'unresolved'],
    antonyms: ['resolved', 'consonant', 'stable'],
    examples: ['make it more tense', 'tense harmony', 'add tension'],
    domains: ['harmony', 'emotion', 'drama'],
  },
  {
    id: 'lex:adj:dissonant' as LexemeId,
    lemma: 'dissonant',
    forms: ['dissonant', 'more dissonant', 'most dissonant'],
    axis: 'axis:tension' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['tense', 'harsh', 'clashing'],
    antonyms: ['consonant', 'harmonious', 'resolved'],
    examples: ['dissonant chord', 'too consonant, make it dissonant'],
    domains: ['harmony', 'theory', 'aesthetic'],
  },
  {
    id: 'lex:adj:unstable' as LexemeId,
    lemma: 'unstable',
    forms: ['unstable', 'more unstable', 'most unstable'],
    axis: 'axis:tension' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['tense', 'uncertain', 'unresolved'],
    antonyms: ['stable', 'grounded', 'resolved'],
    examples: ['unstable harmony', 'create instability'],
    domains: ['harmony', 'theory', 'drama'],
  },
  {
    id: 'lex:adj:unresolved' as LexemeId,
    lemma: 'unresolved',
    forms: ['unresolved', 'more unresolved'],
    axis: 'axis:tension' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['tense', 'hanging', 'incomplete'],
    antonyms: ['resolved', 'complete', 'final'],
    examples: ['unresolved ending', 'leave it unresolved'],
    domains: ['harmony', 'form', 'drama'],
  },
  {
    id: 'lex:adj:resolved' as LexemeId,
    lemma: 'resolved',
    forms: ['resolved', 'more resolved', 'most resolved'],
    axis: 'axis:tension' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['consonant', 'stable', 'settled'],
    antonyms: ['tense', 'dissonant', 'unresolved'],
    examples: ['resolved cadence', 'make it more resolved'],
    domains: ['harmony', 'theory', 'form'],
  },
  {
    id: 'lex:adj:consonant' as LexemeId,
    lemma: 'consonant',
    forms: ['consonant', 'more consonant', 'most consonant'],
    axis: 'axis:tension' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['resolved', 'harmonious', 'smooth'],
    antonyms: ['dissonant', 'harsh', 'tense'],
    examples: ['consonant harmony', 'too dissonant, make it consonant'],
    domains: ['harmony', 'theory', 'aesthetic'],
  },
  {
    id: 'lex:adj:stable' as LexemeId,
    lemma: 'stable',
    forms: ['stable', 'more stable', 'most stable'],
    axis: 'axis:tension' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['grounded', 'solid', 'settled'],
    antonyms: ['unstable', 'uncertain'],
    examples: ['stable tonic', 'create stability'],
    domains: ['harmony', 'theory', 'foundation'],
  },
  {
    id: 'lex:adj:harmonious' as LexemeId,
    lemma: 'harmonious',
    forms: ['harmonious', 'more harmonious', 'most harmonious'],
    axis: 'axis:tension' as AxisId,
    direction: 'decrease',
    intensity: 0.9,
    synonyms: ['consonant', 'pleasant', 'balanced'],
    antonyms: ['dissonant', 'clashing'],
    examples: ['harmonious voicing', 'make it more harmonious'],
    domains: ['harmony', 'aesthetic', 'balance'],
  },
];

// =============================================================================
// Brightness / Darkness (Tonal Quality) Adjectives
// =============================================================================

/**
 * Adjectives describing tonal brightness/darkness in harmonic terms.
 */
export const TONAL_COLOR_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:major' as LexemeId,
    lemma: 'major',
    forms: ['major', 'more major'],
    axis: 'axis:tonality' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['bright', 'happy', 'uplifting'],
    antonyms: ['minor', 'dark', 'sad'],
    examples: ['switch to major', 'make it feel major'],
    domains: ['harmony', 'theory', 'emotion'],
  },
  {
    id: 'lex:adj:minor' as LexemeId,
    lemma: 'minor',
    forms: ['minor', 'more minor'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['dark', 'sad', 'melancholic'],
    antonyms: ['major', 'bright', 'happy'],
    examples: ['switch to minor', 'give it a minor feel'],
    domains: ['harmony', 'theory', 'emotion'],
  },
  {
    id: 'lex:adj:happy' as LexemeId,
    lemma: 'happy',
    forms: ['happy', 'happier', 'happiest'],
    axis: 'axis:tonality' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['joyful', 'cheerful', 'upbeat'],
    antonyms: ['sad', 'melancholic', 'gloomy'],
    examples: ['make it happier', 'happy melody'],
    domains: ['emotion', 'mood', 'harmony'],
  },
  {
    id: 'lex:adj:joyful' as LexemeId,
    lemma: 'joyful',
    forms: ['joyful', 'more joyful', 'most joyful'],
    axis: 'axis:tonality' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['happy', 'jubilant', 'celebratory'],
    antonyms: ['sad', 'mournful'],
    examples: ['joyful chorus', 'make it more joyful'],
    domains: ['emotion', 'mood', 'energy'],
  },
  {
    id: 'lex:adj:cheerful' as LexemeId,
    lemma: 'cheerful',
    forms: ['cheerful', 'more cheerful', 'most cheerful'],
    axis: 'axis:tonality' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['happy', 'bright', 'optimistic'],
    antonyms: ['gloomy', 'somber'],
    examples: ['cheerful tune', 'too gloomy, make it cheerful'],
    domains: ['emotion', 'mood'],
  },
  {
    id: 'lex:adj:uplifting' as LexemeId,
    lemma: 'uplifting',
    forms: ['uplifting', 'more uplifting', 'most uplifting'],
    axis: 'axis:tonality' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['inspiring', 'hopeful', 'elevating'],
    antonyms: ['depressing', 'heavy'],
    examples: ['uplifting progression', 'make it more uplifting'],
    domains: ['emotion', 'mood', 'harmony'],
  },
  {
    id: 'lex:adj:sad' as LexemeId,
    lemma: 'sad',
    forms: ['sad', 'sadder', 'saddest'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['melancholic', 'mournful', 'sorrowful'],
    antonyms: ['happy', 'joyful', 'cheerful'],
    examples: ['sad melody', 'make it sadder'],
    domains: ['emotion', 'mood', 'harmony'],
  },
  {
    id: 'lex:adj:melancholic' as LexemeId,
    lemma: 'melancholic',
    forms: ['melancholic', 'more melancholic', 'most melancholic'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.2,
    synonyms: ['sad', 'wistful', 'nostalgic'],
    antonyms: ['happy', 'cheerful'],
    examples: ['melancholic chord', 'give it a melancholic feel'],
    domains: ['emotion', 'mood', 'aesthetic'],
  },
  {
    id: 'lex:adj:dark_harmony' as LexemeId,
    lemma: 'dark',
    forms: ['dark', 'darker', 'darkest'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.3,
    synonyms: ['gloomy', 'somber', 'ominous'],
    antonyms: ['bright', 'light', 'uplifting'],
    examples: ['dark harmony', 'make the progression darker'],
    domains: ['emotion', 'mood', 'harmony'],
  },
  {
    id: 'lex:adj:gloomy' as LexemeId,
    lemma: 'gloomy',
    forms: ['gloomy', 'gloomier', 'gloomiest'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.4,
    synonyms: ['dark', 'bleak', 'depressing'],
    antonyms: ['bright', 'cheerful', 'uplifting'],
    examples: ['gloomy atmosphere', 'too bright, make it gloomy'],
    domains: ['emotion', 'mood', 'atmosphere'],
  },
  {
    id: 'lex:adj:somber' as LexemeId,
    lemma: 'somber',
    forms: ['somber', 'more somber', 'most somber'],
    axis: 'axis:tonality' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['serious', 'grave', 'solemn'],
    antonyms: ['cheerful', 'lighthearted'],
    examples: ['somber mood', 'make it more somber'],
    domains: ['emotion', 'mood', 'atmosphere'],
  },
];

// =============================================================================
// Emotional Expression Adjectives
// =============================================================================

/**
 * Adjectives describing emotional expression and character.
 */
export const EMOTIONAL_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:emotional' as LexemeId,
    lemma: 'emotional',
    forms: ['emotional', 'more emotional', 'most emotional'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['expressive', 'passionate', 'heartfelt'],
    antonyms: ['cold', 'detached', 'clinical'],
    examples: ['emotional performance', 'make it more emotional'],
    domains: ['emotion', 'expression', 'performance'],
  },
  {
    id: 'lex:adj:expressive' as LexemeId,
    lemma: 'expressive',
    forms: ['expressive', 'more expressive', 'most expressive'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['emotional', 'communicative', 'articulate'],
    antonyms: ['flat', 'unexpressive', 'monotonous'],
    examples: ['expressive phrasing', 'more expressive dynamics'],
    domains: ['emotion', 'expression', 'performance'],
  },
  {
    id: 'lex:adj:passionate' as LexemeId,
    lemma: 'passionate',
    forms: ['passionate', 'more passionate', 'most passionate'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['emotional', 'fervent', 'intense'],
    antonyms: ['cold', 'dispassionate'],
    examples: ['passionate performance', 'make the solo more passionate'],
    domains: ['emotion', 'expression', 'intensity'],
  },
  {
    id: 'lex:adj:heartfelt' as LexemeId,
    lemma: 'heartfelt',
    forms: ['heartfelt', 'more heartfelt', 'most heartfelt'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['sincere', 'genuine', 'emotional'],
    antonyms: ['cold', 'insincere'],
    examples: ['heartfelt melody', 'make it more heartfelt'],
    domains: ['emotion', 'expression', 'sincerity'],
  },
  {
    id: 'lex:adj:dramatic' as LexemeId,
    lemma: 'dramatic',
    forms: ['dramatic', 'more dramatic', 'most dramatic'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['theatrical', 'striking', 'intense'],
    antonyms: ['subtle', 'understated'],
    examples: ['dramatic build', 'make the drop more dramatic'],
    domains: ['emotion', 'expression', 'dynamics'],
  },
  {
    id: 'lex:adj:cold' as LexemeId,
    lemma: 'cold',
    forms: ['cold', 'colder', 'coldest'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['detached', 'clinical', 'sterile'],
    antonyms: ['warm', 'emotional', 'expressive'],
    examples: ['too emotional, make it colder', 'cold atmosphere'],
    domains: ['emotion', 'mood', 'aesthetic'],
  },
  {
    id: 'lex:adj:detached' as LexemeId,
    lemma: 'detached',
    forms: ['detached', 'more detached', 'most detached'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'decrease',
    intensity: 1.1,
    synonyms: ['cold', 'distant', 'aloof'],
    antonyms: ['engaged', 'emotional'],
    examples: ['detached performance', 'make it more detached'],
    domains: ['emotion', 'expression', 'aesthetic'],
  },
  {
    id: 'lex:adj:clinical' as LexemeId,
    lemma: 'clinical',
    forms: ['clinical', 'more clinical', 'most clinical'],
    axis: 'axis:expressiveness' as AxisId,
    direction: 'decrease',
    intensity: 1.3,
    synonyms: ['cold', 'sterile', 'technical'],
    antonyms: ['warm', 'organic', 'expressive'],
    examples: ['too emotional, make it clinical', 'clinical precision'],
    domains: ['emotion', 'aesthetic', 'production'],
  },
];

// =============================================================================
// Atmospheric Adjectives
// =============================================================================

/**
 * Adjectives describing atmospheric and textural qualities.
 */
export const ATMOSPHERIC_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: 'lex:adj:atmospheric' as LexemeId,
    lemma: 'atmospheric',
    forms: ['atmospheric', 'more atmospheric', 'most atmospheric'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.0,
    synonyms: ['ambient', 'ethereal', 'spacious'],
    antonyms: ['dry', 'direct', 'present'],
    examples: ['atmospheric pads', 'make it more atmospheric'],
    domains: ['space', 'texture', 'aesthetic'],
  },
  {
    id: 'lex:adj:ambient' as LexemeId,
    lemma: 'ambient',
    forms: ['ambient', 'more ambient', 'most ambient'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['atmospheric', 'surrounding', 'immersive'],
    antonyms: ['direct', 'dry'],
    examples: ['ambient reverb', 'add ambient texture'],
    domains: ['space', 'texture', 'genre'],
  },
  {
    id: 'lex:adj:ethereal' as LexemeId,
    lemma: 'ethereal',
    forms: ['ethereal', 'more ethereal', 'most ethereal'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.3,
    synonyms: ['airy', 'celestial', 'otherworldly'],
    antonyms: ['grounded', 'earthy', 'solid'],
    examples: ['ethereal vocals', 'make the pads ethereal'],
    domains: ['space', 'texture', 'aesthetic'],
  },
  {
    id: 'lex:adj:spacious' as LexemeId,
    lemma: 'spacious',
    forms: ['spacious', 'more spacious', 'most spacious'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['open', 'roomy', 'expansive'],
    antonyms: ['cramped', 'dry', 'tight'],
    examples: ['spacious reverb', 'make the mix more spacious'],
    domains: ['space', 'production', 'depth'],
  },
  {
    id: 'lex:adj:dry' as LexemeId,
    lemma: 'dry',
    forms: ['dry', 'drier', 'driest'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'decrease',
    intensity: 1.0,
    synonyms: ['direct', 'close', 'unprocessed'],
    antonyms: ['wet', 'atmospheric', 'spacious'],
    examples: ['dry vocal', 'make it drier, less reverb'],
    domains: ['space', 'production', 'effects'],
  },
  {
    id: 'lex:adj:wet' as LexemeId,
    lemma: 'wet',
    forms: ['wet', 'wetter', 'wettest'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.1,
    synonyms: ['reverberant', 'processed', 'spacious'],
    antonyms: ['dry', 'direct'],
    examples: ['wet reverb', 'make it wetter'],
    domains: ['space', 'production', 'effects'],
  },
  {
    id: 'lex:adj:dreamy' as LexemeId,
    lemma: 'dreamy',
    forms: ['dreamy', 'dreamier', 'dreamiest'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.4,
    synonyms: ['ethereal', 'hazy', 'surreal'],
    antonyms: ['clear', 'direct', 'realistic'],
    examples: ['dreamy atmosphere', 'make the pads dreamier'],
    domains: ['space', 'texture', 'aesthetic'],
  },
  {
    id: 'lex:adj:mysterious' as LexemeId,
    lemma: 'mysterious',
    forms: ['mysterious', 'more mysterious', 'most mysterious'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.2,
    synonyms: ['enigmatic', 'cryptic', 'obscure'],
    antonyms: ['obvious', 'clear', 'direct'],
    examples: ['mysterious intro', 'make it more mysterious'],
    domains: ['mood', 'atmosphere', 'emotion'],
  },
  {
    id: 'lex:adj:ominous' as LexemeId,
    lemma: 'ominous',
    forms: ['ominous', 'more ominous', 'most ominous'],
    axis: 'axis:atmosphere' as AxisId,
    direction: 'increase',
    intensity: 1.5,
    synonyms: ['foreboding', 'menacing', 'threatening'],
    antonyms: ['welcoming', 'warm', 'comforting'],
    examples: ['ominous bass', 'make the intro ominous'],
    domains: ['mood', 'atmosphere', 'emotion'],
  },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * All harmony/emotion adjectives in one array.
 */
export const ALL_HARMONY_EMOTION_ADJECTIVES: readonly AdjectiveLexeme[] = [
  ...TENSION_ADJECTIVES,
  ...TONAL_COLOR_ADJECTIVES,
  ...EMOTIONAL_ADJECTIVES,
  ...ATMOSPHERIC_ADJECTIVES,
];

/**
 * Get adjective by ID.
 */
export function getHarmonyEmotionAdjectiveById(id: LexemeId): AdjectiveLexeme | undefined {
  return ALL_HARMONY_EMOTION_ADJECTIVES.find(adj => adj.id === id);
}

/**
 * Get adjectives by axis.
 */
export function getHarmonyEmotionAdjectivesByAxis(axis: AxisId): readonly AdjectiveLexeme[] {
  return ALL_HARMONY_EMOTION_ADJECTIVES.filter(adj => adj.axis === axis);
}

/**
 * Get adjective by any surface form.
 */
export function getHarmonyEmotionAdjectiveByForm(form: string): AdjectiveLexeme | undefined {
  const normalized = form.toLowerCase().trim();
  return ALL_HARMONY_EMOTION_ADJECTIVES.find(adj =>
    adj.forms.some(f => f.toLowerCase() === normalized)
  );
}

/**
 * Get all unique axes covered by these adjectives.
 */
export function getHarmonyEmotionCoveredAxes(): ReadonlySet<AxisId> {
  const axes = new Set<AxisId>();
  for (const adj of ALL_HARMONY_EMOTION_ADJECTIVES) {
    axes.add(adj.axis);
  }
  return axes;
}
