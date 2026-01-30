/**
 * GOFAI Canon — Domain Nouns Batch 22: Rhythmic Patterns and Grooves
 *
 * Comprehensive vocabulary for rhythmic patterns, grooves, time feels,
 * subdivisions, polyrhythms, and rhythmic devices. This batch systematically
 * enumerates the natural language terms musicians use to describe rhythmic
 * structures, feels, and patterns.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage for musical concepts.
 *
 * @module gofai/canon/domain-nouns-batch22-rhythmic-patterns
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Rhythmic pattern lexeme.
 */
export interface RhythmicLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective';
  readonly semantics: {
    readonly type: 'pattern' | 'feel' | 'subdivision' | 'device' | 'groove_type';
    readonly timeFeel?: 'straight' | 'swing' | 'shuffle' | 'laid_back' | 'pushed';
    readonly subdivision?: string;
    readonly polyrhythmic?: boolean;
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Time Feels and Grooves
// =============================================================================

export const TIME_FEEL_LEXEMES: readonly RhythmicLexeme[] = [
  {
    id: createLexemeId('rhythm', 'straight-eighths'),
    lemma: 'straight eighths',
    variants: ['straight eighth notes', 'even eighths', 'straight 8ths', 'straight time'],
    category: 'noun',
    semantics: {
      type: 'feel',
      timeFeel: 'straight',
      subdivision: 'eighth',
      affects: ['timing', 'groove', 'micro-timing']
    },
    description: 'Even eighth note subdivision with no swing',
    examples: [
      'play with straight eighths',
      'keep it straight time',
      'even eighth notes throughout'
    ],
    musicalContext: ['rock', 'pop', 'latin', 'funk']
  },
  {
    id: createLexemeId('rhythm', 'swing'),
    lemma: 'swing',
    variants: ['swing feel', 'swung eighths', 'shuffle feel', 'jazz time'],
    category: 'noun',
    semantics: {
      type: 'feel',
      timeFeel: 'swing',
      subdivision: 'eighth',
      affects: ['timing', 'groove', 'micro-timing']
    },
    description: 'Uneven eighth note subdivision creating a lilting feel',
    examples: [
      'play with swing',
      'add a swing feel',
      'make the eighths swing'
    ],
    musicalContext: ['jazz', 'blues', 'big band', 'bebop']
  },
  {
    id: createLexemeId('rhythm', 'shuffle'),
    lemma: 'shuffle',
    variants: ['shuffle groove', 'shuffled', 'shuffle feel', 'half-time shuffle'],
    category: 'noun',
    semantics: {
      type: 'feel',
      timeFeel: 'shuffle',
      subdivision: 'triplet',
      affects: ['timing', 'groove', 'micro-timing']
    },
    description: 'Triplet-based subdivision with distinctive bounce',
    examples: [
      'play a shuffle groove',
      'add a shuffle feel',
      'make it shuffle'
    ],
    musicalContext: ['blues', 'rock', 'country', 'R&B']
  },
  {
    id: createLexemeId('rhythm', 'laid-back'),
    lemma: 'laid back',
    variants: ['behind the beat', 'late', 'dragging', 'relaxed time'],
    category: 'adjective',
    semantics: {
      type: 'feel',
      timeFeel: 'laid_back',
      affects: ['timing', 'groove', 'micro-timing', 'tension']
    },
    description: 'Playing slightly behind the beat for relaxed feel',
    examples: [
      'play laid back',
      'sit behind the beat',
      'give it a relaxed feel'
    ],
    musicalContext: ['blues', 'R&B', 'hip-hop', 'reggae']
  },
  {
    id: createLexemeId('rhythm', 'pushed'),
    lemma: 'pushed',
    variants: ['ahead of the beat', 'on top', 'driving', 'urgent'],
    category: 'adjective',
    semantics: {
      type: 'feel',
      timeFeel: 'pushed',
      affects: ['timing', 'groove', 'micro-timing', 'energy']
    },
    description: 'Playing slightly ahead of the beat for urgency',
    examples: [
      'play pushed',
      'sit on top of the beat',
      'push the time forward'
    ],
    musicalContext: ['rock', 'punk', 'metal', 'uptempo jazz']
  },
  {
    id: createLexemeId('rhythm', 'pocket'),
    lemma: 'pocket',
    variants: ['in the pocket', 'locked in', 'tight groove', 'deep pocket'],
    category: 'noun',
    semantics: {
      type: 'feel',
      affects: ['timing', 'groove', 'ensemble', 'cohesion']
    },
    description: 'Tight rhythmic coordination between musicians',
    examples: [
      'lock into the pocket',
      'find the groove pocket',
      'stay in the pocket'
    ],
    musicalContext: ['funk', 'R&B', 'soul', 'groove-based music']
  }
];

// =============================================================================
// Subdivisions and Tuplets
// =============================================================================

export const SUBDIVISION_LEXEMES: readonly RhythmicLexeme[] = [
  {
    id: createLexemeId('rhythm', 'sixteenth-notes'),
    lemma: 'sixteenth notes',
    variants: ['sixteenths', '16ths', 'semiquavers', 'double-time feel'],
    category: 'noun',
    semantics: {
      type: 'subdivision',
      subdivision: 'sixteenth',
      affects: ['density', 'activity', 'texture']
    },
    description: 'Four subdivisions per quarter note',
    examples: [
      'add sixteenth notes',
      'play 16ths on the hi-hat',
      'double-time sixteenths'
    ],
    musicalContext: ['funk', 'R&B', 'drum & bass', 'jungle']
  },
  {
    id: createLexemeId('rhythm', 'triplets'),
    lemma: 'triplets',
    variants: ['eighth note triplets', 'triplet feel', 'three against two'],
    category: 'noun',
    semantics: {
      type: 'subdivision',
      subdivision: 'triplet',
      polyrhythmic: true,
      affects: ['density', 'feel', 'flow']
    },
    description: 'Three notes in the space of two',
    examples: [
      'add triplets',
      'play a triplet figure',
      'use triplet subdivisions'
    ],
    musicalContext: ['blues', 'jazz', 'progressive rock', 'classical']
  },
  {
    id: createLexemeId('rhythm', 'quintuplets'),
    lemma: 'quintuplets',
    variants: ['fives', 'five against four', 'quintuple subdivision'],
    category: 'noun',
    semantics: {
      type: 'subdivision',
      subdivision: 'quintuplet',
      polyrhythmic: true,
      affects: ['density', 'complexity', 'tension']
    },
    description: 'Five notes in the space of four',
    examples: [
      'add quintuplets',
      'play fives',
      'use quintuple subdivision'
    ],
    musicalContext: ['progressive rock', 'jazz fusion', 'modern classical']
  },
  {
    id: createLexemeId('rhythm', 'sextuplets'),
    lemma: 'sextuplets',
    variants: ['sixes', 'six-note groups', 'compound subdivision'],
    category: 'noun',
    semantics: {
      type: 'subdivision',
      subdivision: 'sextuplet',
      affects: ['density', 'flow', 'texture']
    },
    description: 'Six notes in the space of four',
    examples: [
      'add sextuplets',
      'play sixes',
      'use six-note groupings'
    ],
    musicalContext: ['jazz', 'fusion', 'technical music']
  },
  {
    id: createLexemeId('rhythm', 'septuplets'),
    lemma: 'septuplets',
    variants: ['sevens', 'seven against four', 'septuple subdivision'],
    category: 'noun',
    semantics: {
      type: 'subdivision',
      subdivision: 'septuplet',
      polyrhythmic: true,
      affects: ['density', 'complexity', 'disorientation']
    },
    description: 'Seven notes in the space of four',
    examples: [
      'add septuplets',
      'play sevens',
      'use septuple subdivision'
    ],
    musicalContext: ['progressive metal', 'math rock', 'avant-garde']
  }
];

// =============================================================================
// Polyrhythms and Cross-Rhythms
// =============================================================================

export const POLYRHYTHM_LEXEMES: readonly RhythmicLexeme[] = [
  {
    id: createLexemeId('rhythm', 'polyrhythm'),
    lemma: 'polyrhythm',
    variants: ['poly-rhythm', 'multiple rhythms', 'rhythmic counterpoint'],
    category: 'noun',
    semantics: {
      type: 'device',
      polyrhythmic: true,
      affects: ['complexity', 'texture', 'independence']
    },
    description: 'Multiple independent rhythmic patterns played simultaneously',
    examples: [
      'add a polyrhythm',
      'create polyrhythmic texture',
      'layer different rhythms'
    ],
    musicalContext: ['African music', 'progressive rock', 'modern jazz', 'minimalism']
  },
  {
    id: createLexemeId('rhythm', 'three-against-two'),
    lemma: 'three against two',
    variants: ['3:2', 'hemiola feel', 'three over two'],
    category: 'noun',
    semantics: {
      type: 'device',
      polyrhythmic: true,
      affects: ['complexity', 'tension', 'interest']
    },
    description: 'Three beats in one voice against two in another',
    examples: [
      'play three against two',
      'add a 3:2 polyrhythm',
      'create three over two pattern'
    ],
    musicalContext: ['classical', 'jazz', 'folk', 'baroque']
  },
  {
    id: createLexemeId('rhythm', 'four-against-three'),
    lemma: 'four against three',
    variants: ['4:3', 'four over three', 'cross-rhythm'],
    category: 'noun',
    semantics: {
      type: 'device',
      polyrhythmic: true,
      affects: ['complexity', 'density', 'tension']
    },
    description: 'Four beats in one voice against three in another',
    examples: [
      'play four against three',
      'add a 4:3 polyrhythm',
      'create four over three pattern'
    ],
    musicalContext: ['jazz', 'progressive music', 'African music']
  },
  {
    id: createLexemeId('rhythm', 'five-against-four'),
    lemma: 'five against four',
    variants: ['5:4', 'five over four', 'complex polyrhythm'],
    category: 'noun',
    semantics: {
      type: 'device',
      polyrhythmic: true,
      affects: ['complexity', 'disorientation', 'sophistication']
    },
    description: 'Five beats in one voice against four in another',
    examples: [
      'play five against four',
      'add a 5:4 polyrhythm',
      'create five over four pattern'
    ],
    musicalContext: ['progressive rock', 'modern jazz', 'math rock']
  },
  {
    id: createLexemeId('rhythm', 'hemiola'),
    lemma: 'hemiola',
    variants: ['hemiola pattern', 'three-two shift', '3-2 pattern'],
    category: 'noun',
    semantics: {
      type: 'device',
      polyrhythmic: true,
      affects: ['meter', 'tension', 'surprise']
    },
    description: 'Rhythmic shift between triple and duple meter',
    examples: [
      'add a hemiola',
      'use hemiola pattern',
      'create metric shift'
    ],
    musicalContext: ['baroque', 'classical', 'folk', 'Latin']
  }
];

// =============================================================================
// Groove Types and Drum Patterns
// =============================================================================

export const GROOVE_TYPE_LEXEMES: readonly RhythmicLexeme[] = [
  {
    id: createLexemeId('rhythm', 'backbeat'),
    lemma: 'backbeat',
    variants: ['snare backbeat', 'two and four', 'on the backbeat'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'emphasis', 'drive']
    },
    description: 'Emphasis on beats 2 and 4 (typical in popular music)',
    examples: [
      'emphasize the backbeat',
      'strong two and four',
      'play a backbeat groove'
    ],
    musicalContext: ['rock', 'pop', 'R&B', 'funk']
  },
  {
    id: createLexemeId('rhythm', 'breakbeat'),
    lemma: 'breakbeat',
    variants: ['break', 'drum break', 'breakbeat pattern', 'breaks'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'texture', 'energy']
    },
    description: 'Sampled or syncopated drum pattern (often from funk/soul)',
    examples: [
      'use a breakbeat',
      'add drum breaks',
      'create breakbeat groove'
    ],
    musicalContext: ['hip-hop', 'drum & bass', 'jungle', 'electronic']
  },
  {
    id: createLexemeId('rhythm', 'two-step'),
    lemma: 'two-step',
    variants: ['2-step', 'two step groove', 'UK garage pattern'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'syncopation', 'bounce']
    },
    description: 'Syncopated groove with kick on 1 and snare variations',
    examples: [
      'play a two-step groove',
      'use 2-step pattern',
      'add two-step feel'
    ],
    musicalContext: ['UK garage', 'dubstep', 'grime', 'electronic']
  },
  {
    id: createLexemeId('rhythm', 'four-on-the-floor'),
    lemma: 'four on the floor',
    variants: ['four to the floor', '4/4 kick', 'steady four'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'drive', 'energy']
    },
    description: 'Kick drum on every quarter note beat',
    examples: [
      'use four on the floor',
      'steady kick pattern',
      'four to the floor beat'
    ],
    musicalContext: ['house', 'techno', 'disco', 'dance']
  },
  {
    id: createLexemeId('rhythm', 'boom-bap'),
    lemma: 'boom bap',
    variants: ['boom-bap', 'boom bap beat', 'classic hip-hop beat'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'weight', 'punch']
    },
    description: 'Classic hip-hop pattern with heavy kick and snare',
    examples: [
      'use boom bap groove',
      'classic boom-bap beat',
      'add boom bap feel'
    ],
    musicalContext: ['hip-hop', 'boom bap', 'underground rap']
  },
  {
    id: createLexemeId('rhythm', 'one-drop'),
    lemma: 'one drop',
    variants: ['one-drop', 'reggae beat', 'drop rhythm'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'space', 'emphasis']
    },
    description: 'Reggae pattern with emphasis on beat 3',
    examples: [
      'play one drop',
      'use reggae one-drop',
      'add one-drop feel'
    ],
    musicalContext: ['reggae', 'dub', 'dancehall']
  },
  {
    id: createLexemeId('rhythm', 'riddim'),
    lemma: 'riddim',
    variants: ['riddim pattern', 'dancehall riddim', 'rhythm track'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'drive', 'density']
    },
    description: 'Jamaican rhythm pattern foundation',
    examples: [
      'use a riddim',
      'build on riddim',
      'create riddim groove'
    ],
    musicalContext: ['reggae', 'dancehall', 'dub']
  },
  {
    id: createLexemeId('rhythm', 'samba'),
    lemma: 'samba',
    variants: ['samba pattern', 'samba groove', 'Brazilian samba'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'syncopation', 'energy']
    },
    description: 'Brazilian rhythm pattern in 2/4 with distinctive syncopation',
    examples: [
      'play samba pattern',
      'use samba groove',
      'add samba feel'
    ],
    musicalContext: ['Brazilian', 'samba', 'bossa nova', 'Latin']
  },
  {
    id: createLexemeId('rhythm', 'bossa-nova'),
    lemma: 'bossa nova',
    variants: ['bossa', 'bossa nova pattern', 'bossa groove'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'syncopation', 'sophistication']
    },
    description: 'Brazilian rhythm with syncopated bass and gentle sway',
    examples: [
      'play bossa nova',
      'use bossa pattern',
      'add bossa groove'
    ],
    musicalContext: ['Brazilian', 'bossa nova', 'jazz', 'Latin']
  },
  {
    id: createLexemeId('rhythm', 'afrobeat'),
    lemma: 'afrobeat',
    variants: ['afrobeat pattern', 'afrobeat groove', 'West African groove'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      polyrhythmic: true,
      affects: ['groove', 'complexity', 'energy']
    },
    description: 'West African-influenced polyrhythmic groove',
    examples: [
      'play afrobeat',
      'use afrobeat groove',
      'add afrobeat feel'
    ],
    musicalContext: ['afrobeat', 'African', 'world music', 'funk']
  },
  {
    id: createLexemeId('rhythm', 'son-clave'),
    lemma: 'son clave',
    variants: ['3-2 clave', '2-3 clave', 'clave pattern'],
    category: 'noun',
    semantics: {
      type: 'groove_type',
      affects: ['groove', 'foundation', 'syncopation']
    },
    description: 'Foundational Latin rhythm pattern (3-2 or 2-3)',
    examples: [
      'play son clave',
      'follow the clave',
      'use 3-2 clave pattern'
    ],
    musicalContext: ['Cuban', 'salsa', 'Latin jazz', 'Afro-Cuban']
  }
];

// =============================================================================
// Rhythmic Devices and Techniques
// =============================================================================

export const RHYTHMIC_DEVICE_LEXEMES: readonly RhythmicLexeme[] = [
  {
    id: createLexemeId('rhythm', 'syncopation'),
    lemma: 'syncopation',
    variants: ['syncopated', 'off-beat emphasis', 'rhythmic displacement'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['groove', 'tension', 'interest']
    },
    description: 'Emphasis on weak beats or off-beats',
    examples: [
      'add syncopation',
      'make it more syncopated',
      'use syncopated rhythm'
    ],
    musicalContext: ['jazz', 'funk', 'Latin', 'contemporary']
  },
  {
    id: createLexemeId('rhythm', 'anticipation'),
    lemma: 'anticipation',
    variants: ['anticipated note', 'early entrance', 'pickup'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['phrasing', 'energy', 'flow']
    },
    description: 'Note occurring just before the expected beat',
    examples: [
      'add anticipations',
      'anticipate the downbeat',
      'use anticipated notes'
    ],
    musicalContext: ['all styles', 'phrasing technique']
  },
  {
    id: createLexemeId('rhythm', 'ghost-note'),
    lemma: 'ghost note',
    variants: ['ghost notes', 'grace note', 'dead note', 'muted note'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['groove', 'texture', 'subtlety']
    },
    description: 'Very soft note adding rhythmic texture',
    examples: [
      'add ghost notes',
      'use ghost note pattern',
      'subtle ghost notes'
    ],
    musicalContext: ['funk', 'R&B', 'jazz', 'groove music']
  },
  {
    id: createLexemeId('rhythm', 'flam'),
    lemma: 'flam',
    variants: ['flam rudiment', 'grace note flam', 'flamming'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['articulation', 'accent', 'texture']
    },
    description: 'Two notes played nearly simultaneously (grace + main)',
    examples: [
      'add flams',
      'use flam rudiment',
      'play with flams'
    ],
    musicalContext: ['drumming', 'percussion', 'marching']
  },
  {
    id: createLexemeId('rhythm', 'paradiddle'),
    lemma: 'paradiddle',
    variants: ['paradiddle pattern', 'single paradiddle', 'rudiment'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      affects: ['technical', 'flow', 'hand-coordination']
    },
    description: 'Drum rudiment with RLRR LRLL sticking pattern',
    examples: [
      'play paradiddles',
      'use paradiddle pattern',
      'add paradiddle fills'
    ],
    musicalContext: ['drumming', 'percussion', 'rudiments']
  },
  {
    id: createLexemeId('rhythm', 'ostinato'),
    lemma: 'ostinato',
    variants: ['rhythmic ostinato', 'repeated pattern', 'rhythmic loop'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      affects: ['groove', 'foundation', 'hypnotic']
    },
    description: 'Persistently repeated rhythmic pattern',
    examples: [
      'create an ostinato',
      'use rhythmic ostinato',
      'repeat the pattern'
    ],
    musicalContext: ['minimalism', 'African', 'contemporary', 'all styles']
  },
  {
    id: createLexemeId('rhythm', 'fill'),
    lemma: 'fill',
    variants: ['drum fill', 'rhythmic fill', 'break fill', 'turnaround'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['transition', 'energy', 'punctuation']
    },
    description: 'Rhythmic embellishment at phrase endings',
    examples: [
      'add a fill',
      'play drum fill',
      'create transition fill'
    ],
    musicalContext: ['all styles', 'drumming', 'percussion']
  },
  {
    id: createLexemeId('rhythm', 'stop-time'),
    lemma: 'stop time',
    variants: ['stop-time', 'rhythmic stop', 'break'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['space', 'drama', 'emphasis']
    },
    description: 'Rhythmic silence or sparse hits for dramatic effect',
    examples: [
      'use stop time',
      'add rhythmic stops',
      'create stop-time section'
    ],
    musicalContext: ['jazz', 'funk', 'all styles']
  },
  {
    id: createLexemeId('rhythm', 'drum-roll'),
    lemma: 'drum roll',
    variants: ['roll', 'snare roll', 'sustained roll', 'buzz roll'],
    category: 'noun',
    semantics: {
      type: 'device',
      affects: ['build', 'tension', 'drama']
    },
    description: 'Rapid alternating strokes creating sustained sound',
    examples: [
      'add a drum roll',
      'use snare roll',
      'build with rolls'
    ],
    musicalContext: ['orchestral', 'drumming', 'all styles']
  }
];

// =============================================================================
// Combined Export
// =============================================================================

/**
 * All rhythmic pattern lexemes for Batch 22.
 */
export const BATCH_22_RHYTHMIC_PATTERNS: readonly RhythmicLexeme[] = [
  ...TIME_FEEL_LEXEMES,
  ...SUBDIVISION_LEXEMES,
  ...POLYRHYTHM_LEXEMES,
  ...GROOVE_TYPE_LEXEMES,
  ...RHYTHMIC_DEVICE_LEXEMES
];

/**
 * Count of lexemes in this batch.
 */
export const BATCH_22_COUNT = BATCH_22_RHYTHMIC_PATTERNS.length;

/**
 * Categories covered in this batch.
 */
export const BATCH_22_CATEGORIES = [
  'time-feels',
  'subdivisions',
  'polyrhythms',
  'groove-types',
  'rhythmic-devices'
] as const;
