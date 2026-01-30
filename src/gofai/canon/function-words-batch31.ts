/**
 * GOFAI Canon — Function Words Batch 31
 *
 * Comprehensive catalog of function words (prepositions, conjunctions, determiners,
 * auxiliaries, particles) that are critical for natural language parsing.
 *
 * Function words carry grammatical meaning rather than lexical meaning. They're
 * essential for constructing well-formed utterances and for semantic composition.
 *
 * **Coverage Areas:**
 * - Prepositions (spatial, temporal, abstract)
 * - Conjunctions (coordinating, subordinating)
 * - Determiners (articles, quantifiers, demonstratives)
 * - Auxiliaries (modals, tense markers)
 * - Particles (phrasal verb particles, discourse particles)
 *
 * **Design Principles:**
 * 1. **Explicit Semantics**: Each function word specifies its semantic role
 * 2. **Compositional**: Function words compose with content words
 * 3. **Context-Sensitive**: Same word can have multiple functions
 * 4. **Coverage**: Comprehensive coverage for natural music dialog
 *
 * ## Related Modules
 * - domain-nouns-*.ts — Content words (what things are)
 * - domain-verbs-*.ts — Action words (what happens)
 * - domain-adjectives-*.ts — Property words (how things are)
 * - This module — Function words (grammatical structure)
 *
 * @module gofai/canon/function-words-batch31
 */

import type { GofaiId } from './types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Category of function word
 */
export type FunctionWordCategory =
  | 'preposition'      // in, on, at, with, by, for
  | 'conjunction'      // and, or, but, if, when, because
  | 'determiner'       // the, a, this, that, some, all
  | 'auxiliary'        // will, would, can, should, must
  | 'particle'         // up, down, out, back (in phrasal verbs)
  | 'pronoun'          // it, that, which, who
  | 'quantifier';      // all, some, none, most, few

/**
 * Semantic function of a function word
 */
export type SemanticFunction =
  // Spatial relations
  | 'location'         // at, in, on
  | 'direction'        // to, from, toward
  | 'containment'      // in, inside, within
  | 'proximity'        // near, by, beside
  | 'relative_position' // above, below, before, after
  
  // Temporal relations
  | 'temporal_at'      // at (a time)
  | 'temporal_during'  // during, throughout
  | 'temporal_before'  // before, prior to
  | 'temporal_after'   // after, following
  | 'temporal_duration' // for (duration)
  | 'temporal_until'   // until, till
  | 'temporal_since'   // since, from
  
  // Abstract relations
  | 'instrument'       // with, using, by means of
  | 'manner'           // with, in (manner)
  | 'accompaniment'    // with, along with
  | 'purpose'          // for, to (purpose)
  | 'cause'            // because of, due to
  | 'comparison'       // like, as, than
  | 'exception'        // except, besides, without
  | 'inclusion'        // including, with
  
  // Logical operations
  | 'conjunction'      // and, plus
  | 'disjunction'      // or
  | 'negation'         // not, nor, neither
  | 'contrast'         // but, yet, however
  | 'condition'        // if, unless, provided
  | 'concession'       // although, though, despite
  
  // Quantification
  | 'universal'        // all, every, each
  | 'existential'      // some, any
  | 'negative'         // no, none
  | 'partial'          // most, many, few
  | 'exact'            // exactly, precisely
  
  // Reference
  | 'definite'         // the
  | 'indefinite'       // a, an
  | 'demonstrative'    // this, that, these, those
  | 'anaphoric'        // it, that (referring back)
  | 'relative'         // which, that (relative clause)
  
  // Modality
  | 'possibility'      // can, could, may, might
  | 'necessity'        // must, should, need
  | 'volition'         // will, would
  | 'obligation'       // should, ought to
  | 'permission'       // can, may
  
  // Discourse
  | 'topic'            // as for, regarding
  | 'emphasis'         // even, just, only
  | 'approximation'    // about, around
  | 'focus';           // specifically, particularly

/**
 * A function word entry
 */
export interface FunctionWord {
  /** Canonical ID */
  readonly id: GofaiId;
  
  /** Surface form(s) */
  readonly forms: readonly string[];
  
  /** Category */
  readonly category: FunctionWordCategory;
  
  /** Semantic function(s) */
  readonly functions: readonly SemanticFunction[];
  
  /** Usage notes */
  readonly notes?: string;
  
  /** Whether this is compositional (combines with other words) */
  readonly compositional?: boolean;
  
  /** Related function words (near-synonyms) */
  readonly related?: readonly GofaiId[];
  
  /** Typical collocations */
  readonly collocations?: readonly string[];
}

// =============================================================================
// Prepositions — Spatial Relations
// =============================================================================

export const SPATIAL_PREPOSITIONS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:prep:at:location' as GofaiId,
    forms: ['at'],
    category: 'preposition',
    functions: ['location'],
    notes: 'Point location in time or space',
    collocations: ['at bar 5', 'at the start', 'at 120 BPM'],
  },
  {
    id: 'gofai:fnw:prep:in:containment' as GofaiId,
    forms: ['in', 'inside', 'within'],
    category: 'preposition',
    functions: ['containment', 'location'],
    notes: 'Containment or membership',
    collocations: ['in the chorus', 'in verse 2', 'within the drum track'],
  },
  {
    id: 'gofai:fnw:prep:on:surface' as GofaiId,
    forms: ['on'],
    category: 'preposition',
    functions: ['location'],
    notes: 'On a surface or track',
    collocations: ['on the bass track', 'on beat 3'],
  },
  {
    id: 'gofai:fnw:prep:to:direction' as GofaiId,
    forms: ['to', 'toward', 'towards'],
    category: 'preposition',
    functions: ['direction', 'purpose'],
    notes: 'Direction or goal',
    collocations: ['to the end', 'toward darker', 'move to bar 16'],
  },
  {
    id: 'gofai:fnw:prep:from:source' as GofaiId,
    forms: ['from'],
    category: 'preposition',
    functions: ['direction'],
    notes: 'Source or origin',
    collocations: ['from bar 8', 'from the beginning', 'copy from verse 1'],
  },
  {
    id: 'gofai:fnw:prep:through:traversal' as GofaiId,
    forms: ['through', 'throughout'],
    category: 'preposition',
    functions: ['location', 'temporal_during'],
    notes: 'Movement through space or time',
    collocations: ['through the bridge', 'throughout the song'],
  },
  {
    id: 'gofai:fnw:prep:across:lateral' as GofaiId,
    forms: ['across'],
    category: 'preposition',
    functions: ['location'],
    notes: 'Lateral movement or span',
    collocations: ['across all tracks', 'across the section'],
  },
  {
    id: 'gofai:fnw:prep:over:above' as GofaiId,
    forms: ['over', 'above'],
    category: 'preposition',
    functions: ['relative_position'],
    notes: 'Above or spanning',
    collocations: ['over the bass', 'above middle C'],
  },
  {
    id: 'gofai:fnw:prep:under:below' as GofaiId,
    forms: ['under', 'below', 'beneath'],
    category: 'preposition',
    functions: ['relative_position'],
    notes: 'Below or subordinate to',
    collocations: ['under the melody', 'below C3'],
  },
  {
    id: 'gofai:fnw:prep:between:middle' as GofaiId,
    forms: ['between'],
    category: 'preposition',
    functions: ['location'],
    notes: 'In the space between two things',
    collocations: ['between bars 4 and 8', 'between the verses'],
  },
  {
    id: 'gofai:fnw:prep:among:group' as GofaiId,
    forms: ['among', 'amongst'],
    category: 'preposition',
    functions: ['location'],
    notes: 'Within a group',
    collocations: ['among the drum tracks', 'amongst the layers'],
  },
  {
    id: 'gofai:fnw:prep:beside:proximity' as GofaiId,
    forms: ['beside', 'next to', 'by'],
    category: 'preposition',
    functions: ['proximity'],
    notes: 'Adjacent to',
    collocations: ['beside the kick', 'next to the snare'],
  },
  {
    id: 'gofai:fnw:prep:near:proximity' as GofaiId,
    forms: ['near', 'close to'],
    category: 'preposition',
    functions: ['proximity'],
    notes: 'In the vicinity of',
    collocations: ['near the end', 'close to bar 32'],
  },
  {
    id: 'gofai:fnw:prep:around:surrounding' as GofaiId,
    forms: ['around', 'about'],
    category: 'preposition',
    functions: ['proximity', 'approximation'],
    notes: 'Surrounding or approximate',
    collocations: ['around bar 8', 'about 2 bars'],
  },
  {
    id: 'gofai:fnw:prep:into:entry' as GofaiId,
    forms: ['into'],
    category: 'preposition',
    functions: ['direction'],
    notes: 'Movement into',
    collocations: ['into the chorus', 'fade into silence'],
  },
  {
    id: 'gofai:fnw:prep:out_of:exit' as GofaiId,
    forms: ['out of', 'from'],
    category: 'preposition',
    functions: ['direction'],
    notes: 'Movement out of',
    collocations: ['out of the verse', 'fade out of the bridge'],
  },
  {
    id: 'gofai:fnw:prep:along:path' as GofaiId,
    forms: ['along'],
    category: 'preposition',
    functions: ['location'],
    notes: 'Following a path',
    collocations: ['along the timeline', 'along the track'],
  },
  {
    id: 'gofai:fnw:prep:past:beyond' as GofaiId,
    forms: ['past', 'beyond'],
    category: 'preposition',
    functions: ['relative_position'],
    notes: 'Beyond a point',
    collocations: ['past bar 16', 'beyond the drop'],
  },
];

// =============================================================================
// Prepositions — Temporal Relations
// =============================================================================

export const TEMPORAL_PREPOSITIONS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:prep:before:temporal' as GofaiId,
    forms: ['before', 'prior to'],
    category: 'preposition',
    functions: ['temporal_before'],
    notes: 'Earlier in time',
    collocations: ['before the drop', 'before bar 8'],
  },
  {
    id: 'gofai:fnw:prep:after:temporal' as GofaiId,
    forms: ['after', 'following'],
    category: 'preposition',
    functions: ['temporal_after'],
    notes: 'Later in time',
    collocations: ['after the intro', 'following the verse'],
  },
  {
    id: 'gofai:fnw:prep:during:temporal' as GofaiId,
    forms: ['during', 'throughout'],
    category: 'preposition',
    functions: ['temporal_during'],
    notes: 'Concurrent with',
    collocations: ['during the chorus', 'throughout the section'],
  },
  {
    id: 'gofai:fnw:prep:until:endpoint' as GofaiId,
    forms: ['until', 'till', 'up to'],
    category: 'preposition',
    functions: ['temporal_until'],
    notes: 'Up to a time point',
    collocations: ['until the drop', 'till bar 32'],
  },
  {
    id: 'gofai:fnw:prep:since:startpoint' as GofaiId,
    forms: ['since', 'from'],
    category: 'preposition',
    functions: ['temporal_since'],
    notes: 'From a time point',
    collocations: ['since the beginning', 'from bar 8'],
  },
  {
    id: 'gofai:fnw:prep:for:duration' as GofaiId,
    forms: ['for'],
    category: 'preposition',
    functions: ['temporal_duration'],
    notes: 'Duration of time',
    collocations: ['for 4 bars', 'for 2 beats'],
  },
  {
    id: 'gofai:fnw:prep:by:deadline' as GofaiId,
    forms: ['by'],
    category: 'preposition',
    functions: ['temporal_until'],
    notes: 'Before a deadline',
    collocations: ['by the end', 'by bar 16'],
  },
];

// =============================================================================
// Prepositions — Abstract Relations
// =============================================================================

export const ABSTRACT_PREPOSITIONS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:prep:with:instrument' as GofaiId,
    forms: ['with', 'using'],
    category: 'preposition',
    functions: ['instrument', 'accompaniment', 'manner'],
    notes: 'Instrument, accompaniment, or manner',
    collocations: ['with reverb', 'with more swing', 'using the filter'],
  },
  {
    id: 'gofai:fnw:prep:without:absence' as GofaiId,
    forms: ['without', 'minus'],
    category: 'preposition',
    functions: ['exception'],
    notes: 'Absence or exclusion',
    collocations: ['without drums', 'without changing the melody'],
  },
  {
    id: 'gofai:fnw:prep:by:agent' as GofaiId,
    forms: ['by'],
    category: 'preposition',
    functions: ['instrument'],
    notes: 'Agent or means',
    collocations: ['by adding reverb', 'by raising the pitch'],
  },
  {
    id: 'gofai:fnw:prep:via:means' as GofaiId,
    forms: ['via', 'through'],
    category: 'preposition',
    functions: ['instrument'],
    notes: 'By means of',
    collocations: ['via automation', 'through compression'],
  },
  {
    id: 'gofai:fnw:prep:like:comparison' as GofaiId,
    forms: ['like', 'as', 'similar to'],
    category: 'preposition',
    functions: ['comparison'],
    notes: 'Similarity comparison',
    collocations: ['like the intro', 'as in verse 1', 'similar to the drop'],
  },
  {
    id: 'gofai:fnw:prep:unlike:contrast' as GofaiId,
    forms: ['unlike', 'different from'],
    category: 'preposition',
    functions: ['comparison'],
    notes: 'Difference comparison',
    collocations: ['unlike the verse', 'different from before'],
  },
  {
    id: 'gofai:fnw:prep:than:comparative' as GofaiId,
    forms: ['than'],
    category: 'preposition',
    functions: ['comparison'],
    notes: 'Comparative reference',
    collocations: ['brighter than before', 'more than 2 bars'],
  },
  {
    id: 'gofai:fnw:prep:as:manner' as GofaiId,
    forms: ['as'],
    category: 'preposition',
    functions: ['manner', 'comparison'],
    notes: 'In the manner of',
    collocations: ['as a pad', 'as before'],
  },
  {
    id: 'gofai:fnw:prep:except:exclusion' as GofaiId,
    forms: ['except', 'except for', 'besides', 'apart from'],
    category: 'preposition',
    functions: ['exception'],
    notes: 'Exclusion or exception',
    collocations: ['except the drums', 'except for the bass'],
  },
  {
    id: 'gofai:fnw:prep:including:inclusion' as GofaiId,
    forms: ['including', 'with'],
    category: 'preposition',
    functions: ['inclusion'],
    notes: 'Explicit inclusion',
    collocations: ['including the drums', 'with the bass'],
  },
  {
    id: 'gofai:fnw:prep:regarding:topic' as GofaiId,
    forms: ['regarding', 'about', 'concerning', 'as for'],
    category: 'preposition',
    functions: ['topic'],
    notes: 'Topic marker',
    collocations: ['regarding the tempo', 'about the mix'],
  },
  {
    id: 'gofai:fnw:prep:despite:concession' as GofaiId,
    forms: ['despite', 'in spite of'],
    category: 'preposition',
    functions: ['concession'],
    notes: 'Concession despite obstacle',
    collocations: ['despite the rhythm', 'in spite of the tempo'],
  },
];

// =============================================================================
// Conjunctions — Coordinating
// =============================================================================

export const COORDINATING_CONJUNCTIONS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:conj:and:conjunction' as GofaiId,
    forms: ['and', 'plus'],
    category: 'conjunction',
    functions: ['conjunction'],
    notes: 'Logical AND, addition',
    collocations: ['drums and bass', 'brighter and wider'],
  },
  {
    id: 'gofai:fnw:conj:or:disjunction' as GofaiId,
    forms: ['or'],
    category: 'conjunction',
    functions: ['disjunction'],
    notes: 'Logical OR, alternative',
    collocations: ['verse or chorus', 'brighter or darker'],
  },
  {
    id: 'gofai:fnw:conj:but:contrast' as GofaiId,
    forms: ['but', 'yet', 'however'],
    category: 'conjunction',
    functions: ['contrast'],
    notes: 'Contrast or exception',
    collocations: ['bright but not harsh', 'wide yet focused'],
  },
  {
    id: 'gofai:fnw:conj:nor:negative_disjunction' as GofaiId,
    forms: ['nor', 'neither'],
    category: 'conjunction',
    functions: ['negation', 'disjunction'],
    notes: 'Negative disjunction',
    collocations: ['neither too bright nor too dark'],
  },
  {
    id: 'gofai:fnw:conj:so:result' as GofaiId,
    forms: ['so', 'therefore', 'thus'],
    category: 'conjunction',
    functions: ['cause'],
    notes: 'Causal result',
    collocations: ['so make it brighter', 'therefore add reverb'],
  },
];

// =============================================================================
// Conjunctions — Subordinating
// =============================================================================

export const SUBORDINATING_CONJUNCTIONS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:conj:if:condition' as GofaiId,
    forms: ['if'],
    category: 'conjunction',
    functions: ['condition'],
    notes: 'Conditional',
    collocations: ['if possible', 'if it sounds too bright'],
  },
  {
    id: 'gofai:fnw:conj:unless:negative_condition' as GofaiId,
    forms: ['unless'],
    category: 'conjunction',
    functions: ['condition'],
    notes: 'Negative conditional',
    collocations: ['unless it clips', 'unless the melody changes'],
  },
  {
    id: 'gofai:fnw:conj:when:temporal_condition' as GofaiId,
    forms: ['when', 'whenever'],
    category: 'conjunction',
    functions: ['temporal_at', 'condition'],
    notes: 'Temporal conditional',
    collocations: ['when the drop hits', 'whenever the bass plays'],
  },
  {
    id: 'gofai:fnw:conj:while:temporal_duration' as GofaiId,
    forms: ['while', 'whilst'],
    category: 'conjunction',
    functions: ['temporal_during'],
    notes: 'Duration with simultaneity',
    collocations: ['while keeping the melody', 'while the drums play'],
  },
  {
    id: 'gofai:fnw:conj:because:cause' as GofaiId,
    forms: ['because', 'since', 'as'],
    category: 'conjunction',
    functions: ['cause'],
    notes: 'Causal',
    collocations: ['because it\'s too bright', 'since it clips'],
  },
  {
    id: 'gofai:fnw:conj:although:concession' as GofaiId,
    forms: ['although', 'though', 'even though'],
    category: 'conjunction',
    functions: ['concession'],
    notes: 'Concessive',
    collocations: ['although it\'s bright', 'though it\'s wide'],
  },
  {
    id: 'gofai:fnw:conj:provided:condition' as GofaiId,
    forms: ['provided', 'provided that', 'as long as'],
    category: 'conjunction',
    functions: ['condition'],
    notes: 'Conditional provision',
    collocations: ['provided it doesn\'t clip', 'as long as the melody stays'],
  },
];

// =============================================================================
// Determiners — Articles
// =============================================================================

export const ARTICLE_DETERMINERS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:det:the:definite' as GofaiId,
    forms: ['the'],
    category: 'determiner',
    functions: ['definite'],
    notes: 'Definite article',
    collocations: ['the chorus', 'the drums', 'the melody'],
  },
  {
    id: 'gofai:fnw:det:a:indefinite' as GofaiId,
    forms: ['a', 'an'],
    category: 'determiner',
    functions: ['indefinite'],
    notes: 'Indefinite article',
    collocations: ['a pad', 'an arpeggio', 'a drum fill'],
  },
];

// =============================================================================
// Determiners — Demonstratives
// =============================================================================

export const DEMONSTRATIVE_DETERMINERS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:det:this:proximal' as GofaiId,
    forms: ['this'],
    category: 'determiner',
    functions: ['demonstrative'],
    notes: 'Proximal demonstrative (singular)',
    collocations: ['this verse', 'this section', 'this track'],
  },
  {
    id: 'gofai:fnw:det:that:distal' as GofaiId,
    forms: ['that'],
    category: 'determiner',
    functions: ['demonstrative'],
    notes: 'Distal demonstrative (singular)',
    collocations: ['that chorus', 'that change', 'that part'],
  },
  {
    id: 'gofai:fnw:det:these:proximal_plural' as GofaiId,
    forms: ['these'],
    category: 'determiner',
    functions: ['demonstrative'],
    notes: 'Proximal demonstrative (plural)',
    collocations: ['these drums', 'these notes', 'these sections'],
  },
  {
    id: 'gofai:fnw:det:those:distal_plural' as GofaiId,
    forms: ['those'],
    category: 'determiner',
    functions: ['demonstrative'],
    notes: 'Distal demonstrative (plural)',
    collocations: ['those hats', 'those changes', 'those bars'],
  },
];

// =============================================================================
// Determiners — Quantifiers
// =============================================================================

export const QUANTIFIER_DETERMINERS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:det:all:universal' as GofaiId,
    forms: ['all', 'every', 'each'],
    category: 'determiner',
    functions: ['universal'],
    notes: 'Universal quantifier',
    collocations: ['all drums', 'every bar', 'each note'],
  },
  {
    id: 'gofai:fnw:det:some:existential' as GofaiId,
    forms: ['some'],
    category: 'determiner',
    functions: ['existential'],
    notes: 'Existential quantifier',
    collocations: ['some drums', 'some bars', 'some notes'],
  },
  {
    id: 'gofai:fnw:det:any:existential' as GofaiId,
    forms: ['any'],
    category: 'determiner',
    functions: ['existential'],
    notes: 'Free choice existential',
    collocations: ['any drum', 'any bar', 'any note'],
  },
  {
    id: 'gofai:fnw:det:no:negative' as GofaiId,
    forms: ['no', 'none'],
    category: 'determiner',
    functions: ['negative'],
    notes: 'Negative quantifier',
    collocations: ['no drums', 'no reverb', 'no automation'],
  },
  {
    id: 'gofai:fnw:det:most:partial' as GofaiId,
    forms: ['most'],
    category: 'determiner',
    functions: ['partial'],
    notes: 'Majority quantifier',
    collocations: ['most drums', 'most bars', 'most notes'],
  },
  {
    id: 'gofai:fnw:det:many:partial' as GofaiId,
    forms: ['many'],
    category: 'determiner',
    functions: ['partial'],
    notes: 'Large quantity',
    collocations: ['many drums', 'many notes', 'many layers'],
  },
  {
    id: 'gofai:fnw:det:few:partial' as GofaiId,
    forms: ['few', 'several'],
    category: 'determiner',
    functions: ['partial'],
    notes: 'Small quantity',
    collocations: ['few drums', 'few notes', 'several bars'],
  },
  {
    id: 'gofai:fnw:det:both:dual' as GofaiId,
    forms: ['both'],
    category: 'determiner',
    functions: ['universal'],
    notes: 'Dual quantifier',
    collocations: ['both verses', 'both tracks', 'both sections'],
  },
  {
    id: 'gofai:fnw:det:either:dual_choice' as GofaiId,
    forms: ['either'],
    category: 'determiner',
    functions: ['existential'],
    notes: 'Dual choice',
    collocations: ['either verse', 'either track', 'either section'],
  },
  {
    id: 'gofai:fnw:det:neither:dual_negative' as GofaiId,
    forms: ['neither'],
    category: 'determiner',
    functions: ['negative'],
    notes: 'Dual negative',
    collocations: ['neither verse', 'neither track', 'neither section'],
  },
];

// =============================================================================
// Pronouns — Anaphoric and Relative
// =============================================================================

export const PRONOUNS: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:pron:it:anaphoric' as GofaiId,
    forms: ['it'],
    category: 'pronoun',
    functions: ['anaphoric'],
    notes: 'Singular anaphoric pronoun',
    collocations: ['make it brighter', 'change it', 'keep it'],
  },
  {
    id: 'gofai:fnw:pron:they:anaphoric_plural' as GofaiId,
    forms: ['they', 'them'],
    category: 'pronoun',
    functions: ['anaphoric'],
    notes: 'Plural anaphoric pronoun',
    collocations: ['make them louder', 'change them', 'keep them'],
  },
  {
    id: 'gofai:fnw:pron:that:anaphoric' as GofaiId,
    forms: ['that'],
    category: 'pronoun',
    functions: ['anaphoric', 'demonstrative'],
    notes: 'Demonstrative anaphoric pronoun',
    collocations: ['change that', 'keep that', 'undo that'],
  },
  {
    id: 'gofai:fnw:pron:which:relative' as GofaiId,
    forms: ['which'],
    category: 'pronoun',
    functions: ['relative'],
    notes: 'Relative pronoun',
    collocations: ['the verse which has drums', 'the part which is bright'],
  },
  {
    id: 'gofai:fnw:pron:who:relative' as GofaiId,
    forms: ['who'],
    category: 'pronoun',
    functions: ['relative'],
    notes: 'Relative pronoun for persons (rarely used in music context)',
  },
];

// =============================================================================
// Auxiliaries — Modal Verbs
// =============================================================================

export const MODAL_AUXILIARIES: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:aux:can:possibility' as GofaiId,
    forms: ['can', 'could'],
    category: 'auxiliary',
    functions: ['possibility', 'permission'],
    notes: 'Possibility or ability',
    collocations: ['can you make it brighter', 'could you add drums'],
  },
  {
    id: 'gofai:fnw:aux:may:possibility' as GofaiId,
    forms: ['may', 'might'],
    category: 'auxiliary',
    functions: ['possibility', 'permission'],
    notes: 'Possibility or permission',
    collocations: ['may need more reverb', 'might sound better'],
  },
  {
    id: 'gofai:fnw:aux:will:volition' as GofaiId,
    forms: ['will', 'would'],
    category: 'auxiliary',
    functions: ['volition'],
    notes: 'Future or hypothetical',
    collocations: ['will sound brighter', 'would be better'],
  },
  {
    id: 'gofai:fnw:aux:shall:volition' as GofaiId,
    forms: ['shall'],
    category: 'auxiliary',
    functions: ['volition'],
    notes: 'Formal future or suggestion',
    collocations: ['shall we make it brighter'],
  },
  {
    id: 'gofai:fnw:aux:should:obligation' as GofaiId,
    forms: ['should'],
    category: 'auxiliary',
    functions: ['obligation'],
    notes: 'Recommendation or expectation',
    collocations: ['should be brighter', 'should add reverb'],
  },
  {
    id: 'gofai:fnw:aux:must:necessity' as GofaiId,
    forms: ['must'],
    category: 'auxiliary',
    functions: ['necessity'],
    notes: 'Strong necessity or obligation',
    collocations: ['must be brighter', 'must add reverb'],
  },
  {
    id: 'gofai:fnw:aux:need:necessity' as GofaiId,
    forms: ['need'],
    category: 'auxiliary',
    functions: ['necessity'],
    notes: 'Necessity',
    collocations: ['need more reverb', 'need to be brighter'],
  },
  {
    id: 'gofai:fnw:aux:ought:obligation' as GofaiId,
    forms: ['ought'],
    category: 'auxiliary',
    functions: ['obligation'],
    notes: 'Moral obligation or advice',
    collocations: ['ought to be brighter', 'ought to add reverb'],
  },
];

// =============================================================================
// Particles — Phrasal Verb Particles
// =============================================================================

export const PHRASAL_PARTICLES: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:part:up:direction' as GofaiId,
    forms: ['up'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Upward direction or increase',
    collocations: ['bring up', 'turn up', 'pitch up', 'lift up'],
  },
  {
    id: 'gofai:fnw:part:down:direction' as GofaiId,
    forms: ['down'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Downward direction or decrease',
    collocations: ['bring down', 'turn down', 'pitch down', 'dial down'],
  },
  {
    id: 'gofai:fnw:part:out:exit' as GofaiId,
    forms: ['out'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Outward direction or removal',
    collocations: ['take out', 'fade out', 'filter out', 'thin out'],
  },
  {
    id: 'gofai:fnw:part:in:entry' as GofaiId,
    forms: ['in'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Inward direction or addition',
    collocations: ['bring in', 'fade in', 'mix in', 'blend in'],
  },
  {
    id: 'gofai:fnw:part:off:removal' as GofaiId,
    forms: ['off'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Removal or deactivation',
    collocations: ['take off', 'cut off', 'turn off', 'strip off'],
  },
  {
    id: 'gofai:fnw:part:on:activation' as GofaiId,
    forms: ['on'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Activation or addition',
    collocations: ['put on', 'turn on', 'add on', 'layer on'],
  },
  {
    id: 'gofai:fnw:part:back:return' as GofaiId,
    forms: ['back'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Return or reversal',
    collocations: ['bring back', 'take back', 'pull back', 'dial back'],
  },
  {
    id: 'gofai:fnw:part:away:departure' as GofaiId,
    forms: ['away'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Departure or removal',
    collocations: ['fade away', 'take away', 'strip away'],
  },
  {
    id: 'gofai:fnw:part:through:completion' as GofaiId,
    forms: ['through'],
    category: 'particle',
    functions: ['direction'],
    notes: 'Completion or penetration',
    collocations: ['go through', 'run through', 'play through'],
  },
];

// =============================================================================
// Discourse Particles
// =============================================================================

export const DISCOURSE_PARTICLES: readonly FunctionWord[] = [
  {
    id: 'gofai:fnw:disc:just:emphasis' as GofaiId,
    forms: ['just'],
    category: 'particle',
    functions: ['emphasis', 'approximation'],
    notes: 'Emphasis or minimization',
    collocations: ['just a little', 'just the drums', 'just brighter'],
  },
  {
    id: 'gofai:fnw:disc:only:focus' as GofaiId,
    forms: ['only'],
    category: 'particle',
    functions: ['focus', 'exception'],
    notes: 'Exclusive focus',
    collocations: ['only the drums', 'only brighter', 'only in the chorus'],
  },
  {
    id: 'gofai:fnw:disc:even:emphasis' as GofaiId,
    forms: ['even'],
    category: 'particle',
    functions: ['emphasis'],
    notes: 'Scalar emphasis',
    collocations: ['even brighter', 'even more reverb', 'even the bass'],
  },
  {
    id: 'gofai:fnw:disc:also:addition' as GofaiId,
    forms: ['also', 'too', 'as well'],
    category: 'particle',
    functions: ['conjunction'],
    notes: 'Additive',
    collocations: ['also the drums', 'too bright', 'as well as the bass'],
  },
  {
    id: 'gofai:fnw:disc:especially:focus' as GofaiId,
    forms: ['especially', 'particularly', 'specifically'],
    category: 'particle',
    functions: ['focus'],
    notes: 'Specific emphasis',
    collocations: ['especially the drums', 'particularly bright'],
  },
];

// =============================================================================
// Aggregated Collections
// =============================================================================

/** All spatial prepositions */
export const ALL_SPATIAL_PREPS = SPATIAL_PREPOSITIONS;

/** All temporal prepositions */
export const ALL_TEMPORAL_PREPS = TEMPORAL_PREPOSITIONS;

/** All abstract prepositions */
export const ALL_ABSTRACT_PREPS = ABSTRACT_PREPOSITIONS;

/** All prepositions */
export const ALL_PREPOSITIONS: readonly FunctionWord[] = [
  ...SPATIAL_PREPOSITIONS,
  ...TEMPORAL_PREPOSITIONS,
  ...ABSTRACT_PREPOSITIONS,
];

/** All coordinating conjunctions */
export const ALL_COORDINATING_CONJ = COORDINATING_CONJUNCTIONS;

/** All subordinating conjunctions */
export const ALL_SUBORDINATING_CONJ = SUBORDINATING_CONJUNCTIONS;

/** All conjunctions */
export const ALL_CONJUNCTIONS: readonly FunctionWord[] = [
  ...COORDINATING_CONJUNCTIONS,
  ...SUBORDINATING_CONJUNCTIONS,
];

/** All article determiners */
export const ALL_ARTICLE_DETS = ARTICLE_DETERMINERS;

/** All demonstrative determiners */
export const ALL_DEMONSTRATIVE_DETS = DEMONSTRATIVE_DETERMINERS;

/** All quantifier determiners */
export const ALL_QUANTIFIER_DETS = QUANTIFIER_DETERMINERS;

/** All determiners */
export const ALL_DETERMINERS: readonly FunctionWord[] = [
  ...ARTICLE_DETERMINERS,
  ...DEMONSTRATIVE_DETERMINERS,
  ...QUANTIFIER_DETERMINERS,
];

/** All pronouns */
export const ALL_PRONOUNS = PRONOUNS;

/** All modal auxiliaries */
export const ALL_MODALS = MODAL_AUXILIARIES;

/** All phrasal particles */
export const ALL_PHRASAL_PARTICLES = PHRASAL_PARTICLES;

/** All discourse particles */
export const ALL_DISCOURSE_PARTICLES = DISCOURSE_PARTICLES;

/** All particles */
export const ALL_PARTICLES: readonly FunctionWord[] = [
  ...PHRASAL_PARTICLES,
  ...DISCOURSE_PARTICLES,
];

/**
 * All function words in this batch
 */
export const ALL_FUNCTION_WORDS: readonly FunctionWord[] = [
  ...ALL_PREPOSITIONS,
  ...ALL_CONJUNCTIONS,
  ...ALL_DETERMINERS,
  ...ALL_PRONOUNS,
  ...ALL_MODALS,
  ...ALL_PARTICLES,
];

// =============================================================================
// Statistics and Metadata
// =============================================================================

/**
 * Statistics about this vocabulary batch
 */
export const FUNCTION_WORDS_STATS = {
  prepositions: {
    spatial: SPATIAL_PREPOSITIONS.length,
    temporal: TEMPORAL_PREPOSITIONS.length,
    abstract: ABSTRACT_PREPOSITIONS.length,
    total: ALL_PREPOSITIONS.length,
  },
  conjunctions: {
    coordinating: COORDINATING_CONJUNCTIONS.length,
    subordinating: SUBORDINATING_CONJUNCTIONS.length,
    total: ALL_CONJUNCTIONS.length,
  },
  determiners: {
    articles: ARTICLE_DETERMINERS.length,
    demonstratives: DEMONSTRATIVE_DETERMINERS.length,
    quantifiers: QUANTIFIER_DETERMINERS.length,
    total: ALL_DETERMINERS.length,
  },
  pronouns: PRONOUNS.length,
  auxiliaries: MODAL_AUXILIARIES.length,
  particles: {
    phrasal: PHRASAL_PARTICLES.length,
    discourse: DISCOURSE_PARTICLES.length,
    total: ALL_PARTICLES.length,
  },
  total: ALL_FUNCTION_WORDS.length,
} as const;

/**
 * Coverage summary
 */
export const COVERAGE_SUMMARY = `
Function Words Batch 31 Coverage:
- Prepositions: ${FUNCTION_WORDS_STATS.prepositions.total} (spatial: ${FUNCTION_WORDS_STATS.prepositions.spatial}, temporal: ${FUNCTION_WORDS_STATS.prepositions.temporal}, abstract: ${FUNCTION_WORDS_STATS.prepositions.abstract})
- Conjunctions: ${FUNCTION_WORDS_STATS.conjunctions.total} (coordinating: ${FUNCTION_WORDS_STATS.conjunctions.coordinating}, subordinating: ${FUNCTION_WORDS_STATS.conjunctions.subordinating})
- Determiners: ${FUNCTION_WORDS_STATS.determiners.total} (articles: ${FUNCTION_WORDS_STATS.determiners.articles}, demonstratives: ${FUNCTION_WORDS_STATS.determiners.demonstratives}, quantifiers: ${FUNCTION_WORDS_STATS.determiners.quantifiers})
- Pronouns: ${FUNCTION_WORDS_STATS.pronouns}
- Modal Auxiliaries: ${FUNCTION_WORDS_STATS.auxiliaries}
- Particles: ${FUNCTION_WORDS_STATS.particles.total} (phrasal: ${FUNCTION_WORDS_STATS.particles.phrasal}, discourse: ${FUNCTION_WORDS_STATS.particles.discourse})
- TOTAL: ${FUNCTION_WORDS_STATS.total} function words

This provides comprehensive coverage of grammatical function words essential for natural language parsing in music dialog contexts.
`.trim();
