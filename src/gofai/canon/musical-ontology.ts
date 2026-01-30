/**
 * GOFAI Musical Object Ontology — Canonical Type System for Musical Entities
 *
 * This module defines a comprehensive ontology of musical objects spanning
 * structure, harmony, rhythm, timbre/production, and performance domains.
 * The ontology aims to be inclusive of diverse music theories and traditions.
 *
 * Design principles:
 * - Distinguish clear ontological categories (what IS something)
 * - Support multiple music theory frameworks (Western, jazz, world music)
 * - Enable type-safe reasoning about musical transformations
 * - Provide semantic grounding for natural language references
 * - Allow extension by user-defined or domain-specific ontologies
 *
 * @module gofai/canon/musical-ontology
 */

import {
  type GofaiId,
  createGofaiId,
  type VocabularyTable,
  createVocabularyTable,
} from './types';

// =============================================================================
// Ontological Categories
// =============================================================================

/**
 * Top-level ontological domains in music.
 */
export type OntologicalDomain =
  | 'structure' // Form, sections, phrases
  | 'harmony' // Chords, progressions, functions
  | 'rhythm' // Temporal patterns, groove
  | 'pitch' // Pitches, intervals, scales
  | 'melody' // Melodic lines and patterns
  | 'timbre' // Sound quality, instrumentation
  | 'production' // Mix, effects, spatial properties
  | 'performance' // Expression, articulation, technique
  | 'notation' // Written representation
  | 'perception'; // Perceptual qualities

/**
 * Ontological type categories for musical objects.
 */
export type OntologicalType =
  // Abstract categories
  | 'event' // Discrete musical occurrence
  | 'span' // Temporal duration
  | 'pattern' // Recurring structure
  | 'property' // Attribute or quality
  | 'relation' // Relationship between entities
  | 'process' // Transformation or action
  | 'constraint' // Restriction or requirement
  | 'quality' // Perceptual or aesthetic attribute
  
  // Concrete categories
  | 'physical' // Physical sound production
  | 'symbolic' // Notated representation
  | 'perceptual' // Experienced quality
  | 'functional'; // Role or purpose

/**
 * A musical object in the ontology.
 */
export interface MusicalObject {
  /** Stable identifier */
  readonly id: GofaiId;

  /** Display name */
  readonly name: string;

  /** Ontological domain */
  readonly domain: OntologicalDomain;

  /** Ontological type */
  readonly type: OntologicalType;

  /** Definition */
  readonly definition: string;

  /** Parent type (for hierarchy) */
  readonly parent?: GofaiId;

  /** Related objects */
  readonly relatedTo?: readonly GofaiId[];

  /** Properties this object can have */
  readonly properties?: readonly string[];

  /** Musical tradition(s) where this concept exists */
  readonly traditions?: readonly string[];

  /** Examples */
  readonly examples?: readonly string[];

  /** Whether this is abstract or concrete */
  readonly abstract: boolean;
}

// =============================================================================
// Structural Objects
// =============================================================================

const STRUCTURAL_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'composition'),
    name: 'Composition',
    domain: 'structure',
    type: 'physical',
    definition: 'Complete musical work',
    abstract: false,
    properties: ['duration', 'key', 'tempo', 'meter', 'genre'],
    examples: ['a song', 'a symphony', 'a track'],
  },
  {
    id: createGofaiId('ontology', 'section'),
    name: 'Section',
    domain: 'structure',
    type: 'span',
    definition: 'Distinct portion of a composition with consistent characteristics',
    parent: createGofaiId('ontology', 'composition'),
    abstract: false,
    properties: ['start_time', 'end_time', 'name', 'function'],
    examples: ['verse', 'chorus', 'bridge', 'solo section'],
  },
  {
    id: createGofaiId('ontology', 'phrase'),
    name: 'Phrase',
    domain: 'structure',
    type: 'span',
    definition: 'Complete musical thought, analogous to a sentence',
    parent: createGofaiId('ontology', 'section'),
    abstract: false,
    properties: ['length', 'contour', 'cadence'],
    examples: ['four-bar phrase', 'antecedent phrase', 'consequent phrase'],
  },
  {
    id: createGofaiId('ontology', 'motif'),
    name: 'Motif',
    domain: 'structure',
    type: 'pattern',
    definition: 'Short, recognizable musical idea',
    abstract: false,
    properties: ['pitch_pattern', 'rhythm_pattern', 'interval_content'],
    examples: ['opening motif of Beethoven\'s 5th', 'signature riff'],
  },
  {
    id: createGofaiId('ontology', 'form'),
    name: 'Form',
    domain: 'structure',
    type: 'pattern',
    definition: 'Overall structural organization of a composition',
    abstract: true,
    properties: ['section_sequence', 'repetition_pattern'],
    examples: ['AABA', 'sonata form', 'verse-chorus form', 'rondo'],
    traditions: ['Western classical', 'Popular music', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'cadence'),
    name: 'Cadence',
    domain: 'structure',
    type: 'event',
    definition: 'Harmonic or melodic formula concluding a phrase',
    abstract: false,
    properties: ['type', 'strength', 'resolution'],
    examples: ['perfect authentic cadence', 'half cadence', 'deceptive cadence'],
    traditions: ['Western classical', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'period'),
    name: 'Period',
    domain: 'structure',
    type: 'span',
    definition: 'Pair of phrases forming complete statement (antecedent + consequent)',
    parent: createGofaiId('ontology', 'section'),
    abstract: false,
    properties: ['phrase_count', 'symmetry'],
    traditions: ['Western classical'],
  },
  {
    id: createGofaiId('ontology', 'transition'),
    name: 'Transition',
    domain: 'structure',
    type: 'span',
    definition: 'Passage connecting two sections',
    abstract: false,
    properties: ['source_section', 'target_section', 'technique'],
    examples: ['pre-chorus', 'buildup', 'breakdown'],
  },
];

// =============================================================================
// Harmonic Objects
// =============================================================================

const HARMONIC_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'chord'),
    name: 'Chord',
    domain: 'harmony',
    type: 'event',
    definition: 'Simultaneous combination of three or more pitches',
    abstract: false,
    properties: ['root', 'quality', 'extensions', 'inversion', 'voicing'],
    examples: ['C major triad', 'G7', 'Dm7b5'],
  },
  {
    id: createGofaiId('ontology', 'triad'),
    name: 'Triad',
    domain: 'harmony',
    type: 'event',
    definition: 'Three-note chord (root, third, fifth)',
    parent: createGofaiId('ontology', 'chord'),
    abstract: false,
    properties: ['root', 'quality'],
    examples: ['C major', 'A minor', 'B diminished'],
  },
  {
    id: createGofaiId('ontology', 'seventh_chord'),
    name: 'Seventh Chord',
    domain: 'harmony',
    type: 'event',
    definition: 'Four-note chord including a seventh',
    parent: createGofaiId('ontology', 'chord'),
    abstract: false,
    properties: ['root', 'triad_quality', 'seventh_quality'],
    examples: ['Cmaj7', 'G7', 'Am7', 'Bm7b5'],
  },
  {
    id: createGofaiId('ontology', 'progression'),
    name: 'Chord Progression',
    domain: 'harmony',
    type: 'pattern',
    definition: 'Series of chords moving through time',
    abstract: false,
    properties: ['chord_sequence', 'harmonic_rhythm', 'key_context'],
    examples: ['I-IV-V-I', 'ii-V-I', '12-bar blues'],
  },
  {
    id: createGofaiId('ontology', 'harmonic_function'),
    name: 'Harmonic Function',
    domain: 'harmony',
    type: 'functional',
    definition: 'Role of a chord within tonal context',
    abstract: true,
    properties: ['function_type', 'tendency', 'stability'],
    examples: ['tonic', 'dominant', 'subdominant', 'pre-dominant'],
    traditions: ['Western classical', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'voicing'),
    name: 'Voicing',
    domain: 'harmony',
    type: 'property',
    definition: 'Specific arrangement of chord tones',
    abstract: false,
    properties: ['spacing', 'doubling', 'range', 'voice_leading'],
    examples: ['close voicing', 'open voicing', 'drop-2', 'rootless voicing'],
  },
  {
    id: createGofaiId('ontology', 'voice_leading'),
    name: 'Voice Leading',
    domain: 'harmony',
    type: 'process',
    definition: 'Movement of individual voices between chords',
    abstract: false,
    properties: ['motion_type', 'smoothness', 'contrary_motion'],
    examples: ['parallel motion', 'contrary motion', 'oblique motion'],
    traditions: ['Western classical', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'modulation'),
    name: 'Modulation',
    domain: 'harmony',
    type: 'process',
    definition: 'Change from one tonal center to another',
    abstract: false,
    properties: ['source_key', 'target_key', 'technique'],
    examples: ['modulation to dominant', 'pivot chord modulation', 'direct modulation'],
    traditions: ['Western classical', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'tonality'),
    name: 'Tonality',
    domain: 'harmony',
    type: 'property',
    definition: 'Tonal organization around a central pitch',
    abstract: true,
    properties: ['tonic', 'mode', 'key_signature'],
    examples: ['C major tonality', 'A minor tonality'],
  },
  {
    id: createGofaiId('ontology', 'suspension'),
    name: 'Suspension',
    domain: 'harmony',
    type: 'pattern',
    definition: 'Note held over from previous chord creating dissonance',
    abstract: false,
    properties: ['preparation', 'dissonance', 'resolution'],
    examples: ['4-3 suspension', '9-8 suspension'],
    traditions: ['Western classical'],
  },
  {
    id: createGofaiId('ontology', 'pedal_point'),
    name: 'Pedal Point',
    domain: 'harmony',
    type: 'pattern',
    definition: 'Sustained or repeated note beneath changing harmonies',
    abstract: false,
    properties: ['pitch', 'duration', 'voice'],
    examples: ['tonic pedal', 'dominant pedal'],
  },
];

// =============================================================================
// Rhythmic Objects
// =============================================================================

const RHYTHMIC_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'rhythm'),
    name: 'Rhythm',
    domain: 'rhythm',
    type: 'pattern',
    definition: 'Pattern of durations and accents in time',
    abstract: true,
    properties: ['duration_pattern', 'accent_pattern', 'meter'],
    examples: ['straight eighths', 'swing rhythm', 'syncopated pattern'],
  },
  {
    id: createGofaiId('ontology', 'beat'),
    name: 'Beat',
    domain: 'rhythm',
    type: 'event',
    definition: 'Basic unit of pulse',
    abstract: false,
    properties: ['position', 'strength', 'subdivision'],
    examples: ['downbeat', 'upbeat', 'weak beat'],
  },
  {
    id: createGofaiId('ontology', 'meter'),
    name: 'Meter',
    domain: 'rhythm',
    type: 'property',
    definition: 'Recurring pattern of strong and weak beats',
    abstract: false,
    properties: ['beats_per_measure', 'beat_unit', 'grouping'],
    examples: ['4/4', '3/4', '6/8', '7/8', '5/4'],
  },
  {
    id: createGofaiId('ontology', 'groove'),
    name: 'Groove',
    domain: 'rhythm',
    type: 'quality',
    definition: 'Rhythmic feel created by timing and emphasis patterns',
    abstract: false,
    properties: ['swing_amount', 'microtiming', 'pocket'],
    examples: ['swing feel', 'straight feel', 'shuffle', 'laid-back groove'],
  },
  {
    id: createGofaiId('ontology', 'syncopation'),
    name: 'Syncopation',
    domain: 'rhythm',
    type: 'pattern',
    definition: 'Emphasis on weak beats or offbeats',
    abstract: false,
    properties: ['displacement', 'degree'],
    examples: ['offbeat accent', 'anticipated beat'],
  },
  {
    id: createGofaiId('ontology', 'polyrhythm'),
    name: 'Polyrhythm',
    domain: 'rhythm',
    type: 'pattern',
    definition: 'Simultaneous use of contrasting rhythms',
    abstract: false,
    properties: ['ratio', 'layers'],
    examples: ['3 against 2', '4 against 3', 'cross-rhythm'],
    traditions: ['African', 'Latin', 'Contemporary classical'],
  },
  {
    id: createGofaiId('ontology', 'tempo'),
    name: 'Tempo',
    domain: 'rhythm',
    type: 'property',
    definition: 'Speed of the beat',
    abstract: false,
    properties: ['bpm', 'stability', 'character'],
    examples: ['120 BPM', 'allegro', 'andante', 'presto'],
  },
  {
    id: createGofaiId('ontology', 'rubato'),
    name: 'Rubato',
    domain: 'rhythm',
    type: 'quality',
    definition: 'Expressive flexibility in tempo',
    abstract: false,
    properties: ['degree', 'scope'],
    examples: ['tempo rubato', 'flexible timing'],
    traditions: ['Western classical', 'Jazz'],
  },
  {
    id: createGofaiId('ontology', 'clave'),
    name: 'Clave',
    domain: 'rhythm',
    type: 'pattern',
    definition: 'Foundational rhythmic timeline pattern',
    abstract: false,
    properties: ['pattern_type', 'orientation'],
    examples: ['son clave', '3-2 clave', '2-3 clave', 'rumba clave'],
    traditions: ['Afro-Cuban', 'Latin'],
  },
  {
    id: createGofaiId('ontology', 'tala'),
    name: 'Tala',
    domain: 'rhythm',
    type: 'pattern',
    definition: 'Rhythmic cycle in Indian classical music',
    abstract: false,
    properties: ['matra_count', 'divisions', 'cycle_structure'],
    examples: ['teental', 'jhaptal', 'rupak'],
    traditions: ['Indian classical'],
  },
];

// =============================================================================
// Pitch and Scalar Objects
// =============================================================================

const PITCH_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'pitch'),
    name: 'Pitch',
    domain: 'pitch',
    type: 'physical',
    definition: 'Perceived frequency of a sound',
    abstract: false,
    properties: ['frequency', 'octave', 'pitch_class'],
    examples: ['A440', 'middle C', 'concert pitch'],
  },
  {
    id: createGofaiId('ontology', 'interval'),
    name: 'Interval',
    domain: 'pitch',
    type: 'relation',
    definition: 'Distance between two pitches',
    abstract: false,
    properties: ['size', 'quality', 'direction'],
    examples: ['major third', 'perfect fifth', 'minor seventh'],
  },
  {
    id: createGofaiId('ontology', 'scale'),
    name: 'Scale',
    domain: 'pitch',
    type: 'pattern',
    definition: 'Ordered collection of pitches',
    abstract: false,
    properties: ['pitch_collection', 'interval_pattern', 'tonic'],
    examples: ['major scale', 'minor scale', 'pentatonic', 'chromatic'],
  },
  {
    id: createGofaiId('ontology', 'mode'),
    name: 'Mode',
    domain: 'pitch',
    type: 'pattern',
    definition: 'Scale type distinguished by interval pattern and tonal center',
    abstract: false,
    properties: ['interval_sequence', 'characteristic_intervals'],
    examples: ['Dorian', 'Phrygian', 'Lydian', 'Mixolydian'],
    traditions: ['Western classical', 'Jazz', 'Modal jazz'],
  },
  {
    id: createGofaiId('ontology', 'maqam'),
    name: 'Maqam',
    domain: 'pitch',
    type: 'pattern',
    definition: 'Arabic modal framework with microtonal intervals',
    abstract: false,
    properties: ['ajnas', 'microtonal_intervals', 'development_rules'],
    examples: ['maqam Rast', 'maqam Bayati', 'maqam Hijaz'],
    traditions: ['Arabic', 'Turkish', 'Persian'],
  },
  {
    id: createGofaiId('ontology', 'raga'),
    name: 'Raga',
    domain: 'pitch',
    type: 'pattern',
    definition: 'Indian melodic framework with ascent/descent rules',
    abstract: false,
    properties: ['aroha', 'avaroha', 'vadi', 'samvadi', 'pakad'],
    examples: ['raga Bhairav', 'raga Yaman', 'raga Todi'],
    traditions: ['Indian classical'],
  },
  {
    id: createGofaiId('ontology', 'register'),
    name: 'Register',
    domain: 'pitch',
    type: 'property',
    definition: 'Specific range of pitches',
    abstract: false,
    properties: ['low_bound', 'high_bound', 'characteristic'],
    examples: ['bass register', 'treble register', 'alto range'],
  },
  {
    id: createGofaiId('ontology', 'tessitura'),
    name: 'Tessitura',
    domain: 'pitch',
    type: 'property',
    definition: 'Range where a part predominantly lies',
    abstract: false,
    properties: ['center_pitch', 'comfortable_range'],
    traditions: ['Western classical', 'Vocal music'],
  },
];

// =============================================================================
// Melodic Objects
// =============================================================================

const MELODIC_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'melody'),
    name: 'Melody',
    domain: 'melody',
    type: 'pattern',
    definition: 'Linear succession of pitches forming recognizable tune',
    abstract: false,
    properties: ['contour', 'range', 'intervals', 'rhythm'],
    examples: ['main theme', 'vocal line', 'lead melody'],
  },
  {
    id: createGofaiId('ontology', 'contour'),
    name: 'Melodic Contour',
    domain: 'melody',
    type: 'property',
    definition: 'Overall shape of melodic line',
    abstract: false,
    properties: ['direction', 'apex', 'nadir', 'shape_type'],
    examples: ['arch shape', 'ascending line', 'wave pattern'],
  },
  {
    id: createGofaiId('ontology', 'ornament'),
    name: 'Ornament',
    domain: 'melody',
    type: 'pattern',
    definition: 'Decorative embellishment of melodic line',
    abstract: false,
    properties: ['type', 'placement', 'duration'],
    examples: ['trill', 'mordent', 'turn', 'grace note', 'appoggiatura'],
    traditions: ['Western classical', 'Baroque', 'Indian classical'],
  },
  {
    id: createGofaiId('ontology', 'sequence'),
    name: 'Melodic Sequence',
    domain: 'melody',
    type: 'pattern',
    definition: 'Melodic pattern repeated at different pitch levels',
    abstract: false,
    properties: ['transposition_interval', 'repetition_count'],
    examples: ['rising sequence', 'descending sequence'],
  },
  {
    id: createGofaiId('ontology', 'gamak'),
    name: 'Gamak',
    domain: 'melody',
    type: 'pattern',
    definition: 'Melodic ornament in Indian classical music',
    abstract: false,
    properties: ['oscillation_type', 'approach', 'duration'],
    examples: ['meend', 'andolan', 'kan'],
    traditions: ['Indian classical'],
  },
  {
    id: createGofaiId('ontology', 'melisma'),
    name: 'Melisma',
    domain: 'melody',
    type: 'pattern',
    definition: 'Multiple notes sung on one syllable',
    abstract: false,
    properties: ['note_count', 'contour'],
    examples: ['vocal run', 'coloratura passage'],
    traditions: ['Western classical', 'Gospel', 'R&B'],
  },
];

// =============================================================================
// Timbral Objects
// =============================================================================

const TIMBRAL_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'timbre'),
    name: 'Timbre',
    domain: 'timbre',
    type: 'perceptual',
    definition: 'Quality or color of a sound',
    abstract: true,
    properties: ['spectral_content', 'envelope', 'texture'],
    examples: ['bright', 'dark', 'warm', 'harsh', 'smooth'],
  },
  {
    id: createGofaiId('ontology', 'instrument'),
    name: 'Instrument',
    domain: 'timbre',
    type: 'physical',
    definition: 'Device for producing musical sounds',
    abstract: false,
    properties: ['family', 'range', 'timbre_characteristics', 'technique'],
    examples: ['piano', 'violin', 'trumpet', 'synthesizer'],
  },
  {
    id: createGofaiId('ontology', 'envelope'),
    name: 'Amplitude Envelope',
    domain: 'timbre',
    type: 'property',
    definition: 'Time-varying amplitude shape of a sound',
    abstract: false,
    properties: ['attack', 'decay', 'sustain', 'release'],
    examples: ['ADSR envelope', 'percussive envelope', 'sustained envelope'],
  },
  {
    id: createGofaiId('ontology', 'articulation'),
    name: 'Articulation',
    domain: 'performance',
    type: 'quality',
    definition: 'Manner of note attack and connection',
    abstract: false,
    properties: ['attack_type', 'duration_modification', 'connection'],
    examples: ['staccato', 'legato', 'marcato', 'tenuto', 'pizzicato'],
  },
  {
    id: createGofaiId('ontology', 'texture'),
    name: 'Musical Texture',
    domain: 'timbre',
    type: 'property',
    definition: 'Density and relationship of simultaneous musical lines',
    abstract: false,
    properties: ['layer_count', 'density', 'organization'],
    examples: ['monophonic', 'homophonic', 'polyphonic', 'heterophonic'],
  },
];

// =============================================================================
// Production Objects
// =============================================================================

const PRODUCTION_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'effect'),
    name: 'Audio Effect',
    domain: 'production',
    type: 'process',
    definition: 'Signal processing altering sound',
    abstract: true,
    properties: ['type', 'parameters', 'wet_dry_mix'],
    examples: ['reverb', 'delay', 'compression', 'EQ', 'distortion'],
  },
  {
    id: createGofaiId('ontology', 'spatial_position'),
    name: 'Spatial Position',
    domain: 'production',
    type: 'property',
    definition: 'Perceived location in stereo or surround field',
    abstract: false,
    properties: ['pan', 'width', 'depth', 'height'],
    examples: ['center', 'left', 'wide stereo', 'narrow mono'],
  },
  {
    id: createGofaiId('ontology', 'dynamics'),
    name: 'Dynamics',
    domain: 'production',
    type: 'property',
    definition: 'Loudness level and variation',
    abstract: false,
    properties: ['level', 'range', 'contour'],
    examples: ['forte', 'piano', 'crescendo', 'sforzando'],
  },
  {
    id: createGofaiId('ontology', 'mix_balance'),
    name: 'Mix Balance',
    domain: 'production',
    type: 'property',
    definition: 'Relative levels of different elements',
    abstract: false,
    properties: ['element_levels', 'frequency_balance', 'spatial_distribution'],
    examples: ['vocal up front', 'drums loud', 'balanced mix'],
  },
];

// =============================================================================
// Performance Objects
// =============================================================================

const PERFORMANCE_OBJECTS: readonly MusicalObject[] = [
  {
    id: createGofaiId('ontology', 'technique'),
    name: 'Performance Technique',
    domain: 'performance',
    type: 'process',
    definition: 'Method of sound production',
    abstract: true,
    properties: ['execution', 'effect', 'difficulty'],
    examples: ['bowing', 'fingering', 'breath control', 'pedaling'],
  },
  {
    id: createGofaiId('ontology', 'expression'),
    name: 'Musical Expression',
    domain: 'performance',
    type: 'quality',
    definition: 'Conveyance of emotion and character',
    abstract: true,
    properties: ['intensity', 'character', 'nuance'],
    examples: ['espressivo', 'dolce', 'agitato', 'cantabile'],
  },
  {
    id: createGofaiId('ontology', 'phrasing'),
    name: 'Musical Phrasing',
    domain: 'performance',
    type: 'process',
    definition: 'Shaping of musical phrases through timing and dynamics',
    abstract: false,
    properties: ['breath_points', 'emphasis', 'flow'],
    examples: ['breathing between phrases', 'dynamic shaping', 'rubato'],
  },
];

// =============================================================================
// Ontology Table and Utilities
// =============================================================================

/**
 * All musical objects in the ontology.
 */
export const ALL_MUSICAL_OBJECTS: readonly MusicalObject[] = [
  ...STRUCTURAL_OBJECTS,
  ...HARMONIC_OBJECTS,
  ...RHYTHMIC_OBJECTS,
  ...PITCH_OBJECTS,
  ...MELODIC_OBJECTS,
  ...TIMBRAL_OBJECTS,
  ...PRODUCTION_OBJECTS,
  ...PERFORMANCE_OBJECTS,
];

/**
 * Musical objects vocabulary table.
 */
export const MUSICAL_OBJECTS_TABLE: VocabularyTable<MusicalObject> =
  createVocabularyTable(
    ALL_MUSICAL_OBJECTS.map(obj => ({
      ...obj,
      variants: [obj.name],
    }))
  );

/**
 * Get a musical object by ID.
 */
export function getMusicalObjectById(id: GofaiId): MusicalObject | undefined {
  return MUSICAL_OBJECTS_TABLE.byId.get(id);
}

/**
 * Get musical objects by domain.
 */
export function getMusicalObjectsByDomain(
  domain: OntologicalDomain
): readonly MusicalObject[] {
  return ALL_MUSICAL_OBJECTS.filter(obj => obj.domain === domain);
}

/**
 * Get musical objects by type.
 */
export function getMusicalObjectsByType(
  type: OntologicalType
): readonly MusicalObject[] {
  return ALL_MUSICAL_OBJECTS.filter(obj => obj.type === type);
}

/**
 * Get musical objects by tradition.
 */
export function getMusicalObjectsByTradition(
  tradition: string
): readonly MusicalObject[] {
  return ALL_MUSICAL_OBJECTS.filter(
    obj => obj.traditions && obj.traditions.includes(tradition)
  );
}

/**
 * Get child objects of a parent.
 */
export function getChildObjects(parentId: GofaiId): readonly MusicalObject[] {
  return ALL_MUSICAL_OBJECTS.filter(obj => obj.parent === parentId);
}

/**
 * Check if an object is abstract.
 */
export function isAbstract(id: GofaiId): boolean {
  const obj = getMusicalObjectById(id);
  return obj?.abstract ?? false;
}

/**
 * Get the ontological hierarchy path for an object.
 */
export function getOntologyPath(id: GofaiId): readonly MusicalObject[] {
  const path: MusicalObject[] = [];
  let current = getMusicalObjectById(id);
  
  while (current) {
    path.unshift(current);
    current = current.parent ? getMusicalObjectById(current.parent) : undefined;
  }
  
  return path;
}

/**
 * Get ontology statistics.
 */
export function getOntologyStats() {
  const byDomain = new Map<OntologicalDomain, number>();
  const byType = new Map<OntologicalType, number>();
  const byTradition = new Map<string, number>();
  
  for (const obj of ALL_MUSICAL_OBJECTS) {
    byDomain.set(obj.domain, (byDomain.get(obj.domain) || 0) + 1);
    byType.set(obj.type, (byType.get(obj.type) || 0) + 1);
    if (obj.traditions) {
      for (const tradition of obj.traditions) {
        byTradition.set(tradition, (byTradition.get(tradition) || 0) + 1);
      }
    }
  }
  
  return {
    total: ALL_MUSICAL_OBJECTS.length,
    byDomain: Object.fromEntries(byDomain),
    byType: Object.fromEntries(byType),
    byTradition: Object.fromEntries(byTradition),
    abstractCount: ALL_MUSICAL_OBJECTS.filter(obj => obj.abstract).length,
    concreteCount: ALL_MUSICAL_OBJECTS.filter(obj => !obj.abstract).length,
  };
}
