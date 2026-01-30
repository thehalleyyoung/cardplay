/**
 * GOFAI Infrastructure — Build Matrix
 *
 * Step 006 from gofai_goalB.md: "Create a 'GOFAI build matrix' mapping
 * features to required tests (unit, golden NL→CPL, paraphrase invariance,
 * safety diffs, UX interaction tests)."
 *
 * This module defines the mapping between features and required test types,
 * ensuring every feature has comprehensive test coverage before shipping.
 *
 * @module gofai/infra/build-matrix
 */

// =============================================================================
// Test Types
// =============================================================================

/**
 * All test types in the GOFAI build matrix.
 */
export type TestType =
  | 'unit'                    // Individual component tests
  | 'golden_nl_to_cpl'       // Golden NL→CPL mapping tests
  | 'paraphrase_invariance'  // Same intent under different phrasings
  | 'safety_diff'            // Diffs must respect constraints
  | 'ux_interaction'         // UI interaction tests
  | 'undo_roundtrip'         // apply→undo→redo roundtrips
  | 'constraint_correctness' // Constraints never violated
  | 'determinism_replay'     // Same input → same output
  | 'performance_budget'     // Within latency budgets
  | 'property_based'         // Property-based / QuickCheck style
  | 'fuzz'                   // Fuzz testing
  | 'integration'            // Multi-component integration
  | 'canon_drift'            // Code/docs alignment
  | 'extension_isolation';   // Extension safety

// =============================================================================
// Feature Domains
// =============================================================================

/**
 * Feature domains in the GOFAI system.
 */
export type FeatureDomain =
  | 'canon_vocabulary'
  | 'normalization'
  | 'tokenization'
  | 'parsing'
  | 'semantic_composition'
  | 'pragmatic_resolution'
  | 'typecheck_validation'
  | 'planning'
  | 'execution'
  | 'diff_generation'
  | 'undo_redo'
  | 'constraint_verification'
  | 'clarification'
  | 'extension_registry'
  | 'extension_auto_binding'
  | 'extension_prolog'
  | 'extension_opcodes'
  | 'ui_deck'
  | 'ui_plan_preview'
  | 'ui_diff_viewer'
  | 'ui_clarification'
  | 'pipeline_integration'
  | 'serialization'
  | 'migration';

// =============================================================================
// Build Matrix Entry
// =============================================================================

/**
 * A build matrix entry mapping a feature to its required tests.
 */
export interface BuildMatrixEntry {
  /** Feature domain */
  readonly domain: FeatureDomain;

  /** Feature name */
  readonly feature: string;

  /** Required test types */
  readonly requiredTests: readonly TestType[];

  /** Optional/recommended test types */
  readonly recommendedTests: readonly TestType[];

  /** Test file pattern (glob) */
  readonly testFilePattern: string;

  /** Whether this feature blocks release if tests fail */
  readonly blocksRelease: boolean;

  /** Description */
  readonly description: string;
}

// =============================================================================
// The Build Matrix
// =============================================================================

/**
 * The complete GOFAI build matrix.
 *
 * Every feature must have its required tests passing before merging.
 */
export const GOFAI_BUILD_MATRIX: readonly BuildMatrixEntry[] = [
  // ===== Canon Vocabulary =====
  {
    domain: 'canon_vocabulary',
    feature: 'Lexeme table integrity',
    requiredTests: ['unit', 'canon_drift'],
    recommendedTests: ['property_based'],
    testFilePattern: 'src/gofai/tests/canon/**/*.test.ts',
    blocksRelease: true,
    description: 'All lexeme entries have valid IDs, unique lemmas, and documented semantics',
  },
  {
    domain: 'canon_vocabulary',
    feature: 'Axis vocabulary integrity',
    requiredTests: ['unit', 'canon_drift'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/canon/**/*.test.ts',
    blocksRelease: true,
    description: 'All perceptual axes have valid IDs, poles, and lever mappings',
  },
  {
    domain: 'canon_vocabulary',
    feature: 'Section/layer vocabulary',
    requiredTests: ['unit', 'canon_drift'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/canon/**/*.test.ts',
    blocksRelease: true,
    description: 'Section and layer vocabulary tables are internally consistent',
  },
  {
    domain: 'canon_vocabulary',
    feature: 'Opcode registry',
    requiredTests: ['unit', 'canon_drift'],
    recommendedTests: ['property_based'],
    testFilePattern: 'src/gofai/tests/canon/**/*.test.ts',
    blocksRelease: true,
    description: 'Every opcode has valid params, effect types, and documentation',
  },
  {
    domain: 'canon_vocabulary',
    feature: 'Vocabulary policy enforcement',
    requiredTests: ['unit', 'property_based'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/canon/**/*.test.ts',
    blocksRelease: true,
    description: 'Namespace validation, reserved prefix enforcement, collision detection',
  },

  // ===== NL Pipeline =====
  {
    domain: 'normalization',
    feature: 'Input normalization',
    requiredTests: ['unit', 'golden_nl_to_cpl'],
    recommendedTests: ['fuzz'],
    testFilePattern: 'src/gofai/tests/nl/normalize*.test.ts',
    blocksRelease: true,
    description: 'Synonym replacement, unit normalization, punctuation canonicalization',
  },
  {
    domain: 'tokenization',
    feature: 'Tokenizer',
    requiredTests: ['unit', 'golden_nl_to_cpl'],
    recommendedTests: ['fuzz', 'property_based'],
    testFilePattern: 'src/gofai/tests/nl/tokenize*.test.ts',
    blocksRelease: true,
    description: 'Token production with correct spans and categories',
  },
  {
    domain: 'parsing',
    feature: 'Grammar rules',
    requiredTests: ['unit', 'golden_nl_to_cpl', 'paraphrase_invariance'],
    recommendedTests: ['fuzz', 'performance_budget'],
    testFilePattern: 'src/gofai/tests/nl/grammar*.test.ts',
    blocksRelease: true,
    description: 'All grammar constructions parse correctly with disambiguation',
  },
  {
    domain: 'semantic_composition',
    feature: 'Syntax→CPL mapping',
    requiredTests: ['unit', 'golden_nl_to_cpl', 'paraphrase_invariance'],
    recommendedTests: ['property_based'],
    testFilePattern: 'src/gofai/tests/nl/semantics*.test.ts',
    blocksRelease: true,
    description: 'Parse trees correctly compose into CPL-Intent with provenance',
  },

  // ===== Pragmatics =====
  {
    domain: 'pragmatic_resolution',
    feature: 'Reference resolution',
    requiredTests: ['unit', 'golden_nl_to_cpl', 'integration'],
    recommendedTests: ['fuzz'],
    testFilePattern: 'src/gofai/tests/nl/pragmatics*.test.ts',
    blocksRelease: true,
    description: 'Pronouns, demonstratives, and named references resolve correctly',
  },
  {
    domain: 'pragmatic_resolution',
    feature: 'Scope default rules',
    requiredTests: ['unit', 'golden_nl_to_cpl'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/nl/pragmatics*.test.ts',
    blocksRelease: true,
    description: 'Default scope assignment follows documented rules',
  },
  {
    domain: 'clarification',
    feature: 'Clarification questions',
    requiredTests: ['unit', 'golden_nl_to_cpl', 'ux_interaction'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/nl/clarification*.test.ts',
    blocksRelease: true,
    description: 'Ambiguity triggers correct clarification questions with options',
  },

  // ===== Typecheck =====
  {
    domain: 'typecheck_validation',
    feature: 'CPL validation',
    requiredTests: ['unit', 'property_based'],
    recommendedTests: ['fuzz'],
    testFilePattern: 'src/gofai/tests/cpl/validate*.test.ts',
    blocksRelease: true,
    description: 'CPL-Intent type validation catches all malformed inputs',
  },
  {
    domain: 'constraint_verification',
    feature: 'Constraint satisfiability',
    requiredTests: ['unit', 'constraint_correctness', 'property_based'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/constraints*.test.ts',
    blocksRelease: true,
    description: 'Constraint compatibility checking and conflict detection',
  },

  // ===== Planning =====
  {
    domain: 'planning',
    feature: 'Goal→lever mapping',
    requiredTests: ['unit', 'golden_nl_to_cpl'],
    recommendedTests: ['property_based'],
    testFilePattern: 'src/gofai/tests/planning/levers*.test.ts',
    blocksRelease: true,
    description: 'Perceptual axes correctly map to candidate levers',
  },
  {
    domain: 'planning',
    feature: 'Plan generation',
    requiredTests: ['unit', 'constraint_correctness', 'determinism_replay'],
    recommendedTests: ['performance_budget'],
    testFilePattern: 'src/gofai/tests/planning/planner*.test.ts',
    blocksRelease: true,
    description: 'Plans are generated, scored, and constraint-validated correctly',
  },
  {
    domain: 'planning',
    feature: 'Least-change preference',
    requiredTests: ['unit', 'golden_nl_to_cpl'],
    recommendedTests: ['property_based'],
    testFilePattern: 'src/gofai/tests/planning/cost*.test.ts',
    blocksRelease: true,
    description: 'Plans prefer minimal edits unless user requests larger changes',
  },

  // ===== Execution =====
  {
    domain: 'execution',
    feature: 'Plan execution',
    requiredTests: ['unit', 'safety_diff', 'constraint_correctness'],
    recommendedTests: ['fuzz', 'performance_budget'],
    testFilePattern: 'src/gofai/tests/execution/apply*.test.ts',
    blocksRelease: true,
    description: 'Plans execute transactionally with constraint verification',
  },
  {
    domain: 'diff_generation',
    feature: 'Diff generation',
    requiredTests: ['unit', 'safety_diff', 'determinism_replay'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/execution/diff*.test.ts',
    blocksRelease: true,
    description: 'Diffs are stable, deterministic, and human-readable',
  },
  {
    domain: 'undo_redo',
    feature: 'Undo/redo roundtrips',
    requiredTests: ['unit', 'undo_roundtrip', 'property_based'],
    recommendedTests: ['fuzz'],
    testFilePattern: 'src/gofai/tests/execution/undo*.test.ts',
    blocksRelease: true,
    description: 'apply→undo→redo yields identical state and diffs',
  },

  // ===== Extensions =====
  {
    domain: 'extension_registry',
    feature: 'Extension registration',
    requiredTests: ['unit', 'extension_isolation'],
    recommendedTests: ['integration'],
    testFilePattern: 'src/gofai/tests/extensions/registry*.test.ts',
    blocksRelease: true,
    description: 'Extensions register/unregister with proper namespacing',
  },
  {
    domain: 'extension_auto_binding',
    feature: 'Auto-binding cards/boards/decks',
    requiredTests: ['unit', 'integration'],
    recommendedTests: ['determinism_replay'],
    testFilePattern: 'src/gofai/tests/extensions/auto-bind*.test.ts',
    blocksRelease: false,
    description: 'Card/board/deck registrations produce correct lexicon entries',
  },
  {
    domain: 'extension_prolog',
    feature: 'Extension Prolog modules',
    requiredTests: ['unit', 'extension_isolation'],
    recommendedTests: ['integration'],
    testFilePattern: 'src/gofai/tests/extensions/prolog*.test.ts',
    blocksRelease: false,
    description: 'Extension Prolog modules load safely without breaking core KB',
  },
  {
    domain: 'extension_opcodes',
    feature: 'Extension opcodes',
    requiredTests: ['unit', 'extension_isolation', 'safety_diff'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/extensions/opcodes*.test.ts',
    blocksRelease: false,
    description: 'Extension opcodes execute with proper sandboxing and namespacing',
  },

  // ===== Pipeline Integration =====
  {
    domain: 'pipeline_integration',
    feature: 'End-to-end pipeline',
    requiredTests: ['integration', 'determinism_replay', 'performance_budget'],
    recommendedTests: ['fuzz'],
    testFilePattern: 'src/gofai/tests/pipeline*.test.ts',
    blocksRelease: true,
    description: 'Full NL→CPL→Plan→Execute pipeline runs correctly end to end',
  },
  {
    domain: 'pipeline_integration',
    feature: 'Paraphrase invariance (end-to-end)',
    requiredTests: ['paraphrase_invariance'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/paraphrase*.test.ts',
    blocksRelease: true,
    description: 'Same intent under different phrasings yields same plan',
  },

  // ===== Serialization =====
  {
    domain: 'serialization',
    feature: 'CPL JSON roundtrip',
    requiredTests: ['unit', 'property_based'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/cpl/serialize*.test.ts',
    blocksRelease: true,
    description: 'CPL serialization is lossless and version-tagged',
  },
  {
    domain: 'migration',
    feature: 'Schema migration',
    requiredTests: ['unit'],
    recommendedTests: ['integration'],
    testFilePattern: 'src/gofai/tests/migration*.test.ts',
    blocksRelease: true,
    description: 'Old CPL/plan data migrates correctly to new schema versions',
  },

  // ===== UI =====
  {
    domain: 'ui_deck',
    feature: 'GOFAI deck UI',
    requiredTests: ['ux_interaction'],
    recommendedTests: ['integration'],
    testFilePattern: 'src/gofai/tests/ui/deck*.test.ts',
    blocksRelease: false,
    description: 'Deck renders correctly with all three panes',
  },
  {
    domain: 'ui_plan_preview',
    feature: 'Plan preview UI',
    requiredTests: ['ux_interaction'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/ui/plan*.test.ts',
    blocksRelease: false,
    description: 'Plan preview shows steps, diffs, and apply/undo controls',
  },
  {
    domain: 'ui_diff_viewer',
    feature: 'Diff viewer UI',
    requiredTests: ['ux_interaction'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/ui/diff*.test.ts',
    blocksRelease: false,
    description: 'Diff viewer renders change summaries per section/layer',
  },
  {
    domain: 'ui_clarification',
    feature: 'Clarification UI',
    requiredTests: ['ux_interaction'],
    recommendedTests: [],
    testFilePattern: 'src/gofai/tests/ui/clarification*.test.ts',
    blocksRelease: false,
    description: 'Clarification questions render with options and defaults',
  },
] as const;

// =============================================================================
// Build Matrix Utilities
// =============================================================================

/**
 * Get all build matrix entries for a domain.
 */
export function getEntriesForDomain(domain: FeatureDomain): readonly BuildMatrixEntry[] {
  return GOFAI_BUILD_MATRIX.filter(e => e.domain === domain);
}

/**
 * Get all required test types across the entire matrix.
 */
export function getAllRequiredTestTypes(): ReadonlySet<TestType> {
  const types = new Set<TestType>();
  for (const entry of GOFAI_BUILD_MATRIX) {
    for (const t of entry.requiredTests) {
      types.add(t);
    }
  }
  return types;
}

/**
 * Get all release-blocking entries.
 */
export function getReleaseBlockingEntries(): readonly BuildMatrixEntry[] {
  return GOFAI_BUILD_MATRIX.filter(e => e.blocksRelease);
}

/**
 * Get all entries requiring a specific test type.
 */
export function getEntriesRequiringTest(testType: TestType): readonly BuildMatrixEntry[] {
  return GOFAI_BUILD_MATRIX.filter(e => e.requiredTests.includes(testType));
}

/**
 * Format the build matrix as a human-readable table.
 */
export function formatBuildMatrix(): string {
  const lines: string[] = ['GOFAI Build Matrix', '='.repeat(80), ''];

  let lastDomain = '';
  for (const entry of GOFAI_BUILD_MATRIX) {
    if (entry.domain !== lastDomain) {
      lines.push(`--- ${entry.domain} ---`);
      lastDomain = entry.domain;
    }
    const blocking = entry.blocksRelease ? '[BLOCKS RELEASE]' : '';
    lines.push(`  ${entry.feature} ${blocking}`);
    lines.push(`    Required: ${entry.requiredTests.join(', ')}`);
    if (entry.recommendedTests.length > 0) {
      lines.push(`    Recommended: ${entry.recommendedTests.join(', ')}`);
    }
    lines.push(`    Pattern: ${entry.testFilePattern}`);
    lines.push('');
  }

  return lines.join('\n');
}
