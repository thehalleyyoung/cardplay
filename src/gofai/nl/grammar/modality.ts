/**
 * GOFAI NL Grammar — Modality and Permission
 *
 * Implements grammar rules for modal expressions that produce soft
 * constraints, conditional plans, or alternative proposals. Modal
 * expressions signal the user's certainty level, willingness to
 * accept alternatives, and whether the request is firm or tentative.
 *
 * ## Modal Categories
 *
 * 1. **Epistemic modals**: "maybe", "possibly", "probably"
 *    — User is uncertain about the desired outcome
 * 2. **Deontic modals**: "should", "must", "need to"
 *    — User expresses obligation or requirement
 * 3. **Dynamic modals**: "can", "could", "able to"
 *    — User asks about capability or permission
 * 4. **Tentative hedges**: "try", "attempt", "see if"
 *    — User wants to explore without committing
 * 5. **Conditional modals**: "if possible", "if it works", "when feasible"
 *    — User wants action only if preconditions hold
 * 6. **Preferential modals**: "I'd prefer", "ideally", "if I could"
 *    — User expresses preference rather than demand
 * 7. **Concessive modals**: "even if", "despite", "regardless"
 *    — User wants action even if side effects occur
 * 8. **Approximation modals**: "kind of", "sort of", "somewhat"
 *    — User wants a partial or approximate change
 * 9. **Suggestion modals**: "how about", "what about", "what if"
 *    — User proposes an option for consideration
 * 10. **Permission modals**: "let me", "allow", "enable"
 *     — User requests access to a capability
 *
 * ## Output
 *
 * Modal expressions produce `ModalQualifier` structures that:
 * - Convert hard constraints to soft constraints
 * - Generate alternative plans for comparison
 * - Lower or raise confidence in the plan
 * - Trigger "what if" / counterfactual exploration mode
 *
 * ## Safety
 *
 * Tentative language ("try", "maybe") should make the system MORE
 * conservative (preview before applying), not less. The user is
 * uncertain, so the system should help them explore safely.
 *
 * @module gofai/nl/grammar/modality
 * @see gofai_goalA.md Step 118
 * @see gofai_goalA.md Step 212 (modal subordination)
 * @see gofai_goalA.md Step 227 (politeness/hedging)
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// MODAL QUALIFIER — output of modality parsing
// =============================================================================

/**
 * A modal qualifier: modifies the force/commitment of a command.
 *
 * Modal qualifiers adjust how the planner treats the request:
 * - Hard: "must", "always" → hard constraint, fail if unsatisfied
 * - Soft: "try", "if possible" → soft constraint, propose alternatives
 * - Exploratory: "what if", "maybe" → generate preview, don't apply
 * - Preference: "ideally", "I'd prefer" → rank candidates by desirability
 */
export interface ModalQualifier {
  /** Unique ID for tracking */
  readonly qualifierId: string;

  /** The modal category */
  readonly category: ModalCategory;

  /** The modal force (how binding this is) */
  readonly force: ModalForce;

  /** The effect on plan execution */
  readonly planEffect: ModalPlanEffect;

  /** Whether this modal makes execution conditional */
  readonly conditional: boolean;

  /** The condition (if conditional): what must hold for execution */
  readonly condition: string | undefined;

  /** Whether this modal triggers preview/exploration mode */
  readonly exploratoryMode: boolean;

  /** How this modal affects constraint hardness */
  readonly constraintEffect: ConstraintSoftening;

  /** Surface text */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Confidence in the parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly ModalWarning[];
}

// =============================================================================
// MODAL TYPES
// =============================================================================

/**
 * Categories of modal expressions.
 */
export type ModalCategory =
  | 'epistemic'       // Uncertainty about outcome: "maybe", "probably"
  | 'deontic'         // Obligation/requirement: "should", "must"
  | 'dynamic'         // Capability/permission: "can", "could"
  | 'tentative'       // Exploratory: "try", "attempt"
  | 'conditional'     // Conditional: "if possible", "if it works"
  | 'preferential'    // Preference: "ideally", "I'd prefer"
  | 'concessive'      // Despite: "even if", "regardless"
  | 'approximation'   // Partial: "kind of", "sort of"
  | 'suggestion'      // Proposal: "what about", "how about"
  | 'permission';     // Access: "let me", "allow"

/**
 * The force of a modal (how binding it is).
 */
export type ModalForce =
  | 'necessity'       // Must happen: "must", "need to", "have to"
  | 'strong'          // Should happen: "should", "ought to"
  | 'neutral'         // No force preference: "can", statement form
  | 'weak'            // Prefer but don't require: "ideally", "prefer"
  | 'tentative'       // Exploring: "try", "maybe", "if possible"
  | 'counterfactual'; // Hypothetical: "what if", "what would happen"

/**
 * How a modal affects plan execution.
 */
export type ModalPlanEffect =
  | 'execute'         // Normal execution (with modal constraints)
  | 'preview_first'   // Show preview before execution
  | 'explore_only'    // Generate plans without executing
  | 'conditional'     // Execute only if condition holds
  | 'best_effort'     // Try to satisfy; degrade gracefully
  | 'compare';        // Generate alternatives for comparison

/**
 * How a modal affects constraint hardness.
 */
export type ConstraintSoftening =
  | 'no_change'       // Keep constraints as-is
  | 'soften_all'      // Convert all hard constraints to soft
  | 'soften_goals'    // Soften only goal constraints
  | 'soften_scope'    // Allow scope to expand if needed
  | 'weaken_degrees'  // Reduce degree/amount constraints
  | 'add_fallback';   // Add fallback plan if primary fails

// =============================================================================
// MODAL WARNINGS
// =============================================================================

/**
 * Warning about a modality parse.
 */
export interface ModalWarning {
  readonly code: ModalWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes for modality parsing.
 */
export type ModalWarningCode =
  | 'modal_scope_ambiguity'    // Modal could scope over different parts
  | 'double_modal'             // Two modals stacked: "could maybe try"
  | 'necessity_conflict'       // "must" conflicts with "if possible"
  | 'tentative_destructive'    // Tentative modal on destructive action
  | 'vague_condition'          // Condition is underspecified
  | 'modal_negation_scope'     // "can't" — negation+modal scope unclear
  | 'suggestion_without_alt';  // Suggestion without clear alternative

// =============================================================================
// MODAL EXPRESSION LEXICON
// =============================================================================

/**
 * A modal expression entry.
 */
export interface ModalEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** Modal category */
  readonly category: ModalCategory;

  /** Default modal force */
  readonly defaultForce: ModalForce;

  /** Default plan effect */
  readonly defaultPlanEffect: ModalPlanEffect;

  /** Default constraint softening */
  readonly defaultConstraintEffect: ConstraintSoftening;

  /** Whether this modal is conditional */
  readonly conditional: boolean;

  /** Whether this triggers exploratory mode */
  readonly exploratory: boolean;

  /** Position in the sentence */
  readonly position: ModalPosition;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;

  /** Priority */
  readonly priority: number;
}

/**
 * Position of a modal in the sentence.
 */
export type ModalPosition =
  | 'prefix'          // Before the command: "try to add reverb"
  | 'suffix'          // After the command: "add reverb if possible"
  | 'infix'           // Within the command: "could you add reverb"
  | 'standalone'      // Modal as complete utterance: "maybe"
  | 'any';            // Can appear anywhere

/**
 * All recognized modal expressions.
 */
export const MODAL_ENTRIES: readonly ModalEntry[] = [
  // ---------------------------------------------------------------------------
  // Epistemic modals — uncertainty about outcome
  // ---------------------------------------------------------------------------
  {
    forms: ['maybe', 'perhaps', 'possibly'],
    category: 'epistemic',
    defaultForce: 'tentative',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ['maybe make it brighter', 'perhaps add some reverb', 'possibly remove the delay'],
    description: 'Epistemic uncertainty: user is unsure about the outcome',
    priority: 10,
  },
  {
    forms: ['probably', 'likely'],
    category: 'epistemic',
    defaultForce: 'weak',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['probably needs more reverb', 'likely too bright'],
    description: 'Epistemic likelihood: user is fairly confident',
    priority: 8,
  },
  {
    forms: ['i think', "i'm thinking", 'i believe', 'i feel like'],
    category: 'epistemic',
    defaultForce: 'weak',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_goals',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['I think it needs more bass', "I'm thinking we could add delay"],
    description: 'Epistemic hedged assertion: user opinion',
    priority: 9,
  },
  {
    forms: ["i'm not sure", "i'm not certain", 'not sure if'],
    category: 'epistemic',
    defaultForce: 'tentative',
    defaultPlanEffect: 'explore_only',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ["I'm not sure if it needs reverb", "I'm not certain about the EQ"],
    description: 'Epistemic doubt: user is explicitly uncertain',
    priority: 11,
  },

  // ---------------------------------------------------------------------------
  // Deontic modals — obligation/requirement
  // ---------------------------------------------------------------------------
  {
    forms: ['must', 'have to', 'need to', 'gotta'],
    category: 'deontic',
    defaultForce: 'necessity',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['must keep the melody', 'need to fix the timing', 'have to change the key'],
    description: 'Deontic necessity: required action',
    priority: 15,
  },
  {
    forms: ['should', 'ought to'],
    category: 'deontic',
    defaultForce: 'strong',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['should add some reverb', 'ought to be louder'],
    description: 'Deontic recommendation: strongly advisable',
    priority: 12,
  },
  {
    forms: ['had better', "better"],
    category: 'deontic',
    defaultForce: 'strong',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['better add some compression', 'had better fix that'],
    description: 'Deontic warning: advisable to avoid problems',
    priority: 11,
  },

  // ---------------------------------------------------------------------------
  // Dynamic modals — capability/permission
  // ---------------------------------------------------------------------------
  {
    forms: ['can', 'is it possible to', 'is there a way to'],
    category: 'dynamic',
    defaultForce: 'neutral',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['can you make it louder?', 'is it possible to add reverb?'],
    description: 'Dynamic capability: asking if action is possible',
    priority: 10,
  },
  {
    forms: ['could', 'would it be possible to', 'would you'],
    category: 'dynamic',
    defaultForce: 'weak',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_goals',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['could you make it brighter?', 'would you add some delay?'],
    description: 'Dynamic polite request: hedged capability question',
    priority: 10,
  },
  {
    forms: ["can't", 'cannot', "couldn't", 'unable to'],
    category: 'dynamic',
    defaultForce: 'necessity',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ["can't hear the vocals", "couldn't find the track"],
    description: 'Negative dynamic: inability or negated request',
    priority: 12,
  },

  // ---------------------------------------------------------------------------
  // Tentative modals — exploratory / non-committal
  // ---------------------------------------------------------------------------
  {
    forms: ['try', 'try to', 'try and', 'attempt to', 'attempt'],
    category: 'tentative',
    defaultForce: 'tentative',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ['try adding reverb', 'try to make it brighter', 'attempt to fix the timing'],
    description: 'Tentative: user wants to explore without committing',
    priority: 12,
  },
  {
    forms: ['see if', "let's see if", 'check if'],
    category: 'tentative',
    defaultForce: 'tentative',
    defaultPlanEffect: 'explore_only',
    defaultConstraintEffect: 'soften_all',
    conditional: true,
    exploratory: true,
    position: 'prefix',
    examples: ["see if it sounds better with reverb", "let's see if we can fix it"],
    description: 'Tentative conditional: test and evaluate',
    priority: 12,
  },
  {
    forms: ['experiment with', 'play around with', 'mess with'],
    category: 'tentative',
    defaultForce: 'tentative',
    defaultPlanEffect: 'explore_only',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ['experiment with the reverb', 'play around with the EQ'],
    description: 'Tentative exploratory: no specific goal',
    priority: 10,
  },
  {
    forms: ['test', 'test out'],
    category: 'tentative',
    defaultForce: 'tentative',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ['test the new reverb', 'test out a different delay'],
    description: 'Tentative evaluation: apply and evaluate',
    priority: 10,
  },

  // ---------------------------------------------------------------------------
  // Conditional modals — action depends on precondition
  // ---------------------------------------------------------------------------
  {
    forms: ['if possible', 'if you can', 'if feasible', 'if it works'],
    category: 'conditional',
    defaultForce: 'tentative',
    defaultPlanEffect: 'conditional',
    defaultConstraintEffect: 'add_fallback',
    conditional: true,
    exploratory: false,
    position: 'suffix',
    examples: ['add reverb if possible', 'make it brighter if you can'],
    description: 'Conditional: execute only if feasible',
    priority: 12,
  },
  {
    forms: ['when possible', 'when feasible', 'whenever possible'],
    category: 'conditional',
    defaultForce: 'weak',
    defaultPlanEffect: 'conditional',
    defaultConstraintEffect: 'add_fallback',
    conditional: true,
    exploratory: false,
    position: 'suffix',
    examples: ['reduce latency when possible'],
    description: 'Conditional temporal: execute when precondition holds',
    priority: 10,
  },
  {
    forms: ['as long as', 'provided that', 'given that'],
    category: 'conditional',
    defaultForce: 'neutral',
    defaultPlanEffect: 'conditional',
    defaultConstraintEffect: 'no_change',
    conditional: true,
    exploratory: false,
    position: 'infix',
    examples: ['boost the bass as long as it stays clean', 'add reverb provided that it fits'],
    description: 'Conditional with explicit precondition',
    priority: 14,
  },
  {
    forms: ['unless it', 'unless'],
    category: 'conditional',
    defaultForce: 'neutral',
    defaultPlanEffect: 'conditional',
    defaultConstraintEffect: 'no_change',
    conditional: true,
    exploratory: false,
    position: 'suffix',
    examples: ['add reverb unless it sounds muddy', 'boost it unless it clips'],
    description: 'Negative conditional: execute unless bad outcome',
    priority: 12,
  },

  // ---------------------------------------------------------------------------
  // Preferential modals — preference over requirement
  // ---------------------------------------------------------------------------
  {
    forms: ['ideally', 'preferably', 'if I could'],
    category: 'preferential',
    defaultForce: 'weak',
    defaultPlanEffect: 'best_effort',
    defaultConstraintEffect: 'soften_goals',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['ideally make it brighter', 'preferably without reverb'],
    description: 'Preferential: user states ideal but accepts alternatives',
    priority: 10,
  },
  {
    forms: ["i'd prefer", "i'd like", 'i would prefer', 'i would like'],
    category: 'preferential',
    defaultForce: 'weak',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_goals',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ["I'd prefer less reverb", "I'd like it warmer"],
    description: 'Preferential with personal desire',
    priority: 11,
  },
  {
    forms: ['rather', "i'd rather", 'would rather'],
    category: 'preferential',
    defaultForce: 'weak',
    defaultPlanEffect: 'compare',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ["I'd rather use delay", 'rather have it darker'],
    description: 'Preferential comparison: prefers alternative',
    priority: 11,
  },

  // ---------------------------------------------------------------------------
  // Concessive modals — despite side effects
  // ---------------------------------------------------------------------------
  {
    forms: ['even if', 'even though', 'despite', 'regardless'],
    category: 'concessive',
    defaultForce: 'strong',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'soften_scope',
    conditional: false,
    exploratory: false,
    position: 'suffix',
    examples: ['make it louder even if it clips', 'add reverb regardless of the mix'],
    description: 'Concessive: execute despite potential side effects',
    priority: 12,
  },
  {
    forms: ['no matter what', 'whatever happens', 'at any cost'],
    category: 'concessive',
    defaultForce: 'necessity',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: false,
    position: 'suffix',
    examples: ['make it loud no matter what', 'fix it whatever happens'],
    description: 'Strong concessive: override all safety concerns',
    priority: 14,
  },

  // ---------------------------------------------------------------------------
  // Approximation modals — partial / vague degree
  // ---------------------------------------------------------------------------
  {
    forms: ['kind of', 'kinda', 'sort of', 'sorta'],
    category: 'approximation',
    defaultForce: 'tentative',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'weaken_degrees',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['kind of make it brighter', 'sort of add some reverb'],
    description: 'Approximation: partial or hedged change',
    priority: 8,
  },
  {
    forms: ['somewhat', 'slightly', 'a bit', 'a little', 'a touch'],
    category: 'approximation',
    defaultForce: 'neutral',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'weaken_degrees',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['somewhat brighter', 'slightly louder', 'a bit warmer'],
    description: 'Approximation with small degree',
    priority: 10,
  },
  {
    forms: ['roughly', 'approximately', 'about', 'around'],
    category: 'approximation',
    defaultForce: 'neutral',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'weaken_degrees',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['roughly 120 bpm', 'approximately half', 'about 3 dB louder'],
    description: 'Approximation: numeric imprecision',
    priority: 9,
  },

  // ---------------------------------------------------------------------------
  // Suggestion modals — proposing for consideration
  // ---------------------------------------------------------------------------
  {
    forms: ['how about', 'what about', 'what if'],
    category: 'suggestion',
    defaultForce: 'counterfactual',
    defaultPlanEffect: 'explore_only',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ['how about adding reverb?', 'what about more bass?', 'what if we made it brighter?'],
    description: 'Suggestion: user proposes for consideration',
    priority: 12,
  },
  {
    forms: ['why not', "why don't we", "why don't you"],
    category: 'suggestion',
    defaultForce: 'weak',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_goals',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['why not add reverb?', "why don't we try delay?"],
    description: 'Rhetorical suggestion: implies recommendation',
    priority: 10,
  },
  {
    forms: ["let's try", "let's see", "let's"],
    category: 'suggestion',
    defaultForce: 'tentative',
    defaultPlanEffect: 'preview_first',
    defaultConstraintEffect: 'soften_all',
    conditional: false,
    exploratory: true,
    position: 'prefix',
    examples: ["let's try adding reverb", "let's see how it sounds"],
    description: 'Collaborative suggestion: inviting joint exploration',
    priority: 11,
  },

  // ---------------------------------------------------------------------------
  // Permission modals — requesting access
  // ---------------------------------------------------------------------------
  {
    forms: ['let me', 'allow me to', 'enable'],
    category: 'permission',
    defaultForce: 'neutral',
    defaultPlanEffect: 'execute',
    defaultConstraintEffect: 'no_change',
    conditional: false,
    exploratory: false,
    position: 'prefix',
    examples: ['let me adjust the EQ', 'allow me to change the tempo'],
    description: 'Permission: user requests access to capability',
    priority: 8,
  },
];

// =============================================================================
// MODAL LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → modal entries.
 */
const modalIndex: ReadonlyMap<string, readonly ModalEntry[]> = (() => {
  const index = new Map<string, ModalEntry[]>();
  for (const entry of MODAL_ENTRIES) {
    for (const form of entry.forms) {
      const lower = form.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(lower, [entry]);
      }
    }
  }
  for (const entries of index.values()) {
    entries.sort((a, b) => b.priority - a.priority);
  }
  return index;
})();

/**
 * Look up modal entries by surface form.
 */
export function lookupModal(form: string): readonly ModalEntry[] {
  return modalIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word/phrase is a known modal expression.
 */
export function isModal(word: string): boolean {
  return modalIndex.has(word.toLowerCase());
}

/**
 * Get all known modal forms.
 */
export function getAllModalForms(): readonly string[] {
  return Array.from(modalIndex.keys());
}

/**
 * Check if a word could start a multi-word modal expression.
 */
export function couldStartModal(word: string): boolean {
  const lower = word.toLowerCase();
  const starters = new Set([
    'maybe', 'perhaps', 'possibly', 'probably', 'likely',
    'i', "i'm", "i'd",
    'must', 'should', 'could', 'would', 'can', "can't", 'cannot', "couldn't",
    'have', 'had', 'need', 'gotta', 'better', 'ought',
    'try', 'see', 'check', 'test', 'experiment', 'play', 'mess', 'attempt',
    'if', 'when', 'unless', 'as', 'provided', 'given',
    'ideally', 'preferably', 'rather',
    'even', 'despite', 'regardless', 'no',
    'kind', 'kinda', 'sort', 'sorta', 'somewhat', 'slightly', 'roughly',
    'approximately', 'about', 'around',
    'how', 'what', 'why', "let's", 'let', "why",
    'allow', 'enable',
    'not',
  ]);
  return starters.has(lower) || modalIndex.has(lower);
}

// =============================================================================
// MODAL SCANNING — finding modals in token sequences
// =============================================================================

/**
 * Result of scanning for modal expressions.
 */
export interface ModalScan {
  /** Detected modal expressions */
  readonly modals: readonly DetectedModal[];

  /** Whether any modals were found */
  readonly hasModals: boolean;

  /** The overall modal force (weakest modal wins) */
  readonly overallForce: ModalForce;

  /** Whether exploratory mode is triggered */
  readonly exploratoryMode: boolean;
}

/**
 * A detected modal expression in the input.
 */
export interface DetectedModal {
  /** Token index where the modal starts */
  readonly startTokenIndex: number;

  /** Token index where the modal ends (exclusive) */
  readonly endTokenIndex: number;

  /** The matched modal entry */
  readonly entry: ModalEntry;

  /** The surface text */
  readonly surface: string;

  /** Confidence in the match */
  readonly confidence: number;

  /** Position in the sentence (prefix/suffix/infix) */
  readonly detectedPosition: ModalPosition;
}

/**
 * Scan a lowercased word sequence for modal expressions.
 */
export function scanForModals(words: readonly string[]): ModalScan {
  const modals: DetectedModal[] = [];

  for (let i = 0; i < words.length; i++) {
    // Skip words already consumed
    if (modals.some(m => i >= m.startTokenIndex && i < m.endTokenIndex)) {
      continue;
    }

    // Try multi-word modals first (longer matches first)
    let matched = false;
    for (let len = Math.min(6, words.length - i); len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();
      const entries = lookupModal(candidate);

      if (entries.length > 0) {
        const entry = entries[0]!;

        // Determine position
        let detectedPosition: ModalPosition = 'infix';
        if (i === 0) detectedPosition = 'prefix';
        else if (i + len >= words.length) detectedPosition = 'suffix';

        modals.push({
          startTokenIndex: i,
          endTokenIndex: i + len,
          entry,
          surface: candidate,
          confidence: entry.priority >= 12 ? 0.85 : 0.7,
          detectedPosition,
        });

        matched = true;
        break;
      }
    }

    if (matched) continue;
  }

  // Compute overall force (weakest wins — most cautious)
  let overallForce: ModalForce = 'neutral';
  if (modals.length > 0) {
    const forceOrder: ModalForce[] = [
      'counterfactual', 'tentative', 'weak', 'neutral', 'strong', 'necessity',
    ];
    let weakest = forceOrder.length - 1;
    for (const m of modals) {
      const idx = forceOrder.indexOf(m.entry.defaultForce);
      if (idx < weakest) weakest = idx;
    }
    overallForce = forceOrder[weakest]!;
  }

  // Check if exploratory mode is triggered
  const exploratoryMode = modals.some(m => m.entry.exploratory);

  return {
    modals,
    hasModals: modals.length > 0,
    overallForce,
    exploratoryMode,
  };
}

// =============================================================================
// MODAL QUALIFIER BUILDER
// =============================================================================

let modalIdCounter = 0;

/**
 * Reset the modal ID counter (for testing).
 */
export function resetModalIdCounter(): void {
  modalIdCounter = 0;
}

/**
 * Build a ModalQualifier from a DetectedModal.
 */
export function buildModalQualifier(
  detected: DetectedModal,
  inputSpan: Span,
): ModalQualifier {
  const qualifierId = `modal-${++modalIdCounter}`;
  const entry = detected.entry;
  const warnings: ModalWarning[] = [];

  // Warn about tentative+destructive
  if (entry.category === 'tentative') {
    warnings.push({
      code: 'tentative_destructive',
      message: `"${detected.surface}" suggests exploration — preview before executing`,
      span: inputSpan,
    });
  }

  return {
    qualifierId,
    category: entry.category,
    force: entry.defaultForce,
    planEffect: entry.defaultPlanEffect,
    conditional: entry.conditional,
    condition: entry.conditional ? `Precondition from "${detected.surface}"` : undefined,
    exploratoryMode: entry.exploratory,
    constraintEffect: entry.defaultConstraintEffect,
    surface: detected.surface,
    span: inputSpan,
    confidence: detected.confidence,
    warnings,
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a ModalQualifier for display.
 */
export function formatModalQualifier(qual: ModalQualifier): string {
  const lines: string[] = [];
  lines.push(`[${qual.qualifierId}] ${qual.category}: "${qual.surface}"`);
  lines.push(`  Force: ${qual.force}`);
  lines.push(`  Plan effect: ${qual.planEffect}`);
  lines.push(`  Constraint effect: ${qual.constraintEffect}`);
  lines.push(`  Conditional: ${qual.conditional}`);
  if (qual.condition) {
    lines.push(`  Condition: ${qual.condition}`);
  }
  lines.push(`  Exploratory: ${qual.exploratoryMode}`);
  lines.push(`  Confidence: ${(qual.confidence * 100).toFixed(0)}%`);
  for (const w of qual.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Format a ModalScan for display.
 */
export function formatModalScan(scan: ModalScan): string {
  if (!scan.hasModals) return 'No modal expressions detected.';

  const lines: string[] = [];
  lines.push(`Modals found: ${scan.modals.length}`);
  lines.push(`Overall force: ${scan.overallForce}`);
  lines.push(`Exploratory mode: ${scan.exploratoryMode}`);
  lines.push('');

  for (const m of scan.modals) {
    lines.push(`  [${m.startTokenIndex}-${m.endTokenIndex}] ` +
      `${m.entry.category}: "${m.surface}" (${m.detectedPosition})`);
    lines.push(`    Force: ${m.entry.defaultForce}`);
    lines.push(`    Confidence: ${(m.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format a modal entry for display.
 */
export function formatModalEntry(entry: ModalEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.forms.join('/')} — ${entry.category} (${entry.defaultForce})`);
  lines.push(`  Plan effect: ${entry.defaultPlanEffect}`);
  lines.push(`  Constraint effect: ${entry.defaultConstraintEffect}`);
  lines.push(`  Conditional: ${entry.conditional}`);
  lines.push(`  Exploratory: ${entry.exploratory}`);
  lines.push(`  Position: ${entry.position}`);
  lines.push(`  Examples: ${entry.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format all modal entries by category.
 */
export function formatAllModalEntries(): string {
  const sections: string[] = [];
  const categories = [...new Set(MODAL_ENTRIES.map(e => e.category))];

  for (const cat of categories) {
    const entries = MODAL_ENTRIES.filter(e => e.category === cat);
    sections.push(`\n=== ${cat.toUpperCase()} ===`);
    for (const entry of entries) {
      sections.push(`  ${entry.forms.join('/')} (${entry.defaultForce}, priority: ${entry.priority})`);
    }
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the modality grammar.
 */
export function getModalityStats(): ModalityStats {
  const categoryCounts = new Map<ModalCategory, number>();
  let totalForms = 0;

  for (const entry of MODAL_ENTRIES) {
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1);
    totalForms += entry.forms.length;
  }

  return {
    totalEntries: MODAL_ENTRIES.length,
    totalForms,
    categoryCounts: Object.fromEntries(categoryCounts) as Record<ModalCategory, number>,
  };
}

/**
 * Statistics about the modality grammar.
 */
export interface ModalityStats {
  readonly totalEntries: number;
  readonly totalForms: number;
  readonly categoryCounts: Record<string, number>;
}

// =============================================================================
// GRAMMAR RULES
// =============================================================================

/**
 * Generate grammar rules for modal expressions.
 */
export function generateModalGrammarRules(): readonly ModalGrammarRule[] {
  const rules: ModalGrammarRule[] = [];

  rules.push({
    id: 'modal-001',
    lhs: 'ModalCommand',
    rhsDescription: 'ModalPrefix Command',
    producesCategory: 'epistemic',
    priority: 12,
    semanticAction: 'sem:modal:prefix',
    examples: ['maybe add reverb', 'probably needs more bass'],
  });

  rules.push({
    id: 'modal-002',
    lhs: 'ModalCommand',
    rhsDescription: 'Command ModalSuffix',
    producesCategory: 'conditional',
    priority: 12,
    semanticAction: 'sem:modal:suffix',
    examples: ['add reverb if possible', 'make it louder if you can'],
  });

  rules.push({
    id: 'modal-003',
    lhs: 'ModalCommand',
    rhsDescription: 'TentativePrefix Command',
    producesCategory: 'tentative',
    priority: 14,
    semanticAction: 'sem:modal:tentative',
    examples: ['try adding reverb', 'see if it works'],
  });

  rules.push({
    id: 'modal-004',
    lhs: 'ModalCommand',
    rhsDescription: 'SuggestionPrefix Command',
    producesCategory: 'suggestion',
    priority: 12,
    semanticAction: 'sem:modal:suggestion',
    examples: ['how about adding reverb?', 'what if we made it brighter?'],
  });

  rules.push({
    id: 'modal-005',
    lhs: 'ModalCommand',
    rhsDescription: 'DeonticPrefix Command',
    producesCategory: 'deontic',
    priority: 15,
    semanticAction: 'sem:modal:deontic',
    examples: ['must keep the melody', 'should add reverb'],
  });

  rules.push({
    id: 'modal-006',
    lhs: 'ModalCommand',
    rhsDescription: 'Command ConcessiveSuffix',
    producesCategory: 'concessive',
    priority: 12,
    semanticAction: 'sem:modal:concessive',
    examples: ['make it louder even if it clips', 'add reverb regardless'],
  });

  rules.push({
    id: 'modal-007',
    lhs: 'ModalCommand',
    rhsDescription: 'ApproximationPrefix Command',
    producesCategory: 'approximation',
    priority: 8,
    semanticAction: 'sem:modal:approximation',
    examples: ['kind of make it brighter', 'somewhat louder'],
  });

  rules.push({
    id: 'modal-008',
    lhs: 'ModalCommand',
    rhsDescription: 'PreferentialPrefix Command',
    producesCategory: 'preferential',
    priority: 10,
    semanticAction: 'sem:modal:preferential',
    examples: ["I'd prefer less reverb", "ideally make it warmer"],
  });

  rules.push({
    id: 'modal-009',
    lhs: 'ModalCommand',
    rhsDescription: 'Command ConditionalClause',
    producesCategory: 'conditional',
    priority: 14,
    semanticAction: 'sem:modal:conditional_clause',
    examples: ['boost bass as long as it stays clean', 'add reverb unless it clips'],
  });

  return rules;
}

/**
 * A grammar rule for modal expressions.
 */
export interface ModalGrammarRule {
  readonly id: string;
  readonly lhs: string;
  readonly rhsDescription: string;
  readonly producesCategory: ModalCategory;
  readonly priority: number;
  readonly semanticAction: string;
  readonly examples: readonly string[];
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const MODALITY_GRAMMAR_RULES = [
  'Rule MOD-001: Epistemic modals ("maybe", "perhaps") lower confidence and ' +
  'trigger preview mode. The system should show candidates rather than executing.',

  'Rule MOD-002: Deontic modals ("must", "should") raise the force of the ' +
  'request. "must" makes constraints hard; "should" keeps them firm but soft.',

  'Rule MOD-003: Tentative modals ("try", "see if") put the system in ' +
  'exploratory mode. All actions produce previews first.',

  'Rule MOD-004: Conditional modals ("if possible", "unless") make execution ' +
  'contingent on a precondition. The system must evaluate the condition.',

  'Rule MOD-005: Approximation modals ("kind of", "sort of", "somewhat") weaken ' +
  'degree parameters. "kind of brighter" means less brightness than "brighter".',

  'Rule MOD-006: Suggestion modals ("what if", "how about") produce alternative ' +
  'plans for comparison. They never execute directly.',

  'Rule MOD-007: Concessive modals ("even if", "regardless") override safety ' +
  'warnings. The system should still show the warnings but proceed.',

  'Rule MOD-008: When multiple modals stack ("could maybe try"), the weakest ' +
  'force wins. This is the safest interpretation.',

  'Rule MOD-009: Preferential modals ("ideally", "I\'d prefer") generate soft ' +
  'constraints that guide plan ranking but do not block execution.',

  'Rule MOD-010: Permission modals ("let me", "allow") request capability access. ' +
  'They are treated as commands if the capability is available.',

  'Rule MOD-011: Tentative language should make the system MORE conservative, ' +
  'not less. Users exploring should see previews and alternatives.',

  'Rule MOD-012: All modal qualifiers are recorded in the CPL provenance graph ' +
  'so the user can understand why the system behaved cautiously or firmly.',
] as const;
