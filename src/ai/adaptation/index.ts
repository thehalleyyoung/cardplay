/**
 * @fileoverview Adaptation Module Index
 * 
 * Exports the Prolog-based phrase adaptation system.
 * 
 * @module @cardplay/ai/adaptation
 */

export {
  PrologPhraseAdapter,
  createPrologPhraseAdapter,
  type PhraseNote,
  type ChordTarget,
  type ScaleTarget,
  type AdaptMode,
  type AdaptOptions,
  type AdaptResult,
  type SimilarityResult
} from './prolog-phrase-adapter';
