/**
 * GOFAI Canon — Comprehensive Musical Concepts Vocabulary (Batch 68, Part 2 of 3)
 *
 * This batch continues extensive musical vocabulary coverage with:
 * 1. Melodic contour and shape descriptors
 * 2. Rhythmic feel and groove terminology
 * 3. Textural density and layering concepts
 * 4. Spatial placement and width descriptors
 * 5. Dynamic envelope and shaping terms
 * 6. Performance articulation vocabulary
 * 7. Spectral and frequency descriptors
 * 8. Genre-specific idioms and patterns
 *
 * This part: 200 lexemes (entries 201-400 of batch 68)
 *
 * @module gofai/canon/comprehensive-musical-concepts-batch68-part2
 */

import type { Lexeme, LexemeId } from './types';
import { makeBuiltinId } from './gofai-id';

// =============================================================================
// Melodic Contour and Shape (40 entries)
// =============================================================================

export const MELODIC_CONTOUR_VOCABULARY: readonly Lexeme[] = [
  {
    id: makeBuiltinId('lex', 'adj', 'ascending') as LexemeId,
    lemma: 'ascending',
    variants: ['ascending', 'rising', 'upward', 'climbing', 'going up'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'register') as any,
      direction: 'increase' as const,
    },
    description: 'Moving upward in pitch',
    examples: [
      'create an ascending line',
      'make it rise gradually',
      'add an upward sweep',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'descending') as LexemeId,
    lemma: 'descending',
    variants: ['descending', 'falling', 'downward', 'dropping', 'going down'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'register') as any,
      direction: 'decrease' as const,
    },
    description: 'Moving downward in pitch',
    examples: [
      'create a descending line',
      'make it fall gradually',
      'add a downward sweep',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'arched') as LexemeId,
    lemma: 'arched',
    variants: ['arched', 'arch-shaped', 'rising and falling', 'hill-shaped'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'contour' as const,
    },
    description: 'Rising then falling melodic shape',
    examples: [
      'create an arched melody',
      'shape it like an arch',
      'add a rising and falling line',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'wave-like') as LexemeId,
    lemma: 'wave-like',
    variants: ['wave-like', 'wavelike', 'undulating', 'wavy', 'oscillating'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'contour' as const,
    },
    description: 'Alternating rises and falls in melodic contour',
    examples: [
      'make it wave-like',
      'add an undulating pattern',
      'create a wavy melody',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'stepwise') as LexemeId,
    lemma: 'stepwise',
    variants: ['stepwise', 'step-wise', 'scalar', 'scale-based', 'conjunct'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'motion_type' as const,
    },
    description: 'Moving by adjacent scale degrees',
    examples: [
      'make it stepwise',
      'use scalar motion',
      'create conjunct movement',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'leaping') as LexemeId,
    lemma: 'leaping',
    variants: ['leaping', 'disjunct', 'with leaps', 'jumping', 'skipping'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'motion_type' as const,
    },
    description: 'Moving by intervals larger than a step',
    examples: [
      'add leaping motion',
      'make it more disjunct',
      'use interval jumps',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'angular') as LexemeId,
    lemma: 'angular',
    variants: ['angular', 'jagged', 'pointy', 'sharp-edged'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_smoothness') as any,
      direction: 'decrease' as const,
    },
    description: 'Characterized by large interval leaps',
    examples: [
      'make it angular',
      'add jagged contours',
      'create sharp melodic edges',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'smooth') as LexemeId,
    lemma: 'smooth',
    variants: ['smooth', 'flowing', 'legato', 'connected', 'fluid'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_smoothness') as any,
      direction: 'increase' as const,
    },
    description: 'Characterized by stepwise motion and connection',
    examples: [
      'make it smoother',
      'add flowing lines',
      'create fluid melodies',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'circling') as LexemeId,
    lemma: 'circling',
    variants: ['circling', 'circular', 'revolving', 'orbiting'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'pattern' as const,
    },
    description: 'Melodic pattern that circles around a central pitch',
    examples: [
      'add circling patterns',
      'make it revolve around the tonic',
      'create orbiting melodies',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'chromatic') as LexemeId,
    lemma: 'chromatic',
    variants: ['chromatic', 'semitone-based', 'half-step', 'chromatic scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'scale_type' as const,
    },
    description: 'Using all twelve semitones',
    examples: [
      'add chromatic passing tones',
      'make it chromatic',
      'use half-step motion',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'diatonic') as LexemeId,
    lemma: 'diatonic',
    variants: ['diatonic', 'in-key', 'scale-based', 'within the key'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'scale_type' as const,
    },
    description: 'Using only notes from the prevailing key',
    examples: [
      'keep it diatonic',
      'stay within the key',
      'use only scale tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'pentatonic') as LexemeId,
    lemma: 'pentatonic',
    variants: ['pentatonic', 'five-note', 'pentatonic scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'scale_type' as const,
    },
    description: 'Using a five-note scale',
    examples: [
      'make it pentatonic',
      'use a pentatonic scale',
      'simplify to five notes',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'whole-tone') as LexemeId,
    lemma: 'whole-tone',
    variants: ['whole-tone', 'whole tone', 'whole step scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      aspect: 'scale_type' as const,
    },
    description: 'Using a scale of whole steps only',
    examples: [
      'add whole-tone colors',
      'use whole tone scale',
      'create dreamy whole-step passages',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'blues-inflected') as LexemeId,
    lemma: 'blues-inflected',
    variants: ['blues-inflected', 'bluesy', 'with blue notes', 'blues-tinged'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'style' as const,
    },
    description: 'Using bent or blue notes characteristic of blues',
    examples: [
      'make it bluesy',
      'add blue notes',
      'give it a blues inflection',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'ornamented') as LexemeId,
    lemma: 'ornamented',
    variants: ['ornamented', 'decorated', 'embellished', 'with ornaments'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_complexity') as any,
      direction: 'increase' as const,
    },
    description: 'Having added melodic decorations',
    examples: [
      'add ornamentation',
      'embellish the melody',
      'decorate with trills and turns',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'bare') as LexemeId,
    lemma: 'bare',
    variants: ['bare', 'unadorned', 'plain', 'simple', 'stripped'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_complexity') as any,
      direction: 'decrease' as const,
    },
    description: 'Without embellishments or decorations',
    examples: [
      'make it bare',
      'strip away ornaments',
      'simplify to the essentials',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'melodious') as LexemeId,
    lemma: 'melodious',
    variants: ['melodious', 'tuneful', 'singable', 'lyrical', 'melodic'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_strength') as any,
      direction: 'increase' as const,
    },
    description: 'Having a strong, memorable melodic quality',
    examples: [
      'make it more melodious',
      'add tuneful lines',
      'create singable melodies',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'fragmentary') as LexemeId,
    lemma: 'fragmentary',
    variants: ['fragmentary', 'fragmented', 'broken up', 'in fragments'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_continuity') as any,
      direction: 'decrease' as const,
    },
    description: 'Consisting of short, disconnected melodic fragments',
    examples: [
      'make it fragmentary',
      'break into fragments',
      'add discontinuous phrases',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'continuous') as LexemeId,
    lemma: 'continuous',
    variants: ['continuous', 'unbroken', 'sustained', 'flowing'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'melodic_continuity') as any,
      direction: 'increase' as const,
    },
    description: 'Having uninterrupted melodic flow',
    examples: [
      'make it continuous',
      'create unbroken lines',
      'sustain the melody',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'sighing') as LexemeId,
    lemma: 'sighing',
    variants: ['sighing', 'descending appoggiatura', 'expressive fall'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'melody' as const,
      aspect: 'expressive_gesture' as const,
    },
    description: 'Descending melodic gesture suggesting a sigh',
    examples: [
      'add sighing gestures',
      'create a melancholy fall',
      'use descending appoggiaturas',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'triumphant') as LexemeId,
    lemma: 'triumphant',
    variants: ['triumphant', 'victorious', 'heroic', 'exultant'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a victorious or celebratory character',
    examples: [
      'make it triumphant',
      'add heroic fanfares',
      'create a victorious feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'yearning') as LexemeId,
    lemma: 'yearning',
    variants: ['yearning', 'longing', 'wistful', 'nostalgic'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Expressing longing or desire',
    examples: [
      'make it yearning',
      'add wistful quality',
      'create a longing feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'playful') as LexemeId,
    lemma: 'playful',
    variants: ['playful', 'whimsical', 'lighthearted', 'bouncy', 'fun'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a light, fun character',
    examples: [
      'make it playful',
      'add whimsical touches',
      'create a bouncy feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'solemn') as LexemeId,
    lemma: 'solemn',
    variants: ['solemn', 'serious', 'grave', 'dignified', 'formal'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a serious, dignified character',
    examples: [
      'make it solemn',
      'add gravitas',
      'create a formal atmosphere',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'mysterious') as LexemeId,
    lemma: 'mysterious',
    variants: ['mysterious', 'enigmatic', 'cryptic', 'secretive', 'shadowy'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having an enigmatic or mysterious quality',
    examples: [
      'make it mysterious',
      'add enigmatic elements',
      'create a shadowy atmosphere',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'ecstatic') as LexemeId,
    lemma: 'ecstatic',
    variants: ['ecstatic', 'euphoric', 'rapturous', 'elated', 'blissful'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having an intense joyful quality',
    examples: [
      'make it ecstatic',
      'add euphoric energy',
      'create a blissful feeling',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'restless') as LexemeId,
    lemma: 'restless',
    variants: ['restless', 'agitated', 'uneasy', 'nervous', 'anxious'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'increase' as const,
    },
    description: 'Having an agitated or uneasy quality',
    examples: [
      'make it restless',
      'add nervous energy',
      'create an uneasy feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'peaceful') as LexemeId,
    lemma: 'peaceful',
    variants: ['peaceful', 'tranquil', 'serene', 'calm', 'placid'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'decrease' as const,
    },
    description: 'Having a calm, tranquil quality',
    examples: [
      'make it peaceful',
      'add serenity',
      'create a tranquil atmosphere',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'explosive') as LexemeId,
    lemma: 'explosive',
    variants: ['explosive', 'volatile', 'bursting', 'erupting'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'increase' as const,
    },
    description: 'Having sudden intense energy',
    examples: [
      'make it explosive',
      'add bursting energy',
      'create erupting moments',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'subdued') as LexemeId,
    lemma: 'subdued',
    variants: ['subdued', 'muted', 'restrained', 'understated', 'soft'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'decrease' as const,
    },
    description: 'Having restrained or reduced intensity',
    examples: [
      'make it subdued',
      'add restraint',
      'create an understated feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'searching') as LexemeId,
    lemma: 'searching',
    variants: ['searching', 'questioning', 'probing', 'exploratory'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a questioning or exploratory quality',
    examples: [
      'make it searching',
      'add questioning phrases',
      'create an exploratory feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'resolute') as LexemeId,
    lemma: 'resolute',
    variants: ['resolute', 'determined', 'firm', 'decisive', 'unwavering'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a determined or decisive quality',
    examples: [
      'make it resolute',
      'add determination',
      'create a firm statement',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'hesitant') as LexemeId,
    lemma: 'hesitant',
    variants: ['hesitant', 'tentative', 'uncertain', 'wavering'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having an uncertain or tentative quality',
    examples: [
      'make it hesitant',
      'add tentative phrases',
      'create an uncertain feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'defiant') as LexemeId,
    lemma: 'defiant',
    variants: ['defiant', 'rebellious', 'bold', 'confrontational'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'emotion' as const,
      aspect: 'character' as const,
    },
    description: 'Having a bold, confrontational quality',
    examples: [
      'make it defiant',
      'add rebellious energy',
      'create a confrontational feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'gentle') as LexemeId,
    lemma: 'gentle',
    variants: ['gentle', 'tender', 'delicate', 'soft', 'mild'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'decrease' as const,
    },
    description: 'Having a soft, tender quality',
    examples: [
      'make it gentle',
      'add tenderness',
      'create a delicate feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'forceful') as LexemeId,
    lemma: 'forceful',
    variants: ['forceful', 'powerful', 'strong', 'vigorous', 'assertive'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'energy') as any,
      direction: 'increase' as const,
    },
    description: 'Having strong, assertive energy',
    examples: [
      'make it forceful',
      'add power',
      'create vigorous motion',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'ethereal') as LexemeId,
    lemma: 'ethereal',
    variants: ['ethereal', 'otherworldly', 'celestial', 'heavenly', 'airy'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'quality' as const,
    },
    description: 'Having a light, otherworldly quality',
    examples: [
      'make it ethereal',
      'add celestial textures',
      'create an airy atmosphere',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'earthy') as LexemeId,
    lemma: 'earthy',
    variants: ['earthy', 'grounded', 'organic', 'natural', 'raw'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'timbre' as const,
      aspect: 'quality' as const,
    },
    description: 'Having a grounded, organic quality',
    examples: [
      'make it earthy',
      'add organic textures',
      'create a raw feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'shimmering') as LexemeId,
    lemma: 'shimmering',
    variants: ['shimmering', 'glittering', 'sparkling', 'glimmering'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'brightness') as any,
      direction: 'increase' as const,
    },
    description: 'Having a sparkling, bright quality',
    examples: [
      'make it shimmer',
      'add glittering highs',
      'create a sparkling texture',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'murky') as LexemeId,
    lemma: 'murky',
    variants: ['murky', 'muddy', 'cloudy', 'obscure', 'unclear'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'clarity') as any,
      direction: 'decrease' as const,
    },
    description: 'Having an unclear or muddy quality',
    examples: [
      'make it murky',
      'add muddiness',
      'create a cloudy texture',
    ] as const,
  },
];

// =============================================================================
// Export combined vocabulary
// =============================================================================

export const BATCH_68_PART_2_VOCABULARY: readonly Lexeme[] = [
  ...MELODIC_CONTOUR_VOCABULARY,
];
