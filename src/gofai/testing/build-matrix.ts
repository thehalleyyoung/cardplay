/**
 * GOFAI Build Matrix
 * 
 * Maps features to required test types, establishing comprehensive test coverage
 * requirements for all GOFAI components. Every feature must have appropriate tests
 * across multiple dimensions to ensure reliability and determinism.
 * 
 * Step 006 [Infra] — GOFAI Build Matrix
 * 
 * @module gofai/testing/build-matrix
 */

/**
 * Test type categories required for GOFAI features
 */
export type TestType =
  | 'unit'                    // Standard unit tests (per module)
  | 'golden-nl-cpl'          // NL→CPL golden corpus tests
  | 'paraphrase-invariance'  // Same meaning from different phrasings
  | 'safety-diff'            // Constraint verification on diffs
  | 'ux-interaction'         // Deck/UI integration tests
  | 'regression'             // Regression tests for known issues
  | 'property'               // Property-based/generative tests
  | 'integration'            // Cross-module integration tests
  | 'performance'            // Performance and latency tests
  | 'determinism';           // Determinism verification tests

/**
 * Feature categories in GOFAI
 */
export type FeatureCategory =
  | 'lexicon'        // Vocabulary and lexeme definitions
  | 'grammar'        // Parsing rules and constructions
  | 'semantics'      // Semantic composition rules
  | 'pragmatics'     // Reference resolution and context
  | 'planning'       // Goal→plan generation
  | 'execution'      // Plan→mutation compilation
  | 'constraints'    // Constraint checking
  | 'extensions'     // Extension system
  | 'ui';           // User interface components

/**
 * Priority level for tests
 */
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Status of test implementation
 */
export type TestStatus = 'complete' | 'partial' | 'planned' | 'missing';

/**
 * Test requirement specification
 */
export interface TestRequirement {
  readonly type: TestType;
  readonly priority: TestPriority;
  readonly minimumCoverage: number; // 0-100 percentage
  readonly description: string;
  readonly examplePath?: string;
  readonly status: TestStatus;
}

/**
 * Feature specification in the build matrix
 */
export interface FeatureSpec {
  readonly id: string;
  readonly category: FeatureCategory;
  readonly name: string;
  readonly description: string;
  readonly requiredTests: readonly TestRequirement[];
  readonly dependencies: readonly string[]; // Other feature IDs
  readonly implementationPath: string;
  readonly docsPath?: string;
}

/**
 * Build matrix - complete mapping of features to tests
 */
export interface BuildMatrix {
  readonly features: readonly FeatureSpec[];
  readonly version: string;
  readonly lastUpdated: string;
}

/**
 * Test coverage report
 */
export interface CoverageReport {
  readonly featureId: string;
  readonly overallCoverage: number; // 0-100
  readonly testCoverage: ReadonlyMap<TestType, number>;
  readonly missingTests: readonly TestRequirement[];
  readonly status: 'passing' | 'failing' | 'incomplete';
}

/**
 * Build matrix violation
 */
export interface MatrixViolation {
  readonly featureId: string;
  readonly testType: TestType;
  readonly requirement: TestRequirement;
  readonly actual: number; // Actual coverage
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

// =============================================================================
// Core Feature Specifications
// =============================================================================

/**
 * Lexicon features - vocabulary and word definitions
 */
const LEXICON_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'lexicon:core-verbs',
    category: 'lexicon',
    name: 'Core Domain Verbs',
    description: 'Essential musical action verbs (make, add, remove, change, etc.)',
    implementationPath: 'src/gofai/canon/domain-verbs.ts',
    docsPath: 'docs/gofai/vocabulary/verbs.md',
    dependencies: [],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test all verb conjugations and ID resolution',
        examplePath: 'src/gofai/tests/canon/domain-verbs.test.ts',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 90,
        description: 'Each verb in at least 3 sentence contexts',
        examplePath: 'src/gofai/tests/golden/verbs-basic.test.ts',
        status: 'planned',
      },
      {
        type: 'paraphrase-invariance',
        priority: 'high',
        minimumCoverage: 80,
        description: 'Synonyms produce identical CPL',
        examplePath: 'src/gofai/tests/paraphrase/verb-synonyms.test.ts',
        status: 'planned',
      },
    ],
  },
  {
    id: 'lexicon:adjectives',
    category: 'lexicon',
    name: 'Perceptual Adjectives',
    description: 'Adjectives mapping to perceptual axes (bright, dark, tight, etc.)',
    implementationPath: 'src/gofai/canon/adjectives-*.ts',
    docsPath: 'docs/gofai/vocabulary/adjectives.md',
    dependencies: ['lexicon:perceptual-axes'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test axis mapping and intensity for each adjective',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 85,
        description: 'Each adjective in comparative and absolute forms',
        status: 'planned',
      },
      {
        type: 'paraphrase-invariance',
        priority: 'high',
        minimumCoverage: 75,
        description: 'Antonyms produce opposite axis directions',
        status: 'planned',
      },
    ],
  },
  {
    id: 'lexicon:nouns',
    category: 'lexicon',
    name: 'Domain Nouns',
    description: 'Musical objects and concepts (chorus, drums, melody, etc.)',
    implementationPath: 'src/gofai/canon/domain-nouns*.ts',
    docsPath: 'docs/gofai/vocabulary/nouns.md',
    dependencies: [],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test noun resolution and category classification',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'high',
        minimumCoverage: 80,
        description: 'Nouns as subjects, objects, and in scope phrases',
        status: 'planned',
      },
    ],
  },
  {
    id: 'lexicon:perceptual-axes',
    category: 'lexicon',
    name: 'Perceptual Axes',
    description: 'Musical dimensions (brightness, width, energy, etc.)',
    implementationPath: 'src/gofai/canon/perceptual-axes.ts',
    docsPath: 'docs/gofai/perceptual-axes.md',
    dependencies: [],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test all axis definitions and lever mappings',
        status: 'partial',
      },
      {
        type: 'integration',
        priority: 'high',
        minimumCoverage: 90,
        description: 'Axes integrate with planning levers',
        status: 'planned',
      },
    ],
  },
];

/**
 * Grammar features - parsing rules
 */
const GRAMMAR_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'grammar:imperative',
    category: 'grammar',
    name: 'Imperative Constructions',
    description: 'Command forms (make X Y, do Z)',
    implementationPath: 'src/gofai/nl/grammar/imperative.ts',
    dependencies: ['lexicon:core-verbs'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test all imperative patterns',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 95,
        description: 'Golden corpus of imperative sentences',
        status: 'planned',
      },
      {
        type: 'determinism',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Same input always produces same parse',
        status: 'planned',
      },
    ],
  },
  {
    id: 'grammar:coordination',
    category: 'grammar',
    name: 'Coordination (and/or)',
    description: 'Conjunctions and disjunctions',
    implementationPath: 'src/gofai/nl/grammar/coordination.ts',
    dependencies: ['grammar:imperative'],
    requiredTests: [
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 90,
        description: 'Test complex coordinations',
        status: 'planned',
      },
      {
        type: 'paraphrase-invariance',
        priority: 'high',
        minimumCoverage: 85,
        description: 'Order invariance for commutative goals',
        status: 'planned',
      },
    ],
  },
  {
    id: 'grammar:comparatives',
    category: 'grammar',
    name: 'Comparatives and Intensifiers',
    description: 'More/less, much/little, very',
    implementationPath: 'src/gofai/nl/grammar/comparatives.ts',
    dependencies: ['lexicon:adjectives'],
    requiredTests: [
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 90,
        description: 'All comparative forms with amount calibration',
        status: 'planned',
      },
      {
        type: 'property',
        priority: 'high',
        minimumCoverage: 75,
        description: 'Monotonicity: "more X" > "X" > "less X"',
        status: 'planned',
      },
    ],
  },
  {
    id: 'grammar:scope',
    category: 'grammar',
    name: 'Scope Phrases',
    description: 'In/on/for constructions (in the chorus, for two bars)',
    implementationPath: 'src/gofai/nl/grammar/scope-phrases.ts',
    dependencies: ['lexicon:nouns'],
    requiredTests: [
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 95,
        description: 'All scope phrase patterns',
        status: 'planned',
      },
      {
        type: 'safety-diff',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Scopes never exceed specified bounds',
        status: 'planned',
      },
    ],
  },
  {
    id: 'grammar:constraints',
    category: 'grammar',
    name: 'Constraint Phrases',
    description: 'Keep, preserve, only, don\'t',
    implementationPath: 'src/gofai/nl/grammar/constraints.ts',
    dependencies: [],
    requiredTests: [
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All constraint patterns map correctly',
        status: 'planned',
      },
      {
        type: 'safety-diff',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Constraints are verified in execution',
        status: 'planned',
      },
    ],
  },
];

/**
 * Semantics features - meaning composition
 */
const SEMANTICS_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'semantics:composition',
    category: 'semantics',
    name: 'Semantic Composition',
    description: 'Syntax tree → CPL with holes',
    implementationPath: 'src/gofai/nl/semantics/compose.ts',
    dependencies: ['grammar:imperative', 'grammar:coordination'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Test all composition rules',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'critical',
        minimumCoverage: 95,
        description: 'Golden NL→CPL mappings',
        status: 'planned',
      },
      {
        type: 'determinism',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Composition is deterministic',
        status: 'planned',
      },
    ],
  },
  {
    id: 'semantics:frames',
    category: 'semantics',
    name: 'Verb Frames',
    description: 'Argument structure for verbs',
    implementationPath: 'src/gofai/nl/semantics/frames.ts',
    dependencies: ['lexicon:core-verbs'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All verb frames defined and validated',
        status: 'planned',
      },
      {
        type: 'regression',
        priority: 'high',
        minimumCoverage: 80,
        description: 'Catch missing arguments',
        status: 'planned',
      },
    ],
  },
];

/**
 * Pragmatics features - context and resolution
 */
const PRAGMATICS_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'pragmatics:reference',
    category: 'pragmatics',
    name: 'Reference Resolution',
    description: 'Resolve pronouns and demonstratives',
    implementationPath: 'src/gofai/pragmatics/resolve.ts',
    dependencies: ['semantics:composition'],
    requiredTests: [
      {
        type: 'integration',
        priority: 'critical',
        minimumCoverage: 95,
        description: 'Multi-turn dialogues with references',
        status: 'planned',
      },
      {
        type: 'golden-nl-cpl',
        priority: 'high',
        minimumCoverage: 85,
        description: 'Reference resolution golden tests',
        status: 'planned',
      },
    ],
  },
  {
    id: 'pragmatics:clarification',
    category: 'pragmatics',
    name: 'Clarification Generation',
    description: 'Generate questions for ambiguities',
    implementationPath: 'src/gofai/pragmatics/clarification.ts',
    dependencies: ['pragmatics:reference'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All clarification patterns',
        status: 'planned',
      },
      {
        type: 'ux-interaction',
        priority: 'high',
        minimumCoverage: 80,
        description: 'Clarification UI integration',
        status: 'planned',
      },
    ],
  },
];

/**
 * Planning features - goal to action
 */
const PLANNING_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'planning:levers',
    category: 'planning',
    name: 'Lever Mappings',
    description: 'Axis → lever → opcode mappings',
    implementationPath: 'src/gofai/planning/levers.ts',
    dependencies: ['lexicon:perceptual-axes'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All lever mappings defined',
        status: 'planned',
      },
      {
        type: 'integration',
        priority: 'critical',
        minimumCoverage: 90,
        description: 'Levers compile to valid opcodes',
        status: 'planned',
      },
    ],
  },
  {
    id: 'planning:cost-model',
    category: 'planning',
    name: 'Cost Model',
    description: 'Least-change scoring',
    implementationPath: 'src/gofai/planning/cost-model.ts',
    dependencies: ['planning:levers'],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Cost function properties',
        status: 'planned',
      },
      {
        type: 'property',
        priority: 'high',
        minimumCoverage: 85,
        description: 'Cost ordering is total and transitive',
        status: 'planned',
      },
    ],
  },
];

/**
 * Execution features - apply and diff
 */
const EXECUTION_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'execution:apply',
    category: 'execution',
    name: 'Plan Application',
    description: 'Execute plans and mutate project state',
    implementationPath: 'src/gofai/execution/apply.ts',
    dependencies: ['planning:levers'],
    requiredTests: [
      {
        type: 'integration',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All opcodes execute correctly',
        status: 'planned',
      },
      {
        type: 'safety-diff',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Diffs match plan specifications',
        status: 'planned',
      },
      {
        type: 'determinism',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Same plan always produces same diff',
        status: 'planned',
      },
    ],
  },
  {
    id: 'execution:undo',
    category: 'execution',
    name: 'Undo/Redo',
    description: 'Reversible edit packages',
    implementationPath: 'src/gofai/execution/undo.ts',
    dependencies: ['execution:apply'],
    requiredTests: [
      {
        type: 'property',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Undo-redo roundtrip is identity',
        status: 'planned',
      },
      {
        type: 'integration',
        priority: 'critical',
        minimumCoverage: 95,
        description: 'Undo stack integration',
        status: 'planned',
      },
    ],
  },
];

/**
 * Constraints features
 */
const CONSTRAINT_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'constraints:checkers',
    category: 'constraints',
    name: 'Constraint Checkers',
    description: 'Validate constraints against diffs',
    implementationPath: 'src/gofai/canon/goals-constraints.ts',
    dependencies: [],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'All constraint types have checkers',
        status: 'partial',
      },
      {
        type: 'safety-diff',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Checkers catch all violations',
        status: 'planned',
      },
    ],
  },
];

/**
 * Extension features
 */
const EXTENSION_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'extensions:registry',
    category: 'extensions',
    name: 'Extension Registry',
    description: 'Register and manage extensions',
    implementationPath: 'src/gofai/canon/extension-semantics.ts',
    dependencies: [],
    requiredTests: [
      {
        type: 'unit',
        priority: 'critical',
        minimumCoverage: 100,
        description: 'Registry operations',
        status: 'partial',
      },
      {
        type: 'integration',
        priority: 'high',
        minimumCoverage: 90,
        description: 'Extensions integrate with core',
        status: 'planned',
      },
    ],
  },
];

/**
 * UI features
 */
const UI_FEATURES: readonly FeatureSpec[] = [
  {
    id: 'ui:gofai-deck',
    category: 'ui',
    name: 'GOFAI Deck',
    description: 'Main user interface deck',
    implementationPath: 'src/gofai/ui/gofai-deck.tsx',
    dependencies: ['semantics:composition', 'planning:levers', 'execution:apply'],
    requiredTests: [
      {
        type: 'ux-interaction',
        priority: 'critical',
        minimumCoverage: 90,
        description: 'Full interaction flow tests',
        status: 'planned',
      },
      {
        type: 'integration',
        priority: 'high',
        minimumCoverage: 85,
        description: 'Integration with board system',
        status: 'planned',
      },
    ],
  },
];

// =============================================================================
// Build Matrix Assembly
// =============================================================================

/**
 * Complete build matrix for GOFAI
 */
export const BUILD_MATRIX: BuildMatrix = {
  version: '1.0.0',
  lastUpdated: '2026-01-30',
  features: [
    ...LEXICON_FEATURES,
    ...GRAMMAR_FEATURES,
    ...SEMANTICS_FEATURES,
    ...PRAGMATICS_FEATURES,
    ...PLANNING_FEATURES,
    ...EXECUTION_FEATURES,
    ...CONSTRAINT_FEATURES,
    ...EXTENSION_FEATURES,
    ...UI_FEATURES,
  ],
};

// =============================================================================
// Matrix Analysis Functions
// =============================================================================

/**
 * Get all features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): readonly FeatureSpec[] {
  return BUILD_MATRIX.features.filter(f => f.category === category);
}

/**
 * Get all test requirements by type
 */
export function getRequirementsByType(testType: TestType): readonly TestRequirement[] {
  return BUILD_MATRIX.features.flatMap(f =>
    f.requiredTests.filter(r => r.type === testType)
  );
}

/**
 * Get critical test requirements (must be complete before release)
 */
export function getCriticalRequirements(): readonly TestRequirement[] {
  return BUILD_MATRIX.features.flatMap(f =>
    f.requiredTests.filter(r => r.priority === 'critical')
  );
}

/**
 * Check if a feature has all critical tests complete
 */
export function isFeatureReady(featureId: string): boolean {
  const feature = BUILD_MATRIX.features.find(f => f.id === featureId);
  if (!feature) return false;
  
  const criticalTests = feature.requiredTests.filter(r => r.priority === 'critical');
  return criticalTests.every(r => r.status === 'complete');
}

/**
 * Get incomplete critical tests across all features
 */
export function getIncompleteCriticalTests(): readonly { feature: FeatureSpec; requirement: TestRequirement }[] {
  const incomplete: { feature: FeatureSpec; requirement: TestRequirement }[] = [];
  
  for (const feature of BUILD_MATRIX.features) {
    for (const req of feature.requiredTests) {
      if (req.priority === 'critical' && req.status !== 'complete') {
        incomplete.push({ feature, requirement: req });
      }
    }
  }
  
  return incomplete;
}

/**
 * Generate a coverage report for a feature
 */
export function generateCoverageReport(
  featureId: string,
  actualCoverage: ReadonlyMap<TestType, number>
): CoverageReport {
  const feature = BUILD_MATRIX.features.find(f => f.id === featureId);
  if (!feature) {
    throw new Error(`Feature not found: ${featureId}`);
  }
  
  const missingTests: TestRequirement[] = [];
  let totalRequired = 0;
  let totalActual = 0;
  
  for (const req of feature.requiredTests) {
    const actual = actualCoverage.get(req.type) ?? 0;
    totalRequired += req.minimumCoverage;
    totalActual += actual;
    
    if (actual < req.minimumCoverage) {
      missingTests.push(req);
    }
  }
  
  const overallCoverage = feature.requiredTests.length > 0
    ? totalActual / feature.requiredTests.length
    : 100;
  
  const status = missingTests.length === 0 ? 'passing' :
    missingTests.some(r => r.priority === 'critical') ? 'failing' : 'incomplete';
  
  return {
    featureId,
    overallCoverage,
    testCoverage: actualCoverage,
    missingTests,
    status,
  };
}

/**
 * Check build matrix violations
 */
export function checkMatrixViolations(
  coverageData: ReadonlyMap<string, ReadonlyMap<TestType, number>>
): readonly MatrixViolation[] {
  const violations: MatrixViolation[] = [];
  
  for (const feature of BUILD_MATRIX.features) {
    const coverage = coverageData.get(feature.id);
    if (!coverage) {
      // Missing coverage data is a critical violation
      for (const req of feature.requiredTests) {
        if (req.priority === 'critical') {
          violations.push({
            featureId: feature.id,
            testType: req.type,
            requirement: req,
            actual: 0,
            severity: 'error',
            message: `No coverage data for critical test: ${req.type}`,
          });
        }
      }
      continue;
    }
    
    for (const req of feature.requiredTests) {
      const actual = coverage.get(req.type) ?? 0;
      if (actual < req.minimumCoverage) {
        violations.push({
          featureId: feature.id,
          testType: req.type,
          requirement: req,
          actual,
          severity: req.priority === 'critical' ? 'error' : 'warning',
          message: `Coverage ${actual}% below required ${req.minimumCoverage}%`,
        });
      }
    }
  }
  
  return violations;
}

/**
 * Get dependency-ordered feature list (topological sort)
 */
export function getDependencyOrder(): readonly FeatureSpec[] {
  const ordered: FeatureSpec[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function visit(featureId: string): void {
    if (visited.has(featureId)) return;
    if (visiting.has(featureId)) {
      throw new Error(`Circular dependency detected: ${featureId}`);
    }
    
    visiting.add(featureId);
    const feature = BUILD_MATRIX.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }
    
    for (const dep of feature.dependencies) {
      visit(dep);
    }
    
    visiting.delete(featureId);
    visited.add(featureId);
    ordered.push(feature);
  }
  
  for (const feature of BUILD_MATRIX.features) {
    visit(feature.id);
  }
  
  return ordered;
}

/**
 * Generate a test plan summary
 */
export function generateTestPlanSummary(): string {
  const totalFeatures = BUILD_MATRIX.features.length;
  const totalRequirements = BUILD_MATRIX.features.reduce(
    (sum, f) => sum + f.requiredTests.length,
    0
  );
  const criticalRequirements = getCriticalRequirements().length;
  const incompleteCount = getIncompleteCriticalTests().length;
  
  const byType = new Map<TestType, number>();
  for (const feature of BUILD_MATRIX.features) {
    for (const req of feature.requiredTests) {
      byType.set(req.type, (byType.get(req.type) ?? 0) + 1);
    }
  }
  
  const lines = [
    '# GOFAI Build Matrix Test Plan Summary',
    '',
    `Version: ${BUILD_MATRIX.version}`,
    `Last Updated: ${BUILD_MATRIX.lastUpdated}`,
    '',
    '## Overview',
    `- Total Features: ${totalFeatures}`,
    `- Total Test Requirements: ${totalRequirements}`,
    `- Critical Requirements: ${criticalRequirements}`,
    `- Incomplete Critical Tests: ${incompleteCount}`,
    '',
    '## Requirements by Test Type',
  ];
  
  for (const [type, count] of Array.from(byType.entries()).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${type}: ${count}`);
  }
  
  lines.push('', '## Features by Category');
  for (const category of Array.from(new Set(BUILD_MATRIX.features.map(f => f.category)))) {
    const features = getFeaturesByCategory(category);
    lines.push(`- ${category}: ${features.length} features`);
  }
  
  return lines.join('\n');
}
