/**
 * GOFAI NL Grammar — Unknown Token Strategy
 *
 * Implements a robust "unknown token" strategy that preserves unknown
 * terms as candidate entity names rather than failing parsing.
 *
 * ## Design Principles
 *
 * 1. **Never fail on unknown words**: Unknown tokens become candidate
 *    entity names (tracks, cards, sections, user-defined labels).
 * 2. **Preserve original spans**: Unknown tokens retain their span
 *    information for error recovery and UI highlighting.
 * 3. **Score candidates**: Multiple interpretations of an unknown token
 *    are scored by context (e.g., "808" after "add" is likely a drum
 *    machine reference, not a number).
 * 4. **Fuzzy matching**: Unknown tokens are compared against known
 *    vocabulary using edit distance and phonetic similarity.
 * 5. **User intent preservation**: If the user typed something unknown,
 *    they probably meant something specific — preserve it.
 *
 * ## Unknown Token Categories
 *
 * Unknown tokens are classified into candidate categories:
 * - **entity_name**: Likely a track name, section label, or card name
 * - **proper_noun**: Likely a proper noun (capitalized, quoted)
 * - **typo**: Likely a misspelling of a known term
 * - **numeric_id**: A number used as an identifier (e.g., "808")
 * - **foreign_term**: A term from a non-English music tradition
 * - **abbreviation**: An abbreviation or acronym
 * - **genuinely_unknown**: No good guess — flag for clarification
 *
 * @module gofai/nl/grammar/unknown-tokens
 * @see gofai_goalA.md Step 126
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// UNKNOWN TOKEN TYPES
// =============================================================================

/**
 * An unknown token that could not be matched to any known vocabulary.
 */
export interface UnknownToken {
  /** The original text of the unknown token */
  readonly text: string;

  /** Span in the original input */
  readonly span: Span;

  /** Index in the token array */
  readonly tokenIndex: number;

  /** Best-guess category */
  readonly category: UnknownTokenCategory;

  /** Candidate interpretations, scored */
  readonly candidates: readonly UnknownTokenCandidate[];

  /** Context clues that informed the categorization */
  readonly contextClues: readonly ContextClue[];

  /** Confidence that this was correctly categorized (0-1) */
  readonly confidence: number;

  /** Whether this token should trigger a clarification question */
  readonly needsClarification: boolean;
}

/**
 * Categories for unknown tokens.
 */
export type UnknownTokenCategory =
  | 'entity_name'       // Likely a user-defined entity name
  | 'proper_noun'       // Likely a proper noun (song name, artist, etc.)
  | 'typo'              // Likely a misspelling of a known term
  | 'numeric_id'        // A number used as an identifier
  | 'foreign_term'      // A non-English music term
  | 'abbreviation'      // An abbreviation or acronym
  | 'compound'          // A compound word that should be split
  | 'genuinely_unknown'; // No good guess

/**
 * A candidate interpretation of an unknown token.
 */
export interface UnknownTokenCandidate {
  /** The suggested interpretation */
  readonly interpretation: string;

  /** What kind of entity this would be */
  readonly entityType: CandidateEntityType;

  /** Score (0-1, higher = more likely) */
  readonly score: number;

  /** How this candidate was derived */
  readonly derivation: CandidateDerivation;

  /** The known vocabulary term this is closest to (if typo) */
  readonly nearestKnown: string | null;

  /** Edit distance to nearest known (if applicable) */
  readonly editDistance: number | null;
}

/**
 * Entity types that an unknown token might refer to.
 */
export type CandidateEntityType =
  | 'track_name'        // "Glass Pad", "808 Kick"
  | 'section_label'     // "Chorus A", "Drop 2"
  | 'card_name'         // A card in the project
  | 'instrument_name'   // An instrument not in vocabulary
  | 'effect_name'       // An effect not in vocabulary
  | 'plugin_name'       // A plugin name
  | 'genre_term'        // A genre not in vocabulary
  | 'technique_term'    // A technique not in vocabulary
  | 'general_noun'      // Some noun we don't recognize
  | 'unknown';          // Truly unknown

/**
 * How a candidate interpretation was derived.
 */
export type CandidateDerivation =
  | 'exact_project_match'   // Matched a project entity exactly
  | 'fuzzy_project_match'   // Fuzzy-matched a project entity
  | 'fuzzy_vocab_match'     // Fuzzy-matched a vocabulary term
  | 'phonetic_match'        // Matched phonetically
  | 'abbreviation_expand'   // Expanded an abbreviation
  | 'compound_split'        // Split a compound word
  | 'context_inference'     // Inferred from surrounding context
  | 'capitalization_hint'   // Capitalization suggests proper noun
  | 'quote_hint'            // Quotes suggest user-defined name
  | 'no_match';             // No match found

/**
 * A context clue used for categorization.
 */
export interface ContextClue {
  /** What kind of clue */
  readonly type: ContextClueType;

  /** Description of the clue */
  readonly description: string;

  /** How much this influenced the categorization (0-1) */
  readonly weight: number;
}

/**
 * Types of context clues.
 */
export type ContextClueType =
  | 'preceding_token'    // What came before (e.g., "the" → likely noun)
  | 'following_token'    // What comes after
  | 'capitalization'     // Initial caps, all caps, etc.
  | 'quotation'          // In quotes
  | 'position'           // Position in the sentence
  | 'verb_frame'         // Expected argument type from verb
  | 'numeric_context'    // Contains or is near numbers
  | 'punctuation';       // Hyphens, apostrophes, etc.

// =============================================================================
// UNKNOWN TOKEN RESOLUTION RESULT
// =============================================================================

/**
 * Result of processing unknown tokens in a token stream.
 */
export interface UnknownTokenResult {
  /** All unknown tokens found */
  readonly unknowns: readonly UnknownToken[];

  /** Token indices that are unknown */
  readonly unknownIndices: ReadonlySet<number>;

  /** Suggestions for the user (if any) */
  readonly suggestions: readonly UnknownTokenSuggestion[];

  /** Whether any unknowns need clarification before parsing can continue */
  readonly blocksParsing: boolean;

  /** Diagnostics */
  readonly diagnostics: readonly string[];
}

/**
 * A suggestion for resolving an unknown token.
 */
export interface UnknownTokenSuggestion {
  /** The unknown token this suggestion is for */
  readonly forToken: string;

  /** Token span */
  readonly span: Span;

  /** Suggested replacement or interpretation */
  readonly suggestion: string;

  /** Why this suggestion was made */
  readonly reason: string;

  /** Confidence (0-1) */
  readonly confidence: number;
}

// =============================================================================
// KNOWN VOCABULARY SET — what we recognize
// =============================================================================

/**
 * A set of known vocabulary terms for matching against.
 * This is populated from all canon vocabulary tables.
 */
export interface KnownVocabulary {
  /** All known terms (lowercase) → category */
  readonly terms: ReadonlyMap<string, string>;

  /** All known entity names from the current project */
  readonly projectEntities: ReadonlyMap<string, CandidateEntityType>;

  /** Common abbreviations */
  readonly abbreviations: ReadonlyMap<string, string>;
}

/**
 * Create an empty known vocabulary set.
 */
export function createEmptyVocabulary(): KnownVocabulary {
  return {
    terms: new Map(),
    projectEntities: new Map(),
    abbreviations: new Map(),
  };
}

/**
 * Common music abbreviations that should be expanded.
 */
export const COMMON_ABBREVIATIONS: ReadonlyMap<string, string> = new Map([
  ['bpm', 'beats per minute'],
  ['db', 'decibels'],
  ['eq', 'equalization'],
  ['fx', 'effects'],
  ['hpf', 'high-pass filter'],
  ['lpf', 'low-pass filter'],
  ['lfo', 'low frequency oscillator'],
  ['midi', 'musical instrument digital interface'],
  ['daw', 'digital audio workstation'],
  ['vst', 'virtual studio technology'],
  ['aux', 'auxiliary'],
  ['vca', 'voltage controlled amplifier'],
  ['vcf', 'voltage controlled filter'],
  ['vco', 'voltage controlled oscillator'],
  ['adsr', 'attack decay sustain release'],
  ['sc', 'sidechain'],
  ['ms', 'mid-side'],
  ['lr', 'left-right'],
  ['rev', 'reverb'],
  ['comp', 'compressor'],
  ['dist', 'distortion'],
  ['od', 'overdrive'],
  ['phz', 'phaser'],
  ['flg', 'flanger'],
  ['cho', 'chorus'],
  ['dly', 'delay'],
  ['oct', 'octave'],
  ['vel', 'velocity'],
  ['mod', 'modulation'],
  ['pb', 'pitch bend'],
  ['cc', 'control change'],
  ['pgm', 'program change'],
  ['sus', 'sustain'],
  ['syn', 'synthesizer'],
  ['kbd', 'keyboard'],
  ['gtr', 'guitar'],
  ['drm', 'drums'],
  ['vox', 'vocals'],
  ['perc', 'percussion'],
  ['str', 'strings'],
  ['brss', 'brass'],
  ['ww', 'woodwinds'],
  ['orch', 'orchestra'],
  ['arr', 'arrangement'],
  ['intro', 'introduction'],
  ['brdg', 'bridge'],
  ['prechorus', 'pre-chorus'],
  ['vrs', 'verse'],
  ['crs', 'chorus'],
]);

// =============================================================================
// EDIT DISTANCE — for typo detection
// =============================================================================

/**
 * Compute the Levenshtein edit distance between two strings.
 */
export function editDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use two-row optimization
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);

  for (let j = 0; j <= lb; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb] ?? 0;
}

/**
 * Compute normalized edit distance (0-1, lower = more similar).
 */
export function normalizedEditDistance(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return editDistance(a, b) / maxLen;
}

// =============================================================================
// SCAN FUNCTION — find and categorize unknown tokens
// =============================================================================

/**
 * Scan a token stream and identify unknown tokens.
 *
 * @param tokens - The tokenized input
 * @param spans - Span positions for each token
 * @param knownIndices - Indices already claimed by other grammar modules
 * @param vocabulary - Known vocabulary to match against
 */
export function scanForUnknownTokens(
  tokens: readonly string[],
  spans: readonly Span[],
  knownIndices: ReadonlySet<number>,
  vocabulary: KnownVocabulary
): UnknownTokenResult {
  const unknowns: UnknownToken[] = [];
  const unknownIndices = new Set<number>();
  const suggestions: UnknownTokenSuggestion[] = [];
  const diagnostics: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    // Skip already-claimed tokens
    if (knownIndices.has(i)) continue;

    const token = tokens[i] ?? '';
    const span = spans[i] ?? { start: 0, end: 0 };

    // Check if known
    if (isKnownToken(token, vocabulary)) continue;

    // Skip common function words and punctuation
    if (isFunctionWord(token)) continue;

    // Categorize the unknown token
    const contextClues = gatherContextClues(tokens, i);
    const category = categorizeUnknown(token, contextClues, vocabulary);
    const candidates = generateCandidates(token, vocabulary, contextClues);

    const unknown: UnknownToken = {
      text: token,
      span,
      tokenIndex: i,
      category,
      candidates,
      contextClues,
      confidence: computeUnknownConfidence(category, candidates),
      needsClarification: category === 'genuinely_unknown' && candidates.length === 0,
    };

    unknowns.push(unknown);
    unknownIndices.add(i);

    // Generate suggestion if we have a good candidate
    if (candidates.length > 0 && candidates[0]!.score >= 0.6) {
      const best = candidates[0]!;
      suggestions.push({
        forToken: token,
        span,
        suggestion: best.interpretation,
        reason: describeCandidateDerivation(best.derivation),
        confidence: best.score,
      });
    }
  }

  const blocksParsing = unknowns.some(
    u => u.needsClarification && u.category === 'genuinely_unknown'
  );

  if (unknowns.length > 0) {
    diagnostics.push(`Found ${unknowns.length} unknown token(s)`);
  }

  return { unknowns, unknownIndices, suggestions, blocksParsing, diagnostics };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a token is known in the vocabulary.
 */
function isKnownToken(token: string, vocabulary: KnownVocabulary): boolean {
  const lower = token.toLowerCase();
  return vocabulary.terms.has(lower) || vocabulary.projectEntities.has(lower);
}

/**
 * Check if a token is a common function word (articles, prepositions, etc.).
 */
function isFunctionWord(token: string): boolean {
  const functionWords = new Set([
    'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'can', 'may', 'might', 'shall', 'must',
    'and', 'or', 'but', 'not', 'no', 'if', 'then', 'so', 'that',
    'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my',
    'you', 'your', 'we', 'our', 'they', 'them', 'their',
    'what', 'which', 'who', 'how', 'when', 'where', 'why',
    'up', 'down', 'out', 'off', 'over', 'under', 'into',
    'more', 'less', 'much', 'many', 'some', 'any', 'every',
    'all', 'each', 'both', 'few', 'several', 'most',
    'very', 'too', 'quite', 'rather', 'pretty', 'really',
  ]);

  return functionWords.has(token.toLowerCase());
}

/**
 * Gather context clues from surrounding tokens.
 */
function gatherContextClues(
  tokens: readonly string[],
  index: number
): ContextClue[] {
  const clues: ContextClue[] = [];
  const token = tokens[index] ?? '';

  // Capitalization clue
  if (token.length > 0 && token[0] === token[0]!.toUpperCase() && token[0] !== token[0]!.toLowerCase()) {
    if (index > 0) {
      // Not at start of sentence — likely a proper noun
      clues.push({
        type: 'capitalization',
        description: `"${token}" is capitalized mid-sentence — likely proper noun`,
        weight: 0.7,
      });
    }
  }

  // All caps
  if (token === token.toUpperCase() && token.length > 1 && /^[A-Z]+$/.test(token)) {
    clues.push({
      type: 'capitalization',
      description: `"${token}" is all-caps — likely abbreviation`,
      weight: 0.8,
    });
  }

  // Preceding token clue
  if (index > 0) {
    const prev = (tokens[index - 1] ?? '').toLowerCase();
    if (['the', 'a', 'an', 'my', 'your', 'our', 'this', 'that'].includes(prev)) {
      clues.push({
        type: 'preceding_token',
        description: `Preceded by determiner "${prev}" — likely noun/entity`,
        weight: 0.6,
      });
    }
    if (['on', 'in', 'at', 'to', 'from'].includes(prev)) {
      clues.push({
        type: 'preceding_token',
        description: `Preceded by preposition "${prev}" — likely entity reference`,
        weight: 0.5,
      });
    }
  }

  // Following token clue
  if (index < tokens.length - 1) {
    const next = (tokens[index + 1] ?? '').toLowerCase();
    if (['track', 'channel', 'bus', 'part', 'line', 'section'].includes(next)) {
      clues.push({
        type: 'following_token',
        description: `Followed by "${next}" — likely a name for that entity type`,
        weight: 0.8,
      });
    }
  }

  // Contains numbers
  if (/\d/.test(token)) {
    clues.push({
      type: 'numeric_context',
      description: `"${token}" contains digits — possibly a numeric identifier or model number`,
      weight: 0.5,
    });
  }

  // Contains hyphens
  if (token.includes('-')) {
    clues.push({
      type: 'punctuation',
      description: `"${token}" contains hyphens — possibly compound word`,
      weight: 0.4,
    });
  }

  return clues;
}

/**
 * Categorize an unknown token.
 */
function categorizeUnknown(
  token: string,
  clues: readonly ContextClue[],
  vocabulary: KnownVocabulary
): UnknownTokenCategory {
  const lower = token.toLowerCase();

  // Check for abbreviation
  if (COMMON_ABBREVIATIONS.has(lower) || vocabulary.abbreviations.has(lower)) {
    return 'abbreviation';
  }

  // All-caps short tokens → abbreviation
  if (/^[A-Z]{2,6}$/.test(token)) {
    return 'abbreviation';
  }

  // Contains numbers and letters → numeric_id
  if (/\d/.test(token) && /[a-zA-Z]/.test(token)) {
    return 'numeric_id';
  }

  // Capitalized mid-sentence → likely proper noun or entity name
  const hasCapClue = clues.some(c => c.type === 'capitalization' && c.weight >= 0.7);
  if (hasCapClue) {
    return 'proper_noun';
  }

  // Preceded by determiner and followed by entity type word → entity name
  const hasDetClue = clues.some(c => c.type === 'preceding_token' && c.weight >= 0.6);
  const hasFollowClue = clues.some(c => c.type === 'following_token' && c.weight >= 0.8);
  if (hasDetClue || hasFollowClue) {
    return 'entity_name';
  }

  // Check for close fuzzy match → typo
  const closestMatch = findClosestVocabMatch(token, vocabulary);
  if (closestMatch && closestMatch.distance <= 2 && token.length > 3) {
    return 'typo';
  }

  // Compound word check
  if (token.includes('-') || (token.length > 8 && canSplitCompound(token, vocabulary))) {
    return 'compound';
  }

  // If it has non-ASCII characters → possibly foreign term
  if (/[^\x00-\x7F]/.test(token)) {
    return 'foreign_term';
  }

  return 'genuinely_unknown';
}

/**
 * Find the closest vocabulary match for a token.
 */
function findClosestVocabMatch(
  token: string,
  vocabulary: KnownVocabulary
): { term: string; distance: number } | null {
  const lower = token.toLowerCase();
  let closest: { term: string; distance: number } | null = null;

  for (const [term] of vocabulary.terms) {
    // Only compare tokens of similar length
    if (Math.abs(term.length - lower.length) > 3) continue;

    const dist = editDistance(lower, term);
    if (!closest || dist < closest.distance) {
      closest = { term, distance: dist };
    }

    // Early exit if exact-ish match found
    if (dist <= 1) break;
  }

  return closest;
}

/**
 * Check if a token can be split into known compound parts.
 */
function canSplitCompound(token: string, vocabulary: KnownVocabulary): boolean {
  const lower = token.toLowerCase();
  // Try splitting at each position
  for (let i = 2; i < lower.length - 2; i++) {
    const left = lower.substring(0, i);
    const right = lower.substring(i);
    if (vocabulary.terms.has(left) && vocabulary.terms.has(right)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate candidate interpretations for an unknown token.
 */
function generateCandidates(
  token: string,
  vocabulary: KnownVocabulary,
  clues: readonly ContextClue[]
): UnknownTokenCandidate[] {
  const candidates: UnknownTokenCandidate[] = [];
  const lower = token.toLowerCase();

  // 1. Check abbreviation expansion
  const abbrevExpansion = COMMON_ABBREVIATIONS.get(lower) ?? vocabulary.abbreviations.get(lower);
  if (abbrevExpansion) {
    candidates.push({
      interpretation: abbrevExpansion,
      entityType: 'general_noun',
      score: 0.9,
      derivation: 'abbreviation_expand',
      nearestKnown: abbrevExpansion,
      editDistance: 0,
    });
  }

  // 2. Check project entities
  for (const [name, entityType] of vocabulary.projectEntities) {
    const dist = editDistance(lower, name.toLowerCase());
    const maxLen = Math.max(lower.length, name.length);
    const normalized = maxLen > 0 ? dist / maxLen : 0;

    if (normalized < 0.3) {
      candidates.push({
        interpretation: name,
        entityType,
        score: 1.0 - normalized,
        derivation: dist === 0 ? 'exact_project_match' : 'fuzzy_project_match',
        nearestKnown: name,
        editDistance: dist,
      });
    }
  }

  // 3. Check fuzzy vocabulary match
  const closest = findClosestVocabMatch(token, vocabulary);
  if (closest && closest.distance <= 2) {
    const maxLen = Math.max(lower.length, closest.term.length);
    candidates.push({
      interpretation: closest.term,
      entityType: 'general_noun',
      score: 1.0 - (closest.distance / maxLen),
      derivation: 'fuzzy_vocab_match',
      nearestKnown: closest.term,
      editDistance: closest.distance,
    });
  }

  // 4. Context-based entity name inference
  const hasEntityClue = clues.some(
    c => (c.type === 'preceding_token' || c.type === 'following_token') && c.weight >= 0.6
  );
  if (hasEntityClue) {
    const entityType = inferEntityTypeFromContext(clues);
    candidates.push({
      interpretation: token,
      entityType,
      score: 0.5,
      derivation: 'context_inference',
      nearestKnown: null,
      editDistance: null,
    });
  }

  // 5. Capitalization-based proper noun
  if (clues.some(c => c.type === 'capitalization')) {
    candidates.push({
      interpretation: token,
      entityType: 'track_name',
      score: 0.4,
      derivation: 'capitalization_hint',
      nearestKnown: null,
      editDistance: null,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

/**
 * Infer entity type from context clues.
 */
function inferEntityTypeFromContext(clues: readonly ContextClue[]): CandidateEntityType {
  for (const clue of clues) {
    if (clue.type === 'following_token') {
      if (clue.description.includes('track') || clue.description.includes('channel')) {
        return 'track_name';
      }
      if (clue.description.includes('section')) {
        return 'section_label';
      }
    }
  }
  return 'general_noun';
}

/**
 * Compute confidence in the unknown token categorization.
 */
function computeUnknownConfidence(
  category: UnknownTokenCategory,
  candidates: readonly UnknownTokenCandidate[]
): number {
  const categoryConfidence: Record<UnknownTokenCategory, number> = {
    'entity_name': 0.6,
    'proper_noun': 0.7,
    'typo': 0.8,
    'numeric_id': 0.85,
    'foreign_term': 0.5,
    'abbreviation': 0.9,
    'compound': 0.65,
    'genuinely_unknown': 0.3,
  };

  let confidence = categoryConfidence[category] ?? 0.3;

  // Boost if we have good candidates
  if (candidates.length > 0 && candidates[0]!.score >= 0.8) {
    confidence = Math.min(1.0, confidence + 0.1);
  }

  return confidence;
}

/**
 * Describe a candidate derivation method in natural language.
 */
function describeCandidateDerivation(derivation: CandidateDerivation): string {
  switch (derivation) {
    case 'exact_project_match':
      return 'Exact match to a project entity';
    case 'fuzzy_project_match':
      return 'Similar to a project entity';
    case 'fuzzy_vocab_match':
      return 'Similar to a known vocabulary term';
    case 'phonetic_match':
      return 'Sounds similar to a known term';
    case 'abbreviation_expand':
      return 'Expanded from known abbreviation';
    case 'compound_split':
      return 'Split into known component words';
    case 'context_inference':
      return 'Inferred from surrounding context';
    case 'capitalization_hint':
      return 'Capitalization suggests a name';
    case 'quote_hint':
      return 'Quotation marks suggest a user-defined name';
    case 'no_match':
      return 'No matching interpretation found';
  }
}

// =============================================================================
// FORMATTING — human-readable descriptions
// =============================================================================

/**
 * Format an unknown token for display.
 */
export function formatUnknownToken(unknown: UnknownToken): string {
  const parts = [`[${unknown.category}] "${unknown.text}"`];

  if (unknown.candidates.length > 0) {
    const best = unknown.candidates[0]!;
    parts.push(`→ maybe "${best.interpretation}" (${(best.score * 100).toFixed(0)}%)`);
  }

  if (unknown.needsClarification) {
    parts.push('⚠ needs clarification');
  }

  return parts.join(' ');
}

/**
 * Format a suggestion for the user.
 */
export function formatSuggestion(suggestion: UnknownTokenSuggestion): string {
  return `Did you mean "${suggestion.suggestion}"? (${suggestion.reason})`;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the unknown token module.
 */
export function getUnknownTokenStats(): {
  abbreviationCount: number;
  categoryDescriptions: Record<UnknownTokenCategory, string>;
} {
  return {
    abbreviationCount: COMMON_ABBREVIATIONS.size,
    categoryDescriptions: {
      'entity_name': 'User-defined entity name (track, section, card)',
      'proper_noun': 'Proper noun (song, artist, plugin name)',
      'typo': 'Likely misspelling of a known vocabulary term',
      'numeric_id': 'Number used as an identifier (e.g., "808")',
      'foreign_term': 'Non-English music term',
      'abbreviation': 'Abbreviation or acronym',
      'compound': 'Compound word that should be split',
      'genuinely_unknown': 'No good guess — flag for user clarification',
    },
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset the unknown token module (no-op, stateless).
 */
export function resetUnknownTokenModule(): void {
  // Stateless module — nothing to reset
}
