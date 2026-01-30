/**
 * GOFAI Domain Nouns — Canonical Musical Terminology Inventory
 *
 * This module defines the canonical vocabulary of musical domain nouns
 * spanning multiple music theories, traditions, and practices. This is
 * the SSOT for all musical terminology used in natural language parsing.
 *
 * Design principles:
 * - Include terms from Western classical, jazz, pop, electronic, world music
 * - Include both formal music theory and colloquial/studio terminology
 * - Map synonyms and variants to canonical forms
 * - Provide clear definitions and usage examples
 * - Link to semantic types for compositional semantics
 *
 * @module gofai/canon/domain-nouns
 */

import {
  type LexemeId,
  createLexemeId,
  type VocabularyTable,
  createVocabularyTable,
} from './types';

// =============================================================================
// Domain Noun Types
// =============================================================================

/**
 * Categories of musical domain nouns.
 */
export type DomainNounCategory =
  // Structural categories
  | 'structure' // Overall form and section types
  | 'time' // Temporal divisions and references
  | 'rhythm' // Rhythmic patterns and feels
  | 'meter' // Time signatures and metric organization
  
  // Pitch and harmony categories
  | 'pitch' // Pitch classes and intervals
  | 'harmony' // Chords, progressions, functions
  | 'voice_leading' // Voice leading concepts
  | 'scale_mode' // Scales, modes, tonal systems
  
  // Melodic categories
  | 'melody' // Melodic shapes and phrases
  | 'motif' // Motivic material
  | 'ornament' // Decorative elements
  | 'contour' // Melodic shapes
  
  // Texture and arrangement categories
  | 'texture' // Density and layering
  | 'arrangement' // Orchestration concepts
  | 'role' // Functional roles in arrangement
  | 'layer' // Track/part types
  
  // Production and timbre categories
  | 'timbre' // Timbral qualities
  | 'production' // Studio/mixing concepts
  | 'effect' // Effects and processing
  | 'dynamics' // Dynamic markings and contours
  
  // Performance categories
  | 'articulation' // Note articulations
  | 'technique' // Performance techniques
  | 'expression' // Expressive qualities
  | 'feel' // Groove and feel types
  
  // Genre and style categories
  | 'genre' // Genre names
  | 'style' // Style descriptors
  | 'idiom' // Idiomatic patterns
  | 'device' // Compositional devices
  
  // World music categories
  | 'world_rhythm' // Non-Western rhythmic concepts
  | 'world_scale' // Non-Western scales/modes
  | 'world_form' // Non-Western forms
  | 'world_technique'; // Non-Western techniques

/**
 * Semantic type mapping for domain nouns.
 */
export type DomainNounSemantics =
  | { type: 'entity_ref'; entityType: string }
  | { type: 'property'; propertyOf: string }
  | { type: 'process'; processType: string }
  | { type: 'pattern'; patternType: string }
  | { type: 'quality'; qualityDimension: string };

/**
 * A domain noun entry in the vocabulary.
 */
export interface DomainNoun {
  /** Stable identifier */
  readonly id: LexemeId;

  /** Canonical term */
  readonly term: string;

  /** Variant forms (synonyms, abbreviations, inflections) */
  readonly variants: readonly string[];

  /** Category */
  readonly category: DomainNounCategory;

  /** Definition */
  readonly definition: string;

  /** Semantic type */
  readonly semantics: DomainNounSemantics;

  /** Usage examples */
  readonly examples: readonly string[];

  /** Related terms */
  readonly relatedTerms?: readonly LexemeId[];

  /** Musical tradition/origin */
  readonly tradition?: string;

  /** Whether deprecated */
  readonly deprecated?: boolean;
}

// =============================================================================
// Core Structural Terms (Batch 1)
// =============================================================================

const STRUCTURE_NOUNS: readonly DomainNoun[] = [
  {
    id: createLexemeId('noun', 'intro'),
    term: 'intro',
    variants: ['introduction', 'opening', 'lead-in'],
    category: 'structure',
    definition: 'Opening section of a composition',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['shorten the intro', 'add energy to the intro'],
  },
  {
    id: createLexemeId('noun', 'verse'),
    term: 'verse',
    variants: ['stanza', 'verse section'],
    category: 'structure',
    definition: 'Primary narrative section, typically repeated with different lyrics',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['brighten the second verse', 'keep the verse simple'],
  },
  {
    id: createLexemeId('noun', 'chorus'),
    term: 'chorus',
    variants: ['refrain', 'hook section'],
    category: 'structure',
    definition: 'Main repeated section with consistent lyrics and melody',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['widen the chorus', 'make the chorus hit harder'],
  },
  {
    id: createLexemeId('noun', 'bridge'),
    term: 'bridge',
    variants: ['middle eight', 'channel'],
    category: 'structure',
    definition: 'Contrasting section providing variety before final chorus',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['add tension to the bridge', 'simplify the bridge arrangement'],
  },
  {
    id: createLexemeId('noun', 'pre-chorus'),
    term: 'pre-chorus',
    variants: ['pre-hook', 'climb', 'setup', 'prechorus'],
    category: 'structure',
    definition: 'Transitional section building toward the chorus',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['add lift to the pre-chorus', 'tighten the pre-chorus'],
  },
  {
    id: createLexemeId('noun', 'outro'),
    term: 'outro',
    variants: ['ending', 'coda', 'conclusion', 'outro section'],
    category: 'structure',
    definition: 'Closing section of a composition',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['fade out the outro', 'extend the outro'],
  },
  {
    id: createLexemeId('noun', 'breakdown'),
    term: 'breakdown',
    variants: ['break', 'drop section'],
    category: 'structure',
    definition: 'Section with reduced instrumentation creating contrast',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['thin out the breakdown', 'add space to the breakdown'],
  },
  {
    id: createLexemeId('noun', 'buildup'),
    term: 'buildup',
    variants: ['build', 'riser section', 'climb'],
    category: 'structure',
    definition: 'Section building energy toward a climax or drop',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['intensify the buildup', 'add tension to the buildup'],
  },
  {
    id: createLexemeId('noun', 'drop'),
    term: 'drop',
    variants: ['the drop', 'drop section', 'climax'],
    category: 'structure',
    definition: 'High-energy section following a buildup, common in electronic music',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['make the drop hit harder', 'widen the drop'],
  },
  {
    id: createLexemeId('noun', 'interlude'),
    term: 'interlude',
    variants: ['instrumental break', 'intermission'],
    category: 'structure',
    definition: 'Brief instrumental or contrasting passage between sections',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['add an interlude', 'simplify the interlude'],
  },
  {
    id: createLexemeId('noun', 'hook'),
    term: 'hook',
    variants: ['earworm', 'catchy phrase', 'riff'],
    category: 'structure',
    definition: 'Memorable musical or lyrical phrase designed to catch attention',
    semantics: { type: 'pattern', patternType: 'melodic' },
    examples: ['preserve the hook', 'emphasize the hook'],
  },
  {
    id: createLexemeId('noun', 'tag'),
    term: 'tag',
    variants: ['tag ending', 'vamp ending'],
    category: 'structure',
    definition: 'Short repeated phrase at the end of a piece',
    semantics: { type: 'pattern', patternType: 'structural' },
    examples: ['add a tag', 'repeat the tag'],
  },
  {
    id: createLexemeId('noun', 'turnaround'),
    term: 'turnaround',
    variants: ['turnback', 'turnaround progression'],
    category: 'structure',
    definition: 'Short progression returning to the tonic or beginning',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['change the turnaround', 'simplify the turnaround'],
  },
  {
    id: createLexemeId('noun', 'vamp'),
    term: 'vamp',
    variants: ['groove section', 'ostinato section'],
    category: 'structure',
    definition: 'Repeated chord progression or pattern, often for improvisation',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['extend the vamp', 'thin out the vamp'],
  },
  {
    id: createLexemeId('noun', 'exposition'),
    term: 'exposition',
    variants: ['expository section'],
    category: 'structure',
    definition: 'Initial presentation of thematic material (classical form)',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['clarify the exposition'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'development'),
    term: 'development',
    variants: ['development section'],
    category: 'structure',
    definition: 'Section elaborating on themes (classical form)',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['add complexity to the development'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'recapitulation'),
    term: 'recapitulation',
    variants: ['recap', 'restatement'],
    category: 'structure',
    definition: 'Return of original theme (classical form)',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['prepare the recapitulation'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'coda'),
    term: 'coda',
    variants: ['tail', 'tag'],
    category: 'structure',
    definition: 'Concluding passage adding formal closure',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['extend the coda', 'add finality to the coda'],
  },
  {
    id: createLexemeId('noun', 'episode'),
    term: 'episode',
    variants: ['contrasting episode'],
    category: 'structure',
    definition: 'Contrasting section in rondo or fugue',
    semantics: { type: 'entity_ref', entityType: 'section' },
    examples: ['brighten the episode'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'refrain'),
    term: 'refrain',
    variants: ['repeated phrase'],
    category: 'structure',
    definition: 'Recurring line or phrase',
    semantics: { type: 'pattern', patternType: 'structural' },
    examples: ['emphasize the refrain'],
  },

  // Time-related nouns
  {
    id: createLexemeId('noun', 'bar'),
    term: 'bar',
    variants: ['measure', 'bars'],
    category: 'time',
    definition: 'Unit of time containing a specific number of beats',
    semantics: { type: 'entity_ref', entityType: 'range' },
    examples: ['extend by two bars', 'cut four bars'],
  },
  {
    id: createLexemeId('noun', 'beat'),
    term: 'beat',
    variants: ['pulse', 'beats'],
    category: 'time',
    definition: 'Basic unit of pulse in meter',
    semantics: { type: 'entity_ref', entityType: 'timepoint' },
    examples: ['shift by one beat', 'emphasize the downbeat'],
  },
  {
    id: createLexemeId('noun', 'downbeat'),
    term: 'downbeat',
    variants: ['one', 'strong beat'],
    category: 'time',
    definition: 'First beat of a measure, typically strongest',
    semantics: { type: 'entity_ref', entityType: 'timepoint' },
    examples: ['accent the downbeats', 'anticipate the downbeat'],
  },
  {
    id: createLexemeId('noun', 'upbeat'),
    term: 'upbeat',
    variants: ['pickup', 'anacrusis', 'weak beat'],
    category: 'time',
    definition: 'Beat preceding a downbeat, typically weaker',
    semantics: { type: 'entity_ref', entityType: 'timepoint' },
    examples: ['add upbeat anticipation', 'ghost the upbeats'],
  },
  {
    id: createLexemeId('noun', 'phrase'),
    term: 'phrase',
    variants: ['musical phrase', 'phrase unit'],
    category: 'time',
    definition: 'Complete musical thought, analogous to a sentence',
    semantics: { type: 'entity_ref', entityType: 'range' },
    examples: ['extend the phrase', 'shape the phrase'],
  },
  {
    id: createLexemeId('noun', 'period'),
    term: 'period',
    variants: ['musical period', 'phrase pair'],
    category: 'time',
    definition: 'Pair of phrases forming a complete statement',
    semantics: { type: 'entity_ref', entityType: 'range' },
    examples: ['balance the period'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'cadence'),
    term: 'cadence',
    variants: ['harmonic close', 'phrase ending'],
    category: 'time',
    definition: 'Harmonic or melodic conclusion to a phrase',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['strengthen the cadence', 'avoid the cadence'],
  },
  {
    id: createLexemeId('noun', 'fermata'),
    term: 'fermata',
    variants: ['hold', 'pause'],
    category: 'time',
    definition: 'Sustained note or rest beyond its normal duration',
    semantics: { type: 'process', processType: 'timing' },
    examples: ['add a fermata'],
  },
  {
    id: createLexemeId('noun', 'caesura'),
    term: 'caesura',
    variants: ['break', 'pause', 'railroad tracks'],
    category: 'time',
    definition: 'Brief silence or pause in the music',
    semantics: { type: 'entity_ref', entityType: 'event' },
    examples: ['insert a caesura', 'respect the caesura'],
  },

  // Rhythm nouns
  {
    id: createLexemeId('noun', 'rhythm'),
    term: 'rhythm',
    variants: ['rhythmic pattern', 'time pattern'],
    category: 'rhythm',
    definition: 'Pattern of durations and accents in time',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['simplify the rhythm', 'tighten the rhythm'],
  },
  {
    id: createLexemeId('noun', 'groove'),
    term: 'groove',
    variants: ['feel', 'pocket'],
    category: 'rhythm',
    definition: 'Rhythmic feel and microtiming character',
    semantics: { type: 'quality', qualityDimension: 'rhythmic_feel' },
    examples: ['lock in the groove', 'loosen the groove'],
  },
  {
    id: createLexemeId('noun', 'syncopation'),
    term: 'syncopation',
    variants: ['offbeat accent', 'syncopated rhythm'],
    category: 'rhythm',
    definition: 'Emphasis on weak beats or offbeats',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['add syncopation', 'reduce syncopation'],
  },
  {
    id: createLexemeId('noun', 'polyrhythm'),
    term: 'polyrhythm',
    variants: ['cross-rhythm', 'polymeter'],
    category: 'rhythm',
    definition: 'Simultaneous use of contrasting rhythms',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['introduce a polyrhythm', 'simplify the polyrhythm'],
  },
  {
    id: createLexemeId('noun', 'hemiola'),
    term: 'hemiola',
    variants: ['three-against-two', 'metric shift'],
    category: 'rhythm',
    definition: 'Rhythmic pattern superimposing triple over duple meter',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['add a hemiola', 'emphasize the hemiola'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'swing'),
    term: 'swing',
    variants: ['swing feel', 'shuffle'],
    category: 'rhythm',
    definition: 'Uneven rhythmic subdivision with lilting quality',
    semantics: { type: 'quality', qualityDimension: 'rhythmic_feel' },
    examples: ['add swing', 'adjust the swing amount'],
    tradition: 'Jazz',
  },
  {
    id: createLexemeId('noun', 'shuffle'),
    term: 'shuffle',
    variants: ['shuffle rhythm', 'shuffle feel'],
    category: 'rhythm',
    definition: 'Triplet-based swung rhythm',
    semantics: { type: 'quality', qualityDimension: 'rhythmic_feel' },
    examples: ['apply shuffle feel', 'tighten the shuffle'],
  },
  {
    id: createLexemeId('noun', 'ostinato'),
    term: 'ostinato',
    variants: ['repeated pattern', 'riff'],
    category: 'rhythm',
    definition: 'Persistently repeated musical pattern',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['vary the ostinato', 'keep the ostinato'],
  },
  {
    id: createLexemeId('noun', 'riff'),
    term: 'riff',
    variants: ['repeated phrase', 'ostinato', 'lick'],
    category: 'rhythm',
    definition: 'Short repeated melodic or rhythmic pattern',
    semantics: { type: 'pattern', patternType: 'melodic' },
    examples: ['emphasize the riff', 'vary the riff'],
  },
  {
    id: createLexemeId('noun', 'backbeat'),
    term: 'backbeat',
    variants: ['snare on 2 and 4', 'rock beat'],
    category: 'rhythm',
    definition: 'Emphasis on beats 2 and 4 in 4/4 time',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['strengthen the backbeat', 'accent the backbeat'],
  },
  {
    id: createLexemeId('noun', 'clave'),
    term: 'clave',
    variants: ['clave pattern', 'timeline'],
    category: 'rhythm',
    definition: 'Foundational rhythmic pattern in Afro-Cuban music',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['lock to the clave', 'follow the clave'],
    tradition: 'Afro-Cuban',
  },
  {
    id: createLexemeId('noun', 'montuno'),
    term: 'montuno',
    variants: ['montuno pattern'],
    category: 'rhythm',
    definition: 'Syncopated rhythmic pattern in Cuban music',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['add a montuno'],
    tradition: 'Afro-Cuban',
  },
  {
    id: createLexemeId('noun', 'tresillo'),
    term: 'tresillo',
    variants: ['habanera rhythm', '3-3-2 pattern'],
    category: 'rhythm',
    definition: 'Syncopated pattern: 3+3+2 eighth notes',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['use tresillo pattern'],
    tradition: 'Latin',
  },
  {
    id: createLexemeId('noun', 'dembow'),
    term: 'dembow',
    variants: ['dembow rhythm'],
    category: 'rhythm',
    definition: 'Syncopated pattern fundamental to reggaeton',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['apply dembow pattern'],
    tradition: 'Reggaeton',
  },
  {
    id: createLexemeId('noun', 'riddim'),
    term: 'riddim',
    variants: ['riddim track', 'rhythm track'],
    category: 'rhythm',
    definition: 'Instrumental accompaniment in reggae/dancehall',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['use riddim feel'],
    tradition: 'Reggae',
  },
  {
    id: createLexemeId('noun', 'samba'),
    term: 'samba',
    variants: ['samba rhythm', 'samba feel'],
    category: 'rhythm',
    definition: 'Brazilian dance rhythm pattern',
    semantics: { type: 'quality', qualityDimension: 'rhythmic_feel' },
    examples: ['apply samba feel'],
    tradition: 'Brazilian',
  },
  {
    id: createLexemeId('noun', 'bossa-nova'),
    term: 'bossa nova',
    variants: ['bossa', 'bossa rhythm'],
    category: 'rhythm',
    definition: 'Brazilian jazz-influenced rhythm',
    semantics: { type: 'quality', qualityDimension: 'rhythmic_feel' },
    examples: ['use bossa nova feel'],
    tradition: 'Brazilian',
  },
  {
    id: createLexemeId('noun', 'tala'),
    term: 'tala',
    variants: ['rhythmic cycle', 'tal'],
    category: 'rhythm',
    definition: 'Rhythmic cycle in Indian classical music',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['follow the tala'],
    tradition: 'Indian classical',
  },
  {
    id: createLexemeId('noun', 'cascara'),
    term: 'cascara',
    variants: ['cáscara', 'shell pattern'],
    category: 'rhythm',
    definition: 'Rhythm played on the shell of a timbale',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['add cascara pattern'],
    tradition: 'Latin',
  },

  // Meter nouns
  {
    id: createLexemeId('noun', 'meter'),
    term: 'meter',
    variants: ['time signature', 'metric organization'],
    category: 'meter',
    definition: 'Recurring pattern of strong and weak beats',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['change the meter', 'keep consistent meter'],
  },
  {
    id: createLexemeId('noun', 'time-signature'),
    term: 'time signature',
    variants: ['meter signature', 'metric notation'],
    category: 'meter',
    definition: 'Notational convention indicating meter',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['change to 3/4 time signature'],
  },
  {
    id: createLexemeId('noun', 'simple-meter'),
    term: 'simple meter',
    variants: ['simple time'],
    category: 'meter',
    definition: 'Meter with beats divisible by two',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['use simple meter'],
  },
  {
    id: createLexemeId('noun', 'compound-meter'),
    term: 'compound meter',
    variants: ['compound time'],
    category: 'meter',
    definition: 'Meter with beats divisible by three',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['switch to compound meter'],
  },
  {
    id: createLexemeId('noun', 'duple-meter'),
    term: 'duple meter',
    variants: ['two-beat meter'],
    category: 'meter',
    definition: 'Meter with two beats per measure',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['use duple meter'],
  },
  {
    id: createLexemeId('noun', 'triple-meter'),
    term: 'triple meter',
    variants: ['three-beat meter', 'waltz time'],
    category: 'meter',
    definition: 'Meter with three beats per measure',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['convert to triple meter'],
  },
  {
    id: createLexemeId('noun', 'quadruple-meter'),
    term: 'quadruple meter',
    variants: ['four-beat meter', 'common time'],
    category: 'meter',
    definition: 'Meter with four beats per measure',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['maintain quadruple meter'],
  },
  {
    id: createLexemeId('noun', 'mixed-meter'),
    term: 'mixed meter',
    variants: ['changing meter', 'metric modulation'],
    category: 'meter',
    definition: 'Use of different meters in succession',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['introduce mixed meter'],
  },
  {
    id: createLexemeId('noun', 'asymmetric-meter'),
    term: 'asymmetric meter',
    variants: ['irregular meter', 'odd meter'],
    category: 'meter',
    definition: 'Meter with irregular beat groupings (e.g., 5/4, 7/8)',
    semantics: { type: 'property', propertyOf: 'time' },
    examples: ['use asymmetric meter'],
  },
  {
    id: createLexemeId('noun', 'additive-rhythm'),
    term: 'additive rhythm',
    variants: ['aksak', 'unequal beats'],
    category: 'meter',
    definition: 'Rhythm built from unequal beat lengths (e.g., 2+2+3)',
    semantics: { type: 'pattern', patternType: 'rhythmic' },
    examples: ['apply additive rhythm'],
    tradition: 'Balkan',
  },

  // Pitch nouns
  {
    id: createLexemeId('noun', 'pitch'),
    term: 'pitch',
    variants: ['note', 'tone'],
    category: 'pitch',
    definition: 'Perceived frequency of a musical sound',
    semantics: { type: 'property', propertyOf: 'event' },
    examples: ['raise the pitch', 'adjust pitch contour'],
  },
  {
    id: createLexemeId('noun', 'note'),
    term: 'note',
    variants: ['tone', 'pitch'],
    category: 'pitch',
    definition: 'Single pitch with duration',
    semantics: { type: 'entity_ref', entityType: 'event' },
    examples: ['move the note up', 'extend the note'],
  },
  {
    id: createLexemeId('noun', 'interval'),
    term: 'interval',
    variants: ['pitch distance', 'melodic interval'],
    category: 'pitch',
    definition: 'Distance between two pitches',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['widen the intervals', 'narrow the interval'],
  },
  {
    id: createLexemeId('noun', 'octave'),
    term: 'octave',
    variants: ['eighth', 'diapason'],
    category: 'pitch',
    definition: 'Interval spanning eight scale degrees (2:1 frequency ratio)',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['transpose up an octave', 'double at the octave'],
  },
  {
    id: createLexemeId('noun', 'semitone'),
    term: 'semitone',
    variants: ['half step', 'half-tone'],
    category: 'pitch',
    definition: 'Smallest interval in Western equal temperament',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['raise by two semitones', 'shift down a semitone'],
  },
  {
    id: createLexemeId('noun', 'whole-tone'),
    term: 'whole tone',
    variants: ['whole step', 'tone'],
    category: 'pitch',
    definition: 'Interval of two semitones',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['move up a whole tone'],
  },
  {
    id: createLexemeId('noun', 'microtone'),
    term: 'microtone',
    variants: ['quarter tone', 'microtonal interval'],
    category: 'pitch',
    definition: 'Interval smaller than a semitone',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['add microtonal inflection'],
  },
  {
    id: createLexemeId('noun', 'unison'),
    term: 'unison',
    variants: ['same pitch', 'prime'],
    category: 'pitch',
    definition: 'Two or more voices on the same pitch',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['double in unison', 'merge to unison'],
  },
  {
    id: createLexemeId('noun', 'register'),
    term: 'register',
    variants: ['pitch range', 'tessitura'],
    category: 'pitch',
    definition: 'Specific range of pitches',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['raise the register', 'shift to lower register'],
  },
  {
    id: createLexemeId('noun', 'tessitura'),
    term: 'tessitura',
    variants: ['comfortable range', 'typical range'],
    category: 'pitch',
    definition: 'Range where a part predominantly lies',
    semantics: { type: 'property', propertyOf: 'pitch' },
    examples: ['adjust tessitura for comfort'],
    tradition: 'Western classical',
  },
  {
    id: createLexemeId('noun', 'intonation'),
    term: 'intonation',
    variants: ['tuning', 'pitch accuracy'],
    category: 'pitch',
    definition: 'Accuracy of pitch in performance',
    semantics: { type: 'quality', qualityDimension: 'pitch' },
    examples: ['correct the intonation', 'improve intonation'],
  },

  // Harmony nouns (first batch)
  {
    id: createLexemeId('noun', 'chord'),
    term: 'chord',
    variants: ['harmony', 'vertical sonority'],
    category: 'harmony',
    definition: 'Simultaneous combination of three or more pitches',
    semantics: { type: 'entity_ref', entityType: 'event_group' },
    examples: ['change the chord', 'add extensions to the chord'],
  },
  {
    id: createLexemeId('noun', 'triad'),
    term: 'triad',
    variants: ['three-note chord', 'basic chord'],
    category: 'harmony',
    definition: 'Three-note chord (root, third, fifth)',
    semantics: { type: 'entity_ref', entityType: 'event_group' },
    examples: ['use simple triads', 'voice the triad'],
  },
  {
    id: createLexemeId('noun', 'seventh-chord'),
    term: 'seventh chord',
    variants: ['tetrad', 'four-note chord', '7th chord'],
    category: 'harmony',
    definition: 'Four-note chord including a seventh',
    semantics: { type: 'entity_ref', entityType: 'event_group' },
    examples: ['resolve the seventh chord', 'add seventh chords'],
  },
  {
    id: createLexemeId('noun', 'extended-chord'),
    term: 'extended chord',
    variants: ['jazz chord', 'complex harmony'],
    category: 'harmony',
    definition: 'Chord with extensions beyond the seventh (9th, 11th, 13th)',
    semantics: { type: 'entity_ref', entityType: 'event_group' },
    examples: ['add extended chords', 'simplify extended harmonies'],
  },
  {
    id: createLexemeId('noun', 'voicing'),
    term: 'voicing',
    variants: ['chord voicing', 'voice distribution'],
    category: 'harmony',
    definition: 'Specific arrangement of chord tones',
    semantics: { type: 'property', propertyOf: 'chord' },
    examples: ['open the voicing', 'tighten the voicings'],
  },
  {
    id: createLexemeId('noun', 'inversion'),
    term: 'inversion',
    variants: ['chord inversion', 'bass position'],
    category: 'harmony',
    definition: 'Arrangement with a non-root note in the bass',
    semantics: { type: 'property', propertyOf: 'chord' },
    examples: ['use first inversion', 'vary the inversions'],
  },
  {
    id: createLexemeId('noun', 'root-position'),
    term: 'root position',
    variants: ['root voicing', 'fundamental position'],
    category: 'harmony',
    definition: 'Chord voicing with root in the bass',
    semantics: { type: 'property', propertyOf: 'chord' },
    examples: ['return to root position'],
  },
  {
    id: createLexemeId('noun', 'progression'),
    term: 'progression',
    variants: ['chord progression', 'harmonic progression'],
    category: 'harmony',
    definition: 'Series of chords moving through time',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['change the progression', 'simplify the progression'],
  },
  {
    id: createLexemeId('noun', 'cadence'),
    term: 'cadence',
    variants: ['harmonic close'],
    category: 'harmony',
    definition: 'Harmonic formula concluding a phrase',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['strengthen the cadence', 'use a deceptive cadence'],
  },
  {
    id: createLexemeId('noun', 'resolution'),
    term: 'resolution',
    variants: ['harmonic resolution'],
    category: 'harmony',
    definition: 'Movement from tension to stability',
    semantics: { type: 'process', processType: 'harmonic' },
    examples: ['delay the resolution', 'resolve the tension'],
  },
  {
    id: createLexemeId('noun', 'suspension'),
    term: 'suspension',
    variants: ['suspended note', 'delay'],
    category: 'harmony',
    definition: 'Note held over from previous chord creating dissonance',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['add suspensions', 'resolve the suspension'],
  },
  {
    id: createLexemeId('noun', 'pedal'),
    term: 'pedal',
    variants: ['pedal point', 'pedal tone', 'drone'],
    category: 'harmony',
    definition: 'Sustained or repeated note beneath changing harmonies',
    semantics: { type: 'pattern', patternType: 'harmonic' },
    examples: ['add a pedal tone', 'maintain the pedal'],
  },
  {
    id: createLexemeId('noun', 'tonic'),
    term: 'tonic',
    variants: ['home chord', 'I chord', 'keynote'],
    category: 'harmony',
    definition: 'Primary chord of a key, providing stability',
    semantics: { type: 'entity_ref', entityType: 'chord' },
    examples: ['return to the tonic', 'establish the tonic'],
  },
  {
    id: createLexemeId('noun', 'dominant'),
    term: 'dominant',
    variants: ['V chord', 'fifth chord'],
    category: 'harmony',
    definition: 'Fifth scale degree chord, creating tension toward tonic',
    semantics: { type: 'entity_ref', entityType: 'chord' },
    examples: ['strengthen the dominant', 'resolve from dominant'],
  },
  {
    id: createLexemeId('noun', 'subdominant'),
    term: 'subdominant',
    variants: ['IV chord', 'fourth chord'],
    category: 'harmony',
    definition: 'Fourth scale degree chord',
    semantics: { type: 'entity_ref', entityType: 'chord' },
    examples: ['use subdominant harmony'],
  },
  {
    id: createLexemeId('noun', 'secondary-dominant'),
    term: 'secondary dominant',
    variants: ['applied dominant', 'borrowed dominant'],
    category: 'harmony',
    definition: 'Dominant of a chord other than tonic',
    semantics: { type: 'entity_ref', entityType: 'chord' },
    examples: ['add secondary dominants', 'tonicize with secondary dominant'],
  },
  {
    id: createLexemeId('noun', 'modulation'),
    term: 'modulation',
    variants: ['key change', 'tonal shift'],
    category: 'harmony',
    definition: 'Change from one key to another',
    semantics: { type: 'process', processType: 'harmonic' },
    examples: ['modulate to the relative major', 'avoid modulation'],
  },
  {
    id: createLexemeId('noun', 'tonicization'),
    term: 'tonicization',
    variants: ['temporary modulation', 'applied harmony'],
    category: 'harmony',
    definition: 'Brief emphasis of a non-tonic chord as temporary tonic',
    semantics: { type: 'process', processType: 'harmonic' },
    examples: ['tonicize the subdominant'],
  },
  {
    id: createLexemeId('noun', 'borrowed-chord'),
    term: 'borrowed chord',
    variants: ['modal mixture', 'modal borrowing'],
    category: 'harmony',
    definition: 'Chord borrowed from parallel key or mode',
    semantics: { type: 'entity_ref', entityType: 'chord' },
    examples: ['add borrowed chords', 'use modal mixture'],
  },
];

// =============================================================================
// Export and Aggregation
// =============================================================================

// Import additional batches
export { DOMAIN_NOUNS_BATCH_2 } from './domain-nouns-batch2';
export { DOMAIN_NOUNS_BATCH_3 } from './domain-nouns-batch3';
export { DOMAIN_NOUNS_BATCH_4 } from './domain-nouns-batch4';

export const DOMAIN_NOUNS_BATCH_1 = STRUCTURE_NOUNS;

/**
 * All domain nouns combined from all batches.
 * Note: This will be dynamically built as batches are added.
 */
export const ALL_DOMAIN_NOUNS: readonly DomainNoun[] = [
  ...STRUCTURE_NOUNS,
  // Additional batches will be imported and spread here
];

/**
 * Domain nouns vocabulary table for efficient lookup.
 */
export const DOMAIN_NOUNS_TABLE: VocabularyTable<DomainNoun> = 
  createVocabularyTable(ALL_DOMAIN_NOUNS);

/**
 * Get a domain noun by ID.
 */
export function getDomainNounById(id: LexemeId): DomainNoun | undefined {
  return DOMAIN_NOUNS_TABLE.byId.get(id);
}

/**
 * Get a domain noun by term or variant.
 */
export function getDomainNounByTerm(term: string): DomainNoun | undefined {
  return DOMAIN_NOUNS_TABLE.byVariant.get(term.toLowerCase());
}

/**
 * Get domain nouns by category.
 */
export function getDomainNounsByCategory(
  category: DomainNounCategory
): readonly DomainNoun[] {
  return ALL_DOMAIN_NOUNS.filter(noun => noun.category === category);
}

/**
 * Get domain nouns by tradition.
 */
export function getDomainNounsByTradition(
  tradition: string
): readonly DomainNoun[] {
  return ALL_DOMAIN_NOUNS.filter(noun => noun.tradition === tradition);
}

/**
 * Search domain nouns by term or variant.
 */
export function searchDomainNouns(query: string): readonly DomainNoun[] {
  const normalized = query.toLowerCase();
  return ALL_DOMAIN_NOUNS.filter(
    noun =>
      noun.term.toLowerCase().includes(normalized) ||
      noun.variants.some(v => v.toLowerCase().includes(normalized)) ||
      noun.definition.toLowerCase().includes(normalized)
  );
}

/**
 * Get all unique categories.
 */
export function getAllCategories(): readonly DomainNounCategory[] {
  const categories = new Set<DomainNounCategory>();
  for (const noun of ALL_DOMAIN_NOUNS) {
    categories.add(noun.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get all unique traditions.
 */
export function getAllTraditions(): readonly string[] {
  const traditions = new Set<string>();
  for (const noun of ALL_DOMAIN_NOUNS) {
    if (noun.tradition) {
      traditions.add(noun.tradition);
    }
  }
  return Array.from(traditions).sort();
}

/**
 * Get statistics about the domain noun inventory.
 */
export function getDomainNounStats() {
  const byCategory = new Map<DomainNounCategory, number>();
  const byTradition = new Map<string, number>();
  
  for (const noun of ALL_DOMAIN_NOUNS) {
    byCategory.set(noun.category, (byCategory.get(noun.category) || 0) + 1);
    if (noun.tradition) {
      byTradition.set(noun.tradition, (byTradition.get(noun.tradition) || 0) + 1);
    }
  }
  
  return {
    total: ALL_DOMAIN_NOUNS.length,
    byCategory: Object.fromEntries(byCategory),
    byTradition: Object.fromEntries(byTradition),
    categories: getAllCategories().length,
    traditions: getAllTraditions().length,
  };
}
