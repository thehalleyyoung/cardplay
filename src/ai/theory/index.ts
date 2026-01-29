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
  trailerBuildConstraint,
  leitmotifConstraint,
  droneConstraint,
  patternRoleConstraint,
  swingConstraint,
  heterophonyConstraint,
  maxIntervalConstraint,
  arrangerStyleConstraint,
  sceneArcConstraint,
  getConstraintsOfType,
  hasConstraint,

  // New canonical types (C031-C047)
  type VoiceRole,
  type RegisterModel,
  type DensityLevel,
  type TensionDevice,
  type ExtendedCadenceType,
  type HarmonicRhythmLevel,
  type MelodicContour,
  type MotifFingerprint,
  type Articulation,
  type InstrumentFamily,
  type ArrangerStyle,
  type PhraseType,
  type PatternRole,

  // New constraint types
  type ConstraintTrailerBuild,
  type ConstraintLeitmotif,
  type ConstraintDrone,
  type ConstraintPatternRole,
  type ConstraintSwing,
  type ConstraintHeterophony,
  type ConstraintMaxInterval,
  type ConstraintArrangerStyle,
  type ConstraintSceneArc,
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

// Theory cards (C091-C099 + new cards)
export {
  // Protocol types
  type TheoryCardParamState,
  type TheoryCardState,
  type TheoryCardParamDef,
  type TheoryCardDef,

  // Core theory cards (C091-C099)
  CONSTRAINT_PACK_CARD,
  TONALITY_MODEL_CARD,
  METER_ACCENT_CARD,
  GROUPING_CARD,
  SCHEMA_CARD,
  FILM_SCORING_CARD,
  CARNATIC_RAGA_TALA_CARD,
  CELTIC_TUNE_CARD,
  CHINESE_MODE_CARD,

  // New cards (C228-C229, C411, C511-C513, C689-C690, C789-C791, C885-C888)
  TRAILER_BUILD_CARD,
  LEITMOTIF_LIBRARY_CARD,
  LEITMOTIF_MATCHER_CARD,
  DRONE_CARD,
  MRIDANGAM_PATTERN_CARD,
  KORVAI_GENERATOR_CARD,
  ORNAMENT_GENERATOR_CARD,
  BODHRAN_CARD,
  HETEROPHONY_CARD,
  GUZHENG_GLISS_CARD,
  ERHU_ORNAMENT_CARD,
  TONALITY_ANALYSIS_CARD,
  GROUPING_ANALYSIS_CARD,
  SCHEMA_ANALYSIS_CARD,
  CULTURE_ANALYSIS_CARD,

  // Registry functions
  THEORY_CARDS,
  defaultCardState,
  getTheoryCard,
  getTheoryCardsForCulture,
  getTheoryCardsByCategory,
  applyTheoryCards,
  extractAllConstraints,
  getTonalityWeights,
} from './theory-cards';

// Spec event bus (C913-C915)
export {
  type SpecChangeEvent,
  type ParamLink,
  type SpecChangeHandler,
  SpecEventBus,
  specBus,
  registerDefaultLinks,
} from './spec-event-bus';

// Selection analyzer (C882-C883)
export {
  type NoteEvent,
  type SelectionProfile,
  type CultureMatch,
  type RagaMatch,
  type ChineseModeMatch,
  type SchemaMatch,
  type SelectionAnalysis,
  extractProfile,
  matchCultures,
  matchRagas,
  matchChineseModes,
  analyzeSelection,
} from './selection-analyzer';
