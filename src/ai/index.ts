/**
 * @fileoverview AI module barrel export.
 * 
 * Exports the Prolog-based AI system for CardPlay.
 * 
 * @module @cardplay/ai
 */

// Engine exports
export * from './engine';

// Knowledge base exports
export * from './knowledge';

// Query helper exports (avoid name collisions with harmony module)
// Note: Using separate export blocks to avoid ambiguous re-export warnings
export * from './queries/board-queries';
export * from './queries/composition-queries';
export {
  areEnharmonic,
  checkVoiceLeading,
  getChordTones,
  getDiatonicChord,
  getHarmonicFunction,
  getInterval,
  getNoteDistance,
  getProgression,
  getScaleNotes,
  getTension,
  identifyChord,
  identifyScale,
  invertInterval,
  isChordTone,
  isInInstrumentRange,
  isNoteInScale,
  isSmoothMotion,
  suggestNextChord,
  transposeNote,
  transposeNotes,
  type CadenceType,
  type ChordIdentification,
  type ChordType,
  type IntervalName,
  type NoteName,
  type ScaleIdentification,
  type ScaleType,
  type ChordSuggestion as TheoryChordSuggestion,
  type HarmonicFunction as TheoryHarmonicFunction
} from './queries/theory-queries';

// Spec queries (Branch C)
export {
  detectKeyKS,
  detectKeyDFT,
  detectKeyAdvanced,
  detectSpecConflicts,
  lintSpec,
  matchGalantSchema,
  matchRaga,
  recommendFilmDevices,
  recommendFilmMode,
  recommendModeForSpec,
  getConstraintPack,
  listConstraintPacks,
  type SpecConflict,
  type SpecLintWarning,
  type KeyDetectionResult,
  type SchemaMatch,
  type ModeRecommendation,
  type FilmDeviceRecommendation,
} from './queries/spec-queries';

// Theory types (Branch C)
// Re-export everything from theory except HostAction which is already exported from ./engine
export {
  // MusicSpec types
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
  type DensityLevel,
  type TensionDevice,
  type RegisterModel,
  type HarmonicRhythmLevel,
  // Note: Individual constraint subtypes not exported; use MusicConstraint union
  type ConstraintKey,
  type MusicSpec,
  // Note: SpecId removed - not in canon
  
  // MusicSpec helpers
  // Note: Normalizers not exported separately; use constraint factories
  
  // Host actions helpers (but not the HostAction type itself)
  type HostActionEnvelope,
  // Note: HostActionConfidence removed - not in canon
  // Note: validateHostAction not exported separately
  parseHostActionFromPrologTerm,
  // Note: formatHostActionForLogging removed - not in canon
  
  // Custom constraints
  type CustomConstraintDefinition,
  // Note: CustomConstraintRegistry not exported; use constraintRegistry
  // Note: register/unregister functions not exported; use provided API
  isCustomConstraint,
  // Note: listCustomConstraints removed - not in canon
  constraintRegistry,
  validateConstraintParams,
} from './theory';

// Generator exports
export * from './generators';

// Adaptation exports
export * from './adaptation';

// Harmony exports - use explicit exports to avoid conflicts with theory-queries
export {
  HarmonyExplorer,
  createHarmonyExplorer,
  type ChordAnalysis,
  type ChordInfo,
  type KeyInfo,
  type ProgressionAnalysis,
  type ReharmonizationSuggestion,
  type ModulationPath,
  type ChordSuggestion as HarmonyChordSuggestion,
  type HarmonicFunction as HarmonyHarmonicFunction,
} from './harmony';

// Learning exports
export * from './learning';
