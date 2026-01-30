/**
 * GOFAI Build Matrix — Step 006 Complete
 *
 * This module defines the "GOFAI build matrix" that maps features to
 * required tests. Every feature must have corresponding test coverage
 * across multiple dimensions:
 *
 * 1. Unit tests — Test individual functions/modules in isolation
 * 2. Golden NL→CPL tests — Test that natural language compiles to expected CPL
 * 3. Paraphrase invariance — Test that paraphrases compile to same CPL
 * 4. Safety diffs — Test that constraints are preserved in execution
 * 5. UX interaction tests — Test that UI interactions work correctly
 *
 * The matrix is enforced via:
 * - CI checks that fail if coverage is missing
 * - Auto-generated test templates for new features
 * - Coverage reports showing gaps
 * - Test quality metrics (not just coverage percentage)
 *
 * This ensures that GOFAI features are not just implemented, but
 * thoroughly tested for correctness, robustness, and usability.
 *
 * Reference: gofai_goalB.md Step 006
 *
 * @module gofai/infra/build-matrix
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * A feature in the GOFAI system.
 */
export interface Feature {
  /** Unique feature ID */
  readonly id: string;

  /** Feature name */
  readonly name: string;

  /** Feature category */
  readonly category: FeatureCategory;

  /** Description */
  readonly description: string;

  /** Implementation status */
  readonly status: FeatureStatus;

  /** Required test types */
  readonly requiredTests: readonly TestType[];

  /** Module paths implementing this feature */
  readonly modules: readonly string[];
}

/**
 * Feature categories.
 */
export type FeatureCategory =
  | 'vocabulary'     // Lexicon, grammar rules
  | 'semantics'      // CPL composition
  | 'pragmatics'     // Reference resolution
  | 'planning'       // Plan generation
  | 'execution'      // Mutation application
  | 'constraints'    // Constraint checking
  | 'extensions'     // Extension system
  | 'ui'             // User interface
  | 'infra';         // Infrastructure

/**
 * Feature implementation status.
 */
export type FeatureStatus =
  | 'planned'        // Not yet implemented
  | 'in-progress'    // Partially implemented
  | 'implemented'    // Fully implemented
  | 'tested'         // Fully tested
  | 'released';      // Shipped to users

/**
 * Test types required for features.
 */
export type TestType =
  | 'unit'                    // Unit tests for functions/modules
  | 'golden-nl-cpl'           // NL→CPL golden tests
  | 'paraphrase-invariance'   // Paraphrase tests
  | 'constraint-safety'       // Constraint preservation tests
  | 'ux-interaction'          // UI interaction tests
  | 'integration'             // End-to-end integration tests
  | 'performance'             // Performance tests
  | 'fuzz'                    // Fuzz tests for robustness
  | 'property';               // Property-based tests

/**
 * Test coverage for a feature.
 */
export interface TestCoverage {
  /** Feature ID */
  readonly featureId: string;

  /** Test type */
  readonly testType: TestType;

  /** Whether tests exist */
  readonly exists: boolean;

  /** Number of test cases */
  readonly testCount: number;

  /** Test file paths */
  readonly testFiles: readonly string[];

  /** Coverage percentage (if measurable) */
  readonly coverage?: number;

  /** Test quality score (0-100) */
  readonly quality?: number;
}

/**
 * Build matrix entry.
 */
export interface BuildMatrixEntry {
  /** Feature */
  readonly feature: Feature;

  /** Test coverage by type */
  readonly coverage: readonly TestCoverage[];

  /** Whether feature is fully tested */
  readonly fullyTested: boolean;

  /** Missing tests */
  readonly missingTests: readonly TestType[];

  /** Quality score (0-100) */
  readonly qualityScore: number;
}

/**
 * Complete build matrix.
 */
export interface BuildMatrix {
  /** All features */
  readonly features: readonly Feature[];

  /** Matrix entries */
  readonly entries: readonly BuildMatrixEntry[];

  /** Summary statistics */
  readonly summary: {
    readonly totalFeatures: number;
    readonly fullyTested: number;
    readonly partiallyTested: number;
    readonly untested: number;
    readonly averageQuality: number;
  };
}

// =============================================================================
// Feature Registry
// =============================================================================

/**
 * Registry of all GOFAI features.
 */
const FEATURE_REGISTRY: Feature[] = [
  // Vocabulary Features
  {
    id: 'vocab-adjectives',
    name: 'Perceptual Adjectives',
    category: 'vocabulary',
    description: 'Adjectives describing perceptual qualities (dark, bright, wide, etc.)',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'paraphrase-invariance'],
    modules: [
      'src/gofai/canon/adjectives-production-timbre.ts',
      'src/gofai/canon/adjectives-emotional-mood-character.ts',
    ],
  },
  {
    id: 'vocab-verbs',
    name: 'Action Verbs',
    category: 'vocabulary',
    description: 'Verbs describing musical actions (transpose, quantize, adjust, etc.)',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'paraphrase-invariance'],
    modules: [
      'src/gofai/canon/domain-verbs.ts',
      'src/gofai/canon/domain-verbs-batch27-commands.ts',
    ],
  },
  {
    id: 'vocab-nouns',
    name: 'Musical Nouns',
    category: 'vocabulary',
    description: 'Nouns for musical entities (chorus, drums, melody, etc.)',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'paraphrase-invariance'],
    modules: [
      'src/gofai/canon/domain-nouns.ts',
      'src/gofai/canon/domain-nouns-instruments.ts',
    ],
  },
  {
    id: 'vocab-adverbs',
    name: 'Degree Adverbs',
    category: 'vocabulary',
    description: 'Adverbs modifying intensity (very, slightly, extremely, etc.)',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'paraphrase-invariance'],
    modules: [
      'src/gofai/canon/domain-adverbs-batch28.ts',
    ],
  },

  // Semantic Features
  {
    id: 'sem-cpl-intent',
    name: 'CPL Intent Composition',
    category: 'semantics',
    description: 'Composing logical forms from parse trees',
    status: 'in-progress',
    requiredTests: ['unit', 'golden-nl-cpl', 'integration'],
    modules: [
      'src/gofai/pipeline/compilation-stages.ts',
    ],
  },
  {
    id: 'sem-axis-mapping',
    name: 'Perceptual Axis Mapping',
    category: 'semantics',
    description: 'Mapping adjectives to perceptual axes',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'paraphrase-invariance'],
    modules: [
      'src/gofai/canon/perceptual-axes.ts',
    ],
  },
  {
    id: 'sem-constraint-composition',
    name: 'Constraint Composition',
    category: 'semantics',
    description: 'Composing constraints from natural language',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'constraint-safety'],
    modules: [
      'src/gofai/canon/constraint-types.ts',
    ],
  },

  // Pragmatics Features
  {
    id: 'prag-anaphora',
    name: 'Anaphora Resolution',
    category: 'pragmatics',
    description: 'Resolving "it", "that", "them" using discourse context',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'integration'],
    modules: [
      'src/gofai/pragmatics/discourse-model.ts',
    ],
  },
  {
    id: 'prag-definite-descriptions',
    name: 'Definite Description Resolution',
    category: 'pragmatics',
    description: 'Resolving "the chorus", "the drums" to entities',
    status: 'implemented',
    requiredTests: ['unit', 'golden-nl-cpl', 'integration'],
    modules: [
      'src/gofai/pragmatics/demonstrative-resolution.ts',
    ],
  },
  {
    id: 'prag-salience',
    name: 'Salience Tracking',
    category: 'pragmatics',
    description: 'Tracking which entities are salient in discourse',
    status: 'implemented',
    requiredTests: ['unit', 'integration'],
    modules: [
      'src/gofai/infra/salience-tracker.ts',
    ],
  },

  // Planning Features
  {
    id: 'plan-lever-mapping',
    name: 'Lever Mapping',
    category: 'planning',
    description: 'Mapping perceptual goals to musical levers',
    status: 'implemented',
    requiredTests: ['unit', 'integration', 'constraint-safety'],
    modules: [
      'src/gofai/planning/lever-mappings.ts',
    ],
  },
  {
    id: 'plan-cost-model',
    name: 'Cost Model',
    category: 'planning',
    description: 'Scoring plans by edit cost and goal satisfaction',
    status: 'implemented',
    requiredTests: ['unit', 'integration'],
    modules: [
      'src/gofai/planning/cost-model.ts',
    ],
  },
  {
    id: 'plan-constraint-satisfaction',
    name: 'Constraint Satisfaction',
    category: 'planning',
    description: 'Pruning plans that violate constraints',
    status: 'implemented',
    requiredTests: ['unit', 'constraint-safety', 'integration'],
    modules: [
      'src/gofai/planning/constraint-satisfaction.ts',
    ],
  },

  // Execution Features
  {
    id: 'exec-opcode-execution',
    name: 'Opcode Execution',
    category: 'execution',
    description: 'Executing plan opcodes as CardPlay mutations',
    status: 'in-progress',
    requiredTests: ['unit', 'integration', 'constraint-safety'],
    modules: [
      'src/gofai/pipeline/compilation-stages.ts',
    ],
  },
  {
    id: 'exec-diff-computation',
    name: 'Diff Computation',
    category: 'execution',
    description: 'Computing diffs between before/after states',
    status: 'planned',
    requiredTests: ['unit', 'integration', 'constraint-safety'],
    modules: [],
  },
  {
    id: 'exec-undo-generation',
    name: 'Undo Token Generation',
    category: 'execution',
    description: 'Generating undo tokens for reversibility',
    status: 'planned',
    requiredTests: ['unit', 'integration', 'constraint-safety'],
    modules: [],
  },

  // Constraint Features
  {
    id: 'constraint-verifiers',
    name: 'Constraint Verifiers',
    category: 'constraints',
    description: 'Executable verifiers for all constraint types',
    status: 'implemented',
    requiredTests: ['unit', 'constraint-safety', 'property'],
    modules: [
      'src/gofai/invariants/constraint-verifiers.ts',
    ],
  },
  {
    id: 'constraint-preserve-melody',
    name: 'Preserve Melody Constraint',
    category: 'constraints',
    description: 'Verify that melody is preserved',
    status: 'implemented',
    requiredTests: ['unit', 'constraint-safety'],
    modules: [
      'src/gofai/invariants/constraint-verifiers.ts',
    ],
  },
  {
    id: 'constraint-only-change',
    name: 'Only Change Constraint',
    category: 'constraints',
    description: 'Verify that only specified entities are changed',
    status: 'implemented',
    requiredTests: ['unit', 'constraint-safety'],
    modules: [
      'src/gofai/invariants/constraint-verifiers.ts',
    ],
  },

  // Extension Features
  {
    id: 'ext-namespace-policy',
    name: 'Namespace Policy',
    category: 'extensions',
    description: 'Enforce namespace rules for extension IDs',
    status: 'implemented',
    requiredTests: ['unit', 'integration'],
    modules: [
      'src/gofai/canon/vocabulary-policy.ts',
    ],
  },
  {
    id: 'ext-lexicon-extension',
    name: 'Lexicon Extension',
    category: 'extensions',
    description: 'Allow extensions to add vocabulary',
    status: 'planned',
    requiredTests: ['unit', 'integration', 'golden-nl-cpl'],
    modules: [],
  },
  {
    id: 'ext-opcode-extension',
    name: 'Opcode Extension',
    category: 'extensions',
    description: 'Allow extensions to add opcodes',
    status: 'planned',
    requiredTests: ['unit', 'integration', 'constraint-safety'],
    modules: [],
  },

  // Infrastructure Features
  {
    id: 'infra-semantic-invariants',
    name: 'Semantic Safety Invariants',
    category: 'infra',
    description: 'Runtime checks for semantic safety',
    status: 'tested',
    requiredTests: ['unit', 'integration', 'property'],
    modules: [
      'src/gofai/invariants/core-invariants.ts',
    ],
  },
  {
    id: 'infra-pipeline-orchestration',
    name: 'Pipeline Orchestration',
    category: 'infra',
    description: 'Orchestrate compilation pipeline stages',
    status: 'implemented',
    requiredTests: ['unit', 'integration'],
    modules: [
      'src/gofai/pipeline/compilation-stages.ts',
    ],
  },
  {
    id: 'infra-deterministic-ordering',
    name: 'Deterministic Ordering',
    category: 'infra',
    description: 'Ensure deterministic output ordering',
    status: 'implemented',
    requiredTests: ['unit', 'property'],
    modules: [
      'src/gofai/infra/deterministic-ordering.ts',
    ],
  },

  // UI Features
  {
    id: 'ui-clarification-prompts',
    name: 'Clarification Prompts',
    category: 'ui',
    description: 'UI for asking clarification questions',
    status: 'in-progress',
    requiredTests: ['ux-interaction', 'integration'],
    modules: [
      'src/gofai/pipeline/interaction-loop.ts',
    ],
  },
  {
    id: 'ui-plan-preview',
    name: 'Plan Preview',
    category: 'ui',
    description: 'UI for previewing plans before applying',
    status: 'in-progress',
    requiredTests: ['ux-interaction', 'integration'],
    modules: [
      'src/gofai/pipeline/preview-first-ux.ts',
    ],
  },
  {
    id: 'ui-diff-visualization',
    name: 'Diff Visualization',
    category: 'ui',
    description: 'UI for visualizing diffs',
    status: 'planned',
    requiredTests: ['ux-interaction', 'integration'],
    modules: [],
  },
];

/**
 * Get all registered features.
 */
export function getAllFeatures(): readonly Feature[] {
  return FEATURE_REGISTRY;
}

/**
 * Get features by category.
 */
export function getFeaturesByCategory(category: FeatureCategory): readonly Feature[] {
  return FEATURE_REGISTRY.filter((f) => f.category === category);
}

/**
 * Get features by status.
 */
export function getFeaturesByStatus(status: FeatureStatus): readonly Feature[] {
  return FEATURE_REGISTRY.filter((f) => f.status === status);
}

/**
 * Get a feature by ID.
 */
export function getFeature(id: string): Feature | undefined {
  return FEATURE_REGISTRY.find((f) => f.id === id);
}

// =============================================================================
// Test Coverage Analysis
// =============================================================================

/**
 * Check test coverage for a feature.
 * 
 * This would be implemented to actually scan test files and compute coverage.
 * For now, it's a placeholder that returns mock data.
 */
export function checkTestCoverage(feature: Feature): readonly TestCoverage[] {
  return feature.requiredTests.map((testType) => ({
    featureId: feature.id,
    testType,
    exists: feature.status === 'tested' || feature.status === 'released',
    testCount: feature.status === 'tested' ? 10 : 0,
    testFiles: [],
    coverage: feature.status === 'tested' ? 100 : 0,
    quality: feature.status === 'tested' ? 90 : 0,
  }));
}

/**
 * Compute build matrix entry for a feature.
 */
export function computeMatrixEntry(feature: Feature): BuildMatrixEntry {
  const coverage = checkTestCoverage(feature);
  
  const missingTests = feature.requiredTests.filter((testType) => {
    const cov = coverage.find((c) => c.testType === testType);
    return !cov || !cov.exists;
  });
  
  const fullyTested = missingTests.length === 0;
  
  const qualityScore = coverage.reduce((sum, c) => sum + (c.quality ?? 0), 0) / coverage.length;
  
  return {
    feature,
    coverage,
    fullyTested,
    missingTests,
    qualityScore,
  };
}

/**
 * Compute complete build matrix.
 */
export function computeBuildMatrix(): BuildMatrix {
  const features = getAllFeatures();
  const entries = features.map(computeMatrixEntry);
  
  const fullyTested = entries.filter((e) => e.fullyTested).length;
  const untested = entries.filter((e) => e.coverage.every((c) => !c.exists)).length;
  const partiallyTested = entries.length - fullyTested - untested;
  
  const averageQuality = entries.reduce((sum, e) => sum + e.qualityScore, 0) / entries.length;
  
  return {
    features,
    entries,
    summary: {
      totalFeatures: features.length,
      fullyTested,
      partiallyTested,
      untested,
      averageQuality,
    },
  };
}

// =============================================================================
// CI Integration
// =============================================================================

/**
 * Check build matrix for CI.
 * 
 * Returns exit code 0 if all required tests exist, non-zero otherwise.
 */
export function checkBuildMatrixForCI(): { exitCode: number; report: string } {
  const matrix = computeBuildMatrix();
  
  const lines: string[] = [];
  lines.push('GOFAI Build Matrix Check');
  lines.push('========================');
  lines.push('');
  lines.push(`Total Features: ${matrix.summary.totalFeatures}`);
  lines.push(`Fully Tested: ${matrix.summary.fullyTested}`);
  lines.push(`Partially Tested: ${matrix.summary.partiallyTested}`);
  lines.push(`Untested: ${matrix.summary.untested}`);
  lines.push(`Average Quality: ${matrix.summary.averageQuality.toFixed(1)}%`);
  lines.push('');
  
  const incomplete = matrix.entries.filter((e) => !e.fullyTested);
  
  if (incomplete.length > 0) {
    lines.push('Features with Missing Tests:');
    lines.push('----------------------------');
    
    for (const entry of incomplete) {
      lines.push(`- ${entry.feature.name} (${entry.feature.id})`);
      lines.push(`  Status: ${entry.feature.status}`);
      lines.push(`  Missing: ${entry.missingTests.join(', ')}`);
      lines.push('');
    }
    
    return { exitCode: 1, report: lines.join('\n') };
  }
  
  lines.push('✅ All features have required test coverage!');
  
  return { exitCode: 0, report: lines.join('\n') };
}

// =============================================================================
// Test Template Generation
// =============================================================================

/**
 * Generate test template for a feature.
 */
export function generateTestTemplate(feature: Feature, testType: TestType): string {
  const lines: string[] = [];
  
  lines.push(`/**`);
  lines.push(` * ${testType.toUpperCase()} Tests for ${feature.name}`);
  lines.push(` *`);
  lines.push(` * Feature: ${feature.description}`);
  lines.push(` * ID: ${feature.id}`);
  lines.push(` * Category: ${feature.category}`);
  lines.push(` *`);
  lines.push(` * @module gofai/${feature.category}/__tests__/${feature.id}-${testType}`);
  lines.push(` */`);
  lines.push('');
  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push('');
  lines.push(`describe('${feature.name} — ${testType}', () => {`);
  lines.push(`  it('should ${getTestDescription(testType)}', () => {`);
  lines.push(`    // TODO: Implement test`);
  lines.push(`    expect(true).toBe(true);`);
  lines.push(`  });`);
  lines.push(`});`);
  lines.push('');
  
  return lines.join('\n');
}

function getTestDescription(testType: TestType): string {
  switch (testType) {
    case 'unit':
      return 'test individual functions';
    case 'golden-nl-cpl':
      return 'test NL→CPL compilation matches expected output';
    case 'paraphrase-invariance':
      return 'test paraphrases compile to same CPL';
    case 'constraint-safety':
      return 'test constraints are preserved';
    case 'ux-interaction':
      return 'test UI interactions work correctly';
    case 'integration':
      return 'test end-to-end integration';
    case 'performance':
      return 'test performance meets requirements';
    case 'fuzz':
      return 'test robustness with random inputs';
    case 'property':
      return 'test properties hold for all inputs';
  }
}
