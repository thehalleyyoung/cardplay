/**
 * GOFAI Compilation Pipeline — Stage Definitions and Orchestration
 *
 * This module defines and documents the complete compilation pipeline from
 * natural language input to verified CardPlay edits.
 *
 * Following Step 003 from gofai_goalB.md:
 * "Decide and document the compilation pipeline stages
 * (normalize → parse → semantics → pragmatics → typecheck → plan → execute → diff/explain)."
 *
 * @module gofai/pipeline/compilation-pipeline
 */

import type { InvariantResult, InvariantId } from '../canon/semantic-safety';
import type { CPLIntent } from '../canon/cpl-types';

// =============================================================================
// Pipeline Stage Definitions
// =============================================================================

/**
 * The complete GOFAI compilation pipeline consists of these stages:
 * 
 * 1. Normalization   - Canonicalize input text
 * 2. Tokenization    - Break into tokens with spans
 * 3. Parsing         - Build syntax tree(s)
 * 4. Semantics       - Convert to CPL-Intent with holes
 * 5. Pragmatics      - Resolve references and context
 * 6. Typechecking    - Validate CPL against world state
 * 7. Planning        - Generate edit plan candidates
 * 8. Validation      - Check constraints and invariants
 * 9. Execution       - Apply plan to project state
 * 10. Diffing        - Generate before/after diffs
 * 11. Explanation    - Generate human-readable explanations
 */

/**
 * Unique identifier for each pipeline stage.
 */
export type PipelineStageId =
  | 'normalize'
  | 'tokenize'
  | 'parse'
  | 'semantics'
  | 'pragmatics'
  | 'typecheck'
  | 'plan'
  | 'validate'
  | 'execute'
  | 'diff'
  | 'explain';

/**
 * A pipeline stage definition.
 */
export interface PipelineStage<TInput, TOutput, TError> {
  /** Stable stage identifier */
  readonly id: PipelineStageId;

  /** Human-readable name */
  readonly name: string;

  /** Stage description */
  readonly description: string;

  /** Input type description */
  readonly inputType: string;

  /** Output type description */
  readonly outputType: string;

  /** Whether this stage is deterministic */
  readonly deterministic: boolean;

  /** Whether this stage has side effects */
  readonly hasSideEffects: boolean;

  /** Semantic invariants that must hold after this stage */
  readonly postconditions: readonly InvariantId[];

  /** The stage execution function */
  readonly execute: (input: TInput) => PipelineStageResult<TOutput, TError>;

  /** Documentation link */
  readonly docLink?: string;
}

/**
 * Result of a pipeline stage execution.
 */
export type PipelineStageResult<TOutput, TError> =
  | { readonly ok: true; readonly output: TOutput; readonly warnings?: readonly string[] }
  | { readonly ok: false; readonly error: TError };

// =============================================================================
// Stage 1: Normalization
// =============================================================================

/**
 * Input to the normalization stage.
 */
export interface NormalizationInput {
  /** Raw user input text */
  readonly rawText: string;

  /** User preferences (e.g., units, synonyms) */
  readonly userPrefs?: UserPreferences;
}

/**
 * Output from the normalization stage.
 */
export interface NormalizationOutput {
  /** Normalized text */
  readonly normalizedText: string;

  /** Normalization transformations applied */
  readonly transformations: readonly NormalizationTransform[];

  /** Original text preserved for provenance */
  readonly originalText: string;
}

/**
 * A normalization transformation.
 */
export interface NormalizationTransform {
  /** Type of transformation */
  readonly type: 'punctuation' | 'case' | 'synonym' | 'unit' | 'quote' | 'hyphen';

  /** Original span */
  readonly originalSpan: readonly [number, number];

  /** Original text */
  readonly original: string;

  /** Normalized text */
  readonly normalized: string;

  /** Reason for transformation */
  readonly reason: string;
}

/**
 * User preferences for normalization.
 */
export interface UserPreferences {
  /** Preferred unit system */
  readonly unitSystem?: 'imperial' | 'metric' | 'musical';

  /** Custom synonym mappings */
  readonly customSynonyms?: ReadonlyMap<string, string>;

  /** Prefer British vs American spelling */
  readonly spellingVariant?: 'british' | 'american';
}

/**
 * Error from normalization stage.
 */
export interface NormalizationError {
  readonly stage: 'normalize';
  readonly message: string;
  readonly location?: { readonly start: number; readonly end: number };
}

export const NORMALIZATION_STAGE: PipelineStage<
  NormalizationInput,
  NormalizationOutput,
  NormalizationError
> = {
  id: 'normalize',
  name: 'Normalization',
  description:
    'Canonicalize user input: normalize punctuation, quotes, hyphenation, units, and known synonyms. ' +
    'Preserve original text for provenance and error reporting.',
  inputType: '{ rawText: string }',
  outputType: '{ normalizedText: string, transformations: Transform[] }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: [],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/nl/normalize.ts
    return {
      ok: true,
      output: {
        normalizedText: input.rawText,
        transformations: [],
        originalText: input.rawText,
      },
    };
  },
  docLink: 'docs/gofai/pipeline/normalization.md',
};

// =============================================================================
// Stage 2: Tokenization
// =============================================================================

/**
 * Input to the tokenization stage.
 */
export interface TokenizationInput {
  /** Normalized text */
  readonly normalizedText: string;

  /** Original text (for provenance) */
  readonly originalText: string;
}

/**
 * Output from the tokenization stage.
 */
export interface TokenizationOutput {
  /** Tokens */
  readonly tokens: readonly Token[];

  /** Total token count */
  readonly tokenCount: number;
}

/**
 * A token with span and metadata.
 */
export interface Token {
  /** Token text */
  readonly text: string;

  /** Span in normalized text */
  readonly span: readonly [number, number];

  /** Span in original text */
  readonly originalSpan: readonly [number, number];

  /** Token type (for disambiguation) */
  readonly type: TokenType;

  /** Whitespace before this token */
  readonly leadingWhitespace: string;
}

/**
 * Token types for preliminary classification.
 */
export type TokenType =
  | 'word'
  | 'number'
  | 'punctuation'
  | 'quote'
  | 'operator'
  | 'unit'
  | 'name'; // Quoted name

/**
 * Error from tokenization stage.
 */
export interface TokenizationError {
  readonly stage: 'tokenize';
  readonly message: string;
  readonly location?: { readonly start: number; readonly end: number };
}

export const TOKENIZATION_STAGE: PipelineStage<
  TokenizationInput,
  TokenizationOutput,
  TokenizationError
> = {
  id: 'tokenize',
  name: 'Tokenization',
  description:
    'Break normalized text into tokens with span information. ' +
    'Preserve whitespace and original spans for error reporting.',
  inputType: '{ normalizedText: string }',
  outputType: '{ tokens: Token[] }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: [],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/nl/tokenizer/tokenize.ts
    return {
      ok: true,
      output: {
        tokens: [],
        tokenCount: 0,
      },
    };
  },
  docLink: 'docs/gofai/pipeline/tokenization.md',
};

// =============================================================================
// Stage 3: Parsing
// =============================================================================

/**
 * Input to the parsing stage.
 */
export interface ParsingInput {
  /** Tokens */
  readonly tokens: readonly Token[];

  /** Grammar version */
  readonly grammarVersion?: string;
}

/**
 * Output from the parsing stage.
 */
export interface ParsingOutput {
  /** Parse forest (may contain multiple parse trees if ambiguous) */
  readonly parseForest: ParseForest;

  /** Best parse (if disambiguation succeeded) */
  readonly bestParse?: ParseTree;

  /** Ambiguity detected */
  readonly hasAmbiguity: boolean;

  /** Parse score */
  readonly score: number;
}

/**
 * A parse forest containing one or more parse trees.
 */
export interface ParseForest {
  /** All parse trees */
  readonly trees: readonly ParseTree[];

  /** Disambiguation metadata */
  readonly disambiguationMetadata?: DisambiguationMetadata;
}

/**
 * A single parse tree.
 */
export interface ParseTree {
  /** Root node */
  readonly root: ParseNode;

  /** Parse score */
  readonly score: number;

  /** Grammar rules used */
  readonly rulesUsed: readonly string[];
}

/**
 * A node in the parse tree.
 */
export interface ParseNode {
  /** Node type (non-terminal or terminal) */
  readonly type: string;

  /** Children (if non-terminal) */
  readonly children?: readonly ParseNode[];

  /** Token (if terminal) */
  readonly token?: Token;

  /** Span in token stream */
  readonly span: readonly [number, number];

  /** Features attached to this node */
  readonly features?: ReadonlyMap<string, unknown>;
}

/**
 * Disambiguation metadata.
 */
export interface DisambiguationMetadata {
  /** Disambiguation strategy used */
  readonly strategy: 'priority' | 'cost' | 'beam_search';

  /** Scores for all trees */
  readonly scores: readonly number[];

  /** Why the best parse was chosen */
  readonly reason: string;
}

/**
 * Error from parsing stage.
 */
export interface ParsingError {
  readonly stage: 'parse';
  readonly message: string;
  readonly location?: { readonly start: number; readonly end: number };
  readonly unexpectedToken?: Token;
  readonly expectedTokenTypes?: readonly TokenType[];
}

export const PARSING_STAGE: PipelineStage<
  ParsingInput,
  ParsingOutput,
  ParsingError
> = {
  id: 'parse',
  name: 'Parsing',
  description:
    'Build a parse forest from tokens using the GOFAI grammar. ' +
    'If multiple parses exist, attempt disambiguation using priority/cost/beam search. ' +
    'Preserve all high-scoring parses for later clarification.',
  inputType: '{ tokens: Token[] }',
  outputType: '{ parseForest: ParseForest, bestParse?: ParseTree }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: [],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/nl/parser/parse.ts
    return {
      ok: false,
      error: {
        stage: 'parse',
        message: 'Not implemented',
      },
    };
  },
  docLink: 'docs/gofai/pipeline/parsing.md',
};

// =============================================================================
// Stage 4: Semantics
// =============================================================================

/**
 * Input to the semantics stage.
 */
export interface SemanticsInput {
  /** Parse tree to convert */
  readonly parseTree: ParseTree;

  /** Lexicon version */
  readonly lexiconVersion?: string;

  /** World state for entity lookup */
  readonly worldState: WorldStateSnapshot;
}

/**
 * Output from the semantics stage.
 */
export interface SemanticsOutput {
  /** CPL-Intent (may contain holes) */
  readonly cplIntent: CPLIntent;

  /** Semantic holes (unresolved references, unspecified amounts) */
  readonly holes: readonly SemanticHole[];

  /** Provenance traces */
  readonly provenance: readonly ProvenanceTrace[];
}

/**
 * A semantic hole representing an unresolved or underspecified part.
 */
export interface SemanticHole {
  /** Hole identifier */
  readonly id: string;

  /** Hole type */
  readonly type: 'reference' | 'amount' | 'scope' | 'entity' | 'constraint';

  /** Description of what needs resolution */
  readonly description: string;

  /** Candidate resolutions */
  readonly candidates: readonly HoleCandidate[];

  /** Source location */
  readonly location: { readonly start: number; readonly end: number };
}

/**
 * A candidate resolution for a semantic hole.
 */
export interface HoleCandidate {
  /** Candidate identifier */
  readonly id: string;

  /** Human-readable description */
  readonly description: string;

  /** Confidence score (0-1) */
  readonly confidence: number;

  /** Why this is a candidate */
  readonly reason: string;
}

/**
 * A provenance trace linking CPL back to source.
 */
export interface ProvenanceTrace {
  /** CPL node identifier */
  readonly cplNodeId: string;

  /** Source lexeme or grammar rule */
  readonly source: string;

  /** Parse tree node */
  readonly parseNode: ParseNode;

  /** Semantic mapping used */
  readonly mapping: string;
}

/**
 * Snapshot of world state for semantic resolution.
 */
export interface WorldStateSnapshot {
  /** Available sections */
  readonly sections: readonly SectionInfo[];

  /** Available layers */
  readonly layers: readonly LayerInfo[];

  /** Available cards */
  readonly cards: readonly CardInfo[];

  /** Current selection */
  readonly selection?: SelectionInfo;

  /** Timestamp */
  readonly timestamp: number;
}

export interface SectionInfo {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly barRange: readonly [number, number];
}

export interface LayerInfo {
  readonly id: string;
  readonly name: string;
  readonly role?: string;
  readonly instrument?: string;
}

export interface CardInfo {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly layerId: string;
}

export interface SelectionInfo {
  readonly type: 'events' | 'card' | 'layer' | 'section';
  readonly entityIds: readonly string[];
  readonly barRange?: readonly [number, number];
}

/**
 * Error from semantics stage.
 */
export interface SemanticsError {
  readonly stage: 'semantics';
  readonly message: string;
  readonly location?: { readonly start: number; readonly end: number };
  readonly cplNodeId?: string;
}

export const SEMANTICS_STAGE: PipelineStage<
  SemanticsInput,
  SemanticsOutput,
  SemanticsError
> = {
  id: 'semantics',
  name: 'Semantic Composition',
  description:
    'Convert parse tree to CPL-Intent using lexical semantic mappings. ' +
    'Identify semantic holes (unresolved references, underspecified amounts) and attach provenance traces. ' +
    'Do not resolve holes yet - that happens in pragmatics.',
  inputType: '{ parseTree: ParseTree }',
  outputType: '{ cplIntent: CPLIntent, holes: SemanticHole[] }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: [],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/nl/semantics/compose.ts
    return {
      ok: false,
      error: {
        stage: 'semantics',
        message: 'Not implemented',
      },
    };
  },
  docLink: 'docs/gofai/pipeline/semantics.md',
};

// =============================================================================
// Stage 5: Pragmatics
// =============================================================================

/**
 * Input to the pragmatics stage.
 */
export interface PragmaticsInput {
  /** CPL-Intent with possible holes */
  readonly cplIntent: CPLIntent;

  /** Semantic holes to resolve */
  readonly holes: readonly SemanticHole[];

  /** Dialogue state */
  readonly dialogueState: DialogueState;

  /** World state */
  readonly worldState: WorldStateSnapshot;
}

/**
 * Output from the pragmatics stage.
 */
export interface PragmaticsOutput {
  /** Resolved CPL-Intent */
  readonly resolvedCpl: CPLIntent;

  /** Remaining holes (require user clarification) */
  readonly remainingHoles: readonly SemanticHole[];

  /** Clarification questions (if holes remain) */
  readonly clarifications: readonly ClarificationQuestion[];

  /** Updated dialogue state */
  readonly updatedDialogueState: DialogueState;
}

/**
 * Dialogue state for pragmatic resolution.
 */
export interface DialogueState {
  /** Discourse referents (what "it", "that", etc. refer to) */
  readonly referents: readonly DiscourseReferent[];

  /** Salient entities (what's in focus) */
  readonly salience: readonly SalienceEntry[];

  /** Conversation history */
  readonly conversationHistory: readonly ConversationTurn[];

  /** User preferences */
  readonly userPreferences: UserPreferences;

  /** Last edit package (for "do it again") */
  readonly lastEditPackage?: EditPackageReference;
}

/**
 * A discourse referent.
 */
export interface DiscourseReferent {
  /** Referent ID */
  readonly id: string;

  /** Entity type */
  readonly entityType: string;

  /** Entity ID in project */
  readonly entityId: string;

  /** Display name */
  readonly displayName: string;

  /** When introduced */
  readonly introducedAt: number;

  /** Anaphoric expressions that can refer to this */
  readonly anaphoricForms: readonly string[];
}

/**
 * A salience entry.
 */
export interface SalienceEntry {
  /** Entity ID */
  readonly entityId: string;

  /** Salience score (higher = more salient) */
  readonly score: number;

  /** Why salient */
  readonly reason: string;
}

/**
 * A conversation turn.
 */
export interface ConversationTurn {
  /** Turn ID */
  readonly id: string;

  /** User utterance */
  readonly utterance: string;

  /** System response */
  readonly response: string;

  /** Edit package applied (if any) */
  readonly editPackage?: EditPackageReference;

  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Reference to an edit package.
 */
export interface EditPackageReference {
  readonly id: string;
  readonly description: string;
  readonly scope: string;
}

/**
 * A clarification question.
 */
export interface ClarificationQuestion {
  /** Question ID */
  readonly id: string;

  /** Question text */
  readonly question: string;

  /** Hole being clarified */
  readonly holeId: string;

  /** Options for user to choose */
  readonly options: readonly ClarificationOption[];

  /** Whether user must answer (vs optional with default) */
  readonly required: boolean;
}

/**
 * A clarification option.
 */
export interface ClarificationOption {
  /** Option ID */
  readonly id: string;

  /** Option text */
  readonly text: string;

  /** Which resolution this corresponds to */
  readonly candidateId: string;

  /** Whether this is the default */
  readonly isDefault: boolean;
}

/**
 * Error from pragmatics stage.
 */
export interface PragmaticsError {
  readonly stage: 'pragmatics';
  readonly message: string;
  readonly holeId?: string;
  readonly referenceExpression?: string;
}

export const PRAGMATICS_STAGE: PipelineStage<
  PragmaticsInput,
  PragmaticsOutput,
  PragmaticsError
> = {
  id: 'pragmatics',
  name: 'Pragmatic Resolution',
  description:
    'Resolve semantic holes using dialogue state and world state. ' +
    'Resolve anaphora ("it", "that"), bind references to entities, and fill in contextual defaults. ' +
    'Generate clarification questions for holes that cannot be resolved confidently.',
  inputType: '{ cplIntent: CPLIntent, holes: SemanticHole[], dialogueState: DialogueState }',
  outputType: '{ resolvedCpl: CPLIntent, clarifications: ClarificationQuestion[] }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: ['referent-resolution-completeness'],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/pragmatics/resolve.ts
    return {
      ok: false,
      error: {
        stage: 'pragmatics',
        message: 'Not implemented',
      },
    };
  },
  docLink: 'docs/gofai/pipeline/pragmatics.md',
};

// =============================================================================
// Stage 6: Typechecking & Validation
// =============================================================================

/**
 * Input to the typechecking stage.
 */
export interface TypecheckingInput {
  /** CPL-Intent to validate */
  readonly cplIntent: CPLIntent;

  /** World state for validation */
  readonly worldState: WorldStateSnapshot;

  /** Capability model (what's allowed) */
  readonly capabilities: CapabilityModel;
}

/**
 * Output from the typechecking stage.
 */
export interface TypecheckingOutput {
  /** Validated CPL-Intent */
  readonly validatedCpl: CPLIntent;

  /** Type errors (if any) */
  readonly typeErrors: readonly TypeError[];

  /** Warnings */
  readonly warnings: readonly string[];

  /** Presupposition violations */
  readonly presuppositionViolations: readonly PresuppositionViolation[];
}

/**
 * Capability model defining what operations are allowed.
 */
export interface CapabilityModel {
  /** Whether production layer edits are allowed */
  readonly productionEnabled: boolean;

  /** Whether routing edits are allowed */
  readonly routingEditable: boolean;

  /** Whether AI operations are allowed */
  readonly aiAllowed: boolean;

  /** Board policy */
  readonly boardPolicy: 'full-manual' | 'assisted' | 'auto';
}

/**
 * A type error.
 */
export interface TypeError {
  /** Error message */
  readonly message: string;

  /** CPL node with type error */
  readonly nodeId: string;

  /** Expected type */
  readonly expectedType?: string;

  /** Actual type */
  readonly actualType?: string;

  /** Suggestions */
  readonly suggestions?: readonly string[];
}

/**
 * A presupposition violation.
 */
export interface PresuppositionViolation {
  /** Presupposition that failed */
  readonly presupposition: string;

  /** Why it failed */
  readonly reason: string;

  /** Source expression */
  readonly expression: string;
}

/**
 * Error from typechecking stage.
 */
export interface TypecheckingError {
  readonly stage: 'typecheck';
  readonly message: string;
  readonly typeErrors: readonly TypeError[];
  readonly presuppositionViolations: readonly PresuppositionViolation[];
}

export const TYPECHECKING_STAGE: PipelineStage<
  TypecheckingInput,
  TypecheckingOutput,
  TypecheckingError
> = {
  id: 'typecheck',
  name: 'Typechecking & Validation',
  description:
    'Validate CPL-Intent against world state and capability model. ' +
    'Check types, verify presuppositions, ensure constraints are satisfiable, and check capability permissions. ' +
    'Fail fast if validation fails.',
  inputType: '{ cplIntent: CPLIntent, worldState: WorldStateSnapshot }',
  outputType: '{ validatedCpl: CPLIntent, typeErrors: TypeError[] }',
  deterministic: true,
  hasSideEffects: false,
  postconditions: [
    'constraint-executability',
    'presupposition-verification',
    'constraint-compatibility',
  ],
  execute: (input) => {
    // Placeholder - actual implementation in gofai/canon/cpl/validate.ts
    return {
      ok: false,
      error: {
        stage: 'typecheck',
        message: 'Not implemented',
        typeErrors: [],
        presuppositionViolations: [],
      },
    };
  },
  docLink: 'docs/gofai/pipeline/typechecking.md',
};

// =============================================================================
// Pipeline Orchestration
// =============================================================================

/**
 * Pipeline configuration.
 */
export interface PipelineConfig {
  /** Grammar version */
  readonly grammarVersion: string;

  /** Lexicon version */
  readonly lexiconVersion: string;

  /** Whether to stop on warnings */
  readonly stopOnWarnings: boolean;

  /** Whether to collect detailed traces */
  readonly collectTraces: boolean;

  /** Maximum pipeline duration (ms) */
  readonly timeoutMs: number;
}

/**
 * Pipeline execution context.
 */
export interface PipelineContext {
  /** Configuration */
  readonly config: PipelineConfig;

  /** Dialogue state */
  readonly dialogueState: DialogueState;

  /** World state */
  readonly worldState: WorldStateSnapshot;

  /** Capability model */
  readonly capabilities: CapabilityModel;

  /** Start timestamp */
  readonly startTime: number;
}

/**
 * Complete pipeline result.
 */
export interface PipelineResult {
  /** Whether the pipeline succeeded */
  readonly success: boolean;

  /** Final CPL-Intent (if successful) */
  readonly cplIntent?: CPLIntent;

  /** Clarification questions (if any) */
  readonly clarifications: readonly ClarificationQuestion[];

  /** Errors from any stage */
  readonly errors: readonly PipelineStageError[];

  /** Warnings */
  readonly warnings: readonly string[];

  /** Stage results for debugging */
  readonly stageResults?: ReadonlyMap<PipelineStageId, unknown>;

  /** Total duration (ms) */
  readonly durationMs: number;
}

/**
 * A pipeline stage error.
 */
export type PipelineStageError =
  | NormalizationError
  | TokenizationError
  | ParsingError
  | SemanticsError
  | PragmaticsError
  | TypecheckingError;

/**
 * Run the full NL → CPL compilation pipeline.
 */
export async function runPipeline(
  rawText: string,
  context: PipelineContext
): Promise<PipelineResult> {
  const startTime = Date.now();
  const stageResults = new Map<PipelineStageId, unknown>();
  const errors: PipelineStageError[] = [];
  const warnings: string[] = [];

  // Stage 1: Normalization
  const normResult = NORMALIZATION_STAGE.execute({
    rawText,
    userPrefs: context.dialogueState.userPreferences,
  });
  if (!normResult.ok) {
    errors.push(normResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('normalize', normResult.output);
  if (normResult.output.transformations.length > 0) {
    warnings.push(
      `Applied ${normResult.output.transformations.length} normalization(s)`
    );
  }

  // Stage 2: Tokenization
  const tokenResult = TOKENIZATION_STAGE.execute({
    normalizedText: normResult.output.normalizedText,
    originalText: normResult.output.originalText,
  });
  if (!tokenResult.ok) {
    errors.push(tokenResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('tokenize', tokenResult.output);

  // Stage 3: Parsing
  const parseResult = PARSING_STAGE.execute({
    tokens: tokenResult.output.tokens,
    grammarVersion: context.config.grammarVersion,
  });
  if (!parseResult.ok) {
    errors.push(parseResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('parse', parseResult.output);
  if (parseResult.output.hasAmbiguity) {
    warnings.push('Parse ambiguity detected');
  }

  // Stage 4: Semantics
  if (!parseResult.output.bestParse) {
    errors.push({
      stage: 'semantics',
      message: 'No parse tree selected',
    });
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }

  const semResult = SEMANTICS_STAGE.execute({
    parseTree: parseResult.output.bestParse,
    lexiconVersion: context.config.lexiconVersion,
    worldState: context.worldState,
  });
  if (!semResult.ok) {
    errors.push(semResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('semantics', semResult.output);
  if (semResult.output.holes.length > 0) {
    warnings.push(`${semResult.output.holes.length} semantic hole(s) detected`);
  }

  // Stage 5: Pragmatics
  const pragResult = PRAGMATICS_STAGE.execute({
    cplIntent: semResult.output.cplIntent,
    holes: semResult.output.holes,
    dialogueState: context.dialogueState,
    worldState: context.worldState,
  });
  if (!pragResult.ok) {
    errors.push(pragResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('pragmatics', pragResult.output);

  // If clarifications are needed, return early
  if (pragResult.output.clarifications.length > 0) {
    return {
      success: true,
      cplIntent: pragResult.output.resolvedCpl,
      clarifications: pragResult.output.clarifications,
      errors,
      warnings,
      stageResults,
      durationMs: Date.now() - startTime,
    };
  }

  // Stage 6: Typechecking
  const typecheckResult = TYPECHECKING_STAGE.execute({
    cplIntent: pragResult.output.resolvedCpl,
    worldState: context.worldState,
    capabilities: context.capabilities,
  });
  if (!typecheckResult.ok) {
    errors.push(typecheckResult.error);
    return {
      success: false,
      clarifications: [],
      errors,
      warnings,
      stageResults,
      durationMs: Date.now() - startTime,
    };
  }
  stageResults.set('typecheck', typecheckResult.output);
  warnings.push(...typecheckResult.output.warnings);

  // Success!
  return {
    success: true,
    cplIntent: typecheckResult.output.validatedCpl,
    clarifications: [],
    errors,
    warnings,
    stageResults,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Get a human-readable summary of pipeline stages.
 */
export function getPipelineStageSummary(): string {
  const stages = [
    NORMALIZATION_STAGE,
    TOKENIZATION_STAGE,
    PARSING_STAGE,
    SEMANTICS_STAGE,
    PRAGMATICS_STAGE,
    TYPECHECKING_STAGE,
  ];

  const lines: string[] = [
    'GOFAI Compilation Pipeline Stages:',
    '',
  ];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    lines.push(`${i + 1}. ${stage.name} (${stage.id})`);
    lines.push(`   ${stage.description}`);
    lines.push(`   Input:  ${stage.inputType}`);
    lines.push(`   Output: ${stage.outputType}`);
    lines.push(`   Deterministic: ${stage.deterministic}`);
    lines.push(`   Side Effects: ${stage.hasSideEffects}`);
    if (stage.postconditions.length > 0) {
      lines.push(`   Postconditions: ${stage.postconditions.join(', ')}`);
    }
    if (stage.docLink) {
      lines.push(`   Docs: ${stage.docLink}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
