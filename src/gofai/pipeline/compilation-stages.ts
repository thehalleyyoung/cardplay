/**
 * GOFAI Compilation Pipeline Stages — Step 003 Complete
 *
 * This module defines the complete compilation pipeline from raw natural
 * language input to executable CardPlay mutations. Each stage has a clear
 * input/output contract and well-defined responsibilities.
 *
 * Pipeline Stages (in order):
 * 1. Normalization    — Canonicalize text format, punctuation, units
 * 2. Tokenization     — Break into tokens with spans and provenance
 * 3. Parsing          — Build syntactic parse forest with ambiguity tracking
 * 4. Semantics        — Compose logical forms (CPL-Intent) with holes
 * 5. Pragmatics       — Resolve references, anaphora, defaults via discourse
 * 6. Typechecking     — Validate types, constraints, presuppositions
 * 7. Planning         — Generate candidate plans with cost/satisfaction scores
 * 8. Codegen/Execution — Compile to CardPlay mutations with diffs
 *
 * Each stage is:
 * - Pure (no side effects except logging/tracing)
 * - Deterministic (same input → same output)
 * - Testable (clear fixtures for input/output)
 * - Composable (output of stage N is input to stage N+1)
 *
 * This architecture enables:
 * - Incremental recomputation (cache intermediate results)
 * - Clear error attribution (which stage failed?)
 * - Modular testing (test each stage independently)
 * - Explainability (trace decisions through the pipeline)
 *
 * Reference: gofai_goalB.md Step 003, gofaimusicplus.md §4.1
 *
 * @module gofai/pipeline/compilation-stages
 */

import type { GofaiId } from '../canon/types';

// =============================================================================
// Type Definitions for Pipeline Stages
// =============================================================================

/**
 * Provenance information tracking where data came from.
 */
export interface Provenance {
  /** Stage that produced this data */
  readonly stage: PipelineStage;

  /** Character span in original input */
  readonly span?: { readonly start: number; readonly end: number };

  /** Rule or decision that produced this */
  readonly rule?: string;

  /** Additional context */
  readonly context?: Record<string, unknown>;
}

/**
 * Pipeline stage identifiers.
 */
export type PipelineStage =
  | 'normalization'
  | 'tokenization'
  | 'parsing'
  | 'semantics'
  | 'pragmatics'
  | 'typechecking'
  | 'planning'
  | 'codegen'
  | 'execution';

/**
 * Result of a pipeline stage.
 * 
 * Either succeeds with data, or fails with structured errors.
 */
export type StageResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly errors: readonly StageError[] };

/**
 * Structured error from a pipeline stage.
 */
export interface StageError {
  /** Which stage produced this error */
  readonly stage: PipelineStage;

  /** Error severity */
  readonly severity: 'error' | 'warning';

  /** Human-readable message */
  readonly message: string;

  /** Location in input (if applicable) */
  readonly span?: { readonly start: number; readonly end: number };

  /** Suggested fixes or clarifications */
  readonly suggestions?: readonly string[];

  /** Additional context */
  readonly context?: Record<string, unknown>;
}

// =============================================================================
// Stage 1: Normalization
// =============================================================================

/**
 * Input to normalization stage (raw user input).
 */
export interface NormalizationInput {
  /** Raw text from user */
  readonly text: string;

  /** Input timestamp (for audit, not used in computation) */
  readonly timestamp?: number;

  /** User preferences affecting normalization */
  readonly preferences?: {
    readonly locale?: string;
    readonly unitSystem?: 'metric' | 'imperial';
  };
}

/**
 * Output from normalization stage.
 */
export interface NormalizationOutput {
  /** Normalized text */
  readonly text: string;

  /** Mapping from normalized positions to original positions */
  readonly spanMap: ReadonlyMap<number, number>;

  /** Applied normalizations for provenance */
  readonly normalizations: readonly {
    readonly type: NormalizationType;
    readonly original: string;
    readonly normalized: string;
    readonly span: { readonly start: number; readonly end: number };
  }[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Types of normalizations applied.
 */
export type NormalizationType =
  | 'punctuation'      // "make it darker..." → "make it darker"
  | 'quotes'           // "the 'glass pad'" → "the \"glass pad\""
  | 'hyphenation'      // "hi-hats" → "hihats"
  | 'units'            // "120 BPM" → "120 bpm"
  | 'synonyms'         // "kick drum" → "kick"
  | 'whitespace'       // "  extra   spaces" → "extra spaces"
  | 'case'             // "LOUD" → "loud"
  | 'numbers';         // "one hundred" → "100"

/**
 * Normalize raw input text.
 * 
 * Responsibilities:
 * - Canonicalize punctuation, quotes, hyphenation
 * - Normalize units ("BPM", "bpm", "beats per minute")
 * - Detect explicit references (quoted strings, bar numbers)
 * - Preserve original text for error reporting
 * - Build span mapping for provenance
 * 
 * This stage is purely textual - no linguistic analysis yet.
 */
export function normalize(input: NormalizationInput): StageResult<NormalizationOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      text: input.text,
      spanMap: new Map(),
      normalizations: [],
      provenance: {
        stage: 'normalization',
        context: { originalLength: input.text.length },
      },
    },
  };
}

// =============================================================================
// Stage 2: Tokenization
// =============================================================================

/**
 * Input to tokenization stage.
 */
export interface TokenizationInput {
  /** Normalized text from stage 1 */
  readonly text: string;

  /** Span map from normalization */
  readonly spanMap: ReadonlyMap<number, number>;
}

/**
 * A single token with metadata.
 */
export interface Token {
  /** Token text */
  readonly text: string;

  /** Token type */
  readonly type: TokenType;

  /** Position in normalized text */
  readonly span: { readonly start: number; readonly end: number };

  /** Position in original input */
  readonly originalSpan: { readonly start: number; readonly end: number };

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Token types.
 */
export type TokenType =
  | 'word'           // Regular word
  | 'number'         // Numeric literal
  | 'punctuation'    // Punctuation mark
  | 'quoted'         // Quoted string (explicit reference)
  | 'bar_number'     // Bar number reference (e.g., "bar 4")
  | 'section_name'   // Section name reference
  | 'whitespace';    // Whitespace (usually stripped)

/**
 * Output from tokenization stage.
 */
export interface TokenizationOutput {
  /** Sequence of tokens */
  readonly tokens: readonly Token[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Tokenize normalized text.
 * 
 * Responsibilities:
 * - Break text into tokens (words, numbers, punctuation)
 * - Preserve spans for error reporting
 * - Map back to original input positions
 * - Detect special token types (quoted strings, bar numbers)
 * - Strip whitespace but track it for pretty-printing
 */
export function tokenize(input: TokenizationInput): StageResult<TokenizationOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      tokens: [],
      provenance: {
        stage: 'tokenization',
        context: { tokenCount: 0 },
      },
    },
  };
}

// =============================================================================
// Stage 3: Parsing
// =============================================================================

/**
 * Input to parsing stage.
 */
export interface ParsingInput {
  /** Tokens from stage 2 */
  readonly tokens: readonly Token[];

  /** Grammar rules to use */
  readonly grammar?: unknown; // Will be refined in subsequent steps

  /** Maximum parse forest size (for performance) */
  readonly maxAmbiguity?: number;
}

/**
 * A parse tree node.
 */
export interface ParseNode {
  /** Node type (grammar rule name) */
  readonly type: string;

  /** Children (if non-terminal) */
  readonly children?: readonly ParseNode[];

  /** Tokens (if terminal) */
  readonly tokens?: readonly Token[];

  /** Span in token sequence */
  readonly span: { readonly start: number; readonly end: number };

  /** Parse score (for disambiguation) */
  readonly score: number;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * A parse forest (multiple possible parses).
 */
export interface ParseForest {
  /** All possible parses */
  readonly parses: readonly ParseNode[];

  /** Whether forest is ambiguous */
  readonly ambiguous: boolean;

  /** Best parse (highest score) */
  readonly best: ParseNode;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Output from parsing stage.
 */
export interface ParsingOutput {
  /** Parse forest */
  readonly forest: ParseForest;

  /** Detected ambiguities */
  readonly ambiguities: readonly {
    readonly expression: string;
    readonly parses: readonly ParseNode[];
    readonly span: { readonly start: number; readonly end: number };
  }[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Parse token sequence into syntax trees.
 * 
 * Responsibilities:
 * - Apply grammar rules to build parse trees
 * - Track multiple parses if ambiguous (parse forest)
 * - Score parses for ranking
 * - Detect and record ambiguities
 * - Use deterministic tie-breakers
 * 
 * This stage is purely syntactic - no semantic interpretation yet.
 */
export function parse(input: ParsingInput): StageResult<ParsingOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      forest: {
        parses: [],
        ambiguous: false,
        best: {
          type: 'root',
          children: [],
          span: { start: 0, end: 0 },
          score: 0,
          provenance: { stage: 'parsing' },
        },
        provenance: { stage: 'parsing' },
      },
      ambiguities: [],
      provenance: { stage: 'parsing' },
    },
  };
}

// =============================================================================
// Stage 4: Semantics
// =============================================================================

/**
 * Input to semantics stage.
 */
export interface SemanticsInput {
  /** Parse forest from stage 3 */
  readonly forest: ParseForest;

  /** Lexicon for semantic interpretation */
  readonly lexicon?: unknown; // Will be refined in subsequent steps
}

/**
 * A CPL-Intent node (logical form with possible holes).
 */
export interface CPLIntent {
  /** Intent type */
  readonly type: CPLIntentType;

  /** Goal (what to achieve) */
  readonly goal?: unknown;

  /** Constraints (what to preserve/respect) */
  readonly constraints?: readonly unknown[];

  /** Scope (where to apply) */
  readonly scope?: unknown;

  /** Holes (unresolved parts) */
  readonly holes: readonly {
    readonly type: HoleType;
    readonly description: string;
    readonly options?: readonly unknown[];
  }[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * CPL intent types.
 */
export type CPLIntentType =
  | 'adjust'         // Adjust some perceptual axis
  | 'inspect'        // Query project state
  | 'create'         // Add new elements
  | 'delete'         // Remove elements
  | 'transform'      // Structural transformation
  | 'navigate';      // UI navigation

/**
 * Hole types (unresolved parts of intent).
 */
export type HoleType =
  | 'reference'      // Unresolved reference ("it", "that")
  | 'amount'         // Unspecified amount ("a bit", "very")
  | 'scope'          // Ambiguous scope ("the chorus")
  | 'target'         // Ambiguous target ("the drums")
  | 'method';        // Unspecified method ("make it brighter")

/**
 * Output from semantics stage.
 */
export interface SemanticsOutput {
  /** CPL intent */
  readonly intent: CPLIntent;

  /** Detected references */
  readonly references: readonly {
    readonly expression: string;
    readonly type: 'definite' | 'indefinite' | 'anaphora' | 'explicit';
    readonly span: { readonly start: number; readonly end: number };
  }[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Compose logical form from parse trees.
 * 
 * Responsibilities:
 * - Map syntax to semantics using lexicon
 * - Build CPL-Intent with holes for unresolved parts
 * - Detect referential expressions
 * - Attach provenance to every semantic node
 * - Maintain compositional structure
 * 
 * This stage does NOT resolve references - that's pragmatics' job.
 */
export function composeSemantics(input: SemanticsInput): StageResult<SemanticsOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      intent: {
        type: 'adjust',
        holes: [],
        provenance: { stage: 'semantics' },
      },
      references: [],
      provenance: { stage: 'semantics' },
    },
  };
}

// =============================================================================
// Stage 5: Pragmatics
// =============================================================================

/**
 * Input to pragmatics stage.
 */
export interface PragmaticsInput {
  /** CPL intent from stage 4 */
  readonly intent: CPLIntent;

  /** References to resolve */
  readonly references: readonly SemanticsOutput['references'][number][];

  /** Discourse context */
  readonly discourse: {
    /** Previous utterances */
    readonly history: readonly unknown[];

    /** Salient entities */
    readonly salience: readonly { readonly id: GofaiId; readonly score: number }[];

    /** Current focus */
    readonly focus?: GofaiId;
  };

  /** Project world state */
  readonly world: {
    /** Available entities */
    readonly entities: ReadonlyMap<GofaiId, unknown>;

    /** Section markers */
    readonly sections: readonly unknown[];

    /** Layers */
    readonly layers: readonly unknown[];
  };
}

/**
 * Resolved CPL (no holes, all references bound).
 */
export interface ResolvedCPL {
  /** Intent type */
  readonly type: CPLIntentType;

  /** Goal */
  readonly goal: unknown;

  /** Constraints */
  readonly constraints: readonly unknown[];

  /** Scope (resolved) */
  readonly scope: unknown;

  /** Remaining holes (if any) */
  readonly holes: readonly CPLIntent['holes'][number][];

  /** Resolved references */
  readonly bindings: ReadonlyMap<string, GofaiId>;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Output from pragmatics stage.
 */
export interface PragmaticsOutput {
  /** Resolved CPL */
  readonly cpl: ResolvedCPL;

  /** Clarification questions (if holes remain) */
  readonly clarifications: readonly {
    readonly question: string;
    readonly options: readonly { readonly id: string; readonly label: string }[];
    readonly hole: CPLIntent['holes'][number];
  }[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Resolve references and fill holes via discourse.
 * 
 * Responsibilities:
 * - Resolve anaphora ("it", "that", "them") using salience
 * - Resolve definite descriptions ("the chorus") using world state
 * - Apply conversational defaults
 * - Fill amount holes using context
 * - Generate clarification questions for remaining holes
 * - Update discourse state
 * 
 * This is where context-sensitivity happens.
 */
export function resolvePragmatics(input: PragmaticsInput): StageResult<PragmaticsOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      cpl: {
        type: 'adjust',
        goal: {},
        constraints: [],
        scope: {},
        holes: [],
        bindings: new Map(),
        provenance: { stage: 'pragmatics' },
      },
      clarifications: [],
      provenance: { stage: 'pragmatics' },
    },
  };
}

// =============================================================================
// Stage 6: Typechecking
// =============================================================================

/**
 * Input to typechecking stage.
 */
export interface TypecheckingInput {
  /** Resolved CPL from stage 5 */
  readonly cpl: ResolvedCPL;

  /** Type environment */
  readonly types?: unknown; // Will be refined in subsequent steps

  /** Constraint schemas */
  readonly constraintSchemas?: unknown;
}

/**
 * Type error.
 */
export interface TypeError {
  /** Error message */
  readonly message: string;

  /** Location */
  readonly location: string;

  /** Expected type */
  readonly expected: string;

  /** Actual type */
  readonly actual: string;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Output from typechecking stage.
 */
export interface TypecheckingOutput {
  /** Whether types are valid */
  readonly valid: boolean;

  /** Type errors */
  readonly errors: readonly TypeError[];

  /** Validated CPL (with type annotations) */
  readonly typedCPL: ResolvedCPL;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Typecheck and validate CPL.
 * 
 * Responsibilities:
 * - Verify all entities exist and have correct types
 * - Validate constraint schemas
 * - Check presuppositions
 * - Verify scope legality
 * - Detect conflicting constraints
 * - Annotate CPL with type information
 * 
 * This is a purely type-level check, no execution yet.
 */
export function typecheck(input: TypecheckingInput): StageResult<TypecheckingOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      valid: true,
      errors: [],
      typedCPL: input.cpl,
      provenance: { stage: 'typechecking' },
    },
  };
}

// =============================================================================
// Stage 7: Planning
// =============================================================================

/**
 * Input to planning stage.
 */
export interface PlanningInput {
  /** Typed CPL from stage 6 */
  readonly cpl: ResolvedCPL;

  /** Lever mappings */
  readonly levers?: unknown; // Will be refined in subsequent steps

  /** Cost model */
  readonly costModel?: unknown;

  /** Analysis facts (from Prolog, etc.) */
  readonly analysis?: unknown;
}

/**
 * A plan (sequence of opcodes).
 */
export interface Plan {
  /** Plan ID */
  readonly id: string;

  /** Sequence of opcodes */
  readonly opcodes: readonly {
    readonly opcode: string;
    readonly params: Record<string, unknown>;
    readonly targets: readonly GofaiId[];
    readonly reason: string;
  }[];

  /** Total cost */
  readonly cost: number;

  /** Goal satisfaction score */
  readonly satisfaction: number;

  /** Constraint violations (should be empty) */
  readonly violations: readonly string[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Output from planning stage.
 */
export interface PlanningOutput {
  /** Candidate plans */
  readonly plans: readonly Plan[];

  /** Best plan (if unambiguous) */
  readonly best?: Plan;

  /** Whether user choice is needed */
  readonly needsChoice: boolean;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Generate candidate plans.
 * 
 * Responsibilities:
 * - Map goals to lever candidates
 * - Generate opcode sequences
 * - Score plans (cost + satisfaction)
 * - Validate against constraints
 * - Prune invalid plans
 * - Rank by score with deterministic tie-breakers
 * - Detect when multiple plans are near-equal (present options)
 * 
 * This is the "AI" part - but deterministic, not LLM-based.
 */
export function generatePlans(input: PlanningInput): StageResult<PlanningOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      plans: [],
      best: undefined,
      needsChoice: false,
      provenance: { stage: 'planning' },
    },
  };
}

// =============================================================================
// Stage 8: Codegen/Execution
// =============================================================================

/**
 * Input to codegen stage.
 */
export interface CodegenInput {
  /** Plan from stage 7 */
  readonly plan: Plan;

  /** Execution policy */
  readonly policy: {
    /** Whether to actually mutate */
    readonly execute: boolean;

    /** Whether user has approved */
    readonly approved: boolean;
  };

  /** Current project state */
  readonly state: unknown;
}

/**
 * An edit package (atomic applied unit).
 */
export interface EditPackage {
  /** Package ID */
  readonly id: string;

  /** CPL that generated this */
  readonly cpl: ResolvedCPL;

  /** Plan that was executed */
  readonly plan: Plan;

  /** Diffs */
  readonly diffs: readonly unknown[];

  /** Undo token */
  readonly undoToken: string;

  /** Explanation */
  readonly explanation: string;

  /** Provenance */
  readonly provenance: Provenance;

  /** Timestamp (for audit only) */
  readonly timestamp: number;
}

/**
 * Output from codegen stage.
 */
export interface CodegenOutput {
  /** Edit package (if executed) */
  readonly package?: EditPackage;

  /** Preview diffs (if not executed) */
  readonly previewDiffs?: readonly unknown[];

  /** Whether execution succeeded */
  readonly executed: boolean;

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Compile plan to CardPlay mutations.
 * 
 * Responsibilities:
 * - Translate opcodes to CardPlay operations
 * - Apply to project state (if approved)
 * - Compute diffs
 * - Generate undo token
 * - Produce explanations
 * - Validate constraints post-execution
 * - Rollback if constraints violated
 * 
 * This is the only stage that can mutate project state.
 */
export function compileAndExecute(input: CodegenInput): StageResult<CodegenOutput> {
  // Implementation will be added in subsequent steps
  return {
    ok: true,
    data: {
      package: undefined,
      previewDiffs: [],
      executed: false,
      provenance: { stage: 'execution' },
    },
  };
}

// =============================================================================
// Full Pipeline Orchestration
// =============================================================================

/**
 * Input to the complete pipeline.
 */
export interface PipelineInput {
  /** Raw user text */
  readonly text: string;

  /** Discourse context */
  readonly discourse: PragmaticsInput['discourse'];

  /** Project world */
  readonly world: PragmaticsInput['world'];

  /** Execution policy */
  readonly policy: CodegenInput['policy'];

  /** User preferences */
  readonly preferences?: NormalizationInput['preferences'];
}

/**
 * Output from the complete pipeline.
 */
export interface PipelineOutput {
  /** Final result (either edit package or preview) */
  readonly result: CodegenOutput;

  /** Intermediate stages (for debugging/explanation) */
  readonly stages: {
    readonly normalization: NormalizationOutput;
    readonly tokenization: TokenizationOutput;
    readonly parsing: ParsingOutput;
    readonly semantics: SemanticsOutput;
    readonly pragmatics: PragmaticsOutput;
    readonly typechecking: TypecheckingOutput;
    readonly planning: PlanningOutput;
  };

  /** Clarifications needed (if any) */
  readonly clarifications: readonly PragmaticsOutput['clarifications'][number][];

  /** Errors (if any) */
  readonly errors: readonly StageError[];

  /** Provenance */
  readonly provenance: Provenance;
}

/**
 * Run the complete compilation pipeline.
 * 
 * This orchestrates all 8 stages in sequence, passing outputs to inputs.
 * If any stage fails, the pipeline stops and returns errors.
 * Intermediate results are preserved for debugging and explanation.
 */
export function runPipeline(input: PipelineInput): StageResult<PipelineOutput> {
  // Implementation will be added in subsequent steps
  // For now, return a stub that exercises all stages
  
  const norm = normalize({ text: input.text, preferences: input.preferences });
  if (!norm.ok) {
    return { ok: false, errors: norm.errors };
  }

  const tok = tokenize({ text: norm.data.text, spanMap: norm.data.spanMap });
  if (!tok.ok) {
    return { ok: false, errors: tok.errors };
  }

  const parsed = parse({ tokens: tok.data.tokens });
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const sem = composeSemantics({ forest: parsed.data.forest });
  if (!sem.ok) {
    return { ok: false, errors: sem.errors };
  }

  const prag = resolvePragmatics({
    intent: sem.data.intent,
    references: sem.data.references,
    discourse: input.discourse,
    world: input.world,
  });
  if (!prag.ok) {
    return { ok: false, errors: prag.errors };
  }

  const typed = typecheck({ cpl: prag.data.cpl });
  if (!typed.ok) {
    return { ok: false, errors: typed.errors };
  }

  const planned = generatePlans({ cpl: typed.data.typedCPL });
  if (!planned.ok) {
    return { ok: false, errors: planned.errors };
  }

  if (!planned.data.best) {
    return {
      ok: true,
      data: {
        result: {
          executed: false,
          previewDiffs: [],
          provenance: { stage: 'execution' },
        },
        stages: {
          normalization: norm.data,
          tokenization: tok.data,
          parsing: parsed.data,
          semantics: sem.data,
          pragmatics: prag.data,
          typechecking: typed.data,
          planning: planned.data,
        },
        clarifications: prag.data.clarifications,
        errors: [],
        provenance: { stage: 'execution', context: { pipelineComplete: true } },
      },
    };
  }

  const exec = compileAndExecute({
    plan: planned.data.best,
    policy: input.policy,
    state: input.world,
  });
  if (!exec.ok) {
    return { ok: false, errors: exec.errors };
  }

  return {
    ok: true,
    data: {
      result: exec.data,
      stages: {
        normalization: norm.data,
        tokenization: tok.data,
        parsing: parsed.data,
        semantics: sem.data,
        pragmatics: prag.data,
        typechecking: typed.data,
        planning: planned.data,
      },
      clarifications: prag.data.clarifications,
      errors: [],
      provenance: { stage: 'execution', context: { pipelineComplete: true } },
    },
  };
}
