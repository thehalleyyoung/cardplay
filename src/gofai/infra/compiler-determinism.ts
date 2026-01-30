/**
 * @file Compiler Determinism Rules
 * @gofai_goalB Step 033 [Infra]
 * 
 * This module defines and enforces determinism rules for the GOFAI compiler.
 * The compiler must produce identical outputs for identical inputs, enabling:
 * - Reproducible builds
 * - Reliable testing
 * - Predictable user experience
 * - Sharable edit packages
 * - Audit trails
 * 
 * **Core principle:** If the compiler produces multiple valid outputs, it must
 * either (a) choose deterministically using stable tie-breakers, or (b) present
 * all options to the user for explicit choice.
 * 
 * **Purpose:**
 * - Document all sources of non-determinism
 * - Provide enforceable policies
 * - Enable verification (replay tests)
 * - Support offline operation (no network jitter)
 */

/**
 * =============================================================================
 * DETERMINISM PRINCIPLES
 * =============================================================================
 */

/**
 * Core determinism principles for the GOFAI compiler.
 */
export const DETERMINISM_PRINCIPLES = {
  /**
   * Principle 1: No random choices in compilation.
   * 
   * Random number generation is FORBIDDEN in:
   * - Parsing
   * - Semantic composition
   * - Pragmatic resolution
   * - Planning
   * - Constraint validation
   * 
   * Exception: Execution MAY use randomness for musical effects (humanize),
   * but the random seed must be deterministic from input state.
   */
  NO_RANDOM_CHOICES: 'no_random_choices' as const,

  /**
   * Principle 2: No timestamps in deterministic paths.
   * 
   * Date.now() and performance.now() are FORBIDDEN in:
   * - CPL generation
   * - Plan generation
   * - Constraint checking
   * 
   * Exception: Timestamps are allowed in metadata/provenance (not affecting logic).
   */
  NO_TIMESTAMPS_IN_LOGIC: 'no_timestamps_in_logic' as const,

  /**
   * Principle 3: Stable tie-breakers for ambiguity.
   * 
   * When multiple parses/plans are equally valid, choose deterministically:
   * - Lexicographic ordering
   * - Numerical ordering
   * - Rule priority (explicit in grammar)
   * - Cost-based ranking (ties broken by secondary criteria)
   * 
   * Never: Hash randomization, insertion order, pointer addresses.
   */
  STABLE_TIE_BREAKERS: 'stable_tie_breakers' as const,

  /**
   * Principle 4: No network calls in runtime path.
   * 
   * Network requests introduce jitter and non-determinism.
   * All knowledge bases must be bundled offline.
   * 
   * Exception: Optional telemetry (after compilation, user-consented).
   */
  NO_NETWORK_CALLS: 'no_network_calls' as const,

  /**
   * Principle 5: Explicit ambiguity presentation.
   * 
   * When the compiler cannot choose deterministically, it must:
   * - Present top K options to user
   * - Use stable ranking
   * - Allow explicit selection
   * 
   * Never: Pick arbitrarily without user knowledge.
   */
  EXPLICIT_AMBIGUITY: 'explicit_ambiguity' as const,

  /**
   * Principle 6: Input-only dependencies.
   * 
   * Compiler output depends ONLY on:
   * - User utterance
   * - Project state
   * - Compiler version
   * - Enabled extensions
   * 
   * Never: Environment variables, file system state, system clock (except metadata).
   */
  INPUT_ONLY_DEPENDENCIES: 'input_only_dependencies' as const,

  /**
   * Principle 7: Stable ordering everywhere.
   * 
   * All collections must have deterministic iteration order:
   * - Sort by stable key before iteration
   * - Use ordered maps (not insertion-order Maps)
   * - Document ordering guarantees
   */
  STABLE_ORDERING: 'stable_ordering' as const,
} as const;

/**
 * =============================================================================
 * SOURCES OF NON-DETERMINISM (BANNED)
 * =============================================================================
 */

/**
 * Banned sources of non-determinism in the compiler.
 */
export interface BannedSource {
  /** Source name */
  readonly name: string;
  /** Why it's banned */
  readonly reason: string;
  /** How to replace it */
  readonly replacement: string;
  /** Example violation */
  readonly example: string;
}

export const BANNED_SOURCES: readonly BannedSource[] = [
  {
    name: 'Math.random()',
    reason: 'Non-deterministic random number generation',
    replacement: 'Use seeded PRNG with deterministic seed from input',
    example: 'const choice = items[Math.floor(Math.random() * items.length)]; // BANNED',
  },
  {
    name: 'Date.now() in logic',
    reason: 'Clock-dependent timestamps',
    replacement: 'Use logical turn counter or explicit time from input',
    example: 'const id = `node-${Date.now()}`; // BANNED in CPL generation',
  },
  {
    name: 'performance.now() in logic',
    reason: 'Clock-dependent timing',
    replacement: 'Use logical sequence numbers',
    example: 'const priority = performance.now(); // BANNED for ordering',
  },
  {
    name: 'Object.keys() iteration',
    reason: 'Implementation-dependent ordering',
    replacement: 'Sort keys explicitly: Object.keys(obj).sort()',
    example: 'for (const key of Object.keys(obj)) { ... } // BANNED without sort',
  },
  {
    name: 'Map iteration order',
    reason: 'Insertion order (not stable)',
    replacement: 'Convert to sorted array: Array.from(map).sort()',
    example: 'for (const [k, v] of map) { ... } // BANNED without sort',
  },
  {
    name: 'Set iteration order',
    reason: 'Insertion order (not stable)',
    replacement: 'Convert to sorted array: Array.from(set).sort()',
    example: 'for (const item of set) { ... } // BANNED without sort',
  },
  {
    name: 'fetch() / XMLHttpRequest',
    reason: 'Network calls introduce jitter',
    replacement: 'Bundle data offline; use cached lookups',
    example: 'const data = await fetch(url); // BANNED in compiler',
  },
  {
    name: 'Pointer addresses',
    reason: 'Memory layout is non-deterministic',
    replacement: 'Use stable IDs based on content',
    example: 'const id = obj.toString(); // BANNED if gives address',
  },
  {
    name: 'process.env in logic',
    reason: 'Environment-dependent behavior',
    replacement: 'Pass config explicitly as input',
    example: 'if (process.env.DEBUG) { ... } // BANNED for logic changes',
  },
  {
    name: 'fs.readFile() in runtime',
    reason: 'File system state is mutable',
    replacement: 'Load all data at initialization; bundle resources',
    example: 'const lex = JSON.parse(fs.readFileSync("lex.json")); // BANNED in runtime',
  },
] as const;

/**
 * =============================================================================
 * ALLOWED SOURCES (WITH CONSTRAINTS)
 * =============================================================================
 */

/**
 * Allowed sources that appear non-deterministic but are acceptable with constraints.
 */
export interface AllowedSource {
  /** Source name */
  readonly name: string;
  /** Under what conditions it's allowed */
  readonly condition: string;
  /** Required constraints */
  readonly constraints: readonly string[];
}

export const ALLOWED_SOURCES: readonly AllowedSource[] = [
  {
    name: 'Date.now() in metadata',
    condition: 'Only for timestamps in provenance/logs',
    constraints: [
      'Never affects CPL content',
      'Never affects plan selection',
      'Only for human-readable timestamps',
      'Stripped before deterministic comparisons',
    ],
  },
  {
    name: 'Seeded PRNG in execution',
    condition: 'Only for musical humanization/variation',
    constraints: [
      'Seed derived deterministically from input',
      'Same seed produces same output',
      'Document seed derivation',
      'Only in execution phase (not planning)',
    ],
  },
  {
    name: 'Hash functions',
    condition: 'For caching and deduplication',
    constraints: [
      'Use stable hash algorithm (SHA-256, not SipHash)',
      'Never use for ordering (only equality)',
      'Document hash inputs',
    ],
  },
  {
    name: 'Stable sorting',
    condition: 'For ordering with explicit comparators',
    constraints: [
      'Always provide explicit comparator',
      'Comparator must be total order',
      'Document sort key',
      'Use stable sort algorithm',
    ],
  },
] as const;

/**
 * =============================================================================
 * TIE-BREAKING STRATEGIES
 * =============================================================================
 */

/**
 * Strategy for breaking ties when multiple candidates are equally valid.
 */
export interface TieBreakerStrategy {
  /** Strategy name */
  readonly name: string;
  /** When to use this strategy */
  readonly useCase: string;
  /** How it works */
  readonly mechanism: string;
  /** Example */
  readonly example: string;
}

export const TIE_BREAKER_STRATEGIES: readonly TieBreakerStrategy[] = [
  {
    name: 'Lexicographic',
    useCase: 'When candidates are strings',
    mechanism: 'Sort by string comparison (locale-independent)',
    example: 'candidates.sort((a, b) => a.localeCompare(b, "en-US"))',
  },
  {
    name: 'Numerical',
    useCase: 'When candidates have numeric keys',
    mechanism: 'Sort by numeric value (ascending)',
    example: 'candidates.sort((a, b) => a.cost - b.cost)',
  },
  {
    name: 'Rule priority',
    useCase: 'When grammar rules have explicit priorities',
    mechanism: 'Sort by rule priority (higher priority first)',
    example: 'parses.sort((a, b) => b.rule.priority - a.rule.priority)',
  },
  {
    name: 'Cost + lexicographic',
    useCase: 'When plans have costs and ties exist',
    mechanism: 'Sort by cost first, then by stable ID',
    example: 'plans.sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))',
  },
  {
    name: 'Provenance depth',
    useCase: 'When multiple semantic interpretations exist',
    mechanism: 'Prefer interpretation with fewer pragmatic hops',
    example: 'meanings.sort((a, b) => a.hops - b.hops)',
  },
  {
    name: 'Salience score',
    useCase: 'When resolving anaphora',
    mechanism: 'Sort by salience (recency + focus), ties by ID',
    example: 'referents.sort((a, b) => b.salience - a.salience || a.id.localeCompare(b.id))',
  },
  {
    name: 'User preference',
    useCase: 'When user has expressed preferences',
    mechanism: 'Apply user preference weights, then default tie-breaker',
    example: 'candidates.sort((a, b) => score(b, prefs) - score(a, prefs))',
  },
] as const;

/**
 * =============================================================================
 * AMBIGUITY RESOLUTION POLICY
 * =============================================================================
 */

/**
 * Policy for handling ambiguity in the compiler.
 */
export interface AmbiguityPolicy {
  /** Ambiguity type */
  readonly type: string;
  /** Action to take */
  readonly action: 'choose_deterministically' | 'present_options' | 'fail';
  /** Rationale */
  readonly rationale: string;
}

export const AMBIGUITY_POLICIES: readonly AmbiguityPolicy[] = [
  {
    type: 'Parse ambiguity (2-3 parses)',
    action: 'choose_deterministically',
    rationale: 'Use rule priority and cost; log alternatives for debugging',
  },
  {
    type: 'Parse ambiguity (4+ parses)',
    action: 'present_options',
    rationale: 'Too ambiguous; user must clarify',
  },
  {
    type: 'Anaphora ambiguity (1 clear referent)',
    action: 'choose_deterministically',
    rationale: 'Use salience model',
  },
  {
    type: 'Anaphora ambiguity (multiple plausible referents)',
    action: 'present_options',
    rationale: 'Ask "Did you mean X or Y?"',
  },
  {
    type: 'Plan ambiguity (plans differ in cost)',
    action: 'choose_deterministically',
    rationale: 'Pick lowest cost plan',
  },
  {
    type: 'Plan ambiguity (plans tied in cost)',
    action: 'present_options',
    rationale: 'Let user choose approach',
  },
  {
    type: 'Constraint conflict',
    action: 'fail',
    rationale: 'Cannot satisfy contradictory constraints; require user to relax',
  },
  {
    type: 'Underspecified goal',
    action: 'present_options',
    rationale: 'Ask for clarification (amount, scope, etc.)',
  },
] as const;

/**
 * =============================================================================
 * DETERMINISM VERIFICATION
 * =============================================================================
 */

/**
 * Configuration for determinism verification.
 */
export interface DeterminismCheckConfig {
  /** Number of replays to perform */
  readonly numReplays: number;
  /** Whether to check timestamps (should be stripped) */
  readonly checkTimestamps: boolean;
  /** Whether to check provenance stability */
  readonly checkProvenance: boolean;
  /** Tolerance for floating point comparisons */
  readonly floatTolerance: number;
}

/**
 * Default determinism check configuration.
 */
export const DEFAULT_DETERMINISM_CHECK_CONFIG: DeterminismCheckConfig = {
  numReplays: 3,
  checkTimestamps: false,
  checkProvenance: true,
  floatTolerance: 1e-10,
};

/**
 * Result of a determinism check.
 */
export interface DeterminismCheckResult {
  /** Whether the check passed */
  readonly deterministic: boolean;
  /** Differences found (if any) */
  readonly differences: readonly string[];
  /** Number of replays performed */
  readonly replays: number;
}

/**
 * Check determinism by replaying compilation multiple times.
 */
export function checkDeterminism(
  compile: (input: unknown) => unknown,
  input: unknown,
  config: DeterminismCheckConfig = DEFAULT_DETERMINISM_CHECK_CONFIG
): DeterminismCheckResult {
  const outputs: unknown[] = [];

  for (let i = 0; i < config.numReplays; i++) {
    const output = compile(input);
    outputs.push(output);
  }

  // Compare all outputs
  const differences: string[] = [];
  const baseline = outputs[0];

  for (let i = 1; i < outputs.length; i++) {
    const diff = compareOutputs(baseline, outputs[i], config);
    if (diff.length > 0) {
      differences.push(`Replay ${i} differs from baseline: ${diff.join(', ')}`);
    }
  }

  return {
    deterministic: differences.length === 0,
    differences,
    replays: config.numReplays,
  };
}

/**
 * Compare two compiler outputs for equality.
 */
function compareOutputs(
  a: unknown,
  b: unknown,
  config: DeterminismCheckConfig,
  path: string = 'root'
): string[] {
  const differences: string[] = [];

  // Handle null/undefined
  if (a === null && b === null) return [];
  if (a === undefined && b === undefined) return [];
  if ((a === null) !== (b === null)) {
    differences.push(`${path}: null mismatch`);
    return differences;
  }
  if ((a === undefined) !== (b === undefined)) {
    differences.push(`${path}: undefined mismatch`);
    return differences;
  }

  // Handle primitive types
  if (typeof a !== 'object' || typeof b !== 'object') {
    if (typeof a === 'number' && typeof b === 'number') {
      if (Math.abs(a - b) > config.floatTolerance) {
        differences.push(`${path}: ${a} !== ${b}`);
      }
      return differences;
    }
    if (a !== b) {
      differences.push(`${path}: ${String(a)} !== ${String(b)}`);
    }
    return differences;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      differences.push(`${path}: array length ${a.length} !== ${b.length}`);
      return differences;
    }
    for (let i = 0; i < a.length; i++) {
      const subPath = `${path}[${i}]`;
      differences.push(...compareOutputs(a[i], b[i], config, subPath));
    }
    return differences;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    differences.push(`${path}: array mismatch`);
    return differences;
  }

  // Handle objects
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  // Skip timestamps if configured
  const aKeys = Object.keys(aObj).filter(
    (k) => config.checkTimestamps || !k.includes('timestamp')
  );
  const bKeys = Object.keys(bObj).filter(
    (k) => config.checkTimestamps || !k.includes('timestamp')
  );

  // Check keys
  const aKeySet = new Set(aKeys);
  const bKeySet = new Set(bKeys);

  for (const key of Array.from(aKeySet)) {
    if (!bKeySet.has(key)) {
      differences.push(`${path}.${key}: missing in b`);
    }
  }

  for (const key of Array.from(bKeySet)) {
    if (!aKeySet.has(key)) {
      differences.push(`${path}.${key}: missing in a`);
    }
  }

  // Compare values
  for (const key of aKeys) {
    if (bKeySet.has(key)) {
      const subPath = `${path}.${key}`;
      differences.push(...compareOutputs(aObj[key], bObj[key], config, subPath));
    }
  }

  return differences;
}

/**
 * =============================================================================
 * STABLE SORTING UTILITIES
 * =============================================================================
 */

/**
 * Stable sort with explicit comparator.
 */
export function stableSort<T>(
  items: readonly T[],
  comparator: (a: T, b: T) => number
): readonly T[] {
  // Add index to ensure stability
  const indexed = items.map((item, index) => ({ item, index }));

  indexed.sort((a, b) => {
    const cmp = comparator(a.item, b.item);
    if (cmp !== 0) return cmp;
    return a.index - b.index; // Stable tie-breaker
  });

  return indexed.map((x) => x.item);
}

/**
 * Sort object keys alphabetically (for deterministic iteration).
 */
export function sortedKeys<T extends object>(obj: T): readonly (keyof T)[] {
  return (Object.keys(obj) as (keyof T)[]).sort((a, b) =>
    String(a).localeCompare(String(b), 'en-US')
  );
}

/**
 * Sort map entries by key (for deterministic iteration).
 */
export function sortedMapEntries<K, V>(map: Map<K, V>): ReadonlyArray<[K, V]> {
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b, 'en-US');
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b), 'en-US');
  });
}

/**
 * Sort set items (for deterministic iteration).
 */
export function sortedSetItems<T>(set: Set<T>): readonly T[] {
  return Array.from(set).sort((a, b) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b, 'en-US');
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b), 'en-US');
  });
}

/**
 * =============================================================================
 * DETERMINISTIC ID GENERATION
 * =============================================================================
 */

/**
 * Counter-based ID generator (for deterministic IDs).
 */
export class DeterministicIdGenerator {
  private counters: Map<string, number> = new Map();

  /**
   * Generate a deterministic ID with a prefix.
   */
  public generate(prefix: string): string {
    const current = this.counters.get(prefix) ?? 0;
    this.counters.set(prefix, current + 1);
    return `${prefix}-${current}`;
  }

  /**
   * Reset all counters (for testing).
   */
  public reset(): void {
    this.counters.clear();
  }
}

/**
 * Content-based ID generator (for stable IDs based on content).
 */
export function contentBasedId(content: unknown): string {
  // Simple deterministic hash (not cryptographic)
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  return `content-${Math.abs(hash).toString(36)}`;
}

/**
 * =============================================================================
 * COMPILER ENVIRONMENT FINGERPRINT
 * =============================================================================
 */

/**
 * Compiler environment (all factors affecting determinism).
 */
export interface CompilerEnvironment {
  /** GOFAI compiler version */
  readonly compilerVersion: string;
  /** CPL schema version */
  readonly cplSchemaVersion: string;
  /** Enabled extension namespaces and versions */
  readonly extensions: Map<string, string>;
  /** Lexicon fingerprint (hash of all lexicon tables) */
  readonly lexiconFingerprint: string;
  /** Grammar fingerprint (hash of all grammar rules) */
  readonly grammarFingerprint: string;
  /** Prolog KB fingerprint (hash of all Prolog modules) */
  readonly prologFingerprint: string;
}

/**
 * Create a fingerprint of the compiler environment.
 */
export function createCompilerFingerprint(env: CompilerEnvironment): string {
  const parts = [
    `compiler:${env.compilerVersion}`,
    `cpl:${env.cplSchemaVersion}`,
    `lexicon:${env.lexiconFingerprint}`,
    `grammar:${env.grammarFingerprint}`,
    `prolog:${env.prologFingerprint}`,
    ...sortedMapEntries(env.extensions).map(([ns, ver]) => `ext:${ns}@${ver}`),
  ];
  return parts.join('|');
}

/**
 * Check if two compiler environments are compatible.
 */
export function areEnvironmentsCompatible(
  a: CompilerEnvironment,
  b: CompilerEnvironment
): boolean {
  // Must have same compiler version (for now; could relax with migrations)
  if (a.compilerVersion !== b.compilerVersion) {
    return false;
  }

  // Must have same CPL schema version
  if (a.cplSchemaVersion !== b.cplSchemaVersion) {
    return false;
  }

  // Must have compatible extensions
  const aExtensions = Array.from(a.extensions.keys());
  const bExtensions = new Set(b.extensions.keys());

  for (const ns of aExtensions) {
    if (bExtensions.has(ns) && a.extensions.get(ns) !== b.extensions.get(ns)) {
      return false;
    }
  }

  return true;
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines comprehensive determinism rules for the GOFAI compiler:
 * 
 * **Principles:**
 * - No random choices
 * - No timestamps in logic
 * - Stable tie-breakers
 * - No network calls
 * - Explicit ambiguity
 * - Input-only dependencies
 * - Stable ordering
 * 
 * **Banned sources:**
 * - Math.random()
 * - Date.now() in logic
 * - Unordered iteration (Object.keys, Map, Set)
 * - Network calls
 * - Environment variables in logic
 * 
 * **Tie-breaking strategies:**
 * - Lexicographic
 * - Numerical
 * - Rule priority
 * - Cost + secondary criteria
 * - Salience score
 * - User preferences
 * 
 * **Ambiguity policies:**
 * - Choose deterministically when possible
 * - Present options when ambiguous
 * - Fail on conflicts
 * 
 * **Verification:**
 * - Replay tests
 * - Output comparison
 * - Environment fingerprinting
 * 
 * **Utilities:**
 * - Stable sorting
 * - Deterministic ID generation
 * - Content-based IDs
 * - Compiler fingerprinting
 * 
 * These rules enable:
 * - Reproducible builds
 * - Reliable testing
 * - Shareable edit packages
 * - Audit trails
 * - Offline operation
 * 
 * **Cross-references:**
 * - Step 007: CPL schema versioning
 * - Step 024: Deterministic ordering (infra implementation)
 * - Step 032: CPL as public interface (stable serialization)
 * - Step 047: Evaluation harness (replay tests)
 * - Step 465: Replay determinism CI test
 */
