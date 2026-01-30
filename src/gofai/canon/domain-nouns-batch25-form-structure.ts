/**
 * GOFAI Canon — Domain Nouns Batch 25: Form, Structure, and Architecture
 *
 * Comprehensive vocabulary for musical form, structural elements, sectional
 * organization, and architectural features. This batch systematically
 * enumerates the natural language terms musicians use to describe the
 * large-scale organization and structural components of musical works.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage for musical concepts.
 *
 * @module gofai/canon/domain-nouns-batch25-form-structure
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Form and structure lexeme.
 */
export interface FormLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective';
  readonly semantics: {
    readonly type: 'section' | 'transition' | 'structural_device' | 'formal_pattern';
    readonly position?: 'beginning' | 'middle' | 'end' | 'any';
    readonly function?: string;
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Standard Song Sections
// =============================================================================

export const SONG_SECTION_LEXEMES: readonly FormLexeme[] = [
  {
    id: createLexemeId('form', 'intro'),
    lemma: 'intro',
    variants: ['introduction', 'opening', 'beginning', 'start'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'beginning',
      function: 'establish',
      affects: ['form', 'structure', 'pacing']
    },
    description: 'Opening section that establishes the song',
    examples: [
      'edit the intro',
      'shorten the introduction',
      'add an intro section'
    ],
    musicalContext: ['popular music', 'all genres']
  },
  {
    id: createLexemeId('form', 'verse'),
    lemma: 'verse',
    variants: ['first verse', 'second verse', 'verse section', 'stanza'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'any',
      function: 'narrative',
      affects: ['form', 'structure', 'narrative']
    },
    description: 'Narrative section with varying lyrics',
    examples: [
      'in the verse',
      'first verse only',
      'repeat the verse'
    ],
    musicalContext: ['popular music', 'verse-chorus form']
  },
  {
    id: createLexemeId('form', 'chorus'),
    lemma: 'chorus',
    variants: ['refrain', 'hook section', 'main chorus'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'any',
      function: 'climactic',
      affects: ['form', 'lift', 'memorability']
    },
    description: 'Repeated climactic section with main hook',
    examples: [
      'in the chorus',
      'make the chorus bigger',
      'last chorus'
    ],
    musicalContext: ['popular music', 'verse-chorus form']
  },
  {
    id: createLexemeId('form', 'pre-chorus'),
    lemma: 'pre-chorus',
    variants: ['pre chorus', 'lift', 'ramp', 'climb'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'middle',
      function: 'build',
      affects: ['tension', 'anticipation', 'lift']
    },
    description: 'Transitional buildup section before chorus',
    examples: [
      'add a pre-chorus',
      'in the pre-chorus',
      'build through the pre'
    ],
    musicalContext: ['popular music', 'contemporary']
  },
  {
    id: createLexemeId('form', 'bridge'),
    lemma: 'bridge',
    variants: ['middle eight', 'middle section', 'contrast section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'middle',
      function: 'contrast',
      affects: ['form', 'contrast', 'development']
    },
    description: 'Contrasting section providing relief and development',
    examples: [
      'in the bridge',
      'add a bridge',
      'bridge section'
    ],
    musicalContext: ['popular music', 'AABA form']
  },
  {
    id: createLexemeId('form', 'outro'),
    lemma: 'outro',
    variants: ['ending', 'conclusion', 'coda', 'fadeout'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'end',
      function: 'conclude',
      affects: ['form', 'closure', 'resolution']
    },
    description: 'Concluding section',
    examples: [
      'in the outro',
      'extend the ending',
      'fade out in the outro'
    ],
    musicalContext: ['popular music', 'all genres']
  },
  {
    id: createLexemeId('form', 'breakdown'),
    lemma: 'breakdown',
    variants: ['break', 'drop section', 'sparse section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'middle',
      function: 'reduce',
      affects: ['density', 'space', 'tension-release']
    },
    description: 'Section with reduced instrumentation',
    examples: [
      'add a breakdown',
      'in the breakdown',
      'sparse breakdown section'
    ],
    musicalContext: ['electronic', 'pop', 'EDM']
  },
  {
    id: createLexemeId('form', 'buildup'),
    lemma: 'buildup',
    variants: ['build', 'riser', 'climb', 'crescendo section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'any',
      function: 'build',
      affects: ['tension', 'energy', 'anticipation']
    },
    description: 'Section of increasing intensity',
    examples: [
      'add a buildup',
      'extend the build',
      'tension in the buildup'
    ],
    musicalContext: ['electronic', 'EDM', 'progressive']
  },
  {
    id: createLexemeId('form', 'drop'),
    lemma: 'drop',
    variants: ['the drop', 'climax', 'release'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'any',
      function: 'release',
      affects: ['energy', 'climax', 'impact']
    },
    description: 'Climactic release after buildup',
    examples: [
      'at the drop',
      'make the drop hit harder',
      'after the drop'
    ],
    musicalContext: ['EDM', 'dubstep', 'electronic']
  },
  {
    id: createLexemeId('form', 'interlude'),
    lemma: 'interlude',
    variants: ['intermission', 'instrumental break', 'transition'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'middle',
      function: 'transition',
      affects: ['pacing', 'contrast', 'breathing space']
    },
    description: 'Brief contrasting section between main parts',
    examples: [
      'add an interlude',
      'in the interlude',
      'instrumental interlude'
    ],
    musicalContext: ['progressive', 'concept albums', 'classical']
  },
  {
    id: createLexemeId('form', 'vamp'),
    lemma: 'vamp',
    variants: ['vamp section', 'repeated groove', 'ostinato section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'any',
      function: 'groove',
      affects: ['groove', 'repetition', 'hypnotic']
    },
    description: 'Repeated rhythmic/harmonic pattern',
    examples: [
      'add a vamp',
      'vamp over the changes',
      'repeat the vamp'
    ],
    musicalContext: ['jazz', 'funk', 'gospel']
  },
  {
    id: createLexemeId('form', 'tag'),
    lemma: 'tag',
    variants: ['tag ending', 'repeated ending', 'outro tag'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'end',
      function: 'extend',
      affects: ['ending', 'repetition', 'closure']
    },
    description: 'Repeated phrase at the end',
    examples: [
      'add a tag',
      'repeat the tag',
      'tag ending'
    ],
    musicalContext: ['jazz', 'show tunes', 'traditional']
  }
];

// =============================================================================
// Classical Forms and Movements
// =============================================================================

export const CLASSICAL_FORM_LEXEMES: readonly FormLexeme[] = [
  {
    id: createLexemeId('form', 'exposition'),
    lemma: 'exposition',
    variants: ['opening section', 'theme presentation'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'beginning',
      function: 'present',
      affects: ['form', 'thematic material', 'key areas']
    },
    description: 'Initial presentation of themes (sonata form)',
    examples: [
      'in the exposition',
      'exposition section',
      'primary theme in exposition'
    ],
    musicalContext: ['classical', 'sonata form']
  },
  {
    id: createLexemeId('form', 'development'),
    lemma: 'development',
    variants: ['development section', 'working-out', 'thematic development'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'middle',
      function: 'develop',
      affects: ['complexity', 'modulation', 'transformation']
    },
    description: 'Section of thematic exploration and transformation',
    examples: [
      'in the development',
      'development section',
      'develop the themes'
    ],
    musicalContext: ['classical', 'sonata form']
  },
  {
    id: createLexemeId('form', 'recapitulation'),
    lemma: 'recapitulation',
    variants: ['recap', 'return', 'restatement'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'end',
      function: 'return',
      affects: ['form', 'resolution', 'home key']
    },
    description: 'Return of opening material in home key',
    examples: [
      'in the recapitulation',
      'recap section',
      'return to the tonic'
    ],
    musicalContext: ['classical', 'sonata form']
  },
  {
    id: createLexemeId('form', 'coda'),
    lemma: 'coda',
    variants: ['tail', 'concluding section', 'final section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'end',
      function: 'conclude',
      affects: ['closure', 'finality', 'extension']
    },
    description: 'Concluding section beyond main form',
    examples: [
      'add a coda',
      'in the coda',
      'extend with a coda'
    ],
    musicalContext: ['classical', 'formal music']
  },
  {
    id: createLexemeId('form', 'cadenza'),
    lemma: 'cadenza',
    variants: ['solo cadenza', 'virtuosic passage', 'improvised section'],
    category: 'noun',
    semantics: {
      type: 'section',
      position: 'end',
      function: 'virtuosic',
      affects: ['virtuosity', 'improvisation', 'display']
    },
    description: 'Virtuosic solo passage',
    examples: [
      'play a cadenza',
      'cadenza section',
      'improvised cadenza'
    ],
    musicalContext: ['classical', 'concerto']
  },
  {
    id: createLexemeId('form', 'variation'),
    lemma: 'variation',
    variants: ['theme and variations', 'varied version'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'vary',
      affects: ['transformation', 'development', 'ornamentation']
    },
    description: 'Modified version of a theme',
    examples: [
      'play the variation',
      'theme and variations',
      'create variations'
    ],
    musicalContext: ['classical', 'theme and variations']
  },
  {
    id: createLexemeId('form', 'fugue'),
    lemma: 'fugue',
    variants: ['fugal section', 'fugato', 'contrapuntal section'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'contrapuntal',
      affects: ['counterpoint', 'imitation', 'complexity']
    },
    description: 'Contrapuntal composition with subject entries',
    examples: [
      'fugal section',
      'fugue-like texture',
      'fugato passage'
    ],
    musicalContext: ['baroque', 'classical', 'contrapuntal']
  }
];

// =============================================================================
// Transitions and Connective Sections
// =============================================================================

export const TRANSITION_LEXEMES: readonly FormLexeme[] = [
  {
    id: createLexemeId('form', 'transition'),
    lemma: 'transition',
    variants: ['transitional passage', 'connecting section', 'link'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'any',
      function: 'connect',
      affects: ['flow', 'connection', 'modulation']
    },
    description: 'Passage connecting two sections',
    examples: [
      'add a transition',
      'smooth transition',
      'transitional passage'
    ],
    musicalContext: ['all genres', 'formal technique']
  },
  {
    id: createLexemeId('form', 'turnaround'),
    lemma: 'turnaround',
    variants: ['turn', 'turnaround progression', 'cyclical progression'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'end',
      function: 'return',
      affects: ['harmony', 'cycle', 'repetition']
    },
    description: 'Harmonic progression returning to start',
    examples: [
      'play the turnaround',
      'add a turnaround',
      'turnaround progression'
    ],
    musicalContext: ['jazz', 'blues', 'standards']
  },
  {
    id: createLexemeId('form', 'pickup'),
    lemma: 'pickup',
    variants: ['pickup bar', 'anacrusis', 'upbeat', 'lead-in'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'beginning',
      function: 'anticipate',
      affects: ['phrasing', 'anticipation', 'rhythm']
    },
    description: 'Notes before the first downbeat',
    examples: [
      'add a pickup',
      'pickup bar',
      'lead-in notes'
    ],
    musicalContext: ['all genres', 'phrasing']
  },
  {
    id: createLexemeId('form', 'fill'),
    lemma: 'fill',
    variants: ['drum fill', 'transitional fill', 'break fill'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'any',
      function: 'punctuate',
      affects: ['transition', 'punctuation', 'energy']
    },
    description: 'Brief embellishment marking transitions',
    examples: [
      'add a fill',
      'drum fill',
      'transitional fill'
    ],
    musicalContext: ['popular music', 'drumming']
  },
  {
    id: createLexemeId('form', 'break'),
    lemma: 'break',
    variants: ['drum break', 'stop', 'caesura', 'breath'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'any',
      function: 'interrupt',
      affects: ['space', 'drama', 'attention']
    },
    description: 'Brief interruption or silence',
    examples: [
      'add a break',
      'drum break',
      'stop for a break'
    ],
    musicalContext: ['all genres', 'dramatic device']
  },
  {
    id: createLexemeId('form', 'riser'),
    lemma: 'riser',
    variants: ['rise', 'sweep up', 'upward sweep'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'any',
      function: 'build',
      affects: ['tension', 'anticipation', 'sweep']
    },
    description: 'Ascending sound effect building tension',
    examples: [
      'add a riser',
      'use sweep up',
      'riser effect'
    ],
    musicalContext: ['EDM', 'electronic', 'film']
  },
  {
    id: createLexemeId('form', 'downlifter'),
    lemma: 'downlifter',
    variants: ['down sweep', 'fall', 'descending sweep'],
    category: 'noun',
    semantics: {
      type: 'transition',
      position: 'any',
      function: 'release',
      affects: ['release', 'descent', 'resolution']
    },
    description: 'Descending sound effect for resolution',
    examples: [
      'add a downlifter',
      'down sweep',
      'falling effect'
    ],
    musicalContext: ['EDM', 'electronic', 'transitions']
  }
];

// =============================================================================
// Structural Devices and Techniques
// =============================================================================

export const STRUCTURAL_DEVICE_LEXEMES: readonly FormLexeme[] = [
  {
    id: createLexemeId('form', 'repeat'),
    lemma: 'repeat',
    variants: ['repetition', 'repeated section', 'da capo', 'dal segno'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'repeat',
      affects: ['form', 'length', 'reinforcement']
    },
    description: 'Section played again',
    examples: [
      'add a repeat',
      'repeat the section',
      'da capo'
    ],
    musicalContext: ['all genres', 'formal notation']
  },
  {
    id: createLexemeId('form', 'call-and-response'),
    lemma: 'call and response',
    variants: ['call-response', 'antiphonal', 'question-answer'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'dialogue',
      affects: ['phrasing', 'interaction', 'dialogue']
    },
    description: 'Alternating phrases between voices',
    examples: [
      'call and response',
      'antiphonal structure',
      'question-answer phrasing'
    ],
    musicalContext: ['blues', 'gospel', 'African', 'jazz']
  },
  {
    id: createLexemeId('form', 'ostinato'),
    lemma: 'ostinato',
    variants: ['repeated pattern', 'riff', 'ground bass', 'loop'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'repeat',
      affects: ['foundation', 'hypnotic', 'groove']
    },
    description: 'Persistently repeated musical phrase',
    examples: [
      'add an ostinato',
      'repeated riff',
      'ground bass'
    ],
    musicalContext: ['baroque', 'minimalism', 'rock']
  },
  {
    id: createLexemeId('form', 'sequence'),
    lemma: 'sequence',
    variants: ['sequential pattern', 'modular sequence', 'repeated motif'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'develop',
      affects: ['development', 'pattern', 'transposition']
    },
    description: 'Pattern repeated at different pitch levels',
    examples: [
      'use a sequence',
      'sequential development',
      'modulating sequence'
    ],
    musicalContext: ['classical', 'baroque', 'developmental']
  },
  {
    id: createLexemeId('form', 'climax'),
    lemma: 'climax',
    variants: ['peak', 'high point', 'apex', 'culmination'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'peak',
      affects: ['intensity', 'drama', 'arc']
    },
    description: 'Point of maximum intensity',
    examples: [
      'build to the climax',
      'peak moment',
      'culmination point'
    ],
    musicalContext: ['all genres', 'dramatic arc']
  },
  {
    id: createLexemeId('form', 'arc'),
    lemma: 'arc',
    variants: ['dramatic arc', 'narrative arc', 'journey', 'trajectory'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'shape',
      affects: ['form', 'narrative', 'journey']
    },
    description: 'Overall shape and trajectory of the piece',
    examples: [
      'dramatic arc',
      'narrative journey',
      'shape the arc'
    ],
    musicalContext: ['composition', 'large-scale form']
  },
  {
    id: createLexemeId('form', 'counterpoint'),
    lemma: 'counterpoint',
    variants: ['contrapuntal texture', 'polyphony', 'independent voices'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'interweave',
      affects: ['texture', 'independence', 'complexity']
    },
    description: 'Multiple independent melodic lines',
    examples: [
      'add counterpoint',
      'contrapuntal texture',
      'independent voices'
    ],
    musicalContext: ['baroque', 'classical', 'jazz']
  },
  {
    id: createLexemeId('form', 'drone'),
    lemma: 'drone',
    variants: ['pedal tone', 'sustained note', 'pedal point'],
    category: 'noun',
    semantics: {
      type: 'structural_device',
      position: 'any',
      function: 'sustain',
      affects: ['foundation', 'stability', 'suspension']
    },
    description: 'Sustained or repeated note',
    examples: [
      'add a drone',
      'pedal tone',
      'sustained bass'
    ],
    musicalContext: ['modal', 'bagpipes', 'Indian', 'ambient']
  }
];

// =============================================================================
// Formal Patterns and Schemata
// =============================================================================

export const FORMAL_PATTERN_LEXEMES: readonly FormLexeme[] = [
  {
    id: createLexemeId('form', 'aaba-form'),
    lemma: 'AABA form',
    variants: ['32-bar form', 'song form', 'standard form'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'organize',
      affects: ['form', 'repetition', 'contrast']
    },
    description: 'Two statements, contrasting bridge, return (32 bars)',
    examples: [
      'in AABA form',
      '32-bar form',
      'standard song form'
    ],
    musicalContext: ['jazz', 'standards', 'Tin Pan Alley']
  },
  {
    id: createLexemeId('form', 'verse-chorus-form'),
    lemma: 'verse-chorus form',
    variants: ['verse-chorus', 'pop song form', 'strophic-refrain'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'organize',
      affects: ['form', 'narrative', 'repetition']
    },
    description: 'Alternating verse and chorus sections',
    examples: [
      'verse-chorus structure',
      'pop song form',
      'verse into chorus'
    ],
    musicalContext: ['popular music', 'rock', 'pop']
  },
  {
    id: createLexemeId('form', 'through-composed'),
    lemma: 'through-composed',
    variants: ['through composed', 'non-repeating', 'continuous'],
    category: 'adjective',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'continuous',
      affects: ['form', 'development', 'narrative']
    },
    description: 'Continuously developing without exact repetition',
    examples: [
      'through-composed form',
      'no repeating sections',
      'continuous development'
    ],
    musicalContext: ['art song', 'progressive', 'classical']
  },
  {
    id: createLexemeId('form', 'rondo-form'),
    lemma: 'rondo form',
    variants: ['rondo', 'ABACA', 'refrain form'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'organize',
      affects: ['form', 'return', 'episodes']
    },
    description: 'Recurring theme alternating with episodes (ABACA)',
    examples: [
      'in rondo form',
      'rondo structure',
      'refrain returns'
    ],
    musicalContext: ['classical', 'finale movements']
  },
  {
    id: createLexemeId('form', 'strophic-form'),
    lemma: 'strophic form',
    variants: ['strophic', 'verse form', 'repeated verses'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'repeat',
      affects: ['form', 'simplicity', 'narrative']
    },
    description: 'Same music for each verse',
    examples: [
      'strophic form',
      'verse structure',
      'repeated verse music'
    ],
    musicalContext: ['folk', 'hymns', 'traditional']
  },
  {
    id: createLexemeId('form', 'binary-form'),
    lemma: 'binary form',
    variants: ['two-part form', 'AB form'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'organize',
      affects: ['form', 'contrast', 'balance']
    },
    description: 'Two contrasting sections (AB)',
    examples: [
      'binary form',
      'two-part structure',
      'AB form'
    ],
    musicalContext: ['baroque', 'dance suites']
  },
  {
    id: createLexemeId('form', 'ternary-form'),
    lemma: 'ternary form',
    variants: ['three-part form', 'ABA form', 'song form'],
    category: 'noun',
    semantics: {
      type: 'formal_pattern',
      position: 'any',
      function: 'organize',
      affects: ['form', 'contrast', 'return']
    },
    description: 'Three sections with return (ABA)',
    examples: [
      'ternary form',
      'three-part form',
      'ABA structure'
    ],
    musicalContext: ['classical', 'minuet', 'da capo aria']
  }
];

// =============================================================================
// Combined Export
// =============================================================================

/**
 * All form and structure lexemes for Batch 25.
 */
export const BATCH_25_FORM_STRUCTURE: readonly FormLexeme[] = [
  ...SONG_SECTION_LEXEMES,
  ...CLASSICAL_FORM_LEXEMES,
  ...TRANSITION_LEXEMES,
  ...STRUCTURAL_DEVICE_LEXEMES,
  ...FORMAL_PATTERN_LEXEMES
];

/**
 * Count of lexemes in this batch.
 */
export const BATCH_25_COUNT = BATCH_25_FORM_STRUCTURE.length;

/**
 * Categories covered in this batch.
 */
export const BATCH_25_CATEGORIES = [
  'song-sections',
  'classical-forms',
  'transitions',
  'structural-devices',
  'formal-patterns'
] as const;
