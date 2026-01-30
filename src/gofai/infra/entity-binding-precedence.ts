/**
 * GOFAI Infrastructure — Entity Binding Precedence
 *
 * Documents and implements the canonical precedence order for resolving
 * natural language entity references to concrete project entities.
 *
 * The precedence chain is:
 *   1. UI selection (user is literally pointing at something)
 *   2. Explicit reference (user named it: "the chorus", "drums")
 *   3. Salience (most recently mentioned/edited/focused entity)
 *   4. Default (system default for the context)
 *
 * Within each level, sub-precedence rules apply (e.g., exact match
 * beats fuzzy match within "explicit reference").
 *
 * @module gofai/infra/entity-binding-precedence
 * @see gofai_goalA.md Step 071
 * @see gofaimusicplus.md §5 — Reference resolution
 */

import type { EntityType } from '../canon/types';
import type {
  ResolvedEntityRef,
  EntityResolutionResult,
  ResolutionMethod,
} from '../canon/entity-refs';

// =============================================================================
// PRECEDENCE LEVELS
// =============================================================================

/**
 * The canonical precedence levels for entity binding.
 *
 * Higher priority levels are checked first. Within a level,
 * sub-rules determine which candidate wins.
 */
export type PrecedenceLevel =
  | 'selection'    // Priority 1: Current UI selection
  | 'explicit'     // Priority 2: Explicit NL reference
  | 'salience'     // Priority 3: Most salient entity
  | 'default';     // Priority 4: System default

/**
 * A binding candidate at a specific precedence level.
 */
export interface BindingCandidate {
  readonly entity: ResolvedEntityRef;
  readonly level: PrecedenceLevel;
  readonly subLevel: SubPrecedenceLevel;
  readonly confidence: number;
  readonly resolvedVia: ResolutionMethod;
  readonly explanation: string;
}

/**
 * Sub-precedence levels within each main level.
 */
export type SubPrecedenceLevel =
  // Within 'selection'
  | 'direct_selection'          // Entity itself is selected
  | 'container_selection'       // Container of the entity is selected
  | 'child_of_selection'        // Entity is contained by selection

  // Within 'explicit'
  | 'exact_id_match'            // Matched by exact branded ID
  | 'exact_name_match'          // Matched by exact canonical name
  | 'type_and_ordinal_match'    // Matched by "verse 2" pattern
  | 'type_and_position_match'   // Matched by "the last chorus" pattern
  | 'alias_match'               // Matched by an alias name
  | 'fuzzy_match'               // Matched by fuzzy string matching

  // Within 'salience'
  | 'last_edited'               // Most recently edited entity
  | 'last_mentioned'            // Most recently mentioned in discourse
  | 'focus_stack'               // Currently in the focus stack
  | 'frequency'                 // Most frequently mentioned

  // Within 'default'
  | 'type_default'              // Default entity for the expected type
  | 'global_default';           // Global default scope

/**
 * Numeric priority for each sub-level (lower = higher priority).
 */
export const SUB_PRECEDENCE_PRIORITY: Readonly<Record<SubPrecedenceLevel, number>> = {
  // Selection (1xx)
  direct_selection: 100,
  container_selection: 110,
  child_of_selection: 120,

  // Explicit (2xx)
  exact_id_match: 200,
  exact_name_match: 210,
  type_and_ordinal_match: 220,
  type_and_position_match: 230,
  alias_match: 240,
  fuzzy_match: 250,

  // Salience (3xx)
  last_edited: 300,
  last_mentioned: 310,
  focus_stack: 320,
  frequency: 330,

  // Default (4xx)
  type_default: 400,
  global_default: 410,
};

// =============================================================================
// PRECEDENCE RESOLVER
// =============================================================================

/**
 * Resolution context for the precedence resolver.
 */
export interface BindingContext {
  /** Current UI selection (if any) */
  readonly uiSelection?: UISelectionContext;

  /** Expected entity type (from syntactic/semantic analysis) */
  readonly expectedType?: EntityType;

  /** Current dialogue turn number */
  readonly currentTurn: number;

  /** Whether the reference was deictic ("this", "these") */
  readonly isDeictic: boolean;

  /** Whether the reference was anaphoric ("it", "that") */
  readonly isAnaphoric: boolean;

  /** The raw text of the reference */
  readonly rawText: string;
}

/**
 * UI selection context for binding.
 */
export interface UISelectionContext {
  /** The selected entity (if a single entity is selected) */
  readonly selectedEntity?: ResolvedEntityRef;

  /** Multiple selected entities */
  readonly selectedEntities?: readonly ResolvedEntityRef[];

  /** The turn when the selection was made */
  readonly selectionTurn: number;

  /** Whether the selection is still active */
  readonly isActive: boolean;
}

/**
 * Result of precedence-based binding.
 */
export interface BindingResult {
  /** The winning candidate */
  readonly winner: BindingCandidate;

  /** All candidates considered, in precedence order */
  readonly allCandidates: readonly BindingCandidate[];

  /** Why the winner was chosen */
  readonly explanation: string;

  /** Whether the binding is confident (no near ties) */
  readonly isConfident: boolean;
}

/**
 * Resolve entity binding using the canonical precedence chain.
 *
 * This is the central entry point for all entity reference resolution.
 * It checks candidates at each precedence level in order and returns
 * the highest-priority match.
 */
export function resolveByPrecedence(
  candidates: readonly BindingCandidate[],
  context: BindingContext
): EntityResolutionResult {
  if (candidates.length === 0) {
    return {
      status: 'failed',
      reason: 'not_found',
      suggestion: 'No candidates matched the reference.',
    };
  }

  // Sort by precedence (sub-level priority, then confidence)
  const sorted = [...candidates].sort((a, b) => {
    const levelDiff = SUB_PRECEDENCE_PRIORITY[a.subLevel] - SUB_PRECEDENCE_PRIORITY[b.subLevel];
    if (levelDiff !== 0) return levelDiff;
    return b.confidence - a.confidence;
  });

  const best = sorted[0]!;

  // Check for ambiguity at the same precedence level
  if (sorted.length > 1) {
    const second = sorted[1]!;
    const samePrecedence =
      SUB_PRECEDENCE_PRIORITY[best.subLevel] === SUB_PRECEDENCE_PRIORITY[second.subLevel];
    const closeConfidence = Math.abs(best.confidence - second.confidence) < 0.15;

    if (samePrecedence && closeConfidence) {
      return {
        status: 'ambiguous',
        candidates: sorted.map(c => c.entity),
        disambiguationQuestion: formatPrecedenceDisambiguation(sorted, context),
      };
    }
  }

  // Apply deictic constraints
  if (context.isDeictic && best.level !== 'selection') {
    // Deictic references REQUIRE a selection
    if (!context.uiSelection?.isActive) {
      return {
        status: 'failed',
        reason: 'no_selection',
        suggestion: 'You used "this" or "these" but nothing is selected. Please select something first.',
      };
    }
  }

  return {
    status: 'resolved',
    entity: best.entity,
    confidence: best.confidence,
    resolvedVia: best.resolvedVia,
  };
}

// =============================================================================
// PRECEDENCE RULES TABLE
// =============================================================================

/**
 * A precedence rule.
 */
export interface PrecedenceRule {
  readonly id: string;
  readonly level: PrecedenceLevel;
  readonly subLevel: SubPrecedenceLevel;
  readonly description: string;
  readonly rule: string;
  readonly examples: readonly string[];
  readonly testCases: readonly PrecedenceTestCase[];
}

/**
 * A test case for a precedence rule.
 */
export interface PrecedenceTestCase {
  readonly input: string;
  readonly context: string;
  readonly expectedLevel: PrecedenceLevel;
  readonly expectedSubLevel: SubPrecedenceLevel;
  readonly expectedEntity: string;
  readonly rationale: string;
}

/**
 * Canonical precedence rules with test cases.
 */
export const PRECEDENCE_RULES: readonly PrecedenceRule[] = [
  // ===== Level 1: Selection =====
  {
    id: 'prec-001',
    level: 'selection',
    subLevel: 'direct_selection',
    description: 'Selected entity has highest priority',
    rule: 'When the user has an entity selected in the UI, and uses a deictic reference ("this", "these", "here"), the selected entity is the binding target. This overrides all other candidates.',
    examples: [
      '"make this louder" with Chorus 2 selected → targets Chorus 2',
      '"delete these" with notes selected → targets selected notes',
    ],
    testCases: [
      {
        input: 'make this louder',
        context: 'Chorus 2 is selected in the UI',
        expectedLevel: 'selection',
        expectedSubLevel: 'direct_selection',
        expectedEntity: 'Chorus 2',
        rationale: 'Deictic "this" binds to current selection',
      },
      {
        input: 'these notes are wrong',
        context: 'A set of notes is selected',
        expectedLevel: 'selection',
        expectedSubLevel: 'direct_selection',
        expectedEntity: 'selected notes',
        rationale: 'Deictic "these" binds to current multi-selection',
      },
    ],
  },
  {
    id: 'prec-002',
    level: 'selection',
    subLevel: 'container_selection',
    description: 'Container of selected entity inherits priority',
    rule: 'If the user refers to a container entity while a child is selected, the container inherits selection priority. "The drums" when a specific drum note is selected → the drums layer (container).',
    examples: [
      '"make the drums louder" with a drum note selected → targets drums layer',
    ],
    testCases: [
      {
        input: 'make the drums louder',
        context: 'A note on the drums track is selected',
        expectedLevel: 'selection',
        expectedSubLevel: 'container_selection',
        expectedEntity: 'Drums layer',
        rationale: 'Container of selection inherits priority',
      },
    ],
  },

  // ===== Level 2: Explicit Reference =====
  {
    id: 'prec-003',
    level: 'explicit',
    subLevel: 'exact_name_match',
    description: 'Exact name match is strongest explicit reference',
    rule: 'When the user names an entity exactly ("Chorus 2", "the drums"), an exact name match has highest priority among explicit references.',
    examples: [
      '"brighten Chorus 2" → targets Chorus 2 by exact name',
      '"add reverb to the bass" → targets bass layer by exact name',
    ],
    testCases: [
      {
        input: 'brighten Chorus 2',
        context: 'No selection active',
        expectedLevel: 'explicit',
        expectedSubLevel: 'exact_name_match',
        expectedEntity: 'Chorus 2',
        rationale: 'Exact name match for "Chorus 2"',
      },
    ],
  },
  {
    id: 'prec-004',
    level: 'explicit',
    subLevel: 'type_and_ordinal_match',
    description: 'Type + ordinal reference',
    rule: '"Verse 2", "the second bridge", "chorus 3" resolve by section type and ordinal number. This is more specific than bare type reference.',
    examples: [
      '"in verse 2" → targets the second verse section',
      '"the third chorus" → targets chorus with ordinal 3',
    ],
    testCases: [
      {
        input: 'in verse 2',
        context: 'Project has Verse 1, Verse 2, Verse 3',
        expectedLevel: 'explicit',
        expectedSubLevel: 'type_and_ordinal_match',
        expectedEntity: 'Verse 2',
        rationale: 'Type "verse" + ordinal 2 → Verse 2',
      },
    ],
  },
  {
    id: 'prec-005',
    level: 'explicit',
    subLevel: 'type_and_position_match',
    description: 'Type + position reference',
    rule: '"The last chorus", "the first verse" resolve by section type and relative position. "Last" = highest instance number, "first" = instance 1.',
    examples: [
      '"the last chorus" → targets the final chorus in the arrangement',
      '"the first verse" → targets Verse 1',
    ],
    testCases: [
      {
        input: 'the last chorus',
        context: 'Project has Chorus 1, Chorus 2, Chorus 3',
        expectedLevel: 'explicit',
        expectedSubLevel: 'type_and_position_match',
        expectedEntity: 'Chorus 3',
        rationale: '"Last" position selects highest ordinal',
      },
    ],
  },
  {
    id: 'prec-006',
    level: 'explicit',
    subLevel: 'fuzzy_match',
    description: 'Fuzzy name matching is last resort for explicit',
    rule: 'When no exact or structured match is found, fuzzy matching attempts to find a close match. Fuzzy matches require a confidence score ≥ 0.5 and must be at least 0.15 better than the next candidate to avoid ambiguity.',
    examples: [
      '"the drms" (typo) → fuzzy match to "drums" at 0.85 confidence',
      '"the corus" (typo) → fuzzy match to "chorus" at 0.82 confidence',
    ],
    testCases: [
      {
        input: 'the drms',
        context: 'Project has a Drums layer',
        expectedLevel: 'explicit',
        expectedSubLevel: 'fuzzy_match',
        expectedEntity: 'Drums',
        rationale: 'Fuzzy match handles minor typos',
      },
    ],
  },

  // ===== Level 3: Salience =====
  {
    id: 'prec-007',
    level: 'salience',
    subLevel: 'last_edited',
    description: 'Most recently edited entity is most salient',
    rule: 'When a reference is underspecified (e.g., "it", "that"), the most recently edited entity is the primary salience candidate. "Do it again" after editing Chorus 2 → targets Chorus 2.',
    examples: [
      '"do it again" after editing the chorus → targets the chorus',
      '"make it louder" after adding notes to bass → targets the bass',
    ],
    testCases: [
      {
        input: 'do it again',
        context: 'Last edit was on Chorus 2',
        expectedLevel: 'salience',
        expectedSubLevel: 'last_edited',
        expectedEntity: 'Chorus 2',
        rationale: 'Anaphoric "it" resolves to last-edited entity',
      },
    ],
  },
  {
    id: 'prec-008',
    level: 'salience',
    subLevel: 'last_mentioned',
    description: 'Most recently mentioned entity in discourse',
    rule: 'If the user mentioned an entity in the previous turn(s), it has high salience. "Make the chorus brighter. Now make it louder too." → "it" = the chorus.',
    examples: [
      '"Make the chorus brighter." + "Now make it louder too." → it = chorus',
    ],
    testCases: [
      {
        input: 'make it louder too',
        context: 'Previous turn: "make the chorus brighter"',
        expectedLevel: 'salience',
        expectedSubLevel: 'last_mentioned',
        expectedEntity: 'Chorus',
        rationale: 'Anaphoric "it" resolves to last-mentioned entity',
      },
    ],
  },
  {
    id: 'prec-009',
    level: 'salience',
    subLevel: 'focus_stack',
    description: 'Focus stack provides structural salience',
    rule: 'Entities in the current focus stack (board → deck → layer) are inherently salient. "Make it brighter" when the drums deck is in focus → targets the drums.',
    examples: [
      '"make it brighter" with drums deck focused → targets drums',
    ],
    testCases: [
      {
        input: 'make it brighter',
        context: 'Drums deck is focused, no recent edits/mentions',
        expectedLevel: 'salience',
        expectedSubLevel: 'focus_stack',
        expectedEntity: 'Drums',
        rationale: 'Focus stack provides contextual salience',
      },
    ],
  },

  // ===== Level 4: Default =====
  {
    id: 'prec-010',
    level: 'default',
    subLevel: 'type_default',
    description: 'Default entity for the expected type',
    rule: 'When nothing else resolves, the system uses a type-appropriate default. For sections, the current playback section. For layers, the first visible layer. For parameters, the most commonly edited parameter.',
    examples: [
      '"make it louder" with no context → targets global volume (default param)',
    ],
    testCases: [
      {
        input: 'make it louder',
        context: 'No selection, no recent edits, no focus',
        expectedLevel: 'default',
        expectedSubLevel: 'type_default',
        expectedEntity: 'Global volume',
        rationale: 'Default parameter for volume changes',
      },
    ],
  },
  {
    id: 'prec-011',
    level: 'default',
    subLevel: 'global_default',
    description: 'Global scope as last resort',
    rule: 'If no entity can be resolved at all, the system targets the global scope (entire project). This is always accompanied by a confirmation question.',
    examples: [
      '"brighten it" with no context → "Do you want to brighten the entire project?"',
    ],
    testCases: [
      {
        input: 'brighten it',
        context: 'No context at all',
        expectedLevel: 'default',
        expectedSubLevel: 'global_default',
        expectedEntity: 'Global scope',
        rationale: 'Last resort: global scope with confirmation',
      },
    ],
  },
];

// =============================================================================
// PRECEDENCE CONFLICT RESOLUTION
// =============================================================================

/**
 * A precedence conflict that was detected and resolved.
 */
export interface PrecedenceConflict {
  readonly conflictType: PrecedenceConflictType;
  readonly candidates: readonly BindingCandidate[];
  readonly resolution: string;
  readonly winner: BindingCandidate;
}

/**
 * Types of precedence conflicts.
 */
export type PrecedenceConflictType =
  | 'selection_vs_explicit'     // "Make the bass louder" but drums selected
  | 'explicit_vs_salience'     // Named entity vs most recently mentioned
  | 'multiple_explicit'        // Multiple entities match the name
  | 'type_ambiguity'           // "The bass" could be layer, card, or role
  | 'ordinal_ambiguity';       // "The second one" in mixed context

/**
 * Canonical conflict resolution strategies.
 */
export const CONFLICT_RESOLUTIONS: readonly {
  readonly conflictType: PrecedenceConflictType;
  readonly strategy: string;
  readonly rule: string;
}[] = [
  {
    conflictType: 'selection_vs_explicit',
    strategy: 'Explicit wins over selection for non-deictic references',
    rule: 'When the user explicitly names an entity ("make the bass louder") but a different entity is selected (drums), the explicit reference wins. The selection only has priority for deictic references ("this", "these"). This prevents the confusing behavior of edits going to unexpected targets.',
  },
  {
    conflictType: 'explicit_vs_salience',
    strategy: 'Explicit always wins over salience',
    rule: 'When the user names an entity explicitly, it always beats salience-based resolution. "Make the drums louder" targets the drums even if the chorus was most recently edited.',
  },
  {
    conflictType: 'multiple_explicit',
    strategy: 'Ask for clarification with ordered options',
    rule: 'When multiple entities match an explicit reference, present them as ordered options. Use salience to suggest a default but do not auto-select it.',
  },
  {
    conflictType: 'type_ambiguity',
    strategy: 'Use syntactic context to determine type',
    rule: '"The bass" in "on the bass" → layer (prepositional scope). "The bass" in "add reverb to the bass" → layer/deck. "The bass" in "the bass card" → card. If ambiguous, prefer layer (most common).',
  },
  {
    conflictType: 'ordinal_ambiguity',
    strategy: 'Ask for clarification with context',
    rule: '"The second one" requires knowing which entity type was being discussed. Use discourse history to determine the type, then resolve the ordinal within that type.',
  },
];

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format a precedence disambiguation question.
 */
function formatPrecedenceDisambiguation(
  candidates: readonly BindingCandidate[],
  context: BindingContext
): string {
  const options = candidates
    .slice(0, 4)
    .map(c => `"${c.entity.displayName}" (${c.explanation})`)
    .join(', ');
  return `"${context.rawText}" could refer to: ${options}. Which do you mean?`;
}

/**
 * Format a binding explanation for the UI.
 *
 * Returns strings like:
 *   - "'the chorus' → Chorus 2 (bars 49–65) [exact name match]"
 *   - "'it' → Drums layer [last edited]"
 */
export function formatBindingTrace(
  rawText: string,
  candidate: BindingCandidate
): string {
  const levelLabel = formatPrecedenceLevel(candidate.level, candidate.subLevel);
  return `'${rawText}' → ${candidate.entity.displayName} [${levelLabel}]`;
}

/**
 * Format a precedence level for display.
 */
function formatPrecedenceLevel(
  _level: PrecedenceLevel,
  subLevel: SubPrecedenceLevel
): string {
  switch (subLevel) {
    case 'direct_selection': return 'selected in UI';
    case 'container_selection': return 'container of selection';
    case 'child_of_selection': return 'child of selection';
    case 'exact_id_match': return 'exact ID match';
    case 'exact_name_match': return 'exact name match';
    case 'type_and_ordinal_match': return 'type + ordinal';
    case 'type_and_position_match': return 'type + position';
    case 'alias_match': return 'alias match';
    case 'fuzzy_match': return 'fuzzy match';
    case 'last_edited': return 'last edited';
    case 'last_mentioned': return 'last mentioned';
    case 'focus_stack': return 'in focus';
    case 'frequency': return 'frequently mentioned';
    case 'type_default': return 'default for type';
    case 'global_default': return 'global default';
  }
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Summary rules for entity binding precedence.
 */
export const BINDING_PRECEDENCE_SUMMARY_RULES: readonly {
  readonly id: string;
  readonly description: string;
  readonly rule: string;
}[] = [
  {
    id: 'bp-001',
    description: 'Four-level precedence chain',
    rule: 'Entity binding follows a strict four-level precedence: selection > explicit > salience > default. Higher levels always beat lower levels, except that explicit references beat selection for non-deictic references.',
  },
  {
    id: 'bp-002',
    description: 'Deictic requires selection',
    rule: 'Deictic references ("this", "these", "here") MUST resolve to the current UI selection. If nothing is selected, the reference fails — it never falls through to salience or default.',
  },
  {
    id: 'bp-003',
    description: 'Explicit trumps selection for named references',
    rule: 'When the user explicitly names an entity ("make the bass louder"), it wins even if something else is selected. This prevents confusion from "I said bass but it changed the drums because drums was selected."',
  },
  {
    id: 'bp-004',
    description: 'Ambiguity triggers clarification, not guessing',
    rule: 'When candidates at the same precedence level have confidence within 0.15, the system asks for clarification. It never silently picks one over another.',
  },
  {
    id: 'bp-005',
    description: 'Binding provenance is always recorded',
    rule: 'Every binding records the precedence level, sub-level, confidence score, and resolution method. This is part of the determinism and auditability guarantees.',
  },
  {
    id: 'bp-006',
    description: 'The binding trace is shown in preview',
    rule: 'In the preview-first UX, every resolved binding is shown to the user as "\'the chorus\' → Chorus 2 (bars 49–65)". The user must be able to see and correct bindings before execution.',
  },
];
