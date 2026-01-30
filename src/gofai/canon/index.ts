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
