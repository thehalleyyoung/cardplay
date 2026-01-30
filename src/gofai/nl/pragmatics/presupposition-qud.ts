/**
 * presupposition-qud.ts -- Steps 206-210: Presupposition, Implicature, QUD,
 * Clarification, and Dialogue Moves
 *
 * Step 206: Presupposition Checking/Accommodation
 * Step 207: Conversational Implicature Defaults
 * Step 208: QUD Stack Tracking
 * Step 209: Clarification Generation
 * Step 210: Accept Defaults and Override Dialogue Moves
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 206: PRESUPPOSITION CHECKING / ACCOMMODATION =====================

// ---- 206 Types ----

/** Categories of presupposition triggers. */
export type PresuppositionType =
  | 'repetition'
  | 'continuation'
  | 'reversal'
  | 'persistence'
  | 'restoration'
  | 'maintenance'
  | 'inception'
  | 'cessation';

/** Accommodation strategy when a presupposition is not satisfied. */
export type AccommodationStrategyKind =
  | 'global'
  | 'local'
  | 'bridging'
  | 'blocking';

/** A trigger word/phrase that introduces a presupposition. */
export interface PresuppositionTrigger {
  readonly triggerId: string;
  readonly pattern: string;
  readonly presuppositionType: PresuppositionType;
  readonly description: string;
  readonly presupposes: string;
  readonly exampleUtterance: string;
  readonly weight: number;
}

/** Result of checking a presupposition against dialogue state. */
export interface PresuppositionCheck {
  readonly triggerId: string;
  readonly presuppositionType: PresuppositionType;
  readonly utterance: string;
  readonly presupposedContent: string;
  readonly isSatisfied: boolean;
  readonly satisfiedBy: string;
  readonly confidence: number;
}

/** Full result after checking + optional accommodation. */
export interface PresuppositionResult {
  readonly check: PresuppositionCheck;
  readonly accommodated: boolean;
  readonly accommodationStrategy: AccommodationStrategyKind | 'none';
  readonly explanation: string;
  readonly warnings: readonly string[];
}

/** Strategy object for how to accommodate a failed presupposition. */
export interface AccommodationStrategy {
  readonly kind: AccommodationStrategyKind;
  readonly label: string;
  readonly description: string;
  readonly applyEffect: string;
  readonly riskLevel: 'low' | 'medium' | 'high';
}

/** Simplified dialogue state entry used for checking presuppositions. */
export interface PresuppositionDialogueEntry {
  readonly turnNumber: number;
  readonly text: string;
  readonly actions: readonly string[];
  readonly stateDescriptors: readonly string[];
  readonly activeProcesses: readonly string[];
  readonly previousStates: readonly string[];
}

/** A batch check result grouping multiple presuppositions. */
export interface PresuppositionBatchResult {
  readonly utterance: string;
  readonly results: readonly PresuppositionResult[];
  readonly allSatisfied: boolean;
  readonly failedCount: number;
  readonly accommodatedCount: number;
  readonly blockedCount: number;
}

/** Report summary for presupposition analysis. */
export interface PresuppositionReport {
  readonly utterance: string;
  readonly triggerCount: number;
  readonly satisfiedCount: number;
  readonly accommodatedCount: number;
  readonly failedCount: number;
  readonly lines: readonly string[];
}

// ---- 206 Trigger Registry (30+ patterns) ----

const PRESUPPOSITION_TRIGGERS: readonly PresuppositionTrigger[] = [
  // --- repetition ---
  {
    triggerId: 'again-general',
    pattern: '\\bagain\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes the action has occurred before',
    presupposes: 'action-previously-occurred',
    exampleUtterance: 'play it again',
    weight: 1.0,
  },
  {
    triggerId: 'once-more',
    pattern: '\\bonce\\s+more\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes the action has occurred at least once',
    presupposes: 'action-previously-occurred',
    exampleUtterance: 'do it once more',
    weight: 1.0,
  },
  {
    triggerId: 'another',
    pattern: '\\banother\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes at least one instance already exists',
    presupposes: 'instance-already-exists',
    exampleUtterance: 'add another layer',
    weight: 0.8,
  },
  {
    triggerId: 'repeat',
    pattern: '\\brepeat\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes an action to repeat',
    presupposes: 'action-previously-occurred',
    exampleUtterance: 'repeat the last edit',
    weight: 1.0,
  },
  {
    triggerId: 'redo',
    pattern: '\\bredo\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes an action was done and possibly undone',
    presupposes: 'action-previously-occurred-and-undone',
    exampleUtterance: 'redo the EQ change',
    weight: 1.0,
  },
  // --- continuation ---
  {
    triggerId: 'still',
    pattern: '\\bstill\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes a state has been persisting',
    presupposes: 'state-persists',
    exampleUtterance: 'it still sounds muddy',
    weight: 1.0,
  },
  {
    triggerId: 'continue-verb',
    pattern: '\\bcontinue\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes an ongoing process to continue',
    presupposes: 'process-ongoing',
    exampleUtterance: 'continue adding reverb',
    weight: 1.0,
  },
  {
    triggerId: 'keep-verb',
    pattern: '\\bkeep\\b',
    presuppositionType: 'maintenance',
    description: 'Presupposes a current state that should be maintained',
    presupposes: 'state-currently-active',
    exampleUtterance: 'keep the bass line',
    weight: 1.0,
  },
  {
    triggerId: 'keep-going',
    pattern: '\\bkeep\\s+going\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes an ongoing process',
    presupposes: 'process-ongoing',
    exampleUtterance: 'keep going with the arrangement',
    weight: 1.0,
  },
  {
    triggerId: 'go-on',
    pattern: '\\bgo\\s+on\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes a process that can continue',
    presupposes: 'process-ongoing',
    exampleUtterance: 'go on',
    weight: 0.7,
  },
  // --- reversal ---
  {
    triggerId: 'back-to',
    pattern: '\\bback\\s+to\\b',
    presuppositionType: 'reversal',
    description: 'Presupposes a previous state to return to',
    presupposes: 'previous-state-exists',
    exampleUtterance: 'go back to the original mix',
    weight: 1.0,
  },
  {
    triggerId: 'return-to',
    pattern: '\\breturn\\s+to\\b',
    presuppositionType: 'restoration',
    description: 'Presupposes a prior state to restore',
    presupposes: 'prior-state-exists',
    exampleUtterance: 'return to the verse',
    weight: 1.0,
  },
  {
    triggerId: 'revert',
    pattern: '\\brevert\\b',
    presuppositionType: 'reversal',
    description: 'Presupposes a change that can be undone',
    presupposes: 'change-was-made',
    exampleUtterance: 'revert the last change',
    weight: 1.0,
  },
  {
    triggerId: 'restore',
    pattern: '\\brestore\\b',
    presuppositionType: 'restoration',
    description: 'Presupposes something was removed or changed',
    presupposes: 'previous-state-exists',
    exampleUtterance: 'restore the original drums',
    weight: 1.0,
  },
  {
    triggerId: 'undo',
    pattern: '\\bundo\\b',
    presuppositionType: 'reversal',
    description: 'Presupposes a recent action to undo',
    presupposes: 'action-previously-occurred',
    exampleUtterance: 'undo that',
    weight: 1.0,
  },
  // --- persistence ---
  {
    triggerId: 'anymore',
    pattern: '\\banymore\\b',
    presuppositionType: 'persistence',
    description: 'Presupposes a state that used to hold',
    presupposes: 'state-previously-held',
    exampleUtterance: "it doesn't sound right anymore",
    weight: 0.9,
  },
  {
    triggerId: 'no-longer',
    pattern: '\\bno\\s+longer\\b',
    presuppositionType: 'cessation',
    description: 'Presupposes something was previously true',
    presupposes: 'state-was-true',
    exampleUtterance: 'the reverb is no longer needed',
    weight: 1.0,
  },
  // --- inception ---
  {
    triggerId: 'start-verb',
    pattern: '\\bstart\\b',
    presuppositionType: 'inception',
    description: 'Presupposes something is not yet happening',
    presupposes: 'not-yet-happening',
    exampleUtterance: 'start adding hi-hats',
    weight: 0.8,
  },
  {
    triggerId: 'begin',
    pattern: '\\bbegin\\b',
    presuppositionType: 'inception',
    description: 'Presupposes something is not yet happening',
    presupposes: 'not-yet-happening',
    exampleUtterance: 'begin the transition',
    weight: 0.8,
  },
  // --- cessation ---
  {
    triggerId: 'stop-verb',
    pattern: '\\bstop\\b',
    presuppositionType: 'cessation',
    description: 'Presupposes something is currently happening',
    presupposes: 'currently-happening',
    exampleUtterance: 'stop the loop',
    weight: 1.0,
  },
  {
    triggerId: 'quit',
    pattern: '\\bquit\\b',
    presuppositionType: 'cessation',
    description: 'Presupposes something is currently happening',
    presupposes: 'currently-happening',
    exampleUtterance: 'quit layering effects',
    weight: 0.8,
  },
  // --- restoration ---
  {
    triggerId: 'resume',
    pattern: '\\bresume\\b',
    presuppositionType: 'restoration',
    description: 'Presupposes a process was happening and paused',
    presupposes: 'process-was-paused',
    exampleUtterance: 'resume playback',
    weight: 1.0,
  },
  {
    triggerId: 'pick-up-where',
    pattern: '\\bpick\\s+up\\s+where\\b',
    presuppositionType: 'restoration',
    description: 'Presupposes a process was interrupted',
    presupposes: 'process-was-interrupted',
    exampleUtterance: 'pick up where we left off',
    weight: 1.0,
  },
  // --- more repetition/continuation ---
  {
    triggerId: 'already',
    pattern: '\\balready\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes an expected state has been achieved',
    presupposes: 'state-achieved',
    exampleUtterance: "I already told you I don't want reverb",
    weight: 0.9,
  },
  {
    triggerId: 'yet',
    pattern: '\\byet\\b',
    presuppositionType: 'persistence',
    description: 'Presupposes something expected has not been achieved',
    presupposes: 'expected-not-achieved',
    exampleUtterance: "it's not ready yet",
    weight: 0.7,
  },
  {
    triggerId: 'too-also',
    pattern: '\\b(too|also)\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes a parallel action or entity',
    presupposes: 'parallel-exists',
    exampleUtterance: 'add reverb to the vocals too',
    weight: 0.6,
  },
  {
    triggerId: 'even',
    pattern: '\\beven\\b',
    presuppositionType: 'persistence',
    description: 'Presupposes a scale of likelihood',
    presupposes: 'scale-of-likelihood',
    exampleUtterance: 'even the bass sounds off',
    weight: 0.5,
  },
  {
    triggerId: 'remain',
    pattern: '\\bremain\\b',
    presuppositionType: 'maintenance',
    description: 'Presupposes current state to maintain',
    presupposes: 'state-currently-active',
    exampleUtterance: 'let the pad remain',
    weight: 0.9,
  },
  {
    triggerId: 'retain',
    pattern: '\\bretain\\b',
    presuppositionType: 'maintenance',
    description: 'Presupposes something currently present to keep',
    presupposes: 'state-currently-active',
    exampleUtterance: 'retain the original melody',
    weight: 0.9,
  },
  {
    triggerId: 'further',
    pattern: '\\bfurther\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes previous progress in same direction',
    presupposes: 'progress-in-direction',
    exampleUtterance: 'boost the treble further',
    weight: 0.8,
  },
  {
    triggerId: 'more-of',
    pattern: '\\bmore\\s+of\\b',
    presuppositionType: 'continuation',
    description: 'Presupposes some quantity already exists',
    presupposes: 'some-quantity-exists',
    exampleUtterance: 'add more of the reverb',
    weight: 0.7,
  },
  {
    triggerId: 'same-as-before',
    pattern: '\\bsame\\s+(as\\s+)?before\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes a prior configuration',
    presupposes: 'prior-configuration-exists',
    exampleUtterance: 'same as before',
    weight: 1.0,
  },
  {
    triggerId: 'like-last-time',
    pattern: '\\blike\\s+last\\s+time\\b',
    presuppositionType: 'repetition',
    description: 'Presupposes a previous instance',
    presupposes: 'prior-instance-exists',
    exampleUtterance: 'do it like last time',
    weight: 1.0,
  },
] as const;

// ---- 206 Accommodation Strategy Definitions ----

const ACCOMMODATION_STRATEGIES: Record<AccommodationStrategyKind, AccommodationStrategy> = {
  global: {
    kind: 'global',
    label: 'Global Accommodation',
    description: 'Add the presupposed content to the common ground as if it were always known',
    applyEffect: 'add-to-common-ground',
    riskLevel: 'medium',
  },
  local: {
    kind: 'local',
    label: 'Local Accommodation',
    description: 'Add the presupposed content only to the current DRS box / context',
    applyEffect: 'add-to-local-box',
    riskLevel: 'low',
  },
  bridging: {
    kind: 'bridging',
    label: 'Bridging Accommodation',
    description: 'Infer the missing referent from context via bridging inference',
    applyEffect: 'infer-referent',
    riskLevel: 'medium',
  },
  blocking: {
    kind: 'blocking',
    label: 'Blocking',
    description: 'Reject the presupposition and request clarification',
    applyEffect: 'request-clarification',
    riskLevel: 'high',
  },
};

// ---- 206 Helper: pattern matching ----

function matchesTriggerPattern(utterance: string, pattern: string): boolean {
  try {
    const re = new RegExp(pattern, 'i');
    return re.test(utterance);
  } catch {
    return false;
  }
}

function lowercaseTrim(s: string): string {
  return s.toLowerCase().trim();
}

// ---- 206 Functions ----

/**
 * Scan an utterance for all presupposition triggers.
 * Returns a list of triggers found.
 */
export function detectPresuppositions(utterance: string): readonly PresuppositionTrigger[] {
  const lower = lowercaseTrim(utterance);
  const found: PresuppositionTrigger[] = [];
  for (const trigger of PRESUPPOSITION_TRIGGERS) {
    if (matchesTriggerPattern(lower, trigger.pattern)) {
      found.push(trigger);
    }
  }
  // Sort by weight descending so the strongest triggers come first
  found.sort((a, b) => b.weight - a.weight);
  return found;
}

/**
 * Check a single presupposition trigger against dialogue history.
 * Returns a PresuppositionCheck indicating whether the presupposition is satisfied.
 */
export function checkPresupposition(
  trigger: PresuppositionTrigger,
  utterance: string,
  history: readonly PresuppositionDialogueEntry[],
): PresuppositionCheck {
  const presupposedContent = trigger.presupposes;
  let isSatisfied = false;
  let satisfiedBy = '';
  let confidence = 0;

  switch (trigger.presuppositionType) {
    case 'repetition': {
      // Check if there is a prior action that matches
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry !== undefined && entry.actions.length > 0) {
          isSatisfied = true;
          const firstAction = entry.actions[0];
          satisfiedBy = `turn ${String(entry.turnNumber)}: ${firstAction !== undefined ? firstAction : 'action'}`;
          confidence = 0.9;
          break;
        }
      }
      break;
    }
    case 'continuation': {
      // Check if there is an ongoing process
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry !== undefined && entry.activeProcesses.length > 0) {
          isSatisfied = true;
          const firstProc = entry.activeProcesses[0];
          satisfiedBy = `active process: ${firstProc !== undefined ? firstProc : 'process'}`;
          confidence = 0.85;
          break;
        }
      }
      break;
    }
    case 'reversal': {
      // Check if there is a prior state to revert to
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry !== undefined && entry.previousStates.length > 0) {
          isSatisfied = true;
          const firstState = entry.previousStates[0];
          satisfiedBy = `prior state: ${firstState !== undefined ? firstState : 'state'}`;
          confidence = 0.88;
          break;
        }
      }
      break;
    }
    case 'persistence': {
      // Check if a state was previously described
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry !== undefined && entry.stateDescriptors.length > 0) {
          isSatisfied = true;
          const firstDesc = entry.stateDescriptors[0];
          satisfiedBy = `previous state descriptor: ${firstDesc !== undefined ? firstDesc : 'descriptor'}`;
          confidence = 0.8;
          break;
        }
      }
      break;
    }
    case 'restoration': {
      // Check for a prior state that was paused or removed
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry !== undefined && entry.previousStates.length > 0) {
          isSatisfied = true;
          const firstState = entry.previousStates[0];
          satisfiedBy = `restorable state: ${firstState !== undefined ? firstState : 'state'}`;
          confidence = 0.85;
          break;
        }
      }
      break;
    }
    case 'maintenance': {
      // Check that a current state exists to maintain
      const lastEntry = history.length > 0 ? history[history.length - 1] : undefined;
      if (lastEntry !== undefined && lastEntry.stateDescriptors.length > 0) {
        isSatisfied = true;
        const firstDesc = lastEntry.stateDescriptors[0];
        satisfiedBy = `current state: ${firstDesc !== undefined ? firstDesc : 'descriptor'}`;
        confidence = 0.9;
      }
      break;
    }
    case 'inception': {
      // Inception presupposes something is NOT yet happening; satisfied if no matching active process
      const lastEntry = history.length > 0 ? history[history.length - 1] : undefined;
      if (lastEntry === undefined || lastEntry.activeProcesses.length === 0) {
        isSatisfied = true;
        satisfiedBy = 'no active process found (inception OK)';
        confidence = 0.75;
      }
      break;
    }
    case 'cessation': {
      // Cessation presupposes something IS currently happening
      const lastEntry = history.length > 0 ? history[history.length - 1] : undefined;
      if (lastEntry !== undefined && lastEntry.activeProcesses.length > 0) {
        isSatisfied = true;
        const firstProc = lastEntry.activeProcesses[0];
        satisfiedBy = `active process to stop: ${firstProc !== undefined ? firstProc : 'process'}`;
        confidence = 0.9;
      }
      break;
    }
  }

  return {
    triggerId: trigger.triggerId,
    presuppositionType: trigger.presuppositionType,
    utterance,
    presupposedContent,
    isSatisfied,
    satisfiedBy,
    confidence,
  };
}

/**
 * Determine the best accommodation strategy for a failed presupposition.
 */
export function getAccommodationStrategy(
  check: PresuppositionCheck,
  _history: readonly PresuppositionDialogueEntry[],
): AccommodationStrategy {
  // Heuristics for picking strategy
  if (check.presuppositionType === 'inception' || check.presuppositionType === 'cessation') {
    // These are hard to accommodate; usually blocking
    return ACCOMMODATION_STRATEGIES.blocking;
  }
  if (check.presuppositionType === 'repetition' || check.presuppositionType === 'restoration') {
    // Try bridging: infer what was referred to
    return ACCOMMODATION_STRATEGIES.bridging;
  }
  if (check.presuppositionType === 'maintenance' || check.presuppositionType === 'continuation') {
    // Locally accommodate: assume the state exists in current context
    return ACCOMMODATION_STRATEGIES.local;
  }
  // Default: global accommodation
  return ACCOMMODATION_STRATEGIES.global;
}

/**
 * Attempt to accommodate a failed presupposition.
 * Returns a PresuppositionResult with accommodation details.
 */
export function accommodatePresupposition(
  check: PresuppositionCheck,
  history: readonly PresuppositionDialogueEntry[],
): PresuppositionResult {
  if (check.isSatisfied) {
    return {
      check,
      accommodated: false,
      accommodationStrategy: 'none',
      explanation: 'Presupposition already satisfied.',
      warnings: [],
    };
  }

  const strategy = getAccommodationStrategy(check, history);
  const warnings: string[] = [];

  if (strategy.riskLevel === 'high') {
    warnings.push(
      `High-risk accommodation for trigger "${check.triggerId}": ${strategy.description}`,
    );
  }
  if (strategy.riskLevel === 'medium') {
    warnings.push(
      `Medium-risk accommodation for trigger "${check.triggerId}": results may not match intent`,
    );
  }

  const accommodated = strategy.kind !== 'blocking';
  const explanation = accommodated
    ? `Accommodated via ${strategy.label}: ${strategy.description}`
    : `Blocked: presupposition "${check.presupposedContent}" not supported by dialogue history. Clarification needed.`;

  return {
    check,
    accommodated,
    accommodationStrategy: strategy.kind,
    explanation,
    warnings,
  };
}

/**
 * Return all registered presupposition triggers.
 */
export function getPresuppositionTriggers(): readonly PresuppositionTrigger[] {
  return PRESUPPOSITION_TRIGGERS;
}

/**
 * Check whether a presupposition (by check object) is satisfied.
 */
export function isPresuppositionSatisfied(check: PresuppositionCheck): boolean {
  return check.isSatisfied && check.confidence >= 0.5;
}

/**
 * Generate a human-readable failure message for a failed presupposition.
 */
export function generatePresuppositionFailure(check: PresuppositionCheck): string {
  if (check.isSatisfied) {
    return `Presupposition for "${check.triggerId}" is satisfied.`;
  }

  const typeLabels: Record<PresuppositionType, string> = {
    repetition: 'a previous occurrence of this action',
    continuation: 'an ongoing process to continue',
    reversal: 'a prior state to revert to',
    persistence: 'a state that was previously true',
    restoration: 'a prior state or process to restore',
    maintenance: 'a current state to maintain',
    inception: 'that this is not already happening',
    cessation: 'that something is currently happening',
  };

  const needed = typeLabels[check.presuppositionType];
  return (
    `Presupposition failure for "${check.triggerId}": ` +
    `the utterance "${check.utterance}" presupposes ${needed}, ` +
    `but no supporting evidence was found in the dialogue history.`
  );
}

/**
 * Batch-check all presuppositions in an utterance against dialogue history.
 */
export function batchCheckPresuppositions(
  utterance: string,
  history: readonly PresuppositionDialogueEntry[],
): PresuppositionBatchResult {
  const triggers = detectPresuppositions(utterance);
  const results: PresuppositionResult[] = [];
  let failedCount = 0;
  let accommodatedCount = 0;
  let blockedCount = 0;

  for (const trigger of triggers) {
    const check = checkPresupposition(trigger, utterance, history);
    const result = accommodatePresupposition(check, history);
    results.push(result);

    if (!result.check.isSatisfied) {
      failedCount++;
      if (result.accommodated) {
        accommodatedCount++;
      } else {
        blockedCount++;
      }
    }
  }

  return {
    utterance,
    results,
    allSatisfied: failedCount === 0,
    failedCount,
    accommodatedCount,
    blockedCount,
  };
}

/**
 * Format a human-readable presupposition report for the given utterance.
 */
export function formatPresuppositionReport(
  batchResult: PresuppositionBatchResult,
): PresuppositionReport {
  const lines: string[] = [];
  lines.push(`Presupposition Report for: "${batchResult.utterance}"`);
  lines.push(`Triggers found: ${String(batchResult.results.length)}`);
  lines.push('---');

  for (const result of batchResult.results) {
    const status = result.check.isSatisfied
      ? 'SATISFIED'
      : result.accommodated
        ? 'ACCOMMODATED'
        : 'BLOCKED';
    lines.push(`  [${status}] trigger="${result.check.triggerId}" type=${result.check.presuppositionType}`);
    lines.push(`    presupposes: ${result.check.presupposedContent}`);
    if (result.check.isSatisfied) {
      lines.push(`    satisfied by: ${result.check.satisfiedBy}`);
      lines.push(`    confidence: ${String(result.check.confidence)}`);
    } else {
      lines.push(`    strategy: ${result.accommodationStrategy}`);
      lines.push(`    explanation: ${result.explanation}`);
    }
    if (result.warnings.length > 0) {
      for (const w of result.warnings) {
        lines.push(`    WARNING: ${w}`);
      }
    }
  }

  lines.push('---');
  lines.push(
    `Summary: ${String(batchResult.results.length - batchResult.failedCount)} satisfied, ` +
    `${String(batchResult.accommodatedCount)} accommodated, ` +
    `${String(batchResult.blockedCount)} blocked`,
  );

  return {
    utterance: batchResult.utterance,
    triggerCount: batchResult.results.length,
    satisfiedCount: batchResult.results.length - batchResult.failedCount,
    accommodatedCount: batchResult.accommodatedCount,
    failedCount: batchResult.failedCount,
    lines,
  };
}

/**
 * Apply accommodation: returns description of what was added/changed.
 */
export function applyAccommodation(
  result: PresuppositionResult,
): { readonly applied: boolean; readonly effect: string } {
  if (result.check.isSatisfied) {
    return { applied: false, effect: 'No accommodation needed; presupposition was satisfied.' };
  }
  if (!result.accommodated) {
    return {
      applied: false,
      effect: `Accommodation blocked for "${result.check.triggerId}": clarification required.`,
    };
  }

  const effectDescriptions: Record<AccommodationStrategyKind, string> = {
    global: `Added "${result.check.presupposedContent}" to common ground (global accommodation).`,
    local: `Added "${result.check.presupposedContent}" to current local context.`,
    bridging: `Inferred referent for "${result.check.presupposedContent}" via bridging.`,
    blocking: 'Blocked; no effect applied.',
  };

  const strategyKind = result.accommodationStrategy;
  if (strategyKind === 'none') {
    return { applied: false, effect: 'No strategy applied.' };
  }

  return {
    applied: true,
    effect: effectDescriptions[strategyKind],
  };
}


// ===================== STEP 207: CONVERSATIONAL IMPLICATURE DEFAULTS =====================

// ---- 207 Types ----

/** Category of conversational implicature (Gricean maxims). */
export type ImplicatureCategory =
  | 'scalar'
  | 'manner'
  | 'relevance'
  | 'quantity'
  | 'quality';

/** A default mapping from a word/phrase to implied music production actions. */
export interface ImplicatureDefault {
  readonly id: string;
  readonly triggerPhrase: string;
  readonly pattern: string;
  readonly category: ImplicatureCategory;
  readonly defaultActions: readonly string[];
  readonly description: string;
  readonly confidence: number;
}

/** A mapping result applying an implicature default. */
export interface ImplicatureMapping {
  readonly implicatureId: string;
  readonly triggerPhrase: string;
  readonly resolvedActions: readonly string[];
  readonly category: ImplicatureCategory;
  readonly confidence: number;
  readonly wasOverridden: boolean;
  readonly overrideSource: string;
}

/** An override stored when user corrects a default implicature. */
export interface ImplicatureOverride {
  readonly triggerPhrase: string;
  readonly overrideActions: readonly string[];
  readonly reason: string;
  readonly turnNumber: number;
  readonly permanent: boolean;
}

/** Configuration for the implicature system. */
export interface ImplicatureConfig {
  readonly enableScalarImplicature: boolean;
  readonly enableMannerImplicature: boolean;
  readonly enableRelevanceImplicature: boolean;
  readonly enableQuantityImplicature: boolean;
  readonly enableQualityImplicature: boolean;
  readonly minimumConfidence: number;
  readonly maxOverrides: number;
}

/** Explanation of how an implicature was derived. */
export interface ImplicatureExplanation {
  readonly triggerPhrase: string;
  readonly category: ImplicatureCategory;
  readonly defaultActions: readonly string[];
  readonly reasoning: string;
  readonly overridden: boolean;
  readonly overrideActions: readonly string[];
}

/** Result of batch implicature application. */
export interface ImplicatureBatchResult {
  readonly utterance: string;
  readonly mappings: readonly ImplicatureMapping[];
  readonly totalDetected: number;
  readonly overriddenCount: number;
}

// ---- 207 Implicature Default Registry (40+ entries) ----

const IMPLICATURE_DEFAULTS: readonly ImplicatureDefault[] = [
  // --- Manner-like musical adjective defaults ---
  {
    id: 'impl-tighter',
    triggerPhrase: 'tighter',
    pattern: '\\btighter\\b',
    category: 'manner',
    defaultActions: ['adjust-microtiming:tighter', 'increase-density:moderate'],
    description: '"tighter" defaults to microtiming quantize and density',
    confidence: 0.9,
  },
  {
    id: 'impl-warmer',
    triggerPhrase: 'warmer',
    pattern: '\\bwarmer\\b',
    category: 'manner',
    defaultActions: ['eq-boost:low-mid', 'add-saturation:light'],
    description: '"warmer" defaults to low-mid EQ boost + light saturation',
    confidence: 0.9,
  },
  {
    id: 'impl-bigger',
    triggerPhrase: 'bigger',
    pattern: '\\bbigger\\b',
    category: 'manner',
    defaultActions: ['widen-stereo:moderate', 'add-reverb:medium', 'increase-compression:light'],
    description: '"bigger" defaults to stereo width + reverb + compression',
    confidence: 0.85,
  },
  {
    id: 'impl-cleaner',
    triggerPhrase: 'cleaner',
    pattern: '\\bcleaner\\b',
    category: 'manner',
    defaultActions: ['remove-effects:distortion', 'reduce-distortion:full'],
    description: '"cleaner" defaults to removing distortion/effects',
    confidence: 0.9,
  },
  {
    id: 'impl-punchier',
    triggerPhrase: 'punchier',
    pattern: '\\bpunchier\\b',
    category: 'manner',
    defaultActions: ['transient-shaping:attack-boost', 'increase-compression:moderate'],
    description: '"punchier" defaults to transient shaping + compression',
    confidence: 0.9,
  },
  {
    id: 'impl-smoother',
    triggerPhrase: 'smoother',
    pattern: '\\bsmoother\\b',
    category: 'manner',
    defaultActions: ['reduce-harshness:high-freq', 'articulation:legato'],
    description: '"smoother" defaults to reducing harshness + legato',
    confidence: 0.85,
  },
  {
    id: 'impl-darker',
    triggerPhrase: 'darker',
    pattern: '\\bdarker\\b',
    category: 'manner',
    defaultActions: ['eq-cut:highs', 'eq-boost:lows'],
    description: '"darker" defaults to cutting highs and boosting lows',
    confidence: 0.9,
  },
  {
    id: 'impl-brighter',
    triggerPhrase: 'brighter',
    pattern: '\\bbrighter\\b',
    category: 'manner',
    defaultActions: ['eq-boost:highs', 'add-air:subtle'],
    description: '"brighter" defaults to boosting highs and adding air',
    confidence: 0.9,
  },
  {
    id: 'impl-wider',
    triggerPhrase: 'wider',
    pattern: '\\bwider\\b',
    category: 'manner',
    defaultActions: ['stereo-spread:increase', 'pan-spread:wider'],
    description: '"wider" defaults to stereo spread and panning',
    confidence: 0.9,
  },
  {
    id: 'impl-deeper',
    triggerPhrase: 'deeper',
    pattern: '\\bdeeper\\b',
    category: 'manner',
    defaultActions: ['eq-boost:sub', 'add-reverb:deep'],
    description: '"deeper" defaults to sub boost and deep reverb',
    confidence: 0.85,
  },
  {
    id: 'impl-louder',
    triggerPhrase: 'louder',
    pattern: '\\blouder\\b',
    category: 'manner',
    defaultActions: ['increase-gain:moderate', 'increase-compression:light'],
    description: '"louder" defaults to gain increase and light compression',
    confidence: 0.9,
  },
  {
    id: 'impl-quieter',
    triggerPhrase: 'quieter',
    pattern: '\\bquieter\\b',
    category: 'manner',
    defaultActions: ['decrease-gain:moderate'],
    description: '"quieter" defaults to gain reduction',
    confidence: 0.95,
  },
  {
    id: 'impl-softer',
    triggerPhrase: 'softer',
    pattern: '\\bsofter\\b',
    category: 'manner',
    defaultActions: ['decrease-velocity:moderate', 'decrease-gain:light'],
    description: '"softer" defaults to velocity/gain reduction',
    confidence: 0.85,
  },
  {
    id: 'impl-harder',
    triggerPhrase: 'harder',
    pattern: '\\bharder\\b',
    category: 'manner',
    defaultActions: ['increase-velocity:moderate', 'increase-distortion:light'],
    description: '"harder" defaults to velocity increase and light distortion',
    confidence: 0.8,
  },
  {
    id: 'impl-crunchier',
    triggerPhrase: 'crunchier',
    pattern: '\\bcrunchier\\b',
    category: 'manner',
    defaultActions: ['add-distortion:crunch', 'add-bitcrusher:subtle'],
    description: '"crunchier" defaults to crunch distortion/bitcrush',
    confidence: 0.85,
  },
  {
    id: 'impl-spacious',
    triggerPhrase: 'more spacious',
    pattern: '\\b(more\\s+)?spacious\\b',
    category: 'manner',
    defaultActions: ['add-reverb:large-hall', 'add-delay:subtle', 'widen-stereo:moderate'],
    description: '"more spacious" defaults to large reverb + delay + stereo width',
    confidence: 0.85,
  },
  {
    id: 'impl-intimate',
    triggerPhrase: 'more intimate',
    pattern: '\\b(more\\s+)?intimate\\b',
    category: 'manner',
    defaultActions: ['reduce-reverb:dry', 'narrow-stereo:moderate', 'decrease-gain:light'],
    description: '"more intimate" defaults to drier, narrower, softer',
    confidence: 0.8,
  },
  {
    id: 'impl-airy',
    triggerPhrase: 'airy',
    pattern: '\\bairy\\b',
    category: 'manner',
    defaultActions: ['eq-boost:air-band', 'add-reverb:light-plate'],
    description: '"airy" defaults to boosting air band + light plate reverb',
    confidence: 0.85,
  },
  {
    id: 'impl-muddy-fix',
    triggerPhrase: 'less muddy',
    pattern: '\\b(less\\s+)?muddy\\b',
    category: 'manner',
    defaultActions: ['eq-cut:low-mid', 'increase-clarity:moderate'],
    description: '"less muddy" defaults to cutting low-mids',
    confidence: 0.9,
  },
  {
    id: 'impl-thinner',
    triggerPhrase: 'thinner',
    pattern: '\\bthinner\\b',
    category: 'manner',
    defaultActions: ['eq-cut:lows', 'reduce-layers:moderate'],
    description: '"thinner" defaults to cutting lows and reducing layers',
    confidence: 0.8,
  },
  {
    id: 'impl-thicker',
    triggerPhrase: 'thicker',
    pattern: '\\bthicker\\b',
    category: 'manner',
    defaultActions: ['add-layers:doubling', 'eq-boost:low-mid', 'add-chorus:subtle'],
    description: '"thicker" defaults to doubling + low-mid boost + chorus',
    confidence: 0.85,
  },
  {
    id: 'impl-grittier',
    triggerPhrase: 'grittier',
    pattern: '\\bgrittier\\b',
    category: 'manner',
    defaultActions: ['add-distortion:grit', 'add-saturation:moderate'],
    description: '"grittier" defaults to distortion + saturation',
    confidence: 0.85,
  },
  {
    id: 'impl-lush',
    triggerPhrase: 'lush',
    pattern: '\\blush\\b',
    category: 'manner',
    defaultActions: ['add-reverb:lush-plate', 'add-chorus:moderate', 'widen-stereo:moderate'],
    description: '"lush" defaults to plate reverb + chorus + stereo width',
    confidence: 0.85,
  },
  {
    id: 'impl-dry',
    triggerPhrase: 'drier',
    pattern: '\\b(drier|dryer|more\\s+dry)\\b',
    category: 'manner',
    defaultActions: ['reduce-reverb:significant', 'reduce-delay:significant'],
    description: '"drier" defaults to reducing reverb and delay significantly',
    confidence: 0.9,
  },
  {
    id: 'impl-wet',
    triggerPhrase: 'wetter',
    pattern: '\\b(wetter|more\\s+wet)\\b',
    category: 'manner',
    defaultActions: ['increase-reverb:significant', 'increase-delay:moderate'],
    description: '"wetter" defaults to more reverb and delay',
    confidence: 0.9,
  },
  {
    id: 'impl-fat',
    triggerPhrase: 'fatter',
    pattern: '\\bfatter\\b',
    category: 'manner',
    defaultActions: ['eq-boost:lows', 'add-saturation:moderate', 'add-compression:moderate'],
    description: '"fatter" defaults to low boost + saturation + compression',
    confidence: 0.85,
  },
  {
    id: 'impl-crisp',
    triggerPhrase: 'crisper',
    pattern: '\\b(crisper|more\\s+crisp)\\b',
    category: 'manner',
    defaultActions: ['transient-shaping:attack-boost', 'eq-boost:presence'],
    description: '"crisper" defaults to transient shaping + presence boost',
    confidence: 0.85,
  },
  {
    id: 'impl-vintage',
    triggerPhrase: 'more vintage',
    pattern: '\\b(more\\s+)?vintage\\b',
    category: 'manner',
    defaultActions: ['add-saturation:tape', 'eq-roll-off:highs-gentle', 'add-noise:subtle-hiss'],
    description: '"vintage" defaults to tape saturation + gentle high rolloff + subtle noise',
    confidence: 0.8,
  },
  {
    id: 'impl-modern',
    triggerPhrase: 'more modern',
    pattern: '\\b(more\\s+)?modern\\b',
    category: 'manner',
    defaultActions: ['increase-clarity:high', 'increase-compression:parallel', 'widen-stereo:moderate'],
    description: '"modern" defaults to clarity + parallel compression + width',
    confidence: 0.75,
  },
  {
    id: 'impl-organic',
    triggerPhrase: 'more organic',
    pattern: '\\b(more\\s+)?organic\\b',
    category: 'manner',
    defaultActions: ['humanize-timing:moderate', 'add-saturation:tape-subtle', 'reduce-quantize:moderate'],
    description: '"organic" defaults to humanized timing + subtle tape',
    confidence: 0.8,
  },
  {
    id: 'impl-aggressive',
    triggerPhrase: 'more aggressive',
    pattern: '\\b(more\\s+)?aggressive\\b',
    category: 'manner',
    defaultActions: ['increase-distortion:moderate', 'increase-compression:heavy', 'increase-velocity:high'],
    description: '"aggressive" defaults to distortion + heavy compression + high velocity',
    confidence: 0.85,
  },
  {
    id: 'impl-subtle',
    triggerPhrase: 'more subtle',
    pattern: '\\b(more\\s+)?subtle\\b',
    category: 'manner',
    defaultActions: ['decrease-effect-amount:50-percent', 'decrease-gain:light'],
    description: '"subtle" defaults to reducing effect amounts',
    confidence: 0.8,
  },
  // --- Scalar implicatures ---
  {
    id: 'impl-scalar-some',
    triggerPhrase: 'some',
    pattern: '\\bsome\\b',
    category: 'scalar',
    defaultActions: ['quantity:partial-not-all'],
    description: '"some" scalarly implicates "not all"',
    confidence: 0.95,
  },
  {
    id: 'impl-scalar-few',
    triggerPhrase: 'a few',
    pattern: '\\ba\\s+few\\b',
    category: 'scalar',
    defaultActions: ['quantity:small-not-many'],
    description: '"a few" scalarly implicates "not many"',
    confidence: 0.9,
  },
  {
    id: 'impl-scalar-several',
    triggerPhrase: 'several',
    pattern: '\\bseveral\\b',
    category: 'scalar',
    defaultActions: ['quantity:moderate-not-all'],
    description: '"several" scalarly implicates "not most or all"',
    confidence: 0.85,
  },
  {
    id: 'impl-scalar-most',
    triggerPhrase: 'most',
    pattern: '\\bmost\\b',
    category: 'scalar',
    defaultActions: ['quantity:majority-not-all'],
    description: '"most" scalarly implicates "not all"',
    confidence: 0.9,
  },
  {
    id: 'impl-scalar-sometimes',
    triggerPhrase: 'sometimes',
    pattern: '\\bsometimes\\b',
    category: 'scalar',
    defaultActions: ['frequency:occasional-not-always'],
    description: '"sometimes" scalarly implicates "not always"',
    confidence: 0.9,
  },
  {
    id: 'impl-scalar-or',
    triggerPhrase: 'or',
    pattern: '\\bor\\b',
    category: 'scalar',
    defaultActions: ['disjunction:exclusive-not-both'],
    description: '"or" scalarly implicates exclusive disjunction',
    confidence: 0.7,
  },
  // --- Relevance implicatures ---
  {
    id: 'impl-relevance-by-the-way',
    triggerPhrase: 'by the way',
    pattern: '\\bby\\s+the\\s+way\\b',
    category: 'relevance',
    defaultActions: ['topic-shift:tangential'],
    description: '"by the way" implicates a tangential but relevant point',
    confidence: 0.8,
  },
  {
    id: 'impl-relevance-speaking-of',
    triggerPhrase: 'speaking of',
    pattern: '\\bspeaking\\s+of\\b',
    category: 'relevance',
    defaultActions: ['topic-shift:related'],
    description: '"speaking of" implicates a related topic shift',
    confidence: 0.85,
  },
  {
    id: 'impl-relevance-also',
    triggerPhrase: 'also',
    pattern: '\\balso\\b',
    category: 'relevance',
    defaultActions: ['addendum:related-action'],
    description: '"also" implicates an additional related point',
    confidence: 0.7,
  },
  // --- Quantity implicatures ---
  {
    id: 'impl-quantity-a-bit',
    triggerPhrase: 'a bit',
    pattern: '\\ba\\s+bit\\b',
    category: 'quantity',
    defaultActions: ['degree:small-amount'],
    description: '"a bit" implicates a small, not large, change',
    confidence: 0.9,
  },
  {
    id: 'impl-quantity-a-lot',
    triggerPhrase: 'a lot',
    pattern: '\\ba\\s+lot\\b',
    category: 'quantity',
    defaultActions: ['degree:large-amount'],
    description: '"a lot" implicates a substantial change',
    confidence: 0.9,
  },
  {
    id: 'impl-quantity-slightly',
    triggerPhrase: 'slightly',
    pattern: '\\bslightly\\b',
    category: 'quantity',
    defaultActions: ['degree:very-small-amount'],
    description: '"slightly" implicates a very small change',
    confidence: 0.95,
  },
  {
    id: 'impl-quantity-just',
    triggerPhrase: 'just',
    pattern: '\\bjust\\b',
    category: 'quantity',
    defaultActions: ['scope:only-this'],
    description: '"just" implicates limitation to only the specified thing',
    confidence: 0.8,
  },
  // --- Quality implicatures ---
  {
    id: 'impl-quality-i-think',
    triggerPhrase: 'I think',
    pattern: '\\bi\\s+think\\b',
    category: 'quality',
    defaultActions: ['certainty:hedged'],
    description: '"I think" hedges certainty, implicating possibility of being wrong',
    confidence: 0.8,
  },
  {
    id: 'impl-quality-maybe',
    triggerPhrase: 'maybe',
    pattern: '\\bmaybe\\b',
    category: 'quality',
    defaultActions: ['certainty:tentative'],
    description: '"maybe" implicates tentativeness, open to alternatives',
    confidence: 0.85,
  },
] as const;

// ---- 207 Override Store ----

/** In-memory store for implicature overrides. */
const _implicatureOverrides: ImplicatureOverride[] = [];

// ---- 207 Functions ----

/**
 * Get the default implicature mapping for a trigger phrase.
 */
export function getImplicatureDefault(triggerPhrase: string): ImplicatureDefault | undefined {
  const lower = lowercaseTrim(triggerPhrase);
  for (const def of IMPLICATURE_DEFAULTS) {
    if (def.triggerPhrase === lower) {
      return def;
    }
    if (matchesTriggerPattern(lower, def.pattern)) {
      return def;
    }
  }
  return undefined;
}

/**
 * Return the full list of implicature defaults.
 */
export function getAllImplicatureDefaults(): readonly ImplicatureDefault[] {
  return IMPLICATURE_DEFAULTS;
}

/**
 * Filter implicature defaults by category.
 */
export function getImplicaturesByCategory(
  category: ImplicatureCategory,
): readonly ImplicatureDefault[] {
  return IMPLICATURE_DEFAULTS.filter((d) => d.category === category);
}

/**
 * Get the category of a detected implicature.
 */
export function getImplicatureCategory(triggerPhrase: string): ImplicatureCategory | undefined {
  const def = getImplicatureDefault(triggerPhrase);
  return def !== undefined ? def.category : undefined;
}

/**
 * Detect all implicature triggers in an utterance.
 */
export function detectImplicature(
  utterance: string,
  config?: ImplicatureConfig,
): readonly ImplicatureDefault[] {
  const lower = lowercaseTrim(utterance);
  const found: ImplicatureDefault[] = [];

  const minConf = config !== undefined ? config.minimumConfidence : 0.0;

  for (const def of IMPLICATURE_DEFAULTS) {
    if (def.confidence < minConf) {
      continue;
    }
    // Check category enable flags
    if (config !== undefined) {
      if (def.category === 'scalar' && !config.enableScalarImplicature) continue;
      if (def.category === 'manner' && !config.enableMannerImplicature) continue;
      if (def.category === 'relevance' && !config.enableRelevanceImplicature) continue;
      if (def.category === 'quantity' && !config.enableQuantityImplicature) continue;
      if (def.category === 'quality' && !config.enableQualityImplicature) continue;
    }

    if (matchesTriggerPattern(lower, def.pattern)) {
      found.push(def);
    }
  }

  return found;
}

/**
 * Check whether an override exists for a given trigger phrase.
 */
export function hasImplicatureOverride(triggerPhrase: string): boolean {
  const lower = lowercaseTrim(triggerPhrase);
  return _implicatureOverrides.some((o) => lowercaseTrim(o.triggerPhrase) === lower);
}

/**
 * Apply a single implicature, respecting any stored override.
 */
export function applyImplicature(
  def: ImplicatureDefault,
): ImplicatureMapping {
  const lower = lowercaseTrim(def.triggerPhrase);
  const override = _implicatureOverrides.find((o) => lowercaseTrim(o.triggerPhrase) === lower);

  if (override !== undefined) {
    return {
      implicatureId: def.id,
      triggerPhrase: def.triggerPhrase,
      resolvedActions: override.overrideActions,
      category: def.category,
      confidence: def.confidence,
      wasOverridden: true,
      overrideSource: override.reason,
    };
  }

  return {
    implicatureId: def.id,
    triggerPhrase: def.triggerPhrase,
    resolvedActions: def.defaultActions,
    category: def.category,
    confidence: def.confidence,
    wasOverridden: false,
    overrideSource: '',
  };
}

/**
 * Store an override for a trigger phrase.
 */
export function overrideImplicature(
  triggerPhrase: string,
  overrideActions: readonly string[],
  reason: string,
  turnNumber: number,
  permanent: boolean,
): ImplicatureOverride {
  const entry: ImplicatureOverride = {
    triggerPhrase,
    overrideActions,
    reason,
    turnNumber,
    permanent,
  };

  // Remove existing override for same phrase
  const lower = lowercaseTrim(triggerPhrase);
  const idx = _implicatureOverrides.findIndex((o) => lowercaseTrim(o.triggerPhrase) === lower);
  if (idx >= 0) {
    _implicatureOverrides.splice(idx, 1);
  }

  _implicatureOverrides.push(entry);
  return entry;
}

/**
 * Clear all stored overrides.
 */
export function clearImplicatureOverrides(): number {
  const count = _implicatureOverrides.length;
  _implicatureOverrides.length = 0;
  return count;
}

/**
 * Rank implicature defaults by confidence descending.
 */
export function rankImplicatureDefaults(
  defaults: readonly ImplicatureDefault[],
): readonly ImplicatureDefault[] {
  const sorted = [...defaults];
  sorted.sort((a, b) => b.confidence - a.confidence);
  return sorted;
}

/**
 * Format a human-readable explanation of how an implicature was resolved.
 */
export function formatImplicatureExplanation(mapping: ImplicatureMapping): ImplicatureExplanation {
  const def = getImplicatureDefault(mapping.triggerPhrase);
  const defaultActions = def !== undefined ? def.defaultActions : [];

  const reasoning = mapping.wasOverridden
    ? `User overrode default for "${mapping.triggerPhrase}": ${mapping.overrideSource}`
    : `Applied default mapping for "${mapping.triggerPhrase}" (${mapping.category} implicature)`;

  return {
    triggerPhrase: mapping.triggerPhrase,
    category: mapping.category,
    defaultActions: [...defaultActions],
    reasoning,
    overridden: mapping.wasOverridden,
    overrideActions: mapping.wasOverridden ? [...mapping.resolvedActions] : [],
  };
}

/**
 * Batch-apply all detected implicatures in an utterance.
 */
export function batchApplyImplicatures(
  utterance: string,
  config?: ImplicatureConfig,
): ImplicatureBatchResult {
  const detected = detectImplicature(utterance, config);
  const mappings: ImplicatureMapping[] = [];
  let overriddenCount = 0;

  for (const def of detected) {
    const mapping = applyImplicature(def);
    mappings.push(mapping);
    if (mapping.wasOverridden) {
      overriddenCount++;
    }
  }

  return {
    utterance,
    mappings,
    totalDetected: detected.length,
    overriddenCount,
  };
}


// ===================== STEP 208: QUD STACK TRACKING =====================

// ---- 208 Types ----

/** The type of question under discussion. */
export type QUDType =
  | 'explicit-question'
  | 'implicit-question'
  | 'task-question'
  | 'clarification-question'
  | 'meta-question';

/** A single QUD entry on the stack. */
export interface QUDEntry {
  readonly qudId: string;
  readonly questionText: string;
  readonly qudType: QUDType;
  readonly pushedAtTurn: number;
  readonly resolvedAtTurn: number | null;
  readonly parentQudId: string | null;
  readonly resolved: boolean;
  readonly resolution: string;
  readonly relatedEntityIds: readonly string[];
  readonly tags: readonly string[];
}

/** The full QUD stack. */
export interface QUDStack {
  readonly entries: readonly QUDEntry[];
  readonly maxDepth: number;
  readonly currentTurn: number;
}

/** Resolution of a QUD. */
export interface QUDResolution {
  readonly qudId: string;
  readonly resolvedBy: string;
  readonly resolvedAtTurn: number;
  readonly resolutionText: string;
  readonly popChildren: boolean;
}

/** Contextual information from the QUD stack for interpretation. */
export interface QUDContext {
  readonly currentQUD: QUDEntry | null;
  readonly qudDepth: number;
  readonly parentQUD: QUDEntry | null;
  readonly recentQUDs: readonly QUDEntry[];
  readonly unresolvedCount: number;
}

/** Pattern for detecting implicit QUDs. */
interface QUDDetectionPattern {
  readonly patternId: string;
  readonly regex: string;
  readonly generatedQUD: string;
  readonly qudType: QUDType;
  readonly description: string;
}

/** Result of generating a QUD from an utterance. */
export interface QUDGenerationResult {
  readonly utterance: string;
  readonly generatedQUDs: readonly QUDEntry[];
  readonly patternIds: readonly string[];
}

/** Result of merging two QUD stacks. */
export interface QUDMergeResult {
  readonly merged: QUDStack;
  readonly addedCount: number;
  readonly deduplicatedCount: number;
}

// ---- 208 QUD Detection Patterns (20+) ----

const QUD_DETECTION_PATTERNS: readonly QUDDetectionPattern[] = [
  // Explicit questions
  {
    patternId: 'qud-what-question',
    regex: '\\bwhat\\s+(should|do|does|is|are|would|could|can)\\b',
    generatedQUD: 'What {action/property}?',
    qudType: 'explicit-question',
    description: 'Explicit "what" question',
  },
  {
    patternId: 'qud-how-question',
    regex: '\\bhow\\s+(should|do|does|would|could|can)\\b',
    generatedQUD: 'How should {action} be done?',
    qudType: 'explicit-question',
    description: 'Explicit "how" question',
  },
  {
    patternId: 'qud-which-question',
    regex: '\\bwhich\\s+\\w+',
    generatedQUD: 'Which {entity} is intended?',
    qudType: 'explicit-question',
    description: 'Explicit "which" selection question',
  },
  {
    patternId: 'qud-where-question',
    regex: '\\bwhere\\s+(should|do|does|is|are)\\b',
    generatedQUD: 'Where should {action} be applied?',
    qudType: 'explicit-question',
    description: 'Explicit "where" location question',
  },
  {
    patternId: 'qud-should-question',
    regex: '\\bshould\\s+(i|we)\\b',
    generatedQUD: 'Should {action} be performed?',
    qudType: 'explicit-question',
    description: 'Explicit "should" question',
  },
  // Implicit QUDs from commands
  {
    patternId: 'qud-make-it',
    regex: '\\bmake\\s+it\\s+(\\w+)',
    generatedQUD: 'How should the {property} be adjusted?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from "make it X" command',
  },
  {
    patternId: 'qud-change-the',
    regex: '\\bchange\\s+the\\s+(\\w+)',
    generatedQUD: 'What changes to make to {entity}?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from "change the X" command',
  },
  {
    patternId: 'qud-add-something',
    regex: '\\badd\\s+(\\w+)',
    generatedQUD: 'How should {entity} be added?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from "add X" command',
  },
  {
    patternId: 'qud-remove-something',
    regex: '\\b(remove|delete)\\s+(\\w+)',
    generatedQUD: 'Which {entity} should be removed?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from "remove X" command',
  },
  {
    patternId: 'qud-adjust-parameter',
    regex: '\\b(adjust|tweak|modify)\\s+(the\\s+)?(\\w+)',
    generatedQUD: 'How should {parameter} be adjusted?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from parameter adjustment command',
  },
  // Task QUDs
  {
    patternId: 'qud-lets-work-on',
    regex: "\\b(let'?s|let\\s+us)\\s+(work\\s+on|edit|fix|improve)\\s+(the\\s+)?(\\w+)",
    generatedQUD: 'What changes to make to {section}?',
    qudType: 'task-question',
    description: 'Task QUD from "let\'s work on X"',
  },
  {
    patternId: 'qud-focus-on',
    regex: '\\bfocus\\s+on\\s+(the\\s+)?(\\w+)',
    generatedQUD: 'What to do with {section}?',
    qudType: 'task-question',
    description: 'Task QUD from "focus on X"',
  },
  {
    patternId: 'qud-for-the',
    regex: '\\bfor\\s+the\\s+(\\w+)',
    generatedQUD: 'What changes for {section}?',
    qudType: 'task-question',
    description: 'Task QUD from "for the X" context',
  },
  {
    patternId: 'qud-in-the',
    regex: '\\bin\\s+the\\s+(chorus|verse|bridge|intro|outro|breakdown|drop|buildup|pre-chorus)',
    generatedQUD: 'What changes in {section}?',
    qudType: 'task-question',
    description: 'Task QUD from "in the [section]" context',
  },
  // Clarification QUDs
  {
    patternId: 'qud-do-you-mean',
    regex: '\\bdo\\s+you\\s+mean\\b',
    generatedQUD: 'What did the user mean by {ambiguous-phrase}?',
    qudType: 'clarification-question',
    description: 'Clarification QUD: meaning disambiguation',
  },
  {
    patternId: 'qud-are-you-sure',
    regex: '\\bare\\s+you\\s+sure\\b',
    generatedQUD: 'Is the user certain about {action}?',
    qudType: 'clarification-question',
    description: 'Clarification QUD: confirmation',
  },
  {
    patternId: 'qud-can-you-clarify',
    regex: '\\b(can\\s+you\\s+)?(clarify|explain|specify)\\b',
    generatedQUD: 'What does the user mean by {phrase}?',
    qudType: 'clarification-question',
    description: 'Clarification QUD: elaboration request',
  },
  // Meta QUDs
  {
    patternId: 'qud-what-happened',
    regex: '\\bwhat\\s+(just\\s+)?happened\\b',
    generatedQUD: 'What action was just performed?',
    qudType: 'meta-question',
    description: 'Meta QUD: querying recent action',
  },
  {
    patternId: 'qud-why-did',
    regex: '\\bwhy\\s+did\\b',
    generatedQUD: 'Why was {action} performed?',
    qudType: 'meta-question',
    description: 'Meta QUD: querying reason for action',
  },
  {
    patternId: 'qud-can-you-undo',
    regex: '\\bcan\\s+(you\\s+)?(undo|revert)\\b',
    generatedQUD: 'Can the last action be undone?',
    qudType: 'meta-question',
    description: 'Meta QUD: undo possibility',
  },
  {
    patternId: 'qud-what-options',
    regex: '\\bwhat\\s+(are\\s+)?(the\\s+)?(options|choices|alternatives)\\b',
    generatedQUD: 'What alternatives are available?',
    qudType: 'meta-question',
    description: 'Meta QUD: available alternatives',
  },
  {
    patternId: 'qud-try-something',
    regex: '\\b(try|experiment\\s+with)\\s+(\\w+)',
    generatedQUD: 'How should {entity} be tried/experimented?',
    qudType: 'implicit-question',
    description: 'Implicit QUD from experimentation command',
  },
] as const;

// ---- 208 QUD ID generation ----

let _qudIdCounter = 0;
function generateQUDId(): string {
  _qudIdCounter++;
  return `qud-${String(_qudIdCounter)}`;
}

// ---- 208 Functions ----

/**
 * Create a fresh, empty QUD stack.
 */
export function createQUDStack(maxDepth?: number): QUDStack {
  return {
    entries: [],
    maxDepth: maxDepth !== undefined ? maxDepth : 20,
    currentTurn: 0,
  };
}

/**
 * Push a new QUD onto the stack.
 */
export function pushQUD(
  stack: QUDStack,
  questionText: string,
  qudType: QUDType,
  turnNumber: number,
  parentQudId?: string,
  relatedEntityIds?: readonly string[],
  tags?: readonly string[],
): QUDStack {
  const entry: QUDEntry = {
    qudId: generateQUDId(),
    questionText,
    qudType,
    pushedAtTurn: turnNumber,
    resolvedAtTurn: null,
    parentQudId: parentQudId !== undefined ? parentQudId : null,
    resolved: false,
    resolution: '',
    relatedEntityIds: relatedEntityIds !== undefined ? relatedEntityIds : [],
    tags: tags !== undefined ? tags : [],
  };

  const newEntries = [...stack.entries, entry];

  // Enforce maxDepth by discarding oldest resolved entries
  let trimmed = newEntries;
  if (trimmed.length > stack.maxDepth) {
    const resolvedIndices: number[] = [];
    for (let i = 0; i < trimmed.length; i++) {
      const e = trimmed[i];
      if (e !== undefined && e.resolved) {
        resolvedIndices.push(i);
      }
    }
    // Remove oldest resolved entries until we are within limit
    while (trimmed.length > stack.maxDepth && resolvedIndices.length > 0) {
      const removeIdx = resolvedIndices.shift();
      if (removeIdx !== undefined) {
        trimmed = [...trimmed.slice(0, removeIdx), ...trimmed.slice(removeIdx + 1)];
        // Adjust remaining indices
        for (let j = 0; j < resolvedIndices.length; j++) {
          const curIdx = resolvedIndices[j];
          if (curIdx !== undefined && curIdx > removeIdx) {
            resolvedIndices[j] = curIdx - 1;
          }
        }
      }
    }
  }

  return {
    entries: trimmed,
    maxDepth: stack.maxDepth,
    currentTurn: turnNumber,
  };
}

/**
 * Pop (resolve) the top unresolved QUD on the stack.
 */
export function popQUD(
  stack: QUDStack,
  resolutionText: string,
  turnNumber: number,
): QUDStack {
  // Find the top-most unresolved entry
  let topUnresIdx = -1;
  for (let i = stack.entries.length - 1; i >= 0; i--) {
    const entry = stack.entries[i];
    if (entry !== undefined && !entry.resolved) {
      topUnresIdx = i;
      break;
    }
  }

  if (topUnresIdx < 0) {
    return { ...stack, currentTurn: turnNumber };
  }

  const topEntry = stack.entries[topUnresIdx];
  if (topEntry === undefined) {
    return { ...stack, currentTurn: turnNumber };
  }

  const resolvedEntry: QUDEntry = {
    qudId: topEntry.qudId,
    questionText: topEntry.questionText,
    qudType: topEntry.qudType,
    pushedAtTurn: topEntry.pushedAtTurn,
    resolvedAtTurn: turnNumber,
    parentQudId: topEntry.parentQudId,
    resolved: true,
    resolution: resolutionText,
    relatedEntityIds: topEntry.relatedEntityIds,
    tags: topEntry.tags,
  };

  const newEntries = [
    ...stack.entries.slice(0, topUnresIdx),
    resolvedEntry,
    ...stack.entries.slice(topUnresIdx + 1),
  ];

  return {
    entries: newEntries,
    maxDepth: stack.maxDepth,
    currentTurn: turnNumber,
  };
}

/**
 * Peek at the top unresolved QUD without modifying the stack.
 */
export function peekQUD(stack: QUDStack): QUDEntry | null {
  for (let i = stack.entries.length - 1; i >= 0; i--) {
    const entry = stack.entries[i];
    if (entry !== undefined && !entry.resolved) {
      return entry;
    }
  }
  return null;
}

/**
 * Detect implicit QUDs from an utterance and return generated QUD entries.
 */
export function detectImplicitQUD(
  utterance: string,
  turnNumber: number,
): readonly QUDEntry[] {
  const lower = lowercaseTrim(utterance);
  const results: QUDEntry[] = [];

  for (const pat of QUD_DETECTION_PATTERNS) {
    if (matchesTriggerPattern(lower, pat.regex)) {
      results.push({
        qudId: generateQUDId(),
        questionText: pat.generatedQUD,
        qudType: pat.qudType,
        pushedAtTurn: turnNumber,
        resolvedAtTurn: null,
        parentQudId: null,
        resolved: false,
        resolution: '',
        relatedEntityIds: [],
        tags: [pat.patternId],
      });
    }
  }

  return results;
}

/**
 * Check whether an utterance is addressing (answering) the current top QUD.
 */
export function isAddressingCurrentQUD(
  utterance: string,
  stack: QUDStack,
): boolean {
  const top = peekQUD(stack);
  if (top === null) {
    return false;
  }

  const lower = lowercaseTrim(utterance);

  // Heuristic: declarative utterances (not questions) that share entity references with the QUD
  const isQuestion = /\?$/.test(lower) ||
    /^(what|how|which|where|when|why|should|can|do|does|is|are)\b/.test(lower);

  if (isQuestion) {
    // Questions push new QUDs, they don't answer current ones
    return false;
  }

  // Short affirmative/negative answers address the current QUD
  if (/^(yes|no|yeah|nah|yep|nope|sure|ok|fine|right|exactly)[\s!.]*$/i.test(lower)) {
    return true;
  }

  // Commands likely address the implicit QUD
  if (top.qudType === 'implicit-question' || top.qudType === 'task-question') {
    // Most non-question utterances are interpreted as addressing the current task QUD
    return true;
  }

  // For clarification QUDs, check if the utterance is providing info
  if (top.qudType === 'clarification-question') {
    return lower.length > 0;
  }

  return false;
}

/**
 * Resolve an utterance against the current QUD context.
 * Returns the QUD it's addressing and interpretation context.
 */
export function resolveAgainstQUD(
  utterance: string,
  stack: QUDStack,
): { readonly addressedQUD: QUDEntry | null; readonly interpretation: string } {
  const top = peekQUD(stack);

  if (top === null) {
    return {
      addressedQUD: null,
      interpretation: 'No active QUD; utterance interpreted at face value.',
    };
  }

  if (isAddressingCurrentQUD(utterance, stack)) {
    return {
      addressedQUD: top,
      interpretation: `Utterance "${utterance}" interpreted as addressing QUD: "${top.questionText}"`,
    };
  }

  // Check if it matches any detection pattern (new QUD being pushed)
  const lower = lowercaseTrim(utterance);
  for (const pat of QUD_DETECTION_PATTERNS) {
    if (matchesTriggerPattern(lower, pat.regex)) {
      return {
        addressedQUD: null,
        interpretation: `Utterance pushes new ${pat.qudType}: "${pat.generatedQUD}"`,
      };
    }
  }

  return {
    addressedQUD: null,
    interpretation: 'Utterance does not clearly address or generate a QUD.',
  };
}

/**
 * Get contextual information about the current QUD state.
 */
export function getQUDContext(stack: QUDStack): QUDContext {
  const current = peekQUD(stack);
  let parentQUD: QUDEntry | null = null;

  if (current !== null && current.parentQudId !== null) {
    for (const entry of stack.entries) {
      if (entry.qudId === current.parentQudId) {
        parentQUD = entry;
        break;
      }
    }
  }

  // Get recent unresolved QUDs
  const recentQUDs: QUDEntry[] = [];
  for (let i = stack.entries.length - 1; i >= 0 && recentQUDs.length < 5; i--) {
    const entry = stack.entries[i];
    if (entry !== undefined && !entry.resolved) {
      recentQUDs.push(entry);
    }
  }

  const unresolvedCount = stack.entries.filter((e) => !e.resolved).length;

  return {
    currentQUD: current,
    qudDepth: recentQUDs.length,
    parentQUD,
    recentQUDs,
    unresolvedCount,
  };
}

/**
 * Format the QUD stack as a human-readable string.
 */
export function formatQUDStack(stack: QUDStack): string {
  const lines: string[] = [];
  lines.push(`QUD Stack (${String(stack.entries.length)} entries, turn ${String(stack.currentTurn)}):`);

  for (let i = stack.entries.length - 1; i >= 0; i--) {
    const entry = stack.entries[i];
    if (entry === undefined) continue;
    const statusChar = entry.resolved ? 'R' : 'O';
    const depth = entry.parentQudId !== null ? '  ' : '';
    lines.push(
      `  ${depth}[${statusChar}] ${entry.qudId}: "${entry.questionText}" (${entry.qudType}, turn ${String(entry.pushedAtTurn)})`,
    );
    if (entry.resolved) {
      lines.push(`  ${depth}     resolved: "${entry.resolution}" at turn ${String(entry.resolvedAtTurn)}`);
    }
  }

  const unresolvedCount = stack.entries.filter((e) => !e.resolved).length;
  lines.push(`  Open questions: ${String(unresolvedCount)}`);
  return lines.join('\n');
}

/**
 * Remove all resolved QUDs from the stack (collapse resolved entries).
 */
export function collapseResolvedQUDs(stack: QUDStack): QUDStack {
  const remaining = stack.entries.filter((e) => !e.resolved);
  return {
    entries: remaining,
    maxDepth: stack.maxDepth,
    currentTurn: stack.currentTurn,
  };
}

/**
 * Get the depth of the QUD stack (number of unresolved entries).
 */
export function getQUDDepth(stack: QUDStack): number {
  return stack.entries.filter((e) => !e.resolved).length;
}

/**
 * Find a QUD by its type on the stack (most recent first).
 */
export function findQUDByType(stack: QUDStack, qudType: QUDType): QUDEntry | null {
  for (let i = stack.entries.length - 1; i >= 0; i--) {
    const entry = stack.entries[i];
    if (entry !== undefined && entry.qudType === qudType && !entry.resolved) {
      return entry;
    }
  }
  return null;
}

/**
 * Check whether a specific QUD is resolved.
 */
export function isQUDResolved(stack: QUDStack, qudId: string): boolean {
  for (const entry of stack.entries) {
    if (entry.qudId === qudId) {
      return entry.resolved;
    }
  }
  return false;
}

/**
 * Generate QUD entries from an utterance and return generation metadata.
 */
export function generateQUDFromUtterance(
  utterance: string,
  turnNumber: number,
): QUDGenerationResult {
  const lower = lowercaseTrim(utterance);
  const entries: QUDEntry[] = [];
  const patternIds: string[] = [];

  for (const pat of QUD_DETECTION_PATTERNS) {
    if (matchesTriggerPattern(lower, pat.regex)) {
      entries.push({
        qudId: generateQUDId(),
        questionText: pat.generatedQUD,
        qudType: pat.qudType,
        pushedAtTurn: turnNumber,
        resolvedAtTurn: null,
        parentQudId: null,
        resolved: false,
        resolution: '',
        relatedEntityIds: [],
        tags: [pat.patternId],
      });
      patternIds.push(pat.patternId);
    }
  }

  return {
    utterance,
    generatedQUDs: entries,
    patternIds,
  };
}

/**
 * Merge two QUD stacks, deduplicating by qudId.
 */
export function mergeQUDStacks(a: QUDStack, b: QUDStack): QUDMergeResult {
  const seen = new Set<string>();
  const merged: QUDEntry[] = [];
  let deduplicatedCount = 0;

  for (const entry of a.entries) {
    seen.add(entry.qudId);
    merged.push(entry);
  }

  let addedCount = 0;
  for (const entry of b.entries) {
    if (seen.has(entry.qudId)) {
      deduplicatedCount++;
    } else {
      merged.push(entry);
      addedCount++;
    }
  }

  const maxTurn = Math.max(a.currentTurn, b.currentTurn);

  return {
    merged: {
      entries: merged,
      maxDepth: Math.max(a.maxDepth, b.maxDepth),
      currentTurn: maxTurn,
    },
    addedCount,
    deduplicatedCount,
  };
}


// ===================== STEP 209: CLARIFICATION GENERATION =====================

// ---- 209 Types ----

/** Priority level for a clarification request. */
export type ClarificationPriority = 'critical' | 'important' | 'minor';

/** Strategy for generating clarification questions. */
export type ClarificationStrategy =
  | 'binary-choice'
  | 'multi-choice'
  | 'open-ended'
  | 'scope-narrowing'
  | 'type-selection'
  | 'confirmation'
  | 'parameter-specification';

/** A single candidate option that a clarification distinguishes. */
export interface ClarificationOption {
  readonly optionId: string;
  readonly label: string;
  readonly description: string;
  readonly probability: number;
  readonly associatedAction: string;
}

/** Information gain computation for a candidate question. */
export interface InformationGain {
  readonly questionText: string;
  readonly entropy_before: number;
  readonly entropy_after: number;
  readonly gain: number;
  readonly candidateReduction: number;
  readonly totalCandidates: number;
}

/** A generated clarification request. */
export interface ClarificationRequest {
  readonly requestId: string;
  readonly questionText: string;
  readonly strategy: ClarificationStrategy;
  readonly priority: ClarificationPriority;
  readonly options: readonly ClarificationOption[];
  readonly informationGain: InformationGain;
  readonly defaultOptionId: string;
  readonly contextQUDId: string;
  readonly utteranceRef: string;
  readonly tags: readonly string[];
}

/** A batch of related clarification requests. */
export interface ClarificationBatch {
  readonly batchId: string;
  readonly requests: readonly ClarificationRequest[];
  readonly combinedQuestionText: string;
  readonly totalGain: number;
  readonly priority: ClarificationPriority;
}

/** The result of applying a user's answer to a clarification. */
export interface ClarificationAnswer {
  readonly requestId: string;
  readonly selectedOptionId: string;
  readonly freeText: string;
  readonly turnNumber: number;
  readonly resolved: boolean;
}

/** A follow-up clarification generated after an initial answer. */
export interface FollowUpClarification {
  readonly originalRequestId: string;
  readonly followUp: ClarificationRequest;
  readonly reason: string;
}

/** Template for generating clarification questions. */
interface ClarificationTemplate {
  readonly templateId: string;
  readonly pattern: string;
  readonly questionTemplate: string;
  readonly strategy: ClarificationStrategy;
  readonly priority: ClarificationPriority;
  readonly description: string;
}

// ---- 209 Clarification Templates (25+) ----

const CLARIFICATION_TEMPLATES: readonly ClarificationTemplate[] = [
  // --- Binary choice ---
  {
    templateId: 'clar-x-or-y',
    pattern: 'ambiguous-binary',
    questionTemplate: 'Did you mean {option_a} or {option_b}?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Binary disambiguation between two options',
  },
  {
    templateId: 'clar-which-track',
    pattern: 'ambiguous-track',
    questionTemplate: 'Which track are you referring to: {track_list}?',
    strategy: 'multi-choice',
    priority: 'critical',
    description: 'Track disambiguation when multiple tracks match',
  },
  {
    templateId: 'clar-which-section',
    pattern: 'ambiguous-section',
    questionTemplate: 'Which section should this apply to: {section_list}?',
    strategy: 'multi-choice',
    priority: 'critical',
    description: 'Section disambiguation',
  },
  {
    templateId: 'clar-scope-all-or-selected',
    pattern: 'ambiguous-scope',
    questionTemplate: 'Should this apply to all {entity_type} or just the selected one?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Scope clarification: all vs. selected',
  },
  {
    templateId: 'clar-parameter-value',
    pattern: 'missing-parameter',
    questionTemplate: 'How much {parameter} adjustment do you want?',
    strategy: 'parameter-specification',
    priority: 'important',
    description: 'Missing parameter value for an action',
  },
  {
    templateId: 'clar-effect-type',
    pattern: 'ambiguous-effect',
    questionTemplate: 'Which type of {effect} did you have in mind: {effect_options}?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'Effect type disambiguation',
  },
  {
    templateId: 'clar-timing-scope',
    pattern: 'ambiguous-timing',
    questionTemplate: 'Should this change apply from {point_a} or across the entire {scope}?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Temporal scope clarification',
  },
  {
    templateId: 'clar-confirm-destructive',
    pattern: 'destructive-action',
    questionTemplate: 'This will {action_desc}. Are you sure you want to proceed?',
    strategy: 'confirmation',
    priority: 'critical',
    description: 'Confirmation for destructive/irreversible actions',
  },
  {
    templateId: 'clar-eq-band',
    pattern: 'ambiguous-eq-band',
    questionTemplate: 'Which EQ band: lows, low-mids, mids, high-mids, or highs?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'EQ band clarification',
  },
  {
    templateId: 'clar-reverb-type',
    pattern: 'ambiguous-reverb',
    questionTemplate: 'What type of reverb: room, plate, hall, or spring?',
    strategy: 'multi-choice',
    priority: 'minor',
    description: 'Reverb type disambiguation',
  },
  {
    templateId: 'clar-compression-amount',
    pattern: 'ambiguous-compression',
    questionTemplate: 'How much compression: light, moderate, or heavy?',
    strategy: 'multi-choice',
    priority: 'minor',
    description: 'Compression amount clarification',
  },
  {
    templateId: 'clar-which-instrument',
    pattern: 'ambiguous-instrument',
    questionTemplate: 'Which instrument: {instrument_list}?',
    strategy: 'multi-choice',
    priority: 'critical',
    description: 'Instrument disambiguation',
  },
  {
    templateId: 'clar-relative-absolute',
    pattern: 'ambiguous-value-type',
    questionTemplate: 'Do you want to set {param} to {value} or change it by {value}?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Relative vs. absolute value clarification',
  },
  {
    templateId: 'clar-keep-or-replace',
    pattern: 'ambiguous-keep-replace',
    questionTemplate: 'Should I keep the existing {entity} and add new, or replace it entirely?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Keep/add vs. replace clarification',
  },
  {
    templateId: 'clar-confirm-overwrite',
    pattern: 'overwrite-confirmation',
    questionTemplate: 'This will overwrite the existing {entity}. Continue?',
    strategy: 'confirmation',
    priority: 'critical',
    description: 'Overwrite confirmation',
  },
  {
    templateId: 'clar-tempo-scope',
    pattern: 'ambiguous-tempo-scope',
    questionTemplate: 'Change the tempo for the whole track or just {section}?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Tempo change scope',
  },
  {
    templateId: 'clar-pan-direction',
    pattern: 'ambiguous-pan',
    questionTemplate: 'Pan to the left or right?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Pan direction clarification',
  },
  {
    templateId: 'clar-layer-position',
    pattern: 'ambiguous-layer-position',
    questionTemplate: 'Add the layer above, below, or alongside the existing one?',
    strategy: 'multi-choice',
    priority: 'minor',
    description: 'Layer position clarification',
  },
  {
    templateId: 'clar-automation-shape',
    pattern: 'ambiguous-automation',
    questionTemplate: 'What automation curve: linear, exponential, or s-curve?',
    strategy: 'multi-choice',
    priority: 'minor',
    description: 'Automation curve shape clarification',
  },
  {
    templateId: 'clar-fade-type',
    pattern: 'ambiguous-fade',
    questionTemplate: 'Fade in, fade out, or crossfade?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'Fade type clarification',
  },
  {
    templateId: 'clar-velocity-range',
    pattern: 'ambiguous-velocity',
    questionTemplate: 'Adjust velocity for all notes or just the {range} notes?',
    strategy: 'binary-choice',
    priority: 'minor',
    description: 'Velocity range clarification',
  },
  {
    templateId: 'clar-key-scale',
    pattern: 'ambiguous-key',
    questionTemplate: 'In {key} major or {key} minor?',
    strategy: 'binary-choice',
    priority: 'important',
    description: 'Key/scale clarification',
  },
  {
    templateId: 'clar-reference-track',
    pattern: 'ambiguous-reference',
    questionTemplate: 'Use which track as the reference: {track_list}?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'Reference track clarification',
  },
  {
    templateId: 'clar-what-specifically',
    pattern: 'vague-instruction',
    questionTemplate: 'Could you be more specific about what you want to {action}?',
    strategy: 'open-ended',
    priority: 'important',
    description: 'Open-ended clarification for vague instructions',
  },
  {
    templateId: 'clar-how-much',
    pattern: 'missing-degree',
    questionTemplate: 'How much {adjective}er should it be?',
    strategy: 'parameter-specification',
    priority: 'minor',
    description: 'Degree specification for comparative adjectives',
  },
  {
    templateId: 'clar-which-mix',
    pattern: 'ambiguous-mix-version',
    questionTemplate: 'Which mix version: {version_list}?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'Mix version disambiguation',
  },
  {
    templateId: 'clar-sidechain-source',
    pattern: 'missing-sidechain',
    questionTemplate: 'What should be the sidechain source: {source_list}?',
    strategy: 'multi-choice',
    priority: 'important',
    description: 'Sidechain source specification',
  },
] as const;

// ---- 209 ID generation ----

let _clarificationIdCounter = 0;
function generateClarificationId(): string {
  _clarificationIdCounter++;
  return `clar-${String(_clarificationIdCounter)}`;
}

let _batchIdCounter = 0;
function generateBatchId(): string {
  _batchIdCounter++;
  return `clar-batch-${String(_batchIdCounter)}`;
}

// ---- 209 Functions ----

/**
 * Compute entropy of a probability distribution.
 */
function computeEntropy(probabilities: readonly number[]): number {
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Compute information gain for a candidate clarification question.
 * The question splits candidates into groups; gain is entropy reduction.
 */
export function computeInformationGain(
  options: readonly ClarificationOption[],
): InformationGain {
  if (options.length === 0) {
    return {
      questionText: '',
      entropy_before: 0,
      entropy_after: 0,
      gain: 0,
      candidateReduction: 0,
      totalCandidates: 0,
    };
  }

  const total = options.length;

  // Before asking: uniform distribution over candidates
  const uniformProbs = options.map(() => 1 / total);
  const entropyBefore = computeEntropy(uniformProbs);

  // After asking: we know the answer, so entropy is 0 for a perfect split
  // For a realistic model, estimate based on option probabilities
  const probSum = options.reduce((acc, o) => acc + o.probability, 0);
  const normalizedProbs = probSum > 0
    ? options.map((o) => o.probability / probSum)
    : uniformProbs;

  // Expected entropy after: weighted average of branch entropies
  // For simplicity with discrete options, each branch has 0 entropy (we pick one)
  // Gain = entropyBefore - 0 = entropyBefore for a fully disambiguating question
  // For partially disambiguating, compute expected posterior entropy
  const entropyAfter = computeEntropy(normalizedProbs) * 0.3; // partial resolution factor

  const gain = entropyBefore - entropyAfter;
  const candidateReduction = Math.max(1, Math.round(total * (gain / Math.max(entropyBefore, 0.001))));

  return {
    questionText: '',
    entropy_before: entropyBefore,
    entropy_after: entropyAfter,
    gain,
    candidateReduction,
    totalCandidates: total,
  };
}

/**
 * Generate a clarification request from a template and options.
 */
export function generateClarification(
  templateId: string,
  options: readonly ClarificationOption[],
  utteranceRef: string,
  contextQUDId?: string,
  tags?: readonly string[],
): ClarificationRequest {
  const template = CLARIFICATION_TEMPLATES.find((t) => t.templateId === templateId);

  const questionText = template !== undefined
    ? template.questionTemplate
    : 'Could you clarify what you mean?';

  const strategy: ClarificationStrategy = template !== undefined
    ? template.strategy
    : 'open-ended';

  const priority: ClarificationPriority = template !== undefined
    ? template.priority
    : 'important';

  const ig = computeInformationGain(options);
  const igWithQuestion: InformationGain = {
    questionText,
    entropy_before: ig.entropy_before,
    entropy_after: ig.entropy_after,
    gain: ig.gain,
    candidateReduction: ig.candidateReduction,
    totalCandidates: ig.totalCandidates,
  };

  const defaultOpt = options.length > 0 ? options[0] : undefined;
  const defaultOptionId = defaultOpt !== undefined ? defaultOpt.optionId : '';

  return {
    requestId: generateClarificationId(),
    questionText,
    strategy,
    priority,
    options,
    informationGain: igWithQuestion,
    defaultOptionId,
    contextQUDId: contextQUDId !== undefined ? contextQUDId : '',
    utteranceRef,
    tags: tags !== undefined ? tags : [],
  };
}

/**
 * Select the optimal question from a set of candidate clarifications.
 * Picks the question with the highest information gain.
 */
export function selectOptimalQuestion(
  candidates: readonly ClarificationRequest[],
): ClarificationRequest | null {
  if (candidates.length === 0) return null;

  let best: ClarificationRequest | null = null;
  let bestGain = -Infinity;

  for (const req of candidates) {
    if (req.informationGain.gain > bestGain) {
      bestGain = req.informationGain.gain;
      best = req;
    }
  }

  return best;
}

/**
 * Format a clarification request for display in the UI.
 */
export function formatClarificationForUI(request: ClarificationRequest): string {
  const lines: string[] = [];
  lines.push(request.questionText);

  if (request.options.length > 0) {
    for (let i = 0; i < request.options.length; i++) {
      const opt = request.options[i];
      if (opt !== undefined) {
        const marker = opt.optionId === request.defaultOptionId ? ' (default)' : '';
        lines.push(`  ${String(i + 1)}. ${opt.label}${marker}`);
        if (opt.description.length > 0) {
          lines.push(`     ${opt.description}`);
        }
      }
    }
  }

  const priorityLabel = request.priority === 'critical'
    ? '[CRITICAL]'
    : request.priority === 'important'
      ? '[IMPORTANT]'
      : '[MINOR]';
  lines.push(`Priority: ${priorityLabel}`);

  return lines.join('\n');
}

/**
 * Batch related clarifications into a single compound question.
 */
export function batchClarifications(
  requests: readonly ClarificationRequest[],
): ClarificationBatch {
  if (requests.length === 0) {
    return {
      batchId: generateBatchId(),
      requests: [],
      combinedQuestionText: '',
      totalGain: 0,
      priority: 'minor',
    };
  }

  // Determine highest priority
  let highestPriority: ClarificationPriority = 'minor';
  let totalGain = 0;

  for (const req of requests) {
    totalGain += req.informationGain.gain;
    if (req.priority === 'critical') {
      highestPriority = 'critical';
    } else if (req.priority === 'important' && highestPriority !== 'critical') {
      highestPriority = 'important';
    }
  }

  // Combine question texts
  const questionParts: string[] = [];
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    if (req !== undefined) {
      questionParts.push(`${String(i + 1)}. ${req.questionText}`);
    }
  }
  const combinedQuestionText = questionParts.join('\n');

  return {
    batchId: generateBatchId(),
    requests,
    combinedQuestionText,
    totalGain,
    priority: highestPriority,
  };
}

/**
 * Prioritize clarifications: critical first, then important, then minor.
 * Within same priority, sort by information gain descending.
 */
export function prioritizeClarifications(
  requests: readonly ClarificationRequest[],
): readonly ClarificationRequest[] {
  const priorityOrder: Record<ClarificationPriority, number> = {
    critical: 0,
    important: 1,
    minor: 2,
  };

  const sorted = [...requests];
  sorted.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return b.informationGain.gain - a.informationGain.gain;
  });

  return sorted;
}

/**
 * Check whether a clarification is critical (blocks execution).
 */
export function isCriticalClarification(request: ClarificationRequest): boolean {
  return request.priority === 'critical';
}

/**
 * Get the default resolution (first option) for a clarification.
 */
export function getDefaultResolution(
  request: ClarificationRequest,
): ClarificationOption | null {
  if (request.options.length === 0) return null;

  for (const opt of request.options) {
    if (opt.optionId === request.defaultOptionId) {
      return opt;
    }
  }

  const first = request.options[0];
  return first !== undefined ? first : null;
}

/**
 * Apply a user's answer to a clarification request.
 */
export function applyClarificationAnswer(
  request: ClarificationRequest,
  selectedOptionId: string,
  freeText: string,
  turnNumber: number,
): ClarificationAnswer {
  const optionExists = request.options.some((o) => o.optionId === selectedOptionId);

  return {
    requestId: request.requestId,
    selectedOptionId: optionExists ? selectedOptionId : '',
    freeText,
    turnNumber,
    resolved: optionExists || freeText.length > 0,
  };
}

/**
 * Estimate how many candidates a clarification would eliminate.
 */
export function estimateCandidateReduction(
  request: ClarificationRequest,
): number {
  return request.informationGain.candidateReduction;
}

/**
 * Generate a follow-up clarification if the initial answer is insufficient.
 */
export function generateFollowUpClarification(
  original: ClarificationRequest,
  answer: ClarificationAnswer,
  remainingOptions: readonly ClarificationOption[],
  utteranceRef: string,
): FollowUpClarification | null {
  if (answer.resolved && remainingOptions.length <= 1) {
    return null;
  }

  if (remainingOptions.length === 0) {
    return null;
  }

  const followUpRequest = generateClarification(
    'clar-what-specifically',
    remainingOptions,
    utteranceRef,
    original.contextQUDId,
    ['follow-up', original.requestId],
  );

  return {
    originalRequestId: original.requestId,
    followUp: followUpRequest,
    reason: answer.resolved
      ? 'Answer resolved but further specification needed for remaining candidates.'
      : 'Initial answer was insufficient; rephrasing the question.',
  };
}

/**
 * Count the number of pending (unresolved) clarification requests in a batch.
 */
export function countPendingClarifications(
  batch: ClarificationBatch,
  answers: readonly ClarificationAnswer[],
): number {
  const answeredIds = new Set<string>();
  for (const a of answers) {
    if (a.resolved) {
      answeredIds.add(a.requestId);
    }
  }

  let pending = 0;
  for (const req of batch.requests) {
    if (!answeredIds.has(req.requestId)) {
      pending++;
    }
  }
  return pending;
}


// ===================== STEP 210: ACCEPT DEFAULTS AND OVERRIDE DIALOGUE MOVES =====================

// ---- 210 Types ----

/** The type of dialogue move detected from a user utterance. */
export type DialogueMoveType =
  | 'accept'
  | 'reject'
  | 'override'
  | 'clarify'
  | 'confirm'
  | 'deny'
  | 'elaborate'
  | 'correct'
  | 'undo'
  | 'redo'
  | 'defer'
  | 'skip'
  | 'accept-all'
  | 'reject-all';

/** Detection result for a dialogue move. */
export interface MoveDetection {
  readonly moveType: DialogueMoveType;
  readonly confidence: number;
  readonly matchedPattern: string;
  readonly extractedValue: string;
  readonly utterance: string;
}

/** Effect that a dialogue move has on dialogue state. */
export interface MoveEffect {
  readonly moveType: DialogueMoveType;
  readonly effectDescription: string;
  readonly holeResolution: 'resolve-with-default' | 'resolve-with-override' | 'mark-needs-new-option' | 'undo-last' | 'redo-last' | 'defer' | 'skip' | 'no-change';
  readonly resolvedValue: string;
  readonly affectedHoleIds: readonly string[];
}

/** Configuration for the dialogue move system. */
export interface DialogueMoveConfig {
  readonly enableAcceptAll: boolean;
  readonly enableRejectAll: boolean;
  readonly requireConfirmationForDestructive: boolean;
  readonly maxMoveHistorySize: number;
}

/** A full dialogue move record. */
export interface DialogueMove {
  readonly moveId: string;
  readonly moveType: DialogueMoveType;
  readonly detection: MoveDetection;
  readonly effect: MoveEffect;
  readonly turnNumber: number;
  readonly timestamp: number;
  readonly reverted: boolean;
}

/** Summary of applied move effects. */
export interface MoveEffectSummary {
  readonly totalMoves: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly overridden: number;
  readonly undone: number;
  readonly deferred: number;
  readonly skipped: number;
  readonly lines: readonly string[];
}

/** A pattern for detecting dialogue moves. */
interface MovePattern {
  readonly patternId: string;
  readonly regex: string;
  readonly moveType: DialogueMoveType;
  readonly confidence: number;
  readonly extractValueGroup: number;
  readonly description: string;
}

// ---- 210 Move Patterns (40+) ----

const MOVE_PATTERNS: readonly MovePattern[] = [
  // --- Accept ---
  { patternId: 'move-yes', regex: '^(yes|yeah|yep|yup)[\\.!\\s]*$', moveType: 'accept', confidence: 0.95, extractValueGroup: 0, description: 'Affirmative: yes/yeah/yep' },
  { patternId: 'move-sure', regex: '^(sure|ok|okay|fine|alright)[\\.!\\s]*$', moveType: 'accept', confidence: 0.9, extractValueGroup: 0, description: 'Affirmative: sure/ok/fine' },
  { patternId: 'move-do-it', regex: '^(do\\s+it|go\\s+ahead|go\\s+for\\s+it|proceed)[\\.!\\s]*$', moveType: 'accept', confidence: 0.95, extractValueGroup: 0, description: 'Directive accept: do it/go ahead' },
  { patternId: 'move-sounds-good', regex: '^(sounds\\s+good|looks\\s+good|that\\s+works|perfect|great)[\\.!\\s]*$', moveType: 'accept', confidence: 0.9, extractValueGroup: 0, description: 'Positive feedback accept' },
  { patternId: 'move-exactly', regex: '^(exactly|precisely|correct|right)[\\.!\\s]*$', moveType: 'accept', confidence: 0.9, extractValueGroup: 0, description: 'Confirmatory accept' },
  { patternId: 'move-thats-right', regex: "^(that'?s\\s+right|that'?s\\s+correct|that'?s\\s+it)[.!\\s]*$", moveType: 'accept', confidence: 0.9, extractValueGroup: 0, description: 'Confirmatory: that\'s right' },
  { patternId: 'move-please', regex: '^(please|yes\\s+please)[.!\\s]*$', moveType: 'accept', confidence: 0.85, extractValueGroup: 0, description: 'Polite accept' },
  // --- Reject ---
  { patternId: 'move-no', regex: '^(no|nah|nope|nuh-uh)[\\.!\\s]*$', moveType: 'reject', confidence: 0.95, extractValueGroup: 0, description: 'Negative: no/nah/nope' },
  { patternId: 'move-not-that', regex: '^(not\\s+that|not\\s+this|not\\s+quite)[.!\\s]*$', moveType: 'reject', confidence: 0.9, extractValueGroup: 0, description: 'Rejection: not that' },
  { patternId: 'move-dont-want', regex: "\\b(don'?t\\s+want|don'?t\\s+like|don'?t\\s+do)\\b", moveType: 'reject', confidence: 0.85, extractValueGroup: 0, description: 'Rejection: don\'t want' },
  { patternId: 'move-wrong', regex: '^(wrong|incorrect|that\'?s\\s+wrong)[.!\\s]*$', moveType: 'reject', confidence: 0.9, extractValueGroup: 0, description: 'Rejection: wrong' },
  { patternId: 'move-never-mind', regex: '^(never\\s*mind|forget\\s+it|scratch\\s+that)[.!\\s]*$', moveType: 'reject', confidence: 0.85, extractValueGroup: 0, description: 'Rejection: never mind' },
  // --- Override ---
  { patternId: 'move-i-meant', regex: '\\bi\\s+meant?\\s+(.+)', moveType: 'override', confidence: 0.95, extractValueGroup: 1, description: 'Override: I meant X' },
  { patternId: 'move-no-i-meant', regex: '\\bno,?\\s+(.+)', moveType: 'override', confidence: 0.8, extractValueGroup: 1, description: 'Override: no, X' },
  { patternId: 'move-actually', regex: '\\bactually,?\\s+(.+)', moveType: 'override', confidence: 0.85, extractValueGroup: 1, description: 'Override: actually, X' },
  { patternId: 'move-instead', regex: '\\binstead,?\\s+(.+)', moveType: 'override', confidence: 0.85, extractValueGroup: 1, description: 'Override: instead, X' },
  { patternId: 'move-rather', regex: '\\brather,?\\s+(.+)', moveType: 'override', confidence: 0.8, extractValueGroup: 1, description: 'Override: rather X' },
  { patternId: 'move-no-by-x-i-mean', regex: '\\bno,?\\s+by\\s+\\w+\\s+i\\s+mean\\s+(.+)', moveType: 'override', confidence: 0.95, extractValueGroup: 1, description: 'Override: no, by X I mean Y' },
  { patternId: 'move-what-i-want', regex: '\\bwhat\\s+i\\s+(want|need|meant?)\\s+(is\\s+)?(.+)', moveType: 'override', confidence: 0.9, extractValueGroup: 3, description: 'Override: what I want is X' },
  { patternId: 'move-i-was-thinking', regex: '\\bi\\s+was\\s+thinking\\s+(more\\s+)?(of\\s+|about\\s+)?(.+)', moveType: 'override', confidence: 0.8, extractValueGroup: 3, description: 'Override: I was thinking X' },
  // --- Clarify ---
  { patternId: 'move-what-about', regex: '\\bwhat\\s+about\\s+(.+)', moveType: 'clarify', confidence: 0.85, extractValueGroup: 1, description: 'Clarification request: what about X' },
  { patternId: 'move-and-what', regex: '\\b(and|but)\\s+what\\s+(about|if)\\s+(.+)', moveType: 'clarify', confidence: 0.8, extractValueGroup: 3, description: 'Clarification: and/but what about X' },
  { patternId: 'move-how-about', regex: '\\bhow\\s+about\\s+(.+)', moveType: 'clarify', confidence: 0.85, extractValueGroup: 1, description: 'Clarification/suggestion: how about X' },
  { patternId: 'move-what-do-you-mean', regex: '\\bwhat\\s+do\\s+you\\s+mean\\b', moveType: 'clarify', confidence: 0.9, extractValueGroup: 0, description: 'Clarification: what do you mean' },
  { patternId: 'move-can-you-explain', regex: '\\bcan\\s+you\\s+(explain|elaborate|clarify)\\b', moveType: 'clarify', confidence: 0.9, extractValueGroup: 0, description: 'Clarification: can you explain' },
  // --- Confirm / Deny ---
  { patternId: 'move-confirm-thats-what', regex: "\\b(that'?s\\s+what\\s+i\\s+(want|said|meant?))[.!\\s]*$", moveType: 'confirm', confidence: 0.9, extractValueGroup: 0, description: 'Confirm: that\'s what I want' },
  { patternId: 'move-deny-not-what', regex: "\\b(that'?s\\s+not\\s+what\\s+i\\s+(want|said|meant?))", moveType: 'deny', confidence: 0.9, extractValueGroup: 0, description: 'Deny: that\'s not what I want' },
  // --- Elaborate ---
  { patternId: 'move-and-also', regex: '\\b(and\\s+also|plus|additionally)\\s+(.+)', moveType: 'elaborate', confidence: 0.8, extractValueGroup: 2, description: 'Elaborate: and also X' },
  { patternId: 'move-more-specifically', regex: '\\b(more\\s+specifically|in\\s+particular|to\\s+be\\s+specific)\\s*,?\\s*(.+)', moveType: 'elaborate', confidence: 0.85, extractValueGroup: 2, description: 'Elaborate: more specifically X' },
  // --- Correct ---
  { patternId: 'move-sorry-i-meant', regex: '\\b(sorry|oops),?\\s+(i\\s+meant?\\s+)?(.+)', moveType: 'correct', confidence: 0.85, extractValueGroup: 3, description: 'Correction: sorry, I meant X' },
  { patternId: 'move-wait-no', regex: '\\b(wait|hold\\s+on),?\\s+(no\\s*,?\\s*)?(.+)', moveType: 'correct', confidence: 0.8, extractValueGroup: 3, description: 'Correction: wait, no, X' },
  // --- Undo / Redo ---
  { patternId: 'move-undo', regex: '\\b(undo|undo\\s+that|take\\s+that\\s+back)\\b', moveType: 'undo', confidence: 0.95, extractValueGroup: 0, description: 'Undo last action' },
  { patternId: 'move-redo', regex: '\\b(redo|redo\\s+that|put\\s+it\\s+back)\\b', moveType: 'redo', confidence: 0.95, extractValueGroup: 0, description: 'Redo last undone action' },
  { patternId: 'move-go-back', regex: '\\bgo\\s+back\\b', moveType: 'undo', confidence: 0.7, extractValueGroup: 0, description: 'Undo via "go back"' },
  // --- Defer / Skip ---
  { patternId: 'move-later', regex: "\\b(later|not\\s+now|i'?ll\\s+decide\\s+later|come\\s+back\\s+to\\s+(it|that))\\b", moveType: 'defer', confidence: 0.85, extractValueGroup: 0, description: 'Defer: later / not now' },
  { patternId: 'move-skip', regex: '\\b(skip|skip\\s+that|next|move\\s+on)\\b', moveType: 'skip', confidence: 0.85, extractValueGroup: 0, description: 'Skip: skip / next / move on' },
  // --- Accept-all / Reject-all ---
  { patternId: 'move-accept-all', regex: '\\b(accept\\s+all|yes\\s+to\\s+all|all\\s+good|all\\s+defaults)[.!\\s]*$', moveType: 'accept-all', confidence: 0.9, extractValueGroup: 0, description: 'Accept all defaults' },
  { patternId: 'move-reject-all', regex: '\\b(reject\\s+all|no\\s+to\\s+all|none\\s+of\\s+(those|them|these))[.!\\s]*$', moveType: 'reject-all', confidence: 0.9, extractValueGroup: 0, description: 'Reject all options' },
  { patternId: 'move-start-over', regex: '\\b(start\\s+over|from\\s+scratch|begin\\s+again)\\b', moveType: 'reject-all', confidence: 0.8, extractValueGroup: 0, description: 'Reject all: start over' },
  { patternId: 'move-just-do-defaults', regex: '\\b(just\\s+(use|do)\\s+(the\\s+)?defaults?)\\b', moveType: 'accept-all', confidence: 0.9, extractValueGroup: 0, description: 'Accept defaults explicitly' },
] as const;

// ---- 210 Move ID generation ----

let _moveIdCounter = 0;
function generateMoveId(): string {
  _moveIdCounter++;
  return `move-${String(_moveIdCounter)}`;
}

// ---- 210 Move History ----

const _moveHistory: DialogueMove[] = [];

// ---- 210 Functions ----

/**
 * Detect the dialogue move type from a user utterance.
 * Returns the best-matching move detection, or null if none found.
 */
export function detectDialogueMove(utterance: string): MoveDetection | null {
  const lower = lowercaseTrim(utterance);
  let bestMatch: MoveDetection | null = null;
  let bestConfidence = 0;

  for (const pat of MOVE_PATTERNS) {
    try {
      const re = new RegExp(pat.regex, 'i');
      const m = re.exec(lower);
      if (m !== null) {
        let extractedValue = '';
        if (pat.extractValueGroup > 0 && pat.extractValueGroup < m.length) {
          const group = m[pat.extractValueGroup];
          if (group !== undefined) {
            extractedValue = group.trim();
          }
        }

        if (pat.confidence > bestConfidence) {
          bestConfidence = pat.confidence;
          bestMatch = {
            moveType: pat.moveType,
            confidence: pat.confidence,
            matchedPattern: pat.patternId,
            extractedValue,
            utterance,
          };
        }
      }
    } catch {
      // skip broken pattern
    }
  }

  return bestMatch;
}

/**
 * Compute the effect of a dialogue move on dialogue state.
 */
export function applyMoveEffect(
  detection: MoveDetection,
  currentHoleIds: readonly string[],
): MoveEffect {
  const effectMap: Record<DialogueMoveType, { holeResolution: MoveEffect['holeResolution']; desc: string }> = {
    'accept': { holeResolution: 'resolve-with-default', desc: 'Accept default value for pending hole.' },
    'reject': { holeResolution: 'mark-needs-new-option', desc: 'Reject current option; needs new proposal.' },
    'override': { holeResolution: 'resolve-with-override', desc: 'Override hole with user-specified value.' },
    'clarify': { holeResolution: 'no-change', desc: 'Clarification requested; no hole resolution yet.' },
    'confirm': { holeResolution: 'resolve-with-default', desc: 'Confirm current value (same as accept).' },
    'deny': { holeResolution: 'mark-needs-new-option', desc: 'Deny current interpretation; needs revision.' },
    'elaborate': { holeResolution: 'resolve-with-override', desc: 'Elaborate with additional specification.' },
    'correct': { holeResolution: 'resolve-with-override', desc: 'Correct previous value with new one.' },
    'undo': { holeResolution: 'undo-last', desc: 'Undo the last applied move.' },
    'redo': { holeResolution: 'redo-last', desc: 'Redo the last undone move.' },
    'defer': { holeResolution: 'defer', desc: 'Defer resolution to later.' },
    'skip': { holeResolution: 'skip', desc: 'Skip this hole entirely.' },
    'accept-all': { holeResolution: 'resolve-with-default', desc: 'Accept defaults for all pending holes.' },
    'reject-all': { holeResolution: 'mark-needs-new-option', desc: 'Reject all current proposals.' },
  };

  const info = effectMap[detection.moveType];
  const affectedHoles = detection.moveType === 'accept-all' || detection.moveType === 'reject-all'
    ? currentHoleIds
    : currentHoleIds.length > 0
      ? [currentHoleIds[currentHoleIds.length - 1]].filter((h): h is string => h !== undefined)
      : [];

  return {
    moveType: detection.moveType,
    effectDescription: info.desc,
    holeResolution: info.holeResolution,
    resolvedValue: detection.extractedValue,
    affectedHoleIds: affectedHoles,
  };
}

/**
 * Check if a detection is an accept move.
 */
export function isAcceptMove(detection: MoveDetection): boolean {
  return detection.moveType === 'accept' || detection.moveType === 'accept-all' || detection.moveType === 'confirm';
}

/**
 * Check if a detection is a reject move.
 */
export function isRejectMove(detection: MoveDetection): boolean {
  return detection.moveType === 'reject' || detection.moveType === 'reject-all' || detection.moveType === 'deny';
}

/**
 * Check if a detection is an override move.
 */
export function isOverrideMove(detection: MoveDetection): boolean {
  return detection.moveType === 'override' || detection.moveType === 'correct' || detection.moveType === 'elaborate';
}

/**
 * Check if a detection is a clarify move.
 */
export function isClarifyMove(detection: MoveDetection): boolean {
  return detection.moveType === 'clarify';
}

/**
 * Extract the override value from an override-type move.
 */
export function extractOverrideValue(detection: MoveDetection): string {
  if (isOverrideMove(detection)) {
    return detection.extractedValue;
  }
  return '';
}

/**
 * Resolve a hole given a dialogue move.
 * Returns a description of how the hole was resolved.
 */
export function resolveHoleWithMove(
  holeId: string,
  defaultValue: string,
  detection: MoveDetection,
): { readonly holeId: string; readonly resolvedValue: string; readonly resolution: string } {
  if (isAcceptMove(detection)) {
    return {
      holeId,
      resolvedValue: defaultValue,
      resolution: `Hole "${holeId}" resolved with default value: "${defaultValue}"`,
    };
  }

  if (isOverrideMove(detection)) {
    const overrideVal = extractOverrideValue(detection);
    const val = overrideVal.length > 0 ? overrideVal : defaultValue;
    return {
      holeId,
      resolvedValue: val,
      resolution: `Hole "${holeId}" overridden with: "${val}"`,
    };
  }

  if (isRejectMove(detection)) {
    return {
      holeId,
      resolvedValue: '',
      resolution: `Hole "${holeId}" rejected; awaiting new proposal.`,
    };
  }

  if (detection.moveType === 'undo') {
    return {
      holeId,
      resolvedValue: '',
      resolution: `Hole "${holeId}" undone; reverting to unresolved state.`,
    };
  }

  if (detection.moveType === 'defer') {
    return {
      holeId,
      resolvedValue: '',
      resolution: `Hole "${holeId}" deferred to later.`,
    };
  }

  if (detection.moveType === 'skip') {
    return {
      holeId,
      resolvedValue: '',
      resolution: `Hole "${holeId}" skipped.`,
    };
  }

  return {
    holeId,
    resolvedValue: defaultValue,
    resolution: `Hole "${holeId}" resolved with default (unhandled move type: ${detection.moveType}).`,
  };
}

/**
 * Process multiple dialogue moves in batch.
 */
export function batchProcessMoves(
  utterances: readonly string[],
  currentHoleIds: readonly string[],
): readonly DialogueMove[] {
  const results: DialogueMove[] = [];
  const now = Date.now();

  for (let i = 0; i < utterances.length; i++) {
    const utt = utterances[i];
    if (utt === undefined) continue;

    const detection = detectDialogueMove(utt);
    if (detection === null) continue;

    const effect = applyMoveEffect(detection, currentHoleIds);
    const move: DialogueMove = {
      moveId: generateMoveId(),
      moveType: detection.moveType,
      detection,
      effect,
      turnNumber: i,
      timestamp: now + i,
      reverted: false,
    };

    results.push(move);
    _moveHistory.push(move);
  }

  return results;
}

/**
 * Format a move detection for debugging/display.
 */
export function formatMoveDetection(detection: MoveDetection): string {
  const lines: string[] = [];
  lines.push(`Move Detection:`);
  lines.push(`  Type: ${detection.moveType}`);
  lines.push(`  Confidence: ${String(detection.confidence)}`);
  lines.push(`  Pattern: ${detection.matchedPattern}`);
  lines.push(`  Utterance: "${detection.utterance}"`);
  if (detection.extractedValue.length > 0) {
    lines.push(`  Extracted value: "${detection.extractedValue}"`);
  }
  return lines.join('\n');
}

/**
 * Get the priority of a dialogue move type.
 * Override and reject are higher priority because they change or block state.
 */
export function getMovePriority(moveType: DialogueMoveType): number {
  const priorities: Record<DialogueMoveType, number> = {
    'override': 10,
    'correct': 10,
    'reject': 9,
    'reject-all': 9,
    'deny': 8,
    'undo': 8,
    'accept': 5,
    'accept-all': 5,
    'confirm': 5,
    'redo': 5,
    'elaborate': 4,
    'clarify': 3,
    'defer': 2,
    'skip': 1,
  };
  return priorities[moveType];
}

/**
 * Undo the last move in the move history.
 * Returns the reverted move, or null if nothing to undo.
 */
export function undoLastMove(): DialogueMove | null {
  for (let i = _moveHistory.length - 1; i >= 0; i--) {
    const move = _moveHistory[i];
    if (move !== undefined && !move.reverted) {
      const revertedMove: DialogueMove = {
        moveId: move.moveId,
        moveType: move.moveType,
        detection: move.detection,
        effect: move.effect,
        turnNumber: move.turnNumber,
        timestamp: move.timestamp,
        reverted: true,
      };
      _moveHistory[i] = revertedMove;
      return revertedMove;
    }
  }
  return null;
}

/**
 * Get the full move history.
 */
export function getMoveHistory(): readonly DialogueMove[] {
  return [..._moveHistory];
}

/**
 * Summarize the effects of all moves in the history.
 */
export function summarizeMoveEffects(): MoveEffectSummary {
  let accepted = 0;
  let rejected = 0;
  let overridden = 0;
  let undone = 0;
  let deferred = 0;
  let skipped = 0;
  const lines: string[] = [];

  for (const move of _moveHistory) {
    if (move.reverted) {
      undone++;
      lines.push(`[REVERTED] ${move.moveId}: ${move.moveType} — ${move.effect.effectDescription}`);
      continue;
    }

    switch (move.moveType) {
      case 'accept':
      case 'accept-all':
      case 'confirm':
        accepted++;
        break;
      case 'reject':
      case 'reject-all':
      case 'deny':
        rejected++;
        break;
      case 'override':
      case 'correct':
      case 'elaborate':
        overridden++;
        break;
      case 'undo':
        undone++;
        break;
      case 'defer':
        deferred++;
        break;
      case 'skip':
        skipped++;
        break;
      case 'clarify':
      case 'redo':
        break;
    }

    lines.push(`${move.moveId}: ${move.moveType} — ${move.effect.effectDescription}`);
  }

  lines.push('---');
  lines.push(
    `Summary: ${String(accepted)} accepted, ${String(rejected)} rejected, ` +
    `${String(overridden)} overridden, ${String(undone)} undone, ` +
    `${String(deferred)} deferred, ${String(skipped)} skipped`,
  );

  return {
    totalMoves: _moveHistory.length,
    accepted,
    rejected,
    overridden,
    undone,
    deferred,
    skipped,
    lines,
  };
}
