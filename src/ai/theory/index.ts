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

  // LCC constraint types (C1174-C1175)
  type ConstraintLCCGravity,
  type ConstraintLCCParentScale,

  // Orchestration types (C1541-C1543)
  type ConstraintOrchestrationAlgorithm,
  type ConstraintTimbreMatching,
  type OrchestrationSolution,

  // East Asian types (C1814-C1817)
  type EastAsianTradition,
  type ChineseRegionalStyle,
  type ConstraintEastAsianTradition,
  type ConstraintChineseRegional,
  type EastAsianScale,

  // Jazz vocabulary types (C1411-C1412)
  type JazzVocabularyLevel,
  type JazzStyleEra,
  type ConstraintJazzVocabularyLevel,
  type ConstraintJazzStyleEra,

  // Japanese genre (C1816)
  type JapaneseGenre,
  type ConstraintJapaneseGenre,

  // Latin style (C1880)
  type LatinStyle,
  type ConstraintLatinStyle,
} from './music-spec';

// Host Actions (Change 351, 361)
export {
  // Envelope type (Change 361)
  type HostActionEnvelope,
  
  // Action types
  type HostAction,
  type SetParamAction,
  type AddConstraintAction,
  type RemoveConstraintAction,
  type ApplyPackAction,
  type AddCardAction,
  type RemoveCardAction,
  type SetKeyAction,
  type SetTempoAction,
  type SetMeterAction,
  type SetCultureAction,
  type SetStyleAction,
  type SwitchBoardAction,
  type AddDeckAction,
  type ShowWarningAction,
  
  // Parsing
  parseHostActionFromPrologTerm,
} from './host-actions';

// Prolog bridge
export {
  specToPrologFacts,
  specToPrologTerm,
  factsToSpec,
  boardContextToPrologFacts,
  currentSpecGoal,
  setCurrentSpecFact,
  generateCompleteSpecProlog,
  prologConstraintTermToMusicConstraint,
  prologValueToMusicConstraints,
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

  // Constraint parameter types (C1072-C1074)
  type ConstraintParamType,
  type ConstraintParamEnum,
  type ConstraintParamNumber,
  type ConstraintParamRange,
  type ConstraintParamBoolean,
  type ConstraintParamString,
  type ConstraintParamMusicType,
  type ConstraintParamNote,
  type ConstraintParamChord,
  type ConstraintParamScale,
  type ConstraintParamMode,
  type ConstraintParamCultureType,
  type ConstraintParamRaga,
  type ConstraintParamTala,
  type ConstraintParamTuneType,
  type ConstraintParamChineseMode,
  type AnyConstraintParam,

  // Namespace validation (C1003)
  VALID_NAMESPACES,
  validateNamespace,

  // Runtime validation (C1004-C1005)
  validateConstraintParams,

  // Versioning (C1008)
  type ConstraintVersion,
  parseConstraintVersion,
  compareVersions,

  // Pack format (C1006-C1007)
  type ConstraintPackData,

  // Registry
  constraintRegistry,
  isCustomConstraint,

  // Helpers
  createCustomConstraint,
  defineSimpleConstraint,
  registerCardConstraints,
  unregisterCardConstraints,
  generateCustomPrologLoader,
  customConstraintsToPrologFacts,

  // Definition validation (C1002)
  validateConstraintDefinition,

  // Prolog safety (C1022-C1024)
  type PrologSyntaxError,
  sanitizePrologCode,
  enforcePrologNamespace,
  validatePrologSyntax,

  // Prolog dependencies (C1025)
  type PrologDependency,
  validatePrologDependencies,

  // Prolog predicate versioning (C1026)
  type PrologPredicateInfo,
  registerPredicateInfo,
  getPredicateInfo,
  isPredicateDeprecated,

  // Prolog error reporting (C1030)
  parsePrologErrors,

  // Prolog timeout (C1031)
  type PrologTimeoutConfig,
  DEFAULT_PROLOG_TIMEOUT,
  generateTimeoutPreamble,

  // Prolog load/unload API (C1027-C1028)
  loadCustomProlog,
  unloadCustomProlog,

  // Deprecation and migration (C1009-C1010)
  type ConstraintMigrationFn,
  checkDeprecatedConstraints,
  registerConstraintMigration,
  migrateConstraint,
  migrateConstraints,

  // Parameter groups and presets (C1075-C1078)
  type ConstraintParamGroup,
  type ConstraintPreset,
  saveConstraintPreset,
  loadConstraintPresets,
  deleteConstraintPreset,
  randomizeConstraintParams,
  interpolateConstraintParams,

  // Learn from selection (C1083)
  learnConstraintsFromSelection,

  // Export/import (C1085-C1086)
  exportConstraintsToJSON,
  exportConstraintsToProlog,
  importConstraintsFromJSON,

  // Built-in constraint packs (C1413-C1414)
  BEBOP_FUNDAMENTALS_PACK,
  MODAL_JAZZ_VOCABULARY_PACK,

  // Pack format (C1014)
  type ConstraintPackManifest,
  type ConstraintPackDefinitionEntry,
  validatePackManifest,
  serializePackManifest,
  parsePackManifest,

  // Pack signing (C1015)
  type ConstraintPackSignature,
  hashPackContent,
  verifyPackSignature,

  // Prolog sandbox (C1029)
  type PrologSandboxResult,
  sandboxPrologCode,

  // Card template (C1047)
  createTheoryCardTemplate,

  // Bidirectional sync (C1048-C1051)
  type ParamConstraintMapping,
  declareParamConstraintMappings,
  syncConstraintToParam,
  syncParamToConstraint,
  type CardToCardLink,
  registerCardLink,
  getCardLinks,
  clearCardLinks,

  // Card pack bundling (C1054-C1058)
  type CardPackDefinition,
  type CardPackInstallResult,
  createCardPack,
  installCardPack,
  resolvePackDependencies,
  checkPackUpdate,
  getInstalledPacks,
  uninstallCardPack,

  // Generic editor (C1071)
  type EditorFieldDescriptor,
  generateEditorFields,

  // Project/workspace persistence (C1091-C1098)
  type ConstraintProfile,
  type ProjectConstraintState,
  saveProjectConstraints,
  loadProjectConstraints,
  getDefaultPackPreference,
  saveConstraintProfile,
  loadConstraintProfile,
  listConstraintProfiles,
  deleteConstraintProfile,
  exportProjectBundle,
  importProjectBundle,
  type ConstraintHealthReport,
  runConstraintHealthCheck,
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
  SET_BUILDER_CARD,

  // LCC cards (C1161-C1165)
  LYDIAN_CHROMATIC_CARD,
  TONAL_GRAVITY_VISUALIZER_CARD,
  PARENT_SCALE_CARD,
  CHORD_SCALE_UNITY_CARD,
  UPPER_STRUCTURE_CARD,

  // Jazz reharmonization cards (C1342-C1344)
  REHARMONIZATION_CARD,
  TRITONE_SUB_CARD,
  COLTRANE_CHANGES_CARD,

  // Jazz improv cards (C1391-C1395)
  BEBOP_SCALE_CARD,
  ENCLOSURE_CARD,
  DIGITAL_PATTERN_CARD,
  GUIDE_TONE_CARD,
  LICK_LIBRARY_CARD,

  // Fill builder (C936)
  FILL_BUILDER_CARD,
  // Jazz advanced cards (C1396-C1397)
  MOTIF_DEVELOPER_CARD,
  OUTSIDE_CARD,

  // LCC helpers
  LCC_SCALES,
  getLCCScaleIntervals,
  calculateTonalGravity,
  BEBOP_SCALES,
  getBebopScaleIntervals,
  UPPER_STRUCTURE_TRIADS,

  // Conflict detection
  type ConstraintConflict,
  type CardConflictBadge,
  detectConstraintConflicts,
  getCardConflictBadge,

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

// MusicSpec Store (Changes 363-365)
export {
  getMusicSpecStore,
  resetMusicSpecStore,
} from './music-spec-store';

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
