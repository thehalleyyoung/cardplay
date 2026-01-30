/**
 * @file Naming Conventions and Folder Layout
 * @gofai_goalB Step 031 [Infra]
 * 
 * This module defines and documents the comprehensive naming conventions and
 * folder layout for all GOFAI modules. It establishes stable patterns for:
 * - Module organization
 * - File naming
 * - Type naming
 * - Function naming
 * - Variable naming
 * - Constant naming
 * - Test file layout
 * 
 * **Purpose:**
 * - Ensure consistency across 100K+ LOC GOFAI codebase
 * - Enable discoverability (predictable locations for functionality)
 * - Facilitate code review (standard patterns)
 * - Support tooling and automation (lint rules, generators)
 * - Maintain compatibility with CardPlay conventions
 */

/**
 * =============================================================================
 * FOLDER LAYOUT SPECIFICATION
 * =============================================================================
 * 
 * The GOFAI system follows a clear layered architecture with strict separation
 * of concerns. Each top-level folder corresponds to a pipeline stage or
 * cross-cutting concern.
 */

export interface FolderLayoutSpec {
  /** Folder name */
  readonly name: string;
  /** Purpose and scope */
  readonly purpose: string;
  /** What types of modules go here */
  readonly contains: string[];
  /** Dependencies (which folders this can import from) */
  readonly mayImportFrom: string[];
  /** Example file names */
  readonly examples: string[];
}

/**
 * Top-level GOFAI folder structure under src/gofai/
 */
export const GOFAI_FOLDER_LAYOUT: readonly FolderLayoutSpec[] = [
  {
    name: 'canon',
    purpose: 'Canonical vocabulary and ontology definitions',
    contains: [
      'Lexicon tables (lexemes → semantics)',
      'Domain-specific vocabulary batches',
      'Musical ontology (perceptual axes, musical objects)',
      'Constraint definitions',
      'Unit system definitions',
    ],
    mayImportFrom: ['types', 'infra/vocabulary-policy'],
    examples: [
      'domain-verbs-batch1.ts',
      'perceptual-axes.ts',
      'musical-ontology.ts',
      'constraint-vocabulary.ts',
      'unit-system.ts',
    ],
  },

  {
    name: 'nl',
    purpose: 'Natural language processing (tokenization, parsing, syntax)',
    contains: [
      'Tokenizer',
      'Grammar rules',
      'Parse forest builders',
      'Syntax tree types',
      'Disambiguation heuristics',
    ],
    mayImportFrom: ['canon', 'types', 'infra'],
    examples: [
      'tokenizer/index.ts',
      'parser/earley-parser.ts',
      'grammar/imperative-constructions.ts',
      'grammar/comparative-constructions.ts',
    ],
  },

  {
    name: 'semantics',
    purpose: 'Semantic composition (syntax → CPL-Intent)',
    contains: [
      'Semantic rules (AST → CPL nodes)',
      'CPL type definitions',
      'Meaning composition functions',
      'Hole detection (unresolved references)',
    ],
    mayImportFrom: ['canon', 'nl', 'types', 'infra'],
    examples: [
      'cpl-types.ts',
      'compositional-semantics.ts',
      'constraint-semantics.ts',
      'scope-resolution.ts',
    ],
  },

  {
    name: 'pragmatics',
    purpose: 'Pragmatic resolution (context → filled CPL-Intent)',
    contains: [
      'Discourse model (DRT, QUD)',
      'Anaphora resolution ("it", "that", "again")',
      'Salience tracking',
      'Presupposition triggers',
      'Implicature detection',
      'Clarification question generation',
    ],
    mayImportFrom: ['canon', 'nl', 'semantics', 'types', 'infra'],
    examples: [
      'discourse-model.ts',
      'deictic-resolution.ts',
      'clarification-contract.ts',
      'presupposition-triggers.ts',
      'user-preferences.ts',
    ],
  },

  {
    name: 'planning',
    purpose: 'Plan generation (CPL-Intent → CPL-Plan)',
    contains: [
      'Plan types (opcodes, preconditions, postconditions)',
      'Lever mappings (perceptual axes → opcodes)',
      'Constraint satisfaction',
      'Cost model and scoring',
      'Bounded search',
      'Plan explainability',
    ],
    mayImportFrom: ['canon', 'semantics', 'pragmatics', 'types', 'infra'],
    examples: [
      'plan-types.ts',
      'lever-mappings.ts',
      'constraint-satisfaction.ts',
      'cost-model.ts',
      'plan-generation.ts',
    ],
  },

  {
    name: 'execution',
    purpose: 'Plan execution (CPL-Plan → CardPlay mutations + diffs)',
    contains: [
      'Opcode executors',
      'Transactional execution engine',
      'Constraint validators',
      'Diff generation',
      'Undo token creation',
      'Edit package management',
    ],
    mayImportFrom: ['canon', 'planning', 'types', 'infra', 'CardPlay core'],
    examples: [
      'edit-package.ts',
      'transactional-execution.ts',
      'canonical-diff.ts',
      'constraint-checkers.ts',
      'event-executors.ts',
    ],
  },

  {
    name: 'pipeline',
    purpose: 'Orchestration and integration (end-to-end compiler pipeline)',
    contains: [
      'Compilation stages',
      'Pipeline orchestrator',
      'Error aggregation',
      'Provenance tracking',
      'Interaction loop',
    ],
    mayImportFrom: ['nl', 'semantics', 'pragmatics', 'planning', 'execution', 'types', 'infra'],
    examples: [
      'compilation-pipeline.ts',
      'compilation-stages.ts',
      'interaction-loop.ts',
      'provenance.ts',
      'error-shapes.ts',
    ],
  },

  {
    name: 'infra',
    purpose: 'Infrastructure and cross-cutting concerns',
    contains: [
      'Project world API',
      'Symbol table',
      'Deterministic ordering',
      'Risk register',
      'Success metrics',
      'Naming conventions (this file)',
    ],
    mayImportFrom: ['types', 'canon'],
    examples: [
      'project-world-api.ts',
      'symbol-table.ts',
      'deterministic-ordering.ts',
      'naming-conventions.ts',
      'build-matrix.ts',
    ],
  },

  {
    name: 'invariants',
    purpose: 'Safety invariants and verification',
    contains: [
      'Semantic safety invariants',
      'Constraint verifiers',
      'Type checkers',
      'Capability enforcement',
    ],
    mayImportFrom: ['canon', 'types', 'infra'],
    examples: [
      'semantic-safety-invariants.ts',
      'constraint-verifiers.ts',
      'core-invariants.ts',
      'types.ts',
    ],
  },

  {
    name: 'trust',
    purpose: 'User trust and transparency (preview, undo, explain)',
    contains: [
      'Preview generation',
      'Undo/redo support',
      'Diff explanation',
      'Why explanations',
      'Scope highlighting',
    ],
    mayImportFrom: ['execution', 'planning', 'types', 'infra'],
    examples: [
      'preview.ts',
      'undo.ts',
      'diff.ts',
      'why.ts',
      'scope-highlighting.ts',
    ],
  },

  {
    name: 'testing',
    purpose: 'Testing infrastructure and fixtures',
    contains: [
      'Song fixture format',
      'Golden test builders',
      'Build matrix',
      'Success metrics harness',
    ],
    mayImportFrom: ['all GOFAI modules'],
    examples: [
      'song-fixture-format.ts',
      'build-matrix.ts',
      'success-metrics.ts',
    ],
  },

  {
    name: 'eval',
    purpose: 'Evaluation harnesses and test suites',
    contains: [
      'Paraphrase invariance tests',
      'Ambiguity test suites',
      'Seed datasets',
      'Performance benchmarks',
    ],
    mayImportFrom: ['all GOFAI modules', 'testing'],
    examples: [
      'paraphrase-suite.ts',
      'ambiguity-suite.ts',
      'seed-dataset.ts',
    ],
  },

  {
    name: 'scenarios',
    purpose: 'End-to-end test scenarios',
    contains: [
      'Canonical interaction scenarios',
      'Multi-turn dialogues',
      'Domain-specific workflows',
    ],
    mayImportFrom: ['all GOFAI modules'],
    examples: [
      'canonical-scenarios.ts',
    ],
  },

  {
    name: 'types',
    purpose: 'Shared type definitions',
    contains: [
      'Core GOFAI types',
      'ID types',
      'Branded types',
      'Type utilities',
    ],
    mayImportFrom: [],
    examples: [
      'index.ts',
      'id-types.ts',
      'branded-types.ts',
    ],
  },
] as const;

/**
 * =============================================================================
 * FILE NAMING CONVENTIONS
 * =============================================================================
 */

export interface FileNamingRule {
  /** Pattern description */
  readonly pattern: string;
  /** When to use this pattern */
  readonly when: string;
  /** Example file names */
  readonly examples: string[];
}

export const FILE_NAMING_RULES: readonly FileNamingRule[] = [
  {
    pattern: 'kebab-case.ts',
    when: 'All TypeScript source files',
    examples: [
      'constraint-satisfaction.ts',
      'deictic-resolution.ts',
      'perceptual-axes.ts',
    ],
  },

  {
    pattern: '{domain}-{concept}-batch{N}.ts',
    when: 'Large vocabulary files split into batches',
    examples: [
      'domain-verbs-batch1.ts',
      'domain-verbs-batch41.ts',
      'lever-mappings-comprehensive-batch1.ts',
    ],
  },

  {
    pattern: '{concept}-extended-batch{N}.ts',
    when: 'Extension batches for existing modules',
    examples: [
      'perceptual-axes-extended-batch1.ts',
      'build-matrix-extended.ts',
    ],
  },

  {
    pattern: '{concept}-{subtopic}.ts',
    when: 'Submodules of a larger concept',
    examples: [
      'discourse-model.ts',
      'discourse-referents.ts',
      'constraint-semantics.ts',
      'constraint-verifiers.ts',
    ],
  },

  {
    pattern: '{concept}-tests.ts or {concept}-test.ts',
    when: 'Test files adjacent to implementation',
    examples: [
      'deictic-resolution-tests.ts',
      'paraphrase-suite.ts',
    ],
  },

  {
    pattern: '__tests__/{concept}.test.ts',
    when: 'Test files in dedicated __tests__ folder',
    examples: [
      '__tests__/constraint-satisfaction.test.ts',
      '__tests__/plan-generation.test.ts',
    ],
  },

  {
    pattern: 'index.ts',
    when: 'Folder public API (re-exports)',
    examples: [
      'gofai/index.ts',
      'nl/index.ts',
      'planning/index.ts',
    ],
  },
] as const;

/**
 * =============================================================================
 * TYPE NAMING CONVENTIONS
 * =============================================================================
 */

export interface TypeNamingRule {
  /** Pattern description */
  readonly pattern: string;
  /** When to use this pattern */
  readonly when: string;
  /** Example type names */
  readonly examples: string[];
}

export const TYPE_NAMING_RULES: readonly TypeNamingRule[] = [
  {
    pattern: 'PascalCase',
    when: 'All types, interfaces, classes',
    examples: [
      'CPLIntent',
      'CPLPlan',
      'ExecutionDiff',
      'ConstraintValidator',
      'OpcodeExecutor',
    ],
  },

  {
    pattern: '{Concept}Id',
    when: 'ID types (branded or nominal)',
    examples: [
      'TrackId',
      'SectionId',
      'CardId',
      'CardPlayId',
      'GofaiId',
      'OpcodeId',
    ],
  },

  {
    pattern: 'CPL{Stage}',
    when: 'CPL pipeline stage outputs',
    examples: [
      'CPLIntent',
      'CPLPlan',
      'CPLWithHoles',
      'CPLResolved',
    ],
  },

  {
    pattern: '{Domain}{Concept}',
    when: 'Domain-specific types',
    examples: [
      'MusicalAxis',
      'PerceptualAxis',
      'TemporalScope',
      'MelodicInterval',
      'HarmonicFunction',
    ],
  },

  {
    pattern: '{Action}Result',
    when: 'Result types for operations',
    examples: [
      'ParseResult',
      'ResolveResult',
      'PlanResult',
      'ExecutionResult',
      'ValidationResult',
    ],
  },

  {
    pattern: '{Concept}Config',
    when: 'Configuration objects',
    examples: [
      'TransactionConfig',
      'PlannerConfig',
      'ParserConfig',
      'ExecutionConfig',
    ],
  },

  {
    pattern: '{Concept}Error',
    when: 'Error types',
    examples: [
      'ParseError',
      'SemanticError',
      'ConstraintViolation',
      'ExecutionError',
      'PlanningError',
    ],
  },

  {
    pattern: 'I{Concept}',
    when: 'Never use I prefix (avoid Hungarian notation)',
    examples: [],
  },
] as const;

/**
 * =============================================================================
 * FUNCTION NAMING CONVENTIONS
 * =============================================================================
 */

export interface FunctionNamingRule {
  /** Pattern description */
  readonly pattern: string;
  /** When to use this pattern */
  readonly when: string;
  /** Example function names */
  readonly examples: string[];
}

export const FUNCTION_NAMING_RULES: readonly FunctionNamingRule[] = [
  {
    pattern: 'camelCase',
    when: 'All functions',
    examples: [
      'parseUtterance',
      'resolveAnaphora',
      'generatePlan',
      'executeOpcode',
      'validateConstraint',
    ],
  },

  {
    pattern: 'create{Type}',
    when: 'Factory functions',
    examples: [
      'createEditPackage',
      'createTransaction',
      'createMinimalFixture',
      'createCPLIntent',
    ],
  },

  {
    pattern: 'validate{Thing}',
    when: 'Validation functions',
    examples: [
      'validateFixture',
      'validateEditPackage',
      'validateConstraint',
      'validatePreconditions',
    ],
  },

  {
    pattern: 'check{Condition}',
    when: 'Boolean predicates',
    examples: [
      'checkReplayability',
      'checkPreconditions',
      'checkConstraints',
      'checkCapability',
    ],
  },

  {
    pattern: 'is{State} or has{Property}',
    when: 'Boolean predicates (state/property)',
    examples: [
      'isValid',
      'isConsumed',
      'hasHoles',
      'hasConflicts',
    ],
  },

  {
    pattern: 'get{Thing}',
    when: 'Getters (no side effects)',
    examples: [
      'getTransaction',
      'getSymbolTable',
      'getCurrentScope',
      'getReferent',
    ],
  },

  {
    pattern: 'compute{Result}',
    when: 'Expensive computations',
    examples: [
      'computeDiff',
      'computeSalience',
      'computeCost',
      'computeBinding',
    ],
  },

  {
    pattern: 'build{Thing}',
    when: 'Builders (multi-step construction)',
    examples: [
      'buildSymbolTable',
      'buildParseForest',
      'buildPlan',
      'buildEditPackage',
    ],
  },

  {
    pattern: 'resolve{Reference}',
    when: 'Resolution functions',
    examples: [
      'resolveAnaphora',
      'resolvePronoun',
      'resolveScope',
      'resolveReferent',
    ],
  },

  {
    pattern: 'apply{Action}',
    when: 'Application functions (side effects)',
    examples: [
      'applyOpcode',
      'applyPlan',
      'applyDiff',
      'applyConstraints',
    ],
  },

  {
    pattern: 'serialize{Type} / deserialize{Type}',
    when: 'Serialization functions',
    examples: [
      'serializeEditPackage',
      'deserializeEditPackage',
      'serializePlan',
      'deserializeCPL',
    ],
  },

  {
    pattern: 'format{Output}',
    when: 'Formatting functions',
    examples: [
      'formatDiff',
      'formatError',
      'formatTransactionLog',
      'formatProvenance',
    ],
  },
] as const;

/**
 * =============================================================================
 * VARIABLE AND CONSTANT NAMING CONVENTIONS
 * =============================================================================
 */

export interface VariableNamingRule {
  /** Pattern description */
  readonly pattern: string;
  /** When to use this pattern */
  readonly when: string;
  /** Example names */
  readonly examples: string[];
}

export const VARIABLE_NAMING_RULES: readonly VariableNamingRule[] = [
  {
    pattern: 'camelCase',
    when: 'All local variables and parameters',
    examples: [
      'utterance',
      'parseResult',
      'resolvedCPL',
      'candidatePlans',
      'executionDiff',
    ],
  },

  {
    pattern: 'SCREAMING_SNAKE_CASE',
    when: 'Module-level constants (immutable)',
    examples: [
      'DEFAULT_TIMEOUT_MS',
      'MAX_PARSE_DEPTH',
      'MIN_SALIENCE_THRESHOLD',
      'BUILTIN_NAMESPACE',
    ],
  },

  {
    pattern: 'PascalCase',
    when: 'Exported const objects (effectively types)',
    examples: [
      'DefaultParserConfig',
      'DefaultExecutionConfig',
      'EmptySymbolTable',
    ],
  },

  {
    pattern: '_privateVar',
    when: 'Never use underscore prefix (use TypeScript private)',
    examples: [],
  },

  {
    pattern: 'readonly property',
    when: 'Object properties that should not mutate',
    examples: [
      '{ readonly id: string }',
      '{ readonly timestamp: number }',
    ],
  },
] as const;

/**
 * =============================================================================
 * TEST FILE LAYOUT
 * =============================================================================
 */

export interface TestLayoutRule {
  /** Pattern description */
  readonly pattern: string;
  /** What it contains */
  readonly contains: string;
  /** Example */
  readonly example: string;
}

export const TEST_LAYOUT_RULES: readonly TestLayoutRule[] = [
  {
    pattern: '__tests__/ folder',
    contains: 'Unit tests for all modules in parent folder',
    example: 'src/gofai/planning/__tests__/constraint-satisfaction.test.ts',
  },

  {
    pattern: '{module}-tests.ts adjacent',
    contains: 'Integration tests or tests that reference fixtures',
    example: 'src/gofai/pragmatics/deictic-resolution-tests.ts',
  },

  {
    pattern: 'describe("{ModuleName}", ...)',
    contains: 'Top-level test suite for a module',
    example: 'describe("ConstraintSatisfaction", () => { ... })',
  },

  {
    pattern: 'describe("{functionName}", ...)',
    contains: 'Nested test suite for a function',
    example: 'describe("validateConstraint", () => { ... })',
  },

  {
    pattern: 'it("should {behavior}", ...)',
    contains: 'Individual test case',
    example: 'it("should reject violated constraints", async () => { ... })',
  },

  {
    pattern: 'beforeEach / afterEach',
    contains: 'Setup and teardown for test suites',
    example: 'beforeEach(() => { fixture = createMinimalFixture(); })',
  },
] as const;

/**
 * =============================================================================
 * IMPORT ORDER CONVENTIONS
 * =============================================================================
 */

export interface ImportOrderRule {
  /** Group number (lower = earlier) */
  readonly order: number;
  /** What goes in this group */
  readonly group: string;
  /** Example */
  readonly example: string;
}

export const IMPORT_ORDER_RULES: readonly ImportOrderRule[] = [
  {
    order: 1,
    group: 'Node.js built-ins',
    example: "import * as path from 'path';",
  },
  {
    order: 2,
    group: 'External dependencies',
    example: "import { z } from 'zod';",
  },
  {
    order: 3,
    group: 'CardPlay core (absolute imports)',
    example: "import { Event } from '@/events';",
  },
  {
    order: 4,
    group: 'GOFAI types (absolute imports)',
    example: "import type { GofaiId } from '@/gofai/types';",
  },
  {
    order: 5,
    group: 'GOFAI modules (absolute imports)',
    example: "import { parseUtterance } from '@/gofai/nl/parser';",
  },
  {
    order: 6,
    group: 'Relative imports (sibling modules)',
    example: "import { validateConstraint } from './constraint-verifiers';",
  },
  {
    order: 7,
    group: 'Relative imports (parent modules)',
    example: "import type { CPLIntent } from '../semantics/cpl-types';",
  },
] as const;

/**
 * =============================================================================
 * DOCUMENTATION CONVENTIONS
 * =============================================================================
 */

export interface DocConvention {
  /** What to document */
  readonly target: string;
  /** Required elements */
  readonly required: string[];
  /** Example */
  readonly example: string;
}

export const DOC_CONVENTIONS: readonly DocConvention[] = [
  {
    target: 'File header',
    required: [
      '@file description',
      '@gofai_goalB step reference',
      'Purpose paragraph',
    ],
    example: `/**
 * @file Constraint Satisfaction
 * @gofai_goalB Step 256 [Sem]
 * 
 * This module implements constraint satisfaction for planning.
 * It validates candidate plans against user constraints...
 */`,
  },

  {
    target: 'Exported type',
    required: [
      'Purpose description',
      'Field documentation',
      'Example usage (optional but encouraged)',
    ],
    example: `/**
 * Represents a validated constraint that must be satisfied by plans.
 */
export interface Constraint {
  /** Unique constraint ID */
  readonly id: ConstraintId;
  /** Constraint type (preserve, only-change, range) */
  readonly type: ConstraintType;
  /** Target selector */
  readonly target: Selector;
}`,
  },

  {
    target: 'Exported function',
    required: [
      'Purpose description',
      '@param for each parameter',
      '@returns for return value',
      '@throws for errors (if applicable)',
    ],
    example: `/**
 * Validates a constraint against a before/after state.
 * 
 * @param constraint - The constraint to validate
 * @param before - State before edit
 * @param after - State after edit
 * @returns Validation result with pass/fail + counterexample
 * @throws Never throws; returns failed validation on error
 */
export function validateConstraint(
  constraint: Constraint,
  before: ProjectState,
  after: ProjectState
): ValidationResult { ... }`,
  },

  {
    target: 'Complex algorithm',
    required: [
      'Algorithm description',
      'Complexity analysis (if non-trivial)',
      'Design rationale',
    ],
    example: `/**
 * Bounded search over opcode combinations.
 * 
 * Uses beam search with depth limit to keep planning tractable:
 * - Beam size: top K candidates per depth
 * - Max depth: prevents exponential blowup
 * - Heuristic: cost-based pruning
 * 
 * Time complexity: O(K * D * B) where:
 * - K = beam size
 * - D = max depth
 * - B = branching factor (opcodes per node)
 */`,
  },
] as const;

/**
 * =============================================================================
 * LINTING AND FORMATTING
 * =============================================================================
 */

export interface LintRule {
  /** Rule name */
  readonly rule: string;
  /** Why this rule exists */
  readonly rationale: string;
}

export const LINT_RULES: readonly LintRule[] = [
  {
    rule: 'Use TypeScript strict mode',
    rationale: 'Catch type errors early; no implicit any',
  },
  {
    rule: 'Prefer readonly for immutable data',
    rationale: 'Make immutability explicit; prevent accidental mutation',
  },
  {
    rule: 'Use const over let when possible',
    rationale: 'Signal immutability at variable level',
  },
  {
    rule: 'No unused imports',
    rationale: 'Keep code clean; avoid confusion',
  },
  {
    rule: 'No unused variables',
    rationale: 'Catch dead code; improve maintainability',
  },
  {
    rule: 'Prefer interface over type for object shapes',
    rationale: 'Better error messages; extensibility',
  },
  {
    rule: 'Use branded types for IDs',
    rationale: 'Prevent mixing incompatible IDs',
  },
  {
    rule: 'Avoid any except in specific escape hatches',
    rationale: 'Preserve type safety',
  },
  {
    rule: 'Document all exported APIs',
    rationale: 'Enable discoverability; support users',
  },
  {
    rule: 'Use consistent formatting (Prettier)',
    rationale: 'Reduce diff noise; focus on logic',
  },
] as const;

/**
 * =============================================================================
 * VERSIONING AND MIGRATION
 * =============================================================================
 */

export interface VersioningRule {
  /** What gets versioned */
  readonly artifact: string;
  /** Versioning scheme */
  readonly scheme: string;
  /** When to bump */
  readonly bumpWhen: string;
}

export const VERSIONING_RULES: readonly VersioningRule[] = [
  {
    artifact: 'CPL schema',
    scheme: 'Semantic versioning (major.minor.patch)',
    bumpWhen: 'Major: breaking changes; Minor: additions; Patch: fixes',
  },
  {
    artifact: 'Opcode definitions',
    scheme: 'Namespaced versioning (namespace:opcode@version)',
    bumpWhen: 'Whenever semantics change',
  },
  {
    artifact: 'Lexicon',
    scheme: 'Compiler version fingerprint',
    bumpWhen: 'Bundled in compiler version',
  },
  {
    artifact: 'Song fixture format',
    scheme: 'Semantic versioning (major.minor.patch)',
    bumpWhen: 'Major: breaking changes; Minor: additions; Patch: fixes',
  },
  {
    artifact: 'Edit package schema',
    scheme: 'Semantic versioning (major.minor.patch)',
    bumpWhen: 'Major: breaking changes; Minor: additions; Patch: fixes',
  },
] as const;

/**
 * =============================================================================
 * COMPATIBILITY WITH CARDPLAY CONVENTIONS
 * =============================================================================
 */

export interface CompatibilityNote {
  /** CardPlay convention */
  readonly cardplayConvention: string;
  /** How GOFAI aligns */
  readonly gofaiAlignment: string;
}

export const CARDPLAY_COMPATIBILITY: readonly CompatibilityNote[] = [
  {
    cardplayConvention: 'CardPlayId (namespaced, branded)',
    gofaiAlignment: 'GofaiId follows same pattern (namespace:local)',
  },
  {
    cardplayConvention: 'Event<P> generic payload',
    gofaiAlignment: 'CPL nodes are also generic and composable',
  },
  {
    cardplayConvention: 'Canon first (validate at build)',
    gofaiAlignment: 'Lexicon tables validated at compile; no runtime ambiguity',
  },
  {
    cardplayConvention: 'Explicit provenance',
    gofaiAlignment: 'Every CPL node carries lexeme/rule provenance',
  },
  {
    cardplayConvention: 'Deterministic serialization',
    gofaiAlignment: 'CPL, plans, and diffs are deterministically serializable',
  },
  {
    cardplayConvention: 'Undo/redo via store',
    gofaiAlignment: 'Edit packages integrate with CardPlay undo stack',
  },
  {
    cardplayConvention: 'Extension packs',
    gofaiAlignment: 'GOFAI extensions namespace lexemes/opcodes/constraints',
  },
] as const;

/**
 * =============================================================================
 * VALIDATION UTILITIES
 * =============================================================================
 */

/**
 * Validates a file name against naming conventions.
 */
export function validateFileName(fileName: string): { valid: boolean; reason?: string } {
  if (fileName.includes('_')) {
    return {
      valid: false,
      reason: 'Use kebab-case, not snake_case',
    };
  }

  if (fileName !== fileName.toLowerCase()) {
    if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx')) {
      return {
        valid: false,
        reason: 'File names should be lowercase (except .ts/.tsx extension)',
      };
    }
  }

  if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx')) {
    return {
      valid: false,
      reason: 'TypeScript files must end with .ts or .tsx',
    };
  }

  return { valid: true };
}

/**
 * Validates a type name against naming conventions.
 */
export function validateTypeName(typeName: string): { valid: boolean; reason?: string } {
  if (typeName.startsWith('I') && typeName[1]?.toUpperCase() === typeName[1]) {
    return {
      valid: false,
      reason: 'Do not use "I" prefix for interfaces (avoid Hungarian notation)',
    };
  }

  if (typeName[0]?.toLowerCase() === typeName[0]) {
    return {
      valid: false,
      reason: 'Type names must be PascalCase',
    };
  }

  return { valid: true };
}

/**
 * Validates a function name against naming conventions.
 */
export function validateFunctionName(functionName: string): { valid: boolean; reason?: string } {
  if (functionName[0]?.toUpperCase() === functionName[0]) {
    return {
      valid: false,
      reason: 'Function names must be camelCase (start with lowercase)',
    };
  }

  if (functionName.includes('_')) {
    return {
      valid: false,
      reason: 'Use camelCase, not snake_case',
    };
  }

  return { valid: true };
}

/**
 * Checks if a folder is in the expected GOFAI layout.
 */
export function isValidGofaiFolder(folderName: string): boolean {
  return GOFAI_FOLDER_LAYOUT.some((spec) => spec.name === folderName);
}

/**
 * Gets allowed imports for a folder.
 */
export function getAllowedImports(folderName: string): readonly string[] {
  const spec = GOFAI_FOLDER_LAYOUT.find((s) => s.name === folderName);
  return spec?.mayImportFrom ?? [];
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines comprehensive naming conventions for the GOFAI system:
 * 
 * **Folder layout:** 14 top-level folders with clear responsibilities
 * **File naming:** kebab-case for all files; batch suffixes for large modules
 * **Type naming:** PascalCase; no I prefix; branded IDs
 * **Function naming:** camelCase; verb prefixes (create, validate, check, etc.)
 * **Variable naming:** camelCase locals; SCREAMING_SNAKE_CASE constants
 * **Documentation:** Required headers, param docs, examples
 * **Compatibility:** Aligns with CardPlay conventions
 * 
 * These conventions enable:
 * - Predictable code organization
 * - Discoverability (know where to find things)
 * - Consistency across 100K+ LOC
 * - Tooling support (linters, generators)
 * - Code review efficiency
 * 
 * **Cross-references:**
 * - Step 004: Vocabulary policy (namespace rules)
 * - Step 032: CPL as public interface (type naming)
 * - Step 033: Deterministic ordering (constant naming)
 * - Step 053: Canon check script (validation)
 */
