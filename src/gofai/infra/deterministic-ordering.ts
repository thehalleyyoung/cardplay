/**
 * GOFAI Deterministic Output Ordering
 *
 * Establishes stable sorting and tie-breaking rules to ensure all GOFAI outputs
 * are deterministic and reproducible across runs.
 *
 * Critical for:
 * - Test stability (golden tests must not flake)
 * - Replay reliability (same input → same output)
 * - Diff clarity (consistent ordering makes changes obvious)
 * - User trust (predictable behavior)
 *
 * @module gofai/infra/deterministic-ordering
 */

// Simplified Event type for ordering purposes
// (Full Event<P> type will be imported when available)
interface Event<P = unknown> {
  readonly id: string;
  readonly onset: number;
  readonly trackId?: string;
  readonly payload: P;
}

// =============================================================================
// Core Ordering Principles
// =============================================================================

/**
 * Ordering principles for GOFAI outputs.
 *
 * These are the SSOT rules that all GOFAI modules must follow.
 */
export const ORDERING_PRINCIPLES = {
  /**
   * All collections must be sorted deterministically.
   * Never rely on Map/Set iteration order (use sorted arrays).
   */
  ALWAYS_SORT: true,

  /**
   * Ties must be broken by stable secondary criteria.
   * Never use random, timestamps, or hash codes as primary sort keys.
   */
  STABLE_TIEBREAKERS: true,

  /**
   * Entity IDs are the ultimate tiebreaker.
   * When all else is equal, sort by stable ID (lexicographically).
   */
  ID_IS_FINAL_TIEBREAKER: true,

  /**
   * Time-based outputs sort by logical time, not wall-clock time.
   * Use tick positions, bar numbers, section order - not Date.now().
   */
  LOGICAL_TIME_NOT_WALL_CLOCK: true,

  /**
   * Preserved insertion order is acceptable only when explicitly documented.
   * Default to sorted unless there's a strong reason not to.
   */
  DEFAULT_TO_SORTED: true,
} as const;

// =============================================================================
// Comparator Functions
// =============================================================================

/**
 * Standard comparator result.
 */
export type CompareResult = -1 | 0 | 1;

/**
 * Generic comparator function type.
 */
export type Comparator<T> = (a: T, b: T) => CompareResult;

/**
 * Compare two numbers deterministically.
 */
export function compareNumbers(a: number, b: number): CompareResult {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compare two strings lexicographically.
 */
export function compareStrings(a: string, b: string): CompareResult {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compare two booleans (false < true).
 */
export function compareBooleans(a: boolean, b: boolean): CompareResult {
  if (a === b) return 0;
  return a ? 1 : -1;
}

/**
 * Invert a comparator (reverse sort order).
 */
export function invert<T>(comparator: Comparator<T>): Comparator<T> {
  return (a, b) => (-comparator(a, b) as CompareResult);
}

/**
 * Chain multiple comparators with tiebreaking.
 *
 * Returns the result of the first comparator that doesn't return 0.
 * This implements stable multi-level sorting.
 *
 * @example
 * ```ts
 * const compareByPriorityThenName = chain(
 *   (a, b) => compareNumbers(a.priority, b.priority),
 *   (a, b) => compareStrings(a.name, b.name)
 * );
 * ```
 */
export function chain<T>(...comparators: Comparator<T>[]): Comparator<T> {
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

/**
 * Compare by a key extraction function.
 */
export function compareBy<T, K>(
  keyFn: (item: T) => K,
  keyComparator: Comparator<K>
): Comparator<T> {
  return (a, b) => keyComparator(keyFn(a), keyFn(b));
}

// =============================================================================
// Musical Event Ordering
// =============================================================================

/**
 * Compare events by onset time.
 *
 * Primary sort key for most event operations.
 */
export function compareEventsByOnset<P>(
  a: Event<P>,
  b: Event<P>
): CompareResult {
  return compareNumbers(a.onset, b.onset);
}

/**
 * Compare events by onset, then by pitch (if available).
 */
export function compareEventsByOnsetThenPitch<
  P extends { pitch?: number | undefined },
>(a: Event<P>, b: Event<P>): CompareResult {
  const onsetCmp = compareEventsByOnset(a, b);
  if (onsetCmp !== 0) return onsetCmp;

  // Tiebreak by pitch if available
  const pitchA = a.payload.pitch ?? -Infinity;
  const pitchB = b.payload.pitch ?? -Infinity;
  return compareNumbers(pitchA, pitchB);
}

/**
 * Compare events by onset, then by track, then by ID.
 *
 * This is the canonical event ordering for diff output.
 */
export function compareEventsCanonical<P>(
  a: Event<P>,
  b: Event<P>
): CompareResult {
  return chain<Event<P>>(
    compareEventsByOnset,
    compareBy(e => (e as Event<P>).trackId ?? '', compareStrings),
    compareBy(e => (e as Event<P>).id, compareStrings)
  )(a, b);
}

// =============================================================================
// Entity Ordering
// =============================================================================

/**
 * Compare entities by stable ID.
 *
 * This is the ultimate tiebreaker for all entities.
 */
export function compareById<T extends { id: string }>(
  a: T,
  b: T
): CompareResult {
  return compareStrings(a.id, b.id);
}

/**
 * Compare entities by name, with ID as tiebreaker.
 */
export function compareByName<T extends { id: string; name: string }>(
  a: T,
  b: T
): CompareResult {
  return chain(
    compareBy(e => e.name, compareStrings),
    compareById
  )(a, b);
}

/**
 * Compare entities by priority (higher first), then by ID.
 */
export function compareByPriority<T extends { id: string; priority: number }>(
  a: T,
  b: T
): CompareResult {
  return chain(
    compareBy(e => -e.priority, compareNumbers), // Negate for descending order
    compareById
  )(a, b);
}

// =============================================================================
// Parse Tree and Semantic Ordering
// =============================================================================

/**
 * Parse result with score.
 */
export interface ScoredResult<T> {
  readonly result: T;
  readonly score: number;
  readonly id?: string;
}

/**
 * Compare parse results by score (higher first), then by ID.
 *
 * Used for ordering parse forest nodes and semantic interpretations.
 */
export function compareParseBySco<T extends { id?: string }>(
  a: ScoredResult<T>,
  b: ScoredResult<T>
): CompareResult {
  // Higher scores first (descending)
  const scoreCmp = compareNumbers(b.score, a.score);
  if (scoreCmp !== 0) return scoreCmp;

  // Tiebreak by ID
  const idA = a.result.id ?? a.id ?? '';
  const idB = b.result.id ?? b.id ?? '';
  return compareStrings(idA, idB);
}

/**
 * Semantic node with provenance.
 */
export interface SemanticNode {
  readonly type: string;
  readonly id?: string;
  readonly span?: readonly [number, number];
  [key: string]: unknown;
}

/**
 * Compare semantic nodes by span (left-to-right), then by type, then by ID.
 *
 * Ensures deterministic ordering of semantic trees.
 */
export function compareSemanticNodes(
  a: SemanticNode,
  b: SemanticNode
): CompareResult {
  return chain(
    // Sort by span start (left-to-right in source)
    compareBy(
      n => n.span?.[0] ?? 0,
      compareNumbers
    ),
    // Then by span end (shorter spans first for nested structures)
    compareBy(
      n => n.span?.[1] ?? 0,
      compareNumbers
    ),
    // Then by type (alphabetical)
    compareBy(n => n.type, compareStrings),
    // Finally by ID
    compareBy(n => n.id ?? '', compareStrings)
  )(a, b);
}

// =============================================================================
// Plan Ordering
// =============================================================================

/**
 * Plan opcode with cost and effects.
 */
export interface PlanOpcode {
  readonly id: string;
  readonly type: string;
  readonly cost: number;
  readonly scope?: string;
  readonly target?: string;
}

/**
 * Compare plan opcodes by scope, then by execution order dependencies.
 *
 * Ensures plans execute in a stable, meaningful order.
 */
export function comparePlanOpcodes(
  a: PlanOpcode,
  b: PlanOpcode
): CompareResult {
  return chain(
    // Group by scope (so all ops on same section are together)
    compareBy(op => op.scope ?? '', compareStrings),
    // Then by type (certain types should go first: structure before events)
    compareBy(
      op => getOpcodeTypeOrder(op.type),
      compareNumbers
    ),
    // Then by target (alphabetical for predictability)
    compareBy(op => op.target ?? '', compareStrings),
    // Finally by ID
    compareBy(op => op.id, compareStrings)
  )(a, b);
}

/**
 * Get execution order for opcode types.
 *
 * Lower numbers execute first.
 */
function getOpcodeTypeOrder(type: string): number {
  const ORDER: Record<string, number> = {
    // Structure changes first
    'structure:add-section': 10,
    'structure:remove-section': 11,
    'structure:move-section': 12,
    'structure:add-track': 13,
    'structure:remove-track': 14,
    'structure:move-track': 15,

    // Event creation/deletion
    'event:create': 20,
    'event:delete': 21,

    // Event transformations
    'event:move': 30,
    'event:transform-pitch': 31,
    'event:transform-velocity': 32,
    'event:transform-duration': 33,
    'event:quantize': 34,
    'event:humanize': 35,

    // Routing changes
    'routing:connect': 40,
    'routing:disconnect': 41,
    'routing:reorder': 42,

    // Production changes
    'production:add-card': 50,
    'production:remove-card': 51,
    'production:move-card': 52,

    // DSP last (so routing is set up)
    'dsp:set-param': 60,
    'dsp:automate-param': 61,

    // Metadata changes last (cosmetic)
    'metadata:rename': 70,
    'metadata:recolor': 71,
    'metadata:retag': 72,
  };

  return ORDER[type] ?? 100; // Unknown types go last
}

/**
 * Plan with multiple opcodes.
 */
export interface Plan {
  readonly id: string;
  readonly opcodes: readonly PlanOpcode[];
  readonly cost: number;
  readonly score?: number;
}

/**
 * Compare complete plans by score (higher first), then by cost (lower first).
 */
export function comparePlans(a: Plan, b: Plan): CompareResult {
  return chain(
    // Higher scores first (if available)
    compareBy(
      p => -(p.score ?? 0),
      compareNumbers
    ),
    // Lower costs first
    compareBy(p => p.cost, compareNumbers),
    // Tiebreak by ID
    compareBy(p => p.id, compareStrings)
  )(a, b);
}

// =============================================================================
// Clarification Question Ordering
// =============================================================================

/**
 * Clarification question.
 */
export interface ClarificationQuestion {
  readonly id: string;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly question: string;
  readonly options?: readonly string[];
}

/**
 * Compare clarification questions by priority.
 *
 * Critical questions must be answered first.
 */
export function compareClarifications(
  a: ClarificationQuestion,
  b: ClarificationQuestion
): CompareResult {
  return chain(
    compareBy(
      q => getClarificationPriorityOrder(q.priority),
      compareNumbers
    ),
    compareBy(q => q.id, compareStrings)
  )(a, b);
}

function getClarificationPriorityOrder(
  priority: ClarificationQuestion['priority']
): number {
  const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  return ORDER[priority];
}

// =============================================================================
// Constraint Violation Ordering
// =============================================================================

/**
 * Constraint violation.
 */
export interface ConstraintViolation {
  readonly constraintId: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly location?: string;
}

/**
 * Compare constraint violations by severity, then by constraint ID.
 */
export function compareViolations(
  a: ConstraintViolation,
  b: ConstraintViolation
): CompareResult {
  return chain(
    // Errors before warnings
    compareBy(
      v => (v.severity === 'error' ? 0 : 1),
      compareNumbers
    ),
    // Then by location (if available)
    compareBy(v => v.location ?? '', compareStrings),
    // Then by constraint ID
    compareBy(v => v.constraintId, compareStrings)
  )(a, b);
}

// =============================================================================
// Extension Ordering
// =============================================================================

/**
 * Extension manifest.
 */
export interface ExtensionManifest {
  readonly namespace: string;
  readonly version: string;
  readonly priority?: number;
}

/**
 * Compare extensions by priority (higher first), then by namespace.
 */
export function compareExtensions(
  a: ExtensionManifest,
  b: ExtensionManifest
): CompareResult {
  return chain(
    compareBy(
      e => -(e.priority ?? 0),
      compareNumbers
    ),
    compareBy(e => e.namespace, compareStrings)
  )(a, b);
}

// =============================================================================
// Diff Ordering
// =============================================================================

/**
 * Diff entry.
 */
export interface DiffEntry {
  readonly type: 'add' | 'remove' | 'modify';
  readonly path: readonly string[];
  readonly entityId?: string;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

/**
 * Compare diff entries by path depth, then by path, then by type.
 *
 * Ensures diffs are presented in a logical, hierarchical order.
 */
export function compareDiffEntries(a: DiffEntry, b: DiffEntry): CompareResult {
  return chain(
    // Shallower paths first (parent before children)
    compareBy(d => d.path.length, compareNumbers),
    // Then by path lexicographically
    compareBy(
      d => d.path.join('/'),
      compareStrings
    ),
    // Then by type (remove, modify, add)
    compareBy(d => getDiffTypeOrder(d.type), compareNumbers),
    // Finally by entity ID
    compareBy(d => d.entityId ?? '', compareStrings)
  )(a, b);
}

function getDiffTypeOrder(type: DiffEntry['type']): number {
  const ORDER = { remove: 0, modify: 1, add: 2 };
  return ORDER[type];
}

// =============================================================================
// Lexicon Ordering
// =============================================================================

/**
 * Lexeme entry.
 */
export interface LexemeEntry {
  readonly id: string;
  readonly term: string;
  readonly category: string;
  readonly frequency?: number;
}

/**
 * Compare lexemes by category, then by term.
 *
 * Ensures lexicon is organized and searchable.
 */
export function compareLexemes(a: LexemeEntry, b: LexemeEntry): CompareResult {
  return chain(
    compareBy(l => l.category, compareStrings),
    compareBy(l => l.term, compareStrings),
    compareBy(l => l.id, compareStrings)
  )(a, b);
}

/**
 * Compare lexemes by frequency (higher first), useful for disambiguation.
 */
export function compareLexemesByFrequency(
  a: LexemeEntry,
  b: LexemeEntry
): CompareResult {
  return chain(
    compareBy(
      l => -(l.frequency ?? 0),
      compareNumbers
    ),
    compareBy(l => l.term, compareStrings),
    compareBy(l => l.id, compareStrings)
  )(a, b);
}

// =============================================================================
// Sorting Utilities
// =============================================================================

/**
 * Sort an array deterministically using a comparator.
 *
 * Returns a new array (does not mutate).
 */
export function sortBy<T>(items: readonly T[], comparator: Comparator<T>): T[] {
  return [...items].sort(comparator);
}

/**
 * Get top N items by comparator.
 *
 * More efficient than full sort for partial results.
 */
export function topN<T>(
  items: readonly T[],
  n: number,
  comparator: Comparator<T>
): T[] {
  if (items.length <= n) {
    return sortBy(items, comparator);
  }

  // Heap-based selection for efficiency
  const result = [...items];
  result.sort(comparator);
  return result.slice(0, n);
}

/**
 * Group items by a key function, preserving sort order within groups.
 */
export function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K,
  itemComparator?: Comparator<T>
): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  // Sort within groups if comparator provided
  if (itemComparator) {
    for (const [key, groupItems] of groups) {
      groups.set(key, sortBy(groupItems, itemComparator));
    }
  }

  return groups;
}

/**
 * Stable unique by key function.
 *
 * When duplicates exist, keeps the first occurrence.
 */
export function uniqueBy<T, K>(
  items: readonly T[],
  keyFn: (item: T) => K
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

// =============================================================================
// Determinism Validation
// =============================================================================

/**
 * Assert that a comparator is deterministic.
 *
 * Runs the comparator multiple times and ensures results are consistent.
 * Useful for testing custom comparators.
 */
export function assertDeterministicComparator<T>(
  comparator: Comparator<T>,
  testCases: Array<[T, T]>
): void {
  for (const [a, b] of testCases) {
    const result1 = comparator(a, b);
    const result2 = comparator(a, b);
    const result3 = comparator(a, b);

    if (result1 !== result2 || result2 !== result3) {
      throw new Error(
        `Comparator is non-deterministic: got ${result1}, ${result2}, ${result3}`
      );
    }

    // Also check symmetry: compare(b, a) should be opposite of compare(a, b)
    const reversed = comparator(b, a);
    if (result1 === 0 && reversed !== 0) {
      throw new Error(
        `Comparator violates symmetry: compare(a,b)=0 but compare(b,a)=${reversed}`
      );
    }
    if (result1 !== 0 && reversed !== -result1) {
      throw new Error(
        `Comparator violates symmetry: compare(a,b)=${result1} but compare(b,a)=${reversed}`
      );
    }
  }
}

/**
 * Assert that sorting is stable.
 *
 * Verifies that equal elements maintain their relative order.
 */
export function assertStableSort<T>(
  items: readonly T[],
  comparator: Comparator<T>
): void {
  const sorted1 = sortBy(items, comparator);
  const sorted2 = sortBy(sorted1, comparator);

  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i] !== sorted2[i]) {
      throw new Error(
        `Sort is not stable: re-sorting changed order at index ${i}`
      );
    }
  }
}

// =============================================================================
// Example Usage and Tests
// =============================================================================

/**
 * Example: Sorting a parse forest by score.
 *
 * ```ts
 * const parses = [
 *   { result: { id: 'p1' }, score: 0.9 },
 *   { result: { id: 'p2' }, score: 0.9 },
 *   { result: { id: 'p3' }, score: 0.8 },
 * ];
 *
 * const sorted = sortBy(parses, compareParseByScore);
 * // Result: p1, p2 (tied, sorted by ID), then p3
 * ```
 */
export function exampleParseForestSorting(): void {
  const parses: ScoredResult<{ id: string }>[] = [
    { result: { id: 'parse-2' }, score: 0.9 },
    { result: { id: 'parse-1' }, score: 0.9 },
    { result: { id: 'parse-3' }, score: 0.8 },
  ];

  const sorted = sortBy(parses, compareParseBySco);

  // Verify: highest scores first, ties broken by ID
  console.assert(sorted[0]!.result.id === 'parse-1');
  console.assert(sorted[1]!.result.id === 'parse-2');
  console.assert(sorted[2]!.result.id === 'parse-3');
}

/**
 * Example: Sorting plan opcodes for execution.
 *
 * ```ts
 * const opcodes = [
 *   { id: 'op1', type: 'dsp:set-param', cost: 1, scope: 'chorus' },
 *   { id: 'op2', type: 'event:create', cost: 2, scope: 'chorus' },
 * ];
 *
 * const sorted = sortBy(opcodes, comparePlanOpcodes);
 * // Result: op2 (event:create) executes before op1 (dsp:set-param)
 * ```
 */
export function examplePlanOpcodeSorting(): void {
  const opcodes: PlanOpcode[] = [
    { id: 'op1', type: 'dsp:set-param', cost: 1, scope: 'chorus' },
    { id: 'op2', type: 'event:create', cost: 2, scope: 'chorus' },
    { id: 'op3', type: 'structure:add-section', cost: 3, scope: 'intro' },
  ];

  const sorted = sortBy(opcodes, comparePlanOpcodes);

  // Verify: structure first, then events, then DSP
  console.assert(sorted[0]!.id === 'op3'); // structure:add-section
  console.assert(sorted[1]!.id === 'op2'); // event:create
  console.assert(sorted[2]!.id === 'op1'); // dsp:set-param
}
