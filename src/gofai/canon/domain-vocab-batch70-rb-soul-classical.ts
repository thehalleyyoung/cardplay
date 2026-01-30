/**
 * GOFAI Domain Vocabulary - Batch 70: R&B/Soul and Classical Styles
 * 
 * This batch covers:
 * - R&B and Soul grooves and characteristics
 * - Classical music forms and techniques
 * - Orchestral textures and dynamics
 * - Sophisticated harmonic vocabulary
 * 
 * Part of systematic vocabulary expansion for natural language understanding
 * of diverse musical styles.
 * 
 * @module gofai/canon/domain-vocab-batch70-rb-soul-classical
 */

import { createLexemeId, type Lexeme } from './types';

// =============================================================================
// R&B and Soul Vocabulary (20 entries)
// =============================================================================

export const RB_SOUL_LEXEMES: readonly Lexeme[] = [
  // Groove characteristics
  {
    id: createLexemeId('adj', 'soulful'),
    lemma: 'soulful',
    category: 'adj',
    variants: ['soul-like', 'souled'],
    semantics: {
      type: 'axis_modifier',
      axis: 'emotional_expressiveness',
      direction: 'increase',
    },
    examples: [
      'make it soulful',
      'add soulful expression',
      'more soulful vocals',
    ],
  },
  
  {
    id: createLexemeId('adj', 'smooth-rb'),
    lemma: 'smooth',
    category: 'adj',
    variants: ['silky', 'sultry'],
    semantics: {
      type: 'axis_modifier',
      axis: 'smoothness',
      direction: 'increase',
    },
    examples: [
      'make it smooth r&b',
      'add smooth vibes',
      'sultry groove',
    ],
  },
  
  {
    id: createLexemeId('noun', 'gospel-feel'),
    lemma: 'gospel',
    category: 'noun',
    variants: ['gospel-feel', 'churchy'],
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'gospel_influences',
    },
    examples: [
      'add gospel feel',
      'make it churchy',
      'gospel-style harmonies',
    ],
  },
  
  {
    id: createLexemeId('verb', 'pocket'),
    lemma: 'pocket',
    category: 'verb',
    variants: ['in-the-pocket', 'locked-in'],
    semantics: {
      type: 'action',
      category: 'rhythm',
      operation: 'tighten_groove',
    },
    examples: [
      'keep it in the pocket',
      'lock in the groove',
      'stay pocketed',
    ],
  },
  
  {
    id: createLexemeId('noun', 'rhodes'),
    lemma: 'rhodes',
    category: 'noun',
    variants: ['fender-rhodes', 'electric-piano'],
    semantics: {
      type: 'entity',
      entityType: 'instrument',
      role: 'harmony',
    },
    examples: [
      'add rhodes',
      'fender rhodes pad',
      'electric piano layer',
    ],
  },
  
  {
    id: createLexemeId('noun', 'neo-soul'),
    lemma: 'neo-soul',
    category: 'noun',
    variants: ['nu-soul', 'contemporary-rb'],
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'neo_soul_style',
    },
    examples: [
      'make it neo-soul',
      'nu-soul vibe',
      'contemporary r&b feel',
    ],
  },
  
  {
    id: createLexemeId('adj', 'melismatic'),
    lemma: 'melismatic',
    category: 'adj',
    variants: ['melisma', 'runs'],
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'melismatic_ornamentation',
    },
    examples: [
      'add melismatic runs',
      'melisma in the vocal',
      'ornament with runs',
    ],
  },
  
  {
    id: createLexemeId('noun', 'backbeat'),
    lemma: 'backbeat',
    category: 'noun',
    variants: ['back-beat', 'two-and-four'],
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'backbeat_emphasis',
    },
    examples: [
      'emphasize the backbeat',
      'strong two and four',
      'backbeat snare',
    ],
  },
  
  {
    id: createLexemeId('noun', 'shuffle'),
    lemma: 'shuffle',
    category: 'noun',
    variants: ['shuffled', 'triplet-feel'],
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'shuffle_groove',
    },
    examples: [
      'add shuffle feel',
      'shuffled rhythm',
      'triplet groove',
    ],
  },
  
  {
    id: createLexemeId('noun', 'hammond'),
    lemma: 'hammond',
    category: 'noun',
    variants: ['organ', 'b3'],
    semantics: {
      type: 'entity',
      entityType: 'instrument',
      role: 'harmony',
    },
    examples: [
      'add hammond organ',
      'b3 pad',
      'organ swell',
    ],
  },
  
  {
    id: createLexemeId('adj', 'greasy'),
    lemma: 'greasy',
    category: 'adj',
    variants: ['gritty-soul', 'raw'],
    semantics: {
      type: 'axis_modifier',
      axis: 'rawness',
      direction: 'increase',
    },
    examples: [
      'make it greasy',
      'greasy funk',
      'raw soul feel',
    ],
  },
  
  {
    id: createLexemeId('noun', 'breakdown-rb'),
    lemma: 'breakdown',
    category: 'noun',
    variants: ['break', 'stripped-section'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'sparse_section',
    },
    examples: [
      'add a breakdown',
      'strip it down for the break',
      'sparse section',
    ],
  },
  
  {
    id: createLexemeId('noun', 'call-response'),
    lemma: 'call-and-response',
    category: 'noun',
    variants: ['call-response', 'antiphonal'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'call_response_pattern',
    },
    examples: [
      'add call and response',
      'antiphonal vocals',
      'call-response pattern',
    ],
  },
  
  {
    id: createLexemeId('adj', 'uplifting-rb'),
    lemma: 'uplifting',
    category: 'adj',
    variants: ['inspiring', 'joyful'],
    semantics: {
      type: 'axis_modifier',
      axis: 'emotional_valence',
      direction: 'increase',
    },
    examples: [
      'make it uplifting',
      'inspiring gospel vibe',
      'joyful soul feel',
    ],
  },
  
  {
    id: createLexemeId('noun', 'motown'),
    lemma: 'motown',
    category: 'noun',
    variants: ['motown-style', 'detroit-soul'],
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'motown_style',
    },
    examples: [
      'make it motown',
      'motown-style groove',
      'detroit soul vibe',
    ],
  },
  
  {
    id: createLexemeId('adj', 'laid-back'),
    lemma: 'laid-back',
    category: 'adj',
    variants: ['relaxed-rb', 'cool'],
    semantics: {
      type: 'axis_modifier',
      axis: 'rhythmic_tension',
      direction: 'decrease',
    },
    examples: [
      'make it laid back',
      'relaxed groove',
      'cool soul feel',
    ],
  },
  
  {
    id: createLexemeId('noun', 'horn-section'),
    lemma: 'horns',
    category: 'noun',
    variants: ['horn-section', 'brass'],
    semantics: {
      type: 'entity',
      entityType: 'section',
      role: 'melody',
    },
    examples: [
      'add horn section',
      'brass hits',
      'horn stabs',
    ],
  },
  
  {
    id: createLexemeId('adj', 'falsetto'),
    lemma: 'falsetto',
    category: 'adj',
    variants: ['head-voice', 'high-register-vocal'],
    semantics: {
      type: 'concept',
      domain: 'timbre',
      aspect: 'falsetto_register',
    },
    examples: [
      'add falsetto',
      'head voice section',
      'high register vocal',
    ],
  },
  
  {
    id: createLexemeId('noun', 'ad-lib'),
    lemma: 'ad-lib',
    category: 'noun',
    variants: ['vocal-runs', 'improvised-vocals'],
    semantics: {
      type: 'concept',
      domain: 'performance',
      aspect: 'vocal_improvisation',
    },
    examples: [
      'add ad-libs',
      'vocal runs at the end',
      'improvised vocal fills',
    ],
  },
  
  {
    id: createLexemeId('adj', 'groovy'),
    lemma: 'groovy',
    category: 'adj',
    variants: ['grooving', 'funky-soul'],
    semantics: {
      type: 'axis_modifier',
      axis: 'groove_quality',
      direction: 'increase',
    },
    examples: [
      'make it groovy',
      'grooving bass line',
      'funky soul feel',
    ],
  },

  // =============================================================================
  // Classical Music Vocabulary (20 entries)
  // =============================================================================
  
  {
    id: createLexemeId('noun', 'symphony'),
    lemma: 'symphony',
    category: 'noun',
    variants: ['symphonic', 'orchestral-work'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'symphonic_form',
    },
    examples: [
      'symphonic arrangement',
      'orchestral work',
      'make it symphonic',
    ],
  },
  
  {
    id: createLexemeId('noun', 'counterpoint'),
    lemma: 'counterpoint',
    category: 'noun',
    variants: ['contrapuntal', 'polyphonic'],
    semantics: {
      type: 'concept',
      domain: 'texture',
      aspect: 'contrapuntal_texture',
    },
    examples: [
      'add counterpoint',
      'contrapuntal texture',
      'polyphonic voices',
    ],
  },
  
  {
    id: createLexemeId('noun', 'fugue'),
    lemma: 'fugue',
    category: 'noun',
    variants: ['fugal', 'imitative'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'fugal_structure',
    },
    examples: [
      'fugal section',
      'add imitative entries',
      'fugue-style counterpoint',
    ],
  },
  
  {
    id: createLexemeId('adj', 'legato-classical'),
    lemma: 'legato',
    category: 'adj',
    variants: ['smooth-classical', 'connected'],
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'legato_articulation',
    },
    examples: [
      'play legato',
      'smooth connected lines',
      'legato strings',
    ],
  },
  
  {
    id: createLexemeId('noun', 'crescendo'),
    lemma: 'crescendo',
    category: 'noun',
    variants: ['cresc', 'build-classical'],
    semantics: {
      type: 'concept',
      domain: 'dynamics',
      aspect: 'gradual_increase',
    },
    examples: [
      'add crescendo',
      'crescendo to forte',
      'gradual dynamic build',
    ],
  },
  
  {
    id: createLexemeId('noun', 'diminuendo'),
    lemma: 'diminuendo',
    category: 'noun',
    variants: ['dim', 'decrescendo'],
    semantics: {
      type: 'concept',
      domain: 'dynamics',
      aspect: 'gradual_decrease',
    },
    examples: [
      'add diminuendo',
      'diminuendo to piano',
      'gradual fade',
    ],
  },
  
  {
    id: createLexemeId('noun', 'pizzicato'),
    lemma: 'pizzicato',
    category: 'noun',
    variants: ['pizz', 'plucked'],
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'pizzicato_strings',
    },
    examples: [
      'pizzicato strings',
      'plucked cello',
      'pizz section',
    ],
  },
  
  {
    id: createLexemeId('noun', 'arco'),
    lemma: 'arco',
    category: 'noun',
    variants: ['bowed', 'arco-strings'],
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowed_strings',
    },
    examples: [
      'arco strings',
      'bowed section',
      'return to arco',
    ],
  },
  
  {
    id: createLexemeId('noun', 'tremolo'),
    lemma: 'tremolo',
    category: 'noun',
    variants: ['tremolo-strings', 'rapid-repetition'],
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'tremolo_technique',
    },
    examples: [
      'add tremolo strings',
      'tremolo effect',
      'rapid repetition',
    ],
  },
  
  {
    id: createLexemeId('noun', 'ostinato-classical'),
    lemma: 'ostinato',
    category: 'noun',
    variants: ['repeated-figure', 'persistent-pattern'],
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'ostinato_pattern',
    },
    examples: [
      'add ostinato',
      'repeated figure',
      'persistent bass pattern',
    ],
  },
  
  {
    id: createLexemeId('adj', 'majestic'),
    lemma: 'majestic',
    category: 'adj',
    variants: ['grand', 'noble'],
    semantics: {
      type: 'axis_modifier',
      axis: 'grandeur',
      direction: 'increase',
    },
    examples: [
      'make it majestic',
      'grand orchestral feel',
      'noble brass',
    ],
  },
  
  {
    id: createLexemeId('noun', 'cadenza'),
    lemma: 'cadenza',
    category: 'noun',
    variants: ['solo-passage', 'virtuosic-section'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'cadenza_section',
    },
    examples: [
      'add cadenza',
      'solo virtuosic passage',
      'cadenza before the final chord',
    ],
  },
  
  {
    id: createLexemeId('noun', 'recapitulation'),
    lemma: 'recapitulation',
    category: 'noun',
    variants: ['recap', 'return-of-theme'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'thematic_return',
    },
    examples: [
      'add recapitulation',
      'return of the theme',
      'recap the opening',
    ],
  },
  
  {
    id: createLexemeId('noun', 'development'),
    lemma: 'development',
    category: 'noun',
    variants: ['development-section', 'thematic-variation'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'thematic_development',
    },
    examples: [
      'develop the theme',
      'development section',
      'thematic variation',
    ],
  },
  
  {
    id: createLexemeId('noun', 'exposition'),
    lemma: 'exposition',
    category: 'noun',
    variants: ['opening-section', 'theme-presentation'],
    semantics: {
      type: 'concept',
      domain: 'form',
      aspect: 'exposition_section',
    },
    examples: [
      'exposition of themes',
      'opening presentation',
      'introduce the material',
    ],
  },
  
  {
    id: createLexemeId('adj', 'chamber'),
    lemma: 'chamber',
    category: 'adj',
    variants: ['intimate-ensemble', 'small-group'],
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'chamber_ensemble',
    },
    examples: [
      'chamber music texture',
      'intimate ensemble',
      'small group arrangement',
    ],
  },
  
  {
    id: createLexemeId('noun', 'tutti'),
    lemma: 'tutti',
    category: 'noun',
    variants: ['full-orchestra', 'everyone'],
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'full_ensemble',
    },
    examples: [
      'tutti section',
      'full orchestra',
      'all instruments together',
    ],
  },
  
  {
    id: createLexemeId('noun', 'ritardando'),
    lemma: 'ritardando',
    category: 'noun',
    variants: ['rit', 'slowing-down'],
    semantics: {
      type: 'concept',
      domain: 'tempo',
      aspect: 'gradual_slowdown',
    },
    examples: [
      'add ritardando',
      'slow down gradually',
      'rit at the end',
    ],
  },
  
  {
    id: createLexemeId('noun', 'accelerando'),
    lemma: 'accelerando',
    category: 'noun',
    variants: ['accel', 'speeding-up'],
    semantics: {
      type: 'concept',
      domain: 'tempo',
      aspect: 'gradual_speedup',
    },
    examples: [
      'add accelerando',
      'speed up gradually',
      'accel into the climax',
    ],
  },
  
  {
    id: createLexemeId('adj', 'baroque'),
    lemma: 'baroque',
    category: 'adj',
    variants: ['baroque-style', 'ornate-classical'],
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'baroque_period',
    },
    examples: [
      'baroque style',
      'ornate classical texture',
      'baroque ornamentation',
    ],
  },
] as const;

// =============================================================================
// Export
// =============================================================================

/**
 * All lexemes from Batch 70.
 */
export const BATCH_70_LEXEMES = RB_SOUL_LEXEMES;

/**
 * Total lexeme count for this batch.
 */
export const BATCH_70_COUNT = BATCH_70_LEXEMES.length;
