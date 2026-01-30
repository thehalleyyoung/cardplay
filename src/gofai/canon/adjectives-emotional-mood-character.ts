/**
 * GOFAI Canon — Domain Adjectives Batch 5: Emotional, Mood, and Character
 *
 * This module continues comprehensive enumeration of musical descriptors,
 * focusing on:
 * - Emotional qualities (happy, sad, angry, peaceful, tense, etc.)
 * - Mood descriptors (dark, light, mysterious, playful, serious, etc.)
 * - Character and feel (organic, mechanical, natural, artificial, etc.)
 * - Genre-specific descriptors (jazzy, funky, classical, electronic, etc.)
 *
 * Part of the extensive natural language coverage from gofai_goalB.md.
 * These adjectives primarily map to mood and character axes but can also
 * influence arrangement, harmony, and production choices.
 *
 * @module gofai/canon/adjectives-emotional-mood-character
 */

import type { LexemeId, AxisId } from './types';
import { createLexemeId, createAxisId } from './types';

/**
 * Adjective lexeme for musical description.
 */
export interface AdjectiveLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'adjective';
  readonly semantics: {
    readonly axes: readonly AxisId[];
    readonly direction: 'increase' | 'decrease' | 'neutral';
    readonly intensity: 'subtle' | 'moderate' | 'strong';
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly opposites?: readonly string[];
  readonly synonyms?: readonly string[];
}

// =============================================================================
// Emotional/Mood Adjectives - Positive Valence
// =============================================================================

export const POSITIVE_EMOTIONAL_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'happy'),
    lemma: 'happy',
    variants: ['happy', 'happier', 'happiest', 'joyful', 'cheerful'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('energy'), createAxisId('lift')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['melody', 'harmony', 'tempo'],
    },
    description: 'Positive, joyful emotional quality',
    examples: ['make it happier', 'happy melody', 'cheerful vibe'],
    opposites: ['sad', 'melancholy', 'dark'],
    synonyms: ['joyful', 'cheerful', 'upbeat', 'bright'],
  },
  {
    id: createLexemeId('adj', 'uplifting'),
    lemma: 'uplifting',
    variants: ['uplifting', 'more uplifting', 'most uplifting', 'inspiring', 'elevating'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('lift'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['melody', 'harmony', 'arrangement'],
    },
    description: 'Emotionally elevating, inspiring',
    examples: ['more uplifting', 'uplifting chorus', 'inspiring progression'],
    opposites: ['depressing', 'heavy', 'dark'],
    synonyms: ['inspiring', 'elevating', 'encouraging', 'hopeful'],
  },
  {
    id: createLexemeId('adj', 'hopeful'),
    lemma: 'hopeful',
    variants: ['hopeful', 'more hopeful', 'most hopeful', 'optimistic', 'positive'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('lift')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'melody'],
    },
    description: 'Expressing hope and optimism',
    examples: ['hopeful feeling', 'more optimistic', 'positive progression'],
    opposites: ['hopeless', 'pessimistic', 'bleak'],
    synonyms: ['optimistic', 'positive', 'encouraging', 'bright'],
  },
  {
    id: createLexemeId('adj', 'playful'),
    lemma: 'playful',
    variants: ['playful', 'more playful', 'most playful', 'fun', 'whimsical'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('groove')],
      direction: 'neutral',
      intensity: 'moderate',
      affects: ['melody', 'rhythm', 'arrangement'],
    },
    description: 'Light-hearted, fun, not taking itself seriously',
    examples: ['make it more playful', 'playful melody', 'whimsical arrangement'],
    opposites: ['serious', 'solemn', 'grave'],
    synonyms: ['fun', 'whimsical', 'lighthearted', 'mischievous'],
  },
  {
    id: createLexemeId('adj', 'joyful'),
    lemma: 'joyful',
    variants: ['joyful', 'more joyful', 'most joyful', 'jubilant', 'exuberant'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('energy'), createAxisId('lift')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['melody', 'harmony', 'rhythm'],
    },
    description: 'Expressing great joy and celebration',
    examples: ['joyful chorus', 'more jubilant', 'exuberant energy'],
    opposites: ['mournful', 'sad', 'somber'],
    synonyms: ['jubilant', 'exuberant', 'ecstatic', 'elated'],
  },
  {
    id: createLexemeId('adj', 'peaceful'),
    lemma: 'peaceful',
    variants: ['peaceful', 'more peaceful', 'most peaceful', 'calm', 'tranquil'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('energy')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['tempo', 'dynamics', 'harmony'],
    },
    description: 'Calm, tranquil, without tension',
    examples: ['more peaceful', 'peaceful atmosphere', 'tranquil mood'],
    opposites: ['agitated', 'tense', 'chaotic'],
    synonyms: ['calm', 'tranquil', 'serene', 'restful'],
  },
  {
    id: createLexemeId('adj', 'warm'),
    lemma: 'warm',
    variants: ['warm', 'warmer', 'warmest', 'inviting', 'cozy'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['timbre', 'harmony', 'production'],
    },
    description: 'Inviting, comfortable, emotionally warm',
    examples: ['make it warmer', 'warm timbre', 'cozy feeling'],
    opposites: ['cold', 'harsh', 'sterile'],
    synonyms: ['inviting', 'cozy', 'comforting', 'friendly'],
  },
  {
    id: createLexemeId('adj', 'romantic'),
    lemma: 'romantic',
    variants: ['romantic', 'more romantic', 'most romantic', 'amorous', 'tender'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['melody', 'harmony', 'dynamics'],
    },
    description: 'Expressing romantic love and tenderness',
    examples: ['more romantic', 'romantic melody', 'tender progression'],
    opposites: ['harsh', 'aggressive', 'cold'],
    synonyms: ['amorous', 'tender', 'loving', 'sentimental'],
  },
];

// =============================================================================
// Emotional/Mood Adjectives - Negative/Dark Valence
// =============================================================================

export const NEGATIVE_EMOTIONAL_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'sad'),
    lemma: 'sad',
    variants: ['sad', 'sadder', 'saddest', 'melancholy', 'sorrowful'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('energy')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['melody', 'harmony', 'tempo'],
    },
    description: 'Expressing sadness and sorrow',
    examples: ['make it sadder', 'sad melody', 'melancholy feeling'],
    opposites: ['happy', 'joyful', 'upbeat'],
    synonyms: ['melancholy', 'sorrowful', 'mournful', 'downcast'],
  },
  {
    id: createLexemeId('adj', 'dark'),
    lemma: 'dark',
    variants: ['dark', 'darker', 'darkest', 'gloomy', 'somber'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('brightness')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['harmony', 'timbre', 'register'],
    },
    description: 'Dark emotional quality, often minor or dissonant',
    examples: ['make it darker', 'dark harmony', 'somber mood'],
    opposites: ['bright', 'light', 'cheerful'],
    synonyms: ['gloomy', 'somber', 'brooding', 'shadowy'],
  },
  {
    id: createLexemeId('adj', 'tense'),
    lemma: 'tense',
    variants: ['tense', 'more tense', 'most tense', 'anxious', 'nervous'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('tension'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['harmony', 'rhythm', 'dynamics'],
    },
    description: 'Creating tension and unease',
    examples: ['make it more tense', 'tense harmony', 'anxious feeling'],
    opposites: ['relaxed', 'calm', 'peaceful'],
    synonyms: ['anxious', 'nervous', 'strained', 'uneasy'],
  },
  {
    id: createLexemeId('adj', 'aggressive'),
    lemma: 'aggressive',
    variants: ['aggressive', 'more aggressive', 'most aggressive', 'forceful', 'attacking'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('energy'), createAxisId('grit')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['dynamics', 'timbre', 'rhythm'],
    },
    description: 'Forceful, attacking, intense energy',
    examples: ['more aggressive', 'aggressive drums', 'attacking style'],
    opposites: ['gentle', 'soft', 'peaceful'],
    synonyms: ['forceful', 'attacking', 'intense', 'fierce'],
  },
  {
    id: createLexemeId('adj', 'angry'),
    lemma: 'angry',
    variants: ['angry', 'angrier', 'angriest', 'furious', 'enraged'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('energy'), createAxisId('grit')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['dynamics', 'timbre', 'performance'],
    },
    description: 'Expressing anger and fury',
    examples: ['make it angrier', 'furious energy', 'enraged performance'],
    opposites: ['calm', 'peaceful', 'gentle'],
    synonyms: ['furious', 'enraged', 'irate', 'livid'],
  },
  {
    id: createLexemeId('adj', 'haunting'),
    lemma: 'haunting',
    variants: ['haunting', 'more haunting', 'most haunting', 'eerie', 'ghostly'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('tension')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['melody', 'harmony', 'production'],
    },
    description: 'Eerie, memorable, staying in the mind',
    examples: ['haunting melody', 'more eerie', 'ghostly atmosphere'],
    opposites: ['cheerful', 'bright', 'mundane'],
    synonyms: ['eerie', 'ghostly', 'spooky', 'unsettling'],
  },
  {
    id: createLexemeId('adj', 'mysterious'),
    lemma: 'mysterious',
    variants: ['mysterious', 'more mysterious', 'most mysterious', 'enigmatic', 'cryptic'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('tension')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'melody', 'production'],
    },
    description: 'Creating mystery and intrigue',
    examples: ['more mysterious', 'enigmatic quality', 'cryptic progression'],
    opposites: ['obvious', 'straightforward', 'clear'],
    synonyms: ['enigmatic', 'cryptic', 'puzzling', 'arcane'],
  },
  {
    id: createLexemeId('adj', 'ominous'),
    lemma: 'ominous',
    variants: ['ominous', 'more ominous', 'most ominous', 'foreboding', 'menacing'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('tension')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['harmony', 'dynamics', 'register'],
    },
    description: 'Threatening, foreboding',
    examples: ['ominous feeling', 'more menacing', 'foreboding atmosphere'],
    opposites: ['reassuring', 'comforting', 'safe'],
    synonyms: ['foreboding', 'menacing', 'threatening', 'sinister'],
  },
  {
    id: createLexemeId('adj', 'melancholy'),
    lemma: 'melancholy',
    variants: ['melancholy', 'more melancholy', 'most melancholy', 'wistful', 'pensive'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['melody', 'harmony'],
    },
    description: 'Thoughtful sadness, bittersweet quality',
    examples: ['melancholy mood', 'wistful melody', 'pensive quality'],
    opposites: ['joyful', 'upbeat', 'cheerful'],
    synonyms: ['wistful', 'pensive', 'contemplative', 'bittersweet'],
  },
  {
    id: createLexemeId('adj', 'cold'),
    lemma: 'cold',
    variants: ['cold', 'colder', 'coldest', 'icy', 'frigid'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('intimacy')],
      direction: 'decrease',
      intensity: 'strong',
      affects: ['timbre', 'production', 'harmony'],
    },
    description: 'Emotionally cold, lacking warmth',
    examples: ['make it colder', 'icy timbre', 'frigid atmosphere'],
    opposites: ['warm', 'inviting', 'cozy'],
    synonyms: ['icy', 'frigid', 'sterile', 'clinical'],
  },
];

// =============================================================================
// Character and Feel Adjectives
// =============================================================================

export const CHARACTER_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'organic'),
    lemma: 'organic',
    variants: ['organic', 'more organic', 'most organic', 'natural', 'acoustic'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('authenticity'), createAxisId('grit')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['timbre', 'production', 'performance'],
    },
    description: 'Natural, acoustic, not synthetic',
    examples: ['more organic', 'organic sound', 'natural feel'],
    opposites: ['synthetic', 'electronic', 'artificial'],
    synonyms: ['natural', 'acoustic', 'real', 'authentic'],
  },
  {
    id: createLexemeId('adj', 'synthetic'),
    lemma: 'synthetic',
    variants: ['synthetic', 'more synthetic', 'most synthetic', 'electronic', 'artificial'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('authenticity')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['timbre', 'production'],
    },
    description: 'Electronic, synthesized, artificial',
    examples: ['more synthetic', 'electronic timbre', 'artificial sound'],
    opposites: ['organic', 'natural', 'acoustic'],
    synonyms: ['electronic', 'artificial', 'digital', 'processed'],
  },
  {
    id: createLexemeId('adj', 'mechanical'),
    lemma: 'mechanical',
    variants: ['mechanical', 'more mechanical', 'most mechanical', 'robotic', 'programmed'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('tightness'), createAxisId('groove')],
      direction: 'neutral',
      intensity: 'moderate',
      affects: ['rhythm', 'timing', 'performance'],
    },
    description: 'Machine-like precision, lacking human feel',
    examples: ['too mechanical', 'robotic timing', 'less mechanical feel'],
    opposites: ['human', 'organic', 'loose'],
    synonyms: ['robotic', 'programmed', 'rigid', 'automated'],
  },
  {
    id: createLexemeId('adj', 'human'),
    lemma: 'human',
    variants: ['human', 'more human', 'most human', 'natural', 'performed'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('groove'), createAxisId('authenticity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['timing', 'performance', 'dynamics'],
    },
    description: 'Having human imperfections and feel',
    examples: ['more human feel', 'natural timing', 'performed quality'],
    opposites: ['mechanical', 'robotic', 'programmed'],
    synonyms: ['natural', 'performed', 'authentic', 'real'],
  },
  {
    id: createLexemeId('adj', 'smooth'),
    lemma: 'smooth',
    variants: ['smooth', 'smoother', 'smoothest', 'fluid', 'flowing'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('smoothness'), createAxisId('sophistication')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['melody', 'rhythm', 'production'],
    },
    description: 'Flowing without abrupt changes',
    examples: ['make it smoother', 'smooth transitions', 'fluid melody'],
    opposites: ['choppy', 'rough', 'jarring'],
    synonyms: ['fluid', 'flowing', 'seamless', 'graceful'],
  },
  {
    id: createLexemeId('adj', 'choppy'),
    lemma: 'choppy',
    variants: ['choppy', 'choppier', 'choppiest', 'staccato', 'jerky'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('smoothness'), createAxisId('groove')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['rhythm', 'melody', 'phrasing'],
    },
    description: 'Abrupt, disconnected, not smooth',
    examples: ['too choppy', 'choppier rhythm', 'staccato feel'],
    opposites: ['smooth', 'fluid', 'flowing'],
    synonyms: ['staccato', 'jerky', 'abrupt', 'disconnected'],
  },
  {
    id: createLexemeId('adj', 'vintage'),
    lemma: 'vintage',
    variants: ['vintage', 'more vintage', 'most vintage', 'retro', 'classic'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('authenticity'), createAxisId('mood')],
      direction: 'neutral',
      intensity: 'moderate',
      affects: ['timbre', 'production', 'mixing'],
    },
    description: 'Having the character of older recordings',
    examples: ['vintage sound', 'more retro', 'classic production'],
    opposites: ['modern', 'contemporary', 'futuristic'],
    synonyms: ['retro', 'classic', 'old-school', 'nostalgic'],
  },
  {
    id: createLexemeId('adj', 'modern'),
    lemma: 'modern',
    variants: ['modern', 'more modern', 'most modern', 'contemporary', 'current'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('sophistication')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mixing', 'arrangement'],
    },
    description: 'Contemporary production aesthetic',
    examples: ['modern production', 'more contemporary', 'current sound'],
    opposites: ['vintage', 'retro', 'classic'],
    synonyms: ['contemporary', 'current', 'present-day', 'up-to-date'],
  },
  {
    id: createLexemeId('adj', 'futuristic'),
    lemma: 'futuristic',
    variants: ['futuristic', 'more futuristic', 'most futuristic', 'forward-thinking', 'avant-garde'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('mood')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['timbre', 'production', 'arrangement'],
    },
    description: 'Forward-looking, experimental aesthetic',
    examples: ['futuristic sound', 'more avant-garde', 'forward-thinking production'],
    opposites: ['vintage', 'classic', 'traditional'],
    synonyms: ['forward-thinking', 'avant-garde', 'cutting-edge', 'progressive'],
  },
  {
    id: createLexemeId('adj', 'lo-fi'),
    lemma: 'lo-fi',
    variants: ['lo-fi', 'more lo-fi', 'most lo-fi', 'lofi', 'low-fidelity'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('grit'), createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mixing', 'timbre'],
    },
    description: 'Low-fidelity, intentionally degraded quality',
    examples: ['lo-fi aesthetic', 'more lo-fi', 'low-fidelity production'],
    opposites: ['hi-fi', 'polished', 'pristine'],
    synonyms: ['low-fidelity', 'degraded', 'gritty', 'rough'],
  },
  {
    id: createLexemeId('adj', 'hi-fi'),
    lemma: 'hi-fi',
    variants: ['hi-fi', 'more hi-fi', 'most hi-fi', 'hifi', 'high-fidelity'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('sophistication')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mixing'],
    },
    description: 'High-fidelity, pristine production quality',
    examples: ['hi-fi production', 'high-fidelity sound', 'pristine quality'],
    opposites: ['lo-fi', 'degraded', 'rough'],
    synonyms: ['high-fidelity', 'pristine', 'clear', 'audiophile'],
  },
  {
    id: createLexemeId('adj', 'dreamy'),
    lemma: 'dreamy',
    variants: ['dreamy', 'more dreamy', 'most dreamy', 'ethereal', 'otherworldly'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('space')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['reverb', 'production', 'melody'],
    },
    description: 'Ethereal, dreamlike quality',
    examples: ['dreamy atmosphere', 'ethereal quality', 'otherworldly sound'],
    opposites: ['gritty', 'harsh', 'realistic'],
    synonyms: ['ethereal', 'otherworldly', 'celestial', 'heavenly'],
  },
];

// =============================================================================
// Genre-Influenced Adjectives
// =============================================================================

export const GENRE_ADJECTIVES: readonly AdjectiveLexeme[] = [
  {
    id: createLexemeId('adj', 'jazzy'),
    lemma: 'jazzy',
    variants: ['jazzy', 'more jazzy', 'most jazzy', 'jazz-like', 'jazz-influenced'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('groove')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'rhythm', 'voicing'],
    },
    description: 'Having jazz characteristics (swing, complex harmony, improvisation)',
    examples: ['jazzy chords', 'more jazzy', 'jazz-influenced harmony'],
    opposites: ['straight', 'simple', 'basic'],
    synonyms: ['jazz-like', 'jazz-influenced', 'swinging', 'bebop'],
  },
  {
    id: createLexemeId('adj', 'funky'),
    lemma: 'funky',
    variants: ['funky', 'funkier', 'funkiest', 'groovy', 'funk-influenced'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('groove'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['rhythm', 'bass', 'syncopation'],
    },
    description: 'Having funk characteristics (syncopation, strong groove, rhythmic emphasis)',
    examples: ['funky groove', 'funkier bass', 'more groovy'],
    opposites: ['straight', 'square', 'stiff'],
    synonyms: ['groovy', 'funk-influenced', 'syncopated', 'pocket'],
  },
  {
    id: createLexemeId('adj', 'classical'),
    lemma: 'classical',
    variants: ['classical', 'more classical', 'most classical', 'orchestral', 'symphonic'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('sophistication'), createAxisId('harmonic_richness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['harmony', 'arrangement', 'voicing'],
    },
    description: 'Having classical music characteristics (formal harmony, orchestration)',
    examples: ['classical harmony', 'orchestral arrangement', 'symphonic quality'],
    opposites: ['contemporary', 'modern', 'popular'],
    synonyms: ['orchestral', 'symphonic', 'formal', 'traditional'],
  },
  {
    id: createLexemeId('adj', 'electronic'),
    lemma: 'electronic',
    variants: ['electronic', 'more electronic', 'most electronic', 'digital', 'synthesized'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('authenticity')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['timbre', 'production'],
    },
    description: 'Using electronic/synthesized sounds',
    examples: ['electronic sound', 'more digital', 'synthesized timbre'],
    opposites: ['acoustic', 'organic', 'natural'],
    synonyms: ['digital', 'synthesized', 'electro', 'synth-based'],
  },
  {
    id: createLexemeId('adj', 'bluesy'),
    lemma: 'bluesy',
    variants: ['bluesy', 'more bluesy', 'most bluesy', 'blues-like', 'blues-influenced'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('mood'), createAxisId('grit')],
      direction: 'neutral',
      intensity: 'moderate',
      affects: ['melody', 'harmony', 'phrasing'],
    },
    description: 'Having blues characteristics (blue notes, call-response, bend)',
    examples: ['bluesy melody', 'more blues-like', 'blues-influenced phrasing'],
    opposites: ['sweet', 'clean', 'pure'],
    synonyms: ['blues-like', 'blues-influenced', 'gritty', 'soulful'],
  },
  {
    id: createLexemeId('adj', 'folky'),
    lemma: 'folky',
    variants: ['folky', 'more folky', 'most folky', 'folk-like', 'folk-influenced'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('authenticity'), createAxisId('intimacy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['arrangement', 'production', 'melody'],
    },
    description: 'Having folk music characteristics (acoustic, simple, storytelling)',
    examples: ['folky arrangement', 'folk-influenced', 'more folk-like'],
    opposites: ['produced', 'synthetic', 'complex'],
    synonyms: ['folk-like', 'folk-influenced', 'acoustic', 'traditional'],
  },
  {
    id: createLexemeId('adj', 'poppy'),
    lemma: 'poppy',
    variants: ['poppy', 'more poppy', 'most poppy', 'pop-like', 'catchy'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['melody', 'structure', 'production'],
    },
    description: 'Having pop characteristics (catchy, accessible, hooks)',
    examples: ['poppy melody', 'more catchy', 'pop-influenced'],
    opposites: ['experimental', 'difficult', 'challenging'],
    synonyms: ['pop-like', 'catchy', 'accessible', 'commercial'],
  },
  {
    id: createLexemeId('adj', 'ambient'),
    lemma: 'ambient',
    variants: ['ambient', 'more ambient', 'most ambient', 'atmospheric', 'environmental'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('space'), createAxisId('mood')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['texture', 'production', 'arrangement'],
    },
    description: 'Having ambient characteristics (atmospheric, textural, spacious)',
    examples: ['ambient texture', 'atmospheric quality', 'environmental sound'],
    opposites: ['dense', 'busy', 'rhythmic'],
    synonyms: ['atmospheric', 'environmental', 'textural', 'soundscape'],
  },
];

// Export all adjective collections
export const EMOTIONAL_MOOD_CHARACTER_ADJECTIVES: readonly AdjectiveLexeme[] = [
  ...POSITIVE_EMOTIONAL_ADJECTIVES,
  ...NEGATIVE_EMOTIONAL_ADJECTIVES,
  ...CHARACTER_ADJECTIVES,
  ...GENRE_ADJECTIVES,
];
