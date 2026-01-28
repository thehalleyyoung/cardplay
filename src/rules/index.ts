/**
 * @fileoverview Rules module barrel export.
 * 
 * @module @cardplay/core/rules
 */

export {
  // Core types
  type ValidationError,
  type ValidationResult,
  type Suggestion,
  type Rules,
  
  // Context types
  type BaseContext,
  type ScaleContext,
  type ProgressionContext,
  type RagaContext,
  type TalaContext,
  type VoicingContext,
  
  // Rule aliases
  type MelodyRules,
  type HarmonyRules,
  type RhythmRules,
  
  // Factories
  type CreateRulesOptions,
  createRules,
  
  // Combinators
  combineRules,
  orRules,
  notRule,
  
  // Stream operations
  validateStream,
  transformStream,
  suggestNext,
  
  // Rule generators
  rulesFromScale,
  rulesFromChords,
  rulesFromRaga,
  rulesFromGrammar,
} from './rules';
