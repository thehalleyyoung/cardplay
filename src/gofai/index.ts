/**
 * GOFAI Music+ — CardPlay Natural Language Compiler
 *
 * This module is the root of the GOFAI Music+ system, a deterministic language
 * compiler that translates natural language music instructions into verified
 * CardPlay edits.
 *
 * ## Core Guarantees
 *
 * 1. **Offline**: No network at runtime
 * 2. **Deterministic**: Same input → same output
 * 3. **Inspectable**: Every decision is auditable
 * 4. **Undoable**: Every mutation is reversible
 *
 * ## Module Structure
 *
 * ```
 * gofai/
 *   canon/          — Vocabulary tables and normalizers (SSOT)
 *   cpl/            — CardPlay Logic types and validation
 *   nl/             — Natural language parsing and semantics
 *   planning/       — Goal → lever → plan compilation
 *   execution/      — Plan → mutation → diff → undo
 *   pragmatics/     — Dialogue state and reference resolution
 *   extensions/     — Third-party integration API
 *   ui/             — Deck and panel components
 *   tests/          — Comprehensive test suites
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * import { GofaiCompiler } from './gofai';
 *
 * const compiler = new GofaiCompiler(projectWorld);
 * const result = compiler.compile("Make the chorus brighter");
 *
 * if (result.type === 'success') {
 *   // result.cpl — The parsed intent
 *   // result.plan — The action sequence
 *   // result.preview — What will change
 *   const editPackage = compiler.apply(result.plan);
 *   // editPackage.undo() — Reverse the changes
 * } else if (result.type === 'clarification') {
 *   // result.questions — What needs to be resolved
 * } else {
 *   // result.errors — What went wrong
 * }
 * ```
 *
 * @module gofai
 * @see {@link docs/gofai/product-contract.md} for guarantees
 * @see {@link docs/gofai/index.md} for full documentation
 */

// =============================================================================
// Re-exports: Canon (Vocabulary and Normalizers)
// =============================================================================

export * from './canon';

// =============================================================================
// Re-exports: Invariants (Semantic Safety Checks)
// =============================================================================

// Export only non-conflicting types from invariants
export {
  type InvariantCheckResult,
  type ConstraintVerificationResult,
  type CoreInvariant,
  checkCoreInvariants,
  type ConstraintVerifier,
} from './invariants';

// =============================================================================
// Re-exports: CPL (CardPlay Logic Types)
// =============================================================================

// TODO: Implement CPL module
// export * from './cpl';

// =============================================================================
// Re-exports: NL (Natural Language Frontend)
// =============================================================================

// TODO: Implement NL module
// export * from './nl';

// =============================================================================
// Re-exports: Planning (Goal → Lever → Plan)
// =============================================================================

// TODO: Implement planning module
// export * from './planning';

// =============================================================================
// Re-exports: Execution (Plan → Mutation → Diff → Undo)
// =============================================================================

// TODO: Implement execution module
// export * from './execution';

// =============================================================================
// Re-exports: Pragmatics (Dialogue State and Resolution)
// =============================================================================

// TODO: Implement pragmatics module
// export * from './pragmatics';

// =============================================================================
// Re-exports: Extensions (Third-Party Integration)
// =============================================================================

// TODO: Implement extensions module
// export * from './extensions';

// =============================================================================
// Core Types
// =============================================================================

// TODO: Implement these modules
// import type { CPLRequest, CPLPlan, CPLHole } from './cpl';
// import type { EditPackage, ProjectDiff } from './execution';
// import type { DialogueState } from './pragmatics';
// Note: CompilerVersion not exported from ./canon

// Stub types until modules are implemented
type CPLRequest = unknown;
type CPLPlan = unknown;
type CPLHole = unknown;
type EditPackage = unknown;
type ProjectDiff = unknown;
type DialogueState = unknown;
type CompilerVersion = string; // Compiler version string

/**
 * Result of compiling a natural language instruction.
 *
 * One of three outcomes:
 * - `success`: Compilation succeeded, plan is ready to apply
 * - `clarification`: Ambiguity requires user resolution
 * - `error`: Compilation failed with structured diagnostics
 */
export type CompileResult =
  | CompileSuccess
  | CompileClarification
  | CompileError;

/**
 * Successful compilation result.
 */
export interface CompileSuccess {
  readonly type: 'success';

  /** The normalized intent (what we understood) */
  readonly cpl: CPLRequest;

  /** The action sequence (what we'll do) */
  readonly plan: CPLPlan;

  /** Preview of changes (what will change) */
  readonly preview: ProjectDiff;

  /** Confidence level (derived from hole count, not probabilistic) */
  readonly confidence: 'ready' | 'needs-review';

  /** Provenance for debugging */
  readonly provenance: CompileProvenance;
}

/**
 * Clarification required result.
 */
export interface CompileClarification {
  readonly type: 'clarification';

  /** Partial intent with holes */
  readonly partialCpl: CPLRequest;

  /** Unresolved holes requiring clarification */
  readonly holes: readonly CPLHole[];

  /** Questions to present to user */
  readonly questions: readonly ClarificationQuestion[];
}

/**
 * Compilation error result.
 */
export interface CompileError {
  readonly type: 'error';

  /** Structured error diagnostics */
  readonly errors: readonly CompileDiagnostic[];

  /** Partial parse for error recovery */
  readonly partialParse?: unknown;
}

/**
 * A clarification question for the user.
 */
export interface ClarificationQuestion {
  /** Unique question ID */
  readonly id: string;

  /** Human-readable question text */
  readonly text: string;

  /** Available options */
  readonly options: readonly ClarificationOption[];

  /** Default option (if any) */
  readonly default?: string;

  /** Why this matters (one line) */
  readonly impact: string;

  /** Source span in original text */
  readonly sourceSpan: TextSpan;
}

/**
 * An option for a clarification question.
 */
export interface ClarificationOption {
  /** Option ID */
  readonly id: string;

  /** Human-readable label */
  readonly label: string;

  /** What choosing this means */
  readonly description: string;

  /** Preview of effect on plan */
  readonly effectSummary?: string;
}

/**
 * A compile diagnostic (error or warning).
 */
export interface CompileDiagnostic {
  /** Severity level */
  readonly severity: 'error' | 'warning' | 'info';

  /** Diagnostic code (stable, machine-readable) */
  readonly code: string;

  /** Human-readable message */
  readonly message: string;

  /** Source span in original text */
  readonly span?: TextSpan;

  /** Related diagnostics */
  readonly related?: readonly CompileDiagnostic[];

  /** Suggested fixes */
  readonly suggestions?: readonly string[];
}

/**
 * Text span for source location tracking.
 */
export interface TextSpan {
  /** Start offset (0-indexed, inclusive) */
  readonly start: number;

  /** End offset (0-indexed, exclusive) */
  readonly end: number;

  /** Original text content */
  readonly text: string;
}

/**
 * Provenance information for debugging and explanation.
 */
export interface CompileProvenance {
  /** Compiler version fingerprint */
  readonly version: CompilerVersion;

  /** Parse rule chain */
  readonly parseTrace: readonly string[];

  /** Semantic rule chain */
  readonly semanticTrace: readonly string[];

  /** Resolution decisions */
  readonly resolutionTrace: readonly ResolutionStep[];

  /** Total compilation time (ms) */
  readonly durationMs: number;
}

/**
 * A single resolution step in pragmatics.
 */
export interface ResolutionStep {
  /** What was resolved */
  readonly target: string;

  /** How it was resolved */
  readonly resolution: string;

  /** Why this resolution was chosen */
  readonly reason: string;
}

// =============================================================================
// Compiler Interface
// =============================================================================

/**
 * The GOFAI Music+ compiler interface.
 *
 * This is the main entry point for compiling natural language instructions
 * into CardPlay edits.
 */
export interface GofaiCompilerInterface {
  /**
   * Compile a natural language instruction.
   *
   * @param utterance - The user's instruction in natural language
   * @returns Compilation result (success, clarification, or error)
   */
  compile(utterance: string): CompileResult;

  /**
   * Apply a compiled plan to the project.
   *
   * @param plan - The plan to apply (from a successful compile)
   * @returns The edit package (contains diff and undo capability)
   */
  apply(plan: CPLPlan): EditPackage;

  /**
   * Preview a plan without applying it.
   *
   * @param plan - The plan to preview
   * @returns The diff that would result
   */
  preview(plan: CPLPlan): ProjectDiff;

  /**
   * Resolve a clarification question.
   *
   * @param questionId - The question to resolve
   * @param optionId - The chosen option
   * @returns Updated compilation result
   */
  resolveClarification(questionId: string, optionId: string): CompileResult;

  /**
   * Get the current dialogue state.
   */
  getDialogueState(): DialogueState;

  /**
   * Reset dialogue state (start fresh conversation).
   */
  resetDialogueState(): void;

  /**
   * Get compiler version fingerprint.
   */
  getVersion(): CompilerVersion;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Configuration for creating a GOFAI compiler instance.
 */
export interface GofaiCompilerConfig {
  /** Project world access (events, cards, markers, etc.) */
  readonly projectWorld: ProjectWorldInterface;

  /** Optional initial dialogue state */
  readonly initialDialogueState?: DialogueState;

  /** Optional extension registry */
  readonly extensionRegistry?: unknown;

  /** Debug mode (enables verbose tracing) */
  readonly debug?: boolean;
}

/**
 * Interface for accessing project world state.
 *
 * The compiler reads from this interface to resolve references,
 * validate constraints, and compute diffs.
 */
export interface ProjectWorldInterface {
  // To be defined in execution module
  // Placeholder for now
  readonly placeholder: true;
}

/**
 * Create a GOFAI compiler instance.
 *
 * @param config - Compiler configuration
 * @returns Compiler instance
 */
export function createGofaiCompiler(
  _config: GofaiCompilerConfig
): GofaiCompilerInterface {
  // Implementation will be added in later steps
  throw new Error('GOFAI compiler not yet implemented');
}
