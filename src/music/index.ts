/**
 * @fileoverview Music Theory Module - Exports
 * 
 * Central export point for music theory utilities including harmony
 * classification, scale helpers, roman numeral analysis, and music theory concepts.
 * 
 * @module @cardplay/music
 */

// Harmony classification and coloring (G016-G020, J009)
export {
  classifyNote,
  getHarmonyColorClass,
  getHarmonyColorVars,
  injectHarmonyColors,
  type NoteClass,
  type HarmonyContext,
  type NoteClassification,
} from './harmony-helper';

// Roman numeral analysis (G020)
export {
  chordToRomanNumeral,
  getChordFunction,
  analyzeChord,
  type RomanNumeralAnalysis,
} from './roman-numerals';

// Scale overlay (existing)
export type { ScaleOverlay } from './scale-overlay';
