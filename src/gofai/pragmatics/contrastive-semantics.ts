/**
 * Contrastive Construction Semantics
 *
 * Step 037 [Sem]: Specify how contrastive constructions map
 * ("do X but keep Y", "do X without Y") including constraint
 * precedence rules.
 *
 * ## Core Idea
 *
 * Contrastive constructions in music editing create a GOAL + CONSTRAINT
 * pairing. The "but/without/except" clause generates a constraint that
 * MUST be satisfied or the plan is rejected.
 *
 * ## Construction Inventory
 *
 * The following contrastive patterns are recognized:
 *
 * 1. **"X but Y"**: Goal X with constraint Y
 *    - "Make it brighter but keep the bass steady"
 *    - Goal: increase(brightness); Constraint: preserve(bass, steady)
 *
 * 2. **"X without Y"**: Goal X with exclusion constraint
 *    - "Add energy without changing the melody"
 *    - Goal: increase(energy); Constraint: preserve(melody, exact)
 *
 * 3. **"X but not Y"**: Goal X with exclusion
 *    - "Brighten everything but not the drums"
 *    - Goal: increase(brightness, global); Constraint: exclude(drums)
 *
 * 4. **"X except Y"**: Goal X with exception
 *    - "Quantize everything except the hats"
 *    - Goal: quantize(all); Constraint: exclude(hats)
 *
 * 5. **"X instead of Y"**: Replacement
 *    - "Use piano instead of strings"
 *    - Goal: replace(strings, piano)
 *
 * 6. **"X rather than Y"**: Preference for alternative
 *    - "Go brighter rather than louder"
 *    - Goal: increase(brightness); Anti-goal: NOT increase(loudness)
 *
 * 7. **"X, just don't Y"**: Goal with negative constraint
 *    - "Make it punchier, just don't clip"
 *    - Goal: increase(punch); Constraint: ceiling(loudness, clip_threshold)
 *
 * ## Constraint Precedence
 *
 * When a contrastive construction creates a constraint, the constraint
 * has HIGHER priority than the goal by default. This means:
 *
 * - If the goal and constraint conflict, the constraint wins.
 * - The plan must satisfy the constraint first, then optimize the goal.
 * - If no plan can satisfy both, a clarification is generated.
 *
 * This is the SAFE default. The user can relax it explicitly.
 *
 * @module gofai/pragmatics/contrastive-semantics
 */

// =============================================================================
// Contrastive Construction Types
// =============================================================================

/**
 * The type of contrastive construction detected in the parse.
 */
export type ContrastiveType =
  | 'but_keep'       // "X but keep Y" — goal + preservation
  | 'without'        // "X without Y" — goal + exclusion
  | 'but_not'        // "X but not Y" — goal + scope exclusion
  | 'except'         // "X except Y" — goal + exception
  | 'instead_of'     // "X instead of Y" — replacement
  | 'rather_than'    // "X rather than Y" — preference disambiguation
  | 'just_dont'      // "X, just don't Y" — goal + negative constraint
  | 'while_keeping'  // "X while keeping Y" — concurrent preservation
  | 'and_leave'      // "X and leave Y alone" — goal + explicit non-change
  | 'only_change';   // "only change X" — implicit preservation of everything else

/**
 * A parsed contrastive construction.
 */
export interface ContrastiveConstruction {
  /** The type of construction. */
  readonly type: ContrastiveType;
  /** The goal clause (what should change). */
  readonly goalClause: ContrastiveClause;
  /** The constraint clause (what should be preserved/excluded/replaced). */
  readonly constraintClause: ContrastiveClause;
  /** The discourse relation (from SDRT). */
  readonly discourseRelation: ContrastiveDiscourseRelation;
  /** The precedence: does the constraint outrank the goal? */
  readonly constraintPrecedence: ConstraintPrecedence;
  /** Source spans in the original utterance. */
  readonly sourceSpans: {
    readonly connective: string;       // "but", "without", etc.
    readonly goalSpan: string;         // text of goal clause
    readonly constraintSpan: string;   // text of constraint clause
  };
}

/**
 * A clause in a contrastive construction (either goal or constraint side).
 */
export interface ContrastiveClause {
  /** What the clause expresses. */
  readonly content: ContrastiveContent;
  /** Whether this clause expresses a positive or negative intent. */
  readonly polarity: 'positive' | 'negative';
  /** Optional scope restriction. */
  readonly scopeRestriction: string | undefined;
}

/**
 * The semantic content of a contrastive clause.
 */
export type ContrastiveContent =
  | { readonly type: 'change'; readonly axis: string; readonly direction: string }
  | { readonly type: 'preserve'; readonly target: string; readonly mode: PreservationMode }
  | { readonly type: 'exclude'; readonly target: string }
  | { readonly type: 'replace'; readonly source: string; readonly destination: string }
  | { readonly type: 'preference'; readonly preferred: string; readonly dispreferred: string }
  | { readonly type: 'ceiling'; readonly parameter: string; readonly threshold: string };

/**
 * Preservation mode for constraint clauses.
 */
export type PreservationMode = 'exact' | 'functional' | 'recognizable';

/**
 * SDRT-inspired discourse relation for the contrastive construction.
 */
export type ContrastiveDiscourseRelation =
  | 'contrast'       // "but" — two things are opposed
  | 'concession'     // "although/even though" — acknowledging conflict
  | 'exception'      // "except" — carving out a subset
  | 'correction'     // "instead/rather than" — replacing previous intent
  | 'restriction';   // "only/just" — narrowing scope


// =============================================================================
// Constraint Precedence
// =============================================================================

/**
 * How constraint and goal priorities interact.
 */
export type ConstraintPrecedence =
  | 'constraint_first'    // Constraint MUST be satisfied; goal optimized within constraint
  | 'goal_first'          // Goal takes priority; constraint is best-effort
  | 'equal'               // Both must be satisfied; conflict → clarification
  | 'user_specified';     // User explicitly set priority

/**
 * Default precedence rules by construction type.
 *
 * These defaults implement the SAFE choice: constraints win by default.
 * The user can override by saying things like "even if it changes the melody"
 * or "the most important thing is the energy".
 */
export const DEFAULT_PRECEDENCE: ReadonlyMap<ContrastiveType, ConstraintPrecedence> =
  new Map([
    ['but_keep', 'constraint_first'],
    ['without', 'constraint_first'],
    ['but_not', 'constraint_first'],
    ['except', 'constraint_first'],
    ['instead_of', 'equal'],
    ['rather_than', 'equal'],
    ['just_dont', 'constraint_first'],
    ['while_keeping', 'constraint_first'],
    ['and_leave', 'constraint_first'],
    ['only_change', 'constraint_first'],
  ]);

/**
 * Get the default precedence for a contrastive construction type.
 */
export function getDefaultPrecedence(type: ContrastiveType): ConstraintPrecedence {
  return DEFAULT_PRECEDENCE.get(type) ?? 'constraint_first';
}


// =============================================================================
// Contrastive Pattern Matching
// =============================================================================

/**
 * Known connective patterns that signal contrastive constructions.
 *
 * Each entry maps a surface pattern to a contrastive type and
 * discourse relation. The parser uses these to detect contrastive
 * structure in utterances.
 */
export interface ContrastivePattern {
  /** The connective word(s) that signal this construction. */
  readonly connectives: readonly string[];
  /** What type of contrastive construction this signals. */
  readonly type: ContrastiveType;
  /** The discourse relation. */
  readonly relation: ContrastiveDiscourseRelation;
  /** Whether the constraint clause is typically negated. */
  readonly constraintNegated: boolean;
  /** Example utterance. */
  readonly example: string;
}

/**
 * The canonical inventory of contrastive patterns.
 */
export const CONTRASTIVE_PATTERNS: readonly ContrastivePattern[] = [
  // --- "but keep" family ---
  {
    connectives: ['but keep', 'but maintain', 'but preserve'],
    type: 'but_keep',
    relation: 'contrast',
    constraintNegated: false,
    example: 'Make it brighter but keep the bass steady',
  },
  {
    connectives: ['but leave', 'and leave'],
    type: 'and_leave',
    relation: 'contrast',
    constraintNegated: false,
    example: 'Change the rhythm but leave the melody alone',
  },
  {
    connectives: ['while keeping', 'while maintaining', 'while preserving'],
    type: 'while_keeping',
    relation: 'contrast',
    constraintNegated: false,
    example: 'Simplify the arrangement while keeping the groove tight',
  },

  // --- "without" family ---
  {
    connectives: ['without changing', 'without touching', 'without affecting', 'without altering'],
    type: 'without',
    relation: 'restriction',
    constraintNegated: true,
    example: 'Add more energy without changing the melody',
  },
  {
    connectives: ['without'],
    type: 'without',
    relation: 'restriction',
    constraintNegated: true,
    example: 'Make it louder without distortion',
  },

  // --- "but not" family ---
  {
    connectives: ['but not', 'but don\'t', 'but do not'],
    type: 'but_not',
    relation: 'exception',
    constraintNegated: true,
    example: 'Brighten everything but not the drums',
  },

  // --- "except" family ---
  {
    connectives: ['except', 'except for', 'other than', 'apart from'],
    type: 'except',
    relation: 'exception',
    constraintNegated: false,
    example: 'Quantize everything except the hi-hats',
  },

  // --- "instead of" family ---
  {
    connectives: ['instead of', 'in place of', 'swap for', 'replace with'],
    type: 'instead_of',
    relation: 'correction',
    constraintNegated: false,
    example: 'Use piano instead of strings',
  },

  // --- "rather than" family ---
  {
    connectives: ['rather than', 'not by', 'prefer', 'preferably'],
    type: 'rather_than',
    relation: 'correction',
    constraintNegated: false,
    example: 'Go brighter rather than louder',
  },

  // --- "just don't" family ---
  {
    connectives: ['just don\'t', 'just do not', 'as long as you don\'t', 'provided you don\'t'],
    type: 'just_dont',
    relation: 'restriction',
    constraintNegated: true,
    example: 'Make it punchier, just don\'t clip',
  },

  // --- "only change" family ---
  {
    connectives: ['only change', 'only modify', 'only touch', 'only affect', 'just change'],
    type: 'only_change',
    relation: 'restriction',
    constraintNegated: false,
    example: 'Only change the drums in the chorus',
  },
];

/**
 * Find matching contrastive patterns in an utterance.
 */
export function findContrastivePatterns(
  utterance: string,
): readonly ContrastivePattern[] {
  const lower = utterance.toLowerCase();
  return CONTRASTIVE_PATTERNS.filter(pattern =>
    pattern.connectives.some(conn => lower.includes(conn.toLowerCase())),
  );
}


// =============================================================================
// CPL Generation from Contrastive Constructions
// =============================================================================

/**
 * Describes how a contrastive construction maps to CPL nodes.
 *
 * This is the interface between the parser (which detects contrastive
 * structure) and the semantic composer (which generates CPL).
 */
export interface ContrastiveCPLMapping {
  /** The original construction. */
  readonly construction: ContrastiveConstruction;
  /** CPL goal nodes generated from the goal clause. */
  readonly goalNodes: readonly ContrastiveGoalNode[];
  /** CPL constraint nodes generated from the constraint clause. */
  readonly constraintNodes: readonly ContrastiveConstraintNode[];
  /** Whether the plan must satisfy constraints before optimizing goals. */
  readonly constraintFirst: boolean;
}

/**
 * A goal node generated from the goal side of a contrastive construction.
 */
export interface ContrastiveGoalNode {
  /** The goal type (increase, decrease, set, introduce, remove). */
  readonly goalType: string;
  /** The axis or target. */
  readonly target: string;
  /** The amount (if specified). */
  readonly amount: string | undefined;
  /** Source span in the original utterance. */
  readonly sourceSpan: string;
}

/**
 * A constraint node generated from the constraint side.
 */
export interface ContrastiveConstraintNode {
  /** The constraint type (preserve, exclude, ceiling, replace). */
  readonly constraintType: string;
  /** The target of the constraint. */
  readonly target: string;
  /** Preservation mode (if applicable). */
  readonly preservationMode: PreservationMode | undefined;
  /** Whether this is a hard constraint. */
  readonly hard: boolean;
  /** Source span in the original utterance. */
  readonly sourceSpan: string;
}


// =============================================================================
// Conflict Detection
// =============================================================================

/**
 * Detect conflicts between goal and constraint in a contrastive construction.
 *
 * A conflict exists when the goal CANNOT be satisfied without violating
 * the constraint. For example:
 * - "Transpose everything up but keep the melody exact" → conflict if
 *   melody is part of "everything"
 * - "Make it louder but don't clip" → potential conflict at high levels
 */
export interface ContrastiveConflict {
  /** Human-readable description of the conflict. */
  readonly description: string;
  /** The goal node involved. */
  readonly goalNode: ContrastiveGoalNode;
  /** The constraint node involved. */
  readonly constraintNode: ContrastiveConstraintNode;
  /** Severity: can it be resolved or is it impossible? */
  readonly severity: 'resolvable' | 'impossible';
  /** Suggested resolution (if resolvable). */
  readonly suggestion: string | undefined;
}

/**
 * Check for conflicts between goals and constraints in a contrastive mapping.
 *
 * This is a static check based on target overlap — it does not require
 * executing the plan. More precise conflict detection happens during
 * plan validation.
 */
export function detectContrastiveConflicts(
  mapping: ContrastiveCPLMapping,
): readonly ContrastiveConflict[] {
  const conflicts: ContrastiveConflict[] = [];

  for (const goal of mapping.goalNodes) {
    for (const constraint of mapping.constraintNodes) {
      // Check for direct target overlap
      if (targetsOverlap(goal.target, constraint.target)) {
        const isExact = constraint.preservationMode === 'exact';
        conflicts.push({
          description: `Goal "${goal.goalType}(${goal.target})" may conflict with constraint "${constraint.constraintType}(${constraint.target})"`,
          goalNode: goal,
          constraintNode: constraint,
          severity: isExact ? 'impossible' : 'resolvable',
          suggestion: isExact
            ? `Cannot ${goal.goalType} ${goal.target} while preserving it exactly. Consider using "functional" or "recognizable" preservation.`
            : `Will attempt ${goal.goalType} while maintaining ${constraint.preservationMode ?? 'functional'} preservation of ${constraint.target}.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check if two target specifications overlap.
 *
 * This is a simplified check — full overlap detection requires
 * project context (which entities are in which scope).
 */
function targetsOverlap(target1: string, target2: string): boolean {
  const t1 = target1.toLowerCase();
  const t2 = target2.toLowerCase();

  // Exact match
  if (t1 === t2) return true;

  // "everything/all" overlaps with anything
  if (t1 === 'everything' || t1 === 'all' || t2 === 'everything' || t2 === 'all') {
    return true;
  }

  // "global" overlaps with anything
  if (t1 === 'global' || t2 === 'global') {
    return true;
  }

  return false;
}


// =============================================================================
// Contrastive Semantics Rules (Declarative)
// =============================================================================

/**
 * Normative rules for contrastive construction semantics.
 */
export const CONTRASTIVE_RULES = {
  /**
   * Rule C1: Constraints from "but/without" clauses are HARD by default.
   * They block plan execution if violated. The user can relax them
   * explicitly ("even if it changes the melody").
   */
  C1_CONSTRAINTS_ARE_HARD:
    'Constraints from contrastive constructions are hard (blocking) by default.',

  /**
   * Rule C2: Constraints have higher priority than goals by default.
   * The planner satisfies constraints first, then optimizes goals
   * within the constraint boundary.
   */
  C2_CONSTRAINT_PRIORITY:
    'Constraints outrank goals by default. Goals are optimized within constraint bounds.',

  /**
   * Rule C3: "only change X" implies "preserve everything except X".
   * This is an implicit contrastive construction that generates
   * preservation constraints for all non-targeted entities.
   */
  C3_ONLY_IMPLIES_PRESERVE:
    '"Only change X" generates preservation constraints for all entities not matching X.',

  /**
   * Rule C4: Conflicts between goals and constraints trigger clarification.
   * The system does NOT silently drop goals or relax constraints.
   * It asks the user how to resolve the conflict.
   */
  C4_CONFLICTS_TRIGGER_CLARIFICATION:
    'Goal-constraint conflicts generate clarification questions, not silent resolution.',

  /**
   * Rule C5: Replacement constructions ("instead of") are atomic.
   * "Use piano instead of strings" removes strings AND adds piano
   * as a single atomic operation (both or neither).
   */
  C5_REPLACEMENT_ATOMIC:
    '"Instead of" constructions produce atomic replacement operations.',

  /**
   * Rule C6: "rather than" constructions disambiguate, not constrain.
   * "Go brighter rather than louder" tells the planner which axis
   * to prefer, but does not create a hard constraint against loudness.
   */
  C6_RATHER_THAN_DISAMBIGUATES:
    '"Rather than" constructions express axis preference, not hard constraints.',
} as const;
