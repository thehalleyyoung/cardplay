/**
 * GOFAI NL Number Parser — Robust Number Recognition
 *
 * Implements a number parser that handles:
 * - Digit literals: "42", "3.14", "-7", "+3"
 * - Word numbers: "two", "twelve", "twenty-three", "one hundred"
 * - Ordinals: "1st", "2nd", "third", "twenty-first"
 * - Fractions: "half", "a third", "three quarters", "1/4"
 * - Vague quantities: "a couple", "a few", "several", "many"
 * - Ranges: "two to four", "3-5", "between 2 and 4"
 * - Multiples: "double", "triple", "twice", "three times"
 * - Negative: "minus three", "negative 7"
 * - Musical context: "4/4" (time signature), "7th" (chord degree)
 *
 * @module gofai/nl/tokenizer/number-parser
 * @see gofai_goalA.md Step 104
 */

// =============================================================================
// PARSED NUMBER — result of parsing a number expression
// =============================================================================

/**
 * A parsed number expression.
 */
export type ParsedNumber =
  | ExactNumber
  | RangeNumber
  | VagueNumber
  | FractionNumber
  | MultipleNumber
  | OrdinalNumber
  | TimeSignature;

/**
 * An exact numeric value.
 */
export interface ExactNumber {
  readonly type: 'exact';
  readonly value: number;
  readonly original: string;
  readonly isNegative: boolean;
  readonly isDecimal: boolean;
}

/**
 * A numeric range.
 */
export interface RangeNumber {
  readonly type: 'range';
  readonly min: number;
  readonly max: number;
  readonly original: string;
  readonly inclusive: boolean;
}

/**
 * A vague quantity ("a few", "several", "many").
 */
export interface VagueNumber {
  readonly type: 'vague';
  readonly estimate: number;
  readonly minEstimate: number;
  readonly maxEstimate: number;
  readonly label: string;
  readonly original: string;
}

/**
 * A fraction ("half", "a third", "three quarters").
 */
export interface FractionNumber {
  readonly type: 'fraction';
  readonly numerator: number;
  readonly denominator: number;
  readonly value: number;
  readonly original: string;
}

/**
 * A multiple ("double", "triple", "twice").
 */
export interface MultipleNumber {
  readonly type: 'multiple';
  readonly factor: number;
  readonly original: string;
}

/**
 * An ordinal number ("1st", "second", "twenty-third").
 */
export interface OrdinalNumber {
  readonly type: 'ordinal';
  readonly position: number;
  readonly original: string;
}

/**
 * A time signature ("4/4", "3/4", "6/8").
 */
export interface TimeSignature {
  readonly type: 'time_signature';
  readonly numerator: number;
  readonly denominator: number;
  readonly original: string;
}

// =============================================================================
// WORD-TO-NUMBER TABLES
// =============================================================================

/**
 * Cardinal number words → values.
 */
export const CARDINAL_WORDS: Readonly<Record<string, number>> = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90,
  'hundred': 100,
  'thousand': 1000,
};

/**
 * Ordinal number words → positions.
 */
export const ORDINAL_WORDS: Readonly<Record<string, number>> = {
  'first': 1,
  'second': 2,
  'third': 3,
  'fourth': 4,
  'fifth': 5,
  'sixth': 6,
  'seventh': 7,
  'eighth': 8,
  'ninth': 9,
  'tenth': 10,
  'eleventh': 11,
  'twelfth': 12,
  'thirteenth': 13,
  'fourteenth': 14,
  'fifteenth': 15,
  'sixteenth': 16,
  'seventeenth': 17,
  'eighteenth': 18,
  'nineteenth': 19,
  'twentieth': 20,
  'thirtieth': 30,
  'fortieth': 40,
  'fiftieth': 50,
  'sixtieth': 60,
  'seventieth': 70,
  'eightieth': 80,
  'ninetieth': 90,
  'hundredth': 100,
  'last': -1, // Special: -1 means "last"
};

/**
 * Vague quantity words with estimated ranges.
 */
export const VAGUE_QUANTITIES: readonly VagueQuantityEntry[] = [
  { word: 'a couple', estimate: 2, min: 2, max: 3 },
  { word: 'couple', estimate: 2, min: 2, max: 3 },
  { word: 'a few', estimate: 3, min: 2, max: 5 },
  { word: 'few', estimate: 3, min: 2, max: 5 },
  { word: 'several', estimate: 5, min: 3, max: 7 },
  { word: 'some', estimate: 3, min: 2, max: 5 },
  { word: 'many', estimate: 8, min: 5, max: 15 },
  { word: 'a lot', estimate: 10, min: 5, max: 20 },
  { word: 'lots', estimate: 10, min: 5, max: 20 },
  { word: 'a bunch', estimate: 5, min: 3, max: 8 },
  { word: 'a dozen', estimate: 12, min: 12, max: 12 },
  { word: 'dozens', estimate: 30, min: 24, max: 48 },
];

export interface VagueQuantityEntry {
  readonly word: string;
  readonly estimate: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Fraction words → numerator/denominator.
 */
export const FRACTION_WORDS: Readonly<Record<string, { num: number; den: number }>> = {
  'half': { num: 1, den: 2 },
  'halves': { num: 1, den: 2 },
  'third': { num: 1, den: 3 },
  'thirds': { num: 1, den: 3 },
  'quarter': { num: 1, den: 4 },
  'quarters': { num: 1, den: 4 },
  'fifth': { num: 1, den: 5 },
  'sixth': { num: 1, den: 6 },
  'eighth': { num: 1, den: 8 },
  'sixteenth': { num: 1, den: 16 },
  'thirty-second': { num: 1, den: 32 },
};

/**
 * Multiple/factor words.
 */
export const MULTIPLE_WORDS: Readonly<Record<string, number>> = {
  'double': 2,
  'twice': 2,
  'triple': 3,
  'thrice': 3,
  'quadruple': 4,
  'quintuple': 5,
};

// =============================================================================
// PARSE FUNCTIONS
// =============================================================================

/**
 * Parse a number expression from text.
 * Returns null if the text is not a number expression.
 */
export function parseNumber(text: string): ParsedNumber | null {
  const trimmed = text.trim().toLowerCase();

  // Try each parser in order of specificity

  // 1. Time signature: "4/4", "3/4", "6/8"
  const timeSig = parseTimeSignature(trimmed);
  if (timeSig) return timeSig;

  // 2. Numeric fraction: "1/4", "3/8"
  const numFrac = parseNumericFraction(trimmed);
  if (numFrac) return numFrac;

  // 3. Numeric range: "3-5", "2 to 4"
  const range = parseRange(trimmed);
  if (range) return range;

  // 4. Ordinal digit: "1st", "2nd", "23rd"
  const ordDigit = parseOrdinalDigit(trimmed);
  if (ordDigit) return ordDigit;

  // 5. Digit literal: "42", "3.14", "-7", "+3"
  const digit = parseDigitLiteral(trimmed);
  if (digit) return digit;

  // 6. Ordinal word: "first", "second", "twenty-third"
  const ordWord = parseOrdinalWord(trimmed);
  if (ordWord) return ordWord;

  // 7. Fraction word: "half", "a third", "three quarters"
  const fracWord = parseFractionWord(trimmed);
  if (fracWord) return fracWord;

  // 8. Vague quantity: "a few", "several", "a couple"
  const vague = parseVagueQuantity(trimmed);
  if (vague) return vague;

  // 9. Multiple: "double", "twice", "triple"
  const mult = parseMultiple(trimmed);
  if (mult) return mult;

  // 10. Cardinal word: "two", "twelve", "twenty-three"
  const cardinal = parseCardinalWord(trimmed);
  if (cardinal !== null) {
    return {
      type: 'exact',
      value: cardinal,
      original: text,
      isNegative: cardinal < 0,
      isDecimal: false,
    };
  }

  return null;
}

/**
 * Parse a digit literal: "42", "3.14", "-7", "+3"
 */
function parseDigitLiteral(text: string): ExactNumber | null {
  const match = /^([+-]?\d+(?:\.\d+)?)$/.exec(text);
  if (!match) return null;

  const value = parseFloat(match[0]);
  if (isNaN(value)) return null;

  return {
    type: 'exact',
    value,
    original: text,
    isNegative: value < 0,
    isDecimal: text.includes('.'),
  };
}

/**
 * Parse an ordinal digit: "1st", "2nd", "3rd", "4th", "23rd"
 */
function parseOrdinalDigit(text: string): OrdinalNumber | null {
  const match = /^(\d+)(st|nd|rd|th)$/i.exec(text);
  if (!match) return null;

  const value = parseInt(match[1]!, 10);
  if (isNaN(value)) return null;

  return {
    type: 'ordinal',
    position: value,
    original: text,
  };
}

/**
 * Parse an ordinal word: "first", "second", "twenty-first"
 */
function parseOrdinalWord(text: string): OrdinalNumber | null {
  const value = ORDINAL_WORDS[text];
  if (value !== undefined) {
    return {
      type: 'ordinal',
      position: value,
      original: text,
    };
  }

  // Compound ordinals: "twenty-first", "thirty-second"
  const hyphen = text.indexOf('-');
  if (hyphen > 0) {
    const first = text.slice(0, hyphen);
    const second = text.slice(hyphen + 1);
    const tens = CARDINAL_WORDS[first];
    const ones = ORDINAL_WORDS[second];
    if (tens !== undefined && ones !== undefined && tens >= 20 && ones >= 1 && ones <= 9) {
      return {
        type: 'ordinal',
        position: tens + ones,
        original: text,
      };
    }
  }

  return null;
}

/**
 * Parse a cardinal word: "two", "twelve", "twenty-three", "one hundred"
 */
function parseCardinalWord(text: string): number | null {
  // Direct lookup
  const direct = CARDINAL_WORDS[text];
  if (direct !== undefined) return direct;

  // Compound: "twenty-three", "forty-two"
  const hyphen = text.indexOf('-');
  if (hyphen > 0) {
    const first = text.slice(0, hyphen);
    const second = text.slice(hyphen + 1);
    const tens = CARDINAL_WORDS[first];
    const ones = CARDINAL_WORDS[second];
    if (tens !== undefined && ones !== undefined && tens >= 20 && ones >= 1 && ones <= 9) {
      return tens + ones;
    }
  }

  // Multi-word: "one hundred", "two hundred", "three thousand"
  const parts = text.split(/\s+/);
  if (parts.length === 2) {
    const a = CARDINAL_WORDS[parts[0]!];
    const b = CARDINAL_WORDS[parts[1]!];
    if (a !== undefined && b !== undefined) {
      if (b >= 100) return a * b;  // "two hundred" = 2 * 100
      if (a >= 20 && b < 10) return a + b;  // "twenty three" = 20 + 3
    }
  }

  // "negative X" / "minus X"
  if (text.startsWith('negative ') || text.startsWith('minus ')) {
    const rest = text.replace(/^(negative|minus)\s+/, '');
    const val = parseCardinalWord(rest);
    if (val !== null) return -val;
  }

  return null;
}

/**
 * Parse a fraction word: "half", "a third", "three quarters", "two thirds"
 */
function parseFractionWord(text: string): FractionNumber | null {
  // Direct: "half", "quarter"
  const direct = FRACTION_WORDS[text];
  if (direct) {
    return {
      type: 'fraction',
      numerator: direct.num,
      denominator: direct.den,
      value: direct.num / direct.den,
      original: text,
    };
  }

  // "a half", "a third", "a quarter"
  if (text.startsWith('a ')) {
    const rest = text.slice(2);
    const frac = FRACTION_WORDS[rest];
    if (frac) {
      return {
        type: 'fraction',
        numerator: frac.num,
        denominator: frac.den,
        value: frac.num / frac.den,
        original: text,
      };
    }
  }

  // "two thirds", "three quarters"
  const parts = text.split(/\s+/);
  if (parts.length === 2) {
    const num = CARDINAL_WORDS[parts[0]!];
    const fracPart = FRACTION_WORDS[parts[1]!];
    if (num !== undefined && fracPart) {
      return {
        type: 'fraction',
        numerator: num,
        denominator: fracPart.den,
        value: num / fracPart.den,
        original: text,
      };
    }
  }

  return null;
}

/**
 * Parse a numeric fraction: "1/4", "3/8"
 */
function parseNumericFraction(text: string): FractionNumber | null {
  const match = /^(\d+)\/(\d+)$/.exec(text);
  if (!match) return null;

  const num = parseInt(match[1]!, 10);
  const den = parseInt(match[2]!, 10);
  if (isNaN(num) || isNaN(den) || den === 0) return null;

  // Check if this is more likely a time signature (common music contexts)
  // Time signatures: 4/4, 3/4, 6/8, 2/4, etc. where den is a power of 2
  // Only treat as fraction if denominator is NOT a typical time sig denominator
  // or numerator is large
  if (isTimeSignatureLike(num, den)) {
    return null; // Let parseTimeSignature handle it
  }

  return {
    type: 'fraction',
    numerator: num,
    denominator: den,
    value: num / den,
    original: text,
  };
}

/**
 * Check if a fraction looks like a time signature.
 */
function isTimeSignatureLike(num: number, den: number): boolean {
  // Time signature denominators are powers of 2: 2, 4, 8, 16, 32
  const validDens = [2, 4, 8, 16, 32];
  if (!validDens.includes(den)) return false;
  // Numerator is typically 1-12 for time signatures
  return num >= 1 && num <= 12;
}

/**
 * Parse a time signature: "4/4", "3/4", "6/8"
 */
function parseTimeSignature(text: string): TimeSignature | null {
  const match = /^(\d+)\/(\d+)$/.exec(text);
  if (!match) return null;

  const num = parseInt(match[1]!, 10);
  const den = parseInt(match[2]!, 10);
  if (isNaN(num) || isNaN(den)) return null;

  if (!isTimeSignatureLike(num, den)) return null;

  return {
    type: 'time_signature',
    numerator: num,
    denominator: den,
    original: text,
  };
}

/**
 * Parse a vague quantity: "a few", "several", "a couple"
 */
function parseVagueQuantity(text: string): VagueNumber | null {
  for (const vq of VAGUE_QUANTITIES) {
    if (text === vq.word) {
      return {
        type: 'vague',
        estimate: vq.estimate,
        minEstimate: vq.min,
        maxEstimate: vq.max,
        label: vq.word,
        original: text,
      };
    }
  }
  return null;
}

/**
 * Parse a multiple: "double", "twice", "triple"
 */
function parseMultiple(text: string): MultipleNumber | null {
  const value = MULTIPLE_WORDS[text];
  if (value !== undefined) {
    return {
      type: 'multiple',
      factor: value,
      original: text,
    };
  }

  // "X times": "three times", "5 times"
  const timesMatch = /^(.+?)\s+times?$/.exec(text);
  if (timesMatch) {
    const numText = timesMatch[1]!;
    const num = parseCardinalWord(numText);
    if (num !== null) {
      return {
        type: 'multiple',
        factor: num,
        original: text,
      };
    }
    const digit = parseFloat(numText);
    if (!isNaN(digit)) {
      return {
        type: 'multiple',
        factor: digit,
        original: text,
      };
    }
  }

  return null;
}

/**
 * Parse a range: "3-5", "2 to 4", "between 2 and 4", "from 3 to 7"
 */
function parseRange(text: string): RangeNumber | null {
  // "3-5" or "3–5" (en dash)
  const dashMatch = /^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/.exec(text);
  if (dashMatch) {
    const min = parseFloat(dashMatch[1]!);
    const max = parseFloat(dashMatch[2]!);
    if (!isNaN(min) && !isNaN(max) && min <= max) {
      return { type: 'range', min, max, original: text, inclusive: true };
    }
  }

  // "2 to 4" or "two to four"
  const toMatch = /^(.+?)\s+to\s+(.+)$/.exec(text);
  if (toMatch) {
    const minVal = parseSimpleNumber(toMatch[1]!);
    const maxVal = parseSimpleNumber(toMatch[2]!);
    if (minVal !== null && maxVal !== null && minVal <= maxVal) {
      return { type: 'range', min: minVal, max: maxVal, original: text, inclusive: true };
    }
  }

  // "between 2 and 4" or "between two and four"
  const betweenMatch = /^between\s+(.+?)\s+and\s+(.+)$/.exec(text);
  if (betweenMatch) {
    const minVal = parseSimpleNumber(betweenMatch[1]!);
    const maxVal = parseSimpleNumber(betweenMatch[2]!);
    if (minVal !== null && maxVal !== null && minVal <= maxVal) {
      return { type: 'range', min: minVal, max: maxVal, original: text, inclusive: true };
    }
  }

  // "from 3 to 7"
  const fromToMatch = /^from\s+(.+?)\s+to\s+(.+)$/.exec(text);
  if (fromToMatch) {
    const minVal = parseSimpleNumber(fromToMatch[1]!);
    const maxVal = parseSimpleNumber(fromToMatch[2]!);
    if (minVal !== null && maxVal !== null && minVal <= maxVal) {
      return { type: 'range', min: minVal, max: maxVal, original: text, inclusive: true };
    }
  }

  return null;
}

/**
 * Parse a simple number (digit or word) for range parsing.
 */
function parseSimpleNumber(text: string): number | null {
  const trimmed = text.trim();
  const digit = parseFloat(trimmed);
  if (!isNaN(digit)) return digit;
  return parseCardinalWord(trimmed);
}

// =============================================================================
// BATCH PARSING — find all numbers in token stream
// =============================================================================

/**
 * A number found in a token stream.
 */
export interface FoundNumber {
  /** The parsed number */
  readonly parsed: ParsedNumber;

  /** Start token index */
  readonly startTokenIndex: number;

  /** End token index (exclusive) */
  readonly endTokenIndex: number;

  /** The original text */
  readonly text: string;
}

/**
 * Find all number expressions in a list of token texts.
 * Tries single tokens first, then multi-token expressions.
 */
export function findNumbers(tokenTexts: readonly string[]): readonly FoundNumber[] {
  const results: FoundNumber[] = [];
  const consumed = new Set<number>();

  // Try multi-token expressions first (longer matches take priority)
  for (let i = 0; i < tokenTexts.length; i++) {
    if (consumed.has(i)) continue;

    // Try 4 tokens, then 3, then 2
    for (const windowSize of [4, 3, 2]) {
      if (i + windowSize > tokenTexts.length) continue;

      const slice = tokenTexts.slice(i, i + windowSize);
      const combined = slice.join(' ');
      const parsed = parseNumber(combined);

      if (parsed) {
        results.push({
          parsed,
          startTokenIndex: i,
          endTokenIndex: i + windowSize,
          text: combined,
        });
        for (let j = i; j < i + windowSize; j++) consumed.add(j);
        break;
      }
    }
  }

  // Try single tokens
  for (let i = 0; i < tokenTexts.length; i++) {
    if (consumed.has(i)) continue;
    const text = tokenTexts[i]!;
    const parsed = parseNumber(text);
    if (parsed) {
      results.push({
        parsed,
        startTokenIndex: i,
        endTokenIndex: i + 1,
        text,
      });
      consumed.add(i);
    }
  }

  return results.sort((a, b) => a.startTokenIndex - b.startTokenIndex);
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a parsed number for display.
 */
export function formatParsedNumber(n: ParsedNumber): string {
  switch (n.type) {
    case 'exact':
      return `${n.value}`;
    case 'range':
      return `${n.min}–${n.max}`;
    case 'vague':
      return `~${n.estimate} (${n.minEstimate}–${n.maxEstimate})`;
    case 'fraction':
      return `${n.numerator}/${n.denominator} (=${n.value})`;
    case 'multiple':
      return `×${n.factor}`;
    case 'ordinal':
      return `#${n.position}`;
    case 'time_signature':
      return `${n.numerator}/${n.denominator} time`;
  }
}

/**
 * Get the numeric value of a parsed number (best estimate).
 */
export function numericValue(n: ParsedNumber): number {
  switch (n.type) {
    case 'exact':
      return n.value;
    case 'range':
      return (n.min + n.max) / 2;
    case 'vague':
      return n.estimate;
    case 'fraction':
      return n.value;
    case 'multiple':
      return n.factor;
    case 'ordinal':
      return n.position;
    case 'time_signature':
      return n.numerator; // Beats per measure
  }
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface NumberParserStats {
  readonly totalCardinalWords: number;
  readonly totalOrdinalWords: number;
  readonly totalVagueQuantities: number;
  readonly totalFractionWords: number;
  readonly totalMultipleWords: number;
}

export function getNumberParserStats(): NumberParserStats {
  return {
    totalCardinalWords: Object.keys(CARDINAL_WORDS).length,
    totalOrdinalWords: Object.keys(ORDINAL_WORDS).length,
    totalVagueQuantities: VAGUE_QUANTITIES.length,
    totalFractionWords: Object.keys(FRACTION_WORDS).length,
    totalMultipleWords: Object.keys(MULTIPLE_WORDS).length,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const NUMBER_PARSER_RULES = [
  'Rule NUM-001: Digit literals ("42", "3.14", "-7") are parsed as exact numbers. ' +
  'Negative numbers are recognized by leading "-" or "minus".',

  'Rule NUM-002: Word numbers ("two", "twelve", "twenty-three") are parsed ' +
  'using the CARDINAL_WORDS table plus compound rules.',

  'Rule NUM-003: Ordinals ("1st", "second", "twenty-third") are parsed as ' +
  'positions. Digit ordinals use suffix matching; word ordinals use the table.',

  'Rule NUM-004: Fractions ("half", "a third", "three quarters", "1/4") are ' +
  'parsed with both numerator and denominator. The value is computed.',

  'Rule NUM-005: Vague quantities ("a couple", "a few", "several") are parsed ' +
  'with an estimate and a min/max range.',

  'Rule NUM-006: Multiples ("double", "triple", "three times") are parsed ' +
  'as multiplication factors.',

  'Rule NUM-007: Ranges ("3-5", "two to four", "between 2 and 4") are parsed ' +
  'with min and max values.',

  'Rule NUM-008: Time signatures ("4/4", "3/4", "6/8") are recognized as a ' +
  'distinct type. The denominator must be a power of 2.',

  'Rule NUM-009: Ambiguity between time signatures and fractions is resolved ' +
  'by checking if the denominator is a valid beat unit (2, 4, 8, 16, 32).',

  'Rule NUM-010: "last" is parsed as ordinal with position -1, signaling ' +
  '"the last item" to downstream resolution.',

  'Rule NUM-011: Multi-token number expressions ("twenty three", "a couple of") ' +
  'are detected by trying windows of 2-4 tokens.',

  'Rule NUM-012: Number parsing is deterministic: the same input always ' +
  'produces the same result.',
] as const;
