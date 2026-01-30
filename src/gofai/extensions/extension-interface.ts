/**
 * @file GOFAI Extension Interface
 * @module gofai/extensions/extension-interface
 * 
 * Implements Step 401: Define the GOFAI extension interface (register lexicon,
 * bindings, planner hooks, Prolog modules) with strict namespacing rules.
 * 
 * This is the core interface that third-party extensions must implement to
 * add new linguistic capabilities, musical operations, and domain knowledge
 * to the GOFAI system.
 * 
 * Design principles:
 * - Strict namespacing: all extension contributions must be namespaced
 * - Declarative: extensions declare capabilities, not imperative code
 * - Versioned: extensions declare compatible GOFAI versions
 * - Validated: extensions are validated before registration
 * - Isolated: extensions cannot interfere with core or each other
 * - Documented: extensions must include documentation and examples
 * 
 * @see gofai_goalB.md Step 401
 */

import type { GofaiId } from '../canon/types.js';

// ============================================================================
// Extension Metadata
// ============================================================================

/**
 * Extension metadata.
 * 
 * Every extension must provide metadata that identifies it and declares
 * its capabilities and requirements.
 */
export interface GOFAIExtensionMetadata {
  /** Extension namespace (must be unique) */
  readonly namespace: string;

  /** Extension version (semver) */
  readonly version: string;

  /** Human-readable name */
  readonly name: string;

  /** Brief description */
  readonly description: string;

  /** Author information */
  readonly author: {
    readonly name: string;
    readonly email?: string;
    readonly url?: string;
  };

  /** License (SPDX identifier) */
  readonly license: string;

  /** Compatible GOFAI versions (semver range) */
  readonly compatibleGofaiVersions: string;

  /** Required CardPlay version (semver range) */
  readonly requiredCardplayVersion?: string;

  /** Tags for categorization */
  readonly tags: readonly string[];

  /** Homepage URL */
  readonly homepage?: string;

  /** Repository URL */
  readonly repository?: string;

  /** Documentation URL */
  readonly documentation?: string;
}

// ============================================================================
// Extension Interface
// ============================================================================

/**
 * GOFAI Extension Interface.
 * 
 * All extensions must implement this interface to be registered with
 * the GOFAI system.
 */
export interface GOFAIExtension {
  /** Extension metadata */
  readonly metadata: GOFAIExtensionMetadata;

  /** Lexicon contributions (optional) */
  readonly lexicon?: ExtensionLexiconContribution;

  /** Grammar contributions (optional) */
  readonly grammar?: ExtensionGrammarContribution;

  /** Semantic bindings (optional) */
  readonly semantics?: ExtensionSemanticsContribution;

  /** Planner hooks (optional) */
  readonly planner?: ExtensionPlannerContribution;

  /** Execution hooks (optional) */
  readonly execution?: ExtensionExecutionContribution;

  /** Prolog modules (optional) */
  readonly prolog?: ExtensionPrologContribution;

  /** Card/Board/Deck bindings (optional) */
  readonly cardplayBindings?: ExtensionCardPlayBindings;

  /** Constraint definitions (optional) */
  readonly constraints?: ExtensionConstraintContribution;

  /** Axis definitions (optional) */
  readonly axes?: ExtensionAxisContribution;

  /**
   * Initialize the extension.
   * 
   * Called once when the extension is registered. Should perform any
   * setup needed, but must not mutate global state.
   * 
   * @returns Promise resolving when initialization is complete
   */
  initialize?(): Promise<void>;

  /**
   * Dispose the extension.
   * 
   * Called when the extension is unregistered. Should clean up resources.
   */
  dispose?(): Promise<void>;
}

// ============================================================================
// Lexicon Contributions
// ============================================================================

/**
 * Lexicon contribution from an extension.
 */
export interface ExtensionLexiconContribution {
  /** Lexemes to add */
  readonly lexemes: readonly ExtensionLexeme[];

  /** Synonyms to add */
  readonly synonyms?: readonly ExtensionSynonym[];

  /** Lexical rules */
  readonly rules?: readonly ExtensionLexicalRule[];
}

/**
 * A lexeme contributed by an extension.
 */
export interface ExtensionLexeme {
  /** Lexeme ID (must be namespaced) */
  readonly id: GofaiId;

  /** Word form */
  readonly word: string;

  /** Part of speech */
  readonly pos: string;

  /** Meanings */
  readonly meanings: readonly ExtensionMeaning[];

  /** Usage examples */
  readonly examples: readonly string[];

  /** Documentation */
  readonly documentation?: string;
}

/**
 * A meaning for a lexeme.
 */
export interface ExtensionMeaning {
  /** Meaning ID (must be namespaced) */
  readonly id: GofaiId;

  /** Semantic type */
  readonly semanticType: string;

  /** Semantic features */
  readonly features: Record<string, unknown>;

  /** When to use this meaning (selectional restrictions) */
  readonly restrictions?: MeaningRestrictions;

  /** Example usages */
  readonly examples: readonly string[];
}

/**
 * Restrictions on when a meaning applies.
 */
export interface MeaningRestrictions {
  /** Required context features */
  readonly requires?: readonly string[];

  /** Forbidden context features */
  readonly forbids?: readonly string[];

  /** Required discourse state */
  readonly discourseRequires?: Record<string, unknown>;
}

/**
 * A synonym mapping.
 */
export interface ExtensionSynonym {
  /** The word being defined */
  readonly word: string;

  /** The canonical word it maps to */
  readonly canonicalWord: string;

  /** Strength (1.0 = perfect synonym) */
  readonly strength: number;

  /** Context where this synonym applies */
  readonly context?: string;
}

/**
 * A lexical rule (e.g., morphological transformations).
 */
export interface ExtensionLexicalRule {
  /** Rule ID */
  readonly id: GofaiId;

  /** Pattern to match */
  readonly pattern: string;

  /** Transformation */
  readonly transform: string;

  /** When to apply */
  readonly conditions?: Record<string, unknown>;
}

// ============================================================================
// Grammar Contributions
// ============================================================================

/**
 * Grammar contribution from an extension.
 */
export interface ExtensionGrammarContribution {
  /** Grammar rules to add */
  readonly rules: readonly ExtensionGrammarRule[];

  /** Construction templates */
  readonly constructions?: readonly ExtensionConstruction[];
}

/**
 * A grammar rule contributed by an extension.
 */
export interface ExtensionGrammarRule {
  /** Rule ID (must be namespaced) */
  readonly id: GofaiId;

  /** Rule name */
  readonly name: string;

  /** Left-hand side (non-terminal) */
  readonly lhs: string;

  /** Right-hand side (sequence of symbols) */
  readonly rhs: readonly GrammarSymbol[];

  /** Semantic action (how to combine meanings) */
  readonly semanticAction: string;

  /** Priority (for disambiguation) */
  readonly priority?: number;

  /** Documentation */
  readonly documentation?: string;

  /** Test cases */
  readonly tests?: readonly GrammarRuleTest[];
}

/**
 * A grammar symbol.
 */
export type GrammarSymbol =
  | { readonly type: 'terminal'; readonly value: string }
  | { readonly type: 'non-terminal'; readonly value: string }
  | { readonly type: 'lexeme'; readonly pos: string; readonly features?: Record<string, unknown> };

/**
 * A test case for a grammar rule.
 */
export interface GrammarRuleTest {
  readonly input: string;
  readonly shouldMatch: boolean;
  readonly expectedSemantics?: unknown;
}

/**
 * A construction (multi-word pattern with meaning).
 */
export interface ExtensionConstruction {
  /** Construction ID */
  readonly id: GofaiId;

  /** Pattern (with slots) */
  readonly pattern: string;

  /** Slots and their constraints */
  readonly slots: Record<string, SlotConstraint>;

  /** Meaning template */
  readonly meaningTemplate: unknown;

  /** Examples */
  readonly examples: readonly string[];
}

/**
 * Constraints on a construction slot.
 */
export interface SlotConstraint {
  readonly type: string;
  readonly features?: Record<string, unknown>;
  readonly optional?: boolean;
}

// ============================================================================
// Semantics Contributions
// ============================================================================

/**
 * Semantics contribution from an extension.
 */
export interface ExtensionSemanticsContribution {
  /** Semantic types to add */
  readonly types: readonly ExtensionSemanticType[];

  /** Semantic composition rules */
  readonly compositionRules?: readonly ExtensionCompositionRule[];
}

/**
 * A semantic type contributed by an extension.
 */
export interface ExtensionSemanticType {
  /** Type ID (must be namespaced) */
  readonly id: GofaiId;

  /** Type name */
  readonly name: string;

  /** Schema for values of this type */
  readonly schema: SemanticTypeSchema;

  /** Documentation */
  readonly documentation?: string;
}

/**
 * Schema for a semantic type.
 */
export interface SemanticTypeSchema {
  readonly kind: 'primitive' | 'record' | 'union' | 'list' | 'function';
  readonly fields?: Record<string, SemanticTypeSchema>;
  readonly elementType?: SemanticTypeSchema;
  readonly alternatives?: readonly SemanticTypeSchema[];
  readonly argumentTypes?: readonly SemanticTypeSchema[];
  readonly returnType?: SemanticTypeSchema;
}

/**
 * A semantic composition rule.
 */
export interface ExtensionCompositionRule {
  /** Rule ID */
  readonly id: GofaiId;

  /** Pattern of semantic types to combine */
  readonly pattern: readonly string[];

  /** Result type */
  readonly resultType: string;

  /** Composition function */
  readonly compose: (args: readonly unknown[]) => unknown;
}

// ============================================================================
// Planner Contributions
// ============================================================================

/**
 * Planner contribution from an extension.
 */
export interface ExtensionPlannerContribution {
  /** Lever definitions */
  readonly levers?: readonly ExtensionLever[];

  /** Opcode definitions */
  readonly opcodes: readonly ExtensionOpcode[];

  /** Planning heuristics */
  readonly heuristics?: readonly ExtensionPlanningHeuristic[];
}

/**
 * A lever contributed by an extension.
 */
export interface ExtensionLever {
  /** Lever ID (must be namespaced) */
  readonly id: GofaiId;

  /** Lever name */
  readonly name: string;

  /** Which axes this lever affects */
  readonly affectsAxes: readonly string[];

  /** Candidate opcodes for this lever */
  readonly candidateOpcodes: readonly GofaiId[];

  /** Selection criteria */
  readonly selectionCriteria?: Record<string, unknown>;

  /** Documentation */
  readonly documentation?: string;
}

/**
 * An opcode (plan operation) contributed by an extension.
 */
export interface ExtensionOpcode {
  /** Opcode ID (must be namespaced) */
  readonly id: GofaiId;

  /** Opcode name */
  readonly name: string;

  /** Parameter schema */
  readonly parameters: Record<string, ParameterSchema>;

  /** Preconditions */
  readonly preconditions: readonly string[];

  /** Effects */
  readonly effects: readonly string[];

  /** Cost model */
  readonly costModel?: CostModel;

  /** Compilation function (CPL opcode → host actions) */
  readonly compile?: OpcodeCompiler;

  /** Documentation */
  readonly documentation: string;

  /** Examples */
  readonly examples: readonly OpcodeExample[];

  /** Tests */
  readonly tests?: readonly OpcodeTest[];
}

/**
 * Schema for an opcode parameter.
 */
export interface ParameterSchema {
  readonly type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  readonly description: string;
  readonly required: boolean;
  readonly default?: unknown;
  readonly enum?: readonly unknown[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly items?: ParameterSchema;
  readonly properties?: Record<string, ParameterSchema>;
}

/**
 * Cost model for an opcode.
 */
export interface CostModel {
  /** Base cost */
  readonly baseCost: number;

  /** Cost per affected entity */
  readonly perEntityCost?: number;

  /** Cost multipliers based on context */
  readonly multipliers?: Record<string, number>;
}

/**
 * Function that compiles an opcode to host actions.
 */
export type OpcodeCompiler = (
  parameters: Record<string, unknown>,
  context: OpcodeCompilationContext
) => Promise<CompiledOpcodeResult>;

/**
 * Context provided to opcode compilers.
 */
export interface OpcodeCompilationContext {
  /** Project state (read-only) */
  readonly projectState: unknown;

  /** Discourse state (read-only) */
  readonly discourseState: unknown;

  /** Scope for this opcode */
  readonly scope: unknown;

  /** Available utility functions */
  readonly utils: OpcodeCompilerUtils;
}

/**
 * Utility functions available to opcode compilers.
 */
export interface OpcodeCompilerUtils {
  /** Apply selector to get entities */
  selectEntities(selector: unknown): readonly unknown[];

  /** Compute analysis facts */
  analyze(query: string): unknown;

  /** Query Prolog knowledge base */
  queryProlog(query: string): readonly unknown[];
}

/**
 * Result of compiling an opcode.
 */
export interface CompiledOpcodeResult {
  /** Host actions to execute */
  readonly actions: readonly unknown[];

  /** Estimated effects */
  readonly estimatedEffects?: readonly string[];

  /** Warning messages */
  readonly warnings?: readonly string[];
}

/**
 * Example usage of an opcode.
 */
export interface OpcodeExample {
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly expectedOutcome: string;
}

/**
 * Test case for an opcode.
 */
export interface OpcodeTest {
  readonly description: string;
  readonly fixture: string;
  readonly parameters: Record<string, unknown>;
  readonly assertions: readonly TestAssertion[];
}

/**
 * Test assertion.
 */
export interface TestAssertion {
  readonly type: 'diff-count' | 'constraint-satisfied' | 'state-matches';
  readonly assertion: unknown;
}

/**
 * A planning heuristic.
 */
export interface ExtensionPlanningHeuristic {
  /** Heuristic ID */
  readonly id: GofaiId;

  /** When to apply */
  readonly applicability: HeuristicApplicability;

  /** Scoring function */
  readonly score: (plan: unknown, context: unknown) => number;
}

/**
 * When a heuristic applies.
 */
export interface HeuristicApplicability {
  readonly goalTypes?: readonly string[];
  readonly constraintTypes?: readonly string[];
  readonly boardTypes?: readonly string[];
}

// ============================================================================
// Execution Contributions
// ============================================================================

/**
 * Execution contribution from an extension.
 */
export interface ExtensionExecutionContribution {
  /** Execution handlers for opcodes */
  readonly handlers: Record<GofaiId, ExecutionHandler>;

  /** Constraint checkers */
  readonly constraintCheckers?: Record<string, ConstraintChecker>;
}

/**
 * Execution handler for an opcode.
 * 
 * MUST be pure: returns patch objects, does not mutate state directly.
 */
export type ExecutionHandler = (
  parameters: Record<string, unknown>,
  context: ExecutionContext
) => Promise<ExecutionResult>;

/**
 * Execution context.
 */
export interface ExecutionContext {
  /** Project state (read-only) */
  readonly projectState: unknown;

  /** Selected entities */
  readonly selectedEntities: readonly unknown[];

  /** Utilities */
  readonly utils: ExecutionUtils;
}

/**
 * Execution utilities.
 */
export interface ExecutionUtils {
  /** Create event patches */
  createEventPatch(entityId: string, changes: unknown): unknown;

  /** Create card patches */
  createCardPatch(cardId: string, changes: unknown): unknown;

  /** Validate patch */
  validatePatch(patch: unknown): boolean;
}

/**
 * Execution result.
 */
export interface ExecutionResult {
  /** Patches to apply */
  readonly patches: readonly unknown[];

  /** Warnings */
  readonly warnings?: readonly string[];

  /** Debug info */
  readonly debug?: Record<string, unknown>;
}

/**
 * Constraint checker.
 */
export type ConstraintChecker = (
  before: unknown,
  after: unknown,
  constraint: unknown
) => ConstraintCheckResult;

/**
 * Constraint check result.
 */
export interface ConstraintCheckResult {
  readonly passed: boolean;
  readonly violations?: readonly ConstraintViolation[];
}

/**
 * A constraint violation.
 */
export interface ConstraintViolation {
  readonly message: string;
  readonly counterexample: unknown;
  readonly affectedEntities: readonly string[];
}

// ============================================================================
// Prolog Contributions
// ============================================================================

/**
 * Prolog contribution from an extension.
 */
export interface ExtensionPrologContribution {
  /** Prolog module name (must be namespaced) */
  readonly moduleName: string;

  /** Prolog source code */
  readonly source: string;

  /** Vocabulary exports (for lexicon ingestion) */
  readonly vocabularyExports?: readonly PrologVocabExport[];

  /** Theory exports (for planning) */
  readonly theoryExports?: readonly PrologTheoryExport[];

  /** Test queries */
  readonly tests?: readonly PrologTest[];
}

/**
 * Vocabulary export from Prolog.
 */
export interface PrologVocabExport {
  /** Predicate name */
  readonly predicate: string;

  /** Arity */
  readonly arity: number;

  /** How to interpret results */
  readonly interpretation: 'lexeme' | 'synonym' | 'category' | 'relation';
}

/**
 * Theory export from Prolog.
 */
export interface PrologTheoryExport {
  /** Predicate name */
  readonly predicate: string;

  /** Arity */
  readonly arity: number;

  /** Description */
  readonly description: string;
}

/**
 * Prolog test case.
 */
export interface PrologTest {
  readonly description: string;
  readonly query: string;
  readonly expectedResults: readonly unknown[];
}

// ============================================================================
// CardPlay Bindings
// ============================================================================

/**
 * CardPlay entity bindings contributed by an extension.
 */
export interface ExtensionCardPlayBindings {
  /** Card bindings */
  readonly cards?: readonly ExtensionCardBinding[];

  /** Board bindings */
  readonly boards?: readonly ExtensionBoardBinding[];

  /** Deck bindings */
  readonly decks?: readonly ExtensionDeckBinding[];
}

/**
 * Binding for a card.
 */
export interface ExtensionCardBinding {
  /** Card ID in CardPlay */
  readonly cardId: string;

  /** Synonyms for referring to this card */
  readonly synonyms: readonly string[];

  /** Role hints */
  readonly roles?: readonly string[];

  /** Parameter semantics */
  readonly parameterSemantics?: Record<string, ParameterSemantics>;

  /** Axis bindings */
  readonly axisBindings?: Record<string, string>;
}

/**
 * Semantics for a card parameter.
 */
export interface ParameterSemantics {
  /** Natural language description */
  readonly description: string;

  /** Synonyms for this parameter */
  readonly synonyms?: readonly string[];

  /** Typical values */
  readonly typicalValues?: readonly unknown[];

  /** Perceptual interpretation */
  readonly perceptualMapping?: {
    readonly axis: string;
    readonly direction: 'increase' | 'decrease';
  };
}

/**
 * Binding for a board.
 */
export interface ExtensionBoardBinding {
  /** Board type ID */
  readonly boardType: string;

  /** Synonyms */
  readonly synonyms: readonly string[];

  /** Default scopes for this board */
  readonly defaultScopes?: readonly string[];

  /** Workflow verbs */
  readonly workflowVerbs?: readonly string[];

  /** Safe execution policy */
  readonly safeExecutionPolicy?: 'full-auto' | 'preview-first' | 'full-manual';
}

/**
 * Binding for a deck.
 */
export interface ExtensionDeckBinding {
  /** Deck type ID */
  readonly deckType: string;

  /** Synonyms */
  readonly synonyms: readonly string[];

  /** Common actions */
  readonly commonActions?: readonly string[];

  /** Safe scopes */
  readonly safeScopes?: readonly string[];
}

// ============================================================================
// Constraint Contributions
// ============================================================================

/**
 * Constraint contribution from an extension.
 */
export interface ExtensionConstraintContribution {
  /** Constraint definitions */
  readonly constraints: readonly ExtensionConstraint[];
}

/**
 * A constraint definition.
 */
export interface ExtensionConstraint {
  /** Constraint ID (must be namespaced) */
  readonly id: GofaiId;

  /** Constraint name */
  readonly name: string;

  /** Constraint type */
  readonly type: 'preserve' | 'only-change' | 'within-range' | 'maintain' | 'custom';

  /** Parameter schema */
  readonly parameters: Record<string, ParameterSchema>;

  /** Checker function */
  readonly checker: ConstraintChecker;

  /** Documentation */
  readonly documentation: string;

  /** Examples */
  readonly examples: readonly ConstraintExample[];
}

/**
 * Example of a constraint.
 */
export interface ConstraintExample {
  readonly description: string;
  readonly constraint: Record<string, unknown>;
  readonly shouldPass: boolean;
}

// ============================================================================
// Axis Contributions
// ============================================================================

/**
 * Axis contribution from an extension.
 */
export interface ExtensionAxisContribution {
  /** Axis definitions */
  readonly axes: readonly ExtensionAxis[];
}

/**
 * An axis definition.
 */
export interface ExtensionAxis {
  /** Axis ID (must be namespaced) */
  readonly id: GofaiId;

  /** Axis name */
  readonly name: string;

  /** Axis type */
  readonly type: 'perceptual' | 'symbolic' | 'hybrid';

  /** Value range */
  readonly range: AxisRange;

  /** Synonyms */
  readonly synonyms: readonly string[];

  /** Opposite axis (if any) */
  readonly opposite?: GofaiId;

  /** Related axes */
  readonly related?: readonly GofaiId[];

  /** Documentation */
  readonly documentation: string;
}

/**
 * Axis value range.
 */
export interface AxisRange {
  readonly type: 'continuous' | 'discrete' | 'categorical';
  readonly min?: number;
  readonly max?: number;
  readonly values?: readonly string[];
  readonly default?: unknown;
}

// ============================================================================
// Extension Validation
// ============================================================================

/**
 * Validation result for an extension.
 */
export interface ExtensionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

/**
 * Validation error.
 */
export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Validation warning.
 */
export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

/**
 * Validate an extension before registration.
 * 
 * @param extension The extension to validate
 * @returns Validation result
 */
export function validateExtension(extension: GOFAIExtension): ExtensionValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check namespace format
  if (!isValidNamespace(extension.metadata.namespace)) {
    errors.push({
      code: 'invalid-namespace',
      message: `Namespace "${extension.metadata.namespace}" is invalid. Must be lowercase alphanumeric with hyphens.`,
      path: 'metadata.namespace',
    });
  }

  // Check for reserved namespaces
  if (isReservedNamespace(extension.metadata.namespace)) {
    errors.push({
      code: 'reserved-namespace',
      message: `Namespace "${extension.metadata.namespace}" is reserved.`,
      path: 'metadata.namespace',
    });
  }

  // Validate all contributed IDs are properly namespaced
  if (extension.lexicon) {
    for (const lexeme of extension.lexicon.lexemes) {
      if (!isProperlyNamespaced(lexeme.id, extension.metadata.namespace)) {
        errors.push({
          code: 'improper-namespace',
          message: `Lexeme ID "${lexeme.id}" does not match extension namespace "${extension.metadata.namespace}"`,
          path: `lexicon.lexemes[${lexeme.word}]`,
        });
      }
    }
  }

  // Validate opcode IDs
  if (extension.planner) {
    for (const opcode of extension.planner.opcodes) {
      if (!isProperlyNamespaced(opcode.id, extension.metadata.namespace)) {
        errors.push({
          code: 'improper-namespace',
          message: `Opcode ID "${opcode.id}" does not match extension namespace "${extension.metadata.namespace}"`,
          path: `planner.opcodes[${opcode.name}]`,
        });
      }

      // Check for missing documentation
      if (!opcode.documentation || opcode.documentation.length < 10) {
        warnings.push({
          code: 'insufficient-documentation',
          message: `Opcode "${opcode.name}" has insufficient documentation`,
          path: `planner.opcodes[${opcode.name}]`,
        });
      }

      // Check for missing examples
      if (!opcode.examples || opcode.examples.length === 0) {
        warnings.push({
          code: 'no-examples',
          message: `Opcode "${opcode.name}" has no examples`,
          path: `planner.opcodes[${opcode.name}]`,
        });
      }
    }
  }

  // Check for conflicting contributions
  // (Would need access to extension registry to check properly)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a namespace is valid.
 */
function isValidNamespace(namespace: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(namespace);
}

/**
 * Check if a namespace is reserved.
 */
function isReservedNamespace(namespace: string): boolean {
  const reserved = ['gofai', 'core', 'cardplay', 'system', 'internal'];
  return reserved.includes(namespace);
}

/**
 * Check if an ID is properly namespaced.
 */
function isProperlyNamespaced(id: GofaiId, namespace: string): boolean {
  return id.startsWith(`${namespace}:`);
}
