/**
 * GOFAI Shipping Offline Compiler Checklist
 *
 * Step 050 from gofai_goalB.md: "Create a final checklist for 'shipping offline
 * compiler': no network calls in runtime path; deterministic builds; audit logs."
 *
 * This is the SSOT checklist that must be satisfied before GOFAI can be released
 * as a production-ready offline compiler.
 *
 * @module gofai/infra/shipping-offline-compiler-checklist
 */

// =============================================================================
// Checklist Item Types
// =============================================================================

/**
 * A single checklist item.
 */
export interface ChecklistItem {
  /** Stable item ID */
  readonly id: ChecklistItemId;

  /** Display name */
  readonly name: string;

  /** Category */
  readonly category: ChecklistCategory;

  /** Detailed description */
  readonly description: string;

  /** How to verify this requirement */
  readonly verification: string;

  /** Related files/modules to check */
  readonly relatedModules: readonly string[];

  /** Related tests that enforce this */
  readonly relatedTests: readonly string[];

  /** Whether this blocks MVP */
  readonly blocksMVP: boolean;

  /** Whether this blocks production release */
  readonly blocksProduction: boolean;

  /** Priority level */
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Checklist item identifiers.
 */
export type ChecklistItemId =
  // Network isolation
  | 'no_network_in_parse'
  | 'no_network_in_semantics'
  | 'no_network_in_planning'
  | 'no_network_in_execution'
  | 'no_external_assets'
  | 'bundled_knowledge_bases'
  // Determinism
  | 'deterministic_parse'
  | 'deterministic_planning'
  | 'deterministic_execution'
  | 'no_date_now_in_semantics'
  | 'no_random_in_core'
  | 'stable_id_generation'
  | 'stable_ordering'
  // Audit and provenance
  | 'audit_log_api'
  | 'provenance_tracking'
  | 'replay_capability'
  | 'version_fingerprinting'
  | 'edit_package_serialization'
  // Safety
  | 'constraint_enforcement'
  | 'scope_validation'
  | 'undo_roundtrip_tests'
  | 'no_silent_mutations'
  | 'fail_closed_on_error'
  // Build and deployment
  | 'reproducible_builds'
  | 'asset_bundling'
  | 'size_budgets'
  | 'cold_start_performance'
  | 'memory_caps'
  // Testing
  | 'golden_suite_coverage'
  | 'paraphrase_tests'
  | 'constraint_tests'
  | 'undo_redo_tests'
  | 'fuzz_testing'
  // Documentation
  | 'architecture_docs'
  | 'vocabulary_docs'
  | 'extension_spec'
  | 'offline_guarantees_doc';

/**
 * Checklist categories.
 */
export type ChecklistCategory =
  | 'network_isolation'
  | 'determinism'
  | 'audit'
  | 'safety'
  | 'build'
  | 'testing'
  | 'documentation';

// =============================================================================
// The Checklist
// =============================================================================

/**
 * Complete shipping checklist for offline GOFAI compiler.
 */
export const SHIPPING_CHECKLIST: readonly ChecklistItem[] = [
  // ===== Network Isolation =====
  {
    id: 'no_network_in_parse',
    name: 'No Network Calls in Parsing',
    category: 'network_isolation',
    description: 'The parser must operate entirely offline with bundled lexicon and grammar',
    verification: 'Run parser tests with network disabled; grep for fetch/http in nl/ modules',
    relatedModules: ['src/gofai/nl/**'],
    relatedTests: ['nl/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_network_in_semantics',
    name: 'No Network Calls in Semantics',
    category: 'network_isolation',
    description: 'Semantic composition must use only local knowledge bases',
    verification: 'Run semantic tests with network disabled; check for async external calls',
    relatedModules: ['src/gofai/nl/semantics/**'],
    relatedTests: ['nl/semantics/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_network_in_planning',
    name: 'No Network Calls in Planning',
    category: 'network_isolation',
    description: 'Planner must use only local Prolog KB and lever mappings',
    verification: 'Run planning tests with network disabled; verify Prolog is consulted locally',
    relatedModules: ['src/gofai/planning/**'],
    relatedTests: ['planning/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_network_in_execution',
    name: 'No Network Calls in Execution',
    category: 'network_isolation',
    description: 'Execution must only mutate local project state',
    verification: 'Run execution tests with network disabled; check all host actions are local',
    relatedModules: ['src/gofai/execution/**'],
    relatedTests: ['execution/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_external_assets',
    name: 'No External Asset Dependencies',
    category: 'network_isolation',
    description: 'All runtime assets must be bundled (no CDN, no remote files)',
    verification: 'Audit build output; verify all imports resolve to local/bundled modules',
    relatedModules: ['vite.config.ts', 'package.json'],
    relatedTests: ['scripts/check-external-deps.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'bundled_knowledge_bases',
    name: 'Bundled Knowledge Bases',
    category: 'network_isolation',
    description: 'All Prolog KB files and lexicon data must be bundled into build',
    verification: 'Check dist/ output contains .pl files and vocab JSON; measure bundle size',
    relatedModules: ['src/ai/knowledge/**/*.pl', 'src/gofai/canon/**/*.ts'],
    relatedTests: ['scripts/check-bundle-completeness.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },

  // ===== Determinism =====
  {
    id: 'deterministic_parse',
    name: 'Deterministic Parsing',
    category: 'determinism',
    description: 'Same utterance must produce identical parse forest across runs',
    verification: 'Run each golden utterance 10 times; assert byte-identical serialization',
    relatedModules: ['src/gofai/nl/parse/**'],
    relatedTests: ['nl/parse/determinism.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'deterministic_planning',
    name: 'Deterministic Planning',
    category: 'determinism',
    description: 'Same CPL-Intent must produce identical plan across runs',
    verification: 'Run planning golden suite 10 times; compare plan fingerprints',
    relatedModules: ['src/gofai/planning/**'],
    relatedTests: ['planning/determinism.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'deterministic_execution',
    name: 'Deterministic Execution',
    category: 'determinism',
    description: 'Same plan must produce identical state mutations across runs',
    verification: 'Apply same plan 10 times to same fixture; compare state snapshots',
    relatedModules: ['src/gofai/execution/**'],
    relatedTests: ['execution/determinism.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_date_now_in_semantics',
    name: 'No Date.now() in Semantics',
    category: 'determinism',
    description: 'Wall-clock time must not affect CPL generation or planning',
    verification: 'Grep for Date.now/performance.now in nl/semantics and planning; allow only in metadata',
    relatedModules: ['src/gofai/nl/semantics/**', 'src/gofai/planning/**'],
    relatedTests: ['scripts/lint-no-nondeterminism.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_random_in_core',
    name: 'No Random in Core Pipeline',
    category: 'determinism',
    description: 'Math.random must not be used in parse/semantics/planning',
    verification: 'Grep for Math.random in core modules; allow only in fuzzing/test utilities',
    relatedModules: ['src/gofai/nl/**', 'src/gofai/planning/**'],
    relatedTests: ['scripts/lint-no-nondeterminism.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'stable_id_generation',
    name: 'Stable ID Generation',
    category: 'determinism',
    description: 'Entity IDs must be deterministic or explicitly versioned',
    verification: 'Check ID generation functions; ensure UUIDs are seeded or content-addressed',
    relatedModules: ['src/gofai/canon/id-generation.ts'],
    relatedTests: ['canon/id-generation.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'stable_ordering',
    name: 'Stable Output Ordering',
    category: 'determinism',
    description: 'All collections must be sorted deterministically',
    verification: 'Check that all output arrays use deterministic comparators',
    relatedModules: ['src/gofai/infra/deterministic-ordering.ts'],
    relatedTests: ['infra/deterministic-ordering.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },

  // ===== Audit and Provenance =====
  {
    id: 'audit_log_api',
    name: 'Audit Log API',
    category: 'audit',
    description: 'All critical operations must be logged to audit trail',
    verification: 'Check that parse/plan/execute emit audit events; test log completeness',
    relatedModules: ['src/gofai/pipeline/audit-logger.ts'],
    relatedTests: ['pipeline/audit-logger.test.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'provenance_tracking',
    name: 'Provenance Tracking',
    category: 'audit',
    description: 'Every CPL node and plan step must carry provenance to original lexeme/rule',
    verification: 'Check CPL types include provenance fields; test provenance extraction',
    relatedModules: ['src/gofai/pipeline/provenance.ts', 'src/gofai/cpl/ast.ts'],
    relatedTests: ['pipeline/provenance.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'replay_capability',
    name: 'Replay Capability',
    category: 'audit',
    description: 'Conversations can be replayed from logs for debugging/testing',
    verification: 'Export conversation log; replay on same fixture; assert identical outputs',
    relatedModules: ['src/gofai/pipeline/replay.ts'],
    relatedTests: ['pipeline/replay.test.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },
  {
    id: 'version_fingerprinting',
    name: 'Compiler Version Fingerprinting',
    category: 'audit',
    description: 'Each edit package records compiler version fingerprint',
    verification: 'Check EditPackage includes compiler version; test version extraction',
    relatedModules: ['src/gofai/canon/version-fingerprint.ts'],
    relatedTests: ['canon/version-fingerprint.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'edit_package_serialization',
    name: 'Edit Package Serialization',
    category: 'audit',
    description: 'Edit packages can be serialized and deserialized stably',
    verification: 'Serialize and deserialize EditPackages; assert roundtrip stability',
    relatedModules: ['src/gofai/execution/edit-package.ts'],
    relatedTests: ['execution/edit-package-serialization.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },

  // ===== Safety =====
  {
    id: 'constraint_enforcement',
    name: 'Constraint Enforcement',
    category: 'safety',
    description: 'All declared constraints must be validated after execution',
    verification: 'Run constraint test suite; assert 100% violation detection rate',
    relatedModules: ['src/gofai/execution/constraint-validation.ts'],
    relatedTests: ['execution/constraint-validation.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'scope_validation',
    name: 'Scope Validation',
    category: 'safety',
    description: 'Edits must only touch entities within declared scope',
    verification: 'Run scope tests; verify diffs contain only in-scope entities',
    relatedModules: ['src/gofai/execution/scope-enforcement.ts'],
    relatedTests: ['execution/scope-enforcement.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'undo_roundtrip_tests',
    name: 'Undo Roundtrip Tests',
    category: 'safety',
    description: 'apply → undo → redo must preserve state exactly',
    verification: 'Run undo roundtrip test suite; assert 100% pass rate',
    relatedModules: ['src/gofai/trust/undo.ts'],
    relatedTests: ['trust/undo-roundtrip.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'no_silent_mutations',
    name: 'No Silent Mutations',
    category: 'safety',
    description: 'All state changes must go through EditPackage with explicit apply',
    verification: 'Audit execution code; ensure no direct store mutations',
    relatedModules: ['src/gofai/execution/**'],
    relatedTests: ['scripts/lint-no-direct-mutations.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'fail_closed_on_error',
    name: 'Fail Closed on Error',
    category: 'safety',
    description: 'Errors must never result in partial state changes',
    verification: 'Test error paths; verify state unchanged when execution fails',
    relatedModules: ['src/gofai/execution/apply.ts'],
    relatedTests: ['execution/error-handling.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },

  // ===== Build and Deployment =====
  {
    id: 'reproducible_builds',
    name: 'Reproducible Builds',
    category: 'build',
    description: 'Same source commit must produce byte-identical build outputs',
    verification: 'Build twice from same commit; compare checksums',
    relatedModules: ['vite.config.ts', 'package.json'],
    relatedTests: ['scripts/verify-reproducible-build.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'asset_bundling',
    name: 'Asset Bundling',
    category: 'build',
    description: 'All required assets bundled into single offline package',
    verification: 'Build and run offline; verify no missing imports or assets',
    relatedModules: ['vite.config.ts'],
    relatedTests: ['scripts/check-offline-capability.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'size_budgets',
    name: 'Size Budgets',
    category: 'build',
    description: 'Bundle sizes must stay within defined limits',
    verification: 'Check dist/ size against budgets (main < 5MB, lexicon < 10MB)',
    relatedModules: ['vite.config.ts'],
    relatedTests: ['scripts/check-size-budgets.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },
  {
    id: 'cold_start_performance',
    name: 'Cold Start Performance',
    category: 'build',
    description: 'Initial lexicon/grammar load must complete within time budget',
    verification: 'Measure time from app start to first ready state; target < 2s',
    relatedModules: ['src/gofai/nl/index.ts'],
    relatedTests: ['performance/cold-start.test.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },
  {
    id: 'memory_caps',
    name: 'Memory Caps',
    category: 'build',
    description: 'Parse forests and caches must stay within memory limits',
    verification: 'Profile memory under load; verify < 500MB for typical workloads',
    relatedModules: ['src/gofai/nl/parse/forest.ts'],
    relatedTests: ['performance/memory-usage.test.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },

  // ===== Testing =====
  {
    id: 'golden_suite_coverage',
    name: 'Golden Suite Coverage',
    category: 'testing',
    description: 'At least 100 golden utterance→CPL examples with stable expected outputs',
    verification: 'Count golden test cases; run suite and verify 100% pass',
    relatedModules: ['src/gofai/tests/golden/**'],
    relatedTests: ['tests/golden/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'paraphrase_tests',
    name: 'Paraphrase Test Coverage',
    category: 'testing',
    description: 'Each golden utterance has at least 3 paraphrases producing identical CPL',
    verification: 'Run paraphrase suite; verify >= 90% paraphrase invariance',
    relatedModules: ['src/gofai/tests/paraphrase/**'],
    relatedTests: ['tests/paraphrase/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'constraint_tests',
    name: 'Constraint Safety Tests',
    category: 'testing',
    description: 'Tests verify constraints cannot be violated by any plan',
    verification: 'Run constraint violation test suite; assert 0 violations',
    relatedModules: ['src/gofai/tests/constraints/**'],
    relatedTests: ['tests/constraints/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'undo_redo_tests',
    name: 'Undo/Redo Test Coverage',
    category: 'testing',
    description: 'All plan types tested for undo/redo roundtrip fidelity',
    verification: 'Run undo/redo suite on all opcode types; verify 100% pass',
    relatedModules: ['src/gofai/tests/undo/**'],
    relatedTests: ['tests/undo/**/*.test.ts'],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'critical',
  },
  {
    id: 'fuzz_testing',
    name: 'Fuzz Testing',
    category: 'testing',
    description: 'Random input generation to catch crashes and edge cases',
    verification: 'Run fuzzer for 1000+ random utterances; verify no crashes',
    relatedModules: ['src/gofai/tests/fuzz/**'],
    relatedTests: ['tests/fuzz/**/*.test.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },

  // ===== Documentation =====
  {
    id: 'architecture_docs',
    name: 'Architecture Documentation',
    category: 'documentation',
    description: 'Complete docs/gofai/ with architecture, pipeline, and module structure',
    verification: 'Review docs/gofai/ completeness; ensure all modules documented',
    relatedModules: ['docs/gofai/**'],
    relatedTests: ['scripts/check-docs-completeness.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'high',
  },
  {
    id: 'vocabulary_docs',
    name: 'Vocabulary Documentation',
    category: 'documentation',
    description: 'All lexemes and axes documented with examples',
    verification: 'Generate vocab report; verify coverage against lexeme table',
    relatedModules: ['docs/gofai/vocabulary/**'],
    relatedTests: ['scripts/generate-vocab-docs.ts'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },
  {
    id: 'extension_spec',
    name: 'Extension Specification',
    category: 'documentation',
    description: 'Complete extension API spec with examples',
    verification: 'Review docs/gofai/extensions.md; ensure end-to-end example',
    relatedModules: ['docs/gofai/extensions.md'],
    relatedTests: ['examples/gofai-extension/**'],
    blocksMVP: false,
    blocksProduction: true,
    priority: 'medium',
  },
  {
    id: 'offline_guarantees_doc',
    name: 'Offline Guarantees Documentation',
    category: 'documentation',
    description: 'Document what "offline" means and how it is enforced',
    verification: 'Review docs/gofai/offline-guarantees.md; verify all claims testable',
    relatedModules: ['docs/gofai/offline-guarantees.md'],
    relatedTests: [],
    blocksMVP: true,
    blocksProduction: true,
    priority: 'high',
  },
] as const;

// =============================================================================
// Checklist Utilities
// =============================================================================

/**
 * Get a checklist item by ID.
 */
export function getChecklistItem(id: ChecklistItemId): ChecklistItem | undefined {
  return SHIPPING_CHECKLIST.find(item => item.id === id);
}

/**
 * Get all items in a category.
 */
export function getChecklistItemsByCategory(category: ChecklistCategory): readonly ChecklistItem[] {
  return SHIPPING_CHECKLIST.filter(item => item.category === category);
}

/**
 * Get all MVP-blocking items.
 */
export function getMVPBlockingItems(): readonly ChecklistItem[] {
  return SHIPPING_CHECKLIST.filter(item => item.blocksMVP);
}

/**
 * Get all production-blocking items.
 */
export function getProductionBlockingItems(): readonly ChecklistItem[] {
  return SHIPPING_CHECKLIST.filter(item => item.blocksProduction);
}

/**
 * Get all items by priority.
 */
export function getChecklistItemsByPriority(
  priority: 'critical' | 'high' | 'medium' | 'low'
): readonly ChecklistItem[] {
  return SHIPPING_CHECKLIST.filter(item => item.priority === priority);
}

/**
 * Get critical-priority items.
 */
export function getCriticalItems(): readonly ChecklistItem[] {
  return getChecklistItemsByPriority('critical');
}

/**
 * Checklist completion status.
 */
export interface ChecklistStatus {
  /** Total items */
  readonly total: number;

  /** Items marked complete */
  readonly complete: number;

  /** Items blocking MVP */
  readonly mvpBlocking: number;

  /** Items blocking production */
  readonly productionBlocking: number;

  /** Critical items */
  readonly critical: number;

  /** Completion percentage */
  readonly percentComplete: number;
}

/**
 * Calculate checklist status.
 *
 * @param completedIds - Set of completed item IDs
 */
export function getChecklistStatus(completedIds: Set<ChecklistItemId>): ChecklistStatus {
  const total = SHIPPING_CHECKLIST.length;
  const complete = SHIPPING_CHECKLIST.filter(item => completedIds.has(item.id)).length;
  const mvpBlocking = getMVPBlockingItems().length;
  const productionBlocking = getProductionBlockingItems().length;
  const critical = getCriticalItems().length;

  return {
    total,
    complete,
    mvpBlocking,
    productionBlocking,
    critical,
    percentComplete: (complete / total) * 100,
  };
}

/**
 * Generate a human-readable checklist report.
 */
export function generateChecklistReport(completedIds: Set<ChecklistItemId>): string {
  const status = getChecklistStatus(completedIds);
  const lines: string[] = [];

  lines.push('# GOFAI Offline Compiler Shipping Checklist');
  lines.push('');
  lines.push(`**Overall Progress:** ${status.complete}/${status.total} (${status.percentComplete.toFixed(1)}%)`);
  lines.push(`**MVP Blocking Items:** ${status.mvpBlocking}`);
  lines.push(`**Production Blocking Items:** ${status.productionBlocking}`);
  lines.push(`**Critical Priority Items:** ${status.critical}`);
  lines.push('');

  // Group by category
  const categories: ChecklistCategory[] = [
    'network_isolation',
    'determinism',
    'audit',
    'safety',
    'build',
    'testing',
    'documentation',
  ];

  for (const category of categories) {
    const items = getChecklistItemsByCategory(category);
    const completed = items.filter(item => completedIds.has(item.id));

    lines.push(`## ${categoryDisplayName(category)}`);
    lines.push(`${completed.length}/${items.length} complete`);
    lines.push('');

    for (const item of items) {
      const checkbox = completedIds.has(item.id) ? '[x]' : '[ ]';
      const priority = item.priority === 'critical' ? ' 🔴' : item.priority === 'high' ? ' 🟡' : '';
      const blocking = item.blocksMVP ? ' (MVP blocking)' : item.blocksProduction ? ' (Prod blocking)' : '';
      lines.push(`${checkbox} **${item.name}**${priority}${blocking}`);
      lines.push(`   ${item.description}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Get display name for category.
 */
function categoryDisplayName(category: ChecklistCategory): string {
  switch (category) {
    case 'network_isolation':
      return 'Network Isolation';
    case 'determinism':
      return 'Determinism';
    case 'audit':
      return 'Audit & Provenance';
    case 'safety':
      return 'Safety';
    case 'build':
      return 'Build & Deployment';
    case 'testing':
      return 'Testing';
    case 'documentation':
      return 'Documentation';
  }
}
