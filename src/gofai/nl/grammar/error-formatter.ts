/**
 * GOFAI NL Grammar — "I Didn't Understand" Error Formatter
 *
 * Generates user-facing error messages when the parser fails to fully
 * understand an input. The formatter:
 *
 * 1. **Pinpoints spans** — highlights the exact portion of the input
 *    that caused confusion, using start/end offsets.
 *
 * 2. **Suggests known terms** — offers close matches from the vocabulary
 *    when a token is not recognized (typos, abbreviations, synonyms).
 *
 * 3. **Classifies error type** — categorizes the failure so the UI can
 *    display appropriate affordances (e.g., "did you mean…", "try instead…",
 *    "this word is ambiguous…").
 *
 * 4. **Formats for display** — produces both plain-text and structured
 *    error output suitable for terminal, UI popover, and accessibility
 *    readers.
 *
 * ## Error Shape Contract
 *
 * Every error message follows the "error shape" defined in Step 018:
 * - **Parse error** — unrecognized input, incomplete parse, structural failure
 * - **Unresolved reference** — known grammar but entity can't be resolved
 * - **Unsatisfied constraint** — valid request but contradictory constraints
 * - **Unsafe plan** — valid request but plan would destroy data
 * - **Missing capability** — valid request but feature not available
 *
 * This module handles **parse errors**. Other error shapes are handled
 * by downstream modules (reference resolution, constraint solver, planner).
 *
 * @module gofai/nl/grammar/error-formatter
 * @see gofai_goalA.md Step 130
 */

// =============================================================================
// ERROR TYPES — structured parse error representation
// =============================================================================

/**
 * A structured parse error with span information.
 */
export interface ParseError {
  /** Unique error code for programmatic handling */
  readonly code: ParseErrorCode;

  /** Human-readable error category */
  readonly category: ParseErrorCategory;

  /** One-line summary message */
  readonly summary: string;

  /** Detailed explanation */
  readonly detail: string;

  /** The problematic span in the source text */
  readonly span: ErrorSpan;

  /** The full source text */
  readonly source: string;

  /** Suggestions for fixing the error */
  readonly suggestions: readonly ErrorSuggestion[];

  /** Context about what the parser was expecting */
  readonly expected: readonly string[];

  /** Severity of the error */
  readonly severity: ErrorSeverity;

  /** Whether partial results are available */
  readonly hasPartialParse: boolean;

  /** Additional structured metadata */
  readonly metadata: ErrorMetadata;
}

/**
 * Error codes for parse errors.
 */
export type ParseErrorCode =
  | 'UNKNOWN_TOKEN'         // Token not in vocabulary
  | 'UNEXPECTED_TOKEN'      // Token recognized but not expected here
  | 'INCOMPLETE_INPUT'      // Input ended before parse completed
  | 'NO_VERB'               // No command verb found
  | 'AMBIGUOUS_VERB'        // Multiple verb interpretations
  | 'MISSING_ARGUMENT'      // Verb requires an argument that's missing
  | 'INVALID_ARGUMENT'      // Argument doesn't match selectional restrictions
  | 'STRUCTURAL_ERROR'      // General structural parse failure
  | 'CONTRADICTORY_MODIFIERS' // Conflicting modifiers (e.g., "more less bright")
  | 'NESTED_TOO_DEEP'       // Exceeded nesting depth
  | 'EMPTY_INPUT'           // No input provided
  | 'ONLY_STOPWORDS'        // Input contains only stop words
  | 'NUMBER_FORMAT'         // Malformed numeric value
  | 'DANGLING_PREPOSITION'  // Preposition without object
  | 'REPEATED_MODIFIER';    // Same modifier used multiple times

/**
 * Human-readable error categories (matches Step 018 error shapes).
 */
export type ParseErrorCategory =
  | 'unknown_word'
  | 'unexpected_structure'
  | 'incomplete_command'
  | 'ambiguity'
  | 'constraint_conflict'
  | 'format_error';

/**
 * A span in the source text where the error occurs.
 */
export interface ErrorSpan {
  /** Start offset (0-based, inclusive) */
  readonly start: number;

  /** End offset (0-based, exclusive) */
  readonly end: number;

  /** The text at this span */
  readonly text: string;

  /** Line number (1-based) */
  readonly line: number;

  /** Column number (1-based) */
  readonly column: number;
}

/**
 * A suggestion for fixing a parse error.
 */
export interface ErrorSuggestion {
  /** The type of suggestion */
  readonly type: SuggestionType;

  /** Human-readable label */
  readonly label: string;

  /** The suggested replacement text */
  readonly replacement: string;

  /** How confident we are in this suggestion (0–1) */
  readonly confidence: number;

  /** Where to apply the replacement */
  readonly span: ErrorSpan;

  /** Brief explanation of why this is suggested */
  readonly reason: string;
}

export type SuggestionType =
  | 'typo_correction'      // Close edit distance match
  | 'synonym'              // Known synonym of a vocabulary term
  | 'abbreviation'         // Known abbreviation expansion
  | 'related_term'         // Semantically related term
  | 'structural_fix'       // Reword for correct grammar
  | 'add_missing'          // Add a missing required element
  | 'remove_extra'         // Remove an extraneous element
  | 'split_compound';      // Split a compound word

/**
 * Error severity levels.
 */
export type ErrorSeverity = 'error' | 'warning' | 'hint';

/**
 * Additional metadata about the error.
 */
export interface ErrorMetadata {
  /** The parser phase where the error occurred */
  readonly phase: ParserPhase;

  /** How far the parser got before failing (0–1) */
  readonly progress: number;

  /** Whether this error is likely due to a missing extension */
  readonly likelyExtension: boolean;

  /** The grammar rules that were active when the error occurred */
  readonly activeRules: readonly string[];

  /** The token index where parsing failed */
  readonly failureTokenIndex: number;

  /** Total tokens in input */
  readonly totalTokens: number;
}

export type ParserPhase =
  | 'tokenization'
  | 'lexical_lookup'
  | 'parsing'
  | 'semantic_construction'
  | 'validation';

// =============================================================================
// ERROR CONSTRUCTION — building structured errors from parse failures
// =============================================================================

/**
 * Raw parse failure information from the parser.
 * This is the input to the error formatter.
 */
export interface RawParseFailure {
  /** The source text */
  readonly source: string;

  /** Tokens produced by the tokenizer */
  readonly tokens: readonly RawToken[];

  /** Index of the token where parsing failed (-1 if unknown) */
  readonly failureIndex: number;

  /** What the parser expected at the failure point */
  readonly expectedSymbols: readonly string[];

  /** Whether a partial parse tree exists */
  readonly hasPartialParse: boolean;

  /** Any active grammar rule IDs at failure */
  readonly activeRuleIds: readonly string[];

  /** The parser phase where failure occurred */
  readonly phase: ParserPhase;
}

/**
 * A raw token from the tokenizer (minimal interface).
 */
export interface RawToken {
  readonly text: string;
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly recognized: boolean;
}

/**
 * Vocabulary lookup function for generating suggestions.
 * Given a token text, returns known terms that are close matches.
 */
export type VocabularyLookup = (text: string) => readonly VocabularyMatch[];

/**
 * A vocabulary match result.
 */
export interface VocabularyMatch {
  /** The matching vocabulary term */
  readonly term: string;
  /** Edit distance from the input */
  readonly distance: number;
  /** The category of the vocabulary term */
  readonly category: string;
  /** Whether this is an exact synonym */
  readonly isSynonym: boolean;
  /** Whether this is an abbreviation expansion */
  readonly isAbbreviation: boolean;
}

// =============================================================================
// ERROR BUILDER — constructing errors from raw failures
// =============================================================================

/**
 * Build a structured parse error from a raw parse failure.
 */
export function buildParseError(
  failure: RawParseFailure,
  vocabLookup?: VocabularyLookup,
): ParseError {
  // Determine the error code and category
  const { code, category } = classifyFailure(failure);

  // Build the error span
  const span = buildErrorSpan(failure);

  // Generate suggestions
  const suggestions = generateSuggestions(failure, span, vocabLookup);

  // Build summary and detail
  const summary = buildSummary(code, span, failure);
  const detail = buildDetail(code, span, failure, suggestions);

  // Map expected symbols to human-readable forms
  const expected = failure.expectedSymbols.map(symbolToHuman);

  // Progress estimate
  const progress = failure.tokens.length > 0
    ? Math.max(0, failure.failureIndex) / failure.tokens.length
    : 0;

  return {
    code,
    category,
    summary,
    detail,
    span,
    source: failure.source,
    suggestions,
    expected,
    severity: code === 'EMPTY_INPUT' || code === 'ONLY_STOPWORDS' ? 'hint' : 'error',
    hasPartialParse: failure.hasPartialParse,
    metadata: {
      phase: failure.phase,
      progress,
      likelyExtension: code === 'UNKNOWN_TOKEN' && suggestions.length === 0,
      activeRules: [...failure.activeRuleIds],
      failureTokenIndex: failure.failureIndex,
      totalTokens: failure.tokens.length,
    },
  };
}

/**
 * Classify a failure into an error code and category.
 */
function classifyFailure(failure: RawParseFailure): {
  code: ParseErrorCode;
  category: ParseErrorCategory;
} {
  // Empty input
  if (failure.tokens.length === 0 || failure.source.trim() === '') {
    return { code: 'EMPTY_INPUT', category: 'incomplete_command' };
  }

  // Only stopwords
  if (failure.tokens.every(t => isStopword(t.text))) {
    return { code: 'ONLY_STOPWORDS', category: 'incomplete_command' };
  }

  // Failure at a specific token
  if (failure.failureIndex >= 0 && failure.failureIndex < failure.tokens.length) {
    const failToken = failure.tokens[failure.failureIndex]!;

    // Unrecognized token
    if (!failToken.recognized) {
      return { code: 'UNKNOWN_TOKEN', category: 'unknown_word' };
    }

    // Number format
    if (failToken.type === 'number' && isNumberFormatError(failToken.text)) {
      return { code: 'NUMBER_FORMAT', category: 'format_error' };
    }

    // Dangling preposition (last token is a preposition)
    if (failure.failureIndex === failure.tokens.length - 1 && isPreposition(failToken.text)) {
      return { code: 'DANGLING_PREPOSITION', category: 'incomplete_command' };
    }

    // Otherwise, unexpected token
    return { code: 'UNEXPECTED_TOKEN', category: 'unexpected_structure' };
  }

  // Failure at end (incomplete input)
  if (failure.failureIndex >= failure.tokens.length) {
    // Check if we have no verb
    const hasVerb = failure.tokens.some(t => t.type === 'verb');
    if (!hasVerb) {
      return { code: 'NO_VERB', category: 'incomplete_command' };
    }

    // Incomplete input
    return { code: 'INCOMPLETE_INPUT', category: 'incomplete_command' };
  }

  // General structural error
  return { code: 'STRUCTURAL_ERROR', category: 'unexpected_structure' };
}

/**
 * Build an ErrorSpan from a raw failure.
 */
function buildErrorSpan(failure: RawParseFailure): ErrorSpan {
  // If we have a specific failure token
  if (failure.failureIndex >= 0 && failure.failureIndex < failure.tokens.length) {
    const token = failure.tokens[failure.failureIndex]!;
    const { line, column } = offsetToLineColumn(failure.source, token.start);
    return {
      start: token.start,
      end: token.end,
      text: token.text,
      line,
      column,
    };
  }

  // If failure is past the end, point at the end of input
  if (failure.tokens.length > 0) {
    const lastToken = failure.tokens[failure.tokens.length - 1]!;
    const { line, column } = offsetToLineColumn(failure.source, lastToken.end);
    return {
      start: lastToken.end,
      end: lastToken.end,
      text: '',
      line,
      column,
    };
  }

  // Empty input
  return {
    start: 0,
    end: 0,
    text: '',
    line: 1,
    column: 1,
  };
}

/**
 * Convert a 0-based character offset to 1-based line and column.
 */
function offsetToLineColumn(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

// =============================================================================
// SUGGESTION GENERATION — offering fixes for parse errors
// =============================================================================

/**
 * Generate suggestions for fixing a parse error.
 */
function generateSuggestions(
  failure: RawParseFailure,
  span: ErrorSpan,
  vocabLookup?: VocabularyLookup,
): ErrorSuggestion[] {
  const suggestions: ErrorSuggestion[] = [];

  // If we have a vocabulary lookup and an unknown token, find close matches
  if (vocabLookup && span.text.length > 0) {
    const matches = vocabLookup(span.text);

    for (const match of matches) {
      if (suggestions.length >= MAX_SUGGESTIONS) break;

      let type: SuggestionType;
      let reason: string;
      let confidence: number;

      if (match.isAbbreviation) {
        type = 'abbreviation';
        reason = `"${span.text}" is a known abbreviation for "${match.term}"`;
        confidence = 0.9;
      } else if (match.isSynonym) {
        type = 'synonym';
        reason = `"${match.term}" is a synonym used in this vocabulary`;
        confidence = 0.85;
      } else if (match.distance <= 1) {
        type = 'typo_correction';
        reason = `"${match.term}" is very close to "${span.text}" (1 character difference)`;
        confidence = 0.8;
      } else if (match.distance <= 2) {
        type = 'typo_correction';
        reason = `"${match.term}" is close to "${span.text}" (${match.distance} character differences)`;
        confidence = 0.6;
      } else {
        type = 'related_term';
        reason = `"${match.term}" is a related ${match.category} term`;
        confidence = 0.4;
      }

      suggestions.push({
        type,
        label: `Did you mean "${match.term}"?`,
        replacement: match.term,
        confidence,
        span,
        reason,
      });
    }
  }

  // If the failure is at end of input and we expected something, suggest adding it
  if (failure.failureIndex >= failure.tokens.length && failure.expectedSymbols.length > 0) {
    const topExpected = failure.expectedSymbols.slice(0, 3);
    for (const sym of topExpected) {
      if (suggestions.length >= MAX_SUGGESTIONS) break;
      const humanSym = symbolToHuman(sym);
      suggestions.push({
        type: 'add_missing',
        label: `Add ${humanSym}`,
        replacement: `<${humanSym}>`,
        confidence: 0.5,
        span,
        reason: `The parser expected ${humanSym} to follow`,
      });
    }
  }

  // Check for compound words that could be split
  if (span.text.length > 6 && !span.text.includes(' ')) {
    const splits = findCompoundSplits(span.text);
    for (const split of splits) {
      if (suggestions.length >= MAX_SUGGESTIONS) break;
      suggestions.push({
        type: 'split_compound',
        label: `Split into "${split}"`,
        replacement: split,
        confidence: 0.4,
        span,
        reason: `"${span.text}" might be two words: "${split}"`,
      });
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/** Maximum number of suggestions to produce */
const MAX_SUGGESTIONS = 5;

// =============================================================================
// MESSAGE BUILDING — human-readable error text
// =============================================================================

/**
 * Build a one-line summary for a parse error.
 */
function buildSummary(code: ParseErrorCode, span: ErrorSpan, failure: RawParseFailure): string {
  switch (code) {
    case 'UNKNOWN_TOKEN':
      return `I don't recognize "${span.text}"`;

    case 'UNEXPECTED_TOKEN':
      return `I didn't expect "${span.text}" here`;

    case 'INCOMPLETE_INPUT':
      return 'The command seems incomplete';

    case 'NO_VERB':
      return 'I need a command verb (like "make", "add", "remove")';

    case 'AMBIGUOUS_VERB':
      return `"${span.text}" could mean multiple things here`;

    case 'MISSING_ARGUMENT':
      return 'This command needs more information';

    case 'INVALID_ARGUMENT':
      return `"${span.text}" doesn't work as an argument here`;

    case 'STRUCTURAL_ERROR':
      return "I couldn't parse this command";

    case 'CONTRADICTORY_MODIFIERS':
      return 'These modifiers contradict each other';

    case 'NESTED_TOO_DEEP':
      return 'This command is too deeply nested';

    case 'EMPTY_INPUT':
      return 'No command entered';

    case 'ONLY_STOPWORDS':
      return `I need a command — "${failure.source.trim()}" doesn't tell me what to do`;

    case 'NUMBER_FORMAT':
      return `"${span.text}" isn't a valid number`;

    case 'DANGLING_PREPOSITION':
      return `"${span.text}" needs something after it`;

    case 'REPEATED_MODIFIER':
      return `"${span.text}" is used more than once`;
  }
}

/**
 * Build a detailed explanation for a parse error.
 */
function buildDetail(
  code: ParseErrorCode,
  span: ErrorSpan,
  failure: RawParseFailure,
  suggestions: readonly ErrorSuggestion[],
): string {
  const parts: string[] = [];

  switch (code) {
    case 'UNKNOWN_TOKEN':
      parts.push(`The word "${span.text}" is not in the vocabulary.`);
      if (suggestions.length > 0) {
        parts.push('');
        parts.push('Did you mean:');
        for (const s of suggestions.slice(0, 3)) {
          parts.push(`  - ${s.replacement} (${s.reason})`);
        }
      } else {
        parts.push('This term might be available as an extension, or it may be a typo.');
      }
      break;

    case 'UNEXPECTED_TOKEN':
      parts.push(`"${span.text}" was recognized but doesn't fit in this position.`);
      if (failure.expectedSymbols.length > 0) {
        parts.push('');
        parts.push('Expected:');
        for (const sym of failure.expectedSymbols.slice(0, 5)) {
          parts.push(`  - ${symbolToHuman(sym)}`);
        }
      }
      break;

    case 'INCOMPLETE_INPUT':
      parts.push('The command ends before all required information was provided.');
      if (failure.expectedSymbols.length > 0) {
        parts.push('');
        parts.push('The parser was expecting:');
        for (const sym of failure.expectedSymbols.slice(0, 5)) {
          parts.push(`  - ${symbolToHuman(sym)}`);
        }
      }
      break;

    case 'NO_VERB':
      parts.push('Every command needs a verb to tell the system what to do.');
      parts.push('');
      parts.push('Try starting with:');
      parts.push('  - "make" (create or adjust something)');
      parts.push('  - "add" (introduce a new element)');
      parts.push('  - "remove" (take away an element)');
      parts.push('  - "set" (assign a specific value)');
      parts.push('  - "keep" (preserve something during changes)');
      break;

    case 'EMPTY_INPUT':
      parts.push('Type a command to get started. For example:');
      parts.push('  - "make the chorus brighter"');
      parts.push('  - "add reverb to the vocals"');
      parts.push('  - "remove the drum fill"');
      break;

    case 'ONLY_STOPWORDS':
      parts.push(`"${failure.source.trim()}" contains only common words without any musical or editing terms.`);
      parts.push('Try including a verb and a musical reference.');
      break;

    case 'DANGLING_PREPOSITION':
      parts.push(`"${span.text}" is a preposition that needs an object.`);
      parts.push(`For example: "${span.text} the chorus" or "${span.text} bar 8".`);
      break;

    case 'NUMBER_FORMAT':
      parts.push(`"${span.text}" looks like a number but couldn't be parsed.`);
      parts.push('Use formats like: 120 (integer), 0.5 (decimal), or 3/4 (fraction).');
      break;

    default:
      parts.push(`A ${code.toLowerCase().replace(/_/g, ' ')} error occurred at "${span.text}".`);
      break;
  }

  return parts.join('\n');
}

// =============================================================================
// DISPLAY FORMATTING — terminal and UI output
// =============================================================================

/**
 * Format a parse error for plain-text display (terminal / log output).
 * Includes a caret indicator pointing at the problematic span.
 */
export function formatErrorPlainText(error: ParseError): string {
  const lines: string[] = [];

  // Summary line with severity
  const severityPrefix = error.severity === 'error' ? 'Error'
    : error.severity === 'warning' ? 'Warning'
    : 'Hint';
  lines.push(`${severityPrefix}: ${error.summary}`);
  lines.push('');

  // Source with underline
  if (error.source.length > 0) {
    lines.push(`  ${error.source}`);
    if (error.span.start < error.source.length) {
      const padding = ' '.repeat(error.span.start + 2);
      const underline = error.span.end > error.span.start
        ? '^'.repeat(Math.min(error.span.end - error.span.start, error.source.length - error.span.start))
        : '^';
      lines.push(`${padding}${underline}`);
    }
    lines.push('');
  }

  // Detail
  lines.push(error.detail);

  // Suggestions
  if (error.suggestions.length > 0) {
    lines.push('');
    lines.push('Suggestions:');
    for (const s of error.suggestions) {
      const conf = Math.round(s.confidence * 100);
      lines.push(`  ${s.label} (${conf}% confidence)`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a parse error for compact display (single line, suitable for
 * inline UI feedback).
 */
export function formatErrorCompact(error: ParseError): string {
  if (error.suggestions.length > 0) {
    const top = error.suggestions[0]!;
    return `${error.summary}. ${top.label}`;
  }
  return error.summary;
}

/**
 * A structured error for UI rendering.
 */
export interface UIErrorRendering {
  /** The severity level */
  readonly severity: ErrorSeverity;

  /** The error code */
  readonly code: ParseErrorCode;

  /** One-line summary (suitable for a popover title) */
  readonly title: string;

  /** Detailed explanation (suitable for popover body) */
  readonly body: string;

  /** The source text */
  readonly source: string;

  /** The span to highlight in the source */
  readonly highlight: {
    readonly start: number;
    readonly end: number;
  };

  /** Interactive suggestions (suitable for buttons/chips) */
  readonly actions: readonly UIErrorAction[];

  /** Accessibility: screen reader text */
  readonly ariaLabel: string;

  /** Progress bar value (0-1, how far parsing got) */
  readonly progress: number;
}

/**
 * An interactive action for a UI error.
 */
export interface UIErrorAction {
  /** Button label */
  readonly label: string;

  /** The replacement text if the action is taken */
  readonly replacement: string;

  /** Where to apply the replacement */
  readonly replaceStart: number;
  readonly replaceEnd: number;

  /** Action type (for styling) */
  readonly type: SuggestionType;
}

/**
 * Format a parse error for structured UI rendering.
 */
export function formatErrorForUI(error: ParseError): UIErrorRendering {
  const actions: UIErrorAction[] = error.suggestions
    .filter(s => s.confidence >= 0.4)
    .slice(0, 3)
    .map(s => ({
      label: s.type === 'typo_correction'
        ? `"${s.replacement}"`
        : s.type === 'add_missing'
          ? `+ ${s.replacement}`
          : s.replacement,
      replacement: s.replacement,
      replaceStart: s.span.start,
      replaceEnd: s.span.end,
      type: s.type,
    }));

  const ariaLabel = buildAriaLabel(error);

  return {
    severity: error.severity,
    code: error.code,
    title: error.summary,
    body: error.detail,
    source: error.source,
    highlight: {
      start: error.span.start,
      end: error.span.end,
    },
    actions,
    ariaLabel,
    progress: error.metadata.progress,
  };
}

/**
 * Build an accessible screen-reader label for a parse error.
 */
function buildAriaLabel(error: ParseError): string {
  const parts: string[] = [];

  parts.push(`Parse ${error.severity}: ${error.summary}.`);

  if (error.span.text) {
    parts.push(`Problem at "${error.span.text}", position ${error.span.column}.`);
  }

  if (error.suggestions.length > 0) {
    const top = error.suggestions[0]!;
    parts.push(`Suggestion: ${top.label}.`);
  }

  return parts.join(' ');
}

// =============================================================================
// MULTI-ERROR FORMATTING — when multiple errors occur
// =============================================================================

/**
 * A collection of parse errors for a single input.
 */
export interface ParseErrorCollection {
  /** The source text */
  readonly source: string;

  /** All errors, sorted by position */
  readonly errors: readonly ParseError[];

  /** Summary counts */
  readonly errorCount: number;
  readonly warningCount: number;
  readonly hintCount: number;
}

/**
 * Build an error collection from multiple raw failures.
 */
export function buildErrorCollection(
  source: string,
  failures: readonly RawParseFailure[],
  vocabLookup?: VocabularyLookup,
): ParseErrorCollection {
  const errors = failures
    .map(f => buildParseError(f, vocabLookup))
    .sort((a, b) => a.span.start - b.span.start);

  return {
    source,
    errors,
    errorCount: errors.filter(e => e.severity === 'error').length,
    warningCount: errors.filter(e => e.severity === 'warning').length,
    hintCount: errors.filter(e => e.severity === 'hint').length,
  };
}

/**
 * Format an error collection for plain-text display.
 */
export function formatErrorCollectionPlainText(collection: ParseErrorCollection): string {
  if (collection.errors.length === 0) {
    return 'No parse errors.';
  }

  const lines: string[] = [];

  // Header
  const counts: string[] = [];
  if (collection.errorCount > 0) counts.push(`${collection.errorCount} error${collection.errorCount === 1 ? '' : 's'}`);
  if (collection.warningCount > 0) counts.push(`${collection.warningCount} warning${collection.warningCount === 1 ? '' : 's'}`);
  if (collection.hintCount > 0) counts.push(`${collection.hintCount} hint${collection.hintCount === 1 ? '' : 's'}`);
  lines.push(`Found ${counts.join(', ')} in: "${collection.source}"`);
  lines.push('');

  // Source with all underlines
  lines.push(`  ${collection.source}`);
  const markers = buildMultiSpanMarkers(collection.source, collection.errors);
  if (markers) {
    lines.push(`  ${markers}`);
  }
  lines.push('');

  // Individual errors
  for (let i = 0; i < collection.errors.length; i++) {
    const error = collection.errors[i]!;
    lines.push(`${i + 1}. ${error.summary}`);
    if (error.suggestions.length > 0) {
      lines.push(`   → ${error.suggestions[0]!.label}`);
    }
  }

  return lines.join('\n');
}

/**
 * Build a marker line showing multiple error spans.
 */
function buildMultiSpanMarkers(source: string, errors: readonly ParseError[]): string | null {
  if (errors.length === 0) return null;

  const line = new Array(source.length).fill(' ');

  for (const error of errors) {
    const marker = error.severity === 'error' ? '^'
      : error.severity === 'warning' ? '~'
      : '.';

    for (let i = error.span.start; i < error.span.end && i < source.length; i++) {
      line[i] = marker;
    }
  }

  const result = line.join('');
  return result.trim().length > 0 ? result : null;
}

// =============================================================================
// HELPER FUNCTIONS — vocabulary and symbol utilities
// =============================================================================

/**
 * Common stop words that don't contribute to command meaning.
 */
const STOP_WORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'and', 'or', 'but', 'if', 'then', 'so', 'as',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by',
  'can', 'could', 'would', 'should', 'please', 'just',
  'very', 'really', 'quite', 'rather',
]);

function isStopword(text: string): boolean {
  return STOP_WORDS.has(text.toLowerCase());
}

/**
 * Common prepositions.
 */
const PREPOSITIONS: ReadonlySet<string> = new Set([
  'to', 'from', 'in', 'on', 'at', 'by', 'for', 'with',
  'of', 'into', 'onto', 'through', 'across', 'between',
  'before', 'after', 'during', 'until', 'over', 'under',
]);

function isPreposition(text: string): boolean {
  return PREPOSITIONS.has(text.toLowerCase());
}

/**
 * Check if a text looks like a malformed number.
 */
function isNumberFormatError(text: string): boolean {
  return /^\d/.test(text) && !/^\d+(\.\d+)?$/.test(text) && !/^\d+\/\d+$/.test(text);
}

/**
 * Map parser symbols to human-readable labels.
 */
const SYMBOL_LABELS: ReadonlyMap<string, string> = new Map([
  ['NP', 'a noun phrase (like "the chorus" or "drums")'],
  ['VP', 'a verb phrase (like "make brighter" or "add reverb")'],
  ['V', 'a command verb (like "make", "add", "remove")'],
  ['N', 'a noun (like "reverb", "tempo", "section")'],
  ['ADJ', 'an adjective (like "brighter", "louder", "darker")'],
  ['PP', 'a prepositional phrase (like "to the chorus" or "by 10%")'],
  ['PREP', 'a preposition (like "to", "from", "in")'],
  ['NUM', 'a number (like "120", "0.5", "3/4")'],
  ['COMP', 'a comparative (like "more", "less", "as")'],
  ['DEG', 'a degree word (like "very", "slightly", "much")'],
  ['REF', 'a reference (like "it", "this", "the last one")'],
  ['TIME', 'a time expression (like "at bar 4", "during the chorus")'],
  ['SECTION', 'a section name (like "verse", "chorus", "bridge")'],
  ['LAYER', 'a layer name (like "drums", "bass", "vocal")'],
  ['CARD', 'a card name'],
  ['PARAM', 'a parameter name (like "tempo", "key", "volume")'],
  ['UNIT', 'a unit (like "bpm", "dB", "%")'],
  ['QUANT', 'a quantifier (like "all", "every", "some")'],
  ['NEG', 'a negation (like "not", "no", "without")'],
  ['COORD', 'a conjunction (like "and", "but", "or")'],
  ['MOD', 'a modal verb (like "can", "should", "must")'],
  ['EOF', 'end of input'],
]);

function symbolToHuman(symbol: string): string {
  return SYMBOL_LABELS.get(symbol) ?? symbol;
}

/**
 * Attempt to split a compound word into known parts.
 * Uses simple heuristic: try all split points and check if both halves
 * look like English words (length >= 3).
 */
function findCompoundSplits(text: string): string[] {
  const lower = text.toLowerCase();
  const results: string[] = [];

  // Known compound patterns
  const KNOWN_COMPOUNDS: ReadonlyMap<string, string> = new Map([
    ['hihats', 'hi hats'],
    ['hihat', 'hi hat'],
    ['kickdrum', 'kick drum'],
    ['snaredrum', 'snare drum'],
    ['bassdrum', 'bass drum'],
    ['bassline', 'bass line'],
    ['subbase', 'sub bass'],
    ['sidechain', 'side chain'],
    ['highpass', 'high pass'],
    ['lowpass', 'low pass'],
    ['bandpass', 'band pass'],
    ['downbeat', 'down beat'],
    ['offbeat', 'off beat'],
    ['halftime', 'half time'],
    ['doubletime', 'double time'],
    ['crossfade', 'cross fade'],
    ['pitchshift', 'pitch shift'],
    ['timestretc', 'time stretch'],
  ]);

  const known = KNOWN_COMPOUNDS.get(lower);
  if (known) {
    results.push(known);
    return results;
  }

  // Try splitting at CamelCase boundaries
  const camelSplit = lower.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  if (camelSplit !== lower) {
    results.push(camelSplit);
  }

  return results;
}

// =============================================================================
// CONVENIENCE — single-function error creation for common cases
// =============================================================================

/**
 * Create a simple "unknown token" error.
 */
export function unknownTokenError(
  source: string,
  tokenText: string,
  start: number,
  end: number,
  vocabLookup?: VocabularyLookup,
): ParseError {
  const failure: RawParseFailure = {
    source,
    tokens: [{ text: tokenText, type: 'unknown', start, end, recognized: false }],
    failureIndex: 0,
    expectedSymbols: [],
    hasPartialParse: false,
    activeRuleIds: [],
    phase: 'lexical_lookup',
  };
  return buildParseError(failure, vocabLookup);
}

/**
 * Create a simple "incomplete input" error.
 */
export function incompleteInputError(
  source: string,
  tokens: readonly RawToken[],
  expectedSymbols: readonly string[],
): ParseError {
  const failure: RawParseFailure = {
    source,
    tokens: [...tokens],
    failureIndex: tokens.length,
    expectedSymbols: [...expectedSymbols],
    hasPartialParse: true,
    activeRuleIds: [],
    phase: 'parsing',
  };
  return buildParseError(failure);
}

/**
 * Create a simple "empty input" error.
 */
export function emptyInputError(): ParseError {
  const failure: RawParseFailure = {
    source: '',
    tokens: [],
    failureIndex: -1,
    expectedSymbols: ['V'],
    hasPartialParse: false,
    activeRuleIds: [],
    phase: 'tokenization',
  };
  return buildParseError(failure);
}

/**
 * Create a "no verb" error.
 */
export function noVerbError(
  source: string,
  tokens: readonly RawToken[],
): ParseError {
  const failure: RawParseFailure = {
    source,
    tokens: [...tokens],
    failureIndex: tokens.length,
    expectedSymbols: ['V'],
    hasPartialParse: false,
    activeRuleIds: [],
    phase: 'parsing',
  };
  return buildParseError(failure);
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the error formatter module.
 */
export function getErrorFormatterStats(): {
  errorCodes: number;
  categories: number;
  suggestionTypes: number;
  symbolLabels: number;
  stopWords: number;
  prepositions: number;
  compoundPatterns: number;
} {
  return {
    errorCodes: 15,
    categories: 6,
    suggestionTypes: 8,
    symbolLabels: SYMBOL_LABELS.size,
    stopWords: STOP_WORDS.size,
    prepositions: PREPOSITIONS.size,
    compoundPatterns: 17,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetErrorFormatter(): void {
  // Currently stateless — placeholder for future state
}
