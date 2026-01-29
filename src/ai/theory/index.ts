/**
 * @fileoverview Theory Module Index - Branch C Music Theory Extensions
 * 
 * This module provides the core infrastructure for Branch C:
 * - MusicSpec types and helpers
 * - Prolog bridge for spec ⇄ KB integration
 * - Custom constraint registry for user extensions
 * 
 * @module @cardplay/ai/theory
 */

// Core MusicSpec types and helpers
export {
  // Types
  type RootName,
  type ModeName,
  type ChordQuality,
  type CultureTag,
  type StyleTag,
  type TonalityModel,
  type GalantSchemaName,
  type OrnamentType,
  type AccentModel,
  type TalaName,
  type JatiType,
  type CelticTuneType,
  type ChineseModeName,
  type RagaName,
  type FilmMood,
  type FilmDevice,
  type CadenceType,
  
  // Constraint types
  type MusicConstraint,
  type ConstraintKey,
  type ConstraintTempo,
  type ConstraintMeter,
  type ConstraintTonalityModel,
  type ConstraintStyle,
  type ConstraintCulture,
  type ConstraintSchema,
  type ConstraintRaga,
  type ConstraintTala,
  type ConstraintCelticTune,
  type ConstraintChineseMode,
  type ConstraintFilmMood,
  type ConstraintFilmDevice,
  type ConstraintPhraseDensity,
  type ConstraintContour,
  type ConstraintGrouping,
  type ConstraintAccent,
  type ConstraintGamakaDensity,
  type ConstraintOrnamentBudget,
  type ConstraintHarmonicRhythm,
  type ConstraintCadence,
  type ConstraintCustom,
  
  // MusicSpec
  type MusicSpec,
  type Explainable,
  DEFAULT_MUSIC_SPEC,
  
  // Helpers
  explainable,
  createMusicSpec,
  withConstraints,
  withoutConstraintType,
  withKey,
  withMeter,
  withTempo,
  withCulture,
  withStyle,
  
  // Constraint factories
  keyConstraint,
  tempoConstraint,
  schemaConstraint,
  ragaConstraint,
  talaConstraint,
  celticTuneConstraint,
  chineseModeConstraint,
  filmMoodConstraint,
  filmDeviceConstraint,
  groupingConstraint,
  getConstraintsOfType,
  hasConstraint,
} from './music-spec';

// Prolog bridge
export {
  specToPrologFacts,
  specToPrologTerm,
  factsToSpec,
  boardContextToPrologFacts,
  currentSpecGoal,
  setCurrentSpecFact,
  generateCompleteSpecProlog,
  type PrologBindings,
  type BoardContext,
} from './spec-prolog-bridge';

// Custom constraint system
export {
  // Types
  type CustomConstraint,
  type CustomConstraintDefinition,
  type CustomConstraintCategory,
  type ValidationResult,
  type ConflictInfo,
  type ConstraintContributingCard,
  
  // Registry
  constraintRegistry,
  isCustomConstraint,
  
  // Helpers
  createCustomConstraint,
  defineSimpleConstraint,
  registerCardConstraints,
  generateCustomPrologLoader,
  customConstraintsToPrologFacts,
} from './custom-constraints';
