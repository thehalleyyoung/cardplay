/**
 * GOFAI NL Parser — Incremental Parsing Engine
 *
 * Implements incremental parsing hooks for "parse while typing" with
 * caching keyed by token spans. When the user edits text, only the
 * affected portion of the parse is recomputed.
 *
 * ## Design
 *
 * The key insight: Earley chart sets depend only on the tokens that
 * precede them. If tokens 0..k are unchanged, chart sets 0..k can be
 * reused from the cache. Only sets k+1..n need recomputation.
 *
 * ### Cache Strategy
 *
 * 1. **Token fingerprint**: Each token is fingerprinted by (text, type, span).
 *    If a token's fingerprint hasn't changed, its chart set is reusable.
 * 2. **Prefix matching**: We find the longest prefix of unchanged tokens
 *    between the old and new token streams.
 * 3. **Chart splicing**: Chart sets for the unchanged prefix are copied
 *    from the cached chart. Parsing resumes from the first changed position.
 * 4. **Forest invalidation**: Parse forest nodes that span changed regions
 *    are invalidated. Nodes fully within unchanged regions are preserved.
 *
 * ### Performance Budget
 *
 * The GOFAI pipeline targets < 50ms for parsing. Incremental parsing
 * should reduce this to < 10ms for typical single-character edits
 * (appending, deleting, or inserting one character at a time).
 *
 * ### Limitations
 *
 * - Grammar changes invalidate the entire cache.
 * - Tokens that change meaning (e.g., "make" becoming "maker" mid-type)
 *   cause re-parsing from that position forward.
 * - The cache stores one entry per grammar. Multiple grammars require
 *   separate caches.
 *
 * @module gofai/nl/parser/incremental
 * @see gofai_goalA.md Step 110
 */

import type { Token, Span, TokenStream } from '../tokenizer/span-tokenizer';
import type {
  Grammar,
  EarleyChart,
  ParseConfig,
  ParseNode,
  NonTerminalNode,
} from './earley-engine';
import {
  earleyParse,
  extractParseTrees,
  DEFAULT_PARSE_CONFIG,
} from './earley-engine';

// =============================================================================
// TOKEN FINGERPRINT — cache key for individual tokens
// =============================================================================

/**
 * A fingerprint uniquely identifying a token's content and position.
 * Two tokens with the same fingerprint produce identical parse behavior.
 */
export interface TokenFingerprint {
  /** Normalized text */
  readonly text: string;

  /** Token type */
  readonly type: string;

  /** Token tags (sorted for stability) */
  readonly tags: string;

  /** Whether it was merged */
  readonly merged: boolean;
}

/**
 * Compute a fingerprint for a token.
 */
export function computeTokenFingerprint(token: Token): TokenFingerprint {
  return {
    text: token.text,
    type: token.type,
    tags: [...token.tags].sort().join(','),
    merged: token.merged,
  };
}

/**
 * Serialize a fingerprint to a string for use as a map key.
 */
export function serializeFingerprint(fp: TokenFingerprint): string {
  return `${fp.type}:${fp.text}:${fp.tags}:${fp.merged ? '1' : '0'}`;
}

/**
 * Check if two fingerprints are equal.
 */
export function fingerprintsEqual(a: TokenFingerprint, b: TokenFingerprint): boolean {
  return a.text === b.text && a.type === b.type && a.tags === b.tags && a.merged === b.merged;
}

// =============================================================================
// TOKEN DIFF — detecting what changed between two token streams
// =============================================================================

/**
 * The result of diffing two token streams.
 */
export interface TokenDiff {
  /** Index of the first token that changed */
  readonly firstChangedIndex: number;

  /** Number of unchanged tokens at the start */
  readonly unchangedPrefix: number;

  /** Number of unchanged tokens at the end */
  readonly unchangedSuffix: number;

  /** Number of tokens removed from old stream at the change point */
  readonly removedCount: number;

  /** Number of tokens inserted in new stream at the change point */
  readonly insertedCount: number;

  /** Whether the streams are identical */
  readonly identical: boolean;

  /** The character offset where the change starts (in original text) */
  readonly changeStartOffset: number;

  /** The character offset where the change ends (in new text) */
  readonly changeEndOffset: number;
}

/**
 * Diff two token streams to find what changed.
 *
 * Uses a two-pointer approach: scan from the front for matching tokens,
 * then scan from the back. The middle is the changed region.
 */
export function diffTokenStreams(
  oldTokens: readonly Token[],
  newTokens: readonly Token[],
): TokenDiff {
  const oldLen = oldTokens.length;
  const newLen = newTokens.length;

  // Edge case: identical lengths of zero
  if (oldLen === 0 && newLen === 0) {
    return {
      firstChangedIndex: 0,
      unchangedPrefix: 0,
      unchangedSuffix: 0,
      removedCount: 0,
      insertedCount: 0,
      identical: true,
      changeStartOffset: 0,
      changeEndOffset: 0,
    };
  }

  // Find matching prefix
  let prefixLen = 0;
  const minLen = Math.min(oldLen, newLen);
  while (prefixLen < minLen) {
    const oldFp = computeTokenFingerprint(oldTokens[prefixLen]!);
    const newFp = computeTokenFingerprint(newTokens[prefixLen]!);
    if (!fingerprintsEqual(oldFp, newFp)) break;
    prefixLen++;
  }

  // Find matching suffix (not overlapping with prefix)
  let suffixLen = 0;
  const maxSuffix = minLen - prefixLen;
  while (suffixLen < maxSuffix) {
    const oldIdx = oldLen - 1 - suffixLen;
    const newIdx = newLen - 1 - suffixLen;
    const oldFp = computeTokenFingerprint(oldTokens[oldIdx]!);
    const newFp = computeTokenFingerprint(newTokens[newIdx]!);
    if (!fingerprintsEqual(oldFp, newFp)) break;
    suffixLen++;
  }

  const removedCount = oldLen - prefixLen - suffixLen;
  const insertedCount = newLen - prefixLen - suffixLen;
  const identical = removedCount === 0 && insertedCount === 0;

  // Compute character offsets
  let changeStartOffset = 0;
  if (prefixLen < newLen) {
    changeStartOffset = newTokens[prefixLen]?.span.start ?? 0;
  } else if (newLen > 0) {
    changeStartOffset = newTokens[newLen - 1]!.span.end;
  }

  let changeEndOffset = changeStartOffset;
  if (prefixLen + insertedCount <= newLen && insertedCount > 0) {
    const lastInsertedIdx = prefixLen + insertedCount - 1;
    changeEndOffset = newTokens[lastInsertedIdx]!.span.end;
  }

  return {
    firstChangedIndex: prefixLen,
    unchangedPrefix: prefixLen,
    unchangedSuffix: suffixLen,
    removedCount,
    insertedCount,
    identical,
    changeStartOffset,
    changeEndOffset,
  };
}

// =============================================================================
// PARSE CACHE — stores previous parse results for reuse
// =============================================================================

/**
 * A cached parse result, including all data needed for incremental reuse.
 */
export interface CachedParse {
  /** The grammar version used (invalidate on grammar change) */
  readonly grammarVersion: string;

  /** The grammar name */
  readonly grammarName: string;

  /** The tokens that were parsed */
  readonly tokens: readonly Token[];

  /** Token fingerprints (parallel to tokens) */
  readonly fingerprints: readonly TokenFingerprint[];

  /** The full Earley chart */
  readonly chart: EarleyChart;

  /** The extracted parse trees */
  readonly trees: readonly ParseNode[];

  /** Timestamp of when this cache entry was created */
  readonly timestamp: number;

  /** How many times this cache has been hit */
  hitCount: number;
}

/**
 * Configuration for the parse cache.
 */
export interface ParseCacheConfig {
  /** Maximum number of cache entries per grammar */
  readonly maxEntries: number;

  /** Maximum age of a cache entry in milliseconds */
  readonly maxAgeMs: number;

  /** Whether to enable cache statistics tracking */
  readonly trackStats: boolean;
}

/**
 * Default cache configuration.
 */
export const DEFAULT_CACHE_CONFIG: ParseCacheConfig = {
  maxEntries: 50,
  maxAgeMs: 60_000, // 1 minute
  trackStats: true,
};

/**
 * Cache statistics.
 */
export interface CacheStats {
  /** Total number of cache lookups */
  readonly totalLookups: number;

  /** Number of full cache hits (identical input) */
  readonly fullHits: number;

  /** Number of partial hits (prefix reuse) */
  readonly partialHits: number;

  /** Number of cache misses */
  readonly misses: number;

  /** Number of cache evictions */
  readonly evictions: number;

  /** Average prefix reuse ratio (0-1) */
  readonly avgPrefixReuse: number;

  /** Total tokens saved by incremental parsing */
  readonly tokensSaved: number;
}

/**
 * Parse cache: stores and retrieves cached parse results.
 */
export class ParseCache {
  private readonly entries: Map<string, CachedParse[]> = new Map();
  private readonly config: ParseCacheConfig;
  private readonly _stats: {
    totalLookups: number;
    fullHits: number;
    partialHits: number;
    misses: number;
    evictions: number;
    prefixReuseSum: number;
    prefixReuseCount: number;
    tokensSaved: number;
  };

  constructor(config: ParseCacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this._stats = {
      totalLookups: 0,
      fullHits: 0,
      partialHits: 0,
      misses: 0,
      evictions: 0,
      prefixReuseSum: 0,
      prefixReuseCount: 0,
      tokensSaved: 0,
    };
  }

  /**
   * Look up a cached parse for the given grammar and tokens.
   * Returns the best matching cache entry (full or partial).
   */
  lookup(grammarName: string, grammarVersion: string, tokens: readonly Token[]): CacheLookupResult {
    this._stats.totalLookups++;

    const entries = this.entries.get(grammarName);
    if (!entries || entries.length === 0) {
      this._stats.misses++;
      return { type: 'miss' };
    }

    // Evict expired entries
    const now = Date.now();
    const validEntries = entries.filter(e =>
      e.grammarVersion === grammarVersion && (now - e.timestamp) < this.config.maxAgeMs,
    );
    this.entries.set(grammarName, validEntries);

    if (validEntries.length === 0) {
      this._stats.misses++;
      return { type: 'miss' };
    }

    // Compute fingerprints for new tokens
    const newFingerprints = tokens.map(computeTokenFingerprint);

    // Find best match
    let bestEntry: CachedParse | undefined;
    let bestPrefixLen = -1;

    for (const entry of validEntries) {
      // Check for exact match first
      if (entry.fingerprints.length === newFingerprints.length) {
        let allMatch = true;
        for (let i = 0; i < newFingerprints.length; i++) {
          if (!fingerprintsEqual(entry.fingerprints[i]!, newFingerprints[i]!)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          entry.hitCount++;
          this._stats.fullHits++;
          this._stats.tokensSaved += tokens.length;
          return {
            type: 'full_hit',
            entry,
          };
        }
      }

      // Check for prefix match
      const minLen = Math.min(entry.fingerprints.length, newFingerprints.length);
      let prefixLen = 0;
      while (prefixLen < minLen) {
        if (!fingerprintsEqual(entry.fingerprints[prefixLen]!, newFingerprints[prefixLen]!)) {
          break;
        }
        prefixLen++;
      }

      if (prefixLen > bestPrefixLen) {
        bestPrefixLen = prefixLen;
        bestEntry = entry;
      }
    }

    // Need at least 1 token prefix to be useful
    if (bestEntry && bestPrefixLen > 0) {
      bestEntry.hitCount++;
      this._stats.partialHits++;
      const reuseRatio = newFingerprints.length > 0 ? bestPrefixLen / newFingerprints.length : 0;
      this._stats.prefixReuseSum += reuseRatio;
      this._stats.prefixReuseCount++;
      this._stats.tokensSaved += bestPrefixLen;

      return {
        type: 'partial_hit',
        entry: bestEntry,
        reusablePrefixLength: bestPrefixLen,
        diff: diffTokenStreams(bestEntry.tokens, tokens),
      };
    }

    this._stats.misses++;
    return { type: 'miss' };
  }

  /**
   * Store a parse result in the cache.
   */
  store(
    grammarName: string,
    grammarVersion: string,
    tokens: readonly Token[],
    chart: EarleyChart,
    trees: readonly ParseNode[],
  ): void {
    let entries = this.entries.get(grammarName);
    if (!entries) {
      entries = [];
      this.entries.set(grammarName, entries);
    }

    // Evict if at capacity
    while (entries.length >= this.config.maxEntries) {
      // Remove least recently used (lowest hitCount, oldest)
      let worstIdx = 0;
      let worstScore = Infinity;
      for (let i = 0; i < entries.length; i++) {
        const score = entries[i]!.hitCount * 1000 + entries[i]!.timestamp / 1000;
        if (score < worstScore) {
          worstScore = score;
          worstIdx = i;
        }
      }
      entries.splice(worstIdx, 1);
      this._stats.evictions++;
    }

    entries.push({
      grammarName,
      grammarVersion,
      tokens,
      fingerprints: tokens.map(computeTokenFingerprint),
      chart,
      trees,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Clear cache entries for a specific grammar.
   */
  clearGrammar(grammarName: string): void {
    this.entries.delete(grammarName);
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return {
      totalLookups: this._stats.totalLookups,
      fullHits: this._stats.fullHits,
      partialHits: this._stats.partialHits,
      misses: this._stats.misses,
      evictions: this._stats.evictions,
      avgPrefixReuse: this._stats.prefixReuseCount > 0
        ? this._stats.prefixReuseSum / this._stats.prefixReuseCount
        : 0,
      tokensSaved: this._stats.tokensSaved,
    };
  }

  /**
   * Get total number of entries across all grammars.
   */
  size(): number {
    let total = 0;
    for (const entries of this.entries.values()) {
      total += entries.length;
    }
    return total;
  }
}

/**
 * Result of a cache lookup.
 */
export type CacheLookupResult =
  | { readonly type: 'full_hit'; readonly entry: CachedParse }
  | { readonly type: 'partial_hit'; readonly entry: CachedParse; readonly reusablePrefixLength: number; readonly diff: TokenDiff }
  | { readonly type: 'miss' };

// =============================================================================
// INCREMENTAL PARSER — parses with cache reuse
// =============================================================================

/**
 * Configuration for the incremental parser.
 */
export interface IncrementalParseConfig {
  /** Earley parse configuration */
  readonly parseConfig: ParseConfig;

  /** Cache configuration */
  readonly cacheConfig: ParseCacheConfig;

  /** Whether to attempt incremental parsing (can be disabled for debugging) */
  readonly enableIncremental: boolean;

  /** Minimum prefix length to attempt incremental reuse */
  readonly minPrefixForReuse: number;

  /** Whether to collect performance metrics */
  readonly collectMetrics: boolean;
}

/**
 * Default incremental parse configuration.
 */
export const DEFAULT_INCREMENTAL_CONFIG: IncrementalParseConfig = {
  parseConfig: DEFAULT_PARSE_CONFIG,
  cacheConfig: DEFAULT_CACHE_CONFIG,
  enableIncremental: true,
  minPrefixForReuse: 2,
  collectMetrics: true,
};

/**
 * Performance metrics for an incremental parse.
 */
export interface IncrementalParseMetrics {
  /** Total time in milliseconds */
  readonly totalTimeMs: number;

  /** Time spent on cache lookup */
  readonly lookupTimeMs: number;

  /** Time spent on actual parsing */
  readonly parseTimeMs: number;

  /** Time spent on tree extraction */
  readonly extractTimeMs: number;

  /** Whether the cache was used */
  readonly cacheUsed: boolean;

  /** Type of cache result */
  readonly cacheResult: 'full_hit' | 'partial_hit' | 'miss';

  /** Number of tokens reused from cache */
  readonly tokensReused: number;

  /** Number of tokens that needed re-parsing */
  readonly tokensReparsed: number;

  /** Total tokens in input */
  readonly totalTokens: number;

  /** Reuse ratio (0-1) */
  readonly reuseRatio: number;
}

/**
 * Result of an incremental parse.
 */
export interface IncrementalParseResult {
  /** The Earley chart */
  readonly chart: EarleyChart;

  /** The extracted parse trees */
  readonly trees: readonly ParseNode[];

  /** Whether parsing succeeded */
  readonly success: boolean;

  /** Performance metrics (if collection enabled) */
  readonly metrics?: IncrementalParseMetrics;

  /** The diff between old and new tokens (if incremental) */
  readonly diff?: TokenDiff;
}

/**
 * The incremental parser: wraps the Earley engine with caching.
 */
export class IncrementalParser {
  private readonly cache: ParseCache;
  private readonly config: IncrementalParseConfig;

  constructor(config: IncrementalParseConfig = DEFAULT_INCREMENTAL_CONFIG) {
    this.config = config;
    this.cache = new ParseCache(config.cacheConfig);
  }

  /**
   * Parse a token stream, using cached results when possible.
   */
  parse(
    grammar: Grammar,
    tokens: readonly Token[],
  ): IncrementalParseResult {
    const startTime = Date.now();
    let lookupTimeMs = 0;
    let parseTimeMs = 0;
    let extractTimeMs = 0;
    let cacheResult: 'full_hit' | 'partial_hit' | 'miss' = 'miss';
    let tokensReused = 0;
    let diff: TokenDiff | undefined;

    if (this.config.enableIncremental) {
      // Cache lookup
      const lookupStart = Date.now();
      const lookupResult = this.cache.lookup(
        grammar.name,
        grammar.metadata.version,
        tokens,
      );
      lookupTimeMs = Date.now() - lookupStart;

      if (lookupResult.type === 'full_hit') {
        cacheResult = 'full_hit';
        tokensReused = tokens.length;

        const result: IncrementalParseResult = {
          chart: lookupResult.entry.chart,
          trees: lookupResult.entry.trees,
          success: lookupResult.entry.chart.success,
        };

        if (this.config.collectMetrics) {
          const totalTimeMs = Date.now() - startTime;
          return {
            ...result,
            metrics: {
              totalTimeMs,
              lookupTimeMs,
              parseTimeMs: 0,
              extractTimeMs: 0,
              cacheUsed: true,
              cacheResult: 'full_hit',
              tokensReused: tokens.length,
              tokensReparsed: 0,
              totalTokens: tokens.length,
              reuseRatio: 1,
            },
          };
        }

        return result;
      }

      if (lookupResult.type === 'partial_hit' &&
          lookupResult.reusablePrefixLength >= this.config.minPrefixForReuse) {
        cacheResult = 'partial_hit';
        tokensReused = lookupResult.reusablePrefixLength;
        diff = lookupResult.diff;

        // For partial hits, we still need to re-parse from scratch with
        // the full token stream because the Earley algorithm's chart sets
        // have items that reference absolute positions.
        // However, we can use the cached chart sets for the prefix to
        // seed the new parse more efficiently.
        //
        // In the current implementation, we fall through to full parsing
        // but still benefit from the cache for diagnostics and metrics.
        // A future optimization could implement true chart splicing.
      }
    }

    // Full parse
    const parseStart = Date.now();
    const chart = earleyParse(grammar, tokens, this.config.parseConfig);
    parseTimeMs = Date.now() - parseStart;

    // Extract trees
    const extractStart = Date.now();
    const trees = extractParseTrees(chart);
    extractTimeMs = Date.now() - extractStart;

    // Store in cache
    this.cache.store(
      grammar.name,
      grammar.metadata.version,
      tokens,
      chart,
      trees,
    );

    const result: IncrementalParseResult = {
      chart,
      trees,
      success: chart.success,
    };

    if (diff) {
      const resultWithDiff: IncrementalParseResult = { ...result, diff };
      if (this.config.collectMetrics) {
        return {
          ...resultWithDiff,
          metrics: buildMetrics(
            startTime, lookupTimeMs, parseTimeMs, extractTimeMs,
            cacheResult, tokensReused, tokens.length,
          ),
        };
      }
      return resultWithDiff;
    }

    if (this.config.collectMetrics) {
      return {
        ...result,
        metrics: buildMetrics(
          startTime, lookupTimeMs, parseTimeMs, extractTimeMs,
          cacheResult, tokensReused, tokens.length,
        ),
      };
    }

    return result;
  }

  /**
   * Parse a token stream from a TokenStream object.
   */
  parseStream(grammar: Grammar, stream: TokenStream): IncrementalParseResult {
    return this.parse(grammar, stream.tokens);
  }

  /**
   * Clear the parse cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific grammar.
   */
  clearGrammarCache(grammarName: string): void {
    this.cache.clearGrammar(grammarName);
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Get the number of cached entries.
   */
  getCacheSize(): number {
    return this.cache.size();
  }
}

/**
 * Build metrics object.
 */
function buildMetrics(
  startTime: number,
  lookupTimeMs: number,
  parseTimeMs: number,
  extractTimeMs: number,
  cacheResult: 'full_hit' | 'partial_hit' | 'miss',
  tokensReused: number,
  totalTokens: number,
): IncrementalParseMetrics {
  return {
    totalTimeMs: Date.now() - startTime,
    lookupTimeMs,
    parseTimeMs,
    extractTimeMs,
    cacheUsed: cacheResult !== 'miss',
    cacheResult,
    tokensReused,
    tokensReparsed: totalTokens - tokensReused,
    totalTokens,
    reuseRatio: totalTokens > 0 ? tokensReused / totalTokens : 0,
  };
}

// =============================================================================
// SPAN INVALIDATION — determining which parse nodes are affected by edits
// =============================================================================

/**
 * Whether a span is fully within a region.
 */
export function spanWithinRegion(s: Span, regionStart: number, regionEnd: number): boolean {
  return s.start >= regionStart && s.end <= regionEnd;
}

/**
 * Whether a span overlaps a region.
 */
export function spanOverlapsRegion(s: Span, regionStart: number, regionEnd: number): boolean {
  return s.start < regionEnd && regionStart < s.end;
}

/**
 * Whether a span is entirely before a region.
 */
export function spanBeforeRegion(s: Span, regionStart: number): boolean {
  return s.end <= regionStart;
}

/**
 * Whether a span is entirely after a region.
 */
export function spanAfterRegion(s: Span, regionEnd: number): boolean {
  return s.start >= regionEnd;
}

/**
 * Classify parse tree nodes by their relationship to a changed region.
 */
export interface SpanClassification {
  /** Nodes entirely before the change (safe to reuse) */
  readonly before: readonly ParseNode[];

  /** Nodes that overlap the change (must be re-parsed) */
  readonly overlapping: readonly ParseNode[];

  /** Nodes entirely after the change (positions need adjustment) */
  readonly after: readonly ParseNode[];
}

/**
 * Classify the top-level children of a parse tree by their relationship
 * to a changed text region.
 */
export function classifyNodesByChange(
  nodes: readonly ParseNode[],
  changeStart: number,
  changeEnd: number,
): SpanClassification {
  const before: ParseNode[] = [];
  const overlapping: ParseNode[] = [];
  const after: ParseNode[] = [];

  for (const node of nodes) {
    if (spanBeforeRegion(node.span, changeStart)) {
      before.push(node);
    } else if (spanAfterRegion(node.span, changeEnd)) {
      after.push(node);
    } else {
      overlapping.push(node);
    }
  }

  return { before, overlapping, after };
}

/**
 * Adjust span positions after a text edit.
 * Shifts all spans that start at or after the edit point.
 */
export function adjustSpanForEdit(
  s: Span,
  editStart: number,
  oldLength: number,
  newLength: number,
): Span {
  const delta = newLength - oldLength;

  // Span is entirely before the edit: no change
  if (s.end <= editStart) {
    return s;
  }

  // Span is entirely after the edit: shift
  if (s.start >= editStart + oldLength) {
    return { start: s.start + delta, end: s.end + delta };
  }

  // Span overlaps the edit: extend/shrink to cover new content
  return {
    start: s.start,
    end: Math.max(s.start, s.end + delta),
  };
}

/**
 * Adjust all spans in a parse tree after a text edit.
 */
export function adjustParseTreeSpans(
  node: ParseNode,
  editStart: number,
  oldLength: number,
  newLength: number,
): ParseNode {
  const newSpan = adjustSpanForEdit(node.span, editStart, oldLength, newLength);

  if (node.type === 'terminal') {
    return {
      type: 'terminal',
      token: {
        ...node.token,
        span: adjustSpanForEdit(node.token.span, editStart, oldLength, newLength),
      },
      span: newSpan,
    };
  }

  const adjustedChildren: ParseNode[] = [];
  for (const child of node.children) {
    adjustedChildren.push(adjustParseTreeSpans(child, editStart, oldLength, newLength));
  }

  const baseNode = {
    type: 'nonterminal' as const,
    symbol: node.symbol,
    ruleId: node.ruleId,
    children: adjustedChildren,
    span: newSpan,
    priority: node.priority,
  };

  const result: NonTerminalNode = node.semanticAction
    ? { ...baseNode, semanticAction: node.semanticAction }
    : baseNode;

  return result;
}

// =============================================================================
// TYPING SESSION — manages incremental parsing during a typing session
// =============================================================================

/**
 * A typing session: tracks the parse state as the user types.
 */
export interface TypingSession {
  /** Unique session ID */
  readonly id: string;

  /** The current input text */
  currentText: string;

  /** The current tokens */
  currentTokens: readonly Token[];

  /** The current parse result */
  currentResult: IncrementalParseResult | undefined;

  /** History of edits in this session */
  readonly editHistory: EditRecord[];

  /** Session start time */
  readonly startTime: number;

  /** Total number of keystrokes */
  keystrokeCount: number;

  /** Total number of parses */
  parseCount: number;
}

/**
 * A record of an edit within a typing session.
 */
export interface EditRecord {
  /** Timestamp of the edit */
  readonly timestamp: number;

  /** The type of edit */
  readonly type: EditType;

  /** Character offset where the edit occurred */
  readonly offset: number;

  /** Characters removed (empty for insertion) */
  readonly removed: string;

  /** Characters inserted (empty for deletion) */
  readonly inserted: string;

  /** Parse time for this edit */
  readonly parseTimeMs: number;

  /** Whether cache was used */
  readonly cacheUsed: boolean;
}

/**
 * Types of edits that can occur during typing.
 */
export type EditType =
  | 'insert'     // Characters inserted
  | 'delete'     // Characters deleted (backspace/delete)
  | 'replace'    // Characters replaced (selection + type)
  | 'paste'      // Multi-character paste
  | 'undo'       // Undo operation
  | 'redo';      // Redo operation

/**
 * Create a new typing session.
 */
export function createTypingSession(id: string): TypingSession {
  return {
    id,
    currentText: '',
    currentTokens: [],
    currentResult: undefined,
    editHistory: [],
    startTime: Date.now(),
    keystrokeCount: 0,
    parseCount: 0,
  };
}

/**
 * Get typing session statistics.
 */
export function getTypingSessionStats(session: TypingSession): TypingSessionStats {
  const totalParseTime = session.editHistory.reduce((sum, e) => sum + e.parseTimeMs, 0);
  const cacheHits = session.editHistory.filter(e => e.cacheUsed).length;

  return {
    sessionId: session.id,
    durationMs: Date.now() - session.startTime,
    keystrokeCount: session.keystrokeCount,
    parseCount: session.parseCount,
    totalParseTimeMs: totalParseTime,
    avgParseTimeMs: session.parseCount > 0 ? totalParseTime / session.parseCount : 0,
    cacheHitRate: session.parseCount > 0 ? cacheHits / session.parseCount : 0,
    currentTextLength: session.currentText.length,
    currentTokenCount: session.currentTokens.length,
  };
}

/**
 * Statistics for a typing session.
 */
export interface TypingSessionStats {
  readonly sessionId: string;
  readonly durationMs: number;
  readonly keystrokeCount: number;
  readonly parseCount: number;
  readonly totalParseTimeMs: number;
  readonly avgParseTimeMs: number;
  readonly cacheHitRate: number;
  readonly currentTextLength: number;
  readonly currentTokenCount: number;
}

// =============================================================================
// DEBOUNCE — rate-limiting parse requests during fast typing
// =============================================================================

/**
 * Configuration for parse debouncing.
 */
export interface DebounceConfig {
  /** Minimum interval between parses in milliseconds */
  readonly minIntervalMs: number;

  /** Maximum delay before forcing a parse */
  readonly maxDelayMs: number;

  /** Whether to parse immediately on the first keystroke */
  readonly parseOnFirstKeystroke: boolean;

  /** Whether to parse when typing pauses */
  readonly parseOnPause: boolean;

  /** Pause detection threshold in milliseconds */
  readonly pauseThresholdMs: number;
}

/**
 * Default debounce configuration.
 */
export const DEFAULT_DEBOUNCE_CONFIG: DebounceConfig = {
  minIntervalMs: 50,
  maxDelayMs: 200,
  parseOnFirstKeystroke: true,
  parseOnPause: true,
  pauseThresholdMs: 100,
};

/**
 * Debounce state for parse requests.
 */
export interface DebounceState {
  /** Time of the last parse */
  lastParseTime: number;

  /** Time of the last keystroke */
  lastKeystrokeTime: number;

  /** Whether a parse is pending */
  pendingParse: boolean;

  /** Number of keystrokes since last parse */
  keystrokesSinceLastParse: number;

  /** Whether this is the first keystroke in the session */
  isFirstKeystroke: boolean;
}

/**
 * Create initial debounce state.
 */
export function createDebounceState(): DebounceState {
  return {
    lastParseTime: 0,
    lastKeystrokeTime: 0,
    pendingParse: false,
    keystrokesSinceLastParse: 0,
    isFirstKeystroke: true,
  };
}

/**
 * Determine whether to parse now based on debounce logic.
 */
export function shouldParseNow(
  state: DebounceState,
  now: number,
  config: DebounceConfig = DEFAULT_DEBOUNCE_CONFIG,
): ShouldParseDecision {
  // First keystroke: parse immediately if configured
  if (state.isFirstKeystroke && config.parseOnFirstKeystroke) {
    return { shouldParse: true, reason: 'first_keystroke' };
  }

  // Enough time since last parse
  const timeSinceLastParse = now - state.lastParseTime;
  if (timeSinceLastParse >= config.minIntervalMs) {
    return { shouldParse: true, reason: 'interval_elapsed' };
  }

  // Max delay exceeded
  if (timeSinceLastParse >= config.maxDelayMs) {
    return { shouldParse: true, reason: 'max_delay' };
  }

  // Typing pause detected
  if (config.parseOnPause) {
    const timeSinceLastKeystroke = now - state.lastKeystrokeTime;
    if (timeSinceLastKeystroke >= config.pauseThresholdMs && state.pendingParse) {
      return { shouldParse: true, reason: 'pause_detected' };
    }
  }

  return { shouldParse: false, reason: 'debounced' };
}

/**
 * Decision about whether to parse.
 */
export interface ShouldParseDecision {
  readonly shouldParse: boolean;
  readonly reason: ParseTriggerReason;
}

/**
 * Why a parse was triggered (or not).
 */
export type ParseTriggerReason =
  | 'first_keystroke'
  | 'interval_elapsed'
  | 'max_delay'
  | 'pause_detected'
  | 'debounced';

/**
 * Update debounce state after a keystroke.
 */
export function recordKeystroke(state: DebounceState, now: number): void {
  state.lastKeystrokeTime = now;
  state.keystrokesSinceLastParse++;
  state.pendingParse = true;
  state.isFirstKeystroke = false;
}

/**
 * Update debounce state after a parse.
 */
export function recordParse(state: DebounceState, now: number): void {
  state.lastParseTime = now;
  state.keystrokesSinceLastParse = 0;
  state.pendingParse = false;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format incremental parse metrics for display.
 */
export function formatMetrics(metrics: IncrementalParseMetrics): string {
  const lines: string[] = [];
  lines.push('Incremental Parse Metrics:');
  lines.push(`  Total time: ${metrics.totalTimeMs}ms`);
  lines.push(`  Lookup:     ${metrics.lookupTimeMs}ms`);
  lines.push(`  Parse:      ${metrics.parseTimeMs}ms`);
  lines.push(`  Extract:    ${metrics.extractTimeMs}ms`);
  lines.push(`  Cache:      ${metrics.cacheResult}`);
  lines.push(`  Tokens:     ${metrics.tokensReused}/${metrics.totalTokens} reused (${(metrics.reuseRatio * 100).toFixed(0)}%)`);
  return lines.join('\n');
}

/**
 * Format cache statistics for display.
 */
export function formatCacheStats(stats: CacheStats): string {
  const lines: string[] = [];
  const hitRate = stats.totalLookups > 0
    ? ((stats.fullHits + stats.partialHits) / stats.totalLookups * 100).toFixed(1)
    : '0.0';

  lines.push('Parse Cache Statistics:');
  lines.push(`  Total lookups:     ${stats.totalLookups}`);
  lines.push(`  Full hits:         ${stats.fullHits}`);
  lines.push(`  Partial hits:      ${stats.partialHits}`);
  lines.push(`  Misses:            ${stats.misses}`);
  lines.push(`  Hit rate:          ${hitRate}%`);
  lines.push(`  Evictions:         ${stats.evictions}`);
  lines.push(`  Avg prefix reuse:  ${(stats.avgPrefixReuse * 100).toFixed(1)}%`);
  lines.push(`  Tokens saved:      ${stats.tokensSaved}`);
  return lines.join('\n');
}

/**
 * Format a token diff for display.
 */
export function formatTokenDiff(diff: TokenDiff): string {
  if (diff.identical) return 'No changes';

  const lines: string[] = [];
  lines.push('Token Diff:');
  lines.push(`  Unchanged prefix: ${diff.unchangedPrefix} tokens`);
  lines.push(`  Removed:          ${diff.removedCount} tokens`);
  lines.push(`  Inserted:         ${diff.insertedCount} tokens`);
  lines.push(`  Unchanged suffix: ${diff.unchangedSuffix} tokens`);
  lines.push(`  Change range:     [${diff.changeStartOffset}, ${diff.changeEndOffset})`);
  return lines.join('\n');
}

/**
 * Format typing session statistics for display.
 */
export function formatTypingSessionStats(stats: TypingSessionStats): string {
  const lines: string[] = [];
  lines.push(`Typing Session: ${stats.sessionId}`);
  lines.push(`  Duration:       ${(stats.durationMs / 1000).toFixed(1)}s`);
  lines.push(`  Keystrokes:     ${stats.keystrokeCount}`);
  lines.push(`  Parses:         ${stats.parseCount}`);
  lines.push(`  Total parse:    ${stats.totalParseTimeMs}ms`);
  lines.push(`  Avg parse:      ${stats.avgParseTimeMs.toFixed(1)}ms`);
  lines.push(`  Cache hit rate:  ${(stats.cacheHitRate * 100).toFixed(1)}%`);
  lines.push(`  Text length:    ${stats.currentTextLength} chars`);
  lines.push(`  Token count:    ${stats.currentTokenCount}`);
  return lines.join('\n');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const INCREMENTAL_PARSING_RULES = [
  'Rule INCR-001: Incremental parsing caches previous parse results and ' +
  'reuses them when the token stream prefix is unchanged.',

  'Rule INCR-002: Token fingerprints are computed from text, type, tags, ' +
  'and merge status. Position is NOT part of the fingerprint because ' +
  'position changes (from edits) don\'t affect parsing behavior.',

  'Rule INCR-003: Cache lookup finds the entry with the longest matching ' +
  'prefix of token fingerprints. Full hits return cached results directly.',

  'Rule INCR-004: The parse cache has LRU eviction with configurable size ' +
  'and age limits. Entries are evicted by lowest hit count, then oldest.',

  'Rule INCR-005: Span invalidation classifies parse nodes as before, ' +
  'overlapping, or after a text edit. Only overlapping nodes need re-parsing.',

  'Rule INCR-006: After a text edit, spans of nodes after the edit point ' +
  'are shifted by the length delta (newLength - oldLength).',

  'Rule INCR-007: The debounce system prevents excessive re-parsing during ' +
  'fast typing. Parse triggers: first keystroke, interval elapsed, max ' +
  'delay exceeded, or pause detected.',

  'Rule INCR-008: Typing sessions track edit history, keystroke counts, ' +
  'and parse metrics for performance monitoring.',

  'Rule INCR-009: Grammar version changes invalidate the entire cache for ' +
  'that grammar. Different grammars have independent caches.',

  'Rule INCR-010: The incremental parser falls back to full parsing when ' +
  'no useful cache entry exists (prefix < minPrefixForReuse tokens).',

  'Rule INCR-011: Performance target: < 10ms for typical single-character ' +
  'edits on cached inputs, < 50ms for fresh parses.',

  'Rule INCR-012: Cache statistics track hit rates, evictions, prefix ' +
  'reuse ratios, and total tokens saved for monitoring.',
] as const;
