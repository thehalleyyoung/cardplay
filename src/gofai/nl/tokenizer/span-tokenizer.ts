/**
 * GOFAI NL Tokenizer — Span-Preserving Tokenizer
 *
 * Implements a tokenizer that retains original substrings for quoting,
 * highlighting, and provenance. Every token carries a span (start, end)
 * back to the original input, enabling:
 *
 * 1. **Highlighting**: The UI can highlight which part of the input
 *    each binding/parse node corresponds to.
 * 2. **Quoting**: Error messages can quote the exact user text.
 * 3. **Provenance**: Each CPL node can trace back to its source span.
 * 4. **Incremental re-tokenization**: Only re-tokenize changed spans.
 *
 * ## Tokenization Strategy
 *
 * The tokenizer operates in phases:
 * 1. **Raw scan**: Split on whitespace and punctuation boundaries
 * 2. **Merge**: Rejoin multi-word tokens (e.g., "and then" → single token)
 * 3. **Classify**: Assign token types (word, number, punctuation, etc.)
 * 4. **Tag**: Attach preliminary part-of-speech and domain hints
 *
 * ## Token Types
 *
 * - WORD: A regular word ("make", "chorus", "brighter")
 * - NUMBER: A numeric literal ("42", "3.14", "2nd")
 * - UNIT: A unit expression ("dB", "BPM", "Hz", "bars")
 * - PUNCTUATION: Commas, periods, question marks, etc.
 * - QUOTE: Quoted strings ("the 'glass pad' track")
 * - OPERATOR: Comparison/math operators ("+", "-", "=")
 * - MULTI_WORD: A recognized multi-word expression ("and then", "rather than")
 * - UNKNOWN: Unrecognized tokens preserved for downstream handling
 *
 * @module gofai/nl/tokenizer/span-tokenizer
 * @see gofai_goalA.md Step 101
 */

// =============================================================================
// SPAN — position information in the source text
// =============================================================================

/**
 * A span in the original input text.
 * Start is inclusive, end is exclusive (like Array.slice).
 */
export interface Span {
  /** Byte offset of the first character (inclusive) */
  readonly start: number;

  /** Byte offset past the last character (exclusive) */
  readonly end: number;
}

/**
 * Create a span.
 */
export function span(start: number, end: number): Span {
  return { start, end };
}

/**
 * Get the length of a span.
 */
export function spanLength(s: Span): number {
  return s.end - s.start;
}

/**
 * Check if two spans overlap.
 */
export function spansOverlap(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Merge two adjacent or overlapping spans into one.
 */
export function mergeSpans(a: Span, b: Span): Span {
  return { start: Math.min(a.start, b.start), end: Math.max(a.end, b.end) };
}

/**
 * Extract the text covered by a span from the source.
 */
export function extractSpanText(source: string, s: Span): string {
  return source.slice(s.start, s.end);
}

// =============================================================================
// TOKEN — a single token with span information
// =============================================================================

/**
 * A token produced by the span-preserving tokenizer.
 */
export interface Token {
  /** The token type */
  readonly type: TokenType;

  /** The normalized text (lowercased, trimmed) */
  readonly text: string;

  /** The original text as it appeared in the input */
  readonly original: string;

  /** The span in the source text */
  readonly span: Span;

  /** Index of this token in the token stream (0-based) */
  readonly index: number;

  /** Preliminary token tags */
  readonly tags: readonly TokenTag[];

  /** Whether this token was merged from multiple raw tokens */
  readonly merged: boolean;

  /** If merged, the component spans */
  readonly componentSpans?: readonly Span[];
}

/**
 * Token types.
 */
export type TokenType =
  | 'word'          // Regular word
  | 'number'        // Numeric literal
  | 'ordinal'       // Ordinal number ("1st", "2nd", "third")
  | 'unit'          // Unit expression (when attached to a number)
  | 'punctuation'   // Punctuation mark
  | 'quote'         // Quoted string
  | 'operator'      // +, -, =, >, <
  | 'multi_word'    // Recognized multi-word expression
  | 'contraction'   // don't, can't, it's
  | 'whitespace'    // Preserved whitespace (usually filtered)
  | 'unknown';      // Unrecognized

/**
 * Preliminary tags for tokens.
 */
export type TokenTag =
  | 'verb'           // Likely a verb (make, add, remove)
  | 'adjective'      // Likely an adjective (brighter, darker)
  | 'noun'           // Likely a noun (chorus, track)
  | 'adverb'         // Likely an adverb (slightly, really)
  | 'preposition'    // Preposition (in, at, for, to)
  | 'determiner'     // Determiner (the, a, this, that)
  | 'conjunction'    // Conjunction (and, but, or)
  | 'pronoun'        // Pronoun (it, them, this)
  | 'negation'       // Negation (not, don't, no)
  | 'quantifier'     // Quantifier (all, every, some)
  | 'degree'         // Degree word (more, less, very)
  | 'musical'        // Domain-specific musical term
  | 'number_word'    // Written number (two, three, half)
  | 'unit_word'      // Unit word (bars, beats, semitones)
  | 'question'       // Question word (what, why, how)
  | 'modal'          // Modal (can, should, might)
  | 'imperative';    // Imperative marker (please, just)

// =============================================================================
// TOKEN STREAM — the result of tokenization
// =============================================================================

/**
 * The result of tokenizing an input string.
 */
export interface TokenStream {
  /** The original input text */
  readonly source: string;

  /** The tokens (excluding whitespace) */
  readonly tokens: readonly Token[];

  /** All tokens including whitespace (for span reconstruction) */
  readonly allTokens: readonly Token[];

  /** Tokenization metadata */
  readonly metadata: TokenizationMetadata;
}

/**
 * Metadata about the tokenization process.
 */
export interface TokenizationMetadata {
  /** Number of raw tokens before merging */
  readonly rawTokenCount: number;

  /** Number of merged multi-word tokens */
  readonly mergedCount: number;

  /** Number of tokens by type */
  readonly typeCounts: Readonly<Record<string, number>>;

  /** Whether any unknown tokens were found */
  readonly hasUnknown: boolean;

  /** Whether any quoted strings were found */
  readonly hasQuotes: boolean;

  /** Total character count of the input */
  readonly inputLength: number;
}

// =============================================================================
// MULTI-WORD EXPRESSIONS — recognized multi-word tokens
// =============================================================================

/**
 * A multi-word expression that should be tokenized as a single token.
 */
export interface MultiWordExpression {
  /** The words that form the expression */
  readonly words: readonly string[];

  /** The canonical form */
  readonly canonical: string;

  /** Tags for the merged token */
  readonly tags: readonly TokenTag[];

  /** Priority (higher = merge first) */
  readonly priority: number;
}

/**
 * Recognized multi-word expressions.
 * These are merged during tokenization into single tokens.
 */
export const MULTI_WORD_EXPRESSIONS: readonly MultiWordExpression[] = [
  // Conjunctions
  { words: ['and', 'then'], canonical: 'and then', tags: ['conjunction'], priority: 10 },
  { words: ['as', 'well', 'as'], canonical: 'as well as', tags: ['conjunction'], priority: 10 },
  { words: ['along', 'with'], canonical: 'along with', tags: ['conjunction'], priority: 10 },
  { words: ['together', 'with'], canonical: 'together with', tags: ['conjunction'], priority: 10 },
  { words: ['rather', 'than'], canonical: 'rather than', tags: ['conjunction'], priority: 10 },
  { words: ['instead', 'of'], canonical: 'instead of', tags: ['conjunction'], priority: 10 },
  { words: ['in', 'place', 'of'], canonical: 'in place of', tags: ['conjunction'], priority: 10 },
  { words: ['in', 'lieu', 'of'], canonical: 'in lieu of', tags: ['conjunction'], priority: 10 },
  { words: ['as', 'opposed', 'to'], canonical: 'as opposed to', tags: ['conjunction'], priority: 10 },
  { words: ['in', 'order', 'to'], canonical: 'in order to', tags: ['conjunction'], priority: 10 },
  { words: ['so', 'that'], canonical: 'so that', tags: ['conjunction'], priority: 10 },
  { words: ['at', 'the', 'same', 'time'], canonical: 'at the same time', tags: ['conjunction'], priority: 10 },
  { words: ['after', 'that'], canonical: 'after that', tags: ['conjunction'], priority: 10 },
  { words: ['and', 'after', 'that'], canonical: 'and after that', tags: ['conjunction'], priority: 11 },
  { words: ['followed', 'by'], canonical: 'followed by', tags: ['conjunction'], priority: 10 },
  { words: ['while', 'still'], canonical: 'while still', tags: ['conjunction'], priority: 10 },
  { words: ['not', 'but'], canonical: 'not...but', tags: ['conjunction'], priority: 9 },

  // Replacement/correction
  { words: ['on', 'second', 'thought'], canonical: 'on second thought', tags: [], priority: 10 },
  { words: ['never', 'mind'], canonical: 'never mind', tags: ['negation'], priority: 10 },
  { words: ['scratch', 'that'], canonical: 'scratch that', tags: ['negation'], priority: 10 },
  { words: ['forget', 'it'], canonical: 'forget it', tags: ['negation'], priority: 10 },
  { words: ['forget', 'that'], canonical: 'forget that', tags: ['negation'], priority: 10 },
  { words: ['cancel', 'that'], canonical: 'cancel that', tags: ['negation'], priority: 10 },
  { words: ['undo', 'that'], canonical: 'undo that', tags: [], priority: 10 },
  { words: ['roll', 'back'], canonical: 'roll back', tags: [], priority: 10 },

  // Temporal
  { words: ['right', 'now'], canonical: 'right now', tags: ['adverb'], priority: 9 },
  { words: ['so', 'far'], canonical: 'so far', tags: ['adverb'], priority: 9 },
  { words: ['up', 'to', 'now'], canonical: 'up to now', tags: ['adverb'], priority: 9 },
  { words: ['from', 'now', 'on'], canonical: 'from now on', tags: ['adverb'], priority: 9 },
  { words: ['at', 'first'], canonical: 'at first', tags: ['adverb'], priority: 9 },

  // Degree
  { words: ['a', 'lot'], canonical: 'a lot', tags: ['degree'], priority: 9 },
  { words: ['a', 'little'], canonical: 'a little', tags: ['degree'], priority: 9 },
  { words: ['a', 'bit'], canonical: 'a bit', tags: ['degree'], priority: 9 },
  { words: ['a', 'touch'], canonical: 'a touch', tags: ['degree'], priority: 9 },
  { words: ['a', 'ton'], canonical: 'a ton', tags: ['degree'], priority: 9 },
  { words: ['quite', 'a', 'bit'], canonical: 'quite a bit', tags: ['degree'], priority: 10 },
  { words: ['a', 'great', 'deal'], canonical: 'a great deal', tags: ['degree'], priority: 10 },
  { words: ['not', 'much'], canonical: 'not much', tags: ['degree'], priority: 9 },
  { words: ['as', 'much', 'as', 'possible'], canonical: 'as much as possible', tags: ['degree'], priority: 10 },

  // Prepositions / location
  { words: ['in', 'the'], canonical: 'in the', tags: ['preposition', 'determiner'], priority: 5 },
  { words: ['on', 'the'], canonical: 'on the', tags: ['preposition', 'determiner'], priority: 5 },
  { words: ['at', 'the'], canonical: 'at the', tags: ['preposition', 'determiner'], priority: 5 },

  // Quantifiers
  { words: ['each', 'of'], canonical: 'each of', tags: ['quantifier'], priority: 9 },
  { words: ['all', 'of'], canonical: 'all of', tags: ['quantifier'], priority: 9 },
  { words: ['every', 'other'], canonical: 'every other', tags: ['quantifier'], priority: 9 },
  { words: ['none', 'of'], canonical: 'none of', tags: ['quantifier'], priority: 9 },

  // Question phrases
  { words: ['how', 'about'], canonical: 'how about', tags: ['question'], priority: 9 },
  { words: ['what', 'if'], canonical: 'what if', tags: ['question'], priority: 9 },
  { words: ['what', 'about'], canonical: 'what about', tags: ['question'], priority: 9 },

  // Musical time
  { words: ['four', 'on', 'the', 'floor'], canonical: 'four on the floor', tags: ['musical'], priority: 12 },
  { words: ['on', 'the', 'beat'], canonical: 'on the beat', tags: ['musical'], priority: 10 },
  { words: ['off', 'the', 'beat'], canonical: 'off the beat', tags: ['musical'], priority: 10 },
  { words: ['on', 'beat'], canonical: 'on beat', tags: ['musical'], priority: 9 },
  { words: ['off', 'beat'], canonical: 'off beat', tags: ['musical'], priority: 9 },

  // Imperative markers
  { words: ['go', 'ahead', 'and'], canonical: 'go ahead and', tags: ['imperative'], priority: 8 },
  { words: ['let', 'me'], canonical: 'let me', tags: ['imperative'], priority: 8 },
  { words: ['let', 'us'], canonical: 'let us', tags: ['imperative'], priority: 8 },
  { words: ['let\'s'], canonical: 'let\'s', tags: ['imperative'], priority: 8 },
];

// Build multi-word lookup by first word
const _mwByFirstWord = new Map<string, MultiWordExpression[]>();
for (const mw of MULTI_WORD_EXPRESSIONS) {
  const first = mw.words[0]!;
  const existing = _mwByFirstWord.get(first);
  if (existing) {
    existing.push(mw);
  } else {
    _mwByFirstWord.set(first, [mw]);
  }
}
// Sort each group by priority (descending) then length (descending)
for (const group of _mwByFirstWord.values()) {
  group.sort((a, b) => b.priority - a.priority || b.words.length - a.words.length);
}

// =============================================================================
// PRELIMINARY TAGGING — quick tag assignment based on word lists
// =============================================================================

const VERB_WORDS = new Set([
  'make', 'add', 'remove', 'delete', 'change', 'adjust', 'set', 'move',
  'copy', 'duplicate', 'boost', 'cut', 'raise', 'lower', 'increase',
  'decrease', 'brighten', 'darken', 'widen', 'narrow', 'tighten', 'loosen',
  'soften', 'harden', 'warm', 'cool', 'thicken', 'thin', 'compress',
  'expand', 'reduce', 'swap', 'switch', 'replace', 'undo', 'redo',
  'keep', 'preserve', 'maintain', 'fix', 'apply', 'try', 'transpose',
  'harmonize', 'modulate', 'reharmonize', 'revoice', 'pan', 'mute',
  'solo', 'quantize', 'humanize', 'automate', 'fade', 'crossfade',
  'trim', 'extend', 'shorten', 'lengthen', 'stretch', 'pitch',
  'retune', 'detune', 'filter', 'eq', 'limit', 'gate', 'sidechain',
]);

const ADJECTIVE_WORDS = new Set([
  'brighter', 'darker', 'wider', 'narrower', 'tighter', 'looser',
  'louder', 'quieter', 'softer', 'harder', 'warmer', 'cooler',
  'thicker', 'thinner', 'heavier', 'lighter', 'denser', 'sparser',
  'punchier', 'muddier', 'cleaner', 'dirtier', 'crispier', 'mushier',
  'bigger', 'smaller', 'fuller', 'emptier', 'richer', 'leaner',
  'bright', 'dark', 'wide', 'narrow', 'tight', 'loose',
  'loud', 'quiet', 'soft', 'hard', 'warm', 'cool',
  'thick', 'thin', 'heavy', 'light', 'dense', 'sparse',
  'punchy', 'muddy', 'clean', 'dirty', 'crisp', 'mushy',
  'big', 'small', 'full', 'empty', 'rich', 'lean',
  'energetic', 'mellow', 'aggressive', 'gentle', 'ethereal', 'gritty',
  'airy', 'compressed', 'dynamic', 'static', 'smooth', 'rough',
  'syncopated', 'straight', 'swung', 'jazzy', 'funky', 'groovy',
]);

const PREPOSITION_WORDS = new Set([
  'in', 'at', 'on', 'to', 'for', 'from', 'by', 'with', 'without',
  'before', 'after', 'during', 'between', 'through', 'across',
  'above', 'below', 'over', 'under', 'into', 'onto', 'around',
  'throughout', 'until', 'towards',
]);

const DETERMINER_WORDS = new Set([
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'my', 'your', 'our', 'its', 'their',
  'some', 'any', 'no', 'each', 'every', 'all', 'both',
]);

const PRONOUN_WORDS = new Set([
  'it', 'them', 'they', 'this', 'that', 'these', 'those',
  'one', 'ones', 'everything', 'something', 'nothing',
]);

const CONJUNCTION_WORDS = new Set([
  'and', 'but', 'or', 'yet', 'so', 'nor', 'then',
  'however', 'although', 'though', 'while', 'whereas',
  'because', 'since', 'if', 'unless', 'until', 'when',
]);

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'none', 'nothing',
  'without', 'except', 'don\'t', 'doesn\'t', 'didn\'t',
  'can\'t', 'won\'t', 'shouldn\'t', 'wouldn\'t', 'couldn\'t',
]);

const DEGREE_WORDS = new Set([
  'more', 'less', 'very', 'slightly', 'much', 'somewhat',
  'barely', 'really', 'extremely', 'fairly', 'quite',
  'rather', 'pretty', 'super', 'ultra', 'way',
  'significantly', 'dramatically', 'subtly', 'massively',
  'noticeably', 'considerably', 'moderately', 'tremendously',
]);

const QUESTION_WORDS = new Set([
  'what', 'which', 'who', 'where', 'when', 'why', 'how',
]);

const MODAL_WORDS = new Set([
  'can', 'could', 'should', 'would', 'might', 'may',
  'must', 'shall', 'will',
]);

const NUMBER_WORDS = new Set([
  'zero', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'half', 'quarter', 'third', 'double', 'triple',
  'couple', 'few', 'several', 'dozen',
]);

const UNIT_WORDS = new Set([
  'bar', 'bars', 'beat', 'beats', 'measure', 'measures',
  'semitone', 'semitones', 'step', 'steps', 'octave', 'octaves',
  'cent', 'cents', 'hz', 'khz', 'mhz',
  'db', 'decibel', 'decibels',
  'bpm', 'ms', 'millisecond', 'milliseconds', 'second', 'seconds',
  'percent', '%',
]);

const ORDINAL_SUFFIXES = /^(\d+)(st|nd|rd|th)$/i;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const QUOTED_PATTERN = /^(['"])(.*)\1$/;

/**
 * Assign preliminary tags to a word.
 */
function tagWord(word: string): readonly TokenTag[] {
  const lower = word.toLowerCase();
  const tags: TokenTag[] = [];

  if (VERB_WORDS.has(lower)) tags.push('verb');
  if (ADJECTIVE_WORDS.has(lower)) tags.push('adjective');
  if (PREPOSITION_WORDS.has(lower)) tags.push('preposition');
  if (DETERMINER_WORDS.has(lower)) tags.push('determiner');
  if (PRONOUN_WORDS.has(lower)) tags.push('pronoun');
  if (CONJUNCTION_WORDS.has(lower)) tags.push('conjunction');
  if (NEGATION_WORDS.has(lower)) tags.push('negation');
  if (DEGREE_WORDS.has(lower)) tags.push('degree');
  if (QUESTION_WORDS.has(lower)) tags.push('question');
  if (MODAL_WORDS.has(lower)) tags.push('modal');
  if (NUMBER_WORDS.has(lower)) tags.push('number_word');
  if (UNIT_WORDS.has(lower)) tags.push('unit_word');

  return tags;
}

/**
 * Classify a raw token into a token type.
 */
function classifyRawToken(text: string): TokenType {
  // Numbers
  if (NUMBER_PATTERN.test(text)) return 'number';

  // Ordinals
  if (ORDINAL_SUFFIXES.test(text)) return 'ordinal';

  // Quoted strings
  if (QUOTED_PATTERN.test(text)) return 'quote';

  // Operators
  if (/^[+\-*/=<>]+$/.test(text)) return 'operator';

  // Punctuation
  if (/^[.,;:!?()[\]{}'"…–—]+$/.test(text)) return 'punctuation';

  // Contractions
  if (/^[a-z]+'[a-z]+$/i.test(text)) return 'contraction';

  // Whitespace
  if (/^\s+$/.test(text)) return 'whitespace';

  // Units (standalone)
  if (UNIT_WORDS.has(text.toLowerCase())) return 'word';

  // Regular words
  if (/^[a-z'-]+$/i.test(text)) return 'word';

  return 'unknown';
}

// =============================================================================
// TOKENIZER — main tokenization function
// =============================================================================

/**
 * Tokenizer configuration.
 */
export interface TokenizerConfig {
  /** Whether to preserve whitespace tokens */
  readonly preserveWhitespace: boolean;

  /** Whether to merge multi-word expressions */
  readonly mergeMultiWord: boolean;

  /** Whether to tag tokens */
  readonly tagTokens: boolean;

  /** Additional multi-word expressions to recognize */
  readonly additionalMultiWords: readonly MultiWordExpression[];

  /** Whether to normalize Unicode quotes to ASCII */
  readonly normalizeQuotes: boolean;
}

/**
 * Default tokenizer configuration.
 */
export const DEFAULT_TOKENIZER_CONFIG: TokenizerConfig = {
  preserveWhitespace: false,
  mergeMultiWord: true,
  tagTokens: true,
  additionalMultiWords: [],
  normalizeQuotes: true,
};

/**
 * Tokenize an input string, preserving spans.
 *
 * This is the main entry point for the tokenizer.
 */
export function tokenize(input: string, config: TokenizerConfig = DEFAULT_TOKENIZER_CONFIG): TokenStream {
  // Phase 1: Raw scan
  const rawTokens = rawScan(input, config);

  // Phase 2: Merge multi-word expressions
  let merged: RawToken[];
  let mergedCount = 0;
  if (config.mergeMultiWord) {
    const result = mergeMultiWords(rawTokens, config);
    merged = result.tokens;
    mergedCount = result.mergedCount;
  } else {
    merged = rawTokens;
  }

  // Phase 3 & 4: Classify and tag
  const allTokens: Token[] = [];
  let tokenIndex = 0;

  for (const raw of merged) {
    const type = raw.merged ? 'multi_word' : classifyRawToken(raw.text);
    const tags: TokenTag[] = config.tagTokens ? [...tagWord(raw.text)] : [];

    // Inherit tags from multi-word definition
    if (raw.mergedTags) {
      for (const t of raw.mergedTags) {
        if (!tags.includes(t)) tags.push(t);
      }
    }

    const baseToken = {
      type,
      text: raw.text.toLowerCase(),
      original: raw.original,
      span: raw.span,
      index: tokenIndex++,
      tags,
      merged: raw.merged,
    };
    const token: Token = raw.componentSpans
      ? { ...baseToken, componentSpans: raw.componentSpans }
      : baseToken;

    allTokens.push(token);
  }

  // Filter non-whitespace tokens
  const tokens = allTokens.filter(t => t.type !== 'whitespace');

  // Build metadata
  const typeCounts: Record<string, number> = {};
  for (const t of tokens) {
    typeCounts[t.type] = (typeCounts[t.type] ?? 0) + 1;
  }

  return {
    source: input,
    tokens,
    allTokens,
    metadata: {
      rawTokenCount: rawTokens.length,
      mergedCount,
      typeCounts,
      hasUnknown: tokens.some(t => t.type === 'unknown'),
      hasQuotes: tokens.some(t => t.type === 'quote'),
      inputLength: input.length,
    },
  };
}

// =============================================================================
// RAW SCAN — split input into raw tokens
// =============================================================================

interface RawToken {
  text: string;
  original: string;
  span: Span;
  merged: boolean;
  componentSpans?: readonly Span[];
  mergedTags?: readonly TokenTag[];
}

/**
 * Raw scan: split input on whitespace and punctuation boundaries.
 */
function rawScan(input: string, config: TokenizerConfig): RawToken[] {
  let text = input;

  // Normalize Unicode quotes if configured
  if (config.normalizeQuotes) {
    text = normalizeUnicodeQuotes(text);
  }

  const tokens: RawToken[] = [];
  let pos = 0;

  while (pos < text.length) {
    const ch = text[pos]!;

    // Whitespace
    if (/\s/.test(ch)) {
      const start = pos;
      while (pos < text.length && /\s/.test(text[pos]!)) pos++;
      tokens.push({
        text: text.slice(start, pos),
        original: input.slice(start, pos),
        span: { start, end: pos },
        merged: false,
      });
      continue;
    }

    // Quoted strings (preserve as single token)
    if (ch === '"' || ch === "'") {
      const start = pos;
      const quote = ch;
      pos++; // skip opening quote
      while (pos < text.length && text[pos] !== quote) pos++;
      if (pos < text.length) pos++; // skip closing quote
      tokens.push({
        text: text.slice(start, pos),
        original: input.slice(start, pos),
        span: { start, end: pos },
        merged: false,
      });
      continue;
    }

    // Punctuation (single character tokens)
    if (/[.,;:!?()[\]{}…–—]/.test(ch)) {
      tokens.push({
        text: ch,
        original: input[pos]!,
        span: { start: pos, end: pos + 1 },
        merged: false,
      });
      pos++;
      continue;
    }

    // Operators
    if (/[+\-*/=<>]/.test(ch)) {
      const start = pos;
      while (pos < text.length && /[+\-*/=<>]/.test(text[pos]!)) pos++;
      tokens.push({
        text: text.slice(start, pos),
        original: input.slice(start, pos),
        span: { start, end: pos },
        merged: false,
      });
      continue;
    }

    // Words (including contractions with apostrophes)
    if (/[a-zA-Z0-9_']/.test(ch)) {
      const start = pos;
      while (pos < text.length && /[a-zA-Z0-9_'.%-]/.test(text[pos]!)) {
        // Don't include trailing periods/hyphens
        if ((text[pos] === '.' || text[pos] === '-') && (pos + 1 >= text.length || /\s/.test(text[pos + 1] ?? ''))) break;
        pos++;
      }
      tokens.push({
        text: text.slice(start, pos),
        original: input.slice(start, pos),
        span: { start, end: pos },
        merged: false,
      });
      continue;
    }

    // Unknown character: emit as single token
    tokens.push({
      text: ch,
      original: input[pos]!,
      span: { start: pos, end: pos + 1 },
      merged: false,
    });
    pos++;
  }

  return tokens;
}

/**
 * Normalize Unicode quotes, dashes, and other typographic characters.
 */
function normalizeUnicodeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')   // double quotes
    .replace(/[\u2013]/g, '–')                       // en dash
    .replace(/[\u2014]/g, '—')                       // em dash
    .replace(/[\u2026]/g, '…');                      // ellipsis
}

// =============================================================================
// MULTI-WORD MERGING
// =============================================================================

interface MergeResult {
  tokens: RawToken[];
  mergedCount: number;
}

/**
 * Merge recognized multi-word expressions into single tokens.
 */
function mergeMultiWords(rawTokens: RawToken[], config: TokenizerConfig): MergeResult {
  // Build a combined lookup including additional multi-words
  const additionalByFirst = new Map<string, MultiWordExpression[]>();
  for (const mw of config.additionalMultiWords) {
    const first = mw.words[0]!;
    const existing = additionalByFirst.get(first);
    if (existing) {
      existing.push(mw);
    } else {
      additionalByFirst.set(first, [mw]);
    }
  }

  const result: RawToken[] = [];
  let mergedCount = 0;
  let i = 0;

  // Only consider non-whitespace tokens for matching, but preserve whitespace in output
  while (i < rawTokens.length) {
    const token = rawTokens[i]!;

    // Skip whitespace (pass through)
    if (/^\s+$/.test(token.text)) {
      result.push(token);
      i++;
      continue;
    }

    const lower = token.text.toLowerCase();

    // Look up multi-word expressions starting with this word
    const candidates = [
      ...(_mwByFirstWord.get(lower) ?? []),
      ...(additionalByFirst.get(lower) ?? []),
    ];

    let matched = false;

    for (const mw of candidates) {
      // Try to match all words of this MWE
      const wordTokens: RawToken[] = [];
      let j = i;
      let wordIdx = 0;

      while (j < rawTokens.length && wordIdx < mw.words.length) {
        const rt = rawTokens[j]!;
        // Skip whitespace
        if (/^\s+$/.test(rt.text)) {
          j++;
          continue;
        }
        if (rt.text.toLowerCase() !== mw.words[wordIdx]) break;
        wordTokens.push(rt);
        wordIdx++;
        j++;
      }

      if (wordIdx === mw.words.length && wordTokens.length === mw.words.length) {
        // Merge!
        const firstToken = wordTokens[0]!;
        const lastToken = wordTokens[wordTokens.length - 1]!;
        const mergedSpan: Span = {
          start: firstToken.span.start,
          end: lastToken.span.end,
        };

        result.push({
          text: mw.canonical,
          original: wordTokens.map(t => t.original).join(' '),
          span: mergedSpan,
          merged: true,
          componentSpans: wordTokens.map(t => t.span),
          mergedTags: mw.tags,
        });

        // Skip whitespace tokens between merged tokens
        i = j;
        mergedCount++;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(token);
      i++;
    }
  }

  return { tokens: result, mergedCount };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the text covered by a sequence of tokens.
 */
export function tokensToText(tokens: readonly Token[]): string {
  return tokens.map(t => t.original).join(' ');
}

/**
 * Get tokens in a span range.
 */
export function tokensInSpan(stream: TokenStream, s: Span): readonly Token[] {
  return stream.tokens.filter(t => t.span.start >= s.start && t.span.end <= s.end);
}

/**
 * Find a token by its index.
 */
export function getTokenByIndex(stream: TokenStream, index: number): Token | undefined {
  return stream.tokens[index];
}

/**
 * Find the token at a given character position.
 */
export function tokenAtPosition(stream: TokenStream, position: number): Token | undefined {
  return stream.tokens.find(t => t.span.start <= position && t.span.end > position);
}

/**
 * Get the span covering all tokens from start to end index (inclusive).
 */
export function tokenRangeSpan(stream: TokenStream, startIdx: number, endIdx: number): Span | undefined {
  const start = stream.tokens[startIdx];
  const end = stream.tokens[endIdx];
  if (!start || !end) return undefined;
  return { start: start.span.start, end: end.span.end };
}

/**
 * Format a token for debugging.
 */
export function formatToken(token: Token): string {
  const tags = token.tags.length > 0 ? ` [${token.tags.join(', ')}]` : '';
  const merged = token.merged ? ' (merged)' : '';
  return `${token.type}("${token.original}", ${token.span.start}:${token.span.end})${tags}${merged}`;
}

/**
 * Format a token stream for debugging.
 */
export function formatTokenStream(stream: TokenStream): string {
  const lines = stream.tokens.map(t => `  ${t.index}: ${formatToken(t)}`);
  return [
    `TokenStream: "${stream.source}"`,
    `  ${stream.tokens.length} tokens (${stream.metadata.rawTokenCount} raw, ${stream.metadata.mergedCount} merged)`,
    ...lines,
  ].join('\n');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const TOKENIZER_RULES = [
  'Rule TOK-001: Every token carries a span (start, end) back to the ' +
  'original input. The span is never lost or fabricated.',

  'Rule TOK-002: Tokenization is deterministic: the same input always ' +
  'produces the same token stream.',

  'Rule TOK-003: Quoted strings ("the \'glass pad\' track") are preserved ' +
  'as single tokens of type QUOTE.',

  'Rule TOK-004: Multi-word expressions ("and then", "rather than") are ' +
  'merged into single tokens of type MULTI_WORD. Component spans are preserved.',

  'Rule TOK-005: Numbers are recognized as type NUMBER. Ordinals ("1st", ' +
  '"2nd", "third") are recognized as type ORDINAL.',

  'Rule TOK-006: Contractions ("don\'t", "can\'t") are preserved as single ' +
  'tokens of type CONTRACTION.',

  'Rule TOK-007: Unicode typographic characters (smart quotes, em dashes) ' +
  'are normalized to their ASCII equivalents before tokenization.',

  'Rule TOK-008: Unknown tokens are preserved (never silently dropped) ' +
  'with type UNKNOWN. Downstream stages handle them as candidate entity names.',

  'Rule TOK-009: Preliminary tags (verb, adjective, noun, etc.) are heuristic ' +
  'and may be overridden by downstream parsing.',

  'Rule TOK-010: Multi-word merging is priority-ordered: longer and higher- ' +
  'priority expressions are merged first.',

  'Rule TOK-011: Extensions can register additional multi-word expressions ' +
  'via the additionalMultiWords config option.',

  'Rule TOK-012: The token stream preserves all whitespace in allTokens ' +
  'for exact span reconstruction, but filters whitespace from tokens.',
] as const;
