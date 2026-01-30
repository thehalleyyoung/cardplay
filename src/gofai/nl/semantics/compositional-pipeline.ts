/**
 * GOFAI NL Semantics — Montague-Style Compositional Pipeline
 *
 * Implements a typed compositional semantics where parse rules attach
 * lambda terms that assemble into CPL-Intent skeletons. This provides:
 *
 * 1. **Type-driven composition**: Each syntactic node has a semantic type.
 *    Composition applies function types to argument types, catching type
 *    errors at composition time.
 *
 * 2. **Lambda terms**: Semantic values are lambda expressions that can be
 *    partially applied, enabling modular semantics for modifiers, scoping,
 *    and underspecification.
 *
 * 3. **CPL skeleton output**: The composition pipeline produces CPL-Intent
 *    skeletons (CPL nodes with holes) that can be further resolved by
 *    pragmatic and typechecking phases.
 *
 * ## Type System
 *
 * ```
 * SemanticType ::= e           — entity (track, section, card)
 *                | t           — truth value (boolean)
 *                | a           — axis value (perceptual axis)
 *                | d           — degree (scalar modifier)
 *                | s           — scope (time/entity range)
 *                | g           — goal (CPL goal node)
 *                | c           — constraint (CPL constraint node)
 *                | i           — intent (CPL intent node)
 *                | <A, B>      — function from A to B
 *                | <A, B, C>   — curried function A → B → C
 *                | ?           — underspecified (hole)
 * ```
 *
 * ## Example
 *
 * ```
 * "make the bass brighter"
 *
 * "make"     : <e, <a, g>>          — takes entity and axis, produces goal
 * "the bass" : e                     — entity
 * "brighter" : <a, d>               — takes axis context, produces degree on axis
 *
 * Composition:
 *   "make the bass" = apply("make", "the bass") : <a, g>
 *   "make the bass brighter" = apply("make the bass", "brighter") : g
 *
 * Result: Goal { axis: brightness, direction: increase, scope: { entities: bass } }
 * ```
 *
 * @module gofai/nl/semantics/compositional-pipeline
 * @see gofai_goalA.md Step 156
 */

import type {
  CPLGoal,
  CPLConstraint,
  CPLPreference,
  CPLScope,
  CPLHole,
} from '../../canon/cpl-types';


// =============================================================================
// Semantic Types
// =============================================================================

/**
 * Atomic semantic type.
 */
export type AtomicSemanticType =
  | 'e'   // entity
  | 't'   // truth value
  | 'a'   // axis
  | 'd'   // degree
  | 's'   // scope
  | 'g'   // goal
  | 'c'   // constraint
  | 'p'   // preference
  | 'i'   // intent
  | 'v'   // event/verb
  | 'n'   // number
  | '?';  // underspecified (hole)

/**
 * Semantic type: atomic or function type.
 */
export type SemanticType =
  | AtomicSemanticType
  | FunctionSemanticType;

/**
 * Function semantic type: from → to.
 */
export interface FunctionSemanticType {
  readonly kind: 'function';
  readonly from: SemanticType;
  readonly to: SemanticType;
}

/**
 * Create a function type.
 */
export function fnType(from: SemanticType, to: SemanticType): FunctionSemanticType {
  return { kind: 'function', from, to };
}

/**
 * Create a curried 2-arg function type: A → B → C.
 */
export function fnType2(a: SemanticType, b: SemanticType, c: SemanticType): FunctionSemanticType {
  return fnType(a, fnType(b, c));
}

/**
 * Create a curried 3-arg function type: A → B → C → D.
 */
export function fnType3(
  a: SemanticType,
  b: SemanticType,
  c: SemanticType,
  d: SemanticType
): FunctionSemanticType {
  return fnType(a, fnType2(b, c, d));
}

/**
 * Check if a type is a function type.
 */
export function isFunctionType(t: SemanticType): t is FunctionSemanticType {
  return typeof t === 'object' && t !== null && 'kind' in t && t.kind === 'function';
}

/**
 * Check if two semantic types are compatible.
 *
 * The '?' type is compatible with anything (wildcard).
 */
export function typesCompatible(a: SemanticType, b: SemanticType): boolean {
  if (a === '?' || b === '?') return true;

  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }

  if (isFunctionType(a) && isFunctionType(b)) {
    return typesCompatible(a.from, b.from) && typesCompatible(a.to, b.to);
  }

  return false;
}

/**
 * Format a semantic type for display.
 */
export function formatSemanticType(t: SemanticType): string {
  if (typeof t === 'string') return t;
  if (isFunctionType(t)) {
    const from = formatSemanticType(t.from);
    const to = formatSemanticType(t.to);
    return `<${from}, ${to}>`;
  }
  return '?';
}


// =============================================================================
// Lambda Terms
// =============================================================================

/**
 * A lambda term: the semantic value attached to a parse node.
 */
export type LambdaTerm =
  | LambdaVar
  | LambdaConst
  | LambdaAbs
  | LambdaApp
  | LambdaCPLNode
  | LambdaHole
  | LambdaConjunction
  | LambdaModifier;

/**
 * Variable reference.
 */
export interface LambdaVar {
  readonly kind: 'var';
  readonly name: string;
  readonly type: SemanticType;
}

/**
 * Constant (lexical semantic value).
 */
export interface LambdaConst {
  readonly kind: 'const';
  readonly name: string;
  readonly value: unknown;
  readonly type: SemanticType;
  readonly lexemeId: string;
}

/**
 * Lambda abstraction: λx:T. body
 */
export interface LambdaAbs {
  readonly kind: 'abs';
  readonly param: string;
  readonly paramType: SemanticType;
  readonly body: LambdaTerm;
  readonly type: FunctionSemanticType;
}

/**
 * Function application: f(arg)
 */
export interface LambdaApp {
  readonly kind: 'app';
  readonly func: LambdaTerm;
  readonly arg: LambdaTerm;
  readonly type: SemanticType;
}

/**
 * CPL node (intermediate result of composition).
 */
export interface LambdaCPLNode {
  readonly kind: 'cpl-node';
  readonly nodeType: 'goal' | 'constraint' | 'preference' | 'scope' | 'amount' | 'hole';
  readonly fields: Readonly<Record<string, LambdaTerm | string | number | boolean>>;
  readonly type: SemanticType;
}

/**
 * Semantic hole (unresolved).
 */
export interface LambdaHole {
  readonly kind: 'hole';
  readonly holeId: string;
  readonly expectedType: SemanticType;
  readonly reason: string;
  readonly type: SemanticType;
}

/**
 * Conjunction of lambda terms (for "and"/"or").
 */
export interface LambdaConjunction {
  readonly kind: 'conjunction';
  readonly junction: 'and' | 'or' | 'but';
  readonly terms: readonly LambdaTerm[];
  readonly type: SemanticType;
}

/**
 * Modifier application (adjective/adverb modifying a head).
 */
export interface LambdaModifier {
  readonly kind: 'modifier';
  readonly modifier: LambdaTerm;
  readonly head: LambdaTerm;
  readonly modifierPosition: 'pre' | 'post';
  readonly type: SemanticType;
}


// =============================================================================
// Composition Rules
// =============================================================================

/**
 * A semantic composition rule.
 *
 * Maps a syntactic rule to a semantic combination strategy.
 */
export interface CompositionRule {
  /** Rule ID */
  readonly id: string;

  /** Syntactic rule this attaches to */
  readonly syntacticRuleId: string;

  /** Composition strategy */
  readonly strategy: CompositionStrategy;

  /** Expected type of the left child */
  readonly leftType: SemanticType;

  /** Expected type of the right child */
  readonly rightType: SemanticType;

  /** Result type */
  readonly resultType: SemanticType;

  /** Human-readable description */
  readonly description: string;
}

/**
 * How to compose two semantic values.
 */
export type CompositionStrategy =
  | 'forward-application'    // f(x) where left is function
  | 'backward-application'   // f(x) where right is function
  | 'predicate-modification' // λx. P(x) ∧ Q(x) for intersective adjectives
  | 'quantifier-raising'     // Type-shift for scope ambiguity
  | 'type-shifting'          // Flexible types via coercion
  | 'coordination'           // AND/OR/BUT conjunction
  | 'modifier-attachment'    // Adjective/adverb attachment
  | 'scope-restriction'      // "in the chorus" restricting scope
  | 'identity'               // Pass-through (e.g., parenthetical)
  | 'lexical-insertion';     // Leaf node — insert lexical semantics

/**
 * Built-in composition rules for the GOFAI grammar.
 */
export const COMPOSITION_RULES: readonly CompositionRule[] = [
  // VP → V NP (e.g., "make [the bass]")
  {
    id: 'CR001',
    syntacticRuleId: 'vp-v-np',
    strategy: 'forward-application',
    leftType: fnType('e', 'g'),
    rightType: 'e',
    resultType: 'g',
    description: 'Apply verb to entity argument → goal',
  },

  // VP → V AP (e.g., "make [brighter]")
  {
    id: 'CR002',
    syntacticRuleId: 'vp-v-ap',
    strategy: 'forward-application',
    leftType: fnType('a', 'g'),
    rightType: 'a',
    resultType: 'g',
    description: 'Apply verb to axis argument → goal',
  },

  // VP → V NP AP (e.g., "make [the bass] [brighter]")
  {
    id: 'CR003',
    syntacticRuleId: 'vp-v-np-ap',
    strategy: 'forward-application',
    leftType: fnType2('e', 'a', 'g'),
    rightType: 'e',
    resultType: fnType('a', 'g'),
    description: 'Apply verb to entity → partially applied goal',
  },

  // NP → Det N (e.g., "the bass")
  {
    id: 'CR010',
    syntacticRuleId: 'np-det-n',
    strategy: 'forward-application',
    leftType: fnType('e', 'e'),
    rightType: 'e',
    resultType: 'e',
    description: 'Apply determiner to noun → entity',
  },

  // AP → Deg A (e.g., "much brighter")
  {
    id: 'CR020',
    syntacticRuleId: 'ap-deg-a',
    strategy: 'modifier-attachment',
    leftType: 'd',
    rightType: 'a',
    resultType: 'a',
    description: 'Degree modifier on adjective → modified axis',
  },

  // AP → A (e.g., "brighter")
  {
    id: 'CR021',
    syntacticRuleId: 'ap-a',
    strategy: 'identity',
    leftType: 'a',
    rightType: '?',
    resultType: 'a',
    description: 'Bare adjective → axis change',
  },

  // PP → P NP (e.g., "in the chorus")
  {
    id: 'CR030',
    syntacticRuleId: 'pp-p-np',
    strategy: 'forward-application',
    leftType: fnType('e', 's'),
    rightType: 'e',
    resultType: 's',
    description: 'Preposition applied to entity → scope',
  },

  // VP → VP PP (e.g., "make brighter [in the chorus]")
  {
    id: 'CR031',
    syntacticRuleId: 'vp-vp-pp',
    strategy: 'scope-restriction',
    leftType: 'g',
    rightType: 's',
    resultType: 'g',
    description: 'Scope PP restricts goal → scoped goal',
  },

  // S → VP Conj VP (e.g., "make louder and brighter")
  {
    id: 'CR040',
    syntacticRuleId: 's-vp-conj-vp',
    strategy: 'coordination',
    leftType: 'g',
    rightType: 'g',
    resultType: 'g',
    description: 'Coordinate two goals → conjunction of goals',
  },

  // VP → VP AdvP (e.g., "raise it [gently]")
  {
    id: 'CR050',
    syntacticRuleId: 'vp-vp-advp',
    strategy: 'modifier-attachment',
    leftType: 'g',
    rightType: 'p',
    resultType: 'g',
    description: 'Adverb modifies goal → goal with preference',
  },

  // NP → NP PP (e.g., "the reverb [on the vocals]")
  {
    id: 'CR060',
    syntacticRuleId: 'np-np-pp',
    strategy: 'predicate-modification',
    leftType: 'e',
    rightType: 's',
    resultType: 'e',
    description: 'PP restricts entity → scoped entity',
  },

  // VP → "keep" NP AP (e.g., "keep the melody the same")
  {
    id: 'CR070',
    syntacticRuleId: 'vp-keep-np-ap',
    strategy: 'forward-application',
    leftType: fnType2('e', 'a', 'c'),
    rightType: 'e',
    resultType: fnType('a', 'c'),
    description: 'Keep verb produces constraint',
  },

  // NumP → Num Unit (e.g., "3 dB")
  {
    id: 'CR080',
    syntacticRuleId: 'nump-num-unit',
    strategy: 'forward-application',
    leftType: 'n',
    rightType: fnType('n', 'd'),
    resultType: 'd',
    description: 'Number with unit → degree',
  },
];


// =============================================================================
// Composition Engine
// =============================================================================

/**
 * Result of composing two lambda terms.
 */
export interface CompositionResult {
  /** The resulting term */
  readonly term: LambdaTerm;

  /** The rule that was applied */
  readonly ruleId: string;

  /** Strategy used */
  readonly strategy: CompositionStrategy;

  /** Was type shifting needed? */
  readonly typeShifted: boolean;

  /** Composition warnings */
  readonly warnings: readonly string[];
}

/**
 * Compose two lambda terms using a composition rule.
 */
export function compose(
  left: LambdaTerm,
  right: LambdaTerm,
  rule: CompositionRule
): CompositionResult | null {
  const warnings: string[] = [];

  switch (rule.strategy) {
    case 'forward-application':
      return forwardApplication(left, right, rule, warnings);

    case 'backward-application':
      return backwardApplication(left, right, rule, warnings);

    case 'predicate-modification':
      return predicateModification(left, right, rule, warnings);

    case 'coordination':
      return coordination(left, right, rule, warnings);

    case 'modifier-attachment':
      return modifierAttachment(left, right, rule, warnings);

    case 'scope-restriction':
      return scopeRestriction(left, right, rule, warnings);

    case 'identity':
      return {
        term: left,
        ruleId: rule.id,
        strategy: 'identity',
        typeShifted: false,
        warnings,
      };

    case 'lexical-insertion':
      return {
        term: left,
        ruleId: rule.id,
        strategy: 'lexical-insertion',
        typeShifted: false,
        warnings,
      };

    default:
      return null;
  }
}

/**
 * Forward application: f(x) where left is the function.
 */
function forwardApplication(
  func: LambdaTerm,
  arg: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  const funcType = getTermType(func);
  if (!isFunctionType(funcType)) {
    warnings.push(`Forward application requires function type, got ${formatSemanticType(funcType)}`);
    return null;
  }

  if (!typesCompatible(funcType.from, getTermType(arg))) {
    warnings.push(
      `Type mismatch: function expects ${formatSemanticType(funcType.from)} ` +
      `but argument has type ${formatSemanticType(getTermType(arg))}`
    );
    return null;
  }

  const result: LambdaApp = {
    kind: 'app',
    func,
    arg,
    type: funcType.to,
  };

  return {
    term: result,
    ruleId: rule.id,
    strategy: 'forward-application',
    typeShifted: false,
    warnings,
  };
}

/**
 * Backward application: f(x) where right is the function.
 */
function backwardApplication(
  arg: LambdaTerm,
  func: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  return forwardApplication(func, arg, rule, warnings);
}

/**
 * Predicate modification: λx. P(x) ∧ Q(x).
 */
function predicateModification(
  left: LambdaTerm,
  right: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  const result: LambdaConjunction = {
    kind: 'conjunction',
    junction: 'and',
    terms: [left, right],
    type: getTermType(left), // Both have same type
  };

  return {
    term: result,
    ruleId: rule.id,
    strategy: 'predicate-modification',
    typeShifted: false,
    warnings,
  };
}

/**
 * Coordination: conj(P, Q).
 */
function coordination(
  left: LambdaTerm,
  right: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  const result: LambdaConjunction = {
    kind: 'conjunction',
    junction: 'and',
    terms: [left, right],
    type: getTermType(left),
  };

  return {
    term: result,
    ruleId: rule.id,
    strategy: 'coordination',
    typeShifted: false,
    warnings,
  };
}

/**
 * Modifier attachment: modifier modifies head.
 */
function modifierAttachment(
  modifier: LambdaTerm,
  head: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  const result: LambdaModifier = {
    kind: 'modifier',
    modifier,
    head,
    modifierPosition: 'pre',
    type: getTermType(head),
  };

  return {
    term: result,
    ruleId: rule.id,
    strategy: 'modifier-attachment',
    typeShifted: false,
    warnings,
  };
}

/**
 * Scope restriction: PP restricts a goal's scope.
 */
function scopeRestriction(
  goal: LambdaTerm,
  scope: LambdaTerm,
  rule: CompositionRule,
  warnings: string[]
): CompositionResult | null {
  // Wrap the goal with the scope
  if (goal.kind === 'cpl-node' && goal.nodeType === 'goal') {
    const restricted: LambdaCPLNode = {
      ...goal,
      fields: {
        ...goal.fields,
        scope,
      },
    };

    return {
      term: restricted,
      ruleId: rule.id,
      strategy: 'scope-restriction',
      typeShifted: false,
      warnings,
    };
  }

  // Generic: application
  return forwardApplication(
    {
      kind: 'abs',
      param: 's',
      paramType: 's',
      body: goal,
      type: fnType('s', getTermType(goal)),
    },
    scope,
    rule,
    warnings
  );
}


// =============================================================================
// Lambda Term Utilities
// =============================================================================

/**
 * Get the semantic type of a lambda term.
 */
export function getTermType(term: LambdaTerm): SemanticType {
  return term.type;
}

/**
 * Perform beta-reduction on a lambda term (one step).
 *
 * (λx. body)(arg) → body[x := arg]
 */
export function betaReduce(term: LambdaTerm): LambdaTerm {
  if (term.kind !== 'app') return term;

  const func = term.func;
  if (func.kind !== 'abs') return term;

  // Substitute arg for param in body
  return substitute(func.body, func.param, term.arg);
}

/**
 * Substitute a term for a variable in another term.
 */
function substitute(body: LambdaTerm, varName: string, replacement: LambdaTerm): LambdaTerm {
  switch (body.kind) {
    case 'var':
      return body.name === varName ? replacement : body;

    case 'const':
      return body;

    case 'abs':
      if (body.param === varName) return body; // Bound variable, no substitution
      return {
        ...body,
        body: substitute(body.body, varName, replacement),
      };

    case 'app':
      return {
        ...body,
        func: substitute(body.func, varName, replacement),
        arg: substitute(body.arg, varName, replacement),
      };

    case 'cpl-node': {
      const newFields: Record<string, LambdaTerm | string | number | boolean> = {};
      for (const [key, val] of Object.entries(body.fields)) {
        if (typeof val === 'object' && val !== null && 'kind' in val) {
          newFields[key] = substitute(val as LambdaTerm, varName, replacement);
        } else {
          newFields[key] = val;
        }
      }
      return { ...body, fields: newFields };
    }

    case 'hole':
      return body;

    case 'conjunction':
      return {
        ...body,
        terms: body.terms.map(t => substitute(t, varName, replacement)),
      };

    case 'modifier':
      return {
        ...body,
        modifier: substitute(body.modifier, varName, replacement),
        head: substitute(body.head, varName, replacement),
      };

    default:
      return body;
  }
}

/**
 * Collect all free variables in a lambda term.
 */
export function freeVars(term: LambdaTerm): ReadonlySet<string> {
  const vars = new Set<string>();

  function collect(t: LambdaTerm, bound: Set<string>): void {
    switch (t.kind) {
      case 'var':
        if (!bound.has(t.name)) vars.add(t.name);
        break;
      case 'const':
        break;
      case 'abs': {
        const newBound = new Set(bound);
        newBound.add(t.param);
        collect(t.body, newBound);
        break;
      }
      case 'app':
        collect(t.func, bound);
        collect(t.arg, bound);
        break;
      case 'cpl-node':
        for (const val of Object.values(t.fields)) {
          if (typeof val === 'object' && val !== null && 'kind' in val) {
            collect(val as LambdaTerm, bound);
          }
        }
        break;
      case 'hole':
        break;
      case 'conjunction':
        for (const sub of t.terms) collect(sub, bound);
        break;
      case 'modifier':
        collect(t.modifier, bound);
        collect(t.head, bound);
        break;
    }
  }

  collect(term, new Set());
  return vars;
}


// =============================================================================
// CPL Extraction
// =============================================================================

/**
 * Extract CPL-Intent components from a composed lambda term.
 */
export interface CPLExtractionResult {
  readonly goals: readonly CPLGoal[];
  readonly constraints: readonly CPLConstraint[];
  readonly preferences: readonly CPLPreference[];
  readonly scope: CPLScope | null;
  readonly holes: readonly CPLHole[];
  readonly warnings: readonly string[];
}

/**
 * ID counter for CPL extraction.
 */
let extractionIdCounter = 0;

/**
 * Reset the extraction ID counter (for testing).
 */
export function resetExtractionIdCounter(): void {
  extractionIdCounter = 0;
}

function nextExtractionId(): string {
  return `comp-${++extractionIdCounter}`;
}

/**
 * Extract CPL components from a fully composed lambda term.
 */
export function extractCPL(term: LambdaTerm): CPLExtractionResult {
  const goals: CPLGoal[] = [];
  const constraints: CPLConstraint[] = [];
  const preferences: CPLPreference[] = [];
  const holes: CPLHole[] = [];
  const warnings: string[] = [];
  let scope: CPLScope | null = null;

  function visit(t: LambdaTerm): void {
    switch (t.kind) {
      case 'cpl-node':
        switch (t.nodeType) {
          case 'goal':
            goals.push(cplNodeToGoal(t));
            break;
          case 'constraint':
            constraints.push(cplNodeToConstraint(t));
            break;
          case 'preference':
            preferences.push(cplNodeToPreference(t));
            break;
          case 'scope':
            scope = cplNodeToScope(t);
            break;
          case 'hole':
            holes.push(cplNodeToHole(t));
            break;
        }
        // Recurse into fields
        for (const val of Object.values(t.fields)) {
          if (typeof val === 'object' && val !== null && 'kind' in val) {
            visit(val as LambdaTerm);
          }
        }
        break;

      case 'conjunction':
        for (const sub of t.terms) visit(sub);
        break;

      case 'modifier':
        visit(t.modifier);
        visit(t.head);
        break;

      case 'app':
        // Try to beta-reduce first
        const reduced = betaReduce(t);
        if (reduced !== t) {
          visit(reduced);
        } else {
          visit(t.func);
          visit(t.arg);
        }
        break;

      case 'abs':
        // Unapplied abstraction — might be a hole
        if (freeVars(t.body).size === 0) {
          visit(t.body);
        } else {
          warnings.push(`Unapplied lambda abstraction: λ${t.param}. ...`);
        }
        break;

      case 'hole':
        holes.push({
          type: 'hole',
          id: t.holeId,
          holeKind: 'unknown-term',
          priority: 'medium',
          question: t.reason,
        });
        break;

      case 'var':
        warnings.push(`Unbound variable: ${t.name}`);
        break;

      case 'const':
        // Constants at top level are typically entity references
        break;
    }
  }

  visit(term);

  return { goals, constraints, preferences, scope, holes, warnings };
}

/**
 * Convert a CPL-node lambda term to a CPLGoal.
 */
function cplNodeToGoal(node: LambdaCPLNode): CPLGoal {
  const base: CPLGoal = {
    type: 'goal',
    id: nextExtractionId(),
    variant: (node.fields.variant as string as CPLGoal['variant']) ?? 'axis-goal',
  };
  if (node.fields.axis && node.fields.direction) {
    return Object.assign(base, {
      axis: node.fields.axis as string,
      direction: node.fields.direction as CPLGoal['direction'],
    });
  }
  if (node.fields.axis) {
    return Object.assign(base, { axis: node.fields.axis as string });
  }
  if (node.fields.direction) {
    return Object.assign(base, { direction: node.fields.direction as CPLGoal['direction'] });
  }
  return base;
}

/**
 * Convert a CPL-node lambda term to a CPLConstraint.
 */
function cplNodeToConstraint(node: LambdaCPLNode): CPLConstraint {
  return {
    type: 'constraint',
    id: nextExtractionId(),
    variant: (node.fields.variant as string as CPLConstraint['variant']) ?? 'preserve',
    strength: (node.fields.strength as string as CPLConstraint['strength']) ?? 'hard',
    description: (node.fields.description as string) ?? 'compositional constraint',
  };
}

/**
 * Convert a CPL-node lambda term to a CPLPreference.
 */
function cplNodeToPreference(node: LambdaCPLNode): CPLPreference {
  return {
    type: 'preference',
    id: nextExtractionId(),
    category: (node.fields.category as string as CPLPreference['category']) ?? 'edit-style',
    value: (node.fields.value as string | number | boolean) ?? '',
    weight: (node.fields.weight as number) ?? 0.5,
  };
}

/**
 * Convert a CPL-node lambda term to a CPLScope.
 */
function cplNodeToScope(_node: LambdaCPLNode): CPLScope {
  return {
    type: 'scope',
    id: nextExtractionId(),
  };
}

/**
 * Convert a CPL-node lambda term to a CPLHole.
 */
function cplNodeToHole(node: LambdaCPLNode): CPLHole {
  return {
    type: 'hole',
    id: nextExtractionId(),
    holeKind: (node.fields.holeKind as string as CPLHole['holeKind']) ?? 'unknown-term',
    priority: (node.fields.priority as string as CPLHole['priority']) ?? 'medium',
    question: (node.fields.question as string) ?? 'Unknown',
  };
}


// =============================================================================
// Lexical Semantics (Examples)
// =============================================================================

/**
 * A lexical semantic entry: associates a lexeme with a lambda term.
 */
export interface LexicalSemanticEntry {
  /** Lexeme ID */
  readonly lexemeId: string;

  /** Surface forms */
  readonly surfaceForms: readonly string[];

  /** Semantic type */
  readonly type: SemanticType;

  /** Lambda term factory (creates a fresh term per parse) */
  readonly createTerm: () => LambdaTerm;

  /** Description */
  readonly description: string;
}

/**
 * Example lexical semantic entries for core verbs.
 */
export const CORE_LEXICAL_SEMANTICS: readonly LexicalSemanticEntry[] = [
  {
    lexemeId: 'v:make',
    surfaceForms: ['make', 'making'],
    type: fnType2('e', 'a', 'g'),
    createTerm: () => ({
      kind: 'abs',
      param: 'x',
      paramType: 'e',
      body: {
        kind: 'abs',
        param: 'prop',
        paramType: 'a',
        body: {
          kind: 'cpl-node',
          nodeType: 'goal',
          fields: {
            variant: 'axis-goal',
            entity: { kind: 'var', name: 'x', type: 'e' },
            property: { kind: 'var', name: 'prop', type: 'a' },
          },
          type: 'g',
        },
        type: fnType('a', 'g'),
      },
      type: fnType2('e', 'a', 'g'),
    }),
    description: 'Causative verb: make entity have property',
  },

  {
    lexemeId: 'v:add',
    surfaceForms: ['add', 'adding'],
    type: fnType2('e', 'e', 'g'),
    createTerm: () => ({
      kind: 'abs',
      param: 'what',
      paramType: 'e',
      body: {
        kind: 'abs',
        param: 'where',
        paramType: 'e',
        body: {
          kind: 'cpl-node',
          nodeType: 'goal',
          fields: {
            variant: 'structural-goal',
            theme: { kind: 'var', name: 'what', type: 'e' },
            location: { kind: 'var', name: 'where', type: 'e' },
          },
          type: 'g',
        },
        type: fnType('e', 'g'),
      },
      type: fnType2('e', 'e', 'g'),
    }),
    description: 'Addition verb: add entity to location',
  },

  {
    lexemeId: 'v:remove',
    surfaceForms: ['remove', 'removing', 'delete', 'deleting'],
    type: fnType('e', 'g'),
    createTerm: () => ({
      kind: 'abs',
      param: 'target',
      paramType: 'e',
      body: {
        kind: 'cpl-node',
        nodeType: 'goal',
        fields: {
          variant: 'structural-goal',
          patient: { kind: 'var', name: 'target', type: 'e' },
          action: 'remove',
        },
        type: 'g',
      },
      type: fnType('e', 'g'),
    }),
    description: 'Removal verb: remove entity',
  },

  {
    lexemeId: 'v:keep',
    surfaceForms: ['keep', 'keeping', 'preserve', 'preserving'],
    type: fnType('e', 'c'),
    createTerm: () => ({
      kind: 'abs',
      param: 'target',
      paramType: 'e',
      body: {
        kind: 'cpl-node',
        nodeType: 'constraint',
        fields: {
          variant: 'preserve',
          strength: 'hard',
          target: { kind: 'var', name: 'target', type: 'e' },
          description: 'Preserve target unchanged',
        },
        type: 'c',
      },
      type: fnType('e', 'c'),
    }),
    description: 'Preservation verb: keep entity unchanged',
  },

  {
    lexemeId: 'v:raise',
    surfaceForms: ['raise', 'raising', 'increase', 'increasing', 'boost', 'boosting'],
    type: fnType('e', 'g'),
    createTerm: () => ({
      kind: 'abs',
      param: 'target',
      paramType: 'e',
      body: {
        kind: 'cpl-node',
        nodeType: 'goal',
        fields: {
          variant: 'axis-goal',
          patient: { kind: 'var', name: 'target', type: 'e' },
          direction: 'increase',
        },
        type: 'g',
      },
      type: fnType('e', 'g'),
    }),
    description: 'Increase verb: raise entity value',
  },

  {
    lexemeId: 'v:lower',
    surfaceForms: ['lower', 'lowering', 'decrease', 'decreasing', 'reduce', 'reducing'],
    type: fnType('e', 'g'),
    createTerm: () => ({
      kind: 'abs',
      param: 'target',
      paramType: 'e',
      body: {
        kind: 'cpl-node',
        nodeType: 'goal',
        fields: {
          variant: 'axis-goal',
          patient: { kind: 'var', name: 'target', type: 'e' },
          direction: 'decrease',
        },
        type: 'g',
      },
      type: fnType('e', 'g'),
    }),
    description: 'Decrease verb: lower entity value',
  },
];


// =============================================================================
// Formatting
// =============================================================================

/**
 * Format a lambda term for display.
 */
export function formatLambdaTerm(term: LambdaTerm, indent = 0): string {
  const sp = ' '.repeat(indent);

  switch (term.kind) {
    case 'var':
      return `${sp}${term.name}:${formatSemanticType(term.type)}`;

    case 'const':
      return `${sp}${term.name}:${formatSemanticType(term.type)}`;

    case 'abs':
      return `${sp}λ${term.param}:${formatSemanticType(term.paramType)}.\n${formatLambdaTerm(term.body, indent + 2)}`;

    case 'app':
      return `${sp}apply(\n${formatLambdaTerm(term.func, indent + 2)},\n${formatLambdaTerm(term.arg, indent + 2)}\n${sp})`;

    case 'cpl-node':
      return `${sp}CPL[${term.nodeType}]:${formatSemanticType(term.type)}`;

    case 'hole':
      return `${sp}?${term.holeId}:${formatSemanticType(term.expectedType)}`;

    case 'conjunction':
      return `${sp}${term.junction}(\n${term.terms.map(t => formatLambdaTerm(t, indent + 2)).join(',\n')}\n${sp})`;

    case 'modifier':
      return `${sp}mod(\n${formatLambdaTerm(term.modifier, indent + 2)},\n${formatLambdaTerm(term.head, indent + 2)}\n${sp})`;
  }
}

/**
 * Format a composition rule for display.
 */
export function formatCompositionRule(rule: CompositionRule): string {
  return `[${rule.id}] ${rule.strategy}: ` +
    `${formatSemanticType(rule.leftType)} × ${formatSemanticType(rule.rightType)} → ` +
    `${formatSemanticType(rule.resultType)} (${rule.description})`;
}

/**
 * Compute statistics on the composition rule set.
 */
export function computeCompositionStats(): {
  readonly totalRules: number;
  readonly byStrategy: Readonly<Record<string, number>>;
  readonly resultTypes: readonly string[];
} {
  const byStrategy: Record<string, number> = {};
  const resultTypes = new Set<string>();

  for (const rule of COMPOSITION_RULES) {
    byStrategy[rule.strategy] = (byStrategy[rule.strategy] ?? 0) + 1;
    resultTypes.add(formatSemanticType(rule.resultType));
  }

  return {
    totalRules: COMPOSITION_RULES.length,
    byStrategy,
    resultTypes: [...resultTypes],
  };
}
