/**
 * GOFAI Canon — Single Source of Truth Vocabulary and Types
 *
 * This module contains all canonical vocabulary tables, ID types, and
 * normalizers for the GOFAI Music+ system. Everything here is the SSOT
 * and should be the only place where vocabulary is defined.
 *
 * ## Canon Discipline
 *
 * 1. Every vocabulary item has a stable ID
 * 2. Every synonym maps to a canonical form
 * 3. Normalizers are generated from canon tables
 * 4. Tests validate canon table integrity
 * 5. Drift between code and docs blocks CI
 *
 * @module gofai/canon
 */

// =============================================================================
// Re-exports
// =============================================================================

// Core types and ID constructors
export * from './types';

// Schema versioning and migrations
export * from './versioning';

// Perceptual axes (brightness, energy, tension, etc.)
export * from './perceptual-axes';

// Core lexeme vocabulary (verbs, adjectives, adverbs, etc.)
export * from './lexemes';

// Song section types (verse, chorus, bridge, etc.)
export {
  SECTION_VOCABULARY,
  getSectionById,
  getSectionByName,
  type SectionVocabularyEntry,
} from './section-vocabulary';

// Layer/track types (drums, bass, lead, etc.)
export {
  LAYER_VOCABULARY,
  getLayerById,
  getLayerByName,
  type LayerVocabularyEntry,
} from './layer-vocabulary';

// Measurement units (bars, beats, semitones, etc.)
export * from './units';

// Edit action opcodes (change, add, remove, etc.)
export * from './edit-opcodes';

// Structure editing opcodes (Step 276)
export {
  STRUCTURE_OPCODES,
  STRUCTURE_OPCODE_COUNT,
  OP_DUPLICATE_SECTION,
  OP_REPEAT_SECTION,
  OP_EXTEND_SECTION,
  OP_SHORTEN_SECTION,
  OP_TRIM_SECTION,
  OP_INSERT_PICKUP,
  OP_INSERT_BREAK,
  OP_INSERT_BUILD,
  OP_INSERT_DROP,
  OP_MOVE_SECTION,
  OP_SWAP_SECTIONS,
  OP_DELETE_SECTION,
  OP_SPLIT_SECTION,
  OP_MERGE_SECTIONS,
  OP_ADD_TRANSITION,
  OP_REMOVE_TRANSITION,
  OP_ADD_INTRO,
  OP_ADD_OUTRO,
  OP_APPLY_FORM_TEMPLATE,
} from './edit-opcodes-structure';

// Harmony editing opcodes (Step 278)
export {
  HARMONY_OPCODES,
  HARMONY_OPCODE_COUNT,
  OP_REVOICE_CHORDS,
  OP_OPTIMIZE_VOICE_LEADING,
  OP_ADJUST_CHORD_DENSITY,
  OP_ADD_CHORD_EXTENSIONS,
  OP_REMOVE_CHORD_EXTENSIONS,
  OP_ALTER_CHORD_TONES,
  OP_SUBSTITUTE_CHORD,
  OP_TRITONE_SUBSTITUTION,
  OP_MODAL_INTERCHANGE,
  OP_REHARMONIZE_FUNCTIONAL,
  OP_ADD_PASSING_CHORDS,
  OP_REMOVE_PASSING_CHORDS,
  OP_ALTER_BASS_LINE,
  OP_ADD_PEDAL_POINT,
  OP_ADJUST_HARMONIC_RHYTHM,
  OP_ADD_SECONDARY_DOMINANTS,
} from './edit-opcodes-harmony';

// Melody editing opcodes (Step 279)
export {
  MELODY_OPCODES,
  MELODY_OPCODE_COUNT,
  OP_ADD_MELODIC_ORNAMENTS,
  OP_REMOVE_MELODIC_ORNAMENTS,
  OP_SHAPE_MELODIC_CONTOUR,
  OP_INVERT_MELODIC_INTERVALS,
  OP_SMOOTH_MELODIC_LEAPS,
  OP_EMPHASIZE_MELODIC_LEAPS,
  OP_SHIFT_MELODIC_REGISTER,
  OP_COMPRESS_MELODIC_RANGE,
  OP_EXPAND_MELODIC_RANGE,
  OP_CREATE_MELODIC_VARIATION,
  OP_SEQUENCE_MELODIC_PHRASE,
  OP_ADJUST_MELODIC_RHYTHM,
  OP_ADJUST_PHRASE_LENGTHS,
  OP_ADD_MELODIC_REST,
} from './edit-opcodes-melody';

// Arrangement editing opcodes (Step 280)
export {
  ARRANGEMENT_OPCODES,
  ARRANGEMENT_OPCODE_COUNT,
  OP_ADD_LAYER,
  OP_REMOVE_LAYER,
  OP_MUTE_LAYER,
  OP_UNMUTE_LAYER,
  OP_REASSIGN_LAYER_ROLE,
  OP_DISTRIBUTE_ROLE_ACROSS_LAYERS,
  OP_CONSOLIDATE_LAYERS,
  OP_SHAPE_ARRANGEMENT_DENSITY,
  OP_CREATE_CALL_AND_RESPONSE,
  OP_ADD_COUNTER_MELODY,
  OP_CHANGE_INSTRUMENTATION,
  OP_DOUBLE_LAYER_AT_OCTAVE,
  OP_APPLY_ORCHESTRATION_TEMPLATE,
  OP_ADJUST_LAYER_BALANCE,
  OP_ADD_LAYER_AUTOMATION,
  OP_CREATE_TEXTURE_TRANSITION,
} from './edit-opcodes-arrangement';

// Constraint types (preserve, only_change, etc.)
export * from './constraint-types';

// Effect taxonomy (inspect, propose, mutate)
export * from './effect-taxonomy';

// Goals, constraints, and preferences model
export * from './goals-constraints-preferences';

// Normalization utilities (from normalize.ts, not re-exported from vocabularies)
export {
  normalizeSectionName,
  normalizeLayerName,
  lookupVocabulary as lookupCanonVocabulary,
} from './normalize';

// Validation checks
// TODO: Re-enable when check module is implemented
// export {
//   validateLexemes,
//   validateSections,
//   validateLayers,
//   validateUnits,
//   validateAxes,
//   validateOpcodes,
//   validateConstraints,
//   validateAllVocabularies,
//   assertVocabulariesValid,
//   logValidationResults,
//   type ValidationError,
//   type ValidationResult,
//   type FullValidationResult,
//   type VocabularyCategory,
// } from './check';

// Semantic safety invariants
export * from './semantic-safety';

// Domain nouns vocabulary (musical terminology)
export {
  ALL_DOMAIN_NOUNS,
  DOMAIN_NOUNS_TABLE,
  DOMAIN_NOUNS_BATCH_1,
  getDomainNounById,
  getDomainNounByTerm,
  getDomainNounsByCategory,
  getDomainNounsByTradition,
  searchDomainNouns,
  getAllCategories,
  getAllTraditions,
  getDomainNounStats,
  type DomainNoun,
  type DomainNounCategory,
  type DomainNounSemantics,
} from './domain-nouns';

// Default interpretations (no-magic inspectable defaults)
export * from './default-interpretations';

// Musical object ontology
export {
  ALL_MUSICAL_OBJECTS,
  MUSICAL_OBJECTS_TABLE,
  getMusicalObjectById,
  getMusicalObjectsByDomain,
  getMusicalObjectsByType,
  getMusicalObjectsByTradition,
  getChildObjects,
  isAbstract,
  getOntologyPath,
  getOntologyStats,
  type MusicalObject,
  type OntologicalDomain,
  type OntologicalType,
} from './musical-ontology';

// Change-control rules for canon modifications
export * from './change-control';

// Entity reference types with branded IDs
export * from './entity-refs';

// EventSelector: typed predicate language over Event<P>
export * from './event-selector';

// Canonical time vocabulary
export * from './time-vocabulary';

// Event-level references in natural language
export * from './event-level-references';

// Typed targets for preserve/only-change constraints
export * from './preservation-targets';

// Domain noun vocabulary batch 16: Musical expression & articulation
export {
  EXPRESSION_ARTICULATION_LEXEMES,
  default as EXPRESSION_ARTICULATION_BATCH,
} from './domain-nouns-batch16-expression';

// Domain noun vocabulary batch 17: Genres & musical styles
export {
  GENRE_STYLE_LEXEMES,
  default as GENRE_STYLE_BATCH,
} from './domain-nouns-batch17-genres';

// Domain noun vocabulary batch 18: Audio production & mixing
export {
  PRODUCTION_MIXING_LEXEMES,
  default as PRODUCTION_MIXING_BATCH,
} from './domain-nouns-batch18-production';

// Musical role lexeme classes (Step 121)
export {
  MUSICAL_ROLE_LEXEMES_BATCH1,
  default as MUSICAL_ROLE_BATCH1,
  getMusicalRoleBatch1Stats,
} from './musical-roles-batch1';

export {
  MUSICAL_ROLE_LEXEMES_BATCH2,
  default as MUSICAL_ROLE_BATCH2,
  getMusicalRoleBatch2Stats,
} from './musical-roles-batch2';

export {
  MUSICAL_ROLE_LEXEMES_BATCH3,
  default as MUSICAL_ROLE_BATCH3,
  getMusicalRoleBatch3Stats,
} from './musical-roles-batch3';

// Musical object lexeme classes (Step 122)
export {
  MUSICAL_OBJECT_LEXEMES_BATCH1,
  default as MUSICAL_OBJECT_BATCH1,
  getMusicalObjectBatch1Stats,
} from './musical-objects-batch1';

export {
  MUSICAL_OBJECT_LEXEMES_BATCH2,
  default as MUSICAL_OBJECT_BATCH2,
  getMusicalObjectBatch2Stats,
} from './musical-objects-batch2';

// Production term lexeme classes (Step 123)
export {
  PRODUCTION_TERM_LEXEMES_BATCH1,
  default as PRODUCTION_TERM_BATCH1,
  getProductionTermBatch1Stats,
} from './production-terms-batch1';

// Domain verb vocabulary batch 37: Comprehensive editing operations
export {
  DOMAIN_VERBS_BATCH_37,
  BATCH_37_COUNT,
  STRUCTURAL_EDITING_VERBS,
  PARAMETER_ADJUSTMENT_VERBS,
  LAYER_CONTROL_VERBS,
  TIME_MANIPULATION_VERBS,
  CONTENT_GENERATION_VERBS,
  ANALYSIS_INSPECTION_VERBS,
  CREATIVE_TRANSFORMATION_VERBS,
} from './domain-verbs-batch37-editing-operations';

// Adjectives batch 38: Comprehensive audio descriptors
export {
  AUDIO_DESCRIPTOR_ADJECTIVES_BATCH_38,
  BATCH_38_COUNT,
  FREQUENCY_ADJECTIVES,
  TIME_DOMAIN_ADJECTIVES,
  SPATIAL_ADJECTIVES,
  DYNAMIC_ADJECTIVES,
  TIMBRAL_ADJECTIVES,
  TEXTURAL_ADJECTIVES,
  ENERGY_MOVEMENT_ADJECTIVES,
} from './adjectives-audio-descriptors-batch38';

// Domain nouns batch 39: Music theory comprehensive
export {
  MUSIC_THEORY_NOUNS_BATCH_39,
  BATCH_39_COUNT,
  TRIAD_NOUNS,
  SEVENTH_CHORD_NOUNS,
  CHORD_EXTENSION_NOUNS,
  DIATONIC_MODE_NOUNS,
  MINOR_SCALE_VARIANT_NOUNS,
  PENTATONIC_BLUES_NOUNS,
  SYNTHETIC_SCALE_NOUNS,
  HARMONIC_FUNCTION_NOUNS,
  CADENCE_NOUNS,
  VOICE_LEADING_NOUNS,
} from './domain-nouns-music-theory-batch39';

// Domain nouns batch 40: Production effects and processing
export {
  PRODUCTION_EFFECTS_NOUNS_BATCH_40,
  BATCH_40_COUNT,
  DYNAMIC_PROCESSOR_NOUNS,
  TIME_BASED_EFFECTS_NOUNS,
  DISTORTION_SATURATION_NOUNS,
  FILTER_EQ_NOUNS,
  SPATIAL_EFFECTS_NOUNS,
  CREATIVE_PROCESSORS_NOUNS,
} from './domain-nouns-production-effects-batch40';

// CPL AST three-layer architecture (CPL-Intent, CPL-Plan, CPL-Host)
export * from './cpl-ast-layers';

// Expanded CPL hole types with typed candidate sets
export * from './cpl-holes-expanded';

// Speech act types (root of CPL-Intent)
export * from './speech-acts';
