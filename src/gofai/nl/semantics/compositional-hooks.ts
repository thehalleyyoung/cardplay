/**
 * GOFAI NL Semantics — Compositional Semantics Hooks
 *
 * Attaches semantic actions (lambda terms) to grammar rules so that
 * meaning is composed bottom-up as the parse tree is built. Each
 * grammar rule has a "semantic hook" that takes the meanings of its
 * children and produces the meaning of the parent.
 *
 * ## Design
 *
 * The composition pipeline is:
 *
 * ```
 * Parse Tree (AND-nodes with children)
 *   ↓ bottom-up traversal
 * Semantic Hook per rule
 *   ↓ applies lambda term
 * Intermediate Meaning (SemanticValue)
 *   ↓ composition continues up
 * Root Meaning (CPL-Intent skeleton with possible holes)
 * ```
 *
 * Semantic hooks are registered by rule ID. Each hook is a function from
 * child meanings to parent meaning. Hooks can produce "holes" (unresolved
 * parts of meaning) when information is missing.
 *
 * ## CPL-Intent Skeleton
 *
 * The output is a CPL-Intent skeleton — a structured representation of
 * the edit intention with possible holes:
 *
 * ```
 * {
 *   action: 'change',
 *   target: EntityRef(layer, "drums"),
 *   axis: AxisRef("brightness"),
 *   direction: 'increase',
 *   degree: Hole<DegreeValue>,   // unresolved — needs clarification
 *   scope: SectionRef("chorus"),
 *   constraints: [Preserve("tempo")]
 * }
 * ```
 *
 * @module gofai/nl/semantics/compositional-hooks
 * @see gofai_goalA.md Step 133
 */

import type {
  SemanticType,
  EntitySubtype,
} from './representation';

// =============================================================================
// SEMANTIC VALUES — the meaning representations produced by hooks
// =============================================================================

/**
 * A semantic value: the result of composing meaning bottom-up.
 */
export type SemanticValue =
  | EntityValue
  | EventValue
  | DegreeValue
  | AxisValue
  | ScopeValue
  | ConstraintValue
  | ModifierValue
  | ListValue
  | HoleValue
  | LambdaValue
  | ApplicationValue;

/**
 * An entity reference in the semantic representation.
 */
export interface EntityValue {
  readonly kind: 'entity';
  /** Entity subtype */
  readonly subtype: EntitySubtype | null;
  /** Display name (from the parse) */
  readonly name: string;
  /** Resolved reference ID (null if unresolved) */
  readonly refId: string | null;
  /** Provenance: which parse span produced this */
  readonly span: SemanticSpan;
}

/**
 * An edit event (neo-Davidsonian).
 */
export interface EventValue {
  readonly kind: 'event';
  /** The event type (add, remove, change, etc.) */
  readonly eventType: string;
  /** Thematic roles filled so far */
  readonly roles: ReadonlyMap<string, SemanticValue>;
  /** The semantic action ID from the grammar rule */
  readonly actionId: string;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * A degree/scalar value.
 */
export interface DegreeValue {
  readonly kind: 'degree';
  /** Direction (increase, decrease, set, equative) */
  readonly direction: DegreeDirection;
  /** Intensity (0–1, if known) */
  readonly intensity: number | null;
  /** Level name (tiny, small, moderate, large, extreme) */
  readonly level: string | null;
  /** Explicit numeric value (if given) */
  readonly numericValue: number | null;
  /** Unit (if given, e.g., "dB", "%", "semitones") */
  readonly unit: string | null;
  /** Provenance */
  readonly span: SemanticSpan;
}

export type DegreeDirection =
  | 'increase'
  | 'decrease'
  | 'set'
  | 'equative'
  | 'maximum'
  | 'minimum';

/**
 * An axis reference.
 */
export interface AxisValue {
  readonly kind: 'axis';
  /** The axis name */
  readonly axisName: string;
  /** The axis ID (if resolved) */
  readonly axisId: string | null;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * A scope (where the edit applies).
 */
export interface ScopeValue {
  readonly kind: 'scope';
  /** The scope type */
  readonly scopeType: string;
  /** The scope target */
  readonly target: SemanticValue | null;
  /** Whether this is a global scope */
  readonly isGlobal: boolean;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * A constraint (preservation, restriction, etc.).
 */
export interface ConstraintValue {
  readonly kind: 'constraint';
  /** The constraint type */
  readonly constraintType: string;
  /** What is being constrained */
  readonly target: SemanticValue | null;
  /** The constraint value */
  readonly value: SemanticValue | null;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * A modifier (adverbial, degree modifier, etc.).
 */
export interface ModifierValue {
  readonly kind: 'modifier';
  /** What is being modified */
  readonly modified: SemanticValue | null;
  /** The modifier content */
  readonly content: SemanticValue;
  /** How the modifier combines */
  readonly combinationType: ModifierCombination;
  /** Provenance */
  readonly span: SemanticSpan;
}

export type ModifierCombination =
  | 'intersective'   // "loud drums" = loud ∩ drums
  | 'subsective'     // "good pianist" ≠ good ∩ pianist
  | 'degree'         // "very loud" = degree(loud)
  | 'manner'         // "quickly add" = manner(add)
  | 'restrictive';   // "only the chorus" = restrict(chorus)

/**
 * A list of semantic values.
 */
export interface ListValue {
  readonly kind: 'list';
  /** The elements */
  readonly elements: readonly SemanticValue[];
  /** How the list was formed (conjunction, enumeration, etc.) */
  readonly formation: ListFormation;
  /** Provenance */
  readonly span: SemanticSpan;
}

export type ListFormation =
  | 'conjunction'    // "X and Y"
  | 'disjunction'   // "X or Y"
  | 'enumeration'   // "X, Y, Z"
  | 'range';        // "X to Y"

/**
 * A hole: unresolved part of meaning.
 */
export interface HoleValue {
  readonly kind: 'hole';
  /** What type of value is expected */
  readonly expectedType: SemanticType;
  /** Why this is a hole */
  readonly reason: string;
  /** Default value (if any) */
  readonly defaultValue: SemanticValue | null;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * A lambda abstraction (unapplied semantic function).
 */
export interface LambdaValue {
  readonly kind: 'lambda';
  /** Parameter name */
  readonly param: string;
  /** Parameter type */
  readonly paramType: SemanticType;
  /** Body (may reference param) */
  readonly body: SemanticValue;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * Function application (semantic composition step).
 */
export interface ApplicationValue {
  readonly kind: 'application';
  /** The function being applied */
  readonly func: SemanticValue;
  /** The argument */
  readonly arg: SemanticValue;
  /** Provenance */
  readonly span: SemanticSpan;
}

/**
 * Provenance span for a semantic value.
 */
export interface SemanticSpan {
  readonly start: number;
  readonly end: number;
  readonly ruleId: string | null;
  readonly lexemeId: string | null;
}

// =============================================================================
// SEMANTIC HOOKS — the composition functions per grammar rule
// =============================================================================

/**
 * A semantic hook: a function that composes child meanings into parent meaning.
 */
export interface SemanticHook {
  /** The grammar rule ID this hook is attached to */
  readonly ruleId: string;

  /** Human-readable description */
  readonly description: string;

  /** The expected child types (for validation) */
  readonly childTypes: readonly SemanticType[];

  /** The result type */
  readonly resultType: SemanticType;

  /** The composition function */
  readonly compose: CompositionFunction;

  /** Priority (higher = preferred when multiple hooks match) */
  readonly priority: number;
}

/**
 * The composition function signature.
 * Takes child semantic values and the parse context, produces a result.
 */
export type CompositionFunction = (
  children: readonly SemanticValue[],
  context: CompositionContext,
) => SemanticValue;

/**
 * Context available to composition functions.
 */
export interface CompositionContext {
  /** The rule ID being applied */
  readonly ruleId: string;

  /** The span of the rule application */
  readonly span: SemanticSpan;

  /** The verb frame context (if within a verb phrase) */
  readonly verbFrame: VerbFrameContext | null;

  /** The current scope (if established) */
  readonly currentScope: ScopeValue | null;

  /** Active constraints */
  readonly activeConstraints: readonly ConstraintValue[];
}

/**
 * Verb frame context for composition.
 */
export interface VerbFrameContext {
  readonly verb: string;
  readonly category: string;
  readonly semanticAction: string;
}

// =============================================================================
// HOOK REGISTRY — managing semantic hooks
// =============================================================================

/**
 * Registry of semantic hooks indexed by rule ID.
 */
export class SemanticHookRegistry {
  private readonly hooks: Map<string, SemanticHook[]> = new Map();

  /**
   * Register a semantic hook for a grammar rule.
   */
  register(hook: SemanticHook): void {
    const existing = this.hooks.get(hook.ruleId) ?? [];
    existing.push(hook);
    // Sort by priority descending
    existing.sort((a, b) => b.priority - a.priority);
    this.hooks.set(hook.ruleId, existing);
  }

  /**
   * Register multiple hooks at once.
   */
  registerAll(hooks: readonly SemanticHook[]): void {
    for (const hook of hooks) {
      this.register(hook);
    }
  }

  /**
   * Get hooks for a rule ID (sorted by priority, descending).
   */
  getHooks(ruleId: string): readonly SemanticHook[] {
    return this.hooks.get(ruleId) ?? [];
  }

  /**
   * Get the best (highest priority) hook for a rule ID.
   */
  getBestHook(ruleId: string): SemanticHook | null {
    const hooks = this.hooks.get(ruleId);
    return hooks && hooks.length > 0 ? hooks[0]! : null;
  }

  /**
   * Check if a rule has any hooks.
   */
  hasHook(ruleId: string): boolean {
    return (this.hooks.get(ruleId)?.length ?? 0) > 0;
  }

  /**
   * Get all registered rule IDs.
   */
  ruleIds(): readonly string[] {
    return [...this.hooks.keys()];
  }

  /**
   * Get total number of hooks.
   */
  size(): number {
    let total = 0;
    for (const hooks of this.hooks.values()) {
      total += hooks.length;
    }
    return total;
  }

  /**
   * Clear all hooks.
   */
  clear(): void {
    this.hooks.clear();
  }
}

// =============================================================================
// COMPOSITION ENGINE — bottom-up meaning composition
// =============================================================================

/**
 * A parse node for composition (minimal interface).
 */
export interface CompositionNode {
  readonly type: 'or' | 'and' | 'leaf';
  readonly id: string;
  readonly span: { readonly start: number; readonly end: number };
  // AND-node
  readonly ruleId?: string;
  readonly children?: readonly CompositionNode[];
  readonly semanticAction?: string;
  // OR-node
  readonly alternatives?: readonly CompositionNode[];
  // Leaf
  readonly token?: { readonly text: string; readonly type: string };
}

/**
 * A lexical semantics function: maps tokens to semantic values.
 */
export type LexicalSemantics = (tokenText: string, tokenType: string) => SemanticValue | null;

/**
 * Result of composing meaning for a parse tree.
 */
export interface CompositionResult {
  /** The composed meaning (null if composition failed) */
  readonly value: SemanticValue | null;

  /** Whether composition succeeded */
  readonly success: boolean;

  /** Holes remaining in the meaning */
  readonly holes: readonly HoleValue[];

  /** Warnings generated during composition */
  readonly warnings: readonly CompositionWarning[];

  /** The composition steps taken */
  readonly steps: readonly CompositionStep[];
}

/**
 * A warning from composition.
 */
export interface CompositionWarning {
  readonly message: string;
  readonly nodeId: string;
  readonly severity: 'info' | 'warning';
}

/**
 * A single composition step (for debugging/provenance).
 */
export interface CompositionStep {
  readonly nodeId: string;
  readonly ruleId: string | null;
  readonly hookDescription: string;
  readonly childValues: readonly string[];
  readonly resultValue: string;
}

/**
 * Compose meaning bottom-up through a parse tree.
 */
export function compose(
  node: CompositionNode,
  registry: SemanticHookRegistry,
  lexicon: LexicalSemantics,
  context: CompositionContext,
): CompositionResult {
  const holes: HoleValue[] = [];
  const warnings: CompositionWarning[] = [];
  const steps: CompositionStep[] = [];

  const value = composeNode(node, registry, lexicon, context, holes, warnings, steps, 0);

  return {
    value,
    success: value !== null,
    holes,
    warnings,
    steps,
  };
}

const MAX_COMPOSITION_DEPTH = 100;

/**
 * Recursively compose meaning for a node.
 */
function composeNode(
  node: CompositionNode,
  registry: SemanticHookRegistry,
  lexicon: LexicalSemantics,
  context: CompositionContext,
  holes: HoleValue[],
  warnings: CompositionWarning[],
  steps: CompositionStep[],
  depth: number,
): SemanticValue | null {
  if (depth > MAX_COMPOSITION_DEPTH) {
    warnings.push({
      message: `Max composition depth ${MAX_COMPOSITION_DEPTH} exceeded`,
      nodeId: node.id,
      severity: 'warning',
    });
    return null;
  }

  switch (node.type) {
    case 'leaf':
      return composeLeaf(node, lexicon, steps);

    case 'and':
      return composeAnd(node, registry, lexicon, context, holes, warnings, steps, depth);

    case 'or':
      return composeOr(node, registry, lexicon, context, holes, warnings, steps, depth);
  }
}

/**
 * Compose a leaf node: look up lexical semantics.
 */
function composeLeaf(
  node: CompositionNode,
  lexicon: LexicalSemantics,
  steps: CompositionStep[],
): SemanticValue | null {
  const text = node.token?.text ?? '';
  const type = node.token?.type ?? 'unknown';
  const value = lexicon(text, type);

  steps.push({
    nodeId: node.id,
    ruleId: null,
    hookDescription: `Lexical: "${text}" (${type})`,
    childValues: [],
    resultValue: value ? formatValueBrief(value) : '<null>',
  });

  return value;
}

/**
 * Compose an AND node: apply the semantic hook for the rule.
 */
function composeAnd(
  node: CompositionNode,
  registry: SemanticHookRegistry,
  lexicon: LexicalSemantics,
  context: CompositionContext,
  holes: HoleValue[],
  warnings: CompositionWarning[],
  steps: CompositionStep[],
  depth: number,
): SemanticValue | null {
  const ruleId = node.ruleId ?? '';
  const children = node.children ?? [];

  // Compose children first (bottom-up)
  const childValues: SemanticValue[] = [];
  for (const child of children) {
    const childValue = composeNode(child, registry, lexicon, context, holes, warnings, steps, depth + 1);
    if (childValue) {
      childValues.push(childValue);
    }
  }

  // Find the semantic hook
  const hook = registry.getBestHook(ruleId);
  if (!hook) {
    // No hook — try default composition
    return defaultCompose(node, childValues, context, warnings, steps);
  }

  // Apply the hook
  const hookContext: CompositionContext = {
    ruleId,
    span: {
      start: node.span.start,
      end: node.span.end,
      ruleId,
      lexemeId: null,
    },
    verbFrame: context.verbFrame,
    currentScope: context.currentScope,
    activeConstraints: context.activeConstraints,
  };

  try {
    const result = hook.compose(childValues, hookContext);

    // Collect holes
    if (result.kind === 'hole') {
      holes.push(result);
    }

    steps.push({
      nodeId: node.id,
      ruleId,
      hookDescription: hook.description,
      childValues: childValues.map(formatValueBrief),
      resultValue: formatValueBrief(result),
    });

    return result;
  } catch (e) {
    warnings.push({
      message: `Hook error for rule ${ruleId}: ${e instanceof Error ? e.message : String(e)}`,
      nodeId: node.id,
      severity: 'warning',
    });
    return defaultCompose(node, childValues, context, warnings, steps);
  }
}

/**
 * Compose an OR node: pick the best alternative.
 */
function composeOr(
  node: CompositionNode,
  registry: SemanticHookRegistry,
  lexicon: LexicalSemantics,
  context: CompositionContext,
  holes: HoleValue[],
  warnings: CompositionWarning[],
  steps: CompositionStep[],
  depth: number,
): SemanticValue | null {
  const alternatives = node.alternatives ?? [];
  if (alternatives.length === 0) return null;

  // For now, compose the first alternative (highest priority)
  // Future: compose all and let disambiguation choose
  if (alternatives.length > 1) {
    warnings.push({
      message: `OR-node with ${alternatives.length} alternatives — using first (highest priority)`,
      nodeId: node.id,
      severity: 'info',
    });
  }

  return composeNode(alternatives[0]!, registry, lexicon, context, holes, warnings, steps, depth + 1);
}

/**
 * Default composition when no hook is registered.
 * Tries functional application (if one child is a lambda).
 */
function defaultCompose(
  node: CompositionNode,
  children: readonly SemanticValue[],
  _context: CompositionContext,
  warnings: CompositionWarning[],
  steps: CompositionStep[],
): SemanticValue | null {
  if (children.length === 0) return null;

  // Single child — pass through
  if (children.length === 1) {
    steps.push({
      nodeId: node.id,
      ruleId: node.ruleId ?? null,
      hookDescription: 'Default: pass-through (single child)',
      childValues: children.map(formatValueBrief),
      resultValue: formatValueBrief(children[0]!),
    });
    return children[0]!;
  }

  // Two children — try functional application
  if (children.length === 2) {
    const [first, second] = [children[0]!, children[1]!];

    // If first is a lambda, apply to second
    if (first.kind === 'lambda') {
      const result = applyLambda(first, second);
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: functional application (λ arg)',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }

    // If second is a lambda, apply to first
    if (second.kind === 'lambda') {
      const result = applyLambda(second, first);
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: functional application (arg λ)',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }

    // If one is an event and other is an entity, fill a role
    if (first.kind === 'event' && second.kind === 'entity') {
      const result = addRole(first, 'patient', second);
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: event + entity → fill patient role',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }

    if (first.kind === 'entity' && second.kind === 'event') {
      const result = addRole(second, 'patient', first);
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: entity + event → fill patient role',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }

    // If one is a modifier, apply it
    if (first.kind === 'modifier') {
      const result: ModifierValue = { ...first, modified: second };
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: modifier + value → modified value',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }

    if (second.kind === 'modifier') {
      const result: ModifierValue = { ...second, modified: first };
      steps.push({
        nodeId: node.id,
        ruleId: node.ruleId ?? null,
        hookDescription: 'Default: value + modifier → modified value',
        childValues: children.map(formatValueBrief),
        resultValue: formatValueBrief(result),
      });
      return result;
    }
  }

  // Fall back to list
  warnings.push({
    message: `No semantic hook and no default composition for ${children.length} children — creating list`,
    nodeId: node.id,
    severity: 'warning',
  });

  const list: ListValue = {
    kind: 'list',
    elements: children,
    formation: 'enumeration',
    span: {
      start: node.span.start,
      end: node.span.end,
      ruleId: node.ruleId ?? null,
      lexemeId: null,
    },
  };

  steps.push({
    nodeId: node.id,
    ruleId: node.ruleId ?? null,
    hookDescription: 'Default: fallback list',
    childValues: children.map(formatValueBrief),
    resultValue: formatValueBrief(list),
  });

  return list;
}

/**
 * Apply a lambda to an argument (beta reduction).
 */
function applyLambda(lambda: LambdaValue, arg: SemanticValue): SemanticValue {
  // For now, return an application node
  // Full beta reduction would substitute the parameter in the body
  return {
    kind: 'application',
    func: lambda,
    arg,
    span: {
      start: Math.min(lambda.span.start, arg.span.start),
      end: Math.max(lambda.span.end, arg.span.end),
      ruleId: null,
      lexemeId: null,
    },
  };
}

/**
 * Add a thematic role to an event.
 */
function addRole(event: EventValue, role: string, filler: SemanticValue): EventValue {
  const newRoles = new Map(event.roles);
  newRoles.set(role, filler);
  return {
    ...event,
    roles: newRoles,
  };
}

// =============================================================================
// BUILT-IN HOOKS — standard composition rules
// =============================================================================

/**
 * Create a hook for verb phrase composition: Verb + Object → Event.
 */
export function createVerbObjectHook(
  ruleId: string,
  verb: string,
  eventType: string,
): SemanticHook {
  return {
    ruleId,
    description: `Verb-Object: ${verb} + NP → Event(${eventType})`,
    childTypes: [
      { kind: 'function', from: { kind: 'entity', subtype: undefined }, to: { kind: 'event', eventCategory: undefined } },
      { kind: 'entity', subtype: undefined },
    ],
    resultType: { kind: 'event', eventCategory: undefined },
    compose: (children, ctx) => {
      const objSem = children[1];
      const roles = new Map<string, SemanticValue>();
      if (objSem) roles.set('patient', objSem);

      return {
        kind: 'event',
        eventType,
        roles,
        actionId: ctx.ruleId,
        span: ctx.span,
      };
    },
    priority: 10,
  };
}

/**
 * Create a hook for "make X Y" composition: Make + NP + Adj → Event.
 */
export function createMakePatternHook(ruleId: string): SemanticHook {
  return {
    ruleId,
    description: 'Make-Pattern: "make" + NP + Adj → Event(change)',
    childTypes: [
      { kind: 'function', from: { kind: 'entity', subtype: undefined }, to: { kind: 'event', eventCategory: 'change' } },
      { kind: 'entity', subtype: undefined },
      { kind: 'degree' },
    ],
    resultType: { kind: 'event', eventCategory: 'change' },
    compose: (children, ctx) => {
      const patient = children[1];
      const result = children[2];
      const roles = new Map<string, SemanticValue>();
      if (patient) roles.set('patient', patient);
      if (result) roles.set('result', result);

      return {
        kind: 'event',
        eventType: 'change',
        roles,
        actionId: ctx.ruleId,
        span: ctx.span,
      };
    },
    priority: 15,
  };
}

/**
 * Create a hook for prepositional phrase attachment: Event + PP → Event with location.
 */
export function createPPAttachmentHook(
  ruleId: string,
  preposition: string,
  role: string,
): SemanticHook {
  return {
    ruleId,
    description: `PP-Attachment: Event + "${preposition}" NP → Event with ${role}`,
    childTypes: [
      { kind: 'event', eventCategory: undefined },
      { kind: 'entity', subtype: undefined },
    ],
    resultType: { kind: 'event', eventCategory: undefined },
    compose: (children, ctx) => {
      const event = children[0];
      const ppObj = children[1];

      if (event?.kind === 'event' && ppObj) {
        return addRole(event, role, ppObj);
      }

      // Fallback
      return event ?? {
        kind: 'hole',
        expectedType: { kind: 'event', eventCategory: undefined },
        reason: 'PP attachment failed — no event to attach to',
        defaultValue: null,
        span: ctx.span,
      };
    },
    priority: 8,
  };
}

/**
 * Create a hook for degree modification: Adj + Degree → DegreeValue.
 */
export function createDegreeModHook(ruleId: string): SemanticHook {
  return {
    ruleId,
    description: 'Degree-Mod: DegreeWord + Adj → modified Degree',
    childTypes: [
      { kind: 'degree' },
      { kind: 'degree' },
    ],
    resultType: { kind: 'degree' },
    compose: (children, ctx) => {
      const modifier = children[0];
      const base = children[1];

      if (base?.kind === 'degree') {
        // Modify the base degree with the modifier
        const modifiedIntensity = modifier?.kind === 'degree' && modifier.intensity !== null
          ? Math.min(1, (base.intensity ?? 0.5) * (1 + modifier.intensity))
          : base.intensity;

        return {
          ...base,
          intensity: modifiedIntensity,
          span: ctx.span,
        };
      }

      return base ?? {
        kind: 'hole',
        expectedType: { kind: 'degree' },
        reason: 'Degree modification failed',
        defaultValue: null,
        span: ctx.span,
      };
    },
    priority: 5,
  };
}

/**
 * Create a hook for conjunction: X + "and" + Y → List.
 */
export function createConjunctionHook(ruleId: string): SemanticHook {
  return {
    ruleId,
    description: 'Conjunction: X + "and" + Y → List(conjunction)',
    childTypes: [],
    resultType: { kind: 'list', elementType: { kind: 'entity', subtype: undefined } },
    compose: (children, ctx) => {
      // Filter out the conjunction token itself
      const elements = children.filter(c => c.kind !== 'modifier' || c.content.kind !== 'hole');

      return {
        kind: 'list',
        elements,
        formation: 'conjunction',
        span: ctx.span,
      };
    },
    priority: 7,
  };
}

/**
 * Create a hook for constraint attachment: Event + Constraint → Event with constraint.
 */
export function createConstraintHook(ruleId: string): SemanticHook {
  return {
    ruleId,
    description: 'Constraint: Event + "keep/preserve" NP → Event with preservation',
    childTypes: [
      { kind: 'event', eventCategory: undefined },
      { kind: 'constraint' },
    ],
    resultType: { kind: 'event', eventCategory: undefined },
    compose: (children, ctx) => {
      const event = children[0];
      const constraint = children[1];

      if (event?.kind === 'event' && constraint?.kind === 'constraint') {
        const roles = new Map(event.roles);
        // Store constraint as a special role
        const existingConstraints = roles.get('constraints');
        if (existingConstraints?.kind === 'list') {
          roles.set('constraints', {
            ...existingConstraints,
            elements: [...existingConstraints.elements, constraint],
          });
        } else {
          roles.set('constraints', {
            kind: 'list',
            elements: [constraint],
            formation: 'conjunction',
            span: ctx.span,
          });
        }
        return { ...event, roles };
      }

      return event ?? {
        kind: 'hole',
        expectedType: { kind: 'event', eventCategory: undefined },
        reason: 'Constraint attachment failed',
        defaultValue: null,
        span: ctx.span,
      };
    },
    priority: 6,
  };
}

// =============================================================================
// VALUE FORMATTING — brief human-readable representations
// =============================================================================

/**
 * Format a semantic value as a brief string (for debugging/provenance).
 */
export function formatValueBrief(value: SemanticValue): string {
  switch (value.kind) {
    case 'entity':
      return value.subtype
        ? `Entity(${value.subtype}, "${value.name}")`
        : `Entity("${value.name}")`;
    case 'event':
      return `Event(${value.eventType}, roles=[${[...value.roles.keys()].join(',')}])`;
    case 'degree':
      return value.numericValue !== null
        ? `Degree(${value.direction}, ${value.numericValue}${value.unit ?? ''})`
        : `Degree(${value.direction}, ${value.level ?? 'moderate'})`;
    case 'axis':
      return `Axis(${value.axisName})`;
    case 'scope':
      return `Scope(${value.scopeType})`;
    case 'constraint':
      return `Constraint(${value.constraintType})`;
    case 'modifier':
      return `Modifier(${value.combinationType})`;
    case 'list':
      return `List(${value.formation}, ${value.elements.length} elems)`;
    case 'hole':
      return `Hole(${value.reason})`;
    case 'lambda':
      return `λ${value.param}.body`;
    case 'application':
      return `App(${formatValueBrief(value.func)}, ${formatValueBrief(value.arg)})`;
  }
}

/**
 * Format a full composition result as a report.
 */
export function formatCompositionReport(result: CompositionResult): string {
  const lines: string[] = [];

  lines.push(`Composition: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  if (result.value) {
    lines.push(`  Result: ${formatValueBrief(result.value)}`);
  }
  lines.push(`  Holes: ${result.holes.length}`);
  lines.push(`  Warnings: ${result.warnings.length}`);
  lines.push(`  Steps: ${result.steps.length}`);

  if (result.holes.length > 0) {
    lines.push('');
    lines.push('  Holes:');
    for (const hole of result.holes) {
      lines.push(`    - ${hole.reason}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('  Warnings:');
    for (const w of result.warnings) {
      lines.push(`    - [${w.severity}] ${w.message}`);
    }
  }

  if (result.steps.length > 0 && result.steps.length <= 20) {
    lines.push('');
    lines.push('  Steps:');
    for (const step of result.steps) {
      lines.push(`    ${step.nodeId}: ${step.hookDescription} → ${step.resultValue}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// SINGLETON
// =============================================================================

let _globalRegistry: SemanticHookRegistry | null = null;

/**
 * Get the global semantic hook registry (singleton).
 */
export function getSemanticHookRegistry(): SemanticHookRegistry {
  if (!_globalRegistry) {
    _globalRegistry = new SemanticHookRegistry();
  }
  return _globalRegistry;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the compositional hooks module.
 */
export function getCompositionalHooksStats(): {
  registeredHooks: number;
  rulesCovered: number;
  builtInHookFactories: number;
} {
  const registry = _globalRegistry;
  return {
    registeredHooks: registry?.size() ?? 0,
    rulesCovered: registry?.ruleIds().length ?? 0,
    builtInHookFactories: 6, // verb-object, make-pattern, pp-attachment, degree-mod, conjunction, constraint
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetCompositionalHooks(): void {
  _globalRegistry = null;
}
