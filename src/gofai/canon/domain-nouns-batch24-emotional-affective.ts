/**
 * GOFAI Canon — Domain Nouns Batch 24: Emotional and Affective Terms
 *
 * Comprehensive vocabulary for emotional descriptors, mood qualities,
 * expressive character, and affective dimensions. This batch systematically
 * enumerates the natural language terms musicians use to describe the
 * emotional qualities and expressive character of music.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage for musical concepts.
 *
 * @module gofai/canon/domain-nouns-batch24-emotional-affective
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Emotional and affective lexeme.
 */
export interface EmotionalLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'adjective' | 'noun';
  readonly semantics: {
    readonly type: 'mood' | 'energy' | 'character' | 'expression' | 'atmosphere';
    readonly valence?: 'positive' | 'negative' | 'neutral' | 'mixed';
    readonly arousal?: 'high' | 'medium' | 'low';
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
  readonly opposites?: readonly string[];
}

// =============================================================================
// Positive Valence - High Arousal (Energetic Positive)
// =============================================================================

export const POSITIVE_HIGH_AROUSAL_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'joyful'),
    lemma: 'joyful',
    variants: ['joyous', 'joy', 'celebratory', 'jubilant', 'elated'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'positive',
      arousal: 'high',
      affects: ['mood', 'energy', 'character']
    },
    description: 'Expressing happiness and celebration',
    examples: [
      'make it more joyful',
      'joyous character',
      'celebratory feel'
    ],
    musicalContext: ['uplifting', 'celebration', 'major keys'],
    opposites: ['melancholy', 'somber', 'sad']
  },
  {
    id: createLexemeId('emotion', 'excited'),
    lemma: 'excited',
    variants: ['exciting', 'excitement', 'thrilling', 'exhilarating', 'energized'],
    category: 'adjective',
    semantics: {
      type: 'energy',
      valence: 'positive',
      arousal: 'high',
      affects: ['energy', 'tempo', 'density']
    },
    description: 'High energy with anticipation and engagement',
    examples: [
      'make it more excited',
      'exciting energy',
      'thrilling passage'
    ],
    musicalContext: ['uptempo', 'climax', 'build'],
    opposites: ['calm', 'subdued', 'peaceful']
  },
  {
    id: createLexemeId('emotion', 'euphoric'),
    lemma: 'euphoric',
    variants: ['euphoria', 'ecstatic', 'blissful', 'rapturous', 'elated'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'positive',
      arousal: 'high',
      affects: ['mood', 'intensity', 'lift']
    },
    description: 'Intense positive emotion and transcendence',
    examples: [
      'euphoric build',
      'ecstatic moment',
      'blissful peak'
    ],
    musicalContext: ['EDM', 'climax', 'drop', 'peak'],
    opposites: ['depressed', 'despondent', 'dejected']
  },
  {
    id: createLexemeId('emotion', 'playful'),
    lemma: 'playful',
    variants: ['playfulness', 'whimsical', 'lighthearted', 'fun', 'mischievous'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'positive',
      arousal: 'medium',
      affects: ['character', 'rhythm', 'articulation']
    },
    description: 'Light, fun, and energetically creative',
    examples: [
      'more playful',
      'whimsical character',
      'lighthearted feel'
    ],
    musicalContext: ['children', 'comedy', 'quirky'],
    opposites: ['serious', 'grave', 'solemn']
  },
  {
    id: createLexemeId('emotion', 'triumphant'),
    lemma: 'triumphant',
    variants: ['triumph', 'victorious', 'glorious', 'majestic', 'heroic'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'positive',
      arousal: 'high',
      affects: ['lift', 'power', 'grandeur']
    },
    description: 'Victorious and celebratory with grandeur',
    examples: [
      'triumphant fanfare',
      'victorious ending',
      'glorious climax'
    ],
    musicalContext: ['epic', 'orchestral', 'finale'],
    opposites: ['defeated', 'tragic', 'mournful']
  },
  {
    id: createLexemeId('emotion', 'passionate'),
    lemma: 'passionate',
    variants: ['passion', 'ardent', 'fervent', 'intense', 'fiery'],
    category: 'adjective',
    semantics: {
      type: 'expression',
      valence: 'positive',
      arousal: 'high',
      affects: ['intensity', 'expression', 'dynamics']
    },
    description: 'Intense emotional expression and commitment',
    examples: [
      'passionate performance',
      'ardent expression',
      'fiery intensity'
    ],
    musicalContext: ['romantic', 'flamenco', 'opera'],
    opposites: ['apathetic', 'indifferent', 'detached']
  }
];

// =============================================================================
// Positive Valence - Low Arousal (Calm Positive)
// =============================================================================

export const POSITIVE_LOW_AROUSAL_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'peaceful'),
    lemma: 'peaceful',
    variants: ['peace', 'tranquil', 'serene', 'placid', 'calm'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'positive',
      arousal: 'low',
      affects: ['mood', 'tempo', 'density']
    },
    description: 'Calm and tranquil without disturbance',
    examples: [
      'peaceful atmosphere',
      'serene mood',
      'tranquil passage'
    ],
    musicalContext: ['ambient', 'meditation', 'slow'],
    opposites: ['agitated', 'turbulent', 'chaotic']
  },
  {
    id: createLexemeId('emotion', 'content'),
    lemma: 'content',
    variants: ['contentment', 'satisfied', 'comfortable', 'at ease'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'positive',
      arousal: 'low',
      affects: ['mood', 'stability', 'warmth']
    },
    description: 'Satisfied and comfortable without urgency',
    examples: [
      'content feeling',
      'comfortable groove',
      'satisfied resolution'
    ],
    musicalContext: ['folk', 'acoustic', 'gentle'],
    opposites: ['restless', 'unsettled', 'anxious']
  },
  {
    id: createLexemeId('emotion', 'tender'),
    lemma: 'tender',
    variants: ['tenderness', 'gentle', 'delicate', 'soft', 'loving'],
    category: 'adjective',
    semantics: {
      type: 'expression',
      valence: 'positive',
      arousal: 'low',
      affects: ['dynamics', 'articulation', 'intimacy']
    },
    description: 'Gentle and emotionally intimate',
    examples: [
      'tender moment',
      'gentle touch',
      'loving expression'
    ],
    musicalContext: ['ballad', 'lullaby', 'intimate'],
    opposites: ['harsh', 'aggressive', 'violent']
  },
  {
    id: createLexemeId('emotion', 'hopeful'),
    lemma: 'hopeful',
    variants: ['hope', 'optimistic', 'uplifting', 'encouraging', 'promising'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'positive',
      arousal: 'medium',
      affects: ['mood', 'lift', 'brightness']
    },
    description: 'Optimistic with gentle forward momentum',
    examples: [
      'hopeful melody',
      'optimistic chord progression',
      'uplifting feeling'
    ],
    musicalContext: ['inspirational', 'major keys', 'resolution'],
    opposites: ['hopeless', 'despairing', 'pessimistic']
  },
  {
    id: createLexemeId('emotion', 'dreamy'),
    lemma: 'dreamy',
    variants: ['dreamlike', 'ethereal', 'floating', 'otherworldly', 'surreal'],
    category: 'adjective',
    semantics: {
      type: 'atmosphere',
      valence: 'positive',
      arousal: 'low',
      affects: ['texture', 'space', 'timbre']
    },
    description: 'Floating, ethereal quality',
    examples: [
      'dreamy atmosphere',
      'ethereal pads',
      'floating quality'
    ],
    musicalContext: ['ambient', 'shoegaze', 'dream pop'],
    opposites: ['grounded', 'concrete', 'stark']
  },
  {
    id: createLexemeId('emotion', 'nostalgic'),
    lemma: 'nostalgic',
    variants: ['nostalgia', 'wistful', 'longing', 'reminiscent', 'sentimental'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'mixed',
      arousal: 'low',
      affects: ['mood', 'warmth', 'character']
    },
    description: 'Bittersweet longing for the past',
    examples: [
      'nostalgic feeling',
      'wistful melody',
      'sentimental passage'
    ],
    musicalContext: ['ballad', 'folk', 'vintage'],
    opposites: ['forward-looking', 'modern', 'fresh']
  }
];

// =============================================================================
// Negative Valence - High Arousal (Energetic Negative)
// =============================================================================

export const NEGATIVE_HIGH_AROUSAL_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'aggressive'),
    lemma: 'aggressive',
    variants: ['aggression', 'violent', 'fierce', 'brutal', 'hostile'],
    category: 'adjective',
    semantics: {
      type: 'energy',
      valence: 'negative',
      arousal: 'high',
      affects: ['energy', 'distortion', 'dynamics']
    },
    description: 'Forceful and confrontational energy',
    examples: [
      'aggressive sound',
      'fierce attack',
      'brutal intensity'
    ],
    musicalContext: ['metal', 'hardcore', 'industrial'],
    opposites: ['gentle', 'tender', 'soft']
  },
  {
    id: createLexemeId('emotion', 'angry'),
    lemma: 'angry',
    variants: ['anger', 'furious', 'enraged', 'wrathful', 'irate'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'negative',
      arousal: 'high',
      affects: ['intensity', 'distortion', 'aggression']
    },
    description: 'Strong negative emotion with intensity',
    examples: [
      'angry tone',
      'furious energy',
      'wrathful expression'
    ],
    musicalContext: ['metal', 'punk', 'rap'],
    opposites: ['calm', 'peaceful', 'serene']
  },
  {
    id: createLexemeId('emotion', 'anxious'),
    lemma: 'anxious',
    variants: ['anxiety', 'nervous', 'tense', 'worried', 'uneasy'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'negative',
      arousal: 'high',
      affects: ['tension', 'instability', 'dissonance']
    },
    description: 'Nervous tension and unease',
    examples: [
      'anxious feeling',
      'nervous energy',
      'tense atmosphere'
    ],
    musicalContext: ['thriller', 'suspense', 'dissonant'],
    opposites: ['relaxed', 'calm', 'confident']
  },
  {
    id: createLexemeId('emotion', 'chaotic'),
    lemma: 'chaotic',
    variants: ['chaos', 'frantic', 'frenzied', 'turbulent', 'wild'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'negative',
      arousal: 'high',
      affects: ['density', 'disorder', 'complexity']
    },
    description: 'Disorganized high energy',
    examples: [
      'chaotic texture',
      'frantic energy',
      'turbulent section'
    ],
    musicalContext: ['experimental', 'noise', 'free jazz'],
    opposites: ['ordered', 'calm', 'structured']
  },
  {
    id: createLexemeId('emotion', 'menacing'),
    lemma: 'menacing',
    variants: ['menace', 'threatening', 'ominous', 'sinister', 'foreboding'],
    category: 'adjective',
    semantics: {
      type: 'atmosphere',
      valence: 'negative',
      arousal: 'medium',
      affects: ['tension', 'darkness', 'weight']
    },
    description: 'Threatening with implied danger',
    examples: [
      'menacing bass',
      'ominous atmosphere',
      'sinister character'
    ],
    musicalContext: ['horror', 'villain themes', 'dark'],
    opposites: ['welcoming', 'friendly', 'warm']
  },
  {
    id: createLexemeId('emotion', 'intense'),
    lemma: 'intense',
    variants: ['intensity', 'powerful', 'overwhelming', 'extreme', 'forceful'],
    category: 'adjective',
    semantics: {
      type: 'energy',
      valence: 'neutral',
      arousal: 'high',
      affects: ['dynamics', 'density', 'impact']
    },
    description: 'Extreme strength and concentration',
    examples: [
      'intense climax',
      'powerful dynamics',
      'overwhelming force'
    ],
    musicalContext: ['climax', 'peak', 'high energy'],
    opposites: ['subtle', 'understated', 'mild']
  }
];

// =============================================================================
// Negative Valence - Low Arousal (Calm Negative)
// =============================================================================

export const NEGATIVE_LOW_AROUSAL_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'sad'),
    lemma: 'sad',
    variants: ['sadness', 'sorrowful', 'mournful', 'melancholic', 'grieving'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'negative',
      arousal: 'low',
      affects: ['mood', 'tempo', 'harmony']
    },
    description: 'Deep sorrow and unhappiness',
    examples: [
      'sad melody',
      'sorrowful character',
      'mournful tone'
    ],
    musicalContext: ['ballad', 'minor keys', 'lament'],
    opposites: ['joyful', 'happy', 'cheerful']
  },
  {
    id: createLexemeId('emotion', 'melancholy'),
    lemma: 'melancholy',
    variants: ['melancholic', 'pensive', 'reflective', 'contemplative', 'wistful'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'negative',
      arousal: 'low',
      affects: ['mood', 'harmony', 'tempo']
    },
    description: 'Thoughtful sadness with beauty',
    examples: [
      'melancholy mood',
      'pensive character',
      'reflective passage'
    ],
    musicalContext: ['ballad', 'blues', 'jazz'],
    opposites: ['cheerful', 'upbeat', 'lively']
  },
  {
    id: createLexemeId('emotion', 'lonely'),
    lemma: 'lonely',
    variants: ['loneliness', 'isolated', 'alone', 'desolate', 'solitary'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'negative',
      arousal: 'low',
      affects: ['space', 'density', 'intimacy']
    },
    description: 'Sense of isolation and emptiness',
    examples: [
      'lonely melody',
      'isolated sound',
      'desolate atmosphere'
    ],
    musicalContext: ['sparse', 'minimal', 'ambient'],
    opposites: ['together', 'accompanied', 'connected']
  },
  {
    id: createLexemeId('emotion', 'somber'),
    lemma: 'somber',
    variants: ['grave', 'solemn', 'serious', 'sober', 'austere'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'negative',
      arousal: 'low',
      affects: ['mood', 'weight', 'darkness']
    },
    description: 'Dark and serious without lightness',
    examples: [
      'somber tone',
      'grave character',
      'solemn atmosphere'
    ],
    musicalContext: ['funeral', 'dirge', 'serious'],
    opposites: ['lighthearted', 'playful', 'cheerful']
  },
  {
    id: createLexemeId('emotion', 'haunting'),
    lemma: 'haunting',
    variants: ['haunted', 'eerie', 'ghostly', 'spectral', 'unsettling'],
    category: 'adjective',
    semantics: {
      type: 'atmosphere',
      valence: 'negative',
      arousal: 'low',
      affects: ['atmosphere', 'tension', 'eeriness']
    },
    description: 'Persistently disturbing beauty',
    examples: [
      'haunting melody',
      'eerie atmosphere',
      'ghostly quality'
    ],
    musicalContext: ['horror', 'gothic', 'ambient'],
    opposites: ['comforting', 'reassuring', 'warm']
  },
  {
    id: createLexemeId('emotion', 'empty'),
    lemma: 'empty',
    variants: ['emptiness', 'hollow', 'void', 'barren', 'vacant'],
    category: 'adjective',
    semantics: {
      type: 'atmosphere',
      valence: 'negative',
      arousal: 'low',
      affects: ['space', 'density', 'absence']
    },
    description: 'Sense of void and absence',
    examples: [
      'empty space',
      'hollow sound',
      'barren landscape'
    ],
    musicalContext: ['minimal', 'sparse', 'ambient'],
    opposites: ['full', 'rich', 'abundant']
  }
];

// =============================================================================
// Complex and Mixed Emotions
// =============================================================================

export const COMPLEX_EMOTION_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'bittersweet'),
    lemma: 'bittersweet',
    variants: ['bittersweetness', 'poignant', 'touching', 'moving'],
    category: 'adjective',
    semantics: {
      type: 'mood',
      valence: 'mixed',
      arousal: 'low',
      affects: ['mood', 'harmony', 'complexity']
    },
    description: 'Simultaneously happy and sad',
    examples: [
      'bittersweet ending',
      'poignant moment',
      'touching melody'
    ],
    musicalContext: ['ballad', 'soundtrack', 'resolution'],
    opposites: ['simple', 'straightforward', 'uncomplicated']
  },
  {
    id: createLexemeId('emotion', 'mysterious'),
    lemma: 'mysterious',
    variants: ['mystery', 'enigmatic', 'cryptic', 'obscure', 'puzzling'],
    category: 'adjective',
    semantics: {
      type: 'atmosphere',
      valence: 'neutral',
      arousal: 'medium',
      affects: ['harmony', 'texture', 'ambiguity']
    },
    description: 'Intriguing and hard to understand',
    examples: [
      'mysterious atmosphere',
      'enigmatic character',
      'cryptic harmony'
    ],
    musicalContext: ['ambient', 'film noir', 'experimental'],
    opposites: ['obvious', 'transparent', 'clear']
  },
  {
    id: createLexemeId('emotion', 'yearning'),
    lemma: 'yearning',
    variants: ['longing', 'craving', 'desire', 'pining', 'aching'],
    category: 'noun',
    semantics: {
      type: 'expression',
      valence: 'mixed',
      arousal: 'medium',
      affects: ['tension', 'suspension', 'desire']
    },
    description: 'Deep longing and unfulfilled desire',
    examples: [
      'yearning quality',
      'longing melody',
      'aching suspensions'
    ],
    musicalContext: ['romantic', 'ballad', 'suspensions'],
    opposites: ['satisfied', 'content', 'fulfilled']
  },
  {
    id: createLexemeId('emotion', 'dramatic'),
    lemma: 'dramatic',
    variants: ['drama', 'theatrical', 'striking', 'bold', 'vivid'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'neutral',
      arousal: 'high',
      affects: ['contrast', 'dynamics', 'gesture']
    },
    description: 'Striking and attention-grabbing',
    examples: [
      'dramatic gesture',
      'theatrical character',
      'bold contrast'
    ],
    musicalContext: ['opera', 'film score', 'theatrical'],
    opposites: ['subtle', 'understated', 'restrained']
  },
  {
    id: createLexemeId('emotion', 'sensual'),
    lemma: 'sensual',
    variants: ['sensuous', 'sultry', 'seductive', 'alluring', 'intimate'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'positive',
      arousal: 'medium',
      affects: ['timbre', 'groove', 'intimacy']
    },
    description: 'Appealing to physical senses',
    examples: [
      'sensual groove',
      'sultry tone',
      'seductive character'
    ],
    musicalContext: ['R&B', 'jazz', 'ballad'],
    opposites: ['cerebral', 'intellectual', 'austere']
  },
  {
    id: createLexemeId('emotion', 'epic'),
    lemma: 'epic',
    variants: ['grandiose', 'monumental', 'vast', 'majestic', 'sweeping'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'positive',
      arousal: 'high',
      affects: ['scale', 'grandeur', 'orchestration']
    },
    description: 'Large-scale and impressive',
    examples: [
      'epic scope',
      'grandiose arrangement',
      'sweeping melody'
    ],
    musicalContext: ['orchestral', 'film score', 'symphonic'],
    opposites: ['intimate', 'small-scale', 'minimal']
  }
];

// =============================================================================
// Energy and Movement Descriptors
// =============================================================================

export const ENERGY_MOVEMENT_LEXEMES: readonly EmotionalLexeme[] = [
  {
    id: createLexemeId('emotion', 'driving'),
    lemma: 'driving',
    variants: ['drive', 'propulsive', 'forward-moving', 'momentum'],
    category: 'adjective',
    semantics: {
      type: 'energy',
      valence: 'positive',
      arousal: 'high',
      affects: ['groove', 'momentum', 'forward-motion']
    },
    description: 'Strong forward momentum',
    examples: [
      'driving rhythm',
      'propulsive groove',
      'forward momentum'
    ],
    musicalContext: ['rock', 'techno', 'uptempo'],
    opposites: ['static', 'stagnant', 'still']
  },
  {
    id: createLexemeId('emotion', 'flowing'),
    lemma: 'flowing',
    variants: ['flow', 'fluid', 'smooth', 'continuous', 'seamless'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'neutral',
      arousal: 'medium',
      affects: ['phrasing', 'legato', 'connection']
    },
    description: 'Smooth continuous movement',
    examples: [
      'flowing melody',
      'fluid phrasing',
      'seamless transition'
    ],
    musicalContext: ['classical', 'ambient', 'legato'],
    opposites: ['choppy', 'disjointed', 'fragmented']
  },
  {
    id: createLexemeId('emotion', 'restless'),
    lemma: 'restless',
    variants: ['restlessness', 'unsettled', 'agitated', 'fidgety', 'unquiet'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'negative',
      arousal: 'medium',
      affects: ['rhythm', 'instability', 'motion']
    },
    description: 'Unable to settle or find peace',
    examples: [
      'restless rhythm',
      'unsettled feeling',
      'agitated character'
    ],
    musicalContext: ['contemporary', 'experimental', 'tense'],
    opposites: ['peaceful', 'settled', 'calm']
  },
  {
    id: createLexemeId('emotion', 'hypnotic'),
    lemma: 'hypnotic',
    variants: ['hypnotizing', 'mesmerizing', 'trance-like', 'repetitive'],
    category: 'adjective',
    semantics: {
      type: 'character',
      valence: 'neutral',
      arousal: 'medium',
      affects: ['repetition', 'ostinato', 'groove']
    },
    description: 'Entrancing through repetition',
    examples: [
      'hypnotic groove',
      'mesmerizing pattern',
      'trance-like repetition'
    ],
    musicalContext: ['trance', 'minimalism', 'groove'],
    opposites: ['varied', 'unpredictable', 'changing']
  }
];

// =============================================================================
// Combined Export
// =============================================================================

/**
 * All emotional and affective lexemes for Batch 24.
 */
export const BATCH_24_EMOTIONAL_AFFECTIVE: readonly EmotionalLexeme[] = [
  ...POSITIVE_HIGH_AROUSAL_LEXEMES,
  ...POSITIVE_LOW_AROUSAL_LEXEMES,
  ...NEGATIVE_HIGH_AROUSAL_LEXEMES,
  ...NEGATIVE_LOW_AROUSAL_LEXEMES,
  ...COMPLEX_EMOTION_LEXEMES,
  ...ENERGY_MOVEMENT_LEXEMES
];

/**
 * Count of lexemes in this batch.
 */
export const BATCH_24_COUNT = BATCH_24_EMOTIONAL_AFFECTIVE.length;

/**
 * Categories covered in this batch.
 */
export const BATCH_24_CATEGORIES = [
  'positive-high-arousal',
  'positive-low-arousal',
  'negative-high-arousal',
  'negative-low-arousal',
  'complex-emotions',
  'energy-movement'
] as const;
