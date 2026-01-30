/**
 * GOFAI Canon — Instrumentation and Orchestration Vocabulary (Batch 62)
 *
 * Comprehensive vocabulary for instrumentation, orchestration, and ensemble
 * descriptors across musical traditions:
 * - Instrument families and categories
 * - Ensemble sizes and types
 * - Instrumental combinations
 * - Orchestral sections
 * - Texture and voicing
 * - Instrumental roles
 * - Doubling and unison
 * - Spacing and register distribution
 *
 * This batch provides natural language coverage for arrangement, orchestration,
 * and instrumentation decisions.
 *
 * @module gofai/canon/instrumentation-orchestration-batch62
 */

import {
  type Lexeme,
  createLexemeId,
  createAxisId,
  createOpcodeId,
} from './types';

// =============================================================================
// Instrument Families
// =============================================================================

/**
 * Major instrument family descriptors.
 *
 * Covers:
 * - String instruments
 * - Wind instruments (brass and woodwinds)
 * - Percussion
 * - Keyboard instruments
 * - Electronic instruments
 */
const INSTRUMENT_FAMILY_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'strings'),
    lemma: 'strings',
    variants: ['string section', 'string ensemble', 'strings family'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'String instrument family (violin, viola, cello, bass, etc.)',
    examples: [
      'add strings',
      'string section plays',
      'emphasize the strings',
      'strings only',
    ],
  },
  {
    id: createLexemeId('noun', 'brass'),
    lemma: 'brass',
    variants: ['brass section', 'brass ensemble', 'brass family'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Brass instrument family (trumpet, trombone, horn, tuba)',
    examples: [
      'add brass',
      'brass fanfare',
      'bring in brass',
      'brass accent',
    ],
  },
  {
    id: createLexemeId('noun', 'woodwinds'),
    lemma: 'woodwinds',
    variants: ['winds', 'woodwind section', 'reeds'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Woodwind instrument family (flute, oboe, clarinet, bassoon)',
    examples: [
      'add woodwinds',
      'woodwind choir',
      'winds melody',
      'reed section',
    ],
  },
  {
    id: createLexemeId('noun', 'percussion'),
    lemma: 'percussion',
    variants: ['drums', 'percussion section', 'battery'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Percussion instrument family (drums, cymbals, timpani, etc.)',
    examples: [
      'add percussion',
      'percussion break',
      'drums enter',
      'percussive accents',
    ],
  },
  {
    id: createLexemeId('noun', 'keyboards'),
    lemma: 'keyboards',
    variants: ['keys', 'keyboard section', 'piano family'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Keyboard instrument family (piano, organ, harpsichord, synth)',
    examples: [
      'add keyboards',
      'keys pad',
      'piano line',
      'organ swell',
    ],
  },
  {
    id: createLexemeId('noun', 'voices'),
    lemma: 'voices',
    variants: ['vocals', 'choir', 'vocal section', 'singers'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Vocal parts (soprano, alto, tenor, bass, etc.)',
    examples: [
      'add voices',
      'vocal harmony',
      'choir enters',
      'sung melody',
    ],
  },
  {
    id: createLexemeId('noun', 'electronics'),
    lemma: 'electronics',
    variants: ['synths', 'electronic instruments', 'synthesizers'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'family',
    },
    description: 'Electronic instruments and synthesizers',
    examples: [
      'add electronics',
      'synth pad',
      'electronic texture',
      'digital sounds',
    ],
  },
  {
    id: createLexemeId('noun', 'rhythm_section'),
    lemma: 'rhythm section',
    variants: ['rhythm', 'backline', 'band'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble',
    },
    description: 'Rhythm section (bass, drums, guitar, keys)',
    examples: [
      'rhythm section plays',
      'add backline',
      'bring in the band',
      'rhythm groove',
    ],
  },
];

// =============================================================================
// Ensemble Sizes and Types
// =============================================================================

/**
 * Ensemble size and type descriptors.
 *
 * Covers:
 * - Solo vs ensemble
 * - Chamber ensembles
 * - Orchestral sizes
 * - Band configurations
 */
const ENSEMBLE_SIZE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'solo'),
    lemma: 'solo',
    variants: ['single instrument', 'unaccompanied', 'alone'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('ensemble_size'),
      direction: 'decrease',
    },
    description: 'Solo instrumental performance (single player)',
    examples: [
      'make it solo',
      'solo instrument',
      'unaccompanied line',
      'strip to solo',
    ],
  },
  {
    id: createLexemeId('noun', 'duo'),
    lemma: 'duo',
    variants: ['duet', 'pair', 'two players'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_size',
    },
    description: 'Two-player ensemble',
    examples: [
      'duo texture',
      'duet passage',
      'reduce to duo',
      'two instruments',
    ],
  },
  {
    id: createLexemeId('noun', 'trio'),
    lemma: 'trio',
    variants: ['three players', 'threesome'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_size',
    },
    description: 'Three-player ensemble',
    examples: [
      'trio texture',
      'three-part harmony',
      'reduce to trio',
      'three voices',
    ],
  },
  {
    id: createLexemeId('noun', 'quartet'),
    lemma: 'quartet',
    variants: ['four players', 'foursome'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_size',
    },
    description: 'Four-player ensemble',
    examples: [
      'quartet texture',
      'four-part harmony',
      'string quartet',
      'jazz quartet',
    ],
  },
  {
    id: createLexemeId('noun', 'quintet'),
    lemma: 'quintet',
    variants: ['five players', 'fivesome'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_size',
    },
    description: 'Five-player ensemble',
    examples: [
      'quintet texture',
      'wind quintet',
      'brass quintet',
      'five voices',
    ],
  },
  {
    id: createLexemeId('noun', 'chamber'),
    lemma: 'chamber',
    variants: ['chamber ensemble', 'small ensemble', 'intimate group'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_type',
    },
    description: 'Chamber ensemble (typically 2-10 players)',
    examples: [
      'chamber texture',
      'chamber group',
      'intimate ensemble',
      'chamber music',
    ],
  },
  {
    id: createLexemeId('noun', 'orchestra'),
    lemma: 'orchestra',
    variants: ['orchestral', 'full orchestra', 'symphonic'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_type',
    },
    description: 'Full orchestra (strings, winds, brass, percussion)',
    examples: [
      'orchestral texture',
      'full orchestra',
      'symphonic sound',
      'orchestrate',
    ],
  },
  {
    id: createLexemeId('noun', 'big_band'),
    lemma: 'big band',
    variants: ['jazz orchestra', 'large jazz ensemble'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'ensemble_type',
    },
    description: 'Big band jazz ensemble (saxes, brass, rhythm)',
    examples: [
      'big band arrangement',
      'swing band',
      'jazz orchestra',
      'section soli',
    ],
  },
];

// =============================================================================
// Instrumental Combinations and Voicing
// =============================================================================

/**
 * Instrumental combination and voicing descriptors.
 *
 * Covers:
 * - Doubling and unison
 * - Contrast and blend
 * - Voicing techniques
 * - Instrumental pairing
 */
const COMBINATION_VOICING_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'double'),
    lemma: 'double',
    variants: ['doubled', 'doubling', 'in octaves'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('double_part'),
      role: 'main',
    },
    description: 'Double an instrumental line (same or octave)',
    examples: [
      'double the melody',
      'double in octaves',
      'add doubling',
      'double with bass',
    ],
  },
  {
    id: createLexemeId('noun', 'unison'),
    lemma: 'unison',
    variants: ['in unison', 'together', 'same pitch'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'voicing',
    },
    description: 'Multiple instruments playing the same pitch',
    examples: [
      'play in unison',
      'unison passage',
      'all together',
      'same note',
    ],
  },
  {
    id: createLexemeId('adj', 'tutti'),
    lemma: 'tutti',
    variants: ['all', 'everyone', 'full ensemble'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('ensemble_size'),
      direction: 'increase',
    },
    description: 'All instruments playing together (tutti)',
    examples: [
      'tutti passage',
      'all instruments',
      'full ensemble',
      'everyone plays',
    ],
  },
  {
    id: createLexemeId('adj', 'soli'),
    lemma: 'soli',
    variants: ['section solo', 'small group', 'featured section'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'texture',
    },
    description: 'Small section or group featured (soli)',
    examples: [
      'soli passage',
      'section feature',
      'small group',
      'winds soli',
    ],
  },
  {
    id: createLexemeId('adj', 'homophonic'),
    lemma: 'homophonic',
    variants: ['chordal', 'block chords', 'vertical'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'texture',
    },
    description: 'Homophonic texture (melody with accompaniment)',
    examples: [
      'homophonic texture',
      'chordal accompaniment',
      'block chords',
      'vertical harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'polyphonic'),
    lemma: 'polyphonic',
    variants: ['contrapuntal', 'independent lines', 'horizontal'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'texture',
    },
    description: 'Polyphonic texture (multiple independent lines)',
    examples: [
      'polyphonic texture',
      'contrapuntal writing',
      'independent voices',
      'horizontal lines',
    ],
  },
  {
    id: createLexemeId('adj', 'antiphonal'),
    lemma: 'antiphonal',
    variants: ['call and response', 'alternating', 'back and forth'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'texture',
    },
    description: 'Antiphonal texture (alternating groups)',
    examples: [
      'antiphonal texture',
      'call and response',
      'alternating sections',
      'back and forth',
    ],
  },
  {
    id: createLexemeId('adj', 'hocket'),
    lemma: 'hocket',
    variants: ['hocketing', 'shared melody', 'interleaved'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'technique',
    },
    description: 'Hocket technique (melody divided between voices)',
    examples: [
      'hocket the melody',
      'shared between voices',
      'interleaved notes',
      'fragmented line',
    ],
  },
];

// =============================================================================
// Orchestral Sections and Roles
// =============================================================================

/**
 * Orchestral section and instrumental role descriptors.
 *
 * Covers:
 * - Melody vs accompaniment
 * - Lead vs background
 * - Support roles
 * - Textural functions
 */
const SECTION_ROLE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'melody'),
    lemma: 'melody',
    variants: ['melodic line', 'tune', 'lead line', 'main voice'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Melodic role (primary thematic material)',
    examples: [
      'carry the melody',
      'melodic line',
      'play the tune',
      'lead voice',
    ],
  },
  {
    id: createLexemeId('noun', 'accompaniment'),
    lemma: 'accompaniment',
    variants: ['background', 'support', 'backing'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Accompaniment role (supporting harmony/rhythm)',
    examples: [
      'add accompaniment',
      'background texture',
      'supporting role',
      'backing parts',
    ],
  },
  {
    id: createLexemeId('noun', 'countermelody'),
    lemma: 'countermelody',
    variants: ['counter-line', 'secondary melody', 'obligato'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Countermelody role (secondary melodic line)',
    examples: [
      'add countermelody',
      'counter-line',
      'secondary melody',
      'obligato part',
    ],
  },
  {
    id: createLexemeId('noun', 'bass_line'),
    lemma: 'bass line',
    variants: ['bassline', 'bass', 'foundation', 'root motion'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Bass line role (harmonic foundation)',
    examples: [
      'strong bass line',
      'bassline groove',
      'foundation',
      'root movement',
    ],
  },
  {
    id: createLexemeId('noun', 'inner_voices'),
    lemma: 'inner voices',
    variants: ['inner parts', 'middle voices', 'filler'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Inner voice role (filling harmonies)',
    examples: [
      'inner voices',
      'middle parts',
      'fill harmony',
      'inner texture',
    ],
  },
  {
    id: createLexemeId('noun', 'pedal'),
    lemma: 'pedal',
    variants: ['pedal point', 'sustained note', 'drone'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Pedal point role (sustained pitch)',
    examples: [
      'add pedal',
      'pedal point',
      'sustained note',
      'drone bass',
    ],
  },
  {
    id: createLexemeId('noun', 'ostinato'),
    lemma: 'ostinato',
    variants: ['repeated pattern', 'riff', 'loop'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Ostinato role (repeated melodic/rhythmic pattern)',
    examples: [
      'add ostinato',
      'repeated pattern',
      'riff',
      'looping figure',
    ],
  },
  {
    id: createLexemeId('adj', 'punctuating'),
    lemma: 'punctuating',
    variants: ['accenting', 'highlighting', 'stab', 'hit'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'role',
    },
    description: 'Punctuating role (accents and highlights)',
    examples: [
      'punctuating brass',
      'accent hits',
      'stabs',
      'highlighting moments',
    ],
  },
];

// =============================================================================
// Spacing and Register Distribution
// =============================================================================

/**
 * Voicing spacing and register distribution descriptors.
 *
 * Covers:
 * - Close vs open voicing
 * - Register spread
 * - Vertical density
 * - Spacing techniques
 */
const SPACING_REGISTER_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'close_voicing'),
    lemma: 'close',
    variants: ['close voicing', 'tight', 'compact', 'narrow'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('voicing_spread'),
      direction: 'decrease',
    },
    description: 'Close voicing (voices within an octave)',
    examples: [
      'close voicing',
      'tight harmony',
      'compact spacing',
      'voices close together',
    ],
  },
  {
    id: createLexemeId('adj', 'open_voicing'),
    lemma: 'open',
    variants: ['open voicing', 'spread', 'wide', 'spacious'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('voicing_spread'),
      direction: 'increase',
    },
    description: 'Open voicing (voices spread over wider range)',
    examples: [
      'open voicing',
      'spread out',
      'wide spacing',
      'spacious harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'drop_voicing'),
    lemma: 'drop',
    variants: ['drop-2', 'drop-3', 'dropped voice'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'voicing_technique',
    },
    description: 'Drop voicing technique (lowering inner voices)',
    examples: [
      'drop-2 voicing',
      'drop the second voice',
      'drop voicing',
      'lower inner voice',
    ],
  },
  {
    id: createLexemeId('adj', 'quartl_voicing'),
    lemma: 'quartal',
    variants: ['fourths', 'stacked fourths', 'quartal harmony'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'instrumentation',
      aspect: 'voicing_technique',
    },
    description: 'Quartal voicing (built in fourths)',
    examples: [
      'quartal voicing',
      'fourths harmony',
      'stacked fourths',
      'quartal chords',
    ],
  },
  {
    id: createLexemeId('adj', 'dense'),
    lemma: 'dense',
    variants: ['thick', 'heavy', 'filled', 'full'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('vertical_density'),
      direction: 'increase',
    },
    description: 'Dense voicing (many voices/notes)',
    examples: [
      'dense harmony',
      'thick texture',
      'heavy orchestration',
      'filled out',
    ],
  },
  {
    id: createLexemeId('adj', 'sparse'),
    lemma: 'sparse',
    variants: ['thin', 'light', 'skeletal', 'minimal'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('vertical_density'),
      direction: 'decrease',
    },
    description: 'Sparse voicing (few voices/notes)',
    examples: [
      'sparse texture',
      'thin harmony',
      'light orchestration',
      'skeletal arrangement',
    ],
  },
  {
    id: createLexemeId('adj', 'low_register'),
    lemma: 'low',
    variants: ['bass register', 'deep', 'bottom', 'low range'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('register_center'),
      direction: 'decrease',
    },
    description: 'Low register placement',
    examples: [
      'low register',
      'bass range',
      'deep voicing',
      'bottom end',
    ],
  },
  {
    id: createLexemeId('adj', 'high_register'),
    lemma: 'high',
    variants: ['treble register', 'bright', 'top', 'high range'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('register_center'),
      direction: 'increase',
    },
    description: 'High register placement',
    examples: [
      'high register',
      'treble range',
      'bright voicing',
      'top end',
    ],
  },
];

// =============================================================================
// Export Combined Vocabulary
// =============================================================================

/**
 * All instrumentation and orchestration vocabulary entries from Batch 62.
 */
export const INSTRUMENTATION_ORCHESTRATION_BATCH_62: readonly Lexeme[] = [
  ...INSTRUMENT_FAMILY_LEXEMES,
  ...ENSEMBLE_SIZE_LEXEMES,
  ...COMBINATION_VOICING_LEXEMES,
  ...SECTION_ROLE_LEXEMES,
  ...SPACING_REGISTER_LEXEMES,
];

/**
 * Count of entries in Batch 62.
 */
export const BATCH_62_COUNT = INSTRUMENTATION_ORCHESTRATION_BATCH_62.length;

/**
 * Batch 62 summary for documentation.
 */
export const BATCH_62_SUMMARY = {
  batchNumber: 62,
  name: 'Instrumentation and Orchestration Descriptors',
  entryCount: BATCH_62_COUNT,
  categories: [
    'Instrument families (strings, brass, woodwinds, etc.)',
    'Ensemble sizes and types (solo, duo, quartet, orchestra, etc.)',
    'Instrumental combinations and voicing (doubling, unison, tutti, etc.)',
    'Orchestral sections and roles (melody, accompaniment, countermelody, etc.)',
    'Spacing and register distribution (close/open voicing, dense/sparse, etc.)',
  ],
  axesIntroduced: [
    'ensemble_size',
    'voicing_spread',
    'vertical_density',
    'register_center',
  ],
  conceptsDefined: [
    'instrument_families',
    'ensemble_types',
    'voicing_techniques',
    'textural_roles',
    'orchestral_functions',
  ],
} as const;
