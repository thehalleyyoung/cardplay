/**
 * GOFAI Canon — Domain Nouns Batch 19: Dynamics and Expression
 *
 * Comprehensive vocabulary for musical dynamics, expression markings,
 * articulation, and performance techniques. This batch systematically
 * enumerates the natural language terms musicians use to describe
 * volume, intensity, expression, and performance nuance.
 *
 * This is part of the extensive enumeration requirement from gofai_goalB.md
 * to build a 20000+ LoC vocabulary covering all natural ways musicians
 * communicate about music.
 *
 * @module gofai/canon/domain-nouns-batch19-dynamics-expression
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Dynamics-related lexeme.
 */
export interface DynamicsLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective';
  readonly semantics: {
    readonly type: 'dynamics' | 'expression' | 'articulation';
    readonly relativeVolume?: number; // -1 to 1, relative to current
    readonly expressionType?: string;
    readonly affects: readonly string[]; // What aspects this affects
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Core Dynamics Terms (Volume Levels)
// =============================================================================

export const DYNAMICS_CORE_LEXEMES: readonly DynamicsLexeme[] = [
  {
    id: createLexemeId('dyn', 'pianissimo'),
    lemma: 'pianissimo',
    variants: ['very soft', 'very quiet', 'pp', 'ppp'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: -0.8,
      affects: ['volume', 'intensity', 'presence'],
    },
    description: 'Very soft dynamic level',
    examples: [
      'make the intro pianissimo',
      'the strings should be very soft here',
      'bring it down to pp',
    ],
    musicalContext: ['classical', 'orchestral', 'chamber music'],
  },
  {
    id: createLexemeId('dyn', 'piano'),
    lemma: 'piano',
    variants: ['soft', 'quiet', 'gentle', 'p'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: -0.4,
      affects: ['volume', 'intensity'],
    },
    description: 'Soft dynamic level',
    examples: [
      'make it piano',
      'the verse should be soft',
      'keep the background quiet',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dyn', 'mezzo-piano'),
    lemma: 'mezzo piano',
    variants: ['moderately soft', 'mp'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: -0.2,
      affects: ['volume', 'intensity'],
    },
    description: 'Moderately soft dynamic level',
    examples: [
      'bring it down to mezzo piano',
      'moderately soft for the bridge',
    ],
    musicalContext: ['classical', 'jazz', 'contemporary'],
  },
  {
    id: createLexemeId('dyn', 'mezzo-forte'),
    lemma: 'mezzo forte',
    variants: ['moderately loud', 'mf'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: 0.2,
      affects: ['volume', 'intensity'],
    },
    description: 'Moderately loud dynamic level',
    examples: [
      'bring it up to mezzo forte',
      'moderately loud for the pre-chorus',
    ],
    musicalContext: ['classical', 'jazz'],
  },
  {
    id: createLexemeId('dyn', 'forte'),
    lemma: 'forte',
    variants: ['loud', 'strong', 'powerful', 'f'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: 0.4,
      affects: ['volume', 'intensity', 'presence'],
    },
    description: 'Loud dynamic level',
    examples: [
      'make the chorus forte',
      'bring it up loud',
      'the drop should be powerful',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dyn', 'fortissimo'),
    lemma: 'fortissimo',
    variants: ['very loud', 'ff', 'fff'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      relativeVolume: 0.8,
      affects: ['volume', 'intensity', 'presence', 'impact'],
    },
    description: 'Very loud dynamic level',
    examples: [
      'make the climax fortissimo',
      'bring it to very loud',
      'fff for the final chorus',
    ],
    musicalContext: ['classical', 'rock', 'metal', 'cinematic'],
  },

  // =============================================================================
  // Dynamic Changes (Gradual Transitions)
  // =============================================================================

  {
    id: createLexemeId('dyn', 'crescendo'),
    lemma: 'crescendo',
    variants: ['cresc', 'building', 'growing', 'rising', 'swelling', 'getting louder'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      expressionType: 'gradual_increase',
      affects: ['volume', 'intensity', 'tension', 'energy'],
    },
    description: 'Gradual increase in volume',
    examples: [
      'add a crescendo leading to the chorus',
      'make it build gradually',
      'the strings should swell here',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dyn', 'decrescendo'),
    lemma: 'decrescendo',
    variants: ['decresc', 'diminuendo', 'dim', 'fading', 'dying away', 'getting softer'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      expressionType: 'gradual_decrease',
      affects: ['volume', 'intensity', 'tension'],
    },
    description: 'Gradual decrease in volume',
    examples: [
      'add a decrescendo at the end',
      'make it fade gradually',
      'diminuendo into the verse',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dyn', 'swell'),
    lemma: 'swell',
    variants: ['bulge', 'wave', 'dynamic arch'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      expressionType: 'swell',
      affects: ['volume', 'intensity', 'expression'],
    },
    description: 'Crescendo followed by decrescendo',
    examples: [
      'add a swell on the sustained note',
      'make it bulge in the middle',
    ],
    musicalContext: ['orchestral', 'ambient', 'cinematic'],
  },

  // =============================================================================
  // Sudden Dynamic Changes
  // =============================================================================

  {
    id: createLexemeId('dyn', 'accent'),
    lemma: 'accent',
    variants: ['accented', 'emphasized', 'stressed', 'punch'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'accent',
      affects: ['attack', 'volume', 'emphasis'],
    },
    description: 'Emphasis on a note or chord',
    examples: [
      'accent the downbeats',
      'add emphasis on beat 2',
      'punch those notes',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dyn', 'sforzando'),
    lemma: 'sforzando',
    variants: ['sfz', 'sudden accent', 'forced accent'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'sforzando',
      affects: ['attack', 'volume', 'surprise'],
    },
    description: 'Sudden strong accent',
    examples: [
      'add sforzando on that chord',
      'make it a sudden accent',
    ],
    musicalContext: ['classical', 'jazz', 'rock'],
  },
  {
    id: createLexemeId('dyn', 'subito'),
    lemma: 'subito',
    variants: ['suddenly', 'immediately', 'sudden change'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      expressionType: 'sudden_change',
      affects: ['volume', 'surprise', 'contrast'],
    },
    description: 'Sudden change in dynamics',
    examples: [
      'subito piano after the climax',
      'drop suddenly to quiet',
      'immediate change in volume',
    ],
    musicalContext: ['classical', 'contemporary'],
  },
  {
    id: createLexemeId('dyn', 'fortepiano'),
    lemma: 'fortepiano',
    variants: ['fp', 'loud then soft', 'attack then decay'],
    category: 'noun',
    semantics: {
      type: 'dynamics',
      expressionType: 'fortepiano',
      affects: ['attack', 'decay', 'dynamics'],
    },
    description: 'Loud attack followed immediately by soft',
    examples: [
      'use fortepiano articulation',
      'loud attack then soft sustain',
    ],
    musicalContext: ['classical', 'orchestral'],
  },

  // =============================================================================
  // Expression and Character Terms
  // =============================================================================

  {
    id: createLexemeId('expr', 'legato'),
    lemma: 'legato',
    variants: ['smooth', 'connected', 'flowing', 'seamless'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'legato',
      affects: ['articulation', 'smoothness', 'connection'],
    },
    description: 'Smooth and connected',
    examples: [
      'make the melody legato',
      'play it smooth and connected',
      'flowing strings',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('expr', 'staccato'),
    lemma: 'staccato',
    variants: ['short', 'detached', 'choppy', 'separated', 'bouncy'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'staccato',
      affects: ['articulation', 'duration', 'separation'],
    },
    description: 'Short and detached',
    examples: [
      'make the piano staccato',
      'play it short and bouncy',
      'detached notes',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('expr', 'tenuto'),
    lemma: 'tenuto',
    variants: ['held', 'sustained', 'full value'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'tenuto',
      affects: ['duration', 'weight', 'sustain'],
    },
    description: 'Held for full value with slight emphasis',
    examples: [
      'make those notes tenuto',
      'hold for full value',
      'sustained and weighted',
    ],
    musicalContext: ['classical', 'jazz'],
  },
  {
    id: createLexemeId('expr', 'marcato'),
    lemma: 'marcato',
    variants: ['marked', 'well-defined', 'distinct', 'separated with emphasis'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'marcato',
      affects: ['articulation', 'attack', 'definition'],
    },
    description: 'Marked and well-defined',
    examples: [
      'make the bass marcato',
      'well-defined attacks',
      'distinct and separated',
    ],
    musicalContext: ['classical', 'contemporary'],
  },
  {
    id: createLexemeId('expr', 'portato'),
    lemma: 'portato',
    variants: ['mezzo staccato', 'half-staccato', 'slightly detached'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'portato',
      affects: ['articulation', 'separation'],
    },
    description: 'Slightly detached but not full staccato',
    examples: [
      'use portato articulation',
      'slightly separated notes',
      'mezzo staccato feel',
    ],
    musicalContext: ['classical', 'orchestral'],
  },

  // =============================================================================
  // Expression Words (Character and Mood)
  // =============================================================================

  {
    id: createLexemeId('expr', 'espressivo'),
    lemma: 'espressivo',
    variants: ['expressive', 'with expression', 'expressively'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'espressivo',
      affects: ['dynamics', 'phrasing', 'emotion'],
    },
    description: 'With expression',
    examples: [
      'play it espressivo',
      'add more expression',
      'make it expressive',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('expr', 'dolce'),
    lemma: 'dolce',
    variants: ['sweetly', 'gently', 'sweet', 'tender'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'dolce',
      affects: ['tone', 'softness', 'emotion'],
    },
    description: 'Sweetly and gently',
    examples: [
      'make the melody dolce',
      'play it sweetly',
      'gentle and tender',
    ],
    musicalContext: ['classical', 'romantic'],
  },
  {
    id: createLexemeId('expr', 'cantabile'),
    lemma: 'cantabile',
    variants: ['singing', 'singingly', 'lyrical', 'song-like'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'cantabile',
      affects: ['phrasing', 'flow', 'lyricism'],
    },
    description: 'In a singing style',
    examples: [
      'make the strings cantabile',
      'play it like singing',
      'lyrical phrasing',
    ],
    musicalContext: ['classical', 'romantic'],
  },
  {
    id: createLexemeId('expr', 'con-fuoco'),
    lemma: 'con fuoco',
    variants: ['with fire', 'fiery', 'passionate', 'energetic'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'con_fuoco',
      affects: ['energy', 'intensity', 'passion'],
    },
    description: 'With fire and energy',
    examples: [
      'play the climax con fuoco',
      'make it fiery',
      'passionate and energetic',
    ],
    musicalContext: ['classical', 'romantic'],
  },
  {
    id: createLexemeId('expr', 'con-brio'),
    lemma: 'con brio',
    variants: ['with vigor', 'lively', 'spirited', 'with spirit'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'con_brio',
      affects: ['energy', 'liveliness', 'spirit'],
    },
    description: 'With vigor and spirit',
    examples: [
      'play it con brio',
      'make it lively and spirited',
      'with vigor',
    ],
    musicalContext: ['classical'],
  },
  {
    id: createLexemeId('expr', 'agitato'),
    lemma: 'agitato',
    variants: ['agitated', 'restless', 'anxious', 'turbulent'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'agitato',
      affects: ['tension', 'restlessness', 'intensity'],
    },
    description: 'In an agitated manner',
    examples: [
      'make the section agitato',
      'play it restlessly',
      'anxious and turbulent',
    ],
    musicalContext: ['classical', 'contemporary'],
  },
  {
    id: createLexemeId('expr', 'tranquillo'),
    lemma: 'tranquillo',
    variants: ['tranquil', 'calm', 'peaceful', 'serene'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'tranquillo',
      affects: ['calmness', 'peace', 'relaxation'],
    },
    description: 'In a calm manner',
    examples: [
      'make the outro tranquillo',
      'calm and peaceful',
      'serene atmosphere',
    ],
    musicalContext: ['classical', 'ambient'],
  },

  // =============================================================================
  // Attack and Articulation Details
  // =============================================================================

  {
    id: createLexemeId('art', 'martele'),
    lemma: 'martelé',
    variants: ['hammered', 'percussive attack', 'struck'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'martele',
      affects: ['attack', 'percussion', 'definition'],
    },
    description: 'Hammered, percussive attack (string technique)',
    examples: [
      'use martelé bowing',
      'hammered attack',
      'percussive string sound',
    ],
    musicalContext: ['orchestral', 'strings'],
  },
  {
    id: createLexemeId('art', 'spiccato'),
    lemma: 'spiccato',
    variants: ['bouncing bow', 'off-string', 'bounced'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'spiccato',
      affects: ['articulation', 'lightness', 'bounce'],
    },
    description: 'Bouncing bow technique',
    examples: [
      'use spiccato for the fast passage',
      'bouncing bow articulation',
      'light and bouncy',
    ],
    musicalContext: ['orchestral', 'strings'],
  },
  {
    id: createLexemeId('art', 'pizzicato'),
    lemma: 'pizzicato',
    variants: ['plucked', 'pizz', 'pluck'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'pizzicato',
      affects: ['attack', 'tone', 'decay'],
    },
    description: 'Plucked string technique',
    examples: [
      'make the strings pizzicato',
      'pluck instead of bow',
      'pizz for the accompaniment',
    ],
    musicalContext: ['orchestral', 'strings'],
  },
  {
    id: createLexemeId('art', 'col-legno'),
    lemma: 'col legno',
    variants: ['with the wood', 'bow stick', 'percussive bow'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'col_legno',
      affects: ['timbre', 'attack', 'percussion'],
    },
    description: 'Striking with the wooden part of the bow',
    examples: [
      'use col legno for eerie effect',
      'strike with the wood',
      'percussive bow technique',
    ],
    musicalContext: ['orchestral', 'contemporary'],
  },
  {
    id: createLexemeId('art', 'sul-ponticello'),
    lemma: 'sul ponticello',
    variants: ['near the bridge', 'on bridge', 'glassy tone'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'sul_ponticello',
      affects: ['timbre', 'brightness', 'metallic'],
    },
    description: 'Bowing near the bridge for glassy tone',
    examples: [
      'add sul ponticello for tension',
      'bow near the bridge',
      'glassy, metallic sound',
    ],
    musicalContext: ['orchestral', 'contemporary'],
  },
  {
    id: createLexemeId('art', 'sul-tasto'),
    lemma: 'sul tasto',
    variants: ['over fingerboard', 'flautando', 'flute-like'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'sul_tasto',
      affects: ['timbre', 'softness', 'darkness'],
    },
    description: 'Bowing over the fingerboard for soft, flute-like tone',
    examples: [
      'make it sul tasto',
      'bow over the fingerboard',
      'soft and dark',
    ],
    musicalContext: ['orchestral', 'impressionist'],
  },

  // =============================================================================
  // Wind and Brass Articulations
  // =============================================================================

  {
    id: createLexemeId('art', 'tongue'),
    lemma: 'tongued',
    variants: ['articulated', 'single tongue', 'clean attack'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'tongue',
      affects: ['attack', 'clarity', 'definition'],
    },
    description: 'Standard articulated attack for wind instruments',
    examples: [
      'make the notes cleanly tongued',
      'articulate clearly',
      'single tongue each note',
    ],
    musicalContext: ['wind', 'brass'],
  },
  {
    id: createLexemeId('art', 'double-tongue'),
    lemma: 'double tongue',
    variants: ['rapid articulation', 'fast tongue'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'double_tongue',
      affects: ['speed', 'articulation', 'clarity'],
    },
    description: 'Fast articulation technique for wind instruments',
    examples: [
      'use double tonguing for the fast runs',
      'rapid articulation needed',
    ],
    musicalContext: ['wind', 'brass'],
  },
  {
    id: createLexemeId('art', 'flutter-tongue'),
    lemma: 'flutter tongue',
    variants: ['fluttertongue', 'rolled tongue', 'tremolo tongue'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'flutter_tongue',
      affects: ['texture', 'tremolo', 'effect'],
    },
    description: 'Rolling tongue effect',
    examples: [
      'add flutter tongue for texture',
      'use rolled tongue',
      'tremolo effect',
    ],
    musicalContext: ['wind', 'brass', 'contemporary'],
  },
  {
    id: createLexemeId('art', 'breath-accent'),
    lemma: 'breath accent',
    variants: ['air accent', 'breath emphasis', 'breath attack'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      expressionType: 'breath_accent',
      affects: ['attack', 'air', 'softness'],
    },
    description: 'Soft attack with audible breath',
    examples: [
      'use breath accent for gentle attack',
      'soft with audible air',
    ],
    musicalContext: ['wind', 'flute'],
  },

  // =============================================================================
  // Performance Intensity Modifiers
  // =============================================================================

  {
    id: createLexemeId('perf', 'pesante'),
    lemma: 'pesante',
    variants: ['heavy', 'weighty', 'ponderous'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'pesante',
      affects: ['weight', 'heaviness', 'gravity'],
    },
    description: 'Heavy and weighty',
    examples: [
      'play it pesante',
      'heavy and ponderous',
      'with weight',
    ],
    musicalContext: ['classical', 'orchestral'],
  },
  {
    id: createLexemeId('perf', 'leggiero'),
    lemma: 'leggiero',
    variants: ['light', 'lightly', 'delicate', 'airy'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'leggiero',
      affects: ['lightness', 'delicacy', 'airiness'],
    },
    description: 'Light and delicate',
    examples: [
      'make the accompaniment leggiero',
      'play it lightly',
      'delicate and airy',
    ],
    musicalContext: ['classical', 'impressionist'],
  },
  {
    id: createLexemeId('perf', 'grazioso'),
    lemma: 'grazioso',
    variants: ['gracefully', 'gracious', 'elegant'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'grazioso',
      affects: ['grace', 'elegance', 'refinement'],
    },
    description: 'Gracefully and elegantly',
    examples: [
      'play the melody grazioso',
      'graceful phrasing',
      'elegant and refined',
    ],
    musicalContext: ['classical'],
  },
  {
    id: createLexemeId('perf', 'maestoso'),
    lemma: 'maestoso',
    variants: ['majestically', 'majestic', 'stately', 'grand'],
    category: 'noun',
    semantics: {
      type: 'expression',
      expressionType: 'maestoso',
      affects: ['grandness', 'majesty', 'dignity'],
    },
    description: 'Majestically and grandly',
    examples: [
      'make the climax maestoso',
      'play it majestically',
      'grand and stately',
    ],
    musicalContext: ['classical', 'cinematic'],
  },
];

// =============================================================================
// Exports
// =============================================================================

/**
 * All dynamics and expression lexemes in this batch.
 */
export const DYNAMICS_EXPRESSION_LEXEMES: readonly DynamicsLexeme[] = [
  ...DYNAMICS_CORE_LEXEMES,
];

/**
 * Count of lexemes in this batch.
 */
export const DYNAMICS_EXPRESSION_LEXEME_COUNT = DYNAMICS_EXPRESSION_LEXEMES.length;
