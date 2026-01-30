/**
 * GOFAI Semantics — Coordination and Sequencing
 *
 * Defines the semantics of coordination ("X and Y") and sequencing
 * ("do X and then Y", "first X, then Y") as ordered plan composition.
 *
 * ## Linguistic Background
 *
 * Coordination in natural language involves combining clauses with
 * conjunctions. In music editing commands, coordination has specific
 * compositional semantics:
 *
 * - **"and"**: Parallel composition — both operations apply, order may vary
 * - **"and then"**: Sequential composition — strict ordering
 * - **"but"**: Contrastive — second clause constrains the first
 * - **"or"**: Alternative — user chooses or system picks best
 * - **"first...then"**: Explicit ordering
 * - **"while"**: Concurrent — operations apply simultaneously
 *
 * ## Plan Composition
 *
 * Each coordination pattern maps to a specific plan composition operator
 * that determines how sub-plans are combined into a single execution plan.
 *
 * @module gofai/nl/semantics/coordination-sequencing
 * @see gofai_goalA.md Step 094
 */

// =============================================================================
// COORDINATION TYPES
// =============================================================================

/**
 * A coordinated command structure extracted from user input.
 */
export interface CoordinatedCommand {
  /** The coordination type */
  readonly coordination: CoordinationType;

  /** The constituent commands (in order) */
  readonly constituents: readonly CommandConstituent[];

  /** How the commands compose into a plan */
  readonly composition: PlanComposition;

  /** The conjunction word(s) used */
  readonly conjunction: string;

  /** Whether ordering is strict */
  readonly orderStrict: boolean;

  /** The source text */
  readonly sourceText: string;
}

/**
 * Types of coordination.
 */
export type CoordinationType =
  | 'parallel'       // "X and Y" — both happen, order flexible
  | 'sequential'     // "X and then Y" — strict ordering
  | 'contrastive'    // "X but Y" — Y constrains X
  | 'alternative'    // "X or Y" — one or the other
  | 'conditional'    // "X, and if so, Y" — dependent
  | 'concurrent'     // "X while Y" — simultaneously
  | 'additive'       // "X, also Y" — and additionally
  | 'corrective'     // "not X but Y" — replace X with Y
  | 'elaborative'    // "X, specifically Y" — Y refines X
  | 'causal';        // "X so that Y" — X enables Y

/**
 * A single constituent in a coordinated command.
 */
export interface CommandConstituent {
  /** Index in the coordination (0-based) */
  readonly index: number;

  /** The command text */
  readonly text: string;

  /** The role of this constituent */
  readonly role: ConstituentRole;

  /** Dependencies on other constituents */
  readonly dependencies: readonly number[];

  /** Scope (if different from the coordinated scope) */
  readonly localScope?: ConstituentScope;
}

/**
 * Role of a constituent in coordination.
 */
export type ConstituentRole =
  | 'action'         // A command to execute
  | 'constraint'     // A constraint on another command
  | 'condition'      // A condition for execution
  | 'alternative'    // An alternative to another command
  | 'refinement'     // A refinement of another command
  | 'scope_setter';  // Sets the scope for subsequent commands

/**
 * Scope override for a constituent.
 */
export interface ConstituentScope {
  readonly sections?: readonly string[];
  readonly layers?: readonly string[];
  readonly timeRange?: { readonly startBar: number; readonly endBar: number };
}

// =============================================================================
// PLAN COMPOSITION — how coordinated commands combine
// =============================================================================

/**
 * How coordinated sub-plans compose into a single plan.
 */
export type PlanComposition =
  | ParallelComposition
  | SequentialComposition
  | ContrastiveComposition
  | AlternativeComposition
  | ConditionalComposition
  | ConcurrentComposition;

/**
 * Parallel composition: both plans execute, order is flexible.
 * The planner may reorder for efficiency.
 */
export interface ParallelComposition {
  readonly type: 'parallel';
  /** Whether the planner can reorder steps */
  readonly reorderable: boolean;
  /** Whether results are independent (no interaction) */
  readonly independent: boolean;
}

/**
 * Sequential composition: plans execute in strict order.
 * Later plans may depend on results of earlier plans.
 */
export interface SequentialComposition {
  readonly type: 'sequential';
  /** Whether later steps can see earlier results */
  readonly pipelined: boolean;
  /** Whether failure of an early step blocks later steps */
  readonly failFast: boolean;
}

/**
 * Contrastive composition: the second plan constrains the first.
 * "Make it brighter but keep the melody" = brightness goal + melody constraint.
 */
export interface ContrastiveComposition {
  readonly type: 'contrastive';
  /** Which constituent is the goal */
  readonly goalIndex: number;
  /** Which constituent is the constraint */
  readonly constraintIndex: number;
  /** Whether the constraint is hard (must be satisfied) */
  readonly hardConstraint: boolean;
}

/**
 * Alternative composition: one of the plans executes.
 * "Brighten it or widen it" = system chooses the better option.
 */
export interface AlternativeComposition {
  readonly type: 'alternative';
  /** Whether the user should choose (vs. system choosing) */
  readonly userChoice: boolean;
  /** Preference order (if system chooses) */
  readonly preferenceOrder: readonly number[];
}

/**
 * Conditional composition: second plan depends on first.
 * "If it's too dark, brighten it" = conditional execution.
 */
export interface ConditionalComposition {
  readonly type: 'conditional';
  /** Index of the condition constituent */
  readonly conditionIndex: number;
  /** Index of the action constituent */
  readonly actionIndex: number;
  /** Whether the condition is negated */
  readonly negated: boolean;
}

/**
 * Concurrent composition: plans execute simultaneously.
 * "While widening the pad, brighten the lead"
 */
export interface ConcurrentComposition {
  readonly type: 'concurrent';
  /** Whether the operations must be atomic (all-or-nothing) */
  readonly atomic: boolean;
}

// =============================================================================
// CONJUNCTION VOCABULARY
// =============================================================================

/**
 * A conjunction pattern that signals coordination.
 */
export interface ConjunctionPattern {
  /** The conjunction surface forms */
  readonly surfaceForms: readonly string[];

  /** What coordination type it produces */
  readonly coordinationType: CoordinationType;

  /** Default composition */
  readonly defaultComposition: PlanComposition;

  /** Whether ordering is strict */
  readonly orderStrict: boolean;

  /** Examples */
  readonly examples: readonly ConjunctionExample[];

  /** Description */
  readonly description: string;
}

export interface ConjunctionExample {
  readonly utterance: string;
  readonly parsed: string;
}

/**
 * Canonical conjunction patterns.
 */
export const CONJUNCTION_PATTERNS: readonly ConjunctionPattern[] = [
  // === PARALLEL ("and") ===
  {
    surfaceForms: ['and', 'plus', 'as well as', 'along with', 'together with'],
    coordinationType: 'parallel',
    defaultComposition: { type: 'parallel', reorderable: true, independent: true },
    orderStrict: false,
    examples: [
      { utterance: 'Make it brighter and wider', parsed: 'parallel(brighten, widen)' },
      { utterance: 'Add reverb and compression', parsed: 'parallel(add_reverb, add_compression)' },
      { utterance: 'Tighten the drums and brighten the lead', parsed: 'parallel(tighten drums, brighten lead)' },
    ],
    description: 'Parallel execution — both operations apply, order flexible.',
  },

  // === SEQUENTIAL ("and then", "then") ===
  {
    surfaceForms: ['and then', 'then', 'after that', 'next', 'followed by', 'and after that'],
    coordinationType: 'sequential',
    defaultComposition: { type: 'sequential', pipelined: true, failFast: true },
    orderStrict: true,
    examples: [
      { utterance: 'Make the verse louder and then brighten the chorus', parsed: 'sequential(louder verse, brighten chorus)' },
      { utterance: 'Add drums, then adjust the mix', parsed: 'sequential(add_drums, adjust_mix)' },
    ],
    description: 'Sequential execution — strict ordering, later steps see earlier results.',
  },

  // === CONTRASTIVE ("but", "however") ===
  {
    surfaceForms: ['but', 'however', 'though', 'although', 'yet', 'while still'],
    coordinationType: 'contrastive',
    defaultComposition: { type: 'contrastive', goalIndex: 0, constraintIndex: 1, hardConstraint: true },
    orderStrict: false,
    examples: [
      { utterance: 'Make it brighter but keep the melody', parsed: 'contrastive(goal: brighten, constraint: preserve_melody)' },
      { utterance: 'Add energy but don\'t change the chords', parsed: 'contrastive(goal: add_energy, constraint: preserve_harmony)' },
      { utterance: 'Widen it but preserve the mono compatibility', parsed: 'contrastive(goal: widen, constraint: mono_compat)' },
    ],
    description: 'Contrastive — the second clause constrains the first (high priority).',
  },

  // === ALTERNATIVE ("or") ===
  {
    surfaceForms: ['or', 'alternatively', 'or else', 'or instead', 'otherwise'],
    coordinationType: 'alternative',
    defaultComposition: { type: 'alternative', userChoice: true, preferenceOrder: [0, 1] },
    orderStrict: false,
    examples: [
      { utterance: 'Brighten it or widen it', parsed: 'alternative(brighten, widen)' },
      { utterance: 'Add reverb or delay', parsed: 'alternative(add_reverb, add_delay)' },
    ],
    description: 'Alternative — one or the other (user or system chooses).',
  },

  // === CONDITIONAL ("if") ===
  {
    surfaceForms: ['if', 'in case', 'when', 'provided that', 'assuming'],
    coordinationType: 'conditional',
    defaultComposition: { type: 'conditional', conditionIndex: 0, actionIndex: 1, negated: false },
    orderStrict: true,
    examples: [
      { utterance: 'If it\'s too dark, brighten it', parsed: 'conditional(condition: too_dark, action: brighten)' },
      { utterance: 'If the mix clips, reduce the gain', parsed: 'conditional(condition: clips, action: reduce_gain)' },
    ],
    description: 'Conditional — action depends on condition being true.',
  },

  // === CONCURRENT ("while", "as") ===
  {
    surfaceForms: ['while', 'as', 'at the same time', 'simultaneously', 'meanwhile'],
    coordinationType: 'concurrent',
    defaultComposition: { type: 'concurrent', atomic: false },
    orderStrict: false,
    examples: [
      { utterance: 'While widening the pad, brighten the lead', parsed: 'concurrent(widen pad, brighten lead)' },
      { utterance: 'Reduce the bass while increasing the mids', parsed: 'concurrent(reduce bass, increase mids)' },
    ],
    description: 'Concurrent — operations apply simultaneously.',
  },

  // === ADDITIVE ("also", "additionally") ===
  {
    surfaceForms: ['also', 'additionally', 'in addition', 'furthermore', 'moreover', 'besides'],
    coordinationType: 'additive',
    defaultComposition: { type: 'parallel', reorderable: true, independent: true },
    orderStrict: false,
    examples: [
      { utterance: 'Make it brighter. Also add reverb', parsed: 'additive(brighten, add_reverb)' },
      { utterance: 'Tighten the drums. Additionally, raise the bass', parsed: 'additive(tighten drums, raise bass)' },
    ],
    description: 'Additive — additional operation, like parallel.',
  },

  // === CORRECTIVE ("not...but", "instead of") ===
  {
    surfaceForms: ['not...but', 'instead of', 'rather than'],
    coordinationType: 'corrective',
    defaultComposition: { type: 'contrastive', goalIndex: 1, constraintIndex: 0, hardConstraint: true },
    orderStrict: false,
    examples: [
      { utterance: 'Not brighter, but wider', parsed: 'corrective(reject: brighten, accept: widen)' },
      { utterance: 'Instead of reverb, use delay', parsed: 'corrective(reject: reverb, accept: delay)' },
    ],
    description: 'Corrective — replaces one option with another.',
  },

  // === ELABORATIVE ("specifically", "in particular") ===
  {
    surfaceForms: ['specifically', 'in particular', 'especially', 'namely', 'that is'],
    coordinationType: 'elaborative',
    defaultComposition: { type: 'parallel', reorderable: false, independent: false },
    orderStrict: false,
    examples: [
      { utterance: 'Make it brighter, specifically the high end', parsed: 'elaborative(brighten, scope: high_end)' },
      { utterance: 'Tighten the groove, especially the hi-hat', parsed: 'elaborative(tighten groove, focus: hi_hat)' },
    ],
    description: 'Elaborative — the second clause refines/specifies the first.',
  },

  // === CAUSAL ("so that", "in order to") ===
  {
    surfaceForms: ['so that', 'in order to', 'so', 'to make it'],
    coordinationType: 'causal',
    defaultComposition: { type: 'sequential', pipelined: true, failFast: true },
    orderStrict: true,
    examples: [
      { utterance: 'Reduce the bass so that the kick comes through', parsed: 'causal(action: reduce bass, goal: kick clarity)' },
      { utterance: 'Widen the pads to make it feel bigger', parsed: 'causal(action: widen pads, goal: bigger feel)' },
    ],
    description: 'Causal — first operation serves the purpose of the second.',
  },

  // === EXPLICIT ORDERING ("first...then...finally") ===
  {
    surfaceForms: ['first', 'second', 'third', 'finally', 'lastly', 'to start', 'to finish'],
    coordinationType: 'sequential',
    defaultComposition: { type: 'sequential', pipelined: true, failFast: false },
    orderStrict: true,
    examples: [
      { utterance: 'First brighten it, then widen it, finally add reverb', parsed: 'sequential(brighten, widen, add_reverb)' },
      { utterance: 'To start, tighten the drums. Then raise the bass. Lastly, add compression.', parsed: 'sequential(tighten drums, raise bass, add compression)' },
    ],
    description: 'Explicit sequential ordering with ordinal markers.',
  },
];

// Build lookup
const _conjunctionMap = new Map<string, ConjunctionPattern>();
for (const pattern of CONJUNCTION_PATTERNS) {
  for (const form of pattern.surfaceForms) {
    _conjunctionMap.set(form.toLowerCase(), pattern);
  }
}

/**
 * Look up a conjunction pattern by surface form.
 */
export function lookupConjunction(text: string): ConjunctionPattern | undefined {
  return _conjunctionMap.get(text.toLowerCase());
}

/**
 * Find conjunction patterns in a text.
 */
export function findConjunctions(text: string): readonly FoundConjunction[] {
  const lower = text.toLowerCase();
  const results: FoundConjunction[] = [];

  for (const pattern of CONJUNCTION_PATTERNS) {
    for (const form of pattern.surfaceForms) {
      if (form.includes('...')) continue; // Skip patterns with gaps

      const idx = lower.indexOf(form.toLowerCase());
      if (idx >= 0) {
        // Check word boundaries
        const before = idx > 0 ? lower[idx - 1] : ' ';
        const afterIdx = idx + form.length;
        const after = afterIdx < lower.length ? lower[afterIdx] : ' ';

        if ((before === ' ' || before === ',') && (after === ' ' || after === ',')) {
          results.push({
            pattern,
            surfaceForm: form,
            position: idx,
            length: form.length,
          });
        }
      }
    }
  }

  // Deduplicate by position (keep highest priority / most specific)
  const deduped = new Map<number, FoundConjunction>();
  for (const result of results) {
    const existing = deduped.get(result.position);
    if (!existing || result.length > existing.length) {
      deduped.set(result.position, result);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.position - b.position);
}

export interface FoundConjunction {
  readonly pattern: ConjunctionPattern;
  readonly surfaceForm: string;
  readonly position: number;
  readonly length: number;
}

// =============================================================================
// PLAN COMPOSITION OPERATIONS
// =============================================================================

/**
 * Compose two sub-plans according to the coordination type.
 */
export interface ComposedPlan {
  /** The composition type */
  readonly composition: PlanComposition;

  /** The sub-plans in order */
  readonly subPlans: readonly SubPlan[];

  /** Execution order */
  readonly executionOrder: ExecutionOrder;

  /** Whether previews should be shown for each sub-plan */
  readonly previewEach: boolean;

  /** Display summary */
  readonly summary: string;
}

export interface SubPlan {
  readonly index: number;
  readonly text: string;
  readonly role: ConstituentRole;
  readonly dependencies: readonly number[];
}

export type ExecutionOrder =
  | { readonly kind: 'sequential'; readonly order: readonly number[] }
  | { readonly kind: 'parallel'; readonly groups: readonly (readonly number[])[] }
  | { readonly kind: 'choice'; readonly options: readonly number[] }
  | { readonly kind: 'conditional'; readonly conditionIndex: number; readonly actionIndex: number };

/**
 * Build a composed plan from a coordinated command.
 */
export function buildComposedPlan(command: CoordinatedCommand): ComposedPlan {
  const subPlans: SubPlan[] = command.constituents.map(c => ({
    index: c.index,
    text: c.text,
    role: c.role,
    dependencies: [...c.dependencies],
  }));

  let executionOrder: ExecutionOrder;
  let previewEach: boolean;

  switch (command.composition.type) {
    case 'sequential':
      executionOrder = {
        kind: 'sequential',
        order: subPlans.map(p => p.index),
      };
      previewEach = true;
      break;

    case 'parallel':
    case 'concurrent':
      executionOrder = {
        kind: 'parallel',
        groups: [subPlans.map(p => p.index)],
      };
      previewEach = false;
      break;

    case 'alternative':
      executionOrder = {
        kind: 'choice',
        options: subPlans.map(p => p.index),
      };
      previewEach = true;
      break;

    case 'conditional':
      executionOrder = {
        kind: 'conditional',
        conditionIndex: command.composition.conditionIndex,
        actionIndex: command.composition.actionIndex,
      };
      previewEach = true;
      break;

    case 'contrastive':
      // Contrastive: execute the goal with the constraint applied
      executionOrder = {
        kind: 'sequential',
        order: [command.composition.goalIndex, command.composition.constraintIndex],
      };
      previewEach = false;
      break;
  }

  return {
    composition: command.composition,
    subPlans,
    executionOrder,
    previewEach,
    summary: formatComposedPlan(command),
  };
}

// =============================================================================
// DISPLAY AND FORMATTING
// =============================================================================

/**
 * Format a coordinated command as a plan summary.
 */
export function formatComposedPlan(command: CoordinatedCommand): string {
  const parts = command.constituents.map(c => c.text);

  switch (command.coordination) {
    case 'parallel':
      return parts.join(' AND ');
    case 'sequential':
      return parts.join(' THEN ');
    case 'contrastive':
      return `${parts[0]} BUT ${parts.slice(1).join(' AND ')}`;
    case 'alternative':
      return parts.join(' OR ');
    case 'conditional':
      return `IF ${parts[0]} THEN ${parts.slice(1).join(' AND ')}`;
    case 'concurrent':
      return parts.join(' WHILE ');
    case 'additive':
      return parts.join(' ALSO ');
    case 'corrective':
      return `NOT ${parts[0]} BUT ${parts.slice(1).join(' AND ')}`;
    case 'elaborative':
      return `${parts[0]} SPECIFICALLY ${parts.slice(1).join(', ')}`;
    case 'causal':
      return `${parts[0]} SO THAT ${parts.slice(1).join(' AND ')}`;
  }
}

/**
 * Format an execution order for display.
 */
export function formatExecutionOrder(order: ExecutionOrder): string {
  switch (order.kind) {
    case 'sequential':
      return `Sequential: ${order.order.map(i => `Step ${i + 1}`).join(' → ')}`;
    case 'parallel':
      return `Parallel: ${order.groups.map(g => g.map(i => `Step ${i + 1}`).join(' + ')).join(' | ')}`;
    case 'choice':
      return `Choice: ${order.options.map(i => `Option ${i + 1}`).join(' or ')}`;
    case 'conditional':
      return `If Step ${order.conditionIndex + 1} then Step ${order.actionIndex + 1}`;
  }
}

/**
 * Get coordination statistics.
 */
export interface CoordinationStats {
  readonly totalPatterns: number;
  readonly totalSurfaceForms: number;
  readonly byType: Readonly<Record<string, number>>;
  readonly totalExamples: number;
}

export function getCoordinationStats(): CoordinationStats {
  const byType: Record<string, number> = {};
  let totalSurface = 0;
  let totalExamples = 0;

  for (const p of CONJUNCTION_PATTERNS) {
    byType[p.coordinationType] = (byType[p.coordinationType] ?? 0) + 1;
    totalSurface += p.surfaceForms.length;
    totalExamples += p.examples.length;
  }

  return {
    totalPatterns: CONJUNCTION_PATTERNS.length,
    totalSurfaceForms: totalSurface,
    byType,
    totalExamples,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const COORDINATION_RULES = [
  'Rule COORD-001: "and" produces parallel composition by default. ' +
  'Both operations apply; the planner may reorder for efficiency.',

  'Rule COORD-002: "and then" / "then" produces sequential composition. ' +
  'Operations execute in strict order; later steps can see earlier results.',

  'Rule COORD-003: "but" produces contrastive composition. The clause ' +
  'after "but" is a high-priority constraint on the clause before "but".',

  'Rule COORD-004: "or" produces alternative composition. By default, ' +
  'the user is asked to choose. The system can auto-choose if configured.',

  'Rule COORD-005: "while" / "as" / "simultaneously" produces concurrent ' +
  'composition. Both operations must be independent (no shared targets).',

  'Rule COORD-006: "if" produces conditional composition. The condition ' +
  'is evaluated before the action is planned.',

  'Rule COORD-007: "not X but Y" / "instead of X, Y" produces corrective ' +
  'composition. X is explicitly rejected; Y replaces it.',

  'Rule COORD-008: "specifically" / "in particular" produces elaborative ' +
  'composition. The second clause refines the scope or parameters of the first.',

  'Rule COORD-009: "so that" / "in order to" produces causal composition. ' +
  'The first clause is the means; the second is the desired end state.',

  'Rule COORD-010: Explicit ordering ("first", "second", "finally") produces ' +
  'sequential composition with explicit step numbering.',

  'Rule COORD-011: Contrastive coordination ("but") always makes the constraint ' +
  'hard by default. The user must explicitly soften it ("but ideally keep...").',

  'Rule COORD-012: When parallel sub-plans have overlapping scopes, they are ' +
  'promoted to sequential execution with conflict detection.',
] as const;
