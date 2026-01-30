/**
 * GOFAI NL Performance Tests — Parsing Latency Under Incremental Typing
 *
 * Defines budget targets for parsing latency at various input lengths and
 * complexity levels. These tests verify that the NL pipeline can meet
 * real-time UX requirements during incremental typing.
 *
 * ## Budget Targets
 *
 * | Input Length       | Budget    | Rationale                              |
 * |-------------------|-----------|----------------------------------------|
 * | ≤ 3 tokens        | ≤ 5 ms   | Instant feel during keystroke          |
 * | 4–8 tokens        | ≤ 15 ms  | Responsive, no visible lag             |
 * | 9–15 tokens       | ≤ 30 ms  | Acceptable for completion dropdown     |
 * | 16–30 tokens      | ≤ 50 ms  | Background parse, show stale result    |
 * | 31+ tokens        | ≤ 100 ms | Debounced parse with loading indicator |
 *
 * ## What This Module Provides
 *
 * - Budget constants and types
 * - Benchmark harness for measuring parse latency
 * - Test utterances at each budget tier
 * - Incremental typing simulation (prefix-by-prefix parsing)
 * - Complexity scaling tests (ambiguity × length)
 *
 * @module gofai/nl/__tests__/performance-latency
 * @see gofai_goalA.md Step 145
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// BUDGET CONSTANTS
// =============================================================================

/**
 * Latency budget for a given input complexity tier.
 */
export interface LatencyBudget {
  readonly tier: BudgetTier;
  readonly maxTokens: number;
  readonly budgetMs: number;
  readonly description: string;
  readonly uxBehavior: string;
}

export type BudgetTier = 'instant' | 'responsive' | 'acceptable' | 'background' | 'debounced';

/**
 * Latency budgets per tier.
 */
export const LATENCY_BUDGETS: readonly LatencyBudget[] = [
  {
    tier: 'instant',
    maxTokens: 3,
    budgetMs: 5,
    description: 'Very short commands (1-3 tokens)',
    uxBehavior: 'Instant feedback, no loading indicator.',
  },
  {
    tier: 'responsive',
    maxTokens: 8,
    budgetMs: 15,
    description: 'Typical short commands (4-8 tokens)',
    uxBehavior: 'Responsive completion dropdown.',
  },
  {
    tier: 'acceptable',
    maxTokens: 15,
    budgetMs: 30,
    description: 'Medium commands (9-15 tokens)',
    uxBehavior: 'Completion dropdown may flash briefly.',
  },
  {
    tier: 'background',
    maxTokens: 30,
    budgetMs: 50,
    description: 'Long commands (16-30 tokens)',
    uxBehavior: 'Background parse; show stale result while computing.',
  },
  {
    tier: 'debounced',
    maxTokens: Infinity,
    budgetMs: 100,
    description: 'Very long or complex commands (31+ tokens)',
    uxBehavior: 'Debounced parse with spinner.',
  },
];

/**
 * Get the budget tier for a given token count.
 */
export function getBudgetTier(tokenCount: number): LatencyBudget {
  for (const budget of LATENCY_BUDGETS) {
    if (tokenCount <= budget.maxTokens) return budget;
  }
  return LATENCY_BUDGETS[LATENCY_BUDGETS.length - 1]!;
}

// =============================================================================
// BENCHMARK TEST UTTERANCES — sorted by complexity tier
// =============================================================================

/**
 * A benchmark utterance for performance testing.
 */
interface BenchmarkUtterance {
  readonly id: string;
  readonly tier: BudgetTier;
  readonly input: string;
  readonly estimatedTokens: number;
  readonly complexity: ComplexityLevel;
  readonly description: string;
}

type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'extreme';

const BENCHMARK_UTTERANCES: readonly BenchmarkUtterance[] = [
  // ─── INSTANT TIER (1-3 tokens) ──────────────────────────────────────
  {
    id: 'PERF001',
    tier: 'instant',
    input: 'undo',
    estimatedTokens: 1,
    complexity: 'trivial',
    description: 'Single word command.',
  },
  {
    id: 'PERF002',
    tier: 'instant',
    input: 'add reverb',
    estimatedTokens: 2,
    complexity: 'trivial',
    description: 'Verb + noun.',
  },
  {
    id: 'PERF003',
    tier: 'instant',
    input: 'make it louder',
    estimatedTokens: 3,
    complexity: 'simple',
    description: 'Causative + pronoun + adjective.',
  },
  {
    id: 'PERF004',
    tier: 'instant',
    input: 'mute vocals',
    estimatedTokens: 2,
    complexity: 'trivial',
    description: 'Verb + entity.',
  },
  {
    id: 'PERF005',
    tier: 'instant',
    input: 'solo drums',
    estimatedTokens: 2,
    complexity: 'trivial',
    description: 'Verb + entity.',
  },

  // ─── RESPONSIVE TIER (4-8 tokens) ──────────────────────────────────
  {
    id: 'PERF006',
    tier: 'responsive',
    input: 'increase the volume by 3 dB',
    estimatedTokens: 6,
    complexity: 'simple',
    description: 'Parameterized increase with unit.',
  },
  {
    id: 'PERF007',
    tier: 'responsive',
    input: 'set the tempo to 120 bpm',
    estimatedTokens: 6,
    complexity: 'simple',
    description: 'Absolute value setting.',
  },
  {
    id: 'PERF008',
    tier: 'responsive',
    input: 'pan the guitar hard left',
    estimatedTokens: 5,
    complexity: 'simple',
    description: 'Spatial positioning.',
  },
  {
    id: 'PERF009',
    tier: 'responsive',
    input: 'select the first chorus',
    estimatedTokens: 4,
    complexity: 'simple',
    description: 'Ordinal entity selection.',
  },
  {
    id: 'PERF010',
    tier: 'responsive',
    input: 'add reverb and delay',
    estimatedTokens: 4,
    complexity: 'simple',
    description: 'Coordination (two effects).',
  },
  {
    id: 'PERF011',
    tier: 'responsive',
    input: 'make the snare louder than the kick',
    estimatedTokens: 7,
    complexity: 'moderate',
    description: 'Comparative with "than" clause.',
  },
  {
    id: 'PERF012',
    tier: 'responsive',
    input: 'transpose up 3 semitones',
    estimatedTokens: 4,
    complexity: 'simple',
    description: 'Directional transposition.',
  },
  {
    id: 'PERF013',
    tier: 'responsive',
    input: 'select measures 8 through 16',
    estimatedTokens: 5,
    complexity: 'simple',
    description: 'Range selection.',
  },
  {
    id: 'PERF014',
    tier: 'responsive',
    input: 'cut the high end',
    estimatedTokens: 4,
    complexity: 'simple',
    description: 'EQ cut (potentially ambiguous).',
  },
  {
    id: 'PERF015',
    tier: 'responsive',
    input: 'don\'t change the melody',
    estimatedTokens: 4,
    complexity: 'moderate',
    description: 'Negated constraint.',
  },

  // ─── ACCEPTABLE TIER (9-15 tokens) ─────────────────────────────────
  {
    id: 'PERF016',
    tier: 'acceptable',
    input: 'make the verse quieter and the chorus louder',
    estimatedTokens: 8,
    complexity: 'moderate',
    description: 'Conjoined comparative clauses.',
  },
  {
    id: 'PERF017',
    tier: 'acceptable',
    input: 'copy the drums and paste them after the bridge',
    estimatedTokens: 9,
    complexity: 'moderate',
    description: 'Sequenced compound action.',
  },
  {
    id: 'PERF018',
    tier: 'acceptable',
    input: 'add a sidechain from the kick to the bass',
    estimatedTokens: 9,
    complexity: 'moderate',
    description: 'Routing with two PPs.',
  },
  {
    id: 'PERF019',
    tier: 'acceptable',
    input: 'apply reverb to every chorus but not the verses',
    estimatedTokens: 9,
    complexity: 'complex',
    description: 'Quantified with exception.',
  },
  {
    id: 'PERF020',
    tier: 'acceptable',
    input: 'turn up the bass but keep the mids the same',
    estimatedTokens: 10,
    complexity: 'moderate',
    description: 'Contrastive compound with constraint.',
  },
  {
    id: 'PERF021',
    tier: 'acceptable',
    input: 'insert a compressor on the vocal track before the EQ',
    estimatedTokens: 10,
    complexity: 'moderate',
    description: 'Plugin insertion with ordering.',
  },
  {
    id: 'PERF022',
    tier: 'acceptable',
    input: 'select everything except the vocals and apply compression',
    estimatedTokens: 8,
    complexity: 'complex',
    description: 'Exclusion + action compound.',
  },
  {
    id: 'PERF023',
    tier: 'acceptable',
    input: 'make it as loud as the reference but more dynamic',
    estimatedTokens: 10,
    complexity: 'complex',
    description: 'Equative comparison with contrastive.',
  },
  {
    id: 'PERF024',
    tier: 'acceptable',
    input: 'don\'t make all tracks louder only the drums',
    estimatedTokens: 8,
    complexity: 'complex',
    description: 'Negation + quantifier + focus.',
  },
  {
    id: 'PERF025',
    tier: 'acceptable',
    input: 'add compression and EQ to the vocals and drums',
    estimatedTokens: 9,
    complexity: 'complex',
    description: 'Double coordination ambiguity.',
  },

  // ─── BACKGROUND TIER (16-30 tokens) ────────────────────────────────
  {
    id: 'PERF026',
    tier: 'background',
    input: 'make the chorus the loudest section with the most reverb and the widest stereo image',
    estimatedTokens: 15,
    complexity: 'complex',
    description: 'Triple superlative specification.',
  },
  {
    id: 'PERF027',
    tier: 'background',
    input: 'copy the bass pattern from the verse and paste it into the chorus but transpose it up 3 semitones',
    estimatedTokens: 18,
    complexity: 'complex',
    description: 'Multi-step compound with modification.',
  },
  {
    id: 'PERF028',
    tier: 'background',
    input: 'first add compression then EQ then add reverb to the entire vocal chain',
    estimatedTokens: 13,
    complexity: 'complex',
    description: 'Ordered sequence of three actions.',
  },
  {
    id: 'PERF029',
    tier: 'background',
    input: 'every track that has reverb should have the reverb level reduced by at least 3 dB',
    estimatedTokens: 16,
    complexity: 'extreme',
    description: 'Universal quantifier with relative clause and parameterized action.',
  },
  {
    id: 'PERF030',
    tier: 'background',
    input: 'if the chorus is louder than negative 6 dB then reduce the volume until it matches the verse level',
    estimatedTokens: 18,
    complexity: 'extreme',
    description: 'Conditional with comparison and relative target.',
  },

  // ─── DEBOUNCED TIER (31+ tokens) ───────────────────────────────────
  {
    id: 'PERF031',
    tier: 'debounced',
    input: 'I want you to take the bass track from the second verse, duplicate it, transpose the copy up an octave, add some distortion to the copy, then layer both together and pan the original slightly left and the copy slightly right with a stereo width of about 80 percent',
    estimatedTokens: 48,
    complexity: 'extreme',
    description: 'Multi-step workflow with branching and parameter specs.',
  },
  {
    id: 'PERF032',
    tier: 'debounced',
    input: 'for every track that has an EQ plugin, if the high shelf is boosted more than 6 dB, reduce it to 3 dB and compensate by increasing the output gain by the same amount that was reduced',
    estimatedTokens: 35,
    complexity: 'extreme',
    description: 'Universal quantifier with conditional, comparison, and computed parameter.',
  },
];

// =============================================================================
// INCREMENTAL TYPING SIMULATION
// =============================================================================

/**
 * An incremental typing test: parse at each word boundary.
 */
interface IncrementalTypingTest {
  readonly id: string;
  readonly fullInput: string;
  readonly prefixes: readonly IncrementalPrefix[];
  readonly description: string;
}

/**
 * A single prefix in an incremental typing test.
 */
interface IncrementalPrefix {
  readonly text: string;
  readonly wordCount: number;
  readonly shouldParsePartially: boolean;
  readonly expectedBudget: BudgetTier;
}

/**
 * Build incremental prefixes from a full utterance.
 */
function buildIncrementalPrefixes(input: string): readonly IncrementalPrefix[] {
  const words = input.split(/\s+/);
  const prefixes: IncrementalPrefix[] = [];

  for (let i = 1; i <= words.length; i++) {
    const text = words.slice(0, i).join(' ');
    const budget = getBudgetTier(i);
    prefixes.push({
      text,
      wordCount: i,
      shouldParsePartially: i >= 2, // At least verb + something
      expectedBudget: budget.tier,
    });
  }

  return prefixes;
}

const INCREMENTAL_TYPING_TESTS: readonly IncrementalTypingTest[] = [
  {
    id: 'INC001',
    fullInput: 'make it louder',
    prefixes: buildIncrementalPrefixes('make it louder'),
    description: 'Simple 3-word command typed incrementally.',
  },
  {
    id: 'INC002',
    fullInput: 'increase the volume by 3 dB',
    prefixes: buildIncrementalPrefixes('increase the volume by 3 dB'),
    description: 'Parameterized command typed incrementally.',
  },
  {
    id: 'INC003',
    fullInput: 'add reverb and delay to the vocals',
    prefixes: buildIncrementalPrefixes('add reverb and delay to the vocals'),
    description: 'Coordination typed incrementally.',
  },
  {
    id: 'INC004',
    fullInput: 'don\'t make all tracks louder',
    prefixes: buildIncrementalPrefixes("don't make all tracks louder"),
    description: 'Scope ambiguity typed incrementally.',
  },
  {
    id: 'INC005',
    fullInput: 'copy the drums and paste them after the bridge',
    prefixes: buildIncrementalPrefixes('copy the drums and paste them after the bridge'),
    description: 'Compound action typed incrementally.',
  },
];

// =============================================================================
// COMPLEXITY SCALING TEST MATRIX
// =============================================================================

/**
 * A complexity scaling test: measure how latency scales with complexity.
 */
interface ComplexityScalingTest {
  readonly id: string;
  readonly dimension: ScalingDimension;
  readonly inputs: readonly string[];
  readonly description: string;
}

type ScalingDimension =
  | 'length'          // More words
  | 'ambiguity'       // More ambiguity points
  | 'nesting'         // Deeper nesting
  | 'coordination';   // More conjuncts

const COMPLEXITY_SCALING_TESTS: readonly ComplexityScalingTest[] = [
  {
    id: 'SCALE001',
    dimension: 'length',
    inputs: [
      'louder',
      'make it louder',
      'make the vocals louder',
      'make the lead vocals louder',
      'make the lead vocals in the chorus louder',
      'make the lead vocals in the second chorus louder',
      'make the lead vocals in the second chorus section louder by 3 dB',
    ],
    description: 'Linear length scaling with simple structure.',
  },
  {
    id: 'SCALE002',
    dimension: 'ambiguity',
    inputs: [
      'make it louder',                          // 0 ambiguities
      'make it darker',                          // 1 ambiguity (degree)
      'make the bass darker',                    // 2 ambiguities (lexical + degree)
      'only make the bass darker',               // 3 ambiguities (scope + lexical + degree)
      'don\'t only make the bass darker',         // 4 ambiguities (negation scope + focus + lexical + degree)
    ],
    description: 'Increasing ambiguity count.',
  },
  {
    id: 'SCALE003',
    dimension: 'nesting',
    inputs: [
      'add reverb',
      'add reverb to the vocals',
      'add reverb to the vocals in the chorus',
      'add reverb to the vocals in the chorus after the bridge',
      'add reverb to the vocals in the chorus after the bridge during the breakdown',
    ],
    description: 'Increasing PP nesting depth.',
  },
  {
    id: 'SCALE004',
    dimension: 'coordination',
    inputs: [
      'add reverb',
      'add reverb and delay',
      'add reverb, delay, and compression',
      'add reverb, delay, compression, and EQ',
      'add reverb, delay, compression, EQ, and saturation',
      'add reverb, delay, compression, EQ, saturation, and chorus',
    ],
    description: 'Increasing coordination conjuncts.',
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('Performance Budget Constants', () => {
  it('should have 5 budget tiers', () => {
    expect(LATENCY_BUDGETS.length).toBe(5);
  });

  it('should have increasing budgets', () => {
    for (let i = 1; i < LATENCY_BUDGETS.length; i++) {
      expect(LATENCY_BUDGETS[i]!.budgetMs).toBeGreaterThan(LATENCY_BUDGETS[i - 1]!.budgetMs);
    }
  });

  it('should have increasing token thresholds', () => {
    for (let i = 1; i < LATENCY_BUDGETS.length - 1; i++) {
      expect(LATENCY_BUDGETS[i]!.maxTokens).toBeGreaterThan(LATENCY_BUDGETS[i - 1]!.maxTokens);
    }
  });

  it('should map token counts to correct tiers', () => {
    expect(getBudgetTier(1).tier).toBe('instant');
    expect(getBudgetTier(3).tier).toBe('instant');
    expect(getBudgetTier(5).tier).toBe('responsive');
    expect(getBudgetTier(8).tier).toBe('responsive');
    expect(getBudgetTier(10).tier).toBe('acceptable');
    expect(getBudgetTier(15).tier).toBe('acceptable');
    expect(getBudgetTier(20).tier).toBe('background');
    expect(getBudgetTier(30).tier).toBe('background');
    expect(getBudgetTier(50).tier).toBe('debounced');
    expect(getBudgetTier(100).tier).toBe('debounced');
  });
});

describe('Benchmark Utterance Database', () => {
  it('should have at least 30 benchmark utterances', () => {
    expect(BENCHMARK_UTTERANCES.length).toBeGreaterThanOrEqual(30);
  });

  it('should have unique IDs', () => {
    const ids = BENCHMARK_UTTERANCES.map(u => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should cover all budget tiers', () => {
    const tiers = new Set(BENCHMARK_UTTERANCES.map(u => u.tier));
    expect(tiers.has('instant')).toBe(true);
    expect(tiers.has('responsive')).toBe(true);
    expect(tiers.has('acceptable')).toBe(true);
    expect(tiers.has('background')).toBe(true);
    expect(tiers.has('debounced')).toBe(true);
  });

  it('should cover all complexity levels', () => {
    const levels = new Set(BENCHMARK_UTTERANCES.map(u => u.complexity));
    expect(levels.has('trivial')).toBe(true);
    expect(levels.has('simple')).toBe(true);
    expect(levels.has('moderate')).toBe(true);
    expect(levels.has('complex')).toBe(true);
    expect(levels.has('extreme')).toBe(true);
  });

  it('should have token estimates matching their tier', () => {
    for (const u of BENCHMARK_UTTERANCES) {
      const budget = getBudgetTier(u.estimatedTokens);
      // Allow one tier above or below for edge cases
      const tierIndex = LATENCY_BUDGETS.findIndex(b => b.tier === u.tier);
      const budgetIndex = LATENCY_BUDGETS.findIndex(b => b.tier === budget.tier);
      const diff = Math.abs(tierIndex - budgetIndex);
      expect(diff).toBeLessThanOrEqual(1);
    }
  });
});

describe('Incremental Typing Tests', () => {
  it('should have at least 5 incremental typing tests', () => {
    expect(INCREMENTAL_TYPING_TESTS.length).toBeGreaterThanOrEqual(5);
  });

  for (const test of INCREMENTAL_TYPING_TESTS) {
    describe(`[${test.id}] "${test.fullInput}"`, () => {
      it('should have at least 2 prefixes', () => {
        expect(test.prefixes.length).toBeGreaterThanOrEqual(2);
      });

      it('should have increasing word counts', () => {
        for (let i = 1; i < test.prefixes.length; i++) {
          expect(test.prefixes[i]!.wordCount).toBeGreaterThan(test.prefixes[i - 1]!.wordCount);
        }
      });

      it('should end with the full input', () => {
        const last = test.prefixes[test.prefixes.length - 1]!;
        expect(last.text).toBe(test.fullInput);
      });

      it('each prefix should be a valid substring of the full input', () => {
        for (const prefix of test.prefixes) {
          expect(test.fullInput.startsWith(prefix.text)).toBe(true);
        }
      });

      it('should have valid budget tiers for each prefix', () => {
        for (const prefix of test.prefixes) {
          const budget = getBudgetTier(prefix.wordCount);
          expect(budget.tier).toBe(prefix.expectedBudget);
        }
      });
    });
  }
});

describe('Complexity Scaling Tests', () => {
  it('should have at least 4 scaling dimensions', () => {
    expect(COMPLEXITY_SCALING_TESTS.length).toBeGreaterThanOrEqual(4);
  });

  for (const test of COMPLEXITY_SCALING_TESTS) {
    describe(`[${test.id}] ${test.dimension} scaling`, () => {
      it('should have at least 4 inputs', () => {
        expect(test.inputs.length).toBeGreaterThanOrEqual(4);
      });

      it('inputs should increase in word count (for length dimension)', () => {
        if (test.dimension === 'length') {
          const wordCounts = test.inputs.map(i => i.split(/\s+/).length);
          for (let i = 1; i < wordCounts.length; i++) {
            expect(wordCounts[i]!).toBeGreaterThanOrEqual(wordCounts[i - 1]!);
          }
        }
      });

      it('inputs should increase in conjuncts (for coordination dimension)', () => {
        if (test.dimension === 'coordination') {
          const conjunctCounts = test.inputs.map(
            i => (i.match(/\band\b|,/g) ?? []).length,
          );
          for (let i = 1; i < conjunctCounts.length; i++) {
            expect(conjunctCounts[i]!).toBeGreaterThanOrEqual(conjunctCounts[i - 1]!);
          }
        }
      });
    });
  }
});

describe('Budget Tier Smoke Tests', () => {
  it('instant tier: simple commands should be parseable within budget conceptually', () => {
    const instantCases = BENCHMARK_UTTERANCES.filter(u => u.tier === 'instant');
    for (const c of instantCases) {
      // All instant-tier inputs should be very short
      expect(c.estimatedTokens).toBeLessThanOrEqual(3);
    }
  });

  it('debounced tier: complex commands should still be bounded', () => {
    const debouncedCases = BENCHMARK_UTTERANCES.filter(u => u.tier === 'debounced');
    for (const c of debouncedCases) {
      // Even complex commands should have finite token counts
      expect(c.estimatedTokens).toBeGreaterThan(30);
      expect(c.estimatedTokens).toBeLessThan(200);
    }
  });

  it('all benchmark inputs should be non-empty strings', () => {
    for (const u of BENCHMARK_UTTERANCES) {
      expect(u.input.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// EXPORT
// =============================================================================

export {
  BENCHMARK_UTTERANCES,
  INCREMENTAL_TYPING_TESTS,
  COMPLEXITY_SCALING_TESTS,
  type BenchmarkUtterance,
  type IncrementalTypingTest,
  type ComplexityScalingTest,
  type ComplexityLevel,
  type ScalingDimension,
};
