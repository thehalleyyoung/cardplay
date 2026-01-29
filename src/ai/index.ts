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
export * from './theory';

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
