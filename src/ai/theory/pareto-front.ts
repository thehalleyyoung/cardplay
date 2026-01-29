/**
 * @fileoverview Pareto-Front Solution Computation (C088)
 *
 * When multiple soft constraints compete, the "best" solution may not exist.
 * Instead, we compute the Pareto front: the set of solutions where no solution
 * is dominated (worse on every criterion) by another.
 *
 * Use cases:
 * - Balancing film mood vs galant schema compliance
 * - Choosing between raga fidelity and Western harmonic richness (hybrid mode)
 * - Trading off ornament density vs tempo feasibility
 *
 * @module @cardplay/ai/theory/pareto-front
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * A solution with scores on multiple criteria.
 * Each criterion is named and has a numeric score (higher = better).
 */
export interface ParetoCandidate<T = unknown> {
  /** The solution value */
  readonly value: T;
  /** Scores on each criterion (higher is better) */
  readonly scores: Readonly<Record<string, number>>;
}

/**
 * A Pareto front result.
 */
export interface ParetoFrontResult<T = unknown> {
  /** Non-dominated solutions (the Pareto front) */
  readonly front: readonly ParetoCandidate<T>[];
  /** Dominated solutions */
  readonly dominated: readonly ParetoCandidate<T>[];
  /** Criteria names used */
  readonly criteria: readonly string[];
}

// ============================================================================
// CORE ALGORITHM
// ============================================================================

/**
 * Check if candidate A dominates candidate B.
 * A dominates B if A is >= B on all criteria and strictly > on at least one.
 */
export function dominates<T>(
  a: ParetoCandidate<T>,
  b: ParetoCandidate<T>,
  criteria: readonly string[]
): boolean {
  let strictlyBetterOnSome = false;

  for (const criterion of criteria) {
    const scoreA = a.scores[criterion] ?? 0;
    const scoreB = b.scores[criterion] ?? 0;

    if (scoreA < scoreB) {
      return false; // A is worse on this criterion
    }
    if (scoreA > scoreB) {
      strictlyBetterOnSome = true;
    }
  }

  return strictlyBetterOnSome;
}

/**
 * Compute the Pareto front from a set of candidates.
 *
 * @param candidates - Array of candidates with multi-criterion scores
 * @param criteria - Optional: explicit list of criteria to consider.
 *   If omitted, uses the union of all score keys from all candidates.
 * @returns The Pareto front (non-dominated set) and dominated solutions
 */
export function computeParetoFront<T>(
  candidates: readonly ParetoCandidate<T>[],
  criteria?: readonly string[]
): ParetoFrontResult<T> {
  if (candidates.length === 0) {
    return { front: [], dominated: [], criteria: criteria ?? [] };
  }

  // Determine criteria from data if not provided
  const allCriteria = criteria ?? extractCriteria(candidates);

  const front: ParetoCandidate<T>[] = [];
  const dominated: ParetoCandidate<T>[] = [];

  for (const candidate of candidates) {
    let isDominated = false;

    for (const other of candidates) {
      if (other === candidate) continue;
      if (dominates(other, candidate, allCriteria)) {
        isDominated = true;
        break;
      }
    }

    if (isDominated) {
      dominated.push(candidate);
    } else {
      front.push(candidate);
    }
  }

  return { front, dominated, criteria: allCriteria };
}

/**
 * Extract all unique criteria names from candidates.
 */
function extractCriteria<T>(candidates: readonly ParetoCandidate<T>[]): readonly string[] {
  const criteriaSet = new Set<string>();
  for (const candidate of candidates) {
    for (const key of Object.keys(candidate.scores)) {
      criteriaSet.add(key);
    }
  }
  return Array.from(criteriaSet).sort();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Rank Pareto front solutions using a weighted sum.
 * Useful for presenting a "best guess" when a single answer is needed.
 *
 * @param front - Pareto front candidates
 * @param weights - Weights for each criterion (default: equal weight)
 * @returns Candidates sorted by weighted score (best first)
 */
export function rankByWeightedSum<T>(
  front: readonly ParetoCandidate<T>[],
  weights?: Readonly<Record<string, number>>
): ParetoCandidate<T>[] {
  const criteria = extractCriteria(front);

  return [...front].sort((a, b) => {
    const scoreA = weightedSum(a, criteria, weights);
    const scoreB = weightedSum(b, criteria, weights);
    return scoreB - scoreA;
  });
}

function weightedSum<T>(
  candidate: ParetoCandidate<T>,
  criteria: readonly string[],
  weights?: Readonly<Record<string, number>>
): number {
  let sum = 0;
  for (const criterion of criteria) {
    const w = weights?.[criterion] ?? 1;
    const score = candidate.scores[criterion] ?? 0;
    sum += w * score;
  }
  return sum;
}

/**
 * Create a ParetoCandidate from a value and scoring function.
 */
export function candidate<T>(
  value: T,
  scores: Record<string, number>
): ParetoCandidate<T> {
  return { value, scores };
}

/**
 * Find the ideal point (maximum score on each criterion across all candidates).
 * Useful for computing distance-to-ideal metrics.
 */
export function idealPoint<T>(
  candidates: readonly ParetoCandidate<T>[]
): Record<string, number> {
  const criteria = extractCriteria(candidates);
  const ideal: Record<string, number> = {};

  for (const criterion of criteria) {
    ideal[criterion] = Math.max(
      ...candidates.map(c => c.scores[criterion] ?? 0)
    );
  }

  return ideal;
}

/**
 * Find the nadir point (minimum score on each criterion across the Pareto front).
 */
export function nadirPoint<T>(
  front: readonly ParetoCandidate<T>[]
): Record<string, number> {
  const criteria = extractCriteria(front);
  const nadir: Record<string, number> = {};

  for (const criterion of criteria) {
    nadir[criterion] = Math.min(
      ...front.map(c => c.scores[criterion] ?? 0)
    );
  }

  return nadir;
}

/**
 * Compute the crowding distance for solutions in the Pareto front.
 * Solutions with higher crowding distance are in less crowded regions.
 * Useful for selecting diverse solutions.
 */
export function crowdingDistances<T>(
  front: readonly ParetoCandidate<T>[]
): Map<ParetoCandidate<T>, number> {
  const distances = new Map<ParetoCandidate<T>, number>();

  if (front.length <= 2) {
    for (const c of front) {
      distances.set(c, Infinity);
    }
    return distances;
  }

  // Initialize distances
  for (const c of front) {
    distances.set(c, 0);
  }

  const criteria = extractCriteria(front);

  for (const criterion of criteria) {
    // Sort by this criterion
    const sorted = [...front].sort(
      (a, b) => (a.scores[criterion] ?? 0) - (b.scores[criterion] ?? 0)
    );

    // Boundary points get infinite distance
    distances.set(sorted[0]!, Infinity);
    distances.set(sorted[sorted.length - 1]!, Infinity);

    // Range for normalization
    const minScore = sorted[0]!.scores[criterion] ?? 0;
    const maxScore = sorted[sorted.length - 1]!.scores[criterion] ?? 0;
    const range = maxScore - minScore;

    if (range === 0) continue;

    // Interior points: distance is proportional to gap between neighbors
    for (let i = 1; i < sorted.length - 1; i++) {
      const prevScore = sorted[i - 1]!.scores[criterion] ?? 0;
      const nextScore = sorted[i + 1]!.scores[criterion] ?? 0;
      const current = distances.get(sorted[i]!) ?? 0;
      if (current !== Infinity) {
        distances.set(sorted[i]!, current + (nextScore - prevScore) / range);
      }
    }
  }

  return distances;
}
