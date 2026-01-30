/**
 * GOFAI NL HCI — Error Recovery UX Specification
 *
 * Defines the user experience for error recovery when parsing fails.
 * The user can edit the utterance, accept suggested rephrasings, or
 * choose from interpreted candidates.
 *
 * ## Error Recovery Strategies
 *
 * 1. **Edit**: User edits the utterance inline (highlight unknown tokens).
 * 2. **Rephrase**: System suggests rephrased versions.
 * 3. **Partial accept**: Accept the partial parse and fill in the rest.
 * 4. **Candidate selection**: Choose from multiple interpretations.
 * 5. **Escape hatch**: Fall back to structured UI (menu/dialog).
 *
 * @module gofai/nl/hci/error-recovery-ux
 * @see gofai_goalA.md Step 147
 */

// =============================================================================
// ERROR TYPES — What went wrong
// =============================================================================

/**
 * Category of parse error from a UX perspective.
 */
export type ErrorCategory =
  | 'unknown_word'       // Token not in vocabulary
  | 'syntax_error'       // Grammar rule not matched
  | 'incomplete_input'   // Input trails off mid-phrase
  | 'no_verb'            // No action verb detected
  | 'too_complex'        // Parse timed out or exploded
  | 'conflicting_args'   // Contradictory arguments
  | 'unknown_entity'     // Referenced entity not found
  | 'unknown_unit';      // Unit not recognized

/**
 * Error context for the recovery UX.
 */
export interface ErrorRecoveryContext {
  readonly errorCategory: ErrorCategory;
  readonly errorSpan: ErrorSpan;
  readonly originalInput: string;
  readonly partialParse: PartialParseResult | null;
  readonly suggestedRephrases: readonly SuggestedRephrase[];
  readonly candidateInterpretations: readonly CandidateInterpretation[];
  readonly escapeOptions: readonly EscapeOption[];
}

/**
 * Where the error occurred in the input.
 */
export interface ErrorSpan {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly highlightType: ErrorHighlight;
}

export type ErrorHighlight =
  | 'underline_red'      // Unknown / error
  | 'underline_yellow'   // Warning / suggestion
  | 'strikethrough'      // Will be removed
  | 'dotted_blue';       // Needs completion

/**
 * What the parser was able to understand partially.
 */
export interface PartialParseResult {
  readonly understood: string;           // What was understood
  readonly missingParts: readonly string[];  // What's missing (e.g., "a target entity")
  readonly confidenceInPartial: number;  // 0–1
}

// =============================================================================
// RECOVERY STRATEGIES
// =============================================================================

/**
 * A suggested rephrase of the errored input.
 */
export interface SuggestedRephrase {
  readonly id: string;
  readonly rephraseText: string;
  readonly confidence: number;           // 0–1
  readonly changeDescription: string;    // What was changed
  readonly editDistance: number;          // Levenshtein distance from original
  readonly source: RephraseSource;
}

export type RephraseSource =
  | 'spell_correction'     // Typo fix
  | 'vocabulary_match'     // Close vocabulary match
  | 'grammar_suggestion'   // Grammar-guided suggestion
  | 'compound_split'       // Split compound word
  | 'abbreviation_expand'  // Expand abbreviation
  | 'slang_normalize';     // Normalize slang/jargon

/**
 * A candidate interpretation when multiple partial matches exist.
 */
export interface CandidateInterpretation {
  readonly id: string;
  readonly interpretedAs: string;        // How the system interpreted it
  readonly actionDescription: string;    // What it would do
  readonly confidence: number;
  readonly riskLevel: 'safe' | 'moderate' | 'risky';
  readonly missingInfo: readonly string[]; // What's still unclear
}

/**
 * An escape option — fall back to non-NL UI.
 */
export interface EscapeOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly action: EscapeAction;
}

export type EscapeAction =
  | 'open_command_palette'   // Open structured command palette
  | 'open_menu'              // Open the relevant menu
  | 'open_manual'            // Open documentation
  | 'start_tutorial'         // Launch interactive tutorial
  | 'ask_ai'                 // Route to AI assistant
  | 'dismiss';               // Just dismiss the error

// =============================================================================
// ERROR RECOVERY DISPLAY — How errors are shown
// =============================================================================

/**
 * Visual layout for the error recovery display.
 */
export interface ErrorRecoveryLayout {
  /** Show error inline below the input. Default: true. */
  readonly inlineError: boolean;
  /** Highlight the errored span in the input. Default: true. */
  readonly highlightSpan: boolean;
  /** Show suggestion chips. Default: true. */
  readonly showSuggestionChips: boolean;
  /** Maximum suggestion chips to show. Default: 3. */
  readonly maxSuggestionChips: number;
  /** Show "Did you mean...?" prompt. Default: true. */
  readonly showDidYouMean: boolean;
  /** Show partial parse explanation. Default: true. */
  readonly showPartialExplanation: boolean;
  /** Show escape options. Default: true. */
  readonly showEscapeOptions: boolean;
  /** Animation for error appearance. Default: 'slide_down'. */
  readonly entryAnimation: 'slide_down' | 'fade_in' | 'none';
  /** Auto-dismiss after timeout (0 = never). Default: 0. */
  readonly autoDismissMs: number;
}

/**
 * Default error recovery layout.
 */
export const DEFAULT_ERROR_RECOVERY_LAYOUT: ErrorRecoveryLayout = {
  inlineError: true,
  highlightSpan: true,
  showSuggestionChips: true,
  maxSuggestionChips: 3,
  showDidYouMean: true,
  showPartialExplanation: true,
  showEscapeOptions: true,
  entryAnimation: 'slide_down',
  autoDismissMs: 0,
};

// =============================================================================
// ERROR MESSAGE TEMPLATES
// =============================================================================

/**
 * Error message template for each error category.
 */
export interface ErrorMessageTemplate {
  readonly category: ErrorCategory;
  readonly headline: string;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly icon: string;
}

/**
 * Error message templates for all error categories.
 */
export const ERROR_MESSAGE_TEMPLATES: readonly ErrorMessageTemplate[] = [
  {
    category: 'unknown_word',
    headline: 'Unknown word: "{word}"',
    explanation: 'This word isn\'t in the music editing vocabulary.',
    suggestedAction: 'Try a different word, or check the spelling.',
    icon: 'question_mark',
  },
  {
    category: 'syntax_error',
    headline: 'Couldn\'t understand the structure',
    explanation: 'The grammar of this sentence wasn\'t recognized.',
    suggestedAction: 'Try rephrasing as: verb + target + modifier.',
    icon: 'error_circle',
  },
  {
    category: 'incomplete_input',
    headline: 'Incomplete command',
    explanation: 'This looks like the start of a command. What should it apply to?',
    suggestedAction: 'Keep typing to complete the command.',
    icon: 'partial_check',
  },
  {
    category: 'no_verb',
    headline: 'No action detected',
    explanation: 'Commands need an action word (e.g., "make", "add", "set").',
    suggestedAction: 'Start with what you want to do.',
    icon: 'warning_triangle',
  },
  {
    category: 'too_complex',
    headline: 'Command is too complex',
    explanation: 'This sentence has too many clauses or nested structures.',
    suggestedAction: 'Try breaking it into simpler commands.',
    icon: 'warning_triangle',
  },
  {
    category: 'conflicting_args',
    headline: 'Conflicting instructions',
    explanation: 'Part of this command contradicts another part.',
    suggestedAction: 'Clarify which instruction takes priority.',
    icon: 'error_circle',
  },
  {
    category: 'unknown_entity',
    headline: 'Entity not found: "{entity}"',
    explanation: 'There\'s no track, effect, or element called "{entity}" in your project.',
    suggestedAction: 'Check the track name or use "the" + description.',
    icon: 'question_mark',
  },
  {
    category: 'unknown_unit',
    headline: 'Unknown unit: "{unit}"',
    explanation: 'This unit of measurement isn\'t recognized.',
    suggestedAction: 'Try: dB, Hz, kHz, ms, BPM, semitones, cents, %.',
    icon: 'question_mark',
  },
];

/**
 * Get the error message template for a category.
 */
export function getErrorTemplate(category: ErrorCategory): ErrorMessageTemplate {
  return ERROR_MESSAGE_TEMPLATES.find(t => t.category === category)
    ?? ERROR_MESSAGE_TEMPLATES[0]!;
}

/**
 * Format an error message with context.
 */
export function formatErrorMessage(
  template: ErrorMessageTemplate,
  context: Partial<Record<string, string>>,
): { headline: string; explanation: string; suggestedAction: string } {
  const replace = (s: string): string => {
    let result = s;
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }
    return result;
  };

  return {
    headline: replace(template.headline),
    explanation: replace(template.explanation),
    suggestedAction: replace(template.suggestedAction),
  };
}

// =============================================================================
// RECOVERY FLOW STATE MACHINE
// =============================================================================

/**
 * State machine for error recovery flow.
 */
export type RecoveryState =
  | 'showing_error'
  | 'showing_suggestions'
  | 'editing_input'
  | 'selecting_candidate'
  | 'accepting_rephrase'
  | 'using_escape'
  | 'recovered'
  | 'dismissed';

export interface RecoveryTransition {
  readonly from: RecoveryState;
  readonly event: RecoveryEvent;
  readonly to: RecoveryState;
  readonly description: string;
}

export type RecoveryEvent =
  | 'show_suggestions'
  | 'start_editing'
  | 'select_candidate'
  | 'accept_rephrase'
  | 'use_escape'
  | 'submit_edit'
  | 'dismiss'
  | 'back';

/**
 * Recovery flow transitions.
 */
export const RECOVERY_TRANSITIONS: readonly RecoveryTransition[] = [
  { from: 'showing_error', event: 'show_suggestions', to: 'showing_suggestions', description: 'Show alternative suggestions.' },
  { from: 'showing_error', event: 'start_editing', to: 'editing_input', description: 'User clicks to edit input.' },
  { from: 'showing_error', event: 'use_escape', to: 'using_escape', description: 'User chooses escape option.' },
  { from: 'showing_error', event: 'dismiss', to: 'dismissed', description: 'User dismisses error.' },

  { from: 'showing_suggestions', event: 'accept_rephrase', to: 'accepting_rephrase', description: 'User accepts a suggested rephrase.' },
  { from: 'showing_suggestions', event: 'select_candidate', to: 'selecting_candidate', description: 'User selects an interpretation.' },
  { from: 'showing_suggestions', event: 'start_editing', to: 'editing_input', description: 'User edits instead.' },
  { from: 'showing_suggestions', event: 'back', to: 'showing_error', description: 'Go back to error display.' },

  { from: 'editing_input', event: 'submit_edit', to: 'recovered', description: 'User submits edited input.' },
  { from: 'editing_input', event: 'back', to: 'showing_error', description: 'Cancel edit.' },

  { from: 'selecting_candidate', event: 'submit_edit', to: 'recovered', description: 'Accept selected candidate.' },
  { from: 'selecting_candidate', event: 'back', to: 'showing_suggestions', description: 'Go back to suggestions.' },

  { from: 'accepting_rephrase', event: 'submit_edit', to: 'recovered', description: 'Accept rephrase and execute.' },
  { from: 'accepting_rephrase', event: 'start_editing', to: 'editing_input', description: 'Edit the rephrase further.' },

  { from: 'using_escape', event: 'dismiss', to: 'dismissed', description: 'Escape action completed.' },
  { from: 'using_escape', event: 'back', to: 'showing_error', description: 'Return to error.' },
];

// =============================================================================
// FULL ERROR RECOVERY SPEC
// =============================================================================

/**
 * Complete error recovery UX specification.
 */
export interface ErrorRecoverySpec {
  readonly layout: ErrorRecoveryLayout;
  readonly messageTemplates: readonly ErrorMessageTemplate[];
  readonly transitions: readonly RecoveryTransition[];
  readonly version: string;
}

/**
 * The default error recovery spec.
 */
export const DEFAULT_ERROR_RECOVERY_SPEC: ErrorRecoverySpec = {
  layout: DEFAULT_ERROR_RECOVERY_LAYOUT,
  messageTemplates: ERROR_MESSAGE_TEMPLATES,
  transitions: RECOVERY_TRANSITIONS,
  version: '1.0.0',
};

// =============================================================================
// STATISTICS
// =============================================================================

export function getErrorRecoveryStats(): {
  readonly errorCategoryCount: number;
  readonly templateCount: number;
  readonly transitionCount: number;
  readonly escapeActionCount: number;
  readonly rephraseSourceCount: number;
} {
  return {
    errorCategoryCount: 8,
    templateCount: ERROR_MESSAGE_TEMPLATES.length,
    transitionCount: RECOVERY_TRANSITIONS.length,
    escapeActionCount: 6,
    rephraseSourceCount: 6,
  };
}
