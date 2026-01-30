/**
 * GOFAI NL Semantics — Type-Directed Disambiguation
 *
 * Uses bidirectional typing to prune ambiguous parse candidates.
 * When the grammar produces multiple parses, the type system can
 * eliminate candidates whose types don't unify with the expected
 * context.
 *
 * ## Bidirectional Typing
 *
 * Two modes of type information flow:
 *
 * 1. **Synthesis (↑)** — bottom-up: each parse node synthesizes a type
 *    from its children. A leaf token like "chorus" synthesizes
 *    `Entity(section)`, a verb like "add" synthesizes
 *    `(Entity → Event(add))`.
 *
 * 2. **Checking (↓)** — top-down: the expected type from the context
 *    constrains what types are acceptable. If a verb expects a
 *    `Entity(layer)` as patient, then a "bass" token that could be
 *    either `Entity(instrument)` or `Entity(layer)` is disambiguated
 *    to `Entity(layer)`.
 *
 * ## Algorithm
 *
 * ```
 * disambiguate(forest, expectedType):
 *   for each OR-node in forest:
 *     for each alternative:
 *       synthesizedType = synthesize(alternative)
 *       if not unifies(synthesizedType, expectedType):
 *         prune(alternative)
 *     if OR-node has 1 alternative remaining:
 *       convert to AND-node (disambiguation resolved)
 * ```
 *
 * @module gofai/nl/semantics/type-directed-disambiguation
 * @see gofai_goalA.md Step 132
 */

import type { SemanticType, EntitySubtype } from './representation';

// =============================================================================
// TYPE SYNTHESIS — bottom-up type assignment
// =============================================================================

/**
 * A synthesized type for a parse node.
 */
export interface SynthesizedType {
  /** The synthesized type */
  readonly type: SemanticType;

  /** Confidence in this synthesis (0–1) */
  readonly confidence: number;

  /** How the type was derived */
  readonly derivation: TypeDerivation;

  /** The parse node ID this was synthesized from */
  readonly nodeId: string;
}

/**
 * How a type was derived.
 */
export type TypeDerivation =
  | LexicalDerivation
  | RuleDerivation
  | InferenceDerivation
  | DefaultDerivation;

/**
 * Type from lexicon lookup (leaf node).
 */
export interface LexicalDerivation {
  readonly kind: 'lexical';
  readonly lemma: string;
  readonly lexemeId: string;
}

/**
 * Type from grammar rule application (AND node).
 */
export interface RuleDerivation {
  readonly kind: 'rule';
  readonly ruleId: string;
  readonly childTypes: readonly SynthesizedType[];
}

/**
 * Type from inference (e.g., context, selectional restrictions).
 */
export interface InferenceDerivation {
  readonly kind: 'inference';
  readonly reason: string;
}

/**
 * Default type assignment (when no other method works).
 */
export interface DefaultDerivation {
  readonly kind: 'default';
  readonly reason: string;
}

// =============================================================================
// TYPE CHECKING — top-down type constraint
// =============================================================================

/**
 * An expected type constraint pushed down from context.
 */
export interface ExpectedType {
  /** The expected type */
  readonly type: SemanticType;

  /** Whether this is a hard constraint (must match) or soft (prefer) */
  readonly hardness: TypeConstraintHardness;

  /** Source of the expectation */
  readonly source: ExpectedTypeSource;

  /** Human-readable description of why this type is expected */
  readonly reason: string;
}

export type TypeConstraintHardness =
  | 'hard'    // Must unify — prune if not
  | 'soft'    // Prefer — demote but don't prune
  | 'default'; // Use as default if no other info

/**
 * Where the expected type came from.
 */
export type ExpectedTypeSource =
  | VerbFrameSource
  | GrammarRuleSource
  | PragmaticSource
  | UserSource;

export interface VerbFrameSource {
  readonly kind: 'verb_frame';
  readonly verb: string;
  readonly role: string;
}

export interface GrammarRuleSource {
  readonly kind: 'grammar_rule';
  readonly ruleId: string;
  readonly position: number;
}

export interface PragmaticSource {
  readonly kind: 'pragmatic';
  readonly pragmaticRule: string;
}

export interface UserSource {
  readonly kind: 'user';
  readonly annotation: string;
}

// =============================================================================
// TYPE UNIFICATION — checking compatibility between types
// =============================================================================

/**
 * Result of a type unification attempt.
 */
export interface UnificationResult {
  /** Whether the types unify */
  readonly unified: boolean;

  /** The unified type (if successful) */
  readonly unifiedType: SemanticType | null;

  /** How well the types fit (0 = no fit, 1 = exact match) */
  readonly fitScore: number;

  /** Constraints generated during unification */
  readonly constraints: readonly UnificationConstraint[];

  /** Explanation of the unification result */
  readonly explanation: string;
}

/**
 * A constraint generated during unification.
 */
export interface UnificationConstraint {
  /** What was constrained */
  readonly variable: string;

  /** The constraint value */
  readonly value: SemanticType;

  /** Human-readable description */
  readonly description: string;
}

/**
 * Check whether two semantic types unify.
 *
 * Type unification rules:
 * - Identical types unify (score 1.0)
 * - HoleType unifies with anything (fills the hole)
 * - EntityType with subtype unifies with generic EntityType (score 0.8)
 * - FunctionType unifies if from and to both unify
 * - ProductType unifies if left and right both unify
 * - ListType unifies if element types unify
 * - Different basic types don't unify (score 0)
 */
export function unifyTypes(
  synthesized: SemanticType,
  expected: SemanticType,
): UnificationResult {
  // Identical kinds
  if (synthesized.kind === expected.kind) {
    return unifySameKind(synthesized, expected);
  }

  // Hole type — unifies with anything
  if (expected.kind === 'hole') {
    return {
      unified: true,
      unifiedType: synthesized,
      fitScore: 0.9,
      constraints: [{
        variable: 'hole',
        value: synthesized,
        description: `Hole filled with ${formatType(synthesized)}`,
      }],
      explanation: `Hole filled with ${formatType(synthesized)}`,
    };
  }

  if (synthesized.kind === 'hole') {
    return {
      unified: true,
      unifiedType: expected,
      fitScore: 0.9,
      constraints: [{
        variable: 'hole',
        value: expected,
        description: `Hole constrained to ${formatType(expected)}`,
      }],
      explanation: `Hole constrained to ${formatType(expected)}`,
    };
  }

  // Different kinds — no unification
  return {
    unified: false,
    unifiedType: null,
    fitScore: 0,
    constraints: [],
    explanation: `Cannot unify ${formatType(synthesized)} with ${formatType(expected)}`,
  };
}

/**
 * Unify two types of the same kind.
 */
function unifySameKind(
  a: SemanticType,
  b: SemanticType,
): UnificationResult {
  switch (a.kind) {
    case 'entity': {
      if (b.kind !== 'entity') break;
      // Both entities — check subtypes
      if (a.subtype === b.subtype) {
        return exactMatch(a);
      }
      if (a.subtype === undefined || b.subtype === undefined) {
        // One is generic — partial match
        const unified: SemanticType = {
          kind: 'entity',
          subtype: a.subtype ?? b.subtype,
        };
        return {
          unified: true,
          unifiedType: unified,
          fitScore: 0.8,
          constraints: a.subtype === undefined
            ? [{ variable: 'entity_subtype', value: b, description: `Entity constrained to ${b.subtype}` }]
            : [],
          explanation: `Entity types unified (${a.subtype ?? 'any'} ↔ ${b.subtype ?? 'any'})`,
        };
      }
      // Different subtypes — check if compatible
      const compatibility = ENTITY_SUBTYPE_COMPATIBILITY.get(a.subtype)?.has(b.subtype) ?? false;
      if (compatibility) {
        return {
          unified: true,
          unifiedType: a,
          fitScore: 0.6,
          constraints: [],
          explanation: `Entity subtypes ${a.subtype} and ${b.subtype} are compatible`,
        };
      }
      return {
        unified: false,
        unifiedType: null,
        fitScore: 0.1,
        constraints: [],
        explanation: `Entity subtypes ${a.subtype} and ${b.subtype} are incompatible`,
      };
    }

    case 'truth':
    case 'event':
    case 'state':
    case 'axis':
    case 'degree':
    case 'scope':
    case 'action':
    case 'constraint':
      return exactMatch(a);

    case 'function': {
      if (b.kind !== 'function') break;
      const fromResult = unifyTypes(a.from, b.from);
      const toResult = unifyTypes(a.to, b.to);
      if (fromResult.unified && toResult.unified) {
        return {
          unified: true,
          unifiedType: {
            kind: 'function',
            from: fromResult.unifiedType!,
            to: toResult.unifiedType!,
          },
          fitScore: (fromResult.fitScore + toResult.fitScore) / 2,
          constraints: [...fromResult.constraints, ...toResult.constraints],
          explanation: `Function types unified`,
        };
      }
      return {
        unified: false,
        unifiedType: null,
        fitScore: 0,
        constraints: [],
        explanation: `Function types incompatible: ${!fromResult.unified ? 'input' : 'output'} mismatch`,
      };
    }

    case 'product': {
      if (b.kind !== 'product') break;
      const leftResult = unifyTypes(a.left, b.left);
      const rightResult = unifyTypes(a.right, b.right);
      if (leftResult.unified && rightResult.unified) {
        return {
          unified: true,
          unifiedType: {
            kind: 'product',
            left: leftResult.unifiedType!,
            right: rightResult.unifiedType!,
          },
          fitScore: (leftResult.fitScore + rightResult.fitScore) / 2,
          constraints: [...leftResult.constraints, ...rightResult.constraints],
          explanation: `Product types unified`,
        };
      }
      return {
        unified: false,
        unifiedType: null,
        fitScore: 0,
        constraints: [],
        explanation: `Product types incompatible`,
      };
    }

    case 'list': {
      if (b.kind !== 'list') break;
      const elemResult = unifyTypes(a.elementType, b.elementType);
      if (elemResult.unified) {
        return {
          unified: true,
          unifiedType: { kind: 'list', elementType: elemResult.unifiedType! },
          fitScore: elemResult.fitScore,
          constraints: elemResult.constraints,
          explanation: `List types unified`,
        };
      }
      return {
        unified: false,
        unifiedType: null,
        fitScore: 0,
        constraints: [],
        explanation: `List element types incompatible`,
      };
    }

    case 'hole': {
      // Both holes — unify to the more constrained one
      if (b.kind !== 'hole') break;
      const innerResult = unifyTypes(a.expectedType, b.expectedType);
      return {
        unified: true,
        unifiedType: innerResult.unified
          ? { kind: 'hole', expectedType: innerResult.unifiedType! }
          : a,
        fitScore: 0.7,
        constraints: innerResult.constraints,
        explanation: `Both holes — merged constraints`,
      };
    }
  }

  // Shouldn't reach here if kinds match, but safe fallback
  return exactMatch(a);
}

function exactMatch(type: SemanticType): UnificationResult {
  return {
    unified: true,
    unifiedType: type,
    fitScore: 1.0,
    constraints: [],
    explanation: `Exact type match: ${formatType(type)}`,
  };
}

/**
 * Entity subtype compatibility: which subtypes can substitute for each other.
 * This captures the inheritance-like relationship between entity types.
 */
const ENTITY_SUBTYPE_COMPATIBILITY: ReadonlyMap<EntitySubtype, ReadonlySet<EntitySubtype>> = new Map([
  ['layer', new Set(['track'] as EntitySubtype[])],
  ['track', new Set(['layer'] as EntitySubtype[])],
  ['section', new Set(['range'] as EntitySubtype[])],
  ['range', new Set(['section'] as EntitySubtype[])],
  ['card', new Set(['param'] as EntitySubtype[])],
  ['note', new Set(['event_set', 'musical_object'] as EntitySubtype[])],
  ['musical_object', new Set(['note'] as EntitySubtype[])],
  ['event_set', new Set(['note'] as EntitySubtype[])],
]);

// =============================================================================
// DISAMBIGUATION CONTEXT — the environment for type-directed pruning
// =============================================================================

/**
 * A disambiguation context accumulates type expectations and resolved types
 * as the algorithm traverses the parse forest.
 */
export interface DisambiguationContext {
  /** Expected type for the current node (top-down) */
  readonly expectedType: ExpectedType | null;

  /** Types already synthesized for sibling nodes (left context) */
  readonly siblingTypes: ReadonlyMap<number, SynthesizedType>;

  /** The verb frame that established this context (if any) */
  readonly verbContext: VerbTypeContext | null;

  /** Depth in the forest (for cycle detection) */
  readonly depth: number;
}

/**
 * Type context established by a verb frame.
 */
export interface VerbTypeContext {
  /** The verb lemma */
  readonly verb: string;

  /** Expected types for each role position */
  readonly roleTypes: ReadonlyMap<string, ExpectedType>;

  /** The result type of the verb */
  readonly resultType: SemanticType;
}

/**
 * Create an initial disambiguation context with no expectations.
 */
export function createRootContext(): DisambiguationContext {
  return {
    expectedType: null,
    siblingTypes: new Map(),
    verbContext: null,
    depth: 0,
  };
}

/**
 * Create a child context with an expected type.
 */
export function createChildContext(
  parent: DisambiguationContext,
  expectedType: ExpectedType | null,
  siblingTypes?: ReadonlyMap<number, SynthesizedType>,
): DisambiguationContext {
  return {
    expectedType,
    siblingTypes: siblingTypes ?? new Map(),
    verbContext: parent.verbContext,
    depth: parent.depth + 1,
  };
}

/**
 * Create a verb context from a verb lemma.
 */
export function createVerbContext(
  verb: string,
  roleTypes: ReadonlyMap<string, ExpectedType>,
  resultType: SemanticType,
): VerbTypeContext {
  return { verb, roleTypes, resultType };
}

// =============================================================================
// DISAMBIGUATION ALGORITHM — pruning alternatives by type
// =============================================================================

/**
 * A parse forest node for disambiguation (minimal interface).
 */
export interface DisambiguationNode {
  readonly type: 'or' | 'and' | 'leaf';
  readonly id: string;
  readonly symbol: string;
  // OR-node
  readonly alternatives?: readonly DisambiguationNode[];
  // AND-node
  readonly ruleId?: string;
  readonly children?: readonly DisambiguationNode[];
  readonly semanticAction?: string;
  // Leaf
  readonly token?: { readonly text: string; readonly type: string };
}

/**
 * A type assignment function: maps leaf tokens to synthesized types.
 * This is provided by the lexicon/grammar.
 */
export type TypeAssignment = (token: string, tokenType: string) => readonly SynthesizedType[];

/**
 * A rule type function: given a rule ID and child types, produce the result type.
 * This is provided by the grammar's semantic actions.
 */
export type RuleTypeFunction = (ruleId: string, childTypes: readonly SynthesizedType[]) => SynthesizedType | null;

/**
 * Result of disambiguating a forest node.
 */
export interface DisambiguationResult {
  /** The synthesized type (or types if still ambiguous) */
  readonly types: readonly SynthesizedType[];

  /** How many alternatives were pruned */
  readonly prunedCount: number;

  /** How many alternatives remain */
  readonly remainingCount: number;

  /** Whether the node is now unambiguous */
  readonly resolved: boolean;

  /** Pruning decisions made */
  readonly decisions: readonly PruningDecision[];

  /** Child results (for AND nodes) */
  readonly childResults: readonly DisambiguationResult[];
}

/**
 * A pruning decision for an alternative.
 */
export interface PruningDecision {
  /** The node ID */
  readonly nodeId: string;

  /** The alternative index that was pruned (or -1 if kept) */
  readonly alternativeIndex: number;

  /** The synthesized type of the pruned alternative */
  readonly synthesizedType: SynthesizedType | null;

  /** The expected type that it failed to match */
  readonly expectedType: ExpectedType | null;

  /** Whether it was pruned or kept */
  readonly pruned: boolean;

  /** Reason */
  readonly reason: string;
}

/**
 * Disambiguate a forest node using type-directed pruning.
 */
export function disambiguate(
  node: DisambiguationNode,
  context: DisambiguationContext,
  typeAssignment: TypeAssignment,
  ruleType: RuleTypeFunction,
): DisambiguationResult {
  // Depth limit
  if (context.depth > MAX_DISAMBIGUATION_DEPTH) {
    return emptyResult();
  }

  switch (node.type) {
    case 'leaf':
      return disambiguateLeaf(node, context, typeAssignment);

    case 'and':
      return disambiguateAnd(node, context, typeAssignment, ruleType);

    case 'or':
      return disambiguateOr(node, context, typeAssignment, ruleType);
  }
}

const MAX_DISAMBIGUATION_DEPTH = 50;

/**
 * Disambiguate a leaf node — synthesize its type from the lexicon.
 */
function disambiguateLeaf(
  node: DisambiguationNode,
  context: DisambiguationContext,
  typeAssignment: TypeAssignment,
): DisambiguationResult {
  const tokenText = node.token?.text ?? '';
  const tokenType = node.token?.type ?? 'unknown';
  const synthesized = typeAssignment(tokenText, tokenType);

  if (synthesized.length === 0) {
    return emptyResult();
  }

  // If we have an expected type, filter by unification
  if (context.expectedType) {
    const decisions: PruningDecision[] = [];
    const kept: SynthesizedType[] = [];

    for (let i = 0; i < synthesized.length; i++) {
      const synth = synthesized[i]!;
      const unification = unifyTypes(synth.type, context.expectedType.type);

      if (unification.unified) {
        kept.push({
          ...synth,
          type: unification.unifiedType ?? synth.type,
          confidence: synth.confidence * unification.fitScore,
        });
        decisions.push({
          nodeId: node.id,
          alternativeIndex: i,
          synthesizedType: synth,
          expectedType: context.expectedType,
          pruned: false,
          reason: `Type ${formatType(synth.type)} unifies with expected ${formatType(context.expectedType.type)}`,
        });
      } else if (context.expectedType.hardness === 'hard') {
        decisions.push({
          nodeId: node.id,
          alternativeIndex: i,
          synthesizedType: synth,
          expectedType: context.expectedType,
          pruned: true,
          reason: `Type ${formatType(synth.type)} does not unify with expected ${formatType(context.expectedType.type)}`,
        });
      } else {
        // Soft constraint — keep but demote
        kept.push({
          ...synth,
          confidence: synth.confidence * 0.3,
        });
        decisions.push({
          nodeId: node.id,
          alternativeIndex: i,
          synthesizedType: synth,
          expectedType: context.expectedType,
          pruned: false,
          reason: `Type mismatch but soft constraint — demoted`,
        });
      }
    }

    const prunedCount = synthesized.length - kept.length;
    return {
      types: kept,
      prunedCount,
      remainingCount: kept.length,
      resolved: kept.length <= 1,
      decisions,
      childResults: [],
    };
  }

  // No expected type — return all synthesized types
  return {
    types: [...synthesized],
    prunedCount: 0,
    remainingCount: synthesized.length,
    resolved: synthesized.length <= 1,
    decisions: [],
    childResults: [],
  };
}

/**
 * Disambiguate an AND node — synthesize type from rule application.
 */
function disambiguateAnd(
  node: DisambiguationNode,
  context: DisambiguationContext,
  typeAssignment: TypeAssignment,
  ruleType: RuleTypeFunction,
): DisambiguationResult {
  const children = node.children ?? [];
  const childResults: DisambiguationResult[] = [];
  const childTypes: SynthesizedType[] = [];
  const siblingTypes = new Map<number, SynthesizedType>();

  // Process children left-to-right, accumulating sibling context
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const childContext = createChildContext(context, null, siblingTypes);
    const result = disambiguate(child, childContext, typeAssignment, ruleType);
    childResults.push(result);

    // Use the best type from the child
    if (result.types.length > 0) {
      const best = result.types.reduce((a, b) => a.confidence >= b.confidence ? a : b);
      childTypes.push(best);
      siblingTypes.set(i, best);
    }
  }

  // Apply the rule type function to get the result type
  const ruleId = node.ruleId ?? '';
  const resultType = ruleType(ruleId, childTypes);

  const types: SynthesizedType[] = resultType ? [resultType] : [];
  const decisions = childResults.flatMap(r => r.decisions);
  const prunedCount = childResults.reduce((sum, r) => sum + r.prunedCount, 0);

  return {
    types,
    prunedCount,
    remainingCount: types.length,
    resolved: types.length <= 1,
    decisions,
    childResults,
  };
}

/**
 * Disambiguate an OR node — prune alternatives by type.
 */
function disambiguateOr(
  node: DisambiguationNode,
  context: DisambiguationContext,
  typeAssignment: TypeAssignment,
  ruleType: RuleTypeFunction,
): DisambiguationResult {
  const alternatives = node.alternatives ?? [];
  const decisions: PruningDecision[] = [];
  const keptTypes: SynthesizedType[] = [];
  const childResults: DisambiguationResult[] = [];
  let prunedCount = 0;

  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i]!;
    const result = disambiguate(alt, context, typeAssignment, ruleType);
    childResults.push(result);

    if (result.types.length === 0) {
      // Alternative produced no valid types — pruned
      decisions.push({
        nodeId: node.id,
        alternativeIndex: i,
        synthesizedType: null,
        expectedType: context.expectedType,
        pruned: true,
        reason: 'No valid type synthesized for this alternative',
      });
      prunedCount++;
      continue;
    }

    // Check each type against expected
    let anyKept = false;
    for (const synth of result.types) {
      if (context.expectedType) {
        const unification = unifyTypes(synth.type, context.expectedType.type);
        if (unification.unified) {
          keptTypes.push({
            ...synth,
            confidence: synth.confidence * unification.fitScore,
          });
          anyKept = true;
        } else if (context.expectedType.hardness !== 'hard') {
          keptTypes.push({
            ...synth,
            confidence: synth.confidence * 0.3,
          });
          anyKept = true;
        }
      } else {
        keptTypes.push(synth);
        anyKept = true;
      }
    }

    if (!anyKept) {
      decisions.push({
        nodeId: node.id,
        alternativeIndex: i,
        synthesizedType: result.types[0] ?? null,
        expectedType: context.expectedType,
        pruned: true,
        reason: `Type ${result.types.map(t => formatType(t.type)).join('|')} incompatible with expected ${context.expectedType ? formatType(context.expectedType.type) : 'any'}`,
      });
      prunedCount++;
    } else {
      decisions.push({
        nodeId: node.id,
        alternativeIndex: i,
        synthesizedType: result.types[0] ?? null,
        expectedType: context.expectedType,
        pruned: false,
        reason: 'Type compatible',
      });
    }
  }

  // Add child pruning counts
  prunedCount += childResults.reduce((sum, r) => sum + r.prunedCount, 0);

  return {
    types: keptTypes,
    prunedCount,
    remainingCount: keptTypes.length,
    resolved: keptTypes.length <= 1,
    decisions: [...decisions, ...childResults.flatMap(r => r.decisions)],
    childResults,
  };
}

function emptyResult(): DisambiguationResult {
  return {
    types: [],
    prunedCount: 0,
    remainingCount: 0,
    resolved: true,
    decisions: [],
    childResults: [],
  };
}

// =============================================================================
// VERB TYPE EXPECTATIONS — generating expected types from verb frames
// =============================================================================

/**
 * Verb argument type mapping: maps verb + role to expected semantic type.
 */
export interface VerbArgumentTypeMap {
  /** The verb lemma */
  readonly verb: string;

  /** Role → expected type */
  readonly roleExpectations: ReadonlyMap<string, ExpectedType>;
}

/**
 * Built-in verb argument type expectations.
 */
export const VERB_ARGUMENT_TYPES: ReadonlyMap<string, VerbArgumentTypeMap> = new Map([
  ['add', {
    verb: 'add',
    roleExpectations: new Map([
      ['theme', {
        type: { kind: 'entity', subtype: undefined },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'add', role: 'theme' },
        reason: '"add" introduces a new entity',
      }],
      ['location', {
        type: { kind: 'entity', subtype: 'section' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'add', role: 'location' },
        reason: '"add ... to [location]" expects a section or range',
      }],
    ]),
  }],
  ['remove', {
    verb: 'remove',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: undefined },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'remove', role: 'patient' },
        reason: '"remove" targets an existing entity',
      }],
    ]),
  }],
  ['make', {
    verb: 'make',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: undefined },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'make', role: 'patient' },
        reason: '"make" modifies an existing entity',
      }],
      ['result', {
        type: { kind: 'degree' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'make', role: 'result' },
        reason: '"make X [adjective]" — the complement is a degree expression',
      }],
    ]),
  }],
  ['set', {
    verb: 'set',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'param' },
        hardness: 'hard',
        source: { kind: 'verb_frame', verb: 'set', role: 'patient' },
        reason: '"set" targets a parameter',
      }],
      ['degree', {
        type: { kind: 'degree' },
        hardness: 'hard',
        source: { kind: 'verb_frame', verb: 'set', role: 'degree' },
        reason: '"set X to [value]" requires a degree/value',
      }],
    ]),
  }],
  ['move', {
    verb: 'move',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: undefined },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'move', role: 'patient' },
        reason: '"move" targets an entity',
      }],
      ['goal', {
        type: { kind: 'entity', subtype: 'range' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'move', role: 'goal' },
        reason: '"move X to [location]" expects a position/range',
      }],
    ]),
  }],
  ['copy', {
    verb: 'copy',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: undefined },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'copy', role: 'patient' },
        reason: '"copy" duplicates an entity',
      }],
      ['goal', {
        type: { kind: 'entity', subtype: 'range' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'copy', role: 'goal' },
        reason: '"copy X to [location]" expects a destination',
      }],
    ]),
  }],
  ['transpose', {
    verb: 'transpose',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'musical_object' },
        hardness: 'hard',
        source: { kind: 'verb_frame', verb: 'transpose', role: 'patient' },
        reason: '"transpose" requires note-bearing content',
      }],
      ['degree', {
        type: { kind: 'degree' },
        hardness: 'hard',
        source: { kind: 'verb_frame', verb: 'transpose', role: 'degree' },
        reason: '"transpose by [interval]" requires a degree value',
      }],
    ]),
  }],
  ['quantize', {
    verb: 'quantize',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'note' },
        hardness: 'hard',
        source: { kind: 'verb_frame', verb: 'quantize', role: 'patient' },
        reason: '"quantize" operates on note events',
      }],
    ]),
  }],
  ['brighten', {
    verb: 'brighten',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'layer' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'brighten', role: 'patient' },
        reason: '"brighten" modifies an audible element',
      }],
    ]),
  }],
  ['darken', {
    verb: 'darken',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'layer' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'darken', role: 'patient' },
        reason: '"darken" modifies an audible element',
      }],
    ]),
  }],
  ['widen', {
    verb: 'widen',
    roleExpectations: new Map([
      ['patient', {
        type: { kind: 'entity', subtype: 'layer' },
        hardness: 'soft',
        source: { kind: 'verb_frame', verb: 'widen', role: 'patient' },
        reason: '"widen" modifies stereo width of an audible element',
      }],
    ]),
  }],
]);

/**
 * Get the expected type for a verb + role combination.
 */
export function getVerbExpectedType(verb: string, role: string): ExpectedType | null {
  const map = VERB_ARGUMENT_TYPES.get(verb);
  if (!map) return null;
  return map.roleExpectations.get(role) ?? null;
}

// =============================================================================
// TYPE FORMATTING — human-readable type display
// =============================================================================

/**
 * Format a semantic type as a human-readable string.
 */
export function formatType(type: SemanticType): string {
  switch (type.kind) {
    case 'entity':
      return type.subtype ? `Entity(${type.subtype})` : 'Entity';
    case 'truth':
      return 'Bool';
    case 'event':
      return type.eventCategory ? `Event(${type.eventCategory})` : 'Event';
    case 'state':
      return 'State';
    case 'function':
      return `(${formatType(type.from)} → ${formatType(type.to)})`;
    case 'product':
      return `(${formatType(type.left)} × ${formatType(type.right)})`;
    case 'axis':
      return 'Axis';
    case 'degree':
      return 'Degree';
    case 'scope':
      return 'Scope';
    case 'action':
      return 'Action';
    case 'constraint':
      return 'Constraint';
    case 'hole':
      return `Hole(${formatType(type.expectedType)})`;
    case 'list':
      return `List(${formatType(type.elementType)})`;
  }
}

// =============================================================================
// DIAGNOSTICS — reporting disambiguation results
// =============================================================================

/**
 * Format a disambiguation result as a human-readable report.
 */
export function formatDisambiguationReport(result: DisambiguationResult): string {
  const lines: string[] = [];

  lines.push(`Disambiguation: ${result.resolved ? 'RESOLVED' : 'AMBIGUOUS'}`);
  lines.push(`  Types remaining: ${result.remainingCount}`);
  lines.push(`  Alternatives pruned: ${result.prunedCount}`);

  if (result.types.length > 0) {
    lines.push('  Types:');
    for (const t of result.types) {
      lines.push(`    ${formatType(t.type)} (confidence: ${(t.confidence * 100).toFixed(0)}%)`);
    }
  }

  if (result.decisions.length > 0) {
    lines.push('  Decisions:');
    for (const d of result.decisions) {
      const status = d.pruned ? 'PRUNED' : 'KEPT';
      lines.push(`    [${status}] node=${d.nodeId} alt=${d.alternativeIndex}: ${d.reason}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the type-directed disambiguation module.
 */
export function getTypeDisambiguationStats(): {
  verbArgumentTypes: number;
  entitySubtypeCompatibilities: number;
  maxDisambiguationDepth: number;
} {
  return {
    verbArgumentTypes: VERB_ARGUMENT_TYPES.size,
    entitySubtypeCompatibilities: ENTITY_SUBTYPE_COMPATIBILITY.size,
    maxDisambiguationDepth: MAX_DISAMBIGUATION_DEPTH,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetTypeDisambiguation(): void {
  // Currently stateless — placeholder for future mutable state
}
