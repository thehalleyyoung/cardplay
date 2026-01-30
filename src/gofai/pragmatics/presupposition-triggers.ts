/**
 * Presupposition Trigger Semantics
 *
 * Step 038 [Sem][Prag]: Specify the semantics of "again", "still", "also",
 * "too" as presupposition triggers in edit dialogue.
 *
 * ## What Are Presupposition Triggers?
 *
 * Presupposition triggers are words that REQUIRE certain conditions to
 * hold in the dialogue/edit history for the utterance to be meaningful.
 * If the presupposition is not satisfied, the system must either:
 * 1. Fail with an explicit error, or
 * 2. Ask a clarification question to establish the presupposition.
 *
 * ## Trigger Inventory
 *
 * | Trigger | Presupposes | Example |
 * |---------|-------------|---------|
 * | "again" | A prior action of the same type exists | "Brighten it again" |
 * | "still" | A state that was previously established continues | "It's still too dark" |
 * | "also"  | Another action was just performed on a different target | "Also do the drums" |
 * | "too"   | Same as "also" — another target for the same action | "The bass too" |
 * | "back"  | A prior state that was departed from | "Go back to how it was" |
 * | "again but" | A prior action exists, to be modified | "Do that again but louder" |
 * | "more"  | An increase that was already applied (additive) | "Even more brightness" |
 * | "keep"  | A property currently holds and should be maintained | "Keep the groove tight" |
 * | "return" | A prior state exists to return to | "Return to the original key" |
 * | "continue" | An ongoing process exists to extend | "Continue the build" |
 *
 * ## Design Principles
 *
 * 1. **Presuppositions are checked, not assumed**: If "again" has no
 *    antecedent action, the system fails rather than guessing.
 *
 * 2. **Accommodation is possible but explicit**: If the user says
 *    "do it again" and there's no prior action, the system can ask
 *    "What would you like me to repeat?" — this is accommodation.
 *
 * 3. **Edit history is the presupposition store**: Prior actions,
 *    states, and edits are stored in the dialogue state and can
 *    serve as presupposition antecedents.
 *
 * 4. **Presupposition resolution is logged**: Every presupposition
 *    binding appears in the provenance chain.
 *
 * @module gofai/pragmatics/presupposition-triggers
 */

// =============================================================================
// Presupposition Trigger Types
// =============================================================================

/**
 * Types of presupposition triggers recognized by the parser.
 */
export type PresuppositionTriggerType =
  | 'repetition'       // "again", "once more", "repeat"
  | 'continuation'     // "still", "continue", "keep going"
  | 'addition'         // "also", "too", "as well", "and also"
  | 'reversion'        // "back", "return", "revert", "undo"
  | 'persistence'      // "keep", "maintain", "hold"
  | 'incremental'      // "more", "even more", "further"
  | 'modification';    // "again but", "same but"

/**
 * A detected presupposition trigger with its lexical source.
 */
export interface PresuppositionTrigger {
  /** The type of trigger. */
  readonly type: PresuppositionTriggerType;
  /** The surface word(s) that triggered it. */
  readonly surfaceForm: string;
  /** What is presupposed (a structured requirement). */
  readonly presupposition: Presupposition;
  /** Whether accommodation is possible if the presupposition fails. */
  readonly accommodable: boolean;
}

/**
 * A presupposition: what must be true in the dialogue/edit history.
 */
export type Presupposition =
  | PriorActionPresupposition
  | PriorStatePresupposition
  | OngoingProcessPresupposition
  | AdditionalTargetPresupposition
  | IncrementalPresupposition;

/**
 * Presupposes that a prior action of a certain type exists.
 * Triggered by: "again", "repeat", "once more"
 */
export interface PriorActionPresupposition {
  readonly kind: 'prior_action';
  /** What kind of action is presupposed (or undefined for "any"). */
  readonly actionType: string | undefined;
  /** How far back to look (in dialogue turns). */
  readonly recencyWindow: number;
  /** Description for error messages. */
  readonly description: string;
}

/**
 * Presupposes that a prior state existed and can be referenced.
 * Triggered by: "back", "return", "revert"
 */
export interface PriorStatePresupposition {
  readonly kind: 'prior_state';
  /** What kind of state (e.g., "original", "before the last change"). */
  readonly stateDescription: string;
  /** Whether a specific edit is referenced. */
  readonly specificEditId: string | undefined;
  /** Description for error messages. */
  readonly description: string;
}

/**
 * Presupposes that an ongoing process exists.
 * Triggered by: "still", "continue", "keep going"
 */
export interface OngoingProcessPresupposition {
  readonly kind: 'ongoing_process';
  /** What process is presupposed to be ongoing. */
  readonly processDescription: string;
  /** Description for error messages. */
  readonly description: string;
}

/**
 * Presupposes that another target exists alongside the current one.
 * Triggered by: "also", "too", "as well"
 */
export interface AdditionalTargetPresupposition {
  readonly kind: 'additional_target';
  /** The action from the previous turn that should be extended. */
  readonly priorActionType: string | undefined;
  /** Description for error messages. */
  readonly description: string;
}

/**
 * Presupposes that an increase was already applied (additive).
 * Triggered by: "more", "even more", "further"
 */
export interface IncrementalPresupposition {
  readonly kind: 'incremental';
  /** The axis/parameter that was previously increased. */
  readonly axis: string | undefined;
  /** Description for error messages. */
  readonly description: string;
}


// =============================================================================
// Trigger Detection
// =============================================================================

/**
 * Surface form patterns that signal presupposition triggers.
 */
export interface TriggerPattern {
  /** Surface forms (lowercased). */
  readonly surfaceForms: readonly string[];
  /** Trigger type. */
  readonly type: PresuppositionTriggerType;
  /** Whether accommodation is possible. */
  readonly accommodable: boolean;
  /** Example utterance. */
  readonly example: string;
}

/**
 * Canonical inventory of trigger patterns.
 */
export const TRIGGER_PATTERNS: readonly TriggerPattern[] = [
  // --- Repetition triggers ---
  {
    surfaceForms: ['again', 'once more', 'one more time', 'repeat that', 'do it again', 'same thing'],
    type: 'repetition',
    accommodable: false,
    example: 'Brighten it again',
  },
  {
    surfaceForms: ['again but', 'same but', 'same thing but', 'like before but'],
    type: 'modification',
    accommodable: false,
    example: 'Do that again but louder',
  },

  // --- Continuation triggers ---
  {
    surfaceForms: ['still', 'still too', 'still not enough'],
    type: 'continuation',
    accommodable: true,
    example: 'It\'s still too dark',
  },
  {
    surfaceForms: ['continue', 'keep going', 'carry on', 'go on'],
    type: 'continuation',
    accommodable: true,
    example: 'Continue the build into the chorus',
  },

  // --- Addition triggers ---
  {
    surfaceForms: ['also', 'as well', 'in addition', 'and also', 'plus'],
    type: 'addition',
    accommodable: true,
    example: 'Also darken the pad',
  },
  {
    surfaceForms: ['too', 'as well'],
    type: 'addition',
    accommodable: true,
    example: 'The bass too',
  },

  // --- Reversion triggers ---
  {
    surfaceForms: ['back', 'go back', 'back to', 'return to', 'revert to', 'restore'],
    type: 'reversion',
    accommodable: false,
    example: 'Go back to how it was before',
  },

  // --- Persistence triggers ---
  {
    surfaceForms: ['keep', 'maintain', 'hold', 'sustain', 'preserve'],
    type: 'persistence',
    accommodable: true,
    example: 'Keep the groove tight',
  },

  // --- Incremental triggers ---
  {
    surfaceForms: ['more', 'even more', 'further', 'additionally', 'extra'],
    type: 'incremental',
    accommodable: true,
    example: 'Even more brightness',
  },
];

/**
 * Detect presupposition triggers in an utterance.
 */
export function detectTriggers(utterance: string): readonly TriggerPattern[] {
  const lower = utterance.toLowerCase();
  return TRIGGER_PATTERNS.filter(pattern =>
    pattern.surfaceForms.some(form => {
      // Match as whole word or at word boundaries
      const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(lower);
    }),
  );
}


// =============================================================================
// Presupposition Resolution
// =============================================================================

/**
 * The result of checking a presupposition against dialogue history.
 */
export type PresuppositionCheckResult =
  | PresuppositionSatisfied
  | PresuppositionAccommodated
  | PresuppositionFailed;

/**
 * The presupposition is satisfied: an antecedent exists in history.
 */
export interface PresuppositionSatisfied {
  readonly status: 'satisfied';
  /** The antecedent that satisfies the presupposition. */
  readonly antecedent: PresuppositionAntecedent;
  /** Human-readable explanation. */
  readonly explanation: string;
}

/**
 * The presupposition was accommodated: no antecedent exists, but we
 * can ask the user to establish one.
 */
export interface PresuppositionAccommodated {
  readonly status: 'accommodated';
  /** The clarification question to establish the presupposition. */
  readonly clarificationQuestion: string;
  /** Candidate antecedents to present to the user. */
  readonly candidates: readonly PresuppositionAntecedent[];
}

/**
 * The presupposition failed: no antecedent and no accommodation possible.
 */
export interface PresuppositionFailed {
  readonly status: 'failed';
  /** Why the presupposition failed. */
  readonly reason: string;
  /** User-friendly error message. */
  readonly userMessage: string;
}

/**
 * An antecedent that satisfies a presupposition.
 */
export interface PresuppositionAntecedent {
  /** What kind of antecedent. */
  readonly kind: 'prior_edit' | 'prior_state' | 'ongoing_process' | 'prior_turn';
  /** Human-readable description. */
  readonly description: string;
  /** Dialogue turn number where this antecedent was established. */
  readonly turn: number;
  /** Edit package ID (if applicable). */
  readonly editPackageId: string | undefined;
  /** The CPL of the antecedent action (if applicable). */
  readonly cplSummary: string | undefined;
}


// =============================================================================
// Checking Specific Trigger Types
// =============================================================================

/**
 * Check the presupposition for "again" / "repeat".
 *
 * Requires: A prior action exists in the edit history.
 * If no prior action: FAIL (non-accommodable).
 */
export function checkRepetitionPresupposition(
  editHistory: readonly PresuppositionAntecedent[],
  recencyWindow: number,
  currentTurn: number,
): PresuppositionCheckResult {
  // Look for a prior action within the recency window
  const recentEdits = editHistory.filter(
    a => a.kind === 'prior_edit' && (currentTurn - a.turn) <= recencyWindow,
  );

  if (recentEdits.length > 0) {
    const mostRecent = recentEdits[0]!;
    return {
      status: 'satisfied',
      antecedent: mostRecent,
      explanation: `"Again" refers to the most recent edit: ${mostRecent.description}`,
    };
  }

  // No recent edits — fail
  return {
    status: 'failed',
    reason: 'No prior action found to repeat',
    userMessage: 'I don\'t have a previous action to repeat. What would you like me to do?',
  };
}

/**
 * Check the presupposition for "also" / "too".
 *
 * Requires: A prior action on a DIFFERENT target in recent turns.
 * If no prior action: ACCOMMODATE by asking what action to extend.
 */
export function checkAdditionPresupposition(
  editHistory: readonly PresuppositionAntecedent[],
  currentTurn: number,
): PresuppositionCheckResult {
  // Look for the most recent edit
  const recentEdits = editHistory.filter(
    a => a.kind === 'prior_edit' && (currentTurn - a.turn) <= 3,
  );

  if (recentEdits.length > 0) {
    const mostRecent = recentEdits[0]!;
    return {
      status: 'satisfied',
      antecedent: mostRecent,
      explanation: `"Also" extends the recent action: ${mostRecent.description}`,
    };
  }

  // Can accommodate by asking
  return {
    status: 'accommodated',
    clarificationQuestion: 'What previous action would you like to extend to another target?',
    candidates: editHistory.slice(0, 5), // Offer last 5 edits
  };
}

/**
 * Check the presupposition for "still" / "continue".
 *
 * Requires: An ongoing process or iterative editing session.
 * If no process: ACCOMMODATE by asking what should continue.
 */
export function checkContinuationPresupposition(
  editHistory: readonly PresuppositionAntecedent[],
  currentTurn: number,
): PresuppositionCheckResult {
  // Look for recent repeated actions (same type)
  const recentEdits = editHistory.filter(
    a => (currentTurn - a.turn) <= 5,
  );

  if (recentEdits.length >= 2) {
    const mostRecent = recentEdits[0]!;
    return {
      status: 'satisfied',
      antecedent: mostRecent,
      explanation: `"Still/continue" refers to the ongoing editing process: ${mostRecent.description}`,
    };
  }

  if (recentEdits.length === 1) {
    const single = recentEdits[0]!;
    return {
      status: 'satisfied',
      antecedent: single,
      explanation: `"Still" evaluates against the state after: ${single.description}`,
    };
  }

  return {
    status: 'accommodated',
    clarificationQuestion: 'What process should continue? There\'s no recent editing context.',
    candidates: [],
  };
}

/**
 * Check the presupposition for "back" / "return" / "revert".
 *
 * Requires: A prior state exists in the undo history.
 * If no prior state: FAIL (non-accommodable — nothing to revert to).
 */
export function checkReversionPresupposition(
  editHistory: readonly PresuppositionAntecedent[],
): PresuppositionCheckResult {
  const priorStates = editHistory.filter(a => a.kind === 'prior_state' || a.kind === 'prior_edit');

  if (priorStates.length > 0) {
    const first = priorStates[0]!;
    return {
      status: 'satisfied',
      antecedent: first,
      explanation: `"Back/return" refers to the state before: ${first.description}`,
    };
  }

  return {
    status: 'failed',
    reason: 'No prior state exists to revert to',
    userMessage: 'There\'s no previous state to go back to. This is the original state.',
  };
}


// =============================================================================
// Presupposition Rules (Declarative)
// =============================================================================

/**
 * Normative rules for presupposition handling.
 */
export const PRESUPPOSITION_RULES = {
  /**
   * Rule P1: "Again" requires a prior action.
   * If no antecedent action exists, resolution FAILS. The system
   * does NOT guess what the user wants to repeat.
   */
  P1_AGAIN_REQUIRES_ANTECEDENT:
    '"Again" fails without a prior action in the edit history. No accommodation.',

  /**
   * Rule P2: "Still" implies evaluation against current state.
   * "It\'s still too dark" presupposes that an attempt to brighten
   * was made and it was insufficient. The system should apply MORE
   * of the same change.
   */
  P2_STILL_IMPLIES_INSUFFICIENCY:
    '"Still" presupposes a prior attempt was insufficient. Apply more of the same.',

  /**
   * Rule P3: "Also" extends the prior action to a new target.
   * "Also do the drums" presupposes that an action was just performed
   * on a different target, and the same action should apply to drums.
   */
  P3_ALSO_EXTENDS_TO_NEW_TARGET:
    '"Also"/"too" extend the most recent action to an additional target.',

  /**
   * Rule P4: "Back" requires undo history.
   * If no undo history exists, resolution FAILS.
   */
  P4_BACK_REQUIRES_HISTORY:
    '"Back"/"return" requires undo history. Fails without it.',

  /**
   * Rule P5: "Keep" presupposes a property currently holds.
   * "Keep the groove tight" presupposes the groove IS tight now.
   * This becomes a preservation constraint, not an action.
   */
  P5_KEEP_PRESUPPOSES_CURRENT_STATE:
    '"Keep" presupposes the named property currently holds and generates a preserve constraint.',

  /**
   * Rule P6: "More" is additive to prior changes.
   * "Even more brightness" presupposes brightness was already increased.
   * The new amount is ADDED to the prior amount, not set independently.
   */
  P6_MORE_IS_ADDITIVE:
    '"More"/"even more" adds to the prior change amount, not replaces it.',

  /**
   * Rule P7: Presupposition failures generate helpful messages.
   * The error message names the presupposition and suggests what
   * the user could do (e.g., "No prior action to repeat. Try
   * specifying what you'd like to do.").
   */
  P7_HELPFUL_FAILURE_MESSAGES:
    'Presupposition failures include user-friendly explanations and suggestions.',

  /**
   * Rule P8: All presupposition resolutions are logged in provenance.
   */
  P8_LOGGED_IN_PROVENANCE:
    'Every presupposition resolution (success or failure) appears in provenance.',
} as const;


// =============================================================================
// UI Copy Templates for Presupposition Errors
// =============================================================================

/**
 * User-facing messages for presupposition failures and accommodations.
 */
export const PRESUPPOSITION_UI_TEMPLATES = {
  /** "Again" with no prior action. */
  AGAIN_NO_ANTECEDENT:
    'I don\'t have a previous action to repeat. What would you like me to do?',

  /** "Still" with no prior attempt. */
  STILL_NO_PRIOR_ATTEMPT:
    'This is the first time we\'re addressing this. What change would you like?',

  /** "Also" with no prior action to extend. */
  ALSO_NO_PRIOR_ACTION:
    'What previous change would you like to extend to another target?',

  /** "Back" with no undo history. */
  BACK_NO_HISTORY:
    'There\'s no previous state to return to. This is the original state.',

  /** "More" with no prior increase. */
  MORE_NO_PRIOR_INCREASE:
    'Nothing was increased yet. Would you like to increase {axis}?',

  /** "Continue" with no ongoing process. */
  CONTINUE_NO_PROCESS:
    'There\'s no ongoing process to continue. What would you like to do next?',

  /** Generic accommodation offer. */
  GENERIC_ACCOMMODATION:
    'I\'m not sure what "{trigger}" refers to. Could you specify what you mean?',
} as const;
