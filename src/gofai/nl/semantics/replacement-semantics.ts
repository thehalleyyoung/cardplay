/**
 * GOFAI Semantics — Replacement and Substitution
 *
 * Defines the semantics of "instead", "rather than", and other replacement
 * constructions as plan replacement with explicit rollback.
 *
 * ## Linguistic Background
 *
 * Replacement expressions in music editing commands have specific semantics:
 *
 * - **"instead of X, do Y"**: Replace plan X with plan Y (no X applied)
 * - **"rather than X, Y"**: Prefer Y over X (X is rejected)
 * - **"swap X for Y"**: Exchange X with Y (bidirectional replacement)
 * - **"replace X with Y"**: Remove X and add Y (explicit substitution)
 * - **"undo that and do Y instead"**: Rollback last action + apply Y
 * - **"actually, do Y"**: Implicit replacement of most recent plan
 * - **"never mind, do Y"**: Cancel current + apply Y
 * - **"on second thought, Y"**: Reconsider + replace with Y
 *
 * ## Rollback Semantics
 *
 * When a replacement refers to an already-applied plan, the system must:
 * 1. Identify the plan to be rolled back
 * 2. Check whether rollback is possible (undo identity exists)
 * 3. Apply the rollback (inverse patch or snapshot restore)
 * 4. Apply the replacement plan
 * 5. Update plan history to record the replacement chain
 *
 * ## Plan State Machine
 *
 * Plans can be in one of these states:
 * - **proposed**: Not yet applied; can be freely replaced
 * - **previewing**: Being previewed; replacement cancels the preview
 * - **applied**: Already applied; replacement requires rollback
 * - **committed**: Part of committed history; replacement may be blocked
 *
 * @module gofai/nl/semantics/replacement-semantics
 * @see gofai_goalA.md Step 095
 */

// =============================================================================
// REPLACEMENT TYPES
// =============================================================================

/**
 * A replacement expression extracted from user input.
 */
export interface ReplacementExpression {
  /** The kind of replacement */
  readonly kind: ReplacementKind;

  /** What is being replaced (the "old" plan) */
  readonly replaced: ReplacedTarget;

  /** What replaces it (the "new" plan) */
  readonly replacement: ReplacementAction;

  /** Whether rollback is needed (old plan was already applied) */
  readonly requiresRollback: boolean;

  /** The surface form that triggered this interpretation */
  readonly trigger: string;

  /** Confidence in this interpretation (0–1) */
  readonly confidence: number;

  /** The source text */
  readonly sourceText: string;
}

/**
 * Kinds of replacement expression.
 */
export type ReplacementKind =
  | 'explicit_instead'    // "instead of X, do Y"
  | 'explicit_rather'     // "rather than X, do Y"
  | 'explicit_swap'       // "swap X for Y"
  | 'explicit_replace'    // "replace X with Y"
  | 'implicit_correction' // "actually, do Y" (replaces most recent)
  | 'implicit_cancel'     // "never mind, do Y" (cancels current)
  | 'implicit_reconsider' // "on second thought, Y" (replaces recent)
  | 'undo_and_replace'    // "undo that and do Y instead"
  | 'preference'          // "I'd prefer Y over X" (soft replacement)
  | 'try_alternative';    // "let's try Y instead" (tentative replacement)

// =============================================================================
// REPLACED TARGET — what is being replaced
// =============================================================================

/**
 * The target of replacement: what is being replaced.
 */
export type ReplacedTarget =
  | ExplicitReplacedTarget
  | ImplicitReplacedTarget
  | ReferentialReplacedTarget
  | HistoricalReplacedTarget;

/**
 * An explicitly named replacement target.
 * "Instead of reverb, use delay" — the explicit target is "reverb".
 */
export interface ExplicitReplacedTarget {
  readonly type: 'explicit';
  /** The text describing what is being replaced */
  readonly description: string;
  /** Whether this refers to a plan step, a parameter value, or a whole plan */
  readonly granularity: ReplacementGranularity;
}

/**
 * An implicit replacement target (most recent action/plan).
 * "Actually, make it brighter" — replaces whatever was just done.
 */
export interface ImplicitReplacedTarget {
  readonly type: 'implicit';
  /** How far back to look for the replaced target */
  readonly recency: 'most_recent' | 'current_preview' | 'last_applied' | 'last_n';
  /** If recency is 'last_n', how many steps back */
  readonly n?: number;
}

/**
 * A referential replacement target (pronoun or demonstrative).
 * "Instead of that, do Y" — "that" refers to a salient plan.
 */
export interface ReferentialReplacedTarget {
  readonly type: 'referential';
  /** The referring expression */
  readonly expression: string;
  /** The pronoun/demonstrative used */
  readonly referenceType: 'that' | 'this' | 'those' | 'it' | 'the_last_one' | 'what_you_just_did';
}

/**
 * A historical replacement target (by plan ID or description).
 * "Undo the reverb change" — targets a specific past action.
 */
export interface HistoricalReplacedTarget {
  readonly type: 'historical';
  /** Description of the historical action */
  readonly description: string;
  /** Optional plan ID if resolvable */
  readonly planId?: string;
  /** How far back in history to search */
  readonly searchDepth: number;
}

/**
 * Granularity of what is being replaced.
 */
export type ReplacementGranularity =
  | 'whole_plan'       // Replace the entire plan
  | 'plan_step'        // Replace one step of a multi-step plan
  | 'parameter_value'  // Replace a parameter value within a step
  | 'scope'            // Replace the scope/target of a plan
  | 'constraint';      // Replace a constraint on a plan

// =============================================================================
// REPLACEMENT ACTION — what replaces the target
// =============================================================================

/**
 * The replacement action: what replaces the old target.
 */
export type ReplacementAction =
  | NewPlanAction
  | ModifiedPlanAction
  | NullAction
  | DeferredAction;

/**
 * Replace with an entirely new plan.
 * "Instead of reverb, add delay"
 */
export interface NewPlanAction {
  readonly type: 'new_plan';
  /** The text describing the new action */
  readonly description: string;
}

/**
 * Replace with a modified version of the original plan.
 * "Instead of a lot of reverb, just a little"
 */
export interface ModifiedPlanAction {
  readonly type: 'modified_plan';
  /** The text describing the modification */
  readonly description: string;
  /** What kind of modification */
  readonly modification: PlanModificationType;
}

/**
 * Replace with nothing (pure cancellation).
 * "Never mind" / "Cancel that"
 */
export interface NullAction {
  readonly type: 'null';
  /** The cancellation phrase */
  readonly phrase: string;
}

/**
 * Replace with a deferred choice.
 * "Let me think about it" / "Skip that for now"
 */
export interface DeferredAction {
  readonly type: 'deferred';
  /** The deferral phrase */
  readonly phrase: string;
  /** Whether to remember the original plan for later */
  readonly rememberOriginal: boolean;
}

/**
 * Types of plan modification (when replacing with a variant).
 */
export type PlanModificationType =
  | 'scale'           // Same operation, different magnitude
  | 'retarget'        // Same operation, different target
  | 'reparameterize'  // Same operation, different parameters
  | 'constrain'       // Same operation, with additional constraints
  | 'relax'           // Same operation, with fewer constraints
  | 'invert';         // Opposite operation (brighten→darken)

// =============================================================================
// PLAN STATE AND ROLLBACK
// =============================================================================

/**
 * States a plan can be in, determining rollback requirements.
 */
export type PlanState =
  | 'proposed'     // Not yet applied; can be freely replaced
  | 'previewing'   // Being previewed; replacement cancels preview
  | 'applied'      // Already applied; requires rollback
  | 'committed';   // Part of committed history; may be blocked

/**
 * Rollback requirements for a replacement.
 */
export interface RollbackRequirement {
  /** The state of the plan being replaced */
  readonly planState: PlanState;

  /** Whether rollback is needed */
  readonly needsRollback: boolean;

  /** Whether rollback is possible */
  readonly rollbackPossible: boolean;

  /** If rollback is impossible, why */
  readonly blockReason?: string;

  /** The rollback strategy to use */
  readonly strategy: RollbackStrategy;

  /** Dependencies that must also be rolled back */
  readonly cascadeDependencies: readonly string[];

  /** Warning to show the user */
  readonly userWarning?: string;
}

/**
 * Strategies for rolling back an applied plan.
 */
export type RollbackStrategy =
  | InversePatchRollback
  | SnapshotRestoreRollback
  | ManualRollback
  | NoRollbackNeeded;

/**
 * Roll back by applying the inverse diff/patch.
 * This is the preferred strategy for atomic edits.
 */
export interface InversePatchRollback {
  readonly type: 'inverse_patch';
  /** The undo identity of the plan to reverse */
  readonly undoId: string;
  /** Whether the inverse is exact or approximate */
  readonly exact: boolean;
}

/**
 * Roll back by restoring a snapshot.
 * Used when inverse patches are unavailable or unreliable.
 */
export interface SnapshotRestoreRollback {
  readonly type: 'snapshot_restore';
  /** The snapshot to restore to */
  readonly snapshotId: string;
  /** Whether other changes since the snapshot will be lost */
  readonly losesIntermediateChanges: boolean;
}

/**
 * Manual rollback (user must undo manually).
 * Used as a last resort when automated rollback is impossible.
 */
export interface ManualRollback {
  readonly type: 'manual';
  /** Instructions for the user */
  readonly instructions: string;
}

/**
 * No rollback needed (plan was not yet applied).
 */
export interface NoRollbackNeeded {
  readonly type: 'none';
}

// =============================================================================
// REPLACEMENT RESULT
// =============================================================================

/**
 * Result of processing a replacement expression.
 */
export interface ReplacementResult {
  /** The original replacement expression */
  readonly expression: ReplacementExpression;

  /** Whether the replacement was successfully processed */
  readonly success: boolean;

  /** The rollback requirement */
  readonly rollback: RollbackRequirement;

  /** The replacement plan to execute */
  readonly newPlan: ReplacementAction;

  /** Explanation for the user */
  readonly explanation: string;

  /** Warnings, if any */
  readonly warnings: readonly string[];

  /** Whether user confirmation is needed before proceeding */
  readonly needsConfirmation: boolean;

  /** Confirmation prompt if needed */
  readonly confirmationPrompt?: string;
}

// =============================================================================
// REPLACEMENT TRIGGER PATTERNS
// =============================================================================

/**
 * A pattern that signals a replacement expression.
 */
export interface ReplacementPattern {
  /** Unique ID */
  readonly id: string;

  /** Surface forms that trigger this pattern */
  readonly surfaceForms: readonly string[];

  /** Regular expressions for more complex matching */
  readonly regexPatterns: readonly string[];

  /** The replacement kind this pattern produces */
  readonly kind: ReplacementKind;

  /** Whether the replaced target is explicit or implicit */
  readonly targetExplicit: boolean;

  /** Whether the replacement action is explicit or implicit */
  readonly actionExplicit: boolean;

  /** Default granularity if not otherwise determined */
  readonly defaultGranularity: ReplacementGranularity;

  /** Examples */
  readonly examples: readonly ReplacementExample[];

  /** Description */
  readonly description: string;
}

export interface ReplacementExample {
  readonly utterance: string;
  readonly replaced: string;
  readonly replacement: string;
  readonly requiresRollback: boolean;
}

/**
 * Canonical replacement patterns.
 */
export const REPLACEMENT_PATTERNS: readonly ReplacementPattern[] = [
  // === INSTEAD OF ===
  {
    id: 'instead_of',
    surfaceForms: ['instead of', 'in place of', 'in lieu of'],
    regexPatterns: [
      'instead\\s+of\\s+(.+?)\\s*,\\s*(.+)',
      'in\\s+place\\s+of\\s+(.+?)\\s*,\\s*(.+)',
    ],
    kind: 'explicit_instead',
    targetExplicit: true,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Instead of reverb, add delay',
        replaced: 'reverb',
        replacement: 'delay',
        requiresRollback: false,
      },
      {
        utterance: 'Instead of brightening everything, just brighten the chorus',
        replaced: 'brightening everything',
        replacement: 'just brighten the chorus',
        requiresRollback: false,
      },
      {
        utterance: 'In place of the kick pattern, use a four-on-the-floor',
        replaced: 'the kick pattern',
        replacement: 'a four-on-the-floor',
        requiresRollback: true,
      },
    ],
    description: 'Explicit replacement: "instead of X, do Y". X may or may not be applied yet.',
  },

  // === RATHER THAN ===
  {
    id: 'rather_than',
    surfaceForms: ['rather than', 'as opposed to', 'over'],
    regexPatterns: [
      'rather\\s+than\\s+(.+?)\\s*,\\s*(.+)',
      '(.+?)\\s+rather\\s+than\\s+(.+)',
    ],
    kind: 'explicit_rather',
    targetExplicit: true,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Rather than reverb, use delay',
        replaced: 'reverb',
        replacement: 'delay',
        requiresRollback: false,
      },
      {
        utterance: 'Brighten the chorus rather than the verse',
        replaced: 'the verse',
        replacement: 'the chorus',
        requiresRollback: false,
      },
      {
        utterance: 'I\'d prefer delay over reverb',
        replaced: 'reverb',
        replacement: 'delay',
        requiresRollback: false,
      },
    ],
    description: 'Preference replacement: "rather than X, Y" or "Y rather than X".',
  },

  // === SWAP ===
  {
    id: 'swap',
    surfaceForms: ['swap', 'switch', 'exchange', 'trade'],
    regexPatterns: [
      'swap\\s+(.+?)\\s+(?:for|with)\\s+(.+)',
      'switch\\s+(.+?)\\s+(?:to|with)\\s+(.+)',
      'exchange\\s+(.+?)\\s+(?:for|with)\\s+(.+)',
    ],
    kind: 'explicit_swap',
    targetExplicit: true,
    actionExplicit: true,
    defaultGranularity: 'parameter_value',
    examples: [
      {
        utterance: 'Swap the reverb for delay',
        replaced: 'reverb',
        replacement: 'delay',
        requiresRollback: true,
      },
      {
        utterance: 'Switch to a minor key',
        replaced: 'current key',
        replacement: 'minor key',
        requiresRollback: true,
      },
      {
        utterance: 'Exchange the snare for a rim shot',
        replaced: 'snare',
        replacement: 'rim shot',
        requiresRollback: true,
      },
    ],
    description: 'Bidirectional swap: "swap X for Y". Both X removal and Y addition.',
  },

  // === REPLACE WITH ===
  {
    id: 'replace_with',
    surfaceForms: ['replace', 'substitute', 'change to', 'switch to', 'use instead'],
    regexPatterns: [
      'replace\\s+(.+?)\\s+with\\s+(.+)',
      'substitute\\s+(.+?)\\s+(?:for|with)\\s+(.+)',
      'change\\s+(.+?)\\s+to\\s+(.+)',
    ],
    kind: 'explicit_replace',
    targetExplicit: true,
    actionExplicit: true,
    defaultGranularity: 'parameter_value',
    examples: [
      {
        utterance: 'Replace the pad with a string section',
        replaced: 'the pad',
        replacement: 'a string section',
        requiresRollback: true,
      },
      {
        utterance: 'Substitute a dotted rhythm for the straight one',
        replaced: 'the straight one',
        replacement: 'a dotted rhythm',
        requiresRollback: true,
      },
      {
        utterance: 'Change the tempo to 120',
        replaced: 'current tempo',
        replacement: '120',
        requiresRollback: true,
      },
    ],
    description: 'Explicit substitution: "replace X with Y".',
  },

  // === ACTUALLY / CORRECTION ===
  {
    id: 'actually',
    surfaceForms: ['actually', 'wait', 'hold on', 'scratch that'],
    regexPatterns: [
      'actually\\s*,?\\s*(.+)',
      'wait\\s*,?\\s*(.+)',
      'scratch\\s+that\\s*,?\\s*(.+)',
    ],
    kind: 'implicit_correction',
    targetExplicit: false,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Actually, make it darker',
        replaced: '(most recent plan)',
        replacement: 'make it darker',
        requiresRollback: true,
      },
      {
        utterance: 'Wait, I meant the chorus',
        replaced: '(current scope)',
        replacement: 'the chorus',
        requiresRollback: false,
      },
      {
        utterance: 'Scratch that, add a pad instead',
        replaced: '(most recent plan)',
        replacement: 'add a pad',
        requiresRollback: true,
      },
    ],
    description: 'Implicit correction: "actually, Y" replaces the most recent action.',
  },

  // === NEVER MIND / CANCEL ===
  {
    id: 'never_mind',
    surfaceForms: ['never mind', 'forget it', 'cancel', 'don\'t bother', 'skip it'],
    regexPatterns: [
      'never\\s+mind\\s*,?\\s*(.*)',
      'forget\\s+(?:it|that)\\s*,?\\s*(.*)',
      'cancel\\s+(?:that|it)\\s*,?\\s*(.*)',
    ],
    kind: 'implicit_cancel',
    targetExplicit: false,
    actionExplicit: false,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Never mind',
        replaced: '(current plan)',
        replacement: '(nothing)',
        requiresRollback: true,
      },
      {
        utterance: 'Never mind, do something else',
        replaced: '(current plan)',
        replacement: 'something else',
        requiresRollback: true,
      },
      {
        utterance: 'Forget it, let\'s move on',
        replaced: '(current plan)',
        replacement: '(nothing)',
        requiresRollback: true,
      },
    ],
    description: 'Cancellation: "never mind" cancels the current or most recent plan.',
  },

  // === ON SECOND THOUGHT ===
  {
    id: 'reconsider',
    surfaceForms: ['on second thought', 'thinking about it', 'come to think of it', 'you know what'],
    regexPatterns: [
      'on\\s+second\\s+thought\\s*,?\\s*(.+)',
      'thinking\\s+about\\s+it\\s*,?\\s*(.+)',
      'you\\s+know\\s+what\\s*,?\\s*(.+)',
    ],
    kind: 'implicit_reconsider',
    targetExplicit: false,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'On second thought, let\'s keep it dry',
        replaced: '(recent plan involving wet effects)',
        replacement: 'keep it dry',
        requiresRollback: true,
      },
      {
        utterance: 'You know what, make the whole thing brighter',
        replaced: '(recent plan)',
        replacement: 'make the whole thing brighter',
        requiresRollback: true,
      },
    ],
    description: 'Reconsideration: "on second thought, Y" replaces a recently decided plan.',
  },

  // === UNDO AND REPLACE ===
  {
    id: 'undo_replace',
    surfaceForms: ['undo that and', 'undo and', 'revert and', 'roll back and'],
    regexPatterns: [
      'undo\\s+(?:that|it|the\\s+last\\s+(?:change|edit))\\s+and\\s+(.+)',
      'revert\\s+(?:that|it)\\s+and\\s+(.+)',
      'roll\\s+back\\s+and\\s+(.+)',
    ],
    kind: 'undo_and_replace',
    targetExplicit: false,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Undo that and add delay instead',
        replaced: '(last applied change)',
        replacement: 'add delay',
        requiresRollback: true,
      },
      {
        utterance: 'Revert that and try a different approach',
        replaced: '(last applied change)',
        replacement: 'a different approach',
        requiresRollback: true,
      },
    ],
    description: 'Explicit undo+replace: "undo that and do Y".',
  },

  // === LET'S TRY / TENTATIVE ===
  {
    id: 'try_instead',
    surfaceForms: ['let\'s try', 'how about', 'what if we', 'what about', 'maybe'],
    regexPatterns: [
      'let\'?s\\s+try\\s+(.+?)\\s+instead',
      'how\\s+about\\s+(.+?)\\s+instead',
      'what\\s+if\\s+we\\s+(.+?)\\s+instead',
    ],
    kind: 'try_alternative',
    targetExplicit: false,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'Let\'s try delay instead',
        replaced: '(current effect)',
        replacement: 'delay',
        requiresRollback: true,
      },
      {
        utterance: 'How about making it darker instead?',
        replaced: '(current plan)',
        replacement: 'making it darker',
        requiresRollback: true,
      },
      {
        utterance: 'What if we use a different chord voicing?',
        replaced: '(current voicing)',
        replacement: 'a different chord voicing',
        requiresRollback: false,
      },
    ],
    description: 'Tentative replacement: "let\'s try Y instead" suggests an alternative.',
  },

  // === PREFERENCE ===
  {
    id: 'prefer',
    surfaceForms: ['I\'d prefer', 'I prefer', 'I\'d rather', 'better to', 'I like X better'],
    regexPatterns: [
      'I\'?d?\\s+(?:prefer|rather)\\s+(.+?)\\s+(?:over|than|to)\\s+(.+)',
      'better\\s+to\\s+(.+?)\\s+than\\s+(.+)',
    ],
    kind: 'preference',
    targetExplicit: true,
    actionExplicit: true,
    defaultGranularity: 'whole_plan',
    examples: [
      {
        utterance: 'I\'d prefer delay over reverb',
        replaced: 'reverb',
        replacement: 'delay',
        requiresRollback: false,
      },
      {
        utterance: 'I\'d rather keep it simple than add more layers',
        replaced: 'add more layers',
        replacement: 'keep it simple',
        requiresRollback: false,
      },
    ],
    description: 'Preference expression: "I\'d prefer Y over X".',
  },
];

// Build lookup maps
const _patternByForm = new Map<string, ReplacementPattern>();
for (const pattern of REPLACEMENT_PATTERNS) {
  for (const form of pattern.surfaceForms) {
    _patternByForm.set(form.toLowerCase(), pattern);
  }
}

const _patternById = new Map<string, ReplacementPattern>();
for (const pattern of REPLACEMENT_PATTERNS) {
  _patternById.set(pattern.id, pattern);
}

/**
 * Look up a replacement pattern by ID.
 */
export function getReplacementPatternById(id: string): ReplacementPattern | undefined {
  return _patternById.get(id);
}

// =============================================================================
// REPLACEMENT DETECTION
// =============================================================================

/**
 * A detected replacement trigger in text.
 */
export interface DetectedReplacement {
  readonly pattern: ReplacementPattern;
  readonly surfaceForm: string;
  readonly position: number;
  readonly length: number;
  readonly capturedGroups: readonly string[];
}

/**
 * Detect replacement expressions in text.
 */
export function detectReplacements(text: string): readonly DetectedReplacement[] {
  const results: DetectedReplacement[] = [];

  for (const pattern of REPLACEMENT_PATTERNS) {
    // Check surface forms first
    for (const form of pattern.surfaceForms) {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(form.toLowerCase());
      if (idx >= 0) {
        // Verify word boundaries
        const before = idx > 0 ? (lower[idx - 1] ?? ' ') : ' ';
        const afterIdx = idx + form.length;
        const after = afterIdx < lower.length ? (lower[afterIdx] ?? ' ') : ' ';

        if (/[\s,.'"]/.test(before) && /[\s,.'"]/.test(after)) {
          results.push({
            pattern,
            surfaceForm: form,
            position: idx,
            length: form.length,
            capturedGroups: [],
          });
        }
      }
    }

    // Check regex patterns
    for (const regexStr of pattern.regexPatterns) {
      const regex = new RegExp(regexStr, 'i');
      const match = regex.exec(text);
      if (match) {
        const groups: string[] = [];
        for (let i = 1; i < match.length; i++) {
          const captured = match[i];
          if (captured !== undefined) {
            groups.push(captured);
          }
        }

        // Avoid duplicates at same position
        const existing = results.find(
          r => r.pattern.id === pattern.id && Math.abs(r.position - match.index) < 5,
        );
        if (!existing) {
          results.push({
            pattern,
            surfaceForm: match[0],
            position: match.index,
            length: match[0].length,
            capturedGroups: groups,
          });
        }
      }
    }
  }

  // Sort by position and deduplicate
  const deduped = new Map<string, DetectedReplacement>();
  for (const r of results) {
    const key = `${r.pattern.id}:${r.position}`;
    const existing = deduped.get(key);
    if (!existing || r.length > existing.length) {
      deduped.set(key, r);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.position - b.position);
}

// =============================================================================
// ROLLBACK ANALYSIS
// =============================================================================

/**
 * Analyze the rollback requirements for a replacement.
 */
export function analyzeRollback(
  planState: PlanState,
  hasDependents: boolean,
): RollbackRequirement {
  switch (planState) {
    case 'proposed': {
      return {
        planState,
        needsRollback: false,
        rollbackPossible: true,
        strategy: { type: 'none' },
        cascadeDependencies: [],
      };
    }

    case 'previewing': {
      return {
        planState,
        needsRollback: false,
        rollbackPossible: true,
        strategy: { type: 'none' },
        cascadeDependencies: [],
        userWarning: 'The preview will be cancelled.',
      };
    }

    case 'applied': {
      if (hasDependents) {
        return {
          planState,
          needsRollback: true,
          rollbackPossible: true,
          strategy: {
            type: 'inverse_patch',
            undoId: '', // To be filled by the executor
            exact: true,
          },
          cascadeDependencies: [], // To be filled by the executor
          userWarning: 'This change has dependent edits that may also need to be rolled back.',
        };
      }
      return {
        planState,
        needsRollback: true,
        rollbackPossible: true,
        strategy: {
          type: 'inverse_patch',
          undoId: '', // To be filled by the executor
          exact: true,
        },
        cascadeDependencies: [],
      };
    }

    case 'committed': {
      return {
        planState,
        needsRollback: true,
        rollbackPossible: false,
        blockReason: 'This change has been committed and cannot be automatically rolled back.',
        strategy: {
          type: 'manual',
          instructions: 'Use the project history to find and revert this change.',
        },
        cascadeDependencies: [],
        userWarning: 'This change is committed. Manual undo may be needed.',
      };
    }
  }
}

// =============================================================================
// REPLACEMENT CHAIN — tracking replacement history
// =============================================================================

/**
 * A chain of replacements, tracking what was replaced by what.
 */
export interface ReplacementChain {
  /** The original plan description */
  readonly originalDescription: string;

  /** The chain of replacements (in chronological order) */
  readonly links: readonly ReplacementLink[];

  /** The current active plan (the last link's replacement) */
  readonly currentDescription: string;

  /** Total number of replacements */
  readonly length: number;
}

/**
 * A single link in a replacement chain.
 */
export interface ReplacementLink {
  /** What was replaced */
  readonly replaced: string;

  /** What replaced it */
  readonly replacement: string;

  /** The replacement kind */
  readonly kind: ReplacementKind;

  /** When the replacement happened (dialogue turn number) */
  readonly turn: number;

  /** Whether rollback was needed and applied */
  readonly rolledBack: boolean;
}

/**
 * Create a new replacement chain.
 */
export function createReplacementChain(originalDescription: string): ReplacementChain {
  return {
    originalDescription,
    links: [],
    currentDescription: originalDescription,
    length: 0,
  };
}

/**
 * Add a link to a replacement chain.
 */
export function addReplacementLink(
  chain: ReplacementChain,
  link: ReplacementLink,
): ReplacementChain {
  return {
    ...chain,
    links: [...chain.links, link],
    currentDescription: link.replacement,
    length: chain.length + 1,
  };
}

/**
 * Summarize a replacement chain for display.
 */
export function summarizeReplacementChain(chain: ReplacementChain): string {
  if (chain.links.length === 0) {
    return chain.originalDescription;
  }

  const steps = chain.links.map((link, i) => {
    const prefix = i === 0 ? 'Originally' : `Then`;
    const rollbackNote = link.rolledBack ? ' (rolled back)' : '';
    return `${prefix}: "${link.replaced}" → "${link.replacement}"${rollbackNote}`;
  });

  return steps.join('\n');
}

// =============================================================================
// FORMAT AND DISPLAY
// =============================================================================

/**
 * Format a replacement expression as a human-readable string.
 */
export function formatReplacement(expr: ReplacementExpression): string {
  const target = formatReplacedTarget(expr.replaced);
  const action = formatReplacementAction(expr.replacement);
  const rollback = expr.requiresRollback ? ' (requires rollback)' : '';

  switch (expr.kind) {
    case 'explicit_instead':
      return `Instead of ${target}, ${action}${rollback}`;
    case 'explicit_rather':
      return `${action} rather than ${target}${rollback}`;
    case 'explicit_swap':
      return `Swap ${target} for ${action}${rollback}`;
    case 'explicit_replace':
      return `Replace ${target} with ${action}${rollback}`;
    case 'implicit_correction':
      return `Correction: ${action}${rollback}`;
    case 'implicit_cancel':
      return `Cancel${action !== '(nothing)' ? `, then ${action}` : ''}${rollback}`;
    case 'implicit_reconsider':
      return `Reconsider: ${action}${rollback}`;
    case 'undo_and_replace':
      return `Undo ${target}, then ${action}`;
    case 'preference':
      return `Prefer ${action} over ${target}`;
    case 'try_alternative':
      return `Try ${action} instead${rollback}`;
  }
}

/**
 * Format the replaced target.
 */
export function formatReplacedTarget(target: ReplacedTarget): string {
  switch (target.type) {
    case 'explicit':
      return target.description;
    case 'implicit':
      switch (target.recency) {
        case 'most_recent':
          return '(most recent action)';
        case 'current_preview':
          return '(current preview)';
        case 'last_applied':
          return '(last applied change)';
        case 'last_n': {
          const n = target.n ?? 1;
          return `(last ${n} action${n > 1 ? 's' : ''})`;
        }
      }
      break;  // TypeScript exhaustiveness helper
    case 'referential':
      return target.expression;
    case 'historical':
      return target.description;
  }
}

/**
 * Format the replacement action.
 */
export function formatReplacementAction(action: ReplacementAction): string {
  switch (action.type) {
    case 'new_plan':
      return action.description;
    case 'modified_plan':
      return `${action.description} (${action.modification})`;
    case 'null':
      return '(nothing)';
    case 'deferred':
      return `(deferred: ${action.phrase})`;
  }
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface ReplacementStats {
  readonly totalPatterns: number;
  readonly totalSurfaceForms: number;
  readonly totalRegexPatterns: number;
  readonly totalExamples: number;
  readonly byKind: Readonly<Record<string, number>>;
}

export function getReplacementStats(): ReplacementStats {
  const byKind: Record<string, number> = {};
  let totalSurface = 0;
  let totalRegex = 0;
  let totalExamples = 0;

  for (const p of REPLACEMENT_PATTERNS) {
    byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
    totalSurface += p.surfaceForms.length;
    totalRegex += p.regexPatterns.length;
    totalExamples += p.examples.length;
  }

  return {
    totalPatterns: REPLACEMENT_PATTERNS.length,
    totalSurfaceForms: totalSurface,
    totalRegexPatterns: totalRegex,
    totalExamples,
    byKind,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const REPLACEMENT_RULES = [
  'Rule REPL-001: "instead of X, Y" replaces plan X with plan Y. ' +
  'If X was already applied, rollback is required before Y can proceed.',

  'Rule REPL-002: "rather than X, Y" is semantically equivalent to ' +
  '"instead of X, Y" but carries a stronger preference connotation.',

  'Rule REPL-003: "swap X for Y" is bidirectional: X is removed and Y is ' +
  'added. Both the removal and addition must succeed atomically.',

  'Rule REPL-004: "replace X with Y" is explicit substitution. The system ' +
  'must verify that X exists before replacing it with Y.',

  'Rule REPL-005: "actually, Y" is an implicit correction that replaces ' +
  'the most recent plan. If the most recent plan was applied, rollback ' +
  'is performed before applying Y.',

  'Rule REPL-006: "never mind" cancels the current plan. If followed by ' +
  'a new command, that command becomes the replacement. Otherwise, the ' +
  'null action (pure cancellation) is used.',

  'Rule REPL-007: "on second thought, Y" reconsiders the most recent ' +
  'decision. It implies the user has reflected and now prefers Y.',

  'Rule REPL-008: "undo that and do Y" explicitly requests rollback of ' +
  'the last change followed by applying Y. Rollback must succeed before ' +
  'Y is attempted.',

  'Rule REPL-009: Rollback of a proposed plan (not yet applied) simply ' +
  'discards the plan. No undo operations are needed.',

  'Rule REPL-010: Rollback of a previewing plan cancels the preview and ' +
  'restores the pre-preview state.',

  'Rule REPL-011: Rollback of an applied plan requires either an inverse ' +
  'patch (preferred) or a snapshot restore. If neither is available, ' +
  'the user is informed that manual undo is needed.',

  'Rule REPL-012: Rollback of a committed plan is blocked by default. ' +
  'The user must explicitly use project history to revert committed changes.',

  'Rule REPL-013: Replacement chains are tracked so the system can explain ' +
  '"you originally asked for X, then changed to Y, then changed to Z".',

  'Rule REPL-014: "let\'s try Y instead" is tentative: the system should ' +
  'preserve the ability to revert to the previous approach easily.',

  'Rule REPL-015: Cascade dependencies: if rolling back plan A would ' +
  'invalidate plan B (which depends on A\'s output), the user must be warned.',
] as const;
