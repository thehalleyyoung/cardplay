/**
 * GOFAI Normalizers — Input Normalization Utilities
 *
 * This module provides normalization functions for user input,
 * converting various surface forms to their canonical representations.
 *
 * @module gofai/canon/normalize
 */

import { getLexemeBySurface } from './lexemes';
import { getSectionTypeByName } from './section-vocabulary';
import { getLayerTypeByName } from './layer-vocabulary';
import { getUnitByName } from './units';
import { getAxisByName } from './perceptual-axes';
import { getOpcodeByName, type EditOpcode } from './edit-opcodes';
import { getConstraintTypeByName, type ConstraintType } from './constraint-types';
import type { AxisId } from './types';
import type { Lexeme } from './lexemes';
import type { SectionType } from './section-vocabulary';
import type { LayerType } from './layer-vocabulary';
import type { MeasurementUnit } from './units';
import type { PerceptualAxis } from './perceptual-axes';

// =============================================================================
// Text Normalization
// =============================================================================

/**
 * Normalize whitespace in text.
 * - Collapse multiple spaces to single space
 * - Trim leading/trailing whitespace
 * - Normalize various unicode spaces to ASCII space
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ') // Unicode spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize quotes to ASCII.
 */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"'); // Double quotes
}

/**
 * Normalize punctuation.
 */
export function normalizePunctuation(text: string): string {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // Dashes
    .replace(/\u2026/g, '...'); // Ellipsis
}

/**
 * Normalize common contractions.
 */
export function normalizeContractions(text: string): string {
  const contractions: Record<string, string> = {
    "don't": 'do not',
    "doesn't": 'does not',
    "won't": 'will not',
    "wouldn't": 'would not',
    "couldn't": 'could not',
    "shouldn't": 'should not',
    "can't": 'cannot',
    "isn't": 'is not',
    "aren't": 'are not',
    "wasn't": 'was not',
    "weren't": 'were not',
    "hasn't": 'has not',
    "haven't": 'have not',
    "hadn't": 'had not',
    "it's": 'it is',
    "that's": 'that is',
    "what's": 'what is',
    "there's": 'there is',
    "here's": 'here is',
    "let's": 'let us',
    "i'm": 'I am',
    "you're": 'you are',
    "we're": 'we are',
    "they're": 'they are',
    "i've": 'I have',
    "you've": 'you have',
    "we've": 'we have',
    "they've": 'they have',
    "i'd": 'I would',
    "you'd": 'you would',
    "he'd": 'he would',
    "she'd": 'she would',
    "we'd": 'we would',
    "they'd": 'they would',
    "i'll": 'I will',
    "you'll": 'you will',
    "he'll": 'he will',
    "she'll": 'she will',
    "we'll": 'we will',
    "they'll": 'they will',
  };

  let result = text.toLowerCase();
  for (const [contraction, expansion] of Object.entries(contractions)) {
    result = result.replace(new RegExp(contraction, 'gi'), expansion);
  }
  return result;
}

/**
 * Apply all text normalizations.
 */
export function normalizeText(text: string): string {
  let normalized = text;
  normalized = normalizeWhitespace(normalized);
  normalized = normalizeQuotes(normalized);
  normalized = normalizePunctuation(normalized);
  // Don't expand contractions by default as it can change meaning
  // normalized = normalizeContractions(normalized);
  return normalized;
}

// =============================================================================
// Unit Normalization
// =============================================================================

/**
 * Normalize unit strings to canonical forms.
 */
export function normalizeUnitString(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  // Common variations
  const unitMap: Record<string, string> = {
    bpm: 'bpm',
    'beats per minute': 'bpm',
    bar: 'bar',
    bars: 'bar',
    measure: 'bar',
    measures: 'bar',
    beat: 'beat',
    beats: 'beat',
    tick: 'tick',
    ticks: 'tick',
    semitone: 'semitone',
    semitones: 'semitone',
    st: 'semitone',
    'half step': 'semitone',
    'half steps': 'semitone',
    octave: 'octave',
    octaves: 'octave',
    oct: 'octave',
    db: 'decibel',
    decibel: 'decibel',
    decibels: 'decibel',
    '%': 'percent',
    percent: 'percent',
    hz: 'hertz',
    hertz: 'hertz',
    khz: 'kilohertz',
    kilohertz: 'kilohertz',
    k: 'kilohertz',
  };

  return unitMap[normalized] ?? normalized;
}

// =============================================================================
// Musical Term Normalization
// =============================================================================

/**
 * Normalize section names.
 */
export function normalizeSectionName(name: string): string | undefined {
  const section = getSectionTypeByName(name);
  return section?.name;
}

/**
 * Normalize layer/track names.
 */
export function normalizeLayerName(name: string): string | undefined {
  const layer = getLayerTypeByName(name);
  return layer?.name;
}

/**
 * Normalize axis names.
 */
export function normalizeAxisName(name: string): AxisId | undefined {
  const axis = getAxisByName(name);
  return axis?.id;
}

// =============================================================================
// Vocabulary Lookup with Normalization
// =============================================================================

/**
 * Result of a vocabulary lookup.
 */
export interface VocabularyLookupResult {
  /** The matched vocabulary item */
  readonly item:
    | Lexeme
    | SectionType
    | LayerType
    | MeasurementUnit
    | PerceptualAxis
    | EditOpcode
    | ConstraintType;

  /** The type of vocabulary item */
  readonly type:
    | 'lexeme'
    | 'section'
    | 'layer'
    | 'unit'
    | 'axis'
    | 'opcode'
    | 'constraint';

  /** The original query string */
  readonly query: string;

  /** Whether an exact match was found */
  readonly exact: boolean;
}

/**
 * Look up a term in all vocabulary tables.
 */
export function lookupVocabulary(query: string): VocabularyLookupResult | undefined {
  const normalized = query.toLowerCase().trim();

  // Try each vocabulary table in order of specificity

  // 1. Lexemes (most common)
  const lexeme = getLexemeBySurface(normalized);
  if (lexeme) {
    return {
      item: lexeme,
      type: 'lexeme',
      query,
      exact: lexeme.lemma.toLowerCase() === normalized,
    };
  }

  // 2. Axes
  const axis = getAxisByName(normalized);
  if (axis) {
    return {
      item: axis,
      type: 'axis',
      query,
      exact: axis.name.toLowerCase() === normalized,
    };
  }

  // 3. Sections
  const section = getSectionTypeByName(normalized);
  if (section) {
    return {
      item: section,
      type: 'section',
      query,
      exact: section.name.toLowerCase() === normalized,
    };
  }

  // 4. Layers
  const layer = getLayerTypeByName(normalized);
  if (layer) {
    return {
      item: layer,
      type: 'layer',
      query,
      exact: layer.name.toLowerCase() === normalized,
    };
  }

  // 5. Units
  const unit = getUnitByName(normalized);
  if (unit) {
    return {
      item: unit,
      type: 'unit',
      query,
      exact: unit.name.toLowerCase() === normalized,
    };
  }

  // 6. Opcodes
  const opcode = getOpcodeByName(normalized);
  if (opcode) {
    return {
      item: opcode,
      type: 'opcode',
      query,
      exact: opcode.name.toLowerCase() === normalized,
    };
  }

  // 7. Constraints
  const constraint = getConstraintTypeByName(normalized);
  if (constraint) {
    return {
      item: constraint,
      type: 'constraint',
      query,
      exact: constraint.name.toLowerCase() === normalized,
    };
  }

  return undefined;
}

// =============================================================================
// Fuzzy Matching
// =============================================================================

/**
 * Compute edit distance (Levenshtein) between two strings.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Create distance matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    const row = dp[i];
    if (row) row[0] = i;
  }
  for (let j = 0; j <= n; j++) {
    const row = dp[0];
    if (row) row[j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const currentRow = dp[i];
      const prevRow = dp[i - 1];
      const prevPrevRow = dp[i - 1];
      
      if (currentRow && prevRow && prevPrevRow) {
        const deletion = (prevRow[j] ?? 0) + 1;
        const insertion = (currentRow[j - 1] ?? 0) + 1;
        const substitution = (prevPrevRow[j - 1] ?? 0) + cost;
        currentRow[j] = Math.min(deletion, insertion, substitution);
      }
    }
  }

  const lastRow = dp[m];
  return lastRow?.[n] ?? 0;
}

/**
 * Compute similarity score (0-1) between two strings.
 */
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

/**
 * Find best fuzzy match in a list of candidates.
 */
export interface FuzzyMatch<T> {
  readonly item: T;
  readonly score: number;
  readonly matchedOn: string;
}

/**
 * Find fuzzy matches for a query in a list of items.
 */
export function findFuzzyMatches<T>(
  query: string,
  items: readonly T[],
  getStrings: (item: T) => readonly string[],
  threshold = 0.6
): readonly FuzzyMatch<T>[] {
  const normalizedQuery = query.toLowerCase();
  const matches: FuzzyMatch<T>[] = [];

  for (const item of items) {
    const strings = getStrings(item);
    let bestScore = 0;
    let bestMatch = '';

    for (const str of strings) {
      const score = stringSimilarity(normalizedQuery, str);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = str;
      }
    }

    if (bestScore >= threshold) {
      matches.push({ item, score: bestScore, matchedOn: bestMatch });
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// =============================================================================
// Suggestion Generation
// =============================================================================

/**
 * Get suggestions for an unknown term.
 */
export function getSuggestions(
  unknownTerm: string,
  maxSuggestions = 5
): readonly string[] {
  const results: Array<{ term: string; score: number }> = [];

  // Import all vocabulary items
  const { CORE_LEXEMES } = require('./lexemes');
  const { CORE_SECTION_TYPES } = require('./section-vocabulary');
  const { CORE_LAYER_TYPES } = require('./layer-vocabulary');
  const { CORE_PERCEPTUAL_AXES } = require('./perceptual-axes');

  // Check lexemes
  for (const lexeme of CORE_LEXEMES as Lexeme[]) {
    const allForms = [lexeme.lemma, ...lexeme.variants];
    for (const form of allForms) {
      const score = stringSimilarity(unknownTerm, form);
      if (score > 0.5) {
        results.push({ term: form, score });
      }
    }
  }

  // Check sections
  for (const section of CORE_SECTION_TYPES as SectionType[]) {
    const allForms = [section.name, ...section.variants];
    for (const form of allForms) {
      const score = stringSimilarity(unknownTerm, form);
      if (score > 0.5) {
        results.push({ term: form, score });
      }
    }
  }

  // Check layers
  for (const layer of CORE_LAYER_TYPES as LayerType[]) {
    const allForms = [layer.name, ...layer.variants];
    for (const form of allForms) {
      const score = stringSimilarity(unknownTerm, form);
      if (score > 0.5) {
        results.push({ term: form, score });
      }
    }
  }

  // Check axes
  for (const axis of CORE_PERCEPTUAL_AXES as PerceptualAxis[]) {
    const allForms = [axis.name, ...axis.poles];
    for (const form of allForms) {
      const score = stringSimilarity(unknownTerm, form);
      if (score > 0.5) {
        results.push({ term: form, score });
      }
    }
  }

  // Sort and dedupe
  const sorted = results.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const { term } of sorted) {
    const lower = term.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(term);
      if (unique.length >= maxSuggestions) break;
    }
  }

  return unique;
}

// =============================================================================
// Amount Normalization
// =============================================================================

/**
 * Amount level representation.
 */
export type AmountLevel = 'tiny' | 'small' | 'moderate' | 'large' | 'extreme';

/**
 * Normalize an amount expression to a level.
 */
export function normalizeAmountLevel(expression: string): AmountLevel {
  const normalized = expression.toLowerCase().trim();

  const levelMap: Record<string, AmountLevel> = {
    // Tiny
    tiny: 'tiny',
    'a little bit': 'tiny',
    barely: 'tiny',
    slightly: 'tiny',
    'a touch': 'tiny',
    marginally: 'tiny',

    // Small
    small: 'small',
    'a little': 'small',
    'a bit': 'small',
    somewhat: 'small',

    // Moderate (default)
    moderate: 'moderate',
    moderately: 'moderate',
    '': 'moderate',

    // Large
    large: 'large',
    'a lot': 'large',
    much: 'large',
    significantly: 'large',
    considerably: 'large',
    way: 'large',

    // Extreme
    extreme: 'extreme',
    extremely: 'extreme',
    drastically: 'extreme',
    massively: 'extreme',
    totally: 'extreme',
    completely: 'extreme',
  };

  return levelMap[normalized] ?? 'moderate';
}

/**
 * Convert an amount level to a numeric factor (0-1 scale).
 */
export function amountLevelToFactor(level: AmountLevel): number {
  const factors: Record<AmountLevel, number> = {
    tiny: 0.1,
    small: 0.25,
    moderate: 0.5,
    large: 0.75,
    extreme: 1.0,
  };
  return factors[level];
}

/**
 * Convert a numeric factor (0-1) to an amount level.
 */
export function factorToAmountLevel(factor: number): AmountLevel {
  if (factor <= 0.15) return 'tiny';
  if (factor <= 0.35) return 'small';
  if (factor <= 0.6) return 'moderate';
  if (factor <= 0.85) return 'large';
  return 'extreme';
}

// =============================================================================
// Degree/Comparative Normalization
// =============================================================================

/**
 * Parse a comparative expression.
 */
export interface ComparativeExpression {
  /** The base adjective */
  readonly base: string;

  /** Direction of comparison */
  readonly direction: 'more' | 'less';

  /** Degree modifier */
  readonly degree: AmountLevel;
}

/**
 * Parse a comparative expression like "much brighter" or "a little less busy".
 */
export function parseComparative(expression: string): ComparativeExpression | undefined {
  const normalized = expression.toLowerCase().trim();

  // Pattern: [degree] + "more"/"less" + adjective
  // Or: adjective + "-er" form

  // Check for explicit "more" or "less"
  const moreMatch = normalized.match(/^(.+?)?\s*(more|less)\s+(.+)$/);
  if (moreMatch) {
    const degreeStr = moreMatch[1]?.trim() ?? '';
    const direction = moreMatch[2];
    const base = moreMatch[3];

    if ((direction === 'more' || direction === 'less') && base) {
      return {
        base,
        direction,
        degree: normalizeAmountLevel(degreeStr),
      };
    }
  }

  // Check for "-er" comparative form
  const erMatch = normalized.match(/^(.+?)?\s*(\w+)(er|ier)$/);
  if (erMatch) {
    const degreeStr = erMatch[1]?.trim() ?? '';
    const baseWord = erMatch[2];
    const suffix = erMatch[3];

    if (!baseWord) {
      return undefined;
    }

    let base = baseWord;

    // Handle spelling changes (brighter → bright, busier → busy)
    if (suffix === 'ier') {
      base = base + 'y'; // busier → busy
    }

    return {
      base,
      direction: 'more',
      degree: normalizeAmountLevel(degreeStr),
    };
  }

  return undefined;
}
