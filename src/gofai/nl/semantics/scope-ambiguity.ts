/**
 * GOFAI NL Semantics — Scope Ambiguity (MRS-style)
 *
 * Implements Minimal Recursion Semantics (MRS) inspired scope
 * underspecification for handling ambiguities between quantifiers,
 * negation, and operators like "only".
 *
 * ## Why MRS-style Underspecification?
 *
 * Consider: "Don't remove any reverb from all choruses"
 *
 * This has multiple readings:
 * (a) ¬∃x. reverb(x) ∧ ∀y. chorus(y) → remove(x, y)
 *     "There is no reverb you should remove from all choruses"
 * (b) ∀y. chorus(y) → ¬∃x. reverb(x) ∧ remove(x, y)
 *     "For each chorus, don't remove any reverb"
 *
 * Instead of committing to one reading, MRS preserves all valid
 * scope orderings as constraints, resolving only when necessary
 * (or triggering clarification).
 *
 * ## MRS Architecture
 *
 * An MRS has:
 * 1. **Elementary Predications (EPs)**: individual predicate-argument
 *    structures, each with a label (handle).
 * 2. **Handle constraints**: partial ordering on labels (qeq = equality
 *    modulo quantifiers).
 * 3. **Top handle**: the handle of the overall expression.
 *
 * The set of fully-scoped readings is computed by enumerating all
 * handle assignments consistent with the constraints.
 *
 * @module gofai/nl/semantics/scope-ambiguity
 * @see gofai_goalA.md Step 138
 */

// =============================================================================
// MRS TYPES — Minimal Recursion Semantics structures
// =============================================================================

/**
 * A Minimal Recursion Semantics structure.
 */
export interface MRS {
  /** The top handle (root of the scoped expression) */
  readonly topHandle: Handle;

  /** The index (event/state variable of the main predication) */
  readonly index: MRSVariable;

  /** Elementary predications */
  readonly eps: readonly ElementaryPredication[];

  /** Handle constraints (qeq = equality modulo quantifiers) */
  readonly constraints: readonly HandleConstraint[];

  /** Provenance */
  readonly source: string;
}

/**
 * A handle (label) in MRS — an abstract scope position.
 */
export interface Handle {
  readonly id: string;
}

/**
 * An MRS variable.
 */
export interface MRSVariable {
  readonly id: string;
  readonly type: MRSVariableType;
  readonly properties: ReadonlyMap<string, string>;
}

export type MRSVariableType =
  | 'event'       // e — edit event
  | 'referent'    // x — entity referent
  | 'handle'      // h — scope handle
  | 'degree'      // d — degree value
  | 'individual'; // i — underspecified entity or event

/**
 * An elementary predication (EP): a single predicate-argument structure.
 */
export interface ElementaryPredication {
  /** The label (handle) of this EP */
  readonly label: Handle;

  /** The predicate name */
  readonly predicate: string;

  /** The arguments */
  readonly arguments: ReadonlyMap<string, MRSArgument>;

  /** Whether this EP is from a quantifier */
  readonly isQuantifier: boolean;

  /** The characteristic variable (the variable this EP introduces) */
  readonly carg: string | null;

  /** Provenance: span in source */
  readonly span: MRSSpan;
}

/**
 * An argument in an EP.
 */
export type MRSArgument =
  | VariableArgument
  | HandleArgument
  | ConstantArgument;

/**
 * A variable argument.
 */
export interface VariableArgument {
  readonly kind: 'variable';
  readonly variable: MRSVariable;
}

/**
 * A handle argument (for scope).
 */
export interface HandleArgument {
  readonly kind: 'handle';
  readonly handle: Handle;
}

/**
 * A constant argument (string/number literal).
 */
export interface ConstantArgument {
  readonly kind: 'constant';
  readonly value: string;
}

/**
 * A handle constraint.
 * "h1 =q h2" means h1 is equal to h2 modulo quantifier insertion.
 */
export interface HandleConstraint {
  /** The higher handle */
  readonly high: Handle;

  /** The lower handle */
  readonly low: Handle;

  /** The constraint type */
  readonly type: ConstraintRelation;
}

export type ConstraintRelation =
  | 'qeq'     // Quantifier equality (standard MRS)
  | 'outscopes' // h1 outscopes h2 (h1 is above h2)
  | 'equals';   // Exact handle identity

/**
 * Span information.
 */
export interface MRSSpan {
  readonly start: number;
  readonly end: number;
}

// =============================================================================
// MRS CONSTRUCTION — building MRS from semantic representations
// =============================================================================

let _nextHandleId = 0;
let _nextVarId = 0;

/**
 * Generate a fresh handle.
 */
export function freshHandle(): Handle {
  return { id: `h${_nextHandleId++}` };
}

/**
 * Generate a fresh MRS variable.
 */
export function freshVar(type: MRSVariableType): MRSVariable {
  const prefix = type === 'event' ? 'e'
    : type === 'referent' ? 'x'
    : type === 'handle' ? 'h'
    : type === 'degree' ? 'd'
    : 'i';
  return {
    id: `${prefix}${_nextVarId++}`,
    type,
    properties: new Map(),
  };
}

/**
 * Create an elementary predication.
 */
export function createEP(
  predicate: string,
  args: ReadonlyMap<string, MRSArgument>,
  isQuantifier: boolean = false,
  carg: string | null = null,
  span: MRSSpan = { start: 0, end: 0 },
): ElementaryPredication {
  return {
    label: freshHandle(),
    predicate,
    arguments: args,
    isQuantifier,
    carg,
    span,
  };
}

/**
 * Create a handle constraint.
 */
export function createConstraint(
  high: Handle,
  low: Handle,
  type: ConstraintRelation = 'qeq',
): HandleConstraint {
  return { high, low, type };
}

/**
 * Build an MRS from a list of EPs and constraints.
 */
export function buildMRS(
  eps: readonly ElementaryPredication[],
  constraints: readonly HandleConstraint[],
  source: string = '',
): MRS {
  const topHandle = freshHandle();

  // Find the main event variable
  let index: MRSVariable = freshVar('event');
  for (const ep of eps) {
    if (!ep.isQuantifier) {
      const arg0 = ep.arguments.get('ARG0');
      if (arg0?.kind === 'variable' && arg0.variable.type === 'event') {
        index = arg0.variable;
        break;
      }
    }
  }

  return {
    topHandle,
    index,
    eps,
    constraints,
    source,
  };
}

// =============================================================================
// SCOPE RESOLUTION — enumerating fully-scoped readings
// =============================================================================

/**
 * A fully-scoped reading: a specific assignment of scope orderings.
 */
export interface ScopedReading {
  /** The reading number (1-based) */
  readonly index: number;

  /** The scope ordering: handle → EP that fills that scope position */
  readonly assignment: ReadonlyMap<string, string>;

  /** The logical form as a string */
  readonly logicalForm: string;

  /** Whether this reading is well-formed */
  readonly wellFormed: boolean;

  /** Whether this reading is pragmatically preferred */
  readonly preferred: boolean;

  /** Score (higher = more preferred) */
  readonly score: number;
}

/**
 * Result of scope resolution.
 */
export interface ScopeResolutionResult {
  /** The MRS being resolved */
  readonly mrs: MRS;

  /** All valid scoped readings */
  readonly readings: readonly ScopedReading[];

  /** Number of readings */
  readonly readingCount: number;

  /** Whether scope is ambiguous (more than one reading) */
  readonly ambiguous: boolean;

  /** The preferred reading (if one is clearly best) */
  readonly preferredReading: ScopedReading | null;

  /** Whether clarification is needed */
  readonly needsClarification: boolean;
}

/**
 * Resolve scope ambiguity in an MRS.
 * Enumerates all valid readings and ranks them.
 */
export function resolveScope(mrs: MRS): ScopeResolutionResult {
  // Find quantifier EPs
  const quantifierEPs = mrs.eps.filter(ep => ep.isQuantifier);
  const nonQuantifierEPs = mrs.eps.filter(ep => !ep.isQuantifier);

  if (quantifierEPs.length <= 1) {
    // No ambiguity with 0 or 1 quantifiers
    const reading: ScopedReading = {
      index: 1,
      assignment: new Map(),
      logicalForm: formatMRSLogical(mrs),
      wellFormed: true,
      preferred: true,
      score: 1.0,
    };
    return {
      mrs,
      readings: [reading],
      readingCount: 1,
      ambiguous: false,
      preferredReading: reading,
      needsClarification: false,
    };
  }

  // Generate permutations of quantifier scope orderings
  const permutations = generatePermutations(quantifierEPs);
  const readings: ScopedReading[] = [];

  for (let i = 0; i < permutations.length; i++) {
    const perm = permutations[i]!;

    // Check if this ordering is consistent with constraints
    const consistent = isConsistentWithConstraints(perm, mrs.constraints);
    if (!consistent) continue;

    // Build the scoped reading
    const assignment = new Map<string, string>();
    for (let j = 0; j < perm.length; j++) {
      assignment.set(`scope_${j}`, perm[j]!.predicate);
    }

    const logicalForm = buildScopedLogicalForm(perm, nonQuantifierEPs);
    const score = scoreScopeOrdering(perm, mrs);

    readings.push({
      index: readings.length + 1,
      assignment,
      logicalForm,
      wellFormed: true,
      preferred: false,
      score,
    });
  }

  // Sort by score
  readings.sort((a, b) => b.score - a.score);

  // Mark the best as preferred (if it's significantly better)
  if (readings.length > 0) {
    const best = readings[0]!;
    const secondBest = readings.length > 1 ? readings[1]! : null;
    const gap = secondBest ? best.score - secondBest.score : 1;

    if (gap >= PREFERENCE_THRESHOLD) {
      (readings[0] as { preferred: boolean }).preferred = true;
    }
  }

  const preferredReading = readings.find(r => r.preferred) ?? null;
  const needsClarification = readings.length > 1 && !preferredReading;

  return {
    mrs,
    readings,
    readingCount: readings.length,
    ambiguous: readings.length > 1,
    preferredReading,
    needsClarification,
  };
}

const PREFERENCE_THRESHOLD = 0.15;

/**
 * Generate all permutations of an array.
 */
function generatePermutations<T>(items: readonly T[]): readonly T[][] {
  if (items.length <= 1) return [items as T[]];

  // Limit to avoid explosion
  if (items.length > MAX_QUANTIFIERS) {
    return [items as T[]]; // Just return the input order
  }

  const result: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    const perms = generatePermutations(rest);
    for (const perm of perms) {
      result.push([items[i]!, ...perm]);
    }
  }
  return result;
}

const MAX_QUANTIFIERS = 5;

/**
 * Check if a scope ordering is consistent with handle constraints.
 */
function isConsistentWithConstraints(
  ordering: readonly ElementaryPredication[],
  constraints: readonly HandleConstraint[],
): boolean {
  // Build a position map
  const position = new Map<string, number>();
  for (let i = 0; i < ordering.length; i++) {
    position.set(ordering[i]!.label.id, i);
  }

  for (const constraint of constraints) {
    const highPos = position.get(constraint.high.id);
    const lowPos = position.get(constraint.low.id);

    if (highPos !== undefined && lowPos !== undefined) {
      switch (constraint.type) {
        case 'qeq':
        case 'outscopes':
          if (highPos >= lowPos) return false; // High must be before low
          break;
        case 'equals':
          if (highPos !== lowPos) return false;
          break;
      }
    }
  }

  return true;
}

/**
 * Build a logical form string from a scoped ordering.
 */
function buildScopedLogicalForm(
  quantifiers: readonly ElementaryPredication[],
  body: readonly ElementaryPredication[],
): string {
  const parts: string[] = [];

  // Quantifiers (outermost to innermost)
  for (const qep of quantifiers) {
    const pred = qep.predicate;
    const arg0 = qep.arguments.get('ARG0');
    const varStr = arg0?.kind === 'variable' ? arg0.variable.id : '?';
    parts.push(`${pred}(${varStr})`);
  }

  // Body predicates
  const bodyParts: string[] = [];
  for (const ep of body) {
    const args = [...ep.arguments.entries()]
      .map(([_name, arg]) => {
        if (arg.kind === 'variable') return arg.variable.id;
        if (arg.kind === 'constant') return `"${arg.value}"`;
        return arg.handle.id;
      });
    bodyParts.push(`${ep.predicate}(${args.join(', ')})`);
  }

  return `${parts.join(' > ')} : ${bodyParts.join(' ∧ ')}`;
}

/**
 * Score a scope ordering based on heuristic preferences.
 *
 * Preferences (from linguistics):
 * 1. Surface scope: prefer the order in which quantifiers appear in the input
 * 2. Specificity: prefer specific (definite) quantifiers to scope wide
 * 3. Subject preference: prefer subjects to outscope objects
 * 4. Negative scope: prefer negation to scope over quantifiers
 */
function scoreScopeOrdering(
  ordering: readonly ElementaryPredication[],
  _mrs: MRS,
): number {
  let score = 0.5; // Base score

  // Surface scope preference: reward orderings that match source position
  let surfaceOrderScore = 0;
  for (let i = 0; i < ordering.length - 1; i++) {
    const current = ordering[i]!;
    const next = ordering[i + 1]!;
    if (current.span.start <= next.span.start) {
      surfaceOrderScore += 1;
    }
  }
  if (ordering.length > 1) {
    score += 0.2 * (surfaceOrderScore / (ordering.length - 1));
  }

  // Specificity preference: definite descriptions scope wide
  for (let i = 0; i < ordering.length; i++) {
    const ep = ordering[i]!;
    const carg = ep.carg;
    if (carg === 'the' || carg === 'this' || carg === 'that') {
      // Definite — prefer early (wide) scope
      score += 0.1 * (1 - i / ordering.length);
    }
  }

  // Negation preference: negation scopes wide
  for (let i = 0; i < ordering.length; i++) {
    const ep = ordering[i]!;
    if (ep.predicate === 'neg' || ep.predicate === 'not') {
      score += 0.1 * (1 - i / ordering.length);
    }
  }

  return Math.min(1, Math.max(0, score));
}

// =============================================================================
// SCOPE ISLANDS — boundaries that block scope interaction
// =============================================================================

/**
 * A scope island: a boundary that quantifiers cannot scope out of.
 */
export interface ScopeIsland {
  /** The island type */
  readonly type: ScopeIslandType;

  /** The EPs contained within this island */
  readonly containedEPs: readonly string[];

  /** Description */
  readonly description: string;
}

export type ScopeIslandType =
  | 'relative_clause'   // "the layer that has reverb"
  | 'conditional'       // "if X then Y"
  | 'coordination'      // "X and Y" (each conjunct is an island)
  | 'embedded_question' // "which layer to modify"
  | 'purpose_clause';   // "to make it brighter"

/**
 * Check if two EPs are in the same scope island.
 */
export function inSameIsland(
  ep1Label: string,
  ep2Label: string,
  islands: readonly ScopeIsland[],
): boolean {
  for (const island of islands) {
    const has1 = island.containedEPs.includes(ep1Label);
    const has2 = island.containedEPs.includes(ep2Label);
    if (has1 !== has2) return false; // One in, one out
  }
  return true;
}

// =============================================================================
// CLARIFICATION — generating questions about scope ambiguity
// =============================================================================

/**
 * A scope clarification question.
 */
export interface ScopeClarificationQuestion {
  /** The question text */
  readonly question: string;

  /** The readings being disambiguated */
  readonly readings: readonly ScopedReading[];

  /** Options presented to the user */
  readonly options: readonly ScopeClarificationOption[];

  /** Default option (if there's a clear pragmatic preference) */
  readonly defaultOption: number | null;
}

/**
 * A clarification option.
 */
export interface ScopeClarificationOption {
  /** Human-readable label */
  readonly label: string;

  /** The reading this option corresponds to */
  readonly readingIndex: number;

  /** Paraphrase showing this reading */
  readonly paraphrase: string;
}

/**
 * Generate a clarification question for scope ambiguity.
 */
export function generateScopeClarification(
  result: ScopeResolutionResult,
): ScopeClarificationQuestion | null {
  if (!result.needsClarification) return null;
  if (result.readings.length < 2) return null;

  const top2 = result.readings.slice(0, 2);

  const options: ScopeClarificationOption[] = top2.map((reading, _i) => ({
    label: `Reading ${reading.index}`,
    readingIndex: reading.index,
    paraphrase: reading.logicalForm,
  }));

  const defaultOption = result.preferredReading
    ? options.findIndex(o => o.readingIndex === result.preferredReading!.index)
    : null;

  return {
    question: `This sentence has ${result.readingCount} possible interpretations. Which did you mean?`,
    readings: top2,
    options,
    defaultOption: defaultOption !== null && defaultOption >= 0 ? defaultOption : null,
  };
}

// =============================================================================
// FORMATTING — human-readable MRS output
// =============================================================================

/**
 * Format an MRS as a string.
 */
export function formatMRS(mrs: MRS): string {
  const lines: string[] = [];

  lines.push(`MRS:`);
  lines.push(`  TOP: ${mrs.topHandle.id}`);
  lines.push(`  INDEX: ${mrs.index.id} (${mrs.index.type})`);
  lines.push('');
  lines.push('  EPs:');
  for (const ep of mrs.eps) {
    const qMark = ep.isQuantifier ? ' [Q]' : '';
    const args = [...ep.arguments.entries()]
      .map(([name, arg]) => {
        if (arg.kind === 'variable') return `${name}=${arg.variable.id}`;
        if (arg.kind === 'constant') return `${name}="${arg.value}"`;
        return `${name}=${arg.handle.id}`;
      })
      .join(', ');
    lines.push(`    ${ep.label.id}: ${ep.predicate}(${args})${qMark}`);
  }

  if (mrs.constraints.length > 0) {
    lines.push('');
    lines.push('  Constraints:');
    for (const c of mrs.constraints) {
      lines.push(`    ${c.high.id} ${c.type} ${c.low.id}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format an MRS as a logical formula string.
 */
export function formatMRSLogical(mrs: MRS): string {
  const parts: string[] = [];

  for (const ep of mrs.eps) {
    const args = [...ep.arguments.entries()]
      .map(([, arg]) => {
        if (arg.kind === 'variable') return arg.variable.id;
        if (arg.kind === 'constant') return `"${arg.value}"`;
        return arg.handle.id;
      });
    parts.push(`${ep.predicate}(${args.join(', ')})`);
  }

  return parts.join(' ∧ ');
}

/**
 * Format a scope resolution result.
 */
export function formatScopeResolution(result: ScopeResolutionResult): string {
  const lines: string[] = [];

  lines.push(`Scope Resolution: ${result.ambiguous ? 'AMBIGUOUS' : 'UNAMBIGUOUS'}`);
  lines.push(`  Readings: ${result.readingCount}`);
  lines.push(`  Needs clarification: ${result.needsClarification}`);

  for (const reading of result.readings) {
    const pref = reading.preferred ? ' [PREFERRED]' : '';
    lines.push(`  Reading ${reading.index}${pref} (score: ${reading.score.toFixed(2)}):`);
    lines.push(`    ${reading.logicalForm}`);
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the scope ambiguity module.
 */
export function getScopeAmbiguityStats(): {
  maxQuantifiers: number;
  preferenceThreshold: number;
  constraintTypes: number;
  islandTypes: number;
  scoringHeuristics: number;
} {
  return {
    maxQuantifiers: MAX_QUANTIFIERS,
    preferenceThreshold: PREFERENCE_THRESHOLD,
    constraintTypes: 3,
    islandTypes: 5,
    scoringHeuristics: 3, // surface order, specificity, negation
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetScopeAmbiguity(): void {
  _nextHandleId = 0;
  _nextVarId = 0;
}
