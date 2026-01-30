/**
 * GOFAI Canon — Domain Nouns Batch 30: Musical Gestures and Idiomatic Phrases
 *
 * Comprehensive enumeration of musical gestures, idiomatic phrases, conventional
 * patterns, and stock musical moves that musicians use to describe and request
 * specific musical actions. This batch systematically catalogs the "vocabulary
 * of moves" that transcends specific genres.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md Phase 1
 * to build comprehensive natural language coverage for musical editing commands.
 *
 * Categories covered:
 * - Build/release patterns (builds, drops, breakdowns)
 * - Fill patterns (drum fills, melodic fills, transition fills)
 * - Rhythmic gestures (hits, stabs, punches, kicks)
 * - Melodic gestures (runs, riffs, licks, motifs)
 * - Harmonic gestures (turnarounds, cadences, progressions)
 * - Textural gestures (swells, fades, blooms, washes)
 * - Transitional gestures (pickups, pushes, pulls, lifts)
 * - Dynamic gestures (crescendos, diminuendos, accents)
 * - Spatial gestures (panning moves, width changes, depth shifts)
 * - Genre-specific gestures (jazz comping, rock power chords, EDM risers)
 *
 * Reference: gofai_goalB.md Step 098 (vocab coverage), gofaimusicplus.md §4.5
 *
 * @module gofai/canon/domain-nouns-batch30-gestures
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Musical gesture lexeme.
 */
export interface GestureLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun';
  readonly semantics: {
    readonly type: 'gesture' | 'pattern' | 'move' | 'idiom';
    readonly function: string;
    readonly affects: readonly string[];
    readonly typicalDuration?: string;
    readonly typicalPlacement?: string;
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
  readonly relatedGestures?: readonly string[];
}

// =============================================================================
// Build and Release Patterns
// =============================================================================

export const BUILD_RELEASE_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'build'),
    lemma: 'build',
    variants: ['buildup', 'build-up', 'building', 'ramp up', 'climb'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'increase_intensity',
      affects: ['energy', 'density', 'dynamics', 'tension'],
      typicalDuration: '4-16 bars',
      typicalPlacement: 'pre-chorus, pre-drop'
    },
    description: 'Gradual increase in intensity leading to a climax',
    examples: [
      'add a build before the drop',
      'create a buildup in the second verse',
      'make the build more intense'
    ],
    musicalContext: ['EDM', 'rock', 'pop', 'orchestral'],
    relatedGestures: ['riser', 'crescendo', 'lift']
  },
  {
    id: createLexemeId('gesture', 'drop'),
    lemma: 'drop',
    variants: ['the drop', 'beat drop', 'bass drop', 'drop section'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'release_tension',
      affects: ['energy', 'density', 'dynamics', 'bass'],
      typicalDuration: '4-8 bars',
      typicalPlacement: 'after build'
    },
    description: 'Sudden release of built tension, typically with heavy bass',
    examples: [
      'make the drop hit harder',
      'add more bass to the drop',
      'delay the drop by two bars'
    ],
    musicalContext: ['EDM', 'dubstep', 'trap', 'bass music'],
    relatedGestures: ['release', 'payoff', 'climax']
  },
  {
    id: createLexemeId('gesture', 'breakdown'),
    lemma: 'breakdown',
    variants: ['break down', 'strip down', 'reduction'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'reduce_texture',
      affects: ['density', 'arrangement', 'layers'],
      typicalDuration: '4-8 bars',
      typicalPlacement: 'mid-section'
    },
    description: 'Stripping away layers to create contrast and breathing room',
    examples: [
      'add a breakdown in the middle',
      'make the breakdown more minimal',
      'extend the breakdown by four bars'
    ],
    musicalContext: ['EDM', 'metal', 'rock', 'electronic'],
    relatedGestures: ['strip', 'thin out', 'reduce']
  },
  {
    id: createLexemeId('gesture', 'riser'),
    lemma: 'riser',
    variants: ['rise', 'sweep up', 'upward sweep', 'ascending sweep'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'create_anticipation',
      affects: ['tension', 'pitch', 'energy'],
      typicalDuration: '1-4 bars',
      typicalPlacement: 'before drop or section change'
    },
    description: 'Upward-sweeping sound creating anticipation',
    examples: [
      'add a riser before the drop',
      'make the riser more dramatic',
      'use a white noise riser'
    ],
    musicalContext: ['EDM', 'electronic', 'trailer music'],
    relatedGestures: ['build', 'sweep', 'crescendo']
  },
  {
    id: createLexemeId('gesture', 'impact'),
    lemma: 'impact',
    variants: ['hit', 'impact hit', 'downbeat hit', 'crash'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'emphasize_arrival',
      affects: ['dynamics', 'articulation'],
      typicalDuration: 'instantaneous',
      typicalPlacement: 'downbeat of section'
    },
    description: 'Strong percussive hit marking important moment',
    examples: [
      'add an impact on the downbeat',
      'make the impact heavier',
      'layer impacts with the drop'
    ],
    musicalContext: ['EDM', 'trailer music', 'cinematic', 'hybrid'],
    relatedGestures: ['stab', 'hit', 'crash']
  },
  {
    id: createLexemeId('gesture', 'swell'),
    lemma: 'swell',
    variants: ['pad swell', 'string swell', 'crescendo swell'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'gradual_increase',
      affects: ['dynamics', 'density', 'volume'],
      typicalDuration: '1-4 bars',
      typicalPlacement: 'transitional'
    },
    description: 'Gradual volume increase, often in pads or strings',
    examples: [
      'add a pad swell',
      'make the string swell longer',
      'automate a swell before the chorus'
    ],
    musicalContext: ['ambient', 'cinematic', 'pop', 'orchestral'],
    relatedGestures: ['crescendo', 'bloom', 'rise']
  },
  {
    id: createLexemeId('gesture', 'release'),
    lemma: 'release',
    variants: ['tension release', 'drop off', 'let go'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'resolve_tension',
      affects: ['tension', 'dynamics', 'density'],
      typicalDuration: '1-2 bars',
      typicalPlacement: 'after build'
    },
    description: 'Moment of resolution after built tension',
    examples: [
      'add a release after the build',
      'make the release more satisfying',
      'delay the release'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['drop', 'resolution', 'payoff']
  },
  {
    id: createLexemeId('gesture', 'lift'),
    lemma: 'lift',
    variants: ['lift section', 'raising', 'elevation', 'lift-off'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'increase_elevation',
      affects: ['register', 'energy', 'emotion'],
      typicalDuration: '4-8 bars',
      typicalPlacement: 'transition or climax'
    },
    description: 'Upward shift in register or emotional intensity',
    examples: [
      'add a lift in the final chorus',
      'make the bridge lift higher',
      'create more lift going into verse 2'
    ],
    musicalContext: ['pop', 'gospel', 'R&B', 'soul'],
    relatedGestures: ['rise', 'elevation', 'climb']
  },
  {
    id: createLexemeId('gesture', 'push'),
    lemma: 'push',
    variants: ['pushing', 'drive forward', 'propel'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'increase_forward_motion',
      affects: ['rhythm', 'energy', 'momentum'],
      typicalDuration: '2-4 bars',
      typicalPlacement: 'transitional'
    },
    description: 'Increased rhythmic momentum driving forward',
    examples: [
      'add a push into the chorus',
      'make the drums push harder',
      'create forward push'
    ],
    musicalContext: ['rock', 'pop', 'funk', 'jazz'],
    relatedGestures: ['drive', 'propel', 'accelerate']
  },
  {
    id: createLexemeId('gesture', 'pull-back'),
    lemma: 'pull-back',
    variants: ['pull back', 'hold back', 'retreat', 'ease off'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'decrease_intensity',
      affects: ['energy', 'density', 'dynamics'],
      typicalDuration: '2-4 bars',
      typicalPlacement: 'after climax'
    },
    description: 'Sudden or gradual reduction in intensity',
    examples: [
      'pull back after the chorus',
      'add a pull-back in the bridge',
      'make the transition pull back more'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['breakdown', 'strip', 'reduce']
  },
];

// =============================================================================
// Fill Patterns
// =============================================================================

export const FILL_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'drum-fill'),
    lemma: 'drum fill',
    variants: ['fill', 'tom fill', 'snare fill', 'cymbal fill'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'mark_transition',
      affects: ['rhythm', 'transition', 'articulation'],
      typicalDuration: '0.5-2 bars',
      typicalPlacement: 'end of section'
    },
    description: 'Rhythmic pattern marking transition between sections',
    examples: [
      'add a drum fill before the chorus',
      'make the fill more complex',
      'use tom fills for transitions'
    ],
    musicalContext: ['rock', 'pop', 'jazz', 'funk'],
    relatedGestures: ['break', 'flourish', 'turnaround']
  },
  {
    id: createLexemeId('gesture', 'melodic-fill'),
    lemma: 'melodic fill',
    variants: ['vocal fill', 'guitar fill', 'piano fill', 'horn fill'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'fill_space',
      affects: ['melody', 'harmony', 'texture'],
      typicalDuration: '0.5-2 bars',
      typicalPlacement: 'between phrases'
    },
    description: 'Melodic embellishment filling space between vocal phrases',
    examples: [
      'add guitar fills between vocals',
      'insert piano fills',
      'make the fills more interesting'
    ],
    musicalContext: ['blues', 'jazz', 'soul', 'R&B'],
    relatedGestures: ['lick', 'run', 'embellishment']
  },
  {
    id: createLexemeId('gesture', 'transition-fill'),
    lemma: 'transition fill',
    variants: ['transitional fill', 'connecting fill', 'bridge fill'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'smooth_transition',
      affects: ['form', 'flow', 'continuity'],
      typicalDuration: '1-2 bars',
      typicalPlacement: 'between sections'
    },
    description: 'Fill pattern specifically bridging two sections',
    examples: [
      'add a transition fill',
      'smooth out the section change with a fill',
      'create a connecting fill'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['bridge', 'link', 'connector']
  },
  {
    id: createLexemeId('gesture', 'pickup'),
    lemma: 'pickup',
    variants: ['pickup notes', 'anacrusis', 'lead-in', 'upbeat'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'anticipate_phrase',
      affects: ['phrasing', 'timing', 'flow'],
      typicalDuration: '1-4 beats',
      typicalPlacement: 'before downbeat'
    },
    description: 'Notes leading into the downbeat of a phrase',
    examples: [
      'add a pickup before the verse',
      'use pickup notes for the melody',
      'create a pickup fill'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['anacrusis', 'lead-in', 'approach']
  },
];

// =============================================================================
// Rhythmic Gestures
// =============================================================================

export const RHYTHMIC_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'stab'),
    lemma: 'stab',
    variants: ['chord stab', 'horn stab', 'synth stab', 'staccato hit'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'rhythmic_accent',
      affects: ['rhythm', 'articulation', 'emphasis'],
      typicalDuration: 'instantaneous',
      typicalPlacement: 'rhythmic accents'
    },
    description: 'Short, sharp chord or note emphasizing rhythm',
    examples: [
      'add horn stabs on the offbeats',
      'create synth stabs',
      'make the stabs more percussive'
    ],
    musicalContext: ['funk', 'disco', 'house', 'soul'],
    relatedGestures: ['hit', 'punch', 'accent']
  },
  {
    id: createLexemeId('gesture', 'punch'),
    lemma: 'punch',
    variants: ['punch-in', 'hit', 'attack', 'accent'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'emphasize_beat',
      affects: ['dynamics', 'articulation', 'impact'],
      typicalDuration: 'instantaneous',
      typicalPlacement: 'downbeats or accents'
    },
    description: 'Strong rhythmic accent with sharp attack',
    examples: [
      'add punches on the downbeats',
      'make the kicks punch harder',
      'create a punchy rhythm'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['stab', 'hit', 'accent']
  },
  {
    id: createLexemeId('gesture', 'roll'),
    lemma: 'roll',
    variants: ['drum roll', 'snare roll', 'cymbal roll', 'crescendo roll'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'create_momentum',
      affects: ['rhythm', 'tension', 'energy'],
      typicalDuration: '1-4 beats',
      typicalPlacement: 'before downbeat'
    },
    description: 'Rapid repetition creating momentum toward a downbeat',
    examples: [
      'add a snare roll before the chorus',
      'use tom rolls for transitions',
      'make the roll more dramatic'
    ],
    musicalContext: ['orchestral', 'rock', 'marching'],
    relatedGestures: ['tremolo', 'flourish', 'build']
  },
  {
    id: createLexemeId('gesture', 'shuffle'),
    lemma: 'shuffle',
    variants: ['shuffle feel', 'swing eighths', 'triplet feel'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'rhythmic_feel',
      affects: ['rhythm', 'groove', 'timing'],
      typicalDuration: 'continuous',
      typicalPlacement: 'throughout section'
    },
    description: 'Swung eighth-note rhythm pattern',
    examples: [
      'add shuffle to the drums',
      'make the groove shuffle more',
      'use a shuffle feel'
    ],
    musicalContext: ['blues', 'jazz', 'swing'],
    relatedGestures: ['swing', 'bounce', 'groove']
  },
  {
    id: createLexemeId('gesture', 'syncopation'),
    lemma: 'syncopation',
    variants: ['syncopated rhythm', 'offbeat accent', 'rhythmic displacement'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'rhythmic_interest',
      affects: ['rhythm', 'groove', 'surprise'],
      typicalDuration: 'varies',
      typicalPlacement: 'offbeats'
    },
    description: 'Emphasis on weak beats or offbeats',
    examples: [
      'add more syncopation',
      'syncopate the rhythm',
      'use syncopated accents'
    ],
    musicalContext: ['all genres'],
    relatedGestures: ['offbeat', 'displacement', 'anticipation']
  },
  {
    id: createLexemeId('gesture', 'hocket'),
    lemma: 'hocket',
    variants: ['hocketing', 'interlocking rhythm', 'split melody'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'rhythmic_interplay',
      affects: ['rhythm', 'texture', 'interplay'],
      typicalDuration: 'continuous',
      typicalPlacement: 'throughout section'
    },
    description: 'Melody split between multiple voices in rhythmic alternation',
    examples: [
      'create hocketing between instruments',
      'use hocket technique',
      'add interlocking rhythms'
    ],
    musicalContext: ['medieval', 'minimalist', 'African', 'gamelan'],
    relatedGestures: ['interlock', 'call-response', 'alternation']
  },
];

// =============================================================================
// Melodic Gestures
// =============================================================================

export const MELODIC_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'run'),
    lemma: 'run',
    variants: ['melodic run', 'scalar run', 'passage', 'flourish'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'melodic_embellishment',
      affects: ['melody', 'virtuosity', 'energy'],
      typicalDuration: '1-4 beats',
      typicalPlacement: 'between phrases or as embellishment'
    },
    description: 'Rapid scalar or arpeggiated melodic passage',
    examples: [
      'add vocal runs',
      'insert a piano run',
      'make the runs more elaborate'
    ],
    musicalContext: ['R&B', 'soul', 'gospel', 'classical'],
    relatedGestures: ['melisma', 'riff', 'lick']
  },
  {
    id: createLexemeId('gesture', 'riff'),
    lemma: 'riff',
    variants: ['guitar riff', 'bass riff', 'hook riff', 'ostinato'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'memorable_pattern',
      affects: ['melody', 'identity', 'memorability'],
      typicalDuration: '1-4 bars',
      typicalPlacement: 'repeated throughout'
    },
    description: 'Repeated melodic or rhythmic pattern defining a song',
    examples: [
      'create a guitar riff',
      'make the bass riff more prominent',
      'repeat the riff'
    ],
    musicalContext: ['rock', 'metal', 'blues', 'funk'],
    relatedGestures: ['lick', 'hook', 'motif']
  },
  {
    id: createLexemeId('gesture', 'lick'),
    lemma: 'lick',
    variants: ['guitar lick', 'blues lick', 'jazz lick', 'stock phrase'],
    category: 'noun',
    semantics: {
      type: 'idiom',
      function: 'idiomatic_phrase',
      affects: ['melody', 'style', 'genre_identity'],
      typicalDuration: '0.5-2 bars',
      typicalPlacement: 'fills or solos'
    },
    description: 'Short idiomatic melodic phrase characteristic of a style',
    examples: [
      'add a blues lick',
      'use jazz licks in the solo',
      'insert a country lick'
    ],
    musicalContext: ['blues', 'jazz', 'country', 'rock'],
    relatedGestures: ['riff', 'phrase', 'motif']
  },
  {
    id: createLexemeId('gesture', 'motif'),
    lemma: 'motif',
    variants: ['motive', 'melodic motif', 'rhythmic motif', 'theme'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'thematic_material',
      affects: ['melody', 'unity', 'development'],
      typicalDuration: '1-4 bars',
      typicalPlacement: 'thematic statements'
    },
    description: 'Short melodic or rhythmic idea used for development',
    examples: [
      'develop the motif',
      'repeat the melodic motif',
      'transform the motif'
    ],
    musicalContext: ['classical', 'film score', 'all genres'],
    relatedGestures: ['theme', 'cell', 'idea']
  },
  {
    id: createLexemeId('gesture', 'sequence'),
    lemma: 'sequence',
    variants: ['melodic sequence', 'sequential pattern', 'transposed repetition'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'melodic_development',
      affects: ['melody', 'development', 'direction'],
      typicalDuration: '2-8 bars',
      typicalPlacement: 'developmental sections'
    },
    description: 'Pattern repeated at different pitch levels',
    examples: [
      'create a melodic sequence',
      'use sequential repetition',
      'sequence the phrase upward'
    ],
    musicalContext: ['classical', 'baroque', 'all genres'],
    relatedGestures: ['pattern', 'transposition', 'development']
  },
  {
    id: createLexemeId('gesture', 'call-response'),
    lemma: 'call and response',
    variants: ['call-response', 'antiphony', 'question-answer'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'musical_dialogue',
      affects: ['melody', 'interplay', 'structure'],
      typicalDuration: '2-8 bars',
      typicalPlacement: 'throughout'
    },
    description: 'Musical dialogue between two voices or sections',
    examples: [
      'use call and response',
      'create call-response between vocals and guitar',
      'add antiphonal texture'
    ],
    musicalContext: ['blues', 'gospel', 'African', 'jazz'],
    relatedGestures: ['dialogue', 'antiphony', 'echo']
  },
];

// =============================================================================
// Harmonic Gestures
// =============================================================================

export const HARMONIC_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'turnaround'),
    lemma: 'turnaround',
    variants: ['chord turnaround', 'harmonic turnaround', 'I-VI-II-V'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'harmonic_cycle',
      affects: ['harmony', 'form', 'continuity'],
      typicalDuration: '2-4 bars',
      typicalPlacement: 'end of section'
    },
    description: 'Chord progression that cycles back to the beginning',
    examples: [
      'add a turnaround at the end',
      'use a jazz turnaround',
      'create a bluesy turnaround'
    ],
    musicalContext: ['blues', 'jazz', 'country'],
    relatedGestures: ['cycle', 'progression', 'loop']
  },
  {
    id: createLexemeId('gesture', 'cadence'),
    lemma: 'cadence',
    variants: ['authentic cadence', 'plagal cadence', 'deceptive cadence', 'half cadence'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'harmonic_resolution',
      affects: ['harmony', 'closure', 'punctuation'],
      typicalDuration: '1-2 bars',
      typicalPlacement: 'end of phrase'
    },
    description: 'Harmonic formula creating sense of conclusion',
    examples: [
      'add a perfect cadence',
      'use a deceptive cadence',
      'strengthen the cadence'
    ],
    musicalContext: ['classical', 'all genres'],
    relatedGestures: ['resolution', 'closure', 'ending']
  },
  {
    id: createLexemeId('gesture', 'pedal-point'),
    lemma: 'pedal point',
    variants: ['pedal', 'pedal tone', 'drone bass', 'sustained bass'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'harmonic_stability',
      affects: ['harmony', 'tension', 'foundation'],
      typicalDuration: '4+ bars',
      typicalPlacement: 'throughout section'
    },
    description: 'Sustained note (usually bass) while harmony changes above',
    examples: [
      'add a pedal point in the bass',
      'use a tonic pedal',
      'create tension with dominant pedal'
    ],
    musicalContext: ['classical', 'all genres'],
    relatedGestures: ['drone', 'ostinato', 'sustained']
  },
  {
    id: createLexemeId('gesture', 'vamp'),
    lemma: 'vamp',
    variants: ['vamping', 'ostinato', 'repeating pattern', 'cyclic pattern'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'harmonic_repetition',
      affects: ['harmony', 'groove', 'foundation'],
      typicalDuration: 'continuous',
      typicalPlacement: 'throughout section'
    },
    description: 'Repeated chord progression or pattern',
    examples: [
      'vamp on two chords',
      'create a vamping pattern',
      'extend the vamp'
    ],
    musicalContext: ['jazz', 'funk', 'soul', 'gospel'],
    relatedGestures: ['ostinato', 'loop', 'cycle']
  },
  {
    id: createLexemeId('gesture', 'reharmonization'),
    lemma: 'reharmonization',
    variants: ['reharm', 'chord substitution', 'harmonic reinterpretation'],
    category: 'noun',
    semantics: {
      type: 'move',
      function: 'harmonic_variation',
      affects: ['harmony', 'color', 'sophistication'],
      typicalDuration: 'varies',
      typicalPlacement: 'anywhere'
    },
    description: 'Changing the harmony under existing melody',
    examples: [
      'reharmonize the chorus',
      'use jazz reharmonization',
      'add substitute chords'
    ],
    musicalContext: ['jazz', 'classical', 'pop'],
    relatedGestures: ['substitution', 'chord change', 'harmonic color']
  },
];

// =============================================================================
// Textural Gestures
// =============================================================================

export const TEXTURAL_GESTURES: readonly GestureLexeme[] = [
  {
    id: createLexemeId('gesture', 'wash'),
    lemma: 'wash',
    variants: ['pad wash', 'reverb wash', 'ambient wash', 'sonic wash'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'textural_fill',
      affects: ['texture', 'space', 'atmosphere'],
      typicalDuration: 'continuous',
      typicalPlacement: 'background'
    },
    description: 'Sustained atmospheric texture filling space',
    examples: [
      'add a reverb wash',
      'create an ambient wash',
      'use pad washes for atmosphere'
    ],
    musicalContext: ['ambient', 'electronic', 'cinematic'],
    relatedGestures: ['pad', 'atmosphere', 'texture']
  },
  {
    id: createLexemeId('gesture', 'bloom'),
    lemma: 'bloom',
    variants: ['blooming', 'opening', 'blossoming', 'unfolding'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'textural_expansion',
      affects: ['texture', 'density', 'space'],
      typicalDuration: '2-4 bars',
      typicalPlacement: 'transitional'
    },
    description: 'Gradual opening and expansion of texture',
    examples: [
      'create a bloom in the strings',
      'make the pads bloom',
      'add a blooming texture'
    ],
    musicalContext: ['ambient', 'orchestral', 'cinematic'],
    relatedGestures: ['swell', 'expansion', 'opening']
  },
  {
    id: createLexemeId('gesture', 'shimmer'),
    lemma: 'shimmer',
    variants: ['shimmering', 'sparkle', 'glisten', 'twinkle'],
    category: 'noun',
    semantics: {
      type: 'gesture',
      function: 'textural_decoration',
      affects: ['texture', 'timbre', 'brightness'],
      typicalDuration: 'continuous',
      typicalPlacement: 'decoration'
    },
    description: 'High-frequency textural decoration with movement',
    examples: [
      'add shimmer to the pads',
      'create shimmering textures',
      'make the high end shimmer'
    ],
    musicalContext: ['electronic', 'ambient', 'pop'],
    relatedGestures: ['sparkle', 'glitter', 'high decoration']
  },
  {
    id: createLexemeId('gesture', 'pulse'),
    lemma: 'pulse',
    variants: ['pulsing', 'rhythmic pulse', 'throbbing', 'pumping'],
    category: 'noun',
    semantics: {
      type: 'pattern',
      function: 'rhythmic_texture',
      affects: ['rhythm', 'texture', 'energy'],
      typicalDuration: 'continuous',
      typicalPlacement: 'throughout'
    },
    description: 'Rhythmic textural pattern creating forward motion',
    examples: [
      'add a pulsing synth',
      'create pulse in the pads',
      'make the bass pulse'
    ],
    musicalContext: ['electronic', 'minimalist', 'techno'],
    relatedGestures: ['throb', 'pump', 'oscillate']
  },
];

// =============================================================================
// Module Exports
// =============================================================================

export const DOMAIN_NOUNS_BATCH_30: readonly GestureLexeme[] = [
  ...BUILD_RELEASE_GESTURES,
  ...FILL_GESTURES,
  ...RHYTHMIC_GESTURES,
  ...MELODIC_GESTURES,
  ...HARMONIC_GESTURES,
  ...TEXTURAL_GESTURES,
];

export const BATCH_30_COUNT = DOMAIN_NOUNS_BATCH_30.length;
