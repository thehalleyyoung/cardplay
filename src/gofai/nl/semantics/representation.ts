/**
 * GOFAI Semantic Representation — Core Meaning Representation Types
 *
 * Step 013 [NLP][Sem]: Defines the core semantic representation strategy:
 *
 * 1. **Typed Lambda Calculus**: Compositional meaning assembly via typed
 *    lambda terms. Parse rules attach lambda terms that compose bottom-up
 *    into CPL-Intent skeletons.
 *
 * 2. **Event Semantics** (neo-Davidsonian): Edit actions are events with
 *    thematic roles (agent=user, patient=target, theme=axis, etc.).
 *
 * 3. **Degree Semantics**: Scalar adjectives ("brighter", "more lift")
 *    are represented as ordering constraints on perceptual axis variables.
 *
 * 4. **MRS-like Underspecification**: Scope ambiguities (quantifiers,
 *    negation, "only") are preserved via explicit constraints rather
 *    than premature commitment.
 *
 * ## Architecture
 *
 * The semantic representation sits between parsing and CPL construction:
 *
 *   Parse Tree → Lambda Terms → Semantic Composition → MRS → CPL-Intent
 *
 * Each parse rule has an associated "semantic action" (a lambda term
 * constructor). Composition applies these bottom-up. The result is an
 * MRS-like structure with explicit scope constraints that is then
 * "solved" into CPL-Intent (possibly with holes if scope is ambiguous).
 *
 * @module gofai/nl/semantics/representation
 * @see {@link gofaimusicplus.md} Section 4.6 for design rationale
 */

import type { AxisId, OpcodeId, ConstraintTypeId } from '../../canon/types';

// =============================================================================
// Semantic Types (the type system for meaning)
// =============================================================================

/**
 * The type system for semantic representations.
 *
 * This is a simple type system inspired by Montague grammar:
 * - Basic types: e (entity), t (truth value), s (state/event)
 * - Function types: (a → b)
 * - Product types: (a × b)
 * - Domain-specific types: axis, degree, scope, action
 */
export type SemanticType =
  | EntityType_
  | TruthType
  | EventType
  | StateType
  | FunctionType
  | ProductType
  | AxisType
  | DegreeType
  | ScopeType_
  | ActionType
  | ConstraintType_
  | HoleType
  | ListType;

/**
 * Entity type (e): individuals in the musical domain.
 * Subtypes: section, layer, card, note, range, track.
 */
export interface EntityType_ {
  readonly kind: 'entity';
  readonly subtype: EntitySubtype | undefined;
}

/**
 * Entity subtypes for selectional restrictions.
 */
export type EntitySubtype =
  | 'section'    // A section of the song
  | 'layer'      // A track/layer
  | 'card'       // A card in the signal chain
  | 'note'       // A note event
  | 'range'      // A bar range
  | 'track'      // A track container
  | 'param'      // A parameter on a card
  | 'event_set'  // A set of events
  | 'musical_object'; // An abstract musical object (motif, chord, etc.)

/**
 * Truth type (t): propositions and boolean values.
 */
export interface TruthType {
  readonly kind: 'truth';
}

/**
 * Event type (s): edit events with thematic roles.
 */
export interface EventType {
  readonly kind: 'event';
  readonly eventCategory: EventCategory | undefined;
}

/**
 * Event categories.
 */
export type EventCategory =
  | 'change'    // Modify existing content
  | 'add'       // Introduce new content
  | 'remove'    // Delete content
  | 'inspect'   // Query without mutation
  | 'undo'      // Reverse a prior edit
  | 'explain';  // Request explanation

/**
 * State type: a snapshot of the project world.
 */
export interface StateType {
  readonly kind: 'state';
}

/**
 * Function type (a → b): a function from a to b.
 */
export interface FunctionType {
  readonly kind: 'function';
  readonly from: SemanticType;
  readonly to: SemanticType;
}

/**
 * Product type (a × b): a pair of types.
 */
export interface ProductType {
  readonly kind: 'product';
  readonly left: SemanticType;
  readonly right: SemanticType;
}

/**
 * Axis type: a perceptual axis.
 */
export interface AxisType {
  readonly kind: 'axis';
}

/**
 * Degree type: a scalar degree on an axis.
 */
export interface DegreeType {
  readonly kind: 'degree';
}

/**
 * Scope type: a region of the project.
 */
export interface ScopeType_ {
  readonly kind: 'scope';
}

/**
 * Action type: a musical edit action.
 */
export interface ActionType {
  readonly kind: 'action';
}

/**
 * Constraint type: a preservation or restriction.
 */
export interface ConstraintType_ {
  readonly kind: 'constraint';
}

/**
 * Hole type: an unresolved part of meaning.
 */
export interface HoleType {
  readonly kind: 'hole';
  readonly expectedType: SemanticType;
}

/**
 * List type: a collection.
 */
export interface ListType {
  readonly kind: 'list';
  readonly elementType: SemanticType;
}

// =============================================================================
// Convenience Type Constructors
// =============================================================================

/** Entity type */
export const E: EntityType_ = { kind: 'entity', subtype: undefined };
/** Entity with subtype */
export function e(sub: EntitySubtype): EntityType_ { return { kind: 'entity', subtype: sub }; }
/** Truth type */
export const T: TruthType = { kind: 'truth' };
/** Event type */
export const S: EventType = { kind: 'event', eventCategory: undefined };
/** Event with category */
export function s(cat: EventCategory): EventType { return { kind: 'event', eventCategory: cat }; }
/** Function type */
export function fn(from: SemanticType, to: SemanticType): FunctionType {
  return { kind: 'function', from, to };
}
/** Product type */
export function prod(left: SemanticType, right: SemanticType): ProductType {
  return { kind: 'product', left, right };
}
/** Axis type */
export const AXIS: AxisType = { kind: 'axis' };
/** Degree type */
export const DEGREE: DegreeType = { kind: 'degree' };
/** Scope type */
export const SCOPE: ScopeType_ = { kind: 'scope' };
/** Action type */
export const ACTION: ActionType = { kind: 'action' };
/** Constraint type */
export const CONSTRAINT: ConstraintType_ = { kind: 'constraint' };

// =============================================================================
// Lambda Terms (Compositional Meaning Assembly)
// =============================================================================

/**
 * A lambda term: the building block of compositional semantics.
 *
 * Lambda terms are assembled bottom-up during semantic composition:
 * - Lexical items produce base terms (constants, variables)
 * - Grammar rules combine terms via application and abstraction
 * - The final term is "read off" into CPL-Intent
 */
export type LambdaTerm =
  | VariableTerm
  | ConstantTerm
  | ApplicationTerm
  | AbstractionTerm
  | ConjunctionTerm
  | DisjunctionTerm
  | NegationTerm
  | QuantifierTerm
  | EventTerm
  | DegreeTerm
  | ScopeTerm
  | ConstraintTerm
  | HoleTerm_
  | ListTerm
  | LetTerm;

/**
 * A variable (bound by a lambda or quantifier).
 */
export interface VariableTerm {
  readonly tag: 'var';
  readonly name: string;
  readonly type: SemanticType;
  /** De Bruijn index (for alpha-equivalence) */
  readonly index: number | undefined;
}

/**
 * A constant (a lexically-grounded value).
 */
export interface ConstantTerm {
  readonly tag: 'const';
  readonly name: string;
  readonly type: SemanticType;
  readonly value: ConstantValue;
  /** Lexeme ID that produced this constant */
  readonly lexemeId: string | undefined;
  /** Source span */
  readonly sourceSpan: SourceSpan | undefined;
}

/**
 * A constant value in the semantic representation.
 */
export type ConstantValue =
  | { readonly kind: 'axis'; readonly axisId: AxisId }
  | { readonly kind: 'opcode'; readonly opcodeId: OpcodeId }
  | { readonly kind: 'constraint_type'; readonly constraintTypeId: ConstraintTypeId }
  | { readonly kind: 'entity_ref'; readonly entityType: EntitySubtype; readonly ref: string }
  | { readonly kind: 'numeric'; readonly value: number; readonly unit: string | undefined }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'degree_word'; readonly word: string; readonly polarity: 'positive' | 'negative' }
  | { readonly kind: 'direction'; readonly direction: 'increase' | 'decrease' }
  | { readonly kind: 'preservation_mode'; readonly mode: 'exact' | 'functional' | 'recognizable' }
  | { readonly kind: 'section_ref'; readonly sectionType: string; readonly index: number | undefined }
  | { readonly kind: 'layer_ref'; readonly layerType: string }
  | { readonly kind: 'time_ref'; readonly bars: number; readonly beats: number | undefined }
  | { readonly kind: 'speech_act'; readonly act: 'command' | 'question' | 'suggestion' | 'meta' };

/**
 * Function application: (f x).
 */
export interface ApplicationTerm {
  readonly tag: 'app';
  readonly func: LambdaTerm;
  readonly arg: LambdaTerm;
  readonly type: SemanticType;
}

/**
 * Lambda abstraction: λx.body
 */
export interface AbstractionTerm {
  readonly tag: 'abs';
  readonly param: string;
  readonly paramType: SemanticType;
  readonly body: LambdaTerm;
  readonly type: FunctionType;
}

/**
 * Conjunction: P ∧ Q (for coordinated goals/constraints).
 */
export interface ConjunctionTerm {
  readonly tag: 'and';
  readonly conjuncts: readonly LambdaTerm[];
  readonly type: SemanticType;
  /** Discourse relation (if marked) */
  readonly relation: DiscourseRelation | undefined;
}

/**
 * Disjunction: P ∨ Q (for alternatives).
 */
export interface DisjunctionTerm {
  readonly tag: 'or';
  readonly disjuncts: readonly LambdaTerm[];
  readonly type: SemanticType;
}

/**
 * Negation: ¬P (for "don't", "no", "without").
 */
export interface NegationTerm {
  readonly tag: 'not';
  readonly body: LambdaTerm;
  readonly type: SemanticType;
  /** Scope of negation (which CPL nodes are negated) */
  readonly negationScope: NegationScope;
}

/**
 * Negation scope: what exactly is negated.
 */
export type NegationScope =
  | 'action'      // Don't do this action
  | 'scope'       // Not in this scope
  | 'entity'      // Not this entity
  | 'constraint'  // Removing this constraint
  | 'wide';       // Wide scope negation (entire request)

/**
 * Quantifier: ∀x.P or ∃x.P
 */
export interface QuantifierTerm {
  readonly tag: 'quant';
  readonly quantifier: QuantifierType;
  readonly variable: string;
  readonly restriction: LambdaTerm;
  readonly body: LambdaTerm;
  readonly type: SemanticType;
}

/**
 * Quantifier types.
 */
export type QuantifierType =
  | 'universal'       // "all", "every"
  | 'existential'     // "some", "a"
  | 'most'            // "most"
  | 'distributive'    // "each" (individual application)
  | 'collective'      // "together"
  | 'proportional';   // "every other", "half"

// =============================================================================
// Domain-Specific Lambda Terms
// =============================================================================

/**
 * Event term: a neo-Davidsonian event representation.
 *
 * edit(e) ∧ agent(e, user) ∧ patient(e, target) ∧ theme(e, axis) ∧ manner(e, degree)
 */
export interface EventTerm {
  readonly tag: 'event';
  readonly eventVariable: string;
  readonly eventType: EventCategory;
  readonly roles: readonly ThematicRole[];
  readonly type: EventType;
}

/**
 * A thematic role in an event.
 */
export interface ThematicRole {
  /** Role name */
  readonly role: ThematicRoleName;
  /** The filler (a lambda term) */
  readonly filler: LambdaTerm;
}

/**
 * Thematic role names (neo-Davidsonian).
 */
export type ThematicRoleName =
  | 'agent'        // Who is doing it (always = user)
  | 'patient'      // What is being changed (target entity)
  | 'theme'        // What dimension/axis is affected
  | 'goal'         // The target state/value
  | 'source'       // The starting state/value
  | 'instrument'   // What lever/tool is used
  | 'beneficiary'  // Who benefits (usually = user)
  | 'manner'       // How (degree, method)
  | 'location'     // Where (scope)
  | 'temporal'     // When (time range)
  | 'comitative';  // With what constraint

/**
 * Degree term: a scalar position or ordering on an axis.
 *
 * Degree semantics for comparatives:
 * "more lift" → ∃d. lift(chorus) ≥ d_current + amount(d)
 * "brighter" → brightness(target) > brightness(reference)
 */
export interface DegreeTerm {
  readonly tag: 'degree';
  readonly axis: LambdaTerm;
  readonly direction: 'positive' | 'negative' | 'equative';
  readonly amount: LambdaTerm | undefined;
  readonly reference: LambdaTerm | undefined;
  readonly type: DegreeType;
}

/**
 * Scope term: a region specification.
 */
export interface ScopeTerm {
  readonly tag: 'scope';
  readonly scopeType: ScopeKind;
  readonly value: LambdaTerm;
  readonly within: LambdaTerm | undefined;
  readonly type: ScopeType_;
}

/**
 * Scope kinds.
 */
export type ScopeKind =
  | 'section'
  | 'layer'
  | 'range'
  | 'selection'
  | 'card'
  | 'global';

/**
 * Constraint term: a preservation or restriction.
 */
export interface ConstraintTerm {
  readonly tag: 'constraint';
  readonly constraintKind: ConstraintKind;
  readonly target: LambdaTerm;
  readonly mode: LambdaTerm | undefined;
  readonly type: ConstraintType_;
}

/**
 * Constraint kinds.
 */
export type ConstraintKind =
  | 'preserve'       // Keep something the same
  | 'only_change'    // Restrict what can change
  | 'prohibit'       // Explicitly disallow
  | 'require'        // Explicitly require
  | 'soft_prefer';   // Prefer (weighted)

/**
 * Hole term: an unresolved part of meaning.
 */
export interface HoleTerm_ {
  readonly tag: 'hole';
  readonly holeId: string;
  readonly expectedType: SemanticType;
  readonly candidates: readonly LambdaTerm[];
  readonly type: HoleType;
}

/**
 * List term: a collection of terms.
 */
export interface ListTerm {
  readonly tag: 'list';
  readonly elements: readonly LambdaTerm[];
  readonly type: ListType;
}

/**
 * Let binding: let x = value in body.
 */
export interface LetTerm {
  readonly tag: 'let';
  readonly name: string;
  readonly value: LambdaTerm;
  readonly body: LambdaTerm;
  readonly type: SemanticType;
}

// =============================================================================
// Discourse Relations (for coordination semantics)
// =============================================================================

/**
 * SDRT-style discourse relations for coordination.
 */
export type DiscourseRelation =
  | 'narration'       // "and then" — sequential
  | 'contrast'        // "but" — contrastive
  | 'elaboration'     // "and specifically" — refinement
  | 'background'      // "while" — concurrent
  | 'result'          // "so" — causal
  | 'correction'      // "actually" / "instead" — replacement
  | 'continuation'    // "and also" — additive
  | 'parallel';       // "and" — parallel goals

// =============================================================================
// Source Span (for provenance)
// =============================================================================

/**
 * Source span linking a semantic term to its origin in text.
 */
export interface SourceSpan {
  /** Start offset in original text */
  readonly start: number;
  /** End offset */
  readonly end: number;
  /** The original text */
  readonly text: string;
  /** Lexeme ID (if from a lexeme) */
  readonly lexemeId: string | undefined;
  /** Grammar rule ID (if from a rule) */
  readonly ruleId: string | undefined;
}

// =============================================================================
// MRS-like Underspecification
// =============================================================================

/**
 * Minimal Recursion Semantics (MRS)-like representation.
 *
 * Instead of choosing a single scope reading, we keep:
 * - A set of elementary predications (EPs)
 * - A set of handle constraints (scope constraints)
 * - A top handle
 *
 * Scope resolution produces one or more fully-scoped readings.
 * If there's only one valid reading, it's unambiguous.
 * If there are multiple, the system can either pick the safest
 * or ask the user.
 */
export interface MRS {
  /** Top handle (entry point) */
  readonly topHandle: HandleId;

  /** Elementary predications */
  readonly eps: readonly ElementaryPredication[];

  /** Handle constraints (scope) */
  readonly constraints: readonly HandleConstraint[];

  /** Variables and their types */
  readonly variables: readonly MRSVariable[];

  /** Holes that remain unresolved */
  readonly holes: readonly MRSHole[];
}

/**
 * A handle identifier (for scope tracking).
 */
export type HandleId = string & { readonly __brand: 'HandleId' };

/**
 * Create a handle ID.
 */
export function createHandleId(name: string): HandleId {
  return `h:${name}` as HandleId;
}

/**
 * An elementary predication (EP): a single atomic meaning contribution.
 */
export interface ElementaryPredication {
  /** Unique label (handle) for this EP */
  readonly label: HandleId;

  /** Predicate name */
  readonly predicate: string;

  /** Arguments */
  readonly args: readonly MRSArg[];

  /** Semantic type */
  readonly type: SemanticType;

  /** Source provenance */
  readonly source: SourceSpan | undefined;
}

/**
 * An argument in an EP.
 */
export interface MRSArg {
  /** Argument role */
  readonly role: string;

  /** Variable or handle */
  readonly value: string;
}

/**
 * A handle constraint (scope ordering).
 *
 * h1 =q h2 means "h1 must outscope h2"
 * (h2 is somewhere below h1 in the scope tree)
 */
export interface HandleConstraint {
  /** Higher handle */
  readonly upper: HandleId;

  /** Constraint type */
  readonly relation: '=q' | 'qeq'; // equality modulo quantifiers

  /** Lower handle */
  readonly lower: HandleId;
}

/**
 * A variable in the MRS.
 */
export interface MRSVariable {
  /** Variable name */
  readonly name: string;

  /** Variable type */
  readonly type: SemanticType;

  /** Features */
  readonly features: Readonly<Record<string, string>>;
}

/**
 * A hole in the MRS (underspecified handle).
 */
export interface MRSHole {
  /** Handle ID of the hole */
  readonly handleId: HandleId;

  /** Expected type */
  readonly expectedType: SemanticType;

  /** Candidate fillers */
  readonly candidates: readonly HandleId[];

  /** Whether this hole requires clarification */
  readonly requiresClarification: boolean;
}

// =============================================================================
// Scope Resolution
// =============================================================================

/**
 * A fully scoped reading: result of resolving an MRS.
 */
export interface ScopedReading {
  /** Reading index */
  readonly index: number;

  /** The scoped lambda term */
  readonly term: LambdaTerm;

  /** Score (preference) */
  readonly score: number;

  /** Whether this reading is safe (no risky scope ordering) */
  readonly safe: boolean;

  /** Description of the scope ordering */
  readonly description: string;
}

/**
 * Result of scope resolution.
 */
export interface ScopeResolutionResult {
  /** All valid readings */
  readonly readings: readonly ScopedReading[];

  /** Whether there's a unique best reading */
  readonly uniqueBest: boolean;

  /** Whether clarification is needed */
  readonly needsClarification: boolean;

  /** Clarification question (if needed) */
  readonly clarificationQuestion: string | undefined;
}

// =============================================================================
// Semantic Composition Interface
// =============================================================================

/**
 * A semantic action: attached to a grammar rule, it constructs meaning.
 */
export interface SemanticAction {
  /** Rule ID */
  readonly ruleId: string;

  /** The semantic type of this rule's output */
  readonly outputType: SemanticType;

  /** Description */
  readonly description: string;

  /**
   * Build a lambda term from the rule's children.
   * @param children - The semantic values of child nodes
   * @returns The composed lambda term
   */
  compose(children: readonly LambdaTerm[]): LambdaTerm;
}

/**
 * Registry of semantic actions, indexed by grammar rule ID.
 */
export interface SemanticActionRegistry {
  /** Register a semantic action */
  register(action: SemanticAction): void;

  /** Look up the action for a rule */
  lookup(ruleId: string): SemanticAction | undefined;

  /** Get all registered actions */
  all(): readonly SemanticAction[];
}

/**
 * Create a semantic action registry.
 */
export function createSemanticActionRegistry(): SemanticActionRegistry {
  const actions = new Map<string, SemanticAction>();

  return {
    register(action: SemanticAction): void {
      actions.set(action.ruleId, action);
    },

    lookup(ruleId: string): SemanticAction | undefined {
      return actions.get(ruleId);
    },

    all(): readonly SemanticAction[] {
      return [...actions.values()];
    },
  };
}

// =============================================================================
// Type Checking for Semantic Terms
// =============================================================================

/**
 * Check whether two semantic types are compatible.
 */
export function typesCompatible(a: SemanticType, b: SemanticType): boolean {
  if (a.kind !== b.kind) return false;

  switch (a.kind) {
    case 'entity':
      // Entity subtypes: if either is undefined, compatible (generic entity)
      if (a.subtype === undefined || (b as EntityType_).subtype === undefined) return true;
      return a.subtype === (b as EntityType_).subtype;

    case 'event':
      // Event categories: if either is undefined, compatible
      if (a.eventCategory === undefined || (b as EventType).eventCategory === undefined) return true;
      return a.eventCategory === (b as EventType).eventCategory;

    case 'function': {
      const bf = b as FunctionType;
      return typesCompatible(a.from, bf.from) && typesCompatible(a.to, bf.to);
    }

    case 'product': {
      const bp = b as ProductType;
      return typesCompatible(a.left, bp.left) && typesCompatible(a.right, bp.right);
    }

    case 'list':
      return typesCompatible(a.elementType, (b as ListType).elementType);

    case 'hole':
      // Holes are compatible with their expected type
      return typesCompatible(a.expectedType, (b as HoleType).expectedType);

    // Simple types: same kind = compatible
    case 'truth':
    case 'state':
    case 'axis':
    case 'degree':
    case 'scope':
    case 'action':
    case 'constraint':
      return true;
  }
}

/**
 * Get the result type of applying a function to an argument.
 * Returns undefined if the application is type-invalid.
 */
export function applicationResultType(
  funcType: SemanticType,
  argType: SemanticType
): SemanticType | undefined {
  if (funcType.kind !== 'function') return undefined;
  if (!typesCompatible(funcType.from, argType)) return undefined;
  return funcType.to;
}

/**
 * Pretty-print a semantic type for debugging.
 */
export function printType(type: SemanticType): string {
  switch (type.kind) {
    case 'entity':
      return type.subtype ? `e<${type.subtype}>` : 'e';
    case 'truth':
      return 't';
    case 'event':
      return type.eventCategory ? `s<${type.eventCategory}>` : 's';
    case 'state':
      return 'state';
    case 'function':
      return `(${printType(type.from)} → ${printType(type.to)})`;
    case 'product':
      return `(${printType(type.left)} × ${printType(type.right)})`;
    case 'axis':
      return 'axis';
    case 'degree':
      return 'deg';
    case 'scope':
      return 'scope';
    case 'action':
      return 'act';
    case 'constraint':
      return 'constr';
    case 'hole':
      return `?${printType(type.expectedType)}`;
    case 'list':
      return `[${printType(type.elementType)}]`;
  }
}

/**
 * Pretty-print a lambda term for debugging.
 */
export function printTerm(term: LambdaTerm, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  switch (term.tag) {
    case 'var':
      return `${term.name}:${printType(term.type)}`;
    case 'const':
      return `${term.name}:${printType(term.type)}`;
    case 'app':
      return `(${printTerm(term.func, depth)} ${printTerm(term.arg, depth)})`;
    case 'abs':
      return `(λ${term.param}:${printType(term.paramType)}. ${printTerm(term.body, depth)})`;
    case 'and':
      return `(${term.conjuncts.map(c => printTerm(c, depth)).join(' ∧ ')})`;
    case 'or':
      return `(${term.disjuncts.map(d => printTerm(d, depth)).join(' ∨ ')})`;
    case 'not':
      return `¬${printTerm(term.body, depth)}`;
    case 'quant':
      return `(${term.quantifier === 'universal' ? '∀' : '∃'}${term.variable}. ${printTerm(term.restriction, depth)} → ${printTerm(term.body, depth)})`;
    case 'event':
      return `${indent}event(${term.eventVariable}:${term.eventType}) {\n${term.roles.map(r => `${indent}  ${r.role}: ${printTerm(r.filler, depth + 1)}`).join('\n')}\n${indent}}`;
    case 'degree':
      return `deg(${printTerm(term.axis, depth)}, ${term.direction}${term.amount ? ', ' + printTerm(term.amount, depth) : ''})`;
    case 'scope':
      return `scope(${term.scopeType}, ${printTerm(term.value, depth)})`;
    case 'constraint':
      return `constraint(${term.constraintKind}, ${printTerm(term.target, depth)})`;
    case 'hole':
      return `?hole(${term.holeId}:${printType(term.expectedType)})`;
    case 'list':
      return `[${term.elements.map(e_ => printTerm(e_, depth)).join(', ')}]`;
    case 'let':
      return `(let ${term.name} = ${printTerm(term.value, depth)} in ${printTerm(term.body, depth)})`;
  }
}
