/**
 * @fileoverview Query Batching for Multiple Related Queries (L370)
 *
 * Provides a batching utility that collects multiple Prolog queries and
 * executes them sequentially on a shared adapter instance. Since Tau Prolog
 * is single-threaded, true parallelism is not possible, but batching reduces
 * overhead by:
 *
 * - Sharing a single adapter reference across all queries
 * - Collecting all results into a Map keyed by caller-supplied id
 * - Providing a fluent API for building multi-query calls
 *
 * Usage:
 * ```ts
 * const results = await createQueryBatch()
 *   .add('scales', 'scale(Name, Notes)')
 *   .add('chords', 'chord(Name, Notes)')
 *   .execute();
 *
 * const scaleResult = results.get('scales');
 * ```
 *
 * @see L370 - Add query batching for multiple related queries
 * @module @cardplay/ai/engine/query-batch
 */

import { PrologAdapter, PrologSolution, getPrologAdapter } from './prolog-adapter';

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single item in a query batch.
 *
 * @see L370
 */
export interface BatchQueryItem {
  /** The Prolog query string to execute. */
  readonly queryString: string;
  /** A caller-supplied identifier used to look up results. */
  readonly id: string;
}

/**
 * The result of executing a single query within a batch.
 *
 * @see L370
 */
export interface BatchQueryResult {
  /** The caller-supplied identifier for this query. */
  readonly id: string;
  /** All solutions returned by the query. */
  readonly solutions: readonly PrologSolution[];
  /** Whether the query succeeded (at least one solution found). */
  readonly success: boolean;
  /** Error message if the query failed. */
  readonly error?: string;
  /** Time taken for this individual query in milliseconds. */
  readonly timeMs: number;
}

/**
 * A batch of Prolog queries that can be built fluently and executed together.
 *
 * Queries are added via {@link QueryBatch.add} and executed together via
 * {@link QueryBatch.execute}. Results are returned as a Map keyed by the
 * caller-supplied id strings.
 *
 * @see L370
 */
export interface QueryBatch {
  /**
   * Add a query to the batch.
   *
   * @param id - A unique identifier for looking up the result.
   * @param queryString - The Prolog query string.
   * @returns This batch instance for fluent chaining.
   */
  add(id: string, queryString: string): QueryBatch;

  /**
   * Execute all queued queries sequentially on the adapter and return
   * a Map of results keyed by their ids.
   *
   * @returns A readonly Map from query id to {@link BatchQueryResult}.
   */
  execute(): Promise<ReadonlyMap<string, BatchQueryResult>>;

  /**
   * Return the number of queries currently in the batch.
   */
  size(): number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Internal implementation of {@link QueryBatch}.
 */
class QueryBatchImpl implements QueryBatch {
  private readonly items: BatchQueryItem[] = [];
  private readonly adapter: PrologAdapter;

  constructor(adapter: PrologAdapter) {
    this.adapter = adapter;
  }

  add(id: string, queryString: string): QueryBatch {
    this.items.push({ id, queryString });
    return this;
  }

  async execute(): Promise<ReadonlyMap<string, BatchQueryResult>> {
    const results = new Map<string, BatchQueryResult>();

    for (const item of this.items) {
      const startTime = performance.now();
      try {
        const queryResult = await this.adapter.query(item.queryString);
        const timeMs = performance.now() - startTime;

        const batchResult: BatchQueryResult = {
          id: item.id,
          solutions: queryResult.solutions,
          success: queryResult.success,
          ...(queryResult.error !== undefined ? { error: queryResult.error } : {}),
          timeMs,
        };

        results.set(item.id, batchResult);
      } catch (err: unknown) {
        const timeMs = performance.now() - startTime;
        const message =
          err instanceof Error ? err.message : String(err);

        results.set(item.id, {
          id: item.id,
          solutions: [],
          success: false,
          error: message,
          timeMs,
        });
      }
    }

    return results;
  }

  size(): number {
    return this.items.length;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new query batch.
 *
 * If no adapter is provided, the singleton from {@link getPrologAdapter} is
 * used. All queries added to the batch share this single adapter reference,
 * reducing per-query overhead when issuing many related queries.
 *
 * @param adapter - Optional {@link PrologAdapter} instance. Defaults to the
 *   singleton adapter.
 * @returns A new empty {@link QueryBatch}.
 *
 * @example
 * ```ts
 * const results = await createQueryBatch()
 *   .add('key', 'current_key(Key)')
 *   .add('tempo', 'current_tempo(Tempo)')
 *   .add('mode', 'current_mode(Mode)')
 *   .execute();
 *
 * for (const [id, result] of results) {
 *   console.log(id, result.success, result.solutions);
 * }
 * ```
 *
 * @see L370 - Add query batching for multiple related queries
 */
export function createQueryBatch(adapter?: PrologAdapter): QueryBatch {
  return new QueryBatchImpl(adapter ?? getPrologAdapter());
}
